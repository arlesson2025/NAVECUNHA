/* ===== Padrão das telas aplicado às telas restantes (aprovado em 22/10/2026) =====
   padTela(view, cfg): só apresentação sobre o HTML que a tela já gera — cabeçalho padrão (título + 1 linha + botões da tela + Reorganizar),
   janela "Resumo" com 3–4 números (cfg.resumo) e todos os blocos em janelas livres (janelasLivres, chave smf_<view>_lay). A lógica e os handlers da tela não mudam. */
'use strict';
function padTela(view, cfg) {
  const nm = 'v' + view[0].toUpperCase() + view.slice(1), v0 = VX[view] || (typeof window[nm] === 'function' ? window[nm] : null); if (!v0) return;
  VX[view] = function () { const h = v0.apply(this, arguments), t = document.createElement('div'); t.innerHTML = h;
    if (t.querySelector(':scope > .cm-v')) return h;
    const old = t.querySelector(':scope > .vh'), btns = old ? [...old.querySelectorAll(':scope > button, :scope > a.mbtn, :scope > label.mbtn, :scope > nav, :scope > details')].map(b => b.outerHTML).join('') : ''; if (old) old.remove();
    const k = (l, val, c) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${val}</b></div>`;
    let res = ''; try { const R = cfg.resumo ? cfg.resumo() : null; if (R && R.length) res = `<div class="card"><h2>Resumo</h2><div class="f2-ks">${R.map(r => k(...r)).join('')}</div></div>`; } catch (e) { }
    const cards = [...t.children].filter(c => !(c.tagName === 'P' && !c.textContent.trim())).map(c => c.classList.contains('card') ? c.outerHTML : `<div class="card">${c.outerHTML}</div>`).join('');
    return `<div class="cm-v"><div class="vh"><div><h1>${cfg.titulo}</h1><p>${cfg.desc}</p></div><span class="sp"></span>${btns}<button class="mbtn" data-padreset="${view}" title="Volta os blocos à posição e ao tamanho original">Reorganizar</button></div>
     <div class="cm-ws">${res}${cards}</div></div>`; };
  const a0 = AFTER[view]; AFTER[view] = function () { a0 && a0.apply(this, arguments); const ws = document.querySelector('#main .cm-ws'); if (ws) janelasLivres(ws, 'smf_' + view + '_lay', '[data-padreset="' + view + '"]'); };
}
const padGrupos = f => { const G = new Set(); return oms().filter(o => !o.excluido && f(o)).filter(o => { const g = o.grupo || o.id; if (G.has(g)) return false; G.add(g); return true; }).length; };
padTela('oms', { titulo: 'Executar e lançar · Preventivas', desc: 'OMs preventivas abertas no Sankhya: lançar o formulário que voltou assinado',
  resumo: () => [['Em aberto', padGrupos(o => o.tipo !== 'C' && o.status !== 'encerrada')], ['Para lançar', padGrupos(o => o.tipo !== 'C' && ['emitida', 'abordo', 'executada'].includes(o.status))], ['Em conferência', padGrupos(o => o.tipo !== 'C' && o.status === 'conferencia')]] });
padTela('omconf', { titulo: 'Conferir e encerrar', desc: 'Conferir e aprovar no SMF · depois anexar o PDF e encerrar a OM no Sankhya',
  resumo: () => [['Esperando conferência', padGrupos(o => o.status === 'conferencia')], ['Falta anexar no Sankhya', typeof skPend === 'function' ? skPend().length : 0, 'var(--warnt)']] });
padTela('apoio', { titulo: 'Biblioteca', desc: 'Documentos, sobressalentes críticos, prestadores de serviço e treinamentos',
  resumo: () => [['Documentos', recs('doc').length], ['Sobressalentes críticos', recs('peca').length], ['Prestadores', recs('terc').length], ['Treinamentos', recs('trein').length]] });
padTela('admin', { titulo: 'Administração', desc: 'Cadastro da frota, senhas e perfis, nuvem e dados de exemplo' });
padTela('kpi', { titulo: 'Indicadores', desc: 'Indicadores da NP 055 (item 9), riscos e medidas de mitigação' });
padTela('matriz', { titulo: 'Anexo I · plano de manutenção', desc: 'Itens do plano preventivo e preditivo (NP 055 · 7.2) · consulta · clique num item para ver o método',
  resumo: () => { const P = A1.filter(t => t.kind !== 'sup'), fora = P.filter(t => t.kind !== 'prog'), n = k => fora.filter(t => t.kind === k).length; return [['Itens no plano', P.length], ['No cronograma (periódicos)', P.length - fora.length], ['Fora do cronograma', fora.length + ' <small class="note" style="font-size:11px;font-weight:400">' + [n('cond') && n('cond') + ' por condição', n('novo') && n('novo') + ' de equipamento novo', n('saida') && n('saida') + ' por saída'].filter(Boolean).join(' · ') + '</small>'], ['Prioridade Crítica', P.filter(t => t.prio === 'Crítica').length, 'var(--badt)']]; } });
padTela('controle', { titulo: 'Calibração e docagem', desc: 'Calibração de instrumentos e plano de docagem (vistoria em seco)' });
