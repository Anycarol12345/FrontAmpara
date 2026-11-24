import {
  useAtualizarConfiguracoes,
  type ConfiguracoesResponse,
  type ParametrosFuneraria,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { numero } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { classeSelect, invalidaConfiguracoes, lerListaDeDias } from './apoio';

/** Percentual opcional: vazio vira null (a contratação fica bloqueada enquanto for nulo). */
const percentual = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (Number(v) >= 0 && Number(v) <= max), `Use um valor de 0 a ${max}.`);

const listaDeDias = (minimo: number, maximo: number) =>
  z
    .string()
    .refine(
      (v) => lerListaDeDias(v, minimo, maximo) !== null,
      `Separe os dias por vírgula, de ${minimo} a ${maximo}.`,
    );

const cobrancaSchema = z
  .object({
    modo_vencimento: z.enum(['FIXO', 'ESCOLHA_CLIENTE']),
    dia_vencimento_fixo: z.string(),
    dias_vencimento_permitidos: listaDeDias(1, 28),
    tolerancia_dias: z.coerce
      .number<string>()
      .int('Use um número inteiro.')
      .min(0, 'Use 0 ou mais.')
      .max(90, 'Use no máximo 90.'),
    // O CDC limita a multa a 2% (DEC-12).
    multa_percentual: percentual(2),
    juros_mensal_percentual: percentual(10),
    desconto_anual_percentual: percentual(100),
    reajuste_anual_percentual: percentual(100),
  })
  .superRefine((d, ctx) => {
    const dia = Number(d.dia_vencimento_fixo);
    if (d.modo_vencimento === 'FIXO' && !(Number.isInteger(dia) && dia >= 1 && dia <= 28)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dia_vencimento_fixo'],
        message: 'Escolha um dia de 1 a 28.',
      });
    }
    if (
      d.modo_vencimento === 'ESCOLHA_CLIENTE' &&
      !lerListaDeDias(d.dias_vencimento_permitidos, 1, 28)?.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['dias_vencimento_permitidos'],
        message: 'Informe ao menos um dia.',
      });
    }
  });
type CobrancaForm = z.input<typeof cobrancaSchema>;
type CobrancaValidada = z.output<typeof cobrancaSchema>;
const CAMPOS_COBRANCA = Object.keys(cobrancaSchema.shape) as (keyof CobrancaForm)[];

const paraTexto = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined ? '' : String(numero(valor));
const paraNumeroOuNulo = (texto: string) => (texto.trim() === '' ? null : Number(texto));

function useSalvarParametros() {
  const atualizar = useAtualizarConfiguracoes(invalidaConfiguracoes);
  return (parametros: ParametrosFuneraria) =>
    atualizar.mutateAsync({ data: { identidade_visual: null, parametros } });
}

