# RepoLead Getting Started

RepoLead is an API-first platform for lead **Capture**, dedupe and reliable delivery by workspace.

## 1) Create a workspace

1. Open `Workspaces`.
2. Click `Create workspace`.
3. Configure retention and idempotency window.

## 2) Configure a source

1. Open `Sources`.
2. Click `Browse catalog`.
3. Configure an active integration (Universal Webhook, n8n Ingoing, etc).
4. Generate a source API key.

## 3) Send your first capture

```bash
curl -X POST "https://your-domain.com/api/v1/leads/ingest" \
  -H "Authorization: Bearer lv_sk_xxx" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: lead-001" \
  -d '{"name":"Ana","email":"ana@company.com"}'
```

## 4) Validate the pipeline

- `Captures`: intake status.
- `Leads`: dedupe and canonical record.
- `Deliveries`: fan-out, retries and DLQ.

## 5) Export and integrate

- CSV export: `Leads` > `Download CSV`.
- Email export: `Leads` > `Send by email`.
- Public API keys: `Settings` > `API Access`.
