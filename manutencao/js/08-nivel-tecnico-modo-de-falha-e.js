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

/* Anexo I num bloco só (24/10/2026): cabeçalho com Imprimir e PDF completo, e a lista dentro do cartão "Itens do plano" (antes eram 3 camadas por cima) */




/* ---------- 11 · Anexo I em A4 (imprimir ou salvar em PDF) ---------- */



/* ---------- 12 · Horímetro do MCP por empurrador: colunas vitrificadas com 3 visões ---------- */

/* ---------- 13 · "Rio do ciclo de óleo": cada MCP é um empurrador navegando até a próxima troca ---------- */

