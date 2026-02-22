# ROADMAP - RepoLead

Ultima atualizacao: 2026-02-22

## Concluido

- [x] Base multi-tenant de workspaces com membership e roles (`owner`, `admin`, `user`, `viewer`).
- [x] Fluxo completo de ingestao (`/api/v1/leads/ingest`) com idempotencia, normalizacao e dedupe.
- [x] Timeline de lead (`lead_event`) com eventos de ingestao, merge, update e entrega.
- [x] Modulo de sources com CRUD, rotacao e revogacao de API keys (`lv_sk_*`).
- [x] Modulo de destinations com CRUD, teste de entrega e assinatura de payload.
- [x] Mecanismo de deliveries com retry, backoff e estado `dead_letter`.
- [x] Replay unitario e replay em lote de deliveries.
- [x] API publica de leitura com read keys (`lv_rk_*`) e rate limit por chave.
- [x] Exportacao de leads via CSV e por email com token assinado.
- [x] Dashboard operacional com metricas, top sources e falhas recentes.
- [x] Alert rules e eventos de alerta por workspace.
- [x] Convites de workspace com token hash e aceite autenticado.
- [x] Billing com Stripe (checkout, portal, webhook) e setup admin de webhook.
- [x] Worker de producao para cron interno de deliveries e resumo diario.
- [x] Centro de documentacao publica PT/EN em `/docs`.
- [x] Catalogo modular de integracoes com modulos ativos para source e destination.
- [x] Padronizacao base de documentacao tecnica e operacional (`README`, `DESCRIPTION`, `AGENTS`).
- [x] Publicacao das paginas legais completas: `/privacy`, `/terms` e `/acceptable-use` (com alias `/aup`).

## Em andamento

- [ ] Padrao continuo de governanca para `ROADMAP.md` e `CHANGELOG.md`.
- [ ] Revisao de consistencia textual da UI (pt/en) e padronizacao de mensagens.
- [ ] Revisao de qualidade de conteudo em paginas publicas placeholder (`/blog`, `/changelog`).

## Proximas

- [ ] Publicar conteudo real para Blog e Changelog publico.
- [ ] Plugin WordPress junto com Elementor Forms para capturar de qualquer formulario sem webhook.
- [ ] Expandir integracoes `soon` do catalogo: Meta Lead Ads.
- [ ] Expandir integracoes `soon` do catalogo: Elementor Forms.
- [ ] Expandir integracoes `soon` do catalogo: React SDK.
- [ ] Expandir integracoes `soon` do catalogo: Custom Source.
- [ ] Expandir integracoes `soon` do catalogo: Custom Destination.
- [ ] Melhorar observabilidade (dashboards operacionais e diagnostico de falhas).
- [ ] Evoluir cobertura de testes automatizados para API/domain critical path.
- [ ] Refinar experiencia de onboarding para setup de sources e destinations.

## Macro v2

- [ ] Separar runtime web e worker em servicos independentes com fila dedicada.
- [ ] Motor avancado de alertas (thresholds dinamicos, silenciamento e escalonamento).
- [ ] Politicas de retencao por entidade e automacoes de housekeeping.
- [ ] Camada analitica de funil e performance de entregas por periodo/fonte.
- [ ] Marketplace de conectores com templates versionados e validacao automatica.
