import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

const EFFECTIVE_DATE = "22/02/2026";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Termos de Serviço - RepoLead" effectiveDate={EFFECTIVE_DATE}>
      <p>
        Estes Termos regem o uso do RepoLead (site, app e APIs) por você, empresa ou pessoa que cria conta e opera
        workspace na plataforma.
      </p>

      <section>
        <h2 className="text-lg font-semibold">1. Partes e contato</h2>
        <p className="mt-2">
          Fornecedor: Markware LTDA, CNPJ 48.149.506/0001-93, Avenida Nove de Julho 5966, Jardim Paulista,
          São Paulo/SP, CEP 01406-902.
        </p>
        <p>
          Contato operacional e juridico: <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">2. Definicoes</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Workspace: ambiente isolado do Cliente dentro do RepoLead.</li>
          <li>Source: origem que envia eventos/leads para ingestão.</li>
          <li>Destination: destino configurado para receber eventos/leads processados.</li>
          <li>Evento/Lead: payload recebido e seus registros derivados (normalização, dedupe, timeline, entregas).</li>
          <li>DLQ: fila de itens em falha após tentativas de entrega.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">3. Escopo do serviço</h2>
        <p className="mt-2">
          O RepoLead oferece camada de captura, processamento, dedupe/merge, histórico de eventos e distribuição para
          destinos com retries e estado de dead-letter. Recursos e limites podem evoluir ao longo do tempo.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">4. Beta aberto</h2>
        <h3 className="mt-3 font-semibold">4.1 Natureza beta</h3>
        <p className="mt-1">
          Durante o Beta Aberto, o serviço e experimental e pode ter falhas, instabilidades, mudanças de comportamento e
          interrupcoes.
        </p>

        <h3 className="mt-3 font-semibold">4.2 AS IS / AS AVAILABLE</h3>
        <p className="mt-1">
          O Beta e fornecido no estado em que se encontra e conforme disponível, sem garantias de continuidade,
          disponibilidade mínima, compatibilidade futura ou ausência de erros.
        </p>

        <h3 className="mt-3 font-semibold">4.3 Sem SLA no beta</h3>
        <p className="mt-1">
          Não ha SLA contratual durante o beta. Podem ocorrer atrasos, perdas, duplicidades, falhas de entrega,
          reprocessamentos incompletos e indisponibilidade.
        </p>

        <h3 className="mt-3 font-semibold">4.4 Backup do Cliente</h3>
        <p className="mt-1">
          O Cliente deve manter fonte de verdade e backup próprio dos dados. O RepoLead não substitui, por si só, o
          sistema principal de registro do Cliente durante o beta.
        </p>

        <h3 className="mt-3 font-semibold">4.5 Duracao</h3>
        <p className="mt-1">
          A estimativa operacional de beta e de 1 a 6 meses, podendo ser ajustada, estendida ou encerrada a critério do
          RepoLead.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">5. Cadastro, conta e acesso</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Você deve fornecer dados corretos e manter credenciais protegidas.</li>
          <li>Você responde por ações executadas com sua conta e chaves emitidas no workspace.</li>
          <li>Podemos suspender acesso em caso de abuso, risco de segurança ou violação destes Termos/AUP.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">6. Uso justo e limites operacionais</h2>
        <h3 className="mt-3 font-semibold">6.1 Fair use</h3>
        <p className="mt-1">
          Mesmo com recursos liberados no beta, aplicamos uso justo para proteger estabilidade e os demais clientes.
        </p>

        <h3 className="mt-3 font-semibold">6.2 Limites dinamicos</h3>
        <p className="mt-1">Podemos aplicar ou ajustar sem aviso prévio:</p>
        <ul className="list-disc pl-5">
          <li>Rate limits de ingestão e leitura.</li>
          <li>Limites de payload, tentativas de retry, concorrencia e janela de processamento.</li>
          <li>Limites de armazenamento, retenção, DLQ e exportação.</li>
          <li>Quantidade de sources, destinations e chaves ativas.</li>
        </ul>

        <h3 className="mt-3 font-semibold">6.3 Proibicao de contorno</h3>
        <p className="mt-1">
          E proibido burlar limites com contas duplicadas, distribuição artificial de carga, proxies de contorno ou
          testes de estresse não autorizados.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">7. Dados do Cliente e privacidade</h2>
        <h3 className="mt-3 font-semibold">7.1 Titularidade e responsabilidade</h3>
        <p className="mt-1">
          O Cliente mantem titularidade sobre os dados enviados e deve garantir base legal para coleta e envio ao
          RepoLead.
        </p>

        <h3 className="mt-3 font-semibold">7.2 Papel de processadora</h3>
        <p className="mt-1">
          Para dados de leads enviados pelo Cliente, o RepoLead atua como operadora/processadora, seguindo instrucoes do
          controlador do workspace.
        </p>

        <h3 className="mt-3 font-semibold">7.3 Retenção e exportação</h3>
        <p className="mt-1">
          A retenção padrão e configuravel por workspace. A exportação pode ocorrer manualmente pela interface, via API
          de leitura e por fluxo de entrega via webhook/destination configurado.
        </p>

        <h3 className="mt-3 font-semibold">7.4 Conteúdo proibido</h3>
        <p className="mt-1">
          Não envie dados sensíveis sem necessidade estrita e base legal adequada. E proibido uso ilegal,
          discriminatorio, fraudulento ou invasivo.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">8. Integrações e terceiros</h2>
        <p className="mt-2">
          Integrações externas (webhooks, CRMs, automações e serviços de terceiros) podem falhar, mudar API ou ficar
          indisponiveis. O RepoLead não responde por indisponibilidade ou perdas causadas por terceiros fora do seu
          controle direto.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">9. Propriedade intelectual e feedback</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Software, marca, documentação e design do RepoLead pertencem a Markware LTDA.</li>
          <li>Você recebe licenca limitada, não exclusiva e revogavel para uso do serviço durante a vigência.</li>
          <li>Feedback enviado pode ser utilizado pelo RepoLead sem obrigação de remuneracao, salvo acordo escrito.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">10. Suspensao e encerramento</h2>
        <p className="mt-2">Podemos suspender ou encerrar conta/workspace por:</p>
        <ul className="list-disc pl-5">
          <li>Violação dos Termos ou da Política de Uso Aceitável.</li>
          <li>Risco de segurança, abuso de infraestrutura ou tentativa de fraude.</li>
          <li>Obrigação legal, ordem válida de autoridade ou risco regulatorio relevante.</li>
        </ul>
        <p className="mt-2">
          O Cliente pode encerrar o uso a qualquer momento. Recursos de exportação permanecem sujeitos ao estado
          operacional da plataforma, especialmente durante o beta.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">11. Planos, precificacao e mudanças pos-beta</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Podemos introduzir planos pagos, quotas, limites, aditivos e descontinuacao de recursos.</li>
          <li>Quando viável, daremos aviso prévio razoável de 14 dias para mudanças materiais que afetem contas beta.</li>
          <li>Poderemos oferecer meios razoáveis de exportação na transição, conforme recursos disponíveis.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">12. Isencao de garantias</h2>
        <p className="mt-2">
          Na máxima extensao permitida por lei, o serviço e fornecido sem garantias expressas ou implicitas,
          incluindo comercialização, adequacao a propósito específico e não violação.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">13. Limitacao de responsabilidade</h2>
        <h3 className="mt-3 font-semibold">13.1 Danos indiretos</h3>
        <p className="mt-1">
          Não nos responsabilizamos por lucros cessantes, perda de receita, perda de oportunidade, danos indiretos,
          consequenciais, punitivos ou perda de dados, especialmente durante o beta.
        </p>

        <h3 className="mt-3 font-semibold">13.2 Teto de responsabilidade</h3>
        <p className="mt-1">
          Na máxima extensao permitida por lei, a responsabilidade total do RepoLead fica limitada ao maior valor entre:
          (a) total pago pelo Cliente nos 3 meses anteriores ao evento; ou (b) R$ 100,00 quando não houver cobrança no
          beta; sem prejuizo de mínimo obrigatório legal quando aplicável.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">14. Indenizacao</h2>
        <p className="mt-2">O Cliente concorda em indenizar o RepoLead por reclamacoes de terceiros decorrentes de:</p>
        <ul className="list-disc pl-5">
          <li>Dados enviados sem base legal adequada.</li>
          <li>Instrucao de tratamento que viole privacidade, direitos de terceiros ou lei aplicável.</li>
          <li>Uso da plataforma em desacordo com estes Termos ou com a Política de Uso Aceitável.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">15. Lei aplicável e foro</h2>
        <p className="mt-2">
          Estes Termos são regidos pelas leis da Republica Federativa do Brasil. Fica eleito o foro da Comarca de
          São Paulo/SP, salvo competencia obrigatoria diversa prevista em lei.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">16. Contato</h2>
        <p className="mt-2">
          E-mail: <a className="underline underline-offset-4" href="mailto:contato@repoleads.com">contato@repoleads.com</a>
        </p>
        <p>Endereco: Avenida Nove de Julho 5966, Jardim Paulista, São Paulo/SP, 01406-902.</p>
      </section>

      <p className="text-xs text-muted-foreground">
        Documentos relacionados: <Link className="underline underline-offset-4" href="/privacy">Política de Privacidade</Link>{" "}
        e <Link className="underline underline-offset-4" href="/acceptable-use">Política de Uso Aceitável</Link>.
      </p>
    </LegalPageLayout>
  );
}
