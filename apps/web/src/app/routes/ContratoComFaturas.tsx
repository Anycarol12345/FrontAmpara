import { ContratoPainelPage } from '@/features/contratos';
import { FaturasDoContratoPainel } from '@/features/financeiro';

/** Detalhe do contrato com as faturas dele: junta as features contratos e financeiro (só o app/ conhece as duas). */
export function ContratoComFaturas() {
  return (
    <ContratoPainelPage
      faturas={(idContrato) => <FaturasDoContratoPainel idContrato={idContrato} />}
    />
  );
}
