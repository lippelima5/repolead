export type IntegrationCategory = "webhooks" | "forms" | "automation" | "ads" | "sdk" | "custom";
export type IntegrationDirection = "source" | "destination";
export type IntegrationAvailability = "active" | "soon";
export type IntegrationBadge = "popular" | "soon";

export type LocalizedText = {
  pt: string;
  en: string;
};

export type SourceSetupConfig = {
  type: string;
  default_name: LocalizedText;
  default_key_name?: LocalizedText;
  default_environment?: "production" | "staging" | "development";
  default_rate_limit_per_min?: number;
  allow_environment?: boolean;
  allow_rate_limit?: boolean;
  allow_key_generation?: boolean;
  ingest_example_payload?: Record<string, unknown>;
};

export type DestinationSetupConfig = {
  default_name: LocalizedText;
  default_method?: "post" | "put" | "patch";
  default_url?: string;
  subscribed_events?: string[];
  allow_method?: boolean;
  allow_secret?: boolean;
  allow_events?: boolean;
  test_payload?: Record<string, unknown>;
};

export type IntegrationCatalogItem = {
  id: string;
  title: string;
  icon: string;
  category: IntegrationCategory;
  direction: IntegrationDirection;
  availability: IntegrationAvailability;
  badge?: IntegrationBadge;
  short_description: LocalizedText;
  full_description_md: LocalizedText;
  setup?: {
    source?: SourceSetupConfig;
    destination?: DestinationSetupConfig;
  };
};

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
1. Crie a source no LeadVault.
2. Gere a API key (aparece uma unica vez).
3. Configure sua aplicacao para enviar payloads para \`POST /api/v1/leads/ingest\`.
4. Valide o lead no Lead Store e timeline.

## Headers recomendados
- \`Authorization: Bearer <api_key>\`
- \`Content-Type: application/json\`
- \`Idempotency-Key: <id_unico>\``,
      en: `## Overview
Universal connector for any system able to send HTTP POST to the ingestion endpoint.

## Requirements
- Source application that can post JSON.
- Store the API key securely.
- Send \`Idempotency-Key\` on retries.

## Setup steps
1. Create the source in LeadVault.
2. Generate the API key (shown only once).
3. Configure your application to send payloads to \`POST /api/v1/leads/ingest\`.
4. Validate the lead in Lead Store and timeline.

## Recommended headers
- \`Authorization: Bearer <api_key>\`
- \`Content-Type: application/json\`
- \`Idempotency-Key: <unique_id>\``,
    },
    setup: {
      source: {
        type: "webhook",
        default_name: { pt: "Universal Webhook", en: "Universal Webhook" },
        default_key_name: { pt: "Chave principal", en: "Primary key" },
        default_environment: "production",
        default_rate_limit_per_min: 120,
        allow_environment: true,
        allow_rate_limit: true,
        allow_key_generation: true,
        ingest_example_payload: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+5511999999999",
          campaign: "Black Friday",
        },
      },
    },
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
Use o LeadVault como backend de captura para formularios web.

## Requisitos
- Formulario enviando \`POST\`.
- Mapeamento minimo para \`email\` ou \`phone\`.
- Controle de duplicidade com \`Idempotency-Key\`.

## Passo a passo
1. Crie a source de formulario.
2. Gere API key dedicada para esse formulario.
3. Envie os campos para o endpoint de ingestao.
4. Verifique no dashboard de ingestoes e leads.

## Boas praticas
- Inclua UTM no payload para analise futura.
- Use validacao no frontend e backend.`,
      en: `## Overview
Use LeadVault as a capture backend for web forms.

## Requirements
- Form submitting with \`POST\`.
- Minimum mapping for \`email\` or \`phone\`.
- Duplicate control using \`Idempotency-Key\`.

## Setup steps
1. Create the form source.
2. Generate a dedicated API key for this form.
3. Send fields to the ingestion endpoint.
4. Verify ingestion and lead records in the dashboard.

## Best practices
- Include UTM fields in payloads.
- Validate input in both frontend and backend.`,
    },
    setup: {
      source: {
        type: "form_backend",
        default_name: { pt: "Form Backend", en: "Form Backend" },
        default_key_name: { pt: "Chave formulario", en: "Form key" },
        default_environment: "production",
        default_rate_limit_per_min: 100,
        allow_environment: true,
        allow_rate_limit: true,
        allow_key_generation: true,
        ingest_example_payload: {
          name: "Form Lead",
          email: "lead@company.com",
          phone: "+5511988887777",
          page: "/contato",
        },
      },
    },
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
Integracao de entrada com n8n para centralizar leads no LeadVault.

