/* =====================================================================
   HORÍMETRO v2
   - o painel do motor marca até 9.999,9 h e volta a zero: quem lança digita o que aparece
     no painel e o SMF calcula o total (soma 10.000 h a cada volta)
   - leitura que não faz sentido (mais horas do que cabem nos dias, data anterior, sem referência)
     lançada pelo Analista fica pendente até o Supervisor confirmar
   - foto do horímetro: guarda como evidência e tenta ler o número (OCR) para preencher
   - MCA sem horímetro: estimativa por horas/dia, sem alerta de leitura desatualizada
   ===================================================================== */
'use strict';
const VOLTA = 10000;
const horNum = s => { s = String(s || '').trim().replace(/\s/g, ''); if (!s) return null; if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); const n = parseFloat(s); return isNaN(n) ? null : n; };
const recsHorp = () => [...S.recs.values()].filter(r => r.kind === 'horp' && !r.excluido);
async function excluirRec(r) { r.excluido = true; await saveRec(r); if (S.url && S.session) { try { await api('delete', { id: r.id }); } catch (e) { } } }

/* ---------- estimativa (MCA sem horímetro) ---------- */
const horEst = (v, p) => v && v.horEst && v.horEst[p] && v.horEst[p].hd ? v.horEst[p] : null;
async function salvarFrotaCfg() { S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg); if (S.url && can.admin()) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota } }); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } } catch (e) { } } }

/* ---------- leitura do painel → total ---------- */
function horCalc(vid, pos, painel, date) {
  const off = horOff(vessel(vid), pos, date);   // horímetro trocado/consertado: total na troca + leitura do novo − leitura inicial
  if (off && painel != null && !(painel >= VOLTA) && !(painel < off.ini)) { const total = Math.round((off.base + painel - off.ini) * 10) / 10, real = (() => { const x = horAtual(vid, pos); return x && !x.est ? x : null; })();
    const delta = real ? Math.round((total - real.h) * 10) / 10 : null, dias = real ? Math.max(0, (pD(date) - pD(real.date)) / 864e5) : null;
    return { total, delta, dias, virou: false, susp: real && delta < 0 ? 'menor que a última leitura (' + nf(real.h) + ' h)' : '', real }; }
  const last = horAtual(vid, pos), real = last && !last.est ? last : null;
  if (painel == null) return null;
  if (painel >= VOLTA) { // digitou o total
    const delta = real ? Math.round((painel - real.h) * 10) / 10 : null, dias = real ? Math.max(0, (pD(date) - pD(real.date)) / 864e5) : null;
    const susp = real ? (delta < 0 ? 'menor que a última leitura (' + nf(real.h) + ' h)' : delta > 24 * Math.max(dias, 0.5) + 2 ? nf(delta) + ' h em ' + Math.round(dias) + ' dia(s): mais do que 24 h/dia' : '') : '';
    return { total: painel, delta, dias, virou: false, total_digitado: true, susp, real };
  }
  if (!real) return { total: null, delta: null, dias: null, virou: false, susp: 'primeira leitura deste motor: o Supervisor informa o total', real };
  let t = Math.floor(real.h / VOLTA) * VOLTA + painel, virou = false;
  if (t < real.h - 0.05) { t += VOLTA; virou = true; }
  const delta = Math.round((t - real.h) * 10) / 10, dias = Math.max(0, (pD(date) - pD(real.date)) / 864e5);
  let susp = '';
  if (date < real.date) susp = 'data anterior à última leitura (' + brD(real.date) + ')';
  else if (delta > 24 * Math.max(dias, 0.5) + 2) susp = (virou ? 'o painel teria virado e ' : '') + nf(delta) + ' h em ' + Math.round(dias) + ' dia(s): mais do que 24 h/dia';
  return { total: Math.round(t * 10) / 10, delta, dias, virou, susp, real };
}

