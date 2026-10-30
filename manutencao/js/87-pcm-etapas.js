/* ===== PCM em 4 etapas (SMF 3.22, 28/10/2026; Supervisor: “sequência, etapas, nomes técnicos”, “não deixa ruim de operar, evita rodeios”) =====
   Só no modo enxuto (empurradores). Menu em PCM_MENU (js/85). Aqui:
   · Situação da frota (enxhoje): matriz ou cartões · Pendências (enxpend): o que cada etapa tem pendente agora, em colunas, cada cartão leva à tela que resolve
   · 3.3 Calibração do MCP (enxcal): folga de válvulas, bicos injetores e demais ajustes do Anexo I por motor (mesma conta da tela Calibração)
   · 4.1 Plano de ação (enxacao): ação · responsável · prazo · situação · conclusão com evidência (PDCA); registros snap tipo 'acao'
   · checklist de fechamento mensal (pcmChecklist): mostrado na 4.2 e conferido na emissão do relatório
   · faixa das etapas no topo (pcmFaixa, pelo opPassos do js/84) e títulos técnicos (PCM_TIT, pelo render) */
'use strict';
const PCM_ETAPAS = [['1', 'Recebimento', ['enxhor', 'enxcor']], ['2', 'Planejamento', ['enxcr', 'enx', 'cxr']], ['3', 'Condição', ['oleo', 'enxcal', 'compr', 'anoleo', 'enxarr', 'enxsen', 'enxdiag']], ['4', 'Fechamento', ['enxacao', 'enxrel']]];
const PCM_TIT = { oleo: '3.1 Lubrificação · troca de óleo (FR 049_B)', compr: '3.2 Controles · compressão do MCP', anoleo: '3.2 Controles · análise de óleo do MCP' };
function pcmFaixa() {
  if (!PCM_ETAPAS.some(e => e[2].includes(VIEW)) && !['enxhoje', 'enxpend'].includes(VIEW)) return '';
  return `<nav class="op-ps" aria-label="Etapas do PCM"><a href="#enxhoje" class="${VIEW === 'enxhoje' ? 'on' : ''}">Situação da frota</a><i>→</i><a href="#enxpend" class="${VIEW === 'enxpend' ? 'on' : ''}">Pendências</a>${PCM_ETAPAS.map(([n, t, L]) => `<i>→</i><a href="#${L[0]}" class="${L.includes(VIEW) ? 'on' : ''}"><b>${n}</b> ${t}</a>`).join('')}</nav>`;
}
// ---------- plano de ação ----------
const pcmAcoes = () => recs('snap').filter(r => r.tipo === 'acao' && !r.excluido);
const pcmSitu = (a, ref) => a.st === 'cancelada' ? 'cancelada' : a.st === 'concluida' && (!ref || (a.concl || '') <= ref) ? 'concluida' : a.prazo && a.prazo < (ref || isoD(hoje())) ? 'atrasada' : 'aberta';
const PCM_SIT = { aberta: ['p-ok', 'No prazo'], atrasada: ['p-bad', 'Atrasada'], concluida: ['p-mut', 'Concluída'], cancelada: ['p-mut', 'Cancelada'] };
// ações que entram no relatório do período: abertas até o fim e as concluídas dentro dele · [ação, responsável, prazo, situação, nº, conclusão, evidência]
function pcmAcoesNoPeriodo(ini, fim) {
  return pcmAcoes().filter(a => a.st !== 'cancelada' && (a.date || '') <= fim && !(a.st === 'concluida' && (a.concl || '') < ini)).sort((a, b) => (a.num || '') < (b.num || '') ? -1 : 1)
    .map(a => { const s = pcmSitu(a, fim); return [a.txt, a.resp || '', a.prazo || '', s, a.num || '', s === 'concluida' ? a.concl : '', s === 'concluida' ? a.ev || '' : '']; });
}
const PCM_ORIG = ['Análise crítica do relatório mensal', 'Falha repetida (análise de causa raiz)', 'Auditoria interna / externa', 'Pendência do plano preventivo', 'Melhoria'];
function vEnxAcao() {
  const A = pcmAcoes(), ab = A.filter(a => a.st !== 'concluida' && a.st !== 'cancelada').sort((a, b) => (a.prazo || '9') < (b.prazo || '9') ? -1 : 1), fe = A.filter(a => a.st === 'concluida' || a.st === 'cancelada').sort((a, b) => (b.concl || '') < (a.concl || '') ? -1 : 1).slice(0, 20);
  const lin = (a, bt) => { const s = PCM_SIT[pcmSitu(a)]; return `<tr><td class="nowrap"><b>${esc(a.num || '')}</b><div class="note">${brD(a.date)}</div></td><td>${esc(a.txt)}<div class="note">${esc(a.orig || '')}</div>${a.ev ? `<div class="note">evidência: ${esc(a.ev)}</div>` : ''}</td><td>${esc(a.resp || '')}</td><td class="nowrap">${a.prazo ? brD(a.prazo) : '—'}</td><td><span class="pill ${s[0]}">${s[1]}</span>${a.concl ? `<div class="note">${brD(a.concl)}</div>` : ''}</td><td class="nowrap">${bt}</td></tr>`; };
  const tab = (L, bt, vz) => `<div class="tw"><table class="t"><thead><tr><th>Nº</th><th>Ação (o quê) · origem</th><th>Responsável</th><th>Prazo</th><th>Situação</th><th></th></tr></thead><tbody>${L.map(a => lin(a, bt(a))).join('') || `<tr><td colspan="6" class="note">${vz}</td></tr>`}</tbody></table></div>`;
  return enxCab('4.1 Plano de ação', 'Ação corretiva ou de melhoria com responsável e prazo · conclua com a evidência (verificação de eficácia) · o relatório gerencial mostra no prazo, atrasadas e concluídas no período', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Em andamento · ${ab.length}${ab.filter(a => pcmSitu(a) === 'atrasada').length ? ` · <span style="color:var(--badt)">${ab.filter(a => pcmSitu(a) === 'atrasada').length} atrasada(s)</span>` : ''}</h2>${tab(ab, a => `<button class="mbtn sm pri" data-acok="${a.id}">Encerrar</button>${can.admin() ? ` <button class="mbtn sm" data-acx="${a.id}">Cancelar</button>` : ''}`, 'Nenhuma ação em andamento.')}</div>
   <div class="card"><h2>Nova ação</h2><div class="g"><label class="f s6">Ação (o quê)<input id="acT" placeholder="ex.: substituir a bomba de água salgada do MCA 1 do CJA I e revisar o plano do item"></label>
     <label class="f s2">Origem<select id="acO">${PCM_ORIG.map(o => `<option>${o}</option>`).join('')}</select></label><label class="f s2">Responsável (quem)<input id="acR"></label><label class="f s2">Prazo (quando)<input type="date" id="acP" min="${isoD(hoje())}"></label></div>
     <div class="note" id="acE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn pri" data-acnova>Cadastrar ação</button></div></div>
   <div class="card"><h2>Concluídas e canceladas · últimas ${fe.length}</h2>${tab(fe, a => can.admin() ? `<button class="mbtn sm" data-acre="${a.id}">Reabrir</button>` : '', 'Nenhuma ainda.')}</div></div></div>`;
}
async function pcmAcaoNova() {
  if (!S.session) return loginModal(); const t = $('#acT').value.trim(), r = $('#acR').value.trim(), p = $('#acP').value, E = $('#acE');
  if (!t || !r || !p) return E.textContent = 'Preencha a ação, o responsável e o prazo.';
  const y = isoD(hoje()).slice(0, 4), n = pcmAcoes().filter(a => (a.num || '').startsWith('AC-' + y)).length + 1;
  await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'acao', num: 'AC-' + y + '-' + String(n).padStart(3, '0'), date: isoD(hoje()), txt: t, orig: $('#acO').value, resp: r, prazo: p, st: 'aberta', por: S.session.name });
  toast('Ação cadastrada.'); render();
}
function pcmAcaoConcluir(id) {
  const a = S.recs.get(id); if (!a) return; if (!S.session) return loginModal();
  modal(`<h2>Encerramento da ação ${esc(a.num)}</h2><p class="note">${esc(a.txt)}</p><div class="g"><label class="f s2">Data da conclusão<input type="date" id="acD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s4">Evidência / verificação de eficácia<input id="acV" placeholder="ex.: OM 47890 encerrada; sem nova falha em 30 dias"></label></div>
   <div class="note" id="acE2" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="acOk">Encerrar</button></div>`);
  $('#acOk').onclick = async () => { const d = $('#acD').value, v = $('#acV').value.trim(); if (!d || !v) return $('#acE2').textContent = 'Informe a data e a evidência.';
    Object.assign(a, { st: 'concluida', concl: d, ev: v, conclPor: S.session.name }); await saveRec(a); closeModal(); toast(a.num + ' concluída.'); render(); };
}
async function pcmAcaoSt(id, st) { const a = S.recs.get(id); if (!a || !can.admin()) return; Object.assign(a, { st, concl: st === 'cancelada' ? isoD(hoje()) : '', ev: st === 'aberta' ? '' : a.ev }); await saveRec(a); render(); }
// ---------- 3.3 Calibração do MCP ----------
// matriz motor × serviço (3.26, Supervisor: “calibração está com uma planilha gigante, terrível”): uma linha por motor, célula colorida com o restante
const PCM_CAB = { '1.1.11': 'Folga de válvulas', '1.1.12': 'Bicos injetores', '1.1.13': 'Ponto de injeção', '1.1.15': 'Rótulas do comb.', '1.1.17': 'Trocador de calor', '1.4.1': 'Caixa de mar' };
// gráfico de horas restantes por motor: o mesmo do relatório (rmeBarH, js/86) — regra do Supervisor: usar os gráficos que já existem no SMF
function pcmCalGraf(D, id) {   // 3.76: no modelo do “Intervalo remanescente até a troca de óleo” (Supervisor, 29/10/2026): linha do meio = vence agora, à esquerda quanto atrasou, à direita quanto falta
  const C = { venc: '#D93025', viag: '#F9AB00', ok: '#1E8E3E', sem: '#BDC1C6' }, T = { venc: '#C5221F', viag: '#B06000', ok: '#137333', sem: '#5F6368' }, iv = intervalo(A1M[id]).h || 1000;
  const L = D.filter(x => x.t.id === id).sort((a, b) => (a.s.rest == null ? 9e9 : a.s.rest) - (b.s.rest == null ? 9e9 : b.s.rest));
  const mxN = Math.max(1, ...L.filter(x => x.s.rest != null && x.s.rest < 0).map(x => -x.s.rest));
  const lin = L.map(x => { const r = x.s.rest, st = r == null ? 'sem' : x.s.st, neg = r != null && r < 0, w = r == null ? 0 : neg ? Math.max(4, -r / mxN * 100) : Math.max(3, Math.min(r, iv) / iv * 100);
    const tx = `<b style="color:${T[st] || T.ok}">${r == null ? 'sem histórico' : neg ? '−' + nf(-r) + ' h' : nf(r) + ' h'}</b>`, c = C[st] || C.ok;
    return `<div class="ol-sgr click" data-pcmv="${x.v.id}" title="Abrir as OMs preventivas deste empurrador"><span class="ol-sgl"><b>${esc(x.v.nome)}</b><small>${esc(posCurtoE(x.v, x.pos))}</small></span><span class="ol-sgL">${neg ? `${tx}<i style="width:${w}%;background:${c}"></i>` : ''}</span><span class="ol-sgR">${!neg ? `<i style="width:${w}%;background:${c}"></i>${tx}` : ''}</span></div>`; }).join('');
  return `<div class="ol-sg">${lin}<div class="ol-sgr ol-sgx"><span></span><span class="ol-sgL"><small>← atrasado</small></span><span class="ol-sgR"><small>vence agora · quanto falta →</small></span></div></div>`;
}
function vEnxCal() {
  const D = calibDados().filter(x => isMcp(x.pos)), n = k => D.filter(x => x.s.st === k).length, ord = { venc: 0, viag: 1, sem: 2, ok: 3 };
  const C = CALIB.map(c => c[0]).filter(id => D.some(x => x.t.id === id)), M = {};
  D.forEach(x => { const k = x.v.id + '|' + x.pos; (M[k] = M[k] || { v: x.v, pos: x.pos, c: {} }).c[x.t.id] = x; });
  const pior = r => Math.min(...Object.values(r.c).map(x => ord[x.s.st] ?? 4));
  const R = Object.values(M).sort((a, b) => pior(a) - pior(b) || a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }) || a.pos.localeCompare(b.pos));
  const cel = x => { if (!x) return '<td class="cal-c cal-na">—</td>'; const U = x.s.L; return `<td class="cal-c cal-${x.s.st}" title="${esc(x.t.id + ' ' + x.nm)} · a cada ${esc(ivTxt(x.t))} · última: ${U ? brD(U.date) + (U.h != null ? ' · ' + nf(U.h) + ' h' : '') : 'sem registro'}">${x.s.st === 'sem' ? 'sem ref.' : calVal(x)}</td>`; };
  return enxCab('3.2 Controles · calibração do MCP', 'Matriz motor × serviço de ajuste do Anexo I · cada célula mostra o restante (horas ou dias) até o vencimento · passe o mouse para ver a última execução', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Resumo</h2><div class="f2-ks">${[['Vencidas', n('venc'), 'var(--badt)'], ['Vencem na próxima viagem', n('viag'), 'var(--warnt)'], ['Sem referência', n('sem'), 'var(--warnt)'], ['Dentro do prazo', n('ok'), 'var(--okt)']].map(([l, x, c]) => `<div class="f2-k"><span>${l}</span><b${x ? ` style="color:${c}"` : ''}>${x}</b></div>`).join('')}</div>
     <p class="note"><b>Como lançar:</b> clique no empurrador → marque o serviço → “Apontar execução” com o horímetro de cada motor. Na calibração dos bicos (1.1.12) o ensaio de compressão vai no mesmo apontamento.</p></div>
   ${['1.1.11', '1.1.12'].filter(id => C.includes(id)).map(id => `<div class="card"><h2>${esc(PCM_CAB[id])} · horas restantes até a próxima calibração</h2><p class="note" style="margin-top:0">Anexo I ${esc(id)} · a cada ${esc(ivTxt(A1M[id]))} · mais urgente primeiro</p>${pcmCalGraf(D, id)}
     <div class="ol-leg"><span><i style="background:#D93025"></i>Vencida (atraso)</span><span><i style="background:#F9AB00"></i>Vence na próxima viagem</span><span><i style="background:#1E8E3E"></i>Em dia</span><span><i style="background:#BDC1C6"></i>Sem histórico</span></div>
     <p class="note">Linha do meio = vence agora · à esquerda, quanto atrasou · à direita, quanto falta (barra cheia = intervalo inteiro) · clique numa linha para abrir o empurrador.</p></div>`).join('')}
   <div class="card"><h2>Situação por motor · ${R.length} motores principais</h2><div class="ecr-lg"><span><i class="ms"></i>vencida</span><span><i class="lt"></i>vence na próxima viagem</span><span><i class="ok"></i>dentro do prazo</span><span><i class="fut"></i>sem referência</span></div>
     <div class="tw"><table class="cal-m"><thead><tr><th class="cal-n">Empurrador · motor</th>${C.map(id => `<th>${esc(PCM_CAB[id] || id)}<small>${esc(id)}</small></th>`).join('')}</tr></thead><tbody>
     ${R.map(r => `<tr><td class="cal-n"><a href="#enx" data-pcmv="${r.v.id}" title="Abrir as OMs preventivas deste empurrador"><b>${esc(r.v.nome)}</b> · ${esc(posCurtoE(r.v, r.pos))}</a></td>${C.map(id => cel(r.c[id])).join('')}</tr>`).join('') || `<tr><td colspan="${C.length + 1}" class="note">Nenhum item de calibração.</td></tr>`}</tbody></table></div></div></div></div>`;
}
{ const st = document.createElement('style'); st.textContent = '.cal-m{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}.cal-m th{background:#1F2A44;color:#fff;font-weight:600;padding:6px 6px;font-size:11px;text-align:center;line-height:1.25}.cal-m th small{display:block;opacity:.7;font-weight:400}.cal-m th.cal-n,.cal-m td.cal-n{text-align:left;white-space:nowrap;padding:5px 10px}.cal-m td{border:1px solid #E3E8EF;padding:5px 6px;text-align:center}.cal-m td.cal-n a{color:inherit;text-decoration:none}.cal-m td.cal-n a:hover{color:#1967D2;text-decoration:underline}.cal-c.cal-venc{background:#FCE8E6;color:#C5221F;font-weight:700}.cal-c.cal-viag{background:#FEF3E0;color:#B06000;font-weight:600}.cal-c.cal-ok{background:#E6F4EA;color:#137333}.cal-c.cal-sem{background:#F5F8FE;color:#5F6368}.cal-c.cal-na{color:#BDC1C6}.cal-g{display:grid;grid-template-columns:1fr;gap:14px}.cal-g svg{max-width:1100px}'; document.head.appendChild(st); }
// ---------- checklist de fechamento mensal ----------
function pcmChecklist(ini, fim, R) {
  R = R || rmeDados(ini, fim); const V = S.cfg.frota.filter(v => !foraOp(v)), vn = id => esc(vName(id)), out = [], c = (t, n, d, h) => out.push({ t, ok: !n, d: n ? d : 'conferido', h });
  const semL = R.hor.flatMap(x => x.M.filter(m => m[4] === 1).map(m => vn(x.v) + ' ' + m[0])), inc = R.hor.flatMap(x => x.M.filter(m => m[4] === 3).map(m => vn(x.v) + ' ' + m[0]));
  c('Horímetros apontados no período', semL.length, `${semL.length} motor(es) sem leitura no período: ${semL.slice(0, 6).join(', ')}${semL.length > 6 ? '…' : ''}`, '#enxhor');
  c('Leituras de horímetro consistentes', inc.length, `${inc.length} motor(es) com leitura desconsiderada: ${inc.slice(0, 6).join(', ')}`, '#enxhor');
  const sl = R.cor.filter(x => x[8] == null); c('Corretivas liberadas', sl.length, `${sl.length} em reparo: ${sl.slice(0, 5).map(x => vn(x[1]) + ' OM ' + esc(x[2])).join(', ')}`, '#enxcor');
  const cf = oms().filter(o => o.tipo === 'C' && !o.excluido && o.liberacao && o.status !== 'encerrada' && String(o.abertura || '').slice(0, 10) <= fim); c('Corretivas conferidas pelo Supervisor', cf.length, `${cf.length}: ${cf.slice(0, 5).map(o => 'OM ' + esc(o.num)).join(', ')}`, '#enxcor');
  c('Rastreabilidade: serviço preventivo com nº de OM', R.N.per.semOm, `${R.N.per.semOm} serviço(s) registrado(s) sem o nº da OM do Sankhya`, '#enx');
  const cs = (R.cal || []).filter(x => x[4] === 'sem' && (x[2] === '1.1.11' || x[2] === '1.1.12')); c('Calibração do MCP com referência', cs.length, `${cs.length} item(ns) sem último serviço: ${[...new Set(cs.map(x => vn(x[0]) + ' ' + x[1]))].slice(0, 6).join(', ')}`, '#enxcal');
  const ce = (R.cmp || []).filter(x => x[2] == null); c('Compressão do MCP com ensaio', ce.length, `${ce.length} motor(es) sem ensaio registrado: ${ce.slice(0, 6).map(x => vn(x[0]) + ' ' + x[1]).join(', ')}`, '#compr');
  const ano = +fim.slice(0, 4), na = V.filter(v => !cronoBase(ano, v.id)); c(`Plano anual ${ano} aprovado`, na.length, `${na.length} empurrador(es) sem cronograma aprovado: ${na.slice(0, 6).map(v => esc(v.nome)).join(', ')}`, '#enxcr');
  const hi = pcmHorInc(); c('Horímetro dos registros consistente com as leituras', hi.length, `${hi.length} registro(s) com horímetro acima da leitura atual: ${[...new Set(hi.map(x => vn(x.v.id) + ' ' + (x.s.hp || x.pos)))].slice(0, 6).join(', ')}`, '#enxhor');
  const pl = rmePlano(); c('Análise crítica do Supervisor (comentário)', !(pl.conc || '').trim(), 'comentário do período em branco', '#enxrel');
  const at = pl.acoes.filter(x => x[3] === 'atrasada'); c('Plano de ação sem atraso', at.length, `${at.length} ação(ões) atrasada(s): ${at.slice(0, 5).map(x => esc(x[4])).join(', ')}`, '#enxacao');
  return out;
}
function pcmChecklistCard(ini, fim, R) {
  const L = pcmChecklist(ini, fim, R), n = L.filter(x => !x.ok).length;
  return `<div class="card"><h2>Checklist de fechamento · ${L.length - n} de ${L.length} conferidos${n ? ` · <span style="color:var(--warnt)">${n} pendência(s)</span>` : ''}</h2><table class="t"><tbody>
    ${L.map(x => `<tr><td style="width:28px;font-weight:700;color:${x.ok ? 'var(--okt)' : 'var(--warnt)'}">${x.ok ? '✓' : '!'}</td><td><b>${esc(x.t)}</b><div class="note">${x.d}</div></td><td style="width:1%">${x.ok ? '' : `<a class="mbtn sm" href="${x.h}">Resolver</a>`}</td></tr>`).join('')}</tbody></table>
    <p class="note">Na emissão o SMF confere de novo; com pendência, pede confirmação e registra as pendências na cópia emitida.</p></div>`;
}
// ---------- Pendências (dados) ----------
function pcmPainel() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), G = [[], [], [], []], add = (e, t, n, d, h) => { if (n) G[e].push({ t, n, d, h }); };
  const hDias = v => { const h = horAtual(v.id, mpos(v.id)); return h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : null; };
  const hv = V.filter(v => { const d = hDias(v); return d == null || d > 14; }); add(0, 'Horímetro desatualizado (mais de 14 dias)', hv.length, hv.map(v => esc(v.nome) + (hDias(v) == null ? ' (sem leitura)' : ' (' + hDias(v) + ' d)')).join(', '), '#enxhor');
  const hi = pcmHorInc(); add(0, 'Registro com horímetro inconsistente (item não vence até corrigir)', hi.length, [...new Set(hi.map(x => esc(x.v.nome) + ' ' + (x.s.hp || x.pos)))].join(', '), '#enxhor');
  const C = oms().filter(o => o.tipo === 'C' && !o.excluido && o.status !== 'encerrada'), cr = C.filter(o => !o.liberacao), cc = C.filter(o => o.liberacao);
  add(0, 'OM corretiva em aberto (empurrador indisponível)', cr.length, cr.map(o => esc(vName(o.vessel)) + ' · OM ' + esc(o.num) + ' · ' + esc(o.equip || o.sistema || '')).join('; '), '#enxcor');
  if (can.admin()) add(0, 'OM corretiva liberada aguardando conferência do Supervisor', cc.length, cc.map(o => 'OM ' + esc(o.num)).join(', '), '#enxcor');
  const D = enxDados(), nv = D.reduce((a, x) => a + x.venc.length, 0), nm = D.reduce((a, x) => a + x.mes.length, 0), ns = D.reduce((a, x) => a + x.sem.length, 0);
  add(1, 'Backlog vencido (serviços do plano)', nv, D.filter(x => x.venc.length).sort((a, b) => b.venc.length - a.venc.length).map(x => `<a href="#enx" data-pcmv="${x.v.id}">${esc(x.v.nome)}</a> ${x.venc.length}`).join(' · '), '#enx');
  add(1, 'Vencimento no mês', nm, D.filter(x => x.mes.length).map(x => `${esc(x.v.nome)} ${x.mes.length}`).join(' · '), '#enx');
  add(1, 'Item do plano sem referência inicial (sem vencimento calculado)', ns, 'registre o último serviço feito com data e horímetro reais', '#enx');
  const ano = hoje().getFullYear(), na = V.filter(v => !cronoBase(ano, v.id)); add(1, `Plano anual ${ano} não aprovado`, na.length, na.map(v => esc(v.nome)).join(', '), '#enxcr');
  try { const L = lubDados().filter(x => x.s && !x.saida && (x.s.st === 'venc' || (x.horas != null && x.horas <= 50) || (x.dias != null && x.dias <= 15))); add(2, 'Troca de óleo vencida ou próxima', L.length, L.slice(0, 8).map(x => esc(x.v.nome) + ' ' + esc(x.e.nome) + (x.s.st === 'venc' ? ' (vencida)' : '')).join('; '), '#oleo'); } catch (e) { }
  try { const L = cmpDados().filter(x => x.st === 'fora' || x.st === 'prog' || x.vencida); add(2, 'Compressão do MCP: fora do limite, programar overhaul ou ensaio vencido', L.length, L.map(x => esc(x.v.nome) + ' ' + x.pos + ' (' + (CMP_ST[x.st] || ['', x.st])[1].toLowerCase() + (x.vencida ? ', ensaio vencido' : '') + ')').join('; '), '#compr'); } catch (e) { }
  try { const L = calibDados().filter(x => isMcp(x.pos) && x.s.st === 'venc'); add(2, 'Calibração do MCP vencida', L.length, L.map(x => esc(x.v.nome) + ' ' + x.pos + ' ' + x.t.id).join('; '), '#enxcal'); } catch (e) { }
  const h = hoje(), mi = isoD(new Date(h.getFullYear(), h.getMonth() - 1, 1)), mf = isoD(new Date(h.getFullYear(), h.getMonth(), 0));
  const em = rmeEmitidos().some(s => s.fim >= mf && s.ini <= mi); add(3, `Relatório gerencial de ${MESES[+mi.slice(5, 7) - 1]}/${mi.slice(0, 4)} não emitido`, em ? 0 : 1, 'feche o mês: checklist, comentário e emissão', '#enxrel');
  const at = pcmAcoes().filter(a => pcmSitu(a) === 'atrasada'); add(3, 'Ação do plano atrasada', at.length, at.map(a => esc(a.num) + ' · ' + esc(a.resp || '')).join('; '), '#enxacao');
  return G;
}
function vEnxHoje() {
  return enxCab('Situação da frota', 'Como a frota está hoje · o que fazer está em <a href="#enxpend">Pendências</a>', '<button class="mbtn" data-enxreset>Reorganizar</button>') + sfCard() + '</div></div>';
}
// Pendências em colunas por etapa (SMF 3.45; Supervisor, 29/10/2026: separada da Situação da frota, “organizada assim” como o quadro de OMs). Pendência não anda entre colunas: some quando é resolvida
const PD_ETAPAS = [['1 · Recebimento', 'horímetros e corretivas'], ['2 · Planejamento (PCM)', 'backlog e plano anual'], ['3 · Monitoramento de condição', 'óleo, compressão e calibração'], ['4 · Fechamento mensal', 'relatório e plano de ação']];
const pdTipo = t => /aguardando confer/i.test(t) ? 'inf' : /vencid|atras|aberto|desatualizado|inconsistente|fora do limite|sem referência/i.test(t) ? '' : 'at';
function vEnxPend() {
  const G = pcmPainel(), tot = G.reduce((a, g) => a + g.length, 0);
  return enxCab('Pendências', tot ? `${tot} tipo(s) de pendência · da esquerda para a direita, na ordem das etapas; cada cartão abre a tela que resolve` : 'Nenhuma pendência: frota dentro do prazo', '<button class="mbtn" data-enxreset>Reorganizar</button>').replace('<div class="cm-ws">', '<div class="cm-ws cm-grid pd-cols">')
   + G.map((L, i) => `<div class="card pd-col"><h2>${PD_ETAPAS[i][0]} <span class="pd-q">${L.length}</span></h2><div class="pd-sub">${PD_ETAPAS[i][1]}</div>
    ${L.length ? L.map(x => `<div class="pd-cd ${pdTipo(x.t)}"><div class="pd-t"><span class="pd-n">${x.n}</span><b>${esc(x.t)}</b></div><div class="pd-d">${x.d}</div><a class="mbtn sm pri" href="${x.h}">Abrir</a></div>`).join('') : '<div class="pd-ok">✓ Sem pendência</div>'}</div>`).join('')
   + '</div><p class="note" style="margin-top:10px">Vermelho = vencido ou atrasado · âmbar = vence no mês ou falta aprovar/emitir · azul = aguardando a sua conferência. Cada coluna é uma janela: arraste, mude o tamanho ou minimize; “Reorganizar” volta ao padrão.</p></div>';
}
// ---------- Situação da frota: matriz empurrador × sistema ou cartões (SMF 3.44; Supervisor, 29/10/2026: “uma visão geral da frota de como ela está hoje”) ----------
// mesma conta do Backlog (enxDados: vencido · vence no mês · sem histórico) e da saída (frotaMatriz: bloqueado = Crítica vencida sem OM ou falha Crítica sem OM)
const SF_SIS = ['Propulsão', 'Governo', 'Geração', 'Emergência', 'Salvag.', 'Combust.', 'Comunic.', 'Amarra', 'Casco', 'Habitab.', 'Naveg.'];
const SF_SIT = [['ok', 'Liberado'], ['at', 'Com restrição'], ['bad', 'Bloqueado'], ['bad', 'Interditado']];
const sfModo = () => { try { return localStorage.getItem('smf_sf_modo') === 'cartoes' ? 'cartoes' : 'matriz'; } catch (e) { return 'matriz'; } };
function sfDados() {
  const D = enxDados(), FM = frotaMatriz().filter(f => f.sit >= 0); let C = []; try { C = cmpDados(); } catch (e) { }
  const COR = oms().filter(o => o.tipo === 'C' && !o.excluido && !['encerrada', 'cancelada'].includes(o.status));
  return FM.map(f => { const x = D.find(d => d.v === f.v); if (!x) return null; const P = x.P, v = f.v;
    const den = P.filter(y => y.g !== 'sem').length, ok = P.filter(y => !['venc', 'mes', 'sem'].includes(y.g)).length;
    const cm = C.filter(c => c.v === v).map(c => { const u = c.H[c.H.length - 1]; return u ? u.min : null; }).filter(z => z != null), mn = cm.length ? Math.min(...cm) : null;
    const s = situDe(v), dd = h => h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : null;
    const mot = [...mcpPos(v).map(p => [p, 'MCP ' + ((v.mcpMod || {})[p] || '') + ((v.rev || {})[p] ? ' · ' + v.rev[p] : '')]), ...MCAS.filter(p => (v.mca || {})[p]).map(p => [p, (v.mcaMod || {})[p] || v.mca[p]])]
      .map(([p, m]) => { const h = horAtual(v.id, p); return { p, m, h, d: dd(h) }; });
    return { v, f, P, sit: f.sit, loc: !s ? '' : s.st === 'viagem' ? 'em viagem' : 'no porto',
      venc: x.venc.length, mes: x.mes.length, sem: x.sem.length, ok, pct: den ? Math.round((den - P.filter(y => y.g === 'venc').length) / den * 100) : null,
      crit: P.filter(y => y.g === 'venc' && enxCrit(y.t)).length,
      sis: SF_SIS.map((_, i) => P.filter(y => parseInt(y.t.id) === i + 1)),
      oleo: P.filter(y => /troca/i.test(y.t.chk || '') && /óleo/i.test(y.t.chk || '')), cal: P.filter(y => CALIB.some(c => c[0] === y.t.id)),
      arr: P.filter(y => ARR_ITENS.includes(y.t.id)), sen: P.filter(y => SEN_ITENS.includes(y.t.id)), amo: P.filter(y => y.t.id === '1.1.29'),
      lab: (() => { const st = mcpPos(v).map(p => { const U = typeof laudos === 'function' ? laudos(v.id, p) : [], u = U[U.length - 1]; return u ? laudoSt(u).st : null; }).filter(Boolean); return !st.length ? null : st.includes('venc') ? 'venc' : st.includes('viag') ? 'mes' : 'ok'; })(),
      cmp: mn == null ? null : mn < 1.27 ? 'venc' : mn < 1.45 ? 'mes' : 'ok', cor: COR.filter(o => o.vessel === v.id).length, mot }; }).filter(Boolean);
}
const sfCel = (L, at) => { if (!L.length) return `<span class="sf-na">—</span>`; const v = L.filter(x => x.g === 'venc').length, m = L.filter(x => x.g === 'mes').length;
  return v ? `<span class="sf-c sf-r"${at}>${v}</span>` : m ? `<span class="sf-c sf-a"${at}>${m}</span>` : L.every(x => x.g === 'sem') ? `<span class="sf-o"${at}></span>` : `<span class="sf-g"${at}></span>`; };
