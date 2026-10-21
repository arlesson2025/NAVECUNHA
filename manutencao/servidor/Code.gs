/**
 * SGMF · SISTEMA DE GESTÃO DA MANUTENÇÃO DA FROTA · NAVECUNHA  —  SERVIDOR (Google Apps Script)
 * ---------------------------------------------------------------------------
 * Sistema único de manutenção e lubrificação (o CTLE_LUB foi incorporado).
 * Guarda as OMs (Anexo II-A e II-B), horímetros, últimos serviços, testes de
 * compressão, trocas de óleo (FR 049_B) e complementos numa Planilha Google
 * (aba "Registros") e os PDFs (Anexo II e FR 049_B) numa pasta do Google Drive,
 * com uma subpasta por embarcação.
 *
 * COMO USAR (o passo a passo completo está no GUIA_IMPLANTACAO.md):
 *  1) Crie uma Planilha Google NOVA (não use a do CTLE_LUB) → Extensões → Apps Script.
 *  2) Apague o que estiver lá, cole TODO este arquivo e salve.
 *  3) Escolha a função "configurar" e clique em Executar (autorize quando pedir).
 *  4) Implantar → Nova implantação → tipo "App da Web":
 *        Executar como: Eu     |     Quem pode acessar: Qualquer pessoa
 *  5) Copie o endereço que termina em /exec e cole no SGMF em Administração → Nuvem.
 *
 * SENHAS INICIAIS (troque pelo painel, em Administração):
 *    analista (operador): <<SENHA_INICIAL_ANALISTA>>      supervisor (administrador): <<SENHA_INICIAL_SUPERVISOR>>
 *    [cópia do repositório público: as senhas reais foram trocadas por marcadores — ver manutencao/servidor/README.md]
 */

const VERSAO = 10;   // v10: FR 027_L de chegada/saída (fr027) com PDF no Drive · v9: registro de saída da viagem (saida) · v8: cronograma anual aprovado (crono) · v7: leitura de horímetro pendente de confirmação (horp) · v6: laudo de óleo, peças críticas e fotos das OMs no Drive · v5: biblioteca (arquivos no Drive), terceirizados e treinamentos · v4: lubrificação (FR 049_B e complementos de óleo) · v3: MCP central (monomotor) e MCA 3 · v2: teste de compressão, data-limite do CSN e medida de mitigação
const NOME_PASTA = 'Controle de Manutenção - PDFs';
const ABA = 'Registros';
const CABECALHO = ['id', 'tipo', 'salvoEm', 'leituraEm', 'embarcacao', 'om', 'usuario', 'json', 'pdfFileId', 'paginasFileId', 'atualizadoEm', 'excluido'];
const COL = {}; CABECALHO.forEach((c, i) => COL[c] = i);
/* Colunas LEGÍVEIS (a partir da M): o que você lê na planilha. As colunas A–L são técnicas (o app usa) e ficam ocultas. */
const LEGIVEL = ['Atualizado em', 'Registro', 'Nº da OM', 'Tipo', 'Embarcação', 'Posição', 'Itens do Anexo I / falha', 'Classe', 'Situação', 'Horímetro (h)', 'Data', 'RNC', 'Aprovado por', 'PDF (Anexo II ou FR 049_B)', 'Medida de mitigação', 'Responsável', 'Prazo', 'Situação da medida'];
const TIPOS = ['om', 'hor', 'horp', 'base', 'snap', 'comp', 'doclim', 'lub', 'doc', 'terc', 'trein', 'laudo', 'peca', 'crono', 'saida', 'fr027'];   // fr027 = check-list de chegada/saída no terminal (FR 027_L), PDF na pasta do empurrador   // saida = registro de saída da viagem (situação técnica congelada, justificativa e quem autorizou)   // crono = cronograma anual aprovado pelo Supervisor (linha de base)   // laudo = análise de óleo do MCP · peca = peças críticas (Anexo III)   // doc = biblioteca · terc = terceirizados · trein = treinamentos   // lub = troca de óleo (FR 049_B) ou complemento de óleo   // comp = teste de compressão · doclim = data-limite da vistoria em seco (CSN)
const COL_LEG = CABECALHO.length + 1;
const LIMITE_B64 = 14 * 1024 * 1024;
const POSN = { BB: 'Bombordo', BE: 'Boreste', CE: 'Central', MCA1: 'MCA 1', MCA2: 'MCA 2', MCA3: 'MCA 3', UN: 'Embarcação', POPA: 'Motor de popa', MB5: 'Motobomba 5 HP', MBINC: 'Motobomba de incêndio' };
const ETAPA = { emitida: 'Emitida', abordo: 'A bordo', executada: 'Executada', conferencia: 'Em conferência', encerrada: 'Encerrada', aberta: 'Aberta', execucao: 'Em execução' };

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
  if (!props.getProperty('OP_HASH')) props.setProperty('OP_HASH', hashSenha_(salt, '<<SENHA_INICIAL_ANALISTA>>'));
  if (!props.getProperty('AD_HASH')) props.setProperty('AD_HASH', hashSenha_(salt, '<<SENHA_INICIAL_SUPERVISOR>>'));
  if (!props.getProperty('FOLDER_ID')) props.setProperty('FOLDER_ID', DriveApp.createFolder(NOME_PASTA).getId());
  if (!props.getProperty('PUBLIC_READ')) props.setProperty('PUBLIC_READ', 'false');   // 'true' = qualquer pessoa com o link vê os dados sem login
  Logger.log('Pronto. Agora faça: Implantar → Nova implantação → App da Web.');
}

