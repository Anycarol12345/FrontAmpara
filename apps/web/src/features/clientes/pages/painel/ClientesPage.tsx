import {
  useBuscarClientes,
  type ClienteResumoResponse,
  type ContratoResumoResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { CircleAlert, Clock, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { STATUS_CONTRATO } from '@/features/contratos';
import { contarPorStatus, contratoPorCliente, useTodosContratos } from '@/features/vendas';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { CampoBusca, Filtros, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { StatCard } from '@/shared/components/StatCard';
import { useAtraso } from '@/shared/hooks/useAtraso';
import { data, numero } from '@/shared/lib/formatar';
import { somenteDigitos } from '@/shared/lib/mascaras';

const TAMANHO = 20;

type FiltroSituacao = 'TODOS' | 'ATIVO' | 'A_PAGAR' | 'SUSPENSO' | 'SEM_CONTRATO';
const FILTROS: { valor: FiltroSituacao; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'ATIVO', rotulo: 'Em dia' },
  { valor: 'A_PAGAR', rotulo: 'Aguardando pagamento' },
  { valor: 'SUSPENSO', rotulo: 'Em atraso' },
  { valor: 'SEM_CONTRATO', rotulo: 'Sem plano' },
];

function colunas(
  contratos: Map<string, ContratoResumoResponse> | undefined,
): Coluna<ClienteResumoResponse>[] {
  const contrato = (c: ClienteResumoResponse) =>
    c.id_cliente ? contratos?.get(c.id_cliente) : undefined;
  return [
    {
      titulo: 'Cliente',
      celula: (c) => (
        <span className="flex flex-col">
          <span className="font-semibold">{c.nome}</span>
          <span className="text-xs text-muted-foreground">{c.email}</span>
        </span>
      ),
    },
    {
      titulo: 'Plano',
      celula: (c) => {
        const ct = contrato(c);
        return (
          <span className="flex flex-col">
            <span>{ct ? ct.nome_plano : contratos ? 'Sem plano' : '…'}</span>
            <span className="text-xs text-muted-foreground">
              {numero(c.quantidade_dependentes)} dependente(s)
            </span>
          </span>
        );
      },
    },
    {
      titulo: 'Cliente desde',
      celula: (c) => (contrato(c) ? data(contrato(c)!.data_contratacao) : '—'),
    },
    { titulo: 'Telefone', celula: (c) => c.telefone ?? '—' },
    {
      titulo: 'Situação',
      celula: (c) => {
        const ct = contrato(c);
        if (!ct) return contratos ? <Badge variant="neutral">Sem plano</Badge> : null;
        return (
          <Badge variant={STATUS_CONTRATO[ct.status].variante}>
            {ct.status === 'SUSPENSO' ? 'Em atraso' : STATUS_CONTRATO[ct.status].rotulo}
          </Badge>
        );
      },
    },
  ];
}

/** Carteira de clientes da funerária, com o plano e a situação de cada um (FE-ADM-02). */
export function ClientesPage() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState<FiltroSituacao>('TODOS');
  const [pagina, setPagina] = useState(1);
  const termo = useAtraso(busca.trim());
  // Só números (11 dígitos ou mais de 3) busca por CPF; o resto, pelo nome.
  const porCpf = /^[\d.\-\s]+$/.test(termo) && somenteDigitos(termo).length >= 3;
  const consulta = useBuscarClientes({
    ...(termo && (porCpf ? { cpf: somenteDigitos(termo) } : { nome: termo })),
    ...(situacao !== 'TODOS' && { status_contrato: situacao }),
    pagina,
    tamanho: TAMANHO,
    ordenarPor: 'nome',
  });
  // Plano e situação de cada cliente vêm do contrato mais recente dele.
  const contratos = useTodosContratos();
  const porCliente = contratos.data ? contratoPorCliente(contratos.data) : undefined;
  const status = porCliente ? contarPorStatus([...porCliente.values()]) : undefined;
  const indicador = (n: number | undefined) => (n === undefined ? '…' : String(n).padStart(2, '0'));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Atendimento"
        titulo="Clientes"
        descricao="Sua carteira de famílias com plano contratado, pagamentos e situação de cada uma."
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          rotulo="Clientes em dia"
          valor={indicador(status?.ATIVO)}
          detalhe="Com o plano pago"
          icone={UsersRound}
        />
        <StatCard
          rotulo="Aguardando pagamento"
          valor={indicador(status?.A_PAGAR)}
          detalhe="Contrataram e ainda não pagaram"
          icone={Clock}
        />
        <StatCard
          rotulo="Em atraso"
          valor={indicador(status?.SUSPENSO)}
          detalhe="Plano suspenso por fatura vencida"
          icone={CircleAlert}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-base font-bold">Carteira de clientes</h2>
            <p className="text-xs text-muted-foreground">
              {consulta.data ? `${consulta.data.total} clientes` : 'Carregando…'}
            </p>
          </div>
          <CampoBusca
            valor={busca}
            aoMudar={(valor) => {
              setBusca(valor);
              setPagina(1);
            }}
            placeholder="Buscar por nome ou CPF"
          />
        </div>
        <div className="px-5 pb-4">
          <Filtros
            opcoes={FILTROS}
            valor={situacao}
            aoMudar={(v) => {
              setSituacao(v);
              setPagina(1);
            }}
          />
        </div>
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(dados) => dados.itens.length === 0}
          vazio={
            <Vazio
              titulo={
                termo || situacao !== 'TODOS' ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'
              }
            />
          }
        >
          {(dados) => (
            <>
              <Tabela
                colunas={colunas(porCliente)}
                linhas={dados.itens}
                chave={(c) => c.id_cliente ?? c.cpf}
                aoClicar={(c) => c.id_cliente && void navigate(`/painel/clientes/${c.id_cliente}`)}
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
