import * as del from "del";
import * as mocha from "gulp-mocha";
import * as nodemon from "gulp-nodemon";
import * as shell from "gulp-shell";

export interface Task {
	before?: string[];
	task?: (done?) => any;
}

export class TaskList {
	constructor(private gulp) {}

	default: Task = { before: ["nodemon", "test", "watch"] };
	del: Task = { task: () => del("dist") };

	compile: Task = {
		before: ["del"],
		task: () => {
			return this.gulp.src(`tsconfig.json`, { read: false })
			.pipe(shell("$(npm bin)/tsc -p <%= file.path %>"));
		}
	};

	nodemon: Task = {
		before: ["compile"],
		task: (done) => {
			return nodemon({
				ext: "js json",
				env: { "NODE_ENV": "development" },
				ignore: [
					"data/",
					"node_modules/"
				]
			}).once("start", done);
		}
	};

	test: Task = {
		task: () => {
			return this.gulp.src(`src/**/*.spec.ts`, { read: false })
			.pipe(mocha({}));
		}
	};

	watch: Task = {
		task: (done) => {
			this.gulp.watch([`src/**/*`], ["test", "compile"]);
		}
	};
}

/**
 * Registers the default gulp tasks used for development of Nippy services.
 */
export function registerGulp(gulp, register_tasks = true) : TaskList {
	let tasks = new TaskList(gulp);

	if (register_tasks) {
		for (let name in tasks) {
			let task = tasks[name];

			let before = task.before || null;
			let func = task.task || null;

			gulp.task(name, before, func);
		}
	}

	return tasks;
}
