/* ===== Vencimentos: lista da frota (esquerda) + detalhe da embarcação ou da frota toda (direita) ===== */
let FS_SEL = 'frota';
document.addEventListener('click', e => { if (VIEW !== 'rotina') return; const r = e.target.closest('[data-fsel]'); if (!r) return; e.stopPropagation(); FS_SEL = r.dataset.fsel; render(); }, true);
{ const st = document.createElement('style'); st.textContent = `
.card.fs-card{padding:0;overflow:hidden}









.fs-p{font-size:12px;font-weight:600;border-radius:999px;padding:4px 12px}.fs-p.a{background:#FDF0C8;color:#8A5A00}.fs-p.v{background:#FCE8E6;color:#B3261E}.fs-p.o{background:#E6F4EA;color:#137333}









`; document.head.appendChild(st); }

