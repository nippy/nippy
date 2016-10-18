import * as del from "del";
import * as gulp from "gulp";
import * as mocha from "gulp-mocha";
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

gulp.task("test", () => {
	return gulp.src(`test/**/*.spec.ts`, { read: false })
	.pipe(mocha({}));
});

gulp.task("watch", (done) => {
	gulp.watch([`src/**/*`, `test/**/*`], ["test"]);
});
