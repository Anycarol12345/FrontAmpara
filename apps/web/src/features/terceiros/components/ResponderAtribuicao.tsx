import {
  getMinhasAtribuicoesQueryKey,
  useAceitarAtribuicao,
  useRecusarAtribuicao,
  type AtribuicaoResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { useState, type FormEvent } from 'react';
import { Campo, ErroFormulario } from '@/shared/components/Campo';

/** Aceitar ou recusar (com motivo) um serviço pendente (FE-TER-01, TER-02). */
export function ResponderAtribuicao({ atribuicao }: { atribuicao: AtribuicaoResponse }) {
  const invalida = { mutation: { meta: { invalida: [getMinhasAtribuicoesQueryKey()] } } };
  const aceitar = useAceitarAtribuicao(invalida);
  const recusar = useRecusarAtribuicao(invalida);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string>();

  const enviarRecusa = (e: FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 3) return setErro('Conte o motivo para a funerária.');
    recusar.mutate(
      { id: atribuicao.id_atribuicao, data: { motivo: motivo.trim() } },
      {
        onSuccess: () => {
          toast.success('Serviço recusado. A funerária foi avisada.');
          setRecusando(false);
        },
      },
    );
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setRecusando(true)}>
          Recusar
        </Button>
        <Button
          className="flex-1"
          disabled={aceitar.isPending}
          onClick={() =>
            aceitar.mutate(
              { id: atribuicao.id_atribuicao },
              { onSuccess: () => toast.success('Serviço aceito.') },
            )
          }
        >
          {aceitar.isPending ? 'Aceitando...' : 'Aceitar'}
        </Button>
      </div>
      {recusando && (
        <Dialog open onOpenChange={(aberto) => !aberto && setRecusando(false)}>
          <DialogContent className="max-w-md">
            <DialogTitle>Recusar o serviço?</DialogTitle>
            <DialogDescription>
              A funerária recebe o motivo e passa o serviço para outro parceiro.
            </DialogDescription>
            <form onSubmit={enviarRecusa} noValidate className="mt-4 flex flex-col gap-4">
              <ErroFormulario mensagem={erro} />
              <Campo id="recusa-motivo" label="Motivo">
                <Input
                  value={motivo}
                  placeholder="Ex.: sem veículo disponível no horário"
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </Campo>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRecusando(false)}>
                  Voltar
                </Button>
                <Button type="submit" disabled={recusar.isPending}>
                  Recusar serviço
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
