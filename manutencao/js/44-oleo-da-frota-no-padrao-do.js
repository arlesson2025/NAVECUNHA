/* ===== Óleo da frota no padrão do painel (como a Compressão do MCP): título + blocos-janela Equipamentos · Saldo para a troca · Trocas lançadas =====
   Dados: o3Dados() (bloco "Óleo da frota v3"); estado aberto/fechado e modo do gráfico em O3 (localStorage 'oleo_*'); blocos com janelasLivres('smf_ol_lay'). */
'use strict';
const OLF = { f: 'todas', g: '' };   // filtros da tabela: situação (chips) e sistema (anéis)
const OL_SIS = [['mcp', 'MCP', 'Motor propulsor'], ['crp', 'Reversores', 'Caixa reversora'], ['mca', 'MCA', 'Motores auxiliares'], ['hid', 'Governo', 'Hidráulico do leme'], ['inc', 'BI', 'Bomba de incêndio']];
// anel por sistema: azul = em dia, âmbar = até 50 h / 7 d, vermelho = vencida, cinza = sem histórico · centro = % em dia (em dia ÷ equipamentos com histórico)
function olAnel(L) { const n = st => L.filter(e => e.st === st).length, ok = n('green'), am = n('amber'), rd = n('red'), sm = n('sem'), tot = L.length, ch = tot - sm, R = 30, C = 2 * Math.PI * R;
  let off = 0; const seg = (q, cor) => { if (!q) return ''; const l = q / tot * C, h = `<circle r="${R}" cx="40" cy="40" fill="none" stroke="${cor}" stroke-width="9" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}" transform="rotate(-90 40 40)"/>`; off += l; return h; };
  const pct = ch ? Math.round(ok / ch * 100) : null;
  return { svg: `<svg viewBox="0 0 80 80" width="84" height="84"><circle r="${R}" cx="40" cy="40" fill="none" stroke="#EEF2F6" stroke-width="9"/>${seg(ok, '#1967D2')}${seg(am, '#E3A008')}${seg(rd, '#D93025')}${seg(sm, '#BDC1C6')}<text x="40" y="45" text-anchor="middle" font-size="16" font-weight="700" fill="#202124">${pct == null ? '—' : pct + '%'}</text></svg>`, ok, am, rd, sm, tot }; }
