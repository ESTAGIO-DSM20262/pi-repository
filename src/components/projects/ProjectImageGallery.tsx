import type { ProjectImage } from '@/domain/enterprise/entities/project'

export function ProjectImageGallery({ images }: { images: ProjectImage[] }) {
  const horizontal = images.filter((image) => image.orientation === 'horizontal')
  const vertical = images.filter((image) => image.orientation === 'vertical')

  return (
    <div className="space-y-4">
      {horizontal.length > 0 && (
        <ul
          className={`grid gap-3 ${horizontal.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}
        >
          {horizontal.map((image) => (
            <li key={image.url}>
              <figure>
                <div className="aspect-video overflow-hidden rounded-xl border border-border bg-surface-secondary">
                  {/* biome-ignore lint/performance/noImgElement: imagens externas do armazenamento do projeto */}
                  <img
                    src={image.url}
                    alt={image.title || 'Imagem do projeto'}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                {image.title && (
                  <figcaption className="mt-1.5 text-xs text-text-secondary">
                    {image.title}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}

      {vertical.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-4 sm:justify-start">
          {vertical.map((image) => (
            <li key={image.url} className="w-36 sm:w-44">
              <figure>
                <div className="aspect-[9/16] overflow-hidden rounded-2xl border-4 border-slate-800 bg-surface-secondary shadow-md">
                  {/* biome-ignore lint/performance/noImgElement: imagens externas do armazenamento do projeto */}
                  <img
                    src={image.url}
                    alt={image.title || 'Tela do aplicativo'}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                {image.title && (
                  <figcaption className="mt-1.5 text-center text-xs text-text-secondary">
                    {image.title}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
