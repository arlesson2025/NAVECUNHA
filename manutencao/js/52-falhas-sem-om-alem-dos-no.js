/* ===== Falhas sem OM: além dos NO do FR 027_L, os NOK da preventiva e as avarias em viagem =====
   Tudo que é falha encontrada e ainda não tem corretiva entra na mesma lista (fr27Pend): conta na situação (Crítica bloqueia, Alta restringe),
   aparece no Hoje e no "O que precisa de você agora", e "Informar OM" abre a corretiva já preenchida.
   NOK da preventiva: "não conforme ou não feito" — o que só não foi feito é marcado "não é falha" e continua vencido no plano.
   Avaria em viagem (kind 'avaria'): o MFM avisa por rádio/Autotrac/telefone; quem recebe registra no cartão do empurrador em viagem. */
'use strict';
const CLS_TX = { 'Crítica': 'risco de incêndio, alagamento, avaria estrutural grave ou dano ambiental (interdita)', 'Alta': 'perda de propulsão, governo, energia ou comunicação', 'Média': 'degradação sem risco iminente', 'Baixa': 'demais casos' };
const CLS_GRAV = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
async function corrDeFalhas(v, num, L, origem, extra) {   // abre uma corretiva para as falhas que receberam o mesmo nº de OM
  if (oms().some(o => o.num === num)) return null;
  L = L.slice().sort((a, b) => (CLS_GRAV[a.c] ?? 9) - (CLS_GRAV[b.c] ?? 9)); const c = L[0].c || 'Média', pos = L[0].pos || 'UN', hr = horAtual(v.id, pos === 'UN' ? mpos(v.id) : pos), agora = isoDT(hoje());
  const o = Object.assign({ id: uid('om'), kind: 'om', tipo: 'C', num, vessel: v.id, pos, status: 'aberta', abertura: agora, sistema: L[0].sis || SISTEMAS[8], classe: c, origem,
    descricao: L.map(x => '• ' + x.lab + (x.d ? ': ' + x.d : '') + ' [' + (x.c || '') + ']').join('\n'), horimetro: hr ? hr.h : '', deteccao: agora, interd: c === 'Crítica' ? 'Sim' : 'N/A', interdDT: c === 'Crítica' ? agora : '',
    comunicado: [], fotos: [], mats: [], medsC: [], hist: [{ at: Date.now(), by: S.session ? S.session.name : '', ev: 'Aberta · ' + origem + ' · ' + c }] }, extra || {});
  await saveRec(o); return o;
}
// ---- NOK da preventiva (lançamento rápido) ----
function nokPend(vid) { const v = vessel(vid), out = [], vistos = new Set();
  oms().filter(o => o.tipo === 'P' && o.vessel === vid && !o.excluido).forEach(o => { const h = o.grupo ? omGrupo(o.grupo)[0] : o; if (!h || vistos.has(h.id)) return; vistos.add(h.id);
    const R = h.rap || {}, res = R.res || {};
    Object.keys(res).filter(k => res[k] === 'nok' && !(h.nokOM || {})[k]).forEach(k => { const [pos, id] = k.split('|'), t = A1M[id]; if (!t) return;
      out.push({ rec: h.id, k, pos, sis: SISTEMAS[parseInt(id) - 1], lab: id + ' ' + (t.chk || t.item) + (pos !== 'UN' ? ' · ' + posCurtoE(v, pos) : ''), d: (R.obs || {})[k] || '', c: (h.nokCls || {})[k] || t.prio || 'Média', o: '', orig: 'Preventiva OM ' + h.num, date: R.dreal || (h.emitAt || '').slice(0, 10) }); }); });
  return out; }
