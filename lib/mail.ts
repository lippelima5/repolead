import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export default abstract class Mail {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private to: string[];
  private cc: string[] = [];
  private bcc: string[] = [];
  private replyTo?: string;
  protected from: string;

  constructor(receivers: string | string[]) {
    this.validateEnvVariables();
    this.from = process.env.SMTP_FROM || "";
    this.to = Array.isArray(receivers) ? [...receivers] : [receivers];

    this.transporter = nodemailer.createTransport(this.createTransportConfig());
  }

  private validateEnvVariables(): void {
    const requiredEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE"];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
    }

    if (
      (process.env.SMTP_USERNAME && !process.env.SMTP_PASSWORD) ||
      (!process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD)
    ) {
      throw new Error("Both SMTP_USERNAME and SMTP_PASSWORD must be provided for SMTP authentication");
    }
  }

  private createTransportConfig(): SMTPTransport.Options {
    const secure = process.env.SMTP_SECURE === "true";
    const port = parseInt(process.env.SMTP_PORT!, 10);

    if (isNaN(port)) {
      throw new Error("SMTP_PORT must be a valid number");
    }

    return {
      host: process.env.SMTP_HOST!,
      port,
      secure,
      auth:
        process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USERNAME,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    };
  }

  public addTo(recipient: string | string[]): this {
    this.to = this.to.concat(recipient);
    return this;
  }

  public addCc(recipient: string | string[]): this {
    this.cc = this.cc.concat(recipient);
    return this;
  }

  public addBcc(recipient: string | string[]): this {
    this.bcc = this.bcc.concat(recipient);
    return this;
  }

  public setReplyTo(email: string): this {
    this.replyTo = email;
    return this;
  }

  protected abstract getTextContent(): string | undefined;
  protected abstract getHtmlContent(): string | undefined;

  private validateContent(): void {
    const text = this.getTextContent();
    const html = this.getHtmlContent();

    if (!text && !html) {
      throw new Error("Email must contain either text or HTML content");
    }
  }

  public async send(subject: string): Promise<SMTPTransport.SentMessageInfo> {
    this.validateContent();

    try {
      return await this.transporter.sendMail({
        from: this.from,
        to: this.to.join(", "),
        cc: this.cc.length ? this.cc.join(", ") : undefined,
        bcc: this.bcc.length ? this.bcc.join(", ") : undefined,
        replyTo: this.replyTo,
        subject,
        text: this.getTextContent(),
        html: this.getHtmlContent(),
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Email sending failed");
    }
  }
}
