import type { ReactNode } from 'react'

export const fieldClass =
  'block h-10 w-full rounded-lg border border-border bg-surface-secondary px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 read-only:cursor-not-allowed read-only:text-slate-500'
export const labelClass = 'mb-1.5 block text-xs font-bold text-slate-800'
export const hintClass = 'mt-1.5 text-[11px] leading-relaxed text-[#765e58]'
export const sectionClass = 'rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-7'

export function FormSection({
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

export function Badge({ tone, children }: { tone: 'slate' | 'green'; children: ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone === 'green' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}
    >
      {children}
    </span>
  )
}

export function Required() {
  return <span className="text-primary">*</span>
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
      {message}
    </p>
  )
}
