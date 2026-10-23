'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ListedProject } from '@/application/projects/list-projects'
import { AdminUsersSection } from '@/components/admin/AdminUsersSection'
import { FavoriteButton } from '@/components/projects/FavoriteButton'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import type { Role } from '@/domain/enterprise/entities/role'
import { formatPersonName } from '@/libs/initials'
import { useProjectFavorites } from '@/libs/useProjectFavorites'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

export interface AdminUserMetrics {
  total: number
  active: number
  inactive: number
  verifiedEmails: number
  newThisMonth: number
  students: number
  professors: number
  admins: number
}

interface RoleDashboardProps {
  currentUserId: string
  name: string
  email: string
  role: Role
  projects: ListedProject[]
  adminUserMetrics?: AdminUserMetrics
}

function formatMetric(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('pt-BR') : '—'
}

function AdminOverviewCards({
  projects,
  userMetrics,
}: {
  projects: ListedProject[]
  userMetrics?: AdminUserMetrics
}) {
  const totalProjects = projects.length
  const verifiedProjects = projects.filter((project) => project.verified).length
  const ongoingProjects = projects.filter((project) => project.status === 'em_andamento').length
  const completedProjects = projects.filter((project) => project.status === 'publicado').length
  const totalUsers = userMetrics?.total ?? 0

  const cards = [
    {
      title: 'Total de Projetos no Acervo',
      value: formatMetric(totalProjects),
      note: `${formatMetric(ongoingProjects)} em andamento · ${formatMetric(completedProjects)} concluídos`,
      icon: 'fi-rr-duplicate',
      tone: 'red',
      ratio: 100,
    },
    {
      title: 'Projetos Verificados',
      value: formatMetric(verifiedProjects),
      note: 'Com verificação institucional',
      icon: 'fi-rr-badge-check',
      tone: 'green',
      ratio: totalProjects ? (verifiedProjects / totalProjects) * 100 : 0,
    },
    {
      title: 'Projetos em Andamento',
      value: formatMetric(ongoingProjects),
      note: 'Com acompanhamento de tarefas',
      icon: 'fi-rr-time-fast',
      tone: 'slate',
      ratio: totalProjects ? (ongoingProjects / totalProjects) * 100 : 0,
    },
    {
      title: 'Projetos Concluídos',
      value: formatMetric(completedProjects),
      note: 'Disponíveis no acervo público',
      icon: 'fi-rr-folder-check',
      tone: 'green',
      ratio: totalProjects ? (completedProjects / totalProjects) * 100 : 0,
    },
    {
      title: 'Usuários Cadastrados',
      value: formatMetric(userMetrics?.total),
      note: `${formatMetric(userMetrics?.newThisMonth)} novos cadastros neste mês`,
      icon: 'fi-rr-users',
      tone: 'slate',
      ratio: 100,
    },
    {
      title: 'Usuários Ativos',
      value: formatMetric(userMetrics?.active),
      note: `${formatMetric(userMetrics?.students)} alunos · ${formatMetric(userMetrics?.professors)} professores`,
      icon: 'fi-rr-user-check',
      tone: 'green',
      ratio: totalUsers ? ((userMetrics?.active ?? 0) / totalUsers) * 100 : 0,
    },
    {
      title: 'Contas Inativas',
      value: formatMetric(userMetrics?.inactive),
      note: 'Sem permissão para acessar o sistema',
      icon: 'fi-rr-user-lock',
      tone: 'red',
      ratio: totalUsers ? ((userMetrics?.inactive ?? 0) / totalUsers) * 100 : 0,
    },
    {
      title: 'E-mails Verificados',
      value: formatMetric(userMetrics?.verifiedEmails),
      note: `${formatMetric(userMetrics?.admins)} contas administrativas`,
      icon: 'fi-rr-shield-check',
      tone: 'green',
      ratio: totalUsers ? ((userMetrics?.verifiedEmails ?? 0) / totalUsers) * 100 : 0,
    },
  ] as const

  const toneStyles = {
    red: { icon: 'text-primary', bar: 'bg-primary' },
    green: { icon: 'text-emerald-800', bar: 'bg-emerald-800' },
    slate: { icon: 'text-slate-600', bar: 'bg-slate-600' },
  }

  return (
    <section aria-labelledby="admin-overview-title" className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
        <h2
          id="admin-overview-title"
          className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Visão geral do sistema
        </h2>
        <p className="mt-1 text-xs text-[#765e58] sm:text-[13px]">
          Indicadores atualizados a partir do acervo demonstrativo e das contas registradas no
          banco.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const tone = toneStyles[card.tone]
          return (
            <article
              key={card.title}
              className="min-w-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium leading-5 text-[#765e58] sm:text-[13px]">
                  {card.title}
                </p>
                <i
                  className={`fi ${card.icon} flex shrink-0 text-lg ${tone.icon}`}
                  aria-hidden="true"
                />
              </div>
              <p
                className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${card.title === 'Contas Inativas' ? 'text-slate-800' : card.tone === 'green' ? 'text-emerald-800' : 'text-slate-900'}`}
              >
                {card.value}
              </p>
              <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-[#765e58]">{card.note}</p>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"
                aria-hidden="true"
              >
                <div
                  className={`h-full rounded-full transition-all ${tone.bar}`}
                  style={{ width: `${Math.max(0, Math.min(100, card.ratio))}%` }}
                />
              </div>
            </article>
          )
        })}
      </div>
      {!userMetrics && (
        <p
          role="status"
          className="rounded-xl border border-border bg-white px-4 py-3 text-xs text-amber-800 shadow-sm"
        >
          Os indicadores de usuários não puderam ser carregados. Atualize o painel ou verifique a
          conexão com o banco de dados.
        </p>
      )}
    </section>
  )
}

const GRID_CLASS = 'grid grid-cols-1 gap-3 xl:grid-cols-2'

function SectionHeading({
  title,
  subtitle,
  icon,
  accent = 'green',
  action,
  className = 'mb-5',
}: {
  title: string
  subtitle: string
  icon: string
  accent?: 'green' | 'slate'
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`${className} flex flex-wrap items-center justify-between gap-3`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-6 w-2 shrink-0 rounded-full ${
            accent === 'green' ? 'bg-emerald-800' : 'bg-slate-600'
          }`}
          aria-hidden="true"
        />
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            <i className={`fi ${icon} flex text-base text-primary`} aria-hidden="true" />
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-[#765e58] sm:text-[13px]">{subtitle}</p>
        </div>
      </div>

      {action}
    </div>
  )
}

function DashboardThumbnail({ label }: { label: string }) {
  return (
    <div
      className="h-[94px] w-[124px] shrink-0 overflow-hidden rounded-md border border-slate-300 bg-slate-300 p-1.5 sm:h-[104px] sm:w-[140px]"
      aria-label={`Prévia ilustrativa: ${label}`}
      role="img"
    >
      <div className="h-full overflow-hidden rounded-[3px] border border-slate-400 bg-white p-1.5 shadow-inner">
        <div className="mb-1.5 flex h-2.5 items-center gap-1 border-b border-slate-200 pb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="h-1 w-8 rounded bg-slate-300" />
          <span className="ml-auto h-1 w-4 rounded bg-slate-200" />
        </div>
        <div className="grid h-[calc(100%_-_12px)] grid-cols-[0.7fr_1.3fr] gap-1">
          <div className="grid grid-cols-2 gap-1">
            <span className="rounded-[2px] bg-emerald-200" />
            <span className="rounded-[2px] bg-rose-200" />
            <span className="rounded-[2px] bg-slate-100" />
            <span className="rounded-[2px] bg-emerald-100" />
            <span className="rounded-[2px] bg-rose-100" />
            <span className="rounded-[2px] bg-slate-100" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-1 items-end gap-1 rounded-[2px] bg-slate-50 px-1 pt-1">
              <span className="h-[40%] flex-1 rounded-t-[1px] bg-emerald-300" />
              <span className="h-[75%] flex-1 rounded-t-[1px] bg-primary/70" />
              <span className="h-[55%] flex-1 rounded-t-[1px] bg-rose-300" />
              <span className="h-[90%] flex-1 rounded-t-[1px] bg-emerald-500/70" />
              <span className="h-[65%] flex-1 rounded-t-[1px] bg-slate-400" />
            </div>
            <div className="flex h-2 gap-1">
              <span className="flex-1 rounded-[1px] bg-slate-200" />
              <span className="flex-1 rounded-[1px] bg-rose-100" />
              <span className="flex-1 rounded-[1px] bg-emerald-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardProjectCard({
  project,
  favorite,
  onToggleFavorite,
}: {
  project: ListedProject
  favorite: boolean
  onToggleFavorite: (projectId: string) => Promise<boolean>
}) {
  const memberCount =
    project.teamMembers?.length ??
    project.publicDetails?.team?.length ??
    project.memberEmails.length
  const isPublished = project.status === 'publicado'

  return (
    <article className="group flex min-w-0 gap-2.5 rounded-xl border border-border bg-white p-2.5 shadow-sm transition-colors hover:bg-surface-secondary sm:gap-3 sm:p-3">
      <DashboardThumbnail label={project.title} />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-medium text-[#765e58] sm:text-[11px]">
            DSM • {project.semester}º Sem
          </span>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
              isPublished ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isPublished ? 'Concluído' : 'Em andamento'}
          </span>
        </div>
        <Link
          href={`/projetos/${project.id}`}
          className="line-clamp-1 text-xs font-bold leading-snug text-slate-900 transition-colors hover:text-primary sm:text-[13px]"
          title={project.title}
        >
          {project.title}
        </Link>
        <p className="line-clamp-1 text-[10px] text-[#765e58] sm:text-[11px]">
          Orientador: {project.advisor.name} <span aria-hidden="true">•</span> {memberCount}{' '}
          {memberCount === 1 ? 'estudante' : 'estudantes'}
        </p>
        <div className="flex items-center justify-between gap-2">
          {isPublished && (
            <FavoriteButton
              projectId={project.id}
              projectTitle={project.title}
              isFavorite={favorite}
              onToggleFavorite={onToggleFavorite}
              size="sm"
            />
          )}
          <Link
            href={`/projetos/${project.id}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:text-primary-hover sm:text-xs"
          >
            Acessar Projeto <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

type ProjectStatusFilter = 'all' | 'em_andamento' | 'publicado'

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function projectStudentNames(project: ListedProject): string {
  const members = project.teamMembers?.length
    ? project.teamMembers
    : (project.publicDetails?.team ?? [])
  return members.map((member) => member.name).join(' ')
}

const SEMESTER_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos os semestres' },
  ...[1, 2, 3, 4, 5, 6].map((semester) => ({
    value: String(semester),
    label: `${semester}º semestre`,
  })),
]

function ProjectFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  semester,
  onSemesterChange,
  cycle,
  onCycleChange,
  cycleOptions,
  onClear,
}: {
  query: string
  onQueryChange: (value: string) => void
  status: ProjectStatusFilter
  onStatusChange: (value: ProjectStatusFilter) => void
  semester: string
  onSemesterChange: (value: string) => void
  cycle: string
  onCycleChange: (value: string) => void
  cycleOptions: Array<{ value: string; label: string; count: number }>
  onClear: () => void
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
      <label className="relative min-w-0 flex-1 lg:max-w-[340px]">
        <span className="sr-only">Buscar projeto por título, orientador, tema ou aluno</span>
        <i
          className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#765e58]"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar por título, orientador, tema ou aluno..."
          className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
        />
      </label>
      <div className="lg:w-[180px]">
        <SelectDropdown
          value={status}
          ariaLabel="Filtrar projetos por situação"
          size="compact"
          tone="muted"
          width="full"
          options={[
            { value: 'all', label: 'Todas as situações' },
            { value: 'em_andamento', label: 'Em andamento' },
            { value: 'publicado', label: 'Concluído' },
          ]}
          onChange={(value) => onStatusChange(value as ProjectStatusFilter)}
        />
      </div>
      <div className="lg:w-[190px]">
        <SelectDropdown
          value={semester}
          ariaLabel="Filtrar projetos por semestre"
          size="compact"
          tone="muted"
          width="full"
          options={SEMESTER_FILTER_OPTIONS}
          onChange={onSemesterChange}
        />
      </div>
      <div className="lg:w-[170px]">
        <SelectDropdown
          value={cycle}
          ariaLabel="Filtrar projetos por ciclo"
          size="compact"
          tone="muted"
          width="full"
          options={[{ value: 'all', label: 'Todos os ciclos' }, ...cycleOptions]}
          onChange={onCycleChange}
        />
      </div>
      <button
        type="button"
        onClick={onClear}
        title="Limpar filtros dos projetos"
        aria-label="Limpar filtros dos projetos"
        className="cursor-pointer inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg bg-[#f2f3f4] text-[#765e58] transition hover:bg-primary-light hover:text-primary lg:self-auto"
      >
        <i className="fi fi-rr-settings-sliders flex" aria-hidden="true" />
      </button>
    </div>
  )
}

function ProjectsSection({
  title,
  subtitle,
  icon,
  projects,
  favoriteIds,
  onToggleFavorite,
  action,
  emptyText,
  filterable = false,
}: {
  title: string
  subtitle: string
  icon: string
  projects: ListedProject[]
  favoriteIds: string[]
  onToggleFavorite: (projectId: string) => Promise<boolean>
  action?: React.ReactNode
  emptyText: string
  filterable?: boolean
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [cycleFilter, setCycleFilter] = useState('all')

  const cycleOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const project of projects) counts.set(project.cycle, (counts.get(project.cycle) ?? 0) + 1)
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.value.localeCompare(a.value))
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (!filterable) return projects
    const normalized = normalizeText(query)
    return projects.filter((project) => {
      const matchesText =
        !normalized ||
        normalizeText(
          `${project.title} ${project.advisor.name} ${project.theme} ${project.summary} ${projectStudentNames(project)}`,
        ).includes(normalized)
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesSemester =
        semesterFilter === 'all' || String(project.semester) === semesterFilter
      const matchesCycle = cycleFilter === 'all' || project.cycle === cycleFilter
      return matchesText && matchesStatus && matchesSemester && matchesCycle
    })
  }, [projects, filterable, query, statusFilter, semesterFilter, cycleFilter])

  const hasActiveFilters =
    query.trim() !== '' ||
    statusFilter !== 'all' ||
    semesterFilter !== 'all' ||
    cycleFilter !== 'all'

  function clearFilters() {
    setQuery('')
    setStatusFilter('all')
    setSemesterFilter('all')
    setCycleFilter('all')
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={action}
        className="mb-5 border-0 bg-transparent p-0 shadow-none"
      />
      {filterable && projects.length > 0 && (
        <>
          <ProjectFilters
            query={query}
            onQueryChange={setQuery}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            semester={semesterFilter}
            onSemesterChange={setSemesterFilter}
            cycle={cycleFilter}
            onCycleChange={setCycleFilter}
            cycleOptions={cycleOptions}
            onClear={clearFilters}
          />
          <p className="mb-3 text-[11px] text-[#765e58]" role="status">
            Exibindo {filteredProjects.length} de {projects.length}{' '}
            {projects.length === 1 ? 'projeto' : 'projetos'}.
          </p>
        </>
      )}
      {filteredProjects.length > 0 ? (
        <div className={GRID_CLASS}>
          {filteredProjects.map((project) => (
            <DashboardProjectCard
              key={project.id}
              project={project}
              favorite={favoriteIds.includes(project.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center">
          <i className="fi fi-rr-folder-open text-xl text-text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm text-text-secondary">
            {projects.length > 0 && hasActiveFilters
              ? 'Nenhum projeto encontrado com esses filtros.'
              : emptyText}
          </p>
          {projects.length > 0 && hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export function RoleDashboard({
  currentUserId,
  name,
  email,
  role,
  projects,
  adminUserMetrics,
}: RoleDashboardProps) {
  const publishedProjects = useMemo(
    () => projects.filter((project) => project.status === 'publicado'),
    [projects],
  )
  const relatedProjects = useMemo(() => projects.filter((project) => project.related), [projects])
  const displayedProjects = role === 'admin' ? projects : relatedProjects
  const firstName =
    formatPersonName(name)
      .split(/\s+/)
      .find((part) => !/^(?:prof\.?|profa\.?|professor|professora|dr\.?|dra\.?)$/i.test(part)) ||
    formatPersonName(name)
  const welcomeName =
    role === 'admin'
      ? 'Administrador'
      : role === 'professor'
        ? `professor ${firstName}`
        : `aluno ${firstName}`
  const {
    favoriteIds,
    toggleFavorite,
    loading: favoritesLoading,
    loadError: favoritesLoadError,
  } = useProjectFavorites(true)
  const favoriteProjects = publishedProjects.filter((project) => favoriteIds.includes(project.id))

  const newProjectAction =
    role !== 'student' ? (
      <Link
        href="/projetos/novo"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white transition hover:bg-primary-hover sm:h-10 sm:px-4"
      >
        <i className="fi fi-rr-plus flex" aria-hidden="true" /> Novo Projeto
      </Link>
    ) : undefined

  return (
    <div className="bg-background">
      <section className="bg-background">
        <div className="mx-auto max-w-[1400px] px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-white text-primary shadow-sm sm:h-12 sm:w-12">
              <i
                className={`fi ${role === 'admin' ? 'fi-rr-shield-check' : role === 'professor' ? 'fi-rr-chalkboard-user' : 'fi-rr-graduation-cap'} flex text-xl`}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
                  Painel institucional
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${role === 'admin' ? 'bg-slate-800 text-white' : role === 'professor' ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'}`}
                >
                  {ROLE_LABEL[role]}
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                Bem-vindo(a), {welcomeName}
              </h1>
              <p className="mt-1 truncate text-xs text-text-secondary sm:text-sm">{email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
        {role === 'admin' && (
          <AdminOverviewCards projects={projects} userMetrics={adminUserMetrics} />
        )}
        {role === 'admin' && <AdminUsersSection currentUserId={currentUserId} />}

        <ProjectsSection
          title={role === 'admin' ? 'Projetos Cadastrados' : 'Seus Projetos'}
          subtitle={
            role === 'admin'
              ? 'Projetos registrados no sistema'
              : role === 'professor'
                ? 'Projetos onde você é orientador ou colaborador'
                : 'Projetos onde você é um colaborador'
          }
          icon="fi-rr-folder-open"
          projects={displayedProjects}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          action={newProjectAction}
          filterable={role !== 'student'}
          emptyText={
            role === 'admin'
              ? 'Ainda não há projetos cadastrados no acervo.'
              : 'Nenhum projeto está vinculado a esta conta ainda.'
          }
        />

        <ProjectsSection
          title="Favoritos"
          subtitle="Projetos que você salvou na sua conta"
          icon="fi-rr-star"
          projects={favoriteProjects}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          emptyText={
            favoritesLoading
              ? 'Carregando seus favoritos...'
              : favoritesLoadError
                ? `Não foi possível carregar seus favoritos: ${favoritesLoadError}`
                : 'Você ainda não marcou projetos como favoritos. Use a estrela nos cards para guardar referências.'
          }
        />

        {role === 'admin' && (
          <p className="rounded-xl border border-border bg-white px-4 py-3 text-center text-[10px] text-text-muted shadow-sm">
            Usuários, permissões e projetos cadastrados são gerenciados no banco. Os projetos
            demonstrativos do acervo continuam sendo exibidos junto com os novos cadastros.
          </p>
        )}
      </div>
    </div>
  )
}
