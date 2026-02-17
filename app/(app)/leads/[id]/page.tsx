"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, FileJson, Mail, Phone, Send, Tag } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import logger from "@/lib/logger.client";

type LeadDetail = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  tags_json: unknown;
  identities: Array<{ id: string; type: string; value: string; normalized_value: string }>;
};

type LeadTimelineEvent = {
  id: string;
  type: string;
  timestamp: string;
  reason: string | null;
  new_value_json: unknown;
  old_value_json: unknown;
  ingestion?: { id: string } | null;
  delivery?: { id: string; event_type: string; status: string; attempt_count: number; destination?: { name: string } | null } | null;
};

type DeliveryItem = {
  id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  destination: { name: string };
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [timeline, setTimeline] = useState<LeadTimelineEvent[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [rawPayload, setRawPayload] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const [leadResponse, timelineResponse, deliveriesResponse] = await Promise.all([
          api.get(`/leads/${leadId}`),
          api.get(`/leads/${leadId}/timeline`),
          api.get("/deliveries", {
            params: {
              leadId,
              limit: 50,
              offset: 0,
            },
          }),
        ]);

        if (leadResponse.data?.success) {
          setLead(leadResponse.data.data);
        }

        if (timelineResponse.data?.success) {
          const list = timelineResponse.data.data as LeadTimelineEvent[];
          setTimeline(list);
          const firstIngestionId = list.find((item) => item.ingestion?.id)?.ingestion?.id;
          if (firstIngestionId) {
            const ingestionResponse = await api.get(`/ingestions/${firstIngestionId}`);
            if (ingestionResponse.data?.success) {
              setRawPayload(JSON.stringify(ingestionResponse.data.data.raw_payload_json || {}, null, 2));
            }
          }
        }

        if (deliveriesResponse.data?.success) {
          setDeliveries(deliveriesResponse.data.data.items || []);
        }
      } catch (error) {
        logger.error("Failed to load lead details", error);
      }
    };

    if (leadId) {
      void load();
    }
  }, [leadId]);

  const tags = useMemo(() => (Array.isArray(lead?.tags_json) ? (lead?.tags_json as string[]) : []), [lead?.tags_json]);

  return (
    <AppLayout>
      <div className="p-6 max-w-[1000px] space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 h-8 w-8 rounded-lg">
            <Link href="/leads">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-foreground">{lead?.name || "Unnamed lead"}</h1>
              {lead ? <StatusBadge status={lead.status} /> : null}
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{lead?.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Email</span>
            </div>
            <p className="text-[13px] text-foreground font-mono">{lead?.email || "-"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Phone</span>
            </div>
            <p className="text-[13px] text-foreground font-mono">{lead?.phone || "-"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.length > 0 ? tags.map((tag) => <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] bg-accent text-accent-foreground">{tag}</span>) : <span className="text-[12px] text-muted-foreground">No tags</span>}
            </div>
          </div>
        </div>

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="bg-surface-2 border border-border rounded-lg p-1 h-auto">
            <TabsTrigger value="timeline" className="text-[12px] rounded-md px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-[12px] rounded-md px-3 py-1.5">
              <FileJson className="w-3.5 h-3.5 mr-1.5" />
              Raw payload
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="text-[12px] rounded-md px-3 py-1.5">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Deliveries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="space-y-0">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      {index < timeline.length - 1 ? <div className="w-px flex-1 bg-border" /> : null}
                    </div>
                    <div className="pb-5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.type} />
                        <span className="text-[11px] text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[13px] text-foreground mt-1">{event.reason || "No details"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw">
            <div className="bg-card border border-border rounded-xl p-5">
              <pre className="bg-surface-2 rounded-lg p-4 text-[12px] font-mono text-foreground overflow-x-auto border border-border">
                {rawPayload || "{}"}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="deliveries">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Destination</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Event</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Status</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-[13px] text-foreground">{delivery.destination.name}</td>
                      <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{delivery.event_type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={delivery.status} />
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{delivery.attempt_count}/50</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
