'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  type AwardCandidate,
  isAwardEligible,
  sortAwardCandidates,
  summarizeAwardGroup,
} from '@/application/projects/semester-awards'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { Modal, type Notice } from '@/components/ui/Modal'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import { VERIFICATION_CRITERIA } from '@/domain/enterprise/entities/project-verification'
import { labelClass } from '@/libs/styles'

const SEMESTERS = [1, 2, 3, 4, 5, 6]
const TOTAL_CRITERIA = VERIFICATION_CRITERIA.length

const primaryActionClass =
  'cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60'
const secondaryActionClass =
  'cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60'

interface PendingChoice {
  item: AwardCandidate
  suggestions: AwardCandidate[] | null
}

function cycleLabel(cycle: string) {
  const match = /^(\d{4})\/([12])$/.exec(cycle)
  return match ? `${cycle} (${match[2]}º semestre de ${match[1]})` : cycle
}

function criteriaText(count: number) {
  return `${count} de ${TOTAL_CRITERIA} ${count === 1 ? 'critério atendido' : 'critérios atendidos'}`
}

function CriteriaChecklist({ met }: { met: AwardCandidate['criteria'] }) {
  return (
    <ul aria-label="Critérios do projeto" className="mt-3 flex flex-wrap gap-1.5">
      {VERIFICATION_CRITERIA.map((criterion) => {
        const done = met.includes(criterion.id)
        return (
          <li
            key={criterion.id}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.6875rem] font-semibold ${
              done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-border bg-surface-secondary text-text-muted'
            }`}
          >
            <i
              className={`fi ${done ? 'fi-rr-check' : 'fi-rr-cross-small'} flex`}
              aria-hidden="true"
            />
            {criterion.label}
            <span className="sr-only">{done ? ': atendido' : ': não atendido'}</span>
          </li>
        )
      })}
    </ul>
  )
}

function HowItWorks() {
  return (
    <details className="mt-3 rounded-lg border border-border bg-white px-3.5 py-2.5">
      <summary className="cursor-pointer text-xs font-semibold text-primary">
        Como funciona a sugestão do sistema?
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-text-secondary">
        <li>
          Na página de cada projeto, os orientadores indicam quais dos {TOTAL_CRITERIA} critérios o
          projeto atende.
        </li>
        <li>O sistema conta quantos critérios diferentes cada projeto atende.</li>
        <li>
          O projeto com mais critérios atendidos aparece como sugestão. Empates são mostrados
          juntos.
        </li>
        <li>
          É apenas uma sugestão: o professor decide e pode escolher qualquer projeto concluído, até
          mesmo outro que não seja o sugerido.
        </li>
        <li>Há um único melhor PI para cada combinação de ciclo e semestre do curso.</li>
      </ul>
    </details>
  )
}

function PublicationNotice() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent-light px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-secondary-hover">
        <i className="fi fi-rr-globe flex text-base" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">Por que escolher o melhor PI?</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-700 sm:text-[0.8125rem]">
          A escolha registra qual foi o melhor PI de cada semestre. Só os melhores PIs de cada
          semestre seguem para o site da Fatec Itaquera, na aba Projetos Integradores.
        </p>
      </div>
    </div>
  )
}

function AwardCard({
  item,
  busy,
  onChoose,
}: {
  item: AwardCandidate
  busy: boolean
  onChoose: (item: AwardCandidate) => void
}) {
  const eligible = isAwardEligible(item.project)
  const inactive = item.project.active === false

  return (
    <article
      className={`flex min-w-0 flex-col rounded-xl border border-l-4 p-4 shadow-sm ${
        item.selected ? 'border-secondary bg-accent-light/40' : 'border-border border-l-border'
      } ${eligible ? (item.selected ? '' : 'bg-white') : 'bg-surface-secondary/60'}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {item.selected && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-[0.6875rem] font-bold text-white shadow-sm">
            <i className="fi fi-rr-trophy flex" aria-hidden="true" /> Melhor PI escolhido
          </span>
        )}
        {item.recommended && (
          <span className="inline-flex items-center gap-1 rounded border border-accent/40 bg-accent-light px-2 py-0.5 text-[0.6875rem] font-semibold text-secondary-hover">
            <i className="fi fi-rr-star flex" aria-hidden="true" /> Sugestão do sistema
          </span>
        )}
        {!eligible && (
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.6875rem] font-semibold ${
              inactive ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            <i
              className={`fi ${inactive ? 'fi-rr-ban' : 'fi-rr-hourglass-start'} flex`}
              aria-hidden="true"
            />
            {inactive ? 'Desativado' : 'Em andamento'}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-bold leading-snug text-slate-900 sm:text-base">
        <Link
          href={`/projetos/${item.project.id}`}
          className="transition-colors hover:text-primary hover:underline"
        >
          {item.project.title}
        </Link>
      </p>
      <p className="mt-0.5 text-xs text-text-secondary">
        Orientador principal: {item.project.advisor.name}
      </p>

      <p className="mt-3 text-sm font-semibold text-slate-900">{criteriaText(item.score)}</p>
      <div className="mt-1.5 flex gap-1" aria-hidden="true">
        {VERIFICATION_CRITERIA.map((criterion, index) => (
          <span
            key={criterion.id}
            className={`h-1.5 flex-1 rounded-full ${index < item.score ? 'bg-secondary' : 'bg-border'}`}
          />
        ))}
      </div>
      <CriteriaChecklist met={item.criteria} />

      {item.winnerTitle && !item.selected && (
        <p className="mt-3 text-xs text-text-secondary">
          Escolha atual deste ciclo e semestre: <strong>{item.winnerTitle}</strong>.
        </p>
      )}

      <div className="mt-4 flex flex-1 items-end">
        {item.canChoose ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onChoose(item)}
            aria-label={`${item.selected ? 'Retirar escolha de' : 'Escolher como melhor PI:'} ${item.project.title}`}
            className={item.selected ? secondaryActionClass : primaryActionClass}
          >
            <i
              className={`fi ${item.selected ? 'fi-rr-cross-circle' : 'fi-rr-trophy'} flex`}
              aria-hidden="true"
            />
            {item.selected ? 'Retirar escolha' : 'Escolher como melhor PI'}
          </button>
        ) : (
          <p className="flex items-start gap-1.5 text-xs text-text-secondary">
            <i className="fi fi-rr-lock mt-0.5 flex shrink-0" aria-hidden="true" />
            {eligible
              ? 'Somente o orientador principal ou um administrador pode escolher este projeto.'
              : 'Somente projetos concluídos e ativos podem ser escolhidos.'}
          </p>
        )}
      </div>
    </article>
  )
}

function ChoiceDetails({ pending }: { pending: PendingChoice }) {
  const { item, suggestions } = pending
  if (item.selected) {
    return (
      <p>
        Este ciclo e semestre ficará sem melhor PI, e o projeto deixa de ser elegível para o site da
        Fatec Itaquera, até que você escolha outro projeto.
      </p>
    )
  }
  let suggestion: string
  if (item.recommended) {
    suggestion = 'O sistema também sugere este projeto.'
  } else if (suggestions === null) {
    suggestion = 'A sugestão do sistema é só uma referência: a decisão é sua.'
  } else if (suggestions.length > 0) {
    suggestion = `O sistema sugere ${suggestions.map((candidate) => candidate.project.title).join(' ou ')} (${criteriaText(suggestions[0].score)}). Você pode seguir a sugestão ou não: a decisão é sua.`
  } else {
    suggestion =
      'Nenhum projeto deste semestre tem critérios indicados ainda. Esta é uma escolha manual.'
  }
  return (
    <ul className="space-y-1.5">
      <li>
        Este projeto tem <strong>{criteriaText(item.score)}</strong>.
      </li>
      <li>{suggestion}</li>
      <li>
        Só os melhores PIs de cada semestre seguem para o site da Fatec Itaquera, na aba Projetos
        Integradores.
      </li>
      {item.winnerTitle && (
        <li>
          A escolha atual, <strong>{item.winnerTitle}</strong>, será substituída.
        </li>
      )}
    </ul>
  )
}

export function SemesterAwardsSection({ projectId }: { projectId?: string }) {
  const headingId = useId()
  const [candidates, setCandidates] = useState<AwardCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cycleChoice, setCycleChoice] = useState<string | null>(null)
  const [semesterChoice, setSemesterChoice] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [choice, setChoice] = useState<PendingChoice | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await fetch(
          `/api/semester-awards${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
          { cache: 'no-store', signal },
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar os projetos.')
        setCandidates(data.candidates)
      } catch (caught) {
        if (!signal?.aborted)
          setLoadError(caught instanceof Error ? caught.message : 'Falha ao carregar os projetos.')
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [projectId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const cycles = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of candidates) {
      counts.set(item.project.cycle, (counts.get(item.project.cycle) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: cycleLabel(value), count }))
      .sort((a, b) => b.value.localeCompare(a.value))
  }, [candidates])

  const cycle =
    cycleChoice && cycles.some((option) => option.value === cycleChoice)
      ? cycleChoice
      : (cycles[0]?.value ?? '')

  const semesterCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const item of candidates) {
      if (item.project.cycle === cycle) {
        counts.set(item.project.semester, (counts.get(item.project.semester) ?? 0) + 1)
      }
    }
    return counts
  }, [candidates, cycle])

  const semester =
    semesterChoice ?? SEMESTERS.find((value) => semesterCounts.has(value)) ?? SEMESTERS[0]

  const group = useMemo(
    () =>
      sortAwardCandidates(
        projectId
          ? candidates
          : candidates.filter(
              (item) => item.project.cycle === cycle && item.project.semester === semester,
            ),
      ),
    [candidates, cycle, semester, projectId],
  )
  const summary = useMemo(() => summarizeAwardGroup(group), [group])

  function changeCycle(next: string) {
    setCycleChoice(next)
    const hasSameSemester = candidates.some(
      (item) => item.project.cycle === next && item.project.semester === semester,
    )
    if (!hasSameSemester) setSemesterChoice(null)
  }

  function askChoice(item: AwardCandidate) {
    setChoice({ item, suggestions: projectId ? null : summary.recommended })
  }

  async function save() {
    if (!choice || pending) return
    const { item } = choice
    setPending(true)
    try {
      const response = await fetch('/api/semester-awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          projectId: item.project.id,
          expectedWinnerId: item.winnerId,
          remove: item.selected,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível salvar a escolha.')
      setChoice(null)
      setNotice(
        item.selected
          ? {
              variant: 'success',
              title: 'Escolha retirada',
              description: `${item.project.title} deixou de ser o melhor PI de ${item.project.cycle}, ${item.project.semester}º semestre.`,
            }
          : {
              variant: 'award',
              title: 'Melhor PI definido',
              description: `${item.project.title} é o melhor PI de ${item.project.cycle}, ${item.project.semester}º semestre.`,
            },
      )
      await load()
    } catch (caught) {
      setChoice(null)
      setNotice({
        variant: 'error',
        title: 'Não foi possível salvar',
        description:
          caught instanceof Error
            ? caught.message
            : 'Falha ao salvar. A lista foi atualizada; tente novamente.',
      })
      await load()
    } finally {
      setPending(false)
    }
  }

  const busy = pending || loading
  const projectsText = `${group.length} ${group.length === 1 ? 'projeto' : 'projetos'} neste ciclo e semestre`
  const eligibleText =
    summary.eligibleCount === 1
      ? '1 concluído pode ser escolhido'
      : `${summary.eligibleCount} concluídos podem ser escolhidos`
  const sectionClass = projectId
    ? 'rounded-xl border border-white bg-white p-5 shadow-sm lg:p-6'
    : 'rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8'

  return (
    <section aria-labelledby={headingId} className={sectionClass}>
      <div className="flex items-start gap-3">
        {!projectId && (
          <span className="mt-1 h-6 w-2 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
        )}
        <div>
          <h2
            id={headingId}
            className={`flex items-center gap-2 tracking-tight text-slate-900 ${
              projectId ? 'text-lg font-bold sm:text-xl' : 'text-lg font-semibold sm:text-xl'
            }`}
          >
            <i className="fi fi-rr-trophy flex text-base text-secondary" aria-hidden="true" />
            Melhor PI do semestre
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary sm:text-[0.8125rem]">
            {projectId
              ? 'Escolha este projeto como o melhor do ciclo e semestre dele. O sistema apenas sugere; a decisão é sua.'
              : 'Escolha o melhor projeto de cada semestre do curso em cada ciclo. O sistema apenas sugere; a decisão é sua.'}
          </p>
        </div>
      </div>

      <PublicationNotice />
      <HowItWorks />

      {!projectId && candidates.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Ciclo</span>
            <SelectDropdown
              ariaLabel="Escolher o ciclo"
              value={cycle}
              options={cycles}
              onChange={changeCycle}
            />
          </div>
          <div>
            <span className={labelClass}>Semestre do curso</span>
            <SelectDropdown
              ariaLabel="Escolher o semestre do curso"
              value={String(semester)}
              options={SEMESTERS.map((value) => ({
                value: String(value),
                label: `${value}º semestre`,
                count: semesterCounts.get(value) ?? 0,
              }))}
              onChange={(value) => setSemesterChoice(Number(value))}
            />
          </div>
        </div>
      )}

      {loadError && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg bg-primary-light px-3 py-2 text-[0.8125rem] text-primary sm:text-sm"
        >
          <i className="fi fi-rr-exclamation mt-0.5 flex shrink-0" aria-hidden="true" />
          {loadError}
        </p>
      )}

      {!projectId && group.length > 0 && (
        <div className="mt-4 grid gap-4 rounded-xl border border-border bg-surface-secondary p-4 sm:grid-cols-2">
          <div>
            <span className={labelClass}>Escolha do professor</span>
            {summary.winnerTitle ? (
              <p className="flex items-start gap-2 text-sm font-bold text-slate-900">
                <i className="fi fi-rr-trophy mt-0.5 flex text-secondary" aria-hidden="true" />
                {summary.winnerTitle}
              </p>
            ) : (
              <p className="text-sm text-text-secondary">Ainda não escolhido.</p>
            )}
          </div>
          <div>
            <span className={labelClass}>Sugestão do sistema</span>
            {summary.recommended.length > 0 ? (
              <>
                <p className="flex items-start gap-2 text-sm font-bold text-slate-900">
                  <i className="fi fi-rr-star mt-0.5 flex text-secondary" aria-hidden="true" />
                  {summary.recommended.map((item) => item.project.title).join(' · ')}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {criteriaText(summary.highestScore)}
                  {summary.recommended.length > 1 ? ' (empate)' : ''}
                </p>
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                Sem sugestão: nenhum projeto concluído deste semestre tem critérios indicados.
              </p>
            )}
          </div>
        </div>
      )}

      {!projectId && group.length > 0 && (
        <p role="status" className="mt-4 mb-3 text-xs font-semibold text-slate-700">
          {projectsText}. {eligibleText}.
        </p>
      )}

      {loading && candidates.length === 0 && (
        <p role="status" className="mt-4 text-sm text-text-secondary">
          Carregando projetos...
        </p>
      )}

      {!loading && !loadError && group.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center">
          <i className="fi fi-rr-folder-open text-xl text-text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm text-text-secondary">
            {candidates.length === 0
              ? 'Nenhum projeto cadastrado para escolher. Projetos demonstrativos não participam.'
              : 'Nenhum projeto encontrado neste ciclo e semestre. Tente outra combinação.'}
          </p>
        </div>
      )}

      {group.length > 0 && (
        <div className={`grid gap-3 ${projectId ? 'mt-4' : 'xl:grid-cols-2'}`}>
          {group.map((item) => (
            <AwardCard key={item.project.id} item={item} busy={busy} onChoose={askChoice} />
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={choice !== null}
        title={
          choice?.item.selected
            ? 'Retirar a escolha do melhor PI?'
            : 'Escolher como melhor PI do semestre?'
        }
        description={
          choice
            ? `${choice.item.project.title} · ${cycleLabel(choice.item.project.cycle)} · ${choice.item.project.semester}º semestre do curso.`
            : ''
        }
        details={choice ? <ChoiceDetails pending={choice} /> : undefined}
        confirmLabel={choice?.item.selected ? 'Retirar escolha' : 'Confirmar escolha'}
        icon="fi-rr-trophy"
        tone={choice?.item.selected ? 'danger' : 'award'}
        pending={pending}
        onConfirm={save}
        onCancel={() => setChoice(null)}
      />
      <Modal
        open={notice !== null}
        variant={notice?.variant ?? 'success'}
        title={notice?.title ?? ''}
        description={notice?.description ?? ''}
        buttonLabel="Entendi"
        onClose={() => setNotice(null)}
      />
    </section>
  )
}
