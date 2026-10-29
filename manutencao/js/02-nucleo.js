const LOGOS = { nav: 'img/logo-nav.png', vda: 'img/logo-vda.png' };   // logos em arquivo (antes iam em base64 dentro deste arquivo)
/* =====================================================================
   SMF · núcleo: dados, armazenamento, nuvem, login e cálculos
   ===================================================================== */
'use strict';
const VERSAO_APP = '3.52';   // a cada publicação: sobe a versão e acrescenta o que mudou em VERSOES (js/84)
const SISTEMAS = ['1.0 Sistema de Propulsão','2.0 Manobrabilidade e Governo','3.0 Geração Elétrica de Bordo','4.0 Resposta a Emergências','5.0 Salvaguarda e Flutuabilidade','6.0 Alimentação de Combustível','7.0 Sinalização e Comunicação','8.0 Fainas de Amarra e Carga','9.0 Casco e Estrutura','10.0 Habitabilidade','11.0 Auxílio à Navegação'];
const A1M = Object.fromEntries(A1.map(t => [t.id, t]));
// combate a incêndio no plano (NP 6.3 item 4; decisão do Supervisor, 24/10/2026): bombas elétricas em todos e, no CJA XX, também a motobomba do canhão;
// só o óleo do motor (4.1.3) fica fora: no CJA XX ele é o MCA 3, que já tem a troca controlada. Registros antigos continuam legíveis pelo A1M
for (let i = A1.length - 1; i >= 0; i--) if (A1[i].id === '4.1.3' || A1[i].id === '11.3.2') A1.splice(i, 1);   // 11.3.2 = motobomba de convés 5 HP: fora do plano de vez (Supervisor, 24/10/2026)
const REGN = { fr049:'Nº FR 049_B (troca de óleo/filtros)', fr016:'Nº FR 016_E (resíduos)', lote:'Lote e validade do lubrificante/fluido (5.9)', instr:'Nº do instrumento calibrado (5.9)', end:'Nº do laudo de END (5.9)', cert:'Certificado do material (5.9)', terc:'Relatório técnico do terceiro (5.8)', pt:'Nº da PT do SESMT (5.11.2)', desg:'Controle de desgaste NP 6.1 (novo / limite / medido)' };
const EQN = { MCP:'MCP Mitsubishi S6R2-MPTK2', FAE80:'Bomba FAE 80', ALTPE:'Alternador ponta de eixo', CXMAR:'Caixa de mar', HITACHI:'Reversor Hitachi Nico MGN91BL', MASSON:'Reversor Masson MM W3700', REINTJES:'Reversor REINTJES WAF 364', EIXO:'Eixo propulsor', HELICE:'Hélice', GOV:'Sistema de governo', MWM:'MCA MWM D229-4NA', YANMAR:'MCA Yanmar 4TNV98-GGE', FAE50:'Bomba FAE 50', BAMB30:'Alternador Bambozzi 30 kVA', QGD:'QGD, aterramento e motores elétricos', MBINC:'Sistema de combate a incêndio', PEMERG:'Parada de emergência do MCP', PORAO:'Sensores e bombas de porão', RACOR:'Filtros Racor e válvulas', TANQ:'Tanques de combustível', TRANSF:'Transferência de combustível', NAV:'Rádio VHF e luzes de navegação', SOM:'Sinalização sonora', AMARRA:'Guinchos, molinetes e cabos', CASCO:'Casco, convés e estanqueidade', HAB:'Acomodações, cozinha e sanitários', POPA:'Motor de popa Yamaha 15 HP', BOTE:'Bote de alumínio', MB5:'Motobomba 5 HP' };
const POSN = { BB:'Bombordo', BE:'Boreste', CE:'Central', MCA1:'MCA 1', MCA2:'MCA 2', MCA3:'MCA 3', UN:'Empurrador' };
const MCAS = ['MCA1', 'MCA2', 'MCA3'];
const isMcp = p => p === 'BB' || p === 'BE' || p === 'CE';
const fixP = (vid, pos) => { const v = vessel(vid); if (!v) return pos; if (isMcp(pos) && !mcpPos(v).includes(pos)) return mcpPos(v)[0]; if (MCAS.includes(pos) && !v.mca[pos]) return 'UN'; return pos; };
const optsPos = vid => { const v = vessel(vid); if (!v) return ''; return posicoes(v).map(p => `<option value="${p}"${p === 'UN' ? ' selected' : ''}>${p === 'UN' ? 'N/A (empurrador)' : isMcp(p) ? (p === 'CE' ? 'MCP central' : 'MCP ' + p) : posNome(v, p) + ' · ' + mcaNome(v, p)}</option>`).join(''); };
// modelos de MCA da frota → bloco do Anexo I (3.1 MWM / 3.2 Yanmar)
const MCA_MOD = { 'MWM D229-4NA': 'MWM', 'MWM D229-4': 'MWM', 'MWM D229-3T': 'MWM', 'MWM L229-4': 'MWM', 'Yanmar 4TNV98-GGE': 'YANMAR', 'Yanmar NSB18': 'YANMAR' };
// cadastro da frota conforme a Matriz técnica de equipamentos e lubrificação (17/10/2026)
const FROTA_MATRIZ = {
  'CJA I':     { mcp: 'bi',   mod: 'S6R2-T2MPTK',   rev: 'REINTJES', mca: [['MWM', 'Yanmar 4TNV98-GGE', 'Bombordo'], ['MWM', 'MWM L229-4', 'Boreste']] },
  'CJA II':    { mcp: 'bi',   mod: 'S6R-T2MPTK2',   rev: 'MASSON',   mca: [['', 'MWM D229-3T', 'Bombordo'], ['', 'MWM D229-3T', 'Boreste']] },
  'CJA X':     { mcp: 'mono', mod: 'S6R2-T2MPTK',   rev: 'REINTJES', mca: [['', 'Yanmar 4TNV98-GGE', 'Bombordo'], ['', 'Yanmar NSB18', 'Boreste']] },
  'CJA XIII':  { mcp: 'bi',   mod: 'S6R-T2MPTK2',   rev: 'MASSON',   mca: [['', 'MWM D229-3T', 'Bombordo'], ['', 'MWM D229-3T', 'Boreste']] },
  'CJA XIV':   { mcp: 'mono', mod: 'S6R2MPTK3',     rev: 'HITACHI',  mca: [['', 'MWM D229-4', 'Bombordo'], ['', 'MWM D229-4', 'Boreste']] },
  'CJA XV':    { mcp: 'mono', mod: 'S6R2MPTK3',     rev: 'HITACHI',  mca: [['', 'MWM D229-3T', 'Bombordo'], ['', 'MWM D229-4NA', 'Boreste']] },
  'CJA XVI':   { mcp: 'mono', mod: 'S6R2MPTK3',     rev: 'HITACHI',  mca: [['', 'MWM D229-4NA', 'Linha de centro'], ['', 'MWM L229-4', 'Boreste']] },
  'CJA XVII':  { mcp: 'mono', mod: 'S6R2-T2MPTK3M', rev: 'MASSON',   mca: [['', 'Yanmar 4TNV98-GGE', 'Linha de centro'], ['', 'MWM D229-4NA', 'Boreste']] },
  'CJA XVIII': { mcp: 'mono', mod: 'S6R2-T2MPTK3M', rev: 'HITACHI',  mca: [['', 'MWM D229-4NA', 'Bombordo'], ['', 'MWM D229-4NA', 'Boreste']] },
  'CJA XIX':   { mcp: 'bi',   mod: 'S6R2-T2MPTK3M', rev: 'HITACHI',  mca: [['', 'MWM D229-4NA', 'Bombordo'], ['', 'Yanmar 4TNV98-GGE', 'Boreste']] },
  'CJA XX':    { mcp: 'bi',   mod: 'S6R2-T2MPTK3M', rev: 'HITACHI',  mca: [['', 'Yanmar 4TNV98-GGE', 'Bombordo'], ['', 'Yanmar 4TNV98-GGE', 'Boreste'], ['', 'MWM D229-4', 'Linha de centro (canhão SCI)']] },
  'CJA XXI':   { mcp: 'bi',   mod: 'S6R-T2MPTK2',   rev: 'MASSON',   mca: [['', 'MWM D229-4', 'Bombordo'], ['', 'MWM D229-4', 'Boreste']] },
};
const mcpPos = v => v && v.mcp === 'mono' ? ['CE'] : ['BB', 'BE'];
const mpos = vid => mcpPos(vessel(vid))[0];
const mcaNome = (v, p) => (v.mcaMod && v.mcaMod[p]) || EQN[v.mca[p]] || p;
const posNome = (v, p) => p === 'CE' ? 'Central' : MCAS.includes(p) && v && v.mcaLoc && v.mcaLoc[p] ? POSN[p] + ' (' + v.mcaLoc[p] + ')' : POSN[p] || p;
// aplica o cadastro da matriz a um empurrador que ainda está no modelo antigo (sem o campo mcp)
function vesselDaMatriz(v) {
  const m = FROTA_MATRIZ[v.nome]; if (!m || v.mcp) return v;
  const ps = m.mcp === 'mono' ? ['CE'] : ['BB', 'BE'];
  v.mcp = m.mcp; v.rev = {}; v.mcpMod = {}; ps.forEach(p => { v.rev[p] = m.rev; v.mcpMod[p] = m.mod; });
  v.mca = {}; v.mcaMod = {}; v.mcaLoc = {}; m.mca.forEach((x, i) => { const k = MCAS[i]; v.mcaMod[k] = x[1]; v.mca[k] = MCA_MOD[x[1]]; v.mcaLoc[k] = x[2]; });
  v.off = v.off || []; return v;
}
const normFrota = cfg => { (cfg.frota || []).forEach(v => { if (!v.mcp) vesselDaMatriz(v); if (!v.mcp) { v.mcp = 'bi'; } v.rev = v.rev || {}; v.mca = v.mca || {}; }); return cfg; };
const CLASSES = { 'Crítica':{h:0, cor:'var(--bad)', fundo:'var(--badb)', prazo:'Imediato', acao:'Interdição + RNC'}, 'Alta':{h:4, cor:'var(--warn)', fundo:'var(--warnb)', prazo:'≤ 4 horas', acao:'Prioridade + RNC'}, 'Média':{h:48, cor:'var(--acc)', fundo:'#E3EEFA', prazo:'≤ 48 horas', acao:'Programação'}, 'Baixa':{h:360, cor:'var(--ok)', fundo:'var(--okb)', prazo:'≤ 15 dias', acao:'Rotina'} };
const FROTA_PADRAO = ['CJA I','CJA II','CJA X','CJA XIII','CJA XIV','CJA XV','CJA XVI','CJA XVII','CJA XVIII','CJA XIX','CJA XX','CJA XXI'];
const ETAPAS_P = [['emitida','Emitida'],['abordo','A bordo'],['executada','Executada'],['conferencia','Em conferência'],['encerrada','Encerrada']];
const ETAPAS_C = [['aberta','Aberta'],['execucao','Em execução'],['conferencia','Em conferência'],['encerrada','Encerrada']];

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const nf = (n, d = 0) => (n === null || n === undefined || n === '' || isNaN(n)) ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pad = n => String(n).padStart(2, '0');
const isoD = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const isoDT = d => isoD(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
const pD = s => { if (!s) return null; const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); return m ? new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 12, m[5] ? +m[5] : 0) : null; };
const brD = s => { const d = pD(s); return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : ''; };
const brDT = s => { const d = pD(s); return d ? brD(s) + (String(s).length > 10 ? ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : '') : ''; };
const addM = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
const hoje = () => new Date();
const uid = p => (p || 'r') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESESL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function toast(m, ms = 3200) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }

/* ---------- armazenamento local (IndexedDB) ---------- */
const DB = {
  db: null,
  open() { return new Promise((ok, no) => { const r = indexedDB.open('ctle_man', 1); r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('recs', { keyPath: 'id' }); d.createObjectStore('kv'); }; r.onsuccess = () => { this.db = r.result; ok(); }; r.onerror = () => no(r.error); }); },
  all() { return new Promise((ok, no) => { const q = this.db.transaction('recs').objectStore('recs').getAll(); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }); },
  put(r) { return new Promise((ok, no) => { const t = this.db.transaction('recs', 'readwrite'); t.objectStore('recs').put(r); t.oncomplete = ok; t.onerror = () => no(t.error); }); },
  putMany(rs) { return new Promise((ok, no) => { const t = this.db.transaction('recs', 'readwrite'); const s = t.objectStore('recs'); rs.forEach(r => s.put(r)); t.oncomplete = ok; t.onerror = () => no(t.error); }); },
  del(id) { return new Promise((ok, no) => { const t = this.db.transaction('recs', 'readwrite'); t.objectStore('recs').delete(id); t.oncomplete = ok; t.onerror = () => no(t.error); }); },
  get(k) { return new Promise((ok, no) => { const q = this.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }); },
  set(k, v) { return new Promise((ok, no) => { const t = this.db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = ok; t.onerror = () => no(t.error); }); },
};
let MEM = null; // armazenamento em memória se o navegador bloquear o IndexedDB

/* ---------- estado ---------- */
const S = {
  recs: new Map(),       // id -> registro
  cfg: null,             // frota, intervalos, viagem (compartilhado)
  url: '',               // endereço do Apps Script (/exec)
  session: null,         // {name, role, token}
  pending: new Set(),    // ids a enviar para a nuvem
  pdfPend: {},           // id -> base64 do PDF aguardando envio
  lastSync: 0, syncState: 'local', syncMsg: 'Modo local',
};
function cfgPadrao() {
  return { frota: FROTA_PADRAO.map((n, i) => vesselDaMatriz({ id: 'v' + (i + 1), nome: n, off: [] })), intervalos: {}, viagemH: 120, cfgAt: 0 };
}
const RECS_C = { m: null, v: -1, k: {} };   /* recs guardado por tipo até o Map mudar (set/delete/clear contam a versão) — a tela recalculava a frota varrendo todos os registros milhares de vezes */
const recs = kind => { const M = S.recs; if (!M.__tag) { M.__tag = 1; M.__v = 0; const s0 = M.set, d0 = M.delete, c0 = M.clear; M.set = function (k, v) { this.__v++; return s0.call(this, k, v); }; M.delete = function (k) { this.__v++; return d0.call(this, k); }; M.clear = function () { this.__v++; return c0.call(this); }; }
  if (RECS_C.m !== M || RECS_C.v !== M.__v) { RECS_C.m = M; RECS_C.v = M.__v; RECS_C.k = {}; } return (RECS_C.k[kind] || (RECS_C.k[kind] = [...M.values()].filter(r => r.kind === kind && !r.excluido))).slice(); };
const oms = () => recs('om');
const vessel = id => S.cfg.frota.find(v => v.id === id);
const vName = id => (vessel(id) || (typeof balsaDe === 'function' && balsaDe(id)) || { nome: id }).nome;   // balsas petroleiras (js/83) ficam fora de S.cfg.frota
async function saveRec(r, opts = {}) {
  r.updatedAt = Date.now();
  if (!r.createdAt) r.createdAt = r.updatedAt;
  S.recs.set(r.id, r);
  if (MEM) MEM.set(r.id, r); else await DB.put(r);
  if (!r.seed && !opts.localOnly) { S.pending.add(r.id); await kvSet('pending', [...S.pending]); }
  if (opts.pdfB64) { S.pdfPend[r.id] = opts.pdfB64; await kvSet('pdfPend', S.pdfPend); }
  scheduleSync();
  if (r.kind === 'om' && !r.seed && (r.fotos || []).some(f => f.src && !f.fid)) { clearTimeout(FOTO_T); FOTO_T = setTimeout(fotosEnviar, 4000); }   // foto nova da OM sobe ao Drive em poucos segundos
}
async function kvSet(k, v) { if (MEM) { MEM.set('kv:' + k, v); return; } try { await DB.set(k, v); } catch (e) { } }
async function kvGet(k) { if (MEM) return MEM.get('kv:' + k); try { return await DB.get(k); } catch (e) { return undefined; } }

/* ---------- senhas locais (modo sem nuvem) ---------- */
async function sha256(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

/* ---------- nuvem (Apps Script) ---------- */
async function api(action, body = {}) {
  if (!S.url) throw new Error('sem_nuvem');
  const res = await fetch(S.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action, token: S.session && S.session.token }, body)) });
  const j = await res.json();
  if (!j.ok && j.error === 'auth' && S.session) { S.session = null; await kvSet('session', null); renderUser(); }
  return j;
}
let syncTimer = null, syncing = false;
function scheduleSync(ms = 1500) { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, ms); }
function setSync(state, msg) { S.syncState = state; S.syncMsg = msg; const el = $('#sync'); if (el) { el.className = 'sync ' + state; el.querySelector('span').textContent = msg; } const m = $('#mSync'); if (m) m.textContent = msg; }
async function syncNow() {
  if (!S.url) { setSync('', S.pending.size ? 'Modo local · ' + S.pending.size + ' não enviados' : 'Modo local (sem nuvem)'); return; }
  if (syncing || !navigator.onLine) { if (!navigator.onLine) setSync('pend', 'Sem internet · ' + S.pending.size + ' na fila'); return; }
  syncing = true;
  try {
    // 1) envia o que está na fila
    if (S.session) {
      for (const id of [...S.pending]) {
        const r = S.recs.get(id); if (!r) { S.pending.delete(id); continue; }
        const j = await api('push', { record: stripForCloud(r), pdfB64: S.pdfPend[id] || null });
        if (j.ok) {
          S.pending.delete(id);
          if (j.pdfFileId) { r.pdfFileId = j.pdfFileId; S.recs.set(id, r); if (!MEM) await DB.put(r); }
          if (S.pdfPend[id]) { delete S.pdfPend[id]; await kvSet('pdfPend', S.pdfPend); }
        } else if (j.error === 'auth') break;
        else if (j.error === 'conflito' && j.record) { await mergeRemote([j.record]); S.pending.delete(id); }
      }
      await kvSet('pending', [...S.pending]);
    }
    // 2) recebe o que mudou
    const j = await api('list', { since: S.lastSync ? S.lastSync - 60000 : 0 });
    if (j.ok) {
      await mergeRemote(j.records || []);
      for (const id of j.deleted || []) { const r = S.recs.get(id); if (r) { S.recs.delete(id); if (!MEM) await DB.del(id); } }
      if (j.cfg && (j.cfgAt || 0) > (S.cfg.cfgAt || 0)) { S.cfg = normFrota(Object.assign(cfgPadrao(), j.cfg, { cfgAt: j.cfgAt })); await kvSet('cfg', S.cfg); }
      S.lastSync = j.now || Date.now(); await kvSet('lastSync', S.lastSync);
      setSync(S.pending.size ? 'pend' : 'ok', S.pending.size ? S.pending.size + ' aguardando envio' + (S.session ? '' : ' (entre para enviar)') : 'Sincronizado ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      rerender();
    } else setSync('err', j.error === 'auth' ? 'Entre para ver os dados' : 'Erro na nuvem: ' + j.error);
  } catch (e) { setSync('err', 'Sem conexão com a nuvem'); }
  finally { syncing = false; }
}
function stripForCloud(r) {
  const c = JSON.parse(JSON.stringify(r));
  if (r.fotos && c.fotos) c.fotos = r.fotos.map(f => ({ tipo: f.tipo, leg: f.leg, at: f.at, fid: f.fid || '' }));   // as fotos ficam no PDF ou no Drive (fid)
  if (r.fotosFid) c.fotosFid = r.fotosFid;
  delete c.fotosLocais; delete c.pages;   // fotos e folhas do FR 049_B ficam no PDF do Drive
  return c;
}
async function mergeRemote(list) {
  const put = [];
  list.forEach(r => { const cur = S.recs.get(r.id); if (cur && cur.fotosLocais && !r.fotosLocais) r.fotosLocais = cur.fotosLocais; if (cur && cur.pages && !r.pages) r.pages = cur.pages; });   // fotos e folhas do FR 049_B que só estão neste aparelho
  list.forEach(r => {
    const cur = S.recs.get(r.id);
    if (cur && (cur.updatedAt || 0) >= (r.updatedAt || 0)) return;
    if (cur && cur.fotos && r.fotos) r.fotos = r.fotos.map((f, i) => Object.assign({}, f, { src: (cur.fotos[i] || {}).src || '' }));   // mantém as fotos que já estão neste aparelho
    S.recs.set(r.id, r); put.push(r);
  });
  if (put.length && !MEM) await DB.putMany(put);
}

/* ---------- login ---------- */
const can = { edit: () => !!S.session, admin: () => S.session && S.session.role === 'admin' };
async function login(name, pw) {
  if (S.url) {
    const j = await api('login', { name, password: pw });
    if (!j.ok) return j.error === 'senha' ? 'Nome ou senha incorretos.' : 'Não foi possível entrar: ' + j.error;
    S.session = { name, role: j.role, token: j.token };
  } else {
    const h = await sha256('ctle_man|' + pw);
    // senhas iniciais do modo local (só valem até serem trocadas em Administração neste aparelho); guardadas como SHA-256, não em texto
    const ad = (await kvGet('ad_hash')) || '9fd0ab8c31f6972a212bf99923621c75026cfcbba4606460d8ab48d5316609e9';
    const op = (await kvGet('op_hash')) || '51c53cb14ca8246f38f0384d5966435b1fb8c88738bf3b86bd9676599b93db8b';
    const opr = await kvGet('opr_hash');   // perfil Operador: só existe depois de o Supervisor definir a senha em Administração
    if (!name.trim() || (h !== ad && h !== op && h !== opr)) return 'Nome ou senha incorretos.';
    S.session = { name: name.trim(), role: h === ad ? 'admin' : h === opr ? 'opr' : 'op', token: null };
  }
  await kvSet('session', S.session);
  scheduleSync(100);
  try { sessionStorage.setItem('sgmf_ok', '1'); } catch (er) { }
  return null;
}

/* =====================================================================
   CÁLCULOS: aplicabilidade, horímetros, vencimentos
   ===================================================================== */
// intervalos específicos de modelo (matriz técnica) quando o bloco do Anexo I é de outro modelo da mesma família
const MOD_IV = { 'Yanmar NSB18': { '3.2.9': { h: 100, m: 6 } } };
function intervalo(t, v, pos) { const md = v && pos && v.mcaMod && v.mcaMod[pos] && MOD_IV[v.mcaMod[pos]] && MOD_IV[v.mcaMod[pos]][t.id]; if (md) return { h: md.h, m: md.m }; const o = (S.cfg.intervalos || {})[t.id]; return { h: o && o.h !== undefined && o.h !== '' ? (o.h === null ? null : +o.h) : t.h, m: o && o.m !== undefined && o.m !== '' ? (o.m === null ? null : +o.m) : t.m }; }
function posicoes(v) { return mcpPos(v).concat(MCAS.filter(k => v.mca && v.mca[k]), ['UN']); }
function aplica(v, pos, t) {
  if ((v.off || []).includes(t.eq)) return false;
  if (t.scope === 'bordo') { if (!mcpPos(v).includes(pos)) return false; if (['HITACHI', 'MASSON', 'REINTJES'].includes(t.eq)) return v.rev[pos] === t.eq; return true; }
  if (t.scope === 'mca') { if (!MCAS.includes(pos) || !v.mca[pos]) return false; if (t.eq === 'MWM' || t.eq === 'YANMAR') return v.mca[pos] === t.eq; return pos === 'MCA1'; }
  return pos === 'UN';
}
function itensDe(v, pos) { return A1.filter(t => aplica(v, pos, t)); }
function posHor(pos, t, vid) { if (isMcp(pos) || MCAS.includes(pos)) return pos; return vid && vessel(vid) ? mpos(vid) : 'BB'; }   // motor de popa e motobomba não têm horímetro: contam pelo MCP (troca a cada saída)
function horAtual(vid, pos) {   // leitura real mais recente ou estimativa (MCA sem horímetro: por dia ou por estado cais/boia/viagem)
  const v = vessel(vid), e = horEst(v, pos);
  if (e && e.modo === 'estado') {
    const reais = recs('hor').filter(r => r.vessel === vid && r.pos === pos && !r.est && (!e.d0 || r.date >= e.d0)).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.h - b.h);
    const b = reais.pop(), base = b ? { h: b.h, ts: +pD(b.date) } : { h: +e.h0 || 0, ts: e.ts0 || +pD(e.d0 || isoD(hoje())) };
    return { vessel: vid, pos, h: Math.round(base.h + horasPorEstado(vid, base.ts, Date.now(), txMca(e))), date: isoD(hoje()), est: true, by: 'estimativa: viagem ' + nf(txMca(e).viagem, 0) + ' h/dia · boia ' + nf(txMca(e).boia, 0) + ' · cais ' + nf(txMca(e).cais, 0) }; }
  let best = null;
  recs('hor').forEach(r => { if (r.vessel === vid && r.pos === pos && (!best || r.date > best.date || (r.date === best.date && r.h > best.h))) best = r; });
  if (!e) return best;
  const base = best && (!e.d0 || best.date >= e.d0) ? { h: best.h, date: best.date } : { h: +e.h0 || 0, date: e.d0 || isoD(hoje()) };
  const dias = Math.max(0, Math.floor((hoje() - pD(base.date)) / 864e5));
  return { vessel: vid, pos, h: Math.round(base.h + e.hd * dias), date: isoD(hoje()), est: true, by: 'estimativa ' + nf(e.hd, 1) + ' h/dia' };
}
function horEm(vid, pos, date) { // último horímetro até a data
  let best = null; recs('hor').forEach(r => { if (r.vessel === vid && r.pos === pos && r.date <= date && (!best || r.date > best.date)) best = r; }); return best;
}
function ultimoServico(vid, pos, item) {   // num lugar só (24/10/2026): antes eram 5 camadas por cima
  let b = ultServBase(vid, pos, item); const v = vessel(vid), t = A1M[item];
  const oil = v && t ? compDe(v, pos, t) : null;   // item de 250 h que vai junto com a troca de óleo: vale a troca do FR 049_B
  if (oil) { const o = ultServBase(vid, pos, oil); if (o && String(o.src || '').startsWith('fr049') && (!b || o.date > b.date)) b = o; }
  oms().forEach(o => { if (o.tipo !== 'C' || o.status !== 'encerrada' || o.vessel !== vid || o.excluido) return; corrRefeitos(o).forEach(x => { if (x.pos === pos && x.id === item && (!b || x.date > b.date)) b = { h: x.h, date: x.date, src: 'corr:' + o.num }; }); });   // corretiva que refez o serviço
  return b;
}
function ultServBase(vid, pos, itemId) {
  let best = null;
  const cand = (h, date, src, x) => { if (date && (!best || date > best.date)) best = Object.assign({ h: h === '' || h === null || h === undefined ? null : +h, date, src }, x || {}); };
  // nf = não feito (modo enxuto): não reinicia o prazo · insp = inspecionado sem intervenção (SMF 3.32): conta como atendido e o próximo vencimento vai para prox (data) / proxH (horímetro), nunca além do intervalo normal
  recs('base').forEach(b => { if (b.vessel === vid && b.pos === pos && b.item === itemId && !b.nf && !b.excluido) cand(b.h, b.date, 'base', b.insp ? { insp: true, prox: b.prox || null, proxH: b.proxH != null && b.proxH !== '' ? +b.proxH : null, obs: b.obs || '', om: b.om || '' } : null); });
  oms().forEach(o => { if (o.tipo === 'P' && o.status === 'encerrada' && o.vessel === vid && o.pos === pos && (o.items || []).includes(itemId)) cand(o.hreal, o.dreal || isoD(new Date(o.fechadoAt || o.updatedAt)), 'om:' + o.num); });
  recs('lub').forEach(r => { if (r.tipo === 'fr049' && r.vessel === vid) (r.eq || []).forEach(q => { if (q.status === 'T' && q.pos === pos && (q.itens || []).includes(itemId)) cand(q.hr, r.date, 'fr049:' + r.om); }); });   // troca registrada no FR 049_B
  if (itemId === '1.1.29') recs('laudo').forEach(r => { if (r.vessel === vid && r.pos === pos && (!best || r.date > best.date)) best = { h: r.h != null && r.h !== '' ? +r.h : null, date: r.date, src: 'laudo:' + (r.num || '') }; });   // laudo de óleo do MCP
  if (best) return best;
  if (itemId === DOCA.item) return null;   // docagem não conta do marco zero
  const v = vessel(vid), m = v && v.marco; if (!m || !m.date) return null;   // marco zero da implantação
  const t = A1M[itemId], hp = t ? posHor(pos, t, vid) : pos; const h = m.h && m.h[hp] != null ? m.h[hp] : null; return { h, date: m.date, src: 'marco' };
}
function omAberta(vid, pos, itemId) { return oms().find(o => o.tipo === 'P' && o.status !== 'encerrada' && o.vessel === vid && o.pos === pos && (o.items || []).includes(itemId)); }
// situação de um item: venc | viag | ok | sem (sem histórico) | cond (por condição)
// próxima viagem: cada empurrador tem a sua (120 h a 1.500 h, conforme o trecho); sem informação, usa a viagem padrão
const viagemDe = v => (v && +v.viagH > 0) ? +v.viagH : S.cfg.viagemH;
// horas de MCP por dia do empurrador (últimos ~90 dias de horímetro BB); sem dados, 20 h/dia
let _hdMemo = { n: -1, m: {} };
function horasDia(vid) {
  if (_hdMemo.n !== S.recs.size) _hdMemo = { n: S.recs.size, m: {} };
  if (_hdMemo.m[vid] !== undefined) return _hdMemo.m[vid];
  const mp = vessel(vid) ? mpos(vid) : 'BB', L = recs('hor').filter(r => r.vessel === vid && r.pos === mp).sort((a, b) => a.date < b.date ? -1 : 1);
  let t = 20;
  if (L.length > 1) { const b = L[L.length - 1], lim = isoD(new Date(pD(b.date).getTime() - 90 * 864e5)); const a = L.find(r => r.date >= lim) || L[0]; const d = (pD(b.date) - pD(a.date)) / 864e5; if (d >= 7 && b.h > a.h) t = (b.h - a.h) / d; }
  return (_hdMemo.m[vid] = Math.max(4, Math.min(24, t)));
}
function situacao(v, pos, t, viagemH) {
  if (v && rotaUso(v) && (viagemH === undefined || viagemH === viagemDe(v))) viagemH = horasViagem(v, pos);   // horas da viagem pela rota escolhida
  const iv = intervalo(t, v, pos);
  if (t.kind !== 'prog' || (!iv.h && !iv.m)) return { st: 'cond', txt: t.kind === 'novo' ? 'Só para motor novo/revisado' : 'Por condição' };
  const hp = posHor(pos, t, v.id), hr = horAtual(v.id, hp), cur = hr ? hr.h : null;
  const L = ultimoServico(v.id, pos, t.id);
  if (!L) return { st: 'sem', txt: 'Sem último serviço registrado', cur, hp };
  // último serviço com horímetro acima da leitura atual (digitação, horímetro de outro motor ou horímetro trocado): a conta daria “faltam 9.600 h” e o item sumiria
  // do cronograma; fica “sem referência” com o aviso até ser corrigido em 1.1 Horímetros (SMF 3.28). Tolerância: serviço lançado depois da última leitura (dias × 24 h)
  if (iv.h && L.h !== null && L.h !== undefined && cur !== null && hr && !hr.est && L.h - cur > Math.max(24, ((pD(L.date) - pD(hr.date)) / 864e5) * 24 + 24))
    return { st: 'sem', inc: true, txt: `Horímetro inconsistente: serviço de ${brD(L.date)} com ${nf(L.h)} h, leitura atual ${nf(cur)} h`, cur, hp, L };
  viagemH = viagemH === undefined ? viagemDe(v) : viagemH;
  let st = 'ok', txt = [], alvoH = null, alvoD = null, rest = null;
  const ord = { ok: 0, viag: 1, venc: 2 }, up = s => { if (ord[s] > ord[st]) st = s; };
  if (iv.h && L.h !== null && cur !== null) {
    alvoH = L.insp && L.proxH != null ? L.proxH : L.h + iv.h; rest = alvoH - cur;
    txt.push(rest < 0 ? nf(-rest) + ' h vencido' : 'faltam ' + nf(rest) + ' h');
    up(rest < 0 ? 'venc' : rest <= viagemH ? 'viag' : 'ok');
  } else if (iv.h && cur === null) txt.push('sem horímetro');
  if (iv.m) {
    alvoD = L.insp && L.prox ? pD(L.prox) : addM(pD(L.date), iv.m); const dd = Math.round((alvoD - pD(isoD(hoje()))) / 864e5);
    txt.push(dd < 0 ? (-dd) + (dd === -1 ? ' dia vencido' : ' dias vencido') : 'vence ' + alvoD.toLocaleDateString('pt-BR'));
    up(dd < 0 ? 'venc' : dd <= Math.ceil(viagemH / horasDia(v.id)) ? 'viag' : 'ok');
  }
  return { st, txt: txt.join(' · '), alvoH, alvoD, rest, cur, L, hp };
}
function painelVessel(v, viagemH) {
  if (foraOp(v)) return [];
  const out = [];
  posicoes(v).forEach(pos => itensDe(v, pos).forEach(t => { if (t.kind === 'sup') return; out.push({ v, pos, t, s: situacao(v, pos, t, viagemH), om: omAberta(v.id, pos, t.id) }); }));
  return out;
}
function interditada(vid) { return oms().find(o => o.tipo === 'C' && o.vessel === vid && o.status !== 'encerrada' && o.classe === 'Crítica' && o.interd === 'Sim'); }
function bloqueioSaida(vid) { const v = vessel(vid); return painelVessel(v).filter(x => x.s.st === 'venc' && x.t.prio === 'Crítica' && !x.om); }

