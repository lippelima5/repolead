# Platform concepts

## Capture

All capture happens through a single endpoint:

- `POST /api/v1/leads/ingest`
- accepts JSON and form-urlencoded
- supports `Idempotency-Key`

## Workspace isolation

All records are tenant-scoped by `workspace_id`.

- sources, leads, deliveries and alerts are isolated
- public read API keys are also workspace-scoped

## Identity and dedupe

RepoLead normalizes:

- email
- phone
- external_id

When identity already exists in the workspace, events are merged into the same `lead_id`.

## Append-only timeline

Key lifecycle events are stored in timeline:

- captured
- normalized
- merged
- delivered
- delivery_failed
- replayed

## Delivery lifecycle

1. event enqueued as pending delivery
2. webhook attempt
3. retry on failure
4. dead-letter after max attempts
5. replay available
