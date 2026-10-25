/* ===== FR 027_L · check-list de chegada e saída no terminal, dentro do SMF (formulário oficial em forms/FR_027_L.html, sem alteração) =====
   "Chegou em Manaus" / "Saiu de viagem" abrem o FR 027_L já identificado. Assinaturas pelo toque (Operador/Líder, CTF, Coord. de Operações).
   Ao salvar: PDF das folhas no Drive (kind 'fr027'), horímetros do C1 lançados no SMF, cada NO com nº de OM vira corretiva (origem FR 027_L),
   NO sem nº fica pendente no Hoje até ganhar OM. Na saída, o registro de saída junta o FR 027_L (C12/C13) e o plano (pior das duas regras). */
'use strict';
const FR27_SIS = { geral: 9, cmd: 7, maq: 1, rev: 1, prop: 1, gov: 2, ele: 3, comb: 6, cabo: 8, bote: 5 };   // seção do FR 027_L → sistema da lista 7.1 (1 = Propulsão …)
const FR27_SIS_ITEM = { 'geral-1': 1, 'geral-2': 10, 'geral-3': 8, 'geral-6': 5, 'geral-7': 5, 'geral-8': 8, 'geral-9': 8, 'geral-10': 3, 'geral-11': 2, 'geral-12': 4, 'cmd-3': 1, 'cmd-4': 1, 'cmd-5': 1, 'cmd-6': 1, 'cmd-7': 3, 'cmd-10': 11, 'cmd-11': 11, 'cmd-12': 11 };
const FR27_GRAV = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
const FR27_LIB = { ok: ['Liberado', 0], rest: ['Liberado com restrição', 1], nao: ['NÃO LIBERADO', 2] };
const FR27_FUNC = ['Operador / Líder', 'CTF', 'Coordenador de Operações'];
const fr27s = vid => recs('fr027').filter(r => r.vessel === vid).sort((a, b) => (a.at || 0) - (b.at || 0));
function fr27Sis(k) { const row = k.replace(/-\d+$/, ''), sec = k.split('-')[0]; let n = FR27_SIS_ITEM[row] || FR27_SIS[sec] || 9; if (sec === 'maq' && /-[23]$/.test(k)) n = 3; return SISTEMAS[n - 1] || SISTEMAS[8]; }
function fr27Pos(v, k) { const sec = k.split('-')[0], col = +k.split('-').pop(), P = mcpPos(v);
  if (sec === 'maq') return col === 0 ? P[0] : col === 1 ? (P[1] || P[0]) : col === 2 ? 'MCA1' : 'MCA2';
  if (sec === 'rev' || sec === 'prop' || (sec === 'cmd' && /^cmd-[34]-/.test(k))) return /^cmd-4-/.test(k) || col === 1 ? (P[1] || P[0]) : P[0];
  return 'UN'; }
// ---------- assinatura pelo toque (tela cheia) ----------
function fr27Pad(titulo) { return new Promise(ok => {
  const o = document.createElement('div'); o.className = 'fr27-pad';
  o.innerHTML = `<div class="fr27-pb"><b>${esc(titulo)}</b><span class="sp"></span><button data-p="limpar">Limpar</button><button data-p="cancelar">Cancelar</button><button data-p="ok" class="pri">Confirmar assinatura</button></div><canvas></canvas><p>Assine com o dedo ou a caneta dentro do quadro.</p>`;
  document.body.appendChild(o); const cv = o.querySelector('canvas'), r = cv.getBoundingClientRect(), k = window.devicePixelRatio || 1;
  cv.width = r.width * k; cv.height = r.height * k; const x = cv.getContext('2d'); x.scale(k, k); x.lineWidth = 2.4; x.lineCap = x.lineJoin = 'round'; x.strokeStyle = '#0B1F44';
  let des = false, tem = false; const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = e => { des = true; tem = true; cv.setPointerCapture(e.pointerId); const [a, b] = pt(e); x.beginPath(); x.moveTo(a, b); };
  cv.onpointermove = e => { if (!des) return; const [a, b] = pt(e); x.lineTo(a, b); x.stroke(); };
  cv.onpointerup = () => { des = false; };
  o.onclick = e => { const b = e.target.closest('[data-p]'); if (!b) return; const a = b.dataset.p;
    if (a === 'limpar') { x.clearRect(0, 0, cv.width, cv.height); tem = false; return; }
    if (a === 'cancelar') { o.remove(); ok(null); return; }
    if (!tem) { o.querySelector('p').textContent = 'Assine antes de confirmar.'; return; }
    const c = document.createElement('canvas'), w = 520; c.width = w; c.height = Math.round(cv.height * w / cv.width); const y = c.getContext('2d'); y.drawImage(cv, 0, 0, c.width, c.height);
    o.remove(); ok(c.toDataURL('image/png')); }; }); }
