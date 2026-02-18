import { IntegrationCatalogItem, IntegrationDirection } from "@/lib/integrations/types";
import { formBackendSourceModule } from "@/lib/integrations/source/form-backend";
import { n8nIngoingSourceModule } from "@/lib/integrations/source/n8n-ingoing";
import { phpFormHandlerSourceModule } from "@/lib/integrations/source/php-form-handler";
import { universalWebhookSourceModule } from "@/lib/integrations/source/universal-webhook";
import { n8nOutgoingDestinationModule } from "@/lib/integrations/destination/n8n-outgoing";
import { sendyDestinationModule } from "@/lib/integrations/destination/sendy";
import { webhookOutgoingDestinationModule } from "@/lib/integrations/destination/webhook-outgoing";

export const integrationsCatalog: IntegrationCatalogItem[] = [
  {
    id: "universal-webhook",
    title: "Universal Webhook",
    icon: "Webhook",
    category: "webhooks",
    direction: "source",
    availability: "active",
    badge: "popular",
    short_description: {
      pt: "Receba leads de qualquer sistema via HTTP POST.",
      en: "Receive leads from any system via HTTP POST.",
    },
    full_description_md: {
      pt: `## Overview
Conector universal para qualquer sistema que consiga enviar HTTP POST para o endpoint de ingestao.

## Requisitos
- Possuir endpoint de origem que envie JSON.
- Salvar a API key de forma segura.
- Enviar \`Idempotency-Key\` em reenvios.

## Passo a passo
1. Crie a source no RepoLead.
2. Gere a API key (aparece uma unica vez).
3. Configure sua aplicacao para enviar payloads para \`POST /api/v1/leads/ingest\`.
4. Valide o lead no Lead Store e timeline.`,
      en: `## Overview
Universal connector for any system able to send HTTP POST to the ingestion endpoint.

## Requirements
- Source application that can post JSON.
- Store the API key securely.
- Send \`Idempotency-Key\` on retries.

## Setup steps
1. Create the source in RepoLead.
2. Generate the API key (shown only once).
3. Configure your application to send payloads to \`POST /api/v1/leads/ingest\`.
4. Validate the lead in Lead Store and timeline.`,
    },
    module: universalWebhookSourceModule,
  },
  {
    id: "form-backend",
    title: "Form Backend",
    icon: "FileInput",
    category: "forms",
    direction: "source",
    availability: "active",
    short_description: {
      pt: "Capture leads diretamente de formularios HTML via endpoint de ingestao.",
      en: "Capture leads directly from HTML forms through the ingestion endpoint.",
    },
    full_description_md: {
      pt: `## Overview
Use o RepoLead como backend de captura para formularios web.

## Requisitos
- Formulario enviando \`POST\`.
- Mapeamento minimo para \`email\` ou \`phone\`.
- Controle de duplicidade com \`Idempotency-Key\`.

## Passo a passo
1. Crie a source de formulario.
2. Gere API key dedicada para esse formulario.
3. Envie os campos para o endpoint de ingestao.
4. Verifique no dashboard de ingestoes e leads.`,
      en: `## Overview
Use RepoLead as a capture backend for web forms.

## Requirements
- Form submitting with \`POST\`.
- Minimum mapping for \`email\` or \`phone\`.
- Duplicate control using \`Idempotency-Key\`.

## Setup steps
1. Create the form source.
2. Generate a dedicated API key for this form.
3. Send fields to the ingestion endpoint.
4. Verify ingestion and lead records in the dashboard.`,
    },
    module: formBackendSourceModule,
  },
  {
    id: "n8n-ingoing",
    title: "n8n Ingoing",
    icon: "GitBranch",
    category: "automation",
    direction: "source",
    availability: "active",
    short_description: {
      pt: "Receba leads vindos de workflows do n8n.",
      en: "Receive leads from n8n workflows.",
    },
    full_description_md: {
      pt: `## Overview
Integracao de entrada com n8n para centralizar leads no RepoLead.

## Requisitos
- Workflow no n8n com node HTTP Request.
- API key ativa da source no RepoLead.
- Payload contendo \`email\`, \`phone\` ou \`external_id\`.

## Passo a passo
1. Crie uma source dedicada para n8n.
2. Gere e salve a API key em credenciais do n8n.
3. Configure node HTTP Request para \`POST /api/v1/leads/ingest\`.
4. Envie \`Idempotency-Key\` por execucao.`,
      en: `## Overview
Inbound n8n integration to centralize leads in RepoLead.

## Requirements
- n8n workflow with an HTTP Request node.
- Active source API key in RepoLead.
- Payload containing \`email\`, \`phone\` or \`external_id\`.

## Setup steps
1. Create a dedicated source for n8n.
2. Generate and store the API key in n8n credentials.
3. Configure HTTP Request node to \`POST /api/v1/leads/ingest\`.
4. Send \`Idempotency-Key\` per execution.`,
    },
    module: n8nIngoingSourceModule,
  },
  {
    id: "webhook-outgoing",
    title: "Webhook Outgoing",
    icon: "Webhook",
    category: "webhooks",
    direction: "destination",
    availability: "active",
    badge: "popular",
    short_description: {
      pt: "Envie eventos do RepoLead para qualquer endpoint webhook.",
      en: "Send RepoLead events to any webhook endpoint.",
    },
    full_description_md: {
      pt: `## Overview
Conector de destination webhook generico para fan-out de eventos do RepoLead.

## Requisitos
- Endpoint HTTP ativo para receber eventos.
- Validacao de assinatura HMAC no receptor (recomendado).
- Resposta HTTP 2xx para confirmar entrega.

## Passo a passo
1. Crie a destination Webhook Outgoing.
2. Configure URL, metodo HTTP e eventos assinados.
3. (Opcional) Defina um rotulo para identificar o endpoint.
4. Execute teste de delivery.`,
      en: `## Overview
Generic outbound webhook connector for RepoLead event fan-out.

## Requirements
- Active HTTP endpoint to receive events.
- HMAC signature validation on the receiver (recommended).
- Return HTTP 2xx to acknowledge delivery.

## Setup steps
1. Create the Webhook Outgoing destination.
2. Configure URL, HTTP method and subscribed events.
3. (Optional) Set an endpoint label for easier identification.
4. Run a delivery test.`,
    },
    module: webhookOutgoingDestinationModule,
  },
  {
    id: "n8n-outgoing",
    title: "n8n Outgoing",
    icon: "Send",
    category: "automation",
    direction: "destination",
    availability: "active",
    short_description: {
      pt: "Envie eventos do RepoLead para workflows n8n.",
      en: "Send RepoLead events to n8n workflows.",
    },
    full_description_md: {
      pt: `## Overview
Integracao de saida para disparar workflows n8n com eventos do RepoLead.

## Requisitos
- Endpoint webhook ativo no n8n.
- Validacao de assinatura HMAC no receptor (recomendado).
- Resposta HTTP 2xx para confirmar entrega.

## Passo a passo
1. Crie a destination n8n Outgoing.
2. Configure URL do webhook do n8n.
3. Defina eventos assinados (ex: \`lead_created\`, \`lead_updated\`).
4. Execute teste de delivery.`,
      en: `## Overview
Outbound integration to trigger n8n workflows from RepoLead events.

## Requirements
- Active n8n webhook endpoint.
- HMAC signature validation on receiver (recommended).
- Return HTTP 2xx to acknowledge delivery.

## Setup steps
1. Create the n8n Outgoing destination.
2. Configure n8n webhook URL.
3. Select subscribed events (for example \`lead_created\`, \`lead_updated\`).
4. Run a delivery test.`,
    },
    module: n8nOutgoingDestinationModule,
  },
  {
    id: "sendy",
    title: "Sendy",
    icon: "MessageSquare",
    category: "automation",
    direction: "destination",
    availability: "active",
    short_description: {
      pt: "Inscreva leads automaticamente em listas do Sendy.",
      en: "Automatically subscribe leads into Sendy lists.",
    },
    full_description_md: {
      pt: `## Overview
Integracao de saida para enviar leads do RepoLead para o endpoint \`/subscribe\` do Sendy.

## Requisitos
- URL do endpoint \`/subscribe\` no Sendy.
- \`api_key\` valida (Settings no Sendy).
- \`list id\` da lista alvo no Sendy.
- Lead com \`email\` valido.

## Passo a passo
1. Crie a destination Sendy.
2. Configure URL, API key e list ID.
3. Defina eventos assinados (ex: \`lead_created\`).
4. Execute teste de delivery e valide retorno \`true\`.`,
      en: `## Overview
Outbound integration to send RepoLead leads to the Sendy \`/subscribe\` endpoint.

## Requirements
- Sendy \`/subscribe\` endpoint URL.
- Valid \`api_key\` (Sendy Settings).
- Target \`list id\` from Sendy.
- Lead with a valid \`email\`.

## Setup steps
1. Create the Sendy destination.
2. Configure URL, API key and list ID.
3. Select subscribed events (for example \`lead_created\`).
4. Run a delivery test and validate the \`true\` response.`,
    },
    module: sendyDestinationModule,
  },
  {
    id: "meta-lead-ads",
    title: "Meta Lead Ads",
    icon: "Megaphone",
    category: "ads",
    direction: "source",
    availability: "soon",
    badge: "soon",
    short_description: {
      pt: "Conector oficial para Meta Lead Ads (em breve).",
      en: "Official Meta Lead Ads connector (coming soon).",
    },
    full_description_md: {
      pt: `## Em breve
Conector nativo para ingestao direta de leads de campanhas Meta Lead Ads.`,
      en: `## Coming soon
Native connector for direct ingestion from Meta Lead Ads campaigns.`,
    },
  },
  {
    id: "elementor-forms",
    title: "Elementor Forms",
    icon: "Blocks",
    category: "forms",
    direction: "source",
    availability: "soon",
    badge: "soon",
    short_description: {
      pt: "Conector de captura para formularios Elementor (em breve).",
      en: "Capture connector for Elementor Forms (coming soon).",
    },
    full_description_md: {
      pt: `## Em breve
Integracao dedicada para formularios Elementor com setup guiado.`,
      en: `## Coming soon
Dedicated integration for Elementor Forms with guided setup.`,
    },
  },
  {
    id: "react-sdk",
    title: "React SDK",
    icon: "Code2",
    category: "sdk",
    direction: "source",
    availability: "soon",
    badge: "soon",
    short_description: {
      pt: "SDK React para captura client-side com fallback server-side (em breve).",
      en: "React SDK for client-side capture with server-side fallback (coming soon).",
    },
    full_description_md: {
      pt: `## Em breve
SDK para instrumentar captura de leads em apps React com tipagem forte.`,
      en: `## Coming soon
SDK for strongly typed lead capture instrumentation in React apps.`,
    },
  },
  {
    id: "php-form-handler",
    title: "PHP Form Handler",
    icon: "FileCode",
    category: "forms",
    direction: "source",
    availability: "active",
    short_description: {
      pt: "Script PHP para captura de leads de formularios server-side.",
      en: "PHP script for server-side form lead capture.",
    },
    full_description_md: {
      pt: `## Overview
Integracao para projetos PHP que enviam formulario no backend.

## Requisitos
- PHP 7.4+ com cURL habilitado.
- API key de source ativa.

## Passo a passo
1. Crie a source PHP Form Handler.
2. Gere API key e configure em variavel de ambiente.
3. No handler PHP, envie o payload para \`POST /api/v1/leads/ingest\`.
4. Inclua \`Idempotency-Key\` para evitar duplicidade.`,
      en: `## Overview
Integration for PHP projects that submit forms on the backend.

## Requirements
- PHP 7.4+ with cURL enabled.
- Active source API key.

## Setup steps
1. Create the PHP Form Handler source.
2. Generate API key and store it in environment variables.
3. In your PHP handler, send payload to \`POST /api/v1/leads/ingest\`.
4. Include \`Idempotency-Key\` to avoid duplicates.`,
    },
    module: phpFormHandlerSourceModule,
  },
  {
    id: "custom-source",
    title: "Custom Source",
    icon: "Puzzle",
    category: "custom",
    direction: "source",
    availability: "soon",
    badge: "soon",
    short_description: {
      pt: "Template para criar conectores de source customizados (em breve).",
      en: "Template to build custom source connectors (coming soon).",
    },
    full_description_md: {
      pt: `## Em breve
Modelo extensivel para criar conectores de entrada proprietarios.`,
      en: `## Coming soon
Extensible template to build proprietary inbound connectors.`,
    },
  },
  {
    id: "custom-destination",
    title: "Custom Destination",
    icon: "Workflow",
    category: "custom",
    direction: "destination",
    availability: "soon",
    badge: "soon",
    short_description: {
      pt: "Template para criar conectores de destination customizados (em breve).",
      en: "Template to build custom destination connectors (coming soon).",
    },
    full_description_md: {
      pt: `## Em breve
Modelo extensivel para criar conectores de saida proprietarios.`,
      en: `## Coming soon
Extensible template to build proprietary outbound connectors.`,
    },
  },
];

