import type { ContratoDetalheResponse } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { Clock, UserRound } from 'lucide-react';
import { cpf, data, numero, real } from '@/shared/lib/formatar';
import { COBERTURA, PERIODICIDADE, STATUS_CONTRATO } from './rotulos';

/** Detalhe do contrato, usado pelo cliente (FE-CLI-05) e pela funerária (FE-ADM-03). */
export function DetalheContrato({ contrato }: { contrato: ContratoDetalheResponse }) {
  const status = STATUS_CONTRATO[contrato.status];
  const sufixo = PERIODICIDADE[contrato.periodicidade].sufixo;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <section className="rounded-xl bg-primary p-8 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-white/60 uppercase">
                Plano
              </p>
              <h2 className="mt-2 text-[28px] leading-tight font-bold">{contrato.nome_plano}</h2>
              <p className="mt-1 text-xs text-white/70">
                Titular: {contrato.titular.nome} · {COBERTURA[contrato.tipo_cobertura]}
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {status.rotulo}
            </span>
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-7 sm:grid-cols-4">
            {[
              ['Valor total', `${real(contrato.valor_total)}${sufixo}`],
              ['Pagamento', PERIODICIDADE[contrato.periodicidade].rotulo],
              ['Vencimento', `Todo dia ${numero(contrato.dia_vencimento)}`],
              ['Contratado em', data(contrato.data_contratacao)],
            ].map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="text-[11px] text-white/60">{rotulo}</dt>
                <dd className="mt-1 text-sm font-semibold">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Card className="p-6">
          <h3 className="text-base font-bold">Pessoas protegidas</h3>
          <p className="text-xs text-muted-foreground">
            A cobertura de cada pessoa começa depois da carência de {numero(contrato.carencia_dias)}{' '}
            dias.
          </p>
          <ul className="mt-4 divide-y divide-border/70">
            {contrato.pessoas_cobertas.map((pessoa) => {
              const cumprida = pessoa.carencia_cumprida_em <= hoje;
              return (
                <li key={pessoa.id_pessoa_coberta} className="flex items-center gap-4 py-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="size-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{pessoa.nome}</span>
                    <span className="text-[11px] text-subtle-foreground">
                      {pessoa.tipo === 'TITULAR' ? 'Titular' : 'Dependente'} · CPF {cpf(pessoa.cpf)}
                    </span>
                  </span>
                  <Badge variant={cumprida ? 'success' : 'info'}>
                    {cumprida
                      ? 'Coberto'
                      : `Coberto a partir de ${data(pessoa.carencia_cumprida_em)}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="self-start p-6">
        <h3 className="text-sm font-bold">Valores</h3>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plano</dt>
            <dd className="font-semibold">{real(contrato.valor_plano)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Por dependente</dt>
            <dd className="font-semibold">{real(contrato.valor_por_dependente)}</dd>
          </div>
          <div className="flex justify-between border-t border-border/70 pt-3">
            <dt className="font-semibold">Total</dt>
            <dd className="font-bold">
              {real(contrato.valor_total)}
              <span className="text-xs font-normal text-muted-foreground">{sufixo}</span>
            </dd>
          </div>
        </dl>
        {contrato.status === 'A_PAGAR' && (
          <p className="mt-5 flex gap-2 rounded-lg bg-warning px-3 py-2.5 text-xs text-warning-foreground">
            <Clock className="mt-0.5 size-3.5 shrink-0" />O contrato fica ativo com o pagamento da
            primeira cobrança.
          </p>
        )}
        {contrato.data_fim && (
          <p className="mt-4 text-xs text-muted-foreground">
            Encerrado em {data(contrato.data_fim)}.
          </p>
        )}
      </Card>
    </div>
  );
}
