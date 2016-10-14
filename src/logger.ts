import { merge } from "lodash";
import * as winston from "winston";

const DEFAULT_CONSOLE_TRANSPORT : winston.ConsoleTransportOptions = {
	level: process.env.NODE_ENV === "development" ? "debug" : "verbose",
	json: false,
	colorize: true
};

const DEFAULT_FILE_TRANSPORT : winston.FileTransportOptions = {
	json: true,
	maxsize: 20 * 1024 * 1024, // 20Mb
	maxFiles: 100,
	colorize: false
};

export interface LoggerConfig {
	console?: boolean|string|winston.ConsoleTransportOptions,
	debug?:   boolean|string|winston.FileTransportOptions,
	info?:    boolean|string|winston.FileTransportOptions,
	warn?:    boolean|string|winston.FileTransportOptions,
	error?:   boolean|string|winston.FileTransportOptions
}

const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
	console: true,
	debug: false,
	info: true,
	warn: false,
	error: true
};

/**
 * Returns Winston instance identified by `name`, creating if it doesn't exist.
 */
let LOGGERS = {};
export function getLogger(name: string|symbol = Symbol("main")) : winston.LoggerInstance {
	if (!LOGGERS[name]) { LOGGERS[name] = createLogger(); }
	return LOGGERS[name];
}

/**
 * Creates a new Winston instance identified by `name`.
 */
export function createLogger(config: LoggerConfig = {}) : winston.LoggerInstance {
	let transports = [];

	// Merge with default config.
	config = merge(DEFAULT_LOGGER_CONFIG, config);

	for (let key in config) {

	}

	return new winston.Logger({
		transports: [
			new winston.transports.File({
				name: "info",
				level: "info",
				filename: `${("paths.logs")}/info.log`,
				humanReadableUnhandledException: true,
				json: true,
				maxsize: 20 * 1024 * 1024, // 20Mb
				maxFiles: 100,
				colorize: false
			}),
			new winston.transports.File({
				name: "error",
				level: "error",
				filename: `${("paths.logs")}/error.log`,
				json: true,
				maxsize: 20 * 1024 * 1024, // 20Mb
				maxFiles: 100,
				colorize: false
			}),
			new winston.transports.Console()
		],
		exitOnError: false,
		handleExceptions: true
	});
}
