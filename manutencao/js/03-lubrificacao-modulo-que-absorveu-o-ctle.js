/* =====================================================================
   LUBRIFICAÇÃO · módulo que absorveu o CTLE_LUB
   FR 049_B digital (troca de óleo, filtros e fluidos) → atualiza o último serviço do item do Anexo I
   e o horímetro (um só para o sistema todo). Consumo de óleo, complementos, resíduos (FR 016_E),
   previsão das próximas trocas e plano de lubrificação da matriz técnica.
   ===================================================================== */
'use strict';
const LUB_PLANO = [{"sys": "MCP", "sysName": "Motores principais", "fam": "A", "eq": "Mitsubishi S6R2-T2MPTK", "cj": ["2", "", "1", "", "", "", "", "", "", "", "", ""], "qtd": "3", "ivH": "350 h", "ivT": "6 meses", "lub": "SAE 15W-40, API CF ou superior", "brands": "Mobil Delvac Modern 15W-40 Super Defense; Shell Rimula R4 X 15W-40; Lubrax Top Turbo 15W-40; Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "140 L", "carterSub": "", "carterN": 140, "carterEst": false, "carterWarn": []}, {"sys": "MCP", "sysName": "Motores principais", "fam": "B", "eq": "Mitsubishi S6R-T2MPTK2", "cj": ["", "2", "", "2", "", "", "", "", "", "", "", "2"], "qtd": "6", "ivH": "350 h", "ivT": "6 meses", "lub": "SAE 15W-40, API CF ou superior", "brands": "Mobil Delvac Modern 15W-40 Super Defense; Shell Rimula R4 X 15W-40; Lubrax Top Turbo 15W-40; Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "140 L", "carterSub": "", "carterN": 140, "carterEst": false, "carterWarn": []}, {"sys": "MCP", "sysName": "Motores principais", "fam": "C", "eq": "Mitsubishi S6R2MPTK3", "cj": ["", "", "", "", "1", "1", "1", "", "", "", "", ""], "qtd": "3", "ivH": "350 h", "ivT": "6 meses", "lub": "SAE 15W-40, API CF ou superior", "brands": "Mobil Delvac Modern 15W-40 Super Defense; Shell Rimula R4 X 15W-40; Lubrax Top Turbo 15W-40; Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "140 L", "carterSub": "", "carterN": 140, "carterEst": false, "carterWarn": []}, {"sys": "MCP", "sysName": "Motores principais", "fam": "D", "eq": "Mitsubishi S6R2-T2MPTK3M", "cj": ["", "", "", "", "", "", "", "1", "1", "2", "2", ""], "qtd": "6", "ivH": "350 h", "ivT": "6 meses", "lub": "SAE 15W-40, API CF ou superior", "brands": "Mobil Delvac Modern 15W-40 Super Defense; Shell Rimula R4 X 15W-40; Lubrax Top Turbo 15W-40; Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "140 L", "carterSub": "", "carterN": 140, "carterEst": false, "carterWarn": []}, {"sys": "CRP", "sysName": "Redução", "fam": "H", "eq": "Hitachi MGN91BL", "cj": ["", "", "", "", "1", "1", "1", "", "1", "2", "2", ""], "qtd": "8", "ivH": "1.000 h", "ivT": "12 meses", "lub": "SAE 30 (ISO VG 100)", "brands": "Shell Gadinia 30; Mobilgard 312", "sankhya": "—", "ivWarn": [], "carter": "40–60 L", "carterSub": "estimado · completar pela vareta", "carterN": 50, "carterEst": true, "carterWarn": ["Estimativa (não oficial). A Hitachi Nico não publica o volume do MGN91BL; o exato consta no desenho General View. Completar pela vareta: motor em lenta alguns minutos, desligar e medir na hora; nível entre H e L."]}, {"sys": "CRP", "sysName": "Redução", "fam": "M", "eq": "Masson Marine MMW3700", "cj": ["", "2", "", "2", "", "", "", "1", "", "", "", "2"], "qtd": "7", "ivH": "2.500 h", "ivT": "12 meses", "lub": "SAE 30 (padrão); SAE 40 (severo/tropical)", "brands": "Mobil Delvac 1330 / 1340; Shell Gadinia 30 / 40", "sankhya": "—", "ivWarn": [], "carter": "≈ 65 L", "carterSub": "catálogo Masson · vareta c/ motor em lenta", "carterN": 65, "carterEst": false, "carterWarn": []}, {"sys": "CRP", "sysName": "Redução", "fam": "R", "eq": "Reintjes WAF 364", "cj": ["2", "", "1", "", "", "", "", "", "", "", "", ""], "qtd": "3", "ivH": "2.000 h", "ivT": "6 meses", "lub": "SAE 30 (ISO VG 100)", "brands": "Shell Gadinia AL 30; Shell Gadinia S3 30; Mobilgard 312; Castrol MHP 153", "sankhya": "—", "ivWarn": [], "carter": "38 L", "carterSub": "especificação Reintjes", "carterN": 38, "carterEst": false, "carterWarn": []}, {"sys": "MCA", "sysName": "Motores auxiliares", "fam": "Y1", "eq": "Yanmar 4TNV98-GGE", "cj": ["1", "", "1", "", "", "", "", "1", "", "1", "2", ""], "qtd": "6", "ivH": "250 h", "ivT": "6 meses", "lub": "SAE 15W-40 (API CI-4 / CH-4 / CJ-4)", "brands": "Mineral ou semissintético para serviço pesado · ex.: Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "10,5 L", "carterSub": "catálogo Yanmar · 5,5 L efetivo", "carterN": 5.5, "carterEst": false, "carterWarn": []}, {"sys": "MCA", "sysName": "Motores auxiliares", "fam": "M1", "eq": "MWM D229-3T", "cj": ["", "2", "", "2", "", "1", "", "", "", "", "", ""], "qtd": "5", "ivH": "250 h", "ivT": "6 meses", "lub": "SAE 15W-40 (API CI-4 / CH-4)", "brands": "Multiviscoso diesel (ex.: Rimula, Ursa, Delo, Ipiranga Brutus Alta Performance 15W-40 CI-4)", "sankhya": "—", "ivWarn": [], "carter": "8 L", "carterSub": "manual MWM 229 · com filtro", "carterN": 8, "carterEst": false, "carterWarn": []}, {"sys": "MCA", "sysName": "Motores auxiliares", "fam": "M2", "eq": "MWM D229-4", "cj": ["", "", "", "", "2", "", "", "", "", "", "1", "2"], "qtd": "5", "ivH": "250 h", "ivT": "6 meses", "lub": "SAE 15W-40 (API CI-4 / CH-4)", "brands": "Multiviscoso diesel · ex.: Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "10 L", "carterSub": "manual MWM 229 · com filtro", "carterN": 10, "carterEst": false, "carterWarn": []}, {"sys": "MCA", "sysName": "Motores auxiliares", "fam": "M3", "eq": "MWM D229-4NA", "cj": ["", "", "", "", "", "1", "1", "1", "2", "1", "", ""], "qtd": "6", "ivH": "250 h", "ivT": "6 meses", "lub": "SAE 15W-40 (API CI-4 / CH-4)", "brands": "Multiviscoso diesel · ex.: Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "10 L", "carterSub": "manual MWM 229 · com filtro", "carterN": 10, "carterEst": false, "carterWarn": []}, {"sys": "MCA", "sysName": "Motores auxiliares", "fam": "M4", "eq": "MWM L229-4", "cj": ["1", "", "", "", "", "", "1", "", "", "", "", ""], "qtd": "2", "ivH": "250 h", "ivT": "6 meses", "lub": "SAE 15W-40 (API CI-4 / CH-4)", "brands": "Multiviscoso diesel · ex.: Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "9 L", "carterSub": "manual MWM 229 (2000) · com filtro", "carterN": 9, "carterEst": false, "carterWarn": []}, {"sys": "MCA", "sysName": "Motores auxiliares", "fam": "Y2", "eq": "Yanmar NSB18", "cj": ["", "", "1", "", "", "", "", "", "", "", "", ""], "qtd": "1", "ivH": "100 h", "ivT": "6 meses", "lub": "SAE 15W-40 ou SAE 30/40 (API CF / CD / CI-4)", "brands": "Diesel multiviscoso ou monograu para serviço pesado · ex.: Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "3,4 L", "carterSub": "manual Yanmar NSB · troca a cada 100 h", "carterN": 3.4, "carterEst": false, "carterWarn": []}, {"sys": "EA", "sysName": "Equipamentos auxiliares", "fam": "HL", "eq": "Sistema hidráulico do leme", "cj": ["●", "●", "●", "●", "●", "●", "●", "●", "●", "●", "●", "●"], "qtd": "12 emb.", "ivH": "4.000 h", "ivT": "24 meses", "lub": "Óleo Hidráulico ISO VG 68", "brands": "Óleo hidráulico antidesgaste (tipo HM / AW 68)", "sankhya": "—", "ivWarn": [], "carter": "60–80 L", "carterSub": "média da frota", "carterN": 70, "carterEst": true, "carterWarn": []}, {"sys": "EA", "sysName": "Equipamentos auxiliares", "fam": "MP", "eq": "Motor de popa Yamaha 15 HP (rabeta)", "cj": ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"], "qtd": "12", "ivH": "100 h", "ivT": "12 meses", "lub": "Rabeta: SAE 90", "brands": "Motor 2 tempos: TC-W3 na mistura, reposição contínua, sem intervalo de troca", "sankhya": "—", "ivWarn": [], "carter": "0,25 L", "carterSub": "rabeta · manual Yamaha", "carterN": 0.25, "carterEst": false, "carterWarn": []}, {"sys": "EA", "sysName": "Equipamentos auxiliares", "fam": "MB", "eq": "Motobomba diesel Toyama TDWP50SXP", "cj": ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"], "qtd": "12", "ivH": "100 h", "ivT": "3 meses", "lub": "SAE 15W-40", "brands": "Diesel 4 tempos (ficha Toyama); 1ª troca com 20 h · ex.: Ipiranga Brutus Alta Performance 15W-40 CI-4", "sankhya": "—", "ivWarn": [], "carter": "0,8 L", "carterSub": "ficha técnica Toyama", "carterN": 0.8, "carterEst": false, "carterWarn": []}];
// formulários oficiais (FR 049_B, FR 016_E) ficam em forms/ como estão no original; o sw.js guarda os dois para abrir sem internet
const lubFormTxt = async arq => { try { const r = await fetch('forms/' + arq); if (!r.ok) throw new Error(r.status); return await r.text(); } catch (e) { toast('O formulário ' + arq.replace('.html', '').replace('_', ' ') + ' não abriu. Abra o SMF uma vez com internet e tente de novo.', 6000); throw e; } };
const OLEOS = [['SAE 15W-40', '#1F4466'], ['SAE 30', '#F9AB00'], ['SAE 40', '#2A9D8F'], ['Hidráulico ISO VG 68', '#7B5EA7'], ['Outros', '#9AA5B1']];
const OLEO_COR = Object.fromEntries(OLEOS);
function tipoOleo(s) {
  const t = String(s || '').toUpperCase().replace(/\s+/g, '');
  if (!t) return 'Outros';
  if (/15W/.test(t)) return 'SAE 15W-40';
  if (/HIDR|HYD|VG68|ISO68|HLP|AW68|HM68|^68$/.test(t)) return 'Hidráulico ISO VG 68';
  const a = t.search(/(^|[^0-9W])30($|[^0-9])/), b = t.search(/(^|[^0-9W])40($|[^0-9])/);
  if (a >= 0 && (b < 0 || a < b)) return 'SAE 30';
  if (b >= 0) return 'SAE 40';
  return 'Outros';
}
function litros(q) { let t = String(q == null ? '' : q).trim().replace(/\s/g, '').replace(/[lL]$/, ''); if (!t) return 0; t = t.indexOf(',') >= 0 ? t.replace(/\./g, '').replace(',', '.') : t; const n = parseFloat(t); return isFinite(n) && n > 0 ? n : 0; }
const nf1 = n => nf(n, n != null && Math.abs(n) < 10 && n % 1 ? 1 : 0);
const nomeLongo = n => String(n || '').replace(/^CJA /, 'Cap. José Alecrim ');
const nomeCurto = n => String(n || '').replace(/^Cap\. José Alecrim /, 'CJA ');
const vesselPorNome = n => S.cfg.frota.find(v => v.nome === nomeCurto(n));

/* ---------- equipamentos lubrificados de cada embarcação (ligados aos itens do Anexo I) ---------- */
const planoRow = f => LUB_PLANO.find(f);
const REV_PLANO = { HITACHI: 'Hitachi', MASSON: 'Masson', REINTJES: 'Reintjes' };
const REV_ITENS = { HITACHI: ['1.5.1'], MASSON: ['1.6.1', '1.6.2'], REINTJES: ['1.7.2'] };
function capDe(r) { return r ? { cap: r.carterN, est: !!r.carterEst, oleo: tipoOleo(r.lub), lub: r.lub, marcas: r.brands || '', carterTxt: r.carter || '', carterSub: r.carterSub || '' } : { cap: null, est: false, oleo: 'SAE 15W-40', lub: '', marcas: '', carterTxt: '', carterSub: '' }; }
function lubEquip(v) {
  if (!v) return [];
  const L = [], ps = mcpPos(v), mono = v.mcp === 'mono';
  ps.forEach((p, i) => L.push(Object.assign({ key: i ? 'mcp2' : 'mcp1', g: 'mcp', pos: p, nome: mono ? 'MCP' : 'MCP ' + p, mod: 'Mitsubishi ' + ((v.mcpMod || {})[p] || ''), itens: ['1.1.1'] }, capDe(planoRow(r => r.sys === 'MCP')))));
  ps.forEach((p, i) => { const r = v.rev[p]; if (!r) return; L.push(Object.assign({ key: i ? 'crp2' : 'crp1', g: 'crp', pos: p, nome: mono ? 'Reversor' : 'Reversor ' + p, mod: EQN[r] || r, itens: REV_ITENS[r] }, capDe(planoRow(x => x.sys === 'CRP' && x.eq.includes(REV_PLANO[r]))))); });
  MCAS.forEach((p, i) => { if (!v.mca[p]) return; const md = (v.mcaMod || {})[p] || EQN[v.mca[p]]; L.push(Object.assign({ key: i === 2 ? 'inc' : 'mca' + (i + 1), g: 'mca', pos: p, nome: i === 2 ? 'Motobomba de incêndio (MCA 3)' : 'MCA ' + (i + 1), mod: md, itens: [v.mca[p] === 'MWM' ? '3.1.3' : '3.2.9'] }, capDe(planoRow(x => x.sys === 'MCA' && x.eq === md)))); });
  L.push(Object.assign({ key: 'hid', g: 'hid', pos: 'UN', nome: 'Governo (hidráulico)', mod: 'Sistema hidráulico do leme', itens: ['2.1.8'] }, capDe(planoRow(x => /leme/i.test(x.eq)))));
  // motobomba de incêndio genérica (4.1.x) fora das listas de óleo; o motor do canhão do CJA XX é o MCA 3 (g: 'mca')
  if (A1M['11.1.2'] && aplica(v, 'UN', A1M['11.1.2'])) L.push(Object.assign({ key: 'popa', g: 'popa', pos: 'UN', nome: 'Motor de popa', mod: 'Yamaha 15 HP', itens: ['11.1.2'] }, capDe(planoRow(x => /popa/i.test(x.eq))), { oleo: 'Outros', lub: 'Rabeta SAE 90 · motor 2 tempos (mistura)' }));
  const R = L.filter(e => e.itens && e.itens.some(id => A1M[id] && aplica(v, e.pos, A1M[id])));
  if (v.placa) R.forEach(e => { const pl = v.placa[e.pos]; if (pl && e.g !== 'mcp' && e.g !== 'crp' && e.g !== 'popa' && e.g !== 'bomba') { e.placa = pl; e.mod = (e.mod || '') + ' · ' + placaTxt(pl); if (pl.fun) e.nome = e.nome + ' · ' + pl.fun; } });   // placa do motor (MCA e governo)
  return R;
}
const lubEq = (v, key) => lubEquip(v).find(e => e.key === key);
const lubHp = (v, e) => posHor(e.pos, A1M[e.itens[0]], v.id);
const lubSit = (v, e) => situacao(v, e.pos, A1M[e.itens[0]]);
let _hpdMemo = { n: -1, m: {} };
function horasDiaPos(vid, pos) {
  const e = horEst(vessel(vid), pos); if (e) return e.hd;   // MCA sem horímetro: a estimativa informada
  if (isMcp(pos)) return horasDia(vid);
  if (_hpdMemo.n !== S.recs.size) _hpdMemo = { n: S.recs.size, m: {} };
  const k = vid + '|' + pos; if (_hpdMemo.m[k] !== undefined) return _hpdMemo.m[k];
  const L = recs('hor').filter(r => r.vessel === vid && r.pos === pos).sort((a, b) => a.date < b.date ? -1 : 1);
  let t = MCAS.includes(pos) ? 8 : pos === 'POPA' ? 0.5 : 0.3;
  if (L.length > 1) { const b = L[L.length - 1], lim = isoD(new Date(pD(b.date).getTime() - 90 * 864e5)), a = L.find(r => r.date >= lim) || L[0], d = (pD(b.date) - pD(a.date)) / 864e5; if (d >= 7 && b.h > a.h) t = (b.h - a.h) / d; }
  return (_hpdMemo.m[k] = Math.max(0.05, Math.min(24, t)));
}
// dias até a troca (negativo = vencida) pelo que vier primeiro: horas (no ritmo do equipamento) ou data
function lubDias(v, e, s) {
  if (!s || s.st === 'sem' || s.st === 'cond') return null;
  let d = null;
  if (s.rest !== null && s.rest !== undefined) d = s.rest / horasDiaPos(v.id, lubHp(v, e));
  if (s.alvoD) { const dd = (s.alvoD - hoje()) / 864e5; d = d === null ? dd : Math.min(d, dd); }
  return d;
}
function lubDados() {
  const out = [];
  S.cfg.frota.forEach(v => lubEquip(v).forEach(e => { const t = A1M[e.itens[0]]; let s = situacao(v, e.pos, t); const saida = e.key === 'popa' || e.key === 'bomba';
    if (saida) s = typeof popaSit === 'function' ? popaSit(v, e, s) : Object.assign({}, s, { st: 'ok', txt: 'troca a cada saída do comboio' });   // sem horímetro: vale por saída (bloco "Motor de popa e motobomba 5 HP")
    const dias = lubDias(v, e, s), rate = horasDiaPos(v.id, lubHp(v, e));
    const horas = dias === null ? null : s.rest !== null && s.rest !== undefined && (!s.alvoD || s.rest <= ((s.alvoD - hoje()) / 864e5) * rate) ? s.rest : Math.round(dias * rate);
    out.push({ v, e, t, s, om: omAberta(v.id, e.pos, t.id), dias, horas, saida, porData: horas !== null && horas !== s.rest }); }));
  return out.filter(x => !foraOp(x.v));
}

/* ---------- lançamentos de óleo (trocas do FR 049_B + complementos) ---------- */
function lubLanc() {
  const o = [];
  recs('lub').forEach(r => {
    const nome = r.vessel ? vName(r.vessel) : nomeCurto(r.vNome || 'Sem embarcação');
    if (r.tipo === 'fr049') (r.eq || []).forEach(q => { if (q.status !== 'T') return; const L = litros(q.qtd); if (L) o.push({ r, vid: r.vessel, nome, date: r.date, tipo: 'troca', oleo: tipoOleo(q.oil), L, key: q.key }); });
    else if (r.tipo === 'comp') { const L = +r.L || 0; if (L) o.push({ r, vid: r.vessel, nome, date: r.date, tipo: 'comp', oleo: tipoOleo(r.oleo), L, key: r.key }); }
  });
  return o;
}
const fr049s = () => recs('lub').filter(r => r.tipo === 'fr049');
// NP 7.4: a troca é registrada no Anexo II-B (OM) e também no FR 049_B → liga os dois pelo nº da OM do Sankhya
const omDoFr = r => r && r.vessel ? oms().find(o => o.tipo === 'P' && o.vessel === r.vessel && String(o.num || '').trim() === String(r.om || '').trim()) : null;
const lubEmp = r => r.tipoEmb !== 'bal';   // balsas tanque seguem a NP 024: ficam no histórico, fora dos números da NP 055
async function lubLigarOM(rec) {
  const o = omDoFr(rec); if (!o) return null;
  if (o.status !== 'encerrada') {
    const T = (rec.eq || []).filter(q => q.status === 'T'), reg = Object.assign({}, o.reg || {});
    if (!(reg.fr049 || '').trim()) reg.fr049 = 'FR 049_B de ' + brD(rec.date) + ' (OM ' + rec.om + ')';
    if (!(reg.fr016 || '').trim() && (rec.residuos || {}).fr016) reg.fr016 = rec.residuos.fr016;
    if (!(reg.lote || '').trim()) { const l = T.filter(q => q.lot).map(q => q.name + ': ' + q.oil + ' lote ' + q.lot + ' validade ' + (q.val || '___')); if (l.length) reg.lote = l.join(' · '); }
    o.reg = reg; await saveRec(o);
  }
  return o;
}
// consumo de óleo do MCP pelos complementos (reposição de nível): L por 100 h, comparado com a frota
function lubConsumoMCP(dias) {
  dias = dias || 120; const ini = isoD(new Date(hoje().getTime() - dias * 864e5)), out = [];
  S.cfg.frota.forEach(v => mcpPos(v).forEach(p => {
    const C = recs('lub').filter(r => r.tipo === 'comp' && r.vessel === v.id && r.pos === p && r.date >= ini && (r.key || '').startsWith('mcp'));
    const L = C.reduce((a, r) => a + (+r.L || 0), 0);
    const a = horEm(v.id, p, ini) || recs('hor').filter(r => r.vessel === v.id && r.pos === p && r.date >= ini).sort((x, y) => x.date < y.date ? -1 : 1)[0], b = horAtual(v.id, p);
    const h = a && b && b.h > a.h ? b.h - a.h : null;
    out.push({ v, p, L, n: C.length, h, taxa: h && h >= 50 && C.length ? L / h * 100 : null });
  }));
  const tx = out.map(x => x.taxa).filter(x => x !== null).sort((a, b) => a - b), med = tx.length >= 3 ? tx[Math.floor(tx.length / 2)] : null;
  out.forEach(x => { x.st = x.taxa === null ? 'sem' : med && x.taxa > 2 * med ? 'venc' : med && x.taxa > 1.5 * med ? 'viag' : 'ok'; });
  return { out, med, dias };
}
// óleo para as trocas que vencem nos próximos N dias (capacidade da matriz técnica)

function lubBadge() { const n = lubDados().filter(x => x.s.st === 'venc' && !x.om).length; return n ? `<span class="n">${n}</span>` : ''; }

/* ---------- gráfico de barras empilhadas (litros por mês) ---------- */
function stackChart(labels, series, unit) {
  const tot = labels.map((_, i) => series.reduce((a, s) => a + (s.vals[i] || 0), 0)), mx0 = Math.max(...tot);
  if (!mx0) return '<div class="note">Sem lançamentos no período</div>';
  const top = tickNice(mx0 * 1.12), rgb = h => { const m = String(h || '').match(/^#?([0-9a-f]{6})$/i); if (!m) return GC.az; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(','); };
  return `<div class="dz-ch"><div class="dz-y">${[1, .75, .5, .25, 0].map(f => `<span>${nf(Math.round(top * f))}</span>`).join('')}</div>
   <div class="dz-pl">${[0, 1, 2, 3, 4].map(i => `<hr style="bottom:${i * 25}%">`).join('')}
   <div class="dz-gr">${labels.map((l, i) => `<div class="dz-g" data-tip="${esc(l)}: ${series.filter(s => s.vals[i]).map(s => s.nome + ' ' + nf1(s.vals[i]) + unit).join(' · ')} · total ${nf1(tot[i])}${unit}"><div class="dz-st" style="height:${tot[i] / top * 100}%"><span>${tot[i] ? nf(tot[i]) : ''}</span>${series.slice().reverse().map((s, k) => s.vals[i] ? `<i style="flex:${s.vals[i]};${vid(rgb(s.cor))}"></i>` : '').join('')}</div></div>`).join('')}</div></div>
   <div class="dz-x">${labels.map(l => `<span>${esc(l)}</span>`).join('')}</div></div>`;
}
const legOleos = tipos => `<div class="clegend note">${tipos.map(t => `<span><i style="background:${OLEO_COR[t]}"></i>${t}</span>`).join('')}</div>`;
function mesesAte(n, ref) { const d = ref || hoje(), o = []; for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); o.push({ k: x.getFullYear() + '-' + pad(x.getMonth() + 1), lab: MESES[x.getMonth()] + '/' + String(x.getFullYear()).slice(2) }); } return o; }

/* =====================================================================
   TELA · TROCAS DE ÓLEO (situação, previsão, óleo a comprar, consumo do MCP)
   ===================================================================== */


/* =====================================================================
   TELA · CONSUMO DE ÓLEO E RESÍDUOS
   ===================================================================== */
const LC = { meses: 12, barco: '' };
function vLubCons() {
  const ms = mesesAte(LC.meses), ks = ms.map(m => m.k), ini = ks[0];
  const LA = lubLanc().filter(x => x.date && x.date.slice(0, 7) >= ini && (!LC.barco || x.nome === LC.barco));
  const tipos = OLEOS.map(o => o[0]).filter(t => LA.some(x => x.oleo === t));
  const serie = tipos.map(t => ({ nome: t, cor: OLEO_COR[t], vals: ks.map(k => LA.filter(x => x.oleo === t && x.date.slice(0, 7) === k).reduce((a, x) => a + x.L, 0)) }));
  const tot = LA.reduce((a, x) => a + x.L, 0), totT = LA.filter(x => x.tipo === 'troca').reduce((a, x) => a + x.L, 0), totC = tot - totT;
  const porB = {}; LA.forEach(x => { porB[x.nome] = (porB[x.nome] || 0) + x.L; });
  const rk = Object.entries(porB).sort((a, b) => b[1] - a[1]);
  const F = fr049s().filter(r => r.date && r.date.slice(0, 7) >= ini && (!LC.barco || (r.vessel ? vName(r.vessel) : nomeCurto(r.vNome)) === LC.barco));
  const res = ks.map(k => { const L = F.filter(r => r.date.slice(0, 7) === k); return { k, n: L.length, oleo: L.reduce((a, r) => a + litros((r.residuos || {}).oleo), 0), flt: L.reduce((a, r) => a + litros((r.residuos || {}).filtros), 0), tamb: L.reduce((a, r) => a + litros((r.residuos || {}).tambores), 0), fr016: [...new Set(L.map(r => (r.residuos || {}).fr016).filter(Boolean))], sem016: L.filter(r => litros((r.residuos || {}).oleo) > 0 && !(r.residuos || {}).fr016).length }; });
  const queim = res.reduce((a, r) => a + r.oleo, 0), sem016 = res.reduce((a, r) => a + r.sem016, 0);
  const fotos4 = F.filter(r => (r.fotos || {}).antes >= 2 && (r.fotos || {}).depois >= 2).length;
  const empurradores = [...new Set(S.cfg.frota.map(v => v.nome).concat(lubLanc().map(x => x.nome)))];
  return `<div class="vh"><div><h1>Consumo de lubrificantes e OLUC</h1><p>Litros usados nas trocas (FR 049_B) e nos complementos, por tipo de óleo, por mês e por embarcação; OLUC (óleo lubrificante usado) gerado e rastreabilidade pelo FR 016_E (NP 5.7 · CONAMA 362/2005).</p></div><span class="sp"></span><button class="mbtn" data-act="lubFr016">🖨 FR 016_E em branco</button></div>
  <div class="card"><div class="g"><label class="f s2">Período<select id="lcM">${[6, 12, 24].map(m => `<option value="${m}"${LC.meses === m ? ' selected' : ''}>Últimos ${m} meses</option>`).join('')}</select></label><label class="f s3">Empurrador<select id="lcB"><option value="">Frota toda</option>${empurradores.map(b => `<option${LC.barco === b ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label></div></div>
  <div class="kgrid six">
   <div class="card mini"><b>${nf(tot)} L</b><span>de óleo no período</span></div>
   <div class="card mini"><b>${nf(totT)} L</b><span>nas trocas (${LA.filter(x => x.tipo === 'troca').length} equipamentos)</span></div>
   <div class="card mini"><b>${nf(totC)} L</b><span>em complementos de nível</span></div>
   <div class="card mini"><b>${nf(queim)} L</b><span>de OLUC (óleo lubrificante usado) gerado</span></div>
   <div class="card mini ${sem016 ? 'warn' : 'ok'}"><b>${sem016}</b><span>FR 049_B com OLUC (óleo lubrificante usado) e sem nº do FR 016_E</span></div>
   <div class="card mini ${F.length && fotos4 < F.length ? 'warn' : 'ok'}"><b>${F.length ? Math.round(fotos4 / F.length * 100) : 0}%</b><span>FR 049_B com as 4 fotos (2 antes, 2 depois)</span></div>
  </div>
  <div class="card"><div class="row"><h2>A · Consumo mensal por tipo de lubrificante (L)</h2></div>${stackChart(ms.map(m => m.lab), serie, ' L')}${legOleos(tipos)}</div>
  <div class="two">
   <div class="card"><div class="row"><h2>B · Consumo de lubrificante por embarcação</h2><span class="sp"></span><span class="note">trocas + complementos</span></div>${hbar(rk.slice(0, 14).map(([n, L]) => [n, Math.round(L)]), ' L')}
    ${rk.length > 2 ? `<p class="note">${(() => { let a = 0, k = 0; for (const [, L] of rk) { a += L; k++; if (a >= tot * 0.8) break; } return k + ' de ' + rk.length + ' empurradores respondem por ~80% do óleo.'; })()}</p>` : ''}</div>
   <div class="card"><div class="row"><h2>C · Geração de OLUC por mês</h2></div>
    <div class="tw"><table class="t"><thead><tr><th>Mês</th><th class="c">FR 049_B</th><th class="c">OLUC</th><th class="c">Filtros</th><th>FR 016_E</th></tr></thead><tbody>${res.slice().reverse().map((r, i) => `<tr><td>${ms[ms.length - 1 - i].lab}</td><td class="c">${r.n || '–'}</td><td class="c mono">${r.oleo ? nf(r.oleo) + ' L' : '–'}</td><td class="c mono">${r.flt ? nf(r.flt) : '–'}</td><td class="note">${r.fr016.length ? `<span data-tip="${esc(r.fr016.join(', '))}">${r.fr016.length > 3 ? r.fr016.slice(0, 2).map(esc).join(', ') + ' +' + (r.fr016.length - 2) : r.fr016.map(esc).join(', ')}</span>` : '–'}${r.sem016 ? ` <span class="pill p-warn">${r.sem016} sem nº</span>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
  </div>`;
}
AFTER.lubcons = () => { $('#main').onchange = e => { if (e.target.id === 'lcM') { LC.meses = +e.target.value; render(); } if (e.target.id === 'lcB') { LC.barco = e.target.value; render(); } }; };

/* =====================================================================
   TELA · REGISTROS (FR 049_B e complementos)
   ===================================================================== */
const LR = { barco: '', mes: '' };
function vLubReg() {
  const L = recs('lub').filter(r => (!LR.barco || (r.vessel ? vName(r.vessel) : nomeCurto(r.vNome)) === LR.barco) && (!LR.mes || (r.date || '').slice(0, 7) === LR.mes)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || 0) - (a.createdAt || 0)));
  const ms = mesesAte(12).reverse(), empurradores = [...new Set(S.cfg.frota.map(v => v.nome).concat(recs('lub').map(r => r.vessel ? vName(r.vessel) : nomeCurto(r.vNome))))];
  const rows = L.slice(0, 300).map(r => {
    const nome = r.vessel ? vName(r.vessel) : nomeCurto(r.vNome);
    if (r.tipo === 'comp') { const v = vessel(r.vessel), e = v && lubEq(v, r.key); return `<tr><td class="mono">${brD(r.date)}</td><td><b>${esc(nome)}</b></td><td><span class="pill p-mut">Complemento</span></td><td>—</td><td>${esc(e ? e.nome : r.key)}</td><td class="mono">${nf1(+r.L)} L</td><td class="note">${r.hr ? nf(r.hr) + ' h' : '—'}</td><td>—</td><td>${can.admin() ? `<button class="mbtn sm" data-lubexc="${r.id}">Excluir</button>` : ''}</td></tr>`; }
    const T = (r.eq || []).filter(q => q.status === 'T'), Lt = T.reduce((a, q) => a + litros(q.qtd), 0), f = r.fotos || {};
    return `<tr class="click" data-lubver="${r.id}"><td class="mono">${brD(r.date)}</td><td><b>${esc(nome)}</b>${r.tipoEmb === 'bal' ? ' <span class="pill p-mut">balsa</span>' : ''}</td><td><span class="pill p-inf">FR 049_B</span> <span class="mono">OM ${esc(r.om || '—')}</span></td><td>${esc(r.local || '')}${r.localTx ? ' · ' + esc(r.localTx) : ''}</td><td>${T.map(q => esc(q.name)).join(', ') || '—'}${(r.me || []).length || (r.nc || []).length ? ' <span class="pill p-warn">' + ((r.me || []).length + (r.nc || []).length) + ' ME/NC</span>' : ''}</td><td class="mono">${nf1(Lt)} L</td><td>${(() => { if (!lubEmp(r)) return '<span class="pill p-mut">NP 024</span>'; const o = omDoFr(r); return !o ? '<span class="pill p-warn">OM não lançada</span>' : o.status === 'encerrada' ? `<a class="pill p-ok" href="#om/${o.id}">OM ${esc(o.num)} encerrada</a>` : `<a class="pill p-inf" href="#om/${o.id}">OM ${esc(o.num)} · ${omStatusTxt(o)}</a>`; })()}</td><td>${(f.antes || 0) >= 2 && (f.depois || 0) >= 2 ? '<span class="pill p-ok">4 fotos</span>' : `<span class="pill p-warn">${(f.antes || 0) + (f.depois || 0)}/4</span>`}</td><td><button class="mbtn sm" data-lubver="${r.id}">Ver</button></td></tr>`;
  }).join('');
  return `<div class="vh"><div><h1>Registros de lubrificação</h1><p>Todos os FR 049_B salvos (com o PDF das 2 folhas, que vai para a pasta do empurrador no Google Drive) e os complementos de óleo.</p></div><span class="sp"></span><button class="mbtn" data-act="lubComp">＋ Complemento de óleo</button><button class="mbtn pri" data-act="lubForm">📝 Preencher FR 049_B</button></div>
  <div class="card"><div class="g"><label class="f s3">Empurrador<select id="lrB"><option value="">Todos</option>${empurradores.map(b => `<option${LR.barco === b ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label><label class="f s2">Mês<select id="lrM"><option value="">Todos</option>${ms.map(m => `<option value="${m.k}"${LR.mes === m.k ? ' selected' : ''}>${m.lab}</option>`).join('')}</select></label></div>
   ${rows ? `<div class="tw"><table class="t"><thead><tr><th>Data</th><th>Embarcação</th><th>Registro</th><th>Local</th><th>Equipamentos trocados</th><th>Litros</th><th>Anexo II-B</th><th>Fotos</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${L.length > 300 ? '<p class="note">Mostrando os 300 mais recentes. Use os filtros.</p>' : ''}` : '<div class="note">Nenhum registro neste filtro.</div>'}</div>`;
}
AFTER.lubreg = () => { const m = $('#main');
  m.onchange = e => { if (e.target.id === 'lrB') { LR.barco = e.target.value; render(); } if (e.target.id === 'lrM') { LR.mes = e.target.value; render(); } };
  m.onclick = async e => { const x = e.target.closest('[data-lubexc]'); if (x) { lubExcluir(x.dataset.lubexc); return; } const b = e.target.closest('[data-lubver]'); if (b) lubVerModal(b.dataset.lubver); }; };
function lubExcluir(id) {
  if (!precisa(true)) return; const r = S.recs.get(id); if (!r) return;
  confirmar(r.tipo === 'fr049' ? `Excluir o FR 049_B da OM ${r.om} (${brD(r.date)})? As trocas dele deixam de contar como último serviço.` : `Excluir o complemento de ${nf1(+r.L)} L de ${brD(r.date)}?`, async () => { r.excluido = true; await saveRec(r); closeModal(); toast('Registro excluído.'); render(); });
}
function lubVerModal(id) {
  const r = S.recs.get(id); if (!r) return;
  const nome = r.vessel ? vName(r.vessel) : nomeCurto(r.vNome), T = (r.eq || []).filter(q => q.status === 'T');
  const pend = S.pdfPend[r.id];
  modal(`<div class="row"><h2>FR 049_B · OM ${esc(r.om || '—')}</h2><span class="sp"></span>${r.pdfFileId ? `<button class="mbtn sm" id="lvDrive">📄 PDF no Drive</button>` : ''}${pend ? `<button class="mbtn sm" id="lvBaixar">⬇ Baixar PDF</button>` : ''}${can.admin() ? `<button class="mbtn sm" data-lubexc="${r.id}">Excluir</button>` : ''}<button class="mbtn" data-close>Fechar</button></div>
   <p class="note">${esc(nome)} · ${brD(r.date)} · ${esc(r.local || '')}${r.localTx ? ' (' + esc(r.localTx) + ')' : ''} · executante ${esc((r.nomes || {}).exe || '—')} · lançado por ${esc(r.by || '—')}${r.pdfFileId ? '' : pend ? ' · PDF aguardando envio ao Drive' : ''}</p>
   <div class="tw"><table class="t"><thead><tr><th>Equipamento</th><th>Óleo</th><th>Litros</th><th>Lote</th><th>Validade</th><th>Filtros</th><th>Horímetro</th><th>Próxima</th></tr></thead><tbody>${T.map(q => `<tr><td><b>${esc(q.name)}</b>${q.itens ? '<div class="note">Anexo I ' + q.itens.join(', ') + '</div>' : ''}</td><td>${esc(q.oil)}</td><td class="mono">${esc(q.qtd)}</td><td class="mono">${esc(q.lot)}</td><td class="mono">${esc(q.val || '—')}</td><td>${esc((q.filters || []).join(', ') || '—')}</td><td class="mono">${q.hr != null ? nf(q.hr) + (q.hrMcp ? ' <span class="note">(MCP)</span>' : '') : '—'}</td><td class="mono">${q.nx != null ? nf(q.nx) : '—'}</td></tr>`).join('') || '<tr><td colspan="8" class="note">Nenhum equipamento com troca (T).</td></tr>'}</tbody></table></div>
   ${(r.me || []).length || (r.nc || []).length || r.obs ? `<p class="note">${(r.me || []).length ? '<b>ME (abrir OM):</b> ' + r.me.map(esc).join('; ') + '<br>' : ''}${(r.nc || []).length ? '<b>NC:</b> ' + r.nc.map(esc).join('; ') + '<br>' : ''}${r.obs ? '<b>Observações:</b> ' + esc(r.obs) : ''}</p>` : ''}
   <p class="note">Resíduos: OLUC (óleo lubrificante usado) ${esc((r.residuos || {}).oleo || '—')} L · filtros ${esc((r.residuos || {}).filtros || '—')} · FR 016_E ${esc((r.residuos || {}).fr016 || '—')}</p>
   ${(r.pages || []).length ? `<div class="lubpg">${r.pages.map(p => `<img src="${p}" alt="Folha do FR 049_B">`).join('')}</div>` : '<p class="note">As folhas do formulário estão no PDF guardado no Drive.</p>'}`, true);
  const d = $('#lvDrive'); if (d) d.onclick = () => abrirPdfNuvem(r);
  const bx = $('#lvBaixar'); if (bx) bx.onclick = () => { const a = document.createElement('a'); a.href = 'data:application/pdf;base64,' + pend; a.download = r.pdfName || 'FR049B.pdf'; document.body.appendChild(a); a.click(); a.remove(); };
  $('#modal').addEventListener('click', e => { const x = e.target.closest('[data-lubexc]'); if (x) lubExcluir(x.dataset.lubexc); });
}

/* =====================================================================
   TELA · PLANO DE LUBRIFICAÇÃO (matriz técnica) + como trocar o óleo
   ===================================================================== */
const LP = { barco: '' };
const SYSN = { MCP: 'Motores principais', CRP: 'Reversores', MCA: 'Motores auxiliares', EA: 'Leme, motor de popa e motobombas' };
function vPlano() {
  const vi = LP.barco ? FROTA_PADRAO.indexOf(LP.barco) : -1;
  const qn = x => x === '●' ? 1 : (parseInt(x, 10) || 0);
  let last = '', tot = {};
  const rows = LUB_PLANO.map(r => {
    const q = vi < 0 ? (parseInt(r.qtd, 10) || 0) : qn(r.cj[vi]); if (vi >= 0 && !q) return '';
    let h = '';
    if (r.sys !== last) { last = r.sys; h += `<tr class="grp"><td colspan="${vi < 0 ? 5 : 6}">${SYSN[r.sys] || r.sysName}</td></tr>`; }
    const tt = r.carterN ? q * r.carterN : null; if (vi >= 0 && tt) { const o = r.sys === 'EA' && /popa/i.test(r.eq) ? 'Outros' : tipoOleo(r.lub); tot[o] = (tot[o] || 0) + tt; }
    return h + `<tr><td><b>${esc(r.eq)}</b><div class="note">Família ${esc(r.fam)}</div></td><td class="c mono">${vi < 0 ? esc(r.qtd) : q}</td><td class="mono">${esc(r.ivH)} ou ${esc(r.ivT)}</td><td>${esc(r.lub)}<div class="note">${esc(r.brands || '')}</div></td><td class="mono">${esc(r.carter || '—')}${r.carterEst ? ' <span class="pill p-warn">estimado</span>' : ''}</td>${vi >= 0 ? `<td class="mono"><b>${tt ? (r.carterEst ? '≈ ' : '') + nf1(tt) + ' L' : '—'}</b></td>` : ''}</tr>`;
  }).join('');
  const MM = [['Preparar', ['Operar até a temperatura de trabalho (óleo morno drena melhor)', 'Bloquear e sinalizar a partida do motor (NP 5.11.1)', 'Separar o óleo certo, filtros novos, juntas e recipiente de contenção', 'Amostra de óleo programada (programa de amostragem 1.1.29)? Coletar antes de drenar']],
    ['Drenar', ['MCP: válvula 3 vias da bomba manual em "From Oil Pan" (entrada) e "Drain" (saída)', 'Drenar sempre em contenção', 'Bujão magnético: olhar se há partículas metálicas']],
    ['Filtros', ['Retirar os filtros de óleo e o by-pass', 'Partículas metálicas nos elementos? Abrir OM corretiva', 'Limpar a sede e untar a junta com óleo novo', 'Apertar à mão: encostou, mais ¾ a 1 volta (sem chave)', 'Reversor: limpar o strainer (tela)']],
    ['Abastecer', ['Usar o óleo deste plano (tipo e marca)', 'MCP: cárter de 140 L', 'Hitachi: só SAE 30 monograu, multiviscoso é proibido', 'Encher até a marca MAX da vareta']],
    ['Conferir', ['Válvulas 3 vias de volta em "Run"', 'Partir em marcha lenta e olhar vazamentos', 'Parar ~30 min e conferir o nível entre MIN e MAX', 'Óleo leitoso = água no óleo: parar e abrir OM']],
    ['Registrar', ['Preencher o FR 049_B: horímetro, óleo, litros, lote e validade (NP 5.9)', '2 fotos antes e 2 depois (NP 5.8)', 'Salvar no SMF: o último serviço e o horímetro atualizam sozinhos']],
    ['Resíduos', ['Óleo usado e filtros: registrar no FR 016_E (NP 5.7)', 'Destinação conforme CONAMA 362/2005', 'NR-12 durante o serviço']]];
  return `<div class="vh"><div><h1>Plano de lubrificação</h1><p>Equipamentos, óleo, marcas aprovadas, volume e intervalo de troca de cada família, conforme a Matriz técnica de equipamentos e lubrificação. Escolha um empurrador para ver quantos litros leva uma troca completa.</p></div><span class="sp"></span><button class="mbtn" data-act="lubFr016">🖨 FR 016_E em branco</button><button class="mbtn pri" data-act="lubForm">📝 Preencher FR 049_B</button></div>
  <div class="card"><div class="g"><label class="f s3">Empurrador<select id="lpB"><option value="">Frota toda</option>${FROTA_PADRAO.map(b => `<option${LP.barco === b ? ' selected' : ''}>${b}</option>`).join('')}</select></label>
   ${vi >= 0 ? `<div class="f s3"><span>Óleo para trocar tudo no ${esc(LP.barco)}</span><div class="note" style="font-size:13px">${Object.entries(tot).map(([o, l]) => `<i class="dotc" style="background:${OLEO_COR[o]}"></i>${o === 'Outros' ? 'SAE 90' : o}: <b>${nf1(l)} L</b>`).join(' · ')}</div></div>` : ''}</div>
   <div class="tw"><table class="t plt"><thead><tr><th>Equipamento</th><th class="c">${vi < 0 ? 'Qtd na frota' : 'Qtd no empurrador'}</th><th>Troca</th><th>Óleo e marcas</th><th>Volume por equip.</th>${vi >= 0 ? '<th>Total p/ 1 troca</th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div></div>
  <div class="card"><div class="row"><h2>Procedimento de troca de óleo (FR 049_B)</h2></div><div class="mmgrid">${MM.map(([t, l], i) => `<div class="mmc"><b><i>${i + 1}</i>${t}</b><ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div></div>`;
}
AFTER.plano = () => { $('#main').onchange = e => { if (e.target.id === 'lpB') { LP.barco = e.target.value; render(); } }; };

/* =====================================================================
   COMPLEMENTO DE ÓLEO (reposição de nível entre trocas)
   ===================================================================== */
function lubCompModal(vid) {
  if (!precisa(false)) return;
  const v0 = vid || S.cfg.frota[0].id;
  const eqs = v => lubEquip(v).filter(e => ['mcp', 'crp', 'mca', 'hid'].includes(e.g) || e.key === 'inc');
  const draw = id => { const v = vessel(id); return `<label class="f">Embarcação<select id="cV">${S.cfg.frota.map(x => `<option value="${x.id}"${x.id === id ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
   <div class="g"><label class="f s3">Equipamento<select id="cE">${eqs(v).map(e => `<option value="${e.key}">${esc(e.nome)} · ${esc(e.mod || '')}</option>`).join('')}</select></label><label class="f s3">Data<input id="cD" type="date" value="${isoD(hoje())}"></label>
   <label class="f s2">Litros repostos<input id="cL" inputmode="decimal" placeholder="ex.: 8"></label><label class="f s2">Horímetro (h)<input id="cH" inputmode="numeric" placeholder="${(() => { const e = eqs(v)[0], h = e && horAtual(v.id, lubHp(v, e)); return h ? 'últ. ' + nf(h.h) : ''; })()}"></label><label class="f s2">Óleo<input id="cO" list="lubOleos" value="${esc((eqs(v)[0] || {}).oleo || 'SAE 15W-40')}"></label>
   <label class="f s6">Observação<input id="cX" placeholder="opcional: vazamento visto, fumaça, etc."></label></div>`; };
  modal(`<h2>Complemento de óleo</h2><p class="note">Óleo colocado para completar o nível entre uma troca e outra. Com o horímetro, o sistema calcula o consumo de cada motor (L por 100 h).</p><div id="cBody">${draw(v0)}</div><datalist id="lubOleos">${OLEOS.slice(0, 4).map(o => `<option value="${o[0]}">`).join('')}</datalist><div class="note" id="cErr" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="cOk">Salvar</button></div>`);
  const upd = () => { const v = vessel($('#cV').value), e = lubEq(v, $('#cE').value), h = e && horAtual(v.id, lubHp(v, e)); $('#cH').placeholder = h ? 'últ. ' + nf(h.h) : ''; $('#cO').value = e ? e.oleo : $('#cO').value; };
  $('#modal').addEventListener('change', e => { if (e.target.id === 'cV') { $('#cBody').innerHTML = draw(e.target.value); } if (e.target.id === 'cE') upd(); });
  $('#cOk').onclick = async () => {
    const vid2 = $('#cV').value, v = vessel(vid2), e = lubEq(v, $('#cE').value), L = litros($('#cL').value), d = $('#cD').value, hv = $('#cH').value.replace(/\D/g, '');
    if (!e) return; if (!L) { $('#cErr').textContent = 'Informe os litros.'; return; } if (!d || d > isoD(hoje())) { $('#cErr').textContent = 'Informe a data (não pode ser futura).'; return; }
    if (L > (e.cap || 999) * 0.6) { $('#cErr').textContent = `${nf1(L)} L é mais da metade do cárter (${nf1(e.cap)} L). Se foi troca, use o FR 049_B.`; return; }
    await saveRec({ id: uid('lub'), kind: 'lub', tipo: 'comp', vessel: vid2, key: e.key, pos: e.pos, date: d, L, hr: hv ? +hv : null, oleo: $('#cO').value.trim(), obs: $('#cX').value.trim(), by: S.session.name });
    if (hv) await lubHor(vid2, lubHp(v, e), +hv, d, 'complemento');
    closeModal(); toast('Complemento salvo.'); render();
  };
}
// leitura de horímetro vinda de um lançamento de lubrificação (não duplica e não aceita valor menor que o já lançado depois)
async function lubHor(vid, pos, h, date, src) {
  if (!(h > 0) || !date) return false;
  const L = recs('hor').filter(r => r.vessel === vid && r.pos === pos);
  if (L.some(r => r.date === date && r.h === h)) return false;
  if (L.some(r => (r.date >= date && r.h < h) || (r.date <= date && r.h > h))) return false;
  await saveRec({ id: uid('hor'), kind: 'hor', vessel: vid, pos, h, date, by: S.session ? S.session.name : '', src });
  return true;
}

/* =====================================================================
   FR 049_B EMBUTIDO (formulário oficial, 2 folhas) e FR 016_E para imprimir
   ===================================================================== */
function lubOverlay(id, titulo, extra) {
  let o = document.getElementById(id); if (o) o.remove();
  o = document.createElement('div'); o.id = id; o.className = 'form-overlay';
  o.innerHTML = `<div class="fo-bar"><span>${titulo}</span><span class="fo-b">${extra || ''}<button data-fo="fechar">✕ Fechar</button></span></div><iframe title="${esc(titulo.replace(/<[^>]+>/g, ''))}"></iframe><div class="fo-busy" hidden><div class="spin"></div><div class="fo-msg"></div></div>`;
  document.body.appendChild(o); document.body.style.overflow = 'hidden';
  return o;
}
function lubFecharOverlay(id) { const o = document.getElementById(id); if (o) o.remove(); if (!document.querySelector('.form-overlay')) document.body.style.overflow = ''; }
function lubBusy(on, msg) { const b = document.querySelector('#lubFO .fo-busy'); if (!b) return; b.hidden = !on; if (msg) b.querySelector('.fo-msg').textContent = msg; }
async function lubAbrirForm(vid) {
  if (!precisa(false)) return;
  const inj = "try{const P=window.parent&&window.parent.OilApp,F=P&&P.frota?P.frota():null;if(F){Object.assign(FROTA,F);const s=document.getElementById('emb'),b=[...s.options].find(o=>/^VDA/.test(o.text));Object.keys(F).forEach(n=>{if(![...s.options].some(o=>o.text===n))s.insertBefore(new Option(n,n),b||null);});}}catch(e){}";
  const src = (await lubFormTxt('FR_049_B.html')).replace("FROTA['Cap. José Alecrim XX'].inc=true;", inj).replace("if('inc' in tr.dataset&&!cfg.inc)on=false;", "if('inc' in tr.dataset||tr.dataset.eq==='7')on=false;");
  const o = lubOverlay('lubFO', `📝 FR 049_B · Troca de óleo, filtros e fluidos · ${esc(S.session.name)}`);
  o.querySelector('[data-fo="fechar"]').onclick = () => { if (confirm('Fechar o formulário sem salvar? O que foi preenchido será perdido.')) lubFecharOverlay('lubFO'); };
  const fr = o.querySelector('iframe');
  fr.onload = () => { if (!vid) return; try { const d = fr.contentDocument, s = d.getElementById('emb'); s.value = nomeLongo(vName(vid)); s.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { } };
  fr.srcdoc = src;
}
async function lubAbrirFr016() {
  const o = lubOverlay('lubF16', '🖨 FR 016_E · Controle de Materiais Classe I &amp; II · devolução ou reciclagem', '<button data-fo="imprimir">🖨 Imprimir</button>');
  o.querySelector('[data-fo="fechar"]').onclick = () => lubFecharOverlay('lubF16');
  o.querySelector('[data-fo="imprimir"]').onclick = () => { const w = o.querySelector('iframe').contentWindow; w.focus(); w.print(); };
  o.querySelector('iframe').srcdoc = await lubFormTxt('FR_016_E.html');
}
// PDF A4 das folhas do formulário (mesmo visual da impressão)
function lubPrepClone(doc) {
  const st = doc.createElement('style');
  st.textContent = `.toolbar,.svm,.noprint{display:none!important}
 input.in,select.in,.obs .r input.in{background:transparent!important;box-shadow:none!important}
 .miss,tr.miss td,input.in.bad{background:transparent!important}
 .ph-empty svg,.ph-empty .tip{display:none}
 .ph-band{background:none!important;border-bottom:1px solid #3A4A6B}
 .grp-pv{position:relative;width:5mm;height:5mm;margin:auto}.grp-pv span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap;font-size:6.6pt;font-weight:600;color:#3A4A6B;letter-spacing:.4pt}
 .cbx-pv{display:inline-block;width:2.6mm;height:2.6mm;border:.5pt solid #3A4A6B;background:#fff;vertical-align:-.5mm;margin:0 .8mm 0 0;flex:none}
 .chk td.c .cbx-pv{margin:0}
 .cbx-pv.on{background:#1E2B45 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 5.3l2 2 4.2-4.6' fill='none' stroke='%23fff' stroke-width='1.7'/%3E%3C/svg%3E") center/100% 100% no-repeat}
 .cbx-pv.on.ok{background-color:#2E7D4F;border-color:#2E7D4F}.cbx-pv.on.atn{background-color:#A86F00;border-color:#A86F00}.cbx-pv.on.nok{background-color:#C5221F;border-color:#C5221F}
 .sign .sig::before{content:none!important}.sign .sig img{height:100%;width:auto;max-width:100%;display:block;margin:0 auto}
 .sel-pv{display:block;height:4.1mm;margin-top:.3mm;padding:0 .5mm;font-size:7.8pt;font-weight:600;line-height:4.1mm;white-space:nowrap;overflow:hidden}`;
  doc.head.appendChild(st);
  doc.querySelectorAll('input').forEach(i => i.removeAttribute('placeholder'));
  doc.querySelectorAll('.sign .sig').forEach(s => { if (!s.querySelector('img')) s.innerHTML = '<i></i>'; });
  doc.querySelectorAll('td.grp').forEach(td => { const t = td.textContent.trim(); td.style.cssText = 'writing-mode:horizontal-tb;transform:none;vertical-align:middle;padding:0'; td.innerHTML = '<div class="grp-pv"><span>' + t + '</span></div>'; });
  doc.querySelectorAll('input.cbx').forEach(i => { const s = doc.createElement('span'); const m = (i.className.match(/\b(ok|atn|nok)\b/) || [])[1]; s.className = 'cbx-pv' + (m ? ' ' + m : '') + ((i.checked || i.hasAttribute('checked')) ? ' on' : ''); i.replaceWith(s); });
  doc.querySelectorAll('input[type=date]').forEach(i => { const v = i.value || i.getAttribute('value') || ''; i.type = 'text'; i.value = v ? v.split('-').reverse().join('/') : ''; i.setAttribute('value', i.value); });
  doc.querySelectorAll('input.in').forEach(i => {
    const cs = doc.defaultView.getComputedStyle(i), d = doc.createElement('div'), ta = cs.textAlign;
    d.textContent = i.value || i.getAttribute('value') || '';
    d.style.cssText = 'display:' + (cs.display === 'inline-block' ? 'inline-flex' : 'flex') + ';align-items:center;justify-content:' + (ta === 'center' ? 'center' : 'flex-start') + ';box-sizing:border-box;overflow:hidden;white-space:nowrap;width:' + cs.width + ';height:' + cs.height + ';margin:' + cs.margin + ';padding:' + cs.padding + ';font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight + ';color:' + cs.color + ';border-bottom:' + cs.borderBottomWidth + ' ' + cs.borderBottomStyle + ' ' + cs.borderBottomColor + ';vertical-align:' + cs.verticalAlign;
    i.replaceWith(d);
  });
  doc.querySelectorAll('select.in').forEach(sel => { const d = doc.createElement('div'); d.className = 'sel-pv'; d.textContent = (sel.options[sel.selectedIndex] || {}).text || ''; sel.replaceWith(d); });
}
const lubThumb = (cv, w) => { const c = document.createElement('canvas'); c.width = w; c.height = Math.round(cv.height * w / cv.width); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.7); };
async function lubMakePdf(win) {
  await carregarLibsPdf().catch(() => { });
  if (!window.jspdf || !window.html2canvas) throw new Error('bibliotecas de PDF não carregaram');
  const doc = win.document; if (win.bake) win.bake();
  const sheets = [...doc.querySelectorAll('main.sheet')];
  const { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pages = [], sx = win.scrollX, sy = win.scrollY; win.scrollTo(0, 0);
  try {
    for (let i = 0; i < sheets.length; i++) {
      const cv = await html2canvas(sheets[i], { scale: 2.6, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: Math.max(1000, win.innerWidth), scrollX: 0, scrollY: 0, onclone: lubPrepClone });
      pages.push(lubThumb(cv, 1100));
      if (i) pdf.addPage('a4', 'portrait');
      pdf.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      cv.width = cv.height = 0;
    }
  } finally { win.scrollTo(sx, sy); }
  return { pdf, pages };
}
function lubShrink(url, max, q) { return new Promise(ok => { const im = new Image(); im.onerror = () => ok(null); im.onload = () => { const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q)); }; im.src = url; }); }
async function lubSalvarForm(data, win) {
  const v = vesselPorNome(data.vessel);
  const dup = fr049s().find(r => (r.vNome === data.vessel || (v && r.vessel === v.id)) && String(r.om) === String(data.om));
  if (dup && !confirm('Já existe FR 049_B salvo para ' + data.vessel + ' com a O.M. ' + data.om + ' (' + brD(dup.date) + ').\nSalvar novamente mesmo assim?')) throw { cancelled: true };
  lubBusy(true, 'Gerando o PDF das 2 folhas…');
  let out = null;
  try {
    out = await lubMakePdf(win);
    const fl = { a: [], d: [] }; for (const g of ['a', 'd']) for (const u of ((data.fotoImgs || {})[g] || [])) { const r = await lubShrink(u, 560, 0.72); if (r) fl[g].push(r); }
    delete data.fotoImgs;
    lubBusy(true, 'Gravando e atualizando o painel…');
    // motor de popa e motobomba 5 HP não têm horímetro (NP 7.3): a troca vale pelo horímetro do MCP na data
    const hMcp = (() => { const m = (data.eq || []).find(q => q.key === 'mcp1' && q.hr != null); if (m) return m.hr; const r = v && horEm(v.id, mpos(v.id), data.date); return r ? r.h : null; })();
    const eq = (data.eq || []).map(q => { const o = Object.assign({}, q); if (['popa', 'bomba'].includes(q.key) && q.status === 'T' && q.hr == null) { o.hr = hMcp; o.hrMcp = true; } if (v && q.status === 'T') { const e = lubEq(v, q.key); if (e) { o.pos = e.pos; o.hp = lubHp(v, e); o.itens = e.itens.filter((id, i) => i === 0 || (id === '1.6.2' && (q.filters || []).length));
      if (o.hr != null && +o.hr < VOLTA && !['crp1', 'crp2', 'hid', 'popa', 'bomba'].includes(q.key)) { const tot = horPainelTotal(v.id, o.hp, +o.hr, data.date); if (tot != null) { o.hrPainel = +o.hr; o.hr = tot; } } /* número do painel (volta a zero em 10.000 h) → horímetro total */ } } return o; });
    const rec = { id: uid('lub'), kind: 'lub', tipo: 'fr049', vessel: v ? v.id : '', vNome: data.vessel, tipoEmb: data.tipo || (v ? 'emp' : 'bal'), om: data.om, num: data.om, date: data.date, local: data.local, localTx: data.localTx, eq, me: data.me, nc: data.nc, atn: data.atn, obs: data.obs, residuos: data.residuos, nomes: data.nomes, fotos: data.fotos, fotosLocais: (fl.a.length || fl.d.length) ? fl : null, pages: out.pages, pdfName: data.pdfName, by: S.session.name };
    const b64 = out.pdf.output('datauristring').split(',')[1];
    await saveRec(rec, { pdfB64: b64 });
    const omII = v ? await lubLigarOM(rec) : null;
    let nh = 0;
    if (v) for (const q of eq) { if (q.status !== 'T' || q.hr == null || !q.hp) continue; if (['crp1', 'crp2', 'hid', 'popa', 'bomba'].includes(q.key)) continue; if (await lubHor(v.id, q.hp, q.hr, data.date, 'FR 049_B OM ' + data.om)) nh++; }
    lubFecharOverlay('lubFO');
    if (v) { const avis = eq.filter(q => q.status === 'T' && q.hp && q.hr != null && !['crp1', 'crp2', 'hid', 'popa', 'bomba'].includes(q.key)).filter(q => { const a = horAtual(v.id, q.hp); return a && !a.est && a.h > +q.hr + 1; }); if (avis.length) setTimeout(() => toast('Atenção: horímetro menor que a última leitura em ' + avis.map(q => (lubEq(v, q.key) || {}).nome + ' (' + nf(q.hr) + ' h; última ' + nf(horAtual(v.id, q.hp).h) + ' h)').join(', ') + '. Confira o número: a troca pode continuar aparecendo como vencida.', 12000), 1500); }
    const nT = eq.filter(q => q.status === 'T').length;
    toast(`FR 049_B salvo · ${data.vessel} · O.M. ${data.om}. ${v ? nT + ' troca(s) atualizada(s) no painel' + (nh ? ', ' + nh + ' horímetro(s) lançado(s)' : '') + '. ' + (omII ? (omII.status === 'encerrada' ? 'OM ' + omII.num + ' (II-B) já encerrada.' : 'Ligado à OM ' + omII.num + ' (II-B): nº do FR 049_B, FR 016_E e lotes preenchidos.') : 'Atenção: a OM ' + data.om + ' não está no SMF. Pela NP (7.4) a troca também é registrada no Anexo II-B.') : 'Balsa (NP 024): fica só no histórico.'}`, 9000);
    render();
  } catch (e) {
    if (out && !(e && e.cancelled)) { try { out.pdf.save(data.pdfName || 'FR049B.pdf'); } catch (x) { } }
    lubBusy(false);
    throw new Error((e && e.message || e) + (out ? ' O PDF foi baixado para não se perder.' : ''));
  }
}
// ponte usada pelo formulário (o FR 049_B chama window.parent.OilApp)
window.OilApp = {
  get session() { return S.session; },
  frota() { const F = {}; S.cfg.frota.forEach(v => { F[nomeLongo(v.nome)] = { tipo: 'emp', mcp: v.mcp === 'mono' ? 1 : 2, inc: !!lubEq(v, 'inc') }; }); return F; },
  getEq(vessel, key) { const v = vesselPorNome(vessel), e = v && lubEq(v, key); if (!e) return null; const h = horAtual(v.id, lubHp(v, e)), s = lubSit(v, e); return { h: h ? h.h : null, next: s && s.alvoH != null ? s.alvoH : null }; },
  interval(key, vessel) { const v = vesselPorNome(vessel), e = v && lubEq(v, key); if (!e) return null; const iv = intervalo(A1M[e.itens[0]], v, e.pos); return iv.h ? { h: iv.h, m: iv.m } : null; },
  saveForm: lubSalvarForm,
  closeForm() { lubFecharOverlay('lubFO'); },
  async downloadPdf(win, name) { const o = await lubMakePdf(win); o.pdf.save(name + '.pdf'); },
};
/* assinatura em tela cheia (celular) */
(function () {
  let ov, cv, ctx, strokes = [], cur = null, resolveFn = null;
  function build() {
    ov = document.createElement('div'); ov.className = 'sig-ov'; ov.hidden = true;
    ov.innerHTML = '<div class="sig-top"><b class="sigT">Assinatura</b><small>Assine com o dedo dentro do quadro. Se puder, gire o celular para o lado.</small></div><div class="sig-box"><canvas></canvas><div class="sig-line"></div><div class="sig-hint">✍ assine aqui</div></div><div class="sig-btns"><button class="sg-c">Cancelar</button><button class="sg-l">Limpar</button><button class="sg-ok">✔ Confirmar</button></div>';
    document.body.appendChild(ov); cv = ov.querySelector('canvas'); ctx = cv.getContext('2d');
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [pos(e)]; strokes.push(cur); ov.querySelector('.sig-hint').style.display = 'none'; draw(); });
    cv.addEventListener('pointermove', e => { if (!cur) return; e.preventDefault(); cur.push(pos(e)); draw(); });
    const end = () => { cur = null; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.style.touchAction = 'none';
    ov.querySelector('.sg-l').onclick = () => { strokes = []; cur = null; draw(); ov.querySelector('.sig-hint').style.display = ''; };
    ov.querySelector('.sg-c').onclick = () => close(undefined);
    ov.querySelector('.sg-ok').onclick = () => close(png());
    window.addEventListener('resize', () => { if (!ov.hidden) fit(); });
  }
  function fit() { const r = cv.parentElement.getBoundingClientRect(), dpr = Math.min(2.5, window.devicePixelRatio || 1), nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr); if (cv.width !== nw || cv.height !== nh) { const kx = cv.width ? nw / cv.width : 1, ky = cv.height ? nh / cv.height : 1; strokes.forEach(s => s.forEach(p => { p.x *= kx; p.y *= ky; })); cv.width = nw; cv.height = nh; } draw(); }
  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ctx.fillStyle = '#0d2f57';
    const w = Math.max(2.5, cv.height / 105); ctx.lineWidth = w;
    strokes.forEach(s => { if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0].x, s[0].y, w / 2, 0, 7); ctx.fill(); return; } ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y); for (let i = 1; i < s.length - 1; i++) { const mx = (s[i].x + s[i + 1].x) / 2, my = (s[i].y + s[i + 1].y) / 2; ctx.quadraticCurveTo(s[i].x, s[i].y, mx, my); } const l = s[s.length - 1]; ctx.lineTo(l.x, l.y); ctx.stroke(); });
  }
  function png() {
    if (!strokes.length) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; strokes.forEach(s => s.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }));
    const pd = cv.height / 40; x0 = Math.max(0, x0 - pd); y0 = Math.max(0, y0 - pd); x1 = Math.min(cv.width, x1 + pd); y1 = Math.min(cv.height, y1 + pd);
    const w = Math.max(10, x1 - x0), h = Math.max(10, y1 - y0), k = Math.min(1, 520 / w, 200 / h), o = document.createElement('canvas'); o.width = Math.round(w * k); o.height = Math.round(h * k);
    o.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, o.width, o.height); return o.toDataURL('image/png');
  }
  function close(v) { ov.hidden = true; const f = resolveFn; resolveFn = null; if (f) f(v); }
  window.OilApp.signPad = function (title) { if (!ov) build(); return new Promise(res => { resolveFn = res; strokes = []; cur = null; ov.querySelector('.sigT').textContent = title || 'Assinatura'; ov.hidden = false; ov.querySelector('.sig-hint').style.display = ''; setTimeout(() => { cv.width = 0; cv.height = 0; fit(); }, 30); }); };
})();

