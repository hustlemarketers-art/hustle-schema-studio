/* Hustle Schema Studio: local HTML source checks. No DOM insertion or network requests. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HustlePageChecker = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_HTML_BYTES = 2 * 1024 * 1024;
  const RAW_TEXT_TAGS = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript']);
  const ENTITIES = Object.freeze({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0', colon: ':', sol: '/', period: '.', equals: '=', Tab: '\t', NewLine: '\n' });

  function decodeEntities(value) {
    return String(value).replace(/&(#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi, function (all, entity) {
      if (entity[0] !== '#') return Object.prototype.hasOwnProperty.call(ENTITIES, entity) ? ENTITIES[entity] : all;
      const hex = entity[1].toLowerCase() === 'x';
      const point = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (point === 0 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) return '\ufffd';
      return String.fromCodePoint(point);
    });
  }

  function byteLength(value) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
    return value.length * 2; // Conservative limit for older runtimes without TextEncoder.
  }

  function attributes(source) {
    const attrs = Object.create(null);
    const expression = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;
    while ((match = expression.exec(source))) {
      const name = match[1].toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(attrs, name)) {
        attrs[name] = decodeEntities(match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : '');
      }
    }
    return attrs;
  }

  // This deliberately reads source instead of constructing a browser DOM. It skips
  // comments and raw-text contents, and honors quoted > characters in start tags.
  // It is a focused source scanner, not a complete browser HTML tree builder.
  function scan(source, visit) {
    let cursor = 0;
    while (cursor < source.length) {
      const start = source.indexOf('<', cursor);
      if (start < 0) break;
      if (source.startsWith('<!--', start)) {
        const end = source.indexOf('-->', start + 4);
        cursor = end < 0 ? source.length : end + 3;
        continue;
      }
      const tag = /^<([a-z][a-z0-9:-]*)(?=[\s/>])/i.exec(source.slice(start));
      if (!tag) { cursor = start + 1; continue; }
      let end = start + tag[0].length;
      let quote = '';
      for (; end < source.length; end += 1) {
        const char = source[end];
        if (quote) { if (char === quote) quote = ''; }
        else if (char === '"' || char === "'") quote = char;
        else if (char === '>') break;
      }
      if (end >= source.length) break;
      const name = tag[1].toLowerCase();
      const attrs = attributes(source.slice(start + tag[0].length, end));
      let content = null;
      cursor = end + 1;
      if (RAW_TEXT_TAGS.has(name)) {
        const close = new RegExp('</' + name + '(?=[\\t\\n\\f\\r />])[^>]*>', 'ig');
        close.lastIndex = cursor;
        const closing = close.exec(source);
        content = source.slice(cursor, closing ? closing.index : source.length);
        cursor = closing ? close.lastIndex : source.length;
      }
      visit({ name: name, attrs: attrs, content: content });
    }
  }

  function httpUrl(value, base) {
    try {
      const url = base ? new URL(value, base) : new URL(value);
      return /^(https?:)$/.test(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function analyze(html, pageUrlOptional) {
    const result = {
      documents: [], issues: [],
      page: { title: '', canonical: '', robots: [], jsonLdBlocks: 0, hasMicrodata: false, hasRdfa: false },
      blocks: []
    };
    function issue(severity, code, path, message) { result.issues.push({ severity: severity, code: code, path: path, message: message }); }
    if (typeof html !== 'string') {
      issue('error', 'source.input_type', '$', 'Paste HTML source as text.');
      return result;
    }
    if (byteLength(html) > MAX_HTML_BYTES) {
      issue('error', 'source.too_large', '$', 'HTML exceeds the 2 MiB local source-check limit. Use a smaller page source.');
      return result;
    }
    const base = typeof pageUrlOptional === 'string' && pageUrlOptional.trim() ? httpUrl(pageUrlOptional.trim()) : null;
    if (pageUrlOptional && !base) issue('warning', 'page.url_invalid', '$.pageUrl', 'The page URL is not an absolute HTTP(S) URL. Relative canonical URLs cannot be resolved.');
    const titles = [];
    const canonicals = [];
    let sawBase = false;
    scan(html, function (tag) {
      const attrs = tag.attrs;
      if ('itemscope' in attrs || 'itemtype' in attrs) result.page.hasMicrodata = true;
      if ('typeof' in attrs || 'vocab' in attrs || 'about' in attrs || ('property' in attrs && !/^(og:|twitter:)/i.test(attrs.property))) result.page.hasRdfa = true;
      if (tag.name === 'title') titles.push(decodeEntities(tag.content || '').replace(/\s+/g, ' ').trim());
      if (tag.name === 'base' && attrs.href) sawBase = true;
      if (tag.name === 'link' && (attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical')) {
        const raw = (attrs.href || '').trim();
        if (!raw) { issue('warning', 'page.canonical_empty', '$.page.canonical', 'A canonical link has no usable href.'); return; }
        const resolved = httpUrl(raw, base);
        canonicals.push(resolved || raw);
        if (!resolved) issue('warning', 'page.canonical_unresolved', '$.page.canonical', 'A canonical URL could not be resolved to an HTTP(S) URL. Supply the page URL and review the canonical value.');
      }
      if (tag.name === 'meta') {
        const agent = (attrs.name || '').trim().toLowerCase();
        if (agent === 'robots' || agent === 'googlebot') {
          const content = attrs.content || '';
          const tokens = content.toLowerCase().split(/[\s,;]+/).filter(Boolean);
          const noindex = tokens.includes('noindex') || tokens.includes('none');
          result.page.robots.push({ agent: agent, content: content, noindex: noindex });
          if (noindex) issue('warning', 'page.noindex', '$.page.robots', 'A ' + agent + ' meta tag contains noindex or none. This source requests exclusion from indexing for that crawler; confirm the intended live behavior.');
        }
        if ((attrs['http-equiv'] || '').trim().toLowerCase() === 'refresh') issue('info', 'page.meta_refresh', '$.page', 'A meta refresh is present. Review the redirect destination and where the structured data belongs.');
      }
      if (tag.name !== 'script' || (attrs.type || '').split(';')[0].trim().toLowerCase() !== 'application/ld+json') return;
      const index = result.blocks.length;
      const path = '$.blocks[' + index + ']';
      if (attrs.src) issue('warning', 'jsonld.external_src', path, 'This JSON-LD script has a src attribute. This checker does not fetch it; provide the inline JSON-LD that is actually present on the page.');
      try {
        const document = JSON.parse(tag.content || '');
        result.blocks.push({ index: index, valid: true, document: document });
        result.documents.push(document);
      } catch (error) {
        const message = String(error.message || 'Invalid JSON').slice(0, 250);
        result.blocks.push({ index: index, valid: false, error: message });
        issue('error', 'jsonld.invalid_json', path, 'JSON-LD block ' + (index + 1) + ' is not valid JSON: ' + message);
      }
    });
    result.page.jsonLdBlocks = result.blocks.length;
    result.page.title = titles[0] || '';
    result.page.canonical = canonicals[0] || '';
    if (!result.page.title) issue('info', 'page.title_missing', '$.page.title', 'No nonempty title was found in this source. This is a page review item, not a JSON-LD syntax requirement.');
    if (titles.length > 1) issue('warning', 'page.title_multiple', '$.page.title', 'Multiple title elements were found. Review the complete page source.');
    if (canonicals.length === 0) issue('info', 'page.canonical_missing', '$.page.canonical', 'No usable HTML canonical link was found. A canonical is not a universal requirement for valid JSON-LD.');
    if (canonicals.length > 1) {
      const conflict = new Set(canonicals).size > 1;
      issue(conflict ? 'warning' : 'info', conflict ? 'page.canonical_conflict' : 'page.canonical_multiple', '$.page.canonical', conflict ? 'Conflicting HTML canonical URLs were found. Review which page should be preferred.' : 'More than one HTML canonical link was found with the same resolved value.');
    }
    if (sawBase) issue('info', 'page.base_present', '$.page.canonical', 'A base element was found. This source checker resolves relative canonicals against the supplied page URL, so review any base-element effect separately.');
    if (!result.blocks.length) issue('warning', 'jsonld.not_found', '$.blocks', 'No application/ld+json script blocks were found in this source. Other formats or JavaScript-generated data may still exist on the live page.');
    if (result.page.hasMicrodata) issue('info', 'source.microdata_unchecked', '$.page.hasMicrodata', 'Microdata attributes were found. This checker extracts JSON-LD only and has not validated that markup.');
    if (result.page.hasRdfa) issue('info', 'source.rdfa_unchecked', '$.page.hasRdfa', 'Possible RDFa attributes were found. This checker extracts JSON-LD only and has not validated that markup.');
    issue('info', 'source.limitations', '$', 'This is an inert check of pasted HTML source, not a live crawl or full browser parse. It cannot verify robots.txt, HTTP status or headers, rendered JavaScript, Google-selected canonical URLs, indexing, or rich-result eligibility. No network requests were made.');
    return result;
  }

  return Object.freeze({ analyze: analyze, MAX_HTML_BYTES: MAX_HTML_BYTES });
}));
