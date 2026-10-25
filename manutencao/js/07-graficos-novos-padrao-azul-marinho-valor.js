/* =====================================================================
   GRÁFICOS NOVOS (padrão azul-marinho, valor escrito, sem poluição)
   + PAINÉIS ORGANIZÁVEIS (arrastar, mudar largura, ocultar e salvar)
   ===================================================================== */
'use strict';
const NAVY = ['#1967D2', '#1A73E8', '#4285F4', '#669DF6', '#8AB4F8', '#AECBFA', '#C6DAFC', '#D2E3FC'];
const tomRank = (v, mx) => NAVY[Math.min(NAVY.length - 1, Math.round((1 - (mx ? v / mx : 0)) * (NAVY.length - 1)))];
// linha (indicadores): ponto com valor, último destacado, meta tracejada
// barras horizontais: tom mais escuro = maior valor, valor no fim da barra

/* ---------- painéis organizáveis ---------- */
const LAY_VIEWS = ['geral', 'frota', 'calib', 'over', 'doca', 'falhas', 'hor', 'kpi', 'lub', 'lubcons', 'lubreg', 'plano', 'bib', 'terc', 'trein', 'acomp'];
const LAYS = { 6: '¼', 8: '⅓', 12: '½', 16: '⅔', 24: 'Inteira' };
let LAY = {}, LAYED = false;
let LAYOK = false;
const layChave = (el, i, usadas) => { const h = el.matches('h1,h2,h3') ? el : el.querySelector('h1,h2,h3'); let k = (el.dataset.lk || (h ? h.textContent : (el.querySelector('.at') || el.querySelector(':scope > span') || { textContent: el.className }).textContent)).replace(/[\d().,·:%/]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 34) || 'bloco'; let kk = k, n = 2; while (usadas.has(kk)) kk = k + ' ' + n++; usadas.add(kk); return kk; };
let LAYV = '';
function layApply() {   // num lugar só (24/10/2026): antes eram 4 camadas por cima
  try { if (typeof LAY !== 'undefined' && LAY && Object.keys(LAY).length && !LAY._kr3) { delete LAY.kpi; LAY._kr1 = LAY._kr2 = LAY._kr3 = 1; kvSet('layout', LAY).catch(() => { }); } } catch (e) { }
  layMonta();
  try { layCtl(); } catch (e) { console.error(e); }
  try { freeApply(); requestAnimationFrame(() => freeApply()); setTimeout(() => freeApply(), 400); } catch (e) { console.error(e); }
  if (!freeOn()) return; const vh = $('#main > .vh'), b = vh && vh.querySelector('[data-lay="editar"]'); if (b && !vh.querySelector('[data-fcomp]')) b.insertAdjacentHTML('beforebegin', '<button class="mbtn" data-fcomp title="Subir os painéis para fechar os espaços vazios">⇡ Compactar</button>');
}
function layMonta() {
  if (VIEW !== LAYV) { LAYED = false; LAYV = VIEW; }
  if (!LAYOK) { LAYOK = true; kvGet('layout').then(v => { LAY = v || {}; if (!LAY._org3) { delete LAY.geral; LAY._org3 = 1; kvSet('layout', LAY); } if (LAY_VIEWS.includes(VIEW) && Object.keys(LAY).length) render(); }).catch(() => { }); }
  if (!LAY_VIEWS.includes(VIEW)) return;
  const m = $('#main'), vh = m.querySelector(':scope > .vh'); if (!vh) return;
  const blocos = [], usadas = new Set();
  [...m.children].filter(e => !e.matches('.abas,.banner,.vh,script')).forEach(e => {
    if (e.matches('.two')) [...e.children].forEach(c => blocos.push({ el: c, span: 12 }));
    else if (e.matches('.kgrid') && e.querySelector(':scope > .kc')) { [...e.children].forEach(c => blocos.push({ el: c, span: 6 })); e.dataset.vazio = 1; }
    else if (e.matches('.dz3')) { [...e.children].forEach(c => blocos.push({ el: c, span: 8 })); e.dataset.vazio = 1; }
    else if (e.matches('.areas')) { [...e.children].forEach(c => blocos.push({ el: c, span: 6 })); e.dataset.vazio = 1; }
    else if (e.matches('.kgrid') && e.querySelector(':scope > .card.mini')) { const n = e.children.length; [...e.children].forEach(c => blocos.push({ el: c, span: n >= 6 ? 4 : n === 5 ? 4 : n === 4 ? 6 : 8 })); e.dataset.vazio = 1; }
    else blocos.push({ el: e, span: 24 });
  });
  if (blocos.length < 2) return;
  blocos.forEach((b, i) => { b.k = layChave(b.el, i, usadas); });
  const cfg = LAY[VIEW] || {}, ord = cfg.order || [], pos = k => { const i = ord.indexOf(k); return i < 0 ? 1e3 : i; };
  blocos.forEach((b, i) => { b.i = i; if (cfg.span && cfg.span[b.k]) b.span = cfg.v2 ? cfg.span[b.k] : cfg.span[b.k] * 2; b.h = (cfg.h || {})[b.k] || null; b.oculto = (cfg.hide || []).includes(b.k); });
  blocos.sort((a, b) => (pos(a.k) - pos(b.k)) || (a.i - b.i));
  const lay = document.createElement('div'); lay.className = 'lay' + (LAYED ? ' edit' : '');
  blocos.forEach(b => { const w = document.createElement('div'); w.className = 'lb' + (b.oculto ? ' oc' : ''); w.dataset.k = b.k; w.dataset.span = b.span; w.style.gridColumn = 'span ' + b.span; if (b.h) w.dataset.h = b.h; if (LAYED) { w.draggable = true; w.insertAdjacentHTML('afterbegin', `<div class="lbar"><span class="lh" title="Arraste para mudar de lugar">⠿ arrastar</span><span class="sp"></span>${Object.entries(LAYS).map(([n, t]) => `<button data-lspan="${n}" class="${+n === b.span ? 'on' : ''}">${t}</button>`).join('')}${b.el.matches('.two > *') || 1 ? `<button data-lhide title="${b.oculto ? 'Mostrar' : 'Ocultar'}">${b.oculto ? '👁 mostrar' : 'ocultar'}</button>` : ''}</div>`); } w.appendChild(b.el); lay.appendChild(w); });
  [...m.children].filter(e => (e.matches('.two') || e.dataset.vazio) && !e.children.length).forEach(e => e.remove());
  vh.after(lay);
  // botões do cabeçalho
  vh.insertAdjacentHTML('beforeend', LAYED ? `<div class="layb"><button class="mbtn" data-lay="padrao">↺ Padrão</button><button class="mbtn" data-lay="cancelar">Cancelar</button><button class="mbtn ok" data-lay="salvar">💾 Salvar layout</button></div>` : `<button class="mbtn" data-lay="editar" title="Arrastar, mudar a largura e ocultar blocos desta tela">⤢ Organizar</button>`);
  if (LAYED) layEventos(lay);
}
function layEventos(lay) {
  let arr = null;
  lay.addEventListener('dragstart', e => { arr = e.target.closest('.lb'); if (arr) { arr.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; } });
  lay.addEventListener('dragend', () => { if (arr) arr.classList.remove('drag'); arr = null; });
  lay.addEventListener('dragover', e => { e.preventDefault(); const t = e.target.closest('.lb'); if (!arr || !t || t === arr) return; const r = t.getBoundingClientRect(), antes = (e.clientY - r.top) < r.height / 2 || (e.clientX - r.left) < r.width / 3; lay.insertBefore(arr, antes ? t : t.nextSibling); });
  lay.addEventListener('click', e => {
    const s = e.target.closest('[data-lspan]'); if (s) { const w = s.closest('.lb'); w.dataset.span = s.dataset.lspan; w.style.gridColumn = 'span ' + s.dataset.lspan; w.querySelectorAll('[data-lspan]').forEach(b => b.classList.toggle('on', b === s)); return; }
    const h = e.target.closest('[data-lhide]'); if (h) { const w = h.closest('.lb'); w.classList.toggle('oc'); h.textContent = w.classList.contains('oc') ? '👁 mostrar' : 'ocultar'; }
  }, true);
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-lay]'); if (!b) return;
  const a = b.dataset.lay;
  if (a === 'editar') { LAYED = true; render(); toast('Arraste os blocos pela barra de cima, escolha a largura (⅓, ½, ⅔, inteira) e clique em Salvar layout.', 5000); }
  if (a === 'cancelar') { LAYED = false; render(); }
  if (a === 'padrao') { delete LAY[VIEW]; await kvSet('layout', LAY); LAYED = false; render(); toast('Layout padrão restaurado.'); }
  if (a === 'salvar') { const L = [...$$('#main .lay > .lb')]; LAY[VIEW] = { order: L.map(w => w.dataset.k), span: Object.fromEntries(L.map(w => [w.dataset.k, +w.dataset.span])), hide: L.filter(w => w.classList.contains('oc')).map(w => w.dataset.k), min: (LAY[VIEW] || {}).min || [], h: Object.fromEntries(L.filter(w => w.dataset.h).map(w => [w.dataset.k, +w.dataset.h])), v2: true }; await kvSet('layout', LAY); LAYED = false; render(); toast('Layout salvo neste aparelho.'); }
});

