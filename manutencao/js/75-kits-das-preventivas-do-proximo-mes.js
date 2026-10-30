/* ===== Kits das preventivas do próximo mês · NP 5.6.1 (lacuna 3 do fluxo NP 055 × SMF, 22/10/2026) =====
   NP 5.6.1: "o estoque cobre os kits das preventivas programadas para o mês seguinte, mais 1 kit de reserva por modelo de motor" (filtros, óleos e correias).
   kitsMes(): por modelo de motor, as trocas de óleo previstas no mês seguinte (o3Dados, proxD de cada equipamento) + as já vencidas, o óleo em litros (capacidade do cárter
   da matriz de lubrificação) e as revisões do cronograma (prLinhas) que levam filtros ou correias. Os códigos dos filtros e correias ficam na Matriz técnica (o SMF não os tem). */
'use strict';
{ const st = document.createElement('style'); st.textContent = `.kt-c{border-left:5px solid #1967D2}`; document.head.appendChild(st); }
