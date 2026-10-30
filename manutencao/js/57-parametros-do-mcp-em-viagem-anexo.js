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

// valor de um parâmetro do gráfico numa leitura (pressão separada por regime)


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
