import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

const EFFECTIVE_DATE = "22/02/2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de Privacidade - RepoLead" effectiveDate={EFFECTIVE_DATE}>
      <p>
        Esta Política de Privacidade descreve como o RepoLead trata dados pessoais no site, aplicação web e APIs.
        Também explica direitos dos titulares e como solicitações são tratadas.
      </p>

      <section>
        <h2 className="text-lg font-semibold">1. Identificacao da controladora e contato</h2>
        <p className="mt-2">
          Markware LTDA, CNPJ 48.149.506/0001-93, Avenida Nove de Julho 5966, Jardim Paulista, São Paulo/SP,
          CEP 01406-902.
        </p>
        <p>
          Contato de privacidade: <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">2. Papéis de tratamento (LGPD/GDPR)</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Controladora para dados de conta, autenticação, cobrança, suporte e operação da própria plataforma.</li>
          <li>Operadora/Processadora para dados de leads e eventos enviados por cada workspace cliente.</li>
        </ul>
        <p className="mt-2">
          Em cenario B2B, o Cliente do workspace normalmente define finalidade, base legal e transparencia para os
          titulares dos dados capturados.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">3. Quais dados tratamos</h2>

        <h3 className="mt-3 font-semibold">3.1 Dados de conta (escopo de controladora)</h3>
        <ul className="list-disc pl-5">
          <li>Nome, email, hash de senha, vinculação a workspace e papéis de acesso.</li>
          <li>Tokens e artefatos técnicos de autenticação e recuperacao de acesso (sempre em formato protegido no banco).</li>
          <li>Dados administrativos de plano/cobrança quando aplicável (ex.: referências Stripe e status de assinatura).</li>
          <li>Mensagens de suporte e feedback enviados pela plataforma.</li>
        </ul>

        <h3 className="mt-3 font-semibold">3.2 Dados enviados para o RepoLead (escopo de operadora/processadora)</h3>
        <ul className="list-disc pl-5">
          <li>Campos de lead e identidade enviados por source/API/webhook (ex.: nome, email, telefone, tags, external_id).</li>
          <li>Payload bruto sanitizado, cabeçalhos sanitizados, eventos de timeline e histórico de entrega.</li>
          <li>Resultados de destino, retries, status de falha e dead-letter para observabilidade operacional.</li>
        </ul>

        <h3 className="mt-3 font-semibold">3.3 Dados técnicos e segurança</h3>
        <ul className="list-disc pl-5">
          <li>Metadados de requisição para segurança e rate limit (ex.: IP quando presente no request, timestamp e contexto técnico).</li>
          <li>Logs operacionais para monitoramento, investigação de incidentes e prevenção de abuso.</li>
          <li>Cookies e armazenamento local para sessão, idioma, tema e preferências de uso.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">4. Finalidades do tratamento</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Operar captura de leads, dedupe/merge, timeline, distribuição para destinos e mecanismos de retry/DLQ.</li>
          <li>Autenticar usuários, controlar autorização por workspace e proteger a plataforma.</li>
          <li>Executar operação de suporte, comunicações operacionais e administração de conta/plano.</li>
          <li>Detectar uso abusivo, melhorar confiabilidade e solucionar incidentes técnicos.</li>
          <li>Cumprir obrigações legais e responder a ordens válidas de autoridades competentes.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">5. Bases legais (resumo pratico)</h2>
        <p className="mt-2">A base legal depende do contexto e da jurisdicao. Podem ser utilizadas:</p>
        <ul className="list-disc pl-5">
          <li>Execucao de contrato (prestacao da plataforma e suporte operacional).</li>
          <li>Legítimo interesse (segurança, prevenção a abuso e melhoria de estabilidade).</li>
          <li>Consentimento, quando exigido para a finalidade específica.</li>
          <li>Cumprimento de obrigação legal/regulatoria.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">6. Compartilhamento de dados</h2>
        <p className="mt-2">Podemos compartilhar dados com:</p>
        <ul className="list-disc pl-5">
          <li>Provedores de infraestrutura, banco de dados, email transacional e monitoramento operacional.</li>
          <li>Stripe, quando ha uso de recursos de cobrança e assinatura.</li>
          <li>Destinations e webhooks configurados pelo próprio Cliente no workspace.</li>
          <li>Autoridades públicas, quando houver obrigação legal ou ordem válida.</li>
        </ul>
        <p className="mt-2">
          Lista de subprocessadores: disponível sob solicitacao em{" "}
          <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">7. Transferencias internacionais</h2>
        <p className="mt-2">
          A depender da infraestrutura contratada e dos fornecedores utilizados, dados podem ser tratados fora do Brasil.
          Quando isso ocorrer, adotamos salvaguardas contratuais e medidas aplicáveis para protecao adequada.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">8. Segurança da informação</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Controle de acesso por autenticação e autorização por workspace.</li>
          <li>Hash de senha, tokens assinados e separação logica por tenant.</li>
          <li>Validação de payloads, rate limiting e bloqueios de URL de destino insegura.</li>
          <li>Registros técnicos para auditoria operacional, troubleshooting e resposta a incidentes.</li>
        </ul>
        <p className="mt-2">
          Nenhum sistema e totalmente infalivel. Em incidente relevante envolvendo dados pessoais sob nossa
          responsabilidade, adotamos medidas de contenção e comunicação conforme a lei aplicável.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">9. Retenção e descarte</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Dados de conta: mantidos enquanto a conta estiver ativa e pelo período necessário para obrigações legais.</li>
          <li>
            Dados de leads/eventos: retenção padrão configuravel por workspace (campo de retenção do workspace) e
            políticas definidas pelo Cliente.
          </li>
          <li>
            Exportação e portabilidade operacional: manual pela UI (CSV e link por email), via API de leitura e via
            entrega configurada para webhooks/destinations.
          </li>
          <li>Backups e janelas de segurança podem gerar retenção residual temporária antes da eliminação definitiva.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">10. Direitos dos titulares</h2>
        <p className="mt-2">
          Quando aplicável, titulares podem solicitar confirmação de tratamento, acesso, correção, anonimização,
          eliminação, portabilidade, informações de compartilhamento e revogação de consentimento.
        </p>
        <p>
          Em cenarios em que o RepoLead atua como operadora/processadora, poderemos direcionar a solicitacao ao Cliente
          controlador do workspace responsavel pela coleta e finalidade do dado.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">11. Crianças e dados sensíveis</h2>
        <p className="mt-2">
          O RepoLead não e destinado ao tratamento de dados de crianças/adolescentes como atividade principal. O envio
          de dados pessoais sensíveis deve ocorrer somente quando estritamente necessário e com base legal válida.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">12. Mudanças nesta política</h2>
        <p className="mt-2">
          Esta Política pode ser atualizada. Mudanças materiais serao comunicadas por meios razoáveis, como aviso no app
          e/ou email cadastrado.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Referências</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>
            <a
              className="underline underline-offset-4"
              href="https://www.gov.br/anpd/pt-br/centrais-de-conteúdo/materiais-educativos-e-publicacoes/2021.05.27GuiaAgentesdeTratamento_Final.pdf"
              target="_blank"
              rel="noreferrer"
            >
              ANPD - Guia orientativo para definicoes dos agentes de tratamento
            </a>
          </li>
          <li>
            <a className="underline underline-offset-4" href="https://gdpr-info.eu/art-6-gdpr/" target="_blank" rel="noreferrer">
              GDPR Art. 6 - Lawfulness of processing
            </a>
          </li>
          <li>
            <a className="underline underline-offset-4" href="https://gdpr-info.eu/art-28-gdpr/" target="_blank" rel="noreferrer">
              GDPR Art. 28 - Processor obligations
            </a>
          </li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Documentos relacionados: <Link className="underline underline-offset-4" href="/terms">Termos de Serviço</Link>{" "}
        e <Link className="underline underline-offset-4" href="/acceptable-use">Política de Uso Aceitável</Link>.
      </p>
    </LegalPageLayout>
  );
}
