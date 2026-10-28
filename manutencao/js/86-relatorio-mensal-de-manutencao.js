/* =====================================================================
   RELATÓRIO MENSAL DE MANUTENÇÃO DA FROTA (SMF 3.5, 27/10/2026; pedido do Supervisor:
   “capa, índice, contracapa, um relatório profissional”; “sempre o acumulado do ano e o que foi feito no mês”).
   Intervalo De/Até; todo número sai no período e no acumulado do ano (1º/jan do ano da data final até a data final).
   Só o que o SMF enxuto registra: serviços do Anexo I com nº da OM (base), corretivas (om tipo C), horímetros (hor),
   FR 049_B e complementos (lub), compressão (comp) e docagem. Motor sem leitura no período = 0 h com aviso.
   Emitir = cópia congelada em snap (tipo 'relmes'; os dados vão em partes 'relmes-p' para caber na célula da planilha).
   Impressão: folhas A4 montadas na janela (paginação própria), para o índice ter o nº certo de cada seção.
   ===================================================================== */
'use strict';
const RME = { ini: isoD(new Date(hoje().getFullYear(), hoje().getMonth(), 1)), fim: isoD(hoje()), anexo: false };
const rmeDia = (s, n) => { const d = pD(s); d.setDate(d.getDate() + n); return isoD(d); };
const rmeMot = v => posicoes(v).filter(p => p !== 'UN');
const rmePlanoK = () => 'smf_rme_' + RME.ini + '_' + RME.fim;
function rmePlano() { try { return JSON.parse(localStorage.getItem(rmePlanoK()) || 'null') || { conc: '', acoes: [] }; } catch (e) { return { conc: '', acoes: [] }; } }
function rmePlanoSalvar(p) { try { localStorage.setItem(rmePlanoK(), JSON.stringify(p)); } catch (e) { } }
// horas operadas entre ini e fim pelas leituras: última leitura do intervalo − última antes dele (sem leitura antes: a primeira do intervalo)
function rmeHorIdx() {
  const I = {}; recs('hor').forEach(r => { if (r.est || r.excluido || r.h == null) return; (I[r.vessel + '|' + r.pos] = I[r.vessel + '|' + r.pos] || []).push(r); });
  Object.values(I).forEach(L => L.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.h - b.h)); return I;
}
// soma leitura a leitura: só conta o que subiu e coube no tempo (horas ≤ dias × 24); leitura que desce ou salta demais (horímetro trocado,
// registro antigo fora de ordem) não soma e é marcada; a leitura “última − primeira” dava 0 h ou o horímetro inteiro com um registro desses
function rmeHoras(I, vid, pos, ini, fim) {
  const L = I[vid + '|' + pos] || []; let ant = null, h = 0, n = 0, inc = false, ult = null;
  L.forEach(r => { if (r.date < ini) { ant = r; return; } if (r.date > fim) return; ult = r; n++;
    if (ant) { const d = r.h - ant.h, lim = Math.max(1, (pD(r.date) - pD(ant.date)) / 864e5) * 24 + 1; if (d >= 0 && d <= lim) h += d; else inc = true; }
    ant = r; });
  if (!n) return { h: 0, sem: true, tot: ant ? ant.h : null };
  return { h: Math.round(h * 10) / 10, parcial: !L.some(r => r.date < ini), inc, tot: ult.h };
}
// aderência (mesma conta do Cronograma) nos meses que o intervalo cobre
let RME_PRM = { n: -1, m: {} };
function rmePR(v, y) {
  if (RME_PRM.n !== S.recs.__v) RME_PRM = { n: S.recs.__v, m: {} }; const k = v.id + '|' + y;
  return RME_PRM.m[k] || (RME_PRM.m[k] = prResumo(v, y, hoje().getFullYear() === y ? hoje().getMonth() : y < hoje().getFullYear() ? 12 : -1, [...Array(12).keys()]));
}
function rmeAd(V, ini, fim) {
  const T = { prev: 0, ok: 0, lt: 0, ms: 0 }, Y = {};
  for (let d = new Date(pD(ini).getFullYear(), pD(ini).getMonth(), 1); isoD(d) <= fim; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) (Y[d.getFullYear()] = Y[d.getFullYear()] || []).push(d.getMonth());
  Object.entries(Y).forEach(([y, M]) => { y = +y; const hm = hoje().getFullYear() === y ? hoje().getMonth() : y < hoje().getFullYear() ? 12 : -1;
    V.forEach(v => { const r = rmePR(v, y); M.forEach(i => { T.prev += r.P[i]; if (i <= hm) { T.ok += r.Ok[i]; T.lt += r.Lt[i]; T.ms += r.Ms[i]; } }); }); });
  const den = T.ok + T.lt + T.ms; T.ad = den ? Math.round(T.ok / den * 100) : null; return T;
}
const rmeHP = o => o.abertura && o.liberacao ? Math.max(0, (new Date(o.liberacao) - new Date(o.abertura)) / 36e5) : null;
const rmeCorr = (ini, fim) => oms().filter(o => o.tipo === 'C' && !o.excluido && vessel(o.vessel) && String(o.abertura || '').slice(0, 10) >= ini && String(o.abertura || '').slice(0, 10) <= fim).sort((a, b) => a.abertura < b.abertura ? -1 : 1);
const rmeTrocas = (ini, fim) => recs('lub').filter(r => r.tipo === 'fr049' && !r.excluido && vessel(r.vessel) && r.date >= ini && r.date <= fim);
// números de um intervalo (período, ano e período anterior usam a mesma conta)
function rmeNums(V, I, ini, fim) {
  const B = recs('base').filter(r => !r.excluido && !r.bal && r.date >= ini && r.date <= fim && vessel(r.vessel) && A1M[r.item]), F = B.filter(r => !r.nf);
  const C = rmeCorr(ini, fim), lib = C.filter(o => rmeHP(o) != null), hPar = lib.reduce((a, o) => a + rmeHP(o), 0);
  const t0 = +pD(ini) - 12 * 36e5, t1 = +pD(fim) + 12 * 36e5, tot = V.length * (t1 - t0) / 36e5;
  const parado = oms().filter(o => o.tipo === 'C' && !o.excluido && vessel(o.vessel) && o.abertura).reduce((a, o) => { const x = Math.max(t0, +new Date(o.abertura)), y = Math.min(t1, o.liberacao ? +new Date(o.liberacao) : Date.now()); return a + Math.max(0, (y - x) / 36e5); }, 0);
  const T = rmeTrocas(ini, fim), rows = T.flatMap(r => (r.eq || []).filter(q => q.status === 'T'));
  const comp = recs('lub').filter(r => r.tipo === 'comp' && !r.excluido && vessel(r.vessel) && r.date >= ini && r.date <= fim);
  let hMcp = 0, sem = 0; V.forEach(v => rmeMot(v).forEach(p => { const h = rmeHoras(I, v.id, p, ini, fim); if (isMcp(p)) hMcp += h.h; if (h.sem) sem++; }));
  return { serv: F.length, oms: new Set(F.map(r => r.vessel + '|' + (r.om || ''))).size, nf: B.length - F.length, ad: rmeAd(V, ini, fim), cor: C.length, hPar, mttr: lib.length ? hPar / lib.length : null,
    disp: tot > 0 ? Math.max(0, (tot - parado) / tot * 100) : null, trocas: rows.length, litros: rows.reduce((a, q) => a + litros(q.qtd), 0), filtros: rows.filter(q => (q.filters || []).length).length,
    compL: comp.reduce((a, r) => a + litros(r.L), 0), hMcp, sem, ensaios: recs('comp').filter(r => !r.excluido && vessel(r.vessel) && r.date >= ini && r.date <= fim).length };
}
const rmeTxt = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const rmeEqN = s => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s ? s[0].toUpperCase() + s.slice(1) : 'Não informado'; };
const rmeCont = L => { const C = {}; L.forEach(k => { C[k] = (C[k] || 0) + 1; }); return Object.entries(C).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); };
// tudo o que o relatório mostra, em forma compacta (o emitido guarda isto)
function rmeDados(ini, fim) {
  const V = S.cfg.frota.filter(v => !foraOp(v)), I = rmeHorIdx(), y = +fim.slice(0, 4), iniA = y + '-01-01', mf = +fim.slice(5, 7) - 1;
  const dias = Math.round((pD(fim) - pD(ini)) / 864e5) + 1, iniP = rmeDia(ini, -dias), fimP = rmeDia(ini, -1);
  const N = { per: rmeNums(V, I, ini, fim), ano: rmeNums(V, I, iniA, fim), ant: rmeNums(V, I, iniP, fimP) };
  const meses = [...Array(mf + 1).keys()].map(m => [isoD(new Date(y, m, 1)), isoD(new Date(Math.min(+new Date(y, m + 1, 0), +pD(fim))))]);
  // 2 · operação: horas por motor (período, ano, horímetro total) e horas de MCP por mês
  const hor = V.map(v => ({ v: v.id, M: rmeMot(v).map(p => { const a = rmeHoras(I, v.id, p, ini, fim), b = rmeHoras(I, v.id, p, iniA, fim); return [p, a.h, b.h, a.tot, a.sem ? 1 : a.inc || b.inc ? 3 : a.parcial ? 2 : 0]; }),
    mes: meses.map(([a, b]) => Math.round(mcpPos(v).reduce((s, p) => s + rmeHoras(I, v.id, p, a, b).h, 0))) }));
  // 3 · preventiva
  const B = recs('base').filter(r => !r.excluido && !r.bal && r.date >= iniA && r.date <= fim && vessel(r.vessel) && A1M[r.item]), noP = r => r.date >= ini;
  const feitos = B.filter(r => !r.nf && noP(r)).sort((a, b) => a.date < b.date ? -1 : 1).map(r => [r.date, r.vessel, r.pos, r.item, r.om || '', r.quem || r.by || '']);
  const nfs = B.filter(r => r.nf && noP(r)).map(r => [r.date, r.vessel, r.item, r.motivo || '', r.om || '']);
  const porV = V.map(v => { const a = rmeAd([v], ini, fim), b = rmeAd([v], iniA, fim), F = B.filter(r => r.vessel === v.id && !r.nf);
    return [v.id, F.filter(noP).length, F.length, new Set(F.filter(noP).map(r => r.om || '')).size, a.ad, b.ad, B.filter(r => r.vessel === v.id && r.nf && noP(r)).length]; });
  const ads = meses.map(([a, b]) => rmeAd(V, a, b).ad);
  const venc = enxDados().map(x => [x.v.id, x.venc.length, x.venc.slice(0, 5).map(z => enxServ(z.t)).join('; ')]).filter(x => x[1]);
  // 4 · corretiva
  const CA = rmeCorr(iniA, fim), CP = CA.filter(o => String(o.abertura).slice(0, 10) >= ini);
  const cor = CP.map(o => [String(o.abertura).slice(0, 16), o.vessel, o.num || '', o.sistema || '', rmeEqN(o.equip), o.classe || '', rmeTxt(o.descricao, 220), rmeTxt(o.servicos, 260), rmeHP(o)]);
  const cls = ['Crítica', 'Alta', 'Média', 'Baixa'].map(c => [c, CP.filter(o => o.classe === c).length, CA.filter(o => o.classe === c).length]);
  const sisP = rmeCont(CP.map(o => o.sistema || 'Não informado')), sisA = rmeCont(CA.map(o => o.sistema || 'Não informado'));
  const eqP = rmeCont(CP.map(o => rmeEqN(o.equip))).slice(0, 8), eqA = rmeCont(CA.map(o => rmeEqN(o.equip))).slice(0, 8);
  const rep = rmeCont(CA.map(o => o.vessel + '|' + rmeEqN(o.equip).toLowerCase())).filter(x => x[1] > 1).map(([k, n]) => { const [vid, eq] = k.split('|'); return [vid, rmeEqN(eq), n]; });
  // 5 · lubrificação
  const TA = rmeTrocas(iniA, fim), trocas = TA.filter(r => r.date >= ini).sort((a, b) => a.date < b.date ? -1 : 1).flatMap(r => (r.eq || []).filter(q => q.status === 'T').map(q => [r.date, r.vessel, q.name || q.key, q.oil || '', litros(q.qtd), (q.filters || []).join(', '), q.hr == null ? '' : q.hr, r.om || r.num || '']));
  const lubV = V.map(v => { const f = L => L.filter(r => r.vessel === v.id).flatMap(r => (r.eq || []).filter(q => q.status === 'T')); const a = f(TA.filter(r => r.date >= ini)), b = f(TA); return [v.id, a.length, b.length, Math.round(a.reduce((s, q) => s + litros(q.qtd), 0)), Math.round(b.reduce((s, q) => s + litros(q.qtd), 0))]; });
  const lubMes = meses.map(([a, b]) => Math.round(TA.filter(r => r.date >= a && r.date <= b).flatMap(r => (r.eq || []).filter(q => q.status === 'T')).reduce((s, q) => s + litros(q.qtd), 0)));
  const lubSitu = lubDados().filter(x => x.s && !x.saida && (x.s.st === 'venc' || (x.horas != null && x.horas <= 50) || (x.dias != null && x.dias <= 15))).map(x => [x.v.id, x.e.nome, x.s.st === 'venc' ? 'vencida' : 'próxima', x.s.txt || '']);
  // 6 · condição
  const ens = recs('comp').filter(r => !r.excluido && vessel(r.vessel) && r.date >= ini && r.date <= fim && (r.vals || []).length).sort((a, b) => a.date < b.date ? -1 : 1).map(r => { const L = r.vals.map(x => parseFloat(String(x).replace(',', '.'))).filter(x => x > 0), mn = Math.min(...L), mx = Math.max(...L); return L.length ? [r.date, r.vessel, r.pos, r.h, mn, mx, Math.round((mx - mn) * 100) / 100] : null; }).filter(Boolean);   // valores gravados com vírgula (“1,62”)
  const doca = V.map(v => docaVessel(v)).filter(d => d.due && (d.st === 'venc' || d.dias <= 365)).sort((a, b) => a.due - b.due).map(d => [d.v.id, isoD(d.due), d.st, d.fonte]);
  return { ini, fim, iniA, ano: y, N, frota: V.length, hor, mesLab: meses.map(([a]) => MESES[+a.slice(5, 7) - 1]), feitos, nfs, porV, ads, venc, cor, cls, sisP, sisA, eqP, eqA, rep, trocas, lubV, lubMes, lubSitu, ens, doca, geradoEm: new Date().toLocaleString('pt-BR') };
}
// ---------- textos e peças do documento ----------
const rmeP = v => v == null ? '—' : Math.round(v) + '%';
const rmeH = (v, d) => v == null ? '—' : nf(v, d == null ? 0 : d) + ' h';
const rmeVar = (a, b, maior) => { if (a == null || b == null) return '—'; const d = a - b; if (Math.abs(d) < 0.05) return '='; const bom = maior == null ? null : maior ? d > 0 : d < 0; return `<span style="color:${bom == null ? '#3C4043' : bom ? '#188038' : '#C5221F'}">${d > 0 ? '▲' : '▼'} ${nf(Math.abs(d), Math.abs(d) < 10 && d % 1 ? 1 : 0)}</span>`; };
// gráfico do relatório no desenho do Anexo II: barras finas azul-marinho, linhas finas; acum: 'soma' (acumulado, eixo da direita) ou 'pareto' (% acumulado)
function rmeGraf(L, o) {
  o = o || {}; const E0 = 40, n = L.length, longo = L.some(x => String(x[0]).length > 6), soma = o.acum === 'soma', gw = longo ? 64 : 44, W = E0 + (o.acum === 'pareto' ? 46 : 12) + n * gw, H = longo ? 236 : soma ? 226 : 210, E = 40, D = o.acum === 'pareto' ? 46 : 12, T = 22, B = longo ? 46 : soma ? 40 : 26;
  const bw = 16, mx = o.pct ? 100 : Math.max(1, ...L.map(x => x[1] || 0)), Y = v => T + (H - T - B) * (1 - v / mx), X = i => E + i * gw + gw / 2;
  const inteiro = L.every(x => x[1] == null || Number.isInteger(x[1])), tk = o.pct ? [0, 50, 100] : inteiro && mx <= 5 ? [...Array(mx + 1).keys()] : [0, inteiro ? Math.round(mx / 2) : mx / 2, mx], NV = '#16244A', AC = '#B06000';
  let g = tk.map(t => `<line x1="${E}" x2="${W - D}" y1="${Y(t)}" y2="${Y(t)}" stroke="#E3E8EF" stroke-width=".5"/><text x="${E - 6}" y="${Y(t) + 3}" text-anchor="end" font-size="9" fill="#5F6368">${o.pct ? t + '%' : nf(t)}</text>`).join('');
  g += `<line x1="${E}" x2="${W - D}" y1="${Y(0)}" y2="${Y(0)}" stroke="#1F2A44" stroke-width=".5"/>`;
  if (o.meta != null) g += `<line x1="${E}" x2="${W - D}" y1="${Y(o.meta)}" y2="${Y(o.meta)}" stroke="${AC}" stroke-dasharray="4 3" stroke-width=".7"/><text x="${W - D}" y="${Y(o.meta) - 4}" text-anchor="end" font-size="9" fill="${AC}">referência ${o.meta}%</text>`;
  L.forEach(([lab, v], i) => { const cx = X(i), ruim = o.meta != null && v != null && v < o.meta;
    if (v) g += `<rect x="${cx - bw / 2}" y="${Y(v)}" width="${bw}" height="${Y(0) - Y(v)}" fill="${ruim ? '#C5221F' : NV}"/><text x="${cx}" y="${Y(v) - 4}" text-anchor="middle" font-size="9" fill="#202124">${o.fmt ? o.fmt(v) : nf(v)}</text>`;
    const ls = typeof rmQuebra === 'function' && longo ? rmQuebra(lab, 12).slice(0, 2) : [lab];
    g += `<text x="${cx}" y="${H - B + 13}" text-anchor="middle" font-size="9" fill="#3C4043">${ls.map((l, j) => `<tspan x="${cx}" dy="${j ? 11 : 0}">${esc(l)}</tspan>`).join('')}</text>`; });
  if (o.acum) { let s = 0; const tot = L.reduce((a, x) => a + (x[1] || 0), 0) || 1, P = L.map(x => (s += x[1] || 0));
    const top = o.acum === 'pareto' ? tot : Math.max(1, s), Ya = v => T + (H - T - B) * (1 - v / top), pts = P.map((v, i) => [X(i), Ya(v), v]).filter((p, i) => o.acum === 'pareto' || L.slice(0, i + 1).some(x => x[1]));
    if (!soma) g += `<text x="${W - D + 6}" y="${Y(mx) + 3}" font-size="9" fill="${AC}">100%</text><text x="${W - D + 6}" y="${Y(0) + 3}" font-size="9" fill="${AC}">0%</text>`;
    g += `<polyline points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="${AC}" stroke-width=".9"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" fill="#fff" stroke="${AC}" stroke-width=".9"/>` + (soma ? `<text x="${p[0]}" y="${H - 8}" text-anchor="middle" font-size="8.5" fill="${AC}">${o.fmt ? o.fmt(p[2]) : nf(p[2])}</text>` : `<text x="${p[0] + 5}" y="${p[1] + 12}" font-size="8.5" fill="${AC}">${Math.round(p[2] / tot * 100)}%</text>`)).join('');
    if (soma) g += `<text x="${E - 6}" y="${H - 8}" text-anchor="end" font-size="8.5" fill="${AC}">acum.</text>`; }
  const leg = [[NV, o.leg || 'no mês']].concat(o.acum ? [[AC, o.acum === 'pareto' ? '% acumulado' : 'acumulado no ano']] : []).map(([c, t]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><i style="display:inline-block;width:10px;height:${c === NV ? 8 : 2}px;background:${c}"></i>${t}</span>`).join('');
  return `<div class="gr"><svg viewBox="0 0 ${W} ${H}" style="display:block;margin:0 auto;width:${Math.round(W * 1.15)}px;max-width:100%">${g}</svg><div class="lg2" style="max-width:${Math.round(W * 1.15)}px;margin:0 auto">${leg}</div></div>`;
}
const rmeTab = (cab, L, w, cls) => `<table class="${cls || ''}"><thead><tr>${cab.map((c, i) => `<th${w && w[i] ? ` style="width:${w[i]}"` : ''}>${c}</th>`).join('')}</tr></thead><tbody>${L.length ? L.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cab.length}" class="mut">Nenhum registro.</td></tr>`}</tbody></table>`;
const rmeAn = s => `<p class="an"><b>Análise:</b> ${s}</p>`;
const rmeFonte = s => `<p class="fo">Fonte: ${s}</p>`;
function rmeConclusoes(R) {
  const p = R.N.per, a = R.N.ano, b = R.N.ant, L = [];
  L.push(`A aderência ao cronograma preventivo no período foi de <b>${rmeP(p.ad.ad)}</b> (acumulado no ano: ${rmeP(a.ad.ad)}), ${p.ad.ad == null ? 'sem serviços vencidos no período para medir' : p.ad.ad >= 90 ? 'dentro da referência de 90%' : '<b class="ruim">abaixo da referência de 90%</b>'}${b.ad.ad != null && p.ad.ad != null ? `; no período anterior foi de ${rmeP(b.ad.ad)}` : ''}.`);
  L.push(`Foram executados <b>${p.serv}</b> serviços preventivos em ${p.oms} OMs (${a.serv} serviços no ano)${p.nf ? `; ${p.nf} serviços não foram realizados e têm o motivo registrado` : ''}.`);
  const top = R.eqP[0];
  L.push(p.cor ? `Foram registradas <b>${p.cor}</b> manutenções corretivas (${a.cor} no ano), com ${rmeH(p.hPar, 1)} de reparo e MTTR de <b>${rmeH(p.mttr, 1)}</b> ${p.mttr == null ? '' : p.mttr <= 8 ? '(meta ≤ 8 h atendida)' : '<b class="ruim">(acima da meta de 8 h)</b>'}${top ? `; o equipamento com mais ocorrências foi <b>${esc(top[0])}</b> (${top[1]})` : ''}.` : `Não houve manutenção corretiva registrada no período (${a.cor} no ano).`);
  L.push(`A disponibilidade da frota no período foi de <b>${p.disp == null ? '—' : nf(p.disp, 1) + '%'}</b> (ano: ${a.disp == null ? '—' : nf(a.disp, 1) + '%'}), ${p.disp == null ? '' : p.disp >= 95 ? 'dentro da meta de 95%' : '<b class="ruim">abaixo da meta de 95%</b>'}.`);
  L.push(`Lubrificação: <b>${p.trocas}</b> trocas de óleo registradas no FR 049_B, com ${nf(p.litros)} L de óleo (${a.trocas} trocas e ${nf(a.litros)} L no ano)${R.lubSitu.filter(x => x[2] === 'vencida').length ? `; <b class="ruim">${R.lubSitu.filter(x => x[2] === 'vencida').length} trocas vencidas</b> na data da emissão` : ''}.`);
  L.push(`Os motores principais operaram <b>${nf(p.hMcp)} h</b> no período (${nf(a.hMcp)} h no ano)${p.sem ? `; ${p.sem} motores sem leitura de horímetro no período foram contados como 0 h` : ''}.`);
  return L;
}
// as seções: [nº, título, html]; tabelas com classe "qb" são quebradas entre folhas
// ---------- relatório gerencial (Supervisor, 27/10/2026: “quem vai ler 20 páginas?”): 2 folhas depois da capa ----------
function rmeGerencial(R, plano) {
  const per = `${brD(R.ini)} a ${brD(R.fim)}`, p = R.N.per, a = R.N.ano, b = R.N.ant, V = id => esc(vName(id)), pc = (id, pos) => { const v = vessel(id); return esc(v ? posCurtoE(v, pos) : pos); };
  const dp = v => v == null ? '—' : nf(v, 1) + '%', k = (l, v, sub, st) => `<div class="${st || ''}"><i>${l}</i><b>${v}</b><small>${sub}</small></div>`;
  const totMes = R.mesLab.map((l, i) => [l, R.hor.reduce((t, x) => t + x.mes[i], 0)]), dias = Math.round((pD(R.fim) - pD(R.ini)) / 864e5) + 1;
  const G1 = `<p class="fo">Período ${per} · acumulado de 01/01 a ${brD(R.fim)} · ${R.frota} empurradores · “anterior” = ${brD(rmeDia(R.ini, -dias))} a ${brD(rmeDia(R.ini, -1))}, mesmo número de dias</p>
    <div class="kp">${k('Aderência ao cronograma', rmeP(p.ad.ad), `ano ${rmeP(a.ad.ad)} · meta ≥ 90%`, p.ad.ad == null ? '' : p.ad.ad >= 90 ? 'ok' : 'bad')
      + k('Disponibilidade da frota', dp(p.disp), `ano ${dp(a.disp)} · meta ≥ 95%`, p.disp == null ? '' : p.disp >= 95 ? 'ok' : 'bad')
      + k('MTTR', rmeH(p.mttr, 1), `ano ${rmeH(a.mttr, 1)} · meta ≤ 8 h`, p.mttr == null ? '' : p.mttr <= 8 ? 'ok' : 'bad')
      + k('Corretivas', p.cor, `ano ${a.cor} · anterior ${b.cor}`, p.cor > b.cor ? 'bad' : '')
      + k('Serviços preventivos feitos', p.serv, `ano ${a.serv} · fora do prazo ${p.ad.ms}`, p.ad.ms ? 'bad' : 'ok')
      + k('Horas de reparo', rmeH(p.hPar, 1), `ano ${rmeH(a.hPar, 1)}`, '')
      + k('Trocas de óleo', p.trocas, `${nf(p.litros)} L · ano ${a.trocas}`, '')
      + k('Horas de operação · MCP', nf(p.hMcp) + ' h', `ano ${nf(a.hMcp)} h`, '')}</div>
    <div class="g2"><div><h3>1.1 Aderência ao cronograma, mês a mês</h3>${rmeGraf(R.mesLab.map((l, i) => [l, R.ads[i]]), { pct: true, meta: 90, fmt: v => Math.round(v) + '%', leg: 'aderência' })}</div>
      <div><h3>1.2 Horas de operação dos MCP, mês a mês</h3>${rmeGraf(totMes, { acum: 'soma', leg: 'horas no mês' })}</div></div>
    <h3>1.3 Principais constatações</h3><ol class="cc">${rmeConclusoes(R).map(x => `<li>${x}</li>`).join('')}</ol>
    ${(plano.conc || '').trim() ? `<h3>1.4 Comentário do Supervisor</h3><div class="tx">${esc(plano.conc).replace(/\n/g, '<br>')}</div>` : ''}`;
  // pontos de atenção: corretivas, falhas que se repetem, pendências e o plano
  const C = R.cor.slice(0, 8), pend = [];
  R.venc.slice().sort((x, y) => y[1] - x[1]).slice(0, 5).forEach(x => pend.push(['Preventiva vencida', V(x[0]), `${x[1]} serviço${x[1] > 1 ? 's' : ''}: ${esc(x[2])}${x[1] > 5 ? '…' : ''}`]));
  R.lubSitu.filter(x => x[2] === 'vencida').forEach(x => pend.push(['Troca de óleo vencida', V(x[0]), esc(x[1])]));
  R.ens.filter(e => e[4] != null && e[4] < COMP.lim).forEach(e => pend.push(['Compressão abaixo do limite', V(e[1]), `${pc(e[1], e[2])}: menor cilindro ${nf(e[4], 2)} MPa (limite ${nf(COMP.lim, 2)})`]));
  R.doca.filter(d => d[2] === 'venc' || (pD(d[1]) - pD(R.fim)) / 864e5 <= 180).forEach(d => pend.push([d[2] === 'venc' ? 'Docagem vencida' : 'Docagem a programar', V(d[0]), 'data-limite ' + brD(d[1])]));
  const A = (plano.acoes || []).filter(x => x && (x[0] || '').trim());
  const G2 = `<h3>2.1 Corretivas do período · ${R.cor.length}</h3>${rmeTab(['Início', 'Empurrador', 'OM', 'Equipamento', 'Classe', 'Reparo'], C.map(c => [brD(c[0].slice(0, 10)), V(c[1]), esc(c[2] || '—'), esc(c[4]), esc(c[5]), c[8] == null ? '<span class="mut">em aberto</span>' : rmeH(c[8], 1)]), ['11%', '15%', '11%', '37%', '12%', '14%'])}${R.cor.length > 8 ? `<p class="fo">E mais ${R.cor.length - 8} corretivas: lista completa no anexo técnico (A3).</p>` : ''}
    <h3>2.2 Falhas mais frequentes no ano</h3>${rmeTab(['Equipamento', 'No período', 'No ano'], R.eqA.slice(0, 5).map(([e, n]) => [esc(e), (R.eqP.find(x => x[0] === e) || [0, 0])[1], `<b>${n}</b>`]), ['60%', '20%', '20%'])}${R.rep.length ? `<p class="fo">Repetição no mesmo empurrador (2 ou mais no ano): ${R.rep.map(x => `${V(x[0])} · ${esc(x[1])} (${x[2]})`).join('; ')}. Avaliar a causa e a revisão do plano preventivo (NP 055 5.12).</p>` : ''}
    <h3>2.3 Pendências na data da emissão</h3>${rmeTab(['Assunto', 'Empurrador', 'Situação'], pend, ['24%', '16%', '60%'])}
    <h3>2.4 Plano de ação</h3>${rmeTab(['Nº', 'Ação', 'Responsável', 'Prazo'], (A.length ? A : [['', '', ''], ['', '', ''], ['', '', '']]).map((x, i) => [i + 1, esc(x[0] || '') || '&nbsp;', esc(x[1] || ''), x[2] ? brD(x[2]) : '']), ['6%', '60%', '20%', '14%'])}
    <table class="ass"><thead><tr><th>Elaborado por · Supervisor de Manutenção</th><th>Aprovado por · Gerência</th></tr></thead><tbody><tr><td class="lin">Nome, assinatura e data</td><td class="lin">Nome, assinatura e data</td></tr></tbody></table>`;
  return [[1, 'Painel do período', G1], [2, 'Pontos de atenção e decisões', G2]];
}
// anexo técnico (opcional): as tabelas completas, seções A1 a A5
function rmeAnexo(R) {
  const per = `${brD(R.ini)} a ${brD(R.fim)}`, ano = `01/01 a ${brD(R.fim)}`, p = R.N.per, a = R.N.ano, b = R.N.ant, V = id => esc(vName(id)), pc = (id, pos) => { const v = vessel(id); return esc(v ? posCurtoE(v, pos) : pos); };
  const sv = id => A1M[id] ? esc(enxServ(A1M[id])) : esc(id), S1 = [];
  // 2 · operação
  const pil = L => `<div class="mr">${L.map(x => `<div>${x}</div>`).join('')}</div>`, obs = m => m[4] === 1 ? 'sem leitura' : m[4] === 3 ? 'leitura incoerente fora da soma' : m[4] === 2 ? 'desde a 1ª leitura' : '';
  const linH = R.hor.map(x => [`<b>${V(x.v)}</b>`, pil(x.M.map(m => pc(x.v, m[0]))), pil(x.M.map(m => rmeH(m[1]))), pil(x.M.map(m => rmeH(m[2]))),
    pil(x.M.map(m => m[3] == null ? '—' : nf(m[3]) + ' h')), pil(x.M.map(m => obs(m) ? `<span class="mut">${obs(m)}</span>` : '&nbsp;'))]);
  const totMes = R.mesLab.map((l, i) => [l, R.hor.reduce((s, x) => s + x.mes[i], 0)]);
  S1.push([2, 'Operação da frota', `<p>Horas operadas por motor, pela diferença entre as leituras de horímetro (NP 055 5.5.1). Motor sem leitura no período aparece com 0 h e o aviso “sem leitura”; o horímetro total é a última leitura até ${brD(R.fim)}.</p>
    <h3>2.1 Horas de motores principais da frota, mês a mês · ${R.ano}</h3>${rmeGraf(totMes, { acum: 'soma', leg: 'horas no mês' })}${rmeAn(`a frota somou ${nf(p.hMcp)} h de MCP no período e <b>${nf(a.hMcp)} h acumuladas no ano</b> (linha laranja)${totMes.filter(t => t[1]).length > 1 ? `; média de ${nf(a.hMcp / totMes.filter(t => t[1]).length)} h nos ${totMes.filter(t => t[1]).length} meses com leitura` : ''}.`)}${rmeFonte('leituras de horímetro (SMF · 1 Horímetros).')}
    <h3>2.2 Horas por empurrador e por motor</h3>${rmeTab(['Empurrador', 'Motor', 'No período', 'Acumulado no ano', 'Horímetro total', 'Observação'], linH, ['13%', '19%', '13%', '15%', '15%', '25%'], 'qb hv')}
    <h3>2.3 Horas de operação mensais · motores principais (MCP) · ${R.ano}</h3>${rmeTab(['Empurrador', ...R.mesLab, 'Ano'], R.hor.map(x => [`<b>${V(x.v)}</b>`, ...x.mes.map(h => h ? nf(h) : '0'), `<b>${nf(x.mes.reduce((s, h) => s + h, 0))}</b>`]).concat([['<b>Frota</b>', ...totMes.map(t => `<b>${nf(t[1])}</b>`), `<b>${nf(totMes.reduce((s, t) => s + t[1], 0))}</b>`]]), null, 'qb sm')}`]);
  // 3 · preventiva
  const G = {}; R.feitos.forEach(f => { const k = f[1] + '|' + f[4]; const g = G[k] = G[k] || { d: f[0], v: f[1], om: f[4], q: new Set(), E: {} }; if (f[0] > g.d) g.d = f[0]; if (f[5]) g.q.add(f[5]); const t = A1M[f[3]], e = (t ? enxEq(t) : '') + ' (' + pc(f[1], f[2]) + ')'; (g.E[e] = g.E[e] || []).push(sv(f[3])); });
  const OM = Object.values(G).sort((x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : 0);
  S1.push([3, 'Manutenção preventiva', `<h3>3.1 Resultado do cronograma</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Serviços previstos', p.ad.prev, a.ad.prev], ['Feitos no prazo', p.ad.ok, a.ad.ok], ['Feitos com atraso', p.ad.lt, a.ad.lt], ['Não realizados dentro do prazo', p.ad.ms, a.ad.ms], ['<b>Aderência ao cronograma</b>', `<b>${rmeP(p.ad.ad)}</b>`, `<b>${rmeP(a.ad.ad)}</b>`], ['Serviços executados (total registrado)', p.serv, a.serv], ['OMs preventivas', p.oms, a.oms], ['Serviços não realizados, com motivo', p.nf, a.nf]], ['50%', '25%', '25%'])}
    <h3>3.2 Aderência mês a mês · ${R.ano}</h3>${rmeGraf(R.mesLab.map((l, i) => [l, R.ads[i]]), { pct: true, meta: 90, fmt: v => Math.round(v) + '%', leg: 'aderência no mês' })}${rmeAn(`${R.ads.filter(x => x != null && x < 90).length} de ${R.ads.filter(x => x != null).length} meses ficaram abaixo da referência de 90%; acumulado do ano: ${rmeP(a.ad.ad)}.`)}${rmeFonte('Cronograma preventivo (Anexo I) × serviços registrados com o nº da OM.')}
    <h3>3.3 Por empurrador</h3>${rmeTab(['Empurrador', 'Serviços no período', 'Serviços no ano', 'OMs no período', 'Não realizados', 'Aderência período', 'Aderência ano'], R.porV.map(x => [`<b>${V(x[0])}</b>`, x[1], x[2], x[3], x[6], rmeP(x[4]), rmeP(x[5])]), null, 'qb')}
    <h3>3.4 Atividades realizadas no período · ${OM.length} OMs · ${R.feitos.length} serviços</h3>${rmeTab(['Data', 'Empurrador', 'OM', 'Serviços executados', 'Executante'], OM.map(g => [brD(g.d), V(g.v), g.om ? esc(g.om) : '<span class="mut">sem nº</span>', Object.entries(g.E).map(([e, L]) => `<b>${esc(e)}:</b> ${L.join('; ')}`).join('<br>'), esc([...g.q].join(', '))]), ['9%', '11%', '9%', '57%', '14%'], 'qb sm')}
    <h3>3.5 Serviços não realizados, com o motivo</h3>${rmeTab(['Data', 'Empurrador', 'Serviço', 'Motivo', 'OM'], R.nfs.map(f => [brD(f[0]), V(f[1]), sv(f[2]), esc(f[3]), esc(f[4] || '—')]), ['10%', '13%', '37%', '30%', '10%'], 'qb sm')}
    <h3>3.6 Pendências na data da emissão</h3>${rmeTab(['Empurrador', 'Vencidos', 'Principais serviços'], R.venc.map(x => [`<b>${V(x[0])}</b>`, x[1], esc(x[2]) + (x[1] > 5 ? ` e mais ${x[1] - 5}` : '')]), ['18%', '10%', '72%'], 'qb sm')}`]);
  // 4 · corretiva
  S1.push([4, 'Manutenção corretiva', `<h3>4.1 Resultado</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Manutenções corretivas', p.cor, a.cor], ...R.cls.map(c => ['· classe ' + c[0], c[1], c[2]]), ['Horas de reparo', rmeH(p.hPar, 1), rmeH(a.hPar, 1)], ['MTTR (meta ≤ 8 h)', rmeH(p.mttr, 1), rmeH(a.mttr, 1)], ['Disponibilidade da frota (meta ≥ 95%)', p.disp == null ? '—' : nf(p.disp, 1) + '%', a.disp == null ? '—' : nf(a.disp, 1) + '%']], ['50%', '25%', '25%'])}
    <h3>4.2 Equipamentos com mais falhas · período</h3>${R.eqP.length ? rmeGraf(R.eqP, { acum: 'pareto', leg: 'corretivas' }) + rmeAn(R.eqP[0][1] < 2 ? `nenhum equipamento teve mais de uma corretiva no período (${R.eqP.length} equipamentos, uma ocorrência cada).` : `${esc(R.eqP[0][0])} teve ${R.eqP[0][1]} corretivas e concentra ${Math.round(R.eqP[0][1] / p.cor * 100)}% das corretivas do período.`) : '<p class="mut">Sem corretivas no período.</p>'}
    <h3>4.3 Equipamentos com mais falhas · acumulado no ano</h3>${R.eqA.length ? rmeGraf(R.eqA, { acum: 'pareto', leg: 'corretivas' }) + rmeAn(`os ${Math.min(3, R.eqA.length)} primeiros equipamentos somam ${Math.round(R.eqA.slice(0, 3).reduce((s, x) => s + x[1], 0) / a.cor * 100)}% das corretivas do ano.`) : '<p class="mut">Sem corretivas no ano.</p>'}${rmeFonte('corretivas registradas no SMF (Anexo II-A).')}
    <h3>4.4 Por sistema</h3>${rmeTab(['Sistema', 'No período', 'Acumulado no ano'], R.sisA.map(([s, n]) => [esc(s), (R.sisP.find(x => x[0] === s) || [0, 0])[1], n]), ['60%', '20%', '20%'], 'qb')}
    <h3>4.5 Falhas repetidas no ano (mesmo equipamento, 2 ou mais corretivas)</h3>${rmeTab(['Empurrador', 'Equipamento', 'Corretivas no ano'], R.rep.map(x => [V(x[0]), esc(x[1]), `<b class="ruim">${x[2]}</b>`]), ['30%', '50%', '20%'], 'qb')}${R.rep.length ? rmeAn('falha repetida indica causa não eliminada: avaliar a análise de causa e a revisão do plano preventivo (NP 055 5.12).') : ''}
    <h3>4.6 Atividades realizadas no período · ${R.cor.length}</h3>${rmeTab(['Início', 'Empurrador · OM', 'Equipamento · classe', 'Ocorrência', 'Intervenção executada', 'Reparo'], R.cor.map(c => [brD(c[0].slice(0, 10)) + (c[0].length > 10 ? ' ' + c[0].slice(11, 16) : ''), V(c[1]) + '<br>OM ' + esc(c[2] || '—'), esc(c[4]) + '<br><span class="mut">' + esc(c[3]) + ' · ' + esc(c[5]) + '</span>', esc(c[6]), esc(c[7]), c[8] == null ? '<span class="mut">em aberto</span>' : rmeH(c[8], 1)]), ['10%', '12%', '18%', '25%', '27%', '8%'], 'qb sm')}`]);
  // 5 · lubrificação
  S1.push([5, 'Lubrificação', `<h3>5.1 Resultado</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Trocas de óleo (FR 049_B)', p.trocas, a.trocas], ['Óleo utilizado nas trocas', nf(p.litros) + ' L', nf(a.litros) + ' L'], ['Trocas com filtro', p.filtros, a.filtros], ['Complementos de nível', nf(p.compL, 1) + ' L', nf(a.compL, 1) + ' L']], ['50%', '25%', '25%'])}
    <h3>5.2 Óleo utilizado nas trocas, mês a mês · ${R.ano}</h3>${rmeGraf(R.mesLab.map((l, i) => [l, R.lubMes[i]]), { acum: 'soma', fmt: v => nf(v) + ' L', leg: 'litros no mês' })}${rmeAn(`${nf(a.litros)} L no ano, média de ${nf(a.litros / Math.max(1, R.mesLab.length))} L por mês.`)}${rmeFonte('FR 049_B registrados no SMF (Óleo).')}
    <h3>5.3 Por empurrador</h3>${rmeTab(['Empurrador', 'Trocas no período', 'Trocas no ano', 'Litros no período', 'Litros no ano'], R.lubV.map(x => [`<b>${V(x[0])}</b>`, x[1], x[2], nf(x[3]), nf(x[4])]), null, 'qb')}
    <h3>5.4 Trocas realizadas no período · ${R.trocas.length}</h3>${rmeTab(['Data', 'Empurrador', 'Equipamento', 'Óleo', 'Litros', 'Filtros', 'Horímetro', 'OM'], R.trocas.map(t => [brD(t[0]), V(t[1]), esc(t[2]), esc(t[3]), nf(t[4], 1), esc(t[5] || '—'), t[6] === '' ? '—' : nf(t[6]) + ' h', esc(t[7] || '—')]), ['9%', '12%', '20%', '14%', '8%', '13%', '12%', '12%'], 'qb sm')}
    <h3>5.5 Trocas vencidas ou próximas na data da emissão</h3>${rmeTab(['Empurrador', 'Equipamento', 'Situação', 'Detalhe'], R.lubSitu.map(x => [V(x[0]), esc(x[1]), x[2] === 'vencida' ? '<b class="ruim">vencida</b>' : 'próxima', esc(x[3])]), ['18%', '30%', '14%', '38%'], 'qb sm')}`]);
  // 6 · condição
  const res = e => e[4] < COMP.lim ? '<b class="ruim">abaixo do limite</b>' : e[4] < COMP.aten || e[6] > CMP.dif ? '<b style="color:#B06000">atenção</b>' : 'normal';
  S1.push([6, 'Condição dos equipamentos', `<h3>6.1 Compressão dos motores principais</h3><p>Ensaios no período: <b>${p.ensaios}</b> · acumulado no ano: <b>${a.ensaios}</b>. Critério: padrão ${nf(COMP.pad, 2)} MPa e limite ${nf(COMP.lim, 2)} MPa (Service Manual S6R2, p. 2-3); atenção abaixo de ${nf(COMP.aten, 2)} MPa ou diferença entre cilindros acima de ${nf(CMP.dif, 2)} MPa (critério interno, Anexo I 1.1.12).</p>
    ${rmeTab(['Data', 'Empurrador', 'Motor', 'Horímetro', 'Menor cilindro', 'Maior cilindro', 'Diferença', 'Resultado'], R.ens.map(e => [brD(e[0]), V(e[1]), pc(e[1], e[2]), e[3] == null ? '—' : nf(e[3]) + ' h', nf(e[4], 2) + ' MPa', nf(e[5], 2) + ' MPa', nf(e[6], 2), res(e)]), null, 'qb sm')}
    <h3>6.2 Docagens nos próximos 12 meses</h3>${rmeTab(['Empurrador', 'Data-limite', 'Origem', 'Situação'], R.doca.map(d => [V(d[0]), brD(d[1]), esc(d[3]), d[2] === 'venc' ? '<b class="ruim">vencida</b>' : 'programar']), ['25%', '20%', '35%', '20%'], 'qb')}`]);
  return S1.map((x, k) => ['A' + (k + 1), x[1], x[2].replace(new RegExp('<h3>' + x[0] + '\\.', 'g'), '<h3>A' + (k + 1) + '.')]);
}
const RME_CSS = `@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;background:#E5E7EB;font:10.5px Arial,Helvetica,sans-serif;color:#202124}
 .pg{width:210mm;height:297mm;padding:9mm 12mm 7mm;background:#fff;margin:8px auto;box-shadow:0 1px 4px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;page-break-after:always;break-after:page}
 .bd{flex:1;overflow:hidden;min-height:0}.ft{display:flex;justify-content:space-between;font-size:8px;color:#5F6368;border-top:1px solid #CBD5E1;padding-top:3px;margin-top:4px}
 @media print{body{background:#fff}.pg{margin:0;box-shadow:none}}
 ${DOC_CAB_CSS.split('@page')[0]}
 h2{font-size:14px;color:#1F2A44;margin:2px 0 8px;padding:5px 8px;border:1px solid #1F2A44;letter-spacing:.02em}h3{font-size:11.5px;color:#1F2A44;margin:10px 0 4px;border-bottom:.6px solid #CBD5E1;padding-bottom:2px}p{margin:4px 0;line-height:1.4}
 table{width:100%;border-collapse:collapse;margin:2px 0 4px}th,td{border:.6px solid #CBD5E1;padding:3px 5px;text-align:left;vertical-align:top}th{background:#16244A;color:#fff;font-size:9.5px;font-weight:600}table.sm td{font-size:9.3px}
 .mut{color:#80868B}.ruim{color:#C5221F}.an{border:.6px solid #CBD5E1;border-left:2px solid #1F2A44;padding:4px 8px;font-size:10px}.gr{margin:2px 0}.lg2{font-size:8.5px;color:#5F6368;text-align:right;margin-top:-2px}.fo{color:#5F6368;font-size:8.8px}.cc li{margin:3px 0;line-height:1.4}
 .tx{border:1px solid #CBD5E1;padding:6px 8px;min-height:60px;line-height:1.45}.tx.vazio{min-height:120px}.ass th{width:50%}.ass .lin{height:60px;vertical-align:bottom;color:#5F6368}
 .dc .t b{font-size:12px}table.hv>tbody>tr>td{padding:0;vertical-align:middle}table.hv>tbody>tr>td:first-child{background:#F4F6F9;text-align:center;font-size:11px;padding:0 5px}table.hv>tbody>tr:nth-child(even)>td:not(:first-child){background:#FBFCFD}
 .mr>div{padding:2.5px 5px;box-shadow:inset 0 -.5px 0 #E6EAF0;white-space:nowrap}.mr>div:last-child{box-shadow:none;border-top:.5px solid #AEB8C6}
 .capa{justify-content:space-between;padding:12mm 16mm 10mm}.capa .lg{display:flex;justify-content:space-between;align-items:center}.capa .lg img{max-height:64px;max-width:190px}
 .capa .tt{text-align:center}.capa .tt h1{font-size:30px;color:#1F2A44;margin:0;line-height:1.2;font-weight:700}.capa .tt .s{font-size:18px;color:#1F2A44;margin-top:8px}
 .capa table.dd{width:100%;margin:0}.capa table.dd td{padding:7px 10px;font-size:11.5px}.capa table.dd td:first-child{width:34%;background:#F4F6F9;color:#3C4043}.capa table.dd td:last-child{font-weight:700;color:#1F2A44}
 .capa .lgl{font-size:9px;color:#5F6B7A;margin-top:4mm}.prev{color:#C5221F;font-weight:700;font-size:12px;margin-top:6mm}
 .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 8px}.kp>div{border:1px solid #E1E6ED;border-left:3px solid #AEB8C6;padding:6px 8px}.kp>div.ok{border-left-color:#188038}.kp>div.bad{border-left-color:#C5221F}
 .kp i{display:block;font-style:normal;font-size:8.6px;color:#5F6368;text-transform:uppercase;letter-spacing:.03em}.kp b{display:block;font-size:19px;color:#1F2A44;margin:2px 0 1px}.kp .bad b{color:#C5221F}.kp small{font-size:8.6px;color:#5F6368}
 table.ass{margin-top:12px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.g2 h3{margin-top:6px}
 /* linhas finas (Supervisor, 27/10/2026): na impressão o navegador não faz linha abaixo de 1 px e a sombra de 0,5 px sai borrada;
 a leveza vem de réguas só horizontais em cinza bem claro, sem grade vertical nem quadro em volta */
 th,td{border:0;border-bottom:1px solid #E6EAF0}th{border-bottom:0}.capa table.dd td{border-bottom:1px solid #E6EAF0}
 .dc{border:1px solid #CFD6E0;box-shadow:none}.dc>div+div{border-left:1px solid #CFD6E0;box-shadow:none}.ft{border-top:1px solid #CFD6E0}
 .an{border:0;background:#F5F7FA;border-left:2px solid #1F2A44}.tx{border:1px solid #E1E6ED}.mr>div{box-shadow:none;border-bottom:1px solid #EEF1F5}.mr>div:last-child{border-bottom:0}
 table.hv>tbody>tr>td{border-bottom:1px solid #CFD6E0}
 /* títulos: seção com número em quadro azul-marinho e régua; subtítulo com o número em destaque, sem linha */
 h2{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;color:#1F2A44;margin:4px 0 10px;padding:0 0 6px;border:0;border-bottom:1px solid #1F2A44;letter-spacing:0}
 h2 .nu{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;background:#1F2A44;color:#fff;font-size:14px}
 h3{font-size:11.8px;font-weight:700;color:#1F2A44;margin:13px 0 5px;padding:0;border:0}h3 .n3{color:#B06000;margin-right:7px}`;
// documento completo: as folhas são montadas na janela de impressão (o script mede e quebra as tabelas)
function rmeDoc(R, plano, emi, anexo) {
  const num = emi ? emi.num : 'PRÉVIA', per = `${brD(R.ini)} a ${brD(R.fim)}`, sec = rmeGerencial(R, plano).concat(anexo ? rmeAnexo(R) : []), cab = docCab('RELATÓRIO GERENCIAL DE MANUTENÇÃO', `Frota de Empurradores · ${per} · ${esc(num)}`, 'NP Navecunha 055 · itens 7.3 e 9');
  const foot = `Plano de Gestão de Manutenção · Empurradores Fluviais · ${esc(num)}`;
  const capa = `<div class="pg capa"><div class="lg"><img src="${docLogo('nav')}" alt=""><img src="${docLogo('vda')}" alt=""></div>
    <div class="tt"><h1>Relatório Gerencial de Manutenção</h1><div class="s">Frota de Empurradores</div>${emi ? '' : '<div class="prev">PRÉVIA · documento não emitido</div>'}</div>
    <div><table class="dd"><tr><td>Relatório nº</td><td>${esc(num)}</td></tr><tr><td>Período</td><td>${per}</td></tr><tr><td>Acumulado do ano</td><td>01/01/${R.ano} a ${brD(R.fim)}</td></tr>
    <tr><td>Elaborado por</td><td>${esc(emi ? emi.por : (S.session || {}).name || '')} · Supervisor de Manutenção</td></tr><tr><td>Data de emissão</td><td>${esc(emi ? emi.em : 'não emitido')}</td></tr>
    <tr><td>Conteúdo</td><td>Painel do período · pontos de atenção e decisões${anexo ? ' · anexo técnico (A1 a A5)' : ''}</td></tr><tr><td>Base normativa</td><td>NP Navecunha 055 · itens 7.3 e 9</td></tr><tr><td>Distribuição</td><td>Gerência</td></tr></table>
    <p class="lgl">Navegação Cunha Ltda. · Grupo VDA</p></div></div>`;
  const src = sec.map(s => `<div class="sc" data-n="${s[0]}"><h2><span class="nu">${s[0]}</span>${esc(s[1])}</h2>${s[2].replace(/<h3>(A?\d+\.\d+) /g, '<h3><span class="n3">$1</span>')}</div>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(tituloArq(num + ' - Relatorio gerencial de manutencao'))}</title><style>${RME_CSS}</style></head><body>${capa}<div id="out"></div>
   <div id="src" style="position:absolute;left:-9999px;top:0;width:186mm">${src}</div>
   <template id="cab">${cab}</template>
   <script>(function(){var out=document.getElementById('out'),cab=document.getElementById('cab').innerHTML,foot=${JSON.stringify(foot)},pg,bd;
   function nova(n){pg=document.createElement('div');pg.className='pg';pg.setAttribute('data-sec',n);pg.innerHTML='<div class="bd">'+cab+'</div><div class="ft"><span>'+foot+'</span><span class="fn"></span></div>';out.appendChild(pg);bd=pg.firstChild;}
   function cheio(){return bd.scrollHeight>bd.clientHeight+1;}
   function vazio(){return bd.children.length<=1;}
   function poe(el,n){bd.appendChild(el);if(cheio()&&!vazio()){bd.removeChild(el);nova(n);bd.appendChild(el);}}
   function tabela(t,n,h){var th=t.tHead,rows=[].slice.call(t.tBodies[0].rows),cur=t.cloneNode(false);cur.appendChild(th.cloneNode(true));var tb=document.createElement('tbody');cur.appendChild(tb);bd.appendChild(cur);
     if(rows.length)tb.appendChild(rows.shift());
     var mv=h?[h,cur]:[cur];if(cheio()&&bd.children.length>1+mv.length){mv.forEach(function(x){bd.removeChild(x);});nova(n);mv.forEach(function(x){bd.appendChild(x);});}
     rows.forEach(function(r){tb.appendChild(r);if(cheio()&&tb.rows.length>1){tb.removeChild(r);nova(n);cur=t.cloneNode(false);cur.appendChild(th.cloneNode(true));tb=document.createElement('tbody');cur.appendChild(tb);bd.appendChild(cur);tb.appendChild(r);}});}
   var S=[].slice.call(document.querySelectorAll('#src .sc'));
   S.forEach(function(s){var n=s.getAttribute('data-n');nova(n);var K=[].slice.call(s.children),i;
     for(i=0;i<K.length;i++){var el=K[i];if(el.tagName==='H3'&&K[i+1]){var nx=K[i+1];bd.appendChild(el);if(nx.tagName==='TABLE'&&nx.classList.contains('qb')){if(cheio()&&!vazio()){bd.removeChild(el);nova(n);bd.appendChild(el);}tabela(nx,n,el);i++;continue;}bd.appendChild(nx);if(cheio()&&!vazio()){bd.removeChild(nx);bd.removeChild(el);nova(n);bd.appendChild(el);bd.appendChild(nx);}i++;continue;}
       if(el.tagName==='TABLE'&&el.classList.contains('qb'))tabela(el,n);else poe(el,n);}});
   document.getElementById('src').remove();
   var P=[].slice.call(document.querySelectorAll('.pg')),T=P.length;P.forEach(function(p,i){var f=p.querySelector('.fn');if(f)f.textContent='Folha '+(i+1)+' de '+T;});
   setTimeout(function(){window.print();},700);})();<\/script></body></html>`;
}
function rmeAbrir(R, plano, emi, anexo) { const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para abrir o relatório.'); w.document.write(rmeDoc(R, plano, emi, anexo)); w.document.close(); }
// ---------- emitidos (congelados em partes) ----------
const rmeEmitidos = () => recs('snap').filter(s => s.tipo === 'relmes' && !s.excluido).sort((a, b) => (b.at || 0) - (a.at || 0));
function rmeLer(s) { const P = recs('snap').filter(x => x.tipo === 'relmes-p' && x.pai === s.id).sort((a, b) => a.i - b.i); if (P.length !== s.partes) return null; try { return JSON.parse(P.map(x => x.txt).join('')); } catch (e) { return null; } }
async function rmeEmitir() {
  if (!can.admin()) return toast('Só o Supervisor emite o relatório.'); if (RME.ini > RME.fim) return toast('A data inicial é depois da final.');
  const R = rmeDados(RME.ini, RME.fim), pl = rmePlano(), base = 'RM-' + RME.fim.slice(0, 7), n = rmeEmitidos().filter(s => s.num.split('-r')[0] === base).length;
  const txt = JSON.stringify(R), id = uid('snap'), partes = Math.ceil(txt.length / 28000);
  const s = { id, kind: 'snap', tipo: 'relmes', date: isoD(hoje()), at: Date.now(), num: base + (n ? '-r' + n : ''), ini: RME.ini, fim: RME.fim, em: new Date().toLocaleString('pt-BR'), por: S.session.name, partes, plano: pl, anexo: !!RME.anexo };
  if (JSON.stringify(s).length > 45000) return toast('Texto das conclusões grande demais. Encurte e emita de novo.');
  for (let i = 0; i < partes; i++) await saveRec({ id: id + '-p' + i, kind: 'snap', tipo: 'relmes-p', pai: id, i, txt: txt.slice(i * 28000, (i + 1) * 28000), date: s.date });
  await saveRec(s); rmeAbrir(R, pl, s, s.anexo); render();
}
// ---------- tela 5 · Relatório mensal ----------
function vRme() {
  const R = rmeDados(RME.ini, RME.fim), p = R.N.per, a = R.N.ano, E = rmeEmitidos(), O = enxEmitidos(), pl = rmePlano(), ac = (pl.acoes || []).concat([[], [], [], [], []]).slice(0, Math.max(5, (pl.acoes || []).length + 1));
  const at = (k, t) => `<button class="cm-chip" data-rmeat="${k}">${t}</button>`, K = (l, x, y, c) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${x}</b><small class="note" style="display:block;margin-top:2px">no ano: ${y}</small></div>`;
  return enxCab('Relatório mensal', 'Relatório gerencial para a Gerência: capa, painel do período e pontos de atenção (3 folhas) · cada número no período e no acumulado do ano · anexo técnico só quando marcado · “Emitir” numera e congela a cópia',
     `<label class="f">De<input type="date" id="rmeI" value="${RME.ini}"></label><label class="f">Até<input type="date" id="rmeF" value="${RME.fim}" max="${isoD(hoje())}"></label><label class="row" style="gap:6px;align-self:end"><input type="checkbox" id="rmeX"${RME.anexo ? ' checked' : ''}> Incluir anexo técnico</label><button class="mbtn" data-rmeprev>Prévia</button><button class="mbtn pri" data-rmeem>Emitir e imprimir</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + `<div class="card"><h2>Período ${brD(R.ini)} a ${brD(R.fim)}</h2><div class="cm-chips" style="margin-bottom:8px">${at('mes', 'Este mês')}${at('ant', 'Mês passado')}${at('tri', 'Últimos 3 meses')}${at('ano', 'Ano até hoje')}</div>
     <div class="f2-ks">${K('Aderência ao cronograma', rmeP(p.ad.ad), rmeP(a.ad.ad), p.ad.ad == null ? '' : p.ad.ad >= 90 ? 'var(--okt)' : 'var(--badt)') + K('Serviços preventivos', p.serv, a.serv) + K('Não realizados', p.nf, a.nf, p.nf ? 'var(--warnt)' : '') + K('Corretivas', p.cor, a.cor, p.cor ? 'var(--warnt)' : '') + K('MTTR', rmeH(p.mttr, 1), rmeH(a.mttr, 1), p.mttr == null ? '' : p.mttr <= 8 ? 'var(--okt)' : 'var(--badt)') + K('Disponibilidade', p.disp == null ? '—' : nf(p.disp, 1) + '%', a.disp == null ? '—' : nf(a.disp, 1) + '%') + K('Trocas de óleo', p.trocas, a.trocas) + K('Horas de MCP', nf(p.hMcp), nf(a.hMcp))}</div>
     ${p.sem ? `<p class="note">${p.sem} motores sem leitura de horímetro no período entram com 0 h e o aviso “sem leitura”. Motor parado: lance a mesma leitura em <a href="#enxhor">1 · Horímetros</a> (“Não operou”).</p>` : ''}</div>
   <div class="card"><h2>Comentário e plano de ação (folhas 2 e 3)</h2><p class="note">Escreva antes de emitir. Fica guardado neste aparelho para este período até a emissão; na emissão vai junto com a cópia congelada.</p>
     <label class="f">Comentário do Supervisor<textarea id="rmeC" rows="4" placeholder="o que os números mostram, causas, riscos e decisões">${esc(pl.conc || '')}</textarea></label>
     <table class="t"><thead><tr><th>Ação</th><th style="width:24%">Responsável</th><th style="width:16%">Prazo</th></tr></thead><tbody>${ac.map((x, i) => `<tr><td><input class="rmeA" data-i="${i}" data-c="0" value="${esc(x[0] || '')}"></td><td><input class="rmeA" data-i="${i}" data-c="1" value="${esc(x[1] || '')}"></td><td><input type="date" class="rmeA" data-i="${i}" data-c="2" value="${esc(x[2] || '')}"></td></tr>`).join('')}</tbody></table></div>
   <div class="card"><h2>O que sai no relatório</h2><ol class="note" style="margin:0;padding-left:18px;line-height:1.6"><li><b>Capa</b> · nº, período, elaboração e distribuição</li><li><b>1 Painel do período</b> · 8 indicadores (período, ano e meta), aderência e horas de operação mês a mês, constatações e o seu comentário</li><li><b>2 Pontos de atenção e decisões</b> · corretivas do período, falhas mais frequentes no ano, pendências (preventiva e óleo vencidos, compressão, docagem), plano de ação e assinaturas</li><li class="mut">Anexo técnico (só se marcado): A1 operação por motor · A2 preventiva por OM · A3 corretiva · A4 lubrificação · A5 condição</li></ol></div>
   <div class="card"><h2>Relatórios emitidos · ${E.length}</h2>${E.length ? `<table class="t"><thead><tr><th>Nº</th><th>Período</th><th>Emitido em</th><th>Por</th><th></th></tr></thead><tbody>${E.map(s => `<tr><td><b>${esc(s.num)}</b></td><td>${brD(s.ini)} a ${brD(s.fim)}</td><td>${esc(s.em)}</td><td>${esc(s.por)}</td><td><button class="mbtn sm" data-rmeimp="${s.id}">Imprimir</button></td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum emitido ainda.</p>'}
     ${O.length ? `<p class="note" style="margin-top:8px">Relatórios de preventiva emitidos antes da versão 3.5: ${O.map(s => `<a href="#" data-erimp="${s.id}">${esc(s.num)}</a>`).join(' · ')}</p>` : ''}</div></div></div>`;
}
function rmeAtalho(k) {
  const h = hoje(), y = h.getFullYear(), m = h.getMonth();
  if (k === 'mes') { RME.ini = isoD(new Date(y, m, 1)); RME.fim = isoD(h); }
  if (k === 'ant') { RME.ini = isoD(new Date(y, m - 1, 1)); RME.fim = isoD(new Date(y, m, 0)); }
  if (k === 'tri') { RME.ini = isoD(new Date(y, m - 2, 1)); RME.fim = isoD(h); }
  if (k === 'ano') { RME.ini = isoD(new Date(y, 0, 1)); RME.fim = isoD(h); }
}
VX.enxrel = vRme;
AFTER.enxrel = () => { const m = $('#main');
  m.onclick = async e => { const t = e.target.closest('[data-rmeat],[data-rmeprev],[data-rmeem],[data-rmeimp],[data-erimp]'); if (!t) return; const d = t.dataset;
    if (d.rmeat !== undefined) { rmeAtalho(d.rmeat); return render(); }
    if (d.rmeprev !== undefined) return rmeAbrir(rmeDados(RME.ini, RME.fim), rmePlano(), null, RME.anexo);
    if (d.rmeem !== undefined) return rmeEmitir();
    if (d.rmeimp !== undefined) { const s = S.recs.get(d.rmeimp), R = s && rmeLer(s); return R ? rmeAbrir(R, s.plano || {}, s, s.anexo) : toast('Relatório ainda não chegou inteiro neste aparelho. Sincronize e tente de novo.'); }
    if (d.erimp !== undefined) { e.preventDefault(); const s = S.recs.get(d.erimp); if (s) enxRelImprimir(s); } };
  m.onchange = e => { const i = e.target;
    if (i.id === 'rmeX') { RME.anexo = i.checked; return; }
    if (i.id === 'rmeI' || i.id === 'rmeF') { if (i.value) { RME[i.id === 'rmeI' ? 'ini' : 'fim'] = i.value; render(); } return; }
    if (i.id === 'rmeC' || i.classList.contains('rmeA')) { const p = rmePlano(); if (i.id === 'rmeC') p.conc = i.value; else { p.acoes = p.acoes || []; const k = +i.dataset.i; p.acoes[k] = p.acoes[k] || ['', '', '']; p.acoes[k][+i.dataset.c] = i.value; } rmePlanoSalvar(p); } };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_enxrel2_lay', '[data-enxreset]'); };
