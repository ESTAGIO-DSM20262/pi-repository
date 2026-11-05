'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { AwardCandidate } from '@/application/projects/semester-awards'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import { VERIFICATION_CRITERIA } from '@/domain/enterprise/entities/project-verification'

export function SemesterAwardsSection({ projectId }: { projectId?: string }) {
  const [candidates, setCandidates] = useState<AwardCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('all')
  const [cycle, setCycle] = useState('all')
  const [pending, setPending] = useState(false)
  const [choice, setChoice] = useState<AwardCandidate | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError('')
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
          setError(caught instanceof Error ? caught.message : 'Falha ao carregar os projetos.')
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

  async function save() {
    if (!choice || pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/semester-awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          projectId: choice.project.id,
          expectedWinnerId: choice.winnerId,
          remove: choice.selected,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível salvar a escolha.')
      setNotice(
        choice.selected
          ? 'Escolha retirada com sucesso.'
          : 'Melhor PI do semestre definido com sucesso.',
      )
      setChoice(null)
      await load()
    } catch (caught) {
      setChoice(null)
      setError(
        caught instanceof Error
          ? caught.message
          : 'Falha ao salvar. Atualize a lista e tente novamente.',
      )
    } finally {
      setPending(false)
    }
  }

  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim()
  const visible = candidates
    .filter(
      (item) =>
        (semester === 'all' || String(item.project.semester) === semester) &&
        (cycle === 'all' || item.project.cycle === cycle) &&
        normalize(item.project.title).includes(normalize(query)),
    )
    .sort(
      (a, b) =>
        Number(b.selected) - Number(a.selected) ||
        b.score - a.score ||
        a.project.title.localeCompare(b.project.title, 'pt-BR'),
    )
  const cycles = [...new Set(candidates.map((item) => item.project.cycle))].sort().reverse()
  const buttonClass =
    'inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50'

  return (
    <section
      aria-label="Melhor PI do semestre"
      className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <i className="fi fi-rr-trophy text-primary" aria-hidden="true" /> Melhor PI do semestre
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Um vencedor por ciclo e semestre do curso. Cada critério distinto indicado vale um ponto,
        independentemente do número de indicações. A maior pontuação é uma recomendação; o
        orientador principal ou administrador decide, inclusive por outro projeto.
      </p>
      <p className="mt-1 text-xs text-text-secondary">
        Empates recebem a mesma recomendação. Sem critérios indicados, não há recomendação
        automática. Apenas projetos concluídos e ativos podem vencer.
      </p>
      {!projectId && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-text-secondary">
            Nome do projeto
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar projeto..."
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-slate-900"
            />
          </label>
          <div>
            <p className="mb-1 text-xs text-text-secondary">Semestre do curso</p>
            <SelectDropdown
              ariaLabel="Filtrar melhores PIs por semestre"
              value={semester}
              onChange={setSemester}
              size="compact"
              tone="muted"
              width="full"
              options={[
                { value: 'all', label: 'Todos os semestres' },
                ...[1, 2, 3, 4, 5, 6].map((value) => ({
                  value: String(value),
                  label: `${value}º semestre`,
                })),
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-text-secondary">Ciclo</p>
            <SelectDropdown
              ariaLabel="Filtrar melhores PIs por ciclo"
              value={cycle}
              onChange={setCycle}
              size="compact"
              tone="muted"
              width="full"
              options={[
                { value: 'all', label: 'Todos os ciclos' },
                ...cycles.map((value) => ({ value, label: value })),
              ]}
            />
          </div>
        </div>
      )}
      <div className="my-3 flex flex-wrap items-center gap-3">
        {!projectId && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSemester('all')
              setCycle('all')
            }}
            className="min-h-10 text-xs font-semibold text-primary"
          >
            Limpar filtros
          </button>
        )}
        <button
          type="button"
          disabled={loading || pending}
          onClick={() => void load()}
          className="min-h-10 text-xs font-semibold text-primary disabled:opacity-50"
        >
          Atualizar lista
        </button>
        <p role="status" className="text-xs text-text-secondary">
          {loading ? 'Carregando projetos...' : `${visible.length} projeto(s) encontrado(s).`}
        </p>
      </div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-3 text-sm text-secondary">
          {notice}
        </p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="py-4 text-sm text-text-secondary">
          Nenhum projeto cadastrado encontrado. Projetos demonstrativos não participam da escolha.
        </p>
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        {visible.map((item) => (
          <article key={item.project.id} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-secondary">
              {item.project.cycle} · {item.project.semester}º semestre ·{' '}
              {item.project.active === false
                ? 'Desativado'
                : item.project.status === 'publicado'
                  ? 'Concluído'
                  : 'Em andamento'}
            </p>
            <h3 className="mt-1 font-bold text-slate-900">
              <Link href={`/projetos/${item.project.id}`} className="hover:underline">
                {item.project.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              Orientador principal: {item.project.advisor.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-lg bg-surface-secondary px-2 py-1 text-slate-900">
                {item.score} de {VERIFICATION_CRITERIA.length} pontos
              </span>
              {item.recommended && (
                <span className="rounded-lg bg-primary-light px-2 py-1 text-primary">
                  Recomendado pelo sistema (maior pontuação)
                </span>
              )}
              {item.selected && (
                <span className="rounded-lg bg-primary px-2 py-1 text-white">
                  Melhor PI escolhido
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              {item.criteria.length
                ? VERIFICATION_CRITERIA.filter((criterion) => item.criteria.includes(criterion.id))
                    .map((criterion) => criterion.label)
                    .join(' · ')
                : 'Nenhum critério indicado.'}
            </p>
            {item.winnerTitle && !item.selected && (
              <p className="mt-2 text-xs text-text-secondary">
                Escolha atual deste ciclo e semestre: {item.winnerTitle}.
              </p>
            )}
            {item.canChoose ? (
              <button
                type="button"
                disabled={pending || loading || Boolean(error)}
                onClick={() => setChoice(item)}
                className={`mt-4 ${buttonClass}`}
                aria-label={`${item.selected ? 'Retirar escolha de' : 'Definir como melhor PI:'} ${item.project.title}`}
              >
                {item.selected ? 'Retirar escolha' : 'Definir como melhor PI'}
              </button>
            ) : (
              <p className="mt-3 text-xs text-text-secondary">
                A escolha exige projeto concluído e ativo e acesso do orientador principal ou
                administrador.
              </p>
            )}
          </article>
        ))}
      </div>
      <ConfirmationDialog
        open={choice !== null}
        title={
          choice?.selected ? 'Retirar escolha do melhor PI?' : 'Definir melhor PI do semestre?'
        }
        description={
          choice
            ? `${choice.project.title} — ${choice.project.cycle}, ${choice.project.semester}º semestre. ${choice.selected ? 'Este período ficará sem vencedor até uma nova escolha.' : `${choice.winnerTitle ? `Substituirá a escolha atual: ${choice.winnerTitle}. ` : ''}${choice.recommended ? 'Este projeto tem a maior pontuação do período.' : 'Você está escolhendo este projeto por decisão manual, independentemente da recomendação.'}`}`
            : ''
        }
        confirmLabel={choice?.selected ? 'Retirar escolha' : 'Confirmar escolha'}
        tone="primary"
        pending={pending}
        onConfirm={save}
        onCancel={() => setChoice(null)}
      />
    </section>
  )
}
