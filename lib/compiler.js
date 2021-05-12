"use strict";

const CConsumer = require("./cconsumer");
const Context = require("./context");
const Parser = require("./parser");
const Scope = require("./scope");

const Structs = { contract: true, packet: true, struct: true, union: true };

class Compiler extends CConsumer {
  constructor(source) {
    super(source);

    this.parser = new Parser(this);
  }

  addErr(cxt, res, msg) {
    if(! (cxt instanceof Context)) {
      msg = res;
      res = cxt;
      cxt = null;
    }
    this.addFormattedMsg(true, res, msg);
    if(! cxt) return res;
    cxt.addErr(res);
    return null;
  }

  addWarn(res, msg) {
    return this.addFormattedMsg(false, res, msg);
  }

  addFunction(func) {
    if(func.global) return this.addErr(func.first, "functions declaration and definition in global scope is not supported yet");

    if(func.export) func.export = true;

    if(func.pure) {
      func.export = true;
      func.pure = true;
    }

    if(func.stackless) func.stackless = true;

    if(func.view) {
      func.export = true;
      func.view = true;
    }

    this.signFunc(func);

    const prev = this.scope.getFunction(func.signature);

    if(prev) {
      if(! func.defined) return this.addErr(func.first, `new declaration of '${func.extended}' previously declared at line ${prev.first.nr}`);
      if(prev.defined) return this.addErr(func.first, `new definition of '${func.extended}' previously defined at line ${prev.first.nr}`);

      let err = false;

      if(prev.type.type !== func.type.type) err = true;

      ["export", "pure", "stackless", "view"].map(m => {
        if(prev[m]) func[m] = true;
        else if(func[m]) err = true;
      });

      if(err) return this.addErr(func.first, `new declaration of '${func.extended}' previously declared as '${prev.extended}' at line ${prev.first.nr}`);

      func.extended = prev.extended;
    }

    func.scope.name = func.signature;
    this.functions.push(func.scope);

    this.scope.addFunction(func.name, func);
  }

  addVariable(variable, res, prev) {
    const type = variable.type;

    if(! variable.name) {
      if(type.contract || type.packet || type.struct || type.union) return;
      if(prev.definition && ! prev.unnamed) return;

      return this.addWarn(res, "empty variable declaration");
    }

    if(variable.global) return this.addErr(variable.first, "variables can't be declared in global scope");
    if(variable.type.undefined) return this.addErr(res, `not defined type: '${variable.type.type}'`);

    if(variable.export) {
      if(! variable.contract) return this.addErr(variable.export, "only contract variables can be exported");
      if(! variable.storage) return this.addErr(variable.export, "only storage variables can be exported");

      variable.export = true;
    }

    if(variable.memory) variable.memory = true;
    if(variable.register) variable.register = true;

    if(variable.storage) {
      if(! variable.contract) return this.addErr(variable.storage, "only contract variables can be storage");

      variable.storage = true;
    }

    if(variable.dim.length) {
      if(variable.storage) {
        variable.dim.map(d => {
          if(! d.isType) this.addErr(variable, d.first, "only type dimentions allowed for storage arrays");
          if(d.pointer) this.addErr(variable, d.first, "pointers are not valid type dimentions for storage arrays");
          if(d.struct) this.addErr(variable, d.first, "structs are not valid type dimentions for storage arrays");
        });
      } else {
        variable.dim.map(d => {
          if(d.isType) this.addErr(variable, d.first, "type dimentions allowed only for storage arrays");
        });
      }
    }

    if(variable.err) return;
    if(type.type === "void") return this.addErr(variable, res, "variables can't be of type void");

    this.scope.addVar(variable.name, variable);
  }

  addType(type) {
    this.scope.addType(type.name, type.type.type, true);
  }

  compile() {
    let res;

    this.res = [{ filename: "opcode", line: "" }];
    this.pushScope();
    this.functions = [this.scope];

    if(process.env.CCC_TEST) global.scope = this.scope;

    do res = this.pullGlobal();
    while(! res || ! res.eof);

    this.res.push({ line: "" });

    if(this.errors.length) return;
  }

  getType(token) {
    return this.scope.getType(token);
  }

  popScope() {
    this.scope = this.scope.next;
  }

  pull() {
    var res = super.pull();

    while(res.space) res = super.pull();

    return res;
  }

  pullBlock(scope) {
    let res;

    if(scope) this.scope = scope;
    else this.pushScope();

    do {
      res = this.pull();

      if(res.token !== "}") this.pullStatement(new Context(), res);
    } while(res.token !== "}" && ! res.eof);

    this.popScope();
  }

  pullContract(contract, res) {
    const scope = this.pushScope(true);

    contract.addEnd("}");
    contract.definition = true;
    contract.scope = scope;

    do {
      if(! res) res = this.pull();

      if(contract.isEnd(res)) {
        let empty = true;

        for(let i in scope.functions) if(scope.functions[i].export) empty = false;
        for(let i in scope.variables) if(scope.variables[i].export) empty = false;
        if(empty) this.addWarn(res, "empty contract declaration");

        this.popScope();
        this.scope.addContract(contract);
        this.getType("contract " + contract.name).scope = scope;
        if(res.token === "}") return null;
        if(res.eof) return this.addErr(contract, res, "unexpected end of file when declaration or '}' expected");
        return this.addErr(contract, res, `unexpected token when declaration or '}' expected: '${res.token}'`);
      }

      res = this.pullStatement(new Context(contract).setContract(), res);
    } while(true);
  }

