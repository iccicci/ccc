"use strict";

const Modifiers = require("./modifiers");

const attrs = "attr contract declaration definition err exp export first func global intype memory param pure register scope stackless storage type typedef typelist typeonly unnamed view".split(" ");
const modifiers = Object.keys(Modifiers);

class Context {
  constructor(parent) {
    this.dim = [];

    if(parent) {
      this.parent = parent;
      this.end = parent.end.slice();
      this.tokens = parent.tokens;
    } else {
      this.end = [";"];
      this.tokens = [];
    }
  }

  addEnd(e) {
    if(this.end.indexOf(e) === -1) this.end.push(e);

    return this;
  }

  addErr(err) {
    this.err = err;
    if(this.parent) this.parent.addErr(err);
  }

  clone() {
    const c = new Context();

    attrs.map(a => {
      if(this[a]) c[a] = this[a];
    });
    c.dim = this.dim.slice();
    c.end = this.end.slice();
    c.parent = this;

    return c;
  }

  delEnd(e) {
    this.end = this.end.filter(a => a !== e);

    return this;
  }

  isEnd(res) {
    if(res.eof) return true;

    return this.end.indexOf(res.token) !== -1;
  }

  setAttribute() {
    this.setDeclaration().delEnd(",").attr = true;

    return this;
  }

  setContract() {
    this.contract = true;
    this.tokens = [];

    return this;
  }

  setDeclaration() {
    this.addEnd(",").declaration = true;

    return this;
  }

  setGlobal() {
    this.addEnd("{").global = true;

    return this;
  }

  setParameter() {
    this.delEnd(";").addEnd(")").param = true;
    delete this.global;
    delete this.scope;
    delete this.type;
    modifiers.map(m => delete this[m]);

    return this;
  }

  setType(type) {
    this.type = type;

    return this;
  }

  setTypeOnly() {
    this.typeonly = true;

    return this;
  }

  setTypedef() {
    this.setDeclaration().delEnd(",").typedef = true;

    return this;
  }

  unsetDeclaration() {
    delete this.declaration;

    return this;
  }
}

module.exports = Context;
