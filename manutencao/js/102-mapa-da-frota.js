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
const VG_FIXO = { 'Boia 1 · porto da Navecunha': [-3.098460, -60.083036], 'Boia 2 · porto do Cimento': [-3.183579, -59.989933], 'Porto Velho · filial': [-8.694150, -63.917464] };
const VG_FIXO_RE = [[/\bboia\s*(?:n\s*)?(?:2|02|ii|dois)\b|cimento/, 'Boia 2 · porto do Cimento'], [/\bboia\s*(?:n\s*)?(?:1|01|i|um)\b|navecunha/, 'Boia 1 · porto da Navecunha'], [/filial|porto velho|\bpvh\b/, 'Porto Velho · filial'], [/manaus|\bmao\b|\bboia\b/, 'Boia 1 · porto da Navecunha']];
function vgFixo(t) { const n = vgNorm(t); if (!n) return null; const r = VG_FIXO_RE.find(x => x[0].test(n)); return r ? r[1] : null; }
const vgLL = k => VG_FIXO[k] || VG_LUGAR[k];
const VG_MAPA = { m: null, lib: null };
function vgLugar(t) { const f = vgFixo(t); if (f) return f; const n = vgNorm(t); if (!n) return null; let b = null; Object.keys(VG_LUGAR).forEach(k => { if (n.includes(vgNorm(k)) && (!b || k.length > b.length)) b = k; }); return b; }
function vgMapaDados() {
  const V = vgViagens(), E = S.cfg.frota.filter(v => !foraOp(v) || vgEmReforma(v.id)).map(v => vgOndeDe(v.id, false, V)), P = {}, R = [], sem = [];
  E.forEach(o => {
    if (o.st === 'ref') return;
    if (o.st === 'por') { const k = vgLugar(o.porto) || (o.porto === 'Porto não informado' ? null : o.porto); if (!k || !vgLL(k)) return sem.push(o); (P[k] = P[k] || []).push(o); return; }
    const L = vgPosicoes(o.id).filter(x => x.situ !== 'por' && (!o.saida || x.date >= o.saida)), q = L[L.length - 1];
    const ll = q && q.lat != null && q.lon != null ? [+q.lat, +q.lon] : (k => k ? vgLL(k) : null)(vgLugar(o.local));
    if (!ll) return sem.push(o); R.push({ o, ll, aprox: !(q && q.lat != null) });
  });
  return { P, R, sem, ref: E.filter(o => o.st === 'ref') };
}
function vgMapaCard() {
  const D = vgMapaDados(), nP = Object.values(D.P).reduce((a, L) => a + L.length, 0);
  const sem = D.sem.length ? `<p class="note" style="margin:6px 0 0"><b>Sem posição no mapa:</b> ${D.sem.map(o => `${esc(o.nome)}${o.st === 'via' ? ' (em rota' + (o.dias != null ? ', ' + o.dias + ' d' : '') + ')' : ''}`).join(' · ')} · use “Informar posição” ou cole o e-mail do Monitoramento</p>` : '';
  return `<div class="card"><h2>Mapa da frota · hoje</h2><p class="note" style="margin-top:0">${D.R.length} em rota · ${nP} no porto${D.ref.length ? ' · ' + D.ref.length + ' em reforma' : ''} · azul = em rota, vermelho = parado há mais de ${VG_PARADO_D} dias, verde = no porto (número = empurradores no porto) · clique no ponto para ver as balsas e a última posição</p>
    <div id="vgMapa" data-nodrag style="height:560px;border-radius:8px;background:#E8EEF5;position:relative"><p class="note" style="padding:12px">Carregando o mapa…</p></div>${sem}
    <p class="note" style="margin:4px 0 0">Posição em rota pela latitude e longitude do e-mail do Monitoramento; sem elas, pelo lugar citado (posição aproximada da cidade, marcada “aprox.”). O mapa precisa de internet.</p></div>`;
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
const vgGoogle = ll => `<br><a href="https://www.google.com/maps?q=${ll[0]},${ll[1]}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a>`;
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
  Object.entries(D.P).forEach(([k, Lp]) => { const ll = vgLL(k); pts.push(ll);
    L.marker(ll, { icon: vgIcone('#188038', 0, Lp.length), riseOnHover: true }).addTo(m)
      .bindTooltip(`${esc(k)} · ${Lp.map(o => esc(o.nome.replace(/^CJA\s*/, ''))).join(', ')}`, tip('por'))
      .bindPopup(`<b>${esc(k)} · no porto · ${Lp.length}</b><br>${Lp.map(o => `<b>${esc(o.nome)}</b>${o.dias != null ? ' · há ' + o.dias + ' d' : ''}${o.est ? ' (chegada estimada)' : ''}${bal(o) ? '<br><small>' + esc(bal(o)) + '</small>' : ''}`).join('<br>')}${vgGoogle(ll)}`); });
  D.R.forEach(({ o, ll, aprox }) => { pts.push(ll); const par = o.parD > VG_PARADO_D;
    L.marker(ll, { icon: vgIcone(par ? '#D93025' : '#1A73E8', (o.balsas || []).length), riseOnHover: true }).addTo(m)
      .bindTooltip(`${esc(o.nome)}${aprox ? ' · aprox.' : ''}`, tip(par ? 'par' : ''))
      .bindPopup(`<b>${esc(o.nome)} · em rota</b>${o.rota ? '<br>' + esc(vgRotaCurta(o.rota)) : ''}${o.saida ? '<br>saída ' + brD(o.saida) + (o.dias != null ? ' · ' + o.dias + ' d' : '') : ''}${bal(o) ? '<br>' + esc(bal(o)) : ''}<br>${esc(o.local || '')}${o.at ? ' · ' + vgDH(o.at) : ''}${par ? `<br><b style="color:#C5221F">parado há ${o.parD} d</b>` : ''}${aprox ? '<br><small>posição aproximada pelo lugar citado</small>' : ''}${vgGoogle(ll)}`); });
  if (pts.length > 1) m.fitBounds(pts, { padding: [50, 50], maxZoom: 8 }); else m.setView(pts[0] || VG_FIXO['Boia 1 · porto da Navecunha'], 6);
  // tela cheia da janela (botão ⛶ do quadro): o mapa ocupa a altura toda
  const card = el.closest('.card'), alt = () => { const cheia = document.fullscreenElement === card || (card && card.classList.contains('cm-full'));
    const h = cheia ? Math.max(420, window.innerHeight - el.getBoundingClientRect().top - 24) : 560; if (Math.abs(el.offsetHeight - h) > 2) el.style.height = h + 'px'; try { m.invalidateSize(); } catch (e) { } };
  document.addEventListener('fullscreenchange', alt); if (window.ResizeObserver && card) new ResizeObserver(alt).observe(card); alt();
}
{ const st = document.createElement('style'); st.textContent = '.vg-mt{background:rgba(255,255,255,.94);border:0;box-shadow:0 1px 3px rgba(0,0,0,.35);font:600 11.5px/1.2 system-ui,sans-serif;color:#16244A;padding:2px 6px}.vg-mt.por{color:#137333}.vg-mt.par{color:#C5221F}.vg-mt:before{display:none}.vg-ic{background:none;border:0}.vg-cid{pointer-events:none}.vg-cid i{position:absolute;left:-2.5px;top:-2.5px;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 2px #000}.vg-cid span{position:absolute;left:6px;top:-8px;white-space:nowrap;font:600 11px/1 system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 2px #000}'; document.head.appendChild(st); }
