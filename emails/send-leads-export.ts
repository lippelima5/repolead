import logger from "@/lib/logger.server";
import Mail from "@/lib/mail";
import { createEmailTemplate } from "@/emails/email-template";

export default class SendLeadsExport extends Mail {
  private readonly downloadUrl: string;
  private readonly workspaceName: string;

  constructor({
    downloadUrl,
    workspaceName,
    receivers,
  }: {
    downloadUrl: string;
    workspaceName: string;
    receivers: string | string[];
  }) {
    super(receivers);
    this.downloadUrl = downloadUrl;
    this.workspaceName = workspaceName;
  }

  public async sendSafe(subject: string): Promise<void> {
    try {
      await this.send(subject);
    } catch (err) {
      logger.error("Failed to send leads export email", err);
    }
  }

  protected getTextContent(): string {
    return createEmailTemplate({
      title: "Exportacao de leads pronta",
      greeting: "Ola!",
      intro: `Seu arquivo de leads do workspace ${this.workspaceName} esta pronto para download.`,
      action: {
        label: "Baixar CSV",
        url: this.downloadUrl,
      },
      footerMessage: "Esse link expira em 24 horas.",
    }).text;
  }

  protected getHtmlContent(): string {
    return createEmailTemplate({
      title: "Exportacao de leads pronta",
      greeting: "Ola!",
      intro: `Seu arquivo de leads do workspace ${this.workspaceName} esta pronto para download.`,
      action: {
        label: "Baixar CSV",
        url: this.downloadUrl,
      },
      footerMessage: "Esse link expira em 24 horas.",
    }).html;
  }
}
