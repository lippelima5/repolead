import logger from "@/lib/logger.server";
import Mail from "@/lib/mail";
import { createEmailTemplate } from "@/emails/email-template";

export default class SendReedemPassword extends Mail {
    private readonly name: string;
    private readonly url: string;

    constructor(
        name: string,
        url: string,
        receivers: string | string[],
    ) {
        super(receivers);

        this.name = name;
        this.url = url;
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
            title: "Redefinicao de senha",
            greeting: `Ola, ${this.name || "usuario"}`,
            intro:
                "Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para continuar. Se voce nao solicitou essa alteracao, ignore este email.",
            action: {
                label: "Redefinir senha",
                url: this.url,
            },
            footerMessage: "Equipe de suporte",
        }).text;
    }

    protected getHtmlContent(): string | undefined {
        return createEmailTemplate({
            title: "Redefinicao de senha",
            greeting: `Ola, ${this.name || "usuario"}`,
            intro:
                "Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para continuar. Se voce nao solicitou essa alteracao, ignore este email.",
            action: {
                label: "Redefinir senha",
                url: this.url,
            },
            footerMessage: "Equipe de suporte",
        }).html;
    }
}
