import * as path from "path";

/**
 * Creates a helper function to easily create paths from a `root` path.
 *
 * @param  {undefined|string = undefined} root The root to create paths from.
 * @return {Function}                          Returns a function that takes one
 *     parameter `target` to be appended to `root` when used.
 */
export function rootFactory(...root: string[]) : Function {
	// Ensure there is a root to build on.
	if (!root || root.length < 1) {
		throw new Error("can't create root helper without a root path");
	}

	// Join provided paths.
	let _root: string = path.join.apply(null, root);

	// Return the helper function.
	return (...target: string[]) : string => {
		return path.join.apply(null, [_root].concat(target || ""));
	};
}
