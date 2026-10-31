/**
 * Builders for schema.org JSON-LD used on individual pages.
 * (Site-wide Person/WebSite/WebPage graph lives in `components/SeoHead.astro`.)
 */

/** Breadcrumb entry for the BreadcrumbList JSON-LD (`url` relative to the site root). */
export interface Breadcrumb {
  name: string;
  url: string;
}

export interface PageUrls {
  /** Absolute URL of the current page */
  canonicalUrl: string;
  /** Absolute site root URL, ending with `/` */
  siteUrl: string;
  /** `@id` of the Person node declared in SeoHead */
  personId: string;
}

/** Resolve absolute URLs for the current page (pass `Astro.site` and `Astro.url`). */
export function getPageUrls(site: URL | undefined, url: URL): PageUrls {
  const canonicalUrl = site ? new URL(url.pathname, site).toString() : url.href;
  const siteUrl = site ? site.toString() : new URL('/', canonicalUrl).toString();
  return { canonicalUrl, siteUrl, personId: `${siteUrl}#person` };
}

export interface ServiceListEntry {
  name: string;
  description: string;
  url: string;
}

/** schema.org `ItemList` of `Service` entries provided by the site owner. */
export function serviceItemListSchema(
  name: string,
  services: ServiceListEntry[],
  personId: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        url: service.url,
        provider: {
          '@type': 'Person',
          '@id': personId,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland',
        },
      },
    })),
  };
}

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

/** schema.org `FAQPage`; `plainAnswer` wins over the (tag-stripped) HTML answer. */
export function faqPageSchema(faqs: { question: string; answer: string; plainAnswer?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.plainAnswer ?? stripTags(faq.answer),
      },
    })),
  };
}
