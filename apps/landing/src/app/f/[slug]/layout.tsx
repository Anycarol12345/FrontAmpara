import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Cabecalho } from '@/components/Cabecalho';
import { Rodape } from '@/components/Rodape';
import { obterFuneraria } from '@/lib/api';
import { estiloDaMarca, navegacaoDa, nomeDa } from '@/lib/funeraria';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const funeraria = await obterFuneraria((await params).slug);
  if (!funeraria) return {};
  const nome = nomeDa(funeraria);
  const descricao = `Planos funerários da ${nome}: atendimento 24h, personalização da cerimônia e cuidado em cada detalhe.`;

  return {
    title: { default: `${nome} · Planos funerários`, template: `%s · ${nome}` },
    description: descricao,
    openGraph: { title: nome, description: descricao, type: 'website', locale: 'pt_BR' },
    ...(funeraria.identidade_visual.logo_url && {
      icons: { icon: funeraria.identidade_visual.logo_url },
    }),
  };
}

/** Landing de cada funerária no subdomínio dela, com a marca e os contatos (FE-PUB-01). */
export default async function LayoutDaFuneraria({
  params,
  children,
}: Props & { children: ReactNode }) {
  const funeraria = await obterFuneraria((await params).slug);
  if (!funeraria) notFound();

  const { cabecalho, rodape } = navegacaoDa(funeraria);

  return (
    <div style={estiloDaMarca(funeraria)} className="flex min-h-svh flex-col bg-surface">
      <Cabecalho {...cabecalho} />
      <main className="flex-1">{children}</main>
      <Rodape {...rodape} />
    </div>
  );
}
