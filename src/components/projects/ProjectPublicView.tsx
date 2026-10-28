import Link from 'next/link'
import { ProjectAdminControls } from '@/components/projects/ProjectAdminControls'
import { ProjectFavoriteAction } from '@/components/projects/ProjectFavoriteAction'
import { ProjectImageGallery } from '@/components/projects/ProjectImageGallery'
import {
  ProjectVerificationButton,
  ProjectVerificationPanel,
} from '@/components/projects/ProjectVerificationPanel'
import { ProjectProgressSection } from '@/components/projects/progress/ProjectProgressSection'
import { BackButton } from '@/components/ui/BackButton'
import type {
  Project,
  ProjectAdvisor,
  ProjectTeamMember,
  ProjectTechnologyGroup,
} from '@/domain/enterprise/entities/project'
import { getProjectAdvisors, isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import { resolveProjectLinkIcon } from '@/domain/enterprise/entities/project-details'
import type { ProjectVerificationSummary } from '@/domain/enterprise/entities/project-verification'
import { comparePersonNames, formatPersonName, getNameInitials } from '@/libs/initials'
import { getSafeSocialProfileUrl } from '@/presentation/profile/social-profile-url'

interface ProjectPublicViewProps {
  project: Project
  isAuthenticated: boolean
  canManageProgress: boolean
  showProjectProgress: boolean
  canEditProject?: boolean
  canVerify?: boolean
  canManageActivation?: boolean
  verification?: ProjectVerificationSummary | null
  viewerEmail?: string | null
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.31-3.76-1.31-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.62 5.23-5.11 5.51.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.37 4.28 5.46v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V8.99h3.56v11.46ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.44c.98 0 1.79-.77 1.79-1.73V1.73C24 .77 23.19 0 22.21 0Z" />
    </svg>
  )
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
      <i className={`fi ${icon} flex text-base text-primary`} aria-hidden="true" />
      {children}
    </h2>
  )
}

