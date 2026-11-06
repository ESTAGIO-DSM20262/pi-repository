import { describe, expect, it } from 'vitest'
import { splitSqlStatements } from './sql-statements'

describe('splitSqlStatements', () => {
  it('separa comandos simples e ignora comentários soltos', () => {
    const result = splitSqlStatements(
      '-- cabeçalho\nCREATE TABLE a (id text);\n--> statement-breakpoint\nCREATE INDEX i ON a (id);\n-- fim',
    )
    expect(result).toEqual([
      '-- cabeçalho\nCREATE TABLE a (id text);',
      '--> statement-breakpoint\nCREATE INDEX i ON a (id);',
    ])
  })

  it('não divide ponto e vírgula dentro de blocos $$ nem de strings', () => {
    const result = splitSqlStatements(
      "DO $$\nBEGIN\n  RAISE NOTICE 'a;b';\nEND $$;\nINSERT INTO t VALUES ('x;''y');",
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toContain("RAISE NOTICE 'a;b';")
    expect(result[1]).toBe("INSERT INTO t VALUES ('x;''y');")
  })

  it('remove BEGIN e COMMIT, pois cada arquivo já roda em uma transação', () => {
    const result = splitSqlStatements('BEGIN;\nCREATE TABLE a (id text);\nCOMMIT;\n')
    expect(result).toEqual(['CREATE TABLE a (id text);'])
  })

  it('aceita quebras de linha CRLF', () => {
    expect(splitSqlStatements('SELECT 1;\r\nSELECT 2;\r\n')).toEqual(['SELECT 1;', 'SELECT 2;'])
  })
})
