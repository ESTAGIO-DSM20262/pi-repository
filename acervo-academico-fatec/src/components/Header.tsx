'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

const linkClass =
  'group relative py-1 text-sm text-gray-600 transition-colors duration-300 hover:text-primary focus-visible:text-primary ' +
  'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary ' +
  'after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

export default function Header() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  function handleSignOut() {
    signOut()
    router.push('/')
  }

  const authItem = user ? (
    <button type="button" onClick={handleSignOut} className={`${linkClass} cursor-pointer`}>
      Sair
    </button>
  ) : (
    <Link href="/login" className={linkClass}>
      Entrar
    </Link>
  )

  return (
    <header className="border-b border-gray-200 bg-white">
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
          <Link href="/" className={linkClass}>Início</Link>
          <Link href="/como-funciona" className={linkClass}>Como Funciona</Link>
          {user && <Link href="/painel" className={linkClass}>Painel</Link>}
          {authItem}
        </nav>
      </div>

      <nav className="flex h-10 items-center justify-center gap-6 border-t border-gray-100 sm:hidden">
        <Link href="/" className={linkClass}>Início</Link>
        <Link href="/como-funciona" className={linkClass}>Como Funciona</Link>
        {authItem}
      </nav>
    </header>
  )
}