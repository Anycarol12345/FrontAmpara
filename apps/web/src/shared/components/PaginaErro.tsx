import { Button } from '@ampara/ui/components/button';
import { Link } from 'react-router';
import { Eyebrow } from './Eyebrow';

type PaginaErroProps = {
  codigo: string;
  titulo: string;
  descricao: string;
  voltarPara?: string;
};

/** Base das páginas 404 e 403 (FE-03). */
export function PaginaErro({ codigo, titulo, descricao, voltarPara = '/' }: PaginaErroProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-surface px-6 text-center">
      <div>
        <Eyebrow>Erro {codigo}</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{descricao}</p>
        <Button asChild className="mt-6">
          <Link to={voltarPara}>Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}

export function AcessoNegadoPage() {
  return (
    <PaginaErro
      codigo="403"
      titulo="Você não tem acesso a esta área"
      descricao="Seu perfil não permite abrir esta página. Se achar que é um engano, fale com o gestor da funerária."
    />
  );
}

export function NaoEncontradoPage() {
  return (
    <PaginaErro
      codigo="404"
      titulo="Não encontramos esta página"
      descricao="O endereço pode ter mudado ou não existe mais."
    />
  );
}

export function TelaCarregando() {
  return (
    <div role="status" className="grid min-h-svh place-items-center bg-surface">
      <span className="size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <span className="sr-only">Carregando</span>
    </div>
  );
}