/* ---------- exemplo antigo: motor de popa e motobomba passaram a contar pelo horímetro do MCP ---------- */

/* =====================================================================
   GRÁFICOS v2 · HTML + SVG responsivos: o texto não escala com a largura
   (o desenho estica, as letras ficam no tamanho certo em qualquer tela)
   ===================================================================== */
const fmtU = (v, dec, unit) => /\s$/.test(unit || '') && /^R\$/.test(unit) ? unit + nf(v, dec) : nf(v, dec) + (unit || '');
let _lcId = 0;
function lineChart(vals, labels, meta, unit, dec, opt = {}) {
  const H = opt.h || 150, vv = vals.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (!vv.length) return `<div class="lnc-vazio" style="height:${H}px">Sem dados no período</div>`;
  let mn = Math.min(...vv, meta), mx = Math.max(...vv, meta); const p = (mx - mn) * .25 || Math.abs(mx) * .1 || 1; mn -= p; mx += p * .7; if (Math.min(...vv, meta) >= 0 && mn < 0) mn = 0;
  const n = vals.length, X = i => n === 1 ? 50 : 5 + i * 90 / (n - 1), Y = v => 6 + (mx - v) / (mx - mn) * 88;
  const pts = vals.map((v, i) => v === null || v === undefined || isNaN(v) ? null : { x: X(i), y: Y(v), v, i }).filter(Boolean), last = pts[pts.length - 1];
  const ok = v => opt.menor ? v <= meta : v >= meta;
  const id = 'lg' + (++_lcId), d = pts.map((q, i) => (i ? 'L' : 'M') + q.x.toFixed(2) + ',' + q.y.toFixed(2)).join(' ');
  const svg = `<svg class="lnc-s" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4285F4" stop-opacity=".35"/><stop offset="1" stop-color="#4285F4" stop-opacity="0"/></linearGradient></defs>
    ${[25, 50, 75].map(g => `<line x1="0" x2="100" y1="${g}" y2="${g}" class="lnc-g"/>`).join('')}
    ${pts.length > 1 ? `<path d="${d} L${last.x},100 L${pts[0].x},100 Z" fill="url(#${id})"/><path d="${d}" class="lnc-l"/>` : ''}
    <line x1="0" x2="100" y1="${Y(meta)}" y2="${Y(meta)}" class="lnc-m"/></svg>`;
  const mTop = Y(meta), mLab = `<span class="lnc-ml" style="top:${mTop}%;${mTop > 80 ? 'transform:translateY(-120%)' : ''}">meta ${fmtU(meta, dec, unit)}</span>`;
  const dots = pts.map(q => `<i class="lnc-p${q === last ? ' u' : ''}${ok(q.v) ? '' : ' f'}" style="left:${q.x}%;top:${q.y}%" data-tip="${esc(labels[q.i])}: ${fmtU(q.v, dec, unit)}"></i>${q === last ? '' : `<span class="lnc-v" style="left:${q.x}%;top:${q.y}%">${nf(q.v, dec)}</span>`}`).join('');
  const uLab = `<span class="lnc-vu${last.x > 80 ? ' r' : ''}" style="left:${last.x}%;top:${last.y}%">${fmtU(last.v, dec, unit)}</span>`;
  const xl = labels.map((l, i) => `<span style="left:${X(i)}%">${esc(l)}</span>`).join('');
  return `<div class="lnc" role="img" aria-label="${esc(labels.map((l, i) => l + ' ' + fmtv(vals[i], dec)).join(', '))}"><div class="lnc-a" style="height:${H}px">${svg}${mLab}${dots}${uLab}</div><div class="lnc-x">${xl}</div></div>`;
}
function hbar(rows, unit, meta, dec = 0) {
  if (!rows.length) return '<div class="note">Sem dados no período</div>';
  const mx = Math.max(...rows.map(r => r[1]), meta || 0, 1) * 1.04, pc = v => Math.max(.8, v / mx * 100);
  const abaixo = r => meta != null && r[1] < meta;
  return `<div class="hb2" role="img" aria-label="${esc(rows.map(r => r[0] + ' ' + fmtU(r[1], dec, unit)).join(', '))}">${rows.map((r, i) => `<div class="hb2-r" data-tip="${esc(r[0])}: ${fmtU(r[1], dec, unit)}"><span class="hb2-l" title="${esc(r[0])}">${esc(r[0])}</span><span class="hb2-t"><i style="width:${pc(r[1])}%;background:${abaixo(r) ? '#D93025' : tomRank(r[1], mx / 1.04)}"></i>${meta != null ? `<em style="left:${meta / mx * 100}%"></em>` : ''}</span><b class="hb2-v${abaixo(r) ? ' f' : ''}">${fmtU(r[1], dec, unit)}</b></div>`).join('')}
   ${meta != null ? `<div class="hb2-r hb2-mr"><span class="hb2-l"></span><span class="hb2-t" style="background:none"><span class="hb2-ml" style="left:${meta / mx * 100}%">meta ${fmtU(meta, dec, unit)}</span></span><b class="hb2-v"></b></div>` : ''}</div>`;
}


