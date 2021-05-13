"use strict";

const Modifiers = require("./modifiers");
const Types = require("./types");
const { bn, toHex } = require("./bn");
const modifiers = Object.keys(Modifiers);
const rules = [
  { type: "increment", next: "prev", tokens: ["++", "--"] },
  { type: "sign", next: "prev", tokens: ["+", "-"] },
  { type: "reference", next: "prev", tokens: ["$", "&", "*", "@"] },
  { type: "multiplication", next: "prev", tokens: ["*", "/", "%"], integer: true, left: true, right: true },
  { type: "addiction", next: "prev", tokens: ["+", "-"], integer: true, left: true, right: true }
];
const nrule = rules.length - 1;

rules.map((r, i) => {
  if(! r.next) return;
  if(r.next === "prev") return (r.next = i - 1);
});

// https://en.cppreference.com/w/cpp/language/operator_precedence

function hexSize(type) {
  return type.size < 32 ? "0x20" : toHex(type.size);
}

class RDPError extends Error {}

class Parser {
  constructor(compiler) {
    this.compiler = compiler;
  }

  advance() {
    if(this.pos !== this.tokens.length) this.pos++;
  }

  checkNumber(expression, current, token, left, unary) {
    if(! expression.type.integer) this.error(current, `invalid ${left ? "left" : "right"} operand of type '${expression.type.type}' to ${unary ? "unary" : "binary"} operator '${token}'`);

    return true;
  }

  consume(expected) {
    const current = this.current();

    if(current.eoe) {
      if(this.res.eof) this.error(this.res, `unexpected end of file when '${expected}' expected`);
      else this.error(this.res, `unexpected token when '${expected}' expected: '${this.res.token}'`);
    }
    if(current.token !== expected) this.error(current, `unexpected token when '${expected}' expected: '${current.token}'`);

    this.advance();
  }

  current() {
    return this.pos >= this.tokens.length ? { ...this.res, eoe: true } : this.tokens[this.pos];
  }

  error(context, token, msg) {
    this.compiler.addErr(context, token, msg);
    throw new RDPError(msg);
  }

  getType(type) {
    return this.compiler.getType(type);
  }

  is(rule, token) {
    const prev = this.prev();

    if(rule.tokens.indexOf(token.token) === -1) return false;

    switch(rule.type) {
    case "addiction":
      return prev.operator ? [")", "]"].indexOf(prev.token) !== -1 : true;

    case "sign":
      if(prev.boe) return true;
      return prev.operator ? [")", "]"].indexOf(prev.token) === -1 : false;
    }

    return true;
  }

  modifier(context) {
    let modifier;

    while(modifiers.indexOf((modifier = this.current()).token) !== -1) {
      this.advance();

      for(let i in Modifiers[modifier.token]) if(context[i]) this.error(modifier, `modifier '${modifier.token}' conflicts with modifier '${i}'`);
      if(context[modifier.token]) this.warning(modifier, `repeated modifier: '${modifier.token}'`);

      context.setDeclaration()[modifier.token] = modifier;
    }
  }

  next() {
    return this.pos >= this.tokens.length - 1 ? { ...this.res, eoe: true } : this.tokens[this.pos + 1];
  }

  parse(context, res) {
    try {
      this.pos = 0;
      this.res = res;
      this.tokens = context.tokens;

      const expression = this[context.attr || context.typedef ? "declaration" : "preModifier"](context);

      if(this.pos !== this.tokens.length) this.compiler.addErr(context, this.current(), `unexpected token in expression: '${this.current().token}'`);
      if(expression.scope && res.token === "{") res.scope = expression.scope;
    } catch(e) {
      if(! (e instanceof RDPError)) this.compiler.addErr(context, res, `DevelopmentError: ${e.stack}`);

      return res;
    }

    return res;
  }

  prev() {
    return ! this.pos ? { boe: true } : this.tokens[this.pos - 1];
  }

  warning(token, msg) {
    this.compiler.addWarn(token, msg);
  }

  // Descendent priorities

  preModifier(context) {
    this.modifier(context);

    return this[context.param ? "postModifier" : "declaration"](context);
  }