export function getIntegrationCatalogItem(id: string, direction: IntegrationDirection) {
  return integrationsCatalog.find((item) => item.id === id && item.direction === direction) ?? null;
}

export function getSourceModuleByIntegrationId(integrationId: string) {
  const item = integrationsCatalog.find((entry) => entry.id === integrationId && entry.direction === "source");
  if (!item || !item.module || item.module.direction !== "source") {
    return null;
  }

  return item.module;
}

export function getDestinationModuleByIntegrationId(integrationId: string) {
  const item = integrationsCatalog.find((entry) => entry.id === integrationId && entry.direction === "destination");
  if (!item || !item.module || item.module.direction !== "destination") {
    return null;
  }

  return item.module;
}

const sourceLegacyMap: Record<string, string> = {
  webhook: "universal-webhook",
  form_backend: "form-backend",
  n8n_ingoing: "n8n-ingoing",
  php_form_handler: "php-form-handler",
};

export function resolveSourceIntegrationIdFromLegacyType(type: string | null | undefined) {
  if (!type) {
    return null;
  }

  return sourceLegacyMap[type] ?? null;
}

export function resolveSourceTypeFromIntegrationId(integrationId: string) {
  const integrationModule = getSourceModuleByIntegrationId(integrationId);
  if (!integrationModule) {
    return null;
  }

  return integrationModule.sourceType;
}
