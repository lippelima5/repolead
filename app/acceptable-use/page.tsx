import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

const EFFECTIVE_DATE = "22/02/2026";

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout title="Política de Uso Aceitável (AUP) - RepoLead" effectiveDate={EFFECTIVE_DATE}>
      <p>
        Esta Política de Uso Aceitável define condutas proibidas e limites de uso para proteger a plataforma,
        os clientes e titulares de dados.
      </p>

      <section>
        <h2 className="text-lg font-semibold">1. Abusos técnicos proibidos</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Burlar autenticação, autorização, rate limits ou qualquer controle de segurança.</li>
          <li>Explorar vulnerabilidades, fazer varredura de portas ou pentest sem autorização formal.</li>
          <li>Introduzir malware, scripts maliciosos, payloads nocivos ou codigo para degradar o serviço.</li>
          <li>Executar flood, DDoS, scraping agressivo ou trafego artificial para causar indisponibilidade.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">2. Uso ilegal ou nocivo</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Violar leis aplicáveis de privacidade, telecom, anti-spam, consumo e protecao de dados.</li>
          <li>Enviar dados sem base legal adequada ou sem autorizacoes necessárias.</li>
          <li>Promover fraude, phishing, engenharia social, golpes ou falsidade ideologica.</li>
          <li>Usar o RepoLead para atividade criminosa, discriminatoria ou abusiva.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">3. Spam e outreach abusivo</h2>
        <p className="mt-2">
          O RepoLead e infraestrutura de Lead Ops e não uma maquina de spam. E proibido usar a plataforma para campanhas
          que violem regras anti-spam, termos de provedores de envio ou gerem padrão recorrente de abuso.
        </p>
        <ul className="list-disc pl-5">
          <li>Proibido gerar leads falsos, inflar eventos ou manipular métricas.</li>
          <li>Proibido envio em massa sem base legal, sem opt-out aplicável ou sem legitimidade da origem.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">4. Dados sensíveis e alto risco</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Proibido enviar dados sensíveis sem necessidade estrita e sem base legal válida.</li>
          <li>Proibido usar dados para segmentacao discriminatoria ilegal ou praticas abusivas.</li>
          <li>Proibido tratar dados de crianças/adolescentes sem os requisitos legais aplicáveis.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">5. Direitos de terceiros</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Proibido enviar conteúdo que viole direitos autorais, segredos de negócio ou confidencialidade.</li>
          <li>Proibido usar dados de terceiros sem permissao ou fundamento juridico valido.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">6. Uso justo e limites operacionais</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Podemos aplicar limites de requisição, retenção, entrega e concorrencia para estabilidade da plataforma.</li>
          <li>Proibido contornar limites com multiplas contas/workspaces, proxies ou distribuição artificial de carga.</li>
          <li>Testes de carga só podem ser executados com autorização previa e escrita do RepoLead.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">7. Monitoramento e resposta</h2>
        <p className="mt-2">
          Podemos monitorar sinais técnicos de abuso, preservar logs de segurança e tomar medidas para mitigar risco
          operacional, proteger usuários e cumprir obrigações legais.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">8. Consequências por violação</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Aplicação de rate limit mais restritivo ou bloqueio temporário de rotas/chaves.</li>
          <li>Suspensao temporária da conta ou workspace.</li>
          <li>Encerramento definitivo de conta/workspace em caso grave ou reincidente.</li>
          <li>Preservação de evidências para investigação e atendimento de exigências legais.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">9. Denuncias e contato</h2>
        <p className="mt-2">
          Para reportar abuso, incidente ou suspeita de uso indevido: <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Documentos relacionados: <Link className="underline underline-offset-4" href="/terms">Termos de Serviço</Link>{" "}
        e <Link className="underline underline-offset-4" href="/privacy">Política de Privacidade</Link>.
      </p>
    </LegalPageLayout>
  );
}
