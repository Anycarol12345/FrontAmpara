import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { Separator } from '@ampara/ui/components/separator';
import { ArrowRight } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { AuthAtendimento, AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Eyebrow } from '@/shared/components/Eyebrow';
import { PasswordInput } from '@/shared/components/PasswordInput';

export function CadastroPage() {
  function criarPerfil(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // Validação (FE-06) e envio para a API (FE-PUB-02) entram nos próximos cards.
  }

  return (
    <AuthSplitLayout
      variante="cliente"
      sobretitulo="Seu espaço Ampara"
      titulo={
        <>
          Vamos começar <em>juntos</em>
        </>
      }
      descricao="Crie seu perfil para salvar escolhas, simular planos e conversar com um especialista, no seu tempo."
      itens={[
        'Salve suas escolhas e simulações de plano',
        'Compare os planos com calma e transparência',
        'Converse com um especialista, sem compromisso',
      ]}
    >
      <Eyebrow>Seu espaço Ampara</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl leading-tight">Vamos começar?</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Crie seu perfil para salvar escolhas, simular planos e conversar com um especialista.
      </p>

      <form onSubmit={criarPerfil} className="mt-6 flex flex-col gap-4">
        <Campo id="nome" label="Como podemos chamar você?">
          <Input id="nome" autoComplete="name" placeholder="Seu nome completo" />
        </Campo>
        <Campo id="email" label="Seu melhor e-mail">
          <Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="cpf" label="CPF">
            <Input id="cpf" inputMode="numeric" placeholder="000.000.000-00" />
          </Campo>
          <Campo id="celular" label="Celular com DDD">
            <Input id="celular" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" />
          </Campo>
        </div>
        <Campo id="senha" label="Crie uma senha">
          <PasswordInput id="senha" autoComplete="new-password" placeholder="Escolha uma senha" />
          <span className="text-[11px] text-subtle-foreground">Use pelo menos 8 caracteres.</span>
        </Campo>
        <Campo id="confirmacao" label="Confirme sua senha">
          <Input
            id="confirmacao"
            type="password"
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
          />
        </Campo>
        <div className="flex items-start gap-2">
          <Checkbox id="termos" className="mt-0.5" />
          <Label
            htmlFor="termos"
            className="text-xs leading-relaxed font-normal text-muted-foreground"
          >
            <span>
              Li e concordo com os <strong className="text-foreground">Termos de Uso</strong> e a{' '}
              <strong className="text-foreground">Política de Privacidade</strong>.
            </span>
          </Label>
        </div>
        <Button type="submit" className="mt-1 h-11 w-full">
          Criar meu perfil <ArrowRight />
        </Button>
      </form>

      <Separator className="mt-7" />

      <div className="mt-6 flex flex-col items-center gap-1 text-xs">
        <span className="text-muted-foreground">Já possui uma conta?</span>
        <Link to="/entrar" className="font-semibold hover:underline">
          Entrar
        </Link>
      </div>
      <AuthAtendimento className="mt-6 text-[11px]" />
    </AuthSplitLayout>
  );
}

function Campo({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
