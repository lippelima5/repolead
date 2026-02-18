# RepoLead

RepoLead e uma plataforma API-first para captura, normalizacao, dedupe e distribuicao de leads por workspace.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript strict
- PostgreSQL + Prisma 7 (`prisma/generated`)
- Auth JWT em cookie httpOnly
- Zod para validacao
- Stripe (checkout/portal/webhook)

## Regras de arquitetura

- Nao usar Server Actions.
- Toda leitura/mutacao protegida via Route Handlers em `app/api/**`.
- Frontend deve consumir API via `lib/api.ts` (axios).
- Sempre aplicar escopo de workspace em endpoints de tenant.

## Setup local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar ambiente:

```bash
cp .env.example .env
```

3. Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Rodar app:

```bash
npm run dev
```

5. Validacao:

```bash
npm run lint
npm run build
```

## Execucao em container (producao)

- A imagem sobe dois processos no mesmo container:
  - app Next.js (`next start`)
  - worker de deliveries e resumos diarios (cron interno autenticado por `CRON_SECRET`)
- O bootstrap aplica `prisma migrate deploy` antes de iniciar os processos.
- Healthcheck interno: `GET /api/internal/health`.

Com Docker Compose:

```bash
docker compose up -d --build
```

## Rotas principais (app)

- `/dashboard`
- `/sources`
- `/destinations`
- `/leads`
- `/ingestions`
- `/deliveries`
- `/settings` (readonly + atalhos)
- `/settings/api-access`
- `/workspaces`
- `/workspaces/create`
- `/workspaces/[workspaceId]`
- `/workspaces/[workspaceId]/edit`
- `/workspaces/[workspaceId]/billing`
- `/profile`
- `/alerts` (acesso via Settings)
- `/docs` (publico, PT/EN)

## Endpoints principais (API)

Workspace:

- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/[id]`
- `GET/POST /api/workspaces/[id]/members`
- `PATCH/DELETE /api/workspaces/[id]/members/[memberId]`
- `GET/POST /api/workspaces/[id]/read-keys`
- `POST /api/workspaces/[id]/read-keys/[keyId]/rotate`
- `POST /api/workspaces/[id]/read-keys/[keyId]/revoke`

Convites:

- `GET /api/workspaces/invite/[token]`
- `POST /api/workspaces/invite/[token]/accept`

Fontes e destinos:

- `GET/POST /api/sources`
- `GET/PATCH/DELETE /api/sources/[id]`
- `POST /api/sources/[id]/keys`
- `POST /api/sources/[id]/keys/[keyId]/rotate`
- `POST /api/sources/[id]/keys/[keyId]/revoke`
- `GET/POST /api/destinations`
- `GET/PATCH/DELETE /api/destinations/[id]`
- `POST /api/destinations/[id]/test`

RepoLead pipeline:

- `POST /api/v1/leads/ingest`
- `GET /api/v1/leads`
- `GET /api/v1/leads/[id]`
- `GET /api/v1/leads/[id]/timeline`
- `GET /api/ingestions`
- `GET /api/ingestions/[id]`
- `GET /api/leads`
- `GET /api/leads/export.csv`
- `POST /api/leads/export/email`
- `GET/PATCH /api/leads/[id]`
- `GET /api/leads/[id]/timeline`
- `GET /api/deliveries`
- `GET /api/deliveries/[id]`
- `POST /api/deliveries/[id]/replay`
- `POST /api/deliveries/replay-bulk`
- `GET /api/metrics/overview`
- `GET/POST/PATCH/DELETE /api/alerts/rules`
- `GET /api/alerts/events`

Cron interno:

- `GET|POST /api/internal/cron/deliveries`
- `GET|POST /api/internal/cron/lead-summaries`
- alias publicos internos: `/api/cron/deliveries` e `/api/cron/lead-summaries`

## Convites de workspace

- Convite cria token com hash em banco (`workspace_invite.token`).
- O link enviado e `/invite/[token]`.
- Se SMTP nao estiver configurado, a URL do convite e registrada em log do servidor.

## Billing

- Setup Stripe em `/admin/billing`.
- Checkout: `POST /api/stripe/checkout`.
- Portal: `POST /api/stripe/portal`.
- Retornos de billing usam rotas `/workspaces/[workspaceId]` e `/workspaces/[workspaceId]/billing`.

## Integracoes modulares

- Catalogo central: `lib/integrations/catalog.ts`.
- Cada integracao ativa e um arquivo unico em:
  - `lib/integrations/source/<id>.tsx`
  - `lib/integrations/destination/<id>.tsx`
- Cada modulo contem: schema Zod, defaults, formulario e mapeadores de payload.

## Exportacao e API publica

- Exportacao CSV imediata na tela `Leads`.
- Exportacao por email com link assinado (24h).
- API publica de leitura autenticada por `Read API key` (workspace-scoped):
  - header `Authorization: Bearer lv_rk_xxx` ou `X-Api-Key`.
  - limite inicial: 120 req/min por chave.

## Resumo diario por email

- Cada workspace tem a flag `daily_lead_summary_enabled` (default: `true`).
- O envio diario vai para todos os membros do workspace.
- O resumo so e enviado quando existem leads novos no dia.
- O toggle pode ser alterado em `/workspaces/[workspaceId]/edit`.

## Documentacao publica

- Centro publico em `/docs` com conteudo PT/EN:
  - getting started
  - conceitos
  - exportacao
  - API publica
  - exemplos de integracao
