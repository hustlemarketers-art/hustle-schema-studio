'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../dist/schema-engine.js');
const wrap = n => ({ '@context': 'https://schema.org', ...n });
const errors = n => S.validate(n).issues.filter(i => i.severity === 'error');
const codes = n => S.validate(n).issues.map(i => i.code);
const template = type => S.TYPES.find(t => t.id === type);

test('all twelve metadata templates generate JSON that round-trips and has no profile errors', () => {
  assert.equal(S.TYPES.length, 12);
  for (const t of S.TYPES) {
    assert.ok(t.fields.length && t.source && t.googleStatus);
    const graph = S.graph([S.generate(t.id, t.example)]);
    assert.deepEqual(JSON.parse(S.serialize(graph)), graph);
    assert.deepEqual(errors(graph), [], t.id);
  }
});
test('required authoring fields and unsupported templates give clear errors', () => {
  assert.throws(() => S.generate('Product', { name: 'Book' }), /Offer price is required/);
  assert.throws(() => S.generate('NotAType', {}), /supported/);
  assert.throws(() => S.generate('Person', null), /object/);
});
test('optional blank strings are omitted and real zero coordinates and price are preserved', () => {
  const local = S.generate('LocalBusiness', { ...template('LocalBusiness').example, latitude: 0, longitude: 0, telephone: ' ' });
  assert.equal(local.geo.latitude, 0); assert.equal(local.geo.longitude, 0); assert.equal(local.telephone, undefined);
  assert.equal(S.generate('Product', { ...template('Product').example, price: 0 }).offers.price, 0);
});
test('coordinates require a pair and valid geographic ranges', () => {
  assert.throws(() => S.generate('LocalBusiness', { ...template('LocalBusiness').example, longitude: '' }), /both/);
  assert.throws(() => S.generate('LocalBusiness', { ...template('LocalBusiness').example, latitude: 91 }), /range/);
});
test('serialization makes a malicious closing script inert and preserves text after JSON parsing', () => {
  const payload = '</script><img src=x onerror=alert(1)>\u2028\u2029';
  const data = wrap({ '@type': 'Person', name: payload });
  const result = S.serialize(data);
  assert.ok(!result.includes('<')); assert.ok(result.includes('\\u003c/script>'));
  assert.equal(JSON.parse(result).name, payload);
  assert.equal((S.scriptTag(data).match(/<\/script>/g) || []).length, 1);
});
test('entity relations use stable @id references and graph creation does not mutate nodes', () => {
  const website = S.generate('WebSite', template('WebSite').example);
  assert.deepEqual(website.publisher, { '@id': 'https://example.com/#organization' });
  const graph = S.graph([website]); graph['@graph'][0].name = 'Changed';
  assert.equal(website.name, 'Example Studio');
  assert.throws(() => S.graph([]), /one or more/);
});
test('malformed JSON, roots and graph members are reported without throwing', () => {
  assert.ok(codes('{"@type":').includes('invalid_json'));
  assert.ok(codes(42).includes('invalid_root'));
  assert.ok(codes(wrap({ '@graph': {} })).includes('invalid_graph'));
  assert.ok(codes(wrap({ '@graph': [null] })).includes('invalid_node'));
  assert.ok(codes(wrap({ '@graph': [] })).includes('empty_graph'));
});
test('multi-type nodes use supported profiles and unknown types are informational', () => {
  const node = wrap({ '@type': ['Article', 'CustomArticle'], headline: 'News' });
  assert.deepEqual(errors(node), []);
  assert.ok(codes(node).includes('unchecked_type'));
  assert.equal(S.validate(node).nodes[0].type, 'Article, CustomArticle');
  assert.ok(codes(wrap({ '@type': ['Article', 1] })).includes('invalid_type'));
});
test('recognized Schema.org URL types and top-level node arrays are accepted', () => {
  assert.deepEqual(errors([{ '@context': 'https://schema.org/', '@type': 'https://schema.org/Person', name: 'Alex' }]), []);
  assert.ok(codes({ '@type': 'Person', name: 'Alex' }).includes('missing_context'));
  const independent = S.validate([wrap({ '@type': 'Person', name: 'Alex' }), { '@type': 'Person', name: 'Casey' }]);
  assert.ok(independent.issues.some(i => i.code === 'missing_context' && i.path === '$[1]'));
  assert.ok(codes(wrap({ '@graph': [{ '@context': null, '@type': 'Person', name: 'Alex' }] })).includes('unresolved_context'));
});
test('identical or complementary repeated IDs are accepted and conflicting values are found', () => {
  const id = 'https://example.com/#company';
  const first = { '@id': id, '@type': 'Organization', name: 'Example' };
  assert.ok(!codes(S.graph([first, { ...first, url: 'https://example.com/' }])).includes('conflicting_id'));
  assert.ok(codes(S.graph([first, { ...first, name: 'Different' }])).includes('conflicting_id'));
});
test('unresolved external IDs are informative while local references resolve', () => {
  const website = S.generate('WebSite', template('WebSite').example);
  assert.ok(codes(S.graph([website])).includes('external_reference'));
  assert.ok(!codes(S.graph([website, S.generate('Organization', template('Organization').example)])).includes('external_reference'));
  assert.deepEqual(errors(wrap({ '@id': 'https://elsewhere.example/entity' })), []);
});
test('relative IDs are advice, valid JSON-LD blank node IDs are accepted', () => {
  assert.ok(codes(wrap({ '@type': 'Person', '@id': '#alex' })).includes('relative_id'));
  assert.deepEqual(errors(wrap({ '@type': 'Person', '@id': '_:alex' })), []);
  assert.ok(codes(wrap({ '@id': 10 })).includes('invalid_id'));
});
test('URLs reject relative and executable links but accept image object alternatives', () => {
  assert.ok(codes(wrap({ '@type': 'Person', url: '/person/' })).includes('absolute_url'));
  assert.throws(() => S.generate('Person', { name: 'Alex', url: 'javascript:alert(1)' }), /absolute/);
  assert.deepEqual(errors(wrap({ '@type': 'Organization', name: 'Company', image: { '@type': 'ImageObject', url: 'https://example.com/picture.jpg' } })), []);
});
test('calendar validation rejects impossible days and permits real leap days and dates', () => {
  for (const value of ['2025-02-29', '2026-04-31', '2026-13-01', '2026-01-01T25:00:00Z', '2026-01-01T09:00:00+14:30']) assert.ok(codes(wrap({ '@type': 'Article', datePublished: value })).includes('invalid_date'), value);
  assert.deepEqual(errors(wrap({ '@type': 'Article', datePublished: '2024-02-29', dateModified: '2026-10-12T09:00:00+05:30' })), []);
  assert.throws(() => S.generate('Article', { headline: 'Title', datePublished: '2026-02-30' }), /real ISO/);
});
test('date ordering and missing time zones are reported separately', () => {
  assert.ok(codes(wrap({ '@type': 'Article', datePublished: '2026-10-12', dateModified: '2026-10-11' })).includes('date_order'));
  assert.ok(codes(wrap({ '@type': 'Article', datePublished: '2026-10-12T09:00' })).includes('timezone_missing'));
});
test('Organization and Article have recommendations without false required-field errors', () => {
  for (const type of ['Organization', 'Article', 'BlogPosting', 'NewsArticle']) assert.deepEqual(errors(wrap({ '@type': type })), [], type);
  assert.ok(S.validate(wrap({ '@type': 'Article' })).summary.warnings > 0);
});
test('LocalBusiness requires name and address, but address completeness is recommendation', () => {
  assert.ok(codes(wrap({ '@type': 'LocalBusiness' })).includes('missing_address'));
  assert.ok(codes(wrap({ '@type': 'LocalBusiness', name: 'Store', address: 'One Street' })).includes('invalid_address'));
  assert.deepEqual(errors(wrap({ '@type': 'LocalBusiness', name: 'Store', address: { '@type': 'PostalAddress', addressLocality: 'Paris' } })), []);
});
test('LocalBusiness resolves a separately declared physical address', () => {
  const graph = S.graph([{ '@type': 'LocalBusiness', name: 'Store', address: { '@id': 'https://example.com/#address' } }, { '@type': 'PostalAddress', '@id': 'https://example.com/#address', streetAddress: '1 Example Road', addressLocality: 'London', addressCountry: 'GB' }]);
  assert.deepEqual(errors(graph), []);
});
test('Product supports offer, rating and review alternatives without invented data', () => {
  assert.ok(codes(wrap({ '@type': 'Product', name: 'Book' })).includes('product_eligibility'));
  const byRating = wrap({ '@type': 'Product', name: 'Book', aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 20 } });
  const byReview = wrap({ '@type': 'Product', name: 'Book', review: { '@type': 'Review', author: { '@type': 'Person', name: 'Actual reviewer' }, reviewRating: { '@type': 'Rating', ratingValue: 4 } } });
  assert.deepEqual(errors(byRating), []); assert.deepEqual(errors(byReview), []);
  const generated = S.generate('Product', template('Product').example);
  assert.equal(generated.review, undefined); assert.equal(generated.aggregateRating, undefined);
});
test('Product Offer price alternatives and free prices are valid; currency is recommendation for snippets', () => {
  const n = wrap({ '@type': 'Product', name: 'Book', offers: { '@type': 'Offer', priceSpecification: { '@type': 'PriceSpecification', price: 0 } } });
  assert.deepEqual(errors(n), []); assert.ok(codes(n).includes('missing_priceCurrency'));
  assert.ok(codes(wrap({ '@type': 'Product', name: 'Book', offers: { '@type': 'Offer' } })).includes('missing_price'));
  assert.throws(() => S.generate('Product', { ...template('Product').example, price: '-1' }), /range/);
});
test('AggregateOffer requires lowPrice and currency and accepts zero', () => {
  assert.deepEqual(errors(wrap({ '@type': 'Product', name: 'Book', offers: { '@type': 'AggregateOffer', lowPrice: 0, highPrice: 10, priceCurrency: 'USD' } })), []);
  assert.ok(errors(wrap({ '@type': 'Product', name: 'Book', offers: { '@type': 'AggregateOffer', lowPrice: 2 } })).some(i => i.code === 'missing_priceCurrency'));
});
test('malformed offer, rating and review objects are caught', () => {
  const p = wrap({ '@type': 'Product', name: 'Book', offers: { '@type': 'Offer', price: -10 }, aggregateRating: { '@type': 'AggregateRating', ratingValue: 4 }, review: { '@type': 'Review' } });
  for (const code of ['invalid_price', 'missing_rating_count', 'missing_author', 'missing_reviewRating']) assert.ok(codes(p).includes(code), code);
  for (const price of [[0], {}, true, '0x10']) assert.ok(codes(wrap({ '@type': 'Product', name: 'Book', offers: { '@type': 'Offer', price } })).includes('invalid_price'));
});
test('breadcrumb input separators and missing intermediate links are strict', () => {
  assert.throws(() => S.generate('BreadcrumbList', { items: 'Only item | https://example.com/' }), /two/);
  assert.throws(() => S.generate('BreadcrumbList', { items: 'Home |\nCurrent |' }), /line 1/);
  assert.throws(() => S.generate('BreadcrumbList', { items: 'Home | https://example.com/ | wrong\nCurrent |' }), /line 1/);
  const n = S.generate('BreadcrumbList', { items: 'Home | https://example.com/\nCurrent |' });
  assert.equal(n.itemListElement[1].item, undefined); assert.deepEqual(errors(S.graph([n])), []);
});
test('breadcrumb Thing name and ID alternative is valid, duplicate positions are not', () => {
  const n = wrap({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, item: { '@id': 'https://example.com/', name: 'Home' } }, { '@type': 'ListItem', position: 2, name: 'Current' }] });
  assert.deepEqual(errors(n), []);
  n.itemListElement[1].position = 1; assert.ok(codes(n).includes('breadcrumb_duplicate_position'));
});
test('FAQ uses real text, rejects ambiguous separators and announces retired Google feature', () => {
  const faq = S.generate('FAQPage', { items: 'Question? | Answer with <b>visible</b> text' });
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, 'Answer with <b>visible</b> text');
  assert.ok(codes(S.graph([faq])).includes('faq_retired'));
  assert.throws(() => S.generate('FAQPage', { items: 'Question? | answer | extra' }), /exactly two/);
});
test('Event physical addresses can be PostalAddress or complete text', () => {
  const n = wrap({ '@type': 'Event', name: 'Workshop', startDate: '2027-01-01', location: { '@type': 'Place', name: 'Hall', address: '123 Example Street, Paris, France' } });
  assert.deepEqual(errors(n), []);
  n.location = { '@type': 'VirtualLocation', url: 'https://example.com/stream' };
  assert.ok(codes(n).includes('virtual_event_unsupported'));
});
test('Video required fields differ from recommended description and accessible media URL', () => {
  const n = wrap({ '@type': 'VideoObject', name: 'Guide', thumbnailUrl: ['https://example.com/one.jpg', 'https://example.com/two.jpg'], uploadDate: '2026-10-01' });
  assert.deepEqual(errors(n), []); assert.ok(codes(n).includes('video_url'));
  delete n.uploadDate; assert.ok(codes(n).includes('missing_uploadDate'));
  assert.throws(() => S.generate('VideoObject', { ...template('VideoObject').example, duration: '2 minutes' }), /ISO 8601/);
});
test('WebSite site-name profile requires name and homepage URL, Service stays semantic', () => {
  assert.ok(codes(wrap({ '@type': 'WebSite', name: 'Site' })).includes('missing_url'));
  assert.ok(codes(wrap({ '@type': 'WebSite', name: 'Site', url: 'https://example.com/folder/' })).includes('website_homepage'));
  assert.deepEqual(errors(wrap({ '@type': 'Service', name: 'Consulting' })), []);
  assert.ok(codes(wrap({ '@type': 'Service', name: 'Consulting' })).includes('semantic_type'));
});
test('currency, numeric values and structured fields cannot smuggle unsupported form values', () => {
  assert.throws(() => S.generate('Product', { ...template('Product').example, price: '0x10' }), /finite number/);
  assert.throws(() => S.generate('Product', { ...template('Product').example, availability: 'Invented' }), /supported value/);
  assert.throws(() => S.generate('Product', { ...template('Product').example, priceCurrency: 'US' }), /three-letter/);
  assert.throws(() => S.generate('Person', { name: 'Alex', sameAs: 'https://example.com/\njavascript:alert(1)' }), /Every official/);
});
test('summary counts match findings, always states limitations and detects circular JS input', () => {
  const n = wrap({ '@type': 'Article', url: '/relative' }); n.author = n;
  const result = S.validate(n);
  assert.ok(result.issues.some(i => i.code === 'circular_input'));
  assert.ok(result.issues.some(i => i.code === 'limited_validation'));
  assert.equal(result.summary.errors, result.issues.filter(i => i.severity === 'error').length);
  assert.equal(result.summary.warnings, result.issues.filter(i => i.severity === 'warning').length);
  const hostile = {}; Object.defineProperty(hostile, '@type', { get() { throw new Error('Unexpected getter'); }, enumerable: true });
  assert.ok(codes(hostile).includes('unsafe_or_deep_input'));
  let deep = {}; for (let i = 0; i < 20000; i++) deep = { nested: deep };
  assert.ok(codes(deep).includes('unsafe_or_deep_input'));
  const a = { '@id': 'https://example.com/#x', '@type': 'Person', name: 'A' }; a.subjectOf = a;
  const b = { '@id': 'https://example.com/#x', '@type': 'Person', name: 'A' }; b.subjectOf = b;
  assert.doesNotThrow(() => S.validate({ '@context': 'https://schema.org', '@graph': [a, b] }));
});
