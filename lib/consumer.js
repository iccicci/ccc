"use strict";

const Types = require("./types");
const utils = require("web3-utils");

class CCCError extends Error {}

class Consumer {
	constructor(source) {
		this.errors = [];
		this.messages = [];
		this.warnings = [];
		this.column = 0;
		this.line = 0;
		this.lines = source.lines;
		this.source = source;
	}

	addErr(res, msg) {
		this.nextLine();

		return this.addFormattedMsg(true, res, msg);
	}

	addFormattedMsg(error, res, msg) {
		return this.addMsg(error, `${res.filename}:${res.nr}:${res.column}:${msg}`);
	}

	addMsg(error, msg) {
		const level = error ? "error" : "warning";
		const mess = `ccc:${level}:${msg}`;

		this[level + "s"].push(mess);
		this.messages.push(mess);

		return true;
	}

	copyMessages(other) {
		for(let i in other.errors) this.errors.push(other.errors[i]);
		for(let i in other.messages) this.messages.push(other.messages[i]);
		for(let i in other.warnings) this.warnings.push(other.warnings[i]);

		if(this.errors.length) throw new CCCError();
	}

	error(msg) {
		const line = this.lines[this.line];

		this.addErr({ column: this.column, filename: line.filename, nr: line.nr }, msg);

		return { err: true };
	}

	merge(ret1, ret2) {
		for(let i in ret2) ret1[i] = ret2[i];

		return ret1;
	}

	nextCharacter() {
		if(this.column === this.lines[this.line].line.length) return "";

		return this.lines[this.line].line[this.column];
	}

	nextLine() {
		this.column = this.lines[this.line].line.length;

		return true;
	}

	numberType(number) {
		number.type = Types["uint" + parseInt((number.hex.length - 1) / 2, 10) * 8];

		return number;
	}

	pull() {
		const l = this.lines[this.line];
		const r = { column: this.column + 1, filename: l.filename, nr: l.nr };
		const c = this.pullCharacter();

		if(c === "-eof-") return this.merge(r, { eof: true, eol: true });

		return this.merge(r, this.pull_(c));
	}

	pull_(c) {
		let ret = { token: c };

		switch(c) {
		case "":
			ret.eol = true;
		case "\r":
		case "\t":
		case " ":
			ret.space = true;
			return ret;

		case "(":
		case ")":
		case ",":
		case ".":
		case ";":
		case "?":
		case "[":
		case "]":
		case "^":
			ret.operator = true;
		case "#":
		case "{":
		case "}":
			return ret;

		case "\"":
		case "'":
			return this.pullString(c);

		case "@":
		case "~":
			return this.pullOperator(c);

		case "!":
		case "%":
		case "*":
		case "/":
		case ":":
			return this.pullOperator(c, false, true);

		case "+":
		case "-":
			return this.pullOperator(c, true, true, true);

		case "=":
			return this.pullOperator(c, true);

		case "&":
		case "<":
		case ">":
		case "|":
			return this.pullOperator(c, true, true);
		}

		return this.pullConstant(c);
	}

	pullCharacter() {
		if(this.column >= this.lines[this.line].line.length) {
			if(this.line + 1 === this.lines.length) return "-eof-";
			this.column = 0;
			this.line++;

			return "";
		}

		return this.lines[this.line].line[this.column++];
	}

	pullConstant(c) {
		if(c === "0") {
			const c1 = this.nextCharacter();

			if(c1 === "x" || c1 === "X") return this.pullHex(c);
		}

		if(c >= "0" && c <= "9") return this.pullDecimal(c);
		if((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") return this.pullSymbol(c);

		return this.error(`unexpected character at: '${this.lines[this.line].line.substr(this.column - 1)}'`);
	}

	pullDecimal(c) {
		let c1;

		while((c1 = this.nextCharacter()) >= "0" && c1 <= "9") c += this.pullCharacter();

		return this.numberType({ constant: true, decimal: true, hex: utils.toHex(c), number: true, token: c });
	}

	pullHex() {
		this.pullCharacter();

		const c = this.pullRest("0x", false);

		return this.numberType({ constant: true, hex: c, number: true, token: c });
	}

	pullOperator(c, repeat, equal, once) {
		const c1 = this.nextCharacter();

		if(c === "-" && c1 === ">") return { operator: true, token: c + this.pullCharacter() };
		if((c === "/" && (c1 === "/" || c1 === "*")) || (c === "*" && c1 === "/")) return { token: c + this.pullCharacter() };
		if(c1 === "=" && equal) return { operator: true, token: c + this.pullCharacter() };

		if(repeat && c1 === c) {
			this.column++;
			if(this.nextCharacter() === "=" && ! once) return { operator: true, token: c + c + this.pullCharacter() };

			return { operator: true, token: c + c };
		}

		return { operator: true, token: c };
	}

	pullRest(c, symbol) {
		let c1;
		const lastLC = symbol ? "z" : "f";
		const lastUC = symbol ? "Z" : "F";
		const under = symbol ? "_" : "0";

		while(((c1 = this.nextCharacter()) >= "0" && c1 <= "9") || (c1 >= "a" && c1 <= lastLC) || (c1 >= "A" && c1 <= lastUC) || c1 === under) c += this.pullCharacter();

		return c;
	}

	pullString(c) {
		const l = c;

		while(this.nextCharacter() !== "") {
			let c1 = this.pullCharacter();
			if(c1 === l) {
				c += l;
				const hex = utils.toHex(c);

				return {
					constant: true,
					empty:    c.length === 2,
					hex:      "0x" + hex.substr(4, hex.length - 6),
					string:   l,
					token:    c,
					type:     Types["bytes" + (c.length === 2 ? 1 : parseInt((hex.length - 5) / 2, 10))]
				};
			}
			else if(c1 === "\\") {
				c1 = this.nextCharacter();
				if(c1 !== "") c += "\\" + this.pullCharacter();
			}
			else c += c1;
		}
		this.column++;

		return this.error("unexpected end of line in string");
	}

	pullSymbol(c) {
		return { symbol: true, token: this.pullRest(c, true) };
	}
}

Consumer.prototype.CCCError = CCCError;

module.exports = Consumer;
