'use client'

import { useEffect, useRef } from 'react'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import {
  type Chip,
  EMPTY_FILTERS,
  type Facets,
  type Filters,
  type SortKey,
  toggleValue,
} from '@/presentation/projects/project-filters'

interface FilterPanelProps {
  facets: Facets
  filters: Filters
  onChange: (partial: Partial<Filters>) => void
  open: boolean
  onToggle: () => void
  activeCount: number
  chips: Chip[]
  onRemoveChip: (id: string) => void
  sort: SortKey
  onSort: (sort: SortKey) => void
  total: number
  onClear: () => void
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 min-w-0 overflow-visible">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-900">{title}</h3>
      <div className="space-y-2 overflow-visible">{children}</div>
    </section>
  )
}

function CheckRow({
  label,
  checked,
  onChange,
  count,
}: {
  label: string
  checked: boolean
  onChange: () => void
  count?: number
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer rounded accent-primary"
      />
      <span className={checked ? 'font-semibold text-primary' : ''}>{label}</span>
      {count !== undefined && (
        <span className="ml-auto shrink-0 text-xs text-text-muted">{count}</span>
      )}
    </label>
  )
}

const RAIL = [
  {
    icon: 'fi-rr-shield-check',
    title: 'Indicação',
    active: (f: Filters) => f.verified || f.unverified,
    on: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: 'fi-rr-calendar',
    title: 'Semestre letivo',
    active: (f: Filters) => f.cycle !== '',
    on: 'bg-primary-light text-primary',
  },
  {
    icon: 'fi-rr-layers',
    title: 'Semestre DSM',
    active: (f: Filters) => f.semesters.length > 0,
    on: 'bg-primary-light text-primary',
  },
  {
    icon: 'fi-rr-code-simple',
    title: 'Tecnologias',
    active: (f: Filters) => f.stack.length > 0 || f.languages.length > 0,
    on: 'bg-primary-light text-primary',
  },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Mais Recentes' },
  { value: 'old', label: 'Mais Antigos' },
  { value: 'az', label: 'A - Z' },
  { value: 'popular', label: 'Mais Acessados' },
]

