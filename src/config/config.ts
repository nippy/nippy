import * as path from "path";
import { merge } from "lodash";

// import { Logger } from "@nippy/logger";

// TODO: Find a better way to define default values for environment variables.
// /**
//  * Interface for defining envorinment options.
//  *
//  * @interface
//  */
// export interface ConfigEnvOptions {
// 	default?: any;
// 	map: string;
// }

/**
 * Interface for defining mapping environment variables to configuration.
 *
 * @interface
 */
export interface ConfigEnvMapping {
	[ENV: string]: string;
}

/**
 * Interface defining options for an `Config` instance.
 *
 * @interface
 */
export interface ConfigOptions {
	path?: string;
	load_default?: boolean;
	load_env?: boolean;
	env_mapping?: boolean|ConfigEnvMapping;
}

/**
 * Interface for storing configuration instances, identified by a `path`.
 *
 * @interface
 */
export interface ConfigsList {
	[path: string]: Config;
}

/**
 * The assumed default configuration path. Using `cwd` or `__dirname`, with
 * `/config` appended to the end.
 *
 * @constant {string}
 */
export const DEFAULT_CONFIG_PATH: string = (process && process.env && process.env.CONFIG_PATH) || path.resolve("config");

/**
 * Default value for `NODE_ENV` when none is set. Opinionated, based on the
 * possible worst case being that a production setup is running on a development
 * machine, and not the opposite being possible development config leaking into
 * a production environment.
 */
export const DEFAULT_NODE_ENV: string = "production";

/**
 * Default variables to map from environment variables.
 *
 * @constant {ConfigEnvMapping}
 */
export const DEFAULT_ENV_MAPPING: ConfigEnvMapping = {
	NODE_ENV: "env",
	PORT: "server.port"
};

/**
 * Default options to use for a new Config instance.
 *
 * @contant {ConfigOptions}
 */
export const DEFAULT_OPTIONS: ConfigOptions = {
	path: DEFAULT_CONFIG_PATH,
	load_default: true,
	load_env: true,
	env_mapping: DEFAULT_ENV_MAPPING
};

/**
 * Class representing a set of configurations.
 */
export class Config {
	/**
	 * Variable holding the options for instance.
	 *
	 * @type {ConfigOptions}
	 */
	public readonly options: ConfigOptions;

	/**
	 * List of previously created Config instances.
	 */
	private static _configs: ConfigsList = {};

	/**
	 * Index signature for config key/values.
	 */
	[name: string]: any;

	/**
	 * Returns existing config for path, or create a new instance.
	 *
	 * @param  {string = DEFAULT_CONFIG_PATH}        path
	 *     The path to where the configuration files are stored. Defaults to
	 *     `DEFAULT_CONFIG_PATH` if none is given.
	 * @param  {undefined|ConfigOptions = undefined} options
	 *     Additional configuration options to be used for the `Config` instance.
	 * @return {Config}
	 *     Returns existing `Config` instance with given `path` or a newly created
	 *     if none was found.
	 */
	static init(path: string = DEFAULT_CONFIG_PATH, options: ConfigOptions = {}) : Config {
		if (!Config._configs[path]) Config._configs[path] = new Config(merge(options, { path: path }));
		return Config._configs[path];
	}

	/**
	 * Helper function to get value from default `Config` instance.
	 *
	 * @param  {string} key Which key to look for.
	 * @return {any}        Returns value found for `key` on default config.
	 */
	static get(key: string, fallback?: any) {
		return Config.init().get(key, fallback);
	}

	/**
	 * Creates a new configuration instance.
	 *
	 * @param  {string|ConfigOptions = {}} options
	 *     The configuration options to be used for the instance. If `undefined`
	 *     the default options and path will be used. If a `string` is given will
	 *     it be used for path to look for configuration files in. If an object is
	 *     passed will it assume a valid `ConfigOptions` instance.
	 */
	constructor(options: string|ConfigOptions = {}) {
		// Cast string options to object with path.
		if (typeof options === "string") {
			options = { path: options };
		}

		// Merge and bind options to instance property.
		this.options = merge({}, DEFAULT_OPTIONS, options);

		// Add `cwd` and `env` to config.
		if (process) {
			if (process.cwd instanceof Function) {
				this.set("cwd", process.cwd());
			}

			if (process.env && process.env.NODE_ENV) {
				this.set("env", process.env.NODE_ENV);
			} else {
				this.set("env", DEFAULT_NODE_ENV);
			}
		}

		// Try loading default config file.
		if (this.options.load_default) {
			try { this.load("default"); }
			catch (e) {}
		}

		// Try loading environment config file.
		if (this.options.load_env) {
			try { this.load(this.get("env")); }
			catch (e) {
				// TODO: Log on logger.
				// console.log(`Failed to load environment config file ${this.config_path}/${this.get("env")}.json.`);
			}
		}

		// Overwrite with mapped environment variables.
		if (this.options.env_mapping) {
			this.mapEnv();
		}
	}

