import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CoreError, evaluate, isTruthy, parseExpr, references } from '../../src/core/index.ts';
import type { Scope, Value } from '../../src/core/index.ts';
import { printExpr } from '../../src/core/expr.ts';

const labels: Record<string, Value> = { Temperature: 20, 'Boiling Point': 100, Name: 'Kettle', Empty: null };
const scope = (vars: Record<string, Value> = {}): Scope => ({
  vars,
  ref(label) {
    if (!Object.prototype.hasOwnProperty.call(labels, label)) throw new CoreError('runtime', `${label} no longer exists.`);
    return labels[label]!;
  },
});
const run = (src: string, vars?: Record<string, Value>) => evaluate(parseExpr(src), scope(vars));
const parseError = (src: string, pattern?: RegExp) => assert.throws(() => parseExpr(src), (e: unknown) => e instanceof CoreError && e.code === 'parse' && typeof e.pos === 'number' && (!pattern || pattern.test(e.message)), src);
const runtimeError = (src: string, vars?: Record<string, Value>, pattern?: RegExp) =>
  assert.throws(() => run(src, vars), (e: unknown) => e instanceof CoreError && e.code === 'runtime' && (!pattern || pattern.test(e.message)), src);

test('[U-expr-1] grammar table: precedence, associativity, literals, strings, refs, not', () => {
  const table: Array<[string, Value]> = [
    ['1 + 2 * 3', 7],
    ['(1 + 2) * 3', 9],
    ['10 - 4 - 3', 3],
    ['12 / 3 / 2', 2],
    ['-2 * -3', 6],
    ['- (1 + 2)', -3],
    ['2.5 + 0.5', 3],
    ['0.1 + 0.2 == 0.30000000000000004', true],
    ['1 + 2 < 4', true],
    ['not 1 < 2', false],
    ['not not 0', false],
    ['true and false or true', true],
    ['true or false and false', true],
    ['not true or true', true],
    ['null == null', true],
    ['"a" + 1', 'a1'],
    ["'it\\'s' + \"\\\"q\\\"\" + '\\\\'", 'it\'s"q"\\'],
    ['"b" < "c"', true],
    ['@Temperature + 1', 21],
    ['@"Boiling Point" - @Temperature', 80],
    ['@Name + " on"', 'Kettle on'],
    ['x * 2', 10],
    ['3 != 3', false],
    ['1 <= 1 and 2 >= 3', false],
  ];
  for (const [src, want] of table) assert.deepEqual(run(src, { x: 5 }), want, src);
  parseError('1 < 2 == true', /Compare two things at a time/); // comparisons don't chain
});

test('[U-expr-2] parse errors carry a column and a plain message', () => {
  assert.throws(() => parseExpr('(1 + 2'), (e: unknown) => e instanceof CoreError && e.message === 'Expected ")" at column 7' && e.pos === 6);
  parseError('1 +', /Expected a value at column 4/);
  parseError('"open', /closing "/);
  parseError('@', /label after "@"/);
  parseError('@""', /label inside/);
  parseError('1.', /digit after/);
  parseError('a = 1', /"=="/);
  parseError('a ; b', /Unexpected ";"/);
  parseError('"\\n"', /Unknown escape/);
  parseError('', /Expected a value/);
  parseError('1 2', /Expected an operator/);
  parseError('x'.repeat(501), /up to 500 characters/);
  parseError('9'.repeat(400), /^That number is too large to keep at column 1$/); // F-008: would be Infinity
  parseError('1 + ' + '9'.repeat(309) + '.5', /too large/);
  assert.equal(run('9'.repeat(300)), Number('9'.repeat(300)), 'large but finite is fine');
  parseError('('.repeat(80) + '1' + ')'.repeat(80), /nests too deeply/);
});

test('[U-expr-3] malicious input is a parse error, never code', () => {
  for (const src of ['constructor', '__proto__', 'prototype', 'x.constructor', 'alert(1)', 'constructor.constructor("return 1")()', 'globalThis', '`template`', 'a[0]', 'this', '__defineGetter__', 'toString']) {
    if (src === 'globalThis' || src === 'this') {
      // Plain identifiers parse, but only ever read the pathway's own variables.
      assert.throws(() => run(src), (e: unknown) => e instanceof CoreError && e.code === 'runtime');
      continue;
    }
    parseError(src);
  }
  parseError('alert(1)', /Calls like name\(…\) aren't allowed/);
  parseError('constructor', /reserved name/);
});

test('[U-expr-4] no eval, Function or with anywhere in core', () => {
  const dir = new URL('../../src/core/', import.meta.url);
  for (const f of readdirSync(dir)) {
    const code = readFileSync(new URL(f, dir), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(code, /\beval\s*\(|new\s+Function\b|\bFunction\s*\(|\bwith\s*\(/, f);
  }
});

test('[U-expr-5] runtime semantics: numeric ops need numbers, divide by zero, unknown names', () => {
  runtimeError('"a" - 1', {}, /Can't subtract "a" and 1: both sides need to be numbers\./);
  runtimeError('true * 2', {}, /multiply/);
  runtimeError('4 / 0', {}, /Can't divide 4 by 0\./);
  runtimeError('1 < "2"', {}, /both sides need to be numbers, or both text/);
  runtimeError('null < 1');
  runtimeError('missing + 1', {}, /There is no variable called "missing" yet\./);
  runtimeError('@Nowhere', {}, /Nowhere no longer exists\./);
  runtimeError('-"x"', {}, /negate/);
});

test('[U-expr-6] and/or short-circuit and return booleans', () => {
  assert.equal(run('false and missing'), false);
  assert.equal(run('true or missing'), true);
  assert.equal(run('1 and "x"'), true);
  assert.equal(run('0 or ""'), false);
});

test('[U-expr-7] isTruthy: false, null, 0 and "" are falsy; everything else truthy', () => {
  for (const v of [false, null, 0, ''] as Value[]) assert.equal(isTruthy(v), false, String(v));
  for (const v of [true, 1, -1, 'x', '0'] as Value[]) assert.equal(isTruthy(v), true, String(v));
});

test('[U-expr-8] references: @labels deduplicated in source order; vars do not count', () => {
  assert.deepEqual(references(parseExpr('@b + @"Long label" * @b - x + @a')), ['b', 'Long label', 'a']);
  assert.deepEqual(references(parseExpr('1 + 2')), []);
});

test('[U-expr-9] printing round-trips through the parser with minimal parentheses', () => {
  for (const src of ['1 + 2 * 3', '(1 + 2) * 3', '1 - (2 - 3)', 'not (a and b)', 'not a < b', '-(x + 1)', 'a or b and c', '(a or b) and c', '"q" + @"Boiling Point"', '(a < b) == c']) {
    const ast = parseExpr(src);
    const printed = printExpr(ast);
    assert.deepEqual(parseExpr(printed.replace('Boiling Point', '@"Boiling Point"')), ast, `${src} → ${printed}`);
  }
  assert.equal(printExpr(parseExpr('heat < @"Boiling Point"')), 'heat < Boiling Point');
  assert.equal(printExpr(parseExpr('(1 + 2) * 3')), '(1 + 2) * 3');
});
