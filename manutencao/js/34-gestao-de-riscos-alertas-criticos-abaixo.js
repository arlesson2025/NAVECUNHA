/* ===== Gestão de riscos & alertas críticos (abaixo dos indicadores) ===== */
let RK_F = 'todas';


document.addEventListener('click', e => { const b = e.target.closest('[data-rkf]'); if (!b) return; RK_F = b.dataset.rkf; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.rk h2{margin:0;font-size:16px}.rk-sec .seg{margin:0}.rk-sec{align-items:center!important;flex-wrap:wrap}.card.rk .rk-h{margin-bottom:6px;padding-right:62px}


.rk-h b{font-size:15px;font-weight:700;color:#0F172A}
.rk-h{display:flex;justify-content:space-between;align-items:center;gap:8px}
.rk-big{display:flex;align-items:baseline;gap:12px;margin:8px 0 12px}.rk-big span{font-size:46px;font-weight:800;line-height:1}.rk-big em{font-style:normal;color:#64748B;font-size:13px}
.rk-emp{display:flex;align-items:flex-start;gap:12px;padding:9px 12px;margin:0 0 8px;border:1px solid #FECACA;background:#FEF2F2;border-radius:8px;text-decoration:none;color:#0F172A}.rk-emp b{font-size:14px;min-width:84px}.rk-emp span{flex:1;font-size:13px;color:#7F1D1D}.rk-emp i{font-style:normal;color:#DC2626;font-size:18px;line-height:1}.rk-emp:hover{background:#FEE2E2}
.rk-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}.rk-2 div{border:1px solid #E3E8EF;background:#F8FAFC;border-radius:8px;padding:12px}
.rk-2 b{display:block;font-size:19px;font-weight:700;color:#0F766E}.rk-2 small{color:#64748B;font-size:11.5px}

.rk-al{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #E3E8EF;font-size:13.5px;color:#0F172A}
.rk-pp{font-size:10.5px;font-weight:700;border-radius:4px;padding:2px 8px;flex:none}.rk-pp.p2{color:#D97706;background:#FFFBEB;border:1px solid #FDE68A}
.rk-bd{font-size:10.5px;font-weight:700;border-radius:4px;padding:2px 8px;letter-spacing:.03em}
.rk-bd.alto{color:#DC2626;background:#FEF2F2;border:1px solid #FECACA}.rk-bd.medio{color:#D97706;background:#FFFBEB;border:1px solid #FDE68A}.rk-bd.baixo{color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0}
.rk-f{display:flex;gap:8px;margin:10px 0 12px}.rk-f button{font:inherit;font-size:12.5px;font-weight:600;border:1px solid #E3E8EF;background:#fff;border-radius:6px;padding:6px 14px;cursor:pointer}
.rk-f button.on{background:#ECFDF5;border-color:#5EEAD4;color:#0F766E}
.rk-t{width:100%;border-collapse:collapse;font-size:13.5px}.rk-t th{background:#F8FAFC;text-align:left;font-weight:600;color:#0F172A;padding:9px 10px;border-bottom:1px solid #E3E8EF}
.rk-t td{color:#0F172A;padding:9px 10px;border-bottom:1px solid #E3E8EF;white-space:nowrap}.rk-t td b{font-weight:600}
`; document.head.appendChild(st); }

