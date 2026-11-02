/* ===== Padrão profissional (Supervisor, 25/10/2026): nome da aba = título da tela, etiqueta da norma em todas as telas, versão com nota de liberação =====
   Telas: o render põe o título de TITULO e a etiqueta de NP_TAG (empurradores “NP 055 · item”, balsas “NP 024 · item”).
   A cada publicação: sobe VERSAO_APP (núcleo) e acrescenta a versão em VERSOES (dados/versoes.js), com o que mudou e a data. */
'use strict';
// nome da aba igual ao título da tela
{ const ab = { rotina: 'Frota', emitir: 'Programar preventiva', kpi: 'Indicadores', relmes: 'Relatório mensal', apresmes: 'Apresentação mensal' };
  SECOES.forEach(s => s.views.forEach(v => { if (ab[v[0]]) v[1] = ab[v[0]]; })); }
// título da tela = nome da aba (só nas telas de aba, sem argumento: ficha, OM e cronograma de um empurrador mantêm o título próprio)
const TITULO = { matriz: 'Anexo I', oms: 'Preventivas', falhas2: 'Corretivas e falhas', horfrota: 'Horímetros', anoleo: 'Análise de óleo', compr: 'Compressão do MCP', lubcons: 'Óleo e resíduos' };   // a Biblioteca é uma página só (apoio): título “Biblioteca”
// etiqueta da norma nas telas das balsas (NP Navecunha 024)
Object.assign(NP_TAG, { bal: 'NP 024 · 5.4 e 6.1', balcr: 'NP 024 · 8', balpl: 'NP 024 · 7 e 8', baldoca: 'NP 024 · 8.12', balcal: 'NP 024 · 8.7 e 6.5', balcmp: 'NP 024 · 8.13', balkpi: 'NP 024 · 10', balft: 'NP 024 · 7' });
// versões do SMF e o que mudou em cada uma (controle de mudanças, ISO 9001 8.5.6 e 7.5.3); a publicação é autorizada pelo Supervisor
// as notas de versão (VERSOES) ficam em dados/versoes.js, carregado só ao abrir o cartão Versão do SMF (versoesHTML)
// logos em data URL para os impressos abertos em janela própria (docCab)
const LOGO64 = {};
(async () => { for (const k of ['nav', 'vda']) { try { const bl = await (await fetch(LOGOS[k])).blob(); LOGO64[k] = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(''); f.readAsDataURL(bl); }); } catch (e) { } } })();
const versoesLista = () => VERSOES.map(x => `<div class="vs-v"><b>SMF ${esc(x.v)}</b> <span class="note">${esc(x.data)}</span><ul>${x.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('');
let VERSOES_P = null;   // carga das notas de versão (dados/versoes.js), uma vez só
function versoesHTML() {
  const ja = typeof VERSOES !== 'undefined';
  if (!ja) { if (!VERSOES_P) VERSOES_P = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'dados/versoes.js'; s.onload = ok; s.onerror = () => { VERSOES_P = null; no(); }; document.head.appendChild(s); });
    VERSOES_P.then(() => { const el = document.getElementById('vsLista'); if (el) el.innerHTML = versoesLista(); }, () => { const el = document.getElementById('vsLista'); if (el) el.innerHTML = '<p class="note">Não deu para carregar as notas de versão (sem sinal e ainda não guardadas neste aparelho).</p>'; }); }
  return `<div class="card"><h2>Versão do SMF · ${VERSAO_APP}</h2><p class="note">Cada versão publicada com o que mudou. A publicação é autorizada pelo Supervisor de Manutenção (controle de mudanças · ISO 9001 8.5.6).</p>
   <div id="vsLista">${ja ? versoesLista() : '<p class="note">Carregando as notas de versão…</p>'}</div></div>`; }
{ const st = document.createElement('style'); st.textContent = `.vs-v{padding:6px 0;border-bottom:1px solid #EEF2F6}.vs-v:last-child{border:0}.vs-v ul{margin:4px 0 0 18px;padding:0}.vs-v li{font-size:13px;line-height:1.45}`; document.head.appendChild(st); }
// Comece aqui das balsas saiu na 3.157 (Supervisor, 02/11/2026: a frota de balsas no mesmo desenho da de empurradores, que abre na Situação; a faixa das etapas fica no topo)
SECOES.unshift({ id: 'mapa', nome: 'Comece aqui', sub: 'a sequência do trabalho', views: [['mapa', 'Comece aqui']] });
{ const h = SECOES.find(s => s.id === 'hoje'); if (h) h.sub = 'chegada, saída e o dia'; }
ICO.mapa = '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>';
// faixa de passos no topo das telas da operação: chegada → falhas → programar → executar → conferir → saída, com o passo atual e o pendente
const OP_PASSOS = [['rotina', 'Chegada'], ['falhas2', 'Falhas'], ['emitir', 'Programar'], ['oms', 'Executar'], ['omconf', 'Conferir'], ['rotina', 'Saída']];
function opPassos() {
  if (FROTA_TIPO === 'bal') return typeof balFaixa === 'function' ? balFaixa() : '';   // balsas: faixa das etapas como a dos empurradores (js/83)
  if (typeof enxuto === 'function' && enxuto() && typeof pcmFaixa === 'function') return pcmFaixa();   // modo enxuto: faixa das 4 etapas do PCM (js/87)
  if (FROTA_TIPO === 'bal' || (typeof ehOperador === 'function' && ehOperador()) || !OP_PASSOS.some(p => p[0] === VIEW)) return '';
  let C = {}; try { C = navCont(); } catch (e) { } const n = { falhas2: C.falhasSem, emitir: C.emitir, oms: C.oms, omconf: C.omconf };
  return `<nav class="op-ps" aria-label="Sequência da operação">${OP_PASSOS.map(([v, t], i) => `<a href="#${v}" class="${v === VIEW ? 'on' : ''}"><b>${i + 1}</b> ${t}${n[v] ? ` <span>${n[v]}</span>` : ''}</a>`).join('<i>→</i>')}<a class="op-mp" href="#mapa">ver a sequência completa</a></nav>`;
}
{ const st = document.createElement('style'); st.textContent = `.mp-l{display:flex;flex-direction:column;gap:6px}.mp-p{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #E3E8EF;border-radius:8px;text-decoration:none;color:inherit}.mp-p:hover{background:#F3F7FE;border-color:#C6DAFC}
.mp-n{width:26px;height:26px;border-radius:50%;background:#1F2A44;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex:none}.mp-t{display:flex;flex-direction:column;flex:1;min-width:0}.mp-t b{font-size:14px}.mp-t small{color:#5F6368;font-size:12px}
.mp-c{background:#1967D2;color:#fff;border-radius:10px;padding:1px 9px;font-weight:700;font-size:12px}.mp-c.r{background:#D93025}
.op-ps{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:0 0 10px;font-size:12.5px}.op-ps a{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border:1px solid #DADCE0;border-radius:16px;background:#fff;color:#3C4043;text-decoration:none}.op-ps a b{font-size:11px;color:#5F6368}
.op-ps a.on{background:#1967D2;border-color:#1967D2;color:#fff;font-weight:600}.op-ps a.on b{color:#fff}.op-ps a span{background:#D93025;color:#fff;border-radius:9px;padding:0 6px;font-size:11px;font-weight:700}.op-ps i{color:#94A3B8;font-style:normal}.op-ps a.op-mp{border:0;background:none;color:#1967D2;margin-left:6px}`; document.head.appendChild(st); }
