# Correção de migration via terminal

## O que esta correção resolve

O erro `column "co_advisors" does not exist` acontece porque o código espera colunas que ainda não foram adicionadas ao schema do Neon. A migration correspondente já existe em `src/db/migrations/20261027_project_advisors_verification.sql`, mas `npm run db:migrate` não lê essa pasta: ele usa `drizzle/`.

## Aplicar a correção

1. Extraia os arquivos deste pacote sobre a raiz do projeto, mantendo a estrutura de pastas. O `package.json` incluído apenas adiciona o script `db:migrate:repair`.
2. Confirme que o `.env` contém `DATABASE_URL` apontando para a branch e o banco corretos do Neon.
3. No terminal do VS Code, na raiz onde está o `package.json`, execute:

   ```powershell
   npm run db:migrate:repair
   ```

4. Quando o comando terminar sem erro, execute `npm run dev` e abra `http://localhost:3000`.

O comando usa um diretório e uma tabela de histórico separados (`drizzle-repair/` e `public.__drizzle_repair_migrations`) para não executar inadvertidamente as migrations antigas da pasta `drizzle/`. A migration é idempotente e também pode ser executada se algumas das colunas/objetos já existirem.

## Verificação opcional no Neon

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN ('co_advisors', 'active', 'deactivated_at')
ORDER BY column_name;

SELECT to_regclass('public.project_verifications') AS project_verifications;
```

A primeira consulta deve retornar as três colunas; a segunda deve retornar `project_verifications`.

## Importante sobre o histórico existente

Não execute `npm run db:migrate` padrão nem o arquivo recém-gerado em `drizzle/20261028073639_lyrical_doomsday/` sem revisar o SQL e reconciliar o histórico: os snapshots da pasta `drizzle/` não registram todas as alterações aplicadas manualmente em `src/db/migrations/`. Esta correção resolve a migration de orientadores/verificação e evita misturar as duas fontes nesta execução; ela não substitui a futura consolidação do histórico de migrations do projeto.
