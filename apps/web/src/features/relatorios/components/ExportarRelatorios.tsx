import {
  baixarArquivo,
  getRelatorioContratosUrl,
  getRelatorioFinanceiroUrl,
  getRelatorioFuneraisUrl,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Campo, ErroFormulario } from '@/shared/components/Campo';

type Relatorio = {
  id: 'financeiro' | 'contratos' | 'funerais';
  titulo: string;
  descricao: string;
  periodo: string;
  status: { valor: string; rotulo: string }[];
  url: (params: { de?: string; ate?: string; status?: string; formato: string }) => string;
};

const RELATORIOS: Relatorio[] = [
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    descricao: 'Faturas com valor, encargos, pagamento e situação.',
    periodo: 'Vencimento',
    status: [
      { valor: 'PENDENTE', rotulo: 'Em aberto' },
      { valor: 'PROCESSANDO', rotulo: 'Pagamento em processamento' },
      { valor: 'PAGA', rotulo: 'Pagas' },
      { valor: 'VENCIDA', rotulo: 'Vencidas' },
      { valor: 'CANCELADA', rotulo: 'Canceladas' },
    ],
    url: getRelatorioFinanceiroUrl,
  },
  {
    id: 'contratos',
    titulo: 'Contratos',
    descricao: 'Contratações com plano, titular, valor e situação.',
    periodo: 'Contratação',
    status: [
      { valor: 'A_PAGAR', rotulo: 'Aguardando o primeiro pagamento' },
      { valor: 'ATIVO', rotulo: 'Ativos' },
      { valor: 'SUSPENSO', rotulo: 'Suspensos' },
      { valor: 'CANCELADO', rotulo: 'Cancelados' },
    ],
    url: getRelatorioContratosUrl,
  },
  {
    id: 'funerais',
    titulo: 'Funerais',
    descricao: 'Atendimentos com data da cerimônia, destinação e situação.',
    periodo: 'Cerimônia',
    status: [
      { valor: 'REGISTRADO', rotulo: 'Registrados' },
      { valor: 'EM_PREPARACAO', rotulo: 'Em preparação' },
      { valor: 'VELORIO', rotulo: 'Em velório' },
      { valor: 'CONCLUIDO', rotulo: 'Concluídos' },
      { valor: 'CANCELADO', rotulo: 'Cancelados' },
    ],
    url: getRelatorioFuneraisUrl,
  },
];

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Sem período, o backend usa o mês atual; o período pode ter até 366 dias. */
function validarPeriodo(de: string, ate: string): string | null {
  if (!de && !ate) return null;
  if (!de || !ate) return 'Informe o início e o fim, ou deixe os dois em branco para o mês atual.';
  if (ate < de) return 'O fim precisa ser depois do início.';
  const dias = (new Date(ate).getTime() - new Date(de).getTime()) / 86_400_000;
  if (dias > 366) return 'Escolha um período de até 366 dias.';
  return null;
}

/** Exportação dos relatórios em CSV, por período e situação (FE-ADM-13, REL-02). */
export function ExportarRelatorios() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {RELATORIOS.map((r) => (
        <CartaoRelatorio key={r.id} relatorio={r} />
      ))}
    </div>
  );
}

function CartaoRelatorio({ relatorio: r }: { relatorio: Relatorio }) {
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState<string>();
  const [baixando, setBaixando] = useState(false);

  const baixar = async () => {
    const problema = validarPeriodo(de, ate);
    setErro(problema ?? undefined);
    if (problema) return;
    setBaixando(true);
    try {
      const { arquivo, nome } = await baixarArquivo(
        r.url({
          de: de || undefined,
          ate: ate || undefined,
          status: status || undefined,
          formato: 'csv',
        }),
      );
      const link = document.createElement('a');
      link.href = URL.createObjectURL(arquivo);
      link.download = nome ?? `${r.id}-${de || 'mes-atual'}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Relatório baixado. A exportação fica registrada na auditoria.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o relatório.');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-bold">{r.titulo}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{r.descricao}</p>
      </div>
      <ErroFormulario mensagem={erro} />
      <div className="grid grid-cols-2 gap-3">
        <Campo id={`${r.id}-de`} label={`${r.periodo}: de`}>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </Campo>
        <Campo id={`${r.id}-ate`} label="até">
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </Campo>
      </div>
      <Campo id={`${r.id}-status`} label="Situação">
        <select className={classeSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas</option>
          {r.status.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
      </Campo>
      <p className="text-[11px] text-subtle-foreground">
        Sem datas, vale o mês atual. CSV separado por ponto e vírgula, abre no Excel.
      </p>
      <Button variant="outline" disabled={baixando} onClick={() => void baixar()}>
        <Download /> {baixando ? 'Gerando...' : 'Baixar CSV'}
      </Button>
    </Card>
  );
}
