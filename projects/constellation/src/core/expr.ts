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
import { notImplemented } from './errors.ts';
import type { Expr, Scope, Value } from './types.ts';

/** Throws CoreError 'parse' with `pos` and a message like `Expected ")" at column 12`. */
export function parseExpr(source: string): Expr {
  void source;
  return notImplemented('parseExpr');
}

export function evaluate(expr: Expr, scope: Scope): Value {
  void [expr, scope];
  return notImplemented('evaluate');
}

/** Labels referenced with @ (deduplicated, in source order). */
export function references(expr: Expr): string[] {
  void expr;
  return notImplemented('references');
}

export function isTruthy(value: Value): boolean {
  void value;
  return notImplemented('isTruthy');
}
