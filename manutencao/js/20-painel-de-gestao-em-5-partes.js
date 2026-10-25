/* =====================================================================
   PAINEL DE GESTÃO EM 5 PARTES NUMERADAS (mesma sequência do relatório mensal)
   1 Indicadores · 2 Riscos & alertas críticos · 3 Resumo do mês · 4 Praça de máquinas · 5 Docagem
   ===================================================================== */
'use strict';

/* ---------- 2 · matriz de risco ---------- */

/* ---------- 3 · resumo do mês ---------- */

/* ---------- 4 · praça de máquinas ---------- */

/* ---------- montagem ---------- */
VX.geral = vGeral;
// docagem: o clique nos empurradores do cronograma também vale no painel
document.addEventListener('click', e => { if (VIEW !== 'geral') return; const s = e.target.closest('[data-dsel],[data-dnova],[data-dlim],[data-ded]'); if (!s) return; e.stopPropagation();
  if (s.dataset.dsel) { DSEL = s.dataset.dsel; render(); } else if (s.dataset.dnova) docaReg(s.dataset.dnova); else if (s.dataset.dlim) docaModal(s.dataset.dlim); else docaReg(DSEL, s.dataset.ded); }, true);
// layout do painel: em ordem (sem misturar as partes) e começa organizado uma vez
PAG1.add('geral');
kvGet('layout').then(v => { if (v && !v._pn5) { delete v.geral; v._pn5 = 1; LAY = v; kvSet('layout', v); } }).catch(() => { });

/* ---------- menu em ordem de trabalho (PDCA) ---------- */
{ const by = id => SECOES.find(s => s.id === id), novo = [];
  const set = (id, nome, cfg) => { const s = by(id); if (!s) return; s.nome = nome; if (cfg !== undefined) s.cfg = cfg; novo.push(s); };
  set('inicio', '1 · Painel de gestão'); set('plan', '2 · Planejar'); set('exec', '3 · Executar'); set('cond', '4 · Verificar · condição da frota'); set('anal', '5 · Analisar e agir');
  set('apoio', 'Apoio técnico', true); set('adm', 'Administração', true);
  SECOES.filter(s => !novo.includes(s)).forEach(s => novo.push(s));
  SECOES.splice(0, SECOES.length, ...novo);
  const c = by('cond'); if (c && c.views[0]) c.views[0][1] = 'Condição da frota (detalhada)';
  const p = by('inicio'); if (p && p.views[0]) p.views[0][1] = 'Painel de gestão'; }

/* ===== Relatório mensal na mesma sequência do Painel: 1 Indicadores · 2 Riscos · 3 Resumo do mês · 4 Praça de máquinas · 5 Docagem · 6 Plano de ação · 7 Evidências · anexos ===== */
'use strict';
/* =====================================================================
   Gráficos novos: troca de óleo em barras horizontais por empurrador, calibração do MCP
   em quadro (em dia / atenção / vencidos + detalhe do motor + mapa da frota) e gráficos
   do relatório mais limpos.
   ===================================================================== */
'use strict';


/* ---------- 4.1 troca de óleo: barras horizontais (uma por sistema, por empurrador) ---------- */

/* ---------- 4.2 calibração do MCP: quadro + motor + mapa da frota ---------- */

/* ---------- gráficos do relatório: mais limpos ---------- */



