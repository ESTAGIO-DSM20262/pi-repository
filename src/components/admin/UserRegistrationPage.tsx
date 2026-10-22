'use client'

import { type DragEvent, type FormEvent, type ReactNode, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import BackButton from '@/components/ui/BackButton'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import type { Role } from '@/domain/enterprise/entities/role'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

interface UserForm {
  name: string
  email: string
  registrationNumber: string
  course: string
}

interface Credential {
  name: string
  email: string
  role: Role
  password: string
  registrationNumber: string
  course: string
}

interface BatchResult {
  summary: { sheets: string[]; read: number; created: number; skipped: number; invalid: number }
  credentials: Credential[]
  skipped: Array<{ sheet: string; rowNumber: number; email: string; reason: string }>
  errors: Array<{ sheet: string; rowNumber: number; email?: string; reason: string }>
}

const ROLE_OPTIONS: Array<{ value: Role; label: string; icon: string }> = [
  { value: 'student', label: 'Aluno', icon: 'fi-rr-graduation-cap' },
  { value: 'professor', label: 'Professor', icon: 'fi-rr-chalkboard-user' },
  { value: 'admin', label: 'Administrador', icon: 'fi-rr-shield-check' },
]

const fieldClass =
  'mt-1.5 h-11 w-full rounded-lg border border-border bg-[#f2f3f4] px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10'
const labelClass = 'block text-xs font-semibold text-slate-800'

function RoleTabs({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <fieldset className="inline-flex max-w-full flex-wrap rounded-xl bg-[#eceeef] p-1">
      <legend className="sr-only">Perfil do novo usuário</legend>
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${value === option.value ? 'bg-primary text-white shadow-sm' : 'text-slate-700 hover:bg-white/80 hover:text-primary'}`}
        >
          <i className={`fi ${option.icon} flex text-sm`} aria-hidden="true" />
          {option.label}
        </button>
      ))}
    </fieldset>
  )
}

function Feedback({ kind, children }: { kind: 'success' | 'error' | 'info'; children: ReactNode }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3.5 py-3 text-xs leading-relaxed ${styles[kind]}`}
    >
      {children}
    </div>
  )
}