// ---- avaria em viagem ----
const avPend = vid => recs('avaria').filter(r => r.vessel === vid && !r.excluido && !r.om && !r.naoFalha).map(r => ({ rec: r.id, k: 'av', pos: r.pos || 'UN', sis: r.sis, lab: 'Avaria em viagem · ' + (r.sis || ''), d: r.desc, c: r.c, o: '', orig: 'Avaria em viagem (' + (r.meio || '') + ')', date: r.date }));
// "Informar OM" de NOK e de avaria
function falhaPendModal(r) {
  if (r.kind === 'om' && typeof ehOperador === 'function' && ehOperador()) return toast('NOK da preventiva: quem classifica e informa a OM é o Supervisor.');
  const v = vessel(r.vessel), L = r.kind === 'avaria' ? avPend(r.vessel).filter(x => x.rec === r.id) : nokPend(r.vessel).filter(x => x.rec === r.id);
  if (!L.length) return toast('Nada pendente aqui.');
  const tit = r.kind === 'avaria' ? 'Avaria em viagem · ' + esc(v.nome) + ' · ' + brD(r.date) + ' ' + esc(r.hora || '') : 'NOK da preventiva OM ' + esc(r.num) + ' · ' + esc(v.nome);
  modal(`<h2>${tit}</h2><p class="note">Classifique e digite o nº da OM aberta no Sankhya. Itens com o mesmo número viram uma corretiva só.${r.kind === 'avaria' ? '' : ' NOK que <b>não é falha</b> (o item só não foi feito) continua vencido no plano e não abre corretiva.'}</p>
   <div class="tw"><table class="t"><thead><tr><th>Falha</th><th>Classe (NP 5.5.1)</th><th>Nº da OM</th>${r.kind === 'avaria' ? '' : '<th>Não é falha</th>'}</tr></thead><tbody>${L.map(x => `<tr><td><b>${esc(x.lab)}</b>${x.d ? '<div class="note">' + esc(x.d) + '</div>' : ''}</td>
     <td><select data-fpc="${esc(x.k)}">${Object.keys(CLS_TX).map(c => `<option${c === x.c ? ' selected' : ''} title="${esc(CLS_TX[c])}">${c}</option>`).join('')}</select></td><td><input data-fpn="${esc(x.k)}" inputmode="numeric" style="width:110px" placeholder="nº"></td>${r.kind === 'avaria' ? '' : `<td style="text-align:center"><input type="checkbox" data-fpx="${esc(x.k)}"></td>`}</tr>`).join('')}</tbody></table></div>
   <p class="note">${Object.entries(CLS_TX).map(([c, t]) => '<b>' + c + '</b>: ' + t).join(' · ')}</p>
   <div class="note" id="fpE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Fechar</button><button class="mbtn pri" id="fpOk">Gravar</button></div>`, true);
  $('#fpOk').onclick = async () => { const E = $('#fpE'), G = {}; let nx = 0;
    for (const x of L) { const num = ($(`[data-fpn="${x.k}"]`).value || '').replace(/\D/g, ''), c = $(`[data-fpc="${x.k}"]`).value, nf2 = $(`[data-fpx="${x.k}"]`) && $(`[data-fpx="${x.k}"]`).checked;
      if (nf2) { nx++; continue; } if (!num) continue; if (num.length < 3) { E.textContent = 'Nº de OM com 3 dígitos ou mais.'; return; }
      const outra = oms().find(o => o.num === num && o.vessel !== r.vessel); if (outra) { E.textContent = 'OM ' + num + ' é do ' + vName(outra.vessel) + '. Confira o número no Sankhya.'; return; }
      (G[num] = G[num] || []).push(Object.assign({}, x, { c })); }
    if (!Object.keys(G).length && !nx) { E.textContent = 'Digite um nº de OM' + (r.kind === 'avaria' ? '.' : ' ou marque "não é falha".'); return; }
    let novas = 0;
    for (const [num, X] of Object.entries(G)) { const o = await corrDeFalhas(v, num, X, r.kind === 'avaria' ? 'Em viagem (Autotrac)' : 'Preventiva (NOK)', r.kind === 'avaria' ? { avaria: r.id, deteccao: r.at ? isoDT(new Date(r.at)) : isoDT(hoje()) } : { omOrigem: r.num }); if (o) novas++;
      if (r.kind === 'avaria') r.om = num; else { r.nokOM = r.nokOM || {}; r.nokCls = r.nokCls || {}; X.forEach(x => { r.nokOM[x.k] = num; r.nokCls[x.k] = x.c; }); if (r.status !== 'encerrada') { r.anomalia = 'Sim'; r.omCorr = [...new Set([...(r.omCorr && r.omCorr !== 'N/A' ? String(r.omCorr).split(/,\s*/) : []), num])].join(', '); } } }
    if (r.kind !== 'avaria') L.forEach(x => { const c = $(`[data-fpx="${x.k}"]`); if (c && c.checked) { r.nokOM = r.nokOM || {}; r.nokOM[x.k] = 'nao-falha'; } });
    await saveRec(r); closeModal(); toast((novas ? novas + ' corretiva(s) aberta(s)' : 'Gravado') + (nx ? ' · ' + nx + ' NOK marcado(s) como "não é falha"' : '') + '.'); render(); };
}
// registrar avaria em viagem
function avariaModal(vid) {
  if (!precisa(false)) return; const v = vessel(vid), d = new Date(), hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  modal(`<h2>Avaria em viagem · ${esc(v.nome)}</h2><p class="note">O MFM avisou por rádio, Autotrac ou telefone. Registre agora: com o nº da OM do Sankhya vira corretiva; sem o número fica pendente na Frota até ganhar a OM. Crítica e Alta já contam na situação do empurrador.</p>
   <div class="g"><label class="f s2">Data<input id="avD" type="date" value="${isoD(hoje())}"></label><label class="f s1">Hora<input id="avH" type="time" value="${hh}"></label>
    <label class="f s2">Quem avisou<input id="avQ" placeholder="Nome e função (ex.: João, MFM)"></label><label class="f s1">Como<select id="avM"><option>Rádio</option><option>Autotrac</option><option>Telefone / WhatsApp</option><option>Outro</option></select></label>
    <label class="f s3">Sistema (lista 7.1)<select id="avS"><option value="">Escolha…</option>${SISTEMAS.map(s => `<option>${esc(s)}</option>`).join('')}</select></label><label class="f s2">Posição<select id="avP">${optsPos(vid)}</select></label>
    <label class="f s1">Classe<select id="avC"><option value="">Escolha…</option>${Object.keys(CLS_TX).map(c => `<option title="${esc(CLS_TX[c])}">${c}</option>`).join('')}</select></label>
    <label class="f s6">O que aconteceu<textarea id="avT" rows="3" placeholder="Sintoma, onde, o que a tripulação já fez, se o empurrador segue navegando"></textarea></label>
    <label class="f s2">Nº da OM no Sankhya (se já abriu)<input id="avO" inputmode="numeric" placeholder="opcional"></label></div>
   <p class="note">${Object.entries(CLS_TX).map(([c, t]) => '<b>' + c + '</b>: ' + t).join(' · ')}</p>
   <div class="note" id="avE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="avOk">Registrar a avaria</button></div>`, true);
  $('#avOk').onclick = async () => { const E = $('#avE'), sis = $('#avS').value, c = $('#avC').value, desc = $('#avT').value.trim(), quem = $('#avQ').value.trim(), num = $('#avO').value.replace(/\D/g, '');
    if (!sis || !c || !desc || !quem) { E.textContent = 'Preencha quem avisou, o sistema, a classe e o que aconteceu.'; return; }
    if (num && num.length < 3) { E.textContent = 'Nº de OM com 3 dígitos ou mais.'; return; }
    if (num) { const outra = oms().find(o => o.num === num); if (outra) { E.textContent = 'A OM ' + num + ' já existe' + (outra.vessel !== vid ? ' no ' + vName(outra.vessel) : '') + '.'; return; } }
    const [y, mo, dd] = $('#avD').value.split('-').map(Number), [h, mi] = ($('#avH').value || hh).split(':').map(Number), at = new Date(y, mo - 1, dd, h, mi).getTime();
    const r = { id: uid('av'), kind: 'avaria', vessel: vid, date: $('#avD').value, hora: $('#avH').value, at, quem, meio: $('#avM').value, sis, pos: $('#avP').value, c, desc: desc + ' (avisado por ' + quem + ', ' + $('#avM').value.toLowerCase() + ')', om: '', by: S.session.name };
    await saveRec(r);
    if (num) { await corrDeFalhas(v, num, [{ lab: 'Avaria em viagem · ' + sis, d: r.desc, c, pos: r.pos, sis }], 'Em viagem (Autotrac)', { avaria: r.id, deteccao: isoDT(new Date(at)) }); r.om = num; await saveRec(r); }
    closeModal(); toast('Avaria registrada' + (num ? ' · corretiva ' + num + ' aberta' : ' · pendente de OM na Frota') + '.', 6000); render(); };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-avaria]'); if (!b) return; e.preventDefault(); e.stopPropagation(); avariaModal(b.dataset.avaria); }, true);
