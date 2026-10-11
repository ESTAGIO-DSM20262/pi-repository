'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { ROLE_LABEL } from '@/libs/mock-users'

export default function PainelPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) return null

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-semibold">Olá, {user.name}</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Você entrou como <strong>{ROLE_LABEL[user.role]}</strong> ({user.email}).
      </p>
    </section>
  )
}