export type IntegrationCategory = "webhooks" | "forms" | "automation" | "ads" | "sdk" | "custom";
export type IntegrationDirection = "source" | "destination" | "both";
export type IntegrationAvailability = "active" | "beta" | "soon";
export type IntegrationBadge = "popular" | "beta" | "soon";

export type IntegrationCatalogItem = {
  id: string;
  name: string;
  category: IntegrationCategory;
  direction: IntegrationDirection;
  availability: IntegrationAvailability;
  badge?: IntegrationBadge;
  description: {
    pt: string;
    en: string;
  };
  icon: string;
};

export const integrationsCatalog: IntegrationCatalogItem[] = [
  {
    id: "universal-webhook",
    name: "Universal Webhook",
    category: "webhooks",
    direction: "source",
    availability: "active",
    badge: "popular",
    icon: "Webhook",
    description: {
      pt: "Receba leads de qualquer sistema via HTTP POST.",
      en: "Receive leads from any system via HTTP POST.",
    },
  },
  {
    id: "form-backend",
    name: "Form Backend",
    category: "forms",
    direction: "source",
    availability: "active",
    icon: "FileInput",
    description: {
      pt: "Use LeadVault como backend para formularios HTML.",
      en: "Use LeadVault as backend for HTML forms.",
    },
  },
  {
    id: "webhook-destination",
    name: "Webhook (Outgoing)",
    category: "webhooks",
    direction: "destination",
    availability: "active",
    badge: "popular",
    icon: "Send",
    description: {
      pt: "Entregue eventos para qualquer URL com retries e DLQ.",
      en: "Deliver events to any URL with retries and DLQ.",
    },
  },
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    direction: "both",
    availability: "beta",
    badge: "beta",
    icon: "GitBranch",
    description: {
      pt: "Automacao bidirecional com n8n.",
      en: "Bidirectional automation with n8n.",
    },
  },
  {
    id: "meta-lead-ads",
    name: "Meta Lead Ads",
    category: "ads",
    direction: "source",
    availability: "soon",
    badge: "soon",
    icon: "Megaphone",
    description: {
      pt: "Conector oficial em breve.",
      en: "Official connector coming soon.",
    },
  },
];
