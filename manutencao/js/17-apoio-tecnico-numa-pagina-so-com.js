/* ===== Apoio técnico numa página só, com seções numeradas ===== */
'use strict';
const PAG1 = new Set(['controle']);
function paginaUnica(view, secId, titulo, partes) {
  PAG1.add(view);
  const SEC = partes.map(([k, l], i) => ({ k, l, n: i + 1, f: VX[k] || (typeof window['v' + k] === 'function' ? window['v' + k] : null), a: AFTER[k] }));
  const parte = (s, i) => { const t = document.createElement('div'); t.innerHTML = s.f ? s.f() : '';
    t.querySelectorAll('.banner').forEach(b => b.remove()); t.querySelectorAll('.abas').forEach(b => b.remove());
    const vh = t.querySelector(':scope > .vh'), btns = vh ? [...vh.querySelectorAll(':scope > .mbtn, :scope > a.mbtn, :scope > label.mbtn')].map(b => b.outerHTML).join('') : '';
    const sub = vh ? (vh.querySelector('p') || {}).innerHTML || '' : '';
    const sec = `<div class="ab4-sec" id="pg-${view}-${s.k}"><h2><span class="pg-n">${s.n}</span>${esc(s.l)}</h2><span class="sp"></span>${btns}</div>${sub ? `<p class="note pg-sub">${sub}</p>` : ''}`;
    if (vh) vh.outerHTML = sec; else t.insertAdjacentHTML('afterbegin', sec);
    [...t.children].forEach(c => { c.dataset.sec = s.k; c.querySelectorAll('.card,.kc,.mini').forEach(x => x.dataset.sec = s.k); });
    return t.innerHTML; };
  VX[view] = () => `<div class="vh"><div><h1>${titulo}</h1><p>${SEC.map(s => s.n + '. ' + s.l).join(' · ')}</p></div><span class="sp"></span><nav class="cs-idx pg-idx" data-sec="nav">${SEC.map(s => `<button data-pggo="${view}-${s.k}">${s.n}. ${esc(s.l)}</button>`).join('')}</nav></div>` + SEC.map(parte).join('');
  AFTER[view] = () => { const m = $('#main'), H = {};
    SEC.forEach(s => { m.onclick = m.oninput = m.onchange = null; try { s.a && s.a(); } catch (e) { console.error(e); } H[s.k] = { onclick: m.onclick, oninput: m.oninput, onchange: m.onchange }; });
    ['onclick', 'oninput', 'onchange'].forEach(ev => { m[ev] = function (e) { const el = e.target.closest('[data-sec]'); const k = el ? el.dataset.sec : SEC[0].k; if (k === 'nav') return; const f = (H[k] || {})[ev]; if (f) return f.call(m, e); }; }); };
  const s = SECOES.find(x => x.id === secId);
  if (s) { s.extra = [...new Set((s.extra || []).concat(s.views.map(x => x[0])))]; s.views = [[view, titulo]]; }
  if (typeof LAY_VIEWS !== 'undefined' && !LAY_VIEWS.includes(view)) LAY_VIEWS.push(view);
  const MAPA = Object.fromEntries(SEC.map(x => [x.k, x.k]));
  let ALVO = null;
  const ir = id => { if (VIEW !== view) return; const e = document.getElementById('pg-' + id); if (!e) return; scrollTo({ top: Math.max(0, e.getBoundingClientRect().top + scrollY - 120), behavior: 'smooth' }); };
  const redir = () => { const h = location.hash.slice(1); if (MAPA[h]) { ALVO = { k: view + '-' + h, t: Date.now() }; location.replace('#' + view); } };
  window.addEventListener('hashchange', redir); redir();
  { const a0 = AFTER[view]; AFTER[view] = () => { a0(); if (ALVO && Date.now() - ALVO.t < 3000) { const k = ALVO.k; setTimeout(() => ir(k), 450); } }; }
  document.addEventListener('click', e => { const b = e.target.closest('[data-pggo]'); if (!b) return; e.preventDefault(); e.stopPropagation(); ir(b.dataset.pggo); }, true);
}
paginaUnica('apoio', 'apoio', 'Biblioteca', [['bib', 'Biblioteca técnica'], ['pecas', 'Sobressalentes críticos'], ['terc', 'Prestadores de serviço'], ['trein', 'Treinamentos']]);

