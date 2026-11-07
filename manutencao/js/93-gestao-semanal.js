/* =====================================================================
   5 · GESTÃO SEMANAL (SMF 3.115, 31/10/2026; pedido do Supervisor: “toda sexta tenho 8 min com a diretoria para dizer
   o que fiz na semana e o que tem para a próxima”; “preciso gerenciar o que foi pedido no Sankhya e quanto tempo tem”).
   · 4.1 Solicitações e requisições (semsc): SC (serviço externo ou material) e RM (material do estoque) abertas no Sankhya,
     com os dias em aberto (até 7 · 8 a 15 · mais de 15 · mais de 30), situação, previsão e OM ligada. O SMF não fala com o
     Sankhya: cadastro à mão ou “Colar do Sankhya” (linhas copiadas do Excel: Nº · Data · Descrição · Empurrador/balsa · OM).
     Registro: snap tipo 'screq' (tp SC/RM, num, date, txt, vessel, om, urg, prev, st, fim, obs, hist).
     SMF 3.116: “📄 PDF de solicitação (SC)” e “📄 PDF de requisição (RM)” leem o impresso da requisição/pedido (pdf.js em lib/pdfjs, carregado só no uso): nº, data,
     situação no Sankhya (stSk), aplicação (apl → empurrador ou balsa), necessidade (nec), requisito (vira o txt) e os itens
     (itens = [[item, código, descrição, unidade, quantidade]]). O tipo vem do botão (o impresso é igual para SC e RM; Supervisor:
     “é melhor ter algo que fale para o sistema se é solicita ou requisição”); nº igual só atualiza se for do mesmo tipo. Valores unitário e total NÃO são lidos (Supervisor: “fictícios, não considero”).
   · (3.126: a 5.2 Reunião de sexta saiu a pedido do Supervisor; texto histórico) 5.2 Reunião de sexta (semreun): semana de segunda a domingo; números da semana calculados dos registros (frota, balsas,
     corretivas, preventivas, óleo, disponibilidade, SC/RM), entregas, riscos e decisões, próxima semana; o texto do Supervisor
     e a conferência dos compromissos da semana anterior em snap tipo 'semana' (id snap-semana-<segunda>).
     4 slides 16:9 no mesmo desenho da 4.4 (classes at-*; atpShow/atpPdf recebem a lista de slides) e resumo em texto
     para WhatsApp/e-mail. A reunião é por videoconferência: ▶ Apresentar abre em tela cheia para compartilhar a tela, com cronômetro regressivo de 8 min
     (âmbar no último minuto, vermelho estourado); o PDF e o resumo vão no chat da chamada.
   Os dois tipos usam o snap, que o servidor já aceita (Supervisor e Analista): não muda o Code.gs.
   ===================================================================== */
