import {
  ehApiError,
  useListarFunerais,
  useObterCertidao,
  type FuneralResumoResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { Link } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { data, dataHora } from '@/shared/lib/formatar';
import { STATUS_CERTIDAO } from '../../components/rotulos';

const TAMANHO = 20;
const SITUACOES = [
  { valor: 'ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'CONCLUIDO', rotulo: 'Concluídos' },
  { valor: 'TODOS', rotulo: 'Todos' },
];

/** Certidões e documentos de cada funeral, com o prazo legal do registro (FE-ADM-08, CER-03). */
export function DocumentosPage() {
  const [situacao, setSituacao] = useState('ANDAMENTO');
  const [pagina, setPagina] = useState(1);
  // "Em andamento" junta registrados, em preparação e em velório: a API filtra um status por vez.
  const consulta = useListarFunerais({
    status: situacao === 'CONCLUIDO' ? 'CONCLUIDO' : undefined,
    pagina,
    tamanho: TAMANHO,
  });

  const colunas: Coluna<FuneralResumoResponse>[] = [
    {
      titulo: 'Falecido(a)',
      celula: (f) => (
        <Link
          to={`/painel/funerais/${f.id_funeral}?aba=documentos`}
          className="font-semibold hover:underline"
        >
          {f.nome_falecido}
        </Link>
      ),
    },
    { titulo: 'Cerimônia', celula: (f) => dataHora(f.data_hora_prevista) },
    {
      titulo: 'Certidão de óbito',
      celula: (f) => <SituacaoCertidao idBeneficiario={f.id_beneficiario} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Equipe"
        titulo="Documentos"
        descricao="Certidões de óbito e documentos dos falecidos. Abra o funeral para anexar e acompanhar."
      />
      <Filtros
        opcoes={SITUACOES}
        valor={situacao}
        aoMudar={(v) => {
          setSituacao(v);
          setPagina(1);
        }}
      />
      <Card className="overflow-hidden">
        <EstadoConsulta consulta={consulta}>
          {(p) => {
            const itens =
              situacao === 'ANDAMENTO'
                ? p.itens.filter((f) => f.status !== 'CONCLUIDO' && f.status !== 'CANCELADO')
                : p.itens;
            return itens.length === 0 ? (
              <Vazio titulo="Nenhum funeral por aqui" />
            ) : (
              <>
                <Tabela colunas={colunas} linhas={itens} chave={(f) => f.id_funeral} />
                <Paginacao
                  pagina={p.pagina}
                  tamanho={p.tamanho}
                  total={p.total}
                  aoMudar={setPagina}
                />
              </>
            );
          }}
        </EstadoConsulta>
      </Card>
    </div>
  );
}

function SituacaoCertidao({ idBeneficiario }: { idBeneficiario: string }) {
  const certidao = useObterCertidao(idBeneficiario, {
    query: { meta: { silenciarErro: true }, retry: false },
  });
  if (certidao.isPending) return <span className="text-xs text-muted-foreground">...</span>;
  if (ehApiError(certidao.error) && certidao.error.status === 404)
    return <Badge variant="warning">Não pedida</Badge>;
  if (!certidao.data) return <span className="text-xs text-muted-foreground">—</span>;
  const { status, prazo } = certidao.data;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge variant={STATUS_CERTIDAO[status].variante}>{STATUS_CERTIDAO[status].rotulo}</Badge>
      {status !== 'EMITIDA' && (
        <span className={prazo.vencido ? 'text-xs font-semibold text-destructive' : 'text-xs'}>
          {prazo.vencido ? `Prazo venceu em ${data(prazo.data)}` : `Prazo: ${data(prazo.data)}`}
        </span>
      )}
    </span>
  );
}
