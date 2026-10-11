'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthCard, { AuthCardHeader } from '@/components/ui/AuthCard'
import Modal, { type ModalVariant } from '@/components/ui/Modal'
import PasswordInput from '@/components/ui/PasswordInput'
import { infoBoxClass, mutedLinkClass, primaryButtonClass } from '@/libs/styles'
import { useResetOnLeave } from '@/libs/useResetOnLeave'

const REQUIREMENTS = [
  { label: 'Mínimo de 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Letra maiúscula e minúscula', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'Pelo menos um número ou caractere especial', test: (p: string) => /[\d\W_]/.test(p) },
]

type ModalKey = 'required' | 'invalid' | 'mismatch' | 'deferred'

const MODALS: Record<
  ModalKey,
  { variant: ModalVariant; title: string; description: string; button: string }
> = {
  required: {
    variant: 'warning',
    title: 'Preencha os campos obrigatórios',
    description: 'Informe a nova senha e confirme a senha para continuar.',
    button: 'Entendi',
  },
  invalid: {
    variant: 'warning',
    title: 'Senha inválida',
    description:
      'A nova senha não atende aos requisitos mínimos. Verifique as orientações e tente novamente.',
    button: 'Entendi',
  },
  mismatch: {
    variant: 'error',
    title: 'As senhas não coincidem',
    description:
      'A confirmação da senha é diferente da nova senha. Verifique os campos e tente novamente.',
    button: 'Entendi',
  },
  deferred: {
    variant: 'warning',
    title: 'Redefinição de senha em breve',
    description:
      'A redefinição de senha ainda não está disponível. Entre em contato com a coordenação para recuperar seu acesso.',
    button: 'Entendi',
  },
}

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [modal, setModal] = useState<ModalKey | null>(null)

  useResetOnLeave(() => {
    setPassword('')
    setConfirm('')
    setModal(null)
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!password || !confirm) return setModal('required')
    if (!REQUIREMENTS.every((r) => r.test(password))) return setModal('invalid')
    if (password !== confirm) return setModal('mismatch')

    setModal('deferred')
  }

  const current = modal ? MODALS[modal] : null

  return (
    <AuthCard>
      <AuthCardHeader
        title="Redefinir senha"
        description="Crie uma nova senha para acessar sua conta."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <PasswordInput
          id="new-password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          placeholder="Digite sua nova senha"
          autoComplete="new-password"
        />
        <PasswordInput
          id="confirm-password"
          label="Confirmar nova senha"
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirme sua nova senha"
          autoComplete="new-password"
        />

        <div className={`p-3 sm:p-4 ${infoBoxClass}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary sm:text-xs">
            Requisitos de segurança:
          </p>
          <ul className="mt-2 space-y-1.5">
            {REQUIREMENTS.map((r) => {
              const met = r.test(password)
              return (
                <li
                  key={r.label}
                  className={`flex items-center gap-2 text-xs sm:text-[13px] ${met ? 'text-emerald-700' : 'text-text-secondary'}`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 items-center justify-center rounded-full border transition ${
                      met
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-400 bg-white'
                    }`}
                  >
                    {met && (
                      <i
                        className="fi fi-br-check flex text-[7px] leading-none sm:text-[8px]"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  {r.label}
                </li>
              )
            })}
          </ul>
        </div>

        <button type="submit" className={primaryButtonClass}>
          Redefinir senha
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/login" className={mutedLinkClass}>
          <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
          Voltar para o login
        </Link>
      </div>

      <Modal
        open={modal !== null}
        variant={current?.variant ?? 'error'}
        title={current?.title ?? ''}
        description={current?.description ?? ''}
        buttonLabel={current?.button ?? ''}
        onClose={() => setModal(null)}
      />
    </AuthCard>
  )
}
