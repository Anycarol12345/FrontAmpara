import {
  BarChart3,
  Building2,
  CalendarDays,
  FilePen,
  FileText,
  Flower2,
  House,
  IdCard,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Perfil } from '@/features/auth';

export type ItemMenu = { rotulo: string; para: string; icone: LucideIcon };

/** Menu lateral de cada perfil (FE-03, matriz do DEC-06). */
export const MENU_DO_PERFIL: Partial<Record<Perfil, ItemMenu[]>> = {
  FUNCIONARIO: [
    { rotulo: 'Visão geral', para: '/painel', icone: House },
    { rotulo: 'Clientes', para: '/painel/clientes', icone: UsersRound },
    { rotulo: 'Contratos', para: '/painel/contratos', icone: FilePen },
    { rotulo: 'Agenda', para: '/painel/agenda', icone: CalendarDays },
    { rotulo: 'Documentos', para: '/painel/documentos', icone: FileText },
  ],
  // Consultor: atende clientes e faz contratações (DEC-11).
  CONSULTOR: [
    { rotulo: 'Visão geral', para: '/painel', icone: House },
    { rotulo: 'Clientes', para: '/painel/clientes', icone: UsersRound },
    { rotulo: 'Contratos', para: '/painel/contratos', icone: FilePen },
  ],
  // O gestor (FUNERARIA) é o "Administrador" das telas do protótipo.
  FUNERARIA: [
    { rotulo: 'Visão geral', para: '/painel', icone: House },
    { rotulo: 'Clientes', para: '/painel/clientes', icone: UsersRound },
    { rotulo: 'Contratos', para: '/painel/contratos', icone: FilePen },
    { rotulo: 'Equipe', para: '/painel/equipe', icone: IdCard },
    { rotulo: 'Planos', para: '/painel/planos', icone: ShieldCheck },
    { rotulo: 'Catálogo', para: '/painel/catalogo', icone: Flower2 },
    { rotulo: 'Fornecedores', para: '/painel/fornecedores', icone: Package },
    { rotulo: 'Relatórios', para: '/painel/relatorios', icone: BarChart3 },
    { rotulo: 'Configurações', para: '/painel/configuracoes', icone: Settings },
  ],
  TERCEIRO: [
    { rotulo: 'Atribuições', para: '/parceiro', icone: Truck },
    { rotulo: 'Meu cadastro', para: '/parceiro/cadastro', icone: IdCard },
  ],
  ADMIN: [{ rotulo: 'Funerárias', para: '/admin', icone: Building2 }],
};

/** Etiqueta ao lado do logo. */
export const ETIQUETA_DO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Plataforma',
  FUNERARIA: 'Equipe',
  FUNCIONARIO: 'Equipe',
  CONSULTOR: 'Equipe',
  CLIENTE: 'Cliente',
  TERCEIRO: 'Parceiro',
};
