import {
  getGestaoListarPlanosQueryKey,
  useAtualizarPlano,
  useCriarPlano,
  useGestaoObterPlano,
  type PlanoRequest,
  type PlanoResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Control, type Path } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Carregando } from '@/shared/components/EstadoConsulta';
import { numero } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';

const valor = z.coerce.number<string>().min(0, 'Informe um valor positivo.');
const inteiro = z.coerce
  .number<string>()
  .int('Use um número inteiro.')
  .min(0, 'Informe um valor positivo.');

const planoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(100, 'Use no máximo 100 caracteres.'),
  descricao: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
  valor_mensal: valor,
  valor_anual: valor,
  valor_dependente_mensal: valor,
  valor_dependente_anual: valor,
  carencia_dias: inteiro,
  limite_dependentes: inteiro,
  permite_somente_dependente: z.boolean(),
  km_incluso: inteiro,
  translado_internacional: z.boolean(),
  horas_velorio: inteiro,
  sala_vip: z.boolean(),
  cremacao_inclusa: z.boolean(),
  transmissao_online: z.boolean(),
  idade_maxima_filhos: z.string(),
});
type PlanoForm = z.input<typeof planoSchema>;
type PlanoValidado = z.output<typeof planoSchema>;

const CAMPOS = [
  'nome',
  'descricao',
  'valor_mensal',
  'valor_anual',
  'valor_dependente_mensal',
  'valor_dependente_anual',
  'carencia_dias',
  'limite_dependentes',
] as const;

function valoresIniciais(plano: PlanoResponse | null): PlanoForm {
  const c = plano?.configuracoes;
  const texto = (v: number | string | null | undefined) =>
    v === null || v === undefined ? '' : String(numero(v));
  return {
    nome: plano?.nome ?? '',
    descricao: plano?.descricao ?? '',
    valor_mensal: texto(plano?.valor_mensal),
    valor_anual: texto(plano?.valor_anual),
    valor_dependente_mensal: texto(plano?.valor_dependente_mensal ?? 0),
    valor_dependente_anual: texto(plano?.valor_dependente_anual ?? 0),
    carencia_dias: texto(plano?.carencia_dias ?? 0),
    limite_dependentes: texto(plano?.limite_dependentes ?? 0),
    permite_somente_dependente: plano?.permite_somente_dependente ?? false,
    km_incluso: texto(c?.translado?.km_incluso ?? 0),
    translado_internacional: c?.translado?.internacional ?? false,
    horas_velorio: texto(c?.velorio?.horas_incluidas ?? 0),
    sala_vip: c?.velorio?.sala_vip ?? false,
    cremacao_inclusa: c?.cremacao_inclusa ?? false,
    transmissao_online: c?.transmissao_online ?? false,
    idade_maxima_filhos: texto(c?.dependentes?.idade_maxima_filhos),
  };
}

function paraRequisicao(d: PlanoValidado, versao: number): PlanoRequest {
  return {
    nome: d.nome,
    descricao: d.descricao || null,
    valor_mensal: d.valor_mensal,
    valor_anual: d.valor_anual,
    valor_dependente_mensal: d.valor_dependente_mensal,
    valor_dependente_anual: d.valor_dependente_anual,
    carencia_dias: d.carencia_dias,
    limite_dependentes: d.limite_dependentes,
    permite_somente_dependente: d.permite_somente_dependente,
    configuracoes: {
      versao,
      translado: { km_incluso: d.km_incluso, internacional: d.translado_internacional },
      velorio: { horas_incluidas: d.horas_velorio, sala_vip: d.sala_vip },
      cremacao_inclusa: d.cremacao_inclusa,
      transmissao_online: d.transmissao_online,
      dependentes: {
        idade_maxima_filhos: d.idade_maxima_filhos ? Number(d.idade_maxima_filhos) : null,
      },
    },
  };
}

