'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const audit = require('../dist/audit-runner.js');
const engine = require('../dist/schema-engine.js');
const checker = require('../dist/page-checker.js');
const script = value => '<script type="application/ld+json">' + JSON.stringify(value) + '</script>';
const person = (name, extras) => ({ '@context': 'https://schema.org', '@type': 'Person', name: name, ...extras });
const findings = (report, code) => report.issues.filter(item => item.code === code);

test('a context in one script cannot hide a missing context in a separate script', () => {
  const report = audit.inspect(script(person('A')) + script({ '@type': 'Person', name: 'B' }), 'html');
  assert.ok(findings(report, 'missing_context').some(item => item.path === '$.blocks[1]'));
  assert.equal(report.nodes.length, 2);
  assert.equal(findings(report, 'limited_validation').length, 1);
  assert.equal(findings(report, 'source.context_scope').length, 1);
});

test('unsupported context warning survives when another script uses Schema.org', () => {
  const report = audit.inspect(script(person('A')) + script(person('B', { '@context': { '@vocab': 'https://other.example/' } })), 'html');
  assert.ok(report.issues.some(item => /context/.test(item.code) && item.path.startsWith('$.blocks[1]') && /not expanded|standard Schema.org|understand|unsupported/i.test(item.message)));
});

test('invalid first script does not renumber findings in later scripts', () => {
  const report = audit.inspect('<script type="application/ld+json">invalid</script>' + script({ '@context': 'https://schema.org', '@type': 'Product' }), 'html');
  assert.equal(findings(report, 'jsonld.invalid_json')[0].path, '$.blocks[0]');
  assert.ok(findings(report, 'missing_name').some(item => item.path === '$.blocks[1].name'));
  assert.equal(report.page.jsonLdBlocks, 2);
});

test('cross-script conflicts retain original script and array-item paths', () => {
  const identifier = 'https://example.com/#person';
  const report = audit.inspect(script([person('A', { '@id': identifier })]) + script(person('B', { '@id': identifier })), 'html');
  const conflicts = findings(report, 'conflicting_id');
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].path, '$.blocks[1].name');
  assert.ok(conflicts[0].message.includes('$.blocks[0][0]'));
});

test('within-script conflicts are emitted once and shared IDs resolve across scripts', () => {
  const identifier = 'https://example.com/#person';
  const conflict = audit.inspect(script({ '@context': 'https://schema.org', '@graph': [person('A', { '@id': identifier }), person('B', { '@id': identifier })] }), 'html');
  assert.equal(findings(conflict, 'conflicting_id').length, 1);
  const reference = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'A page', about: { '@id': identifier } };
  const shared = audit.inspect(script(reference) + script(person('A', { '@id': identifier })), 'html');
  assert.equal(findings(shared, 'external_reference').length, 0);
  const absent = audit.inspect(script(reference), 'html');
  assert.equal(findings(absent, 'external_reference').length, 1);
  assert.equal(findings(absent, 'external_reference')[0].path, '$.blocks[0].about');
});

test('empty arrays and scalar JSON roots remain errors in original script positions', () => {
  const report = audit.inspect(script([]) + script(null) + script(42), 'html');
  assert.ok(findings(report, 'empty_graph').some(item => item.path === '$.blocks[0]'));
  assert.ok(findings(report, 'invalid_root').some(item => item.path === '$.blocks[1]'));
  assert.ok(findings(report, 'invalid_root').some(item => item.path === '$.blocks[2]'));
  assert.equal(report.nodes.length, 0);
});

test('JSON mode delegates unchanged, while size, mode and input checks stop invalid requests', () => {
  const source = JSON.stringify(person('A'));
  assert.deepEqual(audit.inspect(source, 'json').issues, engine.validate(source).issues);
  assert.ok(findings(audit.inspect('é'.repeat(audit.MAX_INPUT_BYTES / 2 + 1), 'html'), 'input_too_large').length);
  assert.ok(findings(audit.inspect(' ', 'json'), 'empty_input').length);
  assert.ok(findings(audit.inspect(source, 'xml'), 'invalid_mode').length);
  assert.ok(findings(audit.inspect({}, 'html'), 'input_type').length);
});

test('browser UMD export and HTML source facts integrate without a DOM', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const context = { HustleSchema: engine, HustlePageChecker: checker, TextEncoder: TextEncoder };
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/audit-runner.js'), 'utf8'), context);
  const result = context.HustleAudit.inspect('<title>A &amp; B</title><link rel=canonical href="/page">' + script(person('A')), 'html', 'https://example.com/');
  assert.equal(result.page.title, 'A & B');
  assert.equal(result.page.canonical, 'https://example.com/page');
  assert.equal(result.nodes.length, 1);
});
