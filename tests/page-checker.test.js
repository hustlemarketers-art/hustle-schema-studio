'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const checker = require('../dist/page-checker.js');

const codes = result => result.issues.map(issue => issue.code);

test('extracts mixed-case JSON-LD tags, quoted attributes and MIME parameters', () => {
  const result = checker.analyze('<TITLE>One &amp; Two</TITLE><ScRiPt data-test="a > b" TYPE="Application/LD+JSON; charset=utf-8">{"@type":"Organization","name":"A"}</sCrIpT>');
  assert.equal(result.page.title, 'One & Two');
  assert.equal(result.page.jsonLdBlocks, 1);
  assert.equal(result.documents[0].name, 'A');
  assert.equal(result.blocks[0].valid, true);
});

test('does not execute JavaScript or visit image, iframe, or script URLs', () => {
  globalThis.__schemaCheckerExecuted = false;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network must not be used'); };
  try {
    const result = checker.analyze('<script>globalThis.__schemaCheckerExecuted = true;<script type="application/ld+json">{"fake":true}</script><img src="https://invalid.test/pixel" onerror="globalThis.__schemaCheckerExecuted=true"><iframe src="https://invalid.test/"></iframe><script type="application/ld+json">{"safe":true}</script>');
    assert.equal(globalThis.__schemaCheckerExecuted, false);
    assert.deepEqual(result.documents, [{ safe: true }]);
  } finally { globalThis.fetch = previousFetch; delete globalThis.__schemaCheckerExecuted; }
});

test('skips HTML comments and raw text that resembles schema', () => {
  const source = '<!-- <script type="application/ld+json">{"comment":1}</script> --><textarea><script type="application/ld+json">{"textarea":1}</script></textarea><style>.x{content:"<script type=application/ld+json>{}</script>"}</style>';
  const result = checker.analyze(source);
  assert.equal(result.documents.length, 0);
  assert.ok(codes(result).includes('jsonld.not_found'));
});

test('keeps invalid JSON-LD errors when another block parses successfully', () => {
  const result = checker.analyze('<script type="application/ld+json">{"name":}</script><script type="application/ld+json">{"name":"Good"}</script>');
  assert.equal(result.page.jsonLdBlocks, 2);
  assert.equal(result.blocks[0].valid, false);
  assert.equal(result.blocks[1].valid, true);
  assert.equal(result.documents.length, 1);
  assert.equal(result.issues.find(issue => issue.code === 'jsonld.invalid_json').path, '$.blocks[0]');
});

test('handles escaped closing script strings and flags literal closing script strings', () => {
  const escaped = checker.analyze('<script type="application/ld+json">{"description":"<\\/script> is escaped"}</script>');
  assert.equal(escaped.blocks[0].valid, true);
  assert.equal(escaped.documents[0].description, '</script> is escaped');
  const literal = checker.analyze('<script type="application/ld+json">{"description":"</script> closes the tag"}</script>');
  assert.equal(literal.blocks[0].valid, false);
});

test('does not HTML-decode JSON script contents', () => {
  const result = checker.analyze('<script type="application/ld+json">{"name":"A &amp; B"}</script>');
  assert.equal(result.documents[0].name, 'A &amp; B');
});

test('resolves relative canonical only using a supplied HTTP(S) URL', () => {
  const source = '<link rel="alternate CANONICAL" href="../preferred?a=1&amp;b=2">';
  assert.equal(checker.analyze(source, 'https://example.com/path/page').page.canonical, 'https://example.com/preferred?a=1&b=2');
  const withoutBase = checker.analyze(source);
  assert.equal(withoutBase.page.canonical, '../preferred?a=1&b=2');
  assert.ok(codes(withoutBase).includes('page.canonical_unresolved'));
  const invalidBase = checker.analyze(source, 'javascript:alert(1)');
  assert.ok(codes(invalidBase).includes('page.url_invalid'));
});

test('finds conflicting canonicals but treats equivalent resolved URLs separately', () => {
  const conflict = checker.analyze('<link rel=canonical href="https://example.com/a"><link rel=canonical href="/b">', 'https://example.com/');
  assert.ok(codes(conflict).includes('page.canonical_conflict'));
  const equivalent = checker.analyze('<link rel=canonical href="https://example.com/a"><link rel=canonical href="/a">', 'https://example.com/');
  assert.ok(codes(equivalent).includes('page.canonical_multiple'));
  assert.ok(!codes(equivalent).includes('page.canonical_conflict'));
});

test('robots noindex and none use exact tokens, including Googlebot scope', () => {
  const result = checker.analyze('<meta name=robots content="max-snippet:1, x-noindex"><meta NAME=Googlebot content="none"><meta name=robots content="NOINDEX,follow"><meta name=bingbot content=noindex><meta http-equiv=refresh content="0;url=/new">');
  assert.deepEqual(result.page.robots.map(item => item.noindex), [false, true, true]);
  assert.equal(result.issues.filter(issue => issue.code === 'page.noindex').length, 2);
  assert.ok(codes(result).includes('page.meta_refresh'));
});

test('records other structured-data formats without pretending to validate them', () => {
  const result = checker.analyze('<div itemscope itemtype="https://schema.org/Person"></div><span vocab="https://schema.org/" typeof=Person></span>');
  assert.equal(result.page.hasMicrodata, true);
  assert.equal(result.page.hasRdfa, true);
  assert.ok(codes(result).includes('source.microdata_unchecked'));
  assert.ok(codes(result).includes('source.rdfa_unchecked'));
  assert.ok(codes(result).includes('source.limitations'));
});

test('untrusted attribute names do not change object prototypes', () => {
  const result = checker.analyze('<script __proto__="bad" constructor="bad" type="application/ld+json">{"__proto__":{"polluted":true}}</script>');
  assert.equal(result.blocks[0].valid, true);
  assert.equal({}.polluted, undefined);
});

test('limits source bytes and rejects non-text input', () => {
  assert.ok(codes(checker.analyze('é'.repeat(checker.MAX_HTML_BYTES / 2 + 1))).includes('source.too_large'));
  assert.ok(codes(checker.analyze({ html: 'no' })).includes('source.input_type'));
});

test('browser UMD export works without CommonJS, DOMParser or fetch', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const context = { URL: URL, TextEncoder: TextEncoder };
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/page-checker.js'), 'utf8'), context);
  assert.equal(typeof context.HustlePageChecker.analyze, 'function');
  assert.equal(context.HustlePageChecker.analyze('<script type=application/ld+json>{}</script>').documents.length, 1);
});

test('warns on external JSON-LD and explicitly states base-element limitation', () => {
  const result = checker.analyze('<base href="https://other.example/"><link rel=canonical href="/a"><script type=application/ld+json src="https://example.com/schema.json">{}</script>', 'https://example.com/');
  assert.equal(result.page.canonical, 'https://example.com/a');
  assert.ok(codes(result).includes('jsonld.external_src'));
  assert.ok(codes(result).includes('page.base_present'));
});
