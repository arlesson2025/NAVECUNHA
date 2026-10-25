/* ===== Cronograma da frota numa tabela só: Empurrador · Equipamento · Criticidade · Serviços · jan…dez (planejado × realizado) ===== */
'use strict';
const eqGrp = e => e === 'MCP' ? 'MCP' : (e === 'MWM' || e === 'YANMAR') ? 'MCA' : ['HITACHI', 'MASSON', 'REINTJES'].includes(e) ? 'REV' : e;
const eqKeyDe = (pos, t) => eqGrp(t.eq) + '|' + (isMcp(pos) || t.eq === 'RACOR' ? 'MCP' : pos);   // BB e BE (ou Central) numa linha só: "MCP BB/BE", "Caixa de mar BB/BE"
const PRIO_ORD = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
function eqNome(v, k) { const [g, pos] = k.split('|'), ps = mcpPos(v), suf = ps.length > 1 ? ' BB/BE' : '';
  if (g === 'MCP') return { n: 'MCP' + suf, m: 'Mitsubishi ' + [...new Set(ps.map(p => (v.mcpMod || {})[p]).filter(Boolean))].join(' / ') };
  if (g === 'MCA') return { n: posCurtoE(v, pos), m: (v.mcaMod && v.mcaMod[pos]) || EQN[v.mca[pos]] || '' };
  if (g === 'REV') return { n: 'Reversor' + suf, m: [...new Set(ps.map(p => (EQN[v.rev[p]] || '').replace('Reversor ', '')).filter(Boolean))].join(' / ') + ' · caixa redutora' };
  return { n: (EQN[g] || g) + (pos === 'MCP' ? suf : ''), m: '' }; }
function servNome(l) { if (l.tr === 'bordo') return 'Troca de óleo' + (l.its.some(x => compDe(l.its[0].t ? vessel(l.vId) || {} : {}, x.pos, x.t)) ? ' + 250 h' : '');
  if (l.tr === 'janela') { const h = Math.min(...l.its.map(x => x.t.h || 1e9)); return h >= 4000 ? 'Revisão ' + nf(h) + ' h+' : 'Revisão ' + nf(h) + ' h'; }
  if (l.tr === 'doca') return 'Docagem'; return l.nome.replace(' (2 a 10 anos)', '').toLowerCase().replace(/^./, c => c.toUpperCase()); }
function cronoFrota(ano, vid) {
  const out = [];
  S.cfg.frota.filter(v => !foraOp(v) && (!vid || v.id === vid)).forEach(v => {
    const R = cronoMarcas(v, ano), B = cronoBase(ano, v.id), E = {};
    R.forEach(l => { const k = l.eqKey, e = E[k] = E[k] || { v, k, servs: [], crit: 'Baixa', its: 0, M: Array.from({ length: 12 }, () => ({ plan: 0, ok: 0, late: 0, miss: 0, tx: [] })), sis: 99, ord: 0 };
      const sv = l.tr === 'bordo' ? 'Troca de óleo' + (l.its.some(x => compDe(v, x.pos, x.t)) ? ' + itens 250 h' : '') : servNome(l);
      if (!e.servs.includes(sv)) e.servs.push(sv); e.its += l.its.length;
      l.its.forEach(x => { if (PRIO_ORD[x.t.prio] < PRIO_ORD[e.crit]) e.crit = x.t.prio; e.sis = Math.min(e.sis, parseInt(x.t.id)); });
      { const EQO = ['MCP', 'REV', 'EIXO', 'HELICE', 'CXMAR', 'FAE80', 'ALTPE', 'MCA', 'FAE50', 'BAMB30'], gi = EQO.indexOf(k.split('|')[0]); e.ord = e.sis * 1000 + (gi < 0 ? 50 : gi) * 10 + posicoes(v).indexOf(l.its[0].pos); }   // MCP BB, MCP BE, Reversor BB, Reversor BE… lado a lado
      l.M.forEach((m, i) => { const c = e.M[i]; ['plan', 'ok', 'late', 'miss'].forEach(z => c[z] += m[z]); if (m.plan || m.ok || m.late || m.miss) c.tx.push(sv + (m.ok || m.late ? ' · realizado' : m.miss ? ' · venceu e não foi feito' : ' · programado')); }); });
    Object.values(E).forEach(e => { e.nome = eqNome(v, e.k); if (B && B.linhasEq && B.linhasEq[e.k]) e.base = B.linhasEq[e.k]; out.push(e); });
  });
  return out.sort((a, b) => S.cfg.frota.indexOf(a.v) - S.cfg.frota.indexOf(b.v) || a.ord - b.ord);
}
const K3CSS = `.k3{width:100%;border-collapse:collapse}.k3 th{background:#16244A;color:#fff;padding:6px 4px;font-weight:600;position:sticky;top:0;z-index:1}.k3 th.hj{background:#1967D2}.k3 td{border-bottom:1px solid #E8EAED;text-align:center;padding:4px 3px;vertical-align:middle}.k3 td.hj{background:#F1F6FE}
 .k3 td.k3-e{text-align:left;min-width:170px}.k3 td.k3-e small{display:block;color:#5F6368;font-size:.85em}.k3 td.k3-s{text-align:left;color:#3C4043;font-size:.85em;min-width:180px;max-width:260px;line-height:1.3}.k3 td.k3-t{font-weight:700;white-space:nowrap}
 .k3 tr.k3-v td{background:#E8F0FE;color:#16244A;font-weight:700;text-align:left;padding:7px 8px;font-size:1.05em}.k3 tr.k3-v td span{font-weight:400;color:#5F6368;font-size:.85em;margin-left:8px}
 .k3-c{display:inline-block;padding:1px 7px;border-radius:10px;font-size:.85em;font-weight:700}.k3-c.cr{background:#FCE8E6;color:#C5221F}.k3-c.al{background:#FEF7E0;color:#B06000}.k3-c.me{background:#E8F0FE;color:#1967D2}.k3-c.ba{background:#F1F3F4;color:#5F6368}
 i.k3{display:inline-block!important;width:auto!important;min-width:18px;padding:1px 3px;margin:1px;border-radius:4px;color:#fff;font-weight:700;font-style:normal;font-size:.92em}i.k3.plan{background:#80868B}i.k3.ok{background:#188038}i.k3.late{background:#E37400}i.k3.miss{background:#D93025}`;
{ const st = document.createElement('style'); st.textContent = K3CSS + '.k3-w{max-height:72vh;overflow:auto}.k3-leg{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;margin:0 0 10px;font-size:13px}.k3-leg>span{display:inline-flex;align-items:center;gap:4px}'; document.head.appendChild(st); }

 { const s = SECOES.find(x => x.id === 'plan'); if (s) { const i = s.views.findIndex(x => x[0] === 'cxr'); if (i >= 0) s.views.splice(i, 1); const c = s.views.find(x => x[0] === 'crono'); if (c) c[1] = 'Cronograma (planejado × realizado)'; s.extra = (s.extra || []).concat(['cxr']); } }

