import type { IdentidadeVisualResponse } from '@ampara/api-client';
import type { CSSProperties } from 'react';
import { linkDoApp } from './links';

const HEX = /^#[0-9a-f]{6}$/i;

/** Cores da funerária (TEN-03) aplicadas por cima do tema (FE-02). Cores inválidas ficam no padrão. */
export function estiloDaMarca(funeraria: IdentidadeVisualResponse): CSSProperties {
  const { cor_primaria: primaria, cor_secundaria: secundaria } = funeraria.identidade_visual;
  const estilo: Record<string, string> = {};
  if (primaria && HEX.test(primaria)) {
    estilo['--primary'] = primaria;
    estilo['--brand-950'] = primaria;
  }
  if (secundaria && HEX.test(secundaria)) estilo['--accent'] = secundaria;
  return estilo as CSSProperties;
}

export function nomeDa(funeraria: IdentidadeVisualResponse) {
  return funeraria.identidade_visual.nome_exibicao || funeraria.nome_fantasia;
}

/** Telefone, WhatsApp ou e-mail, o primeiro que a funerária tiver informado. */
export function contatoPrincipal(funeraria: IdentidadeVisualResponse) {
  const { telefone, whatsapp, email } = funeraria.identidade_visual;
  return telefone || whatsapp || email || null;
}

/** Cabeçalho e rodapé da landing da funerária. */
export function navegacaoDa(funeraria: IdentidadeVisualResponse) {
  const slug = funeraria.slug;
  const visual = funeraria.identidade_visual;
  const endereco = visual.endereco;
  const linhaEndereco = [
    [endereco?.logradouro, endereco?.numero].filter(Boolean).join(', '),
    [endereco?.cidade, endereco?.uf].filter(Boolean).join(' - '),
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    cabecalho: {
      nome: nomeDa(funeraria),
      logoUrl: visual.logo_url,
      navegacao: [
        { rotulo: 'Início', href: '/#inicio' },
        { rotulo: 'Planos', href: '/#planos' },
        { rotulo: 'Personalizar', href: '/#personalizar' },
        { rotulo: 'Como funciona', href: '/#como-funciona' },
      ],
      entrar: { rotulo: 'Entrar', href: linkDoApp(slug, '/entrar') },
      acao: { rotulo: 'Criar meu perfil', href: linkDoApp(slug, '/cadastro') },
    },
    rodape: {
      nome: nomeDa(funeraria),
      descricao:
        'Planos funerários com cuidado, transparência e atendimento humano em cada detalhe.',
      contato: [visual.horario_atendimento, contatoPrincipal(funeraria)]
        .filter(Boolean)
        .join(' · '),
      colunas: [
        {
          titulo: 'Planos',
          itens: [
            { rotulo: 'Conhecer os planos', href: '/#planos' },
            { rotulo: 'Comparar planos', href: '/planos' },
            { rotulo: 'Personalizar', href: '/#personalizar' },
          ],
        },
        {
          titulo: 'Sua conta',
          itens: [
            { rotulo: 'Entrar', href: linkDoApp(slug, '/entrar') },
            { rotulo: 'Criar meu perfil', href: linkDoApp(slug, '/cadastro') },
            { rotulo: 'Esqueci minha senha', href: linkDoApp(slug, '/recuperar-senha') },
          ],
        },
        {
          titulo: 'Contato',
          itens: [
            visual.telefone && { rotulo: visual.telefone, href: `tel:${visual.telefone}` },
            visual.whatsapp && {
              rotulo: `WhatsApp ${visual.whatsapp}`,
              href: `https://wa.me/55${visual.whatsapp.replace(/\D/g, '')}`,
            },
            visual.email && { rotulo: visual.email, href: `mailto:${visual.email}` },
            linhaEndereco && { rotulo: linhaEndereco },
          ].filter((item): item is { rotulo: string; href?: string } => Boolean(item)),
        },
      ],
    },
  };
}
