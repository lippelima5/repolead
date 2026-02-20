# SECURITY_CHECK

Data da auditoria inicial: 2026-02-20
Data da atualizacao de correcoes: 2026-02-20
Projeto: RepoLead
Escopo: API routes (`app/api/**`), proxy (`proxy.ts`), auth (`lib/helper.ts`, `lib/auth-*`), chaves de source/read (`lib/repolead/*`), multi-tenant (`workspace_id`), CORS, rate-limit e exposicao de segredos.

## Confirmacao principal (pedido original)

Status: **confirmado no codigo atual: chave `lv_sk_*` so envia (ingest) e nao le dados.**

Evidencias:
- `app/api/v1/leads/ingest/route.ts` valida `lv_sk_*` para ingest e bloqueia `lv_rk_*`.
- `app/api/v1/leads/route.ts`, `app/api/v1/leads/[id]/route.ts` e `app/api/v1/leads/[id]/timeline/route.ts` exigem `requireWorkspaceReadApiKey`.
- `lib/repolead/read-api-key.ts` valida somente `lv_rk_*` contra `workspace_read_api_key` (tabela separada de `api_key`).

## Correcoes aplicadas nesta rodada

### [CRITICO] Fallback em convite (hash reutilizavel) - **CORRIGIDO**

Alteracao:
- Removido fallback plaintext; agora lookup usa apenas `tokenHash`.

Arquivos:
- `app/api/workspaces/invite/[token]/route.ts`
- `app/api/workspaces/invite/[token]/accept/route.ts`

Observacao:
- Conforme alinhado, nao foi feita limpeza legada em banco.

---

### [ALTO] Segredos no `ingestion.headers_json` - **CORRIGIDO**

Alteracao:
- Adicionada sanitizacao de headers antes da persistencia.
- Headers sensiveis (authorization, api-key, cookie, token, secret e similares) nao sao mais gravados.

Arquivo:
- `app/api/v1/leads/ingest/route.ts`

---

### [ALTO] SSRF em destinos (URL livre + fetch server-side) - **CORRIGIDO**

Alteracao:
- Novo modulo de seguranca de URL com:
  - bloqueio de hosts internos/localhost;
  - bloqueio de IPs privados, loopback e link-local (IPv4/IPv6);
  - resolucao DNS e validacao dos IPs resolvidos.
- Validacao aplicada no create/update de destination.
- Revalidacao aplicada no envio real (dispatch), com `redirect: "error"` para reduzir bypass via redirecionamento.

Arquivos:
- `lib/repolead/destination-url-security.ts` (novo)
- `app/api/destinations/route.ts`
- `app/api/destinations/[id]/route.ts`
- `lib/repolead/delivery.ts`

---

### [ALTO] Exposicao de dados sensiveis de destination para qualquer membro - **CORRIGIDO**

Alteracao:
- Rotas de leitura de destinations agora exigem permissao admin do workspace.

Arquivos:
- `app/api/destinations/route.ts`
- `app/api/destinations/[id]/route.ts`

## Pendencias para estudo futuro (sem correcao nesta rodada)

### [MEDIO] Chave de API aceita via query string no ingest

Risco:
- Vazamento em logs, historico, analytics e referrer.

Evidencia:
- `app/api/v1/leads/ingest/route.ts` ainda aceita `api_key` na query string.

Sugestao:
- Remover suporte por query param e manter apenas header (`Authorization`/`x-api-key`).

---

### [MEDIO] Rate limit por IP confia em `x-forwarded-for`

Risco:
- Dependendo da borda/proxy, pode haver spoof de IP.

Evidencia:
- `lib/request.ts` prioriza `x-forwarded-for`.

Sugestao:
- Confiar apenas em headers de proxy trusted (com validacao da infraestrutura).

---

### [MEDIO] Permissao de update de lead pode estar ampla para `viewer`

Risco:
- Se `viewer` deveria ser read-only, o endpoint atual permite escrita.

Evidencia:
- `app/api/leads/[id]/route.ts` usa `requireWorkspace(request)` na mutacao sem `requireAdmin`.

Sugestao:
- Definir matriz de permissoes por role e aplicar guard centralizado.

---

### [MEDIO] Exposicao de metadados de source keys para nao-admin

Risco:
- GET de source detalhada inclui `api_keys` para qualquer membro.

Evidencia:
- `app/api/sources/[id]/route.ts` inclui `api_keys` sem exigir admin no GET.

Sugestao:
- Restringir GET para admin ou remover campos sensiveis.

---

### [BAIXO] Prefixo amplo liberado no proxy para GET/HEAD em `/api/v1/leads/**`

Risco:
- Pode facilitar regressao futura se nova rota GET for adicionada sem guard local.

Evidencia:
- `proxy.ts` trata prefixo `/api/v1/leads/**` como publico no middleware.

Sugestao:
- Trocar por allowlist explicita de rotas publicas.

## Observacao final

Esta auditoria foi estatica (code review profundo). Nao inclui pentest dinamico externo nem varredura de dependencias CVE.