function DashboardPreview() {
  return (
    <div
      className="h-full min-h-[210px] overflow-hidden rounded-md border border-slate-300 bg-slate-100 p-2.5 sm:min-h-[230px]"
      role="img"
      aria-label="Ilustração representativa do painel de agendamento de laboratórios"
    >
      <div className="flex h-full min-h-[190px] overflow-hidden rounded bg-white shadow-sm">
        <aside className="flex w-8 shrink-0 flex-col items-center gap-2 bg-slate-900 py-3 sm:w-10">
          <span className="h-4 w-4 rounded-sm bg-primary" />
          <span className="h-1.5 w-4 rounded bg-white/70" />
          <span className="h-1.5 w-4 rounded bg-white/30" />
          <span className="h-1.5 w-4 rounded bg-white/30" />
          <span className="h-1.5 w-4 rounded bg-white/30" />
        </aside>
        <div className="min-w-0 flex-1 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <div className="h-2 w-24 rounded bg-slate-700 sm:w-32" />
              <div className="mt-1.5 h-1.5 w-16 rounded bg-slate-200 sm:w-20" />
            </div>
            <span className="rounded bg-emerald-100 px-1.5 py-1 text-[7px] font-bold text-emerald-800 sm:text-[8px]">
              PAINEL DSM
            </span>
          </div>
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {[
              ['LABORATÓRIOS', '08'],
              ['RESERVAS HOJE', '24'],
              ['DISPONÍVEIS', '05'],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-slate-200 bg-slate-50 p-1.5">
                <div className="truncate text-[6px] font-semibold text-slate-500 sm:text-[7px]">
                  {label}
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-800 sm:text-sm">{value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1.45fr_1fr] gap-2">
            <div className="rounded border border-slate-200 p-1.5">
              <div className="mb-1.5 h-1.5 w-14 rounded bg-slate-500" />
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 25 }, (_, index) => ({
                  id: `preview-cell-${index + 1}`,
                  index,
                })).map(({ id, index }) => (
                  <span
                    key={id}
                    className={`h-3 rounded-[2px] ${
                      [1, 2, 6, 7, 12, 17, 18, 22].includes(index)
                        ? 'bg-rose-200'
                        : [4, 9, 14, 19, 24].includes(index)
                          ? 'bg-emerald-200'
                          : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded border border-slate-200 p-1.5">
              <div className="h-1.5 w-12 rounded bg-slate-500" />
              <div className="flex h-12 items-end gap-1 border-b border-slate-100 px-1">
                {[35, 65, 45, 82, 58, 95, 70].map((height) => (
                  <span
                    key={height}
                    className="flex-1 rounded-t-[2px] bg-red-700/80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-1">
                <span className="h-1.5 w-5 rounded bg-slate-200" />
                <span className="h-1.5 w-7 rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-right text-[7px] text-slate-400 sm:text-[8px]">
            Prévia ilustrativa da interface
          </p>
        </div>
      </div>
    </div>
  )
}

function TeamMemberRow({ member }: { member: ProjectTeamMember }) {
  const displayName = formatPersonName(member.name)
  const initials = getNameInitials(displayName)
  const githubUrl = getSafeSocialProfileUrl(member.githubUrl, 'github')
  const linkedinUrl = getSafeSocialProfileUrl(member.linkedinUrl, 'linkedin')

  return (
    <li className="flex min-w-0 items-center gap-2.5 py-1.5 sm:gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          member.isLeader ? 'bg-primary text-white' : 'bg-slate-200 text-primary'
        }`}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-900 sm:text-sm">
          {displayName}
        </p>
        {(member.isLeader || member.roleTitle) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {member.isLeader && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary-light px-1.5 py-0.5 text-[10px] font-bold text-primary">
                <i className="fi fi-rr-crown flex" aria-hidden="true" /> Líder
              </span>
            )}
            {member.roleTitle && (
              <span className="inline-flex max-w-full items-center rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                <span className="truncate">{member.roleTitle}</span>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[#6f514b]">
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir GitHub de ${displayName}`}
            aria-label={`GitHub de ${displayName}`}
            className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <GithubIcon />
          </a>
        )}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir LinkedIn de ${displayName}`}
            aria-label={`LinkedIn de ${displayName}`}
            className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LinkedInIcon />
          </a>
        )}
      </div>
    </li>
  )
}

function TechnologyGroupCard({ group }: { group: ProjectTechnologyGroup }) {
  return (
    <section className="rounded-lg border-0 bg-transparent p-0 md:border md:border-slate-300 md:bg-slate-50/70 md:p-3">
      <h3 className="flex items-center gap-1.5 text-[12px] font-bold text-slate-800 sm:text-[13px]">
        <i className={`fi ${group.icon} flex text-xs text-primary`} aria-hidden="true" />
        {group.title}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {group.items.map((item) => (
          <li
            key={item}
            className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px] leading-none text-slate-800 sm:text-xs"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function AdvisorLinks({
  advisor,
  stacked = false,
}: {
  advisor: ProjectAdvisor
  stacked?: boolean
}) {
  const githubUrl = getSafeSocialProfileUrl(advisor.githubUrl, 'github')
  const linkedinUrl = getSafeSocialProfileUrl(advisor.linkedinUrl, 'linkedin')
  const separator = (
    <span className="hidden shrink-0 text-slate-400 sm:inline" aria-hidden="true">
      /
    </span>
  )

  const links = (
    <>
      {githubUrl && (
        <>
          {!stacked && separator}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir GitHub de ${advisor.name}`}
            aria-label={`GitHub de ${advisor.name}`}
            className="inline-flex shrink-0 items-center gap-1 text-slate-600 transition hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <GithubIcon />
            <span className={stacked ? '' : 'hidden sm:inline'}>GitHub</span>
          </a>
        </>
      )}
      {linkedinUrl && (
        <>
          {!stacked && separator}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir LinkedIn de ${advisor.name}`}
            aria-label={`LinkedIn de ${advisor.name}`}
            className="inline-flex shrink-0 items-center gap-1 text-slate-600 transition hover:text-[#0a66c2] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LinkedInIcon />
            <span className={stacked ? '' : 'hidden sm:inline'}>LinkedIn</span>
          </a>
        </>
      )}
    </>
  )

  if (stacked) {
    return (
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {getNameInitials(advisor.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-bold leading-snug text-slate-900 md:text-[13px]">
            {formatPersonName(advisor.name)}
          </p>
          {(githubUrl || linkedinUrl) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] md:text-xs">
              {links}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-1 text-[11px] leading-snug sm:gap-1.5 sm:text-xs md:text-[13px]">
      <span className="min-w-0 flex-1 truncate font-bold text-slate-900">
        {formatPersonName(advisor.name)}
      </span>
      {links}
    </div>
  )
}

function getTeamMemberKey(member: ProjectTeamMember) {
  const email = member.studentEmail?.trim().toLocaleLowerCase('pt-BR')
  if (email) return email

  return [
    member.name.trim().toLocaleLowerCase('pt-BR'),
    member.roleTitle?.trim().toLocaleLowerCase('pt-BR') ?? '',
    member.githubUrl?.trim().toLocaleLowerCase('pt-BR') ?? '',
    member.linkedinUrl?.trim().toLocaleLowerCase('pt-BR') ?? '',
    member.isLeader ? 'leader' : 'member',
  ].join('::')
}

function ExternalProjectLink({ label, url, icon }: { label: string; url?: string; icon?: string }) {
  const className =
    'flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5 sm:text-[13px]'
  const iconElement = (
    <i
      className={`fi ${resolveProjectLinkIcon({ label, icon })} flex text-xs`}
      aria-hidden="true"
    />
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={className}>
        {iconElement} {label} <span aria-hidden="true">↗</span>
      </a>
    )
  }

  return (
    <span
      title="Link externo ainda não cadastrado"
      className={`${className} cursor-not-allowed opacity-80`}
    >
      {iconElement} {label} <span aria-hidden="true">↗</span>
      <span className="sr-only">, endereço não cadastrado</span>
    </span>
  )
}

export function ProjectPublicView({
  project,
  isAuthenticated,
  canManageProgress,
  showProjectProgress,
  canEditProject = false,
  canVerify = false,
  canManageActivation = false,
  verification = null,
  viewerEmail = null,
}: ProjectPublicViewProps) {
  const details = project.publicDetails
  const team = project.teamMembers?.length ? project.teamMembers : (details?.team ?? [])
  const sortedTeam = [...team].sort((a, b) => comparePersonNames(a.name, b.name))
  const technologyGroups = details?.technologyGroups?.length
    ? details.technologyGroups
    : [
        {
          title: 'Tecnologias utilizadas',
          icon: 'fi-rr-layers',
          items: [...project.stack, ...project.languages].filter(
            (value, index, list) => list.indexOf(value) === index,
          ),
        },
      ]
  const images = details?.images ?? []
  const advisors = getProjectAdvisors(project)
  const active = isProjectActive(project)
  const externalLinks = details?.externalLinks ?? []
  const courseLabel = details?.courseLabel ?? `DSM — ${project.semester}º Semestre`
  const summary = project.summary
  const progressMembers = project.memberEmails
    .map((email) => {
      const normalizedEmail = email.trim().toLowerCase()
      const matchingMember = team.find(
        (member) => member.studentEmail?.trim().toLowerCase() === normalizedEmail,
      )
      return { email: normalizedEmail, name: matchingMember?.name ?? email }
    })
    .sort((a, b) => comparePersonNames(a.name, b.name))

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-6 sm:py-8 lg:px-6">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3 sm:mb-6">
        <BackButton />
        <nav
          aria-label="Caminho de navegação"
          className="flex min-w-0 items-center gap-1.5 text-xs sm:text-[13px]"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1 text-slate-500 transition hover:text-primary"
          >
            <i className="fi fi-rr-home flex" aria-hidden="true" /> Início
          </Link>
          <i
            className="fi fi-rr-angle-small-right flex shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <span className="truncate font-semibold text-slate-800">{project.title}</span>
        </nav>
        {(canEditProject || canVerify || canManageActivation) && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {canManageActivation && <ProjectAdminControls projectId={project.id} active={active} />}
            {canVerify && verification && (
              <ProjectVerificationButton
                projectId={project.id}
                summary={verification}
                viewerEmail={viewerEmail}
              />
            )}
            {canEditProject && (
              <Link
                href={`/projetos/${encodeURIComponent(project.id)}/editar`}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                <i className="fi fi-rr-pencil flex" aria-hidden="true" /> Editar projeto
              </Link>
            )}
          </div>
        )}
      </div>

      {!active && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800"
        >
          <i className="fi fi-rr-eye-crossed flex" aria-hidden="true" />
          Projeto desativado: ele fica oculto para todos, exceto administradores.
        </p>
      )}

      <section className="rounded-xl border border-white bg-white p-4 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          {project.verified ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-900 sm:text-[11px]">
              <i className="fi fi-rr-check-circle flex" aria-hidden="true" /> Indicado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 sm:text-[11px]">
              <i className="fi fi-rr-info flex" aria-hidden="true" /> Não indicado
            </span>
          )}
          <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-800 sm:text-[11px]">
            {project.theme}
          </span>
          <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-800 sm:text-[11px]">
            {courseLabel}
          </span>
        </div>

        <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <h1 className="w-full text-[25px] font-bold leading-tight tracking-tight text-[#191d1f] sm:min-w-0 sm:flex-1 sm:w-auto sm:text-3xl lg:max-w-[850px] lg:text-4xl">
            {project.title}
          </h1>
          {isAuthenticated && project.status === 'publicado' && (
            <ProjectFavoriteAction
              projectId={project.id}
              projectTitle={project.title}
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600 sm:hidden">{summary}</p>

        <div
          className={`mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 md:flex md:gap-5 ${advisors.length > 1 ? 'md:items-start' : 'md:items-center'} md:rounded-lg md:border md:border-slate-300 md:bg-slate-50 md:px-3 md:py-2`}
        >
          {advisors.length > 1 ? (
            <div className="col-span-2 min-w-0 rounded-lg border border-slate-300 bg-slate-50 p-2.5 md:flex-1 md:border-0 md:bg-transparent md:p-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
                Orientadores
              </p>
              <ul className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {advisors.map((advisor) => (
                  <li
                    key={advisor.email}
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-2.5"
                  >
                    <AdvisorLinks advisor={advisor} stacked />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex min-h-[62px] min-w-0 items-center rounded-lg border border-slate-300 bg-slate-50 p-2 md:flex md:flex-1 md:gap-2.5 md:border-0 md:bg-transparent md:p-0">
              <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white md:flex">
                {getNameInitials(project.advisor.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  Orientador
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {advisors.map((advisor) => (
                    <li key={advisor.email} className="min-w-0">
                      <AdvisorLinks advisor={advisor} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="flex min-h-[62px] items-center rounded-lg border border-slate-300 bg-slate-50 p-2 md:flex md:min-w-[190px] md:gap-2.5 md:border-l md:border-y-0 md:border-r-0 md:rounded-none md:bg-transparent md:py-0 md:pl-5 md:pr-0">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-primary md:flex">
              <i className="fi fi-rr-calendar flex" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
                Período
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-slate-900 sm:text-xs md:text-[13px]">
                {project.cycle}
              </p>
            </div>
          </div>
        </div>
      </section>

      {verification && (
        <div className="mt-5">
          <ProjectVerificationPanel
            summary={verification}
            showProgress={canVerify || canEditProject}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="hidden rounded-xl border border-white bg-white p-5 shadow-sm lg:block lg:p-6">
          <SectionTitle icon="fi-rr-align-left">Visão Geral</SectionTitle>
          <div
            className={`mt-3 grid grid-cols-1 gap-3 ${images.length === 0 ? 'xl:grid-cols-2' : ''}`}
          >
            <p className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-[13px] leading-relaxed text-[#6f514b]">
              {details?.overview ?? summary}
            </p>
            {images.length === 0 && <DashboardPreview />}
          </div>
        </section>

        <section className="rounded-xl border border-white bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle icon="fi-rr-users">Equipe de Desenvolvimento</SectionTitle>
            <span className="shrink-0 text-[10px] font-semibold text-[#6f514b] sm:text-[11px]">
              {team.length} {team.length === 1 ? 'integrante' : 'integrantes'}
            </span>
          </div>
          {team.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {sortedTeam.map((member) => (
                <TeamMemberRow key={getTeamMemberKey(member)} member={member} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
              Os integrantes da equipe ainda não foram cadastrados para exibição pública.
            </p>
          )}
        </section>
      </div>

      {showProjectProgress && isAuthenticated && (
        <ProjectProgressSection
          projectId={project.id}
          projectTitle={project.title}
          projectStatus={project.status}
          canManage={canManageProgress}
          members={progressMembers}
        />
      )}

      {images.length > 0 && (
        <section className="mt-5 rounded-xl border border-white bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <SectionTitle icon="fi-rr-picture">Imagens do Projeto</SectionTitle>
          <div className="mt-3">
            <ProjectImageGallery images={images} />
          </div>
        </section>
      )}

      <section className="mt-5 rounded-xl border border-white bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <SectionTitle icon="fi-rr-layers">Tecnologias Utilizadas</SectionTitle>
        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 sm:gap-y-4">
          {technologyGroups.map((group) => (
            <TechnologyGroupCard key={group.title} group={group} />
          ))}
        </div>
      </section>

      {externalLinks.length > 0 && (
        <section className="mt-5 rounded-xl border border-white bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <SectionTitle icon="fi-rr-folder-open">Artefatos do Projeto</SectionTitle>
          <h3 className="mb-2.5 mt-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 sm:text-xs">
            Links externos
          </h3>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {externalLinks.map((link) => (
              <li key={`${link.label}-${link.url ?? ''}`}>
                <ExternalProjectLink label={link.label} url={link.url} icon={link.icon} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
