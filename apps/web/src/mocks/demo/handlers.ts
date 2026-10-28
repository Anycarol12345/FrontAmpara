import type {
  CadastrarDependenteRequest,
  CadastrarFuncionarioRequest,
  ContratarParaClienteRequest,
  ContratarRequest,
  ContratoDetalheResponse,
  DefinirCoberturasRequest,
  PlanoRequest,
  PlanoResponse,
} from '@ampara/api-client';
import { delay, http, HttpResponse } from 'msw';
import {
  CATALOGO,
  CATEGORIAS,
  FUNERARIA,
  criarBanco,
  montarContrato,
  resumoDoContrato,
} from './dados';
import { loginDemo, salvarSessaoDemo, type SessaoDemo } from './sessao';

const naoEncontrado = (detail: string) => HttpResponse.json({ detail }, { status: 404 });
const semConteudo = () => new HttpResponse(null, { status: 204 });
const hoje = () => new Date().toISOString().slice(0, 10);

/** Fatia uma lista no formato de paginação do INF-17. */
function paginar<T>(lista: T[], url: URL) {
  const pagina = Number(url.searchParams.get('pagina') ?? 1);
  const tamanho = Number(url.searchParams.get('tamanho') ?? 20);
  return {
    itens: lista.slice((pagina - 1) * tamanho, pagina * tamanho),
    pagina,
    tamanho,
    total: lista.length,
  };
}

const resumoDoPlano = ({ coberturas: _, configuracoes: __, ...plano }: PlanoResponse) => plano;

/**
 * API inteira da demonstração (página /demo): sessão, área do cliente, painel da equipe.
 * Entra antes dos handlers de dados fictícios e responde sem precisar do backend.
 */
