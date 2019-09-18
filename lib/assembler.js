"use strict";

const Consumer = require("./consumer");
const opcodes = require("./opcodes");
const utils = require("web3-utils");

class Assembler extends Consumer {
	constructor(source, line, column) {
		super(source);

		if(column) {
			this.line = line;
			this.column = column;
			this.inblock = true;
		}
	}

	assemble() {
		this.attempt = 1;
		this.code = false;
		this.labels = {};
		this.newline = true;
		this.res = [];

		while(this.pull()) {}
		if(this.errors.length) return this.res;

		this.res.map(curr => {
			const symbol = curr.symbol;

			if(symbol && ! this.labels[symbol]) this.addErr(curr, `unresolved label: '${symbol}'`);
		});

		if(this.errors.length) return this.res;
		while(! this.resolve()) {}

		return this.res;
	}

	pull() {
		const res = super.pull();

		if(res.err) return true;
		if(res.eof) return false;
		if(res.eol) return (this.newline = true);
		if(res.space) return true;
		if(res.token === ":") return this.colon(res);
		if(res.token === "{") return this.block(res);
		if(res.token === "#" || res.token === "//") return this.nextLine();
		if(res.token === "/*") return this.comment(res);
		if(this.newline) this.newline = false;
		else return this.addErr(res, `syntax error: unexpected token: '${res.token}'`);
		if(res.token === ".") return this.scope();
		if(res.token === "}") return this.end(res);
		if(res.number) return this.number(res);
		if(res.string) return this.string(res);
		if(res.symbol) return this.symbol(res);

		return this.addErr(res, `syntax error: unexpected token: '${res.token}'`);
	}

	block(res) {
		if(this.newline) return this.addErr(res, "syntax error: unexpected token: '{'");

		const last = this.res[this.res.length - 1];

		if(last.symbol) {
			if(this.labelError(last, last.symbol)) return true;
			if(this.labelError(last, last.symbol + "_length")) return true;

			if(last.push) {
				delete last.push.opcode;
				delete last.push;
			}

			last.label = last.symbol;
			this.labels[last.label] = last;
			delete last.symbol;
			last.block = new Assembler({ lines: this.lines }, this.line, this.column);
			last.block.assemble();
			this.copyMessages(last.block);
			this.line = last.block.line;
			this.column = last.block.column;
			this.labels[last.label + "_length"] = { label: last.label + "_length", resolved: last.block.length };
		}
		else this.addErr(last, "a valid opcode can't be used as a block name");

		return true;
	}

	colon(res) {
		if(this.newline) return this.addErr(res, "syntax error: unexpected token: ':'");

		const last = this.res[this.res.length - 1];

		if(last.symbol) {
			if(this.labelError(last, last.symbol)) return true;
			last.label = last.symbol;
			this.labels[last.label] = last;
			delete last.symbol;
			if(this.code) last.opcode = "JUMPDEST";
			if(last.push) {
				delete last.push.opcode;
				delete last.push;
			}
		}
		else this.addErr(last, "a valid opcode can't be used as a label");

		return true;
	}

	comment(r) {
		let res;

		while((res = super.pull()).token !== "*/") if(res.eof) return this.addErr(res, "unexpected end of file in multiline comment");

		return true;
	}

	end(res) {
		if(! this.inblock) return this.addErr(res, "syntax error: unexpected token: '}'");

		return false;
	}

	labelError(last, symbol) {
		if(this.labels[symbol]) return super.addErr(last, `label already defined at line ${this.labels[symbol].nr}: '${symbol}'`);

		return false;
	}

	number(res) {
		const hex = "0x" + res.hex.substr(2).toUpperCase();

		if(this.code)
			if(hex.length > 66) return this.addErr(res, (res.decimal ? "decimal" : "hex") + " number exceedes 32 bytes world length: " + res.token);
			else this.res.push({ opcode: "PUSH" + parseInt((hex.length - 1) / 2, 10) });

		this.res.push({ opcode: hex });

		return true;
	}

	scope() {
		const res = super.pull();

		if(res.eol) return this.addErr(res, "unexpeceted end of line after '.'");
		if(res.space) return this.addErr(res, "unexpeceted white space after '.'");
		if(res.token === "code") return (this.code = true);
		if(res.token === "data") return ! (this.code = false);

		return this.addErr(res, `unexpeceted token after '.': '${res.token}'`);
	}

	string(res) {
		let hex = res.hex;

		if(this.code) {
			if(hex.length > 66) return this.addErr(res, "string exceedes 32 bytes world length: " + res.token);
			if(res.empty) hex = "0x0";
			this.res.push({ opcode: "PUSH" + parseInt((hex.length - 1) / 2, 10) });
			this.res.push({ opcode: hex });
		}
		else if(! res.empty) this.res.push({ opcode: hex });

		return true;
	}

	symbol(res) {
		const { column, filename, nr } = res;
		const op = { column, filename, nr };
		const uc = res.token.toUpperCase();

		if(opcodes[uc]) {
			op.opcode = uc;
			this.res.push(op);
		}
		else {
			op.symbol = res.token;

			if(this.code) {
				op.push = { opcode: "PUSH1" };
				this.res.push(op.push);
			}

			this.res.push(op);
		}

		return true;
	}

	resolve() {
		const limit = Math.pow(256, this.attempt) - 1;

		this.opcode = [];
		this.length = 0;
		this.sure = true;

		for(let i in this.res) {
			let curr = this.res[i];

			if(curr.label) {
				if(this.sure || this.finished) this.labels[curr.label].resolved = this.length;
				if(this.length > limit) {
					this.attempt++;

					return false;
				}
			}

			if(curr.block) this.length += curr.block.length;
			this.resolveOpcode(curr);
		}

		this.finished = true;

		return this.sure;
	}

	resolveOpcode(curr) {
		if(curr.opcode) {
			this.opcode.push(curr.opcode);
			this.length += opcodes[curr.opcode] ? 1 : curr.length ? curr.length : (curr.length = parseInt((curr.opcode.length - 1) / 2, 10));
			if(curr.push)
				if(curr.push.opcode !== "PUSH" + curr.length) {
					curr.push.opcode = "PUSH" + curr.length;
					this.sure = false;
				}
		}
		else if(curr.symbol)
			if("resolved" in this.labels[curr.symbol]) {
				curr.opcode = utils.toHex(this.labels[curr.symbol].resolved);
				this.resolveOpcode(curr);
			}
			else {
				this.length += this.attempt;
				this.sure = false;
			}
	}
}

module.exports = Assembler;
