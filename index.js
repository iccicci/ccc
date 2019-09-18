"use strict";

const Assembler = require("./lib/assembler");
const Compiler = require("./lib/compiler");
const Consumer = require("./lib/consumer");
const Opcodes = require("./lib/opcodes");
const Preprocessor = require("./lib/preprocessor");
const Source = require("./lib/source");

class CCCompiler extends Consumer {
	constructor(options, source) {
		super(source);
		this.options = options;
		this.opcodes = [];
	}

	assemble(lines) {
		const assembler = new Assembler({ lines });

		assembler.assemble();
		this.copyMessages(assembler);

		return assembler.res;
	}

	compile() {
		this.compiler = new Compiler(this);
		this.compiler.compile();
		this.copyMessages(this.compiler);

		return this.compiler.scope;
	}

	opcode(assembly, opcodes) {
		assembly.map(opcode => {
			if(opcode.opcode) opcodes.push(opcode.opcode);
			if(opcode.block) this.opcode(opcode.block.res, opcodes);
		});

		return opcodes;
	}

	parse(res) {
		let scope;

		if(this.options.assemble) {
			const { lines } = this.source;

			scope = { contracts: { default: { lines } } };
		}
		else {
			this.preprocess(res);
			scope = this.compile();
			for(let contract in scope.contracts) scope.contracts[contract].lines = [{ line: "", nr: 1 }];
		}

		for(let contract in scope.contracts) {
			const assembly = this.assemble(scope.contracts[contract].lines);
			const opcodes = this.opcode(assembly, []);

			res.contracts[contract] = this.options.opcode ? { opcodes } : {};
			res.contracts[contract].bin = this.translate(opcodes);
		}
	}

	preprocess(res) {
		const preprocessor = new Preprocessor(this.source, this.options.define);

		preprocessor.preprocess();
		this.lines = preprocessor.res;
		if(this.options.preprocess) res.preprocessed = preprocessor.res.map(e => e.line).join("\n");
		this.copyMessages(preprocessor);
	}

	translate(opcodes) {
		const bin = [];

		opcodes.map(opcode => {
			if(opcode in Opcodes) bin.push(Opcodes[opcode]);
			else {
				const code = opcode.substr(2);

				bin.push(code.length % 2 ? "0" + code : code);
			}
		});

		return bin.join("");
	}
}

module.exports = (filename, options) => {
	if(! options) options = {};

	const source = new Source(filename);
	const error = source.read();
	const ccc = new CCCompiler(options, source);
	let res = { contracts: {} };

	if(options.assemble && options.assembly) ccc.addMsg(true, "options conflict: 'assemble' and 'assembly'");
	if(options.assemble && options.preprocess) ccc.addMsg(true, "options conflict: 'assemble' and 'preprocess'");

	if(! ccc.errors.length)
		if(error) ccc.addMsg(true, error.message);
		else
			try {
				ccc.parse(res);
			}
			catch(e) {
				if(! (e instanceof ccc.CCCError)) ccc.addMsg(true, `DevelopmentError: ${e.stack}`);
			}

	["errors", "messages", "warnings"].map(k => (res[k] = ccc[k]));

	return res;
};
