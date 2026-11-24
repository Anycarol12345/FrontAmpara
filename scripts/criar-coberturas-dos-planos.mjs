#!/usr/bin/env node
/**
 * Preenche o catálogo da funerária "demo" e liga cada item aos planos Essencial, Acolher e Legado,
 * para a página de cada plano mostrar "O que está coberto".
 *
 * Cada plano cobre tudo do anterior e acrescenta mais conforto e homenagem:
 *   Essencial  o necessário, com dignidade (velório de 8 h, translado de 50 km)
 *   Acolher    mais conforto para a família (velório de 24 h, transmissão online, 300 km)
 *   Legado     uma homenagem completa (cremação, vídeo, música ao vivo, 1.000 km)
 *
 * Grava direto no banco do backend local (o cadastro pela API exige o login do gestor).
 * Categorias e itens que já existem com o mesmo nome são reaproveitados; as coberturas dos três
 * planos são apagadas e recriadas, então dá para rodar de novo.
 *
 * Uso (com o Postgres do Docker no ar):
 *   node scripts/criar-coberturas-dos-planos.mjs
 *
 * Variáveis opcionais: TENANT (demo), CONTAINER_POSTGRES (funeraria-postgres-1).
 */
import { execFileSync } from 'node:child_process';

const TENANT = process.env.TENANT ?? 'demo';
const POSTGRES = process.env.CONTAINER_POSTGRES ?? 'funeraria-postgres-1';
const PLANOS = ['Essencial', 'Acolher', 'Legado'];

// [categoria, item, preço avulso, descrição, cobertura em cada plano [Essencial, Acolher, Legado]]
// A cobertura é a quantidade (0 = não cobre) ou { km } para o translado.
const ITENS = [
  [
    'Urna',
    'Urna simples em madeira',
    1200,
    'Modelo simples, em madeira, com acabamento fosco.',
    [1, 0, 0],
  ],
  [
    'Urna',
    'Urna clássica envernizada',
    2200,
    'Madeira maciça com verniz e alças douradas.',
    [0, 1, 0],
  ],
  [
    'Urna',
    'Urna especial com forro nobre',
    3800,
    'Acabamento especial, alças e forro nobres.',
    [0, 0, 1],
  ],
  ['Preparação', 'Preparação do corpo', 650, 'Higienização e tanatopraxia.', [1, 1, 1]],
  [
    'Flores e ornamentação',
    'Ornamentação simples da urna',
    280,
    'Flores do campo sobre a urna.',
    [1, 1, 0],
  ],
  [
    'Flores e ornamentação',
    'Ornamentação completa do ambiente',
    900,
    'Arranjos na sala e na entrada.',
    [0, 0, 1],
  ],
  ['Coroa de flores', 'Coroa de flores', 560.9, null, [0, 1, 2]],
  ['Velório', 'Velório por até 8 horas', 500, 'Sala de velório da funerária.', [1, 0, 0]],
  [
    'Velório',
    'Velório em sala climatizada por até 24 horas',
    1100,
    'Sala climatizada, com estrutura para a família.',
    [0, 1, 1],
  ],
  ['Velório', 'Café e lanches para a família', 380, 'Servidos durante o velório.', [0, 1, 1]],
  [
    'Translado',
    'Translado funerário',
    450,
    'Do local do falecimento até o velório e o sepultamento.',
    [{ km: 50 }, { km: 300 }, { km: 1000 }],
  ],
  [
    'Translado',
    'Carro funerário para o cortejo',
    400,
    'Cortejo até o cemitério ou o crematório.',
    [1, 1, 1],
  ],
  [
    'Documentos',
    'Registro do óbito e certidão',
    300,
    'A funerária cuida do registro no cartório.',
    [1, 1, 1],
  ],
  [
    'Cerimônia',
    'Apoio à cerimônia religiosa',
    250,
    'Contato com padre, pastor ou celebrante.',
    [0, 1, 1],
  ],
  [
    'Cerimônia',
    'Transmissão online da cerimônia',
    300,
    'Para quem não pode estar presente.',
    [0, 1, 1],
  ],
  [
    'Cerimônia',
    'Livro de presença e lembrancinhas',
    220,
    'Livro de presença e cartões de agradecimento.',
    [0, 1, 1],
  ],
  [
    'Cerimônia',
    'Cerimonialista dedicado',
    450,
    'Acompanha a família em toda a cerimônia.',
    [0, 0, 1],
  ],
  ['Cerimônia', 'Música ao vivo (violino ou coral)', 600, 'Na cerimônia de despedida.', [0, 0, 1]],
  [
    'Homenagens',
    'Homenagem em vídeo com fotos',
    500,
    'Vídeo com fotos e música, exibido no velório.',
    [0, 0, 1],
  ],
  ['Homenagens', 'Missa ou culto de 7º dia', 350, 'Organizado pela funerária.', [0, 0, 1]],
  [
    'Cremação',
    'Cremação com urna cinerária',
    2400,
    'Alternativa ao sepultamento, com urna para as cinzas.',
    [0, 0, 1],
  ],
  [
    'Apoio à família',
    'Atendimento 24h por telefone e WhatsApp',
    0,
    'Equipe disponível a qualquer hora.',
    [1, 1, 1],
  ],
  [
    'Apoio à família',
    'Sessão de acolhimento psicológico',
    150,
    'Apoio ao luto para a família.',
    [0, 0, 4],
  ],
];

