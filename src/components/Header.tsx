'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
import { useAuth } from '@/presentation/auth/auth-context'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

const linkClass =
  'group relative py-1 text-sm text-gray-600 transition-colors duration-300 hover:text-primary focus-visible:text-primary ' +
  'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary ' +
  'after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

const PROFILE_ROUTE: Record<Role, string> = {
  student: '/aluno',
  professor: '/professor',
  admin: '/admin',
}

function AccountMenu({
  name,
  email,
  role,
  onSignOut,
}: {
  name: string
  email: string
  role: Role
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const initials = getNameInitials(name) || 'U'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menu da conta"
        className=" cursor-pointer inline-flex items-center gap-1.5 rounded-full p-1 text-primary transition hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </span>
        <i
          className={`fi fi-rr-angle-small-down flex text-xs transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar menu da conta"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-white shadow-[0_18px_45px_rgba(31,31,31,0.16)] animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="flex items-center gap-3 border-b border-border-light bg-surface-secondary/70 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                <p className="truncate text-xs text-text-secondary">{email}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-primary">{ROLE_LABEL[role]}</p>
              </div>
            </div>
            <Link
              href={PROFILE_ROUTE[role]}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 transition hover:bg-surface-secondary hover:text-primary"
            >
              <i className="fi fi-rr-id-badge flex text-base text-primary" aria-hidden="true" />
              Acessar Perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="flex cursor-pointer w-full items-center gap-2.5 border-t border-border-light px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary-light/60"
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

export default function Header() {
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

  const authItem = user ? (
    <AccountMenu
      name={user.name}
      email={user.emailAddress}
      role={user.role}
      onSignOut={handleSignOut}
    />
  ) : loading ? null : (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  )

  return (
    <header className="relative z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-white">
            F
          </div>
          <div className="leading-none">
            <p className="text-sm font-semibold text-gray-900">Acervo Acadêmico</p>
            <p className="mt-1 text-[11px] text-gray-500">
              <span className="hidden sm:inline">Fatec Itaquera • Prof. Miguel Reale</span>
              <span className="sm:hidden">Fatec Itaquera • CPS</span>
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className={linkClass}>
            Início
          </Link>
          <Link href="/como-funciona" className={linkClass}>
            Como Funciona
          </Link>
          {user && (
            <Link href={PROFILE_ROUTE[user.role]} className={linkClass}>
              Painel
            </Link>
          )}
          {authItem}
        </nav>
      </div>

      <nav className="flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-gray-100 px-3 py-2 sm:hidden">
        <Link href="/" className={linkClass}>
          Início
        </Link>
        <Link href="/como-funciona" className={linkClass}>
          Como Funciona
        </Link>
        {user && (
          <Link href={PROFILE_ROUTE[user.role]} className={linkClass}>
            Painel
          </Link>
        )}
        {authItem}
      </nav>
    </header>
  )
}
