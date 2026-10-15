/**
 * CONTROLE DE LUBRIFICAÇÃO · FROTA NAVECUNHA  —  SERVIDOR (Google Apps Script)
 * ---------------------------------------------------------------------------
 * Guarda os lançamentos numa Planilha Google (aba "Registros") e os PDFs numa
 * pasta do Google Drive. O painel (HTML) conversa com este script pela internet.
 *
 * COMO USAR (resumo — o passo a passo completo está no GUIA):
 *  1) Crie uma Planilha Google nova  →  menu Extensões → Apps Script.
 *  2) Apague o que estiver lá, cole TODO este arquivo e salve.
 *  3) Escolha a função "configurar" e clique em Executar (autorize quando pedir).
 *  4) Implantar → Nova implantação → tipo "App da Web":
 *        Executar como: Eu     |     Quem pode acessar: Qualquer pessoa
 *  5) Copie o endereço que termina em /exec e cole em Administração → Nuvem.
 *
 * SENHAS INICIAIS (troque pelo painel, em Administração):
 *    operador: oleo2026      administrador: admin2026
 */

const VERSAO = 2;
const NOME_PASTA = 'Controle de Lubrificação - PDFs';
const ABA = 'Registros';
const CABECALHO = ['id', 'tipo', 'salvoEm', 'leituraEm', 'embarcacao', 'om', 'usuario', 'json', 'pdfFileId', 'paginasFileId', 'atualizadoEm', 'excluido'];
const COL = {}; CABECALHO.forEach((c, i) => COL[c] = i);
/* Colunas LEGÍVEIS (M a U): o que você lê na planilha. As colunas A–L são técnicas (o painel usa) e ficam ocultas. */
const LEGIVEL = ['Data e hora do lançamento', 'Tipo', 'Data da operação', 'Equipamento(s)', 'Horímetro (h)', 'Próxima troca (h)', 'Operação', 'Óleo e quantidade', 'PDF do formulário'];
const COL_LEG = CABECALHO.length + 1;        // primeira coluna legível (M)
const EQ_NOME = { mcp1: 'MCP (BB/C)', mcp2: 'MCP (BE)', crp1: 'Reversor (BB/C)', crp2: 'Reversor (BE)', mca1: 'MCA 1', mca2: 'MCA 2', hid: 'Sist. Hidráulico (Governo)', popa: 'Motor de popa', bomba: 'Motobomba', inc: 'Bomba de incêndio' };
const LIMITE_B64 = 14 * 1024 * 1024;        // tamanho máximo do PDF (em base64) aceito por envio

/* ============================ CONFIGURAÇÃO (rodar 1x) ============================ */
function configurar() {
  const props = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  props.setProperty('SHEET_ID', ss.getId());
  let sh = ss.getSheetByName(ABA);
  if (!sh) { sh = ss.insertSheet(ABA); }
  if (sh.getLastRow() === 0) { sh.appendRow(CABECALHO); sh.setFrozenRows(1); }
  ajustarAba_(sh);
  if (!props.getProperty('SALT')) props.setProperty('SALT', Utilities.getUuid() + Utilities.getUuid());
  const salt = props.getProperty('SALT');
  // senhas iniciais (também é o que volta a valer se você apagar OP_HASH / AD_HASH e rodar de novo)
  if (!props.getProperty('OP_HASH')) props.setProperty('OP_HASH', hashSenha_(salt, 'oleo2026'));
  if (!props.getProperty('AD_HASH')) props.setProperty('AD_HASH', hashSenha_(salt, 'admin2026'));
  if (!props.getProperty('FOLDER_ID')) {
    props.setProperty('FOLDER_ID', DriveApp.createFolder(NOME_PASTA).getId());
  }
  if (!props.getProperty('PUBLIC_READ')) props.setProperty('PUBLIC_READ', 'true');   // 'false' = só quem fez login vê os dados
  Logger.log('Pronto. Agora faça: Implantar → Nova implantação → App da Web.');
}

/* ============================ ENTRADA ============================ */
function doGet() {
  return json_({ ok: true, app: 'controle_de_oleo', versao: VERSAO });
}

function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    out = tratar_(req);
  } catch (err) {
    out = { ok: false, error: 'erro: ' + (err && err.message ? err.message : err) };
  }
  return json_(out);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ ROTEADOR ============================ */
