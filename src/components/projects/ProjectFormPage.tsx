'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react'
import BackButton from '@/components/ui/BackButton'
import SelectDropdown from '@/components/ui/SelectDropdown'
import type { ProjectStatus, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import type { ProjectExtraLink } from '@/domain/enterprise/entities/project-details'
import type { Role } from '@/domain/enterprise/entities/role'
import { comparePersonNames, formatPersonName, getNameInitials } from '@/libs/initials'

export interface ProjectPersonOption {
  email: string
  name: string
  registrationNumber: string | null
  course: string | null
}

export interface ProjectFormInitialValues {
  title: string
  summary: string
  overview: string
  cycle: string
  semester: number
  theme: string
  status: ProjectStatus
  advisorEmail: string
  languages: string[]
  stack: string[]
  studentEmails: string[]
  teamMembers?: ProjectTeamMember[]
  repositoryUrl: string
  liveUrl: string
  prototypeUrl: string
  extraLinks: ProjectExtraLink[]
}

interface ProjectFormPageProps {
  mode: 'create' | 'edit'
  scope?: 'full' | 'artifacts'
  role: Role
  currentUserEmail: string
  students: ProjectPersonOption[]
  professors: ProjectPersonOption[]
  backHref: string
  projectId?: string
  initialValues?: ProjectFormInitialValues
}

interface DraftTask {
  key: string
  title: string
  description: string
  targetStudentEmail: string
  dueDate: string
}

interface DraftLink {
  key: string
  title: string
  url: string
}

const COURSE_LABEL = 'Desenvolvimento de Software Multiplataforma (DSM)'

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
  'block h-10 w-full rounded-lg border border-border bg-surface-secondary px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 read-only:cursor-not-allowed read-only:text-slate-500'
const textareaClass = `${fieldClass} h-auto min-h-28 resize-y py-2.5 leading-relaxed`
const labelClass = 'mb-1.5 block text-xs font-bold text-slate-800'
const hintClass = 'mt-1.5 text-[11px] leading-relaxed text-[#765e58]'
const sectionClass = 'rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-7'
const softButtonClass =
  'cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface-secondary px-3.5 text-xs font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary'
const textActionClass =
  'cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-primary-hover'

function defaultCycle() {
  const now = new Date()
  return `${now.getFullYear()}/${now.getMonth() < 6 ? 1 : 2}`
}

function newKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function FormSection({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: string
  title: string
  subtitle: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={sectionClass}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <i className={`fi ${icon} flex text-lg`} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-[#765e58] sm:text-[13px]">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </section>
  )
}

function Badge({ tone, children }: { tone: 'slate' | 'green'; children: ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone === 'green' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}
    >
      {children}
    </span>
  )
}

function Required() {
  return <span className="text-primary">*</span>
}

function TagField({
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
      if (!next.some((item) => normalize(item) === normalize(part))) next.push(part.slice(0, 60))
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
      {values.length > 0 && (
        <ul className="mb-2.5 flex flex-wrap gap-1.5" aria-label={label}>
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-md bg-surface-secondary py-1 pr-1 pl-2.5 text-xs font-semibold text-slate-800 ring-1 ring-border"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remover ${value}`}
                className="cursor-pointer flex h-5 w-5 items-center justify-center rounded text-slate-500 transition hover:bg-primary/10 hover:text-primary"
              >
                <i className="fi fi-rr-cross-small flex text-sm" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={placeholder}
          className={fieldClass}
        />
        <button type="button" onClick={commit} className={softButtonClass}>
          <i className="fi fi-rr-plus flex" aria-hidden="true" /> Adicionar
        </button>
      </div>
      <p className={hintClass}>Pressione Enter ou vírgula para adicionar.</p>
    </div>
  )
}

function UploadSlot({
  icon,
  title,
  hint,
  accept,
  multiple = true,
  disabled = true,
  onFiles,
}: {
  icon: string
  title: string
  hint: string
  accept: string
  multiple?: boolean
  disabled?: boolean
  onFiles?: (files: File[]) => void
}) {
  return (
    <label
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center transition ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-primary/40 hover:bg-primary-light/30'}`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
        <i className={`fi ${icon} flex text-xl`} aria-hidden="true" />
      </span>
      <span className="mt-1 text-sm font-bold text-slate-900">{title}</span>
      <span className="text-[11px] text-[#765e58]">{hint}</span>
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          if (onFiles && event.target.files) onFiles(Array.from(event.target.files))
          event.target.value = ''
        }}
      />
    </label>
  )
}

function ArtifactSubheading({
  title,
  description,
  soon = false,
}: {
  title: string
  description: string
  soon?: boolean
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-[11px] text-[#765e58]">{description}</p>
      </div>
      {soon && <Badge tone="slate">Em breve</Badge>}
    </div>
  )
}

export default function ProjectFormPage({
  mode,
  scope = 'full',
  role,
  currentUserEmail,
  students,
  professors,
  backHref,
  projectId,
  initialValues,
}: ProjectFormPageProps) {
  const router = useRouter()
  const canEditDetails = scope === 'full'
  const isEdit = mode === 'edit'
  const canEditTeam = canEditDetails || (isEdit && role === 'admin')

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [summary, setSummary] = useState(initialValues?.summary ?? '')
  const [overview, setOverview] = useState(initialValues?.overview ?? '')
  const [cycle, setCycle] = useState(initialValues?.cycle ?? defaultCycle())
  const [semester, setSemester] = useState(String(initialValues?.semester ?? 1))
  const [theme, setTheme] = useState(initialValues?.theme ?? '')
  const [status, setStatus] = useState<string>(initialValues?.status ?? 'em_andamento')
  const [advisorEmail, setAdvisorEmail] = useState(
    initialValues?.advisorEmail ??
      (role === 'professor' ? currentUserEmail : (professors[0]?.email ?? '')),
  )
  const [languages, setLanguages] = useState<string[]>(initialValues?.languages ?? [])
  const [stack, setStack] = useState<string[]>(initialValues?.stack ?? [])
  const [selectedEmails, setSelectedEmails] = useState<string[]>(initialValues?.studentEmails ?? [])
  const [memberTitles, setMemberTitles] = useState<Record<string, string>>(() =>
    (initialValues?.teamMembers ?? []).reduce<Record<string, string>>((titles, member) => {
      if (member.studentEmail && member.roleTitle) {
        titles[member.studentEmail.toLowerCase()] = member.roleTitle
      }
      return titles
    }, {}),
  )
  const [leaderEmail, setLeaderEmail] = useState(
    initialValues?.teamMembers?.find((member) => member.isLeader)?.studentEmail?.toLowerCase() ??
      '',
  )
  const [studentQuery, setStudentQuery] = useState('')
  const [studentNotice, setStudentNotice] = useState('')
  const [tasks, setTasks] = useState<DraftTask[]>([])
  const [repositoryUrl, setRepositoryUrl] = useState(initialValues?.repositoryUrl ?? '')
  const [liveUrl, setLiveUrl] = useState(initialValues?.liveUrl ?? '')
  const [prototypeUrl, setPrototypeUrl] = useState(initialValues?.prototypeUrl ?? '')
  const [extraLinks, setExtraLinks] = useState<DraftLink[]>(
    (initialValues?.extraLinks ?? []).map((link, index) => ({
      key: `initial-link-${index}`,
      ...link,
    })),
  )
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)
  const [error, setError] = useState('')

  const selectedStudents = useMemo(
    () =>
      selectedEmails
        .map((email) => students.find((student) => student.email === email))
        .filter((student): student is ProjectPersonOption => Boolean(student))
        .sort((a, b) => comparePersonNames(a.name, b.name)),
    [selectedEmails, students],
  )

  const suggestions = useMemo(() => {
    const query = normalize(studentQuery)
    if (!query) return []
    return students
      .filter(
        (student) =>
          !selectedEmails.includes(student.email) &&
          normalize(
            `${student.name} ${student.email} ${student.registrationNumber ?? ''}`,
          ).includes(query),
      )
      .sort((a, b) => comparePersonNames(a.name, b.name))
      .slice(0, 6)
  }, [students, selectedEmails, studentQuery])

  const advisor = professors.find((professor) => professor.email === advisorEmail)
  const advisorName = advisor?.name ?? (advisorEmail || currentUserEmail)
  const advisorOptions = professors.map((professor) => ({
    value: professor.email,
    label: professor.name,
  }))
  const responsibleOptions = [
    { value: '', label: 'Todo o grupo' },
    ...selectedStudents.map((student) => ({ value: student.email, label: student.name })),
  ]

  function addStudent(email: string) {
    setSelectedEmails((current) => (current.includes(email) ? current : [...current, email]))
    setStudentQuery('')
    setStudentNotice('')
  }

  function addStudentFromQuery() {
    const query = normalize(studentQuery)
    if (!query) {
      setStudentNotice('Informe o RA, o e-mail ou o nome do aluno.')
      return
    }
    const exact = students.find(
      (student) => student.email === query || normalize(student.registrationNumber ?? '') === query,
    )
    if (exact && selectedEmails.includes(exact.email)) {
      setStudentNotice('Esse aluno já faz parte do grupo.')
      return
    }
    const target = exact ?? (suggestions.length === 1 ? suggestions[0] : undefined)
    if (!target) {
      setStudentNotice(
        suggestions.length > 1
          ? 'Vários alunos encontrados. Escolha um na lista.'
          : 'Nenhum aluno ativo encontrado com esse dado.',
      )
      return
    }
    addStudent(target.email)
  }

  function handleStudentKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addStudentFromQuery()
    }
  }

  function removeStudent(email: string) {
    setSelectedEmails((current) => current.filter((item) => item !== email))
    setMemberTitles((current) => {
      const next = { ...current }
      delete next[email.toLowerCase()]
      return next
    })
    setLeaderEmail((current) => (current === email.toLowerCase() ? '' : current))
    setTasks((current) =>
      current.map((task) =>
        task.targetStudentEmail === email ? { ...task, targetStudentEmail: '' } : task,
      ),
    )
  }

  function addTask() {
    setTasks((current) => [
      ...current,
      { key: newKey('task'), title: '', description: '', targetStudentEmail: '', dueDate: '' },
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

  function addExtraLink() {
    setExtraLinks((current) => [...current, { key: newKey('link'), title: '', url: '' }])
  }

  function updateExtraLink(key: string, changes: Partial<DraftLink>) {
    setExtraLinks((current) =>
      current.map((link) => (link.key === key ? { ...link, ...changes } : link)),
    )
  }

  function removeExtraLink(key: string) {
    setExtraLinks((current) => current.filter((link) => link.key !== key))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')

    if (canEditDetails) {
      if (selectedEmails.length === 0) {
        setError('Atribua pelo menos um aluno ao projeto.')
        return
      }
      if (!advisorEmail) {
        setError('Selecione o professor orientador.')
        return
      }
    }

    const links = {
      repositoryUrl,
      liveUrl,
      prototypeUrl,
      extraLinks: extraLinks
        .filter((link) => link.title.trim() || link.url.trim())
        .map((link) => ({ title: link.title, url: link.url })),
    }

    const details = canEditDetails
      ? {
          title,
          summary,
          overview,
          cycle,
          semester: Number(semester),
          theme,
          status,
          languages,
          stack,
          studentEmails: selectedStudents.map((student) => student.email),
        }
      : {}

    const teamAssignments = canEditTeam
      ? selectedStudents.map((student) => {
          const email = student.email
          return {
            studentEmail: email,
            roleTitle: memberTitles[email.toLowerCase()] ?? '',
            isLeader: leaderEmail === email.toLowerCase(),
          }
        })
      : undefined

    const creation = isEdit
      ? {}
      : {
          advisorEmail,
          tasks: tasks.map((task) => ({
            title: task.title,
            description: task.description,
            targetStudentEmail: task.targetStudentEmail || null,
            dueDate: task.dueDate || null,
          })),
        }

    submittingRef.current = true
    setSaving(true)
    try {
      const response = await fetch(
        isEdit ? `/api/projects/${encodeURIComponent(projectId ?? '')}` : '/api/projects',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            ...details,
            ...links,
            ...(teamAssignments ? { teamAssignments } : {}),
            ...creation,
          }),
        },
      )
      const result = (await response.json().catch(() => null)) as {
        error?: string
        id?: string
      } | null
      if (!response.ok || !result?.id) {
        throw new Error(
          result?.error ??
            (isEdit
              ? 'Não foi possível salvar as alterações do projeto.'
              : 'Não foi possível cadastrar o projeto.'),
        )
      }
      const projectHref = `/projetos/${encodeURIComponent(result.id)}`
      if (isEdit) router.replace(projectHref)
      else router.push(projectHref)
      router.refresh()
    } catch (caught) {
      setError(
        caught instanceof Error && caught.name === 'TimeoutError'
          ? 'A solicitação demorou demais. Verifique sua conexão e tente novamente.'
          : caught instanceof Error
            ? caught.message
            : 'Ocorreu um erro ao salvar o projeto.',
      )
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  const pageTitle = isEdit ? 'Editar Projeto Integrador' : 'Cadastro de Projeto Integrador'
  const pageDescription = !isEdit
    ? 'Preencha as informações, atribua os alunos e, se quiser, já defina as primeiras tarefas.'
    : canEditDetails
      ? 'Atualize as informações do projeto, a equipe, as tecnologias e os artefatos.'
      : 'Como administrador, você pode editar artefatos e funções dos integrantes.'

  return (
    <div className="w-full bg-background px-3 py-4 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 rounded-2xl border border-border bg-white p-3 shadow-sm sm:mb-5 sm:p-6">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <BackButton
              href={backHref}
              replace={isEdit}
              label={isEdit ? 'Voltar ao projeto' : 'Voltar ao painel'}
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Projeto Integrador
              </p>
              <h1 className="mt-1 text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                {pageTitle}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-text-secondary sm:text-sm">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 sm:space-y-5">
          {canEditDetails || (isEdit && role === 'admin') ? (
            <>
              {canEditDetails && (
                <>
                  <FormSection
                    icon="fi-rr-graduation-cap"
                    title="Identificação Acadêmica do PI"
                    subtitle="Eixos curriculares e delimitação institucional do projeto"
                    badge={<Badge tone="slate">Obrigatório</Badge>}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass} htmlFor="project-title">
                          Título completo do projeto integrador <Required />
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
                        <p className={hintClass}>
                          Use títulos concisos com acrônimo inicial quando aplicável e objetivo
                          funcional.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={labelClass} htmlFor="project-course">
                            Curso superior de graduação
                          </label>
                          <input
                            id="project-course"
                            className={fieldClass}
                            value={COURSE_LABEL}
                            readOnly
                          />
                        </div>
                        <div>
                          <span className={labelClass}>
                            Semestre letivo <Required />
                          </span>
                          <SelectDropdown
                            value={semester}
                            ariaLabel="Semestre do projeto"
                            width="full"
                            tone="muted"
                            options={SEMESTER_OPTIONS}
                            onChange={setSemester}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <label className={labelClass} htmlFor="project-cycle">
                            Ciclo <Required />
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
                          <p className={hintClass}>Formato AAAA/1 ou AAAA/2.</p>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="project-theme">
                            Tema <Required />
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
                          <span className={labelClass}>Situação</span>
                          <SelectDropdown
                            value={status}
                            ariaLabel="Situação do projeto"
                            width="full"
                            tone="muted"
                            options={STATUS_OPTIONS}
                            onChange={setStatus}
                          />
                        </div>
                      </div>

                      <div>
                        <span className={labelClass}>
                          Professor(a) orientador(a) do PI <Required />
                        </span>
                        {!isEdit && role === 'admin' ? (
                          professors.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center text-sm text-text-secondary">
                              Nenhum professor ativo cadastrado. Cadastre um professor antes de
                              criar o projeto.
                            </p>
                          ) : (
                            <SelectDropdown
                              value={advisorEmail}
                              ariaLabel="Professor orientador"
                              width="full"
                              tone="muted"
                              options={advisorOptions}
                              onChange={setAdvisorEmail}
                            />
                          )
                        ) : (
                          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3.5 py-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                              {getNameInitials(advisorName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {advisorName}
                              </p>
                              <p className="truncate text-xs text-text-secondary">
                                {advisor?.email ?? advisorEmail}
                              </p>
                            </div>
                          </div>
                        )}
                        {!isEdit && role === 'professor' && (
                          <p className={hintClass}>Você será o orientador deste projeto.</p>
                        )}
                        {isEdit && (
                          <p className={hintClass}>
                            O orientador do projeto não pode ser alterado.
                          </p>
                        )}
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    icon="fi-rr-document"
                    title="Descrição do Projeto"
                    subtitle="Formalização da problemática, solução técnica e impactos"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-end justify-between gap-3">
                          <label className={labelClass} htmlFor="project-summary">
                            Resumo <Required />
                          </label>
                          <span className="mb-1.5 text-[11px] font-semibold text-[#765e58]">
                            {summary.length} / 600 caracteres
                          </span>
                        </div>
                        <textarea
                          id="project-summary"
                          className={textareaClass}
                          value={summary}
                          onChange={(event) => setSummary(event.target.value)}
                          minLength={10}
                          maxLength={600}
                          placeholder="Descreva a problemática e a solução do projeto em poucas linhas."
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-end justify-between gap-3">
                          <label className={labelClass} htmlFor="project-overview">
                            Descrição detalhada{' '}
                            <span className="font-normal text-slate-500">(opcional)</span>
                          </label>
                          <span className="mb-1.5 text-[11px] font-semibold text-[#765e58]">
                            {overview.length} / 5000 caracteres
                          </span>
                        </div>
                        <textarea
                          id="project-overview"
                          className={`${textareaClass} min-h-36`}
                          value={overview}
                          onChange={(event) => setOverview(event.target.value)}
                          maxLength={5000}
                          placeholder="Contexto, problema, objetivos e resultados esperados."
                        />
                      </div>
                    </div>
                  </FormSection>
                </>
              )}

              <FormSection
                icon="fi-rr-users"
                title="Equipe Discente"
                subtitle="Defina um líder e a função opcional de cada integrante."
                badge={
                  <Badge tone="green">
                    {selectedStudents.length}{' '}
                    {selectedStudents.length === 1 ? 'integrante' : 'integrantes'}
                  </Badge>
                }
              >
                {canEditDetails && (
                  <div className="relative">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label className="relative block min-w-0 flex-1">
                        <span className="sr-only">Buscar aluno por RA, nome ou e-mail</span>
                        <i
                          className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#765e58]"
                          aria-hidden="true"
                        />
                        <input
                          value={studentQuery}
                          onChange={(event) => {
                            setStudentQuery(event.target.value)
                            setStudentNotice('')
                          }}
                          onKeyDown={handleStudentKeyDown}
                          placeholder="Informe o RA, o nome ou o e-mail institucional do aluno..."
                          className={`${fieldClass} pl-9`}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={addStudentFromQuery}
                        className="cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                      >
                        <i className="fi fi-rr-user-add flex" aria-hidden="true" /> Adicionar
                        discente
                      </button>
                    </div>

                    {suggestions.length > 0 && (
                      <ul className="mt-2 divide-y divide-border-light overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                        {suggestions.map((student) => (
                          <li key={student.email}>
                            <button
                              type="button"
                              onClick={() => addStudent(student.email)}
                              className="cursor-pointer flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-secondary"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-primary">
                                {getNameInitials(student.name)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold text-slate-900">
                                  {formatPersonName(student.name)}
                                </span>
                                <span className="block truncate text-[11px] text-text-secondary">
                                  {student.registrationNumber
                                    ? `RA ${student.registrationNumber} · `
                                    : ''}
                                  {student.email}
                                </span>
                              </span>
                              <i
                                className="fi fi-rr-plus flex shrink-0 text-sm text-primary"
                                aria-hidden="true"
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {studentNotice && (
                      <p role="status" className="mt-2 text-xs font-semibold text-primary">
                        {studentNotice}
                      </p>
                    )}
                    {students.length === 0 && (
                      <p className={hintClass}>Nenhum aluno ativo cadastrado.</p>
                    )}
                  </div>
                )}

                {!canEditDetails && (
                  <p className={hintClass}>
                    Como administrador, você pode editar a função e o líder dos integrantes
                    existentes, mas não alterar a composição da equipe.
                  </p>
                )}

                {selectedStudents.length > 0 ? (
                  <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {selectedStudents.map((student) => {
                      const normalizedEmail = student.email.toLowerCase()
                      const isLeader = leaderEmail === normalizedEmail
                      const memberRoleId = `member-role-${encodeURIComponent(normalizedEmail)}`

                      return (
                        <li
                          key={student.email}
                          className="min-w-0 rounded-xl border border-border bg-white p-3.5 shadow-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                isLeader ? 'bg-primary text-white' : 'bg-slate-200 text-primary'
                              }`}
                            >
                              {getNameInitials(student.name)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-900">
                                {formatPersonName(student.name)}
                              </span>
                              <span className="block truncate text-[11px] text-text-secondary">
                                {student.registrationNumber
                                  ? `RA: ${student.registrationNumber}`
                                  : student.email}
                              </span>
                              {isLeader && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                                  <i className="fi fi-rr-crown flex" aria-hidden="true" /> Líder do
                                  grupo
                                </span>
                              )}
                            </span>
                            {canEditDetails && (
                              <button
                                type="button"
                                onClick={() => removeStudent(student.email)}
                                aria-label={`Remover ${formatPersonName(student.name)}`}
                                className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-800"
                              >
                                <i
                                  className="fi fi-rr-cross-small flex text-base"
                                  aria-hidden="true"
                                />
                              </button>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                            <div>
                              <label
                                className="mb-1 block text-[11px] font-semibold text-slate-700"
                                htmlFor={memberRoleId}
                              >
                                Função no grupo{' '}
                                <span className="font-normal text-slate-500">(opcional)</span>
                              </label>
                              <input
                                id={memberRoleId}
                                className={`${fieldClass} h-9 text-xs`}
                                value={memberTitles[normalizedEmail] ?? ''}
                                onChange={(event) =>
                                  setMemberTitles((current) => ({
                                    ...current,
                                    [normalizedEmail]: event.target.value,
                                  }))
                                }
                                maxLength={40}
                                placeholder="Ex.: Front-end, UX/UI, Banco de dados"
                              />
                            </div>
                            <button
                              type="button"
                              aria-pressed={isLeader}
                              onClick={() =>
                                setLeaderEmail((current) =>
                                  current === normalizedEmail ? '' : normalizedEmail,
                                )
                              }
                              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                                isLeader
                                  ? 'border-primary bg-primary text-white hover:bg-primary-hover'
                                  : 'border-rose-200 bg-rose-50 text-primary hover:bg-rose-100'
                              }`}
                            >
                              <i
                                className={`fi ${isLeader ? 'fi-rr-crown' : 'fi-rr-star'} flex`}
                                aria-hidden="true"
                              />
                              {isLeader ? 'Líder definido' : 'Definir líder'}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center text-sm text-text-secondary">
                    {canEditDetails
                      ? 'Nenhum aluno atribuído ainda. Busque pelo RA, nome ou e-mail para adicionar.'
                      : 'Nenhum integrante cadastrado neste projeto.'}
                  </p>
                )}
              </FormSection>

              {canEditDetails && (
                <>
                  <FormSection
                    icon="fi-rr-layers"
                    title="Stack Tecnológica"
                    subtitle="Linguagens e ferramentas utilizadas no desenvolvimento"
                  >
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <TagField
                        id="project-languages"
                        label="Linguagens"
                        placeholder="Ex.: TypeScript, Python"
                        values={languages}
                        onChange={setLanguages}
                      />
                      <TagField
                        id="project-stack"
                        label="Stack e ferramentas"
                        placeholder="Ex.: React, Node.js, PostgreSQL"
                        values={stack}
                        onChange={setStack}
                      />
                    </div>
                  </FormSection>

                  {isEdit ? (
                    <FormSection
                      icon="fi-rr-list-check"
                      title="Progressão do Projeto"
                      subtitle="Marcos, entregas e responsáveis"
                    >
                      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-text-secondary">
                          As tarefas e entregas são gerenciadas na seção de progresso da página do
                          projeto, com histórico de revisões.
                        </p>
                        {projectId && (
                          <Link
                            href={`/projetos/${encodeURIComponent(projectId)}`}
                            className={`${textActionClass} shrink-0`}
                          >
                            Abrir página do projeto{' '}
                            <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </FormSection>
                  ) : (
                    <FormSection
                      icon="fi-rr-list-check"
                      title="Progressão do Projeto"
                      subtitle="Marcos e entregas iniciais. Opcional: você pode adicioná-los depois"
                    >
                      {tasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center">
                          <i
                            className="fi fi-rr-document text-xl text-text-muted"
                            aria-hidden="true"
                          />
                          <p className="mt-2 text-sm text-text-secondary">
                            O projeto será criado sem tarefas.
                          </p>
                        </div>
                      ) : (
                        <ol className="space-y-4">
                          {tasks.map((task, index) => (
                            <li
                              key={task.key}
                              className="rounded-xl bg-surface-secondary p-4 ring-1 ring-border sm:p-5"
                            >
                              <div className="mb-4 flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    v{index + 1}.0
                                  </span>
                                  Tarefa {index + 1}
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
                                    Título <Required />
                                  </label>
                                  <input
                                    id={`${task.key}-title`}
                                    className={fieldClass}
                                    value={task.title}
                                    onChange={(event) =>
                                      updateTask(task.key, { title: event.target.value })
                                    }
                                    minLength={3}
                                    maxLength={160}
                                    placeholder="Ex.: Entregar documentação de requisitos"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className={labelClass} htmlFor={`${task.key}-description`}>
                                    Descrição e critérios de entrega <Required />
                                  </label>
                                  <textarea
                                    id={`${task.key}-description`}
                                    className={textareaClass}
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
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <div>
                                    <span className={labelClass}>Responsável pela entrega</span>
                                    <SelectDropdown
                                      value={task.targetStudentEmail}
                                      ariaLabel={`Responsável pela tarefa ${index + 1}`}
                                      width="full"
                                      tone="muted"
                                      options={responsibleOptions}
                                      onChange={(value) =>
                                        updateTask(task.key, { targetStudentEmail: value })
                                      }
                                    />
                                    <p className={hintClass}>
                                      Tarefas individuais ficam visíveis apenas ao aluno
                                      selecionado.
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
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={addTask} className={textActionClass}>
                          <i className="fi fi-rr-plus flex" aria-hidden="true" /> Adicionar tarefa
                        </button>
                      </div>
                    </FormSection>
                  )}
                </>
              )}
            </>
          ) : (
            <section className={sectionClass}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="slate">Somente leitura</Badge>
                <span className="text-xs text-[#765e58]">
                  {initialValues?.semester}º semestre · ciclo {initialValues?.cycle}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {initialValues?.title}
              </h2>
              <p className="mt-1 text-xs text-[#765e58] sm:text-[13px]">
                Orientador: {advisorName}
              </p>
            </section>
          )}

          <FormSection
            icon="fi-rr-folder-open"
            title="Artefatos do Projeto"
            subtitle="Links, imagens e documentos referentes ao projeto"
          >
            <div className="space-y-8">
              <div>
                <ArtifactSubheading
                  title="Links do projeto"
                  description="Endereços HTTPS do código, do sistema publicado e da prototipagem."
                />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div>
                    <label className={labelClass} htmlFor="project-repository">
                      Repositório
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
                  <div>
                    <label className={labelClass} htmlFor="project-live-url">
                      Site no ar
                    </label>
                    <input
                      id="project-live-url"
                      type="url"
                      className={fieldClass}
                      value={liveUrl}
                      onChange={(event) => setLiveUrl(event.target.value)}
                      maxLength={300}
                      placeholder="https://meu-projeto.vercel.app"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="project-prototype-url">
                      Protótipo
                    </label>
                    <input
                      id="project-prototype-url"
                      type="url"
                      className={fieldClass}
                      value={prototypeUrl}
                      onChange={(event) => setPrototypeUrl(event.target.value)}
                      maxLength={300}
                      placeholder="https://www.figma.com/design/..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <ArtifactSubheading
                  title="Outros links"
                  description="Vídeo de apresentação, documentação, artigo ou qualquer endereço relevante."
                />
                {extraLinks.length > 0 && (
                  <ul className="space-y-3">
                    {extraLinks.map((link, index) => (
                      <li
                        key={link.key}
                        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.6fr_auto] md:items-end"
                      >
                        <div>
                          <label className={labelClass} htmlFor={`${link.key}-title`}>
                            Título <Required />
                          </label>
                          <input
                            id={`${link.key}-title`}
                            className={fieldClass}
                            value={link.title}
                            onChange={(event) =>
                              updateExtraLink(link.key, { title: event.target.value })
                            }
                            maxLength={60}
                            placeholder="Insira um título para o link"
                          />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`${link.key}-url`}>
                            Endereço <Required />
                          </label>
                          <input
                            id={`${link.key}-url`}
                            type="url"
                            className={fieldClass}
                            value={link.url}
                            onChange={(event) =>
                              updateExtraLink(link.key, { url: event.target.value })
                            }
                            maxLength={300}
                            placeholder="Insira o endereço web desejado"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExtraLink(link.key)}
                          aria-label={`Remover link adicional ${index + 1}`}
                          className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-800"
                        >
                          <i className="fi fi-rr-trash flex" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={`flex justify-end ${extraLinks.length > 0 ? 'mt-3' : ''}`}>
                  <button type="button" onClick={addExtraLink} className={textActionClass}>
                    <i className="fi fi-rr-plus flex" aria-hidden="true" /> Anexar link
                  </button>
                </div>
              </div>

              <div>
                <ArtifactSubheading
                  title="Imagens do projeto"
                  description="Capturas de tela, banners e fotos que ilustram o projeto."
                  soon
                />
                <UploadSlot
                  icon="fi-rr-picture"
                  title="Envio de imagens indisponível por enquanto"
                  hint="Formatos previstos: PNG, JPG ou WEBP, até 5 MB por imagem."
                  accept="image/png,image/jpeg,image/webp"
                />
              </div>

              <div>
                <ArtifactSubheading
                  title="Arquivos e documentos"
                  description="Proposta, termo de compromisso, documentação técnica e repositório compactado."
                  soon
                />
                <UploadSlot
                  icon="fi-rr-upload"
                  title="Envio de arquivos indisponível por enquanto"
                  hint="Formatos previstos: TXT, PDF, DOC, DOCX ou ZIP, até 25 MB por arquivo."
                  accept=".txt,.pdf,.doc,.docx,.zip"
                />
              </div>
            </div>
          </FormSection>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pb-2 sm:flex-row sm:justify-end">
            <Link
              href={backHref}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || (!isEdit && role === 'admin' && professors.length === 0)}
              className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-65"
            >
              {saving ? (
                <i className="fi fi-rr-spinner flex animate-spin" aria-hidden="true" />
              ) : (
                <i className="fi fi-rr-check flex" aria-hidden="true" />
              )}
              {saving
                ? isEdit
                  ? 'Salvando…'
                  : 'Registrando…'
                : isEdit
                  ? 'Salvar alterações'
                  : 'Registrar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
