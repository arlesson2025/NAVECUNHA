/* ===== Perfil Operador (Operador de Medição / Líder): quem preenche e assina o FR 027_L de chegada e saída =====
   Entra com a senha de Operador (definida pelo Supervisor em Administração; servidor v11, papel 'opr'). Vê só "Chegada e saída":
   abrir o FR 027_L de cada empurrador, assinar, informar a OM dos NO. O servidor só aceita dele: fr027, hor, horp, saida e corretiva nova.
   A situação no porto / em viagem também sai dos registros (FR 027_L e saída), porque a configuração compartilhada só o Supervisor grava. */
'use strict';
const ehOperador = () => !!(S.session && S.session.role === 'opr');
can.opr = ehOperador;
// situação no porto / em viagem a partir do registro mais novo (FR 027_L de chegada → porto; FR 027_L de saída ou registro de saída → viagem)
function situRecalc() {
  const ult = {}; for (const r of S.recs.values()) { if (r.excluido || !r.vessel) continue; let st = null;
    if (r.kind === 'fr027') st = r.mov === 'saida' ? 'viagem' : 'porto'; else if (r.kind === 'saida') st = 'viagem'; if (!st) continue;
    const ts = r.at || r.createdAt || 0; if (!ult[r.vessel] || ts > ult[r.vessel].ts) ult[r.vessel] = { st, ts, date: r.date, by: r.by || '' }; }
  S.cfg.frota.forEach(v => { const u = ult[v.id]; if (!u) return; const atual = v.situ ? (v.situ.ts || +pD(v.situ.at)) : 0;
    if (u.ts > atual) v.situ = { st: u.st, at: u.date || isoD(new Date(u.ts)), by: u.by, ts: u.ts }; }); }
// tela do operador
/* Tela do Operador num bloco só (24/10/2026): boia/cais (situBoiaHTML) e Avaria em viagem entram direto no cartão (antes eram 2 camadas por cima) */
function vOperador() {
  const V = S.cfg.frota.filter(v => !foraOp(v));
  const linha = v => { const s = situDe(v), r = fr27s(v.id).pop(), P = fr27Pend(v.id);
    const bt = !s ? `<button class="mbtn sm" data-situ="${v.id}|porto">⚓ Está no porto</button><button class="mbtn sm" data-situ="${v.id}|viagem">⛴ Está viajando</button>`
      : s.st === 'porto' ? `<button class="mbtn pri" data-situ="${v.id}|viagem">⛴ Saiu de viagem · FR 027_L de saída</button>` : `<button class="mbtn pri" data-situ="${v.id}|porto">⚓ Chegou em Manaus · FR 027_L de chegada</button>`;
    return `<div class="op-c"><div class="op-h"><b>${esc(v.nome)}</b><span class="note">${!s ? 'situação não informada' : s.st === 'porto' ? '⚓ no porto' : '⛴ em viagem'}</span></div>
      <div class="note">${r ? 'Último FR 027_L: ' + (r.mov === 'saida' ? 'saída' : 'chegada') + ' em ' + brD(r.date) + ' ' + esc(r.hora || '') : 'Nenhum FR 027_L ainda'}</div>
      ${P.length ? `<div class="rt2-l bad"><span>⚠ ${P.length} NO sem OM${P.some(x => x.c === 'Crítica') ? ' · <b>Crítica</b>' : ''}</span><span class="sp"></span><button class="mbtn sm" data-fr27pend="${P[0].rec}">Informar OM</button></div>` : ''}
      ${situBoiaHTML(v) || ''}<div class="op-b">${bt}${!s || s.st !== 'porto' ? `<button class="mbtn" data-avaria="${v.id}">⚠ Avaria em viagem</button>` : ''}</div></div>`; };
  return `<div class="vh"><div><h1>Chegada e saída · FR 027_L</h1><p>Você preenche e assina o check-list do empurrador na chegada e na saída do terminal (NP 055, itens 4.4 e 5.5.1). Todo item NO precisa de criticidade e do nº da OM aberta no Sankhya. O Supervisor de Manutenção confere depois.</p></div><span class="sp"></span><span class="note">${esc(S.session.name)} · Operador</span></div>
    <div class="op-g">${V.map(linha).join('')}</div>`;
}
VX.rotina = function () { return ehOperador() ? vOperador() : vPainel(); };   /* o Operador vê a tela dele; os outros, o Painel da frota (bloco “Painel da frota”) */
{ const st = document.createElement('style'); st.textContent = `.op-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px}.op-c{background:#fff;border:1px solid var(--line,#DADCE0);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}
 .op-h{display:flex;align-items:center;gap:10px}.op-h b{font-size:17px}.op-b{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}.op-b .mbtn{font-size:15px;padding:10px 14px;white-space:normal;text-align:left;max-width:100%}
 body.perfil-opr .abas,body.perfil-opr .banner.ex{display:none!important}`; document.head.appendChild(st); }
