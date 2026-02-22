# API pública de leitura

A API pública permite consultar leads a partir de outras plataformas.

## Gerar chave de leitura

1. Acesse `Settings`.
2. Abra `API Access`.
3. Crie uma `Read API key`.
4. Copie a chave no momento da criacao (ela aparece uma vez).

## Autenticação

Use uma das opcoes:

- `Authorization: Bearer lv_rk_xxx`
- `X-Api-Key: lv_rk_xxx`

## Endpoints

### Listar leads

`GET /api/v1/leads`

Query params:

- `query`
- `status`
- `source` ou `sourceId`
- `tag`
- `limit` (max 200)
- `offset`

Exemplo:

```bash
curl "https://seu-dominio.com/api/v1/leads?status=new&limit=20" \
  -H "Authorization: Bearer lv_rk_xxx"
```

### Detalhar lead

`GET /api/v1/leads/{id}`

```bash
curl "https://seu-dominio.com/api/v1/leads/cld123" \
  -H "X-Api-Key: lv_rk_xxx"
```

### Timeline do lead

`GET /api/v1/leads/{id}/timeline`

## Limites e respostas

- rate limit inicial: 120 req/min por chave
- `401`: chave ausente/inválida
- `404`: lead não encontrada no workspace da chave
- `429`: limite excedido