/* ---------- OCR (Tesseract.js, carregado só quando usar) ---------- */
const OCR = Object.assign({ script: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js', corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1', langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int' }, window.SMF_OCR || {});
let _ocrW = null;
function ocrCarregar() { if (window.Tesseract) return Promise.resolve(); return new Promise((ok, err) => { const s = document.createElement('script'); s.src = OCR.script; s.onload = ok; s.onerror = () => err(new Error('ocr_indisponivel')); document.head.appendChild(s); }); }
async function ocrWorker() { if (_ocrW) return _ocrW; await ocrCarregar(); _ocrW = await Tesseract.createWorker('eng', 1, { workerPath: OCR.workerPath, corePath: OCR.corePath, langPath: OCR.langPath }); await _ocrW.setParameters({ tessedit_char_whitelist: '0123456789.,', tessedit_pageseg_mode: '6' }); return _ocrW; }
function imgCanvas(img, maxW, filtro) { const k = Math.min(1, maxW / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
  if (filtro) { const d = g.getImageData(0, 0, c.width, c.height), a = d.data; let soma = 0; for (let i = 0; i < a.length; i += 4) { const y = .299 * a[i] + .587 * a[i + 1] + .114 * a[i + 2]; a[i] = a[i + 1] = a[i + 2] = y; soma += y; }
    const med = soma / (a.length / 4), inv = med < 110; for (let i = 0; i < a.length; i += 4) { let y = a[i]; y = (y - med) * 1.8 + 128; if (inv) y = 255 - y; y = y < 0 ? 0 : y > 255 ? 255 : y; a[i] = a[i + 1] = a[i + 2] = y; } g.putImageData(d, 0, 0); }
  return c; }
function lerArquivoImg(f) { return new Promise((ok, err) => { const u = URL.createObjectURL(f), i = new Image(); i.onload = () => { ok(i); }; i.onerror = err; i.src = u; }); }
function ocrEscolher(txt, esperado) {
  const c = (txt.match(/\d[\d.,]*\d|\d/g) || []).map(s => { const t = s.replace(/[.,](?=\d{3}\b)/g, ''); const m = t.match(/^(\d{1,5})(?:[.,](\d))?/); return m ? +(m[1] + (m[2] ? '.' + m[2] : '')) : null; }).filter(x => x != null && x < VOLTA);
  if (!c.length) return null;
  if (esperado != null) c.sort((a, b) => Math.abs(a - esperado) - Math.abs(b - esperado)); else c.sort((a, b) => String(b).length - String(a).length);
  return c[0];
}
async function ocrLer(img, esperado) { const w = await ocrWorker(); let melhor = null;
  for (const filtro of [true, false]) { const { data } = await w.recognize(imgCanvas(img, 1400, filtro)); const n = ocrEscolher(data.text || '', esperado); if (n != null && (melhor == null || (esperado != null && Math.abs(n - esperado) < Math.abs(melhor - esperado)))) melhor = n; if (melhor != null && esperado == null) break; }
  return melhor; }
async function fotoParaEnvio(img) { const c = imgCanvas(img, 1280, false); return c.toDataURL('image/jpeg', .72).split(',')[1]; }
function fotoMini(img) { return imgCanvas(img, 360, false).toDataURL('image/jpeg', .6); }

/* ---------- janela de lançamento ---------- */
const HF = {};   // fotos escolhidas nesta janela: pos -> { img, mini }
function horModal(vid) {
  if (!precisa(false)) return;
  for (const k in HF) delete HF[k];
  const v0 = vid || S.cfg.frota.find(v => !foraOp(v)).id, adm = can.admin();
  const linha = (v, p) => { const r = horAtual(v.id, p), e = horEst(v, p), nome = posNome(v, p) + (MCAS.includes(p) ? ' · ' + mcaNome(v, p) : '');
    if (e) return `<div class="hl est"><div class="hl-n"><b>${esc(nome)}</b><span class="note">sem horímetro · ${e.modo === 'estado' ? 'estimado por estado (viagem ' + nf(e.hv ?? 12, 0) + ' · boia ' + nf(e.hb ?? 12, 0) + ' · cais ' + nf(e.hc ?? 0, 0) + ' h/dia)' : 'estimado ' + nf(e.hd, 1) + ' h/dia'} · hoje ≈ ${nf(r.h)} h</span></div><div class="hl-i"><span class="note">não precisa lançar</span>${adm ? `<button class="mbtn sm" data-hest="${p}">Ajustar</button>` : ''}</div></div>`;
    return `<div class="hl"><div class="hl-n"><b>${esc(nome)}</b><span class="note">${r ? 'último total ' + nf(r.h) + ' h · painel ' + nf(r.h % VOLTA, 1) + ' · ' + brD(r.date) : 'sem leitura anterior'}</span></div>
      <div class="hl-i"><input data-h="${p}" inputmode="decimal" placeholder="leitura do painel"><label class="mbtn sm hl-cam" title="Foto do horímetro">📷<input type="file" accept="image/*" capture="environment" data-hfoto="${p}" hidden></label>${adm && MCAS.includes(p) ? `<button class="mbtn sm" data-hest="${p}" title="Horímetro do MCA ausente, danificado ou obstruído">sem horímetro?</button>` : ''}${adm ? `<button class="mbtn sm" data-hoff="${p}" title="O horímetro foi trocado e começa de outro número">horímetro trocado?</button>` : ''}${adm && isMcp(p) && (v.rev || {})[p] ? `<button class="mbtn sm" data-revtroca="${p}" title="Registrar a troca do reversor deste bordo">reversor trocado?</button>` : ''}</div>
      <div class="hl-r" data-hr="${p}"></div></div>`; };
  const draw = vid2 => { const v = vessel(vid2); return `<div class="g"><label class="f s3">Embarcação<select id="hV">${S.cfg.frota.map(x => `<option value="${x.id}"${x.id === vid2 ? ' selected' : ''}>${esc(x.nome)}${foraOp(x) ? ' (fora de operação)' : ''}</option>`).join('')}</select></label><label class="f s3">Data da leitura<input id="hD" type="date" value="${isoD(hoje())}"></label></div>
    <div class="hls">${posicoes(v).filter(p => p !== 'UN').map(p => linha(v, p)).join('')}</div>`; };
  modal(`<h2>Registrar horímetros</h2><p class="note">Digite o número que aparece no painel do motor (ex.: 2730,5). O painel volta a zero depois de 9.999,9 h: o SMF soma as voltas e calcula o total. Se tirar a foto 📷, ele tenta ler o número e guarda a foto como evidência.${adm ? '' : ' Leitura fora do esperado fica aguardando a confirmação do Supervisor.'}</p>
    <div id="hBody">${draw(v0)}</div><div class="note" id="hE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="hOk">Salvar leituras</button></div>`, true);
  const M = $('#modal');
  const prever = p => { const i = M.querySelector(`[data-h="${p}"]`), out = M.querySelector(`[data-hr="${p}"]`); if (!i || !out) return; const n = horNum(i.value); if (n == null) { out.innerHTML = HF[p] ? `<img src="${HF[p].mini}" class="hl-foto">` : ''; return; }
    const c = horCalc($('#hV').value, p, n, $('#hD').value), foto = HF[p] ? `<img src="${HF[p].mini}" class="hl-foto">` : '';
    let t; if (c.total == null) t = `<span class="hl-w">⚠ ${esc(c.susp)}${adm ? ' · digite o total (ex.: 12700)' : ' · vai para a confirmação do Supervisor'}</span>`;
    else t = `→ total <b>${nf(c.total, c.total % 1 ? 1 : 0)} h</b>${c.delta != null ? ' · +' + nf(c.delta, c.delta % 1 ? 1 : 0) + ' h em ' + Math.round(c.dias) + ' d' : ''}${c.virou ? ' · <b>o painel virou</b> (+10.000 h)' : ''}${c.total_digitado ? ' · total digitado' : ''}${c.susp ? ` <span class="hl-w">⚠ ${esc(c.susp)}${adm ? '' : ' · vai para a confirmação do Supervisor'}</span>` : ' <span class="hl-ok">✓</span>'}`;
    out.innerHTML = foto + t; };
  M.addEventListener('input', e => { const p = e.target.dataset.h; if (p) prever(p); if (e.target.id === 'hD') M.querySelectorAll('[data-h]').forEach(i => prever(i.dataset.h)); });
  M.addEventListener('change', async e => {
    if (e.target.id === 'hV') { for (const k in HF) delete HF[k]; $('#hBody').innerHTML = draw(e.target.value); return; }
    if (e.target.id === 'hD') { M.querySelectorAll('[data-h]').forEach(i => prever(i.dataset.h)); return; }
    const p = e.target.dataset.hfoto; if (!p || !e.target.files[0]) return;
    const out = M.querySelector(`[data-hr="${p}"]`), inp = M.querySelector(`[data-h="${p}"]`);
    try { const img = await lerArquivoImg(e.target.files[0]); HF[p] = { img, mini: fotoMini(img) }; out.innerHTML = `<img src="${HF[p].mini}" class="hl-foto"> <span class="note">lendo o número da foto…</span>`;
      const r = horAtual($('#hV').value, p), esp = r && !r.est ? (r.h % VOLTA) + horasDiaPos($('#hV').value, p) * Math.max(0, (pD($('#hD').value) - pD(r.date)) / 864e5) : null;
      let n = null; try { n = await ocrLer(img, esp != null ? esp % VOLTA : null); } catch (er) { n = null; }
      if (n != null) { inp.value = String(n).replace('.', ','); prever(p); out.insertAdjacentHTML('beforeend', ` <span class="note">· lido na foto: <b>${String(n).replace('.', ',')}</b> — confira com a foto</span>`); }
      else { prever(p); out.insertAdjacentHTML('beforeend', ' <span class="note">· não consegui ler o número: digite olhando a foto (ela fica guardada)</span>'); inp.focus(); }
    } catch (er) { out.textContent = 'Não consegui abrir a foto.'; }
  });
  M.addEventListener('click', e => { const b = e.target.closest('[data-hest]'); if (!b) return; estModal($('#hV').value, b.dataset.hest); });
  $('#hOk').onclick = async () => {
    const vid2 = $('#hV').value, d = $('#hD').value; if (!d) { $('#hE').textContent = 'Informe a data.'; return; }
    const L = []; for (const i of M.querySelectorAll('[data-h]')) { const n = horNum(i.value); if (n == null) continue; const p = i.dataset.h, c = horCalc(vid2, p, n, d); L.push({ p, n, c }); }
    if (!L.length && !Object.keys(HF).length) { closeModal(); toast('Nada lançado.'); return; }
    const semNum = Object.keys(HF).filter(p => !L.some(x => x.p === p)); if (semNum.length) { $('#hE').textContent = 'Digite a leitura de ' + semNum.join(', ') + ' (a foto sozinha não basta).'; return; }
    if (adm && L.some(x => x.c.total == null)) { $('#hE').textContent = 'Primeira leitura do motor: digite o total acumulado (ex.: 12700).'; return; }
    const b = $('#hOk'); b.disabled = true; b.textContent = 'Salvando…'; let ok = 0, pend = 0;
    for (const x of L) {
      let foto = {}; const f = HF[x.p];
      if (f) { if (S.url) { try { const j = await api('foto', { b64: await fotoParaEnvio(f.img), vessel: vid2, nome: 'horimetro_' + vName(vid2) + '_' + x.p + '_' + d }); if (j.ok) foto = { fotoId: j.fileId }; else foto = { fotoMin: f.mini }; } catch (er) { foto = { fotoMin: f.mini }; } } else foto = { fotoMin: f.mini }; }
      const base = { vessel: vid2, pos: x.p, date: d, painel: x.n < VOLTA ? x.n : null, by: S.session.name, delta: x.c.delta, virou: x.c.virou || undefined };
      if (x.c.susp && !adm) { await saveRec(Object.assign({ id: uid('horp'), kind: 'horp', h: x.c.total, motivo: x.c.susp }, base, foto)); pend++; }
      else { await saveRec(Object.assign({ id: uid('hor'), kind: 'hor', h: x.c.total }, base, foto, x.c.susp ? { obs: 'confirmado pelo Supervisor: ' + x.c.susp } : {})); ok++; }
    }
    closeModal(); toast((ok ? ok + ' leitura(s) salva(s)' : '') + (ok && pend ? ' · ' : '') + (pend ? pend + ' aguardando confirmação do Supervisor' : '') + '.'); render();
  };
}

/* ---------- MCA sem horímetro: estimativa ---------- */

/* ---------- confirmação do Supervisor ---------- */
function horPendCard() {
  const P = recsHorp().sort((a, b) => a.date < b.date ? -1 : 1); if (!P.length) return '';
  const a = can.admin();
  return `<div class="card hp-card"><div class="row"><h2>Leituras aguardando confirmação (${P.length})</h2><span class="sp"></span><span class="note">Lançadas pelo Analista e fora do esperado. Só entram nos cálculos depois de confirmadas.</span></div>
   <div class="tw"><table class="t"><thead><tr><th>Embarcação</th><th>Motor</th><th>Data</th><th>Painel</th><th>Total calculado</th><th>Motivo</th><th>Lançado por</th><th>Foto</th><th></th></tr></thead><tbody>
   ${P.map(r => `<tr><td><b>${esc(vName(r.vessel))}</b></td><td>${esc(posNome(vessel(r.vessel), r.pos))}</td><td>${brD(r.date)}</td><td class="mono">${r.painel != null ? nf(r.painel, r.painel % 1 ? 1 : 0) : '—'}</td><td class="mono">${r.h != null ? nf(r.h) + ' h' : '—'}</td><td class="note">${esc(r.motivo || '')}</td><td>${esc(r.by || '')}</td><td>${r.fotoMin ? `<img src="${r.fotoMin}" class="hl-foto" data-hpver="${r.id}">` : r.fotoId ? `<button class="mbtn sm" data-hpdrive="${r.fotoId}">ver foto</button>` : '—'}</td>
     <td style="white-space:nowrap">${a ? `<button class="mbtn sm pri" data-hpok="${r.id}" ${r.h == null ? 'disabled' : ''}>Confirmar</button><button class="mbtn sm" data-hped="${r.id}">Corrigir</button><button class="mbtn sm bad" data-hpno="${r.id}">Recusar</button>` : '<span class="note">aguardando</span>'}</td></tr>`).join('')}</tbody></table></div></div>`;
}
async function horConfirmar(r, total) { await saveRec({ id: uid('hor'), kind: 'hor', vessel: r.vessel, pos: r.pos, date: r.date, h: total, painel: r.painel, by: r.by, confirmadoPor: S.session.name, obs: 'confirmado: ' + (r.motivo || ''), fotoId: r.fotoId, fotoMin: r.fotoMin }); await excluirRec(r); }
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-hpok],[data-hped],[data-hpno],[data-hpver],[data-hpdrive]'); if (!b) return; e.stopPropagation();
  if (b.dataset.hpver) { const r = S.recs.get(b.dataset.hpver); modal(`<h2>Foto do horímetro</h2><img src="${r.fotoMin}" style="max-width:100%;border-radius:8px"><div class="row end"><button class="mbtn" data-close>Fechar</button></div>`); return; }
  if (b.dataset.hpdrive) { window.open('https://drive.google.com/file/d/' + b.dataset.hpdrive + '/view', '_blank'); return; }
  if (!can.admin()) return;
  const r = S.recs.get(b.dataset.hpok || b.dataset.hped || b.dataset.hpno); if (!r) return;
  if (b.dataset.hpok) { await horConfirmar(r, r.h); toast('Leitura confirmada.'); render(); }
  else if (b.dataset.hpno) confirmar('Recusar esta leitura? Ela será descartada.', async () => { await excluirRec(r); toast('Leitura recusada.'); render(); });
  else { modal(`<h2>Corrigir leitura · ${esc(vName(r.vessel))} ${esc(r.pos)}</h2><p class="note">Painel informado: ${r.painel != null ? nf(r.painel, 1) : '—'} em ${brD(r.date)}. Digite o total acumulado correto.</p><label class="f">Total (h)<input id="hpT" inputmode="decimal" value="${r.h != null ? r.h : ''}"></label><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="hpOk">Confirmar com este total</button></div>`);
    $('#hpOk').onclick = async () => { const t = horNum($('#hpT').value); if (t == null) return toast('Informe o total.'); await horConfirmar(r, t); closeModal(); toast('Leitura corrigida e confirmada.'); render(); }; }
}, true);
// cartão de pendências no topo da tela de horímetros e aviso no painel
// na página única do Controle da condição, as pendências aparecem no começo da parte de Horímetros

