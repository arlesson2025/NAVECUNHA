/* ===== Análise de óleo do MCP: aba própria em Condição, no padrão da Compressão =====
   Matriz do laudo (semáforo por parâmetro) · Tendência por motor · Programa de amostragem (amoCard) · Parâmetros e limites (LAUDO_P).
   Dados: recs('laudo') via amoDados()/laudos()/laudoSt(); registrar laudo = laudoModal (data-laudo2), ver laudos = laudoLista (data-laudov2). */
'use strict';
const AO = { f: 'todas', sel: '', p: '' };
const AO_GR = [['Desgaste', ['fe', 'cr', 'al', 'cu', 'pb']], ['Contaminação', ['si', 'na', 'agua', 'comb', 'fuligem']], ['Óleo', ['tbn', 'visc']]];
const AO_CUR = { fe: 'Fe', cr: 'Cr', al: 'Al', cu: 'Cu', pb: 'Pb', si: 'Si', na: 'Na', agua: 'Água', comb: 'Comb.', fuligem: 'Fulig.', tbn: 'TBN', visc: 'Visc.' };
const aoP = k => LAUDO_P.find(p => p[0] === k);
const aoNome = x => esc(x.v.nome) + (x.v.mcp === 'mono' ? '' : ' ' + x.pos);
const aoKey = x => x.v.id + '|' + x.pos;
// situação de um valor: 'venc' (crítico) · 'viag' (atenção) · 'ok'
function aoSt(k, v) { const [, , , a, c, , tipo] = aoP(k); if (v == null) return '';
  if (tipo === 'min') return v < c ? 'venc' : v < a ? 'viag' : 'ok';
  if (tipo === 'faixa') return v < c[0] || v > c[1] ? 'venc' : v < a[0] || v > a[1] ? 'viag' : 'ok';
  return v >= c ? 'venc' : v >= a ? 'viag' : 'ok'; }
