'use client'

import { useCallback, useEffect, useState } from 'react'

interface FavoriteListResponse {
  favoriteIds?: unknown
  error?: string
}

export function useProjectFavorites(enabled: boolean) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(enabled)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!enabled) {
      setFavoriteIds([])
      setLoading(false)
      setLoadError(null)
      return () => {
        active = false
      }
    }

    setLoading(true)
    setLoadError(null)

    fetch('/api/favorites', { method: 'GET', cache: 'no-store' })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as FavoriteListResponse
        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível carregar os favoritos.')
        }
        const ids = Array.isArray(data.favoriteIds)
          ? data.favoriteIds.filter((id): id is string => typeof id === 'string')
          : []
        if (active) setFavoriteIds(ids)
      })
      .catch((error: unknown) => {
        if (!active) return
        setFavoriteIds([])
        setLoadError(
          error instanceof Error ? error.message : 'Não foi possível carregar os favoritos.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [enabled])

  const toggleFavorite = useCallback(
    async (projectId: string): Promise<boolean> => {
      if (!enabled) throw new Error('Entre no sistema para guardar favoritos.')

      const wasFavorite = favoriteIds.includes(projectId)
      const nextFavorite = !wasFavorite

      setFavoriteIds((current) => {
        const alreadyFavorite = current.includes(projectId)
        if (nextFavorite) return alreadyFavorite ? current : [...current, projectId]
        return alreadyFavorite ? current.filter((id) => id !== projectId) : current
      })

      try {
        const response = await fetch(
          nextFavorite
            ? '/api/favorites'
            : `/api/favorites?projectId=${encodeURIComponent(projectId)}`,
          {
            method: nextFavorite ? 'POST' : 'DELETE',
            headers: nextFavorite ? { 'Content-Type': 'application/json' } : undefined,
            body: nextFavorite ? JSON.stringify({ projectId }) : undefined,
            cache: 'no-store',
          },
        )

        const data = (await response.json().catch(() => ({}))) as FavoriteListResponse
        if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar os favoritos.')
        return nextFavorite
      } catch (error) {
        setFavoriteIds((current) => {
          const currentlyFavorite = current.includes(projectId)
          if (wasFavorite) return currentlyFavorite ? current : [...current, projectId]
          return currentlyFavorite ? current.filter((id) => id !== projectId) : current
        })
        throw error
      }
    },
    [enabled, favoriteIds],
  )

  return { favoriteIds, loading, loadError, toggleFavorite }
}