  declaration(context) {
    let current = this.current();
    const parse = () => this[context.param || context.typeonly ? "reference" : "comma"](context);
    const pos = this.pos;

    if(current.token === "(" && this.next().isType) {
      const round = this.round(context);

      if(round.isType) {
        context.setDeclaration();

        return parse();
      }

      this.pos = pos;
      throw Error("TODO");
    }

    if(current.isType) {
      if(current.token === "auto") {
        if(context.attr) this.error(context, current, "type auto not allowed for attributes");
        if(context.param) this.error(context, current, "type auto not allowed for parameters");
        if(context.typedef) this.error(context, current, "type auto not allowed for typedef");
      }

      context.setDeclaration().setType(current.type);
      this.advance();

      return { ...parse(), first: current };
    } else if(context.declaration && ! context.isEnd(current)) {
      if(! current.symbol) this.error(context, current, `unexpected token when type expected: '${current.token}'`);
      if(this.compiler.reserved[current.token]) this.error(context, current, `unexpected reserved token when type expected: '${current.token}'`);
      this.error(context, current, `unknown type name: '${current.token}'`);
    }

    return parse();
  }

  comma(context) {
    const parse = () => {
      const subContext = context.clone();

      if(context.typeonly) {
        const expression = this.declaration(subContext);
        const current = this.current();

        if(! context.isEnd(current)) this.error(context, current, `unexpected token when ',' or ')' expected: '${current.token}'`);

        return { ...subContext.type, isType: true };
      }

      if(context.declaration) {
        const expression =
          this[
            context.typedef || (context.attr && context.parent && context.parent.scope && context.parent.scope.struct)
              ? "reference"
              : context.attr
                ? "literal"
                : context.param
                  ? "preModifier"
                  : "postModifier"
          ](subContext);
        const current = this.current();
        const what = context.param ? "',' or ')'" : context.attr ? "';'" : "',' or ';'";

        if(! context.isEnd(current)) {
          if(! subContext.name) this.error(context, current, `unexpected token when ${what} expected: '${current.token}'`);
          this.error(context, current, `unexpected token when ${what} expected: '${current.token}'`);
        }

        this.compiler[context.typedef ? "addType" : subContext.scope ? "addFunction" : "addVariable"](subContext, this.current(), this.prev());

        if(subContext.scope) expression.scope = subContext.scope;

        return expression;
      }

      return this.assignment(context);
    };

    let left = parse();

    while(this.current().token === ",") {
      if(context.attr) this.error(context, this.current(), "unexpected token when ';' expected: ','");

      this.advance();
      context.delEnd("{");

      const current = parse();

      if(! left.list) {
        if(left.isType) {
          if(context.attr) this.error(context, this.current(), "type list not allawed for attributes");
          if(context.param) this.error(context, this.current(), "type list not allawed for parameters");
        }

        left = { ...left, list: [left] };
      }

      if(left.list[0].isType && ! current.isType) this.error(context, this.current(), "unexpected expression when type expected");
      if(current.isType && ! left.list[0].isType) this.error(context, this.current(), "unexpected type when expression expected");
      left.list.push(current);
    }

    return left;
  }

  postModifier(context) {
    this.expression = context;

    const left = this.assignment(context);

    this.modifier(context);
    if(this.current().token === "{") context.defined = true;

    return left;
  }

  assignment(context) {
    const left = this[context.declaration ? (context.param ? "declaration" : "function") : "arithmetic"](context, nrule);
    let current, subContext;

    if(["=", "+=", "-=", "*=", "/=", "%=", "<<=", ">>=", "&=", "^=", "|="].indexOf((current = this.current()).token) !== -1) {
      if(context.declaration && current.token === "=" && context.dim.length) this.error(context, current, "arrays can't be initialized");

      this.advance();
      subContext = context.clone().unsetDeclaration();

      const right = this.assignment(subContext, nrule);

      if(context.declaration) {
        if(current.token !== "=") this.error(context, current, `unexpected operator when '=' expected: '${current.token}'`);
        if(right.constant) context.val = right.hex;
      }

      const { first, type } = left;
      const rtype = right.type;

      if(current.token !== "=") this.error(context, current, `operator not yet implemented: '${current.token}'`);

      if(! left.lvalue) this.error(context, current, `left operand of operator '${current.token}' is not an lvalue`);

      if(type.integer && rtype.integer) {
        if(! type.signed && rtype.signed) this.warning(current, `type sign mismatch in assignment`);
      } else if(type.bytes && rtype.bytes) {
      } else if(type.pointer && rtype.pointer) {
        if(type.short !== rtype.short) this.warning(current, `pointer type mismatch in assignment`);
      } else this.error(context, current, `types mismatch in assignment`);

      if(rtype.size > type.size) this.warning(current, `type size mismatch in assignment`);

      return { first, left, op: current.token, right, type };
    }

    return left;
  }

