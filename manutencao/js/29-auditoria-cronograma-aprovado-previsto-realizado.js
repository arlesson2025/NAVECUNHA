/* ===== Auditoria: cronograma aprovado · previsto × realizado (mês e ano) · histórico · evidências ===== */
'use strict';








{ const s = SECOES.find(x => x.id === 'crono'); if (s) { s.views = [['crono', 'Cronograma do empurrador'], ['audit', 'Auditoria'], ['cxr', 'Planejado × realizado (detalhe)'], ['rel', 'Relatório do mês']]; s.extra = []; }
   }
{ const st = document.createElement('style'); st.textContent = `.au-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:0 0 14px}.au-k>div{background:#fff;border:1px solid var(--line,#DADCE0);border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;gap:2px}.au-k span{font-size:12px;font-weight:700;color:#5F6368;text-transform:uppercase;letter-spacing:.03em}.au-k b{font-size:28px}.au-k small{color:#5F6368}
 .au-bars{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:6px;align-items:end;padding:6px 0}.au-b{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;border-radius:8px;padding:4px 0}.au-b.sel{background:#E8F0FE}.au-b:hover{background:#F1F3F4}
 .au-bb{height:124px;display:flex;align-items:flex-end;gap:3px}.au-bb i,.au-lg i{display:inline-block;width:14px;border-radius:3px 3px 0 0}.au-bb i.p,.au-lg i.p{background:#C6D4EA}.au-bb i.r,.au-lg i.r{background:#188038}.au-bb i.r.l,.au-lg i.r.l{background:#E37400}.au-lg{font-size:12.5px;color:#3C4043}.au-lg i{height:10px;margin:0 4px 0 10px;border-radius:2px}.au-rs{display:flex;flex-direction:column-reverse;width:14px;border-radius:3px 3px 0 0;overflow:hidden}.au-rs .au-o{flex:1;background:#188038;width:14px}.au-rs .au-l{background:#E37400;width:14px;display:block}.au-b b{font-size:12px}.au-b small{font-size:11px;color:#5F6368}`; document.head.appendChild(st); }

