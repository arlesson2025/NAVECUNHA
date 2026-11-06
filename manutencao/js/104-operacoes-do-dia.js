'use strict';
/* ===== 1.3 · Operações do dia no mapa da frota (SMF 3.202, Supervisor 05/11/2026: “vc ler o whatsapp atualiza o layout do SMF do que se trata de posição
   dos comboios e no mapa ao lado nessa parte você abre um quadro transparente mesmo operações do dia e programações futuras”; “nada de rodoviário, só a frota aquaviária”)
   · Quadro de vidro em cima do mapa (canto direito, sobre o oceano): abas Operações do dia · Programações · Pendências.
   · Dados = snap tipo 'opdia' (um por dia, id fixo 'snap-opdia-AAAA-MM-DD'): date, at, itens [{hora, titulo, detalhe, status: concluida|andamento|aguardando}],
     prog [{data AAAA-MM-DD, hora, titulo, detalhe}], pend [texto], fonte. Lançado pelo Claude depois de ler os grupos do WhatsApp (smfLancarOperacoes)
     ou à mão. Sobe para a nuvem como qualquer snap (o servidor já aceita): sem mudança no Code.gs.
   · Posição dos comboios lida no WhatsApp: smfLancarBoletim(texto, coordenadas) usa a mesma leitura do Boletim Autotrac (vgLerBoletim, js/94).
   · Botão “Atualizar mapa”: sincroniza com a nuvem e redesenha o mapa e o quadro. */
