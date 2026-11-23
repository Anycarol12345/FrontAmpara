import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { useState, type FormEvent } from 'react';
import { Campo, ErroFormulario } from '@/shared/components/Campo';

/** Barra da meta de contratos do mês (protótipo do consultor: "Seu desempenho"). */
export function MetaDoMes({ feitos, meta }: { feitos: number; meta: number }) {
  const percentual = Math.min(100, Math.round((feitos / meta) * 100));
  const faltam = Math.max(0, meta - feitos);
  return (
    <Card className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-subtle-foreground uppercase">
            Meta do mês
          </p>
          <h2 className="mt-1 text-lg font-bold">Meta de contratos do mês</h2>
        </div>
        <p className="text-2xl font-bold">
          {feitos} <span className="text-sm font-normal text-subtle-foreground">/ {meta}</span>
        </p>
      </div>
      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Meta de contratos do mês"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {faltam === 0
          ? 'Meta batida. Parabéns!'
          : `Faltam ${faltam} ${faltam === 1 ? 'contrato' : 'contratos'} para a meta.`}
      </p>
    </Card>
  );
}

/** Ajuste da meta mensal. A meta fica salva neste navegador. */
export function AjustarMetaDialog({
  meta,
  aoSalvar,
  aoFechar,
}: {
  meta: number;
  aoSalvar: (meta: number) => void;
  aoFechar: () => void;
}) {
  const [valor, setValor] = useState(String(meta));
  const [erro, setErro] = useState<string>();

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const nova = Number(valor);
    if (!Number.isInteger(nova) || nova < 1 || nova > 999)
      return setErro('Informe um número inteiro entre 1 e 999.');
    aoSalvar(nova);
    aoFechar();
  };

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Ajustar meta</DialogTitle>
        <DialogDescription>
          Quantos contratos você quer fechar por mês. A meta fica salva neste navegador.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={erro} />
          <Campo id="meta-mensal" label="Contratos por mês">
            <Input
              type="number"
              min="1"
              max="999"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit">Salvar meta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