/* ---------- minimizar e maximizar cada painel (sem entrar no modo Organizar) ---------- */
['crono', 'pecas'].forEach(v => { if (!LAY_VIEWS.includes(v)) LAY_VIEWS.push(v); });
function layCtl() {
  if (LAYED || !LAY_VIEWS.includes(VIEW)) return;
  const mins = (LAY[VIEW] || {}).min || [];
  $$('#main .lay > .lb').forEach(w => {
    const c = w.firstElementChild; if (!c || !c.classList.contains('card') || w.querySelector(':scope > .pctl')) return;
    if (mins.includes(w.dataset.k)) w.classList.add('min');
    w.insertAdjacentHTML('afterbegin', `<div class="pctl"><button data-pmin title="${w.classList.contains('min') ? 'Restaurar' : 'Minimizar'}">${w.classList.contains('min') ? '+' : '−'}</button><button data-pmax title="Maximizar">⛶</button></div>`);
  });
  $$('#main .lay > .lb').forEach(w => { layAltura(w); const c = w.querySelector(':scope > .card'); if (!c) return;
    const p = w.querySelector(':scope > .pctl'); if (p && !p.querySelector('[data-pmov]')) p.insertAdjacentHTML('afterbegin', '<button data-pmov title="Arrastar para mudar de lugar">⠿</button>');
    if (!w.querySelector(':scope > .lrz')) w.insertAdjacentHTML('beforeend', '<span class="lrz" title="Arraste para mudar o tamanho · clique duplo volta ao automático">⤡</span>'); });
}
document.addEventListener('click', async e => {
  const mn = e.target.closest('[data-pmin]');
  if (mn) { e.stopPropagation(); const w = mn.closest('.lb'), k = w.dataset.k; w.classList.toggle('min'); const on = w.classList.contains('min'); mn.textContent = on ? '+' : '−'; mn.title = on ? 'Restaurar' : 'Minimizar';
    const cfg = LAY[VIEW] = LAY[VIEW] || {}; cfg.min = (cfg.min || []).filter(x => x !== k); if (on) cfg.min.push(k); try { await kvSet('layout', LAY); } catch (er) { } return; }
  const mx = e.target.closest('[data-pmax]');
  if (mx) { e.stopPropagation(); const w = mx.closest('.lb'), c = w.querySelector(':scope > .card').cloneNode(true);
    const ov = document.createElement('div'); ov.className = 'pmax'; ov.innerHTML = '<div class="pmax-b"><button class="pmax-x" title="Fechar (Esc)">✕</button></div>'; ov.firstChild.appendChild(c); document.body.appendChild(ov);
    const fechar = () => { ov.remove(); document.removeEventListener('keydown', esc1); }, esc1 = ev => { if (ev.key === 'Escape') fechar(); };
    ov.addEventListener('click', ev => { if (ev.target === ov || ev.target.closest('.pmax-x')) fechar(); }); document.addEventListener('keydown', esc1); return; }
}, true);


