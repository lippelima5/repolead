import logger from "@/lib/logger.server";
import Mail from "@/lib/mail";
import { createEmailTemplate } from "@/emails/email-template";

export default class SendAuthMagicLink extends Mail {
  private readonly name: string;
  private readonly url: string;

  constructor({ name, url, receivers }: { name: string; url: string; receivers: string | string[] }) {
    super(receivers);
    this.name = name;
    this.url = url;
  }

  public async sendSafe(subject: string): Promise<void> {
    try {
      await this.send(subject);
    } catch (err) {
      logger.error("Failed to send auth magic link email", err);
    }
  }

  protected getTextContent(): string {
    return createEmailTemplate({
      title: "Link de acesso",
      greeting: `Ola, ${this.name || "usuario"}`,
      intro: "Use o link abaixo para acessar sua conta com seguranca. Este link expira em alguns minutos.",
      action: {
        label: "Entrar na conta",
        url: this.url,
      },
      footerMessage: "Se voce nao solicitou este acesso, ignore este email.",
    }).text;
  }

  protected getHtmlContent(): string {
    return createEmailTemplate({
      title: "Link de acesso",
      greeting: `Ola, ${this.name || "usuario"}`,
      intro: "Use o link abaixo para acessar sua conta com seguranca. Este link expira em alguns minutos.",
      action: {
        label: "Entrar na conta",
        url: this.url,
      },
      footerMessage: "Se voce nao solicitou este acesso, ignore este email.",
    }).html;
  }
}
