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

## Endpoint público: GET /api/projects/recommended

Localização: `src/app/api/projects/recommended/route.ts`

Endpoint sem autenticação que devolve os projetos escolhidos como "Melhor PI" de cada par ciclo/semestre. Foi criado para o widget de exibição no site da Fatec Itaquera (WordPress), mas pode ser consumido por qualquer cliente.

### Como funciona

A rota faz um `INNER JOIN` entre `semester_awards` e `projects` e mantém só os projetos ativos (`active = true`). Os resultados são ordenados por `selectedAt` decrescente, então os projetos premiados mais recentemente aparecem primeiro.

Nenhuma autenticação é exigida. O endpoint responde ao preflight CORS (`OPTIONS`) sem consultar o banco.

### Cache e CORS

| Configuração | Valor |
|---|---|
| `Access-Control-Allow-Origin` | `*` (qualquer origem) |
| `Cache-Control` no navegador | `max-age=120` (2 min) |
| `Cache-Control` na CDN | `s-maxage=300` (5 min) |
| `stale-while-revalidate` | 600 s (10 min) |

A consulta roda a cada requisição no servidor; o cache acontece no navegador e na CDN pelos cabeçalhos acima. Respostas de erro (500) usam `Cache-Control: no-store`, para que uma falha temporária não fique em cache.

### Campos retornados por projeto

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único do projeto |
| `title` | `string` | Título do projeto |
| `summary` | `string` | Resumo do projeto |
| `cycle` | `string` | Ciclo letivo, ex.: `2026/2` |
| `semester` | `number` | Semestre do curso (1 a 6) |
| `advisorName` | `string` | Nome do orientador principal |
| `languages` | `string[]` | Linguagens de programação |
| `stack` | `string[]` | Tecnologias e ferramentas |
| `theme` | `string` | Tema do projeto |
| `status` | `string` | Situação do projeto (sempre `publicado`, pois só projetos concluídos podem ser escolhidos) |
| `selectedAt` | `string` | Data ISO em que o projeto foi escolhido |
| `projectUrl` | `string` | Endereço da página do projeto, montado a partir do domínio que recebeu a requisição |

Dados pessoais como `advisorEmail`, `memberEmails` e `createdByUserId` não são expostos.

### Exemplo de resposta

```json
[
  {
    "id": "c69a7c21-34c8-4d1c-88b6-6c44956cdada",
    "title": "SALA - Sistema de Agendamento de Laboratórios",
    "summary": "Plataforma web para agendamento de laboratórios acadêmicos.",
    "cycle": "2026/1",
    "semester": 6,
    "advisorName": "Prof. Dr. Carlos Oliveira",
    "languages": ["TypeScript"],
    "stack": ["React", "Node.js", "PostgreSQL"],
    "theme": "Gestão de laboratórios",
    "status": "publicado",
    "selectedAt": "2026-07-15T10:30:00.000Z",
    "projectUrl": "https://seu-dominio/projetos/c69a7c21-34c8-4d1c-88b6-6c44956cdada"
  }
]
```

### Widget WordPress

Para exibir os projetos no site da Fatec Itaquera, use um bloco "HTML personalizado" no editor Gutenberg que busque os dados neste endpoint. O widget deve:

- Buscar os dados dinamicamente neste endpoint
- Seguir o visual do site da Fatec Itaquera (cores, tipografia, divisores)
- Exibir cada projeto como um card com título, resumo, ciclo, semestre, orientador, tecnologias e link para a página do projeto (`projectUrl`)
- Manter a ordem da resposta (premiados mais recentes primeiro)

O código do widget não está neste repositório.

---

## Guia de deploy e configuração

Este guia reúne o necessário para alguém que não conhece o projeto instalar as dependências, configurar o ambiente, conectar o banco de dados e o serviço de e-mail e publicar a aplicação na Vercel.

### Pré-requisitos

- Node.js 20.9 ou superior (exigido pelo Next.js 16; confira com `node -v`)
- npm (vem junto com o Node.js)
- Conta no GitHub com acesso ao repositório
- Conta na Vercel (para o deploy em produção)
- Banco PostgreSQL (o projeto usa o Neon)
- Conta no Resend (para envio de e-mail em produção)

### Instalação local

```bash
git clone https://github.com/ESTAGIO-DSM20262/pi-repository.git
cd pi-repository
npm install
cp .env.example .env
```

Use o arquivo `.env` (não `.env.local`): os scripts do banco (`db:migrate`, `db:seed`) carregam só o `.env`.

### Variáveis de ambiente

