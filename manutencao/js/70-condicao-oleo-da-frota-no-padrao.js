/* ===== Condição: Óleo da frota no padrão e aba Horímetros da frota (pedido do Supervisor, 22/10/2026: "condição por sistema é vago; não consigo ver de forma global por empurrador o horímetro de cada equipamento") =====
   Óleo da frota: Resumo em números (olResumo) no lugar dos anéis "Condição por sistema"; filtro por sistema em chips na tabela (olSisChips, mesmo data-olg); "Empurrador" na tabela; Saldo para a troca com o gráfico original e o eixo legível.
   Horímetros (view horfrota, 1ª aba da Condição): uma linha por empurrador, uma coluna por motor (horímetro total e data da leitura; âmbar com mais de MCA_SEM_LEITURA_D dias); o registro (#hor) sai de Administração e fica nesta seção. */
'use strict';
{ const st = document.createElement('style'); st.textContent = `.ol-old{background:#FEF7E0;color:#B06000;border-radius:4px;padding:0 3px}.ol-br .mono small{display:block;color:#5F6368;font-size:11px;font-weight:400}.o1-r{display:grid;grid-template-columns:minmax(110px,1fr) minmax(120px,.9fr) minmax(220px,2.6fr) minmax(110px,.9fr) minmax(95px,.8fr);gap:10px;align-items:center;padding:3px 0;line-height:1.25;border-bottom:1px solid #F1F3F4}.o1-hd{font-size:11px;color:#5F6368;text-transform:uppercase;letter-spacing:.3px;border-bottom:1px solid #E3E6EA;padding:4px 0}.o1-r small{display:block;font-size:11px;line-height:1.25;color:#5F6368;font-weight:400;white-space:nowrap}.o1-r .r{text-align:right}.o1-h{font-size:14px}.o1-b{display:grid;grid-template-columns:35% 65%;align-items:center}.o1-hd .o1-b span{padding:0 6px}.o1-L,.o1-R{height:10px;display:flex}.o1-L{justify-content:flex-end;border-right:1px solid #9AA0A6}.o1-L i{background:#D93025;border-radius:6px 0 0 6px}.o1-R i{border-radius:0 6px 6px 0}.o1-green{background:#1967D2}.o1-amber{background:#E3A008}.o1-red{background:#D93025}.o1-sem{background:#BDC1C6}.o1-s{white-space:nowrap;font-size:13px}`; document.head.appendChild(st); }
function olSisChips(ENG) { const c = g => ENG.filter(e => e.g === g).length;
  return `<div class="cm-chips" style="margin:-2px 0 10px"><span class="note" style="margin-right:4px">Sistema</span><button class="cm-chip${OLF.g ? '' : ' on'}" data-olg="${OLF.g}">Todos</button>${OL_SIS.filter(([g]) => c(g)).map(([g, nome]) => `<button class="cm-chip${OLF.g === g ? ' on' : ''}" data-olg="${g}">${nome} <b>${c(g)}</b></button>`).join('')}</div>`; }
