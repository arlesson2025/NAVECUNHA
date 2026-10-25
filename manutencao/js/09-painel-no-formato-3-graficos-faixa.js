/* =====================================================================
   PAINEL NO FORMATO "3 GRÁFICOS · FAIXA DE KPI · 3 GRÁFICOS"
   gráficos limpos (rótulo de valor, grade leve, legenda embaixo) na paleta gelo
   ===================================================================== */
'use strict';
const GC = { az: '26,115,232', az2: '138,180,248', az3: '25,103,210', vm: '217,48,37', lj: '242,153,0', ci: '154,160,166', am: '249,171,0' };
const vid = (c, dir) => `background:rgb(${c})`;
const tickNice = mx => { const p = Math.pow(10, Math.floor(Math.log10(mx || 1))), f = mx / p, s = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10; return s * p; };

// colunas (agrupadas) com rótulo de valor em cima de cada barra
// linhas (uma ou duas séries, cada uma na sua escala) com marcador em losango e valor
// rosca com percentuais por fora e legenda ao lado
// colunas + linha (eixo da direita em %)

/* ---------- dados e montagem do painel ---------- */

/* ---------- todos os gráficos antigos no mesmo formato limpo ---------- */
// linha: losango como marcador, grade leve
// barras horizontais: barra reta e fina com rótulo

