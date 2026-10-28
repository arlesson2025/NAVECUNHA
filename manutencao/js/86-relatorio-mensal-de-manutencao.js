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
// período inicial: até o dia 10 abre no mês passado (fechamento mensal); depois, no mês corrente
const RME = (() => { const h = hoje(), y = h.getFullYear(), m = h.getMonth(); return h.getDate() <= 10 ? { ini: isoD(new Date(y, m - 1, 1)), fim: isoD(new Date(y, m, 0)), anexo: false } : { ini: isoD(new Date(y, m, 1)), fim: isoD(h), anexo: false }; })();
const rmeDia = (s, n) => { const d = pD(s); d.setDate(d.getDate() + n); return isoD(d); };
const rmeMot = v => posicoes(v).filter(p => p !== 'UN');
const rmePlanoK = () => 'smf_rme_' + RME.ini + '_' + RME.fim;
// comentário do Supervisor: gravado na planilha por período (snap tipo 'rmecom'; desde a 3.22 — antes ficava só no aparelho); ações: plano de ação (js/87)
const rmeComId = () => 'snap-rmecom-' + RME.ini + '_' + RME.fim;
function rmePlano() { const r = S.recs.get(rmeComId()); let conc = r && !r.excluido ? r.txt || '' : null;
  if (conc == null) try { conc = (JSON.parse(localStorage.getItem(rmePlanoK()) || 'null') || {}).conc || ''; } catch (e) { conc = ''; }
  return { conc, acoes: typeof pcmAcoesNoPeriodo === 'function' ? pcmAcoesNoPeriodo(RME.ini, RME.fim) : [] }; }
let RME_T = 0;
function rmePlanoSalvar(p) { try { localStorage.setItem(rmePlanoK(), JSON.stringify({ conc: p.conc })); } catch (e) { }
  const id = rmeComId(), ini = RME.ini, fim = RME.fim; clearTimeout(RME_T); RME_T = setTimeout(() => { if (S.session) saveRec({ id, kind: 'snap', tipo: 'rmecom', ini, fim, txt: p.conc, date: isoD(hoje()), por: S.session.name }); }, 600); }
