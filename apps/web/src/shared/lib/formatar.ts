/** A API descreve números como `number | string` (OpenAPI do .NET); aqui viram number. */
export const numero = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === '' ? 0 : Number(valor);

export const real = (valor: number | string | null | undefined) =>
  numero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Datas "aaaa-mm-dd" da API sem fuso: lidas como data local, sem voltar um dia. */
function paraData(valor: string) {
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number);
  return new Date(ano!, (mes ?? 1) - 1, dia ?? 1);
}

/** 05/10/2026 */
export const data = (valor: string | null | undefined) =>
  valor ? paraData(valor).toLocaleDateString('pt-BR') : '—';

/** 5 de outubro de 2026 */
export const dataLonga = (valor: string | null | undefined) =>
  valor
    ? paraData(valor).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

/** Data e hora com fuso (ISO completo): 05/10/2026, 14:30 */
export const dataHora = (valor: string | null | undefined) =>
  valor
    ? new Date(valor).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/** aaaa-mm-dd → dd/mm/aaaa, para preencher campos de data com máscara. */
export const dataParaCampo = (valor: string | null | undefined) =>
  valor ? valor.slice(0, 10).split('-').reverse().join('/') : '';

/** 52998224725 → 529.982.247-25 */
export const cpf = (valor: string) => {
  const d = valor.replace(/\D/g, '');
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : valor;
};
