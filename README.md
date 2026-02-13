# VibeKit

Starter kit SaaS com Next.js App Router, TypeScript e Prisma, projetado para evoluir produtos de IA sem boilerplate extra.

## Stack

- Next.js 16 + React 19 + TypeScript
- PostgreSQL + Prisma (client gerado em `prisma/generated`)
- Auth via API routes (`app/api/**`) com JWT em cookie httpOnly
- Multi-workspace com roles por workspace
- Convites por email com token hash
- Stripe checkout/portal/webhook com catalogo de planos no banco

## Regras de Arquitetura

- Sem Server Actions.
- Operacoes protegidas via Route Handlers em `app/api/**`.
- Frontend consome APIs com `axios` (`lib/api.ts`) e contexts/hooks.

## Setup Local

1. Instale dependencias:

```bash
npm install
```

2. Configure ambiente:

```bash
cp .env.example .env
```

3. Gere client e execute migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Rode o projeto:

```bash
npm run dev
```

5. Build de validacao:

```bash
npm run build
```

## Variaveis de Ambiente

Obrigatorias:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

Email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USERNAME` e `SMTP_PASSWORD` (opcional, em par)
- `SMTP_FROM`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Observacao:

- O painel `/admin/billing` possui setup automatico de webhook Stripe.
- Quando um webhook novo e criado, a API retorna o `whsec_...` para preencher `STRIPE_WEBHOOK_SECRET`.

Outras:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_GA_ID`
- `MAGIC_LINK_EXPIRES_IN_MINUTES`
- `CRON_SECRET`

## Fluxo de Auth

Rotas:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/magic`
- `POST /api/auth/magic/consume`

Comportamento:

- Login cria cookie `auth.token` (`httpOnly`, `sameSite=lax`, `secure` em prod).
- Sessao e validada no proxy e novamente no servidor (layouts protegidos + APIs).
- `app/dashboard/layout.tsx` e `app/admin/layout.tsx` exigem sessao server-side.

## Workspace e `workspace_active_id`

Modelagem:

- Membership em `workspace_user` (role por workspace).
- Workspace ativo no usuario (`user.workspace_active_id`).

Fluxo:

- Usuario cria workspace via `POST /api/workspace`.
- Workspace ativo pode ser trocado via `PUT /api/profile` com `workspace_active_id`.
- Guards de API usam `verifyUserWorkspace` para bloquear acesso cross-workspace.

## Convites

Rotas:

- `POST /api/workspace/[workspaceId]/user` cria convite
- `GET /api/workspace/invite/[token]` consulta convite
- `POST /api/workspace/invite/[token]/accept` aceita convite
- `POST /api/admin/user/[userId]/invite/resend` reenvia convites

Seguranca:

- Token bruto nunca e salvo em banco.
- Banco guarda hash SHA-256 em `workspace_invite.token`.
- Lookup aceita hash (e fallback legado para tokens antigos em texto puro).

Fluxo de aceite:

- Se nao logado, usuario vai para `/login` ou `/register` e retorna para `/invite/[token]`.
- Se logado com email correto, o aceite ocorre automaticamente.

## Billing / Assinatura

Fluxo atual:

- Admin valida setup Stripe em `/admin/billing` (status da conta, webhook e eventos).
- Admin pode provisionar webhook automatico em `POST /api/admin/stripe/setup`.
- Catalogo de planos mantido no banco (`billing_plan`), gerenciado por admin.
- Cadastro de plano exige apenas `key` interna + `stripe_price_id`; os dados de nome, descricao, valor e intervalo sao sincronizados da Stripe.
- Checkout cria `Stripe Checkout Session` com `price_id` do plano cadastrado.
- Com assinatura ativa, gerenciamento ocorre no Stripe Portal.

Rotas:

- `GET /api/billing-plan` (usuario autenticado, planos ativos)
- `GET /api/admin/stripe/setup` (admin, status completo de setup Stripe)
- `POST /api/admin/stripe/setup` (admin, cria/atualiza webhook com eventos obrigatorios)
- `GET /api/admin/billing-plan` (admin, lista completa)
- `POST /api/admin/billing-plan` (admin, cria plano)
- `PATCH /api/admin/billing-plan/[planId]` (admin, atualiza plano)
- `POST /api/stripe/checkout` (owner/admin do workspace)
- `POST /api/stripe/portal` (owner/admin do workspace com plano pago ativo)

UX:

- Workspace sem plano pago ativo: mostra CTA para assinar.
- Workspace com plano pago ativo: mostra CTA para gerenciar assinatura.
- Dashboard mostra alerta de assinatura quando o workspace ativo esta no plano gratuito.
- Setup Stripe em admin valida:
  - Conexao com `STRIPE_SECRET_KEY`
  - Webhook `/api/stripe/webhook` existente
  - Eventos obrigatorios configurados
  - Price IDs ativos validos na conta Stripe
- Cards de plano do workspace priorizam recursos de marketing vindos da Stripe (`product.marketing_features`).

Helpers de plano:

- `lib/workspace-plan.ts`
  - `isWorkspacePlanActive(status)`
  - `hasWorkspacePaidPlan(workspace)`
  - `ensureWorkspaceHasPaidPlan(workspace)` (para bloqueios futuros)

## Rate Limit

Implementacao unificada em `lib/rate-limit.ts`.

- Dev: in-memory.
- Producao: persistente em PostgreSQL (`rate_limit_window`), com janela fixa por namespace/identificador.

Aplicado em endpoints sensiveis:

- Login, register, forgot/reset, magic link
- Criacao/consulta/aceite de convite
- Reenvio admin de convite e magic link

Resposta de limite excedido:

- HTTP 429
- `Retry-After` no header
- JSON padronizado `{ success: false, message }`

## Estrutura para evolucao

- `components/sections`: secoes de landing page
- `components/shared`: componentes compartilhados simples
- `content/site.ts`: textos/links da landing e footer
- `lib/schemas.ts`: schemas Zod centrais
- `lib/validation.ts`: parser de payload com Zod
- `lib/api-response.ts`: formato padrao de resposta
- `lib/workspace-plan.ts`: regras de status/validacao de assinatura

## Como adicionar uma nova feature

1. Defina schema Zod no `lib/schemas.ts`.
2. Crie/edite rota em `app/api/...` usando `parseJsonBody` e `apiSuccess/apiError`.
3. Aplique guards (`verifyUser`, `verifyUserWorkspace`) quando for privado.
4. Consuma no front via `lib/api.ts` e componentes pequenos por responsabilidade.
5. Atualize docs se houver nova env var ou fluxo.

## Checklist rapido de validacao

- `npm run build`
- Registro/login/logout
- Criar workspace
- Executar setup Stripe no `/admin/billing`
- Cadastrar plano no `/admin/billing`
- Selecionar workspace ativo
- Assinar plano via checkout
- Gerenciar assinatura via portal
- Convidar membro
- Aceitar convite (logado e nao logado)
- Verificar 429 sob abuso nos endpoints sensiveis


