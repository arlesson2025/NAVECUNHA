/* ===== Tela Frota profissional (aprovada pelo Supervisor em 22/10/2026; vence as versões anteriores de VX.rotina) =====
   Resumo em 4 números · pendências agrupadas (f2Agora) · No porto com UM próximo passo na ordem do ciclo (horímetro → programar preventiva → lançar formulário → troca de óleo → saiu de viagem) e o resto no ⋯ ·
   Em viagem com cabeçalho · Situação da frota só vencido/em dia com barrinha. O Operador continua vendo a tela dele (versão anterior de VX.rotina). */
'use strict';
const f2Dias = d => d ? Math.max(0, Math.floor((hoje() - pD(String(d).slice(0, 10))) / 864e5)) : null;
const f2DiasTx = n => n == null ? '—' : n === 0 ? 'hoje' : n === 1 ? '1 dia' : n + ' dias';
// pendências agrupadas: o mesmo tipo de aviso em vários empurradores vira uma linha só
function f2Agora() { const L = agoraLista(), G = new Map();
  L.forEach(x => { const m = x.txt.match(/^<b>([^<]+)<\/b> · ([\s\S]*)$/), nome = m ? m[1] : '', resto = m ? m[2] : x.txt, chave = x.p + '|' + resto.replace(/<[^>]+>/g, '').replace(/\d+([.,]\d+)?/g, '#').replace(/\(.*?\)/g, '').trim().slice(0, 60);
    const g = G.get(chave) || { p: x.p, itens: [], btn: x.btn, txt: x.txt, resto }; g.itens.push({ nome, x }); G.set(chave, g); });
  return [...G.values()].map(g => { if (g.itens.length < 2 || !g.itens[0].nome) return { p: g.p, txt: g.txt, btn: g.btn };
    const tipo = g.resto.replace(/<[^>]+>/g, '').replace(/\s+há \d+ dias/, ' há mais de 14 dias').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
    return { p: g.p, txt: `${esc(tipo)} · <b>${g.itens.length} empurradores</b> <span class="note">(${g.itens.map(i => esc(i.nome)).join(', ')})</span>`, btn: g.btn }; }).sort((a, b) => a.p - b.p); }
   /* janelas livres, como Compressão e Óleo */
document.addEventListener('click', e => { const b = e.target.closest('[data-f2mais]'); if (!b) return; document.querySelectorAll('#main tr.f2-x').forEach(r => r.hidden = false); b.remove(); }, true);
{ const st = document.createElement('style'); st.textContent = `.f2-ks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 14px}.f2-k{background:#fff;border:1px solid #E3E6EA;border-radius:10px;padding:12px 14px}.f2-k span{display:block;font-size:12px;color:#5F6368}.f2-k b{font-size:22px;font-weight:600;white-space:nowrap}.cm-v .f2-ks{margin:4px 0 0}
.f2-ac{text-align:right;white-space:nowrap}.f2-ac .mbtn{margin-left:6px}
@media(max-width:760px){.f2-ks{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st); }
