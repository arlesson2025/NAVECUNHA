/* ===== Parâmetros do MCP em viagem (Anexo I 1.1.30): o MFM informa por rádio ou WhatsApp e o Supervisor lança em terra =====
   Registro kind 'param' (servidor v14), um por MCP: regime (rotação nominal ou marcha lenta), horímetro, rpm, pressão e temperatura do óleo, temperatura da água, pressão do ar de carga.
   Lançar: botão "📋 Leituras" no empurrador em viagem (Hoje) e "+ Lançar leituras" na tela Condição → Parâmetros do MCP (view 'parmcp').
   Pressões gravadas em MPa, convertidas da unidade do manômetro (a unidade digitada e o valor lido ficam no registro).
   Limites do fabricante (texto do item 1.1.30): óleo na nominal 0,49–0,64 MPa (limite 0,29) e na lenta 0,20–0,29 MPa (limite 0,15), com óleo a 90–100 °C (SM 2-3);
   água 70–80 °C e ar de carga 0,13–0,17 MPa na nominal (O&M 3-7). Abaixo do limite = P1 no "O que precisa de você agora"; fora da faixa = P2.
   Queda de tendência: só no gráfico — o Supervisor ainda não definiu um critério interno de queda. */
'use strict';
const PMC_UN = { MPa: 1, bar: 0.1, 'kgf/cm²': 0.0980665, psi: 0.00689476 };
const PMC_LIM = { nominal: { po: [0.49, 0.64], poMin: 0.29, ag: [70, 80], ar: [0.13, 0.17] }, lenta: { po: [0.20, 0.29], poMin: 0.15 } };
const PMC_TO = [90, 100];
const PMC_REC_D = 30;   // o alerta vale para a leitura mais recente de cada MCP com até 30 dias
const PMC_REG = { nominal: 'rotação nominal', lenta: 'marcha lenta' };
const PMC_PAR = [['po', 'Pressão do óleo · nominal', 'MPa', 'nominal'], ['pol', 'Pressão do óleo · lenta', 'MPa', 'lenta'], ['to', 'Temperatura do óleo', '°C', ''], ['ag', 'Temperatura da água', '°C', 'nominal'], ['ar', 'Ar de carga', 'MPa', 'nominal']];
const PMC = { sel: '', p: 'po' };
const pmcNome = (v, pos) => v.nome + (v.mcp === 'mono' ? '' : ' ' + pos);
const pmcLeit = (vid, pos) => recs('param').filter(r => r.vessel === vid && (!pos || r.pos === pos)).sort((a, z) => (a.at || 0) - (z.at || 0));
const pmcMPa = v => v == null ? '—' : nf(v, 2);
// avaliação de uma leitura: st 'venc' (abaixo do limite) · 'viag' (fora da faixa normal) · 'ok'; aprox = óleo fora de 90–100 °C ou sem temperatura
function pmcAval(r) {
  const L = PMC_LIM[r.reg] || PMC_LIM.nominal, out = []; let st = 'ok';
  const sobe = s => { if (s === 'venc' || (s === 'viag' && st === 'ok')) st = s; };
  if (r.po != null) {
    if (r.po < L.poMin) { sobe('venc'); out.push(`pressão do óleo ${pmcMPa(r.po)} MPa abaixo do limite ${pmcMPa(L.poMin)} MPa (${PMC_REG[r.reg] || ''})`); }
    else if (r.po < L.po[0] || r.po > L.po[1]) { sobe('viag'); out.push(`pressão do óleo ${pmcMPa(r.po)} MPa fora de ${pmcMPa(L.po[0])}–${pmcMPa(L.po[1])} MPa (${PMC_REG[r.reg] || ''})`); } }
  if (L.ag && r.ag != null && (r.ag < L.ag[0] || r.ag > L.ag[1])) { sobe('viag'); out.push(`água ${nf(r.ag)} °C fora de 70–80 °C`); }
  if (L.ar && r.ar != null && (r.ar < L.ar[0] || r.ar > L.ar[1])) { sobe('viag'); out.push(`ar de carga ${pmcMPa(r.ar)} MPa fora de 0,13–0,17 MPa`); }
  return { st, txt: out, aprox: r.po != null && (r.to == null || r.to < PMC_TO[0] || r.to > PMC_TO[1]) };
}
const pmcStTxt = r => { const a = pmcAval(r); return a.st === 'venc' ? 'Abaixo do limite' : a.st === 'viag' ? 'Fora da faixa' : 'Normal'; };
const PMC_PILL = { venc: ['p-bad', 'Abaixo do limite'], viag: ['p-warn', 'Fora da faixa'], ok: ['p-ok', 'Normal'], sem: ['p-mut', 'Sem leitura'] };
// valor de um parâmetro do gráfico numa leitura (pressão separada por regime)
const pmcVal = (r, p) => p === 'po' ? (r.reg === 'nominal' ? r.po : null) : p === 'pol' ? (r.reg === 'lenta' ? r.po : null) : p === 'ag' ? (r.reg === 'nominal' ? r.ag : null) : p === 'ar' ? (r.reg === 'nominal' ? r.ar : null) : r[p];
function pmcValSt(r, p) { const v = pmcVal(r, p); if (v == null) return '';
  if (p === 'po' || p === 'pol') { const L = PMC_LIM[p === 'po' ? 'nominal' : 'lenta']; return v < L.poMin ? 'venc' : v < L.po[0] || v > L.po[1] ? 'viag' : 'ok'; }
  if (p === 'ag') return v < 70 || v > 80 ? 'viag' : 'ok'; if (p === 'ar') return v < 0.13 || v > 0.17 ? 'viag' : 'ok';
  if (p === 'to') return v < PMC_TO[0] || v > PMC_TO[1] ? 'viag' : 'ok'; return ''; }
