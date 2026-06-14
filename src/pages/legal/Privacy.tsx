import { COMPANY } from "@/lib/constants";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalLayout, LegalSection } from "./LegalLayout";

export default function PrivacyPage() {
  usePageTitle("Política de Privacidade");
  return (
    <LegalLayout title="Política de Privacidade" updatedAt="31/05/2026">
      <p>
        Esta Política de Privacidade descreve como a <strong>{COMPANY.name}</strong> ({COMPANY.city}) coleta,
        utiliza, armazena e protege os dados pessoais dos usuários da plataforma de locação do equipamento{" "}
        {COMPANY.equipment}, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>
      <p className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold-foreground">
        ⚠️ Modelo inicial. Recomendamos a revisão por um(a) advogado(a) antes da publicação definitiva, para
        adequar às práticas reais da empresa.
      </p>

      <LegalSection title="1. Controlador dos dados">
        <p>
          O controlador dos dados é a {COMPANY.name}, sediada em {COMPANY.city}. Para exercer seus direitos ou
          tirar dúvidas sobre privacidade, contate: <strong>{COMPANY.email}</strong> · {COMPANY.phone}.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Dados de cadastro:</strong> nome completo, CPF, CRM, especialidade, clínica/consultório, e-mail e telefone.</li>
          <li><strong>Dados das reservas:</strong> datas, períodos, equipamento, endereço de atendimento, procedimentos informados e observações.</li>
          <li><strong>Dados de uso:</strong> informações técnicas necessárias ao funcionamento (sessão de login, preferências como tema).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos seus dados">
        <ul className="list-disc space-y-1 pl-5">
          <li>Criar e gerenciar sua conta e autenticação.</li>
          <li>Processar, confirmar e acompanhar reservas e a logística de entrega/retirada.</li>
          <li>Calcular distâncias e valores, emitir comprovantes e gerenciar o financeiro.</li>
          <li>Enviar comunicações sobre suas reservas (cadastro, aprovação, alterações, cancelamento).</li>
          <li>Cumprir obrigações legais, contratuais e fiscais.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Bases legais">
        <p>
          Tratamos dados com base na <strong>execução de contrato</strong> (locação), no <strong>cumprimento de
          obrigação legal</strong>, no <strong>legítimo interesse</strong> (segurança e melhoria do serviço) e,
          quando aplicável, no <strong>consentimento</strong>.
        </p>
      </LegalSection>

      <LegalSection title="5. Compartilhamento e operadores">
        <p>Compartilhamos dados apenas com prestadores necessários à operação, na qualidade de operadores:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Supabase</strong> — hospedagem do banco de dados e autenticação.</li>
          <li><strong>Provedores de geolocalização</strong> (OpenStreetMap/Google) — cálculo de distância e rotas.</li>
          <li><strong>Asaas</strong> — processamento de pagamentos, quando habilitado.</li>
          <li><strong>Provedor de e-mail</strong> — envio de notificações transacionais.</li>
        </ul>
        <p>Não vendemos seus dados pessoais a terceiros.</p>
      </LegalSection>

      <LegalSection title="6. Armazenamento e segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo controle de acesso por
          perfil, segregação de dados por usuário (Row Level Security), criptografia em trânsito e registro de
          auditoria de alterações. Os dados são mantidos pelo tempo necessário às finalidades e às obrigações legais.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos (LGPD)">
        <p>Você pode, a qualquer momento, solicitar:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Confirmação da existência de tratamento e acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade e informação sobre compartilhamentos;</li>
          <li>Revogação do consentimento.</li>
        </ul>
        <p>Para exercer seus direitos, escreva para <strong>{COMPANY.email}</strong>.</p>
      </LegalSection>

      <LegalSection title="8. Cookies e armazenamento local">
        <p>
          Utilizamos armazenamento local do navegador para manter sua sessão e preferências (como o tema claro/escuro).
          No modo demonstração, os dados ficam apenas no seu navegador.
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações nesta política">
        <p>
          Podemos atualizar esta política periodicamente. A data de "última atualização" no topo indica a versão vigente.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
