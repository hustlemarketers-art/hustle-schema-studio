(function () {
  'use strict';
  const engine = window.HustleSchema;
  const audit = window.HustleAudit;
  const $ = id => document.getElementById(id);
  const state = { type: 'Organization', nodes: [], drafts: Object.create(null), editingByType:Object.create(null), mode: 'json', report: null, toastTimer: null, editing: null };
  const el = (tag, cls, value) => { const node = document.createElement(tag); if (cls) node.className = cls; if (value !== undefined) node.textContent = value; return node; };
  const type = () => engine.TYPES.find(item => item.id === state.type);
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000); }
  function switchView(view) {
    document.querySelectorAll('[data-view]').forEach(button => { const active = button.dataset.view === view; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    ['build', 'check', 'install'].forEach(name => { $('view-' + name).hidden = view !== name; });
  }
  function readForm() { const data = {}; for (const field of type().fields) { const input = $('field-' + field.key); data[field.key] = input ? input.value.trim() : ''; } return data; }
  function saveDraft() { state.drafts[state.type] = readForm(); }
  function renderTemplates() {
    const query = $('template-search').value.toLowerCase().trim();
    $('template-list').replaceChildren();
    for (const template of engine.TYPES.filter(item => (item.label + ' ' + item.id + ' ' + item.category).toLowerCase().includes(query))) {
      const button = el('button', 'template-button' + (template.id === state.type ? ' selected' : ''), template.label);
      button.type = 'button'; button.setAttribute('aria-pressed', String(template.id === state.type));
      button.addEventListener('click', () => { saveDraft(); state.type = template.id; state.editing = state.editingByType[state.type] ?? null; renderTemplates(); renderForm(); });
      $('template-list').append(button);
    }
    if (!$('template-list').childElementCount) $('template-list').append(el('p', 'muted', 'No matching template.'));
    $('type-count').textContent = engine.TYPES.length;
  }
  function renderForm() {
    const template = type(); const values = state.drafts[state.type] || {};
    $('template-category').textContent = template.category;
    $('template-title').textContent = template.label;
    $('template-description').textContent = template.description;
    $('template-status').textContent = template.googleStatus;
    $('template-source').href = template.source || 'https://schema.org/' + template.id;
    $('schema-fields').replaceChildren();
    for (const field of template.fields) {
      const wide = field.type === 'textarea' || field.type === 'url' || /name|headline|id|description/i.test(field.key);
      const wrapper = el('div', 'field' + (wide ? ' wide' : ''));
      const label = el('label', '', field.label + (field.required ? ' *' : ''));
      label.htmlFor = 'field-' + field.key; wrapper.append(label);
      const input = el(field.type === 'textarea' ? 'textarea' : field.type === 'select' ? 'select' : 'input');
      input.id = 'field-' + field.key; input.name = field.key;
      if (input.tagName === 'INPUT') { input.type = field.type || 'text'; if (field.type === 'number') input.step = 'any'; }
      if (field.type === 'select') {
        input.append(new Option('Select…', ''));
        for (const option of field.options || []) input.append(new Option(typeof option === 'string' ? option : option.label, typeof option === 'string' ? option : option.value));
      }
      input.value = values[field.key] === undefined ? '' : String(values[field.key]);
      input.required = !!field.required; input.autocomplete = 'off';
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.help) { const help = el('p', 'field-help', field.help); help.id = 'help-' + field.key; input.setAttribute('aria-describedby', help.id); wrapper.append(input, help); } else wrapper.append(input);
      $('schema-fields').append(wrapper);
    }
    $('form-error').hidden = true;
    $('add-entity').textContent = state.editing === null ? 'Add to page schema ＋' : 'Save entity changes';
  }
  function graphData() { return engine.graph(state.nodes.map(item => item.node)); }
  function renderGraph() {
    $('entity-list').replaceChildren();
    state.nodes.forEach((item, index) => {
      const node = item.node; const card = el('div', 'entity-card');
      const details = el('div', 'entity-details');
      details.append(el('strong', '', node.name || node.headline || node['@type']), el('small', '', node['@id'] || node['@type']));
      card.append(el('span', 'entity-icon', '{ }'), details);
      if (item.form) {
        const edit = el('button', 'icon-button', '✎'); edit.title = 'Edit ' + node['@type']; edit.setAttribute('aria-label', edit.title);
        edit.addEventListener('click', () => { saveDraft(); state.type = item.type; state.drafts[state.type] = {...item.form}; state.editing = index; state.editingByType[state.type] = index; renderTemplates(); renderForm(); $('template-title').scrollIntoView({behavior:'auto', block:'start'}); }); card.append(edit);
      }
      const remove = el('button', 'icon-button', '×'); remove.title = 'Remove ' + node['@type']; remove.setAttribute('aria-label', remove.title);
      remove.addEventListener('click', () => { saveDraft(); state.nodes.splice(index, 1); for(const key of Object.keys(state.editingByType)) { if(state.editingByType[key] === index) delete state.editingByType[key]; else if(state.editingByType[key] > index) state.editingByType[key]--; } state.editing = state.editingByType[state.type] ?? null; renderGraph(); renderForm(); invalidateReport(); }); card.append(remove);
      $('entity-list').append(card);
    });
    const count = state.nodes.length;
    $('entity-count').textContent = count + (count === 1 ? ' entity' : ' entities');
    $('empty-graph').hidden = count > 0;
    $('code-output').textContent = count ? engine.scriptTag(graphData()) : '// Add your first entity to create code.';
    ['copy-code', 'download-json', 'download-snippet', 'check-graph', 'clear-graph'].forEach(id => { $(id).disabled = !count; });
  }
  function download(filename, value, mime) {
    const objectUrl = URL.createObjectURL(new Blob([value], {type:mime || 'text/plain;charset=utf-8'}));
    const link = el('a'); link.href = objectUrl; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  }
  async function copyCode() {
    const text = engine.scriptTag(graphData());
    try { await navigator.clipboard.writeText(text); toast('Schema copied. Add it to the page it describes.'); }
    catch (_) {
      const textarea = el('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.append(textarea); textarea.select(); let copied = false;
      try { copied = document.execCommand('copy'); } catch (_) {} textarea.remove();
      toast(copied ? 'Schema copied.' : 'Copy is unavailable here. Use the HTML snippet download.');
    }
  }
  function invalidateReport() { state.report = null; $('download-report').disabled = true; $('check-results').hidden = true; $('check-empty').hidden = false; }
  function mode(name) {
    state.mode = name;
    ['json', 'html'].forEach(value => { $('mode-' + value).classList.toggle('selected', value === name); $('mode-' + value).setAttribute('aria-pressed', String(value === name)); });
    $('page-url-wrap').hidden = name !== 'html';
    $('check-input').placeholder = name === 'html' ? 'Paste page HTML or one or more JSON-LD script blocks…' : 'Paste JSON-LD here, starting with { or [ …';
    invalidateReport();
  }
  function showReport(issues, nodes, page) {
    const summary = {errors:0,warnings:0,info:0};
    for (const issue of issues) summary[issue.severity === 'error' ? 'errors' : issue.severity === 'warning' ? 'warnings' : 'info']++;
    state.report = {tool:'Hustle Schema Studio',version:'1.0.0',rulesReviewed:'2026-10-12',checkedAt:new Date().toISOString(),inputMode:state.mode,scope:'Local syntax and selected rules only. No live crawling, rendered-content, indexing or full eligibility verification.',summary,nodes,page:page || null,issues};
    $('check-empty').hidden = true; $('check-results').hidden = false; $('download-report').disabled = false;
    $('check-summary').replaceChildren();
    [['error','errors','Errors'],['warning','warnings','Warnings'],['info','info','Notes']].forEach(([cls,key,label]) => { const metric = el('div','metric '+cls); metric.append(el('b','',summary[key]),el('span','',label)); $('check-summary').append(metric); });
    $('page-facts').replaceChildren();
    if (page) { for (const [label,value] of [['Title',page.title || 'Not found'],['Canonical',page.canonical || 'Not found'],['JSON-LD blocks',page.jsonLdBlocks]]) $('page-facts').append(el('div','page-fact',label + ': ' + value)); }
    $('findings').replaceChildren();
    if (!summary.errors && nodes.length) $('findings').append(el('div','passed','No errors found by these checks. Review the remaining notes and run official validation.'));
    else if (!summary.errors) $('findings').append(el('div','scope-note','No typed schema nodes were available to evaluate. Review the findings below.'));
    const rank = {error:0,warning:1,info:2};
    [...issues].sort((a,b) => rank[a.severity] - rank[b.severity]).forEach(issue => {
      const item = el('article','finding '+issue.severity); const top = el('div','finding-top');
      top.append(el('b','',issue.severity),el('code','',issue.code)); item.append(top,el('p','',issue.message)); if (issue.path) item.append(el('span','path',issue.path)); $('findings').append(item);
    });
  }
  function runChecks() {
    const input = $('check-input').value;
    if (!input.trim()) { showReport([{severity:'error',code:'EMPTY_INPUT',path:'$',message:'Paste JSON-LD or HTML before running checks.'}],[]); return; }
    if (new TextEncoder().encode(input).length > 2*1024*1024) { showReport([{severity:'error',code:'INPUT_TOO_LARGE',path:'$',message:'Use an input under 2 MiB.'}],[]); return; }
    try {
      const report = audit.inspect(input,state.mode,$('page-url').value.trim());
      showReport(report.issues,report.nodes,report.page);
    } catch (error) { showReport([{severity:'error',code:'CHECK_INTERRUPTED',path:'$',message:'Could not finish this input: '+error.message}],[]); }
  }
  $('schema-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const form = readForm(); const node = engine.generate(state.type,form);
      const duplicate = node['@id'] && state.nodes.some((item,index) => index !== state.editing && item.node['@id'] === node['@id']);
      if (duplicate) throw new Error('This entity ID is already in your graph. Edit the existing entity or use a different ID.');
      const item = {type:state.type,form:{...form},node};
      if (state.editing === null) state.nodes.push(item); else state.nodes[state.editing] = item;
      state.drafts[state.type] = form; delete state.editingByType[state.type]; state.editing = null; renderGraph(); renderForm(); invalidateReport(); toast('Entity saved to this page schema.');
    } catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; }
  });
  $('template-search').addEventListener('input',renderTemplates);
  $('load-example').addEventListener('click',() => { state.drafts[state.type] = {...type().example}; renderForm(); toast('Demo data loaded. Replace it with real page information.'); });
  $('reset-form').addEventListener('click',() => { state.drafts[state.type] = {}; delete state.editingByType[state.type]; state.editing = null; renderForm(); });
  $('hustle-starter').addEventListener('click',() => {
    if (state.nodes.length) return;
    state.nodes = [
      {type:'Organization',form:{name:'Hustle Marketers',url:'https://hustlemarketers.com/',id:'https://hustlemarketers.com/#organization'},node:{'@type':'Organization','@id':'https://hustlemarketers.com/#organization',name:'Hustle Marketers',url:'https://hustlemarketers.com/'}},
      {type:'WebSite',form:{name:'Hustle Marketers',url:'https://hustlemarketers.com/',id:'https://hustlemarketers.com/#website',publisherId:'https://hustlemarketers.com/#organization'},node:{'@type':'WebSite','@id':'https://hustlemarketers.com/#website',name:'Hustle Marketers',url:'https://hustlemarketers.com/',publisher:{'@id':'https://hustlemarketers.com/#organization'}}}
    ]; renderGraph(); invalidateReport(); toast('Homepage starter added. Review existing plugin markup before using.');
  });
  $('copy-code').addEventListener('click',copyCode);
  $('download-json').addEventListener('click',() => download('page-schema.jsonld',engine.serialize(graphData()),'application/ld+json'));
  $('download-snippet').addEventListener('click',() => download('page-schema-snippet.html',engine.scriptTag(graphData()),'text/html'));
  $('clear-graph').addEventListener('click',() => { if (!window.confirm('Clear all entities from this page schema? Download your work first if you want to keep it.')) return; state.nodes = []; state.editingByType = Object.create(null); state.editing = null; renderGraph(); renderForm(); invalidateReport(); toast('Page schema cleared.'); });
  $('check-graph').addEventListener('click',() => { mode('json'); $('check-input').value = engine.serialize(graphData()); switchView('check'); runChecks(); });
  $('mode-json').addEventListener('click',() => mode('json')); $('mode-html').addEventListener('click',() => mode('html'));
  $('check-input').addEventListener('input',invalidateReport); $('page-url').addEventListener('input',invalidateReport);
  $('run-check').addEventListener('click',runChecks);
  $('download-report').addEventListener('click',() => { if(state.report) download('schema-check-report.json',JSON.stringify(state.report,null,2),'application/json'); });
  $('check-demo').addEventListener('click',() => { mode('json'); $('check-input').value = JSON.stringify({'@context':'https://schema.org','@type':'Product',name:'Demo product',image:'product.jpg',offers:{'@type':'Offer',price:'not a price',priceCurrency:'US'}},null,2); runChecks(); });
  $('import-file').addEventListener('change',async event => {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 2*1024*1024) { toast('Choose a file under 2 MiB.'); event.target.value = ''; return; }
    try { const contents = await file.text(); mode(/\.html?$/i.test(file.name) || /^\s*</.test(contents) ? 'html' : 'json'); $('check-input').value = contents; toast('File loaded. Run checks to inspect it.'); }
    catch (_) { toast('The file could not be read. Try pasting its text.'); } event.target.value = '';
  });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click',() => switchView(button.dataset.view)));
  document.querySelector('.brand').addEventListener('click',event => {event.preventDefault();switchView('build');});
  window.addEventListener('beforeunload',event => { if (state.nodes.length) {event.preventDefault();event.returnValue = '';} });
  renderTemplates(); renderForm(); renderGraph();
})();