## Requisitos
- Workflow no n8n com node HTTP Request.
- API key ativa da source no LeadVault.
- Payload contendo \`email\`, \`phone\` ou \`external_id\`.

## Passo a passo
1. Crie uma source dedicada para n8n.
2. Gere e salve a API key em credenciais do n8n.
3. Configure node HTTP Request para \`POST /api/v1/leads/ingest\`.
4. Envie \`Idempotency-Key\` por execucao.
5. Valide no Lead Store e timeline.

## Exemplo de mapeamento
- \`email\` -> \`{{$json.contact.email}}\`
- \`name\` -> \`{{$json.contact.name}}\`
- \`phone\` -> \`{{$json.contact.phone}}\``,
      en: `## Overview
Inbound n8n integration to centralize leads in LeadVault.

## Requirements
- n8n workflow with an HTTP Request node.
- Active source API key in LeadVault.
- Payload containing \`email\`, \`phone\` or \`external_id\`.

## Setup steps
1. Create a dedicated source for n8n.
2. Generate and store the API key in n8n credentials.
3. Configure HTTP Request node to \`POST /api/v1/leads/ingest\`.
4. Send \`Idempotency-Key\` per execution.
5. Validate in Lead Store and timeline.

## Mapping example
- \`email\` -> \`{{$json.contact.email}}\`
- \`name\` -> \`{{$json.contact.name}}\`
- \`phone\` -> \`{{$json.contact.phone}}\``,
    },
    setup: {
      source: {
        type: "n8n_ingoing",
        default_name: { pt: "n8n Ingoing", en: "n8n Ingoing" },
        default_key_name: { pt: "Chave n8n Ingoing", en: "n8n Ingoing key" },
        default_environment: "production",
        default_rate_limit_per_min: 180,
        allow_environment: true,
        allow_rate_limit: true,
        allow_key_generation: true,
        ingest_example_payload: {
          source: "n8n",
          name: "n8n Contact",
          email: "n8n@example.com",
          flow_id: "wf-001",
        },
      },
    },
  },
  {
    id: "n8n-outgoing",
    title: "n8n Outgoing",
    icon: "Send",
    category: "automation",
    direction: "destination",
    availability: "active",
    short_description: {
      pt: "Envie eventos do LeadVault para workflows n8n.",
      en: "Send LeadVault events to n8n workflows.",
    },
    full_description_md: {
      pt: `## Overview
Integracao de saida para disparar workflows n8n com eventos do LeadVault.

## Requisitos
- Endpoint webhook ativo no n8n.
- Validacao de assinatura HMAC no receptor (recomendado).
- Resposta HTTP 2xx para confirmar entrega.

## Passo a passo
1. Crie a destination n8n Outgoing.
2. Configure URL do webhook do n8n.
3. Defina eventos assinados (ex: \`lead_created\`, \`lead_updated\`).
4. Execute teste de delivery.
5. Monitore retries e DLQ em Deliveries.

## Headers enviados
- \`X-LeadVault-Signature\`
- \`X-LeadVault-Timestamp\`
- \`X-LeadVault-Event\`
- \`X-LeadVault-Delivery-Id\``,
      en: `## Overview
Outbound integration to trigger n8n workflows from LeadVault events.

## Requirements
- Active n8n webhook endpoint.
- HMAC signature validation on receiver (recommended).
- Return HTTP 2xx to acknowledge delivery.

## Setup steps
1. Create the n8n Outgoing destination.
2. Configure n8n webhook URL.
3. Select subscribed events (for example \`lead_created\`, \`lead_updated\`).
4. Run a delivery test.
5. Monitor retries and DLQ in Deliveries.

## Sent headers
- \`X-LeadVault-Signature\`
- \`X-LeadVault-Timestamp\`
- \`X-LeadVault-Event\`
- \`X-LeadVault-Delivery-Id\``,
    },
    setup: {
      destination: {
        default_name: { pt: "n8n Outgoing", en: "n8n Outgoing" },
        default_method: "post",
        subscribed_events: ["lead_created", "lead_updated", "delivery_failed"],
        allow_method: true,
        allow_secret: false,
        allow_events: true,
        test_payload: {
          workflow: "lead_sync",
          sample: true,
          lead: { email: "n8n-outgoing@example.com", name: "n8n Outgoing Lead" },
        },
      },
    },
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
Conector nativo para ingestao direta de leads de campanhas Meta Lead Ads.

Incluira:
- onboarding OAuth;
- selecao de paginas e formularios;
- sincronizacao automatica com idempotencia.`,
      en: `## Coming soon
Native connector for direct ingestion from Meta Lead Ads campaigns.

Planned:
- OAuth onboarding;
- page/form selection;
- automated sync with idempotency.`,
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
4. Inclua \`Idempotency-Key\` para evitar duplicidade.

## Exemplo de campos
- \`name\`
- \`email\`
- \`phone\`
- \`external_id\``,
      en: `## Overview
Integration for PHP projects that submit forms on the backend.

## Requirements
- PHP 7.4+ with cURL enabled.
- Active source API key.

## Setup steps
1. Create the PHP Form Handler source.
2. Generate API key and store it in environment variables.
3. In your PHP handler, send payload to \`POST /api/v1/leads/ingest\`.
4. Include \`Idempotency-Key\` to avoid duplicates.

## Typical fields
- \`name\`
- \`email\`
- \`phone\`
- \`external_id\``,
    },
    setup: {
      source: {
        type: "php_form_handler",
        default_name: { pt: "PHP Form Handler", en: "PHP Form Handler" },
        default_key_name: { pt: "Chave PHP", en: "PHP key" },
        default_environment: "production",
        default_rate_limit_per_min: 90,
        allow_environment: true,
        allow_rate_limit: true,
        allow_key_generation: true,
        ingest_example_payload: {
          source: "php_form_handler",
          name: "PHP Lead",
          email: "php@example.com",
          form: "contact_form",
        },
      },
    },
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
