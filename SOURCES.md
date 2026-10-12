# Rules and official sources

Reviewed: **12 October 2026**. These links document the feature boundaries used by Hustle Schema Studio. Google and Schema.org can change independently; check current official guidance before changing the rule set or making client-facing eligibility claims.

## Core guidance and testing

- [Google structured data overview](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data): supported formats and structured-data concepts.
- [Google general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): JSON-LD is recommended; markup should represent visible, relevant, accurate content. Technical validity does not guarantee a rich result, and quality requirements are not completely automatable.
- [Google supported feature gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery): supported Search features, which are narrower than the full Schema.org vocabulary.
- [Google Rich Results Test](https://search.google.com/test/rich-results): official testing for supported Google features.
- [Search Console URL Inspection](https://support.google.com/webmasters/answer/9012289): indexed-page information and live URL inspection for sites the user is authorized to inspect.
- [Schema.org Validator](https://validator.schema.org/) and [validator documentation](https://schema.org/docs/validator.html): broader Schema.org markup validation, separate from Google feature requirements.

## Template profiles

| Profile | Official source | Rule boundary used here |
| --- | --- | --- |
| Organization | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) | No required Google properties. Name, online identity and real-world contact details are useful recommendations. |
| LocalBusiness | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) | Name and physical address are required for the Google profile. Prefer the most specific applicable subtype. Review-snippet restrictions apply independently. |
| Person | [Schema.org Person](https://schema.org/Person) | Semantic identity type, not a dedicated generic Google Person rich-result feature. |
| WebSite | [Google site names](https://developers.google.com/search/docs/appearance/site-names) | Name and canonical domain/subdomain homepage URL are required for site-name markup. This is separate from the retired sitelinks search box. |
| WebPage | [Schema.org WebPage](https://schema.org/WebPage) | Semantic page description and relationships, with no generic rich-result promise. |
| Service | [Schema.org Service](https://schema.org/Service) | Semantic service description. The current Google feature gallery has no dedicated generic Service feature. |
| Article | [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article) | Article, BlogPosting and NewsArticle are covered by the Google guide. Properties are recommended, not mandatory. The generator provides an Article template. |
| Product + Offer | [Google product snippets](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) | Product name and one of offers, review or aggregateRating are required. The generator uses the Offer route. Offer needs price or priceSpecification.price; currency is recommended for snippets. |
| Merchant listings, scope reference | [Google merchant listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) | Merchant-listing requirements differ, including required currency. Full merchant listings, shipping, returns and variants are beyond this tool's checks. |
| BreadcrumbList | [Google breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) | At least two ListItems; position, name and an item URL, with documented exceptions for a final item URL and name on a nested Thing. |
| FAQPage | [Schema.org FAQPage](https://schema.org/FAQPage) and [Google documentation updates](https://developers.google.com/search/updates) | The vocabulary remains available. Google FAQ rich results stopped appearing on 7 May 2026. |
| Event | [Google Event](https://developers.google.com/search/docs/appearance/structured-data/event) | Name, start date and physical location/address are required. Virtual-only experiences without a real-world component are unsupported. |
| VideoObject | [Google Video](https://developers.google.com/search/docs/appearance/structured-data/video) | Name, thumbnailUrl and uploadDate are required. Description, duration and accessible contentUrl or embedUrl are recommended. |

The UI may require more information than a Google feature strictly requires to produce a useful template. Those form requirements must not be presented as universal Google or Schema.org requirements. Conversely, passing this app's subset of rules does not establish compliance with every rule in the linked guides.

## Changed and retired features

- [Google documentation updates](https://developers.google.com/search/updates), May 8 and June 15, 2026 entries: FAQ rich results stopped appearing from **7 May 2026**, and their documentation was subsequently removed. Older advice limiting FAQ rich results to authoritative health and government sites is no longer a complete current description.
- [Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes), September 14, 2023 update: Google stopped showing HowTo rich results on desktop from **13 September 2023**, completing that feature's retirement.
- [Farewell, sitelinks search box](https://developers.google.com/search/blog/2024/10/sitelinks-search-box): the search-box visual feature was removed starting **21 November 2024**. Other sitelinks and WebSite site names were unaffected.
- [Google Video documentation](https://developers.google.com/search/docs/appearance/structured-data/video) and [documentation updates](https://developers.google.com/search/updates), September 24, 2026: Google documents creator/author support. This release's video generator does not expose every recommended property.

## Adjacent feature boundaries

[Google ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page) is a distinct feature for qualifying profile pages. Its required mainEntity describes a Person or Organization identified by name or alternateName. Generating a plain Person does not implement all ProfilePage requirements, and this release does not provide a ProfilePage template.

Source links are references, not integrations. The app does not send pasted data to these services automatically, fetch their current rules, or imply affiliation with Google or Schema.org.
