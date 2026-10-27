const AREAS_DA_EQUIPE = ['/painel', '/admin', '/parceiro'];

/** Página de login de quem tenta abrir este endereço sem sessão. */
export function loginPara(caminho: string) {
  const daEquipe = AREAS_DA_EQUIPE.some((area) => caminho.startsWith(area));
  const login = daEquipe ? '/equipe/entrar' : '/entrar';
  return `${login}?voltar=${encodeURIComponent(caminho)}`;
}
