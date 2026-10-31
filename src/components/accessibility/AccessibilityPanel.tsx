'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import { useAccessibility } from '@/presentation/accessibility/accessibility-context'
import {
  type ColorMode,
  countActivePreferences,
  stepTextSize,
  TEXT_SIZE_LEVELS,
} from '@/presentation/accessibility/preferences'

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'default', label: 'Cores Padrão' },
  { value: 'achromatomaly', label: 'Acromatomia' },
  { value: 'achromatopsia', label: 'Acromatopsia' },
  { value: 'deuteranomaly', label: 'Deuteranomalia' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'protanomaly', label: 'Protanomalia' },
  { value: 'protanopia', label: 'Protanopia' },
  { value: 'tritanomaly', label: 'Tritanomalia' },
  { value: 'tritanopia', label: 'Tritanopia' },
]

function AccessibilityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <title>Acessibilidade</title>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="7.5" r="1" />
      <path d="M7 10.5c3.3 1 6.7 1 10 0" />
      <path d="M12 11v3.5m0 0-2.5 4.5m2.5-4.5 2.5 4.5" />
    </svg>
  )
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const labelId = useId()
  const descriptionId = useId()

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-foreground">
          {label}
        </p>
        <p id={descriptionId} className="text-xs leading-snug text-text-secondary">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onClick={() => onChange(!checked)}
        className={`inline-flex h-9 min-w-[5.25rem] shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-bold transition motion-reduce:transition-none ${
          checked
            ? 'border-primary bg-primary text-white'
            : 'border-border bg-surface text-foreground hover:bg-surface-secondary'
        }`}
      >
        <i
          className={`fi ${checked ? 'fi-rr-check' : 'fi-rr-cross-small'} flex text-sm`}
          aria-hidden="true"
        />
        {checked ? 'Ativado' : 'Desativado'}
      </button>
    </li>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-light pt-3">
      <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{title}</h3>
      {children}
    </section>
  )
}

export function AccessibilityPanel() {
  const { preferences, update, reset, isModified } = useAccessibility()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const activeCount = countActivePreferences(preferences)

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('[role="listbox"]')) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  function closePanel() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  function changeTextSize(direction: 1 | -1) {
    const next = stepTextSize(preferences.textSize, direction)
    if (next === preferences.textSize) return
    update({ textSize: next })
    setMessage(`Tamanho do texto: ${next}%`)
  }

  function handleReset() {
    reset()
    setMessage('Configurações de acessibilidade restauradas ao padrão.')
  }

  const minSize = TEXT_SIZE_LEVELS[0]
  const maxSize = TEXT_SIZE_LEVELS[TEXT_SIZE_LEVELS.length - 1]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={closePanel}
          className="pointer-events-auto fixed inset-0 cursor-default bg-black/70 sm:hidden"
        />
      )}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="pointer-events-auto fixed inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-lg sm:inset-x-auto sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:right-4 sm:max-h-[min(80dvh,40rem)] sm:w-[22rem] sm:rounded-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border-light bg-surface-secondary px-4 py-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-slab text-base font-semibold text-foreground">
                Acessibilidade
              </h2>
              <p id={descriptionId} className="mt-0.5 text-xs leading-snug text-text-secondary">
                Ajuste a aparência e a navegação do site. As escolhas ficam salvas neste navegador.
              </p>
            </div>
            <button
              type="button"
              data-autofocus
              onClick={closePanel}
              aria-label="Fechar painel de acessibilidade"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition hover:bg-border-light"
            >
              <i className="fi fi-rr-cross-small flex text-xl leading-none" aria-hidden="true" />
            </button>
          </div>

          <div className="modal-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <Group title="Tamanho do texto">
              <div className="flex items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  onClick={() => changeTextSize(-1)}
                  disabled={preferences.textSize === minSize}
                  aria-label="Diminuir o tamanho do texto"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-foreground transition hover:bg-surface-secondary disabled:opacity-50"
                >
                  A−
                </button>
                <p
                  className="min-w-0 flex-1 text-center text-lg font-bold text-foreground"
                  aria-live="polite"
                >
                  {preferences.textSize}%
                  <span className="block text-xs font-normal text-text-secondary">
                    {preferences.textSize === minSize ? 'Padrão' : 'Personalizado'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => changeTextSize(1)}
                  disabled={preferences.textSize === maxSize}
                  aria-label="Aumentar o tamanho do texto"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-foreground transition hover:bg-surface-secondary disabled:opacity-50"
                >
                  A+
                </button>
              </div>
            </Group>

            <Group title="Aparência">
              <ul>
                <SwitchRow
                  label="Tema escuro"
                  description="Fundo escuro que reduz o brilho da tela."
                  checked={preferences.theme === 'dark'}
                  onChange={(value) => update({ theme: value ? 'dark' : 'light' })}
                />
                <SwitchRow
                  label="Alto contraste"
                  description="Cores fortes e bordas definidas, também com o tema escuro."
                  checked={preferences.highContrast}
                  onChange={(value) => update({ highContrast: value })}
                />
              </ul>
            </Group>

            <Group title="Cores para daltonismo">
              <div className="py-2">
                <p className="mb-1.5 text-sm font-semibold text-foreground">Modo de cores</p>
                <SelectDropdown
                  value={preferences.colorMode}
                  options={COLOR_MODE_OPTIONS}
                  onChange={(value) => update({ colorMode: value as ColorMode })}
                  ariaLabel="Modo de cores para daltonismo"
                />
                <p className="mt-1.5 text-xs leading-snug text-text-secondary">
                  Troca as cores de todo o sistema por paletas adaptadas. Textos e ícones continuam
                  identificando cada estado.
                </p>
              </div>
            </Group>

            <Group title="Leitura e navegação">
              <ul>
                <SwitchRow
                  label="Sublinhar links"
                  description="Mantém os links sempre sublinhados."
                  checked={preferences.underlineLinks}
                  onChange={(value) => update({ underlineLinks: value })}
                />
                <SwitchRow
                  label="Reduzir animações"
                  description="Remove transições e movimentos. Também segue a preferência do seu sistema."
                  checked={preferences.reduceMotion}
                  onChange={(value) => update({ reduceMotion: value })}
                />
                <SwitchRow
                  label="Destacar foco do teclado"
                  description="Contorno mais evidente no item selecionado com Tab."
                  checked={preferences.highlightFocus}
                  onChange={(value) => update({ highlightFocus: value })}
                />
              </ul>
            </Group>
          </div>

          <div className="border-t border-border-light bg-surface px-4 py-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isModified}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-surface text-sm font-semibold text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fi fi-rr-rotate-right flex text-base" aria-hidden="true" />
              Restaurar configurações padrão
            </button>
            <p role="status" className="sr-only">
              {message}
            </p>
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          activeCount > 0
            ? `Abrir painel de acessibilidade (${activeCount} configurações ativas)`
            : 'Abrir painel de acessibilidade'
        }
        className="pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg transition hover:bg-primary-hover motion-reduce:transition-none"
      >
        <AccessibilityIcon className="h-7 w-7" />
        {activeCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-secondary px-1 text-[0.6875rem] font-bold text-white"
          >
            {activeCount}
          </span>
        )}
      </button>
    </div>
  )
}
