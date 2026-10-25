/* ===== SMF v2 · simples: Hoje · Óleo · Cronograma · OMs ===== */
'use strict';
/* ---------- Cronograma no formato do modelo: Sistema · Equipamento · Item · Checklist · Frequência + situação no empurrador ---------- */
const CRV = { v: '', so: false };
function cvSit(v, pos, t) {
  const s = situacao(v, pos, t), L = ultimoServico(v.id, pos, t.id);
  let k = s.st === 'venc' ? 'venc' : s.st === 'viag' ? 'viag' : s.st === 'ok' ? 'ok' : s.st === 'sem' ? 'sem' : 'cond';
  if (foraJanela(t.id, v, pos) && k === 'viag') k = 'ok';
  return { k, s, L };
}
function vCronoV2() {
  const ativos = S.cfg.frota.filter(v => !foraOp(v)); if (!CRV.v || !ativos.some(v => v.id === CRV.v)) CRV.v = (ativos[0] || {}).id;
  const v = vessel(CRV.v); if (!v) return '<div class="empty">Nenhuma embarcação em operação.</div>';
  const ps = posicoes(v), linhas = [];
  A1.forEach(t => { if (t.kind !== 'prog' || (typeof CRONO_FORA !== 'undefined' && CRONO_FORA.includes(t.id))) return;
    const pp = ps.filter(p => aplica(v, p, t)); if (!pp.length) return;
    const sits = pp.map(p => Object.assign({ pos: p }, cvSit(v, p, t)));
    if (CRV.so && !sits.some(x => x.k === 'venc' || x.k === 'viag')) return;
    linhas.push({ t, sits }); });
  const nm = { venc: 'Vencido', viag: 'Vence na viagem', ok: 'Em dia', sem: 'Sem registro', cond: 'Por condição' };
  const lado = (p) => p === 'UN' ? '' : isMcp(p) ? (mcpPos(v).length > 1 ? p : '') : posCurtoE(v, p).replace(/^MCA\s*/, '');
  const cel = x => `<span class="cv-s ${x.k}" title="${esc(x.s.txt || '')}">${lado(x.pos) ? '<b>' + esc(lado(x.pos)) + '</b> ' : ''}${nm[x.k]}</span>`;
  const ult = x => x.L ? brD(x.L.date).replace(/\/(\d{2})(\d{2})$/, '/$2') + (x.L.h != null ? ' · ' + nf(x.L.h) + ' h' : '') : '—';
  const dc = d => brD(isoD(d)).replace(/\/(\d{2})(\d{2})$/, '/$2'); const prox = x => x.s.alvoH != null ? nf(x.s.alvoH) + ' h' + (x.s.alvoD ? ' · ' + dc(x.s.alvoD) : '') : x.s.alvoD ? dc(x.s.alvoD) : '—';
  // formato da planilha: Sistema e Equipamento mesclados (rowspan), Nº sequencial
  const cnt = k => linhas.reduce((a, l) => a + l.sits.filter(x => x.k === k).length, 0);
  const spS = {}, spE = {}; linhas.forEach(l => { spS[l.t.sis] = (spS[l.t.sis] || 0) + 1; const ke = l.t.sis + '|' + l.t.eqn; spE[ke] = (spE[ke] || 0) + 1; });
  let html = '', sisA = '', eqA = '', n = 0;
  linhas.forEach(l => { const t = l.t, ke = t.sis + '|' + t.eqn; n++;
    let pre = '';
    if (t.sis !== sisA) { sisA = t.sis; eqA = ''; pre += `<td class="cv-ms" rowspan="${spS[t.sis]}">${esc(t.sis)}</td>`; }
    if (ke !== eqA) { eqA = ke; pre += `<td class="cv-me" rowspan="${spE[ke]}">${esc(t.eqn)}</td>`; }
    html += `<tr>${pre}<td class="cv-n" title="${t.id}">${n}</td><td class="cv-i">${esc(t.item)}</td><td>${esc(t.chk)}</td><td class="cv-f">${esc(t.freq || '')}</td><td class="cv-d">${l.sits.map(ult).join('<br>')}</td><td class="cv-d">${l.sits.map(prox).join('<br>')}</td><td>${l.sits.map(cel).join('')}</td></tr>`; });
  const sel = `<select id="cvV" style="font-size:18px;font-weight:600;width:auto;min-width:160px">${ativos.map(a => `<option value="${a.id}"${a.id === v.id ? ' selected' : ''}>${esc(a.nome)}</option>`).join('')}</select>`;
  return `<div class="vh"><div><h1>Item por item · ${esc(v.nome)}</h1><p>O plano de manutenção do empurrador (Anexo I), item por item, com quando foi feito, quando vence e a situação.</p></div><span class="sp"></span><a class="mbtn" href="#cxr">← Cronograma</a><button class="mbtn" data-cvprint>🖨 Imprimir</button></div>
   <div class="card row cv-bar" style="gap:12px;flex-wrap:wrap">${sel}
    <span class="cv-s venc">${cnt('venc')} vencidos</span><span class="cv-s ok">${cnt('ok') + cnt('viag')} em dia</span>${cnt('sem') ? `<span class="cv-s sem">${cnt('sem')} sem registro</span>` : ''}
    <span class="sp"></span><label style="display:flex;align-items:center;gap:6px;font-size:14px"><input type="checkbox" id="cvSo" ${CRV.so ? 'checked' : ''}> só o que está vencendo</label>
    ${cnt('venc') + cnt('viag') ? `<a class="mbtn pri" href="#emitir/${v.id}">Abrir OM com o que vence</a>` : ''}</div>
   <div class="card cv-card"><div class="tw"><div class="cv-tit">Cronograma empurradores · ${esc(v.nome)}</div><table class="cv-t"><colgroup><col style="width:110px"><col style="width:120px"><col style="width:38px"><col style="width:150px"><col><col style="width:96px"><col style="width:132px"><col style="width:132px"><col style="width:150px"></colgroup><thead><tr><th>Sistema</th><th>Equipamento</th><th>Nº</th><th>Item</th><th>Checklist</th><th>Frequência / Intervalo</th><th>Última vez</th><th>Próxima</th><th>Situação</th></tr></thead><tbody>${html || '<tr><td colspan="9" class="note">Nada vencendo neste empurrador.</td></tr>'}</tbody></table></div></div>`;
}
VX.crono = vCronoV2;
AFTER.crono = function () { const m = $('#main');
  m.onchange = e => { if (e.target.id === 'cvV') { CRV.v = e.target.value; render(); } if (e.target.id === 'cvSo') { CRV.so = e.target.checked; render(); } };
  m.onclick = e => { const t = e.target.closest('button'); if (t && 'cvprint' in t.dataset) window.print(); }; };
   // planejado × realizado (auditoria) continua disponível

/* ---------- OMs: abertas e encerradas, numa lista ---------- */
AFTER.oms = function () { $('#main').onclick = async e => { const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.ficha) return fichaModal(S.recs.get(t.dataset.ficha));
  if (t.dataset.gadv) { if (!precisa(false)) return; const [g, st] = t.dataset.gadv.split('|'); await grpAvancar(g, st); render(); } }; };

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

