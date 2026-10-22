'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href?: string
  label?: string
  replace?: boolean
}

const BACK_BUTTON_CLASS =
  'cursor-pointer inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-[#765e58] shadow-sm transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'

export default function BackButton({ href, label = 'Voltar', replace = false }: BackButtonProps) {
  const router = useRouter()

  if (href) {
    return (
      <Link
        href={href}
        replace={replace}
        aria-label={label}
        title={label}
        className={BACK_BUTTON_CLASS}
      >
        <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
      </Link>
    )
  }

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      title={label}
      className={BACK_BUTTON_CLASS}
    >
      <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
    </button>
  )
}
