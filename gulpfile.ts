import * as del from "del";
import * as gulp from "gulp";
import * as mocha from "gulp-mocha";
import * as shell from "gulp-shell";
import * as typescript from "typescript";

// Deletes the distribution folder.
gulp.task("del", () => {
	return del("dist");
});

// Compiles the TypeScript.
gulp.task("compile", ["del"], () => {
	return gulp.src(`tsconfig.json`, { read: false })
	.pipe(shell("$(npm bin)/tsc -p <%= file.path %>"));
});

// Runs all tests with mocha.
gulp.task("test", () => {
	return gulp.src(`src/**/*.spec.ts`, { read: false })
	.pipe(mocha({}));
});

// Watches for changes and runs test.
gulp.task("watch", (done) => {
	gulp.watch([`src/**/*`], ["test"]);
});

// Default runs test and watch.
gulp.task("default", ["test", "watch"]);
