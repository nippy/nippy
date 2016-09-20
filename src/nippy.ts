import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import { camelcase, merge } from "lodash";
import * as morgan from "morgan";

import { getLogger } from "./logger";

const KNOWN_MIDDLEWARE = {
	bodyParser: bodyParser.json,
	compression: compression,
	cors: cors,
	helmet: helmet,
	morgan: morgan
};

const DEFAULT_CONFIG: NippyConfig = {
	bodyParser: null,
	compression: null,
	cors: null,
	helmet: null,
	morgan: [
		process && process.env.NODE_ENV === "development" ? "dev" : "combined",
		{ stream: { write: (msg) => getLogger("access").log("info", msg.replace(/(.*)\s$/, "$1")) } }
	]
};

export interface NippyConfig {
	[middleware: string]: any;
}

export function nippy(config: NippyConfig) : express.Application {
	const app = express();
	const logger = "";

	// Temporary config has in order to map camel case.
	let _config = {};
	for (let key in config) {
		_config[camelcase(key)] = config[key];
	}

	// Merge provided config with defaults.
	config = merge(DEFAULT_CONFIG, _config);

	// Apply middleware in config.
	for (let mw in config) {
		if (!KNOWN_MIDDLEWARE[mw]) continue;
		if (config[mw] === false) continue;

		if (!config[mw]) config[mw] = [];

		app.use(KNOWN_MIDDLEWARE[mw](...config[mw]));
	}

	return app;
}

export default nippy;