/* ============================ ENTRADA ============================ */
function doGet() { return json_({ ok: true, app: 'ctle_man', versao: VERSAO }); }
function doPost(e) {
  let out;
  try { out = tratar_(JSON.parse(e.postData.contents)); }
  catch (err) { out = { ok: false, error: 'erro: ' + (err && err.message ? err.message : err) }; }
  return json_(out);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ============================ ROTEADOR ============================ */
function tratar_(req) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SALT')) return { ok: false, error: 'nao_configurado' };
  switch (req.action) {
    case 'ping': return { ok: true, versao: VERSAO };
    case 'login': return login_(req, props);
    case 'list': return listar_(req, props);
    case 'push': return comLock_(() => gravar_(req, props));
    case 'getFile': return obterArquivo_(req, props);
    case 'foto': return salvarFoto_(req, props);
    case 'delete': return comLock_(() => excluir_(req, props));
    case 'setConfig': return comLock_(() => salvarConfig_(req, props));
    case 'setPasswords': return comLock_(() => trocarSenhas_(req, props));
    default: return { ok: false, error: 'acao_desconhecida' };
  }
}
function comLock_(fn) { const lock = LockService.getScriptLock(); lock.waitLock(30000); try { return fn(); } finally { lock.releaseLock(); } }

/* ============================ SENHAS / SESSÃO ============================ */
function hashSenha_(salt, senha) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + senha, Utilities.Charset.UTF_8);
  return bytes.map(b => ((b < 0 ? b + 256 : b)).toString(16).padStart(2, '0')).join('');
}
function login_(req, props) {
  const nome = String(req.name || '').trim();
  const h = hashSenha_(props.getProperty('SALT'), String(req.password || ''));
  let papel = null;
  if (h === props.getProperty('AD_HASH')) papel = 'admin';
  else if (h === props.getProperty('OP_HASH')) papel = 'op';
  if (!nome || !papel) { Utilities.sleep(1500); return { ok: false, error: 'senha' }; }
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('t_' + token, JSON.stringify({ name: nome, role: papel }), 21600);   // 6 h
  return { ok: true, token: token, role: papel };
}
function sessao_(req) { if (!req.token) return null; const v = CacheService.getScriptCache().get('t_' + req.token); return v ? JSON.parse(v) : null; }

