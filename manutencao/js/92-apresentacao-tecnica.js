/* =====================================================================
   4.4 APRESENTAÇÃO TÉCNICA MENSAL (SMF 3.107, 30/10/2026; pedido do Supervisor: trazer a apresentação da versão
   antiga, CTLE_MAN_previa, “trabalhamos muito e fizemos”). Slides 16:9 (1280 × 720) para a reunião do mês, com os
   mesmos números do 4.3 Relatório gerencial (rmeDados) e dos indicadores da NP 055 item 9 (js/90).
   Mês escolhido (até o dia 10 abre no mês passado, como o 4.3); fotos de antes e depois das OMs e dos FR 049_B do
   mês (desmarque o que não mostrar) e fotos de destaque adicionadas neste aparelho (docagem, equipe, terceiros).
   Apresentar em tela cheia (setas, Esc) ou baixar em PDF (html2canvas + jsPDF de lib/).
   Da antiga saíram “Modos e causas · ISO 14224” (agora sem ISO 14224) e “Custos” (o SMF não registra custo: fica no Sankhya).
   ===================================================================== */
'use strict';
const ATP = { mes: null, fora: new Set(), extra: [], mesX: '', FT: {}, ftMes: '', R: null, i: 0 };
const ATP_MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const ATP_C = { nv: '#16244A', az: '#1F4466', cl: '#9DB4CC', ok: '#137333', at: '#B06000', bad: '#C5221F', gr: '#C9D3DF', mut: '#5B6B80' };
function atpPer() {
  if (!ATP.mes) { const h = hoje(), d = new Date(h.getFullYear(), h.getMonth() - (h.getDate() <= 10 ? 1 : 0), 1); ATP.mes = isoD(d).slice(0, 7); }
  const [y, m] = ATP.mes.split('-').map(Number), ini = isoD(new Date(y, m - 1, 1)), f = isoD(new Date(y, m, 0)), fim = f > isoD(hoje()) ? isoD(hoje()) : f;
  return { y, m: m - 1, ini, fim, nome: ATP_MES[m - 1] + ' de ' + y };
}
// os dados do mês são os do relatório gerencial (conta pesada: guarda até a próxima gravação)
function atpR(P) { const k = P.ini + '|' + P.fim + '|' + S.recs.__v; if (!ATP.R || ATP.R.k !== k) ATP.R = { k, R: rmeDados(P.ini, P.fim) }; return ATP.R.R; }
const atpAut = () => { try { return localStorage.getItem('smf_apres_aut') || (S.session && S.session.name) || ''; } catch (e) { return (S.session && S.session.name) || ''; } };
// ---------- peças dos slides ----------
function atpCols(lab, val, o) {   // colunas por mês: o último mês em azul-marinho, os anteriores claros; meta tracejada
  o = o || {}; const W = 560, H = o.h || 250, B = 26, T = 26, n = lab.length || 1, mx = o.pct ? 100 : Math.max(1, ...val.map(v => v || 0)), bw = W / n, w = Math.min(30, bw * .56), Y = v => T + (H - B - T) * (1 - v / mx);
  let g = '';
  if (o.meta != null) g += `<line x1="0" x2="${W}" y1="${Y(o.meta)}" y2="${Y(o.meta)}" stroke="${ATP_C.at}" stroke-dasharray="6 4" stroke-width="1.4"/><text x="${W}" y="${Y(o.meta) - 6}" text-anchor="end" font-size="12" fill="${ATP_C.at}">meta ${o.menor ? '≤' : '≥'} ${o.meta}${o.pct ? '%' : ''}</text>`;
  lab.forEach((l, i) => { const v = val[i], x = i * bw + (bw - w) / 2, ult = i === n - 1, ruim = o.meta != null && v != null && (o.menor ? v > o.meta : v < o.meta);
    if (v) g += `<rect x="${x}" y="${Y(v)}" width="${w}" height="${Y(0) - Y(v)}" rx="3" fill="${ruim ? (ult ? ATP_C.bad : '#E3A598') : ult ? (o.cor || ATP_C.nv) : (o.cor2 || ATP_C.cl)}"/>`;
    if (v != null) g += `<text x="${x + w / 2}" y="${Y(v || 0) - 7}" text-anchor="middle" font-size="13" font-weight="${ult ? 700 : 400}" fill="${ult ? '#14233B' : ATP_C.mut}">${o.fmt ? o.fmt(v) : nf(v)}</text>`;
    g += `<text x="${x + w / 2}" y="${H - 7}" text-anchor="middle" font-size="13" fill="${ATP_C.mut}">${esc(l)}</text>`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="#1F2A44" stroke-width="1"/></svg>`;
}
function atpBarsH(rows, o) {   // rows = [rótulo, valor, detalhe, cor, texto do valor]
  o = o || {}; if (!rows.length) return `<div class="at-vz">${o.vazio || 'Sem registros no período'}</div>`;
  const mx = o.mx || Math.max(1, ...rows.map(r => r[1] || 0));
  return `<div class="at-hb">${rows.map((r, i) => `<div><span>${esc(r[0])}${r[2] ? `<em>${esc(r[2])}</em>` : ''}</span><i>${r[1] != null ? `<b style="width:${Math.max(1.5, Math.min(1, r[1] / mx) * 100)}%;background:${r[3] || (i === 0 ? (o.cor || ATP_C.bad) : (o.cor2 || '#E3A598'))}"></b>` : ''}</i><strong>${r[4] != null ? esc(r[4]) : nf(r[1])}</strong></div>`).join('')}</div>`;
}
function atpSeg(parts) {   // barra 100% com legenda
  const t = parts.reduce((a, p) => a + p[1], 0);
  return `<div class="at-seg">${t ? parts.filter(p => p[1]).map(p => `<b style="width:${p[1] / t * 100}%;background:${p[2]}">${p[1]}</b>`).join('') : `<b style="width:100%;background:#E4EAF3;color:${ATP_C.mut}">sem registros</b>`}</div><div class="at-leg">${parts.map(p => `<span><i style="background:${p[2]}"></i>${p[0]} <b>${p[1]}</b></span>`).join('')}</div>`;
}
const atpTile = (v, l, st, sub) => `<div class="at-tile${st ? ' at-' + st : ''}"><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
const atpImg = (k, rot) => { const u = k && ATP.FT[k]; return u ? `<div class="at-ph"><img src="${u}" alt=""><span>${rot}</span></div>` : `<div class="at-ph at-pv"><em>${rot}</em><small>${k ? 'foto no Drive (sem sinal ou não baixada)' : 'sem foto'}</small></div>`; };
const atpDot = c => `<span class="at-dot" style="background:${c}"></span>`;
// fotos do mês: uma entrada por registro (OM corretiva, OM preventiva, FR 049_B), com a primeira foto de antes e a de depois
function atpFotosMes(R) {
  const G = {};
  (R.fotos || []).forEach(([id, ix, tipo, vid, om, date, rot]) => { const g = G[id] = G[id] || { id, vid, om, date, rot, t: /^Corretiva/.test(rot) ? 'C' : /FR 049_B/.test(rot) ? 'L' : 'P', antes: null, depois: null, outra: null, n: 0 };
    g.n++; const k = id + '|' + ix; if (tipo === 'ANTES' && !g.antes) g.antes = k; else if (tipo === 'DEPOIS' && !g.depois) g.depois = k; else if (!g.outra) g.outra = k; });
  return Object.values(G).map(g => { if (!g.antes && !g.depois) g.antes = g.outra; const r = S.recs.get(g.id) || {};
    if (g.t === 'C') { g.tit = vName(g.vid) + ' · ' + rmeEqN(r.equip); g.sub = 'Corretiva ' + (r.classe || '') + ' · OM ' + (g.om || '—') + ' · ' + brD(g.date); g.o = r; }
    else if (g.t === 'L') { g.tit = vName(g.vid) + ' · troca de óleo: ' + (r.eq || []).filter(q => q.status === 'T').map(q => q.name || q.key).join(', '); g.sub = 'FR 049_B · OM ' + (g.om || '—') + ' · ' + brD(g.date); }
    else { const it = [...new Set(recs('base').filter(b => !b.excluido && b.vessel === g.vid && (b.om || '') === (g.om || '') && b.date === g.date && A1M[b.item]).map(b => enxServ(A1M[b.item])))];
      g.tit = vName(g.vid) + ' · ' + (it.slice(0, 2).join(', ') || 'preventiva') + (it.length > 2 ? ' e mais ' + (it.length - 2) : ''); g.sub = 'Preventiva · OM ' + (g.om || '—') + ' · ' + brD(g.date); }
    return g; }).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
}
// ---------- os slides ----------
function atpSlides(R, P) {
  const L = [], p = R.N.per, a = R.N.ano, aut = esc(atpAut()), di = new Date(P.y, P.m, 1), df = new Date(P.y, P.m + 1, 1);
  const head = (n, t, sub) => `<div class="at-h"><div><small>${n} · ${P.nome}</small><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ''}</div><img src="${LOGOS.nav}" alt=""></div>`;
  const sl = body => `<div class="at-sl">${body}<div class="at-f"><span>Manutenção · Empurradores Fluviais · NP Navecunha 055</span><span>@P</span></div></div>`;
  const st = (v, ok) => v == null || isNaN(v) ? '' : ok ? 'ok' : 'bad', pc = v => v == null ? '—' : Math.round(v) + '%';
  const mesI = R.mesLab.map((_, i) => [isoD(new Date(R.ano, i, 1)), isoD(new Date(Math.min(+new Date(R.ano, i + 1, 0), +pD(R.fim))))]);
  // 1 · capa
  L.push(`<div class="at-sl at-cv" style="background-image:linear-gradient(90deg,rgba(11,31,58,.96) 0%,rgba(11,31,58,.82) 45%,rgba(11,31,58,.25) 100%),url(img/apres-capa.jpg)"><div class="at-cvl"><div class="at-lg"><img src="${LOGOS.nav}" alt=""><i></i><img src="${LOGOS.vda}" alt=""></div><small>Apresentação técnica mensal</small><h1>Manutenção da frota<br>de empurradores</h1><h3>${P.nome}</h3><p>${R.frota} empurradores · NP Navecunha 055${aut ? ' · ' + aut : ''}</p></div></div>`);
  // 2 · indicadores da NP 055 item 9
  const D = knpDisp(di, df), MB = knpMTBF(df), MT = knpMTTR(di, df), BK = knpBacklogs().filter(r => r.date <= P.fim).pop(), bkV = BK && +BK.t > 0 ? +BK.n / +BK.t * 100 : BK ? 0 : null;
  const FT = knpFotos(di, df), q0 = new Date(P.y, Math.floor(P.m / 3) * 3, 1), PR = knpPred(q0, new Date(q0.getFullYear(), q0.getMonth() + 3, 1)), dv = D ? D.v : null;
  L.push(sl(head('Resultados', 'Indicadores de desempenho do mês', 'NP 055 item 9 · meta de cada indicador') + `<div class="at-tiles">
    ${atpTile(dv == null ? '—' : nf(dv, 1) + '%', 'Disponibilidade da frota', st(dv, dv >= 95), 'meta ≥ 95%' + (D ? ' · ' + nf(D.par, 1) + ' h paradas' : ''))}
    ${atpTile(MB.v == null ? '—' : nf(MB.v, 0) + ' h', 'MTBF · tempo médio entre falhas', st(MB.v, MB.v >= 500), 'meta ≥ 500 h · 12 meses · ' + MB.L.length + ' falha(s)')}
    ${atpTile(MT.v == null ? '—' : nf(MT.v, 1) + ' h', 'MTTR · tempo médio de reparo', st(MT.v, MT.v <= 8), 'meta ≤ 8 h · ' + MT.L.length + ' falha(s) liberada(s)')}
    ${atpTile(bkV == null ? '—' : nf(bkV, 1) + '%', 'Backlog', st(bkV, bkV <= 5), BK ? 'meta ≤ 5% · Sankhya em ' + brD(BK.date) : 'meta ≤ 5% · não lançado')}
    ${atpTile(FT.v == null ? '—' : nf(FT.v, 0) + '%', 'Registro fotográfico', st(FT.v, FT.v >= 99.95), 'meta 100% · ' + FT.ok + ' de ' + FT.t + ' OM(s) com antes e depois')}
    ${atpTile(PR.v == null ? '—' : nf(PR.v, 0) + '%', 'Cumprimento do plano preditivo', st(PR.v, PR.v >= 80), 'meta ≥ 80% · T' + (Math.floor(P.m / 3) + 1) + '/' + P.y + ' · ' + PR.ok + ' de ' + PR.t)}</div>`));
  // 3 · operação da frota
  const hm = R.mesLab.map((_, i) => R.hor.reduce((t, x) => t + x.mes[i], 0));
  L.push(sl(head('Operação', 'Operação da frota', 'horas de operação dos motores principais (MCP) pelos horímetros') + `<div class="at-2"><div><h4>Horas de operação dos MCP por mês (h) · ${R.ano}</h4>${atpCols(R.mesLab, hm)}</div>
    <div><div class="at-tiles at-cl">${atpTile(nf(hm[hm.length - 1] || 0) + ' h', 'MCP no mês', '', 'acumulado no ano: ' + nf(hm.reduce((s, x) => s + x, 0)) + ' h')}${atpTile(p.sem, 'motores sem leitura no mês', p.sem ? 'warn' : 'ok', p.sem ? 'entram com 0 h · lançar em 1.1 Horímetros' : 'todos com leitura')}</div>
    <h4 style="margin-top:18px">OMs do mês · preventiva × corretiva</h4>${atpSeg([['Preventiva', p.oms, ATP_C.nv], ['Corretiva', p.cor, ATP_C.at]])}</div></div>`));
  // 4 · preventiva
  const nV = R.venc.reduce((s, x) => s + x[1], 0);
  L.push(sl(head('Preventiva', 'Manutenção preventiva', 'cronograma do Anexo I: feito no prazo ÷ o que venceu') + `<div class="at-2"><div><h4>Aderência ao cronograma por mês · ${R.ano}</h4>${atpCols(R.mesLab, R.ads, { pct: 1, meta: 90, fmt: v => v + '%' })}</div>
    <div class="at-tiles at-cl at-sm">${atpTile(pc(p.ad.ad), 'aderência ao cronograma no mês', st(p.ad.ad, p.ad.ad >= 90), 'acumulado no ano: ' + pc(a.ad.ad) + ' · referência ≥ 90%')}${atpTile(nf(p.serv), 'serviços preventivos executados', '', p.oms + ' OM(s) no mês · ' + nf(a.serv) + ' no ano' + (p.insp ? ' · ' + p.insp + ' inspecionado(s)' : ''))}
    ${atpTile(p.nf, 'serviços não realizados', p.nf ? 'warn' : 'ok', p.nf ? 'com justificativa registrada · ' + a.nf + ' no ano' : 'nenhum no mês')}${atpTile(nV, 'serviços vencidos hoje', nV ? 'bad' : 'ok', nV ? 'em ' + R.venc.length + ' empurrador(es): ' + R.venc.map(x => vName(x[0])).slice(0, 4).join(', ') : 'frota em dia')}</div></div>`));
  // 5 · corretiva
  const cls = ['Crítica', 'Alta', 'Média', 'Baixa'], cc = { 'Crítica': ATP_C.bad, 'Alta': '#D9822B', 'Média': '#1A73E8', 'Baixa': ATP_C.cl };
  const cm = mesI.map(([x, y]) => rmeCorr(x, y).length), CR = R.cor.slice().sort((x, z) => cls.indexOf(x[5]) - cls.indexOf(z[5]) || (x[0] < z[0] ? -1 : 1));
  L.push(sl(head('Corretiva', 'Manutenção corretiva', 'corretivas abertas no mês, por classe (NP 055 item 5.5.1)') + `<div class="at-2"><div><h4>Corretivas por mês · ${R.ano}</h4>${atpCols(R.mesLab, cm, { cor: ATP_C.bad, cor2: '#E3A598', h: 210 })}<h4 style="margin-top:14px">Classe das corretivas do mês</h4>${atpSeg(R.cls.map(([c, n]) => [c, n, cc[c]]))}</div>
    <div><h4>Corretivas do mês · ${CR.length}</h4>${CR.length ? `<table class="at-t at-q"><tr><th>Classe</th><th>Empurrador</th><th>Equipamento · falha</th><th>Reparo</th></tr>${CR.slice(0, 5).map(o => `<tr><td class="at-nw">${atpDot(cc[o[5]] || ATP_C.gr)}${esc(o[5] || '—')}</td><td class="at-nw">${esc(vName(o[1]))}</td><td><b>${esc(o[4])}</b><br>${esc(rmeTxt(o[6], 48))}</td><td class="at-nw">${o[8] != null ? nf(o[8], 1) + ' h' : `<b style="color:${ATP_C.bad}">em aberto</b>`}</td></tr>`).join('')}</table>${CR.length > 5 ? `<p class="at-n">+ ${CR.length - 5} no relatório gerencial (4.3)</p>` : ''}` : '<div class="at-vz at-ok">Nenhuma corretiva aberta no mês</div>'}</div></div>`));
  // 6 · corretivas em fotos (antes e depois)
  const FO = atpFotosMes(R).filter(x => !ATP.fora.has(x.id));
  FO.filter(x => x.t === 'C' && (x.antes || x.depois)).slice(0, 6).forEach(x => { const o = x.o || {}, h = rmeHP(o);
    L.push(sl(head('Corretiva em fotos', esc(x.tit), esc(x.sub)) + `<div class="at-fc"><div class="at-pp">${atpImg(x.antes, 'Antes')}${atpImg(x.depois, 'Depois')}</div>
      <div class="at-info"><div><small>Falha</small><p>${esc(rmeTxt(o.descricao, 200) || '—')}</p></div>${o.causaCat || o.causa ? `<div><small>Causa</small><p>${esc(rmeTxt([o.causaCat, o.causa].filter(Boolean).join(': '), 160))}</p></div>` : ''}<div><small>Serviço executado</small><p>${esc(rmeTxt(o.servicos, 220) || '—')}</p></div>
      <div class="at-mini"><span><small>Reparo</small><b>${h != null ? nf(h, 1) + ' h' : 'em aberto'}</b></span><span><small>Execução</small><b>${esc(o.exec === 'Terceiro' ? 'Terceiro' + (o.empresa ? ' · ' + o.empresa : '') : o.exec ? 'Equipe própria' : 'não informada')}</b></span></div></div></div>`)); });
  // 7 · o que mais falhou
  const eqR = (L0, cor) => L0.slice(0, 7).map(([e, n], i) => [e, n, '', i ? '#E3A598' : cor]);
  L.push(sl(head('Falhas', 'Equipamentos com mais falhas', 'corretivas por equipamento · no mês e acumulado no ano') + `<div class="at-2 at-eq"><div><h4>No mês</h4>${atpBarsH(eqR(R.eqP, ATP_C.bad), { vazio: 'Nenhuma corretiva no mês' })}</div><div><h4>Acumulado no ano</h4>${atpBarsH(R.eqA.slice(0, 7).map(([e, n], i) => [e, n, '', i ? ATP_C.cl : ATP_C.nv]))}</div></div>
    ${R.rep.length ? `<p class="at-n"><b>Falhas repetidas no ano:</b> ${esc(R.rep.slice(0, 4).map(([v, e, n]) => vName(v) + ' · ' + e + ' (' + n + '×)').join(' · '))}</p>` : ''}`));
  // 8 · modos e causas (Crítica e Alta, 12 meses)
  const FC = falhasDados(12).filter(o => ehFalha(o) && !o.excluido && vessel(o.vessel)), top = k => rmeCont(FC.map(o => o[k] || 'Não informado')).slice(0, 6);
  L.push(sl(head('Análise de falhas', 'Modos e causas de falha', 'falhas Crítica e Alta dos últimos 12 meses · ' + FC.length + ' falha(s)') + `<div class="at-2 at-eq"><div><h4>Modo de falha</h4>${atpBarsH(top('modo').map(([k, n], i) => [k, n, '', i ? '#E3A598' : ATP_C.bad]), { vazio: 'Nenhuma falha Crítica ou Alta em 12 meses' })}</div><div><h4>Categoria da causa</h4>${atpBarsH(top('causaCat').map(([k, n], i) => [k, n, '', i ? ATP_C.cl : ATP_C.nv]), { vazio: 'Nenhuma falha Crítica ou Alta em 12 meses' })}</div></div>`));
  // 9 · ações de bloqueio
  const sit = FC.map(o => mitigSit(o).k), ef = FC.filter(o => o.status === 'encerrada'), ord = { falta: 0, atraso: 1, and: 2 };
  const aM = FC.filter(o => o.mitigSt !== 'Concluída' && ['falta', 'atraso', 'and'].includes(mitigSit(o).k)).sort((x, z) => ord[mitigSit(x).k] - ord[mitigSit(z).k]).slice(0, 5);
  L.push(sl(head('Ações de bloqueio', 'Ações de bloqueio: concluídas e pendentes', 'medidas para a falha não se repetir · ISO 9001 10.2') + `<div class="at-2"><div><h4>Ações das falhas Crítica e Alta (12 meses)</h4>${atpSeg([['Concluídas', sit.filter(k => k === 'ok').length, ATP_C.ok], ['Em andamento', sit.filter(k => k === 'and').length, '#B07A10'], ['Atrasadas', sit.filter(k => k === 'atraso').length, ATP_C.bad], ['Sem medida', sit.filter(k => k === 'falta').length, '#8A98A8']])}
    <h4 style="margin-top:22px">Eficácia verificada</h4>${atpSeg([['Eficazes', ef.filter(o => o.efRes === 'Eficaz').length, ATP_C.ok], ['Não eficazes', ef.filter(o => o.efRes === 'Não eficaz').length, ATP_C.bad], ['Aguardando verificação', ef.filter(o => !o.efRes).length, ATP_C.cl]])}</div>
    <div><h4>Ações pendentes</h4>${aM.length ? `<table class="at-t"><tr><th>Falha</th><th>Medida</th><th>Responsável</th><th>Prazo</th></tr>${aM.map(o => { const s = mitigSit(o); return `<tr><td><b>${esc(vName(o.vessel))}</b> · ${esc(o._comp)}</td><td>${esc(rmeTxt(o.mitig, 80) || 'sem medida definida')}</td><td>${esc(o.mitigResp || '—')}</td><td class="at-nw" style="color:${s.k === 'and' ? '#14233B' : ATP_C.bad};font-weight:700">${o.mitigPrazo ? brD(o.mitigPrazo) : s.t}</td></tr>`; }).join('')}</table>` : '<div class="at-vz at-ok">Nenhuma ação pendente</div>'}</div></div>`));
  // 10 · lubrificação
  const lv = R.lubSitu.filter(x => x[2] === 'vencida');
  L.push(sl(head('Lubrificação', 'Lubrificação: trocas de óleo', 'FR 049_B registrados no mês') + `<div class="at-2"><div><h4>Óleo usado nas trocas por mês (L) · ${R.ano}</h4>${atpCols(R.mesLab, R.lubMes, { cor: ATP_C.nv })}</div>
    <div class="at-tiles at-cl at-sm">${atpTile(p.trocas, 'trocas de óleo no mês', '', 'acumulado no ano: ' + a.trocas)}${atpTile(nf(p.litros) + ' L', 'óleo usado no mês', '', 'acumulado no ano: ' + nf(a.litros) + ' L' + (p.compL ? ' · ' + nf(p.compL) + ' L em complementos' : ''))}
    ${atpTile(p.filtros, 'trocas com filtro', '', 'no mês')}${atpTile(lv.length, 'trocas vencidas hoje', lv.length ? 'bad' : 'ok', lv.length ? lv.slice(0, 3).map(x => vName(x[0]) + ' ' + x[1]).join(' · ') : 'nenhuma')}</div></div>`));
  // 11 · diagnóstico dos MCP
  const MD = mcDiag(), cD = { bad: ATP_C.bad, at: '#B07A10', sem: ATP_C.gr, ok: ATP_C.ok }, MDl = MD.filter(x => x.rc !== 'ok').slice(0, 10), MDv = MDl.length ? MDl : MD.slice(0, 10);
  L.push(sl(head('Motores', 'Diagnóstico de condição dos MCP', 'compressão, consumo de óleo, laudo de laboratório e calibração') + `<div class="at-k">${[['Programar overhaul', 'bad'], ['Monitorar', 'at'], ['Completar a base', 'sem'], ['Manter', 'ok']].map(([t, k]) => `<span>${atpDot(cD[k])}${t} <b>${MD.filter(x => x.rc === k).length}</b></span>`).join('')}</div>
    <table class="at-t at-q"><tr><th>Motor</th><th>Compressão</th><th>Consumo de óleo</th><th>Último laudo</th><th>Calibração</th><th>Recomendação</th></tr>${MDv.map(x => `<tr><td class="at-nw"><b>${esc(x.v.nome)}</b>${mcpPos(x.v).length > 1 ? ' · ' + esc(x.pos) : ''}</td>
      <td class="at-nw">${atpDot(cD[x.cs])}${x.c.u ? fMPa(x.c.u.min) + ' MPa · cil. ' + x.c.u.cil : 'sem ensaio'}</td><td class="at-nw">${atpDot(cD[x.os])}${x.co.taxa != null ? nf(x.co.taxa, 2) + ' L/100 h' : '—'}</td>
      <td>${atpDot(cD[x.lst])}${x.ul ? brD(x.ul.date) + (x.ls && x.ls.alertas && x.ls.alertas.length ? ' · ' + esc(x.ls.alertas.slice(0, 2).map(z => z.nome.split(' (')[0]).join(', ')) : ' · normal') : 'sem laudo'}</td>
      <td class="at-nw">${atpDot(cD[x.cst])}${x.clv.length ? 'vencida' : x.cst === 'sem' ? 'sem registro' : 'em dia'}</td><td style="color:${cD[x.rc] === ATP_C.gr ? ATP_C.mut : cD[x.rc]};font-weight:700">${esc(x.rec)}</td></tr>`).join('')}</table>${MD.length > MDv.length ? `<p class="at-n">Mais ${MD.length - MDv.length} motor(es) sem alerta nos sinais: manter.</p>` : ''}`));
  // 12 · compressão e calibração: quem está mais perto do overhaul e da calibração
  const CM = R.cmp.filter(x => x[2] != null).map(x => ({ x, h: x[2] < 1.27 ? 0 : x[5] < 0 ? Infinity : x[5] })).sort((u, w) => u.h - w.h).slice(0, 8);
  const cmF = CM.filter(u => isFinite(u.h)).map(u => u.h), cmMx = Math.max(1000, ...cmF);
  const nmP = (vid, pos) => { const v = vessel(vid); return vName(vid) + (v && mcpPos(v).length > 1 ? ' · ' + pos : ''); };
  const CA = R.cal.filter(x => x[3] != null).sort((u, w) => u[3] - w[3]).slice(0, 8), caMx = Math.max(1000, ...CA.map(x => x[3]));
  L.push(sl(head('Condição', 'Compressão e calibração dos MCP', 'motores mais perto do limite de compressão e da próxima calibração') + `<div class="at-2 at-eq"><div><h4>Horas até o limite de compressão (1,27 MPa)</h4>${atpBarsH(CM.map(({ x, h }) => [nmP(x[0], x[1]), isFinite(h) ? h : null, 'pior cilindro ' + fMPa(x[2]) + ' MPa', x[2] < 1.27 ? ATP_C.bad : x[6] === 'ok' ? ATP_C.nv : '#B07A10', x[2] < 1.27 ? 'abaixo' : isFinite(h) ? nf(h) + ' h' : 'estável']), { mx: cmMx, vazio: 'Sem ensaio de compressão' })}</div>
    <div><h4>Horas até a próxima calibração</h4>${atpBarsH(CA.map(x => [nmP(x[0], x[1]), Math.max(0, x[3]), x[2] === '1.1.11' ? 'folga de válvulas' : 'bicos injetores', x[3] < 0 ? ATP_C.bad : x[4] === 'ok' ? ATP_C.nv : '#B07A10', x[3] < 0 ? 'vencida ' + nf(-x[3]) + ' h' : nf(x[3]) + ' h']), { mx: caMx, vazio: 'Sem calibração registrada' })}</div></div>`));
  // 13 · preventivas em fotos (4 por slide)
  const PF = FO.filter(x => x.t !== 'C' && (x.antes || x.depois)).sort((u, w) => (!!w.antes + !!w.depois) - (!!u.antes + !!u.depois)).slice(0, 12).sort((u, w) => u.date < w.date ? -1 : 1);
  for (let i = 0; i < PF.length; i += 4) L.push(sl(head('Preventiva em fotos', 'Registro fotográfico dos serviços' + (i ? ' (continuação)' : ''), 'preventivas e trocas de óleo · antes e depois') + `<div class="at-pg">${PF.slice(i, i + 4).map(x => `<div class="at-pc"><div class="at-pp at-sm">${atpImg(x.antes, 'Antes')}${atpImg(x.depois, 'Depois')}</div><b>${esc(x.tit)}</b><small>${esc(x.sub)}</small></div>`).join('')}</div>`));
  // 14 · destaques (fotos adicionadas neste aparelho)
  const EX = ATP.mesX === ATP.mes ? ATP.extra : [];
  for (let i = 0; i < EX.length; i += 3) L.push(sl(head('Registro do mês', 'Destaques' + (i ? ' (continuação)' : ''), 'docagem, serviços de terceiros, equipe e o que mais marcou o mês') + `<div class="at-ex">${EX.slice(i, i + 3).map(x => `<figure><img src="${x.src}" alt=""><figcaption>${esc(x.leg || '')}</figcaption></figure>`).join('')}</div>`));
  // 15 · situação da frota hoje
  const SF = sfDados(), sN = ['Liberado', 'Com restrição', 'Bloqueado', 'Interditado'], sC = [ATP_C.ok, '#B07A10', ATP_C.bad, ATP_C.bad], cn = (n, c) => n ? `<b style="color:${c}">${n}</b>` : '<span style="color:#A0AEC0">0</span>';
  L.push(sl(head('Frota', 'Situação da frota', 'na data de hoje, ' + brD(isoD(hoje())) + ' · mesma conta da Situação da frota') + `<div class="at-k">${sN.slice(0, 3).map((t, i) => `<span>${atpDot(sC[i])}${t} <b>${SF.filter(x => i === 2 ? x.sit >= 2 : x.sit === i).length}</b></span>`).join('')}<span>Em viagem <b>${SF.filter(x => x.loc === 'em viagem').length}</b></span></div>
    <table class="at-t at-q"><tr><th>Empurrador</th><th>Situação</th><th>Local</th><th>Vencidos</th><th>Vencem no mês</th><th>Críticos NP 6.3 vencidos</th><th>Corretivas abertas</th><th>Compressão</th></tr>${SF.slice(0, 14).map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td class="at-nw" style="color:${sC[x.sit]};font-weight:700">${atpDot(sC[x.sit])}${sN[x.sit]}</td><td>${esc(x.loc || 'não informado')}</td><td>${cn(x.venc, ATP_C.bad)}</td><td>${cn(x.mes, '#B07A10')}</td><td>${cn(x.crit, ATP_C.bad)}</td><td>${cn(x.cor, '#B07A10')}</td><td>${x.cmp ? atpDot(x.cmp === 'venc' ? ATP_C.bad : x.cmp === 'mes' ? '#B07A10' : ATP_C.ok) + (x.cmp === 'venc' ? 'abaixo do limite' : x.cmp === 'mes' ? 'atenção' : 'normal') : '<span style="color:#A0AEC0">sem ensaio</span>'}</td></tr>`).join('')}</table>`));
  // 16 · plano de ação (4.2) e comentário do Supervisor (4.3)
  const AC = pcmAcoesNoPeriodo(P.ini, P.fim).filter(x => x[3] !== 'concluida'), com = S.recs.get('snap-rmecom-' + P.ini + '_' + P.fim), txt = com && !com.excluido ? (com.txt || '').trim() : '';
  let it = AC.slice(0, 6).map(x => [x[0], 'Responsável: ' + (x[1] || '—') + ' · prazo ' + (x[2] ? brD(x[2]) : '—') + (x[3] === 'atrasada' ? ' · atrasada' : ''), x[3] === 'atrasada']);
  if (!it.length) { const bq = SF.filter(x => x.sit >= 2), ov = MD.filter(x => x.rc === 'bad');
    if (bq.length) it.push(['Liberar a saída', bq.map(x => x.v.nome).join(', ') + ': item crítico vencido ou falha sem OM', 1]);
    if (nV) it.push(['Programar os serviços vencidos', nV + ' serviço(s) em ' + R.venc.length + ' empurrador(es), no porto antes da próxima saída']);
    if (ov.length) it.push(['Avaliar overhaul', ov.map(x => x.v.nome + (mcpPos(x.v).length > 1 ? ' ' + x.pos : '')).join(', ')]);
    if (R.doca.length) it.push(['Docagem', R.doca.slice(0, 4).map(d => vName(d[0]) + ' até ' + brD(d[1])).join(', ')]);
    if (lv.length) it.push(['Trocas de óleo vencidas', lv.slice(0, 4).map(x => vName(x[0]) + ' ' + x[1]).join(', ')]);
    if (aM.length) it.push(['Fechar ações de bloqueio', aM.length + ' medida(s) sem definição, atrasada(s) ou em andamento']); }
  L.push(sl(head('Plano', 'Plano de ação', AC.length ? 'ações em andamento no 4.2 Plano de ação' : 'prioridades para o próximo mês (nenhuma ação aberta no 4.2)') + `<div class="at-ac">${it.slice(0, 6).map((x, i) => `<div><b${x[2] ? ` style="background:${ATP_C.bad}"` : ''}>${i + 1}</b><div><h4>${esc(rmeTxt(x[0], 90))}</h4><p>${esc(x[1])}</p></div></div>`).join('') || '<div class="at-vz at-ok">Nenhuma pendência relevante</div>'}</div>${txt ? `<p class="at-obs"><b>Comentário do Supervisor:</b> ${esc(rmeTxt(txt, 420))}</p>` : ''}`));
  // 17 · contracapa
  L.push(`<div class="at-sl at-cv at-fim" style="background-image:linear-gradient(0deg,rgba(11,31,58,.9),rgba(11,31,58,.55)),url(img/apres-fim.jpg)"><div class="at-cvl at-cc"><div class="at-lg"><img src="${LOGOS.nav}" alt=""><i></i><img src="${LOGOS.vda}" alt=""></div><h1>Compromisso que não para</h1><p>Manutenção dos empurradores fluviais · ISO 9001 · ISO 14001 · ISO 45001</p></div></div>`);
  const N = L.length; return L.map((s, i) => s.replace('@P', (i + 1) + ' / ' + N));
}
// ---------- tela ----------
function vEnxApres() {
  const P = atpPer(), h = hoje(), op = []; for (let i = 0; i < 12; i++) { const x = new Date(h.getFullYear(), h.getMonth() - i, 1); op.push([isoD(x).slice(0, 7), ATP_MES[x.getMonth()] + ' ' + x.getFullYear()]); }
  return enxCab('4.4 Apresentação técnica mensal', 'Slides da reunião mensal com os mesmos números do 4.3 Relatório gerencial · clique num slide para apresentar em tela cheia',
    `<label class="f">Mês<select id="atpM">${op.map(([k, l]) => `<option value="${k}"${ATP.mes === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label><label class="f">Apresentado por<input id="atpA" value="${esc(atpAut())}"></label><button class="mbtn" data-atpshow>▶ Apresentar</button><button class="mbtn pri" data-atppdf>⬇ Baixar PDF</button>`)
   + `<div class="card"><div class="row"><h2>Fotos da apresentação · ${esc(P.nome)}</h2><span class="sp"></span><label class="mbtn sm" style="cursor:pointer">＋ Adicionar fotos de destaque<input type="file" id="atpX" accept="image/*" multiple hidden></label></div>
     <p class="note">Entram as fotos de antes e depois das OMs corretivas, das OMs preventivas e dos FR 049_B do mês (as do Drive são baixadas com sinal). Desmarque o que não quiser mostrar. “Adicionar fotos de destaque” é para docagem, equipe, serviços de terceiros e outros destaques: ficam só neste aparelho.</p><div id="atpSel" class="at-sel"></div></div>
   <div class="card"><h2>Slides <span class="note" id="atpN"></span></h2><div class="at-grid" id="atpGrid"></div></div></div></div>`;
}
function atpSel(R) {
  const el = $('#atpSel'); if (!el) return; const F = atpFotosMes(R), th = k => k && ATP.FT[k] ? `<img src="${ATP.FT[k]}" alt="">` : '<i></i>';
  el.innerHTML = (F.length ? F.map(x => `<label class="at-it"><input type="checkbox" data-atpf="${esc(x.id)}"${ATP.fora.has(x.id) ? '' : ' checked'}><span class="at-thm">${th(x.antes)}${th(x.depois)}</span><span><b>${esc(x.tit)}</b><small>${esc(x.sub)} · ${x.n} foto(s)</small></span></label>`).join('') : '<p class="note">Nenhuma foto registrada no mês.</p>')
    + (ATP.extra.length ? `<div class="at-exs">${ATP.extra.map((x, i) => `<div><img src="${x.src}" alt=""><input data-atpleg="${i}" value="${esc(x.leg || '')}" placeholder="Legenda"><button class="mbtn sm" data-atprm="${i}" aria-label="Remover foto">✕</button></div>`).join('')}</div>` : '');
}
function atpShow(i0) {
  const P = atpPer(), L = atpSlides(atpR(P), P); ATP.i = Math.max(0, Math.min(L.length - 1, i0 || 0));
  const ov = document.createElement('div'); ov.className = 'at-ov'; document.body.appendChild(ov);
  const draw = () => { const k = Math.min(innerWidth / 1280, innerHeight / 720); ov.innerHTML = `<div class="at-st" style="width:${1280 * k}px;height:${720 * k}px"><div style="transform:scale(${k});transform-origin:0 0">${L[ATP.i]}</div></div><div class="at-nav"><button data-n="-1" aria-label="Anterior">‹</button><span>${ATP.i + 1} / ${L.length}</span><button data-n="1" aria-label="Próximo">›</button><button data-n="x" aria-label="Sair">✕</button></div>`; };
  const sair = () => { document.removeEventListener('keydown', key); removeEventListener('resize', draw); ov.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); };
  const ir = d => { ATP.i = Math.max(0, Math.min(L.length - 1, ATP.i + d)); draw(); };
  const key = e => { if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ir(1); } if (['ArrowLeft', 'PageUp'].includes(e.key)) ir(-1); if (e.key === 'Escape') sair(); };
  ov.onclick = e => { const b = e.target.closest('[data-n]'); if (b) { if (b.dataset.n === 'x') sair(); else ir(+b.dataset.n); return; } ir(e.clientX > innerWidth / 3 ? 1 : -1); };
  document.addEventListener('keydown', key); addEventListener('resize', draw); draw();
  if (ov.requestFullscreen) ov.requestFullscreen().catch(() => { });
}
async function atpPdf() {
  try { await carregarLibsPdf(); } catch (e) { return toast('Bibliotecas de PDF não carregaram.'); }
  toast('Gerando a apresentação em PDF…', 2500);
  const P = atpPer(), L = atpSlides(atpR(P), P), { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'px', format: [1280, 720], orientation: 'landscape', compress: true });
  const W = document.createElement('div'); W.style.cssText = 'position:fixed;left:-20000px;top:0;width:1280px'; document.body.appendChild(W);
  try {
    for (let i = 0; i < L.length; i++) {
      W.innerHTML = L[i]; const el = W.firstElementChild;
      await Promise.all([...el.querySelectorAll('img')].map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; })));
      const c = await html2canvas(el, { scale: 1.5, backgroundColor: '#ffffff', logging: false, width: 1280, height: 720, windowWidth: 1280 });
      if (i) pdf.addPage([1280, 720], 'landscape'); pdf.addImage(c.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, 1280, 720);
    }
    pdf.save('Apresentacao_Manutencao_' + ATP.mes + '.pdf');
  } catch (e) { toast('Não foi possível gerar o PDF: ' + e.message); }
  finally { W.remove(); }
}
VX.enxapres = vEnxApres;
AFTER.enxapres = () => { const m = $('#main');
  const up = () => { const P = atpPer(), R = atpR(P); atpSel(R); const g = $('#atpGrid'); if (!g) return; const L = atpSlides(R, P), cw = g.clientWidth || 900, w = Math.floor(Math.min(520, (cw - 16) / (cw > 760 ? 2 : 1))), k = w / 1280;
    g.innerHTML = L.map((s, i) => `<div class="at-th" data-atp="${i}" style="width:${w}px;height:${Math.round(720 * k)}px"><div style="transform:scale(${k});transform-origin:0 0">${s}</div></div>`).join(''); const n = $('#atpN'); if (n) n.textContent = '· ' + L.length; };
  const carrega = async () => { const mes = ATP.mes; if (ATP.mesX !== mes) { ATP.extra = (await kvGet('apExtra-' + mes)) || []; ATP.mesX = mes; }
    if (ATP.ftMes !== mes) { ATP.FT = await rmeFotos(atpR(atpPer())); ATP.ftMes = mes; } if (VIEW === 'enxapres' && ATP.mes === mes) up(); };
  const salvaX = () => kvSet('apExtra-' + ATP.mes, ATP.extra);
  m.onchange = async e => { const t = e.target;
    if (t.id === 'atpM') { ATP.mes = t.value; ATP.fora.clear(); return render(); }
    if (t.dataset.atpf) { t.checked ? ATP.fora.delete(t.dataset.atpf) : ATP.fora.add(t.dataset.atpf); return up(); }
    if (t.id === 'atpX') { for (const f of t.files) ATP.extra.push({ src: await comprimir(f), leg: '' }); t.value = ''; await salvaX(); return up(); }
    if (t.dataset.atpleg) { ATP.extra[+t.dataset.atpleg].leg = t.value; await salvaX(); return up(); } };
  m.oninput = e => { if (e.target.id === 'atpA') { try { localStorage.setItem('smf_apres_aut', e.target.value); } catch (x) { } clearTimeout(m._atp); m._atp = setTimeout(up, 500); } };
  m.onclick = async e => { const r = e.target.closest('[data-atprm]'); if (r) { ATP.extra.splice(+r.dataset.atprm, 1); await salvaX(); return up(); }
    const t = e.target.closest('[data-atp]'); if (t) return atpShow(+t.dataset.atp);
    if (e.target.closest('[data-atpshow]')) return atpShow(0);
    if (e.target.closest('[data-atppdf]')) return atpPdf(); };
  up(); carrega(); };
