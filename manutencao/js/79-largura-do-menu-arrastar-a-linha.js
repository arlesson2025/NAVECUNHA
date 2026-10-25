/* ===== Largura do menu: arrastar a linha entre o menu e a tela (pedido do Supervisor, 24/10/2026) =====
   Só no computador (no celular o menu é a gaveta). A alça fica presa à janela, em cima da linha (o menu tem rolagem própria e cortaria o que passa da borda).
   Fica salva neste aparelho (localStorage 'smf_side_w'); clique duplo na linha volta ao padrão (256 px). */
'use strict';
const SIDE_RZ = document.createElement('div');
function sideLargura(w) { const a = document.querySelector('.app'), side = document.getElementById('side'); if (!a || !side) return;
  if (innerWidth < 900) { a.style.removeProperty('grid-template-columns'); SIDE_RZ.style.display = 'none'; return; }
  if (w) a.style.setProperty('grid-template-columns', Math.round(w) + 'px minmax(0,1fr)', 'important'); else a.style.removeProperty('grid-template-columns');
  SIDE_RZ.style.display = ''; SIDE_RZ.style.left = (side.getBoundingClientRect().right - 4) + 'px'; }
{ const st = document.createElement('style'); st.textContent = `.side-rz{position:fixed;top:0;bottom:0;width:8px;cursor:col-resize;z-index:95}.side-rz:hover,.side-rz.on{background:linear-gradient(90deg,transparent 3px,#1A73E8 3px,#1A73E8 5px,transparent 5px)}body.rz-arrasta{cursor:col-resize;user-select:none}`; document.head.appendChild(st);
  const ler = () => { try { return +localStorage.getItem('smf_side_w') || 0; } catch (e) { return 0; } }, h = SIDE_RZ;
  h.className = 'side-rz'; h.title = 'Arraste para mudar a largura do menu · clique duplo volta ao padrão'; document.body.appendChild(h);
  sideLargura(ler()); addEventListener('resize', () => sideLargura(ler())); setTimeout(() => sideLargura(ler()), 800);
  h.addEventListener('pointerdown', e => { e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('on'); document.body.classList.add('rz-arrasta');
    const x0 = e.clientX, w0 = document.getElementById('side').getBoundingClientRect().width;
    const mv = ev => sideLargura(Math.max(180, Math.min(460, w0 + ev.clientX - x0)));
    const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.classList.remove('on'); document.body.classList.remove('rz-arrasta');
      try { localStorage.setItem('smf_side_w', Math.round(document.getElementById('side').getBoundingClientRect().width)); } catch (er) { } };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); });
  h.addEventListener('dblclick', () => { try { localStorage.removeItem('smf_side_w'); } catch (e) { } sideLargura(0); }); }
