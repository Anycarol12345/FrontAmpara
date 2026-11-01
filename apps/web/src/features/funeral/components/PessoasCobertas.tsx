import { useElegibilidadeContrato, type ElegibilidadeResponse } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { cn } from '@ampara/ui/lib/utils';
import { UsersRound } from 'lucide-react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { data } from '@/shared/lib/formatar';

/** "CARÊNCIA_NÃO_CUMPRIDA" → "Carência não cumprida"; mensagens já legíveis passam como vieram. */
function motivoLegivel(motivo: string | null) {
  if (!motivo) return 'Não pode usar o plano no momento.';
  if (!/^[A-ZÀ-Ú_]+$/.test(motivo)) return motivo;
  const texto = motivo.replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Etapa 2 do registro do beneficiário: quem o contrato cobre e se pode usar o plano hoje (FE-ADM-04). */
export function PessoasCobertas({
  idContrato,
  selecionada,
  aoSelecionar,
}: {
  idContrato: string;
  selecionada: string | null;
  aoSelecionar: (pessoa: ElegibilidadeResponse) => void;
}) {
  const consulta = useElegibilidadeContrato(idContrato);

  return (
    <EstadoConsulta
      consulta={consulta}
      estaVazio={(pessoas) => pessoas.length === 0}
      vazio={
        <Vazio
          titulo="Nenhuma pessoa coberta"
          descricao="Este contrato não tem pessoas cobertas para registrar."
        />
      }
    >
      {(pessoas) => (
        <div role="radiogroup" aria-label="Pessoa falecida" className="flex flex-col gap-3">
          {pessoas.map((pessoa) => {
            const marcada = selecionada === pessoa.id_pessoa_coberta;
            const carenciaFutura = new Date(pessoa.carencia_cumprida_em) > new Date();
            return (
              <button
                key={pessoa.id_pessoa_coberta}
                type="button"
                role="radio"
                aria-checked={marcada}
                disabled={!pessoa.elegivel}
                onClick={() => aoSelecionar(pessoa)}
                className={cn(
                  'flex w-full items-center gap-4 rounded-xl border border-border/60 bg-card px-4 py-3.5 text-left transition-colors',
                  pessoa.elegivel
                    ? 'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/15'
                    : 'cursor-not-allowed opacity-70',
                  marcada && 'border-primary ring-1 ring-primary',
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <UsersRound className="size-4" strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold">{pessoa.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {pessoa.tipo === 'TITULAR' ? 'Titular' : 'Dependente'}
                    {!pessoa.elegivel && ` · ${motivoLegivel(pessoa.motivo)}`}
                    {!pessoa.elegivel &&
                      carenciaFutura &&
                      ` · carência cumprida em ${data(pessoa.carencia_cumprida_em)}`}
                  </span>
                </span>
                <Badge variant={pessoa.elegivel ? 'success' : 'warning'}>
                  {pessoa.elegivel ? 'Elegível' : 'Não elegível'}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </EstadoConsulta>
  );
}
