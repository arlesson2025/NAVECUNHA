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
// Integridade técnica das balsas no mesmo desenho da dos empurradores (Supervisor, 06/11/2026: “não dá pra deixar o da balsa na mesma ideia?”, “os cartões
// também?”): caixas de números, matriz com em dia discreto e os grupos Precisa de atenção · Em dia · Sem histórico · Fora de operação, cartões e pontos de atenção
const balAten = x => x.e.st === 'bloq' || x.e.st === 'rest';
const balViaIds = () => { try { return new Set(S.cfg.frota.flatMap(v => { const o = vgOndeDe(v.id, false); return o && o.st === 'via' ? (o.balsas || []) : []; })); } catch (e) { return new Set(); } };
const balDiasHor = hr => hr ? Math.max(0, Math.round((pD(isoD(hoje())) - pD(hr.date)) / 864e5)) : null;
function balKpis(E) {
  const op = E.filter(x => x.e.st !== 'ref'), n = k => op.filter(x => x.e.st === k).length, cr = op.reduce((a, x) => a + x.e.crit.length, 0), via = balViaIds().size;
  const barra = [[n('lib'), '#1E8E3E'], [n('rest'), '#F9AB00'], [n('bloq'), '#C5221F'], [n('sem'), '#9AA4B1']].filter(z => z[0]).map(([q, c]) => `<i style="flex:${q};background:${c}"></i>`).join('');
  const box = (l, v, c, h, t) => `<div class="sf-kl" role="link" tabindex="0" title="${t}" onclick="location.hash='${h}'"><span>${l} ›</span><b${c ? ` style="color:${c}"` : ''}>${v}</b></div>`;
  return `<div class="sf-k sf-k2"><div class="sf-ksit"><span>Situação das ${op.length} em operação</span><div class="sf-ksn"><b style="color:var(--okt)">${n('lib')}</b><small>liberadas</small><b style="color:var(--warnt)">${n('rest')}</b><small>com restrição</small><b style="color:var(--badt)">${n('bloq')}</b><small>impedidas</small>${n('sem') ? `<b style="color:#5F6B7A">${n('sem')}</b><small>sem histórico</small>` : ''}</div><div class="sf-kbar">${barra}</div></div>
    ${box('Em viagem', via, '', '#enxviag', 'Abrir o Layout da frota')}${box('Serviços críticos vencidos', cr, cr ? 'var(--badt)' : 'var(--okt)', '#balprog', 'Abrir a 2.2 Backlog e OM preventiva')}</div>`;
}
function balMatriz(E) {
  const T = BAL_GR.map(() => [0, 0]), NC = 5 + BAL_GR.length;
  const tag = x => balAten(x) ? ` <span class="pill ${x.e.st === 'bloq' ? 'p-bad' : 'p-warn'}">${BAL_ST[x.e.st][1]}</span>` : '';
  const linha = x => { const b = x.e.b, hr = balHor(b.id), d = balDiasHor(hr);
    const cs = BAL_GR.map((g, i) => { const L = x.I.filter(y => balGr(y.t) === g); T[i][0] += L.filter(y => y.g === 'venc').length; T[i][1] += L.filter(y => y.g === 'mes').length;
      return `<td class="sf-cc${i ? '' : ' sf-sep'}"><a href="#balprog/${b.id}" class="sf-lk">${sfCel(L.map(y => ({ g: y.g })), '')}</a></td>`; }).join('');
    return `<tr class="sf-lin${balAten(x) ? ' sf-at' : ''}"><td class="sf-n"><a href="#balft/${b.id}" class="sf-lk"><b>${esc(b.nome)}</b></a>${tag(x)}</td><td class="sf-lc">${esc(BAL_MOTOR[b.mot] || '—')}</td>
      <td class="sf-hr"><a href="#balhor" class="sf-lk">${hr ? nf(hr.h) + ' h' : '—'}</a></td><td class="sf-hdc">${d == null ? '<span class="sf-hd sf-red">(sem leitura)</span>' : `<span class="sf-hd ${d > 14 ? 'sf-red' : 'sf-mut'}">(${d} ${d === 1 ? 'dia' : 'dias'})</span>`}</td>
      <td class="sf-cc sf-sep">${x.e.A.length ? `<a href="#balcor" class="sf-lk"><span class="sf-c ${x.e.A.some(a => a.c === 'Crítica') ? 'sf-r' : 'sf-a'}">${x.e.A.length}</span></a>` : '<span class="sf-g"></span>'}</td>${cs}</tr>`; };
  const linF = x => { const b = x.e.b, z = typeof vgRefDados === 'function' && typeof vgEmReforma === 'function' && vgEmReforma(b.id) ? vgRefDados(b.id) : null;
    return `<tr class="sf-fo"><td class="sf-n"><a href="#balft/${b.id}" class="sf-lk"><b>${esc(b.nome)}</b></a> <span class="pill p-mut">Em reforma</span></td><td class="sf-lc">${esc(BAL_MOTOR[b.mot] || '—')}</td>
      <td colspan="${NC - 2}" class="sf-fot">${z ? [z.r && z.r.local ? esc(z.r.local) : '', z.ini ? 'desde ' + brD(z.ini) : '', z.prev ? 'entrega prevista ' + brD(z.prev) : 'sem previsão de entrega'].filter(Boolean).join(' · ') : 'fora de operação'}</td></tr>`; };
  const gh = (t, n, c) => `<tr class="sf-gh${c ? ' ' + c : ''}"><td colspan="${NC}">${t} · ${n}</td></tr>`, op = E.filter(x => x.e.st !== 'ref');
  const A = op.filter(balAten), Ed = op.filter(x => x.e.st === 'lib'), Sh = op.filter(x => x.e.st === 'sem'), F = E.filter(x => x.e.st === 'ref');
  const corpo = (A.length ? gh('Precisa de atenção', A.length, 'at') + A.map(linha).join('') : '') + (Ed.length ? gh('Em dia', Ed.length) + Ed.map(linha).join('') : '')
    + (Sh.length ? gh('Sem histórico', Sh.length, 'fo') + Sh.map(linha).join('') : '') + (F.length ? gh('Fora de operação', F.length, 'fo') + F.map(linF).join('') : '');
  const nA = op.reduce((a, x) => a + x.e.A.length, 0), z = '<span class="sf-na sf-z">—</span>';
  const tot = `<tfoot><tr class="sf-tot"><td colspan="4"><b>Total das balsas</b> <span class="sf-tl">Vencidos</span></td><td class="sf-cc sf-sep">${nA ? `<span class="sf-c sf-r" title="falhas abertas">${nA}</span>` : z}</td>${T.map((t, i) => `<td class="sf-cc${i ? '' : ' sf-sep'}">${t[0] ? `<span class="sf-c sf-r">${t[0]}</span>` : z}</td>`).join('')}</tr>
    <tr class="sf-tot sf-tot2"><td colspan="4"><span class="sf-tl">Vencem no mês</span></td><td class="sf-cc sf-sep">${z}</td>${T.map((t, i) => `<td class="sf-cc${i ? '' : ' sf-sep'}">${t[1] ? `<span class="sf-c sf-a">${t[1]}</span>` : z}</td>`).join('')}</tr></tfoot>`;
  return `<div class="tw"><table class="sf-mx"><thead><tr class="sf-gr"><th colspan="4"></th><th class="sf-sep" data-sfdica="O que decide se a balsa pode operar (NP 024 6.1): falha crítica aberta impede a operação; falha alta deixa com restrição. Clique no número para abrir a 1.2 Manutenção corretiva.">Liberação</th><th colspan="${BAL_GR.length}" class="sf-sep" data-sfdica="Plano preventivo da NP 024 (item 8), um equipamento por coluna. Número vermelho = itens vencidos; âmbar = vencem no mês; ponto verde = em dia. Clique na célula para abrir a 2.2 Backlog e OM preventiva da balsa.">Manutenção preventiva</th></tr>
    <tr><th class="l">Balsa</th><th class="l">Motor-bomba</th><th class="r">Horímetro</th><th class="r">Sem leitura há</th><th class="sf-sep"><small>abertas</small>Falhas</th>${BAL_GR_C.map((g, i) => `<th class="${i ? '' : 'sf-sep'}" title="${esc(BAL_GR[i])}">${g}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody>${tot}</table></div>
    <div class="sf-rod"><div class="sf-leg"><span><span class="sf-c sf-r">3</span> vencidos</span><span><span class="sf-c sf-a">2</span> vencem no mês</span><span><span class="sf-g"></span> em dia</span><span><span class="sf-o"></span> sem histórico</span><span><span class="sf-na">—</span> não se aplica</span></div><details class="sf-como"><summary>Como ler</summary><p>Ponto verde = em dia; número vermelho = serviços vencidos; número âmbar = vencem no mês; quadrado vazio = sem histórico. Impedida de operar = serviço crítico vencido ou falha crítica aberta; com restrição = outro serviço vencido ou falha alta (NP 024 6.1). Clique numa célula para programar a preventiva da balsa (2.2); no nome, a ficha técnica; no horímetro, a 1.1. Sem leitura há: dias desde a última leitura do horímetro do motor-bomba, em vermelho acima de 14 dias. Fora de operação: balsas em reforma (1.3 Layout da frota).</p></details></div>`;
}
function balCartoes(E) {
  const tagC = { 'p-ok': 'ok', 'p-warn': 'at', 'p-bad': 'bad' };
  return `<div class="sf-cards">${E.map(x => { const b = x.e.b, hr = balHor(b.id), P = x.I, v = P.filter(y => y.g === 'venc').length, m = P.filter(y => y.g === 'mes').length, ok = P.filter(y => y.g === 'ok').length, sem = P.filter(y => y.g === 'sem').length, t = v + m + ok || 1, st = BAL_ST[x.e.st], nA = x.e.A.length;
    return `<div class="sf-cd" onclick="location.hash='#balprog/${b.id}'"><div class="sf-cdh"><b>${esc(b.nome)}</b><span class="sf-cfg">${esc(BAL_MOTOR[b.mot] || '')}</span><span class="sf-tag ${tagC[st[0]] || ''}">${esc(st[1])}</span></div>
      <div class="sf-mut">Motor-bomba: ${hr ? nf(hr.h) + ' h · leitura de ' + brD(hr.date) : 'sem leitura'}${nA ? ` · <b class="sf-red">${nA} falha${nA > 1 ? 's' : ''} aberta${nA > 1 ? 's' : ''}</b>` : ''}</div>
      ${x.e.st === 'ref' ? '<div class="sf-mut">Em reforma: fora das contas do plano.</div>' : `<div class="sf-st"><i style="width:${v / t * 100}%;background:#C5221F"></i><i style="width:${m / t * 100}%;background:#F9AB00"></i><i style="width:${ok / t * 100}%;background:#1E8E3E"></i></div>
      <div class="sf-pl">${v ? `<span class="pill p-bad">${v} vencido${v === 1 ? '' : 's'}</span>` : ''}${x.e.crit.length ? `<span class="pill p-bad"><b>${x.e.crit.length} crítico${x.e.crit.length === 1 ? '' : 's'}</b></span>` : ''}${m ? `<span class="pill p-warn">${m} no mês</span>` : ''}<span class="pill p-ok">${ok} em dia</span>${sem ? `<span class="pill p-mut">${sem} sem histórico</span>` : ''}</div>`}</div>`; }).join('')}</div>
    <p class="note">Clique no cartão para abrir a 2.2 Backlog e OM preventiva da balsa. Barra: vencidos · vencem no mês · em dia.</p>`;
}
// pontos de atenção agrupados por motivo, uma etiqueta por balsa (como nos empurradores)
function balPorque(E) {
  const G = [], op = E.filter(x => x.e.st !== 'ref'), ch = (h, t) => `<a href="${h}" class="sf-lk sf-chip">${t}</a>`;
  const g = (c, tit, I) => { if (I.length) G.push(`<div class="sf-pa ${c}"><b>${tit}</b><div class="sf-chips">${I.join('')}</div></div>`); };
  const nA = (x, c) => x.e.A.filter(a => a.c === c).length, n = (x, k) => esc(x.e.b.nome) + (k > 1 ? ` <small>${k}</small>` : '');
  g('bad', 'Falha crítica aberta', op.filter(x => nA(x, 'Crítica')).map(x => ch('#balcor', n(x, nA(x, 'Crítica')))));
  g('bad', 'Serviço crítico vencido', op.filter(x => x.e.crit.length).map(x => ch('#balprog/' + x.e.b.id, n(x, x.e.crit.length))));
  g('at', 'Falha alta aberta', op.filter(x => nA(x, 'Alta')).map(x => ch('#balcor', n(x, nA(x, 'Alta')))));
  g('at', 'Outros serviços vencidos', op.filter(x => x.e.venc.length > x.e.crit.length).map(x => ch('#balprog/' + x.e.b.id, esc(x.e.b.nome) + ` <small>${x.e.venc.length - x.e.crit.length}</small>`)));
  return (G.join('') || '<p class="note">Nenhum ponto de atenção: todas as balsas em operação liberadas.</p>') + '<p class="note">Vermelho impede de operar; âmbar restringe a operação. Clique na balsa para ir à tela que resolve.</p>';
}
function vBal2() {
  const E = BALSAS.map(balLinhas), md = ['matriz', 'cartoes', 'lista'].includes(BALM.modo) ? BALM.modo : 'matriz';
  if (md === 'lista') return vBal().replace('<button class="mbtn" data-balfalha="">', balModoBt(md) + '<button class="mbtn" data-bal27a="">📋 FR 027_A</button><button class="mbtn" data-balfalha="">');
  const ord = { bloq: 0, rest: 1, lib: 2, sem: 3, ref: 4 }, L = [...E].sort((a, b) => ord[a.e.st] - ord[b.e.st] || b.e.venc.length - a.e.venc.length || (a.e.b.nome < b.e.b.nome ? -1 : 1));
  return balCab('Integridade técnica da frota', '<i style="font-size:17px">Asset Integrity Management</i>', frotaSw() + '<button class="mbtn" data-bal27a="">📋 FR 027_A</button><button class="mbtn" data-balfalha="">⚠ Registrar falha</button>').replace('<h1>Integridade técnica da frota</h1>', '<h1><span style="font-size:115%">Integridade técnica da frota</span></h1>')   // mesmo tamanho do título dos empurradores
   + `<div class="card"><h2 class="sf-h2">Integridade do Plano de Manutenção - Frota de Balsas<span class="sf-segh" data-nodrag>${balModoBt(md)}</span></h2>${balKpis(E)}${md === 'cartoes' ? balCartoes(L) : balMatriz(L)}</div>
   <div class="card"><h2>Pontos de atenção</h2>${balPorque(E)}</div>`;
}
const balModoBt = md => `<div class="seg"><button data-balmodo="matriz" class="${md === 'matriz' ? 'on' : ''}">▦ Matriz</button><button data-balmodo="cartoes" class="${md === 'cartoes' ? 'on' : ''}">▤ Cartões</button><button data-balmodo="lista" class="${md === 'lista' ? 'on' : ''}">☰ Lista</button></div>`;
// arranjo das janelas mudou (saiu o quadro de filtros): o arranjo guardado da tela volta ao padrão uma vez
try { if (!localStorage.getItem('smf_bal_lay_v2')) { localStorage.removeItem('smf_bal_lay'); localStorage.setItem('smf_bal_lay_v2', '1'); } } catch (e) { }
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
    return balCab('2.2 Backlog e OM preventiva', 'O que vence em cada balsa · escolha a balsa, marque os serviços, copie o texto da OM do Sankhya, imprima o formulário de campo e registre a execução', frotaSw('#enx', '#balprog'))
     // no mesmo desenho da 2.2 dos empurradores (Supervisor, 06/11/2026: “deixa o da balsa assim também”): resumo com os quatro números e a escolha da balsa
     + (() => { const ano = hoje().getFullYear(), nV = L.reduce((a, y) => a + y.v, 0), nM = L.reduce((a, y) => a + y.m, 0), nS = L.reduce((a, y) => a + y.s, 0), aprov = L.filter(y => cronoBase(ano, y.x.e.b.id)).length;
       return `<div class="card"><h2>Resumo</h2><div class="f2-ks">${[['Vencidos', nV, 'var(--badt)'], ['Vencimento no mês', nM, 'var(--warnt)'], ['Sem histórico', nS, nS ? 'var(--badt)' : ''], [`Cronograma ${ano} aprovado`, aprov + ' de ' + L.length, aprov < L.length ? 'var(--warnt)' : 'var(--okt)']].map(([l, n, c]) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${n}</b></div>`).join('')}</div>
         ${nS ? `<p class="note" style="color:var(--badt)">${nS} serviço${nS === 1 ? '' : 's'} sem histórico não vence${nS === 1 ? '' : 'm'} nunca: registre o último serviço ou defina o marco zero em Administração antes de usar o cronograma de verdade.</p>` : ''}
         ${aprov < L.length ? `<p class="note">O previsto do ano só fica valendo para a aderência depois de aprovado: aprove em <a href="#balcr">2.1 Cronograma de manutenção</a>.</p>` : ''}</div>
       <div class="card"><h2>Escolha a balsa</h2><div class="row" style="gap:6px;flex-wrap:wrap">
       ${L.map(y => `<button class="mbtn" data-balpg="${y.x.e.b.id}"><b>${esc(y.x.e.b.nome)}</b>${y.v ? ` <span class="pill p-bad">${y.v}</span>` : ''}${y.m ? ` <span class="pill p-warn">${y.m}</span>` : ''}</button>`).join('')}</div>
       <p class="note">Vermelho = vencidos, âmbar = vencem no mês (por data até o fim do mês, ou horas que acabam até lá no ritmo do motor-bomba). Balsa em reforma fica fora. A situação de cada balsa está em <a href="#bal">Integridade técnica da frota</a>.</p></div>`; })(); }
  if (BALP.ap && BALP.ap.id === b.id && S.recs.__v !== BALP.ap.v) { delete BALP.sel[b.id]; BALP.ap = null; }   // registrou: a marcação recomeça pelo que ainda vence
  const { e, I } = balLinhas(b), sel = balProgSel(b, I), hr = balHor(b.id), G = BAL_GR.filter(g => I.some(x => balGr(x.t) === g));
  const pil = g => g === 'venc' ? '<span class="pill p-bad">Vencido</span>' : g === 'mes' ? '<span class="pill p-warn">Vence no mês</span>' : g === 'ok' ? '<span class="pill p-ok">Em dia</span>' : '<span class="pill p-mut">Sem histórico</span>';
  const OM = balOMs(b.id).slice(0, 8);
  return balCab(`2.2 Backlog e OM preventiva · ${b.nome}`, `${esc(balMotTx(b))} · motor-bomba ${hr ? nf(hr.h) + ' h em ' + brD(hr.date) : 'sem leitura'} · vencidos e os que vencem no mês já vêm marcados`, `<a class="mbtn" href="#balprog">← Balsas</a><a class="mbtn" href="#balft/${b.id}">Ficha técnica</a>`)
   + balLinhaTempo(b, I) + `<div class="card"><h2>Serviços · ${sel.size} marcado${sel.size === 1 ? '' : 's'}</h2>
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
BAL_VIEWS.splice(BAL_VIEWS.findIndex(v => v[0] === 'bal') + 1, 0, ['balprog', 'Backlog e OM preventiva']);
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

// ---------- 2.4 Equipamentos críticos e riscos das balsas (Supervisor, 06/11/2026: “se ainda não tiver equipamentos críticos das balsas faz, acho que tá no plano”) ----------
// os equipamentos críticos são os do plano BA1 com item de prioridade Crítica (NP 024 item 8); a matriz de risco (severidade × probabilidade) entra com a Matriz técnica das balsas
const balCritGr = () => [...new Set(BA1.filter(t => t.prio === 'Crítica').map(balGr))];
function vBalRisco() {
  const E = BALSAS.map(balLinhas), op = E.filter(x => x.e.st !== 'ref'), G = balCritGr(), CR = BA1.filter(t => t.prio === 'Crítica');
  const nCv = op.reduce((a, x) => a + x.e.crit.length, 0), nFc = op.reduce((a, x) => a + x.e.A.filter(a2 => a2.c === 'Crítica').length, 0), NC = 2 + G.length;
  const k = (l, v, c, sub) => `<div><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${v}</b>${sub ? `<small class="sf-mut" style="display:block">${sub}</small>` : ''}</div>`;
  const resumo = `<div class="card"><h2>Resumo</h2><div class="sf-k sf-k2">${k('Equipamentos críticos (plano NP 024)', G.length, '')}${k('Itens críticos do plano', CR.length, '', 'conforme o motor de cada balsa')}${k('Serviços críticos vencidos', nCv, nCv ? 'var(--badt)' : 'var(--okt)', 'impedem a operação')}${k('Falhas críticas abertas', nFc, nFc ? 'var(--badt)' : 'var(--okt)', 'impedem a operação')}</div>
    <p class="note">Crítico = item do plano preventivo com prioridade Crítica (2.3 Plano preventivo). Serviço crítico vencido ou falha crítica aberta deixa a balsa impedida de operar (NP 024 6.1). A matriz de risco (severidade × probabilidade, como a NP 055 6.2 dos empurradores) entra com a Matriz técnica de equipamentos das balsas.</p></div>`;
  const lista = `<div class="card"><h2>Equipamentos críticos · itens do plano</h2><div class="tw"><table class="t"><thead><tr><th>Equipamento</th><th>Itens críticos</th><th>Balsas com item crítico vencido</th></tr></thead><tbody>${G.map(g => { const I = CR.filter(t => balGr(t) === g), V = op.filter(x => x.e.crit.some(y => balGr(y.t) === g));
      return `<tr><td class="nowrap"><b>${esc(g)}</b></td><td>${I.map(t => `<div><b>${t.id}</b>${t.mot ? ` <span class="sf-mut">(${esc(BAL_MOTOR[t.mot] || t.mot)})</span>` : ''} · ${esc(String(t.serv || '').slice(0, 110))}${String(t.serv || '').length > 110 ? '…' : ''}</div>`).join('')}</td><td>${V.length ? V.map(x => `<a href="#balprog/${x.e.b.id}" class="sf-lk sf-chip">${esc(x.e.b.nome)}</a>`).join(' ') : '<span class="sf-mut">nenhuma</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  const linha = x => { const b = x.e.b, crit = x.I.filter(y => y.t.prio === 'Crítica'), at = crit.some(y => y.g === 'venc');
    return `<tr class="sf-lin${at ? ' sf-at' : ''}"><td class="sf-n"><a href="#balft/${b.id}" class="sf-lk"><b>${esc(b.nome)}</b></a>${at ? ' <span class="pill p-bad">Impedida de operar</span>' : ''}</td><td class="sf-lc">${esc(BAL_MOTOR[b.mot] || '—')}</td>${G.map((g, i) => `<td class="sf-cc${i ? '' : ' sf-sep'}"><a href="#balprog/${b.id}" class="sf-lk">${sfCel(crit.filter(y => balGr(y.t) === g).map(y => ({ g: y.g })), '')}</a></td>`).join('')}</tr>`; };
  const A = op.filter(x => x.I.some(y => y.t.prio === 'Crítica' && y.g === 'venc')), Ed = op.filter(x => !A.includes(x)), F = E.filter(x => x.e.st === 'ref');
  const gh = (t, n, c) => `<tr class="sf-gh${c ? ' ' + c : ''}"><td colspan="${NC}">${t} · ${n}</td></tr>`;
  const matriz = `<div class="card"><h2>Controles críticos por balsa</h2><div class="tw"><table class="sf-mx"><thead><tr class="sf-gr"><th colspan="2"></th><th colspan="${G.length}" class="sf-sep" data-sfdica="Só os itens críticos do plano preventivo de cada equipamento. Número vermelho = vencidos (impedem a operação); âmbar = vencem no mês; ponto verde = em dia. Clique na célula para abrir a 2.2 da balsa.">Equipamentos críticos</th></tr>
    <tr><th class="l">Balsa</th><th class="l">Motor-bomba</th>${G.map((g, i) => `<th class="${i ? '' : 'sf-sep'}">${esc(BAL_GR_C[BAL_GR.indexOf(g)] || g)}</th>`).join('')}</tr></thead><tbody>
    ${A.length ? gh('Com item crítico vencido', A.length, 'at') + A.map(linha).join('') : ''}${Ed.length ? gh('Em dia', Ed.length) + Ed.map(linha).join('') : ''}${F.length ? gh('Fora de operação', F.length, 'fo') + F.map(x => `<tr class="sf-fo"><td class="sf-n"><b>${esc(x.e.b.nome)}</b> <span class="pill p-mut">Em reforma</span></td><td colspan="${NC - 1}" class="sf-fot">fora das contas do plano</td></tr>`).join('') : ''}</tbody></table></div>
    <div class="sf-rod"><div class="sf-leg"><span><span class="sf-c sf-r">3</span> vencidos</span><span><span class="sf-c sf-a">2</span> vencem no mês</span><span><span class="sf-g"></span> em dia</span><span><span class="sf-o"></span> sem histórico</span><span><span class="sf-na">—</span> não se aplica</span></div></div></div>`;
  return balCab('2.4 Equipamentos críticos e riscos · NP 024', 'Equipamentos críticos do plano preventivo das balsas (itens de prioridade Crítica) e os controles de cada balsa', frotaSw('#enxrisco', '#balrisco')) + resumo + matriz + lista;
}
VX.balrisco = balJan('balrisco', vBalRisco);
BAL_VIEWS.splice(BAL_VIEWS.findIndex(v => v[0] === 'balpl') + 1, 0, ['balrisco', 'Equipamentos críticos e riscos']); BAL_NUM.balrisco = '2.4'; NP_TAG.balrisco = 'NP 024 · 6.1 e 8';
BAL_ETAPAS[1][2].push('balrisco');
AFTER.balrisco = () => { balAfter(); const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_balrisco_lay', '[data-balreset="balrisco"]'); };
