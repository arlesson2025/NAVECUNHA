/* ===== Registro de saída da viagem: situação técnica congelada no momento da saída e quem assumiu cada pendência =====
   kind 'saida' · liberada: o Supervisor só confirma · com restrição: justificativa + foto do FR 027_L de saída · bloqueada ou interditada: justificativa + Coordenador de Operações que autorizou + foto.
   A lista de pendências fica gravada como estava na hora da saída (não se reescreve depois). Mesma regra de situação da Situação da frota (frotaMatriz). */
'use strict';
const SAI_SIT = [['o', 'Liberada'], ['a', 'Com restrição'], ['v', 'Saída bloqueada'], ['v', 'Interditada']];
function saidaFoto(v) {   // situação técnica agora: mesma conta da Situação da frota
  const p = painelVessel(v).filter(x => x.s.st === 'venc');   // só o vencido: o "vence na viagem" saiu da saída (decisão do Supervisor, 21/10/2026)
  const it = interditada(v.id), bq = p.filter(x => x.s.st === 'venc' && x.t.prio === 'Crítica' && !x.om);
  let sit = it ? 3 : bq.length ? 2 : p.some(x => x.s.st === 'venc') ? 1 : 0;
  const no = typeof fr27Pend === 'function' ? fr27Pend(v.id) : [];   // NO do FR 027_L ainda sem OM: Crítica bloqueia, Alta restringe
  if (sit < 2 && no.some(x => x.c === 'Crítica')) sit = 2; else if (sit < 1 && no.some(x => x.c === 'Alta')) sit = 1;
  const pend = p.sort((a, b) => (a.s.st === 'venc' ? 0 : 1) - (b.s.st === 'venc' ? 0 : 1) || (b.t.prio === 'Crítica') - (a.t.prio === 'Crítica'))
    .map(x => ({ item: x.t.id, nome: x.t.chk || x.t.item, pos: x.pos, st: x.s.st, txt: x.s.txt || '', prio: x.t.prio || '', om: x.om ? x.om.num : '', bloq: bq.includes(x) }));
  const corr = oms().filter(o => o.vessel === v.id && o.tipo === 'C' && o.status !== 'encerrada').map(o => ({ num: o.num, classe: o.classe || '', desc: (o.descricao || '').slice(0, 140), interd: o.interd === 'Sim' }));
  const F = { sit, pend, corr, no }, P = popaPend(v);   // troca de óleo do motor de popa / motobomba a cada saída: restrição
  if (P.length) { F.pend = (F.pend || []).concat(P.map(e => ({ item: e.itens[0], nome: 'Troca de óleo ' + popaDo(e) + ' (a cada saída)', pos: 'UN', st: 'venc', txt: 'sem FR 049_B desde a chegada', prio: 'Média', om: '', bloq: false }))); if (F.sit < 1) F.sit = 1; }
  return F;
}

