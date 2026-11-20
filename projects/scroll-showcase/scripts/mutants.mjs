// scripts/mutants.mjs: `npm run verify:mutants` (K20). Outside `verify`.
// WO-001 stub. WO-023 implements it: literal patches applied to a temp copy of site/, served via
// SITE_DIR on a spare PORT, each required to turn its named case(s) red, then the unmutated copy
// confirmed green; results to $EVIDENCE_DIR/mutants.json.
process.stdout.write('verify:mutants: not implemented until WO-023\n');
process.exit(2);
