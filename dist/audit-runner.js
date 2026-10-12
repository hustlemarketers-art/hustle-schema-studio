/* Coordinates independent JSON-LD document checks and cross-document ID review. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./schema-engine.js'), require('./page-checker.js'));
  else root.HustleAudit = factory(root.HustleSchema, root.HustlePageChecker);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, checker) {
  'use strict';
  const MAX_INPUT_BYTES = 2 * 1024 * 1024;
  const SHARED_CODES = new Set(['conflicting_id', 'external_reference']);
  const issue = (code, message) => ({ severity: 'error', code: code, path: '$', message: message });

  function inspect(input, mode, pageUrl) {
    if (typeof input !== 'string') return { issues: [issue('input_type', 'Provide JSON-LD or HTML as text.')], nodes: [] };
    const size = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(input).length : input.length * 2;
    if (size > MAX_INPUT_BYTES) return { issues: [issue('input_too_large', 'Use an input no larger than 2 MiB.')], nodes: [] };
    if (!input.trim()) return { issues: [issue('empty_input', 'Paste JSON-LD or HTML before running checks.')], nodes: [] };
    if (mode !== 'json' && mode !== 'html') return { issues: [issue('invalid_mode', 'Choose JSON-LD or HTML input mode.')], nodes: [] };
    if (!engine || !checker) return { issues: [issue('missing_dependency', 'The schema engine and page checker must load before the audit runner.')], nodes: [] };
    try {
      if (mode === 'json') {
        const report = engine.validate(input);
        return { issues: report.issues, nodes: report.nodes };
      }
      const source = checker.analyze(input, pageUrl);
      const issues = [];
      const nodes = [];
      const signatures = new Set();
      let addedLimitNote = false;
      function add(finding) {
        // This same global limitation is otherwise repeated once per script.
        if (finding.code === 'limited_validation') {
          if (addedLimitNote) return;
          addedLimitNote = true;
          finding = Object.assign({}, finding, { path: '$' });
        }
        const signature = JSON.stringify([finding.severity, finding.code, finding.path, finding.message]);
        if (!signatures.has(signature)) { signatures.add(signature); issues.push(finding); }
      }
      source.issues.forEach(add);
      const combined = [];
      const combinedPaths = [];
      let validBlocks = 0;
      for (const block of source.blocks) {
        if (!block.valid) continue;
        validBlocks += 1;
        const prefix = '$.blocks[' + block.index + ']';
        // Context is scoped to each original script; a context from one script
        // must never make a separate script appear to have a Schema.org context.
        const report = engine.validate(block.document);
        const remap = value => typeof value === 'string' ? value.replace(/\$(?=$|[.\[])/g, prefix) : value;
        for (const finding of report.issues) {
          if (!SHARED_CODES.has(finding.code)) add(Object.assign({}, finding, { path: remap(finding.path), message: remap(finding.message) }));
        }
        nodes.push(...report.nodes);
        if (Array.isArray(block.document)) block.document.forEach((node, index) => { combined.push(node); combinedPaths.push(prefix + '[' + index + ']'); });
        else { combined.push(block.document); combinedPaths.push(prefix); }
      }
      if (combined.length) {
        const report = engine.validate(combined);
        const remap = value => typeof value === 'string' ? value.replace(/\$\[(\d+)\]/g, (match, index) => combinedPaths[Number(index)] || match) : value;
        // Only literal-ID relationships are collected from the combined input.
        // Type/profile/context validation stays with the independent documents.
        for (const finding of report.issues) {
          if (SHARED_CODES.has(finding.code)) add(Object.assign({}, finding, { path: remap(finding.path), message: remap(finding.message) }));
        }
      }
      if (validBlocks > 1) add({ severity: 'info', code: 'source.context_scope', path: '$.blocks', message: 'Each JSON-LD script was checked independently. Cross-script ID review compares literal identifiers only; custom or remote contexts and relative bases are not expanded. A matching ID does not prove semantic equivalence across different contexts.' });
      return { issues: issues, nodes: nodes, page: source.page };
    } catch (error) {
      return { issues: [issue('check_interrupted', 'Could not finish these local checks: ' + String(error.message || error).slice(0, 250))], nodes: [] };
    }
  }

  return Object.freeze({ inspect: inspect, MAX_INPUT_BYTES: MAX_INPUT_BYTES });
}));
