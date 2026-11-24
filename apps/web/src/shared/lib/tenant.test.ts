import { describe, expect, it } from 'vitest';
import { obterSlugDoTenant } from './tenant';

const local = (hostname: string, pathname = '/painel') => ({ hostname, pathname });

describe('obterSlugDoTenant', () => {
  it('lê a funerária do subdomínio', () => {
    expect(obterSlugDoTenant(local('demo.localhost'))).toBe('demo');
    expect(obterSlugDoTenant(local('Funeraria-X.localhost'))).toBe('funeraria-x');
  });

  it('ignora subdomínios reservados e de mais de um nível', () => {
    expect(obterSlugDoTenant(local('www.localhost'))).toBeNull();
    expect(obterSlugDoTenant(local('a.b.localhost'))).toBeNull();
  });

  it('sem subdomínio usa a funerária padrão (vazia nos testes)', () => {
    expect(obterSlugDoTenant(local('localhost'))).toBeNull();
  });

  it('o /admin roda sem funerária', () => {
    expect(obterSlugDoTenant(local('demo.localhost', '/admin'))).toBeNull();
    expect(obterSlugDoTenant(local('demo.localhost', '/admin/funerarias'))).toBeNull();
    expect(obterSlugDoTenant(local('demo.localhost', '/administracao'))).toBe('demo');
  });
});
