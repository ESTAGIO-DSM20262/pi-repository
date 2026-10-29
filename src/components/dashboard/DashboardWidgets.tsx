import type { ReactNode } from 'react'

export type WidgetTone = 'red' | 'green' | 'amber' | 'slate'

const TONE_STYLES: Record<
  WidgetTone,
  { icon: string; bar: string; stroke: string; dot: string; value: string }
> = {
  red: {
    icon: 'text-primary',
    bar: 'bg-primary',
    stroke: 'stroke-primary',
    dot: 'bg-primary',
    value: 'text-primary',
  },
  green: {
    icon: 'text-emerald-800',
    bar: 'bg-emerald-700',
    stroke: 'stroke-emerald-700',
    dot: 'bg-emerald-700',
    value: 'text-emerald-800',
  },
  amber: {
    icon: 'text-amber-700',
    bar: 'bg-amber-500',
    stroke: 'stroke-amber-500',
    dot: 'bg-amber-500',
    value: 'text-amber-700',
  },
  slate: {
    icon: 'text-slate-600',
    bar: 'bg-slate-500',
    stroke: 'stroke-slate-400',
    dot: 'bg-slate-400',
    value: 'text-slate-900',
  },
}

export function formatMetric(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('pt-BR') : '—'
}

export function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function StatCard({
  title,
  value,
  note,
  icon,
  tone,
  ratio,
  valueTone,
}: {
  title: string
  value: string
  note: string
  icon: string
  tone: WidgetTone
  ratio: number
  valueTone?: WidgetTone
}) {
  const styles = TONE_STYLES[tone]
  const valueStyles = TONE_STYLES[valueTone ?? (tone === 'green' ? 'green' : 'slate')]

  return (
    <article className="min-w-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium leading-5 text-[#666666] sm:text-[13px]">{title}</p>
        <i className={`fi ${icon} flex shrink-0 text-lg ${styles.icon}`} aria-hidden="true" />
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${valueStyles.value}`}>
        {value}
      </p>
      <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-[#666666]">{note}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-all ${styles.bar}`}
          style={{ width: `${Math.max(0, Math.min(100, ratio))}%` }}
        />
      </div>
    </article>
  )
}

export function Panel({
  title,
  subtitle,
  icon,
  children,
  action,
  className = '',
}: {
  title: string
  subtitle?: string
  icon: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            <i className={`fi ${icon} flex text-sm text-primary`} aria-hidden="true" />
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-[#666666] sm:text-xs">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function EmptyPanelState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center">
      <i className={`fi ${icon} text-lg text-text-muted`} aria-hidden="true" />
      <p className="mt-2 text-xs text-text-secondary">{text}</p>
    </div>
  )
}

export interface ChartSegment {
  label: string
  value: number
  tone: WidgetTone
}

function Legend({ segments }: { segments: ChartSegment[] }) {
  return (
    <ul className="space-y-1.5">
      {segments.map((segment) => (
        <li key={segment.label} className="flex items-center gap-2 text-xs text-slate-700">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_STYLES[segment.tone].dot}`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate">{segment.label}</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {formatMetric(segment.value)}
          </span>
        </li>
      ))}
    </ul>
  )
}

const DONUT_RADIUS = 42
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  ariaLabel,
}: {
  segments: ChartSegment[]
  centerValue: string
  centerLabel: string
  ariaLabel: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const arcs: Array<{ key: string; tone: WidgetTone; length: number; offset: number }> = []
  let accumulated = 0
  for (const segment of segments) {
    if (segment.value <= 0 || total <= 0) continue
    const length = (segment.value / total) * DONUT_CIRCUMFERENCE
    arcs.push({ key: segment.label, tone: segment.tone, length, offset: accumulated })
    accumulated += length
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={ariaLabel}
        >
          <circle
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            fill="none"
            strokeWidth="12"
            className="stroke-slate-100"
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="50"
              cy="50"
              r={DONUT_RADIUS}
              fill="none"
              strokeWidth="12"
              strokeDasharray={`${arc.length} ${DONUT_CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={-arc.offset}
              className={TONE_STYLES[arc.tone].stroke}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-slate-900">{centerValue}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#666666]">
            {centerLabel}
          </span>
        </div>
      </div>
      <div className="min-w-[150px] flex-1">
        <Legend segments={segments} />
      </div>
    </div>
  )
}

export function StackedBar({
  segments,
  ariaLabel,
}: {
  segments: ChartSegment[]
  ariaLabel: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  return (
    <div className="space-y-3">
      <div
        className="flex h-3 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={ariaLabel}
      >
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.label}
              className={TONE_STYLES[segment.tone].bar}
              style={{ width: `${percentOf(segment.value, total)}%` }}
            />
          ))}
      </div>
      <Legend segments={segments} />
    </div>
  )
}

export interface ColumnDatum {
  label: string
  segments: Array<{ value: number; tone: WidgetTone }>
}

export function ColumnChart({
  columns,
  legend,
  ariaLabel,
}: {
  columns: ColumnDatum[]
  legend?: ChartSegment[]
  ariaLabel: string
}) {
  const totals = columns.map((column) =>
    column.segments.reduce((sum, segment) => sum + segment.value, 0),
  )
  const max = Math.max(1, ...totals)

  return (
    <div className="space-y-3">
      <div className="flex h-36 items-end gap-2 sm:gap-3" role="img" aria-label={ariaLabel}>
        {columns.map((column, index) => {
          const total = totals[index] ?? 0
          return (
            <div
              key={column.label}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
            >
              <span className="text-center text-[11px] font-semibold tabular-nums text-slate-700">
                {total > 0 ? total : ''}
              </span>
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-md bg-slate-100"
                style={{ height: total > 0 ? `${(total / max) * 100}%` : '2px' }}
              >
                {column.segments
                  .filter((segment) => segment.value > 0)
                  .map((segment) => (
                    <span
                      key={segment.tone}
                      className={TONE_STYLES[segment.tone].bar}
                      style={{ flexGrow: segment.value, flexBasis: 0 }}
                    />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 sm:gap-3">
        {columns.map((column) => (
          <span
            key={column.label}
            className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-[#666666]"
          >
            {column.label}
          </span>
        ))}
      </div>
      {legend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${TONE_STYLES[item.tone].dot}`}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProgressBar({
  percent,
  tone = 'green',
  label,
}: {
  percent: number
  tone?: WidgetTone
  label: string
}) {
  const value = Math.max(0, Math.min(100, percent))

  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={`h-full rounded-full ${TONE_STYLES[tone].bar}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export function Badge({ tone, children }: { tone: WidgetTone; children: ReactNode }) {
  const styles: Record<WidgetTone, string> = {
    red: 'bg-rose-100 text-rose-900',
    green: 'bg-emerald-100 text-emerald-900',
    amber: 'bg-amber-100 text-amber-900',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[10px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  )
}

export function formatShortDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function describeDueDate(daysUntilDue: number): { label: string; tone: WidgetTone } {
  if (daysUntilDue < 0) {
    const days = Math.abs(daysUntilDue)
    return { label: `Atrasada há ${days} ${days === 1 ? 'dia' : 'dias'}`, tone: 'red' }
  }
  if (daysUntilDue === 0) return { label: 'Vence hoje', tone: 'amber' }
  if (daysUntilDue === 1) return { label: 'Vence amanhã', tone: 'amber' }
  return { label: `Vence em ${daysUntilDue} dias`, tone: daysUntilDue <= 7 ? 'amber' : 'slate' }
}
