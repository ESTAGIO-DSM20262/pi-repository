'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
import { useRestoreFocus } from '@/libs/useRestoreFocus'
import { useAuth } from '@/presentation/auth/auth-context'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

const linkClass =
  'group relative py-1 text-sm text-text-secondary transition-colors duration-300 hover:text-primary focus-visible:text-primary ' +
  'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary ' +
  'after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

const PROFILE_ROUTE: Record<Role, string> = {
  student: '/aluno',
  professor: '/professor',
  admin: '/admin',
}

type AccountMenuVariant = 'desktop' | 'mobile'

function AccountMenu({
  name,
  email,
  role,
  onSignOut,
  variant,
}: {
  name: string
  email: string
  role: Role
  onSignOut: () => void
  variant: AccountMenuVariant
}) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstActionRef = useRef<HTMLAnchorElement>(null)
  const menuId = useId()
  const initials = getNameInitials(name) || 'U'
  const isMobile = variant === 'mobile'

  useRestoreFocus(open)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    if (isMobile) document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }

      if (!isMobile || event.key !== 'Tab') return
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

    document.addEventListener('keydown', onKeyDown)
    const breakpoint = window.matchMedia('(min-width: 640px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (isMobile && event.matches) setOpen(false)
    }
    breakpoint.addEventListener('change', closeOnDesktop)
    const frame = window.requestAnimationFrame(() => {
      if (isMobile) firstActionRef.current?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      breakpoint.removeEventListener('change', closeOnDesktop)
      window.cancelAnimationFrame(frame)
    }
  }, [open, isMobile])

  const mobileDialog =
    open && isMobile && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-[70] cursor-default bg-slate-950/50 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
            />
            <div
              id={menuId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu da conta"
              className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[80] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_45px_rgba(31,31,31,0.24)] sm:hidden"
            >
              <div className="flex items-start gap-3 border-b border-border-light bg-surface-secondary/70 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-slate-900">{name}</p>
                  <p className="break-all text-xs text-text-secondary">{email}</p>
                  <p className="mt-0.5 text-[0.6875rem] font-semibold text-primary">
                    {ROLE_LABEL[role]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu da conta"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition hover:bg-border-light hover:text-foreground"
                >
                  <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
                </button>
              </div>
              <div className="grid gap-2 p-3">
                <Link
                  ref={firstActionRef}
                  href="/perfil"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:bg-primary-light hover:text-primary"
                >
                  <i className="fi fi-rr-id-badge flex text-lg text-primary" aria-hidden="true" />
                  Acessar perfil
                  <i
                    className="fi fi-rr-angle-small-right ml-auto flex text-lg"
                    aria-hidden="true"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onSignOut()
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-primary/20 px-4 text-left text-sm font-semibold text-primary transition hover:bg-primary-light"
                >
                  <i className="fi fi-rr-exit flex text-lg" aria-hidden="true" />
                  Sair da conta
                </button>
              </div>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup={isMobile ? 'dialog' : undefined}
        aria-label="Menu da conta"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full p-1 text-primary transition hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white sm:flex">
          {initials}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white sm:hidden">
          <i className="fi fi-rr-user flex text-base" aria-hidden="true" />
        </span>
        <i
          className={`fi fi-rr-angle-small-down flex text-xs transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {mobileDialog}

      {open && !isMobile && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 hidden cursor-default sm:block"
            onClick={() => setOpen(false)}
          />
          <div
            id={menuId}
            ref={panelRef}
            className="absolute right-0 top-[calc(100%+10px)] z-50 hidden w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-white shadow-[0_18px_45px_rgba(31,31,31,0.16)] animate-in fade-in slide-in-from-top-1 duration-150 sm:block"
          >
            <div className="flex items-center gap-3 border-b border-border-light bg-surface-secondary/70 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                <p className="truncate text-xs text-text-secondary">{email}</p>
                <p className="mt-0.5 text-[0.6875rem] font-semibold text-primary">
                  {ROLE_LABEL[role]}
                </p>
              </div>
            </div>
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 transition hover:bg-surface-secondary hover:text-primary"
            >
              <i className="fi fi-rr-id-badge flex text-base text-primary" aria-hidden="true" />
              Acessar Perfil
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 border-t border-border-light px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary-light/60"
            >
              <i className="fi fi-rr-exit flex text-base" aria-hidden="true" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string
  pathname: string
  children: React.ReactNode
}) {
  const current = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link href={href} className={linkClass} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, loading, showAuthAction, clearAuthAction } = useAuth()

  async function handleSignOut() {
    showAuthAction('Estamos encerrando sua sessão com segurança…')
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Não foi possível encerrar a sessão.', error)
    } finally {
      clearAuthAction()
    }
  }

  const desktopAuthItem = user ? (
    <AccountMenu
      name={user.name}
      email={user.emailAddress}
      role={user.role}
      onSignOut={handleSignOut}
      variant="desktop"
    />
  ) : loading ? null : (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  )

  const mobileAuthItem = user ? (
    <AccountMenu
      name={user.name}
      email={user.emailAddress}
      role={user.role}
      onSignOut={handleSignOut}
      variant="mobile"
    />
  ) : loading ? null : (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  )

  return (
    <header className="relative z-30 border-b border-border bg-white">
      <div className="flex h-1" aria-hidden="true">
        <span className="flex-1 bg-primary" />
        <span className="w-1/4 bg-secondary sm:w-1/5" />
        <span className="w-1/6 bg-accent sm:w-1/5" />
      </div>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-3 sm:h-[72px] sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 sm:gap-4"
          aria-label="Acervo Acadêmico — início"
        >
          <Image
            src="/brand/fatec-itaquera-cor.png"
            alt="Fatec Itaquera — Prof. Miguel Reale"
            width={841}
            height={450}
            className="h-9 w-auto shrink-0 sm:h-12"
          />
          <span className="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
          <span className="hidden min-w-0 leading-none md:block">
            <span className="block font-slab text-base font-medium text-foreground">
              Acervo Acadêmico
            </span>
            <span className="mt-1 block text-[0.6875rem] text-foreground">
              Projetos Integradores
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <nav aria-label="Menu principal" className="hidden items-center gap-6 sm:flex">
            <NavLink href="/" pathname={pathname}>
              Início
            </NavLink>
            <NavLink href="/como-funciona" pathname={pathname}>
              Como Funciona
            </NavLink>
            {user && (
              <NavLink href={PROFILE_ROUTE[user.role]} pathname={pathname}>
                Painel
              </NavLink>
            )}
            {desktopAuthItem}
          </nav>
          <span className="hidden h-10 w-px bg-border sm:block" aria-hidden="true" />
          <Image
            src="/brand/cps-cor.png"
            alt="Centro Paula Souza"
            width={254}
            height={167}
            className="h-9 w-auto sm:h-12"
          />
        </div>
      </div>

      <nav
        aria-label="Menu principal"
        className="flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-border-light px-3 py-2 sm:hidden"
      >
        <NavLink href="/" pathname={pathname}>
          Início
        </NavLink>
        <NavLink href="/como-funciona" pathname={pathname}>
          Como Funciona
        </NavLink>
        {user && (
          <NavLink href={PROFILE_ROUTE[user.role]} pathname={pathname}>
            Painel
          </NavLink>
        )}
        {mobileAuthItem}
      </nav>
    </header>
  )
}
