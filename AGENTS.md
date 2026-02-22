# RepoLead - Regras de Engenharia

Este arquivo define as regras canonicas para evolucao do projeto.

## 0) Governanca documental (obrigatorio)

### 0.1 Arquivos estaveis (nao atualizar com frequencia)

Os arquivos abaixo sao estruturais e devem ser alterados somente quando realmente necessario:

- `README.md`
- `DESCRIPTION.md`
- `AGENTS.md`

So atualizar quando houver:

- nova regra de engenharia/processo;
- mudanca relevante de branding/posicionamento;
- mudanca estrutural real de arquitetura ou produto.

### 0.2 Arquivos vivos (atualizacao continua)

Os arquivos abaixo devem refletir sempre o estado atual:

- `ROADMAP.md`
- `CHANGELOG.md`

Regras:

- toda entrega relevante deve atualizar `ROADMAP.md` e `CHANGELOG.md`;
- `ROADMAP.md` deve usar secoes padrao: `Concluido`, `Em andamento`, `Proximas`, `Macro v2`;
- `CHANGELOG.md` deve registrar entradas no formato:
  - titulo: `# YYYY-MM-DD HH:mm:ss`
  - secoes: `Adicionado`, `Atualizado`, `Removido`.

## 1) Arquitetura obrigatoria

- Nao usar Server Actions.
- Toda operacao protegida deve estar em `app/api/**` (Route Handlers).
- Frontend deve consumir APIs por `lib/api.ts` (axios).
- Respeitar padroes existentes antes de criar alternativas.

## 2) Stack oficial

- Next.js 16 (App Router)
- React 19
- TypeScript strict
- PostgreSQL
- Prisma 7 (`prisma/generated`)
- Auth JWT (`bcryptjs` + `jose`)
- Zod para validacao

## 3) API: padrao unico

- Validacao com `parseJsonBody` + schemas em `lib/schemas.ts`.
- Resposta com `apiSuccess`, `apiError`, `apiRateLimit` (`lib/api-response.ts`).
- Tratamento de erro central via `onError` (`lib/helper.ts`).
- Autenticacao/autorizacao:
  - `verifyUser`
  - `verifyUserWorkspace`

## 4) Multi-tenant (workspace)

- Membership: `workspace_user`.
- Workspace ativo: `user.workspace_active_id`.
- Toda query mutavel de tenant deve respeitar `workspace_id`.
- Roles: `owner`, `admin`, `user`, `viewer`.

## 5) Rotas canonicas de produto

- `/dashboard`
- `/sources`, `/destinations`, `/leads`, `/ingestions`, `/deliveries`
- `/settings` (readonly com atalhos)
- `/settings/api-access`
- `/workspaces`, `/workspaces/create`, `/workspaces/[workspaceId]`, `/workspaces/[workspaceId]/edit`, `/workspaces/[workspaceId]/billing`
- `/profile`
- `/alerts` (acesso via Settings)

## 6) Endpoints canonicos de workspace

- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/[id]`
- `GET/POST /api/workspaces/[id]/members`
- `PATCH/DELETE /api/workspaces/[id]/members/[memberId]`
- `GET /api/workspaces/invite/[token]`
- `POST /api/workspaces/invite/[token]/accept`

## 7) Convites

- Token de convite nunca em plaintext no banco.
- Geracao/hash via `lib/invite-token.ts`.
- Em ambiente sem SMTP, URL de convite deve aparecer no log do servidor.

## 8) Integracoes modulares

- Catalogo unico em `lib/integrations/catalog.ts`.
- Modulo ativo em arquivo unico:
  - `lib/integrations/source/<id>.tsx`
  - `lib/integrations/destination/<id>.tsx`
- Cada modulo deve exportar schema, defaults, form e mapeadores de payload.

## 9) Convencoes de codigo

- Imports absolutos com `@/`.
- Nomes de arquivos/componentes em kebab-case.
- Evitar duplicidade de regras de negocio em multiplos lugares.
- Nao remover nada de `components/ui`.

## 10) Variaveis de ambiente (stack.env)

`stack.env` e o inventario canonico de envs do projeto.

Regras obrigatorias:

- toda env usada no codigo deve existir em `stack.env`;
- env removida do codigo deve ser removida de `stack.env`;
- env nova deve ser adicionada no mesmo PR da implementacao;
- `stack.env` deve refletir estado atual (adicionado/atualizado/removido);
- nao versionar segredo real: manter placeholders seguros;
- organizar por blocos (app, db, smtp, stripe, worker, healthcheck).

## 11) Qualidade minima antes de entrega

1. `npm run lint`
2. `npm run build`

Se houver mudanca de Prisma schema:

1. gerar migration versionada
2. validar build
3. atualizar documentacao (`README.md`, `DESCRIPTION.md`, `ROADMAP.md`, `CHANGELOG.md` se aplicavel)
