'use client'

import Link from 'next/link'
import { type DragEvent, type FormEvent, type ReactNode, useRef, useState } from 'react'
import { MAX_PROJECT_IMPORT_ROWS } from '@/application/projects/project-import-limits'
import { BackButton } from '@/components/ui/BackButton'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface ProjectBulkImportPageProps {
  role: 'professor' | 'admin'
  backHref: string
}

interface ImportRowReport {
  sheet: string
  rowNumber: number
  title: string
}

interface ImportRowIssue extends ImportRowReport {
  reason: string
}

interface BatchResult {
  summary: { sheets: string[]; read: number; created: number; skipped: number; invalid: number }
  created: Array<ImportRowReport & { id: string }>
  skipped: ImportRowIssue[]
  errors: ImportRowIssue[]
}

const MAX_FILE_BYTES = 5 * 1024 * 1024
const TEMPLATE_HREF = '/modelo-cadastro-projetos-acervo.xlsx'

const REQUIRED_COLUMNS = [
  'Título do projeto',
  'Resumo',
  'Ciclo',
  'Semestre',
  'Tema',
  'E-mails dos alunos',
]

const OPTIONAL_COLUMNS = [
  'Descrição detalhada',
  'Situação',
  'Orientadores adicionais',
  'Líder do grupo',
  'Linguagens',
  'Tecnologias e ferramentas',
  'Repositório',
  'Site no ar',
  'Protótipo',
  'Vídeo do projeto',
]

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

function ColumnChips({ columns, required }: { columns: string[]; required: boolean }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {columns.map((column) => (
        <li
          key={column}
          className={`rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold ${required ? 'border-primary/25 bg-primary-light text-primary' : 'border-border bg-white text-slate-700'}`}
        >
          {column}
        </li>
      ))}
    </ul>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary-light text-xs font-bold text-primary">
        {number}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{children}</p>
      </div>
    </li>
  )
}

function IssueList({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'rose' | 'amber'
  items: ImportRowIssue[]
}) {
  if (items.length === 0) return null
  const styles = {
    rose: {
      box: 'border-rose-100 bg-rose-50/60',
      text: 'text-rose-900',
      scroll: 'scrollbar-danger',
    },
    amber: {
      box: 'border-amber-100 bg-amber-50/60',
      text: 'text-amber-900',
      scroll: 'scrollbar-warning',
    },
  }[tone]

  return (
    <details className={`rounded-lg border p-3 ${styles.box}`}>
      <summary className={`cursor-pointer text-xs font-semibold ${styles.text}`}>
        {title} ({items.length})
      </summary>
      <ul
        className={`${styles.scroll} mt-2 max-h-44 space-y-2 overflow-auto pr-1 text-[0.6875rem] leading-relaxed ${styles.text}`}
      >
        {items.slice(0, 100).map((item) => (
          <li key={`${item.sheet}-${item.rowNumber}`}>
            <strong>
              {item.sheet}, linha {item.rowNumber}:
            </strong>{' '}
            {item.title ? `${item.title} — ` : ''}
            {item.reason}
          </li>
        ))}
      </ul>
    </details>
  )
}

