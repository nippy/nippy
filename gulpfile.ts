import * as del from "del";
import * as gulp from "gulp";
// const mocha = require("gulp-mocha");
import * as shell from "gulp-shell";
import * as typescript from "typescript";

// Deletes the distribution folder.
gulp.task("del", () => {
	return del("dist");
});
gulp.task("delete", ["del"]);

// Compiles the TypeScript.
gulp.task("compile", ["del"], () => {
	return gulp.src(`tsconfig.json`, { read: false })
	.pipe(shell("$(npm bin)/tsc -p <%= file.path %>"));
});

// // Runs the test suites using Mocha.
// gulp.task("test", ["compile"], () => {
//   return gulp.src(`dist/test/**/*.spec.js`, { read: false })
//     .pipe(mocha({}));
// });
