# CHANGELOG - RepoLead

Padrão de registro:

- Título da entrada: `# YYYY-MM-DD HH:mm:ss`
- Seções obrigatórias: `Adicionado`, `Atualizado`, `Removido` se houver

# 2026-02-22 02:40:09

## Adicionado

- `lib/validation.ts` com helper `parseQueryInt` para parsing seguro de parâmetros numéricos em query string.

## Atualizado

- `app/api/destinations/route.ts`, `app/api/sources/route.ts`, `app/api/ingestions/route.ts`, `app/api/deliveries/route.ts` e `app/api/alerts/events/route.ts` para usar parsing robusto de `limit`/`offset`.
- `lib/repolead/delivery.ts` para reaproveitar payload seed no teste de destination quando não há `lead_id`/`ingest_id`.
- `content/i18n/pt.json`, `content/docs/pt/*.md`, páginas legais e telas com texto hardcoded para corrigir acentuação e consistência PT-BR.
- `content/i18n/en.json` e `app/(app)/dashboard/page.tsx` para corrigir regressões de texto/identificador detectadas na auditoria.
- `ROADMAP.md` com itens de auditoria concluídos e novos itens técnicos de melhoria.

## Removido

- Nenhuma remoção nesta entrada.

# 2026-02-22 01:36:25

## Adicionado

- `components/legal-page-layout.tsx` para padronizar apresentação das páginas legais.
- `app/acceptable-use/page.tsx` com Política de Uso Aceitável (AUP) completa.
- `app/aup/page.tsx` como alias de redirecionamento para `/acceptable-use`.

## Atualizado

- `app/privacy/page.tsx` reescrito com Política de Privacidade completa, sem placeholders.
- `app/terms/page.tsx` reescrito com Termos de Serviço completos, incluindo clausulas de beta e aviso de 14 dias para mudanças materiais de plano.
- `app/(marketing)/page.tsx` com links reais para docs, changelog, privacidade, termos e contato.
- `app/login/page.tsx`, `app/register/page.tsx` e `app/forgot-password/page.tsx` com referência também para a Política de Uso Aceitável.
- `ROADMAP.md` sincronizado com status atual das entregas legais.

## Removido

- Nenhuma remocao nesta entrada.

# 2026-02-21 20:20:04

## Adicionado

- `ROADMAP.md` com estrutura padrão (`Concluído`, `Em andamento`, `Próximas`, `Macro v2`).
- `CHANGELOG.md` para histórico continuo de evolução do projeto.

## Atualizado

- `README.md` reescrito com visão consolidada de arquitetura, módulos, rotas, APIs e operação.
- `DESCRIPTION.md` reescrito com contexto completo de produto, escopo funcional e arquitetura.
- `AGENTS.md` reestruturado com regras de governança documental e padrão de manutencao de envs.
- `stack.env` sincronizado para refletir as variáveis efetivamente usadas no codigo.
