import * as path from "path";
import { merge } from "lodash";
import * as winston from "winston";

export interface LoggerOptions {
	logPath?: string;
	exitOnError?: boolean;
	handleExceptions?: boolean;
	transports?: winston.TransportInstance[];

	console?: boolean|string|winston.ConsoleTransportOptions;
	debug?:   boolean|string|winston.FileTransportOptions;
	info?:    boolean|string|winston.FileTransportOptions;
	warn?:    boolean|string|winston.FileTransportOptions;
	error?:   boolean|string|winston.FileTransportOptions;
}

/**
 * The name of the default logger to be used, when no name is provided.
 */
export const DEFAULT_LOGGER: symbol = Symbol("default");

/**
 * The default configuration used for console transports.
 */
export const DEFAULT_CONSOLE_TRANSPORT: winston.ConsoleTransportOptions = {
	level: process.env.NODE_ENV === "development" ? "debug" : "verbose",
	json: false,
	colorize: true
};

/**
 * The default configuration used for file transports.
 */
export const DEFAULT_FILE_TRANSPORT: winston.FileTransportOptions = {
	json: true,
	maxsize: 20 * 1024 * 1024, // 20Mb
	maxFiles: 100,
	colorize: false
};

/**
 * The default configuration used for a new Logger instance.
 */
export const DEFAULT_LOGGER_CONFIG: LoggerOptions = {
	logPath: `${process && process.cwd && process.cwd() || "."}/logs`,
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
	 * List of previously created loggers.
	 */
	private static _loggers: { [name: string]: Logger } = {};

	/**
	 * The Winston instance belonging to the Logger instance.
	 */
	readonly winston: winston.LoggerInstance;

	/**
	 * The Logger configuration, as read-only, used for current instance.
	 */
	readonly config: LoggerOptions;

	/**
	 * Creates a new Logger instance identified by `name` using `config`.
	 */
	constructor(public name: string|symbol = DEFAULT_LOGGER, config: LoggerOptions = {}) {
		// Make sure a logger with given `name` doesn't exist already.
		if (name in Logger._loggers) throw new Error(`logger with name "${name.toString()}" already exists`);

		// Convert symbol names to strings, and remove the `Symbol()` wrapping.
		if (typeof name === "symbol") {
			let matches = name.toString().match(/^Symbol\((.*)\)$/);
			name = matches && matches[1].toString() || "";
		}

		// Merge with default config.
		config = merge({}, DEFAULT_LOGGER_CONFIG, config);

		// Remap root level transports to the `transports` property on config.
		let transports: winston.TransportInstance[] = config.transports || [];
		for (let key in config) {
			let conf = config[key];

			// Configure transports.
			switch (key) {
				// Console transport.
				case "console":
					// Push to transports, ensuring it's not `false`.
					if (conf !== false) transports.push(new winston.transports.Console(conf));
					break;

				// File transports.
				case "debug":
				case "error":
				case "info":
				case "warn":
					// Break if transport is explicitly set to `false`.
					if (conf === false) break;

					// Assume `name` equals `key` if no `name` is provided.
					if (!conf.name) conf.name = key;

					// Assume `level` equals `name` if no `level` is provided.
					if (!conf.level) conf.level = conf.name;

					// Create a `filename` if none is provided.
					let filename = `${name}-${conf.name}.log`;
					if (!conf.filename) conf.filename = path.join(config.logPath, filename);

					// Push to transports.
					transports.push(new winston.transports.File(conf));
					break;

				// In case it's not a transport.
				default:
					// Continue loop, since not a transport.
					continue;
			}

			// Delete the transport from the config.
			delete config[key];
		}

		// Make config accessible on instance.
		this.config = config;

		// Set up the Winston instance.
		this.winston = new winston.Logger(config);

		// Add instance to list of loggers.
		Logger._loggers[this.name] = this;
	}

	/**
	 * Returns Logger instance identified by `name`, creating if it doesn't exist.
	 */
	static get(name: string|symbol = DEFAULT_LOGGER) : Logger {
		if (!Logger._loggers[name]) { Logger._loggers[name] = new Logger(name); }
		return Logger._loggers[name];
	}

	// Alias -> `winston.log`
	log(level: string, msg: string, ...args: any[]) : Logger { return this.winston.log(level, msg, ...args) && this; }

	// Alias -> `winston.debug`
	debug(msg: string, ...args) : Logger { return this.winston.debug(msg, ...args) && this; }

	// Alias -> `winston.error`
	error(msg: string, ...args) : Logger { return this.winston.debug(msg, ...args) && this; }

	// Alias -> `winston.info`
	info(msg: string, ...args) : Logger { return this.winston.info(msg, ...args) && this; }

	// Alias -> `winston.warn`
	warn(msg: string, ...args) : Logger { return this.winston.warn(msg, ...args) && this; }
}
