'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, type KeyboardEvent, useMemo, useState } from 'react'
import SelectDropdown from '@/components/ui/SelectDropdown'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'

export interface ProjectPersonOption {
  email: string
  name: string
  registrationNumber: string | null
  course: string | null
}

interface ProjectCreatePageProps {
  role: Role
  currentUserEmail: string
  students: ProjectPersonOption[]
  professors: ProjectPersonOption[]
  backHref: string
}

interface DraftTask {
  key: string
  title: string
  description: string
  targetStudentEmail: string
  dueDate: string
}

const THEME_SUGGESTIONS = [
  'Gestão & Processos',
  'Saúde & Acessibilidade',
  'Sustentabilidade & ESG',
  'Educação Tecnológica',
  'Inteligência Artificial',
  'Segurança da Informação',
]

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6].map((value) => ({
  value: String(value),
  label: `${value}º semestre`,
}))

const STATUS_OPTIONS = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'publicado', label: 'Concluído (público no acervo)' },
]

const fieldClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15'
const labelClass = 'block text-xs font-bold text-slate-800'
const hintClass = 'mt-1 text-[11px] leading-relaxed text-slate-500'
const sectionClass = 'rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6'

function defaultCycle() {
  const now = new Date()
  return `${now.getFullYear()}/${now.getMonth() < 6 ? 1 : 2}`
}

function newTaskKey() {
  return `task-${Math.random().toString(36).slice(2, 10)}`
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-1 h-6 w-2 shrink-0 rounded-full bg-emerald-800" aria-hidden="true" />
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
          <i className={`fi ${icon} flex text-base text-primary`} aria-hidden="true" />
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-[#765e58] sm:text-[13px]">{subtitle}</p>
      </div>
    </div>
  )
}

function TagInput({
  id,
  label,
  placeholder,
  values,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const parts = draft
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    const next = [...values]
    for (const part of parts) {
      if (!next.some((item) => item.toLocaleLowerCase('pt-BR') === part.toLocaleLowerCase('pt-BR')))
        next.push(part.slice(0, 60))
    }
    onChange(next.slice(0, 20))
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-md bg-primary-light px-2 py-1 text-xs font-semibold text-primary"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              aria-label={`Remover ${value}`}
              className="cursor-pointer flex h-4 w-4 items-center justify-center rounded hover:bg-primary/15"
            >
              <i className="fi fi-rr-cross-small flex text-sm" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      <p className={hintClass}>Pressione Enter ou vírgula para adicionar.</p>
    </div>
  )
}

