'use strict';
/* ===== Balsas no padrão dos empurradores (SMF 3.138, Supervisor 01/11/2026: “veja melhorias e o que tem que ser acrescentado que tenha no módulo empurradores”) =====
   1) Situação das balsas em Matriz (balsa × equipamento, como a Situação da frota) ou Lista (a tabela de antes), com “Por que não está liberada”
   2) Programar preventiva (view balprog, como a 2.2): o que vence por balsa, marcar serviços → Copiar texto da OM · Formulário de campo · Registrar execução
      (o mesmo balExeModal, já com os marcados) e o Anexo II-B de cada OM registrada (sem número de item, como nos empurradores) */
const BAL_GR = ['Bomba centrífuga', 'Motor', 'Válvulas de gaveta', 'PSV e válvula de alívio', 'Luzes de navegação', 'Alarme de nível alto', 'Baterias', 'Casco', 'Manômetro da rede de carga', 'Escotilhas'];
const BAL_GR_C = ['Bomba', 'Motor', 'Válvulas', 'PSV e alívio', 'Luzes', 'Alarme nível', 'Baterias', 'Casco', 'Manômetro', 'Escotilhas'];
const balGr = t => t.mot ? 'Motor' : t.eq;
// vencido · vence no mês (data no mês, ou horas que acabam até o fim do mês no ritmo do motor-bomba) · em dia · sem histórico
function balG(b, s) {
  if (s.st === 'venc') return 'venc'; if (s.st === 'sem') return 'sem';
  const H = hoje(), fim = new Date(H.getFullYear(), H.getMonth() + 1, 0, 12), dias = Math.round((fim - pD(isoD(H))) / 864e5), tx = balTaxa(b.id);
  if (s.alvoD && s.alvoD <= fim) return 'mes'; if (s.rest != null && tx && s.rest / tx <= dias) return 'mes'; return 'ok';
}
function balLinhas(b) { const e = balEstado(b); return { e, I: e.P.map(({ t, s }) => ({ t, s, g: balG(b, s) })) }; }
const BALM = { modo: (() => { try { return localStorage.getItem('smf_bal_modo') || 'matriz'; } catch (e) { return 'matriz'; } })() };
function balMatriz(E) {
  const cel = (L, at) => sfCel(L.map(x => ({ g: x.g })), at), T = BAL_GR.map(() => ({ v: 0, m: 0 }));
  const lin = E.map(x => { const b = x.e.b, hr = balHor(b.id), ref = x.e.st === 'ref';
    const cs = BAL_GR.map((g, i) => { const L = x.I.filter(y => balGr(y.t) === g); T[i].v += L.filter(y => y.g === 'venc').length; T[i].m += L.filter(y => y.g === 'mes').length;
      return `<td class="sf-cc${i ? '' : ' sf-sep'}">${ref ? '<span class="sf-na">—</span>' : `<a href="#balprog/${b.id}" class="sf-lk">${cel(L, '')}</a>`}</td>`; }).join('');
    return `<tr><td class="sf-n"><a href="#balft/${b.id}" class="sf-lk"><b>${esc(b.nome)}</b></a><div>${balPil(BAL_ST, x.e.st)} <span class="sf-mut">${esc(BAL_MOTOR[b.mot] || '')}</span></div></td>
      <td class="nowrap note">${hr ? nf(hr.h) + ' h<div>' + brD(hr.date) + '</div>' : '—'}</td>
      <td class="sf-cc sf-sep">${x.e.A.length ? `<a href="#balft/${b.id}" class="sf-lk"><span class="sf-c ${x.e.A.some(a => a.c === 'Crítica') ? 'sf-r' : 'sf-a'}">${x.e.A.length}</span></a>` : ref ? '<span class="sf-na">—</span>' : '<span class="sf-g"></span>'}</td>${cs}</tr>`; }).join('');
  const tot = `<tfoot><tr><td class="sf-n"><b>Total das balsas</b><div class="sf-mut">vencidos · vencem no mês</div></td><td></td><td class="sf-cc sf-sep">${E.reduce((a, x) => a + x.e.A.length, 0) || ''}</td>${T.map((t, i) => `<td class="sf-cc${i ? '' : ' sf-sep'}"><div style="color:#C5221F">${t.v || ''}</div><div style="color:#B06000">${t.m || ''}</div></td>`).join('')}</tr></tfoot>`;
  return `<div class="tw"><table class="sf-mx"><thead><tr class="sf-gr"><th colspan="2"></th><th class="sf-sep">Liberação</th><th colspan="${BAL_GR.length}" class="sf-sep">Manutenção preventiva (NP 024 item 8)</th></tr>
    <tr><th class="l">Balsa</th><th class="l">Motor-bomba</th><th class="sf-sep">Falhas abertas</th>${BAL_GR_C.map((g, i) => `<th class="${i ? '' : 'sf-sep'}" title="${esc(BAL_GR[i])}">${g}</th>`).join('')}</tr></thead><tbody>${lin}</tbody>${tot}</table></div>
    <p class="note">Número vermelho = serviços vencidos · âmbar = vencem no mês · ✓ = em dia · quadrado vazio = sem histórico. Clique numa célula para programar a preventiva da balsa; no nome, a ficha técnica.</p>`;
}
function balPorque(E) {
  const R = E.filter(x => x.e.st === 'bloq' || x.e.st === 'rest');
  if (!R.length) return '<p class="note">Todas as balsas em operação estão liberadas.</p>';
  return `<ul class="bal-ag">${R.map(x => { const b = x.e.b, M = [];
    x.e.A.forEach(a => M.push(`<a href="#balft/${b.id}">Falha ${esc(a.c)}: ${esc(a.desc)}${a.om ? ' · OM ' + esc(a.om) : ' · sem OM no Sankhya'}</a>`));
    if (x.e.crit.length) M.push(`<a href="#balprog/${b.id}">${x.e.crit.length} serviço${x.e.crit.length === 1 ? '' : 's'} crítico${x.e.crit.length === 1 ? '' : 's'} vencido${x.e.crit.length === 1 ? '' : 's'}: ${esc([...new Set(x.e.crit.map(y => balGr(y.t)))].join(', '))}</a>`);
    const out = x.e.venc.filter(y => y.t.prio !== 'Crítica'); if (out.length) M.push(`<a href="#balprog/${b.id}">${out.length} outro${out.length === 1 ? '' : 's'} vencido${out.length === 1 ? '' : 's'}: ${esc([...new Set(out.map(y => balGr(y.t)))].join(', '))}</a>`);
    return `<li>${balPil(BAL_ST, x.e.st)} <b>${esc(b.nome)}</b> · ${M.join(' · ')}</li>`; }).join('')}</ul>`;
}
function vBal2() {
  const E = BALSAS.map(balLinhas), md = BALM.modo === 'lista' ? 'lista' : 'matriz';
  if (md === 'lista') return vBal().replace('<button class="mbtn" data-balfalha="">', balModoBt(md) + '<button class="mbtn" data-bal27a="">📋 FR 027_A</button><button class="mbtn" data-balfalha="">');
  const cnt = k => E.filter(x => x.e.st === k).length, ord = { bloq: 0, rest: 1, lib: 2, sem: 3, ref: 4 };
  const F = E.filter(x => BALF.f === 'todas' || x.e.st === BALF.f).sort((a, b) => ord[a.e.st] - ord[b.e.st] || b.e.venc.length - a.e.venc.length || (a.e.b.nome < b.e.b.nome ? -1 : 1));
  return balCab('Situação das balsas', `${BALSAS.length} balsas petroleiras · para operar pela NP 024 6.1: bloqueada = serviço Crítico vencido ou falha Crítica aberta; com restrição = outro vencido ou falha Alta`, balModoBt(md) + '<button class="mbtn" data-bal27a="">📋 FR 027_A</button><button class="mbtn" data-balfalha="">⚠ Registrar falha</button>')
   + `<div class="cm-chips">${[['todas', 'Todas', E.length], ['bloq', 'Bloqueadas', cnt('bloq')], ['rest', 'Com restrição', cnt('rest')], ['lib', 'Liberadas', cnt('lib')], ['sem', 'Sem histórico', cnt('sem')], ['ref', 'Em reforma', cnt('ref')]].map(([k, t, n]) => `<button class="cm-chip${BALF.f === k ? ' on' : ''}" data-balf="${k}">${t} <b>${n}</b></button>`).join('')}</div>
   <div class="card"><h2>Matriz das balsas · equipamento por equipamento</h2>${balMatriz(F)}</div>
   <div class="card"><h2>Por que não está liberada</h2>${balPorque(E)}</div>`;
}
const balModoBt = md => `<div class="seg"><button data-balmodo="matriz" class="${md === 'matriz' ? 'on' : ''}">▦ Matriz</button><button data-balmodo="lista" class="${md === 'lista' ? 'on' : ''}">☰ Lista</button></div>`;
// ---------- programar a preventiva (como a 2.2) ----------
const BALP = { sel: {} };   // serviços marcados por balsa
function balProgSel(b, I) { if (!BALP.sel[b.id]) BALP.sel[b.id] = new Set(I.filter(x => x.g === 'venc' || x.g === 'mes').map(x => x.t.id)); return BALP.sel[b.id]; }
function balOMs(vid) {   // OMs registradas da balsa (serviços do plano agrupados pelo nº da OM)
  const M = {}; recs('base').forEach(r => { if (r.vessel !== vid || r.excluido || !r.om || !BA1M[r.item]) return; const k = String(r.om); (M[k] = M[k] || { om: k, date: r.date, L: [] }).L.push(r); if (r.date > M[k].date) M[k].date = r.date; });
  return Object.values(M).sort((a, b) => a.date < b.date ? 1 : -1);
}
function vBalProg() {
  const b = balsaDe(ARG);
  if (!b) { const E = BALSAS.map(balLinhas).filter(x => x.e.st !== 'ref'), n = (x, g) => x.I.filter(y => y.g === g).length;
    const L = E.map(x => ({ x, v: n(x, 'venc'), m: n(x, 'mes'), s: n(x, 'sem') })).sort((a, b) => b.v - a.v || b.m - a.m || (a.x.e.b.nome < b.x.e.b.nome ? -1 : 1));
    return balCab('Programar preventiva', 'O que vence em cada balsa · escolha a balsa, marque os serviços, copie o texto da OM do Sankhya, imprima o formulário de campo e registre a execução', '')
     + `<div class="cm-chips"><span class="cm-chip">Balsas com vencidos <b>${L.filter(y => y.v).length}</b></span><span class="cm-chip">Serviços vencidos <b>${L.reduce((a, y) => a + y.v, 0)}</b></span><span class="cm-chip">Vencem no mês <b>${L.reduce((a, y) => a + y.m, 0)}</b></span></div>
     <div class="card"><h2>Balsas</h2><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th>Para operar</th><th class="r">Vencidos</th><th class="r">Vencem no mês</th><th class="r">Sem histórico</th><th></th></tr></thead><tbody>
     ${L.map(y => `<tr class="click" data-balpg="${y.x.e.b.id}"><td><b>${esc(y.x.e.b.nome)}</b><div class="note">${esc(BAL_MOTOR[y.x.e.b.mot] || '')}</div></td><td>${balPil(BAL_ST, y.x.e.st)}</td><td class="r">${y.v ? `<b class="rl-ruim">${y.v}</b>` : '0'}</td><td class="r">${y.m ? `<b style="color:#B06000">${y.m}</b>` : '0'}</td><td class="r note">${y.s || ''}</td><td><button class="mbtn sm pri" data-balpg="${y.x.e.b.id}">Programar</button></td></tr>`).join('')}</tbody></table></div>
     <p class="note">Vencem no mês = vencimento por data até o fim do mês, ou horas que acabam até lá no ritmo medido do motor-bomba. Balsa em reforma fica fora.</p></div>`; }
  if (BALP.ap && BALP.ap.id === b.id && S.recs.__v !== BALP.ap.v) { delete BALP.sel[b.id]; BALP.ap = null; }   // registrou: a marcação recomeça pelo que ainda vence
  const { e, I } = balLinhas(b), sel = balProgSel(b, I), hr = balHor(b.id), G = BAL_GR.filter(g => I.some(x => balGr(x.t) === g));
  const pil = g => g === 'venc' ? '<span class="pill p-bad">Vencido</span>' : g === 'mes' ? '<span class="pill p-warn">Vence no mês</span>' : g === 'ok' ? '<span class="pill p-ok">Em dia</span>' : '<span class="pill p-mut">Sem histórico</span>';
  const OM = balOMs(b.id).slice(0, 8);
  return balCab(`Programar preventiva · ${b.nome}`, `${esc(balMotTx(b))} · motor-bomba ${hr ? nf(hr.h) + ' h em ' + brD(hr.date) : 'sem leitura'} · vencidos e os que vencem no mês já vêm marcados`, `<a class="mbtn" href="#balprog">← Balsas</a><a class="mbtn" href="#balft/${b.id}">Ficha técnica</a>`)
   + `<div class="card"><h2>Serviços · ${sel.size} marcado${sel.size === 1 ? '' : 's'}</h2>
     <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="mbtn" data-balpcop>📋 Copiar texto da OM</button><button class="mbtn" data-balpcampo>🖨 Formulário de campo (II-B)</button><button class="mbtn pri" data-balpreg>Registrar execução</button><span class="sp"></span><button class="mbtn sm" data-balptodos="venc">Marcar vencidos e do mês</button><button class="mbtn sm" data-balptodos="">Desmarcar</button></div>
     <div class="tw"><table class="t bal-t"><thead><tr><th></th><th>Serviço</th><th>A cada</th><th>Último</th><th>Situação</th><th>Executa</th></tr></thead><tbody>
     ${G.map(g => `<tr class="vg-m"><td colspan="6">${esc(g === 'Motor' ? BAL_MOTOR[b.mot] : g)}</td></tr>` + I.filter(x => balGr(x.t) === g).map(x => `<tr><td><input type="checkbox" data-balpk="${x.t.id}"${sel.has(x.t.id) ? ' checked' : ''}></td><td>${esc(x.t.serv)}${x.t.prio === 'Crítica' ? ' <span class="note rl-ruim">crítico</span>' : ''}</td><td class="nowrap">${balIvTx(x.t)}</td><td class="nowrap">${x.s.L ? brD(x.s.L.date) + (x.s.L.om ? '<div class="note">OM ' + esc(x.s.L.om) + '</div>' : '') : '—'}</td><td>${pil(x.g)}<div class="note">${esc(x.s.txt || '')}</div></td><td class="note">${esc(x.t.exec)}</td></tr>`).join('')).join('')}</tbody></table></div>
     <p class="note">Registrar execução grava cada serviço marcado com a mesma OM (obrigatória pela NP 024) e reinicia o prazo; as fotos ficam na OM do Sankhya. Troca de óleo do motor-bomba e dos mancais da bomba: FR 049_B (botão na ficha da balsa), que reinicia o prazo no plano.</p></div>
   <div class="card"><h2>OMs registradas · Anexo II-B</h2>${OM.length ? `<div class="tw"><table class="t"><thead><tr><th>Data</th><th>OM</th><th>Serviços</th><th>Executou</th><th></th></tr></thead><tbody>${OM.map(o => `<tr><td class="nowrap">${brD(o.date)}</td><td><b>${esc(o.om)}</b></td><td>${o.L.length} · ${esc([...new Set(o.L.map(r => balGr(BA1M[r.item])))].join(', '))}</td><td class="note">${esc(o.L[0].quem || '')}</td><td><button class="mbtn sm" data-balp2b="${esc(o.om)}">🖨 Anexo II-B</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhuma OM registrada nesta balsa.</p>'}</div>`;
}
function balProgItens(b) { return balItens(b).filter(t => (BALP.sel[b.id] || new Set()).has(t.id)); }
function balTextoOM(b, L) {
  const G = {}; L.forEach(t => (G[balGr(t)] = G[balGr(t)] || []).push(t));
  return `MANUTENÇÃO PREVENTIVA · ${b.nome} · ${BAL_MOTOR[b.mot]}\nNP Navecunha 024 item 8\n\n` + Object.entries(G).map(([g, A]) => `${(g === 'Motor' ? BAL_MOTOR[b.mot] : g).toUpperCase()}\n` + A.map(t => `- ${t.serv} · ${balIvTx(t)}`).join('\n')).join('\n\n');
}
const BAL_DOC_CSS = `@page{size:A4;margin:12mm}body{margin:0;font-family:Arial,sans-serif;color:#202124;font-size:11px}h3{font-size:12px;margin:12px 0 4px;color:#0B2A5B}table.d{width:100%;border-collapse:collapse}table.d th{background:#1F2A44;color:#fff;font-size:10px;padding:4px;text-align:left}table.d td{border:1px solid #CBD2DC;padding:4px;vertical-align:top}table.d td.c{text-align:center;width:46px}
  .id{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid #CBD2DC}.id div{padding:4px 6px;border:1px solid #E3E8EF}.id span{display:block;font-size:9px;color:#5F6368}.ln{border-bottom:1px solid #999;height:18px}
  .balrel-g{max-width:150mm}.note{font-size:9.5px;color:#5F6368}.ass{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:34px}.ass div{border-top:1px solid #000;padding-top:3px;text-align:center;font-size:10px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}`;
function balDocJanela(tit, sub, corpo, norma, w0) {
  const w = w0 || window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${typeof tituloArq === 'function' ? tituloArq(tit) : 'Anexo II-B'}</title><style>${DOC_CAB_CSS}${BAL_DOC_CSS}</style></head><body>${docCab(tit, sub, norma || 'NP Navecunha 024 · itens 6.4 e 8')}${corpo}<script>setTimeout(function(){window.print()},500)<\/script></body></html>`); w.document.close();
}
function balServTab(b, L, campo, R) {
  const G = {}; L.forEach(t => (G[balGr(t)] = G[balGr(t)] || []).push(t));
  return `<table class="d"><thead><tr><th>Serviço</th><th>A cada</th>${campo ? '<th>Feito</th><th>Insp. OK</th><th>Não feito</th><th>Observação</th>' : '<th>Resultado</th>'}</tr></thead><tbody>${Object.entries(G).map(([g, A]) => `<tr><td colspan="${campo ? 6 : 3}" style="background:#EEF2F7;font-weight:700">${esc(g === 'Motor' ? BAL_MOTOR[b.mot] : g)}</td></tr>` + A.map(t => { const r = R && R.find(x => x.item === t.id);
    return `<tr><td>${esc(t.serv)}</td><td class="nowrap">${balIvTx(t)}</td>${campo ? '<td class="c">☐</td><td class="c">☐</td><td class="c">☐</td><td style="width:28%"></td>' : `<td>${r && r.insp ? 'Inspecionado · sem intervenção' + (r.obs ? ': ' + esc(r.obs) : '') : 'Executado'}</td>`}</tr>`; }).join('')).join('')}</tbody></table>`;
}
function balCampo(b) {
  const L = balProgItens(b); if (!L.length) return toast('Marque pelo menos um serviço.');
  balDocJanela('ANEXO II-B · FORMULÁRIO DE CAMPO · PREVENTIVA', `Balsa ${esc(b.nome)} · ${esc(BAL_MOTOR[b.mot])}`,
    `<div class="id"><div><span>Balsa</span><b>${esc(b.nome)}</b></div><div><span>Motor-bomba</span>${esc(BAL_MOTOR[b.mot])}</div><div><span>Nº da OM (Sankhya)</span><div class="ln"></div></div><div><span>Data</span><div class="ln"></div></div><div><span>Horímetro do motor-bomba (h)</span><div class="ln"></div></div><div><span>Executante</span><div class="ln"></div></div></div>
     <h3>Serviços</h3>${balServTab(b, L, true)}<h3>Observações</h3><div class="ln"></div><div class="ln"></div><div class="ln"></div>
     <div class="ass"><div>Executante</div><div>Recebido a bordo · Comandante ou Coord. de Operações</div><div>Supervisor de Manutenção</div></div>`);
}
function balIIB(vid, om) {
  const b = balsaDe(vid), o = balOMs(vid).find(x => x.om === String(om)); if (!b || !o) return;
  const L = o.L.map(r => BA1M[r.item]).filter(Boolean), h = o.L.find(r => r.h != null && r.h !== ''), obs = [...new Set(o.L.map(r => r.insp ? '' : r.obs).filter(Boolean))].join(' · ');
  balDocJanela('ANEXO II-B · RELATÓRIO DE MANUTENÇÃO PREVENTIVA', `Balsa ${esc(b.nome)} · OM ${esc(o.om)}`,
    `<div class="id"><div><span>Balsa</span><b>${esc(b.nome)}</b></div><div><span>Motor-bomba</span>${esc(BAL_MOTOR[b.mot])}</div><div><span>Nº da OM (Sankhya)</span><b>${esc(o.om)}</b></div><div><span>Data</span>${brD(o.date)}</div><div><span>Horímetro do motor-bomba</span>${h ? nf(h.h) + ' h' : '—'}</div><div><span>Executante</span>${esc(o.L[0].quem || '—')}</div></div>
     <h3>Serviços realizados</h3>${balServTab(b, L, false, o.L)}${obs ? `<h3>Observações</h3><p>${esc(obs)}</p>` : ''}
     <p style="font-size:9.5px;color:#5F6368;margin-top:10px">Fotos de antes e de depois: na OM ${esc(o.om)} do Sankhya (NP 024 itens 6.4 e 9).</p>
     <div class="ass"><div>Executante</div><div>Recebido a bordo · Comandante ou Coord. de Operações</div><div>Supervisor de Manutenção</div></div>`);
}
// ---------- tela, cliques e menu ----------
VX.bal = balJan('bal', vBal2);
VX.balprog = balJan('balprog', vBalProg);
BAL_VIEWS.splice(BAL_VIEWS.findIndex(v => v[0] === 'bal') + 1, 0, ['balprog', 'Programar preventiva']);
NP_TAG.balprog = 'NP 024 · 6.4 e 8';
AFTER.balprog = () => { balAfter(); const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_balprog_lay', '[data-balreset]'); };
document.addEventListener('click', e => {
  if (!['bal', 'balprog'].includes(VIEW)) return; const t = e.target.closest('[data-balmodo],[data-balpg],[data-balpcop],[data-balpcampo],[data-balpreg],[data-balptodos],[data-balp2b]'); if (!t) return; const d = t.dataset;
  e.stopPropagation(); e.preventDefault();
  const b = balsaDe(ARG);
  if (d.balmodo) { BALM.modo = d.balmodo; try { localStorage.setItem('smf_bal_modo', d.balmodo); } catch (x) { } return render(); }
  if (d.balpg) return go('#balprog/' + d.balpg);
  if (!b) return;
  if (d.balptodos !== undefined) { const I = balLinhas(b).I; BALP.sel[b.id] = new Set(d.balptodos ? I.filter(x => x.g === 'venc' || x.g === 'mes').map(x => x.t.id) : []); return render(); }
  if (d.balpcop !== undefined) { const L = balProgItens(b); if (!L.length) return toast('Marque pelo menos um serviço.'); const tx = balTextoOM(b, L);
    (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(() => toast('Texto da OM copiado: cole na OM do Sankhya.'), () => modal(`<h2>Texto da OM</h2><textarea style="width:100%" rows="14">${esc(tx)}</textarea><div class="row end"><button class="mbtn" data-close>Fechar</button></div>`)); return; }
  if (d.balpcampo !== undefined) return balCampo(b);
  if (d.balpreg !== undefined) { const L = balProgItens(b); if (!L.length) return toast('Marque pelo menos um serviço.'); BALP.ap = { id: b.id, v: S.recs.__v }; return balExeModal(b.id, L.map(t => t.id)); }
  if (d.balp2b) return balIIB(b.id, d.balp2b);
}, true);
document.addEventListener('change', e => { const c = e.target.closest && e.target.closest('[data-balpk]'); if (!c || VIEW !== 'balprog') return; const b = balsaDe(ARG); if (!b) return;
  const s = BALP.sel[b.id] || (BALP.sel[b.id] = new Set()); if (c.checked) s.add(c.dataset.balpk); else s.delete(c.dataset.balpk);
  const h = document.querySelector('#main .card h2'); if (h && /^Serviços/.test(h.textContent)) h.textContent = `Serviços · ${s.size} marcado${s.size === 1 ? '' : 's'}`; }, true);
