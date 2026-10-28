import { useMeusContratos, type ContratoResumoResponse } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { CircleAlert, Clock } from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros } from '@/shared/components/Tabela';
import { data, numero, real } from '@/shared/lib/formatar';
import { PagarFaturaDialog } from '../../components/PagarFaturaDialog';
import { competencia, FORMA_PAGAMENTO, podePagar, STATUS_FATURA } from '../../components/rotulos';
import {
  faturaEmDestaque,
  useFaturasDosContratos,
  type FaturaResponse,
  type StatusFatura,
} from '../../hooks/faturas';

type Filtro = 'TODAS' | 'ABERTAS' | 'PROCESSANDO' | 'PAGA' | 'CANCELADA';
const FILTROS: { valor: Filtro; rotulo: string; status: StatusFatura[] | null }[] = [
  { valor: 'TODAS', rotulo: 'Todas', status: null },
  { valor: 'ABERTAS', rotulo: 'Em aberto', status: ['PENDENTE', 'VENCIDA'] },
  { valor: 'PROCESSANDO', rotulo: 'Em processamento', status: ['PROCESSANDO'] },
  { valor: 'PAGA', rotulo: 'Pagas', status: ['PAGA'] },
  { valor: 'CANCELADA', rotulo: 'Canceladas', status: ['CANCELADA'] },
];

/** Faturas e pagamento do titular (FE-CLI-06, GET /contratos/{id}/faturas). */
export function FaturasPage() {
  const contratos = useMeusContratos();
  // Contratos cancelados ainda mostram o histórico de faturas.
  const faturas = useFaturasDosContratos(contratos.data?.map((c) => c.id_contrato) ?? []);
  const [filtro, setFiltro] = useState<Filtro>('TODAS');
  const [pagando, setPagando] = useState<FaturaResponse | null>(null);

  const planoDe = new Map(contratos.data?.map((c) => [c.id_contrato, c]));
  const suspensos = contratos.data?.filter((c) => c.status === 'SUSPENSO') ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Pagamentos"
        descricao="Suas faturas, datas de vencimento e pagamentos já feitos."
      />

      <EstadoConsulta
        consulta={contratos}
        estaVazio={(lista) => lista.length === 0}
        vazio={
          <Card>
            <Vazio
              titulo="Nenhuma fatura por aqui"
              descricao="As faturas aparecem quando você contratar um plano."
            />
          </Card>
        }
      >
        {() => (
          <>
            {suspensos.map((contrato) => (
              <AvisoSuspenso
                key={contrato.id_contrato}
                contrato={contrato}
                atrasada={faturaEmDestaque(
                  (faturas.data ?? []).filter((f) => f.id_contrato === contrato.id_contrato),
                )}
                aoPagar={setPagando}
              />
            ))}

            <Filtros opcoes={FILTROS} valor={filtro} aoMudar={setFiltro} />

            <EstadoConsulta consulta={faturas}>
              {(todas) => {
                const status = FILTROS.find((f) => f.valor === filtro)?.status;
                const visiveis = status ? todas.filter((f) => status.includes(f.status)) : todas;
                if (visiveis.length === 0) {
                  return (
                    <Card>
                      <Vazio titulo="Nenhuma fatura neste filtro" />
                    </Card>
                  );
                }
                return (
                  <Card className="divide-y divide-border/70 overflow-hidden">
                    {visiveis.map((fatura) => (
                      <LinhaFatura
                        key={fatura.id_fatura}
                        fatura={fatura}
                        plano={
                          (contratos.data?.length ?? 0) > 1
                            ? planoDe.get(fatura.id_contrato)?.nome_plano
                            : undefined
                        }
                        aoPagar={() => setPagando(fatura)}
                      />
                    ))}
                  </Card>
                );
              }}
            </EstadoConsulta>
          </>
        )}
      </EstadoConsulta>

      <PagarFaturaDialog fatura={pagando} aoFechar={() => setPagando(null)} />
    </div>
  );
}

function LinhaFatura({
  fatura,
  plano,
  aoPagar,
}: {
  fatura: FaturaResponse;
  plano?: string;
  aoPagar: () => void;
}) {
  const status = STATUS_FATURA[fatura.status];
  const encargos = numero(fatura.valor_multa_juros);

  return (
    <article
      aria-label={`Fatura de ${competencia(fatura.competencia)}`}
      className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5"
    >
      <div className="min-w-44 flex-1">
        <p className="text-sm font-semibold first-letter:uppercase">
          {competencia(fatura.competencia)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {plano ? `${plano} · ` : ''}Vence em {data(fatura.data_vencimento)}
        </p>
        {fatura.status === 'VENCIDA' && encargos > 0 && (
          <p className="mt-1 text-xs text-warning-foreground">
            Multa e juros pelo atraso: {real(encargos)}
          </p>
        )}
        {fatura.status === 'PROCESSANDO' && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden />
            Pagamento recebido, aguardando a confirmação do banco. Isso não conta como atraso.
          </p>
        )}
        {fatura.status === 'PAGA' && fatura.data_pagamento && (
          <p className="mt-1 text-xs text-muted-foreground">
            Paga em {data(fatura.data_pagamento)}
            {fatura.forma_pagamento ? ` com ${FORMA_PAGAMENTO[fatura.forma_pagamento]}` : ''}
          </p>
        )}
      </div>
      <span className="text-sm font-semibold">{real(fatura.valor)}</span>
      <Badge variant={status.variante}>{status.rotulo}</Badge>
      <div className="w-24 text-right">
        {podePagar(fatura.status) && (
          <Button size="sm" onClick={aoPagar} disabled={!fatura.link_pagamento}>
            Pagar
          </Button>
        )}
      </div>
    </article>
  );
}

/** COB-03: plano suspenso por atraso. Explica o que muda e como reativar. */
function AvisoSuspenso({
  contrato,
  atrasada,
  aoPagar,
}: {
  contrato: ContratoResumoResponse;
  atrasada: FaturaResponse | undefined;
  aoPagar: (fatura: FaturaResponse) => void;
}) {
  return (
    <section role="alert" className="flex flex-wrap items-start gap-4 rounded-xl bg-warning p-6">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground" aria-hidden />
      <div className="min-w-60 flex-1">
        <h2 className="text-sm font-bold text-warning-foreground">
          O plano {contrato.nome_plano} está suspenso
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-warning-foreground/90">
          Há uma fatura em atraso. Enquanto ela não for paga, a cobertura do plano fica pausada e
          não pode ser usada num atendimento. Assim que o pagamento for confirmado, o plano volta a
          valer.
        </p>
      </div>
      {atrasada && podePagar(atrasada.status) && (
        <Button onClick={() => aoPagar(atrasada)} disabled={!atrasada.link_pagamento}>
          Pagar e reativar
        </Button>
      )}
    </section>
  );
}
