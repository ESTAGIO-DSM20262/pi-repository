import type { ReactNode } from 'react'

export type WidgetTone =
  | 'ongoing'
  | 'warning'
  | 'done'
  | 'indicated'
  | 'awaiting'
  | 'pending'
  | 'alert'
  | 'info'
  | 'professor'
  | 'neutral'

interface ToneStyle {
  icon: string
  chip: string
  bar: string
  stroke: string
  dot: string
  value: string
  badge: string
}

const TONE_STYLES: Record<WidgetTone, ToneStyle> = {
  done: {
    icon: 'text-tone-done-ink',
    chip: 'bg-tone-done-soft',
    bar: 'bg-tone-done',
    stroke: 'stroke-tone-done',
    dot: 'bg-tone-done',
    value: 'text-slate-900',
    badge: 'bg-tone-done-soft text-tone-done-ink',
  },
  ongoing: {
    icon: 'text-tone-ongoing-ink',
    chip: 'bg-tone-ongoing-soft',
    bar: 'bg-tone-ongoing',
    stroke: 'stroke-tone-ongoing',
    dot: 'bg-tone-ongoing',
    value: 'text-slate-900',
    badge: 'bg-tone-ongoing-soft text-tone-ongoing-ink',
  },
  indicated: {
    icon: 'text-tone-indicated-ink',
    chip: 'bg-tone-indicated-soft',
    bar: 'bg-tone-indicated',
    stroke: 'stroke-tone-indicated',
    dot: 'bg-tone-indicated',
    value: 'text-slate-900',
    badge: 'bg-tone-indicated-soft text-tone-indicated-ink',
  },
  awaiting: {
    icon: 'text-tone-awaiting-ink',
    chip: 'bg-tone-awaiting-soft',
    bar: 'bg-tone-awaiting',
    stroke: 'stroke-tone-awaiting',
    dot: 'bg-tone-awaiting',
    value: 'text-slate-900',
    badge: 'bg-tone-awaiting-soft text-tone-awaiting-ink',
  },
  pending: {
    icon: 'text-tone-pending-ink',
    chip: 'bg-tone-pending-soft',
    bar: 'bg-tone-pending',
    stroke: 'stroke-tone-pending',
    dot: 'bg-tone-pending',
    value: 'text-slate-900',
    badge: 'bg-tone-pending-soft text-tone-pending-ink',
  },
  info: {
    icon: 'text-tone-info-ink',
    chip: 'bg-tone-info-soft',
    bar: 'bg-tone-info',
    stroke: 'stroke-tone-info',
    dot: 'bg-tone-info',
    value: 'text-slate-900',
    badge: 'bg-tone-info-soft text-tone-info-ink',
  },
  professor: {
    icon: 'text-tone-professor-ink',
    chip: 'bg-tone-professor-soft',
    bar: 'bg-tone-professor',
    stroke: 'stroke-tone-professor',
    dot: 'bg-tone-professor',
    value: 'text-slate-900',
    badge: 'bg-tone-professor-soft text-tone-professor-ink',
  },
  neutral: {
    icon: 'text-tone-neutral-ink',
    chip: 'bg-tone-neutral-soft',
    bar: 'bg-tone-neutral',
    stroke: 'stroke-tone-neutral',
    dot: 'bg-tone-neutral',
    value: 'text-slate-900',
    badge: 'bg-tone-neutral-soft text-tone-neutral-ink',
  },
  warning: {
    icon: 'text-tone-warning-ink',
    chip: 'bg-tone-warning-soft',
    bar: 'bg-tone-warning',
    stroke: 'stroke-tone-warning',
    dot: 'bg-tone-warning',
    value: 'text-tone-warning-ink',
    badge: 'bg-tone-warning-soft text-tone-warning-ink',
  },
  alert: {
    icon: 'text-tone-alert-ink',
    chip: 'bg-tone-alert-soft',
    bar: 'bg-tone-alert',
    stroke: 'stroke-tone-alert',
    dot: 'bg-tone-alert',
    value: 'text-tone-alert-ink',
    badge: 'bg-tone-alert-soft text-tone-alert-ink',
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
  const valueStyles = TONE_STYLES[valueTone ?? tone]

  return (
    <article className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium leading-5 text-text-secondary sm:text-[13px]">{title}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.chip}`}
        >
          <i className={`fi ${icon} flex text-base ${styles.icon}`} aria-hidden="true" />
        </span>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${valueStyles.value}`}>
        {value}
      </p>
      <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-text-secondary">{note}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-light" aria-hidden="true">
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
      className={`min-w-0 rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            <i className={`fi ${icon} flex text-sm text-primary`} aria-hidden="true" />
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-text-secondary sm:text-xs">{subtitle}</p>
          )}
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
            className="stroke-border-light"
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
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
        className="flex h-3 overflow-hidden rounded-full bg-border-light"
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
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-md bg-border-light"
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
            className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-text-secondary"
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
  tone = 'done',
  label,
}: {
  percent: number
  tone?: WidgetTone
  label: string
}) {
  const value = Math.max(0, Math.min(100, percent))

  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-border-light"
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

export function ToneLegend({ items }: { items: Array<{ tone: WidgetTone; label: string }> }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-light pt-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-700">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${TONE_STYLES[item.tone].dot}`}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export function Badge({ tone, children }: { tone: WidgetTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[10px] font-semibold ${TONE_STYLES[tone].badge}`}
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
    return { label: `Atrasada há ${days} ${days === 1 ? 'dia' : 'dias'}`, tone: 'alert' }
  }
  if (daysUntilDue === 0) return { label: 'Vence hoje', tone: 'warning' }
  if (daysUntilDue === 1) return { label: 'Vence amanhã', tone: 'warning' }
  return { label: `Vence em ${daysUntilDue} dias`, tone: daysUntilDue <= 7 ? 'ongoing' : 'pending' }
}
