/* =====================================================================
   EMBARCAÇÃO FORA DE OPERAÇÃO (em reforma / ativo novo aguardando liberação)
   não gera vencimentos, alertas de horímetro nem bloqueio de saída
   ===================================================================== */
'use strict';
const FORA_PADRAO = {
  'CJA XIII': { motivo: 'Em reforma', obs: 'Motores novos; horímetro zerado até sair da reforma' },
  'CJA XXI': { motivo: 'Ativo novo · aguardando liberação', obs: 'Aguardando documentação da Capitania para a primeira operação' },
};
const FORA_MOT = ['Em reforma', 'Ativo novo · aguardando liberação', 'Docagem', 'Parado · aguardando peça', 'Outro'];
const foraOp = v => { v = typeof v === 'string' ? vessel(v) : v; return v && v.foraOp && v.foraOp.motivo ? v.foraOp : null; };
function foraInit() { let mud = false; (S.cfg.frota || []).forEach(v => { if (!('foraOp' in v)) { v.foraOp = FORA_PADRAO[v.nome] ? Object.assign({ desde: isoD(hoje()) }, FORA_PADRAO[v.nome]) : null; mud = true; } }); if (mud) kvSet('cfg', S.cfg); }
// aviso no topo do painel e cadastro em Administração
function admForaHTML() { const a = can.admin(); return `<div class="card"><div class="row"><h2>Embarcações fora de operação</h2><span class="sp"></span><span class="note">Em reforma ou ainda não liberada: não gera vencimentos, alertas de horímetro nem bloqueio de saída.</span></div>
   <div class="tw"><table class="t"><thead><tr><th>Embarcação</th><th>Situação</th><th>Motivo</th><th>Observação</th><th>Desde</th></tr></thead><tbody>${S.cfg.frota.map(v => { const f = v.foraOp || {}; return `<tr><td><b>${esc(v.nome)}</b></td><td><select data-fo="${v.id}" data-k="on" ${a ? '' : 'disabled'}><option value="">Em operação</option><option value="1"${f.motivo ? ' selected' : ''}>Fora de operação</option></select></td>
     <td><select data-fo="${v.id}" data-k="motivo" ${a && f.motivo ? '' : 'disabled'}>${f.motivo ? '' : '<option>—</option>'}${FORA_MOT.map(m => `<option${f.motivo === m ? ' selected' : ''}>${m}</option>`).join('')}</select></td><td><input data-fo="${v.id}" data-k="obs" value="${esc(f.obs || '')}" ${a && f.motivo ? '' : 'disabled'}></td><td><input type="date" data-fo="${v.id}" data-k="desde" value="${esc(f.desde || '')}" ${a && f.motivo ? '' : 'disabled'}></td></tr>`; }).join('')}</tbody></table></div></div>`; }
document.addEventListener('change', async e => { const el = e.target.closest('[data-fo]'); if (!el || !can.admin()) return; const v = vessel(el.dataset.fo); if (!v) return;
  if (el.dataset.k === 'on') v.foraOp = el.value ? { motivo: FORA_MOT[0], obs: '', desde: isoD(hoje()) } : null; else { v.foraOp = v.foraOp || { motivo: FORA_MOT[0] }; v.foraOp[el.dataset.k] = el.value; }
  S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg);
  if (S.url) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota } }); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } } catch (er) { } }
  toast(v.nome + (foraOp(v) ? ': fora de operação (' + foraOp(v).motivo + ').' : ': de volta à operação.')); render(); });
/* ---------- dados de placa dos motores (n.º de série, potência, cilindrada) ---------- */
const PLACA_PADRAO = { 'CJA XX': { MCA3: { mod: 'MWM D229-4', sn: 'B1N503926', pot: '48,5 kW / 1800 rpm', cil: '3,922 L', data: '2020-11-23', fun: 'Bomba de incêndio (canhão SCI)' } } };
function placaInit() { let mud = false; (S.cfg.frota || []).forEach(v => { const P = PLACA_PADRAO[v.nome]; if (!P) return; v.placa = v.placa || {}; Object.keys(P).forEach(p => { if (!v.placa[p]) { v.placa[p] = P[p]; mud = true; } }); }); if (mud) kvSet('cfg', S.cfg); }
const placaTxt = pl => [pl.sn && 'S/N ' + pl.sn, pl.pot, pl.cil, pl.data && 'placa ' + brD(pl.data)].filter(Boolean).join(' · ');
{ let n = 0; const t = setInterval(() => { n++; if (typeof S !== 'undefined' && S.cfg && S.cfg.frota && document.getElementById('main')) { clearInterval(t); render(); } else if (n > 100) clearInterval(t); }, 150); }

