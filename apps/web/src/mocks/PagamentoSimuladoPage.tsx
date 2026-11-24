import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { FormaPagamento } from '@/features/financeiro';
import { data, real } from '@/shared/lib/formatar';
import { alterarEstado, lerEstado } from './estado';

// Pix e boleto levam um tempo para o banco confirmar (status PROCESSANDO, COB-01).
const CONFIRMACAO_MS = 20_000;

/**
 * Faz o papel da página de pagamento do Stripe enquanto não há integração (só em desenvolvimento).
 * Abre em outra aba; a aba do sistema vê o novo status ao voltar o foco.
 */
export function PagamentoSimuladoPage() {
  const [parametros] = useSearchParams();
  const id = parametros.get('fatura') ?? '';
  const fatura = lerEstado().faturas[id];
  const [pago, setPago] = useState<FormaPagamento | null>(null);

  function pagar(forma: FormaPagamento) {
    alterarEstado((e) => {
      const f = e.faturas[id];
      if (!f) return;
      const hoje = new Date().toISOString().slice(0, 10);
      e.faturas[id] =
        forma === 'CARTAO'
          ? { ...f, status: 'PAGA', forma_pagamento: forma, data_pagamento: hoje }
          : {
              ...f,
              status: 'PROCESSANDO',
              forma_pagamento: forma,
              data_pagamento: hoje,
              confirmar_em: new Date(Date.now() + CONFIRMACAO_MS).toISOString(),
            };
    });
    setPago(forma);
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background p-5">
      <Card className="w-full max-w-sm p-7">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
          Pagamento simulado
        </p>
        {!fatura ? (
          <p className="mt-3 text-sm">Fatura não encontrada.</p>
        ) : pago ? (
          <>
            <h1 className="mt-2 text-xl font-bold">Pagamento enviado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {pago === 'CARTAO'
                ? 'Pagamento aprovado.'
                : `O banco confirma em cerca de ${CONFIRMACAO_MS / 1000} segundos. Até lá, a fatura aparece como "em processamento".`}{' '}
              Pode fechar esta aba.
            </p>
            <Button className="mt-6 w-full" onClick={() => window.close()}>
              Fechar
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-xl font-bold">{real(fatura.valor)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Vencimento em {data(fatura.data_vencimento)}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Nesta etapa entra a página de pagamento do Stripe. Escolha como simular:
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => pagar('PIX')}>Pagar com Pix</Button>
              <Button variant="outline" onClick={() => pagar('BOLETO')}>
                Pagar com boleto
              </Button>
              <Button variant="outline" onClick={() => pagar('CARTAO')}>
                Pagar com cartão
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
