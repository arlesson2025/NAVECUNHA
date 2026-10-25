/* ===== Horímetros na prática: cais × boia × viagem, MCA estimado por estado, horímetro trocado e troca de reversor =====
   MCA: no cais não trabalha (energia de terra); na boia e em viagem os dois revezam 12 h cada (padrão, ajustável por MCA).
   Estado vem dos registros: FR 027_L de chegada → cais · saída (FR 027_L ou registro de saída) → viagem · "foi para a boia"/"voltou ao cais" (kind 'situ').
   Horímetro trocado: o total continua (base + leitura do novo − leitura inicial). Reversor trocado: itens do reversor recomeçam na data/hora da troca. */
'use strict';
const SITU_TX = { cais: '⚓ no cais (energia de terra)', boia: '🛟 na boia (MCA ligado)', viagem: '⛴ em viagem' };
const MCA_SEM_LEITURA_D = 14;   // dias sem leitura de MCA (sem estimativa) até o alerta
function situEventos(vid) {
  const E = [];
  for (const r of S.recs.values()) { if (r.excluido || r.vessel !== vid) continue; const ts = r.at || r.createdAt || 0;
    if (r.kind === 'fr027') E.push({ ts, st: r.mov === 'saida' ? 'viagem' : 'cais' }); else if (r.kind === 'saida') E.push({ ts, st: 'viagem' }); else if (r.kind === 'situ') E.push({ ts, st: r.st }); }
  const v = vessel(vid); if (v && v.situ) E.push({ ts: v.situ.ts || +pD(v.situ.at), st: v.situ.st === 'viagem' ? 'viagem' : 'cais', cfg: true });
  E.sort((a, b) => a.ts - b.ts);
  return E.filter((e, i) => !(e.cfg && E.some((x, j) => j !== i && !x.cfg && Math.abs(x.ts - e.ts) < 6e5)));   // a configuração repete o evento do registro
}
function situLocal(vid) { const E = situEventos(vid); return E.length ? E[E.length - 1].st : null; }
// horas do MCA entre dois instantes, pela taxa de cada estado
function horasPorEstado(vid, de, ate, tx) {
  const E = situEventos(vid); let st = (E.filter(e => e.ts <= de).pop() || {}).st || 'cais', t = de, h = 0;
  for (const e of E.filter(e => e.ts > de && e.ts < ate)) { h += (tx[st] || 0) * (e.ts - t) / 864e5; st = e.st; t = e.ts; }
  return h + (tx[st] || 0) * (ate - t) / 864e5;
}
const txMca = e => ({ viagem: e.hv ?? 12, boia: e.hb ?? 12, cais: e.hc ?? 0 });
// estimativa do MCA: taxa por estado (viagem, boia, cais)
function estModal(vid, p) {
  if (!can.admin()) return toast('Somente o Supervisor configura.');
  const v = vessel(vid), e = horEst(v, p) || {}, r = horAtual(vid, p), tx = txMca(e);
  modal(`<h2>${esc(v.nome)} · ${esc(posNome(v, p))} · horas estimadas</h2><p class="note">Para MCA sem horímetro, com horímetro danificado ou obstruído. O SMF parte das horas de hoje e soma pelo estado do empurrador: em viagem e na boia o MCA trabalha; no cais usa energia de terra. Os dois MCAs revezam 12 h cada. Toda hora estimada aparece marcada como "estimada".</p>
   <div class="g"><label class="f s2">Horas estimadas hoje<input id="eH" inputmode="decimal" value="${r ? Math.round(r.h) : ''}"></label><label class="f s1">Em viagem (h/dia)<input id="eV" inputmode="decimal" value="${tx.viagem}"></label><label class="f s1">Na boia (h/dia)<input id="eB" inputmode="decimal" value="${tx.boia}"></label><label class="f s1">No cais (h/dia)<input id="eC" inputmode="decimal" value="${tx.cais}"></label></div>
   <div class="row end">${e.hd || e.modo ? '<button class="mbtn bad" id="eX">Voltar a ler (horímetro consertado)</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="eOk">Salvar estimativa</button></div>`);
  $('#eOk').onclick = async () => { const h = horNum($('#eH').value), hv = horNum($('#eV').value), hb = horNum($('#eB').value), hc = horNum($('#eC').value);
    if (h == null || [hv, hb, hc].some(x => x == null || x < 0 || x > 24)) return toast('Informe as horas de hoje e as horas por dia (0 a 24).');
    v.horEst = v.horEst || {}; v.horEst[p] = { modo: 'estado', h0: h, d0: isoD(hoje()), ts0: Date.now(), hd: hv, hv, hb, hc }; await salvarFrotaCfg(); closeModal(); toast('Estimativa salva.'); horModal(vid); };
  const x = $('#eX'); if (x) x.onclick = () => { closeModal(); horOffModal(vid, p, true); };
}
// horímetro trocado ou consertado: o total continua
const horOff = (v, p, date) => { const L = ((v && v.horOff) || {})[p] || []; return L.filter(o => !date || o.date <= date).pop() || null; };
function horOffModal(vid, p, deEstimativa) {
  if (!can.admin()) return toast('Somente o Supervisor registra a troca do horímetro.');
  const v = vessel(vid), r = horAtual(vid, p);
  modal(`<h2>${esc(v.nome)} · ${esc(posNome(v, p))} · horímetro ${deEstimativa ? 'consertado ou instalado' : 'trocado'}</h2><p class="note">O horímetro novo começa de outro número. O SMF guarda o total do motor no momento da troca e, dali em diante, soma o que o novo marcar: total = total na troca + (leitura do novo − leitura inicial do novo).</p>
   <div class="g"><label class="f s2">Data da troca<input id="oD" type="date" value="${isoD(hoje())}"></label><label class="f s2">Total do motor na troca (h)<input id="oB" inputmode="decimal" value="${r ? Math.round(r.h) : ''}"></label><label class="f s2">Leitura inicial do horímetro novo<input id="oI" inputmode="decimal" value="0"></label></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="oOk">Registrar</button></div>`);
  $('#oOk').onclick = async () => { const d = $('#oD').value, b = horNum($('#oB').value), i = horNum($('#oI').value); if (!d || b == null || i == null) return toast('Informe a data, o total na troca e a leitura inicial.');
    v.horOff = v.horOff || {}; (v.horOff[p] = v.horOff[p] || []).push({ date: d, base: b, ini: i, by: S.session.name }); if (v.horEst) delete v.horEst[p]; await salvarFrotaCfg();
    await saveRec({ id: uid('hor'), kind: 'hor', vessel: v.id, pos: p, date: d, h: b, painel: i, by: S.session.name, obs: 'horímetro ' + (deEstimativa ? 'consertado/instalado' : 'trocado') + ': total na troca' });
    closeModal(); toast('Registrado: a partir de agora digite o número do horímetro novo.'); horModal(vid); };
}
// troca de reversor: os itens do reversor recomeçam na troca (unidade nova, por padrão)
const REV_MODELOS = ['HITACHI', 'MASSON', 'REINTJES'];
function revTrocaModal(vid, p) {
  if (!can.admin()) return toast('Somente o Supervisor registra a troca do reversor.');
  const v = vessel(vid), atual = (v.rev || {})[p] || '', hr = horAtual(vid, p);
  const hist = recs('base').filter(b => b.vessel === vid && b.pos === p && b.revTroca).reduce((a, b) => { if (!a.some(x => x.date === b.date)) a.push(b); return a; }, []).sort((a, b) => a.date < b.date ? 1 : -1);
  modal(`<h2>${esc(v.nome)} · reversor ${esc(posNome(v, p))} trocado</h2><p class="note">O reversor não tem horímetro: conta pelas horas do MCP do mesmo bordo. Na troca, todos os itens do reversor (óleo, revisões) recomeçam a partir desta data e do horímetro do MCP. Se o modelo mudar, os itens do Anexo I mudam junto.</p>
   <div class="g"><label class="f s2">Data da troca<input id="rD" type="date" value="${isoD(hoje())}"></label><label class="f s2">Horímetro do MCP na troca<input id="rH" inputmode="decimal" value="${hr ? Math.round(hr.h) : ''}"></label>
    <label class="f s2">Unidade<select id="rU"><option>Nova</option><option>Revisada</option></select></label>
    <label class="f s2">Modelo<select id="rM">${REV_MODELOS.map(m => `<option value="${m}"${m === atual ? ' selected' : ''}>${esc(EQN[m] || m)}</option>`).join('')}</select></label><label class="f s2">Nº de série<input id="rS"></label><label class="f s2">OM da troca (Sankhya)<input id="rO" inputmode="numeric"></label></div>
   ${hist.length ? `<p class="note"><b>Trocas anteriores:</b> ${hist.map(b => brD(b.date) + ' · ' + esc(b.revTroca.unidade) + ' · ' + esc(EQN[b.revTroca.modelo] || b.revTroca.modelo) + (b.revTroca.serie ? ' · série ' + esc(b.revTroca.serie) : '')).join(' — ')}</p>` : ''}
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="rOk">Registrar a troca</button></div>`);
  $('#rOk').onclick = async () => { const d = $('#rD').value, h = horNum($('#rH').value), m = $('#rM').value; if (!d || h == null) return toast('Informe a data e o horímetro do MCP.');
    if (m !== atual) { v.rev = v.rev || {}; v.rev[p] = m; await salvarFrotaCfg(); }
    const info = { unidade: $('#rU').value, modelo: m, anterior: atual, serie: $('#rS').value.trim(), om: $('#rO').value.trim() }, itens = A1.filter(t => t.eq === m && aplica(v, p, t));
    for (const t of itens) await saveRec({ id: uid('base'), kind: 'base', vessel: v.id, pos: p, item: t.id, date: d, h, by: S.session.name, obs: 'Reversor trocado (' + info.unidade.toLowerCase() + ')' + (info.serie ? ' · série ' + info.serie : ''), revTroca: info });
    closeModal(); toast('Troca do reversor registrada: ' + itens.length + ' item(ns) recomeçam em ' + brD(d) + ' com ' + nf(h) + ' h do MCP.', 6000); render(); };
}
document.addEventListener('click', e => { const a = e.target.closest('[data-hoff],[data-revtroca],[data-sitboia]'); if (!a) return; e.preventDefault(); e.stopPropagation();
  if (a.dataset.sitboia) { const [vid, st] = a.dataset.sitboia.split('|'); if (!precisa(false)) return; saveRec({ id: uid('situ'), kind: 'situ', vessel: vid, st, at: Date.now(), date: isoD(hoje()), by: S.session.name }).then(() => { toast(vName(vid) + ' ' + SITU_TX[st] + '.'); render(); }); return; }
  const vid = ($('#hV') || {}).value; if (!vid) return; if (a.dataset.hoff) horOffModal(vid, a.dataset.hoff); else revTrocaModal(vid, a.dataset.revtroca); }, true);
// Hoje e tela do Operador: cais ou boia (o MCA só trabalha na boia e em viagem)
function situBoiaHTML(v) { const s = situDe(v); if (!s || s.st !== 'porto') return ''; const st = situLocal(v.id) === 'boia' ? 'boia' : 'cais';
  return `<div class="rt2-l"><span>${SITU_TX[st]}</span><span class="sp"></span><button class="mbtn sm" data-sitboia="${v.id}|${st === 'boia' ? 'cais' : 'boia'}">${st === 'boia' ? '⚓ Voltou ao cais' : '🛟 Foi para a boia'}</button></div>`; }
// "O que precisa de você agora": MCA sem leitura há 2 semanas (horímetro danificado?) sem estimativa
document.addEventListener('click', e => { const b = e.target.closest('[data-agest]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const [vid, p] = b.dataset.agest.split('|'); estModal(vid, p); }, true);
