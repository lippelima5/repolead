"use client";

import AppLayout from "@/components/app-layout";
import { FeedbackForm } from "@/components/feedback-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18n-context";

export default function FeedbackPage() {
  const { locale } = useI18n();

  return (
    <AppLayout>
      <div className="space-y-5 p-4 md:p-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{locale === "pt" ? "Feedback" : "Feedback"}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {locale === "pt"
              ? "Envie sugestoes, melhorias ou problemas para nossa equipe."
              : "Share ideas, improvements, or issues with our team."}
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">{locale === "pt" ? "Enviar Feedback" : "Send Feedback"}</CardTitle>
            <CardDescription className="text-[12px]">
              {locale === "pt"
                ? "Preencha os campos abaixo para abrir um ticket de feedback."
                : "Fill the fields below to open a feedback ticket."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm showHeading={false} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
