'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { MOCK_USERS, ROLE_LABEL } from '@/libs/mock-users'
import Modal, { type Notice } from '@/components/ui/Modal'
import PasswordInput from '@/components/ui/PasswordInput'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { buttonClass, inputClass, labelClass, linkClass, primaryButtonClass } from '../../libs/styles'

const SHOW_DEMO = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false'

export default function LoginForm() {
    const router = useRouter()
    const { signIn } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [notice, setNotice] = useState<Notice | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useResetOnLeave(() => {
        setEmail('')
        setPassword('')
        setNotice(null)
        setSubmitting(false)
    })

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!email.trim() || !password) {
            setNotice({
                variant: 'warning',
                title: 'Preencha os campos obrigatórios',
                description: 'Informe seu e-mail e sua senha para entrar.',
            })
            return
        }

        setSubmitting(true)

        try {
            await signIn({ email, password })

            setEmail('')
            setPassword('')

            router.push('/')
        } catch (err) {
            setNotice({
                variant: 'error',
                title: 'Não foi possível entrar',
                description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
                <div>
                    <label htmlFor="email" className={labelClass}>E-mail</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        autoCapitalize="none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu e-mail institucional"
                        className={inputClass}
                    />
                </div>

                <div>
                    <PasswordInput
                        id="password"
                        label="Senha"
                        value={password}
                        onChange={setPassword}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                    />
                    <div className="mt-1.5 text-right">
                        <Link href="/esqueci-senha" className={`text-xs sm:text-[13px] ${linkClass}`}>
                            Esqueci minha senha
                        </Link>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <button type="submit" disabled={submitting} className={primaryButtonClass}>
                        {submitting ? 'Entrando…' : 'Entrar'}
                    </button>

                    <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[11px] text-text-muted sm:text-xs">ou</span>
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setNotice({
                                variant: 'warning',
                                title: 'Em breve',
                                description: 'O login com Microsoft estará disponível em breve.',
                            })
                        }
                        className={`${buttonClass} border border-[#8C8C8C] bg-white px-3 text-[#5E5E5E] hover:bg-[#f3f3f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0067b8]`}
                        style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
                    >
                        {/* Logo oficial da Microsoft */}
                        <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
                            <rect x="0" y="0" width="11" height="11" fill="#F25022" />
                            <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
                            <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
                            <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
                        </svg>
                        Entrar com Microsoft
                    </button>
                </div>
            </form>

            {SHOW_DEMO && (
                <div className="mt-5 rounded-lg bg-surface-secondary p-3 sm:mt-6 sm:p-3.5">
                    <p className="text-[11px] text-text-muted sm:text-xs">Contas de demonstração · senha 123456</p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {MOCK_USERS.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                    setEmail(u.email)
                                    setPassword(u.password)
                                }}
                                className="cursor-pointer rounded-md border border-border bg-white py-1.5 text-[11px] font-medium sm:py-2 sm:text-xs text-foreground transition hover:border-primary hover:text-primary"
                            >
                                {ROLE_LABEL[u.role]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Modal
                open={notice !== null}
                variant={notice?.variant ?? 'warning'}
                title={notice?.title ?? ''}
                description={notice?.description ?? ''}
                buttonLabel="Entendi"
                onClose={() => setNotice(null)}
            />
        </>
    )
}