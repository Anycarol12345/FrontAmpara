import type { ElegibilidadeResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Input } from '@ampara/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Campo } from '@/shared/components/Campo';
import {
  dataDeHoje,
  falecimentoSchema,
  type FalecimentoForm,
  type FalecimentoValidado,
} from '../schemas/beneficiario';

/** Etapa 3 do registro do beneficiário: data, local e responsável da família (FE-ADM-04). */
export function DadosDoFalecimento({
  pessoa,
  valores,
  aoContinuar,
  aoVoltar,
}: {
  pessoa: ElegibilidadeResponse;
  valores: FalecimentoValidado | null;
  aoContinuar: (dados: FalecimentoValidado) => void;
  aoVoltar: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FalecimentoForm, unknown, FalecimentoValidado>({
    resolver: zodResolver(falecimentoSchema),
    defaultValues: valores ?? {
      data_falecimento: '',
      local_falecimento: '',
      responsavel_nome: '',
      responsavel_telefone: '',
      responsavel_parentesco: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(aoContinuar)} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Dados do falecimento de <strong className="text-foreground">{pessoa.nome}</strong>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="falecimento-data"
          label="Data do falecimento"
          erro={errors.data_falecimento?.message}
        >
          <Input type="date" max={dataDeHoje()} {...register('data_falecimento')} />
        </Campo>
        <Campo
          id="falecimento-local"
          label="Local do falecimento"
          erro={errors.local_falecimento?.message}
        >
          <Input
            placeholder="Ex.: Hospital Municipal, Maringá"
            {...register('local_falecimento')}
          />
        </Campo>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-bold">Responsável pela família</legend>
        <Campo id="responsavel-nome" label="Nome" erro={errors.responsavel_nome?.message}>
          <Input autoComplete="off" {...register('responsavel_nome')} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="responsavel-telefone"
            label="Telefone"
            erro={errors.responsavel_telefone?.message}
          >
            <Input type="tel" placeholder="(44) 99999-0000" {...register('responsavel_telefone')} />
          </Campo>
          <Campo
            id="responsavel-parentesco"
            label="Parentesco"
            erro={errors.responsavel_parentesco?.message}
          >
            <Input placeholder="Ex.: Filha" {...register('responsavel_parentesco')} />
          </Campo>
        </div>
      </fieldset>

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={aoVoltar}>
          Voltar
        </Button>
        <Button type="submit">Revisar e confirmar</Button>
      </div>
    </form>
  );
}
