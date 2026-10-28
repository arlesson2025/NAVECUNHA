/* ===== PCM em 4 etapas (SMF 3.22, 28/10/2026; Supervisor: “sequência, etapas, nomes técnicos”, “não deixa ruim de operar, evita rodeios”) =====
   Só no modo enxuto (empurradores). Menu em PCM_MENU (js/85). Aqui:
   · Painel de pendências (enxhoje): o que cada etapa tem pendente agora, cada linha leva à tela que resolve
   · 3.3 Calibração do MCP (enxcal): folga de válvulas, bicos injetores e demais ajustes do Anexo I por motor (mesma conta da tela Calibração)
   · 4.1 Plano de ação (enxacao): ação · responsável · prazo · situação · conclusão com evidência (PDCA); registros snap tipo 'acao'
   · checklist de fechamento mensal (pcmChecklist): mostrado na 4.2 e conferido na emissão do relatório
   · faixa das etapas no topo (pcmFaixa, pelo opPassos do js/84) e títulos técnicos (PCM_TIT, pelo render) */
'use strict';
const PCM_ETAPAS = [['1', 'Recebimento', ['enxhor', 'enxcor']], ['2', 'Planejamento', ['enxcr', 'enx', 'cxr']], ['3', 'Condição', ['oleo', 'compr', 'enxcal', 'anoleo']], ['4', 'Fechamento', ['enxacao', 'enxrel']]];
const PCM_TIT = { oleo: '3.1 Lubrificação · troca de óleo (FR 049_B)', compr: '3.2 Compressão do MCP · manutenção preditiva', anoleo: '3.4 Análise de óleo do MCP · manutenção preditiva' };
function pcmFaixa() {
  if (!PCM_ETAPAS.some(e => e[2].includes(VIEW)) && VIEW !== 'enxhoje') return '';
  return `<nav class="op-ps" aria-label="Etapas do PCM"><a href="#enxhoje" class="${VIEW === 'enxhoje' ? 'on' : ''}">Painel</a>${PCM_ETAPAS.map(([n, t, L]) => `<i>→</i><a href="#${L[0]}" class="${L.includes(VIEW) ? 'on' : ''}"><b>${n}</b> ${t}</a>`).join('')}</nav>`;
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
function vEnxCal() {
  const D = calibDados().filter(x => isMcp(x.pos)), n = k => D.filter(x => x.s.st === k).length, ord = { venc: 0, viag: 1, sem: 2, ok: 3 };
  const C = CALIB.map(c => c[0]).filter(id => D.some(x => x.t.id === id)), M = {};
  D.forEach(x => { const k = x.v.id + '|' + x.pos; (M[k] = M[k] || { v: x.v, pos: x.pos, c: {} }).c[x.t.id] = x; });
  const pior = r => Math.min(...Object.values(r.c).map(x => ord[x.s.st] ?? 4));
  const R = Object.values(M).sort((a, b) => pior(a) - pior(b) || a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }) || a.pos.localeCompare(b.pos));
  const cel = x => { if (!x) return '<td class="cal-c cal-na">—</td>'; const U = x.s.L; return `<td class="cal-c cal-${x.s.st}" title="${esc(x.t.id + ' ' + x.nm)} · a cada ${esc(ivTxt(x.t))} · última: ${U ? brD(U.date) + (U.h != null ? ' · ' + nf(U.h) + ' h' : '') : 'sem registro'}">${x.s.st === 'sem' ? 'sem ref.' : calVal(x)}</td>`; };
  return enxCab('3.3 Calibração do MCP', 'Matriz motor × serviço de ajuste do Anexo I · cada célula mostra o restante (horas ou dias) até o vencimento · passe o mouse para ver a última execução', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Resumo</h2><div class="f2-ks">${[['Vencidas', n('venc'), 'var(--badt)'], ['Vencem na próxima viagem', n('viag'), 'var(--warnt)'], ['Sem referência', n('sem'), 'var(--warnt)'], ['Dentro do prazo', n('ok'), 'var(--okt)']].map(([l, x, c]) => `<div class="f2-k"><span>${l}</span><b${x ? ` style="color:${c}"` : ''}>${x}</b></div>`).join('')}</div>
     <p class="note"><b>Como lançar:</b> clique no empurrador → marque o serviço → “Apontar execução” com o horímetro de cada motor. Na calibração dos bicos (1.1.12) o ensaio de compressão vai no mesmo apontamento.</p></div>
   <div class="card"><h2>Situação por motor · ${R.length} motores principais</h2><div class="ecr-lg"><span><i class="ms"></i>vencida</span><span><i class="lt"></i>vence na próxima viagem</span><span><i class="ok"></i>dentro do prazo</span><span><i class="fut"></i>sem referência</span></div>
     <div class="tw"><table class="cal-m"><thead><tr><th class="cal-n">Empurrador · motor</th>${C.map(id => `<th>${esc(PCM_CAB[id] || id)}<small>${esc(id)}</small></th>`).join('')}</tr></thead><tbody>
     ${R.map(r => `<tr><td class="cal-n"><a href="#enx" data-pcmv="${r.v.id}" title="Abrir as OMs preventivas deste empurrador"><b>${esc(r.v.nome)}</b> · ${esc(posCurtoE(r.v, r.pos))}</a></td>${C.map(id => cel(r.c[id])).join('')}</tr>`).join('') || `<tr><td colspan="${C.length + 1}" class="note">Nenhum item de calibração.</td></tr>`}</tbody></table></div></div></div></div>`;
}
{ const st = document.createElement('style'); st.textContent = '.cal-m{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}.cal-m th{background:#1F2A44;color:#fff;font-weight:600;padding:6px 6px;font-size:11px;text-align:center;line-height:1.25}.cal-m th small{display:block;opacity:.7;font-weight:400}.cal-m th.cal-n,.cal-m td.cal-n{text-align:left;white-space:nowrap;padding:5px 10px}.cal-m td{border:1px solid #E3E8EF;padding:5px 6px;text-align:center}.cal-m td.cal-n a{color:inherit;text-decoration:none}.cal-m td.cal-n a:hover{color:#1967D2;text-decoration:underline}.cal-c.cal-venc{background:#FCE8E6;color:#C5221F;font-weight:700}.cal-c.cal-viag{background:#FEF3E0;color:#B06000;font-weight:600}.cal-c.cal-ok{background:#E6F4EA;color:#137333}.cal-c.cal-sem{background:#F5F8FE;color:#5F6368}.cal-c.cal-na{color:#BDC1C6}'; document.head.appendChild(st); }
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
// ---------- Painel de pendências ----------
function pcmPainel() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), G = [[], [], [], []], add = (e, t, n, d, h) => { if (n) G[e].push({ t, n, d, h }); };
  const hDias = v => { const h = horAtual(v.id, mpos(v.id)); return h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : null; };
  const hv = V.filter(v => { const d = hDias(v); return d == null || d > 14; }); add(0, 'Horímetro desatualizado (mais de 14 dias)', hv.length, hv.map(v => esc(v.nome) + (hDias(v) == null ? ' (sem leitura)' : ' (' + hDias(v) + ' d)')).join(', '), '#enxhor');
  const C = oms().filter(o => o.tipo === 'C' && !o.excluido && o.status !== 'encerrada'), cr = C.filter(o => !o.liberacao), cc = C.filter(o => o.liberacao);
  add(0, 'OM corretiva em aberto (embarcação indisponível)', cr.length, cr.map(o => esc(vName(o.vessel)) + ' · OM ' + esc(o.num) + ' · ' + esc(o.equip || o.sistema || '')).join('; '), '#enxcor');
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
  const G = pcmPainel(), tot = G.reduce((a, g) => a + g.length, 0), E = [['1 · Recebimento da embarcação', 'horímetros e corretivas'], ['2 · Planejamento (PCM)', 'backlog e plano anual'], ['3 · Monitoramento de condição', 'óleo, compressão e calibração'], ['4 · Fechamento mensal', 'relatório e plano de ação']];
  return enxCab('Painel de pendências', tot ? `${tot} tipo(s) de pendência · resolva na ordem das etapas; cada linha abre a tela certa` : 'Nenhuma pendência: frota dentro do prazo', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + G.map((L, i) => `<div class="card"><h2>${E[i][0]} <span class="note">· ${E[i][1]}</span>${L.length ? '' : ' <span class="pill p-ok">sem pendência</span>'}</h2>${L.length ? `<table class="t"><tbody>${L.map(x => `<tr><td style="width:44px" class="r"><b style="color:var(--badt);font-size:16px">${x.n}</b></td><td><b>${esc(x.t)}</b><div class="note">${x.d}</div></td><td style="width:1%"><a class="mbtn sm pri" href="${x.h}">Abrir</a></td></tr>`).join('')}</tbody></table>` : ''}</div>`).join('') + '</div></div>';
}
// contadores do menu (baratos: sem recalcular relatório)
function pcmContagem() {
  const C = {}; try { C.enx = enxDados().reduce((a, x) => a + x.venc.length, 0); } catch (e) { }
  C.enxcor = oms().filter(o => o.tipo === 'C' && !o.excluido && o.status !== 'encerrada').length;
  C.enxacao = pcmAcoes().filter(a => pcmSitu(a) === 'atrasada').length; return C;
}
// ---------- telas e cliques ----------
const pcmAfter = k => () => { const m = $('#main');
  m.onclick = async e => { const t = e.target.closest('[data-pcmv],[data-acnova],[data-acok],[data-acx],[data-acre]'); if (!t) return; const d = t.dataset;
    if (d.pcmv !== undefined) { e.preventDefault(); ENX.v = d.pcmv; ENX.abertos = new Set(); location.hash = '#enx'; return; }
    if (d.acnova !== undefined) return pcmAcaoNova();
    if (d.acok !== undefined) return pcmAcaoConcluir(d.acok);
    if (d.acx !== undefined) return pcmAcaoSt(d.acx, 'cancelada');
    if (d.acre !== undefined) return pcmAcaoSt(d.acre, 'aberta'); };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_' + k + '_lay', '[data-enxreset]'); };
Object.assign(VX, { enxhoje: vEnxHoje, enxcal: vEnxCal, enxacao: vEnxAcao }); ['enxhoje', 'enxcal', 'enxacao'].forEach(k => { AFTER[k] = pcmAfter(k); });
Object.assign(NP_TAG, { enxhoje: '7.3', enxcal: '7.3 · Anexo I', enxacao: '9 e 10' });
