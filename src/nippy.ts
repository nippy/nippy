import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as http from "http";
import * as ec from "express-serve-static-core";
import * as express from "express";
import * as helmet from "helmet";
import { camelCase, merge } from "lodash";
import * as morgan from "morgan";
import * as winston from "winston";

import Config, * as _config from "./config";
import Logger, * as _logger from "./logger";

/**
 * Interface defining a list of middleware.
 *
 * @interface
 */
export interface MiddlewareList {
	[name: string]: Function;
}

/**
 * Interface defining supported options for Nippy.
 *
 * @interface
 */
export interface NippyOptions {
	logger?: undefined|_logger.LoggerOptions;

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
	logger: undefined,
	bodyParser: null,
	compression: null,
	cors: null,
	helmet: null,
	morgan: [
		process && process.env.NODE_ENV === "development" ? "dev" : "combined",
		{ stream: { write: (msg) => Logger.get("access").info(msg.replace(/(.*)\s$/, "$1")) } }
	]
};

export abstract class Application {
	name: string;
	options: NippyOptions;
	express: express.Application;
	config: Config;
	logger: Logger;

	all: ec.IRouterMatcher<this>;
	get: ec.IRouterMatcher<this>;
	post: ec.IRouterMatcher<this>;
	put: ec.IRouterMatcher<this>;
	delete: ec.IRouterMatcher<this>;
	patch: ec.IRouterMatcher<this>;
	head: ec.IRouterMatcher<this>;
	use: ec.IRouterHandler<this> & ec.IRouterMatcher<this>;
	abstract route(prefix: ec.PathParams) : ec.IRoute;
}

export class Nippy implements Application {
	public options: NippyOptions;
	public express: express.Application;
	public config: Config;
	public logger: Logger;

	constructor(public name: string, options?: NippyOptions) {
		// The Express application.
		this.express = express();

		// Temporary options in order to map camel case.
		let _options = {};

		// Map provided options to temporary hash.
		if (options) {
			for (let key in options) {
				_options[camelCase(key)] = options[key];
			}
		}

		// Add default config instance.
		this.config = Config.init();

		// Create new logger instance.
		this.logger = new Logger(_logger.DEFAULT_LOGGER, options && options.logger, this);

		// Merge provided options with defaults.
		this.options = options = merge(DEFAULT_NIPPY_OPTIONS, _options);

		// Inform about current environment.
		this.logger.log("info", `{%s} starting in environment "%s"`, this.name, this.config.get("env", "unknown"));

		// Delete `logger` from options, to avoid being handled as middleware.
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
			this.use(KNOWN_MIDDLEWARE[mw](...options[mw]));
		}
	}

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
	public listen(...args) : http.Server {
		// Yank out port number, using `server.port` from config if undefined.
		let port
			= typeof args[0] === "number"
			? args.shift()
			: this.config.get("server.port")
			;

		// Yank out callback, so it can be wrapped.
		let callback
			= typeof args[args.length - 1] === "function"
			? args.pop()
			: () => {}
			;

		// Apply arguments to `express.listen`.
		let server = this.express.listen.apply(this.express, [port].concat(args, [(...args) => {
			let a = server.address();
			this.logger.log("info", `{%s} started on "%s:%s" (%s)`, this.name, a.address, a.port, a.family);
		}]));

		// Return server.
		return server;
	}

	// engine(ext: string, fn: Function) : this { return this.express.engine(ext, fn) && this; }
	// set(setting: string, val: any) : this { return this.express.set(setting, val) && this; }
	// get(name: string) : any { return this.express.get(name); }
	// // TODO: Get better typing for param.
	// param(...args) : this { return this.express.param.apply(this.express, args) && this; }
	// path() : string { return this.express.path(); }
	// enabled(setting: string) : boolean { return this.express.enabled(setting); }
	// disabled(setting: string) : boolean { return this.express.disabled(setting); }
	// enable(setting: string) : this { return this.express.enable(setting) && this; }
	// disable(setting: string) : this { return this.express.disable(setting) && this; }
	// // TODO: Get better typing for configure.
	// configure(...args) : this { return this.express.configure.apply(this.express, args) && this; }
	// // TODO: Get better typing for render.
	// render(...args) : this { return this.express.render.apply(this.express, args) && this; }

	all(path: ec.PathParams, ...handlers)    { return this.express.all(path, ...handlers) && this; }
	get(path: ec.PathParams, ...handlers)    { return this.express.get(path, ...handlers) && this; }
	post(path: ec.PathParams, ...handlers)   { return this.express.post(path, ...handlers) && this; }
	put(path: ec.PathParams, ...handlers)    { return this.express.put(path, ...handlers) && this; }
	delete(path: ec.PathParams, ...handlers) { return this.express.delete(path, ...handlers) && this; }
	patch(path: ec.PathParams, ...handlers)  { return this.express.patch(path, ...handlers) && this; }
	head(path: ec.PathParams, ...handlers)   { return this.express.head(path, ...handlers) && this; }
	use(...handlers)                         { return this.express.use(...handlers) && this; }
	route(prefix: ec.PathParams)             { return this.express.route(prefix); }
}

/**
 * Helper function to create a new Nippy instance.
 *
 * @param  {string}       name    The name to be used for Nippy instance.
 * @param  {NippyOptions} options The options used to set up Nippy.
 * @return {Nippy}                Returns the application from Express.
 */
export function nippy(name: string, options?: NippyOptions) : Nippy {
	return new Nippy(name, options);
}

// Export `nippy` as default.
export default nippy;