// horas operadas entre ini e fim pelas leituras: última leitura do intervalo − última antes dele (sem leitura antes: a primeira do intervalo)
function rmeHorIdx() {
  const I = {}; recs('hor').forEach(r => { if (r.est || r.excluido || r.h == null) return; (I[r.vessel + '|' + r.pos] = I[r.vessel + '|' + r.pos] || []).push(r); });
  Object.values(I).forEach(L => L.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.h - b.h)); return I;
}
// soma leitura a leitura: só conta o que subiu e coube no tempo (horas ≤ dias × 24); leitura que desce ou salta demais (horímetro trocado,
// registro antigo fora de ordem) não soma e é marcada; a leitura “última − primeira” dava 0 h ou o horímetro inteiro com um registro desses
function rmeHoras(I, vid, pos, ini, fim) {
  // ant = última leitura coerente; alt = leitura incoerente pendente (se a seguinte casar com ela, foi horímetro trocado e a conta segue dela;
  // se casar com ant, a incoerente era digitação errada e é só ignorada — antes ela derrubava também a leitura certa seguinte)
  const L = I[vid + '|' + pos] || []; let ant = null, alt = null, h = 0, n = 0, inc = false, ult = null;
  const casa = (a, r) => { if (!a) return null; const d = r.h - a.h, lim = Math.max(1, (pD(r.date) - pD(a.date)) / 864e5) * 24 + 1; return d >= 0 && d <= lim ? d : null; };
  L.forEach(r => { if (r.date > fim) return; const dentro = r.date >= ini; if (dentro) { ult = r; n++; }
    if (!ant) { ant = r; return; }
    let d = casa(ant, r); if (d == null && alt) d = casa(alt, r);
    if (d != null) { if (dentro) h += d; ant = r; alt = null; } else { if (dentro) inc = true; alt = r; } });
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
  return { serv: F.length, oms: new Set(F.map(r => r.vessel + '|' + (r.om || ''))).size, semOm: F.filter(r => !r.om).length, nf: B.length - F.length, ad: rmeAd(V, ini, fim), cor: C.length, hPar, mttr: lib.length ? hPar / lib.length : null,
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
  // execução: equipe própria × terceiros (preventiva por OM, corretiva por registro), no período e no ano
  const exP = {}; B.filter(r => !r.nf).forEach(r => { const k = r.vessel + '|' + (r.om || ''), g = exP[k] = exP[k] || { d: r.date, v: r.vessel, om: r.om || '', ex: r.exec || '', emp: r.empresa || '', n: 0 }; g.n++; if (r.date > g.d) g.d = r.date; if (r.exec && !g.ex) { g.ex = r.exec; g.emp = r.empresa || ''; } });
  const conta = (L, de) => { const c = { prop: 0, terc: 0, ni: 0 }; L.filter(x => x.d >= de).forEach(x => { c[x.ex === 'Terceiro' ? 'terc' : x.ex ? 'prop' : 'ni']++; }); return c; };
  const PO = Object.values(exP), CO = CA.map(o => ({ d: String(o.abertura).slice(0, 10), v: o.vessel, om: o.num || '', ex: o.exec || '', emp: o.empresa || '', eq: rmeEqN(o.equip), sv: o.servicos || '' }));
  const exe = { P: [conta(PO, ini), conta(PO, iniA)], C: [conta(CO, ini), conta(CO, iniA)] };
  const terc = PO.filter(x => x.ex === 'Terceiro' && x.d >= ini).map(x => [x.d, x.v, x.om, 'Preventiva', x.emp, x.n + ' serviço' + (x.n > 1 ? 's' : '') + ' do plano'])
    .concat(CO.filter(x => x.ex === 'Terceiro' && x.d >= ini).map(x => [x.d, x.v, x.om, 'Corretiva', x.emp, rmeTxt(x.eq + ': ' + x.sv, 120)])).sort((x, z) => x[0] < z[0] ? -1 : 1);
  const fotos = recs('base').filter(r => (r.fotos || []).length && !r.excluido && r.date >= ini && r.date <= fim && vessel(r.vessel)).flatMap(r => r.fotos.map((f, i) => [r.id, i, f.tipo || '', r.vessel, r.om || '', r.date, 'Preventiva']))
    .concat(rmeTrocas(ini, fim).filter(r => r.fotosLocais || r.fotosFid).flatMap(r => ['a', 'd'].flatMap(g => { const n = Math.max(((r.fotosLocais || {})[g] || []).length, ((r.fotosFid || {})[g] || []).length);
      return Array.from({ length: n }, (_, i) => [r.id, g + i, g === 'a' ? 'ANTES' : 'DEPOIS', r.vessel, r.om || r.num || '', r.date, 'Preventiva · troca de óleo (FR 049_B)']); })))
    .concat(CP.filter(o => (o.fotos || []).length).flatMap(o => o.fotos.map((f, i) => [o.id, i, f.tipo || '', o.vessel, o.num || '', String(o.abertura).slice(0, 10), 'Corretiva · ' + rmeEqN(o.equip)])))
    .sort((x, z) => x[5] < z[5] ? -1 : x[5] > z[5] ? 1 : x[0] < z[0] ? -1 : x[0] > z[0] ? 1 : x[1] - z[1]);
  // o que mais falhou: por equipamento, com sistema, falhas no período e no ano, horas de reparo e MTTR no ano
  const EQ = {}; CA.forEach(o => { const k = rmeEqN(o.equip).toLowerCase(), g = EQ[k] = EQ[k] || { eq: rmeEqN(o.equip), sis: o.sistema || '', nP: 0, nA: 0, h: 0, nh: 0, emp: new Set() }; g.nA++; if (String(o.abertura).slice(0, 10) >= ini) g.nP++; const h = rmeHP(o); if (h != null) { g.h += h; g.nh++; } g.emp.add(vName(o.vessel)); });
  const eqT = Object.values(EQ).sort((x, z) => z.nA - x.nA || z.nP - x.nP || z.h - x.h).slice(0, 10).map(g => [g.eq, g.sis, g.nP, g.nA, Math.round(g.h * 10) / 10, g.nh ? Math.round(g.h / g.nh * 10) / 10 : null, [...g.emp].join(', ')]);
  // compressão do MCP na data da emissão: último ensaio, pior cilindro, diferença e horas até o limite de 1,27 MPa (mesma conta da tela Compressão)
  const cmp = (typeof cmpDados === 'function' ? cmpDados() : []).map(x => [x.v.id, x.pos, x.u ? x.u.min : null, x.u ? x.u.max : null, x.dif, x.proj === Infinity ? -1 : x.proj, x.st, x.u ? x.u.date || '' : '', x.u && x.u.h != null && x.u.h !== '' ? +x.u.h : null]);
  const cal = (typeof calibDados === 'function' ? calibDados() : []).filter(x => x.t.id === '1.1.11' || x.t.id === '1.1.12').map(x => [x.v.id, x.pos, x.t.id, x.s.rest == null ? null : Math.round(x.s.rest), x.s.st, x.s.L ? x.s.L.date || '' : '', x.s.L && x.s.L.h != null && x.s.L.h !== '' ? +x.s.L.h : null]);
  return { ini, fim, iniA, ano: y, N, fotos, exe, terc, eqT, cmp, cal, frota: V.length, hor, mesLab: meses.map(([a]) => MESES[+a.slice(5, 7) - 1]), feitos, nfs, porV, ads, venc, cor, cls, sisP, sisA, eqP, eqA, rep, trocas, lubV, lubMes, lubSitu, ens, doca, geradoEm: new Date().toLocaleString('pt-BR') };
}
// ---------- textos e peças do documento ----------
const rmeP = v => v == null ? '—' : Math.round(v) + '%';
const rmeH = (v, d) => v == null ? '—' : nf(v, d == null ? 0 : d) + ' h';
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
    if (soma) g += `<text x="${E - 6}" y="${H - 8}" text-anchor="end" font-size="8.5" fill="${AC}">acumulado</text>`; }
  const leg = [[NV, o.leg || 'no mês']].concat(o.acum ? [[AC, o.acum === 'pareto' ? '% acumulado' : 'acumulado no ano']] : []).map(([c, t]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><i style="display:inline-block;width:10px;height:${c === NV ? 8 : 2}px;background:${c}"></i>${t}</span>`).join('');
  return `<div class="gr"><svg viewBox="0 0 ${W} ${H}" style="display:block;margin:0 auto;width:${Math.round(W * 1.15)}px;max-width:100%">${g}</svg><div class="lg2" style="max-width:${Math.round(W * 1.15)}px;margin:0 auto">${leg}</div></div>`;
}
function rmeBarH(L, lim, mxF) {   // L = [rótulo, valor, cor, texto]; barras horizontais finas e juntas (Supervisor, 28/10/2026), ordem dada
  const W = 700, E = 150, D = 150, lh = 11, H = 24 + L.length * lh, mx = mxF || Math.max(1, (lim || 0) * 5), X = v => E + (W - E - D) * Math.min(1, v / mx);   // escala até 5× a referência: o motor com dezenas de milhares de horas não esmaga os outros
  let g = `<line x1="${E}" x2="${E}" y1="16" y2="${H - 4}" stroke="#1F2A44" stroke-width=".8"/>`;
  if (lim) g += `<line x1="${X(lim)}" x2="${X(lim)}" y1="14" y2="${H - 4}" stroke="#B06000" stroke-dasharray="4 3" stroke-width=".8"/><text x="${X(lim)}" y="10" text-anchor="middle" font-size="8.5" fill="#B06000">critério de programação: ${nf(lim)} h</text>`;
  L.forEach(([lab, v, cor, tx], i) => { const y = 18 + i * lh; g += `<text x="${E - 6}" y="${y + 7.5}" text-anchor="end" font-size="8.5" fill="#202124">${esc(lab)}</text>`;
    if (v != null) g += `<rect x="${E}" y="${y + 1}" width="${Math.max(1.5, X(v) - E)}" height="7.5" fill="${cor}"/>`; g += `<text x="${(v != null ? X(v) : E) + 5}" y="${y + 7.5}" font-size="8.5" fill="#3C4043">${esc(tx)}</text>`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>`;
}
// preventiva × corretiva em OMs (uma OM = uma intervenção; Supervisor, 28/10/2026): por serviço a corretiva some (uma OM preventiva junta
// dezenas de serviços) e por horas não dá (a preventiva não registra duração); barra 100% do período e do ano, com os serviços ao lado
function rmePxC(R) {
  const L = [['No período', R.N.per], ['Acumulado no ano', R.N.ano]], W = 700, E = 120, D = 150, lh = 30, H = 10 + L.length * lh, X = f => E + (W - E - D) * f, NV = '#16244A', AC = '#B06000';
  let g = '';
  L.forEach(([lab, n], i) => { const y = 8 + i * lh, tot = n.oms + n.cor, fp = tot ? n.oms / tot : 0, pp = Math.round(fp * 100);
    g += `<text x="${E - 8}" y="${y + 13}" text-anchor="end" font-size="9.5" fill="#202124">${lab}</text>`;
    if (!tot) { g += `<text x="${E}" y="${y + 13}" font-size="9" fill="#80868B">sem OMs registradas</text>`; return; }
    const xm = X(fp), seg = (x0, x1, cor, t) => x1 - x0 < 0.5 ? '' : `<rect x="${x0}" y="${y + 2}" width="${x1 - x0}" height="16" fill="${cor}"/>` + (x1 - x0 >= 70 ? `<text x="${(x0 + x1) / 2}" y="${y + 13.5}" text-anchor="middle" font-size="9" fill="#fff">${t}</text>` : '');
    g += seg(E, xm, NV, `${n.oms} OMs · ${pp}%`) + seg(xm, X(1), AC, `${n.cor} OMs · ${100 - pp}%`);
    const fora = [xm - E < 70 && n.oms ? `preventiva ${n.oms} · ${pp}%` : '', X(1) - xm < 70 && n.cor ? `corretiva ${n.cor} · ${100 - pp}%` : ''].filter(Boolean).join(' · ');
    g += `<text x="${X(1) + 6}" y="${y + 13}" font-size="9" fill="#3C4043">${fora || `${tot} OMs`}</text><text x="${X(1) + 6}" y="${y + 23}" font-size="8" fill="#5F6368">${nf(n.serv)} serviços preventivos</text>`; });
  const leg = [[NV, 'preventiva'], [AC, 'corretiva']].map(([c, t]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><i style="display:inline-block;width:10px;height:8px;background:${c}"></i>${t}</span>`).join('');
  const sem = R.N.ano.semOm ? `<p class="fo">${nf(R.N.ano.semOm)} serviços do ano sem nº de OM (registros antigos ou de exemplo) contam como uma OM por empurrador.</p>` : '';
  return `<div class="gr"><svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg><div class="lg2">${leg}</div>${sem}</div>`;
}
const rmeTab = (cab, L, w, cls) => `<table class="${cls || ''}"><thead><tr>${cab.map((c, i) => `<th${w && w[i] ? ` style="width:${w[i]}"` : ''}>${c}</th>`).join('')}</tr></thead><tbody>${L.length ? L.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cab.length}" class="mut">Nenhum registro.</td></tr>`}</tbody></table>`;
const rmeAn = s => `<p class="an"><b>Análise:</b> ${s}</p>`;
const rmeFonte = s => `<p class="fo">Fonte: ${s}</p>`;
function rmeConclusoes(R) {
  const p = R.N.per, a = R.N.ano, b = R.N.ant, L = [];
  L.push(`A aderência ao cronograma preventivo no período foi de <b>${rmeP(p.ad.ad)}</b> (acumulado no ano: ${rmeP(a.ad.ad)}), ${p.ad.ad == null ? 'sem serviços vencidos no período para medir' : p.ad.ad >= 90 ? 'dentro da referência de 90%' : '<b class="ruim">abaixo da referência de 90%</b>'}${b.ad.ad != null && p.ad.ad != null ? `; no período anterior foi de ${rmeP(b.ad.ad)}` : ''}.`);
  L.push(`Foram executados <b>${p.serv}</b> serviços preventivos em ${p.oms} OMs (${a.serv} serviços no ano)${p.nf ? `; ${p.nf} serviços não realizados, com justificativa registrada` : ''}.`);
  const top = R.eqP[0];
  L.push(p.cor ? `Foram registradas <b>${p.cor}</b> manutenções corretivas (${a.cor} no ano), com tempo total de reparo de ${rmeH(p.hPar, 1)} e MTTR de <b>${rmeH(p.mttr, 1)}</b> ${p.mttr == null ? '' : p.mttr <= 8 ? '(meta ≤ 8 h atendida)' : '<b class="ruim">(acima da meta de 8 h)</b>'}${top ? `; o equipamento com maior número de falhas foi <b>${esc(top[0])}</b> (${top[1]})` : ''}.` : `Não houve manutenção corretiva registrada no período (${a.cor} no ano).`);
  L.push(`A disponibilidade da frota no período foi de <b>${p.disp == null ? '—' : nf(p.disp, 1) + '%'}</b> (ano: ${a.disp == null ? '—' : nf(a.disp, 1) + '%'}), ${p.disp == null ? '' : p.disp >= 95 ? 'dentro da meta de 95%' : '<b class="ruim">abaixo da meta de 95%</b>'}.`);
  L.push(`Lubrificação: <b>${p.trocas}</b> trocas de óleo registradas no FR 049_B, com ${nf(p.litros)} L de óleo (${a.trocas} trocas e ${nf(a.litros)} L no ano)${R.lubSitu.filter(x => x[2] === 'vencida').length ? `; <b class="ruim">${R.lubSitu.filter(x => x[2] === 'vencida').length} trocas vencidas</b> na data da emissão` : ''}.`);
  L.push(`Os motores principais operaram <b>${nf(p.hMcp)} h</b> no período (${nf(a.hMcp)} h no ano)${p.sem ? `; ${p.sem} motores sem leitura de horímetro no período foram computados com 0 h` : ''}.`);
  return L;
}
// as seções: [nº, título, html]; tabelas com classe "qb" são quebradas entre folhas
// ---------- relatório gerencial (Supervisor, 27/10/2026: “quem vai ler 20 páginas?”): 2 folhas depois da capa ----------
function rmeGerencial(R, plano, FT) {
  const per = `${brD(R.ini)} a ${brD(R.fim)}`, p = R.N.per, a = R.N.ano, b = R.N.ant, V = id => esc(vName(id)), pc = (id, pos) => { const v = vessel(id); return esc(v ? posCurtoE(v, pos) : pos); };
  const dp = v => v == null ? '—' : nf(v, 1) + '%', k = (l, v, sub, st) => `<div class="${st || ''}"><i>${l}</i><b>${v}</b><small>${sub}</small></div>`;
  const totMes = R.mesLab.map((l, i) => [l, R.hor.reduce((t, x) => t + x.mes[i], 0)]), dias = Math.round((pD(R.fim) - pD(R.ini)) / 864e5) + 1;
  const G1 = `<p class="fo">Período ${per} · acumulado de 01/01 a ${brD(R.fim)} · ${R.frota} empurradores · período anterior = ${brD(rmeDia(R.ini, -dias))} a ${brD(rmeDia(R.ini, -1))}, mesmo número de dias</p>
    <div class="kp">${k('Aderência ao cronograma', rmeP(p.ad.ad), `ano ${rmeP(a.ad.ad)} · meta ≥ 90%`, p.ad.ad == null ? '' : p.ad.ad >= 90 ? 'ok' : 'bad')
      + k('Disponibilidade da frota', dp(p.disp), `ano ${dp(a.disp)} · meta ≥ 95%`, p.disp == null ? '' : p.disp >= 95 ? 'ok' : 'bad')
      + k('MTTR', rmeH(p.mttr, 1), `ano ${rmeH(a.mttr, 1)} · meta ≤ 8 h`, p.mttr == null ? '' : p.mttr <= 8 ? 'ok' : 'bad')
      + k('Manutenções corretivas', p.cor, `ano ${a.cor} · período anterior ${b.cor}`, p.cor > b.cor ? 'bad' : '')
      + k('Serviços preventivos executados', p.serv, `ano ${a.serv} · não realizados no prazo ${p.ad.ms}`, p.ad.ms ? 'bad' : 'ok')
      + k('Tempo total de reparo', rmeH(p.hPar, 1), `ano ${rmeH(a.hPar, 1)}`, '')
      + k('Trocas de óleo', p.trocas, `${nf(p.litros)} L · ano ${a.trocas}`, '')
      + k('Horas de operação · motores principais', nf(p.hMcp) + ' h', `ano ${nf(a.hMcp)} h`, '')}</div>
    <div class="g2"><div><h3>1.1 Aderência ao cronograma de manutenção preventiva</h3>${rmeGraf(R.mesLab.map((l, i) => [l, R.ads[i]]), { pct: true, meta: 90, fmt: v => Math.round(v) + '%', leg: 'aderência no mês' })}</div>
      <div><h3>1.2 Horas de operação dos empurradores</h3>${rmeGraf(totMes, { acum: 'soma', leg: 'horas no mês' })}</div></div>
    <h3>1.3 Manutenção preventiva × corretiva · ordens de manutenção (OMs)</h3>${rmePxC(R)}${rmeAn(p.oms + p.cor ? `${rmeP(p.oms / (p.oms + p.cor) * 100)} das intervenções do período foram preventivas (${p.oms} de ${p.oms + p.cor} OMs; ano: ${rmeP(a.oms + a.cor ? a.oms / (a.oms + a.cor) * 100 : null)}). A unidade é a OM porque cada uma é uma intervenção: contar por serviço esconderia a corretiva (uma OM preventiva reúne dezenas de serviços) e a preventiva não registra duração para comparar em horas.` : 'sem OMs registradas no período.')}
    <h3>1.4 Principais constatações</h3><ol class="cc">${rmeConclusoes(R).map(x => `<li>${x}</li>`).join('')}</ol>
    ${(plano.conc || '').trim() ? `<h3>1.5 Comentário do Supervisor</h3><div class="tx">${esc(plano.conc).replace(/\n/g, '<br>')}</div>` : ''}`;
  // seções separadas por tipo de manutenção (Supervisor, 27/10/2026: pendência de preventiva fica na preventiva, não junto da corretiva)
  const C = R.cor.slice(0, 8), pend = [];
  R.venc.slice().sort((x, y) => y[1] - x[1]).slice(0, 6).forEach(x => pend.push(['Serviços do plano vencidos', V(x[0]), `${x[1]} serviço${x[1] > 1 ? 's' : ''}: ${esc(x[2])}${x[1] > 5 ? '…' : ''}`]));
  R.lubSitu.filter(x => x[2] === 'vencida').forEach(x => pend.push(['Troca de óleo vencida', V(x[0]), esc(x[1])]));
  R.doca.filter(d => d[2] === 'venc' || (pD(d[1]) - pD(R.fim)) / 864e5 <= 180).forEach(d => pend.push([d[2] === 'venc' ? 'Docagem vencida' : 'Docagem a programar', V(d[0]), 'data-limite ' + brD(d[1])]));
  const exL = (k, nome) => R.exe ? rmeTab(['', 'Equipe própria', 'Prestador de serviço', 'Não informado', 'Ano: equipe própria', 'Ano: prestador'], [[nome, R.exe[k][0].prop, `<b>${R.exe[k][0].terc}</b>`, R.exe[k][0].ni, R.exe[k][1].prop, R.exe[k][1].terc]], ['22%', '14%', '16%', '14%', '17%', '17%']) : '';
  const tcL = tipo => { const L = (R.terc || []).filter(t => t[3] === tipo); return L.length ? rmeTab(['Data', 'Empurrador', 'OM', 'Empresa', 'Serviço'], L.map(t => [brD(t[0]), V(t[1]), esc(t[2] || '—'), `<b>${esc(t[4])}</b>`, esc(t[5])]), ['11%', '14%', '10%', '22%', '43%']) : `<p class="fo">Nenhuma ${tipo.toLowerCase()} executada por prestador no período.</p>`; };
  const A = (plano.acoes || []).filter(x => x && (x[0] || '').trim());
  const G2 = `<h3>2.1 Resultado do cronograma</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Serviços previstos', p.ad.prev, a.ad.prev], ['Executados no prazo', p.ad.ok, a.ad.ok], ['Executados com atraso', p.ad.lt, a.ad.lt], ['Não realizados no prazo', p.ad.ms, a.ad.ms], ['<b>Aderência ao cronograma</b> (meta ≥ 90%)', `<b>${rmeP(p.ad.ad)}</b>`, `<b>${rmeP(a.ad.ad)}</b>`], ['Serviços executados (total registrado)', p.serv, a.serv], ['OMs preventivas', p.oms, a.oms], ['Serviços não realizados, com justificativa', p.nf, a.nf]], ['50%', '25%', '25%'])}
    <h3>2.2 Execução: equipe própria e prestadores de serviço</h3>${exL('P', 'OMs preventivas')}${tcL('Preventiva')}
    <h3>2.3 Pendências na data da emissão</h3>${rmeTab(['Pendência', 'Empurrador', 'Situação'], pend, ['22%', '14%', '64%'])}`;
  const G2C = `<h3>3.1 Manutenções corretivas do período · ${R.cor.length}</h3>${rmeTab(['Início', 'Empurrador', 'OM', 'Equipamento', 'Criticidade', 'Tempo de reparo'], C.map(c => [brD(c[0].slice(0, 10)), V(c[1]), esc(c[2] || '—'), esc(c[4]), esc(c[5]), c[8] == null ? '<span class="mut">não liberada</span>' : rmeH(c[8], 1)]), ['11%', '15%', '11%', '37%', '12%', '14%'])}${R.cor.length > 8 ? `<p class="fo">E mais ${R.cor.length - 8} corretivas: lista completa no anexo técnico (A3).</p>` : ''}
    ${rmeTab(['', 'No período', 'Acumulado no ano'], [['Manutenções corretivas', p.cor, a.cor], ...R.cls.map(c => ['· criticidade ' + c[0], c[1], c[2]]), ['Tempo total de reparo', rmeH(p.hPar, 1), rmeH(a.hPar, 1)], ['MTTR (meta ≤ 8 h)', rmeH(p.mttr, 1), rmeH(a.mttr, 1)], ['Disponibilidade da frota (meta ≥ 95%)', p.disp == null ? '—' : nf(p.disp, 1) + '%', a.disp == null ? '—' : nf(a.disp, 1) + '%']], ['50%', '25%', '25%'])}
    <h3>3.2 Execução: equipe própria e prestadores de serviço</h3>${exL('C', 'Manutenções corretivas')}${tcL('Corretiva')}
    <h3>3.3 Equipamentos com maior número de falhas</h3><div class="g2"><div><p class="fo"><b>No período</b> · número de falhas por equipamento (Pareto)</p>${R.eqP.length ? rmeGraf(R.eqP.slice(0, 6), { acum: 'pareto', leg: 'número de falhas' }) : '<p class="mut">Sem corretivas no período.</p>'}</div>
      <div><p class="fo"><b>Acumulado no ano</b> · número de falhas por equipamento (Pareto)</p>${R.eqA.length ? rmeGraf(R.eqA.slice(0, 6), { acum: 'pareto', leg: 'número de falhas' }) : '<p class="mut">Sem corretivas no ano.</p>'}</div></div>
    ${R.eqT ? rmeTab(['Equipamento', 'Sistema', 'Falhas no período', 'Falhas no ano', 'Tempo de reparo no ano', 'MTTR no ano', 'Empurradores'], R.eqT.map(x => [`<b>${esc(x[0])}</b>`, esc(x[1] || '—'), x[2], `<b>${x[3]}</b>`, rmeH(x[4], 1), rmeH(x[5], 1), esc(x[6])]), ['20%', '17%', '9%', '9%', '11%', '9%', '25%']) : ''}
    ${R.rep.length ? rmeAn(`recorrência de falha no mesmo empurrador indica causa raiz não eliminada (NP 055 5.12): ${R.rep.map(x => `${V(x[0])} · ${esc(x[1])} (${x[2]} no ano)`).join('; ')}. Requer análise de causa raiz e revisão do plano preventivo.`) : ''}`;
  const sit = x => !x[3] ? '' : x[3] === 'atrasada' ? '<b class="ruim">Atrasada</b>' : x[3] === 'concluida' ? 'Concluída em ' + brD(x[5]) : 'No prazo';   // x = [ação, responsável, prazo, situação, nº, conclusão, evidência]
  const G6 = `<h3>6.1 Plano de ação · acompanhamento (PDCA)</h3>${A.some(x => x[3]) ? rmeTab(['Nº', 'Ação', 'Responsável', 'Prazo', 'Situação'], A.map(x => [esc(x[4] || ''), esc(x[0]) + (x[6] ? `<div class="mut">evidência: ${esc(x[6])}</div>` : ''), esc(x[1] || ''), x[2] ? brD(x[2]) : '', sit(x)]), ['11%', '47%', '16%', '10%', '16%'])
      + rmeAn(`${A.filter(x => x[3] === 'concluida').length} concluída(s), ${A.filter(x => x[3] === 'aberta').length} no prazo e ${A.filter(x => x[3] === 'atrasada').length} atrasada(s) na data de fechamento.`)
    : rmeTab(['Nº', 'Ação', 'Responsável', 'Prazo'], (A.length ? A : [['', '', ''], ['', '', ''], ['', '', '']]).map((x, i) => [i + 1, esc(x[0] || '') || '&nbsp;', esc(x[1] || ''), x[2] ? brD(x[2]) : '']), ['6%', '60%', '20%', '14%'])}
    <h3>6.2 Aprovação</h3><table class="ass"><thead><tr><th>Elaborado por · Supervisor de Manutenção</th><th>Aprovado por · Gerência</th></tr></thead><tbody><tr><td class="lin">Nome, assinatura e data</td><td class="lin">Nome, assinatura e data</td></tr></tbody></table>`;
  const L = R.fotos || [], fig = x => { const src = FT && FT[x[0] + '|' + x[1]];
    return `<figure>${src ? `<img src="${src}" alt="">` : `<div class="ph">${(S.recs.get(x[0]) || {}).seed ? 'foto de exemplo' : FT ? 'foto ainda não sincronizada (está no aparelho que registrou)' : 'foto'}</div>`}<figcaption><b>${esc(x[2] || 'FOTO')}</b> · ${V(x[3])} · OM ${esc(x[4] || '—')} · ${brD(x[5])}<br>${esc(x[6])}</figcaption></figure>`; };
  const PV = {}, grades = []; L.forEach(x => (PV[x[3]] = PV[x[3]] || []).push(x));   // por empurrador (ordem do nome) e, dentro dele, por data
  Object.keys(PV).sort((x, z) => vName(x).localeCompare(vName(z), 'pt-BR', { numeric: true })).forEach(vid => { const ord = (x, z) => x[5] < z[5] ? -1 : x[5] > z[5] ? 1 : String(x[1]).localeCompare(String(z[1]), 'en', { numeric: true });
    [['Manutenção preventiva', PV[vid].filter(x => x[6].startsWith('Preventiva'))], ['Manutenção corretiva', PV[vid].filter(x => !x[6].startsWith('Preventiva'))]].forEach(([tp, F]) => { F.sort(ord);   // por empurrador, separado em preventiva (inclui troca de óleo) e corretiva, em ordem de data
      for (let i = 0; i < F.length; i += 9) grades.push(`<h3>${V(vid)} · ${tp} · ${F.length} foto${F.length > 1 ? 's' : ''}${i ? ' (continuação)' : ''}</h3><div class="fg">${F.slice(i, i + 9).map(fig).join('')}</div>`); }); });
  const nP = new Set(L.filter(x => x[6].startsWith('Preventiva')).map(x => x[3] + '|' + x[4])).size, nC = new Set(L.filter(x => !x[6].startsWith('Preventiva')).map(x => x[3] + '|' + x[4])).size;
  const G3 = `<p class="fo">${L.length ? `${L.length} fotos de ${nP} OM${nP === 1 ? '' : 's'} preventiva${nP === 1 ? '' : 's'} e ${nC} corretiva${nC === 1 ? '' : 's'} do período (preventiva inclui as trocas de óleo do FR 049_B), antes e depois, por empurrador, separadas em preventiva e corretiva, em ordem de data. Originais no Google Drive (pasta do empurrador) e na OM do Sankhya.` : 'Nenhuma foto registrada no período. As fotos de antes e de depois são anexadas ao registrar a preventiva feita (3 · Executar) e a corretiva (4 · Corretivas).'}</p>${grades.join('')}`;
  const CM = (R.cmp || []).slice(), cor = st => st === 'fora' ? '#C5221F' : st === 'prog' ? '#B06000' : st === 'aten' ? '#E8A33D' : '#16244A', ST = { fora: 'Abaixo do limite de serviço', prog: 'Programar overhaul', aten: 'Em observação', ok: 'Dentro do especificado', sem: 'Sem ensaio registrado' };
  const comp = CM.filter(x => x[2] != null).sort((x, z) => (x[5] < 0 ? 1e9 : x[5] == null ? 9e8 : x[5]) - (z[5] < 0 ? 1e9 : z[5] == null ? 9e8 : z[5]) || x[2] - z[2]);
  const G4 = CM.length ? `<p class="fo">Último ensaio de compressão de cada motor de combustão principal (Mitsubishi S6R2). Pressão padrão ${nf(COMP.pad, 2)} MPa · limite de serviço ${nf(COMP.lim, 2)} MPa (Service Manual p. 2-3; abaixo dele, inspeção de overhaul, p. 4-4) · em observação abaixo de ${nf(COMP.aten, 2)} MPa ou com variação entre cilindros acima de ${nf(CMP.dif, 2)} MPa (critério interno, Anexo I 1.1.12). Vida remanescente estimada = regressão linear das três últimas medições da pressão mínima em função do horímetro, extrapolada até o limite de serviço.</p>
    <h3>3.1 Vida remanescente estimada até o limite de serviço (1,27 MPa)</h3>${rmeBarH(comp.map(x => [vName(x[0]) + ' · ' + pc(x[0], x[1]).replace(/&[^;]+;/g, ''), x[5] != null && x[5] >= 0 ? x[5] : null, cor(x[6]), x[6] === 'fora' ? 'abaixo do limite de serviço: overhaul' : x[5] == null ? 'sem projeção (ensaio único)' : x[5] < 0 ? 'sem tendência de queda' : '≈ ' + nf(x[5]) + ' h · ' + ST[x[6]].toLowerCase()]), CMP.projProg)}
    ${rmeAn(`${CM.filter(x => x[6] === 'fora').length} motor(es) abaixo do limite de serviço e ${CM.filter(x => x[6] === 'prog').length} com overhaul a programar (vida remanescente estimada inferior a ${nf(CMP.projProg)} h ou pressão mínima abaixo de ${nf(COMP.aten, 2)} MPa)${(() => { const f = comp.filter(x => x[6] === 'fora'), q = comp.find(x => x[6] !== 'fora' && x[5] != null && x[5] >= 0); return (f.length ? `; abaixo do limite de serviço: ${f.map(x => V(x[0]) + ' ' + pc(x[0], x[1])).join(', ')} (inspeção de overhaul)` : '') + (q ? `; a menor vida remanescente estimada é a de ${V(q[0])} ${pc(q[0], q[1])}, ≈ ${nf(q[5])} h` : ''); })()}.`)}
    <h3>3.2 Condição por motor</h3>${rmeTab(['Motor', 'Data do ensaio', 'Horímetro no ensaio', 'Pressão mínima', 'Pressão máxima', 'Variação entre cilindros', 'Vida remanescente estimada', 'Condição'], comp.concat(CM.filter(x => x[2] == null)).map(x => [`<b>${V(x[0])}</b> ${pc(x[0], x[1])}`, x[7] ? brD(x[7]) : '—', x[8] == null ? '—' : nf(x[8]) + ' h', x[2] == null ? '—' : nf(x[2], 2) + ' MPa', x[3] == null ? '—' : nf(x[3], 2) + ' MPa', x[4] == null ? '—' : nf(x[4], 2) + ' MPa', x[6] === 'fora' ? '<b class="ruim">esgotada</b>' : x[5] == null ? '—' : x[5] < 0 ? 'sem tendência de queda' : '≈ ' + nf(x[5]) + ' h', `<span style="color:${cor(x[6])};font-weight:700">${ST[x[6]] || ''}</span>`]), ['17%', '11%', '11%', '12%', '12%', '9%', '12%', '16%'])}` : '<p class="fo">Sem dados de compressão.</p>';
  const CL = R.cal || [], cST = { venc: 'Vencida', viag: 'Próxima do vencimento', ok: 'Dentro do intervalo', sem: 'Sem registro' }, cCor = st => st === 'venc' ? '#C5221F' : st === 'viag' ? '#B06000' : st === 'sem' ? '#9AA0A6' : '#16244A';
  const calNome = x => vName(x[0]) + ' · ' + pc(x[0], x[1]).replace(/&[^;]+;/g, ''), calOrd = L => L.slice().sort((x, z) => (x[3] == null ? 9e9 : x[3]) - (z[3] == null ? 9e9 : z[3]));
  const calBar = id => { const L = calOrd(CL.filter(x => x[2] === id)), iv = A1M[id] ? intervalo(A1M[id]).h || 1000 : 1000;
    return rmeBarH(L.map(x => [calNome(x), x[3] != null && x[3] > 0 ? x[3] : null, cCor(x[4]), x[3] == null ? 'sem registro de calibração' : x[3] <= 0 ? 'vencida há ' + nf(-x[3]) + ' h' : nf(x[3]) + ' h restantes']), 0, iv); };
  const calPar = (vid, pos, id) => CL.find(x => x[0] === vid && x[1] === pos && x[2] === id), motores = [...new Set(CL.map(x => x[0] + '|' + x[1]))].map(k => k.split('|'));
  const cel = x => x ? (x[3] == null ? '<span class="mut">sem registro</span>' : x[3] <= 0 ? `<b class="ruim">vencida há ${nf(-x[3])} h</b>` : `${nf(x[3])} h`) : '—', ult = x => x && x[5] ? brD(x[5]) + (x[6] != null ? ' · ' + nf(x[6]) + ' h' : '') : '—';
  const nV = id => CL.filter(x => x[2] === id && x[3] != null && x[3] <= 0).length, nQ = id => CL.filter(x => x[2] === id && x[3] != null && x[3] > 0 && x[3] <= 200).length;
  const G5 = CL.length ? `<p class="fo">Inspeção e ajuste da folga de válvulas (Anexo I 1.1.11) e inspeção e calibração dos bicos injetores (Anexo I 1.1.12) dos motores principais, a cada ${nf(A1M['1.1.11'] ? intervalo(A1M['1.1.11']).h : 1000)} h de operação. Horas restantes = intervalo − horas operadas desde a última calibração registrada (horímetro). Barra vermelha = vencida; âmbar = próxima do vencimento.</p>
    <h3>4.1 Folga de válvulas · horas restantes até a próxima calibração</h3>${calBar('1.1.11')}
    <h3>4.2 Bicos injetores · horas restantes até a próxima calibração</h3>${calBar('1.1.12')}
    ${rmeAn(`folga de válvulas: ${nV('1.1.11')} vencida(s) e ${nQ('1.1.11')} com até 200 h restantes · bicos injetores: ${nV('1.1.12')} vencida(s) e ${nQ('1.1.12')} com até 200 h restantes. Programar as calibrações vencidas e próximas na próxima janela no porto, junto com a compressão (Anexo I 1.1.12) quando coincidirem.`)}
    <h3>4.3 Condição por motor</h3>${rmeTab(['Motor', 'Válvulas · última calibração', 'Válvulas · horas restantes', 'Bicos · última calibração', 'Bicos · horas restantes'], motores.sort((x, z) => Math.min(...['1.1.11', '1.1.12'].map(id => { const c = calPar(x[0], x[1], id); return c && c[3] != null ? c[3] : 9e9; })) - Math.min(...['1.1.11', '1.1.12'].map(id => { const c = calPar(z[0], z[1], id); return c && c[3] != null ? c[3] : 9e9; }))).map(([vid, pos]) => { const a = calPar(vid, pos, '1.1.11'), b = calPar(vid, pos, '1.1.12'); return [`<b>${V(vid)}</b> ${pc(vid, pos)}`, ult(a), cel(a), ult(b), cel(b)]; }), ['20%', '21%', '19%', '21%', '19%'])}` : '<p class="fo">Sem dados de calibração.</p>';
  return [[1, 'Painel do período', G1], [2, 'Manutenção preventiva', G2], [3, 'Manutenção corretiva', G2C], [4, 'Compressão dos motores principais', G4.replace(/<h3>3\./g, '<h3>4.')], [5, 'Calibração dos motores principais', G5.replace(/<h3>4\./g, '<h3>5.')], [6, 'Plano de ação e aprovação', G6], [7, 'Evidências fotográficas', G3]];
}
// anexo técnico (opcional): as tabelas completas, seções A1 a A5
function rmeAnexo(R) {
  const per = `${brD(R.ini)} a ${brD(R.fim)}`, ano = `01/01 a ${brD(R.fim)}`, p = R.N.per, a = R.N.ano, b = R.N.ant, V = id => esc(vName(id)), pc = (id, pos) => { const v = vessel(id); return esc(v ? posCurtoE(v, pos) : pos); };
  const sv = id => A1M[id] ? esc(enxServ(A1M[id])) : esc(id), S1 = [];
  // 2 · operação
  const pil = L => `<div class="mr">${L.map(x => `<div>${x}</div>`).join('')}</div>`, obs = m => m[4] === 1 ? 'sem leitura no período' : m[4] === 3 ? 'leitura inconsistente desconsiderada' : m[4] === 2 ? 'a partir da primeira leitura' : '';
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
  S1.push([3, 'Manutenção preventiva', `<h3>3.1 Resultado do cronograma</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Serviços previstos', p.ad.prev, a.ad.prev], ['Executados no prazo', p.ad.ok, a.ad.ok], ['Executados com atraso', p.ad.lt, a.ad.lt], ['Não realizados dentro do prazo', p.ad.ms, a.ad.ms], ['<b>Aderência ao cronograma</b>', `<b>${rmeP(p.ad.ad)}</b>`, `<b>${rmeP(a.ad.ad)}</b>`], ['Serviços executados (total registrado)', p.serv, a.serv], ['OMs preventivas', p.oms, a.oms], ['Serviços não realizados, com motivo', p.nf, a.nf]], ['50%', '25%', '25%'])}
    <h3>3.2 Aderência mês a mês · ${R.ano}</h3>${rmeGraf(R.mesLab.map((l, i) => [l, R.ads[i]]), { pct: true, meta: 90, fmt: v => Math.round(v) + '%', leg: 'aderência no mês' })}${rmeAn(`${R.ads.filter(x => x != null && x < 90).length} de ${R.ads.filter(x => x != null).length} meses ficaram abaixo da referência de 90%; acumulado do ano: ${rmeP(a.ad.ad)}.`)}${rmeFonte('Cronograma preventivo (Anexo I) × serviços registrados com o nº da OM.')}
    <h3>3.3 Por empurrador</h3>${rmeTab(['Empurrador', 'Serviços no período', 'Serviços no ano', 'OMs no período', 'Não realizados', 'Aderência período', 'Aderência ano'], R.porV.map(x => [`<b>${V(x[0])}</b>`, x[1], x[2], x[3], x[6], rmeP(x[4]), rmeP(x[5])]), null, 'qb')}
    <h3>3.4 Atividades realizadas no período · ${OM.length} OMs · ${R.feitos.length} serviços</h3>${rmeTab(['Data', 'Empurrador', 'OM', 'Serviços executados', 'Executante'], OM.map(g => [brD(g.d), V(g.v), g.om ? esc(g.om) : '<span class="mut">sem nº</span>', Object.entries(g.E).map(([e, L]) => `<b>${esc(e)}:</b> ${L.join('; ')}`).join('<br>'), esc([...g.q].join(', '))]), ['9%', '11%', '9%', '57%', '14%'], 'qb sm')}
    <h3>3.5 Serviços não realizados, com o motivo</h3>${rmeTab(['Data', 'Empurrador', 'Serviço', 'Motivo', 'OM'], R.nfs.map(f => [brD(f[0]), V(f[1]), sv(f[2]), esc(f[3]), esc(f[4] || '—')]), ['10%', '13%', '37%', '30%', '10%'], 'qb sm')}
    <h3>3.6 Pendências na data da emissão</h3>${rmeTab(['Empurrador', 'Vencidos', 'Principais serviços'], R.venc.map(x => [`<b>${V(x[0])}</b>`, x[1], esc(x[2]) + (x[1] > 5 ? ` e mais ${x[1] - 5}` : '')]), ['18%', '10%', '72%'], 'qb sm')}`]);
  // 4 · corretiva
  S1.push([4, 'Manutenção corretiva', `<h3>4.1 Resultado</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Manutenções corretivas', p.cor, a.cor], ...R.cls.map(c => ['· classe ' + c[0], c[1], c[2]]), ['Tempo total de reparo', rmeH(p.hPar, 1), rmeH(a.hPar, 1)], ['MTTR (meta ≤ 8 h)', rmeH(p.mttr, 1), rmeH(a.mttr, 1)], ['Disponibilidade da frota (meta ≥ 95%)', p.disp == null ? '—' : nf(p.disp, 1) + '%', a.disp == null ? '—' : nf(a.disp, 1) + '%']], ['50%', '25%', '25%'])}
    <h3>4.2 Equipamentos com maior número de falhas · período</h3>${R.eqP.length ? rmeGraf(R.eqP, { acum: 'pareto', leg: 'número de falhas' }) + rmeAn(R.eqP[0][1] < 2 ? `nenhum equipamento teve mais de uma corretiva no período (${R.eqP.length} equipamentos, uma ocorrência cada).` : `${esc(R.eqP[0][0])} teve ${R.eqP[0][1]} corretivas e concentra ${Math.round(R.eqP[0][1] / p.cor * 100)}% das corretivas do período.`) : '<p class="mut">Sem corretivas no período.</p>'}
    <h3>4.3 Equipamentos com maior número de falhas · acumulado no ano</h3>${R.eqA.length ? rmeGraf(R.eqA, { acum: 'pareto', leg: 'número de falhas' }) + rmeAn(`os ${Math.min(3, R.eqA.length)} primeiros equipamentos somam ${Math.round(R.eqA.slice(0, 3).reduce((s, x) => s + x[1], 0) / a.cor * 100)}% das corretivas do ano.`) : '<p class="mut">Sem corretivas no ano.</p>'}${rmeFonte('corretivas registradas no SMF (Anexo II-A).')}
    <h3>4.4 Por sistema</h3>${rmeTab(['Sistema', 'No período', 'Acumulado no ano'], R.sisA.map(([s, n]) => [esc(s), (R.sisP.find(x => x[0] === s) || [0, 0])[1], n]), ['60%', '20%', '20%'], 'qb')}
    <h3>4.5 Falhas repetidas no ano (mesmo equipamento, 2 ou mais corretivas)</h3>${rmeTab(['Empurrador', 'Equipamento', 'Corretivas no ano'], R.rep.map(x => [V(x[0]), esc(x[1]), `<b class="ruim">${x[2]}</b>`]), ['30%', '50%', '20%'], 'qb')}${R.rep.length ? rmeAn('falha repetida indica causa não eliminada: avaliar a análise de causa e a revisão do plano preventivo (NP 055 5.12).') : ''}
    <h3>4.6 Atividades realizadas no período · ${R.cor.length}</h3>${rmeTab(['Início', 'Empurrador · OM', 'Equipamento · criticidade', 'Ocorrência', 'Intervenção executada', 'Tempo de reparo'], R.cor.map(c => [brD(c[0].slice(0, 10)) + (c[0].length > 10 ? ' ' + c[0].slice(11, 16) : ''), V(c[1]) + '<br>OM ' + esc(c[2] || '—'), esc(c[4]) + '<br><span class="mut">' + esc(c[3]) + ' · ' + esc(c[5]) + '</span>', esc(c[6]), esc(c[7]), c[8] == null ? '<span class="mut">não liberada</span>' : rmeH(c[8], 1)]), ['10%', '12%', '18%', '25%', '27%', '8%'], 'qb sm')}`]);
  // 5 · lubrificação
  S1.push([5, 'Lubrificação', `<h3>5.1 Resultado</h3>${rmeTab(['', 'No período', 'Acumulado no ano'], [['Trocas de óleo (FR 049_B)', p.trocas, a.trocas], ['Óleo utilizado nas trocas', nf(p.litros) + ' L', nf(a.litros) + ' L'], ['Trocas com filtro', p.filtros, a.filtros], ['Complementos de nível', nf(p.compL, 1) + ' L', nf(a.compL, 1) + ' L']], ['50%', '25%', '25%'])}
    <h3>5.2 Óleo utilizado nas trocas, mês a mês · ${R.ano}</h3>${rmeGraf(R.mesLab.map((l, i) => [l, R.lubMes[i]]), { acum: 'soma', fmt: v => nf(v) + ' L', leg: 'litros no mês' })}${rmeAn(`${nf(a.litros)} L no ano, média de ${nf(a.litros / Math.max(1, R.mesLab.length))} L por mês.`)}${rmeFonte('FR 049_B registrados no SMF (Óleo).')}
    <h3>5.3 Por empurrador</h3>${rmeTab(['Empurrador', 'Trocas no período', 'Trocas no ano', 'Litros no período', 'Litros no ano'], R.lubV.map(x => [`<b>${V(x[0])}</b>`, x[1], x[2], nf(x[3]), nf(x[4])]), null, 'qb')}
    <h3>5.4 Trocas realizadas no período · ${R.trocas.length}</h3>${rmeTab(['Data', 'Empurrador', 'Equipamento', 'Óleo', 'Litros', 'Filtros', 'Horímetro', 'OM'], R.trocas.map(t => [brD(t[0]), V(t[1]), esc(t[2]), esc(t[3]), nf(t[4], 1), esc(t[5] || '—'), t[6] === '' ? '—' : nf(t[6]) + ' h', esc(t[7] || '—')]), ['9%', '12%', '20%', '14%', '8%', '13%', '12%', '12%'], 'qb sm')}
    <h3>5.5 Trocas vencidas ou próximas na data da emissão</h3>${rmeTab(['Empurrador', 'Equipamento', 'Situação', 'Detalhe'], R.lubSitu.map(x => [V(x[0]), esc(x[1]), x[2] === 'vencida' ? '<b class="ruim">vencida</b>' : 'próxima', esc(x[3])]), ['18%', '30%', '14%', '38%'], 'qb sm')}`]);
  // 6 · condição
  const res = e => e[4] < COMP.lim ? '<b class="ruim">abaixo do limite de serviço</b>' : e[4] < COMP.aten || e[6] > CMP.dif ? '<b style="color:#B06000">em observação</b>' : 'dentro do especificado';
  S1.push([6, 'Condição dos equipamentos', `<h3>6.1 Compressão dos motores principais</h3><p>Ensaios no período: <b>${p.ensaios}</b> · acumulado no ano: <b>${a.ensaios}</b>. Critério: padrão ${nf(COMP.pad, 2)} MPa e limite ${nf(COMP.lim, 2)} MPa (Service Manual S6R2, p. 2-3); atenção abaixo de ${nf(COMP.aten, 2)} MPa ou diferença entre cilindros acima de ${nf(CMP.dif, 2)} MPa (critério interno, Anexo I 1.1.12).</p>
    ${rmeTab(['Data', 'Empurrador', 'Motor', 'Horímetro', 'Pressão mínima', 'Pressão máxima', 'Variação entre cilindros', 'Condição'], R.ens.map(e => [brD(e[0]), V(e[1]), pc(e[1], e[2]), e[3] == null ? '—' : nf(e[3]) + ' h', nf(e[4], 2) + ' MPa', nf(e[5], 2) + ' MPa', nf(e[6], 2), res(e)]), null, 'qb sm')}
    <h3>6.2 Docagens nos próximos 12 meses</h3>${rmeTab(['Empurrador', 'Data-limite', 'Origem', 'Situação'], R.doca.map(d => [V(d[0]), brD(d[1]), esc(d[3]), d[2] === 'venc' ? '<b class="ruim">vencida</b>' : 'a programar']), ['25%', '20%', '35%', '20%'], 'qb')}`]);
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
 table.ass{margin-top:12px}.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px}.fg figure{margin:0;border:1px solid #E1E6ED;padding:3px;break-inside:avoid}.fg img,.fg .ph{width:100%;height:56mm;object-fit:cover;display:block}.fg .ph{display:flex;align-items:center;justify-content:center;background:#F4F6F9;color:#80868B;font-size:9px;text-align:center;padding:8px}.fg figcaption{font-size:8.2px;color:#3C4043;padding-top:3px;line-height:1.3}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.g2 h3{margin-top:6px}
 /* linhas finas (Supervisor, 27/10/2026): na impressão o navegador não faz linha abaixo de 1 px e a sombra de 0,5 px sai borrada;
 a leveza vem de réguas só horizontais em cinza bem claro, sem grade vertical nem quadro em volta */
 th,td{border:0;border-bottom:1px solid #E6EAF0}th{border-bottom:0}.capa table.dd td{border-bottom:1px solid #E6EAF0}
 .dc{border:1px solid #CFD6E0;box-shadow:none;margin:0 0 7mm}.dc>div+div{border-left:1px solid #CFD6E0;box-shadow:none}.ft{border-top:1px solid #CFD6E0}
 .an{border:0;background:#F5F7FA;border-left:2px solid #1F2A44}.tx{border:1px solid #E1E6ED}.mr>div{box-shadow:none;border-bottom:1px solid #EEF1F5}.mr>div:last-child{border-bottom:0}
 table.hv>tbody>tr>td{border-bottom:1px solid #CFD6E0}
 /* títulos: seção com número em quadro azul-marinho e régua; subtítulo com o número em destaque, sem linha */
 h2{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;color:#1F2A44;margin:4px 0 10px;padding:0 0 6px;border:0;border-bottom:1px solid #1F2A44;letter-spacing:0}
 h2 .nu{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;background:#1F2A44;color:#fff;font-size:14px}
 h3{font-size:11.8px;font-weight:700;color:#1F2A44;margin:13px 0 5px;padding:0;border:0}h3 .n3{color:#B06000;margin-right:7px}`;
// documento completo: as folhas são montadas na janela de impressão (o script mede e quebra as tabelas)
function rmeDoc(R, plano, emi, anexo, FT) {
  const num = emi ? emi.num : 'PRÉVIA', per = `${brD(R.ini)} a ${brD(R.fim)}`, sec = rmeGerencial(R, plano, FT).concat(anexo ? rmeAnexo(R) : []), cab = docCab('RELATÓRIO GERENCIAL DE MANUTENÇÃO', `Frota de Empurradores · ${per} · ${esc(num)}`, 'NP Navecunha 055 · itens 7.3 e 9');
  const foot = `Plano de Gestão de Manutenção · Empurradores Fluviais · ${esc(num)}`;
  const capa = `<div class="pg capa"><div class="lg"><img src="${docLogo('nav')}" alt=""><img src="${docLogo('vda')}" alt=""></div>
    <div class="tt"><h1>Relatório Gerencial de Manutenção</h1><div class="s">Frota de Empurradores</div>${emi ? '' : '<div class="prev">PRÉVIA · documento não emitido</div>'}</div>
    <div><table class="dd"><tr><td>Relatório nº</td><td>${esc(num)}</td></tr><tr><td>Período</td><td>${per}</td></tr><tr><td>Acumulado do ano</td><td>01/01/${R.ano} a ${brD(R.fim)}</td></tr>
    <tr><td>Elaborado por</td><td>${esc(emi ? emi.por : (S.session || {}).name || '')} · Supervisor de Manutenção</td></tr><tr><td>Data de emissão</td><td>${esc(emi ? emi.em : 'não emitido')}</td></tr>
    <tr><td>Conteúdo</td><td>Painel do período · manutenção preventiva · manutenção corretiva · compressão · calibração de válvulas e bicos injetores · plano de ação · evidências fotográficas${anexo ? ' · anexo técnico (A1 a A5)' : ''}</td></tr><tr><td>Base normativa</td><td>NP Navecunha 055 · itens 7.3 e 9</td></tr><tr><td>Distribuição</td><td>Gerência</td></tr></table>
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
async function rmeFotos(R) {   // referência → imagem: a do registro (aparelho que fotografou) ou a cópia do Drive pelo servidor
  const FT = {}; for (const x of R.fotos || []) { const r = S.recs.get(x[0]); if (!r) continue;
    const g = typeof x[1] === 'string' ? x[1][0] : null, i = g ? +x[1].slice(1) : x[1], f = g ? { src: ((r.fotosLocais || {})[g] || [])[i], fid: ((r.fotosFid || {})[g] || [])[i] } : (r.fotos || [])[i]; if (!f) continue;
    if (f.src) FT[x[0] + '|' + x[1]] = f.src;
    else if (f.fid && S.url && S.session) { try { const j = await api('getFile', { fileId: f.fid }); if (j.ok) FT[x[0] + '|' + x[1]] = 'data:' + (j.mime || 'image/jpeg') + ';base64,' + j.data; } catch (e) { } } }
  return FT;
}
async function rmeAbrir(R, plano, emi, anexo) { const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para abrir o relatório.');
  w.document.write('<p style="font:14px Arial;padding:24px">Montando o relatório e buscando as fotos…</p>'); const FT = await rmeFotos(R); w.document.open(); w.document.write(rmeDoc(R, plano, emi, anexo, FT)); w.document.close(); }
// ---------- emitidos (congelados em partes) ----------
const rmeEmitidos = () => recs('snap').filter(s => s.tipo === 'relmes' && !s.excluido).sort((a, b) => (b.at || 0) - (a.at || 0));
function rmeLer(s) { const P = recs('snap').filter(x => x.tipo === 'relmes-p' && x.pai === s.id).sort((a, b) => a.i - b.i); if (P.length !== s.partes) return null; try { return JSON.parse(P.map(x => x.txt).join('')); } catch (e) { return null; } }
async function rmeEmitir(forcar) {
  if (!can.admin()) return toast('Só o Supervisor emite o relatório.'); if (RME.ini > RME.fim) return toast('A data inicial é depois da final.');
  const CK = pcmChecklist(RME.ini, RME.fim).filter(c => !c.ok);
  if (CK.length && !forcar) { modal(`<h2>Checklist de fechamento · ${CK.length} pendência${CK.length > 1 ? 's' : ''}</h2><p class="note">O relatório sai com os dados como estão. Resolva antes ou emita assim mesmo (as pendências ficam registradas na emissão).</p>
    <ul>${CK.map(c => `<li><b>${esc(c.t)}</b>: ${c.d}</li>`).join('')}</ul><div class="row end"><button class="mbtn" data-close>Voltar e resolver</button><button class="mbtn pri" id="rmeForca">Emitir assim mesmo</button></div>`); $('#rmeForca').onclick = () => { closeModal(); rmeEmitir(true); }; return; }
  const R = rmeDados(RME.ini, RME.fim), pl = rmePlano(), base = 'RM-' + RME.fim.slice(0, 7), n = rmeEmitidos().filter(s => s.num.split('-r')[0] === base).length;
  const txt = JSON.stringify(R), id = uid('snap'), partes = Math.ceil(txt.length / 28000);
  const s = { id, kind: 'snap', tipo: 'relmes', date: isoD(hoje()), at: Date.now(), num: base + (n ? '-r' + n : ''), ini: RME.ini, fim: RME.fim, em: new Date().toLocaleString('pt-BR'), por: S.session.name, partes, plano: pl, anexo: !!RME.anexo, pend: CK.map(c => c.t + ': ' + c.d.replace(/<[^>]+>/g, '')) };
  if (JSON.stringify(s).length > 45000) return toast('Texto das conclusões grande demais. Encurte e emita de novo.');
  for (let i = 0; i < partes; i++) await saveRec({ id: id + '-p' + i, kind: 'snap', tipo: 'relmes-p', pai: id, i, txt: txt.slice(i * 28000, (i + 1) * 28000), date: s.date });
  await saveRec(s); rmeAbrir(R, pl, s, s.anexo); render();
}
// ---------- tela 5 · Relatório mensal ----------
function vRme() {
  const R = rmeDados(RME.ini, RME.fim), p = R.N.per, a = R.N.ano, E = rmeEmitidos(), O = enxEmitidos(), pl = rmePlano();
  const at = (k, t) => `<button class="cm-chip" data-rmeat="${k}">${t}</button>`, K = (l, x, y, c) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${x}</b><small class="note" style="display:block;margin-top:2px">no ano: ${y}</small></div>`;
  return enxCab('4.2 Relatório gerencial mensal', 'Relatório gerencial para a Gerência: capa, painel do período e pontos de atenção (3 folhas) · cada número no período e no acumulado do ano · anexo técnico só quando marcado · “Emitir” numera e congela a cópia',
     `<label class="f">De<input type="date" id="rmeI" value="${RME.ini}"></label><label class="f">Até<input type="date" id="rmeF" value="${RME.fim}" max="${isoD(hoje())}"></label><label class="row" style="gap:6px;align-self:end"><input type="checkbox" id="rmeX"${RME.anexo ? ' checked' : ''}> Incluir anexo técnico</label><button class="mbtn" data-rmeprev>Prévia</button><button class="mbtn pri" data-rmeem>Emitir e imprimir</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + `<div class="card"><h2>Período ${brD(R.ini)} a ${brD(R.fim)}</h2><div class="cm-chips" style="margin-bottom:8px">${at('mes', 'Este mês')}${at('ant', 'Mês passado')}${at('tri', 'Últimos 3 meses')}${at('ano', 'Ano até hoje')}</div>
     <div class="f2-ks">${K('Aderência ao cronograma', rmeP(p.ad.ad), rmeP(a.ad.ad), p.ad.ad == null ? '' : p.ad.ad >= 90 ? 'var(--okt)' : 'var(--badt)') + K('Serviços preventivos', p.serv, a.serv) + K('Não realizados', p.nf, a.nf, p.nf ? 'var(--warnt)' : '') + K('Corretivas', p.cor, a.cor, p.cor ? 'var(--warnt)' : '') + K('MTTR', rmeH(p.mttr, 1), rmeH(a.mttr, 1), p.mttr == null ? '' : p.mttr <= 8 ? 'var(--okt)' : 'var(--badt)') + K('Disponibilidade', p.disp == null ? '—' : nf(p.disp, 1) + '%', a.disp == null ? '—' : nf(a.disp, 1) + '%') + K('Trocas de óleo', p.trocas, a.trocas) + K('Horas de MCP', nf(p.hMcp), nf(a.hMcp))}</div>
     ${p.sem ? `<p class="note">${p.sem} motores sem leitura de horímetro no período entram com 0 h e o aviso “sem leitura”. Motor parado: lance a mesma leitura em <a href="#enxhor">1 · Horímetros</a> (“Não operou”).</p>` : ''}</div>
   ${pcmChecklistCard(RME.ini, RME.fim, R)}
   <div class="card"><h2>Comentário do Supervisor e plano de ação</h2><p class="note">O comentário fica gravado na planilha para este período (qualquer aparelho) e vai congelado na emissão.</p>
     <label class="f">Comentário do Supervisor (análise crítica do período)<textarea id="rmeC" rows="4" placeholder="o que os números mostram, causas, riscos e decisões">${esc(pl.conc || '')}</textarea></label>
     <p class="note">Plano de ação no relatório: ${pl.acoes.length ? `${pl.acoes.length} ação(ões) · ${pl.acoes.filter(x => x[3] === 'atrasada').length} atrasada(s)` : 'nenhuma ação no período'} · cadastre e conclua em <a href="#enxacao">4.1 Plano de ação</a>.</p></div>
   <div class="card"><h2>O que sai no relatório</h2><ol class="note" style="margin:0;padding-left:18px;line-height:1.6"><li><b>Capa</b> · nº, período, elaboração e distribuição</li><li><b>1 Painel do período</b> · 8 indicadores (período, ano e meta), aderência e horas de operação, constatações e o seu comentário</li><li><b>2 Manutenção preventiva</b> · resultado do cronograma, execução por equipe própria e prestador, pendências (serviços do plano e óleo vencidos, docagem)</li><li><b>3 Manutenção corretiva</b> · corretivas do período, tempo de reparo, MTTR, disponibilidade, execução por equipe própria e prestador, equipamentos com maior número de falhas (período e ano), recorrência</li><li><b>4 Compressão</b> · vida remanescente até o overhaul de cada MCP</li><li><b>5 Calibração</b> · horas restantes de válvulas e bicos injetores</li><li><b>6 Plano de ação e aprovação</b></li><li><b>7 Evidências fotográficas</b> · antes e depois, por empurrador e por data</li><li class="mut">Anexo técnico (só se marcado): A1 operação por motor · A2 preventiva por OM · A3 corretiva · A4 lubrificação · A5 condição</li></ol></div>
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
    if (i.id === 'rmeC') { const p = rmePlano(); p.conc = i.value; rmePlanoSalvar(p); } };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_enxrel2_lay', '[data-enxreset]'); };
