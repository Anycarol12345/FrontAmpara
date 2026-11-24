import { Button } from '@ampara/ui/components/button';

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-svh place-items-center bg-surface px-6 text-center">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Erro 404
        </p>
        <h1 className="mt-3 font-serif text-4xl text-primary">Não encontramos esta página</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço pode estar errado ou a funerária ainda não está no ar.
        </p>
        <Button asChild className="mt-6">
          <a href="/">Voltar ao início</a>
        </Button>
      </div>
    </main>
  );
}
