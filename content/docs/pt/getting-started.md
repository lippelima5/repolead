# Getting Started com RepoLead

RepoLead e uma plataforma API-first para **Captura**, dedupe e distribuicao confiavel de leads por workspace.

## 1) Criar workspace

1. Acesse `Workspaces`.
2. Clique em `Criar workspace`.
3. Defina nome, retencao e janela de idempotencia.

## 2) Configurar uma source

1. Acesse `Sources`.
2. Clique em `Escolher no catalogo`.
3. Configure uma integracao ativa (ex: Universal Webhook, n8n Ingoing).
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

- Exportacao CSV: tela `Leads` > `Baixar CSV`.
- Exportacao por email: tela `Leads` > `Enviar por email`.
- API publica: `Settings` > `API Access` para gerar chave de leitura.

## Telas principais

- Dashboard: KPIs operacionais.
- Sources / Destinations: configuracao de entradas e saidas.
- Leads: consulta, filtros e exportacao.
- Deliveries: historico de entregas e replay.
- Settings: dados do workspace e acesso de API.
