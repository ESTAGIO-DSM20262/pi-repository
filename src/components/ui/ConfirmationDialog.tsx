'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRestoreFocus } from '@/libs/useRestoreFocus'
import {
  type DialogTone,
  dialogBackdropStyle,
  dialogBodyClass,
  dialogCancelButtonClass,
  dialogCloseClass,
  dialogConfirmButtonClass,
  dialogEyebrowClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogIconChipClass,
  dialogOverlayClass,
  dialogPanelClass,
  dialogTitleClass,
  dialogTopLayerClass,
} from './dialog-styles'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  details?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  icon?: string
  tone?: DialogTone
  eyebrow?: string
  pending?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmationDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel = 'Cancelar',
  icon = 'fi-rr-triangle-warning',
  tone = 'danger',
  eyebrow,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  useRestoreFocus(open)
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

  return createPortal(
    <div
      className={`${dialogOverlayClass} ${dialogTopLayerClass} transition-opacity duration-200 motion-reduce:transition-none ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute inset-0"
        style={dialogBackdropStyle}
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
        aria-describedby={
          details
            ? 'confirmation-dialog-description confirmation-dialog-details'
            : 'confirmation-dialog-description'
        }
        className={`${dialogPanelClass('md')} transition duration-200 motion-reduce:transition-none ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-[0.98] opacity-0'
        }`}
      >
        <header className={dialogHeaderClass}>
          <span className={dialogIconChipClass(tone)}>
            <i className={`fi ${icon} flex text-xl`} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={dialogEyebrowClass(tone)}>{eyebrow ?? 'Confirmação'}</p>
            <h2 id="confirmation-dialog-title" className={dialogTitleClass}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label="Fechar"
            className={dialogCloseClass}
          >
            <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
          </button>
        </header>

        <div className={dialogBodyClass}>
          <p
            id="confirmation-dialog-description"
            className="whitespace-pre-line break-words text-sm leading-relaxed text-text-secondary"
          >
            {description}
          </p>
          {details && (
            <div
              id="confirmation-dialog-details"
              className="mt-4 rounded-lg border border-border bg-surface-secondary p-3.5 text-sm leading-relaxed text-slate-800"
            >
              {details}
            </div>
          )}
        </div>

        <footer className={dialogFooterClass}>
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className={dialogCancelButtonClass}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              void onConfirm()
            }}
            className={dialogConfirmButtonClass}
          >
            {pending && <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />}
            {pending ? 'Processando…' : confirmLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
