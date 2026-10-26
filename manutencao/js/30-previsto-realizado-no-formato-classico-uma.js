/* ===== Previsto × Realizado no formato clássico: uma linha por serviço, P e R mês a mês ===== */
'use strict';
const PRV = { v: 'frota', ano: hoje().getFullYear(), gm: (() => { try { return localStorage.getItem('smf_cf_gm') || 'acum'; } catch (e) { return 'acum'; } })() };   // gráfico abre no Acumulado (linhas) e lembra a última escolha
const PR_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function prServ(v, l) {   // nome do serviço, frequência e ordem
  if (l.tr === 'bordo') { const oil = l.its.find(x => !compDe(v, x.pos, x.t)) || l.its[0], iv = intervalo(oil.t, v, oil.pos);
    return { nome: 'Troca de óleo e filtros' + (l.its.some(x => compDe(v, x.pos, x.t)) ? ' (+ itens de 250 h)' : ''), freq: [iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' meses' : ''].filter(Boolean).join(' ou '), o: 0 }; }
  if (l.tr === 'janela') { const h = Math.min(...l.its.map(x => intervalo(x.t, v, x.pos).h || 1e9)); return { nome: h >= 4000 ? 'Revisão de ' + nf(h) + ' h ou mais' : 'Revisão de ' + nf(h) + ' h', freq: nf(h) + ' h', o: 1 + h / 1e5 }; }
  if (l.tr === 'doca') return { nome: 'Docagem', freq: '5 anos', o: 9 };
  const m = Math.min(...l.its.map(x => intervalo(x.t, v, x.pos).m || 99)), nm = m <= 3 ? 'trimestral' : m <= 6 ? 'semestral' : m <= 12 ? 'anual' : 'de longo prazo';
  return { nome: 'Inspeção ' + nm, freq: m <= 12 ? m + (m === 1 ? ' mês' : ' meses') : m + ' meses', o: 5 + m / 100 };
}
function prLinhas(v, ano) {
  const R = cronoMarcas(v, ano), B = cronoBase(ano, v.id), G = {};
  R.forEach(l => { const sv = prServ(v, l), k = l.eqKey + '|' + sv.nome;
    const g = G[k] = G[k] || { k, v, eqKey: l.eqKey, sv, its: [], M: Array.from({ length: 12 }, () => ({ plan: 0, ok: 0, late: 0, miss: 0, corr: 0, tx: [] })), sis: 99 };
    g.its.push(...l.its); l.its.forEach(x => { g.sis = Math.min(g.sis, parseInt(x.t.id)); });
    l.M.forEach((m, i) => { const c = g.M[i]; c.plan += m.plan; c.ok += m.ok; c.late += m.late; c.miss += m.miss; c.corr += m.corr || 0; c.tx.push(...m.its.filter(s => /OM|FR|feito|venceu/.test(s))); }); });
  const L = Object.values(G).map(g => { g.eq = eqNome(v, g.eqKey); g.base = B && B.linhasPR ? B.linhasPR[g.k] : null; g.crit = g.its.reduce((a, x) => PRIO_ORD[x.t.prio] < PRIO_ORD[a] ? x.t.prio : a, 'Baixa'); return g; });
  const EQO = ['MCP', 'REV', 'EIXO', 'HELICE', 'CXMAR', 'FAE80', 'ALTPE', 'RACOR', 'MCA', 'FAE50', 'BAMB30'];
  return L.sort((a, b) => a.sis - b.sis || ((EQO.indexOf(a.eqKey.split('|')[0]) + 1 || 50) - (EQO.indexOf(b.eqKey.split('|')[0]) + 1 || 50)) || a.eqKey.localeCompare(b.eqKey) || a.sv.o - b.sv.o);
}
function prTabela(v, ano, pdf) {
  const L = prLinhas(v, ano), hm = hoje().getFullYear() === ano ? hoje().getMonth() : ano < hoje().getFullYear() ? 12 : -1;
  const spS = {}, spE = {}; L.forEach(g => { const s = SISTEMAS[g.sis - 1] || ''; spS[s] = (spS[s] || 0) + 2; spE[s + '|' + g.eqKey] = (spE[s + '|' + g.eqKey] || 0) + 2; });
  let sisA = '', eqA = '', rows = '';
  const tot = PR_MES.map(() => ({ p: 0, r: 0, ok: 0, den: 0 }));
  L.forEach(g => { const s = SISTEMAS[g.sis - 1] || '', ke = s + '|' + g.eqKey;
    let pre = '';
    if (pdf) { if (s !== sisA) { sisA = s; eqA = ''; rows += `<tr class="pr-gs"><td colspan="${PR_MES.length + 4}">${esc(s)}</td></tr>`; } if (ke !== eqA) { eqA = ke; rows += `<tr class="pr-ge"><td colspan="${PR_MES.length + 4}">${esc(g.eq.n)}${g.eq.m ? ' · ' + esc(g.eq.m) : ''}</td></tr>`; } }
    else { if (s !== sisA) { sisA = s; eqA = ''; pre += `<td class="pr-ms" rowspan="${spS[s]}">${esc(s)}</td>`; } if (ke !== eqA) { eqA = ke; pre += `<td class="pr-me" rowspan="${spE[ke]}">${esc(g.eq.n)}${g.eq.m ? `<small>${esc(g.eq.m)}</small>` : ''}</td>`; } }
    const P = g.M.map((m, i) => { const pv = g.base ? (g.base[i] || 0) : m.plan + m.miss + m.ok + m.late; tot[i].p += pv; return pv; });
    const cP = P.map((n, i) => `<td class="pr-c p${i === hm ? ' hj' : ''}">${n ? (n > 1 ? n : '●') : ''}</td>`).join('');
    const cR = g.M.map((m, i) => { const r = m.ok + m.late; tot[i].r += r; tot[i].ok += m.ok; if (i <= hm) tot[i].den += m.ok + m.late + m.miss; const tip = esc(m.tx.join('\n'));
      if (r) return `<td class="pr-c r ${m.late ? 'late' : 'ok'}${i === hm ? ' hj' : ''}" title="${tip}">${r > 1 ? r + '×' : '✓'}</td>`;
      if (m.miss) return `<td class="pr-c r miss${i === hm ? ' hj' : ''}" title="${tip}">✗</td>`;
      return `<td class="pr-c r${i === hm ? ' hj' : ''}"></td>`; }).join('');
    const sP = P.reduce((a, x) => a + x, 0), sR = g.M.reduce((a, m) => a + m.ok + m.late, 0);
    rows += `<tr class="pr-p">${pre}<td class="pr-sv" rowspan="2"><b>${esc(g.sv.nome)}</b><small>${esc(g.crit)}</small></td><td class="pr-f" rowspan="2">${esc(g.sv.freq)}</td><td class="pr-l">P</td>${cP}<td class="pr-t">${sP}</td></tr><tr class="pr-r"><td class="pr-l">R</td>${cR}<td class="pr-t">${sR}</td></tr>`; });
  const cs = pdf ? 3 : 5; const foot = `<tr class="pr-tot"><td colspan="${cs}">Total previsto</td>${tot.map(t => `<td class="pr-c">${t.p || ''}</td>`).join('')}<td class="pr-t">${tot.reduce((a, t) => a + t.p, 0)}</td></tr>
    <tr class="pr-tot"><td colspan="${cs}">Total realizado</td>${tot.map(t => `<td class="pr-c">${t.r || ''}</td>`).join('')}<td class="pr-t">${tot.reduce((a, t) => a + t.r, 0)}</td></tr>
    <tr class="pr-tot"><td colspan="${cs}">Aderência (feito no prazo ÷ vencido)</td>${tot.map((t, i) => `<td class="pr-c"><b>${i <= hm && t.den ? Math.round(t.ok / t.den * 100) + '%' : ''}</b></td>`).join('')}<td class="pr-t"><b>${(() => { const ok = tot.reduce((a, t) => a + t.ok, 0), d = tot.reduce((a, t) => a + t.den, 0); return d ? Math.round(ok / d * 100) + '%' : '—'; })()}</b></td></tr>`;
  return `<table class="pr-t"><colgroup>${pdf ? '' : '<col style="width:105px"><col style="width:120px">'}<col style="width:190px"><col style="width:86px"><col style="width:22px">${PR_MES.map(() => '<col>').join('')}<col style="width:40px"></colgroup>
   <thead><tr>${pdf ? '' : '<th>Sistema</th><th>Equipamento</th>'}<th>Serviço</th><th>Frequência</th><th></th>${PR_MES.map((m, i) => `<th${i === hm ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>Total</th></tr></thead><tbody>${rows || '<tr><td colspan="18">Sem serviços.</td></tr>'}</tbody><tfoot>${foot}</tfoot></table>`;
}
function prFrota(ano, pdf) {
  const V = S.cfg.frota.filter(v => !foraOp(v)), hm = hoje().getFullYear() === ano ? hoje().getMonth() : ano < hoje().getFullYear() ? 12 : -1;
  const tot = PR_MES.map(() => ({ p: 0, r: 0, ok: 0, den: 0 })); let tF = 0, tFm = 0;
  const rows = V.map(v => { const L = prLinhas(v, ano), P = Array(12).fill(0), Rr = Array(12).fill(0), Ok = Array(12).fill(0), Lt = Array(12).fill(0), Ms = Array(12).fill(0);
    L.forEach(g => g.M.forEach((m, i) => { P[i] += g.base ? (g.base[i] || 0) : m.plan + m.miss + m.ok + m.late; Rr[i] += m.ok + m.late; Ok[i] += m.ok; Lt[i] += m.late; Ms[i] += m.miss; }));
    const venc = Ms.reduce((a, x) => a + x, 0), mesFalta = hm >= 0 && hm < 12 ? Math.max(0, P[hm] - Rr[hm] - Ms[hm]) : 0, ok = Ok.slice(0, hm + 1).reduce((a, x) => a + x, 0), den = ok + Lt.slice(0, hm + 1).reduce((a, x) => a + x, 0) + Ms.slice(0, hm + 1).reduce((a, x) => a + x, 0), ad = den ? Math.round(ok / den * 100) : null;
    tF += venc; tFm += mesFalta; P.forEach((x, i) => { tot[i].p += x; tot[i].r += Rr[i]; tot[i].ok += Ok[i]; if (i <= hm) tot[i].den += Ok[i] + Lt[i] + Ms[i]; });
    const cP = P.map((n, i) => `<td class="pr-c p${i === hm ? ' hj' : ''}">${n || ''}</td>`).join('');
    const cR = Rr.map((n, i) => `<td class="pr-c r ${i > hm ? '' : Ms[i] ? 'miss' : Lt[i] ? 'late' : n ? 'ok' : ''}${i === hm ? ' hj' : ''}" title="${n} realizados · ${Lt[i]} com atraso · ${Ms[i]} não feitos">${i > hm ? '' : (n || (P[i] ? '0' : '')) + (Ms[i] ? '<small> ✗' + Ms[i] + '</small>' : '')}</td>`).join('');
    const nome = pdf ? `<b>${esc(v.nome)}</b>` : `<a href="#cxr" data-prv="${v.id}"><b>${esc(v.nome)}</b></a>`;
    return `<tr class="pr-p"><td class="pr-sv" rowspan="2">${nome}</td><td class="pr-l">P</td>${cP}<td class="pr-t">${P.reduce((a, x) => a + x, 0)}</td><td class="pr-fa" rowspan="2">${venc ? `<b style="color:#C5221F">${venc} vencido${venc > 1 ? 's' : ''}</b>` : '<span style="color:#188038">nada vencido</span>'}${mesFalta ? `<small>${mesFalta} ainda neste mês</small>` : ''}</td><td class="pr-ad" rowspan="2"><b style="color:${ad == null ? '#5F6368' : ad >= 90 ? '#188038' : ad >= 75 ? '#B06000' : '#C5221F'}">${ad == null ? '—' : ad + '%'}</b></td></tr>
     <tr class="pr-r"><td class="pr-l">R</td>${cR}<td class="pr-t">${Rr.reduce((a, x) => a + x, 0)}</td></tr>`; }).join('');
  const okT = tot.reduce((a, t) => a + t.ok, 0), dT = tot.reduce((a, t) => a + t.den, 0);
  const foot = `<tr class="pr-tot"><td colspan="2">Frota · previsto</td>${tot.map(x => `<td class="pr-c">${x.p || ''}</td>`).join('')}<td class="pr-t">${tot.reduce((a, x) => a + x.p, 0)}</td><td rowspan="3" class="pr-fa"><b style="color:${tF ? '#C5221F' : '#188038'}">${tF} vencidos</b>${tFm ? `<small>${tFm} ainda neste mês</small>` : ''}</td><td rowspan="3" class="pr-ad"><b>${dT ? Math.round(okT / dT * 100) + '%' : '—'}</b></td></tr>
   <tr class="pr-tot"><td colspan="2">Frota · realizado</td>${tot.map((x, i) => `<td class="pr-c">${i > hm ? '' : x.r}</td>`).join('')}<td class="pr-t">${tot.reduce((a, x) => a + x.r, 0)}</td></tr>
   <tr class="pr-tot"><td colspan="2">Aderência</td>${tot.map((x, i) => `<td class="pr-c"><b>${i <= hm && x.den ? Math.round(x.ok / x.den * 100) + '%' : ''}</b></td>`).join('')}<td class="pr-t"></td></tr>`;
  return `<table class="pr-t"><colgroup><col style="width:120px"><col style="width:22px">${PR_MES.map(() => '<col>').join('')}<col style="width:46px"><col style="width:150px"><col style="width:80px"></colgroup>
   <thead><tr><th>Empurrador</th><th></th>${PR_MES.map((m, i) => `<th${i === hm ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>Total</th><th>Falta fazer</th><th>Aderência</th></tr></thead><tbody>${rows}</tbody><tfoot>${foot}</tfoot></table>`;
}
// ---- frota toda no layout "uma linha por empurrador": realizado / previsto por mês, mês atual com barra, carga prevista nos meses seguintes ----
// filtro de meses cumulativo (PRV.ms: lista de meses marcados; vazio = ano todo) · blocos como janelas · colunas com largura ajustável
const PR_MESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const prMesesSel = () => PRV.ms && PRV.ms.length ? PRV.ms.slice().sort((a, b) => a - b) : Array.from({ length: 12 }, (_, i) => i);
const cfCorr = n => n ? `<span class="cf-cor" title="${n} serviço${n > 1 ? 's' : ''} refeito${n > 1 ? 's' : ''} em corretiva · reinicia o vencimento, não conta como realizado">+${n} corr.</span>` : '';   // marca roxa: item do Anexo I refeito numa corretiva encerrada
function cxMesItens(v, ano, i) {   // serviços do cronograma no mês i ainda por fazer (previsto ou vencido), com os itens do Anexo I de cada um
  return prLinhas(v, ano).filter(g => g.M[i].plan + g.M[i].miss > 0).map(g => ({ g }));
}
function prMesModal(vid, i) {
  const v = vessel(vid), ano = +PRV.ano, L = cxMesItens(v, ano, i), sel = new Set(), fora = [];
  L.forEach(({ g }) => g.its.forEach(x => { const k = x.pos + '|' + x.t.id; if (typeof foraJanela === 'function' && foraJanela(x.t.id, v, x.pos)) fora.push(k); else if (!omAberta(v.id, x.pos, x.t.id)) sel.add(k); }));
  const lin = L.map(({ g }) => { const m = g.M[i], ja = g.its.some(x => omAberta(v.id, x.pos, x.t.id)), bordo = g.its.every(x => fora.includes(x.pos + '|' + x.t.id));
    return `<tr><td>${esc(g.eq.n)}</td><td><b>${esc(g.sv.nome)}</b><div class="note">${esc(g.its.map(x => x.t.chk || x.t.item).join(' · '))}</div></td><td>${esc(g.sv.freq || '')}</td><td><span class="cf-cr2 ${PR_CRIT[g.crit] || 'bx'}">${esc(g.crit)}</span></td><td>${m.miss ? '<span class="pill p-bad">vencido</span>' : '<span class="pill p-mut">previsto</span>'}${ja ? ' <span class="pill p-inf">já tem OM</span>' : ''}${bordo ? ' <span class="note">troca de óleo · FR 049_B</span>' : ''}</td></tr>`; }).join('');
  modal(`<h2>${esc(v.nome)} · ${MESES[i]} de ${ano} · ${L.length} serviço${L.length === 1 ? '' : 's'} do cronograma</h2>
   <p class="note">O que o cronograma prevê para o mês e ainda não foi feito. “Programar” abre a Programar preventiva deste empurrador com esses itens marcados: lá você confere, digita o nº da OM do Sankhya e emite; o Anexo II-B sai para imprimir.${fora.length ? ' Troca de óleo e o que vai junto não entram na OM (são do FR 049_B).' : ''}</p>
   <div class="tw" style="max-height:55vh;overflow:auto"><table class="t"><thead><tr><th>Equipamento</th><th>Serviço</th><th>A cada</th><th>Criticidade</th><th>Situação</th></tr></thead><tbody>${lin || '<tr><td colspan="5" class="note">Nada pendente neste mês.</td></tr>'}</tbody></table></div>
   <div class="row end" style="margin-top:10px"><button class="mbtn" data-close>Fechar</button>${sel.size && can.edit() ? `<button class="mbtn pri" id="pmProg">Programar estes serviços (${sel.size} ite${sel.size === 1 ? 'm' : 'ns'})</button>` : ''}</div>`, true);
  const b = $('#pmProg'); if (b) b.onclick = () => {   // abre a Programar preventiva direto no passo ② com os itens marcados
    EM.vid = v.id; EM.sel = sel; EM.draft = null; EM.viag = null; EM.pvVid = null; EM.pvJump = 2; EM.doCx = new Set(sel); closeModal(); location.hash = '#emitir/' + v.id; };
}
document.addEventListener('click', e => { const c = e.target.closest('[data-prmes]'); if (!c || VIEW !== 'cxr') return; e.preventDefault(); e.stopPropagation(); const [vid, i] = c.dataset.prmes.split('|'); prMesModal(vid, +i); }, true);
function prResumo(v, ano, hm, sel) {   // mesmos números da tabela clássica (prFrota), somados só nos meses marcados
  const L = prLinhas(v, ano), P = Array(12).fill(0), R = Array(12).fill(0), Ok = Array(12).fill(0), Lt = Array(12).fill(0), Ms = Array(12).fill(0), C = Array(12).fill(0);
  L.forEach(g => g.M.forEach((m, i) => { P[i] += g.base ? (g.base[i] || 0) : m.plan + m.miss + m.ok + m.late; R[i] += m.ok + m.late; Ok[i] += m.ok; Lt[i] += m.late; Ms[i] += m.miss; C[i] += m.corr; }));
  const s = (A, f) => sel.filter(f || (() => true)).reduce((a, i) => a + A[i], 0), passou = i => i <= hm;
  const ok = s(Ok, passou), den = ok + s(Lt, passou) + s(Ms, passou);
  // realizado do previsto: em cada mês conta no máximo o que estava previsto (o que foi feito fora do previsto aparece só na célula do mês)
  return { v, P, R, Ok, Lt, Ms, C, venc: s(Ms), mesFalta: sel.includes(hm) ? Math.max(0, P[hm] - R[hm] - Ms[hm]) : 0, ok, den, ad: den ? Math.round(ok / den * 100) : null, tP: s(P), tR: sel.reduce((a, i) => a + Math.min(P[i], R[i]), 0) };
}
function prFrotaV2(ano) {
  const V = S.cfg.frota.filter(v => !foraOp(v)), hm = hoje().getFullYear() === ano ? hoje().getMonth() : ano < hoje().getFullYear() ? 12 : -1, sel = prMesesSel();
  const D = V.map(v => prResumo(v, ano, hm, sel));
  if (PRV.ord === 'nome') D.sort((a, b) => a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }));
  else D.sort((a, b) => b.venc - a.venc || b.mesFalta - a.mesFalta || (a.ad == null ? 101 : a.ad) - (b.ad == null ? 101 : b.ad) || a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }));
  const F = { v: { nome: 'Consolidado da frota' }, P: Array(12).fill(0), R: Array(12).fill(0), Ok: Array(12).fill(0), Lt: Array(12).fill(0), Ms: Array(12).fill(0), C: Array(12).fill(0), venc: 0, mesFalta: 0, ok: 0, den: 0, tP: 0, tR: 0 };
  D.forEach(d => { for (let i = 0; i < 12; i++) ['P', 'R', 'Ok', 'Lt', 'Ms', 'C'].forEach(k => F[k][i] += d[k][i]); ['venc', 'mesFalta', 'ok', 'den', 'tP', 'tR'].forEach(k => F[k] += d[k]); });
  F.ad = F.den ? Math.round(F.ok / F.den * 100) : null;
  const mxF = Math.max(1, ...D.flatMap(d => sel.filter(i => i > hm).map(i => d.P[i])));
  const corAd = a => a == null ? '#5F6368' : a >= 90 ? '#188038' : a >= 75 ? '#B06000' : '#C5221F';
  const cel = (d, i, tot) => { let h = cel0(d, i, tot); const n = d.C[i]; if (n) h = h.replace('<span class="cf-z">—</span>', '').replace(/<\/td>$/, cfCorr(n) + '</td>');
    return !tot && i >= hm && d.P[i] ? h.replace('<td class="cf-c', `<td data-prmes="${d.v.id}|${i}" style="cursor:pointer" class="cf-c`).replace(/title="([^"]*)"/, 'title="$1 · clique para ver os serviços e programar"') : h; };
  const cel0 = (d, i, tot) => {
    const p = d.P[i], r = d.R[i], ms = d.Ms[i], lt = d.Lt[i];
    if (i === hm) { const pend = Math.max(0, p - r - ms), w = x => p ? Math.min(100, Math.round(x / p * 100)) : 0;
      return `<td class="cf-c cf-hj" title="${r} realizados · ${ms} vencidos · ${pend} ainda neste mês">${p ? `<span class="cf-fr"><b>${r}</b> / ${p}</span><span class="cf-bar"><i class="ok" style="width:${w(Math.min(r, p))}%"></i><i class="ms" style="width:${w(ms)}%"></i></span>` : '<span class="cf-z">—</span>'}</td>`; }
    if (i < hm) { if (!p && !r) return '<td class="cf-c"><span class="cf-z">—</span></td>';
      if (!p) return `<td class="cf-c" title="${r} realizados sem previsto aprovado no mês"><span class="cf-fr"><b>${r}</b> / —</span></td>`;
      const st = ms ? 'ms' : lt ? 'lt' : r >= p ? 'ok' : 'ms';
      return `<td class="cf-c" title="${r} realizados de ${p} · ${lt} com atraso · ${ms} não feitos"><span class="cf-fr ${st}"><b>${r}</b> / ${p}</span></td>`; }
    if (!p) return '<td class="cf-c"><span class="cf-z">—</span></td>';
    const a = tot ? 1 : Math.min(1, p / mxF);
    return `<td class="cf-c" title="${p} previstos"><span class="cf-cg" style="background:rgba(25,103,210,${(0.08 + a * 0.32).toFixed(2)})">${p}</span></td>`;
  };
  const sit = d => (d.venc ? `<span class="cf-p ms" title="ocorrências do cronograma vencidas nos meses marcados">${d.venc} vencida${d.venc > 1 ? 's' : ''}</span>` : '<span class="cf-p ok">em dia</span>') + (d.mesFalta ? `<small>${d.mesFalta} a vencer em ${MESES[hm]}</small>` : '');
  const linha = (d, tot) => `<tr class="${tot ? 'cf-tot' : ''}"><td class="cf-n">${tot ? `<b>Consolidado da frota</b><small class="fs-sm">${D.length} empurradores</small>` : `<a href="#cxr" data-prv="${d.v.id}">${esc(d.v.nome)}</a>`}</td>${sel.map(i => cel(d, i, tot)).join('')}
     <td class="cf-c cf-tt"><span class="cf-fr"><i class="cf-d" style="background:${d.venc ? '#C5221F' : '#188038'}"></i><b>${d.tR}</b> / ${d.tP}</span></td><td class="cf-s">${sit(d)}</td><td class="cf-a" style="color:${corAd(d.ad)}">${d.ad == null ? '—' : d.ad + '%'}</td></tr>`;
  const head = `<tr><th class="cf-n" data-ck="n">Empurrador</th>${sel.map(i => `<th class="${i === hm ? 'cf-hj' : ''}" data-ck="m${i}">${MESES[i].toUpperCase()}${i === hm ? ' · ATUAL' : ''}</th>`).join('')}<th data-ck="t">Total</th><th data-ck="s">Situação</th><th data-ck="a">Aderência</th></tr>`;
  return { html: `<table class="cf-t"><thead>${head}</thead><tbody>${D.map(d => linha(d)).join('')}${linha(F, true)}</tbody></table>`, F, hm, sel };
}
function prKpis(F, hm, ano, sel) {
  const todos = sel.length === 12, ult = sel[sel.length - 1], fimPer = new Date(ano, ult + 1, 0), dias = Math.ceil((fimPer - hoje()) / 864e5) + 1;
  const resta = Math.max(0, F.tP - F.tR), porDia = hm >= 0 && hm < 12 && ult >= hm && dias > 0 ? resta / dias : null;
  const mx = sel.reduce((a, i) => F.P[i] > F.P[a] ? i : a, sel[0]), pct = F.tP ? Math.round(F.P[mx] / F.tP * 100) : 0;
  const k = (v, t, c, tip) => `<span class="cf-k"${tip ? ` title="${esc(tip)}"` : ''}><b style="color:${c || 'inherit'}">${v}</b> ${t}</span>`;
  return `<div class="cf-ks">${k(F.venc, 'serviços preventivos não realizados dentro do prazo ' + (todos ? 'no decorrer do ano' : 'no período'), F.venc ? '#C5221F' : '#188038', 'serviços previstos cujo prazo passou sem execução, somados nos meses marcados')}${sel.includes(hm) ? k(F.mesFalta, 'a vencer em ' + MESES[hm], F.mesFalta ? '#B06000' : '#188038') : ''}${k(F.tR, 'de ' + F.tP + ' realizados', '', 'realizado dentro do previsto')}${k(F.ad == null ? '—' : F.ad + '%', 'aderência ao cronograma', F.ad == null ? '#5F6368' : F.ad >= 90 ? '#188038' : F.ad >= 75 ? '#B06000' : '#C5221F', 'feito no prazo ÷ o que já venceu')}${porDia != null ? k(nf(porDia, 1), 'serviços/dia necessários', porDia > 3 ? '#B06000' : '#188038', resta + ' serviços ainda por fazer até ' + brD(isoD(fimPer)) + ' em ' + dias + ' dias') : ''}${F.tP && sel.length > 1 ? k(pct + '%', (todos ? 'do ano' : 'do período') + ' em ' + PR_MESL[mx], pct >= 40 ? '#1967D2' : 'inherit', 'mês de maior carga prevista') : ''}</div>`;
}
function prGrafico(F, hm, sel, W = 900, H = 260) {   // carga e execução por mês: previsto (azul claro), realizado do previsto (verde), vencidos (vermelho) · desenhado na largura real do bloco
  const L = 34, R = 10, T = 16, B = 34, n = sel.length, bw = (W - L - R) / n, mx = Math.max(1, ...sel.map(i => Math.max(F.P[i], F.R[i]))), Y = v => T + (1 - v / mx) * (H - T - B);
  let s = '';
  for (let k = 0; k <= 4; k++) { const v = Math.round(mx * k / 4), y = Y(v); s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#EEF1F4"/><text x="${L - 6}" y="${y + 3}" font-size="10" text-anchor="end" fill="#5F6368">${v}</text>`; }
  if (PRV.gm === 'acum') return prGrafAcum(F, hm, sel, W, H);
  sel.forEach((i, k) => { const x0 = L + k * bw, w = Math.min(11, bw * 0.16), cx = x0 + bw / 2, p = F.P[i], r = Math.min(F.P[i], F.R[i]), ms = F.Ms[i];   // barras finas
    if (i === hm) s += `<rect x="${x0 + 2}" y="${T - 8}" width="${bw - 4}" height="${H - T - B + 10}" fill="#EEF3FD" rx="6"/>`;
    s += `<rect x="${cx - w - 1}" y="${Y(p)}" width="${w}" height="${H - B - Y(p)}" fill="#AECBFA" rx="3"><title>${PR_MESL[i]}: ${p} previstos</title></rect>`;
    s += `<rect x="${cx + 1}" y="${Y(r)}" width="${w}" height="${H - B - Y(r)}" fill="${i > hm ? '#CEEAD6' : '#188038'}" rx="3"><title>${PR_MESL[i]}: ${r} realizados do previsto${F.R[i] > r ? ' (+' + (F.R[i] - r) + ' fora do previsto)' : ''}</title></rect>`;
    if (p) s += `<text x="${cx - w / 2 - 1}" y="${Y(p) - 4}" font-size="10" text-anchor="middle" fill="#1967D2">${p}</text>`;
    if (r && i <= hm) s += `<text x="${cx + w / 2 + 1}" y="${Y(r) - 4}" font-size="10" text-anchor="middle" fill="#188038">${r}</text>`;
    if (ms) s += `<text x="${cx}" y="${H - B + 26}" font-size="10" text-anchor="middle" fill="#C5221F"><title>${ms} vencidos e não feitos</title>✗${ms}</text>`;
    s += `<text x="${cx}" y="${H - B + 14}" font-size="10.5" text-anchor="middle" fill="${i === hm ? '#1967D2' : '#5F6368'}" font-weight="${i === hm ? 700 : 400}">${MESES[i].toUpperCase()}</text>`; });
  return `<div class="cm-gw"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Carga e execução por mês">${s}</svg></div><p class="cf-lg"><i class="cg"></i>previsto · <i class="ok"></i>realizado do previsto · <span style="color:#C5221F">✗n</span> vencidos · passe o mouse nas barras para ver os valores</p>`;
}
function prGrafAcum(F, hm, sel, W = 900, H = 260) {   // curva acumulada (curva S): previsto acumulado × realizado acumulado; a distância entre as linhas é o atraso
  const L = 40, R = 18, T = 18, B = 30, n = sel.length;
  let ap = 0, ar = 0; const pts = sel.map(i => { ap += F.P[i]; if (i <= hm) ar += Math.min(F.P[i], F.R[i]); return { i, p: ap, r: i <= hm ? ar : null }; });
  const mx = Math.max(1, ap), X = k => n === 1 ? (L + W - R) / 2 : L + k * (W - L - R) / (n - 1), Y = v => T + (1 - v / mx) * (H - T - B);
  let s = '';
  for (let k = 0; k <= 4; k++) { const v = Math.round(mx * k / 4), y = Y(v); s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#EEF1F4"/><text x="${L - 6}" y="${y + 3}" font-size="10" text-anchor="end" fill="#5F6368">${v}</text>`; }
  pts.forEach((q, k) => { s += `<text x="${X(k)}" y="${H - 10}" font-size="10.5" text-anchor="middle" fill="${q.i === hm ? '#1967D2' : '#5F6368'}" font-weight="${q.i === hm ? 700 : 400}">${MESES[q.i].toUpperCase()}</text>`; });
  const kh = pts.findIndex(q => q.i === hm); if (kh >= 0) s += `<line x1="${X(kh)}" x2="${X(kh)}" y1="${T - 6}" y2="${H - B}" stroke="#1967D2" stroke-dasharray="3 3" opacity=".5"/><text x="${X(kh) + 4}" y="${T - 4}" font-size="10" fill="#1967D2">hoje</text>`;
  s += `<polyline fill="none" stroke="#8AB4F8" stroke-width="2" stroke-dasharray="6 4" points="${pts.map((q, k) => X(k) + ',' + Y(q.p)).join(' ')}"/>`;
  s += pts.map((q, k) => `<circle cx="${X(k)}" cy="${Y(q.p)}" r="3" fill="#fff" stroke="#8AB4F8" stroke-width="1.6"><title>${PR_MESL[q.i]}: ${q.p} previstos no acumulado</title></circle>`).join('');
  pts.forEach((q, k) => { if (q.r != null && q.r === q.p) return;   // previsto em azul onde difere do realizado (meses à frente ou com atraso)
    s += `<text x="${X(k)}" y="${Y(q.p) - 8}" font-size="10.5" font-weight="600" text-anchor="middle" fill="#1967D2" paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round">${q.p}</text>`; });
  const R2 = pts.map((q, k) => ({ q, k })).filter(o => o.q.r != null);
  if (R2.length) {
    const linha = R2.map(o => X(o.k) + ',' + Y(o.q.r)).join(' ');
    s += `<path d="M${X(R2[0].k)},${H - B} L${linha.replace(/ /g, ' L')} L${X(R2[R2.length - 1].k)},${H - B} Z" fill="rgba(24,128,56,.10)"/><polyline fill="none" stroke="#188038" stroke-width="2.4" points="${linha}"/>`;
    s += R2.map(o => `<circle cx="${X(o.k)}" cy="${Y(o.q.r)}" r="3.6" fill="#188038"><title>${PR_MESL[o.q.i]}: ${o.q.r} realizados no acumulado · atraso ${o.q.p - o.q.r}</title></circle>`).join('');
    const u = R2[R2.length - 1], gap = u.q.p - u.q.r;
    const ro = 'paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round"';   // número legível sobre as linhas
    s += R2.map(o => `<text x="${X(o.k)}" y="${o.q.p > o.q.r ? Y(o.q.r) + 15 : Y(o.q.r) - 8}" font-size="10.5" font-weight="600" text-anchor="middle" fill="#188038" ${ro}>${o.q.r}</text>`).join('');
    if (gap > 0) s += `<line x1="${X(u.k)}" x2="${X(u.k)}" y1="${Y(u.q.p)}" y2="${Y(u.q.r)}" stroke="#C5221F" stroke-width="1.5"/><text x="${X(u.k) + (u.k === n - 1 ? -6 : 6)}" y="${(Y(u.q.p) + Y(u.q.r)) / 2 + 3}" font-size="11" font-weight="600" text-anchor="${u.k === n - 1 ? 'end' : 'start'}" fill="#C5221F">atraso acumulado: ${gap}</text>`;
  }
  return `<div class="cm-gw"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Previsto acumulado × realizado acumulado">${s}</svg></div><p class="cf-lg"><span style="color:#5F8FE0">- - -</span> previsto acumulado · <span style="color:#188038">——</span> realizado acumulado (dentro do previsto) · <span style="color:#C5221F">vermelho</span> = atraso acumulado · número azul = previsto acumulado, verde = realizado acumulado</p>`;
}
function prTelaFrota(ativos, ano, nAp, anos) {
  const T = prFrotaV2(ano), sel = T.sel, todos = sel.length === 12, hm = T.hm; PRV._T = T;
  const chips = `<div class="cf-ms"><span>Meses</span><button data-cfm="todos" class="${todos ? 'on' : ''}">Ano todo</button>${hm >= 0 && hm < 12 ? `<button data-cfm="ate" class="${!todos && sel.length === hm + 1 && sel[0] === 0 ? 'on' : ''}">Até ${MESES[hm]}</button>` : ''}<i></i>${MESES.map((m, i) => `<button data-cfm="${i}" class="cf-mm${!todos && sel.includes(i) ? ' on' : ''}${i === hm ? ' hj' : ''}" title="Clique para marcar ou desmarcar · Shift+clique marca um intervalo">${m.toUpperCase()}</button>`).join('')}<small>${todos ? 'ano todo' : sel.length + (sel.length === 1 ? ' mês' : ' meses') + ' somados'}</small></div>`;
  return `<div class="cm-v"><div class="vh"><div><h1>Cronograma preventivo</h1></div><span class="sp"></span><button class="mbtn" data-cfreset title="Volta os blocos e as colunas ao padrão">Reorganizar</button></div>${prKpis(T.F, hm, ano, sel)}
   <div class="cf-bt"><a class="mbtn" href="#audit">Histórico e evidências</a><button class="mbtn" data-prpdf="resumo">PDF desta tela</button><button class="mbtn" data-prpdf="frota">PDF completo</button><button class="mbtn" data-prmural>Mural (1 folha)</button>${can.admin() ? `<button class="mbtn pri" data-prapr>${nAp ? 'Revisar aprovação' : 'Aprovar o previsto de ' + ano}</button>` : ''}</div>
   <div class="cf-fl"><label>Empurrador <select id="prV"><option value="frota" selected>Consolidado da frota</option>${ativos.map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select></label>
    <label>Ano <select id="prA">${anos.map(y => `<option${y === ano ? ' selected' : ''}>${y}</option>`).join('')}</select></label>
    <span class="cf-seg"><button data-prord="crit" class="${PRV.ord !== 'nome' ? 'on' : ''}">Criticidade</button><button data-prord="nome" class="${PRV.ord === 'nome' ? 'on' : ''}">Nome</button></span><span class="cf-p ${nAp === ativos.length ? 'ok' : 'lt'}">${nAp}/${ativos.length} aprovados</span></div>${chips}
   <div class="cm-ws">
    <div class="card cf-card"><div class="cf-hd"><b>Cronograma preventivo · previsto × realizado</b></div><div class="tw">${T.html}</div>
     <p class="cf-lg"><b>0 / 24</b> = realizado / previsto · <i class="ok"></i>feito · <i class="lt"></i>feito com atraso · <i class="ms"></i>vencido · <span class="cf-cor">+1 corr.</span> refeito em corretiva (não conta como realizado) · <i class="cg"></i>carga prevista · aderência "—" = nada venceu ainda · clique no nome para ver serviço por serviço · arraste a borda do cabeçalho para ajustar a largura da coluna</p></div>
   </div></div>`;
}
function prPopAbre(td) {   // cartão com os itens do Anexo I do serviço, ao lado do nome
  let pop = document.getElementById('cfPop'); if (!pop) { pop = document.createElement('div'); pop.id = 'cfPop'; pop.className = 'cf-pop'; document.body.appendChild(pop); }
  pop.innerHTML = (PRV._sv || [])[+td.dataset.cfsv] || ''; pop.dataset.i = td.dataset.cfsv; pop.hidden = false;
  const r = td.getBoundingClientRect(), w = Math.min(460, innerWidth - 16); pop.style.width = w + 'px';
  let x = r.right + 8; if (x + w > innerWidth - 8) x = Math.max(8, r.left); let y = r.top; pop.style.left = x + 'px'; pop.style.top = '0px';
  const h = pop.offsetHeight; if (x === Math.max(8, r.left) && r.right + 8 + w > innerWidth - 8) y = r.bottom + 6; if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8); pop.style.top = y + 'px';
}
function prPopFecha() { const p = document.getElementById('cfPop'); if (p) p.hidden = true; }
addEventListener('hashchange', () => prPopFecha()); addEventListener('scroll', () => prPopFecha(), { passive: true, capture: true });
function prColunas(chave) {   // largura das colunas da tabela ajustável à mão, salva neste aparelho
  const t = document.querySelector('#main table.cf-t'); if (!t) return;
  const LS = JLAY(chave), W = LS.G(), ths = [...t.tHead.rows[0].cells], nat = ths.map(th => Math.round(th.getBoundingClientRect().width));
  const fixa = cur => { t.style.tableLayout = 'fixed'; ths.forEach((th, j) => th.style.width = cur[j] + 'px'); t.style.width = cur.reduce((a, x) => a + x, 0) + 'px'; };
  if (Object.keys(W).length) fixa(ths.map((th, j) => W[th.dataset.ck] || nat[j]));
  ths.forEach((th, i) => { const h = document.createElement('span'); h.className = 'cf-cr'; h.title = 'Arraste para ajustar a largura · duplo clique volta ao automático'; th.appendChild(h);
    h.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const cur = ths.map(x => Math.round(x.getBoundingClientRect().width)); fixa(cur);
      const sx = e.clientX, ow = cur[i]; h.setPointerCapture(e.pointerId);
      const mv = ev => { cur[i] = Math.max(34, ow + ev.clientX - sx); fixa(cur); };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); ths.forEach((x, j) => W[x.dataset.ck] = cur[j]); LS.S(W); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); });
    h.addEventListener('dblclick', e => { e.stopPropagation(); delete W[th.dataset.ck]; LS.S(W); render(); }); });
}
// ---- detalhe do empurrador no mesmo padrão da frota: uma linha por serviço, agrupada por sistema › equipamento ----
{ const st = document.createElement('style'); st.textContent = `.cf-cor{display:inline-block;margin-left:4px;padding:0 6px;border-radius:9px;background:#F3E8FD;color:#7B1FA2;font-size:10.5px;font-weight:600;white-space:nowrap;vertical-align:middle}`; document.head.appendChild(st); }
const PR_CRIT = { 'Crítica': 'ms', 'Alta': 'lt', 'Média': 'md', 'Baixa': 'bx' };
function prEmpTabela(v, ano, hm, sel) {
  const G = prLinhas(v, ano), mxF = Math.max(1, ...G.flatMap(g => sel.filter(i => i > hm).map(i => g.base ? (g.base[i] || 0) : g.M[i].plan + g.M[i].miss + g.M[i].ok + g.M[i].late)));
  const ncol = sel.length + 3; let sisA = '', eqA = '', rows = ''; PRV._sv = [];
  G.forEach(g => {
    // conteúdo do serviço (itens do Anexo I do pacote), mostrado ao passar o mouse / tocar no nome
    const its = {}; g.its.forEach(x => { const o = its[x.t.id] = its[x.t.id] || { t: x.t, pos: new Set() }; if (x.pos && x.pos !== 'UN') o.pos.add(x.pos); });
    const nSv = PRV._sv.push(`<div class="cf-pop-h"><b>${esc(g.sv.nome)}</b><span>${esc(g.eq.n)} · ${esc(g.sv.freq)} · <span class="cf-cr2 ${PR_CRIT[g.crit] || 'bx'}">${esc(g.crit)}</span></span></div><ul>${Object.values(its).sort((a, b) => a.t.id.localeCompare(b.t.id, 'pt-BR', { numeric: true })).map(o => `<li><b>${esc(o.t.id)}</b> ${esc(o.t.item || '')}${o.t.chk ? ` — <span>${esc(o.t.chk)}</span>` : ''}${o.pos.size ? ` <em>(${[...o.pos].map(p => isMcp(p) ? (p === 'CE' ? 'central' : p) : posNome(v, p)).join(', ')})</em>` : ''}</li>`).join('')}</ul><small>${Object.keys(its).length} ${Object.keys(its).length === 1 ? 'item' : 'itens'} do Anexo I nesta parada</small>`) - 1;
    const s = SISTEMAS[g.sis - 1] || '', ke = s + '|' + g.eqKey;
    if (s !== sisA) { sisA = s; eqA = ''; rows += `<tr class="cf-gs"><td colspan="${ncol + 1}"><span class="cf-gl">${esc(s)}</span></td></tr>`; }
    if (ke !== eqA) { eqA = ke; rows += `<tr class="cf-ge"><td colspan="${ncol + 1}"><span class="cf-gl">${esc(g.eq.n)}${g.eq.m ? ` <small>${esc(g.eq.m)}</small>` : ''}</span></td></tr>`; }
    const P = g.M.map((m, i) => g.base ? (g.base[i] || 0) : m.plan + m.miss + m.ok + m.late), R = g.M.map(m => m.ok + m.late), Ms = g.M.map(m => m.miss), Lt = g.M.map(m => m.late);
    const tip = i => esc(g.M[i].tx.join('\n'));
    const cel = i => { const h = cel0(i), n = g.M[i].corr; return n ? h.replace('<span class="cf-z">—</span>', '').replace(/<\/td>$/, cfCorr(n) + '</td>') : h; };
    const cel0 = i => { const p = P[i], r = R[i], ms = Ms[i], lt = Lt[i];
      if (i === hm) { const w = x => p ? Math.min(100, Math.round(x / p * 100)) : 0;
        return `<td class="cf-c cf-hj" title="${tip(i) || (r + ' realizados · ' + ms + ' vencidos')}">${p || r ? `<span class="cf-fr ${ms ? 'ms' : r >= p && p ? 'ok' : ''}"><b>${r}</b> / ${p || '—'}</span>${p ? `<span class="cf-bar"><i class="ok" style="width:${w(Math.min(r, p))}%"></i><i class="ms" style="width:${w(ms)}%"></i></span>` : ''}` : '<span class="cf-z">—</span>'}</td>`; }
      if (i < hm) { if (!p && !r) return '<td class="cf-c"><span class="cf-z">—</span></td>';
        const st = ms ? 'ms' : lt ? 'lt' : r >= p ? 'ok' : 'ms';
        return `<td class="cf-c" title="${tip(i)}"><span class="cf-fr ${p ? st : ''}"><b>${r}</b> / ${p || '—'}</span></td>`; }
      if (!p) return '<td class="cf-c"><span class="cf-z">—</span></td>';
      return `<td class="cf-c" title="${p} previsto(s)"><span class="cf-cg" style="background:rgba(25,103,210,${(0.08 + Math.min(1, p / mxF) * 0.32).toFixed(2)})">${p}</span></td>`; };
    const tP = sel.reduce((a, i) => a + P[i], 0), tR = sel.reduce((a, i) => a + Math.min(P[i], R[i]), 0), venc = sel.reduce((a, i) => a + Ms[i], 0), falta = sel.includes(hm) ? Math.max(0, P[hm] - R[hm] - Ms[hm]) : 0;
    const sit = venc ? `<span class="cf-p ms" title="ocorrências do cronograma vencidas nos meses marcados">${venc} vencida${venc > 1 ? 's' : ''}</span>` : tP ? '<span class="cf-p ok">em dia</span>' : '<span class="cf-z">—</span>';
    rows += `<tr><td class="cf-n cf-sv" data-cfsv="${nSv}"><b>${esc(g.sv.nome)}</b><small>${esc(g.sv.freq)} · <span class="cf-cr2 ${PR_CRIT[g.crit] || 'bx'}">${esc(g.crit)}</span></small></td>${sel.map(cel).join('')}
      <td class="cf-c cf-tt"><span class="cf-fr">${tP ? `<i class="cf-d" style="background:${venc ? '#C5221F' : '#188038'}"></i>` : ''}<b>${tR}</b> / ${tP}</span></td><td class="cf-s">${sit}${falta ? `<small>${falta} a vencer em ${MESES[hm]}</small>` : ''}</td></tr>`; });
  const head = `<tr><th class="cf-n" data-ck="n">Serviço</th>${sel.map(i => `<th class="${i === hm ? 'cf-hj' : ''}" data-ck="m${i}">${MESES[i].toUpperCase()}${i === hm ? ' · ATUAL' : ''}</th>`).join('')}<th data-ck="t">Total</th><th data-ck="s">Situação</th></tr>`;
  return `<table class="cf-t cf-emp"><thead>${head}</thead><tbody>${rows || `<tr><td colspan="${ncol + 1}">Sem serviços no plano.</td></tr>`}</tbody></table>`;
}
function prTelaEmp(v, ativos, ano, B, anos) {
  const hm = hoje().getFullYear() === ano ? hoje().getMonth() : ano < hoje().getFullYear() ? 12 : -1, sel = prMesesSel(), F = prResumo(v, ano, hm, sel), todos = sel.length === 12;
  PRV._T = { F, hm, sel };
  const chips = `<div class="cf-ms"><span>Meses</span><button data-cfm="todos" class="${todos ? 'on' : ''}">Ano todo</button>${hm >= 0 && hm < 12 ? `<button data-cfm="ate" class="${!todos && sel.length === hm + 1 && sel[0] === 0 ? 'on' : ''}">Até ${MESES[hm]}</button>` : ''}<i></i>${MESES.map((m, i) => `<button data-cfm="${i}" class="cf-mm${!todos && sel.includes(i) ? ' on' : ''}${i === hm ? ' hj' : ''}" title="Clique para marcar ou desmarcar · Shift+clique marca um intervalo">${m.toUpperCase()}</button>`).join('')}<small>${todos ? 'ano todo' : sel.length + (sel.length === 1 ? ' mês' : ' meses') + ' somados'}</small></div>`;
  return `<div class="cm-v"><div class="vh"><div><h1>Cronograma · ${esc(v.nome)}</h1></div><span class="sp"></span><a class="mbtn" href="#cxr" data-prv="frota">← Consolidado da frota</a><a class="mbtn" href="#rotina">Situação de hoje</a><a class="mbtn" href="#crono" data-prit="${v.id}">Item por item (Anexo I)</a><button class="mbtn" data-cfreset title="Volta os blocos e as colunas ao padrão">Reorganizar</button></div>${prKpis(F, hm, ano, sel)}
   <div class="cf-bt"><a class="mbtn" href="#audit">Histórico e evidências</a><button class="mbtn" data-prpdf="um">PDF desta tela</button><button class="mbtn" data-prpdf="frota">PDF completo</button><button class="mbtn" data-prmural>Mural (1 folha)</button>${can.admin() ? `<button class="mbtn pri" data-prapr>${B ? 'Revisar aprovação da frota' : 'Aprovar o previsto de ' + ano + ' (frota)'}</button>` : ''}</div>
   <div class="cf-fl"><label>Empurrador <select id="prV"><option value="frota">Consolidado da frota</option>${ativos.map(a => `<option value="${a.id}"${a.id === v.id ? ' selected' : ''}>${esc(a.nome)}</option>`).join('')}</select></label>
    <label>Ano <select id="prA">${anos.map(y => `<option${y === ano ? ' selected' : ''}>${y}</option>`).join('')}</select></label>
    ${B ? `<span class="cf-p ok">Previsto aprovado · ${esc(B.aprovBy)} · ${brD(B.aprovAt)} · rev. ${B.rev}</span>` : '<span class="cf-p lt">Previsto ainda não aprovado</span>'}</div>${chips}
   <div class="cm-ws">
    <div class="card cf-card"><div class="cf-hd"><b>Cronograma preventivo · previsto × realizado · ${esc(v.nome)}</b></div><div class="tw">${prEmpTabela(v, ano, hm, sel)}</div>
     <p class="cf-lg"><b>0 / 2</b> = realizado / previsto no mês · <i class="ok"></i>feito · <i class="lt"></i>feito com atraso · <i class="ms"></i>vencido · <span class="cf-cor">+1 corr.</span> refeito em corretiva (não conta como realizado) · <i class="cg"></i>carga prevista · passe o mouse na célula para ver a OM ou o FR 049_B · o PDF sai no formato oficial (P e R)</p></div>
   </div></div>`;
}
function vPR() {
  const ativos = S.cfg.frota.filter(v => !foraOp(v)); if (PRV.v !== 'frota' && !ativos.some(v => v.id === PRV.v)) PRV.v = 'frota';
  const v = PRV.v === 'frota' ? null : vessel(PRV.v), ano = +PRV.ano, B = v && cronoBase(ano, v.id), nAp = ativos.filter(a => cronoBase(ano, a.id)).length;
  const anos = [hoje().getFullYear() - 1, hoje().getFullYear(), hoje().getFullYear() + 1];
  const t = document.createElement('div');
  t.innerHTML = !v ? prTelaFrota(ativos, ano, nAp, anos)   // frota toda: uma linha por empurrador
    : prTelaEmp(v, ativos, ano, B, anos);                   // um empurrador: uma linha por serviço (o PDF continua no formato P/R)
  /* acabamento (antes era uma camada à parte): subtítulo, Resumo como primeiro bloco e "Empurrador" no lugar de "Empurrador" */
  const vh = t.querySelector('.vh'), ws = t.querySelector('.cm-ws'); if (!vh || !ws) return t.innerHTML;
  const d = vh.querySelector(':scope > div'); if (d && !d.querySelector('p')) d.insertAdjacentHTML('beforeend', '<p>Previsto × realizado por empurrador e mês · plano do Anexo I da NP 055</p>');
  const ks = t.querySelector('.cf-ks'); if (ks) { ks.remove(); ws.insertAdjacentHTML('afterbegin', `<div class="card cf-card"><h2>Resumo</h2>${ks.outerHTML}</div>`); }
  t.querySelectorAll('label, th').forEach(x => x.childNodes.forEach(n => { if (n.nodeType === 3 && /Embarcação/.test(n.textContent)) n.textContent = n.textContent.replace('Embarcação', 'Empurrador'); }));
  return t.innerHTML;
}
VX.cxr = vPR;
AFTER.cxr = function () { const m = $('#main');
  m.onchange = e => { if (e.target.id === 'prV') { PRV.v = e.target.value; render(); } if (e.target.id === 'prA') { PRV.ano = +e.target.value; render(); } };
  m.onclick = async e => { const o = e.target.closest('[data-prord]'); if (o) { PRV.ord = o.dataset.prord; render(); return; }
    const gm = e.target.closest('[data-cfg]'); if (gm) { PRV.gm = gm.dataset.cfg; try { localStorage.setItem('smf_cf_gm', PRV.gm); } catch (er) { } render(); return; }
    const sv = e.target.closest('[data-cfsv]'); if (sv) { const pop = document.getElementById('cfPop'); if (pop && !pop.hidden && pop.dataset.i === sv.dataset.cfsv) prPopFecha(); else prPopAbre(sv); return; }
    const mb = e.target.closest('[data-cfm]'); if (mb) { const k = mb.dataset.cfm, hm = hoje().getMonth();
      if (k === 'todos') PRV.ms = null; else if (k === 'ate') PRV.ms = Array.from({ length: hm + 1 }, (_, i) => i);
      else { const i = +k, cur = new Set(PRV.ms || []);
        if (e.shiftKey && PRV.ultMes != null) { const a = Math.min(PRV.ultMes, i), b = Math.max(PRV.ultMes, i); for (let j = a; j <= b; j++) cur.add(j); }
        else cur.has(i) ? cur.delete(i) : cur.add(i);
        PRV.ultMes = i; PRV.ms = cur.size && cur.size < 12 ? [...cur] : null; }
      render(); return; }
     const it = e.target.closest('[data-prit]'); if (it) { CRV.v = it.dataset.prit; return; } const a = e.target.closest('[data-prv]'); if (a) { e.preventDefault(); PRV.v = a.dataset.prv; render(); window.scrollTo(0, 0); return; } const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-prmural')) { modal(`<h2>Mural · cronograma numa folha só</h2><p class="note">Gera um arquivo PDF já no tamanho do papel (paisagem), com o cronograma ocupando a folha inteira. Imprima o arquivo em “Tamanho real” no mesmo papel, ou leve à gráfica.</p><div class="g"><label class="f s3">Conteúdo<select id="mCont"><option value="resumo">Resumo da frota · empurrador × mês (legível no mural)</option><option value="completo">Completo · todos os serviços de cada empurrador (letra pequena)</option></select></label></div><div class="row" style="gap:8px;margin-top:8px">${['A3', 'A2', 'A1'].map(x => `<button class="mbtn pri" data-mpap="${x}">${x}</button>`).join('')}<span class="sp"></span><button class="mbtn" data-close>Cancelar</button></div>`);
      $('#modal').addEventListener('click', ev => { const x = ev.target.closest('[data-mpap]'); if (!x) return; const c = $('#mCont').value; closeModal(); muralPDF(+PRV.ano, c === 'completo', x.dataset.mpap); }); return; }
    if (b.dataset.prpdf) { const all = S.cfg.frota.filter(v => !foraOp(v)); return prPDF(b.dataset.prpdf === 'um' ? [vessel(PRV.v)] : b.dataset.prpdf === 'resumo' ? [] : all, +PRV.ano, b.dataset.prpdf !== 'um'); }
    if ('prapr' in b.dataset) { if (!precisa(true)) return; b.disabled = true; await prAprovar(S.cfg.frota.filter(v => !foraOp(v)), +PRV.ano); toast('Previsto de ' + PRV.ano + ' aprovado para a frota.'); render(); } };
  if (!document.querySelector('#main .cm-ws')) return;
  janelasLivres(document.querySelector('#main .cm-ws'), 'smf_cf_lay', '[data-cfreset]');
  const rb = document.querySelector('[data-cfreset]'); if (rb) { const r0 = rb.onclick; rb.onclick = e => { JLAY('smf_cf_cols').S({}); JLAY('smf_cfd_cols').S({}); r0(e); }; }
  prColunas(PRV.v === 'frota' ? 'smf_cf_cols' : 'smf_cfd_cols');
  prPopFecha(); if (matchMedia('(hover: hover)').matches) { m.onmouseover = e => { const sv = e.target.closest('[data-cfsv]'); if (sv) prPopAbre(sv); }; m.onmouseout = e => { const sv = e.target.closest('[data-cfsv]'); if (sv && !sv.contains(e.relatedTarget)) prPopFecha(); }; }
  // gráfico na largura real do bloco (texto sempre do mesmo tamanho); redesenha quando o bloco muda de tamanho
  const gb = document.getElementById('cfGraf'); if (gb && PRV._T) { const T = PRV._T, card = gb.closest('.card');
    const draw = () => { const w = Math.max(320, gb.clientWidth - 24), h = card.style.height ? Math.max(180, card.clientHeight - 110) : 260; gb.innerHTML = prGrafico(T.F, T.hm, T.sel, w, h); };
    draw(); let t0; new ResizeObserver(() => { clearTimeout(t0); t0 = setTimeout(() => { if (gb.isConnected) draw(); }, 150); }).observe(card); } 
};
function prPDF(vs, ano, resumo) {
  const css = [...document.querySelectorAll('style')].map(x => x.textContent).filter(x => x.includes('.pr-t{')).join('\n');
  const pg = vs.map((v, i0) => { const i = i0 + (resumo ? 1 : 0); const B = cronoBase(ano, v.id); return `<section${i ? ' style="page-break-before:always"' : ''}>${docCab(`CRONOGRAMA DE MANUTENÇÃO PREVENTIVA · PREVISTO × REALIZADO · ${ano}`, `<b>${esc(v.nome)}</b> · ${B ? 'previsto aprovado por ' + esc(B.aprovBy) + ' em ' + brD(B.aprovAt) + ' (rev. ' + B.rev + ')' : 'previsto não aprovado'} · emitido em ${hoje().toLocaleDateString('pt-BR')}`, 'NP Navecunha 055 · item 7.3 · plano: Anexo I')}
   <p class="lg"><b>P</b> previsto · <b>R</b> realizado: <span style="color:#188038">✓ no prazo</span> · <span style="color:#B06000">✓ com atraso</span> · <span style="color:#C5221F">✗ venceu e não foi feito</span> · número = quantidade no mês</p>${prTabela(v, ano, true)}
   <div class="ass"><div>Supervisor de Manutenção</div><div>Data</div></div></section>`; }).join('');
  const capa = resumo ? `<section>${docCab(`CRONOGRAMA DE MANUTENÇÃO PREVENTIVA · PREVISTO × REALIZADO · ${ano}`, `Frota de empurradores · emitido em ${hoje().toLocaleDateString('pt-BR')}`, 'NP Navecunha 055 · item 7.3 · plano: Anexo I')}<p class="lg">P previsto · R realizado (quantidade de serviços no mês) · ✗ = venceram e não foram feitos</p>${prFrota(ano, true)}<div class="ass"><div>Supervisor de Manutenção</div><div>Data</div></div></section>` : '';
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para gerar o PDF.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Previsto x realizado ${ano}</title><style>${css}${DOC_CAB_CSS}
   @page{size:A4 landscape;margin:7mm}body{margin:0;font-family:Arial,sans-serif}.hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #16244A;padding-bottom:5px;margin-bottom:5px}.hd img{height:32px}.hd h1{font-size:14px;margin:0;color:#16244A}.hd p{margin:2px 0 0;font-size:10px;color:#3C4043}.lg{font-size:9.5px;margin:3px 0 5px}
   .pr-t{font-size:8.3px}.pr-t th{position:static}.pr-c{height:13px}.ass{display:flex;gap:80px;margin-top:18px}.ass div{flex:1;border-top:1px solid #000;padding-top:3px;text-align:center;font-size:10px}tr{page-break-inside:avoid}thead{display:table-header-group}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${capa}${pg}<script>setTimeout(function(){window.print()},600)<\/script></body></html>`); w.document.close();
}
/* mural: o cronograma numa folha só, em arquivo PDF já no tamanho do papel (A3, A2 ou A1 paisagem) — a impressora do navegador usaria o papel dela */
async function muralPDF(ano, completo, papel) {
  await carregarLibsPdf().catch(() => { }); if (!window.jspdf || !window.html2canvas) return toast('Bibliotecas de PDF não carregaram (sem internet?).');
  const P = { A3: [420, 297], A2: [594, 420], A1: [841, 594] }[papel], M = 8, PW = P[0] - 2 * M, PH = P[1] - 2 * M, vs = completo ? S.cfg.frota.filter(v => !foraOp(v)) : [];
  const hd = (tit, sub) => `<div class="mu-hd"><img src="${LOGOS.nav}" alt=""><img src="${LOGOS.vda}" alt=""><div><h1>${tit}</h1><p>${sub}</p></div></div>`;
  const sec = [`<section class="mu-s mu-cap">${hd('Cronograma de manutenção preventiva · previsto × realizado · ' + ano + ' · frota', 'Plano: Anexo I da NP Navecunha 055 · emitido em ' + hoje().toLocaleDateString('pt-BR') + ' pelo SMF')}<p class="mu-lg">P previsto · R realizado (quantidade de serviços no mês) · ✗ = venceram e não foram feitos</p>${prFrota(ano, true)}<div class="mu-ass"><div>Supervisor de Manutenção</div><div>Data</div></div></section>`]
    .concat(vs.map(v => `<section class="mu-s">${hd(esc(v.nome), 'serviço por serviço · ' + ano)}${prTabela(v, ano, true)}</section>`));
  const D = document.createElement('div'); D.id = 'mural'; D.style.cssText = 'position:absolute;left:0;top:0;z-index:-1;background:#fff';   // atrás da tela: o html2canvas não desenha o que está fora dela
  D.innerHTML = `<style>#mural{font-family:Arial,sans-serif;color:#202124}#mural .mu-g{display:grid;gap:16px;align-items:start;padding:4px}#mural .mu-cap{grid-column:1/-1}#mural .mu-hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #16244A;padding-bottom:5px;margin-bottom:5px}#mural .mu-hd img{height:32px}#mural h1{font-size:15px;margin:0;color:#16244A}#mural .mu-hd p{margin:2px 0 0;font-size:10px;color:#3C4043}#mural .mu-lg{font-size:10px;margin:3px 0 5px}#mural .pr-t{font-size:9px}#mural .pr-t th{position:static}#mural .mu-ass{display:flex;gap:80px;margin-top:16px}#mural .mu-ass div{flex:1;border-top:1px solid #000;padding-top:3px;text-align:center;font-size:10px}</style><div class="mu-g">${sec.join('')}</div>`;
  document.body.appendChild(D); const G = D.querySelector('.mu-g'), C = 1100;
  await Promise.all([...D.querySelectorAll('img')].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
  let best = null;   // nº de colunas que deixa a escala maior (aproveita melhor a folha)
  for (let k = 1; k <= (vs.length ? 6 : 1); k++) { G.style.gridTemplateColumns = `repeat(${k},${C}px)`; G.style.width = (k * C + (k - 1) * 16 + 8) + 'px'; const w = G.offsetWidth, h = G.offsetHeight, s = Math.min(PW / w, PH / h); if (!best || s > best.s) best = { k, s, w, h }; }
  G.style.gridTemplateColumns = `repeat(${best.k},${C}px)`; G.style.width = (best.k * C + (best.k - 1) * 16 + 8) + 'px'; const w = G.offsetWidth, h = G.offsetHeight;
  const mmLetra = (9 * Math.min(PW / w, PH / h)).toFixed(1);   // 9 px da tabela × mm por px
  const esc2 = Math.min(6, Math.max(1, (PW / 25.4 * 200) / w), 15000 / Math.max(w, h));   // ~200 dpi no papel, sem passar do limite do navegador
  try { const cv = await html2canvas(G, { scale: esc2, backgroundColor: '#ffffff', useCORS: true, logging: false, x: 0, y: 0, scrollX: 0, scrollY: 0, width: w, height: h, windowWidth: w + 40, windowHeight: h + 40 });
    const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: papel.toLowerCase(), compress: true }), r = Math.min(PW / w, PH / h), lw = w * r, lh = h * r;
    pdf.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', M + (PW - lw) / 2, M + (PH - lh) / 2, lw, lh);
    pdf.save(`Cronograma_mural_${completo ? 'completo' : 'resumo'}_${ano}_${papel}.pdf`);
    toast(`PDF ${papel} gerado · letra da tabela com cerca de ${mmLetra} mm${mmLetra < 2 ? ' (pequena para o mural: use papel maior ou o resumo)' : ''}. Imprima em ${papel} com "Tamanho real".`, 7000);
  } catch (e) { toast('Não consegui gerar o PDF: ' + e.message); } finally { D.remove(); }
}
async function prAprovar(vs, ano) {   // congela o previsto (linha de base) de cada serviço, além do resumo por equipamento
  for (const v of vs) { const L = prLinhas(v, ano), id = 'crono-' + ano + '-' + v.id, B0 = S.recs.get(id), linhasPR = {}, linhasEq = {};
    L.forEach(g => { const pv = g.M.map(m => m.plan + m.miss + m.ok + m.late); linhasPR[g.k] = pv; linhasEq[g.eqKey] = (linhasEq[g.eqKey] || Array(12).fill(0)).map((x, i) => x + pv[i]); });
    await saveRec({ id, kind: 'crono', ano, vessel: v.id, rev: B0 ? (B0.rev || 0) + 1 : 0, aprovBy: S.session.name, aprovAt: isoD(hoje()), linhasPR, linhasEq }); }
}
var cr3Aprovar = prAprovar;
{ const st = document.createElement('style'); st.textContent = `.cf-ks{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px}.cf-k{border:1px solid #DADCE0;background:#fff;border-radius:999px;padding:3px 11px;font-size:12.5px;color:#5F6368}.cf-k b{font-size:14px;font-weight:600}
 .cf-bt{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.cf-fl{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 6px;font-size:12.5px;color:#5F6368}.cf-fl select{width:auto;min-width:0;font-size:12.5px;padding:3px 6px;margin-left:4px}
 .cf-seg{display:inline-flex;background:#F1F3F4;border-radius:7px;padding:2px}.cf-seg button{border:0;background:transparent;padding:3px 10px;border-radius:5px;cursor:pointer;font:inherit;color:#5F6368}.cf-seg button.on{background:#fff;color:#202124;box-shadow:0 1px 2px rgba(0,0,0,.12)}
 .cf-ms{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:0 0 10px;font-size:12.5px;color:#5F6368}.cf-ms>span{margin-right:4px}.cf-ms i{width:1px;height:18px;background:#DADCE0;margin:0 4px}.cf-ms button{border:1px solid #DADCE0;background:#fff;border-radius:14px;padding:2px 9px;font:inherit;font-size:12px;cursor:pointer;color:#3C4043}.cf-ms button.on{background:#E8F0FE;border-color:#1967D2;color:#1967D2;font-weight:600}.cf-ms button.hj{box-shadow:inset 0 -2px 0 #1967D2}.cf-ms small{margin-left:6px;color:#9AA0A6}
 #main .card.cf-card{padding:0!important;overflow:auto;display:flex;flex-direction:column}#main .card.cf-card>.cm-rz{margin:-16px 0 0 auto}#main .card.cf-card .tw{overflow-x:auto}.cf-hd{display:flex;align-items:center;gap:10px;padding:9px 96px 6px 14px;cursor:grab}.cf-hd b{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#3C4043}
 .cf-t{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px;font-variant-numeric:tabular-nums}.cf-t th{position:relative;font-size:10.5px;letter-spacing:.06em;color:#5F6368;font-weight:600;text-align:center;padding:6px 4px;border-top:1px solid #E3E8EF;border-bottom:1px solid #E3E8EF;background:#F8F9FA;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cf-t th.cf-n{text-align:left;padding-left:14px}
 .cf-t th.cf-hj{color:#1967D2;box-shadow:inset 0 3px 0 #1967D2;background:#EEF3FD}.cf-t td{border-bottom:1px solid #EEF1F4;padding:5px 4px;text-align:center;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .cf-t .cf-n{position:sticky;left:0;z-index:2;background:#fff;box-shadow:inset -1px 0 0 #EEF1F4}.cf-t th.cf-n{background:#F8F9FA;z-index:3}.cf-t td.cf-n{text-align:left;padding-left:14px;font-weight:500}.cf-t td.cf-n a{color:inherit;text-decoration:none}.cf-t td.cf-n a:hover{text-decoration:underline;color:#1967D2}
 .cf-t td.cf-hj{background:#F5F8FE;min-width:84px}.cf-fr{font-size:12px;color:#5F6368}.cf-fr b{color:#202124;font-weight:600}.cf-fr.ok b{color:#188038}.cf-fr.lt b{color:#B06000}.cf-fr.ms b{color:#C5221F}.cf-z{color:#C4C9D0}
 .cf-bar{display:flex;height:4px;background:#E3E8EF;border-radius:2px;margin:3px auto 0;width:64px;max-width:100%;overflow:hidden}.cf-bar i{display:block;height:100%}.cf-bar i.ok{background:#188038}.cf-bar i.ms{background:#D93025}
 .cf-cg{display:inline-block;min-width:24px;padding:1px 6px;border-radius:5px;font-size:12px;color:#174EA6;font-weight:600}.cf-d{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:1px}
 .cf-s{text-align:left!important;padding-left:10px!important}.cf-s small{display:block;color:#5F6368;font-size:11px;margin-top:1px}.cf-p{display:inline-block;font-size:11.5px;font-weight:600;border-radius:999px;padding:1px 9px}.cf-p.ms{background:#FCE8E6;color:#C5221F}.cf-p.ok{background:#E6F4EA;color:#188038}.cf-p.lt{background:#FEF3E0;color:#B06000}.cf-a{font-weight:600}
 .cf-t tr.cf-tot td{background:#F8F9FA;border-top:1px solid #DADCE0;border-bottom:0}.cf-t tr.cf-tot td.cf-n{background:#F8F9FA;font-weight:600}
 .cf-gs td{background:#EEF3FD;color:#174EA6;font-weight:700;font-size:12px;text-align:left!important;padding:5px 14px!important;border-top:1px solid #D2E3FC}.cf-ge td{background:#F8F9FA;font-weight:600;font-size:12px;text-align:left!important;padding:4px 14px!important;color:#202124}.cf-ge small{font-weight:400;color:#5F6368;margin-left:6px}.cf-gl{position:sticky;left:14px} .cf-pop{position:fixed;z-index:10000;background:#fff;border:1px solid #DADCE0;border-radius:10px;box-shadow:0 10px 30px rgba(32,33,36,.18);padding:10px 14px;font-size:12.5px;color:#202124;max-height:70vh;overflow:auto;pointer-events:none}.cf-pop[hidden]{display:none}.cf-pop-h{display:flex;flex-direction:column;gap:2px;margin-bottom:6px}.cf-pop-h b{font-size:14px}.cf-pop-h>span{color:#5F6368;font-size:12px}.cf-pop ul{margin:0;padding-left:16px;display:flex;flex-direction:column;gap:3px}.cf-pop li span{color:#3C4043}.cf-pop li em{color:#5F6368;font-style:normal}.cf-pop small{display:block;margin-top:6px;color:#9AA0A6}.cf-emp td.cf-sv{cursor:help}
 .cf-emp td.cf-sv{white-space:normal;min-width:190px;max-width:280px;text-align:left;padding-left:14px}.cf-sv b{font-weight:600;font-size:12.5px}.cf-sv small{display:block;color:#5F6368;font-size:11px;margin-top:1px}.cf-cr2{font-weight:600}.cf-cr2.ms{color:#C5221F}.cf-cr2.lt{color:#B06000}.cf-cr2.md{color:#1967D2}.cf-cr2.bx{color:#5F6368}
 .cf-cr{position:absolute;top:0;right:0;width:7px;height:100%;cursor:col-resize;touch-action:none;z-index:4}.cf-cr:hover,.cf-cr:active{background:rgba(25,103,210,.35)}
 .cf-lg{font-size:11.5px;color:#5F6368;padding:6px 14px 8px;margin:0}.cf-lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 8px;vertical-align:-1px}.cf-lg i.ok{background:#188038}.cf-lg i.lt{background:#E37400}.cf-lg i.ms{background:#D93025}.cf-lg i.cg{background:rgba(25,103,210,.3)}`; document.head.appendChild(st); }
{ const s = SECOES.find(x => x.id === 'crono'); if (s) { s.views = [['cxr', 'Previsto × realizado']]; s.extra = ['crono', 'audit']; } }
['cxr'].forEach(k => { const i = LAY_VIEWS.indexOf(k); if (i >= 0) LAY_VIEWS.splice(i, 1); });
{ const st = document.createElement('style'); st.textContent = `
 .pr-t{width:100%;border-collapse:collapse;table-layout:fixed;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000}
 .pr-t th{background:#16244A;color:#fff;border:1px solid #16244A;padding:5px 2px;font-weight:700;text-align:center;position:sticky;top:0;z-index:1}.pr-t th.hj{background:#1967D2}
 .pr-t td{border:1px solid #BDC1C6;padding:2px 4px;vertical-align:middle}.pr-ms,.pr-me{font-weight:700;vertical-align:top!important;padding-top:6px!important;border-color:#5F6368!important;background:#fff}.pr-me small{display:block;font-weight:400;color:#5F6368;font-size:10.5px}
 .pr-sv b{display:block;font-weight:600}.pr-sv small{color:#5F6368;font-size:10.5px}.pr-f{text-align:center;font-size:11px}.pr-l{text-align:center;font-weight:700;font-size:11px;color:#3C4043;background:#F8F9FA}
 .pr-c{text-align:center;font-weight:700;height:20px}.pr-c.p{color:#5F6368;background:#F1F3F4}.pr-c.r.ok{background:#E6F4EA;color:#188038}.pr-c.r.late{background:#FEF3E0;color:#B06000}.pr-c.r.miss{background:#FCE8E6;color:#C5221F}
 .pr-t td.pr-t{text-align:center;font-weight:700;background:#F8F9FA}.pr-tot td{background:#E8F0FE;font-weight:600}.pr-fa small{display:block;color:#5F6368;font-size:11px}.pr-fa,.pr-ad{text-align:center;background:#fff}.pr-c small{color:#C5221F;font-weight:700}.pr-gs td{background:#16244A;color:#fff;font-weight:700}.pr-ge td{background:#E8F0FE;font-weight:700}.pr-tot td:first-child{text-align:right}
 
 @media print{@page{size:A4 landscape;margin:7mm}#nav,.side,aside,.vh,.card.row,.banner,.tabs{display:none!important}.pr-t{font-size:8.5px}.pr-t th{position:static}tr{page-break-inside:avoid}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`; document.head.appendChild(st); }

