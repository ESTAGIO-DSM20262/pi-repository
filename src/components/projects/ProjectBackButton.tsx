'use client'

import { useRouter } from 'next/navigation'

export function ProjectBackButton() {
  const router = useRouter()

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="cursor-pointer inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
      Voltar
    </button>
  )
}
