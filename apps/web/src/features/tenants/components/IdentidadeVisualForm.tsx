import {
  useAtualizarConfiguracoes,
  useEnviarLogo,
  useRemoverLogo,
  type ConfiguracoesResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { mascararCep, mascararTelefone, somenteDigitos } from '@/shared/lib/mascaras';
import { UFS } from '@/shared/lib/ufs';
import { classeSelect, invalidaConfiguracoes } from './apoio';

const TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/webp'];
const TAMANHO_MAXIMO_LOGO = 2 * 1024 * 1024;
const COR = /^#[0-9a-fA-F]{6}$/;

const opcional = (max: number) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`);

const identidadeSchema = z.object({
  nome_exibicao: z.string().trim().min(1, 'Informe o nome que aparece para os clientes.').max(120),
  cor_primaria: z.string().regex(COR, 'Use uma cor no formato #RRGGBB.'),
  cor_secundaria: z.string().regex(COR, 'Use uma cor no formato #RRGGBB.'),
  email: z.union([z.literal(''), z.email('E-mail inválido.')]),
  telefone: opcional(20),
  whatsapp: opcional(20),
  horario_atendimento: opcional(200),
  logradouro: opcional(200),
  numero: opcional(20),
  complemento: opcional(100),
  bairro: opcional(100),
  cidade: opcional(100),
  uf: z.string(),
  cep: opcional(9),
});
type IdentidadeForm = z.infer<typeof identidadeSchema>;
const CAMPOS = Object.keys(identidadeSchema.shape) as (keyof IdentidadeForm)[];

const vazioParaNulo = (valor: string) => valor || null;

/** Nome, cores, contatos e endereço que os clientes veem, com o logo e a pré-visualização (FE-ADM-12). */
export function IdentidadeVisualForm({ configuracoes }: { configuracoes: ConfiguracoesResponse }) {
  const atual = configuracoes.identidade_visual;
  const atualizar = useAtualizarConfiguracoes(invalidaConfiguracoes);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<IdentidadeForm>({
    resolver: zodResolver(identidadeSchema),
    defaultValues: {
      nome_exibicao: atual.nome_exibicao ?? configuracoes.nome_fantasia,
      cor_primaria: atual.cor_primaria ?? '#3E5C54',
      cor_secundaria: atual.cor_secundaria ?? '#C9A66B',
      email: atual.email ?? '',
      telefone: atual.telefone ?? '',
      whatsapp: atual.whatsapp ?? '',
      horario_atendimento: atual.horario_atendimento ?? '',
      logradouro: atual.endereco?.logradouro ?? '',
      numero: atual.endereco?.numero ?? '',
      complemento: atual.endereco?.complemento ?? '',
      bairro: atual.endereco?.bairro ?? '',
      cidade: atual.endereco?.cidade ?? '',
      uf: atual.endereco?.uf ?? '',
      cep: atual.endereco?.cep ? mascararCep(atual.endereco.cep) : '',
    },
  });
  const [nome, primaria, secundaria, telefone] = useWatch({
    control,
    name: ['nome_exibicao', 'cor_primaria', 'cor_secundaria', 'telefone'],
  });

  const enviar = handleSubmit(async (d) => {
    try {
      await atualizar.mutateAsync({
        data: {
          parametros: null,
          identidade_visual: {
            nome_exibicao: d.nome_exibicao,
            cor_primaria: d.cor_primaria.toUpperCase(),
            cor_secundaria: d.cor_secundaria.toUpperCase(),
            email: vazioParaNulo(d.email),
            telefone: vazioParaNulo(somenteDigitos(d.telefone)),
            whatsapp: vazioParaNulo(somenteDigitos(d.whatsapp)),
            horario_atendimento: vazioParaNulo(d.horario_atendimento),
            endereco: {
              logradouro: vazioParaNulo(d.logradouro),
              numero: vazioParaNulo(d.numero),
              complemento: vazioParaNulo(d.complemento),
              bairro: vazioParaNulo(d.bairro),
              cidade: vazioParaNulo(d.cidade),
              uf: vazioParaNulo(d.uf),
              cep: vazioParaNulo(somenteDigitos(d.cep)),
            },
          },
        },
      });
      toast.success('Identidade visual salva.');
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <ErroFormulario mensagem={errors.root?.servidor?.message} />
        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold">Marca</h2>
          <Campo id="iv-nome" label="Nome de exibição" erro={errors.nome_exibicao?.message}>
            <Input {...register('nome_exibicao')} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoCor
              id="iv-primaria"
              label="Cor principal"
              erro={errors.cor_primaria?.message}
              valor={primaria}
              aoMudar={(v) => setValue('cor_primaria', v, { shouldDirty: true })}
              registro={register('cor_primaria')}
            />
            <CampoCor
              id="iv-secundaria"
              label="Cor de destaque"
              erro={errors.cor_secundaria?.message}
              valor={secundaria}
              aoMudar={(v) => setValue('cor_secundaria', v, { shouldDirty: true })}
              registro={register('cor_secundaria')}
            />
          </div>
          <Logo configuracoes={configuracoes} />
        </Card>

        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="text-sm font-semibold sm:col-span-2">Atendimento</h2>
          <Campo id="iv-email" label="E-mail" erro={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Campo>
          <Campo id="iv-telefone" label="Telefone" erro={errors.telefone?.message}>
            <Input
              inputMode="tel"
              {...register('telefone', {
                onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
              })}
            />
          </Campo>
          <Campo id="iv-whatsapp" label="WhatsApp" erro={errors.whatsapp?.message}>
            <Input
              inputMode="tel"
              {...register('whatsapp', {
                onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
              })}
            />
          </Campo>
          <Campo
            id="iv-horario"
            label="Horário de atendimento"
            dica='Ex.: "Atendimento 24 horas, todos os dias".'
            erro={errors.horario_atendimento?.message}
          >
            <Input {...register('horario_atendimento')} />
          </Campo>
        </Card>

        <Card className="grid gap-4 p-6 sm:grid-cols-6">
          <h2 className="text-sm font-semibold sm:col-span-6">Endereço</h2>
          <Campo id="iv-cep" label="CEP" erro={errors.cep?.message} className="sm:col-span-2">
            <Input
              inputMode="numeric"
              {...register('cep', {
                onChange: (e) => (e.target.value = mascararCep(e.target.value)),
              })}
            />
          </Campo>
          <Campo id="iv-logradouro" label="Logradouro" className="sm:col-span-4">
            <Input {...register('logradouro')} />
          </Campo>
          <Campo id="iv-numero" label="Número" className="sm:col-span-2">
            <Input {...register('numero')} />
          </Campo>
          <Campo id="iv-complemento" label="Complemento" className="sm:col-span-4">
            <Input {...register('complemento')} />
          </Campo>
          <Campo id="iv-bairro" label="Bairro" className="sm:col-span-2">
            <Input {...register('bairro')} />
          </Campo>
          <Campo id="iv-cidade" label="Cidade" className="sm:col-span-3">
            <Input {...register('cidade')} />
          </Campo>
          <Campo id="iv-uf" label="UF" className="sm:col-span-1">
            <select className={classeSelect} {...register('uf')}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Campo>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Salvando...' : 'Salvar identidade visual'}
          </Button>
        </div>
      </form>

      <PreVisualizacao
        nome={nome}
        primaria={COR.test(primaria) ? primaria : '#3E5C54'}
        secundaria={COR.test(secundaria) ? secundaria : '#C9A66B'}
        telefone={telefone}
        logo={atual.logo_url ?? null}
      />
    </div>
  );
}

function CampoCor({
  id,
  label,
  erro,
  valor,
  aoMudar,
  registro,
}: {
  id: string;
  label: string;
  erro: string | undefined;
  valor: string;
  aoMudar: (valor: string) => void;
  registro: ReturnType<ReturnType<typeof useForm<IdentidadeForm>>['register']>;
}) {
  return (
    <Campo id={id} label={label} erro={erro}>
      <span className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: escolher no seletor`}
          value={COR.test(valor) ? valor : '#000000'}
          onChange={(e) => aoMudar(e.target.value.toUpperCase())}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
        />
        <Input id={id} {...registro} className="font-mono uppercase" />
      </span>
    </Campo>
  );
}

