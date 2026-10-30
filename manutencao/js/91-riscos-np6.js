'use strict';
/* ===== 2.3 Equipamentos críticos e riscos · NP 055 item 6 (SMF 3.93, 30/10/2026) =====
   Pedido do Supervisor (auditoria): controle do item 6 da NP 055 numa tela só.
   · 6.2 Matriz de risco 5 × 5 (escolha do Supervisor: “faça da sua escolha”) · severidade = maior nota entre os três impactos da 6.2
     (Segurança e saúde, Meio ambiente, Operação e qualidade), em RSK_SEV · probabilidade = histórico do SMF (decisão do Supervisor):
     corretivas do sistema nos últimos 12 meses por empurrador (RSK_PROB) · risco = S × P (RSK_NIV) · aprovação = snap tipo 'risco'
   · 6.3 Controles por empurrador: itens do Anexo I críticos da NP 6.3 (enxCrit) de cada sistema, pela conta da Situação da frota (sfCel),
     e falha aberta (corretiva não encerrada) no sistema
   · 6.1 Desgaste: onde há medição (MCP: compressão, laudo de óleo, calibração e consumo, pelo 3.3 Diagnóstico); nos demais o controle
     é a inspeção da 6.3 (NP 5.3 e 5.4) */
// severidade por impacto (1 a 5): [Segurança e saúde, Meio ambiente, Operação e qualidade] · critério interno a revisar com o Supervisor
const RSK_SEV = [[4, 3, 5], [5, 3, 5], [3, 2, 4], [5, 4, 4], [5, 4, 5], [4, 5, 4], [4, 2, 4], [5, 3, 4]];
const RSK_SEVL = ['Insignificante', 'Menor', 'Moderada', 'Grave', 'Catastrófica'], RSK_PROBL = ['Rara', 'Improvável', 'Possível', 'Provável', 'Quase certa'];
// probabilidade pela taxa de falhas (corretivas do sistema em 12 meses ÷ nº de empurradores)
const RSK_PROB = t => t <= 0 ? 1 : t <= 0.2 ? 2 : t <= 0.5 ? 3 : t <= 1 ? 4 : 5;
const RSK_NIV = r => r >= 20 ? ['Crítico', '#C5221F', '#fff'] : r >= 10 ? ['Alto', '#F29900', '#fff'] : r >= 5 ? ['Moderado', '#FDD663', '#5F4300'] : ['Baixo', '#81C995', '#0D3B1E'];
const rskAprov = () => recs('snap').filter(r => r.tipo === 'risco' && !r.excluido).sort((a, b) => a.date < b.date ? -1 : 1).pop();
function rskDados() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), f = hoje(), ini = new Date(f); ini.setFullYear(ini.getFullYear() - 1);
  const C = oms().filter(o => o.tipo === 'C' && !o.excluido && vessel(o.vessel) && o.abertura && new Date(o.abertura) >= ini);
  return NP63.map((n, i) => { const sv = RSK_SEV[i], S0 = Math.max(...sv), F = C.filter(o => parseInt(o.sistema) === i + 1), tx = V.length ? F.length / V.length : 0, P = RSK_PROB(tx), R = S0 * P;
    return { i, n: n[0].replace(/^\d+\.\s*/, ''), ativo: n[1], imp: n[2], ctrl: n[3], gat: n[4], sv, S: S0, F, tx, P, R, niv: RSK_NIV(R) }; });
}
function rskMatriz(D) {
  let h = '<div><table class="rk5"><tbody>';
  for (let s = 5; s >= 1; s--) {
    h += `<tr><th class="rk5-y">${s} · ${RSK_SEVL[s - 1]}</th>`;
    for (let p = 1; p <= 5; p++) { const n = RSK_NIV(s * p), L = D.filter(x => x.S === s && x.P === p);
      h += `<td style="background:${n[1]};color:${n[2]}" title="${n[0]} · risco ${s * p}">${L.map(x => `<span class="rk5-c" title="${esc(x.n)}">${x.i + 1}</span>`).join('') || `<small>${s * p}</small>`}</td>`; }
    h += '</tr>'; }
  return h + `<tr><th></th>${[1, 2, 3, 4, 5].map(p => `<th class="rk5-x">${p} · ${RSK_PROBL[p - 1]}</th>`).join('')}</tr></tbody></table>
    <div class="rk5-ax"><span>↑ Severidade (maior impacto da NP 6.2)</span><span>Probabilidade (falhas por empurrador em 12 meses) →</span></div></div>`;
}
function vEnxRisco() {
  const D = rskDados(), A = rskAprov(), SF = sfDados(), V = SF.map(x => x.v), nC = D.filter(x => x.niv[0] === 'Crítico').length, nA = D.filter(x => x.niv[0] === 'Alto').length;
  const ab = oms().filter(o => o.tipo === 'C' && !o.excluido && o.status !== 'encerrada' && vessel(o.vessel));
  const cel = (x, i) => { const fa = ab.filter(o => o.vessel === x.v.id && parseInt(o.sistema) === i + 1);
    if (fa.length) return `<a class="sf-c sf-r" href="#enxcor" title="Falha aberta: ${esc(fa.map(o => (o.num || '') + ' ' + (o.equip || o.descricao || '')).join(' · '))}">F</a>`;
    return sfCel((x.sis[i] || []).filter(y => enxCrit(y.t)), ` data-pcmv="${x.v.id}" data-pcms="${i + 1}"`, x.vel); };
  const venc = SF.reduce((a, x) => a + x.sis.slice(0, 8).reduce((b, L) => b + L.filter(y => enxCrit(y.t) && y.g === 'venc').length, 0), 0);
  const MD = typeof mcDiag === 'function' ? mcDiag() : [], md = k => MD.filter(x => x.rc === k).length;
  const aprov = A ? `Matriz aprovada em ${brD(A.date)} por ${esc(A.por || '')}${A.date.slice(0, 4) < isoD(hoje()).slice(0, 4) ? ' · <b style="color:var(--badt)">revisão anual pendente</b>' : ''}` : '<b style="color:var(--badt)">Matriz ainda não aprovada</b>';
  return enxCab('2.3 Equipamentos críticos e riscos · NP 055 item 6', 'Matriz de risco dos 8 sistemas críticos (6.2), controles da 6.3 em cada empurrador e monitoramento de desgaste (6.1)', '<button class="mbtn" data-rskpdf>🖨 Imprimir</button><button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Resumo</h2><div class="kn-int kn-4"><div><i>Sistemas críticos (NP 6.3)</i><b>8</b></div><div><i>Risco crítico ou alto</i><b style="color:${nC + nA ? 'var(--badt)' : ''}">${nC + nA}</b><small>${nC} crítico · ${nA} alto</small></div>
     <div><i>Serviços críticos vencidos</i><b style="color:${venc ? 'var(--badt)' : 'var(--okt)'}">${venc}</b><small>na frota (bloqueiam a saída sem OM)</small></div><div><i>Falhas abertas em sistema crítico</i><b style="color:${ab.filter(o => parseInt(o.sistema) <= 8).length ? 'var(--badt)' : ''}">${ab.filter(o => parseInt(o.sistema) <= 8).length}</b><small>corretivas não encerradas</small></div></div>
     <p class="note">${aprov}${can.admin() ? ' · <button class="mbtn sm" data-rskap>Aprovar a matriz atual</button>' : ''}</p></div>`
   + `<div class="card"><h2>Matriz de risco · NP 6.2</h2><div class="rk5-w">${rskMatriz(D)}<div class="rk5-lg">${[['Crítico', 20], ['Alto', 10], ['Moderado', 5], ['Baixo', 1]].map(([n, r]) => { const c = RSK_NIV(r); return `<span><i style="background:${c[1]}"></i>${n} ${r === 20 ? '(20–25)' : r === 10 ? '(10–16)' : r === 5 ? '(5–9)' : '(1–4)'}</span>`; }).join('')}</div></div>
     <div class="tw"><table class="t ctl-t"><thead><tr><th>Nº</th><th>Sistema crítico · ativo</th><th class="c">Segurança e saúde</th><th class="c">Meio ambiente</th><th class="c">Operação</th><th class="c">Severidade</th><th class="c">Falhas 12 meses</th><th class="c">Probabilidade</th><th class="c">Risco</th></tr></thead><tbody>
     ${D.map(x => `<tr><td><b>${x.i + 1}</b></td><td><b>${esc(x.n)}</b><div class="note">${esc(x.ativo)}</div></td>${x.sv.map(v => `<td class="c">${v}</td>`).join('')}<td class="c"><b>${x.S}</b></td><td class="c">${x.F.length}<div class="note">${nf(x.tx, 2)} por empurrador</div></td><td class="c"><b>${x.P}</b></td>
       <td class="c"><span class="pill" style="background:${x.niv[1]};color:${x.niv[2]}">${x.niv[0]} · ${x.R}</span></td></tr>`).join('')}</tbody></table></div>
     <p class="note">Severidade = maior nota entre os três impactos da NP 6.2 (1 insignificante a 5 catastrófica; critério interno, revisar com o Supervisor). Probabilidade = corretivas registradas no sistema nos últimos 12 meses ÷ nº de empurradores: 0 = 1 · até 0,2 = 2 · até 0,5 = 3 · até 1 = 4 · acima de 1 = 5. Risco = severidade × probabilidade.</p></div>`
   + `<div class="card"><h2>Controles da NP 6.3 por empurrador</h2><div class="tw"><table class="t sf-mx rk-ct"><thead><tr><th>Sistema crítico</th>${V.map(v => `<th class="c">${esc(v.nome)}</th>`).join('')}</tr></thead><tbody>
     ${D.map(d => `<tr><td><b>${d.i + 1}. ${esc(d.n)}</b><div class="note">${esc(d.gat)}</div></td>${SF.map(x => `<td class="sf-cc">${cel(x, d.i)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
     <p class="note">Cada célula conta só os serviços do Anexo I dos equipamentos críticos da NP 6.3 daquele sistema: número vermelho = vencidos · âmbar = vencem no mês · ✓ = em dia · F = falha aberta no sistema · ? = horímetro sem leitura. Clique para abrir o empurrador na 2.2 com o sistema aberto. As inspeções diárias e de saída (NP 5.3 e 5.4) ficam no FR 027_L e no Diário de Máquinas.</p></div>`
   + `<div class="card"><h2>Desgaste dos equipamentos críticos · NP 6.1</h2><div class="tw"><table class="t ctl-t"><thead><tr><th>Sistema crítico</th><th>Como o desgaste é monitorado</th><th>Situação</th></tr></thead><tbody>
     <tr><td><b>1. Propulsão · motores principais</b></td><td>Ensaio de compressão, análise de óleo, consumo de óleo e calibração de bicos e válvulas (3.2 Controles e 3.3 Diagnóstico)</td><td><a href="#enxdiag">${md('bad')} programar overhaul · ${md('at')} monitorar · ${md('sem')} completar a base · ${md('ok')} manter</a></td></tr>
     ${D.slice(1).map(d => `<tr><td><b>${d.i + 1}. ${esc(d.n)}</b></td><td>Inspeção e teste da NP 6.3: ${esc(d.ctrl)}</td><td class="note">Sem medição de desgaste no SMF · controle pela inspeção (NP 5.3 e 5.4) e pelos serviços do Anexo I</td></tr>`).join('')}</tbody></table></div>
     <p class="note">NP 6.1: o monitoramento contínuo define quando recondicionar ou substituir. Hoje só os motores principais têm medição de desgaste com tendência; para os outros sistemas o controle é a inspeção e o plano preventivo.</p></div></div></div>`;
}
async function rskAprovar() {
  if (!can.admin()) return; const D = rskDados();
  await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'risco', date: isoD(hoje()), por: S.session.name, M: D.map(x => [x.i + 1, x.sv, x.S, x.F.length, x.P, x.R]) });
  toast('Matriz de risco aprovada.'); render();
}
function rskPDF() {
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  const D = rskDados(), A = rskAprov();
  const corpo = `<h3>Matriz de risco (NP 055 item 6.2)</h3>${rskMatriz(D)}<table class="t2"><thead><tr><th>Nº</th><th>Sistema crítico</th><th>Ativo</th><th>S&amp;S</th><th>MA</th><th>Op.</th><th>Sev.</th><th>Falhas 12 m</th><th>Prob.</th><th>Risco</th></tr></thead><tbody>${D.map(x => `<tr><td>${x.i + 1}</td><td>${esc(x.n)}</td><td>${esc(x.ativo)}</td>${x.sv.map(v => `<td>${v}</td>`).join('')}<td>${x.S}</td><td>${x.F.length}</td><td>${x.P}</td><td>${x.niv[0]} (${x.R})</td></tr>`).join('')}</tbody></table>
    <p style="font-size:10px">Severidade = maior nota entre Segurança e saúde, Meio ambiente e Operação (NP 6.2). Probabilidade = corretivas do sistema nos últimos 12 meses por empurrador. Risco = severidade × probabilidade: 1–4 baixo · 5–9 moderado · 10–16 alto · 20–25 crítico.</p>
    <p style="font-size:11px">${A ? `Aprovada em ${brD(A.date)} por ${esc(A.por || '')}` : 'Matriz ainda não aprovada'} · gerada em ${brD(isoD(hoje()))}</p>
    <table class="t2" style="margin-top:14px"><tr><td style="height:46px;width:50%">Elaborado (Supervisor de Manutenção)</td><td>Aprovado (Gerência)</td></tr></table>`;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Matriz de risco NP 055 item 6</title><style>@page{size:A4 landscape;margin:10mm}${DOC_CAB_CSS}body{font-family:Arial,sans-serif;color:#202124}
    .rk5{border-collapse:collapse;margin:6px 0}.rk5 td{width:70px;height:34px;text-align:center;border:1px solid #fff;font-size:11px}.rk5 th{font-size:9.5px;font-weight:600;padding:2px 6px;text-align:right}.rk5-x{text-align:center!important}.rk5-c{display:inline-block;min-width:16px;margin:1px;border-radius:8px;background:#fff;color:#202124;font-weight:700;font-size:10.5px}.rk5-ax{display:none}
    .t2{border-collapse:collapse;width:100%;font-size:10.5px;margin-top:8px}.t2 th{background:#16244A;color:#fff;padding:4px;text-align:left}.t2 td{border-bottom:1px solid #DADCE0;padding:3px 4px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
    ${docCab('Matriz de risco dos equipamentos críticos', 'Frota de empurradores', 'NP Navecunha 055 · item 6')}${corpo}<script>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
}
Object.assign(VX, { enxrisco: vEnxRisco }); AFTER.enxrisco = pcmAfter('enxrisco');
Object.assign(NP_TAG, { enxrisco: '6' });
ENX_OK.push('enxrisco'); PCM_ETAPAS[1][2].push('enxrisco');
document.addEventListener('click', e => { if (VIEW !== 'enxrisco') return; const b = e.target.closest('[data-rskap],[data-rskpdf]'); if (!b) return;
  if (b.dataset.rskap !== undefined) return rskAprovar(); return rskPDF(); });
{ const st = document.createElement('style'); st.textContent = `
#main .rk5-w{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}#main .rk5{border-collapse:separate;border-spacing:3px}
#main .rk5 td{width:84px;height:42px;text-align:center;border-radius:5px;vertical-align:middle}#main .rk5 td small{opacity:.55;font-size:11px}
#main .rk5 th{font-size:11px;font-weight:500;color:var(--mut,#5F6368);text-align:right;padding:0 8px 0 0;white-space:nowrap}#main .rk5 th.rk5-x{text-align:center;padding:4px 0 0;white-space:normal;line-height:1.2}
#main .rk5-c{display:inline-block;min-width:20px;height:20px;line-height:20px;margin:1px;border-radius:10px;background:#fff;color:#202124;font-weight:600;font-size:12px;box-shadow:0 1px 2px rgba(0,0,0,.25)}
#main .rk5-ax{display:flex;justify-content:space-between;gap:16px;font-size:11px;color:var(--mut,#5F6368);padding-left:110px}
#main .rk5-lg{display:flex;flex-direction:column;gap:6px;font-size:12px;padding-top:6px}#main .rk5-lg i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-2px}
#main .rk-ct th.c{font-size:11px;white-space:nowrap}`;
  document.head.appendChild(st); }
