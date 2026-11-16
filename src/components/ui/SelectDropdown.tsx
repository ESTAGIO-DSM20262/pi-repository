'use client'

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface SelectDropdownOption {
  value: string
  label: string
  count?: number
}

interface SelectDropdownProps {
  value: string
  options: SelectDropdownOption[]
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  size?: 'default' | 'compact'
  width?: 'full' | 'auto'
  tone?: 'surface' | 'muted'
  layer?: 'default' | 'modal'
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
}

const SEARCH_BAR_HEIGHT = 56
const EXIT_DURATION = 150
const DEFAULT_DROPDOWN_Z_INDEX = 100
const MODAL_DROPDOWN_Z_INDEX = 2147483647

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function SelectDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  size = 'default',
  width = 'full',
  tone = 'surface',
  layer = 'default',
  className = '',
  searchable = false,
  searchPlaceholder = 'Pesquisar...',
  emptyMessage = 'Nenhum resultado encontrado',
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const [query, setQuery] = useState('')
  const [focusSearch, setFocusSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const closeTimerRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const listboxId = useId()

  const normalizedQuery = normalizeText(query)
  const visibleOptions =
    searchable && normalizedQuery
      ? options.filter((option) => normalizeText(option.label).includes(normalizedQuery))
      : options
  const selectedOption = options.find((option) => option.value === value)
  const widthClass = width === 'full' ? 'w-full' : 'w-auto'
  const sizeClass =
    size === 'compact' ? 'h-9 min-w-[168px] px-2.5 text-[0.8125rem]' : 'h-10 px-3.5 text-sm'
  const toneClass = tone === 'muted' ? 'bg-surface-secondary' : 'bg-white'

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const padding = 12
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = Math.min(Math.max(rect.width, 216), viewportWidth - padding * 2)
    const estimatedHeight = Math.min(
      Math.max(options.length * 42 + 12, 84) + (searchable ? SEARCH_BAR_HEIGHT : 0),
      320,
      viewportHeight - padding * 2,
    )
    const spaceBelow = viewportHeight - rect.bottom - padding
    const shouldOpenAbove =
      spaceBelow < Math.min(estimatedHeight, 180) && rect.top > estimatedHeight
    const top = shouldOpenAbove
      ? Math.max(padding, rect.top - estimatedHeight - 8)
      : Math.min(rect.bottom + 8, viewportHeight - estimatedHeight - padding)
    const left = Math.max(padding, Math.min(rect.left, viewportWidth - menuWidth - padding))

    setMenuStyle({
      position: 'fixed',
      zIndex: layer === 'modal' ? MODAL_DROPDOWN_Z_INDEX : DEFAULT_DROPDOWN_Z_INDEX,
      top,
      left,
      width: menuWidth,
      maxHeight: Math.min(320, viewportHeight - padding * 2),
    })
  }, [options.length, layer, searchable])

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setIsMounted(false)
      closeTimerRef.current = null
    }, EXIT_DURATION)
  }, [])

  const openMenu = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setQuery('')
    setFocusSearch(searchable)
    setActiveIndex(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    )
    updatePosition()
    setIsMounted(true)
    frameRef.current = window.requestAnimationFrame(() => setIsOpen(true))
  }, [options, value, searchable, updatePosition])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      closeMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeMenu(true)
      }
    }

    updatePosition()
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, closeMenu, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => {
      if (focusSearch) searchRef.current?.focus()
      else optionRefs.current[activeIndex]?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen, activeIndex, focusSearch])

  function toggleMenu() {
    if (isOpen) closeMenu()
    else openMenu()
  }

  function selectOption(option: SelectDropdownOption) {
    onChange(option.value)
    closeMenu(true)
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        openMenu()
      } else if (visibleOptions.length > 0) {
        const direction = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex(
          (current) => (current + direction + visibleOptions.length) % visibleOptions.length,
        )
      }
    }
  }

  function handleQueryChange(next: string) {
    setQuery(next)
    setActiveIndex(0)
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && visibleOptions.length > 0) {
      event.preventDefault()
      setFocusSearch(false)
      setActiveIndex(0)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const first = visibleOptions[0]
      if (first) selectOption(first)
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowUp' && index === 0 && searchable) {
      event.preventDefault()
      setFocusSearch(true)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index + direction + visibleOptions.length) % visibleOptions.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(visibleOptions.length - 1)
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  return (
    <div ref={rootRef} className={`relative ${widthClass}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        data-open={isOpen}
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
        className={`group inline-flex ${widthClass} ${sizeClass} cursor-pointer items-center justify-between gap-3 rounded-lg border border-border ${toneClass} font-medium text-slate-800 shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 data-[open=true]:border-primary data-[open=true]:ring-2 data-[open=true]:ring-primary/10 ${className}`}
      >
        <span className="min-w-0 truncate text-left">
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <i
          className={`fi fi-rr-angle-small-down flex shrink-0 text-base text-primary transition-transform duration-150 ease-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        />
      </button>

      {isMounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            aria-hidden={!isOpen}
            inert={!isOpen}
            style={menuStyle}
            className={`flex flex-col overflow-hidden rounded-xl border border-border/90 bg-white shadow-[0_16px_40px_rgba(24,24,27,0.16)] ring-1 ring-black/5 transition-[opacity,transform,visibility] duration-150 ease-out ${
              isOpen
                ? 'visible translate-y-0 scale-100 opacity-100'
                : 'invisible -translate-y-1 scale-[0.98] opacity-0'
            }`}
          >
            {searchable && (
              <div className="shrink-0 border-b border-border-light p-2">
                <div className="relative">
                  <i
                    className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-sm text-text-muted"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => handleQueryChange(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchPlaceholder}
                    aria-label={`Pesquisar: ${ariaLabel}`}
                    aria-controls={listboxId}
                    autoComplete="off"
                    className="h-10 w-full rounded-lg border border-border bg-surface-secondary pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
            )}
            <div
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel}
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
            >
              {visibleOptions.map((option, index) => {
                const selected = option.value === value
                return (
                  <button
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element
                    }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={isOpen && activeIndex === index ? 0 : -1}
                    onClick={() => selectOption(option)}
                    onFocus={() => setActiveIndex(index)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.8125rem] transition-colors duration-100 ${
                      selected
                        ? 'bg-primary-light/80 font-semibold text-primary'
                        : 'text-slate-700 hover:bg-surface-secondary hover:text-slate-950'
                    } ${activeIndex === index && isOpen ? 'outline-none ring-2 ring-inset ring-primary/15' : ''}`}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span
                        className={`ml-auto shrink-0 text-[0.6875rem] ${selected ? 'text-primary/75' : 'text-text-muted'}`}
                      >
                        {option.count}
                      </span>
                    )}
                    {selected && (
                      <i className="fi fi-rr-check flex shrink-0 text-sm" aria-hidden="true" />
                    )}
                  </button>
                )
              })}
              {searchable && visibleOptions.length === 0 && (
                <p role="status" className="px-3 py-4 text-center text-[0.8125rem] text-text-muted">
                  {emptyMessage}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
