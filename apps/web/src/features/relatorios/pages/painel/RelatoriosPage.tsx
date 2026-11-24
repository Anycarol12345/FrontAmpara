import { useSearchParams } from 'react-router';
import { Abas, PainelDaAba } from '@/shared/components/Abas';
import { PageHeader } from '@/shared/components/PageHeader';
import { Auditoria } from '../../components/Auditoria';
import { ExportarRelatorios } from '../../components/ExportarRelatorios';
import { GraficosFinanceiros } from '../../components/GraficosFinanceiros';

const ABAS = [
  { id: 'indicadores', titulo: 'Indicadores do mês' },
  { id: 'exportar', titulo: 'Exportar' },
  { id: 'auditoria', titulo: 'Auditoria' },
] as const;

/** Relatórios da gestão: indicadores, exportação em CSV e o registro de auditoria (FE-ADM-13). */
export function RelatoriosPage() {
  const [parametros, setParametros] = useSearchParams();
  const ativa = ABAS.find((a) => a.id === parametros.get('aba'))?.id ?? 'indicadores';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Gestão"
        titulo="Relatórios"
        descricao="Receita, contratos e funerais, e quem fez cada ação no sistema."
      />
      <Abas
        abas={ABAS}
        ativa={ativa}
        aoMudar={(aba) => setParametros({ aba }, { replace: true })}
        rotulo="Relatórios"
      />
      <PainelDaAba id={ativa}>
        {ativa === 'indicadores' && <GraficosFinanceiros />}
        {ativa === 'exportar' && <ExportarRelatorios />}
        {ativa === 'auditoria' && <Auditoria />}
      </PainelDaAba>
    </div>
  );
}
