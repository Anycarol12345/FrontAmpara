import { useObterFuneral } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { TransladosDoFuneral } from '@/features/translado';
import { Abas, PainelDaAba } from '@/shared/components/Abas';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { DadosDoFuneral } from '../../components/DadosDoFuneral';
import { HistoricoDoFuneral } from '../../components/HistoricoDoFuneral';
import { STATUS_DO_FUNERAL } from '../../components/rotulosPainel';
import { LocalEAgenda } from '../../components/LocalEAgenda';
import { MontadorDeItens } from '../../components/MontadorDeItens';

const ABAS = [
  { id: 'dados', titulo: 'Dados' },
  { id: 'itens', titulo: 'Itens e personalização' },
  { id: 'local', titulo: 'Local e agenda' },
  { id: 'translado', titulo: 'Translado' },
  { id: 'documentos', titulo: 'Documentos' },
  { id: 'historico', titulo: 'Histórico' },
] as const;

function EmBreve() {
  return (
    <Card className="p-6">
      <Vazio titulo="Em breve" descricao="Esta aba ainda será construída." />
    </Card>
  );
}

/** Página do funeral para a equipe, com abas; a aba ativa fica na URL (?aba=) (FE-ADM-05). */
export function FuneralPainelPage() {
  const { id = '' } = useParams();
  const [parametros, setParametros] = useSearchParams();
  const consulta = useObterFuneral(id);
  const ativa = ABAS.find((aba) => aba.id === parametros.get('aba'))?.id ?? 'dados';

  const mudarAba = (aba: string) =>
    setParametros(aba === 'dados' ? {} : { aba }, { replace: true });

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/painel"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Visão geral
      </Link>
      <EstadoConsulta consulta={consulta}>
        {(funeral) => (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <PageHeader sobretitulo="Funeral" titulo={funeral.nome_falecido} />
              <Badge variant={STATUS_DO_FUNERAL[funeral.status].variante}>
                {STATUS_DO_FUNERAL[funeral.status].rotulo}
              </Badge>
            </div>
            <Abas abas={ABAS} ativa={ativa} aoMudar={mudarAba} rotulo="Seções do funeral" />
            <PainelDaAba id={ativa}>
              {ativa === 'dados' && <DadosDoFuneral funeral={funeral} />}
              {ativa === 'historico' && <HistoricoDoFuneral historico={funeral.historico} />}
              {ativa === 'itens' && <MontadorDeItens funeral={funeral} />}
              {ativa === 'local' && <LocalEAgenda funeral={funeral} />}
              {ativa === 'translado' && (
                <TransladosDoFuneral
                  idFuneral={funeral.id_funeral}
                  dataPrevista={funeral.data_hora_prevista}
                />
              )}
              {ativa === 'documentos' && <EmBreve />}
            </PainelDaAba>
          </>
        )}
      </EstadoConsulta>
    </div>
  );
}
