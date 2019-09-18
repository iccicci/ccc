"use strict";

const Consumer = require("./consumer");
const fs = require("fs");
const Source = require("./source");

class CConsumer extends Consumer {
	constructor(source) {
		super(source);
	}

	pull() {
		var res = super.pull();

		if(res.token === "//") return this.pullComment(res, false);
		if(res.token === "/*") return this.pullComment(res, true);

		return res;
	}

	pullComment(res, multi) {
		this.push(res);
		this.comment = true;

		do {
			res = super.pull();

			if(multi && res.eof) {
				this.addErr(res, "unexpected end of file in multiline comment");

				return res;
			}

			this.push(res);
			if(multi ? res.token === "*/" : res.eol) this.comment = false;
		} while(this.comment);

		return this.pull();
	}

	push() {}
}

module.exports = CConsumer;