export function ProjectBulkImportPage({ role, backHref }: ProjectBulkImportPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BatchResult | null>(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = role === 'admin'

  function acceptFile(nextFile: File | null) {
    setError('')
    setResult(null)
    if (!nextFile) return
    if (!/\.(xlsx|xls|csv)$/i.test(nextFile.name)) {
      setError('Selecione um arquivo .xlsx, .xls ou .csv.')
      setFile(null)
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError('O arquivo ultrapassa o limite de 5 MB.')
      setFile(null)
      return
    }
    setFile(nextFile)
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0] ?? null)
  }

  function requestImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Selecione a planilha que deseja importar.')
      return
    }
    setError('')
    setConfirmationOpen(true)
  }

  async function executeImport() {
    if (!file) return
    setSaving(true)
    setError('')
    setResult(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/projects/bulk', { method: 'POST', body })
      const data = (await response.json()) as BatchResult & { error?: string }
      if (!response.ok || !data.summary) {
        throw new Error(data.error ?? 'Não foi possível importar a planilha.')
      }
      setResult(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado durante a importação.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmImport() {
    await executeImport()
    setConfirmationOpen(false)
  }

  return (
    <div className="w-full bg-background px-3 py-5 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 rounded-2xl border border-border bg-white p-3.5 shadow-sm sm:mb-9 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <BackButton href={backHref} label="Voltar ao painel" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">
                {isAdmin ? 'Painel administrativo' : 'Painel do professor'}
              </p>
              <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Cadastro de Projetos em Massa
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
                Baixe a planilha modelo, preencha um projeto por linha e envie o arquivo para
                cadastrar vários projetos de uma só vez.
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-5 xl:grid-cols-[1.35fr_1fr] xl:gap-6">
          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-7 lg:p-9">
            <div className="mb-7 max-w-xl">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <i className="fi fi-rr-file-import flex text-lg" aria-hidden="true" />
                <span className="text-xs font-semibold">Importação por planilha</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                Enviar planilha de projetos
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-[0.8125rem]">
                Cada linha preenchida vira um projeto. Linhas com problema não impedem as demais.
              </p>
            </div>

            <form onSubmit={requestImport} className="space-y-4">
              <section
                aria-label="Área para importar planilha de projetos"
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? 'border-primary bg-primary-light/50' : 'border-border bg-[#f2f3f4] hover:border-primary/40'}`}
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm">
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
                        setResult(null)
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
                      Formatos aceitos: Excel (.xlsx, .xls) ou CSV. Limite de 5 MB e{' '}
                      {MAX_PROJECT_IMPORT_ROWS} projetos por envio.
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
                  aria-label="Selecionar planilha de projetos"
                />
              </section>

              <Feedback kind="info">
                Projetos com o mesmo título, período letivo e semestre de um já cadastrado são
                ignorados, e os alunos e professores informados precisam estar ativos no sistema.
              </Feedback>
              {error && <Feedback kind="error">{error}</Feedback>}

              {result && (
                <div className="space-y-3 rounded-xl border border-border bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Importação finalizada</p>
                    <p className="mt-1 text-[0.6875rem] text-text-secondary">
                      Abas: {result.summary.sheets.join(', ') || '—'} · Linhas lidas:{' '}
                      {result.summary.read}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-emerald-50 p-2.5">
                      <p className="text-lg font-bold text-emerald-800">{result.summary.created}</p>
                      <p className="text-[0.625rem] text-emerald-900">Criados</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2.5">
                      <p className="text-lg font-bold text-amber-800">{result.summary.skipped}</p>
                      <p className="text-[0.625rem] text-amber-900">Ignorados</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2.5">
                      <p className="text-lg font-bold text-rose-800">{result.summary.invalid}</p>
                      <p className="text-[0.625rem] text-rose-900">Inválidos</p>
                    </div>
                  </div>
                  {result.created.length > 0 && (
                    <details className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-emerald-900">
                        Ver projetos criados ({result.created.length})
                      </summary>
                      <ul className="scrollbar-success mt-2 max-h-36 space-y-1.5 overflow-auto pr-1 text-[0.6875rem] leading-relaxed text-emerald-900">
                        {result.created.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/projetos/${encodeURIComponent(item.id)}`}
                              className="font-semibold underline-offset-2 hover:underline"
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <IssueList
                    title="Ver linhas que precisam de correção"
                    tone="rose"
                    items={result.errors}
                  />
                  <IssueList title="Ver projetos ignorados" tone="amber" items={result.skipped} />
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={TEMPLATE_HREF}
                  download
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-primary-hover"
                >
                  <i className="fi fi-rr-download flex" aria-hidden="true" /> Baixar modelo
                  padronizado (.xlsx)
                </a>
                <button
                  type="submit"
                  disabled={!file || saving}
                  className="cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i
                    className={`fi ${saving ? 'fi-rr-spinner animate-spin' : 'fi-rr-file-import'} flex`}
                    aria-hidden="true"
                  />
                  {saving ? 'Importando…' : 'Importar projetos'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-7 lg:p-9">
            <div className="mb-6 flex items-center gap-2 text-primary">
              <i className="fi fi-rr-list-check flex text-lg" aria-hidden="true" />
              <span className="text-xs font-semibold">Como preencher</span>
            </div>

            <ol className="space-y-4">
              <Step number={1} title="Baixe o modelo">
                A planilha já vem com a aba Projetos, uma aba Instruções com exemplos de cada coluna
                e uma aba Listas com todas as opções das listas suspensas.
              </Step>
              <Step number={2} title="Preencha um projeto por linha">
                Colunas com título vermelho são obrigatórias. Ciclo, Semestre, Tema, Situação,
                Linguagens e Tecnologias têm uma lista para escolher na própria célula; em Tema,
                Linguagens e Tecnologias você também pode digitar um valor que não esteja na lista.
              </Step>
              <Step number={3} title="Envie e confira o relatório">
                Ao final, você vê quantos projetos foram criados, ignorados por duplicidade ou
                rejeitados, com o motivo de cada linha.
              </Step>
            </ol>

            <div className="mt-7 rounded-xl bg-surface-secondary p-4">
              <p className="text-xs font-semibold text-slate-900">Colunas obrigatórias</p>
              <ColumnChips columns={REQUIRED_COLUMNS} required />
              <p className="mt-4 text-xs font-semibold text-slate-900">Colunas opcionais</p>
              <ColumnChips columns={OPTIONAL_COLUMNS} required={false} />
            </div>

            <div className="mt-4 space-y-2 text-[0.6875rem] leading-relaxed text-text-secondary">
              {isAdmin ? (
                <p>
                  <strong className="text-slate-800">Orientador principal:</strong> como
                  administrador, informe na planilha o e-mail do professor orientador de cada
                  projeto.
                </p>
              ) : (
                <p>
                  <strong className="text-slate-800">Orientador principal:</strong> você será o
                  orientador principal de todos os projetos importados. Deixe a coluna em branco.
                </p>
              )}
              <p>
                <strong className="text-slate-800">Imagens e tarefas</strong> não fazem parte da
                planilha. Adicione-as depois, na tela de cada projeto.
              </p>
            </div>
          </section>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmationOpen}
        title="Confirmar importação de projetos?"
        description={`A planilha “${file?.name ?? 'selecionada'}” será processada agora. Projetos novos serão criados e os que já existem com o mesmo título, período letivo e semestre serão ignorados. O envio pode conter até ${MAX_PROJECT_IMPORT_ROWS} projetos; confira se o arquivo correto foi selecionado.`}
        icon="fi-rr-file-import"
        tone="primary"
        confirmLabel="Importar projetos"
        cancelLabel="Revisar arquivo"
        pending={saving}
        onCancel={() => setConfirmationOpen(false)}
        onConfirm={confirmImport}
      />
    </div>
  )
}
