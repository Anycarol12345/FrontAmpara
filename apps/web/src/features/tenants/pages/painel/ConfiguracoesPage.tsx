import { useObterConfiguracoes } from '@ampara/api-client';
import { useSearchParams } from 'react-router';
import { TabelaPrecosTranslado } from '@/features/translado';
import { Abas, PainelDaAba } from '@/shared/components/Abas';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { IdentidadeVisualForm } from '../../components/IdentidadeVisualForm';
import { CobrancaForm, OperacaoForm } from '../../components/ParametrosForm';
import { RecebimentosStripe } from '../../components/RecebimentosStripe';

const ABAS = [
  { id: 'identidade', titulo: 'Identidade visual' },
  { id: 'cobranca', titulo: 'Cobrança' },
  { id: 'operacao', titulo: 'Lembretes e parceiros' },
  { id: 'translado', titulo: 'Translado' },
] as const;

/** Configurações da funerária, com a aba ativa na URL (?aba=) (FE-ADM-12, TEN-02). */
export function ConfiguracoesPage() {
  const [parametros, setParametros] = useSearchParams();
  const ativa = ABAS.find((aba) => aba.id === parametros.get('aba'))?.id ?? 'identidade';
  const consulta = useObterConfiguracoes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Gestão"
        titulo="Configurações"
        descricao="As mudanças valem para novos contratos e para as próximas faturas."
      />
      <Abas
        abas={ABAS}
        ativa={ativa}
        aoMudar={(id) => setParametros({ aba: id }, { replace: true })}
        rotulo="Seções das configurações"
      />
      <PainelDaAba id={ativa}>
        {ativa === 'translado' ? (
          <TabelaPrecosTranslado />
        ) : (
          <EstadoConsulta consulta={consulta}>
            {(configuracoes) => (
              <>
                {ativa === 'identidade' && <IdentidadeVisualForm configuracoes={configuracoes} />}
                {ativa === 'cobranca' && (
                  <>
                    <RecebimentosStripe />
                    <CobrancaForm configuracoes={configuracoes} />
                  </>
                )}
                {ativa === 'operacao' && <OperacaoForm configuracoes={configuracoes} />}
              </>
            )}
          </EstadoConsulta>
        )}
      </PainelDaAba>
    </div>
  );
}
