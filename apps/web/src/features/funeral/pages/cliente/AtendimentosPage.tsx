import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { dataLonga } from '@/shared/lib/formatar';
import { STATUS_FUNERAL } from '../../components/rotulos';
import { useMeusFunerais } from '../../hooks/funerais';

/** Atendimentos de funeral ligados aos contratos do titular (FE-CLI-08, GET /funerais). */
export function AtendimentosPage() {
  const consulta = useMeusFunerais();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Atendimentos"
        descricao="Acompanhe a despedida de quem é coberto pelos seus planos."
      />
      <EstadoConsulta
        consulta={consulta}
        estaVazio={(lista) => lista.length === 0}
        vazio={
          <Card>
            <Vazio
              titulo="Nenhum atendimento"
              descricao="Quando a funerária iniciar um atendimento por um dos seus planos, você acompanha tudo por aqui."
            />
          </Card>
        }
      >
        {(lista) => (
          <Card className="divide-y divide-border/70 overflow-hidden">
            {lista.map((f) => (
              <Link
                key={f.id_funeral}
                to={`/minha-conta/atendimentos/${f.id_funeral}`}
                className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-muted/60"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold">{f.nome_falecido}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Falecimento em {dataLonga(f.data_falecimento)}
                  </p>
                </div>
                <Badge variant={f.status === 'CONCLUIDO' ? 'neutral' : 'info'}>
                  {STATUS_FUNERAL[f.status]}
                </Badge>
                <ChevronRight className="size-4 text-subtle-foreground" aria-hidden />
              </Link>
            ))}
          </Card>
        )}
      </EstadoConsulta>
    </div>
  );
}
