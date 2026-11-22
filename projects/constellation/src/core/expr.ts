// src/core/expr.ts — the tiny safe expression language. Signatures FROZEN; bodies are WO-002's.
// NEVER eval / new Function / with. A hand-written tokenizer + precedence-climbing parser.
//
// Grammar (lowest → highest precedence):
//   expr    := or
//   or      := and ('or' and)*
//   and     := not ('and' not)*
//   not     := 'not' not | cmp
//   cmp     := sum (('=='|'!='|'<'|'<='|'>'|'>=') sum)?
//   sum     := product (('+'|'-') product)*
//   product := unary (('*'|'/') unary)*
//   unary   := '-' unary | atom
//   atom    := number | string | 'true' | 'false' | 'null' | identifier | ref | '(' expr ')'
//   number  := digits ('.' digits)?          string := "..." or '...' with \" \' \\ escapes
//   ref     := '@' identifier | '@"' label '"' identifier := [A-Za-z_][A-Za-z0-9_]*
// Semantics: '+' concatenates if either side is a string, else numeric; - * / need numbers
// (else CoreError 'runtime'); x / 0 → 'runtime'. '<' etc. compare two numbers or two strings,
// else 'runtime'. '==' is strict JSON-value equality. Truthy: not (false | null | 0 | "").
// and/or short-circuit and return booleans. Unknown variable → 'runtime'. Max source length 500.
//
// Safety: there is no call syntax, no member access and no indexing, so no expression can reach
// a function or a prototype. Identifiers that name Object.prototype machinery (`constructor`,
// `__proto__`, `prototype`, anything starting `__`, …) are parse errors, and variables are read
// with an own-property check only.
import { CoreError } from './errors.ts';
import { formatNumber, hasOwn, isReservedName, showValue } from './internal.ts';
import type { BinaryOp, Expr, Scope, Value } from './types.ts';

const MAX_SOURCE = 500;
const MAX_DEPTH = 64;

type Token =
  | { t: 'num'; v: number; pos: number }
  | { t: 'str'; v: string; pos: number }
  | { t: 'id'; v: string; pos: number }
  | { t: 'ref'; v: string; pos: number }
  | { t: 'op'; v: string; pos: number }
  | { t: 'eof'; pos: number };

const KEYWORDS = new Set(['and', 'or', 'not', 'true', 'false', 'null']);
const CMP = new Set(['==', '!=', '<', '<=', '>', '>=']);

function fail(message: string, pos: number): never {
  throw new CoreError('parse', `${message} at column ${pos + 1}`, pos);
}

function describe(tok: Token): string {
  switch (tok.t) {
    case 'eof': return 'the end';
    case 'num': return formatNumber(tok.v);
    case 'str': return JSON.stringify(tok.v);
    case 'ref': return `@${tok.v}`;
    default: return `"${tok.v}"`;
  }
}

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const isDigit = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9';
  const isIdStart = (c: string | undefined) => c !== undefined && /[A-Za-z_]/.test(c);
  const isId = (c: string | undefined) => c !== undefined && /[A-Za-z0-9_]/.test(c);

  const readQuoted = (quote: string, start: number): [string, number] => {
    let j = start + 1;
    let text = '';
    for (;;) {
      const c = src[j];
      if (c === undefined) fail(`Expected a closing ${quote}`, start);
      if (c === quote) return [text, j + 1];
      if (c === '\\') {
        const e = src[j + 1];
        if (e === '"' || e === "'" || e === '\\') { text += e; j += 2; continue; }
        fail(`Unknown escape "\\${e ?? ''}" (only \\" \\' and \\\\ are allowed)`, j);
      }
      text += c;
      j++;
    }
  };

  while (i < src.length) {
    const c = src[i]!;
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    const pos = i;
    if (isDigit(c)) {
      while (isDigit(src[i])) i++;
      if (src[i] === '.') {
        if (!isDigit(src[i + 1])) fail('Expected a digit after "."', i + 1);
        i++;
        while (isDigit(src[i])) i++;
      }
      if (isIdStart(src[i])) fail(`Expected an operator after the number`, i);
      out.push({ t: 'num', v: Number(src.slice(pos, i)), pos });
      continue;
    }
    if (c === '"' || c === "'") {
      const [text, end] = readQuoted(c, i);
      out.push({ t: 'str', v: text, pos });
      i = end;
      continue;
    }
    if (c === '@') {
      if (src[i + 1] === '"') {
        const [text, end] = readQuoted('"', i + 1);
        if (!text.trim()) fail('Expected a label inside @"…"', i);
        out.push({ t: 'ref', v: text, pos });
        i = end;
        continue;
      }
      if (!isIdStart(src[i + 1])) fail('Expected a label after "@" (use @Name or @"Long name")', i);
      i++;
      while (isId(src[i])) i++;
      out.push({ t: 'ref', v: src.slice(pos + 1, i), pos });
      continue;
    }
    if (isIdStart(c)) {
      while (isId(src[i])) i++;
      const word = src.slice(pos, i);
      if (!KEYWORDS.has(word) && isReservedName(word)) fail(`"${word}" is a reserved name and can't be used`, pos);
      out.push({ t: 'id', v: word, pos });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '==' || two === '!=' || two === '<=' || two === '>=') { out.push({ t: 'op', v: two, pos }); i += 2; continue; }
    if ('+-*/<>()'.includes(c)) { out.push({ t: 'op', v: c, pos }); i++; continue; }
    if (c === '=') fail('Expected "==" to compare (a single "=" assigns, which expressions cannot do)', pos);
    fail(`Unexpected "${c}"`, pos);
  }
  out.push({ t: 'eof', pos: src.length });
  return out;
}

