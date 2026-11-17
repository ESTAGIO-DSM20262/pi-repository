'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  dialogBackdropClass,
  dialogBodyClass,
  dialogCloseClass,
  dialogDescriptionClass,
  dialogEyebrowClass,
  dialogHeaderClass,
  dialogIconChipClass,
  dialogLayerClass,
  dialogOverlayClass,
  dialogPanelClass,
  dialogTitleClass,
} from '@/components/ui/dialog-styles'
import type { UserAuditAction, UserAuditEvent } from '@/domain/enterprise/entities/user-audit'
import { useRestoreFocus } from '@/libs/useRestoreFocus'

interface HistoryUser {
  id: string
  name: string
}

const ACTION_STYLE: Record<UserAuditAction, { label: string; icon: string; badge: string }> = {
  created: {
    label: 'Cadastro',
    icon: 'fi-rr-user-add',
    badge: 'border border-accent/40 bg-accent-light text-secondary-hover',
  },
  updated: { label: 'Edição', icon: 'fi-rr-pencil', badge: 'bg-primary-light text-primary' },
  activated: {
    label: 'Ativação',
    icon: 'fi-rr-check-circle',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  deactivated: {
    label: 'Desativação',
    icon: 'fi-rr-ban',
    badge: 'bg-amber-100 text-amber-900',
  },
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

function EventDetails({ event }: { event: UserAuditEvent }) {
  const { changes = [], facts = [], note } = event.details
  if (changes.length === 0 && facts.length === 0 && !note) return null

  return (
    <div className="mt-3 space-y-1.5 rounded-lg bg-surface-secondary p-3 text-xs text-slate-700">
      {changes.map((change) => (
        <p key={change.field} className="break-words">
          <span className="font-semibold text-slate-900">{change.label}:</span>{' '}
          <span className="text-text-secondary">{change.from ?? 'não informado'}</span>
          <i
            className="fi fi-rr-arrow-small-right mx-1 inline-flex align-middle"
            aria-hidden="true"
          />
          <span className="font-medium text-slate-900">{change.to ?? 'não informado'}</span>
        </p>
      ))}
      {facts.map((fact) => (
        <p key={fact.label} className="break-words">
          <span className="font-semibold text-slate-900">{fact.label}:</span> {fact.value}
        </p>
      ))}
      {note && <p className="text-text-secondary">{note}</p>}
    </div>
  )
}

export function UserHistoryModal({
  user,
  onClose,
}: {
  user: HistoryUser | null
  onClose: () => void
}) {
  const open = user !== null
  const [events, setEvents] = useState<UserAuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const onCloseRef = useRef(onClose)
  const userId = user?.id ?? null
  useRestoreFocus(open)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!userId) return
    let active = true
    setEvents([])
    setError('')
    setLoading(true)

    fetch(`/api/admin/users/${encodeURIComponent(userId)}/history`, { cache: 'no-store' })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          events?: UserAuditEvent[]
          error?: string
        }
        if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar o histórico.')
        if (active) setEvents(data.events ?? [])
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(
          reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  if (!user || typeof document === 'undefined') return null

  return createPortal(
    <div className={`${dialogOverlayClass} ${dialogLayerClass}`}>
      <button
        type="button"
        aria-label="Fechar histórico"
        tabIndex={-1}
        className={dialogBackdropClass}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-history-title"
        className={dialogPanelClass('md')}
      >
        <header className={dialogHeaderClass}>
          <span className={dialogIconChipClass('primary')}>
            <i className="fi fi-rr-time-past flex text-xl" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={dialogEyebrowClass('primary')}>Gestão de usuários</p>
            <h2 id="user-history-title" className={dialogTitleClass}>
              Histórico de ações
            </h2>
            <p className={`${dialogDescriptionClass} break-words`}>{user.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className={dialogCloseClass}>
            <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
          </button>
        </header>

        <div className={dialogBodyClass}>
          {loading && (
            <p role="status" className="py-6 text-center text-sm text-text-secondary">
              Carregando histórico…
            </p>
          )}

          {!loading && error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-slate-900">Nenhuma ação registrada</p>
              <p className="mt-1 text-xs text-text-secondary">
                O histórico começa a ser registrado a partir desta versão do sistema.
              </p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <ol className="space-y-4">
              {events.map((event) => {
                const style = ACTION_STYLE[event.action]
                return (
                  <li key={event.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${style.badge}`}
                      >
                        <i className={`fi ${style.icon} flex`} aria-hidden="true" />
                        {style.label}
                      </span>
                      <time dateTime={event.createdAt} className="text-xs text-text-secondary">
                        {formatDate(event.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{event.summary}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      Feito por{' '}
                      <span className="font-medium text-slate-700">{event.actorName}</span>
                    </p>
                    <EventDetails event={event} />
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
