/**
 * Scripture citations and licence notices.
 *
 * Every translation this site serves needs its own licence. Public-domain
 * translations must say so (users are entitled to know they may reuse the text),
 * and in-copyright translations must carry the publisher's required attribution.
 *
 * This is a copyright matter, not housekeeping. The site reproduces these texts
 * in full, and an in-copyright translation shipped without its notice is
 * infringement. The previous build carried no attribution for any translation
 * and the footer asserted "All rights reserved" - claiming rights the site does
 * not hold.
 */

export interface TranslationLicence {
  /**
   * `public-domain` texts may be copied and redistributed freely.
   * `copyrighted` texts are displayed under the publisher's terms and must be
   * attributed; the notice is displayed verbatim in the reader.
   */
  kind: 'public-domain' | 'copyrighted'
  /** The publisher or granting body, as it should be credited. */
  holder: string
  /** The licence or permission the text is displayed under. */
  licence: string
}

export const TRANSLATION_LICENCES: Record<string, TranslationLicence> = {
  WEB: {
    kind: 'public-domain',
    holder: 'World English Bible',
    licence:
      'Released into the public domain by the World English Bible contributors. Free to copy, redistribute and use in other works.',
  },
  KJV: {
    kind: 'public-domain',
    holder: 'King James Version',
    licence:
      'Published in 1611 and long out of copyright. Free to use.',
  },
  ASV: {
    kind: 'public-domain',
    holder: 'American Standard Version (1901)',
    licence:
      'Published in 1901; the copyright has long expired. Free to use.',
  },
  RV1909: {
    kind: 'public-domain',
    holder: 'Reina-Valera 1909',
    licence:
      'Published in 1909 and in the public domain. Free to use.',
  },
  BSB: {
    kind: 'copyrighted',
    holder: 'The Berean Bible / Biblehub',
    licence:
      'The Berean Standard Bible is © Biblehub / Source Bible Software and is NOT in the public domain. It appears here under the publisher’s free-use terms, which require this attribution. All rights remain with the copyright holder.',
  },
  HINDI: {
    kind: 'copyrighted',
    holder: 'Bible Society of India',
    licence:
      'The Hindi Bible is © the Bible Society of India and is NOT in the public domain. It appears here with permission, which requires this attribution. All rights remain with the copyright holder.',
  },
}

/** The licence for one translation, or undefined for an unknown key. */
export function translationLicence(key: string): TranslationLicence | undefined {
  return TRANSLATION_LICENCES[key]
}

/** One-line credit, suitable for an inline line under the reader. */
export function translationCredit(key: string): string {
  const entry = TRANSLATION_LICENCES[key]
  if (!entry) return ''
  return entry.kind === 'public-domain'
    ? `${entry.holder} — public domain.`
    : `${entry.holder} — © the copyright holder. Displayed with attribution.`
}

/**
 * Any translation in `keys` that has no licence entry.
 *
 * Called from the build so a newly added translation without a licence fails the
 * build loudly, rather than shipping text the site has no right to display.
 */
export function translationsNeedingLicence(keys: readonly string[]): string[] {
  return keys.filter(k => !TRANSLATION_LICENCES[k])
}