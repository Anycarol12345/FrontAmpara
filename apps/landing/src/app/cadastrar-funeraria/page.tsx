import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { Cabecalho } from '@/components/Cabecalho';
import { Container } from '@/components/Container';
import { CadastroFuneraria } from '@/components/plataforma/CadastroFuneraria';
import { navegacaoDaPlataforma } from '@/components/plataforma/navegacao';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Cadastrar minha funerária · Ampara',
  description:
    'Cadastre sua funerária na Ampara e tenha sua landing, planos e painel em poucos minutos.',
};

/** Auto-cadastro de funerária (FE-PUB-04). */
export default function CadastrarFunerariaPage() {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <Cabecalho {...navegacaoDaPlataforma.cabecalho} />
      <main className="flex-1 py-16">
        <Container className="max-w-[640px]">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </a>
          <p className="mt-8 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Cadastro de funerária
          </p>
          <h1 className="mt-3 font-serif text-5xl text-primary">Vamos começar?</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Conte sobre a funerária, escolha o endereço da sua landing e quem vai administrar.
            Depois da aprovação, tudo fica no ar.
          </p>
          <div className="mt-10 rounded-2xl bg-white p-8 shadow-[0_20px_50px_-20px_rgba(19,41,74,0.18)]">
            <CadastroFuneraria
              dominioBase={env.dominioBase}
              urlPainel={new URL('/equipe/entrar', env.appUrl).toString()}
            />
          </div>
        </Container>
      </main>
    </div>
  );
}
