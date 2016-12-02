import * as path from "path";
import * as fs from "fs-extra";
import { merge } from "lodash";
import * as winston from "winston";

import { Nippy } from "@nippy/core";
import { Config } from "@nippy/config";

export interface LoggerOptions {
	path?: string;
	logPath?: string;
	exitOnError?: boolean;
	handleExceptions?: boolean;
	transports?: (winston.TransportInstance & {[idx: string]: any})[];

	console?: boolean | string | winston.ConsoleTransportOptions;
	debug?:   boolean | string | winston.FileTransportOptions;
	info?:    boolean | string | winston.FileTransportOptions;
	warn?:    boolean | string | winston.FileTransportOptions;
	error?:   boolean | string | winston.FileTransportOptions;

	[idx: string]: any;
}

/**
 * The default configuration used for console transports.
 * @type {winston.ConsoleTransportOptions}
 */
export const DEFAULT_CONSOLE_TRANSPORT: winston.ConsoleTransportOptions = {
	level: process.env.NODE_ENV === "development" ? "debug" : "verbose",
	json: false,
	colorize: true
};

/**
 * The default configuration used for file transports.
 * @type {winston.FileTransportOptions}
 */
export const DEFAULT_FILE_TRANSPORT: winston.FileTransportOptions = {
	json: true,
	maxsize: 20 * 1024 * 1024, // 20Mb
	maxFiles: 100,
	colorize: false
};

/**
 * The name of the default logger to be used, when no name is provided.
 * @type {symbol}
 */
export const DEFAULT_LOGGER: symbol = Symbol("default");

/**
 * The default path the logger should store log files in.
 * @type {string}
 */
export const DEFAULT_LOGGER_PATH: string
	=  Config.get("logger.logPath", null)
	|| Config.get("logger.path", null)
	|| Config.get("paths.logs", null)
	|| process.env.NODE_ENV === "development" ? "./data/logs" : "/var/log";

/**
 * The default configuration used for a new Logger instance.
 * @type {LoggerOptions}
 */
export const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
	logPath: DEFAULT_LOGGER_PATH,
	exitOnError: false,
	handleExceptions: true,
	transports: [],

	console: DEFAULT_CONSOLE_TRANSPORT,
	error: DEFAULT_FILE_TRANSPORT,
	info: merge({}, DEFAULT_FILE_TRANSPORT, {humanReadableUnhandledException: true}),
	debug: false,
	warn: false
};

/**
 * Logger class, used to handle multiple Winston instances and transports.
 */
export class Logger {
	/**
	 * The Nippy instance responsible for instantiating the Logger.
	 * @public
	 * @readonly
	 * @type {Nippy|undefined}
	 */
	public readonly nippy: Nippy | undefined;

	/**
	 * The Winston instance belonging to the Logger instance.
	 * @public
	 * @readonly
	 * @type {winston.LoggerInstance}
	 */
	public readonly winston: winston.LoggerInstance;

	/**
	 * The Logger configuration, as read-only, used for current instance.
	 * @public
	 * @readonly
	 * @type {LoggerOptions}
	 */
	public readonly options: LoggerOptions;

	/**
	 * List of previously created loggers.
	 * @private
	 */
	private static _loggers: { [name: string]: Logger } = {};

	/**
	 * Returns Logger instance identified by `name`, creating if it doesn't exist.
	 *
	 * @public
	 * @static
	 * @param  {string|symbol = DEFAULT_LOGGER} name
	 *         The name of the logger to return.
	 * @return {Logger}
	 *         Returns the existing, or newly created, Logger instance.
	 */
	public static get(name: string|symbol = DEFAULT_LOGGER) : Logger {
		if (!Logger._loggers[name]) { Logger._loggers[name] = new Logger(name); }
		return Logger._loggers[name];
	}

