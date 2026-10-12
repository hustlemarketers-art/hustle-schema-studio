# Hustle Schema Studio: Free JSON-LD Schema Generator and Checker

**[Open the live tool](https://hustlemarketers-art.github.io/hustle-schema-studio/)**

Create schema markup, check it for errors and get it ready for your website in one place. Hustle Schema Studio builds connected JSON-LD for 12 schema types (Organization, LocalBusiness, Person, WebSite, WebPage, Service, Article, Product, BreadcrumbList, FAQPage, Event and VideoObject), checks existing JSON-LD or pasted page HTML for common errors and conflicting entity IDs, and explains the findings in plain language.

- Errors, recommendations and review notes are kept separate.
- Each template states whether it supports a current Google Search feature or only describes your content.
- Runs entirely in your browser: no login, API key, analytics or network requests.
- Download the schema, export the findings and follow the WordPress installation notes.

Built by [Ishant Sharma](https://ishantsharmamarketer.com/), SEO and Google Ads specialist and founder of [Hustle Marketers](https://hustlemarketers.com/).

## Open the app

Use the [live version](https://hustlemarketers-art.github.io/hustle-schema-studio/), or download this repository and open **index.html** in a modern browser. It is a portable single file with the app's code and styles, so it also works offline. You can also open **dist/index.html** while keeping the other files in `dist/` alongside it.

1. Choose a template and enter facts that are visible on the intended page. Demo values are fictional and must be replaced.
2. Add entities to the page schema. Use a stable entity ID, such as `https://example.com/#organization`, when connecting related entities.
3. Run the focused checks, then copy the JSON-LD script or download the `.jsonld` or HTML snippet.
4. Use the **Check** view for existing JSON-LD, an HTML source file, or pasted page source. A page URL helps resolve relative canonical links; it does not fetch the page.
5. Validate with the official tools and inspect the deployed page before relying on it.

The Hustle homepage starter includes only the agency name, homepage and connected Organization/WebSite identities. It is a starting point to reconcile with the site's existing markup, not a completed audit.

## Templates and Google support

There are 12 generator templates. The checker also recognizes selected nested types and Article subtypes, including BlogPosting and NewsArticle. It does not implement the entire Schema.org vocabulary.

| Template | Current Google feature / scope |
| --- | --- |
| Organization | Organization understanding and possible visual features. Google lists recommended properties, with no universally required properties. |
| LocalBusiness | Local business profile. Google requires a name and physical address; use truthful location details. |
| Person | Semantic identity markup. A plain Person has no dedicated generic Google rich-result feature. |
| WebSite | Site-name markup on the domain or subdomain homepage. Google requires name and canonical homepage URL. |
| WebPage | Semantic description of a page and its relationships. No dedicated generic rich-result feature. |
| Service | Semantic description of an actual service and provider. No dedicated generic Service rich-result feature. |
| Article | Article profile. Google recommends properties such as headline, author, images and dates; it does not list required Article properties. |
| Product + offer | Product-snippet Offer path. This is not a complete merchant-listing, variants, shipping or returns implementation. |
| BreadcrumbList | At least two ordered ListItems. Each needs a position and name; every item except the final breadcrumb needs a URL. |
| FAQPage | Semantic markup only. Google stopped showing FAQ rich results on 7 May 2026. |
| Event | Google Event profile with a physical venue. Virtual-only experiences are not supported by this feature. |
| VideoObject | Google Video profile requires name, thumbnailUrl and uploadDate. Description, duration and accessible video URLs add useful information. |

Required form fields are **template requirements**, not a claim that Google requires every starred field. For example, this generator asks for an Organization name and Article headline to create useful entities, and an offer currency to prevent ambiguous prices. Google lists no required Organization or Article properties, and currency is recommended for product snippets but required for merchant listings.

Google retired HowTo rich results in September 2023 and the sitelinks search box in November 2024. The app does not generate these retired features. WebSite site-name markup remains supported. Rules were reviewed on **12 October 2026**; consult [SOURCES.md](SOURCES.md) before updating them.

## What the checker does

- Parses JSON and checks a selected set of field shapes, dates, numbers, URLs, references and Google feature profiles.
- Extracts inline JSON-LD blocks from pasted HTML without executing its scripts or loading its assets.
- Reports observed page title, HTML canonical links and robots/googlebot meta directives, including possible noindex instructions.
- Identifies possible Microdata or RDFa without validating those formats.
- Produces errors, warnings and informational notes with property paths. The UI accepts inputs up to 2 MiB.

This is a **limited local checker**, not a complete Schema.org or JSON-LD processor, an official Google test, or a live crawler. Custom contexts are not expanded, and not every type, property, allowed value or rich-result path is checked. Review the stated limitations in each report. An unsupported type is not necessarily invalid Schema.org markup.

It cannot establish that content is accurate and visible, that images or URLs are reachable, that robots.txt permits Googlebot, that HTTP headers allow indexing, or that JavaScript renders the expected content. It cannot determine Google's selected canonical, verify actual indexing, or guarantee rankings or rich results. `noindex` is an indexing instruction and does not by itself prove that crawling is blocked.

Use [Schema.org Validator](https://validator.schema.org/) for broader vocabulary checks and [Google Rich Results Test](https://search.google.com/test/rich-results) for supported Google features. After deployment, use [Search Console URL Inspection](https://support.google.com/webmasters/answer/9012289) for Google's view of the URL. Even correctly marked-up pages are not guaranteed a rich result.

## Add the output to a website

Place the generated `<script type="application/ld+json">` on the page it describes, in its HTML head or body. Keep the markup consistent with the visible page and update prices, availability, dates and business details when they change. Referenced image URLs should be public and relevant.

For WordPress, first inspect the output of existing SEO, ecommerce and schema plugins. Reuse their entity IDs and extend the existing graph where practical. Avoid adding competing Product, Organization or other descriptions with conflicting facts. Use a page-specific custom HTML area or a maintained injection method that supports page conditions and preserves JSON-LD. Do not insert every schema type on every page. Check the actual published source because a CMS may strip or modify script tags.

For example, a genuine service page may describe its Service, provider, WebPage and BreadcrumbList. The homepage can describe the Organization and WebSite. A product detail page should describe its actual product and offer. This choice depends on the content of each page.

To host **the tool itself**, upload the contents of `dist/` to a static web host, preserving the filenames. `index.html` is the entry point. Review your host's own analytics, logs and security settings separately. Hosting the tool does not add schema to client websites automatically.

## Privacy and saved work

The app makes no automatic external network requests and includes no analytics or browser storage. Hosted use still loads its app files from your host; opening an external documentation link contacts that destination. Form values, page schema and reports stay in memory until you explicitly copy or download them. Refreshing or closing the page can lose unsaved work, so download useful output first. The checker can read an exported file, but there is no complete project-session restore feature.

Downloaded schema and reports may contain the names, URLs, entity IDs, page details and other information you supplied or pasted. Review exported files before sharing them. Importing HTML does not execute its contents.

## Development

Use Node.js 18 or newer. The project has no runtime or build dependencies; no package installation is needed.

```sh
npm test
npm run build
```

`npm test` runs local automated checks. `npm run build` combines the files in `dist/` into the portable `index.html`. Edit the source files in `dist/` and rebuild the portable file after changes. Local tests do not establish live Google eligibility.

| File | Purpose |
| --- | --- |
| `dist/schema-engine.js` | Template metadata, node generation, graph serialization and focused rule checks |
| `dist/page-checker.js` | Inert HTML source analysis and inline JSON-LD extraction |
| `dist/audit-runner.js` | Combines input checks while preserving each HTML script block's context and error paths |
| `dist/app.js` | Browser interactions and export/report flow |
| `dist/index.html`, `dist/styles.css` | Interface and styling |
| `build.js` | Portable HTML build |
| `tests/` | Automated local tests |

### Small developer API

All three checking modules support CommonJS. In a browser they expose `window.HustleSchema`, `window.HustlePageChecker`, and `window.HustleAudit`.

```js
const schema = require('./dist/schema-engine.js');
const pageChecker = require('./dist/page-checker.js');

const organization = schema.generate('Organization', {
  name: 'Example Studio',
  url: 'https://example.com/',
  id: 'https://example.com/#organization'
});
const document = schema.graph([organization]);
const snippet = schema.scriptTag(document);
const report = schema.validate(document);
console.log(report.summary, report.issues);

// Supply trusted source text to inspect; this function performs no fetch.
const page = pageChecker.analyze(snippet, 'https://example.com/');
console.log(page.documents, page.issues, page.page);
```

- `TYPES`: the 12 template definitions, field metadata, examples and source URLs.
- `generate(typeId, form)`: returns a node or throws an input error. Its form keys follow that template's metadata.
- `graph(nodes)`: wraps one or more nodes in a Schema.org `@graph` document.
- `serialize(data)` / `scriptTag(data)`: safely serialize JSON-LD or its script wrapper, escaping characters that could prematurely end an HTML script element.
- `validate(input)`: accepts JSON text or a parsed value; returns `{ issues, nodes, summary }`. It does not return an official eligibility verdict.
- `analyze(html, pageUrl)`: returns `{ documents, issues, page, blocks }`; the optional page URL is a resolution hint only.
- `HustleAudit.inspect(input, mode, pageUrl)`: runs the complete input flow for `json` or `html` and returns `{ issues, nodes, page? }`. HTML blocks keep their individual context warnings and source paths; a combined pass checks shared IDs across blocks.

## Roadmap (not yet implemented)

- Live URL auditing with a controlled backend, SSRF protections, safe redirect handling, private-network blocking, fetch limits and robots-aware behavior.
- Additional carefully documented templates, richer merchant listings and product variants, and broader Schema.org/JSON-LD processing.
- Authenticated Search Console integration for authorized site inspection and monitoring. This would require separate account authorization and is not part of the local app.
- Project-session import/export and versioned rule updates with regression fixtures.

The present tool combines generation, entity connections and understandable checks. It does not claim that schema generators or validators are unique to Hustle Marketers.

## Related

- [seo-audit-toolkit](https://github.com/hustlemarketers-art/seo-audit-toolkit): technical SEO crawler that also flags JSON-LD syntax errors across a whole sitemap.
- [Free SEO and PPC tools](https://hustlemarketers.com/tools/) from Hustle Marketers.

## Author

**Ishant Sharma** (Chandigarh, India) has worked in SEO and paid search since 2013 and leads [Hustle Marketers](https://hustlemarketers.com/), a digital marketing agency covering technical SEO, structured data and AI search visibility. [Get in touch](https://hustlemarketers.com/contact-us/).

## License

[MIT](LICENSE). Demo values in the templates and examples are fictional; replace them with real, visible page details.
