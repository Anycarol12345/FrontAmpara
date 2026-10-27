import type { CoberturaResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/Container';
import { obterPlano } from '@/lib/api';
import { numero, realCurto } from '@/lib/formatar';
import { linkDoApp } from '@/lib/links';
import { destaquesDoPlano } from '@/lib/planos';

type Props = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const plano = await obterPlano(slug, id);
  if (!plano) return {};
  return {
    title: `Plano ${plano.nome}`,
    description:
      plano.descricao ??
      `Plano ${plano.nome}: a partir de ${realCurto(plano.valor_mensal)} por mês.`,
  };
}

/** Detalhe do plano: valores, carência, dependentes e coberturas (FE-PUB-01, PLA-02). */
export default async function DetalheDoPlano({ params }: Props) {
  const { slug, id } = await params;
  const plano = await obterPlano(slug, id);
  if (!plano || plano.ativo === false) notFound();

  const porCategoria = new Map<string, CoberturaResponse[]>();
  for (const cobertura of plano.coberturas) {
    porCategoria.set(cobertura.categoria, [
      ...(porCategoria.get(cobertura.categoria) ?? []),
      cobertura,
    ]);
  }
  const valores = [
    { rotulo: 'Mensal', valor: realCurto(plano.valor_mensal), sufixo: '/mês' },
    { rotulo: 'Anual', valor: realCurto(plano.valor_anual), sufixo: '/ano' },
    {
      rotulo: 'Por dependente',
      valor: realCurto(plano.valor_dependente_mensal),
      sufixo: '/mês',
    },
  ];
  const condicoes = [
    numero(plano.carencia_dias)
      ? `Carência de ${numero(plano.carencia_dias)} dias`
      : 'Sem carência',
    `Até ${numero(plano.limite_dependentes)} dependentes`,
    ...destaquesDoPlano(plano, 99).filter(
      (d) => !plano.coberturas.some((c) => d.startsWith(c.nome)),
    ),
  ];

  return (
    <section className="py-20">
      <Container className="max-w-[1100px]">
        <a
          href="/#planos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Todos os planos
        </a>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Plano
            </p>
            <h1 className="mt-2 font-serif text-6xl text-primary">{plano.nome}</h1>
            {plano.descricao && (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {plano.descricao}
              </p>
            )}

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {condicoes.map((condicao) => (
                <li key={condicao} className="flex items-center gap-2.5 text-sm">
                  <span className="grid size-5 place-items-center rounded bg-info text-brand-800">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {condicao}
                </li>
              ))}
            </ul>

            <h2 className="mt-14 font-serif text-3xl text-primary">O que está coberto</h2>
            {plano.coberturas.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                A funerária ainda não detalhou as coberturas deste plano.
              </p>
            ) : (
              <div className="mt-6 flex flex-col gap-6">
                {[...porCategoria].map(([categoria, itens]) => (
                  <div key={categoria} className="rounded-2xl bg-white p-6">
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {categoria}
                    </h3>
                    <ul className="mt-3 divide-y divide-border/60">
                      {itens.map((item) => (
                        <li
                          key={item.id_plano_cobertura}
                          className="flex justify-between py-2.5 text-sm"
                        >
                          <span>{item.nome}</span>
                          <span className="text-muted-foreground">
                            {numero(item.quantidade)} un.
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="self-start rounded-2xl bg-primary p-8 text-primary-foreground lg:sticky lg:top-28">
            <p className="text-[11px] text-white/60 uppercase">Valores</p>
            <dl className="mt-4 flex flex-col gap-4">
              {valores.map(({ rotulo, valor, sufixo }) => (
                <div
                  key={rotulo}
                  className="flex items-baseline justify-between border-b border-white/10 pb-4"
                >
                  <dt className="text-sm text-white/70">{rotulo}</dt>
                  <dd>
                    <span className="font-serif text-3xl">{valor}</span>
                    <span className="text-xs text-white/60">{sufixo}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <Button
              className="mt-6 w-full bg-linear-to-r from-accent to-[#d4b16c] text-accent-foreground hover:opacity-90"
              asChild
            >
              <a href={linkDoApp(slug, `/cadastro?plano=${plano.id_plano}`)}>
                Contratar este plano <ArrowRight />
              </a>
            </Button>
            <a
              href={linkDoApp(slug, '/entrar')}
              className="mt-4 block text-center text-xs text-white/70 hover:text-white"
            >
              Já sou cliente
            </a>
          </aside>
        </div>
      </Container>
    </section>
  );
}
