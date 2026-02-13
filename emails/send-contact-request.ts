import logger from "@/lib/logger.server";
import Mail from "@/lib/mail";
import { ContactData } from "@/types";
import { createEmailTemplate } from "@/emails/email-template";

export default class SendContactRequest extends Mail {
    private data: ContactData;

    constructor(data: ContactData, receivers: string | string[]) {
        super(receivers);
        this.data = data
    }

    public async sendSafe(subject: string): Promise<void> {
        try {
            await this.send(subject);
        } catch (err) {
            logger.error("Failed to send email:", err);
        }
    }

    protected getTextContent(): string | undefined {
        return createEmailTemplate({
            title: "Nova solicitacao de contato",
            intro: "Uma nova solicitacao de contato foi recebida com os seguintes dados:",
            details: [
                { label: "Nome", value: this.data.name || "-" },
                { label: "Cargo", value: this.data.position || "-" },
                { label: "Empresa", value: this.data.company || "-" },
                { label: "Email", value: this.data.email || "-" },
                { label: "Telefone", value: this.data.phone || "-" },
                { label: "Mensagem", value: this.data.message || "-" },
                { label: "Solicitado em", value: new Date().toLocaleString("pt-BR") },
            ],
            footerMessage: "Mensagem enviada pelo formulario de contato da plataforma.",
        }).text;
    }

    protected getHtmlContent(): string | undefined {
        return createEmailTemplate({
            title: "Nova solicitacao de contato",
            intro: "Uma nova solicitacao de contato foi recebida com os seguintes dados:",
            details: [
                { label: "Nome", value: this.data.name || "-" },
                { label: "Cargo", value: this.data.position || "-" },
                { label: "Empresa", value: this.data.company || "-" },
                { label: "Email", value: this.data.email || "-" },
                { label: "Telefone", value: this.data.phone || "-" },
                { label: "Mensagem", value: this.data.message || "-" },
                { label: "Solicitado em", value: new Date().toLocaleString("pt-BR") },
            ],
            footerMessage: "Mensagem enviada pelo formulario de contato da plataforma.",
        }).html;
    }
}