const sfIco = st => !st ? '<span class="sf-o"></span>' : st === 'ok' ? '<span class="sf-g"></span>' : `<span class="sf-c ${st === 'venc' ? 'sf-r' : 'sf-a'}">!</span>`;
// clique numa coluna de condição: a tela de origem abre com as linhas do empurrador destacadas (Supervisor, 29/10/2026: “ir direto para os dados que ele está puxando”)
let SF_FOCO = null;   // { nome, ate, rolou }: vale por alguns segundos porque a tela de origem pode ser redesenhada logo depois de aberta
document.addEventListener('click', e => { const a = e.target.closest('[data-sff]'); if (a) SF_FOCO = { nome: a.dataset.sff, ate: Date.now() + 4000, rolou: false }; }, true);
function sfFocoAplicar() {
  const F = SF_FOCO; if (!F || Date.now() > F.ate) return; const nome = F.nome;
  const re = new RegExp('^' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s*$|\\s*·|\\s+(BB|BE|CE|MCP|MCA)\\b)');
  setTimeout(() => { const T = [], tb = VIEW === 'enxcor' ? $('#main table') : null;   // na 1.2 só a tabela de corretivas abertas (o histórico de encerradas vem depois)
    (tb ? [...tb.querySelectorAll('tr')] : $$('#main tr')).forEach(tr => { const c = [...tr.children].find(td => re.test(td.textContent.trim()) || [...td.querySelectorAll('b')].some(b => re.test(b.textContent.trim()))); if (!c) return;
      T.push(tr); let n = (c.rowSpan || 1) - 1, r = tr; while (n-- > 0 && (r = r.nextElementSibling)) T.push(r); });
    if (!T.length) { if (F.rolou) return; F.rolou = true;
      const sel = $('#ecV'), v = S.cfg.frota.find(z => z.nome === nome);   // 1.2 sem corretiva aberta: o formulário de abertura já vem com o empurrador
      if (VIEW === 'enxcor' && sel && v) { sel.value = v.id; sel.dispatchEvent(new Event('change', { bubbles: true })); sel.closest('.card').scrollIntoView({ block: 'start' }); sel.classList.add('sf-foco-c'); return toast(nome + ': nenhuma corretiva aberta · a abertura de OM já está com o empurrador escolhido.', 5000); }
      return toast(nome + ': sem dados nesta tela.'); }
    T.forEach(tr => tr.classList.add('sf-foco')); if (!F.rolou) { F.rolou = true; T[0].scrollIntoView({ block: 'center' }); } }, 350);
}
const sfSit = x => `<span class="sf-s ${SF_SIT[x.sit][0]}">● ${SF_SIT[x.sit][1]}</span>${x.loc ? ` <span class="sf-mut">· ${x.loc}</span>` : ''}`;
function sfMatriz(L) {
  const hr = x => x.mot.filter(m => isMcp(m.p)).map(m => `<div><span class="sf-p">${m.p}</span> ${m.h ? nf(m.h.h) + ' h' : '—'} <span class="${m.d == null || m.d > 14 ? 'sf-red' : 'sf-mut'}">${m.d == null ? 'sem leitura' : m.d + ' d'}</span></div>`).join('');
  const lk = (x, h, inner) => `<a href="${h}" class="sf-lk" data-sff="${esc(x.v.nome)}">${inner}</a>`;
  return `<div class="tw"><table class="sf-mx"><thead><tr class="sf-gr"><th colspan="3"></th><th colspan="2" class="sf-sep">Liberação</th><th colspan="${SF_SIS.length}" class="sf-sep">Manutenção preventiva</th><th colspan="6" class="sf-sep">Condição</th></tr><tr><th class="l">Empurrador</th><th class="l">Horímetro MCP</th><th class="l">Itens em dia</th><th class="sf-sep">Críticos<small>NP 6.3</small></th><th title="Corretivas abertas (1.2 Manutenção corretiva)"><small>abertas</small>Corretivas</th>${SF_SIS.map((s, i) => `<th${i ? '' : ' class="sf-sep"'}><small>${i + 1}.0</small>${s}</th>`).join('')}<th class="sf-sep" title="3.1 Lubrificação · troca de óleo"><small>3.1 troca</small>Óleo</th><th title="3.2 Controles · 1 Calibração"><small>3.2·1</small>Calibr.</th><th title="3.2 Controles · 2 Compressão"><small>3.2·2</small>Compr.</th><th title="3.2 Controles · 3 Análise de óleo"><small>3.2·3</small>Laudo</th><th title="3.2 Controles · 4 Sistema de arrefecimento"><small>3.2·4</small>Arrefec.</th><th title="3.2 Controles · 5 Sensores"><small>3.2·5</small>Sensor</th></tr></thead><tbody>
    ${L.map(x => `<tr><td class="sf-n" data-pcmv="${x.v.id}"><b>${esc(x.v.nome)}</b><div>${sfSit(x)}</div></td><td class="sf-hr">${hr(x)}</td>
      <td class="nowrap"><span class="sf-bar"><i style="width:${x.pct || 0}%"></i></span><span class="sf-pc">${x.pct == null ? '—' : x.pct + '%'}</span></td>
      <td class="sf-cc sf-sep">${x.crit ? `<span class="sf-c sf-r" data-pcmv="${x.v.id}" title="Itens críticos da NP 6.3 vencidos">${x.crit}</span>` : '<span class="sf-g"></span>'}</td>
      <td class="sf-cc">${lk(x, '#enxcor', x.cor ? `<span class="sf-c sf-r">${x.cor}</span>` : '<span class="sf-g"></span>')}</td>
      ${x.sis.map((S0, i) => `<td class="sf-cc${i ? '' : ' sf-sep'}">${sfCel(S0, ` data-pcmv="${x.v.id}" data-pcms="${i + 1}" title="${esc(x.v.nome)} · ${i + 1}.0 ${SF_SIS[i]}"`)}</td>`).join('')}
      <td class="sf-cc sf-sep">${lk(x, '#oleo', sfCel(x.oleo, ''))}</td><td class="sf-cc">${lk(x, '#enxcal', sfCel(x.cal, ''))}</td>
      <td class="sf-cc">${lk(x, '#compr', sfIco(x.cmp))}</td>
      <td class="sf-cc">${lk(x, '#anoleo', x.amo.some(y => y.g === 'venc') ? sfCel(x.amo, ' title="Amostra de óleo vencida"') : x.lab && x.lab !== 'ok' ? sfIco(x.lab) : x.amo.some(y => y.g === 'mes') ? sfCel(x.amo, '') : sfIco(x.lab))}</td>
      <td class="sf-cc">${lk(x, '#enxarr', sfCel(x.arr, ''))}</td><td class="sf-cc">${lk(x, '#enxsen', sfCel(x.sen, ''))}</td>
      </tr>`).join('')}</tbody></table></div>
    <p class="note">Clique no nome ou numa célula de sistema para abrir o empurrador na 2.2 naquele sistema; Liberação = o que bloqueia ou restringe a saída (item crítico da NP 6.3 vencido, corretiva aberta); as colunas de condição (3.1 e as cinco abas da 3.2) e as corretivas abrem a tela de origem com o empurrador destacado. Análise de óleo: número = amostra vencida ou do mês, <b>!</b> = último laudo com alerta. Itens em dia = itens do Anexo I não vencidos ÷ itens com histórico. Compressão: <b>!</b> vermelho abaixo de 1,27 MPa (manual), âmbar abaixo de 1,45 MPa (programar overhaul). Horímetro em vermelho: mais de 14 dias sem leitura.</p>`;
}
function sfCartoes(L) {
  return `<div class="sf-cards">${L.map(x => { const t = x.venc + x.mes + x.ok || 1;
    return `<div class="sf-cd" data-pcmv="${x.v.id}"><div class="sf-cdh"><b>${esc(x.v.nome)}</b><span class="sf-tag ${SF_SIT[x.sit][0]}">${SF_SIT[x.sit][1]}</span></div>
      <table class="sf-mt">${x.mot.map(m => `<tr><td><span class="sf-dot ${isMcp(m.p) ? 'mcp' : 'mca'}"></span>${m.p}</td><td>${esc(m.m)}</td><td class="r nowrap">${m.h ? nf(m.h.h) + ' h' : '—'}${m.d != null && m.d > 14 ? ` <span class="sf-red">${m.d} d</span>` : ''}</td></tr>`).join('')}</table>
      <div class="sf-mut">${x.loc ? x.loc[0].toUpperCase() + x.loc.slice(1) : 'Local não informado'}${x.cor ? ` · <b class="sf-red">${x.cor} corretiva${x.cor === 1 ? '' : 's'} aberta${x.cor === 1 ? '' : 's'}</b>` : ''}</div>
      <div class="sf-st"><i style="width:${x.venc / t * 100}%;background:#C5221F"></i><i style="width:${x.mes / t * 100}%;background:#F9AB00"></i><i style="width:${x.ok / t * 100}%;background:#1E8E3E"></i></div>
      <div class="sf-pl">${x.venc ? `<span class="pill p-bad">${x.venc} vencido${x.venc === 1 ? '' : 's'}</span>` : ''}${x.crit ? `<span class="pill p-bad"><b>${x.crit} crítico${x.crit === 1 ? '' : 's'} NP 6.3</b></span>` : ''}${x.mes ? `<span class="pill p-warn">${x.mes} no mês</span>` : ''}<span class="pill p-ok">${x.ok} em dia</span>${x.sem ? `<span class="pill p-mut">${x.sem} sem histórico</span>` : ''}</div></div>`; }).join('')}</div>
    <p class="note">Clique no cartão para abrir o empurrador na 2.2. Barra: vencidos · vencem no mês · em dia.</p>`;
}
function sfCard() {
  const L = sfDados(), n = k => L.filter(x => x.sit === k).length, via = L.filter(x => x.loc === 'em viagem').length, cr = L.reduce((a, x) => a + x.crit, 0), md = sfModo();
  return `<div class="card"><h2>Situação da frota · ${md === 'matriz' ? 'empurrador × sistema do Anexo I' : 'cartões por empurrador'}</h2>
    <div class="sf-k">${[['Liberados', n(0), 'var(--okt)'], ['Com restrição', n(1), 'var(--warnt)'], ['Bloqueados', n(2) + n(3), 'var(--badt)'], ['Em viagem', via, ''], ['Críticos NP 6.3 vencidos', cr, cr ? 'var(--badt)' : 'var(--okt)']].map(([l, v, c]) => `<div><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${v}</b></div>`).join('')}
      <span class="sp"></span><div class="seg"><button data-sfm="matriz" class="${md === 'matriz' ? 'on' : ''}">▦ Matriz</button><button data-sfm="cartoes" class="${md === 'cartoes' ? 'on' : ''}">▤ Cartões</button></div></div>
    ${md === 'matriz' ? `<div class="sf-leg"><span><span class="sf-c sf-r">3</span> vencidos</span><span><span class="sf-c sf-a">2</span> vencem no mês</span><span><span class="sf-g"></span> em dia</span><span><span class="sf-o"></span> sem histórico</span><span><span class="sf-na">—</span> não se aplica</span></div>` + sfMatriz(L) : sfCartoes(L)}</div>`;
}
const PD_N = { k: null, at: 0, n: 0 };
// contadores do menu (baratos: sem recalcular relatório)
function pcmContagem() {
  const C = {}; try { C.enx = enxDados().reduce((a, x) => a + x.venc.length, 0); } catch (e) { }
  try { const k = S.recs.__v + '|' + isoD(hoje()); if (PD_N.k !== k || Date.now() - PD_N.at > 20000) Object.assign(PD_N, { k, at: Date.now(), n: pcmPainel().reduce((a, g) => a + g.length, 0) }); C.enxpend = PD_N.n; } catch (e) { }   // contagem com memória: pcmPainel custa ~0,25 s
  C.enxcor = oms().filter(o => o.tipo === 'C' && !o.excluido && o.status !== 'encerrada').length;
  C.enxacao = pcmAcoes().filter(a => pcmSitu(a) === 'atrasada').length; return C;
}
// ---------- telas e cliques ----------
const pcmAfter = k => () => { const m = $('#main');
  m.onclick = async e => { const t = e.target.closest('[data-pcmv],[data-sfm],[data-acnova],[data-acok],[data-acx],[data-acre]'); if (!t) return; const d = t.dataset;
    if (d.sfm) { try { localStorage.setItem('smf_sf_modo', d.sfm); } catch (x) { } return render(); }
    if (d.pcmv !== undefined) { e.preventDefault(); ENX.v = d.pcmv; ENX.abertos = new Set();
      if (d.pcms) { const v = vessel(d.pcmv); enxDados().find(x => x.v === v).P.filter(y => parseInt(y.t.id) === +d.pcms && ['venc', 'mes', 'sem'].includes(y.g)).forEach(y => ENX.abertos.add(enxEq(y.t) + ' · ' + posCurtoE(v, y.pos))); }
      location.hash = '#enx'; return; }
    if (d.acnova !== undefined) return pcmAcaoNova();
    if (d.acok !== undefined) return pcmAcaoConcluir(d.acok);
    if (d.acx !== undefined) return pcmAcaoSt(d.acx, 'cancelada');
    if (d.acre !== undefined) return pcmAcaoSt(d.acre, 'aberta'); };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_' + k + '_lay', '[data-enxreset]'); };
Object.assign(VX, { enxhoje: vEnxHoje, enxpend: vEnxPend, enxcal: vEnxCal, enxacao: vEnxAcao }); ['enxhoje', 'enxpend', 'enxcal', 'enxacao'].forEach(k => { AFTER[k] = pcmAfter(k); });
Object.assign(NP_TAG, { enxhoje: '7.3', enxpend: '7.3', enxcal: '7.3 · Anexo I', enxacao: '9 e 10' });
// ---------- horímetro inconsistente nos registros (SMF 3.28; Supervisor: “as horas estão com erros absurdos”) ----------
// situacao() marca inc quando o último serviço tem horímetro acima da leitura atual; aqui a lista e a correção do registro de origem
function pcmHorInc() {
  const out = []; S.cfg.frota.filter(v => !foraOp(v)).forEach(v => painelVessel(v).forEach(x => { if (x.s.inc) out.push(x); }));
  return out.sort((a, b) => a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }) || a.pos.localeCompare(b.pos) || a.t.id.localeCompare(b.t.id, 'pt-BR', { numeric: true }));
}
const PCM_SRC = s => !s ? '—' : s === 'base' ? 'apontamento de OM preventiva' : s.startsWith('om:') ? 'OM preventiva ' + s.slice(3) : s.startsWith('fr049') ? 'FR 049_B ' + s.slice(6) : s === 'marco' ? 'marco zero da implantação' : s.startsWith('corr:') ? 'corretiva ' + s.slice(5) : s;
function pcmHorIncCard() {
  const L = pcmHorInc(); if (!L.length) return '';
  return `<div class="card"><h2 style="color:var(--badt)">Registros com horímetro inconsistente · ${L.length}</h2><p class="note">O último serviço foi registrado com horímetro <b>acima</b> da leitura atual do motor (digitação, horímetro de outro motor ou horímetro trocado). Enquanto não for corrigido, o item fica “sem referência” e não vence. Corrija com o horímetro real do dia do serviço.</p>
    <div class="tw"><table class="t"><thead><tr><th>Empurrador · motor</th><th>Item</th><th>Registro de origem</th><th class="r">Horímetro registrado</th><th class="r">Leitura atual</th><th></th></tr></thead><tbody>
    ${L.map(x => `<tr><td><b>${esc(x.v.nome)}</b> · ${esc(posCurtoE(x.v, x.s.hp || x.pos))}</td><td>${esc(x.t.id)} ${esc(x.t.chk || x.t.item)}</td><td>${esc(PCM_SRC(x.s.L.src))} · ${brD(x.s.L.date)}</td><td class="r"><b style="color:var(--badt)">${nf(x.s.L.h)} h</b></td><td class="r">${nf(x.s.cur)} h</td><td><button class="mbtn sm pri" data-hcorr="${x.v.id}|${x.pos}|${x.t.id}">Corrigir horímetro</button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function pcmHorCorrigir(vid, pos, item) {
  const v = vessel(vid), t = A1M[item], L = ultimoServico(vid, pos, item); if (!v || !t || !L) return; if (!S.session) return loginModal();
  const hp = posHor(pos, t, vid), perto = horEm(vid, hp, L.date), cur = horAtual(vid, hp), src = L.src || '';
  if (src === 'marco' || src.startsWith('corr:') || src.startsWith('laudo')) return toast('Este registro vem do ' + PCM_SRC(src) + (src === 'marco' ? ': corrija o marco zero em Administração.' : ': registre o serviço de novo na 2.2 (Apontar execução) com a data e o horímetro reais; o registro mais novo passa a valer.'), 8000);
  const irmaos = src === 'base' ? recs('base').filter(b => b.vessel === vid && b.date === L.date && !b.nf && !b.excluido && +b.h === +L.h && A1M[b.item] && posHor(b.pos, A1M[b.item], vid) === hp) : [];
  modal(`<h2>Corrigir horímetro · ${esc(v.nome)} · ${esc(posCurtoE(v, hp))}</h2><p class="note">${esc(item)} ${esc(t.chk || t.item)} · ${esc(PCM_SRC(src))} de ${brD(L.date)}</p>
   <table class="t"><tbody><tr><td>Horímetro registrado</td><td class="r"><b style="color:var(--badt)">${nf(L.h)} h</b></td></tr><tr><td>Leitura mais próxima do dia do serviço</td><td class="r">${perto ? nf(perto.h) + ' h em ' + brD(perto.date) : '—'}</td></tr><tr><td>Leitura atual</td><td class="r">${cur ? nf(cur.h) + ' h em ' + brD(cur.date) : '—'}</td></tr></tbody></table>
   <div class="g"><label class="f s3">Horímetro correto no dia do serviço<input id="hcH" inputmode="decimal" value="${perto ? perto.h : ''}"></label></div>
   ${irmaos.length > 1 ? `<label class="row" style="gap:6px"><input type="checkbox" id="hcT" checked> Corrigir também os outros ${irmaos.length - 1} serviço(s) apontados no mesmo dia com o mesmo horímetro${L.om ? '' : ''}</label>` : ''}
   <div class="note" id="hcE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="hcOk">Corrigir</button></div>`);
  $('#hcOk').onclick = async () => { const h = +String($('#hcH').value).replace(/\./g, '').replace(',', '.'), E = $('#hcE');
    if (!(h > 0)) return E.textContent = 'Informe o horímetro.'; if (cur && !cur.est && h > cur.h) return E.textContent = 'O horímetro do serviço não pode ser maior que a leitura atual (' + nf(cur.h) + ' h).';
    const ev = { at: Date.now(), by: S.session.name, ev: 'Horímetro corrigido de ' + L.h + ' para ' + h + ' h (inconsistente com a leitura)' };
    if (src === 'base') { const R = ($('#hcT') && $('#hcT').checked) ? irmaos : irmaos.filter(b => b.item === item && b.pos === pos).slice(0, 1);
      for (const b of R) { b.hCorrDe = b.hCorrDe ?? b.h; b.h = h; b.hist = (b.hist || []).concat([ev]); await saveRec(b); } }
    else if (src.startsWith('om:')) { const o = oms().find(o => o.num === src.slice(3) && o.vessel === vid); if (o) { o.hreal = h; o.hist = (o.hist || []).concat([ev]); await saveRec(o); } }
    else if (src.startsWith('fr049')) { const r = recs('lub').find(r => r.tipo === 'fr049' && r.vessel === vid && r.date === L.date && (r.eq || []).some(q => q.pos === pos && (q.itens || []).includes(item)));
      if (r) { r.eq.filter(q => q.pos === pos && +q.hr === +L.h).forEach(q => { q.hr = h; }); r.hist = (r.hist || []).concat([ev]); await saveRec(r); } }
    closeModal(); toast('Horímetro corrigido.'); render(); };
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-hcorr]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const [v, p, i] = b.dataset.hcorr.split('|'); pcmHorCorrigir(v, p, i); }, true);
// ---------- 3.2 Condição dos MCP (SMF 3.56; Supervisor, 29/10/2026: “coloca esses 3 numa mesma janela e cria uma janela para o diagnóstico de condição dos MCP da frota”) ----------
// um item no menu; em cima das telas Compressão (compr), Calibração (enxcal) e Análise de óleo (anoleo): as abas e o diagnóstico (compressão + consumo de óleo + último laudo + calibração → recomendação)
// 3.58 (Supervisor, 29/10/2026: “1 calibração, 2 compressão, 3 análise de óleo numa tela com abas, ‘Controles’; outra aba ‘Diagnósticos’ só com o diagnóstico”)
const MC_VIEWS = [['enxcal', '1 · Calibração'], ['compr', '2 · Compressão'], ['anoleo', '3 · Análise de óleo'], ['enxarr', '4 · Sistema de arrefecimento'], ['enxsen', '5 · Sensores']];
const MC_DOT = { ok: '#1E8E3E', at: '#F9AB00', bad: '#C5221F', sem: '#9AA4B1' };
function mcDiag() {
  const CM = lubConsumoMCP(120).out, CAL = calibDados().filter(x => isMcp(x.pos)), out = [];
  S.cfg.frota.filter(v => !foraOp(v) && !(v.off || []).includes('MCP')).forEach(v => mcpPos(v).forEach(pos => {
    const c = cmpStatus(v, pos), cs = { fora: 'bad', prog: 'at', aten: 'at', sem: 'sem', ok: 'ok' }[c.st], co = CM.find(x => x.v === v && x.p === pos) || {}, os = { venc: 'bad', viag: 'at', ok: 'ok', sem: 'sem' }[co.st || 'sem'];
    const L = laudos(v.id, pos), ul = L[L.length - 1], ls = ul ? laudoSt(ul) : null, lst = !ul ? 'sem' : { venc: 'bad', viag: 'at', ok: 'ok' }[ls.st];
    const cl = CAL.filter(x => x.v === v && x.pos === pos), clv = cl.filter(x => x.s.st === 'venc'), cst = !cl.length ? 'sem' : clv.length ? 'bad' : cl.every(x => x.s.st === 'sem') ? 'sem' : 'ok';
    let rec, rc;
    if (cs === 'bad' || (lst === 'bad' && (cs === 'at' || os !== 'ok')) || (os === 'bad' && cs === 'at')) { rec = 'Programar inspeção / retífica (overhaul)'; rc = 'bad'; }
    else if (lst === 'bad' || os === 'bad' || cs === 'at' || lst === 'at' || os === 'at') { rec = 'Monitorar: antecipar ensaio de compressão e amostragem de óleo'; rc = 'at'; }
    else if (cst === 'bad') { rec = 'Calibração vencida: ' + clv.map(c => c.nm.toLowerCase()).join(', '); rc = 'at'; }
    else if (cs === 'sem' || lst === 'sem') { rec = 'Completar a base: ' + [cs === 'sem' ? 'ensaio de compressão' : '', lst === 'sem' ? 'análise de óleo' : ''].filter(Boolean).join(' e '); rc = 'sem'; }
    else { rec = 'Manter'; rc = 'ok'; }
    out.push({ v, pos, c, cs, co, os, ul, ls, lst, clv, cst, rec, rc, ord: { bad: 0, at: 1, sem: 2, ok: 3 }[rc] }); }));
  return out.sort((a, b) => a.ord - b.ord || a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }));
}
function mcDiagCard() {
  const D = mcDiag(), dot = s => `<i class="mc-dot" style="background:${MC_DOT[s]}"></i>`, n = k => D.filter(x => x.rc === k).length, P = { bad: 'p-bad', at: 'p-warn', sem: 'p-mut', ok: 'p-ok' };
  return `<div class="card mc-diag"><h2>Diagnóstico de condição dos MCP da frota</h2>
    <div class="sf-k">${[['Programar overhaul', n('bad'), 'var(--badt)'], ['Monitorar', n('at'), 'var(--warnt)'], ['Completar a base', n('sem'), ''], ['Manter', n('ok'), 'var(--okt)']].map(([l, x, c]) => `<div><span>${l}</span><b${c && x ? ` style="color:${c}"` : ''}>${x}</b></div>`).join('')}</div>
    <div class="tw"><table class="t mc-t"><thead><tr><th>Motor</th><th>Compressão (pior cilindro)</th><th>Consumo de óleo</th><th>Último laudo de óleo</th><th>Calibração</th><th>Recomendação</th></tr></thead><tbody>
    ${D.map(x => `<tr><td class="nowrap"><b>${esc(x.v.nome)}</b>${mcpPos(x.v).length > 1 ? ' · ' + x.pos : ''}</td>
      <td class="nowrap">${dot(x.cs)}${x.c.u ? `${fMPa(x.c.u.min)} MPa <span class="mut">cil. ${x.c.u.cil}</span>${x.c.vencida ? ' <span class="mut">· ensaio vencido</span>' : ''}` : '<span class="mut">sem ensaio</span>'}</td>
      <td class="nowrap">${dot(x.os)}${x.co.taxa != null ? x.co.taxa.toFixed(2).replace('.', ',') + ' L/100 h' : '<span class="mut">sem dados</span>'}</td>
      <td>${dot(x.lst)}${x.ul ? `${brD(x.ul.date)} · ${x.ls.alertas.length ? `<span style="color:${MC_DOT[x.lst]}">${esc(x.ls.alertas.slice(0, 2).map(a => a.nome + ' ' + String(a.v).replace('.', ',')).join(', '))}</span>` : 'normal'}` : '<span class="mut">sem laudo</span>'}</td>
      <td>${dot(x.cst)}${x.clv.length ? `<span style="color:var(--badt)">${esc(x.clv.map(c => c.nm).join(', '))} vencida${x.clv.length > 1 ? 's' : ''}</span>` : x.cst === 'sem' ? '<span class="mut">sem histórico</span>' : 'em dia'}</td>
      <td><span class="pill ${P[x.rc]}">${esc(x.rec)}</span></td></tr>`).join('')}</tbody></table></div>
    <p class="note">Os sinais juntos dão a recomendação: compressão (desgaste interno; limite 1,27 MPa, SM p. 2-3), consumo de óleo em L/100 h (anéis, guias, vazamento; acima de 2× a mediana da frota), laudo de laboratório (metais de desgaste e contaminação, limites em 3.2 Controles · Análise de óleo) e calibração (folga de válvulas e bicos, 1.000 h). Overhaul = compressão abaixo do limite, ou laudo crítico ou consumo alto junto com outro sinal.</p></div>`;
}
function mcTopo() {   // chamado pelo render logo depois de montar a tela
  sfFocoAplicar();
  if (typeof falTopo === 'function') falTopo();   // abas da 1.2 (js/89)
  if (!enxuto() || !MC_VIEWS.some(x => x[0] === VIEW)) return; const vh = $('#main .vh'); if (!vh) return;
  vh.insertAdjacentHTML('afterend', `<div class="mc-tabs"><span class="mc-tl">CONTROLE DOS MCP's</span>${MC_VIEWS.map(([k, n]) => `<a href="#${k}" class="${VIEW === k ? 'on' : ''}">${n}</a>`).join('')}</div>`);
}
function vEnxDiag() {
  return enxCab('3.3 Diagnósticos · condição dos MCP', 'Compressão, consumo de óleo, último laudo e calibração de cada MCP da frota juntos, com a recomendação · os dados vêm de 3.1 Lubrificação e 3.2 Controles', '<button class="mbtn" data-enxreset>Reorganizar</button>') + mcDiagCard() + '</div></div>';
}
Object.assign(VX, { enxdiag: vEnxDiag }); AFTER.enxdiag = pcmAfter('enxdiag'); Object.assign(NP_TAG, { enxdiag: '7 · Anexo I 1.1.12, 1.1.29' });

