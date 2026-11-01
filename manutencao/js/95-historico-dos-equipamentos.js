'use strict';
/* =====================================================================
   HISTÓRICO DOS EQUIPAMENTOS (SMF 3.128, 01/11/2026; pedido do Supervisor: “uma planilha para lançar os principais
   acontecimentos de cada motor, reversor e MCA de cada embarcação — a data de uma reforma grande, o que foi feito e em que
   documento está registrado, a data de uma substituição — e uma linha do tempo por equipamento, com botões para escolher
   a embarcação e o equipamento”). Aberta também pelos empurradores do topo da Matriz técnica (../manutencao/#enxeq/CJA%20XIV).
   · Acontecimento lançado = snap tipo 'evento' (vessel, eq = BB/BE/CE do MCP · R+pos do reversor · MCA1..3 · UN = empurrador,
     date, tp, txt, h, doc, quem, obs, por). O servidor já aceita snap: sem mudança no Code.gs.
   · Entram sozinhos, do que o SMF já guarda: troca de reversor (base com revTroca), troca de horímetro (v.horOff),
     reformas do empurrador (snap 'reforma', 1.3) e docagens (docaHist). Esses só se corrigem na tela de origem.
   · Para cada equipamento: modelo e nº de série da Matriz técnica (MATRIZ_VG, js/87), última reforma geral e última
     substituição com as horas trabalhadas desde então (horímetro atual − horímetro do acontecimento).
   · Fotos (SMF 3.130): fotos[] {tipo:'FOTO', src, at, fid} no próprio evento; sobem ao Drive pelo fotosEnviar (js/08), pasta <empurrador>/Fotos,
     e o stripForCloud manda à planilha só a referência; noutro aparelho a imagem vem do Drive (getFile, HE_FT).
   · Planilha com filtros, “Colar planilha” (do Excel) e “Baixar planilha” (CSV para o Excel).
   ===================================================================== */
const HE = { v: '', eq: '', arg: '' };
const HE_TP = { ref: ['Reforma geral (overhaul)', '#0B2A5B'], parc: ['Reforma parcial · retífica', '#1A73E8'], subst: ['Substituição do equipamento', '#C5221F'],
  comp: ['Troca de componente principal', '#E37400'], rep: ['Reparo de grande porte', '#9C27B0'], inst: ['Instalação · entrada em operação', '#1E8E3E'],
  doca: ['Docagem', '#00796B'], hor: ['Troca de horímetro', '#5F6368'], outro: ['Outro', '#80868B'] };