	/**
	 * Loads a config JSON and merges into instance.
	 *
	 * @param {string} file The configuration file to be loaded, either as a
	 *     path relative to `options.path` or as an absolute path.
	 */
	public load(file: string) : void;
	public load(json: any) : void;
	public load(fileOrJson: string|any) : void {
		// Check if object, and if so load JSON directly.
		if (typeof fileOrJson === "object") {
			return this.loadJSON(fileOrJson);
		}

		// Check file is a string.
		if (typeof fileOrJson !== "string") {
			throw new TypeError("File passed to Config.load is not a string value.");
		}

		// Assign to file, now we know it's a string.
		let file = fileOrJson;

		// Ensure there is a base configuration path.
		if (typeof this.options.path !== "string") {
			throw new Error("No configuration path option set.");
		}

		// Use given path or fallback to default.
		file = path.isAbsolute(file) ? file : path.join(this.options.path, file);

		// Add JSON extension.
		// TODO: Support other formats.
		file = `${file}.json`;

		// Try to read the file.
		try {
			let json = require(file);
			return this.loadJSON(json);
		} catch (e) {
			// TODO: Replace with custom Error class.
			throw new Error(`Failed to load config file ${file}.`);
		}
	}

	/**
	 * Loads a JSON object directly into instance.
	 */
	public loadJSON(json: any) : void {
		for (let key in json) {
			this.set(key, json[key]);
		}
	}

	/**
	 * Maps an object `env_object`, defaulting to `process.env` into instance,
	 * using `env_mapping` map as a reference for mapping.
	 */
	public mapEnv(env_mapping: any = this.options.env_mapping, env_object: any = process.env) : void {
		// Use either provided mapping or default.
		let mapping: ConfigEnvMapping = typeof env_mapping === "object" ? env_mapping : DEFAULT_ENV_MAPPING;

		// Iterate mappings, check the environment variable exists and set it.
		for (let env in mapping) {
			let m = mapping[env];

			// Determine what key to set for value.
			let key: string;
			if (typeof m === "string") key = m;
			// else if (typeof m === "object") key = m.map;
			else continue;

			// Determine what value to use.
			let value: any = env_object[env]; // || typeof m === "object" && m.default;

			// Set default environment in case no value for `NODE_ENV`.
			if (!value && env === "NODE_ENV") value = DEFAULT_NODE_ENV;

			// Continue if no value is defined.
			if (typeof value === "undefined") continue;

			// Set value.
			this.set(key, value);
		}
	}

	/**
	 * Internal, recursive method to get values from configuration.
	 *
	 * @param  {string} key          Which key, as dot-notation, to return.
	 * @param  {any}    context=this Which context object to look for. This is
	 *     used to hierarchically find deeply nested values.
	 * @return {any}                 Returns the deep value found in context.
	 */
	private _get(key: string, context: any = this) : any {
		// Expand dot notation to nested keys.
		if (key.indexOf(".") > 0) {
			// TODO: Should this throw any errors if key is not found in current context?
			let _key = key.split(/\.(.*)$/);
			return this._get(_key[1], context[_key[0]]);
		}

		// Return value.
		return context[key];
	}

	/**
	 * Gets the config with given `key` in `context`.
	 *
	 * @param  {string} key Which key, as dot-notation, in configuration to search
	 *     for.
	 * @return {any}        Returns which ever value found for key.
	 * @throws {Error}      When a faulty value, that's not `false`, is found,
	 *     throws an exception.
	 */
	public get(key: string, fallback?: any) : any {
		// Get context.
		let ret = this._get(key);

		// Check there is a value for key.
		if (!ret && ret !== false) {
			// Return fallback if set.
			if (fallback !== undefined) return fallback;

			// Or throw error.
			// TODO: Replace with custom Error class.
			throw new Error(`no configuration for "${key}" found`);
		}

		// Return value.
		return ret;
	}

	/**
	 * Internal, recursive method to set value in configuration.
	 *
	 * @param  {string} key          The key, as dot-notation, to set value on.
	 * @param  {any}    value        The value to be set.
	 * @param  {any}    context=this Which context to set value on. This is used
	 *     to hierarchically set deep values.
	 */
	private _set(key: string, value: any, context: any = this) : void {
		// Expand dot notation to nested keys.
		if (key.indexOf(".") > 0) {
			let _key = key.split(/\.(.*)$/);
			if (!context[_key[0]]) context[_key[0]] = {};
			return this._set(_key[1], value, context[_key[0]]);
		}

		// Set the value.
		context[key] = value;
	}

	/**
	 * Sets a config `key` with `value` on `context`
	 *
	 * @param  {string} key   The key, as dot-noation, to set value on.
	 * @param  {any}    value The value to set for key.
	 * @return {this}         Returns the `Config` instance.
	 */
	public set(key: string, value: any) : this {
		// Internally set value.
		this._set(key, value);

		// Return self to make calls chainable.
		return this;
	}

	/**
	 * Returns the current configuration being used as a JSON object.
	 *
	 * @return {any}
	 */
	public toJSON() : any {
		let json: {[key: string]: any} = {};

		for (let key in this) {
			// Make sure key is own property and not a reserved keyword.
			if (this.hasOwnProperty(key) && !["options", "cwd", "env"].includes(key)) {
				json[key] = this[key];
			}
		}

		return JSON.parse(JSON.stringify(json));
	}
}

// Export Config as default.
export default Config;
