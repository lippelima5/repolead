# CHANGELOG - RepoLead

Padrao de registro:

- Titulo da entrada: `# YYYY-MM-DD HH:mm:ss`
- Secoes obrigatorias: `Adicionado`, `Atualizado`, `Removido` se houver

# 2026-02-22 01:36:25

## Adicionado

- `components/legal-page-layout.tsx` para padronizar apresentacao das paginas legais.
- `app/acceptable-use/page.tsx` com Politica de Uso Aceitavel (AUP) completa.
- `app/aup/page.tsx` como alias de redirecionamento para `/acceptable-use`.

## Atualizado

- `app/privacy/page.tsx` reescrito com Politica de Privacidade completa, sem placeholders.
- `app/terms/page.tsx` reescrito com Termos de Servico completos, incluindo clausulas de beta e aviso de 14 dias para mudancas materiais de plano.
- `app/(marketing)/page.tsx` com links reais para docs, changelog, privacidade, termos e contato.
- `app/login/page.tsx`, `app/register/page.tsx` e `app/forgot-password/page.tsx` com referencia tambem para a Politica de Uso Aceitavel.
- `ROADMAP.md` sincronizado com status atual das entregas legais.

## Removido

- Nenhuma remocao nesta entrada.

# 2026-02-21 20:20:04

## Adicionado

- `ROADMAP.md` com estrutura padrao (`Concluido`, `Em andamento`, `Proximas`, `Macro v2`).
- `CHANGELOG.md` para historico continuo de evolucao do projeto.

## Atualizado

- `README.md` reescrito com visao consolidada de arquitetura, modulos, rotas, APIs e operacao.
- `DESCRIPTION.md` reescrito com contexto completo de produto, escopo funcional e arquitetura.
- `AGENTS.md` reestruturado com regras de governanca documental e padrao de manutencao de envs.
- `stack.env` sincronizado para refletir as variaveis efetivamente usadas no codigo.
