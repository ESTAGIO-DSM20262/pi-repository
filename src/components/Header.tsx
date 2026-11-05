'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
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
              href="/perfil"
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

export function Header() {
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
    <header className="relative z-30 border-b border-border bg-white">
      <div className="flex h-1" aria-hidden="true">
        <span className="flex-1 bg-primary" />
        <span className="w-1/4 bg-secondary sm:w-1/5" />
        <span className="w-1/6 bg-accent sm:w-1/5" />
      </div>
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-4" aria-label="Acervo Acadêmico — início">
          <Image
            src="/brand/fatec-itaquera-cor.png"
            alt="Fatec Itaquera — Prof. Miguel Reale"
            width={841}
            height={450}
            className="h-12 w-auto"
          />
          <span className="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
          <span className="hidden leading-none md:block">
            <span className="block font-slab text-base font-medium text-foreground">
              Acervo Acadêmico
            </span>
            <span className="mt-1 block text-[11px] text-foreground">Projetos Integradores</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
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
          <span className="hidden h-10 w-px bg-border sm:block" aria-hidden="true" />
          <Image
            src="/brand/cps-cor.png"
            alt="Centro Paula Souza"
            width={254}
            height={167}
            className="h-12 w-auto"
          />
        </div>
      </div>

      <nav className="flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border-light px-3 py-2 sm:hidden">
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
