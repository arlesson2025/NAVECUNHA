/* =====================================================================
   NÍVEL TÉCNICO · modo de falha e causa, laudo de óleo,
   saúde do MCP unificada, indicadores técnicos, HH e custo, sobressalentes críticos
   (Anexo III) e fotos sincronizadas pelo Google Drive
   ===================================================================== */
'use strict';
const numv = v => { const x = parseFloat(String(v == null ? '' : v).replace(/\./g, '').replace(',', '.')); return isNaN(x) ? 0 : x; };

/* ---------- 1 · análise de falhas por modo e causa ---------- */

/* ---------- 2 · laudo de óleo e saúde do MCP ---------- */
// limites de referência para motor diesel com óleo 15W-40 (ajuste com os limites do laboratório)
// TBN do óleo novo (15W-40 API CF ou superior): valor típico, confirme na ficha técnica do óleo em uso e ajuste aqui
const TBN_NOVO = 10;
const LAUDO_P = [
  ['fe', 'Ferro (Fe)', 'ppm', 50, 100, 'desgaste de camisas, engrenagens, eixo'], ['cr', 'Cromo (Cr)', 'ppm', 10, 20, 'desgaste de anéis'], ['al', 'Alumínio (Al)', 'ppm', 15, 30, 'desgaste de pistões, mancais'],
  ['cu', 'Cobre (Cu)', 'ppm', 25, 50, 'buchas, mancais, arrefecedor de óleo'], ['pb', 'Chumbo (Pb)', 'ppm', 25, 50, 'bronzinas'], ['si', 'Silício (Si)', 'ppm', 20, 40, 'poeira: filtro de ar / admissão'],
  ['na', 'Sódio (Na)', 'ppm', 50, 100, 'líquido de arrefecimento ou água'], ['agua', 'Água', '%', 0.1, 0.2, 'contaminação por água'], ['comb', 'Diluição por combustível', '%', 2, 4, 'bicos, bomba injetora'],
  ['fuligem', 'Fuligem', '%', 2, 3, 'combustão ruim, injeção, ar'], ['tbn', 'TBN', 'mg KOH/g', TBN_NOVO * 0.6, TBN_NOVO * 0.5, 'reserva alcalina baixa (atenção: 60% e crítico: 50% do TBN do óleo novo)', 'min'], ['visc', 'Viscosidade a 100 °C', 'cSt', [12.5, 16.3], [11.5, 17.5], 'fora da faixa do 15W-40', 'faixa'],
];
function laudoSt(r) {
  const out = []; let st = 'ok';
  LAUDO_P.forEach(([k, nome, un, a, c, sig, tipo]) => { const v = numBR((r.vals || {})[k]); if (v == null) return; let s = 'ok';
    if (tipo === 'min') s = v < c ? 'venc' : v < a ? 'viag' : 'ok';
    else if (tipo === 'faixa') s = v < c[0] || v > c[1] ? 'venc' : v < a[0] || v > a[1] ? 'viag' : 'ok';
    else s = v >= c ? 'venc' : v >= a ? 'viag' : 'ok';
    if (s !== 'ok') out.push({ k, nome, un, v, s, sig }); if (s === 'venc') st = 'venc'; else if (s === 'viag' && st === 'ok') st = 'viag'; });
  return { st, alertas: out.sort((x, y) => (x.s === 'venc' ? 0 : 1) - (y.s === 'venc' ? 0 : 1)) };
}
const laudos = (vid, pos) => recs('laudo').filter(r => r.vessel === vid && r.pos === pos).sort((a, b) => a.date < b.date ? -1 : 1);
// saúde do MCP: compressão + consumo de óleo + laudo → recomendação
function laudoLista(vid, pos) {
  const L = laudos(vid, pos).reverse(), v = vessel(vid);
  modal(`<div class="row"><h2>${esc(v.nome)} · MCP ${pos} · laudos de óleo</h2><span class="sp"></span><button class="mbtn sm pri" id="lnv">＋ Registrar laudo</button><button class="mbtn" data-close>Fechar</button></div>
   ${L.length ? `<div class="tw" style="max-height:60vh"><table class="t"><thead><tr><th>Data</th><th>Horas do óleo</th>${LAUDO_P.map(p => `<th class="c" title="${esc(p[1])}">${p[0] === 'visc' ? 'Visc.' : p[0] === 'fuligem' ? 'Fulig.' : p[0] === 'comb' ? 'Dil.' : p[0] === 'agua' ? 'Água' : p[0].toUpperCase()}</th>`).join('')}<th>Situação</th></tr></thead><tbody>
   ${L.map(r => { const s = laudoSt(r); return `<tr><td>${brD(r.date)}<div class="note">${esc(r.lab || '')} ${esc(r.num || '')}</div></td><td class="mono">${r.hOleo ? nf(r.hOleo) + ' h' : '—'}</td>${LAUDO_P.map(p => { const a = s.alertas.find(x => x.k === p[0]), val = (r.vals || {})[p[0]]; return `<td class="c mono" style="${a ? `color:${CORST[a.s]};font-weight:700` : ''}">${val !== undefined && val !== '' ? esc(val) : '·'}</td>`; }).join('')}<td><span class="pill ${{ venc: 'p-bad', viag: 'p-warn', ok: 'p-ok' }[s.st]}">${{ venc: 'crítico', viag: 'alerta', ok: 'normal' }[s.st]}</span>${s.alertas.length ? `<div class="note">${s.alertas.map(a => esc(a.nome.split(' (')[0]) + ': ' + esc(a.sig)).join('; ')}</div>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="note">Nenhum laudo lançado para este motor.</p>'}`, true);
  $('#lnv').onclick = () => laudoModal(vid, pos);
}
function laudoModal(vid, pos) {
  if (!precisa(false)) return;
  vid = vid || S.cfg.frota[0].id; pos = pos || mpos(vid);
  const h = horAtual(vid, pos);
  modal(`<h2>Registrar laudo de análise de óleo</h2><p class="note">Item 1.1.29 do Anexo I. O laudo conta como a coleta do programa de amostragem e entra na saúde do MCP. Deixe em branco o que o laboratório não mediu.</p>
   <div class="g"><label class="f s2">Empurrador<select id="lV">${S.cfg.frota.map(x => `<option value="${x.id}"${x.id === vid ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label><label class="f s1">Motor<select id="lP">${mcpPos(vessel(vid)).map(p => `<option value="${p}"${p === pos ? ' selected' : ''}>${p === 'CE' ? 'Central' : p}</option>`).join('')}</select></label>
   <label class="f s1">Data da coleta<input id="lD" type="date" value="${isoD(hoje())}"></label><label class="f s1">Horímetro<input id="lH" inputmode="numeric" value="${h ? h.h : ''}"></label><label class="f s1">Horas do óleo<input id="lO" inputmode="numeric" placeholder="desde a troca"></label>
   <label class="f s3">Laboratório<input id="lL"></label><label class="f s3">Nº do laudo<input id="lN"></label>
   ${LAUDO_P.map(p => `<label class="f s1">${esc(p[1])} (${p[2]})<input data-lp="${p[0]}" inputmode="decimal"></label>`).join('')}
   <label class="f s6">Link do laudo em PDF (Drive)<input id="lU" placeholder="https://"></label><label class="f s6">Comentário do laboratório<input id="lC"></label></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="lOk">Salvar laudo</button></div>`, true);
  $('#lV').onchange = () => { $('#lP').innerHTML = mcpPos(vessel($('#lV').value)).map(p => `<option value="${p}">${p === 'CE' ? 'Central' : p}</option>`).join(''); };
  $('#lOk').onclick = async () => {
    const vals = {}; $$('[data-lp]').forEach(i => { if (i.value.trim()) vals[i.dataset.lp] = i.value.trim(); });
    if (!$('#lD').value) return toast('Informe a data da coleta.'); if (!Object.keys(vals).length) return toast('Lance pelo menos um resultado.');
    const r = { id: uid('laudo'), kind: 'laudo', vessel: $('#lV').value, pos: $('#lP').value, date: $('#lD').value, h: $('#lH').value.replace(/\D/g, '') || null, hOleo: $('#lO').value.replace(/\D/g, ''), lab: $('#lL').value.trim(), num: $('#lN').value.trim(), url: $('#lU').value.trim(), obs: $('#lC').value.trim(), vals, by: S.session.name };
    await saveRec(r); const s = laudoSt(r); closeModal(); toast('Laudo salvo · ' + ({ venc: 'CRÍTICO: ' + s.alertas.filter(a => a.s === 'venc').map(a => a.nome.split(' (')[0]).join(', '), viag: 'alerta: ' + s.alertas.map(a => a.nome.split(' (')[0]).join(', '), ok: 'normal' }[s.st]), 6000); render();
  };
}

/* ---------- 3 · indicadores técnicos (globais) ---------- */

/* ---------- 4 · sobressalentes críticos (Anexo III · NP 5.6.1) ---------- */
/* Peças num bloco só (24/10/2026): os kits do mês (kitsCard, NP 5.6.1) entram direto abaixo do cabeçalho */
function vPecas() {
  const L = recs('peca').sort((a, b) => a.nome.localeCompare(b.nome)), baixo = L.filter(p => numv(p.estoque) < numv(p.minimo || 1));
  return `<div class="vh"><div><h1>Sobressalentes críticos · Anexo III</h1><p>Até 6 peças que param a operação e não se encontram em Manaus em até 48 h, com 1 unidade para a frota (NP 5.6.1). A lista é revista a cada semestre com base nas RNCs e no MTTR.</p></div><span class="sp"></span><button class="mbtn pri" data-pecanova>＋ Cadastrar peça</button></div>
   ${(() => { try { return kitsCard(); } catch (e) { return ''; } })()}<div class="kgrid six"><div class="card mini"><b>${L.length}</b><span>peças na lista (máx. 6)</span></div><div class="card mini ${baixo.length ? 'bad' : 'ok'}"><b>${baixo.length}</b><span>abaixo do estoque mínimo · comprar</span></div></div>
   <div class="card">${L.length ? `<div class="tw"><table class="t"><thead><tr><th>Peça</th><th>Equipamento</th><th class="c">Estoque</th><th class="c">Mínimo</th><th>Fornecedor</th><th>Prazo de entrega</th><th>Último uso</th><th></th></tr></thead><tbody>${L.map(p => { const b = numv(p.estoque) < numv(p.minimo || 1); return `<tr><td><b>${esc(p.nome)}</b><div class="note">${esc(p.cod || '')}</div></td><td>${esc(EQN[p.equip] || p.equip || '—')}</td><td class="c mono" style="${b ? 'color:var(--badt);font-weight:700' : ''}">${esc(p.estoque || '0')}</td><td class="c mono">${esc(p.minimo || '1')}</td><td>${esc(p.forn || '—')}</td><td>${p.prazo ? esc(p.prazo) + ' dias' : '—'}</td><td>${p.uso ? brD(p.uso) : '—'}</td><td>${b ? '<span class="pill p-bad">comprar</span> ' : ''}<button class="mbtn sm" data-pecaed="${p.id}">Editar</button></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="note">Nenhuma peça cadastrada. Comece pelas que mais pararam a frota (veja Análise de falhas e ações de bloqueio › componentes com maior frequência de falha).</div>'}</div>`;
}
AFTER.pecas = () => { $('#main').onclick = e => { if (e.target.closest('[data-pecanova]')) { pecaModal(); return; } const b = e.target.closest('[data-pecaed]'); if (b) pecaModal(S.recs.get(b.dataset.pecaed)); }; };
function pecaModal(r) {
  if (!precisa(false)) return; const o = r || {};
  if (!r && recs('peca').length >= 6) toast('A NP prevê até 6 sobressalentes críticos. Revise a lista se precisar de mais.', 5000);
  modal(`<h2>${r ? 'Editar peça crítica' : 'Cadastrar peça crítica'}</h2><div class="g"><label class="f s4">Peça<input id="pN" value="${esc(o.nome || '')}"></label><label class="f s2">Código / P/N<input id="pC" value="${esc(o.cod || '')}"></label>
   <label class="f s3">Equipamento<select id="pE"><option value="">—</option>${Object.entries(EQN).map(([k, n]) => `<option value="${k}"${o.equip === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label><label class="f s1">Estoque<input id="pS" inputmode="numeric" value="${esc(o.estoque || '0')}"></label><label class="f s1">Mínimo<input id="pM" inputmode="numeric" value="${esc(o.minimo || '1')}"></label><label class="f s1">Prazo (dias)<input id="pP" inputmode="numeric" value="${esc(o.prazo || '')}"></label>
   <label class="f s3">Fornecedor<input id="pF" value="${esc(o.forn || '')}"></label><label class="f s3">Último uso<input id="pU" type="date" value="${esc(o.uso || '')}"></label></div>
   <div class="row end">${r && can.admin() ? '<button class="mbtn" id="pX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="pOk">Salvar</button></div>`);
  const x = $('#pX'); if (x) x.onclick = () => confirmar('Excluir ' + o.nome + '?', async () => { r.excluido = true; await saveRec(r); closeModal(); render(); });
  $('#pOk').onclick = async () => { const n = $('#pN').value.trim(); if (!n) return toast('Informe a peça.'); await saveRec(Object.assign(r || { id: uid('peca'), kind: 'peca' }, { nome: n, cod: $('#pC').value.trim(), equip: $('#pE').value, estoque: $('#pS').value.trim(), minimo: $('#pM').value.trim(), prazo: $('#pP').value.trim(), forn: $('#pF').value.trim(), uso: $('#pU').value, by: S.session.name })); closeModal(); toast('Peça salva.'); render(); };
}
VX.pecas = vPecas;
{ const s = SECOES.find(x => x.id === 'oms'); s.views.splice(4, 0, ['pecas', 'Sobressalentes críticos']); }

/* ---------- 5 · fotos pelo Google Drive ---------- */
{ const st = document.createElement('style'); st.textContent = `.phc .img{position:relative}.ph-nv{position:absolute;right:6px;bottom:6px;font-size:11px;font-weight:600;background:#FEF7E0;color:#7A5200;border-radius:10px;padding:2px 8px}.ph-nv.ok{background:#E8F0FE;color:#1967D2}`; document.head.appendChild(st); }
let fotoSync = false;
async function fotosEnviar() {   // envia ao Drive as fotos deste aparelho que ainda não têm cópia na nuvem
  if (fotoSync || !S.url || !S.session || !navigator.onLine) return; fotoSync = true;
  try {
    for (const o of [...S.recs.values()]) {
      if (o.seed || o.excluido) continue; let mud = false;
      // OM em qualquer etapa: a foto não pode ficar só no celular até o encerramento
      if (o.kind === 'om' || o.kind === 'base') for (const [i, f] of (o.fotos || []).entries()) { if (f.src && !f.fid) { const j = await api('foto', { recId: o.id, nome: vName(o.vessel) + '_OM' + (o.num || o.om) + '_' + f.tipo + '_' + (i + 1), vessel: o.vessel, b64: f.src.split(',')[1] }); if (j.ok) { f.fid = j.fileId; mud = true; } else break; } }
      if (o.kind === 'lub' && o.fotosLocais) { o.fotosFid = o.fotosFid || { a: [], d: [] }; for (const g of ['a', 'd']) for (const [i, src] of (o.fotosLocais[g] || []).entries()) { if (!o.fotosFid[g][i]) { const j = await api('foto', { recId: o.id, nome: vName(o.vessel) + '_FR049B_OM' + o.om + '_' + (g === 'a' ? 'ANTES' : 'DEPOIS') + '_' + (i + 1), vessel: o.vessel, b64: src.split(',')[1] }); if (j.ok) { o.fotosFid[g][i] = j.fileId; mud = true; } } } }
      if (mud) await saveRec(o);
    }
  } catch (e) { } finally { fotoSync = false; }
}
setInterval(() => fotosEnviar(), 3 * 60e3); setTimeout(() => fotosEnviar(), 20e3);
window.addEventListener('online', () => setTimeout(fotosEnviar, 3000));   // voltou o sinal: sobe o que ficou na fila
// foto nova numa OM: sobe ao Drive poucos segundos depois de gravada (não espera o encerramento)
let FOTO_T = 0;

/* ---------- exemplo: modo/causa, HH e custo nas corretivas e laudos (só dados de exemplo) ---------- */
async function tecExemplo() {
  if (!temExemplo() || (await kvGet('tecV')) === 2) return;   // v2: refaz nos aparelhos em que a v1 marcou sem gerar (só preenche o que falta)
  const R = rnd(1405), put = [], regra = [[/vazament|mangueira/i, 'Vazamento', 'Montagem ou instalação incorreta'], [/superaquec|temperatura/i, 'Superaquecimento', 'Desgaste natural (fim de vida)'], [/pressão de óleo/i, 'Perda de pressão ou vazão', 'Lubrificação inadequada'], [/correia|rompid/i, 'Quebra ou ruptura', 'Montagem ou instalação incorreta'], [/excitação|blackout|bateria|luz|alternador/i, 'Falha elétrica ou sem partida', 'Desgaste natural (fim de vida)'], [/patinando|folga|desgast/i, 'Desgaste ou folga excessiva', 'Manutenção não feita ou fora do prazo'], [/água|racor/i, 'Contaminação (água, combustível, partículas)', 'Causa externa (detrito, colisão, água do rio)'], [/escorva|não funciona/i, 'Não funciona quando acionado', 'Manutenção não feita ou fora do prazo'], [/ruído|rolamento|vibra/i, 'Vibração ou ruído anormal', 'Desgaste natural (fim de vida)']];
  oms().filter(o => o.seed).forEach(o => {
    if (o.tipo === 'C' && !o.modo) { const t = (o.descricao || '') + ' ' + (o.equip || ''), m = regra.find(r => r[0].test(t)) || [0, 'Outro', 'Causa não identificada']; o.modo = m[1]; o.causaCat = m[2]; }
    if (o.status === 'encerrada' && !o.hh) { o.hh = String(o.tipo === 'C' ? Math.round(4 + R() * 26) : Math.round(2 + R() * 8)); o.custoMat = String(Math.round((o.tipo === 'C' ? 600 + R() * 5200 : 150 + R() * 900) / 10) * 10); if (o.tipo === 'C' && R() > .6) o.custoServ = String(Math.round((800 + R() * 6000) / 10) * 10); }
    if (o.tipo === 'C' && o.status === 'encerrada' && !o.efRes && o.fechadoAt && Date.now() - o.fechadoAt > 95 * 864e5) { o.efRes = R() > .2 ? 'Eficaz' : 'Não eficaz'; o.efData = isoD(new Date(o.fechadoAt + 92 * 864e5)); o.efBy = 'Supervisor de Manutenção'; }
    if (o.tipo === 'P' && o.status === 'encerrada' && !o.alvoH && o.hreal) o.alvoH = +o.hreal + (R() > .15 ? 10 : -12);
    put.push(o);
  });
  if (!recs('laudo').some(l => l.seed)) exemploLaudos(R).forEach(l => put.push(l));
  [['Bomba injetora (recondicionada)', 'MCP', '1', '1', '25', 'Diesel Norte'], ['Turbocompressor', 'MCP', '0', '1', '30', 'Turbo Manaus'], ['Mangueira de alta pressão do governo (kit)', 'GOV', '2', '2', '7', 'Hidráulica Amazonas'], ['Bomba de água bruta', 'MCP', '1', '1', '20', 'Diesel Norte'], ['Embreagem do reversor', 'HITACHI', '1', '1', '45', 'Representante Hitachi']].forEach((x, i) => { if (!recs('peca').length) put.push({ id: 'ex-peca-' + i, kind: 'peca', nome: x[0], equip: EQN[x[1]] ? x[1] : '', estoque: x[2], minimo: x[3], prazo: x[4], forn: x[5], seed: true, createdAt: Date.now(), updatedAt: Date.now() }); });
  put.forEach(r => S.recs.set(r.id, r)); if (MEM) put.forEach(r => MEM.set(r.id, r)); else await DB.putMany(put);
  await kvSet('tecV', 2);
}
// laudos de óleo de exemplo (um por MCP); também chamado sozinho em js/81 quando o aparelho ficou sem laudos
function exemploLaudos(R) {
  const out = []; overDados().forEach((x, i) => { let b = recs('base').find(r => r.seed && r.vessel === x.v.id && r.pos === x.pos && r.item === '1.1.29');
    if (!b) { const hr = horAtual(x.v.id, x.pos); if (!hr) return; const d = pD(hr.date); d.setDate(d.getDate() - 20 - Math.round(R() * 100)); b = { date: isoD(d), h: Math.max(400, Math.round(hr.h - 200 - R() * 700)) }; }   // exemplo antigo sem o 1.1.29
    const ruim = x.v.nome === 'CJA II' && x.pos === 'BB', meio = x.v.nome === 'CJA XX' && x.pos === 'BB';
    out.push({ id: 'ex-laudo-' + x.v.id + x.pos, kind: 'laudo', vessel: x.v.id, pos: x.pos, date: b.date, h: b.h, hOleo: String(180 + Math.round(R() * 150)), lab: 'Laboratório (exemplo)', num: 'EX-' + (1000 + i), vals: { fe: String(ruim ? 92 : meio ? 38 : Math.round(12 + R() * 22)), cr: String(ruim ? 13 : Math.round(1 + R() * 4)), al: String(Math.round(2 + R() * 6)), cu: String(Math.round(3 + R() * 10)), pb: String(Math.round(1 + R() * 6)), si: String(ruim ? 26 : Math.round(5 + R() * 9)), na: String(Math.round(4 + R() * 12)), agua: '0,05', comb: meio ? '2,6' : '0,8', fuligem: String(ruim ? '2,4' : '0,' + Math.round(4 + R() * 5)), tbn: String(ruim ? '4,6' : (7 + R() * 2).toFixed(1).replace('.', ',')), visc: (ruim ? 12.8 : 13.6 + R() * 1.2).toFixed(1).replace('.', ',') }, seed: true, createdAt: Date.now(), updatedAt: Date.now() }); });
  return out;
}

/* ---------- 7 · matriz de condição da frota (substitui os cartões como vista padrão) ---------- */
   // só a matriz (os botões Matriz/Cartões saíram)
function frotaMatriz() {
  const SO = { venc: 3, viag: 2, ok: 1, sem: 0 };
  const L = S.cfg.frota.map(v => {
    const p = painelVessel(v).filter(x => x.s.st !== 'cond'), n = { venc: 0, viag: 0, ok: 0, sem: 0 }; p.forEach(x => n[x.s.st]++);
    const it = interditada(v.id), bq = p.filter(x => x.s.st === 'venc' && x.t.prio === 'Crítica' && !x.om), comOM = p.filter(x => x.om).length;
    const sis = SISTEMAS.map((_, i) => { const q = p.filter(x => parseInt(x.t.id) === i + 1); if (!q.length) return null; const c = { venc: 0, viag: 0, ok: 0, sem: 0 }; q.forEach(x => c[x.s.st]++); const pior = Object.keys(c).filter(k => c[k]).sort((a, b) => SO[b] - SO[a])[0]; return { c, pior, n: q.length }; });
    const aval = n.venc + n.viag + n.ok, ader = aval ? (n.viag + n.ok) / aval * 100 : null;
    const mcp = mcpPos(v).map(pos => ({ pos, h: horAtual(v.id, pos) }));
    const sit = it ? 3 : bq.length ? 2 : n.venc ? 1 : 0;
    return { v, n, it, bq, comOM, sis, ader, mcp, sit };
  }).sort((a, b) => b.sit - a.sit || b.n.venc - a.n.venc || (a.ader || 0) - (b.ader || 0));
  L.forEach(x => { if (foraOp(x.v)) { x.sit = -1; x.fora = foraOp(x.v); } }); L.sort((a, b) => (a.fora ? 1 : 0) - (b.fora ? 1 : 0));   // fora de operação no fim
  L.forEach(x => { if (x.sit < 0) { x.noPend = []; return; } const P = fr27Pend(x.v.id); x.noPend = P; if (x.sit < 2 && P.some(p => p.c === 'Crítica')) x.sit = 2; else if (x.sit < 1 && P.some(p => p.c === 'Alta')) x.sit = 1; });   // falha sem OM: Crítica bloqueia, Alta restringe
  L.sort((a, b) => b.sit - a.sit || b.n.venc - a.n.venc || (a.ader || 0) - (b.ader || 0));
  L.forEach(x => { if (x.sit >= 0 && x.sit < 1 && popaPend(x.v).length) x.sit = 1; });   // troca de óleo do motor de popa / motobomba a cada saída
  return L;
}

/* ---------- 8 · cronograma de manutenção (projetado do Anexo I) ---------- */
const CRONO_FORA = ['11.1.2', '11.3.2'];   // motor de popa e motobomba 5 HP: troca a cada saída, fora do cronograma


/* ---------- 9 · menu na ordem do ciclo de gestão (PDCA) ---------- */
{
  const N = [
    { id: 'inicio', nome: 'Painel de gestão', views: [['geral', 'Painel de gestão']] },
    { id: 'plan', nome: 'Planejamento', views: [['matriz', 'Plano de manutenção · Anexo I'], ['crono', 'Cronograma'], ['emitir', 'Programação da janela'], ['plano', 'Plano de lubrificação']] },
    { id: 'exec', nome: 'Execução', views: [['acomp', 'OMs em execução'], ['prev', 'Preventivas · II-B'], ['corr', 'Corretivas · II-A'], ['lubreg', 'Trocas de óleo · FR 049_B'], ['hist', 'Histórico de OMs']], extra: ['om'] },
    { id: 'cond', nome: 'Controle da condição', views: [['frota', 'Vencimentos'], ['lub', 'Vencimentos de lubrificação'], ['over', 'MBC · MCP'], ['calib', 'Calibração do MCP'], ['doca', 'Docagem'], ['hor', 'Horímetros']] },
    { id: 'anal', nome: 'Análise e melhoria', views: [['falhas', 'Análise de falhas'], ['kpi', 'Indicadores (KPI)'], ['lubcons', 'Consumo e OLUC'], ['rel', 'Relatório mensal'], ['apres', 'Apresentação técnica']] },
    { id: 'apoio', nome: 'Apoio técnico', views: [['bib', 'Biblioteca'], ['pecas', 'Sobressalentes críticos'], ['terc', 'Prestadores de serviço'], ['trein', 'Treinamentos']] },
    { id: 'adm', nome: 'Administração', views: [['admin', 'Administração']], cfg: true },
  ];
  ICO.plan = '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h3M13 13h4M13 17h4"/>';
  ICO.exec = ICO.oms; ICO.anal = ICO.ger; ICO.apoio = ICO.bib || ICO.ref;
  SECOES.splice(0, SECOES.length, ...N);
}

/* ---------- 10 · Plano de manutenção (Anexo I) no modelo do GitHub: agrupado por sistema e equipamento ---------- */
MX.prio = MX.prio || ''; MX.ab = MX.ab || new Set();
const PRIO_C = { 'Crítica': 'cr', 'Alta': 'al', 'Média': 'me', 'Baixa': 'ba' };
/* Anexo I num bloco só (24/10/2026): cabeçalho com Imprimir e PDF completo, e a lista dentro do cartão "Itens do plano" (antes eram 3 camadas por cima) */
function vMatriz() {
  const q = MX.q.toLowerCase();
  const l = A1.filter(t => t.kind !== 'sup' && (!MX.sis || t.sis.startsWith(MX.sis)) && (!MX.prio || t.prio === MX.prio) && (!q || [t.id, t.eqn, t.item, t.chk, t.desc, t.norm].join(' ').toLowerCase().includes(q)));
  const grupos = []; l.forEach(t => { let g = grupos[grupos.length - 1]; if (!g || g.sis !== t.sis) { g = { sis: t.sis, eqs: [] }; grupos.push(g); } let e = g.eqs[g.eqs.length - 1]; if (!e || e.eqn !== t.eqn) { e = { eq: t.eq, eqn: t.eqn, eqd: t.eqd, itens: [] }; g.eqs.push(e); } e.itens.push(t); });
  const freq = t => { const ov = (S.cfg.intervalos || {})[t.id], iv = intervalo(t); return `<b class="a1-fq">${esc(t.freq)}</b>${ov ? `<div><span class="pill p-warn">ajustado: ${[iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' meses' : ''].filter(Boolean).join(' ou ')}</span></div>` : ''}`; };
  const linha = t => `<tr class="a1-it${MX.open === t.id ? ' on' : ''}" data-mx="${t.id}"><td class="a1-n">${t.id}</td><td>${freq(t)}</td><td><div class="a1-item">${esc(t.item)}</div><div class="a1-chk">${esc(t.chk)}</div></td><td><span class="a1-p ${PRIO_C[t.prio] || ''}">${esc(t.prio)}</span></td><td class="a1-rg">${t.regs.map(r => `<span>${r.toUpperCase()}</span>`).join('')}</td><td class="a1-x">${MX.open === t.id ? '−' : '+'}</td></tr>
    ${MX.open === t.id ? `<tr class="a1-det"><td colspan="6"><div class="a1-dg"><div><h4>Descrição / ação</h4><p>${esc(t.desc)}</p><h4>Página do manual</h4><p>${esc(t.pag)}</p><h4>Base normativa</h4><p class="note">${esc(t.norm)}</p></div><div><h4>Método executivo</h4><ol>${t.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><h4>Registro NP 055</h4><p class="note">${esc(t.reg)}</p></div></div></td></tr>` : ''}`;
  return `<div class="vh"><div><h1>Plano de manutenção · Anexo I</h1><p>Matriz de Manutenção Preventiva da NP 055 (item 7.2): o que fazer, intervalo (horas OU meses, o que ocorrer primeiro), prioridade e registro. Clique num item para ver a descrição, o método executivo e a base normativa. O cronograma é calculado a partir deste plano.</p></div><span class="sp"></span><button class="mbtn" data-a1pr="0" title="Nº, frequência, item, prioridade, página do manual e registros">🖨 Imprimir</button><details class="pt-mais"><summary class="mbtn" title="Mais opções">⋯</summary><div><button class="mbtn" data-a1pr="1" title="Inclui descrição, método executivo e base normativa">🖨 PDF completo</button><button class="mbtn" data-a1crit title="Equipamentos com itens Críticos ou Alta, para a auditoria">🖨 PDF dos equipamentos críticos (NP 6)</button></div></details></div>
   <div class="card"><h2>Itens do plano</h2><div class="a1-bar"><input id="mxQ" placeholder="Buscar por nº, equipamento, item, norma…" value="${esc(MX.q)}"><select id="mxS"><option value="">Todos os sistemas</option>${SISTEMAS.map(s => { const k = s.split(' ')[0].replace('.0', '.'); return `<option value="${k}"${MX.sis === k ? ' selected' : ''}>${s}</option>`; }).join('')}</select><select id="mxP"><option value="">Todas as prioridades</option>${['Crítica', 'Alta', 'Média', 'Baixa'].map(p => `<option${MX.prio === p ? ' selected' : ''}>${p}</option>`).join('')}</select><span class="sp"></span><span class="note">${l.length} de ${A1.filter(t => t.kind !== 'sup').length} itens</span></div>
   <div class="a1-leg"><button class="mbtn sm" data-a1all="1">＋ Expandir todos</button><button class="mbtn sm" data-a1all="0">− Recolher todos</button><span style="width:10px"></span>Prioridade (NP 055 · 5.5.1): <span class="a1-p cr">Crítica</span><span class="a1-p al">Alta</span><span class="a1-p me">Média</span><span class="a1-p ba">Baixa</span></div>
   <div class="a1-lista">${grupos.length ? grupos.map(g => { const n = parseInt(g.sis), filtro = !!(q || MX.sis || MX.prio), ab = filtro || MX.ab.has(n); return `<section class="a1-sis${ab ? ' ab' : ''}"><header data-a1s="${n}" role="button" aria-expanded="${ab}" tabindex="0"><span class="a1-num">${n}</span><h3>${esc(g.sis.replace(/^\d+\.\s*/, ''))}</h3><span class="note">${g.eqs.length} equipamento(s) · ${g.eqs.reduce((a, e) => a + e.itens.length, 0)} itens${g.eqs.some(e => e.itens.some(t => t.prio === 'Crítica')) ? ` · <span class="a1-crn">${g.eqs.reduce((a, e) => a + e.itens.filter(t => t.prio === 'Crítica').length, 0)} críticos</span>` : ''}</span><span class="a1-tg">${ab ? '−' : '+'}</span></header>${!ab ? '' : `
     ${g.eqs.map(e => `<div class="a1-eq"><div class="a1-eqh"><span class="a1-code">${esc(e.eq)}</span><div><b>${esc(e.eqn)}</b>${e.eqd ? `<div class="note">${esc(e.eqd)}</div>` : ''}</div></div>
      <table class="a1-t"><thead><tr><th style="width:70px">Nº</th><th style="width:170px">Frequência</th><th>Item · serviço</th><th style="width:96px">Prioridade</th><th style="width:170px">Registros</th><th style="width:28px"></th></tr></thead><tbody>${e.itens.map(linha).join('')}</tbody></table></div>`).join('')}`}</section>`; }).join('') : '<div class="card note">Nenhum item com esse filtro.</div>'}</div></div>`;
}
AFTER.matriz = () => { const m = $('#main');
  m.oninput = e => { if (e.target.id === 'mxQ') { MX.q = e.target.value; clearTimeout(m._t); m._t = setTimeout(() => { render(); const i = $('#mxQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); } };
  m.onchange = e => { if (e.target.id === 'mxP') { MX.prio = e.target.value; render(); } if (e.target.id === 'mxS') { MX.sis = e.target.value; render(); } };
  m.onclick = e => { const p = e.target.closest('[data-a1pr]'); if (p) { a1Imprimir(p.dataset.a1pr === '1'); return; } if (e.target.closest('[data-a1crit]')) { critPDF(); return; }
    const h = e.target.closest('[data-a1s]'); if (h) { const n = +h.dataset.a1s; if (q0()) return; MX.ab.has(n) ? MX.ab.delete(n) : MX.ab.add(n); render(); return; }
    const a = e.target.closest('[data-a1all]'); if (a) { MX.ab = a.dataset.a1all === '1' ? new Set(SISTEMAS.map((_, i) => i + 1)) : new Set(); render(); return; }
    const r = e.target.closest('[data-mx]'); if (r) { MX.open = MX.open === r.dataset.mx ? '' : r.dataset.mx; render(); } };
  m.onkeydown = e => { const h = e.target.closest && e.target.closest('[data-a1s]'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); h.click(); } }; };
const q0 = () => !!(MX.q || MX.sis || MX.prio);

/* ---------- 11 · Anexo I em A4 (imprimir ou salvar em PDF) ---------- */
function a1Imprimir(completo) {
  const q = MX.q.toLowerCase(), filtro = !!(q || MX.sis || MX.prio);
  const l = A1.filter(t => t.kind !== 'sup' && (!MX.sis || t.sis.startsWith(MX.sis)) && (!MX.prio || t.prio === MX.prio) && (!q || [t.id, t.eqn, t.item, t.chk, t.desc, t.norm].join(' ').toLowerCase().includes(q)));
  const G = []; l.forEach(t => { let g = G[G.length - 1]; if (!g || g.sis !== t.sis) { g = { sis: t.sis, eqs: [] }; G.push(g); } let e = g.eqs[g.eqs.length - 1]; if (!e || e.eqn !== t.eqn) { e = { eq: t.eq, eqn: t.eqn, eqd: t.eqd, itens: [] }; g.eqs.push(e); } e.itens.push(t); });
  const pc = { 'Crítica': 'cr', 'Alta': 'al', 'Média': 'me', 'Baixa': 'ba' }, data = hoje().toLocaleDateString('pt-BR');
  const fq = t => { const ov = (S.cfg.intervalos || {})[t.id], iv = intervalo(t); return esc(t.freq) + (ov ? `<br><i>ajustado: ${[iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' meses' : ''].filter(Boolean).join(' ou ')}</i>` : ''); };
  const linhas = e => e.itens.map(t => `<tr><td class="n">${t.id}</td><td class="fq">${fq(t)}</td><td><b>${esc(t.item)}</b><br>${esc(t.chk)}</td><td><span class="p ${pc[t.prio] || ''}">${esc(t.prio)}</span></td><td class="pg">${esc(t.pag)}</td><td class="rg">${t.regs.map(r => r.toUpperCase()).join(' · ')}</td></tr>
     ${completo ? `<tr class="det"><td></td><td colspan="5"><div class="dg"><div><h5>Descrição / ação</h5><p>${esc(t.desc)}</p></div><div><h5>Método executivo</h5><ol>${t.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><h5>Base normativa</h5><p class="mut">${esc(t.norm)}</p></div></div></td></tr>` : ''}`).join('');
  const corpo = G.map(g => `<section><h2><span>${parseInt(g.sis)}</span>${esc(g.sis.replace(/^\d+\.\s*/, ''))}</h2>${g.eqs.map(e => `<table><thead><tr><th colspan="6" class="eq"><b>${esc(e.eq)}</b> ${esc(e.eqn)}${e.eqd ? ` <em>· ${esc(e.eqd)}</em>` : ''}</th></tr><tr><th style="width:6%">Nº</th><th style="width:13%">Frequência</th><th>Item · serviço</th><th style="width:8%">Prioridade</th><th style="width:16%">Página do manual</th><th style="width:12%">Registros</th></tr></thead><tbody>${linhas(e)}</tbody></table>`).join('')}</section>`).join('');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Anexo I · NP Navecunha 055 · Plano de Manutenção</title><style>
@page{size:A4 landscape;margin:12mm 10mm 14mm}
*{box-sizing:border-box}body{margin:0;font:9pt/1.35 "Segoe UI",Arial,sans-serif;color:#1D2730;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cab{display:flex;align-items:center;gap:14px;border-bottom:2px solid #1F4466;padding-bottom:6px;margin-bottom:8px}.cab img{height:34px}.cab .t{flex:1}.cab h1{margin:0;font-size:14pt;color:#1F4466}.cab p{margin:1px 0 0;color:#5B6874;font-size:8.5pt}
.cab .id{text-align:right;font-size:8pt;color:#5B6874;line-height:1.4}
.leg{font-size:8pt;color:#5B6874;margin:0 0 6px}
section{break-inside:auto;margin-bottom:6px}
h2{font-size:10.5pt;margin:8px 0 4px;background:#1F4466;color:#fff;padding:4px 8px;border-radius:4px;break-after:avoid;display:flex;gap:8px;align-items:center}h2 span{background:rgba(255,255,255,.18);border-radius:3px;padding:0 6px}
table{width:100%;border-collapse:collapse;margin:0 0 6px;break-inside:auto}thead{display:table-header-group}tr{break-inside:avoid}tr.det{break-before:avoid}
th{background:#E1ECF6;color:#1F4466;text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.03em;padding:3px 5px;border:.5pt solid #C9D6E3}
th.eq{background:#F1F6FB;text-transform:none;letter-spacing:0;font-size:9pt;color:#1D2730}th.eq b{color:#1F4466;background:#E1ECF6;border-radius:3px;padding:0 4px;margin-right:4px}th.eq em{font-style:normal;color:#5B6874;font-size:8pt}
td{padding:3px 5px;border:.5pt solid #D5DEE7;vertical-align:top}td.n{font-weight:700;color:#1F4466;white-space:nowrap}td.fq{color:#1F4466;font-weight:600}td.fq i{color:#B26A00;font-weight:400}td.pg,td.rg{font-size:8pt;color:#3C6E95}
.p{display:inline-block;border-radius:8px;padding:0 6px;font-size:7.5pt;font-weight:700}.p.cr{background:#FFFFFF;color:#C5221F}.p.al{background:#E1ECF6;color:#1F4466}.p.me{background:#FBEFD9;color:#B26A00}.p.ba{background:#E3F1E9;color:#2D7A55}
tr.det td{background:#FAFCFE;font-size:8pt}.dg{display:grid;grid-template-columns:1.2fr 1fr;gap:10px}h5{margin:2px 0;font-size:7.5pt;text-transform:uppercase;color:#1F4466;letter-spacing:.04em}.dg p{margin:0 0 4px;white-space:pre-line}.dg ol{margin:0 0 4px;padding-left:14px}.mut{color:#5B6874}
.fim{margin-top:8px;font-size:7.5pt;color:#5B6874;border-top:.5pt solid #C9D6E3;padding-top:4px}
</style></head><body>
<div class="cab"><img src="${LOGOS.nav}" alt=""><div class="t"><h1>Anexo I · Plano de Manutenção Preventiva dos Empurradores</h1><p>NP Navecunha 055 · item 7.2 · intervalo: horas OU meses, o que ocorrer primeiro${filtro ? ' · <b>impressão filtrada</b>' : ''}</p></div><div class="id">${l.length} itens · ${G.length} sistema(s)<br>Emitido em ${data}<br>${completo ? 'Versão completa' : 'Versão resumida'}</div><img src="${LOGOS.vda}" alt=""></div>
<div class="leg">Prioridade (NP 055 · 5.5.1): <span class="p cr">Crítica</span> <span class="p al">Alta</span> <span class="p me">Média</span> <span class="p ba">Baixa</span> · Registros: FR049 = FR 049_B · FR016 = FR 016_E · INSTR = instrumento calibrado · TERC = serviço de terceiro · LOTE = lote/validade do óleo</div>
${corpo}
<p class="fim">Documento controlado pelo SGI · NP Navecunha 055 · Anexo I · gerado pelo SMF em ${data}. Cópia impressa não controlada: confira a revisão vigente antes do uso.</p>
</body></html>`;
  const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
  const d = fr.contentWindow.document; d.open(); d.write(html); d.close();
  const go = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Não foi possível abrir a impressão.'); } setTimeout(() => fr.remove(), 60e3); };
  const imgs = [...d.images]; Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => setTimeout(go, 150));
}
VX.matriz = vMatriz;

/* ---------- 12 · Horímetro do MCP por empurrador: colunas vitrificadas com 3 visões ---------- */

/* ---------- 13 · "Rio do ciclo de óleo": cada MCP é um empurrador navegando até a próxima troca ---------- */

