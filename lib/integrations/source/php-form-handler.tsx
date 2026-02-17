import { z } from "zod";
import { Input } from "@/components/ui/input";
import { SourceIntegrationModule } from "@/lib/integrations/types";

type PhpFormHandlerValues = {
  name: string;
  environment: "production" | "staging" | "development";
  rate_limit_per_min: number;
  create_api_key: boolean;
  key_name: string;
  php_min_version: string;
  endpoint_path_hint: string;
};

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  rate_limit_per_min: z.coerce.number().int().min(1).max(20000).default(90),
  create_api_key: z.boolean().default(true),
  key_name: z.string().trim().max(120).default("PHP key"),
  php_min_version: z.string().trim().min(3).max(20).default("7.4"),
  endpoint_path_hint: z.string().trim().max(180).default(""),
});

const configSchema = z.object({
  php_min_version: z.string().trim().min(3).max(20).default("7.4"),
  endpoint_path_hint: z.string().trim().max(180).optional(),
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

export const phpFormHandlerSourceModule: SourceIntegrationModule = {
  id: "php-form-handler",
  direction: "source",
  sourceType: "php_form_handler",
  formSchema,
  configSchema,
  getDefaults(locale) {
    return {
      name: "PHP Form Handler",
      environment: "production",
      rate_limit_per_min: 90,
      create_api_key: true,
      key_name: localeText(locale, "Chave PHP", "PHP key"),
      php_min_version: "7.4",
      endpoint_path_hint: "",
    };
  },
  Form({ values, onChange, locale }) {
    const formValues = values as PhpFormHandlerValues;
    const update = (patch: Partial<PhpFormHandlerValues>) => onChange({ ...formValues, ...patch });
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
              onChange={(event) => update({ environment: event.target.value as PhpFormHandlerValues["environment"] })}
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
              onChange={(event) => update({ rate_limit_per_min: Number(event.target.value || 90) })}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Versao minima do PHP", "Minimum PHP version")}</label>
            <Input
              value={formValues.php_min_version}
              onChange={(event) => update({ php_min_version: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="7.4"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Hint do endpoint", "Endpoint hint")}</label>
            <Input
              value={formValues.endpoint_path_hint}
              onChange={(event) => update({ endpoint_path_hint: event.target.value })}
              className="h-9 text-[13px]"
              placeholder="/api/leads/capture.php"
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
      </div>
    );
  },
  toCreatePayload(values) {
    const formValues = values as PhpFormHandlerValues;
    return {
      name: formValues.name.trim(),
      type: "php_form_handler",
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "php-form-handler",
      integration_config_json: {
        php_min_version: formValues.php_min_version.trim(),
        ...(formValues.endpoint_path_hint.trim() ? { endpoint_path_hint: formValues.endpoint_path_hint.trim() } : {}),
      },
    };
  },
  toUpdatePayload(values) {
    const formValues = values as PhpFormHandlerValues;
    return {
      name: formValues.name.trim(),
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "php-form-handler",
      integration_config_json: {
        php_min_version: formValues.php_min_version.trim(),
        ...(formValues.endpoint_path_hint.trim() ? { endpoint_path_hint: formValues.endpoint_path_hint.trim() } : {}),
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
      php_min_version: typeof config.php_min_version === "string" ? config.php_min_version : "7.4",
      endpoint_path_hint: typeof config.endpoint_path_hint === "string" ? config.endpoint_path_hint : "",
    };
  },
};
