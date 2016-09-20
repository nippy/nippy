/**
 * Converts string `str` to camel case using `separator` to split. Defaults to
 * using spaces or hyphens for `separator`.
 */
export function camelize(str: string, separator: string|RegExp = /[-\s]/g) : string {
	let _str: string[];
	// Type checking, since TS barfs when `str.split(string|RegExp)` is called.
	if (typeof separator === "string") {
		let _separator: string = `${separator}`;
		_str = str.split(_separator);
	} else if (separator instanceof RegExp) {
		let _separator: RegExp = separator;
		_str = str.split(separator);
	}
	str = [_str[0]].concat(_str.splice(1).map(s => `${s.charAt(0).toUpperCase()}${s.slice(1)}`)).join("");
	return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}