import LegalPage, { LegalSection } from '@/components/layout/LegalPage'
import { CONTACT_EMAIL, SITE_NAME } from '@/utils/siteConfig'

/** Terms of Use. Required by AdSense reviewers alongside the privacy policy. */
export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      seoTitle="Terms of Use"
      canonical="/terms"
      seoDescription={`The terms that govern your use of ${SITE_NAME}, including acceptable use and the nature of its content.`}
    >
      <p>
        By using {SITE_NAME} (“the Service”) you agree to these terms. If you do
        not agree, please do not use the Service.
      </p>

      <LegalSection title="Nature of the Service">
        <p>
          The Service is offered for personal, non-commercial study of the Bible.
          It provides devotional content, public-domain and licensed Bible
          translations, reading tools, and the ability to save your own progress and
          notes.
        </p>
        <p>
          The Service is provided <strong>“as is”</strong>, without warranty of any
          kind. Scripture is quoted for study; where a translation is quoted, the
          reference is always given so you can check it against your own copy.
        </p>
      </LegalSection>

      <LegalSection title="Not professional advice">
        <p>
          Prayers, reflections, Bible stories and teachings on this Service are
          offered for spiritual encouragement and study only. Nothing here is
          medical, psychological, legal, or financial advice, and nothing here
          substitutes for qualified professional help. If you are struggling, please
          speak to a qualified professional and, if you wish, to someone in your
          own congregation.
        </p>
      </LegalSection>

      <LegalSection title="Your account and content">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            You are responsible for keeping your sign-in credentials secure and for
            activity that happens under your account.
          </li>
          <li>
            You keep ownership of the notes, highlights, journal entries and
            confessions you write. You grant us only the limited licence needed to
            store, back up and display them to you across your devices.
          </li>
          <li>
            You must not use the Service to store or distribute unlawful material,
            or to harass, abuse or infringe the rights of others.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Advertising">
        <p>
          The Service may display advertising supplied by Google AdSense and its
          partners. Advertisements are selected automatically; their presence is not
          an endorsement of the advertiser or of their products by {SITE_NAME}.
          We do not control the content of third-party advertisements. See our{' '}
          <a href="/privacy" className="text-gold-700 underline">Privacy Policy</a>{' '}
          for how advertising cookies work and how to opt out.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The devotional text, original reflections, study tools, design and
          software of this Service are owned by {SITE_NAME} or its contributors and
          are protected by copyright. Bible translations remain the property of
          their respective publishers; several are in the public domain, and the
          others are displayed with the attribution their licences require. The
          specific terms for each translation are listed on the{' '}
          <a href="/privacy" className="text-gold-700 underline">Privacy Policy</a>{' '}
          page.
        </p>
        <p>
          You may quote short extracts of Scripture for study, teaching and
          commentary, with the reference and, where the translation requires it, the
          attribution shown in the reader.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          We may modify, suspend or discontinue any part of the Service, and may
          change these terms. Continued use after a change means you accept the
          revised terms. We will update the date at the top of this page when these
          terms change.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {SITE_NAME} is not liable for any
          indirect, incidental or consequential loss arising from your use of the
          Service, including loss of data. Nothing in these terms limits liability
          that cannot lawfully be limited.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-700 underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
