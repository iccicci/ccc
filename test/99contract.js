"use strict";

const assert = require("assert");
const ccc = require("..");

xdescribe("base contract", () => {
	before(() => {
		this.ccc = ccc("test/contract.ccc");
	});

	it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
});
