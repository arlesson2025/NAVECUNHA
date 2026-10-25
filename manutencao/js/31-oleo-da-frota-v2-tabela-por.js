/* ===== Óleo da frota v2: tabela por empurrador (horímetro atual, última e próxima troca, falta) + gráfico atraso × restante ===== */
'use strict';






{ const st = document.createElement('style'); st.textContent = `.o2-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 14px}.o2-top h1{margin:0 8px 0 0}.o2-pl{border:1px solid #DADCE0;border-radius:20px;padding:5px 14px;background:#fff;font-size:15px}.o2-pl b{font-size:17px;margin-right:3px}.o2-pl.venc b{color:#C5221F}.o2-pl.aten b{color:#E37400}.o2-pl.ok b{color:#1E8E3E}
 .o2-wrap{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(300px,1fr);gap:16px;align-items:start}@media(max-width:1100px){.o2-wrap{grid-template-columns:1fr}}
 .o2-t{width:100%;border-collapse:collapse;font-size:14px}.o2-t th{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:#5F6368;padding:7px 8px;text-align:left;border-bottom:1px solid #E8EAED}.o2-t th.num,.o2-t td.num{text-align:right;font-variant-numeric:tabular-nums}.o2-t th.o2-gu{background:#F4F6F9;text-align:center}.o2-t th.o2-gp{background:#E8F0FE;color:#1967D2;text-align:center}
 .o2-t td{padding:6px 8px;border-bottom:1px solid #F1F3F4}.o2-e{cursor:pointer}.o2-e:hover td{background:#F8FAFD}.o2-n{white-space:nowrap;vertical-align:top}.o2-nb{background:#F4F8FE;border-left:4px solid #1967D2;cursor:pointer}.o2-nb div{margin-top:6px}.o2-tg{color:#5F6368;font-size:11px}
 .o2-v.fech{cursor:pointer}.o2-v.fech:hover td{background:#F8FAFD}.o2-px{color:#5F6368;margin-left:6px}.o2-px b{color:#202124}
 .o2-f{text-align:right;font-weight:700;white-space:nowrap}.o2-f.venc,.nx.venc{color:#C5221F}.o2-f.aten,.nx.aten{color:#B06000}.o2-f.ok{color:#1E8E3E}.o2-f.sem{color:#5F6368}.nx.venc{font-weight:700}
 .o2-bd{display:inline-block;border-radius:10px;padding:1px 9px;font-size:12px;font-weight:700}.o2-bd.venc{background:#D93025;color:#fff}.o2-bd.aten{background:#FEF3E0;color:#B06000}.o2-bd.ok{background:#E6F4EA;color:#1E7A3A}
 .o2-sg{display:flex;background:#F1F3F4;border-radius:10px;padding:4px;gap:4px;margin-bottom:14px}.o2-sg>*{flex:1;border:0;background:transparent;border-radius:8px;padding:8px 10px;font:inherit;font-size:14px;color:#3C4043;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px}.o2-sg>.on{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.15);color:#202124;font-weight:600}.o2-sg>*{white-space:nowrap}.o2-sg select{border:0;background:transparent;font:inherit;font-weight:600;width:auto;padding:0}
 .o2-ph{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-bottom:6px}.o2-ph b{font-size:18px}
 .o2-bars{display:flex;flex-direction:column;gap:8px}.o2-br{display:grid;grid-template-columns:minmax(90px,1.1fr) 1fr 2px 1fr 70px;align-items:center;gap:0;cursor:pointer;font-size:13.5px}.o2-br:hover{background:#F8FAFD}.o2-bn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;font-weight:600}
 .o2-bl{display:flex;justify-content:flex-end;height:14px}.o2-bl i{display:block;height:14px;background:#D93025;border-radius:3px 0 0 3px}.o2-bz{height:22px;background:#9AA0A6}.o2-bri{height:14px}.o2-bri i{display:block;height:14px;border-radius:0 3px 3px 0}.o2-br b{text-align:right;white-space:nowrap}
 .o2-ax{display:grid;grid-template-columns:minmax(90px,1.1fr) 1fr 2px 1fr 70px;font-size:11px;color:#5F6368;margin-top:2px}.o2-ax span:nth-child(2){text-align:left}.o2-ax em{font-style:normal}`; document.head.appendChild(st); }

