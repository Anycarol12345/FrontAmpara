import { describe, expect, it } from 'vitest';
import { loginPara } from './loginPara';

describe('loginPara', () => {
  it('manda cada área para o seu login, guardando o endereço', () => {
    expect(loginPara('/minha-conta/faturas')).toBe('/entrar?voltar=%2Fminha-conta%2Ffaturas');
    expect(loginPara('/painel/clientes')).toBe('/equipe/entrar?voltar=%2Fpainel%2Fclientes');
    expect(loginPara('/parceiro')).toBe('/equipe/entrar?voltar=%2Fparceiro');
  });

  it('manda o /admin para o login da plataforma, que entra sem funerária', () => {
    expect(loginPara('/admin')).toBe('/admin/entrar?voltar=%2Fadmin');
  });
});
