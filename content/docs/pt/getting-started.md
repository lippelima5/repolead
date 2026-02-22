# Getting Started com RepoLead

RepoLead e uma plataforma API-first para **Captura**, dedupe e distribuição confiável de leads por workspace.

## 1) Criar workspace

1. Acesse `Workspaces`.
2. Clique em `Criar workspace`.
3. Defina nome, retenção e janela de idempotência.

## 2) Configurar uma source

1. Acesse `Sources`.
2. Clique em `Escolher no catálogo`.
3. Configure uma integração ativa (ex: Universal Webhook, n8n Ingoing).
4. Gere uma API key da source.

## 3) Enviar sua primeira captura

```bash
curl -X POST "https://seu-dominio.com/api/v1/leads/ingest" \
  -H "Authorization: Bearer lv_sk_xxx" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: lead-001" \
  -d '{"name":"Ana","email":"ana@empresa.com"}'
```

## 4) Validar no produto

- `Capturas`: confirma recebimento.
- `Leads`: confirma dedupe e status.
- `Entregas`: confirma fan-out, retries e DLQ.

## 5) Exportar e integrar

- Exportação CSV: tela `Leads` > `Baixar CSV`.
- Exportação por email: tela `Leads` > `Enviar por email`.
- API pública: `Settings` > `API Access` para gerar chave de leitura.

## Telas principais

- Dashboard: KPIs operacionais.
- Sources / Destinations: configuração de entradas e saidas.
- Leads: consulta, filtros e exportação.
- Deliveries: histórico de entregas e replay.
- Settings: dados do workspace e acesso de API.
