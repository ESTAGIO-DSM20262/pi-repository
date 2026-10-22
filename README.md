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

- O sistema aceita endereços de e-mail válidos de qualquer domínio. O sufixo do e-mail não determina o papel ou as permissões da conta.
- Os papéis (`student`, `professor` e `admin`) ficam registrados no banco de dados e são definidos no cadastro administrativo. Contas criadas automaticamente por autenticação social recebem `student` como papel inicial, que pode ser alterado por um administrador.
- Dois métodos de acesso: **e-mail e senha** ou **Microsoft (Entra ID)**, quando configurado.
- Contas de **e-mail e senha** são **pré-provisionadas** pelo painel administrativo (não há autocadastro). Use `npm run db:seed` para criar contas de desenvolvimento.

## Funcionalidades

Atualmente, o projeto possui:

- Login com e-mail/senha e com Microsoft
- Redefinição de senha por e-mail (Resend)
- Redirecionamento por papel (aluno / professor)
- Áreas protegidas por sessão no servidor
- Modais e pop-ups de aviso
- Estrutura inicial para a Home e demais telas

A recuperação de senha envia um link por e-mail (válido por 1 hora) usando o [Resend](https://resend.com).

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
- `RESEND_API_KEY` — chave da API do Resend, usada no e-mail de redefinição de senha. Opcional em desenvolvimento: sem ela, o link de redefinição é impresso no console do `npm run dev`.
- `EMAIL_FROM` — remetente dos e-mails, de um domínio verificado no Resend (ex.: `Acervo Acadêmico <no-reply@seu-dominio>`). Obrigatório em produção junto com `RESEND_API_KEY`.

Aplique as migrações e crie as contas de desenvolvimento:

```bash
npm run db:migrate
npm run db:seed
```

Além das migrations geradas na pasta `drizzle/`, confira e aplique no banco Neon de destino os scripts SQL pendentes de `src/db/migrations/`. A tela de perfil e os links sociais dos projetos exigem a migration `20261019_user_social_profiles.sql`, que adiciona as colunas `github_url` e `linkedin_url` à tabela `users`.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

### Login com Microsoft

No Microsoft Entra ID, registre a URL de redirecionamento `{BETTER_AUTH_URL}/api/auth/callback/microsoft` e conceda as permissões delegadas `openid`, `profile`, `email`, `offline_access` e `User.Read`.

O provedor opera em modo **multi-tenant** (`organizations`) por padrão. O e-mail recebido do Entra ID é usado para localizar a conta; o domínio não define as permissões, que vêm do papel cadastrado no banco. Quando o token não traz o claim `email`, o UPN (`preferred_username`) é usado como endereço de e-mail.
