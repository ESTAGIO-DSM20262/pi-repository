'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { formatRelativeTime, unreadCountLabel } from '@/application/notifications/relative-time'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import type { AppNotification, NotificationType } from '@/domain/enterprise/entities/notification'
import { markAnnouncedThisSession, wasAnnouncedThisSession } from '@/libs/notification-announcement'
import { useRestoreFocus } from '@/libs/useRestoreFocus'
import { useAuth } from '@/presentation/auth/auth-context'

const POLL_INTERVAL_MS = 60_000
const TOAST_DURATION_MS = 9_000

const TYPE_ICON: Record<NotificationType, string> = {
  task_created: 'fi-rr-add-document',
  task_updated: 'fi-rr-edit',
  task_status_changed: 'fi-rr-refresh',
}

function projectHref(notification: AppNotification) {
  return notification.projectId
    ? `/projetos/${encodeURIComponent(notification.projectId)}#progresso`
    : null
}

export function NotificationCenter() {
  const { user } = useAuth()
  const router = useRouter()
  const userId = user ? user.id.toString() : ''
  const enabled = Boolean(user) && user?.role !== 'admin'
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const lastCount = useRef(0)
  const panelId = useId()

  useRestoreFocus(open)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function refreshCount(initial: boolean) {
      try {
        const response = await fetch('/api/notifications?resumo=1', { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as { unreadCount?: number }
        const count = typeof data.unreadCount === 'number' ? data.unreadCount : 0
        if (cancelled) return
        setUnread(count)

        const grew = count > lastCount.current
        lastCount.current = count
        if (count === 0) return
        if (initial && !wasAnnouncedThisSession(userId)) {
          markAnnouncedThisSession(userId)
          setToast(
            count === 1 ? 'Você tem 1 nova notificação.' : `Você tem ${count} novas notificações.`,
          )
        } else if (!initial && grew) {
          setToast('Você recebeu uma nova notificação.')
        }
      } catch {
        return
      }
    }

    refreshCount(true)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshCount(false)
    }, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [enabled, userId])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!open || confirmClearOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, confirmClearOpen])

  async function loadList() {
    setLoading(true)
    setFailed(false)
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar')
      const data = (await response.json()) as {
        unreadCount: number
        notifications: AppNotification[]
      }
      setItems(data.notifications)
      setUnread(data.unreadCount)
      lastCount.current = data.unreadCount
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  function togglePanel() {
    setToast(null)
    const next = !open
    setClearError(false)
    setOpen(next)
    if (next) loadList()
  }

  async function markRead(body: { all: true } | { ids: string[] }) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) return
      const data = (await response.json()) as { unreadCount: number }
      setUnread(data.unreadCount)
      lastCount.current = data.unreadCount
    } catch {
      return
    }
  }

  async function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })))
    await markRead({ all: true })
  }

  async function clearAll() {
    setClearing(true)
    setClearError(false)
    try {
      const response = await fetch('/api/notifications', { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao limpar')
      setItems([])
      setUnread(0)
      lastCount.current = 0
      setConfirmClearOpen(false)
    } catch {
      setClearError(true)
      setConfirmClearOpen(false)
    } finally {
      setClearing(false)
    }
  }

  async function openNotification(notification: AppNotification) {
    const href = projectHref(notification)
    setOpen(false)
    if (!notification.read) {
      setItems((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      )
      await markRead({ ids: [notification.id] })
    }
    if (href) router.push(href)
  }

  if (!enabled) return null

  const badge = unread > 99 ? '99+' : String(unread)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Notificações. ${unreadCountLabel(unread)}`}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-primary transition hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <i className="fi fi-rr-bell flex text-lg" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold leading-none text-white ring-2 ring-white"
          >
            {badge}
          </span>
        )}
      </button>

      {toast && !open && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-3 top-[4.75rem] z-[90] flex w-[min(360px,calc(100vw-24px))] items-start gap-3 rounded-xl border border-border border-l-4 border-l-primary bg-white p-3.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200 sm:top-[5.5rem] sm:right-6"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
            <i className="fi fi-rr-bell flex text-base" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{toast}</p>
            <button
              type="button"
              onClick={togglePanel}
              className="mt-1 cursor-pointer text-xs font-semibold text-primary hover:underline"
            >
              Ver notificações
            </button>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Fechar aviso"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-secondary transition hover:bg-border-light hover:text-foreground"
          >
            <i className="fi fi-rr-cross-small flex text-lg" aria-hidden="true" />
          </button>
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            id={panelId}
            aria-label="Notificações"
            className="fixed inset-x-3 top-[4.75rem] z-50 overflow-hidden rounded-xl border border-border bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[380px]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-light bg-surface-secondary/70 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Notificações</h2>
                <p className="text-[0.6875rem] text-text-secondary">{unreadCountLabel(unread)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unread === 0}
                  className="cursor-pointer text-xs font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  Marcar todas como lidas
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={items.length === 0}
                  className="cursor-pointer text-xs font-semibold text-text-secondary transition hover:text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  Limpar notificações
                </button>
              </div>
            </div>
            {clearError && (
              <p
                role="alert"
                className="border-b border-border-light bg-primary-light/50 px-4 py-2 text-[0.6875rem] font-medium text-primary"
              >
                Não foi possível limpar as notificações. Tente novamente.
              </p>
            )}

            <div className="max-h-[min(420px,calc(100vh-10rem))] overflow-y-auto">
              {loading && items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-text-secondary">Carregando…</p>
              ) : failed ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-text-secondary">
                    Não foi possível carregar as notificações.
                  </p>
                  <button
                    type="button"
                    onClick={loadList}
                    className="mt-2 cursor-pointer text-xs font-semibold text-primary hover:underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <i className="fi fi-rr-bell flex justify-center text-2xl text-text-muted" />
                  <p className="mt-2 text-sm text-text-secondary">Você não tem notificações.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border-light">
                  {items.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-surface-secondary ${notification.read ? '' : 'bg-primary-light/40'}`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.read ? 'bg-surface-secondary text-text-secondary' : 'bg-primary-light text-primary'}`}
                        >
                          <i
                            className={`fi ${TYPE_ICON[notification.type]} flex text-sm`}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="rounded-full bg-primary px-1.5 py-px text-[0.5625rem] font-semibold text-white">
                                Nova
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block break-words text-xs leading-relaxed text-slate-700">
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-[0.6875rem] text-text-secondary">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      <ConfirmationDialog
        open={confirmClearOpen}
        title="Limpar notificações?"
        description="Todas as suas notificações serão removidas, lidas ou não. Essa ação não pode ser desfeita."
        icon="fi-rr-bell"
        tone="danger"
        confirmLabel="Limpar notificações"
        cancelLabel="Manter notificações"
        pending={clearing}
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={clearAll}
      />
    </div>
  )
}