	/**
	 * Creates a new Logger instance identified by `name` using `options`.
	 *
	 * @constructor
	 * @param  {string|symbol = DEFAULT_LOGGER}         name
	 *         The name to use for the Logger instance.
	 * @param  {LoggerOptions = DEFAULT_LOGGER_OPTIONS} options
	 *         The options to be used for the instance.
	 * @return {void}
	 */
	constructor(
		public name: string|symbol = DEFAULT_LOGGER,
		options: LoggerOptions = DEFAULT_LOGGER_OPTIONS,
		nippy?: Nippy
	) {
		// Make sure a logger with given `name` doesn't exist already.
		if (name in Logger._loggers) {
			throw new Error(`logger with name "${name.toString()}" already exists`);
		}

		// Bind Nippy instance if provided.
		if (nippy && nippy instanceof Nippy) {
			this.nippy = nippy;
		}

		// Convert symbol names to strings, and remove the `Symbol()` wrapping.
		if (typeof name === "symbol") {
			let matches = name.toString().match(/^Symbol\((.*)\)$/);
			name = matches && matches[1].toString() || "";
		}

		// Merge with default options.
		options = merge({}, DEFAULT_LOGGER_OPTIONS, options);

		// List of errors encountered during instantiating.
		let errors: string[] = [];

		// Remap root level transports to the `transports` property on options.
		let transports: winston.TransportInstance[] = options.transports || [];
		for (let key in options) {
			let transport = options[key];

			// Configure transports.
			switch (key) {
				// Console transport.
				case "console":
					// Push to transports, ensuring it's not `false`.
					if (transport !== false) transports.push(new winston.transports.Console(transport));
					break;

				// File transports.
				case "debug":
				case "error":
				case "info":
				case "warn":
					// Break if transport is explicitly set to `false`.
					if (transport === false) break;

					// Assume `name` equals `key` if no `name` is provided.
					if (!transport.name) transport.name = key;

					// Assume `level` equals `name` if no `level` is provided.
					if (!transport.level) transport.level = transport.name;

					// Create a `filename` if none is provided.
					if (!transport.filename) {
						// Start with the name of current transport.
						let filename = `${transport.name}.log`;

						// Prepend with the Logger instance name, if not default name.
						if (this.name !== DEFAULT_LOGGER) {
							filename = `${name}-${filename}`;
						}

						// Preprend with Nippy instance name, if existing.
						if (this.nippy && this.nippy.name) {
							filename = path.join(this.nippy.name, filename);
						}

						// Join with `logPath`.
						let logPath = transport.logPath || options.logPath;
						filename = path.join(logPath, filename);

						// Set on transport.
						transport.filename = filename;
					}

					// Ensure log file is writable.
					try {
						fs.ensureFileSync(transport.filename);
						fs.accessSync(transport.filename, fs.constants.W_OK);
					} catch (e) {
						// Push error message to be processed later.
						errors.push(`Log file for transport "${transport.name}" (${transport.filename}) is not writable. This transport will NOT be added.`);

						// Continue loop, since can't use this transport.
						continue;
					}

					// Push to transports.
					transports.push(new winston.transports.File(transport));

					// Break file transports.
					break;

				// In case it's not a transport.
				default:
					// Continue loop, since not a transport.
					continue;
			}

			// Delete the transport from the options.
			delete options[key];
		}

		// Make options accessible on instance.
		this.options = options;

		// Set up the Winston instance.
		this.winston = new winston.Logger(options);

		// Add instance to list of loggers.
		Logger._loggers[this.name] = this;

		// Log any errors encountered.
		errors.forEach(e => this.error(e));
	}

	// Alias -> `winston.log`
	log(level: string, msg: string, ...args: any[]) : Logger { return this.winston.log(level, msg, ...args) && this; }

	// Alias -> `winston.debug`
	debug(msg: string, ...args: any[]) : Logger { return this.winston.debug(msg, ...args) && this; }

	// Alias -> `winston.error`
	error(msg: string, ...args: any[]) : Logger { return this.winston.error(msg, ...args) && this; }

	// Alias -> `winston.info`
	info(msg: string, ...args: any[]) : Logger { return this.winston.info(msg, ...args) && this; }

	// Alias -> `winston.warn`
	warn(msg: string, ...args: any[]) : Logger { return this.winston.warn(msg, ...args) && this; }
}

// Export Logger as default.
export default Logger;
