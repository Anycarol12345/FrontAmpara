import {
  getDashboardFunerariaQueryKey,
  getListarFuneraisQueryKey,
  getObterFuneralQueryKey,
  useAlterarStatusFuneral,
  type FuneralResponse,
  type StatusFuneral,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { statusSchema, type StatusForm, type StatusValidado } from '../schemas/funeral';
import { ACAO_DE_STATUS, CLASSE_TEXTAREA, STATUS_DO_FUNERAL } from './rotulosPainel';

type Props = {
  funeral: FuneralResponse;
  novoStatus: StatusFuneral | null;
  aoFechar: () => void;
};

/** Muda a situação do funeral; a API só oferece as transições permitidas (FUN-06). */
export function AlterarStatusDialog({ funeral, novoStatus, aoFechar }: Props) {
  return (
    <Dialog open={novoStatus !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        {novoStatus && (
          <>
            <DialogTitle>{ACAO_DE_STATUS[novoStatus]}</DialogTitle>
            <DialogDescription>
              A situação passa de {STATUS_DO_FUNERAL[funeral.status].rotulo} para{' '}
              {STATUS_DO_FUNERAL[novoStatus].rotulo}.
            </DialogDescription>
            <Formulario
              key={novoStatus}
              funeral={funeral}
              novoStatus={novoStatus}
              aoConcluir={aoFechar}
              aoCancelar={aoFechar}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  funeral,
  novoStatus,
  aoConcluir,
  aoCancelar,
}: {
  funeral: FuneralResponse;
  novoStatus: StatusFuneral;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const exigirMotivo = novoStatus === 'CANCELADO';
  const schema = useMemo(() => statusSchema(exigirMotivo), [exigirMotivo]);
  const alterar = useAlterarStatusFuneral({
    mutation: {
      meta: {
        invalida: [
          getObterFuneralQueryKey(funeral.id_funeral),
          getListarFuneraisQueryKey(),
          getDashboardFunerariaQueryKey(),
        ],
      },
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StatusForm, unknown, StatusValidado>({
    resolver: zodResolver(schema),
    defaultValues: { observacao: '' },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      await alterar.mutateAsync({
        id: funeral.id_funeral,
        data: { status: novoStatus, observacao: dados.observacao === '' ? null : dados.observacao },
      });
      toast.success('Situação atualizada.');
      aoConcluir();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, ['observacao'])) throw erro;
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
      <ErroFormulario mensagem={errors.root?.servidor?.message} />
      <Campo
        id="status-observacao"
        label={exigirMotivo ? 'Motivo' : 'Observação (opcional)'}
        erro={errors.observacao?.message}
      >
        <textarea className={CLASSE_TEXTAREA} {...register('observacao')} />
      </Campo>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={aoCancelar}>
          Voltar
        </Button>
        <Button type="submit" carregando={isSubmitting}>
          Confirmar
        </Button>
      </DialogFooter>
    </form>
  );
}