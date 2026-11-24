import {
  useBuscarContratos,
  type ContratoResumoResponse,
  type StatusContrato,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { data, numero, real } from '@/shared/lib/formatar';
import { COBERTURA, PERIODICIDADE, STATUS_CONTRATO } from '../../components/rotulos';

const TAMANHO = 20;

const COLUNAS_CONTRATO: Coluna<ContratoResumoResponse>[] = [
  { titulo: 'Titular', celula: (c) => <span className="font-semibold">{c.nome_titular}</span> },
  {
    titulo: 'Plano',
    celula: (c) => (
      <span className="flex flex-col">
        <span>{c.nome_plano}</span>
        <span className="text-xs text-muted-foreground">
          {COBERTURA[c.tipo_cobertura]} · {numero(c.quantidade_pessoas)} pessoa(s)
        </span>
      </span>
    ),
  },
  {
    titulo: 'Valor',
    celula: (c) => `${real(c.valor_total)}${PERIODICIDADE[c.periodicidade].sufixo}`,
  },
  { titulo: 'Desde', celula: (c) => data(c.data_contratacao) },
  {
    titulo: 'Situação',
    celula: (c) => (
      <Badge variant={STATUS_CONTRATO[c.status].variante}>{STATUS_CONTRATO[c.status].rotulo}</Badge>
    ),
  },
];

type FiltroStatus = 'TODOS' | StatusContrato;
const FILTROS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'ATIVO', rotulo: 'Em dia' },
  { valor: 'A_PAGAR', rotulo: 'Aguardando pagamento' },
  { valor: 'SUSPENSO', rotulo: 'Suspensos' },
  { valor: 'CANCELADO', rotulo: 'Cancelados' },
];

/** Contratos da funerária (FE-ADM-03, GET /gestao/contratos). */
export function ContratosPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<FiltroStatus>('TODOS');
  const [pagina, setPagina] = useState(1);
  const consulta = useBuscarContratos({
    ...(status !== 'TODOS' && { status }),
    pagina,
    tamanho: TAMANHO,
    ordenarPor: 'data_contratacao',
    direcao: 'desc',
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Atendimento"
        titulo="Contratos"
        descricao="Planos contratados pelos clientes da funerária."
      />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-base font-bold">Todos os contratos</h2>
            <p className="text-xs text-muted-foreground">
              {consulta.data ? `${consulta.data.total} contratos` : 'Carregando…'}
            </p>
          </div>
          <Filtros
            opcoes={FILTROS}
            valor={status}
            aoMudar={(valor) => {
              setStatus(valor);
              setPagina(1);
            }}
          />
        </div>
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(dados) => dados.itens.length === 0}
          vazio={<Vazio titulo="Nenhum contrato encontrado" />}
        >
          {(dados) => (
            <>
              <Tabela
                colunas={COLUNAS_CONTRATO}
                linhas={dados.itens}
                chave={(c) => c.id_contrato}
                aoClicar={(c) => void navigate(`/painel/contratos/${c.id_contrato}`)}
              />
              <Paginacao
                pagina={numero(dados.pagina)}
                tamanho={numero(dados.tamanho)}
                total={numero(dados.total)}
                aoMudar={setPagina}
              />
            </>
          )}
        </EstadoConsulta>
      </Card>
    </div>
  );
}

/** Contratos de um cliente, na ficha dele (FE-ADM-02). */
export function ContratosDoCliente({ cpf }: { cpf: string }) {
  const navigate = useNavigate();
  const consulta = useBuscarContratos({ cpf, pagina: 1, tamanho: 50 });
  return (
    <Card className="overflow-hidden">
      <h2 className="p-6 pb-2 text-sm font-bold">Contratos</h2>
      <EstadoConsulta
        consulta={consulta}
        estaVazio={(dados) => dados.itens.length === 0}
        vazio={<p className="px-6 pb-6 text-sm text-muted-foreground">Nenhum contrato ainda.</p>}
      >
        {(dados) => (
          <Tabela
            colunas={COLUNAS_CONTRATO.filter((c) => c.titulo !== 'Titular')}
            linhas={dados.itens}
            chave={(c) => c.id_contrato}
            aoClicar={(c) => void navigate(`/painel/contratos/${c.id_contrato}`)}
          />
        )}
      </EstadoConsulta>
    </Card>
  );
}
