import { IntegrationCatalogItem } from "@/content/integrations-catalog";

type LocalizedText = {
  pt: string;
  en: string;
};

export type IntegrationSetupGuide = {
  requirements: LocalizedText[];
  steps: LocalizedText[];
  sourceDefaults?: {
    type: string;
    environment: "production" | "staging" | "development";
    rateLimitPerMin: number;
    suggestedName: LocalizedText;
    keyName: LocalizedText;
  };
  destinationDefaults?: {
    method: "post" | "put" | "patch";
    subscribedEvents: string[];
    suggestedName: LocalizedText;
  };
};

export const integrationSetupById: Record<string, IntegrationSetupGuide> = {
  "universal-webhook": {
    requirements: [
      {
        pt: "Defina a source com ambiente e limite de taxa adequados.",
        en: "Define a source with an appropriate environment and rate limit.",
      },
      {
        pt: "Guarde a API key em local seguro, ela aparece apenas uma vez.",
        en: "Store the API key securely, it is shown only once.",
      },
      {
        pt: "Envie payloads para POST /api/v1/leads/ingest com Idempotency-Key.",
        en: "Send payloads to POST /api/v1/leads/ingest with Idempotency-Key.",
      },
    ],
    steps: [
      {
        pt: "Crie a source e gere a API key.",
        en: "Create the source and generate the API key.",
      },
      {
        pt: "Configure seu sistema externo para enviar leads ao endpoint de ingestao.",
        en: "Configure your external system to send leads to the ingestion endpoint.",
      },
      {
        pt: "Valide no painel se o lead apareceu com timeline e status corretos.",
        en: "Validate in the dashboard that the lead appears with timeline and correct status.",
      },
    ],
    sourceDefaults: {
      type: "webhook",
      environment: "production",
      rateLimitPerMin: 120,
      suggestedName: {
        pt: "Universal Webhook",
        en: "Universal Webhook",
      },
      keyName: {
        pt: "Chave principal",
        en: "Primary key",
      },
    },
  },
  "form-backend": {
    requirements: [
      {
        pt: "Mapeie os campos do formulario para email, phone e nome.",
        en: "Map form fields to email, phone and name.",
      },
      {
        pt: "Use Idempotency-Key para evitar duplicacao em reenvios.",
        en: "Use Idempotency-Key to avoid duplicates on retries.",
      },
    ],
    steps: [
      {
        pt: "Crie a source de formulario e gere uma API key dedicada.",
        en: "Create the form source and generate a dedicated API key.",
      },
      {
        pt: "Aponte o action do formulario para o endpoint de ingestao.",
        en: "Point form action to the ingestion endpoint.",
      },
      {
        pt: "Teste envio em staging antes de publicar em producao.",
        en: "Test submissions in staging before publishing to production.",
      },
    ],
    sourceDefaults: {
      type: "form_backend",
      environment: "production",
      rateLimitPerMin: 90,
      suggestedName: {
        pt: "Form Backend",
        en: "Form Backend",
      },
      keyName: {
        pt: "Chave de formulario",
        en: "Form key",
      },
    },
  },
  "webhook-destination": {
    requirements: [
      {
        pt: "Endpoint HTTPs acessivel publicamente.",
        en: "Publicly reachable HTTPS endpoint.",
      },
      {
        pt: "Servidor receptor validando assinatura HMAC e timestamp.",
        en: "Receiver validates HMAC signature and timestamp.",
      },
      {
        pt: "Retornar 2xx para confirmar processamento com sucesso.",
        en: "Return 2xx to confirm successful processing.",
      },
    ],
    steps: [
      {
        pt: "Crie a destination e habilite os eventos necessarios.",
        en: "Create the destination and enable required events.",
      },
      {
        pt: "Execute o teste de entrega e valide headers de assinatura.",
        en: "Run delivery test and validate signature headers.",
      },
      {
        pt: "Monitore falhas/retries no painel de deliveries.",
        en: "Monitor failures/retries in the deliveries dashboard.",
      },
    ],
    destinationDefaults: {
      method: "post",
      subscribedEvents: ["lead_created", "lead_updated", "delivery_failed"],
      suggestedName: {
        pt: "Webhook Outbound",
        en: "Outbound Webhook",
      },
    },
  },
  n8n: {
    requirements: [
      {
        pt: "Workflow n8n com credenciais seguras para entrada e saida.",
        en: "n8n workflow with secure credentials for inbound and outbound.",
      },
      {
        pt: "Fluxo precisa tratar retries idempotentes.",
        en: "Workflow should handle idempotent retries.",
      },
    ],
    steps: [
      {
        pt: "Crie source para receber dados do n8n.",
        en: "Create a source to receive data from n8n.",
      },
      {
        pt: "Crie destination para enviar eventos de volta ao n8n.",
        en: "Create a destination to send events back to n8n.",
      },
      {
        pt: "Teste ambos os sentidos com payload de exemplo.",
        en: "Test both directions using sample payloads.",
      },
    ],
    sourceDefaults: {
      type: "automation",
      environment: "production",
      rateLimitPerMin: 120,
      suggestedName: {
        pt: "n8n Source",
        en: "n8n Source",
      },
      keyName: {
        pt: "Chave n8n",
        en: "n8n key",
      },
    },
    destinationDefaults: {
      method: "post",
      subscribedEvents: ["lead_created", "lead_updated", "delivery_failed"],
      suggestedName: {
        pt: "n8n Destination",
        en: "n8n Destination",
      },
    },
  },
};

export function getIntegrationSetup(integration: IntegrationCatalogItem) {
  return integrationSetupById[integration.id] ?? null;
}
