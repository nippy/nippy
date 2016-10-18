import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import { camelCase, merge } from "lodash";
import * as morgan from "morgan";
import * as winston from "winston";

import { Logger, LoggerConfig } from "./logger";

const KNOWN_MIDDLEWARE = {
	bodyParser: bodyParser.json,
	compression: compression,
	cors: cors,
	helmet: helmet,
	morgan: morgan
};

export interface NippyConfig {
	logger?: null | LoggerConfig;

	// bodyParser: boolean|"json"|"raw"|"text"|"urlencoded";
	// TODO: Support other body parsers?

	[middleware: string]: any;
}

const DEFAULT_NIPPY_CONFIG: NippyConfig = {
	logger: null,
	bodyParser: null,
	compression: null,
	cors: null,
	helmet: null,
	morgan: [
		process && process.env.NODE_ENV === "development" ? "dev" : "combined",
		{ stream: { write: (msg) => Logger.get("access").info(msg.replace(/(.*)\s$/, "$1")) } }
	]
};

export function nippy(config: NippyConfig) : express.Application {
	const app = express();

	// Temporary config in order to map camel case.
	let _config = {};
	for (let key in config) {
		_config[camelCase(key)] = config[key];
	}

	// Merge provided config with defaults.
	config = merge(DEFAULT_NIPPY_CONFIG, _config);

	// Yank out logger config.
	let loggerConfig = config.logger;
	delete config.logger;

	// Apply middleware in config.
	for (let mw in config) {
		// Do not process if middleware config is false.
		if (config[mw] === false) continue;

		// Do not process if middleware is unknown.
		if (!KNOWN_MIDDLEWARE[mw]) continue;

		// Cast to array, so it can be spread as parameteres.
		if (!(config[mw] instanceof Array)) config[mw] = [config[mw]];

		// Use given middleware with
		app.use(KNOWN_MIDDLEWARE[mw](...config[mw]));
	}

	return app;
}

export default nippy;
