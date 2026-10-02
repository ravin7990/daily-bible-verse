import { useState, type FormEvent } from 'react'
import LegalPage, { LegalSection } from '@/components/layout/LegalPage'
import { CONTACT_EMAIL, SITE_NAME } from '@/utils/siteConfig'

/**
 * Contact page.
 *
 * AdSense reviewers want a real way to reach the publisher, so this offers a
 * working form in addition to the address. It posts to a Formspree endpoint the
 * owner supplies via `VITE_CONTACT_FORM`; without one it falls back to a plain
 * mailto so the page is never a dead end.
 */
export default function Contact() {
  const [sent, setSent] = useState(false)
  const endpoint = import.meta.env.VITE_CONTACT_FORM as string | undefined

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    if (!endpoint) {
      // No form backend configured: fall back to the visitor's mail client.
      const data = new FormData(form)
      const subject = encodeURIComponent(String(data.get('subject') || 'Contact'))
      const body = encodeURIComponent(
        `From: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`,
      )
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
      return
    }
    event.preventDefault()
    try {
      await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      setSent(true)
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`
    }
  }

  return (
    <LegalPage
      title="Contact"
      seoTitle="Contact"
      canonical="/contact"
      seoDescription={`Get in touch with ${SITE_NAME} — corrections, feedback, questions or advertising enquiries.`}
      showDate={false}
    >
      <p>
        We read every message. The most useful ones tell us what you were reading,
        what you expected, and what actually happened.
      </p>

      <LegalSection title="Email">
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-700 underline font-medium">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>Typical response time is a few working days.</p>
      </LegalSection>

      <LegalSection title="Send a message">
        {sent ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            Thank you — your message has been sent. We will be in touch.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Your name" name="name" type="text" required />
            <Field label="Your email" name="email" type="email" required />
            <Field label="Subject" name="subject" type="text" required />
            <label className="block">
              <span className="block text-sm font-medium text-ink-800 mb-1.5">Message</span>
              <textarea
                name="message"
                rows={6}
                required
                className="w-full rounded-lg border border-parchment-300 bg-white px-3 py-2.5 text-[15px] text-ink-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200"
              />
            </label>
            <button type="submit" className="btn-primary">Send message</button>
            <p className="text-xs text-ink-500">
              We use your message only to reply to you. See our{' '}
              <a href="/privacy" className="text-gold-700 underline">Privacy Policy</a>.
            </p>
          </form>
        )}
      </LegalSection>

      <LegalSection title="Corrections">
        <p>
          If you believe a Bible story, reflection or teaching contains an error —
          especially a scriptural one — please send the reference and what you
          believe it should say. Corrections are the fastest kind of feedback for us
          to act on, and we will credit you if you would like.
        </p>
      </LegalSection>

      <LegalSection title="Privacy requests">
        <p>
          To access, export or permanently delete your account data, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-700 underline">{CONTACT_EMAIL}</a>{' '}
          with the email address on your account. We will verify the request before
          deleting anything, and normally complete it within 30 days.
        </p>
      </LegalSection>
    </LegalPage>
  )
}

function Field({
  label, name, type, required,
}: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-800 mb-1.5">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-lg border border-parchment-300 bg-white px-3 py-2.5 text-[15px] text-ink-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-200"
      />
    </label>
  )
}
