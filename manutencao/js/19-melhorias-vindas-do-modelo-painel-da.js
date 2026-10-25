/* =====================================================================
   Melhorias vindas do modelo "Painel da Frota":
   1) Alertas priorizados P1 / P2 no topo do Painel (reunião da manhã)
   2) KPIs Registro fotográfico e Plano preditivo na faixa de indicadores (no código do painel)
   3) Previsto × Realizado por embarcação no mês (OMs preventivas)
   4) Docagem: parada média em estaleiro e pontualidade de entrada
   ===================================================================== */
'use strict';
/* ---------- 1) alertas ---------- */

/* ---------- 3) previsto × realizado ---------- */
   // 0 = mês atual, 1 = anterior…

/* ---------- painel: alertas logo depois do cabeçalho; previsto × realizado depois dos indicadores ---------- */

/* ---------- 4) docagem: parada média e pontualidade ---------- */
function docaStats() { const H = S.cfg.frota.flatMap(v => docaHist(v)); const par = H.filter(x => x.parada != null).map(x => x.parada), pont = H.filter(x => x.atraso != null);
  return { parada: par.length ? par.reduce((a, b) => a + b, 0) / par.length : null, nPar: par.length, pont: pont.length ? pont.filter(x => x.atraso <= 0).length / pont.length * 100 : null, nPont: pont.length, okPont: pont.filter(x => x.atraso <= 0).length }; }