/* ---------- tamanho livre (alça no canto) e mover livre (pegador), com salvamento automático ---------- */
function layAltura(w) { const c = w.querySelector(':scope > .card'); if (!c) return; if (w.dataset.h) { c.style.height = w.dataset.h + 'px'; c.style.overflow = 'auto'; } else { c.style.height = ''; c.style.overflow = ''; } }
/* =====================================================================
   LAYOUT LIVRE · cada painel fica onde for solto (grade fina de 24 colunas × 10 px)
   Os outros só descem se ficarem por baixo. Salva sozinho por tela e por aparelho.
   ===================================================================== */
const FU = 10, FG = 16;           // unidade de altura (px) e espaço entre painéis
let FLY = null;                   // posições calculadas da tela atual {k:{x,y,w,hu}}
const freeOn = () => !LAYED && LAY_VIEWS.includes(VIEW) && innerWidth >= 900;
const sobrep = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.hu && b.y < a.y + a.hu;
function freeResolve(arr, fixo) {   // empurra para baixo quem estiver por cima de outro; 'fixo' fica onde foi solto
  const ord = arr.slice().sort((a, b) => (a === fixo ? -1 : b === fixo ? 1 : a.y - b.y || a.x - b.x)), ok = [];
  ord.forEach(it => { let mudou = true; while (mudou) { mudou = false; for (const o of ok) if (sobrep(it, o)) { it.y = o.y + o.hu; mudou = true; } } ok.push(it); });
}
function freeLivre(arr, it) {        // primeira posição livre (de cima para baixo, da esquerda para a direita)
  const y0 = arr.length ? arr[arr.length - 1].y : 0;   // mantém a ordem da tela: não sobe para buracos acima do painel anterior
  const lim = VIEW === 'controle' || VIEW === 'geral' || PAG1.has(VIEW) ? 9000 : 5000;   // telas de uma página só (muito longas)
  for (let y = y0; y < lim; y++) for (let x = 0; x <= 24 - it.w; x++) { it.x = x; it.y = y; if (!arr.some(o => sobrep(it, o))) return; }
}
let FDRAG = false;
function freeApply(fixoK) {
  if (FDRAG) return; const lay = $('#main .lay'); if (!lay) return;
  if (!freeOn()) { if (lay.classList.contains('free')) { lay.classList.remove('free'); lay.style.height = ''; $$('#main .lay > .lb').forEach(w => { w.style.cssText = w.style.cssText.replace(/(position|left|top|width):[^;]+;?/g, ''); w.style.gridColumn = 'span ' + w.dataset.span; }); } return; }
  lay.classList.add('free');
  const W = lay.clientWidth, colW = (W + FG) / 24, cfg = LAY[VIEW] || {}, pos = cfg.free || {};
  const vis = [...lay.children].filter(w => w.classList.contains('lb') && !w.classList.contains('oc'));
  const arr = vis.map(w => { const k = w.dataset.k, p = pos[k] || {}, wd = Math.max(2, Math.min(24, p.w || +w.dataset.span || 24));
    w.style.position = 'absolute'; w.style.width = (wd * colW - FG) + 'px'; w.style.gridColumn = '';
    return { w: wd, el: w, k, x: p.x, y: p.y, salvo: p.x != null }; });
  arr.forEach(it => { it.hu = Math.max(3, Math.ceil((it.el.offsetHeight + FG) / FU)); });
  const ok = [];
  arr.filter(it => it.salvo).sort((a, b) => a.y - b.y).forEach(it => { it.x = Math.min(it.x, 24 - it.w); ok.push(it); });
  const fixo = fixoK ? ok.find(it => it.k === fixoK) : null; freeResolve(ok, fixo);
  arr.filter(it => !it.salvo).forEach(it => { freeLivre(ok, it); ok.push(it); });
  let fim = 0; ok.forEach(it => { it.el.style.left = (it.x * colW) + 'px'; it.el.style.top = (it.y * FU) + 'px'; fim = Math.max(fim, it.y + it.hu); });
  lay.style.height = (fim * FU) + 'px';
  FLY = { colW, itens: ok };
}
async function freeSalvar() {
  if (!FLY) return; const cfg = LAY[VIEW] = LAY[VIEW] || {}; cfg.free = cfg.free || {};
  FLY.itens.forEach(it => { cfg.free[it.k] = { x: it.x, y: it.y, w: it.w }; });
  cfg.h = Object.fromEntries($$('#main .lay > .lb').filter(w => w.dataset.h).map(w => [w.dataset.k, +w.dataset.h])); cfg.v2 = true;
  try { await kvSet('layout', LAY); } catch (e) { }
}
let _frT; addEventListener('resize', () => { clearTimeout(_frT); _frT = setTimeout(() => freeApply(), 120); });
// salvar do modo Organizar volta ao arranjo automático por ordem/largura
document.addEventListener('click', e => { const b = e.target.closest('[data-lay="salvar"],[data-lay="padrao"]'); if (b && LAY[VIEW]) delete LAY[VIEW].free; }, true);
// minimizar muda a altura: reorganiza
document.addEventListener('click', e => { if (e.target.closest('[data-pmin]')) setTimeout(() => { freeApply(); if (FLY) freeSalvar(); }, 0); });

