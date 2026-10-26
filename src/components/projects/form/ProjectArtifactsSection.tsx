'use client'

import type { ChangeEvent } from 'react'
import {
  Badge,
  FormSection,
  fieldClass,
  labelClass,
  Required,
} from '@/components/projects/form/ProjectFormPrimitives'

export interface DraftProjectLink {
  key: string
  title: string
  url: string
}

interface ProjectArtifactsSectionProps {
  repositoryUrl: string
  onRepositoryUrlChange: (value: string) => void
  liveUrl: string
  onLiveUrlChange: (value: string) => void
  prototypeUrl: string
  onPrototypeUrlChange: (value: string) => void
  extraLinks: DraftProjectLink[]
  onAddExtraLink: () => void
  onUpdateExtraLink: (key: string, changes: Partial<DraftProjectLink>) => void
  onRemoveExtraLink: (key: string) => void
}

const textActionClass =
  'cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-primary-hover'

function UploadSlot({
  icon,
  title,
  hint,
  accept,
  multiple = true,
  disabled = true,
  onFiles,
}: {
  icon: string
  title: string
  hint: string
  accept: string
  multiple?: boolean
  disabled?: boolean
  onFiles?: (files: File[]) => void
}) {
  return (
    <label
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center transition ${
        disabled
          ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:border-primary/40 hover:bg-primary-light/30'
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
        <i className={`fi ${icon} flex text-xl`} aria-hidden="true" />
      </span>
      <span className="mt-1 text-sm font-bold text-slate-900">{title}</span>
      <span className="text-[11px] text-[#765e58]">{hint}</span>
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          if (onFiles && event.target.files) onFiles(Array.from(event.target.files))
          event.target.value = ''
        }}
      />
    </label>
  )
}

function ArtifactSubheading({
  title,
  description,
  soon = false,
}: {
  title: string
  description: string
  soon?: boolean
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-[11px] text-[#765e58]">{description}</p>
      </div>
      {soon && <Badge tone="slate">Em breve</Badge>}
    </div>
  )
}

export function ProjectArtifactsSection({
  repositoryUrl,
  onRepositoryUrlChange,
  liveUrl,
  onLiveUrlChange,
  prototypeUrl,
  onPrototypeUrlChange,
  extraLinks,
  onAddExtraLink,
  onUpdateExtraLink,
  onRemoveExtraLink,
}: ProjectArtifactsSectionProps) {
  function changeValue(event: ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) {
    onChange(event.target.value)
  }

  return (
    <FormSection
      icon="fi-rr-folder-open"
      title="Artefatos do Projeto"
      subtitle="Links, imagens e documentos referentes ao projeto"
    >
      <div className="space-y-8">
        <div>
          <ArtifactSubheading
            title="Links do projeto"
            description="Endereços HTTPS do código, do sistema publicado e da prototipagem."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="project-repository">
                Repositório
              </label>
              <input
                id="project-repository"
                type="url"
                className={fieldClass}
                value={repositoryUrl}
                onChange={(event) => changeValue(event, onRepositoryUrlChange)}
                maxLength={300}
                placeholder="https://github.com/organizacao/projeto"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="project-live-url">
                Site no ar
              </label>
              <input
                id="project-live-url"
                type="url"
                className={fieldClass}
                value={liveUrl}
                onChange={(event) => changeValue(event, onLiveUrlChange)}
                maxLength={300}
                placeholder="https://meu-projeto.vercel.app"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="project-prototype-url">
                Protótipo
              </label>
              <input
                id="project-prototype-url"
                type="url"
                className={fieldClass}
                value={prototypeUrl}
                onChange={(event) => changeValue(event, onPrototypeUrlChange)}
                maxLength={300}
                placeholder="https://www.figma.com/design/..."
              />
            </div>
          </div>
        </div>

        <div>
          <ArtifactSubheading
            title="Outros links"
            description="Vídeo de apresentação, documentação, artigo ou qualquer endereço relevante."
          />
          {extraLinks.length > 0 && (
            <ul className="space-y-3">
              {extraLinks.map((link, index) => (
                <li
                  key={link.key}
                  className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.6fr_auto] md:items-end"
                >
                  <div>
                    <label className={labelClass} htmlFor={`${link.key}-title`}>
                      Título <Required />
                    </label>
                    <input
                      id={`${link.key}-title`}
                      className={fieldClass}
                      value={link.title}
                      onChange={(event) =>
                        onUpdateExtraLink(link.key, { title: event.target.value })
                      }
                      maxLength={60}
                      placeholder="Insira um título para o link"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${link.key}-url`}>
                      Endereço <Required />
                    </label>
                    <input
                      id={`${link.key}-url`}
                      type="url"
                      className={fieldClass}
                      value={link.url}
                      onChange={(event) => onUpdateExtraLink(link.key, { url: event.target.value })}
                      maxLength={300}
                      placeholder="Insira o endereço web desejado"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveExtraLink(link.key)}
                    aria-label={`Remover link adicional ${index + 1}`}
                    className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-800"
                  >
                    <i className="fi fi-rr-trash flex" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={`flex justify-end ${extraLinks.length > 0 ? 'mt-3' : ''}`}>
            <button type="button" onClick={onAddExtraLink} className={textActionClass}>
              <i className="fi fi-rr-plus flex" aria-hidden="true" /> Anexar link
            </button>
          </div>
        </div>

        <div>
          <ArtifactSubheading
            title="Imagens do projeto"
            description="Capturas de tela, banners e fotos que ilustram o projeto."
            soon
          />
          <UploadSlot
            icon="fi-rr-picture"
            title="Envio de imagens indisponível por enquanto"
            hint="Formatos previstos: PNG, JPG ou WEBP, até 5 MB por imagem."
            accept="image/png,image/jpeg,image/webp"
          />
        </div>

        <div>
          <ArtifactSubheading
            title="Arquivos e documentos"
            description="Proposta, termo de compromisso, documentação técnica e repositório compactado."
            soon
          />
          <UploadSlot
            icon="fi-rr-upload"
            title="Envio de arquivos indisponível por enquanto"
            hint="Formatos previstos: TXT, PDF, DOC, DOCX ou ZIP, até 25 MB por arquivo."
            accept=".txt,.pdf,.doc,.docx,.zip"
          />
        </div>
      </div>
    </FormSection>
  )
}