function FilterFields({
  facets,
  filters = EMPTY_FILTERS,
  onChange,
}: Pick<FilterPanelProps, 'facets' | 'filters' | 'onChange'>) {
  return (
    <>
      <div className="mt-5 space-y-3 rounded-lg bg-surface-secondary p-3.5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => onChange({ verified: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-700"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <i className="fi fi-rr-check-circle flex text-emerald-700" aria-hidden="true" />
              Apenas PIs Indicados
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">
              Revisados e aprovados como referência técnica.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-slate-700">
          <input
            type="checkbox"
            checked={filters.unverified}
            onChange={(e) => onChange({ unverified: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          />
          <span>Não indicados / Em andamento</span>
        </label>
      </div>

      <Group title="Semestre letivo">
        <SelectDropdown
          ariaLabel="Semestre letivo"
          value={filters.cycle}
          onChange={(cycle) => onChange({ cycle })}
          options={[
            { value: '', label: 'Todos os semestres letivos' },
            ...facets.cycles.map((option) => ({
              value: option.value,
              label: option.value,
              count: option.count,
            })),
          ]}
        />
      </Group>

      <Group title="Matriz & semestre DSM">
        {facets.semesters.map((o) => (
          <CheckRow
            key={o.value}
            label={`DSM ${o.value}º Semestre`}
            count={o.count}
            checked={filters.semesters.includes(o.value)}
            onChange={() => onChange({ semesters: toggleValue(filters.semesters, o.value) })}
          />
        ))}
      </Group>

      <Group title="Frameworks & libs">
        <div className="flex flex-wrap gap-1.5">
          {facets.stack.map((o) => {
            const active = filters.stack.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ stack: toggleValue(filters.stack, o.value) })}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-surface-secondary text-slate-700 hover:bg-primary-light'
                }`}
              >
                {o.value}
                {active && <i className="fi fi-rr-check flex text-[10px]" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Linguagens">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {facets.languages.map((o) => (
            <CheckRow
              key={o.value}
              label={o.value}
              checked={filters.languages.includes(o.value)}
              onChange={() => onChange({ languages: toggleValue(filters.languages, o.value) })}
            />
          ))}
        </div>
      </Group>

      <Group title="Eixo temático">
        {facets.themes.map((o) => (
          <CheckRow
            key={o.value}
            label={o.value}
            checked={filters.themes.includes(o.value)}
            onChange={() => onChange({ themes: toggleValue(filters.themes, o.value) })}
          />
        ))}
      </Group>

      <Group title="Orientação docente">
        <SelectDropdown
          ariaLabel="Orientação docente"
          value={filters.advisor}
          onChange={(advisor) => onChange({ advisor })}
          options={[
            { value: '', label: 'Todos os orientadores' },
            ...facets.advisors.map((advisor) => ({
              value: advisor.value,
              label: advisor.label,
              count: advisor.count,
            })),
          ]}
        />
      </Group>
    </>
  )
}

export function FilterPanel({
  facets,
  filters: filtersProp,
  onChange,
  open,
  onToggle,
  activeCount,
  chips,
  onRemoveChip,
  sort,
  onSort,
  total,
  onClear,
}: FilterPanelProps) {
  const filters = filtersProp ?? EMPTY_FILTERS
  const dialogRef = useRef<HTMLElement>(null)
  const onToggleRef = useRef(onToggle)
  const dragStartY = useRef<number | null>(null)
  const draggedHandle = useRef(false)
  onToggleRef.current = onToggle

  useEffect(() => {
    if (!open || window.matchMedia('(min-width: 1280px)').matches) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(frame)
    }
  }, [open])

  const badge = activeCount > 0 && (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
      {activeCount}
    </span>
  )

  return (
    <>
      <div className="flex h-11 min-w-0 items-center gap-2 xl:hidden">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <i className="fi fi-rr-filter flex" aria-hidden="true" /> Filtros {badge}
        </button>

        {chips.length > 0 && (
          <div className="active-filter-chip-scroll flex h-11 min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className={`inline-flex h-11 max-w-[220px] shrink-0 items-center gap-1 rounded-md border px-3 text-xs ${
                  chip.verified
                    ? 'border-emerald-200 bg-emerald-100 font-medium text-emerald-900'
                    : 'border-border bg-surface text-slate-800'
                }`}
              >
                {chip.verified && (
                  <i
                    className="fi fi-rr-check-circle flex shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                )}
                <span className="max-w-40 truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip.id)}
                  aria-label={`Remover filtro ${chip.label}`}
                  className="flex shrink-0 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100"
                >
                  <i className="fi fi-rr-cross-small flex text-base" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className={`relative hidden min-h-[440px] shrink-0 overflow-visible transition-[width] duration-300 ease-out xl:block ${
          open ? 'w-[300px]' : 'w-16'
        }`}
      >
        <aside
          aria-hidden={!open}
          inert={!open}
          className={`w-[300px] rounded-xl border border-border bg-surface p-5 shadow-sm transition-[opacity,transform] duration-200 ease-out ${
            open
              ? 'relative translate-x-0 opacity-100'
              : 'pointer-events-none absolute left-0 top-0 -translate-x-3 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label="Ocultar filtros"
            className="absolute right-0 top-0 flex h-10 w-12 cursor-pointer items-center justify-center rounded-bl-xl rounded-tr-xl bg-primary text-white transition-colors hover:bg-primary-hover"
          >
            <i className="fi fi-rr-angle-small-left flex text-xl" aria-hidden="true" />
          </button>

          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <i className="fi fi-rr-filter flex text-primary" aria-hidden="true" /> Filtros de Busca
          </h2>
          <FilterFields facets={facets} filters={filters} onChange={onChange} />
        </aside>

        <div
          aria-hidden={open}
          inert={open}
          className={`flex min-h-[460px] w-16 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-[opacity,transform] duration-200 ease-out ${
            open
              ? 'pointer-events-none absolute left-0 top-0 -translate-x-2 opacity-0'
              : 'relative translate-x-0 opacity-100'
          }`}
        >
          <div className="flex flex-1 flex-col items-center gap-3 px-3 pt-4">
            <button
              type="button"
              onClick={onToggle}
              title="Mostrar filtros"
              aria-label="Mostrar filtros"
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border text-slate-600 transition-colors hover:border-primary hover:text-primary"
            >
              <i className="fi fi-rr-filter flex" aria-hidden="true" />
              {activeCount > 0 && <span className="absolute -right-1.5 -top-1.5">{badge}</span>}
            </button>

            {RAIL.map((item) => (
              <button
                key={item.icon}
                type="button"
                onClick={onToggle}
                title={item.title}
                aria-label={item.title}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-primary-light hover:text-primary ${
                  item.active(filters ?? EMPTY_FILTERS)
                    ? item.on
                    : 'bg-surface-secondary text-slate-500'
                }`}
              >
                <i className={`fi ${item.icon} flex text-sm`} aria-hidden="true" />
              </button>
            ))}

            <span className="mt-3 rotate-180 text-[11px] font-semibold uppercase tracking-widest text-text-muted [writing-mode:vertical-rl]">
              Filtros ocultos
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-label="Mostrar filtros"
            className="flex h-12 w-full cursor-pointer items-center justify-center rounded-t-xl bg-primary text-white transition-colors hover:bg-primary-hover"
          >
            <i className="fi fi-rr-angle-small-right flex text-xl" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-0 z-[70] transition-[visibility] duration-300 xl:hidden ${
          open ? 'visible' : 'invisible delay-300'
        }`}
      >
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={onToggle}
          tabIndex={open ? 0 : -1}
          className={`absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <section
          ref={dialogRef}
          role="dialog"
          aria-modal={open}
          aria-labelledby="mobile-filters-title"
          tabIndex={-1}
          className={`absolute inset-x-2 bottom-0 top-5 flex min-h-0 flex-col rounded-t-2xl border-x border-t border-border bg-surface outline-none shadow-2xl transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:inset-x-3 ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="shrink-0 px-6 pt-1.5">
            <button
              type="button"
              aria-label="Arraste para baixo ou toque para fechar os filtros"
              tabIndex={open ? 0 : -1}
              onPointerDown={(event) => {
                dragStartY.current = event.clientY
                draggedHandle.current = false
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerUp={(event) => {
                if (dragStartY.current === null) return
                const distance = event.clientY - dragStartY.current
                dragStartY.current = null
                if (distance > 64) {
                  draggedHandle.current = true
                  onToggleRef.current()
                }
              }}
              onPointerCancel={() => {
                dragStartY.current = null
              }}
              onClick={() => {
                if (draggedHandle.current) {
                  draggedHandle.current = false
                  return
                }
                onToggleRef.current()
              }}
              className="mx-auto flex h-7 w-32 touch-none cursor-grab select-none items-center justify-center active:cursor-grabbing"
            >
              <span className="h-1.5 w-[118px] rounded-full bg-slate-300" aria-hidden="true" />
            </button>
          </div>

          <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="px-7 pb-6 pt-1 sm:px-6">
              <section aria-labelledby="mobile-sort-title">
                <h2
                  id="mobile-sort-title"
                  className="flex items-center gap-2 text-base font-bold text-slate-900"
                >
                  <i className="fi fi-rr-sort-alt flex text-lg text-primary" aria-hidden="true" />
                  Organizar por
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {SORT_OPTIONS.map((option) => {
                    const selected = sort === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onSort(option.value)}
                        tabIndex={open ? 0 : -1}
                        className={`flex min-h-10 cursor-pointer items-center justify-center rounded-md border-2 px-2 py-2 text-center text-[13px] font-medium transition-colors duration-150 ${
                          selected
                            ? 'border-primary bg-surface text-slate-900'
                            : 'border-slate-300 bg-surface-secondary text-slate-800 hover:border-primary/60'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              <h2
                id="mobile-filters-title"
                className="mt-5 flex items-center gap-2 text-base font-bold text-slate-900"
              >
                <i className="fi fi-rr-filter flex text-primary" aria-hidden="true" />
                Filtros de Busca
              </h2>
              <FilterFields facets={facets} filters={filters} onChange={onChange} />
            </div>
          </div>

          <footer className="grid shrink-0 grid-cols-[0.9fr_1.1fr] gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:gap-5 sm:px-6">
            <button
              type="button"
              onClick={onClear}
              disabled={activeCount === 0}
              tabIndex={open ? 0 : -1}
              className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-400 bg-[#dedede] px-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-[#d2d2d2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fi fi-rr-cross-small flex text-xl" aria-hidden="true" />
              <span>Limpar Filtros</span>
            </button>

            <button
              type="button"
              onClick={onToggle}
              tabIndex={open ? 0 : -1}
              className="flex min-h-[60px] cursor-pointer flex-col items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-bold leading-tight text-white transition-colors hover:bg-primary-hover"
            >
              <span>Mostrar</span>
              <span>
                {total} {total === 1 ? 'Resultado' : 'Resultados'}
              </span>
            </button>
          </footer>
        </section>
      </div>
    </>
  )
}
