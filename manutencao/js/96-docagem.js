'use strict';
/* =====================================================================
   3.2 CONTROLES · 6 DOCAGEM (SMF 3.134, 01/11/2026; Supervisor: “o que houve com o gráfico de docagem histórico?”).
   O gráfico “Cronograma histórico e projeção” e o histórico de docagens de cada empurrador saíram junto com a tela antiga
   “Calibração e docagem” na limpeza da 3.95; voltam aqui como aba do 3.2 Controles. Os dados são os mesmos de sempre:
   base do item 9.1.5 (DOCA.item; docaHist, js/13), data-limite do CSN (doclim, docaModal no núcleo) e o vencimento
   (docaVessel). Registrar docagem (docaReg, js/13) é o mesmo formulário aberto pelo Histórico dos equipamentos
   (tipo Docagem no equipamento Empurrador), então os dois alimentam o mesmo registro.
   ===================================================================== */
function docaStats() { const H = S.cfg.frota.flatMap(v => docaHist(v)); const par = H.filter(x => x.parada != null).map(x => x.parada), pont = H.filter(x => x.atraso != null);
  return { parada: par.length ? par.reduce((a, b) => a + b, 0) / par.length : null, nPar: par.length, pont: pont.length ? pont.filter(x => x.atraso <= 0).length / pont.length * 100 : null, nPont: pont.length, okPont: pont.filter(x => x.atraso <= 0).length }; }