class Parser {
  #toks: Token[];
  #i = 0;
  #depth = 0;
  constructor(toks: Token[]) { this.#toks = toks; }

  get peek(): Token { return this.#toks[this.#i]!; }
  next(): Token { return this.#toks[this.#i++]!; }
  isOp(v: string): boolean { const t = this.peek; return t.t === 'op' && t.v === v; }
  isWord(v: string): boolean { const t = this.peek; return t.t === 'id' && t.v === v; }

  parse(): Expr {
    const e = this.or();
    const t = this.peek;
    if (t.t !== 'eof') {
      if (t.t === 'op' && t.v === '(') fail('Calls like name(…) aren\'t allowed: expressions only read values', t.pos);
      if (t.t === 'op' && CMP.has(t.v)) fail('Compare two things at a time (use "and" to join comparisons)', t.pos);
      if (t.t === 'op' && t.v === ')') fail('Unexpected ")"', t.pos);
      fail(`Expected an operator before ${describe(t)}`, t.pos);
    }
    return e;
  }

  or(): Expr {
    let left = this.and();
    while (this.isWord('or')) { this.next(); left = { kind: 'binary', op: 'or', left, right: this.and() }; }
    return left;
  }

  and(): Expr {
    let left = this.not();
    while (this.isWord('and')) { this.next(); left = { kind: 'binary', op: 'and', left, right: this.not() }; }
    return left;
  }

  not(): Expr {
    if (this.isWord('not')) { this.next(); return this.nest(() => ({ kind: 'unary', op: 'not', arg: this.not() })); }
    return this.cmp();
  }

  cmp(): Expr {
    const left = this.sum();
    const t = this.peek;
    if (t.t === 'op' && CMP.has(t.v)) { this.next(); return { kind: 'binary', op: t.v as BinaryOp, left, right: this.sum() }; }
    return left;
  }

  sum(): Expr {
    let left = this.product();
    while (this.isOp('+') || this.isOp('-')) { const op = (this.next() as { v: string }).v as BinaryOp; left = { kind: 'binary', op, left, right: this.product() }; }
    return left;
  }

  product(): Expr {
    let left = this.unary();
    while (this.isOp('*') || this.isOp('/')) { const op = (this.next() as { v: string }).v as BinaryOp; left = { kind: 'binary', op, left, right: this.unary() }; }
    return left;
  }

  unary(): Expr {
    if (this.isOp('-')) { this.next(); return this.nest(() => ({ kind: 'unary', op: '-', arg: this.unary() })); }
    return this.atom();
  }

  atom(): Expr {
    const t = this.next();
    switch (t.t) {
      case 'num': return { kind: 'num', value: t.v };
      case 'str': return { kind: 'str', value: t.v };
      case 'ref': return { kind: 'ref', label: t.v };
      case 'id':
        if (t.v === 'true' || t.v === 'false') return { kind: 'bool', value: t.v === 'true' };
        if (t.v === 'null') return { kind: 'null' };
        if (KEYWORDS.has(t.v)) fail(`Expected a value before "${t.v}"`, t.pos);
        return { kind: 'var', name: t.v };
      case 'op':
        if (t.v === '(') {
          const inner = this.nest(() => this.or());
          if (!this.isOp(')')) fail('Expected ")"', this.peek.pos);
          this.next();
          return inner;
        }
        fail(`Expected a value before "${t.v}"`, t.pos);
      // falls through: fail() never returns
      case 'eof':
        fail('Expected a value', t.pos);
    }
  }

  nest<T>(fn: () => T): T {
    if (++this.#depth > MAX_DEPTH) fail('That expression nests too deeply', this.peek.pos);
    try { return fn(); } finally { this.#depth--; }
  }
}

/** Throws CoreError 'parse' with `pos` and a message like `Expected ")" at column 12`. */
export function parseExpr(source: string): Expr {
  if (typeof source !== 'string') throw new CoreError('parse', 'Expected an expression (text) at column 1', 0);
  if (source.length > MAX_SOURCE) fail(`Expressions hold up to ${MAX_SOURCE} characters`, MAX_SOURCE);
  if (!source.trim()) fail('Expected a value', 0);
  return new Parser(tokenize(source)).parse();
}

function runtime(message: string): never {
  throw new CoreError('runtime', message);
}

function needNumbers(op: string, a: Value, b: Value): [number, number] {
  if (typeof a === 'number' && typeof b === 'number') return [a, b];
  const verb = op === '-' ? 'subtract' : op === '*' ? 'multiply' : op === '/' ? 'divide' : 'add';
  return runtime(`Can't ${verb} ${showValue(a)} and ${showValue(b)}: both sides need to be numbers.`);
}

function finite(n: number): number {
  if (!Number.isFinite(n)) runtime('That number is too large to keep.');
  return n;
}

function concatText(v: Value): string {
  return typeof v === 'number' ? formatNumber(v) : String(v);
}

export function evaluate(expr: Expr, scope: Scope): Value {
  switch (expr.kind) {
    case 'num': return expr.value;
    case 'str': return expr.value;
    case 'bool': return expr.value;
    case 'null': return null;
    case 'var':
      if (!hasOwn(scope.vars, expr.name)) runtime(`There is no variable called "${expr.name}" yet.`);
      return scope.vars[expr.name] as Value;
    case 'ref': return scope.ref(expr.label);
    case 'unary': {
      const v = evaluate(expr.arg, scope);
      if (expr.op === 'not') return !isTruthy(v);
      if (typeof v !== 'number') runtime(`Can't negate ${showValue(v)}: it needs to be a number.`);
      return -v;
    }
    case 'binary': {
      if (expr.op === 'and') return isTruthy(evaluate(expr.left, scope)) && isTruthy(evaluate(expr.right, scope));
      if (expr.op === 'or') return isTruthy(evaluate(expr.left, scope)) || isTruthy(evaluate(expr.right, scope));
      const a = evaluate(expr.left, scope);
      const b = evaluate(expr.right, scope);
      switch (expr.op) {
        case '+':
          if (typeof a === 'string' || typeof b === 'string') return concatText(a) + concatText(b);
          { const [x, y] = needNumbers('+', a, b); return finite(x + y); }
        case '-': { const [x, y] = needNumbers('-', a, b); return finite(x - y); }
        case '*': { const [x, y] = needNumbers('*', a, b); return finite(x * y); }
        case '/': {
          const [x, y] = needNumbers('/', a, b);
          if (y === 0) runtime(`Can't divide ${formatNumber(x)} by 0.`);
          return finite(x / y);
        }
        case '==': return a === b;
        case '!=': return a !== b;
        case '<': case '<=': case '>': case '>=': {
          const bothNum = typeof a === 'number' && typeof b === 'number';
          const bothStr = typeof a === 'string' && typeof b === 'string';
          if (!bothNum && !bothStr) runtime(`Can't compare ${showValue(a)} with ${showValue(b)}: both sides need to be numbers, or both text.`);
          const x = a as number | string, y = b as number | string;
          return expr.op === '<' ? x < y : expr.op === '<=' ? x <= y : expr.op === '>' ? x > y : x >= y;
        }
      }
    }
  }
  return runtime('Unknown expression.');
}

/** Labels referenced with @ (deduplicated, in source order). */
export function references(expr: Expr): string[] {
  const seen = new Set<string>();
  walk(expr, (e) => { if (e.kind === 'ref') seen.add(e.label); });
  return [...seen];
}

/** Variable names read by an expression (deduplicated, in source order). Core-internal helper. */
export function variablesOf(expr: Expr): string[] {
  const seen = new Set<string>();
  walk(expr, (e) => { if (e.kind === 'var') seen.add(e.name); });
  return [...seen];
}

function walk(expr: Expr, visit: (e: Expr) => void): void {
  visit(expr);
  if (expr.kind === 'unary') walk(expr.arg, visit);
  else if (expr.kind === 'binary') { walk(expr.left, visit); walk(expr.right, visit); }
}

export function isTruthy(value: Value): boolean {
  return !(value === false || value === null || value === 0 || value === '');
}

// ── printing (for trace notes) ────────────────────────────────────────────────────────────
const PREC: Record<BinaryOp, number> = { or: 1, and: 2, '==': 4, '!=': 4, '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6 };

/**
 * Source-like text. `leaf` decides how leaves read: by default refs print as their bare label
 * ("Boiling Point"), which is how people say them. Core-internal helper.
 */
export function printExpr(expr: Expr, leaf?: (e: Expr) => string | undefined): string {
  const go = (e: Expr, parent: number, right: boolean): string => {
    const custom = leaf?.(e);
    if (custom !== undefined) return custom;
    switch (e.kind) {
      case 'num': return formatNumber(e.value);
      case 'str': return JSON.stringify(e.value);
      case 'bool': return String(e.value);
      case 'null': return 'null';
      case 'var': return e.name;
      case 'ref': return e.label;
      case 'unary': {
        const text = e.op === 'not' ? `not ${go(e.arg, 3, false)}` : `-${go(e.arg, 7, false)}`;
        return parent > (e.op === 'not' ? 3 : 7) ? `(${text})` : text;
      }
      case 'binary': {
        const p = PREC[e.op];
        const text = `${go(e.left, p, false)} ${e.op} ${go(e.right, p, true)}`;
        return parent > p || (parent === p && (right || p === 4)) ? `(${text})` : text;
      }
    }
  };
  return go(expr, 0, false);
}
