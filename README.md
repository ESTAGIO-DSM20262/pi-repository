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

`npm run db:migrate` aplica tudo em sequência: primeiro as migrations do Drizzle (pasta `drizzle/`) e depois os scripts SQL de `src/db/migrations/`, em ordem cronológica. Os scripts SQL são registrados na tabela `sql_migrations`, então cada um roda uma única vez, e como são idempotentes também funcionam em bancos que já os receberam manualmente. Não é preciso executar nada à mão no Neon. Para rodar só a etapa dos scripts SQL, use `npm run db:migrate:sql`.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

### Login com Microsoft

No Microsoft Entra ID, registre a URL de redirecionamento `{BETTER_AUTH_URL}/api/auth/callback/microsoft` e conceda as permissões delegadas `openid`, `profile`, `email`, `offline_access` e `User.Read`.

O provedor opera em modo **multi-tenant** (`organizations`) por padrão. O e-mail recebido do Entra ID é usado para localizar a conta; o domínio não define as permissões, que vêm do papel cadastrado no banco. Quando o token não traz o claim `email`, o UPN (`preferred_username`) é usado como endereço de e-mail.

---

## Endpoint publico: GET /api/projects/recommended

Localização: `src/app/api/projects/recommended/route.ts`

Endpoint sem autenticação que retorna os projetos selecionados como "Melhor PI" de cada par ciclo/semestre. Criado para uso pelo widget de exibição no site da Fatec Itaquera (WordPress), mas pode ser consumido por qualquer cliente.

### Como funciona

A rota faz um `INNER JOIN` entre `semester_awards` e `projects`, filtrando apenas projetos ativos (`active = true`). Os resultados são ordenados por `selectedAt DESC`, ou seja, os projetos premiados mais recentemente aparecem primeiro.

Nenhuma autenticação é exigida. O endpoint responde ao preflight CORS (`OPTIONS`) sem consultar o banco.

### Cache e CORS

| Configuracao | Valor |
|---|---|
| `Access-Control-Allow-Origin` | `*` (qualquer origem) |
| `Cache-Control` cliente | `max-age=120` (2 min) |
| `Cache-Control` CDN/Edge | `s-maxage=300` (5 min) |
| `stale-while-revalidate` | 600 s (10 min) |
| ISR (Next.js) | `revalidate = 300` |

### Campos retornados por projeto

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `string` | Identificador unico do projeto |
| `title` | `string` | Titulo do projeto |
| `summary` | `string` | Descricao resumida |
| `cycle` | `string` | Ciclo letivo, ex.: `2026/2` |
| `semester` | `number` | Semestre do curso (1 a 6) |
| `advisorName` | `string` | Nome do orientador principal |
| `languages` | `string[]` | Linguagens de programacao utilizadas |
| `stack` | `string[]` | Frameworks e bibliotecas utilizados |
| `theme` | `string` | Tema ou categoria do projeto |
| `status` | `string` | `publicado` ou `em_andamento` |
| `selectedAt` | `string` | Data ISO em que o projeto foi premiado |
| `projectUrl` | `string` | URL direta ao projeto no sistema |

Campos sensiveis como `advisorEmail`, `memberEmails` e `createdByUserId` nao sao expostos.

### Exemplo de resposta

```json
[
  {
    "id": "c69a7c21-34c8-4d1c-88b6-6c44956cdada",
    "title": "SALA - Sistema de Agendamento de Laboratorios",
    "summary": "Plataforma web para agendamento de laboratorios academicos.",
    "cycle": "2026/1",
    "semester": 6,
    "advisorName": "Prof. Dr. Carlos Oliveira",
    "languages": ["TypeScript"],
    "stack": ["React", "Node.js", "PostgreSQL"],
    "theme": "Gestao de laboratorios",
    "status": "publicado",
    "selectedAt": "2026-07-15T10:30:00.000Z",
    "projectUrl": "https://projetos.alvarosena.com.br/projetos/c69a7c21-34c8-4d1c-88b6-6c44956cdada"
  }
]
```

### Widget WordPress

Para exibir os cards dos projetos no site da Fatec Itaquera, use um bloco "HTML Personalizado" (Custom HTML) no editor Gutenberg com o snippet disponivel em `pi-widget-wordpress-dynamic.html`. O widget:

- Busca os dados dinamicamente neste endpoint
- Aplica o design visual do site da Fatec Itaquera (cores, tipografia, divisores)
- Exibe cada projeto como um card com titulo, descricao resumida, ciclo, semestre, orientador, tecnologias e link para o projeto original
- Ordena automaticamente pelos projetos premiados mais recentemente
- Possui fallback para dados estaticos caso o endpoint esteja indisponivel
