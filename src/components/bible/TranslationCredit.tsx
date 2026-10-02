import { Link } from 'react-router-dom'
import { translationLicence } from '@/utils/translations'

/**
 * Copyright line shown under the chapter heading in the Bible reader.
 *
 * The Berean Standard Bible and the Hindi Bible are not in the public domain;
 * their publishers require an attribution notice. Public-domain translations get
 * one too, because readers are entitled to know which texts they may reuse.
 */
export default function TranslationCredit({ versionKey }: { versionKey: string }) {
  const licence = translationLicence(versionKey)

  if (!licence) {
    // A translation with no licence entry must never be shown silently: fail
    // visibly so the gap is obvious rather than invisible and infringing.
    return (
      <p className="px-6 sm:px-10 py-3 text-xs bg-amber-50 text-amber-900 border-y border-amber-200">
        Licence details for this translation are being confirmed. Please check the
        publisher's terms before reusing this text.
      </p>
    )
  }

  const isPublicDomain = licence.kind === 'public-domain'

  return (
    <p
      className={
        isPublicDomain
          ? 'px-6 sm:px-10 py-2.5 text-xs bg-parchment-50 text-ink-600 border-y border-parchment-200'
          : 'px-6 sm:px-10 py-2.5 text-xs bg-amber-50 text-amber-900 border-y border-amber-200'
      }
    >
      <strong className="font-semibold">{licence.holder}.</strong>{' '}
      {licence.licence}{' '}
      <Link to="/privacy" className="underline whitespace-nowrap">
        Full licence terms
      </Link>
    </p>
  )
}
