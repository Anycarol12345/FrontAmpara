import {
  useListarCatalogo,
  useListarCategoriasCatalogo,
  useListarDependentes,
  useObterMeusDados,
  type CategoriaResponse,
  type ItemResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { toast } from '@ampara/ui/components/sonner';
import { cn } from '@ampara/ui/lib/utils';
import { ImageOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { Carregando, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros } from '@/shared/components/Tabela';
import { env } from '@/shared/lib/env';
import { data, numero, real } from '@/shared/lib/formatar';
import { useCoberturasPorPessoa, type CoberturaDaPessoa } from '../../hooks/coberturas';
import {
  usePreferenciasFuneral,
  useSalvarPreferencias,
  type DestinoFuneral,
  type ItemPreferido,
  type PreferenciaFuneralRequest,
  type PreferenciaFuneralResponse,
} from '../../hooks/preferencias';

const DESTINOS: { valor: DestinoFuneral | null; rotulo: string }[] = [
  { valor: 'SEPULTAMENTO', rotulo: 'Sepultamento' },
  { valor: 'CREMACAO', rotulo: 'Cremação' },
  { valor: null, rotulo: 'Deixar para a família decidir' },
];

const CERIMONIAS = [
  'Religiosa',
  'Ecumênica',
  'Sem cerimônia religiosa',
  'Somente para a família',
] as const;

const classeCampo =
  'w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Preferências de funeral em vida (FE-CLI-07, GET/PUT /preferencias-funeral). */
export function PreferenciasPage() {
  const titular = useObterMeusDados();
  const dependentes = useListarDependentes();
  const preferencias = usePreferenciasFuneral();
  const coberturas = useCoberturasPorPessoa(titular.data?.id_cliente);
  const [idPessoa, setIdPessoa] = useState<string | null>(null);

  const pessoas = titular.data
    ? [
        { valor: titular.data.id_cliente, rotulo: `${titular.data.nome.split(' ')[0]} (você)` },
        ...(dependentes.data ?? []).map((d) => ({ valor: d.id_dependente, rotulo: d.nome })),
      ]
    : [];
  const selecionada = idPessoa ?? pessoas[0]?.valor;
  const carregando =
    titular.isPending || dependentes.isPending || preferencias.isPending || coberturas.carregando;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Preferências de funeral"
        descricao="Registre, com calma, como você gostaria que fosse a despedida. Essas escolhas orientam sua família e a funerária quando chegar o momento, e podem ser mudadas quando quiser."
      />

      {carregando || !selecionada ? (
        <Card>
          <Carregando />
        </Card>
      ) : (
        <>
          {pessoas.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Preferências de</p>
              <Filtros opcoes={pessoas} valor={selecionada} aoMudar={setIdPessoa} />
            </div>
          )}
          <Formulario
            // Trocar de pessoa recomeça o formulário com as preferências dela.
            key={selecionada}
            idPessoa={selecionada}
            atual={preferencias.data?.find((p) => p.id_pessoa === selecionada)}
            cobertura={coberturas.porPessoa.get(selecionada)}
          />
        </>
      )}
    </div>
  );
}

