import logger from "@/lib/logger.server";
import Mail from "@/lib/mail";
import { createEmailTemplate } from "@/emails/email-template";

export default class SendWorkspaceInvite extends Mail {
  private readonly workspaceName: string;
  private readonly inviterName: string;
  private readonly inviteUrl: string;

  constructor({
    workspaceName,
    inviterName,
    inviteUrl,
    receivers,
  }: {
    workspaceName: string;
    inviterName: string;
    inviteUrl: string;
    receivers: string | string[];
  }) {
    super(receivers);
    this.workspaceName = workspaceName;
    this.inviterName = inviterName;
    this.inviteUrl = inviteUrl;
  }

  public async sendSafe(subject: string): Promise<void> {
    try {
      await this.send(subject);
    } catch (err) {
      logger.error("Failed to send workspace invite email", err);
    }
  }

  protected getTextContent(): string {
    return createEmailTemplate({
      title: "Convite para workspace",
      greeting: "Ola!",
      intro: `${this.inviterName} convidou voce para participar do workspace ${this.workspaceName}.`,
      action: {
        label: "Aceitar convite",
        url: this.inviteUrl,
      },
      footerMessage: "Se nao reconhece este convite, ignore este email.",
    }).text;
  }

  protected getHtmlContent(): string {
    return createEmailTemplate({
      title: "Convite para workspace",
      greeting: "Ola!",
      intro: `${this.inviterName} convidou voce para participar do workspace ${this.workspaceName}.`,
      action: {
        label: "Aceitar convite",
        url: this.inviteUrl,
      },
      footerMessage: "Se nao reconhece este convite, ignore este email.",
    }).html;
  }
}