function docaCrono(D) {
  const H = Object.fromEntries(D.map(x => [x.v.id, docaHist(x.v)]));
  const datas = D.flatMap(x => H[x.v.id].map(h => pD(h.ent))).concat(D.filter(x => x.due).map(x => x.due));
  const y0 = Math.min(2015, ...datas.map(d => d.getFullYear())), y1 = Math.max(hoje().getFullYear() + 4, ...datas.map(d => d.getFullYear()));
  const t0 = new Date(y0, 0, 1), t1 = new Date(y1 + 1, 0, 1), X = d => Math.max(0, Math.min(100, (d - t0) / (t1 - t0) * 100));
  const anos = []; for (let y = y0; y <= y1 + 1; y++) anos.push(y);
  const corN = { venc: '#D93025', viag: '#E37400', ok: '#188038', sem: '#9AA0A6' }, hj = X(hoje());
  if (!DSEL || !D.some(x => x.v.id === DSEL)) DSEL = (D.find(x => x.st === 'venc') || D[0]).v.id;
  const linhas = D.map(x => { const h = H[x.v.id], fora = foraOp(x.v);
    const mk = h.map((d, i) => `<i class="dh-m ${d.atraso > 0 ? 'late' : ''}" style="left:${X(pD(d.ent))}%" data-tip="${i + 1}ª docagem · entrada ${brD(d.ent)}${d.sai ? ' · saída ' + brD(d.sai) : ''}${d.atraso > 0 ? ' · ' + d.atraso + ' d de atraso' : ''}${d.est ? ' · ' + esc(d.est) : ''}"></i>`).join('');
    const ins = recs('base').filter(b => b.vessel === x.v.id && b.item === DOCA.item && b.insp && !b.excluido).map(b => `<i class="dh-m" style="left:${X(pD(b.date))}%;background:#fff;border:2px solid #1A73E8" data-tip="Inspeção ${brD(b.date)} · sem necessidade de docar${b.prox ? ' · próxima avaliação ' + brD(b.prox) : ''}${b.obs ? ' · ' + esc(b.obs) : ''}"></i>`).join('');
    const nx = x.due ? `<i class="dh-n" style="left:${X(x.due)}%;border-color:${corN[x.st]}" data-tip="Próxima: limite ${brD(isoD(x.due))} (${x.fonte})"></i>` : '';
    const atr = x.st === 'venc' && x.due ? `<i class="dh-a" style="left:${X(x.due)}%;width:${hj - X(x.due)}%"></i><span class="dh-at" style="left:${hj}%">vencida há ${-x.dias} d</span>` : '';
    return `<div class="dh-r${x.v.id === DSEL ? ' sel' : ''}${fora ? ' fora' : ''}" data-dsel="${x.v.id}"><span class="dh-l">${esc(x.v.nome)}</span><div class="dh-t">${anos.slice(0, -1).map(y => `<i class="dh-g" style="left:${X(new Date(y, 0, 1))}%"></i>`).join('')}<i class="dh-hjr" style="left:${hj}%"></i>${atr}${mk}${ins}${nx}${!h.length && !x.due ? `<span class="dh-sem">${fora ? 'fora de operação' : 'sem registro de docagem'}</span>` : ''}</div></div>`; }).join('');
  const eixo = `<div class="dh-r dh-ax"><span class="dh-l"></span><div class="dh-t">${anos.map(y => `<span style="left:${X(new Date(y, 0, 1))}%">${y}</span>`).join('')}</div></div>`, rodape = `<div class="dh-r dh-ax"><span class="dh-l"></span><div class="dh-t"><span style="left:${hj}%;color:#188038">hoje</span></div></div>`;
  const x = D.find(d => d.v.id === DSEL), h = H[DSEL];
  const stNx = !x.due ? '<span class="pill p-mut">sem registro</span>' : x.st === 'venc' ? `<span class="pill p-bad">vencida há ${-x.dias} d</span>` : x.st === 'viag' ? `<span class="pill p-warn">planejar · ${x.dias} d</span>` : `<span class="pill p-ok">no prazo</span>`;
  const tab = `<div class="row" style="margin-top:14px"><h3 class="dh-h">${esc(x.v.nome)} · histórico de docagens</h3><span class="sp"></span><button class="mbtn sm" data-dlim="${x.v.id}">Data-limite do CSN</button><button class="mbtn sm pri" data-dnova="${x.v.id}">＋ Registrar docagem</button></div>
   <div class="tw"><table class="t"><thead><tr><th>Docagem</th><th>Entrada</th><th>Saída</th><th>Parada</th><th>Estaleiro</th><th>Serviços</th><th>Custo (R$ mil)</th><th>Entrada vs prazo</th><th>Situação</th></tr></thead><tbody>
   ${h.map((d, i) => `<tr ${d.rec ? `class="click" data-ded="${d.id}"` : ''}><td>${i + 1}ª</td><td>${brD(d.ent)}</td><td>${d.sai ? brD(d.sai) : '—'}</td><td>${d.parada != null ? d.parada + ' d' : '—'}</td><td>${esc(d.est) || '—'}</td><td>${esc(d.serv) || '—'}</td><td>${d.custo != null && d.custo !== '' ? nf(+d.custo) : '—'}</td><td>${d.atraso == null ? '—' : d.atraso > 0 ? `<span style="color:#E37400">+${d.atraso} d</span>` : '<span style="color:#188038">No prazo</span>'}</td><td><span class="pill p-ok">concluída</span></td></tr>`).join('')}
   <tr><td>Próx.</td><td>${x.due ? brD(isoD(x.due)) : '—'}</td><td>—</td><td>—</td><td>—</td><td class="note">${x.due ? 'limite · ' + esc(x.fonte) : 'registre a última docagem'}</td><td>—</td><td>—</td><td>${stNx}</td></tr></tbody></table></div>
   <p class="note">Clique numa docagem da tabela para corrigir. O prazo de cada docagem é a anterior + ${intervalo(A1M[DOCA.item]).m} meses (Anexo I, 9.1.5); a data-limite do CSN prevalece quando for antes.</p>`;
  const s = docaStats(), box = `<div class="ds-row"><div class="ds"><b>${s.parada == null ? '—' : nf(s.parada, 0) + ' d'}</b><span>parada média em estaleiro</span><small>${s.nPar ? s.nPar + ' docagem(ns) com entrada e saída' : 'registre entrada e saída'}</small></div><div class="ds"><b style="color:${s.pont == null ? '#202124' : s.pont >= 80 ? '#188038' : s.pont >= 60 ? '#E37400' : '#D93025'}">${s.pont == null ? '—' : nf(s.pont, 0) + '%'}</b><span>pontualidade de entrada</span><small>${s.nPont ? s.okPont + ' de ' + s.nPont + ' entraram no prazo' : 'precisa de 2 docagens do mesmo empurrador'}</small></div></div>`;
  return `<div class="card"><div class="row"><h2>Docagem · histórico e projeção (${y0}–${y1})</h2><span class="sp"></span><span class="note">Clique num empurrador para ver o detalhe de cada docagem</span></div>
   ${box}<div class="clegend note"><span><i style="background:#1A73E8;border-radius:3px"></i>Docagem no prazo</span><span><i style="background:#E37400;border-radius:3px"></i>Entrou com atraso</span><span><i style="background:#fff;border:2px solid #188038;border-radius:3px;width:8px;height:10px"></i>Próxima (cor = situação)</span><span><i style="background:#F6AEA9"></i>Atraso acumulado até hoje</span></div>
   <div class="dh">${eixo}${linhas}${rodape}</div>${tab}</div>`;
}

