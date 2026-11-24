import { ComoFunciona } from '@/components/ComoFunciona';
import { Depoimento } from '@/components/Depoimento';
import { Hero } from '@/components/Hero';
import { Numeros } from '@/components/Numeros';
import { Personalizacao } from '@/components/Personalizacao';
import { Planos } from '@/components/Planos';
import { listarCatalogo, listarPlanos, obterFuneraria } from '@/lib/api';
import { contatoPrincipal } from '@/lib/funeraria';
import { linkDoApp } from '@/lib/links';

type Props = { params: Promise<{ slug: string }> };

/** Landing da funerária com os planos e o catálogo vindos da API (FE-PUB-01). */
export default async function LandingDaFuneraria({ params }: Props) {
  const { slug } = await params;
  const [funeraria, planos, catalogo] = await Promise.all([
    obterFuneraria(slug),
    listarPlanos(slug),
    listarCatalogo(slug),
  ]);

  return (
    <>
      <Hero />
      <Numeros />
      <Planos planos={planos} contato={funeraria ? contatoPrincipal(funeraria) : null} />
      <Personalizacao itens={catalogo} linkSalvar={linkDoApp(slug, '/cadastro')} />
      <ComoFunciona />
      <Depoimento />
    </>
  );
}
