'use strict';
/* ===== Balsas: Manutenção corretiva e Horímetros no padrão dos empurradores (SMF 3.139, Supervisor 01/11/2026) =====
   Manutenção corretiva (view balcor): falhas abertas com o formulário de campo do II-A e “Resolvida” (serviço, causa, teste, fotos de depois e o
   Relatório de Manutenção Corretiva · II-A), resolvidas em 12 meses com MTTR e a Análise de falhas (Pareto por equipamento, modo e causa).
   Horímetros (view balhor): uma tabela com todas as balsas, a última leitura do motor-bomba e um “Registrar leituras” só (como a 1.1). */
const balFals = () => recs('avaria').filter(r => r.bal && !r.excluido && balsaDe(r.vessel));
const balHrs = (a, b) => Math.max(0, (b - a) / 36e5);
const balDH = t => { const d = new Date(t); return brD(isoD(d)) + ' ' + d.toTimeString().slice(0, 5); };
const BALC = { p: 12 };
function vBalCor() {
  const F = balFals(), A = F.filter(r => !r.fim).sort((a, b) => ({ 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 })[a.c] - ({ 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 })[b.c] || balAt(a) - balAt(b));
  const ini = +addM(hoje(), -BALC.p), R = F.filter(r => r.fim && r.fim.at >= ini).sort((a, b) => b.fim.at - a.fim.at), P = F.filter(r => balAt(r) >= ini);
  const mttr = R.length ? R.reduce((s, r) => s + balHrs(balAt(r), r.fim.at), 0) / R.length : null, agora = Date.now();
  const cls = c => `<span class="pill ${c === 'Crítica' ? 'p-bad' : c === 'Alta' ? 'p-warn' : 'p-mut'}">${esc(c)}</span>`, nf2 = h => h < 48 ? nf(h, 1) + ' h' : nf(h / 24, 1) + ' d';
  const par = f => { const M = {}; P.forEach(r => { const k = f(r) || 'Não informado'; M[k] = (M[k] || 0) + 1; }); return Object.entries(M).sort((a, b) => b[1] - a[1]).slice(0, 10); };
  const pc = (t, E) => `<div><h3 class="vg-h3">${t}</h3>${E.length ? rmPareto(E) : '<p class="note">Nenhuma falha no período.</p>'}</div>`;
  const per = `<div class="seg">${[6, 12, 24].map(m => `<button data-balcp="${m}" class="${BALC.p === m ? 'on' : ''}">${m} meses</button>`).join('')}</div>`;
  return balCab('Manutenção corretiva', 'Falhas das balsas da abertura à liberação · NP 024 6.1: toda irregularidade vira OM no Sankhya; Crítica impede a balsa de operar até a liberação', per + '<button class="mbtn" data-bal27a="">📋 FR 027_A</button><button class="mbtn pri" data-balfalha="">⚠ Registrar falha</button>')
   + `<div class="cm-chips"><span class="cm-chip">Abertas <b>${A.length}</b></span><span class="cm-chip">Críticas abertas <b style="color:${A.some(r => r.c === 'Crítica') ? 'var(--badt)' : ''}">${A.filter(r => r.c === 'Crítica').length}</b></span><span class="cm-chip">Sem OM no Sankhya <b>${A.filter(r => !r.om).length}</b></span><span class="cm-chip">Resolvidas em ${BALC.p} meses <b>${R.length}</b></span><span class="cm-chip">MTTR <b>${mttr == null ? '—' : nf2(mttr)}</b></span></div>
   <div class="card"><h2>Falhas abertas · ${A.length}</h2>${A.length ? `<div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th>Registrada</th><th>Classe</th><th>Equipamento</th><th>O que aconteceu</th><th>OM</th><th class="r">Aberta há</th><th></th></tr></thead><tbody>
     ${A.map(r => `<tr><td><a href="#balft/${r.vessel}"><b>${esc(vName(r.vessel))}</b></a></td><td class="nowrap">${balDH(balAt(r))}</td><td>${cls(r.c)}</td><td>${esc(r.sis || '')}</td><td>${esc(r.desc)}${r.modo ? `<div class="note">${esc(r.modo)}</div>` : ''}</td><td>${r.om ? esc(r.om) : '<b class="rl-ruim">sem OM</b>'}</td><td class="r nowrap">${nf2(balHrs(balAt(r), agora))}</td>
       <td class="nowrap"><button class="mbtn sm" data-balcampo="${r.id}">🖨 Formulário de campo</button> <button class="mbtn sm pri" data-balfim="${r.id}">Resolvida</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhuma falha aberta.</p>'}</div>
   <div class="card"><h2>Resolvidas · ${BALC.p} meses · ${R.length}</h2>${R.length ? `<div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th>Falha</th><th>Classe</th><th>Equipamento</th><th>O que aconteceu</th><th>Serviço executado</th><th>OM</th><th class="r">Tempo de reparo</th><th></th></tr></thead><tbody>
     ${R.map(r => `<tr><td><b>${esc(vName(r.vessel))}</b></td><td class="nowrap">${balDH(balAt(r))}</td><td>${cls(r.c)}</td><td>${esc(r.sis || '')}</td><td>${esc(r.desc)}</td><td>${esc(r.servicos || '—')}${r.causaCat ? `<div class="note">Causa: ${esc(r.causaCat)}</div>` : ''}</td><td>${esc(r.om || '')}</td><td class="r nowrap">${nf2(balHrs(balAt(r), r.fim.at))}</td><td><button class="mbtn sm" data-baliia="${r.id}">🖨 II-A</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhuma falha resolvida no período.</p>'}</div>
   <div class="card"><h2>Análise de falhas · ${BALC.p} meses · ${P.length} falha${P.length === 1 ? '' : 's'}</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px">${pc('Por equipamento', par(r => r.sis))}${pc('Modo de falha', par(r => r.modo))}${pc('Causa da falha', par(r => r.causaCat))}</div><p class="note">Pareto das falhas registradas no período. “Não informado” = falha registrada antes do modo e da causa serem obrigatórios.</p></div>`;
}
// Relatório de Manutenção Corretiva (II-A) da balsa, anexo da OM do Sankhya: mesmo desenho do dos empurradores, sem número de item
function balIIAcorpo(r, campo) {
  const b = balsaDe(r.vessel), ln = '<div class="ln"></div>', v = (x, y) => campo && !x ? ln : esc(x || y || '—');
  const ft = t => (r.fotos || []).filter(f => f.tipo === t && f.src), F = [ft('ANTES'), ft('DEPOIS')], n = Math.max(F[0].length, F[1].length);
  const fotos = !campo && n ? `<h3>Fotos</h3><table class="d"><thead><tr><th>Antes</th><th>Depois</th></tr></thead><tbody>${[...Array(n).keys()].map(i => `<tr>${F.map(L => `<td style="width:50%;text-align:center">${L[i] ? `<img src="${L[i].src}" style="max-width:100%;max-height:230px">` : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>` : (!campo && (r.fotos || []).some(f => f.fid && !f.src) ? '<p class="note">Fotos no Google Drive (pasta da balsa).</p>' : '');
  return `<div class="id"><div><span>Balsa</span><b>${esc(b.nome)}</b></div><div><span>Nº da OM (Sankhya)</span><b>${esc(r.om || '')}</b>${campo && !r.om ? ln : ''}</div><div><span>Criticidade</span>${esc(r.c)}</div>
     <div><span>Equipamento</span>${esc(r.sis || '—')}</div><div><span>Falha registrada</span>${balDH(balAt(r))}</div><div><span>Horímetro do motor-bomba</span>${(h => h ? nf(h.h) + ' h' : '—')(balHor(r.vessel))}</div></div>
   <h3>Falha</h3><table class="d"><tbody><tr><td style="width:24%">Sintoma</td><td>${esc(r.desc)}</td></tr><tr><td>Modo de falha</td><td>${v(r.modo)}</td></tr><tr><td>Causa</td><td>${v([r.causaCat, r.causa].filter(Boolean).join(' · '))}</td></tr></tbody></table>
   <h3>Serviço executado</h3><table class="d"><tbody><tr><td style="width:24%">Serviço</td><td>${campo ? ln + ln : esc(r.servicos || '—')}</td></tr><tr><td>Peças e materiais</td><td>${v(r.materiais)}</td></tr><tr><td>Teste funcional</td><td>${v(r.teste)}</td></tr><tr><td>Executado por</td><td>${campo ? '☐ Equipe própria ☐ Terceiro: ' + ln : esc([r.exec, r.execn].filter(Boolean).join(' · ') || '—')}</td></tr></tbody></table>
   <h3>Tempo de reparo</h3><table class="d"><tbody><tr><td style="width:24%">Parada (falha)</td><td>${balDH(balAt(r))}</td></tr><tr><td>Liberação</td><td>${r.fim ? balDH(r.fim.at) : ln}</td></tr>${r.fim ? `<tr><td>Tempo</td><td>${nf(balHrs(balAt(r), r.fim.at), 1)} h</td></tr>` : ''}</tbody></table>
   ${fotos}<div class="ass"><div>Executante</div><div>Recebido a bordo · Comandante ou Coord. de Operações</div><div>Supervisor de Manutenção</div>${r.c === 'Crítica' ? '<div>Coordenador de Operações</div>' : ''}</div>`;
}
function balIIA(id, w0) { const r = S.recs.get(id); if (!r) { if (w0) w0.close(); return; }
  balDocJanela('ANEXO II-A · RELATÓRIO DE MANUTENÇÃO CORRETIVA', `Balsa ${esc(vName(r.vessel))} · OM ${esc(r.om || '—')}`, balIIAcorpo(r, false), 'NP Navecunha 024 · itens 6.1 e 6.4', w0); }
function balIIACampo(id) { const r = S.recs.get(id); if (!r) return;
  balDocJanela('ANEXO II-A · FORMULÁRIO DE CAMPO · CORRETIVA', `Balsa ${esc(vName(r.vessel))}${r.om ? ' · OM ' + esc(r.om) : ''}`, balIIAcorpo(r, true), 'NP Navecunha 024 · itens 6.1 e 6.4'); }
// ---------- horímetros do motor-bomba, todas as balsas numa tabela (como a 1.1) ----------
function vBalHor() {
  const H = isoD(hoje()), L = BALSAS.map(b => { const hr = balHor(b.id), d = hr ? Math.round((pD(H) - pD(hr.date)) / 864e5) : null; return { b, hr, d, tx: balTaxa(b.id), ref: (() => { try { return balEstado(b).st === 'ref'; } catch (e) { return false; } })() }; })
    .sort((a, b) => (b.d == null ? 1e9 : b.d) - (a.d == null ? 1e9 : a.d));
  const pil = d => d == null ? '<span class="pill p-mut">sem leitura</span>' : `<span class="pill ${d > 30 ? 'p-bad' : d > 14 ? 'p-warn' : 'p-ok'}">${d} d</span>`;
  return balCab('Horímetros', 'Motor-bomba de cada balsa · lance todas as leituras de uma vez · a leitura não pode ser menor que a anterior nem passar de 24 h por dia', `<label class="f">Data das leituras<input type="date" id="bhlD" value="${H}"></label>`)
   + `<div class="cm-chips"><span class="cm-chip">Sem leitura há mais de 30 dias <b>${L.filter(x => x.d == null || x.d > 30).length}</b></span><span class="cm-chip">15 a 30 dias <b>${L.filter(x => x.d != null && x.d > 14 && x.d <= 30).length}</b></span><span class="cm-chip">Até 14 dias <b>${L.filter(x => x.d != null && x.d <= 14).length}</b></span></div>
   <div class="card"><h2>Leituras das balsas</h2><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th>Motor</th><th class="r">Última leitura</th><th>Data</th><th>Sem leitura há</th><th class="r">Ritmo</th><th>Nova leitura (h)</th><th></th></tr></thead><tbody>
   ${L.map(x => `<tr><td><a href="#balft/${x.b.id}"><b>${esc(x.b.nome)}</b></a>${x.ref ? ' <span class="pill p-mut">em reforma</span>' : ''}</td><td class="note">${esc(BAL_MOTOR[x.b.mot] || '')}</td><td class="r">${x.hr ? nf(x.hr.h) + ' h' : '—'}</td><td class="nowrap">${x.hr ? brD(x.hr.date) : '—'}</td><td>${pil(x.d)}</td><td class="r note">${x.tx ? nf(x.tx, 1) + ' h/dia' : '—'}</td>
     <td><input class="bhlH" data-bhl="${x.b.id}" inputmode="decimal" style="width:110px" placeholder="${x.hr ? nf(x.hr.h) : 'h'}"></td><td>${x.hr ? `<button class="mbtn sm" data-bhlno="${x.b.id}" title="Repete a última leitura: o motor-bomba não trabalhou">Sem operação</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
   <div class="row end" style="margin-top:8px"><span class="note" id="bhlE" style="color:var(--badt);margin-right:auto"></span><button class="mbtn pri" data-bhlsalvar>Registrar leituras</button></div></div>`;
}
async function balHorSalvar() {
  const d = $('#bhlD').value, E = $('#bhlE'); if (!d) return E.textContent = 'Informe a data das leituras.'; if (d > isoD(hoje())) return E.textContent = 'A data não pode ser futura.';
  const G = [], err = [];
  $$('#main .bhlH').forEach(i => { const v = i.value.trim(); if (!v) return; const h = +v.replace(/\./g, '').replace(',', '.'), b = balsaDe(i.dataset.bhl), hr = balHor(b.id);
    if (!isFinite(h) || h < 0) return err.push(b.nome + ': valor inválido');
    if (hr && h < hr.h && d >= hr.date) return err.push(`${b.nome}: menor que a anterior (${nf(hr.h)} h)`);
    if (hr && d > hr.date) { const max = hr.h + (Math.round((pD(d) - pD(hr.date)) / 864e5) + 1) * 24; if (h > max) return err.push(`${b.nome}: ${nf(h - hr.h)} h em ${Math.round((pD(d) - pD(hr.date)) / 864e5)} dias não cabe`); }
    G.push({ id: uid('hor'), kind: 'hor', vessel: b.id, pos: 'MB', h, date: d, by: S.session.name, bal: true }); });
  if (err.length) return E.textContent = err.join(' · '); if (!G.length) return E.textContent = 'Preencha pelo menos uma leitura.';
  for (const r of G) await saveRec(r); toast(G.length + ' leitura(s) registrada(s).'); render();
}
// ---------- tela, cliques e menu ----------
VX.balcor = balJan('balcor', vBalCor);
VX.balhor = balJan('balhor', vBalHor);
{ const k = BAL_VIEWS.findIndex(v => v[0] === 'balprog') + 1; BAL_VIEWS.splice(k, 0, ['balcor', 'Manutenção corretiva'], ['balhor', 'Horímetros']); }
Object.assign(NP_TAG, { balcor: 'NP 024 · 6.1 e 6.4', balhor: 'NP 024 · 5.4' });
['balcor', 'balhor'].forEach(k => { AFTER[k] = () => { balAfter(); const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_' + k + '_lay', '[data-balreset]'); }; });
document.addEventListener('click', e => {
  if (!['balcor', 'balhor'].includes(VIEW)) return; const t = e.target.closest('[data-balcp],[data-balcampo],[data-baliia],[data-bhlno],[data-bhlsalvar]'); if (!t) return; const d = t.dataset;
  e.stopPropagation(); e.preventDefault();
  if (d.balcp) { BALC.p = +d.balcp; return render(); }
  if (d.balcampo) return balIIACampo(d.balcampo);
  if (d.baliia) return balIIA(d.baliia);
  if (d.bhlno) { const hr = balHor(d.bhlno), i = document.querySelector(`#main .bhlH[data-bhl="${d.bhlno}"]`); if (hr && i) i.value = String(hr.h).replace('.', ','); return; }
  if (d.bhlsalvar !== undefined) { if (!balPode()) return; return balHorSalvar(); }
}, true);
