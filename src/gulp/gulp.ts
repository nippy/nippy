import * as del from "del";
import * as mocha from "gulp-mocha";
import * as nodemon from "gulp-nodemon";
import * as shell from "gulp-shell";

export interface Gulp {
	src: Function;
	task: Function;
	watch: Function;
}

export interface Task {
	before?: string[];
	task?: (done?: Function) => any;
}

export class TaskList {
	constructor(private gulp: Gulp) {}

	tasks: {[name: string]: Task} = {
		default: { before: ["nodemon", "test", "watch"] },
		del: { task: () => del("dist") },

		compile: {
			before: ["del"],
			task: () => {
				return this.gulp.src(`tsconfig.json`, { read: false })
				.pipe(shell("$(npm bin)/tsc -p <%= file.path %>"));
			}
		},

		nodemon: {
			before: ["compile"],
			task: (done: Function) => {
				return nodemon({
					ext: "js json",
					env: { "NODE_ENV": "development" },
					ignore: [
						"data/",
						"node_modules/"
					]
				}).once("start", done);
			}
		},

		test: {
			task: () => {
				return this.gulp.src(`src/**/*.spec.ts`, { read: false })
				.pipe(mocha({}));
			}
		},

		watch: {
			task: (done: Function) => {
				this.gulp.watch([`src/**/*`], ["test", "compile"]);
			}
		},
	};
}

/**
 * Registers the default gulp tasks used for development of Nippy services.
 */
export function registerGulp(gulp: Gulp, register_tasks: boolean = true) : TaskList {
	let list = new TaskList(gulp);

	if (register_tasks) {
		for (let name in list.tasks) {
			let task = list.tasks[name];

			let before = task.before || null;
			let func = task.task || null;

			gulp.task(name, before, func);
		}
	}

	return list;
}