// ---------- 3.2 Controles · 4 Limpeza do arrefecimento (SMF 3.60; Supervisor, 29/10/2026: “limpeza do sistema de arrefecimento do reversor e do motor, tirando do Anexo I”) ----------
// itens de limpeza de trocador/resfriador do Anexo I: MCP 1.1.17 · reversor Hitachi 1.5.4 · Masson 1.6.4 · Reintjes 1.7.3 (mesma conta de vencimento do Backlog, enxDados)
const ARR_ITENS = ['1.1.17', '1.5.4', '1.6.4', '1.7.3', '1.4.1'];   // 3.62: + caixa de mar (1.4.1), que estava na calibração
// tabela de controle por item do Anexo I (abas 4 Sistema de arrefecimento e 5 Sensores): mesma conta de vencimento do Backlog (enxDados)
function ctlTab(ITENS, tit, sub, h2, nota) {
  const D = enxDados(), L = [], ord = { venc: 0, mes: 1, sem: 2 };
  D.forEach(x => x.P.filter(y => ITENS.includes(y.t.id)).forEach(y => L.push({ v: x.v, y })));
  // 3.64 (Supervisor: “não deixa nome repetitivo”): agrupado por empurrador (nome uma vez só, linha só entre empurradores), empurrador com o pior item primeiro; equipamento em nome curto
  const pior = {}; L.forEach(r => { pior[r.v.id] = Math.min(pior[r.v.id] ?? 3, ord[r.y.g] ?? 3); });
  L.sort((a, b) => pior[a.v.id] - pior[b.v.id] || a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }) || (ord[a.y.g] ?? 3) - (ord[b.y.g] ?? 3) || a.y.t.id.localeCompare(b.y.t.id, 'pt-BR', { numeric: true }) || a.y.pos.localeCompare(b.y.pos));
  const eqC = (v, y) => { const n0 = enxEq(y.t), n1 = /^MCP/.test(n0) ? 'MCP' : /^Reversor/.test(n0) ? n0.split(' ').slice(0, 2).join(' ').replace('REINTJES', 'Reintjes') : n0; return n1 + (mcpPos(v).length > 1 && isMcp(y.pos) ? ' ' + y.pos : ''); };
  const nV = {}; L.forEach(r => { nV[r.v.id] = (nV[r.v.id] || 0) + 1; });
  const n = g => L.filter(r => r.y.g === g).length, ok = L.filter(r => !['venc', 'mes', 'sem'].includes(r.y.g)).length;
  const prox = s => s.alvoH != null ? nf(s.alvoH) + ' h' + (s.alvoD ? '<div class="note">' + brD(isoD(s.alvoD)) + '</div>' : '') : s.alvoD ? brD(isoD(s.alvoD)) : '—';
  return enxCab(tit, sub, '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Resumo</h2><div class="sf-k">${[['Vencidos', n('venc'), 'var(--badt)'], ['Vencem no mês', n('mes'), 'var(--warnt)'], ['Sem histórico', n('sem'), ''], ['Em dia', ok, 'var(--okt)']].map(([l, x, c]) => `<div><span>${l}</span><b${c && x ? ` style="color:${c}"` : ''}>${x}</b></div>`).join('')}</div>
     <p class="note">${nota}</p></div>
   <div class="card"><h2>${h2}</h2><div class="tw"><table class="t ctl-t"><thead><tr><th>Empurrador</th><th>Equipamento</th><th>Serviço</th><th>Frequência</th><th>Última execução</th><th>Próxima</th><th>Situação</th><th></th></tr></thead><tbody>
     ${L.map(({ v, y }, i) => { const U = y.s.L, pri = !i || L[i - 1].v !== v; return `<tr class="${pri ? 'ctl-g' : ''}">${pri ? `<td class="nowrap ctl-v" rowspan="${nV[v.id]}"><b>${esc(v.nome)}</b></td>` : ''}<td class="nowrap">${esc(eqC(v, y))}</td><td>${esc(y.t.chk || y.t.item)}<div class="note">Anexo I ${esc(y.t.id)}</div></td><td class="nowrap">${enxIv(y.t, v, y.pos)}</td>
       <td class="nowrap">${U ? brD(U.date) + (U.h != null ? '<div class="note">' + nf(U.h) + ' h</div>' : '') + (U.insp ? '<div class="note" style="color:#1A73E8">inspecionado</div>' : '') : '—'}</td><td class="nowrap">${prox(y.s)}</td>
       <td><span class="pill ${ENX_GR[y.g][0]}">${ENX_GR[y.g][1]}</span><div class="note">${esc(y.s.txt || '')}</div></td><td><button class="mbtn sm" data-pcmv="${v.id}">Abrir na 2.2</button></td></tr>`; }).join('') || '<tr><td colspan="8" class="note">Nenhum item no plano.</td></tr>'}</tbody></table></div></div></div></div>`;
}
const vEnxArr = () => ctlTab(ARR_ITENS, '3.2 Controles · sistema de arrefecimento', 'Trocadores de calor e resfriadores de óleo do motor principal e do reversor e caixa de mar (Anexo I) · para registrar, abra o empurrador na 2.2 e use “Apontar execução”', 'Trocadores de calor, resfriadores e caixa de mar',
  'Itens do Anexo I: MCP 1.1.17 limpeza do trocador de calor (2.000 h ou 24 meses) · reversor Hitachi 1.5.4 limpeza interna do trocador (5.000 h ou 2 anos) · Masson 1.6.4 inspeção e limpeza do resfriador de óleo · Reintjes 1.7.3 verificação do feixe tubular do trocador e dos ânodos (trimestral) · caixa de mar 1.4.1 inspeção, limpeza e testes (trimestral). Cada empurrador só mostra o que se aplica ao seu reversor.');
// 3.63 (Supervisor, 29/10/2026: “cria mais uma aba de Sensores”): sensores, proteções e alarmes do Anexo I
const SEN_ITENS = ['1.1.21', '2.1.2', '5.1.1'];
const vEnxSen = () => ctlTab(SEN_ITENS, '3.2 Controles · sensores', 'Sensores, proteções e alarmes (Anexo I) · para registrar, abra o empurrador na 2.2 e use “Apontar execução”', 'Sensores, proteções e alarmes',
  'Itens do Anexo I: MCP 1.1.21 teste dos dispositivos de proteção e alarme (2.000 h) · governo 2.1.2 manutenção do sensor de ângulo e teste do limitador de curso (semestral) · porão 5.1.1 limpeza e teste funcional do sensor de alagamento (trimestral).');
Object.assign(VX, { enxarr: vEnxArr, enxsen: vEnxSen }); AFTER.enxarr = pcmAfter('enxarr'); AFTER.enxsen = pcmAfter('enxsen'); Object.assign(NP_TAG, { enxarr: '7.3 · Anexo I', enxsen: '7.3 · Anexo I' });
