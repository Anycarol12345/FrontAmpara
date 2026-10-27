import { Button } from '@ampara/ui/components/button';
import { Link } from 'react-router';

export function NaoEncontradoPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-surface px-6 text-center">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Erro 404
        </p>
        <h1 className="mt-3 font-serif text-4xl">Não encontramos esta página</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço pode ter mudado ou não existe mais.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}
