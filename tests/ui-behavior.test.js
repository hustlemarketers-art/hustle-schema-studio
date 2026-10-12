'use strict';
// Functional DOM/event harness only. This does not test browser layout, HTML parsing,
// native form constraints, clipboard permissions or visual accessibility.
// app.js and the schema engine are real; the audit interface is instrumented.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../dist/schema-engine.js');
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');

function harness() {
  const downloads = [], auditCalls = [], objectUrls = new Map();
  const descendants = node => [node, ...node.children.flatMap(descendants)];
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null;
      this.listeners = new Map(); this.attributes = {}; this.dataset = {}; this.style = {};
      this.value = ''; this.id = ''; this.className = ''; this._text = '';
      this.hidden = false; this.disabled = false; this.files = [];
      this.classList = { toggle: (name, force) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        const include = force === undefined ? !names.has(name) : force;
        if (include) names.add(name); else names.delete(name);
        this.className = [...names].join(' '); return include;
      } };
    }
    get textContent() { return this._text + this.children.map(n => n.textContent).join(''); }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    set innerHTML(_) { throw new Error('The application attempted HTML injection into the fake DOM.'); }
    get childElementCount() { return this.children.length; }
    append(...nodes) { for (const node of nodes) { if (node.parentNode) node.remove(); node.parentNode = this; this.children.push(node); } }
    replaceChildren(...nodes) { this.children.forEach(n => { n.parentNode = null; }); this.children = []; this._text = ''; this.append(...nodes); }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(n => n !== this); this.parentNode = null; }
    setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'id') this.id = String(value); }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(type, handler) { const handlers = this.listeners.get(type) || []; handlers.push(handler); this.listeners.set(type, handlers); }
    async fire(type, extras) {
      const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extras };
      for (const handler of this.listeners.get(type) || []) await handler(event);
      return event;
    }
    click() {
      if (this.disabled) return;
      if (this.tagName === 'A' && this.download) downloads.push({ filename: this.download, blob: objectUrls.get(this.href) });
      return this.fire('click');
    }
    scrollIntoView() {}
    select() {}
  }
  const body = new Element('body');
  // IDs and navigation targets come from the actual page; nesting is irrelevant to
  // the methods used by app.js. Generated fields/cards retain their real parent tree.
  for (const match of html.matchAll(/<([a-z][\w:-]*)\b[^>]*\bid="([^"]+)"[^>]*>/gi)) {
    const node = new Element(match[1]); node.id = match[2];
    node.hidden = /\bhidden(?:\s|=|>)/i.test(match[0]);
    node.disabled = /\bdisabled(?:\s|=|>)/i.test(match[0]);
    body.append(node);
  }
  const navigation = ['build', 'check', 'install'].map(view => { const button = new Element('button'); button.dataset.view = view; body.append(button); return button; });
  const brand = new Element('a'); brand.className = 'brand'; body.append(brand);
  const document = {
    body,
    createElement: tag => new Element(tag),
    getElementById: id => descendants(body).find(node => node.id === id) || null,
    querySelectorAll: selector => selector === '[data-view]' ? navigation : [],
    querySelector: selector => selector === '.brand' ? brand : null,
    execCommand: () => false
  };
  const audit = { inspect(input, mode, pageUrl) {
    auditCalls.push({ input, mode, pageUrl });
    if (mode === 'json') return { ...engine.validate(input), page: null };
    return { issues: [{ severity: 'info', code: 'HARNESS_HTML', path: '$', message: 'HTML audit interface invoked.' }], nodes: [], page: { title: '<img src=x onerror=alert(1)>', canonical: pageUrl, jsonLdBlocks: 0 } };
  } };
  const window = { HustleSchema: engine, HustleAudit: audit, addEventListener() {}, confirm: () => true };
  class HarnessURL extends URL {
    static createObjectURL(blob) { const value = 'blob:harness-' + objectUrls.size; objectUrls.set(value, blob); return value; }
    static revokeObjectURL(value) { objectUrls.delete(value); }
  }
  const context = vm.createContext({ window, document, Option: function (label, value) { const option = new Element('option'); option.textContent = label; option.value = value; return option; }, navigator: { clipboard: { writeText: async () => {} } }, URL: HarnessURL, Blob, TextEncoder, setTimeout: () => 1, clearTimeout() {}, console });
  vm.runInContext(source, context, { filename: 'dist/app.js', timeout: 2000 });
  const get = id => { const node = document.getElementById(id); assert.ok(node, 'Missing UI element: ' + id); return node; };
  const choose = async id => {
    get('template-search').value = ''; await get('template-search').fire('input');
    const label = engine.TYPES.find(t => t.id === id).label;
    const button = get('template-list').children.find(node => node.textContent === label);
    assert.ok(button, 'Missing template: ' + id); await button.click();
  };
  const form = values => { for (const [key, value] of Object.entries(values)) get('field-' + key).value = String(value); };
  const submit = () => get('schema-form').fire('submit');
  const graph = () => JSON.parse(get('code-output').textContent.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, ''));
  return { get, choose, form, submit, graph, descendants, auditCalls, downloads };
}

