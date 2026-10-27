import { CalendarCheck, HeartHandshake, UserRound } from 'lucide-react';
import { Container, SectionHeading } from './Container';

const PASSOS = [
  {
    icone: UserRound,
    titulo: 'Crie seu perfil',
    texto: 'Em poucos minutos, sem compromisso. Salve suas escolhas e volte quando quiser.',
  },
  {
    icone: CalendarCheck,
    titulo: 'Escolha seu plano',
    texto: 'Compare com calma e inclua quem você ama. Um especialista tira suas dúvidas.',
  },
  {
    icone: HeartHandshake,
    titulo: 'Conte com a gente',
    texto: 'Quando precisar, nossa equipe cuida de tudo, a qualquer hora do dia.',
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="pt-28">
      <Container>
        <SectionHeading sobretitulo="Como funciona" titulo="Estamos ao seu lado, passo a passo" />

        <ol className="relative mx-auto mt-14 grid max-w-[1100px] gap-10 md:grid-cols-3">
          <span
            aria-hidden
            className="absolute top-[18px] right-[16%] left-[16%] hidden border-t border-dashed border-input md:block"
          />
          {PASSOS.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="relative flex flex-col items-center text-center">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-surface text-brand-800">
                <Icone className="size-4" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-serif text-2xl text-primary">{titulo}</h3>
              <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                {texto}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
