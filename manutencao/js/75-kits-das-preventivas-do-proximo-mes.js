/* ===== Kits das preventivas do próximo mês · NP 5.6.1 (lacuna 3 do fluxo NP 055 × SMF, 22/10/2026) =====
   NP 5.6.1: "o estoque cobre os kits das preventivas programadas para o mês seguinte, mais 1 kit de reserva por modelo de motor" (filtros, óleos e correias).
   kitsMes(): por modelo de motor, as trocas de óleo previstas no mês seguinte (o3Dados, proxD de cada equipamento) + as já vencidas, o óleo em litros (capacidade do cárter
   da matriz de lubrificação) e as revisões do cronograma (prLinhas) que levam filtros ou correias. Os códigos dos filtros e correias ficam na Matriz técnica (o SMF não os tem). */
'use strict';
function kitsMes() {
  const H = hoje(), ini = new Date(H.getFullYear(), H.getMonth() + 1, 1), fim = new Date(H.getFullYear(), H.getMonth() + 2, 0), nm = ini.getMonth(), ano = ini.getFullYear();
  const { ENG } = o3Dados(), M = new Map(), op = S.cfg.frota.filter(v => !foraOp(v));
  const mod = (v, e) => { const q = lubEquip(v).find(x => x.nome === e.name || eqNomeC(v, x).startsWith(e.name)); return q ? { m: q.mod || e.name, cap: +q.cap || 0, oleo: q.oleo || '' } : { m: e.name, cap: 0, oleo: '' }; };
  ENG.forEach(e => { if (!['mcp', 'mca', 'crp', 'hid', 'inc'].includes(e.g) || e.sem) return; const v = vessel(e.vid); if (!v || foraOp(v)) return; const d = e.proxD ? new Date(e.proxD) : null;
    const venc = e.v < 0, prox = d && d >= ini && d <= fim; if (!venc && !prox) return; const q = mod(v, e), k = q.m;
    const x = M.get(k) || { m: k, oleo: q.oleo, cap: q.cap, prox: 0, venc: 0, emp: new Set(), rev: new Map() }; if (venc) x.venc++; else x.prox++; x.emp.add(v.nome); M.set(k, x); });
  op.forEach(v => { let L = []; try { L = prLinhas(v, ano); } catch (er) { } L.forEach(g => { const m = g.M[nm], n = m ? m.plan + m.miss + m.ok + m.late : 0; if (!n || !g.eq.m) return;
      if (!/filtro|correia|revis/i.test(g.sv.nome + ' ' + g.its.map(i => i.t.item + ' ' + (i.t.chk || '')).join(' '))) return; if (/troca de óleo/i.test(g.sv.nome)) return;
      const x = M.get(g.eq.m) || { m: g.eq.m, oleo: '', cap: 0, prox: 0, venc: 0, emp: new Set(), rev: new Map() }; x.emp.add(v.nome); x.rev.set(g.sv.nome, (x.rev.get(g.sv.nome) || 0) + 1); M.set(g.eq.m, x); }); });
  const A = [...M.values()].sort((a, b) => a.m.length - b.m.length), R = [];   /* mesma família com sufixo (S6R2-T2MPTK e S6R2-T2MPTK3MS) vira uma linha só */
  A.forEach(x => { const b = R.find(y => x.m.startsWith(y.m)); if (!b) { R.push(x); return; } b.prox += x.prox; b.venc += x.venc; b.cap = b.cap || x.cap; b.oleo = b.oleo || x.oleo; x.emp.forEach(n => b.emp.add(n)); x.rev.forEach((q, s) => b.rev.set(s, (b.rev.get(s) || 0) + q)); });
  return { ini, fim, L: R.sort((a, b) => (b.prox + b.venc) - (a.prox + a.venc) || a.m.localeCompare(b.m)) };
}
function kitsCard() { const K = kitsMes(), mes = K.ini.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const tot = K.L.reduce((a, x) => a + x.prox + x.venc, 0), lit = K.L.reduce((a, x) => a + (x.prox + x.venc + (x.prox + x.venc ? 1 : 0)) * x.cap, 0);
  return `<div class="card kt-c"><div class="row" style="align-items:center"><h2 style="margin:0">Kits das preventivas de ${mes} · NP 5.6.1</h2><span class="sp"></span><span class="note">${tot} troca${tot === 1 ? '' : 's'} de óleo e filtros · ${nf(Math.round(lit))} L de óleo com a reserva</span></div>
   <p class="note" style="margin:6px 0 8px">O estoque deve cobrir os kits das preventivas programadas para o mês seguinte, <b>mais 1 kit de reserva por modelo de motor</b>. Códigos de filtros e correias: Matriz técnica de equipamentos e lubrificação.</p>
   <div class="tw"><table class="t"><thead><tr><th>Modelo</th><th>Óleo</th><th class="r">Trocas no mês</th><th class="r">Já vencidas</th><th class="r">Kits com reserva</th><th class="r">Óleo (L)</th><th>Revisões com filtros ou correias</th><th>Empurradores</th></tr></thead><tbody>
   ${K.L.map(x => { const n = x.prox + x.venc, kits = n ? n + 1 : 0; return `<tr><td><b>${esc(x.m)}</b></td><td class="note">${esc(x.oleo || '—')}</td><td class="r mono">${x.prox || ''}</td><td class="r mono" style="color:var(--badt)">${x.venc || ''}</td><td class="r mono"><b>${kits || '—'}</b></td><td class="r mono">${kits && x.cap ? nf(Math.round(kits * x.cap)) : '—'}</td><td class="note">${[...x.rev].map(([s, q]) => esc(s) + (q > 1 ? ' ×' + q : '')).join(' · ') || '—'}</td><td class="note">${[...x.emp].map(esc).join(', ')}</td></tr>`; }).join('') || '<tr><td colspan="8" class="note">Nenhuma preventiva com kit prevista para o mês seguinte.</td></tr>'}</tbody></table></div>
   <p class="note">Trocas pela data prevista de cada equipamento (ritmo do horímetro); revisões pelo cronograma do mês. Já vencidas também precisam de kit agora.</p></div>`; }
{ const st = document.createElement('style'); st.textContent = `.kt-c{border-left:5px solid #1967D2}`; document.head.appendChild(st); }
