// Perfis e tipos de terceiro do DEC-06 (valores das claims role e tipo_terceiro do JWT).
export const PERFIS = ['ADMIN', 'FUNERARIA', 'FUNCIONARIO', 'CLIENTE', 'TERCEIRO'] as const;
export type Perfil = (typeof PERFIS)[number];

export const TIPOS_TERCEIRO = ['FROTA', 'CARTORIO_DESPACHANTE', 'FORNECEDOR'] as const;
export type TipoTerceiro = (typeof TIPOS_TERCEIRO)[number];

export const NOME_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Administrador da plataforma',
  FUNERARIA: 'Gestor',
  FUNCIONARIO: 'Funcionário',
  CLIENTE: 'Cliente',
  TERCEIRO: 'Parceiro',
};

/** Área inicial de cada perfil (FE-03). */
export const AREA_DO_PERFIL: Record<Perfil, string> = {
  ADMIN: '/admin',
  FUNERARIA: '/painel',
  FUNCIONARIO: '/painel',
  CLIENTE: '/minha-conta',
  TERCEIRO: '/parceiro',
};

export const ehPerfil = (valor: unknown): valor is Perfil => PERFIS.includes(valor as Perfil);
export const ehTipoTerceiro = (valor: unknown): valor is TipoTerceiro =>
  TIPOS_TERCEIRO.includes(valor as TipoTerceiro);
