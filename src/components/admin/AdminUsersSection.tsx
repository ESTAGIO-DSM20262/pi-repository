'use client'

import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Pagination from '@/components/projects/Pagination'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import SelectDropdown from '@/components/ui/SelectDropdown'
import type { Role } from '@/domain/enterprise/entities/role'
import { getNameInitials } from '@/libs/initials'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

interface AdminUserRecord {
  id: string
  name: string
  email: string
  role: Role
  registrationNumber: string | null
  course: string | null
  active: boolean
  createdAt?: string | Date
}

interface EditForm {
  name: string
  email: string
  registrationNumber: string
  course: string
  role: Role
}

const PROFILE_STYLES: Record<Role, string> = {
  student: 'bg-slate-100 text-slate-700',
  professor: 'bg-rose-100 text-rose-900',
  admin: 'bg-slate-800 text-white',
}
const PAGE_SIZE = 5
const inputClass =
  'mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  return payload.error ?? fallback
}

export default function AdminUsersSection({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminUserRecord | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    email: '',
    registrationNumber: '',
    course: '',
    role: 'student',
  })
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [pendingDeactivation, setPendingDeactivation] = useState<AdminUserRecord | null>(null)
  const [pendingActivation, setPendingActivation] = useState<AdminUserRecord | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!response.ok)
        throw new Error(await readError(response, 'Não foi possível carregar os usuários.'))
      const payload = (await response.json()) as { users: AdminUserRecord[] }
      setUsers(Array.isArray(payload.users) ? payload.users : [])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Falha ao carregar usuários do banco.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    return users.filter((user) => {
      const matchesText =
        !normalized ||
        `${user.name} ${user.registrationNumber ?? ''} ${user.email}`
          .toLocaleLowerCase('pt-BR')
          .includes(normalized)
      return matchesText && (roleFilter === 'all' || user.role === roleFilter)
    })
  }, [users, query, roleFilter])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visibleUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function openEdit(user: AdminUserRecord) {
    setEditing(user)
    setEditForm({
      name: user.name,
      email: user.email,
      registrationNumber: user.registrationNumber ?? '',
      course: user.course ?? '',
      role: user.role,
    })
    setActionError('')
    setNotice('')
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setSaving(true)
    setActionError('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...editForm }),
      })
      if (!response.ok)
        throw new Error(await readError(response, 'Não foi possível atualizar o usuário.'))
      setEditing(null)
      setNotice('Dados do usuário atualizados no banco de dados.')
      await loadUsers()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao atualizar usuário.')
    } finally {
      setSaving(false)
    }
  }

  async function changeUserStatus(user: AdminUserRecord, active: boolean) {
    setChangingStatus(true)
    setActionError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active }),
      })
      if (!response.ok)
        throw new Error(await readError(response, 'Não foi possível atualizar o status.'))
      setNotice(
        active
          ? 'Usuário reativado.'
          : 'Usuário desativado. As sessões existentes foram encerradas.',
      )
      setPendingDeactivation(null)
      setPendingActivation(null)
      await loadUsers()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao alterar status do usuário.')
      setPendingDeactivation(null)
      setPendingActivation(null)
    } finally {
      setChangingStatus(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-6 w-2 shrink-0 rounded-full bg-slate-600" aria-hidden="true" />
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              <i className="fi fi-rr-users flex text-base text-primary" aria-hidden="true" />
              Base de Usuários e Permissões
            </h2>
            <p className="mt-0.5 text-xs text-[#765e58] sm:text-[13px]">
              Usuários cadastrados no banco do Acervo Acadêmico.
            </p>
          </div>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#303234] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <i className="fi fi-rr-user-add flex text-sm" aria-hidden="true" /> Cadastrar Usuários
        </Link>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
        >
          {notice}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900"
        >
          {actionError}
        </div>
      )}
      {loadError && (
        <div
          role="alert"
          className="mb-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs leading-relaxed text-rose-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="cursor-pointer h-9 shrink-0 rounded-lg border border-rose-200 bg-white px-3 font-semibold text-rose-900 hover:bg-rose-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
          <span className="sr-only">Buscar por nome, RA ou e-mail</span>
          <i
            className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#765e58]"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nome, RA ou e-mail..."
            className="h-10 w-full rounded-lg border border-transparent bg-[#f2f3f4] pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
        </label>
        <div className="sm:w-[190px]">
          <SelectDropdown
            value={roleFilter}
            ariaLabel="Filtrar por perfil"
            size="compact"
            tone="muted"
            width="full"
            options={[
              { value: 'all', label: 'Todos os perfis' },
              { value: 'student', label: 'Aluno' },
              { value: 'professor', label: 'Professor' },
              { value: 'admin', label: 'Administrador' },
            ]}
            onChange={(value) => {
              setRoleFilter(value as 'all' | Role)
              setPage(1)
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setQuery('')
            setRoleFilter('all')
            setPage(1)
          }}
          title="Limpar filtros da listagem"
          aria-label="Limpar filtros da listagem"
          className="cursor-pointer inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f2f3f4] text-[#765e58] transition hover:bg-primary-light hover:text-primary"
        >
          <i className="fi fi-rr-settings-sliders flex" aria-hidden="true" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-light">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="bg-[#f1f2f3] text-[10px] font-bold uppercase tracking-wide text-slate-800">
            <tr>
              <th className="px-4 py-3.5">Usuário / Nome</th>
              <th className="px-4 py-3.5">R.A. / Registro acadêmico</th>
              <th className="px-4 py-3.5">E-mail</th>
              <th className="px-4 py-3.5">Perfil</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-secondary">
                  <i
                    className="fi fi-rr-spinner mr-2 inline-flex animate-spin"
                    aria-hidden="true"
                  />
                  Carregando usuários do banco…
                </td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-surface-secondary/70">
                  <td className="px-4 py-3">
                    <div className="flex min-w-[170px] items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${user.role === 'student' ? 'bg-rose-100 text-primary' : user.role === 'professor' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800'}`}
                      >
                        {getNameInitials(user.name)}
                      </span>
                      <span className="font-semibold text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {user.registrationNumber || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#765e58]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold ${PROFILE_STYLES[user.role]}`}
                    >
                      {ROLE_LABEL[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${user.active ? 'text-emerald-800' : 'text-slate-500'}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-emerald-700' : 'bg-slate-400'}`}
                      />
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[#765e58]">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        title="Editar usuário"
                        aria-label={`Editar ${user.name}`}
                        className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-primary-light hover:text-primary"
                      >
                        <i className="fi fi-rr-pencil flex" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNotice('O histórico de auditoria ainda não está implementado.')
                        }
                        title="Ver histórico"
                        aria-label={`Ver histórico de ${user.name}`}
                        className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-primary-light hover:text-primary"
                      >
                        <i className="fi fi-rr-time-past flex" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (user.active) setPendingDeactivation(user)
                          else setPendingActivation(user)
                        }}
                        disabled={changingStatus || (user.active && user.id === currentUserId)}
                        title={
                          user.active
                            ? user.id === currentUserId
                              ? 'Você não pode desativar sua própria conta'
                              : 'Desativar usuário'
                            : 'Reativar usuário'
                        }
                        aria-label={`${user.active ? 'Desativar' : 'Reativar'} ${user.name}`}
                        className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <i
                          className={`fi ${user.active ? 'fi-rr-ban' : 'fi-rr-check-circle'} flex`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && !loadError && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-secondary">
                  Nenhum usuário encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Pagination
          page={safePage}
          pageSize={PAGE_SIZE}
          total={filteredUsers.length}
          onChange={setPage}
        />
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fechar edição de usuário"
            className="absolute inset-0 cursor-default"
            onMouseDown={() => {
              if (!saving) setEditing(null)
            }}
            onClick={(event) => {
              if (event.detail === 0 && !saving) setEditing(null)
            }}
          />
          <form
            onSubmit={saveEdit}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Gestão de usuários
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Editar usuário</h3>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(null)}
                aria-label="Fechar"
                className="cursor-pointer rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Nome completo
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                E-mail
                <input
                  required
                  type="email"
                  disabled={editing.id === currentUserId}
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
                />
                {editing.id === currentUserId && (
                  <span className="mt-1 block text-[10px] font-normal text-text-muted">
                    Por segurança, altere seu e-mail por outro administrador.
                  </span>
                )}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  R.A. / Matrícula
                  <input
                    value={editForm.registrationNumber}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        registrationNumber: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Curso
                  <input
                    value={editForm.course}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, course: event.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-700">Perfil</span>
                {editing.id === currentUserId ? (
                  <div className={`${inputClass} flex items-center bg-slate-100 text-slate-500`}>
                    {ROLE_LABEL[editForm.role]}
                  </div>
                ) : (
                  <SelectDropdown
                    value={editForm.role}
                    ariaLabel="Perfil do usuário"
                    width="full"
                    tone="muted"
                    className="mt-1.5"
                    options={[
                      { value: 'student', label: 'Aluno' },
                      { value: 'professor', label: 'Professor' },
                      { value: 'admin', label: 'Administrador' },
                    ]}
                    onChange={(value) =>
                      setEditForm((current) => ({ ...current, role: value as Role }))
                    }
                  />
                )}
                {editing.id === currentUserId && (
                  <span className="mt-1 block text-[10px] font-normal text-text-muted">
                    Seu próprio perfil não pode ser alterado aqui.
                  </span>
                )}
              </div>
            </div>
            {actionError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900"
              >
                {actionError}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(null)}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationDialog
        open={pendingDeactivation !== null}
        title="Desativar usuário?"
        description={
          pendingDeactivation
            ? `A conta de ${pendingDeactivation.name} perderá acesso ao sistema e as sessões existentes serão encerradas. O cadastro será mantido e poderá ser reativado por um administrador.`
            : ''
        }
        icon="fi-rr-ban"
        tone="danger"
        confirmLabel="Desativar usuário"
        cancelLabel="Manter usuário ativo"
        pending={changingStatus}
        onCancel={() => setPendingDeactivation(null)}
        onConfirm={() =>
          pendingDeactivation ? changeUserStatus(pendingDeactivation, false) : undefined
        }
      />

      <ConfirmationDialog
        open={pendingActivation !== null}
        title="Reativar conta?"
        description={
          pendingActivation
            ? `A conta de ${pendingActivation.name} será reativada e poderá voltar a acessar o Acervo Acadêmico. Deseja continuar?`
            : ''
        }
        icon="fi-rr-check-circle"
        tone="primary"
        confirmLabel="Reativar conta"
        cancelLabel="Manter inativa"
        pending={changingStatus}
        onCancel={() => setPendingActivation(null)}
        onConfirm={() =>
          pendingActivation ? changeUserStatus(pendingActivation, true) : undefined
        }
      />
    </section>
  )
}