/* ============================ PLANILHA ============================ */
function aba_(props) { return SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName(ABA); }
function linhas_(sh) { const n = sh.getLastRow(); if (n < 2) return []; return sh.getRange(2, 1, n - 1, CABECALHO.length).getValues(); }

/* ============================ LISTAR ============================ */
function listar_(req, props) {
  const s = sessao_(req);
  if (!s && props.getProperty('PUBLIC_READ') !== 'true') return { ok: false, error: 'auth' };
  const desde = Number(req.since || 0), registros = [], excluidos = [];
  linhas_(aba_(props)).forEach(l => {
    if (Number(l[COL.atualizadoEm]) < desde) return;
    if (l[COL.excluido] === true || l[COL.excluido] === 'TRUE') { excluidos.push(l[COL.id]); return; }
    let r; try { r = JSON.parse(l[COL.json]); } catch (e) { return; }
    r.pdfFileId = l[COL.pdfFileId] || null;
    registros.push(r);
  });
  const cfgTxt = props.getProperty('CFG');
  return { ok: true, records: registros, deleted: excluidos, now: Date.now(), cfg: cfgTxt ? JSON.parse(cfgTxt) : null, cfgAt: Number(props.getProperty('CFG_AT') || 0) };
}

/* ============================ GRAVAR (cria ou atualiza) ============================ */
function gravar_(req, props) {
  const s = sessao_(req);
  if (!s) return { ok: false, error: 'auth' };
  const r = req.record;
  if (!r || !r.id || TIPOS.indexOf(r.kind) < 0) return { ok: false, error: 'registro_invalido' };
  if (r.kind === 'om' && r.status === 'encerrada' && s.role !== 'admin') {
    // só o Supervisor encerra; o Analista não pode aprovar
    const ant = linhas_(aba_(props)).find(l => l[COL.id] === r.id);
    let antSt = null; try { antSt = ant ? JSON.parse(ant[COL.json]).status : null; } catch (e) { }
    if (antSt !== 'encerrada') return { ok: false, error: 'somente_supervisor' };
  }
  const sh = aba_(props), dados = linhas_(sh);
  const idx = dados.findIndex(l => l[COL.id] === r.id);
  let pdfId = idx >= 0 ? (dados[idx][COL.pdfFileId] || '') : '';
  if (idx >= 0) {
    let atual = null; try { atual = JSON.parse(dados[idx][COL.json]); } catch (e) { }
    if (atual && Number(atual.updatedAt || 0) > Number(r.updatedAt || 0)) { atual.pdfFileId = pdfId || null; return { ok: false, error: 'conflito', record: atual }; }
  }
  if (req.pdfB64) {
    if (req.pdfB64.length > LIMITE_B64) return { ok: false, error: 'pdf_grande_demais' };
    const ehDoc = r.kind === 'doc';
    const nomeV = ehDoc ? '' : r.kind === 'lub' && !r.vessel ? String(r.vNome || 'Sem embarcacao') : nomeEmbarcacao_(props, r.vessel);
    const pasta = ehDoc ? pastaBiblioteca_(props, r.cat) : pastaDaEmbarcacao_(props, nomeV);
    const base = r.kind === 'fr027' ? nomeSeguro_(nomeV + '_FR027L_' + (r.mov === 'saida' ? 'Saida' : 'Chegada') + '_' + String(r.date || '').slice(0, 10) + '_' + String(r.hora || '').replace(':', 'h')) : r.kind === 'lub' ? nomeSeguro_(nomeV + '_OM' + (r.om || 'sem') + '_FR049B_' + String(r.date || '').slice(0, 10)) : nomeSeguro_(nomeV + '_OM' + (r.num || 'sem') + '_' + (r.tipo === 'C' ? 'II-A' : 'II-B') + '_' + String(r.dreal || r.liberacao || r.abertura || '').slice(0, 10));
    if (pdfId) { try { DriveApp.getFileById(pdfId).setTrashed(true); } catch (e) { } }
    pdfId = ehDoc ? pasta.createFile(Utilities.newBlob(Utilities.base64Decode(req.pdfB64), r.mime || 'application/octet-stream', nomeSeguro_(r.fileName || r.titulo || 'documento'))).getId()
                  : pasta.createFile(Utilities.newBlob(Utilities.base64Decode(req.pdfB64), 'application/pdf', base + '.pdf')).getId();
  }
  const limpo = Object.assign({}, r); delete limpo.pdfFileId;
  const agora = Date.now();
  const linha = [r.id, r.kind, r.createdAt || agora, r.updatedAt || agora, r.vessel || '', r.num || '', s.name, JSON.stringify(limpo), pdfId, '', agora, !!r.excluido];
  let n;
  if (idx >= 0) { n = idx + 2; sh.getRange(n, 1, 1, CABECALHO.length).setValues([linha]); }
  else { sh.appendRow(linha); n = sh.getLastRow(); }
  try { sh.getRange(n, COL_LEG, 1, LEGIVEL.length).setValues([legiveis_(r, pdfId, props)]); } catch (e) { }
  return { ok: true, pdfFileId: pdfId || null };
}
function nomeSeguro_(t) { return String(t).replace(/[^\w\-.]+/g, '_').slice(0, 120); }
function nomeEmbarcacao_(props, id) {
  try { const c = JSON.parse(props.getProperty('CFG') || '{}'); const v = (c.frota || []).find(x => x.id === id); if (v) return v.nome; } catch (e) { }
  const padrao = ['CJA I', 'CJA II', 'CJA X', 'CJA XIII', 'CJA XIV', 'CJA XV', 'CJA XVI', 'CJA XVII', 'CJA XVIII', 'CJA XIX', 'CJA XX', 'CJA XXI'];
  const m = String(id || '').match(/^v(\d+)$/); return m && padrao[+m[1] - 1] ? padrao[+m[1] - 1] : (id || 'Sem embarcacao');
}
const BIB_PASTAS = { fluxo: 'Fluxogramas e mapas mentais', manual: 'Manuais e catálogos', sgi: 'Procedimentos e formulários', sesmt: 'SESMT', norma: 'Normas e NRs', outros: 'Outros' };
function pastaBiblioteca_(props, cat) { const raiz = DriveApp.getFolderById(props.getProperty('FOLDER_ID')); let it = raiz.getFoldersByName('Biblioteca'); const bib = it.hasNext() ? it.next() : raiz.createFolder('Biblioteca'); const nome = BIB_PASTAS[cat] || 'Outros'; it = bib.getFoldersByName(nome); return it.hasNext() ? it.next() : bib.createFolder(nome); }
function pastaDaEmbarcacao_(props, nome) { const raiz = DriveApp.getFolderById(props.getProperty('FOLDER_ID')); const it = raiz.getFoldersByName(nome); return it.hasNext() ? it.next() : raiz.createFolder(nome); }

