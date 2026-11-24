import {
  getDashboardFunerariaQueryKey,
  getListarFuneraisQueryKey,
  useObterBeneficiario,
  useRegistrarFuneral,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { data } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { CLASSE_TEXTAREA } from '../../components/rotulosPainel';
import {
  funeralSchema,
  OPCOES_DESTINACAO,
  type FuneralForm,
  type FuneralValidado,
} from '../../schemas/funeral';

const CAMPOS = ['data_hora_prevista', 'destinacao', 'observacoes'] as const;

/** Registro do funeral do falecido, depois do registro do beneficiário (FE-ADM-05). */
export function RegistrarFuneralPage() {
  const [parametros] = useSearchParams();
  const idBeneficiario = parametros.get('beneficiario');

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/painel"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Visão geral
      </Link>
      <PageHeader
        sobretitulo="Atendimento"
        titulo="Registrar funeral"
        descricao="Informe quando e como o funeral será realizado. Os itens e o orçamento vêm depois."
      />
      {idBeneficiario ? (
        <Formulario idBeneficiario={idBeneficiario} />
      ) : (
        <Card className="p-6">
          <Vazio
            titulo="Falecimento não informado"
            descricao="Registre o falecimento primeiro para depois registrar o funeral."
          />
          <div className="mt-2 flex justify-center">
            <Button asChild>
              <Link to="/painel/beneficiarios/novo">Registrar falecimento</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Formulario({ idBeneficiario }: { idBeneficiario: string }) {
  const navegar = useNavigate();
  const beneficiario = useObterBeneficiario(idBeneficiario);
  const registrar = useRegistrarFuneral({
    mutation: {
      meta: { invalida: [getListarFuneraisQueryKey(), getDashboardFunerariaQueryKey()] },
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FuneralForm, unknown, FuneralValidado>({
    resolver: zodResolver(funeralSchema),
    defaultValues: { data_hora_prevista: '', destinacao: 'NAO_DEFINIDA', observacoes: '' },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      const funeral = await registrar.mutateAsync({
        data: {
          id_beneficiario: idBeneficiario,
          data_hora_prevista: new Date(dados.data_hora_prevista).toISOString(),
          destinacao: dados.destinacao,
          observacoes: dados.observacoes === '' ? null : dados.observacoes,
        },
      });
      toast.success('Funeral registrado.');
      navegar(`/painel/funerais/${funeral.id_funeral}`);
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <div className="flex flex-col gap-5">
      <EstadoConsulta consulta={beneficiario}>
        {(falecido) => (
          <Card className="p-6">
            <h2 className="text-lg font-bold">{falecido.nome}</h2>
            <p className="text-xs text-muted-foreground">
              Faleceu em {data(falecido.data_falecimento)} · {falecido.local_falecimento}
              {' · '}
              Responsável: {falecido.responsavel.nome} ({falecido.responsavel.parentesco})
            </p>
          </Card>
        )}
      </EstadoConsulta>

      <Card className="p-6">
        <form onSubmit={enviar} noValidate className="flex max-w-xl flex-col gap-5">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <Campo
            id="funeral-data"
            label="Data e hora previstas"
            erro={errors.data_hora_prevista?.message}
          >
            <Input type="datetime-local" {...register('data_hora_prevista')} />
          </Campo>
          <Campo id="funeral-destinacao" label="Destinação" erro={errors.destinacao?.message}>
            <select
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
              {...register('destinacao')}
            >
              {OPCOES_DESTINACAO.map(({ valor, rotulo }) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            id="funeral-observacoes"
            label="Observações (opcional)"
            erro={errors.observacoes?.message}
          >
            <textarea className={CLASSE_TEXTAREA} {...register('observacoes')} />
          </Campo>
          <div className="flex justify-end">
            <Button type="submit" carregando={isSubmitting}>
              Registrar funeral
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