  pullExpression(exp, res) {
    let res2;

    if(! res) res = this.pull();
    if(! exp.first) exp.first = res;
    if(exp.isEnd(res)) {
      if(res.eof) this.addErr(exp, res, "unexpected end of file when ';' expected");
      if(exp.err) return res;

      const ret = this.parser.parse(exp, res);

      this.scope.addStatement(exp);

      return ret;
    }

    if(Structs[res.token]) {
      const what = res.token;
      const struct = exp.clone();

      res2 = this.pullStruct(what, struct);

      const { definition, unnamed } = struct;

      exp.tokens.push({ ...res, definition, isType: true, unnamed, type: struct.err || ! this.getType(struct.type) ? {} : this.getType(struct.type) });
    } else if(this.getType(res.token)) exp.tokens.push({ ...res, isType: true, type: this.getType(res.token) });
    else if(res.number || res.symbol || res.string || res.operator) exp.tokens.push(res);
    else this.addErr(exp, res, `unexpected token in expression: '${res.token}'`);

    return this.pullExpression(exp, res2);
  }

  pullGlobal() {
    const res = this.pull();

    if(res.eof) return res;

    return this.pullStatement(new Context().setGlobal(), res);
  }

  pullStatement(context, res) {
    if(! res) res = this.pull();

    if(res.token === "typedef") {
      context.setTypedef().delEnd("{");
      res = null;
    }

    res = this.pullExpression(context, res);

    if(res.token === ";") return null;
    if(context.err) return res;
    if(res.token === "{") return this.pullBlock(res.scope);

    if(res.eof) return this.addErr(context, res, "unexpected end of file when ';' expected");

    throw Error("TODO");
  }

  pullStruct(what, struct, res) {
    const addStruct = name => {
      this.scope.addStruct(what, struct, true);
      struct.definition = true;
      struct.type = this.scope.getType(`${what} ${name}`).type;
    };

    if(! res) res = this.pull();
    if(res.eof) return this.addErr(res, "unexpected end of file when identifier or '{' expected");

    if(struct.name) {
      if(struct.param || res.eof) return res;

      if(res.token === "{") {
        const type = struct.type ? this.scope.getType(struct.type) : {};

        if(type.defined) this.addErr(struct, res, `${what} already defined: '${struct.name}'`);
        struct.definition = true;
        return what === "contract" ? this.pullContract(struct) : this.pullStructBody(what, struct);
      }

      return res;
    } else if(res.symbol) {
      if(this.reserved[res.token]) this.addErr(struct, res, `unexpected reserved token when identifier or '{' expected: '${res.token}'`);
      else {
        const prev = this.scope.getType(`${what} ${res.token}`);

        struct.name = res.token;

        if(prev) {
          struct.type = prev.type;
          return this.pullStruct(what, struct);
        } else addStruct(res.token);
      }
    } else if(res.token === "{") {
      struct.unnamed = true;
      struct.definition = true;

      if(what === "contract") {
        if(this.scope.getType("contract default")) this.addErr(struct, res, "redefined type: 'contract default'");
        addStruct((struct.name = "default"));

        return this.pullContract(struct);
      }

      return this.pullStructBody(what, struct);
    } else return this.addErr(struct, res, `unexpected token when identifier or '{' expected: '${res.token}'`);

    return this.pullStruct(what, struct);
  }

  pullStructBody(what, struct, res) {
    struct.addEnd("}");
    struct.scope = this.pushScope();
    struct.scope[what] = true;

    do {
      if(! res) res = this.pull();
      if(res.eof) return this.addErr(struct, res, "unexpected end of file when type or '}' expected");

      if(struct.isEnd(res)) {
        this.popScope();
        const { attrs, size, type } = this.scope.addStruct(what, struct);
        struct.type = type;
        if(attrs.length === 0) this.addWarn(res, `empty ${what} declaration`);
        if(size > 32 && what === "packet") this.addErr(struct, res, "packet size exceeds 32 bytes length");
        if(res.token === "}") return null;
        return this.addErr(struct, res, `unexpected token when type or '}' expected: '${res.token}'`);
      }

      struct.tokens = [];
      res = this.pullExpression(new Context(struct).setAttribute(), res);
      if(res.token === ";") res = null;
      else this.addErr(struct, res, `unexpected token when ';' expected: '${res.token}'`);
    } while(true);
  }

  pushScope(contract) {
    return (this.scope = new Scope(this.scope, contract));
  }

  signFunc(func) {
    func.extended = `${func.type.type} ${func.name}`;
    func.signature = "F" + func.name.length + func.name;

    func.scope.params.map((param, n) => {
      func.extended += (n ? ", " : "(") + (param.register ? "register " : "") + param.type.type + " " + param.name;
      func.signature += (param.register ? "_" : "") + param.type.short;
    });

    func.extended += func.scope.params.length ? ")" : "()";
    ["export", "pure", "stackless", "view"].map(m => (func[m] ? (func.extended += ` ${m}`) : ""));
  }
}

Compiler.prototype.reserved = {};
Compiler.prototype.modifiers = require("./modifiers");
"break case class continue contract do else for if map pack packet return sizeof struct switch typedef union unpack while".split(" ").map(r => (Compiler.prototype.reserved[r] = true));
Object.keys(Compiler.prototype.modifiers).map(r => (Compiler.prototype.reserved[r] = true));

module.exports = Compiler;
