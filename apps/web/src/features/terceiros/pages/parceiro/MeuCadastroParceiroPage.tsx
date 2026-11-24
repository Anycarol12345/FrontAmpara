import { useMeuCadastroTerceiro } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { STATUS_TERCEIRO, TIPO_TERCEIRO } from '../../components/rotulos';

/** Cadastro do parceiro nesta funerária, como a funerária registrou (FE-TER-01, TER-01). */
export function MeuCadastroParceiroPage() {
  const consulta = useMeuCadastroTerceiro();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        sobretitulo="Portal do parceiro"
        titulo="Meu cadastro"
        descricao="Para mudar algum dado ou a área de atuação, fale com a funerária."
      />
      <EstadoConsulta consulta={consulta}>
        {(t) => {
          const atuacao = [
            ...(t.area_atuacao.ufs ?? []),
            ...(t.area_atuacao.cidades ?? []).map((c) => `${c.nome}-${c.uf}`),
          ];
          const linhas: [string, string][] = [
            ['Tipo', TIPO_TERCEIRO[t.tipo]],
            ['CPF ou CNPJ', t.cpf_cnpj],
            ['E-mail', t.email],
            ['Telefone', t.telefone ?? '—'],
            ['Onde atende', atuacao.join(', ') || '—'],
          ];
          return (
            <Card className="flex flex-col gap-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">{t.nome_razao_social}</h2>
                <Badge variant={STATUS_TERCEIRO[t.status].variante}>
                  {STATUS_TERCEIRO[t.status].rotulo}
                </Badge>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                {linhas.map(([rotulo, valor]) => (
                  <div key={rotulo} className="flex justify-between gap-6">
                    <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
                    <dd className="text-right font-semibold">{valor}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          );
        }}
      </EstadoConsulta>
    </div>
  );
}
