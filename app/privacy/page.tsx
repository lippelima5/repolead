import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

const EFFECTIVE_DATE = "22/02/2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Politica de Privacidade - RepoLead" effectiveDate={EFFECTIVE_DATE}>
      <p>
        Esta Politica de Privacidade descreve como o RepoLead trata dados pessoais no site, aplicacao web e APIs.
        Tambem explica direitos dos titulares e como solicitacoes sao tratadas.
      </p>

      <section>
        <h2 className="text-lg font-semibold">1. Identificacao da controladora e contato</h2>
        <p className="mt-2">
          Markware LTDA, CNPJ 48.149.506/0001-93, Avenida Nove de Julho 5966, Jardim Paulista, Sao Paulo/SP,
          CEP 01406-902.
        </p>
        <p>
          Contato de privacidade: <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">2. Papeis de tratamento (LGPD/GDPR)</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Controladora para dados de conta, autenticacao, cobranca, suporte e operacao da propria plataforma.</li>
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
          <li>Nome, email, hash de senha, vinculacao a workspace e papeis de acesso.</li>
          <li>Tokens e artefatos tecnicos de autenticacao e recuperacao de acesso (sempre em formato protegido no banco).</li>
          <li>Dados administrativos de plano/cobranca quando aplicavel (ex.: referencias Stripe e status de assinatura).</li>
          <li>Mensagens de suporte e feedback enviados pela plataforma.</li>
        </ul>

        <h3 className="mt-3 font-semibold">3.2 Dados enviados para o RepoLead (escopo de operadora/processadora)</h3>
        <ul className="list-disc pl-5">
          <li>Campos de lead e identidade enviados por source/API/webhook (ex.: nome, email, telefone, tags, external_id).</li>
          <li>Payload bruto sanitizado, cabecalhos sanitizados, eventos de timeline e historico de entrega.</li>
          <li>Resultados de destino, retries, status de falha e dead-letter para observabilidade operacional.</li>
        </ul>

        <h3 className="mt-3 font-semibold">3.3 Dados tecnicos e seguranca</h3>
        <ul className="list-disc pl-5">
          <li>Metadados de requisicao para seguranca e rate limit (ex.: IP quando presente no request, timestamp e contexto tecnico).</li>
          <li>Logs operacionais para monitoramento, investigacao de incidentes e prevencao de abuso.</li>
          <li>Cookies e armazenamento local para sessao, idioma, tema e preferencias de uso.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">4. Finalidades do tratamento</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Operar captura de leads, dedupe/merge, timeline, distribuicao para destinos e mecanismos de retry/DLQ.</li>
          <li>Autenticar usuarios, controlar autorizacao por workspace e proteger a plataforma.</li>
          <li>Executar operacao de suporte, comunicacoes operacionais e administracao de conta/plano.</li>
          <li>Detectar uso abusivo, melhorar confiabilidade e solucionar incidentes tecnicos.</li>
          <li>Cumprir obrigacoes legais e responder a ordens validas de autoridades competentes.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">5. Bases legais (resumo pratico)</h2>
        <p className="mt-2">A base legal depende do contexto e da jurisdicao. Podem ser utilizadas:</p>
        <ul className="list-disc pl-5">
          <li>Execucao de contrato (prestacao da plataforma e suporte operacional).</li>
          <li>Legitimo interesse (seguranca, prevencao a abuso e melhoria de estabilidade).</li>
          <li>Consentimento, quando exigido para a finalidade especifica.</li>
          <li>Cumprimento de obrigacao legal/regulatoria.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">6. Compartilhamento de dados</h2>
        <p className="mt-2">Podemos compartilhar dados com:</p>
        <ul className="list-disc pl-5">
          <li>Provedores de infraestrutura, banco de dados, email transacional e monitoramento operacional.</li>
          <li>Stripe, quando ha uso de recursos de cobranca e assinatura.</li>
          <li>Destinations e webhooks configurados pelo proprio Cliente no workspace.</li>
          <li>Autoridades publicas, quando houver obrigacao legal ou ordem valida.</li>
        </ul>
        <p className="mt-2">
          Lista de subprocessadores: disponivel sob solicitacao em{" "}
          <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">7. Transferencias internacionais</h2>
        <p className="mt-2">
          A depender da infraestrutura contratada e dos fornecedores utilizados, dados podem ser tratados fora do Brasil.
          Quando isso ocorrer, adotamos salvaguardas contratuais e medidas aplicaveis para protecao adequada.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">8. Seguranca da informacao</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Controle de acesso por autenticacao e autorizacao por workspace.</li>
          <li>Hash de senha, tokens assinados e separacao logica por tenant.</li>
          <li>Validacao de payloads, rate limiting e bloqueios de URL de destino insegura.</li>
          <li>Registros tecnicos para auditoria operacional, troubleshooting e resposta a incidentes.</li>
        </ul>
        <p className="mt-2">
          Nenhum sistema e totalmente infalivel. Em incidente relevante envolvendo dados pessoais sob nossa
          responsabilidade, adotamos medidas de contencao e comunicacao conforme a lei aplicavel.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">9. Retencao e descarte</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Dados de conta: mantidos enquanto a conta estiver ativa e pelo periodo necessario para obrigacoes legais.</li>
          <li>
            Dados de leads/eventos: retencao padrao configuravel por workspace (campo de retencao do workspace) e
            politicas definidas pelo Cliente.
          </li>
          <li>
            Exportacao e portabilidade operacional: manual pela UI (CSV e link por email), via API de leitura e via
            entrega configurada para webhooks/destinations.
          </li>
          <li>Backups e janelas de seguranca podem gerar retencao residual temporaria antes da eliminacao definitiva.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">10. Direitos dos titulares</h2>
        <p className="mt-2">
          Quando aplicavel, titulares podem solicitar confirmacao de tratamento, acesso, correcao, anonimizacao,
          eliminacao, portabilidade, informacoes de compartilhamento e revogacao de consentimento.
        </p>
        <p>
          Em cenarios em que o RepoLead atua como operadora/processadora, poderemos direcionar a solicitacao ao Cliente
          controlador do workspace responsavel pela coleta e finalidade do dado.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">11. Criancas e dados sensiveis</h2>
        <p className="mt-2">
          O RepoLead nao e destinado ao tratamento de dados de criancas/adolescentes como atividade principal. O envio
          de dados pessoais sensiveis deve ocorrer somente quando estritamente necessario e com base legal valida.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">12. Mudancas nesta politica</h2>
        <p className="mt-2">
          Esta Politica pode ser atualizada. Mudancas materiais serao comunicadas por meios razoaveis, como aviso no app
          e/ou email cadastrado.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Referencias</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>
            <a
              className="underline underline-offset-4"
              href="https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/2021.05.27GuiaAgentesdeTratamento_Final.pdf"
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
        Documentos relacionados: <Link className="underline underline-offset-4" href="/terms">Termos de Servico</Link>{" "}
        e <Link className="underline underline-offset-4" href="/acceptable-use">Politica de Uso Aceitavel</Link>.
      </p>
    </LegalPageLayout>
  );
}
