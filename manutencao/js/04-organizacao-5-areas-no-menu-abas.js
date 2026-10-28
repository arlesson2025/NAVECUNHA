/* =====================================================================
   ORGANIZAÇÃO · 5 áreas no menu, abas dentro de cada área e painel de comando
   ===================================================================== */
'use strict';
const ICO = {
  inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  oms: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/>',
  lub: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  cond: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
  ger: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  ref: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  adm: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
};
const SECOES = [
  { id: 'inicio', nome: 'Visão geral', views: [['geral', 'Visão geral']] },
  { id: 'oms', nome: 'Ordens de manutenção', views: [['acomp', 'Em execução'], ['emitir', 'Programação'], ['prev', 'Preventivas · II-B'], ['corr', 'Corretivas · II-A'], ['hist', 'Histórico']], extra: ['om'] },
  { id: 'lub', nome: 'Lubrificação', views: [['lub', 'Controle de trocas'], ['lubreg', 'Registros FR 049_B'], ['lubcons', 'Consumo e OLUC'], ['plano', 'Plano de lubrificação']] },
  { id: 'cond', nome: 'Condição da frota', views: [['frota', 'Vencimentos por empurrador'], ['calib', 'Calibração do MCP'], ['over', 'MBC · MCP'], ['doca', 'Docagem'], ['hor', 'Horímetros'], ['falhas', 'Análise de falhas e ações de bloqueio']] },
  { id: 'ger', nome: 'Indicadores e relatório', views: [['kpi', 'Indicadores de desempenho (KPI) · NP 055'], ['rel', 'Relatório mensal']] },
  { id: 'ref', nome: 'Plano de manutenção · Anexo I', views: [['matriz', 'Plano de manutenção · Anexo I']], cfg: true },
  { id: 'adm', nome: 'Administração', views: [['admin', 'Administração']], cfg: true },
];
const secDe = v => SECOES.find(s => s.views.some(x => x[0] === v) || (s.extra || []).includes(v)) || SECOES[0];
const ULT = {};   // última aba aberta em cada área
const ico = k => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;
function numBadge(k) { const h = badge(k); const m = h.match(/>(\d+)</); return m ? +m[1] : 0; }
function abasHtml() {
  if (typeof enxuto === 'function' && enxuto()) return '';   // modo enxuto: a navegação é o menu em etapas e a faixa do PCM (js/85 e js/87); as abas levavam a telas fora dele
  const s = secDe(VIEW); if (s.views.length < 2) return '';
  const on = VIEW === 'om' ? (omTipo() === 'C' ? 'corr' : 'prev') : VIEW;
  return `<nav class="abas" aria-label="${esc(s.nome)}"><span class="abas-t">${esc(s.nome)}</span>${s.views.map(([k, l]) => `<a href="#${k}" class="${k === on ? 'on' : ''}">${l}${badge(k)}</a>`).join('')}</nav>`;
}

/* ---------- painel de comando ---------- */



