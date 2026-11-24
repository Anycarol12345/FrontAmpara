import { env } from '@/lib/env';

/** Cabeçalho e rodapé da landing da plataforma (FE-PUB-04). */
export const navegacaoDaPlataforma = {
  cabecalho: {
    navegacao: [
      { rotulo: 'Para funerárias', href: '/para-funerarias#beneficios' },
      { rotulo: 'Como funciona', href: '/para-funerarias#como-funciona' },
      { rotulo: 'Cadastro', href: '/cadastrar-funeraria' },
    ],
    // O painel da plataforma (ADMIN) fica no apps/web, sem funerária.
    entrar: { rotulo: 'Entrar', href: new URL('/equipe/entrar', env.appUrl).toString() },
    acao: { rotulo: 'Cadastrar minha funerária', href: '/cadastrar-funeraria' },
  },
  rodape: {
    descricao:
      'A plataforma para funerárias oferecerem planos, personalização e atendimento com cuidado.',
    contato: 'contato@ampara.com.br',
    colunas: [
      {
        titulo: 'Plataforma',
        itens: [
          { rotulo: 'Benefícios', href: '/para-funerarias#beneficios' },
          { rotulo: 'Como funciona', href: '/para-funerarias#como-funciona' },
        ],
      },
      {
        titulo: 'Funerárias',
        itens: [
          { rotulo: 'Cadastrar minha funerária', href: '/cadastrar-funeraria' },
          { rotulo: 'Entrar no painel', href: new URL('/equipe/entrar', env.appUrl).toString() },
        ],
      },
      {
        titulo: 'Legal',
        itens: [{ rotulo: 'Termos de uso' }, { rotulo: 'Privacidade' }],
      },
    ],
  },
};
