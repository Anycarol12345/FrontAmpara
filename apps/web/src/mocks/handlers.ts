import type { ContratoDetalheResponse } from '@ampara/api-client';
import { delay, http, HttpResponse } from 'msw';
import type { FuneralResponse, PreferenciaFuneralResponse } from '@/features/funeral';
import { alterarEstado, lerEstado, type FaturaFicticia } from './estado';
import { funeralDeExemplo, gerarFaturas, notificacoesIniciais } from './exemplos';

/**
 * Dados fictícios das rotas que o backend ainda não publicou (FE-CLI-06 a 09).
 * Seguem os contratos dos cards COB-01, FUN-02, FUN-07 e NOT-02. Todo o resto vai para a API real.
 * Quando o backend publicar uma destas rotas, apague o handler dela.
 */

/** Pix e boleto pagos viram PAGA depois do tempo de confirmação (COB-06). */
function confirmarPagamentos(faturas: FaturaFicticia[]) {
  const agora = new Date().toISOString();
  const confirmadas = faturas.filter((f) => f.status === 'PROCESSANDO' && f.confirmar_em! <= agora);
  if (confirmadas.length === 0) return faturas;
  const estado = alterarEstado((e) => {
    for (const f of confirmadas) {
      e.faturas[f.id_fatura] = { ...f, status: 'PAGA', confirmar_em: undefined };
      e.notificacoes?.unshift({
        id_notificacao: `pagamento-${f.id_fatura}`,
        titulo: 'Pagamento confirmado',
        mensagem: `Recebemos o pagamento da fatura com vencimento em ${f.data_vencimento.split('-').reverse().join('/')}.`,
        link: '/minha-conta/faturas',
        lida: false,
        criada_em: agora,
      });
    }
  });
  return faturas.map((f) => estado.faturas[f.id_fatura] ?? f);
}

const semCampoInterno = ({ confirmar_em: _, ...fatura }: FaturaFicticia) => fatura;

function notificacoes() {
  const { notificacoes: salvas } = lerEstado();
  if (salvas) return salvas;
  return alterarEstado((e) => (e.notificacoes = notificacoesIniciais())).notificacoes!;
}

let funeral: FuneralResponse | undefined;
const exemplo = () => (funeral ??= funeralDeExemplo());

export const handlersFicticios = [
  http.get('*/api/v1/contratos/:id/faturas', async ({ request, params }) => {
    const id = String(params.id);
    await delay(300);
    if (!lerEstado().contratos.includes(id)) {
      // As faturas seguem o contrato: valor, periodicidade, vencimento e situação.
      // Sem bypass, o pedido passa de novo pelo MSW: na demonstração, quem responde é o contrato fictício.
      const resposta = await fetch(new URL(`/api/v1/contratos/${id}`, request.url), {
        headers: request.headers,
      });
      if (!resposta.ok) return HttpResponse.json([]);
      const contrato = (await resposta.json()) as ContratoDetalheResponse;
      alterarEstado((e) => {
        e.contratos.push(id);
        for (const f of gerarFaturas(contrato)) e.faturas[f.id_fatura] = f;
      });
    }
    const doContrato = Object.values(lerEstado().faturas).filter((f) => f.id_contrato === id);
    return HttpResponse.json(confirmarPagamentos(doContrato).map(semCampoInterno));
  }),

  http.get('*/api/v1/faturas/:id', ({ params }) => {
    const fatura = lerEstado().faturas[String(params.id)];
    if (!fatura) return HttpResponse.json({ detail: 'Fatura não encontrada.' }, { status: 404 });
    return HttpResponse.json(semCampoInterno(confirmarPagamentos([fatura])[0]!));
  }),

  http.get('*/api/v1/preferencias-funeral', async () => {
    await delay(300);
    return HttpResponse.json(Object.values(lerEstado().preferencias));
  }),

  http.put('*/api/v1/preferencias-funeral/:id', async ({ request, params }) => {
    const dados = (await request.json()) as Omit<PreferenciaFuneralResponse, 'id_pessoa'>;
    const salva: PreferenciaFuneralResponse = {
      ...dados,
      id_pessoa: String(params.id),
      atualizado_em: new Date().toISOString(),
    };
    alterarEstado((e) => (e.preferencias[salva.id_pessoa] = salva));
    await delay(400);
    return HttpResponse.json(salva);
  }),

  http.get('*/api/v1/funerais', async () => {
    await delay(300);
    const { id_funeral, nome_falecido, data_falecimento, status } = exemplo();
    return HttpResponse.json([{ id_funeral, nome_falecido, data_falecimento, status }]);
  }),

  http.get('*/api/v1/funerais/:id', async ({ params }) => {
    await delay(300);
    if (params.id !== exemplo().id_funeral) {
      return HttpResponse.json({ detail: 'Atendimento não encontrado.' }, { status: 404 });
    }
    return HttpResponse.json(exemplo());
  }),

  http.get('*/api/v1/notificacoes', async () => {
    await delay(200);
    confirmarPagamentos(Object.values(lerEstado().faturas));
    return HttpResponse.json(notificacoes());
  }),

  http.patch('*/api/v1/notificacoes/lidas', () => {
    notificacoes();
    alterarEstado((e) => e.notificacoes?.forEach((n) => (n.lida = true)));
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('*/api/v1/notificacoes/:id/lida', ({ params }) => {
    notificacoes();
    alterarEstado((e) =>
      e.notificacoes?.forEach((n) => n.id_notificacao === params.id && (n.lida = true)),
    );
    return new HttpResponse(null, { status: 204 });
  }),
];
