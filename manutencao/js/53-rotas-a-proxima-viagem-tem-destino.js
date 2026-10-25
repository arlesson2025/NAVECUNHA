/* ===== Rotas: a próxima viagem tem destino e duração real (máxima) =====
   Durações medidas nos boletins do Monitoramento (Autotrac), out/2025–out/2026; rotas sem dados = estimativa (marcada).
   Planejamento pela MÁXIMA (decisão do Supervisor). MCP: dias de navegação × 24 h. MCA: ciclo inteiro fora de Manaus × 12 h cada
   (nas paradas fora de Manaus o MCA pode estar ligado: nem sempre há energia de terra). A mesma conta vale em todas as telas (viagemDe).
   Ajuste dos números: S.cfg.rotas (sobrepõe ROTAS0 pelo id). */
'use strict';
const ROTAS0 = [
  { id: 'pvh', nome: 'Manaus × Itacoatiara × Porto Velho × Manaus', nav: 20, ciclo: 50, fonte: 'medido', obs: 'Itacoatiara → Porto Velho 7–9 d na cheia, 10–14 d na seca; parada em Porto Velho de 7 a 33 d' },
  { id: 'ita', nome: 'Manaus × Itacoatiara × Manaus', nav: 3, ciclo: 8, fonte: 'medido', obs: 'ida 14–16 h, volta 25–37 h, parada em Itacoatiara 2–6 d' },
  { id: 'bre', nome: 'Manaus × Bretaña (Peru, via Iquitos) × Manaus', nav: 34, ciclo: 90, fonte: 'medido', obs: 'navegação ida ~21 d e volta ~13 d; ciclo medido 56 d, chega a 3 meses (informado pelo Supervisor)' },
  { id: 'bip', nome: 'Manaus × Barcarena × Itacoatiara × Porto Velho × Manaus', nav: 30, ciclo: 80, fonte: 'estimado', obs: 'até Porto Velho ~42 d medidos; volta estimada' },
  { id: 'bpv', nome: 'Manaus × Barcarena × Porto Velho × Manaus', nav: 30, ciclo: 75, fonte: 'estimado', obs: 'sem datas nos boletins lidos' },
  { id: 'bma', nome: 'Manaus × Barcarena × Manaus', nav: 12, ciclo: 22, fonte: 'estimado', obs: 'Manaus → Barcarena 4,5 d medidos; volta e parada estimadas' },
  { id: 'vdc', nome: 'Manaus × Vila do Conde × Manaus', nav: 12, ciclo: 22, fonte: 'estimado', obs: 'mesma região de Barcarena; sem datas nos boletins lidos' }
];
const rotas = () => ROTAS0.map(r => Object.assign({}, r, ((S.cfg.rotas || {})[r.id]) || {}));
const rotaDe = v => v && v.rotaProx ? rotas().find(r => r.id === v.rotaProx) || null : null;
const rotaHmcp = r => r.nav * 24, rotaHmca = r => r.ciclo * 12;
const ROTA_PADRAO = 'pvh';   // sem rota escolhida: a mais comum, pela máxima (antes eram 120 h fixas)
const rotaUso = v => rotaDe(v) || (v && !(+v.viagH > 0) ? rotas().find(r => r.id === ROTA_PADRAO) : null);
const horasViagem = (v, pos) => { const r = rotaUso(v); return r ? (MCAS.includes(pos) ? rotaHmca(r) : rotaHmcp(r)) : viagemDe(v); };
async function salvarRota(vid, rid) { const v = vessel(vid), r = rotas().find(x => x.id === rid); if (!v) return;
  if (!r) { delete v.rotaProx; delete v.viagHmca; await salvarViagem(vid, v.viagH || 0); return; }
  v.rotaProx = r.id; v.viagHmca = rotaHmca(r); EM.viag = rotaHmcp(r); await salvarViagem(vid, rotaHmcp(r)); }