function vOleoP() {
  const { F, ENG } = o3Dados(), H = id => ENG.some(e => e.vid === id && e.st === 'red');
  if (!O3.open) O3.open = new Set(O3.G('open', F.filter(b => H(b.id)).map(b => b.id)));
  if (!O3.mode) O3.mode = O3.G('mode', 'frota');
  if (!O3.ves || !F.some(b => b.id === O3.ves)) { const s = O3.G('ves', ''); O3.ves = F.some(b => b.id === s) ? s : (F[0] || {}).id; }
  const EG = ENG.filter(e => !OLF.g || e.g === OLF.g), n = st => EG.filter(e => e.st === st).length;
  const chips = [['todas', 'Todos', EG.length], ['red', 'Vencidas', n('red')], ['amber', 'Até 50 h / 7 d', n('amber')], ['green', 'Em dia', n('green')], ['sem', 'Sem histórico', n('sem')]];
  const passa = e => (OLF.f === 'todas' || e.st === OLF.f) && (!OLF.g || e.g === OLF.g);
  const cor = st => st === 'red' ? 'var(--badt)' : st === 'amber' ? 'var(--warnt)' : st === 'green' ? '#1967D2' : 'var(--mut)';   // em dia = azul nesta tela
  const dt = d => d ? brD(isoD(d)) : '—';
  let rows = '';
  F.forEach(b => { const es = ENG.filter(e => e.vid === b.id && passa(e)); if (!es.length) return;
    const bad = es.filter(e => e.st === 'red').length, ab = O3.open.has(b.id) || OLF.f !== 'todas' || !!OLF.g;
    const res = `<span class="pill ${bad ? 'p-bad' : 'p-ok'}">${bad ? bad + ' vencida' + (bad > 1 ? 's' : '') : es.length + ' em dia'}</span>`;
    if (!ab) { const c = [...es].sort((a, z) => a.daysLeft - z.daysLeft)[0];
      rows += `<tr class="click ol-gr" data-olv="${b.id}"><td><span class="ol-car">▸</span><b>${esc(b.n)}</b></td><td colspan="7">${res} <span class="note">próxima: <b>${esc(c.name)}</b> em ${dt(c.proxD)}${c.proxH != null ? ' · ' + nf(c.proxH) + ' h' : ''}</span></td><td class="mono r" style="color:${cor(c.st)}">${c.restTxt}</td></tr>`; return; }
    es.forEach((e, i) => { rows += `<tr class="click" data-frv="${b.id}" title="Clique para lançar a troca (FR 049_B)">${i === 0 ? `<td rowspan="${es.length}" class="ol-v" data-olv="${b.id}"><span class="ol-car">▾</span><b>${esc(b.n)}</b><div>${res}</div></td>` : ''}
      <td>${esc(e.name)}</td><td class="mono r" title="${esc(e.carS)}">${esc(e.car)}</td><td class="mono r">${e.atual != null ? nf(e.atual) : '—'}</td><td class="mono r">${e.ultH != null ? nf(e.ultH) : '—'}</td><td class="mono r">${dt(e.ultD)}</td>
      <td class="mono r">${e.proxH != null ? nf(e.proxH) : '—'}</td><td class="mono r">${dt(e.proxD)}</td><td class="mono r" style="color:${cor(e.st)}"><b>${e.restTxt}</b></td></tr>`; }); });
  const sis = `<div class="card"><div class="row"><h2>Condição por sistema</h2><span class="sp"></span><span class="note">% em dia = em dia ÷ equipamentos com histórico · clique num sistema para filtrar a tabela</span></div><div class="ol-sis">${OL_SIS.map(([g, nome, sub]) => { const L = ENG.filter(e => e.g === g); if (!L.length) return ''; const a = olAnel(L); if (g === 'inc') sub += ' (' + [...new Set(L.map(e => e.b))].join(', ') + ')';
     return `<button class="ol-an${OLF.g === g ? ' on' : ''}" data-olg="${g}" title="${OLF.g === g ? 'Clique para tirar o filtro' : 'Clique para ver só ' + nome + ' na tabela'}">${a.svg}<b>${nome}</b><small>${sub}</small><span><i class="ok">${a.ok} em dia</i>${a.am ? ` · <i class="am">${a.am} até 50 h</i>` : ''}${a.rd ? ` · <i class="rd">${a.rd} vencida${a.rd > 1 ? 's' : ''}</i>` : ''}${a.sm ? ` · ${a.sm} sem hist.` : ''}</span></button>`; }).join('')}</div></div>`;
  const tab = `<div class="card"><div class="row"><h2>Equipamentos${OLF.g ? ` <button class="cm-chip on" data-olg="${OLF.g}" title="Tirar o filtro de sistema">${(OL_SIS.find(x => x[0] === OLF.g) || [, OLF.g])[1]} ✕</button>` : ''}</h2><span class="sp"></span><button class="mbtn sm" data-olall="1">Abrir todas</button><button class="mbtn sm" data-olall="0">Fechar todas</button></div>
   <div class="cm-chips">${chips.map(([k, l, c]) => `<button class="cm-chip${OLF.f === k ? ' on' : ''}" data-olf="${k}">${l} <b>${c}</b></button>`).join('')}</div>
   ${olSisChips(ENG)}<div class="tw"><table class="t ol-t"><thead><tr><th rowspan="2">Empurrador</th><th rowspan="2">Equipamento</th><th rowspan="2" class="r">Cárter</th><th rowspan="2" class="r">Hor. atual</th><th colspan="2" class="ol-gu">Última troca</th><th colspan="2" class="ol-gp">Próxima troca</th><th rowspan="2" class="r">Saldo</th></tr>
    <tr><th class="r ol-gu">Horímetro</th><th class="r ol-gu">Data</th><th class="r ol-gp">Horímetro</th><th class="r ol-gp">Data</th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="note">Nenhum equipamento neste filtro.</td></tr>'}</tbody></table></div>
   <p class="note">Clique no empurrador para abrir ou fechar · clique num equipamento para lançar a troca (FR 049_B) · saldo negativo = atrasado · cárter = volume da matriz de lubrificação</p></div>`;
  // saldo para a troca: esquerda = atraso (h ou d), direita = % do intervalo que ainda resta
  const crit = id => ENG.filter(e => e.vid === id && !e.sem).sort((a, z) => (a.v < 0 || z.v < 0) ? a.v - z.v : a.pct - z.pct)[0];
  const barras = L => { const mx = Math.max(1, ...L.filter(r => r.v < 0).map(r => -r.v));
    return `<div class="ol-bs">${L.map(r => `<div class="ol-br${r.go ? ' click' : ''}"${r.go ? ` data-olgo="${r.go}"` : ''}><span class="ol-bl">${r.l}</span><span class="ol-bL">${r.v < 0 ? `<i style="width:${Math.max(2, -r.v / mx * 100)}%"></i>` : ''}</span><span class="ol-bR">${r.v >= 0 ? `<i style="width:${r.p * 100}%"></i>` : ''}</span><span class="mono r" style="color:${cor(r.st)}">${r.t}</span></div>`).join('')}
      <div class="ol-br ol-ax"><span></span><span class="ol-axl">← atraso</span><span class="ol-axr">intervalo que resta →</span><span></span></div></div>`; };
  let corpo;
  if (O3.mode === 'frota') {
    const L = F.map(b => { const c = crit(b.id); return c ? { l: `<b>${esc(b.n)}</b><small>${esc(c.name)}</small>`, v: c.v, p: c.pct, st: c.st, t: c.restTxt, go: b.id } : null; }).filter(Boolean);
    const ok = ENG.filter(e => !e.sem), pior = ok.filter(e => e.v < 0).sort((a, z) => a.v - z.v)[0], prox = ok.filter(e => e.v >= 0).sort((a, z) => a.daysLeft - z.daysLeft)[0];
    corpo = `<p class="note">o equipamento mais crítico de cada empurrador · clique numa barra para abrir o empurrador</p>${barras(L)}
     <div class="ol-ft"><div><span>Mais atrasado</span><b style="color:${pior ? 'var(--badt)' : 'var(--okt)'}">${pior ? esc(pior.b + ' · ' + pior.name + ' · ' + pior.restTxt.replace('−', '')) : 'nenhum'}</b></div><div><span>Próxima a vencer</span><b>${prox ? esc(prox.b + ' · ' + prox.name + ' · ' + dt(prox.proxD)) : '—'}</b></div></div>`;
  } else { const b = F.find(x => x.id === O3.ves) || F[0];
    /* 1 empurrador: colunas Equipamento · Horímetro atual (e leitura) · Saldo (← atraso | intervalo que resta →) · Próxima troca (pedido do Supervisor, 22/10/2026) */
    const v = b && vessel(b.id), LD = v ? lubDados().filter(d => d.v === v && !d.saida) : [], E1 = b ? ENG.filter(e => e.vid === b.id) : [];
    const hl = e => { const d = LD.find(q => eqNomeC(v, q.e).startsWith(e.name)), h = d && horAtual(v.id, lubHp(v, d.e)), dd = h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : null;
      return !h ? 'sem leitura' : h.est ? 'estimado' : `<span class="${dd > MCA_SEM_LEITURA_D ? 'ol-old' : ''}">lido ${brD(h.date)}${dd > MCA_SEM_LEITURA_D ? ' · ' + dd + ' d' : ''}</span>`; };
    const mx1 = Math.max(1, ...E1.filter(e => !e.sem && e.v < 0).map(e => -e.v));
    const lin = e => { const L = !e.sem && e.v < 0 ? Math.max(3, -e.v / mx1 * 100) : 0, R = !e.sem && e.v >= 0 ? Math.max(2, (e.pct || 0) * 100) : 0;
      return `<div class="o1-r"><span><b>${esc(e.name)}</b>${['crp', 'hid'].includes(e.g) ? '<small>pelas horas do MCP</small>' : ''}</span><span class="r"><b class="o1-h">${e.atual != null ? nf(e.atual) + ' h' : '—'}</b><small>${hl(e)}</small></span>
        <span class="o1-b"><span class="o1-L"><i style="width:${L}%"></i></span><span class="o1-R"><i class="o1-${e.sem ? 'sem' : e.st}" style="width:${R}%"></i></span></span><span class="r o1-s" style="color:${cor(e.sem ? 'sem' : e.st)}"><b>${sbTxt(e)}</b></span>
        <span class="r mono">${e.proxH != null ? nf(e.proxH) + ' h' : '—'}<small>${e.proxD ? brD(isoD(e.proxD)) : ''}</small></span></div>`; };
    corpo = !b ? '<p class="note">Sem equipamentos.</p>' : `<div class="o1"><div class="o1-r o1-hd"><span>Equipamento</span><span class="r">Horímetro atual</span><span class="o1-b"><span class="r">← atraso</span><span>intervalo que resta →</span></span><span class="r">Saldo</span><span class="r">Próxima troca</span></div>${E1.map(lin).join('') || '<p class="note">Sem equipamentos.</p>'}</div>`; }
  const graf = `<div class="card"><div class="row"><h2>Saldo para a troca</h2><span class="sp"></span><span class="ol-seg"><button data-olm="frota" class="${O3.mode === 'frota' ? 'on' : ''}">Frota inteira</button><button data-olm="1" class="${O3.mode !== 'frota' ? 'on' : ''}">1 empurrador</button></span><select id="olSv" class="ol-sv">${F.map(b => `<option value="${b.id}"${b.id === O3.ves ? ' selected' : ''}>${esc(b.n)}</option>`).join('')}</select></div>
   ${corpo}<p class="note">Esquerda = atraso · direita = % do intervalo que ainda resta · alerta com ≤ ${OL_ALERTA_H} h ou ≤ 7 d</p></div>`;
  const t = document.createElement('div'); t.innerHTML = vLubReg(); const card = t.querySelector(':scope > .card');   // filtros e tabela da antiga tela Registros de lubrificação
  const reg = card ? `<div class="card" id="ol-trocas"><div class="row"><h2>Trocas lançadas</h2><span class="sp"></span><span class="note">FR 049_B (com o PDF das 2 folhas, que vai para a pasta do empurrador no Google Drive) e complementos de óleo</span></div>${card.innerHTML}</div>` : '';
  return `<div class="cm-v"><div class="vh"><div><h1>Óleo da frota</h1><p>Troca de óleo por horímetro ou prazo (Anexo I · matriz de lubrificação) · alerta com ≤ ${OL_ALERTA_H} h ou ≤ 7 d · registro pelo FR 049_B</p></div><span class="sp"></span><button class="mbtn" data-olreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button><button class="mbtn" data-act="lubComp">＋ Complemento de óleo</button><button class="mbtn pri" data-ollanca>＋ Lançar troca</button></div>
   <div class="cm-ws">${tab}${graf}${reg}</div></div>`;
}
VX.oleo = vOleoP;
AFTER.oleo = () => { const m = $('#main'), salva = () => { O3.S('open', [...O3.open]); O3.S('mode', O3.mode); O3.S('ves', O3.ves); };
  m.onclick = e => { const t = e.target;
    const v = t.closest('[data-olv]'); if (v) { const id = v.dataset.olv; O3.open.has(id) ? O3.open.delete(id) : O3.open.add(id); O3.ves = id; salva(); render(); return; }
    const f = t.closest('[data-olf]'); if (f) { OLF.f = f.dataset.olf; render(); return; }
    const sg = t.closest('[data-olg]'); if (sg) { OLF.g = OLF.g === sg.dataset.olg ? '' : sg.dataset.olg; render(); return; }
    const a = t.closest('[data-olall]'); if (a) { O3.open = new Set(a.dataset.olall === '1' ? o3Dados().F.map(b => b.id) : []); salva(); render(); return; }
    const md = t.closest('[data-olm]'); if (md) { O3.mode = md.dataset.olm; salva(); render(); return; }
    const g = t.closest('[data-olgo]'); if (g) { O3.ves = g.dataset.olgo; O3.mode = '1'; O3.open.add(O3.ves); salva(); render(); return; }
    if (t.closest('[data-ollanca]')) { if (!precisa(false)) return; lubAbrirForm(O3.mode !== 'frota' ? O3.ves : undefined); return; }
    const fr = t.closest('[data-frv]'); if (fr) { if (!precisa(false)) return; lubAbrirForm(fr.dataset.frv); return; }
    const x = t.closest('[data-lubexc]'); if (x) { lubExcluir(x.dataset.lubexc); return; }
    const lv = t.closest('[data-lubver]'); if (lv) lubVerModal(lv.dataset.lubver); };
  m.onchange = e => { const id = e.target.id;
    if (id === 'olSv') { O3.ves = e.target.value; O3.mode = '1'; salva(); render(); }
    if (id === 'lrB') { LR.barco = e.target.value; render(); } if (id === 'lrM') { LR.mes = e.target.value; render(); } };
  janelasLivres(document.querySelector('#main .cm-ws'), 'smf_ol_lay2', '[data-olreset]');
  if (Date.now() - OL_IR < 3000) { OL_IR = 0; setTimeout(() => { const s = document.getElementById('ol-trocas'); if (s) s.scrollIntoView({ block: 'start' }); }, 300); } };
{ const st = document.createElement('style'); st.textContent = `
#main .ol-t th{white-space:nowrap}#main .ol-t th.ol-gu{background:#F4F6F9;text-align:center}#main .ol-t th.ol-gp{background:#E8F0FE;color:#1967D2;text-align:center}
#main .ol-t td{vertical-align:middle}#main .ol-v{vertical-align:top!important;cursor:pointer;white-space:nowrap}#main .ol-v div{margin:4px 0 0 16px}#main .ol-car{display:inline-block;width:16px;color:var(--mut)}
#main .ol-gr td{background:#FAFBFC}
.ol-seg{display:inline-flex;border:1px solid #DADCE0;border-radius:16px;overflow:hidden}.ol-seg button{border:0;background:#fff;font:inherit;font-size:12.5px;padding:3px 11px;cursor:pointer}.ol-seg button.on{background:#E8F0FE;color:#1967D2;font-weight:600}
#main .ol-sv{width:auto!important;min-width:0;flex:none;font:inherit;font-size:12.5px;padding:2px 6px;border:1px solid #DADCE0;border-radius:6px;margin-left:6px}
#main #ol-trocas .tw{max-height:min(560px,70vh);overflow:auto}#main #ol-trocas.cm-full .tw,#main #ol-trocas:fullscreen .tw{max-height:none}#main #ol-trocas .tw thead th{position:sticky;top:0;background:#fff;z-index:1}
.ol-bs{display:flex;flex-direction:column;gap:2px;margin:6px 0}
.ol-br{display:grid;grid-template-columns:minmax(90px,24%) 1fr 1fr 70px;align-items:center;min-height:26px;gap:0;font-size:13px}.ol-br.click{cursor:pointer;border-radius:4px}.ol-br.click:hover{background:#F8F9FA}
.ol-bl{line-height:1.15;padding-right:6px}.ol-bl small{display:block;color:var(--mut);font-size:11.5px}
.ol-bL{display:flex;justify-content:flex-end;border-right:1.5px solid #9AA0A6;height:100%;align-items:center}.ol-bR{display:flex;height:100%;align-items:center}
.ol-bL i,.ol-bR i{display:block;height:11px}.ol-bL i{background:#D93025;border-radius:3px 0 0 3px}.ol-bR i{background:#1967D2;border-radius:0 3px 3px 0}
.ol-ax{min-height:0;font-size:11px;color:var(--mut)}.ol-ax>span>span{display:flex;justify-content:space-between}
.ol-ft{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ol-ft div{border:1px solid #E3E8EF;border-radius:8px;padding:7px 10px;font-size:12px;color:var(--mut)}.ol-ft b{display:block;font-size:13px;color:#202124;font-weight:600;margin-top:2px}
.ol-sis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:4px}
.ol-an{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid #E3E8EF;border-radius:10px;background:#fff;padding:8px 6px;font:inherit;cursor:pointer;text-align:center}.ol-an:hover{background:#F8F9FA}.ol-an.on{border-color:#1967D2;box-shadow:inset 0 0 0 1px #1967D2;background:#F3F7FD}
.ol-an b{font-size:14px}.ol-an small{color:var(--mut);font-size:11.5px}.ol-an span{font-size:12px;color:var(--mut);margin-top:2px}.ol-an i{font-style:normal}.ol-an i.ok{color:#1967D2}.ol-an i.am{color:var(--warnt)}.ol-an i.rd{color:var(--badt);font-weight:600}
@media(max-width:760px){.ol-sis{grid-template-columns:repeat(2,minmax(0,1fr))}.ol-ft{grid-template-columns:1fr}.ol-br{grid-template-columns:minmax(80px,30%) 1fr 1fr 60px}}`; document.head.appendChild(st); }
