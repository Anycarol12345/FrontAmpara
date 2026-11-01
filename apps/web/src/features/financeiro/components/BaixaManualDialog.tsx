import { getObterContratoQueryKey, useBaixaManualFatura } from '@ampara/api-client';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { data, numero, real } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { getFaturasDoContratoQueryKey, type FaturaResponse } from '../hooks/faturas';
import {
  baixaManualSchema,
  OPCOES_BAIXA,
  type BaixaManualForm,
  type BaixaManualValidada,
} from '../schemas/baixaManual';
import { competencia } from './rotulos';

type Props = { fatura: FaturaResponse | null; aoFechar: () => void };

const CAMPOS = ['forma_pagamento', 'observacao'] as const;

/** Baixa manual de pagamento pela equipe (FE-ADM-03, POST /gestao/faturas/{id}/baixa). */
export function BaixaManualDialog({ fatura, aoFechar }: Props) {
  return (
    <Dialog open={fatura !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        <DialogTitle>Dar baixa no pagamento</DialogTitle>
        <DialogDescription>
          Registre um pagamento recebido fora do sistema. A baixa não pode ser desfeita.
        </DialogDescription>
        {fatura && (
          <Formulario
            key={fatura.id_fatura}
            fatura={fatura}
            aoConcluir={aoFechar}
            aoCancelar={aoFechar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  fatura,
  aoConcluir,
  aoCancelar,
}: {
  fatura: FaturaResponse;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const baixar = useBaixaManualFatura({
    mutation: {
      meta: {
        invalida: [
          getFaturasDoContratoQueryKey(fatura.id_contrato),
          getObterContratoQueryKey(fatura.id_contrato),
        ],
      },
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BaixaManualForm, unknown, BaixaManualValidada>({
    resolver: zodResolver(baixaManualSchema),
    defaultValues: { forma_pagamento: 'MANUAL', observacao: '' },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      await baixar.mutateAsync({ id: fatura.id_fatura, data: dados });
      toast.success('Baixa registrada.');
      aoConcluir();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  const encargos = numero(fatura.valor_multa_juros);

  return (
    <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
      <dl className="flex flex-col gap-2 rounded-lg bg-muted/60 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Fatura de</dt>
          <dd>{competencia(fatura.competencia)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Vencimento</dt>
          <dd>{data(fatura.data_vencimento)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Valor</dt>
          <dd>{real(fatura.valor)}</dd>
        </div>
        {encargos > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Multa e juros pelo atraso</dt>
            <dd>{real(encargos)}</dd>
          </div>
        )}
      </dl>

      <ErroFormulario mensagem={errors.root?.servidor?.message} />

      <Campo id="baixa-forma" label="Forma de pagamento" erro={errors.forma_pagamento?.message}>
        <select
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          {...register('forma_pagamento')}
        >
          {OPCOES_BAIXA.map(({ valor, rotulo }) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="baixa-observacao" label="Observação" erro={errors.observacao?.message}>
        <Input placeholder="Ex.: recibo nº 123" {...register('observacao')} />
      </Campo>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button type="submit" carregando={isSubmitting}>
          Confirmar baixa
        </Button>
      </DialogFooter>
    </form>
  );
}
