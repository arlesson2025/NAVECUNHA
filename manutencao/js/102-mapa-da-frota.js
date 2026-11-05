'use strict';
/* ===== 1.3 · Mapa da frota (SMF 3.161, Supervisor 02/11/2026: “a ideia é ter uma visão geral de onde está cada embarcação… quero dentro do mapa”) =====
   Um ponto por empurrador no mapa, pela mesma conta do quadro “Onde está a frota” (vgOndeDe): no porto = no porto informado (Manaus, nosso porto;
   Porto Velho, filial…), em rota = na última posição. Posição em rota: latitude e longitude do e-mail do Monitoramento (vgCoord, js/94) ou, sem
   elas, o lugar citado na posição (VG_LUGAR, coordenada aproximada da cidade). Sem nenhuma das duas, o empurrador fica na linha embaixo do mapa.
   O mapa (Leaflet 1.9.4) e o fundo (OpenStreetMap; imagem de satélite da Esri) vêm da internet só quando a tela abre: sem sinal, fica o aviso. */
// coordenadas aproximadas (centro da cidade ou do porto; confiança moderada): ajuste aqui quando tiver a do terminal
const VG_LUGAR = { 'Manaus': [-3.119, -60.022], 'Porto Velho': [-8.761, -63.900], 'Itacoatiara': [-3.139, -58.444], 'Vila do Conde': [-1.542, -48.750], 'Barcarena': [-1.506, -48.626],
  'Santarém': [-2.439, -54.700], 'Munguba': [-0.880, -52.520], 'Belém': [-1.456, -48.490], 'Humaitá': [-7.506, -63.021], 'Manicoré': [-5.809, -61.300], 'Borba': [-4.388, -59.594],
  'Nova Olinda do Norte': [-3.888, -59.094], 'Novo Aripuanã': [-5.121, -60.380], 'Autazes': [-3.580, -59.130], 'Calama': [-8.030, -62.880], 'Parintins': [-2.628, -56.736],
  'Óbidos': [-1.902, -55.518], 'Almeirim': [-1.523, -52.582], 'Gurupá': [-1.405, -51.640], 'Breves': [-1.682, -50.480] };
// pontos fixos da Navecunha (Supervisor, 02/11/2026: “coordenadas fixas… não muda”): boia 1 = porto da Navecunha em Manaus · boia 2 = porto do Cimento
// em Manaus (onde às vezes as balsas ficam ancoradas quando chegam do Peru) · filial em Porto Velho. “Manaus” sem boia = boia 1; “Porto Velho” = filial
const VG_FIXO = { 'Boia 1 · porto da Navecunha': [-3.098460, -60.083036], 'Boia 2 · porto do Cimento': [-3.183579, -59.989933], 'Porto Velho · filial': [-8.694150, -63.917464],
  'Estaleiro Rio Amazonas (ERAM)': [-3.121329, -60.048051] };   // estaleiro em Manaus onde ficam empurradores em reforma (Supervisor, 02/11/2026)
