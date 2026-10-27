import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  House,
  Package,
  Settings,
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
    { rotulo: 'Atendimentos', para: '/painel/atendimentos', icone: UsersRound },
    { rotulo: 'Agenda', para: '/painel/agenda', icone: CalendarDays },
    { rotulo: 'Documentos', para: '/painel/documentos', icone: FileText },
    { rotulo: 'Configurações', para: '/painel/configuracoes', icone: Settings },
  ],
  // O gestor (FUNERARIA) é o "Administrador" das telas do protótipo.
  FUNERARIA: [
    { rotulo: 'Visão geral', para: '/painel', icone: House },
    { rotulo: 'Equipe', para: '/painel/equipe', icone: UsersRound },
    { rotulo: 'Relatórios', para: '/painel/relatorios', icone: BarChart3 },
    { rotulo: 'Agenda', para: '/painel/agenda', icone: CalendarDays },
    { rotulo: 'Documentos', para: '/painel/documentos', icone: FileText },
    { rotulo: 'Fornecedores', para: '/painel/fornecedores', icone: Package },
    { rotulo: 'Configurações', para: '/painel/configuracoes', icone: Settings },
  ],
  TERCEIRO: [
    { rotulo: 'Visão geral', para: '/parceiro', icone: House },
    { rotulo: 'Atribuições', para: '/parceiro/atribuicoes', icone: Truck },
    { rotulo: 'Documentos', para: '/parceiro/documentos', icone: FileText },
  ],
  ADMIN: [
    { rotulo: 'Visão geral', para: '/admin', icone: House },
    { rotulo: 'Funerárias', para: '/admin/funerarias', icone: Building2 },
    { rotulo: 'Relatórios', para: '/admin/relatorios', icone: BarChart3 },
  ],
};

/** Etiqueta ao lado do logo. */
export const ETIQUETA_DO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Plataforma',
  FUNERARIA: 'Equipe',
  FUNCIONARIO: 'Equipe',
  CLIENTE: 'Cliente',
  TERCEIRO: 'Parceiro',
};
