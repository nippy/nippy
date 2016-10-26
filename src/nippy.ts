import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as http from "http";
import * as express from "express";
import * as helmet from "helmet";
import { camelCase, merge } from "lodash";
import * as morgan from "morgan";
import * as winston from "winston";

import { config } from "./config";
import { Logger, LoggerOptions } from "./logger";

export interface MiddlewareList {
	[name: string]: Function;
}

export interface NippyOptions {
	logger?: null | LoggerOptions;

	// bodyParser: boolean|"json"|"raw"|"text"|"urlencoded";
	// TODO: Support other body parsers?

	[middleware: string]: any;
}

/**
 * List of known middleware that can be used with Nippy.
 *
 * @type {MiddlewareList}
 */
const KNOWN_MIDDLEWARE: MiddlewareList = {
	bodyParser: bodyParser.json,
	compression: compression,
	cors: cors,
	helmet: helmet,
	morgan: morgan
};

/**
 * The default options to be used with Nippy if none are provided, or merged.
 *
 * @type {NippyOptions}
 */
const DEFAULT_NIPPY_OPTIONS: NippyOptions = {
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

/**
 * Creates a new Express application, applying default middleware and setting up
 * logging.
 *
 * @param  {NippyOptions}        options The options used to set up nippy.
 * @return {express.Application}         Returns the application from Express.
 */
export function nippy(options: NippyOptions) : express.Application {
	// The Express application.
	const app = express();

	// Temporary options in order to map camel case.
	let _options = {};
	for (let key in options) {
		_options[camelCase(key)] = options[key];
	}

	// Merge provided options with defaults.
	options = merge(DEFAULT_NIPPY_OPTIONS, _options);

	// Yank out logger options.
	let loggerOptions = options.logger;
	delete options.logger;

	// Apply middleware in options.
	for (let mw in options) {
		// Do not process if middleware options is false.
		if (options[mw] === false) continue;

		// Do not process if middleware is unknown.
		if (!KNOWN_MIDDLEWARE[mw]) continue;

		// Cast to array, so it can be spread as parameteres.
		if (!(options[mw] instanceof Array)) options[mw] = [options[mw]];

		// Use given middleware with
		app.use(KNOWN_MIDDLEWARE[mw](...options[mw]));
	}

	// Hold a reference to Express' listen method.
	let _listen = app.listen;

	/**
	 *
 	 * Overwrite listen method to automatically use port in config if none is
 	 * provided.
 	 *
 	 * See `http.Server.listen` for parameters.
 	 *
 	 * If the first parametere is a number that is used for the port number, else
 	 * will try to fall back to `server.port` in the config, else Express default.
 	 *
	 * @param  {[any]}       ...args Arguments to pass to `express.listen`.
	 * @return {http.Server}         Returns the `Server` returned by Express.
	 */
	app.listen = function(...args) : http.Server {
		let port
			= typeof args[0] === "number"
			? args.shift()
			: config("server.port")
			;

		return _listen.apply(app, [port].concat(args));
	};

	// Return the final app.
	return app;
}

// Export `nippy` as default.
export default nippy;
