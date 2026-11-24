import { Button } from '@ampara/ui/components/button';
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  FileText,
  Flower2,
  Globe,
  Truck,
  UsersRound,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Cabecalho } from '@/components/Cabecalho';
import { Container, SectionHeading } from '@/components/Container';
import { navegacaoDaPlataforma } from '@/components/plataforma/navegacao';
import { Rodape } from '@/components/Rodape';

export const metadata: Metadata = {
  title: 'Ampara · Plataforma para funerárias',
  description:
    'Planos funerários online, cobrança recorrente, personalização do funeral e atendimento à família em uma só plataforma.',
};

const BENEFICIOS = [
  {
    icone: Globe,
    titulo: 'Sua landing com sua marca',
    texto: 'Um endereço próprio (suafuneraria.ampara) com seus planos, cores e contatos.',
  },
  {
    icone: CreditCard,
    titulo: 'Planos e cobrança recorrente',
    texto: 'Mensal ou anual, por cartão, Pix ou boleto, com lembretes automáticos.',
  },
  {
    icone: Flower2,
    titulo: 'Personalização do funeral',
    texto: 'Seu catálogo de itens e serviços, com as preferências registradas em vida.',
  },
  {
    icone: Truck,
    titulo: 'Translado e parceiros',
    texto: 'Frota, cartório e fornecedores recebendo as atribuições em tempo real.',
  },
  {
    icone: FileText,
    titulo: 'Documentos e certidão',
    texto: 'Checklist do que falta e acompanhamento da certidão de óbito.',
  },
  {
    icone: UsersRound,
    titulo: 'Equipe com perfis',
    texto: 'Gestor e funcionários, cada um vendo apenas o que precisa.',
  },
];

const PASSOS = [
  {
    titulo: 'Cadastre a funerária',
    texto: 'Dados da empresa, o endereço da sua landing e quem vai administrar.',
  },
  {
    titulo: 'Configure planos e catálogo',
    texto: 'Partimos de planos e itens modelo; você ajusta valores e coberturas.',
  },
  {
    titulo: 'Receba as famílias',
    texto: 'Clientes contratam online e sua equipe acompanha tudo pelo painel.',
  },
];

/** Landing da plataforma: apresenta a Ampara às funerárias (FE-PUB-04). */
export default function LandingDaPlataforma() {
  const { cabecalho, rodape } = navegacaoDaPlataforma;

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <Cabecalho {...cabecalho} />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-[60%] bg-[radial-gradient(ellipse_at_70%_30%,#c9d8ea_0%,transparent_55%),radial-gradient(ellipse_at_40%_70%,#efe3df_0%,transparent_50%)]"
          />
          <Container className="relative py-28 lg:py-40">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Para funerárias
            </p>
            <h1 className="mt-5 max-w-[760px] font-serif text-5xl/[1.08] text-primary md:text-[76px]/[1.05]">
              Sua funerária online, com <em>cuidado</em> em cada detalhe
            </h1>
            <p className="mt-7 max-w-[560px] text-lg leading-relaxed text-muted-foreground">
              Venda planos, receba as mensalidades, personalize cerimônias e acompanhe cada
              atendimento em uma plataforma pensada para quem cuida de famílias em luto.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <a href="/cadastrar-funeraria">
                  Cadastrar minha funerária <ArrowRight />
                </a>
              </Button>
              <Button size="lg" variant="ghost" className="bg-white/60" asChild>
                <a href="#como-funciona">Como funciona</a>
              </Button>
            </div>
          </Container>
        </section>

        <section id="beneficios" className="bg-[#e4ecf8] py-28">
          <Container>
            <SectionHeading
              sobretitulo="Benefícios"
              titulo="Tudo o que a funerária precisa num só lugar"
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFICIOS.map(({ icone: Icone, titulo, texto }) => (
                <div key={titulo} className="rounded-2xl bg-white p-7">
                  <span className="grid size-9 place-items-center rounded-lg bg-info text-brand-800">
                    <Icone className="size-4" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl text-primary">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section id="como-funciona" className="py-28">
          <Container>
            <SectionHeading sobretitulo="Como funciona" titulo="Comece em três passos" />
            <ol className="mx-auto mt-14 grid max-w-[1100px] gap-10 md:grid-cols-3">
              {PASSOS.map(({ titulo, texto }, i) => (
                <li key={titulo} className="flex flex-col items-center text-center">
                  <span className="grid size-10 place-items-center rounded-full border border-border bg-white font-serif text-lg text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-serif text-2xl text-primary">{titulo}</h3>
                  <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                    {texto}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
              <CalendarCheck className="size-6 text-accent" strokeWidth={1.5} />
              <h2 className="font-serif text-4xl">Pronto para começar?</h2>
              <p className="max-w-md text-sm text-white/70">
                O cadastro leva poucos minutos. Depois da aprovação, sua landing já fica no ar.
              </p>
              <Button
                size="lg"
                className="mt-4 bg-linear-to-r from-accent to-[#d4b16c] text-accent-foreground hover:opacity-90"
                asChild
              >
                <a href="/cadastrar-funeraria">
                  Cadastrar minha funerária <ArrowRight />
                </a>
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Rodape {...rodape} />
    </div>
  );
}
