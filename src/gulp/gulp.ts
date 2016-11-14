import * as del from "del";
import * as mocha from "gulp-mocha";
import * as shell from "gulp-shell";

export interface Task {
	before?: string[];
	task?: (done?) => any;
};

export interface TaskList {
	[name: string]: Task;
};

/**
 * Registers the default gulp tasks used for development of Nippy services.
 */
export function registerGulpTasks(gulp) {
	let tasks: TaskList = {
		default: { before: ["test", "watch"] },
		del: { task: () => del("dist") },

		compile: {
			before: ["del"],
			task: () => {
				return gulp.src(`tsconfig.json`, { read: false })
				.pipe(shell("$(npm bin)/tsc -p <%= file.path %>"));
			}
		},

		test: {
			task: () => {
				return gulp.src(`src/**/*.spec.ts`, { read: false })
				.pipe(mocha({}));
			}
		},

		watch: {
			task: (done) => {
				gulp.watch([`src/**/*`], ["test"]);
			}
		}
	};

	for (let name in tasks) {
		let task = tasks[name];

		let before = task.before || null;
		let func = task.task || null;

		gulp.task(name, before, func);
	}
};
