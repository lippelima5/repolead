# Exportação de dados

RepoLead oferece dois fluxos de exportação de leads.

## 1) Baixar CSV na hora

Tela `Leads` -> botao `Baixar CSV`.

- aplica filtros atuais de busca/status
- gera arquivo CSV no browser
- colunas padrão:
  - `id`
  - `name`
  - `email`
  - `phone`
  - `status`
  - `tags`
  - `created_at`
  - `updated_at`
  - `identities`

Endpoint usado:

- `GET /api/leads/export.csv`

## 2) Enviar link por email

Tela `Leads` -> botao `Enviar por email`.

- envia para o email do usuário logado
- gera link assinado com expiracao de 24h
- não envia anexo para evitar limite de SMTP

Endpoint usado:

- `POST /api/leads/export/email`

## Observacoes

- exportação sincronica limitada a 10.000 linhas por requisição
- payload bruto não entra no CSV por padrão
- escopo sempre restrito ao workspace ativo