A lista completa e o papel de cada variável estão em [Como executar](#como-executar) e no `.env.example`. Em produção são obrigatórias `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY` e `EMAIL_FROM`. As variáveis `MICROSOFT_*` só são necessárias se o login com a conta Microsoft for usado.

Para gerar um valor seguro para `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

### Banco de dados

A aplicação usa PostgreSQL com Drizzle ORM.

#### Neon (configuração atual do projeto)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um projeto e, dentro dele, um banco de dados
3. Em **Connection Details**, copie a string de conexão no formato:
   ```
   postgresql://usuario:senha@ep-xxxx.us-east-2.aws.neon.tech/nomebanco?sslmode=require
   ```
4. Cole essa string em `DATABASE_URL` no `.env`

O Neon exige `?sslmode=require`.

#### PostgreSQL local (desenvolvimento)

Para desenvolver sem depender de serviços externos:

```bash
docker run -d \
  --name pi-postgres \
  -e POSTGRES_USER=pi \
  -e POSTGRES_PASSWORD=pi \
  -e POSTGRES_DB=pi \
  -p 5432:5432 \
  postgres:16
```

String de conexão resultante: `DATABASE_URL=postgresql://pi:pi@localhost:5432/pi`.

#### Aplicando as migrations

Depois de configurar `DATABASE_URL`, crie as tabelas no banco:

```bash
npm run db:migrate
```

O comando aplica as migrations do Drizzle e depois os scripts SQL de `src/db/migrations/`, em ordem. Cada script roda uma única vez e pode ser executado de novo com segurança.

---

### Envio de e-mail com Resend

O projeto usa o [Resend](https://resend.com) para os e-mails de convite de conta (definir a senha inicial) e de redefinição de senha.

1. Crie uma conta em [resend.com](https://resend.com)
2. Em **API Keys**, gere uma chave e cole em `RESEND_API_KEY`
3. Em **Domains**, adicione e verifique o domínio do remetente (registros DNS indicados pelo Resend)
4. Preencha `EMAIL_FROM` com um remetente desse domínio, ex.: `Acervo Acadêmico <no-reply@seu-dominio>`

Em desenvolvimento, sem essas variáveis, os links são impressos no console do `npm run dev`. Em produção, sem elas, o envio falha.

---

### Deploy na Vercel

A Vercel é o provedor de hospedagem atual do projeto.

#### Pelo painel web (recomendado para o primeiro deploy)

1. Acesse [vercel.com](https://vercel.com) e entre com a conta do GitHub
2. Clique em **Add New > Project**
3. Importe o repositório `ESTAGIO-DSM20262/pi-repository`
4. Em **Environment Variables**, adicione as variáveis da seção anterior
5. Clique em **Deploy**

A Vercel detecta o Next.js e configura o build automaticamente. As migrations não rodam no deploy: execute `npm run db:migrate` apontando para o banco de produção sempre que houver migrations novas.

#### Pela Vercel CLI

```bash
npm install -g vercel
vercel login
vercel          # deploy de preview
vercel --prod   # deploy de produção
```

#### Variáveis de ambiente na Vercel

Depois do primeiro deploy, as variáveis ficam em **Project > Settings > Environment Variables**. Defina cada uma para **Production**, **Preview** e **Development** conforme necessário. `BETTER_AUTH_URL` deve apontar para a URL real de produção.

#### Domínio personalizado

1. Vá em **Project Settings > Domains**
2. Adicione o domínio e configure os registros DNS indicados pela Vercel
3. A Vercel emite o certificado SSL automaticamente

Ao trocar o domínio, atualize `BETTER_AUTH_URL` e, se usar o login Microsoft, a URL de redirecionamento no Entra ID.

---

### Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:3000` |
| `npm run build` | Build de produção |
| `npm run start` | Servidor com o build de produção |
| `npm run lint` | Verifica o código com o Biome (`npm run lint:fix` corrige) |
| `npm test` | Roda os testes (Vitest) |
| `npm run db:migrate` | Aplica as migrations no banco configurado |
| `npm run db:seed` | Cria as contas de desenvolvimento |
| `npm run db:generate` | Gera migrations a partir do schema |
| `npm run db:studio` | Abre o Drizzle Studio |
| `npm run email:dev` | Pré-visualiza os templates de e-mail em `http://localhost:3001` |

---

## Integrantes

| Nome | GitHub |
|---|---|
| Alvaro Barbosa Sena | [AlvaroSena](https://github.com/AlvaroSena) |
| Amanda Ianes da Fonseca | [Ianesamanda](https://github.com/Ianesamanda) |
| Danilo da Silva Paulino | [deletrr](https://github.com/deletrr) |
| Felipe Rocha de Oliveira | [FelipeRCod](https://github.com/FelipeRCod) |
| Gustavo de Souza Costa Joia | [GustavoJoia](https://github.com/GustavoJoia) |
| Lucas Retanero Almeida Rodrigues de Oliveira | [Lucas-Retanero](https://github.com/Lucas-Retanero) |
