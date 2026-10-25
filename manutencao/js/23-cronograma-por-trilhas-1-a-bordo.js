/* ===== Cronograma por trilhas: 1 a bordo (troca de óleo + itens de 250 h, FR 049_B) · 2 janela em Manaus (equipe de terra) · 3 calendário aprovado ===== */
'use strict';
const CICLO0 = { ida: 10, desc: 10, volta: 6, porto: 12, hNav: 24, hDesc: 4 };
const ciclo = () => Object.assign({}, CICLO0, S.cfg.ciclo || {});
const hViagem = () => { const c = ciclo(); return (c.ida + c.volta) * c.hNav + c.desc * c.hDesc; };
function trilha(v, pos, t) {
  if (t.id === DOCA.item || (DOCA.junto || []).includes(t.id)) return 'doca';
  if (lubEquip(v).some(e => e.pos === pos && e.itens.includes(t.id)) || compDe(v, pos, t)) return 'bordo';
  const iv = intervalo(t, v, pos);
  if (iv.h && pos !== 'UN') return 'janela';
  return 'cal';
}

/* ---------- linhas do cronograma de uma embarcação ---------- */
const PAC_H = [[1000, 'revisão 500 h'], [2000, 'revisão 1.000 h'], [4000, 'revisão 2.000 h'], [1e9, 'grandes revisões (4.000 h ou mais)']];
const PAC_M = m => m <= 3 ? 'Trimestral' : m <= 6 ? 'Semestral' : m <= 12 ? 'Anual' : 'Longo prazo (2 a 10 anos)';
function cronoLinhas(v) {
  const L = {}, add = (k, o, t, pos) => { (L[k] = L[k] || Object.assign({ k, its: [] }, o)).its.push({ t, pos }); };
  posicoes(v).forEach(pos => itensDe(v, pos).forEach(t => {
    if (t.kind !== 'prog' || (typeof CRONO_FORA !== 'undefined' && CRONO_FORA.includes(t.id)) || !aplica(v, pos, t)) return;
    const tr = trilha(v, pos, t), iv = intervalo(t, v, pos), mot = posCurtoE(v, pos);
    if (tr === 'doca') return add('d|doca', { tr, ord: 90, nome: 'Docagem', sub: 'plano próprio · fora da OM de janela' }, t, pos);
    if (tr === 'bordo') { const e = lubEquip(v).find(x => x.pos === pos && x.itens.includes(t.id)) || lubEquip(v).find(x => x.pos === pos && (x.g === 'mcp' || x.g === 'mca'));
      const g = e ? e.key : pos; return add('b|' + g, { tr, ord: 10 + ['mcp1', 'mcp2', 'crp1', 'crp2', 'mca1', 'mca2', 'inc', 'hid'].indexOf(g), nome: 'Troca de óleo · ' + (e ? e.nome : mot), sub: 'FR 049_B · em viagem: tripulação · no porto: equipe + CTF/MFM' }, t, pos); }
    if (tr === 'janela') { const i = PAC_H.findIndex(([lim]) => iv.h < lim); return add('j|' + pos + '|' + i, { tr, ord: 30 + posicoes(v).indexOf(pos) * 5 + i, nome: mot + ' · ' + PAC_H[i][1], sub: 'janela em Manaus · equipe de terra' }, t, pos); }
    const p = PAC_M(iv.m || 12); add('c|' + p, { tr, ord: 70 + ['Trimestral', 'Semestral', 'Anual', 'Longo prazo (2 a 10 anos)'].indexOf(p), nome: p, sub: 'calendário · embarcação e propulsão' }, t, pos);
  }));
  const out = [];   // uma linha por equipamento dentro de cada pacote
  Object.values(L).sort((a, b) => a.ord - b.ord).forEach(l => { const G = {}; l.its.forEach(x => { const k = x.t.eq === 'MBINC' && v.mca && v.mca.MCA3 ? 'MCA|MCA3' : eqKeyDe(x.pos, x.t); (G[k] = G[k] || []).push(x); });   // CJA XX: bomba de incêndio e o motor dela (MCA 3) numa linha só
    Object.entries(G).forEach(([k, its]) => out.push(Object.assign({}, l, { k: l.k + '|' + k, eqKey: k, its }))); });
  return out;
}
function cronoMarcas(v, ano) {   // por PACOTE: uma execução programada por vencimento do pacote (todos os itens juntos)
  CXI = cxIndice(); const ini = new Date(ano, 0, 1), fim = new Date(ano + 1, 0, 1), hj = hoje(), cyc = ciclo(), rateC = hViagem() / Math.max(1, cyc.ida + cyc.desc + cyc.volta + cyc.porto);
  return cronoLinhas(v).map(l => { const M = Array.from({ length: 12 }, () => ({ plan: 0, ok: 0, late: 0, miss: 0, its: [] }));
    const pos0 = l.its[0].pos, hp = posHor(pos0, l.its[0].t, v.id), rate = (typeof horasDiaPos === 'function' && horasDiaPos(v.id, hp)) || rateC;
    const ivs = l.its.map(({ t, pos }) => intervalo(t, v, pos)), oil = l.tr === 'bordo' ? l.its.find(({ t, pos }) => !compDe(v, pos, t)) : null;
    const ivH = l.tr === 'cal' || l.tr === 'doca' ? null : oil ? intervalo(oil.t, v, oil.pos).h : Math.min(...ivs.map(x => x.h || 1e9)), ivM = oil ? intervalo(oil.t, v, oil.pos).m : Math.min(...ivs.map(x => x.m || 1e9));
    const passoD = Math.min(ivH && ivH < 1e9 ? ivH / rate : 1e9, ivM && ivM < 1e9 ? ivM * 30.44 : 1e9); if (!(passoD < 1e9)) return Object.assign({}, l, { M });
    // realizados (qualquer item do pacote no mês = execução) e vencidos não feitos
    const feitos = Array.from({ length: 12 }, () => new Set()); let prox = null;
    l.its.forEach(({ t, pos }) => { const r = cxLinha(v, pos, t, ano); if (!r) return; r.marks.forEach(m => { const c = M[m.d.getMonth()];
      if (m.k === 'ok' || m.k === 'late') { feitos[m.d.getMonth()].add((m.ev && m.ev.num) || m.d.toISOString().slice(0, 10)); c[m.k === 'late' ? 'late' : 'ok'] = 1; c.its.push(t.id + ' · ' + (m.ev && m.ev.src ? m.ev.src : 'feito') + (m.k === 'late' ? ' (atraso)' : '')); }
      if (m.k === 'miss') { c.miss = 1; c.its.push(t.id + ' venceu e não foi feito'); }
      if (m.k === 'corr') { c.corr = 1; c.its.push(t.id + ' · ' + (m.ev && m.ev.src || 'corretiva')); }
      if ((m.k === 'plan' || m.k === 'miss') && (!prox || m.d < prox)) prox = m.d; }); });
    const cap = Math.max(1, Math.round(30.44 / passoD)); M.forEach((c, i) => { if (c.ok || c.late) { const n = Math.min(cap, feitos[i].size || 1); c.ok = c.late ? 0 : n; c.late = c.late ? n : 0; } });   // uma execução do pacote por mês (mais só se o intervalo for menor que um mês)
    // programados: do primeiro vencimento do pacote em diante, no passo do pacote
    if (prox) { let d = new Date(Math.max(prox.getTime(), Math.min(hj.getTime(), fim.getTime()))); if (prox < hj && prox >= ini) d = new Date(prox); let n = 0;
      while (d < fim && n++ < 60) { if (d >= ini && d >= new Date(hj.getFullYear(), hj.getMonth(), 1)) { const c = M[d.getMonth()]; if (!c.ok && !c.late && !c.miss) { c.plan++; } } d = new Date(d.getTime() + passoD * 864e5); } }
    l.its.forEach(({ t }) => M.forEach(c => { if (c.plan && c.its.length < 14 && !c.its.includes(t.id)) c.its.push(t.id + ' ' + t.chk); }));
    return Object.assign({}, l, { M, passoD }); });
}
/* ---------- próximo vencimento por linha (para a janela e o óleo) ---------- */
function proxLinha(v, l) {
  let best = null; l.its.filter(({ t, pos }) => l.tr !== 'bordo' || !compDe(v, pos, t)).forEach(({ t, pos }) => { const s = situacao(v, pos, t); if (!s.L && s.st === 'sem') return; const hr = horAtual(v.id, posHor(pos, t, v.id)), rest = s.alvoH != null && hr ? s.alvoH - hr.h : null;
    const dd0 = s.alvoD ? Math.round((pD(s.alvoD) - hoje()) / 864e5) : null, dd = dd0 != null && dd0 < -3650 ? null : dd0; const scH = rest != null ? rest / Math.max(1, horasDiaPos ? (horasDiaPos(v.id, posHor(pos, t, v.id)) || 10) : 10) : null, sc = scH == null ? dd : dd == null ? scH : Math.min(scH, dd);   // o que vencer primeiro: horas ou data
    if (sc == null) return; if (!best || sc < best.sc) best = { sc, rest, dd, s, t, pos }; });
  return best;
}

/* ---------- tela ---------- */
const cronoBase = (ano, vid) => S.recs.get('crono-' + ano + '-' + vid);
{ const s = SECOES.find(x => x.id === 'plan'); if (s) { const i = s.views.findIndex(x => x[0] === 'crono'); if (i >= 0) s.views[i][1] = 'Cronograma anual'; const m = s.views.findIndex(x => x[0] === 'matriz'); if (m >= 0) s.views[m][1] = 'Anexo I · consulta'; }
  const c = s && s.views.splice(s.views.findIndex(x => x[0] === 'crono'), 1)[0]; if (c) s.views.unshift(c); }

