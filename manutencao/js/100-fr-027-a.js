/* ===== FR 027_A · check-list de chegada e saída da balsa tanque, dentro do SMF (formulário em forms/FR_027_A.html; NP 024) =====
   Mesmo padrão do FR 027_L: abre já com a balsa, assinatura pelo toque (Operador / Inspetor, Coordenador de Logística, Coordenador de Operações),
   "Salvar no SMF". Ao salvar: PDF das folhas no Drive (kind 'fr027a'), horímetro do motor-bomba lançado (hor, pos 'MB'),
   cada não conformidade vira falha da balsa (avaria): itens com o mesmo nº de OM viram uma falha só; sem OM, uma falha por item. */
'use strict';
const F27A_FUNC = ['Operador / Inspetor', 'Coordenador de Logística', 'Coordenador de Operações'];
const f27aS = vid => recs('fr027a').filter(r => r.vessel === vid).sort((a, b) => (a.at || 0) - (b.at || 0));
function f27aEq(b, n) {   // nº do item do FR 027_A → equipamento da falha (o mesmo campo do "Registrar falha")
  if (n <= 4) return 'Luzes de navegação';
  if (n === 10 || n === 52) return 'Baterias';
  if (n <= 9) return 'Sistema elétrico';
  if (n <= 14) return 'Alarme de nível alto';
  if ([18, 19, 20, 32, 33, 34, 35].includes(n)) return 'Escotilhas';
  if (n === 25) return 'Manômetro da rede de carga';
  if ([22, 23, 24, 26, 27].includes(n)) return 'Rede de carga e tubulações';
  if ([41, 42, 45, 46].includes(n)) return 'Casco';
  if (n <= 46) return 'Convés';
  if (n === 54 || n === 55) return 'Bomba centrífuga';
  if (n <= 63) return BA1.find(t => t.mot === b.mot) ? BA1.find(t => t.mot === b.mot).eq : 'Motor';
  return 'Salvatagem e SOPEP (SESMT)';
}
function f27aAssinaturas(doc) {
  doc.querySelectorAll('#sec-ass .sgg > div').forEach((d, i) => {
    if (d.querySelector('.fr27-sb')) return; const b = doc.createElement('button'); b.type = 'button'; b.className = 'fr27-sb noprint'; b.textContent = '✍ Assinar';
    b.style.cssText = 'margin-top:4px;font:600 12px system-ui;border:1px solid #1967D2;color:#1967D2;background:#fff;border-radius:6px;padding:4px 10px;cursor:pointer';
    b.onclick = async () => { const nome = (d.querySelector('input') || {}).value || ''; const img = await fr27Pad('Assinatura · ' + F27A_FUNC[i] + (nome.trim() ? ' · ' + nome.trim() : ''));
      if (!img) return; const slot = d.querySelector('i'); slot.innerHTML = `<img src="${img}" alt="assinatura" style="display:block;height:12mm;max-width:100%;margin:0 auto">`; slot.style.borderBottom = 'none'; b.textContent = '✍ Assinar de novo'; };
    d.appendChild(b); }); }
