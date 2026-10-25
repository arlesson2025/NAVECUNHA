/* ===== Onde está cada barco: "Chegou em Manaus" / "Saiu de viagem" · Rotina do dia só com o que é para agora ===== */
'use strict';
const situDe = v => v.situ || null;   // { st: 'porto' | 'viagem', at: 'AAAA-MM-DD', by }
async function situSalvar(vid, st) {
  const v = vessel(vid); if (!v) return; v.situ = { st, at: isoD(hoje()), by: S.session ? S.session.name : '' };
  S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg);
  if (S.url && can.admin()) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota } }); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } } catch (e) { } }
  const v2 = vessel(vid); if (v2 && v2.situ) { v2.situ.ts = Date.now(); await kvSet('cfg', S.cfg); }   // hora exata do evento (estado por eventos)
}
function oleoDoBarco(v) {
  return cronoLinhas(v).filter(l => l.tr === 'bordo' && /MCP|MCA/.test(l.nome)).map(l => ({ l, p: proxLinha(v, l) })).filter(x => x.p && x.p.rest != null)
    .map(x => { const rate = (typeof horasDiaPos === 'function' && horasDiaPos(v.id, x.p.pos)) || 20, dh = x.p.dd != null ? x.p.dd * rate : null, porData = dh != null && dh < x.p.rest;   /* 350 h ou 6 meses: vale o que vencer primeiro (antes só horas) */
      return { nome: MCAS.includes(x.p.pos) ? posCurtoE(v, x.p.pos) : x.l.nome.replace('Troca de óleo · ', '').replace(' + itens de 250 h', ''), rest: porData ? dh : x.p.rest, porData, dd: x.p.dd, pos: x.p.pos }; }).sort((a, b) => a.rest - b.rest);
}
function horPainelTotal(vid, pos, h, date) {   // devolve o total se 'h' é com certeza o número do painel; senão null
  const off = horOff(vessel(vid), pos, date); if (off && h != null && +h < VOLTA && +h >= off.ini) return Math.round((off.base + +h - off.ini) * 10) / 10;   // horímetro trocado/consertado
  if (h == null || +h >= VOLTA) return null;
  const L = recs('hor').filter(r => r.vessel === vid && r.pos === pos && !r.est).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.h - b.h);
  const ant = L.filter(r => r.date <= date).pop() || L[0]; if (!ant) return null;
  if (ant.h < VOLTA && !(+h < ant.h - 0.05 && ant.date <= date)) return null;   // abaixo de 10.000 h só há volta se o painel caiu
  let t = Math.floor(ant.h / VOLTA) * VOLTA + +h; if (t < ant.h - 0.05 && ant.date <= date) t += VOLTA;
  if (ant.h < VOLTA) { const dias = Math.max(0, Math.round((pD(date) - pD(ant.date)) / 864e5)); if (t - ant.h > dias * 24 + 24) return null; }   // 1ª volta só se as horas a mais cabem nos dias passados; senão vira pendência (horp)
  return Math.round(t * 10) / 10;
}
AFTER.rotina = function () { const m = $('#main'); m.onclick = async e => { const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.ficha) return fichaModal(S.recs.get(t.dataset.ficha));
  if (t.dataset.frv) { if (!precisa(false)) return; return lubAbrirForm(t.dataset.frv); }
  if (t.dataset.situ) { if (!precisa(false)) return; const [vid, st] = t.dataset.situ.split('|'); await situSalvar(vid, st); toast(vName(vid) + (st === 'porto' ? ' no porto de Manaus.' : ' saiu de viagem.')); render(); return; }
  if (t.dataset.rtadv) { if (!precisa(false)) return; const [g, st, grp] = t.dataset.rtadv.split('|'); if (grp === '1') await grpAvancar(g, st); else { const o = S.recs.get(g); o.status = st; (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: omStatusTxt(o) }); if (st === 'abordo' && !o.inicio) o.inicio = isoDT(hoje()); await saveRec(o); } render(); } }; 
  /* janelas livres e nome do empurrador que abre a ficha (antes eram dois embrulhos no fim do arquivo) */
  const ws = document.querySelector('#main .cm-ws'); if (ws && !(typeof ehOperador === 'function' && ehOperador())) janelasLivres(ws, 'smf_frota_lay', '[data-f2reset]');
  if (S.session && S.session.role === 'opr') return;
  const N = new Map(S.cfg.frota.map(v => [v.nome, v.id]));
  document.querySelectorAll('#main b').forEach(b => { const id = N.get(b.textContent.trim()); if (!id || b.closest('a,button,select,label')) return;
    const a = document.createElement('a'); a.href = '#barco/' + id; a.className = 'f2-nm'; a.title = 'Abrir a ficha do empurrador'; b.replaceWith(a); a.appendChild(b); });
};
{ const st = document.createElement('style'); st.textContent = `
 
 .rt2-l{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #F1F3F4;font-size:14px;line-height:1.35}.rt2-l .mbtn{white-space:nowrap}
 .rt2-l.ok{color:#188038}.rt2-l.bad{color:#C5221F}`; document.head.appendChild(st); }

