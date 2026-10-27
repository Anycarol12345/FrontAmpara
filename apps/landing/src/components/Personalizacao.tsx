'use client';

import type { ItemResponse } from '@ampara/api-client';
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
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { numero, real } from '@/lib/formatar';
import { Container, SectionHeading } from './Container';

// Ícone pelo nome do item do catálogo; o catálogo é de cada funerária (DEC-07).
const ICONES: [RegExp, LucideIcon][] = [
  [/coroa/i, Flower],
  [/flor|arranjo/i, Flower2],
  [/cerim|missa|culto|ora[cç]/i, Church],
  [/transl|transp|carro/i, Truck],
  [/[aá]lbum|livro|mem[oó]r/i, BookHeart],
  [/m[uú]sic|coral/i, Music],
];
const iconeDo = (nome: string) => ICONES.find(([regra]) => regra.test(nome))?.[1] ?? Sparkles;

type PersonalizacaoProps = {
  itens: ItemResponse[];
  /** Endereço para salvar as escolhas (cadastro no apps/web). */
  linkSalvar: string;
};

/** Itens do catálogo da funerária, com total estimado das escolhas (FE-PUB-01, FUN-01). */
export function Personalizacao({ itens, linkSalvar }: PersonalizacaoProps) {
  const visiveis = itens.filter((item) => item.ativo).slice(0, 6);
  const [selecionados, setSelecionados] = useState<string[]>(() =>
    visiveis.slice(0, 3).map((item) => item.id_item),
  );

  if (visiveis.length === 0) return null;

  const escolhidos = visiveis.filter((item) => selecionados.includes(item.id_item));
  const total = escolhidos.reduce((soma, item) => soma + numero(item.preco), 0);

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
            {visiveis.map((item) => {
              const Icone = iconeDo(item.nome);
              const ativo = selecionados.includes(item.id_item);
              return (
                <button
                  key={item.id_item}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => alternar(item.id_item)}
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
                  <span className="mt-5 font-serif text-2xl text-primary">{item.nome}</span>
                  <span className="mt-1 flex items-end justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{item.descricao}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-primary">
                      + {real(item.preco, 0)}
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
              {escolhidos.length === 0 && (
                <li className="text-white/60">Escolha os itens ao lado.</li>
              )}
              {escolhidos.map((item) => (
                <li key={item.id_item} className="flex justify-between text-white/80">
                  <span>{item.nome}</span>
                  <span>{real(item.preco, 0)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-[10px] text-white/60">Total estimado</p>
                <p className="font-serif text-5xl/none">{real(total, 0)}</p>
              </div>
              <span className="text-[10px] text-white/60">à vista</span>
            </div>

            <Button
              className="mt-6 w-full bg-linear-to-r from-accent to-[#d4b16c] text-accent-foreground hover:opacity-90"
              asChild
            >
              <a href={linkSalvar}>
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
