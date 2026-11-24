import type { ContratoDetalheResponse, FuneralResumoResponse } from '@ampara/api-client';
import { delay, http, HttpResponse } from 'msw';
import { alterarEstado, lerEstado, type FaturaFicticia } from './estado';
import {
  certidaoDoExemplo,
  documentosDoExemplo,
  funeralDeExemplo,
  gerarFaturas,
  ID_FUNERAL_EXEMPLO,
  itensDoExemplo,
  linkDoPdfDeExemplo,
  notificacoesIniciais,
  transladoDoExemplo,
} from './exemplos';

/**
 * Faturas, funeral de exemplo e notificações da demonstração (página /demo), no formato da API
 * (COB-01, FUN-07, CER-04, NOT-02). As preferências e o resto da API ficam em demo/handlers.ts.
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
        tipo: 'PAGAMENTO_CONFIRMADO',
        titulo: 'Pagamento confirmado',
        mensagem: `Recebemos o pagamento da fatura com vencimento em ${f.data_vencimento.split('-').reverse().join('/')}.`,
        link: `/faturas/${f.id_fatura}`,
        criada_em: agora,
        lida_em: null,
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

function marcarLidas(id?: string) {
  notificacoes();
  const agora = new Date().toISOString();
  alterarEstado((e) =>
    e.notificacoes?.forEach((n) => {
      if (!n.lida_em && (!id || n.id_notificacao === id)) n.lida_em = agora;
    }),
  );
  return new HttpResponse(null, { status: 204 });
}

const naoEncontrado = (detail: string) => HttpResponse.json({ detail }, { status: 404 });
const doExemplo = (id: unknown) => id === ID_FUNERAL_EXEMPLO;

export const handlersFicticios = [
  http.get('*/api/v1/contratos/:id/faturas', async ({ request, params }) => {
    const id = String(params.id);
    await delay(300);
    if (!lerEstado().contratos.includes(id)) {
      // As faturas seguem o contrato da demonstração: valor, periodicidade, vencimento e situação.
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
    if (!fatura) return naoEncontrado('Fatura não encontrada.');
    return HttpResponse.json(semCampoInterno(confirmarPagamentos([fatura])[0]!));
  }),

  // A listagem dos funerais da família ainda não existe no backend (só aqui, na demonstração).
  http.get('*/api/v1/funerais', async () => {
    await delay(300);
    const { id_funeral, id_beneficiario, nome_falecido, status, data_hora_prevista, destinacao } =
      funeralDeExemplo();
    const resumo: FuneralResumoResponse = {
      id_funeral,
      id_beneficiario,
      nome_falecido,
      status,
      data_hora_prevista,
      destinacao,
    };
    return HttpResponse.json([resumo]);
  }),
  http.get('*/api/v1/funerais/:id', async ({ params }) => {
    await delay(300);
    return doExemplo(params.id)
      ? HttpResponse.json(funeralDeExemplo())
      : naoEncontrado('Atendimento não encontrado.');
  }),
  http.get('*/api/v1/funerais/:id/itens', ({ params }) =>
    doExemplo(params.id) ? HttpResponse.json(itensDoExemplo()) : naoEncontrado('Não encontrado.'),
  ),
  http.get('*/api/v1/funerais/:id/translados', ({ params }) =>
    HttpResponse.json(doExemplo(params.id) ? [transladoDoExemplo()] : []),
  ),
  http.get('*/api/v1/beneficiarios/:id/certidao', () => HttpResponse.json(certidaoDoExemplo())),
  http.get('*/api/v1/beneficiarios/:id/documentos', () => HttpResponse.json(documentosDoExemplo())),
  http.get('*/api/v1/beneficiarios/:id/documentos/:idDocumento/download', () =>
    HttpResponse.json({
      url: linkDoPdfDeExemplo(),
      expira_em: new Date(Date.now() + 5 * 60_000).toISOString(),
    }),
  ),

  http.get('*/api/v1/notificacoes', async ({ request }) => {
    await delay(200);
    confirmarPagamentos(Object.values(lerEstado().faturas));
    const url = new URL(request.url);
    const somenteNaoLidas = url.searchParams.get('nao_lidas') === 'true';
    const todas = notificacoes();
    const itens = somenteNaoLidas ? todas.filter((n) => !n.lida_em) : todas;
    return HttpResponse.json({
      itens,
      pagina: Number(url.searchParams.get('pagina') ?? 1),
      tamanho: Number(url.searchParams.get('tamanho') ?? 20),
      total: itens.length,
      nao_lidas: todas.filter((n) => !n.lida_em).length,
    });
  }),
  http.patch('*/api/v1/notificacoes/lidas', () => marcarLidas()),
  http.patch('*/api/v1/notificacoes/:id/lida', ({ params }) => marcarLidas(String(params.id))),
];