function tratar_(req) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SALT')) return { ok: false, error: 'nao_configurado' };
  switch (req.action) {
    case 'ping':     return { ok: true, versao: VERSAO };
    case 'login':    return login_(req, props);
    case 'list':     return listar_(req, props);
    case 'push':     return comLock_(() => gravar_(req, props));
    case 'getFile':  return obterArquivo_(req, props);
    case 'delete':   return comLock_(() => excluir_(req, props));
    case 'setConfig':    return comLock_(() => salvarConfig_(req, props));
    case 'setPasswords': return comLock_(() => trocarSenhas_(req, props));
    default: return { ok: false, error: 'acao_desconhecida' };
  }
}

function comLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ============================ SENHAS / SESSÃO ============================ */
function hashSenha_(salt, senha) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + senha, Utilities.Charset.UTF_8);
  return bytes.map(b => ((b < 0 ? b + 256 : b)).toString(16).padStart(2, '0')).join('');
}

function login_(req, props) {
  const nome = String(req.name || '').trim();
  const salt = props.getProperty('SALT');
  const h = hashSenha_(salt, String(req.password || ''));
  let papel = null;
  if (h === props.getProperty('AD_HASH')) papel = 'admin';
  else if (h === props.getProperty('OP_HASH')) papel = 'op';
  if (!nome || !papel) { Utilities.sleep(1500); return { ok: false, error: 'senha' }; }
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('t_' + token, JSON.stringify({ name: nome, role: papel }), 21600);   // 6 h
  const r = { ok: true, token: token, role: papel, salt: salt, opHash: props.getProperty('OP_HASH') };
  if (papel === 'admin') {
    r.adHash = props.getProperty('AD_HASH');
    r.opPadrao = props.getProperty('OP_HASH') === hashSenha_(salt, 'oleo2026');
    r.adPadrao = props.getProperty('AD_HASH') === hashSenha_(salt, 'admin2026');
  }
  return r;
}

function sessao_(req) {
  if (!req.token) return null;
  const v = CacheService.getScriptCache().get('t_' + req.token);
  return v ? JSON.parse(v) : null;
}

/* ============================ PLANILHA ============================ */
function aba_(props) {
  return SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName(ABA);
}

function linhas_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, CABECALHO.length).getValues();
}

/* ============================ LISTAR (painel lê aqui) ============================ */
function listar_(req, props) {
  const s = sessao_(req);
  if (!s && props.getProperty('PUBLIC_READ') === 'false') return { ok: false, error: 'auth' };
  const desde = Number(req.since || 0);
  const registros = [], excluidos = [];
  linhas_(aba_(props)).forEach(l => {
    if (Number(l[COL.atualizadoEm]) < desde) return;
    if (l[COL.excluido] === true || l[COL.excluido] === 'TRUE') { excluidos.push(l[COL.id]); return; }
    let r; try { r = JSON.parse(l[COL.json]); } catch (e) { return; }
    r.pdfFileId = l[COL.pdfFileId] || null;
    r.pagesFileId = l[COL.paginasFileId] || null;
    registros.push(r);
  });
  const cfgTxt = props.getProperty('CFG');
  return { ok: true, records: registros, deleted: excluidos, now: Date.now(),
           cfg: cfgTxt ? JSON.parse(cfgTxt) : null, cfgAt: Number(props.getProperty('CFG_AT') || 0) };
}

/* ============================ GRAVAR (operador envia formulário) ============================ */
function gravar_(req, props) {
  const s = sessao_(req);
  if (!s) return { ok: false, error: 'auth' };
  const r = req.record;
  if (!r || !r.id || (r.type !== 'form' && r.type !== 'quick')) return { ok: false, error: 'registro_invalido' };
  const sh = aba_(props);
  const dados = linhas_(sh);
  const existente = dados.find(l => l[COL.id] === r.id);
  if (existente) {                              // reenvio do mesmo registro: não duplica
    return { ok: true, duplicate: true, pdfFileId: existente[COL.pdfFileId] || null, pagesFileId: existente[COL.paginasFileId] || null };
  }
  let pdfId = '', pagId = '';
  if (req.pdfB64) {
    if (req.pdfB64.length > LIMITE_B64) return { ok: false, error: 'pdf_grande_demais' };
    const pasta = pastaDaEmbarcacao_(props, r.vessel || 'Sem embarcacao');
    const base = nomeSeguro_((r.vessel || 'embarcacao') + '_OM' + (r.om || 'sem') + '_' + (r.date || '') + '_' + String(r.id).slice(-4));
    pdfId = pasta.createFile(Utilities.newBlob(Utilities.base64Decode(req.pdfB64), 'application/pdf', base + '.pdf')).getId();
    if (req.pagesJson) {
      pagId = pasta.createFile(Utilities.newBlob(req.pagesJson, 'application/json', base + '_paginas.json')).getId();
    }
  }
  const limpo = Object.assign({}, r);
  delete limpo.pdf; delete limpo.pages; delete limpo.pdfFileId; delete limpo.pagesFileId; delete limpo.synced;
  const agora = Date.now();
  sh.appendRow([r.id, r.type, r.savedAt || agora, r.readAt || agora, r.vessel || '', r.om || '', s.name, JSON.stringify(limpo), pdfId, pagId, agora, false]);
  try { sh.getRange(sh.getLastRow(), COL_LEG, 1, LEGIVEL.length).setValues([legiveis_(r, pdfId)]); } catch (e) { }   // colunas legíveis (nunca impedem o salvamento)
  return { ok: true, pdfFileId: pdfId || null, pagesFileId: pagId || null };
}

