/* ===== Resumo do mês (abaixo das medidas de mitigação): OMs fechadas por empurrador + Pareto de falhas =====
   Pedido do Supervisor (25/10/2026): só a quantidade não diz o que quebrou nem o que foi feito. O Pareto escolhe o eixo
   (sistema · equipamento · modo de falha, abre por equipamento) e clicar numa barra mostra a lista embaixo:
   no Pareto, as falhas daquele grupo; nas OMs por empurrador, cada OM fechada com o que foi feito. */
let RM_SEL = null;   // null = mês atual · 'todos' = 12 meses · ou índice do mês (y*12+m)
let RM_EIXO = 'equip', RM_DET = null;   // eixo do Pareto · barra escolhida { t: 'par' | 'emp', k }
const rmSis = s => String(s || '?').replace(/^\d+\.0 /, '').replace(/^\d+\. /, '').replace('Sistema de ', '').replace('Manobrabilidade e Governo', 'Governo').replace('Geração Elétrica de Bordo', 'Geração').replace('Alimentação de Combustível', 'Combustível').replace('Salvaguarda e Flutuabilidade', 'Salvaguarda').replace('Sinalização e Comunicação', 'Comunicação').replace('Resposta a Emergências', 'Emergências').replace('Fainas de Amarra e Carga', 'Amarra').replace('Auxílio à Navegação', 'Aux. navegação');
const RM_EIXOS = [['sis', 'Sistema'], ['equip', 'Equipamento'], ['modo', 'Modo de falha']];
const rmChave = o => RM_EIXO === 'sis' ? rmSis(o.sistema) : RM_EIXO === 'modo' ? (o.modo || 'Modo não informado') : (String(o.equip || '').trim() || 'Equipamento não informado');
function rmBarras(lab, P, C, ks) {
  const W = 640, H = 230, L = 30, R = 8, T = 34, B = 26, n = lab.length, gw = (W - L - R) / Math.max(1, n), bw = Math.min(26, gw * .55);
  const mx = Math.max(1, ...P.map((p, i) => p + C[i])), Y = v => T + (H - T - B) * (1 - v / mx);
  let g = `<g font-size="10.5" fill="#475569"><rect x="${L}" y="6" width="11" height="11" rx="2" fill="#2563EB"/><text x="${L + 16}" y="15">Preventiva</text><rect x="${L + 96}" y="6" width="11" height="11" rx="2" fill="#D97706"/><text x="${L + 112}" y="15">Corretiva</text></g>`;
  const tk = mx <= 5 ? [...Array(mx + 1).keys()] : [0, Math.round(mx / 2), mx];
  tk.forEach(t => g += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${L - 8}" y="${Y(t) + 3}" text-anchor="end" font-size="10" fill="#64748B">${t}</text>`);
  lab.forEach((l, i) => { const x = L + i * gw + (gw - bw) / 2, p = P[i], c = C[i], on = RM_DET && RM_DET.t === 'emp' && RM_DET.k === ks[i];
    g += `<g class="rm-hit" data-rmd="emp|${esc(ks[i])}"><title>${esc(l)}: ${p} preventiva${p === 1 ? '' : 's'} e ${c} corretiva${c === 1 ? '' : 's'} · clique para ver o que foi feito</title><rect x="${L + i * gw}" y="${T - 12}" width="${gw}" height="${H - T + 12}" fill="${on ? '#E8F0FE' : 'transparent'}"/>`;
    if (p) g += `<rect x="${x}" y="${Y(p)}" width="${bw}" height="${Y(0) - Y(p)}" rx="3" fill="#2563EB"/>`;
    if (c) g += `<rect x="${x}" y="${Y(p + c)}" width="${bw}" height="${Y(p) - Y(p + c)}" rx="3" fill="#D97706"/>`;
    if (p + c) g += `<text x="${x + bw / 2}" y="${Y(p + c) - 5}" text-anchor="middle" font-size="10.5" fill="#0F172A">${p + c}</text>`;
    g += `<text x="${L + i * gw + gw / 2}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="${on ? '#1967D2' : '#475569'}" font-weight="${on ? 700 : 400}">${esc(l)}</text></g>`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>`;
}
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
function rmFeito(o) {
  if (o.tipo === 'C') return String(o.servicos || '').trim() || 'Serviço executado não informado';
  const ids = o.itensProg || o.items || [], nm = ids.map(id => A1M[id] ? A1M[id].chk || A1M[id].item : id).filter(Boolean);
  return nm.length ? nm.slice(0, 4).join(' · ') + (nm.length > 4 ? ` · e mais ${nm.length - 4}` : '') : 'Serviços não informados';
}
function rmDetHTML(det, enc, fal, topo) {
  const lk = (o, t) => `<a href="#om/${o.id}">${t}</a>`, dt = s => s ? brD(String(s).slice(0, 10)) : '—';
  if (det.t === 'emp') { const v = vessel(det.k), L = enc.filter(o => o.vessel === det.k).sort((a, b) => b.fechadoAt - a.fechadoAt);
    return `<div class="card rm rm-det"><h2>O que foi feito · ${esc(v ? v.nome : det.k)} · ${L.length} OM${L.length === 1 ? '' : 's'} fechada${L.length === 1 ? '' : 's'}</h2>
      ${L.length ? `<table class="t"><thead><tr><th>Fechada em</th><th>Tipo</th><th>OM</th><th>O que foi feito</th></tr></thead><tbody>${L.map(o => `<tr><td>${brD(isoD(new Date(o.fechadoAt)))}</td><td>${o.tipo === 'C' ? `<span class="pill p-bad">Corretiva</span> ${esc(o.classe || '')}` : '<span class="pill p-ok">Preventiva</span>'}</td><td class="mono">${lk(o, 'OM ' + esc(o.num || '—'))}</td><td>${o.tipo === 'C' ? `<b>${esc(o.descricao || '')}</b><br>` : ''}<span class="note">${esc(rmFeito(o))}</span></td></tr>`).join('')}</tbody></table>` : '<div class="note">Nenhuma OM fechada no período.</div>'}</div>`; }
  const L = fal.filter(o => det.k === 'Outros' && topo ? !topo.has(rmChave(o)) : rmChave(o) === det.k).sort((a, b) => (b.abertura || '') < (a.abertura || '') ? -1 : 1), eixo = RM_EIXOS.find(e => e[0] === RM_EIXO)[1].toLowerCase();
  return `<div class="card rm rm-det"><h2>O que mais quebrou · ${esc(det.k)} · ${L.length} falha${L.length === 1 ? '' : 's'}</h2><p class="rm-sub">Corretivas abertas no período com este ${eixo} · clique na OM para ver o Anexo II-A</p>
    ${L.length ? `<table class="t"><thead><tr><th>Aberta em</th><th>Empurrador</th><th>OM</th><th>Equipamento</th><th>O que aconteceu</th><th>O que foi feito</th><th>Classe</th></tr></thead><tbody>${L.map(o => `<tr><td>${dt(o.abertura)}</td><td><b>${esc(vName(o.vessel))}</b></td><td class="mono">${lk(o, 'OM ' + esc(o.num || '—'))}</td><td>${esc(o.equip || '—')}<br><span class="note">${esc(rmSis(o.sistema))}</span></td><td>${esc(o.descricao || '')}${o.modo ? `<br><span class="note">${esc(o.modo)}</span>` : ''}</td><td><span class="note">${o.status === 'encerrada' ? esc(rmFeito(o)) : 'Em andamento'}</span></td><td><span class="pill ${o.classe === 'Crítica' ? 'p-bad' : o.classe === 'Alta' ? 'p-warn' : ''}">${esc(o.classe || '—')}</span></td></tr>`).join('')}</tbody></table>` : '<div class="note">Nenhuma falha deste grupo no período.</div>'}</div>`;
}
function resumoMesHTML() {
  const d = hoje(), cur = d.getFullYear() * 12 + d.getMonth(), sel = RM_SEL == null ? cur : RM_SEL, todos = sel === 'todos';
  const ini = todos ? new Date(d.getFullYear(), d.getMonth() - 11, 1) : new Date(Math.floor(sel / 12), sel % 12, 1), fim = todos ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : new Date(Math.floor(sel / 12), sel % 12 + 1, 1);
  const MS = [...Array(6).keys()].map(i => cur - 5 + i);
  const tit = todos ? 'Últimos 12 meses' : MESESL[sel % 12] + '/' + Math.floor(sel / 12);
  const V = S.cfg.frota.filter(v => !foraOp(v));
  const enc = oms().filter(o => o.status === 'encerrada' && o.fechadoAt >= ini.getTime() && o.fechadoAt < fim.getTime());
  const P = V.map(v => enc.filter(o => o.vessel === v.id && o.tipo !== 'C').length), C = V.map(v => enc.filter(o => o.vessel === v.id && o.tipo === 'C').length);
  const fal = oms().filter(o => o.tipo === 'C' && !o.excluido && o.abertura && pDT(o.abertura) >= ini && pDT(o.abertura) < fim), cnt = {};
  fal.forEach(o => { const s = rmChave(o); cnt[s] = (cnt[s] || 0) + 1; });
  let E = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  if (E.length > 10) { const resto = E.slice(9).reduce((a, e) => a + e[1], 0); E = E.slice(0, 9).concat([['Outros', resto]]); }
  const det = RM_DET && (RM_DET.t === 'emp' ? V.some(v => v.id === RM_DET.k) : E.some(e => e[0] === RM_DET.k)) ? RM_DET : E.length ? { t: 'par', k: E[0][0] } : null;
  const cab = `<div class="ab4-sec rm-sec"><h2>Resumo do mês · ${esc(tit.charAt(0).toUpperCase() + tit.slice(1))}</h2><span class="sp"></span><div class="rk-f" style="margin:0">${MS.map(k => `<button data-rmm="${k}" class="${!todos && k === sel ? 'on' : ''}">${MESESL[k % 12].slice(0, 3).toLowerCase()}</button>`).join('')}<button data-rmm="todos" class="${todos ? 'on' : ''}">Todos os meses</button></div></div>`;
  const c1 = `<div class="card rm" data-lk="OMs fechadas por embarcacao"><h2>O que foi feito · OMs fechadas por empurrador</h2><p class="rm-sub">Preventivas (azul) × corretivas (âmbar) · ${enc.length} OM${enc.length === 1 ? '' : 's'} fechada${enc.length === 1 ? '' : 's'} · clique numa barra para ver o que foi feito</p>${rmBarras(V.map(v => v.nome.replace(/^CJA /, '')), P, C, V.map(v => v.id))}</div>`;
  const c2 = `<div class="card rm" data-lk="Pareto por sistema"><div class="row"><h2>O que mais quebrou · Pareto</h2><span class="sp"></span><div class="rk-f" style="margin:0">${RM_EIXOS.map(([k, t]) => `<button data-rmeixo="${k}" class="${RM_EIXO === k ? 'on' : ''}">${t}</button>`).join('')}</div></div><p class="rm-sub">Falhas registradas no período (${fal.length}) por ${RM_EIXOS.find(e => e[0] === RM_EIXO)[1].toLowerCase()} e % acumulado · clique numa barra para ver quais</p>${E.length ? rmPareto(E) : '<div class="note" style="padding:30px 0">Nenhuma falha registrada no período.</div>'}</div>`;
  const topo = E.some(e => e[0] === 'Outros') ? new Set(E.slice(0, 9).map(e => e[0])) : null;   // "Outros" = o que ficou fora das 9 primeiras barras
  const dh = det ? rmDetHTML(det, enc, fal, topo) : '';
  return cab + `<div class="two">${c1}${c2}</div>` + dh;
}
VX.kpi = vKpi;
document.addEventListener('click', e => { const b = e.target.closest('[data-rmm]'); if (!b) return; RM_SEL = b.dataset.rmm === 'todos' ? 'todos' : +b.dataset.rmm; render(); });
document.addEventListener('click', e => { const x = e.target.closest('[data-rmeixo]'); if (x) { RM_EIXO = x.dataset.rmeixo; RM_DET = null; render(); return; }
  const g = e.target.closest('[data-rmd]'); if (!g) return; const i = g.dataset.rmd.indexOf('|'); RM_DET = { t: g.dataset.rmd.slice(0, i), k: g.dataset.rmd.slice(i + 1) }; render();
  setTimeout(() => { const d = document.querySelector('.rm-det'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60); });
{ const st = document.createElement('style'); st.textContent = `.card.rm h2{margin:0;font-size:15px}.rm-sub{margin:3px 0 8px;color:#334155;font-size:13px}.rm-sec{align-items:center!important;flex-wrap:wrap}.rm-hit{cursor:pointer}.rm-hit:hover>rect:first-of-type{fill:#F1F5FB}.rm-det{margin-top:12px}.rm-det .t td{vertical-align:top}`; document.head.appendChild(st); }
