import type { TipoLocal } from '@ampara/api-client';

export const TIPO_LOCAL: Record<TipoLocal, string> = {
  SALA_VELORIO: 'Sala de velório',
  CEMITERIO: 'Cemitério',
  CREMATORIO: 'Crematório',
  IGREJA: 'Igreja',
  OUTRO: 'Outro',
};

/** 14:30 no fuso de quem está vendo. */
export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** "2026-11-05" e "14:30" (hora local) → ISO em UTC, como a API espera. */
export const paraIso = (dia: string, horario: string) =>
  new Date(`${dia}T${horario}`).toISOString();

/** Hoje como "aaaa-mm-dd" no fuso local. */
export const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Soma dias a "aaaa-mm-dd". */
export const somarDias = (dia: string, dias: number) => {
  const [a, m, d] = dia.split('-').map(Number);
  const data = new Date(a!, m! - 1, d! + dias);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
};

/** Início e fim (exclusivo) do dia "aaaa-mm-dd" no fuso de quem está vendo. */
export const limitesDoDia = (dia: string) => {
  const [a, m, d] = dia.split('-').map(Number);
  return { inicio: new Date(a!, m! - 1, d!), fim: new Date(a!, m! - 1, d! + 1) };
};

/**
 * Dias em UTC ("aaaa-mm-dd") que cobrem o dia local. A API devolve a agenda por dia em UTC:
 * no Brasil (UTC-3), o dia local vai das 03:00 de um dia UTC às 03:00 do seguinte, então são dois.
 */
export const diasUtcDoDia = (dia: string) => {
  const { inicio, fim } = limitesDoDia(dia);
  const primeiro = inicio.toISOString().slice(0, 10);
  const ultimo = new Date(fim.getTime() - 1).toISOString().slice(0, 10);
  return primeiro === ultimo ? [primeiro] : [primeiro, ultimo];
};

/** Se o intervalo [inicio, fim) toca o dia local. */
export const tocaODia = (inicio: string, fim: string, dia: string) => {
  const limites = limitesDoDia(dia);
  return new Date(inicio) < limites.fim && new Date(fim) > limites.inicio;
};

/** Posição de um horário dentro do dia, de 0 a 100 (para a barra da agenda). */
export const posicaoNoDia = (iso: string, dia: string) => {
  const [a, m, d] = dia.split('-').map(Number);
  const inicioDoDia = new Date(a!, m! - 1, d!).getTime();
  const minutos = (new Date(iso).getTime() - inicioDoDia) / 60000;
  return Math.min(100, Math.max(0, (minutos / (24 * 60)) * 100));
};
