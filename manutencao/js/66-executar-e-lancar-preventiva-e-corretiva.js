/* ===== Executar e lançar: preventiva e corretiva separadas (pedido do Supervisor, 22/10/2026: "onde enxergo o que foi preventiva e corretiva?") =====
   Preventivas em aberto e Corretivas em aberto em blocos próprios, tabelas com cabeçalho, etiqueta PREVENTIVA (verde) / CORRETIVA (vermelha) como na faixa-guia da OM,
   um botão por linha (o formulário para imprimir fica dentro da OM) e Encerradas com filtro. Os botões usam os mesmos data-* do AFTER.oms. */
'use strict';
let OMSF = 'todas';


document.addEventListener('click', e => { const b = e.target.closest('[data-omsf]'); if (!b || VIEW !== 'oms') return; e.preventDefault(); e.stopPropagation(); OMSF = b.dataset.omsf; render(); }, true);
{ const st = document.createElement('style'); st.textContent = `.tp-pv,.tp-cr{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.4px;padding:2px 8px;border-radius:5px;color:#fff;white-space:nowrap}.tp-pv{background:#188038}.tp-cr{background:#C5221F}`; document.head.appendChild(st); }
