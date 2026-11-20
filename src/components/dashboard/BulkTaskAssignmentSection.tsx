'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  type BulkTaskFilters,
  type BulkTaskRelation,
  type BulkTaskSituation,
  bulkTaskCandidates,
  DEFAULT_BULK_TASK_FILTERS,
  explainBulkTaskIneligibility,
  filterBulkTaskProjects,
  listBulkTaskAdvisors,
  listBulkTaskCycles,
  selectableProjectIds,
} from '@/application/projects/bulk-task-selection'
import type { ListedProject } from '@/application/projects/list-projects'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { Modal, type Notice } from '@/components/ui/Modal'
import { SelectDropdown } from '@/components/ui/SelectDropdown'

interface BulkTaskAssignmentSectionProps {
  role: 'professor' | 'admin'
  email: string
  projects: ListedProject[]
}

interface AssignmentResult {
  created: Array<{ projectId: string; projectTitle: string; taskId: string }>
  skipped: Array<{ projectId: string; projectTitle: string; reason: string }>
}

const SEMESTER_OPTIONS = [
  { value: 'all', label: 'Todos os semestres' },
  ...[1, 2, 3, 4, 5, 6].map((semester) => ({
    value: String(semester),
    label: `${semester}º semestre`,
  })),
]

const RELATION_OPTIONS = [
  { value: 'all', label: 'Todos que acompanho' },
  { value: 'principal', label: 'Sou orientador principal' },
  { value: 'satellite', label: 'Sou orientador satélite' },
]

const SITUATION_OPTIONS = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'publicado', label: 'Concluídos' },
  { value: 'all', label: 'Todas as situações' },
]

const inputClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15'
const labelClass = 'block text-xs font-bold text-slate-800'

function projectCountLabel(count: number) {
  return count === 1 ? '1 projeto' : `${count} projetos`
}

