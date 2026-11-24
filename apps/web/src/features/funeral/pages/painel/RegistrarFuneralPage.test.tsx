import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { RegistrarFuneralPage } from './RegistrarFuneralPage';

const BENEFICIARIO = {
  id_beneficiario: 'b1',
  id_pessoa_coberta: 'pc1',
  id_contrato: 'c1',
  id_cliente: 'cli1',
  id_dependente: null,
  nome: 'Maria Souza',
  data_nascimento: '1950-03-10',
  data_falecimento: '2026-10-30',
  local_falecimento: 'Hospital Municipal',
  responsavel: { nome: 'Ana Souza', telefone: '44999990000', parentesco: 'Filha' },
};

const rotas = [
  { path: '/painel/funerais/novo', element: <RegistrarFuneralPage /> },
  { path: '/painel/funerais/:id', element: <p>Página do funeral f1</p> },
];

const abrir = (caminho = '/painel/funerais/novo?beneficiario=b1') => renderizar(rotas, { caminho });

beforeEach(() => {
  entrarComo('FUNERARIA', 'Gestor');
  servidor.use(http.get('*/api/v1/beneficiarios/b1', () => HttpResponse.json(BENEFICIARIO)));
});

describe('RegistrarFuneralPage', () => {
  it('mostra o falecido e registra o funeral com a data em formato ISO', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/funerais', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id_funeral: 'f1' }, { status: 201 });
      }),
    );
    const { usuario } = abrir();

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText(/Faleceu em 30\/10\/2026/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Data e hora previstas'), {
      target: { value: '2026-11-05T14:00' },
    });
    await usuario.selectOptions(screen.getByLabelText('Destinação'), 'CREMACAO');
    await usuario.type(screen.getByLabelText('Observações (opcional)'), 'Flores brancas');
    await usuario.click(screen.getByRole('button', { name: 'Registrar funeral' }));

    expect(await screen.findByText('Página do funeral f1')).toBeInTheDocument();
    expect(corpo).toEqual({
      id_beneficiario: 'b1',
      data_hora_prevista: new Date('2026-11-05T14:00').toISOString(),
      destinacao: 'CREMACAO',
      observacoes: 'Flores brancas',
    });
  });

  it('exige a data e a hora antes de registrar', async () => {
    let chamou = false;
    servidor.use(
      http.post('*/api/v1/funerais', () => {
        chamou = true;
        return HttpResponse.json({ id_funeral: 'f1' }, { status: 201 });
      }),
    );
    const { usuario } = abrir();

    await usuario.click(await screen.findByRole('button', { name: 'Registrar funeral' }));

    expect(await screen.findByText('Informe a data e a hora previstas.')).toBeInTheDocument();
    expect(chamou).toBe(false);
  });

  it('mostra o motivo quando a API recusa o registro', async () => {
    servidor.use(
      http.post('*/api/v1/funerais', () =>
        HttpResponse.json(
          {
            status: 409,
            detail: 'Este falecido já tem funeral registrado.',
            code: 'Funeral.JaRegistrado',
          },
          { status: 409 },
        ),
      ),
    );
    const { usuario } = abrir();

    fireEvent.change(await screen.findByLabelText('Data e hora previstas'), {
      target: { value: '2026-11-05T14:00' },
    });
    await usuario.click(screen.getByRole('button', { name: 'Registrar funeral' }));

    const avisos = await screen.findAllByText('Este falecido já tem funeral registrado.');
    expect(avisos.length).toBeGreaterThan(0);
    expect(screen.queryByText('Página do funeral f1')).not.toBeInTheDocument();
  });

  it('pede o registro do falecimento quando falta o beneficiário', async () => {
    abrir('/painel/funerais/novo');

    expect(await screen.findByText('Falecimento não informado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar falecimento' })).toHaveAttribute(
      'href',
      '/painel/beneficiarios/novo',
    );
  });
});
