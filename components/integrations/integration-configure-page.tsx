"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegrationDirection, integrationsCatalog } from "@/content/integrations-catalog";
import { useI18n } from "@/contexts/i18n-context";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

type SourceEnvironment = "production" | "staging" | "development";
type DestinationMethod = "post" | "put" | "patch";

const fallbackDeliveryEvents = ["lead_created", "lead_updated", "delivery_failed", "delivery_success"] as const;

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

export function IntegrationConfigurePage({ direction, defaultReturnTo }: IntegrationConfigurePageProps) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, t } = useI18n();

  const integration = useMemo(
    () => integrationsCatalog.find((item) => item.id === params.id && item.direction === direction) ?? null,
    [params.id, direction],
  );

  const returnTo = resolveReturnTo(searchParams.get("returnTo"), defaultReturnTo);

  const sourceSetup = integration?.setup?.source;
  const destinationSetup = integration?.setup?.destination;

  const [sourceName, setSourceName] = useState(sourceSetup?.default_name[locale] ?? "");
  const [sourceKeyName, setSourceKeyName] = useState(sourceSetup?.default_key_name?.[locale] ?? "");
  const [sourceEnvironment, setSourceEnvironment] = useState<SourceEnvironment>(sourceSetup?.default_environment ?? "production");
  const [sourceRateLimit, setSourceRateLimit] = useState(sourceSetup?.default_rate_limit_per_min ?? 120);
  const [sourceCreateKey, setSourceCreateKey] = useState(sourceSetup?.allow_key_generation ?? true);
  const [sourceResult, setSourceResult] = useState<{ sourceId: string; plainKey?: string } | null>(null);
  const [creatingSource, setCreatingSource] = useState(false);

  const [destinationName, setDestinationName] = useState(destinationSetup?.default_name[locale] ?? "");
  const [destinationUrl, setDestinationUrl] = useState(destinationSetup?.default_url ?? "");
  const [destinationMethod, setDestinationMethod] = useState<DestinationMethod>(destinationSetup?.default_method ?? "post");
  const [destinationEvents, setDestinationEvents] = useState<string[]>(
    destinationSetup?.subscribed_events ?? ["lead_created", "lead_updated"],
  );
  const [destinationResult, setDestinationResult] = useState<{ destinationId: string; signingSecret?: string } | null>(null);
  const [creatingDestination, setCreatingDestination] = useState(false);
  const [testingDestination, setTestingDestination] = useState(false);

  const supportsSource = direction === "source" && Boolean(sourceSetup && integration?.availability === "active");
  const supportsDestination = direction === "destination" && Boolean(destinationSetup && integration?.availability === "active");

  const handleCreateSource = async () => {
    if (!sourceSetup || !sourceName.trim()) {
      return;
    }

    setCreatingSource(true);
    try {
      const createResponse = await api.post("/sources", {
        name: sourceName.trim(),
        type: sourceSetup.type,
        environment: sourceEnvironment,
        rate_limit_per_min: sourceRateLimit,
      });

      if (!createResponse.data?.success) {
        return;
      }

      const sourceId = createResponse.data.data.id as string;
      let plainKey: string | undefined;

      if (sourceCreateKey) {
        const keyResponse = await api.post(`/sources/${sourceId}/keys`, {
          name: sourceKeyName.trim() || `${sourceName.trim()} key`,
        });

        plainKey = keyResponse.data?.data?.plain_key as string | undefined;
      }

      setSourceResult({ sourceId, plainKey });
      toast.success(t("integrations.created_success"));
    } catch (error) {
      logger.error("Failed to configure source integration", error);
      toast.error(t("integrations.create_failed"));
    } finally {
      setCreatingSource(false);
    }
  };

  const handleCreateDestination = async () => {
    if (!destinationName.trim() || !destinationUrl.trim()) {
      return;
    }

    setCreatingDestination(true);
    try {
      const response = await api.post("/destinations", {
        name: destinationName.trim(),
        url: destinationUrl.trim(),
        method: destinationMethod,
        subscribed_events_json: destinationEvents,
      });

      if (!response.data?.success) {
        return;
      }

      setDestinationResult({
        destinationId: response.data.data.id as string,
        signingSecret: response.data.data.signing_secret as string | undefined,
      });
      toast.success(t("integrations.created_success"));
    } catch (error) {
      logger.error("Failed to configure destination integration", error);
      toast.error(t("integrations.create_failed"));
    } finally {
      setCreatingDestination(false);
    }
  };

  const handleTestDestination = async () => {
    if (!destinationResult?.destinationId) {
      return;
    }

    setTestingDestination(true);
    try {
      const response = await api.post(`/destinations/${destinationResult.destinationId}/test`, {
        event_type: "test_event",
        payload: destinationSetup?.test_payload ?? {
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
      setTestingDestination(false);
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
  const sourcePayload = sourceSetup?.ingest_example_payload ?? { email: "john@doe.com", name: "John Doe" };
  const eventOptions = destinationSetup?.subscribed_events ?? [...fallbackDeliveryEvents];
  const configTitle = direction === "source" ? t("integrations.source_config") : t("integrations.destination_config");

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
            <h2 className="text-[14px] font-semibold text-foreground">{configTitle}</h2>
            <p className="text-[12px] text-muted-foreground">{t("integrations.setup_subtitle")}</p>

            {supportsSource ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.source_name")}</label>
                    <Input value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="h-9 text-[13px]" />
                  </div>

                  {sourceSetup?.allow_environment ?? true ? (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-foreground">{t("integrations.source_environment")}</label>
                      <select
                        className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
                        value={sourceEnvironment}
                        onChange={(event) => setSourceEnvironment(event.target.value as SourceEnvironment)}
                      >
                        <option value="production">production</option>
                        <option value="staging">staging</option>
                        <option value="development">development</option>
                      </select>
                    </div>
                  ) : null}

                  {sourceSetup?.allow_rate_limit ?? true ? (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-foreground">{t("integrations.source_rate_limit")}</label>
                      <Input
                        type="number"
                        min={1}
                        max={20000}
                        value={sourceRateLimit}
                        onChange={(event) => setSourceRateLimit(Number(event.target.value || 120))}
                        className="h-9 text-[13px]"
                      />
                    </div>
                  ) : null}

                  {sourceSetup?.allow_key_generation ?? true ? (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-foreground">{t("integrations.source_key_name")}</label>
                      <Input
                        value={sourceKeyName}
                        onChange={(event) => setSourceKeyName(event.target.value)}
                        className="h-9 text-[13px]"
                        disabled={!sourceCreateKey}
                      />
                    </div>
                  ) : null}
                </div>

                {sourceSetup?.allow_key_generation ?? true ? (
                  <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
                    <input
                      type="checkbox"
                      checked={sourceCreateKey}
                      onChange={(event) => setSourceCreateKey(event.target.checked)}
                      className="h-4 w-4 rounded border-border bg-background"
                    />
                    {t("integrations.generate_api_key")}
                  </label>
                ) : null}

                <Button className="h-9 text-[13px]" onClick={handleCreateSource} disabled={creatingSource || !sourceName.trim()}>
                  {creatingSource ? t("integrations.creating") : t("integrations.create_source_and_key")}
                </Button>

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
                      {`curl -X POST "$APP_URL/api/v1/leads/ingest" \\
-H "Authorization: Bearer ${sourceResult.plainKey || "lv_api_key"}" \\
-H "Idempotency-Key: sample-001" \\
-H "Content-Type: application/json" \\
-d '${JSON.stringify(sourcePayload)}'`}
                    </code>
                  </div>
                ) : null}
              </>
            ) : null}

            {supportsDestination ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_name")}</label>
                    <Input value={destinationName} onChange={(event) => setDestinationName(event.target.value)} className="h-9 text-[13px]" />
                  </div>

                  {destinationSetup?.allow_method ?? true ? (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_method")}</label>
                      <select
                        className="h-9 w-full text-[13px] rounded-md border border-border bg-background px-3 text-foreground"
                        value={destinationMethod}
                        onChange={(event) => setDestinationMethod(event.target.value as DestinationMethod)}
                      >
                        <option value="post">POST</option>
                        <option value="put">PUT</option>
                        <option value="patch">PATCH</option>
                      </select>
                    </div>
                  ) : null}

                  <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_url")}</label>
                    <Input
                      value={destinationUrl}
                      onChange={(event) => setDestinationUrl(event.target.value)}
                      className="h-9 text-[13px]"
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                </div>

                {destinationSetup?.allow_events ?? true ? (
                  <div className="space-y-2">
                    <p className="text-[12px] font-medium text-foreground">{t("integrations.destination_events")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                      {eventOptions.map((eventName) => (
                        <label key={eventName} className="inline-flex items-center gap-2 text-[13px] text-foreground">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border bg-background"
                            checked={destinationEvents.includes(eventName)}
                            onChange={(event) => {
                              setDestinationEvents((prev) => {
                                if (event.target.checked) {
                                  return [...new Set([...prev, eventName])];
                                }

                                return prev.filter((item) => item !== eventName);
                              });
                            }}
                          />
                          {eventName}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <p className="text-[12px] text-muted-foreground">{t("integrations.destination_secret_auto")}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="h-9 text-[13px]"
                    onClick={handleCreateDestination}
                    disabled={creatingDestination || !destinationName.trim() || !destinationUrl.trim()}
                  >
                    {creatingDestination ? t("integrations.creating") : t("integrations.create_destination_and_test")}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 text-[13px]"
                    onClick={handleTestDestination}
                    disabled={testingDestination || !destinationResult?.destinationId}
                  >
                    {testingDestination ? t("integrations.testing") : t("integrations.test_destination")}
                  </Button>
                </div>

                {destinationResult ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-2">
                    <p className="text-[12px] font-medium text-foreground">
                      {t("integrations.destination_created_id", { id: destinationResult.destinationId })}
                    </p>
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
              </>
            ) : null}

            {!supportsSource && !supportsDestination && integration.availability !== "soon" ? (
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-[13px] text-muted-foreground">{t("integrations.not_supported_for_direction")}</p>
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
