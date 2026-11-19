import { NextResponse } from 'next/server'
import { BulkCreateProjectsUseCase } from '@/application/projects/bulk-create-projects-use-case'
import { parseProjectWorkbook } from '@/application/projects/project-import'
import { DbProjectCommandRepository } from '@/infrastructure/projects/db-project-command-repository'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
import { DbProjectUserDirectory } from '@/infrastructure/projects/db-project-user-directory'
import { auth } from '@/libs/auth'

const MAX_FILE_BYTES = 5 * 1024 * 1024

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const sessionUserId = session?.user?.id ? String(session.user.id) : ''
    if (!sessionUserId) return jsonError('É necessário entrar no sistema.', 401)

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return jsonError('Selecione uma planilha para importar.', 400)
    if (file.size === 0) return jsonError('O arquivo selecionado está vazio.', 400)
    if (file.size > MAX_FILE_BYTES) return jsonError('O arquivo ultrapassa o limite de 5 MB.', 413)
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      return jsonError('Formato não suportado. Envie .xlsx, .xls ou .csv.', 400)
    }

    let parsed: ReturnType<typeof parseProjectWorkbook>
    try {
      parsed = parseProjectWorkbook(new Uint8Array(await file.arrayBuffer()))
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : 'Não foi possível ler a planilha.',
        400,
      )
    }

    const useCase = new BulkCreateProjectsUseCase(
      new DbProjectCommandRepository(),
      new DbProjectUserDirectory(),
      new DbProjectRepository(),
    )
    const result = await useCase.execute({ sessionUserId, rows: parsed.rows })
    if (result.isLeft()) return jsonError(result.value.message, result.value.status)

    const { created, skipped, errors } = result.value
    return NextResponse.json(
      {
        summary: {
          sheets: parsed.sheetNames,
          read: parsed.rows.length + parsed.errors.length,
          created: created.length,
          skipped: skipped.length,
          invalid: parsed.errors.length + errors.length,
        },
        created,
        skipped,
        errors: [...parsed.errors, ...errors].sort(
          (first, second) =>
            first.sheet.localeCompare(second.sheet) || first.rowNumber - second.rowNumber,
        ),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[POST /api/projects/bulk]', error)
    return jsonError('Não foi possível importar os projetos. Tente novamente.', 500)
  }
}
