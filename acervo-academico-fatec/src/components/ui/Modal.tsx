'use client'

import { useEffect, useRef, useState } from 'react'
import { primaryButtonClass } from '../../libs/styles'

export type ModalVariant = 'success' | 'error' | 'warning'

export interface Notice {
  variant: ModalVariant
  title: string
  description: string
}

const VARIANT: Record<ModalVariant, { icon: string; halo: string; core: string }> = {
  success: { icon: 'fi-rr-check', halo: 'bg-emerald-50', core: 'bg-emerald-100 text-emerald-700' },
  error: { icon: 'fi-rr-exclamation', halo: 'bg-primary-light/60', core: 'bg-primary-light text-primary' },
  warning: { icon: 'fi-rr-triangle-warning', halo: 'bg-primary-light/60', core: 'bg-primary-light text-primary' },
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

export default function Modal({ open, variant, title, description, buttonLabel, onClose, showClose = true }: ModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => {
      cancelAnimationFrame(id)
      setShown(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    buttonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null
  const { icon, halo, core } = VARIANT[variant]

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[460px] rounded-2xl border border-border bg-surface px-6 pb-6 pt-8 text-center shadow-2xl transition duration-200 motion-reduce:transition-none sm:px-12 sm:pb-10 sm:pt-12 ${
          shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex sm:right-4 sm:top-4 h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-secondary hover:text-foreground"
          >
            <i className="fi fi-rr-cross-small flex text-xl leading-none" aria-hidden="true" />
          </button>
        )}

        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24 ${halo}`}>
          <div className={`flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16 ${core}`}>
            <i className={`fi ${icon} flex text-2xl leading-none sm:text-3xl`} aria-hidden="true" />
          </div>
        </div>

        <h2 id="modal-title" className="mt-5 text-xl font-semibold text-slate-900 sm:mt-6 sm:text-2xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-text-secondary sm:mt-3 sm:max-w-[360px] sm:text-[15px]">{description}</p>

        <button ref={buttonRef} type="button" onClick={onClose} className={`mt-7 sm:mt-8 ${primaryButtonClass}`}>
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}