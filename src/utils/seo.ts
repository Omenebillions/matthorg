/**
 * SEO, Document Head, OpenGraph, Canonical and JSON-LD Structured Data Manager
 * strictly adhering to applet-seo skill guidelines and truth-in-advertising rules:
 * - NO fake LocalBusiness ratings, fake stars, or fabricated reviews
 * - Genuine structured data for Articles, Services, BreadcrumbList, WebSite, and Organization
 * - OpenGraph + Twitter Social Sharing cards
 * - Canonical link resolution
 */

export interface MetaTagOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  schema?: Record<string, any> | Record<string, any>[];
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  keywords?: string[];
}

export function updatePageMetadata(options: MetaTagOptions) {
  if (typeof document === 'undefined') return;

  const {
    title,
    description,
    canonicalPath,
    ogType = 'website',
    ogImage = '/apple-touch-icon.png',
    schema,
    articlePublishedTime,
    articleModifiedTime,
    articleAuthor,
    keywords,
  } = options;

  // 1. Page Title
  document.title = title;

  // Helper to get or create meta tag
  const setMeta = (attribute: 'name' | 'property', name: string, content: string) => {
    let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 2. Standard Meta
  setMeta('name', 'description', description);
  if (keywords && keywords.length > 0) {
    setMeta('name', 'keywords', keywords.join(', '));
  }

  // 3. OpenGraph Tags
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', ogType);
  setMeta('property', 'og:site_name', 'MatthOrg');

  // Origin resolution
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  const fullUrl = canonicalPath ? `${origin}${canonicalPath}` : window.location.href;
  setMeta('property', 'og:url', fullUrl);

  const fullImage = ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`;
  setMeta('property', 'og:image', fullImage);

  // 4. Twitter Card Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', fullImage);

  // 5. Article specific meta if available
  if (ogType === 'article') {
    if (articlePublishedTime) setMeta('property', 'article:published_time', articlePublishedTime);
    if (articleModifiedTime) setMeta('property', 'article:modified_time', articleModifiedTime);
    if (articleAuthor) setMeta('property', 'article:author', articleAuthor);
  }

  // 6. Canonical link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', fullUrl);

  // 7. JSON-LD Structured Data
  let scriptEl = document.getElementById('matthorg-dynamic-ldjson') as HTMLScriptElement | null;
  if (schema) {
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'matthorg-dynamic-ldjson';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema, null, 2);
  } else if (scriptEl) {
    scriptEl.remove();
  }
}

/**
 * Generate BreadcrumbList Schema JSON-LD
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${origin}${item.url}`,
    })),
  };
}

/**
 * Generate Article Schema JSON-LD
 */
export function generateArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url.startsWith('http') ? params.url : `${origin}${params.url}`,
    },
    image: params.imageUrl,
    datePublished: params.publishedAt,
    dateModified: params.updatedAt,
    author: {
      '@type': 'Person',
      name: params.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MatthOrg',
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/apple-touch-icon.png`,
      },
    },
  };
}

/**
 * Generate Service Schema JSON-LD (Service + Location)
 */
export function generateServiceSchema(params: {
  serviceName: string;
  locationName: string;
  description: string;
  url: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${params.serviceName} in ${params.locationName}`,
    serviceType: params.serviceName,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: params.locationName,
    },
    provider: {
      '@type': 'Organization',
      name: 'MatthOrg Marketplace',
      url: origin,
    },
    description: params.description,
    url: params.url.startsWith('http') ? params.url : `${origin}${params.url}`,
  };
}
