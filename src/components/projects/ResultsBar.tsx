'use client'

import { SelectDropdown } from '@/components/ui/SelectDropdown'
import { type Chip, SORT_LABEL, type SortKey } from '@/presentation/projects/project-filters'

interface ResultsBarProps {
  chips: Chip[]
  onRemove: (id: string) => void
  onClear: () => void
  total: number
  sort: SortKey
  onSort: (sort: SortKey) => void
  mine?: { value: boolean; onChange: (v: boolean) => void; count: number; label: string }
}

export function ResultsBar({
  chips,
  onRemove,
  onClear,
  total,
  sort,
  onSort,
  mine,
}: ResultsBarProps) {
  const seg = (active: boolean) =>
    `cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${
      active ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary'
    }`

  return (
    <div className="hidden rounded-xl border border-border bg-surface shadow-sm xl:block">
      {mine && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-4 py-3 sm:px-5">
          <span className="text-xs text-text-secondary sm:text-[13px]">
            {mine.value ? 'Exibindo apenas ' : 'Seus projetos aparecem no topo: '}
            <strong className="text-slate-800">{mine.label.toLowerCase()}</strong>
          </span>
          <fieldset className="inline-flex rounded-lg bg-surface-secondary p-1">
            <legend className="sr-only">Quais projetos exibir</legend>

            <button
              type="button"
              onClick={() => mine.onChange(false)}
              aria-pressed={!mine.value}
              className={seg(!mine.value)}
            >
              Todos os projetos
            </button>

            <button
              type="button"
              onClick={() => mine.onChange(true)}
              aria-pressed={mine.value}
              className={seg(mine.value)}
            >
              Somente meus ({mine.count})
            </button>
          </fieldset>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Filtros ativos:
          </span>
          {chips.length === 0 && <span className="text-[13px] text-text-muted">nenhum</span>}
          {chips.map((c) => (
            <span
              key={c.id}
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[13px] ${
                c.verified
                  ? 'border-emerald-200 bg-emerald-100 font-medium text-emerald-900'
                  : 'border-border bg-surface-secondary text-slate-800'
              }`}
            >
              {c.verified && <i className="fi fi-rr-check-circle flex" aria-hidden="true" />}
              {c.label}
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                aria-label={`Remover filtro ${c.label}`}
                className="flex cursor-pointer opacity-70 hover:opacity-100"
              >
                <i className="fi fi-rr-cross-small flex text-base" aria-hidden="true" />
              </button>
            </span>
          ))}
          {chips.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer text-xs font-semibold text-primary underline underline-offset-2"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[13px] text-slate-700">
          <span>
            <strong>{total}</strong> {total === 1 ? 'projeto encontrado' : 'projetos encontrados'}
          </span>
          <div className="hidden items-center gap-2 xl:flex">
            <span className="text-text-secondary">Organizar por:</span>
            <SelectDropdown
              ariaLabel="Organizar projetos por"
              value={sort}
              onChange={(value) => onSort(value as SortKey)}
              size="compact"
              width="auto"
              tone="muted"
              options={(Object.keys(SORT_LABEL) as SortKey[]).map((key) => ({
                value: key,
                label: SORT_LABEL[key],
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
