import type { HistoricoStatusResponse } from '@ampara/api-client';
import { Card } from '@ampara/ui/components/card';
import { Vazio } from '@/shared/components/EstadoConsulta';
import { dataHora } from '@/shared/lib/formatar';
import { STATUS_DO_FUNERAL } from './rotulosPainel';

/** Aba "Histórico": cada mudança de situação, da mais recente para a mais antiga (FE-ADM-05). */
export function HistoricoDoFuneral({ historico }: { historico: HistoricoStatusResponse[] }) {
  const mudancas = [...historico].sort((a, b) => b.em.localeCompare(a.em));

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">Histórico de situação</h2>
      <p className="text-[11px] text-subtle-foreground">Da mudança mais recente para a mais antiga</p>
      {mudancas.length === 0 ? (
        <Vazio titulo="Sem mudanças ainda" descricao="As mudanças de situação aparecem aqui." />
      ) : (
        <ol className="mt-5 flex flex-col">
          {mudancas.map((mudanca) => (
            <li
              key={`${mudanca.em}-${mudanca.para}`}
              className="flex gap-4 border-l-2 border-border/60 pb-6 pl-5 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold">
                  {mudanca.de === mudanca.para
                    ? STATUS_DO_FUNERAL[mudanca.para].rotulo
                    : `${STATUS_DO_FUNERAL[mudanca.de].rotulo} → ${STATUS_DO_FUNERAL[mudanca.para].rotulo}`}
                </span>
                <span className="text-xs text-muted-foreground">{dataHora(mudanca.em)}</span>
                {mudanca.observacao && <span className="mt-1 text-sm">{mudanca.observacao}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}