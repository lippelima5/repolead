# Public read API

Use the public API to query leads from external platforms.

## Create a read API key

1. Open `Settings`.
2. Go to `API Access`.
3. Create a `Read API key`.
4. Copy the key immediately (shown once).

## Authentication

Use one of these headers:

- `Authorization: Bearer lv_rk_xxx`
- `X-Api-Key: lv_rk_xxx`

## Endpoints

### List leads

`GET /api/v1/leads`

Query params:

- `query`
- `status`
- `source` or `sourceId`
- `tag`
- `limit` (max 200)
- `offset`

```bash
curl "https://your-domain.com/api/v1/leads?status=new&limit=20" \
  -H "Authorization: Bearer lv_rk_xxx"
```

### Lead detail

`GET /api/v1/leads/{id}`

### Lead timeline

`GET /api/v1/leads/{id}/timeline`

## Limits and errors

- default limit: 120 req/min per key
- `401`: missing/invalid key
- `404`: lead not found in key workspace
- `429`: rate limit exceeded