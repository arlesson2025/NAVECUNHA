/* ===== SMF simples: Hoje · Óleo · Empurradores · Cronograma · Consultas ===== */
'use strict';
/* ---------- Óleo da frota: bater o olho e ver vencido / vencendo / em dia ---------- */
const OL_ALERTA_H = 50, OL_ALERTA_D = 3;
const eqNomeC = (v, e) => !e ? '' : e.key === 'inc' ? 'Motobomba de incêndio' : e.g === 'mca' && v ? posCurtoE(v, e.pos) : e.nome;
function olStatus(x) { if (x.s.st === 'sem' || x.horas == null) return 'sem'; if (x.horas < 0) return 'venc'; if (x.horas <= OL_ALERTA_H || (x.porData && x.dias != null && x.dias <= OL_ALERTA_D)) return 'aten'; return 'ok'; }
function olValor(x) { if (x.horas == null) return '—'; if (x.porData && x.dias != null) { const d = Math.round(x.dias); return d < 0 ? 'vencido há ' + (-d) + ' d' : d === 0 ? 'vence hoje' : d + ' d'; } return x.horas < 0 ? nf(-x.horas) + ' h vencido' : nf(x.horas) + ' h'; }

/* ---------- Barco: tudo de uma embarcação numa página ---------- */
const BR = { v: '' };
function vBarco() {
  const ativos = S.cfg.frota.filter(v => !foraOp(v)); const vid = ARG || BR.v || (ativos[0] || {}).id; BR.v = vid; const v = vessel(vid); if (!v) return '<div class="empty">Embarcação não encontrada.</div>';
  const x = rotinaDados().find(d => d.v === v) || { venc: [], viag: [], corr: [] }, s = situDe(v), LD = lubDados().filter(d => d.v === v && !d.saida).map(d => Object.assign(d, { st2: olStatus(d) }));
  const cor = { venc: '#C5221F', aten: '#E37400', ok: '#188038', sem: '#5F6368' };
  const mot = LD.filter(d => ['mcp', 'mca'].includes(d.e.g) || d.e.key === 'inc').map(d => { const h = horAtual(v.id, lubHp(v, d.e)); return `<div class="br-m"><b>${esc(d.e.g === 'mca' ? posCurtoE(v, d.e.pos) : d.e.nome)}</b><span class="br-h">${h ? nf(h.h) + ' h' : '—'}</span><small>${h ? 'lido ' + (h.est ? 'estimado' : brD(h.date)) : 'sem leitura'}</small><span style="color:${cor[d.st2]};font-weight:600">óleo: ${d.st2 === 'venc' ? 'vencido' : d.st2 === 'sem' ? 'sem histórico' : 'faltam ' + olValor(d)}</span></div>`; }).join('');
  const outros = LD.filter(d => !(['mcp', 'mca'].includes(d.e.g) || d.e.key === 'inc')).map(d => `<span style="color:${cor[d.st2]}">${esc(eqNomeC(v, d.e))}: ${olValor(d)}</span>`).join(' · ');
  const p = x.v ? rotinaPasso(x) : { n: 0, txt: '', btn: '' }, n = (x.venc || []).length + (x.viag || []).length;
  const hist = [];
  oms().filter(o => o.vessel === v.id && o.status === 'encerrada').forEach(o => hist.push({ d: o.dreal || isoD(new Date(o.fechadoAt || 0)), t: o.tipo === 'C' ? `Falha · ${esc(o.descricao || o.sistema || '')} · OM ${esc(o.num)}` : `OM ${esc(o.num)} · preventiva · ${(o.items || []).length} itens` }));
  recs('lub').filter(r => r.tipo === 'fr049' && r.vessel === v.id).forEach(r => hist.push({ d: r.date, t: 'Troca de óleo (FR 049_B) · ' + (r.eq || []).filter(q => q.status === 'T').map(q => { const e = lubEq(v, q.key); return esc(e ? eqNomeC(v, e) : q.key); }).join(', ') }));
  hist.sort((a, b) => a.d < b.d ? 1 : -1);
  const sel = `<select id="brV" style="font-size:18px;font-weight:600;width:auto;min-width:160px">${ativos.map(a => `<option value="${a.id}"${a.id === v.id ? ' selected' : ''}>${esc(a.nome)}</option>`).join('')}</select>`;
  return `<div class="vh"><div><h1>Empurrador</h1></div></div>
   <div class="card row" style="gap:12px;flex-wrap:wrap">${sel}${s ? `<span class="pill ${s.st === 'porto' ? 'p-inf' : 'p-mut'}">${s.st === 'porto' ? '⚓ no porto desde ' + brD(s.at) : '⛴ em viagem desde ' + brD(s.at)}</span>` : '<span class="pill p-warn">situação não informada</span>'}
    <button class="mbtn sm" data-situ="${v.id}|${s && s.st === 'porto' ? 'viagem' : 'porto'}">${s && s.st === 'porto' ? '⛴ Saiu de viagem' : '⚓ Chegou em Manaus'}</button><span class="sp"></span><a class="mbtn sm" href="#corr">Registrar falha</a></div>
   <div class="card"><h2>Motores · horímetro e troca de óleo</h2><div class="br-g">${mot || '<p class="note">Sem motores cadastrados.</p>'}</div>${outros ? `<p class="note" style="margin-top:8px">${outros}</p>` : ''}
    <div class="row" style="gap:8px;margin-top:10px"><a class="mbtn" href="#hor">⏱ Lançar horímetro</a><button class="mbtn pri" data-frv="${v.id}">🛢 Lançar troca de óleo</button></div></div>
   <div class="two"><div class="card"><h2>Preventivas (equipe de terra)</h2>
     ${p.n >= 2 && p.n <= 5 ? `<p>${p.txt}</p><div class="row" style="gap:8px">${p.btn}</div>` : n ? `<p>${x.venc.length ? `<b style="color:#C5221F">${x.venc.length} vencidos</b> + ` : ''}${x.viag.length} vencem antes da volta</p><a class="mbtn pri" href="#emitir/${v.id}">Abrir OM e imprimir formulário</a>` : '<p style="color:#188038">✓ Nada vence antes da próxima volta.</p>'}
     ${x.crit ? '<div class="banner bad" style="margin-top:8px">Saída bloqueada: item Crítico vencido sem OM.</div>' : ''}</div>
    <div class="card"><h2>Histórico</h2><div class="tw" style="max-height:300px"><table class="t"><tbody>${hist.slice(0, 15).map(h => `<tr><td class="mono" style="white-space:nowrap">${brD(h.d)}</td><td>${h.t}</td></tr>`).join('') || '<tr><td class="note">Nada registrado ainda.</td></tr>'}</tbody></table></div></div></div>`;
}
AFTER.barco = function () { const m = $('#main');
  m.onchange = e => { if (e.target.id === 'brV') go('barco/' + e.target.value); };
  m.onclick = async e => { const it = e.target.closest('[data-prit]'); if (it) CRV.v = it.dataset.prit; const t = e.target.closest('button'); if (!t) return;
    if ('frv' in t.dataset) { if (!precisa(false)) return; return lubAbrirForm(t.dataset.frv); }
    if (t.dataset.situ) { if (!precisa(false)) return; const [vid, st] = t.dataset.situ.split('|'); await situSalvar(vid, st); render(); return; }
    if (t.dataset.ficha) return fichaModal(S.recs.get(t.dataset.ficha));
    if (t.dataset.rtadv) { if (!precisa(false)) return; const [g, st, grp] = t.dataset.rtadv.split('|'); if (grp === '1') await grpAvancar(g, st); else { const o = S.recs.get(g); o.status = st; await saveRec(o); } render(); } };   const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_barco2_lay', '[data-brreset]');
};

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
/* ---------- "ficha" passa a se chamar "formulário" ---------- */
{ const troca = h => h.replace(/(^|[\s>(“"])([Ff])icha(?![\w])/g, (m, a, f) => a + (f === 'F' ? 'Formulário' : 'formulário')).replace(/\b([Aa]) formulário/g, (m, a) => (a === 'A' ? 'O' : 'o') + ' formulário').replace(/\bda formulário/g, 'do formulário').replace(/\bna formulário/g, 'no formulário').replace(/\bpela formulário/g, 'pelo formulário').replace(/\bDa formulário/g, 'Do formulário');
  ['vAcomp', 'vBarco'].forEach(n => { const f0 = window[n]; if (typeof f0 !== 'function') return; window[n] = function () { return troca(f0.apply(this, arguments)); }; });
  VX.acomp = window.vAcomp; }
{ const st = document.createElement('style'); st.textContent = `
 .ol-t{width:100%;border-collapse:collapse}.ol-t th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#5F6368;padding:8px 6px;border-bottom:2px solid #E8EAED}.ol-t td{padding:8px 6px;border-bottom:1px solid #F1F3F4;vertical-align:middle}
 .ol-v{white-space:nowrap}.ol-v b{font-size:15px}.ol-v small{display:block;color:#5F6368;margin-left:18px}
 
 
 .br-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.br-m{border:1px solid #E8EAED;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}.br-h{font-size:22px;font-weight:700}.br-m small{color:#5F6368}`; document.head.appendChild(st); }
if (!location.hash || location.hash === '#rotina') { try { history.replaceState(null, '', '#rotina'); } catch (e) { } }

