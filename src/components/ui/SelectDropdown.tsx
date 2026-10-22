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
  className?: string
}

const EXIT_DURATION = 150

export function SelectDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  size = 'default',
  width = 'full',
  tone = 'surface',
  className = '',
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const closeTimerRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const listboxId = useId()

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const selectedOption = options.find((option) => option.value === value)
  const widthClass = width === 'full' ? 'w-full' : 'w-auto'
  const sizeClass =
    size === 'compact' ? 'h-9 min-w-[168px] px-2.5 text-[13px]' : 'h-10 px-3.5 text-sm'
  const toneClass = tone === 'muted' ? 'bg-surface-secondary' : 'bg-white'

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const padding = 12
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = Math.min(Math.max(rect.width, 216), viewportWidth - padding * 2)
    const estimatedHeight = Math.min(
      Math.max(options.length * 42 + 12, 84),
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
      top,
      left,
      width: menuWidth,
      maxHeight: Math.min(320, viewportHeight - padding * 2),
    })
  }, [options.length])

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
    setActiveIndex(selectedIndex)
    updatePosition()
    setIsMounted(true)
    frameRef.current = window.requestAnimationFrame(() => setIsOpen(true))
  }, [selectedIndex, updatePosition])

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
        closeMenu(true)
      }
    }

    updatePosition()
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, closeMenu, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen, activeIndex])

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
      } else {
        const direction = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex((current) => (current + direction + options.length) % options.length)
      }
    }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index + direction + options.length) % options.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(options.length - 1)
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
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            aria-hidden={!isOpen}
            inert={!isOpen}
            style={menuStyle}
            className={`z-[100] overflow-y-auto rounded-xl border border-border/90 bg-white p-1.5 shadow-[0_16px_40px_rgba(24,24,27,0.16)] ring-1 ring-black/5 transition-[opacity,transform,visibility] duration-150 ease-out ${
              isOpen
                ? 'visible translate-y-0 scale-100 opacity-100'
                : 'invisible -translate-y-1 scale-[0.98] opacity-0'
            }`}
          >
            {options.map((option, index) => {
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
                  className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors duration-100 ${
                    selected
                      ? 'bg-primary-light/80 font-semibold text-primary'
                      : 'text-slate-700 hover:bg-surface-secondary hover:text-slate-950'
                  } ${activeIndex === index && isOpen ? 'outline-none ring-2 ring-inset ring-primary/15' : ''}`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span
                      className={`ml-auto shrink-0 text-[11px] ${selected ? 'text-primary/75' : 'text-text-muted'}`}
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
          </div>,
          document.body,
        )}
    </div>
  )
}