const HE_MAN = ['ref', 'parc', 'subst', 'comp', 'rep', 'inst', 'doca', 'outro'];   // tipos que se lançam à mão
// equipamentos do empurrador, com a identificação da Matriz técnica
function heEqs(v) {
  if (!v) return [];
  const g = (typeof MATRIZ_VG !== 'undefined' && MATRIZ_VG[v.nome]) || {}, fm = (FROTA_MATRIZ[v.nome] || {}).mca || [], mp = mcpPos(v), mono = v.mcp === 'mono', L = [];
  const id = (A, i, alt) => A && A[i] ? A[i].join(': ') : alt;
  mp.forEach((p, i) => L.push({ k: p, tp: 'mcp', nome: mono ? 'MCP' : 'MCP ' + p, desc: id(g.prop, i, 'Mitsubishi ' + ((v.mcpMod || {})[p] || '')), hp: p }));
  mp.forEach((p, i) => { if ((v.rev || {})[p]) L.push({ k: 'R' + p, tp: 'rev', nome: mono ? 'Reversor' : 'Reversor ' + p, desc: id(g.red, i, EQN[v.rev[p]] || v.rev[p]), hp: p }); });
  MCAS.forEach((p, i) => { if (!(v.mca || {})[p]) return; const sn = (fm[i] || [])[0] || ''; L.push({ k: p, tp: 'mca', nome: 'MCA ' + (i + 1), desc: id(g.aux, i, (v.mcaMod || {})[p] || '') + (/\d/.test(sn) ? ', nº ' + sn : ''), hp: p }); });
  L.push({ k: 'UN', tp: 'emp', nome: 'Empurrador', desc: 'casco, reformas e docagens', hp: null });
  return L;
}
const heEqNome = (v, k) => { const e = heEqs(v).find(x => x.k === k); return e ? e.nome : k || '—'; };
// acontecimentos: os lançados + os que o SMF já registra
function heEventos(vid) {
  const F = vid ? [vessel(vid)].filter(Boolean) : S.cfg.frota, L = [];
  recs('snap').forEach(r => { if (r.tipo === 'evento' && !r.excluido && (!vid || r.vessel === vid)) L.push({ id: r.id, vessel: r.vessel, eq: r.eq || 'UN', date: r.date, tp: r.tp || 'outro', txt: r.txt || '', h: r.h, doc: r.doc || '', quem: r.quem || '', obs: r.obs || '', fotos: r.fotos || [], man: true }); });
  F.forEach(v => {
    const vis = {}; recs('base').forEach(b => { if (b.vessel !== v.id || !b.revTroca || b.excluido) return; const k = b.pos + b.date; if (vis[k]) return; vis[k] = 1; const t = b.revTroca;
      L.push({ vessel: v.id, eq: 'R' + b.pos, date: b.date, tp: 'subst', txt: `Troca do reversor (${(t.unidade || '').toLowerCase() || 'unidade'})${t.anterior && t.modelo && t.anterior !== t.modelo ? ': ' + (EQN[t.anterior] || t.anterior) + ' → ' + (EQN[t.modelo] || t.modelo) : ''}${t.serie ? ' · série ' + t.serie : ''}`, h: b.h, doc: t.om ? 'OM ' + t.om : '', quem: b.by || '', src: '1.1 Horímetros · troca do reversor' }); });
    Object.entries(v.horOff || {}).forEach(([p, A]) => (A || []).forEach(x => L.push({ vessel: v.id, eq: p, date: x.date, tp: 'hor', txt: `Horímetro trocado ou consertado: total na troca ${nf(+x.base || 0)} h, o novo começou em ${nf(+x.ini || 0)} h`, h: x.base, doc: '', quem: x.by || '', src: '1.1 Horímetros' })));
    if (typeof vgReformas === 'function') vgReformas(v.id).forEach(r => L.push({ vessel: v.id, eq: 'UN', date: r.ini || r.fim || '', tp: 'ref', txt: `Reforma do empurrador${r.fim ? ' até ' + brD(r.fim) : ' (em andamento)'}${r.local ? ' · ' + r.local : ''}${r.obs ? ' · ' + r.obs : ''}`, doc: '', quem: r.por || '', src: '1.3 Viagens e comboios · reformas' }));
    try { docaHist(v).forEach(d => L.push({ vessel: v.id, eq: 'UN', date: d.ent, tp: 'doca', txt: `Docagem${d.sai ? ' até ' + brD(d.sai) : ''}${d.rec && d.rec.estaleiro ? ' · ' + d.rec.estaleiro : ''}`, h: '', doc: d.rec && d.rec.om ? 'OM ' + d.rec.om : '', quem: '', src: 'Calibração e docagem' })); } catch (e) { }
  });
  return L.filter(x => x.date).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
}
const heDesde = (vid, hp, x) => { if (!hp || x.h == null || x.h === '' || isNaN(+x.h)) return null; const a = horAtual(vid, hp); if (!a || a.h == null) return null; const d = Math.round(a.h - +x.h); return d >= 0 ? d : null; };
const heAnos = d => { const m = Math.round((hoje() - pD(d)) / (864e5 * 30.44)); return m < 12 ? m + (m === 1 ? ' mês' : ' meses') : nf(m / 12, 1).replace(',0', '') + ' anos'; };
const hePill = tp => `<span class="he-p" style="--c:${(HE_TP[tp] || HE_TP.outro)[1]}">${(HE_TP[tp] || HE_TP.outro)[0]}</span>`;
// linha do tempo em faixas: uma faixa por equipamento (empurrador escolhido) ou por empurrador (frota)
function heFaixas(F, E, dimNome) {
  if (!E.length) return '<p class="note">Nenhum acontecimento lançado ainda. Use <b>+ Lançar acontecimento</b> ou <b>Colar planilha</b>.</p>';
  const W = 1000, X0 = 170, X1 = W - 20, H = 30, y0 = 26, d0 = pD(E[0].date), a0 = Math.min(d0.getFullYear(), hoje().getFullYear() - 4), a1 = hoje().getFullYear() + 1;
  const t0 = +new Date(a0, 0, 1), t1 = +new Date(a1, 0, 1), xx = d => X0 + (X1 - X0) * (+pD(d) - t0) / (t1 - t0), h = y0 + F.length * H + 8;
  let s = `<svg viewBox="0 0 ${W} ${h}" class="he-svg" role="img" aria-label="Linha do tempo">`;
  for (let a = a0; a <= a1; a++) { const x = X0 + (X1 - X0) * (+new Date(a, 0, 1) - t0) / (t1 - t0); s += `<line x1="${x}" x2="${x}" y1="18" y2="${h - 6}" stroke="#E3E6EA"/>` + (a < a1 ? `<text x="${x + 3}" y="13" font-size="10.5" fill="#5F6368">${a}</text>` : ''); }
  const xh = xx(isoD(hoje())); s += `<line x1="${xh}" x2="${xh}" y1="18" y2="${h - 6}" stroke="#C5221F" stroke-dasharray="3 3"/><text x="${xh - 3}" y="${h - 1}" font-size="9.5" fill="#C5221F" text-anchor="end">hoje</text>`;
  F.forEach((f, i) => { const y = y0 + i * H + H / 2; s += `<rect x="0" y="${y - H / 2 + 2}" width="${W}" height="${H - 4}" fill="${i % 2 ? '#fff' : '#F6F8FB'}" opacity=".7"/><text x="8" y="${y + 4}" font-size="11.5" fill="#202124"${f.b ? ' font-weight="600"' : ''}>${esc(f.nome)}</text><line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" stroke="#D5DAE1"/>`;
    E.filter(x => dimNome(x) === f.k).forEach(x => { const c = (HE_TP[x.tp] || HE_TP.outro)[1];
      s += `<g class="he-dot" data-nodrag${x.man ? ` data-heed="${esc(x.id)}"` : ''}><title>${esc(brD(x.date) + ' · ' + (HE_TP[x.tp] || HE_TP.outro)[0] + ' · ' + x.txt + (x.doc ? ' · ' + x.doc : '') + ((x.fotos || []).length ? ' · ' + x.fotos.length + ' foto(s)' : ''))}</title><circle cx="${xx(x.date)}" cy="${y}" r="7" fill="${c}" stroke="#fff" stroke-width="2"/></g>`; }); });
  return s + '</svg>';
}
// fotos: a imagem fica no aparelho até subir ao Drive (fotosEnviar, js/08); depois só a referência (fid) vai à planilha e a imagem vem do Drive
const HE_FT = {};
const heMini = (x, k, cls) => { const f = x.fotos[k], src = f.src || HE_FT[f.fid] || ''; return `<img class="${cls || 'he-mi'}" data-hefoto="${esc(x.id)}|${k}"${!src && f.fid ? ` data-hefid="${esc(f.fid)}"` : ''} src="${src}" alt="foto ${k + 1}" title="${f.fid ? 'no Google Drive' : 'só neste aparelho · sobe ao Drive quando houver sinal'}">`; };
const heMinis = x => (x.fotos || []).length ? `<div class="he-ms">${x.fotos.map((_, k) => heMini(x, k)).join('')}</div>` : '';
async function heCarregaFotos() {
  const L = [...document.querySelectorAll('img[data-hefid]')]; if (!L.length || !S.url || !S.session) return;
  for (const im of L) { const fid = im.dataset.hefid; if (!HE_FT[fid]) { try { const j = await api('getFile', { fileId: fid }); if (j.ok) HE_FT[fid] = 'data:' + (j.mime || 'image/jpeg') + ';base64,' + j.data; } catch (e) { } }
    if (HE_FT[fid]) { document.querySelectorAll(`img[data-hefid="${fid}"]`).forEach(i => { i.src = HE_FT[fid]; i.removeAttribute('data-hefid'); }); } }
}
function heGaleria(id, k) {
  const x = heEventos(HE.v).concat(heEventos('')).find(y => y.id === id); if (!x || !x.fotos.length) return; let i = +k || 0;
  const des = () => { const f = x.fotos[i], src = f.src || HE_FT[f.fid] || '';
    $('#heGal').innerHTML = `<div class="he-gi">${src ? `<img src="${src}" alt="">` : '<p class="note">Carregando do Google Drive…</p>'}</div><div class="row" style="align-items:center"><button class="mbtn" id="heGa"${i ? '' : ' disabled'}>‹ Anterior</button><span class="note" style="flex:1;text-align:center">Foto ${i + 1} de ${x.fotos.length} · ${f.fid ? '☁ no Google Drive' : 'só neste aparelho'}</span><button class="mbtn" id="heGp"${i < x.fotos.length - 1 ? '' : ' disabled'}>Próxima ›</button></div>`;
    $('#heGa').onclick = () => { i--; des(); }; $('#heGp').onclick = () => { i++; des(); };
    if (!src && f.fid && S.url && S.session) api('getFile', { fileId: f.fid }).then(j => { if (j.ok) { HE_FT[f.fid] = 'data:' + (j.mime || 'image/jpeg') + ';base64,' + j.data; des(); } }).catch(() => { }); };
  const vx = vessel(x.vessel);
  modal(`<h2>${esc(vx ? vx.nome : '')} · ${esc(heEqNome(vx, x.eq))} · ${brD(x.date)}</h2><p class="note">${esc(x.txt)}</p><div id="heGal"></div><div class="row end"><button class="mbtn" data-close>Fechar</button></div>`); des();
}
// linha do tempo vertical de um equipamento
function heVertical(v, e, E) {
  if (!E.length) return `<p class="note">Nenhum acontecimento de ${esc(e.nome)} ainda.</p>`;
  return `<div class="he-vt">${E.slice().reverse().map(x => { const d = heDesde(v.id, e.hp, x);
    return `<div class="he-vi" style="--c:${(HE_TP[x.tp] || HE_TP.outro)[1]}"><div class="he-vd"><b>${brD(x.date)}</b><span>há ${heAnos(x.date)}</span></div><div class="he-vc">${hePill(x.tp)}<div class="he-vtx">${esc(x.txt)}</div>
      <div class="he-vm">${x.h != null && x.h !== '' ? `<span>Horímetro <b>${nf(+x.h)} h</b>${d != null ? ` · ${nf(d)} h trabalhadas desde então` : ''}</span>` : ''}${x.doc ? `<span>📄 ${esc(x.doc)}</span>` : '<span class="he-sd">sem documento informado</span>'}${x.quem ? `<span>${esc(x.quem)}</span>` : ''}${x.src ? `<span class="note">do SMF · ${esc(x.src)}</span>` : ''}</div>
      ${x.obs ? `<div class="note">${esc(x.obs)}</div>` : ''}${heMinis(x)}${x.man ? `<button class="mbtn sm" data-heed="${esc(x.id)}">Editar</button>` : ''}</div></div>`; }).join('')}</div>`;
}
// ficha resumida de cada equipamento do empurrador
function heFicha(v, e, E) {
  const ult = tps => E.filter(x => tps.includes(x.tp)).pop(), R = ult(['ref']), S0 = ult(['subst', 'inst']), a = e.hp ? horAtual(v.id, e.hp) : null;
  const lin = (t, x) => !x ? `<tr><th>${t}</th><td class="note">não lançada</td></tr>` : `<tr><th>${t}</th><td>${brD(x.date)} · há ${heAnos(x.date)}${(d => d != null ? ` · <b>${nf(d)} h</b> desde então` : '')(heDesde(v.id, e.hp, x))}${x.doc ? ` · ${esc(x.doc)}` : ''}</td></tr>`;
  return `<table class="he-f"><tr><th>Identificação</th><td>${esc(e.desc)}</td></tr>${a ? `<tr><th>Horímetro atual</th><td>${nf(a.h)} h${a.est ? ' (estimado)' : ' em ' + brD(a.date)}</td></tr>` : ''}
    ${e.tp !== 'emp' ? lin('Última reforma geral', R) + lin('Última substituição · instalação', S0) : lin('Última reforma', R) + lin('Última docagem', ult(['doca']))}<tr><th>Acontecimentos</th><td>${E.length}</td></tr></table>`;
}
function vEnxEq() {
  if (ARG && ARG !== HE.arg) { HE.arg = ARG; const a = ARG.trim(), v = S.cfg.frota.find(x => x.id === a || x.nome === a || x.nome === 'CJA ' + a); if (v) { HE.v = v.id; HE.eq = ''; } }
  const v = vessel(HE.v), Eqs = heEqs(v); if (HE.eq && !Eqs.some(e => e.k === HE.eq)) HE.eq = '';
  const E = heEventos(v ? v.id : ''), eqSel = Eqs.find(e => e.k === HE.eq);
  const nEv = vid => heEventos(vid).length;
  const chV = `<div class="he-ch"><button class="${!v ? 'on' : ''}" data-hev="">Toda a frota</button>${S.cfg.frota.map(x => { const n = nEv(x.id); return `<button class="${v && v.id === x.id ? 'on' : ''}" data-hev="${x.id}">${esc(x.nome)}${n ? `<i>${n}</i>` : ''}</button>`; }).join('')}</div>`;
  const chE = v ? `<div class="he-ch he-ch2"><button class="${!HE.eq ? 'on' : ''}" data-heeq="">Todos os equipamentos</button>${Eqs.map(e => { const n = E.filter(x => x.eq === e.k).length; return `<button class="${HE.eq === e.k ? 'on' : ''}" data-heeq="${e.k}">${esc(e.nome)}${n ? `<i>${n}</i>` : ''}</button>`; }).join('')}</div>` : '';
  const Ef = eqSel ? E.filter(x => x.eq === eqSel.k) : E;
  const leg = `<div class="he-lg">${Object.entries(HE_TP).filter(([k]) => E.some(x => x.tp === k)).map(([, [n, c]]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`;
  let corpo;
  if (!v) corpo = `<div class="card"><h2>Linha do tempo da frota · ${E.length} acontecimento${E.length === 1 ? '' : 's'}</h2>${leg}${heFaixas(S.cfg.frota.map(x => ({ k: x.id, nome: x.nome })), E, x => x.vessel)}<p class="note">Cada ponto é um acontecimento. Escolha um empurrador para ver por equipamento.</p></div>`;
  else if (!eqSel) corpo = `<div class="card"><h2>Linha do tempo · ${esc(v.nome)} por equipamento</h2>${leg}${heFaixas(Eqs.map(e => ({ k: e.k, nome: e.nome, b: e.tp !== 'emp' })), E, x => x.eq)}<p class="note">Passe o mouse num ponto para ver o acontecimento; clique para editar o que foi lançado aqui.</p></div>
    <div class="card"><h2>Equipamentos · ${esc(v.nome)}</h2><div class="he-eqs">${Eqs.map(e => { const Ee = E.filter(x => x.eq === e.k); return `<div class="he-eq" data-heeq="${e.k}"><div class="he-eqh"><b>${esc(e.nome)}</b><span class="note">${Ee.length} acontecimento${Ee.length === 1 ? '' : 's'}</span></div>${heFicha(v, e, Ee)}</div>`; }).join('')}</div></div>`;
  else corpo = `<div class="card"><h2>${esc(v.nome)} · ${esc(eqSel.nome)}</h2>${heFicha(v, eqSel, Ef)}</div><div class="card"><h2>Linha do tempo · ${esc(eqSel.nome)}</h2>${heVertical(v, eqSel, Ef)}</div>`;
  const tab = `<div class="card"><h2>Planilha de acontecimentos · ${v ? esc(v.nome) + (eqSel ? ' · ' + esc(eqSel.nome) : '') : 'toda a frota'} · ${Ef.length}</h2>${Ef.length ? `<div class="tw"><table class="t he-t"><thead><tr><th>Data</th>${v ? '' : '<th>Empurrador</th>'}<th>Equipamento</th><th>Tipo</th><th>O que foi feito</th><th class="num">Horímetro</th><th>Documento</th><th>Executado por</th><th>Fotos</th><th></th></tr></thead><tbody>${Ef.slice().reverse().map(x => { const vx = vessel(x.vessel);
      return `<tr><td class="nowrap">${brD(x.date)}</td>${v ? '' : `<td class="nowrap"><b>${esc(vx ? vx.nome : '?')}</b></td>`}<td class="nowrap">${esc(heEqNome(vx, x.eq))}</td><td>${hePill(x.tp)}</td><td>${esc(x.txt)}${x.obs ? `<div class="note">${esc(x.obs)}</div>` : ''}</td><td class="num nowrap">${x.h != null && x.h !== '' ? nf(+x.h) + ' h' : '—'}</td><td>${x.doc ? esc(x.doc) : '<span class="he-sd">—</span>'}</td><td>${esc(x.quem || '')}</td><td class="nowrap">${(x.fotos || []).length ? `<span class="he-fc">${heMini(x, 0, 'he-mi he-mi1')}${x.fotos.length > 1 ? '<b>+' + (x.fotos.length - 1) + '</b>' : ''}</span>` : ''}</td><td class="nowrap">${x.man ? `<button class="mbtn sm" data-heed="${esc(x.id)}">Editar</button>` : `<span class="note" title="${esc(x.src || '')}">do SMF</span>`}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="note">Nada lançado para esta escolha.</p>'}
    <p class="note">“do SMF” = já registrado em outra tela (troca de reversor e de horímetro em 1.1, reforma em 1.3, docagem): corrija lá. O documento é onde o acontecimento está comprovado (OM do Sankhya, relatório da oficina, nota fiscal, laudo).</p></div>`;
  return enxCab('Histórico dos equipamentos', 'Reformas, substituições e grandes reparos de cada MCP, reversor e MCA, com a data, o horímetro e o documento que comprova',
    `${can.edit() ? '<button class="mbtn pri" data-henovo>+ Lançar acontecimento</button><button class="mbtn" data-hecola>Colar planilha</button>' : ''}<button class="mbtn" data-hecsv>Baixar planilha</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
    + `<div class="card he-sel"><h2>Escolha</h2>${chV}${chE}</div>` + corpo + tab + '</div></div>';
}
// ---------- lançar / editar ----------
function heModal(id) {
  const r = id ? S.recs.get(id) : null, vid = r ? r.vessel : HE.v || (S.cfg.frota[0] || {}).id, eq = r ? r.eq : HE.eq;
  const opE = vid => heEqs(vessel(vid)).map(e => `<option value="${e.k}"${e.k === eq ? ' selected' : ''}>${esc(e.nome)} · ${esc(e.desc)}</option>`).join('');
  modal(`<h2>${r ? 'Editar acontecimento' : 'Lançar acontecimento'}</h2><div class="g">
    <label class="f s2">Empurrador<select id="heV">${S.cfg.frota.map(x => `<option value="${x.id}"${x.id === vid ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
    <label class="f s4">Equipamento<select id="heE">${opE(vid)}</select></label>
    <label class="f s2">Data<input type="date" id="heD" value="${esc(r ? r.date : '')}"></label>
    <label class="f s4">Tipo<select id="heT">${HE_MAN.map(k => `<option value="${k}"${(r ? r.tp : 'ref') === k ? ' selected' : ''}>${HE_TP[k][0]}</option>`).join('')}</select></label>
    <label class="f s6">O que foi feito<textarea id="heX" rows="3" placeholder="Ex.: reforma geral do MCP na oficina X: camisas, pistões, anéis, bronzinas, retífica do cabeçote, bicos e bomba injetora">${esc(r ? r.txt : '')}</textarea></label>
    <label class="f s2">Horímetro do motor (h)<input id="heH" inputmode="decimal" value="${esc(r && r.h != null ? String(r.h) : '')}" placeholder="opcional"></label>
    <label class="f s4">Documento onde está registrado<input id="heDoc" value="${esc(r ? r.doc || '' : '')}" placeholder="Ex.: OM 12345 do Sankhya · relatório da oficina · NF 9876"></label>
    <label class="f s3">Executado por<input id="heQ" value="${esc(r ? r.quem || '' : '')}" placeholder="equipe própria ou empresa"></label>
    <label class="f s3">Observação<input id="heO" value="${esc(r ? r.obs || '' : '')}"></label>
    ${r && (r.fotos || []).length ? `<div class="f s6"><span>Fotos já salvas · clique no ✕ para tirar</span><div class="he-ms" id="heFx">${r.fotos.map((f, k) => `<span class="fx-t"><img src="${f.src || HE_FT[f.fid] || ''}" alt=""><button type="button" data-herm="${k}" title="Tirar esta foto">✕</button></span>`).join('')}</div></div>` : ''}
    ${enxFotoCampo('heF', 'Fotos (até 6 por vez) · antes, depois, plaqueta, peça trocada, relatório')}</div>
    <p class="note">Reversor: o horímetro é o do MCP do mesmo bordo. Use para o que muda a vida do equipamento (reforma, substituição, grande reparo); serviço do plano preventivo vai na 2.2.</p>
    <div class="row end">${r ? '<button class="mbtn" id="heDel" style="margin-right:auto;color:var(--badt)">Excluir</button>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="heOk">Salvar</button></div>`);
  $('#heV').onchange = e => { $('#heE').innerHTML = opE(e.target.value); };
  const tirar = new Set(); const fx = $('#heFx'); if (fx) fx.onclick = e => { const b = e.target.closest('[data-herm]'); if (!b) return; const k = +b.dataset.herm, sp = b.parentNode; if (tirar.has(k)) { tirar.delete(k); sp.style.opacity = ''; } else { tirar.add(k); sp.style.opacity = '.25'; } };
  $('#heOk').onclick = async () => {
    const d = $('#heD').value, tx = $('#heX').value.trim(), hs = $('#heH').value.trim().replace(/\./g, '').replace(',', '.'), h = hs === '' ? '' : +hs;
    if (!d) return toast('Informe a data.'); if (d > isoD(hoje())) return toast('A data não pode ser futura.'); if (!tx) return toast('Escreva o que foi feito.'); if (h !== '' && (isNaN(h) || h < 0)) return toast('Horímetro inválido.');
    const novas = []; for (const f of fxArq('heF').slice(0, 6)) novas.push({ tipo: 'FOTO', src: await comprimir(f), at: Date.now() });
    const o = r || { id: uid('snap'), kind: 'snap', tipo: 'evento', por: S.session.name };
    o.fotos = (o.fotos || []).filter((_, k) => !tirar.has(k)).concat(novas);
    Object.assign(o, { vessel: $('#heV').value, eq: $('#heE').value, date: d, tp: $('#heT').value, txt: tx, h, doc: $('#heDoc').value.trim(), quem: $('#heQ').value.trim(), obs: $('#heO').value.trim() });
    await saveRec(o); HE.v = o.vessel; closeModal(); toast('Acontecimento salvo' + (novas.length ? ' · ' + novas.length + ' foto(s) sobem ao Google Drive em seguida' : '') + '.'); render(); };
  const del = $('#heDel'); if (del) del.onclick = async () => { if (!confirm('Excluir este acontecimento?')) return; r.excluido = true; await saveRec(r); closeModal(); render(); };
}
// ---------- colar do Excel ----------
const heTpTexto = t => { t = (t || '').toLowerCase(); return /overhaul|reforma geral|geral/.test(t) ? 'ref' : /parcial|ret[ií]fica|meia/.test(t) ? 'parc' : /substitu|motor novo|troca do (motor|reversor|equip)/.test(t) ? 'subst' : /instala|entrada/.test(t) ? 'inst' : /docag/.test(t) ? 'doca' : /reparo/.test(t) ? 'rep' : /troca|componente|substitu/.test(t) ? 'comp' : /reforma/.test(t) ? 'ref' : 'outro'; };
function heEqTexto(v, t) {
  t = (t || '').toUpperCase().replace(/\s+/g, ' ').trim(); const E = heEqs(v), mono = v.mcp === 'mono';
  const lado = /\b(BB|BOMBORDO)\b/.test(t) ? 'BB' : /\b(BE|BORESTE)\b/.test(t) ? 'BE' : mono ? 'CE' : '';
  if (/MCA|AUX|GERADOR/.test(t)) { const n = (t.match(/\d/) || [])[0]; return n && E.some(e => e.k === 'MCA' + n) ? 'MCA' + n : ''; }
  if (/REVERS|REDU/.test(t)) return lado && E.some(e => e.k === 'R' + lado) ? 'R' + lado : '';
  if (/MCP|PRINCIPAL|MOTOR/.test(t)) return lado && E.some(e => e.k === lado) ? lado : '';
  if (/EMPURR|CASCO|GERAL|^$/.test(t)) return 'UN';
  return '';
}
function heDataTexto(t) { t = (t || '').trim(); let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return t.slice(0, 10); m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m) { const a = m[3].length === 2 ? '20' + m[3] : m[3]; return `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; } m = t.match(/^(\d{1,2})\/(\d{4})$/); if (m) return `${m[2]}-${m[1].padStart(2, '0')}-01`; m = t.match(/^(\d{4})$/); return m ? m[1] + '-01-01' : ''; }
function heColar() {
  modal(`<h2>Colar planilha de acontecimentos</h2><p class="note">Copie do Excel e cole abaixo, uma linha por acontecimento, nesta ordem de colunas (tabulação ou ponto e vírgula):<br><b>Data · Empurrador · Equipamento · Tipo · O que foi feito · Horímetro · Documento · Executado por</b><br>Equipamento: MCP BB, MCP BE, MCP (monomotor), Reversor BB, MCA 1, MCA 2, Empurrador. Data: dd/mm/aaaa, mm/aaaa ou só o ano. Tipo: reforma geral, reforma parcial, substituição, troca de componente, reparo, instalação, docagem.</p>
    <textarea id="heCx" rows="10" style="width:100%;font-family:monospace;font-size:12px" placeholder="15/03/2022	CJA XIV	MCP	Reforma geral	Reforma geral na oficina X	18.450	OM 45678	Oficina X"></textarea>
    <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="heCok">Conferir</button></div>`);
  $('#heCok').onclick = () => {
    const L = $('#heCx').value.split(/\r?\n/).filter(l => l.trim()).map(l => { const c = l.split(/\t|;/).map(x => x.trim());
      const nv = (c[1] || '').toUpperCase().replace(/^CJA\s*/, ''), v = S.cfg.frota.find(x => x.nome.toUpperCase() === 'CJA ' + nv), d = heDataTexto(c[0]), eq = v ? heEqTexto(v, c[2]) : '';
      const hs = (c[5] || '').replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
      const err = !d ? 'data' : !v ? 'empurrador' : !eq ? 'equipamento' : !c[4] ? 'o que foi feito' : '';
      return { l, err, r: { vessel: v && v.id, eq, date: d, tp: heTpTexto(c[3]), txt: c[4] || '', h: hs === '' ? '' : +hs, doc: c[6] || '', quem: c[7] || '' } }; });
    const ok = L.filter(x => !x.err);
    modal(`<h2>Conferir · ${L.length} linha(s)</h2><div class="tw" style="max-height:50vh;overflow:auto"><table class="t he-t"><thead><tr><th>Data</th><th>Empurrador</th><th>Equipamento</th><th>Tipo</th><th>O que foi feito</th><th>Situação</th></tr></thead><tbody>${L.map(x => { const v = vessel(x.r.vessel);
      return `<tr><td>${x.r.date ? brD(x.r.date) : '?'}</td><td>${v ? esc(v.nome) : '?'}</td><td>${v && x.r.eq ? esc(heEqNome(v, x.r.eq)) : '?'}</td><td>${hePill(x.r.tp)}</td><td>${esc(x.r.txt)}</td><td>${x.err ? `<span class="pill p-bad">falta ${x.err}</span>` : '<span class="pill p-ok">ok</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="note">${ok.length} serão gravadas${L.length - ok.length ? ', ' + (L.length - ok.length) + ' ficam de fora (corrija e cole de novo)' : ''}.</p><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="heCg"${ok.length ? '' : ' disabled'}>Gravar ${ok.length}</button></div>`);
    $('#heCg').onclick = async () => { for (const x of ok) await saveRec(Object.assign({ id: uid('snap'), kind: 'snap', tipo: 'evento', por: S.session.name, obs: '' }, x.r)); closeModal(); toast(ok.length + ' acontecimento(s) gravado(s).'); render(); };
  };
}
// ---------- baixar (CSV para o Excel) ----------
function heCsv() {
  const v = vessel(HE.v), E = heEventos(v ? v.id : '').filter(x => !HE.eq || !v || x.eq === HE.eq), q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const L = [['Data', 'Empurrador', 'Equipamento', 'Identificação', 'Tipo', 'O que foi feito', 'Horímetro', 'Documento', 'Executado por', 'Observação', 'Origem'].map(q).join(';')]
    .concat(E.map(x => { const vx = vessel(x.vessel), e = heEqs(vx).find(y => y.k === x.eq) || {}; return [brD(x.date), vx ? vx.nome : '', e.nome || x.eq, e.desc || '', (HE_TP[x.tp] || HE_TP.outro)[0], x.txt, x.h, x.doc, x.quem, x.obs || '', x.man ? 'lançado' : 'do SMF · ' + (x.src || '')].map(q).join(';'); }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + L.join('\r\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'Historico_equipamentos' + (v ? '_' + v.nome.replace(/\s+/g, '_') : '_frota') + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
// ---------- tela, cliques e menu ----------
VX.enxeq = vEnxEq;
AFTER.enxeq = () => { const m = $('#main');
  m.onclick = e => { const t = e.target.closest('[data-hefoto],[data-hev],[data-heeq],[data-heed],[data-henovo],[data-hecola],[data-hecsv]'); if (!t) return; const d = t.dataset;
    if (d.hefoto) { const [id, k] = d.hefoto.split('|'); return heGaleria(id, k); }
    if (d.hev !== undefined) { HE.v = d.hev; HE.eq = ''; return render(); }
    if (d.heed !== undefined) return heModal(d.heed);
    if (d.heeq !== undefined) { HE.eq = d.heeq; return render(); }
    if (d.henovo !== undefined) return heModal('');
    if (d.hecola !== undefined) return heColar();
    if (d.hecsv !== undefined) return heCsv(); };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_enxeq_lay', '[data-enxreset]'); heCarregaFotos(); };
ENX_OK.push('enxeq');
{ const ap = PCM_MENU.find(g => g[0] === 'Apoio'); if (ap) ap[1].unshift(['enxeq', 'Histórico dos equipamentos', 'hist']); }
ICO.hist = '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>';
{ const st = document.createElement('style'); st.textContent = `
.he-ch{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 6px}.he-ch button{border:1px solid #D5DAE1;background:#fff;border-radius:16px;padding:5px 12px;font:inherit;font-size:12.5px;cursor:pointer;color:#202124}
.he-ch button.on{background:#0B2A5B;border-color:#0B2A5B;color:#fff}.he-ch button i{font-style:normal;font-size:10.5px;margin-left:6px;background:#E8EEF7;color:#0B2A5B;border-radius:8px;padding:0 6px}.he-ch button.on i{background:#fff}
.he-ch2{padding-top:6px;border-top:1px dashed #E3E6EA}.he-ch2 button{border-radius:6px}
.he-lg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:#5F6368;margin:0 0 6px}.he-lg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.he-svg{width:100%;height:auto;display:block}.he-dot{cursor:pointer}.he-dot:hover circle{r:9}
.he-p{display:inline-block;font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff);white-space:nowrap}
.he-sd{color:#B06000;font-size:12px}
.he-eqs{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px}.he-eq{border:1px solid #E3E6EA;border-radius:8px;padding:8px 10px;cursor:pointer;background:#fff}.he-eq:hover{border-color:#1A73E8}
.he-eqh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
table.he-f{width:100%;border-collapse:collapse;font-size:12.5px}table.he-f th{text-align:left;font-weight:400;color:#5F6368;white-space:nowrap;padding:2px 10px 2px 0;vertical-align:top;width:1%}table.he-f td{padding:2px 0}
.he-vt{position:relative;margin-left:4px}.he-vi{display:grid;grid-template-columns:110px 1fr;gap:14px;position:relative;padding:0 0 14px}
.he-vi::before{content:'';position:absolute;left:117px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--c);border:2px solid #fff;box-shadow:0 0 0 1px var(--c)}
.he-vi::after{content:'';position:absolute;left:123px;top:20px;bottom:0;width:2px;background:#E3E6EA}.he-vi:last-child::after{display:none}
.he-vd{text-align:right;font-size:12.5px}.he-vd span{display:block;color:#5F6368;font-size:11px}.he-vc{padding-left:22px}.he-vtx{margin:4px 0 3px;font-size:13.5px}
.he-ms{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}.he-mi{width:74px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #D5DAE1;background:#EEF1F5;cursor:zoom-in}
.he-fc{display:inline-flex;align-items:center;gap:4px}.he-fc b{font-size:11px;color:#5F6368}.he-mi1{width:44px;height:34px}
.he-gi{text-align:center;margin:6px 0}.he-gi img{max-width:100%;max-height:62vh;border-radius:8px}
.he-vm{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:#3C4043;margin-bottom:4px}
`; document.head.appendChild(st); }
