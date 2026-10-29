'use client'

import {
  ALL_OPTION,
  type DashboardFilterOption,
  type DashboardFilters,
  type DashboardStatusFilter,
  hasActiveDashboardFilters,
  STATUS_FILTER_LABELS,
} from '@/application/dashboard/dashboard-filters'
import { SearchSelect } from '@/components/ui/SearchSelect'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import { labelClass } from '@/libs/styles'

interface DashboardFiltersBarProps {
  filters: DashboardFilters
  onChange: (filters: DashboardFilters) => void
  onClear: () => void
  semesterOptions: DashboardFilterOption[]
  projectOptions: DashboardFilterOption[]
  advisorOptions?: DashboardFilterOption[]
  shown: number
  total: number
  scopeNote: string
}

const STATUS_OPTIONS = (Object.keys(STATUS_FILTER_LABELS) as DashboardStatusFilter[]).map(
  (value) => ({ value, label: STATUS_FILTER_LABELS[value] }),
)

export function DashboardFiltersBar({
  filters,
  onChange,
  onClear,
  semesterOptions,
  projectOptions,
  advisorOptions,
  shown,
  total,
  scopeNote,
}: DashboardFiltersBarProps) {
  const active = hasActiveDashboardFilters(filters)
  const columns = advisorOptions ? 'xl:grid-cols-4' : 'xl:grid-cols-3'

  return (
    <section
      aria-label="Filtros do painel"
      className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent-light text-primary">
            <i className="fi fi-rr-settings-sliders flex text-base" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Filtrar painel
            </h2>
            <p className="mt-0.5 text-[11px] text-text-secondary sm:text-xs">{scopeNote}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p role="status" className="text-xs font-semibold text-slate-700">
            {shown} de {total} {total === 1 ? 'projeto' : 'projetos'}
          </p>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary-light"
            >
              <i className="fi fi-rr-cross-small flex" aria-hidden="true" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 ${columns}`}>
        <div>
          <span className={labelClass}>Semestre</span>
          <SelectDropdown
            ariaLabel="Filtrar por semestre"
            value={filters.semester}
            options={[{ value: ALL_OPTION, label: 'Todos os semestres' }, ...semesterOptions]}
            onChange={(semester) => onChange({ ...filters, semester, projectId: ALL_OPTION })}
          />
        </div>
        <div>
          <span className={labelClass}>Situação</span>
          <SelectDropdown
            ariaLabel="Filtrar por situação do projeto"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(status) =>
              onChange({
                ...filters,
                status: status as DashboardStatusFilter,
                projectId: ALL_OPTION,
              })
            }
          />
        </div>
        {advisorOptions && (
          <div>
            <span className={labelClass}>Orientador</span>
            <SearchSelect
              ariaLabel="Buscar orientador"
              value={filters.advisor}
              options={advisorOptions.map((option) => ({
                value: option.value,
                label: option.label,
                hint:
                  option.count === undefined
                    ? undefined
                    : `${option.count} ${option.count === 1 ? 'projeto' : 'projetos'}`,
              }))}
              allValue={ALL_OPTION}
              allLabel="Todos os orientadores"
              placeholder="Buscar orientador pelo nome"
              noun="orientador"
              onChange={(advisor) => onChange({ ...filters, advisor, projectId: ALL_OPTION })}
            />
          </div>
        )}
        <div>
          <span className={labelClass}>Projeto</span>
          <SearchSelect
            ariaLabel="Buscar projeto"
            value={filters.projectId}
            options={projectOptions}
            allValue={ALL_OPTION}
            allLabel="Todos os projetos"
            onChange={(projectId) => onChange({ ...filters, projectId })}
          />
        </div>
      </div>
    </section>
  )
}
