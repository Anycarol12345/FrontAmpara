import { PageHeader } from './PageHeader';
import { Vazio } from './EstadoConsulta';

/** Página inicial provisória de uma área cujas telas ainda não foram feitas. */
export function EmConstrucao({
  sobretitulo,
  titulo,
  card,
}: {
  sobretitulo: string;
  titulo: string;
  card: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader sobretitulo={sobretitulo} titulo={titulo} />
      <div className="rounded-xl bg-card">
        <Vazio
          titulo="Esta área está em construção"
          descricao={`As telas desta área entram no card ${card}.`}
        />
      </div>
    </div>
  );
}