// “Porto Navecunha - PVH” (e-mail do Monitoramento) = filial em Porto Velho: a filial vem antes do “navecunha” da boia 1
const VG_FIXO_RE = [[/\bboia\s*(?:n\s*)?(?:2|02|ii|dois)\b|cimento/, 'Boia 2 · porto do Cimento'], [/filial|porto velho|\bpvh\b/, 'Porto Velho · filial'], [/\bboia\s*(?:n\s*)?(?:1|01|i|um)\b|navecunha/, 'Boia 1 · porto da Navecunha'], [/\beram\b|estaleiro/, 'Estaleiro Rio Amazonas (ERAM)'], [/manaus|\bmao\b|\bboia\b/, 'Boia 1 · porto da Navecunha']];
function vgFixo(t) { const n = vgNorm(t); if (!n) return null; const r = VG_FIXO_RE.find(x => x[0].test(n)); return r ? r[1] : null; }
const vgLL = k => VG_FIXO[k] || VG_LUGAR[k];
const VG_MAPA = { m: null, lib: null };
function vgLugar(t) { const f = vgFixo(t); if (f) return f; const n = vgNorm(t); if (!n) return null; let b = null; Object.keys(VG_LUGAR).forEach(k => { if (n.includes(vgNorm(k)) && (!b || k.length > b.length)) b = k; }); return b; }
function vgMapaDados() {
  const V = vgViagens(), E = S.cfg.frota.filter(v => !foraOp(v) || vgEmReforma(v.id)).map(v => vgOndeDe(v.id, false, V)), P = {}, F = {}, R = [], sem = [];
  E.forEach(o => {
    if (o.st === 'ref') { const r = vgEmReforma(o.id) || {}, P0 = vgPosicoes(o.id), q0 = P0[P0.length - 1], tx = [r.local, r.obs, q0 && (!r.ini || q0.date >= r.ini) ? q0.local + ' ' + (q0.porto || '') : ''].filter(Boolean).join(' ');
      const k = /\beram\b|estaleiro/.test(vgNorm(tx)) ? 'Estaleiro Rio Amazonas (ERAM)' : vgLugar(tx); if (!k || !vgLL(k)) return sem.push(o); (F[k] = F[k] || []).push(o); return; }
    if (o.st === 'por') { const k = vgLugar(o.porto) || (o.porto === 'Porto não informado' ? null : o.porto); if (!k || !vgLL(k)) return sem.push(o); (P[k] = P[k] || []).push(o); return; }
    const L = vgPosicoes(o.id).filter(x => x.situ !== 'por' && (!o.saida || x.date >= o.saida)), q = L[L.length - 1];
    const ll = q && q.lat != null && q.lon != null ? [+q.lat, +q.lon] : (k => k ? vgLL(k) : null)(vgLugar(o.local));
    if (!ll) return sem.push(o); R.push({ o, ll, aprox: !(q && q.lat != null) });
  });
  // balsas em reforma (Supervisor, 02/11/2026: VDA IX e VDA XXII no ERAM): no estaleiro lançado na reforma (Histórico dos equipamentos → Balsa (casco))
  const B = vgBalsas().filter(b => vgEmReforma(b.id)).map(b => ({ id: b.id, nome: b.nome, st: 'ref', bal: true }));
  B.forEach(o => { const r = vgEmReforma(o.id) || {}, tx = [r.local, r.obs].filter(Boolean).join(' ');
    const k = /\beram\b|estaleiro/.test(vgNorm(tx)) ? 'Estaleiro Rio Amazonas (ERAM)' : vgLugar(tx); if (!k || !vgLL(k)) return sem.push(o); (F[k] = F[k] || []).push(o); });
  // cada balsa fica com o empurrador da viagem mais recente em que ela foi (a mesma balsa passa de um comboio para outro); balsa em reforma fica no estaleiro
  const dono = {}, dt = {}; E.forEach(o => { const d = o.u ? o.u.fim || o.u.date || '' : ''; (o.balsas || []).forEach(b => { if (!(b in dt) || d > dt[b]) { dt[b] = d; dono[b] = o.id; } }); });
  B.forEach(o => delete dono[o.id]);
  // balsa no porto cujo empurrador já saiu sem ela (Supervisor, 04/11/2026: as balsas soltas no porto aparecem embaixo dos empurradores): fica na boia 1, em Manaus
  const noP = new Set([].concat(...Object.values(P)).map(o => o.id)), soltas = {};
  vgBalsas().forEach(b => { if (vgEmReforma(b.id) || noP.has(dono[b.id])) return; if (vgOndeDe(b.id, true, V).st !== 'por') return; (soltas['Boia 1 · porto da Navecunha'] = soltas['Boia 1 · porto da Navecunha'] || []).push(b.id); });
  Object.keys(soltas).forEach(k => { P[k] = P[k] || []; });
  return { P, F, R, sem, ref: E.filter(o => o.st === 'ref'), refB: B, dono, soltas };
}
function vgMapaCard() {
  const D = vgMapaDados(), nP = Object.values(D.P).reduce((a, L) => a + L.length, 0);
  const sem = D.sem.length ? `<p class="note" style="margin:6px 0 0"><b>Sem posição no mapa:</b> ${D.sem.map(o => `${esc(o.nome)}${o.st === 'via' ? ' (em rota' + (o.dias != null ? ', ' + o.dias + ' d' : '') + ')' : o.st === 'ref' ? ' (em reforma, local não informado)' : ''}`).join(' · ')} · use “Informar posição” ou cole o e-mail do Monitoramento</p>` : '';
  return `<div class="card"><h2>Mapa da frota · hoje</h2><p class="note" style="margin-top:0">${D.R.length} em rota · ${nP} no porto${D.ref.length ? ' · ' + D.ref.length + ' em reforma' : ''}${D.refB.length ? ' · ' + D.refB.length + (D.refB.length > 1 ? ' balsas' : ' balsa') + ' em reforma' : ''} · azul = em rota, verde = no porto (número = empurradores no porto; aproximando o mapa, aparecem as balsas e os empurradores), cinza = em reforma · comboio em rota: o empurrador e uma balsa para cada balsa · clique no ponto para ver as balsas e a última posição</p>
    <div id="vgMapa" data-nodrag style="height:${vgAltura()}px;flex:0 0 auto;border-radius:8px;background:#E8EEF5;position:relative"><p class="note" style="padding:12px">Carregando o mapa…</p></div><div class="vg-alt" data-nodrag title="Arraste para aumentar ou diminuir o mapa"><i></i></div><div id="vgNum">${typeof vgFrotaNumAgora === 'function' ? vgFrotaNumAgora() : ''}</div>${sem}
    <p class="note vg-ajuda" style="margin:4px 0 0">Posição em rota pela latitude e longitude do e-mail do Monitoramento; sem elas, pelo lugar citado (posição aproximada da cidade, marcada “aprox.”). O mapa precisa de internet. Clique num comboio ou num ponto de fundeio para ver embaixo os dias, as ocorrências e a linha do tempo.</p>
    ${can.edit() ? '<div class="row" style="justify-content:flex-end;gap:8px;margin:8px 0 2px"><button class="mbtn" data-vgbol>Lançar localização - Boletim Autotrac</button><button class="mbtn pri" data-vgpos="">Informar posição</button></div>' : ''}</div>
    <div class="card"><h2>Painel de supervisão de manutenção da frota</h2><div id="vgPainel">${typeof vgResumo === 'function' ? vgResumo() : ''}</div></div>`;
}
function vgMapaLib() {
  if (window.L && L.map) return Promise.resolve();
  if (VG_MAPA.lib) return VG_MAPA.lib;
  const base = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'leaflet.min.css'; document.head.appendChild(css);
  return VG_MAPA.lib = new Promise((ok, no) => { const s = document.createElement('script'); s.src = base + 'leaflet.min.js'; s.onload = ok; s.onerror = () => { VG_MAPA.lib = null; no(new Error('sem internet')); }; document.head.appendChild(s); });
}
// desenho do comboio (Supervisor, 02/11/2026: “não tem o desenhozinho do comboio”): o empurrador atrás e as balsas na frente, com a proa na última
function vgIcone(cor, nB, num) {
  const n = Math.min(nB || 0, 4), bw = 11, tw = 13, H = 14, W = tw + n * (bw + 1) + (n ? 5 : 3) + (num ? 12 : 0);
  let g = `<rect x="1" y="2.5" width="${tw}" height="9" rx="2" fill="${cor}" stroke="#fff" stroke-width="1.2"/><rect x="3.5" y="4.5" width="5" height="5" rx="1" fill="#fff" opacity=".9"/>`;
  for (let k = 0; k < n; k++) { const x = tw + 2 + k * (bw + 1), ult = k === n - 1;
    g += ult ? `<path d="M${x},2.5 h${bw - 3} l4,4.5 l-4,4.5 h-${bw - 3} z" fill="#3C4043" stroke="#fff" stroke-width="1.2"/>` : `<rect x="${x}" y="2.5" width="${bw}" height="9" fill="#3C4043" stroke="#fff" stroke-width="1.2"/>`; }
  if (!n) g = g.replace(`width="${tw}"`, `width="${tw - 3}"`) + `<path d="M${tw - 2},2.5 l4,4.5 l-4,4.5 z" fill="${cor}" stroke="#fff" stroke-width="1.2"/>`;
  if (num) g += `<circle cx="${W - 6}" cy="7" r="6" fill="#fff" stroke="${cor}" stroke-width="1.5"/><text x="${W - 6}" y="10" text-anchor="middle" font-size="8.5" font-weight="700" fill="${cor}" font-family="system-ui,sans-serif">${num}</text>`;
  return L.divIcon({ html: `<svg width="${W * 3}" height="${H * 3}" viewBox="0 0 ${W} ${H}" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">${g}</svg>`, className: 'vg-ic', iconSize: [W * 3, H * 3], iconAnchor: [W * 1.5, H * 1.5], tooltipAnchor: [W * 1.5, 0], popupAnchor: [0, -H * 1.5] });
}
// balsa vista de cima como na foto de satélite (Supervisor, 02/11/2026): casco claro comprido, borda escura e a passarela dos tanques no meio
const vgBalsaSvg = (x, y, w, h) => w > h ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".8" fill="#ECEDE8" stroke="#2B2F33" stroke-width=".9"/><rect x="${x + 2.5}" y="${y + h / 2 - .8}" width="${w - 5}" height="1.6" fill="#8F969C"/>`
  : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".8" fill="#ECEDE8" stroke="#2B2F33" stroke-width=".9"/><rect x="${x + w / 2 - .8}" y="${y + 2.5}" width="1.6" height="${h - 5}" fill="#8F969C"/>`;
