/* ===== Gestão de riscos & alertas críticos (abaixo dos indicadores) ===== */
let RK_F = 'todas';


document.addEventListener('click', e => { const b = e.target.closest('[data-rkf]'); if (!b) return; RK_F = b.dataset.rkf; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.rk h2{margin:0;font-size:16px}

















`; document.head.appendChild(st); }

