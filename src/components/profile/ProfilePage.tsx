'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
import { ROLE_LABEL } from '@/presentation/auth/role-label'
import { validateSocialProfileUrl } from '@/presentation/profile/social-profile-url'

export interface ProfileRecord {
  id: string
  name: string
  email: string
  role: Role
  registrationNumber: string | null
  course: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  active: boolean
}

const inputClass =
  'mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/10'
const labelClass = 'block text-xs font-semibold text-slate-700'

function GitHubBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.31-3.76-1.31-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.62 5.23-5.11 5.51.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  )
}

function LinkedInBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.37 4.28 5.46v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V8.99h3.56v11.46ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.44c.98 0 1.79-.77 1.79-1.73V1.73C24 .77 23.19 0 22.21 0Z" />
    </svg>
  )
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  return payload.error ?? 'Não foi possível salvar as alterações.'
}

export default function ProfilePage({ initialProfile }: { initialProfile: ProfileRecord }) {
  const [profile, setProfile] = useState(initialProfile)
  const [name, setName] = useState(initialProfile.name)
  const [email, setEmail] = useState(initialProfile.email)
  const [githubUrl, setGithubUrl] = useState(initialProfile.githubUrl ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedinUrl ?? '')
  const [socialTouched, setSocialTouched] = useState({ github: false, linkedin: false })
  const githubValidation = validateSocialProfileUrl(githubUrl, 'github')
  const linkedinValidation = validateSocialProfileUrl(linkedinUrl, 'linkedin')
  const githubError = socialTouched.github && !githubValidation.valid ? githubValidation.error : ''
  const linkedinError =
    socialTouched.linkedin && !linkedinValidation.valid ? linkedinValidation.error : ''
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const isAdmin = profile.role === 'admin'
  const roleColor =
    profile.role === 'admin'
      ? 'bg-slate-800 text-white'
      : profile.role === 'professor'
        ? 'bg-rose-100 text-rose-900'
        : 'bg-slate-100 text-slate-700'

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSocialTouched({ github: true, linkedin: true })

    const githubCheck = validateSocialProfileUrl(githubUrl, 'github')
    const linkedinCheck = validateSocialProfileUrl(linkedinUrl, 'linkedin')
    if (!githubCheck.valid || !linkedinCheck.valid) {
      setError(
        'Corrija os links inválidos antes de salvar. Informe apenas URLs HTTPS de perfis oficiais.',
      )
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isAdmin ? { name, email } : {}),
          githubUrl: githubCheck.value,
          linkedinUrl: linkedinCheck.value,
        }),
      })
      if (!response.ok) throw new Error(await readError(response))
      const payload = (await response.json()) as { profile: ProfileRecord }
      setProfile(payload.profile)
      setName(payload.profile.name)
      setEmail(payload.profile.email)
      setGithubUrl(payload.profile.githubUrl ?? '')
      setLinkedinUrl(payload.profile.linkedinUrl ?? '')
      setNotice('Perfil atualizado com sucesso.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full bg-background px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Conta do usuário
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Meu perfil
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Consulte seus dados e mantenha suas informações atualizadas.
            </p>
          </div>
          <Link
            href={
              profile.role === 'admin'
                ? '/admin'
                : profile.role === 'professor'
                  ? '/professor'
                  : '/aluno'
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
          >
            <i className="fi fi-rr-apps flex" aria-hidden="true" /> Voltar ao painel
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border-light bg-surface-secondary/50 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white shadow-sm">
              {getNameInitials(profile.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {profile.name}
              </h2>
              <p className="mt-0.5 truncate text-sm text-text-secondary">{profile.email}</p>
              <span
                className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold ${roleColor}`}
              >
                {ROLE_LABEL[profile.role]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span
                className={`h-2 w-2 rounded-full ${profile.active ? 'bg-emerald-600' : 'bg-slate-400'}`}
              />
              <span className={profile.active ? 'text-emerald-800' : 'text-slate-500'}>
                {profile.active ? 'Conta ativa' : 'Conta inativa'}
              </span>
            </div>
          </div>

          <form onSubmit={saveProfile} className="p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900">Dados da conta</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                {isAdmin
                  ? 'Como administrador, você pode atualizar seu nome, e-mail e perfis profissionais.'
                  : 'Nome, e-mail e dados acadêmicos são gerenciados pela administração. Você pode atualizar apenas seus perfis profissionais.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Nome completo
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={name}
                  readOnly={!isAdmin}
                  onChange={(event) => setName(event.target.value)}
                  className={isAdmin ? inputClass : `${inputClass} bg-slate-50 text-slate-500`}
                />
              </label>
              <label className={labelClass}>
                E-mail
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  readOnly={!isAdmin}
                  onChange={(event) => setEmail(event.target.value)}
                  className={isAdmin ? inputClass : `${inputClass} bg-slate-50 text-slate-500`}
                />
              </label>
              {profile.role === 'student' && (
                <>
                  <label className={labelClass}>
                    Registro Acadêmico (RA)
                    <input
                      value={profile.registrationNumber ?? 'Não informado'}
                      readOnly
                      className={`${inputClass} bg-slate-50 text-slate-500`}
                    />
                  </label>
                  <label className={labelClass}>
                    Curso
                    <input
                      value={profile.course ?? 'Não informado'}
                      readOnly
                      className={`${inputClass} bg-slate-50 text-slate-500`}
                    />
                  </label>
                </>
              )}
              {profile.role === 'professor' && (
                <label className={labelClass}>
                  Matrícula funcional
                  <input
                    value={profile.registrationNumber ?? 'Não informada'}
                    readOnly
                    className={`${inputClass} bg-slate-50 text-slate-500`}
                  />
                </label>
              )}
              {profile.role === 'admin' && (
                <label className={labelClass}>
                  Tipo de acesso
                  <input
                    value="Administrador do sistema"
                    readOnly
                    className={`${inputClass} bg-slate-50 text-slate-500`}
                  />
                </label>
              )}
            </div>

            <div className="mt-8 border-t border-border-light pt-6">
              <h3 className="text-sm font-bold text-slate-900">Perfis profissionais</h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary">
                Adicione links HTTPS dos seus perfis oficiais do GitHub e do LinkedIn. Eles
                aparecerão ao lado do seu nome nos projetos em que você participa ou orienta; links
                fora dos domínios oficiais ou que não sejam perfis pessoais serão recusados.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <GitHubBrandIcon /> GitHub
                  </span>
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    value={githubUrl}
                    onBlur={() => setSocialTouched((current) => ({ ...current, github: true }))}
                    onChange={(event) => {
                      setGithubUrl(event.target.value)
                      setError('')
                    }}
                    placeholder="https://github.com/seu-usuario"
                    aria-invalid={Boolean(githubError)}
                    aria-describedby={githubError ? 'github-url-error' : undefined}
                    className={`${inputClass} ${githubError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : ''}`}
                  />
                  {githubError && (
                    <span
                      id="github-url-error"
                      role="alert"
                      className="mt-1.5 block text-xs font-medium text-rose-700"
                    >
                      {githubError}
                    </span>
                  )}
                </label>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <LinkedInBrandIcon /> LinkedIn
                  </span>
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    value={linkedinUrl}
                    onBlur={() => setSocialTouched((current) => ({ ...current, linkedin: true }))}
                    onChange={(event) => {
                      setLinkedinUrl(event.target.value)
                      setError('')
                    }}
                    placeholder="https://www.linkedin.com/in/seu-perfil/"
                    aria-invalid={Boolean(linkedinError)}
                    aria-describedby={linkedinError ? 'linkedin-url-error' : undefined}
                    className={`${inputClass} ${linkedinError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : ''}`}
                  />
                  {linkedinError && (
                    <span
                      id="linkedin-url-error"
                      role="alert"
                      className="mt-1.5 block text-xs font-medium text-rose-700"
                    >
                      {linkedinError}
                    </span>
                  )}
                </label>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-900"
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                role="status"
                className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-900"
              >
                {notice}
              </div>
            )}

            <div className="mt-6 flex justify-end border-t border-border-light pt-5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />
                ) : (
                  <i className="fi fi-rr-check flex" aria-hidden="true" />
                )}
                {saving
                  ? 'Salvando…'
                  : isAdmin
                    ? 'Salvar alterações'
                    : 'Salvar perfis profissionais'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
