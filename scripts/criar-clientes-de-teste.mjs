#!/usr/bin/env node
/**
 * Cria no backend local três clientes de teste da funerária "demo", um para cada situação de fatura:
 *
 *   a-pagar@demo.localhost    contrato aguardando o 1º pagamento, fatura em aberto vencendo em 5 dias
 *   em-dia@demo.localhost     contrato ativo, as três últimas faturas pagas
 *   atrasado@demo.localhost   contrato suspenso, uma fatura paga e outra vencida há 12 dias
 *
 * O cliente e o contrato são criados pela API, como no app. As faturas vão direto no banco,
 * porque o backend só as cria quando o Stripe avisa (sem Stripe configurado, nenhuma é gerada).
 * Rodar de novo apaga e recria as faturas desses três clientes.
 *
 * Uso (com o backend e o Postgres do Docker no ar):
 *   node scripts/criar-clientes-de-teste.mjs
 *
 * A senha dos três fica em scripts/.env.clientes-teste (fora do git), criada na primeira vez.
 * Variáveis opcionais: API_URL (padrão http://localhost:5080), TENANT (demo),
 * CONTAINER_POSTGRES (funeraria-postgres-1).
 */
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL ?? 'http://localhost:5080';
const TENANT = process.env.TENANT ?? 'demo';
const POSTGRES = process.env.CONTAINER_POSTGRES ?? 'funeraria-postgres-1';
const ARQUIVO_SENHA = join(dirname(fileURLToPath(import.meta.url)), '.env.clientes-teste');

const CLIENTES = [
  { email: 'a-pagar@demo.localhost', nome: 'Bianca Teste A Pagar', situacao: 'a-pagar' },
  { email: 'em-dia@demo.localhost', nome: 'Diego Teste Em Dia', situacao: 'em-dia' },
  { email: 'atrasado@demo.localhost', nome: 'Helena Teste Atrasada', situacao: 'atrasado' },
];

/** Senha que segue a política do backend (AUT-01): maiúscula, minúscula, número e símbolo. */
function senhaDosClientes() {
  if (existsSync(ARQUIVO_SENHA)) {
    const linha = readFileSync(ARQUIVO_SENHA, 'utf8').match(/^SENHA_CLIENTES_TESTE=(.+)$/m);
    if (linha) return linha[1].trim();
  }
  const senha = `Teste-${randomBytes(6).toString('base64url')}9a`;
  writeFileSync(
    ARQUIVO_SENHA,
    `# Senha dos clientes de teste criados por scripts/criar-clientes-de-teste.mjs (só no backend local).\nSENHA_CLIENTES_TESTE=${senha}\n`,
  );
  return senha;
}

/** CPF válido e aleatório (o backend confere os dígitos). */
function gerarCpf() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const digito = (numeros) => {
    const soma = numeros.reduce((total, n, i) => total + n * (numeros.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  base.push(digito(base));
  base.push(digito(base));
  return base.join('');
}

async function api(caminho, { metodo = 'GET', corpo, token } = {}) {
  const resposta = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant': TENANT,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  return { status: resposta.status, dados };
}

function sql(comando) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      POSTGRES,
      'psql',
      '-U',
      'funeraria',
      '-d',
      'funeraria',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: comando, encoding: 'utf8' },
  ).trim();
}

const literal = (valor) => (valor === null ? 'null' : `'${String(valor).replace(/'/g, "''")}'`);

/** "aaaa-mm-dd" somando dias a hoje. */
function dia(deslocamento) {
  const d = new Date();
  d.setDate(d.getDate() + deslocamento);
  return d.toISOString().slice(0, 10);
}

async function entrar(email, senha) {
  const { status, dados } = await api('/api/v1/auth/login', {
    metodo: 'POST',
    corpo: { email, senha },
  });
  if (status !== 200)
    throw new Error(`Login de ${email} falhou (${status}): ${dados?.detail ?? ''}`);
  return dados.access_token;
}

async function garantirCliente(cliente, senha) {
  const cadastro = await api('/api/v1/clientes', {
    metodo: 'POST',
    corpo: {
      nome: cliente.nome,
      cpf: gerarCpf(),
      data_nascimento: '1980-05-15',
      telefone: '11988887777',
      email: cliente.email,
      senha,
      endereco: 'Rua das Acácias, 120',
      cep: '01310100',
      cidade: 'São Paulo',
      estado: 'SP',
      aceite_termos: true,
    },
  });
  if (cadastro.status !== 201 && cadastro.status !== 200 && cadastro.status !== 409) {
    // Já cadastrado volta 400 com o e-mail em uso: segue para o login.
    const jaExiste = JSON.stringify(cadastro.dados ?? '')
      .toLowerCase()
      .includes('e-mail');
    if (!jaExiste)
      throw new Error(
        `Cadastro de ${cliente.email} falhou (${cadastro.status}): ${JSON.stringify(cadastro.dados)}`,
      );
  }
  return entrar(cliente.email, senha);
}

