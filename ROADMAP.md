# ROADMAP - RepoLead

Última atualização: 2026-02-22

## Concluído

- [x] Base multi-tenant de workspaces com membership e roles (`owner`, `admin`, `user`, `viewer`).
- [x] Fluxo completo de ingestão (`/api/v1/leads/ingest`) com idempotência, normalização e dedupe.
- [x] Timeline de lead (`lead_event`) com eventos de ingestão, merge, update e entrega.
- [x] Módulo de sources com CRUD, rotação e revogação de API keys (`lv_sk_*`).
- [x] Módulo de destinations com CRUD, teste de entrega e assinatura de payload.
- [x] Mecanismo de deliveries com retry, backoff e estado `dead_letter`.
- [x] Replay unitário e replay em lote de deliveries.
- [x] API pública de leitura com read keys (`lv_rk_*`) e rate limit por chave.
- [x] Exportação de leads via CSV e por email com token assinado.
- [x] Dashboard operacional com métricas, top sources e falhas recentes.
- [x] Alert rules e eventos de alerta por workspace.
- [x] Convites de workspace com token hash e aceite autenticado.
- [x] Billing com Stripe (checkout, portal, webhook) e setup admin de webhook.
- [x] Worker de produção para cron interno de deliveries e resumo diário.
- [x] Centro de documentação pública PT/EN em `/docs`.
- [x] Catálogo modular de integrações com módulos ativos para source e destination.
- [x] Padronizacao base de documentação técnica e operacional (`README`, `DESCRIPTION`, `AGENTS`).
- [x] Publicacao das páginas legais completas: `/privacy`, `/terms` e `/acceptable-use` (com alias `/aup`).
- [x] Auditoria geral de páginas e APIs com validação por `npm run lint` e `npm run build`.
- [x] Correção de parsing de `limit`/`offset` nas APIs de listagem para evitar `NaN` em paginação.
- [x] Correção do fluxo de teste de destination para respeitar payload seed quando não há `lead_id`/`ingest_id`.
- [x] Correção de acentuação PT-BR em páginas, componentes e documentação principal.

## Em andamento

- [ ] Padrão continuo de governança para `ROADMAP.md` e `CHANGELOG.md`.
- [ ] Revisão de consistencia textual da UI (pt/en) e padronizacao de mensagens.
- [ ] Revisão de qualidade de conteúdo em páginas públicas placeholder (`/blog`, `/changelog`).

## Próximas

- [ ] Publicar conteúdo real para Blog e Changelog público.
- [ ] Plugin WordPress junto com Elementor Forms para capturar de qualquer formulario sem webhook.
- [ ] Expandir integrações `soon` do catálogo: Meta Lead Ads.
- [ ] Expandir integrações `soon` do catálogo: Elementor Forms.
- [ ] Expandir integrações `soon` do catálogo: React SDK.
- [ ] Expandir integrações `soon` do catálogo: Custom Source.
- [ ] Expandir integrações `soon` do catálogo: Custom Destination.
- [ ] Melhorar observabilidade (dashboards operacionais e diagnóstico de falhas).
- [ ] Evoluir cobertura de testes automatizados para API/domain critical path.
- [ ] Adicionar testes automatizados para paginação inválida e rota `/api/destinations/[id]/test`.
- [ ] Migrar textos hardcoded restantes para i18n (`pt-BR`/`en`) e manter revisão editorial contínua.
- [ ] Refinar experiência de onboarding para setup de sources e destinations.

## Macro v2

- [ ] Separar runtime web e worker em serviços independentes com fila dedicada.
- [ ] Motor avancado de alertas (thresholds dinamicos, silenciamento e escalonamento).
- [ ] Políticas de retenção por entidade e automações de housekeeping.
- [ ] Camada analítica de funil e performance de entregas por período/fonte.
- [ ] Marketplace de conectores com templates versionados e validação automática.
