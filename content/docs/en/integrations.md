# Integrations and examples

## n8n example (read leads)

HTTP Request node:

- Method: `GET`
- URL: `https://your-domain.com/api/v1/leads?limit=50`
- Header: `Authorization: Bearer lv_rk_xxx`

## Node.js backend example

```js
const response = await fetch("https://your-domain.com/api/v1/leads?query=ana", {
  headers: {
    Authorization: "Bearer lv_rk_xxx",
  },
});

const payload = await response.json();
console.log(payload.data.items);
```

## HTML form capture

Send form data to `POST /api/v1/leads/ingest` using a source API key.

## Best practices

- use separate keys per environment
- rotate keys regularly
- send `Idempotency-Key` on capture
- paginate and filter for incremental sync