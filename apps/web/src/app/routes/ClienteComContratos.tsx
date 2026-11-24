import { ClientePainelPage } from '@/features/clientes';
import { ContratosDoCliente } from '@/features/contratos';

/** Ficha do cliente com os contratos dele: junta as features clientes e contratos (só o app/ conhece as duas). */
export function ClienteComContratos() {
  return <ClientePainelPage contratos={(cpf) => <ContratosDoCliente cpf={cpf} />} />;
}