Object.assign(NP_TAG, { enxapres: '9' });
ENX_OK.push('enxapres'); PCM_ETAPAS[3][2].push('enxapres');
PCM_MENU.find(g => /^4 /.test(g[0]))[1].push(['enxapres', '4.4 Apresentação técnica', 'apres']);
ICO.apres = '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4"/>';
{ const st = document.createElement('style'); st.textContent = `
.at-grid{display:flex;flex-wrap:wrap;gap:16px}.at-th{overflow:hidden;border-radius:8px;box-shadow:0 1px 4px rgba(16,24,40,.18);cursor:pointer;background:#fff;flex:none}.at-th:hover{outline:2px solid #1A73E8}
.at-ov{position:fixed;inset:0;z-index:6000;background:#0B1F3A;display:flex;align-items:center;justify-content:center}.at-st{overflow:hidden;background:#fff}
.at-nav{position:fixed;right:16px;bottom:14px;display:flex;gap:8px;align-items:center;color:#C9D6EA;font-size:13px;opacity:.55}.at-nav:hover{opacity:1}
.at-nav button{background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:8px;width:36px;height:32px;font-size:18px;cursor:pointer}
.at-sl{width:1280px;height:720px;background:#fff;color:#14233B;font-family:Arial,Helvetica,sans-serif;position:relative;padding:40px 56px 60px;box-sizing:border-box;display:flex;flex-direction:column;gap:20px;overflow:hidden;text-align:left}
.at-sl *{box-sizing:border-box}.at-sl h4{margin:0 0 10px;font-size:17px;color:#5B6B80;font-weight:600}
.at-h{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #16244A;padding-bottom:14px}
.at-h small{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#1A73E8;font-weight:700}.at-h h2{margin:4px 0 0;font-size:36px;line-height:1.1;color:#0B1F3A;font-weight:700}
.at-h p{margin:6px 0 0;font-size:17px;color:#5B6B80}.at-h img{height:46px}
.at-f{position:absolute;left:56px;right:56px;bottom:20px;display:flex;justify-content:space-between;font-size:13px;color:#8A98A8;border-top:1px solid #E4EAF3;padding-top:8px}
.at-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;flex:1;min-height:0}.at-tiles.at-cl{grid-template-columns:1fr;gap:12px;flex:none}
.at-tile{background:#F4F7FA;border-radius:12px;padding:18px 24px;display:flex;flex-direction:column;justify-content:center;border-left:6px solid #9DB4CC}
.at-tile b{font-size:46px;line-height:1.05;color:#0B1F3A;font-variant-numeric:tabular-nums}.at-tiles.at-cl .at-tile b{font-size:36px}
.at-tile span{font-size:18px;color:#41536A;margin-top:4px}.at-tile small{font-size:14px;color:#8A98A8;margin-top:6px}
.at-tiles.at-sm .at-tile{padding:10px 20px}.at-tiles.at-sm .at-tile b{font-size:30px}.at-tiles.at-sm .at-tile span{font-size:16px;margin-top:2px}.at-tiles.at-sm .at-tile small{font-size:13px;margin-top:3px}
.at-tile.at-ok{border-left-color:#137333}.at-tile.at-ok b{color:#137333}.at-tile.at-bad{border-left-color:#C5221F}.at-tile.at-bad b{color:#C5221F}.at-tile.at-warn{border-left-color:#B07A10}.at-tile.at-warn b{color:#B06000}
.at-2{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;flex:1;min-height:0}.at-2.at-eq{grid-template-columns:1fr 1fr}
.at-hb{display:flex;flex-direction:column;gap:11px}.at-hb>div{display:grid;grid-template-columns:200px 1fr 92px;gap:12px;align-items:center;font-size:15.5px}
.at-hb span{line-height:1.2}.at-hb em{display:block;font-style:normal;font-size:12.5px;color:#8A98A8}
.at-hb i{display:block;height:20px;background:#F1F4F8;border-radius:5px;overflow:hidden}.at-hb i b{display:block;height:100%;border-radius:5px}.at-hb strong{font-size:17px;text-align:right;white-space:nowrap}
.at-seg{display:flex;height:42px;border-radius:9px;overflow:hidden;gap:2px}.at-seg b{display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;min-width:34px}
.at-leg{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:15px;color:#41536A}.at-leg i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px}
.at-t{width:100%;border-collapse:collapse;font-size:15px}.at-t th{text-align:left;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#8A98A8;padding:6px 8px;border-bottom:2px solid #E4EAF3;font-weight:700;background:none}
.at-t td{padding:7px 8px;border-bottom:1px solid #EEF2F7;vertical-align:top;background:none}.at-t.at-q td,.at-t.at-q th{padding:5px 8px;font-size:14px}.at-t .at-nw{white-space:nowrap}
.at-dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:7px;vertical-align:0}
.at-k{display:flex;gap:28px;font-size:16px;color:#41536A}.at-k b{color:#0B1F3A;font-size:20px;margin-left:4px}
.at-vz{background:#F4F7FA;border-radius:12px;padding:30px;text-align:center;color:#8A98A8;font-size:17px}.at-vz.at-ok{color:#137333;background:#E6F4EA}
.at-n{font-size:14px;color:#5B6B80;margin:4px 0 0}
.at-ac{display:grid;grid-template-columns:1fr 1fr;gap:18px 36px}.at-ac>div{display:flex;gap:14px;align-items:flex-start}
.at-ac>div>b{width:38px;height:38px;border-radius:50%;background:#16244A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none}
.at-ac h4{margin:2px 0 3px;font-size:19px;color:#0B1F3A}.at-ac p{margin:0;font-size:15.5px;color:#41536A}
.at-obs{background:#F4F7FA;border-left:5px solid #1A73E8;padding:12px 16px;font-size:16px;margin:auto 0 0;line-height:1.4}
.at-cv{background-color:#0B1F3A;background-size:cover;background-position:center;color:#fff;padding:70px 80px}
.at-cvl{display:flex;flex-direction:column;justify-content:center;height:100%}.at-cvl.at-cc{align-items:center;text-align:center}
.at-lg{display:flex;align-items:center;gap:18px;background:#fff;border-radius:14px;padding:12px 20px;align-self:flex-start}.at-cvl.at-cc .at-lg{align-self:center}
.at-lg img{height:58px}.at-lg i{width:1px;height:46px;background:#D5DEEB}
.at-cv small{margin-top:60px;font-size:18px;letter-spacing:.16em;text-transform:uppercase;color:#8FB3E0;font-weight:700}
.at-cv h1{font-size:62px;line-height:1.05;margin:14px 0 0;color:#fff}.at-cv.at-fim h1{font-size:46px;margin-top:40px}
.at-cv h3{font-size:30px;margin:18px 0 0;color:#C9D6EA;font-weight:500}.at-cv p{font-size:18px;color:#8FA6C7;margin-top:auto}.at-cv.at-fim p{margin-top:18px}
.at-ph{position:relative;border-radius:12px;overflow:hidden;background:#E4EAF3;flex:1;min-width:0}.at-ph img{width:100%;height:100%;object-fit:cover;display:block}
.at-ph span{position:absolute;left:12px;top:12px;background:#0B1F3A;color:#fff;font-size:14px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:.04em;text-transform:uppercase}
.at-ph.at-pv{display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #C9D3DF;background:#F4F7FA}
.at-ph.at-pv em{font-style:normal;font-weight:700;font-size:18px;color:#5B6B80;text-transform:uppercase;letter-spacing:.06em}.at-ph.at-pv small{font-size:14px;color:#8A98A8;margin-top:4px}
.at-pp{display:flex;gap:14px;height:100%;min-height:0}
.at-fc{display:grid;grid-template-columns:2.1fr 1fr;gap:26px;flex:1;min-height:0}.at-info{display:flex;flex-direction:column;gap:14px}
.at-info small{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8A98A8;font-weight:700}.at-info p{margin:4px 0 0;font-size:17px;line-height:1.35;color:#14233B}
.at-mini{display:flex;gap:12px;margin-top:auto}.at-mini span{flex:1;background:#F4F7FA;border-radius:10px;padding:12px 14px}.at-mini b{display:block;font-size:22px;color:#0B1F3A;margin-top:2px}
.at-pg{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px 26px;flex:1;min-height:0}
.at-pc{display:flex;flex-direction:column;min-height:0}.at-pc .at-pp{flex:1;min-height:0;gap:8px}.at-pc .at-ph span{font-size:11px;padding:2px 7px;left:8px;top:8px}
.at-pc b{font-size:15px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.at-pc small{font-size:13px;color:#8A98A8}
.at-ex{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;flex:1;min-height:0}.at-ex figure{margin:0;display:flex;flex-direction:column;min-height:0}
.at-ex img{width:100%;flex:1;min-height:0;object-fit:cover;border-radius:12px}.at-ex figcaption{font-size:16px;margin-top:10px;color:#14233B}
.at-sel{display:flex;flex-direction:column;gap:4px;max-height:300px;overflow:auto}
.at-it{display:flex;gap:12px;align-items:center;padding:5px 6px;border-radius:8px;cursor:pointer}.at-it:hover{background:rgba(26,115,232,.06)}
.at-it input{width:auto}.at-it b{display:block;font-size:13.5px}.at-it small{font-size:12px;color:var(--mut)}
.at-thm{display:flex;gap:3px;flex:none}.at-thm img,.at-thm i{width:54px;height:40px;object-fit:cover;border-radius:5px;background:#E4EAF3;display:block}
.at-exs{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}.at-exs>div{display:flex;flex-direction:column;gap:4px;width:170px;position:relative}
.at-exs img{width:170px;height:110px;object-fit:cover;border-radius:8px}.at-exs .mbtn{position:absolute;right:4px;top:4px}`;
  document.head.appendChild(st); }
