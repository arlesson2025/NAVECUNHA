/* ===== Busca única: campo no topo do menu (e 🔍 na barra do celular) que procura em empurradores, OMs, itens do Anexo I e Biblioteca =====
   Todas as palavras precisam aparecer (sem diferença de acento ou maiúscula). Atalho "/" foca o campo. O Operador não vê a busca. */
'use strict';
const BQ_NORM = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const BQ_ST = { emitida: 'emitida', aberta: 'aberta', execucao: 'em execução', encerrada: 'encerrada' };
function bqResultados(q) {
  let qn = BQ_NORM(q).replace(/\s+/g, ' ').trim(); if (!qn) return [];
  // nome de empurrador escrito inteiro vira filtro exato ("cja i" não traz CJA II, CJA III…)
  const F = S.cfg.frota || [], exV = F.filter(v => new RegExp(`(^| )${BQ_NORM(v.nome).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(qn)).sort((a, z) => z.nome.length - a.nome.length)[0];
  if (exV) qn = qn.replace(BQ_NORM(exV.nome), ' ').replace(/\s+/g, ' ').trim();
  const T = qn.split(' ').filter(Boolean);
  const ok = (...c) => { const s = BQ_NORM(c.join(' ')); return T.every(t => s.includes(t)); };
  const G = [];
  const emp = (exV ? (T.length ? [] : [exV]) : F.filter(v => ok(v.nome, v.id, Object.values(v.mcpMod || {}).join(' '), Object.values(v.mcaMod || {}).join(' '))))
    .map(v => ({ t: v.nome, s: typeof foraOp === 'function' && foraOp(v) ? 'fora de operação' : 'abrir o cartão do empurrador', go: '#barco/' + encodeURIComponent(v.id) }));
  if (emp.length) G.push(['Empurradores', emp]);
  const om = recs('om').filter(o => (!exV || o.vessel === exV.id) && ok(o.num, o.rnc, o.descricao, o.equip, o.sistema, o.classe, exV ? '' : vName(o.vessel), o.pos, (o.items || []).join(' '), o.tipo === 'C' ? 'corretiva' : 'preventiva'))
    .sort((a, z) => (z.updatedAt || 0) - (a.updatedAt || 0))
    .map(o => ({ t: `OM ${o.num || '—'} · ${vName(o.vessel)}`, s: [o.tipo === 'C' ? 'Corretiva' + (o.classe ? ' ' + o.classe : '') : 'Preventiva', BQ_ST[o.status] || o.status, o.descricao || o.equip || ''].filter(Boolean).join(' · '), go: '#om/' + encodeURIComponent(o.id) }));
  if (om.length) G.push(['Ordens de manutenção', om]);
  if (exV && !T.length) return G;   // só o nome do empurrador: o cartão e as OMs dele
  const it = A1.filter(a => ok(a.id, a.eq, a.eqn, a.item, a.chk, a.freq)).sort((a, z) => (z.id === qn) - (a.id === qn)).map(a => ({ t: `${a.id} · ${a.item}`, s: `${a.eq} · ${a.chk || ''} · ${a.freq || ''}`, mx: a.id }));
  if (it.length) G.push(['Itens do Anexo I', it]);
  const bib = recs('doc').map(r => ({ t: r.titulo, d: [r.desc, r.equip, r.tags].join(' ') })).concat((typeof BIB_FIXOS !== 'undefined' ? BIB_FIXOS : []).filter(r => !r.sug).map(r => ({ t: r.titulo, d: r.desc })))
    .filter(r => ok(r.t, r.d)).map(r => ({ t: r.t, s: r.d && r.d.trim() ? r.d : 'Biblioteca', bb: q }));
  if (bib.length) G.push(['Biblioteca', bib]);
  return G;
}
function bqPainel() {
  const inp = $('#bqI'), p = $('#bqP'); if (!inp || !p) return;
  const q = inp.value.trim(); if (!q) { p.hidden = true; p.innerHTML = ''; return; }
  const G = bqResultados(q), MAX = 6; let i = 0;
  p.innerHTML = G.length ? G.map(([g, L]) => `<div class="bq-g">${esc(g)} <span>${L.length}</span></div>` + L.slice(0, MAX).map(r => `<button type="button" class="bq-r" data-bqi="${i++}"${r.go ? ` data-bqgo="${esc(r.go)}"` : ''}${r.mx ? ` data-bqmx="${esc(r.mx)}"` : ''}${r.bb != null ? ` data-bqbb="${esc(r.bb)}"` : ''}><b>${esc(r.t)}</b><small>${esc(r.s)}</small></button>`).join('') + (L.length > MAX ? `<div class="bq-mais">+ ${L.length - MAX} — refine a busca</div>` : '')).join('')
    : `<div class="bq-vz">Nada encontrado para “${esc(q)}”.</div>`;
  p.hidden = false; bqPos();
}
function bqPos() { const inp = $('#bqI'), p = $('#bqP'); if (!inp || !p || p.hidden) return;
  // celular: dentro do menu, abaixo do campo · computador: no body, à direita do menu (o .side tem empilhamento próprio e ficaria atrás dos cartões)
  if (matchMedia('(max-width:760px)').matches) { if (p.parentNode !== $('#bqW')) $('#bqW').appendChild(p); p.style.cssText = ''; return; }
  if (p.parentNode !== document.body) document.body.appendChild(p);
  const r = inp.getBoundingClientRect(); p.style.cssText = `position:fixed;left:${Math.round(r.right + 10)}px;top:${Math.round(r.top)}px;width:460px;max-height:${Math.round(innerHeight - r.top - 16)}px`; }
function bqFechar(limpa) { const p = $('#bqP'), inp = $('#bqI'); if (p) { p.hidden = true; } if (limpa && inp) inp.value = ''; }
function bqIr(b) {
  bqFechar(true); document.body.classList.remove('menu');
  if (b.dataset.bqmx) { MX.q = b.dataset.bqmx; if (location.hash === '#matriz') render(); else location.hash = '#matriz'; return; }
  if (b.dataset.bqbb != null) { BB.q = b.dataset.bqbb; if (location.hash === '#apoio') render(); else location.hash = '#apoio'; return; }
  if (b.dataset.bqgo) location.hash = b.dataset.bqgo;
}
{ const nav = document.getElementById('nav');
  const w = document.createElement('div'); w.className = 'bq'; w.id = 'bqW';
  w.innerHTML = `<input id="bqI" type="search" placeholder="Buscar empurrador, OM, item, documento…" autocomplete="off" aria-label="Busca" title="Atalho: /"><div id="bqP" class="bq-p" hidden></div>`;
  nav.parentNode.insertBefore(w, nav);
  const mt = document.querySelector('.mtop'), mn = document.getElementById('mnu');
  if (mt && mn) { const b = document.createElement('button'); b.id = 'bqM'; b.type = 'button'; b.setAttribute('aria-label', 'Buscar'); b.textContent = '🔍'; mt.appendChild(b);
    b.onclick = e => { e.stopPropagation(); /* sem o stop, o clique global fecha o menu (clique fora do #side) */ document.body.classList.add('menu'); setTimeout(() => $('#bqI').focus(), 220); }; }
  const inp = $('#bqI'), p = $('#bqP'); let tm = 0;
  inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(bqPainel, 120); });
  inp.addEventListener('focus', () => { if (inp.value.trim()) bqPainel(); });
  inp.addEventListener('keydown', e => {
    const bs = [...p.querySelectorAll('.bq-r')], at = p.querySelector('.bq-r.on'), k = bs.indexOf(at);
    if (e.key === 'Escape') { bqFechar(true); inp.blur(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!bs.length) return; const n = bs[(k + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length] || bs[0]; if (at) at.classList.remove('on'); n.classList.add('on'); n.scrollIntoView({ block: 'nearest' }); return; }
    if (e.key === 'Enter') { e.preventDefault(); const b = at || bs[0]; if (b) bqIr(b); } });
  p.addEventListener('mousedown', e => e.preventDefault());   // não tirar o foco do campo antes do clique
  p.addEventListener('click', e => { const b = e.target.closest('.bq-r'); if (b) bqIr(b); });
  document.addEventListener('click', e => { if (!e.target.closest('#bqW,#bqP')) bqFechar(false); });
  addEventListener('resize', bqPos);
  document.addEventListener('keydown', e => { if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target; if (t.closest && t.closest('input,textarea,select,[contenteditable="true"]')) return; if (ehOperador() || !S.session) return; e.preventDefault(); inp.focus(); inp.select(); });
  const st = document.createElement('style'); st.textContent = `.bq{position:relative;padding:0 2px}
#bqI{width:100%;box-sizing:border-box;font:inherit;font-size:13px;padding:8px 10px;border:1px solid #DADCE0;border-radius:8px;background:#F8F9FA;color:#202124}
#bqI:focus{outline:none;border-color:#1967D2;background:#fff;box-shadow:0 0 0 2px rgba(25,103,210,.15)}
.bq-p{z-index:2000;background:#fff;border:1px solid #DADCE0;border-radius:10px;box-shadow:0 8px 24px rgba(60,64,67,.18);overflow-y:auto;padding:6px 0;color:#202124}
.bq-g{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#5F6368;padding:8px 14px 4px}.bq-g span{font-weight:400}
.bq-r{display:block;width:100%;text-align:left;border:0;background:none;font:inherit;padding:6px 14px;cursor:pointer;color:inherit}
.bq-r:hover,.bq-r.on{background:#E8F0FE}.bq-r b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bq-r small{display:block;font-size:11.5px;color:#5F6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bq-mais,.bq-vz{font-size:12px;color:#5F6368;padding:4px 14px 6px}
#bqM{background:none;border:0;font-size:18px;padding:2px 4px;cursor:pointer;color:inherit}
body.perfil-opr .bq,body.perfil-opr #bqM,body.perfil-opr #bqP,html.gated #bqP{display:none}
@media (max-width:760px){.bq-p{position:static;margin-top:6px;max-height:60vh}}`;
  document.head.appendChild(st); }
