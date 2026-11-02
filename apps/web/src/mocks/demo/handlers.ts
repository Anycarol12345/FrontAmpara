import type {
  CertidaoResponse,
  DocumentoResponse,
  FuneralResumoResponse,
  ResponsavelCertidaoRequest,
  StatusCertidaoRequest,
  AtribuirFrotaRequest,
  HistoricoTransladoResponse,
  RegistrarTransladoRequest,
  SimularTransladoRequest,
  StatusTransladoRequest,
  TransladoResponse,
  LocalRequest,
  ReservaRequest,
  StatusLocalRequest,
  AtualizarConfiguracoesRequest,
  DocumentosExigidosRequest,
  TabelaPrecosRequest,
  CadastrarDependenteRequest,
  CancelarContratoRequest,
  IncluirDependenteRequest,
  PessoaPreferenciaResponse,
  PreferenciaRequest,
  PreferenciaResponse,
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
  configuracoesDemo,
  criarBanco,
  limparNulos,
  locaisDemo,
  mudancaTranslado,
  novaCertidaoDemo,
  outrosFuneraisDemo,
  prazoDemo,
  reservasDemo,
  simularTransladoDemo,
  tabelaKmDemo,
  montarContrato,
  resumoDoContrato,
} from './dados';
import { alterarEstado, lerEstado } from '../estado';
import {
  certidaoDoExemplo,
  documentosDoExemplo,
  funeralDeExemplo,
  ID_FUNERAL_EXEMPLO,
  transladoDoExemplo,
} from '../exemplos';
import { loginDemo, salvarSessaoDemo, type SessaoDemo } from './sessao';

