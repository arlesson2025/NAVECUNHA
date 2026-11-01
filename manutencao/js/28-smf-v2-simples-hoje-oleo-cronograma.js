/* ===== SMF v2 · simples: Hoje · Óleo · Cronograma · OMs ===== */
'use strict';
/* ---------- Cronograma no formato do modelo: Sistema · Equipamento · Item · Checklist · Frequência + situação no empurrador ---------- */
const CRV = { v: '', so: false };
   // planejado × realizado (auditoria) continua disponível

/* ---------- OMs: abertas e encerradas, numa lista ---------- */

/* ---------- menu: só 4 itens ---------- */
{ ICO.hoje = ICO.hoje || ICO.inicio; ICO.omsv2 = ICO.oms || ICO.exec;
  SECOES.splice(0, SECOES.length,
    { id: 'hoje', nome: 'Hoje', views: [['rotina', 'Rotina do dia']], extra: ['barco'] },
    { id: 'omsv2', nome: 'Ordens de manutenção - O.M (Sankhya)', views: [['oms', 'Abertas e encerradas']], extra: ['emitir', 'omg', 'om', 'acomp', 'prev', 'corr', 'hist'] },
    { id: 'oleo', nome: 'Óleo', views: [['oleo', 'Óleo da frota'], ['lubreg', 'Trocas lançadas']] },
    { id: 'crono', nome: 'Cronograma', views: [['crono', 'Cronograma do empurrador'], ['audit', 'Planejado × realizado'], ['rel', 'Relatório do mês']], extra: ['cxr'] },
    { id: 'graf', nome: 'Indicadores', views: [['kpi', 'Indicadores e riscos'], ['controle', 'Vencimentos, calibração, análise de óleo e docagem']], extra: ['falhas', 'geral'] },
    { id: 'apoio2', nome: 'Biblioteca', views: [['bib', 'Biblioteca'], ['pecas', 'Sobressalentes críticos'], ['terc', 'Prestadores de serviço'], ['trein', 'Treinamentos']], cfg: true },
    { id: 'adm', nome: 'Administração', views: [['admin', 'Administração'], ['hor', 'Horímetros'], ['matriz', 'Anexo I'], ['frota', 'Vencimentos (detalhe)']], cfg: true });
  ICO.apoio2 = ICO.bib || ICO.apoio || ICO.ref;
  ICO.graf = ICO.ger || ICO.anal || ICO.cond;
}
['crono', 'oms', 'oleo', 'rotina', 'audit'].forEach(k => { const i = LAY_VIEWS.indexOf(k); if (i >= 0) LAY_VIEWS.splice(i, 1); });
{ const st = document.createElement('style'); st.textContent = `
 
 

 
 @media print{@page{size:A4 landscape;margin:8mm}#nav,.side,aside,.vh button,.banner{display:none!important}}`; document.head.appendChild(st); }

