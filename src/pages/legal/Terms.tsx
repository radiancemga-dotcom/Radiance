import { Link } from "react-router-dom";
import { COMPANY } from "@/lib/constants";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalLayout, LegalSection } from "./LegalLayout";

export default function TermsPage() {
  usePageTitle("Termos de Uso");
  return (
    <LegalLayout title="Termos de Uso" updatedAt="31/05/2026">
      <p>
        Estes Termos de Uso regulam o acesso e a utilização da plataforma da <strong>{COMPANY.name}</strong>{" "}
        ({COMPANY.city}), destinada à locação do equipamento {COMPANY.equipment} para profissionais e clínicas.
        Ao criar uma conta ou realizar uma reserva, você declara concordar com estes termos.
      </p>
      <p className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold-foreground">
        ⚠️ Modelo inicial. Recomendamos a revisão por um(a) advogado(a) antes da publicação definitiva.
      </p>

      <LegalSection title="1. Cadastro e elegibilidade">
        <p>
          O uso é destinado a profissionais de saúde/estética habilitados e clínicas. Você é responsável pela
          veracidade dos dados informados (incluindo CPF e CRM) e pela guarda das suas credenciais de acesso.
        </p>
      </LegalSection>

      <LegalSection title="2. Reservas e disponibilidade">
        <ul className="list-disc space-y-1 pl-5">
          <li>As reservas podem ser por período (manhã/tarde) ou integral, conforme disponibilidade da agenda.</li>
          <li>Atendimentos acima do limite de distância de Maringá ocupam o dia inteiro por razões logísticas.</li>
          <li>Toda reserva fica sujeita à confirmação pela {COMPANY.name}.</li>
          <li>A entrega e a retirada do equipamento ocorrem no mesmo dia, no endereço informado.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Valores e pagamento">
        <p>
          Os valores são apresentados no momento da reserva, podendo incluir descontos (ex.: diária integral) e
          cupons válidos. Quando o pagamento online estiver habilitado, será processado por provedor terceiro
          (Asaas). Tributos e condições específicas podem ser ajustados conforme contrato.
        </p>
      </LegalSection>

      <LegalSection title="4. Cancelamento e reagendamento">
        <p>
          Reservas pendentes ou confirmadas podem ser canceladas ou reagendadas pela área do cliente, sujeito à
          disponibilidade e às condições comerciais vigentes.
        </p>
      </LegalSection>

      <LegalSection title="5. Uso do equipamento">
        <p>
          O equipamento deve ser operado por profissional habilitado, seguindo as orientações técnicas e as
          recomendações do fabricante. O cliente é responsável pela guarda e pelo uso adequado durante o período
          de locação, respondendo por danos decorrentes de uso indevido.
        </p>
      </LegalSection>

      <LegalSection title="6. Responsabilidades">
        <p>
          A {COMPANY.name} empenha-se em fornecer equipamentos revisados e suporte técnico. A responsabilidade
          clínica pelos procedimentos realizados é exclusiva do profissional/clínica contratante.
        </p>
      </LegalSection>

      <LegalSection title="7. Proteção de dados">
        <p>
          O tratamento de dados pessoais segue a nossa{" "}
          <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>, em
          conformidade com a LGPD.
        </p>
      </LegalSection>

      <LegalSection title="8. Alterações dos termos">
        <p>
          Estes termos podem ser atualizados a qualquer tempo. O uso continuado da plataforma após alterações
          implica concordância com a versão vigente.
        </p>
      </LegalSection>

      <LegalSection title="9. Contato">
        <p>
          Dúvidas sobre estes termos: <strong>{COMPANY.email}</strong> · {COMPANY.phone}.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
