import LegalPage, { LegalSection } from '@/components/layout/LegalPage'
import { CONTACT_EMAIL, SITE_NAME } from '@/utils/siteConfig'

/**
 * About page.
 *
 * Also the right place to be honest about how the devotional text is produced.
 * Google's spam policy targets automation-generated content produced at scale
 * without added value, and a visitor deserves to know what they are reading. We
 * would rather state it plainly than hope nobody asks.
 */
export default function About() {
  return (
    <LegalPage
      title="About"
      seoTitle="About"
      canonical="/about"
      seoDescription={`Who we are, what ${SITE_NAME} offers, and how its devotional content is written and reviewed.`}
      showDate={false}
    >
      <p>
        {SITE_NAME} is a devotional project built to help people read a passage of
        Scripture in the morning and sit with it for a few minutes — on the web, and
        in a companion Android app whose reading progress syncs with this site.
      </p>

      <LegalSection title="What is here">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>A daily verse with a reflection, a prayer and a practical application.</li>
          <li>Over 250 Bible stories, each with context, reflection, prayer and application.</li>
          <li>Teachings of Jesus drawn from the Gospels, with meaning and application.</li>
          <li>A prayer library organised by situation — morning, evening, healing, strength, thanksgiving, protection, forgiveness, family.</li>
          <li>A complete 66-book Bible reader in six translations, with notes and highlights.</li>
          <li>Guided reading plans and reading streaks.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How the content is written">
        <p>
          The devotional writing is <strong>drafted with AI assistance</strong> and
          then edited. Scripture quotations are never paraphrased or generated:
          every passage is reproduced from the translation shown alongside it, and
          every reference is given so you can check it against your own Bible. The
          narrative retellings, reflections and prayers are written by us and are
          intended to aid study, not to replace it.
        </p>
        <p>
          We know that volume alone is not value, and we are actively reviewing and
          rewriting entries so they read less uniformly and speak more specifically
          to each story. If you spot a reflection that feels mechanical or a detail
          you believe is wrong, please tell us — corrections are genuinely welcome
          and we act on them.
        </p>
      </LegalSection>

      <LegalSection title="Scripture and copyright">
        <p>
          We are careful about the translations we publish. The King James Version,
          American Standard Version (1901), World English Bible and Reina-Valera 1909
          are in the public domain. The Berean Standard Bible and the Hindi Bible are
          <strong> not</strong> — they remain the property of their publishers and are
          displayed here with the attribution their licences require. The full
          position for each translation is set out on the{' '}
          <a href="/privacy" className="text-gold-700 underline">Privacy Policy</a>{' '}
          page, and every translation shows its own credit in the reader.
        </p>
      </LegalSection>

      <LegalSection title="Editorial standards">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Scripture is always quoted accurately and always referenced.</li>
          <li>Bible stories are retold from the text, with the interpretive gaps labelled as such.</li>
          <li>We do not publish content designed to exploit fear, or predict dates and events.</li>
          <li>We do not accept payment for coverage, and advertising is kept separate from editorial content.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Corrections, questions and feedback are all welcome at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-700 underline">{CONTACT_EMAIL}</a>,
          or through the <a href="/contact" className="text-gold-700 underline">contact page</a>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
