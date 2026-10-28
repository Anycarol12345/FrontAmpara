import type { StatusCertidao, StatusFuneral, StatusTranslado } from '../hooks/funerais';

// Textos para a família (FDEC-03): simples, acolhedores e sem termos internos.

/** Etapas do funeral na ordem em que acontecem (FUN-06). */
export const ETAPAS_FUNERAL: { status: StatusFuneral; rotulo: string; descricao: string }[] = [
  {
    status: 'REGISTRADO',
    rotulo: 'Atendimento iniciado',
    descricao: 'A funerária recebeu o chamado e já está cuidando de tudo.',
  },
  {
    status: 'EM_PREPARACAO',
    rotulo: 'Em preparação',
    descricao: 'A equipe está preparando a cerimônia com o que foi escolhido.',
  },
  {
    status: 'VELORIO',
    rotulo: 'Velório',
    descricao: 'O momento de despedida com a família e os amigos.',
  },
  {
    status: 'CONCLUIDO',
    rotulo: 'Despedida concluída',
    descricao: 'O atendimento foi concluído. Os documentos ficam disponíveis aqui.',
  },
];

export const STATUS_FUNERAL: Record<StatusFuneral, string> = {
  REGISTRADO: 'Atendimento iniciado',
  EM_PREPARACAO: 'Em preparação',
  VELORIO: 'Velório',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Atendimento cancelado',
};

export const ETAPAS_TRANSLADO: { status: StatusTranslado; rotulo: string }[] = [
  { status: 'AGENDADO', rotulo: 'Agendado' },
  { status: 'EM_COLETA', rotulo: 'Equipe no local de saída' },
  { status: 'EM_TRANSITO', rotulo: 'A caminho do destino' },
  { status: 'ENTREGUE', rotulo: 'Chegou ao destino' },
];

export const STATUS_CERTIDAO: Record<StatusCertidao, string> = {
  SOLICITADA: 'Solicitada ao cartório',
  EM_ANDAMENTO: 'Em emissão no cartório',
  EMITIDA: 'Emitida',
};
