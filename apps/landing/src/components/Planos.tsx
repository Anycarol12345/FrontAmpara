'use client';

import { Button } from '@ampara/ui/components/button';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { env } from '@/lib/env';
import { Container, SectionHeading } from './Container';

type Periodo = 'mensal' | 'anual';

// Planos modelo (INF-16). Na landing de cada funerária virão de GET /planos (FE-PUB-01).
const PLANOS = [
  {
    nome: 'Essencial',
    descricao: 'O cuidado necessário, com simplicidade.',
    preco: { mensal: 39, anual: 372 },
    itens: [
      'Velório com cerimonial básico',
      'Urna e ornamentação simples',
      'Translado municipal',
      'Atendimento 24h pela central',
    ],
    destaque: false,
  },
  {
    nome: 'Acolher',
    descricao: 'Mais conforto para você e sua família.',
    preco: { mensal: 69, anual: 660 },
    itens: [
      'Tudo do Essencial, com mais opções',
      'Cerimônia personalizada e flores naturais',
      'Translado intermunicipal até 300 km',
      'Até 4 dependentes incluídos',
    ],
    destaque: true,
  },
  {
    nome: 'Legado',
    descricao: 'Uma homenagem completa, sem preocupações.',
    preco: { mensal: 119, anual: 1140 },
    itens: [
      'Tudo do Acolher, sem limites de escolha',
      'Sala exclusiva e homenagem em vídeo',
      'Translado nacional',
      'Assessoria completa com documentos e cartório',
    ],
    destaque: false,
  },
];

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

export function Planos() {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');

  return (
    <section id="planos" className="py-32">
      <Container>
        <SectionHeading
          sobretitulo="Planos para cada momento"
          titulo="Tranquilidade que cabe na sua vida"
          descricao="Escolha o plano que faz sentido para você e sua família. Sem letras miúdas, com tudo explicado."
        />

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
            <span className="mr-1 rounded-full bg-info px-3 py-1.5 text-[11px] font-semibold text-info-foreground">
              Economize 20%
            </span>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-[1330px] items-center gap-10 lg:grid-cols-3">
          {PLANOS.map((plano) => (
            <CartaoPlano key={plano.nome} plano={plano} periodo={periodo} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-subtle-foreground">
          Valores por titular. Dependentes têm cobrança adicional e reajuste anual de 5% no
          aniversário do contrato.
        </p>
      </Container>
    </section>
  );
}

function CartaoPlano({ plano, periodo }: { plano: (typeof PLANOS)[number]; periodo: Periodo }) {
  const escuro = plano.destaque;
  const preco = plano.preco[periodo];

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl p-10 shadow-[0_20px_50px_-20px_rgba(19,41,74,0.18)]',
        escuro ? 'bg-primary py-10 text-primary-foreground' : 'bg-white',
      )}
    >
      {escuro && (
        <span className="absolute -top-3 left-8 rounded-md bg-accent px-3 py-1 text-[10px] font-semibold tracking-wider text-accent-foreground uppercase">
          Mais escolhido
        </span>
      )}
      <p className={cn('text-[11px]', escuro ? 'text-white/60' : 'text-subtle-foreground')}>
        Plano
      </p>
      <h3 className={cn('font-serif text-[38px]/tight', !escuro && 'text-primary')}>
        {plano.nome}
      </h3>
      <p className={cn('mt-2 text-sm', escuro ? 'text-white/70' : 'text-muted-foreground')}>
        {plano.descricao}
      </p>

      <div className={cn('mt-7 border-t pt-7', escuro ? 'border-white/10' : 'border-border')}>
        <p className="flex items-baseline gap-1.5">
          <span className="text-xs">R$</span>
          <span className={cn('font-serif text-6xl/none', !escuro && 'text-primary')}>
            {formatar(preco)}
          </span>
          <span className={cn('text-xs', escuro ? 'text-white/60' : 'text-muted-foreground')}>
            /{periodo === 'mensal' ? 'mês' : 'ano'}
          </span>
        </p>
        {periodo === 'anual' && (
          <p
            className={cn('mt-2 text-[11px] font-semibold', escuro ? 'text-white' : 'text-primary')}
          >
            equivale a R$ {formatar(Math.round(preco / 12))}/mês
          </p>
        )}
      </div>

      <ul className="mt-6 flex flex-col gap-2.5">
        {plano.itens.map((item) => (
          <li
            key={item}
            className={cn(
              'flex items-start gap-2.5 text-sm',
              escuro ? 'text-white/85' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'mt-px grid size-4 shrink-0 place-items-center rounded',
                escuro ? 'bg-white/15' : 'bg-info text-brand-800',
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
        className={cn('mt-9 w-full', escuro && 'border-transparent bg-surface text-primary')}
        asChild
      >
        <a href={`${env.appUrl}/cadastro?plano=${plano.nome.toLowerCase()}`}>
          Ver detalhes <ArrowRight />
        </a>
      </Button>
    </article>
  );
}
