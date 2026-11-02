const AREAS_DA_EQUIPE = ['/painel', '/parceiro'];

/** Página de login de quem tenta abrir este endereço sem sessão. */
export function loginPara(caminho: string) {
  const daEquipe = AREAS_DA_EQUIPE.some((area) => caminho.startsWith(area));
  // O ADMIN da plataforma entra sem funerária (sem X-Tenant): login próprio, dentro de /admin.
  const login = caminho.startsWith('/admin')
    ? '/admin/entrar'
    : daEquipe
      ? '/equipe/entrar'
      : '/entrar';
  return `${login}?voltar=${encodeURIComponent(caminho)}`;
}
