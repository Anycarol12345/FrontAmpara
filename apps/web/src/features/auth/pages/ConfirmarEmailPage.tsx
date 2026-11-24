import { useConfirmarEmail } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Carregando } from '@/shared/components/EstadoConsulta';
import { Aviso, LayoutAcesso } from '../components/LayoutAcesso';

/** Confirma o e-mail pelo link enviado depois do cadastro (FE-PUB-03, AUT-05). */
export function ConfirmarEmailPage() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token');
  // A tela mostra o erro sozinha, sem toast.
  const confirmacao = useConfirmarEmail({ mutation: { meta: { silenciarErro: true } } });
  const { mutate } = confirmacao;
  const enviado = useRef(false);

  useEffect(() => {
    // O token vale uma única vez: confirma uma vez só, mesmo com o efeito repetido do StrictMode.
    if (!token || enviado.current) return;
    enviado.current = true;
    mutate({ data: { token } });
  }, [token, mutate]);

  return (
    <LayoutAcesso
      sobretitulo="Confirmação de e-mail"
      titulo="Confirmando seu e-mail"
      descricao="Assim garantimos que as mensagens importantes cheguem a você."
    >
      {!token ? (
        <Aviso tipo="erro" titulo="Link incompleto">
          Abra o link exatamente como chegou no e-mail.
        </Aviso>
      ) : confirmacao.isSuccess ? (
        <div className="flex flex-col gap-5">
          <Aviso tipo="sucesso" titulo="E-mail confirmado">
            Tudo certo! Sua conta está pronta para uso.
          </Aviso>
          <Button asChild className="h-11 w-full">
            <Link to="/entrar">
              Entrar na minha conta <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : confirmacao.isError ? (
        <Aviso tipo="erro" titulo="Não foi possível confirmar">
          {confirmacao.error.message} O link pode ter expirado ou já ter sido usado.
        </Aviso>
      ) : (
        <Carregando texto="Confirmando…" />
      )}
    </LayoutAcesso>
  );
}
