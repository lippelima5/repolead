# Integrações e exemplos

## Exemplo n8n (consulta de leads)

### HTTP Request node

- Method: `GET`
- URL: `https://seu-dominio.com/api/v1/leads?limit=50`
- Header:
  - `Authorization: Bearer lv_rk_xxx`

## Exemplo backend Node.js

```js
const response = await fetch("https://seu-dominio.com/api/v1/leads?query=ana", {
  headers: {
    Authorization: "Bearer lv_rk_xxx",
  },
});

const payload = await response.json();
console.log(payload.data.items);
```

## Exemplo de captura com formulario HTML

Envie para `POST /api/v1/leads/ingest` com chave de source.

## Boas praticas

- mantenha chaves separadas por ambiente
- rotacione chaves periodicamente
- registre `Idempotency-Key` em capturas
- use filtros e paginacao para sincronizacao incremental