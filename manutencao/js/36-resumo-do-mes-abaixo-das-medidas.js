/* ===== Resumo do mês (abaixo das medidas de mitigação): OMs fechadas por empurrador + Pareto de falhas =====
   Pedido do Supervisor (25/10/2026): só a quantidade não diz o que quebrou nem o que foi feito. O Pareto escolhe o eixo
   (sistema · equipamento · modo de falha, abre por equipamento) e clicar numa barra mostra a lista embaixo:
   no Pareto, as falhas daquele grupo; nas OMs por empurrador, cada OM fechada com o que foi feito. */
let RM_SEL = null;   // null = mês atual · 'todos' = 12 meses · ou índice do mês (y*12+m)
let RM_EIXO = 'equip', RM_DET = null;   // eixo do Pareto · barra escolhida { t: 'par' | 'emp', k }




// nome da barra em até 2 linhas de n caracteres (a 2ª termina em … se não couber)
function rmQuebra(s, n) { const L = ['']; String(s).split(/\s+/).forEach(w => { const i = L.length - 1; if (!L[i]) L[i] = w; else if ((L[i] + ' ' + w).length <= n) L[i] += ' ' + w; else L.push(w); });
  if (L.length > 2) L.splice(1, L.length, L[1] + '…'); return L.map(l => l.length > n ? l.slice(0, n - 1) + '…' : l); }
function rmPareto(E) {
  const W = 640, H = 240, L = 30, R = 30, T = 24, B = 38, n = E.length, gw = (W - L - R) / Math.max(1, n), bw = Math.min(76, gw * .6), tot = E.reduce((a, e) => a + e[1], 0);
  const mx = Math.max(1, ...E.map(e => e[1])), Y = v => T + (H - T - B) * (1 - v / mx), Yp = p => T + (H - T - B) * (1 - p), cab = Math.max(6, Math.floor(gw / 6.2));
  let g = '', acc = 0, pts = [];
  const tk = mx <= 5 ? [...Array(mx + 1).keys()] : [0, Math.round(mx / 2), mx];
  tk.forEach(t => g += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${L - 8}" y="${Y(t) + 3}" text-anchor="end" font-size="10" fill="#64748B">${t}</text>`);
  E.forEach(([s, v], i) => { const cx = L + i * gw + gw / 2, x = cx - bw / 2, on = RM_DET && RM_DET.t === 'par' && RM_DET.k === s; acc += v; const p = acc / tot; pts.push([cx, Yp(p), p]);
    g += `<g class="rm-hit" data-rmd="par|${esc(s)}"><title>${esc(s)}: ${v} falha${v === 1 ? '' : 's'} · clique para ver quais</title><rect x="${L + i * gw}" y="${T - 10}" width="${gw}" height="${H - T + 10}" fill="${on ? '#E8F0FE' : 'transparent'}"/>
      <rect x="${x}" y="${Y(v)}" width="${bw}" height="${Y(0) - Y(v)}" rx="3" fill="${on ? '#1967D2' : '#2563EB'}"/><text x="${cx}" y="${Y(v) - 5}" text-anchor="middle" font-size="10.5" fill="#0F172A">${v}</text><text x="${cx}" y="${H - 22}" text-anchor="middle" font-size="10" fill="${on ? '#1967D2' : '#475569'}" font-weight="${on ? 700 : 400}">${rmQuebra(s, cab).map((l, j) => `<tspan x="${cx}" dy="${j ? 12 : 0}">${esc(l)}</tspan>`).join('')}</text></g>`; });
  g += `<polyline points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="#D97706" stroke-width="2" pointer-events="none"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#D97706" pointer-events="none"/><text x="${p[0] + 7}" y="${p[1] - 6}" font-size="10" fill="#D97706" pointer-events="none">${Math.round(p[2] * 100)}%</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>`;
}
// o que foi feito numa OM, em palavras (preventiva: os serviços do Anexo I; corretiva: o serviço executado)




document.addEventListener('click', e => { const b = e.target.closest('[data-rmm]'); if (!b) return; RM_SEL = b.dataset.rmm === 'todos' ? 'todos' : +b.dataset.rmm; render(); });
document.addEventListener('click', e => { const x = e.target.closest('[data-rmeixo]'); if (x) { RM_EIXO = x.dataset.rmeixo; RM_DET = null; render(); return; }
  const g = e.target.closest('[data-rmd]'); if (!g) return; const i = g.dataset.rmd.indexOf('|'); RM_DET = { t: g.dataset.rmd.slice(0, i), k: g.dataset.rmd.slice(i + 1) }; render();
  setTimeout(() => { const d = document.querySelector('.rm-det'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60); });
{ const st = document.createElement('style'); st.textContent = `.card.rm h2{margin:0;font-size:15px}.rm-sub{margin:3px 0 8px;color:#334155;font-size:13px}.rm-sec{align-items:center!important;flex-wrap:wrap}.rm-hit{cursor:pointer}.rm-hit:hover>rect:first-of-type{fill:#F1F5FB}.rm-det{margin-top:12px}.rm-det .t td{vertical-align:top}`; document.head.appendChild(st); }