const OPD = { aba: 'ops', min: false };
const OPD_ST = { concluida: ['Concluída', '#3ECF8E'], andamento: ['Em andamento', '#4FB3FF'], aguardando: ['Aguardando', '#F5B942'] };
function opdUlt() {
  const L = recs('snap').filter(r => r.tipo === 'opdia' && !r.excluido && r.date).sort((a, b) => (a.date + (a.at || '')) < (b.date + (b.at || '')) ? -1 : 1);
  return L[L.length - 1] || null;
}
function opdHtml() {
  const o = opdUlt(), H = isoD(hoje());
  if (!o) return `<div class="opd-cab"><b>Operações</b><button class="opd-x" data-opdmin title="Recolher">–</button></div><p class="opd-v">Nenhuma leitura dos grupos ainda.</p>`;
  const it = (o.itens || []).slice().sort((a, b) => (a.hora || '') < (b.hora || '') ? 1 : -1), pg = (o.prog || []).filter(p => !p.data || p.data >= H).sort((a, b) => ((a.data || '') + (a.hora || '')) < ((b.data || '') + (b.hora || '')) ? -1 : 1), pd = o.pend || [];
  const ab = (k, t, n) => `<button class="opd-ab${OPD.aba === k ? ' on' : ''}" data-opdab="${k}">${t}<i>${n}</i></button>`;
  let c = '';
  if (OPD.aba === 'ops') c = (o.date !== H ? `<p class="opd-v">Última leitura: ${brD(o.date)}.</p>` : '') + (it.length ? it.map(x => { const s = OPD_ST[x.status] || ['', '#9AA9B3'];
    return `<div class="opd-it"><span class="opd-h">${esc(x.hora || '')}</span><div><b>${esc(x.titulo || '')}</b>${x.detalhe ? `<small>${esc(x.detalhe)}</small>` : ''}${s[0] ? `<em style="color:${s[1]};background:${s[1]}22">${s[0]}</em>` : ''}</div></div>`; }).join('') : '<p class="opd-v">Nenhuma operação informada.</p>');
  else if (OPD.aba === 'prog') { let d0 = ''; c = pg.length ? pg.map(x => { const t = x.data && x.data !== d0 ? `<div class="opd-dt">${x.data === H ? 'Hoje' : brD(x.data)}</div>` : ''; d0 = x.data || d0;
    return t + `<div class="opd-it"><span class="opd-h">${esc(x.hora || '')}</span><div><b>${esc(x.titulo || '')}</b>${x.detalhe ? `<small>${esc(x.detalhe)}</small>` : ''}</div></div>`; }).join('') : '<p class="opd-v">Nenhuma programação futura.</p>'; }
  else c = pd.length ? pd.map(x => `<div class="opd-pd">${esc(x)}</div>`).join('') : '<p class="opd-v">Nenhuma pendência.</p>';
  return `<div class="opd-cab"><b>${o.date === H ? 'Hoje · ' : ''}${brD(o.date)}</b><span>${o.at ? 'lido ' + vgDH(o.at) : ''}</span><button class="opd-x" data-opdmin title="Recolher">–</button></div>
    <div class="opd-abas">${ab('ops', 'Operações do dia', it.length)}${ab('prog', 'Programações', pg.length)}${ab('pend', 'Pendências', pd.length)}</div><div class="opd-c">${c}</div>
    <div class="opd-f">${esc(o.fonte || 'WhatsApp')}</div>`;
}
// chamado por vgMapaIniciar (js/102) depois de montar o mapa
function opdNoMapa(m) {
  const C = L.Control.extend({ options: { position: 'topright' }, onAdd() {
    const d = L.DomUtil.create('div', 'opd' + (OPD.min ? ' min' : '')); d.innerHTML = OPD.min ? '<button class="opd-abre" data-opdmin>Operações do dia ▸</button>' : opdHtml();
    L.DomEvent.disableClickPropagation(d); L.DomEvent.disableScrollPropagation(d);
    d.addEventListener('click', e => { const t = e.target.closest('[data-opdab],[data-opdmin]'); if (!t) return;
      if (t.dataset.opdab) OPD.aba = t.dataset.opdab; else OPD.min = !OPD.min;
      d.className = 'opd' + (OPD.min ? ' min' : ''); d.innerHTML = OPD.min ? '<button class="opd-abre" data-opdmin>Operações do dia ▸</button>' : opdHtml(); opdAltura(m, d); });
    setTimeout(() => opdAltura(m, d), 0); m.on('resize', () => opdAltura(m, d)); return d; } });
  new C().addTo(m);
}
const opdAltura = (m, d) => { try { d.style.maxHeight = Math.max(200, m.getSize().y - 90) + 'px'; } catch (e) { } };
// botão Atualizar mapa: busca na nuvem o que foi lançado (de qualquer aparelho) e redesenha
document.addEventListener('click', async e => {
  const t = e.target && e.target.closest ? e.target.closest('[data-vgatu]') : null; if (!t) return; e.preventDefault();
  t.disabled = true; const tx = t.textContent; t.textContent = 'Atualizando…';
  try { await syncNow(); } catch (er) { }
  render(); toast('Mapa atualizado' + (opdUlt() ? ' · operações de ' + brD(opdUlt().date) : '') + '.');
});
// ---------- lançamento pelo Claude (depois de ler os grupos do WhatsApp) ----------
// smfLancarOperacoes({ date, itens, prog, pend, fonte }): grava (ou substitui) as operações do dia; devolve o resumo
async function smfLancarOperacoes(o) {
  if (!can.edit()) return 'Entre como Supervisor para lançar.';
  const d = o && o.date || isoD(hoje()), H = hoje(), id = 'snap-opdia-' + d, ant = S.recs.get(id);
  const rec = Object.assign({}, ant || {}, { id, kind: 'snap', tipo: 'opdia', date: d, at: isoD(H) + 'T' + String(H.getHours()).padStart(2, '0') + ':' + String(H.getMinutes()).padStart(2, '0'),
    itens: (o.itens || []).slice(0, 60), prog: (o.prog || []).slice(0, 40), pend: (o.pend || []).slice(0, 20), fonte: o.fonte || 'WhatsApp · Logística Navecunha', por: (S.session || {}).name || 'Claude', excluido: false });
  await saveRec(rec); render();
  return `Operações de ${brD(d)} gravadas: ${rec.itens.length} operações, ${rec.prog.length} programações, ${rec.pend.length} pendências.`;
}
// smfLancarBoletim(texto, { 'CJA XX': [-3.50, -60.87] }): posições dos comboios citados no texto (mesma leitura do Boletim Autotrac);
// coordenadas tiradas do mapinha do Monitoramento entram como latitude e longitude (posição aproximada). Não repete posição já gravada.
async function smfLancarBoletim(txt, coords) {
  if (!can.edit()) return 'Entre como Supervisor para lançar.';
  const R = vgLerBoletim(txt), G = [], A = [], C = coords || {};
  for (const r of R) {
    const c = Object.keys(C).find(k => vgNorm(k) === vgNorm(r.nome) || vgNorm(r.nome).endsWith(vgNorm(k))); if (c && r.lat == null) { r.lat = +C[c][0]; r.lon = +C[c][1]; }
    const at = r.date + 'T' + (r.hora || '00:00');
    if (vgPosicoes(r.vessel).some(p => (p.at || p.date) === at && vgNorm(p.local) === vgNorm(r.local))) { A.push(r.nome + ': já lançada'); continue; }
    const rec = { id: uid('snap'), kind: 'snap', tipo: 'pos', vessel: r.vessel, date: r.date, at, situ: r.situ, local: r.local, porto: r.situ === 'por' ? r.porto || r.local : '', parDesde: r.parDesde || '', obs: '', fonte: 'whatsapp', por: (S.session || {}).name || 'Claude', ...(r.lat != null ? { lat: r.lat, lon: r.lon } : {}) };
    await saveRec(rec); G.push(rec); A.push(r.nome + ': ' + (r.situ === 'por' ? 'no porto ' + rec.porto : r.local));
  }
  render();
  const D = vgMapaDados(), fora = D.sem.filter(o => G.some(g => g.vessel === o.id)).map(o => o.nome);
  return (G.length ? G.length + ' posição(ões) gravada(s). ' : 'Nenhuma posição nova. ') + A.join(' · ') + (fora.length ? ' · FORA DO MAPA: ' + fora.join(', ') : '');
}
{ const st = document.createElement('style'); st.textContent = '.opd{width:340px;max-width:calc(100vw - 80px);overflow:auto;background:rgba(10,30,44,.62);border:1px solid rgba(140,200,230,.22);border-radius:14px;backdrop-filter:blur(12px) saturate(140%);-webkit-backdrop-filter:blur(12px) saturate(140%);box-shadow:0 8px 30px rgba(0,0,0,.4);color:#E8F3F8;font:13px/1.35 system-ui,sans-serif;margin-top:12px!important}'
  + '.opd.min{width:auto;background:none;border:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;overflow:visible}.opd-abre{background:rgba(10,30,44,.75);color:#fff;border:1px solid rgba(140,200,230,.3);border-radius:10px;padding:8px 12px;font:600 12.5px system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(8px)}'
  + '.opd-cab{display:flex;align-items:center;gap:8px;padding:11px 12px 4px 14px}.opd-cab b{font-size:14px}.opd-cab span{flex:1;font-size:11px;color:#8FB0C0}.opd-x{background:rgba(255,255,255,.1);border:0;color:#fff;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:15px;line-height:1}'
  + '.opd-abas{display:flex;gap:2px;padding:4px 8px 0;border-bottom:1px solid rgba(140,200,230,.15)}.opd-ab{flex:1;background:none;border:0;border-bottom:2px solid transparent;color:#8FB0C0;font:600 11.5px system-ui,sans-serif;padding:7px 2px;cursor:pointer}.opd-ab.on{color:#fff;border-bottom-color:#4FB3D9}.opd-ab i{font-style:normal;margin-left:4px;padding:0 5px;border-radius:8px;background:rgba(255,255,255,.14);font-size:10.5px}'
  + '.opd-c{padding:4px 14px 8px}.opd-it{display:grid;grid-template-columns:44px 1fr;gap:8px;padding:8px 0;border-bottom:1px solid rgba(140,200,230,.1)}.opd-it:last-child{border-bottom:0}.opd-h{font:600 12px ui-monospace,monospace;color:#CFE6F0;padding-top:1px}.opd-it b{display:block;font-size:13px}.opd-it small{display:block;color:#A9C4D1;font-size:11.8px;margin-top:2px}'
  + '.opd-it em{display:inline-block;font-style:normal;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:10px;margin-top:4px}.opd-dt{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7FA2B3;margin:10px 0 0}.opd-pd{padding:8px 0 8px 22px;position:relative;border-bottom:1px solid rgba(140,200,230,.1)}.opd-pd:before{content:"!";position:absolute;left:0;top:8px;width:16px;height:16px;border-radius:50%;background:rgba(245,185,66,.25);color:#F5B942;font-weight:800;font-size:11px;text-align:center;line-height:16px}'
  + '.opd-v{color:#A9C4D1;padding:8px 14px;margin:0}.opd-f{padding:6px 14px 10px;font-size:10.5px;color:#6F92A3}'; document.head.appendChild(st); }
