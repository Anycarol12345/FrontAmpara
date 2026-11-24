import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { CheckCheck } from 'lucide-react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { ListaNotificacoes } from '../components/ListaNotificacoes';
import { foiLida, useMarcarComoLida, useNotificacoes } from '../hooks/notificacoes';

/** Central de notificações (FE-CLI-09, GET /notificacoes). */
export function NotificacoesPage() {
  const consulta = useNotificacoes();
  const marcar = useMarcarComoLida();
  const naoLidas = consulta.data?.nao_lidas ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Notificações"
        descricao="Avisos sobre seus pagamentos, seu plano e os atendimentos."
        acoes={
          naoLidas > 0 && (
            <Button variant="outline" onClick={() => marcar.mutate(undefined)}>
              <CheckCheck /> Marcar todas como lidas
            </Button>
          )
        }
      />
      <EstadoConsulta
        consulta={consulta}
        estaVazio={(pagina) => pagina.itens.length === 0}
        vazio={
          <Card>
            <Vazio
              titulo="Nenhuma notificação por enquanto"
              descricao="Quando houver novidades, elas aparecem aqui e no sino do topo."
            />
          </Card>
        }
      >
        {(pagina) => (
          <Card className="p-3">
            <ListaNotificacoes
              notificacoes={pagina.itens}
              aoAbrir={(n) => !foiLida(n) && marcar.mutate(n.id_notificacao)}
            />
          </Card>
        )}
      </EstadoConsulta>
    </div>
  );
}
