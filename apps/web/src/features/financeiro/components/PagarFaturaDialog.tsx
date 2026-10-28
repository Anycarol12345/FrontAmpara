import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { ExternalLink } from 'lucide-react';
import { data, numero, real } from '@/shared/lib/formatar';
import type { FaturaResponse } from '../hooks/faturas';
import { competencia } from './rotulos';

type Props = { fatura: FaturaResponse | null; aoFechar: () => void };

/**
 * Resumo antes de pagar (FE-CLI-06): mostra multa e juros da fatura atrasada (COB-09)
 * e abre a página de pagamento do Stripe. Os dados de pagamento não passam pela nossa API.
 */
export function PagarFaturaDialog({ fatura, aoFechar }: Props) {
  const encargos = numero(fatura?.valor_multa_juros);

  function irParaPagamento() {
    if (!fatura?.link_pagamento) return;
    window.open(fatura.link_pagamento, '_blank', 'noopener,noreferrer');
    toast.info('Quando o pagamento for concluído, o status atualiza aqui.');
    aoFechar();
  }

  return (
    <Dialog open={fatura !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        {fatura && (
          <>
            <DialogTitle>Pagar fatura de {competencia(fatura.competencia)}</DialogTitle>
            <DialogDescription>
              Você vai para a página de pagamento segura do Stripe, onde pode pagar com Pix, boleto
              ou cartão.
            </DialogDescription>
            <dl className="mt-5 flex flex-col gap-2 rounded-lg bg-muted/60 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Vencimento</dt>
                <dd>{data(fatura.data_vencimento)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Valor a pagar agora</dt>
                <dd>{real(fatura.valor)}</dd>
              </div>
              {encargos > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Multa e juros pelo atraso</dt>
                  <dd>{real(encargos)}</dd>
                </div>
              )}
            </dl>
            {encargos > 0 && (
              // COB-09: a fatura do Stripe não muda de valor; os encargos vão para a próxima cobrança.
              <p className="mt-3 text-xs text-muted-foreground">
                A multa e os juros não entram neste pagamento: eles são cobrados na sua próxima
                fatura.
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={aoFechar}>
                Agora não
              </Button>
              <Button onClick={irParaPagamento} disabled={!fatura.link_pagamento}>
                Ir para o pagamento <ExternalLink />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
