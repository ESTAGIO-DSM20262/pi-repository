'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  icon?: string
  tone?: 'primary' | 'danger'
  pending?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  icon = 'fi-rr-triangle-warning',
  tone = 'danger',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  const pendingRef = useRef(pending)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])
  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  useEffect(() => {
    if (!open) return

    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    const previousRootBackground = document.documentElement.style.backgroundColor
    const previousScrollbarGutter = document.documentElement.style.scrollbarGutter

    document.documentElement.style.scrollbarGutter = 'stable'
    document.documentElement.style.backgroundColor = '#020617'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => setShown(true))

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!pendingRef.current) onCancelRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const buttons =
        dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      if (!buttons?.length) return

      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    cancelButtonRef.current?.focus()

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
      document.documentElement.style.backgroundColor = previousRootBackground
      document.documentElement.style.scrollbarGutter = previousScrollbarGutter
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const buttonTone =
    tone === 'danger'
      ? 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary'
      : 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-700'

  return createPortal(
    <div
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-4 transition-opacity duration-200 motion-reduce:transition-none ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
        }}
        aria-hidden="true"
        onMouseDown={() => {
          if (!pendingRef.current) onCancelRef.current()
        }}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className={`relative overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl transition duration-200 motion-reduce:transition-none sm:p-7 ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-[0.98] opacity-0'
        }`}
        style={{
          width: '40vw',
          minWidth: 'min(320px, calc(100vw - 2rem))',
          maxWidth: 'min(640px, calc(100vw - 2rem))',
          maxHeight: 'calc(100dvh - 2rem)',
          boxSizing: 'border-box',
        }}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <i className={`fi ${icon} flex text-xl`} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id="confirmation-dialog-title"
              className="text-base font-bold leading-snug text-slate-900 sm:text-lg"
            >
              {title}
            </h2>
            <p
              id="confirmation-dialog-description"
              className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-text-secondary"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex min-h-11 min-w-[120px] flex-1 items-center justify-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              void onConfirm()
            }}
            className={`inline-flex min-h-11 min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 sm:flex-none ${buttonTone}`}
          >
            {pending && <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />}
            {pending ? 'Processando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