function saidaLista(F) {
  const pr = x => `<li><span class="pill ${x.st === 'venc' ? (x.bloq ? 'p-bad' : 'p-warn') : 'p-inf'}">${x.st === 'venc' ? (x.bloq ? 'bloqueia' : 'vencido') : 'vence na viagem'}</span> <b>${esc(x.item)}</b> ${esc(x.nome)}${x.pos && x.pos !== 'UN' ? ' · ' + esc(x.pos) : ''}${x.om ? ' · <span class="note">OM ' + esc(x.om) + '</span>' : ''}</li>`;
  const cr = c => `<li><span class="pill ${c.interd ? 'p-bad' : 'p-warn'}">corretiva${c.classe ? ' ' + esc(c.classe) : ''}</span> OM ${esc(c.num || '—')}${c.desc ? ' · ' + esc(c.desc) : ''}${c.interd ? ' · <b>interdita</b>' : ''}</li>`;
  const nc = x => `<li><span class="pill ${x.c === 'Crítica' ? 'p-bad' : x.c === 'Alta' ? 'p-warn' : 'p-inf'}">NO ${esc(x.c || '')}</span> ${esc(x.lab)}${x.d ? ' · ' + esc(x.d) : ''}${x.o ? ' · <span class="note">OM ' + esc(x.o) + '</span>' : ' · <b>sem OM</b>'}</li>`, N = F.nc || [];
  return F.pend.length || F.corr.length || N.length ? `<ul class="sai-l">${F.corr.map(cr).join('')}${N.map(nc).join('')}${F.pend.map(pr).join('')}</ul>` : '<p class="note">Nenhuma pendência técnica.</p>';
}
function saidaModal(vid, fr) {
  if (!precisa(false)) return; const v = vessel(vid); if (!v) return;
  const F = saidaFoto(v); F.nc = (fr ? fr.nc || [] : []).concat((F.no || []).filter(x => !fr || x.rec !== fr.id)); if (fr && F.sit < 3) F.sit = Math.max(F.sit, (FR27_LIB[fr.lib] || [0, 0])[1]);   // vale a pior: plano (SMF) ou check-list (FR 027_L)
  const [cls, nome] = SAI_SIT[F.sit], d = new Date(), hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const hr = horAtual(v.id, mpos(v.id)), hrHoje = hr && hr.date === isoD(hoje());
  let img = null; const rt = rotaDe(v);
  const i53 = `<div class="f s6 i53"><div class="row" style="align-items:center"><b>Inspeção antes da saída · NP 5.3</b><span class="note" style="margin-left:6px">CTF/MFM, antes de ligar os motores · registrada no Diário de Máquinas</span><span class="sp"></span><button type="button" class="mbtn sm" id="i53All">Marcar todos</button></div>
    <div class="i53-l">${INSP53.map((t, i) => `<label><input type="checkbox" data-i53="${i}"> ${esc(t)}</label>`).join('')}</div>
    <div class="g" style="margin-top:6px"><label class="f s3">Feita por (CTF ou MFM)<input id="i53Q" placeholder="Nome de quem fez"></label><label class="f s3">Irregularidade ou item não feito<input id="i53O" placeholder="Obrigatório se algum item ficar sem marcar"></label></div>
    <p class="note" style="margin:4px 0 0">A NP trata esta inspeção como requisito para liberar a saída. Irregularidade encontrada segue a NP 5.4.1 (comunicar e abrir a OM).</p></div>`;
  const m = modal(`<h2>Registrar saída · ${esc(v.nome)}</h2>
   <p class="note">Fica gravado como estava a parte técnica na hora da saída e quem assumiu cada pendência. A decisão de sair é da Operação; aqui fica o registro.</p>
   <div class="row" style="gap:8px;align-items:center;margin:6px 0 10px"><span class="fs-p ${cls}">${nome}</span><span class="note">${F.pend.filter(x => x.st === 'venc').length} vencido(s) · ${F.corr.length} corretiva(s) aberta(s)${fr ? ' · FR 027_L: ' + esc(FR27_LIB[fr.lib][0]) + ', ' + (fr.nc || []).length + ' NO' : ''}</span></div>
   ${saidaLista(F)}
   <div class="g" style="margin-top:10px"><label class="f s6">Rota desta viagem<select id="saRota"><option value="">—</option>${rotas().map(x => `<option value="${x.id}"${rt && rt.id === x.id ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label><label class="f s2">Data<input type="date" id="saD" value="${isoD(hoje())}"></label><label class="f s1">Hora<input type="time" id="saH" value="${hh}"></label>
    <div class="f s3"><span>Horímetro</span><div class="note" style="padding-top:6px">${hr ? 'último: ' + nf(hr.h) + ' h em ' + brD(hr.date) : 'sem leitura'}${hrHoje ? '' : ' · <label style="display:inline;font-weight:400"><input type="checkbox" id="saHor" checked> lançar o de saída (FR 027_L) depois de salvar</label>'}</div></div>
    ${F.sit ? `<label class="f s6">Justificativa ${F.sit >= 2 ? '(por que sai mesmo assim)' : '(por que sai com o vencido)'}<textarea id="saJ" rows="2" placeholder="Ex.: item programado para a próxima janela; risco avaliado com a Operação"></textarea></label>` : ''}
    ${F.sit >= 2 ? `<label class="f s6">Autorizado por · Coordenador de Operações<input id="saC" placeholder="Nome de quem autorizou a saída" value="${esc(fr ? ((fr.ass || [])[2] || {}).nome || '' : '')}"></label>` : ''}
    ${fr ? `<div class="f s6 note">✓ FR 027_L de saída assinado e salvo (PDF no Drive) · ${brD(fr.date)} ${esc(fr.hora || '')}</div>` : F.sit ? `<label class="f s6">Foto do FR 027_L de saída assinado<input type="file" id="saF" accept="image/*" capture="environment"></label><div id="saFv"></div>` : ''}${i53}</div>
   <div class="err" id="saE" style="color:var(--badt);min-height:18px"></div>
   <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="saOk">${F.sit ? 'Registrar a saída' : 'Confirmar a saída'}</button></div>`, true);
  const fi = $('#saF'); if (fi) fi.onchange = () => { const f = fi.files && fi.files[0]; if (!f) return; const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { img = im; $('#saFv').innerHTML = `<img src="${fotoMini(im)}" style="max-width:180px;border-radius:6px;margin-top:6px">`; }; im.src = u; };
  $('#i53All').onclick = () => document.querySelectorAll('#modal [data-i53]').forEach(c => c.checked = true);
  $('#saOk').onclick = async () => {
    const ok53 = [...document.querySelectorAll('#modal [data-i53]')].filter(c => c.checked).map(c => +c.dataset.i53), q53 = $('#i53Q').value.trim(), o53 = $('#i53O').value.trim(), rid = $('#saRota').value;
    const j = ($('#saJ') || {}).value || '', c = ($('#saC') || {}).value || '', E = $('#saE');
    if (!q53) { E.textContent = 'Informe quem fez a inspeção antes da saída (CTF ou MFM) · NP 5.3.'; return; }
    if (ok53.length < INSP53.length && !o53) { E.textContent = 'Algum item da inspeção 5.3 ficou sem marcar: escreva a irregularidade ou o que não foi feito.'; return; }
    if (F.sit && !j.trim()) { E.textContent = 'Escreva a justificativa.'; return; }
    if (F.sit >= 2 && !c.trim()) { E.textContent = 'Informe o Coordenador de Operações que autorizou.'; return; }
    if (F.sit && !img && !fr) { E.textContent = 'Anexe a foto do FR 027_L de saída assinado.'; return; }
    const b = $('#saOk'); b.disabled = true; b.textContent = 'Salvando…';
    const date = $('#saD').value || isoD(hoje()), hora = $('#saH').value || hh;
    let foto = {};
    if (img) { if (S.url) { try { const r = await api('foto', { b64: await fotoParaEnvio(img), vessel: v.id, nome: 'FR027L_saida_' + v.nome + '_' + date }); foto = r.ok ? { fotoId: r.fileId } : { fotoMin: fotoMini(img) }; } catch (er) { foto = { fotoMin: fotoMini(img) }; } } else foto = { fotoMin: fotoMini(img) }; }
    await saveRec(Object.assign({ id: uid('sai'), kind: 'saida', vessel: v.id, date, hora, at: Date.now(), sit: F.sit, sitTxt: nome, pend: F.pend, corr: F.corr, nc: F.nc || [], fr027: fr ? fr.id : '', frLib: fr ? fr.lib : '', just: j.trim(), autorizou: c.trim(), by: S.session ? S.session.name : '', hr: hr ? { h: hr.h, date: hr.date } : null }, foto, rid ? { rota: rid, rotaNome: (rotas().find(x => x.id === rid) || {}).nome || '' } : {},
      { insp53: { ok: ok53, falta: INSP53.map((t, i) => i).filter(i => !ok53.includes(i)), quem: q53, obs: o53, completa: ok53.length === INSP53.length } }));
    await situSalvar(v.id, 'viagem'); closeModal();
    toast(v.nome + ' saiu de viagem · ' + nome.toLowerCase() + ' registrada.');
    if ($('#saHor') && $('#saHor').checked) horModal(v.id); else render();
    if (ok53.length < INSP53.length) toast('Saída registrada com a inspeção 5.3 incompleta: ' + o53); };
}
// "Saiu de viagem" abre primeiro o FR 027_L de saída (bloco FR 027_L), que depois chama saidaModal(vid, fr)
// Hoje · em viagem: como saiu (situação registrada na saída)

{ const st = document.createElement('style'); st.textContent = `.sai-l{list-style:none;padding:0;margin:4px 0;display:flex;flex-direction:column;gap:5px;font-size:13.5px;max-height:240px;overflow:auto}
 .sai-tag{border:0;cursor:pointer;font:inherit;font-size:11.5px;font-weight:600;margin-left:6px}`; document.head.appendChild(st); }
