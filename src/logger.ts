import * as winston from "winston";

let loggers = {};

export function getLogger(name: string) : winston.LoggerInstance {
	if (!loggers[name]) {
		loggers[name] = createLogger(name);
	}

	return loggers[name];
}

export function createLogger(name: string = "main") : winston.LoggerInstance {
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
			new winston.transports.Console({
				level: process.env.NODE_ENV === "development" ? "debug" : "verbose",
				json: false,
				colorize: true
			})
		],
		exitOnError: false,
		handleExceptions: true
	});
}