test('app initializes from all 12 templates and builds metadata-driven fields and search', async () => {
  const h = harness();
  assert.equal(h.get('template-list').children.length, 12);
  assert.equal(h.get('template-title').textContent, 'Organization');
  assert.equal(h.get('field-name').required, true);
  assert.equal(h.get('field-url').type, 'url');
  assert.equal(h.get('field-url').attributes['aria-describedby'], 'help-url');
  assert.equal(h.get('copy-code').disabled, true);
  await h.choose('Product');
  assert.equal(h.get('field-price').type, 'number'); assert.equal(h.get('field-price').step, 'any');
  assert.equal(h.get('field-availability').tagName, 'SELECT');
  assert.ok(h.get('field-availability').children.some(option => option.value === 'InStock'));
  h.get('template-search').value = 'Service'; await h.get('template-search').fire('input');
  assert.equal(h.get('template-list').children.length, 1); assert.equal(h.get('template-list').children[0].textContent, 'Service');
});

test('form submission creates graph, handles required data and renders hostile text without HTML', async () => {
  const h = harness();
  await h.submit(); assert.equal(h.get('form-error').hidden, false); assert.match(h.get('form-error').textContent, /Name is required/);
  const hostile = '</script><img src=x onerror=alert(1)>';
  h.form({ name: hostile, id: 'https://example.com/#organization', url: 'https://example.com/' }); await h.submit();
  assert.equal(h.graph()['@graph'][0].name, hostile); assert.equal(h.get('entity-count').textContent, '1 entity');
  const strong = h.descendants(h.get('entity-list')).find(node => node.tagName === 'STRONG');
  assert.equal(strong.textContent, hostile); assert.equal(strong.children.length, 0);
  assert.ok(!h.get('code-output').textContent.includes('<img'));
  await h.submit(); assert.match(h.get('form-error').textContent, /already in your graph/); assert.equal(h.get('entity-count').textContent, '1 entity');
});

test('editing an entity survives template switches and updates the same graph item', async () => {
  const h = harness();
  h.form({ name: 'Original company', id: 'https://example.com/#organization' }); await h.submit();
  await h.choose('Person'); h.form({ name: 'Alex', id: 'https://example.com/#person' }); await h.submit();
  const edit = h.descendants(h.get('entity-list')).find(node => node.title === 'Edit Organization'); await edit.click();
  h.form({ name: 'Edited company' }); await h.choose('Product'); await h.choose('Organization');
  assert.equal(h.get('field-name').value, 'Edited company'); assert.equal(h.get('add-entity').textContent, 'Save entity changes');
  await h.submit();
  assert.equal(h.graph()['@graph'].length, 2); assert.equal(h.graph()['@graph'][0].name, 'Edited company');
  assert.equal(h.graph()['@graph'][1].name, 'Alex'); assert.equal(h.get('add-entity').textContent, 'Add to page schema ＋');
});

