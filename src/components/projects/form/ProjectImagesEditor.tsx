'use client'

import Image from 'next/image'
import { type ChangeEvent, useId, useState } from 'react'
import { hintClass, labelClass } from '@/components/projects/form/ProjectFormPrimitives'
import type { ProjectImage, ProjectImageOrientation } from '@/domain/enterprise/entities/project'
import {
  PROJECT_IMAGE_ACCEPT,
  PROJECT_IMAGE_LIMITS,
  PROJECT_IMAGE_ORIENTATIONS,
  suggestImageOrientation,
  validateProjectImage,
} from '@/domain/enterprise/entities/project-images'
import {
  PROJECT_IMAGE_UPLOAD_ENABLED,
  uploadProjectImage,
} from '@/presentation/projects/project-image-upload'

export interface DraftProjectImage extends ProjectImage {
  key: string
}

interface ProjectImagesEditorProps {
  images: DraftProjectImage[]
  onChange: (images: DraftProjectImage[]) => void
}

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem selecionada.'))
    }
    image.src = url
  })
}

function megabytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

export function ProjectImagesEditor({ images, onChange }: ProjectImagesEditorProps) {
  const inputId = useId()
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const limits = PROJECT_IMAGE_LIMITS

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return
    setError('')
    setIsUploading(true)

    let current = images
    for (const file of files) {
      try {
        const { width, height } = await readDimensions(file)
        const check = validateProjectImage(
          { name: file.name, size: file.size, type: file.type, width, height },
          current.length,
        )
        if (check.isLeft()) {
          setError(check.value.message)
          break
        }
        const uploaded = await uploadProjectImage(file)
        current = [
          ...current,
          {
            key: `image-${crypto.randomUUID()}`,
            title: '',
            url: uploaded.url,
            orientation: suggestImageOrientation(width, height),
          },
        ]
        onChange(current)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível enviar a imagem.')
        break
      }
    }
    setIsUploading(false)
  }

  function update(key: string, changes: Partial<ProjectImage>) {
    onChange(images.map((image) => (image.key === key ? { ...image, ...changes } : image)))
  }

  return (
    <div>
      <span className={labelClass}>Imagens do projeto</span>

      <label
        htmlFor={inputId}
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-surface-secondary/60 px-4 py-8 text-center transition ${
          PROJECT_IMAGE_UPLOAD_ENABLED && !isUploading
            ? 'cursor-pointer hover:border-primary/40 hover:bg-primary-light/30'
            : 'cursor-not-allowed opacity-70'
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
          <i className="fi fi-rr-picture flex text-xl" aria-hidden="true" />
        </span>
        <span className="mt-1 text-sm font-semibold text-slate-900">
          {isUploading ? 'Enviando imagens…' : 'Selecionar imagens do projeto'}
        </span>
        <span className="text-xs text-text-secondary">
          PNG, JPG ou WEBP · até {megabytes(limits.maxBytes)} cada · até {limits.maxFiles} imagens ·
          lado mínimo de {limits.minSidePx}px
        </span>
        {!PROJECT_IMAGE_UPLOAD_ENABLED && (
          <span className="mt-1 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Envio em breve
          </span>
        )}
        <input
          id={inputId}
          type="file"
          accept={PROJECT_IMAGE_ACCEPT}
          multiple
          disabled={!PROJECT_IMAGE_UPLOAD_ENABLED || isUploading}
          onChange={handleFiles}
          className="sr-only"
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.key} className="rounded-xl border border-border bg-white p-3">
              <div
                className={`relative mx-auto flex items-center justify-center overflow-hidden rounded-lg bg-surface-secondary ${
                  image.orientation === 'vertical'
                    ? 'aspect-[9/16] h-48'
                    : 'aspect-video w-full max-w-xs'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.title || `Imagem ${index + 1} do projeto`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>

              <fieldset className="mt-3">
                <legend className="mb-1.5 text-[11px] font-bold text-slate-800">
                  Orientação da imagem
                </legend>
                <div className="grid grid-cols-2 gap-1.5">
                  {PROJECT_IMAGE_ORIENTATIONS.map((option) => (
                    <label
                      key={option.value}
                      title={option.hint}
                      className={`cursor-pointer rounded-lg border px-2 py-1.5 text-center text-xs font-semibold transition ${
                        image.orientation === option.value
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border text-slate-700 hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`orientation-${image.key}`}
                        value={option.value}
                        checked={image.orientation === option.value}
                        onChange={() =>
                          update(image.key, {
                            orientation: option.value as ProjectImageOrientation,
                          })
                        }
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <input
                aria-label={`Legenda da imagem ${index + 1}`}
                value={image.title}
                maxLength={limits.maxTitleLength}
                onChange={(event) => update(image.key, { title: event.target.value })}
                placeholder="Legenda (opcional)"
                className="mt-2.5 block h-9 w-full rounded-lg border border-border bg-surface-secondary px-3 text-xs text-slate-900 outline-none focus:border-primary focus:bg-white"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((item) => item.key !== image.key))}
                className="cursor-pointer mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-primary"
              >
                <i className="fi fi-rr-trash flex" aria-hidden="true" /> Remover imagem
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={hintClass}>
        Depois de enviar, indique se cada imagem é horizontal (sites e sistemas) ou vertical
        (aplicativos). A página do projeto exibe cada orientação no formato adequado.
      </p>
    </div>
  )
}
