'use client'

import { type FormEvent, useState } from 'react'
import { COURSE_ABBREVIATION_MAX, COURSE_NAME_MAX } from '@/application/courses/course-rules'
import {
  type AdminCourse,
  notifyCoursesChanged,
  useAdminCourses,
} from '@/components/admin/use-admin-courses'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

const inputClass =
  'mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
const secondaryButtonClass =
  'cursor-pointer inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

async function sendCourseRequest(
  method: 'POST' | 'PATCH' | 'DELETE',
  options: { body?: object; id?: string } = {},
) {
  const url = options.id
    ? `/api/admin/courses?id=${encodeURIComponent(options.id)}`
    : '/api/admin/courses'
  const response = await fetch(url, {
    method,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Não foi possível concluir a operação.')
}

export function AdminCoursesSection() {
  const { courses, loading, error: loadError, reload } = useAdminCourses()
  const [newName, setNewName] = useState('')
  const [newAbbreviation, setNewAbbreviation] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAbbreviation, setEditAbbreviation] = useState('')
  const [pendingToggle, setPendingToggle] = useState<AdminCourse | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminCourse | null>(null)
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const activeCount = courses.filter((course) => course.active).length

  async function run(action: () => Promise<void>, successMessage: string) {
    setWorking(true)
    setNotice('')
    setActionError('')
    try {
      await action()
      setNotice(successMessage)
      notifyCoursesChanged()
      return true
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao salvar o curso.')
      return false
    } finally {
      setWorking(false)
    }
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await run(
      () => sendCourseRequest('POST', { body: { name: newName, abbreviation: newAbbreviation } }),
      'Curso cadastrado. Ele já aparece nas listas de seleção.',
    )
    if (created) {
      setNewName('')
      setNewAbbreviation('')
    }
  }

  function startEdit(course: AdminCourse) {
    setEditingId(course.id)
    setEditName(course.name)
    setEditAbbreviation(course.abbreviation ?? '')
    setNotice('')
    setActionError('')
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId) return
    const saved = await run(
      () =>
        sendCourseRequest('PATCH', {
          body: { id: editingId, name: editName, abbreviation: editAbbreviation },
        }),
      'Curso atualizado. Usuários vinculados receberam o novo nome.',
    )
    if (saved) setEditingId(null)
  }

  async function confirmToggle() {
    if (!pendingToggle) return
    const course = pendingToggle
    await run(
      () => sendCourseRequest('PATCH', { body: { id: course.id, active: !course.active } }),
      course.active ? 'Curso desativado.' : 'Curso reativado.',
    )
    setPendingToggle(null)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const course = pendingDelete
    await run(() => sendCourseRequest('DELETE', { id: course.id }), 'Curso excluído.')
    setPendingDelete(null)
  }

  return (
    <section
      id="cursos"
      aria-labelledby="admin-courses-title"
      className="scroll-mt-4 rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:p-8"
    >
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <span className="mt-1 h-6 w-2 shrink-0 rounded-full bg-slate-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2
            id="admin-courses-title"
            className="flex flex-wrap items-center gap-2 break-words text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
          >
            <i className="fi fi-rr-graduation-cap flex text-base text-primary" aria-hidden="true" />
            Cursos Disponíveis
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary sm:text-[0.8125rem]">
            Cursos que podem ser escolhidos no cadastro e na edição de usuários.
          </p>
        </div>
      </div>

      <form
        onSubmit={createCourse}
        className="mb-4 grid gap-3 rounded-lg border border-border-light bg-surface-secondary/60 p-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end"
      >
        <label className="block text-xs font-semibold text-slate-700">
          Nome do curso
          <input
            required
            minLength={2}
            maxLength={COURSE_NAME_MAX}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex.: Análise e Desenvolvimento de Sistemas"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Sigla (opcional)
          <input
            maxLength={COURSE_ABBREVIATION_MAX}
            value={newAbbreviation}
            onChange={(event) => setNewAbbreviation(event.target.value)}
            placeholder="Ex.: ADS"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={working}
          className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-60"
        >
          <i className="fi fi-rr-plus flex text-sm" aria-hidden="true" /> Adicionar curso
        </button>
      </form>

      <div aria-live="polite">
        {notice && (
          <div
            role="status"
            className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
          >
            {notice}
          </div>
        )}
      </div>
      {(actionError || loadError) && (
        <div
          role="alert"
          className="mb-3 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{actionError || loadError}</p>
          {loadError && !actionError && (
            <button
              type="button"
              onClick={() => void reload()}
              className="cursor-pointer h-8 shrink-0 rounded-lg border border-rose-200 bg-white px-3 font-semibold text-rose-900 hover:bg-rose-100"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
      {!loading && !loadError && activeCount === 0 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Nenhum curso ativo: não será possível cadastrar novos alunos até ativar ou adicionar um
          curso.
        </div>
      )}

      <ul aria-label="Lista de cursos" className="space-y-2">
        {loading && (
          <li className="rounded-lg border border-border-light bg-surface-secondary px-4 py-6 text-center text-sm text-text-secondary">
            <i className="fi fi-rr-spinner mr-2 inline-flex animate-spin" aria-hidden="true" />
            Carregando cursos...
          </li>
        )}
        {!loading && courses.length === 0 && !loadError && (
          <li className="rounded-lg border border-border-light bg-surface-secondary px-4 py-6 text-center text-sm text-text-secondary">
            Nenhum curso cadastrado.
          </li>
        )}
        {courses.map((course) => (
          <li key={course.id} className="rounded-lg border border-border-light p-3">
            {editingId === course.id ? (
              <form
                onSubmit={saveEdit}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end"
              >
                <label className="block text-xs font-semibold text-slate-700">
                  Nome do curso
                  <input
                    required
                    minLength={2}
                    maxLength={COURSE_NAME_MAX}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Sigla
                  <input
                    maxLength={COURSE_ABBREVIATION_MAX}
                    value={editAbbreviation}
                    onChange={(event) => setEditAbbreviation(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => setEditingId(null)}
                    className={`${secondaryButtonClass} h-10`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={working}
                    className="cursor-pointer inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {working ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
                {course.userCount > 0 && (
                  <p className="text-[0.625rem] text-text-secondary sm:col-span-3">
                    Ao renomear, os {course.userCount} usuário(s) vinculados passam a usar o novo
                    nome.
                  </p>
                )}
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 break-words text-sm font-semibold text-slate-900">
                    {course.name}
                    {course.abbreviation && (
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[0.625rem] font-bold text-slate-800">
                        {course.abbreviation}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[0.625rem] font-bold ${
                        course.active
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {course.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {course.userCount === 1
                      ? '1 usuário vinculado'
                      : `${course.userCount} usuários vinculados`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => startEdit(course)}
                    aria-label={`Editar curso ${course.name}`}
                    className={secondaryButtonClass}
                  >
                    <i className="fi fi-rr-pencil flex" aria-hidden="true" /> Editar
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => setPendingToggle(course)}
                    aria-label={`${course.active ? 'Desativar' : 'Reativar'} curso ${course.name}`}
                    className={secondaryButtonClass}
                  >
                    <i
                      className={`fi ${course.active ? 'fi-rr-ban' : 'fi-rr-check-circle'} flex`}
                      aria-hidden="true"
                    />
                    {course.active ? 'Desativar' : 'Reativar'}
                  </button>
                  <button
                    type="button"
                    disabled={working || course.userCount > 0}
                    onClick={() => setPendingDelete(course)}
                    aria-label={`Excluir curso ${course.name}`}
                    title={
                      course.userCount > 0
                        ? 'Há usuários vinculados: desative o curso em vez de excluir.'
                        : undefined
                    }
                    className={`${secondaryButtonClass} border-rose-200 text-rose-900 hover:bg-rose-50`}
                  >
                    <i className="fi fi-rr-trash flex" aria-hidden="true" /> Excluir
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmationDialog
        open={pendingToggle !== null}
        title={pendingToggle?.active ? 'Desativar curso?' : 'Reativar curso?'}
        description={
          pendingToggle?.active
            ? `"${pendingToggle.name}" deixa de aparecer nas listas de seleção. Usuários já vinculados continuam com o curso e nada é apagado.`
            : `"${pendingToggle?.name ?? ''}" volta a aparecer nas listas de seleção.`
        }
        confirmLabel={pendingToggle?.active ? 'Desativar' : 'Reativar'}
        tone={pendingToggle?.active ? 'danger' : 'primary'}
        icon={pendingToggle?.active ? 'fi-rr-ban' : 'fi-rr-check-circle'}
        pending={working}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
      <ConfirmationDialog
        open={pendingDelete !== null}
        title="Excluir curso?"
        description={`"${pendingDelete?.name ?? ''}" será removido definitivamente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        icon="fi-rr-trash"
        pending={working}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}
