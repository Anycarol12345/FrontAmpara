'use client';

import type { PlanoResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { numero, realCurto, valorCurto } from '@/lib/formatar';
import { destaquesDoPlano } from '@/lib/planos';
import { Container, SectionHeading } from './Container';

type Periodo = 'mensal' | 'anual';

type PlanosProps = {
  planos: PlanoResponse[];
  /** Contato mostrado quando a funerária ainda não publicou planos. */
  contato?: string | null;
};

/** Desconto do pagamento anual em relação a 12 mensalidades, no plano com maior desconto. */
function descontoAnual(planos: PlanoResponse[]) {
  const descontos = planos
    .filter((p) => numero(p.valor_mensal) > 0 && numero(p.valor_anual) > 0)
    .map((p) => 1 - numero(p.valor_anual) / (numero(p.valor_mensal) * 12));
  const maior = Math.max(0, ...descontos);
  return Math.round(maior * 100);
}

export function Planos({ planos, contato }: PlanosProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const desconto = descontoAnual(planos);
  // Com três planos, o do meio é o destaque, como no protótipo.
  const destaque = planos.length === 3 ? 1 : -1;

  return (
    <section id="planos" className="py-32">
      <Container>
        <SectionHeading
          sobretitulo="Planos para cada momento"
          titulo="Tranquilidade que cabe na sua vida"
          descricao="Escolha o plano que faz sentido para você e sua família. Sem letras miúdas, com tudo explicado."
        />

        {planos.length === 0 ? (
          <p className="mx-auto mt-12 max-w-md rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground">
            Os planos estarão disponíveis aqui em breve.
            {contato && <> Enquanto isso, fale com a gente: {contato}.</>}
          </p>
        ) : (
          <>
            <div className="mt-8 flex justify-center">
              <div
                role="radiogroup"
                aria-label="Periodicidade"
                className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white p-1"
              >
                {(['mensal', 'anual'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={periodo === p}
                    onClick={() => setPeriodo(p)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors',
                      periodo === p ? 'bg-info text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {p}
                  </button>
                ))}
                {desconto > 0 && (
                  <span className="mr-1 rounded-full bg-info px-3 py-1.5 text-[11px] font-semibold text-info-foreground">
                    Economize até {desconto}%
                  </span>
                )}
              </div>
            </div>

            <div
              className={cn(
                'mx-auto mt-14 grid max-w-[1330px] items-center gap-10',
                planos.length >= 3 ? 'lg:grid-cols-3' : 'max-w-[900px] md:grid-cols-2',
              )}
            >
              {planos.map((plano, i) => (
                <CartaoPlano
                  key={plano.id_plano}
                  plano={plano}
                  periodo={periodo}
                  destaque={i === destaque}
                />
              ))}
            </div>

            <p className="mt-10 text-center text-xs text-subtle-foreground">
              Valores por titular. Dependentes têm cobrança adicional e reajuste anual no
              aniversário do contrato.{' '}
              <a href="/planos" className="font-semibold text-primary hover:underline">
                Comparar os planos
              </a>
            </p>
          </>
        )}
      </Container>
    </section>
  );
}

function CartaoPlano({
  plano,
  periodo,
  destaque,
}: {
  plano: PlanoResponse;
  periodo: Periodo;
  destaque: boolean;
}) {
  const valor = periodo === 'mensal' ? plano.valor_mensal : plano.valor_anual;
  const dependente =
    periodo === 'mensal' ? plano.valor_dependente_mensal : plano.valor_dependente_anual;

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl p-10 shadow-[0_20px_50px_-20px_rgba(19,41,74,0.18)]',
        destaque ? 'bg-primary py-12 text-primary-foreground' : 'bg-white',
      )}
    >
      {destaque && (
        <span className="absolute -top-3 left-8 rounded-md bg-accent px-3 py-1 text-[10px] font-semibold tracking-wider text-accent-foreground uppercase">
          Mais escolhido
        </span>
      )}
      <p className={cn('text-[11px]', destaque ? 'text-white/60' : 'text-subtle-foreground')}>
        Plano
      </p>
      <h3 className={cn('font-serif text-[38px]/tight', !destaque && 'text-primary')}>
        {plano.nome}
      </h3>
      {plano.descricao && (
        <p className={cn('mt-2 text-sm', destaque ? 'text-white/70' : 'text-muted-foreground')}>
          {plano.descricao}
        </p>
      )}

      <div className={cn('mt-7 border-t pt-7', destaque ? 'border-white/10' : 'border-border')}>
        <p className="flex items-baseline gap-1.5">
          <span className="text-xs">R$</span>
          <span className={cn('font-serif text-6xl/none', !destaque && 'text-primary')}>
            {valorCurto(valor)}
          </span>
          <span className={cn('text-xs', destaque ? 'text-white/60' : 'text-muted-foreground')}>
            /{periodo === 'mensal' ? 'mês' : 'ano'}
          </span>
        </p>
        {periodo === 'anual' && (
          <p
            className={cn(
              'mt-2 text-[11px] font-semibold',
              destaque ? 'text-white' : 'text-primary',
            )}
          >
            equivale a {realCurto(numero(valor) / 12)}/mês
          </p>
        )}
        {numero(dependente) > 0 && (
          <p
            className={cn('mt-2 text-[11px]', destaque ? 'text-white/60' : 'text-muted-foreground')}
          >
            + {realCurto(dependente)} por dependente
          </p>
        )}
      </div>

      <ul className="mt-6 flex flex-col gap-2.5">
        {destaquesDoPlano(plano).map((item) => (
          <li
            key={item}
            className={cn(
              'flex items-start gap-2.5 text-sm',
              destaque ? 'text-white/85' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'mt-0.5 grid size-4 shrink-0 place-items-center rounded',
                destaque ? 'bg-white/15' : 'bg-info text-brand-800',
              )}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <Button
        variant="outline"
        className={cn('mt-9 w-full', destaque && 'border-transparent bg-surface text-primary')}
        asChild
      >
        <a href={`/planos/${plano.id_plano}`}>
          Ver detalhes <ArrowRight />
        </a>
      </Button>
    </article>
  );
}
