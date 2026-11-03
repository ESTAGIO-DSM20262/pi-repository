'use client'

import { useState } from 'react'
import { fieldClass, hintClass, labelClass } from '@/components/projects/form/ProjectFormPrimitives'
import {
  MAX_LINK_TITLE_LENGTH,
  MAX_PROJECT_LINKS,
  PROJECT_LINK_ICONS,
  PROJECT_LINK_PRESETS,
  type ProjectLinkInput,
} from '@/domain/enterprise/entities/project-details'

export interface DraftProjectLink extends ProjectLinkInput {
  key: string
}

interface ProjectLinksEditorProps {
  links: DraftProjectLink[]
  onAdd: (preset?: { title: string; icon: string }) => void
  onUpdate: (key: string, changes: Partial<ProjectLinkInput>) => void
  onRemove: (key: string) => void
}

function IconPicker({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (icon: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Escolher ícone do link ${label}`}
        className="cursor-pointer flex h-10 w-12 items-center justify-center gap-1 rounded-lg border border-border bg-surface-secondary text-primary transition hover:border-primary/40"
      >
        <i className={`fi ${value} flex text-lg`} aria-hidden="true" />
        <i className="fi fi-rr-angle-small-down flex text-xs text-slate-500" aria-hidden="true" />
      </button>
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar catálogo de ícones"
            tabIndex={-1}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="listbox"
            aria-label="Catálogo de ícones"
            className="absolute left-0 top-full z-40 mt-1.5 w-72 rounded-xl border border-border bg-white p-2.5 shadow-xl"
          >
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#765e58]">
              Escolha um ícone
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {PROJECT_LINK_ICONS.map((option) => (
                <button
                  key={option.icon}
                  type="button"
                  role="option"
                  aria-selected={option.icon === value}
                  title={option.label}
                  aria-label={option.label}
                  onClick={() => {
                    onChange(option.icon)
                    setIsOpen(false)
                  }}
                  className={`cursor-pointer flex h-11 flex-col items-center justify-center rounded-lg border text-base transition ${
                    option.icon === value
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-transparent text-slate-700 hover:border-primary/30 hover:bg-surface-secondary'
                  }`}
                >
                  <i className={`fi ${option.icon} flex`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function ProjectLinksEditor({ links, onAdd, onUpdate, onRemove }: ProjectLinksEditorProps) {
  const usedTitles = new Set(links.map((link) => link.title.trim().toLocaleLowerCase('pt-BR')))
  const availablePresets = PROJECT_LINK_PRESETS.filter(
    (preset) => !usedTitles.has(preset.title.toLocaleLowerCase('pt-BR')),
  )
  const reachedLimit = links.length >= MAX_PROJECT_LINKS

  return (
    <div>
      <span className={labelClass}>Links do projeto</span>

      {links.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface-secondary/60 px-4 py-6 text-center text-sm text-text-secondary">
          Nenhum link adicionado. Escolha um modelo abaixo ou crie um link personalizado.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {links.map((link, index) => (
            <li
              key={link.key}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-2 rounded-xl border border-border bg-white p-2.5 sm:grid-cols-[auto_minmax(0,0.45fr)_minmax(0,1fr)_auto]"
            >
              <IconPicker
                value={link.icon}
                label={link.title || String(index + 1)}
                onChange={(icon) => onUpdate(link.key, { icon })}
              />
              <input
                aria-label={`Título do link ${index + 1}`}
                value={link.title}
                maxLength={MAX_LINK_TITLE_LENGTH}
                onChange={(event) => onUpdate(link.key, { title: event.target.value })}
                placeholder="Título do link"
                className={`${fieldClass} col-span-2 sm:col-span-1`}
              />
              <input
                aria-label={`Endereço do link ${index + 1}`}
                value={link.url}
                inputMode="url"
                onChange={(event) => onUpdate(link.key, { url: event.target.value })}
                placeholder="https://"
                className={`${fieldClass} col-span-3 sm:col-span-1 sm:row-auto`}
              />
              <button
                type="button"
                onClick={() => onRemove(link.key)}
                aria-label={`Remover link ${link.title || index + 1}`}
                className="cursor-pointer col-start-3 row-start-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary sm:col-start-auto sm:row-start-auto"
              >
                <i className="fi fi-rr-trash flex" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {availablePresets.map((preset) => (
          <button
            key={preset.title}
            type="button"
            disabled={reachedLimit}
            onClick={() => onAdd(preset)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className={`fi ${preset.icon} flex`} aria-hidden="true" />
            {preset.title}
          </button>
        ))}
        <button
          type="button"
          disabled={reachedLimit}
          onClick={() => onAdd()}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/50 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary-light/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className="fi fi-rr-plus flex" aria-hidden="true" />
          Link personalizado
        </button>
      </div>
      <p className={hintClass}>
        Cadastre só os links que o projeto realmente tem (até {MAX_PROJECT_LINKS}). Em um link
        personalizado, defina o título, o endereço HTTPS e o ícone.
      </p>
    </div>
  )
}
