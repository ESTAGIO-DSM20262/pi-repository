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

---

## Guia de deploy e configuracao

Este guia cobre tudo o que e necessario para uma pessoa que nao conhece o projeto conseguir instalar as dependencias, configurar o ambiente, conectar ao banco de dados e ao servico de e-mail, e publicar a aplicacao na Vercel.

### Pre-requisitos

- Node.js 18 ou superior (`node -v` para verificar)
- npm 9 ou superior (vem junto com o Node.js)
- Conta no GitHub com acesso ao repositorio
- Conta na Vercel (para deploy em producao)
- Conta na Neon ou em outro provedor PostgreSQL compativel
- Conta no Resend (para envio de e-mail)

### Instalacao local

```bash
# 1. Clone o repositorio
git clone https://github.com/ESTAGIO-DSM20262/pi-repository.git
cd pi-repository

# 2. Instale as dependencias
npm install

# 3. Copie o arquivo de variaveis de ambiente
cp .env.example .env.local
```

Preencha `.env.local` conforme descrito nas proximas secoes.

### Variaveis de ambiente

O arquivo `.env.example` lista todas as variaveis necessarias. As obrigatorias para a aplicacao funcionar sao:

| Variavel | Descricao |
|---|---|
| `DATABASE_URL` | String de conexao PostgreSQL |
| `BETTER_AUTH_SECRET` | Chave secreta de sessao (minimo 32 caracteres) |
| `BETTER_AUTH_URL` | URL base da aplicacao, ex.: `http://localhost:3000` |
| `RESEND_API_KEY` | Chave da API do Resend para envio de e-mail |
| `RESEND_FROM_EMAIL` | Endereco remetente, ex.: `noreply@seudominio.com` |

As variaveis de autenticacao Microsoft Entra ID sao opcionais e so precisam ser preenchidas se o login via conta Microsoft for utilizado.

Para gerar um valor seguro para `BETTER_AUTH_SECRET`, use:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Banco de dados

A aplicacao usa PostgreSQL com Drizzle ORM. Qualquer provedor PostgreSQL compativel funciona. Abaixo estao as instrucoes para os mais comuns.

#### Neon (configuracao atual do projeto)

O Neon oferece um banco PostgreSQL serverless com plano gratuito permanente (0,5 GB de armazenamento, sem limite de tempo).

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto e, dentro dele, um banco de dados
3. No painel do Neon, va em **Connection Details** e copie a string de conexao no formato:
   ```
   postgresql://usuario:senha@ep-xxxx.us-east-2.aws.neon.tech/nomebanco?sslmode=require
   ```
4. Cole essa string em `DATABASE_URL` no `.env.local`

A flag `?sslmode=require` e obrigatoria no Neon. Sem ela, a conexao sera recusada.

#### Supabase

O Supabase oferece um banco PostgreSQL com plano gratuito (500 MB, projetos pausam apos 7 dias sem atividade no plano gratuito).

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Va em **Project Settings > Database > Connection string > URI**
3. Copie a string e cole em `DATABASE_URL`

A string do Supabase ja vem com `?sslmode=require` incluido.

#### Railway

O Railway oferece um plano gratuito com limite mensal de horas de execucao.

