'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function focusTarget(resolve: () => HTMLElement | null) {
  const target = resolve()
  if (!target) return
  target.scrollIntoView({ block: 'start' })
  target.focus()
}

function findVisibleMenuLink(): HTMLElement | null {
  const menus = document.querySelectorAll<HTMLElement>('nav[aria-label="Menu principal"]')
  for (const menu of menus) {
    if (menu.getClientRects().length === 0) continue
    const link = menu.querySelector<HTMLElement>('a, button')
    if (link) return link
  }
  return null
}

export function SkipLinks() {
  const pathname = usePathname()
  const [hasSearch, setHasSearch] = useState(false)

  useEffect(() => {
    setHasSearch(pathname !== null && document.getElementById('busca-projetos') !== null)
  }, [pathname])

  return (
    <nav className="skip-links" aria-label="Atalhos de acessibilidade">
      <button
        type="button"
        onClick={() => focusTarget(() => document.getElementById('main-content'))}
      >
        Ir para o conteúdo principal
      </button>
      <button type="button" onClick={() => focusTarget(findVisibleMenuLink)}>
        Ir para o menu principal
      </button>
      {hasSearch && (
        <button
          type="button"
          onClick={() => focusTarget(() => document.getElementById('busca-projetos'))}
        >
          Ir para a busca de projetos
        </button>
      )}
    </nav>
  )
}
