import { Heart } from 'lucide-react';
import { Container } from './Container';

export function Depoimento() {
  return (
    <section className="py-28">
      <Container>
        <figure className="grid overflow-hidden rounded-2xl bg-[#e4ecf8] md:grid-cols-2">
          <div className="flex flex-col justify-center px-10 py-16 lg:px-16">
            <Heart className="size-5 text-brand-800" strokeWidth={1.5} />
            <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              O que dizem as famílias
            </p>
            <blockquote className="mt-4 max-w-[440px] font-serif text-[32px]/[1.3] text-primary">
              “Em um momento tão delicado, encontramos calma, respeito e alguém para nos ouvir.”
            </blockquote>
            <figcaption className="mt-6 text-xs text-muted-foreground">
              Helena M. · cliente desde 2021
            </figcaption>
          </div>
          <Ilustracao />
        </figure>
      </Container>
    </section>
  );
}

/** Arte abstrata do protótipo (sol e folhas), feita em CSS até termos a imagem exportada. */
function Ilustracao() {
  return (
    <div
      aria-hidden
      className="relative min-h-[460px] overflow-hidden bg-linear-to-b from-[#a9b9cb] to-[#6f86a3]"
    >
      <span className="absolute top-[6%] left-[14%] size-[86%] rounded-full border border-white/25" />
      <span className="absolute top-[16%] left-[44%] size-[110px] rounded-full bg-radial from-[#fbf3e1] via-[#e9d6ae] to-[#c7a978] shadow-[0_0_60px_rgba(240,220,180,0.6)]" />
      <span className="absolute top-[30%] left-[16%] h-[90%] w-[38%] rotate-[28deg] rounded-[100%_0] bg-linear-to-br from-[#5d7495] to-[#203a5e]" />
      <span className="absolute top-[26%] left-[44%] h-[80%] w-[40%] rotate-[-20deg] rounded-[0_100%] bg-linear-to-br from-[#dfe7ef] to-[#8ea3bc] opacity-90" />
      <span className="absolute bottom-5 left-5 text-[11px] text-white/85">
        Cada despedida, do jeito de quem partiu.
      </span>
    </div>
  );
}