document.addEventListener('pointerdown', e => {
  const rz = e.target.closest('.lrz'), mv = e.target.closest('[data-pmov]');
  if (!rz && !mv) return; e.preventDefault(); e.stopPropagation();
  const w = (rz || mv).closest('.lb'), lay = w.parentElement, card = w.querySelector(':scope > .card');
  if (!freeOn()) return;
  freeApply(); const it = FLY.itens.find(i => i.el === w); if (!it) return; FDRAG = true;
  const colW = FLY.colW, lr = () => lay.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, L0 = it.x * colW, T0 = it.y * FU;
  const ph = document.createElement('div'); ph.className = 'fph'; lay.appendChild(ph);
  const mostraPh = () => { ph.style.left = (it.x * colW) + 'px'; ph.style.top = (it.y * FU) + 'px'; ph.style.width = (it.w * colW - FG) + 'px'; ph.style.height = (it.hu * FU - FG) + 'px'; };
  let vy = 0; const tick = setInterval(() => { if (vy) document.scrollingElement.scrollBy(0, vy); }, 16);
  if (rz) {
    w.classList.add('rzing'); const w0 = it.w, h0 = card.getBoundingClientRect().height;
    const mov = ev => { vy = ev.clientY > innerHeight - 50 ? 12 : 0;
      it.w = Math.max(2, Math.min(24 - it.x, Math.round((w0 * colW + (ev.clientX - x0)) / colW))); w.dataset.span = it.w; w.style.width = (it.w * colW - FG) + 'px';
      const h = Math.max(36, Math.round((h0 + (ev.clientY - y0)) / 4) * 4); w.dataset.h = h; layAltura(w);
      it.hu = Math.ceil((w.offsetHeight + FG) / FU); mostraPh(); };
    const up = () => { FDRAG = false; clearInterval(tick); document.removeEventListener('pointermove', mov); document.removeEventListener('pointerup', up); ph.remove(); w.classList.remove('rzing');
      const cfg = LAY[VIEW] = LAY[VIEW] || {}; cfg.free = cfg.free || {}; FLY.itens.forEach(i => { if (i.k !== it.k) cfg.free[i.k] = { x: i.x, y: i.y, w: i.w }; }); cfg.free[it.k] = { x: it.x, y: it.y, w: it.w }; freeApply(it.k); freeSalvar(); };
    mostraPh(); document.addEventListener('pointermove', mov); document.addEventListener('pointerup', up); return;
  }
  w.classList.add('dragging'); w.style.zIndex = 20; mostraPh();
  const mov = ev => { vy = ev.clientY < 60 ? -12 : ev.clientY > innerHeight - 60 ? 12 : 0;
    const r = lr(), L = L0 + (ev.clientX - x0), T = Math.max(0, T0 + (ev.clientY - y0) + 0);
    w.style.left = L + 'px'; w.style.top = T + 'px';
    it.x = Math.max(0, Math.min(24 - it.w, Math.round(L / colW))); it.y = Math.max(0, Math.round(T / FU)); mostraPh();
    lay.style.height = Math.max(parseFloat(lay.style.height) || 0, T + w.offsetHeight + 40) + 'px'; };
  const up = () => { FDRAG = false; clearInterval(tick); document.removeEventListener('pointermove', mov); document.removeEventListener('pointerup', up); ph.remove(); w.classList.remove('dragging'); w.style.zIndex = '';
    const cfg = LAY[VIEW] = LAY[VIEW] || {}; cfg.free = cfg.free || {}; FLY.itens.forEach(i => { if (i.k !== it.k) cfg.free[i.k] = { x: i.x, y: i.y, w: i.w }; }); cfg.free[it.k] = { x: it.x, y: it.y, w: it.w };
    freeApply(it.k); freeSalvar(); };
  document.addEventListener('pointermove', mov); document.addEventListener('pointerup', up);
}, true);
document.addEventListener('dblclick', e => { const rz = e.target.closest('.lrz'); if (!rz) return; const w = rz.closest('.lb'); delete w.dataset.h; layAltura(w); freeApply(w.dataset.k); freeSalvar(); }, true);