// ---- lançamento (um registro por MCP) ----
function pmcEscolher() {
  const F = S.cfg.frota.filter(v => !foraOp(v)), em = F.filter(v => situDe(v) && v.situ.st === 'viagem');
  modal(`<h2>Lançar leituras do MCP</h2><p class="note">Escolha o empurrador. Os que estão em viagem aparecem primeiro.</p>
   <div class="g"><label class="f s6">Empurrador<select id="pmcV">${em.concat(F.filter(v => !em.includes(v))).map(v => `<option value="${v.id}">${esc(v.nome)}${em.includes(v) ? ' · em viagem' : ''}</option>`).join('')}</select></label></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="pmcVok">Continuar</button></div>`);
  $('#pmcVok').onclick = () => pmcModal($('#pmcV').value);
}
function pmcModal(vid) {
  if (!precisa(false)) return; if (typeof ehOperador === 'function' && ehOperador()) return toast('Quem lança as leituras do MCP é o Supervisor.');
  const v = vessel(vid); if (!v) return; const d = new Date(), hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  let un = 'bar'; try { un = localStorage.getItem('smf_pmc_un') || 'bar'; } catch (e) { }
  const P = mcpPos(v), bloco = pos => { const ult = pmcLeit(vid, pos).pop(), hr = horAtual(vid, pos);
    return `<fieldset class="pmc-m"><legend>${esc(v.mcp === 'mono' ? 'MCP' : 'MCP ' + posNome(v, pos))}${ult ? ` <span class="note">· última leitura ${brD(ult.date)}: óleo ${pmcMPa(ult.po)} MPa (${PMC_REG[ult.reg]})</span>` : ''}</legend><div class="g">
     <label class="f s2">Horímetro (h)<input data-pmh="${pos}" inputmode="decimal" placeholder="${hr ? 'último ' + nf(hr.h) : 'opcional'}"></label><label class="f s1">Rotação (rpm)<input data-pmr="${pos}" inputmode="numeric" placeholder="opcional"></label>
     <label class="f s2">Pressão do óleo <span class="pmc-un">${esc(un)}</span><input data-pmpo="${pos}" inputmode="decimal"></label><label class="f s1">Temp. do óleo (°C)<input data-pmto="${pos}" inputmode="decimal" placeholder="se houver"></label>
     <label class="f s1">Temp. da água (°C)<input data-pmag="${pos}" inputmode="decimal"></label><label class="f s2">Ar de carga <span class="pmc-un">${esc(un)}</span><input data-pmar="${pos}" inputmode="decimal" placeholder="se houver"></label></div></fieldset>`; };
  modal(`<h2>Leituras do MCP · ${esc(v.nome)}</h2><p class="note">O MFM leu no painel e informou por rádio ou WhatsApp. Lance o que ele passou: um bloco por MCP (deixe em branco o motor que ele não informou). Anexo I, item 1.1.30.</p>
   <div class="g"><label class="f s2">Data<input id="pmD" type="date" value="${isoD(hoje())}"></label><label class="f s1">Hora<input id="pmHr" type="time" value="${hh}"></label>
    <label class="f s2">Quem informou<input id="pmQ" placeholder="Nome e função (ex.: João, MFM)"></label><label class="f s1">Como<select id="pmM"><option>Rádio</option><option>Telefone / WhatsApp</option><option>Autotrac</option><option>Outro</option></select></label>
    <label class="f s3">Regime da leitura<select id="pmReg"><option value="nominal">Rotação nominal (navegando)</option><option value="lenta">Marcha lenta</option></select></label>
    <label class="f s3">Unidade dos manômetros<select id="pmUn">${Object.keys(PMC_UN).map(u => `<option${u === un ? ' selected' : ''}>${u}</option>`).join('')}</select></label></div>
   ${P.map(bloco).join('')}
   <div class="g"><label class="f s6">Observação<textarea id="pmObs" rows="2" placeholder="Algo fora do normal que o MFM comentou (ruído, fumaça, consumo de óleo…)"></textarea></label></div>
   <p class="note">A pressão do óleo só se compara com o manual com o óleo quente (90–100 °C, SM 2-3). Sem a temperatura do óleo, a leitura fica marcada como comparação aproximada.</p>
   <div class="note" id="pmE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="pmOk">Gravar leituras</button></div>`, true);
  $('#pmUn').onchange = () => document.querySelectorAll('#modal .pmc-un').forEach(s => s.textContent = $('#pmUn').value);
  $('#pmOk').onclick = async () => { const E = $('#pmE'), quem = $('#pmQ').value.trim(), u = $('#pmUn').value, k = PMC_UN[u], reg = $('#pmReg').value;
    if (!quem) { E.textContent = 'Preencha quem informou.'; return; }
    const val = s => numBR(($(s) || {}).value), L = [];
    for (const pos of P) { const po = val(`[data-pmpo="${pos}"]`), ar = val(`[data-pmar="${pos}"]`), to = val(`[data-pmto="${pos}"]`), ag = val(`[data-pmag="${pos}"]`), h = val(`[data-pmh="${pos}"]`), rpm = val(`[data-pmr="${pos}"]`);
      if ([po, ar, to, ag, h, rpm].every(x => x == null)) continue;
      const nm = v.mcp === 'mono' ? 'MCP' : 'MCP ' + pos;
      if (po == null) { E.textContent = nm + ': falta a pressão do óleo.'; return; }
      const poM = po * k, arM = ar == null ? null : ar * k;
      if (poM <= 0 || poM > 1.5) { E.textContent = `${nm}: ${nf(po, 2)} ${u} = ${nf(poM, 2)} MPa não é uma pressão de óleo possível. Confira a unidade dos manômetros.`; return; }
      if (arM != null && (arM < 0 || arM > 0.6)) { E.textContent = `${nm}: ar de carga ${nf(ar, 2)} ${u} = ${nf(arM, 2)} MPa fora do possível. Confira a unidade.`; return; }
      if ((to != null && (to < 0 || to > 150)) || (ag != null && (ag < 0 || ag > 120))) { E.textContent = nm + ': temperatura fora do possível. Confira os números.'; return; }
      L.push({ pos, po: +poM.toFixed(3), ar: arM == null ? null : +arM.toFixed(3), to, ag, h, rpm, poLido: po, arLido: ar }); }
    if (!L.length) { E.textContent = 'Lance pelo menos um MCP.'; return; }
    try { localStorage.setItem('smf_pmc_un', u); } catch (e) { }
    const [y, mo, dd] = $('#pmD').value.split('-').map(Number), [hh2, mi] = ($('#pmHr').value || hh).split(':').map(Number), at = new Date(y, mo - 1, dd, hh2, mi).getTime(), obs = $('#pmObs').value.trim();
    let pior = 'ok';
    for (const x of L) { const r = Object.assign({ id: uid('pm'), kind: 'param', vessel: vid, date: $('#pmD').value, hora: $('#pmHr').value, at, reg, un: u, quem, meio: $('#pmM').value, obs, by: S.session.name }, x);
      r.stTxt = pmcStTxt(r); const a = pmcAval(r).st; if (a === 'venc' || (a === 'viag' && pior === 'ok')) pior = a; await saveRec(r); }
    closeModal(); toast(L.length + ' leitura(s) gravada(s)' + (pior === 'venc' ? ' · ATENÇÃO: pressão abaixo do limite do fabricante — veja "O que precisa de você agora"' : pior === 'viag' ? ' · algum valor fora da faixa normal' : '') + '.', pior === 'ok' ? 3200 : 8000); render(); };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-pmcnovo]'); if (!b) return; e.preventDefault(); e.stopPropagation(); b.dataset.pmcnovo ? pmcModal(b.dataset.pmcnovo) : pmcEscolher(); }, true);