/* =====================================================================
   RELATÓRIO MENSAL · blocos de lubrificação
   ===================================================================== */

/* =====================================================================
   DADOS DE EXEMPLO (marcados seed:true; somem em "Limpar dados de exemplo")
   ===================================================================== */
function exemploLub() {
  const R = rnd(4049), out = [], d0 = hoje(), lim = isoD(addM(d0, -12)), rows = [];
  let lote = 2610;
  S.cfg.frota.forEach(v => lubEquip(v).forEach(e => {
    if (!['mcp', 'crp', 'mca', 'hid', 'popa', 'bomba'].includes(e.g)) return;
    const t = A1M[e.itens[0]], b = recs('base').find(x => x.seed && x.vessel === v.id && x.pos === e.pos && x.item === t.id); if (!b) return;
    const iv = intervalo(t, v, e.pos), hp = lubHp(v, e), hd = horasDiaPos(v.id, hp);
    const step = Math.min(iv.h && b.h != null ? iv.h / hd : 1e9, iv.m ? iv.m * 30.4 : 1e9); if (step > 5e8) return;
    for (let k = 0; k < 30; k++) {
      const dt = pD(b.date); dt.setDate(dt.getDate() - Math.round(k * step)); const date = isoD(dt); if (date < lim) break;
      const h = b.h != null ? Math.round(b.h - k * step * hd) : null; if (h !== null && h <= 0) break;
      const L = e.cap ? Math.round(e.cap * (0.96 + R() * 0.07) * 10) / 10 : 1;
      rows.push({ v, e, date, h, row: { key: e.key, name: e.nome, status: 'T', oil: e.oleo === 'Outros' ? 'SAE 90' : e.oleo, qtd: String(L).replace('.', ','), lot: 'L' + (++lote), val: pad(1 + (lote % 12)) + '/' + (28 + lote % 2), filters: e.g === 'crp' ? ['tela'] : e.g === 'hid' || e.g === 'popa' ? [] : ['oleo'], hr: h, nx: h != null && iv.h ? h + iv.h : null, pos: e.pos, hp, itens: e.itens } });
    }
  }));
  rows.sort((a, b) => a.v.id < b.v.id ? -1 : a.v.id > b.v.id ? 1 : a.date < b.date ? -1 : 1);
  let om = 51200, cur = null;
  rows.forEach(x => {
    if (!cur || cur.vessel !== x.v.id || (pD(x.date) - pD(cur.date)) / 864e5 > 3) {
      cur = { id: 'ex-lub-' + (++om), kind: 'lub', tipo: 'fr049', vessel: x.v.id, vNome: nomeLongo(x.v.nome), tipoEmb: 'emp', om: String(om), num: String(om), date: x.date, local: R() > 0.15 ? 'Base' : 'Viagem', localTx: '', eq: [], me: [], nc: [], atn: [], obs: '', residuos: {}, nomes: { exe: 'Chefe de Máquinas' }, fotos: { antes: R() > 0.08 ? 2 : 1, depois: 2 }, by: 'exemplo', seed: true };
      out.push(cur);
    }
    cur.eq.push(x.row);
  });
  out.forEach((r, i) => { const L = r.eq.reduce((a, q) => a + litros(q.qtd), 0); r.residuos = { oleo: String(Math.round(L * 0.9)), filtros: String(r.eq.filter(q => (q.filters || []).length).length), tambores: '', fr016: i % 31 === 7 ? '' : 'FR016-' + r.date.slice(2, 7).replace('-', '') + '-' + r.vessel.slice(1).padStart(2, '0'), om: r.om, rm: '' }; const t = pD(r.date).getTime() + 15 * 3600e3; r.createdAt = r.updatedAt = t; });
  // complementos de nível do MCP: CJA II BB (compressão caindo) bebe mais óleo; CJA XIX BE com vazamento externo
  S.cfg.frota.forEach((v, i) => mcpPos(v).forEach(p => {
    const taxa = v.nome === 'CJA II' && p === 'BB' ? 2.6 : v.nome === 'CJA XIX' && p === 'BE' ? 1.7 : 0.55 + R() * 0.5;
    let k = 0, h0 = null;
    for (let d = 130 - Math.round(R() * 6); d > 2; d -= 9 + Math.round(R() * 8)) {
      const dt = new Date(d0); dt.setDate(dt.getDate() - d); const date = isoD(dt), hr = horEm(v.id, p, date);
      if (!hr) continue; if (h0 === null || hr.h <= h0) { h0 = hr.h; continue; }
      const L = Math.round((hr.h - h0) * taxa / 100 * (0.85 + R() * 0.3) * 2) / 2; h0 = hr.h; if (L < 0.5) continue;
      out.push({ id: 'ex-lubc-' + v.id + p + (++k), kind: 'lub', tipo: 'comp', vessel: v.id, key: p === 'BE' ? 'mcp2' : 'mcp1', pos: p, date, L, hr: hr.h, oleo: 'SAE 15W-40', obs: '', by: 'exemplo', seed: true, createdAt: dt.getTime(), updatedAt: dt.getTime() });
    }
  }));
  return out;
}
async function lubBoot() {
  if (temExemplo() && (await kvGet('popaV')) !== 1) {
    const ids = [...S.recs.values()].filter(r => r.seed).map(r => r.id);
    for (const id of ids) { S.recs.delete(id); if (MEM) MEM.delete(id); else await DB.del(id); }
    await carregarExemplo();
  }
  await kvSet('popaV', 1);
  if (temExemplo() && !recs('lub').some(r => r.seed)) { const l = exemploLub(); l.forEach(r => S.recs.set(r.id, r)); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); }
  await tecExemplo();
}

/* ---------- menu, telas e ações ---------- */
NAV.splice(1, 0, ['Lubrificação', [['lub', 'Controle de trocas'], ['lubcons', 'Consumo e OLUC'], ['lubreg', 'Registros FR 049_B'], ['plano', 'Plano de lubrificação']]]);
const VX = { lubcons: vLubCons, lubreg: vLubReg, plano: vPlano };
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const k = a.dataset.act;
  if (k === 'lubForm') { closeModal(); lubAbrirForm(a.dataset.v); }
  if (k === 'lubComp') { lubCompModal(a.dataset.v); }
  if (k === 'lubFr016') lubAbrirFr016();
});

