import {
  getListarLocaisQueryKey,
  useAlterarStatusLocal,
  useListarLocais,
  type LocalResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { usePermissao } from '@/features/auth';
import { Abas, PainelDaAba } from '@/shared/components/Abas';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabela, type Coluna } from '@/shared/components/Tabela';
import { dataLonga } from '@/shared/lib/formatar';
import { AgendaDoDia } from '../../components/AgendaDoDia';
import { hojeLocal, somarDias, TIPO_LOCAL } from '../../components/locais';
import { LocalDialog } from '../../components/LocalDialog';

const ABAS = [
  { id: 'agenda', titulo: 'Agenda do dia' },
  { id: 'locais', titulo: 'Salas e locais' },
] as const;

/** Agenda das salas próprias por dia e o cadastro de salas e locais (FE-ADM-06, FUN-05). */
export function AgendaPage() {
  const [parametros, setParametros] = useSearchParams();
  const { ehGestor } = usePermissao();
  const ativa = ABAS.find((a) => a.id === parametros.get('aba'))?.id ?? 'agenda';
  const dia = parametros.get('dia') ?? hojeLocal();
  const consulta = useListarLocais();
  const [edicao, setEdicao] = useState<{ local: LocalResponse | null } | null>(null);

  const irPara = (novo: Record<string, string>) =>
    setParametros({ aba: ativa, dia, ...novo }, { replace: true });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Equipe"
        titulo="Agenda"
        descricao="Ocupação das salas de velório e dos locais próprios da funerária."
        acoes={
          ehGestor && (
            <Button onClick={() => setEdicao({ local: null })}>
              <Plus /> Novo local
            </Button>
          )
        }
      />
      <Abas abas={ABAS} ativa={ativa} aoMudar={(aba) => irPara({ aba })} rotulo="Agenda" />
      <PainelDaAba id={ativa}>
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(ls) => ls.length === 0}
          vazio={
            <Card>
              <Vazio
                titulo="Nenhum local cadastrado"
                descricao="Cadastre as salas de velório e os outros locais usados nos funerais."
              />
            </Card>
          }
        >
          {(locais) =>
            ativa === 'agenda' ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Dia anterior"
                    onClick={() => irPara({ dia: somarDias(dia, -1) })}
                  >
                    <ChevronLeft />
                  </Button>
                  <Input
                    type="date"
                    aria-label="Dia"
                    className="w-auto"
                    value={dia}
                    onChange={(e) => e.target.value && irPara({ dia: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Próximo dia"
                    onClick={() => irPara({ dia: somarDias(dia, 1) })}
                  >
                    <ChevronRight />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => irPara({ dia: hojeLocal() })}>
                    Hoje
                  </Button>
                  <span className="text-sm font-semibold">{dataLonga(dia)}</span>
                </div>
                {locais.some((l) => l.ativo && l.proprio) ? (
                  <AgendaDoDia dia={dia} locais={locais.filter((l) => l.ativo && l.proprio)} />
                ) : (
                  <Card>
                    <Vazio
                      titulo="Nenhum local próprio ativo"
                      descricao="Só os locais da própria funerária têm agenda."
                    />
                  </Card>
                )}
              </>
            ) : (
              <ListaDeLocais
                locais={locais}
                podeEditar={ehGestor}
                aoEditar={(local) => setEdicao({ local })}
              />
            )
          }
        </EstadoConsulta>
      </PainelDaAba>
      {edicao && <LocalDialog local={edicao.local} aoFechar={() => setEdicao(null)} />}
    </div>
  );
}

function ListaDeLocais({
  locais,
  podeEditar,
  aoEditar,
}: {
  locais: LocalResponse[];
  podeEditar: boolean;
  aoEditar: (local: LocalResponse) => void;
}) {
  const alterarStatus = useAlterarStatusLocal({
    mutation: { meta: { invalida: [getListarLocaisQueryKey()] } },
  });
  const colunas: Coluna<LocalResponse>[] = [
    {
      titulo: 'Local',
      celula: (l) => (
        <span className="flex flex-col">
          <span className="font-semibold">{l.nome}</span>
          <span className="text-xs text-muted-foreground">{l.endereco ?? 'Sem endereço'}</span>
        </span>
      ),
    },
    { titulo: 'Tipo', celula: (l) => TIPO_LOCAL[l.tipo] },
    { titulo: 'Da funerária', celula: (l) => (l.proprio ? 'Sim' : 'Não') },
    { titulo: 'Preparação', celula: (l) => `${l.intervalo_preparacao_minutos} min` },
    {
      titulo: 'Situação',
      celula: (l) => (
        <Badge variant={l.ativo ? 'success' : 'neutral'}>{l.ativo ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
    ...(podeEditar
      ? [
          {
            titulo: 'Ações',
            celula: (l: LocalResponse) => (
              <span className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => aoEditar(l)}>
                  <Pencil /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    alterarStatus.mutate({ id: l.id_local, data: { ativo: !l.ativo } })
                  }
                >
                  {l.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ];
  return (
    <Card className="overflow-hidden">
      <Tabela colunas={colunas} linhas={locais} chave={(l) => l.id_local} />
    </Card>
  );
}
