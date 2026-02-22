# RepoLead

RepoLead e uma plataforma API-first para captura, deduplicação e distribuição de leads por workspace (multi-tenant), com trilha de auditoria e entregas resilientes.

## Objetivo

Centralizar todo o ciclo de Lead Operations em um fluxo único:

1. Captura de payloads por webhook/API.
2. Idempotência e deduplicação por identidades.
3. Timeline auditável por lead.
4. Fan-out para destinations com retry e DLQ.

## Stack Oficial

- Next.js 16 (App Router)
- React 19
- TypeScript strict
- PostgreSQL
- Prisma 7 (`prisma/generated`)
- Auth JWT (`bcryptjs` + `jose`)
- Zod para validação
- Axios no frontend (`lib/api.ts`)
- Stripe (checkout, portal e webhook)

## Arquitetura Obrigatoria

- Não usar Server Actions.
- Toda operação protegida deve estar em `app/api/**`.
- Frontend deve consumir backend via `lib/api.ts`.
- Validação de body com `parseJsonBody` + `lib/schemas.ts`.
- Respostas com `apiSuccess`, `apiError`, `apiRateLimit`.
- Tratamento centralizado com `onError`.
- Multi-tenant estrito por `workspace_id`.

## Módulos do Produto

### Painel autenticado

- `/dashboard`
- `/sources`, `/destinations`
- `/leads`, `/ingestions`, `/deliveries`
- `/alerts`
- `/settings`, `/settings/api-access`
- `/workspaces`, `/workspaces/create`, `/workspaces/[workspaceId]`, `/workspaces/[workspaceId]/edit`, `/workspaces/[workspaceId]/billing`
- `/profile`
- `/feedback`

### Painel administrativo

- `/admin`
- `/admin/billing`

### Público

- `/` (landing)
- `/docs`, `/docs/[lang]/[slug]`
- `/blog`, `/changelog`, `/terms`, `/privacy`
- `/invite/[token]`

## APIs Principais

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/magic`
- `POST /api/auth/magic/consume`

### Workspace

- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/[id]`
- `GET/POST /api/workspaces/[id]/members`
- `PATCH/DELETE /api/workspaces/[id]/members/[memberId]`
- `GET/POST /api/workspaces/[id]/read-keys`
- `POST /api/workspaces/[id]/read-keys/[keyId]/rotate`
- `POST /api/workspaces/[id]/read-keys/[keyId]/revoke`
- `GET /api/workspaces/invite/[token]`
- `POST /api/workspaces/invite/[token]/accept`

### Sources e Destinations

- `GET/POST /api/sources`
- `GET/PATCH/DELETE /api/sources/[id]`
- `POST /api/sources/[id]/keys`
- `POST /api/sources/[id]/keys/[keyId]/rotate`
- `POST /api/sources/[id]/keys/[keyId]/revoke`
- `GET/POST /api/destinations`
- `GET/PATCH/DELETE /api/destinations/[id]`
- `POST /api/destinations/[id]/test`

### Leads, Ingestions, Deliveries

- `POST /api/v1/leads/ingest` (ingestão pública)
- `GET /api/v1/leads`
- `GET /api/v1/leads/[id]`
- `GET /api/v1/leads/[id]/timeline`
- `GET /api/ingestions`
- `GET /api/ingestions/[id]`
- `GET /api/leads`
- `GET/PATCH /api/leads/[id]`
- `GET /api/leads/[id]/timeline`
- `GET /api/leads/export.csv`
- `POST /api/leads/export/email`
- `GET /api/deliveries`
- `GET /api/deliveries/[id]`
- `POST /api/deliveries/[id]/replay`
- `POST /api/deliveries/replay-bulk`
- `POST /api/deliveries/send-all-leads`

### Métricas, alertas e operação

- `GET /api/metrics/overview`
- `GET/POST/PATCH/DELETE /api/alerts/rules`
- `GET /api/alerts/events`
- `GET|POST /api/internal/cron/deliveries`
- `GET|POST /api/internal/cron/lead-summaries`
- Alias: `/api/cron/deliveries`, `/api/cron/lead-summaries`
- `GET /api/internal/health`

### Billing (Stripe)

- `GET /api/billing-plan`
- `POST /api/stripe/checkout`
- `POST /api/stripe/portal`
- `POST /api/stripe/webhook`
- Admin: `/api/admin/billing-plan`, `/api/admin/stripe/setup`

## Integrações Modulares

Catálogo único em `lib/integrations/catalog.ts`.

Módulos ativos em arquivo único:

- `lib/integrations/source/<id>.tsx`
- `lib/integrations/destination/<id>.tsx`

Cada módulo exporta schema, defaults, formulario e mapeadores de payload.

## Estrutura do Repositório

- `app/`: rotas App Router e Route Handlers
- `components/`: UI e componentes de dominio
- `contexts/`: auth, i18n e tema
- `lib/`: dominio, segurança, auth, integrações e utilitarios
- `prisma/`: schema e migrations
- `emails/`: templates e envio
- `scripts/`: bootstrap prod, worker e healthcheck
- `content/`: docs públicas PT/EN
- `stack.env`: catálogo canônico de variáveis de ambiente

## Configuração de Ambiente

1. Copie o arquivo de base:

```bash
cp stack.env .env
```

2. Ajuste valores obrigatórios no `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_URL`

3. Configure opcionais conforme uso:

- SMTP (`SMTP_*`) para envio de emails
- Stripe (`STRIPE_*`) para billing
- Worker (`DELIVERY_WORKER_*`, `LEAD_SUMMARY_*`) para processamento assinado

## Execucao Local

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Qualidade Mínima

```bash
npm run lint
npm run build
```

## Execucao em Produção (container)

`npm run start` executa:

- `prisma migrate deploy`
- processo web Next.js
- worker de deliveries/resumo diário (se habilitado)

Com Docker Compose:

```bash
docker compose up -d --build
```

## Governança de Documentação

- Arquivos estáveis: `README.md`, `DESCRIPTION.md`, `AGENTS.md`.
- Arquivos vivos: `ROADMAP.md`, `CHANGELOG.md`.
- Regras detalhadas em `AGENTS.md`.