1. Acesse [railway.app](https://railway.app) e crie um servico PostgreSQL
2. Na aba **Variables** do servico, copie o valor de `DATABASE_URL`
3. Cole em `DATABASE_URL` no seu `.env.local`

#### PostgreSQL local (desenvolvimento)

Para desenvolvimento sem depender de servicos externos:

```bash
# Com Docker
docker run -d \
  --name pi-postgres \
  -e POSTGRES_USER=pi \
  -e POSTGRES_PASSWORD=pi \
  -e POSTGRES_DB=pi \
  -p 5432:5432 \
  postgres:16

# String de conexao resultante
DATABASE_URL=postgresql://pi:pi@localhost:5432/pi
```

#### Outros provedores PostgreSQL

Qualquer provedor que aceite conexoes PostgreSQL padrao funciona. O formato da string de conexao e sempre:

```
postgresql://USUARIO:SENHA@HOST:PORTA/BANCO?opcoes
```

Substitua os valores de acordo com o seu provedor. A flag `?sslmode=require` e recomendada em producao.

#### Aplicando as migrations

Apos configurar `DATABASE_URL`, crie as tabelas no banco:

```bash
npm run db:migrate
```

Este comando aplica as migrations do Drizzle e os scripts SQL adicionais em ordem. Cada script roda uma unica vez e e seguro executar mais de uma vez (idempotente).

---

### Envio de e-mail com Resend

O projeto usa o [Resend](https://resend.com) para envio de e-mails transacionais (confirmacao de conta, redefinicao de senha). O plano gratuito permite ate 3.000 e-mails por mes e 100 por dia, sem necessidade de cartao de credito.

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Va em **API Keys** e gere uma nova chave
3. Cole o valor em `RESEND_API_KEY` no `.env.local`
4. Em `RESEND_FROM_EMAIL`, coloque o endereco remetente

No plano gratuito do Resend, e-mails so podem ser enviados a partir do dominio `onboarding@resend.dev` ou de um dominio proprio verificado. Para testes iniciais, use `onboarding@resend.dev`.

Para usar um dominio proprio:
1. Va em **Domains** no painel do Resend
2. Adicione seu dominio e siga as instrucoes para configurar os registros DNS (MX, SPF, DKIM)
3. Apos verificado, use `noreply@seudominio.com` como remetente

---

### Deploy na Vercel

A Vercel e o provedor de hospedagem atual do projeto. O plano gratuito (Hobby) e suficiente para a aplicacao.

#### Via painel web (recomendado para o primeiro deploy)

1. Acesse [vercel.com](https://vercel.com) e faca login com sua conta GitHub
2. Clique em **Add New > Project**
3. Importe o repositorio `ESTAGIO-DSM20262/pi-repository`
4. Na tela de configuracao, expanda **Environment Variables** e adicione todas as variaveis listadas na secao anterior
5. Clique em **Deploy**

A Vercel detecta automaticamente que o projeto usa Next.js e configura o build sem nenhuma mudanca.

#### Via Vercel CLI

```bash
# Instalar a CLI globalmente
npm install -g vercel

# Autenticar
vercel login

# Fazer deploy a partir da pasta do projeto
vercel

# Para deploy em producao (branch main)
vercel --prod
```

#### Configuracao das variaveis de ambiente na Vercel

Apos o primeiro deploy, as variaveis podem ser gerenciadas em:

**Vercel Dashboard > Projeto > Settings > Environment Variables**

Defina cada variavel para os ambientes **Production**, **Preview** e **Development** conforme necessario. A variavel `BETTER_AUTH_URL` deve apontar para a URL real do projeto em producao, ex.: `https://projetos.alvarosena.com.br`.

#### Dominio personalizado

1. Va em **Project Settings > Domains**
2. Adicione seu dominio e siga as instrucoes para configurar os registros DNS no seu provedor (geralmente um registro CNAME apontando para `cname.vercel-dns.com`)
3. A Vercel provisiona o certificado SSL automaticamente

---

### Executando localmente

Apos configurar as variaveis de ambiente e rodar as migrations:

```bash
npm run dev
```

A aplicacao estara disponivel em `http://localhost:3000`.

Outros comandos uteis:

| Comando | Descricao |
|---|---|
| `npm run build` | Gera o build de producao |
| `npm run start` | Inicia o servidor com o build de producao |
| `npm run lint` | Verifica o codigo com ESLint |
| `npm run db:studio` | Abre o Drizzle Studio (interface visual do banco) |
| `npm run db:generate` | Gera arquivos de migration a partir do schema |
| `npm run db:migrate` | Aplica as migrations no banco configurado |

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
