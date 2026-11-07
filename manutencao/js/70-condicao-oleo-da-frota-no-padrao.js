/* ===== Condição: Óleo da frota no padrão e aba Horímetros da frota (pedido do Supervisor, 22/10/2026: "condição por sistema é vago; não consigo ver de forma global por empurrador o horímetro de cada equipamento") =====
   Óleo da frota: Resumo em números (olResumo) no lugar dos anéis "Condição por sistema"; filtro por sistema em chips na tabela (olSisChips, mesmo data-olg); "Empurrador" na tabela; Saldo para a troca com o gráfico original e o eixo legível.
   Horímetros (view horfrota, 1ª aba da Condição): uma linha por empurrador, uma coluna por motor (horímetro total e data da leitura; âmbar com mais de MCA_SEM_LEITURA_D dias); o registro (#hor) sai de Administração e fica nesta seção. */
'use strict';
{ const st = document.createElement('style'); st.textContent = `.ol-old{background:#FEF7E0;color:#B06000;border-radius:4px;padding:0 3px}`; document.head.appendChild(st); }
function olSisChips(ENG) { const c = g => ENG.filter(e => e.g === g).length;
  return `<div class="cm-chips" style="margin:-2px 0 10px"><span class="note" style="margin-right:4px">Sistema</span><button class="cm-chip${OLF.g ? '' : ' on'}" data-olg="${OLF.g}">Todos</button>${(VIEW === 'ballub' && typeof BAL_OL_SIS !== 'undefined' ? BAL_OL_SIS : OL_SIS).filter(([g]) => c(g)).map(([g, nome]) => `<button class="cm-chip${OLF.g === g ? ' on' : ''}" data-olg="${g}">${nome} <b>${c(g)}</b></button>`).join('')}</div>`; }

/* Pareto das horas rodadas por MCP nos últimos 12 meses (pedido do Supervisor, 22/10/2026): barras em ordem decrescente + % acumulada e linha de 80%; horas = soma dos meses com leitura (horasMes). */



{ SECOES.forEach(s => { if (s.id !== 'cond2') s.views = s.views.filter(x => x[0] !== 'hor'); });
  const c = SECOES.find(s => s.id === 'cond2'); if (c) { if (!c.views.some(x => x[0] === 'horfrota')) c.views.unshift(['horfrota', 'Horímetros']); c.extra = (c.extra || []).filter(x => x !== 'hor').concat('hor'); } }
{ const st = document.createElement('style'); st.textContent = `
`; document.head.appendChild(st); }
