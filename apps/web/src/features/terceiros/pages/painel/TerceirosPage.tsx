import {
  getListarTerceirosQueryKey,
  useAlterarStatusTerceiro,
  useListarTerceiros,
  type TerceiroResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { STATUS_TERCEIRO, TIPO_TERCEIRO } from '../../components/rotulos';
import { TerceiroDialog } from '../../components/TerceiroDialog';

const TAMANHO = 20;
const TIPOS = [
  { valor: 'TODOS', rotulo: 'Todos' },
  ...Object.entries(TIPO_TERCEIRO).map(([valor, rotulo]) => ({ valor, rotulo })),
];
const SITUACOES = [
  { valor: 'TODOS', rotulo: 'Todas' },
  { valor: 'ATIVO', rotulo: 'Ativos' },
  { valor: 'CONVIDADO', rotulo: 'Convite enviado' },
  { valor: 'INATIVO', rotulo: 'Inativos' },
];

/** Parceiros da funerária: translado, despachante ou cartório e fornecedores (FE-ADM-14, TER-01). */
export function TerceirosPage() {
  const [tipo, setTipo] = useState('TODOS');
  const [situacao, setSituacao] = useState('TODOS');
  const [pagina, setPagina] = useState(1);
  const consulta = useListarTerceiros({
    tipo: tipo === 'TODOS' ? undefined : tipo,
    status: situacao === 'TODOS' ? undefined : situacao,
    pagina,
    tamanho: TAMANHO,
  });
  const alterarStatus = useAlterarStatusTerceiro({
    mutation: { meta: { invalida: [getListarTerceirosQueryKey()] } },
  });
  const [edicao, setEdicao] = useState<{ terceiro: TerceiroResponse | null } | null>(null);

  const colunas: Coluna<TerceiroResponse>[] = [
    {
      titulo: 'Parceiro',
      celula: (t) => (
        <span className="flex flex-col">
          <span className="font-semibold">{t.nome_razao_social}</span>
          <span className="text-xs text-muted-foreground">{t.email}</span>
        </span>
      ),
    },
    { titulo: 'Tipo', celula: (t) => TIPO_TERCEIRO[t.tipo] },
    {
      titulo: 'Atuação',
      celula: (t) =>
        [
          ...(t.area_atuacao.ufs ?? []),
          ...(t.area_atuacao.cidades ?? []).map((c) => `${c.nome}-${c.uf}`),
        ].join(', ') || '—',
    },
    {
      titulo: 'Situação',
      celula: (t) => (
        <Badge variant={STATUS_TERCEIRO[t.status].variante}>
          {STATUS_TERCEIRO[t.status].rotulo}
        </Badge>
      ),
    },
    {
      titulo: 'Ações',
      celula: (t) => (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEdicao({ terceiro: t })}>
            <Pencil /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              alterarStatus.mutate({
                id: t.id_terceiro,
                data: { ativo: t.status === 'INATIVO' },
              })
            }
          >
            {t.status === 'INATIVO' ? 'Ativar' : 'Desativar'}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Gestão"
        titulo="Terceiros"
        descricao="Empresas de translado, despachantes e cartórios, e fornecedores que atendem a funerária."
        acoes={
          <Button onClick={() => setEdicao({ terceiro: null })}>
            <Plus /> Convidar parceiro
          </Button>
        }
      />
      <div className="flex flex-wrap justify-between gap-3">
        <Filtros
          opcoes={TIPOS}
          valor={tipo}
          aoMudar={(v) => {
            setTipo(v);
            setPagina(1);
          }}
        />
        <Filtros
          opcoes={SITUACOES}
          valor={situacao}
          aoMudar={(v) => {
            setSituacao(v);
            setPagina(1);
          }}
        />
      </div>
      <Card className="overflow-hidden">
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(p) => p.itens.length === 0}
          vazio={
            <Vazio
              titulo="Nenhum parceiro por aqui"
              descricao="Convide empresas de translado, despachantes e fornecedores."
            />
          }
        >
          {(p) => (
            <>
              <Tabela colunas={colunas} linhas={p.itens} chave={(t) => t.id_terceiro} />
              <Paginacao
                pagina={p.pagina}
                tamanho={p.tamanho}
                total={p.total}
                aoMudar={setPagina}
              />
            </>
          )}
        </EstadoConsulta>
      </Card>
      {edicao && <TerceiroDialog terceiro={edicao.terceiro} aoFechar={() => setEdicao(null)} />}
    </div>
  );
}
