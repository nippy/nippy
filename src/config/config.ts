import * as path from "path";
import * as fs from "fs-extra";
import { merge } from "lodash";

/**
 * The assumed default configuration path. Using `cwd` or `__dirname`, with
 * `/config` appended to the end.
 *
 * @constant {string}
 */
const DEFAULT_CONFIG_PATH: string = `${process && process.cwd() || __dirname}/config`;

/**
 * Default variables to map from environment variables.
 *
 * @constant {ConfigEnvMapping}
 */
const DEFAULT_ENV_MAPPING: ConfigEnvMapping = {
	PORT: "server.port"
};

/**
 * Default options to use for a new Config instance.
 *
 * @contant {ConfigOptions}
 */
const DEFAULT_OPTIONS: ConfigOptions = {
	load_default: true,
	load_env: true,
	env_mapping: DEFAULT_ENV_MAPPING
};

/**
 * Interface for defining mapping environment variables to configuration.
 *
 * @interface
 */
export interface ConfigEnvMapping {
	[ENV: string]: any;
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
	env_mapping?: ConfigEnvMapping|boolean;
}

/**
 * Interface for storing configuration instances, identified by a `path`.
 *
 * @interface
 */
export interface ConfigStore {
	[path: string]: Config;
}

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
	 * Creates a new configuration instance.
	 *
	 * @param  {undefined|string|ConfigOptions = undefined} options
	 *     The configuration options to be used for the instance. If `undefined`
	 *     the default options and path will be used. If a `string` is given will
	 *     it be used for path to look for configuration files in. If an object is
	 *     passed will it assume a valid `ConfigOptions` instance.
	 * @param  {undefined|ConfigOptions}                    default_options
	 *     The default configuration options used for instance. This is applied
	 *     first, making it possible to overwrite with `option`, either as a
	 *     string path or as a ConfigOptions object.
	 */
	constructor(
		options: undefined|string|ConfigOptions = undefined,
		default_options: ConfigOptions = {}
	) {
		// Merge provided options with defaults.
		let _options: ConfigOptions = merge(DEFAULT_OPTIONS, options);

		// Add `string` path to options if provided.
		if (typeof options === "string") {
			_options = merge(_options, { path: options });
		}
		// Merge `object` path with options if provided.
		else if (typeof options === "object") {
			_options = merge(_options, options);
		}

		// Bind options to instance property.
		this.options = _options;

		// Add `cwd` and `env` to config.
		if (process) {
			if (process.cwd instanceof Function) this.set("cwd", process.cwd());
			if (process.env && process.env.NODE_ENV) this.set("env", process.env.NODE_ENV);
		}

		// Try loading default config file.
		try {
			if (this.options.load_default) {
				this.load("default");
			}
		} catch (e) {}

		// Try loading environment config file.
		try {
			if (this.options.load_env) {
				this.load(this.get("env"));
			}
		} catch (e) {
			// console.log(`Failed to load environment config file ${this.config_path}/${this.get("env")}.json.`);
		}

		// Overwrite with mapped environment variables.
		let env_mapping = this.options.env_mapping;
		if (env_mapping) {
			// Use either provided mapping or default.
			let mapping: ConfigEnvMapping = typeof env_mapping === "object" ? env_mapping : DEFAULT_ENV_MAPPING;

			// Iterate mappings, check the environment variable exists and set it.
			for (let key in mapping) {
				if (process.env[key]) {
					// this.set(env_mapping[key], process.env[key]);
				}
			}
		}
	}

	/**
	 * Loads a config JSON and merges into instance.
	 *
	 * @param {string} file The configuration file to be loaded, either as a
	 *     path relative to `options.path` or as an absolute path.
	 */
	public load(file: string) : void {
		// Use given path or fallback to default.
		file = path.isAbsolute(file) ? file : path.join(this.options.path, file);

		// Add JSON extension.
		// TODO: Support other formats.
		file = `${file}.json`;

		// Try to read the file.
		try {
			let json = fs.readJSONSync(file);

			// Apply json to config.
			for (let key in json) {
				this.set(key, json[key]);
			}
		} catch (e) {
			// TODO: Replace with custom Error class.
			throw new Error(`failed to load config file ${file}`);
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
	public get(key: string) : any {
		// Get context.
		let ret = this._get(key);

		// Check there is a value for key.
		if (!ret && ret !== false) {
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
	 * @return {JSON}
	 */
	public toJSON() : JSON {
		let json = {};

		for (let key in this) {
			// Make sure key is own property and not a reserved keyword.
			if (this.hasOwnProperty(key) && !["options", "cwd", "env"].includes(key)) {
				json[key] = this[key];
			}
		}

		return JSON.parse(JSON.stringify(json));
	}
}

/**
 * Internal singleton storage for configs.
 *
 * @type {Object}
 */
let _configs: ConfigStore = {};

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
export function init(path: string = DEFAULT_CONFIG_PATH, options: undefined|ConfigOptions = undefined) : Config {
	if (!_configs[path]) _configs[path] = new Config(path, options);
	return _configs[path];
}

/**
 * Helper function to get value from default `Config` instance.
 *
 * @param  {string} key Which key to look for.
 * @return {any}        Returns value found for `key` on default config.
 */
export function config(key: string) : any {
	return init().get(key);
}