  function(context) {
    const left = this.reference(context);

    if(this.current().token === "(") {
      context.scope = this.compiler.pushScope();
      this.advance();
      if(this.current().token !== ")") this.comma(context.clone().setParameter());
      this.consume(")");
      this.compiler.popScope();
    } else if(context.type.list) this.error(context, this.current(), "typelist allowed only for functions");

    return left;
  }

  arithmetic(context, n) {
    const rule = rules[n];
    let current, first, hex, lhex, lvalue, op, rhex, right, size, step, token, type;
    let left = rule.left ? this.arithmetic(context, rule.next) : {};

    const mergeTypes = () => {
      const ltype = left.type;
      const rtype = right.type;
      const size = ltype.size > rtype.size ? ltype.size : rtype.size;

      return Types[(ltype.signed || rtype.signed ? "int" : "uint") + size * 8];
    };

    const ops = { add: () => lhex.add(rhex), div: () => lhex.div(rhex), mod: () => lhex.mod(rhex), mul: () => lhex.mul(rhex), sub: () => lhex.sub(rhex) };

    const operate = op => (left = left.constant && right.constant ? { constant: true, first: left.first, hex: toHex(ops[op]()), type } : { first: left.first, left, op, right, type });

    while(this.is(rule, (current = this.current()))) {
      this.advance();
      right = rule.right ? this.arithmetic(context, rule.next) : {};
      lhex = left.constant ? bn(left.hex) : null;
      rhex = right.constant ? bn(right.hex) : null;
      ({ first, token } = current);

      switch(rule.type) {
      case "addiction":
        if(left.type.pointer) {
          if(right.type.pointer) this.error(current, `invalid operands of type '${left.type.type}' and '${right.type.type}' to binary operator '${token}'`);
          this.checkNumber(right, current, token);
          size = hexSize(left.type);
          if(right.constant) right.hex = toHex(rhex.mul(bn(size)));
          else right = { ...right, left: { hex: size }, op: "mul", right };
          type = left.type;
        } else {
          this.checkNumber(left, current, token, true);
          if(right.type.pointer) {
            if(token === "-") this.checkNumber(right, current, token);
            size = hexSize(right.type);
            if(left.constant) left.hex = toHex(lhex.mul(bn(size)));
            else left = { ...left, left, op: "mul", right: { hex: size } };
            type = right.type;
          } else {
            this.checkNumber(right, current, token);
            type = mergeTypes();
          }
        }
        operate(token === "+" ? "add" : "sub");
        break;

      case "increment":
        right = this.arithmetic(context, n);
        ({ hex, lvalue, type } = right);
        if(! lvalue) this.error(current, `right operand of operator '${token}' must be an lvalue`);
        if(type.pointer) {
          size = hexSize(type);
          step = size;
        } else {
          this.checkNumber(right, current, token, false, true);
          step = "0x1";
        }
        return { first, op: token, right, step, type };

      case "multiplication":
        this.checkNumber(left, current, token, true);
        this.checkNumber(right, current, token);
        type = mergeTypes();
        operate(token === "*" ? "mul" : token === "/" ? "div" : "mod");
        break;

      case "reference":
        right = this.arithmetic(context, n);
        ({ hex, lvalue, type } = right);
        switch(token) {
        case "&":
          if(! lvalue) this.error(current, "right operand of operator '&' must be an lvalue");
          const ntype = type.type + "*";
          this.compiler.scope.addType(ntype, ntype);
          type = this.getType(ntype);

          return "mmap" in right ? { constant: true, first, hex: toHex(right.mmap), type } : { first, op: "reference", right, type };
        }

        this.error(current, JSON.stringify(right));
        break;

      case "sign":
        right = this.arithmetic(context, n);
        ({ hex, type } = right);
        op = "nop";
        if(token !== "+" || ! right.type.pointer) {
          this.checkNumber(right, current, token, false, true);
          if(token === "-") {
            op = "neg";
            type = Types["int" + type.size * 8];
            if(right.constant) hex = toHex(bn(hex).neg());
          }
        }

        return right.constant ? { constant: true, first, hex, type } : { first, op, right, type };
      }
    }

    if(rule.type === "increment") return this.square(context);

    return rule.left ? left : this.arithmetic(context, rule.next);
  }

