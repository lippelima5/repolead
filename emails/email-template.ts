type EmailTemplateAction = {
  label: string;
  url: string;
};

type EmailTemplateDetail = {
  label: string;
  value: string;
};

type EmailTemplateOptions = {
  title: string;
  greeting?: string;
  intro: string;
  details?: EmailTemplateDetail[];
  action?: EmailTemplateAction;
  footerMessage?: string;
  fallbackLabel?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDetailsText(details: EmailTemplateDetail[]) {
  return details.map((item) => `- ${item.label}: ${item.value}`).join("\n");
}

function formatDetailsHtml(details: EmailTemplateDetail[]) {
  return details
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 140px; vertical-align: top;">${escapeHtml(item.label)}</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 14px; vertical-align: top;">${escapeHtml(item.value)}</td>
        </tr>
      `,
    )
    .join("");
}

export function createEmailTemplate(options: EmailTemplateOptions) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "LeadVault";
  const year = new Date().getFullYear();
  const details = options.details ?? [];
  const hasDetails = details.length > 0;
  const brandPrimary = "#6366f1";
  const bg = "#f8fafc";
  const surface = "#ffffff";
  const border = "#e2e8f0";
  const textPrimary = "#0f172a";
  const textMuted = "#64748b";
  const fallbackLabel =
    options.fallbackLabel || "Se o botao nao funcionar, copie e cole este link no navegador:";

  const textSections: string[] = [options.title, ""];
  if (options.greeting) {
    textSections.push(options.greeting, "");
  }
  textSections.push(options.intro, "");
  if (hasDetails) {
    textSections.push(formatDetailsText(details), "");
  }
  if (options.action) {
    textSections.push(`${options.action.label}: ${options.action.url}`, "");
  }
  if (options.footerMessage) {
    textSections.push(options.footerMessage, "");
  }
  textSections.push(`${appName} - ${year}`);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(options.title)}</title>
      </head>
      <body style="margin: 0; padding: 24px; background: ${bg}; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <main style="max-width: 600px; margin: 0 auto; background: ${surface}; border: 1px solid ${border}; border-radius: 14px; overflow: hidden;">
          <div style="padding: 24px; border-bottom: 1px solid ${border}; background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);">
            <p style="margin: 0; color: ${textMuted}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(appName)}</p>
            <h1 style="margin: 12px 0 0; color: ${textPrimary}; font-size: 22px; line-height: 1.3;">${escapeHtml(options.title)}</h1>
          </div>

          <div style="padding: 24px;">
            ${options.greeting ? `<p style="margin: 0 0 14px; color: ${textPrimary}; font-size: 15px;">${escapeHtml(options.greeting)}</p>` : ""}
            <p style="margin: 0 0 18px; color: ${textPrimary}; font-size: 15px; line-height: 1.7;">${escapeHtml(options.intro)}</p>

            ${
              hasDetails
                ? `<table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
                    ${formatDetailsHtml(details)}
                  </table>`
                : ""
            }

            ${
              options.action
                ? `<div style="margin: 0 0 20px;">
                    <a href="${escapeHtml(options.action.url)}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: ${brandPrimary}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      ${escapeHtml(options.action.label)}
                    </a>
                  </div>
                  <p style="margin: 0 0 20px; color: ${textMuted}; font-size: 12px; line-height: 1.6; word-break: break-all;">
                    ${escapeHtml(fallbackLabel)} <a href="${escapeHtml(options.action.url)}" style="color: ${brandPrimary};">${escapeHtml(options.action.url)}</a>
                  </p>`
                : ""
            }

            ${
              options.footerMessage
                ? `<p style="margin: 0; color: ${textMuted}; font-size: 13px; line-height: 1.7;">${escapeHtml(options.footerMessage)}</p>`
                : ""
            }
          </div>
        </main>
        <p style="margin: 16px 0 0; text-align: center; color: #94a3b8; font-size: 12px;">&copy; ${year} ${escapeHtml(appName)}. Todos os direitos reservados.</p>
      </body>
    </html>
  `;

  return {
    html,
    text: textSections.join("\n"),
  };
}

