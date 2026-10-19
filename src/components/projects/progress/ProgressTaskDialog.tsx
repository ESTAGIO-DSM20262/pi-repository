'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProjectProgressTaskStatus } from '@/domain/enterprise/entities/project-progress'

export interface ProgressTask {
  id: string
  projectId: string
  title: string
  description: string
  versionMajor: number
  versionMinor: number
  status: ProjectProgressTaskStatus
  targetStudentEmail: string | null
  dueDate: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface ProgressRevision {
  id: string
  taskId: string
  projectId: string
  title: string
  description: string
  versionMajor: number
  versionMinor: number
  status: ProjectProgressTaskStatus
  targetStudentEmail: string | null
  dueDate: string | null
  action: 'created' | 'updated'
  changeNote: string | null
  changedByUserId: string
  changedAt: string
}

export interface ProgressMember {
  email: string
  name: string
}

interface ProgressTaskDialogProps {
  open: boolean
  projectId: string
  task: ProgressTask | null
  nextVersionMajor: number
  members: ProgressMember[]
  onClose: () => void
  onSaved: (taskId: string) => void
}

const STATUS_OPTIONS: Array<{ value: ProjectProgressTaskStatus; label: string }> = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluída' },
]

const inputClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15'
const labelClass = 'block text-xs font-bold text-slate-800'

export default function ProgressTaskDialog({
  open,
  projectId,
  task,
  nextVersionMajor,
  members,
  onClose,
  onSaved,
}: ProgressTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetStudentEmail, setTargetStudentEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<ProjectProgressTaskStatus>('pending')
  const [changeNote, setChangeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const onCloseRef = useRef(onClose)
  const savingRef = useRef(saving)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setTargetStudentEmail(task?.targetStudentEmail ?? '')
    setDueDate(task?.dueDate ?? '')
    setStatus(task?.status ?? 'pending')
    setChangeNote('')
    setError('')
    setSaving(false)
  }, [open, task])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    const previousRootBackground = document.documentElement.style.backgroundColor
    const previousGutter = document.documentElement.style.scrollbarGutter
    document.documentElement.style.scrollbarGutter = 'stable'
    document.documentElement.style.backgroundColor = '#020617'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousRootOverflow
      document.documentElement.style.backgroundColor = previousRootBackground
      document.documentElement.style.scrollbarGutter = previousGutter
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const endpoint = task
        ? `/api/projects/${encodeURIComponent(projectId)}/progress/${encodeURIComponent(task.id)}`
        : `/api/projects/${encodeURIComponent(projectId)}/progress`
      const response = await fetch(endpoint, {
        method: task ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          title,
          description,
          targetStudentEmail: targetStudentEmail || null,
          dueDate: dueDate || null,
          status,
          changeNote,
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
        task?: ProgressTask
      } | null
      if (!response.ok || !result?.task) {
        throw new Error(result?.error ?? 'Não foi possível salvar a tarefa.')
      }
      onSaved(result.task.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ocorreu um erro ao salvar a tarefa.')
    } finally {
      setSaving(false)
    }
  }

  const nextVersionLabel = task
    ? `v${task.versionMajor}.${task.versionMinor + 1}`
    : `v${nextVersionMajor}.0`

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
        aria-labelledby="progress-task-dialog-title"
        className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <i
              className={`fi ${task ? 'fi-rr-edit' : 'fi-rr-document'} flex text-xl`}
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Progresso do projeto
            </p>
            <h2
              id="progress-task-dialog-title"
              className="mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-xl"
            >
              {task ? 'Editar tarefa' : 'Adicionar nova tarefa'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {task
                ? 'As alterações criam uma nova revisão e preservam o histórico anterior.'
                : 'Defina a entrega, para quem ela é direcionada e o prazo esperado.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
            className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >
            <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
          </button>
        </header>

        <form
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/15 bg-primary-light/35 px-3.5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <i className="fi fi-rr-code-branch flex text-primary" aria-hidden="true" />
              Versão {nextVersionLabel}
            </div>
            <span className="text-[11px] text-slate-600">
              {task ? 'Revisão menor da mesma tarefa' : 'Nova entrega do projeto'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="progress-task-title">
                Nome da tarefa <span className="text-primary">*</span>
              </label>
              <input
                id="progress-task-title"
                className={inputClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={3}
                maxLength={160}
                placeholder="Ex.: Entregar documentação final"
                required
              />
              <p className="mt-1 text-right text-[10px] text-slate-500">
                {title.length}/160 caracteres
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="progress-task-description">
                Descrição e critérios de entrega <span className="text-primary">*</span>
              </label>
              <textarea
                id="progress-task-description"
                className={`${inputClass} min-h-32 resize-y`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minLength={5}
                maxLength={5000}
                placeholder="Explique o que deve ser entregue, os requisitos e como o professor avaliará a tarefa."
                required
              />
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Descreva o resultado esperado para que todos entendam claramente a solicitação.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="progress-task-target">
                  Responsável pela entrega
                </label>
                <select
                  id="progress-task-target"
                  className={`${inputClass} cursor-pointer`}
                  value={targetStudentEmail}
                  onChange={(event) => setTargetStudentEmail(event.target.value)}
                >
                  <option value="">Todo o grupo</option>
                  {members.map((member) => (
                    <option key={member.email} value={member.email}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  Tarefas individuais ficam visíveis apenas ao aluno selecionado.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="progress-task-due-date">
                  Prazo de entrega
                </label>
                <input
                  id="progress-task-due-date"
                  type="date"
                  className={inputClass}
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  O prazo pode ser deixado em branco.
                </p>
              </div>
            </div>

            {task && (
              <div>
                <label className={labelClass} htmlFor="progress-task-status">
                  Situação da entrega
                </label>
                <select
                  id="progress-task-status"
                  className={`${inputClass} cursor-pointer`}
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProjectProgressTaskStatus)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="progress-task-change-note">
                Nota da revisão <span className="font-normal text-slate-500">(opcional)</span>
              </label>
              <input
                id="progress-task-change-note"
                className={inputClass}
                value={changeNote}
                onChange={(event) => setChangeNote(event.target.value)}
                maxLength={500}
                placeholder={
                  task ? 'Ex.: Ajuste no escopo e novo prazo' : 'Ex.: Entrega inicial do sprint'
                }
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <footer className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
            >
              {saving ? (
                <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />
              ) : (
                <i className="fi fi-rr-check flex" aria-hidden="true" />
              )}
              {saving ? 'Salvando…' : task ? 'Salvar nova versão' : 'Criar tarefa'}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  )
}
