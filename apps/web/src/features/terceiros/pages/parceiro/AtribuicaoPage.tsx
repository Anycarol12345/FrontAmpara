import { useMinhasAtribuicoes } from '@ampara/api-client';
import { Card } from '@ampara/ui/components/card';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { descricaoCurta, TIPO_ATRIBUICAO } from '../../components/atribuicoes';
import { ServicoCertidao } from '../../components/ServicoCertidao';
import { ServicoPedido } from '../../components/ServicoPedido';
import { ServicoTranslado } from '../../components/ServicoTranslado';

/** Serviço aceito pelo parceiro: o que fazer e onde registrar cada etapa (FE-TER-01). */
export function AtribuicaoPage() {
  const { id = '' } = useParams();
  const consulta = useMinhasAtribuicoes();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        to="/parceiro"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Atribuições
      </Link>
      <EstadoConsulta consulta={consulta}>
        {(lista) => {
          const a = lista.find((x) => x.id_atribuicao === id);
          if (!a || a.status !== 'ACEITA')
            return (
              <Card>
                <Vazio
                  titulo="Serviço não disponível"
                  descricao="Ele pode ter sido concluído, cancelado ou ainda não foi aceito."
                />
              </Card>
            );
          return (
            <>
              <PageHeader sobretitulo={TIPO_ATRIBUICAO[a.tipo]} titulo={descricaoCurta(a).titulo} />
              {a.tipo === 'TRANSLADO' && <ServicoTranslado atribuicao={a} />}
              {a.tipo === 'CERTIDAO' && <ServicoCertidao atribuicao={a} />}
              {a.tipo === 'PEDIDO' && <ServicoPedido atribuicao={a} />}
            </>
          );
        }}
      </EstadoConsulta>
    </div>
  );
}
