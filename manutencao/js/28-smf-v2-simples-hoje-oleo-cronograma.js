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
{ const st = document.createElement('style'); st.textContent = `.cv-tit{font-weight:700;font-size:15px;margin:0 0 8px}.cv-t{width:100%;border-collapse:collapse;font-size:12.5px;table-layout:fixed;font-family:Arial,Helvetica,sans-serif;color:#000}
 .cv-t th{position:sticky;top:0;background:#fff;color:#000;text-align:center;padding:5px 4px;font-weight:700;border:1px solid #000;z-index:1}.cv-t td{padding:3px 5px;border:1px solid #9AA0A6;vertical-align:middle}
 .cv-t td.cv-ms,.cv-t td.cv-me{font-weight:700;background:#fff;border:1px solid #000;vertical-align:top;text-align:left;padding-top:8px}.cv-n{text-align:center}.cv-i{font-weight:400}.cv-f{text-align:center}.cv-d{white-space:nowrap;font-size:11.5px;color:#3C4043}
.cv-s{display:inline-block;margin:1px 4px 1px 0;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;white-space:nowrap}.cv-s.venc{background:#FCE8E6;color:#B3261E}.cv-s.viag{background:#FEF3E0;color:#9A5B00}.cv-s.ok{background:#E6F4EA;color:#1E7A3A}.cv-s.sem,.cv-s.cond{background:#F1F3F4;color:#5F6368}
 .cv-card .tw{max-height:72vh;overflow:auto}
 @media print{@page{size:A4 landscape;margin:8mm}#nav,.side,aside,.vh button,.cv-bar a,.cv-bar label,.banner{display:none!important}.cv-card .tw{max-height:none;overflow:visible}.cv-t{font-size:9.5px}.cv-t th{position:static}}`; document.head.appendChild(st); }

