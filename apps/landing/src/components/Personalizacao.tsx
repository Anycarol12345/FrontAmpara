'use client';

import { Button } from '@ampara/ui/components/button';
import { cn } from '@ampara/ui/lib/utils';
import {
  ArrowRight,
  BookHeart,
  Church,
  Flower,
  Flower2,
  Music,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { env } from '@/lib/env';
import { Container, SectionHeading } from './Container';

// Catálogo modelo (FUN-01). Na landing de cada funerária virá do catálogo dela.
const ITENS = [
  {
    id: 'coroa',
    nome: 'Coroa de flores',
    descricao: 'Flores do campo, rosas ou lírios.',
    preco: 280,
    icone: Flower,
  },
  {
    id: 'arranjos',
    nome: 'Flores naturais',
    descricao: 'Arranjos para a sala e a urna, em tons claros.',
    preco: 420,
    icone: Flower2,
  },
  {
    id: 'cerimonia',
    nome: 'Cerimônia',
    descricao: 'Celebração religiosa ou ecumênica.',
    preco: 1200,
    icone: Church,
  },
  {
    id: 'translado',
    nome: 'Translado',
    descricao: 'Transporte com cuidado até o destino.',
    preco: 650,
    icone: Truck,
  },
  {
    id: 'album',
    nome: 'Álbum de memórias',
    descricao: 'Fotos e mensagens da família reunidas em um livro.',
    preco: 380,
    icone: BookHeart,
  },
  {
    id: 'musica',
    nome: 'Homenagem musical',
    descricao: 'Músicos ao vivo ou a trilha que a família escolher.',
    preco: 750,
    icone: Music,
  },
];

const SELECAO_INICIAL = ['coroa', 'arranjos', 'album'];
const PRECO_BASE = 1720;

const real = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function Personalizacao() {
  const [selecionados, setSelecionados] = useState<string[]>(SELECAO_INICIAL);

  const escolhidos = ITENS.filter((item) => selecionados.includes(item.id));
  const total = PRECO_BASE + escolhidos.reduce((soma, item) => soma + item.preco, 0);

  function alternar(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id],
    );
  }

  return (
    <section id="personalizar" className="bg-[#e4ecf8] py-28">
      <Container>
        <SectionHeading
          sobretitulo="Personalize"
          titulo="Cada história merece uma despedida única"
          descricao="Escolha os detalhes que representam quem você ama. Você pode deixar tudo registrado em vida, com calma."
          className="max-w-lg"
        />

        <div className="mx-auto mt-14 grid gap-6 lg:grid-cols-[1fr_1fr_400px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {ITENS.map(({ id, nome, descricao, preco, icone: Icone }) => {
              const ativo = selecionados.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => alternar(id)}
                  className={cn(
                    'flex flex-col rounded-xl border-2 bg-white p-6 text-left transition-colors',
                    ativo
                      ? 'border-brand-800/60 shadow-md shadow-brand-800/10'
                      : 'border-transparent',
                  )}
                >
                  <span className="flex items-start justify-between">
                    <span className="grid size-7 place-items-center rounded-md bg-info text-brand-800">
                      <Icone className="size-3.5" strokeWidth={1.75} />
                    </span>
                    <span
                      className={cn(
                        'size-3.5 rounded-full border',
                        ativo ? 'border-primary bg-primary' : 'border-input',
                      )}
                    />
                  </span>
                  <span className="mt-5 font-serif text-2xl text-primary">{nome}</span>
                  <span className="mt-1 flex items-end justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{descricao}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-primary">
                      + {real(preco)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="flex flex-col self-start rounded-2xl bg-primary p-8 text-primary-foreground shadow-[0_24px_50px_-20px_rgba(19,41,74,0.45)]">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-white/10">
                <Sparkles className="size-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[10px] text-white/60 uppercase">Sua seleção</p>
                <p className="font-serif text-lg/tight">Cerimônia personalizada</p>
              </div>
            </div>

            <ul className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px]">
              <li className="flex justify-between text-white/80">
                <span>Plano Acolher (base)</span>
                <span>{real(PRECO_BASE)}</span>
              </li>
              {escolhidos.map((item) => (
                <li key={item.id} className="flex justify-between text-white/80">
                  <span>{item.nome}</span>
                  <span>{real(item.preco)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-[10px] text-white/60">Total estimado</p>
                <p className="font-serif text-5xl/none">{real(total)}</p>
              </div>
              <span className="text-[10px] text-white/60">à vista</span>
            </div>

            <Button
              className="mt-6 w-full bg-linear-to-r from-accent to-[#d4b16c] text-accent-foreground hover:opacity-90"
              asChild
            >
              <a href={`${env.appUrl}/cadastro`}>
                Salvar escolhas <ArrowRight />
              </a>
            </Button>
            <p className="mt-3 text-[10px] leading-relaxed text-white/50">
              Valores de referência. A funerária confirma o orçamento final com você.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
