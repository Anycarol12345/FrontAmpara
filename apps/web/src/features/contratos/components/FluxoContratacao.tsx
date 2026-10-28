import {
  ehApiError,
  useListarPlanos,
  useObterPlano,
  type ContratarRequest,
  type DependenteResponse,
  type Periodicidade,
  type PlanoResponse,
  type PlanoResumoResponse,
  type TipoCobertura,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Label } from '@ampara/ui/components/label';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { DependenteDialog } from '@/features/clientes';
import { ErroFormulario } from '@/shared/components/Campo';
import { Carregando, EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { numero, real } from '@/shared/lib/formatar';
import { COBERTURA, PERIODICIDADE } from './rotulos';

const ETAPAS = ['Plano', 'Pessoas', 'Pagamento', 'Resumo'] as const;
// Dias oferecidos quando a funerária deixa o cliente escolher (padrão do TEN-03).
const DIAS_VENCIMENTO = [5, 10, 15, 20, 25];

type Escolhas = {
  idPlano: string | null;
  cobertura: TipoCobertura;
  dependentes: string[];
  periodicidade: Periodicidade;
  diaVencimento: number;
};

type ConsultaDependentes = {
  data: DependenteResponse[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
};

type FluxoContratacaoProps = {
  /** Plano já escolhido (ex.: ?plano= vindo da landing). */
  idPlanoInicial?: string | null;
  /** Dependentes do titular que podem entrar no contrato. */
  dependentes: ConsultaDependentes;
  /** O cliente cadastra dependentes na hora; a equipe usa os já cadastrados. */
  permitirIncluirDependente: boolean;
  /** Cria o contrato (POST /contratos ou /gestao/contratos) e devolve o id. */
  confirmar: (dados: ContratarRequest) => Promise<{ id_contrato: string }>;
  aoConcluir: (idContrato: string) => void;
};

/**
 * Contratação em etapas: plano, pessoas, pagamento e resumo.
 * Usada pelo cliente (FE-CLI-04) e pela equipe para um cliente (FE-ADM-03).
 */
export function FluxoContratacao({
  idPlanoInicial = null,
  dependentes,
  permitirIncluirDependente,
  confirmar,
  aoConcluir,
}: FluxoContratacaoProps) {
  const [etapa, setEtapa] = useState(0);
  const [escolhas, setEscolhas] = useState<Escolhas>({
    idPlano: idPlanoInicial,
    cobertura: 'TITULAR',
    dependentes: [],
    periodicidade: 'MENSAL',
    diaVencimento: 10,
  });
  const atualizar = (parcial: Partial<Escolhas>) =>
    setEscolhas((atual) => ({ ...atual, ...parcial }));

  const planos = useListarPlanos();
  const plano = useObterPlano(escolhas.idPlano ?? '', {
    query: { enabled: Boolean(escolhas.idPlano) },
  });

  return (
    <div className="flex flex-col gap-6">
      <Progresso etapa={etapa} />

      {etapa === 0 && (
        <EstadoConsulta consulta={planos}>
          {(lista) => (
            <EscolherPlano
              planos={[...lista]
                .filter((p) => p.ativo)
                .sort((a, b) => numero(a.valor_mensal) - numero(b.valor_mensal))}
              selecionado={escolhas.idPlano}
              aoEscolher={(idPlano) =>
                atualizar({ idPlano, cobertura: 'TITULAR', dependentes: [] })
              }
            />
          )}
        </EstadoConsulta>
      )}

      {etapa > 0 && !plano.data && <Carregando />}
      {etapa === 1 && plano.data && (
        <EscolherPessoas
          plano={plano.data}
          escolhas={escolhas}
          atualizar={atualizar}
          dependentes={dependentes}
          permitirIncluir={permitirIncluirDependente}
        />
      )}
      {etapa === 2 && plano.data && (
        <EscolherPagamento plano={plano.data} escolhas={escolhas} atualizar={atualizar} />
      )}
      {etapa === 3 && plano.data && (
        <Resumo
          plano={plano.data}
          escolhas={escolhas}
          confirmar={confirmar}
          aoConcluir={aoConcluir}
        />
      )}

      {etapa < 3 && (
        <div className="flex justify-between">
          {etapa > 0 ? (
            <Button variant="ghost" onClick={() => setEtapa((e) => e - 1)}>
              <ArrowLeft /> Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={!podeAvancar(etapa, escolhas)} onClick={() => setEtapa((e) => e + 1)}>
            Continuar <ArrowRight />
          </Button>
        </div>
      )}
      {etapa === 3 && (
        <Button variant="ghost" className="self-start" onClick={() => setEtapa(2)}>
          <ArrowLeft /> Voltar
        </Button>
      )}
    </div>
  );
}

function podeAvancar(etapa: number, escolhas: Escolhas) {
  if (etapa === 0) return Boolean(escolhas.idPlano);
  if (etapa === 1) return escolhas.cobertura === 'TITULAR' || escolhas.dependentes.length > 0;
  return true;
}

function Progresso({ etapa }: { etapa: number }) {
  return (
    <ol aria-label="Etapas da contratação" className="flex max-w-xl items-center gap-2">
      {ETAPAS.map((titulo, i) => (
        <li
          key={titulo}
          aria-current={i === etapa ? 'step' : undefined}
          className="flex flex-1 items-center gap-2"
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
              i < etapa && 'bg-primary text-primary-foreground',
              i === etapa && 'border-2 border-primary text-primary',
              i > etapa && 'border border-input text-subtle-foreground',
            )}
          >
            {i < etapa ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn('text-xs', i === etapa ? 'font-semibold' : 'text-muted-foreground')}>
            {titulo}
          </span>
          {i < ETAPAS.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function Opcao({
  ativo,
  aoClicar,
  children,
  className,
}: {
  ativo: boolean;
  aoClicar: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={aoClicar}
      className={cn(
        'rounded-xl border-2 bg-card p-6 text-left transition-colors',
        ativo
          ? 'border-primary shadow-md shadow-primary/10'
          : 'border-transparent hover:border-border',
        className,
      )}
    >
      {children}
    </button>
  );
}

function EscolherPlano({
  planos,
  selecionado,
  aoEscolher,
}: {
  planos: PlanoResumoResponse[];
  selecionado: string | null;
  aoEscolher: (id: string) => void;
}) {
  if (planos.length === 0) {
    return <p className="text-sm text-muted-foreground">A funerária ainda não publicou planos.</p>;
  }
  return (
    <div role="radiogroup" aria-label="Plano" className="grid gap-4 md:grid-cols-3">
      {planos.map((plano) => (
        <Opcao
          key={plano.id_plano}
          ativo={selecionado === plano.id_plano}
          aoClicar={() => aoEscolher(plano.id_plano!)}
        >
          <p className="text-[11px] text-muted-foreground">Plano</p>
          <p className="text-xl font-bold">{plano.nome}</p>
          {plano.descricao && (
            <p className="mt-1 text-xs text-muted-foreground">{plano.descricao}</p>
          )}
          <p className="mt-4 text-2xl font-bold">
            {real(plano.valor_mensal)}
            <span className="text-xs font-normal text-muted-foreground">/mês</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Carência de {numero(plano.carencia_dias)} dias · até {numero(plano.limite_dependentes)}{' '}
            dependentes
          </p>
        </Opcao>
      ))}
    </div>
  );
}

type PassoProps = {
  plano: PlanoResponse;
  escolhas: Escolhas;
  atualizar: (parcial: Partial<Escolhas>) => void;
};

function EscolherPessoas({
  plano,
  escolhas,
  atualizar,
  dependentes,
  permitirIncluir,
}: PassoProps & { dependentes: ConsultaDependentes; permitirIncluir: boolean }) {
  const [incluindo, setIncluindo] = useState(false);
  const limite = numero(plano.limite_dependentes);
  const coberturas: TipoCobertura[] = [
    'TITULAR',
    ...(limite > 0 ? (['TITULAR_E_DEPENDENTES'] as const) : []),
    ...(plano.permite_somente_dependente && limite > 0 ? (['SOMENTE_DEPENDENTES'] as const) : []),
  ];
  const comDependentes = escolhas.cobertura !== 'TITULAR';

  function alternar(id: string) {
    const marcado = escolhas.dependentes.includes(id);
    if (!marcado && escolhas.dependentes.length >= limite) return;
    atualizar({
      dependentes: marcado
        ? escolhas.dependentes.filter((d) => d !== id)
        : [...escolhas.dependentes, id],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Quem fica protegido" className="grid gap-4 md:grid-cols-3">
        {coberturas.map((cobertura) => (
          <Opcao
            key={cobertura}
            ativo={escolhas.cobertura === cobertura}
            aoClicar={() =>
              atualizar({
                cobertura,
                dependentes: cobertura === 'TITULAR' ? [] : escolhas.dependentes,
              })
            }
          >
            <p className="font-bold">{COBERTURA[cobertura]}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {cobertura === 'TITULAR'
                ? 'Somente você.'
                : `Até ${limite} dependentes, ${real(plano.valor_dependente_mensal)}/mês cada.`}
            </p>
          </Opcao>
        ))}
      </div>

      {comDependentes && (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">Quem você quer incluir?</h2>
              <p className="text-xs text-muted-foreground">
                {escolhas.dependentes.length} de {limite} escolhidos
              </p>
            </div>
            {permitirIncluir && (
              <Button size="sm" variant="outline" onClick={() => setIncluindo(true)}>
                <Plus /> Novo dependente
              </Button>
            )}
          </div>
          <EstadoConsulta consulta={dependentes}>
            {(lista) =>
              lista.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Cadastre as pessoas da família para incluí-las no plano.
                </p>
              ) : (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {lista.map((dep) => {
                    const id = `dep-${dep.id_dependente}`;
                    const marcado = escolhas.dependentes.includes(dep.id_dependente);
                    return (
                      <li
                        key={dep.id_dependente}
                        className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3"
                      >
                        <Checkbox
                          id={id}
                          checked={marcado}
                          disabled={!marcado && escolhas.dependentes.length >= limite}
                          onCheckedChange={() => alternar(dep.id_dependente)}
                        />
                        <Label htmlFor={id} className="flex flex-col font-normal">
                          <span className="font-semibold">{dep.nome}</span>
                          <span className="text-xs text-muted-foreground">{dep.parentesco}</span>
                        </Label>
                      </li>
                    );
                  })}
                </ul>
              )
            }
          </EstadoConsulta>
        </Card>
      )}

      <DependenteDialog
        aberto={incluindo}
        aoFechar={() => setIncluindo(false)}
        aoSalvar={(novo) => {
          if (escolhas.dependentes.length < limite) {
            atualizar({ dependentes: [...escolhas.dependentes, novo.id_dependente] });
          }
        }}
      />
    </div>
  );
}

function EscolherPagamento({ plano, escolhas, atualizar }: PassoProps) {
  const desconto = Math.round(
    (1 - numero(plano.valor_anual) / (numero(plano.valor_mensal) * 12)) * 100,
  );
  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Periodicidade" className="grid gap-4 md:grid-cols-2">
        {(['MENSAL', 'ANUAL'] as const).map((periodicidade) => (
          <Opcao
            key={periodicidade}
            ativo={escolhas.periodicidade === periodicidade}
            aoClicar={() => atualizar({ periodicidade })}
          >
            <p className="font-bold">{PERIODICIDADE[periodicidade].rotulo}</p>
            <p className="mt-2 text-2xl font-bold">
              {real(periodicidade === 'MENSAL' ? plano.valor_mensal : plano.valor_anual)}
              <span className="text-xs font-normal text-muted-foreground">
                {PERIODICIDADE[periodicidade].sufixo}
              </span>
            </p>
            {periodicidade === 'ANUAL' && desconto > 0 && (
              <p className="mt-1 text-xs font-semibold text-success-foreground">
                Economize {desconto}% no ano
              </p>
            )}
          </Opcao>
        ))}
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-bold">Dia de vencimento</h2>
          <p className="text-xs text-muted-foreground">
            Se a funerária usa um dia fixo para todos, vale o dia dela.
          </p>
        </div>
        <select
          aria-label="Dia de vencimento"
          value={escolhas.diaVencimento}
          onChange={(e) => atualizar({ diaVencimento: Number(e.target.value) })}
          className="h-11 rounded-lg border border-input bg-card px-3 text-sm"
        >
          {DIAS_VENCIMENTO.map((dia) => (
            <option key={dia} value={dia}>
              Dia {dia}
            </option>
          ))}
        </select>
      </Card>
    </div>
  );
}

/** Valor estimado; o valor final é calculado pela API e aparece no contrato criado. */
function estimativa(plano: PlanoResponse, escolhas: Escolhas) {
  const anual = escolhas.periodicidade === 'ANUAL';
  const titular =
    escolhas.cobertura === 'SOMENTE_DEPENDENTES'
      ? 0
      : numero(anual ? plano.valor_anual : plano.valor_mensal);
  const porDependente = numero(
    anual ? plano.valor_dependente_anual : plano.valor_dependente_mensal,
  );
  return { titular, porDependente, total: titular + porDependente * escolhas.dependentes.length };
}

function Resumo({
  plano,
  escolhas,
  confirmar,
  aoConcluir,
}: {
  plano: PlanoResponse;
  escolhas: Escolhas;
  confirmar: FluxoContratacaoProps['confirmar'];
  aoConcluir: FluxoContratacaoProps['aoConcluir'];
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<Error | null>(null);
  const valores = estimativa(plano, escolhas);
  const sufixo = PERIODICIDADE[escolhas.periodicidade].sufixo;

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      const contrato = await confirmar({
        id_plano: plano.id_plano,
        tipo_cobertura: escolhas.cobertura,
        dependentes: escolhas.cobertura === 'TITULAR' ? [] : escolhas.dependentes,
        periodicidade: escolhas.periodicidade,
        dia_vencimento: escolhas.diaVencimento,
      });
      aoConcluir(contrato.id_contrato);
    } catch (falha) {
      setErro(falha instanceof Error ? falha : new Error('Não foi possível contratar.'));
    } finally {
      setEnviando(false);
    }
  }

  const mensagemErro = erro
    ? [erro.message, ...(ehApiError(erro) ? Object.values(erro.erros).flat() : [])]
        .filter((m, i, todas) => m && todas.indexOf(m) === i)
        .join(' ')
    : undefined;

  return (
    <Card className="max-w-xl p-7">
      <h2 className="text-lg font-bold">Confira antes de confirmar</h2>
      <dl className="mt-5 flex flex-col gap-3 text-sm">
        {[
          ['Plano', plano.nome],
          [
            'Quem fica protegido',
            `${COBERTURA[escolhas.cobertura]}${escolhas.dependentes.length ? ` (${escolhas.dependentes.length} dependentes)` : ''}`,
          ],
          [
            'Pagamento',
            `${PERIODICIDADE[escolhas.periodicidade].rotulo}, vencimento dia ${escolhas.diaVencimento}`,
          ],
          ['Carência', `${numero(plano.carencia_dias)} dias`],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="text-right font-semibold">{valor}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-border/70 pt-3">
          <dt className="font-semibold">Valor estimado</dt>
          <dd className="text-lg font-bold">
            {real(valores.total)}
            <span className="text-xs font-normal text-muted-foreground">{sufixo}</span>
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-subtle-foreground">
        O valor final é calculado pela funerária e aparece no contrato. Ele fica ativo com o
        pagamento da primeira cobrança.
      </p>
      <div className="mt-5">
        <ErroFormulario mensagem={mensagemErro} />
      </div>
      <Button className="mt-5 h-11 w-full" carregando={enviando} onClick={() => void enviar()}>
        Confirmar contratação <ArrowRight />
      </Button>
    </Card>
  );
}