const vgIc = (g, W, H, k, at) => L.divIcon({ html: `<svg${at || ''} width="${W * k}" height="${H * k}" viewBox="0 0 ${W} ${H}" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">${g}</svg>`, className: 'vg-ic', iconSize: [W * k, H * k], iconAnchor: [W * k / 2, H * k / 2], tooltipAnchor: [W * k / 2, 0], popupAnchor: [0, -H * k / 2] });
// comboio em rota: o empurrador atrás e uma balsa para cada balsa do comboio, em fila, a proa na última; cada balsa com o nome (sem “VDA”)
// e clicável (data-vgbal): abre o cartão da balsa (Supervisor, 02/11/2026)
// o desenho em si (empurrador + balsas em fila), também usado nas fileiras do porto: [svg interno, largura, altura]; emp = id do empurrador (clicável)
function vgComboioSvg(cor, B, emp) {
  B = Array.isArray(B) ? B : Array.from({ length: B || 0 }, () => '');
  const bw = 34, H = 11, tw = 12, nB = B.length; let x = tw + 1.5, g = `<g${emp ? ` data-vgemp="${esc(emp)}" style="cursor:pointer"` : ''}><rect x="1" y="1" width="${tw}" height="${H - 2}" rx="2.5" fill="${cor}" stroke="#fff" stroke-width="1.1"/><rect x="3" y="3" width="4.5" height="${H - 6}" rx="1" fill="#fff" opacity=".9"/></g>`;
  for (let k = 0; k < nB; k++, x += bw + .6) { const nm = B[k] ? vName(B[k]) : '';   // nome inteiro, com “VDA” (Supervisor, 02/11/2026)
    g += `<g${B[k] ? ` data-vgbal="${esc(B[k])}" style="cursor:pointer"` : ''}>${vgBalsaSvg(x, 1, bw, H - 2)}${nm ? `<text x="${x + bw / 2}" y="${H / 2 + 1.9}" text-anchor="middle" font-size="5.6" font-weight="800" fill="#16244A" stroke="#ECEDE8" stroke-width="1.4" paint-order="stroke" font-family="system-ui,sans-serif">${esc(nm)}</text>` : ''}</g>`; }
  if (!nB) g += `<path d="M${tw + 1},1.5 l4,4 l-4,4 z" fill="${cor}" stroke="#fff" stroke-width="1"/>`; else g += `<path d="M${x},2 l3,3.5 l-3,3.5 z" fill="#2B2F33"/>`;
  return [g, x + 4, H];
}
// comboio em rota com a foto (Supervisor, 05/11/2026: “aquela imagem realista… ficou tão bom”): a balsa e o empurrador recortados da imagem de dados técnicos
// (img/comboio-balsa.png e img/comboio-empurrador.png, a mesma foto para todas), uma balsa para cada balsa do comboio, o nome embaixo de cada uma e do empurrador
const VG_FOTO = { b: [570, 79], e: [227, 150], s: .3, sob: 18 };
function vgComboioIc(cor, B, id, rot) {
  B = Array.isArray(B) ? B : []; const s = VG_FOTO.s, bw = Math.round(VG_FOTO.b[0] * s), bh = Math.round(VG_FOTO.b[1] * s), ew = Math.round(VG_FOTO.e[0] * s), eh = Math.round(VG_FOTO.e[1] * s), sob = Math.round(VG_FOTO.sob * s);
  const H = Math.max(bh, eh), W = B.length * (bw - sob) + ew, AL = H + 24; let x = 0, h = '';
  B.forEach(b => { h += `<div data-vgbal="${esc(b)}" style="left:${x}px;width:${bw}px;height:${AL}px"><img src="img/comboio-balsa.png" alt="" style="top:${H - bh}px;width:${bw}px;height:${bh}px"><span style="top:${H + 3}px">${esc(vName(b))}</span></div>`; x += bw - sob; });
  h += `<div style="left:${x}px;width:${ew}px;height:${AL}px"><img src="img/comboio-empurrador.png" alt="" style="top:${H - eh}px;width:${ew}px;height:${eh}px"><span style="top:${H + 3}px;background:${cor};color:#fff">${esc(rot || '')}</span></div>`;
  return L.divIcon({ html: `<div class="vgcf"${id ? ` data-vgcomb="${esc(id)}"` : ''} style="width:${W}px;height:${AL}px">${h}</div>`, className: 'vg-ic', iconSize: [W, AL], iconAnchor: [W / 2, H / 2] });
}
// porto de perto (Supervisor, 04/11/2026, desenho dele): no alto “N - EMPURRADORES (CJA …)” e “N - BALSAS (VDA …)”; uma fileira por empurrador, com o nome
// à esquerda e as balsas que chegaram com ele na frente; embaixo, uma fileira para cada balsa sem empurrador no porto
function vgPortoIc(cor, k, E, B, soltas) {
  const sv = (g, W, H) => `<svg width="${W * 2.6}" height="${H * 2.6}" viewBox="0 0 ${W} ${H}" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">${g}</svg>`;
  const rom = (L, re) => L.map(id => vName(id).replace(re, '')).join(', ');
  const nB = E.reduce((a, e) => a + B[e].length, 0) + soltas.length, tB = E.flatMap(e => B[e]).concat(soltas);
  // a contagem em destaque, para a apresentação (Supervisor, 04/11/2026: “tem que destacar mais, ser maior”): número grande, nome, e a lista embaixo
  const cx = (n, t, L) => `<div class="vg-pt-c"><b>${n}</b><div><span>${t}</span>${L ? `<small>${esc(L)}</small>` : ''}</div></div>`;
  let h = `<div class="vg-pt-h"><div class="vg-pt-t">${esc(k)}</div>${cx(E.length, E.length === 1 ? 'EMPURRADOR' : 'EMPURRADORES', E.length ? 'CJA ' + rom(E, /^CJA\s*/i) : '')}${cx(nB, nB === 1 ? 'BALSA' : 'BALSAS', nB ? 'VDA ' + rom(tB, /^VDA\s*/i) : '')}</div>`;
  E.forEach(e => { h += `<div class="vg-pt-r"><span class="vg-pt-n" data-vgemp="${esc(e)}">${esc(vName(e))}</span>${sv(...vgComboioSvg(cor, B[e], e))}</div>`; });
  soltas.forEach(b => { h += `<div class="vg-pt-r vg-pt-s">${sv(`<g data-vgbal="${esc(b)}" style="cursor:pointer">${vgBalsaSvg(.5, 1, 34, 9)}<text x="17.5" y="7.4" text-anchor="middle" font-size="5.6" font-weight="800" fill="#16244A" stroke="#ECEDE8" stroke-width="1.4" paint-order="stroke" font-family="system-ui,sans-serif">${esc(vName(b))}</text></g>`, 35, 11)}</div>`; });
  return L.divIcon({ html: `<div class="vg-pt">${h}</div>`, className: 'vg-ic', iconSize: null });
}
// parados na boia ou no estaleiro: as balsas lado a lado em fileiras (até 8 por fileira) e os empurradores encostados embaixo
function vgFundeioIc(cor, B, E) {
  B = Array.isArray(B) ? B : Array.from({ length: B || 0 }, () => ''); E = Array.isArray(E) ? E : Array.from({ length: E || 0 }, () => '');
  const nB = B.length, nE = E.length, bw = 9, bh = 34, p = 8, pw = 9, ph = 15, por = Math.min(Math.max(nB, 1), p), lin = Math.ceil(nB / p), W = Math.max(por * (bw + .6), nE * (pw + 1.5)) + 2; let g = '';
  // cada balsa (com “VDA”) e cada empurrador (sem “CJA”) com o nome e clicável: abre o cartão daquela embarcação (Supervisor, 02/11/2026)
  const nm = (id, re) => id ? esc(vName(id).replace(re, '')) : '';
  for (let k = 0; k < nB; k++) { const x = 1 + (k % p) * (bw + .6), y = 1 + Math.floor(k / p) * (bh + .8), t = nm(B[k], /^$/);
    g += `<g${B[k] ? ` data-vgbal="${esc(B[k])}" style="cursor:pointer"` : ''}>${vgBalsaSvg(x, y, bw, bh)}${t ? `<text transform="translate(${x + bw / 2 + 1.6},${y + bh / 2}) rotate(-90)" text-anchor="middle" font-size="4.4" font-weight="800" fill="#16244A" stroke="#ECEDE8" stroke-width="1.3" paint-order="stroke" font-family="system-ui,sans-serif">${t}</text>` : ''}</g>`; }
  const y = 1.5 + lin * (bh + .8);
  for (let k = 0; k < nE; k++) { const x = 1 + k * (pw + 1.5), t = nm(E[k], /^CJA\s*/i);
    g += `<g${E[k] ? ` data-vgemp="${esc(E[k])}" style="cursor:pointer"` : ''}><rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="2" fill="${cor}" stroke="#fff" stroke-width="1"/>${t ? `<text transform="translate(${x + pw / 2 + 1.5},${y + ph / 2}) rotate(-90)" text-anchor="middle" font-size="4.4" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">${t}</text>` : `<rect x="${x + 1.5}" y="${y + 5.5}" width="${pw - 3}" height="3.5" rx=".8" fill="#fff" opacity=".9"/>`}</g>`; }
  return vgIc(g, W, y + ph + 1, 2.2);
}
const VG_ZOOM_DESENHO = 11;   // mapa mais longe que isso: no porto volta o ícone pequeno com o número (as fileiras de balsas cobririam o mapa)
const vgGoogle = ll => `<br><a href="https://www.google.com/maps?q=${ll[0]},${ll[1]}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a>`;
const vgAltura = () => { try { const h = +localStorage.getItem('smf_vg_alt'); return h >= 260 ? h : 560; } catch (e) { return 560; } };
// quadro mudou de tamanho: o mapa fica parado (canto de cima à esquerda fixo) e só mostra mais ou menos área; uma vez por quadro de tela
const vgAjusta = m => { if (m._vgAj) return; m._vgAj = requestAnimationFrame(() => { m._vgAj = 0; try { m.invalidateSize({ pan: false }); } catch (e) { } }); };
async function vgMapaIniciar() {
  const el = $('#vgMapa'); if (!el) return;
  try { await vgMapaLib(); } catch (e) { if (el.isConnected) el.innerHTML = '<p class="note" style="padding:12px;color:var(--warnt)">O mapa não carregou: precisa de internet. Os quadros “Fora do porto” e “No porto” mostram a mesma informação.</p>'; return; }
  if (!el.isConnected) return; el.innerHTML = '';
  if (VG_MAPA.m) { try { VG_MAPA.m.remove(); } catch (e) { } }
  // satélite com os nomes das cidades e dos rios por cima (o mais perto do Google Maps sem chave do Google) · mapa de ruas do OpenStreetMap
  const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 18, attribution: 'Imagem © Esri' });
  const nomes = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 18, zIndex: 5, pane: 'overlayPane' });
  const ruas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
  const satN = L.layerGroup([sat, nomes]);
  const m = VG_MAPA.m = L.map(el, { layers: [satN], zoomSnap: .5, zoomDelta: .5, wheelPxPerZoomLevel: 90, scrollWheelZoom: true, maxZoom: 19 });
  L.control.layers({ 'Satélite com nomes': satN, 'Satélite': sat, 'Mapa': ruas }, null, { position: 'topright' }).addTo(m);
  L.control.scale({ imperial: false }).addTo(m);
  // nomes das cidades do rio que o SMF conhece (a camada de nomes da Esri tem poucos na Amazônia)
  Object.entries(VG_LUGAR).forEach(([k, ll]) => L.marker(ll, { icon: L.divIcon({ html: `<i></i><span>${esc(k)}</span>`, className: 'vg-cid', iconSize: [0, 0] }), interactive: false, keyboard: false }).addTo(m));
  const D = vgMapaDados(), pts = [], bal = o => (o.balsas || []).map(vName).join(', ');
  const tip = cls => ({ permanent: true, direction: 'right', offset: [4, 0], className: 'vg-mt' + (cls ? ' ' + cls : '') });
  const Z = [], troca = (mk, perto, longe) => Z.push([mk, perto, longe]);   // desenho completo de perto, ícone pequeno de longe
  const nBal = Lp => Lp.filter(o => o.bal).map(o => o.id).concat(...Lp.map(o => (o.balsas || []).filter(b => D.dono[b] === o.id)));
  const nEmp = Lp => Lp.filter(o => !o.bal).map(o => o.id);
  // clique numa embarcação do desenho: o cartão grande dela; no resto do ponto: o painel do lugar embaixo do mapa
  const cliq = (k, Lp) => e => { const t = e.originalEvent && e.originalEvent.target, q = t && t.closest ? t.closest('[data-vgbal],[data-vgemp]') : null;
    if (q && typeof vgCartaoGrande === 'function') return vgCartaoGrande(q.getAttribute('data-vgbal') || q.getAttribute('data-vgemp'), '');
    if (typeof vgPainelAbrir === 'function') vgPainelAbrir('fix', k, Lp.map(o => o.id)); };
  Object.entries(D.P).forEach(([k, Lp]) => { const ll = vgLL(k); pts.push(ll); const E = nEmp(Lp), BE = {}, so = (D.soltas || {})[k] || [];
    E.forEach(e => { BE[e] = (Lp.find(o => o.id === e).balsas || []).filter(b => D.dono[b] === e); });
    const mk = L.marker(ll, { icon: vgIcone('#188038', 0, E.length || so.length), riseOnHover: true }); mk._vgPt = 1;   // de perto, o nome do porto vai no alto do desenho
    troca(mk, vgPortoIc('#188038', k, E, BE, so), vgIcone('#188038', 0, E.length || so.length)); mk.on('click', cliq(k, Lp)); mk.addTo(m)
      .bindTooltip(`${esc(k)}${Lp.length ? ' · ' + Lp.map(o => esc(o.nome.replace(/^CJA\s*/, ''))).join(', ') : ''}${so.length ? ' · ' + so.length + ' balsa' + (so.length > 1 ? 's' : '') + ' sem empurrador' : ''}`, tip('por')); });
  Object.entries(D.F).forEach(([k, Lp]) => { const ll = vgLL(k); pts.push(ll); const nE = Lp.filter(o => !o.bal).length, mk = L.marker(ll, { icon: vgIcone('#5F6368', 0, Lp.length), riseOnHover: true });
    troca(mk, vgFundeioIc('#5F6368', nBal(Lp), nEmp(Lp)), vgIcone('#5F6368', 0, Lp.length)); mk.on('click', cliq(k, Lp)); mk.addTo(m)
      .bindTooltip(`${esc(k)} · ${Lp.map(o => esc(o.nome.replace(/^CJA\s*/, ''))).join(', ')} · em reforma`, tip('ref')); });
  // clique no comboio: o cartão do comboio em cima do mapa (dias em viagem, previsão, ocorrências, linha do tempo e fotos); clique numa balsa do desenho: o da balsa
  // o clique (no desenho ou no nome) é tratado pela página, não pelo mapa: ver o ouvinte de [data-vgcomb] no fim deste arquivo
  VG_MAPA.rod = {};
  D.R.forEach(({ o, ll, aprox }) => { pts.push(ll); const par = o.parD > VG_PARADO_D;
    VG_MAPA.rod[o.id] = `${aprox ? 'posição aproximada pelo lugar citado · ' : ''}<a href="#" data-vgficha="${o.id}">Ficha do empurrador</a>${vgGoogle(ll).replace('<br>', ' · ')}`;
    L.marker(ll, { icon: vgComboioIc(par ? '#D93025' : '#1A73E8', o.balsas || [], o.id, o.nome + (aprox ? ' · aprox.' : '')), riseOnHover: true }).addTo(m); });
  if (pts.length > 1) m.fitBounds(pts, { padding: [50, 50], maxZoom: 8 }); else m.setView(pts[0] || VG_FIXO['Boia 1 · porto da Navecunha'], 6);
  const desenho = () => { const perto = m.getZoom() >= VG_ZOOM_DESENHO; Z.forEach(([mk, a, b]) => { mk.setIcon(perto ? a : b); if (mk._vgPt) perto ? mk.closeTooltip() : mk.openTooltip(); }); }; m.on('zoomend', desenho); desenho();
  // o mapa ocupa o cartão (Supervisor, 02/11/2026: mapa e painel de supervisão em cartões separados): altura do cartão menos o título em cima e as notas e
  // botões embaixo; acompanha o canto do cartão, a tela cheia (⛶) e o minimizar. Fora das janelas livres (tela estreita), vale a barra embaixo do mapa
  const card = el.closest('.card'), alt = () => { if (!card || card.classList.contains('cm-min')) return; const cheia = document.fullscreenElement === card || card.classList.contains('cm-full'), livre = !!card.style.height;
    const bar = el.nextElementSibling; if (bar && bar.classList.contains('vg-alt')) bar.style.display = livre && !cheia ? 'none' : '';
    let em = 0; for (let x = el.nextElementSibling; x; x = x.nextElementSibling) { if (x.classList.contains('cm-rz') || x.offsetParent === null) continue; const cs = getComputedStyle(x); em += x.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0); }
    const top = el.getBoundingClientRect().top - card.getBoundingClientRect().top + card.scrollTop, pad = parseFloat(getComputedStyle(card).paddingBottom) || 0;
    const h = cheia || livre ? Math.max(220, card.clientHeight - top - em - pad - 2) : vgAltura(); if (Math.abs(el.offsetHeight - h) > 2) el.style.height = h + 'px';
    const sobra = (cheia || livre) && card.scrollHeight - card.clientHeight; if (sobra > 0 && el.offsetHeight - sobra >= 220) el.style.height = (el.offsetHeight - sobra) + 'px'; vgAjusta(m); };
  document.addEventListener('fullscreenchange', () => { alt(); setTimeout(alt, 350); }); if (window.ResizeObserver && card) new ResizeObserver(alt).observe(card); alt(); requestAnimationFrame(alt); setTimeout(alt, 400);   // na abertura as janelas livres ainda estão se arrumando
  // barra embaixo do mapa: arrastar muda a altura (de 260 a 1600 px), guardada neste computador
  const bar = el.nextElementSibling; if (bar && bar.classList.contains('vg-alt')) bar.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); const y0 = e.clientY, h0 = el.offsetHeight;
    const mv = ev => { const h = Math.max(260, Math.min(1600, h0 + ev.clientY - y0)); el.style.height = h + 'px'; try { vgAjusta(m); } catch (er) { } };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (!(document.fullscreenElement === card || (card && card.classList.contains('cm-full')))) try { localStorage.setItem('smf_vg_alt', String(el.offsetHeight)); } catch (er) { } };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); };
}
{ const st = document.createElement('style'); st.textContent = '.vg-alt{flex:0 0 auto;height:14px;margin:2px 0 6px;cursor:ns-resize;display:flex;align-items:center;justify-content:center;border-radius:6px;touch-action:none}.vg-alt:hover{background:#E3EAF3}.vg-alt i{width:60px;height:4px;border-radius:2px;background:#9AA8BA}.vg-mt{background:rgba(255,255,255,.94);border:0;box-shadow:0 1px 3px rgba(0,0,0,.35);font:600 11.5px/1.2 system-ui,sans-serif;color:#16244A;padding:2px 6px}.vg-mt.por{color:#137333}.vg-mt.par{color:#C5221F}.vg-mt.ref{color:#3C4043}.vg-mt:before{display:none}.vg-ic{background:none;border:0}.vg-cid{pointer-events:none}.vg-cid i{position:absolute;left:-2.5px;top:-2.5px;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 2px #000}.vg-cid span{position:absolute;left:6px;top:-8px;white-space:nowrap;font:600 11px/1 system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 2px #000}'
  + '.vg-pt{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;gap:4px;white-space:nowrap}.vg-pt-h{white-space:normal;width:max-content;max-width:520px;background:rgba(20,35,59,.92);border-left:6px solid #34A853;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.5);padding:10px 16px 12px;margin-bottom:8px;color:#fff;font-family:system-ui,sans-serif}'
  + '.vg-pt-t{font:700 14px/1.2 system-ui,sans-serif;color:#9FE0B2;margin-bottom:6px}.vg-pt-c{display:flex;align-items:center;gap:12px;margin-top:4px}.vg-pt-c b{font:800 40px/1 system-ui,sans-serif;min-width:56px;text-align:right;color:#fff}.vg-pt-c span{display:block;font:800 19px/1.15 system-ui,sans-serif;letter-spacing:.5px}.vg-pt-c small{display:block;font:600 12.5px/1.3 system-ui,sans-serif;color:#C9D4E3}'
  + '.vg-pt-r{display:flex;align-items:center;gap:6px}.vg-pt-n{min-width:64px;text-align:center;background:rgba(255,255,255,.94);box-shadow:0 1px 3px rgba(0,0,0,.35);border-radius:3px;font:600 11.5px/1.2 system-ui,sans-serif;color:#16244A;padding:3px 6px;cursor:pointer}.vg-pt-s{padding-left:118px}'; document.head.appendChild(st); }
// clique numa embarcação do mapa (comboio, balsa do comboio, empurrador ou balsa no porto e no estaleiro, ou no nome do comboio): o cartão grande.
// Ouvinte da página, na captura, para não depender do clique do Leaflet (Supervisor, 02/11/2026: “o click não funciona”)
document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target.closest('[data-vgcomb],[data-vgbal],[data-vgemp]') : null;
  if (!t || !t.closest('.leaflet-container') || typeof vgCartaoGrande !== 'function') return;
  e.preventDefault(); e.stopPropagation();
  const sv = t.closest('[data-vgcomb]'), bal = t.closest('[data-vgbal]'), emp = t.closest('[data-vgemp]');
  if (sv) return vgCartaoGrande(sv.getAttribute('data-vgcomb'), bal ? bal.getAttribute('data-vgbal') : '', (VG_MAPA.rod || {})[sv.getAttribute('data-vgcomb')] || '');
  vgCartaoGrande(bal ? bal.getAttribute('data-vgbal') : emp.getAttribute('data-vgemp'), '');
}, true);
