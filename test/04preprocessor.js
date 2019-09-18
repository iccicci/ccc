"use strict";

const assert = require("assert");
const ccc = require("..");
const src = require("./src");

describe("preprocessor", () => {
	const err = () => this.ccc.messages.shift();
	const pre = () => (this.ccc = ccc("src", { preprocess: true }));

	describe("messages", () => {
		before(src("#warning	  a test warning\n#error the error!  \n#\n# include\n#unexpected\n/*\n", pre));

		it("#warning", () => assert.equal(err(), "ccc:warning:src:1:1:a test warning"));
		it("#error", () => assert.equal(err(), "ccc:error:src:2:1:the error!  "));
		it("#", () => assert.equal(err(), "ccc:error:src:3:2:unexpected end of line after token '#'"));
		it("# include", () => assert.equal(err(), "ccc:error:src:4:2:unexpected white space after token '#'"));
		it("#unexpected", () => assert.equal(err(), "ccc:error:src:5:2:unexpected token 'unexpected'"));
		it("eof in multiline comment", () => assert.equal(err(), "ccc:error:src:7:1:unexpected end of file in multiline comment"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("define", () => {
		before(src("#define test test1 test2\n\na test b\nc\n#define\n#define +\n", pre));

		it("preprocessed", () => assert.equal(this.ccc.preprocessed, "\na test1 test2 b\nc\n\n"));
		it("#define", () => assert.equal(err(), "ccc:error:src:5:8:unexpected end of line after token '#define'"));
		it("#define +", () => assert.equal(err(), "ccc:error:src:6:9:unexpected token '+'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("nested define", () => {
		before(src("#define test1  test3  test4\n#define test test1 test2\n\ntest\n", pre));

		it("preprocessed", () => assert.equal(this.ccc.preprocessed, "\ntest3  test4 test2\n"));
		it("complie error", () => assert.equal(err(), "ccc:error:src:5:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("ifdef ifndef else endif", () => {
		before(
			src(
				"#define test1\na\n#ifdef test1\n#define test2\nb\n#else\n#define test3\nc\n#ifdef test2\nd\n#else\ne\n#endif\nf\n#endif\ng\n#ifndef test2\nh\n#else\ni\n#ifdef test3\nj\n#error test\n#else\nk\n#endif\nl\n#endif\nm\n",
				pre
			)
		);

		it("preprocessed", () => assert.equal(this.ccc.preprocessed, "a\nb\ng\ni\nk\nl\nm\n"));
		it("complie error", () => assert.equal(err(), "ccc:error:src:30:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("ifdef ifndef else endif errors", () => {
		before(src("#ifdef\n#ifdef +\n#ifndef\n#ifndef +\n#else\n#endif\n#ifdef test\n#else a\n#else\n#else\n#endif a\n#ifdef a b\n", pre));

		it("#ifdef", () => assert.equal(err(), "ccc:error:src:1:7:unexpected end of line after token '#ifdef'"));
		it("#ifdef +", () => assert.equal(err(), "ccc:error:src:2:8:unexpected token '+'"));
		it("#ifndef", () => assert.equal(err(), "ccc:error:src:3:8:unexpected end of line after token '#ifndef'"));
		it("#ifndef +", () => assert.equal(err(), "ccc:error:src:4:9:unexpected token '+'"));
		it("#else", () => assert.equal(err(), "ccc:error:src:5:1:unexpected token '#else' without '#if'"));
		it("#endif", () => assert.equal(err(), "ccc:error:src:6:1:unexpected token '#endif' without '#if'"));
		it("#else a", () => assert.equal(err(), "ccc:error:src:8:7:unexpected token 'a'"));
		it("#else #else", () => assert.equal(err(), "ccc:error:src:10:1:unexpected token '#else' after '#else'"));
		it("#endif a", () => assert.equal(err(), "ccc:error:src:11:8:unexpected token 'a'"));
		it("#ifdef a b", () => assert.equal(err(), "ccc:error:src:12:10:unexpected token 'b'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("undef", () => {
		before(src("#define test test1\na test\n#undef test\na test\n#undef\n#undef +\n#undef a b\n", pre));

		it("preprocessed", () => assert.equal(this.ccc.preprocessed, "a test1\na test\n\n\n"));
		it("#undef", () => assert.equal(err(), "ccc:error:src:5:7:unexpected end of line after token '#undef'"));
		it("#undef +", () => assert.equal(err(), "ccc:error:src:6:8:unexpected token '+'"));
		it("#undef a b", () => assert.equal(err(), "ccc:error:src:7:10:unexpected token 'b'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("include", () => {
		before(
			src(
				[
					"#include \"src1\"\n\n#ifndef test\n#include \"notfound.ccc\"\n#endif\n\ntest\n#include \"src2\"\n#include \"notfound.ccc\"\n#include \"a\" \"b\"\n#include +\n#include\n#include \"\"\n",
					"#define test test1\n\ntest\n",
					"#warning test"
				],
				pre
			)
		);

		it("preprocessed", () => assert.equal(this.ccc.preprocessed, "\n\ntest1\n\n\n"));
		it("error in included", () => assert.equal(err(), "ccc:warning:src2:1:1:test"));
		it("missing include", () => assert.equal(err(), "ccc:error:src:9:reding file 'notfound.ccc': ENOENT: no such file or directory, open 'notfound.ccc'"));
		it("#include \"a\" \"b\"", () => assert.equal(err(), "ccc:error:src:10:14:unexpected token '\"b\"'"));
		it("#include +", () => assert.equal(err(), "ccc:error:src:11:10:unexpected token '+'"));
		it("#include", () => assert.equal(err(), "ccc:error:src:12:9:unexpected end of line after token '#include'"));
		it("#include \"\"", () => assert.equal(err(), "ccc:error:src:13:10:empty filename in '#include'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("comments", () => {
		before(src("#define a test\n#define b a // c\n\n/*\n#ifdef a\n#define c test\n#endif\n*/\n\na b c\n", pre));

		it("preprocessed", () => assert.equal(this.ccc.preprocessed, "// c\n/*\n#ifdef a\n#define c test\n#endif\n*/\n\ntest test  c\n"));
		it("complie error", () => assert.equal(err(), "ccc:error:src:11:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});
});