test('check graph invokes audit and input, URL or graph changes invalidate the downloadable report', async () => {
  const h = harness(); h.form({ name: 'Company' }); await h.submit();
  await h.get('check-graph').click();
  assert.equal(h.auditCalls.length, 1); assert.equal(h.auditCalls[0].mode, 'json');
  assert.equal(JSON.parse(h.auditCalls[0].input)['@graph'][0].name, 'Company');
  assert.equal(h.get('view-check').hidden, false); assert.equal(h.get('check-results').hidden, false); assert.equal(h.get('download-report').disabled, false);
  await h.get('check-input').fire('input'); assert.equal(h.get('download-report').disabled, true); assert.equal(h.get('check-results').hidden, true);
  await h.get('run-check').click(); await h.get('page-url').fire('input'); assert.equal(h.get('download-report').disabled, true);
  await h.get('run-check').click(); h.form({ name: 'Another company' }); await h.submit();
  assert.equal(h.get('download-report').disabled, true); assert.equal(h.get('check-empty').hidden, false);
});

test('homepage starter also invalidates a previously inspected pasted report', async () => {
  const h = harness(); h.get('check-input').value = '{"@context":"https://schema.org","@type":"Person","name":"Alex"}';
  await h.get('run-check').click(); assert.equal(h.get('download-report').disabled, false);
  await h.get('hustle-starter').click();
  assert.equal(h.graph()['@graph'].length, 2);
  assert.equal(h.get('download-report').disabled, true); assert.equal(h.get('check-results').hidden, true);
});

test('file import enforces the 2 MiB limit and chooses HTML mode without rendering imported text', async () => {
  const h = harness(); let read = false;
  h.get('import-file').files = [{ name: 'huge.html', size: 2 * 1024 * 1024 + 1, async text() { read = true; return 'unreachable'; } }];
  h.get('import-file').value = 'huge.html'; await h.get('import-file').fire('change');
  assert.equal(read, false); assert.match(h.get('toast').textContent, /under 2 MiB/); assert.equal(h.get('import-file').value, '');
  const contents = '<html><script>alert("do not execute")</script></html>';
  h.get('import-file').files = [{ name: 'page.html', size: contents.length, async text() { return contents; } }];
  await h.get('import-file').fire('change');
  assert.equal(h.get('check-input').value, contents); assert.equal(h.get('page-url-wrap').hidden, false); assert.equal(h.get('download-report').disabled, true);
  await h.get('run-check').click(); assert.equal(h.auditCalls[0].mode, 'html');
  assert.match(h.get('page-facts').textContent, /<img src=x/); assert.ok(!h.descendants(h.get('page-facts')).some(node => node.tagName === 'IMG'));
  h.get('check-input').value = 'x'.repeat(2 * 1024 * 1024 + 1); await h.get('run-check').click();
  assert.equal(h.auditCalls.length, 1); assert.match(h.get('findings').textContent, /INPUT_TOO_LARGE/);
});

test('JSON and HTML snippet download contain the current graph, and clearing resets controls', async () => {
  const h = harness(); h.form({ name: 'Saved company', id: 'https://example.com/#organization' }); await h.submit();
  await h.get('download-json').click(); await h.get('download-snippet').click();
  assert.deepEqual(h.downloads.map(item => item.filename), ['page-schema.jsonld', 'page-schema-snippet.html']);
  assert.equal(h.downloads[0].blob.type, 'application/ld+json');
  const data = JSON.parse(await h.downloads[0].blob.text()); assert.equal(data['@graph'][0].name, 'Saved company');
  assert.match(await h.downloads[1].blob.text(), /^<script type="application\/ld\+json">/);
  await h.get('clear-graph').click();
  assert.equal(h.get('entity-count').textContent, '0 entities'); assert.equal(h.get('download-json').disabled, true); assert.equal(h.get('empty-graph').hidden, false);
});
