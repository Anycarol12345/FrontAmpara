import {
  getListarPreferenciasFuneralQueryKey,
  useDefinirPreferenciaFuneral,
  useListarCatalogo,
  useListarCategoriasCatalogo,
  useListarPreferenciasFuneral,
  type CategoriaResponse,
  type Destinacao,
  type ItemResponse,
  type PessoaPreferenciaResponse,
  type TipoCerimonia,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { toast } from '@ampara/ui/components/sonner';
import { cn } from '@ampara/ui/lib/utils';
import { ImageOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { Carregando, EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Filtros } from '@/shared/components/Tabela';
import { env } from '@/shared/lib/env';
import { numero, real } from '@/shared/lib/formatar';
import { useCoberturasPorPessoa, type CoberturaDaPessoa } from '../../hooks/coberturas';

type ItemEscolhido = { id_item_catalogo: string; id_variacao: string | null };

type Escolhas = {
  destinacao: Destinacao;
  tipo_cerimonia: TipoCerimonia;
  crenca_religiosa: string;
  /** Uma música por linha. */
  musicas: string;
  mensagens: string;
  observacoes: string;
  itens: ItemEscolhido[];
};

const DESTINOS: { valor: Destinacao; rotulo: string }[] = [
  { valor: 'SEPULTAMENTO', rotulo: 'Sepultamento' },
  { valor: 'CREMACAO', rotulo: 'Cremação' },
  { valor: 'NAO_DEFINIDA', rotulo: 'Deixar para a família decidir' },
];

const CERIMONIAS: { valor: TipoCerimonia; rotulo: string }[] = [
  { valor: 'NAO_DEFINIDA', rotulo: 'Sem preferência' },
  { valor: 'RELIGIOSA', rotulo: 'Religiosa' },
  { valor: 'ECUMENICA', rotulo: 'Ecumênica' },
  { valor: 'CIVIL', rotulo: 'Civil' },
  { valor: 'SEM_CERIMONIA', rotulo: 'Sem cerimônia' },
];

const classeCampo =
  'w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Preferências de funeral em vida (FE-CLI-07, GET/PUT /preferencias-funeral). */
export function PreferenciasPage() {
  const preferencias = useListarPreferenciasFuneral();
  const idTitular = preferencias.data?.find((p) => p.tipo === 'TITULAR')?.id_pessoa;
  const coberturas = useCoberturasPorPessoa(idTitular);
  const [idPessoa, setIdPessoa] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Preferências de funeral"
        descricao="Registre, com calma, como você gostaria que fosse a despedida. Essas escolhas orientam sua família e a funerária quando chegar o momento, e podem ser mudadas quando quiser."
      />
      <EstadoConsulta consulta={preferencias} estaVazio={(pessoas) => pessoas.length === 0}>
        {(pessoas) => {
          const selecionada = pessoas.find((p) => p.id_pessoa === idPessoa) ?? pessoas[0]!;
          if (coberturas.carregando) {
            return (
              <Card>
                <Carregando />
              </Card>
            );
          }
          return (
            <>
              {pessoas.length > 1 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">Preferências de</p>
                  <Filtros
                    opcoes={pessoas.map((p) => ({
                      valor: p.id_pessoa,
                      rotulo: p.tipo === 'TITULAR' ? `${p.nome.split(' ')[0]} (você)` : p.nome,
                    }))}
                    valor={selecionada.id_pessoa}
                    aoMudar={setIdPessoa}
                  />
                </div>
              )}
              <Formulario
                // Trocar de pessoa recomeça o formulário com as preferências dela.
                key={selecionada.id_pessoa}
                pessoa={selecionada}
                cobertura={coberturas.porPessoa.get(selecionada.id_pessoa)}
              />
            </>
          );
        }}
      </EstadoConsulta>
    </div>
  );
}

function Formulario({
  pessoa,
  cobertura,
}: {
  pessoa: PessoaPreferenciaResponse;
  cobertura: CoberturaDaPessoa | undefined;
}) {
  const categorias = useListarCategoriasCatalogo();
  const catalogo = useListarCatalogo();
  const salvar = useDefinirPreferenciaFuneral({
    mutation: { meta: { invalida: [getListarPreferenciasFuneralQueryKey()] } },
  });
  const atual = pessoa.preferencia;
  const [dados, setDados] = useState<Escolhas>({
    destinacao: atual?.destinacao ?? 'NAO_DEFINIDA',
    tipo_cerimonia: atual?.tipo_cerimonia ?? 'NAO_DEFINIDA',
    crenca_religiosa: atual?.crenca_religiosa ?? '',
    musicas: atual?.musicas.join('\n') ?? '',
    mensagens: atual?.mensagens ?? '',
    observacoes: atual?.observacoes ?? '',
    itens: (atual?.itens ?? []).map(({ id_item_catalogo, id_variacao }) => ({
      id_item_catalogo,
      id_variacao,
    })),
  });
  const atualizar = (parcial: Partial<Escolhas>) => setDados((d) => ({ ...d, ...parcial }));

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
    const vazioParaNulo = (valor: string) => valor.trim() || null;
    await salvar.mutateAsync({
      idPessoa: pessoa.id_pessoa,
      data: {
        destinacao: dados.destinacao,
        tipo_cerimonia: dados.tipo_cerimonia,
        // A crença só vale numa cerimônia religiosa (dado sensível, LGPD).
        crenca_religiosa:
          dados.tipo_cerimonia === 'RELIGIOSA' ? vazioParaNulo(dados.crenca_religiosa) : null,
        musicas: dados.musicas
          .split('\n')
          .map((m) => m.trim())
          .filter(Boolean),
        mensagens: vazioParaNulo(dados.mensagens),
        observacoes: vazioParaNulo(dados.observacoes),
        itens: dados.itens.map((i) => ({ ...i, quantidade: 1 })),
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
                  key={valor}
                  className={cn(
                    'cursor-pointer rounded-full border px-4 py-2 text-xs transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/30',
                    dados.destinacao === valor
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name="destinacao"
                    className="sr-only"
                    checked={dados.destinacao === valor}
                    onChange={() => atualizar({ destinacao: valor })}
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
              value={dados.tipo_cerimonia}
              onChange={(e) => atualizar({ tipo_cerimonia: e.target.value as TipoCerimonia })}
            >
              {CERIMONIAS.map(({ valor, rotulo }) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          {dados.tipo_cerimonia === 'RELIGIOSA' ? (
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Crença religiosa
              <input
                className={cn(classeCampo, 'h-11 font-normal')}
                placeholder="Ex.: católica, evangélica, espírita"
                value={dados.crenca_religiosa}
                onChange={(e) => atualizar({ crenca_religiosa: e.target.value })}
              />
            </label>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Músicas
            <textarea
              rows={3}
              className={cn(classeCampo, 'py-2.5 font-normal')}
              placeholder="Uma por linha. Ex.: Ave Maria"
              value={dados.musicas}
              onChange={(e) => atualizar({ musicas: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Mensagens para a família
            <textarea
              rows={3}
              className={cn(classeCampo, 'py-2.5 font-normal')}
              placeholder="Palavras que você gostaria que fossem lidas."
              value={dados.mensagens}
              onChange={(e) => atualizar({ mensagens: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold sm:col-span-2">
            Observações
            <textarea
              rows={2}
              className={cn(classeCampo, 'py-2.5 font-normal')}
              placeholder="Algo que a família e a funerária devem saber."
              value={dados.observacoes}
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
  escolhidos: ItemEscolhido[];
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
