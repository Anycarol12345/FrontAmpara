import type { FuneralResponse, StatusFuneral } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { Link } from 'react-router';
import { dataHora } from '@/shared/lib/formatar';
import { AlterarStatusDialog } from './AlterarStatusDialog';
import { ACAO_DE_STATUS, DESTINACAO, STATUS_DO_FUNERAL } from './rotulosPainel';

/** Aba "Dados": o que foi registrado e a troca de situação (FE-ADM-05). */
export function DadosDoFuneral({ funeral }: { funeral: FuneralResponse }) {
  const [novoStatus, setNovoStatus] = useState<StatusFuneral | null>(null);
  const situacao = STATUS_DO_FUNERAL[funeral.status];

  const linhas: [string, string][] = [
    ['Falecido(a)', funeral.nome_falecido],
    ['Data e hora previstas', dataHora(funeral.data_hora_prevista)],
    ['Destinação', DESTINACAO[funeral.destinacao]],
    ['Observações', funeral.observacoes ?? '—'],
  ];

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold">Dados do funeral</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            {linhas.map(([rotulo, valor]) => (
              <div key={rotulo} className="flex justify-between gap-6">
                <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
                <dd className="text-right font-semibold">{valor}</dd>
              </div>
            ))}
          </dl>
          <Link
            to={`/painel/contratos/${funeral.id_contrato}`}
            className="mt-5 inline-block text-xs font-semibold hover:underline"
          >
            Ver contrato
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold">Situação</h2>
          <div className="mt-3">
            <Badge variant={situacao.variante}>{situacao.rotulo}</Badge>
          </div>
          {funeral.proximos_status.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Este funeral não aceita novas mudanças de situação.
            </p>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {funeral.proximos_status.map((proximo) => (
                <Button
                  key={proximo}
                  type="button"
                  variant={proximo === 'CANCELADO' ? 'outline' : 'default'}
                  onClick={() => setNovoStatus(proximo)}
                >
                  {ACAO_DE_STATUS[proximo]}
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AlterarStatusDialog
        funeral={funeral}
        novoStatus={novoStatus}
        aoFechar={() => setNovoStatus(null)}
      />
    </>
  );
}