/** Vencimento, tolerância, multa, juros, desconto anual e reajuste (FE-ADM-12, DEC-01, DEC-12). */
export function CobrancaForm({ configuracoes }: { configuracoes: ConfiguracoesResponse }) {
  const atual = configuracoes.parametros.cobranca ?? {};
  const salvar = useSalvarParametros();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CobrancaForm, unknown, CobrancaValidada>({
    resolver: zodResolver(cobrancaSchema),
    defaultValues: {
      modo_vencimento: atual.modo_vencimento ?? 'FIXO',
      dia_vencimento_fixo: paraTexto(atual.dia_vencimento_fixo ?? 10),
      dias_vencimento_permitidos: (atual.dias_vencimento_permitidos ?? [5, 10, 15, 20]).join(', '),
      tolerancia_dias: paraTexto(atual.tolerancia_dias ?? 5),
      multa_percentual: paraTexto(atual.multa_percentual),
      juros_mensal_percentual: paraTexto(atual.juros_mensal_percentual),
      desconto_anual_percentual: paraTexto(atual.desconto_anual_percentual),
      reajuste_anual_percentual: paraTexto(atual.reajuste_anual_percentual ?? 0),
    },
  });
  const modo = useWatch({ control, name: 'modo_vencimento' });
  const bloqueada =
    !configuracoes.cobranca_configurada ||
    atual.multa_percentual == null ||
    atual.juros_mensal_percentual == null ||
    atual.desconto_anual_percentual == null;

  const enviar = handleSubmit(async (d) => {
    try {
      await salvar({
        cobranca: {
          modo_vencimento: d.modo_vencimento,
          dia_vencimento_fixo: Number(d.dia_vencimento_fixo) || atual.dia_vencimento_fixo,
          dias_vencimento_permitidos:
            lerListaDeDias(d.dias_vencimento_permitidos, 1, 28) ?? atual.dias_vencimento_permitidos,
          tolerancia_dias: d.tolerancia_dias,
          multa_percentual: paraNumeroOuNulo(d.multa_percentual),
          juros_mensal_percentual: paraNumeroOuNulo(d.juros_mensal_percentual),
          desconto_anual_percentual: paraNumeroOuNulo(d.desconto_anual_percentual),
          reajuste_anual_percentual: paraNumeroOuNulo(d.reajuste_anual_percentual) ?? 0,
        },
      });
      toast.success('Cobrança salva. Vale para novos contratos e para as próximas faturas.');
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS_COBRANCA)) throw erro;
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {bloqueada && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl bg-warning p-4 text-sm text-warning-foreground"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">Novas contratações estão bloqueadas.</strong> Defina a
            multa, os juros e o desconto do plano anual
            {!configuracoes.cobranca_configurada && ' e conclua o cadastro de pagamentos'} para
            liberar.
          </span>
        </div>
      )}
      <ErroFormulario mensagem={errors.root?.servidor?.message} />

      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-sm font-semibold sm:col-span-2">Vencimento</h2>
        <Campo id="cob-modo" label="Dia do vencimento">
          <select className={classeSelect} {...register('modo_vencimento')}>
            <option value="FIXO">O mesmo dia para todos</option>
            <option value="ESCOLHA_CLIENTE">O cliente escolhe</option>
          </select>
        </Campo>
        {modo === 'FIXO' ? (
          <Campo id="cob-dia" label="Dia do mês" erro={errors.dia_vencimento_fixo?.message}>
            <Input type="number" min="1" max="28" {...register('dia_vencimento_fixo')} />
          </Campo>
        ) : (
          <Campo
            id="cob-dias"
            label="Dias que o cliente pode escolher"
            dica="Separe por vírgula. Ex.: 5, 10, 15, 20"
            erro={errors.dias_vencimento_permitidos?.message}
          >
            <Input {...register('dias_vencimento_permitidos')} />
          </Campo>
        )}
        <Campo
          id="cob-tolerancia"
          label="Tolerância antes de suspender (dias úteis)"
          dica="Pagamento em processamento não conta como atraso."
          erro={errors.tolerancia_dias?.message}
        >
          <Input type="number" min="0" max="90" {...register('tolerancia_dias')} />
        </Campo>
      </Card>

      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-sm font-semibold sm:col-span-2">Encargos e descontos</h2>
        <Campo
          id="cob-multa"
          label="Multa por atraso (%)"
          dica="O Código de Defesa do Consumidor limita a 2%."
          erro={errors.multa_percentual?.message}
        >
          <Input type="number" min="0" max="2" step="0.01" {...register('multa_percentual')} />
        </Campo>
        <Campo
          id="cob-juros"
          label="Juros de mora ao mês (%)"
          dica="Cobrados proporcionalmente aos dias de atraso."
          erro={errors.juros_mensal_percentual?.message}
        >
          <Input type="number" min="0" step="0.01" {...register('juros_mensal_percentual')} />
        </Campo>
        <Campo
          id="cob-desconto"
          label="Desconto do plano anual (%)"
          erro={errors.desconto_anual_percentual?.message}
        >
          <Input type="number" min="0" step="0.01" {...register('desconto_anual_percentual')} />
        </Campo>
        <Campo
          id="cob-reajuste"
          label="Reajuste no aniversário do contrato (%)"
          erro={errors.reajuste_anual_percentual?.message}
        >
          <Input type="number" min="0" step="0.01" {...register('reajuste_anual_percentual')} />
        </Campo>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Salvando...' : 'Salvar cobrança'}
        </Button>
      </div>
    </form>
  );
}

