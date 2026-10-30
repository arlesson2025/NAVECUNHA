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

document.addEventListener('click', e => { if (VIEW !== 'doca' && VIEW !== 'controle') return; const s = e.target.closest('[data-dsel],[data-dnova],[data-dlim],[data-ded]'); if (!s) return; e.stopPropagation();
  if (s.dataset.dsel) { DSEL = s.dataset.dsel; render(); } else if (s.dataset.dnova) docaReg(s.dataset.dnova); else if (s.dataset.dlim) docaModal(s.dataset.dlim); else docaReg(DSEL, s.dataset.ded); }, true);