document.addEventListener('click', e => { const b = e.target.closest('[data-pmcsel]'); if (b) PMC.sel = b.dataset.pmcsel; }, true);
// ---- tela Condição → Parâmetros do MCP ----
function pmcDados() { const M = []; S.cfg.frota.filter(v => !foraOp(v)).forEach(v => mcpPos(v).forEach(pos => { const L = pmcLeit(v.id, pos), ul = L[L.length - 1];
  M.push({ v, pos, L, ul, a: ul ? pmcAval(ul) : null, st: ul ? pmcAval(ul).st : 'sem', dias: ul ? Math.floor((hoje() - pD(ul.date)) / 864e5) : null }); })); return M; }
const pmcKey = x => x.v.id + '|' + x.pos;
function pmcMatriz(M) {
  const ord = { venc: 0, viag: 1, ok: 2, sem: 3 }, L = M.slice().sort((a, b) => ord[a.st] - ord[b.st] || (a.dias ?? 1e9) - (b.dias ?? 1e9));
  const c = (r, p, txt) => { const s = r ? pmcValSt(r, p) : ''; return `<td class="mono r ao-c ${s}">${txt}</td>`; };
  return `<div class="card"><div class="row"><h2>Última leitura de cada MCP</h2><span class="sp"></span><span class="note">clique na linha para ver a tendência do motor</span></div>
   <div class="tw"><table class="t ao-t"><thead><tr><th>Motor</th><th class="r">Leitura</th><th>Regime</th><th class="r">Óleo (MPa)</th><th class="r">Óleo (°C)</th><th class="r">Água (°C)</th><th class="r">Ar (MPa)</th><th class="r">rpm</th><th>Situação</th></tr></thead><tbody>
   ${L.map(x => { const r = x.ul, p = r && r.reg === 'lenta' ? 'pol' : 'po';
     return `<tr class="click${pmcKey(x) === PMC.sel ? ' cm-on' : ''}" data-pmcsel2="${pmcKey(x)}"><td><b>${esc(pmcNome(x.v, x.pos))}</b></td><td class="mono r">${r ? brD(r.date) + `<div class="note" style="color:${x.dias > PMC_REC_D ? 'var(--warnt)' : ''}">há ${x.dias} dia${x.dias === 1 ? '' : 's'}</div>` : '—'}</td><td>${r ? PMC_REG[r.reg] : ''}</td>
       ${c(r, p, r ? pmcMPa(r.po) : '')}${c(r, 'to', r && r.to != null ? nf(r.to) : r ? '—' : '')}${c(r, 'ag', r && r.ag != null ? nf(r.ag) : r ? '—' : '')}${c(r, 'ar', r && r.ar != null ? pmcMPa(r.ar) : r ? '—' : '')}<td class="mono r">${r && r.rpm != null ? nf(r.rpm) : r ? '—' : ''}</td>
       <td><span class="pill ${PMC_PILL[x.st][0]}">${PMC_PILL[x.st][1]}</span>${x.a && x.a.aprox ? '<div class="note">comparação aproximada</div>' : ''}</td></tr>`; }).join('')}</tbody></table></div>
   <p class="note">Célula âmbar = fora da faixa normal · vermelha = abaixo do limite do fabricante · data em âmbar = leitura com mais de ${PMC_REC_D} dias (já não conta no alerta) · "comparação aproximada" = sem temperatura do óleo ou óleo fora de 90–100 °C.</p></div>`;
}
function pmcTend(M) {
  const frota = !PMC.sel || PMC.sel === 'frota', x = frota ? null : M.find(y => pmcKey(y) === PMC.sel) || null; if (!frota && !x) PMC.sel = 'frota';
  const [p, nome, un] = PMC_PAR.find(q => q[0] === PMC.p) || PMC_PAR[0];
  const S_ = (frota ? M : [x]).map(y => ({ y, pts: y.L.map(r => ({ d: pD(r.date), v: pmcVal(r, p), r })).filter(q => q.v != null) })).filter(s => s.pts.length), todos = S_.flatMap(s => s.pts);
  const lim = p === 'po' ? [[0.49, 0.64, 'faixa'], [0.29, 'limite']] : p === 'pol' ? [[0.20, 0.29, 'faixa'], [0.15, 'limite']] : p === 'ag' ? [[70, 80, 'faixa']] : p === 'ar' ? [[0.13, 0.17, 'faixa']] : [[90, 100, 'faixa']];
  const W = 720, H = 240, l = 48, rr = 16, t = 14, b = 30, refs = lim.flatMap(q => q.filter(z => typeof z === 'number')), vs = todos.map(q => q.v).concat(refs);
  const y1 = Math.max(...vs) * 1.08, y0 = Math.max(0, Math.min(...vs) * 0.9), d1 = +hoje(), d0 = Math.min(d1 - 180 * 864e5, ...todos.map(q => +q.d)) - 15 * 864e5;
  const X = d => l + (d - d0) / Math.max(1, d1 - d0) * (W - l - rr), Y = v => t + (1 - (v - y0) / Math.max(1e-9, y1 - y0)) * (H - t - b), dec = un === 'MPa' ? 2 : 0;
  const lin = (v, cor, txt) => `<line x1="${l}" x2="${W - rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${cor}" stroke-dasharray="5 4"/><text x="${l + 4}" y="${Y(v) - 4}" font-size="11" fill="${cor}">${txt} ${nf(v, dec)}</text>`;
  const linhas = lim.map(q => q[2] === 'faixa' ? `<rect x="${l}" width="${W - rr - l}" y="${Y(q[1])}" height="${Math.max(0, Y(q[0]) - Y(q[1]))}" fill="#E6F4EA" opacity=".6"/>` : lin(q[0], '#C5221F', 'limite')).join('');
  const meses = []; { const a = new Date(d0); a.setDate(1); a.setMonth(a.getMonth() + 1); for (; +a <= d1; a.setMonth(a.getMonth() + 1)) meses.push(+a); }
  const pto = (s, q) => { const st = pmcValSt(q.r, p); return `<circle cx="${X(+q.d)}" cy="${Y(q.v)}" r="${frota ? 4 : 5}" fill="${st === 'venc' ? '#C5221F' : st === 'viag' ? '#E3A008' : '#1967D2'}" stroke="#fff" stroke-width="1.5"${frota ? ` data-pmcsel2="${pmcKey(s.y)}" style="cursor:pointer"` : ''}><title>${esc(pmcNome(s.y.v, s.y.pos))} · ${brD(q.r.date)} · ${nf(q.v, dec)} ${un}${q.r.h != null ? ' · ' + nf(q.r.h) + ' h' : ''} · informou ${esc(q.r.quem || '')}</title></circle>`; };
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-height:300px">${linhas}${[0, .25, .5, .75, 1].map(f => { const v = y0 + f * (y1 - y0); return `<line x1="${l}" x2="${W - rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#EEF2F6"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#5F6368">${nf(v, dec)}</text>`; }).join('')}
    ${meses.map(d => `<text x="${X(d)}" y="${H - 10}" text-anchor="middle" font-size="10.5" fill="#5F6368">${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][new Date(d).getMonth()]}</text>`).join('')}
    ${S_.map(s => s.pts.length > 1 ? `<polyline fill="none" stroke="${frota ? '#9AA0A6' : '#1967D2'}" stroke-width="${frota ? 1.2 : 2}" points="${s.pts.map(q => X(+q.d) + ',' + Y(q.v)).join(' ')}"/>` : '').join('')}${S_.map(s => s.pts.map(q => pto(s, q)).join('')).join('')}</svg>`;
  const n = todos.length;
  return `<div class="card"><div class="row"><h2>Tendência ${frota ? 'da frota' : 'por motor'}</h2><span class="sp"></span><select id="pmcSel" class="ol-sv"><option value="frota"${frota ? ' selected' : ''}>Frota (geral)</option>${M.map(y => `<option value="${pmcKey(y)}"${!frota && pmcKey(y) === PMC.sel ? ' selected' : ''}>${esc(pmcNome(y.v, y.pos))}</option>`).join('')}</select>${frota ? '' : `<button class="mbtn sm" data-pmcnovo="${x.v.id}">+ Lançar</button>`}</div>
   <div class="cm-chips">${PMC_PAR.map(q => `<button class="cm-chip${q[0] === p ? ' on' : ''}" data-pmcp="${q[0]}">${esc(q[1])}</button>`).join('')}</div>
   <p class="note"><b>${esc(nome)}</b> (${esc(un)}) · faixa verde = normal do fabricante${lim.some(q => q[1] === 'limite') ? ' · linha vermelha = limite' : ''} · ${n} leitura${n === 1 ? '' : 's'}${frota ? ' · cada linha cinza é um motor; clique num ponto para ver só ele' : ''} · a queda contínua, mesmo dentro da faixa, é o que a análise do trimestre (1.1.30) procura</p>
   ${n ? svg : '<p class="note" style="padding:30px 0;text-align:center">Nenhuma leitura com este parâmetro.</p>'}</div>`;
}
function pmcLista(M) {
  const frota = !PMC.sel || PMC.sel === 'frota', L = (frota ? M.flatMap(y => y.L) : (M.find(y => pmcKey(y) === PMC.sel) || { L: [] }).L).slice().sort((a, z) => (z.at || 0) - (a.at || 0)), max = 30;
  return `<div class="card"><div class="row"><h2>Leituras lançadas</h2><span class="sp"></span><span class="note">${frota ? 'frota inteira · as ' + Math.min(max, L.length) + ' mais recentes' : 'deste motor'}</span></div>
   <div class="tw"><table class="t"><thead><tr><th>Data</th><th>Motor</th><th>Regime</th><th class="r">Horímetro</th><th class="r">Óleo</th><th class="r">Óleo °C</th><th class="r">Água °C</th><th class="r">Ar</th><th>Informou / lançou</th><th></th></tr></thead><tbody>
   ${L.slice(0, max).map(r => { const v = vessel(r.vessel), a = pmcAval(r);
     return `<tr><td class="mono">${brD(r.date)} ${esc(r.hora || '')}</td><td><b>${esc(v ? pmcNome(v, r.pos) : r.vessel)}</b></td><td>${PMC_REG[r.reg] || ''}</td><td class="mono r">${r.h != null ? nf(r.h) : '—'}</td>
       <td class="mono r" title="lido: ${esc(nf(r.poLido, 2) + ' ' + (r.un || ''))}" style="color:${a.st === 'venc' ? 'var(--badt)' : a.st === 'viag' ? 'var(--warnt)' : ''}"><b>${pmcMPa(r.po)} MPa</b></td><td class="mono r">${r.to != null ? nf(r.to) : '—'}</td><td class="mono r">${r.ag != null ? nf(r.ag) : '—'}</td><td class="mono r">${r.ar != null ? pmcMPa(r.ar) + ' MPa' : '—'}</td>
       <td class="note">${esc(r.quem || '')} (${esc(r.meio || '')}) · ${esc(r.by || '')}${r.obs ? '<div>' + esc(r.obs) + '</div>' : ''}</td><td>${can.admin() && !r.seed ? `<button class="mbtn sm" data-pmcdel="${r.id}" title="Excluir leitura lançada errada">Excluir</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="10" class="note">Nenhuma leitura lançada.</td></tr>'}</tbody></table></div></div>`;
}
function pmcParam() {
  return `<div class="card"><div class="row"><h2>Referências e critérios</h2><span class="sp"></span><span class="note">Mitsubishi S6R / S6R2 · texto do Anexo I, item 1.1.30</span></div>
   <div class="tw"><table class="t"><thead><tr><th>Parâmetro</th><th>Condição</th><th>Normal</th><th>Limite</th><th>Fonte</th></tr></thead><tbody>
    <tr><td>Pressão do óleo</td><td>rotação nominal, óleo a 90–100 °C</td><td class="mono">0,49–0,64 MPa</td><td class="mono" style="color:var(--badt)">0,29 MPa</td><td>Service Manual S6R/S6R2, p. 2-3</td></tr>
    <tr><td>Pressão do óleo</td><td>marcha lenta, óleo a 90–100 °C</td><td class="mono">0,20–0,29 MPa</td><td class="mono" style="color:var(--badt)">0,15 MPa</td><td>Service Manual S6R/S6R2, p. 2-3</td></tr>
    <tr><td>Temperatura da água</td><td>rotação nominal</td><td class="mono">70–80 °C</td><td>—</td><td>O&amp;M S6R2-MPTK2, p. 3-7</td></tr>
    <tr><td>Pressão do ar de carga</td><td>rotação nominal</td><td class="mono">0,13–0,17 MPa</td><td>—</td><td>O&amp;M S6R2-MPTK2, p. 3-7</td></tr></tbody></table></div>
   <p class="note"><b>O que o SMF faz:</b> leitura abaixo do limite = P1 no "O que precisa de você agora" (com o botão de avaria para abrir a corretiva); fora da faixa normal = P2; só vale a leitura mais recente de cada MCP com até ${PMC_REC_D} dias. A <b>queda de tendência</b> dentro da faixa aparece só no gráfico: ainda não há critério interno de queda definido. Conversão: 1 bar = 0,1 MPa · 1 kgf/cm² = 0,0981 MPa · 1 psi = 0,00689 MPa. Desvio de tendência → OM (NP 4.3) e avaliação do item 1.1.28.</p></div>`;
}
function vParMcp() { const M = pmcDados();
  return `<div class="cm-v"><div class="vh"><div><h1>Parâmetros do MCP</h1><p>Leituras do painel informadas pelo MFM em viagem (rádio ou WhatsApp) e lançadas em terra · pressão do óleo, temperaturas, ar de carga e rotação · tendência para a análise do trimestre (Anexo I, item 1.1.30)</p></div><span class="sp"></span><button class="mbtn pri" data-pmcnovo="">+ Lançar leituras</button><button class="mbtn" data-pmcreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button></div>
   <div class="cm-ws">${pmcMatriz(M)}${pmcTend(M)}${pmcLista(M)}${pmcParam()}</div></div>`; }
VX.parmcp = vParMcp;
AFTER.parmcp = () => { const m = $('#main');
  m.onclick = async e => { const t = e.target;
    const p = t.closest('[data-pmcp]'); if (p) { PMC.p = p.dataset.pmcp; render(); return; }
    const s = t.closest('[data-pmcsel2]'); if (s) { PMC.sel = s.dataset.pmcsel2; render(); const c = $('#pmcSel'); if (c) c.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const d = t.closest('[data-pmcdel]'); if (d) { if (!precisa(true)) return; const r = S.recs.get(d.dataset.pmcdel); if (!r || !confirm('Excluir a leitura de ' + brD(r.date) + '?')) return; r.excluido = true; await saveRec(r); toast('Leitura excluída.'); render(); } };
  m.onchange = e => { if (e.target.id === 'pmcSel') { PMC.sel = e.target.value; render(); } };
  janelasLivres(document.querySelector('#main .cm-ws'), 'smf_pmc_lay', '[data-pmcreset]'); };
// menu: aba na Condição, depois da Análise de óleo
{ const c = SECOES.find(x => x.id === 'cond2'); if (c && !c.views.some(x => x[0] === 'parmcp')) { const i = c.views.findIndex(x => x[0] === 'anoleo'); c.views.splice(i < 0 ? c.views.length : i + 1, 0, ['parmcp', 'Parâmetros do MCP']); } }
// dados de exemplo: leituras simuladas enquanto a frota de exemplo existir (um motor caindo devagar e um abaixo do limite)
function exemploParam() { const out = [], F = S.cfg.frota.filter(v => !foraOp(v)); let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  F.forEach((v, iv) => mcpPos(v).forEach((pos, ip) => { const hr = horAtual(v.id, pos), h1 = hr ? +hr.h : 8000, base = 0.53 + rnd() * 0.07, n = 10;
    for (let k = 0; k < n; k++) { const dd = new Date(hoje()); dd.setDate(dd.getDate() - (n - 1 - k) * 24 - Math.floor(rnd() * 5) - 3);
      const cai = iv === 2 && ip === 0 ? k * 0.012 : 0, fim = iv === 4 && ip === mcpPos(v).length - 1 && k === n - 1, lenta = k % 4 === 3 && !fim;
      const po = fim ? 0.26 : lenta ? 0.22 + rnd() * 0.05 : Math.max(0.2, base - cai + (rnd() - 0.5) * 0.03), r = { id: `ex-pm-${v.id}-${pos}-${k}`, kind: 'param', seed: true, vessel: v.id, pos, date: isoD(dd), hora: '08:00', at: +dd, reg: lenta ? 'lenta' : 'nominal', un: 'bar',
        po: +po.toFixed(3), poLido: +(po * 10).toFixed(1), to: rnd() < 0.2 ? null : Math.round(91 + rnd() * 7), ag: lenta ? Math.round(68 + rnd() * 6) : Math.round(74 + rnd() * 5), ar: lenta || rnd() < 0.3 ? null : +(0.14 + rnd() * 0.025).toFixed(3),
        h: Math.max(0, Math.round(h1 - (n - 1 - k) * 480)), rpm: lenta ? 650 : 1800, quem: 'MFM (exemplo)', meio: 'Rádio', obs: '', by: 'Exemplo' };
      r.arLido = r.ar == null ? null : +(r.ar * 10).toFixed(2); r.stTxt = pmcStTxt(r); r.updatedAt = r.createdAt = Date.now(); out.push(r); } }));
  return out; }
{ let n = 0; const t = setInterval(async () => { n++; if (n > 200) return clearInterval(t);
  if (typeof S === 'undefined' || !S.pronto || !S.cfg || !S.cfg.frota || !S.recs || !S.recs.size || !document.getElementById('main')) return; clearInterval(t);
  if (!temExemplo() || recs('param').some(r => r.seed)) return;
  const l = exemploParam(); l.forEach(r => S.recs.set(r.id, r)); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); render(); }, 200); }
{ const st = document.createElement('style'); st.textContent = `.pmc-m{border:1px solid #DADCE0;border-radius:10px;padding:8px 12px 10px;margin:10px 0}.pmc-m legend{font-weight:600;padding:0 6px}`; document.head.appendChild(st); }