/* ---------- prazos e backlog ---------- */
function prazoCorretiva(o) { const c = CLASSES[o.classe]; if (!c || !o.abertura) return null; return new Date(pD(o.abertura).getTime() + c.h * 3600e3); }
function omAtrasada(o) {
  if (o.status === 'encerrada') return false;
  if (o.tipo === 'C') { if (o.inicio) return false; const p = prazoCorretiva(o); return p ? hoje() > p : false; }
  if (!['emitida', 'abordo'].includes(o.status)) return false;
  const v = vessel(o.vessel); if (!v) return false;
  const hr = horAtual(o.vessel, posHor(o.pos, A1M[(o.items || [])[0]], o.vessel));
  if (o.alvoH && hr && hr.h > o.alvoH) return true;
  if (o.alvoD && hoje() > pD(o.alvoD)) return true;
  return false;
}

/* =====================================================================
   INDICADORES (item 9 da NP 055)
   ===================================================================== */
const ehFalha = o => o.tipo === 'C' && (o.classe === 'Crítica' || o.classe === 'Alta');
function mesIni(y, m) { return new Date(y, m, 1); }
function indispHoras(ini, fim) {
  let h = 0;
  oms().forEach(o => {
    if (o.tipo === 'C' && o.interd === 'Sim' && o.interdDT) {
      const a = pD(o.interdDT), b = o.liberacao ? pD(o.liberacao) : hoje();
      const x = Math.max(a, ini), y = Math.min(b, fim); if (y > x) h += (y - x) / 3600e3;
    }
    if (o.tipo === 'P' && o.status === 'encerrada' && +o.indispH > 0) { const d = pD(o.dreal); if (d && d >= ini && d < fim) h += +o.indispH; }
  });
  return h;
}
function kpiDisp(y, m) { const ini = mesIni(y, m), fim0 = mesIni(y, m + 1), fim = fim0 > hoje() ? hoje() : fim0; if (fim <= ini) return null; const tot = S.cfg.frota.length * (fim - ini) / 3600e3; return Math.max(0, (tot - indispHoras(ini, fim)) / tot * 100); }
function horasOperacao(ini, fim) {
  let tot = 0;
  S.cfg.frota.forEach(v => { const mp = mcpPos(v)[0], a = horEm(v.id, mp, isoD(ini)), b = horEm(v.id, mp, isoD(fim)); if (b) { const a0 = a || recs('hor').filter(r => r.vessel === v.id && r.pos === mp).sort((p, q) => p.date < q.date ? -1 : 1)[0]; if (a0) tot += Math.max(0, b.h - a0.h); } });
  return tot;
}
function kpiMTBF(fimMes) { const ini = new Date(fimMes); ini.setFullYear(ini.getFullYear() - 1); const f = oms().filter(o => ehFalha(o) && o.abertura && pD(o.abertura) >= ini && pD(o.abertura) < fimMes).length; const h = horasOperacao(ini, fimMes); return { v: f ? h / f : null, h, f }; }
function kpiMTTR(y, m) { const ini = mesIni(y, m), fim = mesIni(y, m + 1); const l = oms().filter(o => ehFalha(o) && o.liberacao && pD(o.liberacao) >= ini && pD(o.liberacao) < fim && o.abertura); if (!l.length) return null; return l.reduce((s, o) => s + (pD(o.liberacao) - pD(o.abertura)) / 3600e3, 0) / l.length; }
function kpiBacklog() { const ab = oms().filter(o => o.status !== 'encerrada'); if (!ab.length) return { v: 0, n: 0, t: 0 }; const n = ab.filter(omAtrasada).length; return { v: n / ab.length * 100, n, t: ab.length }; }
function kpiFotos(ini, fim) { const l = oms().filter(o => o.status === 'encerrada' && o.fechadoAt && o.fechadoAt >= ini.getTime() && o.fechadoAt < fim.getTime()); if (!l.length) return null; return l.filter(o => (o.fotos || []).some(f => f.tipo === 'ANTES') && (o.fotos || []).some(f => f.tipo === 'DEPOIS')).length / l.length * 100; }
function trimestre(d) { return { y: d.getFullYear(), q: Math.floor(d.getMonth() / 3) }; }
// Plano preditivo (NP 055 revisada): tendência trimestral de cada MCP + amostra de óleo de cada MCP a cada 1.000 h (≈ 1 por trimestre)
// + ensaio de compressão registrado em cada OM de bicos (1.1.12) encerrada no trimestre
function kpiPreditivo(y, q) {
  const ini = new Date(y, q * 3, 1), fim = new Date(y, q * 3 + 3, 1), d = { tend: [0, 0], oleo: [0, 0], comp: [0, 0] };
  const enc = oms().filter(o => o.tipo === 'P' && o.status === 'encerrada' && o.dreal && pD(o.dreal) >= ini && pD(o.dreal) < fim);
  S.cfg.frota.forEach(v => mcpPos(v).forEach(pos => {
    if (!aplica(v, pos, A1M['1.1.30'])) return;
    d.tend[0]++; if (enc.some(o => o.vessel === v.id && o.pos === pos && (o.items || []).includes('1.1.30'))) d.tend[1]++;
    // amostra de óleo (1.1.29): a cada 1.000 h ≈ 1 por trimestre no uso médio da frota (~11 h/dia) · feita = laudo registrado ou OM com 1.1.29 encerrada no trimestre
    d.oleo[0]++; if (enc.some(o => o.vessel === v.id && o.pos === pos && (o.items || []).includes('1.1.29')) || recs('laudo').some(r => r.vessel === v.id && r.pos === pos && r.date && pD(r.date) >= ini && pD(r.date) < fim)) d.oleo[1]++;
  }));
  enc.filter(o => (o.items || []).includes('1.1.12')).forEach(o => { d.comp[0]++; const md = ((o.conf || {})['1.1.12'] || {}).meds || []; if ([1, 2, 3, 4, 5, 6].every(i => numBR((md[i] || {}).dei ?? (md[i] || {}).enc) != null)) d.comp[1]++; });
  recs('comp').forEach(r => { if (r.date && pD(r.date) >= ini && pD(r.date) < fim && !r.seed) { d.comp[0]++; d.comp[1]++; } });
  const prog = d.tend[0] + d.oleo[0] + d.comp[0], feito = d.tend[1] + d.oleo[1] + d.comp[1];
  return prog ? { v: feito / prog * 100, prog, feito, d } : null;
}
function serieMeses(n) { const out = [], d = hoje(); for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push({ y: x.getFullYear(), m: x.getMonth(), lab: MESES[x.getMonth()] }); } return out; }
function kpis() {
  const d = hoje(), ms = serieMeses(6);
  const disp = ms.map(x => kpiDisp(x.y, x.m)), mttr = ms.map(x => kpiMTTR(x.y, x.m));
  const mtbf = ms.map(x => { const f = mesIni(x.y, x.m + 1); return kpiMTBF(f > d ? d : f).v; });
  const fotos = ms.map(x => kpiFotos(mesIni(x.y, x.m), mesIni(x.y, x.m + 1)));
  const sem = new Date(d); sem.setDate(sem.getDate() - 7);
  const fotosSem = kpiFotos(sem, new Date(d.getTime() + 1));
  const qs = []; for (let i = 3; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i * 3, 1); const t = trimestre(x); qs.push({ y: t.y, q: t.q, lab: 'T' + (t.q + 1) + '/' + String(t.y).slice(2) }); }
  const pred = qs.map(x => { const r = kpiPreditivo(x.y, x.q); return r ? r.v : null; });
  const snaps = recs('snap').filter(s => !s.tipo).sort((a, b) => a.date < b.date ? -1 : 1).slice(-8);
  const bk = kpiBacklog();
  return { ms, disp, mttr, mtbf, fotos, fotosSem, qs, pred, snaps, bk, mtbfNow: kpiMTBF(d) };
}
async function snapshotBacklog() { const sg = new Date(hoje()); sg.setDate(sg.getDate() - (sg.getDay() + 6) % 7); const id = 'snap-' + isoD(sg); const b = kpiBacklog(); const cur = S.recs.get(id); if (cur) return; /* NP 055 item 9: backlog apurado na segunda-feira */ await saveRec({ id, kind: 'snap', date: isoD(sg), v: +b.v.toFixed(1), n: b.n, t: b.t, seed: cur && cur.seed }, { localOnly: !can.edit() }); }

/* =====================================================================
   SMF · dados de exemplo, interface comum, frota, emissão, acompanhamento
   ===================================================================== */

/* ---------- dados de exemplo (marcados seed:true, nunca vão para a nuvem) ---------- */
function rnd(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
function gerarExemplo() {
  const R = rnd(20261017), out = [], d0 = hoje(), DIAS = 190;
  const cfg = S.cfg; const revs = ['REINTJES', 'MASSON', 'HITACHI'];
  cfg.frota.forEach((v, i) => { const ps = mcpPos(v); if (ps.every(p => !v.rev[p])) { ps.forEach(p => v.rev[p] = revs[i % 3]); cfg.revExemplo = true; } });
  const rate = {};
  cfg.frota.forEach((v, i) => {
    rate[v.id] = { BB: 9 + (i % 4) * 1.6, BE: 8.6 + (i % 4) * 1.6, CE: 9.3 + (i % 4) * 1.6, MCA1: 7.5, MCA2: 5.5, MCA3: 2.5, POPA: .25 };
    const st = { BB: 2400 + i * 870, BE: 2380 + i * 866, CE: 2390 + i * 868, MCA1: 3100 + i * 640, MCA2: 2900 + i * 610, MCA3: 900 + i * 50, POPA: 120 + i * 9 };
    for (let k = DIAS; k >= 0; k -= 7) {
      const dt = new Date(d0); dt.setDate(dt.getDate() - k);
      Object.keys(st).forEach(p => { if (MCAS.includes(p) && !v.mca[p]) return; if (isMcp(p) && !mcpPos(v).includes(p)) return; const h = Math.round(st[p] + (DIAS - k) * rate[v.id][p]); out.push({ id: 'ex-hor-' + v.id + p + k, kind: 'hor', vessel: v.id, pos: p, h, date: isoD(dt), seed: true }); });
    }
    v._st = st;
  });
  const curH = (v, p) => Math.round(v._st[p] + DIAS * rate[v.id][p]);
  // último serviço de cada item
  cfg.frota.forEach(v => posicoes(v).forEach(pos => itensDe(v, pos).forEach(t => {
    if (t.kind !== 'prog') return; const iv = intervalo(t, v, pos); const hp = posHor(pos, t, v.id);
    const f = R() * 1.03; let h = null, date;
    if (iv.h && v._st[hp] !== undefined) { h = Math.max(0, Math.round(curH(v, hp) - f * iv.h)); const dias = (curH(v, hp) - h) / rate[v.id][hp]; date = new Date(d0); date.setDate(date.getDate() - Math.round(dias)); if (iv.m) { const lim = addM(d0, -iv.m * f); if (lim > date) date = lim; } }
    else { date = new Date(d0); date.setDate(date.getDate() - Math.round(f * iv.m * 30.4)); }
    out.push({ id: 'ex-base-' + v.id + pos + t.id, kind: 'base', vessel: v.id, pos, item: t.id, h, date: isoD(date), seed: true });
  })));
  // preventivas encerradas (inclui a preditiva 1.1.29 / 1.1.30)
  let num = 47800;
  const FOT = (ok) => ok ? [{ tipo: 'ANTES', leg: 'Condição encontrada' }, { tipo: 'DEPOIS', leg: 'Após a intervenção' }] : [{ tipo: 'ANTES', leg: 'Condição encontrada' }];
  cfg.frota.forEach((v, i) => {
    for (let k = 0; k < 6; k++) {
      const dias = 8 + k * 30 + Math.round(R() * 18); const dt = new Date(d0); dt.setDate(dt.getDate() - dias);
      const pos = mcpPos(v)[k % mcpPos(v).length]; const h = Math.round(v._st[pos] + (DIAS - dias) * rate[v.id][pos]);
      const items = k % 3 === 0 ? ['1.1.30'] : k % 3 === 1 ? ['1.1.2', '1.1.3'] : ['1.1.29'];
      out.push({ id: 'ex-om-' + (++num), kind: 'om', tipo: 'P', num: String(num), vessel: v.id, pos, items, status: 'encerrada', emitAt: isoD(new Date(dt.getTime() - 4 * 864e5)), alvoH: h + 20, hreal: h, dreal: isoD(dt), fechadoAt: dt.getTime() + 2 * 864e5, indispH: k % 3 === 1 ? Math.round(4 + R() * 14) : 0, fotos: FOT(R() > .08), conf: {}, extras: [], exec: 'Equipe própria', execn: 'CTF de bordo', resultado: 'Conforme', seed: true, updatedAt: dt.getTime(), createdAt: dt.getTime() });
    }
  });
  // corretivas (falhas)
  const CORR = [
    [170, 'v2', 'BB', 'Alta', '2.0 Manobrabilidade e Governo', 'Mangueira de alta pressão do governo com vazamento', 6.5, 'Não'],
    [150, 'v5', 'BE', 'Crítica', '1.0 Sistema de Propulsão', 'Perda de pressão de óleo do MCP, parada imediata', 30, 'Sim'],
    [128, 'v8', 'MCA1', 'Alta', '3.0 Geração Elétrica de Bordo', 'MCA sem excitação, blackout parcial', 9, 'Não'],
    [112, 'v1', 'BB', 'Alta', '1.0 Sistema de Propulsão', 'Reversor patinando em ré', 11, 'Não'],
    [96, 'v11', 'UN', 'Média', '6.0 Alimentação de Combustível', 'Água no separador Racor acima do normal', 20, 'Não'],
    [80, 'v3', 'BE', 'Alta', '1.0 Sistema de Propulsão', 'Superaquecimento do MCP (rotor da bomba de água bruta)', 7, 'Não'],
    [61, 'v6', 'UN', 'Crítica', '5.0 Salvaguarda e Flutuabilidade', 'Bomba de porão sem escorva com entrada de água', 14, 'Sim'],
    [44, 'v9', 'BB', 'Alta', '1.0 Sistema de Propulsão', 'Correia do alternador rompida', 5, 'Não'],
    [30, 'v2', 'UN', 'Baixa', '10.0 Habitabilidade', 'Descarga do sanitário com vazamento', 70, 'Não'],
    [19, 'v12', 'UN', 'Alta', '7.0 Sinalização e Comunicação', 'Luz de navegação de boreste apagada', 3, 'Não'],
    [9, 'v4', 'BE', 'Alta', '1.0 Sistema de Propulsão', 'Vazamento no tubo de alta pressão de combustível', 6, 'Não'],
  ];
  let rnc = 24;
  CORR.forEach(([dias, vid, pos, cl, sis, desc, dur, interd]) => { pos = fixP(vid, pos);
    const a = new Date(d0); a.setDate(a.getDate() - dias); a.setHours(7 + dias % 9, 15);
    const lib = new Date(a.getTime() + dur * 3600e3);
    out.push({ id: 'ex-om-' + (++num), kind: 'om', tipo: 'C', num: String(num), vessel: vid, pos, status: 'encerrada', abertura: isoDT(a), sistema: sis, equip: '', classe: cl, rnc: cl === 'Crítica' || cl === 'Alta' ? 'RNC-2026-0' + (++rnc) : '', descricao: desc, interd, interdDT: interd === 'Sim' ? isoDT(a) : '', inicio: isoDT(new Date(a.getTime() + 1800e3)), termino: isoDT(new Date(lib.getTime() - 1800e3)), liberacao: isoDT(lib), resultado: 'Conforme', fotos: FOT(true), fechadoAt: lib.getTime(), seed: true, updatedAt: lib.getTime(), createdAt: a.getTime() });
  });
  // corretivas em aberto
  const a1 = new Date(d0.getTime() - 2.5 * 3600e3), a2 = new Date(d0.getTime() - 20 * 3600e3);
  out.push({ id: 'ex-om-48202', kind: 'om', tipo: 'C', num: '48202', vessel: 'v7', pos: 'UN', status: 'execucao', abertura: isoDT(a1), sistema: '2.0 Manobrabilidade e Governo', equip: 'Orbitrol do governo', classe: 'Alta', rnc: 'RNC-2026-036', descricao: 'Folga excessiva no volante e vazamento no bloco de válvulas', origem: 'Em viagem (Autotrac)', interd: 'N/A', inicio: isoDT(new Date(a1.getTime() + 3600e3)), fotos: [], seed: true });
  out.push({ id: 'ex-om-48195', kind: 'om', tipo: 'C', num: '48195', vessel: 'v10', pos: 'BE', status: 'aberta', abertura: isoDT(a2), sistema: '3.0 Geração Elétrica de Bordo', equip: 'Alternador de carga do MCP', classe: 'Média', rnc: '', descricao: 'Ruído no rolamento do alternador de carga', origem: 'FR 027_L', interd: 'N/A', fotos: [], seed: true });
  // preventivas em andamento
  const mk = (n, vid, pos, items, status, diasEmit) => { pos = fixP(vid, pos); items = items.filter(id => aplica(vessel(vid), pos, A1M[id])); if (!items.length) return; const v = vessel(vid); const hp = pos; const dt = new Date(d0); dt.setDate(dt.getDate() - diasEmit); const ch = curH(v, hp); out.push({ id: 'ex-om-' + n, kind: 'om', tipo: 'P', num: String(n), vessel: vid, pos, items, status, emitAt: isoD(dt), alvoH: ch + 35, conf: {}, extras: [], fotos: [], exec: 'Equipe de manutenção', seed: true }); };
  mk(48213, 'v5', 'BE', ['1.1.1', '1.1.2', '1.1.3'], 'executada', 6);
  mk(48190, 'v1', 'BB', ['1.1.9', '1.1.10'], 'abordo', 3);
  mk(48177, 'v3', 'MCA1', [itensDe(vessel('v3'), 'MCA1').find(t => t.kind === 'prog').id], 'emitida', 1);
  // backlog semanal
  for (let w = 8; w >= 1; w--) { const dt = new Date(d0); dt.setDate(dt.getDate() - w * 7); out.push({ id: 'snap-' + isoD(dt), kind: 'snap', date: isoD(dt), v: [9.1, 8.3, 7.4, 6.9, 6.2, 5.4, 4.8, 4.1][8 - w], seed: true }); }
  cfg.frota.forEach(v => delete v._st);
  return out;
}
async function carregarExemplo() { const l0 = gerarExemplo(); l0.forEach(r => S.recs.set(r.id, r)); l0.forEach(r => S.recs.set(r.id, r)); completarExemploAntigo(); const l = l0.concat(exemploComp(), exemploFalhas()); l.forEach(r => S.recs.set(r.id, r)); exemploHor().forEach(r => { if (!l.includes(r)) l.push(r); }); l.forEach(r => { r.updatedAt = r.updatedAt || Date.now(); r.createdAt = r.createdAt || r.updatedAt; S.recs.set(r.id, r); }); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); await kvSet('cfg', S.cfg); await kvSet('seeded', true); }
async function limparExemplo() {
  const ids = [...S.recs.values()].filter(r => r.seed).map(r => r.id);
  for (const id of ids) { S.recs.delete(id); if (MEM) MEM.delete(id); else await DB.del(id); }
  if (S.cfg.situExemplo) { S.cfg.frota.forEach(v => { delete v.situ; }); S.cfg.situExemplo = false; await kvSet('cfg', S.cfg); }   // onde está cada empurrador veio do exemplo (js/81)
  if (S.cfg.revExemplo) { S.cfg.frota.forEach(v => { if (!FROTA_MATRIZ[v.nome]) v.rev = {}; }); S.cfg.revExemplo = false; await kvSet('cfg', S.cfg); }
  await kvSet('seeded', 'limpo');
}
const temExemplo = () => [...S.recs.values()].some(r => r.seed);

