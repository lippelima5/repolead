# LeadVault Implementation Notes

## 1) Arquitetura aplicada

- UI do redesign foi integrada no app real em rotas App Router:
  - autenticado: `app/(app)/**`
  - marketing/publico: `app/(marketing)/**`
- Sem Server Actions: leituras/mutacoes no cliente passam por Route Handlers em `app/api/**`.
- Cliente HTTP padronizado em `lib/api.ts` (axios), com `X-Workspace-Id` automatico a partir de `localStorage`.
- Multi-tenant:
  - helper `requireWorkspace` em `lib/leadvault/workspace.ts`
  - resolve workspace por `X-Workspace-Id` -> query -> `user.workspace_active_id`
  - validacao de membership via `verifyUserWorkspace`
- Servicos de dominio:
  - ingest/normalizacao/dedupe: `lib/leadvault/ingest.ts`
  - deliveries/retry/DLQ/replay: `lib/leadvault/delivery.ts`
  - API key/signature/hash: `lib/leadvault/security.ts`
  - rate limit por source: `lib/leadvault/source-rate-limit.ts`
- Arquitetura modular de integracoes:
  - catalogo unico: `lib/integrations/catalog.ts`
  - contratos/tipos: `lib/integrations/types.ts`
  - modulos source (1 arquivo por integracao): `lib/integrations/source/*.tsx`
  - modulos destination (1 arquivo por integracao): `lib/integrations/destination/*.tsx`
  - cada modulo contem form, validacoes e mapeamento para payload da API

## 2) Banco e Prisma

- Schema expandido em `prisma/schema.prisma` com modelos LeadVault:
  - `source`, `api_key`, `ingestion`, `lead`, `lead_identity`, `lead_event`,
  - `destination`, `delivery`, `delivery_attempt`,
  - `alert_rule`, `alert_event`,
  - `source_rate_limit_bucket`
- Migration adicionada:
  - `prisma/migrations/20260217010500_leadvault_core/migration.sql`
  - `prisma/migrations/20260217151429_integration_modules/migration.sql`
- Client gerado em `prisma/generated`.

## 3) Endpoints principais

- Workspaces:
  - `GET/POST /api/workspaces`
  - `GET/PATCH/DELETE /api/workspaces/:id`
  - `GET/POST /api/workspaces/:id/members`
  - `PATCH/DELETE /api/workspaces/:id/members/:memberId`
- Sources + keys:
  - `GET/POST /api/sources`
  - `GET/PATCH/DELETE /api/sources/:id`
  - `POST /api/sources/:id/keys`
  - `POST /api/sources/:id/keys/:keyId/rotate`
  - `POST /api/sources/:id/keys/:keyId/revoke`
- Destinations:
  - `GET/POST /api/destinations`
  - `GET/PATCH/DELETE /api/destinations/:id`
  - `POST /api/destinations/:id/test`
- Ingestions:
  - `GET /api/ingestions`
  - `GET /api/ingestions/:id`
- Leads:
  - `GET /api/leads`
  - `GET/PATCH /api/leads/:id`
  - `GET /api/leads/:id/timeline`
- Deliveries:
  - `GET /api/deliveries`
  - `GET /api/deliveries/:id`
  - `POST /api/deliveries/:id/replay`
  - `POST /api/deliveries/replay-bulk`
- Metrics/Alerts:
  - `GET /api/metrics/overview`
  - `GET/POST/PATCH/DELETE /api/alerts/rules`
  - `GET /api/alerts/events`
- Ingest publico API-first:
  - `POST /api/v1/leads/ingest`

## 4) Worker/Cron de deliveries

- Cron route:
  - `GET|POST /api/internal/cron/deliveries`
  - alias: `GET|POST /api/cron/deliveries`
- Autenticacao:
  - header `Authorization: Bearer <CRON_SECRET>`
- O worker processa entregas `pending/failed` com `next_attempt_at <= now`.
- Retry:
  - backoff exponencial com jitter
  - max attempts = 50
  - excedeu max -> `dead_letter`

## 5) Como rodar local

1. Instalar deps:
   - `npm install`
2. Gerar Prisma client:
   - `npx prisma generate`
3. Aplicar migrations no banco:
   - `npx prisma migrate deploy`
4. Rodar app:
   - `npm run dev`

Build/lint usados nesta entrega:
- `npm run lint`
- `npm run build`

## 6) Ingest via curl (com idempotencia)

```bash
curl -X POST "http://localhost:3000/api/v1/leads/ingest" \
  -H "Authorization: Bearer lv_sk_xxx" \
  -H "Idempotency-Key: ingest-001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria@empresa.com",
    "phone": "+5511999887766",
    "source": "lp-black-friday",
    "tags": ["hot","enterprise"]
  }'
```

Repetir com a mesma `Idempotency-Key` retorna `202` com `duplicate_of`.

## 7) Checklist de QA manual

1. Criar workspace e selecionar workspace ativo.
2. Criar source e gerar API key (copiar chave exibida uma unica vez).
3. Ingerir lead por curl com `Idempotency-Key`.
4. Validar lead na lista + timeline preenchida.
5. Criar destination e executar teste (`/api/destinations/:id/test`).
6. Simular falha de delivery e verificar retry/DLQ (cron).
7. Executar replay individual e replay em lote.

## 8) Observacoes finais

- Pasta temporaria `lovable-front/` foi removida.
- O design/tokens do front novo foram incorporados no app real (`app/globals.css`, `components/app-layout.tsx`, `components/app-sidebar.tsx` e novas paginas).
- `content/integrations-catalog.ts` foi removido e substituido por `lib/integrations/catalog.ts`.
- Como adicionar nova integracao ativa:
  1. criar `lib/integrations/source/<id>.tsx` ou `lib/integrations/destination/<id>.tsx`;
  2. exportar modulo com form + schema + mapeadores;
  3. registrar entrada no catalogo `lib/integrations/catalog.ts`.
