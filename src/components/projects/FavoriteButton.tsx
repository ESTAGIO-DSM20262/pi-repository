'use client'

import { useEffect, useState } from 'react'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'

interface FavoriteButtonProps {
  projectId: string
  projectTitle: string
  isFavorite: boolean
  onToggleFavorite: (projectId: string) => Promise<boolean>
  className?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
  disabled?: boolean
}

export default function FavoriteButton({
  projectId,
  projectTitle,
  isFavorite,
  onToggleFavorite,
  className = '',
  size = 'md',
  showLabel = false,
  disabled = false,
}: FavoriteButtonProps) {
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [animationKey, setAnimationKey] = useState(0)
  const [confirmRemovalOpen, setConfirmRemovalOpen] = useState(false)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function performToggleFavorite() {
    if (pending) return
    setPending(true)
    setNotice(null)

    try {
      const added = await onToggleFavorite(projectId)
      setAnimationKey((key) => key + 1)
      setNotice(added ? 'Projeto adicionado aos favoritos' : 'Projeto removido dos favoritos')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível atualizar os favoritos')
    } finally {
      setPending(false)
    }
  }

  function handleClick() {
    if (pending || disabled) return

    if (isFavorite) {
      setNotice(null)
      setConfirmRemovalOpen(true)
      return
    }

    void performToggleFavorite()
  }

  async function confirmRemoval() {
    await performToggleFavorite()
    setConfirmRemovalOpen(false)
  }

  const buttonSize = showLabel
    ? 'min-h-10 min-w-10 gap-2 px-3'
    : size === 'sm'
      ? 'h-8 w-8'
      : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-[17px] w-[17px]' : 'h-5 w-5'

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || disabled}
        aria-label={
          isFavorite
            ? `Remover ${projectTitle} dos favoritos`
            : `Adicionar ${projectTitle} aos favoritos`
        }
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className={`inline-flex ${buttonSize} items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-light/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 ${isFavorite && showLabel ? 'bg-primary-light/70' : ''}`}
      >
        <svg
          key={`${animationKey}-${isFavorite ? 'on' : 'off'}`}
          className={`${iconSize} ${animationKey ? (isFavorite ? 'acervo-star-added' : 'acervo-star-removed') : ''}`}
          viewBox="0 0 24 24"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3.7 14.55 8.87l5.7.83-4.12 4.02.97 5.68L12 16.72l-5.1 2.68.97-5.68-4.12-4.02 5.7-.83L12 3.7Z" />
        </svg>
        {showLabel && (
          <span className="whitespace-nowrap text-xs font-semibold">
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </span>
        )}
      </button>

      {notice && (
        <span
          key={`${animationKey}-notice`}
          role="status"
          aria-live="polite"
          className="acervo-favorite-toast absolute right-0 bottom-[calc(100%+8px)] z-50 w-max max-w-[min(280px,80vw)] rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg"
        >
          <span className="mr-1.5 text-primary" aria-hidden="true">
            {notice.startsWith('Projeto adicionado')
              ? '✓'
              : notice.startsWith('Projeto removido')
                ? '−'
                : '!'}
          </span>
          {notice}
        </span>
      )}

      <ConfirmationDialog
        open={confirmRemovalOpen}
        title="Remover dos favoritos?"
        description={`Deseja remover “${projectTitle}” da sua lista de favoritos? O projeto continuará disponível no acervo e poderá ser favoritado novamente.`}
        icon="fi-rr-star"
        tone="danger"
        confirmLabel="Remover favorito"
        cancelLabel="Manter favorito"
        pending={pending}
        onCancel={() => setConfirmRemovalOpen(false)}
        onConfirm={confirmRemoval}
      />
    </div>
  )
}
