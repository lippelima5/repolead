"use client";

import { IntegrationConfigurePage } from "@/components/integrations/integration-configure-page";

export default function DestinationIntegrationConfigureRoute() {
  return <IntegrationConfigurePage direction="destination" defaultReturnTo="/destinations?tab=browse" />;
}
