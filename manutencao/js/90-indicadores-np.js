'use strict';
/* ===== 4.1 Indicadores de desempenho · NP 055 item 9 (SMF 3.92, 30/10/2026) =====
   Pedido do Supervisor: tela única com os 6 indicadores oficiais da NP 055 (item 9), para a auditoria; o que não está na NP fica
   separado em “Acompanhamento interno”. Fórmulas aprovadas pelo Supervisor (30/10/2026), iguais ao texto da NP:
   · Disponibilidade = (h calendário − h indisponíveis por manutenção) ÷ h calendário; indisponível = corretiva que impediu a operação
     (classe Crítica ou impacto “Operação (parada ou atraso)”), da abertura à liberação, + horas paradas informadas na preventiva (base.indispH)
   · MTBF = horas do MCP BB (ou único) nos últimos 12 meses ÷ falhas (corretiva Crítica ou Alta) nos últimos 12 meses (kpiMTBF do núcleo)
   · MTTR = soma dos tempos de reparo (abertura → liberação) das falhas Crítica/Alta liberadas no mês ÷ nº dessas falhas
   · Backlog = OMs em aberto com início vencido ÷ OMs em aberto, extraídos do Sankhya toda segunda e lançados aqui (snap tipo 'backlog')
   · Registro fotográfico = OMs encerradas na semana com foto antes e depois ÷ OMs encerradas (corretivas + OMs preventivas registradas)
   · Plano preditivo = ensaios de compressão (1.1.12) e amostras de óleo (1.1.29) que venceram no trimestre e foram feitos ÷ os que venceram
   Cada cartão mostra numerador e denominador e abre a lista dos registros que entraram na conta (o auditor recalcula). */
