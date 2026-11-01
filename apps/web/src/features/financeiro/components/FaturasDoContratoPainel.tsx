import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { Tabela, type Coluna } from '@/shared/components/Tabela';
import { data, numero, real } from '@/shared/lib/formatar';
import { useFaturasDoContrato, type FaturaResponse } from '../hooks/faturas';
import { BaixaManualDialog } from './BaixaManualDialog';
import { competencia, FORMA_PAGAMENTO, podePagar, STATUS_FATURA } from './rotulos';

/** Faturas de um contrato para a equipe, com a baixa manual (FE-ADM-03). */
export function FaturasDoContratoPainel({ idContrato }: { idContrato: string }) {
  const consulta = useFaturasDoContrato(idContrato);
  const [emBaixa, setEmBaixa] = useState<FaturaResponse | null>(null);

  const colunas: Coluna<FaturaResponse>[] = [
    {
      titulo: 'Fatura',
      celula: (f) => <span className="font-semibold capitalize">{competencia(f.competencia)}</span>,
    },
    { titulo: 'Vencimento', celula: (f) => data(f.data_vencimento) },
    {
      titulo: 'Valor',
      celula: (f) => (
        <span className="flex flex-col">
          <span>{real(f.valor)}</span>
          {numero(f.valor_multa_juros) > 0 && (
            <span className="text-xs text-muted-foreground">
              + {real(f.valor_multa_juros)} de multa e juros
            </span>
          )}
        </span>
      ),
    },
    {
      titulo: 'Situação',
      celula: (f) => (
        <Badge variant={STATUS_FATURA[f.status].variante}>{STATUS_FATURA[f.status].rotulo}</Badge>
      ),
    },
    {
      titulo: 'Pagamento',
      celula: (f) =>
        f.data_pagamento ? (
          <span className="flex flex-col">
            <span>{data(f.data_pagamento)}</span>
            {f.forma_pagamento && (
              <span className="text-xs text-muted-foreground">
                {FORMA_PAGAMENTO[f.forma_pagamento]}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      titulo: '',
      className: 'text-right',
      celula: (f) =>
        podePagar(f.status) && (
          <Button size="sm" variant="outline" onClick={() => setEmBaixa(f)}>
            Dar baixa
          </Button>
        ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-6 pb-2">
        <h2 className="text-lg font-bold">Faturas</h2>
        <p className="text-[11px] text-subtle-foreground">
          Da mais recente para a mais antiga. A baixa manual registra um pagamento feito fora do
          sistema.
        </p>
      </div>
      <EstadoConsulta
        consulta={consulta}
        estaVazio={(faturas) => faturas.length === 0}
        vazio={
          <Vazio
            titulo="Nenhuma fatura ainda"
            descricao="As faturas aparecem depois que a cobrança do contrato é criada."
          />
        }
      >
        {(faturas) => <Tabela colunas={colunas} linhas={faturas} chave={(f) => f.id_fatura} />}
      </EstadoConsulta>
      <BaixaManualDialog fatura={emBaixa} aoFechar={() => setEmBaixa(null)} />
    </Card>
  );
}
