# RepoLead

## Nome

RepoLead

## Descrição curta

Plataforma API-first para captura, dedupe e distribuição confiável de leads por workspace.

## Descrição longa

RepoLead centraliza a captura, armazenamento e orquestracao de leads para equipes que recebem dados de varias origens (formularios, automações, webhooks e integrações customizadas).

Em vez de cada sistema manter logica própria de deduplicação, histórico e entrega, o RepoLead atua como camada canônica:

- recebe eventos em endpoint único de captura;
- aplica idempotência e normalização de identidades;
- faz merge de duplicados por workspace;
- registra timeline de auditoria append-only;
- distribui eventos para destinations com assinatura, retry e DLQ.

## O que e o projeto

Produto SaaS B2B de Lead Operations com foco em confiabilidade, rastreabilidade e extensibilidade modular.

## Para quem e

- times de Marketing Ops e Revenue Ops;
- SaaS que precisam padronizar captura de leads entre canais;
- equipes de engenharia que querem desacoplar origem e destino de dados;
- operações com necessidade de auditoria e replay de falhas.

## Identidade da ferramenta

- API-first e orientada a fluxo;
- visual clean, operacional e objetivo;
- foco em estabilidade, clareza e escala.

## Tipografia adotada

- familia principal: `Inter`;
- estilo: leitura técnica limpa, hierarquia forte em dashboards e tabelas;
- uso predominante: pesos 400, 500, 600 e 700.

## Cores e design system

- primario da plataforma: `hsl(239 84% 67%)` (aprox. `#6366F1`);
- superficies:
  - `surface-1`: `hsl(0 0% 100%)`
  - `surface-2`: `hsl(240 5% 96%)`
  - `surface-3`: `hsl(240 5% 93%)`
- texto:
  - foreground: `hsl(240 10% 4%)`
  - muted: `hsl(240 4% 46%)`
- estados:
  - success: `hsl(142 71% 45%)`
  - warning: `hsl(38 92% 50%)`
  - destructive: `hsl(0 84% 60%)`

Esse conjunto define a identidade visual atual do RepoLead em interface web e comunicações por email.
