import { Logo } from '@ampara/ui/components/logo';
import { Container } from './Container';

type Coluna = { titulo: string; itens: { rotulo: string; href?: string }[] };

type RodapeProps = {
  nome?: string;
  descricao: string;
  colunas: Coluna[];
  /** Linha de contato no rodapé (ex.: "Atendimento 24h · 0800 000 2025"). */
  contato?: string | null;
};

export function Rodape({ nome, descricao, colunas, contato }: RodapeProps) {
  return (
    <footer className="bg-[#0f2240] text-white">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="inline-flex rounded-lg bg-white px-3 py-1.5 text-primary">
            <Logo font="serif" nome={nome} />
          </span>
          <p className="mt-5 max-w-[260px] text-xs leading-relaxed text-white/60">{descricao}</p>
        </div>
        {colunas.map((coluna) => (
          <div key={coluna.titulo}>
            <p className="text-xs font-semibold">{coluna.titulo}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {coluna.itens.map(({ rotulo, href }) => (
                <li key={rotulo} className="text-xs text-white/60">
                  {href ? (
                    <a href={href} className="hover:text-white">
                      {rotulo}
                    </a>
                  ) : (
                    rotulo
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="flex flex-wrap justify-between gap-4 border-t border-white/10 py-6 text-[11px] text-white/50">
        <span>
          © {new Date().getFullYear()} {nome ?? 'Ampara'}. Todos os direitos reservados.
        </span>
        {contato && <span>{contato}</span>}
        {nome && nome !== 'Ampara' && <span>Feito com Ampara</span>}
      </Container>
    </footer>
  );
}
