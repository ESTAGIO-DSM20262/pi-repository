'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  type ProjectVerificationSummary,
  VERIFICATION_CRITERIA,
  type VerificationCriterionId,
} from '@/domain/enterprise/entities/project-verification'

interface ProjectVerificationPanelProps {
  projectId: string
  summary: ProjectVerificationSummary
  canVerify: boolean
  showProgress: boolean
  viewerEmail: string | null
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function VerificationDialog({
  projectId,
  initialCriteria,
  alreadyVerified,
  onClose,
  onSaved,
}: {
  projectId: string
  initialCriteria: VerificationCriterionId[]
  alreadyVerified: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const titleId = useId()
  const [selected, setSelected] = useState<VerificationCriterionId[]>(initialCriteria)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !savingRef.current) onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function toggle(id: VerificationCriterionId) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function submit() {
    if (selected.length === 0) {
      setError('Marque ao menos um critério para indicar o projeto.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({ criteria: selected }),
      })
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(result?.error ?? 'Não foi possível registrar a indicação.')
      }
      onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ocorreu um erro ao indicar o projeto.')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[2147483646] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Fechar modal"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-slate-950/75 backdrop-blur-[1px]"
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <i className="fi fi-rr-shield-check flex text-xl" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Sistema de indicação
            </p>
            <h2
              id={titleId}
              className="mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-xl"
            >
              {alreadyVerified ? 'Atualizar minha indicação' : 'Indicar este projeto'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Ao indicar, você declara estar ciente de que recomenda este projeto como base de
              informações para projetos de alunos futuros.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
            className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-slate-900">
              Em quais pontos este projeto é uma boa referência?
            </legend>
            <ul className="space-y-2">
              {VERIFICATION_CRITERIA.map((criterion) => {
                const checked = selected.includes(criterion.id)
                return (
                  <li key={criterion.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition ${
                        checked
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-border bg-white hover:border-emerald-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(criterion.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {criterion.label}
                        </span>
                        <span className="block text-xs leading-relaxed text-slate-600">
                          {criterion.statement}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-65"
          >
            <i
              className={`fi ${saving ? 'fi-rr-spinner animate-spin' : 'fi-rr-shield-check'} flex`}
              aria-hidden="true"
            />
            {saving ? 'Registrando…' : alreadyVerified ? 'Atualizar indicação' : 'Indicar projeto'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

function CriteriaTags({ summary }: { summary: ProjectVerificationSummary }) {
  const cardId = useId()
  const [openId, setOpenId] = useState<VerificationCriterionId | null>(null)

  useEffect(() => {
    if (!openId) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openId])

  const openCriterion = summary.criteria.find((criterion) => criterion.id === openId)
  const definition = VERIFICATION_CRITERIA.find((criterion) => criterion.id === openId)
  const endorsers = summary.advisors.filter((advisor) =>
    openId ? advisor.criteria.includes(openId) : false,
  )

  return (
    <div className="mt-1">
      <p className="text-sm leading-relaxed text-emerald-900">
        Este projeto é indicado em:{' '}
        <span className="text-xs">(toque em um item para ver os detalhes)</span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {summary.criteria.map((criterion) => {
          const selected = criterion.id === openId
          return (
            <li key={criterion.id}>
              <button
                type="button"
                aria-expanded={selected}
                aria-controls={selected ? cardId : undefined}
                onClick={() => setOpenId(selected ? null : criterion.id)}
                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-emerald-300 bg-white text-emerald-900 hover:border-emerald-500 hover:bg-emerald-100'
                }`}
              >
                {criterion.label}
                {!criterion.unanimous && (
                  <span className="font-semibold opacity-80">
                    ({criterion.endorsedBy}/{summary.requiredCount})
                  </span>
                )}
                <i
                  className={`fi ${selected ? 'fi-rr-angle-small-up' : 'fi-rr-angle-small-down'} flex text-sm`}
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>

      {openCriterion && definition && (
        <section
          id={cardId}
          aria-label={`Detalhes da indicação: ${definition.label}`}
          className="mt-3 max-w-xl rounded-xl border border-emerald-300 bg-white p-3.5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-slate-900">{definition.label}</p>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label="Fechar detalhes"
              className="cursor-pointer -mt-1 -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
            >
              <i className="fi fi-rr-cross-small flex text-lg" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">{definition.statement}</p>
          <p className="mt-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {endorsers.length > 1 ? 'Indicado pelos orientadores' : 'Indicado pelo orientador'}
          </p>
          <ul className="mt-1 space-y-0.5">
            {endorsers.map((advisor) => (
              <li key={advisor.email} className="text-xs font-semibold text-slate-900">
                {advisor.name}
              </li>
            ))}
          </ul>
          {!openCriterion.unanimous && (
            <p className="mt-2 text-[11px] text-slate-600">
              {openCriterion.endorsedBy} de {summary.requiredCount} orientadores indicaram este
              critério.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export function ProjectVerificationButton({
  projectId,
  summary,
  viewerEmail,
}: Pick<ProjectVerificationPanelProps, 'projectId' | 'summary' | 'viewerEmail'>) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const email = viewerEmail?.toLowerCase() ?? ''
  const mine =
    summary.advisors.find((advisor) => advisor.email === email) ??
    summary.administrators.find((admin) => admin.email === email)
  const alreadyVerified = mine ? ('verified' in mine ? mine.verified : true) : false

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
      >
        <i className="fi fi-rr-shield-check flex" aria-hidden="true" />
        {alreadyVerified ? 'Atualizar indicação' : 'Indicar projeto'}
      </button>
      {open && (
        <VerificationDialog
          projectId={projectId}
          initialCriteria={mine?.criteria ?? []}
          alreadyVerified={alreadyVerified}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

export function ProjectVerificationPanel({
  summary,
  showProgress,
}: Pick<ProjectVerificationPanelProps, 'summary' | 'showProgress'>) {
  const percent =
    summary.requiredCount > 0
      ? Math.round((summary.verifiedCount / summary.requiredCount) * 100)
      : 0
  if (!summary.complete && !showProgress) return null

  return (
    <section
      aria-label="Indicação do projeto"
      className={`rounded-xl border p-4 sm:p-5 ${
        summary.complete ? 'border-emerald-300 bg-emerald-50' : 'border-border bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            summary.complete ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <i
            className={`fi ${summary.complete ? 'fi-rr-badge-check' : 'fi-rr-shield-check'} flex text-lg`}
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">
            {summary.complete ? 'Projeto indicado' : 'Indicação do projeto'}
          </h2>
          {summary.complete && summary.criteria.length > 0 && <CriteriaTags summary={summary} />}
          {!summary.complete && (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              O projeto só é indicado quando todos os professores orientadores indicam.
            </p>
          )}
        </div>
      </div>

      {showProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>
              {summary.verifiedCount} de {summary.requiredCount} orientadores indicaram
            </span>
            <span>{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Progresso da indicação"
            aria-valuemin={0}
            aria-valuemax={summary.requiredCount}
            aria-valuenow={summary.verifiedCount}
            className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {summary.advisors.map((advisor) => (
              <li
                key={advisor.email}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2"
              >
                <i
                  className={`fi ${advisor.verified ? 'fi-rr-check-circle text-emerald-600' : 'fi-rr-clock text-amber-600'} flex text-base`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{advisor.name}</p>
                  <p className="text-[11px] text-text-secondary">
                    {advisor.verified && advisor.verifiedAt
                      ? `Indicou em ${formatDate(advisor.verifiedAt)}`
                      : 'Aguardando indicação'}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {summary.administrators.length > 0 && (
            <p className="mt-3 text-[11px] text-text-secondary">
              Também indicado pela administração:{' '}
              {summary.administrators.map((admin) => admin.name).join(', ')}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
