import LegalPage, { LegalSection } from '@/components/layout/LegalPage'
import { CONTACT_EMAIL, SITE_NAME } from '@/utils/siteConfig'
import { TRANSLATION_LICENCES } from '@/utils/translations'

/**
 * Privacy Policy.
 *
 * Google AdSense requires a real, reachable policy that specifically describes
 * cookie and third-party advertising use, and requires you to declare one in the
 * AdSense console. It therefore has to be a page a reviewer can open and read.
 */
export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      seoTitle="Privacy Policy"
      canonical="/privacy"
      seoDescription={`How ${SITE_NAME} collects, uses and protects your data, including advertising cookies and Google AdSense.`}
    >
      <p>
        This policy explains what {SITE_NAME} collects, why, and what you can
        control. It applies to this website and to the companion mobile app.
      </p>

      <LegalSection title="What we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Reading progress you choose to save.</strong> If you create an
            account, the passages you have read, verses you have saved, the
            highlights and notes you write, and your reading-plan progress are
            stored so they can follow you across devices.
          </li>
          <li>
            <strong>Account details.</strong> If you sign in we store your email
            address and display name. With Google sign-in we receive the
            identifier Google provides — never your Google password.
          </li>
          <li>
            <strong>Private journal entries.</strong> Prayers and confessions you
            write are stored so they can sync to your other devices. Confessions
            are encrypted before being stored.
          </li>
          <li>
            <strong>Technical data.</strong> Standard server logs, including your
            IP address, browser type and the pages requested, kept for security
            and diagnostics.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> knowingly collect data from children under
          13, and we do not sell personal information.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and advertising">
        <p>
          We and our partners use cookies and similar technologies. Some are
          needed to run the site — keeping you signed in, for example. Others are
          used to measure traffic and to show advertising.
        </p>
        <p>
          This site uses{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google AdSense
          </a>{' '}
          to display advertisements. Google may use cookies to serve ads based on
          your prior visits to this and other websites.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Google's use of advertising cookies enables it and its partners to
            serve ads based on your visits to this site and/or other sites.
          </li>
          <li>
            Opt out of personalised advertising at{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>
            , or of third-party vendor cookies at{' '}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
              aboutads.info
            </a>
            .
          </li>
          <li>
            You can also manage cookies in your browser settings, though blocking
            cookies may stop parts of the site from working.
          </li>
        </ul>
        <p>
          For visitors in the EEA, the United Kingdom and Switzerland we ask for
          consent before setting non-essential advertising cookies. You can change
          your choice at any time via the cookie banner.
        </p>
      </LegalSection>

<LegalSection title="Third-party services">
        <p>We use the following providers, each governed by its own privacy policy:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Google Firebase</strong> — authentication, database and file storage for your account data.</li>
          <li><strong>Google AdSense</strong> — advertising.</li>
          <li><strong>GitHub Pages</strong> — website hosting.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Scripture translations and copyright">
        <p>
          Bible translations remain the property of their respective copyright
          holders. Public-domain translations may be reused freely. The
          translations below that are <em>not</em> public domain are shown with the
          publisher's attribution, as their terms require.
        </p>
        <dl className="space-y-2.5">
          {Object.entries(TRANSLATION_LICENCES).map(([key, l]) => (
            <div key={key}>
              <dt className="font-semibold text-ink-900">
                {key}
                <span className={
                  l.kind === 'public-domain'
                    ? 'ml-2 text-[11px] font-medium uppercase tracking-wide text-emerald-700'
                    : 'ml-2 text-[11px] font-medium uppercase tracking-wide text-amber-700'
                }>
                  {l.kind === 'public-domain' ? 'Public domain' : '© Copyrighted'}
                </span>
              </dt>
              <dd className="text-[14px] text-ink-600">{l.licence}</dd>
            </div>
          ))}
        </dl>
      </LegalSection>

      <LegalSection title="Your rights and choices">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Edit or delete saved data from inside the app.</li>
          <li>Request an export or permanent deletion of your account data.</li>
          <li>Opt out of personalised advertising as described above.</li>
        </ul>
        <p>
          Depending on where you live you may also have the right to access,
          correct or erase your personal data, or to object to its processing. To
          make such a request, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-700 underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Security, retention and children">
        <p>
          We use Firebase Authentication and encrypted transport to protect data in
          transit and at rest. No method of transmission or storage is completely
          secure. Sensitive journal entries are encrypted on the device before
          synchronisation. We retain account data while your account is active and
          delete it on request, usually within 30 days.
        </p>
        <p>
          The service is not directed at children under 13, and we do not
          knowingly collect their personal information. If you believe a child has
          given us personal data, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          We may update this policy; material changes will be reflected in the
          date above. Questions can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-700 underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