  reference(context) {
    const prev = this.prev();
    const reference = this.current();

    if(["$", "&", "*", "@"].indexOf(reference.token) !== -1 && (prev.isType || prev.boe || (prev.operator && [")", "]"].indexOf(prev.token) === -1))) {
      this.advance();

      if(context.declaration) {
        let type = this.getType(context.type.type);
        let last = type.type.substring(type.type.length - 1);

        if(last === "&" || last === "@" || (last === "*" && reference.token === "$")) this.error(context, reference, `invalid type: '${type.type}${reference.token}'`);

        type = type.type + reference.token;

        this.compiler.scope.addType(type, type);
        context.type = this.getType(type);

        return this.reference(context);
      } else throw Error("TODO");
    }

    return context.typeonly ? { isType: true } : this.square(context);
  }

  square(context) {
    const left = this.round(context);

    while(this.current().token === "[") {
      this.advance();

      const next = this.current(context);
      const subContext = context.clone();
      let right;

      if(next.isType) {
        subContext.setTypeOnly();
        right = this.declaration(subContext, nrule);
      } else {
        subContext.unsetDeclaration();
        right = this.arithmetic(subContext, nrule);
      }

      if(context.declaration) {
        if(right.isType) context.dim.push({ ...subContext.type, first: right.first, isType: true });
        else {
          if(context.contract && ! right.constant) this.error(context, right.first, "contract arrays can't have dynamic dimentions");
          if(context.attr && ! right.constant) this.error(context, right.first, "attribute arrays can't have dynamic dimentions");
          if(right.type.type.substring(0, 4) !== "uint") this.error(context, next, "array dimention must be of type uintN");

          context.dim.push(right);
        }
      } else if(next.isType) this.error(context, next, `unexpected type when expression expected: '${right.type.type}'`);
      else this.error(context, next, `TODO`);

      this.consume("]");
    }

    return left;
  }

  round(context) {
    const current = this.current();

    if(current.token === "(") {
      const subContext = context.clone().addEnd(")");

      if(this.next().isType) subContext.setTypeOnly().addEnd(",");
      this.advance();
      const right = this.comma(subContext);
      this.consume(")");

      if(right.list) {
        if(right.list[0].isType) {
          const name = "(" + right.list.map(t => t.type).join(", ") + ")";
          this.compiler.scope.addType(name, name);
          const type = this.getType(name);
          context.setType(type);

          return { ...type, isType: true };
        }
      }

      return right;
    }

    return this.literal(context);
  }

  literal(context) {
    const compiler = this.compiler;
    const first = this.current();
    const prev = this.prev();
    const scope = compiler.scope;
    const token = first.token;

    this.advance();

    if(context.declaration) {
      const what = context.type ? "identifier" : "type";

      if(first.eof) this.error(context, first, `unexpected end of file when ${what} expected: '${token}'`);
      if(context.type && token === ";" && prev.definition) return {};
      if(! first.number && ! first.string && ! first.symbol) this.error(context, first, `unexpected token when ${what} expected: '${token}'`);
      if(compiler.reserved[token]) this.error(context, first, `unexpected reserved token when ${what} expected: '${token}'`);

      if(context.attr) {
        if(scope.getVariable(token, true)) this.error(context, first, `redefined attribute: '${token}'`);
      } else if(compiler.getType(token)) {
        if(context.type) this.error(context, first, `unexpected type when identifier expected: '${token}'`);
        context.type = compiler.getType(token);
        this.reference(context);

        return {};
      } else if(scope.getVariable(token, true) || scope.getFunction(token)) this.error(context, first, `redefined identifier: '${token}'`);

      context.name = token;
      const { name, type } = context;

      return { lvalue: true, name, type };
    }

    if(first.eoe) this.error(context, first, "unexpected end of expression");
    if(first.number || first.string) return { ...first, first };
    if(! first.symbol) this.error(context, first, `unexpected token in expression: '${token}'`);
    if(compiler.reserved[token]) this.error(context, first, `unexpected reserved token in expression: '${token}'`);

    let somthing;

    if((somthing = compiler.getType(token))) return { ...somthing, first, isType: true };
    if(scope.getFunction(token)) throw Error("TODO");
    if((somthing = scope.getVariable(token))) return this.postOperand({ ...somthing, first });
    this.error(context, first, `undefined symbol: '${token}'`);
  }

  postOperand(left) {
    const current = this.current();
    const { first, lvalue, type } = left;
    const { token } = current;
    let step;

    switch(token) {
    case "++":
    case "--":
      this.advance();
      if(! lvalue) this.error(current, `left operand of operator '${token}' is not an lvalue`);

      if(type.pointer) step = hexSize(type);
      else {
        this.checkNumber(left, current, token, true, true);
        step = "0x1";
      }
      return this.postOperand({ first, left, op: token, step, type });

    case "[":
    }

    return left;
  }
}

module.exports = Parser;
