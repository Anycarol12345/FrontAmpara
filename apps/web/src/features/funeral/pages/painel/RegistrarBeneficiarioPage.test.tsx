import { fireEvent, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { RegistrarBeneficiarioPage } from './RegistrarBeneficiarioPage';

const CONTRATO = {
  id_contrato: 'c1',
  id_cliente: 'cli1',
  nome_titular: 'Maria Souza',
  id_plano: 'p1',
  nome_plano: 'Familiar',
  tipo_cobertura: 'TITULAR_E_DEPENDENTES',
  periodicidade: 'MENSAL',
  status: 'ATIVO',
  valor_total: 79.9,
  data_contratacao: '2026-01-10',
  quantidade_pessoas: 2,
};

const PESSOAS = [
  {
    id_pessoa_coberta: 'pc1',
    tipo: 'TITULAR',
    id_dependente: null,
    nome: 'Maria Souza',
    elegivel: true,
    motivo: null,
    carencia_cumprida_em: '2026-04-10',
  },
  {
    id_pessoa_coberta: 'pc2',
    tipo: 'DEPENDENTE',
    id_dependente: 'd1',
    nome: 'João Souza',
    elegivel: false,
    motivo: 'CARÊNCIA_NÃO_CUMPRIDA',
    carencia_cumprida_em: '2999-12-01',
  },
];

const pagina = (itens: unknown[]) => ({ itens, pagina: 1, tamanho: 20, total: itens.length });

const rotas = [
  { path: '/painel/beneficiarios/novo', element: <RegistrarBeneficiarioPage /> },
  { path: '/painel/funerais/novo', element: <p>Registro do funeral</p> },
];

const abrir = () => renderizar(rotas, { caminho: '/painel/beneficiarios/novo' });

beforeEach(() => {
  entrarComo('FUNERARIA', 'Gestor');
  servidor.use(
    http.get('*/api/v1/gestao/contratos', ({ request }) => {
      const cpf = new URL(request.url).searchParams.get('cpf');
      return HttpResponse.json(pagina(cpf === '52998224725' ? [CONTRATO] : []));
    }),
    http.get('*/api/v1/contratos/c1/elegibilidade', () => HttpResponse.json(PESSOAS)),
  );
});

type Usuario = ReturnType<typeof abrir>['usuario'];

async function buscar(usuario: Usuario, termo: string) {
  await usuario.type(screen.getByRole('textbox', { name: 'CPF ou nome do titular' }), termo);
  await usuario.click(screen.getByRole('button', { name: /buscar/i }));
}

async function ateAsPessoas(usuario: Usuario) {
  await buscar(usuario, '529.982.247-25');
  await usuario.click(await screen.findByRole('button', { name: /Familiar · Maria Souza/ }));
}

async function ateOsDados(usuario: Usuario) {
  await ateAsPessoas(usuario);
  await usuario.click(await screen.findByRole('radio', { name: /Maria Souza/ }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function preencherOsDados(usuario: Usuario) {
  fireEvent.change(await screen.findByLabelText('Data do falecimento'), {
    target: { value: '2026-10-30' },
  });
  await usuario.type(screen.getByLabelText('Local do falecimento'), 'Hospital Municipal');
  await usuario.type(screen.getByLabelText('Nome'), 'Ana Souza');
  await usuario.type(screen.getByLabelText('Telefone'), '44999990000');
  await usuario.type(screen.getByLabelText('Parentesco'), 'Filha');
}

describe('RegistrarBeneficiarioPage', () => {
  it('localiza o contrato pelo CPF e mostra quem pode usar o plano', async () => {
    const { usuario } = abrir();
    await ateAsPessoas(usuario);

    const titular = await screen.findByRole('radio', { name: /Maria Souza/ });
    expect(titular).toBeEnabled();
    expect(titular).toHaveTextContent('Elegível');

    const dependente = screen.getByRole('radio', { name: /João Souza/ });
    expect(dependente).toBeDisabled();
    expect(dependente).toHaveTextContent('Não elegível');
    expect(dependente).toHaveTextContent('Carência não cumprida');
    expect(dependente).toHaveTextContent('carência cumprida em 01/12/2999');

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await usuario.click(titular);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('localiza o contrato pelo nome do titular', async () => {
    servidor.use(
      http.get('*/api/v1/gestao/clientes', () =>
        HttpResponse.json(
          pagina([
            {
              id_cliente: 'cli1',
              nome: 'Maria Souza',
              cpf: '***.982.247-**',
              email: 'maria@exemplo.com',
            },
          ]),
        ),
      ),
      http.get('*/api/v1/gestao/clientes/cli1', () =>
        HttpResponse.json({
          cliente: { id_cliente: 'cli1', nome: 'Maria Souza', cpf: '52998224725' },
          dependentes: [],
        }),
      ),
    );
    const { usuario } = abrir();

    await buscar(usuario, 'Maria');
    await usuario.click(await screen.findByRole('button', { name: /Maria Souza/ }));

    expect(await screen.findByText('Contratos de Maria Souza')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Familiar · Maria Souza/ }),
    ).toBeInTheDocument();
  });

  it('avisa quando o CPF não tem contrato', async () => {
    const { usuario } = abrir();

    await buscar(usuario, '111.444.777-35');

    expect(await screen.findByText('Nenhum contrato encontrado')).toBeInTheDocument();
  });

  it('confirma os dados preenchidos, registra o beneficiário e segue para o funeral', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/beneficiarios', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ id_beneficiario: 'b1' }, { status: 201 });
      }),
    );
    const { usuario } = abrir();
    await ateOsDados(usuario);
    await preencherOsDados(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Revisar e confirmar' }));

    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toHaveTextContent('Maria Souza (titular)');
    expect(dialogo).toHaveTextContent('30/10/2026');
    expect(dialogo).toHaveTextContent('Hospital Municipal');
    expect(dialogo).toHaveTextContent('Ana Souza (Filha)');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar registro' }));

    expect(await screen.findByText('Registro do funeral')).toBeInTheDocument();
    expect(corpo).toEqual({
      id_pessoa_coberta: 'pc1',
      data_falecimento: '2026-10-30',
      local_falecimento: 'Hospital Municipal',
      responsavel: { nome: 'Ana Souza', telefone: '44999990000', parentesco: 'Filha' },
    });
  });

  it('valida os dados do falecimento antes de pedir a confirmação', async () => {
    const { usuario } = abrir();
    await ateOsDados(usuario);

    await usuario.click(await screen.findByRole('button', { name: 'Revisar e confirmar' }));
    expect(await screen.findByText('Informe a data do falecimento.')).toBeInTheDocument();
    expect(screen.getByText('Informe o local do falecimento.')).toBeInTheDocument();
    expect(screen.getByText('Informe o nome do responsável.')).toBeInTheDocument();
    expect(screen.getByText('Informe o telefone com DDD.')).toBeInTheDocument();
    expect(screen.getByText('Informe o parentesco com o falecido.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Data do falecimento'), {
      target: { value: '2999-01-01' },
    });
    await usuario.click(screen.getByRole('button', { name: 'Revisar e confirmar' }));
    expect(await screen.findByText('A data não pode ser no futuro.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra o motivo no diálogo quando a API recusa o registro', async () => {
    servidor.use(
      http.post('*/api/v1/beneficiarios', () =>
        HttpResponse.json(
          {
            status: 409,
            detail: 'Esta pessoa já tem beneficiário registrado.',
            code: 'Beneficiario.JaRegistrado',
          },
          { status: 409 },
        ),
      ),
    );
    const { usuario } = abrir();
    await ateOsDados(usuario);
    await preencherOsDados(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Revisar e confirmar' }));

    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar registro' }));

    expect(
      await within(dialogo).findByText('Esta pessoa já tem beneficiário registrado.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Registro do funeral')).not.toBeInTheDocument();
  });
});
