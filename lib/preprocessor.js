"use strict";

const CConsumer = require("./cconsumer");
const fs = require("fs");
const Source = require("./source");

class Preprocessor extends CConsumer {
	constructor(source, define) {
		super(source);

		this.define = define ? define : {};
		this.ifstack = [];
		this.res = [{ filename: source.filename, line: "", nr: 1 }];
		this.resn = 0;
	}

	define_() {
		let began, c, define;
		let value = "";

		while(! (c = this.pull()).eol)
			if(began || ! c.space)
				if(began || define) {
					began = true;
					value += c.symbol && c.token in this.define ? this.define[c.token] : c.token;
				}
				else {
					if(! c.symbol) return this.addErr(c, `unexpected token '${c.token}'`);
					define = c.token;
				}

		if(! define) return this.addFormattedMsg(true, c, "unexpected end of line after token '#define'");
		if(! this.pushing()) return true;

		this.define[define] = value;

		return true;
	}

	else_(res) {
		if(! this.ifstack.length) return this.addErr(res, "unexpected token '#else' without '#if'");

		const last = this.ifstack[this.ifstack.length - 1];

		if(last.else_) return this.addErr(res, "unexpected token '#else' after '#else'");
		if(this.pullNothing()) return true;

		last.else_ = true;
		last.satisfied = ! last.satisfied;

		return true;
	}

	endif(res) {
		if(! this.ifstack.length) return this.addErr(res, "unexpected token '#endif' without '#if'");
		if(this.pullNothing()) return true;
		this.ifstack.pop();

		return true;
	}

	ifdef(defined) {
		let c, define;

		if(this.pullOne("symbol", () => define, ce => (define = ce.token), ce => (c = ce))) return true;
		if(! define) return this.addFormattedMsg(true, c, `unexpected end of line after token '#if${defined ? "" : "n"}def'`);
		if(! (define in this.define)) defined = ! defined;
		this.ifstack.push({ satisfied: defined });

		return true;
	}

	include() {
		let c, file, filec;

		if(
			this.pullOne(
				"string",
				() => file,
				ce => {
					file = ce.token;
					filec = ce;
				},
				ce => (c = ce)
			)
		)
			return true;

		if(! file) return this.addFormattedMsg(true, c, "unexpected end of line after token '#include'");
		if(file.length === 2) return this.addFormattedMsg(true, filec, "empty filename in '#include'");
		if(! this.pushing()) return true;

		const filename = file.substr(1, file.length - 2);
		const source = new Source(filename);
		const error = source.read();

		if(error) return this.addMsg(true, `${c.filename}:${c.nr}:reding file '${filename}': ${error.message}`);

		const preprocessor = new Preprocessor(source, this.define);

		preprocessor.preprocess();
		this.copyMessages(preprocessor);

		const pre = this.lines.slice(0, this.line - 1);
		const post = this.lines.slice(this.line);

		this.lines = Array.prototype.concat(pre, preprocessor.res, post);
		this.line += preprocessor.res.length - 1;

		return true;
	}

	message(res, error) {
		let began, c;
		let value = "";

		while(! (c = this.pull()).eol)
			if(began || ! c.space)
				if(began) value += c.token;
				else {
					began = true;
					value += c.token;
				}

		if(! this.pushing()) return true;

		return this.addFormattedMsg(error, res, value);
	}

	preprocess() {
		while(this.pull_p()) {}
	}

	pull_p() {
		const res = this.pull();

		if(res.eof) return false;
		if(res.column === 1 && res.token === "#") {
			const res2 = this.pull();

			if(res2.space) {
				if(res2.eol) return this.addFormattedMsg(true, res2, "unexpected end of line after token '#'");

				return this.addErr(res2, "unexpected white space after token '#'");
			}

			if(res2.token === "define") return this.define_();
			if(res2.token === "else") return this.else_(res);
			if(res2.token === "endif") return this.endif(res);
			if(res2.token === "error") return this.message(res, true);
			if(res2.token === "ifdef") return this.ifdef(true);
			if(res2.token === "ifndef") return this.ifdef(false);
			if(res2.token === "include") return this.include(false);
			if(res2.token === "undef") return this.undef();
			if(res2.token === "warning") return this.message(res, false);

			return this.addErr(res2, `unexpected token '${res2.token}'`);
		}
		else {
			this.push(res);

			return true;
		}
	}

	pullOne(what, check, when, err) {
		let c;

		while(! (c = this.pull()).eol)
			if(c[what])
				if(check()) {
					err(c);

					return this.addErr(c, `unexpected token '${c.token}'`);
				}
				else when(c);
			else if(! c.space) {
				err(c);

				return this.addErr(c, `unexpected token '${c.token}'`);
			}

		err(c);

		return false;
	}

	pullNothing() {
		let c;

		while(! (c = this.pull()).eol) if(! c.space) return this.addErr(c, `unexpected token '${c.token}'`);

		return false;
	}

	push(res) {
		if(! this.pushing()) return true;
		if(res.eol) {
			this.res.push({ filename: this.source.filename, line: "", nr: res.nr + 1 });
			this.resn++;
		}

		this.res[this.resn].line += res.symbol && res.token in this.define && ! this.comment ? this.define[res.token] : res.token;
	}

	pushing() {
		for(var i in this.ifstack) if(! this.ifstack[i].satisfied) return false;

		return true;
	}

	undef() {
		let c, define;

		if(this.pullOne("symbol", () => define, c => (define = c.token), ce => (c = ce))) return true;
		if(! define) return this.addFormattedMsg(true, c, "unexpected end of line after token '#undef'");
		delete this.define[define];

		return true;
	}
}

module.exports = Preprocessor;
