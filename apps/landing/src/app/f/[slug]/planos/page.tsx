import type { PlanoResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Check, Minus } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Container, SectionHeading } from '@/components/Container';
import { listarPlanos } from '@/lib/api';
import { numero, realCurto } from '@/lib/formatar';
import { linkDoApp } from '@/lib/links';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: 'Comparar planos',
  description: 'Compare valores, carência, dependentes e coberturas de cada plano.',
};

const sim = (valor: boolean | undefined) =>
  valor ? (
    <Check className="mx-auto size-4 text-success-foreground" aria-label="Sim" />
  ) : (
    <Minus className="mx-auto size-4 text-subtle-foreground" aria-label="Não" />
  );

const LINHAS: { rotulo: string; valor: (plano: PlanoResponse) => ReactNode }[] = [
  { rotulo: 'Mensalidade', valor: (p) => realCurto(p.valor_mensal) },
  { rotulo: 'Pagamento anual', valor: (p) => realCurto(p.valor_anual) },
  { rotulo: 'Dependente (mês)', valor: (p) => realCurto(p.valor_dependente_mensal) },
  { rotulo: 'Dependentes incluídos', valor: (p) => `até ${numero(p.limite_dependentes)}` },
  {
    rotulo: 'Carência',
    valor: (p) => (numero(p.carencia_dias) ? `${numero(p.carencia_dias)} dias` : 'Sem carência'),
  },
  {
    rotulo: 'Translado incluso',
    valor: (p) => {
      const km = numero(p.configuracoes?.translado?.km_incluso);
      return km ? `${km} km` : '—';
    },
  },
  {
    rotulo: 'Velório',
    valor: (p) => {
      const horas = numero(p.configuracoes?.velorio?.horas_incluidas);
      return horas ? `${horas} horas` : '—';
    },
  },
  { rotulo: 'Sala VIP', valor: (p) => sim(p.configuracoes?.velorio?.sala_vip) },
  { rotulo: 'Cremação', valor: (p) => sim(p.configuracoes?.cremacao_inclusa) },
  { rotulo: 'Transmissão online', valor: (p) => sim(p.configuracoes?.transmissao_online) },
];

/** Comparação entre os planos da funerária (FE-PUB-01). */
export default async function CompararPlanos({ params }: Props) {
  const { slug } = await params;
  const planos = await listarPlanos(slug);

  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          sobretitulo="Planos"
          titulo="Compare e escolha com calma"
          descricao="Todos os valores são por titular. Dependentes têm cobrança adicional."
        />

        {planos.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Os planos estarão disponíveis aqui em breve.
          </p>
        ) : (
          <div className="mt-14 overflow-x-auto rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(19,41,74,0.18)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="p-6 text-left text-xs font-semibold text-muted-foreground"
                  >
                    <span className="sr-only">Característica</span>
                  </th>
                  {planos.map((plano) => (
                    <th key={plano.id_plano} scope="col" className="p-6 text-center">
                      <a
                        href={`/planos/${plano.id_plano}`}
                        className="font-serif text-2xl font-normal text-primary hover:underline"
                      >
                        {plano.nome}
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LINHAS.map((linha) => (
                  <tr key={linha.rotulo} className="border-b border-border/60 last:border-0">
                    <th
                      scope="row"
                      className="px-6 py-4 text-left font-normal text-muted-foreground"
                    >
                      {linha.rotulo}
                    </th>
                    {planos.map((plano) => (
                      <td key={plano.id_plano} className="px-6 py-4 text-center font-semibold">
                        {linha.valor(plano)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {planos.map((plano) => (
                    <td key={plano.id_plano} className="p-6 text-center">
                      <Button size="sm" asChild>
                        <a href={linkDoApp(slug, `/cadastro?plano=${plano.id_plano}`)}>Contratar</a>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </section>
  );
}
