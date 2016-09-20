"use strict";

const del = require("del");
const gulp = require("gulp");
const mocha = require("gulp-mocha");
const shell = require("gulp-shell");
const typescript = require("typescript");

// Delete
// ------
// Deletes the distribution folder.
gulp.task("del", () => {
  return del("dist");
});
gulp.task("delete", ["del"]);

// Compile
// -------
// Compiles the TypeScript.
gulp.task("compile", ["del"], () => {
  return gulp.src(`tsconfig.json`, { read: false })
    .pipe(shell("$(npm bin)/tsc -p <%= file.path %>"));
});

// Test
// ----
// Runs the test suites using Mocha.
gulp.task("test", ["compile"], () => {
  return gulp.src(`dist/test/**/*.spec.js`, { read: false })
    .pipe(mocha({}));
});