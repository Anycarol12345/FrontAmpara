import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { CAMPOS_LOGIN, loginSchema, type LoginForm } from '../schemas/login';
import { useAuth } from '../sessao/contexto';
import { AREA_DO_PERFIL } from '../sessao/perfis';

/** Só aceita voltar para um caminho do próprio app (evita redirecionar para outro site). */
function destinoSeguro(voltar: string | null) {
  return voltar && voltar.startsWith('/') && !voltar.startsWith('//') ? voltar : null;
}

/** Formulário de login compartilhado pelas telas do cliente e da equipe (FE-07). */
export function useFormularioLogin(lembrarPorPadrao: boolean) {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();

  const formulario = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '', lembrar: lembrarPorPadrao },
  });

  const enviar = formulario.handleSubmit(async ({ email, senha }) => {
    try {
      const { usuario, totalFunerarias } = await entrar(email, senha);
      const voltar = destinoSeguro(parametros.get('voltar'));

      if (!voltar && usuario.perfil === 'CLIENTE' && totalFunerarias > 1) {
        await navigate('/minhas-funerarias', { replace: true });
        return;
      }
      await navigate(voltar ?? AREA_DO_PERFIL[usuario.perfil], { replace: true });
    } catch (erro) {
      // 401, 403 e 423 do AUT-02 aparecem acima do formulário; erros de campo, no campo.
      if (!aplicarErrosDaApi(erro, formulario.setError, CAMPOS_LOGIN)) {
        formulario.setError('root.servidor', {
          message: erro instanceof Error ? erro.message : 'Não foi possível entrar.',
        });
      }
    }
  });

  return { formulario, enviar };
}
