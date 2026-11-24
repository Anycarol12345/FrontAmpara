import { CertidaoDeObito } from './CertidaoDeObito';
import { DocumentosDoFalecido } from './DocumentosDoFalecido';

/** Aba "Documentos" do funeral: a certidão de óbito e os arquivos do falecido (FE-ADM-08). */
export function DocumentosDoFuneral({ idBeneficiario }: { idBeneficiario: string }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <CertidaoDeObito idBeneficiario={idBeneficiario} />
      <DocumentosDoFalecido idBeneficiario={idBeneficiario} />
    </div>
  );
}
