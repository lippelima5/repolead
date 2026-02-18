import { z } from "zod";
import { Input } from "@/components/ui/input";
import { DestinationIntegrationModule } from "@/lib/integrations/types";

const eventOptions = ["lead_created", "lead_updated"] as const;

type SendyValues = {
  name: string;
  url: string;
  enabled: boolean;
  subscribed_events_json: string[];
  sendy_api_key: string;
  sendy_list_id: string;
  gdpr: boolean;
  silent: boolean;
  country_code: string;
  referrer: string;
  honeypot: string;
};

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url(),
  enabled: z.boolean().default(true),
  subscribed_events_json: z.array(z.string().trim().min(1).max(120)).min(1).default(["lead_created"]),
  sendy_api_key: z.string().trim().min(1).max(240),
  sendy_list_id: z.string().trim().min(1).max(240),
  gdpr: z.boolean().default(false),
  silent: z.boolean().default(false),
  country_code: z
    .string()
    .trim()
    .max(2)
    .default("")
    .refine((value) => value.length === 0 || /^[a-zA-Z]{2}$/.test(value), {
      message: "Country code must have exactly 2 letters",
    }),
  referrer: z.string().trim().max(500).default(""),
  honeypot: z.string().trim().max(500).default(""),
});

const configSchema = z.object({
  api_key: z.string().trim().min(1).max(240),
  list_id: z.string().trim().min(1).max(240),
  gdpr: z.boolean().default(false),
  silent: z.boolean().default(false),
  boolean: z.boolean().default(true),
  country: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{2}$/)
    .optional(),
  referrer: z.string().trim().max(500).optional(),
  hp: z.string().trim().max(500).optional(),
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

function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase();
}

export const sendyDestinationModule: DestinationIntegrationModule = {
  id: "sendy",
  direction: "destination",
  formSchema,
  configSchema,
  getDefaults() {
    return {
      name: "Sendy",
      url: "",
      enabled: true,
      subscribed_events_json: ["lead_created"],
      sendy_api_key: "",
      sendy_list_id: "",
      gdpr: false,
      silent: false,
      country_code: "",
      referrer: "",
      honeypot: "",
    };
  },
  Form({ values, onChange, locale }) {
    const formValues = values as SendyValues;
    const selectedEvents = Array.isArray(formValues.subscribed_events_json) ? formValues.subscribed_events_json : [];
    const update = (patch: Partial<SendyValues>) => onChange({ ...formValues, ...patch });

    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome da destination", "Destination name")}</label>
          <Input value={formValues.name} onChange={(event) => update({ name: event.target.value })} className="h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Sendy subscribe URL</label>
          <Input
            value={formValues.url}
            onChange={(event) => update({ url: event.target.value })}
            className="h-9 text-[13px]"
            placeholder="https://sendy.example.com/subscribe"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Sendy API key</label>
            <Input
              value={formValues.sendy_api_key}
              onChange={(event) => update({ sendy_api_key: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="your_sendy_api_key"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Sendy list ID</label>
            <Input
              value={formValues.sendy_list_id}
              onChange={(event) => update({ sendy_list_id: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="xYzAbC123..."
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Codigo do pais (opcional)", "Country code (optional)")}</label>
            <Input
              value={formValues.country_code}
              onChange={(event) => update({ country_code: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="BR"
              maxLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Referrer (opcional)", "Referrer (optional)")}</label>
            <Input
              value={formValues.referrer}
              onChange={(event) => update({ referrer: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="https://site.example.com/lead-form"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">Honeypot (hp)</label>
          <Input
            value={formValues.honeypot}
            onChange={(event) => update({ honeypot: event.target.value })}
            className="h-9 text-[13px]"
            placeholder={localeText(locale, "Opcional para anti-spam", "Optional anti-spam value")}
          />
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
            checked={formValues.gdpr}
            onChange={(event) => update({ gdpr: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Assinar em modo GDPR", "Subscribe in GDPR mode")}
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={formValues.silent}
            onChange={(event) => update({ silent: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Silent signup (single opt-in)", "Silent signup (single opt-in)")}
        </label>
      </div>
    );
  },
  toCreatePayload(values) {
    const formValues = values as SendyValues;
    const selectedEvents = Array.isArray(formValues.subscribed_events_json) ? formValues.subscribed_events_json : [];
    const countryCode = normalizeCountryCode(formValues.country_code);

    return {
      name: formValues.name.trim(),
      url: formValues.url.trim(),
      method: "post",
      enabled: formValues.enabled,
      subscribed_events_json: selectedEvents,
      integration_id: "sendy",
      integration_config_json: {
        api_key: formValues.sendy_api_key.trim(),
        list_id: formValues.sendy_list_id.trim(),
        gdpr: formValues.gdpr,
        silent: formValues.silent,
        boolean: true,
        ...(countryCode ? { country: countryCode } : {}),
        ...(formValues.referrer.trim() ? { referrer: formValues.referrer.trim() } : {}),
        ...(formValues.honeypot.trim() ? { hp: formValues.honeypot.trim() } : {}),
      },
    };
  },
  toUpdatePayload(values) {
    const formValues = values as SendyValues;
    const selectedEvents = Array.isArray(formValues.subscribed_events_json) ? formValues.subscribed_events_json : [];
    const countryCode = normalizeCountryCode(formValues.country_code);

    return {
      name: formValues.name.trim(),
      url: formValues.url.trim(),
      method: "post",
      enabled: formValues.enabled,
      subscribed_events_json: selectedEvents,
      integration_id: "sendy",
      integration_config_json: {
        api_key: formValues.sendy_api_key.trim(),
        list_id: formValues.sendy_list_id.trim(),
        gdpr: formValues.gdpr,
        silent: formValues.silent,
        boolean: true,
        ...(countryCode ? { country: countryCode } : {}),
        ...(formValues.referrer.trim() ? { referrer: formValues.referrer.trim() } : {}),
        ...(formValues.honeypot.trim() ? { hp: formValues.honeypot.trim() } : {}),
      },
    };
  },
  fromEntity(entity) {
    const config = getConfig(entity.integration_config_json);
    return {
      name: entity.name,
      url: entity.url,
      enabled: entity.enabled,
      subscribed_events_json: Array.isArray(entity.subscribed_events_json)
        ? entity.subscribed_events_json.filter((item): item is string => typeof item === "string")
        : ["lead_created"],
      sendy_api_key: typeof config.api_key === "string" ? config.api_key : "",
      sendy_list_id: typeof config.list_id === "string" ? config.list_id : "",
      gdpr: config.gdpr === true,
      silent: config.silent === true,
      country_code: typeof config.country === "string" ? config.country : "",
      referrer: typeof config.referrer === "string" ? config.referrer : "",
      honeypot: typeof config.hp === "string" ? config.hp : "",
    };
  },
};