async function downloadCredentials(credentials: Credential[]) {
  const response = await fetch('/modelo-cadastro-usuarios-acervo.xlsx')
  if (!response.ok)
    throw new Error('Não foi possível carregar a planilha modelo para gerar as credenciais.')

  const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array', cellStyles: true })
  const studentsSheet = workbook.Sheets.Alunos
  const professorsSheet = workbook.Sheets.Professores
  if (!studentsSheet || !professorsSheet) {
    throw new Error('O arquivo modelo não contém as abas Alunos e Professores esperadas.')
  }

  const studentHeader = studentsSheet.D1
  studentsSheet.E1 = { ...(studentHeader ?? {}), v: 'Senha temporária', t: 's' }
  studentsSheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })
  const studentColumns = [...(studentsSheet['!cols'] ?? [])]
  studentColumns[4] = { ...(studentColumns[4] ?? {}), wch: 24 }
  studentsSheet['!cols'] = studentColumns

  const professorHeader = professorsSheet.C1
  professorsSheet.D1 = { ...(professorHeader ?? {}), v: 'Senha temporária', t: 's' }
  professorsSheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } })
  const professorColumns = [...(professorsSheet['!cols'] ?? [])]
  professorColumns[3] = { ...(professorColumns[3] ?? {}), wch: 24 }
  professorsSheet['!cols'] = professorColumns

  const studentRows = credentials
    .filter((credential) => credential.role === 'student')
    .map((credential) => [
      credential.course,
      credential.registrationNumber,
      credential.name,
      credential.email,
      credential.password,
    ])
  const professorRows = credentials
    .filter((credential) => credential.role === 'professor')
    .map((credential) => [
      credential.registrationNumber,
      credential.name,
      credential.email,
      credential.password,
    ])

  if (studentRows.length > 0) {
    XLSX.utils.sheet_add_aoa(studentsSheet, studentRows, { origin: 'A2' })
  }
  if (professorRows.length > 0) {
    XLSX.utils.sheet_add_aoa(professorsSheet, professorRows, { origin: 'A2' })
  }

  delete workbook.Sheets.Instruções
  workbook.SheetNames = ['Alunos', 'Professores']
  XLSX.writeFile(workbook, 'credenciais-provisorias-acervo.xlsx', { cellStyles: true })
}
export default function UserRegistrationPage() {
  const [role, setRole] = useState<Role>('student')
  const [form, setForm] = useState<UserForm>({
    name: '',
    email: '',
    registrationNumber: '',
    course: 'D.S.M.',
  })
  const [savingSingle, setSavingSingle] = useState(false)
  const [singleError, setSingleError] = useState('')
  const [singleCredential, setSingleCredential] = useState<Credential | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [batchError, setBatchError] = useState('')
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [batchConfirmationOpen, setBatchConfirmationOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function changeRole(nextRole: Role) {
    setRole(nextRole)
    setSingleError('')
    setSingleCredential(null)
    setForm((current) => ({
      ...current,
      course: nextRole === 'student' ? current.course || 'D.S.M.' : '',
    }))
  }

  async function submitSingle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingSingle(true)
    setSingleError('')
    setSingleCredential(null)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      })
      const data = (await response.json()) as { error?: string; credential?: Credential }
      if (!response.ok || !data.credential)
        throw new Error(data.error ?? 'Não foi possível cadastrar o usuário.')
      setSingleCredential(data.credential)
      setForm({
        name: '',
        email: '',
        registrationNumber: '',
        course: role === 'student' ? 'D.S.M.' : '',
      })
    } catch (error) {
      setSingleError(
        error instanceof Error ? error.message : 'Erro inesperado ao cadastrar usuário.',
      )
    } finally {
      setSavingSingle(false)
    }
  }

  function acceptFile(nextFile: File | null) {
    setBatchError('')
    setBatchResult(null)
    if (!nextFile) return
    if (!/\.(xlsx|xls|csv)$/i.test(nextFile.name)) {
      setBatchError('Selecione um arquivo .xlsx, .xls ou .csv.')
      setFile(null)
      return
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setBatchError('O arquivo ultrapassa o limite de 5 MB.')
      setFile(null)
      return
    }
    setFile(nextFile)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0] ?? null)
  }

  function requestBatchImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setBatchError('Selecione a planilha que deseja importar.')
      return
    }
    setBatchError('')
    setBatchConfirmationOpen(true)
  }

  async function executeBatchImport() {
    if (!file) return
    setSavingBatch(true)
    setBatchError('')
    setBatchResult(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/admin/users', { method: 'POST', body })
      const data = (await response.json()) as BatchResult & { error?: string }
      if (!response.ok || !data.summary)
        throw new Error(data.error ?? 'Não foi possível importar a planilha.')
      setBatchResult(data)
    } catch (error) {
      setBatchError(
        error instanceof Error ? error.message : 'Erro inesperado durante a importação.',
      )
    } finally {
      setSavingBatch(false)
    }
  }

  async function confirmBatchImport() {
    await executeBatchImport()
    setBatchConfirmationOpen(false)
  }

  return (
    <div className="w-full bg-background px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7 rounded-2xl border border-border bg-white p-4 shadow-sm sm:mb-9 sm:p-6">
          <div className="flex items-start gap-3">
            <BackButton href="/admin" label="Voltar ao painel administrativo" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Painel administrativo
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Cadastro de Usuários
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
                Cadastre alunos, professores ou administradores individualmente, ou importe uma
                planilha com alunos e professores.
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-5 xl:grid-cols-[1.35fr_1fr] xl:gap-6">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7 lg:p-9">
            <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <i className="fi fi-rr-user-add flex text-lg" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    Novo registro
                  </span>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  Cadastro individual de usuário
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-[13px]">
                  Crie uma conta para estudante, docente ou administrador.
                </p>
              </div>
              <RoleTabs value={role} onChange={changeRole} />
            </div>

            <form onSubmit={submitSingle} className="space-y-4">
              <label className={labelClass}>
                Nome completo <span className="text-primary">*</span>
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Ex.: Lucas Gabriel Silveira"
                />
              </label>

              <label className={labelClass}>
                E-mail <span className="text-primary">*</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder={
                    role === 'student'
                      ? 'aluno@exemplo.com'
                      : role === 'professor'
                        ? 'professor@exemplo.com'
                        : 'admin@exemplo.com'
                  }
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  {role === 'student'
                    ? 'R.A. / Registro acadêmico'
                    : role === 'professor'
                      ? 'Matrícula funcional'
                      : 'Registro (opcional)'}{' '}
                  {role !== 'admin' && <span className="text-primary">*</span>}
                  <input
                    required={role !== 'admin'}
                    value={form.registrationNumber}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, registrationNumber: event.target.value }))
                    }
                    className={fieldClass}
                    placeholder={
                      role === 'student'
                        ? 'Ex.: 2571392622028'
                        : role === 'professor'
                          ? 'Ex.: 60610'
                          : 'Opcional'
                    }
                  />
                </label>
                {role === 'student' ? (
                  <label className={labelClass}>
                    Curso tecnológico <span className="text-primary">*</span>
                    <input
                      required
                      value={form.course}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, course: event.target.value }))
                      }
                      className={fieldClass}
                      placeholder="Ex.: D.S.M."
                    />
                  </label>
                ) : (
                  <div className="flex min-h-[68px] items-center rounded-lg border border-border-light bg-surface-secondary/65 px-3.5 py-3 text-xs leading-relaxed text-text-secondary">
                    <i
                      className="fi fi-rr-shield-check mr-2 flex shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    Perfil atribuído:{' '}
                    <strong className="ml-1 text-slate-800">{ROLE_LABEL[role]}</strong>
                  </div>
                )}
              </div>

              {singleError && <Feedback kind="error">{singleError}</Feedback>}

              {singleCredential && (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-2.5">
                    <i
                      className="fi fi-rr-check-circle mt-0.5 flex text-lg text-emerald-700"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-950">
                        Usuário cadastrado com sucesso
                      </p>
                      <p className="mt-1 break-all text-xs text-emerald-900">
                        {singleCredential.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg border border-emerald-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                        Senha temporária
                      </p>
                      <code className="mt-1 block break-all text-sm font-semibold text-slate-900">
                        {singleCredential.password}
                      </code>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void navigator.clipboard.writeText(singleCredential.password)
                        }
                        className="cursor-pointer inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-slate-700 transition hover:bg-surface-secondary"
                      >
                        <i className="fi fi-rr-copy flex" aria-hidden="true" /> Copiar senha
                      </button>
                      {singleCredential.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            void downloadCredentials([singleCredential]).catch((error: unknown) => {
                              setSingleError(
                                error instanceof Error
                                  ? error.message
                                  : 'Não foi possível gerar a planilha de credenciais.',
                              )
                            })
                          }}
                          className="cursor-pointer inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-hover"
                        >
                          <i className="fi fi-rr-download flex" aria-hidden="true" /> Baixar .xlsx
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-900">
                    Copie e entregue a senha ao usuário por um canal seguro. O sistema ainda não tem
                    envio de e-mail configurado e esta senha não será exibida novamente após sair
                    desta tela.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-[11px] leading-relaxed text-text-secondary">
                  A senha temporária é gerada automaticamente e armazenada apenas em formato hash.
                </p>
                <button
                  type="submit"
                  disabled={savingSingle}
                  className="cursor-pointer inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
                >
                  <i
                    className={`fi ${savingSingle ? 'fi-rr-spinner' : 'fi-rr-user-add'} flex`}
                    aria-hidden="true"
                  />
                  {savingSingle ? 'Cadastrando…' : 'Concluir cadastro'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-emerald-800">
                <i className="fi fi-rr-file-spreadsheet flex text-lg" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                  Importação em lote
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                Importar planilha do SIGA
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-[13px]">
                A importação reconhece automaticamente as abas <strong>Alunos</strong> e{' '}
                <strong>Professores</strong> do modelo enviado.
              </p>
            </div>

            <form onSubmit={requestBatchImport} className="space-y-4">
              <section
                aria-label="Área para importar planilha de usuários"
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? 'border-primary bg-primary-light/50' : 'border-border bg-[#f2f3f4] hover:border-primary/40'}`}
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <i className="fi fi-rr-file-upload flex text-xl" aria-hidden="true" />
                </span>
                {file ? (
                  <>
                    <p className="max-w-full break-all text-sm font-semibold text-slate-900">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {(file.size / 1024).toFixed(0)} KB • pronto para importar
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setBatchResult(null)
                      }}
                      className="cursor-pointer mt-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Remover arquivo
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900">
                      Arraste a planilha ou selecione um arquivo
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-secondary">
                      Formatos aceitos: Excel (.xlsx, .xls) ou CSV. Limite de 5 MB e 500 registros
                      por lote.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                    >
                      Selecionar arquivo
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(event) => {
                    acceptFile(event.target.files?.[0] ?? null)
                    event.currentTarget.value = ''
                  }}
                  aria-label="Selecionar planilha de usuários"
                />
              </section>

              <div className="rounded-xl bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">Colunas reconhecidas</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
                    <i className="fi fi-rr-check-circle flex" aria-hidden="true" /> Modelo DSM
                    compatível
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-text-secondary">
                  <p>
                    <strong className="text-slate-800">Aba Alunos:</strong> Curso · RA · Nome Aluno
                    · E-mail
                  </p>
                  <p>
                    <strong className="text-slate-800">Aba Professores:</strong> Matrícula ·
                    Professores DSM · E-mail
                  </p>
                </div>
              </div>

              <Feedback kind="info">
                Os e-mails existentes serão ignorados para evitar duplicidade. As senhas temporárias
                dos novos usuários ficam disponíveis para baixar ao final; o sistema ainda não envia
                e-mails automaticamente.
              </Feedback>
              {batchError && <Feedback kind="error">{batchError}</Feedback>}

              {batchResult && (
                <div className="space-y-3 rounded-xl border border-border bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Importação finalizada</p>
                    <p className="mt-1 text-[11px] text-text-secondary">
                      Abas: {batchResult.summary.sheets.join(', ') || '—'} · Linhas lidas:{' '}
                      {batchResult.summary.read}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-emerald-50 p-2.5">
                      <p className="text-lg font-bold text-emerald-800">
                        {batchResult.summary.created}
                      </p>
                      <p className="text-[10px] text-emerald-900">Criados</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2.5">
                      <p className="text-lg font-bold text-amber-800">
                        {batchResult.summary.skipped}
                      </p>
                      <p className="text-[10px] text-amber-900">Ignorados</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2.5">
                      <p className="text-lg font-bold text-rose-800">
                        {batchResult.summary.invalid}
                      </p>
                      <p className="text-[10px] text-rose-900">Inválidos</p>
                    </div>
                  </div>
                  {batchResult.credentials.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        void downloadCredentials(batchResult.credentials).catch(
                          (error: unknown) => {
                            setBatchError(
                              error instanceof Error
                                ? error.message
                                : 'Não foi possível gerar a planilha de credenciais.',
                            )
                          },
                        )
                      }}
                      className="cursor-pointer inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
                    >
                      <i className="fi fi-rr-download flex" aria-hidden="true" /> Baixar{' '}
                      {batchResult.credentials.length} credenciais (.xlsx)
                    </button>
                  )}
                  {batchResult.errors.length > 0 && (
                    <details className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-rose-900">
                        Ver linhas que precisam de correção ({batchResult.errors.length})
                      </summary>
                      <ul className="mt-2 max-h-44 space-y-2 overflow-auto text-[11px] leading-relaxed text-rose-900">
                        {batchResult.errors.slice(0, 50).map((item) => (
                          <li key={`${item.sheet}-${item.rowNumber}`}>
                            <strong>
                              {item.sheet}, linha {item.rowNumber}:
                            </strong>{' '}
                            {item.email ? `${item.email} — ` : ''}
                            {item.reason}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {batchResult.skipped.length > 0 && (
                    <details className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-amber-900">
                        Ver registros ignorados ({batchResult.skipped.length})
                      </summary>
                      <ul className="mt-2 max-h-36 space-y-1.5 overflow-auto text-[11px] leading-relaxed text-amber-900">
                        {batchResult.skipped.slice(0, 50).map((item) => (
                          <li key={`${item.sheet}-${item.rowNumber}`}>
                            <strong>
                              {item.sheet}, linha {item.rowNumber}:
                            </strong>{' '}
                            {item.email} — {item.reason}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href="/modelo-cadastro-usuarios-acervo.xlsx"
                  download
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-primary-hover"
                >
                  <i className="fi fi-rr-download flex" aria-hidden="true" /> Baixar modelo
                  padronizado (.xlsx)
                </a>
                <button
                  type="submit"
                  disabled={!file || savingBatch}
                  className="cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#e5e7e9] px-4 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i
                    className={`fi ${savingBatch ? 'fi-rr-spinner' : 'fi-rr-file-import'} flex`}
                    aria-hidden="true"
                  />
                  {savingBatch ? 'Importando…' : 'Importar usuários'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <ConfirmationDialog
        open={batchConfirmationOpen}
        title="Confirmar importação em lote?"
        description={`A planilha “${file?.name ?? 'selecionada'}” será processada agora. Contas novas serão criadas, e e-mails que já existem serão ignorados. O lote pode conter até 500 registros; confira se o arquivo correto foi selecionado. As senhas temporárias dos usuários criados precisarão ser guardadas e entregues por um canal seguro.`}
        icon="fi-rr-file-import"
        tone="primary"
        confirmLabel="Importar usuários"
        cancelLabel="Revisar arquivo"
        pending={savingBatch}
        onCancel={() => setBatchConfirmationOpen(false)}
        onConfirm={confirmBatchImport}
      />
    </div>
  )
}
