#!/usr/bin/env node

"use strict";

const ccc = require("./index.js");
const fs = require("fs");

const long = { assemble: true, assembly: true, help: true, opcode: true, preprocess: true, version: true };
const short = { A: "assembly", a: "assemble", h: "help", O: "opcode", p: "preprocess", v: "version" };

var error;
var filename;
var options = { define: {} };
var output;

function fatal(msg) {
	process.stderr.write(`ccc:fatal error:${msg}\n`);
	error = true;
}

function dash(option) {
	if(option.length === 1) fatal("unknown command line option: '-'");
	else if(option[1] === "o")
		if(i + 1 === process.argv.length) fatal("missing output filename after '-o' option");
		else output = process.argv[++i];
	else if(option[1] === "D")
		if(option.length === 2) fatal("missing macro name: '-D'");
		else {
			const tokens = option.substr(2).split("=");
			const macro = tokens.shift();

			options.define[macro] = tokens.length ? tokens.join("=") : "";
		}
	else
		for(var j = 1; j < option.length; ++j)
			if(short[option[j]]) options[short[option[j]]] = true;
			else fatal(`unknown command line option: '-${option[j]}'`);
}

for(var i = 2; i < process.argv.length; ++i) {
	const option = process.argv[i];

	if(! option.length) fatal("unknown command line option: ''");
	else if(option.substr(0, 2) === "--") {
		const attempt = option.substr(2);

		if(long[attempt]) options[attempt] = true;
		else fatal(`unknown command line option: '${option}'`);
	}
	else if(option.substr(0, 1) === "-") dash(option);
	else if(filename) fatal(`only one input file: '${option}'`);
	else filename = option;
}

if(options.help)
	process.exit(
		console.log(
			"Usage: ccc [options] file\n" +
				"Options:\n" +
				"  -A --assembly       Outputs the generated assembly; assumes input is in CCC.\n" +
				"  -a --assemble       Assemble; assumes input is in assembly\n" +
				"  -D<macro>[=<value>] Defines <macro> eventually with its <value>\n" +
				"  -h --help           Prints this help and exits\n" +
				"  -O --opcode         Outputs the generated opcode.\n" +
				"  -o <filename>       The output <filename>; default: stdout\n" +
				"  -p --preprocess     Outputs the preprocessor result; assumes input is in CCC.\n" +
				"  -v --version        Prints the version and exits"
		)
	);

if(options.version) process.exit(console.log("ccc (CC's C - EVM compiler) " + JSON.parse(fs.readFileSync("package.json", "utf8")).version));
if(! error && ! filename) fatal("no input file");
if(error) process.exit(1);

const res = ccc(filename, options);
const write = out => {
	const { contracts, preprocessed } = res;
	const ret = {};

	if(preprocessed) ret.preprocessed = preprocessed;
	if(Object.keys(contracts).length) ret.contracts = contracts;

	out.write(JSON.stringify(ret) + "\n", () => {
		if(res.messages.length) process.stderr.write(res.messages.join("\n") + "\n");
		if(res.errors.length) process.exit(1);
	});
};

if(output) {
	const out = fs.createWriteStream(output);

	out.on("open", write.bind(null, out));
	out.on("error", err => {
		fatal(err.message);
		process.exit(1);
	});
}
else write(process.stdout);
