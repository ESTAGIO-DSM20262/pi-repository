import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { splitSqlStatements } from './sql-statements'

const MIGRATIONS_DIR = join(process.cwd(), 'src', 'db', 'migrations')
const TRACKING_TABLE = 'public.sql_migrations'

/**
 * Aplica, em ordem alfabética (= cronológica), os SQLs de `src/db/migrations/` que ainda não
 * constam em `public.sql_migrations`. Cada arquivo roda em uma única transação junto com o seu
 * registro de controle. Os arquivos são idempotentes, então bancos que já receberam algum deles
 * manualmente apenas passam a registrá-lo. Deve rodar depois de `drizzle-kit migrate`, que cria
 * `users` e as demais tabelas base.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')

  const sql = neon(databaseUrl)

  await sql.query(
    `CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      name text PRIMARY KEY,
      applied_at timestamp without time zone NOT NULL DEFAULT now()
    )`,
  )

  const appliedRows = (await sql.query(`SELECT name FROM ${TRACKING_TABLE}`)) as { name: string }[]
  const applied = new Set(appliedRows.map((row) => row.name))

  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort()
  const pending = files.filter((file) => !applied.has(file))

  if (pending.length === 0) {
    console.log('SQL migrations: nada pendente.')
    return
  }

  for (const file of pending) {
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8')
    const statements = splitSqlStatements(content)

    await sql.transaction((txn) => [
      ...statements.map((statement) => txn.query(statement)),
      txn.query(`INSERT INTO ${TRACKING_TABLE} (name) VALUES ($1) ON CONFLICT DO NOTHING`, [file]),
    ])

    console.log(`SQL migrations: aplicada ${file}`)
  }
}

main().catch((error) => {
  console.error('Falha ao aplicar as SQL migrations:', error)
  process.exit(1)
})