const aoFmt = v => v == null ? '—' : nf(v, v < 10 && v % 1 ? (v < 1 ? 2 : 1) : 0);
const AO_PILL = { venc: ['p-bad', 'Crítico'], viag: ['p-warn', 'Atenção'], ok: ['p-ok', 'Normal'], sem: ['p-mut', 'Sem laudo'] };
function aoMatriz(M) {
  const cnt = s => s === 'todas' ? M.length : M.filter(x => x.ls.st === s).length;
  const ordem = { venc: 0, viag: 1, ok: 2, sem: 3 }, L = M.filter(x => AO.f === 'todas' || x.ls.st === AO.f).sort((a, b) => ordem[a.ls.st] - ordem[b.ls.st] || (b.meses ?? -1) - (a.meses ?? -1));
  const ks = AO_GR.flatMap(g => g[1]);
  const cel = (x, k) => { const v = x.ul ? numBR((x.ul.vals || {})[k]) : null, s = aoSt(k, v); return `<td class="mono r ao-c ${s}" title="${esc(aoP(k)[1])}${v != null ? ': ' + aoFmt(v) + ' ' + aoP(k)[2] : ''}">${x.ul ? aoFmt(v) : ''}</td>`; };
  const linhas = L.map(x => `<tr class="click${aoKey(x) === AO.sel ? ' cm-on' : ''}" data-aosel="${aoKey(x)}"><td><b>${aoNome(x)}</b></td>
    <td class="mono r">${x.ul ? brD(x.ul.date) : '—'}${x.ul ? `<div class="note" style="color:${x.meses > 12 ? 'var(--warnt)' : ''}">há ${x.meses} ${x.meses === 1 ? 'mês' : 'meses'}</div>` : ''}</td><td class="mono r">${x.ul && x.ul.hOleo ? nf(+x.ul.hOleo) + ' h' : '—'}</td>
    ${ks.map(k => cel(x, k)).join('')}<td><span class="pill ${AO_PILL[x.ls.st][0]}">${AO_PILL[x.ls.st][1]}</span></td></tr>`).join('');
  return `<div class="card"><div class="row"><h2>Matriz do laudo</h2><span class="sp"></span><span class="note">último laudo de cada MCP · clique na linha para ver a tendência</span></div>
   <div class="cm-chips">${[['todas', 'Todos'], ['venc', 'Crítico'], ['viag', 'Atenção'], ['ok', 'Normal'], ['sem', 'Sem laudo']].map(([k, l]) => `<button class="cm-chip${AO.f === k ? ' on' : ''}" data-aof="${k}">${l} <b>${cnt(k)}</b></button>`).join('')}</div>
   <div class="tw"><table class="t ao-t"><thead><tr><th rowspan="2">Motor</th><th rowspan="2" class="r">Amostra</th><th rowspan="2" class="r">Horas do óleo</th>${AO_GR.map(([g, k]) => `<th colspan="${k.length}" class="ao-g">${g}</th>`).join('')}<th rowspan="2">Situação</th></tr>
    <tr>${ks.map(k => `<th class="r" title="${esc(aoP(k)[1] + ' · ' + aoP(k)[2])}">${AO_CUR[k]}</th>`).join('')}</tr></thead><tbody>${linhas || '<tr><td colspan="16" class="note">Nenhum motor neste filtro.</td></tr>'}</tbody></table></div>
   <p class="note">Metais e silício/sódio em ppm · água, combustível e fuligem em % · TBN em mg KOH/g · viscosidade a 100 °C em cSt · célula âmbar = atenção, vermelha = crítico (limites no bloco "Parâmetros e limites") · data em âmbar = amostra com mais de 12 meses: o óleo de hoje já não é o do laudo.</p></div>`;
}
// tendência: "Frota (geral)" = todos os laudos do parâmetro, uma linha por motor (a do motor escolhido na matriz fica em destaque) · ou um motor só
function aoTend(M) {
  if (!M.length) return '<div class="card"><div class="row"><h2>Tendência por motor</h2></div><p class="note">Sem MCPs.</p></div>';
  const frota = !AO.sel || AO.sel === 'frota', x = frota ? null : M.find(y => aoKey(y) === AO.sel) || null; if (!frota && !x) AO.sel = 'frota';
  const pior = { venc: 0, viag: 1, ok: 2, sem: 3 }, ref = x || M.slice().sort((p, q) => pior[p.ls.st] - pior[q.ls.st])[0];
  const k = AO.p || (ref.ls.alertas[0] || {}).k || 'fe', [, nome, un, a, c, sig, tipo] = aoP(k);
  const S_ = (frota ? M : [x]).map(y => ({ y, pts: laudos(y.v.id, y.pos).map(r => ({ d: pD(r.date), v: numBR((r.vals || {})[k]), r })).filter(p => p.v != null) })).filter(s => s.pts.length);
  const todos = S_.flatMap(s => s.pts), W = 720, H = 240, l = 48, rr = 16, t = 14, b = 30, lims = tipo === 'faixa' ? [...a, ...c] : [a, c];
  const vs = todos.map(p => p.v).concat(lims), y1 = Math.max(...vs) * 1.12, ylo = tipo === 'faixa' ? Math.min(...vs) * 0.92 : 0;
  const d1 = +hoje(), d0 = Math.min(d1 - 365 * 864e5, ...todos.map(p => +p.d)) - 30 * 864e5;
  const X = d => l + (d - d0) / Math.max(1, d1 - d0) * (W - l - rr), Y = v => t + (1 - (v - ylo) / Math.max(1e-9, y1 - ylo)) * (H - t - b);
  const lin = (v, cor, txt) => `<line x1="${l}" x2="${W - rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${cor}" stroke-dasharray="5 4"/><text x="${l + 4}" y="${Y(v) - 4}" font-size="11" fill="${cor}">${txt} ${aoFmt(v)}</text>`;
  const linhasLim = tipo === 'faixa' ? lin(a[0], '#B06000', 'atenção') + lin(a[1], '#B06000', 'atenção') + lin(c[0], '#C5221F', 'crítico') + lin(c[1], '#C5221F', 'crítico') : lin(a, '#B06000', 'atenção') + lin(c, '#C5221F', 'crítico');
  const anos = []; for (let y = new Date(d0).getFullYear() + 1; y <= new Date(d1).getFullYear(); y++) anos.push(+new Date(y, 0, 1));
  const ponto = (s, p) => { const st = aoSt(k, p.v); return `<circle cx="${X(+p.d)}" cy="${Y(p.v)}" r="${frota ? 4.5 : 5}" fill="${st === 'venc' ? '#C5221F' : st === 'viag' ? '#E3A008' : '#1967D2'}" stroke="#fff" stroke-width="1.5"${frota ? ` data-aosel="${aoKey(s.y)}" style="cursor:pointer"` : ''}><title>${aoNome(s.y).replace(/<[^>]+>/g, '')} · ${brD(p.r.date)} · ${aoFmt(p.v)} ${un}${p.r.hOleo ? ' · óleo com ' + nf(+p.r.hOleo) + ' h' : ''}${p.r.num ? ' · laudo ' + p.r.num : ''}${frota ? ' · clique para ver só este motor' : ''}</title></circle>`; };
  const linha = s => s.pts.length > 1 ? `<polyline fill="none" stroke="${frota ? '#9AA0A6' : '#1967D2'}" stroke-width="${frota ? 1.2 : 2}" points="${s.pts.map(p => X(+p.d) + ',' + Y(p.v)).join(' ')}"/>` : '';
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-height:300px">${[0, .25, .5, .75, 1].map(f => { const v = ylo + f * (y1 - ylo); return `<line x1="${l}" x2="${W - rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#EEF2F6"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#5F6368">${aoFmt(v)}</text>`; }).join('')}
    ${anos.map(d => `<line x1="${X(d)}" x2="${X(d)}" y1="${t}" y2="${H - b}" stroke="#EEF2F6"/><text x="${X(d)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#5F6368">${new Date(d).getFullYear()}</text>`).join('')}
    <line x1="${X(d1)}" x2="${X(d1)}" y1="${t}" y2="${H - b}" stroke="#9AA0A6" stroke-dasharray="2 3"/><text x="${X(d1)}" y="${H - 10}" text-anchor="end" font-size="11" fill="#5F6368">hoje</text>
    ${linhasLim}${S_.map(linha).join('')}${S_.map(s => s.pts.map(p => ponto(s, p)).join('')).join('')}</svg>`;
  // chips coloridos pelo pior valor do último laudo (do motor ou da frota)
  const piorP = p => { const ss = (frota ? M : [x]).filter(y => y.ul).map(y => aoSt(p, numBR((y.ul.vals || {})[p]))); return ss.includes('venc') ? 'venc' : ss.includes('viag') ? 'viag' : ''; };
  const n = todos.length, nm = S_.length;
  const nota = frota ? `${n} laudo${n === 1 ? '' : 's'} de ${nm} motor${nm === 1 ? '' : 'es'} · cada ponto é um laudo (azul normal, âmbar atenção, vermelho crítico) · clique num ponto para ver só aquele motor`
    : `${n} laudo${n === 1 ? '' : 's'} deste motor${n < 2 ? ' · a linha de tendência aparece a partir do 2º laudo' : ''}`;
  return `<div class="card"><div class="row"><h2>Tendência ${frota ? 'da frota' : 'por motor'}</h2><span class="sp"></span><select id="aoSel" class="ol-sv"><option value="frota"${frota ? ' selected' : ''}>Frota (geral)</option>${M.map(y => `<option value="${aoKey(y)}"${!frota && aoKey(y) === AO.sel ? ' selected' : ''}>${aoNome(y)}</option>`).join('')}</select>${frota ? '' : `<button class="mbtn sm" data-laudov2="${AO.sel}">Ver os laudos</button>`}</div>
   <div class="cm-chips">${LAUDO_P.map(p => { const s = piorP(p[0]); return `<button class="cm-chip${p[0] === k ? ' on' : ''}" data-aop="${p[0]}" title="${esc(p[1])}"${s === 'venc' ? ' style="border-color:#C5221F;color:#C5221F"' : s === 'viag' ? ' style="border-color:#E3A008;color:#946A1E"' : ''}>${AO_CUR[p[0]]}</button>`; }).join('')}</div>
   <p class="note"><b>${esc(nome)}</b> (${esc(un)}) · ${esc(sig)} · ${nota}</p>${n ? svg : '<p class="note" style="padding:30px 0;text-align:center">Nenhum laudo com este parâmetro.</p>'}</div>`;
}
function aoParam() {
  const lim = (v, tipo) => tipo === 'faixa' ? aoFmt(v[0]) + ' – ' + aoFmt(v[1]) : (tipo === 'min' ? 'abaixo de ' : 'a partir de ') + aoFmt(v);
  return `<div class="card"><div class="row"><h2>Parâmetros e limites</h2><span class="sp"></span><span class="note">referência geral para motor diesel com óleo 15W-40</span></div>
   <div class="tw"><table class="t"><thead><tr><th>Grupo</th><th>Parâmetro</th><th>Unidade</th><th>Atenção</th><th>Crítico</th><th>O que indica</th></tr></thead><tbody>
   ${AO_GR.map(([g, ks]) => ks.map((k, i) => { const [, nome, un, a, c, sig, tipo] = aoP(k); return `<tr>${i === 0 ? `<td rowspan="${ks.length}"><b>${g}</b></td>` : ''}<td>${esc(nome)}</td><td>${esc(un)}</td><td class="mono" style="color:var(--warnt)">${tipo === 'faixa' ? 'fora de ' + lim(a, tipo) : lim(a, tipo)}</td><td class="mono" style="color:var(--badt)">${tipo === 'faixa' ? 'fora de ' + lim(c, tipo) : lim(c, tipo)}</td><td class="note">${esc(sig)}</td></tr>`; }).join('')).join('')}</tbody></table></div>
   <p class="note">Limites de referência, não do fabricante do motor: confirme com o laboratório que emite o laudo e com a ficha do óleo — TBN do óleo novo considerado: ${nf(TBN_NOVO, 1)} mg KOH/g (atenção 60%, crítico 50%). O laudo com algum valor crítico de desgaste (Fe, Cr, Al, Cu, Pb) leva o MCP para "Programar inspeção / retífica" no diagnóstico de condição. Programa de amostragem: Anexo I, item 1.1.29.</p></div>`;
}
function vAnOleo() {
  const { M } = amoDados();
  const amo = amoCard();
  return `<div class="cm-v"><div class="vh"><div><h1>Análise de óleo · MCP</h1><p>Laudo de laboratório por motor: metais de desgaste, contaminação e condição do óleo · amostra de cada MCP a cada 1.000 h ou 12 meses, junto com os bicos e a compressão (Anexo I, item 1.1.29)</p></div><span class="sp"></span><button class="mbtn" data-aoreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button><button class="mbtn pri" data-laudo2="">＋ Registrar laudo</button></div>
   <div class="cm-ws">${aoMatriz(M)}${aoTend(M)}${amo}${aoParam()}</div></div>`;
}
VX.anoleo = vAnOleo;
AFTER.anoleo = () => { const m = $('#main');
  m.onclick = e => { const t = e.target;
    const f = t.closest('[data-aof]'); if (f) { AO.f = f.dataset.aof; render(); return; }
    const p = t.closest('[data-aop]'); if (p) { AO.p = p.dataset.aop; render(); return; }
    const s = t.closest('[data-aosel]'); if (s) { AO.sel = s.dataset.aosel; AO.p = ''; render(); const c = $('#aoSel'); if (c) c.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  m.onchange = e => { if (e.target.id === 'aoSel') { AO.sel = e.target.value; AO.p = ''; render(); } };
  janelasLivres(document.querySelector('#main .cm-ws'), 'smf_ao_lay', '[data-aoreset]'); };
// registrar/ver laudo (data-laudo2 / data-laudov2) também nesta aba
document.addEventListener('click', e => { if (VIEW !== 'anoleo') return; const l = e.target.closest('[data-laudo2]'); if (l) { e.stopPropagation(); laudoModal(); return; } const v = e.target.closest('[data-laudov2]'); if (v) { e.stopPropagation(); laudoLista(...v.dataset.laudov2.split('|')); } }, true);
{ const st = document.createElement('style'); st.textContent = `
#main .ao-t th,#main .ao-t td{white-space:nowrap}#main .ao-t th.ao-g{text-align:center;background:#F4F6F9;border-left:2px solid #fff}
#main .ao-t td.ao-c.viag{background:#FEF3D6;color:#7A5200;font-weight:600}#main .ao-t td.ao-c.venc{background:#FCE8E6;color:#B3261E;font-weight:700}`; document.head.appendChild(st); }
