'use client'

import { useEffect, useState } from 'react'

interface SearchBarProps {
  value: string
  onSearch: (query: string) => void
}

export function SearchBar({ value, onSearch }: SearchBarProps) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  return (
    <search aria-label="Buscar projetos">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSearch(draft.trim())
        }}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 pl-3.5 shadow-sm"
      >
        <i className="fi fi-rr-search flex text-lg text-slate-600" aria-hidden="true" />

        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Busque por título, tecnologia ou orientador..."
          aria-label="Buscar projetos"
          className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-text-muted sm:text-[15px]"
        />

        <button
          type="submit"
          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover sm:px-5"
        >
          Buscar
          <i className="fi fi-rr-arrow-right flex" aria-hidden="true" />
        </button>
      </form>
    </search>
  )
}
