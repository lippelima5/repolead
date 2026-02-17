# Data exports

RepoLead provides two lead export flows.

## 1) Instant CSV download

`Leads` screen -> `Download CSV`.

- respects current filters
- returns CSV file in browser
- default columns:
  - `id`
  - `name`
  - `email`
  - `phone`
  - `status`
  - `tags`
  - `created_at`
  - `updated_at`
  - `identities`

Endpoint:

- `GET /api/leads/export.csv`

## 2) Email export link

`Leads` screen -> `Send by email`.

- sends only to the authenticated user email
- generates a signed URL with 24h expiration
- uses link (not attachment) for reliability

Endpoint:

- `POST /api/leads/export/email`

## Notes

- synchronous export limit: 10,000 rows/request
- raw payload is not included by default
- workspace scope is always enforced
