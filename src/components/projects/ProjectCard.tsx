import Link from 'next/link'
import type { ListedProject } from '@/application/projects/list-projects'
import { getProjectAdvisors } from '@/domain/enterprise/entities/project-advisors'
import { FavoriteButton } from './FavoriteButton'

const TONE = {
  blue: 'from-slate-200 via-slate-100 to-blue-50',
  red: 'from-rose-100 via-rose-50 to-white',
  slate: 'from-slate-200 to-slate-100',
}

interface ProjectCardProps {
  project: ListedProject
  isAuthenticated?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (projectId: string) => Promise<boolean>
}

export function ProjectCard({
  project: p,
  isAuthenticated = false,
  isFavorite = false,
  onToggleFavorite,
}: ProjectCardProps) {
  const advisors = getProjectAdvisors(p)
  const advisorLabel =
    advisors.length > 1
      ? 'Orientadores'
      : p.advisor.name.startsWith('Profa')
        ? 'Orientadora'
        : 'Orientador'
  const advisorText =
    advisors.length > 1 ? `${p.advisor.name} +${advisors.length - 1}` : p.advisor.name
  const inactive = p.active === false
  const chips = [...new Set([...p.languages, ...p.stack])].slice(0, 4)
  const showFavorite = isAuthenticated && p.status === 'publicado' && Boolean(onToggleFavorite)

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-surface shadow-sm transition hover:shadow-md ${
        p.related ? 'border-primary/30' : 'border-border'
      } ${inactive ? 'opacity-70' : ''}`}
    >
      <div
        className={`relative flex h-[150px] flex-col items-center justify-center gap-2 bg-linear-to-br ${TONE[p.cover.tone]}`}
      >
        <i className={`fi ${p.cover.icon} flex text-3xl text-slate-700`} aria-hidden="true" />
        <span className="px-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          {p.cover.label}
        </span>

        {p.verified && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-accent-light px-2 py-0.5 text-[11px] font-semibold text-secondary-hover border border-accent">
            <i className="fi fi-rr-check-circle flex text-primary" aria-hidden="true" /> PI Indicado
          </span>
        )}

        {inactive ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            <i className="fi fi-rr-eye-crossed flex" aria-hidden="true" /> Desativado
          </span>
        ) : p.status === 'publicado' ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
            <i className="fi fi-rr-flag flex" aria-hidden="true" /> Concluído
          </span>
        ) : p.status === 'em_andamento' ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            <i className="fi fi-rr-clock flex" aria-hidden="true" /> Em andamento
          </span>
        ) : null}

        <span className="absolute bottom-2 left-2 rounded bg-slate-700/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          DSM {p.semester}º Semestre
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
          <span>Ciclo {p.cycle}</span>
          <span className="text-right">
            {advisorLabel}: {advisorText}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-3 text-lg font-semibold leading-snug text-slate-900">
          {p.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {p.summary}
        </p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {chips.map((c) => (
            <li
              key={c}
              className="rounded bg-surface-secondary px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center border-t border-border-light bg-surface-secondary/60">
        <Link
          href={`/projetos/${p.id}`}
          className="flex min-w-0 flex-1 items-center gap-1.5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light/60"
        >
          Ver projeto <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
        </Link>
        {showFavorite && onToggleFavorite && (
          <div className="border-l border-border-light px-2">
            <FavoriteButton
              projectId={p.id}
              projectTitle={p.title}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
              size="sm"
            />
          </div>
        )}
      </div>
    </article>
  )
}
