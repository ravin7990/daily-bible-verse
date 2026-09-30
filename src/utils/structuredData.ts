import type { DailyContent, Story } from '@/types'

/** JSON-LD for the home page (WebSite + WebPage) */
export function websiteSchema(url: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: 'Bible Verse of the Day',
        description: 'Daily Bible verses, reflections, prayers, and devotionals.',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${url}/stories?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: 'Bible Verse of the Day',
        url,
        logo: { '@type': 'ImageObject', url: `${url}/icons/icon-512.png` },
      },
    ],
  }
}

/** JSON-LD for today's verse (Article) */
export function dailyVerseSchema(content: DailyContent, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${content.verse_of_the_day.reference} — Verse of the Day`,
    description: content.verse_of_the_day.text,
    datePublished: content.date,
    dateModified: content.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Bible Verse of the Day' },
    publisher: {
      '@type': 'Organization',
      name: 'Bible Verse of the Day',
      logo: { '@type': 'ImageObject', url: `${url.replace(/\/[^/]*$/, '')}/icons/icon-512.png` },
    },
    articleBody: [
      content.verse_of_the_day.text,
      content.reflection.content,
      content.daily_prayer.content,
      content.life_application.content,
    ].join(' '),
  }
}

/** JSON-LD for a Bible story (Article) */
export function storySchema(story: Story, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.summary,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Bible Verse of the Day' },
    publisher: { '@type': 'Organization', name: 'Bible Verse of the Day' },
    keywords: [story.tag, 'Bible story', 'Christian devotional'].join(', '),
    articleBody: story.story,
  }
}

/** JSON-LD for stories listing (CollectionPage) */
export function storiesCollectionSchema(url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Bible Stories',
    description: 'Explore 180+ in-depth Bible stories with reflections and prayers.',
    url,
  }
}

/** Inject JSON-LD into the document head */
export function injectJsonLd(schema: object): string {
  return JSON.stringify(schema)
}