/** O logo vai em um envio separado: PNG, JPEG ou WEBP de até 2 MB. */
function Logo({ configuracoes }: { configuracoes: ConfiguracoesResponse }) {
  const enviar = useEnviarLogo(invalidaConfiguracoes);
  const remover = useRemoverLogo(invalidaConfiguracoes);
  const logo = configuracoes.identidade_visual.logo_url;

  const escolher = (arquivo: File | undefined) => {
    if (!arquivo) return;
    if (!TIPOS_LOGO.includes(arquivo.type)) {
      toast.error('Envie o logo em PNG, JPEG ou WEBP.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_LOGO) {
      toast.error('O logo pode ter no máximo 2 MB.');
      return;
    }
    enviar.mutate({ data: { arquivo } }, { onSuccess: () => toast.success('Logo atualizado.') });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="grid size-16 place-items-center overflow-hidden rounded-xl border border-border/60 bg-muted">
        {logo ? (
          <img src={logo} alt="Logo atual" className="size-full object-contain" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
        )}
      </span>
      <div className="flex flex-col gap-1">
        <span className="flex gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              {enviar.isPending ? 'Enviando...' : logo ? 'Trocar logo' : 'Enviar logo'}
              <input
                type="file"
                accept={TIPOS_LOGO.join(',')}
                className="sr-only"
                aria-label="Arquivo do logo"
                onChange={(e) => {
                  escolher(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          </Button>
          {logo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={remover.isPending}
              onClick={() =>
                remover.mutate(undefined, { onSuccess: () => toast.success('Logo removido.') })
              }
            >
              <Trash2 /> Remover
            </Button>
          )}
        </span>
        <span className="text-[11px] text-subtle-foreground">PNG, JPEG ou WEBP, até 2 MB.</span>
      </div>
    </div>
  );
}

/** Como o topo do site e da área do cliente vão ficar com as cores escolhidas. */
function PreVisualizacao({
  nome,
  primaria,
  secundaria,
  telefone,
  logo,
}: {
  nome: string;
  primaria: string;
  secundaria: string;
  telefone: string;
  logo: string | null;
}) {
  return (
    <aside
      aria-label="Pré-visualização"
      className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
        Pré-visualização
      </h2>
      <Card className="overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 py-3 text-white"
          style={{ background: primaria }}
        >
          {logo ? (
            <img src={logo} alt="" className="size-8 rounded bg-white object-contain" />
          ) : (
            <span className="grid size-8 place-items-center rounded bg-white/20 text-sm font-bold">
              {nome.trim().charAt(0).toUpperCase() || 'A'}
            </span>
          )}
          <span className="truncate text-sm font-semibold">{nome || 'Sua funerária'}</span>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">Planos para proteger quem você ama</p>
          <p className="text-xs text-muted-foreground">
            {telefone ? `Fale com a gente: ${telefone}` : 'Seus contatos aparecem aqui.'}
          </p>
          <span
            className="self-start rounded-lg px-3 py-2 text-xs font-semibold text-white"
            style={{ background: secundaria }}
          >
            Conhecer os planos
          </span>
        </div>
      </Card>
    </aside>
  );
}
