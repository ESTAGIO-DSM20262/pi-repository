'use client'

import { type KeyboardEvent, useId, useMemo, useState } from 'react'
import { fieldClass, hintClass, labelClass } from '@/components/projects/form/ProjectFormPrimitives'
import {
  canonicalTechnologyName,
  popularTechnologies,
  suggestTechnologies,
  type TechnologyKind,
  technologyKey,
} from '@/domain/enterprise/entities/technology-catalog'

const MAX_ITEMS = 20

interface TechnologyPickerProps {
  id: string
  label: string
  placeholder: string
  kind: TechnologyKind
  values: string[]
  onChange: (values: string[]) => void
}

export function TechnologyPicker({
  id,
  label,
  placeholder,
  kind,
  values,
  onChange,
}: TechnologyPickerProps) {
  const [draft, setDraft] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = useId()

  const suggestions = useMemo(
    () => (draft.trim() ? suggestTechnologies(draft, kind, values, 8) : []),
    [draft, kind, values],
  )
  const popular = useMemo(() => popularTechnologies(kind, values, 8), [kind, values])
  const showList = isOpen && suggestions.length > 0

  function add(rawValues: string[]) {
    const next = [...values]
    for (const raw of rawValues) {
      const name = canonicalTechnologyName(raw)
      if (!name) continue
      if (next.some((item) => technologyKey(item) === technologyKey(name))) continue
      next.push(name)
    }
    onChange(next.slice(0, MAX_ITEMS))
    setDraft('')
    setActiveIndex(-1)
  }

  function commitDraft() {
    const parts = draft
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length > 0) add(parts)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (event.key === 'Enter' && showList && activeIndex >= 0) {
        add([suggestions[activeIndex].name])
      } else {
        commitDraft()
      }
    } else if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {values.length > 0 && (
        <ul className="mb-2.5 flex flex-wrap gap-1.5" aria-label={label}>
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-md bg-surface-secondary py-1 pr-1 pl-2.5 text-xs font-semibold text-slate-800 ring-1 ring-border"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remover ${value}`}
                className="cursor-pointer flex h-5 w-5 items-center justify-center rounded text-slate-500 transition hover:bg-primary/10 hover:text-primary"
              >
                <i className="fi fi-rr-cross-small flex text-sm" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          autoComplete="off"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false)
            commitDraft()
          }}
          placeholder={placeholder}
          className={fieldClass}
        />
        {showList && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={`Sugestões de ${label.toLowerCase()}`}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-white p-1 shadow-lg"
          >
            {suggestions.map((entry, index) => (
              <div
                key={entry.name}
                id={`${listboxId}-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={index === activeIndex}
                onMouseDown={(event) => {
                  event.preventDefault()
                  add([entry.name])
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                  index === activeIndex ? 'bg-primary-light text-primary' : 'text-slate-800'
                }`}
              >
                <span className="font-semibold">{entry.name}</span>
                <span className="text-[11px] text-text-secondary">{entry.group}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {popular.length > 0 && values.length < MAX_ITEMS && (
        <div className="mt-2.5">
          <p className="mb-1.5 text-[11px] font-semibold text-[#666666]">Mais usadas</p>
          <ul className="flex flex-wrap gap-1.5">
            {popular.map((entry) => (
              <li key={entry.name}>
                <button
                  type="button"
                  onClick={() => add([entry.name])}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                >
                  <i className="fi fi-rr-plus flex text-[10px]" aria-hidden="true" />
                  {entry.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className={hintClass}>
        Escolha uma sugestão ou digite qualquer outra tecnologia e pressione Enter. Nomes conhecidos
        são padronizados automaticamente (por exemplo, “nodejs” vira “Node.js”).
      </p>
    </div>
  )
}
