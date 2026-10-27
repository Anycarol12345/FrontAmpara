import { Cabecalho } from '@/components/Cabecalho';
import { ComoFunciona } from '@/components/ComoFunciona';
import { Depoimento } from '@/components/Depoimento';
import { Hero } from '@/components/Hero';
import { Numeros } from '@/components/Numeros';
import { Personalizacao } from '@/components/Personalizacao';
import { Planos } from '@/components/Planos';
import { Rodape } from '@/components/Rodape';

// Landing da funerária (FE-PUB-01). Por enquanto com os planos e o catálogo modelo.
export default function HomePage() {
  return (
    <>
      <Cabecalho />
      <main>
        <Hero />
        <Numeros />
        <Planos />
        <Personalizacao />
        <ComoFunciona />
        <Depoimento />
      </main>
      <Rodape />
    </>
  );
}
