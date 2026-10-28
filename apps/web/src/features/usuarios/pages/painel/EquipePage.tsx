import {
  getListarEquipeQueryKey,
  useAlterarPerfilMembro,
  useAlterarStatusMembro,
  useCadastrarFuncionario,
  useListarEquipe,
  type MembroEquipeResponse,
  type PerfilVinculo,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/features/auth';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { CampoBusca, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { useAtraso } from '@/shared/hooks/useAtraso';
import { numero } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { mascararCpf, mascararTelefone, somenteDigitos } from '@/shared/lib/mascaras';
import { esquemas } from '@/shared/lib/validacao';
import { CheckCircle2, CircleOff, UserCog } from 'lucide-react';

const NOME_PERFIL: Partial<Record<PerfilVinculo, string>> = {
  FUNERARIA: 'Gestor',
  FUNCIONARIO: 'Funcionário',
  CONSULTOR: 'Consultor',
};
const TAMANHO = 20;

/** Equipe da funerária (FE-ADM-11, /gestao/usuarios e /gestao/funcionarios). */
export function EquipePage() {
  const { usuario } = useAuth();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [convidando, setConvidando] = useState(false);
  const termo = useAtraso(busca.trim());
  const consulta = useListarEquipe({ ...(termo && { busca: termo }), pagina, tamanho: TAMANHO });
  const invalida = { mutation: { meta: { invalida: [getListarEquipeQueryKey()] } } };
  const alterarStatus = useAlterarStatusMembro(invalida);
  const alterarPerfil = useAlterarPerfilMembro(invalida);

  const membros = consulta.data?.itens ?? [];
  const ativos = membros.filter((m) => m.ativo).length;

  const colunas: Coluna<MembroEquipeResponse>[] = [
    {
      titulo: 'Nome',
      celula: (m) => (
        <span className="flex flex-col">
          <span className="font-semibold">{m.nome}</span>
          <span className="text-xs text-muted-foreground">{m.email}</span>
        </span>
      ),
    },
    { titulo: 'Função', celula: (m) => m.cargo ?? '—' },
    {
      titulo: 'Perfil',
      celula: (m) =>
        m.perfil === 'FUNERARIA' || m.id_usuario === usuario?.id ? (
          (NOME_PERFIL[m.perfil] ?? m.perfil)
        ) : (
          // Gestor troca entre funcionário e consultor (PATCH /gestao/usuarios/{id}/perfil).
          <select
            aria-label={`Perfil de ${m.nome}`}
            value={m.perfil}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              alterarPerfil.mutate(
                { id: m.id_usuario, data: { perfil: e.target.value as PerfilVinculo } },
                { onSuccess: () => toast.success('Perfil alterado.') },
              )
            }
            className="h-8 rounded-md border border-input bg-card px-2 text-xs"
          >
            <option value="FUNCIONARIO">Funcionário</option>
            <option value="CONSULTOR">Consultor</option>
          </select>
        ),
    },
    {
      titulo: 'Status',
      celula: (m) => (
        <Badge variant={m.ativo ? 'success' : 'neutral'}>{m.ativo ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
    {
      titulo: 'Ação',
      className: 'text-right',
      celula: (m) =>
        m.id_usuario === usuario?.id ? null : (
          <Button
            size="sm"
            variant="ghost"
            className={m.ativo ? 'text-destructive' : ''}
            onClick={() =>
              alterarStatus.mutate(
                { id: m.id_usuario, data: { ativo: !m.ativo } },
                {
                  onSuccess: () =>
                    toast.success(m.ativo ? 'Acesso desativado.' : 'Acesso reativado.'),
                },
              )
            }
          >
            {m.ativo ? 'Desativar' : 'Reativar'}
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Administração"
        titulo="Equipe"
        descricao="Quem trabalha na funerária e o que cada um pode acessar."
        acoes={
          <Button onClick={() => setConvidando(true)}>
            <Plus /> Adicionar usuário
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          rotulo="Pessoas na equipe"
          valor={String(numero(consulta.data?.total))}
          detalhe="Gestores, funcionários e consultores"
          icone={UserCog}
        />
        <StatCard
          rotulo="Ativos"
          valor={String(ativos)}
          detalhe="Nesta página"
          icone={CheckCircle2}
        />
        <StatCard
          rotulo="Inativos"
          valor={String(membros.length - ativos)}
          detalhe="Sem acesso ao painel"
          icone={CircleOff}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-base font-bold">Colaboradores</h2>
            <p className="text-xs text-muted-foreground">Acessos ao painel da funerária</p>
          </div>
          <CampoBusca
            valor={busca}
            aoMudar={(valor) => {
              setBusca(valor);
              setPagina(1);
            }}
            placeholder="Buscar por nome ou e-mail"
          />
        </div>
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(dados) => dados.itens.length === 0}
          vazio={<Vazio titulo="Ninguém encontrado" />}
        >
          {(dados) => (
            <>
              <Tabela colunas={colunas} linhas={dados.itens} chave={(m) => m.id_usuario} />
              <Paginacao
                pagina={numero(dados.pagina)}
                tamanho={numero(dados.tamanho)}
                total={numero(dados.total)}
                aoMudar={setPagina}
              />
            </>
          )}
        </EstadoConsulta>
      </Card>

      <ConvidarDialog aberto={convidando} aoFechar={() => setConvidando(false)} />
    </div>
  );
}

const opcional = (schema: z.ZodType<string, string>) => z.union([z.literal(''), schema]);
const convidarSchema = z.object({
  nome: esquemas.nome,
  email: esquemas.email,
  cpf: esquemas.cpf,
  cargo: z.string().trim().max(100, 'Use no máximo 100 caracteres.'),
  telefone: opcional(
    z
      .string()
      .refine((t) => [10, 11].includes(somenteDigitos(t).length), 'Telefone em formato inválido.'),
  ),
  perfil: z.enum(['FUNCIONARIO', 'CONSULTOR']),
});
type ConvidarForm = z.infer<typeof convidarSchema>;

/** Convite de funcionário ou consultor: a pessoa recebe o link para criar a senha. */
function ConvidarDialog({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const cadastrar = useCadastrarFuncionario({
    mutation: { meta: { invalida: [getListarEquipeQueryKey()] } },
  });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConvidarForm>({
    resolver: zodResolver(convidarSchema),
    defaultValues: { nome: '', email: '', cpf: '', cargo: '', telefone: '', perfil: 'FUNCIONARIO' },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      await cadastrar.mutateAsync({
        data: { ...dados, cargo: dados.cargo || null, telefone: dados.telefone || null },
      });
      toast.success(`Convite enviado para ${dados.email}.`);
      reset();
      aoFechar();
    } catch (erro) {
      if (
        !aplicarErrosDaApi(erro, setError, ['nome', 'email', 'cpf', 'cargo', 'telefone', 'perfil'])
      ) {
        throw erro;
      }
    }
  });

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogTitle>Adicionar usuário</DialogTitle>
        <DialogDescription>
          A pessoa recebe por e-mail o link para criar a senha e entrar no painel.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ErroFormulario mensagem={errors.root?.servidor?.message} />
          </div>
          <Campo
            id="eq-nome"
            label="Nome completo"
            erro={errors.nome?.message}
            className="sm:col-span-2"
          >
            <Input {...register('nome')} />
          </Campo>
          <Campo
            id="eq-email"
            label="E-mail"
            erro={errors.email?.message}
            className="sm:col-span-2"
          >
            <Input type="email" {...register('email')} />
          </Campo>
          <Campo id="eq-cpf" label="CPF" erro={errors.cpf?.message}>
            <Input
              inputMode="numeric"
              {...register('cpf', {
                onChange: (e) => (e.target.value = mascararCpf(e.target.value)),
              })}
            />
          </Campo>
          <Campo id="eq-telefone" label="Telefone (opcional)" erro={errors.telefone?.message}>
            <Input
              type="tel"
              {...register('telefone', {
                onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
              })}
            />
          </Campo>
          <Campo id="eq-cargo" label="Função (opcional)" erro={errors.cargo?.message}>
            <Input placeholder="Ex.: Atendente" {...register('cargo')} />
          </Campo>
          <Campo id="eq-perfil" label="Perfil" erro={errors.perfil?.message}>
            <select
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
              {...register('perfil')}
            >
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="CONSULTOR">Consultor</option>
            </select>
          </Campo>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" carregando={isSubmitting}>
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
