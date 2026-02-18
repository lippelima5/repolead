"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { getIntegrationCatalogItem } from "@/lib/integrations/catalog";
import { DestinationIntegrationModule, IntegrationDirection, IntegrationFormValues, SourceIntegrationModule } from "@/lib/integrations/types";
import { useI18n } from "@/contexts/i18n-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type IntegrationConfigurePageProps = {
  direction: IntegrationDirection;
  defaultReturnTo: string;
};

function resolveReturnTo(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function extractZodMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("issues" in error)) {
    return null;
  }

  const issues = (error as { issues?: Array<{ message?: string }> }).issues;
  if (!issues || issues.length === 0) {
    return null;
  }

  return issues[0]?.message || null;
}

export function IntegrationConfigurePage({ direction, defaultReturnTo }: IntegrationConfigurePageProps) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, t } = useI18n();

  const integration = useMemo(() => getIntegrationCatalogItem(params.id, direction), [params.id, direction]);
  const returnTo = resolveReturnTo(searchParams.get("returnTo"), defaultReturnTo);
  const sourceId = direction === "source" ? searchParams.get("sourceId") : null;
  const destinationId = direction === "destination" ? searchParams.get("destinationId") : null;
  const isEditMode = Boolean(sourceId || destinationId);

  const sourceModule = useMemo(() => {
    if (!integration || integration.direction !== "source" || !integration.module || integration.module.direction !== "source") {
      return null;
    }

    return integration.module as SourceIntegrationModule;
  }, [integration]);

  const destinationModule = useMemo(() => {
    if (!integration || integration.direction !== "destination" || !integration.module || integration.module.direction !== "destination") {
      return null;
    }

    return integration.module as DestinationIntegrationModule;
  }, [integration]);

  const activeModule = (sourceModule || destinationModule) as SourceIntegrationModule | DestinationIntegrationModule | null;

  const [formValues, setFormValues] = useState<IntegrationFormValues>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEntity, setIsLoadingEntity] = useState(false);
  const [isTestingDestination, setIsTestingDestination] = useState(false);
  const [sourceResult, setSourceResult] = useState<{ sourceId: string; plainKey?: string } | null>(null);
  const [destinationResult, setDestinationResult] = useState<{ destinationId: string; signingSecret?: string } | null>(null);

  useEffect(() => {
    if (!activeModule) {
      return;
    }

    setFormValues(activeModule.getDefaults(locale));
  }, [activeModule, locale]);

  useEffect(() => {
    const load = async () => {
      if (!activeModule || !isEditMode) {
        return;
      }

      const id = direction === "source" ? sourceId : destinationId;
      if (!id) {
        return;
      }

      setIsLoadingEntity(true);
      try {
        const endpoint = direction === "source" ? `/sources/${id}` : `/destinations/${id}`;
        const response = await api.get(endpoint);
        if (!response.data?.success) {
          return;
        }

        setFormValues(activeModule.fromEntity(response.data.data, locale));
      } catch (error) {
        logger.error("Failed to load integration entity", error);
        toast.error(direction === "source" ? t("sources.updated_failed") : t("destinations.load_failed"));
      } finally {
        setIsLoadingEntity(false);
      }
    };

    void load();
  }, [activeModule, destinationId, direction, isEditMode, locale, sourceId, t]);

  const handleSubmit = async () => {
    if (!activeModule) {
      return;
    }

    const parsed = activeModule.formSchema.safeParse(formValues);
    if (!parsed.success) {
      const message = extractZodMessage(parsed.error) || t("integrations.create_failed");
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      if (direction === "source" && sourceModule) {
        if (isEditMode && sourceId) {
          const payload = sourceModule.toUpdatePayload(parsed.data);
          const response = await api.patch(`/sources/${sourceId}`, payload);
          if (response.data?.success) {
            toast.success(t("sources.updated_success"));
            router.push(returnTo);
          }
        } else {
          const payload = sourceModule.toCreatePayload(parsed.data);
          const createResponse = await api.post("/sources", payload);
          if (!createResponse.data?.success) {
            return;
          }

          const createdSourceId = createResponse.data.data.id as string;
          const values = parsed.data as Record<string, unknown>;
          const shouldCreateKey = values.create_api_key !== false;
          let plainKey: string | undefined;

          if (shouldCreateKey) {
            const keyName = typeof values.key_name === "string" && values.key_name.trim().length > 0 ? values.key_name.trim() : `${payload.name} key`;
            const keyResponse = await api.post(`/sources/${createdSourceId}/keys`, { name: keyName });
            plainKey = keyResponse.data?.data?.plain_key as string | undefined;
          }

          setSourceResult({ sourceId: createdSourceId, plainKey });
          toast.success(t("integrations.created_success"));
        }
      }

      if (direction === "destination" && destinationModule) {
        if (isEditMode && destinationId) {
          const payload = destinationModule.toUpdatePayload(parsed.data);
          const response = await api.patch(`/destinations/${destinationId}`, payload);
          if (response.data?.success) {
            toast.success(t("destinations.updated_success"));
            router.push(returnTo);
          }
        } else {
          const payload = destinationModule.toCreatePayload(parsed.data);
          const response = await api.post("/destinations", payload);
          if (!response.data?.success) {
            return;
          }

          setDestinationResult({
            destinationId: response.data.data.id as string,
            signingSecret: response.data.data.signing_secret as string | undefined,
          });
          toast.success(t("integrations.created_success"));
        }
      }
    } catch (error) {
      logger.error("Failed to submit integration configuration", error);
      toast.error(direction === "source" ? t("sources.updated_failed") : t("destinations.updated_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestDestination = async () => {
    const targetId = destinationResult?.destinationId || destinationId;
    if (!targetId) {
      return;
    }

    setIsTestingDestination(true);
    try {
      const response = await api.post(`/destinations/${targetId}/test`, {
        event_type: "test_event",
        payload: {
          integration: integration?.id ?? "unknown",
          lead: { email: "test@example.com", name: "Test Lead" },
        },
      });

      if (response.data?.success) {
        toast.success(t("integrations.test_success"));
      }
    } catch (error) {
      logger.error("Failed to test destination integration", error);
      toast.error(t("integrations.test_failed"));
    } finally {
      setIsTestingDestination(false);
    }
  };

  if (!integration) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 max-w-[1000px]">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h1 className="text-lg font-semibold text-foreground">{t("integrations.not_found_title")}</h1>
            <p className="text-sm text-muted-foreground">{t("integrations.not_found_description")}</p>
            <Button size="sm" className="h-8 text-[13px]" onClick={() => router.push(returnTo)}>
              {t("common.back")}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const markdown = integration.full_description_md[locale];
  const sourcePayload = { name: "Jane Doe", email: "jane@example.com", phone: "+5511999999999" };
  const canConfigure = integration.availability === "active" && Boolean(activeModule);
  const ModuleForm = activeModule?.Form;
  const isFormReady = Object.keys(formValues).length > 0;

  return (
    <AppLayout
      title={`${t("integrations.setup_title")}: ${integration.title}`}
      backButton={{
        href: returnTo,
        label: t("common.back"),
      }}
    >
      <div className="p-4 md:p-6 max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{integration.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{integration.short_description[locale]}</p>
        </div>

        {integration.availability === "soon" ? (
          <section className="rounded-xl border border-border bg-card p-5 space-y-1.5">
            <h2 className="text-[14px] font-semibold text-foreground">{t("integrations.badge_soon")}</h2>
            <p className="text-[13px] text-muted-foreground mt-1.5">{t("integrations.soon_description")}</p>
          </section>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-4 items-start">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4 xl:sticky xl:top-4">
            <h2 className="text-[14px] font-semibold text-foreground">
              {direction === "source" ? t("integrations.source_config") : t("integrations.destination_config")}
            </h2>
            <p className="text-[12px] text-muted-foreground">{t("integrations.setup_subtitle")}</p>

            {canConfigure && ModuleForm ? (
              <>
                {isLoadingEntity || !isFormReady ? (
                  <p className="text-[13px] text-muted-foreground">{t("common.loading")}</p>
                ) : (
                  <ModuleForm
                    values={formValues as never}
                    onChange={setFormValues as never}
                    mode={isEditMode ? "edit" : "create"}
                    locale={locale}
                  />
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button className="h-9 text-[13px]" onClick={handleSubmit} disabled={isSubmitting || isLoadingEntity}>
                    {isSubmitting
                      ? t("common.loading")
                      : isEditMode
                        ? t("common.save")
                        : direction === "source"
                          ? t("integrations.create_source_and_key")
                          : t("integrations.create_destination_and_test")}
                  </Button>
                  {direction === "destination" ? (
                    <Button
                      variant="outline"
                      className="h-9 text-[13px]"
                      onClick={handleTestDestination}
                      disabled={isTestingDestination || (!destinationResult?.destinationId && !destinationId)}
                    >
                      {isTestingDestination ? t("integrations.testing") : t("integrations.test_destination")}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-[13px] text-muted-foreground">{t("integrations.not_supported_for_direction")}</p>
              </div>
            )}

            {sourceResult ? (
              <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-2">
                <p className="text-[12px] font-medium text-foreground">{t("integrations.source_created_id", { id: sourceResult.sourceId })}</p>
                {sourceResult.plainKey ? (
                  <>
                    <p className="text-[12px] text-warning">{t("integrations.copy_key_now")}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-[11px]">
                        {sourceResult.plainKey}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(sourceResult.plainKey || "");
                          toast.success(t("integrations.key_copied"));
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                ) : null}
                <code className="block overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-[11px] whitespace-pre">
                  {`curl -X POST "${APP_URL}/api/v1/leads/ingest" \\
-H "Authorization: Bearer ${sourceResult.plainKey || "lv_api_key"}" \\
-H "Idempotency-Key: sample-001" \\
-H "Content-Type: application/json" \\
-d '${JSON.stringify(sourcePayload)}'`}
                </code>
              </div>
            ) : null}

            {destinationResult ? (
              <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-2">
                <p className="text-[12px] font-medium text-foreground">{t("integrations.destination_created_id", { id: destinationResult.destinationId })}</p>
                {destinationResult.signingSecret ? (
                  <div className="space-y-1">
                    <p className="text-[12px] text-warning">{t("integrations.copy_secret_now")}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-[11px]">
                        {destinationResult.signingSecret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(destinationResult.signingSecret || "");
                          toast.success(t("integrations.secret_copied"));
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="inline-flex items-center gap-1.5 text-[12px] text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{t("integrations.destination_ready")}</span>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="integration-markdown text-[13px] text-muted-foreground leading-relaxed space-y-3 [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-[15px] [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-[14px] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_code]:bg-surface-2 [&_code]:border [&_code]:border-border [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:border [&_pre]:border-border [&_pre]:p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