// óleo e filtros a bordo: quantas trocas vencem durante a viagem
function bordoTrocas(v) { const r = rotaUso(v); if (!r) return null;
  return lubDados().filter(x => x.v === v && !x.saida && ['mcp', 'mca', 'crp'].includes(x.e.g) && x.horas != null).map(x => {
    const H = x.e.g === 'mca' ? rotaHmca(r) : rotaHmcp(r), iv = intervalo(x.t, v, x.e.pos).h || 0, rest = x.horas;
    const aBordo = iv > 0 ? (rest <= 0 ? Math.floor(H / iv) : rest <= H ? 1 + Math.floor((H - rest) / iv) : 0) : 0;   // vencida: troca antes de sair e conta as do intervalo
    const c = typeof o3Carter === 'function' ? o3Carter(x.e) : { t: '' }, L = (() => { const m = String(c.t || '').match(/\d+(?:[.,]\d+)?/g) || []; const n = m.map(x => parseFloat(x.replace(',', '.'))); return n.length ? Math.max(...n) : 0; })();   // "40–60 L" → 60 (pela máxima)
    return { nome: eqNomeC(v, x.e), g: x.e.g, rest, H, iv, antes: rest <= 0, n: aBordo, L, cart: c.t || '—' }; }).filter(x => x.antes || x.n > 0); }
function bordoHTML(v) { const r = rotaUso(v); if (!r) return '';
  const B = bordoTrocas(v) || [], antes = B.filter(x => x.antes), ab = B.filter(x => x.n > 0), litros = ab.reduce((a, x) => a + x.n * x.L, 0);
  return `<div class="card"><div class="row"><h2>Óleo e filtros a bordo para esta viagem</h2><span class="sp"></span><span class="note">${esc(r.nome)} · MCP ${nf(rotaHmcp(r))} h · MCA ${nf(rotaHmca(r))} h cada${r.fonte === 'estimado' ? ' · <b>rota estimada</b>' : ''}${rotaDe(v) ? '' : ' · <b>rota padrão: escolha a da viagem</b>'}</span></div>
   ${antes.length ? `<div class="banner bad"><b>Trocar antes de sair:</b> ${antes.map(x => esc(x.nome) + ' (' + (x.rest < 0 ? 'vencida ' + nf(-x.rest) + ' h' : 'vence agora') + ')').join(' · ')}</div>` : ''}
   ${ab.length ? `<div class="tw"><table class="t"><thead><tr><th>Equipamento</th><th class="r">Falta hoje</th><th class="r">Intervalo</th><th class="r">Trocas durante a viagem</th><th class="r">Cárter</th></tr></thead><tbody>${ab.map(x => `<tr><td><b>${esc(x.nome)}</b></td><td class="mono r">${nf(Math.max(0, x.rest))} h</td><td class="mono r">${nf(x.iv)} h</td><td class="mono r"><b>${x.n}</b></td><td class="mono r">${esc(x.cart)}</td></tr>`).join('')}</tbody></table></div>
     <p class="note">Embarcar óleo e filtros para <b>${ab.reduce((a, x) => a + x.n, 0)} troca(s)</b>${litros ? ' · cerca de <b>' + nf(Math.ceil(litros)) + ' L</b> de óleo (pelo volume do cárter da matriz)' : ''}. As trocas a bordo são do CTF/MFM, com FR 049_B.</p>` : '<p class="note">Nenhuma troca de óleo vence durante a viagem.</p>'}</div>`; }
// programação da janela: escolher a rota; ela define as horas de MCP e de MCA da viagem
document.addEventListener('change', e => { if (e.target.id !== 'emH') return; const v = vessel(($('#emV') || {}).value || ARG); if (v) { delete v.rotaProx; delete v.viagHmca; } }, true);   // horas digitadas à mão valem no lugar da rota
document.addEventListener('change', async e => { if (e.target.id !== 'emRota') return; const vid = ($('#emV') || {}).value || ARG; await salvarRota(vid, e.target.value); render(); }, true);
