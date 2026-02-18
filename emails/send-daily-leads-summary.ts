import Mail from "@/lib/mail";
import { createEmailTemplate } from "@/emails/email-template";

type SummaryDetail = {
  label: string;
  value: string;
};

export default class SendDailyLeadsSummary extends Mail {
  private readonly workspaceName: string;
  private readonly summaryDateLabel: string;
  private readonly details: SummaryDetail[];
  private readonly dashboardUrl: string;

  constructor({
    workspaceName,
    summaryDateLabel,
    details,
    dashboardUrl,
    receivers,
  }: {
    workspaceName: string;
    summaryDateLabel: string;
    details: SummaryDetail[];
    dashboardUrl: string;
    receivers: string | string[];
  }) {
    super(receivers);
    this.workspaceName = workspaceName;
    this.summaryDateLabel = summaryDateLabel;
    this.details = details;
    this.dashboardUrl = dashboardUrl;
  }

  protected getTextContent(): string {
    return createEmailTemplate({
      title: "Resumo diario da operacao",
      greeting: "Ola!",
      intro: `Segue o resumo diario do workspace ${this.workspaceName} em ${this.summaryDateLabel}.`,
      details: this.details,
      action: {
        label: "Abrir dashboard",
        url: this.dashboardUrl,
      },
      footerMessage: "Este envio acontece apenas quando ha leads novos no dia.",
    }).text;
  }

  protected getHtmlContent(): string {
    return createEmailTemplate({
      title: "Resumo diario da operacao",
      greeting: "Ola!",
      intro: `Segue o resumo diario do workspace ${this.workspaceName} em ${this.summaryDateLabel}.`,
      details: this.details,
      action: {
        label: "Abrir dashboard",
        url: this.dashboardUrl,
      },
      footerMessage: "Este envio acontece apenas quando ha leads novos no dia.",
    }).html;
  }
}
