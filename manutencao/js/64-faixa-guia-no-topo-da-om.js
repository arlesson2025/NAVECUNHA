/* ===== Faixa-guia no topo da OM (pedido do Supervisor, 22/10/2026: "olho pra tela e fico sem rumo") =====
   Tipo em destaque (PREVENTIVA / CORRETIVA), linha de etapas até o Sankhya, AGORA (uma frase + um botão) e o que FALTA para aprovar (gateIIA/gateIIB). */
'use strict';

document.addEventListener('click', e => { const b = e.target.closest('[data-guia]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const d = b.dataset.guia;
  if (d === 'sankhya') { location.hash = '#omconf'; return; }
  if (d === 'lancar') { location.hash = '#omg/' + encodeURIComponent(b.dataset.gg); return; }
  const alvo = document.querySelector('#main #btnAprovar:not([disabled]), #main [data-rgact="aprovar"]:not([disabled])') && /Conferir/.test(b.textContent) ? document.querySelector('#main #btnAprovar, #main [data-rgact="aprovar"]')
    : document.querySelector('#main #omGate') || document.querySelectorAll('#main .card')[1];
  if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, true);
{ const st = document.createElement('style'); st.textContent = `



`; document.head.appendChild(st); }
