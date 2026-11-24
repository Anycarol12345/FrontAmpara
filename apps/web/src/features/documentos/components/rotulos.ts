import { baixarDocumento, type StatusCertidao, type TipoDocumento } from '@ampara/api-client';
import { toast } from '@ampara/ui/components/sonner';

type Variante = 'success' | 'warning' | 'info' | 'neutral';

export const TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  DECLARACAO_OBITO: 'Declaração de óbito (DO)',
  DOCUMENTO_FALECIDO: 'Documento do falecido',
  DOCUMENTO_DECLARANTE: 'Documento do declarante',
  COMPROVANTE_RESIDENCIA: 'Comprovante de residência',
  CERTIDAO_CIVIL: 'Certidão de nascimento ou casamento',
  CERTIDAO_OBITO: 'Certidão de óbito',
  OUTRO: 'Outro',
};

export const STATUS_CERTIDAO: Record<StatusCertidao, { rotulo: string; variante: Variante }> = {
  SOLICITADA: { rotulo: 'Solicitada', variante: 'info' },
  EM_PROCESSAMENTO: { rotulo: 'No cartório', variante: 'warning' },
  EMITIDA: { rotulo: 'Emitida', variante: 'success' },
  REJEITADA: { rotulo: 'Rejeitada', variante: 'neutral' },
  ERRO: { rotulo: 'Com erro', variante: 'neutral' },
};

/** Tamanho legível: 1,2 MB. */
export const tamanhoArquivo = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const TIPOS_ARQUIVO = ['application/pdf', 'image/jpeg', 'image/png'];
export const TAMANHO_MAXIMO = 10 * 1024 * 1024;

/** Confere o arquivo antes de enviar; devolve a mensagem de erro, se houver. */
export function conferirArquivo(arquivo: File): string | null {
  if (!TIPOS_ARQUIVO.includes(arquivo.type)) return 'Envie PDF, JPEG ou PNG.';
  if (arquivo.size > TAMANHO_MAXIMO) return 'O arquivo pode ter no máximo 10 MB.';
  return null;
}

/** Abre o link temporário do arquivo em outra aba. */
export async function abrirDocumento(idBeneficiario: string, idDocumento: string) {
  try {
    const { url } = await baixarDocumento(idBeneficiario, idDocumento);
    window.open(url, '_blank', 'noopener');
  } catch {
    toast.error('Não foi possível abrir o documento. Tente novamente.');
  }
}
