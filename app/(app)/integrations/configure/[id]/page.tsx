"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/contexts/i18n-context";
import { integrationsCatalog } from "@/content/integrations-catalog";
import { getIntegrationSetup } from "@/content/integration-setup";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

type SourceEnvironment = "production" | "staging" | "development";
type DestinationMethod = "post" | "put" | "patch";

const availableDeliveryEvents = ["lead_created", "lead_updated", "delivery_failed", "delivery_success"] as const;

function resolveReturnTo(value: string | null) {
  if (!value) {
    return "/integrations";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/integrations";
  }

  return value;
}

export default function IntegrationConfigurePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, t } = useI18n();

  const integration = useMemo(
    () => integrationsCatalog.find((item) => item.id === params.id) ?? null,
    [params.id],
  );

  const returnTo = resolveReturnTo(searchParams.get("returnTo"));
  const setup = integration ? getIntegrationSetup(integration) : null;

  const [sourceName, setSourceName] = useState(setup?.sourceDefaults?.suggestedName[locale] ?? "");
  const [sourceKeyName, setSourceKeyName] = useState(setup?.sourceDefaults?.keyName[locale] ?? "");
  const [sourceEnvironment, setSourceEnvironment] = useState<SourceEnvironment>(setup?.sourceDefaults?.environment ?? "production");
  const [sourceRateLimit, setSourceRateLimit] = useState(setup?.sourceDefaults?.rateLimitPerMin ?? 120);
  const [sourceCreateKey, setSourceCreateKey] = useState(true);
  const [sourceResult, setSourceResult] = useState<{ sourceId: string; plainKey?: string; prefix?: string } | null>(null);
  const [creatingSource, setCreatingSource] = useState(false);

  const [destinationName, setDestinationName] = useState(setup?.destinationDefaults?.suggestedName[locale] ?? "");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [destinationMethod, setDestinationMethod] = useState<DestinationMethod>(setup?.destinationDefaults?.method ?? "post");
  const [destinationSecret, setDestinationSecret] = useState("");
  const [destinationEvents, setDestinationEvents] = useState<string[]>(
    setup?.destinationDefaults?.subscribedEvents ?? ["lead_created", "lead_updated"],
  );
  const [destinationResult, setDestinationResult] = useState<{ destinationId: string; signingSecret?: string } | null>(null);
  const [creatingDestination, setCreatingDestination] = useState(false);
  const [testingDestination, setTestingDestination] = useState(false);

  const hasSourceSetup = Boolean(setup?.sourceDefaults && integration && (integration.direction === "source" || integration.direction === "both"));
  const hasDestinationSetup = Boolean(
    setup?.destinationDefaults && integration && (integration.direction === "destination" || integration.direction === "both"),
  );

  const handleCreateSource = async () => {
    if (!integration || !setup?.sourceDefaults || !sourceName.trim()) {
      return;
    }

    setCreatingSource(true);
    try {
      const createResponse = await api.post("/sources", {
        name: sourceName.trim(),
        type: setup.sourceDefaults.type,
        environment: sourceEnvironment,
        rate_limit_per_min: sourceRateLimit,
      });

      if (!createResponse.data?.success) {
        return;
      }

      const sourceId = createResponse.data.data.id as string;
      let plainKey: string | undefined;
      let prefix: string | undefined;

      if (sourceCreateKey) {
        const keyResponse = await api.post(`/sources/${sourceId}/keys`, {
          name: sourceKeyName.trim() || `${sourceName.trim()} key`,
        });

        plainKey = keyResponse.data?.data?.plain_key as string | undefined;
        prefix = keyResponse.data?.data?.prefix as string | undefined;
      }

      setSourceResult({ sourceId, plainKey, prefix });
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
        signing_secret: destinationSecret.trim() ? destinationSecret.trim() : undefined,
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
        payload: {
          lead: {
            email: "john@doe.com",
            name: "John Doe",
          },
          integration: integration?.id ?? "unknown",
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
        <div className="p-6 max-w-[1000px]">
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

  return (
    <AppLayout
      title={`${t("integrations.setup_title")}: ${integration.name}`}
      backButton={{
        href: returnTo,
        label: t("common.back"),
      }}
    >
      <div className="p-4 md:p-6 max-w-[1000px] space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{integration.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{integration.description[locale]}</p>
        </div>

        {integration.availability === "soon" ? (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-foreground">{t("integrations.badge_soon")}</h2>
            <p className="text-[13px] text-muted-foreground">{t("integrations.soon_description")}</p>
            <Button size="sm" className="h-8 text-[13px]" onClick={() => router.push(returnTo)}>
              {t("common.back")}
            </Button>
          </div>
        ) : (
          <>
            {setup ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-[14px] font-semibold text-foreground mb-3">{t("integrations.requirements")}</h2>
                  <ul className="space-y-2 text-[13px] text-muted-foreground">
                    {setup.requirements.map((item, index) => (
                      <li key={`req-${index}`} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item[locale]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-[14px] font-semibold text-foreground mb-3">{t("integrations.setup_steps")}</h2>
                  <ol className="space-y-2 text-[13px] text-muted-foreground list-decimal pl-4">
                    {setup.steps.map((item, index) => (
                      <li key={`step-${index}`}>{item[locale]}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : null}

            {hasSourceSetup ? (
              <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-[14px] font-semibold text-foreground">{t("integrations.source_config")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.source_name")}</label>
                    <Input
                      value={sourceName}
                      onChange={(event) => setSourceName(event.target.value)}
                      className="h-9 text-[13px]"
                    />
                  </div>
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
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.source_key_name")}</label>
                    <Input
                      value={sourceKeyName}
                      onChange={(event) => setSourceKeyName(event.target.value)}
                      className="h-9 text-[13px]"
                      disabled={!sourceCreateKey}
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
                  <input
                    type="checkbox"
                    checked={sourceCreateKey}
                    onChange={(event) => setSourceCreateKey(event.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background"
                  />
                  {t("integrations.generate_api_key")}
                </label>

                <Button
                  className="h-9 text-[13px]"
                  onClick={handleCreateSource}
                  disabled={creatingSource || !sourceName.trim()}
                >
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
-H "Idempotency-Key: test-123" \\
-H "Content-Type: application/json" \\
-d '{"email":"john@doe.com","name":"John Doe"}'`}
                    </code>
                  </div>
                ) : null}
              </section>
            ) : null}

            {hasDestinationSetup ? (
              <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-[14px] font-semibold text-foreground">{t("integrations.destination_config")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_name")}</label>
                    <Input
                      value={destinationName}
                      onChange={(event) => setDestinationName(event.target.value)}
                      className="h-9 text-[13px]"
                    />
                  </div>
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
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_url")}</label>
                    <Input
                      value={destinationUrl}
                      onChange={(event) => setDestinationUrl(event.target.value)}
                      className="h-9 text-[13px]"
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-medium text-foreground">{t("integrations.destination_secret")}</label>
                    <Input
                      value={destinationSecret}
                      onChange={(event) => setDestinationSecret(event.target.value)}
                      className="h-9 text-[13px]"
                      placeholder="lv_whsec_..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-foreground">{t("integrations.destination_events")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableDeliveryEvents.map((eventName) => (
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
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppLayout>
  );
}