// O que vai nas configurações de cada plano (velório e translado aparecem nos destaques do site).
const CONFIG = {
  Essencial: { horas: 8, vip: false, km: 50, cremacao: false, transmissao: false },
  Acolher: { horas: 24, vip: false, km: 300, cremacao: false, transmissao: true },
  Legado: { horas: 24, vip: true, km: 1000, cremacao: true, transmissao: true },
};

const lit = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

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

const tenant = sql(`select id_tenant from tenants.funerarias where slug = ${lit(TENANT)};`);
if (!tenant) throw new Error(`Funerária "${TENANT}" não encontrada.`);
const T = lit(tenant);
const plano = (nome) =>
  `(select id_plano from planos.planos where id_tenant = ${T} and nome = ${lit(nome)} and ativo order by created_at limit 1)`;
const faltam = PLANOS.filter((p) => !sql(`select ${plano(p)};`));
if (faltam.length)
  throw new Error(`Planos não encontrados na funerária ${TENANT}: ${faltam.join(', ')}.`);

const categorias = [...new Set(ITENS.map(([c]) => c))];
const comandos = ['begin;'];
categorias.forEach((c) =>
  comandos.push(`insert into catalogo.categorias (id_categoria, id_tenant, nome, ordem, ativo, created_at)
    select gen_random_uuid(), ${T}, ${lit(c)},
      (select coalesce(max(ordem), 0) + 1 from catalogo.categorias where id_tenant = ${T}), true, now()
    where not exists (select 1 from catalogo.categorias where id_tenant = ${T} and nome = ${lit(c)});`),
);
const categoria = (c) =>
  `(select id_categoria from catalogo.categorias where id_tenant = ${T} and nome = ${lit(c)} order by created_at limit 1)`;
const item = (n) =>
  `(select id_item_catalogo from catalogo.itens where id_tenant = ${T} and nome = ${lit(n)} order by created_at limit 1)`;
for (const [c, nome, preco, descricao] of ITENS)
  comandos.push(`insert into catalogo.itens (id_item_catalogo, id_tenant, id_categoria, nome, descricao, preco, controla_estoque, ativo, created_at)
    select gen_random_uuid(), ${T}, ${categoria(c)}, ${lit(nome)}, ${lit(descricao)}, ${preco}, false, true, now()
    where not exists (select 1 from catalogo.itens where id_tenant = ${T} and nome = ${lit(nome)});`);
comandos.push(`delete from planos.coberturas where id_plano in (${PLANOS.map(plano).join(', ')});`);
for (const [, nome, , , cobre] of ITENS)
  cobre.forEach((q, i) => {
    if (!q) return;
    const km = typeof q === 'object' ? q.km : null;
    comandos.push(`insert into planos.coberturas (id_plano_cobertura, id_item_catalogo, quantidade, km_translado_incluso, id_plano)
      values (gen_random_uuid(), ${item(nome)}, ${km ? 1 : q}, ${km ?? 'null'}, ${plano(PLANOS[i])});`);
  });
for (const [nome, c] of Object.entries(CONFIG))
  comandos.push(`update planos.planos set updated_at = now(), configuracoes = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(configuracoes,
      '{velorio,horas_incluidas}', '${c.horas}'), '{velorio,sala_vip}', '${c.vip}'),
      '{translado,km_incluso}', '${c.km}'), '{cremacao_inclusa}', '${c.cremacao}'), '{transmissao_online}', '${c.transmissao}')
    where id_plano = ${plano(nome)};`);
comandos.push('commit;');
sql(comandos.join('\n'));

const resumo =
  sql(`select p.nome, count(c.*) from planos.planos p left join planos.coberturas c on c.id_plano = p.id_plano
  where p.id_plano in (${PLANOS.map(plano).join(', ')}) group by p.nome, p.valor_mensal order by p.valor_mensal;`);
console.log(`Funerária ${TENANT}: ${ITENS.length} itens no catálogo.`);
for (const linha of resumo.split('\n')) {
  const [nome, total] = linha.split('|');
  console.log(`  ${nome.padEnd(10)} ${total} coberturas`);
}