/* ---------- navegação ---------- */
const NAV = [
  ['Painel', [['geral', 'Visão geral'], ['frota', 'Controle de vencimentos · situação atual da frota'], ['calib', 'Ajustes e calibração do MCP'], ['over', 'Manutenção baseada na condição (MBC) · MCP'], ['doca', 'Docagem'], ['falhas', 'Análise de falhas e ações de bloqueio'], ['hor', 'Horímetros'], ['kpi', 'Indicadores de desempenho (KPI) · NP 055'], ['hist', 'Histórico de OMs']]],
  ['Ordens de Manutenção', [['emitir', 'Programação de preventivas'], ['acomp', 'Controle de OMs em execução'], ['prev', 'Preventiva · Anexo II-B'], ['corr', 'Corretiva · Anexo II-A']]],
  ['Consulta', [['matriz', 'Plano de manutenção · Anexo I']]],
  ['Supervisor', [['rel', 'Relatório mensal'], ['admin', 'Administração']]],
];
let VIEW = 'geral', ARG = '';
/* frota escolhida no topo do menu (24/10/2026): 'emp' = empurradores · 'bal' = balsas petroleiras (js/83: cadastro, plano da NP 024, situação, cronograma e ficha técnica, 25/10/2026) */
let FROTA_TIPO = (() => { try { return localStorage.getItem('smf_frota_tipo') === 'bal' ? 'bal' : 'emp'; } catch (e) { return 'emp'; } })();
const FROTA_TIPOS = { emp: 'Frota de empurradores', bal: 'Frota de balsas petroleiras' };
function badge(k) {   // num lugar só (24/10/2026): antes eram 5 camadas por cima
  if (FROTA_TIPO === 'bal') return '';   // balsas: o número do menu vem do balNav (js/83)
  if (['rotina', 'emitir', 'oms', 'falhas2', 'omconf'].includes(k) && !(typeof ehOperador === 'function' && ehOperador())) {   // número no menu = trabalho pendente (navCont)
    let C; try { C = navCont(); } catch (e) { return ''; } const n = C[k] || 0; if (!n) return '';
    const red = k === 'rotina' || (k === 'falhas2' && C.falhasSem); return `<span class="n${red ? '' : ' blue'}">${n}</span>`; }
  if (k === 'crono') return '';
  if (k === 'pecas') { const n = recs('peca').filter(p => numv(p.estoque) < numv(p.minimo || 1)).length; return n ? `<span class="n">${n}</span>` : ''; }
  if (k === 'terc') { const n = recs('terc').filter(r => valSt(r.validade) === 'venc').length; return n ? `<span class="n">${n}</span>` : ''; }
  if (k === 'trein') { const n = treinPessoas().filter(p => p.st === 'venc').length; return n ? `<span class="n">${n}</span>` : ''; }
  if (k === 'lub') return lubBadge();
  const ab = oms().filter(o => o.status !== 'encerrada');
  if (k === 'prev') { const n = ab.filter(o => o.tipo === 'P' && ['executada', 'conferencia'].includes(o.status)).length; return n ? `<span class="n blue">${n}</span>` : ''; }
  if (k === 'corr') { const n = ab.filter(o => o.tipo === 'C').length; return n ? `<span class="n">${n}</span>` : ''; }
  if (k === 'acomp') { const n = ab.filter(omAtrasada).length; return n ? `<span class="n">${n}</span>` : ''; }
  return '';
}
function renderNav() {   // menu num lugar só (24/10/2026): antes eram 6 camadas por cima
  const h = SECOES.find(s => s.id === 'hoje'); if (h && S.cfg && S.cfg.frota) h.nome = '1 · Frota';
  const solta = !SECOES.some(s => s.views.some(v => v[0] === VIEW) || (s.extra || []).includes(VIEW)) && VIEW !== 'om', u0 = h ? ULT[h.id] : null;   /* tela fora de todas as seções: secDe cai na 1ª seção e gravaria esta tela como a última da Frota */
  const cur = secDe(VIEW); ULT[cur.id] = cur.views.some(v => v[0] === VIEW) ? VIEW : (ULT[cur.id] || cur.views[0][0]);   /* o menu volta para a última ABA da seção, nunca para uma tela de dentro (ficha, OM, programar) */
  const item = s => { const n = s.views.reduce((a, [k]) => a + numBadge(k), 0), red = s.views.some(([k]) => /class="n"/.test(badge(k)));
    return `<a href="#${ULT[s.id] || s.views[0][0]}" class="${s === cur ? 'on' : ''}">${ico(s.id)}<span>${s.nome}</span>${n ? `<span class="n${red ? '' : ' blue'}">${n}</span>` : ''}</a>`; };
  const nav = document.getElementById('nav'), frSel = `<label class="fr-tipo"><span>Frota</span><select id="frTipo">${Object.entries(FROTA_TIPOS).map(([k, n]) => `<option value="${k}"${k === FROTA_TIPO ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  if (FROTA_TIPO === 'bal' && !ehOperador() && typeof balNav === 'function') { nav.innerHTML = frSel + balNav(); return; }   // frota de balsas: menu próprio (js/83)
  if (typeof enxuto === 'function' && enxuto()) { nav.innerHTML = frSel + enxNav(); return; }   // modo enxuto (js/85)
  nav.innerHTML = frSel + '<div class="grp-t grp-trab">Operação</div>' + SECOES.filter(s => !s.cfg).map(item).join('') + '<div class="grp-t">Controle</div>' + SECOES.filter(s => s.cfg).map(item).join('');
  if (solta && h) { ULT[h.id] = u0; const a1 = document.querySelector('#nav > a'); if (a1) { a1.setAttribute('href', '#' + (u0 || h.views[0][0])); a1.classList.remove('on'); } }
  const A = [...nav.querySelectorAll(':scope > a')], L = SECOES.filter(s => !s.cfg).concat(SECOES.filter(s => s.cfg));
  L.forEach((s, i) => { const sp = A[i] && A[i].querySelector('span'); if (s.sub && sp && !sp.querySelector('.nav-sub')) sp.insertAdjacentHTML('beforeend', `<small class="nav-sub">${esc(s.sub)}</small>`); });
  if (ehOperador()) { nav.innerHTML = `<a href="#rotina" class="on">${ico('hoje')}<span>Chegada e saída</span></a>`; return; }
  L.forEach((s, i) => { const a = A[i]; if (!a) return; if (['prev2', 'omsv2', 'conf2'].includes(s.id)) a.classList.toggle('nav-zero', !a.querySelector('.n') && !a.classList.contains('on')); });
  const i = L.findIndex(s => s.id === 'regs2'); if (i >= 0 && A[i]) A[i].insertAdjacentHTML('beforebegin', '<div class="grp-t grp-apoio">Apoio</div>');
  L.forEach((s, k) => { const x = A[k]; if (x && s.id === 'relm' && (!can.admin() || (typeof menuOculto === 'function' && menuOculto('relm'))) && !x.classList.contains('on')) x.style.display = 'none'; });   /* Relatório mensal: só o Supervisor, e pode ficar oculto neste aparelho (js/82) */
}
function omTipo() { const o = S.recs.get(ARG); return o ? o.tipo : ''; }
function renderUser() {
  const s = S.session;
  $('#userBox').innerHTML = s ? `<div class="av">${esc(s.name.trim().slice(0, 2).toUpperCase())}</div><div><b>${esc(s.name)}</b><span>${s.role === 'admin' ? 'Supervisor · admin' : 'Analista · operador'}</span></div><button id="sair">Sair</button>`
    : `<div class="av">—</div><div><b>Consulta</b><span>sem login</span></div><button id="entrar">Entrar</button>`;
  gate();
}
function go(h) { location.hash = h; }
window.addEventListener('hashchange', route);
function route() { const h = location.hash.slice(1) || 'geral'; const [v, a] = h.split('/'); VIEW = v; ARG = a ? decodeURIComponent(a) : ''; document.body.classList.remove('menu'); render(); window.scrollTo(0, 0); }
function rerender() { const a = document.activeElement; if (a && $('#main').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { renderNav(); return; } render(); }
/* montagem da página num lugar só (24/10/2026): antes eram 11 camadas por cima de render, aplicadas nesta mesma ordem */
let RENDER_ULTV = '';
document.addEventListener('change', e => { const s = e.target.closest('#frTipo'); if (!s) return; FROTA_TIPO = s.value === 'bal' ? 'bal' : 'emp'; try { localStorage.setItem('smf_frota_tipo', FROTA_TIPO); } catch (er) { } location.hash = FROTA_TIPO === 'bal' ? '#bal' : '#rotina'; });
document.addEventListener('click', e => { const b = e.target.closest('[data-frtipo]'); if (!b) return; FROTA_TIPO = b.dataset.frtipo === 'bal' ? 'bal' : 'emp'; try { localStorage.setItem('smf_frota_tipo', FROTA_TIPO); } catch (er) { } location.hash = FROTA_TIPO === 'bal' ? '#bal' : '#rotina'; });
{ const st = document.createElement('style'); st.textContent = `.fr-tipo{display:flex;flex-direction:column;gap:3px;margin:2px 6px 10px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#5F6368}.fr-tipo select{font:600 13.5px inherit;text-transform:none;letter-spacing:0;padding:7px 8px;border:1px solid #DADCE0;border-radius:8px;background:#fff;color:#1F2A44}`; document.head.appendChild(st); }
function render() {
  if (VIEW === 'om' && ARG) { const o = S.recs.get(ARG);   // OM preventiva solta (sem grupo) abre como OM de janela de 1 parte
    if (o && o.kind === 'om' && o.tipo === 'P' && !o.grupo && o.status !== 'encerrada' && o.num && !oms().some(x => x.grupo === o.num && x.id !== o.id)) {
      o.grupo = o.num; o.parte = 1; o.partes = 1; o.itensProg = o.itensProg || (o.items || []).slice(); saveRec(o);
      VIEW = 'omg'; ARG = o.num; try { history.replaceState(null, '', '#omg/' + encodeURIComponent(o.num)); } catch (e) { } } }
  situRecalc(); document.body.classList.toggle('perfil-opr', ehOperador());
  if (!ehOperador() && typeof BAL_VIEWS !== 'undefined') { const ehBal = BAL_VIEWS.some(v => v[0] === VIEW);   // frota de balsas (js/83)
    if (ehBal && FROTA_TIPO !== 'bal') { FROTA_TIPO = 'bal'; try { localStorage.setItem('smf_frota_tipo', 'bal'); } catch (e) { } }
    else if (!ehBal && FROTA_TIPO === 'bal' && !['admin', 'bib'].includes(VIEW)) { VIEW = 'bal'; ARG = ''; try { history.replaceState(null, '', '#bal'); } catch (e) { } } }
  if (typeof enxRota === 'function') enxRota();   // modo enxuto: só as telas dele (js/85)
  if (ehOperador() && VIEW !== 'rotina') { VIEW = 'rotina'; ARG = ''; if (location.hash !== '#rotina') history.replaceState(null, '', '#rotina'); }   // perfil Operador só vê Chegada e saída
  const mesma = VIEW === RENDER_ULTV, y = scrollY;   // re-render da mesma tela: volta para onde estava a rolagem
  if (S.cfg && S.cfg.frota) { placaInit(); foraInit(); }
  renderNav(); renderUser();
  const V = { geral: vGeral, calib: vCalib, doca: vDoca, hor: vHor, kpi: vKpi, emitir: vEmitir, acomp: () => { setTimeout(() => location.replace('#oms')); return ''; },   /* a tela antiga de OMs em execução saiu (25/10/2026): Executar e lançar */ om: vOM, matriz: vMatriz, admin: vAdmin, ...(typeof VX !== 'undefined' ? VX : {}) }[VIEW] || vGeral;
  const m = $('#main'); m.onclick = m.oninput = m.onchange = null;
  m.style.removeProperty('--ws-esq'); m.style.removeProperty('--ws-larg');   // janelas livres da tela anterior
  m.innerHTML = banners() + (typeof opPassos === 'function' ? opPassos() : '') + V();   // faixa de passos da operação (js/84)
  (AFTER[VIEW] || (() => { }))();
  try { layApply(); } catch (er) { console.error(er); }
  try { vidrificar($('#main')); } catch (e) { }
  if (VIEW === 'hor') requestAnimationFrame(() => setTimeout(() => $$('.rio-ls').forEach(e => e.classList.add('on')), 60));
  gate();
  RENDER_ULTV = VIEW;
  if (mesma && y > 0 && (VIEW === 'controle' || VIEW === 'geral' || PAG1.has(VIEW))) { scrollTo(0, y); requestAnimationFrame(() => scrollTo(0, y)); setTimeout(() => scrollTo(0, y), 450); }
  try { if (!(typeof ehOperador === 'function' && ehOperador())) { const h = document.querySelector('#main .vh h1'), tt = typeof TITULO !== 'undefined' && !ARG ? (typeof enxuto === 'function' && enxuto() && typeof PCM_TIT !== 'undefined' && PCM_TIT[VIEW]) || TITULO[VIEW] : null;   // título = nome da aba (js/84)
    if (h && tt) { [...h.childNodes].filter(n => n.nodeType === 3).forEach(n => n.remove()); h.insertBefore(document.createTextNode(tt), h.firstChild); }
    const t = NP_TAG[VIEW]; if (t && h && !h.querySelector('.np-tag')) h.insertAdjacentHTML('beforeend', `<span class="np-tag">${/^NP /.test(t) ? t : 'NP 055 · ' + t}</span>`); } } catch (e) { }   // item da norma ao lado do título
}
const AFTER = {};
function banners() {
  let h = abasHtml();
  if (temExemplo()) h += `<div class="banner ex"><b>Dados de exemplo.</b> O SMF está mostrando uma frota simulada para você ver o sistema funcionando.<span class="sp"></span>${can.admin() ? '<button class="mbtn sm" data-act="limparEx">Limpar dados de exemplo</button>' : '<span>O Supervisor limpa em Administração.</span>'}</div>`;
  if (FROTA_TIPO !== 'bal' && S.cfg.frota.some(v => mcpPos(v).some(p => !v.rev[p])) && VIEW !== 'admin') h += `<div class="banner info">Há empurradores sem o modelo do reversor informado. Os itens do reversor só aparecem depois de configurar em <a href="#admin">Administração › Frota</a>.</div>`;
  if (MEM) h += `<div class="banner bad">Este navegador bloqueou o armazenamento. Os dados só valem até fechar a página. Abra em uma janela normal.</div>`;
  return h;
}

/* ---------- modal ---------- */
function modal(html, wide) { closeModal(); const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.innerHTML = `<div class="box ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) closeModal(); }); const f = m.querySelector('input,select,textarea,button'); if (f) f.focus(); return m; }
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
function loginModal(msg) {
  const m = modal(`<h2>Entrar no SMF</h2><p class="note">${msg || 'Analista: lança horímetros, preenche o Anexo II e o FR 049_B. Supervisor: emite, confere, aprova e configura.'}</p>
   <label class="f">Seu nome<input id="lgN" autocomplete="name"></label><label class="f">Senha<input id="lgP" type="password" autocomplete="current-password"></label>
   <div class="note" id="lgE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="lgB">Entrar</button></div>
   ${S.url ? '' : '<p class="note">Modo local (sem nuvem). Use as senhas iniciais informadas pelo Supervisor e troque em Administração.</p>'}`);
  const go1 = async () => {
    $('#lgB').disabled = true; $('#lgB').textContent = 'Entrando…'; $('#lgE').textContent = '';
    let e; try { e = await login($('#lgN').value, $('#lgP').value); }
    catch (err) { e = 'Não consegui falar com o servidor do Google. Confira se a implantação está como "Qualquer pessoa" e se o endereço termina em /exec.'; if (S.url) $('#lgE').insertAdjacentHTML('afterend', '<div class="row" id="lgLoc"><button class="mbtn sm" id="lgLocB">Voltar ao modo local (apagar o endereço da nuvem)</button></div>'); }
    $('#lgB').disabled = false; $('#lgB').textContent = 'Entrar';
    if (e) { $('#lgE').textContent = e; const b = $('#lgLocB'); if (b) b.onclick = async () => { S.url = ''; await kvSet('url', ''); closeModal(); loginModal('Modo local. Entre com a senha inicial do Supervisor para corrigir o endereço da nuvem em Administração.'); }; return; }
    closeModal(); toast('Bem-vindo, ' + S.session.name + '.'); render();
  };
  $('#lgB').onclick = go1; $('#lgP').onkeydown = e => { if (e.key === 'Enter') go1(); };
}
function precisa(adm) { if (!S.session) { loginModal(); return false; } if (adm && !can.admin()) { toast('Somente o Supervisor (administrador) pode fazer isso.'); return false; } return true; }

/* ---------- gráficos (SVG) ---------- */
const fmtv = (v, d) => v === null || v === undefined || isNaN(v) ? '—' : nf(v, d);
document.addEventListener('mouseover', e => { const t = $('#tip'), h = e.target.closest && e.target.closest('[data-tip]'); if (!h) { t.hidden = true; return; } t.textContent = h.dataset.tip; t.hidden = false; });
document.addEventListener('mousemove', e => { const t = $('#tip'); if (t.hidden) return; t.style.left = Math.min(e.clientX + 12, innerWidth - t.offsetWidth - 8) + 'px'; t.style.top = (e.clientY - 34) + 'px'; });

/* ---------- pequenos componentes ---------- */
const PST = { venc: ['p-bad', 'Vencido'], viag: ['p-warn', 'Vence na viagem'], ok: ['p-ok', 'Em dia'], sem: ['p-mut', 'Sem histórico'], cond: ['p-mut', 'Por condição'] };
const pillSt = st => `<span class="pill ${PST[st][0]}">${PST[st][1]}</span>`;
const posTag = p => `<span class="pos ${p}">${p === 'UN' ? 'UN' : p}</span>`;
const omStatusTxt = o => ((o.tipo === 'C' ? ETAPAS_C : ETAPAS_P).find(x => x[0] === o.status) || ['', o.status])[1];

/* =====================================================================
   VISÃO GERAL
   ===================================================================== */
function vGeral() { setTimeout(() => location.replace('#rotina')); return ''; }   // o antigo Painel de gestão saiu (24/10/2026): indicadores em Indicadores, situação na Frota

/* =====================================================================
   FROTA E VENCIMENTOS
   ===================================================================== */
/* =====================================================================
   AJUSTE E CALIBRAÇÃO MCP (itens em amarelo do Anexo I + caixa de mar)
   ===================================================================== */
const CALIB = [['1.1.11', 'Folga de válvulas'], ['1.1.12', 'Bicos injetores'], ['1.1.13', 'Ponto de injeção'], ['1.1.15', 'Rótulas do controle de combustível'], ['1.1.17', 'Trocador de calor'], ['1.4.1', 'Caixa de mar']];
const CAL_VIAGEM = ['1.4.1']; // pode ser feito com o empurrador em viagem; os demais são serviço técnico, só no porto
const calPorto = id => !CAL_VIAGEM.includes(id);
// fração da vida que ainda resta (1 = recém-feito, 0 = vence agora, < 0 = vencido); null = sem dado
function calibVida(t, s) {
  const iv = intervalo(t); let p = null;
  if (iv.h && s.rest !== null && s.rest !== undefined) p = s.rest / iv.h;
  if (iv.m && s.alvoD) { const q = ((s.alvoD - hoje()) / 864e5) / (iv.m * 30.4); p = p === null ? q : Math.min(p, q); }
  return p;
}
function calibDados() {
  const out = [];
  S.cfg.frota.forEach(v => CALIB.forEach(([id, nm]) => {
    const t = A1M[id]; if (!t) return;
    posicoes(v).forEach(pos => { if (!aplica(v, pos, t)) return; const s = situacao(v, pos, t); out.push({ v, pos, t, nm, s, om: omAberta(v.id, pos, id), vida: s.st === 'sem' ? null : calibVida(t, s) }); });
  }));
  return out.filter(x => !foraOp(x.v));
}
let CALTODOS = false;
function calVal(x) { const s = x.s; if (s.rest !== null && s.rest !== undefined) return s.rest < 0 ? '−' + nf(-s.rest) + ' h' : nf(s.rest) + ' h'; if (s.alvoD) { const d = Math.floor((s.alvoD - hoje()) / 864e5); return d < 0 ? '−' + (-d) + ' d' : d + ' d'; } return '—'; }
const CORST = { venc: 'var(--bad)', viag: 'var(--warn)', ok: 'var(--ok)', sem: 'var(--line2)' };
function ivTxt(t) { const iv = intervalo(t); return [iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' meses' : ''].filter(Boolean).join(' ou ') || '—'; }
function vCalib() {
  const D = calibDados(), n = { venc: 0, viag: 0, ok: 0, sem: 0 }; let emOM = 0;
  D.forEach(x => { if (n[x.s.st] !== undefined) n[x.s.st]++; if (x.om) emOM++; });
  // A · placar por item
  const nPorto = D.filter(x => x.s.st === 'viag' && calPorto(x.t.id)).length, nBordo = D.filter(x => x.s.st === 'viag' && !calPorto(x.t.id)).length;
  const num = (v, cls) => v ? `<b class="${cls}">${v}</b>` : '<span class="mut">–</span>';
  const placar = CALIB.map(([id, nm]) => {
    const t = A1M[id]; if (!t) return '';
    const SO = { venc: 0, viag: 1, sem: 2, ok: 3 };
    const L = D.filter(x => x.t.id === id).sort((a, b) => SO[a.s.st] - SO[b.s.st] || (a.vida ?? 9) - (b.vida ?? 9)), c = { venc: 0, viag: 0, ok: 0, sem: 0 }; L.forEach(x => { if (c[x.s.st] !== undefined) c[x.s.st]++; });
    const pend = L.filter(x => x.s.st === 'venc' || x.s.st === 'viag').map(x => `<span class="pd ${x.s.st}" data-calib="${x.v.id}" data-tip="${esc(x.s.txt || '')}">${esc(x.v.nome)} ${x.pos} <b>${calVal(x)}</b>${x.om ? ' (OM)' : ''}</span>`).join('');
    return `<tr><td><span class="mono mut">${id}</span> <b>${esc(nm)}</b></td><td class="mono">${ivTxt(t)}</td><td>${calPorto(id) ? '<span class="pill p-mut">Porto</span>' : '<span class="pill p-inf">Em viagem</span>'}</td>
     <td class="c">${num(c.venc, 'cb')}</td><td class="c">${num(c.viag, 'cw')}</td><td class="c">${num(c.ok, 'cg')}<span class="mut"> / ${L.length}</span></td><td>${pend || '<span class="mut">nada pendente</span>'}</td></tr>`;
  }).join('');
  // B · ranking dos mais urgentes (cada barra = um item de um motor)
  const SO = { venc: 0, viag: 1, ok: 2 };
  const rk = D.filter(x => x.vida !== null).sort((a, b) => SO[a.s.st] - SO[b.s.st] || a.vida - b.vida);
  // padrão: a frota toda, uma linha por empurrador com o item mais urgente; CALTODOS = todos os itens de todos os motores
  const pendDe = vid => D.filter(x => x.v.id === vid && (x.s.st === 'venc' || x.s.st === 'viag')).length;
  const vis = CALTODOS ? rk : S.cfg.frota.map(v => { const x = rk.find(y => y.v.id === v.id); return x ? Object.assign({}, x, { porBarco: true, mais: Math.max(0, pendDe(v.id) - (x.s.st === 'ok' ? 0 : 1)) }) : { v, semHist: true }; })
    .sort((a, b) => (a.semHist ? 1 : 0) - (b.semHist ? 1 : 0) || (a.semHist ? 0 : SO[a.s.st] - SO[b.s.st] || a.vida - b.vida));
  // linha "vence agora" a 40%: esquerda = atraso (cheia = meio intervalo ou mais), direita = folga (cheia = intervalo inteiro)
  const X = v => v < 0 ? 40 + Math.max(v, -0.5) * 80 : 40 + Math.min(v, 1) * 60;
  const linhas = vis.map(x => {
    if (x.semHist) return `<div class="rkrow" data-calib="${x.v.id}"><div class="rklb"><b>${esc(x.v.nome)}</b> · <span class="mut">sem histórico: registre o último serviço</span></div><div class="rktr"><i class="rkz"></i></div></div>`;
    const x0 = X(x.vida), l = Math.min(x0, 40), w = Math.max(0.6, Math.abs(x0 - 40)), c = CORST[x.s.st];
    return `<div class="rkrow" data-calib="${x.v.id}" data-tip="${esc(x.s.txt || '')} · clique para ver o empurrador"><div class="rklb">${x.porBarco ? `<b>${esc(x.v.nome)}</b> · ${x.pos} ${x.t.id} ${esc(x.nm)}` : `<b>${esc(x.v.nome)} ${x.pos}</b> · ${x.t.id} ${esc(x.nm)}`}${x.s.st !== 'ok' ? (calPorto(x.t.id) ? ` <span class="pill ${x.s.st === 'venc' ? 'p-bad' : 'p-warn'}">${x.s.st === 'venc' ? 'fazer no porto' : 'antecipar no porto'}</span>` : ' <span class="pill p-inf">pode a bordo</span>') : ''}${x.om ? ` <span class="pill p-inf">OM ${esc(x.om.num)}</span>` : ''}${x.mais ? ` <span class="pill p-mut">+${x.mais} pendente${x.mais > 1 ? 's' : ''}</span>` : ''}</div>
     <div class="rktr"><i class="rkz"></i><i class="rkbr" style="left:${l}%;width:${w}%;background:${c}"></i><span class="rkvl" style="${x.vida < 0 ? `right:${100 - l + 1}%` : `left:${l + w + 1}%`};color:${c}">${calVal(x)}</span></div></div>`;
  }).join('');
  return `<div class="vh"><div><h1>Ajustes e calibração do MCP</h1><p>Itens de ajuste do Anexo I (folga de válvulas, bicos, ponto de injeção, rótulas, trocador de calor) e a limpeza da caixa de mar. Vencimento = horas OU meses, o que ocorrer primeiro. "Na viagem" = vence antes do fim da próxima viagem de cada empurrador (horas informadas na Programação da janela; sem informação, ${S.cfg.viagemH} h). Os serviços técnicos só são feitos no porto; a caixa de mar pode ser feita a bordo.</p></div><span class="sp"></span><button class="mbtn" onclick="go('emitir')">＋ Programar preventiva</button></div>
  <div class="kgrid six">
   <div class="card mini ${n.venc ? 'bad' : 'ok'}"><b>${n.venc}</b><span>vencidos</span></div>
   <div class="card mini ${nPorto ? 'warn' : 'ok'}"><b>${nPorto}</b><span>vencem na próxima viagem · fazer no porto antes de sair</span></div>
   <div class="card mini ${nBordo ? 'warn' : 'ok'}"><b>${nBordo}</b><span>caixa de mar vence na viagem · dá para fazer a bordo</span></div>
   <div class="card mini ok"><b>${n.ok}</b><span>em dia</span></div>
   <div class="card mini"><b>${n.sem}</b><span>sem histórico</span></div>
   <div class="card mini"><b>${emOM}</b><span>já com OM aberta</span></div>
  </div>
  <div class="card"><div class="row"><h2>A · Resumo por item</h2><span class="sp"></span><span class="note">Serviço técnico só é feito no porto: o que vence durante a viagem tem que ser antecipado antes de sair.</span></div>
   <div class="tw"><table class="t calt"><thead><tr><th>Item</th><th>Intervalo</th><th>Onde faz</th><th class="c">Vencidos</th><th class="c">Vencem na próxima viagem</th><th class="c">Em dia</th><th>Pendentes (clique para abrir o empurrador)</th></tr></thead><tbody>${placar}</tbody></table></div></div>
  <div class="card"><div class="row"><h2>B · ${CALTODOS ? 'Todos os itens, por urgência' : 'Frota: o item mais urgente de cada empurrador'}</h2><span class="sp"></span><button class="mbtn sm" data-caltodos>${CALTODOS ? 'Ver por empurrador' : 'Ver todos os itens (' + rk.length + ')'}</button></div>
   <div class="note">${CALTODOS ? 'Cada barra é um item de um motor.' : 'Uma linha por empurrador, mostrando o item mais apertado dele ("+N pendentes" = outros itens vencidos ou vencendo).'} À esquerda da linha = vencido (quanto atrasou); à direita = quanto falta. O tamanho é proporcional ao intervalo do item. h = horas · d = dias (caixa de mar). Clique numa linha para ver o empurrador.</div>
   <div class="clegend note"><span><i style="background:var(--bad)"></i>vencido</span><span><i style="background:var(--warn)"></i>vence na próxima viagem</span><span><i style="background:var(--ok)"></i>em dia</span>${n.sem ? `<span class="sp"></span><span>${n.sem} sem histórico ficam fora (registre o último serviço)</span>` : ''}</div>
   <div class="rk">${linhas || '<div class="note">Nenhum item com histórico ainda.</div>'}
    <div class="rkrow rkax"><span></span><div class="rktr"><span style="left:0">◂ mais atrasado</span><span style="left:40%;transform:translateX(-50%)">vence agora</span><span style="right:0">mais folga ▸</span></div></div></div></div>`;
}
function calibModal(vid) {
  const v = vessel(vid), D = calibDados().filter(x => x.v.id === vid);
  const ord = { venc: 0, viag: 1, sem: 2, ok: 3 }; D.sort((a, b) => ord[a.s.st] - ord[b.s.st] || CALIB.findIndex(c => c[0] === a.t.id) - CALIB.findIndex(c => c[0] === b.t.id));
  modal(`<div class="row"><h2>${esc(v.nome)} · ajuste e calibração</h2><span class="sp"></span><a class="mbtn sm pri" href="#emitir/${v.id}" data-close>Emitir OM</a><button class="mbtn" data-close>Fechar</button></div>
   <div class="tw" style="max-height:60vh"><table class="t"><thead><tr><th>Pos.</th><th>Nº</th><th>Item</th><th>Intervalo</th><th>Último serviço</th><th>Situação</th><th></th></tr></thead><tbody>
   ${D.map(x => `<tr><td>${posTag(x.pos)}</td><td class="mono">${x.t.id}</td><td>${esc(x.nm)}</td><td class="mono">${ivTxt(x.t)}</td><td class="mono">${x.s.L ? (x.s.L.h !== null ? nf(x.s.L.h) + ' h · ' : '') + brD(x.s.L.date) : '—'}</td><td>${pillSt(x.s.st)}<div class="note">${esc(x.s.txt || '')}</div></td><td>${x.om ? `<a class="mbtn sm" href="#om/${x.om.id}" data-close>OM ${esc(x.om.num)}</a>` : `<button class="mbtn sm" data-base="${v.id}|${x.pos}|${x.t.id}">Último serviço</button>`}</td></tr>`).join('')}
   </tbody></table></div>`, true);
  $('#modal').addEventListener('click', e => { const bs = e.target.closest('[data-base]'); if (bs) baseModal(...bs.dataset.base.split('|')); });
}
AFTER.calib = () => { $('#main').onclick = e => { if (e.target.closest('[data-caltodos]')) { CALTODOS = !CALTODOS; render(); return; } const b = e.target.closest('[data-calib]'); if (b) calibModal(b.dataset.calib); }; };
/* =====================================================================
   OVERHAUL · SAÚDE DO MCP (decisão pela condição – Anexo I 1.1.28)
   Compressão medida a cada 1.000 h com a calibração dos bicos (1.1.12);
   análise de óleo em programa de amostragem semestral priorizada pela compressão (1.1.29)
   ===================================================================== */
const COMP = { pad: 1.8, aten: 1.45, lim: 1.27, queda: 0.15, cobMeses: 24 };
const numBR = v => { if (v === '' || v == null) return null; const x = parseFloat(String(v).replace(',', '.')); return isNaN(x) ? null : x; };
const fMPa = x => x == null ? '—' : x.toFixed(2).replace('.', ',');
// histórico de compressão de um MCP: lançamentos avulsos (kind 'comp') + OMs encerradas de 1.1.12 e 1.1.28
function compHist(vid, pos) {
  const L = [];
  recs('comp').forEach(r => { if (r.vessel === vid && r.pos === pos) { const vals = (r.vals || []).map(numBR); if (vals.some(x => x != null)) L.push({ date: r.date, h: r.h, vals, rpm: r.rpm, src: 'Lançamento avulso', id: r.id }); } });
  oms().forEach(o => {
    if (o.tipo !== 'P' || o.status !== 'encerrada' || o.vessel !== vid || o.pos !== pos) return;
    const date = o.dreal || isoD(new Date(o.fechadoAt || o.updatedAt));
    if ((o.items || []).includes('1.1.12')) { const md = ((o.conf || {})['1.1.12'] || {}).meds || []; const vals = [1, 2, 3, 4, 5, 6].map(i => numBR((md[i] || {}).dei ?? (md[i] || {}).enc)); if (vals.some(x => x != null)) L.push({ date, h: o.hreal, vals, rpm: numBR((md[7] || {}).dei ?? (md[7] || {}).enc), src: 'OM ' + o.num, om: o.id }); }
    if ((o.items || []).includes('1.1.28')) { const md = ((o.conf || {})['1.1.28'] || {}).meds || []; const x = numBR((md[0] || {}).dei ?? (md[0] || {}).enc); if (x != null) L.push({ date, h: o.hreal, vals: [x], src: 'OM ' + o.num + ' (menor cilindro)', om: o.id }); }
  });
  L.forEach(p => { const v = p.vals.filter(x => x != null); p.min = Math.min(...v); p.cil = p.vals.indexOf(p.min) + 1; p.max = Math.max(...v); });
  return L.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (+a.h || 0) - (+b.h || 0));
}
function saudeMCP(v, pos) {
  const H = compHist(v.id, pos), u = H[H.length - 1] || null, a = H[H.length - 2] || null;
  const queda = u && a ? a.min - u.min : null;
  let st = 'sem', txt = 'Sem medição de compressão';
  if (u) {
    if (u.min < COMP.lim) { st = 'venc'; txt = 'Avaliar overhaul: cilindro ' + u.cil + ' abaixo do limite'; }
    else if (u.min < COMP.aten) { st = 'viag'; txt = 'Atenção: cilindro ' + u.cil + ' perto do limite'; }
    else if (queda != null && queda >= COMP.queda) { st = 'viag'; txt = 'Atenção: queda de ' + fMPa(queda) + ' MPa desde a última medição'; }
    else { st = 'ok'; txt = 'Compressão normal'; }
  }
  const ov = ultimoServico(v.id, pos, '1.1.28'), hr = horAtual(v.id, pos);
  const desdeOv = ov && ov.h != null && hr ? hr.h - ov.h : null;
  const oleo = ultimoServico(v.id, pos, '1.1.29');
  const mesesOleo = oleo ? Math.floor((hoje() - pD(oleo.date)) / (864e5 * 30.4)) : null;
  const cobVenc = !oleo || mesesOleo >= COMP.cobMeses;
  return { v, pos, H, u, a, queda, st, txt, ov, desdeOv, oleo, mesesOleo, cobVenc, omOleo: omAberta(v.id, pos, '1.1.29') };
}
function overDados() { const out = []; S.cfg.frota.forEach(v => mcpPos(v).forEach(pos => { if ((v.off || []).includes('MCP')) return; out.push(saudeMCP(v, pos)); })); return out.filter(x => !foraOp(x.v || (x.vessel && vessel(x.vessel)))); }
// fila de amostragem: cobertura vencida (> 24 meses ou nunca) primeiro; depois pior compressão, maior queda
function compModal(vid, pos) {
  if (!precisa(false)) return;
  vid = vid || S.cfg.frota[0].id; pos = pos || mpos(vid);
  const h = horAtual(vid, pos);
  modal(`<h2>Registrar ensaio de compressão</h2><p class="note">${typeof enxuto === 'function' && enxuto() ? 'Lance aqui todo ensaio de compressão, inclusive o feito junto com a calibração dos bicos (1.1.12), com o horímetro do dia do teste.' : 'Use para testes feitos fora do SMF ou antes dele. O teste feito junto com a calibração dos bicos é lançado na própria OM do item 1.1.12.'}</p>
   <div class="g"><label class="f s3">Empurrador<select id="cV">${S.cfg.frota.map(x => `<option value="${x.id}"${x.id === vid ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
   <label class="f s3">Motor<select id="cP">${mcpPos(vessel(vid)).map(p => `<option value="${p}"${p === pos ? ' selected' : ''}>${p === 'CE' ? 'Central' : p}</option>`).join('')}</select></label>
   <label class="f s3">Data do teste<input id="cD" type="date" value="${isoD(hoje())}"></label><label class="f s3">Horímetro<input id="cH" inputmode="numeric" value="${h ? h.h : ''}"></label>
   ${[1, 2, 3, 4, 5, 6].map(i => `<label class="f s2">Cilindro ${i} (MPa ou kgf/cm²)<input data-cc="${i}" inputmode="decimal" placeholder="ex.: 1,72 ou 17,5"></label>`).join('')}
   <label class="f s3">Rotação no teste (rpm)<input id="cR" inputmode="numeric" placeholder="~120"></label></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="cOk">Salvar</button></div>`);
  $('#cV').onchange = () => { $('#cP').innerHTML = mcpPos(vessel($('#cV').value)).map(p => `<option value="${p}">${p === 'CE' ? 'Central' : p}</option>`).join(''); };
  $('#cOk').onclick = async () => {
    // aceita MPa (ex.: 1,72) ou kgf/cm² (ex.: 17,5): acima de 4 é kgf/cm² e é gravado em MPa, como no manual (SM p. 2-3)
    const emMPa = v => { const n = numBR(v); return n != null && n > 4 ? (n / 10.197).toFixed(2).replace('.', ',') : v; };
    const vals = [...document.querySelectorAll('[data-cc]')].map(i => emMPa(i.value.trim())), dv = $('#cD').value;
    if (!dv) return toast('Informe a data.'); if (vals.filter(Boolean).length < 6) return toast('Informe os 6 cilindros.');
    if (vals.some(v => numBR(v) == null || numBR(v) < 0.3 || numBR(v) > 4)) return toast('Confira os valores: MPa (ex.: 1,72) ou kgf/cm² (ex.: 17,5).');
    const hv = $('#cH').value.trim();
    await saveRec({ id: uid('comp'), kind: 'comp', vessel: $('#cV').value, pos: $('#cP').value, date: dv, h: hv === '' ? null : +hv.replace(/\D/g, ''), vals, rpm: $('#cR').value.trim(), by: S.session.name });
    closeModal(); toast('Ensaio de compressão registrado.'); render();
  };
}
// dados de exemplo da compressão (só para a demonstração; somem em "Limpar dados de exemplo")
function exemploComp() {
  const R = rnd(7031); let out = [];
  S.cfg.frota.forEach((v, i) => mcpPos(v).forEach((pos, j) => {
    const hr = horAtual(v.id, pos); if (!hr) return;
    let b = recs('base').find(r => r.vessel === v.id && r.pos === pos && r.item === '1.1.12' && r.seed);
    if (!b) { const d = pD(hr.date); d.setDate(d.getDate() - 20 - Math.round(R() * 120));   // exemplo antigo sem o 1.1.12: última medição a partir do horímetro atual
      b = { id: 'ex-base-' + v.id + pos + '1.1.12', kind: 'base', vessel: v.id, pos, item: '1.1.12', h: Math.max(1200, Math.round(hr.h - 300 - R() * 700)), date: isoD(d), seed: true }; out.push(b); }
    const k = i * 2 + j, base = 1.68 + R() * 0.12, taxa = [0.05, 0.03, 0.09, 0.02, 0.04, 0.16, 0.03, 0.06][k % 8];
    const fraco = k === 5 ? 0.30 : k === 2 ? 0.16 : k === 9 ? 0.2 : 0;
    for (let n = 2; n >= 0; n--) {
      const h = b.h - n * 1000; if (h <= 0) continue;
      const dt = pD(b.date); dt.setDate(dt.getDate() - n * 105);
      const vals = [0, 1, 2, 3, 4, 5].map(c => (base - (2 - n) * taxa - (c === 3 ? fraco * (3 - n) / 3 : 0) - R() * 0.05).toFixed(2).replace('.', ','));
      out.push({ id: 'ex-comp-' + v.id + pos + n, kind: 'comp', vessel: v.id, pos, date: isoD(dt), h, vals, rpm: '120', seed: true });
    }
    out.push({ id: 'ex-base-' + v.id + pos + '1.1.28', kind: 'base', vessel: v.id, pos, item: '1.1.28', h: Math.max(150, hr.h - 4000 - Math.round(R() * 6000)), date: isoD(addM(hoje(), -24 - Math.round(R() * 30))), seed: true });
  }));
  const ativo = m => { const v = vessel(m.split('|')[0]); return v && !(typeof foraOp === 'function' && foraOp(v)); };   // casos de exemplo: fora do limite, atenção, vencido, sem ensaio
  const mot = [...new Set(out.filter(r => r.kind === 'comp').map(r => r.vessel + '|' + r.pos))].filter(ativo);
  const de = k => out.filter(r => r.kind === 'comp' && r.vessel + '|' + r.pos === mot[k]).sort((a, b) => a.h - b.h), br = x => x.toFixed(2).replace('.', ',');
  if (mot[0]) { const L = de(0); L[L.length - 1].vals[3] = '1,21'; }                                                     // fora do limite (cil. 4)
  if (mot[3]) de(3).forEach((r, i) => { r.vals = [1.80, 1.50 - i * 0.005, 1.79, 1.80, 1.78, 1.80].map(br); });           // atenção: cil. 2 ~0,3 MPa abaixo dos outros (acima de 0,18), estável
  if (mot[6]) de(6).forEach(r => { if (r.h - 1400 > 0) r.h -= 1400; });                                                  // ensaio vencido
  if (mot[8]) out = out.filter(r => !(r.kind === 'comp' && r.vessel + '|' + r.pos === mot[8]));                           // sem ensaio
  return out;
}
/* =====================================================================
   DOCAGEM (Anexo I, item 9.1.5 – 5 anos) · data-limite do CSN prevalece
   ===================================================================== */
// junto: itens que exigem o empurrador fora d'água – ajustar com o Supervisor; janela: vencem até 6 meses depois da docagem
const DOCA = { item: '9.1.5', planejarMeses: 12, janela: 6, junto: ['1.8.4'] };
function docaLim(vid) { let b = null; recs('doclim').forEach(r => { if (r.vessel === vid && (!b || r.updatedAt > b.updatedAt)) b = r; }); return b; }
function docaVessel(v) {
  const t = A1M[DOCA.item], iv = intervalo(t), L0 = ultimoServico(v.id, 'UN', DOCA.item), lim = docaLim(v.id);
  // inspeção sem necessidade de docar (SMF 3.32): não é docagem (a última docagem continua a real), mas leva o vencimento para a próxima avaliação; o CSN continua valendo
  const insp = L0 && L0.insp ? L0 : null, HR = insp && typeof docaHist === 'function' ? docaHist(v) : [], L = insp ? (HR.length ? { date: HR[HR.length - 1].ent, src: 'base' } : null) : L0;
  let due = insp ? (insp.prox ? pD(insp.prox) : addM(pD(insp.date), iv.m)) : L && iv.m ? addM(pD(L.date), iv.m) : null, fonte = insp ? 'Inspeção de ' + brD(insp.date) + ' · sem necessidade de docar' : 'Anexo I (' + iv.m + ' meses)';
  if (lim && lim.date) { const d = pD(lim.date); if (!due || d < due) { due = d; fonte = 'Certificado (CSN)'; } }
  const dias = due ? Math.floor((due - hoje()) / 864e5) : null;
  const st = !due ? 'sem' : dias < 0 ? 'venc' : dias <= DOCA.planejarMeses * 30.4 ? 'viag' : 'ok';
  // itens que só se faz (ou é melhor fazer) com o empurrador fora d'água e vencem até 12 meses depois da docagem
  const junto = [];
  if (due) { const ate = addM(due, DOCA.janela); DOCA.junto.forEach(id => { const ti = A1M[id]; if (!ti) return; posicoes(v).forEach(pos => { if (!aplica(v, pos, ti)) return; const s = situacao(v, pos, ti); const alvo = s.alvoD || null; const perto = (due - hoje()) / 864e5 <= DOCA.planejarMeses * 30.4; if ((perto && (s.st === 'venc' || s.st === 'sem')) || (alvo && alvo >= addM(due, -DOCA.planejarMeses) && alvo <= ate)) junto.push({ id, pos, nm: ti.chk, s }); }); }); }
  const r = { v, L, insp, lim, due, dias, st, fonte, junto, om: omAberta(v.id, 'UN', DOCA.item) }; if (foraOp(v)) { r.st = 'sem'; r.fora = true; } return r;
}
/* Docagem num bloco só (24/10/2026): aparece dentro de Calibração e docagem e mostra só o cronograma (docaCrono); antes a tela montava contadores,
   cronograma antigo e escopo, e duas camadas trocavam e apagavam */
function vDoca() {
  const D = S.cfg.frota.map(docaVessel);
  return `<div class="vh"><div><h1>Docagem</h1><p>Anexo I, item 9.1.5: docagem a cada ${intervalo(A1M[DOCA.item]).m / 12} anos (jateamento, medição de espessura por ultrassom e repintura). Quando o certificado do empurrador (CSN) tiver uma data-limite de vistoria em seco anterior, ela prevalece. "Planejar" = vence nos próximos ${DOCA.planejarMeses} meses.</p></div><span class="sp"></span></div>
  ` + docaCrono(D);
}
function docaModal(vid) {
  const x = docaVessel(vessel(vid));
  modal(`<div class="row"><h2>${esc(x.v.nome)} · docagem</h2><span class="sp"></span><button class="mbtn" data-close>Fechar</button></div>
   <div class="row"><span class="pill ${{ venc: 'p-bad', viag: 'p-warn', ok: 'p-ok', sem: 'p-mut' }[x.st]}">${{ venc: 'Vencida', viag: 'Planejar', ok: 'Em dia', sem: 'Sem registro' }[x.st]}</span><span>${x.due ? 'Limite ' + brD(isoD(x.due)) + ' · ' + x.fonte : 'Sem data'}</span></div>
   <div class="tw"><table class="t"><tbody>
    <tr><td>Última docagem</td><td>${x.L ? brD(x.L.date) + (x.L.src && x.L.src.startsWith('om:') ? ' · ' + x.L.src.slice(3) : '') : '—'}</td><td><button class="mbtn sm" data-base="${vid}|UN|${DOCA.item}">Registrar</button></td></tr>
    ${x.insp ? `<tr><td>Última inspeção · sem necessidade de docar</td><td>${brD(x.insp.date)}${x.insp.om ? ' · OM ' + esc(x.insp.om) : ''}${x.insp.obs ? '<div class="note">' + esc(x.insp.obs) + '</div>' : ''}</td><td></td></tr>` : ''}
    <tr><td>Data-limite da vistoria em seco no CSN</td><td>${x.lim && x.lim.date ? brD(x.lim.date) + (x.lim.obs ? ' · ' + esc(x.lim.obs) : '') : '—'}</td><td><button class="mbtn sm" id="dlEd">Informar</button></td></tr>
   </tbody></table></div>
   ${x.junto.length ? `<h3 style="margin:4px 0 0;font-size:14px">Incluir no escopo da docagem</h3><div class="tw"><table class="t"><tbody>${x.junto.map(j => `<tr><td>${posTag(j.pos)}</td><td class="mono">${j.id}</td><td>${esc(j.nm)}</td><td>${pillSt(j.s.st)} <span class="note">${esc(j.s.txt || '')}</span></td></tr>`).join('')}</tbody></table></div>` : ''}
   <div class="row end"><a class="mbtn pri" href="#emitir/${vid}" data-close>Emitir OM</a></div>`, true);
  $('#modal').addEventListener('click', e => { const bs = e.target.closest('[data-base]'); if (bs) baseModal(...bs.dataset.base.split('|')); });
  $('#dlEd').onclick = () => {
    if (!precisa(false)) return;
    modal(`<h2>Data-limite do CSN · ${esc(x.v.nome)}</h2><p class="note">Data até a qual o empurrador precisa passar pela vistoria em seco, conforme o Certificado de Segurança da Navegação. Deixe em branco para usar só o prazo do Anexo I.</p>
     <div class="g"><label class="f s3">Data-limite<input id="dlD" type="date" value="${x.lim ? x.lim.date || '' : ''}"></label><label class="f s3">Observação (nº do certificado, CP/AG)<input id="dlO" value="${esc(x.lim ? x.lim.obs || '' : '')}"></label></div>
     <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="dlOk">Salvar</button></div>`);
    $('#dlOk').onclick = async () => { await saveRec({ id: uid('doclim'), kind: 'doclim', vessel: vid, date: $('#dlD').value, obs: $('#dlO').value.trim(), by: S.session.name }); closeModal(); toast('Data-limite salva.'); render(); };
  };
}
AFTER.doca = () => { $('#main').onclick = e => { const b = e.target.closest('[data-doca]'); if (b) docaModal(b.dataset.doca); }; };
/* =====================================================================
   FALHAS E MITIGAÇÃO (corretivas – Anexo II-A)
   Pareto por sistema, componentes com maior frequência de falha, reincidência e
   acompanhamento das medidas de mitigação (campo A9)
   ===================================================================== */
let FALPER = 12;
const REINC_DIAS = 180;
const pDT = s => { if (!s) return null; const d = pD(s); return d; };
function falhasDados(meses) {
  const ini = addM(hoje(), -meses);
  const C = oms().filter(o => o.tipo === 'C' && o.abertura && pDT(o.abertura) >= ini);
  C.forEach(o => {
    const a = pDT(o.abertura), l = o.liberacao ? pDT(o.liberacao) : null;
    o._h = l && a ? Math.max(0, (l - a) / 36e5) : null;
    o._comp = (o.equip || '').trim() || (o.descricao || '').trim().split(/[,.;(]/)[0];
  });
  // reincidência: mesmo empurrador + mesmo sistema (+ mesmo componente, se informado) em até 180 dias antes
  const todas = oms().filter(o => o.tipo === 'C' && o.abertura);
  const compK = o => ((o.equip || '').trim() || (o.descricao || '').trim().split(/[,.;(:]/)[0]).toLowerCase();
  C.forEach(o => {
    const a = pDT(o.abertura), k = compK(o);
    o._reinc = todas.find(p => p !== o && p.vessel === o.vessel && p.sistema === o.sistema && compK(p) === k && pDT(p.abertura) < a && (a - pDT(p.abertura)) / 864e5 <= REINC_DIAS) || null;
  });
  return C;
}
function mitigSit(o) {
  const ca = o.classe === 'Crítica' || o.classe === 'Alta';
  if (!(o.mitig || '').trim()) return ca ? { k: 'falta', t: 'Sem medida', c: 'p-bad' } : { k: 'nd', t: 'Não definida', c: 'p-mut' };
  if (o.mitigSt === 'Concluída') return { k: 'ok', t: 'Concluída', c: 'p-ok' };
  if (o.mitigPrazo && pD(o.mitigPrazo) < hoje()) return { k: 'atraso', t: 'Atrasada', c: 'p-bad' };
  return { k: 'and', t: o.mitigSt === 'Em andamento' ? 'Em andamento' : 'Pendente', c: 'p-warn' };
}
// dados de exemplo: mais corretivas (com repetições) e medidas de mitigação
const EX_MITIG = {
  'Mangueira de alta pressão do governo com vazamento': ['Mangueira de alta pressão do governo', 'Mangueira vencida (mais de 4 anos)', 'Trocar as mangueiras do governo com mais de 4 anos em toda a frota', 'Encarregado de oficina', 'Concluída'],
  'Perda de pressão de óleo do MCP, parada imediata': ['Bomba de óleo do MCP', 'Pescador da bomba de óleo obstruído por borra', 'Reduzir o intervalo de troca de óleo e incluir a inspeção do cárter na revisão', 'Supervisor de Manutenção', 'Concluída'],
  'MCA sem excitação, blackout parcial': ['Regulador de tensão do MCA', 'Regulador queimado por umidade', 'Instalar proteção contra respingos no quadro do MCA', 'Eletricista', 'Concluída'],
  'Reversor patinando em ré': ['Embreagem do reversor', 'Discos de embreagem gastos', 'Medir pressão de embreagem a cada troca de óleo do reversor', 'Supervisor de Manutenção', 'Concluída'],
  'Água no separador Racor acima do normal': ['Filtro separador Racor', 'Água no combustível do fornecedor', 'Drenar o Racor 2 vezes ao dia', 'Comandantes', 'Concluída'],
  'Superaquecimento do MCP (rotor da bomba de água bruta)': ['Bomba de água bruta', 'Rotor gasto', 'Trocar o rotor a cada 1.000 h', 'Supervisor de Manutenção', 'Concluída'],
  'Bomba de porão sem escorva com entrada de água': ['Bomba de porão', 'Válvula de pé travada', 'Testar as bombas de porão semanalmente com registro', 'Comandantes', 'Concluída'],
  'Correia do alternador rompida': ['Correia do alternador', 'Correia fora do padrão', 'Padronizar a correia no estoque', 'Almoxarifado', 'Concluída'],
  'Descarga do sanitário com vazamento': ['Descarga do sanitário', 'Vedação ressecada', '', '', ''],
  'Luz de navegação de boreste apagada': ['Luz de navegação', 'Lâmpada queimada sem reserva a bordo', 'Manter kit de lâmpadas reserva a bordo', 'Comandantes', 'Em andamento'],
  'Vazamento no tubo de alta pressão de combustível': ['Tubo de alta pressão de combustível', 'Abraçadeira de fixação solta, vibração', '', '', ''],
};
function completarExemploAntigo() { const out = []; oms().forEach(o => { if (o.seed && o.tipo === 'C') ['descricao', 'equip', 'causa', 'mitig'].forEach(k => { if (typeof o[k] === 'string' && /salgad/i.test(o[k])) { o[k] = o[k].replace(/água salgada/gi, 'água bruta'); if (!out.includes(o)) out.push(o); } }); if (!o.seed || o.tipo !== 'C' || o.mitigSt !== undefined) return; const m = EX_MITIG[o.descricao]; if (!m) return; Object.assign(o, { equip: o.equip || m[0], causa: o.causa || m[1], mitig: m[2], mitigResp: m[3], mitigPrazo: m[2] ? isoD(addM(pDT(o.abertura), 2)) : '', mitigSt: m[4] }); out.push(o); }); return out; }
function exemploFalhas() {
  const d0 = hoje(), out = [];
  const L = [
    [300, 'v3', 'BB', 'Alta', '1.0 Sistema de Propulsão', 'Bomba de água bruta', 'Superaquecimento do MCP: rotor da bomba de água bruta desgastado', 9, 'Rotor de borracha ressecado, sem troca preventiva', 'Incluir troca do rotor da bomba de água bruta a cada 1.000 h no Anexo I e manter 2 rotores em estoque', 'Supervisor de Manutenção', 220, 'Concluída'],
    [230, 'v9', 'BE', 'Alta', '1.0 Sistema de Propulsão', 'Correia do alternador', 'Correia do alternador rompida', 4, 'Tensão acima do especificado e correia fora do padrão', 'Treinar CTFs na verificação da tensão (10–15 mm) e padronizar a correia no estoque', 'Supervisor de Manutenção', 150, 'Concluída'],
    [205, 'v2', 'UN', 'Alta', '2.0 Manobrabilidade e Governo', 'Mangueira de alta pressão do governo', 'Mangueira de alta pressão do governo com vazamento', 8, 'Mangueira roçando na estrutura, sem proteção', 'Instalar protetor espiral e abraçadeiras nas mangueiras do governo de toda a frota', 'Encarregado de oficina', 120, 'Em andamento'],
    [140, 'v7', 'UN', 'Média', '6.0 Alimentação de Combustível', 'Filtro separador Racor', 'Racor saturado, motor falhando', 6, 'Combustível com água acima do normal no fornecedor', 'Drenar Racor 2× ao dia na viagem e cobrar laudo do fornecedor', 'Comandantes', 60, 'Concluída'],
    [70, 'v4', 'BB', 'Alta', '1.0 Sistema de Propulsão', 'Correia do alternador', 'Correia do alternador rompida em viagem', 5, 'Polia do alternador desalinhada', 'Verificar alinhamento das polias na próxima preventiva de 250 h de todos os MCPs', 'Supervisor de Manutenção', -20, 'Pendente'],
    [52, 'v3', 'BE', 'Alta', '1.0 Sistema de Propulsão', 'Bomba de água bruta', 'Superaquecimento do MCP BE, rotor quebrado', 12, 'Rotor de lote com defeito', '', '', null, ''],
    [33, 'v11', 'UN', 'Média', '3.0 Geração Elétrica de Bordo', 'Bateria de partida', 'Bateria sem carga na partida do MCA', 3, 'Bateria com mais de 3 anos', 'Criar controle de idade das baterias e trocar com 3 anos', 'Supervisor de Manutenção', 40, 'Em andamento'],
    [14, 'v2', 'UN', 'Alta', '2.0 Manobrabilidade e Governo', 'Mangueira de alta pressão do governo', 'Nova mangueira do governo com vazamento na conexão', 7, 'Terminal mal crimpado', '', '', null, ''],
  ];
  let n = 47950;
  L.forEach(([dias, vid, pos, cl, sis, equip, desc, dur, causa, mitig, resp, prazoDias, st]) => { pos = fixP(vid, pos);
    if (!vessel(vid)) return;
    const a = new Date(d0); a.setDate(a.getDate() - dias); a.setHours(8 + dias % 8, 10); const lib = new Date(a.getTime() + dur * 3600e3);
    const pz = prazoDias == null ? '' : isoD(new Date(d0.getTime() + prazoDias * 864e5));
    out.push({ id: 'ex-omf-' + (++n), kind: 'om', tipo: 'C', num: String(n), vessel: vid, pos, status: 'encerrada', abertura: isoDT(a), sistema: sis, equip, classe: cl, rnc: cl === 'Alta' ? 'RNC-2026-0' + (n - 47900) : '', descricao: desc, causa, mitig, mitigResp: resp, mitigPrazo: pz, mitigSt: st, interd: 'N/A', inicio: isoDT(new Date(a.getTime() + 1800e3)), termino: isoDT(new Date(lib.getTime() - 1800e3)), liberacao: isoDT(lib), resultado: 'Conforme', fotos: [{ tipo: 'ANTES', leg: 'Condição encontrada' }, { tipo: 'DEPOIS', leg: 'Após a intervenção' }], fechadoAt: lib.getTime(), seed: true, updatedAt: lib.getTime(), createdAt: a.getTime() });
  });
  return out;
}
/* =====================================================================
   HORÍMETRO · lançamento em dia, horas por mês e leituras inconsistentes
   (o horímetro é a base de todos os vencimentos por hora)
   ===================================================================== */
const HOR = { ok: 7, aten: 14, maxDia: 24 };
let HORPOS = 'BB';
function horDados() {
  return S.cfg.frota.map(v => {
    const ps = posicoes(v).filter(p => p !== 'UN');
    const ult = ps.map(p => ({ p, r: horAtual(v.id, p) })).filter(x => x.r);
    const last = ult.reduce((m, x) => !m || x.r.date > m ? x.r.date : m, null);
    const dias = last ? Math.floor((hoje() - pD(last)) / 864e5) : null;
    const st = dias == null ? 'sem' : dias <= HOR.ok ? 'ok' : dias <= HOR.aten ? 'viag' : 'venc';
    return { v, ps, ult, last, dias, st };
  }).filter(x => !foraOp(x.v)).map(x => { const ult = x.ult.filter(u => !u.r.est); if (ult.length === x.ult.length) return x;   // estimativa não conta como leitura
    const last = ult.reduce((m, u) => !m || u.r.date > m ? u.r.date : m, null), dias = last ? Math.floor((hoje() - pD(last)) / 864e5) : null;
    const st = dias == null ? (ult.length || x.ps.some(p => !horEst(x.v, p)) ? 'sem' : 'ok') : dias <= HOR.ok ? 'ok' : dias <= HOR.aten ? 'viag' : 'venc';
    return Object.assign(x, { ult: x.ult, last, dias, st, est: x.ps.filter(p => horEst(x.v, p)) }); });
}
function horSuspeitos() {
  const out = [];
  S.cfg.frota.forEach(v => mcpPos(v).concat(MCAS).forEach(p => {
    const L = recs('hor').filter(r => r.vessel === v.id && r.pos === p).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.h - b.h);
    let a = L[0]; // compara sempre com o último lançamento bom (o errado não vira referência)
    for (let i = 1; i < L.length; i++) {
      const b = L[i], d = Math.max(1, (pD(b.date) - pD(a.date)) / 864e5);
      if (b.h < a.h) out.push({ v, p, r: b, ant: a, t: 'Horímetro menor que o anterior (' + nf(a.h - b.h) + ' h a menos)' });
      else if ((b.h - a.h) / d > HOR.maxDia) out.push({ v, p, r: b, ant: a, t: 'Salto de ' + nf(b.h - a.h) + ' h em ' + Math.round(d) + ' dia(s): mais de ' + HOR.maxDia + ' h por dia' });
      else a = b;
    }
  }));
  return out.sort((a, b) => a.r.date < b.r.date ? 1 : -1);
}
function horasMes(vid, pos, nMeses) {
  const fim = m => { const d = new Date(hoje().getFullYear(), hoje().getMonth() - m + 1, 0); return isoD(d); };
  const hEm = date => { const r = horEm(vid, pos, date); return r ? r.h : null; };
  const out = [];
  for (let m = nMeses - 1; m >= 0; m--) {
    const ini = isoD(new Date(hoje().getFullYear(), hoje().getMonth() - m, 1)), cur = horAtual(vid, pos);
    const a = hEm(fim(m + 1)), b = m === 0 ? (cur && cur.date >= ini ? cur.h : null) : hEm(fim(m));
    out.push(a != null && b != null && b >= a ? b - a : null);
  }
  return out;
}
/* Horímetros num bloco só (24/10/2026): pendências de horímetro e horas do MCP entram direto (antes eram 2 camadas por cima) */
function vHor() {
  const D = horDados(), n = { ok: 0, viag: 0, venc: 0, sem: 0 }; D.forEach(x => n[x.st]++);
  const sus = horSuspeitos(), SO = { venc: 0, sem: 1, viag: 2, ok: 3 };
  D.sort((a, b) => SO[a.st] - SO[b.st] || (b.dias || 0) - (a.dias || 0));
  const X = d => Math.min(100, d / 30 * 100);
  const linhas = D.map(x => {
    const tag = x.st === 'venc' ? '<span class="pill p-bad">desatualizado</span>' : x.st === 'viag' ? '<span class="pill p-warn">atenção</span>' : x.st === 'sem' ? '<span class="pill p-mut">sem lançamento</span>' : '';
    const pos = x.ult.map(u => `<span class="hpos" data-tip="${u.p}: ${nf(u.r.h)} h em ${brD(u.r.date)}">${u.p === 'POPA' ? 'Popa' : u.p} <b>${nf(u.r.h)}</b></span>`).join('');
    return `<div class="rkrow hrrow"><div class="rklb"><b>${esc(x.v.nome)}</b> ${tag}<div class="note">${x.last ? 'último lançamento ' + brD(x.last) + ' · há ' + x.dias + (x.dias === 1 ? ' dia' : ' dias') : 'nenhum horímetro lançado'}</div></div>
     <div class="hrtr"><i class="hrbar" style="width:${x.dias == null ? 100 : Math.max(1.5, X(x.dias))}%;background:${CORST[x.st]}"></i></div>
     <div class="hrps">${pos}</div><button class="mbtn sm" data-act="lancarHor" data-v="${x.v.id}">⏱ Lançar</button></div>`;
  }).join('');
  const NM = 6, meses = []; for (let m = NM - 1; m >= 0; m--) { const d = new Date(hoje().getFullYear(), hoje().getMonth() - m, 1); meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + (m === 0 ? ' (parcial)' : '')); }
  const posDe = v => HORPOS === 'BB' ? mcpPos(v)[0] : HORPOS === 'BE' ? (v.mcp === 'mono' ? null : 'BE') : (v.mca[HORPOS] ? HORPOS : null);
  const tab = S.cfg.frota.filter(v => posDe(v)).map(v => ({ v, hm: horasMes(v.id, posDe(v), NM) }));
  const maxH = Math.max(1, ...tab.flatMap(t => t.hm.slice(0, -1).filter(x => x != null)));
  const diasMes = m => new Date(hoje().getFullYear(), hoje().getMonth() - m + 1, 0).getDate();
  const ultFech = NM - 2; // último mês fechado
  const ativo = tab.map(t => t.hm[ultFech]).filter(x => x != null);
  const frotaMes = ativo.reduce((a, b) => a + b, 0);
  return `<div class="vh"><div><h1>Controle de horímetros (FR 027_L)</h1><p>O horímetro é a base de todos os vencimentos por hora: se ele está atrasado, o painel mostra itens "em dia" que já venceram. Em dia = lançado nos últimos ${HOR.ok} dias · atenção até ${HOR.aten} dias · depois disso, desatualizado.</p></div><span class="sp"></span><button class="mbtn pri" data-act="lancarHor">⏱ Registrar horímetros</button></div>
  <div class="kgrid six">
   ${horPendCard() || ''}<div class="card mini ok"><b>${n.ok}</b><span>empurradores com horímetro em dia (≤ ${HOR.ok} dias)</span></div>
   <div class="card mini ${n.viag ? 'warn' : 'ok'}"><b>${n.viag}</b><span>atenção (${HOR.ok + 1} a ${HOR.aten} dias)</span></div>
   <div class="card mini ${n.venc + n.sem ? 'bad' : 'ok'}"><b>${n.venc + n.sem}</b><span>leituras desatualizadas ou ausentes</span></div>
   <div class="card mini ${sus.length ? 'bad' : 'ok'}"><b>${sus.length}</b><span>leituras inconsistentes</span></div>
   <div class="card mini"><b>${nf(frotaMes)}</b><span>horas ${HORPOS === 'BB' ? 'de MCP (BB ou central)' : HORPOS === 'BE' ? 'de MCP BE' : 'do ' + HORPOS} da frota em ${meses[ultFech]}</span></div>
   <div class="card mini"><b>${ativo.length ? nf(Math.round(frotaMes / ativo.length / diasMes(1) * 10) / 10) : '—'}</b><span>média de horas por dia, por empurrador (${meses[ultFech]})</span></div>
  </div>
  ${horMcpCard()}<div class="card"><div class="row"><h2>A · Última leitura por empurrador</h2><span class="sp"></span><span class="note">Barra = dias desde o último lançamento (escala até 30 dias).</span></div>
   <div class="rk">${linhas}</div></div>
  <div class="two">
   <div class="card"><div class="row"><h2>B · Horas de operação por mês</h2><span class="sp"></span><div class="seg">${[['BB', 'MCP BB/central'], ['BE', 'MCP BE'], ['MCA1', 'MCA1'], ['MCA2', 'MCA2'], ['MCA3', 'MCA3']].map(([p, l]) => `<button data-horpos="${p}" class="${p === HORPOS ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="tw"><table class="t hmt"><thead><tr><th>Empurrador</th>${meses.map(m => `<th class="c">${m}</th>`).join('')}<th class="c">h/dia</th></tr></thead><tbody>
    ${tab.map(t => { const ref = t.hm[ultFech]; return `<tr><td><b>${esc(t.v.nome)}</b></td>${t.hm.map((h, i) => `<td class="c" style="${h != null && i < NM - 1 ? `background:rgba(26,115,232,${(0.06 + h / maxH * 0.32).toFixed(2)})` : ''}">${h == null ? '<span class="mut">—</span>' : nf(h)}</td>`).join('')}<td class="c mono">${ref != null ? (ref / diasMes(1)).toFixed(1).replace('.', ',') : '—'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="note">Horas do mês = horímetro no fim do mês − horímetro no fim do mês anterior (último lançamento até a data). O KPI de horas de operação da NP 055 usa o MCP BB. "—" = sem lançamento suficiente.</p></div>
   <div class="card"><div class="row"><h2>C · Leituras inconsistentes</h2></div>
    ${sus.length ? `<div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Motor</th><th>Data</th><th>Lançado</th><th>Anterior</th><th>Problema</th>${can.admin() ? '<th></th>' : ''}</tr></thead><tbody>
    ${sus.map(s => `<tr><td><b>${esc(s.v.nome)}</b></td><td>${s.p}</td><td>${brD(s.r.date)}</td><td class="mono">${nf(s.r.h)} h</td><td class="mono note">${nf(s.ant.h)} h · ${brD(s.ant.date)}</td><td><span class="pill p-bad" style="white-space:normal">${esc(s.t)}</span></td>${can.admin() ? `<td><button class="mbtn sm" data-horexc="${s.r.id}">Excluir</button></td>` : ''}</tr>`).join('')}
    </tbody></table></div><p class="note">Provável erro de digitação. Confira no Diário de Máquinas. ${can.admin() ? 'O Supervisor pode excluir o lançamento errado e lançar o certo.' : 'Peça ao Supervisor para excluir o lançamento errado.'}</p>` : '<div class="note">Nenhum lançamento suspeito.</div>'}</div>
  </div>`;
}
AFTER.hor = () => { $('#main').onclick = async e => {
  const p = e.target.closest('[data-horpos]'); if (p) { HORPOS = p.dataset.horpos; render(); return; }
  const x = e.target.closest('[data-horexc]'); if (x) { if (!precisa(true)) return; const r = S.recs.get(x.dataset.horexc); if (!r) return; if (!confirm('Excluir o lançamento de ' + nf(r.h) + ' h de ' + brD(r.date) + '?')) return; r.excluido = true; await saveRec(r); toast('Lançamento excluído.'); render(); }
}; };
// exemplo: dois empurradores atrasados e dois lançamentos com erro de digitação
function exemploHor() {
  const out = [], F = S.cfg.frota;
  const marca = (v, ks) => recs('hor').forEach(r => { if (r.seed && r.vessel === v.id && ks.some(k => r.id.endsWith(r.pos + k))) { r.excluido = true; out.push(r); } });
  if (F[6]) marca(F[6], [1, 8, 15]); if (F[9]) marca(F[9], [1]);
  const ins = (v, p, dias, delta, id) => { if (!v) return; p = fixP(v.id, p); const d = new Date(hoje()); d.setDate(d.getDate() - dias); const ref = horEm(v.id, p, isoD(d)); if (!ref) return; out.push({ id, kind: 'hor', vessel: v.id, pos: p, h: ref.h + delta, date: isoD(d), seed: true, updatedAt: Date.now(), createdAt: Date.now() }); };
  ins(F[3], 'BB', 58, -310, 'ex-hor-sus1'); ins(F[10], 'BE', 93, 1100, 'ex-hor-sus2');
  return out;
}
function vesselModal(vid, filtro) {
  const v = vessel(vid); filtro = filtro || 'pend';
  const p = painelVessel(v).filter(x => filtro === 'todos' ? true : filtro === 'sem' ? x.s.st === 'sem' : ['venc', 'viag'].includes(x.s.st));
  const ord = { venc: 0, viag: 1, sem: 2, ok: 3, cond: 4 }; p.sort((a, b) => ord[a.s.st] - ord[b.s.st] || posicoes(v).indexOf(a.pos) - posicoes(v).indexOf(b.pos));
  modal(`<div class="row"><h2>${esc(v.nome)}</h2><span class="sp"></span><div class="seg" id="vf">${[['pend', 'Vencendo'], ['sem', 'Sem histórico'], ['todos', 'Todos']].map(([k, l]) => `<button data-vf="${k}" class="${k === filtro ? 'on' : ''}">${l}</button>`).join('')}</div><button class="mbtn" data-close>Fechar</button></div>
   <div class="row">${posicoes(v).filter(x => x !== 'UN').map(pos => { const h = horAtual(v.id, pos); return `<span class="pill p-mut">${pos} ${h ? nf(h.h) + ' h · ' + brD(h.date) : 'sem horímetro'}</span>`; }).join('')}<span class="sp"></span><button class="mbtn sm" data-act="lancarHor" data-v="${v.id}">⏱ Lançar horímetro</button><a class="mbtn sm pri" href="#emitir/${v.id}">Emitir OM</a></div>
   <div class="tw" style="max-height:60vh"><table class="t"><thead><tr><th>Pos.</th><th>Nº</th><th>Item</th><th>Prior.</th><th>Intervalo</th><th>Último serviço</th><th>Situação</th><th></th></tr></thead><tbody>
   ${p.map(x => { const iv = intervalo(x.t, x.v, x.pos); return `<tr><td>${posTag(x.pos)}</td><td class="mono">${x.t.id}</td><td>${esc(x.t.chk)}<div class="note">${esc(EQN[x.t.eq])}</div></td><td>${x.t.prio}</td><td class="mono">${[iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' m' : ''].filter(Boolean).join(' ou ') || '—'}</td><td class="mono">${x.s.L ? (x.s.L.h !== null ? nf(x.s.L.h) + ' h · ' : '') + brD(x.s.L.date) : '—'}</td><td>${x.om ? `<a class="pill p-inf" href="#om/${x.om.id}">OM ${esc(x.om.num)}</a>` : pillSt(x.s.st)}<div class="note">${esc(x.s.txt || '')}</div></td><td>${x.t.kind === 'prog' ? `<button class="mbtn sm" data-base="${v.id}|${x.pos}|${x.t.id}">Último serviço</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="8" class="note">Nada neste filtro.</td></tr>'}
   </tbody></table></div>`, true);
  $('#modal').addEventListener('click', e => { const b = e.target.closest('[data-vf]'); if (b) vesselModal(vid, b.dataset.vf); const bs = e.target.closest('[data-base]'); if (bs) baseModal(...bs.dataset.base.split('|')); });
}
function baseModal(vid, pos, item) {
  if (!precisa(false)) return;
  const t = A1M[item], L = ultimoServico(vid, pos, item), hp = posHor(pos, t, vid), h = horAtual(vid, hp);
  modal(`<h2>Último serviço · ${item}</h2><p class="note">${esc(vName(vid))} · ${POSN[pos]} · ${esc(t.chk)}. Use para registrar o ponto de partida de itens feitos antes do SMF. Depois, o próprio encerramento da OM atualiza.</p>
   <div class="g"><label class="f s3">Horímetro do serviço (${hp})<input id="bH" inputmode="numeric" value="${L && L.h !== null ? L.h : h ? h.h : ''}"></label><label class="f s3">Data do serviço<input id="bD" type="date" value="${L ? L.date : isoD(hoje())}"></label></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bOk">Salvar</button></div>`);
  $('#bOk').onclick = async () => { const hv = $('#bH').value.trim(), dv = $('#bD').value; if (!dv) return toast('Informe a data.'); await saveRec({ id: uid('base'), kind: 'base', vessel: vid, pos, item, h: hv === '' ? null : +hv.replace(/\D/g, ''), date: dv, by: S.session.name }); closeModal(); toast('Último serviço registrado.'); vesselModal(vid, 'todos'); };
}

/* =====================================================================
   PROGRAMAÇÃO DA JANELA DE MANUTENÇÃO
   ===================================================================== */
const EM = { sel: new Set(), draft: null, viag: null, mostrar: 'pend' };
async function salvarViagem(vid, h) {
  const v = vessel(vid); if (!v) return; v.viagH = h; v.viagAt = Date.now(); S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg);
  if (S.url && can.admin()) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota } }); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } } catch (e) { } }
}
// Fazer preventiva: vencido · vence no mês (data, ou horas projetadas no ritmo do motor, a mesma conta do cronograma) · vence antes de voltar (adi = só aviso) · em dia
// OM embarcada (NP 7.3): itens que o CTF/MFM executa a bordo na hora-alvo, definidos pelo Supervisor em 22/10/2026 (zincos, reversores e itens de 1.000 h ficam no porto)
const EMBARCA = ['1.1.2', '1.1.3', '1.1.4', '1.1.5', '1.1.7', '1.1.8', '3.1.4', '3.1.5', '3.1.6', '3.1.17', '3.2.3', '3.2.4', '3.2.5'];
function emGrp(v, x) { const s = x.s; if (s.st === 'venc') return 'venc'; if (s.st === 'sem' || s.st === 'cond') return 'sem';
  const fimMes = new Date(hoje().getFullYear(), hoje().getMonth() + 1, 0, 23, 59), hp = posHor(x.pos, x.t, v.id), hr = horAtual(v.id, hp), rate = (typeof horasDiaPos === 'function' && horasDiaPos(v.id, hp)) || horasDia(v.id) || 10;
  const dd = s.alvoD ? new Date(s.alvoD) : null, dh = s.alvoH != null && hr ? new Date(Date.now() + Math.max(0, s.alvoH - hr.h) / rate * 864e5) : null, due = [dd, dh].filter(Boolean).sort((a, b) => a - b)[0];
  return due && due <= fimMes ? 'mes' : s.st === 'viag' ? (EMBARCA.includes(x.t.id) ? 'emb' : 'adi') : 'ok'; }
