/* Hustle Schema Studio. Dependency-free, limited rule checks. No network calls. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HustleSchema = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'https://schema.org';
  const DOCS = 'https://developers.google.com/search/docs/appearance/structured-data/';
  const f = (key, label, type, required, help, options) => ({ key, label, type: type || 'text', required: !!required, ...(help ? { help } : {}), ...(options ? { options } : {}) });
  const id = () => f('id', 'Entity ID', 'url', false, 'Optional stable absolute URL with a fragment, for example https://example.com/#organization.');
  const name = (label) => f('name', label || 'Name', 'text', true);
  const url = (required) => f('url', 'Page URL', 'url', required, 'Use the actual canonical, publicly accessible page URL.');
  const description = () => f('description', 'Description', 'textarea');
  const image = () => f('image', 'Image URL', 'url');
  const addressFields = (required) => [f('streetAddress', 'Street address', 'text', required), f('addressLocality', 'City / locality', 'text', required), f('addressRegion', 'State / region'), f('postalCode', 'Postal code'), f('addressCountry', 'Country code', 'text', required, 'Use a two-letter country code, such as IN or US.')];
  const sameAs = () => f('sameAs', 'Official profile URLs', 'textarea', false, 'One complete URL per line. Only profiles that identify this exact entity.');
  const commonExample = { name: 'Example Studio', url: 'https://example.com/', id: 'https://example.com/#organization' };
  const TYPES = [
    { id: 'Organization', label: 'Organization', category: 'Identity', description: 'Describe a real organization and connect its official identity.', googleStatus: 'Organization understanding; display features are not guaranteed.', source: DOCS + 'organization', fields: [name(), url(), id(), description(), f('logo', 'Logo URL', 'url'), f('email', 'Public email'), f('telephone', 'Public phone'), sameAs()], example: { ...commonExample, description: 'A fictional studio used only to demonstrate this tool.', logo: 'https://example.com/logo.png' } },
    { id: 'LocalBusiness', label: 'Local business', category: 'Identity', description: 'Describe a business with a real physical location.', googleStatus: 'Local business feature candidate; name and physical address are required.', source: DOCS + 'local-business', fields: [name(), url(), id(), image(), f('telephone', 'Public phone'), f('priceRange', 'Price range', 'text', false, 'An accurate range, for example ₹₹ or $50–$200.'), ...addressFields(true), f('latitude', 'Latitude', 'number'), f('longitude', 'Longitude', 'number')], example: { ...commonExample, name: 'Example Studio Downtown', id: 'https://example.com/#localbusiness', streetAddress: '123 Example Street', addressLocality: 'Example City', addressRegion: 'CA', postalCode: '90001', addressCountry: 'US', latitude: '0', longitude: '0' } },
    { id: 'Person', label: 'Person', category: 'Identity', description: 'Describe a person using accurate public professional information.', googleStatus: 'Semantic markup; a plain Person has no dedicated generic Google rich result.', source: 'https://schema.org/Person', fields: [name(), url(), id(), f('jobTitle', 'Job title'), description(), image(), sameAs()], example: { name: 'Alex Example', url: 'https://example.com/team/alex/', id: 'https://example.com/team/alex/#person', jobTitle: 'Designer' } },
    { id: 'WebSite', label: 'Website', category: 'Website', description: 'Identify the overall site and its preferred site name.', googleStatus: 'Site-name feature candidate; use the domain or subdomain homepage.', source: 'https://developers.google.com/search/docs/appearance/site-names', fields: [name('Site name'), url(true), id(), f('alternateName', 'Alternative site name'), description(), f('publisherId', 'Publisher entity ID', 'url')], example: { name: 'Example Studio', url: 'https://example.com/', id: 'https://example.com/#website', publisherId: 'https://example.com/#organization' } },
    { id: 'WebPage', label: 'Web page', category: 'Website', description: 'Describe one page and connect it to a website or primary entity.', googleStatus: 'Semantic markup; a plain WebPage has no dedicated generic Google rich result.', source: 'https://schema.org/WebPage', fields: [name('Page title'), url(true), id(), description(), f('websiteId', 'Website entity ID', 'url'), f('aboutId', 'Main subject entity ID', 'url')], example: { name: 'About Example Studio', url: 'https://example.com/about/', id: 'https://example.com/about/#webpage', websiteId: 'https://example.com/#website', aboutId: 'https://example.com/#organization' } },
    { id: 'Service', label: 'Service', category: 'Business', description: 'Describe a real service and the organization or person providing it.', googleStatus: 'Semantic markup; a plain Service has no dedicated Google rich result.', source: 'https://schema.org/Service', fields: [name('Service name'), url(), id(), description(), f('serviceType', 'Service type'), f('providerId', 'Provider entity ID', 'url'), f('areaServed', 'Area served', 'text', false, 'A truthful place name or service area. Do not invent locations.')], example: { name: 'Example website audit', url: 'https://example.com/services/audit/', id: 'https://example.com/services/audit/#service', serviceType: 'Website audit', providerId: 'https://example.com/#organization', areaServed: 'India' } },
    { id: 'Article', label: 'Article', category: 'Content', description: 'Describe an article with the real author, images and publishing dates.', googleStatus: 'Article feature candidate; Google lists recommended properties, not required properties.', source: DOCS + 'article', fields: [f('headline', 'Headline', 'text', true), url(), id(), description(), image(), f('datePublished', 'Published date / time', 'text', false, 'ISO 8601 date or date-time. For a time, include an offset, for example 2026-10-12T09:00:00+05:30.'), f('dateModified', 'Updated date / time', 'text'), f('authorName', 'Author name'), f('authorUrl', 'Author profile URL', 'url'), f('publisherName', 'Publisher name'), f('publisherUrl', 'Publisher URL', 'url')], example: { headline: 'A fictional guide to useful websites', url: 'https://example.com/articles/useful-websites/', id: 'https://example.com/articles/useful-websites/#article', image: 'https://example.com/images/guide.jpg', datePublished: '2026-10-01', authorName: 'Alex Example', authorUrl: 'https://example.com/team/alex/', publisherName: 'Example Studio', publisherUrl: 'https://example.com/' } },
    { id: 'Product', label: 'Product + offer', category: 'Business', description: 'Describe one genuine product and a real, visible offer. This template never invents ratings.', googleStatus: 'Product-snippet offer path. Merchant-listing requirements are not fully checked.', source: DOCS + 'product-snippet', fields: [name('Product name'), url(), id(), description(), image(), f('sku', 'SKU'), f('brand', 'Brand'), f('price', 'Offer price', 'number', true, 'Use the actual visible price. Zero is valid for a genuinely free offer.'), f('priceCurrency', 'Currency code', 'text', true, 'Three-letter ISO 4217 currency, such as INR or USD.'), f('offerUrl', 'Offer / purchase URL', 'url'), f('availability', 'Availability', 'select', false, 'Choose only if it accurately reflects the offer.', [{ value: '', label: 'Leave out' }, { value: 'InStock', label: 'In stock' }, { value: 'OutOfStock', label: 'Out of stock' }, { value: 'PreOrder', label: 'Preorder' }, { value: 'BackOrder', label: 'Backorder' }, { value: 'SoldOut', label: 'Sold out' }, { value: 'Discontinued', label: 'Discontinued' }])], example: { name: 'Example reusable notebook', url: 'https://example.com/shop/notebook/', id: 'https://example.com/shop/notebook/#product', description: 'Fictional sample product. Replace every value before publishing.', image: 'https://example.com/images/notebook.jpg', sku: 'DEMO-001', brand: 'Example Brand', price: '25', priceCurrency: 'USD', offerUrl: 'https://example.com/shop/notebook/', availability: 'InStock' } },
    { id: 'BreadcrumbList', label: 'Breadcrumbs', category: 'Website', description: 'Describe the real navigational path to this page.', googleStatus: 'Breadcrumb feature candidate; at least two ordered items are required.', source: DOCS + 'breadcrumb', fields: [id(), f('items', 'Breadcrumb items', 'textarea', true, 'One item per line: Name | https://example.com/path/. At least two lines. The final URL may be blank: Current page |')], example: { id: 'https://example.com/services/audit/#breadcrumb', items: 'Home | https://example.com/\nServices | https://example.com/services/\nWebsite audit | https://example.com/services/audit/' } },
    { id: 'FAQPage', label: 'FAQ page', category: 'Content', description: 'Describe questions and answers that are visibly present on the page.', googleStatus: 'Semantic markup only. Google retired FAQ rich results in May 2026.', source: 'https://developers.google.com/search/updates', fields: [url(), id(), f('items', 'Questions and answers', 'textarea', true, 'One question and answer per line: Question? | Full visible answer. Include exactly one | separator per line.')], example: { url: 'https://example.com/faq/', id: 'https://example.com/faq/#faq', items: 'Is this real business content? | No. These are fictional examples for testing only.\nShould I replace these answers? | Yes. Use the complete questions and answers visible on your page.' } },
    { id: 'Event', label: 'Event', category: 'Content', description: 'Describe a real event with a physical venue and accurate dates.', googleStatus: 'Event feature candidate. Google does not support virtual-only events in this feature.', source: DOCS + 'event', fields: [name('Event name'), url(), id(), description(), f('startDate', 'Start date / time', 'text', true, 'ISO 8601 date or date-time. Include the local timezone offset for an exact time.'), f('endDate', 'End date / time', 'text'), f('locationName', 'Venue name', 'text', true), ...addressFields(true), image(), f('organizerName', 'Organizer name'), f('organizerUrl', 'Organizer URL', 'url'), f('price', 'Ticket price', 'number'), f('priceCurrency', 'Ticket currency code', 'text', false, 'Required by this template when a price is supplied.'), f('offerUrl', 'Ticket URL', 'url')], example: { name: 'Example design workshop', url: 'https://example.com/events/design/', id: 'https://example.com/events/design/#event', description: 'Fictional demonstration event. Do not publish as a real event.', startDate: '2027-01-15T10:00:00+05:30', endDate: '2027-01-15T12:00:00+05:30', locationName: 'Example Hall', streetAddress: '123 Example Road', addressLocality: 'Example City', addressCountry: 'IN', price: '0', priceCurrency: 'INR', offerUrl: 'https://example.com/events/design/' } },
    { id: 'VideoObject', label: 'Video', category: 'Content', description: 'Describe a video embedded on a page where users can actually watch it.', googleStatus: 'Video feature candidate; indexing and video policies apply beyond these field checks.', source: DOCS + 'video', fields: [name('Video title'), url(), id(), description(), f('thumbnailUrl', 'Thumbnail URL', 'url', true), f('uploadDate', 'Upload date / time', 'text', true, 'ISO 8601 date or date-time. Use the actual first-publication date.'), f('contentUrl', 'Video file URL', 'url'), f('embedUrl', 'Video player URL', 'url'), f('duration', 'Duration', 'text', false, 'ISO 8601 duration, for example PT2M30S.')], example: { name: 'Example website walkthrough', url: 'https://example.com/videos/walkthrough/', id: 'https://example.com/videos/walkthrough/#video', description: 'A fictional demonstration video.', thumbnailUrl: 'https://example.com/images/video-thumbnail.jpg', uploadDate: '2026-10-01T09:00:00+05:30', contentUrl: 'https://example.com/videos/demo.mp4', duration: 'PT2M30S' } }
  ];
  const TYPES_BY_ID = new Map(TYPES.map(t => [t.id, t]));
  const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const text = value => value === null || value === undefined ? '' : String(value).trim();
  const present = value => value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '') && (!Array.isArray(value) || value.length > 0);
  const list = value => Array.isArray(value) ? value : [value];
  const hasType = (node, type) => isObject(node) && list(node['@type'] || []).some(t => shortType(t) === type);
  const shortType = value => typeof value === 'string' ? value.replace(/^https?:\/\/schema\.org\//, '') : value;
  function webUrl(value) { try { const u = new URL(value); return /^https?:$/.test(u.protocol) && !!u.hostname; } catch (_) { return false; } }
  function absoluteId(value) { try { return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) && !!new URL(value).protocol; } catch (_) { return false; } }
  function validDate(value) {
    if (typeof value !== 'string') return false;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})?)?$/);
    if (!match) return false;
    const y = +match[1], m = +match[2], d = +match[3];
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m < 1 || m > 12 || d < 1 || d > days[m - 1]) return false;
    if (match[4] !== undefined && (+match[4] > 23 || +match[5] > 59 || +(match[6] || 0) > 59)) return false;
    const zone = match[8];
    if (zone && zone !== 'Z' && (+zone.slice(1, 3) > 14 || +zone.slice(4) > 59 || (+zone.slice(1, 3) === 14 && +zone.slice(4) !== 0))) return false;
    return true;
  }
  function numeric(value, label, min, max) {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text(value))) throw new Error(label + ' must be a finite number.');
    const n = Number(value);
    if (!Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) throw new Error(label + ' is outside the allowed range.');
    return n;
  }
  function lines(value) { return text(value).split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
  function pairs(value, label, allowLastBlank) {
    const rows = lines(value);
    return rows.map((row, i) => {
      const pieces = row.split('|').map(s => s.trim());
      if (pieces.length !== 2 || !pieces[0] || (!pieces[1] && !(allowLastBlank && i === rows.length - 1))) throw new Error(label + ' line ' + (i + 1) + ' must contain exactly two values separated by |.');
      return pieces;
    });
  }
  function generate(typeId, form) {
    const template = TYPES_BY_ID.get(typeId);
    if (!template) throw new Error('Choose one of the supported schema templates.');
    if (!isObject(form)) throw new Error('Form values must be an object.');
    const d = {};
    for (const field of template.fields) {
      const value = text(form[field.key]);
      if (field.required && !value) throw new Error(field.label + ' is required by this template.');
      if (!value) continue;
      if (field.type === 'url' && !webUrl(value)) throw new Error(field.label + ' must be an absolute HTTP or HTTPS URL.');
      if (field.type === 'select' && !field.options.some(o => o.value === value)) throw new Error('Choose a supported value for ' + field.label + '.');
      if (['datePublished', 'dateModified', 'startDate', 'endDate', 'uploadDate'].includes(field.key) && !validDate(value)) throw new Error(field.label + ' must be a real ISO 8601 date or date-time.');
      d[field.key] = value;
    }
    const node = { '@type': typeId };
    if (d.id) node['@id'] = d.id;
    const copy = (...keys) => keys.forEach(key => { if (present(d[key])) node[key] = d[key]; });
    copy('name', 'url', 'description', 'image');
    const ref = (prop, field) => { if (d[field]) node[prop] = { '@id': d[field] }; };
    const address = () => { const a = { '@type': 'PostalAddress' }; for (const key of ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']) if (d[key]) a[key] = d[key]; return a; };
    const offer = () => {
      if (!d.priceCurrency || !/^[A-Za-z]{3}$/.test(d.priceCurrency)) throw new Error('Offer currency must be a three-letter currency code.');
      const o = { '@type': 'Offer', price: numeric(d.price, 'Offer price', 0), priceCurrency: d.priceCurrency.toUpperCase() };
      if (d.offerUrl) o.url = d.offerUrl;
      else if (d.url) o.url = d.url;
      if (d.availability) o.availability = SCHEMA + '/' + d.availability;
      return o;
    };
    if (['Organization', 'Person'].includes(typeId) && d.sameAs) { node.sameAs = lines(d.sameAs); node.sameAs.forEach(v => { if (!webUrl(v)) throw new Error('Every official profile must be an absolute HTTP or HTTPS URL.'); }); }
    switch (typeId) {
      case 'Organization': copy('logo', 'email', 'telephone'); break;
      case 'LocalBusiness':
        copy('telephone', 'priceRange'); node.address = address();
        if (present(d.latitude) !== present(d.longitude)) throw new Error('Supply both latitude and longitude, or leave both blank.');
        if (present(d.latitude)) node.geo = { '@type': 'GeoCoordinates', latitude: numeric(d.latitude, 'Latitude', -90, 90), longitude: numeric(d.longitude, 'Longitude', -180, 180) };
        break;
      case 'Person': copy('jobTitle'); break;
      case 'WebSite': copy('alternateName'); ref('publisher', 'publisherId'); break;
      case 'WebPage': ref('isPartOf', 'websiteId'); ref('about', 'aboutId'); break;
      case 'Service': copy('serviceType', 'areaServed'); ref('provider', 'providerId'); break;
      case 'Article':
        copy('headline', 'datePublished', 'dateModified');
        if (d.authorName) node.author = { '@type': 'Person', name: d.authorName, ...(d.authorUrl ? { url: d.authorUrl } : {}) };
        else if (d.authorUrl) throw new Error('Add the author name with the author profile URL.');
        if (d.publisherName) node.publisher = { '@type': 'Organization', name: d.publisherName, ...(d.publisherUrl ? { url: d.publisherUrl } : {}) };
        else if (d.publisherUrl) throw new Error('Add the publisher name with the publisher URL.');
        break;
      case 'Product': copy('sku'); if (d.brand) node.brand = { '@type': 'Brand', name: d.brand }; node.offers = offer(); break;
      case 'BreadcrumbList': {
        const rows = pairs(d.items, 'Breadcrumb', true);
        if (rows.length < 2) throw new Error('Breadcrumbs need at least two items.');
        node.itemListElement = rows.map(([label, link], i) => { if (link && !webUrl(link)) throw new Error('Breadcrumb line ' + (i + 1) + ' needs an absolute HTTP or HTTPS URL.'); return { '@type': 'ListItem', position: i + 1, name: label, ...(link ? { item: link } : {}) }; });
        break;
      }
      case 'FAQPage': node.mainEntity = pairs(d.items, 'FAQ', false).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })); break;
      case 'Event':
        copy('startDate', 'endDate'); node.location = { '@type': 'Place', name: d.locationName, address: address() };
        node.eventAttendanceMode = SCHEMA + '/OfflineEventAttendanceMode';
        if (d.organizerName) node.organizer = { '@type': 'Organization', name: d.organizerName, ...(d.organizerUrl ? { url: d.organizerUrl } : {}) };
        else if (d.organizerUrl) throw new Error('Add the organizer name with the organizer URL.');
        if (present(d.price)) node.offers = offer();
        else if (d.priceCurrency || d.offerUrl) throw new Error('Add the actual ticket price, including 0 for a free ticket, or leave all offer fields blank.');
        break;
      case 'VideoObject':
        copy('thumbnailUrl', 'uploadDate', 'contentUrl', 'embedUrl', 'duration');
        if (d.duration && !/^P(?=.+)(?:\d+D)?(?:T(?=.+)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/.test(d.duration)) throw new Error('Use an ISO 8601 video duration, for example PT2M30S.');
        break;
    }
    const start = d.startDate || d.datePublished, end = d.endDate || d.dateModified;
    if (start && end && Date.parse(end) < Date.parse(start)) throw new Error('The end or updated date cannot be before the start or published date.');
    return node;
  }
  function graph(nodes) {
    if (!Array.isArray(nodes) || !nodes.length || nodes.some(n => !isObject(n))) throw new Error('A graph needs one or more schema node objects.');
    return { '@context': SCHEMA, '@graph': JSON.parse(JSON.stringify(nodes)) };
  }
  function serialize(data) {
    const json = JSON.stringify(data, null, 2);
    if (typeof json !== 'string') throw new Error('Provide JSON-serializable structured data.');
    return json.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }
  function scriptTag(data) { return '<script type="application/ld+json">\n' + serialize(data) + '\n</script>'; }

  // These are recognized by our limited profiles. This is not the full Schema.org vocabulary.
  const RECOGNIZED = new Set([...TYPES.map(t => t.id), 'BlogPosting', 'NewsArticle', 'PostalAddress', 'GeoCoordinates', 'ImageObject', 'Offer', 'AggregateOffer', 'Brand', 'ListItem', 'Question', 'Answer', 'Place', 'VirtualLocation', 'AggregateRating', 'Review', 'Rating', 'MonetaryAmount', 'PriceSpecification', 'UnitPriceSpecification', 'Country', 'AdministrativeArea', 'City']);
  const URL_FIELDS = new Set(['url', 'sameAs', 'image', 'logo', 'thumbnailUrl', 'contentUrl', 'embedUrl', 'mainEntityOfPage', 'license', 'acquireLicensePage']);
  const DATE_FIELDS = new Set(['datePublished', 'dateModified', 'dateCreated', 'startDate', 'endDate', 'uploadDate', 'priceValidUntil', 'validFrom', 'validThrough', 'birthDate', 'deathDate']);
  const LIMIT_TEXT = 'These are limited local structure and Google feature-profile checks, not a full Schema.org/JSON-LD validator or Google eligibility test. They do not fetch URLs, render pages, verify visible content, robots rules, indexability, ratings, supported vocabulary or rich-result display. Use Google’s Rich Results Test and Schema.org Validator before publishing.';
  function validateInternal(input) {
    const issues = [], nodes = [], ids = new Map(), refs = [], allNodes = [], seen = new WeakSet();
    const add = (severity, code, path, message) => issues.push({ severity, code, path, message });
    const error = (code, path, message) => add('error', code, path, message);
    const warn = (code, path, message) => add('warning', code, path, message);
    const info = (code, path, message) => add('info', code, path, message);
    const done = () => ({ issues, nodes, summary: { errors: issues.filter(i => i.severity === 'error').length, warnings: issues.filter(i => i.severity === 'warning').length, info: issues.filter(i => i.severity === 'info').length } });
    let data = input;
    if (typeof input === 'string') { try { data = JSON.parse(input); } catch (e) { error('invalid_json', '$', 'Invalid JSON: ' + e.message); return done(); } }
    if (!isObject(data) && !Array.isArray(data)) { error('invalid_root', '$', 'Structured data must be an object or an array of node objects.'); return done(); }
    if (Array.isArray(data) && !data.length) error('empty_graph', '$', 'Add at least one schema node.');
    const validContext = context => list(context).some(c => typeof c === 'string' && /^https?:\/\/schema\.org\/?$/.test(c));
    const rootList = Array.isArray(data) ? data : [data];
    rootList.forEach((n, i) => { if (isObject(n) && !own(n, '@context')) warn('missing_context', Array.isArray(data) ? '$[' + i + ']' : '$', 'This top-level document has no @context. Each independent document needs its own context; a sibling document cannot supply one. Use https://schema.org at the document root.'); });
    const canonical = x => {
      if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
      if (isObject(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
      return JSON.stringify(x);
    };
    function visit(value, path, topLevel) {
      if (!isObject(value)) { if (topLevel) error('invalid_node', path, 'Every graph node must be an object.'); return; }
      if (seen.has(value)) { error('circular_input', path, 'Circular JavaScript objects are not JSON. Paste or provide ordinary JSON.'); return; }
      seen.add(value);
      if (own(value, '@context') && !validContext(value['@context'])) warn('unresolved_context', path + '.@context', 'This checker understands the standard Schema.org context only. Custom, reset or remote contexts are not expanded.');
      if (own(value, '@graph')) {
        if (!Array.isArray(value['@graph'])) error('invalid_graph', path + '.@graph', '@graph must be an array of node objects.');
        else { if (!value['@graph'].length) error('empty_graph', path + '.@graph', 'Add at least one schema node.'); value['@graph'].forEach((n, i) => visit(n, path + '.@graph[' + i + ']', true)); }
      }
      if (own(value, '@type')) {
        const raw = value['@type'];
        if (!(typeof raw === 'string' && raw.trim()) && !(Array.isArray(raw) && raw.length && raw.every(t => typeof t === 'string' && t.trim()))) error('invalid_type', path + '.@type', '@type must be a nonempty string or an array of nonempty strings.');
        else {
          const types = list(raw).map(shortType);
          nodes.push({ type: types.join(', '), id: typeof value['@id'] === 'string' ? value['@id'] : '', name: text(value.name || value.headline) });
          allNodes.push({ value, path, types });
          types.forEach(t => { if (!RECOGNIZED.has(t)) info('unchecked_type', path + '.@type', t + ' is outside this checker’s supported profiles. This does not mean it is invalid Schema.org.'); });
        }
      } else if (topLevel && !own(value, '@graph') && !own(value, '@id')) warn('missing_type', path, 'This node has no @type. Add a type if it defines an entity; ID references may omit it.');
      if (own(value, '@id')) {
        const identifier = value['@id'];
        if (typeof identifier !== 'string' || !identifier.trim()) error('invalid_id', path + '.@id', '@id must be a nonempty string identifier.');
        else {
          if (!absoluteId(identifier) && !identifier.startsWith('_:')) warn('relative_id', path + '.@id', 'This ID depends on a page/base URL. Prefer an absolute stable URL so pasted graphs keep the same identity.');
          if (Object.keys(value).every(k => ['@id', '@context'].includes(k))) refs.push({ id: identifier, path });
          else {
            const prior = ids.get(identifier) || [];
            for (const entry of prior) for (const key of Object.keys(value)) {
              if (key !== '@id' && key !== '@context' && own(entry.value, key) && canonical(entry.value[key]) !== canonical(value[key])) error('conflicting_id', path + '.' + key, 'The same @id has a conflicting ' + key + ' value at ' + entry.path + '. Use one consistent entity definition or merge intentional values explicitly.');
            }
            prior.push({ value, path }); ids.set(identifier, prior);
          }
        }
      }
      for (const [key, child] of Object.entries(value)) {
        if (key === '@graph' || key === '@context') continue;
        const p = path + '.' + key;
        if (URL_FIELDS.has(key) && present(child)) list(child).forEach((item, i) => {
          if (typeof item === 'string' && !webUrl(item)) error('absolute_url', p + (Array.isArray(child) ? '[' + i + ']' : ''), key + ' must use an absolute HTTP or HTTPS URL in these Google-oriented templates.');
          else if (!isObject(item) && typeof item !== 'string') error('invalid_url_value', p, key + ' must be a URL or an appropriate structured object.');
        });
        if (DATE_FIELDS.has(key) && present(child)) {
          if (!validDate(child)) error('invalid_date', p, 'Use a real ISO 8601 calendar date or date-time, for example 2026-10-12 or 2026-10-12T09:00:00+05:30.');
          else if (child.includes('T') && !/(?:Z|[+-]\d{2}:\d{2})$/.test(child)) warn('timezone_missing', p, 'Add the actual timezone offset for an unambiguous time.');
        }
        if (isObject(child)) visit(child, p, false);
        else if (Array.isArray(child)) child.forEach((c, i) => { if (isObject(c)) visit(c, p + '[' + i + ']', false); });
      }
      seen.delete(value);
    }
    rootList.forEach((n, i) => visit(n, Array.isArray(data) ? '$[' + i + ']' : '$', true));
    const resolve = value => {
      if (!isObject(value) || !value['@id'] || Object.keys(value).some(k => !['@id', '@context'].includes(k))) return value;
      const entries = ids.get(value['@id']);
      return entries ? Object.assign({}, ...entries.map(e => e.value)) : value;
    };
    const need = (obj, prop, path, message, severity) => { if (!present(obj[prop])) add(severity || 'error', 'missing_' + prop, path + '.' + prop, message); };
    const requiredName = (n, p) => need(n, 'name', p, 'This Google feature profile requires name.');
    function checkAddress(address, path, acceptText) {
      const a = resolve(address);
      if (acceptText && typeof a === 'string' && a.trim()) return;
      if (!isObject(a)) { error('invalid_address', path, 'Use a PostalAddress object with an accurate physical address.' + (acceptText ? ' Google also accepts a complete address as text for an event.' : '')); return; }
      if (a['@id'] && Object.keys(a).length === 1) { info('unresolved_address', path, 'The address is an external ID reference. This checker cannot verify its physical address fields.'); return; }
      if (!hasType(a, 'PostalAddress')) warn('address_type', path + '.@type', 'Use PostalAddress for this address object.');
      if (!['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'].some(k => present(a[k]))) error('empty_address', path, 'Add actual physical address properties. An empty address does not describe a venue.');
      else ['streetAddress', 'addressLocality', 'addressCountry'].forEach(k => need(a, k, path, 'Add ' + k + ' for a more complete physical address.', 'warning'));
    }
    for (const { value: n, path: p, types } of allNodes) {
      if (types.includes('Organization')) ['name', 'url'].forEach(k => need(n, k, p, 'Google recommends organization ' + k + '; Organization has no required properties.', 'warning'));
      if (types.includes('LocalBusiness')) { requiredName(n, p); need(n, 'address', p, 'Google’s LocalBusiness profile requires a physical PostalAddress.'); if (present(n.address)) checkAddress(n.address, p + '.address', false); }
      if (types.includes('WebSite')) {
        requiredName(n, p); need(n, 'url', p, 'Google’s site-name profile requires the domain or subdomain homepage URL.');
        if (typeof n.url === 'string' && webUrl(n.url)) { const u = new URL(n.url); if (u.pathname !== '/' || u.search || u.hash) warn('website_homepage', p + '.url', 'Site-name markup belongs on the canonical domain or subdomain homepage.'); }
      }
      if (types.some(t => ['Article', 'BlogPosting', 'NewsArticle'].includes(t))) {
        ['headline', 'image', 'datePublished', 'dateModified', 'author'].forEach(k => need(n, k, p, 'Google recommends ' + k + ' for Article. Article has no required properties.', 'warning'));
        if (present(n.author)) list(n.author).forEach((a, i) => { const author = resolve(a); if (isObject(author) && !(author['@id'] && Object.keys(author).length === 1)) { need(author, 'name', p + '.author[' + i + ']', 'Google recommends a separate author name.', 'warning'); need(author, 'url', p + '.author[' + i + ']', 'Google recommends an author profile URL.', 'warning'); } });
      }
      if (types.includes('Product')) {
        requiredName(n, p);
        if (![n.offers, n.review, n.aggregateRating].some(present)) error('product_eligibility', p, 'A Google product snippet requires name and at least one of offers, review or aggregateRating.');
        if (present(n.offers)) list(n.offers).forEach((offer, i) => {
          const o = resolve(offer), op = p + '.offers[' + i + ']';
          if (!isObject(o)) { error('invalid_offer', op, 'offers must contain an Offer or AggregateOffer object.'); return; }
          if (o['@id'] && Object.keys(o).length === 1) { info('unresolved_offer', op, 'Offer is an external ID reference. Its required fields cannot be checked here.'); return; }
          const aggregate = hasType(o, 'AggregateOffer');
          const price = aggregate ? o.lowPrice : (present(o.price) ? o.price : isObject(o.priceSpecification) ? o.priceSpecification.price : undefined);
          if (!present(price)) error('missing_price', op, aggregate ? 'AggregateOffer requires lowPrice for a product snippet.' : 'The product Offer path requires price or priceSpecification.price.');
          else if (!['string', 'number'].includes(typeof price) || !/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text(price)) || !Number.isFinite(Number(price)) || Number(price) < 0) error('invalid_price', op, 'Offer price must be a finite nonnegative number or a numeric string.');
          const currency = o.priceCurrency || (isObject(o.priceSpecification) && o.priceSpecification.priceCurrency);
          if (!currency) add(aggregate ? 'error' : 'warning', 'missing_priceCurrency', op + '.priceCurrency', aggregate ? 'Google’s AggregateOffer profile requires priceCurrency.' : 'Google recommends priceCurrency for product snippets; merchant listings require it.');
          else if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) warn('currency_format', op + '.priceCurrency', 'Use the actual uppercase three-letter currency code, such as INR or USD.');
        });
        if (present(n.aggregateRating)) {
          const a = resolve(n.aggregateRating), ap = p + '.aggregateRating';
          if (!isObject(a)) error('invalid_rating', ap, 'aggregateRating must be an AggregateRating object.');
          else if (!(a['@id'] && Object.keys(a).length === 1)) { need(a, 'ratingValue', ap, 'AggregateRating requires the real ratingValue.'); if (!present(a.ratingCount) && !present(a.reviewCount)) error('missing_rating_count', ap, 'AggregateRating needs ratingCount or reviewCount. Use only genuine visible ratings.'); }
        }
        if (present(n.review)) list(n.review).forEach((review, i) => {
          const r = resolve(review), rp = p + '.review[' + i + ']';
          if (!isObject(r)) error('invalid_review', rp, 'review must contain Review objects.');
          else if (!(r['@id'] && Object.keys(r).length === 1)) { need(r, 'author', rp, 'A Google review snippet requires the real review author.'); need(r, 'reviewRating', rp, 'A Google review snippet requires reviewRating.'); if (isObject(r.reviewRating)) need(r.reviewRating, 'ratingValue', rp + '.reviewRating', 'Review rating requires ratingValue.'); }
        });
      }
      if (types.includes('BreadcrumbList')) {
        if (!Array.isArray(n.itemListElement) || n.itemListElement.length < 2) error('breadcrumb_count', p + '.itemListElement', 'Google breadcrumbs require at least two ListItem entries.');
        else {
          const positions = new Set();
          n.itemListElement.forEach((rawItem, i) => {
            const item = resolve(rawItem), ip = p + '.itemListElement[' + i + ']';
            if (!isObject(item)) { error('breadcrumb_item', ip, 'Each breadcrumb must be a ListItem object.'); return; }
            if (!hasType(item, 'ListItem')) error('breadcrumb_type', ip + '.@type', 'Breadcrumb entries need @type ListItem.');
            if (!Number.isInteger(item.position) || item.position < 1) error('breadcrumb_position', ip + '.position', 'Use a positive integer breadcrumb position.');
            else { if (positions.has(item.position)) error('breadcrumb_duplicate_position', ip + '.position', 'Each breadcrumb position must be unique.'); positions.add(item.position); if (item.position !== i + 1) warn('breadcrumb_order', ip + '.position', 'Prefer contiguous breadcrumb positions starting at 1 in display order.'); }
            const target = resolve(item.item);
            if (!present(item.name) && !(isObject(target) && present(target.name))) error('breadcrumb_name', ip + '.name', 'Add a breadcrumb name, or a name on the Thing used as item.');
            if (i < n.itemListElement.length - 1 && !present(item.item)) error('breadcrumb_url', ip + '.item', 'Every breadcrumb except the last needs an item URL or an object with @id.');
            if (present(item.item) && !(typeof item.item === 'string' && webUrl(item.item)) && !(isObject(item.item) && typeof item.item['@id'] === 'string' && webUrl(item.item['@id']))) error('breadcrumb_url', ip + '.item', 'Use an absolute HTTP/HTTPS item URL or a Thing with an absolute @id.');
          });
        }
      }
      if (types.includes('FAQPage')) {
        info('faq_retired', p, 'FAQPage remains Schema.org vocabulary, but Google retired FAQ rich results in May 2026.');
        if (!Array.isArray(n.mainEntity) || !n.mainEntity.length) warn('faq_questions', p + '.mainEntity', 'Describe the visible questions in a mainEntity array.');
        else n.mainEntity.forEach((q, i) => { if (!isObject(q) || !present(q.name) || !isObject(q.acceptedAnswer) || !present(q.acceptedAnswer.text)) warn('faq_answer', p + '.mainEntity[' + i + ']', 'Each visible question should have a name and an acceptedAnswer with full text.'); });
      }
      if (types.includes('Event')) {
        requiredName(n, p); need(n, 'startDate', p, 'Google’s Event profile requires startDate.'); need(n, 'location', p, 'Google’s Event profile requires a real physical location.');
        if (present(n.location)) {
          const locations = list(n.location).map(resolve), physical = locations.filter(loc => isObject(loc) && !hasType(loc, 'VirtualLocation'));
          locations.forEach((loc, i) => { if (!isObject(loc)) error('invalid_location', p + '.location[' + i + ']', 'Use a Place object for an event venue.'); });
          if (!physical.length && locations.some(loc => hasType(loc, 'VirtualLocation'))) warn('virtual_event_unsupported', p + '.location', 'Google’s Event feature does not support virtual-only events. A real physical component is required.');
          physical.forEach((location, i) => { const lp = p + '.location[' + i + ']'; if (location['@id'] && Object.keys(location).length === 1) info('unresolved_location', lp, 'The venue is an external ID reference; physical venue fields cannot be verified.'); else { if (!hasType(location, 'Place')) warn('event_place', lp + '.@type', 'Use Place for the physical event venue.'); need(location, 'address', lp, 'Google’s Event profile requires a venue address.'); if (present(location.address)) checkAddress(location.address, lp + '.address', true); } });
        }
        ['description', 'endDate', 'image', 'offers', 'organizer', 'performer'].forEach(k => need(n, k, p, 'Google recommends event ' + k + ' when applicable and accurate.', 'warning'));
      }
      if (types.includes('VideoObject')) { ['name', 'thumbnailUrl', 'uploadDate'].forEach(k => need(n, k, p, 'Google’s Video profile requires ' + k + '.')); ['description', 'duration'].forEach(k => need(n, k, p, 'Google recommends video ' + k + '.', 'warning')); if (!present(n.contentUrl) && !present(n.embedUrl)) warn('video_url', p, 'Provide an accessible contentUrl or embedUrl so Google can find the video.'); }
      if (['Person', 'WebPage', 'Service'].some(t => types.includes(t))) info('semantic_type', p, 'This type can describe entities, but alone has no dedicated generic Google rich-result feature.');
      const firstDate = n.startDate || n.datePublished, lastDate = n.endDate || n.dateModified;
      if (validDate(firstDate) && validDate(lastDate) && Date.parse(lastDate) < Date.parse(firstDate)) error('date_order', p, 'The end or modified date is earlier than the start or published date.');
    }
    refs.forEach(r => { if (!ids.has(r.id)) info('external_reference', r.path, 'This ID is not defined in this document. External references can be valid; verify that it identifies the intended entity.'); });
    info('limited_validation', '$', LIMIT_TEXT);
    return done();
  }
  function validate(input) {
    try { return validateInternal(input); }
    catch (_) {
      return { issues: [
        { severity: 'error', code: 'unsafe_or_deep_input', path: '$', message: 'This input could not be checked safely. Use ordinary JSON without circular references, executable getters or excessive nesting.' },
        { severity: 'info', code: 'limited_validation', path: '$', message: LIMIT_TEXT }
      ], nodes: [], summary: { errors: 1, warnings: 0, info: 1 } };
    }
  }
  return { TYPES, generate, graph, serialize, scriptTag, validate };
});