function fr27Assinaturas(doc) {
  doc.querySelectorAll('#sec-c13 .sgg > div').forEach((d, i) => {
    if (d.querySelector('.fr27-sb')) return; const b = doc.createElement('button'); b.type = 'button'; b.className = 'fr27-sb noprint'; b.textContent = '✍ Assinar';
    b.style.cssText = 'margin-top:4px;font:600 12px system-ui;border:1px solid #1967D2;color:#1967D2;background:#fff;border-radius:6px;padding:4px 10px;cursor:pointer';
    b.onclick = async () => { const nome = (d.querySelector('input') || {}).value || ''; const img = await fr27Pad('Assinatura · ' + FR27_FUNC[i] + (nome.trim() ? ' · ' + nome.trim() : ''));
      if (!img) return; const slot = d.querySelector('i'); slot.innerHTML = `<img src="${img}" alt="assinatura" style="display:block;height:14mm;max-width:100%;margin:0 auto">`; slot.style.borderBottom = 'none'; b.textContent = '✍ Assinar de novo'; };
    d.appendChild(b); }); }
// ---------- abrir ----------
async function fr27Abrir(vid, mov) {
  if (!precisa(false)) return; const v = vessel(vid); if (!v) return;
  const movTxt = mov === 'Saida' ? 'Saída' : 'Chegada';
  const o = lubOverlay('fr27FO', `📋 FR 027_L · Check-list de ${movTxt.toLowerCase()} · ${esc(v.nome)}`, `<button data-fo="salvar" class="pri">💾 Salvar no SMF</button><button data-fo="sem">${mov === 'Saida' ? 'Sair sem o formulário' : 'Chegou sem o formulário'}</button>`);
  o.querySelector('[data-fo="fechar"]').onclick = () => { if (confirm('Fechar o FR 027_L sem salvar? O que foi marcado será perdido.')) lubFecharOverlay('fr27FO'); };
  o.querySelector('[data-fo="sem"]').onclick = async () => {
    if (mov === 'Saida') { lubFecharOverlay('fr27FO'); saidaModal(vid); return; }
    if (!confirm('Registrar a chegada sem o FR 027_L? A NP 055 pede o check-list em toda chegada.')) return;
    lubFecharOverlay('fr27FO'); await situSalvar(vid, 'porto'); toast(v.nome + ' no porto de Manaus (sem FR 027_L).'); render(); };
  const fr = o.querySelector('iframe');
  fr.onload = () => { try { const d = fr.contentDocument, w = fr.contentWindow, ch = el => el && el.dispatchEvent(new Event('change', { bubbles: true }));
    const e = d.getElementById('emp'); e.value = nomeLongo(v.nome); ch(e); e.dispatchEvent(new Event('input', { bubbles: true }));
    d.getElementById('dt').value = isoD(hoje()); const n = new Date(); d.getElementById('hr').value = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    const r = d.querySelector(`input[name=mov][value="${mov}"]`); if (r) { r.checked = true; ch(r); }
    const pm = d.querySelector(`input[name=cfgmcp][value="${mcpPos(v).length > 1 ? 2 : 1}"]`); if (pm && !pm.checked) { pm.checked = true; ch(pm); }
    [1, 2].forEach(i => { const m = (v.mca || {})['MCA' + i]; if (!m) return; const x = d.querySelector(`input[name=mdl${i}][value="${/yan/i.test(m) ? 'Yanmar' : 'MWM'}"]`); if (x) { x.checked = true; ch(x); } });
    // dentro do SMF quem grava é "Salvar no SMF": some o Salvar/Imprimir/Limpar do próprio formulário (baixam arquivo e não gravam no SMF)
    d.querySelectorAll('.toolbar button').forEach(bt => { if (/^(Salvar|Imprimir|Limpar)/.test(bt.textContent.trim())) bt.style.display = 'none'; });
    fr27Assinaturas(d); } catch (er) { console.warn(er); } };
  o.querySelector('[data-fo="salvar"]').onclick = () => fr27Salvar(v, mov, fr.contentWindow, o);
  let txt = null; for (let i = 0; i < 3 && !txt; i++) { try { txt = await lubFormTxt('FR_027_L.html'); } catch (er) { await new Promise(r => setTimeout(r, 700)); } }   // 3 tentativas (sinal fraco no terminal)
  if (!txt) { lubFecharOverlay('fr27FO'); alert('Não consegui abrir o FR 027_L: sem conexão e sem cópia guardada neste aparelho. Abra o SMF uma vez com sinal para ele guardar o formulário, ou use o FR 027_L em papel e registre depois.'); return; }
  fr.srcdoc = txt;
  const preenche = () => { try { const d = fr.contentDocument, ch = el => el && el.dispatchEvent(new Event('change', { bubbles: true }));   // FR 022_B e, na saída, as OMs pendentes da chegada (bloco "Terminal")
    const u = fr22Ult(vid), f = d.getElementById('fr22'); if (u && f && !f.value) { f.value = u; ch(f); }
    if (mov === 'Saida') { const O = omsDaChegada(vid); if (O) { const st = !O.nums.length ? 'nao' : O.abertas.length ? 'aberto' : 'res', r = d.querySelector(`input[name=ompend][value="${st}"]`); if (r) { r.checked = true; ch(r); }
      const t = d.querySelector('#sec-c13 .cl1 input.mini'); if (t && O.nums.length) t.value = (O.abertas.length ? O.abertas : O.nums).join(', '); } } } catch (e) { console.warn(e); } };
  if (fr.contentDocument && fr.contentDocument.getElementById('fr22')) preenche(); else fr.addEventListener('load', () => setTimeout(preenche, 50), { once: true });
}
// ---------- ler o que foi marcado ----------
function fr27Ler(win) {
  const doc = win.document, q = s => doc.querySelector(s), val = s => ((q(s) || {}).value || '').trim(), rad = n => (doc.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
  const vis = td => (typeof win.vis === 'function' ? win.vis(td) : true);
  const trs = [...doc.querySelectorAll('table.hrs tbody tr')], H = trs[0] ? [...trs[0].querySelectorAll('td input')] : [], RPM = trs[1] ? [...trs[1].querySelectorAll('td input')] : [];
  const hv = H.map(i => getComputedStyle(i.closest('td')).display !== 'none' ? i.value.trim() : null), rpm = RPM.map(i => i.value.trim());
  const res = {}; [...doc.querySelectorAll('td.c[data-key]')].filter(vis).forEach(td => { const c = td.querySelector('input:checked'); res[td.dataset.key] = c ? c.value : ''; });
  const nc = [...doc.querySelectorAll('table.nc tbody tr')].filter(tr => tr.dataset.k).map(tr => ({ k: tr.dataset.k, lab: tr.querySelector('.nci').textContent.trim(), d: tr.querySelector('.ncd').value.trim(), c: tr.querySelector('.ncc').value, o: tr.querySelector('.nco').value.trim().replace(/\D/g, '') }));
  const ass = [...doc.querySelectorAll('#sec-c13 .sgg > div')].map((d, i) => ({ func: FR27_FUNC[i], nome: ((d.querySelector('input') || {}).value || '').trim(), ok: !!d.querySelector('i img') }));
  return { emp: val('#emp'), date: val('#dt'), hora: val('#hr'), mov: rad('mov'), local: val('#loc'), prop: rad('cfgmcp'), mdl: [rad('mdl1'), rad('mdl2')], hv, rpm, res, nc, obs: val('#obs'),
    fr22: { date: val('#fr22'), st: rad('fr22s') }, ompend: { st: rad('ompend'), txt: ((q('#sec-c13 .cl1 input.mini') || {}).value || '').trim() }, lib: rad('lib'), libom: val('#libom'), ass };
}
function fr27Faltas(D) {
  const f = [], sem = Object.values(D.res).filter(x => !x).length;
  if (!D.mov) f.push('Movimento (chegada ou saída) no C1');
  if (!D.prop) f.push('Propulsão (1 ou 2 MCPs) no C1');
  if (D.hv[0] === '' || (D.prop === '2' && D.hv[1] === '')) f.push('Horímetro do MCP no C1');
  if (sem) f.push(sem + ' resultado(s) sem marcação (OK / NO / N/A)');
  if (D.nc.some(x => !x.c)) f.push('Criticidade de todo item NO (C12)');
  if (D.nc.some(x => !x.d)) f.push('Descrição de todo item NO (C12)');
  if (!D.lib) f.push('Condição para navegar (C13)');
  else if (D.nc.some(x => x.c === 'Crítica') && D.lib !== 'nao') f.push('Há NO Crítico: a condição para navegar tem de ser NÃO LIBERADO (NP 5.5.1)');
  else if (D.lib === 'rest' && !D.libom) f.push('Nº da OM da restrição (C13)');
  if (!D.ompend.st) f.push('Situação das OMs pendentes da chegada (C13)');
  if (!D.fr22.date || !D.fr22.st) f.push('Data da última inspeção do SESMT (FR 022_B)');
  D.ass.forEach(a => { if (!a.nome) f.push('Nome · ' + a.func); if (!a.ok) f.push('Assinatura · ' + a.func); });
  return f;
}
// ---------- PDF das folhas visíveis ----------
async function fr27Pdf(win) {
  await carregarLibsPdf().catch(() => { }); if (!window.jspdf || !window.html2canvas) throw new Error('bibliotecas de PDF não carregaram');
  const doc = win.document; if (win.bake) win.bake();
  const sheets = [...doc.querySelectorAll('.sheet')].filter(s => !s.classList.contains('hid')), { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const prep = d => { const st = d.createElement('style'); st.textContent = '.toolbar,.svm,.noprint,.omh,.fr27-sb{display:none!important}.miss,tr.miss td{background:transparent!important}'; d.head.appendChild(st); d.querySelectorAll('input').forEach(i => i.removeAttribute('placeholder')); };
  const sx = win.scrollX, sy = win.scrollY; win.scrollTo(0, 0);
  try { for (let i = 0; i < sheets.length; i++) { const cv = await html2canvas(sheets[i], { scale: 2.4, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: Math.max(1000, win.innerWidth), scrollX: 0, scrollY: 0, onclone: prep });
      if (i) pdf.addPage('a4', 'portrait'); pdf.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST'); cv.width = cv.height = 0; } }
  finally { win.scrollTo(sx, sy); }
  return pdf;
}
// ---------- corretivas a partir das NOs com nº de OM ----------
async function fr27Corretivas(rec) {
  const v = vessel(rec.vessel), G = {}, novas = [];
  rec.nc.filter(x => /^\d{3,}$/.test(x.o)).forEach(x => (G[x.o] = G[x.o] || []).push(x));
  for (const [num, L] of Object.entries(G)) {
    if (oms().some(o => o.num === num)) continue;
    L.sort((a, b) => (FR27_GRAV[a.c] ?? 9) - (FR27_GRAV[b.c] ?? 9)); const c = L[0].c || 'Média', pos = fr27Pos(v, L[0].k), hr = horAtual(v.id, pos === 'UN' ? mpos(v.id) : pos), agora = isoDT(hoje());
    const o = { id: uid('om'), kind: 'om', tipo: 'C', num, vessel: v.id, pos, status: 'aberta', abertura: agora, sistema: fr27Sis(L[0].k), classe: c, origem: 'FR 027_L',
      descricao: 'FR 027_L · ' + (rec.mov === 'saida' ? 'saída' : 'chegada') + ' ' + brD(rec.date) + ':\n' + L.map(x => '• ' + x.lab + ': ' + x.d + ' [' + x.c + ']').join('\n'),
      horimetro: hr ? hr.h : '', deteccao: agora, interd: c === 'Crítica' ? 'Sim' : 'N/A', interdDT: c === 'Crítica' ? agora : '', comunicado: [], fotos: [], mats: [], medsC: [], fr027: rec.id,
      hist: [{ at: Date.now(), by: S.session ? S.session.name : '', ev: 'Aberta pelo FR 027_L · ' + c }] };
    await saveRec(o); novas.push(num); }
  return novas;
}
const fr27SemOM = r => (r.nc || []).filter(x => !/^\d{3,}$/.test(x.o || ''));
// ---------- salvar ----------
async function fr27Salvar(v, mov, win, ov) {
  let D; try { D = fr27Ler(win); } catch (e) { alert('Não consegui ler o formulário: ' + e.message); return; }
  const F = fr27Faltas(D); if (F.length) { alert('Falta preencher no FR 027_L:\n• ' + F.join('\n• ')); return; }
  const outra = D.nc.filter(x => /^\d{3,}$/.test(x.o)).map(x => [x, oms().find(o => o.num === x.o && o.vessel !== v.id)]).filter(y => y[1]);
  if (outra.length) { alert('Nº de OM que já pertence a outro empurrador:\n• ' + outra.map(([x, o]) => 'OM ' + x.o + ' é do ' + vName(o.vessel) + ' (' + x.lab + ')').join('\n• ') + '\nConfira o número no Sankhya.'); return; }
  const dup = fr27s(v.id).find(r => r.mov === (mov === 'Saida' ? 'saida' : 'chegada') && r.date === D.date);
  if (dup && !confirm('Já existe um FR 027_L de ' + (mov === 'Saida' ? 'saída' : 'chegada') + ' do ' + v.nome + ' salvo hoje' + (dup.hora ? ' às ' + dup.hora : '') + '.\nSalvar outro mesmo assim?')) return;
  const semOM = D.nc.filter(x => !/^\d{3,}$/.test(x.o)).length;
  if (semOM && !confirm(semOM + ' item(ns) NO sem nº de OM. Salvar assim mesmo? Eles ficam pendentes na Frota até você informar a OM do Sankhya.')) return;
  const busy = ov.querySelector('.fo-busy'), msg = t => { busy.hidden = false; busy.querySelector('.fo-msg').textContent = t; };
  try {
    msg('Gerando o PDF do FR 027_L…'); const pdf = await fr27Pdf(win);
    msg('Gravando, lançando horímetros e abrindo corretivas…');
    const P = mcpPos(v), posH = [P[0], P[1] || null, 'MCA1', 'MCA2'], hor = {};
    D.hv.forEach((h, i) => { const pos = posH[i]; if (!pos || h == null || h === '') return; const n = numBR(h); if (n == null) return; const tot = n >= VOLTA ? n : (horPainelTotal(v.id, pos, n, D.date) ?? n); hor[pos] = { painel: n, total: tot }; });
    const rec = { id: uid('fr27'), kind: 'fr027', vessel: v.id, mov: mov === 'Saida' ? 'saida' : 'chegada', date: D.date, hora: D.hora, local: D.local, prop: D.prop, mdl: D.mdl, hor, rpm: D.rpm, res: D.res, nc: D.nc,
      obs: D.obs, fr22: D.fr22, ompend: D.ompend, lib: D.lib, libom: D.libom, ass: D.ass.map(a => ({ func: a.func, nome: a.nome })), assAt: Date.now(), by: S.session ? S.session.name : '', at: Date.now() };
    await saveRec(rec, { pdfB64: pdf.output('datauristring').split(',')[1] });
    let nh = 0, nr = 0; for (const [pos, x] of Object.entries(hor)) { if (await lubHor(v.id, pos, x.total, D.date, 'FR 027_L ' + (rec.mov === 'saida' ? 'saída' : 'chegada'))) { nh++; continue; }
      if (!(x.total > 0) || recs('hor').some(r => r.vessel === v.id && r.pos === pos && r.date === D.date && r.h === x.total)) continue;   // repetida: nada a fazer
      await saveRec({ id: uid('horp'), kind: 'horp', vessel: v.id, pos, date: D.date, h: x.total, painel: x.painel < VOLTA ? x.painel : null, by: S.session ? S.session.name : '', motivo: 'FR 027_L: leitura incoerente com o histórico (menor que uma anterior ou maior que uma posterior)', fr027: rec.id }); nr++; }
    const novas = await fr27Corretivas(rec);
    busy.hidden = true; lubFecharOverlay('fr27FO');
    const nNO = D.nc.length, txt = `FR 027_L de ${rec.mov === 'saida' ? 'saída' : 'chegada'} salvo · ${v.nome}: ${nNO ? nNO + ' NO' + (novas.length ? ', ' + novas.length + ' corretiva(s) aberta(s)' : '') + (semOM ? ', ' + semOM + ' sem OM (pendente na Frota)' : '') : 'nenhum NO'}${nh ? ' · ' + nh + ' horímetro(s) lançado(s)' : ''}${nr ? ' · ' + nr + ' leitura(s) incoerente(s) para o Supervisor confirmar' : ''}.`;
    if (rec.mov === 'chegada') { await situSalvar(v.id, 'porto'); toast(txt, 7000); render(); }
    else { toast(txt, 7000); saidaModal(v.id, rec); }
  } catch (e) { busy.hidden = true; console.error(e); alert('Não foi possível salvar o FR 027_L: ' + (e.message || e)); }
}
// ---------- NO sem OM: informar o nº do Sankhya depois ----------
function fr27PendModal(id) {
  const r = S.recs.get(id); if (!r) return; if (r.kind === 'om' || r.kind === 'avaria') return falhaPendModal(r);   // NOK da preventiva e avaria em viagem
  const L = fr27SemOM(r);
  modal(`<h2>NO do FR 027_L sem OM · ${esc(vName(r.vessel))} · ${r.mov === 'saida' ? 'saída' : 'chegada'} ${brD(r.date)}</h2><p class="note">Abra a OM no Sankhya (o FR 027_L mostra o texto pronto) e digite aqui o número gerado. Itens com o mesmo número viram uma corretiva só.</p>
   <div class="tw"><table class="t"><thead><tr><th>Item</th><th>O que foi encontrado</th><th>Criticidade</th><th>Nº da OM</th></tr></thead><tbody>${L.map((x, i) => `<tr><td>${esc(x.lab)}</td><td>${esc(x.d)}</td><td>${esc(x.c)}</td><td><input data-fpo="${esc(x.k)}" inputmode="numeric" style="width:110px" placeholder="nº"></td></tr>`).join('')}</tbody></table></div>
   <div class="note" id="fpE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Fechar</button><button class="mbtn pri" id="fpOk">Gravar e abrir as corretivas</button></div>`, true);
  $('#fpOk').onclick = async () => { let n = 0; $$('[data-fpo]').forEach(i => { const v = i.value.replace(/\D/g, ''); if (!v) return; if (v.length < 3) return; const x = r.nc.find(y => y.k === i.dataset.fpo); if (x) { x.o = v; n++; } });
    const conf = r.nc.filter(x => /^\d{3,}$/.test(x.o || '')).map(x => oms().find(o => o.num === x.o && o.vessel !== r.vessel)).filter(Boolean);
    if (conf.length) { r.nc.forEach(x => { if (conf.some(o => o.num === x.o)) x.o = ''; }); $('#fpE').textContent = 'OM ' + conf.map(o => o.num + ' é do ' + vName(o.vessel)).join(', ') + '. Confira o número no Sankhya.'; return; }
    if (!n) { $('#fpE').textContent = 'Digite pelo menos um nº de OM (3 dígitos ou mais).'; return; }
    await saveRec(r); const novas = await fr27Corretivas(r); closeModal(); toast(n + ' item(ns) ligados · ' + novas.length + ' corretiva(s) aberta(s).'); render(); };
}
// Hoje · empurrador no porto: NO da chegada ainda sem OM

document.addEventListener('click', e => { const b = e.target.closest('[data-fr27pend]'); if (!b) return; e.preventDefault(); e.stopPropagation(); fr27PendModal(b.dataset.fr27pend); }, true);
// chegada e saída pelo FR 027_L (quem estava sem situação informada continua no toque simples)
document.addEventListener('click', e => { const b = e.target.closest('[data-situ]'); if (!b) return; const [vid, st] = b.dataset.situ.split('|'), v = vessel(vid); if (!v || !situDe(v)) return;
  if (st === 'viagem' && v.situ.st === 'porto') { e.preventDefault(); e.stopImmediatePropagation(); fr27Abrir(vid, 'Saida'); }
  else if (st === 'porto' && v.situ.st === 'viagem') { e.preventDefault(); e.stopImmediatePropagation(); fr27Abrir(vid, 'Chegada'); } }, true);
{ const st = document.createElement('style'); st.textContent = `.fr27-pad{position:fixed;inset:0;z-index:2147483000;background:#fff;display:flex;flex-direction:column;padding:12px;gap:8px}
 .fr27-pb{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.fr27-pb button{font:inherit;font-size:15px;border:1px solid #DADCE0;background:#fff;border-radius:8px;padding:8px 14px;cursor:pointer}.fr27-pb button.pri{background:#1967D2;color:#fff;border-color:#1967D2}
 .fr27-pad canvas{flex:1;width:100%;border:2px dashed #9AA0A6;border-radius:10px;touch-action:none;background:#FCFCFC}.fr27-pad p{margin:0;color:#5F6368;text-align:center}
 .fo-bar .pri{background:#1967D2!important;color:#fff!important;border-color:#1967D2!important}`; document.head.appendChild(st); }
