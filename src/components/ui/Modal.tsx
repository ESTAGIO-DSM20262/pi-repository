'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { primaryButtonClass } from '../../libs/styles'

export type ModalVariant = 'success' | 'error' | 'warning'

export interface Notice {
  variant: ModalVariant
  title: string
  description: string
}

const VARIANT: Record<ModalVariant, { icon: string; halo: string; core: string }> = {
  success: { icon: 'fi-rr-check', halo: 'bg-emerald-50', core: 'bg-emerald-100 text-emerald-700' },
  error: {
    icon: 'fi-rr-exclamation',
    halo: 'bg-primary-light/60',
    core: 'bg-primary-light text-primary',
  },
  warning: {
    icon: 'fi-rr-triangle-warning',
    halo: 'bg-primary-light/60',
    core: 'bg-primary-light text-primary',
  },
}

interface ModalProps {
  open: boolean
  variant: ModalVariant
  title: string
  description: string
  buttonLabel: string
  onClose: () => void
  showClose?: boolean
}

export default function Modal({
  open,
  variant,
  title,
  description,
  buttonLabel,
  onClose,
  showClose = true,
}: ModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => setShown(true))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return

    const root = document.documentElement
    const body = document.body
    const previousBodyOverflow = body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousRootBackground = root.style.backgroundColor
    const previousGutter = root.style.scrollbarGutter

    root.style.scrollbarGutter = 'stable'
    root.style.overflow = 'hidden'
    root.style.backgroundColor = '#020617'
    body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    buttonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      body.style.overflow = previousBodyOverflow
      root.style.overflow = previousRootOverflow
      root.style.backgroundColor = previousRootBackground
      root.style.scrollbarGutter = previousGutter
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null
  const { icon, halo, core } = VARIANT[variant]

  return createPortal(
    <div
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-4 transition-opacity duration-200 motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`}
    >
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => onCloseRef.current()}
        className="absolute inset-0 h-full w-full cursor-default"
        style={{
          backgroundColor: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 w-full max-w-[460px] rounded-2xl border border-border bg-surface px-6 pb-6 pt-8 text-center shadow-2xl transition duration-200 motion-reduce:transition-none sm:px-10 sm:pb-8 sm:pt-9 ${shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-secondary hover:text-foreground sm:right-4 sm:top-4"
          >
            <i className="fi fi-rr-cross-small flex text-xl leading-none" aria-hidden="true" />
          </button>
        )}

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20 ${halo}`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14 ${core}`}
          >
            <i className={`fi ${icon} flex text-2xl leading-none`} aria-hidden="true" />
          </div>
        </div>

        <h2 id="modal-title" className="mt-5 text-xl font-semibold text-slate-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-[360px] text-sm leading-relaxed text-text-secondary sm:mt-3 sm:text-[15px]">
          {description}
        </p>

        <button
          ref={buttonRef}
          type="button"
          onClick={onClose}
          className={`mt-6 sm:mt-7 ${primaryButtonClass}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}