'use strict';
// ---------- solicitações e requisições ----------
const GS_ST = { ab: 'Aberta', apr: 'Aprovada', pc: 'Pedido de compra', fim: 'Entregue', can: 'Cancelada' };
const gsStTx = (r, st) => { st = st || r.st; return r.tp === 'RM' ? ({ apr: 'Em separação', fim: 'Atendida' })[st] || GS_ST[st] : GS_ST[st]; };
const gsStOps = tp => tp === 'RM' ? ['ab', 'apr', 'fim', 'can'] : ['ab', 'apr', 'pc', 'fim', 'can'];
const gsReqs = () => recs('snap').filter(r => r.tipo === 'screq' && !r.excluido);
const gsAberta = r => !['fim', 'can'].includes(r.st);
const gsDias = r => { const a = pD(r.date); if (!a) return 0; const b = gsAberta(r) ? hoje() : pD(r.fim || isoD(hoje())); return Math.max(0, Math.round((pD(isoD(b)) - a) / 864e5)); };
const gsFaixa = d => d > 30 ? ['p-bad', 'mais de 30 dias'] : d > 15 ? ['p-bad', '16 a 30 dias'] : d > 7 ? ['p-warn', '8 a 15 dias'] : ['p-ok', 'até 7 dias'];
const gsOnde = id => id ? vName(id) : 'Geral / oficina';
const GS = { f: 'ab', q: '', fr: 'todas' };   // fr: Todas · Empurradores · Balsas (a mesma tela serve às duas frotas, sem aba; Supervisor, 07/11/2026)
const gsDaFrota = (r, fr) => fr === 'bal' ? !!(typeof balsaDe === 'function' && balsaDe(r.vessel)) : fr === 'emp' ? !(typeof balsaDe === 'function' && balsaDe(r.vessel)) : true;
function gsOndeOps(sel) {
  const E = (S.cfg.frota || []).map(v => [v.id, v.nome]), B = typeof BALSAS !== 'undefined' ? BALSAS.map(b => [b.id, b.nome]) : [];
  const o = ([id, n]) => `<option value="${esc(id)}"${id === sel ? ' selected' : ''}>${esc(n)}</option>`;
  return `<option value="">Geral / oficina</option><optgroup label="Empurradores">${E.map(o).join('')}</optgroup>${B.length ? `<optgroup label="Balsas">${B.map(o).join('')}</optgroup>` : ''}`;
}
function gsResumo(R) {
  R = R || gsReqs(); const A = R.filter(gsAberta), h7 = isoD(new Date(hoje() - 7 * 864e5)), h30 = isoD(new Date(hoje() - 30 * 864e5));
  const F30 = R.filter(r => r.st === 'fim' && (r.fim || '') >= h30);
  return { A, d15: A.filter(r => gsDias(r) > 15), d30: A.filter(r => gsDias(r) > 30), f7: R.filter(r => r.st === 'fim' && (r.fim || '') >= h7),
    med: F30.length ? F30.reduce((s, r) => s + gsDias(r), 0) / F30.length : null };
}
function vSemSc() {
  const R0 = gsReqs(), R = R0.filter(r => gsDaFrota(r, GS.fr)), M = gsResumo(R), q = GS.q.toLowerCase();
  let L = GS.f === 'fim' ? R.filter(r => !gsAberta(r)).sort((a, b) => (b.fim || '') < (a.fim || '') ? -1 : 1).slice(0, 60) : R.filter(gsAberta).filter(r => GS.f === 'ab' || r.tp === GS.f).sort((a, b) => gsDias(b) - gsDias(a) || (b.urg ? 1 : 0) - (a.urg ? 1 : 0));
  if (q) L = L.filter(r => [r.tp, r.num, r.txt, r.om, gsOnde(r.vessel), r.obs, r.stSk, ...(r.itens || []).map(i => i[1] + ' ' + i[2])].join(' ').toLowerCase().includes(q));
  const lin = r => { const d = gsDias(r), fx = gsFaixa(d), ab = gsAberta(r);
    return `<tr><td class="nowrap"><b>${esc(r.tp)} ${esc(r.num || 's/ nº')}</b><div class="note">${brD(r.date)}</div></td>
      <td class="nowrap">${ab ? `<span class="pill ${fx[0]}">${d} dia${d === 1 ? '' : 's'}</span>` : `<span class="pill p-mut">${d} dia${d === 1 ? '' : 's'}</span>`}${r.urg ? '<div class="note" style="color:var(--badt)"><b>urgente</b></div>' : ''}</td>
      <td>${esc(r.txt || '')}${gsItensHTML(r)}${r.obs ? `<div class="note">${esc(r.obs)}</div>` : ''}</td><td>${esc(gsOnde(r.vessel))}</td><td class="nowrap">${r.om ? 'OM ' + esc(r.om) : '—'}</td>
      <td class="nowrap">${esc(gsStTx(r))}${r.stSk ? `<div class="note">Sankhya: ${esc(r.stSk.toLowerCase())}</div>` : ''}${r.prev && ab ? `<div class="note">previsão ${brD(r.prev)}</div>` : ''}${r.fim && !ab ? `<div class="note">${brD(r.fim)}</div>` : ''}</td>
      <td class="nowrap">${can.edit() ? (ab ? `<button class="mbtn sm pri" data-gsfim="${r.id}">${r.tp === 'RM' ? 'Atendida' : 'Entregue'}</button> <button class="mbtn sm" data-gsed="${r.id}">Atualizar</button>` : `<button class="mbtn sm" data-gsed="${r.id}">Ver</button>`) : ''}</td></tr>`; };
  const chip = (k, t) => `<button class="${GS.f === k ? 'on' : ''}" data-gsf="${k}">${t}</button>`;
  const nk = (l, v, c) => `<div><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${v}</b></div>`;
  const nA = fr => R0.filter(r => gsAberta(r) && gsDaFrota(r, fr)).length, frc = (k, t) => `<button class="${GS.fr === k ? 'on' : ''}" data-gsfr="${k}">${t} <b>${nA(k)}</b></button>`;
  return enxCab('4.1 Solicitações e requisições', 'O que foi pedido no Sankhya e há quanto tempo · SC = solicitação de serviço externo ou material · RM = requisição de material do estoque · empurradores e balsas na mesma lista', `<span class="seg fr-sw">${frc('todas', 'Todas')}${frc('emp', 'Empurradores')}${frc('bal', 'Balsas')}</span>` + '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Resumo</h2><div class="sf-k">${nk('Em aberto', M.A.length)}${nk('Mais de 15 dias', M.d15.length, M.d15.length ? 'var(--badt)' : 'var(--okt)')}${nk('Mais de 30 dias', M.d30.length, M.d30.length ? 'var(--badt)' : 'var(--okt)')}${nk('Atendidas em 7 dias', M.f7.length)}${nk('Tempo médio de atendimento (30 dias)', M.med == null ? '—' : nf(M.med, 1) + ' dias')}</div></div>
   <div class="card"><div class="row"><h2>${GS.f === 'fim' ? 'Atendidas e canceladas' : 'Em aberto · do mais antigo para o mais novo'} · ${L.length}</h2><span class="sp"></span><input id="gsQ" placeholder="Buscar nº, item, OM…" value="${esc(GS.q)}" style="max-width:220px"></div>
     <div class="cm-chips">${chip('ab', 'Todas em aberto')}${chip('SC', 'SC')}${chip('RM', 'RM')}${chip('fim', 'Atendidas e canceladas')}</div>
     <div class="tw"><table class="t"><thead><tr><th>Nº · data</th><th>Em aberto</th><th>Item / serviço</th><th>Empurrador / balsa</th><th>OM</th><th>Situação</th><th></th></tr></thead>
     <tbody>${L.map(lin).join('') || `<tr><td colspan="7" class="note">${R.length ? 'Nada neste filtro.' : 'Nenhuma solicitação ou requisição cadastrada. Cadastre abaixo ou cole as linhas do Sankhya.'}</td></tr>`}</tbody></table></div></div>
   <div class="card"><div class="row"><h2>Nova solicitação ou requisição</h2><span class="sp"></span><label class="mbtn pri" style="cursor:pointer">📄 PDF de solicitação (SC)<input type="file" data-gspdf="SC" accept="application/pdf,.pdf" hidden></label> <label class="mbtn pri" style="cursor:pointer">📄 PDF de requisição (RM)<input type="file" data-gspdf="RM" accept="application/pdf,.pdf" hidden></label></div>
     <p class="note">O jeito mais rápido: clique no botão do tipo certo (SC ou RM; o impresso do Sankhya é igual para os dois, por isso é você quem diz o tipo) e escolha o PDF. O SMF lê o nº, a data, a situação, a aplicação (empurrador ou balsa), o requisito e os itens com quantidade; os valores não são lidos. Ou preencha à mão:</p><div class="g">
     <label class="f s1">Tipo<select id="gsT"><option>SC</option><option>RM</option></select></label><label class="f s1">Nº no Sankhya<input id="gsN"></label>
     <label class="f s1">Data do pedido<input type="date" id="gsD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s3">Item / serviço pedido<input id="gsX" placeholder="ex.: bomba Darka H53 3 CV trifásica"></label>
     <label class="f s2">Empurrador / balsa<select id="gsV">${gsOndeOps('')}</select></label><label class="f s1">OM ligada<input id="gsO"></label>
     <label class="f s1">Prioridade<select id="gsU"><option value="">Normal</option><option value="1">Urgente</option></select></label><label class="f s1">Previsão<input type="date" id="gsP"></label><label class="f s3">Observação<input id="gsB" placeholder="fornecedor, cotação, quem está cobrando…"></label></div>
     <div class="note" id="gsE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn pri" data-gsnova>Cadastrar</button></div></div>
   <div class="card"><h2>Colar do Sankhya</h2><p class="note">Copie as linhas do relatório do Sankhya (Excel) e cole aqui, uma por linha, nesta ordem de colunas: <b>Nº · Data · Descrição · Empurrador ou balsa · OM</b> (as duas últimas podem faltar). Nº já cadastrado do mesmo tipo é ignorado.</p>
     <div class="g"><label class="f s1">Tipo<select id="gsCT"><option>SC</option><option>RM</option></select></label><label class="f s5">Linhas<textarea id="gsC" rows="4" placeholder="4512&#9;28/10/2026&#9;Filtro de óleo Mitsubishi&#9;CJA XIII&#9;47890"></textarea></label></div>
     <div class="note" id="gsCE"></div><div class="row end"><button class="mbtn" data-gscola>Importar</button></div></div></div></div>`;
}
const gsNum = t => String(t || '').trim().replace(/\s+/g, ' ');
function gsData(s) {   // dd/mm/aaaa, dd/mm/aa ou aaaa-mm-dd
  s = String(s || '').trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/); if (!m) return ''; const y = m[3].length === 2 ? '20' + m[3] : m[3];
  return y + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
}
function gsAcharOnde(t) {
  t = String(t || '').trim().toUpperCase().replace(/\s+/g, ' '); if (!t) return '';
  const E = (S.cfg.frota || []).find(v => String(v.nome).toUpperCase() === t), B = typeof BALSAS !== 'undefined' ? BALSAS.find(b => String(b.nome).toUpperCase() === t) : null;
  return (E || B || {}).id || '';
}
async function gsNova() {
  if (!S.session) return loginModal(); const E = $('#gsE'), tp = $('#gsT').value, num = gsNum($('#gsN').value), txt = $('#gsX').value.trim(), date = $('#gsD').value;
  if (!num || !txt || !date) return E.textContent = 'Preencha o nº, a data e o item pedido.';
  if (gsReqs().some(r => r.tp === tp && r.num === num)) return E.textContent = tp + ' ' + num + ' já está cadastrada.';
  await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'screq', tp, num, date, txt, vessel: $('#gsV').value, om: gsNum($('#gsO').value), urg: !!$('#gsU').value, prev: $('#gsP').value, obs: $('#gsB').value.trim(), st: 'ab', por: S.session.name, hist: [[isoD(hoje()), 'ab', S.session.name]] });
  toast(tp + ' ' + num + ' cadastrada.'); render();
}
async function gsColar() {
  if (!S.session) return loginModal(); const tp = $('#gsCT').value, out = $('#gsCE'), ja = new Set(gsReqs().filter(r => r.tp === tp).map(r => r.num));
  let ok = 0, rep = 0, ruim = 0;
  for (const ln of $('#gsC').value.split(/\r?\n/)) {
    if (!ln.trim()) continue; const c = ln.split(/\t|;/).map(x => x.trim()), num = gsNum(c[0]), date = gsData(c[1]);
    if (!num || !date || !c[2]) { ruim++; continue; } if (ja.has(num)) { rep++; continue; } ja.add(num);
    await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'screq', tp, num, date, txt: c[2], vessel: gsAcharOnde(c[3]), om: gsNum(c[4]), urg: false, prev: '', obs: '', st: 'ab', por: S.session.name, hist: [[isoD(hoje()), 'ab', S.session.name]] }); ok++;
  }
  toast(`${ok} importada(s)` + (rep ? ` · ${rep} já cadastrada(s)` : '') + (ruim ? ` · ${ruim} linha(s) sem nº, data ou descrição` : ''), 4000); if (ok) return render();
  out.textContent = ruim ? 'Confira as linhas: a 1ª coluna é o nº, a 2ª a data (dd/mm/aaaa) e a 3ª a descrição.' : 'Nada novo para importar.';
}
// itens da requisição (lidos do PDF do Sankhya): lista recolhida embaixo da descrição
function gsItensHTML(r) {
  const I = r.itens || []; if (!I.length) return '';
  return `<details class="gs-it"><summary class="note">${I.length} ite${I.length === 1 ? 'm' : 'ns'}${r.apl ? ' · aplicação ' + esc(r.apl) : ''}</summary><table class="t"><tbody>${I.map(i => `<tr><td class="note nowrap">${esc(i[1] || '')}</td><td>${esc(i[2] || '')}</td><td class="nowrap" style="text-align:right">${esc(nf(i[4], i[4] % 1 ? 2 : 0))} ${esc((i[3] || '').toLowerCase())}</td></tr>`).join('')}</tbody></table></details>`;
}
// ---------- leitura do PDF do Sankhya ----------
let GS_PDFJS = null;
function gsPdfLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return GS_PDFJS || (GS_PDFJS = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'lib/pdfjs/pdf.min.js';
    sc.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdfjs/pdf.worker.min.js'; ok(window.pdfjsLib); } catch (e) { no(e); } };
    sc.onerror = () => no(new Error('o leitor de PDF não carregou (sem sinal?)')); document.head.appendChild(sc); }).catch(e => { GS_PDFJS = null; throw e; }));
}
// texto do PDF em linhas, como impresso: pedaços na mesma altura viram uma linha; distância grande entre eles vira tabulação
async function gsPdfLinhas(file) {
  const lib = await gsPdfLib(), doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise, L = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent(), Y = [];
    tc.items.filter(i => i.str && i.str.trim()).forEach(i => { const y = i.transform[5], x = i.transform[4]; let g = Y.find(r => Math.abs(r.y - y) < 2.5); if (!g) Y.push(g = { y, P: [] }); g.P.push({ x, w: i.width || 0, t: i.str }); });
    Y.sort((a, b) => b.y - a.y).forEach(g => { g.P.sort((a, b) => a.x - b.x); let t = '', fim = null;
      g.P.forEach(q => { if (fim != null) t += q.x - fim > 12 ? '\t' : q.x - fim > 1 ? ' ' : ''; t += q.t; fim = q.x + q.w; }); L.push(t.replace(/ {2,}/g, ' ').trim()); });
  }
  return L;
}
const gsNumBR = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
// empurrador ou balsa citado no texto (o nome mais longo vence: “CJA XIV” antes de “CJA X”)
function gsOndeTexto(t) {
  t = ' ' + String(t || '').toUpperCase().replace(/[\\/]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const C = [...(S.cfg.frota || []), ...(typeof BALSAS !== 'undefined' ? BALSAS : [])].map(v => [v.id, String(v.nome).toUpperCase()]).sort((a, b) => b[1].length - a[1].length);
  const a = C.find(([, n]) => new RegExp('[^A-Z0-9]' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^A-Z0-9]').test(t)); return a ? a[0] : '';
}
function gsLerSankhya(L) {
  const tudo = L.join('\n'), achar = re => { const m = tudo.match(re); return m ? m[1].trim() : ''; }, R = { itens: [] };
  R.num = achar(/N[º°o]\.?\s*\t?\s*(\d{3,})/); R.date = gsData(achar(/\bData\s*\t?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/));
  R.stSk = achar(/\b(EM APROVA[ÇC][ÃA]O|AGUARDANDO APROVA[ÇC][ÃA]O|APROVAD[OA]|REPROVAD[OA]|PENDENTE|ATENDID[OA]|CANCELAD[OA]|LIBERAD[OA]|CONFIRMAD[OA])\b/i).toUpperCase();
  R.apl = achar(/APLICA[ÇC][ÃA]O:\s*([^\t\n]+)/i); R.nec = achar(/NECESSIDADE:\s*([^\t\n]+)/i);
  const iR = L.findIndex(l => /REQUISITO:/i.test(l));
  if (iR >= 0) { R.req = L[iR].replace(/^.*REQUISITO:\s*/i, '').split('\t')[0].trim(); const c = (L[iR + 1] || '').split('\t')[0].trim();
    if (c && !/:/.test(c) && /^[A-ZÀ-Ú0-9 ,.\-/()]+$/.test(c) && c.length < 60) R.req += ' ' + c; }
  L.forEach(l => { const m = l.replace(/\t/g, ' ').match(/^(\d{1,3})\s+(\d{1,8})\s+(.+?)\s+([A-Z]{1,4})\s+(\d{1,3}(?:\.\d{3})*,\d+)\s+\d[\d.]*,\d+\s+\d[\d.]*,\d+$/);
    if (m) R.itens.push([+m[1], m[2], m[3].trim(), m[4], gsNumBR(m[5])]); });
  R.vessel = gsOndeTexto(R.apl) || gsOndeTexto(R.req); R.st = /APROVAD|LIBERAD|CONFIRMAD/.test(R.stSk) && !/EM APROVA|AGUARDANDO/.test(R.stSk) ? 'apr' : /ATENDID/.test(R.stSk) ? 'fim' : /CANCELAD|REPROVAD/.test(R.stSk) ? 'can' : 'ab';
  return R;
}
async function gsPdfLer(file, tp) {   // tp = SC ou RM, escolhido pelo botão (o impresso do Sankhya é igual para os dois)
  if (!S.session) return loginModal(); toast('Lendo o PDF…', 1500); let R;
  try { R = gsLerSankhya(await gsPdfLinhas(file)); R.tp = tp === 'SC' ? 'SC' : 'RM'; } catch (e) { return toast('Não foi possível ler o PDF: ' + e.message, 5000); }
  if (!R.num && !R.itens.length) return toast('Não encontrei nº nem itens neste PDF. Ele é o impresso de requisição ou pedido do Sankhya?', 6000);
  const ja = gsReqs().find(r => r.tp === R.tp && r.num === R.num && r.num);
  const TPN = { SC: 'solicitação (SC)', RM: 'requisição (RM)' };
  modal(`<h2>${ja ? 'Atualizar' : 'Cadastrar'} ${TPN[R.tp]} pelo PDF do Sankhya</h2><p class="note">Confira o que foi lido. Os valores unitário e total do impresso não são lidos.${ja ? ` Já existe ${esc(ja.tp)} ${esc(ja.num)}: os itens, o requisito e a situação no Sankhya serão atualizados; a situação no SMF e o histórico continuam.` : ''}</p>
    <div class="g"><label class="f s1">Tipo<input id="gpT" value="${R.tp}" readonly title="Escolhido no botão. Para trocar, cancele e use o outro botão."></label><label class="f s1">Nº<input id="gpN" value="${esc(R.num)}"></label>
    <label class="f s1">Data<input type="date" id="gpD" value="${esc(R.date || isoD(hoje()))}" max="${isoD(hoje())}"></label><label class="f s1">No Sankhya<input id="gpK" value="${esc(R.stSk)}"></label>
    <label class="f s2">Empurrador / balsa${R.apl ? ` <span class="note">(aplicação: ${esc(R.apl)})</span>` : ''}<select id="gpV">${gsOndeOps(R.vessel)}</select></label>
    <label class="f s4">Requisito / para quê<input id="gpX" value="${esc(R.req || R.nec || (R.itens[0] || [])[2] || '')}"></label><label class="f s1">OM ligada<input id="gpO" value="${esc(ja ? ja.om || '' : '')}"></label><label class="f s1">Prioridade<select id="gpU"><option value="">Normal</option><option value="1"${ja && ja.urg ? ' selected' : ''}>Urgente</option></select></label></div>
    <h3 style="margin:12px 0 4px">Itens · ${R.itens.length}</h3><div class="tw" style="max-height:38vh;overflow:auto"><table class="t"><thead><tr><th>Item</th><th>Código</th><th>Descrição</th><th style="text-align:right">Qtd</th><th>Und</th></tr></thead><tbody>${R.itens.map(i => `<tr><td>${i[0]}</td><td class="nowrap">${esc(i[1])}</td><td>${esc(i[2])}</td><td style="text-align:right">${nf(i[4], i[4] % 1 ? 2 : 0)}</td><td>${esc(i[3])}</td></tr>`).join('') || '<tr><td colspan="5" class="note">Nenhum item reconhecido.</td></tr>'}</tbody></table></div>
    <div class="note" id="gpE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="gpOk">${ja ? 'Atualizar' : 'Cadastrar'}</button></div>`, true);
  $('#gpOk').onclick = async () => { const tp = $('#gpT').value, num = gsNum($('#gpN').value), date = $('#gpD').value, txt = $('#gpX').value.trim();
    if (!num || !date || !txt) return $('#gpE').textContent = 'Nº, data e requisito são obrigatórios.';
    const C = { tp, num, date, txt, vessel: $('#gpV').value, om: gsNum($('#gpO').value), urg: !!$('#gpU').value, stSk: $('#gpK').value.trim(), apl: R.apl, nec: R.nec, itens: R.itens };
    const x = gsReqs().find(r => r.tp === tp && r.num === num);
    if (x) { Object.assign(x, C); await saveRec(x); toast(tp + ' ' + num + ' atualizada.'); }
    else { await saveRec(Object.assign({ id: uid('snap'), kind: 'snap', tipo: 'screq', prev: '', obs: '', st: R.st, fim: ['fim', 'can'].includes(R.st) ? isoD(hoje()) : '', por: S.session.name, hist: [[isoD(hoje()), R.st, S.session.name]] }, C)); toast(tp + ' ' + num + ' cadastrada com ' + R.itens.length + ' ite' + (R.itens.length === 1 ? 'm.' : 'ns.')); }
    closeModal(); render(); };
}
function gsEditar(id) {
  const r = S.recs.get(id); if (!r) return; if (!S.session) return loginModal(); const ab = gsAberta(r);
  modal(`<h2>${esc(r.tp)} ${esc(r.num)} · ${gsDias(r)} dia(s)</h2><p class="note">Pedida em ${brD(r.date)} por ${esc(r.por || '')}</p><div class="g">
    <label class="f s4">Item / serviço<input id="geX" value="${esc(r.txt || '')}"></label><label class="f s2">Data do pedido<input type="date" id="geD" value="${esc(r.date || '')}" max="${isoD(hoje())}"></label>
    <label class="f s2">Empurrador / balsa<select id="geV">${gsOndeOps(r.vessel || '')}</select></label><label class="f s1">OM ligada<input id="geO" value="${esc(r.om || '')}"></label>
    <label class="f s1">Prioridade<select id="geU"><option value="">Normal</option><option value="1"${r.urg ? ' selected' : ''}>Urgente</option></select></label>
    <label class="f s2">Situação<select id="geS">${gsStOps(r.tp).map(k => `<option value="${k}"${r.st === k ? ' selected' : ''}>${esc(gsStTx(r, k))}</option>`).join('')}</select></label>
    <label class="f s2">Previsão<input type="date" id="geP" value="${esc(r.prev || '')}"></label><label class="f s2">Data de atendimento<input type="date" id="geF" value="${esc(r.fim || '')}" max="${isoD(hoje())}"></label>
    <label class="f s6">Observação<input id="geB" value="${esc(r.obs || '')}"></label></div>
    ${(r.itens || []).length ? `<h3 style="margin:10px 0 4px">Itens</h3>${gsItensHTML(r).replace('<details class="gs-it">', '<details class="gs-it" open>')}` : ''}${r.stSk ? `<p class="note">Situação no Sankhya (lida do PDF): ${esc(r.stSk.toLowerCase())}</p>` : ''}
    ${(r.hist || []).length ? `<p class="note">Histórico: ${r.hist.map(h => `${brD(h[0])} ${esc(gsStTx(r, h[1]))} (${esc(h[2] || '')})`).join(' · ')}</p>` : ''}
    <div class="note" id="geE" style="color:var(--badt)"></div><div class="row end">${can.admin() ? '<button class="mbtn" id="geDel">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Fechar</button><button class="mbtn pri" id="geOk">Salvar</button></div>`);
  $('#geOk').onclick = async () => { const st = $('#geS').value, fim = ['fim', 'can'].includes(st) ? ($('#geF').value || isoD(hoje())) : '';
    if (!$('#geX').value.trim() || !$('#geD').value) return $('#geE').textContent = 'Item e data do pedido são obrigatórios.';
    if (st !== r.st) r.hist = [...(r.hist || []), [isoD(hoje()), st, S.session.name]];
    Object.assign(r, { txt: $('#geX').value.trim(), date: $('#geD').value, vessel: $('#geV').value, om: gsNum($('#geO').value), urg: !!$('#geU').value, st, prev: $('#geP').value, fim, obs: $('#geB').value.trim() });
    await saveRec(r); closeModal(); toast('Salvo.'); render(); };
  const del = $('#geDel'); if (del) del.onclick = async () => { if (!confirm('Excluir ' + r.tp + ' ' + r.num + '?')) return; r.excluido = true; await saveRec(r); closeModal(); render(); };
  if (!ab) { const f = $('#geF'); if (f && !f.value) f.value = r.fim || ''; }
}
async function gsAtendida(id) {
  const r = S.recs.get(id); if (!r) return; if (!S.session) return loginModal();
  Object.assign(r, { st: 'fim', fim: isoD(hoje()), hist: [...(r.hist || []), [isoD(hoje()), 'fim', S.session.name]] }); await saveRec(r); toast(r.tp + ' ' + r.num + ' ' + gsStTx(r).toLowerCase() + '.'); render();
}
// ---------- telas, cliques e menu ----------
VX.semsc = vSemSc;
AFTER.semsc = () => { const m = $('#main');
  m.onclick = async e => { const t = e.target.closest('[data-gsf],[data-gsfr],[data-gsnova],[data-gscola],[data-gsed],[data-gsfim]'); if (!t) return; const d = t.dataset;
    if (d.gsfr) { GS.fr = d.gsfr; return render(); }
    if (d.gsf) { GS.f = d.gsf; return render(); }
    if (d.gsnova !== undefined) return gsNova();
    if (d.gscola !== undefined) return gsColar();
    if (d.gsed) return gsEditar(d.gsed);
    if (d.gsfim) return gsAtendida(d.gsfim); };
  m.onchange = e => { const tp = e.target.dataset.gspdf; if (tp) { const f = e.target.files[0]; e.target.value = ''; if (f) gsPdfLer(f, tp); } };
  m.oninput = e => { if (e.target.id === 'gsQ') { GS.q = e.target.value; clearTimeout(m._gs); m._gs = setTimeout(() => { render(); const q = $('#gsQ'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 400); } };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_semsc_lay', '[data-enxreset]'); };
ENX_OK.push('semsc');
PCM_MENU.splice(PCM_MENU.findIndex(g => /^5 /.test(g[0])), 0, ['4 · Gestão semanal', [['semsc', '4.1 Solicitações e requisições', 'screq']]]);   // antes do fechamento mensal (Supervisor, 06/11/2026)
{ const st = document.createElement('style'); st.textContent = '.gs-it summary{cursor:pointer;margin-top:2px}.gs-it table{margin:4px 0 0;font-size:12.5px}.gs-it td{padding:2px 6px}'; document.head.appendChild(st); }
ICO.screq = '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>';
