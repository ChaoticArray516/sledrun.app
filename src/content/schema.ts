import { plainText, type PageContent } from './types';

const origin = 'https://sledrun.app';

function faqSchema(page: PageContent) {
  const id = page.path === '/' ? `${origin}/#faq` : `${origin}${page.path}#faq`;
  return {
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: plainText(faq.answer) },
    })),
  };
}

function videoGameSchema(page: PageContent) {
  const url = page.path === '/' ? `${origin}/` : `${origin}${page.path}`;
  return {
    '@type': 'VideoGame',
    '@id': `${url}#game`,
    name: page.gameName,
    url,
    applicationCategory: 'GameApplication',
    gamePlatform: 'Web browser',
    operatingSystem: 'Any',
    playMode: 'SinglePlayer',
    inLanguage: 'en-US',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

export function createSchema(page: PageContent) {
  const url = page.path === '/' ? `${origin}/` : `${origin}${page.path}`;
  const graph: Record<string, unknown>[] = [];
  if (page.path === '/') {
    graph.push(
      { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'SledRun', inLanguage: 'en-US' },
      { '@type': 'WebPage', '@id': `${origin}/#webpage`, url: `${origin}/`, isPartOf: { '@id': `${origin}/#website` }, name: page.title, inLanguage: 'en-US', primaryImageOfPage: { '@type': 'ImageObject', url: `${origin}/og.png` } },
      videoGameSchema(page),
    );
  } else {
    graph.push(
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, isPartOf: { '@id': `${origin}/#website` }, name: page.title, inLanguage: 'en-US', breadcrumb: { '@id': `${url}#breadcrumb` } },
      videoGameSchema(page),
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SledRun', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: page.gameName, item: url },
      ] },
    );
  }
  graph.push(faqSchema(page));
  return { '@context': 'https://schema.org', '@graph': graph };
}
