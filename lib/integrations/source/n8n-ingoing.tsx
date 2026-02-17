import { z } from "zod";
import { Input } from "@/components/ui/input";
import { SourceIntegrationModule } from "@/lib/integrations/types";

type N8nIngoingValues = {
  name: string;
  environment: "production" | "staging" | "development";
  rate_limit_per_min: number;
  create_api_key: boolean;
  key_name: string;
  workflow_name: string;
  require_identity: boolean;
};

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  rate_limit_per_min: z.coerce.number().int().min(1).max(20000).default(180),
  create_api_key: z.boolean().default(true),
  key_name: z.string().trim().max(120).default("n8n Ingoing key"),
  workflow_name: z.string().trim().max(120).default(""),
  require_identity: z.boolean().default(true),
});

const configSchema = z.object({
  workflow_name: z.string().trim().max(120).optional(),
  require_identity: z.boolean().default(true),
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

export const n8nIngoingSourceModule: SourceIntegrationModule = {
  id: "n8n-ingoing",
  direction: "source",
  sourceType: "n8n_ingoing",
  formSchema,
  configSchema,
  getDefaults(locale) {
    return {
      name: "n8n Ingoing",
      environment: "production",
      rate_limit_per_min: 180,
      create_api_key: true,
      key_name: localeText(locale, "Chave n8n Ingoing", "n8n Ingoing key"),
      workflow_name: "",
      require_identity: true,
    };
  },
  Form({ values, onChange, locale }) {
    const formValues = values as N8nIngoingValues;
    const update = (patch: Partial<N8nIngoingValues>) => onChange({ ...formValues, ...patch });
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome da source", "Source name")}</label>
          <Input value={formValues.name} onChange={(event) => update({ name: event.target.value })} className="h-9 text-[13px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Ambiente", "Environment")}</label>
            <select
              className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
              value={formValues.environment}
              onChange={(event) => update({ environment: event.target.value as N8nIngoingValues["environment"] })}
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
              onChange={(event) => update({ rate_limit_per_min: Number(event.target.value || 180) })}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome do workflow n8n", "n8n workflow name")}</label>
          <Input
            value={formValues.workflow_name}
            onChange={(event) => update({ workflow_name: event.target.value })}
            className="h-9 text-[13px]"
            placeholder={localeText(locale, "wf-leads-main", "wf-leads-main")}
          />
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
            checked={formValues.require_identity}
            onChange={(event) => update({ require_identity: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Exigir email/phone/external_id", "Require email/phone/external_id")}
        </label>
      </div>
    );
  },
  toCreatePayload(values) {
    const formValues = values as N8nIngoingValues;
    return {
      name: formValues.name.trim(),
      type: "n8n_ingoing",
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "n8n-ingoing",
      integration_config_json: {
        require_identity: formValues.require_identity,
        ...(formValues.workflow_name.trim() ? { workflow_name: formValues.workflow_name.trim() } : {}),
      },
    };
  },
  toUpdatePayload(values) {
    const formValues = values as N8nIngoingValues;
    return {
      name: formValues.name.trim(),
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "n8n-ingoing",
      integration_config_json: {
        require_identity: formValues.require_identity,
        ...(formValues.workflow_name.trim() ? { workflow_name: formValues.workflow_name.trim() } : {}),
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
      workflow_name: typeof config.workflow_name === "string" ? config.workflow_name : "",
      require_identity: config.require_identity !== false,
    };
  },
};
