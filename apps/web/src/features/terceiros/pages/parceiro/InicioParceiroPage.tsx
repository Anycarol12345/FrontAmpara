import { useMinhasAtribuicoes, type AtribuicaoResponse } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useTransladoTempoReal } from '@/features/translado';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros } from '@/shared/components/Tabela';
import { dataHora } from '@/shared/lib/formatar';
import {
  descricaoCurta,
  STATUS_ATRIBUICAO,
  tempoRestante,
  TIPO_ATRIBUICAO,
} from '../../components/atribuicoes';
import { ResponderAtribuicao } from '../../components/ResponderAtribuicao';

const GRUPOS = [
  { valor: 'PENDENTE', rotulo: 'Para responder' },
  { valor: 'ACEITA', rotulo: 'Em andamento' },
  { valor: 'ENCERRADAS', rotulo: 'Encerradas' },
];

/** Portal do parceiro: serviços atribuídos, com aceite e recusa dentro do prazo (FE-TER-01, TER-02). */
export function InicioParceiroPage() {
  const [grupo, setGrupo] = useState('PENDENTE');
  const consulta = useMinhasAtribuicoes();
  useTransladoTempoReal();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        sobretitulo="Portal do parceiro"
        titulo="Suas atribuições"
        descricao="Responda dentro do prazo: depois dele, a funerária passa o serviço para outro parceiro."
      />
      <Filtros opcoes={GRUPOS} valor={grupo} aoMudar={setGrupo} />
      <EstadoConsulta consulta={consulta}>
        {(todas) => {
          const lista = todas
            .filter((a) =>
              grupo === 'ENCERRADAS'
                ? a.status !== 'PENDENTE' && a.status !== 'ACEITA'
                : a.status === grupo,
            )
            .sort((a, b) => a.prazo_aceite.localeCompare(b.prazo_aceite));
          return lista.length === 0 ? (
            <Card>
              <Vazio
                titulo={grupo === 'PENDENTE' ? 'Nada para responder agora' : 'Nenhum serviço aqui'}
                descricao="Quando a funerária atribuir um serviço a você, ele aparece aqui."
              />
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {lista.map((a) => (
                <li key={a.id_atribuicao}>
                  <CartaoAtribuicao atribuicao={a} />
                </li>
              ))}
            </ul>
          );
        }}
      </EstadoConsulta>
    </div>
  );
}

function CartaoAtribuicao({ atribuicao: a }: { atribuicao: AtribuicaoResponse }) {
  const { titulo, detalhe, quando } = descricaoCurta(a);
  const situacao = STATUS_ATRIBUICAO[a.status];
  const conteudo = (
    <>
      <div className="flex flex-wrap-reverse items-start justify-between gap-2">
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle-foreground">
            {TIPO_ATRIBUICAO[a.tipo]}
          </p>
          <p className="mt-1 text-base font-bold">{titulo}</p>
          <p className="text-sm text-muted-foreground">{detalhe}</p>
          {quando && <p className="mt-1 text-xs">{dataHora(quando)}</p>}
        </div>
        <Badge variant={situacao.variante}>{situacao.rotulo}</Badge>
      </div>
      {a.status === 'RECUSADA' && a.motivo_recusa && (
        <p className="text-xs text-muted-foreground">Motivo: {a.motivo_recusa}</p>
      )}
    </>
  );

  if (a.status === 'PENDENTE') {
    return (
      <Card className="flex flex-col gap-4 p-5">
        {conteudo}
        <p className="flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
          <Clock className="size-3.5" aria-hidden /> Responda {tempoRestante(a.prazo_aceite)}
        </p>
        <ResponderAtribuicao atribuicao={a} />
      </Card>
    );
  }
  if (a.status === 'ACEITA') {
    return (
      <Link
        to={`/parceiro/atribuicoes/${a.id_atribuicao}`}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Card className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/40">
          {conteudo}
          <span className="flex items-center gap-1 self-end text-xs font-semibold">
            Abrir serviço <ChevronRight className="size-3.5" aria-hidden />
          </span>
        </Card>
      </Link>
    );
  }
  return <Card className="flex flex-col gap-3 p-5 opacity-80">{conteudo}</Card>;
}
