"use client";

import { IntegrationConfigurePage } from "@/components/integrations/integration-configure-page";

export default function SourceIntegrationConfigureRoute() {
  return <IntegrationConfigurePage direction="source" defaultReturnTo="/sources?tab=browse" />;
}
