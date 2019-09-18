"use strict";

module.exports = {
	export:    { memory: true, register: true, stackless: true },
	memory:    { export: true, pure: true, register: true, stackless: true, storage: true, view: true },
	pure:      { memory: true, register: true, stackless: true, storage: true, view: true },
	register:  { export: true, memory: true, pure: true, stackless: true, storage: true, view: true },
	stackless: { export: true, memory: true, pure: true, register: true, storage: true, view: true },
	storage:   { memory: true, pure: true, register: true, stackless: true },
	view:      { memory: true, pure: true, register: true, stackless: true }
};
