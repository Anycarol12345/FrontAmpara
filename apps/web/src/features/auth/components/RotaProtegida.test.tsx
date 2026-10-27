import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { RotaProtegida } from './RotaProtegida';

const rotas = [
  { path: '/equipe/entrar', element: <p>Login da equipe</p> },
  {
    path: '/painel',
    element: <RotaProtegida perfis={['FUNERARIA', 'FUNCIONARIO']} />,
    children: [{ index: true, element: <p>Conteúdo do painel</p> }],
  },
  {
    path: '/parceiro',
    element: <RotaProtegida perfis={['TERCEIRO']} tiposTerceiro={['FROTA']} />,
    children: [{ index: true, element: <p>Translados atribuídos</p> }],
  },
];

describe('RotaProtegida', () => {
  it('sem sessão manda para o login guardando o endereço', async () => {
    const { router } = renderizar(rotas, { caminho: '/painel' });

    await waitFor(() => expect(router.state.location.pathname).toBe('/equipe/entrar'));
    expect(router.state.location.search).toBe('?voltar=%2Fpainel');
  });

  it('mostra o conteúdo para o perfil permitido', async () => {
    entrarComo('FUNCIONARIO');
    renderizar(rotas, { caminho: '/painel' });

    expect(await screen.findByText('Conteúdo do painel')).toBeInTheDocument();
  });

  it('mostra o 403 para outro perfil', async () => {
    entrarComo('CLIENTE');
    renderizar(rotas, { caminho: '/painel' });

    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument();
  });

  it('confere o tipo do terceiro', async () => {
    entrarComo('TERCEIRO');
    renderizar(rotas, { caminho: '/parceiro' });

    // O token de teste não tem tipo_terceiro: não é FROTA.
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument();
  });
});