const KNP = { mes: null };
const KNP_ITENS_PRED = ['1.1.12', '1.1.29'];
const knpFrota = () => S.cfg.frota.filter(v => !foraOp(v));
const knpCorr = () => oms().filter(o => o.tipo === 'C' && !o.excluido && vessel(o.vessel) && o.abertura);
const knpFalha = o => ehFalha(o) && !o.excluido && vessel(o.vessel);
const knpParou = o => o.classe === 'Crítica' || o.interd === 'Sim' || /^Operação/.test(o.impacto || '');
const knpH = (a, b) => Math.max(0, (b - a) / 36e5);
// mês de referência: o mês passado (a NP apura até o 5º dia útil do mês seguinte); escolhível entre os últimos 12
function knpRef() { const h = hoje(), d = KNP.mes ? pD(KNP.mes + '-15') : new Date(h.getFullYear(), h.getMonth() - 1, 15); return { y: d.getFullYear(), m: d.getMonth() }; }
const knpMesLab = (y, m) => MESES[m] + '/' + String(y).slice(2);
// ---------- disponibilidade ----------
function knpDisp(ini, fim) {
  const V = knpFrota(), lim = Math.min(+fim, Date.now()); if (lim <= +ini || !V.length) return null;
  const tot = V.length * knpH(+ini, lim), L = [];
  knpCorr().filter(o => V.some(v => v.id === o.vessel) && knpParou(o)).forEach(o => { const a = Math.max(+ini, +new Date(o.abertura)), b = Math.min(lim, o.liberacao ? +new Date(o.liberacao) : Date.now()); if (b > a) L.push({ o, h: knpH(a, b) }); });
  const P = []; recs('base').filter(r => !r.excluido && !r.bal && +r.indispH > 0 && V.some(v => v.id === r.vessel) && r.date >= isoD(ini) && r.date < isoD(new Date(lim))).forEach(r => P.push({ r, h: +r.indispH }));
  const par = L.reduce((s, x) => s + x.h, 0) + P.reduce((s, x) => s + x.h, 0);
  return { v: Math.max(0, (tot - par) / tot * 100), tot, par, L, P, n: V.length };
}
// ---------- MTTR ----------
function knpMTTR(ini, fim) {
  const L = knpCorr().filter(o => knpFalha(o) && o.liberacao && new Date(o.liberacao) >= ini && new Date(o.liberacao) < fim).map(o => ({ o, h: knpH(+new Date(o.abertura), +new Date(o.liberacao)) }));
  const s = L.reduce((a, x) => a + x.h, 0); return { v: L.length ? s / L.length : null, s, L };
}
// ---------- MTBF (12 meses móveis até o fim do mês) ----------
function knpMTBF(fim) {
  const f = new Date(Math.min(+fim, Date.now())), ini = new Date(f); ini.setFullYear(ini.getFullYear() - 1);
  const L = knpCorr().filter(o => knpFalha(o) && new Date(o.abertura) >= ini && new Date(o.abertura) < f), h = horasOperacao(ini, f);
  return { v: L.length && h > 0 ? h / L.length : null, h, L, ini, fim: f };
}
// ---------- semana (segunda a domingo) ----------
function knpSemana(i) { const h = hoje(), d = new Date(h.getFullYear(), h.getMonth(), h.getDate()), dw = (d.getDay() + 6) % 7, ini = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dw - 7 * i); return { ini, fim: new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 7) }; }
// ---------- registro fotográfico ----------
function knpFotos(ini, fim) {
  const tem = F => (F || []).some(f => f.tipo === 'ANTES') && (F || []).some(f => f.tipo === 'DEPOIS'), L = [];
  knpCorr().filter(o => o.status === 'encerrada').forEach(o => { const t = o.fechadoAt ? new Date(o.fechadoAt) : o.liberacao ? new Date(o.liberacao) : null; if (t && t >= ini && t < fim) L.push({ tipo: 'Corretiva', vid: o.vessel, om: o.num, date: isoD(t), ok: tem(o.fotos) }); });
  const G = {}; recs('base').filter(r => !r.excluido && !r.bal && !r.nf && r.om && vessel(r.vessel) && r.date >= isoD(ini) && r.date < isoD(fim)).forEach(r => { const k = r.vessel + '|' + r.om; const g = G[k] = G[k] || { tipo: 'Preventiva', vid: r.vessel, om: r.om, date: r.date, ok: false, n: 0 }; g.n++; if (tem(r.fotos)) g.ok = true; });
  L.push(...Object.values(G)); L.sort((a, b) => a.date < b.date ? -1 : 1);
  const ok = L.filter(x => x.ok).length; return { v: L.length ? ok / L.length * 100 : null, ok, t: L.length, L };
}
// ---------- backlog (lançado do Sankhya) ----------
const knpBacklogs = () => recs('snap').filter(r => r.tipo === 'backlog' && !r.excluido).sort((a, b) => a.date < b.date ? -1 : 1);
// ---------- plano preditivo (trimestre) ----------
function knpTri(i) { const h = hoje(), q = Math.floor(h.getMonth() / 3) - i, ini = new Date(h.getFullYear(), q * 3, 1); return { ini, fim: new Date(ini.getFullYear(), ini.getMonth() + 3, 1), lab: 'T' + (Math.floor(ini.getMonth() / 3) + 1) + '/' + String(ini.getFullYear()).slice(2) }; }
function knpPred(ini, fim) {
  const lim = new Date(Math.min(+fim, Date.now())), L = []; CXI = cxIndice();   // cxLinha lê o índice do cronograma
  knpFrota().forEach(v => mcpPos(v).forEach(pos => KNP_ITENS_PRED.forEach(id => { const t = A1M[id]; if (!t || (typeof aplica === 'function' && !aplica(v, pos, t))) return;
    const anos = [...new Set([ini.getFullYear(), lim.getFullYear()])];
    anos.forEach(y => { const r = cxLinha(v, pos, t, y); if (!r) return; r.marks.forEach(m => { const due = m.due || (m.semPrazo ? null : m.d); if (!due || due < ini || due >= lim) return;
      if (m.k === 'ok' || m.k === 'late') L.push({ v, pos, t, due, feito: m.d, atr: m.k === 'late', ok: true });
      else if (m.k === 'miss') L.push({ v, pos, t, due, ok: false }); }); }); })));
  const ok = L.filter(x => x.ok).length; return { v: L.length ? ok / L.length * 100 : null, ok, t: L.length, L };
}
// ---------- desenho ----------
const knpN = (v, d) => v == null ? '—' : nf(v, d);
function knpCard(k, nome, freq, val, meta, ok, nd, chart, formula, extra, raw) {
  if (raw == null) val = null;
  const pill = val == null ? '<span class="pill p-mut">sem dados</span>' : ok ? '<span class="pill p-ok">atende</span>' : '<span class="pill p-bad">fora da meta</span>';
  return `<div class="card kn"><h2>${nome} <span class="kn-fq">${freq}</span></h2>
    <div class="kn-top"><div class="kn-v ${val == null ? '' : ok ? 'ok' : 'bad'}">${val == null ? '—' : val}</div><div class="kn-m">${pill}<span class="note">meta ${meta}</span></div></div>
    <div class="kn-nd">${nd}</div>${chart}<p class="note kn-f"><b>Fórmula da NP:</b> ${formula}</p>${extra || ''}
    <div class="row end"><button class="mbtn sm" data-knl="${k}">Ver registros</button></div></div>`;
}
function vEnxKpi() {
  const R = knpRef(), iniM = new Date(R.y, R.m, 1), fimM = new Date(R.y, R.m + 1, 1), M12 = Array.from({ length: 12 }, (_, i) => { const d = new Date(R.y, R.m - 11 + i, 1); return { ini: d, fim: new Date(d.getFullYear(), d.getMonth() + 1, 1), lab: knpMesLab(d.getFullYear(), d.getMonth()) }; });
  const D = knpDisp(iniM, fimM), MB = knpMTBF(fimM), MT = knpMTTR(iniM, fimM);
  const W = Array.from({ length: 12 }, (_, i) => knpSemana(12 - i)), FT = knpFotos(W[11].ini, W[11].fim), FTA = knpFotos(...Object.values(knpSemana(0)));
  const BK = knpBacklogs(), bk = BK[BK.length - 1], bkV = bk && +bk.t > 0 ? +bk.n / +bk.t * 100 : bk ? 0 : null;
  const Q = Array.from({ length: 6 }, (_, i) => knpTri(6 - i)), PR = knpPred(Q[5].ini, Q[5].fim), PRA = knpPred(...[knpTri(0)].map(x => [x.ini, x.fim])[0]);
  const lab = knpMesLab(R.y, R.m), semL = w => brD(isoD(w.ini)).slice(0, 5);
  const meses = Array.from({ length: 12 }, (_, i) => { const d = new Date(hoje().getFullYear(), hoje().getMonth() - 1 - i, 1); return [isoD(d).slice(0, 7), knpMesLab(d.getFullYear(), d.getMonth())]; });
  const sel = `<label class="kn-sel">Mês de referência <select id="knMes">${meses.map(([k, l]) => `<option value="${k}"${(KNP.mes || meses[0][0]) === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`;
  const C = [
    D && D.v >= 95, MB.v != null && MB.v >= 500, MT.v != null && MT.v <= 8, bkV != null && bkV <= 5, FT.v != null && FT.v >= 99.95, PR.v != null && PR.v >= 80],
    V = [D && D.v, MB.v, MT.v, bkV, FT.v, PR.v], nOk = C.filter(Boolean).length, nSem = V.filter(x => x == null).length;
  const faixa = `<div class="card"><h2>Resumo · ${lab}</h2><div class="kn-int kn-4">
    <div><i>Indicadores da NP 055</i><b>6</b></div><div><i>Dentro da meta</i><b style="color:var(--okt)">${nOk}</b></div><div><i>Fora da meta</i><b style="color:${6 - nOk - nSem ? 'var(--badt)' : ''}">${6 - nOk - nSem}</b></div><div><i>Sem dados</i><b>${nSem}</b></div></div>
    <p class="note">Apuração da NP 055 item 9: mensais até o 5º dia útil do mês seguinte · semanais toda segunda-feira · trimestral até o 5º dia útil após o trimestre. Metas a revisar após 6 meses de apuração (nota da NP).</p></div>`;
  const cards = [
    knpCard('disp', 'Disponibilidade da frota', 'Mensal', D ? knpN(D.v, 1) + '%' : '—', '≥ 95%', C[0],
      D ? `${nf(D.par, 1)} h indisponíveis de ${nf(D.tot)} h calendário (${D.n} empurradores × horas do mês) · ${D.L.length} corretiva(s) e ${D.P.length} preventiva(s) com parada` : 'Mês sem dados.',
      lineChart(M12.map(x => { const r = knpDisp(x.ini, x.fim); return r ? r.v : null; }), M12.map(x => x.lab), 95, '%', 1),
      '(horas calendário − horas indisponíveis por manutenção) ÷ horas calendário × 100. Indisponível = da interdição à liberação, por corretiva que impediu a operação (Crítica ou impacto na operação) ou preventiva com horas paradas informadas.', '', D && D.v),
    knpCard('mtbf', 'MTBF', 'Mensal · 12 meses móveis', MB.v == null ? '—' : knpN(MB.v, 0) + ' h', '≥ 500 h', C[1],
      `${nf(MB.h)} h de operação ÷ ${MB.L.length} falha(s) Crítica ou Alta, de ${brD(isoD(MB.ini))} a ${brD(isoD(new Date(+MB.fim - 1)))}`,
      lineChart(M12.map(x => knpMTBF(x.fim).v), M12.map(x => x.lab), 500, ' h', 0),
      'horas de operação da frota nos últimos 12 meses ÷ nº de falhas nos últimos 12 meses. Horas = horímetro do MCP BB (ou único). Falha = corretiva Crítica ou Alta (item 5.5.1).', '', MB.v),
    knpCard('mttr', 'MTTR', 'Mensal', MT.v == null ? '—' : knpN(MT.v, 1) + ' h', '≤ 8 h', C[2],
      MT.L.length ? `${nf(MT.s, 1)} h de reparo ÷ ${MT.L.length} falha(s) Crítica ou Alta liberada(s) em ${lab}` : `Nenhuma falha Crítica ou Alta liberada em ${lab}.`,
      lineChart(M12.map(x => knpMTTR(x.ini, x.fim).v), M12.map(x => x.lab), 8, ' h', 1, { menor: 1 }),
      'soma dos tempos de reparo das falhas do mês ÷ nº de falhas do mês. Tempo de reparo = da abertura da OM até a liberação. Falha = corretiva Crítica ou Alta.', '', MT.v),
    knpCard('bk', 'Backlog', 'Semanal · Sankhya', bkV == null ? '—' : knpN(bkV, 1) + '%', '≤ 5%', C[3],
      bk ? `${bk.n} OM(s) com início vencido ÷ ${bk.t} OM(s) em aberto · extraído do Sankhya em ${brD(bk.date)}${bk.por ? ' por ' + esc(bk.por) : ''}${bk.date < isoD(knpSemana(0).ini) ? ' · <b style="color:var(--badt)">falta lançar a semana atual</b>' : ''}` : '<b style="color:var(--badt)">Nenhuma semana lançada ainda.</b>',
      lineChart(BK.slice(-12).map(r => +r.t > 0 ? +r.n / +r.t * 100 : 0), BK.slice(-12).map(r => brD(r.date).slice(0, 5)), 5, '%', 1, { menor: 1 }),
      'nº de OM em aberto com prazo de início vencido sem intervenção iniciada ÷ nº total de OM em aberto na data da apuração × 100 (corretivas, preventivas e preditivas). Fonte: Sankhya, toda segunda-feira.',
      `<div class="row end" style="margin:4px 0 -4px"><button class="mbtn sm pri" data-knbk>Lançar semana</button></div><p class="note">Conferência no SMF: ${knpCorr().filter(o => o.status !== 'encerrada').length} corretiva(s) aberta(s) agora.</p>`, bkV),
    knpCard('fotos', 'Registro fotográfico', 'Semanal', FT.v == null ? '—' : knpN(FT.v, 0) + '%', '100%', C[4],
      FT.t ? `${FT.ok} de ${FT.t} OM(s) encerrada(s) com foto antes e depois · semana de ${brD(isoD(W[11].ini))} a ${brD(isoD(new Date(+W[11].fim - 864e5)))}` : `Nenhuma OM encerrada na semana de ${brD(isoD(W[11].ini))}.`,
      lineChart(W.map(w => knpFotos(w.ini, w.fim).v), W.map(semL), 100, '%', 0),
      'nº de OM encerradas na semana com fotos “antes” e “depois” ÷ nº total de OM encerradas na semana × 100 (corretivas e OMs preventivas).',
      FTA.t ? `<p class="note">Semana atual até hoje: ${FTA.ok} de ${FTA.t}.</p>` : '', FT.v),
    knpCard('pred', 'Cumprimento do plano preditivo', 'Trimestral', PR.v == null ? '—' : knpN(PR.v, 0) + '%', '≥ 80%', C[5],
      PR.t ? `${PR.ok} de ${PR.t} ensaio(s) de compressão e amostra(s) de óleo programados no ${Q[5].lab} realizados` : `Nada programado no ${Q[5].lab}.`,
      lineChart(Q.map(q => knpPred(q.ini, q.fim).v), Q.map(q => q.lab), 80, '%', 0),
      'testes de compressão (Anexo I 1.1.12) e análises de óleo (1.1.29) realizados ÷ programados no trimestre × 100. Programado = venceu no trimestre pelo cronograma.',
      PRA.t ? `<p class="note">${knpTri(0).lab} até hoje: ${PRA.ok} de ${PRA.t} vencidos já realizados.</p>` : '', PR.v)];
  // acompanhamento interno (sem meta na NP)
  const ad = M12.map(x => { const r = rmeAd(knpFrota(), isoD(x.ini), isoD(new Date(+x.fim - 864e5))); return r.ad; }), adR = ad[11];
  const cm = knpCorr().filter(o => new Date(o.abertura) >= iniM && new Date(o.abertura) < fimM), cls = ['Crítica', 'Alta', 'Média', 'Baixa'].map(c => [c, cm.filter(o => o.classe === c).length]);
  const interno = `<div class="card kn"><h2>Acompanhamento interno <span class="kn-fq">sem meta na NP 055</span></h2>
    <div class="kn-int"><div><i>Aderência ao cronograma · ${lab}</i><b>${adR == null ? '—' : adR + '%'}</b><small>feito no prazo ÷ o que venceu · referência interna ≥ 90%</small></div>
    <div><i>Corretivas abertas em ${lab}</i><b>${cm.length}</b><small>${cls.map(([c, n]) => `${c} ${n}`).join(' · ')}</small></div></div>
    ${lineChart(ad, M12.map(x => x.lab), 90, '%', 0)}
    <p class="note">A aderência ao cronograma é o principal indicador do plano preventivo, mas não está na tabela do item 9 da NP 055: sugerido incluir na próxima revisão da NP (meta ≥ 90%).</p></div>`;
  return enxCab('4.1 Indicadores de desempenho · NP 055 item 9', 'Os 6 indicadores da NP com meta, numerador e denominador, fórmula e os registros que entraram na conta · mensais pelo mês de referência, semanais pela última semana completa, trimestral pelo último trimestre fechado', sel + '<button class="mbtn" data-enxreset>Reorganizar</button>')
    + faixa + cards.join('') + interno + '</div></div>';
}
// ---------- listas (para o auditor recalcular) ----------
function knpLista(k) {
  const R = knpRef(), iniM = new Date(R.y, R.m, 1), fimM = new Date(R.y, R.m + 1, 1), lab = knpMesLab(R.y, R.m), dt = x => x ? brDT(x) : '—', V = id => esc(vName(id));
  const tab = (h, L) => `<div class="tw" style="max-height:60vh;overflow:auto"><table class="t"><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${L.join('') || `<tr><td colspan="${h.length}" class="note">Nenhum registro.</td></tr>`}</tbody></table></div>`;
  let t = '', b = '';
  if (k === 'disp') { const D = knpDisp(iniM, fimM) || { L: [], P: [] }; t = 'Disponibilidade · ' + lab;
    b = tab(['Empurrador', 'OM', 'Tipo', 'Classe / motivo', 'Início', 'Liberação', 'Horas no mês'], D.L.map(({ o, h }) => `<tr><td>${V(o.vessel)}</td><td>${esc(o.num || '—')}</td><td>Corretiva</td><td>${esc(o.classe || '')}${o.impacto ? ' · ' + esc(o.impacto) : ''}</td><td>${dt(o.abertura)}</td><td>${o.liberacao ? dt(o.liberacao) : '<b>em reparo</b>'}</td><td class="r">${nf(h, 1)}</td></tr>`)
      .concat(D.P.map(({ r, h }) => `<tr><td>${V(r.vessel)}</td><td>${esc(r.om || '—')}</td><td>Preventiva</td><td>${esc(enxServ ? enxServ(A1M[r.item] || { chk: r.item }) : r.item)}</td><td>${brD(r.date)}</td><td>—</td><td class="r">${nf(h, 1)}</td></tr>`))); }
  if (k === 'mtbf') { const M = knpMTBF(fimM); t = 'MTBF · falhas de ' + brD(isoD(M.ini)) + ' a ' + brD(isoD(new Date(+M.fim - 1)));
    b = `<p class="note">${nf(M.h)} h de operação (MCP BB ou único) ÷ ${M.L.length} falhas.</p>` + tab(['Empurrador', 'OM', 'Classe', 'Sistema / equipamento', 'Abertura'], M.L.map(o => `<tr><td>${V(o.vessel)}</td><td>${esc(o.num || '—')}</td><td>${esc(o.classe)}</td><td>${esc(o.equip || o.sistema || '')}</td><td>${dt(o.abertura)}</td></tr>`)); }
  if (k === 'mttr') { const M = knpMTTR(iniM, fimM); t = 'MTTR · falhas liberadas em ' + lab;
    b = tab(['Empurrador', 'OM', 'Classe', 'Equipamento', 'Abertura', 'Liberação', 'Reparo (h)'], M.L.map(({ o, h }) => `<tr><td>${V(o.vessel)}</td><td>${esc(o.num || '—')}</td><td>${esc(o.classe)}</td><td>${esc(o.equip || o.sistema || '')}</td><td>${dt(o.abertura)}</td><td>${dt(o.liberacao)}</td><td class="r">${nf(h, 1)}</td></tr>`)); }
  if (k === 'bk') { t = 'Backlog · semanas lançadas do Sankhya';
    b = tab(['Segunda-feira', 'OM com início vencido', 'OM em aberto', 'Backlog', 'Lançado por', 'Observação'], knpBacklogs().slice().reverse().map(r => `<tr><td>${brD(r.date)}</td><td class="r">${r.n}</td><td class="r">${r.t}</td><td class="r">${+r.t > 0 ? nf(+r.n / +r.t * 100, 1) : '0'}%</td><td>${esc(r.por || '')}</td><td>${esc(r.obs || '')}</td></tr>`)); }
  if (k === 'fotos') { const w = knpSemana(1), F = knpFotos(w.ini, w.fim); t = 'Registro fotográfico · semana de ' + brD(isoD(w.ini));
    b = tab(['Data', 'Empurrador', 'OM', 'Tipo', 'Foto antes e depois'], F.L.map(x => `<tr><td>${brD(x.date)}</td><td>${V(x.vid)}</td><td>${esc(x.om || '—')}</td><td>${x.tipo}${x.n ? ` · ${x.n} serviço(s)` : ''}</td><td>${x.ok ? '<span class="pill p-ok">sim</span>' : '<span class="pill p-bad">não</span>'}</td></tr>`)); }
  if (k === 'pred') { const q = knpTri(1), P = knpPred(q.ini, q.fim); t = 'Plano preditivo · ' + q.lab;
    b = tab(['Empurrador', 'Motor', 'Serviço', 'Venceu em', 'Realizado em', 'Situação'], P.L.sort((a, b) => a.due - b.due).map(x => `<tr><td>${esc(x.v.nome)}</td><td>${esc(posCurtoE(x.v, x.pos))}</td><td>${x.t.id} · ${esc(x.t.id === '1.1.12' ? 'bicos injetores e ensaio de compressão' : 'amostra de óleo para laudo')}</td><td>${brD(isoD(x.due))}</td><td>${x.feito ? brD(isoD(x.feito)) : '—'}</td><td>${x.ok ? (x.atr ? '<span class="pill p-warn">feito com atraso</span>' : '<span class="pill p-ok">feito</span>') : '<span class="pill p-bad">não feito</span>'}</td></tr>`)); }
  modal(`<h2>${t}</h2>${b}<div class="row end"><button class="mbtn" data-close>Fechar</button></div>`, true);
}
function knpBacklogModal() {
  if (!S.session) return loginModal(); const s = knpSemana(0);
  modal(`<h2>Backlog da semana · extraído do Sankhya</h2><p class="note">NP 055 item 9: toda segunda-feira, no início do expediente, com numerador e denominador da mesma consulta (corretivas, preventivas e preditivas em aberto).</p>
   <div class="g"><label class="f s2">Segunda-feira<input type="date" id="kbD" value="${isoD(s.ini)}" max="${isoD(hoje())}"></label><label class="f s2">OM em aberto com início vencido<input id="kbN" inputmode="numeric"></label><label class="f s2">Total de OM em aberto<input id="kbT" inputmode="numeric"></label>
   <label class="f s6">Observação (opcional)<input id="kbO" placeholder="ex.: 2 OMs aguardando peça"></label></div><div class="note" id="kbE" style="color:var(--badt)"></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="kbOk">Salvar</button></div>`);
  $('#kbOk').onclick = async () => { const d = $('#kbD').value, n = parseInt($('#kbN').value), t = parseInt($('#kbT').value), E = $('#kbE');
    if (!d) return E.textContent = 'Informe a data.'; if (!(t >= 0) || !(n >= 0)) return E.textContent = 'Informe os dois números.'; if (n > t) return E.textContent = 'O número de OMs atrasadas não pode passar do total em aberto.';
    const old = knpBacklogs().find(r => r.date === d); await saveRec(Object.assign(old || { id: uid('snap'), kind: 'snap', tipo: 'backlog' }, { date: d, n, t, obs: $('#kbO').value.trim(), por: S.session.name }));
    closeModal(); toast('Backlog da semana salvo.'); render(); };
}
Object.assign(VX, { enxkpi: vEnxKpi }); AFTER.enxkpi = pcmAfter('enxkpi');
Object.assign(NP_TAG, { enxkpi: '9' });
ENX_OK.push('enxkpi'); PCM_ETAPAS[3][2].unshift('enxkpi');
document.addEventListener('click', e => { if (VIEW !== 'enxkpi') return; const b = e.target.closest('[data-knl],[data-knbk]'); if (!b) return;
  if (b.dataset.knl) return knpLista(b.dataset.knl); return knpBacklogModal(); });
document.addEventListener('change', e => { if (VIEW !== 'enxkpi' || e.target.id !== 'knMes') return; KNP.mes = e.target.value; render(); });
{ const st = document.createElement('style'); st.textContent = `
#main .card.kn h2{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}#main .kn-fq{font-size:11px;font-weight:500;color:var(--mut,#5F6368);background:#EEF3FA;border-radius:10px;padding:1px 8px}
#main .kn-top{display:flex;align-items:center;gap:14px;margin:2px 0 4px}#main .kn-v{font-size:30px;font-weight:600;line-height:1;color:#202124;font-variant-numeric:tabular-nums}
#main .kn-v.ok{color:var(--okt,#137333)}#main .kn-v.bad{color:var(--badt,#C5221F)}#main .kn-m{display:flex;flex-direction:column;gap:3px}
#main .kn-nd{font-size:12.5px;color:#3C4043;margin-bottom:4px}#main .kn-f{margin-top:6px}
#main .kn-sel{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;margin-right:8px}#main .kn-sel select{padding:4px 8px}
#main .kn-int.kn-4{grid-template-columns:repeat(4,1fr)}#main .kn-int{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:6px}#main .kn-int i{display:block;font-style:normal;font-size:12px;color:var(--mut,#5F6368)}#main .kn-int b{display:block;font-size:34px;font-weight:600;line-height:1.15;margin:2px 0}#main .kn-int small{color:var(--mut,#5F6368);font-size:11.5px}`;
  document.head.appendChild(st); }
