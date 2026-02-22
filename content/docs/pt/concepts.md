# Conceitos da plataforma

## Captura

A captura acontece via endpoint único:

- `POST /api/v1/leads/ingest`
- aceita JSON e form-urlencoded
- respeita `Idempotency-Key`

## Workspace (multi-tenant)

Cada registro e isolado por `workspace_id`.

- Sources, leads, deliveries e alertas sempre ficam no escopo do workspace.
- Chaves de leitura da API pública também são por workspace.

## Dedupe e identidade

RepoLead faz normalização mínima de identidades:

- email
- phone
- external_id

Se a identidade já existir no workspace, o lead e mesclado no mesmo `lead_id`.

## Timeline append-only

Toda mudanca relevante gera evento de timeline:

- capturada
- normalizada
- mesclada
- entregue
- falha de entrega
- replay

## Entregas, retry e DLQ

Quando existe destination ativa:

1. o evento entra em `delivery` com status pendente
2. tentativa de envio para webhook
3. em caso de falha, retry com backoff
4. se exceder tentativas, vai para `dead_letter`
5. pode ser reenfileirada via replay
