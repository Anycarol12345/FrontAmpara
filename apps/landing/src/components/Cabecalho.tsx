import { Button } from '@ampara/ui/components/button';
import { Logo } from '@ampara/ui/components/logo';
import { Container } from './Container';

type Link = { rotulo: string; href: string };

type CabecalhoProps = {
  /** Nome da funerária. Sem nome, mostra a marca Ampara (landing da plataforma). */
  nome?: string;
  logoUrl?: string | null;
  navegacao: Link[];
  entrar: Link;
  acao: Link;
};

export function Cabecalho({ nome, logoUrl, navegacao, entrar, acao }: CabecalhoProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur">
      <Container className="flex h-[88px] items-center justify-between gap-6">
        <a href="/" aria-label={`${nome ?? 'Ampara'}, início`} className="flex items-center gap-3">
          {logoUrl ? (
            // Logo servido pela API, com tamanho variável: <img> simples em vez do next/image.
            <img src={logoUrl} alt="" className="h-9 w-auto" />
          ) : nome ? null : (
            <Logo font="serif" className="text-xl text-primary" />
          )}
          {nome && <span className="font-serif text-xl text-primary">{nome}</span>}
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {navegacao.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <a href={entrar.href} className="text-sm text-foreground hover:underline">
            {entrar.rotulo}
          </a>
          <Button asChild>
            <a href={acao.href}>{acao.rotulo}</a>
          </Button>
        </div>
      </Container>
    </header>
  );
}