export default function ProjectCreatePage({
  role,
  currentUserEmail,
  students,
  professors,
  backHref,
}: ProjectCreatePageProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [overview, setOverview] = useState('')
  const [cycle, setCycle] = useState(defaultCycle)
  const [semester, setSemester] = useState('1')
  const [theme, setTheme] = useState('')
  const [status, setStatus] = useState('em_andamento')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [advisorEmail, setAdvisorEmail] = useState(
    role === 'professor' ? currentUserEmail : (professors[0]?.email ?? ''),
  )
  const [languages, setLanguages] = useState<string[]>([])
  const [stack, setStack] = useState<string[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [studentQuery, setStudentQuery] = useState('')
  const [tasks, setTasks] = useState<DraftTask[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedStudents = useMemo(
    () =>
      selectedEmails
        .map((email) => students.find((student) => student.email === email))
        .filter((student): student is ProjectPersonOption => Boolean(student)),
    [selectedEmails, students],
  )

  const visibleStudents = useMemo(() => {
    const normalized = studentQuery.trim().toLocaleLowerCase('pt-BR')
    return students.filter(
      (student) =>
        !normalized ||
        `${student.name} ${student.email} ${student.registrationNumber ?? ''}`
          .toLocaleLowerCase('pt-BR')
          .includes(normalized),
    )
  }, [students, studentQuery])

  const advisorOptions = professors.map((professor) => ({
    value: professor.email,
    label: professor.name,
  }))
  const advisor = professors.find((professor) => professor.email === advisorEmail)

  const responsibleOptions = [
    { value: '', label: 'Todo o grupo' },
    ...selectedStudents.map((student) => ({ value: student.email, label: student.name })),
  ]

  function toggleStudent(email: string) {
    const removing = selectedEmails.includes(email)
    setSelectedEmails((current) =>
      removing ? current.filter((item) => item !== email) : [...current, email],
    )
    if (removing) {
      setTasks((current) =>
        current.map((task) =>
          task.targetStudentEmail === email ? { ...task, targetStudentEmail: '' } : task,
        ),
      )
    }
  }

  function addTask() {
    setTasks((current) => [
      ...current,
      { key: newTaskKey(), title: '', description: '', targetStudentEmail: '', dueDate: '' },
    ])
  }

  function updateTask(key: string, changes: Partial<DraftTask>) {
    setTasks((current) =>
      current.map((task) => (task.key === key ? { ...task, ...changes } : task)),
    )
  }

  function removeTask(key: string) {
    setTasks((current) => current.filter((task) => task.key !== key))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (selectedEmails.length === 0) {
      setError('Atribua pelo menos um aluno ao projeto.')
      return
    }
    if (!advisorEmail) {
      setError('Selecione o professor orientador.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          title,
          summary,
          overview,
          cycle,
          semester: Number(semester),
          theme,
          status,
          repositoryUrl,
          advisorEmail,
          languages,
          stack,
          studentEmails: selectedEmails,
          tasks: tasks.map((task) => ({
            title: task.title,
            description: task.description,
            targetStudentEmail: task.targetStudentEmail || null,
            dueDate: task.dueDate || null,
          })),
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
        id?: string
      } | null
      if (!response.ok || !result?.id) {
        throw new Error(result?.error ?? 'Não foi possível cadastrar o projeto.')
      }
      router.push(`/projetos/${encodeURIComponent(result.id)}`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ocorreu um erro ao cadastrar o projeto.')
      setSaving(false)
    }
  }

  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary transition hover:text-primary"
        >
          <i className="fi fi-rr-arrow-left flex" aria-hidden="true" /> Voltar ao painel
        </Link>
        <div className="mt-3 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
            Projeto Integrador
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
            Cadastrar novo projeto
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Preencha as informações, atribua os alunos e, se quiser, já defina as primeiras tarefas.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <section className={sectionClass}>
            <SectionTitle
              icon="fi-rr-document"
              title="Informações do projeto"
              subtitle="Dados principais exibidos no acervo."
            />
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="project-title">
                  Título <span className="text-primary">*</span>
                </label>
                <input
                  id="project-title"
                  className={fieldClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={3}
                  maxLength={160}
                  placeholder="Ex.: SALA — Sistema de Agendamento de Laboratórios"
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="project-summary">
                  Resumo <span className="text-primary">*</span>
                </label>
                <textarea
                  id="project-summary"
                  className={`${fieldClass} min-h-24 resize-y`}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  minLength={10}
                  maxLength={600}
                  placeholder="Descreva o projeto em poucas linhas."
                  required
                />
                <p className="mt-1 text-right text-[10px] text-slate-500">
                  {summary.length}/600 caracteres
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="project-overview">
                  Descrição detalhada <span className="font-normal text-slate-500">(opcional)</span>
                </label>
                <textarea
                  id="project-overview"
                  className={`${fieldClass} min-h-32 resize-y`}
                  value={overview}
                  onChange={(event) => setOverview(event.target.value)}
                  maxLength={5000}
                  placeholder="Contexto, problema, objetivos e resultados esperados."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="project-cycle">
                    Ciclo <span className="text-primary">*</span>
                  </label>
                  <input
                    id="project-cycle"
                    className={fieldClass}
                    value={cycle}
                    onChange={(event) => setCycle(event.target.value)}
                    pattern="\d{4}/[12]"
                    placeholder="2026/2"
                    required
                  />
                </div>
                <div>
                  <span className={labelClass}>Semestre</span>
                  <SelectDropdown
                    value={semester}
                    ariaLabel="Semestre do projeto"
                    width="full"
                    className="mt-1.5"
                    options={SEMESTER_OPTIONS}
                    onChange={setSemester}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <span className={labelClass}>Situação</span>
                  <SelectDropdown
                    value={status}
                    ariaLabel="Situação do projeto"
                    width="full"
                    className="mt-1.5"
                    options={STATUS_OPTIONS}
                    onChange={setStatus}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="project-theme">
                    Tema <span className="text-primary">*</span>
                  </label>
                  <input
                    id="project-theme"
                    className={fieldClass}
                    value={theme}
                    onChange={(event) => setTheme(event.target.value)}
                    list="project-theme-suggestions"
                    minLength={2}
                    maxLength={80}
                    placeholder="Ex.: Gestão & Processos"
                    required
                  />
                  <datalist id="project-theme-suggestions">
                    {THEME_SUGGESTIONS.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass} htmlFor="project-repository">
                    Repositório <span className="font-normal text-slate-500">(opcional)</span>
                  </label>
                  <input
                    id="project-repository"
                    type="url"
                    className={fieldClass}
                    value={repositoryUrl}
                    onChange={(event) => setRepositoryUrl(event.target.value)}
                    maxLength={300}
                    placeholder="https://github.com/organizacao/projeto"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon="fi-rr-chalkboard-user"
              title="Professor orientador"
              subtitle={
                role === 'professor'
                  ? 'Você será o orientador deste projeto.'
                  : 'Selecione o professor responsável pelo projeto.'
              }
            />
            {role === 'professor' ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {getNameInitials(advisor?.name ?? currentUserEmail)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {advisor?.name ?? currentUserEmail}
                  </p>
                  <p className="truncate text-xs text-text-secondary">{currentUserEmail}</p>
                </div>
              </div>
            ) : professors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center text-sm text-text-secondary">
                Nenhum professor ativo cadastrado. Cadastre um professor antes de criar o projeto.
              </p>
            ) : (
              <SelectDropdown
                value={advisorEmail}
                ariaLabel="Professor orientador"
                width="full"
                options={advisorOptions}
                onChange={setAdvisorEmail}
              />
            )}
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon="fi-rr-layers"
              title="Tecnologias"
              subtitle="Linguagens e ferramentas utilizadas no desenvolvimento."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TagInput
                id="project-languages"
                label="Linguagens"
                placeholder="Ex.: TypeScript, Python"
                values={languages}
                onChange={setLanguages}
              />
              <TagInput
                id="project-stack"
                label="Stack e ferramentas"
                placeholder="Ex.: React, Node.js, PostgreSQL"
                values={stack}
                onChange={setStack}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon="fi-rr-users"
              title="Alunos participantes"
              subtitle="Selecione os alunos que integram o grupo."
            />
            {selectedStudents.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Alunos selecionados">
                {selectedStudents.map((student) => (
                  <li
                    key={student.email}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-light py-1 pr-1.5 pl-3 text-xs font-semibold text-primary"
                  >
                    {student.name}
                    <button
                      type="button"
                      onClick={() => toggleStudent(student.email)}
                      aria-label={`Remover ${student.name}`}
                      className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15"
                    >
                      <i className="fi fi-rr-cross-small flex text-sm" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="relative block">
              <span className="sr-only">Buscar aluno por nome, RA ou e-mail</span>
              <i
                className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#765e58]"
                aria-hidden="true"
              />
              <input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Buscar aluno por nome, RA ou e-mail..."
                className="h-10 w-full rounded-lg border border-transparent bg-[#f2f3f4] pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border-light">
              {visibleStudents.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-text-secondary">
                  {students.length === 0
                    ? 'Nenhum aluno ativo cadastrado.'
                    : 'Nenhum aluno encontrado com essa busca.'}
                </p>
              ) : (
                <ul className="divide-y divide-border-light">
                  {visibleStudents.map((student) => {
                    const checked = selectedEmails.includes(student.email)
                    return (
                      <li key={student.email}>
                        <label
                          className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${checked ? 'bg-primary-light/50' : 'hover:bg-surface-secondary'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(student.email)}
                            className="h-4 w-4 shrink-0 cursor-pointer accent-[#8d0000]"
                          />
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-primary">
                            {getNameInitials(student.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-slate-900">
                              {student.name}
                            </span>
                            <span className="block truncate text-[11px] text-text-secondary">
                              {student.registrationNumber
                                ? `RA ${student.registrationNumber} · `
                                : ''}
                              {student.email}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <p className={hintClass}>
              {selectedEmails.length}{' '}
              {selectedEmails.length === 1 ? 'aluno selecionado' : 'alunos selecionados'}.
            </p>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon="fi-rr-list-check"
              title="Tarefas iniciais"
              subtitle="Opcional. Você pode cadastrar o projeto sem tarefas e adicioná-las depois."
            />
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center">
                <i className="fi fi-rr-document text-xl text-text-muted" aria-hidden="true" />
                <p className="mt-2 text-sm text-text-secondary">
                  O projeto será criado sem tarefas.
                </p>
              </div>
            ) : (
              <ol className="space-y-4">
                {tasks.map((task, index) => (
                  <li
                    key={task.key}
                    className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <i className="fi fi-rr-code-branch flex text-primary" aria-hidden="true" />
                        Tarefa {index + 1} · v{index + 1}.0
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(task.key)}
                        aria-label={`Remover tarefa ${index + 1}`}
                        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-800"
                      >
                        <i className="fi fi-rr-trash flex" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass} htmlFor={`${task.key}-title`}>
                          Nome da tarefa <span className="text-primary">*</span>
                        </label>
                        <input
                          id={`${task.key}-title`}
                          className={fieldClass}
                          value={task.title}
                          onChange={(event) => updateTask(task.key, { title: event.target.value })}
                          minLength={3}
                          maxLength={160}
                          placeholder="Ex.: Entregar documentação de requisitos"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`${task.key}-description`}>
                          Descrição e critérios de entrega <span className="text-primary">*</span>
                        </label>
                        <textarea
                          id={`${task.key}-description`}
                          className={`${fieldClass} min-h-24 resize-y`}
                          value={task.description}
                          onChange={(event) =>
                            updateTask(task.key, { description: event.target.value })
                          }
                          minLength={5}
                          maxLength={5000}
                          placeholder="Explique o que deve ser entregue e como será avaliado."
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <span className={labelClass}>Responsável pela entrega</span>
                          <SelectDropdown
                            value={task.targetStudentEmail}
                            ariaLabel={`Responsável pela tarefa ${index + 1}`}
                            width="full"
                            className="mt-1.5"
                            options={responsibleOptions}
                            onChange={(value) =>
                              updateTask(task.key, { targetStudentEmail: value })
                            }
                          />
                          <p className={hintClass}>
                            Tarefas individuais ficam visíveis apenas ao aluno selecionado.
                          </p>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`${task.key}-due`}>
                            Prazo de entrega
                          </label>
                          <input
                            id={`${task.key}-due`}
                            type="date"
                            className={fieldClass}
                            value={task.dueDate}
                            onChange={(event) =>
                              updateTask(task.key, { dueDate: event.target.value })
                            }
                          />
                          <p className={hintClass}>O prazo pode ser deixado em branco.</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <button
              type="button"
              onClick={addTask}
              className="cursor-pointer mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-4 text-xs font-semibold text-primary transition hover:bg-primary-light"
            >
              <i className="fi fi-rr-plus flex" aria-hidden="true" /> Adicionar tarefa
            </button>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href={backHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || (role === 'admin' && professors.length === 0)}
              className="cursor-pointer inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-65"
            >
              {saving ? (
                <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />
              ) : (
                <i className="fi fi-rr-check flex" aria-hidden="true" />
              )}
              {saving
                ? 'Cadastrando…'
                : tasks.length > 0
                  ? `Cadastrar projeto com ${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`
                  : 'Cadastrar projeto sem tarefas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