async function f27aAbrir(vid) {
  if (!balPode()) return; const b = vid ? balsaDe(vid) : null;
  const o = lubOverlay('f27aFO', `📋 FR 027_A · Check-list da balsa tanque${b ? ' · ' + esc(b.nome) : ''}`, `<button data-fo="salvar" class="pri">💾 Salvar no SMF</button>`);
  o.querySelector('[data-fo="fechar"]').onclick = () => { if (confirm('Fechar o FR 027_A sem salvar? O que foi marcado será perdido.')) lubFecharOverlay('f27aFO'); };
  const fr = o.querySelector('iframe');
  fr.onload = () => { try { const d = fr.contentDocument;
    if (b) d.getElementById('bal').value = b.nome;
    fr.contentWindow.NC_MODOS = MODOS; if (fr.contentWindow.atualiza) fr.contentWindow.atualiza();   // coluna Modo de falha, a mesma lista do Registrar falha
    d.getElementById('dt').value = isoD(hoje()); const n = new Date(); d.getElementById('hr').value = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    d.querySelectorAll('.toolbar button').forEach(bt => { if (/^(Imprimir|Limpar)/.test(bt.textContent.trim())) bt.style.display = 'none'; });   // quem grava é "Salvar no SMF"
    f27aAssinaturas(d); } catch (er) { console.warn(er); } };
  o.querySelector('[data-fo="salvar"]').onclick = () => f27aSalvar(fr.contentWindow, o);
  let txt = null; for (let i = 0; i < 3 && !txt; i++) { try { txt = await lubFormTxt('FR_027_A.html'); } catch (er) { await new Promise(r => setTimeout(r, 700)); } }
  if (!txt) { lubFecharOverlay('f27aFO'); alert('Não consegui abrir o FR 027_A: sem conexão e sem cópia guardada neste aparelho. Use o FR 027_A em papel e registre as falhas depois.'); return; }
  fr.srcdoc = txt;
}
function f27aLer(win) {
  const doc = win.document, val = s => ((doc.querySelector(s) || {}).value || '').trim(), rad = n => (doc.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
  const res = {}; doc.querySelectorAll('td.c[data-k]').forEach(td => { const c = td.querySelector('input:checked'); res[td.dataset.k] = c ? c.value : ''; });
  const nc = [...doc.querySelectorAll('table.nc tbody tr[data-k]')].map(tr => ({ k: tr.dataset.k, n: +tr.dataset.k.slice(2), lab: tr.querySelector('.nci').textContent.trim(), d: tr.querySelector('.ncd').value.trim(), c: tr.querySelector('.ncc').value, m: (tr.querySelector('.ncm') || {}).value || '', o: tr.querySelector('.nco').value.trim().replace(/\D/g, '') }));
  const ass = [...doc.querySelectorAll('#sec-ass .sgg > div')].map((d, i) => ({ func: F27A_FUNC[i], nome: ((d.querySelector('input') || {}).value || '').trim(), ok: !!d.querySelector('i img') }));
  return { bal: val('#bal'), date: val('#dt'), hora: val('#hr'), local: val('#loc'), mov: rad('mov'), hmb: val('#hmb'), res, nc, obs: val('#obs'), ass };
}
function f27aFaltas(D) {
  const f = [], sem = Object.values(D.res).filter(x => !x).length;
  if (!D.bal) f.push('Balsa'); if (!D.date) f.push('Data'); if (!D.mov) f.push('Movimento (chegada ou saída)');
  if (D.hmb && numBR(D.hmb) == null) f.push('Horímetro do motor-bomba: número inválido');
  if (sem) f.push(sem + ' item(ns) sem marcação (SIM / NÃO / N/A)');
  if (D.nc.some(x => !x.d)) f.push('O que foi encontrado, em toda não conformidade');
  if (D.nc.some(x => !x.c)) f.push('Criticidade de toda não conformidade');
  if (D.nc.some(x => !x.m)) f.push('Modo de falha de toda não conformidade');
  D.ass.forEach(a => { if (!a.nome) f.push('Nome · ' + a.func); if (!a.ok) f.push('Assinatura · ' + a.func); });
  return f;
}
async function f27aPdf(win) {   // cada folha numa página A4 (a folha que passar do A4 é reduzida para caber)
  await carregarLibsPdf().catch(() => { }); if (!window.jspdf || !window.html2canvas) throw new Error('bibliotecas de PDF não carregaram');
  const doc = win.document, sheets = [...doc.querySelectorAll('.sheet')], { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const prep = d => { const st = d.createElement('style'); st.textContent = '.toolbar,.noprint,.fr27-sb{display:none!important}tr.miss td{background:transparent!important}'; d.head.appendChild(st); d.querySelectorAll('input').forEach(i => i.removeAttribute('placeholder')); };
  const sx = win.scrollX, sy = win.scrollY; win.scrollTo(0, 0);
  try { for (let i = 0; i < sheets.length; i++) { const cv = await html2canvas(sheets[i], { scale: 2.2, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: 1000, scrollX: 0, scrollY: 0, onclone: prep });
      const h = 210 * cv.height / cv.width, k = h > 297 ? 297 / h : 1; if (i) pdf.addPage('a4', 'portrait');
      pdf.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', (210 - 210 * k) / 2, 0, 210 * k, h * k, undefined, 'FAST'); cv.width = cv.height = 0; } }
  finally { win.scrollTo(sx, sy); }
  return pdf;
}
async function f27aFalhas(rec, b) {   // não conformidades → falhas da balsa
  const G = {}, sem = [], at = +new Date(rec.date + 'T' + (rec.hora || '12:00')), by = S.session ? S.session.name : '', quem = (rec.ass[0] || {}).nome || by;
  rec.nc.forEach(x => /^\d{3,}$/.test(x.o) ? (G[x.o] = G[x.o] || []).push(x) : sem.push([x]));
  const grupos = Object.values(G).concat(sem); let n = 0;
  for (const L of grupos) { L.sort((a, c) => (FR27_GRAV[a.c] ?? 9) - (FR27_GRAV[c.c] ?? 9)); const om = L[0].o && /^\d{3,}$/.test(L[0].o) ? L[0].o : '';
    if (om && recs('avaria').some(r => r.vessel === b.id && r.om === om && !r.fim && !r.excluido)) continue;   // a falha dessa OM já está aberta
    await saveRec({ id: uid('avaria'), kind: 'avaria', vessel: b.id, date: rec.date, hora: rec.hora || '12:00', at, c: L[0].c, om, sis: f27aEq(b, L[0].n), modo: L[0].m, fotos: [], pos: 'UN',
      desc: 'FR 027_A ' + (rec.mov === 'saida' ? 'saída' : 'chegada') + ': ' + L.map(x => 'item ' + String(x.n).padStart(2, '0') + ' · ' + x.d + (L.length > 1 ? ' [' + x.c + ']' : '')).join('; '),
      quem, meio: 'FR 027_A', fr027a: rec.id, by, bal: true }); n++; }
  return n;
}
async function f27aSalvar(win, ov) {
  let D; try { D = f27aLer(win); } catch (e) { alert('Não consegui ler o formulário: ' + e.message); return; }
  const F = f27aFaltas(D); if (F.length) { alert('Falta preencher no FR 027_A:\n• ' + F.join('\n• ')); return; }
  const b = BALSAS.find(x => x.nome === D.bal); if (!b) { alert('Balsa não encontrada no cadastro: ' + D.bal); return; }
  const outra = D.nc.filter(x => /^\d{3,}$/.test(x.o)).map(x => [x, oms().find(o => o.num === x.o) || recs('avaria').find(r => r.om === x.o && r.vessel !== b.id && !r.excluido)]).filter(y => y[1]);
  if (outra.length) { alert('Nº de OM que já é de outra embarcação:\n• ' + outra.map(([x, o]) => 'OM ' + x.o + ' é do(a) ' + vName(o.vessel)).join('\n• ') + '\nConfira o número no Sankhya.'); return; }
  const dup = f27aS(b.id).find(r => r.mov === D.mov && r.date === D.date);
  if (dup && !confirm('Já existe um FR 027_A de ' + (D.mov === 'saida' ? 'saída' : 'chegada') + ' da ' + b.nome + ' nesta data' + (dup.hora ? ' às ' + dup.hora : '') + '.\nSalvar outro mesmo assim?')) return;
  const hr = balHor(b.id), h = D.hmb ? numBR(D.hmb) : null; let hOk = h != null;
  if (hOk && hr && h < hr.h && D.date >= hr.date) { if (!confirm('Horímetro do motor-bomba ' + nf(h) + ' h é menor que a última leitura (' + nf(hr.h) + ' h em ' + brD(hr.date) + ').\nSalvar o FR 027_A sem lançar essa leitura?')) return; hOk = false; }
  const semOM = D.nc.filter(x => !/^\d{3,}$/.test(x.o)).length;
  if (semOM && !confirm(semOM + ' não conformidade(s) sem nº de OM. Salvar assim mesmo? Elas ficam como falha aberta “sem OM no Sankhya” na ficha da balsa.')) return;
  const busy = ov.querySelector('.fo-busy'), msg = t => { busy.hidden = false; busy.querySelector('.fo-msg').textContent = t; };
  try {
    msg('Gerando o PDF do FR 027_A…'); const pdf = await f27aPdf(win);
    msg('Gravando e registrando as falhas…');
    const rec = { id: uid('fr27a'), kind: 'fr027a', vessel: b.id, vNome: b.nome, mov: D.mov, date: D.date, hora: D.hora, local: D.local, hmb: h, res: D.res, nc: D.nc, obs: D.obs,
      ass: D.ass.map(a => ({ func: a.func, nome: a.nome })), assAt: Date.now(), by: S.session ? S.session.name : '', at: Date.now(), bal: true };
    await saveRec(rec, { pdfB64: pdf.output('datauristring').split(',')[1] });
    if (hOk && !(hr && hr.h === h && hr.date === D.date)) await saveRec({ id: uid('hor'), kind: 'hor', vessel: b.id, pos: 'MB', h, date: D.date, by: rec.by, bal: true, fr027a: rec.id });
    const nf27 = await f27aFalhas(rec, b);
    busy.hidden = true; lubFecharOverlay('f27aFO');
    toast(`FR 027_A de ${D.mov === 'saida' ? 'saída' : 'chegada'} salvo · ${b.nome}: ${D.nc.length ? D.nc.length + ' não conformidade(s), ' + nf27 + ' falha(s) registrada(s)' + (semOM ? ', ' + semOM + ' sem OM' : '') : 'nenhuma não conformidade'}${hOk ? ' · horímetro lançado' : ''}.`, 7000); render();
  } catch (e) { busy.hidden = true; console.error(e); alert('Não foi possível salvar o FR 027_A: ' + (e.message || e)); }
}
document.addEventListener('click', e => { const t = e.target.closest('[data-bal27a]'); if (!t) return; e.preventDefault(); f27aAbrir(t.dataset.bal27a); });
