'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatPersonName } from '@/libs/initials'
import {
  type ProgressMember,
  type ProgressRevision,
  type ProgressTask,
  ProgressTaskDialog,
} from './ProgressTaskDialog'

interface ProjectProgressSectionProps {
  projectId: string
  projectTitle: string
  projectStatus: 'publicado' | 'em_andamento'
  canManage: boolean
  members: ProgressMember[]
}

const STATUS: Record<ProgressTask['status'], { label: string; badge: string; dot: string }> = {
  pending: {
    label: 'Pendente',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    dot: 'bg-slate-500 ring-slate-200',
  },
  in_progress: {
    label: 'Em andamento',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    dot: 'bg-amber-500 ring-amber-100',
  },
  completed: {
    label: 'Concluída',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500 ring-emerald-100',
  },
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return 'Sem prazo definido'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Sem prazo definido'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function versionLabel(task: Pick<ProgressTask, 'versionMajor' | 'versionMinor'>) {
  return `v${task.versionMajor}.${task.versionMinor}`
}

export function ProjectProgressSection({
  projectId,
  projectTitle,
  projectStatus,
  canManage: canManageFromPage,
  members,
}: ProjectProgressSectionProps) {
  const [tasks, setTasks] = useState<ProgressTask[]>([])
  const [revisions, setRevisions] = useState<ProgressRevision[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(canManageFromPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProgressTask | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const loadTasks = useCallback(
    async (preferredTaskId?: string) => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/progress`, {
          method: 'GET',
          cache: 'no-store',
        })
        const data = (await response.json().catch(() => null)) as {
          error?: string
          tasks?: ProgressTask[]
          revisions?: ProgressRevision[]
          canManage?: boolean
        } | null

        if (!response.ok || !data || !Array.isArray(data.tasks) || !Array.isArray(data.revisions)) {
          throw new Error(data?.error ?? 'Não foi possível carregar as tarefas do projeto.')
        }

        setTasks(data.tasks)
        setRevisions(data.revisions)
        setCanManage(canManageFromPage && data.canManage === true)
        setSelectedTaskId((current) => {
          if (preferredTaskId && data.tasks?.some((task) => task.id === preferredTaskId))
            return preferredTaskId
          if (current && data.tasks?.some((task) => task.id === current)) return current
          return data.tasks?.[0]?.id ?? null
        })
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Ocorreu um erro ao carregar o progresso.',
        )
      } finally {
        setLoading(false)
      }
    },
    [canManageFromPage, projectId],
  )

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    setShowHistory(false)
  }, [])

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const taskRevisions = useMemo(
    () => (selectedTask ? revisions.filter((revision) => revision.taskId === selectedTask.id) : []),
    [revisions, selectedTask],
  )
  const nextVersionMajor = Math.max(0, ...tasks.map((task) => task.versionMajor)) + 1
  const memberNameByEmail = useMemo(
    () =>
      new Map(members.map((member) => [member.email.toLowerCase(), formatPersonName(member.name)])),
    [members],
  )

  function openCreateDialog() {
    setEditingTask(null)
    setDialogOpen(true)
  }

  function openEditDialog(task: ProgressTask) {
    setEditingTask(task)
    setDialogOpen(true)
  }

  async function onSaved(taskId: string) {
    setDialogOpen(false)
    setEditingTask(null)
    await loadTasks(taskId)
  }

  return (
    <section
      className="mt-5 rounded-xl border border-[#e9c9c5] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
      aria-labelledby="project-progress-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="project-progress-title"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            <i className="fi fi-rr-time-fast flex text-base text-primary" aria-hidden="true" />
            Progresso do Projeto
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-[13px]">
            {projectStatus === 'publicado'
              ? 'Histórico das tarefas e orientações registradas durante o desenvolvimento deste projeto.'
              : canManage
                ? 'Organize entregas, atribua responsáveis e mantenha um histórico de cada revisão.'
                : 'Acompanhe as orientações do professor, os prazos e a evolução das entregas do seu grupo.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!canManage && (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold text-slate-600">
              <i className="fi fi-rr-lock flex" aria-hidden="true" />
              {projectStatus === 'publicado'
                ? 'Projeto concluído · somente consulta'
                : 'Somente acompanhamento'}
            </span>
          )}
          {canManage && (
            <button
              type="button"
              onClick={openCreateDialog}
              className="cursor-pointer inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:text-sm"
            >
              <i className="fi fi-rr-plus flex" aria-hidden="true" /> Nova tarefa
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p role="alert" className="text-sm leading-relaxed text-red-800">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              void loadTasks()
            }}
            className="cursor-pointer min-h-9 shrink-0 rounded-md border border-red-200 bg-white px-3 text-xs font-bold text-red-800 transition hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-4 grid min-h-60 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="animate-pulse rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="mt-4 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
          </div>
          <div className="animate-pulse space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      ) : !error && tasks.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <i className="fi fi-rr-clipboard-list flex text-xl" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            Ainda não há tarefas registradas
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
            {projectStatus === 'publicado'
              ? 'Nenhuma tarefa foi registrada para este projeto durante o desenvolvimento.'
              : canManage
                ? 'Crie a primeira entrega para começar a acompanhar as versões e os prazos deste projeto.'
                : 'O professor ainda não adicionou tarefas para este projeto.'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={openCreateDialog}
              className="cursor-pointer mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover"
            >
              <i className="fi fi-rr-plus flex" aria-hidden="true" /> Criar primeira tarefa
            </button>
          )}
        </div>
      ) : !error ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
          <article className="flex min-w-0 flex-col rounded-lg border border-slate-300 bg-slate-50/70 p-4 sm:p-5">
            {selectedTask ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary px-2 py-1 text-[10px] font-extrabold tracking-wide text-white">
                    {versionLabel(selectedTask)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS[selectedTask.status].badge}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS[selectedTask.status].dot.split(' ')[0]}`}
                    />
                    {STATUS[selectedTask.status].label}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold leading-snug text-slate-900 sm:text-lg">
                  {selectedTask.title}
                </h3>
                <p className="mt-3 whitespace-pre-line break-words text-[13px] leading-relaxed text-[#6f514b]">
                  {selectedTask.description}
                </p>

                <dl className="mt-5 grid grid-cols-1 gap-2 border-t border-slate-200 pt-4 text-xs sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <i className="fi fi-rr-user flex text-primary" aria-hidden="true" />{' '}
                      Responsável
                    </dt>
                    <dd className="mt-1.5 font-semibold text-slate-800">
                      {selectedTask.targetStudentEmail
                        ? (memberNameByEmail.get(selectedTask.targetStudentEmail.toLowerCase()) ??
                          selectedTask.targetStudentEmail)
                        : 'Todo o grupo'}
                    </dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <i className="fi fi-rr-calendar flex text-primary" aria-hidden="true" /> Prazo
                    </dt>
                    <dd className="mt-1.5 font-semibold text-slate-800">
                      {formatDateOnly(selectedTask.dueDate)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span>Última atualização: {formatDateTime(selectedTask.updatedAt)}</span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openEditDialog(selectedTask)}
                        className="cursor-pointer inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-primary transition hover:border-primary hover:bg-primary-light/40"
                      >
                        <i className="fi fi-rr-edit flex" aria-hidden="true" /> Editar tarefa
                      </button>
                    )}
                  </div>

                  {taskRevisions.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        aria-expanded={showHistory}
                        onClick={() => setShowHistory((value) => !value)}
                        className="cursor-pointer flex min-h-9 w-full items-center justify-between gap-2 text-left text-xs font-bold text-slate-700 hover:text-primary"
                      >
                        <span className="flex items-center gap-2">
                          <i className="fi fi-rr-time-past flex text-primary" aria-hidden="true" />{' '}
                          Histórico de versões ({taskRevisions.length})
                        </span>
                        <i
                          className={`fi ${showHistory ? 'fi-rr-angle-small-up' : 'fi-rr-angle-small-down'} flex text-base`}
                          aria-hidden="true"
                        />
                      </button>
                      {showHistory && (
                        <ol className="mt-2 space-y-2">
                          {taskRevisions.map((revision) => (
                            <li
                              key={revision.id}
                              className="rounded-md border border-slate-200 bg-white p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] font-extrabold text-primary">
                                  v{revision.versionMajor}.{revision.versionMinor}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {formatDateTime(revision.changedAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] font-bold text-slate-800">
                                {revision.title}
                              </p>
                              <p className="mt-1 line-clamp-3 break-words whitespace-pre-line text-[11px] leading-relaxed text-slate-600">
                                {revision.description}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS[revision.status].badge}`}
                                >
                                  {STATUS[revision.status].label}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                                  {revision.targetStudentEmail
                                    ? (memberNameByEmail.get(
                                        revision.targetStudentEmail.toLowerCase(),
                                      ) ?? revision.targetStudentEmail)
                                    : 'Todo o grupo'}
                                </span>
                                {revision.dueDate && (
                                  <span className="text-[9px] text-slate-500">
                                    Prazo: {formatDateOnly(revision.dueDate)}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-500">
                                {revision.action === 'created'
                                  ? 'Tarefa criada'
                                  : 'Tarefa revisada'}{' '}
                                — {revision.changeNote || 'Sem observação para esta versão.'}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <i
                  className="fi fi-rr-clipboard-list flex text-3xl text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700">Selecione uma entrega</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Escolha uma tarefa na lista para consultar detalhes e histórico.
                </p>
              </div>
            )}
          </article>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Entregas e versões
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
            <ol className="max-h-[490px] space-y-2 overflow-y-auto pr-0.5">
              {tasks.map((task) => {
                const selected = task.id === selectedTaskId
                return (
                  <li
                    key={task.id}
                    className={`relative flex min-w-0 items-stretch gap-2 rounded-lg border p-2 transition sm:gap-2.5 ${selected ? 'border-primary/35 bg-primary-light/30' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}
                  >
                    <span
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ${STATUS[task.status].dot}`}
                    >
                      <i
                        className={`fi ${task.status === 'completed' ? 'fi-rr-check' : task.status === 'in_progress' ? 'fi-rr-hourglass-start' : 'fi-rr-clock'} flex text-[11px] text-white`}
                        aria-hidden="true"
                      />
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      aria-pressed={selected}
                      className="cursor-pointer min-w-0 flex-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${selected ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'}`}
                        >
                          {versionLabel(task)}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500">
                          {STATUS[task.status].label}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 break-words text-xs font-bold leading-snug text-slate-900 sm:text-[13px]">
                        {task.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <i className="fi fi-rr-clock flex" aria-hidden="true" /> Atualizada em{' '}
                        {formatDateTime(task.updatedAt)}
                      </p>
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openEditDialog(task)}
                        aria-label={`Editar ${task.title}`}
                        title="Editar tarefa"
                        className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-md text-slate-500 transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <i className="fi fi-rr-edit flex" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-500">
              <i
                className="fi fi-rr-info inline-flex align-[-2px] text-primary"
                aria-hidden="true"
              />{' '}
              Cada nova tarefa recebe uma versão principal (1.0, 2.0…). Editar uma tarefa gera uma
              revisão menor (1.1, 1.2…), mantendo o histórico.
            </p>
          </div>
        </div>
      ) : null}

      <ProgressTaskDialog
        open={dialogOpen}
        projectId={projectId}
        task={editingTask}
        nextVersionMajor={nextVersionMajor}
        members={members}
        onClose={() => setDialogOpen(false)}
        onSaved={onSaved}
      />
      <p className="sr-only">Progresso para o projeto {projectTitle}</p>
    </section>
  )
}
