import {
  baixarDocumentoTransladoFrota,
  getObterTransladoFrotaQueryKey,
  useAlterarStatusTransladoFrota,
  useInformarMotoristaTranslado,
  useObterTransladoFrota,
  type AtribuicaoResponse,
  type StatusTranslado,
  type TransladoFrotaResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { Download, MapPin, Phone } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { STATUS_TRANSLADO, useTransladoTempoReal } from '@/features/translado';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { dataHora } from '@/shared/lib/formatar';
import { mascararTelefone, somenteDigitos } from '@/shared/lib/mascaras';
import { resumoDe, type ResumoTranslado } from './atribuicoes';

const PROXIMO: Partial<Record<StatusTranslado, { para: StatusTranslado; acao: string }>> = {
  AGENDADO: { para: 'EM_COLETA', acao: 'Cheguei para a coleta' },
  EM_COLETA: { para: 'EM_TRANSITO', acao: 'Saí para o destino' },
  EM_TRANSITO: { para: 'ENTREGUE', acao: 'Marcar como entregue' },
};

async function abrir(idTranslado: string, idDocumento: string) {
  try {
    const { url } = await baixarDocumentoTransladoFrota(idTranslado, idDocumento);
    window.open(url, '_blank', 'noopener');
  } catch {
    toast.error('Não foi possível abrir o documento.');
  }
}

/** Translado para a empresa de frota: trajeto, contato, motorista e etapas (FE-TER-01, TRA-04, TRA-06). */
export function ServicoTranslado({ atribuicao }: { atribuicao: AtribuicaoResponse }) {
  const consulta = useObterTransladoFrota(atribuicao.id_origem);
  const resumo = resumoDe<ResumoTranslado>(atribuicao);
  useTransladoTempoReal(atribuicao.id_origem);

  return (
    <EstadoConsulta consulta={consulta}>
      {(t) => (
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{dataHora(t.data_prevista)}</span>
              <Badge variant={STATUS_TRANSLADO[t.status].variante}>
                {STATUS_TRANSLADO[t.status].rotulo}
              </Badge>
            </div>
            <Trajeto rotulo="Retirada" endereco={t.origem} />
            <Trajeto rotulo="Entrega" endereco={t.destino} />
            <a
              href={`tel:${somenteDigitos(t.contato_telefone)}`}
              className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
            >
              <Phone className="size-4" aria-hidden />
              <span>
                <span className="block text-xs text-muted-foreground">Contato na funerária</span>
                {t.contato_nome} · {t.contato_telefone}
              </span>
            </a>
            {(resumo.documentos ?? []).length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold">Documentos do translado</p>
                {resumo.documentos!.map((d) => (
                  <Button
                    key={d.id_documento}
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => void abrir(t.id_translado, d.id_documento)}
                  >
                    <Download /> {d.nome}
                  </Button>
                ))}
              </div>
            )}
          </Card>
          <Motorista translado={t} />
          <Etapa translado={t} />
        </div>
      )}
    </EstadoConsulta>
  );
}

function Trajeto({
  rotulo,
  endereco,
}: {
  rotulo: string;
  endereco: TransladoFrotaResponse['origem'];
}) {
  return (
    <p className="flex gap-2 text-sm">
      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span>
        <span className="block text-xs text-muted-foreground">{rotulo}</span>
        {endereco.endereco}, {endereco.cidade}-{endereco.uf}
      </span>
    </p>
  );
}

function Motorista({ translado: t }: { translado: TransladoFrotaResponse }) {
  const informar = useInformarMotoristaTranslado({
    mutation: { meta: { invalida: [getObterTransladoFrotaQueryKey(t.id_translado)] } },
  });
  const [editando, setEditando] = useState(!t.motorista);
  const [dados, setDados] = useState({
    nome: t.motorista?.nome ?? '',
    telefone: t.motorista?.telefone ?? '',
    placa: t.motorista?.placa ?? '',
    modelo: t.motorista?.modelo ?? '',
  });
  const [erro, setErro] = useState<string>();
  const encerrado = t.status === 'ENTREGUE' || t.status === 'CANCELADO';

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (Object.values(dados).some((v) => !v.trim()))
      return setErro('Preencha motorista, telefone, placa e modelo.');
    setErro(undefined);
    informar.mutate(
      { id: t.id_translado, data: { ...dados, placa: dados.placa.toUpperCase() } },
      {
        onSuccess: () => {
          toast.success('Motorista informado. A família vê os dados do veículo.');
          setEditando(false);
        },
      },
    );
  };

  if (!editando || encerrado)
    return (
      <Card className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Motorista e veículo</h2>
          {!encerrado && (
            <Button variant="ghost" size="sm" onClick={() => setEditando(true)}>
              Trocar
            </Button>
          )}
        </div>
        {t.motorista ? (
          <p className="text-sm">
            {t.motorista.nome} · {t.motorista.telefone}
            <br />
            {t.motorista.modelo}, placa {t.motorista.placa}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Não informado.</p>
        )}
      </Card>
    );

  const campo = (chave: keyof typeof dados, rotulo: string, extra?: object) => (
    <Campo id={`motorista-${chave}`} label={rotulo}>
      <Input
        value={dados[chave]}
        onChange={(e) =>
          setDados((d) => ({
            ...d,
            [chave]: chave === 'telefone' ? mascararTelefone(e.target.value) : e.target.value,
          }))
        }
        {...extra}
      />
    </Campo>
  );

  return (
    <Card className="p-5">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Motorista e veículo</h2>
        <ErroFormulario mensagem={erro} />
        <div className="grid gap-4 sm:grid-cols-2">
          {campo('nome', 'Nome do motorista')}
          {campo('telefone', 'Telefone', { inputMode: 'tel' })}
          {campo('placa', 'Placa', { className: 'uppercase' })}
          {campo('modelo', 'Modelo do veículo')}
        </div>
        <Button type="submit" disabled={informar.isPending}>
          {informar.isPending ? 'Salvando...' : 'Informar motorista'}
        </Button>
      </form>
    </Card>
  );
}

function Etapa({ translado: t }: { translado: TransladoFrotaResponse }) {
  const alterar = useAlterarStatusTransladoFrota({
    mutation: { meta: { invalida: [getObterTransladoFrotaQueryKey(t.id_translado)] } },
  });
  const proximo = PROXIMO[t.status];
  if (!proximo) return null;
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        disabled={!t.motorista || alterar.isPending}
        onClick={() =>
          alterar.mutate(
            { id: t.id_translado, data: { status: proximo.para, observacao: null } },
            {
              onSuccess: () =>
                toast.success(
                  `Atualizado: ${STATUS_TRANSLADO[proximo.para].rotulo.toLowerCase()}.`,
                ),
            },
          )
        }
      >
        {proximo.acao}
      </Button>
      {!t.motorista && (
        <p className="text-center text-xs text-muted-foreground">
          Informe o motorista antes de começar.
        </p>
      )}
    </div>
  );
}
