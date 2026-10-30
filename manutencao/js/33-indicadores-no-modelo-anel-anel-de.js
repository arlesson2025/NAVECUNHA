/* ===== Indicadores no modelo "anel": anel de progresso até a meta, nome, fórmula curta e periodicidade ===== */
{ const st = document.createElement('style'); st.textContent = `
.kgrid:has(> .kr){grid-template-columns:repeat(auto-fill,minmax(300px,1fr))!important;gap:14px}
.card.kr,.lb>.card.kr{display:flex!important;flex-direction:row!important;align-items:center!important;gap:16px;padding:26px 18px 16px;border:1px solid #E3E8EF;border-radius:14px;background:#fff;box-shadow:none;min-height:0}
.kr-a{position:relative;width:84px;height:84px;flex:none}.kr-a svg{display:block}
.kr-a b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0F172A;letter-spacing:-.01em}
.kr-b{min-width:0}.kr-b h3{margin:0 0 4px;font-size:15px;font-weight:700;color:#0F172A}
.kr-b p{margin:0 0 8px;font-size:12px;line-height:1.4;color:#64748B}
.kr-tags{display:flex;gap:6px;flex-wrap:wrap}
.kr-t{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#0F766E;border:1px solid #D7E3EA;border-radius:4px;padding:2px 7px;background:#fff}
.kr-t.mt{color:#475569}.kr-t.ok{color:#15803D;border-color:#BBF7D0;background:#F0FDF4}.kr-t.bad{color:#B91C1C;border-color:#FECACA;background:#FEF2F2}.kr-t.sem{color:#94A3B8}
`; document.head.appendChild(st); }

