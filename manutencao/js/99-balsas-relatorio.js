'use strict';
/* ===== Balsas: Relatório mensal, slide na Apresentação técnica e menu em etapas (SMF 3.140, Supervisor 01/11/2026: “continua” a lista do que os empurradores têm) =====
   Relatório mensal das balsas (view balrel): indicadores da NP 024 item 10 no mês e no anterior, situação das balsas, preventiva (aderência e OMs do mês),
   corretiva (falhas do mês, resolvidas, MTTR, Pareto), docagem e calibração a programar, comentário do Supervisor (snap tipo balrelcom) e assinaturas.
   Impressão A4 pelo balDocJanela (js/97). */
const BALR = { m: null };
function balRelMes() { if (!BALR.m) { const H = hoje(), d = H.getDate() <= 10 ? new Date(H.getFullYear(), H.getMonth() - 1, 1) : new Date(H.getFullYear(), H.getMonth(), 1); BALR.m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); } return BALR.m; }
function balRelDados(ym) {
  const [y, m] = ym.split('-').map(Number), ini = new Date(y, m - 1, 1), fim = new Date(y, m, 1), iniA = new Date(y, m - 2, 1);
  const K = balKpi(ini, fim), A = balKpi(iniA, ini), dI = isoD(ini), dF = isoD(new Date(+fim - 864e5));
  const E = BALSAS.map(b => balEstado(b)), oms = BALSAS.flatMap(b => balOMs(b.id).filter(o => o.date >= dI && o.date <= dF).map(o => Object.assign({ b }, o))).sort((a, b) => a.date < b.date ? -1 : 1);
  let ok = 0, den = 0; const mi = m - 1; BALSAS.forEach(b => { if (E.find(e => e.b === b).st === 'ref') return; const d = balCxBalsa(b, y); ok += d.Ok[mi]; den += d.Ok[mi] + d.Lt[mi] + d.Ms[mi]; });
  const Ad = Array(12).fill(0).map(() => ({ ok: 0, den: 0 })); BALSAS.forEach(b => { const d = balCxBalsa(b, y); for (let i = 0; i <= mi; i++) { Ad[i].ok += d.Ok[i]; Ad[i].den += d.Ok[i] + d.Lt[i] + d.Ms[i]; } });
  const doca = BALSAS.map(balDocaSit).filter(d => d.st === 'venc' || d.st === 'prox').sort((a, b) => (a.dias ?? 1e9) - (b.dias ?? 1e9));
  const cal = BALSAS.flatMap(b => BAL_CAL.map(([k, n]) => { const t = BA1M[k === 'inj' ? balInj(b) : k]; if (!t) return null; const s = balSit(b, t); return s.st === 'venc' || s.st === 'prox' ? { b, n, s } : null; }).filter(Boolean));
  const eq = {}; K.fal.forEach(a => { const k = a.sis || 'Não informado'; eq[k] = (eq[k] || 0) + 1; });
  const com = S.recs.get('snap-balrelcom-' + ym);
  return { y, m, ym, ini, fim, K, A, E, oms, ad: den ? ok / den * 100 : null, Ad: Ad.slice(0, mi + 1), doca, cal, par: Object.entries(eq).sort((a, b) => b[1] - a[1]), com: com && !com.excluido ? com.txt || '' : '' };
}
const BAL_MESN = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function balRelKpis(R) {
  const pc = v => v == null ? '—' : nf(v, 1) + '%', hh = v => v == null ? '—' : nf(v) + ' h', h1 = v => v == null ? '—' : nf(v, 1) + ' h';
  const L = [['Disponibilidade da frota', R.K.disp, R.A.disp, pc, '≥ 95%', v => v >= 95], ['MTBF', R.K.mtbf, R.A.mtbf, hh, '≥ 500 h', v => v >= 500], ['MTTR', R.K.mttr, R.A.mttr, h1, '≤ 8 h', v => v <= 8],
    ['Backlog (hoje)', R.K.back, null, pc, '≤ 5%', v => v <= 5], ['% manutenção preditiva', R.K.pPred, R.A.pPred, pc, '≥ 30%', v => v >= 30], ['Aderência ao cronograma', R.ad, null, pc, '≥ 90%', v => v >= 90]];
  return `<table class="d"><thead><tr><th>Indicador (NP 024 item 10)</th><th>No mês</th><th>Mês anterior</th><th>Meta</th><th>Situação</th></tr></thead><tbody>${L.map(([n, v, a, f, mt, ok]) => `<tr><td>${n}</td><td><b>${f(v)}</b></td><td>${a == null ? '—' : f(a)}</td><td>${mt}</td><td>${v == null ? 'sem dados' : ok(v) ? '<span style="color:#188038">atende</span>' : '<b style="color:#C5221F">fora da meta</b>'}</td></tr>`).join('')}</tbody></table>`;
}
function balRelCorpo(R, imp) {
  const cnt = k => R.E.filter(e => e.st === k).length, nl = R.E.filter(e => e.st === 'bloq' || e.st === 'rest');
  const cls = c => `<span style="color:${c === 'Crítica' ? '#C5221F' : c === 'Alta' ? '#B06000' : '#5F6368'};font-weight:600">${esc(c)}</span>`;
  const sec = (n, t, h) => `<h3>${n} · ${t}</h3>${h}`;
  return sec(1, 'Indicadores do mês', balRelKpis(R))
   + sec(2, 'Situação das balsas hoje', `<p>Liberadas <b>${cnt('lib')}</b> · com restrição <b>${cnt('rest')}</b> · bloqueadas <b>${cnt('bloq')}</b> · em reforma <b>${cnt('ref')}</b> · sem histórico <b>${cnt('sem')}</b></p>${nl.length ? `<table class="d"><thead><tr><th>Balsa</th><th>Situação</th><th>Motivo</th></tr></thead><tbody>${nl.map(e => `<tr><td><b>${esc(e.b.nome)}</b></td><td>${e.st === 'bloq' ? 'Bloqueada' : 'Com restrição'}</td><td>${esc([...e.A.map(a => 'falha ' + a.c + ': ' + a.desc), e.crit.length ? e.crit.length + ' crítico(s) vencido(s): ' + [...new Set(e.crit.map(x => balGr(x.t)))].join(', ') : '', e.venc.length > e.crit.length ? (e.venc.length - e.crit.length) + ' outro(s) vencido(s)' : ''].filter(Boolean).join(' · '))}</td></tr>`).join('')}</tbody></table>` : '<p>Todas as balsas em operação estão liberadas.</p>'}`)
   + sec(3, 'Manutenção preventiva', `<p>Aderência ao cronograma no mês: <b>${R.ad == null ? '—' : nf(R.ad, 0) + '%'}</b> (meta 90%) · OMs preventivas registradas: <b>${R.oms.length}</b> · serviços: <b>${R.oms.reduce((a, o) => a + o.L.length, 0)}</b></p>
      ${R.Ad.length ? '<div class="balrel-g">' + balBarras(R.Ad.map((x, i) => [PR_MES[i], x.den ? x.ok / x.den * 100 : null]), v => Math.round(v) + '%', 90, true) + '</div>' : ''}
      ${R.oms.length ? (G => `<table class="d"><thead><tr><th>Balsa</th><th>OMs</th><th>Serviços</th><th>Equipamentos atendidos</th></tr></thead><tbody>${G.map(([b, L]) => `<tr><td>${esc(b.nome)}</td><td>${L.length}</td><td>${L.reduce((a, o) => a + o.L.length, 0)}</td><td>${esc([...new Set(L.flatMap(o => o.L.map(r => balGr(BA1M[r.item]))))].join(', '))}</td></tr>`).join('')}</tbody></table><p class="note">O detalhe de cada OM está no Anexo II-B (Programar preventiva).</p>`)(BALSAS.map(b => [b, R.oms.filter(o => o.b === b)]).filter(x => x[1].length)) : ''}`)
   + sec(4, 'Manutenção corretiva', `<p>Falhas no mês: <b>${R.K.fal.length}</b> · resolvidas: <b>${R.K.res.length}</b> · abertas hoje: <b>${R.K.ab.length}</b> · MTTR: <b>${R.K.mttr == null ? '—' : nf(R.K.mttr, 1) + ' h'}</b></p>
      ${R.K.fal.length ? `<table class="d"><thead><tr><th>Data</th><th>Balsa</th><th>Classe</th><th>Equipamento</th><th>O que aconteceu</th><th>Serviço executado</th><th>OM</th></tr></thead><tbody>${R.K.fal.sort((a, b) => balAt(a) - balAt(b)).map(a => `<tr><td>${brD(a.date)}</td><td>${esc(vName(a.vessel))}</td><td>${cls(a.c)}</td><td>${esc(a.sis || '')}</td><td>${esc(a.desc)}</td><td>${esc(a.servicos || (a.fim ? '—' : 'em aberto'))}</td><td>${esc(a.om || '—')}</td></tr>`).join('')}</tbody></table>` : '<p>Nenhuma falha registrada no mês.</p>'}
      ${R.par.length > 1 ? '<div class="balrel-g">' + rmPareto(R.par) + '</div>' : ''}`)
   + sec(5, 'Docagem e calibração a programar', `${R.doca.length ? `<table class="d"><thead><tr><th>Balsa</th><th>Docagem</th><th>Data-limite</th><th>Situação</th></tr></thead><tbody>${R.doca.map(d => `<tr><td>${esc(d.b.nome)}</td><td>${d.u ? 'última ' + brD(d.u.date) : 'sem registro'}</td><td>${d.s.alvoD ? brD(isoD(d.s.alvoD)) : '—'}${d.csn && d.csn.date ? ' (CSN)' : ''}</td><td>${d.st === 'venc' ? '<b style="color:#C5221F">vencida</b>' : 'programar em até 12 meses'}</td></tr>`).join('')}</tbody></table>` : '<p>Nenhuma docagem vencida ou a programar em 12 meses.</p>'}
      ${R.cal.length ? `<table class="d"><thead><tr><th>Balsa</th><th>Calibração</th><th>Situação</th></tr></thead><tbody>${R.cal.map(c => `<tr><td>${esc(c.b.nome)}</td><td>${esc(c.n)}</td><td>${c.s.st === 'venc' ? '<b style="color:#C5221F">vencida</b>' : 'vence em breve'} · ${esc(c.s.txt || '')}</td></tr>`).join('')}</tbody></table>` : '<p>Nenhuma calibração vencida ou vencendo em breve.</p>'}`)
   + sec(6, 'Comentário do Supervisor', imp ? `<p style="white-space:pre-wrap">${esc(R.com || '—')}</p><div class="ass"><div>Supervisor de Manutenção</div><div>Gerência</div><div>Data</div></div>` : '');
}
function vBalRel() {
  const ym = balRelMes(), R = balRelDados(ym), H = hoje(), op = [];
  for (let i = 0; i < 12; i++) { const d = new Date(H.getFullYear(), H.getMonth() - i, 1), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); op.push(`<option value="${k}"${k === ym ? ' selected' : ''}>${BAL_MESN[d.getMonth()]} de ${d.getFullYear()}</option>`); }
  return balCab('Relatório mensal das balsas', `${BAL_MESN[R.m - 1]} de ${R.y} · indicadores da NP 024 item 10, preventiva, corretiva, docagem e calibração · até o dia 10 abre no mês passado`, `<label class="f">Mês<select id="balrM">${op.join('')}</select></label><button class="mbtn pri" data-balrimp>🖨 Imprimir</button>`)
   + `<div class="card balrel">${balRelCorpo(R, false)}<label class="f">Comentário do Supervisor (vai no impresso)<textarea id="balrC" rows="4">${esc(R.com)}</textarea></label><div class="row end"><button class="mbtn" data-balrcom${can.admin() ? '' : ' disabled'}>Salvar comentário</button></div></div>`;
}
function balRelImprimir() {
  const R = balRelDados(balRelMes());
  balDocJanela(`RELATÓRIO MENSAL DE MANUTENÇÃO · BALSAS PETROLEIRAS`, `${BAL_MESN[R.m - 1]} de ${R.y} · ${BALSAS.length} balsas · emitido em ${hoje().toLocaleDateString('pt-BR')}`, balRelCorpo(R, true), 'NP Navecunha 024 · itens 8 e 10');
}
VX.balrel = balJan('balrel', vBalRel);
{ const k = BAL_VIEWS.findIndex(v => v[0] === 'balkpi') + 1; BAL_VIEWS.splice(k, 0, ['balrel', 'Relatório mensal']); }
NP_TAG.balrel = 'NP 024 · 8 e 10';
AFTER.balrel = () => { balAfter(); const m = $('#main'); m.onchange = e => { if (e.target.id === 'balrM') { BALR.m = e.target.value; render(); } }; const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_balrel_lay', '[data-balreset]'); };
document.addEventListener('click', async e => {
  if (VIEW !== 'balrel') return; const t = e.target.closest('[data-balrimp],[data-balrcom]'); if (!t) return; e.stopPropagation(); e.preventDefault();
  if (t.dataset.balrimp !== undefined) return balRelImprimir();
  if (!can.admin()) return toast('Só o Supervisor grava o comentário.');
  await saveRec({ id: 'snap-balrelcom-' + balRelMes(), kind: 'snap', tipo: 'balrelcom', ym: balRelMes(), txt: $('#balrC').value.trim(), by: S.session.name }); toast('Comentário salvo.');
}, true);
{ const st = document.createElement('style'); st.textContent = `.balrel-g{max-width:620px}.balrel h3{font-size:14px;margin:16px 0 6px;color:#0B2A5B}.balrel table.d{width:100%;border-collapse:collapse;font-size:12.5px;margin:4px 0 8px}.balrel table.d th{background:#1F2A44;color:#fff;font-size:11px;padding:5px;text-align:left}.balrel table.d td{border-bottom:1px solid #E3E8EF;padding:5px;vertical-align:top}`; document.head.appendChild(st); }
