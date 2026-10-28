'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface ProjectAdminControlsProps {
  projectId: string
  active: boolean
}

type PendingAction = 'toggle' | 'delete' | null

export function ProjectAdminControls({ projectId, active }: ProjectAdminControlsProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState<PendingAction>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function run(action: Exclude<PendingAction, null>) {
    setPending(true)
    setError('')
    try {
      const endpoint = `/api/projects/${encodeURIComponent(projectId)}`
      const response =
        action === 'toggle'
          ? await fetch(`${endpoint}/activation`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({ active: !active }),
            })
          : await fetch(endpoint, { method: 'DELETE', cache: 'no-store' })
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(result?.error ?? 'Não foi possível concluir a operação.')
      }
      setConfirming(null)
      if (action === 'delete') router.replace('/admin')
      else router.refresh()
    } catch (caught) {
      setConfirming(null)
      setError(caught instanceof Error ? caught.message : 'Ocorreu um erro. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming('toggle')}
        className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary"
      >
        <i className={`fi ${active ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} flex`} aria-hidden="true" />
        {active ? 'Desativar projeto' : 'Reativar projeto'}
      </button>
      {!active && (
        <button
          type="button"
          onClick={() => setConfirming('delete')}
          className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100"
        >
          <i className="fi fi-rr-trash flex" aria-hidden="true" />
          Excluir projeto
        </button>
      )}
      {error && (
        <p role="alert" className="basis-full text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      <ConfirmationDialog
        open={confirming === 'toggle'}
        title={active ? 'Desativar este projeto?' : 'Reativar este projeto?'}
        description={
          active
            ? 'O projeto deixa de aparecer para todos os usuários, exceto administradores. Você poderá reativá-lo depois.'
            : 'O projeto volta a ficar visível conforme a sua situação (em andamento ou concluído).'
        }
        confirmLabel={active ? 'Desativar' : 'Reativar'}
        icon={active ? 'fi-rr-eye-crossed' : 'fi-rr-eye'}
        tone={active ? 'danger' : 'primary'}
        pending={pending}
        onConfirm={() => run('toggle')}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmationDialog
        open={confirming === 'delete'}
        title="Excluir este projeto definitivamente?"
        description="Serão apagados o projeto, as tarefas e o histórico de revisões, as indicações e os favoritos. Essa ação não pode ser desfeita."
        confirmLabel="Excluir definitivamente"
        icon="fi-rr-trash"
        tone="danger"
        pending={pending}
        onConfirm={() => run('delete')}
        onCancel={() => setConfirming(null)}
      />
    </>
  )
}
