import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ampara · Planos funerários',
  description:
    'Planos funerários com atendimento 24h, personalização da cerimônia e cuidado em cada detalhe.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-surface">{children}</body>
    </html>
  );
}
