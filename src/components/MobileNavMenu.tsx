'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
import { useRestoreFocus } from '@/libs/useRestoreFocus'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

interface MobileNavMenuProps {
  pathname: string
  user: { name: string; email: string; role: Role; panelHref: string } | null
  loading: boolean
  onSignOut: () => void
}

function isCurrent(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function MobileNavMenu({ pathname, user, loading, onSignOut }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useRestoreFocus(open)

  const lastPathname = useRef(pathname)

  useEffect(() => {
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled)',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const breakpoint = window.matchMedia('(min-width: 640px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    breakpoint.addEventListener('change', closeOnDesktop)
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      breakpoint.removeEventListener('change', closeOnDesktop)
      window.cancelAnimationFrame(frame)
    }
  }, [open])

  const links = [
    { href: '/', label: 'Início', icon: 'fi-rr-home' },
    { href: '/como-funciona', label: 'Como Funciona', icon: 'fi-rr-info' },
    ...(user ? [{ href: user.panelHref, label: 'Painel', icon: 'fi-rr-apps' }] : []),
  ]

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-[70] cursor-default bg-slate-950/50"
              onClick={() => setOpen(false)}
            />
            <div
              id={menuId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              className="fixed inset-y-0 right-0 z-[80] flex w-[min(320px,calc(100vw-2.5rem))] flex-col overflow-y-auto border-l border-border bg-white shadow-lg animate-in slide-in-from-right duration-200 motion-reduce:animate-none sm:hidden"
            >
              <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary/70 px-4 py-3">
                <span className="font-slab text-base font-medium text-foreground">Menu</span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition hover:bg-border-light hover:text-foreground"
                >
                  <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Menu principal" className="grid gap-1.5 p-3">
                {links.map((link) => {
                  const current = isCurrent(link.href, pathname)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={current ? 'page' : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition ${current ? 'border-primary/30 bg-primary-light text-primary' : 'border-transparent text-slate-800 hover:border-primary/30 hover:bg-primary-light hover:text-primary'}`}
                    >
                      <i className={`fi ${link.icon} flex text-lg text-primary`} aria-hidden="true" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto border-t border-border-light p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {user ? (
                  <>
                    <div className="flex items-start gap-3 rounded-xl bg-surface-secondary/70 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {getNameInitials(user.name) || 'U'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="break-all text-xs text-text-secondary">{user.email}</p>
                        <p className="mt-0.5 text-[0.6875rem] font-semibold text-primary">
                          {ROLE_LABEL[user.role]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2">
                      <Link
                        href="/perfil"
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:bg-primary-light hover:text-primary"
                      >
                        <i className="fi fi-rr-id-badge flex text-lg text-primary" aria-hidden="true" />
                        Acessar perfil
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false)
                          onSignOut()
                        }}
                        className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border border-primary/20 px-4 text-left text-sm font-semibold text-primary transition hover:bg-primary-light"
                      >
                        <i className="fi fi-rr-exit flex text-lg" aria-hidden="true" />
                        Sair da conta
                      </button>
                    </div>
                  </>
                ) : (
                  !loading && (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
                    >
                      <i className="fi fi-rr-sign-in-alt flex text-lg" aria-hidden="true" />
                      Entrar
                    </Link>
                  )
                )}
              </div>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="dialog"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-primary transition hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <i className="fi fi-rr-menu-burger flex text-lg" aria-hidden="true" />
      </button>
      {panel}
    </div>
  )
}