async function garantirContrato(token, idPlano) {
  const meus = await api('/api/v1/contratos', { token });
  const existente = (meus.dados?.itens ?? meus.dados ?? []).find((c) => c.status !== 'CANCELADO');
  if (existente) return existente.id_contrato;
  const { status, dados } = await api('/api/v1/contratos', {
    metodo: 'POST',
    token,
    corpo: {
      id_plano: idPlano,
      tipo_cobertura: 'TITULAR',
      dependentes: [],
      periodicidade: 'MENSAL',
      dia_vencimento: 10,
    },
  });
  if (status !== 201 && status !== 200)
    throw new Error(`Contratação falhou (${status}): ${JSON.stringify(dados)}`);
  return dados.id_contrato;
}

/** Faturas de cada situação e a situação do contrato e da assinatura que combinam com elas. */
function planoDeFaturas(situacao, valor) {
  const paga = (meses) => ({
    vencimento: dia(-30 * meses),
    status: 'Paga',
    forma: 'Pix',
    pagaEm: `${dia(-30 * meses - 1)} 10:00:00+00`,
    encargos: 0,
  });
  if (situacao === 'a-pagar')
    return {
      contrato: 'APagar',
      assinatura: 'Ativa',
      inadimplente: false,
      faturas: [{ vencimento: dia(5), status: 'Pendente', forma: null, pagaEm: null, encargos: 0 }],
    };
  if (situacao === 'em-dia')
    return {
      contrato: 'Ativo',
      assinatura: 'Ativa',
      inadimplente: false,
      faturas: [paga(3), paga(2), paga(1)],
    };
  return {
    contrato: 'Suspenso',
    assinatura: 'Ativa',
    inadimplente: true,
    faturas: [
      paga(2),
      // Multa de 2% e juros de 1% ao mês, proporcionais aos 12 dias (DEC-12).
      {
        vencimento: dia(-12),
        status: 'Vencida',
        forma: null,
        pagaEm: null,
        encargos: Math.round(valor * (0.02 + 0.01 * (12 / 30)) * 100) / 100,
      },
    ],
  };
}

function gravarFaturas(idContrato, situacao) {
  const [idTenant, idCliente, valor] = sql(
    `select id_tenant, id_cliente, valor_total from contratos.contratos where id_contrato = ${literal(idContrato)};`,
  ).split('|');
  const plano = planoDeFaturas(situacao, Number(valor));
  const inserts = plano.faturas
    .map(
      (
        f,
      ) => `insert into financeiro.faturas (id_fatura, id_tenant, id_contrato, id_cliente, id_stripe_invoice,
        competencia, valor, valor_multa_juros, data_vencimento, status, forma_pagamento, link_pagamento,
        data_pagamento, avulsa, created_at)
      values (${literal(randomUUID())}, ${literal(idTenant)}, ${literal(idContrato)}, ${literal(idCliente)},
        ${literal(`in_teste_${randomUUID()}`)}, ${literal(f.vencimento.slice(0, 8) + '01')}, ${valor},
        ${f.encargos}, ${literal(f.vencimento)}, ${literal(f.status)}, ${literal(f.forma)},
        ${f.status === 'Paga' ? 'null' : literal('https://pagar.stripe.test/fatura')},
        ${f.pagaEm ? literal(f.pagaEm) : 'null'}, false, now());`,
    )
    .join('\n');
  sql(`begin;
    delete from financeiro.faturas where id_contrato = ${literal(idContrato)};
    ${inserts}
    update contratos.contratos set status = ${literal(plano.contrato)}, updated_at = now()
      where id_contrato = ${literal(idContrato)};
    update financeiro.assinaturas set status = ${literal(plano.assinatura)},
      inadimplente = ${plano.inadimplente},
      inadimplente_desde = ${plano.inadimplente ? literal(dia(-12)) : 'null'}, updated_at = now()
      where id_contrato = ${literal(idContrato)};
    commit;`);
  return plano;
}

async function principal() {
  const senha = senhaDosClientes();
  const planos = await api('/api/v1/planos');
  const lista = planos.dados?.itens ?? planos.dados ?? [];
  const plano = [...lista].sort((a, b) => Number(a.valor_mensal) - Number(b.valor_mensal))[0];
  if (!plano) throw new Error('Nenhum plano ativo na funerária demo.');

  for (const cliente of CLIENTES) {
    const token = await garantirCliente(cliente, senha);
    const idContrato = await garantirContrato(token, plano.id_plano);
    const { contrato, faturas } = gravarFaturas(idContrato, cliente.situacao);
    console.log(
      `${cliente.email.padEnd(26)} plano ${plano.nome}, contrato ${contrato}, faturas: ${faturas.map((f) => f.status).join(', ')}`,
    );
  }
  console.log(`\nSenha dos três: em ${ARQUIVO_SENHA} (SENHA_CLIENTES_TESTE).`);
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
