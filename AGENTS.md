# RepoLead - Regras de Engenharia

Este arquivo define as regras canônicas para evolução do projeto.

## 0) Governança documental (obrigatório)

### 0.1 Arquivos estáveis (não atualizar com frequência)

Os arquivos abaixo são estruturais e devem ser alterados somente quando realmente necessário:

- `README.md`
- `DESCRIPTION.md`
- `AGENTS.md`

Só atualizar quando houver:

- nova regra de engenharia/processo;
- mudanca relevante de branding/posicionamento;
- mudanca estrutural real de arquitetura ou produto.

### 0.2 Arquivos vivos (atualização contínua)

Os arquivos abaixo devem refletir sempre o estado atual:

- `ROADMAP.md`
- `CHANGELOG.md`

Regras:

- toda entrega relevante deve atualizar `ROADMAP.md` e `CHANGELOG.md`;
- `ROADMAP.md` deve usar seções padrão: `Concluído`, `Em andamento`, `Próximas`, `Macro v2`;
- `CHANGELOG.md` deve registrar entradas no formato:
  - título: `# YYYY-MM-DD HH:mm:ss`
  - seções: `Adicionado`, `Atualizado`, `Removido`.

## 1) Arquitetura obrigatoria

- Não usar Server Actions.
- Toda operação protegida deve estar em `app/api/**` (Route Handlers).
- Frontend deve consumir APIs por `lib/api.ts` (axios).
- Respeitar padroes existentes antes de criar alternativas.

## 2) Stack oficial

- Next.js 16 (App Router)
- React 19
- TypeScript strict
- PostgreSQL
- Prisma 7 (`prisma/generated`)
- Auth JWT (`bcryptjs` + `jose`)
- Zod para validação

## 3) API: padrão único

- Validação com `parseJsonBody` + schemas em `lib/schemas.ts`.
- Resposta com `apiSuccess`, `apiError`, `apiRateLimit` (`lib/api-response.ts`).
- Tratamento de erro central via `onError` (`lib/helper.ts`).
- Autenticação/autorização:
  - `verifyUser`
  - `verifyUserWorkspace`

## 4) Multi-tenant (workspace)

- Membership: `workspace_user`.
- Workspace ativo: `user.workspace_active_id`.
- Toda query mutavel de tenant deve respeitar `workspace_id`.
- Roles: `owner`, `admin`, `user`, `viewer`.

## 5) Rotas canônicas de produto

- `/dashboard`
- `/sources`, `/destinations`, `/leads`, `/ingestions`, `/deliveries`
- `/settings` (readonly com atalhos)
- `/settings/api-access`
- `/workspaces`, `/workspaces/create`, `/workspaces/[workspaceId]`, `/workspaces/[workspaceId]/edit`, `/workspaces/[workspaceId]/billing`
- `/profile`
- `/alerts` (acesso via Settings)

## 6) Endpoints canônicos de workspace

- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/[id]`
- `GET/POST /api/workspaces/[id]/members`
- `PATCH/DELETE /api/workspaces/[id]/members/[memberId]`
- `GET /api/workspaces/invite/[token]`
- `POST /api/workspaces/invite/[token]/accept`

## 7) Convites

- Token de convite nunca em plaintext no banco.
- Geração/hash via `lib/invite-token.ts`.
- Em ambiente sem SMTP, URL de convite deve aparecer no log do servidor.

## 8) Integrações modulares

- Catálogo único em `lib/integrations/catalog.ts`.
- Módulo ativo em arquivo único:
  - `lib/integrations/source/<id>.tsx`
  - `lib/integrations/destination/<id>.tsx`
- Cada módulo deve exportar schema, defaults, form e mapeadores de payload.

## 9) Convencoes de codigo

- Imports absolutos com `@/`.
- Nomes de arquivos/componentes em kebab-case.
- Evitar duplicidade de regras de negócio em múltiplos lugares.
- Não remover nada de `components/ui`.

## 10) Variáveis de ambiente (stack.env)

`stack.env` e o inventario canônico de envs do projeto.

Regras obrigatórias:

- toda env usada no codigo deve existir em `stack.env`;
- env removida do codigo deve ser removida de `stack.env`;
- env nova deve ser adicionada no mesmo PR da implementacao;
- `stack.env` deve refletir estado atual (adicionado/atualizado/removido);
- não versionar segredo real: manter placeholders seguros;
- organizar por blocos (app, db, smtp, stripe, worker, healthcheck).

## 11) Qualidade mínima antes de entrega

1. `npm run lint`
2. `npm run build`

Se houver mudanca de Prisma schema:

1. gerar migration versionada
2. validar build
3. atualizar documentação (`README.md`, `DESCRIPTION.md`, `ROADMAP.md`, `CHANGELOG.md` se aplicável)
