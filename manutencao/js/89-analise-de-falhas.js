'use strict';
/* ===== 1.2 Manutenção corretiva · aba Análise de falhas (SMF 3.72, 29/10/2026) =====
   Pedido do Supervisor: “em manutenção corretiva acrescenta dentro uma aba Análise de falhas e coloca esses modelos”
   (os quadros da antiga tela Análise de falhas e ações de bloqueio). Abas no topo da 1.2: Corretivas (enxcor) · Análise de falhas (enxfal).
   Dados: corretivas (OM tipo C) abertas no período, pela falhasDados do núcleo (horas paradas _h, componente _comp, reincidência _reinc
   em até 180 dias) e mitigSit (situação da ação de bloqueio). Sem ISO 14224 (a empresa é certificada só nas ISO 9001, 14001 e 45001). */
const COR_VIEWS = [['enxcor', 'Corretivas'], ['enxfal', 'Análise de falhas']];
const FALF = { ac: 'pend' };   // ações de bloqueio: pendentes ou todas
const falSis = s => String(s || 'Sistema não informado').replace(/^\d+\.\d+\s*/, '');
const falSisC = s => { const i = parseInt(s); return i >= 1 && i <= SF_SIS.length ? SF_SIS[i - 1] : falSis(s); };
function falTopo() {   // chamado pelo render logo depois de montar a tela
  if (!enxuto() || !COR_VIEWS.some(x => x[0] === VIEW)) return; const vh = $('#main .vh'); if (!vh) return;
  vh.insertAdjacentHTML('afterend', `<div class="mc-tabs"><span class="mc-tl">MANUTENÇÃO CORRETIVA</span>${COR_VIEWS.map(([k, n]) => `<a href="#${k}" class="${VIEW === k ? 'on' : ''}">${n}</a>`).join('')}</div>`);
}
// barras horizontais em HTML: L = [[rótulo, sub, partes [[valor, cor]], texto à direita, extra]]
function falBarras(L, mx) {
  mx = Math.max(1, mx || Math.max(...L.map(x => x[2].reduce((s, p) => s + p[0], 0))));
  return `<div class="fa-b">${L.map(([r, sub, P, txt, ex]) => `<div class="fa-l"><div class="fa-r"><b>${esc(r)}</b>${sub ? `<small>${sub}</small>` : ''}</div>
    <div class="fa-t">${P.filter(p => p[0]).map(([v, c]) => `<i style="width:${v / mx * 100}%;background:${c}"></i>`).join('')}<span>${txt}</span></div>${ex != null ? `<div class="fa-x">${ex}</div>` : ''}</div>`).join('')}</div>`;
}
function vEnxFal() {
  const C = falhasDados(FALPER).filter(o => !o.excluido && vessel(o.vessel)), n = C.length;
  const CR = '#C5221F', AL = '#E8A100', MB = '#C9CED6', cor = c => c === 'Crítica' ? CR : c === 'Alta' ? AL : MB;
  const hInd = C.reduce((s, o) => s + (o._h || 0), 0), reinc = C.filter(o => o._reinc).length, ca = C.filter(o => o.classe === 'Crítica' || o.classe === 'Alta').length;
  const AC = C.filter(o => (o.mitig || '').trim() || o.classe === 'Crítica' || o.classe === 'Alta').map(o => ({ o, s: mitigSit(o) }));
  const acPend = AC.filter(x => ['falta', 'atraso', 'and'].includes(x.s.k)).length, acOk = AC.filter(x => x.s.k === 'ok').length;
  const per = `<div class="cm-chips">${[6, 12, 24].map(m => `<button class="cm-chip${FALPER === m ? ' on' : ''}" data-falper="${m}">${m} meses</button>`).join('')}</div>`;
  const faixa = `<div class="card"><h2>Resumo · últimos ${FALPER} meses</h2><div class="sf-k">
    <div><span>Corretivas no período</span><b>${n}</b></div><div><span>Falhas Crítica ou Alta</span><b style="color:var(--badt)">${ca}</b></div>
    <div><span>Horas de indisponibilidade</span><b>${nf(Math.round(hInd))}</b></div><div><span>Reincidências</span><b style="color:${reinc ? 'var(--badt)' : 'inherit'}">${reinc}</b></div>
    <div><span>Ações de bloqueio pendentes ou em atraso</span><b style="color:${acPend ? 'var(--warnt)' : 'inherit'}">${acPend}</b></div><div><span>Ações de bloqueio concluídas</span><b style="color:var(--okt)">${acOk}</b></div></div>
    <p class="note">Horas de indisponibilidade = da abertura da corretiva à liberação · reincidência = mesma falha no mesmo empurrador, sistema e componente em até ${REINC_DIAS} dias.</p></div>`;
  if (!n) return enxCab('1.2 Manutenção corretiva · análise de falhas', 'Pareto, componentes, ações de bloqueio, modo e causa das falhas das corretivas do período', per + '<button class="mbtn" data-enxreset>Reorganizar</button>') + faixa + '<div class="card"><h2>Análise de falhas</h2><p class="note">Nenhuma corretiva aberta no período.</p></div></div></div>';
  // A · Pareto por sistema, empilhado pela classe
  const S0 = {}; C.forEach(o => { const k = o.sistema || ''; const s = S0[k] = S0[k] || { n: 0, h: 0, cl: { Crítica: 0, Alta: 0, o: 0 } }; s.n++; s.h += o._h || 0; s.cl[o.classe === 'Crítica' || o.classe === 'Alta' ? o.classe : 'o']++; });
  let ac = 0; const SP = Object.entries(S0).sort((a, b) => b[1].n - a[1].n);
  const A = falBarras(SP.map(([k, s]) => { ac += s.n; const p = Math.round(ac / n * 100);
    return [falSis(k), nf(Math.round(s.h)) + ' h indisponível', [[s.cl.Crítica, CR], [s.cl.Alta, AL], [s.cl.o, MB]], String(s.n), `<span style="${p - Math.round(s.n / n * 100) < 80 ? 'font-weight:700' : 'color:var(--mut)'}">${p}%</span>`]; }));
  // B · componentes com maior frequência
  const P0 = {}; C.forEach(o => { const k = (o._comp || '—').trim(), c = P0[k.toLowerCase()] = P0[k.toLowerCase()] || { nome: k, sis: o.sistema, n: 0, h: 0, v: new Set(), re: false }; c.n++; c.h += o._h || 0; c.v.add(vName(o.vessel)); if (o._reinc) c.re = true; });
  const B = Object.values(P0).sort((a, b) => b.n - a.n || b.h - a.h).slice(0, 10);
  // C · ações de bloqueio
  const ord = { falta: 0, atraso: 1, and: 2, nd: 3, ok: 4 }, ACL = AC.filter(x => FALF.ac === 'todas' || ['falta', 'atraso', 'and'].includes(x.s.k)).sort((a, b) => ord[a.s.k] - ord[b.s.k] || (pDT(b.o.abertura) || 0) - (pDT(a.o.abertura) || 0));
  // D e E · modo e causa
  const conta = f => { const M = {}; C.forEach(o => { const k = f(o); if (k) M[k] = (M[k] || 0) + 1; }); return Object.entries(M).sort((a, b) => b[1] - a[1]); };
  const MO = conta(o => o.modo), CA = conta(o => o.causaCat), semMo = C.filter(o => !o.modo).length, semCa = C.filter(o => !o.causaCat).length;
  const barS = (L, c) => L.length ? falBarras(L.map(([k, v]) => [k, '', [[v, c]], String(v)])) : '<p class="note">Nenhuma corretiva com este campo preenchido no período.</p>';
  // F · sistema × modo de falha
  const SIS = SP.map(x => x[0]), MOD = MO.map(x => x[0]), mxH = Math.max(1, ...C.filter(o => o.modo).map(o => C.filter(p => p.sistema === o.sistema && p.modo === o.modo).length));
  const cel = (s, m) => { const q = C.filter(o => o.sistema === s && o.modo === m).length; return q ? `<td class="fa-h"><span style="background:rgba(26,115,232,${0.15 + 0.75 * q / mxH});color:${q / mxH > 0.5 ? '#fff' : '#0b2a55'}">${q}</span></td>` : '<td class="fa-h0">·</td>'; };
  return enxCab('1.2 Manutenção corretiva · análise de falhas', 'Pareto, componentes, ações de bloqueio, modo e causa das falhas das corretivas do período · reincidência = a mesma falha voltou em até ' + REINC_DIAS + ' dias', per + '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + faixa
   + `<div class="card"><h2>A · Pareto de falhas por sistema</h2><div class="fa-leg"><span><i style="background:${CR}"></i>Crítica</span><span><i style="background:${AL}"></i>Alta</span><span><i style="background:${MB}"></i>Média ou Baixa</span><span class="sp"></span><span class="note">% acumulado (em negrito, os que somam até 80%)</span></div>${A}<p class="note">Os sistemas em negrito somam 80% das falhas: é onde a ação de bloqueio dá mais retorno.</p></div>`
   + `<div class="card"><h2>B · Componentes com maior frequência de falha</h2><div class="tw"><table class="t"><thead><tr><th>Componente</th><th class="r">Ocorrências</th><th>Empurradores</th><th class="r">Horas indisponível</th></tr></thead><tbody>${B.map(c => `<tr><td><b>${esc(c.nome)}</b>${c.re ? ' <span class="pill p-bad">reincidente</span>' : ''}<div class="note">${esc(falSis(c.sis))}</div></td><td class="r">${c.n}</td><td>${esc([...c.v].join(', '))}</td><td class="r">${nf(Math.round(c.h))}</td></tr>`).join('')}</tbody></table></div><p class="note">Preencha o campo “Equipamento / componente” na corretiva para o agrupamento ficar exato; sem ele, vale o início da descrição.</p></div>`
   + `<div class="card"><h2>C · Ações de bloqueio (medidas de mitigação)</h2><div class="cm-chips"><button class="cm-chip${FALF.ac === 'pend' ? ' on' : ''}" data-falac="pend">Pendentes</button><button class="cm-chip${FALF.ac === 'todas' ? ' on' : ''}" data-falac="todas">Todas</button></div>
     ${ACL.length ? `<div class="tw"><table class="t"><thead><tr><th>OM</th><th>Empurrador</th><th>Classe</th><th>Falha</th><th>Causa raiz</th><th>Ação de bloqueio</th><th>Responsável</th><th>Prazo</th><th>Situação</th></tr></thead><tbody>${ACL.map(({ o, s }) => `<tr><td>${esc(o.num || '—')}</td><td><b>${esc(vName(o.vessel))}</b></td><td>${esc(o.classe || '—')}</td><td>${esc(o.descricao || '—')}${o._reinc ? ' <span class="pill p-bad">reincidente</span>' : ''}</td><td>${esc(o.causa || o.causaCat || '—')}</td><td>${esc(o.mitig || '—')}</td><td>${esc(o.mitigResp || '—')}</td><td>${o.mitigPrazo ? brD(o.mitigPrazo) : '—'}</td><td><span class="pill ${s.c}">${esc(s.t)}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhuma ação pendente no período.</p>'}
     <p class="note">A ação de bloqueio é obrigatória nas falhas Crítica e Alta · ações gerais da frota ficam em 4.1 Plano de ação.</p></div>`
   + `<div class="card"><h2>D · Modo de falha</h2>${barS(MO, '#1A73E8')}${semMo ? `<p class="note">${semMo} corretiva${semMo > 1 ? 's' : ''} sem modo de falha informado.</p>` : ''}</div>`
   + `<div class="card"><h2>E · Causa da falha</h2>${barS(CA, '#16244A')}${semCa ? `<p class="note">${semCa} corretiva${semCa > 1 ? 's' : ''} sem causa informada (a causa entra na liberação).</p>` : ''}</div>`
   + (MOD.length ? `<div class="card"><h2>F · Sistema × modo de falha</h2><div class="tw"><table class="t fa-m"><thead><tr><th>Sistema</th>${MOD.map(m => `<th>${esc(m)}</th>`).join('')}</tr></thead><tbody>${SIS.map(s => `<tr><td><b>${esc(falSisC(s))}</b></td>${MOD.map(m => cel(s, m)).join('')}</tr>`).join('')}</tbody></table></div><p class="note">Quanto mais escuro, mais falhas daquele modo naquele sistema.</p></div>` : '')
   + '</div></div>';
}
Object.assign(VX, { enxfal: vEnxFal }); AFTER.enxfal = pcmAfter('enxfal');
Object.assign(NP_TAG, { enxfal: '5.5 e 5.12' });
ENX_OK.push('enxfal'); PCM_ETAPAS[0][2].push('enxfal');
document.addEventListener('click', e => { if (VIEW !== 'enxfal') return; const p = e.target.closest('[data-falper],[data-falac]'); if (!p) return;
  if (p.dataset.falper) FALPER = +p.dataset.falper; if (p.dataset.falac) FALF.ac = p.dataset.falac; render(); });
{ const st = document.createElement('style'); st.textContent = `
.fa-b{display:flex;flex-direction:column;gap:7px;margin:6px 0}.fa-l{display:grid;grid-template-columns:minmax(150px,230px) 1fr 46px;gap:10px;align-items:center}
.fa-r b{display:block;font-size:12.5px;font-weight:600;line-height:1.2}.fa-r small{color:var(--mut,#5F6368);font-size:11px}
.fa-t{display:flex;align-items:center;height:14px}.fa-t i{display:block;height:14px}.fa-t i:first-child{border-radius:3px 0 0 3px}.fa-t i:last-of-type{border-radius:0 3px 3px 0}.fa-t span{margin-left:6px;font-size:12px;font-weight:600}
.fa-x{font-size:11.5px;text-align:right}.fa-leg{display:flex;gap:14px;align-items:center;font-size:12px;margin-bottom:4px}.fa-leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.fa-m th{font-size:10.5px;text-transform:none!important;white-space:normal;min-width:80px}.fa-m td.fa-h{text-align:center;font-weight:700;padding:3px}.fa-m td.fa-h span{display:block;border-radius:4px;padding:5px 0}.fa-m td.fa-h0{text-align:center;color:#C9CED6}`;
  document.head.appendChild(st); }