function nomeSeguro_(t) { return String(t).replace(/[^\w\-.]+/g, '_').slice(0, 120); }

function pastaDaEmbarcacao_(props, nome) {
  const raiz = DriveApp.getFolderById(props.getProperty('FOLDER_ID'));
  const it = raiz.getFoldersByName(nome);
  return it.hasNext() ? it.next() : raiz.createFolder(nome);
}

/* ============================ BAIXAR ARQUIVO (PDF / páginas) ============================ */
function obterArquivo_(req, props) {
  const s = sessao_(req);
  if (!s && props.getProperty('PUBLIC_READ') === 'false') return { ok: false, error: 'auth' };
  if (!req.fileId) return { ok: false, error: 'sem_arquivo' };
  // só entrega arquivos que pertencem a algum registro (evita ler qualquer arquivo do Drive)
  const ok = linhas_(aba_(props)).some(l => l[COL.pdfFileId] === req.fileId || l[COL.paginasFileId] === req.fileId);
  if (!ok) return { ok: false, error: 'arquivo_invalido' };
  const blob = DriveApp.getFileById(req.fileId).getBlob();
  return { ok: true, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/* ============================ EXCLUIR (só administrador) ============================ */
function excluir_(req, props) {
  const s = sessao_(req);
  if (!s || s.role !== 'admin') return { ok: false, error: 'auth' };
  const sh = aba_(props);
  const n = sh.getLastRow();
  if (n < 2) return { ok: false, error: 'nao_encontrado' };
  const ids = sh.getRange(2, COL.id + 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === req.id) {
      const linha = i + 2;
      const v = sh.getRange(linha, 1, 1, CABECALHO.length).getValues()[0];
      [v[COL.pdfFileId], v[COL.paginasFileId]].forEach(f => { if (f) { try { DriveApp.getFileById(f).setTrashed(true); } catch (e) { } } });
      sh.getRange(linha, COL.atualizadoEm + 1).setValue(Date.now());
      sh.getRange(linha, COL.excluido + 1).setValue(true);
      return { ok: true };
    }
  }
  return { ok: false, error: 'nao_encontrado' };
}

/* ============================ PARÂMETROS COMPARTILHADOS ============================ */
function salvarConfig_(req, props) {
  const s = sessao_(req);
  if (!s || s.role !== 'admin') return { ok: false, error: 'auth' };
  const c = req.cfg || {};
  const permitido = {};
  ['warnH', 'warnDays', 'usoDiario', 'intervals', 'seedCleared'].forEach(k => { if (c[k] !== undefined) permitido[k] = c[k]; });
  const antigo = props.getProperty('CFG') ? JSON.parse(props.getProperty('CFG')) : {};
  const agora = Date.now();
  props.setProperty('CFG', JSON.stringify(Object.assign(antigo, permitido)));
  props.setProperty('CFG_AT', String(agora));
  return { ok: true, cfgAt: agora };
}

/* ============================ TROCAR SENHAS (só administrador) ============================ */
function trocarSenhas_(req, props) {
  const s = sessao_(req);
  if (!s || s.role !== 'admin') return { ok: false, error: 'auth' };
  const salt = props.getProperty('SALT');
  if (req.op !== undefined && req.op !== null && req.op !== '') {
    if (String(req.op).length < 6) return { ok: false, error: 'senha_curta' };
    props.setProperty('OP_HASH', hashSenha_(salt, String(req.op)));
  }
  if (req.ad !== undefined && req.ad !== null && req.ad !== '') {
    if (String(req.ad).length < 6) return { ok: false, error: 'senha_curta' };
    props.setProperty('AD_HASH', hashSenha_(salt, String(req.ad)));
  }
  return { ok: true };
}


/* ============================ PLANILHA LEGÍVEL ============================ */
function dataLocal_(v) {                      // 'AAAA-MM-DD' ou milissegundos -> Data de verdade
  if (!v) return '';
  if (typeof v === 'number') return new Date(v);
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0) : '';
}
function numTxt_(n) { return (n === null || n === undefined || n === '') ? '' : Number(n).toLocaleString('pt-BR'); }