function vEnxDoca() {
  const D = S.cfg.frota.map(docaVessel);
  return enxCab('3.2 Controles · docagem', `Anexo I 9.1.5: docagem a cada ${intervalo(A1M[DOCA.item]).m / 12} anos (jateamento, medição de espessura por ultrassom e repintura); a data-limite do CSN prevalece quando vier antes. A mesma docagem aparece no <a href="#enxeq">Histórico dos equipamentos</a>.`, '<button class="mbtn" data-enxreset>Reorganizar</button>')
    + docaCrono(D) + '</div></div>';
}
VX.enxdoca = vEnxDoca; AFTER.enxdoca = pcmAfter('enxdoca');
ENX_OK.push('enxdoca'); MC_VIEWS.push(['enxdoca', '6 · Docagem']);
{ const e = PCM_ETAPAS.find(x => x[0] === '3'); if (e) e[2].push('enxdoca'); }
Object.assign(NP_TAG, { enxdoca: '7.3 · Anexo I 9.1.5' });
{ const st = document.createElement('style'); st.textContent = `
.dh{margin-top:10px}.dh-r{display:grid;grid-template-columns:110px 1fr;align-items:center;height:30px;border-radius:6px;cursor:pointer}
.dh-r:hover{background:#F8F9FA}.dh-r.sel{background:#E6F4EA;box-shadow:inset 0 0 0 1px #A8DAB5}.dh-r.sel .dh-l{color:#137333}.dh-r.fora{opacity:.55}
.dh-l{text-align:right;padding-right:14px;font-size:13px;color:#3C4043;white-space:nowrap}
.dh-t{position:relative;height:100%;border-bottom:1px solid #F1F3F4}
.dh-g{position:absolute;top:0;bottom:0;width:1px;background:#F1F3F4}
.dh-m{position:absolute;top:50%;width:9px;height:15px;margin:-7.5px 0 0 -4.5px;background:#1A73E8;border-radius:3px;z-index:2}.dh-m.late{background:#E37400}
.dh-n{position:absolute;top:50%;width:12px;height:16px;margin:-8px 0 0 -6px;background:#fff;border:2px solid #188038;border-radius:4px;z-index:3;box-sizing:border-box}
.dh-a{position:absolute;top:50%;height:12px;margin-top:-6px;background:#F6AEA9;z-index:1}
.dh-at{position:absolute;top:50%;transform:translate(8px,-50%);font-size:11px;color:#D93025;white-space:nowrap;z-index:2}
.dh-sem{position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#9AA0A6}
.dh-ax{height:26px;cursor:default}.dh-ax:hover{background:none}.dh-ax .dh-t{border:0}.dh-ax .dh-t>span{position:absolute;top:4px;transform:translateX(-50%);font-size:11px;color:#5F6368}
.dh-hjr{position:absolute;top:0;bottom:0;width:0;border-left:1.5px dashed #188038;z-index:4;pointer-events:none}
.dh-h{margin:0;font-size:15px;font-weight:500;color:#137333}
.ds-row{display:flex;gap:12px;margin:8px 0 6px;flex-wrap:wrap}.ds{border:1px solid #DADCE0;border-radius:8px;padding:10px 14px;min-width:200px}.ds b{display:block;font-size:24px;font-weight:400;color:#202124}.ds span{display:block;font-size:13px;color:#3C4043}.ds small{color:#5F6368;font-size:12px}

.dh-r{grid-template-columns:110px 1fr}`; document.head.appendChild(st); }
