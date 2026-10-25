/* ===== Controle da condição numa página só: seções uma embaixo da outra, com índice fixo ===== */
'use strict';
{
  let ALVO = '';
  const parte = (k, f, i) => { const t = document.createElement('div'); t.innerHTML = f();
    t.querySelectorAll('.banner').forEach(b => b.remove());
    const vh = t.querySelector(':scope > .vh');
    if (vh && i > 0) { const h1 = vh.querySelector('h1'), btns = [...vh.querySelectorAll(':scope > .mbtn, :scope > a.mbtn')].map(b => b.outerHTML).join(''); const s = document.createElement('div'); s.className = 'ab4-sec'; s.id = 'cs-' + k; s.innerHTML = `<h2>${h1 ? h1.innerHTML : ''}</h2><span class="sp"></span>${btns}`; vh.replaceWith(s); }
    else if (vh) { vh.id = 'cs-' + k; const h1 = vh.querySelector('h1'); if (h1) h1.textContent = 'Controle da condição'; }
    t.querySelectorAll('.ab4-sec').forEach(s => { const h = (s.querySelector('h2') || {}).textContent || ''; if (/^Lubrifica/.test(h)) s.id = 'cs-lub'; if (/^MBC/.test(h)) s.id = 'cs-mbc'; });
    [...t.children].forEach(c => { c.dataset.sec = k; c.querySelectorAll('.card,.kc,.mini,.lb,.ab4-sec').forEach(x => x.dataset.sec = k); });
    return t.innerHTML; };
  /* Calibração e docagem num bloco só (24/10/2026): antes a tela montava Vencimentos, Lubrificação, MBC e Horímetros e depois quatro
     blocos apagavam o que não aparece. Agora monta só o que aparece: cabeçalho, índice, Calibração do MCP (vCalib) e Docagem (VX.doca). */
  VX.controle = () => {
    const t = document.createElement('div');
    t.innerHTML = `<div class="vh"><div><h1>Calibração e docagem</h1></div><span class="sp"></span><button class="mbtn" data-act="lancarHor">⏱ Registrar horímetros</button></div>`
      + `<nav class="cs-idx" data-sec="nav"><button data-csgo="mcp">Calibração do MCP</button><button data-csgo="doca">Docagem</button></nav>`
      + parte('mcp', vCalib, 1) + parte('doca', VX.doca, 2);
    t.querySelectorAll('.kgrid').forEach(g => { if (/caixa de mar vence na viagem|docagens vencidas|embarcações liberadas para operação/.test(g.textContent)) g.remove(); });
    t.querySelectorAll('.card').forEach(c => { const h = ((c.querySelector('h2') || {}).textContent || '').trim(); if (/^B · (Frota: o item mais urgente|Todos os itens, por urgência|Escopo de serviços da docagem)/.test(h)) c.remove(); });
    return t.innerHTML; };
  AFTER.controle = () => { const m = $('#main'), H = {};
    [['mcp', AFTER.calib], ['doca', AFTER.doca]].forEach(([k, a]) => { m.onclick = m.oninput = m.onchange = null; a && a(); H[k] = { onclick: m.onclick, oninput: m.oninput, onchange: m.onchange }; });
    ['onclick', 'oninput', 'onchange'].forEach(ev => { m[ev] = function (e) { const s = e.target.closest('[data-sec]'); const k = s ? s.dataset.sec : ''; const f = (H[k] || {})[ev]; if (f) return f.call(m, e); }; });
    if (ALVO && Date.now() - ALVO.t < 3000) { const a = ALVO.k; setTimeout(() => irPara(a), 450); } };
  const fixa = () => { const n = document.querySelector('.cs-idx'); if (!n) return; const ph = document.querySelector('.cs-ph'); const ref = ph || n; const r = ref.getBoundingClientRect(), mr = $('#main').getBoundingClientRect();
    if (!n.classList.contains('fix') && r.top < 0) { const p = document.createElement('div'); p.className = 'cs-ph'; p.style.height = n.offsetHeight + 'px'; n.before(p); n.classList.add('fix'); n.style.left = mr.left + 'px'; n.style.width = mr.width + 'px'; }
    else if (n.classList.contains('fix') && ph && ph.getBoundingClientRect().top >= 0) { ph.remove(); n.classList.remove('fix'); n.style.left = n.style.width = ''; } };
  window.addEventListener('scroll', () => { if (VIEW === 'controle') fixa(); }, { passive: true });
  const irPara = k => { if (VIEW !== 'controle') return; const e = document.getElementById('cs-' + k); if (!e) return; const y = e.getBoundingClientRect().top + scrollY - 120; scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); };
  document.addEventListener('click', e => { const b = e.target.closest('[data-csgo]'); if (!b) return; e.preventDefault(); e.stopPropagation(); irPara(b.dataset.csgo); }, true);
  const s = SECOES.find(x => x.id === 'cond');
  if (s) { s.extra = [...new Set((s.extra || []).concat(s.views.map(x => x[0]), ['lub', 'calib', 'over', 'mcp', 'frota', 'doca', 'hor']))]; s.views = [['controle', 'Controle da condição']]; }
  if (typeof LAY_VIEWS !== 'undefined' && !LAY_VIEWS.includes('controle')) LAY_VIEWS.push('controle');
  const MAPA = { frota: 'venc', lub: 'lub', calib: 'mcp', over: 'mbc', mcp: 'mcp', doca: 'doca' };   // sem 'hor': Horímetros é aba da Administração (a parte de horímetros saiu desta tela)
  const redir2 = () => { const h = location.hash.slice(1); if (MAPA[h]) { ALVO = MAPA[h] === 'venc' ? '' : { k: MAPA[h], t: Date.now() }; location.replace('#controle'); } };
  window.addEventListener('hashchange', redir2, true); redir2();
}



