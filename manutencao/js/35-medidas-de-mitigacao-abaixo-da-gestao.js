/* ===== Medidas de mitigação (abaixo da gestão de riscos) ===== */
document.addEventListener('click', e => { const p = e.target.closest('[data-falper]'); if (!p || VIEW !== 'kpi') return; FALPER = +p.dataset.falper; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.mg h2{margin:0}.mg-sub{margin:2px 0 10px;color:#334155;font-size:13.5px}
.mg-t{width:100%;border-collapse:collapse;font-size:13px}.mg-t th{background:#F8FAFC;text-align:left;font-weight:600;color:#0F172A;padding:9px 10px;border-bottom:1px solid #E3E8EF;white-space:nowrap}
.mg-t td{color:#334155;padding:9px 10px;border-bottom:1px solid #E3E8EF;vertical-align:top}.mg-t td b{font-weight:600;color:#0F172A;white-space:nowrap}
.mg-st{font-size:10.5px;font-weight:700;border-radius:4px;padding:2px 8px;letter-spacing:.03em;white-space:nowrap}
.mg-st.ok{color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0}.mg-st.and{color:#D97706;background:#FFFBEB;border:1px solid #FDE68A}.mg-st.bad{color:#DC2626;background:#FEF2F2;border:1px solid #FECACA}.mg-st.nd{color:#64748B;background:#F1F5F9;border:1px solid #E2E8F0}
`; document.head.appendChild(st); }