/** Criação e edição de plano (FE-ADM-10, POST/PUT /gestao/planos). */
export function PlanoDialog({
  idPlano,
  aberto,
  aoFechar,
}: {
  /** null = novo plano. */
  idPlano: string | null;
  aberto: boolean;
  aoFechar: () => void;
}) {
  const plano = useGestaoObterPlano(idPlano ?? '', {
    query: { enabled: aberto && Boolean(idPlano) },
  });

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{idPlano ? 'Editar plano' : 'Novo plano'}</DialogTitle>
        <DialogDescription>
          Novos planos começam inativos: ative quando estiverem prontos para aparecer na landing.
        </DialogDescription>
        {aberto && idPlano && !plano.data ? (
          <Carregando />
        ) : (
          aberto && (
            <Formulario
              key={idPlano ?? 'novo'}
              plano={idPlano ? (plano.data ?? null) : null}
              aoConcluir={aoFechar}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  plano,
  aoConcluir,
}: {
  plano: PlanoResponse | null;
  aoConcluir: () => void;
}) {
  const invalida = { mutation: { meta: { invalida: [getGestaoListarPlanosQueryKey()] } } };
  const criar = useCriarPlano(invalida);
  const atualizar = useAtualizarPlano(invalida);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PlanoForm, unknown, PlanoValidado>({
    resolver: zodResolver(planoSchema),
    defaultValues: valoresIniciais(plano),
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      const corpo = paraRequisicao(dados, numero(plano?.configuracoes?.versao ?? 1));
      if (plano) await atualizar.mutateAsync({ id: plano.id_plano, data: corpo });
      else await criar.mutateAsync({ data: corpo });
      toast.success(plano ? 'Plano atualizado.' : 'Plano criado.');
      aoConcluir();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  const numeroCampo = (nome: Path<PlanoForm>, rotulo: string, passo = '1') => (
    <Campo id={`plano-${nome}`} label={rotulo} erro={errors[nome as keyof typeof errors]?.message}>
      <Input type="number" inputMode="decimal" min="0" step={passo} {...register(nome)} />
    </Campo>
  );

  return (
    <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-6">
      <ErroFormulario mensagem={errors.root?.servidor?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="plano-nome" label="Nome" erro={errors.nome?.message}>
          <Input {...register('nome')} />
        </Campo>
        <Campo id="plano-descricao" label="Descrição" erro={errors.descricao?.message}>
          <Input {...register('descricao')} />
        </Campo>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="mb-3 text-sm font-bold">Valores (R$)</legend>
        {numeroCampo('valor_mensal', 'Mensal', '0.01')}
        {numeroCampo('valor_anual', 'Anual', '0.01')}
        {numeroCampo('valor_dependente_mensal', 'Dependente/mês', '0.01')}
        {numeroCampo('valor_dependente_anual', 'Dependente/ano', '0.01')}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="mb-3 text-sm font-bold">Regras</legend>
        {numeroCampo('carencia_dias', 'Carência (dias)')}
        {numeroCampo('limite_dependentes', 'Dependentes')}
        {numeroCampo('idade_maxima_filhos', 'Idade máx. filhos')}
        <Marcador
          control={control}
          nome="permite_somente_dependente"
          rotulo="Permite só dependentes"
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="mb-3 text-sm font-bold">O que está incluso</legend>
        {numeroCampo('km_incluso', 'Translado (km)')}
        {numeroCampo('horas_velorio', 'Velório (horas)')}
        <div className="flex flex-col justify-end gap-2 sm:col-span-2">
          <Marcador
            control={control}
            nome="translado_internacional"
            rotulo="Translado internacional"
          />
          <Marcador control={control} nome="sala_vip" rotulo="Sala VIP" />
          <Marcador control={control} nome="cremacao_inclusa" rotulo="Cremação inclusa" />
          <Marcador control={control} nome="transmissao_online" rotulo="Transmissão online" />
        </div>
      </fieldset>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={aoConcluir}>
          Cancelar
        </Button>
        <Button type="submit" carregando={isSubmitting}>
          {plano ? 'Salvar plano' : 'Criar plano'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Marcador({
  control,
  nome,
  rotulo,
}: {
  control: Control<PlanoForm, unknown, PlanoValidado>;
  nome: Path<PlanoForm>;
  rotulo: string;
}) {
  const id = `plano-${nome}`;
  return (
    <div className="flex items-center gap-2">
      <Controller
        control={control}
        name={nome}
        render={({ field }) => (
          <Checkbox
            id={id}
            checked={Boolean(field.value)}
            onCheckedChange={(marcado) => field.onChange(marcado === true)}
          />
        )}
      />
      <Label htmlFor={id} className="text-xs font-normal">
        {rotulo}
      </Label>
    </div>
  );
}
