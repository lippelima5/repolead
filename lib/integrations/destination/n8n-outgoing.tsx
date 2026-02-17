import { z } from "zod";
import { Input } from "@/components/ui/input";
import { DestinationIntegrationModule } from "@/lib/integrations/types";

const eventOptions = ["lead_created", "lead_updated", "delivery_failed", "delivery_success"] as const;

type N8nOutgoingValues = {
  name: string;
  url: string;
  method: "post" | "put" | "patch";
  enabled: boolean;
  subscribed_events_json: string[];
  workflow_name: string;
  retry_on_429: boolean;
  signing_secret: string;
};

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url(),
  method: z.enum(["post", "put", "patch"]).default("post"),
  enabled: z.boolean().default(true),
  subscribed_events_json: z.array(z.string().trim().min(1).max(120)).min(1).default(["lead_created", "lead_updated"]),
  workflow_name: z.string().trim().max(120).default(""),
  retry_on_429: z.boolean().default(true),
  signing_secret: z.string().trim().max(200).default(""),
});

const configSchema = z.object({
  workflow_name: z.string().trim().max(120).optional(),
  retry_on_429: z.boolean().default(true),
});

function localeText(locale: "pt" | "en", pt: string, en: string) {
  return locale === "pt" ? pt : en;
}

function getConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export const n8nOutgoingDestinationModule: DestinationIntegrationModule = {
  id: "n8n-outgoing",
  direction: "destination",
  formSchema,
  configSchema,
  getDefaults() {
    return {
      name: "n8n Outgoing",
      url: "",
      method: "post",
      enabled: true,
      subscribed_events_json: ["lead_created", "lead_updated", "delivery_failed"],
      workflow_name: "",
      retry_on_429: true,
      signing_secret: "",
    };
  },
  Form({ values, onChange, locale, mode }) {
    const formValues = values as N8nOutgoingValues;
    const selectedEvents = Array.isArray(formValues.subscribed_events_json) ? formValues.subscribed_events_json : [];
    const update = (patch: Partial<N8nOutgoingValues>) => onChange({ ...formValues, ...patch });
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome da destination", "Destination name")}</label>
          <Input value={formValues.name} onChange={(event) => update({ name: event.target.value })} className="h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Webhook URL</label>
          <Input
            value={formValues.url}
            onChange={(event) => update({ url: event.target.value })}
            className="h-9 text-[13px]"
            placeholder="https://n8n.example.com/webhook/repolead"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Metodo HTTP", "HTTP method")}</label>
            <select
              className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
              value={formValues.method}
              onChange={(event) => update({ method: event.target.value as N8nOutgoingValues["method"] })}
            >
              <option value="post">POST</option>
              <option value="put">PUT</option>
              <option value="patch">PATCH</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome do workflow n8n", "n8n workflow name")}</label>
            <Input
              value={formValues.workflow_name}
              onChange={(event) => update({ workflow_name: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="lead-sync"
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-foreground">{localeText(locale, "Eventos assinados", "Subscribed events")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            {eventOptions.map((eventName) => (
              <label key={eventName} className="inline-flex items-center gap-2 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border bg-background"
                  checked={selectedEvents.includes(eventName)}
                  onChange={(event) => {
                    if (event.target.checked) {
                      update({
                        subscribed_events_json: [...new Set([...selectedEvents, eventName])],
                      });
                      return;
                    }

                    update({
                      subscribed_events_json: selectedEvents.filter((item) => item !== eventName),
                    });
                  }}
                />
                {eventName}
              </label>
            ))}
          </div>
        </div>
        {mode === "edit" ? (
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Novo signing secret (opcional)", "New signing secret (optional)")}</label>
            <Input
              value={formValues.signing_secret}
              onChange={(event) => update({ signing_secret: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="lv_whsec_..."
            />
          </div>
        ) : null}
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={formValues.enabled}
            onChange={(event) => update({ enabled: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Destination habilitada", "Destination enabled")}
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={formValues.retry_on_429}
            onChange={(event) => update({ retry_on_429: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Repetir quando destino retornar 429", "Retry when destination returns 429")}
        </label>
      </div>
    );
  },
  toCreatePayload(values) {
    const formValues = values as N8nOutgoingValues;
    const selectedEvents = Array.isArray(formValues.subscribed_events_json) ? formValues.subscribed_events_json : [];
    return {
      name: formValues.name.trim(),
      url: formValues.url.trim(),
      method: formValues.method,
      enabled: formValues.enabled,
      subscribed_events_json: selectedEvents,
      integration_id: "n8n-outgoing",
      integration_config_json: {
        retry_on_429: formValues.retry_on_429,
        ...(formValues.workflow_name.trim() ? { workflow_name: formValues.workflow_name.trim() } : {}),
      },
    };
  },
  toUpdatePayload(values) {
    const formValues = values as N8nOutgoingValues;
    const selectedEvents = Array.isArray(formValues.subscribed_events_json) ? formValues.subscribed_events_json : [];
    return {
      name: formValues.name.trim(),
      url: formValues.url.trim(),
      method: formValues.method,
      enabled: formValues.enabled,
      subscribed_events_json: selectedEvents,
      integration_id: "n8n-outgoing",
      integration_config_json: {
        retry_on_429: formValues.retry_on_429,
        ...(formValues.workflow_name.trim() ? { workflow_name: formValues.workflow_name.trim() } : {}),
      },
      ...(formValues.signing_secret.trim() ? { signing_secret: formValues.signing_secret.trim() } : {}),
    };
  },
  fromEntity(entity) {
    const config = getConfig(entity.integration_config_json);
    return {
      name: entity.name,
      url: entity.url,
      method: entity.method,
      enabled: entity.enabled,
      subscribed_events_json: Array.isArray(entity.subscribed_events_json)
        ? entity.subscribed_events_json.filter((item): item is string => typeof item === "string")
        : ["lead_created", "lead_updated"],
      workflow_name: typeof config.workflow_name === "string" ? config.workflow_name : "",
      retry_on_429: config.retry_on_429 !== false,
      signing_secret: "",
    };
  },
};
