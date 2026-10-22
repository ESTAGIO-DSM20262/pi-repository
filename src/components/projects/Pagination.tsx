interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

function pagesToShow(current: number, last: number): (number | '…')[] {
  const keep = new Set(
    [1, last, current - 1, current, current + 1].filter((n) => n >= 1 && n <= last),
  )
  const sorted = [...keep].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  if (total === 0) return null
  const last = Math.ceil(total / pageSize)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const nav =
    'inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:text-text-muted'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-[13px] text-text-secondary">
        Mostrando{' '}
        <strong className="text-slate-900">
          {from}–{to}
        </strong>{' '}
        de <strong className="text-slate-900">{total}</strong> resultados da consulta
      </p>

      {last > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
            className={`cursor-pointer ${nav} text-slate-700 hover:text-primary`}
          >
            <i className="fi fi-rr-angle-small-left flex" aria-hidden="true" /> Anterior
          </button>

          {pagesToShow(page, last).map((n, i, pages) =>
            n === '…' ? (
              <span key={`gap-${pages[i - 1]}-${pages[i + 1]}`} className="px-1 text-text-muted">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-current={n === page ? 'page' : undefined}
                className={`h-9 min-w-9 cursor-pointer rounded-lg px-2 text-sm font-semibold transition ${
                  n === page
                    ? 'bg-primary text-white'
                    : 'text-slate-700 hover:bg-primary-light hover:text-primary'
                }`}
              >
                {n}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page === last}
            onClick={() => onChange(page + 1)}
            className={`cursor-pointer ${nav} text-slate-900 hover:text-primary`}
          >
            Próxima <i className="fi fi-rr-angle-small-right flex" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
