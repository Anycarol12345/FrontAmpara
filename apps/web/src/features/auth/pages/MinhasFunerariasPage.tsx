import { useMinhasFunerarias } from '@ampara/api-client';
import { Card } from '@ampara/ui/components/card';
import { Logo } from '@ampara/ui/components/logo';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { Eyebrow } from '@/shared/components/Eyebrow';
import { obterSlugDoTenant, urlDaFuneraria } from '@/shared/lib/tenant';

/** Para quem é cliente de mais de uma funerária escolher onde entrar (FE-07, AUT-02). */
export function MinhasFunerariasPage() {
  const consulta = useMinhasFunerarias();
  const navigate = useNavigate();
  const atual = obterSlugDoTenant();

  function abrir(slug: string) {
    if (slug === atual) void navigate('/minha-conta');
    else window.location.assign(urlDaFuneraria(slug, '/entrar'));
  }

  return (
    <main className="grid min-h-svh place-items-center bg-surface px-6 py-12">
      <div className="w-full max-w-md">
        <Logo font="serif" className="text-lg text-primary" />
        <Eyebrow className="mt-10">Área do cliente</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl">Onde você quer entrar?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você tem planos em mais de uma funerária. Escolha qual deseja acompanhar agora.
        </p>

        <div className="mt-8">
          <EstadoConsulta
            consulta={consulta}
            estaVazio={(funerarias) => funerarias.length === 0}
            vazio={<Vazio titulo="Nenhuma funerária encontrada" />}
          >
            {(funerarias) => (
              <ul className="flex flex-col gap-3">
                {funerarias.map((funeraria) => (
                  <li key={funeraria.id_tenant}>
                    <button
                      type="button"
                      disabled={funeraria.suspensa}
                      onClick={() => abrir(funeraria.slug)}
                      className="w-full text-left disabled:opacity-60"
                    >
                      <Card className="flex items-center justify-between p-5 transition-colors hover:border-ring/30">
                        <span>
                          <span className="block text-sm font-bold">{funeraria.nome_fantasia}</span>
                          <span className="text-xs text-muted-foreground">
                            {funeraria.suspensa ? 'Funerária suspensa' : `${funeraria.slug}.ampara`}
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-subtle-foreground" />
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </EstadoConsulta>
        </div>
      </div>
    </main>
  );
}