const naoEncontrado = (detail: string) => HttpResponse.json({ detail }, { status: 404 });
const semConteudo = () => new HttpResponse(null, { status: 204 });
const hoje = () => new Date().toISOString().slice(0, 10);
/** Dia (aaaa-mm-dd) de um ISO no fuso de quem usa a demonstração. */
const diaLocal = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
  const configuracoes = configuracoesDemo();
  const tabelaKm = tabelaKmDemo();
  const locais = locaisDemo();
  const reservas = reservasDemo();
  const translados = [transladoDoExemplo()];
  const documentos: Record<string, DocumentoResponse[]> = {
    [funeralDeExemplo().id_beneficiario]: documentosDoExemplo(),
  };
  const certidoes: Record<string, CertidaoResponse> = {
    [funeralDeExemplo().id_beneficiario]: {
      ...certidaoDoExemplo(),
      historico: [...certidaoDoExemplo().historico],
    },
  };
  const historicoTranslados: Record<string, HistoricoTransladoResponse[]> = {
    [transladoDoExemplo().id_translado]: [
      mudancaTranslado('AGENDADO', 'AGENDADO', 'Translado registrado', -5),
      mudancaTranslado('AGENDADO', 'EM_COLETA', null, -3),
      mudancaTranslado('EM_COLETA', 'EM_TRANSITO', 'Saiu do hospital', -1),
    ],
  };
  const contrato = (id: string) => banco.contratos.find((c) => c.id_contrato === id);
  const dependentesDe = (idCliente: string) =>
    idCliente === banco.meusDados.id_cliente ? banco.dependentes : [];

  /** Itens do catálogo cobertos para a pessoa: os do plano de cada contrato vigente que a cobre. */
  function itensCobertosPara(idPessoa: string) {
    const ids = new Set<string>();
    for (const c of banco.contratos) {
      if (c.status === 'CANCELADO') continue;
      const cobre = c.pessoas_cobertas.some(
        (p) => (p.tipo === 'TITULAR' ? c.titular.id_cliente : p.id_dependente) === idPessoa,
      );
      if (!cobre) continue;
      const plano = banco.planos.find((p) => p.id_plano === c.id_plano);
      plano?.coberturas.forEach((cob) => ids.add(cob.id_item_catalogo));
    }
    return ids;
  }

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

    // Salas, agenda e reservas do funeral de exemplo (ADM-06).
    http.get('*/api/v1/gestao/locais', ({ request }) => {
      const ativos = new URL(request.url).searchParams.get('ativos') === 'true';
      return HttpResponse.json(locais.filter((l) => !ativos || l.ativo));
    }),
    http.post('*/api/v1/gestao/locais', async ({ request }) => {
      const dados = (await request.json()) as LocalRequest;
      const local = {
        id_local: `local-${Date.now()}`,
        nome: dados.nome ?? '',
        tipo: dados.tipo ?? 'OUTRO',
        endereco: dados.endereco,
        proprio: dados.proprio,
        intervalo_preparacao_minutos: dados.intervalo_preparacao_minutos ?? 0,
        ativo: true,
      };
      locais.push(local);
      return HttpResponse.json(local, { status: 201 });
    }),
    http.put('*/api/v1/gestao/locais/:id', async ({ request, params }) => {
      const local = locais.find((l) => l.id_local === params.id);
      if (!local) return naoEncontrado('Local não encontrado.');
      Object.assign(local, await request.json());
      return HttpResponse.json(local);
    }),
    http.patch('*/api/v1/gestao/locais/:id/status', async ({ request, params }) => {
      const local = locais.find((l) => l.id_local === params.id);
      if (!local) return naoEncontrado('Local não encontrado.');
      local.ativo = Boolean(((await request.json()) as StatusLocalRequest).ativo);
      return semConteudo();
    }),
    http.get('*/api/v1/gestao/locais/:id/agenda', ({ request, params }) => {
      const local = locais.find((l) => l.id_local === params.id);
      if (!local) return naoEncontrado('Local não encontrado.');
      const dia = new URL(request.url).searchParams.get('data') ?? hoje();
      const intervalo = local.intervalo_preparacao_minutos * 60_000;
      return HttpResponse.json({
        local,
        data: dia,
        reservas: reservas
          .filter((r) => r.id_local === local.id_local && diaLocal(r.inicio) === dia)
          .map((r) => ({
            id_reserva: r.id_reserva,
            id_funeral: r.id_funeral,
            nome_falecido: r.nome_falecido,
            inicio: r.inicio,
            fim: r.fim,
            ocupado_ate: new Date(new Date(r.fim).getTime() + intervalo).toISOString(),
          })),
      });
    }),
    http.get('*/api/v1/funerais/:id', async ({ params }) => {
      if (params.id !== ID_FUNERAL_EXEMPLO) return;
      await delay(300);
      return HttpResponse.json({
        ...funeralDeExemplo(),
        reservas: reservas.filter((r) => r.id_funeral === ID_FUNERAL_EXEMPLO),
      });
    }),
    http.post('*/api/v1/funerais/:id/reservas', async ({ request, params }) => {
      const dados = (await request.json()) as ReservaRequest;
      const local = locais.find((l) => l.id_local === dados.id_local);
      if (!local || !dados.inicio || !dados.fim) return naoEncontrado('Local não encontrado.');
      const intervalo = local.intervalo_preparacao_minutos * 60_000;
      const ini = new Date(dados.inicio).getTime();
      const fim = new Date(dados.fim).getTime();
      const conflito =
        local.proprio &&
        reservas.some(
          (r) =>
            r.id_local === local.id_local &&
            ini < new Date(r.fim).getTime() + intervalo &&
            new Date(r.inicio).getTime() < fim + intervalo,
        );
      await delay(300);
      if (conflito)
        return HttpResponse.json(
          { title: 'Horário ocupado', detail: 'O local já está reservado nesse horário.' },
          { status: 409 },
        );
      const reserva = {
        id_reserva: `reserva-${Date.now()}`,
        id_local: local.id_local,
        nome_local: local.nome,
        tipo_local: local.tipo,
        inicio: dados.inicio,
        fim: dados.fim,
        id_funeral: String(params.id),
        nome_falecido: funeralDeExemplo().nome_falecido,
      };
      reservas.push(reserva);
      return HttpResponse.json(reserva, { status: 201 });
    }),
    http.delete('*/api/v1/funerais/:id/reservas/:idReserva', ({ params }) => {
      const i = reservas.findIndex((r) => r.id_reserva === params.idReserva);
      if (i >= 0) reservas.splice(i, 1);
      return semConteudo();
    }),

    // Translados do funeral de exemplo (ADM-07).
    http.get('*/api/v1/funerais/:id/translados', ({ params }) =>
      HttpResponse.json(translados.filter((t) => t.id_funeral === params.id)),
    ),
    http.get('*/api/v1/translados/:id/historico', ({ params }) =>
      HttpResponse.json(historicoTranslados[String(params.id)] ?? []),
    ),
    http.get('*/api/v1/translados/:id/documentos', ({ params }) => {
      const t = translados.find((x) => x.id_translado === params.id);
      if (!t) return naoEncontrado('Translado não encontrado.');
      const exigidos = tabelaKm.documentos_exigidos[t.tipo] ?? [];
      const documentos = exigidos.map((tipo, i) => ({ tipo, presente: i === 0 }));
      return HttpResponse.json({
        tipo: t.tipo,
        documentos,
        completo: documentos.every((d) => d.presente),
      });
    }),
    http.get('*/api/v1/translados/:id/empresas-disponiveis', () =>
      HttpResponse.json([
        { id_terceiro: 'terceiro-boa-viagem', nome: 'Translados Boa Viagem' },
        { id_terceiro: 'terceiro-remocoes-paz', nome: 'Remoções Paz' },
      ]),
    ),
    http.post('*/api/v1/translados/simular', async ({ request }) => {
      const dados = (await request.json()) as SimularTransladoRequest;
      await delay(400);
      return HttpResponse.json(simularTransladoDemo(dados, tabelaKm.faixas));
    }),
    http.post('*/api/v1/funerais/:id/translados', async ({ request, params }) => {
      const dados = (await request.json()) as RegistrarTransladoRequest;
      const simulacao = simularTransladoDemo(dados, tabelaKm.faixas);
      const id = `translado-${Date.now()}`;
      const translado: TransladoResponse = {
        id_translado: id,
        id_funeral: String(params.id),
        ...simulacao,
        status: 'AGENDADO',
        origem: { endereco: '', cidade: '', uf: '', pais: 'BR', ...limparNulos(dados.origem) },
        destino: { endereco: '', cidade: '', uf: '', pais: 'BR', ...limparNulos(dados.destino) },
        data_prevista: dados.data_prevista ?? new Date().toISOString(),
        id_terceiro_frota: null,
        nome_frota: null,
        status_aceite: null,
        motivo_recusa: null,
        motorista: null,
      };
      translados.push(translado);
      historicoTranslados[id] = [mudancaTranslado('AGENDADO', 'AGENDADO', 'Translado registrado')];
      await delay(300);
      return HttpResponse.json(translado, { status: 201 });
    }),
    http.patch('*/api/v1/translados/:id/terceiro', async ({ request, params }) => {
      const t = translados.find((x) => x.id_translado === params.id);
      if (!t) return naoEncontrado('Translado não encontrado.');
      const { id_terceiro } = (await request.json()) as AtribuirFrotaRequest;
      t.id_terceiro_frota = id_terceiro;
      t.nome_frota =
        id_terceiro === 'terceiro-remocoes-paz' ? 'Remoções Paz' : 'Translados Boa Viagem';
      t.status_aceite = 'PENDENTE';
      t.motivo_recusa = null;
      return HttpResponse.json(t);
    }),
    http.patch('*/api/v1/translados/:id/status', async ({ request, params }) => {
      const t = translados.find((x) => x.id_translado === params.id);
      if (!t) return naoEncontrado('Translado não encontrado.');
      const { status, observacao } = (await request.json()) as StatusTransladoRequest;
      if (!status) return naoEncontrado('Status inválido.');
      (historicoTranslados[t.id_translado] ??= []).push(
        mudancaTranslado(t.status, status, observacao),
      );
      t.status = status;
      return HttpResponse.json(t);
    }),

    // Funerais do painel e documentos e certidão do falecido (ADM-08).
    http.get('*/api/v1/gestao/funerais', ({ request }) => {
      const status = new URL(request.url).searchParams.get('status');
      const exemplo = funeralDeExemplo();
      const lista: FuneralResumoResponse[] = [
        {
          id_funeral: exemplo.id_funeral,
          id_beneficiario: exemplo.id_beneficiario,
          nome_falecido: exemplo.nome_falecido,
          status: exemplo.status,
          data_hora_prevista: exemplo.data_hora_prevista,
          destinacao: exemplo.destinacao,
        },
        ...outrosFuneraisDemo(),
      ].filter((f) => !status || f.status === status);
      return HttpResponse.json(paginar(lista, new URL(request.url)));
    }),
    http.get('*/api/v1/beneficiarios/:id/documentos', ({ params }) =>
      HttpResponse.json(documentos[String(params.id)] ?? []),
    ),
    http.post('*/api/v1/beneficiarios/:id/documentos', async ({ request, params }) => {
      const form = await request.formData();
      const arquivo = form.get('arquivo') as File | null;
      const documento: DocumentoResponse = {
        id_documento: `doc-${Date.now()}`,
        tipo: (form.get('tipo') as DocumentoResponse['tipo']) ?? 'OUTRO',
        nome_original: arquivo?.name ?? 'arquivo.pdf',
        content_type: arquivo?.type ?? 'application/pdf',
        tamanho: arquivo?.size ?? 0,
        enviado_em: new Date().toISOString(),
      };
      (documentos[String(params.id)] ??= []).push(documento);
      await delay(400);
      return HttpResponse.json(documento, { status: 201 });
    }),
    http.delete('*/api/v1/beneficiarios/:id/documentos/:idDocumento', ({ params }) => {
      const lista = documentos[String(params.id)] ?? [];
      const i = lista.findIndex((d) => d.id_documento === params.idDocumento);
      if (i >= 0) lista.splice(i, 1);
      return semConteudo();
    }),
    http.get('*/api/v1/beneficiarios/:id/certidao/checklist', ({ params }) => {
      const presentes = new Set((documentos[String(params.id)] ?? []).map((d) => d.tipo));
      const exigidos = [
        ['DECLARACAO_OBITO', 'Declaração de óbito (DO)'],
        ['DOCUMENTO_FALECIDO', 'RG ou CNH do falecido'],
        ['DOCUMENTO_DECLARANTE', 'Documento do declarante'],
      ] as const;
      const lista = exigidos.map(([tipo, descricao]) => ({
        tipo,
        descricao,
        presente: presentes.has(tipo),
      }));
      return HttpResponse.json({
        dados: {
          nome_falecido: 'Falecido(a) da demonstração',
          data_nascimento: '1948-05-12',
          data_falecimento: new Date(Date.now() - 86_400_000).toISOString(),
          local_falecimento: 'Hospital Santa Clara, São Paulo-SP',
          nome_declarante: 'Ana Souza',
          telefone_declarante: '(11) 98888-0000',
        },
        documentos: lista,
        prazo: prazoDemo(1),
        pronto_para_solicitar: lista.every((d) => d.presente),
      });
    }),
    http.get('*/api/v1/beneficiarios/:id/certidao', ({ params }) => {
      const certidao = certidoes[String(params.id)];
      return certidao ? HttpResponse.json(certidao) : naoEncontrado('Certidão não pedida.');
    }),
    http.post('*/api/v1/beneficiarios/:id/certidao', ({ params }) => {
      const certidao = novaCertidaoDemo(String(params.id));
      certidoes[String(params.id)] = certidao;
      return HttpResponse.json(certidao, { status: 201 });
    }),
    http.patch('*/api/v1/beneficiarios/:id/certidao/status', async ({ request, params }) => {
      const c = certidoes[String(params.id)];
      if (!c) return naoEncontrado('Certidão não pedida.');
      const dados = (await request.json()) as StatusCertidaoRequest;
      if (!dados.status) return naoEncontrado('Status inválido.');
      c.historico.push({
        de: c.status,
        para: dados.status,
        id_usuario: 'us-juliana',
        observacao: dados.observacao,
        em: new Date().toISOString(),
      });
      c.status = dados.status;
      if (dados.protocolo) c.protocolo = dados.protocolo;
      c.pendencia =
        dados.status === 'REJEITADA' || dados.status === 'ERRO' ? dados.observacao : null;
      return semConteudo();
    }),
    http.patch('*/api/v1/beneficiarios/:id/certidao/responsavel', async ({ request, params }) => {
      const c = certidoes[String(params.id)];
      if (!c) return naoEncontrado('Certidão não pedida.');
      const dados = (await request.json()) as ResponsavelCertidaoRequest;
      const membro = banco.equipe.find((m) => m.id_usuario === dados.id_usuario);
      c.responsavel = {
        tipo: dados.tipo === 'TERCEIRO' ? 'TERCEIRO' : 'FUNCIONARIO',
        id_usuario: dados.id_usuario,
        id_terceiro: dados.id_terceiro,
        nome: membro?.nome ?? 'Cartório do 2º Ofício',
      };
      return semConteudo();
    }),
    http.post('*/api/v1/beneficiarios/:id/certidao/emitida', async ({ request, params }) => {
      const c = certidoes[String(params.id)];
      if (!c) return naoEncontrado('Certidão não pedida.');
      const form = await request.formData();
      const arquivo = form.get('arquivo') as File | null;
      const id = `doc-certidao-${Date.now()}`;
      (documentos[String(params.id)] ??= []).push({
        id_documento: id,
        tipo: 'CERTIDAO_OBITO',
        nome_original: arquivo?.name ?? 'certidao.pdf',
        content_type: arquivo?.type ?? 'application/pdf',
        tamanho: arquivo?.size ?? 0,
        enviado_em: new Date().toISOString(),
      });
      c.historico.push({
        de: c.status,
        para: 'EMITIDA',
        id_usuario: 'us-juliana',
        observacao: null,
        em: new Date().toISOString(),
      });
      c.status = 'EMITIDA';
      c.numero_matricula = String(form.get('numero_matricula') ?? '');
      c.id_documento_certidao = id;
      await delay(400);
      return HttpResponse.json(c);
    }),

    // Configurações da funerária e tabela de km do translado (ADM-12).
    http.get('*/api/v1/gestao/configuracoes', () => HttpResponse.json(configuracoes)),
    http.put('*/api/v1/gestao/configuracoes', async ({ request }) => {
      const dados = (await request.json()) as AtualizarConfiguracoesRequest;
      if (dados.identidade_visual)
        Object.assign(configuracoes.identidade_visual, dados.identidade_visual);
      if (dados.parametros) Object.assign(configuracoes.parametros, dados.parametros);
      await delay(300);
      return HttpResponse.json(configuracoes);
    }),
    http.get('*/api/v1/gestao/translados/tabela-precos', () => HttpResponse.json(tabelaKm)),
    http.put('*/api/v1/gestao/translados/tabela-precos', async ({ request }) => {
      tabelaKm.faixas = ((await request.json()) as TabelaPrecosRequest).faixas ?? [];
      return semConteudo();
    }),
    http.put('*/api/v1/gestao/translados/documentos-exigidos', async ({ request }) => {
      tabelaKm.documentos_exigidos =
        ((await request.json()) as DocumentosExigidosRequest).documentos ?? {};
      return semConteudo();
    }),

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

    // Preferências de funeral em vida (FUN-02), com o que o plano de cada pessoa cobre.
    http.get('*/api/v1/preferencias-funeral', async () => {
      await delay(300);
      const salvas = lerEstado().preferencias;
      const pessoas: PessoaPreferenciaResponse[] = [
        {
          id_pessoa: banco.meusDados.id_cliente,
          tipo: 'TITULAR' as const,
          nome: banco.meusDados.nome,
        },
        ...banco.dependentes.map((d) => ({
          id_pessoa: d.id_dependente,
          tipo: 'DEPENDENTE' as const,
          nome: d.nome,
        })),
      ].map((p) => ({ ...p, preferencia: salvas[p.id_pessoa] ?? null }));
      return HttpResponse.json(pessoas);
    }),
    http.put('*/api/v1/preferencias-funeral/:idPessoa', async ({ request, params }) => {
      const id = String(params.idPessoa);
      const dados = (await request.json()) as PreferenciaRequest;
      const cobertos = itensCobertosPara(id);
      const preferencia: PreferenciaResponse = {
        destinacao: dados.destinacao ?? 'NAO_DEFINIDA',
        tipo_cerimonia: dados.tipo_cerimonia ?? 'NAO_DEFINIDA',
        crenca_religiosa: dados.crenca_religiosa,
        musicas: dados.musicas ?? [],
        mensagens: dados.mensagens,
        observacoes: dados.observacoes,
        itens: (dados.itens ?? []).map((i) => {
          const item = CATALOGO.find((c) => c.id_item === i.id_item_catalogo);
          const coberto = cobertos.has(i.id_item_catalogo ?? '');
          return {
            id_item_catalogo: i.id_item_catalogo ?? '',
            nome: item?.nome ?? '',
            categoria: CATEGORIAS.find((c) => c.id_categoria === item?.id_categoria)?.nome ?? '',
            id_variacao: i.id_variacao,
            variacao: item?.variacoes.find((v) => v.id_variacao === i.id_variacao)?.nome ?? null,
            quantidade: i.quantidade ?? 1,
            coberto_pelo_plano: coberto,
            quantidade_coberta: coberto ? 1 : 0,
          };
        }),
      };
      alterarEstado((e) => (e.preferencias[id] = preferencia));
      await delay(400);
      return semConteudo();
    }),

    // Ações do titular no contrato: incluir e remover dependente (CON-02) e cancelar (CON-03).
    http.post('*/api/v1/contratos/:id/dependentes', async ({ request, params }) => {
      const c = contrato(String(params.id));
      if (!c) return naoEncontrado('Contrato não encontrado.');
      const { id_dependente } = (await request.json()) as IncluirDependenteRequest;
      const dependente = banco.dependentes.find((d) => d.id_dependente === id_dependente);
      if (!dependente) return naoEncontrado('Dependente não encontrado.');
      const plano = banco.planos.find((p) => p.id_plano === c.id_plano);
      const naoTitulares = c.pessoas_cobertas.filter((p) => p.tipo === 'DEPENDENTE').length;
      if (plano && naoTitulares >= plano.limite_dependentes) {
        return HttpResponse.json(
          {
            status: 409,
            code: 'Contrato.LimiteDependentes',
            detail: `O plano ${plano.nome} cobre até ${plano.limite_dependentes} dependentes.`,
          },
          { status: 409 },
        );
      }
      const hoje = new Date().toISOString().slice(0, 10);
      const carencia = new Date(Date.now() + c.carencia_dias * 86_400_000)
        .toISOString()
        .slice(0, 10);
      c.pessoas_cobertas.push({
        id_pessoa_coberta: `${c.id_contrato}-${dependente.id_dependente}`,
        tipo: 'DEPENDENTE',
        id_dependente: dependente.id_dependente,
        nome: dependente.nome,
        cpf: dependente.cpf,
        data_inclusao: hoje,
        carencia_cumprida_em: carencia,
      });
      c.valor_total = Math.round((c.valor_total + c.valor_por_dependente) * 100) / 100;
      await delay(400);
      return HttpResponse.json(c);
    }),
    http.delete('*/api/v1/contratos/:id/dependentes/:idDependente', async ({ params }) => {
      const c = contrato(String(params.id));
      if (!c) return naoEncontrado('Contrato não encontrado.');
      const antes = c.pessoas_cobertas.length;
      c.pessoas_cobertas = c.pessoas_cobertas.filter(
        (p) => p.id_dependente !== params.idDependente,
      );
      if (c.pessoas_cobertas.length < antes) {
        c.valor_total = Math.round((c.valor_total - c.valor_por_dependente) * 100) / 100;
      }
      await delay(400);
      return semConteudo();
    }),
    http.post('*/api/v1/contratos/:id/cancelar', async ({ request, params }) => {
      const c = contrato(String(params.id));
      if (!c) return naoEncontrado('Contrato não encontrado.');
      const { motivo } = (await request.json()) as CancelarContratoRequest;
      c.status = 'CANCELADO';
      c.data_fim = new Date().toISOString().slice(0, 10);
      c.motivo_cancelamento = motivo;
      await delay(400);
      return semConteudo();
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