function Formulario({
  idPessoa,
  atual,
  cobertura,
}: {
  idPessoa: string;
  atual: PreferenciaFuneralResponse | undefined;
  cobertura: CoberturaDaPessoa | undefined;
}) {
  const categorias = useListarCategoriasCatalogo();
  const catalogo = useListarCatalogo();
  const salvar = useSalvarPreferencias();
  const [dados, setDados] = useState<PreferenciaFuneralRequest>({
    destino: atual?.destino ?? null,
    cerimonia: atual?.cerimonia ?? null,
    itens: atual?.itens ?? [],
    musicas: atual?.musicas ?? null,
    observacoes: atual?.observacoes ?? null,
  });
  const atualizar = (parcial: Partial<PreferenciaFuneralRequest>) =>
    setDados((d) => ({ ...d, ...parcial }));

  const itens = (catalogo.data ?? []).filter((i) => i.ativo);
  const coberto = (id: string) => cobertura?.itens.has(id) ?? false;
  const adicionais = dados.itens.reduce((total, escolhido) => {
    const item = itens.find((i) => i.id_item === escolhido.id_item_catalogo);
    if (!item) return total;
    const variacao = item.variacoes.find((v) => v.id_variacao === escolhido.id_variacao);
    // Item coberto entra sem custo; o acréscimo de uma variação mais cara é sempre adicional.
    return (
      total + (coberto(item.id_item) ? 0 : numero(item.preco)) + numero(variacao?.acrescimo_preco)
    );
  }, 0);

  function alternar(item: ItemResponse) {
    const escolhido = dados.itens.some((i) => i.id_item_catalogo === item.id_item);
    atualizar({
      itens: escolhido
        ? dados.itens.filter((i) => i.id_item_catalogo !== item.id_item)
        : [...dados.itens, { id_item_catalogo: item.id_item, id_variacao: null }],
    });
  }

  function escolherVariacao(idItem: string, idVariacao: string | null) {
    atualizar({
      itens: dados.itens.map((i) =>
        i.id_item_catalogo === idItem ? { ...i, id_variacao: idVariacao } : i,
      ),
    });
  }

  async function enviar() {
    const vazioParaNulo = (valor: string | null) => valor?.trim() || null;
    await salvar.mutateAsync({
      idPessoa,
      dados: {
        ...dados,
        musicas: vazioParaNulo(dados.musicas),
        observacoes: vazioParaNulo(dados.observacoes),
      },
    });
    toast.success('Preferências salvas.');
  }

  const ativas = (categorias.data ?? [])
    .filter((c) => c.ativo && itens.some((i) => i.id_categoria === c.id_categoria))
    .sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <Card className="grid gap-5 p-7 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className="text-sm font-bold">Como deseja a despedida</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DESTINOS.map(({ valor, rotulo }) => (
                <label
                  key={rotulo}
                  className={cn(
                    'cursor-pointer rounded-full border px-4 py-2 text-xs transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/30',
                    dados.destino === valor
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name="destino"
                    className="sr-only"
                    checked={dados.destino === valor}
                    onChange={() => atualizar({ destino: valor })}
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Tipo de cerimônia
            <select
              className={cn(classeCampo, 'h-11 font-normal')}
              value={dados.cerimonia ?? ''}
              onChange={(e) => atualizar({ cerimonia: e.target.value || null })}
            >
              <option value="">Sem preferência</option>
              {CERIMONIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Músicas
            <input
              className={cn(classeCampo, 'h-11 font-normal')}
              placeholder="Ex.: Ave Maria, Como é grande o meu amor por você"
              value={dados.musicas ?? ''}
              onChange={(e) => atualizar({ musicas: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold sm:col-span-2">
            Mensagens e observações
            <textarea
              rows={3}
              className={cn(classeCampo, 'py-2.5 font-normal')}
              placeholder="Algo que a família e a funerária devem saber."
              value={dados.observacoes ?? ''}
              onChange={(e) => atualizar({ observacoes: e.target.value })}
            />
          </label>
          <p className="flex items-start gap-2 text-[11px] text-muted-foreground sm:col-span-2">
            <Lock className="mt-px size-3 shrink-0" aria-hidden />
            Informações sobre crença religiosa são dados sensíveis (LGPD). Só você e a funerária têm
            acesso a elas.
          </p>
        </Card>

        {catalogo.isPending || categorias.isPending ? (
          <Card>
            <Carregando />
          </Card>
        ) : ativas.length === 0 ? (
          <Card>
            <Vazio titulo="A funerária ainda não publicou o catálogo" />
          </Card>
        ) : (
          ativas.map((categoria) => (
            <Categoria
              key={categoria.id_categoria}
              categoria={categoria}
              itens={itens.filter((i) => i.id_categoria === categoria.id_categoria)}
              escolhidos={dados.itens}
              coberto={coberto}
              aoAlternar={alternar}
              aoEscolherVariacao={escolherVariacao}
            />
          ))
        )}
      </div>

      <aside className="self-start lg:sticky lg:top-6">
        <Card className="p-6">
          <h2 className="text-sm font-bold">Resumo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {cobertura
              ? `Coberto pelo plano ${cobertura.plano}.`
              : 'Esta pessoa ainda não está em um plano: todos os itens seriam adicionais.'}
          </p>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Itens escolhidos</dt>
              <dd className="font-semibold">{dados.itens.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total estimado de adicionais</dt>
              <dd className="font-semibold">{real(adicionais)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-subtle-foreground">
            Estimativa com os preços de hoje. O valor final é confirmado pela funerária no momento
            do atendimento.
          </p>
          <Button className="mt-5 w-full" carregando={salvar.isPending} onClick={enviar}>
            Salvar preferências
          </Button>
          {atual?.atualizado_em && (
            <p className="mt-3 text-center text-[11px] text-subtle-foreground">
              Salvas pela última vez em {data(atual.atualizado_em)}
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}

function Categoria({
  categoria,
  itens,
  escolhidos,
  coberto,
  aoAlternar,
  aoEscolherVariacao,
}: {
  categoria: CategoriaResponse;
  itens: ItemResponse[];
  escolhidos: ItemPreferido[];
  coberto: (id: string) => boolean;
  aoAlternar: (item: ItemResponse) => void;
  aoEscolherVariacao: (idItem: string, idVariacao: string | null) => void;
}) {
  return (
    <section aria-labelledby={`categoria-${categoria.id_categoria}`}>
      <h2 id={`categoria-${categoria.id_categoria}`} className="mb-3 text-base font-bold">
        {categoria.nome}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => {
          const escolhido = escolhidos.find((e) => e.id_item_catalogo === item.id_item);
          const variacoes = item.variacoes.filter((v) => v.ativo);
          return (
            <Card
              key={item.id_item}
              className={cn(
                'flex flex-col overflow-hidden transition-colors',
                escolhido && 'border-primary ring-1 ring-primary',
              )}
            >
              <Imagem item={item} />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    className="mt-0.5"
                    checked={Boolean(escolhido)}
                    onCheckedChange={() => aoAlternar(item)}
                  />
                  <span className="text-sm font-semibold">{item.nome}</span>
                </label>
                {item.descricao && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.descricao}</p>
                )}
                <div className="mt-auto pt-1">
                  {coberto(item.id_item) ? (
                    <Badge variant="success">Coberto pelo plano</Badge>
                  ) : (
                    <Badge variant="neutral">Adicional · {real(item.preco)}</Badge>
                  )}
                </div>
                {escolhido && variacoes.length > 0 && (
                  <select
                    aria-label={`Opção de ${item.nome}`}
                    className={cn(classeCampo, 'mt-1 h-9 text-xs')}
                    value={escolhido.id_variacao ?? ''}
                    onChange={(e) => aoEscolherVariacao(item.id_item, e.target.value || null)}
                  >
                    <option value="">Padrão</option>
                    {variacoes.map((v) => (
                      <option key={v.id_variacao} value={v.id_variacao}>
                        {v.nome}
                        {numero(v.acrescimo_preco) > 0 ? ` (+ ${real(v.acrescimo_preco)})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Imagem({ item }: { item: ItemResponse }) {
  const [falhou, setFalhou] = useState(false);
  const url = item.imagem_url?.startsWith('/')
    ? `${env.apiUrl}${item.imagem_url}`
    : item.imagem_url;

  if (!url || falhou) {
    return (
      <div className="grid aspect-[4/3] place-items-center bg-muted text-subtle-foreground">
        <ImageOff className="size-5" aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFalhou(true)}
      className="aspect-[4/3] w-full bg-muted object-cover"
    />
  );
}