/* ============================ BAIXAR PDF ============================ */
function obterArquivo_(req, props) {
  const s = sessao_(req);
  if (!s && props.getProperty('PUBLIC_READ') !== 'true') return { ok: false, error: 'auth' };
  if (!req.fileId) return { ok: false, error: 'sem_arquivo' };
  const ok = linhas_(aba_(props)).some(l => l[COL.pdfFileId] === req.fileId) || ehFoto_(req.fileId, props);   // só arquivos de registros do CTLE_MAN ou fotos das OMs
  if (!ok) return { ok: false, error: 'arquivo_invalido' };
  const blob = DriveApp.getFileById(req.fileId).getBlob();
  return { ok: true, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/* ============================ FOTOS DAS OMs (pasta <embarcação>/Fotos) ============================ */
function salvarFoto_(req, props) {
  const s = sessao_(req);
  if (!s) return { ok: false, error: 'auth' };
  if (!req.b64) return { ok: false, error: 'sem_foto' };
  if (req.b64.length > LIMITE_B64) return { ok: false, error: 'foto_grande_demais' };
  const pv = pastaDaEmbarcacao_(props, nomeEmbarcacao_(props, req.vessel));
  const it = pv.getFoldersByName('Fotos'), pf = it.hasNext() ? it.next() : pv.createFolder('Fotos');
  const f = pf.createFile(Utilities.newBlob(Utilities.base64Decode(req.b64), 'image/jpeg', nomeSeguro_(req.nome || req.recId || 'foto') + '.jpg'));
  return { ok: true, fileId: f.getId() };
}
function ehFoto_(fileId, props) {   // a foto precisa estar em <raiz>/<embarcação>/Fotos
  try {
    const raiz = props.getProperty('FOLDER_ID'), ps = DriveApp.getFileById(fileId).getParents();
    while (ps.hasNext()) { const p = ps.next(); if (p.getName() !== 'Fotos') continue; const pp = p.getParents(); while (pp.hasNext()) { const v = pp.next().getParents(); while (v.hasNext()) if (v.next().getId() === raiz) return true; } }
  } catch (e) { }
  return false;
}

/* ============================ EXCLUIR (só Supervisor) ============================ */
function excluir_(req, props) {
  const s = sessao_(req);
  if (!s || s.role !== 'admin') return { ok: false, error: 'auth' };
  const sh = aba_(props), n = sh.getLastRow();
  if (n < 2) return { ok: false, error: 'nao_encontrado' };
  const ids = sh.getRange(2, COL.id + 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === req.id) {
      const linha = i + 2, f = sh.getRange(linha, COL.pdfFileId + 1).getValue();
      if (f) { try { DriveApp.getFileById(f).setTrashed(true); } catch (e) { } }
      sh.getRange(linha, COL.atualizadoEm + 1).setValue(Date.now());
      sh.getRange(linha, COL.excluido + 1).setValue(true);
      return { ok: true };
    }
  }
  return { ok: false, error: 'nao_encontrado' };
}

/* ============================ CONFIGURAÇÃO COMPARTILHADA (frota e intervalos) ============================ */
function salvarConfig_(req, props) {
  const s = sessao_(req);
  if (!s || s.role !== 'admin') return { ok: false, error: 'auth' };
  const c = req.cfg || {}, permitido = {};
  ['frota', 'intervalos', 'viagemH', 'revExemplo'].forEach(k => { if (c[k] !== undefined) permitido[k] = c[k]; });
  const antigo = props.getProperty('CFG') ? JSON.parse(props.getProperty('CFG')) : {};
  const novo = JSON.stringify(Object.assign(antigo, permitido));
  if (novo.length > 8800) return { ok: false, error: 'configuracao_grande_demais' };
  const agora = Date.now();
  props.setProperty('CFG', novo); props.setProperty('CFG_AT', String(agora));
  return { ok: true, cfgAt: agora };
}

/* ============================ TROCAR SENHAS (só Supervisor) ============================ */
function trocarSenhas_(req, props) {
  const s = sessao_(req);
  if (!s || s.role !== 'admin') return { ok: false, error: 'auth' };
  const salt = props.getProperty('SALT');
  if (req.op) { if (String(req.op).length < 6) return { ok: false, error: 'senha_curta' }; props.setProperty('OP_HASH', hashSenha_(salt, String(req.op))); }
  if (req.ad) { if (String(req.ad).length < 6) return { ok: false, error: 'senha_curta' }; props.setProperty('AD_HASH', hashSenha_(salt, String(req.ad))); }
  return { ok: true };
}

/* ============================ PLANILHA LEGÍVEL ============================ */
function dataLocal_(v) { if (!v) return ''; if (typeof v === 'number') return new Date(v); const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); return m ? new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 12, m[5] ? +m[5] : 0) : ''; }
function legiveis_(r, pdfId, props) {
  const nomeV = nomeEmbarcacao_(props, r.vessel), pos = POSN[r.pos] || r.pos || '';
  const pdf = pdfId ? '=HYPERLINK("https://drive.google.com/file/d/' + pdfId + '/view","📄 Abrir PDF")' : '';
  const vazio4 = ['', '', '', ''];
  if (r.kind === 'hor') return [new Date(r.updatedAt || Date.now()), 'Horímetro', '', '', nomeV, pos, '', '', '', r.h, dataLocal_(r.date), '', '', ''].concat(vazio4);
  if (r.kind === 'base') return [new Date(r.updatedAt || Date.now()), 'Último serviço (ponto de partida)', '', '', nomeV, pos, r.item || '', '', '', r.h === null ? '' : r.h, dataLocal_(r.date), '', '', ''].concat(vazio4);
  if (r.kind === 'snap') return [new Date(r.updatedAt || Date.now()), 'Backlog (apuração)', '', '', '', '', '', '', String(r.v) + '%', '', dataLocal_(r.date), '', '', ''].concat(vazio4);
  if (r.kind === 'comp') {
    const v = (r.vals || []).map(x => parseFloat(String(x).replace(',', '.'))), ok = v.filter(x => !isNaN(x)), min = ok.length ? Math.min.apply(null, ok) : null;
    const cil = v.map((x, i) => 'cil.' + (i + 1) + ' ' + (isNaN(x) ? '—' : String(x.toFixed(2)).replace('.', ','))).join(' · ');
    return [new Date(r.updatedAt || Date.now()), 'Teste de compressão (MPa)', '', '1.1.12 / 1.1.28', nomeV, pos, cil + (r.rpm ? ' · ' + r.rpm + ' rpm' : ''), '', min == null ? '' : 'Pior: ' + String(min.toFixed(2)).replace('.', ',') + ' MPa' + (min < 1.27 ? ' · ABAIXO DO LIMITE' : min < 1.45 ? ' · atenção' : ''), r.h === null || r.h === undefined ? '' : r.h, dataLocal_(r.date), '', r.by || '', ''].concat(vazio4);
  }
  if (r.kind === 'lub') {
    const nomeL = r.vessel ? nomeV : String(r.vNome || '');
    if (r.tipo === 'comp') return [new Date(r.updatedAt || Date.now()), 'Complemento de óleo', '', String(r.key || '').replace(/\d$/, '').toUpperCase(), nomeL, pos, (r.oleo || '') + (r.obs ? ' · ' + r.obs : ''), '', String(r.L || '').replace('.', ',') + ' L', r.hr == null ? '' : r.hr, dataLocal_(r.date), '', r.by || '', ''].concat(vazio4);
    const T = (r.eq || []).filter(q => q.status === 'T'), L = T.reduce((a, q) => a + (parseFloat(String(q.qtd || '').replace(/\./g, '').replace(',', '.')) || 0), 0);
    return [new Date(r.updatedAt || Date.now()), 'Troca de óleo (FR 049_B)', r.om || '', (r.local || '') + (r.localTx ? ' · ' + r.localTx : ''), nomeL, '', T.map(q => q.name + ': ' + (q.oil || '') + ' ' + (q.qtd || '') + ' L' + (q.lot ? ' (lote ' + q.lot + (q.val ? ', val. ' + q.val : '') + ')' : '')).join(' · '), '', String(Math.round(L * 10) / 10).replace('.', ',') + ' L · óleo queimado ' + ((r.residuos || {}).oleo || '0') + ' L' + ((r.residuos || {}).fr016 ? ' · FR 016_E ' + r.residuos.fr016 : ''), T.length && T[0].hr != null ? T[0].hr : '', dataLocal_(r.date), '', ((r.nomes || {}).exe || '') + (r.by ? ' / ' + r.by : ''), pdf].concat(vazio4);
  }
  if (r.kind === 'doc') return [new Date(r.updatedAt || Date.now()), 'Biblioteca: ' + (BIB_PASTAS[r.cat] || r.cat || ''), '', r.equip || 'Geral', '', '', r.titulo + (r.desc ? ' · ' + r.desc : ''), r.rev || '', r.validade ? 'Validade ' + r.validade : '', '', dataLocal_(r.updatedAt), '', r.by || '', pdf || (r.url ? '=HYPERLINK("' + String(r.url).replace(/"/g, '') + '","🔗 Abrir link")' : '')].concat(vazio4);
  if (r.kind === 'terc') return [new Date(r.updatedAt || Date.now()), 'Terceirizado', '', (r.servicos || []).join(', '), '', '', r.empresa + (r.cnpj ? ' · CNPJ ' + r.cnpj : '') + (r.contato ? ' · ' + r.contato : '') + (r.fone ? ' · ' + r.fone : '') + (r.email ? ' · ' + r.email : ''), r.nota ? r.nota + '/5' : '', r.obs || '', '', dataLocal_(r.validade), '', r.by || '', ''].concat(vazio4);
  if (r.kind === 'trein') return [new Date(r.updatedAt || Date.now()), 'Treinamento', '', ({ integ: 'Integração', recic: 'Reciclagem anual', posf: 'Pós-falha', nr: 'NR / curso' })[r.tipo] || r.tipo, r.barco || '', r.funcao || '', r.pessoa + (r.tema ? ' · ' + r.tema : ''), '', r.validade ? 'Validade ' + r.validade : '', r.horas || '', dataLocal_(r.data), '', r.ministrante || '', r.url ? '=HYPERLINK("' + String(r.url).replace(/"/g, '') + '","🔗 Evidência")' : ''].concat(vazio4);
  if (r.kind === 'laudo') { const v = r.vals || {}; return [new Date(r.updatedAt || Date.now()), 'Laudo de óleo do MCP', '', '1.1.29', nomeV, pos, ['fe', 'cr', 'al', 'cu', 'pb', 'si', 'na', 'agua', 'comb', 'fuligem', 'tbn', 'visc'].filter(k => v[k] !== undefined && v[k] !== '').map(k => k.toUpperCase() + ' ' + v[k]).join(' · '), '', (r.lab || '') + (r.num ? ' nº ' + r.num : ''), r.h || '', dataLocal_(r.date), '', r.by || '', r.url ? '=HYPERLINK("' + r.url + '","📄 Laudo")' : ''].concat(vazio4); }
  if (r.kind === 'peca') return [new Date(r.updatedAt || Date.now()), 'Peça crítica (Anexo III)', '', r.equip || '', '', '', r.nome + (r.cod ? ' · ' + r.cod : '') + (r.forn ? ' · ' + r.forn : ''), '', 'Estoque ' + (r.estoque || 0) + ' / mín. ' + (r.minimo || 1), '', '', '', r.by || '', ''].concat(vazio4);
  if (r.kind === 'fr027') { const N = r.nc || [], sem = N.filter(x => !/^\d{3,}$/.test(x.o || '')).length, L = { ok: 'Liberado', rest: 'Liberado com restrição', nao: 'NÃO LIBERADO' }; return [new Date(r.updatedAt || Date.now()), 'FR 027_L · ' + (r.mov === 'saida' ? 'Saída' : 'Chegada'), N.map(x => x.o).filter(Boolean).join(', '), L[r.lib] || '', nomeV, '', N.length ? N.map(x => x.lab + ': ' + x.d + ' [' + x.c + ']' + (x.o ? ' OM ' + x.o : ' sem OM')).join(' · ') : 'Nenhum item NO', '', (L[r.lib] || '') + (sem ? ' · ' + sem + ' NO sem OM' : ''), Object.values(r.hor || {}).map(h => h.total).join(' / '), dataLocal_(r.date), '', (r.ass || []).map(a => a.func + ': ' + a.nome).join(' · '), pdf].concat(vazio4); }
  if (r.kind === 'saida') { const P = r.pend || [], C = r.corr || [], nv = P.filter(x => x.st === 'venc').length; return [new Date(r.updatedAt || Date.now()), 'Saída da viagem', '', r.sitTxt || '', nomeV, '', (nv ? nv + ' vencido(s) · ' : '') + (P.length - nv) + ' vence(m) na viagem · ' + C.length + ' corretiva(s) aberta(s)' + (r.just ? ' · Justificativa: ' + r.just : ''), '', r.sitTxt || '', r.hr && r.hr.h != null ? r.hr.h : '', dataLocal_(r.date), '', (r.autorizou ? 'Autorizou: ' + r.autorizou + ' · ' : '') + 'Registrou: ' + (r.by || ''), r.fotoId ? '=HYPERLINK("https://drive.google.com/file/d/' + r.fotoId + '/view","📷 FR 027_L de saída")' : ''].concat(vazio4); }
  if (r.kind === 'doclim') return [new Date(r.updatedAt || Date.now()), 'Data-limite vistoria em seco (CSN)', '', '9.1.5', nomeV, 'Embarcação', r.obs || '', '', '', '', dataLocal_(r.date), '', r.by || '', ''].concat(vazio4);
  const prev = r.tipo !== 'C';
  const tipo = prev ? ((r.items || []).some(i => i === '1.1.29' || i === '1.1.30') ? 'Preditiva (II-B)' : 'Preventiva (II-B)') : 'Corretiva (II-A)';
  return [new Date(r.updatedAt || Date.now()), 'Ordem de Manutenção', r.num || '', tipo, nomeV, pos, prev ? (r.items || []).join(', ') : (r.descricao || ''), prev ? '' : (r.classe || ''), ETAPA[r.status] || r.status || '', prev ? (r.hreal || '') : (r.horimetro || ''), dataLocal_(prev ? (r.dreal || r.emitAt) : (r.liberacao || r.abertura)), r.rnc || '', r.aprovBy || '', pdf, prev ? '' : (r.mitig || ''), prev ? '' : (r.mitigResp || ''), prev ? '' : dataLocal_(r.mitigPrazo), prev ? '' : (r.mitigSt || '')];
}
function ajustarAba_(sh) {
  sh.getRange(1, COL_LEG, 1, LEGIVEL.length).setValues([LEGIVEL]);
  sh.getRange(1, 1, 1, COL_LEG + LEGIVEL.length - 1).setFontWeight('bold').setBackground('#1F4466').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  const ult = Math.max(sh.getMaxRows(), 2);
  sh.getRange(2, COL_LEG, ult - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(2, COL_LEG + 10, ult - 1, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, COL_LEG + 9, ult - 1, 1).setNumberFormat('#,##0');
  sh.getRange(2, COL_LEG + 16, ult - 1, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, COL_LEG, ult - 1, LEGIVEL.length).setVerticalAlignment('top').setWrap(true);
  [130, 170, 80, 130, 110, 100, 260, 70, 110, 90, 90, 110, 120, 110, 260, 130, 90, 110].forEach((w, i) => sh.setColumnWidth(COL_LEG + i, w));
  ['id', 'tipo', 'salvoEm', 'leituraEm', 'embarcacao', 'om', 'usuario', 'json', 'pdfFileId', 'paginasFileId', 'atualizadoEm', 'excluido'].forEach(n => { try { sh.hideColumns(COL[n] + 1); } catch (e) { } });
}
/* RODE QUANDO QUISER (função "corrigirPlanilha" > Executar): refaz as colunas legíveis */
function corrigirPlanilha() {
  const props = PropertiesService.getScriptProperties(), sh = aba_(props);
  ajustarAba_(sh);
  const dados = linhas_(sh); if (!dados.length) return;
  const saida = dados.map(l => { let r = null; try { r = JSON.parse(l[COL.json]); } catch (e) { } return r ? legiveis_(r, l[COL.pdfFileId], props) : new Array(LEGIVEL.length).fill(''); });
  sh.getRange(2, COL_LEG, saida.length, LEGIVEL.length).setValues(saida);
}