export function handlersDemo(sessao: SessaoDemo) {
  const banco = criarBanco(sessao.cenario);
  const contrato = (id: string) => banco.contratos.find((c) => c.id_contrato === id);
  const dependentesDe = (idCliente: string) =>
    idCliente === banco.meusDados.id_cliente ? banco.dependentes : [];

  function contratar(idCliente: string, pedido: ContratarRequest): ContratoDetalheResponse {
    const titular = banco.clientes.find((c) => c.id_cliente === idCliente) ?? banco.meusDados;
    const novo = montarContrato({
      id_contrato: `ct-novo-${Date.now()}`,
      titular,
      id_plano: pedido.id_plano ?? 'pl-acolher',
      dependentes: dependentesDe(idCliente).filter((d) =>
        pedido.dependentes?.includes(d.id_dependente),
      ),
      periodicidade: pedido.periodicidade ?? 'MENSAL',
      // O contrato fica ativo com o pagamento da primeira fatura (COB-01).
      status: 'A_PAGAR',
      data_contratacao: hoje(),
      dia_vencimento: pedido.dia_vencimento ?? 10,
      somenteDependentes: pedido.tipo_cobertura === 'SOMENTE_DEPENDENTES',
    });
    banco.contratos.unshift(novo);
    return novo;
  }

  return [
    // Sessão: o refresh devolve o usuário do perfil escolhido; sair encerra a demonstração.
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(loginDemo(sessao))),
    http.post('*/api/v1/auth/logout', () => {
      salvarSessaoDemo(null);
      // Recarrega depois que o app for para o login: o MSW volta a simular só as rotas que faltam.
      setTimeout(() => window.location.reload(), 500);
      return semConteudo();
    }),
    http.put('*/api/v1/auth/senha', async () => {
      await delay(400);
      return semConteudo();
    }),
    http.get('*/api/v1/auth/minhas-funerarias', () =>
      HttpResponse.json([
        {
          id_tenant: 'tenant-demo',
          slug: FUNERARIA.slug,
          nome_fantasia: FUNERARIA.nome_fantasia,
          perfil: sessao.perfil,
          suspensa: false,
        },
      ]),
    ),

    http.get('*/api/v1/tenant/configuracoes', () => HttpResponse.json(FUNERARIA)),
    http.get('*/api/v1/funerarias/:slug/logo', () => naoEncontrado('Sem logo.')),

    // Cliente: dados e dependentes (CLI-01, CLI-02).
    http.get('*/api/v1/clientes/me', () => HttpResponse.json(banco.meusDados)),
    http.put('*/api/v1/clientes/me', async ({ request }) => {
      Object.assign(banco.meusDados, await request.json());
      await delay(300);
      return HttpResponse.json(banco.meusDados);
    }),
    http.get('*/api/v1/dependentes', () => HttpResponse.json(banco.dependentes)),
    http.post('*/api/v1/dependentes', async ({ request }) => {
      const dados = (await request.json()) as CadastrarDependenteRequest;
      const novo = {
        id_dependente: `dep-${Date.now()}`,
        id_cliente: banco.meusDados.id_cliente,
        nome: dados.nome ?? '',
        cpf: (dados.cpf ?? '').replace(/\D/g, ''),
        data_nascimento: dados.data_nascimento ?? '',
        parentesco: dados.parentesco ?? '',
        telefone: dados.telefone,
        email: dados.email,
      };
      banco.dependentes.push(novo);
      return HttpResponse.json(novo, { status: 201 });
    }),
    http.get('*/api/v1/dependentes/:id', ({ params }) => {
      const dep = banco.dependentes.find((d) => d.id_dependente === params.id);
      return dep ? HttpResponse.json(dep) : naoEncontrado('Dependente não encontrado.');
    }),
    http.put('*/api/v1/dependentes/:id', async ({ request, params }) => {
      const dep = banco.dependentes.find((d) => d.id_dependente === params.id);
      if (!dep) return naoEncontrado('Dependente não encontrado.');
      const dados = (await request.json()) as CadastrarDependenteRequest;
      Object.assign(dep, { ...dados, cpf: (dados.cpf ?? dep.cpf).replace(/\D/g, '') });
      return HttpResponse.json(dep);
    }),
    http.delete('*/api/v1/dependentes/:id', ({ params }) => {
      const coberto = banco.contratos.some(
        (c) =>
          c.status !== 'CANCELADO' && c.pessoas_cobertas.some((p) => p.id_dependente === params.id),
      );
      if (coberto) {
        return HttpResponse.json(
          {
            status: 409,
            code: 'Dependente.VinculadoAContrato',
            detail: 'Esta pessoa está coberta por um contrato ativo e não pode ser removida.',
          },
          { status: 409 },
        );
      }
      banco.dependentes = banco.dependentes.filter((d) => d.id_dependente !== params.id);
      return semConteudo();
    }),

    // Planos e catálogo públicos da funerária.
    http.get('*/api/v1/planos', () =>
      HttpResponse.json(banco.planos.filter((p) => p.ativo).map(resumoDoPlano)),
    ),
    http.get('*/api/v1/planos/:id', ({ params }) => {
      const p = banco.planos.find((x) => x.id_plano === params.id);
      return p ? HttpResponse.json(p) : naoEncontrado('Plano não encontrado.');
    }),
    http.get('*/api/v1/catalogo/categorias', () => HttpResponse.json(CATEGORIAS)),
    http.get('*/api/v1/catalogo', ({ request }) => {
      const categoria = new URL(request.url).searchParams.get('categoria');
      return HttpResponse.json(CATALOGO.filter((i) => !categoria || i.id_categoria === categoria));
    }),
    http.get('*/api/v1/catalogo/:id', ({ params }) => {
      const i = CATALOGO.find((x) => x.id_item === params.id);
      return i ? HttpResponse.json(i) : naoEncontrado('Item não encontrado.');
    }),

    // Contratos do cliente (CLI-04, CLI-05).
    http.get('*/api/v1/contratos', async () => {
      await delay(200);
      return HttpResponse.json(
        banco.contratos
          .filter((c) => c.titular.id_cliente === banco.meusDados.id_cliente)
          .map(resumoDoContrato),
      );
    }),
    http.post('*/api/v1/contratos', async ({ request }) => {
      const novo = contratar(
        banco.meusDados.id_cliente,
        (await request.json()) as ContratarRequest,
      );
      await delay(500);
      return HttpResponse.json(novo, { status: 201 });
    }),
    http.get('*/api/v1/contratos/:id', ({ params }) => {
      const c = contrato(String(params.id));
      return c ? HttpResponse.json(c) : naoEncontrado('Contrato não encontrado.');
    }),

    // Painel da equipe: clientes e contratos (ADM-02, ADM-03).
    http.get('*/api/v1/gestao/clientes', async ({ request }) => {
      const url = new URL(request.url);
      const nome = url.searchParams.get('nome')?.toLowerCase();
      const cpf = url.searchParams.get('cpf')?.replace(/\D/g, '');
      const lista = banco.clientes
        .filter((c) => !nome || c.nome.toLowerCase().includes(nome))
        .filter((c) => !cpf || c.cpf.includes(cpf))
        .map((c) => ({
          id_cliente: c.id_cliente,
          nome: c.nome,
          cpf: c.cpf,
          email: c.email,
          telefone: c.telefone,
          cidade: c.cidade,
          estado: c.estado,
          quantidade_dependentes: dependentesDe(c.id_cliente).length,
        }));
      await delay(200);
      return HttpResponse.json(paginar(lista, url));
    }),
    http.get('*/api/v1/gestao/clientes/:id', ({ params }) => {
      const cliente = banco.clientes.find((c) => c.id_cliente === params.id);
      if (!cliente) return naoEncontrado('Cliente não encontrado.');
      return HttpResponse.json({ cliente, dependentes: dependentesDe(cliente.id_cliente) });
    }),
    http.get('*/api/v1/gestao/contratos', async ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const cpf = url.searchParams.get('cpf')?.replace(/\D/g, '');
      const lista = banco.contratos
        .filter((c) => !status || c.status === status)
        .filter((c) => !cpf || c.titular.cpf.includes(cpf))
        .map(resumoDoContrato);
      await delay(200);
      return HttpResponse.json(paginar(lista, url));
    }),
    http.post('*/api/v1/gestao/contratos', async ({ request }) => {
      const pedido = (await request.json()) as ContratarParaClienteRequest;
      const novo = contratar(pedido.id_cliente ?? '', pedido);
      await delay(500);
      return HttpResponse.json(novo, { status: 201 });
    }),

    // Planos da funerária (ADM-10).
    http.get('*/api/v1/gestao/planos', () => HttpResponse.json(banco.planos.map(resumoDoPlano))),
    http.post('*/api/v1/gestao/planos', async ({ request }) => {
      const dados = (await request.json()) as PlanoRequest;
      const novo: PlanoResponse = {
        ...dados,
        id_plano: `pl-${Date.now()}`,
        configuracoes: dados.configuracoes ?? {},
        ativo: true,
        coberturas: [],
      };
      banco.planos.push(novo);
      return HttpResponse.json({ id_plano: novo.id_plano }, { status: 201 });
    }),
    http.get('*/api/v1/gestao/planos/:id', ({ params }) => {
      const p = banco.planos.find((x) => x.id_plano === params.id);
      return p ? HttpResponse.json(p) : naoEncontrado('Plano não encontrado.');
    }),
    http.put('*/api/v1/gestao/planos/:id', async ({ request, params }) => {
      const p = banco.planos.find((x) => x.id_plano === params.id);
      if (!p) return naoEncontrado('Plano não encontrado.');
      Object.assign(p, await request.json());
      return semConteudo();
    }),
    http.patch('*/api/v1/gestao/planos/:id/status', async ({ request, params }) => {
      const p = banco.planos.find((x) => x.id_plano === params.id);
      if (!p) return naoEncontrado('Plano não encontrado.');
      p.ativo = Boolean(((await request.json()) as { ativo?: boolean }).ativo);
      return semConteudo();
    }),
    http.put('*/api/v1/gestao/planos/:id/coberturas', async ({ request, params }) => {
      const p = banco.planos.find((x) => x.id_plano === params.id);
      if (!p) return naoEncontrado('Plano não encontrado.');
      const { coberturas } = (await request.json()) as DefinirCoberturasRequest;
      p.coberturas = (coberturas ?? []).map((c, i) => {
        const item = CATALOGO.find((x) => x.id_item === c.id_item_catalogo);
        return {
          id_plano_cobertura: `${p.id_plano}-cob-${i + 1}`,
          id_item_catalogo: c.id_item_catalogo ?? '',
          nome: item?.nome ?? '',
          categoria: CATEGORIAS.find((x) => x.id_categoria === item?.id_categoria)?.nome ?? '',
          quantidade: c.quantidade ?? 1,
          km_translado_incluso: c.km_translado_incluso,
          item_ativo: true,
        };
      });
      return semConteudo();
    }),
    http.get('*/api/v1/gestao/catalogo/categorias', () => HttpResponse.json(CATEGORIAS)),
    http.get('*/api/v1/gestao/catalogo', () => HttpResponse.json(CATALOGO)),

    // Equipe (ADM-11).
    http.get('*/api/v1/gestao/usuarios', ({ request }) => {
      const url = new URL(request.url);
      const busca = url.searchParams.get('busca')?.toLowerCase();
      const perfil = url.searchParams.get('perfil');
      const status = url.searchParams.get('status');
      const lista = banco.equipe
        .filter((m) => !busca || m.nome.toLowerCase().includes(busca))
        .filter((m) => !perfil || m.perfil === perfil)
        .filter((m) => !status || (status === 'ATIVO') === m.ativo);
      return HttpResponse.json(paginar(lista, url));
    }),
    http.post('*/api/v1/gestao/funcionarios', async ({ request }) => {
      const dados = (await request.json()) as CadastrarFuncionarioRequest;
      const id = `us-${Date.now()}`;
      const membro = {
        id_usuario: id,
        id_funcionario: `fn-${id}`,
        nome: dados.nome ?? '',
        email: dados.email ?? '',
        perfil: dados.perfil ?? 'FUNCIONARIO',
        ativo: true,
        cpf: dados.cpf,
        cargo: dados.cargo,
        telefone: dados.telefone,
      };
      banco.equipe.push(membro);
      await delay(400);
      return HttpResponse.json(membro, { status: 201 });
    }),
    http.patch('*/api/v1/gestao/usuarios/:id/perfil', async ({ request, params }) => {
      const m = banco.equipe.find((x) => x.id_usuario === params.id);
      if (!m) return naoEncontrado('Membro não encontrado.');
      Object.assign(m, await request.json());
      return semConteudo();
    }),
    http.patch('*/api/v1/gestao/usuarios/:id/status', async ({ request, params }) => {
      const m = banco.equipe.find((x) => x.id_usuario === params.id);
      if (!m) return naoEncontrado('Membro não encontrado.');
      m.ativo = Boolean(((await request.json()) as { ativo?: boolean }).ativo);
      return semConteudo();
    }),
  ];
}
