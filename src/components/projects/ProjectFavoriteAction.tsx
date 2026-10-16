'use client'

import FavoriteButton from '@/components/projects/FavoriteButton'
import { useProjectFavorites } from '@/libs/useProjectFavorites'

interface ProjectFavoriteActionProps {
  projectId: string
  projectTitle: string
  isAuthenticated: boolean
}

export default function ProjectFavoriteAction({
  projectId,
  projectTitle,
  isAuthenticated,
}: ProjectFavoriteActionProps) {
  const { favoriteIds, toggleFavorite, loading, loadError } = useProjectFavorites(isAuthenticated)

  if (!isAuthenticated) return null

  if (loadError) {
    return (
      <div className="flex max-w-[150px] shrink-0 flex-col items-end gap-1 text-right">
        <span role="status" className="text-[10px] leading-snug text-text-secondary">
          Não foi possível carregar seus favoritos.
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <FavoriteButton
      projectId={projectId}
      projectTitle={projectTitle}
      isFavorite={favoriteIds.includes(projectId)}
      onToggleFavorite={toggleFavorite}
      disabled={loading}
      showLabel
      size="md"
      className="mt-0.5"
    />
  )
}
