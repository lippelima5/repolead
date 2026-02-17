import { z } from "zod";
import { Input } from "@/components/ui/input";
import { SourceIntegrationModule } from "@/lib/integrations/types";

type FormBackendValues = {
  name: string;
  environment: "production" | "staging" | "development";
  rate_limit_per_min: number;
  create_api_key: boolean;
  key_name: string;
  capture_utm: boolean;
  expected_form_name: string;
};

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  rate_limit_per_min: z.coerce.number().int().min(1).max(20000).default(100),
  create_api_key: z.boolean().default(true),
  key_name: z.string().trim().max(120).default("Form key"),
  capture_utm: z.boolean().default(true),
  expected_form_name: z.string().trim().max(120).default(""),
});

const configSchema = z.object({
  capture_utm: z.boolean().default(true),
  expected_form_name: z.string().trim().max(120).optional(),
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

export const formBackendSourceModule: SourceIntegrationModule = {
  id: "form-backend",
  direction: "source",
  sourceType: "form_backend",
  formSchema,
  configSchema,
  getDefaults(locale) {
    return {
      name: "Form Backend",
      environment: "production",
      rate_limit_per_min: 100,
      create_api_key: true,
      key_name: localeText(locale, "Chave formulario", "Form key"),
      capture_utm: true,
      expected_form_name: "",
    };
  },
  Form({ values, onChange, locale }) {
    const formValues = values as FormBackendValues;
    const update = (patch: Partial<FormBackendValues>) => onChange({ ...formValues, ...patch });
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
              onChange={(event) => update({ environment: event.target.value as FormBackendValues["environment"] })}
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
              onChange={(event) => update({ rate_limit_per_min: Number(event.target.value || 100) })}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">{localeText(locale, "Nome esperado do formulario", "Expected form name")}</label>
          <Input
            value={formValues.expected_form_name}
            onChange={(event) => update({ expected_form_name: event.target.value })}
            className="h-9 text-[13px]"
            placeholder={localeText(locale, "contato-principal", "main-contact-form")}
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
            checked={formValues.capture_utm}
            onChange={(event) => update({ capture_utm: event.target.checked })}
            className="h-4 w-4 rounded border-border bg-background"
          />
          {localeText(locale, "Capturar parametros UTM", "Capture UTM parameters")}
        </label>
      </div>
    );
  },
  toCreatePayload(values) {
    const formValues = values as FormBackendValues;
    return {
      name: formValues.name.trim(),
      type: "form_backend",
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "form-backend",
      integration_config_json: {
        capture_utm: formValues.capture_utm,
        ...(formValues.expected_form_name.trim() ? { expected_form_name: formValues.expected_form_name.trim() } : {}),
      },
    };
  },
  toUpdatePayload(values) {
    const formValues = values as FormBackendValues;
    return {
      name: formValues.name.trim(),
      environment: formValues.environment,
      rate_limit_per_min: formValues.rate_limit_per_min,
      integration_id: "form-backend",
      integration_config_json: {
        capture_utm: formValues.capture_utm,
        ...(formValues.expected_form_name.trim() ? { expected_form_name: formValues.expected_form_name.trim() } : {}),
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
      capture_utm: config.capture_utm !== false,
      expected_form_name: typeof config.expected_form_name === "string" ? config.expected_form_name : "",
    };
  },
};
