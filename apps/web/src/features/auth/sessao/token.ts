import { ehPerfil, ehTipoTerceiro, type Perfil, type TipoTerceiro } from './perfis';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  idTenant: string | null;
  tipoTerceiro: TipoTerceiro | null;
};

// O access token fica só nesta variável: nada de localStorage (FE-07, AUT-03).
let accessToken: string | null = null;

export const obterAccessToken = () => accessToken;
export const definirAccessToken = (token: string | null) => {
  accessToken = token;
};

/** Lê as claims do JWT (AUT-02). A assinatura é validada pelo backend; aqui só serve para a interface. */
export function usuarioDoToken(token: string, nome: string): Usuario | null {
  try {
    const parte = token.split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    const claims = JSON.parse(json) as Record<string, unknown>;

    const perfil = claims.role;
    if (typeof claims.sub !== 'string' || !ehPerfil(perfil)) return null;

    return {
      id: claims.sub,
      nome,
      email: typeof claims.email === 'string' ? claims.email : '',
      perfil,
      idTenant: typeof claims.id_tenant === 'string' ? claims.id_tenant : null,
      tipoTerceiro: ehTipoTerceiro(claims.tipo_terceiro) ? claims.tipo_terceiro : null,
    };
  } catch {
    return null;
  }
}