/* Programar preventiva num bloco só (24/10/2026): antes eram 6 camadas (tela antiga por posição, barra da OM do empurrador, troca de "ficha" por
   "formulário", rota, padrão das telas e 3 passos), e a última jogava fora quase tudo das anteriores. Agora a tela monta direto o que aparece:
   cabeçalho · "O que tem para abrir na frota" (pvFrota) · passo a passo ① empurrador e rota ② o que entra ③ abrir a OM. */
const emTroca = h => h.replace(/(^|[\s>(“"])([Ff])icha(?![\w])/g, (m, a, f) => a + (f === 'F' ? 'Formulário' : 'formulário')).replace(/\b([Aa]) formulário/g, (m, a) => (a === 'A' ? 'O' : 'o') + ' formulário').replace(/\bda formulário/g, 'do formulário').replace(/\bna formulário/g, 'no formulário').replace(/\bpela formulário/g, 'pelo formulário').replace(/\bDa formulário/g, 'Do formulário');
function vEmitir() {
  const v = vessel(ARG || EM.vid || (S.cfg.frota[0] || {}).id); if (!v) return '<div class="empty">Empurrador não encontrado.</div>';
  if (EM.pvVid !== v.id) { EM.pvVid = v.id; EM.passo = EM.pvJump || 1; EM.pvJump = null; EM.pvIni = false; }
  if (EM.draft && EM.draft.emb) EM.passo = 3;
  const P = painelVessel(v, EM.viag ?? viagemDe(v)).filter(x => x.t.kind === 'prog' && !x.om), gr = x => emGrp(v, x), fj = x => typeof foraJanela === 'function' && foraJanela(x.t.id, v, x.pos);
  const entra = P.filter(x => ['venc', 'mes', 'emb'].includes(gr(x)) && !fj(x)), adi = P.filter(x => gr(x) === 'adi' && !fj(x));
  /* um empurrador só na tela inteira (antes, sem empurrador no endereço, o passo a passo mostrava o último aberto e o formulário o primeiro da frota,
     e a OM podia sair para o empurrador errado) */
  const vid = v.id, v0 = v;
  if (EM.vid !== vid) { EM.sel.clear(); EM.draft = null; EM.vid = vid; EM.viag = null; }
  const vh = EM.viag ?? viagemDe(v0);
  if (!EM.pvIni && !EM.sel.size) { entra.forEach(x => EM.sel.add(x.pos + '|' + x.t.id)); EM.pvIni = true; }
  const el = h => { const d = document.createElement('div'); d.innerHTML = h; return d; };
  // ① empurrador, rota e horas da viagem
  const R = rotas(), r = rotaDe(v0);
  const rota = `<label class="f" style="min-width:320px">Rota da próxima viagem (planejada pela duração máxima)<select id="emRota"><option value="">Escolha a rota…</option>${R.map(x => `<option value="${x.id}"${r && r.id === x.id ? ' selected' : ''}>${esc(x.nome)} · até ${x.ciclo} d${x.fonte === 'estimado' ? ' (estimada)' : ''}</option>`).join('')}</select>${r ? `<span class="note" style="font-size:11px">${esc(r.obs)}</span>` : ''}</label>`;
  const emp = el(emTroca(`<label class="f" style="min-width:200px">Empurrador<select id="emV">${S.cfg.frota.map(x => `<option value="${x.id}"${x.id === vid ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
    `) + rota + emTroca(`<label class="f" style="width:230px">Horas previstas da próxima viagem<input type="number" id="emH" value="${vh}" min="0" step="10"><span class="note" style="font-size:11px">${+v0.viagH > 0 ? 'salvo para este empurrador' : 'padrão (' + S.cfg.viagemH + ' h): informe o trecho'} · ~${Math.round(horasDia(v0.id))} h/dia</span></label>
    
    ${interditada(vid) ? '<span class="pill p-bad">Interditada por falha Crítica</span>' : ''}${bloqueioSaida(vid).length ? '<span class="pill p-bad">Saída bloqueada: item Crítico vencido</span>' : ''}`)).innerHTML;
  // óleo e filtros a bordo para a viagem
  const bo = bordoHTML(v0), oleo = bo ? el(bo).firstElementChild.innerHTML : '';
  // ③ texto para o Sankhya e nº da OM (só com a OM sendo aberta)
  let om = '';
  if (EM.draft && EM.draft.emb) { const pt = embPartes(v0); EM.draft.partes = pt; EM.draft.txt = embTexto(v0, pt);
    om = el(emTroca(`<div class="sk" style="margin-top:10px"><b style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--navy)">Texto para abrir a OM no Sankhya</b><div class="skt" id="omTxt">${esc(EM.draft.txt)}</div>
     <div class="row"><button class="mbtn sm" data-act="copiarTxt">Copiar texto</button><span class="note" id="cpM"></span></div>
     <b style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--navy)">Número gerado pelo Sankhya</b>
     <div class="row"><input id="omNum" inputmode="numeric" placeholder="Ex.: 48231" style="width:160px"><button class="mbtn pri" data-act="emitirEmb">Emitir OM e imprimir ficha</button><button class="mbtn" data-act="cancDraft">Cancelar</button><span class="note" id="emE" style="color:var(--badt)"></span></div></div>`)).firstElementChild.outerHTML; }
  const passos = ['Empurrador e rota', 'O que entra', 'Abrir a OM'].map((t, i) => `<div class="gu-p${i + 1 < EM.passo ? ' feito' : i + 1 === EM.passo ? ' atual' : ''}" data-pvpasso="${i + 1}" style="cursor:pointer"><i>${i + 1 < EM.passo ? '✓' : i + 1}</i><span>${t}</span></div>`).join('<div class="gu-l"></div>');
  const nSel = EM.sel.size, cor = { venc: 'p-bad', mes: 'p-warn', emb: 'p-inf', adi: 'p-mut', ok: 'p-mut' }, rot = { venc: 'Vencido', mes: 'Vence no mês', emb: 'Embarcada · CTF/MFM', adi: 'Adiantar?', ok: 'Em dia · adiantar' };
  const doCx = EM.doCx && EM.vid === vid ? P.filter(x => EM.doCx.has(x.pos + '|' + x.t.id) && !entra.includes(x) && !adi.includes(x)) : [];   // vieram do clique no mês do cronograma
  const linha = x => { const k = x.pos + '|' + x.t.id, g = gr(x); return `<tr><td style="width:28px"><input type="checkbox" data-sel="${k}"${EM.sel.has(k) ? ' checked' : ''}></td><td class="mono">${x.t.id}</td><td>${esc(x.t.chk)}</td><td><span class="pill ${cor[g]}">${rot[g]}</span><div class="note">${esc(x.s.txt || '')}</div></td></tr>`; };
  const porPos = L => { const pos = [...new Set(L.map(x => x.pos))]; return pos.map(p => { const I = L.filter(x => x.pos === p), m = I.filter(x => EM.sel.has(x.pos + '|' + x.t.id)).length, c = g => I.filter(x => gr(x) === g).length;
    const res = [['venc', 'vencidos'], ['mes', 'do mês'], ['emb', 'embarcados'], ['adi', 'adiantar?']].filter(([g]) => c(g)).map(([g, l]) => c(g) + ' ' + l).join(' · ');
    return `<details class="pv-d"><summary><b>${p === 'UN' ? 'Empurrador' : esc(posNome(v, p))}</b><span class="note"> · ${I.length} ite${I.length === 1 ? 'm' : 'ns'} (${res})</span><span class="sp"></span><span class="pill ${m ? 'p-ok' : 'p-mut'}">${m} marcado${m === 1 ? '' : 's'}</span></summary><div class="tw"><table class="t">${I.map(linha).join('')}</table></div></details>`; }).join(''); };
  let corpo;
  if (EM.passo === 1) corpo = `<div><h2>① Empurrador e rota</h2>${emp}<div class="row end" style="margin-top:10px"><button class="mbtn pri" data-pvpasso="2">Próximo: o que entra →</button></div></div>`;
  else if (EM.passo === 2) corpo = `<div><div class="row"><h2>② O que entra na OM · ${esc(v.nome)}</h2><span class="sp"></span><span class="pill ${nSel ? 'p-ok' : 'p-mut'}">${nSel} ite${nSel === 1 ? 'm' : 'ns'} marcado${nSel === 1 ? '' : 's'}</span></div>
     <p class="note">Já vem marcado o que tem de entrar: vencidos, do mês e embarcados (o CTF/MFM faz a bordo na hora-alvo). Abra um motor para ver ou desmarcar itens.</p>
     ${entra.length ? porPos(entra) : '<p class="note">Nada vencido, do mês ou embarcado neste empurrador.</p>'}
     ${doCx.length ? `<details class="pv-d" open><summary><b>Do cronograma</b><span class="note"> · ${doCx.length} itens previstos para depois deste mês, escolhidos no cronograma (adiantar)</span></summary>${porPos(doCx)}</details>` : ''}
     ${adi.length ? `<details class="pv-d pv-adi"><summary><b>Adiantar?</b><span class="note"> · ${adi.length} itens vencem antes de voltar (ficam fora da OM; marque se quiser adiantar)</span></summary>${porPos(adi)}</details>` : ''}
     ${bo ? `<details class="pv-d"><summary><b>Óleo e filtros a bordo</b><span class="note"> · para esta viagem (FR 049_B, pelo CTF/MFM)</span></summary>${oleo.replace(/<h2[\s\S]*?<\/h2>/, '')}</details>` : ''}
     <div class="row end" style="margin-top:10px"><button class="mbtn" data-pvpasso="1">← Voltar</button><button class="mbtn pri" data-pvpasso="3" ${nSel ? '' : 'disabled'}>Próximo: abrir a OM com ${nSel} ite${nSel === 1 ? 'm' : 'ns'} →</button></div></div>`;
  else corpo = `<div><h2>③ Abrir a OM · ${esc(v.nome)} · ${nSel} itens</h2>${om || '<p class="note">Volte ao passo 2 e marque os itens.</p>'}<div class="row" style="margin-top:10px"><button class="mbtn" data-pvpasso="2">← Voltar ao que entra</button></div></div>`;
  return `<div class="cm-v"><div class="vh"><div><h1>Programar preventiva</h1><p>O que tem para abrir na frota · monte a OM de um empurrador em 3 passos e abra no Sankhya</p></div><span class="sp"></span><button class="mbtn" data-pvreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button></div>
   <div class="cm-ws">${pvFrota(v)}<div class="card"><div class="row"><h2>${esc(v.nome)} · passo a passo</h2><span class="sp"></span><button type="button" class="mbtn sm" data-pacote="${v.id}">🖨 Ordens de Máquinas</button></div><div class="gu-ps" style="margin:0 0 8px">${passos}</div>${corpo}</div></div></div>`;
}
AFTER.emitir = () => {
  const m = $('#main');
  m.onchange = e => { const t = e.target;
    if (t.id === 'emV') go('emitir/' + t.value);
    if (t.id === 'emH') { EM.viag = Math.max(0, +t.value || 0); salvarViagem(EM.vid, EM.viag); render(); }
    if (t.dataset.sel) { t.checked ? EM.sel.add(t.dataset.sel) : EM.sel.delete(t.dataset.sel); EM.draft = null; render(); } };
  m.onclick = async e => { const t = e.target.closest('button'); if (!t) return; const v = vessel(EM.vid);
    if (t.dataset.emb) { e.stopImmediatePropagation();
      if (t.dataset.emb === 'todos') painelVessel(v, EM.viag ?? viagemDe(v)).filter(x => x.t.kind === 'prog' && ['venc', 'mes', 'emb'].includes(emGrp(v, x)) && !x.om && !foraJanela(x.t.id, x.v || v, x.pos)).forEach(x => EM.sel.add(x.pos + '|' + x.t.id));
      if (t.dataset.emb === 'limpar') EM.sel.clear();
      EM.draft = null;
      if (t.dataset.emb === 'abrir') { if (!precisa(true)) return; EM.draft = { emb: true }; }
      render(); if (EM.draft) setTimeout(() => { const x = $('#omNum'); if (x) { x.focus(); x.scrollIntoView({ block: 'center' }); } }, 40); return; }
    if (t.dataset.act === 'cancDraft') { EM.draft = null; render(); }
    if (t.dataset.act === 'copiarTxt') { try { await navigator.clipboard.writeText(EM.draft.txt); $('#cpM').textContent = 'Copiado.'; } catch (er) { const r = document.createRange(); r.selectNodeContents($('#omTxt')); getSelection().removeAllRanges(); getSelection().addRange(r); $('#cpM').textContent = 'Texto selecionado. Use Ctrl+C.'; } }
    if (t.dataset.act === 'emitirEmb') {
      const n = $('#omNum').value.trim();
      if (!/^\d{3,}$/.test(n)) { $('#emE').textContent = 'Digite o número da OM gerado pelo Sankhya (só números).'; return; }
      if (oms().some(o => o.num === n)) { $('#emE').textContent = 'Já existe uma OM com esse número no SMF.'; return; }
      const pt = EM.draft.partes || embPartes(v); let i = 0;
      for (const p of pt) { const o = { id: uid('om'), kind: 'om', tipo: 'P', num: n, grupo: n, parte: ++i, partes: pt.length, vessel: v.id, pos: p.pos, items: p.ids.slice(), itensProg: p.ids.slice(), status: 'emitida', emitAt: isoD(hoje()), emitBy: S.session.name, alvoH: p.pos === 'UN' ? null : p.alvoH, alvoD: p.alvoD, hEmit: p.hr ? p.hr.h : null, conf: {}, extras: [], fotos: [], exec: 'Equipe de manutenção', execTerra: true, hist: [{ at: Date.now(), by: S.session.name, ev: 'Emitida' }] }; await saveRec(o); }
      EM.sel.clear(); EM.draft = null; toast('OM ' + n + ' emitida para ' + v.nome + '.'); fichaModal(omGrupo(n)[0]); render(); } };
  const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_prev_lay', '[data-pvreset]');
};
function fichaModal(o) {   // Anexo II-B da OM preventiva para imprimir (só é chamada com OM preventiva; a ficha antiga e a de janela saíram)
  const P = o.grupo ? omGrupo(o.grupo) : [o], docs = docIIBOM(P), nm = `Anexo_II-B_OM${o.num}_${vName(o.vessel).replace(/\s+/g, '_')}.pdf`;
  modal(`<div class="row"><h2>Anexo II-B · OM ${esc(o.num)} · ${esc(vName(o.vessel))}</h2><span class="sp"></span><button class="mbtn pri" data-act="pdfIIB">⬇ Baixar PDF para imprimir</button><button class="mbtn" data-close>Fechar</button></div>
   <p class="note">Imprima e entregue à equipe. Ela marca Feito ou Não feito em cada serviço, tira fotos antes e depois e assina. Na volta, lance as fotos e o que foi feito na OM.</p><div class="pdfwrap" id="fichaPrev"></div>`, true);
  previewPages($('#fichaPrev'), docs, 560);
  $('#modal').addEventListener('click', async e => { if (e.target.closest('[data-act="pdfIIB"]')) await baixarPDF(docs, nm); });
}

/* =====================================================================
   ACOMPANHAR (quadro)
   ===================================================================== */


/* =====================================================================
   MATRIZ ANEXO I (consulta)
   ===================================================================== */
const MX = { q: '', sis: '', open: '' };

/* =====================================================================
   SMF · Anexo II (II-B preventiva/preditiva e II-A corretiva)
   ===================================================================== */
function getPath(o, p) { return p.split('|').reduce((a, k) => a == null ? a : a[k], o); }
function setPath(o, p, v) { const ks = p.split('|'); let a = o; ks.slice(0, -1).forEach((k, i) => { if (a[k] == null || typeof a[k] !== 'object') a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; }); a[ks[ks.length - 1]] = v; }
const val = (o, p) => { const v = getPath(o, p); return v == null ? '' : v; };
// campos de formulário ligados ao registro (data-k = caminho)
const fIn = (o, k, lab, cls = 's2', attrs = '') => `<label class="f ${cls}">${lab}<input data-k="${k}" value="${esc(val(o, k))}" ${attrs}></label>`;
const fDT = (o, k, lab, cls = 's2', tipo = 'datetime-local') => `<label class="f ${cls}">${lab}<input type="${tipo}" data-k="${k}" value="${esc(val(o, k))}"></label>`;
const fTA = (o, k, lab, cls = 's6', rows = 3, ph = '') => `<label class="f ${cls}">${lab}<textarea data-k="${k}" rows="${rows}" placeholder="${esc(ph)}">${esc(val(o, k))}</textarea></label>`;
const fRad = (o, k, lab, opts, cls = 's3') => `<div class="f ${cls}" style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em">${lab}<div class="opts">${opts.map(x => `<label><input type="radio" name="${o.id}-${k}" data-k="${k}" value="${esc(x)}" ${val(o, k) === x ? 'checked' : ''}>${esc(x)}</label>`).join('')}</div></div>`;
const fMul = (o, k, lab, opts, cls = 's4') => { const cur = getPath(o, k) || []; return `<div class="f ${cls}" style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em">${lab}<div class="opts">${opts.map(x => `<label><input type="checkbox" data-km="${k}" value="${esc(x)}" ${cur.includes(x) ? 'checked' : ''}>${esc(x)}</label>`).join('')}</div></div>`; };
const fSel = (o, k, lab, opts, cls = 's3') => `<label class="f ${cls}">${lab}<select data-k="${k}"><option value="">Escolha…</option>${opts.map(x => `<option${val(o, k) === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>`;
const sec = (code, t, r = '') => `<div class="sec-h"><code>${code}</code>${t}${r ? `<span class="r">${r}</span>` : ''}</div>`;
function medFora(m, v) { if (v === '' || v == null || m[3] == null) return false; const x = parseFloat(String(v).replace(',', '.')); return isNaN(x) || x < m[3] || x > m[4]; }
function regsDe(o) { const s = new Set(); (o.items || []).forEach(id => A1M[id].regs.forEach(r => s.add(r))); return [...s]; }
const ehPred = o => (o.items || []).some(id => A1M[id].pred);
const tercAnexo = o => o.relTerc === 'Relatório do fornecedor anexo';

/* ---------- listas ---------- */

/* ---------- triagem da corretiva (classe pela tabela 5.5.1) ---------- */
function novaCorretiva() {
  if (!precisa(false)) return;
  const T = { q1: '', q2: '', q3: '' };
  const classe = () => T.q1 === 'Sim' ? 'Crítica' : T.q2 === 'Sim' ? 'Alta' : T.q3 === 'Sim' ? 'Média' : (T.q1 && T.q2 && T.q3) ? 'Baixa' : '';
  const draw = () => { const c = classe(); return `<h2>Nova corretiva · classificação de criticidade (item 5.5.1)</h2>
   <div class="g"><label class="f s3">Empurrador<select id="tV">${S.cfg.frota.map(v => `<option value="${v.id}">${esc(v.nome)}</option>`).join('')}</select></label><label class="f s3">Nº da OM (Sankhya)<input id="tN" inputmode="numeric" placeholder="gerado pelo Sankhya"></label>
    <label class="f s4">Sistema (lista fixa 7.1)<select id="tS"><option value="">Escolha…</option>${SISTEMAS.map(s => `<option>${s}</option>`).join('')}</select></label><label class="f s2">Posição<select id="tP">${optsPos(S.cfg.frota[0].id)}</select></label>
    <label class="f s6">Falha detectada<textarea id="tD" rows="2" placeholder="O que aconteceu, onde, como foi percebido"></textarea></label></div>
   <div class="triage">${[['q1', 'Há risco de incêndio, explosão, avaria estrutural grave (alagamento) ou dano ambiental?'], ['q2', 'A falha afeta a segurança ou a confiabilidade operacional (perda de propulsão, governo, energia, comunicação)?'], ['q3', 'Há degradação funcional, mesmo sem risco iminente?']].map(([k, q], i) => (i === 0 || T[['q1', 'q2'][i - 1]] === 'Não') ? `<div class="q"><b>${q}</b><div class="opts">${['Sim', 'Não'].map(x => `<label><input type="radio" name="${k}" data-tq="${k}" value="${x}" ${T[k] === x ? 'checked' : ''}>${x}</label>`).join('')}</div></div>` : '').join('')}</div>
   <div class="cls">${Object.entries(CLASSES).map(([k, c]) => `<div class="${c && k === classe() ? 'on' : ''}" style="--c:${c.cor};--cb:${c.fundo}"><b>${k}</b><span>Início: ${c.prazo}</span><span>${c.acao}</span></div>`).join('')}</div>
   ${c === 'Crítica' ? '<div class="banner bad">Falha Crítica: o empurrador fica <b>interditado</b> até a liberação formal do Coordenador de Operações e do Supervisor de Manutenção. Comunicação imediata (5.4.1).</div>' : c === 'Alta' ? '<div class="banner ex">Falha Alta: início em até 4 horas e RNC obrigatória.</div>' : ''}
   <div class="note" id="tE" style="color:var(--badt)"></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="tOk" ${c ? '' : 'disabled'}>Abrir corretiva ${c ? '· ' + c : ''}</button></div>`; };
  const keep = () => { const k = {}; ['tV', 'tN', 'tS', 'tD', 'tP'].forEach(i => { const e = $('#' + i); if (e) k[i] = e.value; }); return k; };
  const put = k => Object.entries(k).forEach(([i, v]) => { const e = $('#' + i); if (!e) return; if (i === 'tP') e.innerHTML = optsPos(k.tV); e.value = v; });
  const m = modal(draw(), true);
  m.addEventListener('change', e => { if (e.target.id === 'tV') { $('#tP').innerHTML = optsPos(e.target.value); return; } if (e.target.dataset.tq) { const k = keep(); T[e.target.dataset.tq] = e.target.value; if (e.target.dataset.tq === 'q1' && e.target.value === 'Sim') { T.q2 = T.q3 = ''; } if (e.target.dataset.tq === 'q2' && e.target.value === 'Sim') T.q3 = ''; m.querySelector('.box').innerHTML = draw(); put(k); } });
  m.addEventListener('click', async e => { if (e.target.id !== 'tOk') return;
    const n = $('#tN').value.trim(), s = $('#tS').value, d = $('#tD').value.trim(), c = classe();
    if (!/^\d{3,}$/.test(n)) return $('#tE').textContent = 'Digite o número da OM gerado pelo Sankhya.';
    if (oms().some(o => o.num === n)) return $('#tE').textContent = 'Já existe uma OM com esse número.';
    if (!s) return $('#tE').textContent = 'Escolha o sistema.'; if (!d) return $('#tE').textContent = 'Descreva a falha.';
    const vid = $('#tV').value, pos = $('#tP').value, hr = horAtual(vid, pos === 'UN' ? mpos(vid) : pos), agora = isoDT(hoje());
    const o = { id: uid('om'), kind: 'om', tipo: 'C', num: n, vessel: vid, pos, status: 'aberta', abertura: agora, sistema: s, classe: c, descricao: d, horimetro: hr ? hr.h : '', deteccao: agora, interd: c === 'Crítica' ? 'Sim' : 'N/A', interdDT: c === 'Crítica' ? agora : '', comunicado: c === 'Crítica' || c === 'Alta' ? [] : [], fotos: [], mats: [], medsC: [], hist: [{ at: Date.now(), by: S.session.name, ev: 'Aberta · ' + c }] };
    await saveRec(o); closeModal(); toast('Corretiva ' + n + ' aberta · ' + c + '.'); go('om/' + o.id); });
}

/* ---------- tela da OM ---------- */
let OMV = { id: null, prevT: null };
/* OM num bloco só (24/10/2026): faixa-guia · eletrônicos de navegação (corretiva) · origem · OM (com a verificação de eficácia) · histórico.
   Antes eram 4 camadas por cima do corpo da OM. */
function vOM() {
  const o = S.recs.get(ARG); let h = omCorpo();
  if (!o) return h;
  const ef = omEficaciaHTML(o); if (ef) h = h.replace('<div class="work">', ef + '<div class="work">');
  h = omOrigemHTML(o) + h + omHistHTML(o);
  if (o.kind !== 'om') return h;
  h = guiaOM(o, o.grupo ? omGrupo(o.grupo) : [o]) + h;
  const c = o.tipo === 'C' && typeof tiCard === 'function' ? tiCard(o) : '';
  if (c) { const t = document.createElement('div'); t.innerHTML = h; const gu = t.querySelector('.card.gu'); if (gu) gu.insertAdjacentHTML('afterend', c); else t.insertAdjacentHTML('afterbegin', c); h = t.innerHTML; }
  return h;
}
function omCorpo() {
  const o = S.recs.get(ARG); if (!o) return '<div class="empty">OM não encontrada. Talvez ainda não tenha sincronizado.</div>';
  OMV.id = o.id;
  const fechada = o.status === 'encerrada';
  const et = o.tipo === 'C' ? ETAPAS_C : ETAPAS_P, idx = et.findIndex(x => x[0] === o.status);
  const bar = `<div class="stepsbar">${et.map(([k, l], i) => `<div class="${i < idx || fechada ? 'done' : i === idx ? 'cur' : ''}"><b>${i < idx || fechada ? '✓' : i + 1}</b>${l}</div>`).join('')}</div>`;
  const head = `<div class="vh"><div><h1>OM ${esc(o.num)} · Anexo ${o.tipo === 'C' ? 'II-A Corretiva' : 'II-B ' + (ehPred(o) ? 'Preditiva' : 'Preventiva')}</h1><p>${esc(vName(o.vessel))} · ${POSN[o.pos]} · ${o.tipo === 'C' ? 'Classe ' + esc(o.classe) + ' · aberta ' + brDT(o.abertura) : 'emitida ' + brD(o.emitAt) + (o.alvoH ? ' · hora-alvo ' + nf(o.alvoH) + ' h' : '')}${o.seed ? ' · <span class="pill p-warn">exemplo</span>' : ''}</p></div><span class="sp"></span>
    ${o.tipo === 'P' ? `<button class="mbtn" data-act="ficha">Ficha de bordo</button>` : ''}<button class="mbtn" data-act="pdfAgora">⬇ Baixar PDF</button>${fechada && can.admin() ? '<button class="mbtn bad" data-act="reabrir">Reabrir</button>' : ''}${can.admin() && !fechada ? '<button class="mbtn bad" data-act="excluir">Excluir</button>' : ''}</div>`;
  const ro = fechada || !can.edit();
  return head + bar + (ro ? `<div class="banner info">${fechada ? 'OM encerrada em ' + new Date(o.fechadoAt).toLocaleString('pt-BR') + '. Somente leitura.' : 'Entre para preencher.'}</div>` : '') +
    `<div class="work"><div class="formcol" id="omForm" ${ro ? 'inert' : ''}>${o.tipo === 'C' ? formIIA(o) : formIIB(o)}</div>
     <div class="pdfcol"><div class="pdfbar"><span><b>PDF do Anexo II</b> · A4 · <span id="npg"></span></span><span class="pill p-inf">atualiza enquanto você preenche</span></div><div class="pdfwrap" id="pdfPrev"></div></div></div>`;
}

/* ---------- II-B ---------- */
function formIIB(o) {
  const regs = regsDe(o), pred = ehPred(o), terc = o.exec === 'Terceiro', anexo = tercAnexo(o);
  const ivs = [...new Set((o.items || []).map(id => { const iv = intervalo(A1M[id]); return [iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' meses' : ''].filter(Boolean).join(' ou '); }))].join(' / ');
  const items = (o.items || []).map(id => { const t = A1M[id], c = (o.conf || {})[id] || {}, st = c.steps || [], md = c.meds || [];
    const done = t.steps.length && t.steps.every((_, i) => st[i]), bad = t.meds.some((m, i) => medFora(m, (md[i] || {}).dei));
    return `<div class="item"><div class="item-h"><span class="num">${id}</span><b>${esc(t.chk)}</b><span class="pill p-inf">${t.prio}</span><span class="sp"></span>${bad ? '<span class="pill p-bad">Medida fora</span>' : done ? '<span class="pill p-ok">Passos conferidos</span>' : `<span class="pill p-warn">${st.filter(Boolean).length}/${t.steps.length} passos</span>`}</div>
     <div class="item-b"><div class="spec"><b>${esc(EQN[t.eq])} · ${esc(t.pag)}</b><br>${esc(t.desc)}</div>
     ${t.steps.length ? `<div class="chk">${t.steps.map((s, i) => `<label class="${st[i] ? 'dn' : ''}"><input type="checkbox" data-k="conf|${id}|steps|${i}" ${st[i] ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}</div><div class="row"><button class="mbtn sm" data-allsteps="${id}">Marcar todos os passos</button></div>` : ''}
     ${t.meds.length ? `<div class="tw"><table class="meds"><thead><tr><th>Medição</th><th>Especificado</th><th>Encontrado</th><th>Deixado</th></tr></thead><tbody>${t.meds.map((m, i) => `<tr class="${medFora(m, (md[i] || {}).dei) ? 'out' : ''}"><td>${esc(m[0])}</td><td class="mono">${esc(m[1])} ${m[2]}</td><td><input data-k="conf|${id}|meds|${i}|enc" value="${esc((md[i] || {}).enc || '')}" inputmode="decimal" style="width:84px"></td><td><input class="dv" data-k="conf|${id}|meds|${i}|dei" data-mf="${id}|${i}" value="${esc((md[i] || {}).dei || '')}" inputmode="decimal" style="width:84px"> ${m[2]}</td></tr>`).join('')}</tbody></table></div>` : ''}
     </div></div>`; }).join('');
  return `<div class="card">${sec('B1', 'Identificação', 'preenchido na emissão')}<div class="g">
    <label class="f s2">Nº da OM (Sankhya)<input value="${esc(o.num)}" readonly></label><label class="f s2">Empurrador<input value="${esc(vName(o.vessel))}" readonly></label><label class="f s2">Posição<input value="${POSN[o.pos]}" readonly></label>
    <label class="f s3">Sistema (7.1)<input value="${esc([...new Set((o.items || []).map(id => A1M[id].sis))].join(' / '))}" readonly></label><label class="f s3">Equipamento<input value="${esc([...new Set((o.items || []).map(id => EQN[A1M[id].eq]))].join(' / '))}" readonly></label>
    <label class="f s2">Tipo<input value="${pred ? 'Preditiva' : 'Preventiva'}" readonly></label><label class="f s2">Itens do Anexo I<input value="${(o.items || []).join(', ')}" readonly></label>
    ${fSel(o, 'origem', 'Origem', ['Plano (ClickUp)', 'Tendência na rotina', 'Analista (troca de óleo)', 'CTF', 'Outra'], 's2')}</div></div>
   <div class="card">${sec('B2', 'Programação')}<div class="g">
    <label class="f s2">Intervalo do plano<input value="${esc(ivs)}" readonly></label><label class="f s2">Horímetro previsto<input value="${o.alvoH ? nf(o.alvoH) + ' h' : '—'}" readonly></label><label class="f s2">Data prevista<input value="${o.alvoD ? brD(o.alvoD) : '—'}" readonly></label>
    ${fIn(o, 'hreal', 'Horímetro realizado (h)', 's2', 'inputmode="numeric"')}${fDT(o, 'dreal', 'Data realizada', 's2', 'date')}${fIn(o, 'indispH', 'Empurrador indisponível (h)', 's2', 'inputmode="decimal" placeholder="0 se operou"')}
    <div class="s6" id="prazoB2"></div>${fIn(o, 'justif', 'Justificativa (se fora do prazo)', 's6')}</div></div>
   <div class="card">${sec('B3', 'Condição encontrada (“antes”)')}<div class="g">${fTA(o, 'condEnc', 'Descrição da condição encontrada', 's6', 3, 'O que o executor encontrou antes de intervir')}</div></div>
   <div class="card">${sec('B4', 'Liberações prévias', 'item 5.11')}<div class="g">
    ${fIn(o, 'sesmt', 'Liberação SESMT — responsável', 's3')}${fDT(o, 'sesmtDT', 'Data e hora', 's3')}${fIn(o, 'pt', 'Nº da PT' + (regs.includes('pt') ? ' (obrigatória)' : ''), 's2', 'placeholder="ou N/A"')}
    ${fRad(o, 'terceiroAut', 'Serviço de terceiro', ['Não', 'Sim — autorização da Gerência/Diretoria'], 's4')}${fIn(o, 'scoc', 'Nº SC / OC', 's2')}</div></div>
   <div class="card">${sec('B5', 'Execução', 'itens do Anexo I')}<div class="g">
    ${fRad(o, 'exec', 'Executor', ['Equipe de manutenção', 'Terceiro'], 's2')}${fIn(o, 'execn', 'Nome / função ou empresa / responsável técnico', 's4')}
    ${terc ? fRad(o, 'relTerc', 'Relatório de terceiro (5.8)', ['Relatório do fornecedor anexo', 'Fornecedor não emitiu — Supervisor preenche'], 's4') + fIn(o, 'relNum', 'Nº do relatório', 's2') : ''}
    ${fIn(o, 'rms', 'Nº das Requisições de Material (RMs)', 's3', 'placeholder="separe por vírgula"')}${fDT(o, 'inicio', 'Início da intervenção', 's3')}${fDT(o, 'termino', 'Término da intervenção', 's3')}</div>
    ${anexo ? '<div class="banner info">Relatório do fornecedor anexo: substitui serviços, medições e materiais (item 5.8). Os passos abaixo são opcionais.</div>' : ''}
    ${items}
    ${tabelaLivre(o, 'medsX', 'Outras medições', ['Medição / parâmetro', 'Especificado', 'Como encontrado', 'Como deixado', 'Unidade'])}
    ${tabelaLivre(o, 'mats', 'Materiais e peças aplicados', ['Descrição', 'Qtd.', 'Nº da RM / NF', 'Lote', 'Validade'])}
    ${regs.filter(r => ['lote', 'fr049', 'instr', 'end', 'cert'].includes(r)).length ? `<div class="sec-h" style="margin-top:4px">Registros exigidos por estes itens</div><div class="g">${regs.filter(r => ['lote', 'fr049', 'instr', 'end', 'cert'].includes(r)).map(r => fIn(o, 'reg|' + r, REGN[r], 's3')).join('')}</div>` : ''}
    ${extrasHtml(o)}</div>
   <div class="card">${sec('B6', 'Resíduos', 'item 5.7')}<div class="g">${fRad(o, 'resid', 'Gerou resíduo?', ['Não', 'Sim'], 's2')}${fMul(o, 'residT', 'Tipos', ['Óleo usado', 'Filtros', 'Estopas/panos', 'Metais', 'Outros'], 's4')}${fIn(o, 'fr016', 'Nº FR 016_E', 's2')}</div></div>
   <div class="card">${sec('B7', 'Condição final (“depois”)')}<div class="g">${fTA(o, 'teste', 'Teste funcional realizado', 's6', 2)}${fIn(o, 'criterio', 'Critério de aceitação', 's4')}${fRad(o, 'resultado', 'Resultado', ['Conforme', 'Não conforme'], 's2')}
    ${fRad(o, 'anomalia', 'Anomalia que configure falha?', ['Não', 'Sim — abrir OM corretiva'], 's4')}${fIn(o, 'omCorr', 'Nº da OM corretiva', 's2', 'placeholder="ou N/A"')}</div><div class="note">Não conforme: reabrir a intervenção antes da liberação.</div></div>
   ${pred ? `<div class="card">${sec('B8', 'Manutenção preditiva', 'itens 1.1.29 / 1.1.30')}${tabelaLivre(o, 'predRows', 'Parâmetros monitorados', ['Parâmetro monitorado', 'Valor atual', 'Valor anterior', 'Limite de alerta', 'Tendência (estável / degradando / crítica)'])}
    <div class="g">${fDT(o, 'predProxD', 'Próxima medição — data', 's2', 'date')}${fIn(o, 'predProxH', 'ou horímetro (h)', 's2')}${fRad(o, 'predGera', 'Gera intervenção?', ['Não', 'Sim'], 's2')}${fIn(o, 'predOM', 'Nº da nova OM', 's2')}${fIn(o, 'laudo', 'Nº do laudo do laboratório', 's4')}</div></div>` : ''}
   <div class="card">${sec('B10', 'Registro fotográfico', 'item 5.8 · 4 fotos por folha no PDF')}${fotosHtml(o)}</div>
   <div class="card">${sec('B9', 'Liberação e assinaturas')}<div class="g">${fIn(o, 'ass|exec', 'Executor (nome)', 's3')}${fIn(o, 'ass|cmd', 'Recebido a bordo — Comandante ou Coordenador de Operações (4.7)', 's3')}${fDT(o, 'liberacao', 'Liberação à Operação', 's3')}${fIn(o, 'conferencia', 'Conferência documental (Analista) — nome e data', 's3')}</div>
    ${aprovacaoHtml(o)}</div><div class="card">${sec('HH', 'Horas-homem e custo', 'apropriação de mão de obra e custos (KPI)')}<div class="g">${fIn(o, 'hh', 'Horas-homem (HH)', 's2', 'inputmode="decimal"')}${fIn(o, 'custoMat', 'Peças e materiais (R$)', 's2', 'inputmode="decimal"')}${fIn(o, 'custoServ', 'Serviço de terceiro (R$)', 's2', 'inputmode="decimal"')}</div></div>`;
}
function tabelaLivre(o, k, tit, cols) {
  const rows = getPath(o, k) || [];
  return `<div class="sec-h" style="margin-top:4px">${tit}<span class="r"><button class="mbtn sm" data-addrow="${k}|${cols.length}">+ Linha</button></span></div>
   ${rows.length ? `<div class="tw"><table class="meds"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r, i) => `<tr>${cols.map((c, j) => `<td><input data-k="${k}|${i}|${j}" value="${esc(r[j] || '')}"></td>`).join('')}<td><button class="xbtn" data-delrow="${k}|${i}" aria-label="Remover linha">✕</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="note">Nenhuma linha.</div>'}`;
}
function extrasHtml(o) {
  const ex = o.extras || [];
  return `<div class="sec-h" style="margin-top:6px">Serviços adicionais<span class="r">o que foi feito além do Anexo I</span></div><div class="note">O sistema vem da lista fixa do item 7.1 da NP 055. Não é possível criar sistema novo.</div>
   ${ex.map((x, i) => `<div class="extrow"><label class="f">Sistema (lista fixa 7.1)<select data-k="extras|${i}|sis"><option value="">Escolha…</option>${SISTEMAS.map(s => `<option${s === x.sis ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
     <label class="f">Equipamento / local<input data-k="extras|${i}|eq" value="${esc(x.eq || '')}"></label><button class="xbtn" data-delrow="extras|${i}" aria-label="Remover serviço">✕</button>
     <label class="f full">O que foi feito<textarea data-k="extras|${i}|desc" rows="2">${esc(x.desc || '')}</textarea></label><label class="f full">Material aplicado / RM<input data-k="extras|${i}|mat" value="${esc(x.mat || '')}"></label></div>`).join('')}
   <button class="mbtn sm" data-addextra style="align-self:flex-start">+ Acrescentar serviço fora do Anexo I</button>`;
}
function fotosHtml(o) {
  const f = o.fotos || [];
  return `<div class="note">Quantas fotos precisar. Obrigatório pelo menos uma ANTES e uma DEPOIS, todas com legenda. As fotos ficam neste aparelho até a aprovação e seguem dentro do PDF para o Drive.</div>
   <div class="phgrid">${f.map((x, i) => `<div class="phc"><div class="img">${x.src ? `<img src="${x.src}" alt="Foto ${i + 1}">` : '<div class="note" style="padding:20px">Foto no PDF do Drive</div>'}<span class="no">Foto ${i + 1}</span>${x.fid ? '<span class="ph-nv ok" title="Cópia guardada no Google Drive">☁ no Drive</span>' : x.src ? '<span class="ph-nv" title="Sobe ao Drive quando houver sinal">só neste aparelho</span>' : ''}</div>
     <div class="meta"><select data-k="fotos|${i}|tipo">${['ANTES', 'DURANTE', 'DEPOIS'].map(t => `<option${t === x.tipo ? ' selected' : ''}>${t}</option>`).join('')}</select><input data-k="fotos|${i}|leg" placeholder="Legenda (o que mostra)" value="${esc(x.leg || '')}"><button class="xbtn" data-delrow="fotos|${i}" aria-label="Remover foto">✕</button></div></div>`).join('')}
    <label class="addph cam"><span style="font-size:28px;line-height:1">📷</span>Tirar foto<small>abre a câmera · vai direto para o formulário</small><input type="file" id="addFoto" accept="image/*" capture="environment"></label><label class="addph"><span style="font-size:28px;line-height:1">🖼</span>Da galeria<small>escolher uma ou várias fotos já tiradas</small><input type="file" id="addFoto" accept="image/*" multiple></label></div>`;
}
function gateIIB(o) {
  const g = [], F = fotosPrev(o);
  g.push(['Data da execução', !!o.dreal]);
  if (o.pos !== 'UN') g.push(['Horímetro na execução', !!o.hreal]);
  g.push(['Quem executou', !!(o.execn || '').trim()]);
  g.push(['Foto de antes', F.some(x => x.tipo === 'ANTES')]);
  g.push(['Foto de depois', F.some(x => x.tipo === 'DEPOIS')]);
  return g;
}
function fotosGate(o, g) { const f = o.fotos || []; g.push(['Pelo menos uma foto ANTES', f.some(x => x.tipo === 'ANTES')]); g.push(['Pelo menos uma foto DEPOIS', f.some(x => x.tipo === 'DEPOIS')]); g.push(['Todas as fotos com legenda', f.length > 0 && f.every(x => (x.leg || '').trim())]); }
function aprovacaoHtml(o) {
  if (o.status === 'encerrada') return `<div class="banner info">Aprovada por <b>${esc(o.aprovBy || '')}</b> em ${new Date(o.fechadoAt).toLocaleString('pt-BR')}. ${o.pdfFileId ? 'PDF guardado no Drive.' : S.url ? (S.pdfPend[o.id] ? 'PDF aguardando envio para o Drive.' : '') : 'Modo local: o PDF foi baixado neste aparelho.'}</div>`;
  return `<div class="sec-h" style="margin-top:4px">Conferência do Supervisor</div><div class="gate" id="omGate"></div>
   <div class="row"><button class="mbtn ok" data-act="aprovar" id="btnAprovar">✓ Aprovar, gerar PDF e salvar</button><button class="mbtn" data-act="salvar">💾 Salvar rascunho</button>
   ${o.tipo === 'P' ? '<input id="motivo" placeholder="Motivo da devolução" style="flex:1;min-width:160px"><button class="mbtn bad" data-act="devolver">↩ Devolver ao bordo</button>' : ''}</div>
   <div class="note">Somente o Supervisor aprova. A aprovação encerra a OM, grava a linha na planilha, guarda o PDF no Drive e recalcula o próximo vencimento.</div>`;
}

/* ---------- II-A ---------- */
function gateIIA(o) {
  const g = [], crit = o.classe === 'Crítica', ca = ehCA(o), anexo = tercAnexo(o);
  g.push(['1 · Sistema e descrição da falha', !!o.sistema && !!(o.descricao || '').trim()]);
  if (ca) g.push(['1 · Nº da RNC', !!(o.rnc || '').trim()]);
  if (ca) g.push(['1 · Modo de falha', !!o.modo]);
  if (ca) g.push(['1 · Coordenação e Supervisão comunicadas', (o.comunicado || []).length === 2]);
  if (crit) g.push(['1 · Data e hora da interdição', !!o.interdDT]);
  if (ca) g.push(['2 · Ação de contenção descrita', !!(o.contencao || '').trim()]);
  g.push(['3 · Quem executou', !!o.exec && !!(o.execn || '').trim()]);
  if (o.exec === 'Terceiro') g.push(['3 · Autorização da Gerência e relatório do terceiro', (o.terceiroAut || '').startsWith('Sim') && !!o.relTerc]);
  g.push(['3 · Início e término do reparo', !!o.inicio && !!o.termino]);
  if (!anexo) g.push(['3 · Serviço executado', !!(o.servicos || '').trim()]);
  g.push(['3 · Resíduos (FR 016_E se gerou)', o.resid === 'Não' || (o.resid === 'Sim' && !!(o.fr016 || '').trim())]);
  g.push(['3 · Teste com resultado Conforme', o.resultado === 'Conforme']);
  g.push(['3 · Nova inspeção de segurança', !!(o.inspecao || '').trim()]);
  fotosGate(o, g);
  if (ca) g.push(['4 · Causa da falha e análise de causa raiz', !!o.causaCat && !!(o.causa || '').trim()]);
  if (ca) g.push(['4 · Ação, responsável e prazo', !!(o.mitig || '').trim() && !!(o.mitigResp || '').trim() && !!o.mitigPrazo]);
  if (crit) g.push(['5 · Liberação do Coordenador de Operações', !!((o.ass || {}).coord || '').trim()]);
  g.push(['5 · Data e hora da liberação', !!o.liberacao]);
  if (ehEletr(o)) g.push(['NP 5.12 · Alimentação elétrica verificada (Manutenção) e destino registrado', !!(o.ti && o.ti.res)]);
  return g;
}

/* ---------- ligação do formulário ---------- */
AFTER.om = () => {
  const o = S.recs.get(ARG); if (!o) return; const m = $('#main');
  const refresh = () => { const g = o.tipo === 'C' ? gateIIA(o) : gateIIB(o), ok = g.every(x => x[1]), el = $('#omGate');
    if (el) el.innerHTML = g.map(([l, y]) => `<div><span class="ck ${y ? 'y' : 'n'}">${y ? '✓' : '✕'}</span>${esc(l)}</div>`).join('') + (ok ? '<div class="note" style="color:var(--okt)">Tudo pronto para aprovar.</div>' : `<div class="note">Faltam ${g.filter(x => !x[1]).length} itens para liberar a aprovação.</div>`);
    const b = $('#btnAprovar'); if (b) b.disabled = !ok || !can.admin();
    const pz = $('#prazoB2'); if (pz) pz.innerHTML = o.hreal ? (o.alvoH ? (+o.hreal <= o.alvoH ? '<span class="pill p-ok">Dentro do prazo</span>' : '<span class="pill p-warn">Fora do prazo · justifique abaixo</span>') : '') : '';
    clearTimeout(OMV.prevT); OMV.prevT = setTimeout(() => { const pv = $('#pdfPrev'); if (pv) { const pg = o.tipo === 'C' ? docIIA(o) : docIIB(o); previewPages(pv, pg); $('#npg').textContent = pg.length + (pg.length === 1 ? ' página' : ' páginas'); } }, 350); };
  let saveT = null; const autosave = () => { clearTimeout(saveT); saveT = setTimeout(() => { if (o.status !== 'encerrada' && can.edit()) saveRec(o); }, 900); };
  const redraw = () => { const y = scrollY, a = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null; $('#omForm').innerHTML = o.tipo === 'C' ? formIIA(o) : formIIB(o); refresh(); scrollTo(0, y); if (a) { const e = $(`[data-k="${CSS.escape(a)}"]`); if (e && e.type !== 'radio') e.focus({ preventScroll: true }); } };
  const setFrom = t => { if (t.dataset.k) { let v = t.type === 'checkbox' ? t.checked : t.value; setPath(o, t.dataset.k, v); return true; } if (t.dataset.km) { const cur = getPath(o, t.dataset.km) || []; const s = new Set(cur); t.checked ? s.add(t.value) : s.delete(t.value); setPath(o, t.dataset.km, [...s]); return true; } return false; };
  m.oninput = e => { const t = e.target; if (t.type === 'file') return; if (setFrom(t)) { if (t.dataset.mf) { const [id, i] = t.dataset.mf.split('|'); t.closest('tr').classList.toggle('out', medFora(A1M[id].meds[+i], t.value)); } refresh(); autosave(); } };
  m.onchange = async e => { const t = e.target;
    if (t.id === 'addFoto') { for (const f of t.files) { const src = await comprimir(f); o.fotos = o.fotos || []; o.fotos.push({ src, tipo: o.fotos.some(x => x.tipo === 'ANTES') ? 'DEPOIS' : 'ANTES', leg: '', at: Date.now() }); } redraw(); autosave(); return; }
    if (t.type === 'checkbox' || t.type === 'radio' || t.tagName === 'SELECT') { setFrom(t); if (t.dataset.k && /^(exec|relTerc|revPlano)$/.test(t.dataset.k) || (t.dataset.k || '').includes('steps')) redraw(); else refresh(); autosave(); } };
  m.onclick = async e => {
  const ef = e.target.closest('[data-ef]'); if (ef) { const o = S.recs.get(ARG); if (!precisa(true)) return; const r = $('#efR').value; if (!r) return toast('Escolha o resultado.'); o.efRes = r; o.efData = $('#efD').value || isoD(hoje()); o.efObs = $('#efO').value.trim(); o.efBy = S.session.name; (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Eficácia: ' + r }); await saveRec(o); toast('Verificação registrada.'); render(); return; }
     const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.addrow) { const [k, n] = b.dataset.addrow.split('|'); const r = getPath(o, k) || []; r.push(Array(+n).fill('')); setPath(o, k, r); redraw(); autosave(); }
    if (b.dataset.delrow) { const p = b.dataset.delrow.split('|'), i = +p.pop(), k = p.join('|'); const r = getPath(o, k) || []; r.splice(i, 1); setPath(o, k, r); redraw(); autosave(); }
    if (b.dataset.addextra !== undefined) { (o.extras = o.extras || []).push({ sis: '', eq: '', desc: '', mat: '' }); redraw(); autosave(); }
    if (b.dataset.allsteps) { const t = A1M[b.dataset.allsteps]; setPath(o, 'conf|' + t.id + '|steps', t.steps.map(() => true)); redraw(); autosave(); }
    const a = b.dataset.act;
    if (a === 'salvar') { if (!precisa(false)) return; await saveRec(o); toast('Rascunho salvo.'); }
    if (a === 'devolver') { if (!precisa(true)) return; const mo = ($('#motivo').value || '').trim(); if (!mo) return toast('Escreva o motivo da devolução.'); o.status = 'abordo'; o.devolvida = mo; (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Devolvida: ' + mo }); await saveRec(o); toast('OM devolvida ao bordo.'); go('acomp'); }
    if (a === 'aprovar') { if (!precisa(true)) return; await aprovarOM(o); }
    if (a === 'ficha') fichaModal(o);
    if (a === 'pdfAgora') await baixarPDF(o.tipo === 'C' ? docIIA(o) : docIIB(o), nomePdf(o));
    if (a === 'reabrir') { if (!precisa(true)) return; o.status = 'conferencia'; o.fechadoAt = null; (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Reaberta' }); await saveRec(o); render(); }
    if (a === 'excluir') confirmar(`Excluir a OM ${o.num}? Esta ação apaga o registro do SMF (não apaga a OM do Sankhya).`, async () => { o.excluido = true; await saveRec(o); if (S.url && S.session) { try { await api('delete', { id: o.id }); } catch (er) { } } toast('OM excluída.'); go(o.tipo === 'C' ? 'corr' : 'prev'); });
  };
  refresh();
};
function confirmar(msg, fn) { const m = modal(`<h2>Confirmar</h2><p>${esc(msg)}</p><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn bad" id="cfOk">Confirmar</button></div>`); $('#cfOk').onclick = () => { closeModal(); fn(); }; }
async function comprimir(file) { const url = URL.createObjectURL(file); const img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; }); const M = 1400, k = Math.min(1, M / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', .78); }
const nomePdf = o => `${vName(o.vessel).replace(/\s+/g, '_')}_OM${o.num}_${o.tipo === 'C' ? 'II-A' : 'II-B'}_${o.tipo === 'C' ? (o.liberacao || o.abertura || '').slice(0, 10) : (o.dreal || '')}.pdf`;
async function aprovarOM(o) {
  if (o && o.tipo === 'P' && o.grupo && (o.parte || 1) > 1) {   // parte 2 em diante da OM de janela: o PDF do Anexo II-B sai na parte 1
    const g = gateIIB(o); if (!g.every(x => x[1])) return toast('Ainda há itens pendentes na conferência.');
    o.status = 'encerrada'; o.fechadoAt = Date.now(); o.aprovBy = S.session.name; o.aprovAt = isoDT(hoje()); o.devolvida = '';
    (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Aprovada e encerrada (PDF do Anexo II-B na parte 1)' });
    await saveRec(o); return; }
  const g = o.tipo === 'C' ? gateIIA(o) : gateIIB(o); if (!g.every(x => x[1])) return toast('Ainda há itens pendentes na conferência.');
  const b = $('#btnAprovar'); if (b) { b.disabled = true; b.textContent = 'Gerando PDF…'; }
  o.status = 'encerrada'; o.fechadoAt = Date.now(); o.aprovBy = S.session.name; o.aprovAt = isoDT(hoje()); o.devolvida = '';
  if (o.tipo === 'C' && !o.liberacao) o.liberacao = isoDT(hoje());
  (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Aprovada e encerrada' });
  let b64 = null;
  try { const pdf = await gerarPDF(o.tipo === 'C' ? docIIA(o) : docIIB(o)); b64 = pdf.output('datauristring').split(',')[1]; if (!S.url) pdf.save(nomePdf(o)); }
  catch (e) { toast('Não foi possível gerar o PDF: ' + e.message); }
  await saveRec(o, { pdfB64: b64 });
  toast(S.url ? 'OM ' + o.num + ' aprovada. PDF a caminho do Drive.' : 'OM ' + o.num + ' aprovada. PDF baixado (modo local).', 4500);
  render();
}

/* =====================================================================
   DOCUMENTOS A4 · paginação, prévia e PDF
   ===================================================================== */
const HDR = () => `<div class="hdr"><div><img class="ln" src="${LOGOS.nav}" alt=""></div><div class="c"><b>ANEXO II – REGISTRO DE MANUTENÇÃO</b><span>Empurradores Fluviais</span><span class="np">NP Navecunha 055 · Anexo II · Rev. 00</span></div><div><img class="lv" src="${LOGOS.vda}" alt=""></div></div>`;
// cabeçalho único dos impressos abertos em janela própria (mesmo desenho do Anexo II): logo · título, assunto e norma · logo; rodapé com a versão e a folha (padrão de 25/10/2026)
const DOC_CAB_CSS = `.dc{display:grid;grid-template-columns:130px 1fr 130px;border:1px solid #1F2A44;margin:0 0 8px;break-inside:avoid}.dc>div{display:flex;align-items:center;justify-content:center;padding:5px 8px}.dc>div+div{border-left:1px solid #1F2A44}.dc .t{flex-direction:column;text-align:center;gap:1px}.dc .t b{font-size:13px;color:#1F2A44;letter-spacing:.02em}.dc .t span{font-size:9.5px;color:#3C4043}.dc img{max-height:36px;max-width:112px}
@page{margin-bottom:12mm;@bottom-left{content:"Documento controlado pelo SGI · gerado pelo SMF ${VERSAO_APP}";font:8px Arial;color:#5F6368}@bottom-right{content:"Folha " counter(page) " de " counter(pages);font:8px Arial;color:#5F6368}}`;
const docLogo = k => (typeof LOGO64 !== 'undefined' && LOGO64[k]) || new URL(LOGOS[k], location.href);   // logo embutido (js/84): a janela de impressão nem sempre busca arquivos
const docCab = (tit, sub, ref) => `<div class="dc"><div><img src="${docLogo('nav')}" alt=""></div><div class="t"><b>${tit}</b>${sub ? `<span>${sub}</span>` : ''}<span>${ref}</span></div><div><img src="${docLogo('vda')}" alt=""></div></div>`;
const FOOT = n => `<div class="sf"><span>Documento controlado pelo SGI · gerado pelo SMF ${VERSAO_APP}</span><span>Página <b>${n}</b> de <b>@N</b></span></div>`;
const dv = (lab, v, span) => `<div${span ? ` style="grid-column:span ${span}"` : ''}><span class="fl">${lab}</span><div class="v">${esc(v == null ? '' : v) || '&nbsp;'}</div></div>`;
const blk = (code, t, r, inner) => `<div class="fs"><h4><code>${code}</code>${t}${r ? `<span class="r">${r}</span>` : ''}</h4>${inner}</div>`;
const grid = (cols, cells) => `<div class="row" style="grid-template-columns:${cols}">${cells}</div>`;
function tbl(cols, rows, w) { return `<table><tr>${cols.map((c, i) => `<th${w && w[i] ? ` style="width:${w[i]}"` : ''}>${c}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => typeof c === 'object' && c ? `<td class="${c.c || ''}">${c.h !== undefined ? c.h : esc(c.t)}</td>` : `<td>${esc(c == null ? '' : c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}" style="color:#8A98A8">N/A</td></tr>`}</table>`; }
function paginar(fbarHtml, blocks, hdrHtml) {
  const R = $('#render'); const pages = [];
  let sh = null, body = null;
  const tit = (fbarHtml.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '', om = fbarHtml.match(/class="om">([^<]*)<br><b>([\s\S]*?)<\/b>/), num = om ? (/OM/.test(om[1]) ? 'OM ' : om[1].trim() + ' ') + om[2] : '';
  const curta = tit ? `<div class="fbar" style="padding:3px 10px;min-height:0"><small>${tit.replace(/\s*—.*$/, '')}${num ? ' · ' + num : ''} · continuação</small></div>` : fbarHtml;   // da 2ª folha em diante, só uma linha que identifica a folha
  const nova = () => { sh = document.createElement('div'); sh.className = 'sheet'; sh.innerHTML = (hdrHtml || HDR()) + `<div class="body">${pages.length ? curta : fbarHtml}</div>` + FOOT(pages.length + 1); R.appendChild(sh); body = sh.querySelector('.body'); pages.push(sh); };
  nova();
  const over = () => body.scrollHeight > body.clientHeight + 1;
  // divide a última tabela do bloco entre páginas quando ela não cabe inteira
  const dividir = el => {
    const linhas = t => [...t.querySelectorAll('tr')].filter(r => !r.querySelector('th'));
    const tabs = [...el.querySelectorAll(':scope > table')]; if (!tabs.length) return null;
    const t = tabs.reduce((a, b) => linhas(b).length > linhas(a).length ? b : a), dados = linhas(t);
    if (dados.length < 3) return null;
    const cont = el.cloneNode(false); const h = el.querySelector('h4');
    if (h) { const h2 = h.cloneNode(true); const r = h2.querySelector('.r'); if (r) r.textContent = 'continuação'; else h2.insertAdjacentHTML('beforeend', '<span class="r">continuação</span>'); cont.appendChild(h2); }
    const t2 = t.cloneNode(false), cab = t.querySelector('tr'), temCab = cab && cab.querySelector('th'); if (temCab) t2.appendChild(cab.cloneNode(true)); cont.appendChild(t2);
    const depois = []; let n = t.nextElementSibling; while (n) { depois.push(n); n = n.nextElementSibling; }
    depois.forEach(x => cont.appendChild(x));
    const mov = [];
    while (over() && dados.length - mov.length > 2) { const r = dados[dados.length - 1 - mov.length]; mov.push(r); t2.insertBefore(r, temCab ? t2.children[1] || null : t2.firstChild); }
    if (over()) { const tb = t.tBodies[0] || t; mov.slice().reverse().forEach(r => tb.appendChild(r)); depois.forEach(x => el.appendChild(x)); return null; }
    return cont;
  };
  const colocar = el => {
    body.appendChild(el);
    if (!over()) return;
    if (body.children.length > 2) { const c = dividir(el); if (c) { nova(); colocar(c); return; } el.remove(); nova(); body.appendChild(el); if (over()) { const c2 = dividir(el); if (c2) { nova(); colocar(c2); } } }
    else { const c = dividir(el); if (c) { nova(); colocar(c); } }
  };
  blocks.forEach(b => { const w = document.createElement('div'); w.innerHTML = b; colocar(w.firstElementChild); });
  const out = pages.map(p => p.outerHTML); pages.forEach(p => p.remove()); return out;
}
function numerar(pages) { const N = pages.length; return pages.map((p, i) => p.replace(/@N/g, N).replace(/Página <b>[^<]*<\/b>/, 'Página <b>' + (i + 1) + '</b>')); }

function previewPages(cont, pages, w) {
  const W = w || Math.max(240, Math.min(620, (cont.clientWidth || 600) - 24)), k = W / 794;
  cont.innerHTML = pages.map(p => `<div class="pv" style="width:${W}px;height:${Math.round(1123 * k)}px">${p.replace('class="sheet', `style="transform:scale(${k})" class="sheet`)}</div>`).join('');
}
async function gerarPDF(pages) {
  await carregarLibsPdf().catch(() => { });
  if (!window.jspdf || !window.html2canvas) throw new Error('bibliotecas de PDF não carregaram (sem internet?)');
  const { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }), R = $('#render');
  for (let i = 0; i < pages.length; i++) {
    R.innerHTML = pages[i]; const el = R.firstElementChild;
    await Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; })));
    const c = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, width: 794, height: 1123, windowWidth: 794 });
    if (i) pdf.addPage(); pdf.addImage(c.toDataURL('image/jpeg', .86), 'JPEG', 0, 0, 210, 297);
  }
  R.innerHTML = ''; return pdf;
}
async function baixarPDF(pages, nome) { toast('Gerando PDF…', 1800); try { const p = await gerarPDF(pages); p.save(nome); } catch (e) { toast('Não foi possível gerar o PDF: ' + e.message); } }

/* =====================================================================
   SMF · indicadores, relatório mensal, administração, inicialização
   ===================================================================== */
/* Indicadores num bloco só (24/10/2026): KPIs da NP 9, riscos, mitigação, resumo do mês e carga do cronograma */
function vKpi() {
  const K = kpis();
  const labs = K.ms.map(x => x.lab), di = K.disp[5], mtbf = K.mtbfNow, mttr = K.mttr[5], bk = K.bk, pr = K.pred[3], ft = K.fotosSem;
  return `<div class="vh"><div><h1>Indicadores de desempenho (KPI) · NP 055</h1><p>KPIs do item 9, calculados das OMs, dos horímetros e das corretivas registradas no SMF. Passe o mouse nos gráficos para ver os valores.</p></div><span class="sp"></span></div>
  <div class="kgrid">
   ${kpiCard('Disponibilidade da frota', di, '%', '≥ 95%', di >= 95, lineChart(K.disp, labs, 95, '%', 1), '(h calendário − h indisponíveis por manutenção) ÷ h calendário × 100. Indisponível: da interdição à liberação, mais as horas paradas em preventiva.', 'Mensal')}
   ${kpiCard('MTBF', mtbf.v, ' h', '≥ 500 h', mtbf.v >= 500, lineChart(K.mtbf, labs, 500, ' h', 0), `${nf(mtbf.h)} h de operação ÷ ${mtbf.f} falhas (Crítica/Alta) em 12 meses. Horas: horímetro do MCP BB (FR 027_L).`, 'Mensal · janela de 12 meses', 0)}
   ${kpiCard('MTTR', mttr, ' h', '≤ 8 h', mttr <= 8, lineChart(K.mttr, labs, 8, ' h', 1, { menor: 1 }), 'soma dos tempos de reparo ÷ nº de falhas liberadas no mês. Tempo = abertura da OM até a liberação.', 'Mensal')}
   ${kpiCard('Backlog', bk.v, '%', '≤ 5%', bk.v <= 5, lineChart(K.snaps.map(s => s.v).concat([bk.v]), K.snaps.map(s => brD(s.date).slice(0, 5)).concat(['hoje']), 5, '%', 1, { menor: 1 }), `${bk.n} OMs com início vencido ÷ ${bk.t} OMs em aberto × 100 (corretivas, preventivas e preditivas).`, 'Semanal')}
   ${kpiCard('Cumprimento do plano preditivo', pr, '%', '≥ 80%', pr >= 80, lineChart(K.pred, K.qs.map(x => x.lab), 80, '%', 0), 'análises de óleo (1.1.29) e avaliações de tendência (1.1.30) realizadas ÷ programadas no trimestre × 100', 'Trimestral', 0)}
   ${kpiCard('Conformidade de fotos', ft, '%', '100%', ft >= 99.95, lineChart(K.fotos, labs, 100, '%', 0), 'OMs encerradas com foto ANTES e DEPOIS ÷ OMs encerradas × 100. Card: últimos 7 dias; gráfico: por mês.', 'Semanal', 0)}
  </div>
  ` + riscoHTML() + mitigHTML() + resumoMesHTML() + kpiCronoCard();
}

/* ---------- administração ---------- */
const ADM = { q: '' };
/* Administração num bloco só (24/10/2026): os cartões Fora de operação e Marco zero vêm de admForaHTML/admMarcoHTML em vez de camadas por cima */
function vAdmin() {
  const a = can.admin();
  return `<div class="vh"><div><h1>Administração</h1><p>Nuvem, senhas, cadastro da frota e intervalos. Alterações da frota e dos intervalos valem para todos os aparelhos depois de sincronizar.</p></div></div>
   ${!S.session ? '<div class="banner info">Entre como Supervisor para alterar as configurações. <button class="mbtn sm" data-act="entrar">Entrar</button></div>' : !a ? '<div class="banner info">Você entrou como Analista. Somente o Supervisor altera as configurações.</div>' : ''}
   <div class="card"><h2>Nuvem (Google Apps Script)</h2><p class="note">Cole o endereço da implantação do Code.gs (termina em /exec). Sem endereço, o SMF funciona só neste aparelho. Este endereço fica salvo apenas neste aparelho.</p>
    <div class="row"><input id="adUrl" value="${esc(S.url)}" placeholder="https://script.google.com/macros/s/…/exec" style="flex:1;min-width:240px"><button class="mbtn" data-act="testar">Testar</button><button class="mbtn pri" data-act="salvarUrl">Salvar</button><button class="mbtn" data-act="sync">↻ Sincronizar agora</button></div><div class="note" id="adUrlMsg">${esc(S.syncMsg)}</div></div>
   <div class="card"><h2>Senhas</h2><p class="note">${S.url ? 'Trocadas no servidor: valem para todos.' : 'Modo local: valem só neste aparelho.'} Mínimo de 6 caracteres. Deixe em branco o que não quer trocar.</p>
    <div class="g"><label class="f s3">Nova senha do Analista (operador)<input id="pwOp" type="password" autocomplete="new-password" ${a ? '' : 'disabled'}></label><label class="f s3">Nova senha do Supervisor (administrador)<input id="pwAd" type="password" autocomplete="new-password" ${a ? '' : 'disabled'}></label><label class="f s3">Nova senha do Operador (FR 027_L de chegada e saída)<input id="pwOpr" type="password" autocomplete="new-password" ${a ? '' : 'disabled'}></label></div><div class="row"><button class="mbtn" data-act="senhas" ${a ? '' : 'disabled'}>Trocar senhas</button></div></div>
   <div class="card"><div class="row"><h2>Frota</h2><span class="sp"></span><label class="f" style="width:260px">Viagem padrão (h) · só para empurrador sem a próxima viagem informada<input type="number" id="adViag" value="${S.cfg.viagemH}" ${a ? '' : 'disabled'}></label></div>
    <p class="note">Cadastro conforme a <b>Matriz técnica de equipamentos e lubrificação</b>. Monomotor tem um MCP central; bimotor, BB e BE. O reversor decide o bloco do Anexo I (1.5 Hitachi, 1.6 Masson, 1.7 REINTJES) e o modelo do MCA decide o bloco 3.1 (MWM) ou 3.2 (Yanmar). Desmarque os equipamentos que o empurrador não tem.</p>
    <div class="row"><button class="mbtn" data-act="matriz" ${a ? '' : 'disabled'}>↺ Recarregar o cadastro da matriz técnica</button><span class="note">Substitui propulsão, reversores e MCAs dos 12 empurradores pelos dados da matriz. Depois clique em Salvar frota.</span></div>
    <div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Propulsão</th><th>Reversor</th><th>MCA 1</th><th>MCA 2</th><th>MCA 3</th><th>Equipamentos que não tem</th></tr></thead><tbody>
    ${S.cfg.frota.map((v, i) => `<tr><td><input data-fr="${i}|nome" value="${esc(v.nome)}" ${a ? '' : 'disabled'} style="min-width:110px"></td>
     <td><select data-fr="${i}|mcp" ${a ? '' : 'disabled'}><option value="bi"${v.mcp !== 'mono' ? ' selected' : ''}>Bimotor (BB/BE)</option><option value="mono"${v.mcp === 'mono' ? ' selected' : ''}>Monomotor (central)</option></select><div class="note" style="font-size:11px">${esc(Object.values(v.mcpMod || {})[0] || '')}</div></td>
     <td>${mcpPos(v).map(p => `<div style="display:flex;gap:4px;align-items:center;margin-bottom:3px">${mcpPos(v).length > 1 ? `<b style="font-size:11px;width:20px">${p}</b>` : ''}<select data-fr="${i}|rev|${p}" ${a ? '' : 'disabled'}><option value="">— a confirmar —</option>${['HITACHI', 'MASSON', 'REINTJES'].map(r => `<option value="${r}"${v.rev[p] === r ? ' selected' : ''}>${EQN[r].replace('Reversor ', '')}</option>`).join('')}</select></div>`).join('')}</td>
     ${MCAS.map(p => `<td><select data-fm="${i}|${p}" ${a ? '' : 'disabled'}><option value="">Não tem</option>${Object.keys(MCA_MOD).map(r => `<option${(v.mcaMod || {})[p] === r ? ' selected' : ''}>${r}</option>`).join('')}</select>${v.mca[p] ? `<input data-fl="${i}|${p}" value="${esc((v.mcaLoc || {})[p] || '')}" placeholder="local (ex.: Boreste)" style="margin-top:3px;font-size:11.5px" ${a ? '' : 'disabled'}>` : ''}</td>`).join('')}
     <td><details><summary class="note">${(v.off || []).length ? (v.off || []).length + ' desmarcados' : 'Todos'}</summary><div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin-top:6px;font-size:12px">${['FAE80', 'ALTPE', 'CXMAR', 'FAE50', 'BAMB30', 'BOTE', 'MBINC', 'GOV'].map(k => `<label style="display:flex;gap:5px;align-items:center"><input type="checkbox" data-off="${i}|${k}" ${(v.off || []).includes(k) ? '' : 'checked'} ${a ? '' : 'disabled'}>${EQN[k]}</label>`).join('')}</div></details></td></tr>`).join('')}
    </tbody></table></div><div class="row"><button class="mbtn" data-act="addVessel" ${a ? '' : 'disabled'}>+ Empurrador</button><span class="sp"></span><button class="mbtn pri" data-act="salvarCfg" ${a ? '' : 'disabled'}>Salvar frota</button></div></div>
   <div class="card"><div class="row"><h2>Intervalos do Anexo I</h2><span class="sp"></span><input id="adQ" placeholder="Buscar item (ex.: 1.1.1, óleo)" value="${esc(ADM.q)}" style="max-width:260px"></div>
    <p class="note">Ajuste quando a matriz for revisada (por exemplo, para alinhar a troca de óleo do MCP com o CTLE_LUB). O valor do Anexo I fica como referência. Vazio = usa o Anexo I.</p>
    <div class="tw" style="max-height:420px"><table class="t"><thead><tr><th>Nº</th><th>Item</th><th>Anexo I</th><th>Horas (h)</th><th>Meses</th></tr></thead><tbody>
    ${A1.filter(t => t.kind === 'prog' && (!ADM.q || (t.id + ' ' + t.chk + ' ' + t.item + ' ' + EQN[t.eq]).toLowerCase().includes(ADM.q.toLowerCase()))).slice(0, 60).map(t => { const o = (S.cfg.intervalos || {})[t.id] || {}; return `<tr><td class="mono">${t.id}</td><td>${esc(t.chk)}<div class="note">${esc(EQN[t.eq])}</div></td><td class="note">${esc(t.freq)}</td><td><input data-iv="${t.id}|h" value="${o.h ?? ''}" placeholder="${t.h ?? '—'}" style="width:90px" ${a ? '' : 'disabled'}></td><td><input data-iv="${t.id}|m" value="${o.m ?? ''}" placeholder="${t.m ?? '—'}" style="width:70px" ${a ? '' : 'disabled'}></td></tr>`; }).join('')}
    </tbody></table></div><div class="row end"><button class="mbtn pri" data-act="salvarCfg" ${a ? '' : 'disabled'}>Salvar intervalos</button></div></div>
   <div class="card"><h2>Dados</h2><div class="row">
    ${temExemplo() ? `<button class="mbtn bad" data-act="limparEx" ${a ? '' : 'disabled'}>Limpar dados de exemplo</button>` : `<button class="mbtn" data-act="carregarEx" ${a ? '' : 'disabled'}>Carregar dados de exemplo</button>`}
    <button class="mbtn" data-act="exportar">⬇ Cópia de segurança (JSON)</button><label class="mbtn" style="position:relative" ${a ? '' : 'onclick="toast(\'Entre como Supervisor (botão Entrar, embaixo à esquerda) para importar.\')"'}>⬆ Importar / restaurar (JSON)<input type="file" id="adImp" accept=".json,application/json,text/plain,*/*" style="position:absolute;inset:0;opacity:0" ${a ? '' : 'disabled'}></label>
    <button class="mbtn" data-act="instalar" id="btnInstall" ${window._bip ? '' : 'hidden'}>📲 Instalar app</button></div>
    <p class="note">${[...S.recs.values()].length} registros neste aparelho · ${S.pending.size} aguardando envio · versão ${VERSAO_APP}</p></div>` + admForaHTML() + admMarcoHTML() + (typeof admMenuHTML === 'function' ? admMenuHTML() : '') + (typeof enxAdminHTML === 'function' ? enxAdminHTML() : '') + (typeof versoesHTML === 'function' ? versoesHTML() : '');   /* fora de operação e marco zero ficam nos blocos deles */
}
AFTER.admin = () => { const m = $('#main');
  m.oninput = e => { if (e.target.id === 'adQ') { ADM.q = e.target.value; clearTimeout(m._t); m._t = setTimeout(() => { render(); const i = $('#adQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); } };
  m.onchange = async e => { const t = e.target;
    if (t.dataset.fr) { const [i, k, p] = t.dataset.fr.split('|'); const v = S.cfg.frota[+i]; if (p) v[k][p] = t.value; else v[k] = t.value; if (k === 'rev') S.cfg.revExemplo = false;
      if (k === 'mcp') { const r = v.rev || {}, m = v.mcpMod || {}; if (t.value === 'mono') { v.rev = { CE: r.CE || r.BB || r.BE || '' }; v.mcpMod = { CE: m.CE || m.BB || '' }; } else { v.rev = { BB: r.BB || r.CE || '', BE: r.BE || r.CE || '' }; v.mcpMod = { BB: m.BB || m.CE || '', BE: m.BE || m.CE || '' }; } render(); } }
    if (t.dataset.fm) { const [i, p] = t.dataset.fm.split('|'); const v = S.cfg.frota[+i]; v.mcaMod = v.mcaMod || {}; v.mcaLoc = v.mcaLoc || {}; if (t.value) { v.mcaMod[p] = t.value; v.mca[p] = MCA_MOD[t.value]; } else { delete v.mcaMod[p]; delete v.mca[p]; delete v.mcaLoc[p]; } render(); }
    if (t.dataset.fl) { const [i, p] = t.dataset.fl.split('|'); const v = S.cfg.frota[+i]; v.mcaLoc = v.mcaLoc || {}; v.mcaLoc[p] = t.value.trim(); }
    if (t.dataset.off) { const [i, k] = t.dataset.off.split('|'); const v = S.cfg.frota[+i]; v.off = v.off || []; v.off = t.checked ? v.off.filter(x => x !== k) : [...new Set(v.off.concat(k))]; }
    if (t.dataset.iv) { const [id, k] = t.dataset.iv.split('|'); S.cfg.intervalos = S.cfg.intervalos || {}; const o = S.cfg.intervalos[id] = S.cfg.intervalos[id] || {}; const val2 = t.value.trim(); if (val2 === '') delete o[k]; else o[k] = +val2.replace(/\D/g, ''); if (!Object.keys(o).length) delete S.cfg.intervalos[id]; }
    if (t.id === 'adViag') S.cfg.viagemH = Math.max(0, +t.value || 0);
    if (t.id === 'adImp') { const f = t.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); if (!Array.isArray(j.recs)) throw 0; for (const r of j.recs) { S.recs.set(r.id, r); if (!MEM) await DB.put(r); if (!r.seed) S.pending.add(r.id); } await kvSet('pending', [...S.pending]); scheduleSync(); if (j.cfg) { S.cfg = Object.assign(cfgPadrao(), j.cfg); await kvSet('cfg', S.cfg); } t.value = ''; const nh = j.recs.filter(r => r.kind === 'hor').length; toast(j.recs.length + ' registros importados' + (nh ? ' (' + nh + ' leituras de horímetro)' : '') + (temExemplo() ? '. Atenção: os dados de exemplo ainda estão ativos e podem esconder as leituras; limpe-os acima.' : '.'), 9000); render(); } catch (er) { t.value = ''; toast('Arquivo inválido: escolha o arquivo SMF_importar_horimetros.json.'); } } };
  m.onclick = async e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.act;
    if (a === 'testar' || a === 'salvarUrl') { const u = $('#adUrl').value.trim(); if (u && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(u)) { $('#adUrlMsg').textContent = 'O endereço deve começar com https://script.google.com/macros/s/ e terminar em /exec.'; return; }
      if (a === 'testar') { try { const r = await fetch(u + '?t=' + Date.now()); const j = await r.json(); $('#adUrlMsg').textContent = j.app === 'ctle_man' ? '✓ Servidor do SMF respondeu (versão ' + j.versao + ').' : 'Respondeu, mas não é o servidor do SMF (' + (j.app || '?') + ').'; } catch (er) { $('#adUrlMsg').textContent = 'Não respondeu. Confira a implantação: App da Web, "Qualquer pessoa".'; } }
      else { S.url = u; await kvSet('url', u); S.session = null; await kvSet('session', null); toast(u ? 'Endereço salvo. Entre novamente com a senha do servidor.' : 'Nuvem desligada. Modo local.'); render(); if (u) loginModal(); } }
    if (a === 'sync') { await syncNow(); render(); }
    if (a === 'senhas') { const op = $('#pwOp').value, ad = $('#pwAd').value, opr = ($('#pwOpr') || {}).value || ''; if ((op && op.length < 6) || (ad && ad.length < 6) || (opr && opr.length < 6)) return toast('Senha com no mínimo 6 caracteres.'); if (!op && !ad && !opr) return;
      if (S.url) { const j = await api('setPasswords', { op, ad, opr }); toast(j.ok ? 'Senhas trocadas.' : 'Erro: ' + j.error); } else { if (op) await kvSet('op_hash', await sha256('ctle_man|' + op)); if (ad) await kvSet('ad_hash', await sha256('ctle_man|' + ad)); if (opr) await kvSet('opr_hash', await sha256('ctle_man|' + opr)); toast('Senhas trocadas neste aparelho.'); } $('#pwOp').value = $('#pwAd').value = ''; if ($('#pwOpr')) $('#pwOpr').value = ''; }
    if (a === 'matriz') { if (!precisa(true)) return; S.cfg.frota.forEach(v => { if (FROTA_MATRIZ[v.nome]) { delete v.mcp; vesselDaMatriz(v); } }); S.cfg.revExemplo = false; toast('Cadastro da matriz aplicado. Confira e clique em Salvar frota.'); render(); }
    if (a === 'addVessel') { S.cfg.frota.push({ id: 'v' + Date.now().toString(36), nome: 'Novo empurrador', mcp: 'bi', rev: { BB: '', BE: '' }, mcpMod: {}, mca: {}, mcaMod: {}, mcaLoc: {}, off: [] }); render(); }
    if (a === 'salvarCfg') { if (!precisa(true)) return; S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg); if (S.url) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota, intervalos: S.cfg.intervalos, viagemH: S.cfg.viagemH, revExemplo: S.cfg.revExemplo } }); toast(j.ok ? 'Configuração salva para todos.' : 'Salvo neste aparelho. Nuvem: ' + j.error); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } } catch (er) { toast('Salvo neste aparelho. Sem conexão com a nuvem.'); } } else toast('Configuração salva.'); render(); }
    if (a === 'carregarEx') { await carregarExemplo(); toast('Dados de exemplo carregados.'); render(); }
    if (a === 'exportar') { const blob = new Blob([JSON.stringify({ app: 'ctle_man', at: new Date().toISOString(), cfg: S.cfg, recs: [...S.recs.values()].filter(r => !r.seed) })], { type: 'application/json' }); const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'SMF_copia_' + isoD(hoje()) + '.json'; document.body.appendChild(l); l.click(); l.remove(); }
    if (a === 'instalar' && window._bip) { window._bip.prompt(); window._bip = null; } }; };

/* ---------- ações globais ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('[data-close]')) { closeModal(); return; }
  if (t.closest('#entrar') || t.closest('[data-act="entrar"]')) { loginModal(); return; }
  if (t.closest('#sair')) { S.session = null; await kvSet('session', null); toast('Você saiu.'); render(); return; }
  if (t.closest('#mnu')) { document.body.classList.toggle('menu'); return; }
  if (document.body.classList.contains('menu') && !t.closest('#side')) { document.body.classList.remove('menu'); return; }
  const op = t.closest('[data-open]'); if (op && !t.closest('button')) { go('om/' + op.dataset.open); return; }
  const vs = t.closest('[data-vessel]'); if (vs) { vesselModal(vs.dataset.vessel); return; }
  const ac = t.closest('[data-act]'); if (!ac) return;
  const a = ac.dataset.act;
  if (a === 'novaCorr') novaCorretiva();
  if (a === 'lancarHor') horModal(ac.dataset.v);
  if (a === 'limparEx') { if (!precisa(true)) return; confirmar('Limpar todos os dados de exemplo? Seus registros reais não são apagados.', async () => { await limparExemplo(); toast('Dados de exemplo removidos.'); render(); }); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('online', () => scheduleSync(200));
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window._bip = e; const b = $('#btnInstall'); if (b) b.hidden = false; });

/* ---------- inicialização ---------- */
(async function boot() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));   // espera todos os blocos de código: com internet lenta a página chega aos pedaços e a carga corria antes dos últimos blocos
  $$('img[data-logo]').forEach(i => i.src = LOGOS[i.dataset.logo]);
  try { await DB.open(); } catch (e) { MEM = new Map(); }
  try {
    const all = MEM ? [] : await DB.all(); all.forEach(r => S.recs.set(r.id, r));
    S.cfg = normFrota(Object.assign(cfgPadrao(), (await kvGet('cfg')) || {}));
    { let u0 = await kvGet('url'); if (u0 === 'https://script.google.com/macros/s/AKfycbw9GV1TYtyXXCHfeMX2cAaJqkSwoP76lthNvYPpnFbvBuwb3d0lGNNd0nVgIYf9QBNj/exec') { u0 = NUVEM_PADRAO; await kvSet('url', u0); } /* endereço antigo (servidor parado na versão 7, troca em 21/10/2026): passa sozinho para o atual */ S.url = u0 == null ? NUVEM_PADRAO : u0; if (u0 == null && NUVEM_PADRAO) await kvSet('url', NUVEM_PADRAO); } S.session = (await kvGet('session')) || null;
    S.pending = new Set((await kvGet('pending')) || []); S.pdfPend = (await kvGet('pdfPend')) || {}; S.lastSync = (await kvGet('lastSync')) || 0;
    if (!(await kvGet('seeded')) && !S.recs.size) { await carregarExemplo(); await kvSet('frotaV', 2); }
    else if ((await kvGet('frotaV')) !== 2) {
      // frota passou a seguir a matriz técnica (monomotor = MCP central): refaz o exemplo e move lançamentos BB dos monomotores para CE
      if (temExemplo()) { const ids = [...S.recs.values()].filter(r => r.seed).map(r => r.id); for (const id of ids) { S.recs.delete(id); if (MEM) MEM.delete(id); else await DB.del(id); } await carregarExemplo(); }
      for (const r of [...S.recs.values()]) { const v = vessel(r.vessel); if (!r.seed && v && v.mcp === 'mono' && r.pos === 'BB') { r.pos = 'CE'; await saveRec(r); } }
      await kvSet('frotaV', 2);
    }
    else if (temExemplo() && !recs('om').some(r => r.seed && r.id.startsWith('ex-omf-'))) { const l = exemploFalhas(); l.forEach(r => S.recs.set(r.id, r)); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); }
    if (temExemplo() && !S.recs.has('ex-hor-sus1')) { const l = exemploHor(); l.forEach(r => S.recs.set(r.id, r)); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); }
    if (temExemplo()) { const l = completarExemploAntigo(); if (l.length) { if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); } }
    if (temExemplo() && !recs('comp').some(r => r.seed)) { const l = exemploComp(); l.forEach(r => { r.updatedAt = r.createdAt = Date.now(); S.recs.set(r.id, r); }); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); }
    if (typeof lubBoot === 'function') await lubBoot();
  } catch (e) { S.cfg = S.cfg || cfgPadrao(); console.error(e); }
  route(); S.pronto = true;   // carga terminada: os geradores de exemplo que esperam por S só rodam depois disto
  try { await snapshotBacklog(); } catch (e) { }
  setSync('', S.url ? 'Conectando…' : 'Modo local (sem nuvem)');
  syncNow(); setInterval(() => scheduleSync(10), 5 * 60e3);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|claudeusercontent/.test(location.host)) { const tinha = !!navigator.serviceWorker.controller; navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { r.update();   /* procura versão nova também com a tela aberta: a cada 10 min e ao voltar para a aba */
      setInterval(() => r.update().catch(() => { }), 10 * 60e3); document.addEventListener('visibilitychange', () => { if (!document.hidden) r.update().catch(() => { }); }); }).catch(() => { });
    /* versão nova assume e a tela recarrega sozinha a cada publicação (antes só na primeira da aba: depois ficava na versão velha em memória); a trava de 30 s evita recarregar em laço */
    navigator.serviceWorker.addEventListener('controllerchange', () => { const t = +sessionStorage.getItem('smf_recarregou') || 0; if (tinha && Date.now() - t > 30e3) { sessionStorage.setItem('smf_recarregou', String(Date.now())); location.reload(); } }); }
})();

