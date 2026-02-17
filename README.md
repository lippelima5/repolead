# LeadVault

LeadVault e uma plataforma API-first para ingestao, normalizacao, dedupe e distribuicao de leads por workspace.

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

## Rotas principais (app)

- `/dashboard`
- `/sources`
- `/destinations`
- `/leads`
- `/ingestions`
- `/deliveries`
- `/settings` (readonly + atalhos)
- `/workspaces`
- `/workspaces/create`
- `/workspaces/[workspaceId]`
- `/workspaces/[workspaceId]/edit`
- `/workspaces/[workspaceId]/billing`
- `/profile`
- `/alerts` (acesso via Settings)

## Endpoints principais (API)

Workspace:

- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/[id]`
- `GET/POST /api/workspaces/[id]/members`
- `PATCH/DELETE /api/workspaces/[id]/members/[memberId]`

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

LeadVault pipeline:

- `POST /api/v1/leads/ingest`
- `GET /api/ingestions`
- `GET /api/ingestions/[id]`
- `GET /api/leads`
- `GET/PATCH /api/leads/[id]`
- `GET /api/leads/[id]/timeline`
- `GET /api/deliveries`
- `GET /api/deliveries/[id]`
- `POST /api/deliveries/[id]/replay`
- `POST /api/deliveries/replay-bulk`
- `GET /api/metrics/overview`
- `GET/POST/PATCH/DELETE /api/alerts/rules`
- `GET /api/alerts/events`

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
