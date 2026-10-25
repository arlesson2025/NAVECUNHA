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
const CR2 = { v: '', ano: hoje().getMonth() >= 9 ? hoje().getFullYear() + 1 : hoje().getFullYear() };
const cronoBase = (ano, vid) => S.recs.get('crono-' + ano + '-' + vid);
function vCrono2() {
  const ativos = S.cfg.frota.filter(v => !foraOp(v)); if (!CR2.v || !ativos.some(v => v.id === CR2.v)) CR2.v = (ativos[0] || {}).id;
  const v = vessel(CR2.v); if (!v) return '<div class="empty">Nenhuma embarcação em operação.</div>';
  const ano = +CR2.ano, R = cronoMarcas(v, ano), B = cronoBase(ano, v.id), c = ciclo(), hv = hViagem();
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], mesH = hoje().getFullYear() === ano ? hoje().getMonth() : -1;
  const anos = [hoje().getFullYear(), hoje().getFullYear() + 1];
  const TR = { bordo: ['1', 'Troca de óleo', 'Óleo e itens de 250 h · FR 049_B · em viagem: tripulação (Supervisor acompanha pela câmera) · no porto: equipe de manutenção + CTF/MFM'], janela: ['2', 'Janela em Manaus', 'Revisões por hora · equipe de terra · OM da embarcação'], cal: ['3', 'Calendário', 'Trimestral, semestral, anual e longo prazo · mês fixo, aprovado pelo Supervisor'], doca: ['4', 'Docagem', 'Plano próprio · 5 anos ou CSN'] };
  const cel = (l, i) => { const m = l.M[i], bp = B && B.linhas && B.linhas[l.k] ? B.linhas[l.k][i] || 0 : null, pl = B ? bp : m.plan + m.miss;
    const tip = esc([MES[i] + '/' + String(ano).slice(2), ...m.its.slice(0, 12)].join('\n'));
    if (m.ok || m.late) return `<td title="${tip}"><span class="c2 ${m.late ? 'late' : 'ok'}">R${m.ok + m.late > 1 ? '<small>×' + (m.ok + m.late) + '</small>' : ''}</span>${m.miss ? '<span class="c2 miss">P</span>' : ''}</td>`;
    if (m.miss) return `<td title="${tip}"><span class="c2 miss">P</span></td>`;
    if (pl) return `<td title="${tip}"><span class="c2 ${l.tr === 'cal' || l.tr === 'doca' ? 'plan' : 'est'}">P${pl > 1 ? '<small>×' + pl + '</small>' : ''}</span></td>`;
    return `<td${i === mesH ? ' class="hj"' : ''}></td>`; };
  const linhas = R.filter(l => l.tr === 'cal' || l.tr === 'doca' || l.M.some(m => m.plan || m.ok || m.late || m.miss) || l.tr === 'bordo');
  let trAnt = '';
  const corpo = linhas.map(l => { const h = l.tr !== trAnt ? `<tr class="c2-tr"><td colspan="15"><b>${TR[l.tr][0]} · ${TR[l.tr][1]}</b><span>${TR[l.tr][2]}</span></td></tr>` : ''; trAnt = l.tr;
    return h + `<tr><td class="c2-n"><b>${esc(l.nome)}</b><small>${l.its.length} ${l.its.length === 1 ? 'item' : 'itens'} do Anexo I · ${[...new Set(l.its.map(x => x.t.id))].slice(0, 8).join(', ')}${new Set(l.its.map(x => x.t.id)).size > 8 ? '…' : ''}</small></td>${MES.map((_, i) => cel(l, i)).join('')}<td class="c2-tot">${l.M.reduce((a, m) => a + m.ok + m.late, 0)}/${B && B.linhas && B.linhas[l.k] ? B.linhas[l.k].reduce((a, x) => a + x, 0) : l.M.reduce((a, m) => a + m.plan + m.miss + m.ok + m.late, 0)}</td></tr>`; }).join('');
  // próxima janela: o que fazer antes da próxima saída
  const jan = R.filter(l => l.tr === 'janela').map(l => ({ l, p: proxLinha(v, l) })).filter(x => x.p).sort((a, b) => a.p.sc - b.p.sc);
  const oleo = R.filter(l => l.tr === 'bordo').map(l => ({ l, p: proxLinha(v, l) })).filter(x => x.p).sort((a, b) => a.p.sc - b.p.sc);
  const falta = p => p.rest != null ? (p.rest < 0 ? `<b style="color:#D93025">${nf(-p.rest)} h vencido</b>` : `faltam ${nf(p.rest)} h`) : p.dd != null ? (p.dd < 0 ? `<b style="color:#D93025">${-p.dd} d vencido</b>` : `faltam ${p.dd} d`) : '—';
  const quando = p => p.rest == null ? '' : p.rest < hv ? '<span class="pill p-warn">Fazer nesta janela</span>' : `<span class="pill p-mut">em ${Math.floor(p.rest / hv)} ${Math.floor(p.rest / hv) === 1 ? 'viagem' : 'viagens'}</span>`;
  const quandoO = p => p.rest == null ? '' : p.rest < 0 ? '<span class="pill p-bad">Vencida</span>' : p.rest < hv ? '<span class="pill p-warn">Vence na próxima viagem</span>' : '<span class="pill p-ok">Em dia</span>';
  const sel = (k, ops, val) => `<select data-c2="${k}">${ops.map(([a, b]) => `<option value="${a}"${String(a) === String(val) ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  return `<div class="vh"><div><h1>Cronograma de manutenção · ${esc(v.nome)} · ${ano}</h1><p>Tirado do Anexo I (que fica para consulta: como fazer, com o quê, quais regras). Os 160 itens viram poucos serviços, em três trilhas: a troca de óleo com os itens de 250 h (FR 049_B), as revisões por hora na janela em Manaus (equipe de terra) e o que tem mês fixo no calendário.</p></div><span class="sp"></span><button class="mbtn" data-c2pdf>⬇ PDF</button></div>
   <div class="card"><div class="g"><label class="f s2">Embarcação${sel('v', ativos.map(x => [x.id, x.nome]), v.id)}</label><label class="f s2">Ano${sel('ano', anos.map(y => [y, y]), ano)}</label>
    <div class="s6 c2-ciclo"><b>Ciclo de viagem</b> ida <input data-cic="ida" value="${c.ida}"> d · descargas <input data-cic="desc" value="${c.desc}"> d · volta <input data-cic="volta" value="${c.volta}"> d · porto <input data-cic="porto" value="${c.porto}"> d<br><span class="note">1 viagem ≈ <b>${nf(hv)} h de MCP</b> (${c.hNav} h/dia navegando, ${c.hDesc} h/dia nas descargas) · ≈ ${(365 / (c.ida + c.desc + c.volta + c.porto)).toFixed(1).replace('.', ',')} viagens por ano</span></div></div></div>
   <div class="two">
    <div class="card"><h2>1 · Troca de óleo: próximas</h2><div class="tw"><table class="t"><thead><tr><th>Serviço</th><th>Próximo</th><th></th></tr></thead><tbody>${oleo.map(({ l, p }) => `<tr><td><b>${esc(l.nome.replace('Troca de óleo · ', ''))}</b><div class="note">${l.its.length} itens · FR 049_B</div></td><td class="mono">${falta(p)}</td><td>${quandoO(p)}</td></tr>`).join('') || '<tr><td colspan="3" class="note">Sem dados.</td></tr>'}</tbody></table></div><p class="note">Junto com o óleo são feitos os itens de 250 h (correias, pré-filtro, filtros de combustível e de ar, baterias, zincos). Em viagem: a tripulação, com o Supervisor acompanhando pela câmera. No porto: a equipe de manutenção com o CTF ou MFM disponível. Nos dois casos lança-se o FR 049_B, e a troca e esses itens contam como feitos.</p></div>
    <div class="card"><div class="row"><h2>2 · Janela em Manaus: antes da próxima saída</h2><span class="sp"></span><a class="mbtn sm pri" href="#emitir/${v.id}">Programar OM</a></div><div class="tw"><table class="t"><thead><tr><th>Revisão</th><th>Próximo item</th><th></th></tr></thead><tbody>${jan.map(({ l, p }) => `<tr><td><b>${esc(l.nome)}</b><div class="note">${l.its.length} itens</div></td><td class="mono">${falta(p)}<div class="note">${p.t.id} ${esc(p.t.chk)}</div></td><td>${quando(p)}</td></tr>`).join('') || '<tr><td colspan="3" class="note">Sem dados.</td></tr>'}</tbody></table></div><p class="note">Vence na próxima viagem: trocar no porto antes da saída ou mandar óleo e filtros para a tripulação. "Fazer nesta janela" = vence antes de o empurrador voltar da próxima viagem (≈ ${nf(hv)} h).</p></div>
   </div>
   <div class="card"><div class="row"><h2>3 · Cronograma anual ${ano} · ${esc(v.nome)}</h2><span class="sp"></span>
    ${B ? `<span class="pill p-ok">Aprovado por ${esc(B.aprovBy)} em ${brD(B.aprovAt)} · rev. ${B.rev}</span>` : '<span class="pill p-warn">Ainda não aprovado</span>'}
    ${can.admin() ? `<button class="mbtn sm ${B ? '' : 'ok'}" data-c2apr="um">${B ? 'Revisar e reaprovar' : '✓ Aprovar este cronograma'}</button><button class="mbtn sm" data-c2apr="frota">Aprovar para a frota toda</button>` : ''}</div>
    <div class="c2-leg"><span><i class="c2 plan">P</i>programado (mês fixo)</span><span><i class="c2 est">P</i>previsto pelo horímetro</span><span><i class="c2 ok">R</i>realizado no prazo</span><span><i class="c2 late">R</i>realizado com atraso</span><span><i class="c2 miss">P</i>venceu e não foi feito</span></div>
    <div class="tw"><table class="c2-t"><thead><tr><th>Serviço</th>${MES.map((m, i) => `<th${i === mesH ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>R / P</th></tr></thead><tbody>${corpo}</tbody></table></div>
    <p class="note">${B ? 'Os P mostram o cronograma aprovado; o Cronograma × Realizado compara com ele. ' : 'Ao aprovar, os P de cada mês ficam congelados como linha de base do ano. '}Trilhas 1 e 2 são por horímetro: o mês é a previsão pela média de horas do empurrador e acompanha as leituras. Passe o mouse numa célula para ver os itens e o nº da OM ou do FR 049_B.</p></div>`;
}
{ const s = SECOES.find(x => x.id === 'plan'); if (s) { const i = s.views.findIndex(x => x[0] === 'crono'); if (i >= 0) s.views[i][1] = 'Cronograma anual'; const m = s.views.findIndex(x => x[0] === 'matriz'); if (m >= 0) s.views[m][1] = 'Anexo I · consulta'; }
  const c = s && s.views.splice(s.views.findIndex(x => x[0] === 'crono'), 1)[0]; if (c) s.views.unshift(c); }

