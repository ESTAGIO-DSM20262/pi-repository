'use client'

import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface SearchSelectOption {
  value: string
  label: string
  hint?: string
}

interface SearchSelectProps {
  value: string
  options: SearchSelectOption[]
  onChange: (value: string) => void
  ariaLabel: string
  allValue: string
  allLabel: string
  placeholder?: string
  noun?: string
  maxResults?: number
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function SearchSelect({
  value,
  options,
  onChange,
  ariaLabel,
  allValue,
  allLabel,
  placeholder = 'Buscar projeto pelo nome',
  noun = 'projeto',
  maxResults = 8,
}: SearchSelectProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const selected = options.find((option) => option.value === value)
  const hasSelection = value !== allValue && Boolean(selected)

  const results = useMemo(() => {
    const term = normalize(query.trim())
    const matches = term
      ? options.filter((option) => normalize(`${option.label} ${option.hint ?? ''}`).includes(term))
      : options
    return matches.slice(0, maxResults)
  }, [options, query, maxResults])

  const totalMatches = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return options.length
    return options.filter((option) =>
      normalize(`${option.label} ${option.hint ?? ''}`).includes(term),
    ).length
  }, [options, query])

  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target)) return
      setIsOpen(false)
      setQuery('')
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  function choose(next: string) {
    onChange(next)
    setQuery('')
    setIsOpen(false)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => Math.min(current + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      if (isOpen && results[activeIndex]) {
        event.preventDefault()
        choose(results[activeIndex].value)
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  const inputValue = isOpen ? query : hasSelection ? (selected?.label ?? '') : ''

  return (
    <div ref={rootRef} className="relative w-full">
      <i
        className="fi fi-rr-search pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 text-sm text-primary"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        value={inputValue}
        placeholder={hasSelection ? (selected?.label ?? placeholder) : placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        className={`h-10 w-full rounded-lg border border-border bg-white pr-9 pl-9 text-sm font-medium shadow-sm outline-none transition placeholder:font-normal placeholder:text-text-muted hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15 ${
          hasSelection && !isOpen ? 'text-primary' : 'text-slate-800'
        }`}
      />
      {hasSelection && (
        <button
          type="button"
          aria-label="Limpar projeto selecionado"
          onClick={() => {
            choose(allValue)
            inputRef.current?.blur()
          }}
          className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-text-secondary transition hover:bg-primary-light hover:text-primary"
        >
          <i className="fi fi-rr-cross-small flex text-base" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-border/90 bg-white p-1.5 shadow-[0_16px_40px_rgba(24,24,27,0.16)] ring-1 ring-black/5"
        >
          <button
            type="button"
            role="option"
            aria-selected={!hasSelection}
            onClick={() => choose(allValue)}
            className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
              hasSelection
                ? 'text-slate-700 hover:bg-surface-secondary'
                : 'bg-primary-light/80 font-semibold text-primary'
            }`}
          >
            <i className="fi fi-rr-apps flex shrink-0 text-sm" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{allLabel}</span>
          </button>

          {results.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-text-secondary">
              Nenhum {noun} encontrado para “{query.trim()}”.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {results.map((option, index) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option.value)}
                    className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-primary-light/80 font-semibold text-primary'
                        : activeIndex === index
                          ? 'bg-surface-secondary text-slate-950'
                          : 'text-slate-700'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.hint && (
                      <span className="shrink-0 text-[11px] text-text-muted">{option.hint}</span>
                    )}
                    {isSelected && (
                      <i className="fi fi-rr-check flex shrink-0 text-sm" aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {totalMatches > results.length && (
            <p className="border-t border-border-light px-3 pt-2 pb-1 text-[11px] text-text-muted">
              Mostrando {results.length} de {totalMatches}. Continue digitando para refinar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
