export const somenteDigitos = (valor: string) => valor.replace(/\D/g, '');

/** 000.000.000-00 */
export function mascararCpf(valor: string) {
  return somenteDigitos(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** (00) 0000-0000 ou (00) 00000-0000 */
export function mascararTelefone(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length <= 2) return digitos.replace(/(\d{1,2})/, '($1');
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, ddd, a, b) =>
      b ? `(${ddd}) ${a}-${b}` : `(${ddd}) ${a}`,
    );
  }
  return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

/** 00000-000 */
export function mascararCep(valor: string) {
  return somenteDigitos(valor)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/** dd/mm/aaaa */
export function mascararData(valor: string) {
  return somenteDigitos(valor)
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}
