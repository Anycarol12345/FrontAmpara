import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useMeusFunerais } from '../hooks/funerais';
import { STATUS_FUNERAL } from './rotulos';

/** Aviso no início da área do cliente quando há um atendimento em andamento (FE-CLI-08). */
export function AtendimentoEmAndamento() {
  const consulta = useMeusFunerais();
  const emAndamento = consulta.data?.filter(
    (f) => f.status !== 'CONCLUIDO' && f.status !== 'CANCELADO',
  );

  if (!emAndamento?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {emAndamento.map((f) => (
        <Link
          key={f.id_funeral}
          to={`/minha-conta/atendimentos/${f.id_funeral}`}
          className="flex items-center gap-4 rounded-xl border border-border bg-card px-6 py-4 transition-colors hover:bg-muted/60"
        >
          <div className="flex-1">
            <p className="text-sm font-semibold">Despedida de {f.nome_falecido}</p>
            <p className="text-xs text-muted-foreground">{STATUS_FUNERAL[f.status]}</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            Acompanhar <ArrowRight className="size-3.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
