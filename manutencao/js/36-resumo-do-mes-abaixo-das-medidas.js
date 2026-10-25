/* ===== Resumo do mês (abaixo das medidas de mitigação): OMs fechadas por empurrador + Pareto de falhas por sistema ===== */
let RM_SEL = null;   // null = mês atual · 'todos' = 12 meses · ou índice do mês (y*12+m)
const rmSis = s => String(s || '?').replace(/^\d+\.0 /, '').replace(/^\d+\. /, '').replace('Sistema de ', '').replace('Manobrabilidade e Governo', 'Governo').replace('Geração Elétrica de Bordo', 'Geração').replace('Alimentação de Combustível', 'Combustível').replace('Salvaguarda e Flutuabilidade', 'Salvaguarda').replace('Sinalização e Comunicação', 'Comunicação').replace('Resposta a Emergências', 'Emergências').replace('Fainas de Amarra e Carga', 'Amarra').replace('Auxílio à Navegação', 'Aux. navegação');
function rmBarras(lab, P, C) {
  const W = 640, H = 230, L = 30, R = 8, T = 34, B = 26, n = lab.length, gw = (W - L - R) / Math.max(1, n), bw = Math.min(26, gw * .55);
  const mx = Math.max(1, ...P.map((p, i) => p + C[i])), Y = v => T + (H - T - B) * (1 - v / mx);
  let g = `<g font-size="10.5" fill="#475569"><rect x="${L}" y="6" width="11" height="11" rx="2" fill="#2563EB"/><text x="${L + 16}" y="15">Preventiva</text><rect x="${L + 96}" y="6" width="11" height="11" rx="2" fill="#D97706"/><text x="${L + 112}" y="15">Corretiva</text></g>`;
  const tk = mx <= 5 ? [...Array(mx + 1).keys()] : [0, Math.round(mx / 2), mx];
  tk.forEach(t => g += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${L - 8}" y="${Y(t) + 3}" text-anchor="end" font-size="10" fill="#64748B">${t}</text>`);
  lab.forEach((l, i) => { const x = L + i * gw + (gw - bw) / 2, p = P[i], c = C[i];
    if (p) g += `<rect x="${x}" y="${Y(p)}" width="${bw}" height="${Y(0) - Y(p)}" rx="3" fill="#2563EB"/>`;
    if (c) g += `<rect x="${x}" y="${Y(p + c)}" width="${bw}" height="${Y(p) - Y(p + c)}" rx="3" fill="#D97706"/>`;
    if (p + c) g += `<text x="${x + bw / 2}" y="${Y(p + c) - 5}" text-anchor="middle" font-size="10.5" fill="#0F172A">${p + c}</text>`;
    g += `<text x="${L + i * gw + gw / 2}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="#475569">${esc(l)}</text>`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>`;
}
function rmPareto(E) {
  const W = 640, H = 230, L = 30, R = 30, T = 24, B = 26, n = E.length, gw = (W - L - R) / Math.max(1, n), bw = Math.min(76, gw * .6), tot = E.reduce((a, e) => a + e[1], 0);
  const mx = Math.max(1, ...E.map(e => e[1])), Y = v => T + (H - T - B) * (1 - v / mx), Yp = p => T + (H - T - B) * (1 - p);
  let g = '', acc = 0, pts = [];
  const tk = mx <= 5 ? [...Array(mx + 1).keys()] : [0, Math.round(mx / 2), mx];
  tk.forEach(t => g += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${L - 8}" y="${Y(t) + 3}" text-anchor="end" font-size="10" fill="#64748B">${t}</text>`);
  E.forEach(([s, v], i) => { const cx = L + i * gw + gw / 2, x = cx - bw / 2; acc += v; const p = acc / tot; pts.push([cx, Yp(p), p]);
    g += `<rect x="${x}" y="${Y(v)}" width="${bw}" height="${Y(0) - Y(v)}" rx="3" fill="#2563EB"/><text x="${cx}" y="${Y(v) - 5}" text-anchor="middle" font-size="10.5" fill="#0F172A">${v}</text><text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="#475569">${esc(s.length > 14 ? s.slice(0, 13) + '…' : s)}</text>`; });
  g += `<polyline points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="#D97706" stroke-width="2"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#D97706"/><text x="${p[0] + 7}" y="${p[1] - 6}" font-size="10" fill="#D97706">${Math.round(p[2] * 100)}%</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>`;
}
function resumoMesHTML() {
  const d = hoje(), cur = d.getFullYear() * 12 + d.getMonth(), sel = RM_SEL == null ? cur : RM_SEL, todos = sel === 'todos';
  const ini = todos ? new Date(d.getFullYear(), d.getMonth() - 11, 1) : new Date(Math.floor(sel / 12), sel % 12, 1), fim = todos ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : new Date(Math.floor(sel / 12), sel % 12 + 1, 1);
  const MS = [...Array(6).keys()].map(i => cur - 5 + i);
  const tit = todos ? 'Últimos 12 meses' : MESESL[sel % 12] + '/' + Math.floor(sel / 12);
  const V = S.cfg.frota.filter(v => !foraOp(v));
  const enc = oms().filter(o => o.status === 'encerrada' && o.fechadoAt >= ini.getTime() && o.fechadoAt < fim.getTime());
  const P = V.map(v => enc.filter(o => o.vessel === v.id && o.tipo !== 'C').length), C = V.map(v => enc.filter(o => o.vessel === v.id && o.tipo === 'C').length);
  const fal = oms().filter(o => o.tipo === 'C' && o.abertura && pDT(o.abertura) >= ini && pDT(o.abertura) < fim), cnt = {};
  fal.forEach(o => { const s = rmSis(o.sistema); cnt[s] = (cnt[s] || 0) + 1; });
  const E = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const cab = `<div class="ab4-sec rm-sec"><h2>Resumo do mês · ${esc(tit.charAt(0).toUpperCase() + tit.slice(1))}</h2><span class="sp"></span><div class="rk-f" style="margin:0">${MS.map(k => `<button data-rmm="${k}" class="${!todos && k === sel ? 'on' : ''}">${MESESL[k % 12].slice(0, 3).toLowerCase()}</button>`).join('')}<button data-rmm="todos" class="${todos ? 'on' : ''}">Todos os meses</button></div></div>`;
  const c1 = `<div class="card rm" data-lk="OMs fechadas por embarcacao"><h2>O que foi feito · OMs fechadas por empurrador</h2><p class="rm-sub">Preventivas (azul) × corretivas (âmbar) · ${enc.length} OM${enc.length === 1 ? '' : 's'} fechada${enc.length === 1 ? '' : 's'}</p>${rmBarras(V.map(v => v.nome.replace(/^CJA /, '')), P, C)}</div>`;
  const c2 = `<div class="card rm" data-lk="Pareto por sistema"><h2>O que mais quebrou · Pareto por sistema</h2><p class="rm-sub">Falhas registradas no período (${fal.length}) e % acumulado</p>${E.length ? rmPareto(E) : '<div class="note" style="padding:30px 0">Nenhuma falha registrada no período.</div>'}</div>`;
  return cab + `<div class="two">${c1}${c2}</div>`;
}
VX.kpi = vKpi;
document.addEventListener('click', e => { const b = e.target.closest('[data-rmm]'); if (!b) return; RM_SEL = b.dataset.rmm === 'todos' ? 'todos' : +b.dataset.rmm; render(); });
{ const st = document.createElement('style'); st.textContent = `.card.rm h2{margin:0;font-size:15px}.rm-sub{margin:3px 0 8px;color:#334155;font-size:13px}.rm-sec{align-items:center!important;flex-wrap:wrap}`; document.head.appendChild(st); }

