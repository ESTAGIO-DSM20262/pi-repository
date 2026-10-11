# Acervo Acadêmico Fatec

Sistema desenvolvido para centralizar e disponibilizar os Projetos Integradores da Fatec Itaquera, permitindo a consulta e organização dos projetos acadêmicos.

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL (Neon) + Drizzle ORM
- [better-auth](https://www.better-auth.com/)

## Autenticação

O acesso é restrito a e-mails institucionais do Centro Paula Souza:

| Domínio                     | Papel      | Área após o login |
| --------------------------- | ---------- | ----------------- |
| `@aluno.cps.sp.gov.br`      | Aluno      | `/aluno`          |
| `@cps.sp.gov.br`            | Professor  | `/professor`      |

- Dois métodos de acesso: **e-mail e senha** ou **Microsoft (Entra ID)**.
- O papel é derivado exclusivamente do domínio do e-mail — nunca informado pelo cliente.
- E-mails fora dos domínios acima não conseguem autenticar (nem por senha, nem por Microsoft).
- No login Microsoft (multi-tenant, `organizations`), a conta é criada automaticamente quando o e-mail é de domínio institucional válido; contas pessoais da Microsoft são recusadas e domínios inválidos são bloqueados.
- Contas de **e-mail e senha** são **pré-provisionadas** (não há autocadastro). Use `npm run db:seed` para criar contas de desenvolvimento.

## Funcionalidades

Atualmente, o projeto possui:

- Login com e-mail/senha e com Microsoft
- Redirecionamento por papel (aluno / professor)
- Áreas protegidas por sessão no servidor
- Modais e pop-ups de aviso
- Estrutura inicial para a Home e demais telas

A tela de recuperação/redefinição de senha ainda está em desenvolvimento.

## Como executar

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Preencha o `.env`:

- `DATABASE_URL` — string de conexão do Postgres (Neon).
- `BETTER_AUTH_SECRET` — gere com `openssl rand -base64 32`.
- `BETTER_AUTH_URL` — URL base da aplicação (ex.: `http://localhost:3000`).
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` — credenciais do app no Microsoft Entra ID (opcionais em desenvolvimento).
- `MICROSOFT_TENANT_ID` — opcional; escopo do provedor. Padrão `organizations` (qualquer tenant corporativo/escolar). Informe um Tenant ID/domínio para restringir a um único tenant.

Aplique as migrações e crie as contas de desenvolvimento:

```bash
npm run db:migrate
npm run db:seed
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

### Login com Microsoft

No Microsoft Entra ID, registre a URL de redirecionamento `{BETTER_AUTH_URL}/api/auth/callback/microsoft` e conceda as permissões delegadas `openid`, `profile`, `email`, `offline_access` e `User.Read`.

O provedor opera em modo **multi-tenant** (`organizations`) por padrão: qualquer conta corporativa/escolar do Entra ID pode tentar entrar, mas apenas e-mails de `aluno.cps.sp.gov.br` ou `cps.sp.gov.br` são aceitos. Contas pessoais da Microsoft não são aceitas. Quando o token não traz o claim `email`, o UPN (`preferred_username`) é usado como e-mail institucional.