/* Monta as 9 colunas legíveis (M a U) de um registro */
function legiveis_(r, pdfId) {
  const form = r.type === 'form';
  let equip = '', horim = '', prox = '', oleo = '', operacao = '', dataOp = '';
  if (form) {
    const t = (r.eq || []).filter(q => q.status === 'T');
    equip = t.map(q => q.name || EQ_NOME[q.key] || q.key).join(', ');
    horim = t.map(q => (q.name || q.key) + ': ' + numTxt_(q.hr) + ' h').join('\n');
    prox = t.map(q => (q.name || q.key) + ': ' + numTxt_(q.nx) + ' h').join('\n');
    oleo = t.filter(q => q.oil || q.qtd).map(q => (q.name || q.key) + ': ' + (q.oil || '?') + ' · ' + (q.qtd || '?') + ' L').join('\n');
    operacao = 'Troca de óleo e filtros (formulário)';
    dataOp = dataLocal_(r.date) || dataLocal_(r.readAt);
  } else {
    equip = EQ_NOME[r.key] || r.key || '';
    horim = r.hours === undefined ? '' : Number(r.hours);
    prox = (r.next === null || r.next === undefined || r.next === '') ? '' : Number(r.next);
    operacao = r.op === 'troca' ? 'Troca (lançamento rápido)' : 'Leitura de horímetro';
    if (r.op === 'troca' && (r.oil || r.qtd)) oleo = (EQ_NOME[r.key] || r.key || '') + ': ' + (r.oil || '?') + ' · ' + (r.qtd || '?') + ' L';
    dataOp = dataLocal_(r.readAt);
  }
  const pdf = pdfId ? '=HYPERLINK("https://drive.google.com/file/d/' + pdfId + '/view","📄 Abrir PDF")' : (form ? 'sem PDF' : '— (lançamento rápido não tem PDF)');
  return [dataLocal_(r.savedAt), form ? 'Formulário FR 049_B' : 'Lançamento rápido', dataOp, equip, horim, prox, operacao, oleo, pdf];
}

/* Cabeçalho, formatos de data, larguras e esconde as colunas técnicas */
function ajustarAba_(sh) {
  sh.getRange(1, COL_LEG, 1, LEGIVEL.length).setValues([LEGIVEL]);
  sh.getRange(1, 1, 1, COL_LEG + LEGIVEL.length - 1).setFontWeight('bold').setBackground('#1F4466').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  const ult = Math.max(sh.getMaxRows(), 2);
  sh.getRange(2, COL_LEG, ult - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(2, COL_LEG + 2, ult - 1, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, COL_LEG + 4, ult - 1, 2).setNumberFormat('#,##0');
  sh.getRange(2, COL_LEG, ult - 1, LEGIVEL.length).setVerticalAlignment('top').setWrap(true);
  [160, 140, 110, 210, 180, 150, 210, 260, 170].forEach((w, i) => sh.setColumnWidth(COL_LEG + i, w));
  sh.setColumnWidth(COL.embarcacao + 1, 170); sh.setColumnWidth(COL.om + 1, 90); sh.setColumnWidth(COL.usuario + 1, 110);
  // colunas técnicas (o painel usa) ficam ocultas; para vê-las: selecione as colunas vizinhas > botão direito > Reexibir
  ['id', 'tipo', 'salvoEm', 'leituraEm', 'json', 'pdfFileId', 'paginasFileId', 'atualizadoEm', 'excluido'].forEach(n => { try { sh.hideColumns(COL[n] + 1); } catch (e) { } });
}

/* RODE UMA VEZ (função "corrigirPlanilha" > Executar): arruma as linhas que já existem */
function corrigirPlanilha() {
  const props = PropertiesService.getScriptProperties();
  const sh = aba_(props);
  ajustarAba_(sh);
  const n = sh.getLastRow();
  if (n < 2) { Logger.log('Planilha sem registros. Cabeçalho e formatos aplicados.'); return; }
  const dados = linhas_(sh), saida = [];
  dados.forEach(l => {
    let r = null; try { r = JSON.parse(l[COL.json]); } catch (e) { }
    saida.push(r ? legiveis_(r, l[COL.pdfFileId]) : ['', '', '', '', '', '', '', '', '']);
  });
  sh.getRange(2, COL_LEG, saida.length, LEGIVEL.length).setValues(saida);
  Logger.log('Pronto: ' + saida.length + ' linha(s) arrumada(s).');
}
