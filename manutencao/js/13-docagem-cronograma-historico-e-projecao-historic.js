/* ===== DOCAGEM: cronograma histórico e projeção + histórico de cada empurrador ===== */
'use strict';
let DSEL = '';
function docaHist(v) {
  const iv = intervalo(A1M[DOCA.item]).m || 60, L = [];
  recs('base').forEach(b => { if (b.vessel === v.id && b.item === DOCA.item && !b.nf && !b.insp && !b.excluido) L.push({ id: b.id, rec: b, ent: b.date, sai: b.saida || '', est: b.estaleiro || '', serv: b.servicos || '', custo: b.custo, obs: b.obs || '' }); });
  oms().forEach(o => { if (o.tipo === 'P' && o.status === 'encerrada' && o.vessel === v.id && (o.items || []).includes(DOCA.item)) L.push({ id: 'om', ent: o.dreal || isoD(new Date(o.fechadoAt || o.updatedAt)), sai: '', est: '', serv: 'OM ' + o.num, custo: null }); });
  L.sort((a, b) => a.ent < b.ent ? -1 : 1);
  L.forEach((x, i) => { if (i) { const prazo = addM(pD(L[i - 1].ent), iv); x.prazo = prazo; x.atraso = Math.round((pD(x.ent) - prazo) / 864e5); } x.parada = x.sai ? Math.round((pD(x.sai) - pD(x.ent)) / 864e5) + 1 : null; });
  return L;
}
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
  return `<div class="card"><div class="row"><h2>A · Cronograma histórico e projeção (${y0}–${y1})</h2><span class="sp"></span><span class="note">Clique num empurrador para ver o detalhe de cada docagem</span></div>
   ${box}<div class="clegend note"><span><i style="background:#1A73E8;border-radius:3px"></i>Docagem no prazo</span><span><i style="background:#E37400;border-radius:3px"></i>Entrou com atraso</span><span><i style="background:#fff;border:2px solid #188038;border-radius:3px;width:8px;height:10px"></i>Próxima (cor = situação)</span><span><i style="background:#F6AEA9"></i>Atraso acumulado até hoje</span></div>
   <div class="dh">${eixo}${linhas}${rodape}</div>${tab}</div>`;
}
function docaReg(vid, rid) {
  if (!precisa(false)) return; const v = vessel(vid), r = rid ? S.recs.get(rid) : null;
  modal(`<h2>${r ? 'Corrigir' : 'Registrar'} docagem · ${esc(v.nome)}</h2>
   <div class="g"><label class="f s3">Entrada no estaleiro<input id="dgE" type="date" value="${r ? r.date : ''}"></label><label class="f s3">Saída<input id="dgS" type="date" value="${r ? r.saida || '' : ''}"></label>
   <label class="f s3">Estaleiro<input id="dgT" value="${esc(r ? r.estaleiro || '' : '')}"></label><label class="f s3">Custo (R$ mil)<input id="dgC" inputmode="decimal" value="${r && r.custo != null ? r.custo : ''}"></label>
   <label class="f">Serviços<input id="dgV" placeholder="Casco, hélices e eixos, válvulas de fundo, pintura…" value="${esc(r ? r.servicos || '' : '')}"></label></div>
   <div class="row end">${r ? '<button class="mbtn bad" id="dgX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="dgOk">Salvar</button></div>`);
  $('#dgOk').onclick = async () => { const e = $('#dgE').value; if (!e) return toast('Informe a data de entrada.'); const s = $('#dgS').value; if (s && s < e) return toast('A saída não pode ser antes da entrada.');
    const c = $('#dgC').value.trim().replace(',', '.');
    await saveRec(Object.assign(r ? Object.assign({}, r) : { id: uid('base'), kind: 'base', vessel: vid, pos: 'UN', item: DOCA.item, h: null }, { date: e, saida: s, estaleiro: $('#dgT').value.trim(), servicos: $('#dgV').value.trim(), custo: c === '' ? null : +c, by: S.session.name }));
    closeModal(); toast('Docagem salva.'); render(); };
  const x = $('#dgX'); if (x) x.onclick = () => confirmar('Excluir esta docagem do histórico?', async () => { await saveRec(Object.assign({}, r, { deleted: true, excluido: true })); S.recs.delete(r.id); try { await DB.del(r.id); } catch (er) { } closeModal(); toast('Docagem excluída.'); render(); });
}
VX.doca = vDoca;
document.addEventListener('click', e => { if (VIEW !== 'doca' && VIEW !== 'controle') return; const s = e.target.closest('[data-dsel],[data-dnova],[data-dlim],[data-ded]'); if (!s) return; e.stopPropagation();
  if (s.dataset.dsel) { DSEL = s.dataset.dsel; render(); } else if (s.dataset.dnova) docaReg(s.dataset.dnova); else if (s.dataset.dlim) docaModal(s.dataset.dlim); else docaReg(DSEL, s.dataset.ded); }, true);

