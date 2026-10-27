import { Button } from '@ampara/ui/components/button';
import { Logo } from '@ampara/ui/components/logo';
import { env } from '@/lib/env';
import { Container } from './Container';

const LINKS = [
  { rotulo: 'Início', href: '#inicio' },
  { rotulo: 'Planos', href: '#planos' },
  { rotulo: 'Personalizar', href: '#personalizar' },
  { rotulo: 'Como funciona', href: '#como-funciona' },
];

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur">
      <Container className="flex h-[88px] items-center justify-between">
        <a href="#inicio" aria-label="Ampara, início">
          <Logo font="serif" className="text-xl text-primary" />
        </a>
        <nav className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
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
          <a href={`${env.appUrl}/entrar`} className="text-sm text-foreground hover:underline">
            Entrar
          </a>
          <Button asChild>
            <a href={`${env.appUrl}/cadastro`}>Criar meu perfil</a>
          </Button>
        </div>
      </Container>
    </header>
  );
}
