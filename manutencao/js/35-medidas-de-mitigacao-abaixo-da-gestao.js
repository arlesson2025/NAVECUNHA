/* ===== Medidas de mitigação (abaixo da gestão de riscos) ===== */
document.addEventListener('click', e => { const p = e.target.closest('[data-falper]'); if (!p || VIEW !== 'kpi') return; FALPER = +p.dataset.falper; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.mg h2{margin:0}

`; document.head.appendChild(st); }

