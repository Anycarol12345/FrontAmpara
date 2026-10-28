import { useMeusContratos } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { data, numero, real } from '@/shared/lib/formatar';
import { COBERTURA, PERIODICIDADE, STATUS_CONTRATO } from '../../components/rotulos';

/** Contratos do titular (FE-CLI-05, GET /contratos). */
export function MeusContratosPage() {
  const consulta = useMeusContratos();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Meus contratos"
        descricao="Seus planos, quem está protegido e a situação de cada um."
        acoes={
          <Button asChild>
            <Link to="/minha-conta/contratar">
              <Plus /> Contratar plano
            </Link>
          </Button>
        }
      />

      <EstadoConsulta
        consulta={consulta}
        estaVazio={(lista) => lista.length === 0}
        vazio={
          <Card>
            <Vazio
              titulo="Você ainda não tem um plano"
              descricao="Compare os planos com calma e escolha o que faz sentido para sua família."
              acao={
                <Button size="sm" asChild>
                  <Link to="/minha-conta/contratar">Conhecer os planos</Link>
                </Button>
              }
            />
          </Card>
        }
      >
        {(contratos) => (
          <ul className="flex flex-col gap-3">
            {contratos.map((contrato) => {
              const status = STATUS_CONTRATO[contrato.status];
              return (
                <li key={contrato.id_contrato}>
                  <Link
                    to={`/minha-conta/contratos/${contrato.id_contrato}`}
                    className="group block"
                  >
                    <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 p-6 transition-colors group-hover:border-ring/30">
                      <div className="min-w-[180px] flex-1">
                        <p className="text-[11px] text-muted-foreground">Plano</p>
                        <p className="text-lg font-bold">{contrato.nome_plano}</p>
                        <p className="text-xs text-muted-foreground">
                          {COBERTURA[contrato.tipo_cobertura]} ·{' '}
                          {numero(contrato.quantidade_pessoas)}{' '}
                          {numero(contrato.quantidade_pessoas) === 1 ? 'pessoa' : 'pessoas'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Valor</p>
                        <p className="font-semibold">
                          {real(contrato.valor_total)}
                          <span className="text-xs font-normal text-muted-foreground">
                            {PERIODICIDADE[contrato.periodicidade].sufixo}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Desde</p>
                        <p className="font-semibold">{data(contrato.data_contratacao)}</p>
                      </div>
                      <Badge variant={status.variante}>{status.rotulo}</Badge>
                      <ChevronRight className="size-4 text-subtle-foreground" />
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </EstadoConsulta>
    </div>
  );
}
