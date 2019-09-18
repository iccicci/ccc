"use strict";

const fs = require("fs");

const arr = (source, test) => {
	if(source.length === 1) return src(0, source[0], test);

	const len = source.length - 1;
	const last = source.pop();

	return src(len, last, arr(source, test));
};

const src = (idx, src, test) => done => {
	const name = idx ? `src${idx}` : "src";
	const stream = fs.createWriteStream(name);
	const unlink = () => {
		fs.unlink(name, done);
	};

	if(process.env.VERBOSE_TESTS) {
		const lines = src.split("\n");
		const last = lines[lines.length - 1];

		if(! last.length) lines.pop();

		console.log("      " + lines.join("\n      "));
		if(idx) console.log("      ================================");
	}

	stream.end(src);
	stream.on("close", () => {
		if(test.length) return test(unlink);
		test();
		unlink();
	});
};

module.exports = (source, test) => {
	if(typeof source === "string") return src(0, source, test);
	if(! (source instanceof Array)) throw new Error("Wrong src type");

	return arr(source, test);
};
