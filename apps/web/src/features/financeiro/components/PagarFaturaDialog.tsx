import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { Copy, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { data, real } from '@/shared/lib/formatar';
import { encargosDaFatura, type FaturaResponse } from '../hooks/faturas';
import { competencia } from './rotulos';

type Props = { fatura: FaturaResponse | null; aoFechar: () => void };

/**
 * Resumo antes de pagar (FE-CLI-06): mostra multa e juros da fatura atrasada (COB-09)
 * e abre a página de pagamento do Stripe. Os dados de pagamento não passam pela nossa API.
 */
export function PagarFaturaDialog({ fatura, aoFechar }: Props) {
  const encargos = fatura ? encargosDaFatura(fatura) : 0;

  // Link absoluto: o QR Code é lido por outro aparelho.
  const link = fatura?.link_pagamento
    ? new URL(fatura.link_pagamento, window.location.origin).toString()
    : null;

  async function copiarLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link de pagamento copiado.');
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  }

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
            {link && (
              // O Stripe gera o Pix na página de pagamento: a API não devolve o código do Pix.
              <section
                aria-label="Pagar pelo celular"
                className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-border p-4"
              >
                <QRCodeSVG
                  value={link}
                  size={112}
                  marginSize={1}
                  role="img"
                  aria-label="QR Code da página de pagamento"
                />
                <div className="flex min-w-48 flex-1 flex-col gap-2">
                  <p className="text-sm font-semibold">Pagar pelo celular</p>
                  <p className="text-xs text-muted-foreground">
                    Aponte a câmera para abrir a página de pagamento. Lá você escolhe Pix e vê o QR
                    Code e o código copia e cola do Pix.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => void copiarLink()}
                  >
                    <Copy /> Copiar link de pagamento
                  </Button>
                </div>
              </section>
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
