import { Logo } from '@ampara/ui/components/logo';
import { Container } from './Container';

const COLUNAS = [
  { titulo: 'Ampara', links: ['Sobre nós', 'Planos', 'Personalizar'] },
  { titulo: 'Ajuda', links: ['Perguntas frequentes', 'Contato', 'Ouvidoria'] },
  { titulo: 'Legal', links: ['Termos de uso', 'Privacidade', 'Cookies'] },
];

export function Rodape() {
  return (
    <footer className="bg-[#0f2240] text-white">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="inline-flex rounded-lg bg-white px-3 py-1.5 text-primary">
            <Logo font="serif" />
          </span>
          <p className="mt-5 max-w-[240px] text-xs leading-relaxed text-white/60">
            Planos funerários com cuidado, transparência e atendimento 24h em todo o Brasil.
          </p>
        </div>
        {COLUNAS.map((coluna) => (
          <div key={coluna.titulo}>
            <p className="text-xs font-semibold">{coluna.titulo}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {coluna.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-xs text-white/60 hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="flex flex-wrap justify-between gap-4 border-t border-white/10 py-6 text-[11px] text-white/50">
        <span>© {new Date().getFullYear()} Ampara. Todos os direitos reservados.</span>
        <span>Atendimento 24h · 0800 000 2025</span>
      </Container>
    </footer>
  );
}