export function BulkTaskAssignmentSection({
  role,
  email,
  projects,
}: BulkTaskAssignmentSectionProps) {
  const router = useRouter()
  const isAdmin = role === 'admin'
  const viewer = useMemo(() => ({ role, email: email.trim().toLowerCase() }), [role, email])
  const [filters, setFilters] = useState<BulkTaskFilters>(DEFAULT_BULK_TASK_FILTERS)
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [result, setResult] = useState<AssignmentResult | null>(null)

  const candidates = useMemo(() => bulkTaskCandidates(projects, viewer), [projects, viewer])
  const visible = useMemo(
    () => filterBulkTaskProjects(candidates, filters, viewer),
    [candidates, filters, viewer],
  )
  const selectableVisible = useMemo(() => selectableProjectIds(visible, viewer), [visible, viewer])
  const allSelectable = useMemo(
    () => selectableProjectIds(candidates, viewer),
    [candidates, viewer],
  )
  const cycleOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os ciclos' },
      ...listBulkTaskCycles(candidates).map((cycle) => ({ value: cycle, label: cycle })),
    ],
    [candidates],
  )
  const advisorOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os orientadores' },
      ...listBulkTaskAdvisors(candidates).map((advisor) => ({
        value: advisor.email,
        label: advisor.name,
      })),
    ],
    [candidates],
  )

  const selectedProjects = candidates.filter((project) => selected.includes(project.id))
  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((id) => selected.includes(id))
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_BULK_TASK_FILTERS)

  function updateFilter<Key extends keyof BulkTaskFilters>(key: Key, value: BulkTaskFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function toggleProject(projectId: string) {
    setSelected((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    )
  }

  function toggleVisible() {
    setSelected((current) =>
      allVisibleSelected
        ? current.filter((id) => !selectableVisible.includes(id))
        : [...new Set([...current, ...selectableVisible])],
    )
  }

  function selectEverything() {
    setFilters(DEFAULT_BULK_TASK_FILTERS)
    setSelected(
      selectableProjectIds(
        filterBulkTaskProjects(candidates, DEFAULT_BULK_TASK_FILTERS, viewer),
        viewer,
      ),
    )
  }

  function requestAssignment() {
    setError('')
    if (selectedProjects.length === 0) {
      setError('Selecione pelo menos um projeto.')
      return
    }
    if (title.trim().length < 3) {
      setError('Informe o título da tarefa, com pelo menos 3 caracteres.')
      return
    }
    if (description.trim().length < 5) {
      setError('Descreva a tarefa com pelo menos 5 caracteres.')
      return
    }
    setConfirmationOpen(true)
  }

  async function assignTask() {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/projects/bulk-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectIds: selectedProjects.map((project) => project.id),
          title,
          description,
          dueDate,
        }),
      })
      const data = (await response.json().catch(() => null)) as
        | (AssignmentResult & { error?: string })
        | null
      if (!response.ok || !data) {
        throw new Error(data?.error ?? 'Não foi possível atribuir a tarefa.')
      }

      setResult({ created: data.created, skipped: data.skipped })
      const createdCount = data.created.length
      const skippedCount = data.skipped.length
      if (createdCount > 0) {
        setTitle('')
        setDescription('')
        setDueDate('')
        setSelected([])
        router.refresh()
      }
      setNotice(
        createdCount === 0
          ? {
              variant: 'error',
              title: 'Nenhuma tarefa criada',
              description:
                'Nenhum dos projetos selecionados aceitou a tarefa. Veja os motivos abaixo.',
            }
          : {
              variant: skippedCount > 0 ? 'warning' : 'success',
              title: skippedCount > 0 ? 'Tarefa atribuída em parte' : 'Tarefa atribuída',
              description:
                skippedCount > 0
                  ? `A tarefa foi criada em ${projectCountLabel(createdCount)} e ${projectCountLabel(skippedCount)} foram ignorados.`
                  : `A tarefa foi criada em ${projectCountLabel(createdCount)}.`,
            },
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado ao atribuir a tarefa.')
    } finally {
      setSaving(false)
      setConfirmationOpen(false)
    }
  }

  if (candidates.length === 0) {
    return (
      <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center">
          <i className="fi fi-rr-list-check text-xl text-text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm text-text-secondary">
            {isAdmin
              ? 'Ainda não há projetos ativos para receber tarefas.'
              : 'Você ainda não acompanha projetos ativos para receber tarefas.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr] xl:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                1. Escolha os projetos
              </h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                {isAdmin
                  ? 'Você enxerga todos os projetos ativos do sistema.'
                  : 'Você vê os projetos que acompanha. Só o orientador principal cria tarefas.'}
              </p>
            </div>
            <button
              type="button"
              onClick={selectEverything}
              className="cursor-pointer inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-primary-light"
            >
              <i className="fi fi-rr-checkbox flex" aria-hidden="true" />
              {isAdmin
                ? `Todos em andamento (${allSelectable.length})`
                : `Todos que acompanho em andamento (${allSelectable.length})`}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <label className="relative min-w-0 flex-1 lg:min-w-[220px]">
              <span className="sr-only">Buscar projeto por título, orientador ou tema</span>
              <i
                className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary"
                aria-hidden="true"
              />
              <input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                placeholder="Buscar por título, orientador ou tema..."
                className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <div className="lg:w-[170px]">
              <SelectDropdown
                value={filters.semester}
                ariaLabel="Filtrar por semestre"
                size="compact"
                tone="muted"
                width="full"
                options={SEMESTER_OPTIONS}
                onChange={(value) => updateFilter('semester', value)}
              />
            </div>
            <div className="lg:w-[150px]">
              <SelectDropdown
                value={filters.cycle}
                ariaLabel="Filtrar por ciclo"
                size="compact"
                tone="muted"
                width="full"
                options={cycleOptions}
                onChange={(value) => updateFilter('cycle', value)}
              />
            </div>
            {isAdmin ? (
              <>
                <div className="lg:w-[200px]">
                  <SelectDropdown
                    value={filters.advisorEmail}
                    ariaLabel="Filtrar por orientador principal"
                    size="compact"
                    tone="muted"
                    width="full"
                    searchable
                    searchPlaceholder="Pesquisar orientador..."
                    options={advisorOptions}
                    onChange={(value) => updateFilter('advisorEmail', value)}
                  />
                </div>
                <div className="lg:w-[170px]">
                  <SelectDropdown
                    value={filters.situation}
                    ariaLabel="Filtrar por situação"
                    size="compact"
                    tone="muted"
                    width="full"
                    options={SITUATION_OPTIONS}
                    onChange={(value) => updateFilter('situation', value as BulkTaskSituation)}
                  />
                </div>
              </>
            ) : (
              <div className="lg:w-[200px]">
                <SelectDropdown
                  value={filters.relation}
                  ariaLabel="Filtrar pela sua função no projeto"
                  size="compact"
                  tone="muted"
                  width="full"
                  options={RELATION_OPTIONS}
                  onChange={(value) => updateFilter('relation', value as BulkTaskRelation)}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_BULK_TASK_FILTERS)}
              disabled={!hasActiveFilters}
              title="Limpar filtros"
              aria-label="Limpar filtros"
              className="cursor-pointer inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg bg-surface-secondary text-text-secondary transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
            >
              <i className="fi fi-rr-settings-sliders flex" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
            <p role="status">
              Exibindo {visible.length} de {candidates.length}. {selectedProjects.length}{' '}
              {selectedProjects.length === 1 ? 'selecionado' : 'selecionados'}.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleVisible}
                disabled={selectableVisible.length === 0}
                className="cursor-pointer font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
              >
                {allVisibleSelected ? 'Desmarcar os listados' : 'Selecionar os listados'}
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                disabled={selected.length === 0}
                className="cursor-pointer font-semibold text-text-secondary hover:text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
              >
                Limpar seleção
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center text-sm text-text-secondary">
              Nenhum projeto encontrado com esses filtros.
            </div>
          ) : (
            <ul className="mt-3 max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {visible.map((project) => {
                const reason = explainBulkTaskIneligibility(project, viewer)
                const checked = selected.includes(project.id)
                return (
                  <li key={project.id}>
                    <label
                      className={`flex items-start gap-3 rounded-lg border p-3 transition ${reason ? 'cursor-not-allowed border-border bg-surface-secondary/60 opacity-70' : checked ? 'cursor-pointer border-primary bg-primary-light/40' : 'cursor-pointer border-border bg-white hover:border-primary/40'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={Boolean(reason)}
                        onChange={() => toggleProject(project.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-slate-900">
                          {project.title}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] text-text-secondary">
                          {project.cycle} · {project.semester}º semestre · {project.advisor.name}
                        </span>
                        {reason && (
                          <span className="mt-1 block text-[0.625rem] font-semibold text-amber-700">
                            {reason}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] font-bold ${project.status === 'em_andamento' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
                      >
                        {project.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0 xl:border-l xl:border-border-light xl:pl-8">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">2. Descreva a tarefa</h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            A mesma tarefa é criada para o grupo todo de cada projeto escolhido.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass} htmlFor="bulk-task-title">
                Título da tarefa
              </label>
              <input
                id="bulk-task-title"
                className={inputClass}
                value={title}
                maxLength={160}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Entrega do relatório parcial"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="bulk-task-description">
                Descrição
              </label>
              <textarea
                id="bulk-task-description"
                className={`${inputClass} min-h-32 resize-y`}
                value={description}
                maxLength={5000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explique o que deve ser entregue e como será avaliado."
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="bulk-task-due-date">
                Data de entrega <span className="font-normal text-text-secondary">(opcional)</span>
              </label>
              <input
                id="bulk-task-due-date"
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-900"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={requestAssignment}
              disabled={saving || selectedProjects.length === 0}
              className="cursor-pointer inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className="fi fi-rr-paper-plane flex" aria-hidden="true" />
              {selectedProjects.length > 0
                ? `Atribuir a ${projectCountLabel(selectedProjects.length)}`
                : 'Selecione os projetos'}
            </button>
          </div>

          {result && (
            <div className="mt-5 space-y-3 rounded-xl border border-border bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Resultado da atribuição</p>
              {result.created.length > 0 && (
                <details className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3" open>
                  <summary className="cursor-pointer text-xs font-semibold text-emerald-900">
                    Tarefa criada em {projectCountLabel(result.created.length)}
                  </summary>
                  <ul className="scrollbar-success mt-2 max-h-40 space-y-1.5 overflow-auto pr-1 text-[0.6875rem] text-emerald-900">
                    {result.created.map((item) => (
                      <li key={item.taskId}>
                        <Link
                          href={`/projetos/${encodeURIComponent(item.projectId)}`}
                          className="font-semibold underline-offset-2 hover:underline"
                        >
                          {item.projectTitle}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {result.skipped.length > 0 && (
                <details className="rounded-lg border border-amber-100 bg-amber-50/60 p-3" open>
                  <summary className="cursor-pointer text-xs font-semibold text-amber-900">
                    Projetos ignorados ({result.skipped.length})
                  </summary>
                  <ul className="scrollbar-warning mt-2 max-h-40 space-y-1.5 overflow-auto pr-1 text-[0.6875rem] leading-relaxed text-amber-900">
                    {result.skipped.map((item) => (
                      <li key={item.projectId}>
                        <strong>{item.projectTitle}:</strong> {item.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={confirmationOpen}
        title="Atribuir a tarefa aos projetos?"
        description={`A tarefa “${title.trim()}” será criada para o grupo todo de ${projectCountLabel(selectedProjects.length)}${dueDate ? ', com prazo de entrega definido' : ''}. Cada projeto recebe a sua própria cópia, que depois pode ser editada separadamente.`}
        details={
          <ul className="space-y-1 text-xs text-slate-700">
            {selectedProjects.slice(0, 6).map((project) => (
              <li key={project.id} className="truncate">
                • {project.title}
              </li>
            ))}
            {selectedProjects.length > 6 && (
              <li className="font-semibold text-slate-900">
                e mais {selectedProjects.length - 6}…
              </li>
            )}
          </ul>
        }
        icon="fi-rr-list-check"
        tone="primary"
        confirmLabel="Atribuir tarefa"
        cancelLabel="Revisar"
        pending={saving}
        onCancel={() => setConfirmationOpen(false)}
        onConfirm={assignTask}
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
