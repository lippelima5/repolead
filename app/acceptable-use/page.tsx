import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

const EFFECTIVE_DATE = "22/02/2026";

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout title="Politica de Uso Aceitavel (AUP) - RepoLead" effectiveDate={EFFECTIVE_DATE}>
      <p>
        Esta Politica de Uso Aceitavel define condutas proibidas e limites de uso para proteger a plataforma,
        os clientes e titulares de dados.
      </p>

      <section>
        <h2 className="text-lg font-semibold">1. Abusos tecnicos proibidos</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Burlar autenticacao, autorizacao, rate limits ou qualquer controle de seguranca.</li>
          <li>Explorar vulnerabilidades, fazer varredura de portas ou pentest sem autorizacao formal.</li>
          <li>Introduzir malware, scripts maliciosos, payloads nocivos ou codigo para degradar o servico.</li>
          <li>Executar flood, DDoS, scraping agressivo ou trafego artificial para causar indisponibilidade.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">2. Uso ilegal ou nocivo</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Violar leis aplicaveis de privacidade, telecom, anti-spam, consumo e protecao de dados.</li>
          <li>Enviar dados sem base legal adequada ou sem autorizacoes necessarias.</li>
          <li>Promover fraude, phishing, engenharia social, golpes ou falsidade ideologica.</li>
          <li>Usar o RepoLead para atividade criminosa, discriminatoria ou abusiva.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">3. Spam e outreach abusivo</h2>
        <p className="mt-2">
          O RepoLead e infraestrutura de Lead Ops e nao uma maquina de spam. E proibido usar a plataforma para campanhas
          que violem regras anti-spam, termos de provedores de envio ou gerem padrao recorrente de abuso.
        </p>
        <ul className="list-disc pl-5">
          <li>Proibido gerar leads falsos, inflar eventos ou manipular metricas.</li>
          <li>Proibido envio em massa sem base legal, sem opt-out aplicavel ou sem legitimidade da origem.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">4. Dados sensiveis e alto risco</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Proibido enviar dados sensiveis sem necessidade estrita e sem base legal valida.</li>
          <li>Proibido usar dados para segmentacao discriminatoria ilegal ou praticas abusivas.</li>
          <li>Proibido tratar dados de criancas/adolescentes sem os requisitos legais aplicaveis.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">5. Direitos de terceiros</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Proibido enviar conteudo que viole direitos autorais, segredos de negocio ou confidencialidade.</li>
          <li>Proibido usar dados de terceiros sem permissao ou fundamento juridico valido.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">6. Uso justo e limites operacionais</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Podemos aplicar limites de requisicao, retencao, entrega e concorrencia para estabilidade da plataforma.</li>
          <li>Proibido contornar limites com multiplas contas/workspaces, proxies ou distribuicao artificial de carga.</li>
          <li>Testes de carga so podem ser executados com autorizacao previa e escrita do RepoLead.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">7. Monitoramento e resposta</h2>
        <p className="mt-2">
          Podemos monitorar sinais tecnicos de abuso, preservar logs de seguranca e tomar medidas para mitigar risco
          operacional, proteger usuarios e cumprir obrigacoes legais.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">8. Consequencias por violacao</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Aplicacao de rate limit mais restritivo ou bloqueio temporario de rotas/chaves.</li>
          <li>Suspensao temporaria da conta ou workspace.</li>
          <li>Encerramento definitivo de conta/workspace em caso grave ou reincidente.</li>
          <li>Preservacao de evidencias para investigacao e atendimento de exigencias legais.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">9. Denuncias e contato</h2>
        <p className="mt-2">
          Para reportar abuso, incidente ou suspeita de uso indevido: <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Documentos relacionados: <Link className="underline underline-offset-4" href="/terms">Termos de Servico</Link>{" "}
        e <Link className="underline underline-offset-4" href="/privacy">Politica de Privacidade</Link>.
      </p>
    </LegalPageLayout>
  );
}
