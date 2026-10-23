'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface AuthActionOverlayProps {
  message: string | null
}

export function AuthActionOverlay({ message }: AuthActionOverlayProps) {
  useEffect(() => {
    if (!message) return

    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousRootBackground = root.style.backgroundColor
    const previousGutter = root.style.scrollbarGutter

    root.style.scrollbarGutter = 'stable'
    root.style.overflow = 'hidden'
    root.style.backgroundColor = '#020617'
    body.style.overflow = 'hidden'

    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
      root.style.backgroundColor = previousRootBackground
      root.style.scrollbarGutter = previousGutter
    }
  }, [message])

  if (!message || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label="Aguarde enquanto a autenticação é processada"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
        }}
      />
      <div className="relative z-10 flex w-full max-w-[380px] flex-col items-center rounded-2xl border border-slate-200 bg-white px-7 py-8 text-center shadow-2xl sm:px-9">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
          <i className="fi fi-rr-spinner flex animate-spin text-2xl" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-bold text-slate-900">Aguarde um instante</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{message}</p>
        <p className="mt-4 text-[11px] text-slate-500">Não feche esta página durante o processo.</p>
      </div>
    </div>,
    document.body,
  )
}
