/* ===== SMF simples: Hoje · Óleo · Empurradores · Cronograma · Consultas ===== */
'use strict';
/* ---------- Óleo da frota: bater o olho e ver vencido / vencendo / em dia ---------- */
const OL_ALERTA_H = 50, OL_ALERTA_D = 3;
const eqNomeC = (v, e) => !e ? '' : e.key === 'inc' ? 'Motobomba de incêndio' : e.g === 'mca' && v ? posCurtoE(v, e.pos) : e.nome;
function olStatus(x) { if (x.s.st === 'sem' || x.horas == null) return 'sem'; if (x.horas < 0) return 'venc'; if (x.horas <= OL_ALERTA_H || (x.porData && x.dias != null && x.dias <= OL_ALERTA_D)) return 'aten'; return 'ok'; }

/* ---------- Barco: tudo de um empurrador numa página ---------- */
const BR = { v: '' };


/* ---------- menu simples ---------- */
{ const old = SECOES.slice(), ja = new Set(), todas = [];
  old.forEach(s => s.views.forEach(([k, n]) => { if (!ja.has(k)) { ja.add(k); todas.push([k, n]); } }));
  const principais = new Set(['rotina', 'oleo', 'barco', 'crono', 'cxr', 'admin', 'emitir', 'omg']);
  const nomes = { geral: 'Painel de gestão', acomp: 'OMs em execução', lubreg: 'Trocas de óleo (FR 049_B)', rel: 'Relatório do mês' };
  const cons = todas.filter(([k]) => !principais.has(k)).map(([k, n]) => [k, nomes[k] || n]);
  const extraAll = old.flatMap(s => s.extra || []);
  ICO.hoje = ICO.inicio; ICO.oleo = ICO.lub || ICO.exec; ICO.barcos = ICO.cond || ICO.oms; ICO.crono = ICO.plan; ICO.cons = ICO.apoio || ICO.ref;
  SECOES.splice(0, SECOES.length,
    { id: 'hoje', nome: 'Hoje', views: [['rotina', 'Hoje']] },
    { id: 'oleo', nome: 'Óleo', views: [['oleo', 'Óleo da frota'], ['lubreg', 'Trocas lançadas']] },
    { id: 'barcos', nome: 'Empurradores', views: [['barco', 'Empurrador'], ['emitir', 'Abrir OM']], extra: ['omg', 'om'] },
    { id: 'crono', nome: 'Cronograma', views: [['crono', 'Cronograma'], ['rel', 'Relatório do mês']], extra: ['cxr'] },
    { id: 'cons', nome: 'Consultas', views: cons.filter(([k]) => !['lubreg', 'rel'].includes(k)), extra: extraAll.filter(k => !['omg', 'om', 'cxr'].includes(k)) },
    { id: 'adm', nome: 'Administração', views: [['admin', 'Administração']], cfg: true });
}
{ const st = document.createElement('style'); st.textContent = `
 .ol-t{width:100%;border-collapse:collapse}.ol-t th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#5F6368;padding:8px 6px;border-bottom:2px solid #E8EAED}.ol-t td{padding:8px 6px;border-bottom:1px solid #F1F3F4;vertical-align:middle}
 .ol-v{white-space:nowrap}.ol-v b{font-size:15px}.ol-v small{display:block;color:#5F6368;margin-left:18px}
 
 
 `; document.head.appendChild(st); }
if (!location.hash || location.hash === '#rotina') { try { history.replaceState(null, '', '#rotina'); } catch (e) { } }

