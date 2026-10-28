import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { DependentesPage } from './DependentesPage';

const rotas = [{ path: '/minha-conta/dependentes', element: <DependentesPage /> }];

describe('DependentesPage', () => {
  it('inclui um dependente e mostra na lista', async () => {
    const lista: unknown[] = [];
    let corpo: unknown;
    servidor.use(
      http.get('*/api/v1/dependentes', () => HttpResponse.json(lista)),
      http.post('*/api/v1/dependentes', async ({ request }) => {
        corpo = await request.json();
        const novo = {
          id_dependente: 'd1',
          id_cliente: 'c1',
          cpf: '11144477735',
          ...(corpo as object),
        };
        lista.push(novo);
        return HttpResponse.json(novo, { status: 201 });
      }),
    );
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/dependentes' });

    expect(await screen.findByText('Nenhum dependente cadastrado')).toBeInTheDocument();
    await usuario.click(screen.getAllByRole('button', { name: /incluir dependente/i })[0]!);

    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Nome completo'), 'Marina Lima');
    await usuario.type(within(dialogo).getByLabelText('CPF'), '11144477735');
    await usuario.type(within(dialogo).getByLabelText('Data de nascimento'), '12031985');
    await usuario.selectOptions(within(dialogo).getByLabelText('Parentesco'), 'Cônjuge');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Incluir' }));

    expect(await screen.findByText('Marina Lima')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(corpo).toMatchObject({
      nome: 'Marina Lima',
      cpf: '111.444.777-35',
      data_nascimento: '1985-03-12',
      parentesco: 'Cônjuge',
    });
  });

  it('mostra o CPF repetido no campo', async () => {
    servidor.use(
      http.get('*/api/v1/dependentes', () => HttpResponse.json([])),
      http.post('*/api/v1/dependentes', () =>
        HttpResponse.json(
          {
            status: 409,
            code: 'Dependente.CpfDuplicado',
            detail: 'Este CPF já está cadastrado entre os dependentes.',
          },
          { status: 409 },
        ),
      ),
    );
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/dependentes' });

    await usuario.click(
      (await screen.findAllByRole('button', { name: /incluir dependente/i }))[0]!,
    );
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Nome completo'), 'Marina Lima');
    await usuario.type(within(dialogo).getByLabelText('CPF'), '11144477735');
    await usuario.type(within(dialogo).getByLabelText('Data de nascimento'), '12031985');
    await usuario.selectOptions(within(dialogo).getByLabelText('Parentesco'), 'Cônjuge');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Incluir' }));

    expect(
      await within(dialogo).findByText('Este CPF já está cadastrado entre os dependentes.'),
    ).toBeInTheDocument();
  });
});
