/* ===== Auditoria: cronograma aprovado · previsto × realizado (mês e ano) · histórico · evidências ===== */
'use strict';
{ const s = SECOES.find(x => x.id === 'crono'); if (s) { s.views = [['crono', 'Cronograma do empurrador'], ['audit', 'Auditoria'], ['cxr', 'Planejado × realizado (detalhe)'], ['rel', 'Relatório do mês']]; s.extra = []; }
   }
{ const st = document.createElement('style'); st.textContent = `
 
 `; document.head.appendChild(st); }

