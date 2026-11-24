import { afterEach, describe, expect, it } from 'vitest';
import { CHAVE_TEMA, aplicarTema, lerTema, salvarTema } from './tema';

afterEach(() => {
  localStorage.removeItem(CHAVE_TEMA);
  document.documentElement.classList.remove('dark');
});

describe('tema', () => {
  it('sem escolha, segue o aparelho (claro nos testes)', () => {
    expect(lerTema()).toBe('sistema');
    aplicarTema();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('liga e desliga o modo noturno e lembra da escolha', () => {
    salvarTema('escuro');
    expect(lerTema()).toBe('escuro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    salvarTema('claro');
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('claro');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    salvarTema('sistema');
    expect(localStorage.getItem(CHAVE_TEMA)).toBeNull();
  });
});
