import { Container } from './Container';

const NUMEROS = [
  { valor: '24h', rotulo: 'atendimento humanizado' },
  { valor: '+12 mil', rotulo: 'famílias atendidas' },
  { valor: '4,9/5', rotulo: 'avaliação das famílias' },
  { valor: 'Brasil', rotulo: 'cobertura nacional' },
];

export function Numeros() {
  return (
    <section className="bg-[#e7edf7]">
      <Container className="grid grid-cols-2 py-10 md:grid-cols-4">
        {NUMEROS.map(({ valor, rotulo }, i) => (
          <div
            key={rotulo}
            className={`py-4 text-center ${i > 0 ? 'md:border-l md:border-border' : ''}`}
          >
            <p className="font-serif text-[40px]/none text-primary">{valor}</p>
            <p className="mt-2 text-xs text-muted-foreground">{rotulo}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
