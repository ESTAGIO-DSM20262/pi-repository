const TRANSACTION_CONTROL = new Set(['BEGIN', 'COMMIT'])

function stripLineComments(statement: string) {
  return statement.replace(/--[^\n]*/g, '').trim()
}

/**
 * Divide um arquivo SQL em comandos individuais, respeitando strings, comentários e blocos
 * `$$ ... $$` (funções e DO). Remove `BEGIN`/`COMMIT`, pois o executor já usa uma transação
 * por arquivo, e descarta trechos que são apenas comentários.
 */
export function splitSqlStatements(content: string) {
  const sql = content.replace(/\r\n/g, '\n')
  const statements: string[] = []
  let current = ''
  let inDollarBlock = false
  let index = 0

  while (index < sql.length) {
    const char = sql[index]

    if (!inDollarBlock && sql.startsWith('--', index)) {
      const end = sql.indexOf('\n', index)
      const stop = end === -1 ? sql.length : end
      current += sql.slice(index, stop)
      index = stop
      continue
    }

    if (!inDollarBlock && sql.startsWith('/*', index)) {
      const end = sql.indexOf('*/', index + 2)
      const stop = end === -1 ? sql.length : end + 2
      current += sql.slice(index, stop)
      index = stop
      continue
    }

    if (sql.startsWith('$$', index)) {
      inDollarBlock = !inDollarBlock
      current += '$$'
      index += 2
      continue
    }

    if (!inDollarBlock && char === "'") {
      let end = index + 1
      while (end < sql.length) {
        if (sql[end] === "'" && sql[end + 1] === "'") {
          end += 2
          continue
        }
        if (sql[end] === "'") break
        end += 1
      }
      current += sql.slice(index, end + 1)
      index = end + 1
      continue
    }

    if (!inDollarBlock && char === ';') {
      statements.push(`${current.trim()};`)
      current = ''
      index += 1
      continue
    }

    current += char
    index += 1
  }

  if (current.trim()) statements.push(current.trim())

  return statements.filter((statement) => {
    const code = stripLineComments(statement).replace(/;$/, '').trim()
    if (!code) return false
    return !TRANSACTION_CONTROL.has(code.toUpperCase())
  })
}
