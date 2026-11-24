import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { DocumentosDoFuneral } from './DocumentosDoFuneral';

const rotas = [{ path: '/', element: <DocumentosDoFuneral idBeneficiario="b1" /> }];
const PRAZO = { data: '2026-11-03', dias_restantes: 1, vencido: false };
const CHECKLIST = {
  dados: {
    nome_falecido: 'Maria Souza',
    data_nascimento: '1950-03-10',
    data_falecimento: '2026-11-01T08:00:00Z',
    local_falecimento: 'Hospital Santa Clara',
    nome_declarante: 'Ana Souza',
    telefone_declarante: '(11) 98888-0000',
  },
  documentos: [
    { tipo: 'DECLARACAO_OBITO', descricao: 'Declaração de óbito (DO)', presente: true },
    { tipo: 'DOCUMENTO_DECLARANTE', descricao: 'Documento do declarante', presente: false },
  ],
  prazo: PRAZO,
  pronto_para_solicitar: false,
};

beforeEach(() => {
  servidor.use(
    // A restauração da sessão roda no primeiro teste do arquivo: sem ela, o 401 limparia o cache.
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('FUNCIONARIO'))),
    http.get('*/api/v1/beneficiarios/b1/documentos', () =>
      HttpResponse.json([
        {
          id_documento: 'd1',
          tipo: 'DECLARACAO_OBITO',
          nome_original: 'do.pdf',
          content_type: 'application/pdf',
          tamanho: 240_000,
          enviado_em: '2026-11-01T10:00:00Z',
        },
      ]),
    ),
    http.get('*/api/v1/gestao/usuarios', () =>
      HttpResponse.json({ itens: [], pagina: 1, tamanho: 100, total: 0 }),
    ),
    http.get('*/api/v1/gestao/terceiros', () =>
      HttpResponse.json({ itens: [], pagina: 1, tamanho: 100, total: 0 }),
    ),
  );
  entrarComo('FUNCIONARIO');
});

describe('DocumentosDoFuneral', () => {
  it('mostra o que falta e só deixa pedir a certidão com os documentos completos', async () => {
    servidor.use(
      http.get('*/api/v1/beneficiarios/b1/certidao', () =>
        HttpResponse.json({ detail: 'Certidão não pedida.' }, { status: 404 }),
      ),
      http.get('*/api/v1/beneficiarios/b1/certidao/checklist', () => HttpResponse.json(CHECKLIST)),
    );
    renderizar(rotas);

    expect(
      await screen.findByText(/registrar o óbito até 03\/11\/2026 \(1 dia\)/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Falta').parentElement).toHaveTextContent(
      'Documento do declarante',
    );
    expect(screen.getByRole('button', { name: 'Pedir a certidão' })).toBeDisabled();
    expect(await screen.findByText(/do\.pdf · 234 KB/)).toBeInTheDocument();
  });

  it('avisa o prazo vencido e registra o protocolo do cartório', async () => {
    let corpo: unknown;
    servidor.use(
      http.get('*/api/v1/beneficiarios/b1/certidao', () =>
        HttpResponse.json({
          id_solicitacao: 's1',
          id_beneficiario: 'b1',
          status: 'SOLICITADA',
          modo: 'MANUAL',
          responsavel: null,
          protocolo: null,
          pendencia: null,
          numero_matricula: null,
          id_documento_certidao: null,
          prazo: { data: '2026-10-30', dias_restantes: -3, vencido: true },
          historico: [
            {
              de: 'SOLICITADA',
              para: 'SOLICITADA',
              id_usuario: null,
              observacao: null,
              em: '2026-10-29T10:00:00Z',
            },
          ],
        }),
      ),
      http.patch('*/api/v1/beneficiarios/b1/certidao/status', async ({ request }) => {
        corpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(rotas);

    expect(await screen.findByRole('alert')).toHaveTextContent('venceu em 30/10/2026');
    await usuario.click(screen.getByRole('button', { name: 'Entregue no cartório' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Protocolo'), '2026-55');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(corpo).toEqual({ status: 'EM_PROCESSAMENTO', protocolo: '2026-55', observacao: null }),
    );
  });
});
