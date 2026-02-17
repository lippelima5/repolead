import { z } from "zod";
import { Input } from "@/components/ui/input";
import { SourceIntegrationModule } from "@/lib/integrations/types";

type UniversalWebhookValues = {
  name: string;
  environment: "production" | "staging" | "development";
  rate_limit_per_min: number;
  create_api_key: boolean;
  key_name: string;
  accept_form_urlencoded: boolean;
  require_idempotency_key: boolean;
};

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  rate_limit_per_min: z.coerce.number().int().min(1).max(20000).default(120),
  create_api_key: z.boolean().default(true),
  key_name: z.string().trim().max(120).default("Primary key"),
  accept_form_urlencoded: z.boolean().default(true),
  require_idempotency_key: z.boolean().default(true),
});

const configSchema = z.object({
  accept_form_urlencoded: z.boolean().default(true),
  require_idempotency_key: z.boolean().default(true),
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

export const universalWebhookSourceModule: SourceIntegrationModule = {
  id: "universal-webhook",
  direction: "source",
  sourceType: "webhook",
  formSchema,
  configSchema,
  getDefaults(locale) {
    return {
      name: "Universal Webhook",
      environment: "production",
      rate_limit_per_min: 120,
      create_api_key: true,
      key_name: localeText(locale, "Chave principal", "Primary key"),
      accept_form_urlencoded: true,
      require_idempotency_key: true,
    };
  },
  Form({ values, onChange, locale }) {
    const formValues = values as UniversalWebhookValues;
    const update = (patch: Partial<UniversalWebhookValues>) => onChange({ ...formValues, ...patch });
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome da source", "Source name")}</label>
          <Input
            value={formValues.name}
            onChange={(event) => update({ name: event.target.value })}
            className="h-9 text-[13px]"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Ambiente", "Environment")}</label>
            <select
              className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
              value={formValues.environment}
              onChange={(event) => update({ environment: event.target.value as UniversalWebhookValues["environment"] })}
            >
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Rate limit (req/min)", "Rate limit (req/min)")}</label>
            <Input
              type="number"
              min={1}
              max={20000}
              value={formValues.rate_limit_per_min}
              onChange={(event) => update({ rate_limit_per_min: Number(event.target.value || 120) })}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome da API key", "API key name")}</label>
          <Input
            value={formValues.key_name}
            onChange={(event) => update({ key_name: event.target.value })}
            className="h-9 text-[13px]"
            disabled={!formValues.create_api_key}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={formValues.create_api_key}
            onChange={(event) => update({ create_api_key: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Gerar API key automaticamente", "Generate API key automatically")}
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={formValues.accept_form_urlencoded}
            onChange={(event) => update({ accept_form_urlencoded: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Aceitar form-urlencoded", "Accept form-urlencoded")}
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={formValues.require_idempotency_key}
            onChange={(event) => update({ require_idempotency_key: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Exigir Idempotency-Key", "Require Idempotency-Key")}
        </label>
      </div>
    );
  },
  toCreatePayload(values) {
    const formValues = values as UniversalWebhookValues;
    return {
      name: formValues.name.trim(),
      type: "webhook",
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "universal-webhook",
      integration_config_json: {
        accept_form_urlencoded: formValues.accept_form_urlencoded,
        require_idempotency_key: formValues.require_idempotency_key,
      },
    };
  },
  toUpdatePayload(values) {
    const formValues = values as UniversalWebhookValues;
    return {
      name: formValues.name.trim(),
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "universal-webhook",
      integration_config_json: {
        accept_form_urlencoded: formValues.accept_form_urlencoded,
        require_idempotency_key: formValues.require_idempotency_key,
      },
    };
  },
  fromEntity(entity, locale) {
    const config = getConfig(entity.integration_config_json);
    return {
      name: entity.name,
      environment: entity.environment,
      rate_limit_per_min: entity.rate_limit_per_min,
      create_api_key: false,
      key_name: localeText(locale, "Nova chave", "New key"),
      accept_form_urlencoded: config.accept_form_urlencoded !== false,
      require_idempotency_key: config.require_idempotency_key !== false,
    };
  },
};
