import {
  getTransladosDoFuneralQueryKey,
  useRegistrarTranslado,
  useSimularTranslado,
  type EnderecoRequest,
  type SimulacaoResponse,
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { numero, real } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { UFS } from '@/shared/lib/ufs';
import { TIPO_TRANSLADO } from './faixas';

const obrigatorio = (mensagem: string) => z.string().trim().min(1, mensagem);

const transladoSchema = z.object({
  origem_endereco: obrigatorio('Informe o endereço de retirada.'),
  origem_cidade: obrigatorio('Informe a cidade.'),
  origem_uf: obrigatorio('Escolha a UF.'),
  destino_endereco: obrigatorio('Informe o endereço de entrega.'),
  destino_cidade: obrigatorio('Informe a cidade.'),
  destino_uf: obrigatorio('Escolha a UF.'),
  data: obrigatorio('Informe a data.'),
  hora: obrigatorio('Informe a hora.'),
  distancia_km: z
    .string()
    .trim()
    .refine((v) => v === '' || Number(v) > 0, 'Use um número maior que zero.'),
});
type TransladoForm = z.infer<typeof transladoSchema>;

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

const endereco = (d: TransladoForm, lado: 'origem' | 'destino'): EnderecoRequest => ({
  endereco: d[`${lado}_endereco`],
  cidade: d[`${lado}_cidade`],
  uf: d[`${lado}_uf`],
  pais: 'BR',
});

/** "aaaa-mm-dd" e "hh:mm" locais de um ISO. */
function partes(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

/** Registro do translado: calcula o preço (TRA-02, TRA-03) e só depois registra (FE-ADM-07). */
export function NovoTransladoDialog({
  idFuneral,
  dataPrevista,
  aoFechar,
}: {
  idFuneral: string;
  dataPrevista: string;
  aoFechar: () => void;
}) {
  const simular = useSimularTranslado({ mutation: { meta: { silenciarErro: true } } });
  const registrar = useRegistrarTranslado({
    mutation: { meta: { invalida: [getTransladosDoFuneralQueryKey(idFuneral)] } },
  });
  const [simulacao, setSimulacao] = useState<SimulacaoResponse | null>(null);
  const previsto = partes(dataPrevista);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransladoForm>({
    resolver: zodResolver(transladoSchema),
    defaultValues: {
      origem_endereco: '',
      origem_cidade: '',
      origem_uf: '',
      destino_endereco: '',
      destino_cidade: '',
      destino_uf: '',
      data: previsto.data,
      hora: previsto.hora,
      distancia_km: '',
    },
  });
  const CAMPOS = Object.keys(transladoSchema.shape) as (keyof TransladoForm)[];

  // Qualquer mudança nos endereços invalida o preço calculado.
  const registrarCampo: UseFormRegister<TransladoForm> = (nome, opcoes) =>
    register(nome, { ...opcoes, onChange: () => setSimulacao(null) });

  const calcular = handleSubmit(async (d) => {
    try {
      setSimulacao(
        await simular.mutateAsync({
          data: {
            origem: endereco(d, 'origem'),
            destino: endereco(d, 'destino'),
            distancia_km: d.distancia_km ? Number(d.distancia_km) : null,
            id_funeral: idFuneral,
          },
        }),
      );
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  const confirmar = handleSubmit(async (d) => {
    try {
      await registrar.mutateAsync({
        id: idFuneral,
        data: {
          origem: endereco(d, 'origem'),
          destino: endereco(d, 'destino'),
          data_prevista: new Date(`${d.data}T${d.hora}`).toISOString(),
          distancia_km: d.distancia_km ? Number(d.distancia_km) : null,
        },
      });
      toast.success('Translado registrado. Agora escolha a empresa.');
      aoFechar();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Novo translado</DialogTitle>
        <DialogDescription>
          Sem a distância, o sistema calcula pelo endereço. Informe a distância quando souber o
          trajeto exato.
        </DialogDescription>
        <form
          onSubmit={simulacao ? confirmar : calcular}
          noValidate
          className="mt-5 flex flex-col gap-5"
        >
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <Endereco lado="origem" titulo="Retirada" register={registrarCampo} errors={errors} />
          <Endereco lado="destino" titulo="Entrega" register={registrarCampo} errors={errors} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="tr-data" label="Data" erro={errors.data?.message}>
              <Input type="date" {...register('data')} />
            </Campo>
            <Campo id="tr-hora" label="Hora" erro={errors.hora?.message}>
              <Input type="time" {...register('hora')} />
            </Campo>
            <Campo id="tr-km" label="Distância (km, opcional)" erro={errors.distancia_km?.message}>
              <Input type="number" min="1" step="0.1" {...registrarCampo('distancia_km')} />
            </Campo>
          </div>

          {simulacao && (
            <div
              aria-label="Preço calculado"
              className="grid gap-3 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-4"
            >
              <span>
                <span className="block text-xs text-muted-foreground">Tipo</span>
                {TIPO_TRANSLADO[simulacao.tipo]} · {numero(simulacao.distancia_km)} km
              </span>
              <span>
                <span className="block text-xs text-muted-foreground">Valor</span>
                {real(simulacao.valor)}
              </span>
              <span>
                <span className="block text-xs text-muted-foreground">Coberto pelo plano</span>
                {real(simulacao.valor_coberto_plano)}
              </span>
              <span className="font-bold">
                <span className="block text-xs font-normal text-muted-foreground">A pagar</span>
                {real(simulacao.valor_a_pagar)}
              </span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? simulacao
                  ? 'Registrando...'
                  : 'Calculando...'
                : simulacao
                  ? 'Registrar translado'
                  : 'Calcular preço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Endereco({
  lado,
  titulo,
  register,
  errors,
}: {
  lado: 'origem' | 'destino';
  titulo: string;
  register: UseFormRegister<TransladoForm>;
  errors: ReturnType<typeof useForm<TransladoForm>>['formState']['errors'];
}) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-6">
      <legend className="mb-2 text-sm font-semibold">{titulo}</legend>
      <Campo
        id={`tr-${lado}-endereco`}
        label={`Endereço de ${titulo.toLowerCase()}`}
        erro={errors[`${lado}_endereco`]?.message}
        className="sm:col-span-6"
      >
        <Input {...register(`${lado}_endereco`)} />
      </Campo>
      <Campo
        id={`tr-${lado}-cidade`}
        label={`Cidade de ${titulo.toLowerCase()}`}
        erro={errors[`${lado}_cidade`]?.message}
        className="sm:col-span-4"
      >
        <Input {...register(`${lado}_cidade`)} />
      </Campo>
      <Campo
        id={`tr-${lado}-uf`}
        label={`UF de ${titulo.toLowerCase()}`}
        erro={errors[`${lado}_uf`]?.message}
        className="sm:col-span-2"
      >
        <select className={classeSelect} {...register(`${lado}_uf`)}>
          <option value="">—</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </Campo>
    </fieldset>
  );
}
