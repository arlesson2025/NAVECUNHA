/* ===== Plano preventivo no padrão das telas (pedido do Supervisor, 22/10/2026) =====
   Cronograma preventivo: linha de explicação, Resumo (os números do prKpis) numa janela, "Empurrador" no lugar de "Embarcação"; o gráfico "Carga e execução por mês" sai daqui e vai para Indicadores.
   Anexo I: sai o quadro de contagens antigo (o Resumo do padTela explica 164 = 157 no cronograma + 7 fora), filtros, legenda e lista numa janela só "Itens do plano", só "Imprimir" no topo (PDF completo no ⋯). */
'use strict';
function kpiCronoCard() { try { const ms = PRV.ms; PRV.ms = null; const T = prFrotaV2(hoje().getFullYear()); PRV.ms = ms;
    return `<div class="card"><h2>Cronograma preventivo · carga e execução por mês · frota ${hoje().getFullYear()}</h2>${prGrafico(T.F, T.hm, T.sel)}</div>`; } catch (e) { return ''; } }
{ const st = document.createElement('style'); st.textContent = `.pt-mais{position:relative;display:inline-block}.pt-mais>summary{list-style:none;cursor:pointer}.pt-mais>summary::-webkit-details-marker{display:none}.pt-mais>div{position:absolute;right:0;top:calc(100% + 4px);background:#fff;border:1px solid #DADCE0;border-radius:8px;padding:6px;box-shadow:0 4px 14px rgba(0,0,0,.12);z-index:30;white-space:nowrap}`; document.head.appendChild(st); }
