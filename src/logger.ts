import * as path from "path";
import { merge } from "lodash";
import * as winston from "winston";

export interface LoggerConfig {
	logPath?: string;
	console?:  boolean|string|winston.ConsoleTransportOptions;
	debug?:    boolean|string|winston.FileTransportOptions;
	info?:     boolean|string|winston.FileTransportOptions;
	warn?:     boolean|string|winston.FileTransportOptions;
	error?:    boolean|string|winston.FileTransportOptions;
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
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
	logPath: `${process && process.cwd && process.cwd() || "."}`,
	console: DEFAULT_CONSOLE_TRANSPORT,
	error: DEFAULT_FILE_TRANSPORT,
	info: merge(DEFAULT_FILE_TRANSPORT, {humanReadableUnhandledException: true}),
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
	readonly config: LoggerConfig;

	/**
	 * Creates a new Logger instance identified by `name` using `config`.
	 */
	constructor(public name: string|symbol, config: LoggerConfig = {}) {
		if (name in Logger._loggers) throw new Error(`logger with name "${name}" already exists`);

		// Merge with default config.
		this.config = config = merge(DEFAULT_LOGGER_CONFIG, config);

		// Set up transports based on config.
		let transports: winston.TransportInstance[] = [];
		for (let key in config) {
			let conf = config[key];
			if (conf === false) continue;

			// Add console transport.
			if (key = "console") {
				transports.push(new winston.transports.Console(conf));
			}

			// Add file transports.
			if (["debug", "error", "info", "warn"].includes(key)) {
				if (!conf.name) conf.name = key;
				if (!conf.level) conf.level = conf.name;
				if (!conf.filename) conf.filename = path.join(config.logPath, `${conf.name}.log`);

				transports.push(new winston.transports.File(conf));
			}
		}

		// Set up the Winston instance.
		this.winston = new winston.Logger({
			transports: transports,
			exitOnError: false,
			handleExceptions: true
		});
	}

	/**
	 * Returns Logger instance identified by `name`, creating if it doesn't exist.
	 */
	static get(name: string|symbol = DEFAULT_LOGGER) : Logger {
		if (!Logger._loggers[name]) { Logger._loggers[name] = new Logger(name); }
		return Logger._loggers[name];
	}

	/**
	 * Alias to the Winston instance's `.log` method.
	 */
	log(level: string, msg: string, ...args: any[]) : Logger { return this.winston.log(level, msg, ...args) && this; }
	debug(msg: string, ...args) : Logger { return this.winston.debug(msg, ...args) && this; }
	error(msg: string, ...args) : Logger { return this.winston.debug(msg, ...args) && this; }
	info(msg: string, ...args) : Logger { return this.winston.info(msg, ...args) && this; }
	warn(msg: string, ...args) : Logger { return this.winston.warn(msg, ...args) && this; }
}
