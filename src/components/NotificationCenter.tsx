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

  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

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
        {open ? (
          <svg
            viewBox="0 0 300 300"
            fill="currentColor"
            aria-hidden="true"
            className="h-[1.125rem] w-[1.125rem]"
          >
            <path
              transform="translate(0 300) scale(1 -1)"
              d="M93 38Q100 20 115.5 10.0Q131 0 150.0 0.0Q169 0 184.5 10.0Q200 20 207 38ZM280 143 258 215Q251 240 234.0 259.5Q217 279 193.0 290.0Q169 301 143.0 300.0Q117 299 93.5 287.5Q70 276 54.0 255.5Q38 235 32 209L15 140Q12 126 15.0 112.0Q18 98 27.0 86.5Q36 75 49.0 69.0Q62 63 76 63H220Q235 62 248.0 69.0Q261 76 270.0 88.0Q279 100 281.5 114.5Q284 129 280 143Z"
            />
          </svg>
        ) : (
          <i className="fi fi-rr-bell flex text-lg" aria-hidden="true" />
        )}
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] font-bold leading-none text-white ring-2 ring-white"
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
            className="fixed inset-0 z-40 cursor-default max-sm:z-[70] max-sm:bg-slate-950/50"
            onClick={() => setOpen(false)}
          />
          <section
            id={panelId}
            aria-label="Notificações"
            className="fixed inset-y-0 right-0 z-[80] flex w-[min(320px,calc(100vw-2.5rem))] flex-col overflow-hidden border-l border-border bg-white shadow-lg max-sm:animate-in max-sm:slide-in-from-right max-sm:duration-200 max-sm:pb-[env(safe-area-inset-bottom)] motion-reduce:animate-none sm:absolute sm:inset-y-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+10px)] sm:z-50 sm:w-[380px] sm:rounded-xl sm:border sm:animate-in sm:fade-in sm:slide-in-from-top-1 sm:duration-150"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-light bg-surface-secondary/70 px-4 py-3">
              <div className="min-w-0">
                <h2 className="font-slab text-base font-medium text-foreground sm:font-sans sm:text-sm sm:font-semibold sm:text-slate-900">
                  Notificações
                </h2>
                <p className="text-xs text-text-secondary sm:text-[0.6875rem]">
                  {unreadCountLabel(unread)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar notificações"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition hover:bg-border-light hover:text-foreground sm:hidden"
              >
                <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border-light px-4 py-1 sm:py-1.5">
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                className="min-h-10 cursor-pointer text-xs font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline sm:min-h-8"
              >
                Marcar todas como lidas
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                disabled={items.length === 0}
                className="min-h-10 cursor-pointer text-xs font-semibold text-text-secondary transition hover:text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline sm:min-h-8"
              >
                Limpar notificações
              </button>
            </div>
            {clearError && (
              <p
                role="alert"
                className="border-b border-border-light bg-primary-light/50 px-4 py-2 text-[0.6875rem] font-medium text-primary"
              >
                Não foi possível limpar as notificações. Tente novamente.
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:max-h-[420px] sm:flex-none">
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
                        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left sm:py-3 transition hover:bg-surface-secondary ${notification.read ? '' : 'bg-primary-light/40'}`}
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
                            <span className="text-[0.8125rem] font-semibold text-slate-900 sm:text-xs">
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="rounded-full bg-primary px-1.5 py-px text-[0.5625rem] font-semibold text-white">
                                Nova
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block break-words text-[0.8125rem] leading-relaxed text-slate-700 sm:text-xs">
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