const operacaoSchema = z.object({
  dias_antes: listaDeDias(0, 30),
  dias_depois: listaDeDias(1, 90),
  prazo_aceite_horas: z.coerce
    .number<string>()
    .int('Use um número inteiro.')
    .min(1, 'Use ao menos 1 hora.')
    .max(168, 'Use no máximo 168 horas (7 dias).'),
  modo_certidao: z.enum(['MANUAL', 'SIMULADO']),
});
type OperacaoForm = z.input<typeof operacaoSchema>;
type OperacaoValidada = z.output<typeof operacaoSchema>;

/** Lembretes de fatura, prazo de aceite dos parceiros e modo da certidão (FE-ADM-12, COB-04, TER-02, CER-02). */
export function OperacaoForm({ configuracoes }: { configuracoes: ConfiguracoesResponse }) {
  const { lembretes, terceiros, certidao } = configuracoes.parametros;
  const salvar = useSalvarParametros();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OperacaoForm, unknown, OperacaoValidada>({
    resolver: zodResolver(operacaoSchema),
    defaultValues: {
      dias_antes: (lembretes?.dias_antes ?? []).join(', '),
      dias_depois: (lembretes?.dias_depois ?? []).join(', '),
      prazo_aceite_horas: paraTexto(terceiros?.prazo_aceite_horas ?? 2),
      modo_certidao: certidao?.modo ?? 'MANUAL',
    },
  });

  const enviar = handleSubmit(async (d) => {
    try {
      await salvar({
        lembretes: {
          dias_antes: lerListaDeDias(d.dias_antes, 0, 30) ?? [],
          dias_depois: lerListaDeDias(d.dias_depois, 1, 90) ?? [],
        },
        terceiros: { prazo_aceite_horas: d.prazo_aceite_horas },
        certidao: { modo: d.modo_certidao },
      });
      toast.success('Configurações salvas.');
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, ['dias_antes', 'dias_depois', 'prazo_aceite_horas']))
        throw erro;
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <ErroFormulario mensagem={errors.root?.servidor?.message} />
      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-sm font-semibold sm:col-span-2">Lembretes de fatura</h2>
        <Campo
          id="op-antes"
          label="Dias antes do vencimento"
          dica="Ex.: 5, 1 e 0 (no dia)"
          erro={errors.dias_antes?.message}
        >
          <Input {...register('dias_antes')} />
        </Campo>
        <Campo
          id="op-depois"
          label="Dias depois do vencimento"
          dica="Lembrete de atraso. Ex.: 1, 3, 7"
          erro={errors.dias_depois?.message}
        >
          <Input {...register('dias_depois')} />
        </Campo>
      </Card>
      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="text-sm font-semibold sm:col-span-2">Parceiros e certidão</h2>
        <Campo
          id="op-prazo"
          label="Prazo para o parceiro aceitar um serviço (horas)"
          dica="Depois disso, o serviço volta para a funerária redistribuir."
          erro={errors.prazo_aceite_horas?.message}
        >
          <Input type="number" min="1" max="168" {...register('prazo_aceite_horas')} />
        </Campo>
        <Campo id="op-certidao" label="Pedido da certidão de óbito">
          <select className={classeSelect} {...register('modo_certidao')}>
            <option value="MANUAL">Manual: a equipe registra a emissão</option>
            <option value="SIMULADO">Simulado: só para testes</option>
          </select>
        </Campo>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
