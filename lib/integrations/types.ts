import { ReactNode } from "react";
import { z } from "zod";

export type IntegrationCategory = "webhooks" | "forms" | "automation" | "ads" | "sdk" | "custom";
export type IntegrationDirection = "source" | "destination";
export type IntegrationAvailability = "active" | "soon";
export type IntegrationBadge = "popular" | "soon";
export type IntegrationLocale = "pt" | "en";

export type LocalizedText = {
  pt: string;
  en: string;
};

export type IntegrationFormValues = Record<string, unknown>;

export type IntegrationFormProps<TValues extends IntegrationFormValues = IntegrationFormValues> = {
  values: TValues;
  onChange: (values: TValues) => void;
  mode: "create" | "edit";
  locale: IntegrationLocale;
};

export type SourceEnvironment = "production" | "staging" | "development";
export type SourceStatus = "active" | "inactive";
export type DestinationMethod = "post" | "put" | "patch";

export type SourceRecord = {
  id: string;
  name: string;
  type: string;
  environment: SourceEnvironment;
  rate_limit_per_min: number;
  status: SourceStatus;
  integration_id: string;
  integration_config_json: unknown;
};

export type DestinationRecord = {
  id: string;
  name: string;
  url: string;
  method: DestinationMethod;
  enabled: boolean;
  subscribed_events_json: string[] | null;
  integration_id: string;
  integration_config_json: unknown;
};

export type SourceCreateApiPayload = {
  name: string;
  type: string;
  environment: SourceEnvironment;
  rate_limit_per_min: number;
  status?: SourceStatus;
  integration_id: string;
  integration_config_json?: Record<string, unknown>;
};

export type SourceUpdateApiPayload = Partial<Omit<SourceCreateApiPayload, "integration_id">> & {
  integration_id?: string;
};

export type DestinationCreateApiPayload = {
  name: string;
  url: string;
  method: DestinationMethod;
  enabled?: boolean;
  headers_json?: Record<string, string>;
  subscribed_events_json?: string[];
  integration_id: string;
  integration_config_json?: Record<string, unknown>;
};

export type DestinationUpdateApiPayload = Partial<Omit<DestinationCreateApiPayload, "integration_id">> & {
  integration_id?: string;
  signing_secret?: string;
};

export type SourceIntegrationModule = {
  id: string;
  direction: "source";
  sourceType: string;
  formSchema: z.ZodType<IntegrationFormValues>;
  configSchema: z.ZodType<Record<string, unknown>>;
  getDefaults: (locale: IntegrationLocale) => IntegrationFormValues;
  Form: (props: IntegrationFormProps) => ReactNode;
  toCreatePayload: (values: IntegrationFormValues) => SourceCreateApiPayload;
  toUpdatePayload: (values: IntegrationFormValues) => SourceUpdateApiPayload;
  fromEntity: (entity: SourceRecord, locale: IntegrationLocale) => IntegrationFormValues;
};

export type DestinationIntegrationModule = {
  id: string;
  direction: "destination";
  formSchema: z.ZodType<IntegrationFormValues>;
  configSchema: z.ZodType<Record<string, unknown>>;
  getDefaults: (locale: IntegrationLocale) => IntegrationFormValues;
  Form: (props: IntegrationFormProps) => ReactNode;
  toCreatePayload: (values: IntegrationFormValues) => DestinationCreateApiPayload;
  toUpdatePayload: (values: IntegrationFormValues) => DestinationUpdateApiPayload;
  fromEntity: (entity: DestinationRecord, locale: IntegrationLocale) => IntegrationFormValues;
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
  module?: SourceIntegrationModule | DestinationIntegrationModule;
};
