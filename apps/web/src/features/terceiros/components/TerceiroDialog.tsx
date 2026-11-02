import {
  getListarTerceirosQueryKey,
  useAtualizarTerceiro,
  useCadastrarTerceiro,
  useListarCategoriasGestao,
  type CidadeAtendida,
  type TerceiroResponse,
  type TipoTerceiro,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { cn } from '@ampara/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { UFS } from '@/shared/lib/ufs';
import { esquemas } from '@/shared/lib/validacao';
import { TIPO_TERCEIRO } from './rotulos';

const terceiroSchema = z.object({
  tipo: z.enum(['FROTA', 'CARTORIO_DESPACHANTE', 'FORNECEDOR'], 'Escolha o tipo.'),
  nome_razao_social: z
    .string()
    .trim()
    .min(1, 'Nome ou razão social é obrigatório.')
    .max(150, 'Use no máximo 150 caracteres.'),
  cpf_cnpj: z
    .string()
    .trim()
    .refine((v) => [11, 14].includes(v.replace(/\D/g, '').length), 'CPF ou CNPJ inválido.'),
  email: esquemas.email,
  telefone: z.string().trim(),
});
type TerceiroForm = z.input<typeof terceiroSchema>;
const CAMPOS = ['tipo', 'nome_razao_social', 'cpf_cnpj', 'email', 'telefone'] as const;

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Cadastro e convite de parceiro, ou edição de um existente (FE-ADM-14, TER-01). */
export function TerceiroDialog({
  terceiro,
  aoFechar,
}: {
  /** null = novo parceiro (o convite vai para o e-mail). */
  terceiro: TerceiroResponse | null;
  aoFechar: () => void;
}) {
  const invalida = { mutation: { meta: { invalida: [getListarTerceirosQueryKey()] } } };
  const cadastrar = useCadastrarTerceiro(invalida);
  const atualizar = useAtualizarTerceiro(invalida);
  const categorias = useListarCategoriasGestao({ query: { enabled: true } });

  const [ufs, setUfs] = useState<string[]>(terceiro?.area_atuacao.ufs ?? []);
  const [cidades, setCidades] = useState<CidadeAtendida[]>(terceiro?.area_atuacao.cidades ?? []);
  const [novaCidade, setNovaCidade] = useState({ nome: '', uf: 'SP' });
  const [categoriasAtendidas, setCategoriasAtendidas] = useState<string[]>(
    terceiro?.categorias_atendidas ?? [],
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TerceiroForm>({
    resolver: zodResolver(terceiroSchema),
    defaultValues: {
      tipo: (terceiro?.tipo ?? '') as TipoTerceiro,
      nome_razao_social: terceiro?.nome_razao_social ?? '',
      cpf_cnpj: terceiro?.cpf_cnpj ?? '',
      email: terceiro?.email ?? '',
      telefone: terceiro?.telefone ?? '',
    },
  });
  const tipo = useWatch({ control, name: 'tipo' });

  const alternar = (lista: string[], valor: string) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  function incluirCidade() {
    const nome = novaCidade.nome.trim();
    if (!nome || cidades.some((c) => c.nome === nome && c.uf === novaCidade.uf)) return;
    setCidades([...cidades, { nome, uf: novaCidade.uf }]);
    setNovaCidade({ ...novaCidade, nome: '' });
  }

  const enviar = handleSubmit(async (dados) => {
    if (ufs.length === 0 && cidades.length === 0) {
      setError('root.servidor', { message: 'Informe ao menos um estado ou cidade de atuação.' });
      return;
    }
    const comuns = {
      nome_razao_social: dados.nome_razao_social,
      cpf_cnpj: dados.cpf_cnpj.replace(/\D/g, ''),
      telefone: dados.telefone || null,
      area_atuacao: { ufs, cidades },
      // Só fornecedores atendem categorias do catálogo.
      categorias_atendidas: dados.tipo === 'FORNECEDOR' ? categoriasAtendidas : [],
    };
    try {
      if (terceiro) {
        await atualizar.mutateAsync({ id: terceiro.id_terceiro, data: comuns });
        toast.success('Parceiro atualizado.');
      } else {
        await cadastrar.mutateAsync({ data: { ...comuns, tipo: dados.tipo, email: dados.email } });
        toast.success('Parceiro cadastrado. O convite foi enviado para o e-mail.');
      }
      aoFechar();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  const chip = (ativo: boolean) =>
    cn(
      'rounded-full border px-2.5 py-1 text-xs transition-colors',
      ativo
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card hover:bg-muted',
    );

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <DialogTitle>{terceiro ? 'Editar parceiro' : 'Convidar parceiro'}</DialogTitle>
        <DialogDescription>
          {terceiro
            ? 'Tipo e e-mail não mudam depois do cadastro.'
            : 'O parceiro recebe um convite por e-mail e entra pelo portal do parceiro.'}
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="terceiro-tipo" label="Tipo" erro={errors.tipo?.message}>
              <select className={classeSelect} disabled={Boolean(terceiro)} {...register('tipo')}>
                <option value="">Escolha</option>
                {Object.entries(TIPO_TERCEIRO).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="terceiro-email" label="E-mail do convite" erro={errors.email?.message}>
              <Input type="email" disabled={Boolean(terceiro)} {...register('email')} />
            </Campo>
            <Campo
              id="terceiro-nome"
              label="Nome ou razão social"
              erro={errors.nome_razao_social?.message}
            >
              <Input {...register('nome_razao_social')} />
            </Campo>
            <Campo id="terceiro-documento" label="CPF ou CNPJ" erro={errors.cpf_cnpj?.message}>
              <Input inputMode="numeric" {...register('cpf_cnpj')} />
            </Campo>
            <Campo id="terceiro-telefone" label="Telefone" erro={errors.telefone?.message}>
              <Input type="tel" {...register('telefone')} />
            </Campo>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold">Estados atendidos</legend>
            <div className="flex flex-wrap gap-1.5">
              {UFS.map((uf) => (
                <button
                  key={uf}
                  type="button"
                  aria-pressed={ufs.includes(uf)}
                  className={chip(ufs.includes(uf))}
                  onClick={() => setUfs(alternar(ufs, uf))}
                >
                  {uf}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold">Cidades atendidas (opcional)</legend>
            {cidades.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {cidades.map((c) => (
                  <li
                    key={`${c.nome}-${c.uf}`}
                    className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    {c.nome} - {c.uf}
                    <button
                      type="button"
                      aria-label={`Tirar ${c.nome}`}
                      onClick={() => setCidades(cidades.filter((x) => x !== c))}
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Input
                aria-label="Cidade"
                placeholder="Cidade"
                value={novaCidade.nome}
                onChange={(e) => setNovaCidade({ ...novaCidade, nome: e.target.value })}
                className="min-w-40 flex-1"
              />
              <select
                aria-label="UF da cidade"
                className={cn(classeSelect, 'w-24')}
                value={novaCidade.uf}
                onChange={(e) => setNovaCidade({ ...novaCidade, uf: e.target.value })}
              >
                {UFS.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={incluirCidade}>
                <Plus /> Incluir
              </Button>
            </div>
          </fieldset>

          {tipo === 'FORNECEDOR' && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold">Categorias do catálogo que atende</legend>
              <div className="flex flex-wrap gap-1.5">
                {(categorias.data ?? [])
                  .filter((c) => c.ativo)
                  .map((c) => (
                    <button
                      key={c.id_categoria}
                      type="button"
                      aria-pressed={categoriasAtendidas.includes(c.id_categoria)}
                      className={chip(categoriasAtendidas.includes(c.id_categoria))}
                      onClick={() =>
                        setCategoriasAtendidas(alternar(categoriasAtendidas, c.id_categoria))
                      }
                    >
                      {c.nome}
                    </button>
                  ))}
              </div>
            </fieldset>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" carregando={isSubmitting}>
              {terceiro ? 'Salvar' : 'Cadastrar e convidar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
