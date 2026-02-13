# VibeKit - Regras de Engenharia (Estado Atual)

Este documento define as convencoes obrigatorias para evoluir o projeto sem regressao.

## 1. Regras Arquiteturais Obrigatorias
- Nao usar Server Actions.
- Toda leitura/mutacao protegida deve ser feita em Route Handlers (`app/api/**`).
- Frontend deve consumir API via `lib/api.ts` (axios) e contexts/hooks existentes.
- Nao remover nada de `components/ui`.
- Preferir padroes ja existentes no repositorio antes de criar alternativa nova.

## 2. Stack Atual
- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- PostgreSQL
- Prisma 7 (client gerado em `prisma/generated`)
- Auth com `bcryptjs` + `jose` (JWT)
- Validacao com Zod
- Stripe, Nodemailer, Winston

## 3. Estrutura de Pastas
```txt
app/
  api/
components/
  ui/
  sections/
  shared/
content/
contexts/
emails/
hooks/
lib/
prisma/
types/
```

Notas:
- `components/sections`: secoes de landing page.
- `components/shared`: componentes reutilizaveis pequenos.

## 4. Padrao de API
### 4.1 Validacao de input
- Definir schemas em `lib/schemas.ts`.
- Validar payload com `parseJsonBody` (`lib/validation.ts`).
- Nao fazer parsing manual repetitivo em cada rota.

### 4.2 Resposta JSON
- Usar `lib/api-response.ts`:
  - `apiSuccess(data, { message?, status? })`
  - `apiError(message, status, errors?)`
  - `apiRateLimit(message, retryAfterSeconds)`
- Erros devem passar por `onError` (`lib/helper.ts`).

### 4.3 Auth/Autorizacao em API
- Usar `verifyUser(request, isAdmin?)` para autenticacao.
- Usar `verifyUserWorkspace(request, isAdmin?, workspaceId?)` para escopo de workspace.
- Nao depender de validacao client-side para autorizacao.

## 5. Sessao e Protecao de Paginas
- Cookie de sessao: `auth.token` (httpOnly, sameSite=lax, secure em producao).
- Verificacao server-side de sessao em renderizacao:
  - `app/dashboard/layout.tsx` usa `requireServerSession`.
  - `app/admin/layout.tsx` usa `requireServerSession({ requireAdmin: true })`.
- `proxy.ts` aplica protecao de rotas web e API.

## 6. Seguranca
- Headers de seguranca aplicados em:
  - `proxy.ts`
  - `next.config.ts`
- Checagem de origem (`Origin`) em mutacoes de API com cookie para hardening CSRF.
- Senhas sempre com hash forte (`bcryptjs`).

## 7. Multi-Tenant (Workspace)
- Membership em `workspace_user`.
- Workspace ativo em `user.workspace_active_id`.
- Guards de workspace sao obrigatorios em endpoints de tenant.
- Roles por workspace:
  - `owner`, `admin`, `user`, `viewer`.

## 8. Billing (Stripe)
- Catalogo de planos e mantido no banco (`billing_plan`), nao em env de payment links.
- `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` permanecem em env.
- Cadastro/manutencao de `price_id` e feito no painel admin (`/admin/billing`).
- Ao criar plano, priorizar input minimo (`key` + `stripe_price_id`) e sincronizar metadados a partir da Stripe.
- Setup Stripe deve ser feito/validado no admin:
  - `GET /api/admin/stripe/setup` para status de chave, webhook, eventos e price IDs.
  - `POST /api/admin/stripe/setup` para criar/atualizar webhook automaticamente.
- Checkout deve usar `POST /api/stripe/checkout` criando `Checkout Session` com `price_id`.
- Workspace com assinatura ativa deve gerenciar mudancas via Stripe Portal.
- Workspace sem assinatura ativa deve ver CTA de assinatura.
- Helper de regra de plano: `lib/workspace-plan.ts`.
- Helper de setup Stripe: `lib/stripe-setup.ts`.
- Helper de sync de price/produto Stripe: `lib/stripe-plan.ts`.

## 9. Convites
- Token de convite nao deve ser salvo em plaintext novo.
- Geracao/hash centralizada em `lib/invite-token.ts`:
  - `createInviteToken()`
  - `hashInviteToken()`
- Banco armazena hash em `workspace_invite.token`.
- Lookup de convite aceita fallback legado para tokens antigos plaintext.

Fluxo esperado:
- Criacao: `POST /api/workspace/[workspaceId]/user`
- Consulta publica: `GET /api/workspace/invite/[token]`
- Aceite: `POST /api/workspace/invite/[token]/accept`
- Reenvio admin: `POST /api/admin/user/[userId]/invite/resend`

## 10. Rate Limit
- Implementacao unica: `lib/rate-limit.ts` (assincrona).
- Ambiente de desenvolvimento: in-memory.
- Producao: persistencia em PostgreSQL (`rate_limit_window`).

## 11. Prisma e Banco
- Manter geracao do Prisma Client em `prisma/generated`.
- Alteracao de schema sempre com migration versionada.
- Respeitar naming atual (models/enums em lowercase; colunas em snake_case).

## 12. Convencoes de Codigo
- Imports absolutos com `@/`.
- Componentes e arquivos em kebab-case.
- Evitar componentes grandes com multiplas responsabilidades.
- Reutilizar helpers existentes antes de criar novo helper paralelo.

## 13. Qualidade e CI local

Antes de finalizar mudancas:
1. `npm run lint`
2. `npm run build`

Se alterar schema:
1. gerar migration
2. validar build
3. atualizar docs quando necessario

## 14. Documentacao
- README deve refletir fluxos atuais (auth, workspace ativo, convites, rate-limit).
- Atualize este `AGENTS.md` quando padroes mudarem.
