'use client'

import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { ROLE_LABEL } from '@/libs/mock-users'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {user ? (
        <>
          <h2 className="text-2xl font-semibold">Olá, {user.name}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Você está logado como {ROLE_LABEL[user.role]}.
          </p>
          <Link
            href="/painel"
            className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Ir para o painel
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold">Projetos Integradores da Fatec Itaquera</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Conheça os projetos desenvolvidos pelos alunos de DSM. Para cadastrar ou acompanhar projetos, entre com sua conta.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Entrar
          </Link>
        </>
      )}
    </section>
  )
}