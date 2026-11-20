import { Button } from '@ampara/ui/components/button';
import { ArrowRight, Clock, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { Container } from './Container';

const DESTAQUES = [
  { icone: Clock, texto: 'Atendimento 24h em todo o Brasil' },
  { icone: HeartHandshake, texto: 'Planos para toda a família' },
  { icone: ShieldCheck, texto: 'Sem burocracia na hora difícil' },
];

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <Ceu />
      <Container className="relative flex min-h-[680px] flex-col justify-center py-24 xl:min-h-[1110px]">
        <div className="max-w-[860px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3.5 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            Cuidado do planejamento à memória
          </span>
          <h1 className="mt-7 max-w-[740px] font-serif text-6xl/[1.05] md:text-[90px]/[1.05] tracking-tight text-primary">
            Planejar também é uma forma de <em>cuidar</em>
          </h1>
          <p className="mt-8 max-w-[560px] text-lg leading-relaxed text-muted-foreground">
            Planos funerários para você viver hoje com tranquilidade, sabendo que cada detalhe está
            pensado com carinho, transparência e respeito pela sua história.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <a href="#planos">
                Conhecer os planos <ArrowRight />
              </a>
            </Button>
            <Button size="lg" variant="ghost" className="bg-white/60" asChild>
              <a href="#personalizar">Personalizar</a>
            </Button>
          </div>
          <ul className="mt-10 grid max-w-[620px] grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="grid size-6 place-items-center rounded-md bg-info text-brand-800">
                  <Icone className="size-3.5" strokeWidth={1.75} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/**
 * Céu com nuvens do protótipo do Figma (ampara-hero-clouds, 2816×1584). A foto já é clara à esquerda,
 * onde fica o texto; o degradê só garante a leitura em telas estreitas.
 */
function Ceu() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[url(/ceu-nuvens.jpg)] bg-cover bg-[position:70%_center]" />
      <div className="absolute inset-0 bg-linear-to-r from-surface/90 from-15% via-surface/40 via-40% to-transparent to-65%" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-surface to-transparent" />
    </div>
  );
}