/* compactar: sobe os painéis para fechar os buracos, sem mudar a coluna */
function freeCompactar() {
  freeApply(); if (!FLY) return; const it = FLY.itens.slice().sort((a, b) => a.y - b.y || a.x - b.x), ok = [];
  it.forEach(i => { while (i.y > 0) { i.y--; if (ok.some(o => sobrep(i, o))) { i.y++; break; } } ok.push(i); });
  const cfg = LAY[VIEW] = LAY[VIEW] || {}; cfg.free = cfg.free || {}; ok.forEach(i => { cfg.free[i.k] = { x: i.x, y: i.y, w: i.w }; });
  freeApply(); freeSalvar(); toast('Painéis compactados.');
}
document.addEventListener('click', e => { if (e.target.closest('[data-fcomp]')) freeCompactar(); });

// controles dentro de cartões que são links: não navegar ao clicar neles
document.addEventListener('click', e => { if (e.target.closest('.lb > .pctl, .lb > .lrz')) e.preventDefault(); }, true);
// cartões que são links não podem iniciar o "arrastar link" do navegador
document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('.lay.free .lb')) e.preventDefault(); }, true);

/* ---------- barras vitrificadas: preenchimento translúcido em degradê + contorno nítido na cor da série ---------- */
const VID_SEL = '.hb2-t > i, .dvb, .sc2-s > i, .hrbar, .pftr > i';
function vidrificar(root) {   // estilo Google: barra chapada, cantos retos
  (root || document).querySelectorAll(VID_SEL).forEach(el => { if (el.dataset.vid) return; el.style.boxShadow = 'none'; el.style.borderRadius = '2px'; el.dataset.vid = 1; });
}
document.addEventListener('click', () => setTimeout(() => { try { vidrificar($('#main')); const m = document.querySelector('.pmax'); if (m) vidrificar(m); } catch (e) { } }, 30));

