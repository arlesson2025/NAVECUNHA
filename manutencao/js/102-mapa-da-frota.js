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
const VG_MAPA = { m: null, lib: null };
function vgLugar(t) { const n = vgNorm(t); if (!n) return null; let b = null; Object.keys(VG_LUGAR).forEach(k => { if (n.includes(vgNorm(k)) && (!b || k.length > b.length)) b = k; }); return b; }
function vgMapaDados() {
  const V = vgViagens(), E = S.cfg.frota.filter(v => !foraOp(v) || vgEmReforma(v.id)).map(v => vgOndeDe(v.id, false, V)), P = {}, R = [], sem = [];
  E.forEach(o => {
    if (o.st === 'ref') return;
    if (o.st === 'por') { const k = vgLugar(o.porto) || (o.porto === 'Porto não informado' ? null : o.porto); if (!k || !VG_LUGAR[k]) return sem.push(o); (P[k] = P[k] || []).push(o); return; }
    const L = vgPosicoes(o.id).filter(x => x.situ !== 'por' && (!o.saida || x.date >= o.saida)), q = L[L.length - 1];
    const ll = q && q.lat != null && q.lon != null ? [+q.lat, +q.lon] : (k => k ? VG_LUGAR[k] : null)(vgLugar(o.local));
    if (!ll) return sem.push(o); R.push({ o, ll, aprox: !(q && q.lat != null) });
  });
  return { P, R, sem, ref: E.filter(o => o.st === 'ref') };
}
function vgMapaCard() {
  const D = vgMapaDados(), nP = Object.values(D.P).reduce((a, L) => a + L.length, 0);
  const sem = D.sem.length ? `<p class="note" style="margin:6px 0 0"><b>Sem posição no mapa:</b> ${D.sem.map(o => `${esc(o.nome)}${o.st === 'via' ? ' (em rota' + (o.dias != null ? ', ' + o.dias + ' d' : '') + ')' : ''}`).join(' · ')} · use “Informar posição” ou cole o e-mail do Monitoramento</p>` : '';
  return `<div class="card"><h2>Mapa da frota · hoje</h2><p class="note" style="margin-top:0">${D.R.length} em rota · ${nP} no porto${D.ref.length ? ' · ' + D.ref.length + ' em reforma' : ''} · azul = em rota, vermelho = parado há mais de ${VG_PARADO_D} dias, verde = no porto (número = empurradores no porto) · clique no ponto para ver as balsas e a última posição</p>
    <div id="vgMapa" data-nodrag style="height:460px;border-radius:8px;background:#E8EEF5;position:relative"><p class="note" style="padding:12px">Carregando o mapa…</p></div>${sem}
    <p class="note" style="margin:4px 0 0">Posição em rota pela latitude e longitude do e-mail do Monitoramento; sem elas, pelo lugar citado (posição aproximada da cidade, marcada “aprox.”). O mapa precisa de internet.</p></div>`;
}
function vgMapaLib() {
  if (window.L && L.map) return Promise.resolve();
  if (VG_MAPA.lib) return VG_MAPA.lib;
  const base = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'leaflet.min.css'; document.head.appendChild(css);
  return VG_MAPA.lib = new Promise((ok, no) => { const s = document.createElement('script'); s.src = base + 'leaflet.min.js'; s.onload = ok; s.onerror = () => { VG_MAPA.lib = null; no(new Error('sem internet')); }; document.head.appendChild(s); });
}
async function vgMapaIniciar() {
  const el = $('#vgMapa'); if (!el) return;
  try { await vgMapaLib(); } catch (e) { if (el.isConnected) el.innerHTML = '<p class="note" style="padding:12px;color:var(--warnt)">O mapa não carregou: precisa de internet. Os quadros “Fora do porto” e “No porto” mostram a mesma informação.</p>'; return; }
  if (!el.isConnected) return; el.innerHTML = '';
  if (VG_MAPA.m) { try { VG_MAPA.m.remove(); } catch (e) { } }
  const ruas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' });
  const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 17, attribution: 'Imagem © Esri' });
  const m = VG_MAPA.m = L.map(el, { layers: [sat], zoomSnap: .5, scrollWheelZoom: false });
  L.control.layers({ 'Satélite': sat, 'Mapa': ruas }, null, { position: 'topright' }).addTo(m);
  const D = vgMapaDados(), pts = [], bal = o => (o.balsas || []).map(vName).join(', ');
  const tip = (t, cls) => ({ permanent: true, direction: 'right', offset: [8, 0], className: 'vg-mt' + (cls ? ' ' + cls : '') });
  Object.entries(D.P).forEach(([k, Lp]) => { const ll = VG_LUGAR[k]; pts.push(ll);
    L.circleMarker(ll, { radius: 11, color: '#fff', weight: 2, fillColor: '#188038', fillOpacity: 1 }).addTo(m)
      .bindTooltip(`${esc(k)} · ${Lp.length}`, tip('', 'por'))
      .bindPopup(`<b>${esc(k)} · no porto</b><br>${Lp.map(o => `<b>${esc(o.nome)}</b>${o.dias != null ? ' · há ' + o.dias + ' d' : ''}${o.est ? ' (chegada estimada)' : ''}${bal(o) ? '<br><small>' + esc(bal(o)) + '</small>' : ''}`).join('<br>')}`); });
  D.R.forEach(({ o, ll, aprox }) => { pts.push(ll); const par = o.parD > VG_PARADO_D;
    L.circleMarker(ll, { radius: 8, color: '#fff', weight: 2, fillColor: par ? '#D93025' : '#1A73E8', fillOpacity: 1 }).addTo(m)
      .bindTooltip(`${esc(o.nome)}${aprox ? ' · aprox.' : ''}`, tip('', par ? 'par' : ''))
      .bindPopup(`<b>${esc(o.nome)} · em rota</b>${o.rota ? '<br>' + esc(vgRotaCurta(o.rota)) : ''}${o.saida ? '<br>saída ' + brD(o.saida) + (o.dias != null ? ' · ' + o.dias + ' d' : '') : ''}${bal(o) ? '<br>' + esc(bal(o)) : ''}<br>${esc(o.local || '')}${o.at ? ' · ' + vgDH(o.at) : ''}${par ? `<br><b style="color:#C5221F">parado há ${o.parD} d</b>` : ''}${aprox ? '<br><small>posição aproximada pelo lugar citado</small>' : ''}`); });
  if (pts.length > 1) m.fitBounds(pts, { padding: [40, 40], maxZoom: 8 }); else m.setView(pts[0] || VG_LUGAR['Manaus'], 6);
  if (window.ResizeObserver) new ResizeObserver(() => { try { m.invalidateSize(); } catch (e) { } }).observe(el);
}
{ const st = document.createElement('style'); st.textContent = '.vg-mt{background:rgba(255,255,255,.92);border:0;box-shadow:0 1px 3px rgba(0,0,0,.35);font:600 11.5px/1.2 system-ui,sans-serif;color:#16244A;padding:2px 6px}.vg-mt.por{color:#137333}.vg-mt.par{color:#C5221F}.vg-mt:before{display:none}'; document.head.appendChild(st); }
