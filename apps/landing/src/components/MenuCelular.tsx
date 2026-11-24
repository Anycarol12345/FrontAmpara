'use client';

import { Button } from '@ampara/ui/components/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

type Link = { rotulo: string; href: string };

/** Menu do cabeçalho no celular: links da página, a ação principal e "Entrar". */
export function MenuCelular({
  navegacao,
  entrar,
  acao,
}: {
  navegacao: Link[];
  entrar: Link;
  acao: Link;
}) {
  const [aberto, setAberto] = useState(false);
  // Os links levam a seções da própria página: o menu fecha ao escolher.
  const fechar = () => setAberto(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="menu-celular"
        onClick={() => setAberto((a) => !a)}
        className="grid size-10 place-items-center rounded-full text-primary transition-colors hover:bg-muted"
      >
        {aberto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        <span className="sr-only">{aberto ? 'Fechar o menu' : 'Abrir o menu'}</span>
      </button>
      {aberto && (
        <nav
          id="menu-celular"
          className="absolute inset-x-0 top-full border-b border-border/60 bg-surface px-5 pt-2 pb-6 shadow-lg"
        >
          <ul className="flex flex-col">
            {navegacao.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={fechar}
                  className="block border-b border-border/50 py-3.5 text-base text-foreground"
                >
                  {link.rotulo}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-3">
            <Button asChild className="w-full">
              <a href={acao.href} onClick={fechar}>
                {acao.rotulo}
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={entrar.href} onClick={fechar}>
                {entrar.rotulo}
              </a>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
