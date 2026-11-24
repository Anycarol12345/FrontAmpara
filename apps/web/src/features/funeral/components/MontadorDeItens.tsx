import type { FuneralResponse } from '@ampara/api-client';
import { AdicionarItemAoFuneral } from './AdicionarItemAoFuneral';
import { ItensDoFuneral } from './ItensDoFuneral';
import { OrcamentoDoFuneral } from './OrcamentoDoFuneral';

/** Aba "Itens e personalização": montador de itens e orçamento (FE-ADM-05). */
export function MontadorDeItens({ funeral }: { funeral: FuneralResponse }) {
  const somenteLeitura = funeral.status === 'CONCLUIDO' || funeral.status === 'CANCELADO';

  return (
    <>
      <ItensDoFuneral idFuneral={funeral.id_funeral} somenteLeitura={somenteLeitura} />
      {!somenteLeitura && <AdicionarItemAoFuneral idFuneral={funeral.id_funeral} />}
      <OrcamentoDoFuneral funeral={funeral} somenteLeitura={somenteLeitura} />
    </>
  );
}
