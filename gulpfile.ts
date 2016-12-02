import gulp = require("gulp");

const PACKAGE = require("./package.json");
const MODULES: string[] = [
	"config"
];

gulp.task("build", () => {
	for (let module of MODULES) {
		// Compile TSC

		console.log(module);
	}
});

gulp.task("default", ["build"]);
