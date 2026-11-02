import {
  getListarFunerariasQueryKey,
  useAlterarStatusFuneraria,
  useListarFunerarias,
  type FunerariaListaResponse,
  type OrigemCadastro,
  type StatusFuneraria,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { Building2, Hourglass, PauseCircle, Plus, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { Filtros, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { data } from '@/shared/lib/formatar';
import { mascararCnpj } from '@/shared/lib/mascaras';
import { FunerariaDialog } from '../../components/FunerariaDialog';

const TAMANHO = 20;
const STATUS: Record<
  StatusFuneraria,
  { rotulo: string; variante: 'success' | 'warning' | 'neutral' }
> = {
  PENDENTE: { rotulo: 'Aguardando aprovação', variante: 'warning' },
  ATIVA: { rotulo: 'Ativa', variante: 'success' },
  SUSPENSA: { rotulo: 'Suspensa', variante: 'neutral' },
};
const ORIGEM: Record<OrigemCadastro, string> = {
  AUTO: 'Auto-cadastro',
  CONSULTOR: 'Consultor',
  ADMIN: 'Plataforma',
};
const FILTROS = [
  { valor: 'TODAS', rotulo: 'Todas' },
  { valor: 'PENDENTE', rotulo: 'Aguardando aprovação' },
  { valor: 'ATIVA', rotulo: 'Ativas' },
  { valor: 'SUSPENSA', rotulo: 'Suspensas' },
];

type Acao = { funeraria: FunerariaListaResponse; para: StatusFuneraria };

const TEXTO_ACAO: Record<StatusFuneraria, { titulo: string; descricao: string; botao: string }> = {
  ATIVA: {
    titulo: 'Liberar a funerária?',
    descricao: 'O gestor passa a entrar no painel e a funerária pode vender planos.',
    botao: 'Liberar',
  },
  SUSPENSA: {
    titulo: 'Suspender a funerária?',
    descricao:
      'A equipe e os clientes perdem o acesso até a reativação. Contratos e dados continuam guardados.',
    botao: 'Suspender',
  },
  PENDENTE: { titulo: '', descricao: '', botao: '' },
};

/** Funerárias da plataforma: aprovação do auto-cadastro, suspensão e reativação (FE-PLT-01, TEN-01, TEN-02). */
export function PainelPlataformaPage() {
  const [status, setStatus] = useState('TODAS');
  const [busca, setBusca] = useState('');
  const buscaAdiada = useDeferredValue(busca.trim());
  const [pagina, setPagina] = useState(1);
  const consulta = useListarFunerarias({
    status: status === 'TODAS' ? undefined : (status as StatusFuneraria),
    busca: buscaAdiada || undefined,
    pagina,
    tamanho: TAMANHO,
  });
  const pendentes = useListarFunerarias({ status: 'PENDENTE', tamanho: 1 });
  const ativas = useListarFunerarias({ status: 'ATIVA', tamanho: 1 });
  const suspensas = useListarFunerarias({ status: 'SUSPENSA', tamanho: 1 });
  const alterar = useAlterarStatusFuneraria({
    mutation: { meta: { invalida: [getListarFunerariasQueryKey()] } },
  });
  const [acao, setAcao] = useState<Acao | null>(null);
  const [cadastrando, setCadastrando] = useState(false);

  const colunas: Coluna<FunerariaListaResponse>[] = [
    {
      titulo: 'Funerária',
      celula: (f) => (
        <span className="flex flex-col">
          <span className="font-semibold">{f.nome_fantasia}</span>
          <span className="text-xs text-muted-foreground">
            {f.razao_social} · {mascararCnpj(f.cnpj)}
          </span>
        </span>
      ),
    },
    {
      titulo: 'Endereço',
      celula: (f) => (
        <span className="flex flex-col">
          <span className="font-mono text-xs">{f.slug}</span>
          <span className="text-xs text-muted-foreground">{f.email_contato}</span>
        </span>
      ),
    },
    {
      titulo: 'Cadastro',
      celula: (f) => (
        <span className="flex flex-col text-xs">
          <span>{f.origem_cadastro ? ORIGEM[f.origem_cadastro] : '—'}</span>
          <span className="text-muted-foreground">{data(f.criada_em)}</span>
        </span>
      ),
    },
    {
      titulo: 'Situação',
      celula: (f) =>
        f.status && <Badge variant={STATUS[f.status].variante}>{STATUS[f.status].rotulo}</Badge>,
    },
    {
      titulo: 'Ações',
      celula: (f) =>
        f.id_tenant && (
          <span className="flex gap-1">
            {f.status === 'PENDENTE' && (
              <Button size="sm" onClick={() => setAcao({ funeraria: f, para: 'ATIVA' })}>
                Aprovar
              </Button>
            )}
            {f.status === 'SUSPENSA' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAcao({ funeraria: f, para: 'ATIVA' })}
              >
                Reativar
              </Button>
            )}
            {f.status === 'ATIVA' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAcao({ funeraria: f, para: 'SUSPENSA' })}
              >
                Suspender
              </Button>
            )}
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Plataforma"
        titulo="Funerárias"
        descricao="Aprove os auto-cadastros e acompanhe as funerárias da plataforma."
        acoes={
          <Button onClick={() => setCadastrando(true)}>
            <Plus /> Cadastrar funerária
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          rotulo="Aguardando aprovação"
          valor={String(pendentes.data?.total ?? '—')}
          detalhe="Auto-cadastros para revisar"
          icone={Hourglass}
        />
        <StatCard
          rotulo="Ativas"
          valor={String(ativas.data?.total ?? '—')}
          detalhe="Vendendo planos"
          icone={Building2}
        />
        <StatCard
          rotulo="Suspensas"
          valor={String(suspensas.data?.total ?? '—')}
          detalhe="Sem acesso até reativar"
          icone={PauseCircle}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Filtros
          opcoes={FILTROS}
          valor={status}
          aoMudar={(v) => {
            setStatus(v);
            setPagina(1);
          }}
        />
        <label className="relative">
          <span className="sr-only">Buscar funerária</span>
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="w-64 pl-9"
            placeholder="Nome, CNPJ ou endereço"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </label>
      </div>
      <Card className="overflow-hidden">
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(p) => p.itens.length === 0}
          vazio={<Vazio titulo="Nenhuma funerária encontrada" />}
        >
          {(p) => (
            <>
              <Tabela colunas={colunas} linhas={p.itens} chave={(f) => f.id_tenant ?? f.slug} />
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

      {acao && (
        <Dialog open onOpenChange={(aberto) => !aberto && setAcao(null)}>
          <DialogContent className="max-w-md">
            <DialogTitle>{TEXTO_ACAO[acao.para].titulo}</DialogTitle>
            <DialogDescription>
              <strong className="font-semibold">{acao.funeraria.nome_fantasia}</strong>.{' '}
              {TEXTO_ACAO[acao.para].descricao}
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAcao(null)}>
                Voltar
              </Button>
              <Button
                disabled={alterar.isPending}
                onClick={() =>
                  alterar.mutate(
                    { id: acao.funeraria.id_tenant!, data: { status: acao.para } },
                    {
                      onSuccess: () => {
                        toast.success(
                          acao.para === 'SUSPENSA' ? 'Funerária suspensa.' : 'Funerária liberada.',
                        );
                        setAcao(null);
                      },
                    },
                  )
                }
              >
                {TEXTO_ACAO[acao.para].botao}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {cadastrando && <FunerariaDialog aoFechar={() => setCadastrando(false)} />}
    </div>
  );
}
