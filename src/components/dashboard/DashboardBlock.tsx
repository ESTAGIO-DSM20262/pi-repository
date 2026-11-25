import type { ReactNode } from 'react'

export interface DashboardBlockLink {
  id: string
  label: string
  icon: string
}

export function DashboardBlock({
  id,
  title,
  description,
  icon,
  children,
}: {
  id: string
  title: string
  description?: string
  icon: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-label`}
      className="scroll-mt-24 space-y-4 sm:space-y-5"
    >
      <div className="flex items-center gap-3 border-b border-border pb-3.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary-light text-primary"
          aria-hidden="true"
        >
          <i className={`fi ${icon} flex text-lg`} />
        </span>
        <div className="min-w-0">
          <h2
            id={`${id}-label`}
            className="text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[0.8125rem] text-text-secondary sm:text-sm">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 sm:space-y-5">{children}</div>
    </section>
  )
}

export function DashboardGroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="shrink-0 text-sm font-semibold text-slate-700">{children}</p>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  )
}

export function DashboardSectionNav({ links }: { links: DashboardBlockLink[] }) {
  if (links.length < 2) return null

  return (
    <nav
      aria-label="Seções do painel"
      className="scrollbar-x-spaced -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              <i className={`fi ${link.icon} flex text-sm text-primary`} aria-hidden="true" />
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
