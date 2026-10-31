/* =====================================================================
   CRONOGRAMA × REALIZADO (ano) · preventivas do Anexo I
   P = programado (vencimento) · R = realizado (OM, FR 049_B ou último serviço registrado)
   verde: feito no prazo · laranja: feito com atraso · vermelho: venceu e não foi feito · cinza: ainda vai vencer
   ===================================================================== */
'use strict';
let CXI = null;   // índices montados uma vez por cálculo
function cxIndice() {
  const ev = {}, hor = {}, add = (k, o) => (ev[k] = ev[k] || []).push(o);
  recs('base').forEach(b => { if (b.date && !b.nf && !b.excluido) add(b.vessel + '|' + b.pos + '|' + b.item, b.insp ? { date: b.date, h: b.h == null || b.h === '' ? null : +b.h, src: 'Inspecionado · sem intervenção' + (b.om ? ' · OM ' + b.om : ''), num: b.om, insp: true, prox: b.prox || null, proxH: b.proxH != null && b.proxH !== '' ? +b.proxH : null } : { date: b.date, h: b.h == null || b.h === '' ? null : +b.h, src: 'Último serviço registrado' }); });
  oms().forEach(o => { if (o.tipo === 'P' && o.status === 'encerrada') (o.items || []).forEach(it => add(o.vessel + '|' + o.pos + '|' + it, { date: o.dreal || isoD(new Date(o.fechadoAt || o.updatedAt)), h: o.hreal == null || o.hreal === '' ? null : +o.hreal, src: 'OM ' + o.num, num: o.num })); });
  recs('lub').forEach(r => { if (r.tipo === 'fr049') (r.eq || []).forEach(q => { if (q.status === 'T') (q.itens || []).forEach(it => add(r.vessel + '|' + q.pos + '|' + it, { date: r.date, h: q.hr == null || q.hr === '' ? null : +q.hr, src: 'FR 049_B ' + (r.om || ''), num: r.om })); }); });
  if (typeof corrRefeitos === 'function') oms().forEach(o => { if (o.tipo === 'C' && o.status === 'encerrada' && !o.excluido) corrRefeitos(o).forEach(x => add(o.vessel + '|' + x.pos + '|' + x.id, { date: x.date, h: x.h, src: 'Corretiva OM ' + o.num + ' (reinício)', num: o.num, reset: true })); });   // corretiva que refez o serviço: só reinicia a contagem
  Object.values(ev).forEach(L => L.sort((a, b) => a.date < b.date ? -1 : 1));
  recs('hor').forEach(r => (hor[r.vessel + '|' + r.pos] = hor[r.vessel + '|' + r.pos] || []).push(r));
  Object.values(hor).forEach(L => L.sort((a, b) => a.date < b.date ? -1 : 1));
  recs('lub').forEach(r => { if (r.tipo !== 'fr049') return; const v = vessel(r.vessel); if (!v) return;   // itens de 250 h feitos junto com a troca de óleo do FR 049_B
    (r.eq || []).forEach(q => { if (q.status !== 'T') return; itensDe(v, q.pos).forEach(t => { const oil = compDe(v, q.pos, t); if (oil && (q.itens || []).includes(oil)) { const k = r.vessel + '|' + q.pos + '|' + t.id; (ev[k] = ev[k] || []).push({ date: r.date, h: q.hr == null || q.hr === '' ? null : +q.hr, src: 'FR 049_B ' + (r.om || ''), num: r.om }); ev[k].sort((a, b) => a.date < b.date ? -1 : 1); } }); }); });
  return { ev, hor };
}
function cxServicos(vid, pos, itemId) { return (CXI.ev[vid + '|' + pos + '|' + itemId] || []); }
function cxDataHoras(vid, hp, alvoH, desde, rate) {   // data em que o horímetro chega a alvoH
  const R = (CXI.hor[vid + '|' + hp] || []).filter(r => r.date >= desde);
  const hit = R.find(r => r.h >= alvoH); if (hit) return pD(hit.date);
  const last = R[R.length - 1] || null; if (!last) return null;
  return new Date(pD(last.date).getTime() + Math.max(0, alvoH - last.h) / Math.max(.1, rate) * 864e5);
}
function cxLinha(v, pos, t, ano) {
  const iv = intervalo(t, v, pos); if (!iv.h && !iv.m) return null;
  const hp = posHor(pos, t, v.id), rate = horasDiaPos(v.id, hp) || horasDia(v.id) || 10;
  const ini = new Date(ano, 0, 1), fim = new Date(ano + 1, 0, 1), hj = hoje(), iniS = isoD(ini), fimS = isoD(fim);
  const E = cxServicos(v.id, pos, t.id), marks = [];
  let cur = E.filter(e => e.date < iniS).pop() || null;
  if (!cur && v.marco && v.marco.date && t.id !== DOCA.item) cur = { date: (v.marco.dates && v.marco.dates[hp]) || v.marco.date, h: v.marco.h && v.marco.h[hp] != null ? v.marco.h[hp] : null, src: 'Marco zero' };
  if (!cur) { const f = E.find(e => e.date >= iniS && e.date < fimS); if (f) { marks.push(f.reset ? { k: 'corr', d: pD(f.date), ev: f } : { k: 'ok', d: pD(f.date), ev: f, semPrazo: true }); cur = f; } }
  if (!cur) return { v, pos, t, iv, marks };
  let n = 0;
  while (n++ < 80) {
    const c = [], tH = cur.h != null ? (cur.insp && cur.proxH != null ? cur.proxH : cur.h + iv.h) : null;   // inspecionado sem intervenção: próxima avaliação escolhida (SMF 3.32)
    if (iv.m) c.push(cur.insp && cur.prox ? pD(cur.prox) : addM(pD(cur.date), iv.m));
    if (iv.h) { const d = tH != null ? cxDataHoras(v.id, hp, tH, cur.date, rate) : null; c.push(d || new Date(pD(cur.date).getTime() + (tH != null ? Math.max(0, tH - cur.h) : iv.h) / rate * 864e5)); }
    const due = new Date(Math.min(...c.filter(Boolean).map(d => d.getTime()))); if (isNaN(due)) break;
    const e = E.find(x => x.date > cur.date);
    if (e && e.reset) { const de = pD(e.date); if (due < de && due >= ini && due < fim && due < hj) marks.push({ k: 'miss', d: due, due }); if (de >= ini && de < fim) marks.push({ k: 'corr', d: de, ev: e }); cur = e; if (de >= fim) break; continue; }   // corretiva: reinicia sem contar como realizado; a preventiva já vencida antes dela segue como não feita
    if (e) { const de = pD(e.date), atr = Math.round((de - due) / 864e5);
      if (de >= ini && de < fim) marks.push({ k: atr <= 0 ? 'ok' : 'late', d: de, due, ev: e, atr });
      if (atr > 0 && due >= ini && due < fim && due.getMonth() !== de.getMonth()) marks.push({ k: 'pl', d: due, due, ev: e, ref: true });
      cur = e; if (de >= fim) break; continue; }
    if (due >= fim) break;
    if (due < hj) { if (due >= ini) marks.push({ k: 'miss', d: due, due }); break; }
    if (due >= ini) marks.push({ k: 'plan', d: due, due });
    cur = { date: isoD(due), h: tH != null && iv.h ? tH : null, proj: true };
  }
  return { v, pos, t, iv, marks };
}
// menu: 2 · Planejar
{ const s = SECOES.find(x => x.id === 'plan'); if (s && !s.views.some(x => x[0] === 'cxr')) { const i = s.views.findIndex(x => x[0] === 'crono'); s.views.splice(i < 0 ? s.views.length : i + 1, 0, ['cxr', 'Cronograma × Realizado']); } }