function vHorFrota() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), LD = lubDados(), H = hoje(), cols = [], lin = [];
  let emDia = 0, velha = 0, est = 0;
  V.forEach(v => { const cel = {}; LD.filter(d => d.v === v && !d.saida && ['mcp', 'mca'].includes(d.e.g)).forEach(d => { const nm = eqNomeC(v, d.e), h = horAtual(v.id, lubHp(v, d.e)); if (!cols.includes(nm)) cols.push(nm);
      const dias = h && h.date && !h.est ? Math.floor((H - pD(h.date)) / 864e5) : null; cel[nm] = { h, dias }; if (!h || h.est) est++; else if (dias > MCA_SEM_LEITURA_D) velha++; else emDia++; });
    lin.push({ v, cel, s: situDe(v) }); });
  const ord = n => (/^MCP/.test(n) ? 0 : /^MCA (BB|BE)/.test(n) ? 1 : 2) + (/BE/.test(n) ? 0.5 : 0);
  cols.sort((a, b) => ord(a) - ord(b) || a.localeCompare(b, 'pt-BR', { numeric: true }));
  const k = (l, val, c) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${val}</b></div>`;
  const td = c => { if (!c) return '<td class="r note" title="não tem este motor">·</td>'; if (!c.h) return '<td class="mono r note">—<div class="note">sem leitura</div></td>'; const h = c.h, cls = h.est ? 'hf-est' : c.dias > MCA_SEM_LEITURA_D ? 'hf-old' : '';
    return `<td class="mono r ${cls}"><b>${nf(h.h)} h</b><div class="note">${h.est ? 'estimado' : brD(h.date) + (c.dias > MCA_SEM_LEITURA_D ? ' · ' + c.dias + ' dias' : '')}</div></td>`; };
  const tab = `<div class="tw"><table class="t hf-t"><thead><tr><th>Empurrador</th><th>Situação</th>${cols.map(c => `<th class="r">${esc(c)}</th>`).join('')}</tr></thead><tbody>${lin.map(l => `<tr><td><a class="f2-nm" href="#barco/${l.v.id}"><b>${esc(l.v.nome)}</b></a></td><td class="note">${l.s ? (l.s.st === 'porto' ? 'No porto' : 'Em viagem') : '—'}</td>${cols.map(c => td(l.cel[c])).join('')}</tr>`).join('')}</tbody></table></div>
   <p class="note">Horímetro total (soma as voltas do MCP a cada 10.000 h e as trocas de horímetro) · <span class="hf-old" style="padding:0 4px">âmbar</span> = leitura com mais de ${MCA_SEM_LEITURA_D} dias · reversor e governo contam pelas horas do MCP · clique no empurrador para abrir a ficha técnica</p>`;
  return `<div class="cm-v"><div class="vh"><div><h1>Horímetros da frota</h1><p>Último horímetro de cada motor, por empurrador · leitura pelo FR 027_L ou lançada à mão</p></div><span class="sp"></span><a class="mbtn pri" href="#hor">⏱ Lançar horímetro</a><button class="mbtn" data-hfreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button></div>
   <div class="cm-ws"><div class="card"><h2>Resumo</h2><div class="f2-ks">${k('Empurradores', V.length)}${k('Leituras em dia', emDia, 'var(--okt)')}${k('Leituras com mais de ' + MCA_SEM_LEITURA_D + ' dias', velha, velha ? 'var(--warnt)' : '')}${k('Estimadas ou sem leitura', est)}</div></div>
    <div class="card"><h2>Horímetros por empurrador</h2>${tab}</div>
    <div class="card"><h2>Pareto · horas viajadas por empurrador</h2>${hfPareto()}</div></div></div>`;
}
/* Pareto das horas rodadas por MCP nos últimos 12 meses (pedido do Supervisor, 22/10/2026): barras em ordem decrescente + % acumulada e linha de 80%; horas = soma dos meses com leitura (horasMes). */
function hfPareto() {   /* horas viajadas por empurrador (pedido do Supervisor, 22/10/2026): o MAIOR horímetro de MCP de cada empurrador (os MCPs rodam juntos na viagem) · linha vermelha = soma acumulada em horas até o total da frota */
  const LD = lubDados(), L = [];
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => { let best = null;
    LD.filter(d => d.v === v && !d.saida && d.e.g === 'mcp').forEach(d => { const hA = horAtual(v.id, lubHp(v, d.e)); if (hA && (!best || hA.h > best.h.h)) best = { h: hA, nome: eqNomeC(v, d.e) }; });
    if (best && best.h.h > 0) L.push({ l: v.nome, h: Math.round(best.h.h), m: best.nome + ' · ' + (best.h.est ? 'estimado' : 'lido em ' + brD(best.h.date)) }); });
  L.sort((a, b) => b.h - a.h); const tot = L.reduce((a, x) => a + x.h, 0);
  if (!L.length) return '<p class="note">Sem leitura de horímetro de MCP.</p>';
  const W = 960, H = 310, ml = 54, mr = 70, mt = 24, mb = 56, bw = (W - ml - mr) / L.length, mx = L[0].h, Y = h => mt + (1 - h / mx) * (H - mt - mb), A = h => mt + (1 - h / tot) * (H - mt - mb);
  let ac = 0, s = '', pts = [];
  [0, .25, .5, .75, 1].forEach(f => { s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(mx * f)}" y2="${Y(mx * f)}" stroke="#EEF2F6"/><text x="${ml - 6}" y="${Y(mx * f) + 4}" font-size="10.5" text-anchor="end" fill="#5F6368">${nf(Math.round(mx * f))}</text><text x="${W - mr + 6}" y="${A(tot * f) + 4}" font-size="10.5" fill="#C5221F">${nf(Math.round(tot * f))}</text>`; });
  s += `<text x="${ml - 6}" y="${mt - 10}" font-size="10.5" text-anchor="end" fill="#1967D2">h por empurrador</text><text x="${W - mr + 6}" y="${mt - 10}" font-size="10.5" fill="#C5221F">h acumuladas</text>`;
  s += `<line x1="${ml}" x2="${W - mr}" y1="${A(tot * .8)}" y2="${A(tot * .8)}" stroke="#E3A008" stroke-dasharray="4 3"/><text x="${ml + 4}" y="${A(tot * .8) - 4}" font-size="10.5" fill="#B06000">80% do total</text>`;
  L.forEach((x, i) => { ac += x.h; const cx = ml + bw * i + bw / 2, h0 = Y(x.h); pts.push([cx, A(ac), ac]);
    s += `<rect x="${ml + bw * i + bw * .15}" y="${h0}" width="${bw * .7}" height="${H - mb - h0}" rx="3" fill="${ac - x.h < tot * .8 ? '#1967D2' : '#A8C7FA'}"><title>${esc(x.l)}: ${nf(x.h)} h (${esc(x.m)}) · ${Math.round(x.h / tot * 100)}% do total</title></rect>
      <text x="${cx}" y="${h0 - 4}" font-size="10.5" text-anchor="middle" fill="#202124">${nf(x.h)}</text><text x="${cx}" y="${H - mb + 16}" font-size="11" text-anchor="middle" fill="#3C4043">${esc(x.l)}</text>`; });
  s += `<polyline fill="none" stroke="#C5221F" stroke-width="2" points="${pts.map(q => q[0] + ',' + q[1]).join(' ')}"/>` + pts.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="#C5221F"><title>Acumulado: ${nf(q[2])} h (${Math.round(q[2] / tot * 100)}%)</title></circle>`).join('');
  const u = pts[pts.length - 1]; s += `<text x="${u[0]}" y="${u[1] - 9}" font-size="11.5" font-weight="700" text-anchor="end" fill="#C5221F">Total da frota: ${nf(tot)} h</text>`;
  const n80 = pts.findIndex(q => q[2] >= tot * .8) + 1;
  return `<p class="note" style="margin:0 0 6px"><b>${nf(tot)} h viajadas pela frota</b> (soma do maior horímetro de MCP de cada empurrador) · ${n80} de ${L.length} empurradores somam 80% das horas · linha vermelha = horas acumuladas</p>
    <div class="cm-gw"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Horas viajadas por empurrador e acumulado da frota" style="width:100%;height:auto">${s}</svg></div>
    <p class="note">Empurrador com mais de um MCP conta pelo maior horímetro, porque os motores rodam juntos na viagem. Horímetro trocado começa do zero do novo (passe o mouse na barra para ver o motor e a data da leitura).</p>`;
}
VX.horfrota = vHorFrota;
AFTER.horfrota = function () { const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_horfrota_lay', '[data-hfreset]'); };
{ SECOES.forEach(s => { if (s.id !== 'cond2') s.views = s.views.filter(x => x[0] !== 'hor'); });
  const c = SECOES.find(s => s.id === 'cond2'); if (c) { if (!c.views.some(x => x[0] === 'horfrota')) c.views.unshift(['horfrota', 'Horímetros']); c.extra = (c.extra || []).filter(x => x !== 'hor').concat('hor'); } }
{ const st = document.createElement('style'); st.textContent = `.ol-ax .ol-axl{display:block;text-align:right;padding-right:6px}.ol-ax .ol-axr{display:block;padding-left:6px}
.hf-t td,.hf-t th{white-space:nowrap}.hf-t td b{font-size:14px}.hf-old{background:#FEF7E0}.hf-old b{color:#B06000}.hf-est b{color:#5F6368;font-weight:500}`; document.head.appendChild(st); }
