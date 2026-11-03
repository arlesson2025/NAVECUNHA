/* =====================================================================
   1.3 VIAGENS E COMBOIOS (SMF 3.121, 01/11/2026; pedido do Supervisor: “como vou saber no SMF a última reforma de cada
   embarcação, quantas viagens fez no ano, quanto tempo ficou parado no porto, como está cada balsa e empurrador, quantos
   comboios e tempo de viagem”; prévia aprovada em 01/11/2026: “concordo com tudo”).
   · Viagem = registro de saída (kind 'saida', agora com balsas = ids das balsas do comboio) ou histórico colado
     (snap tipo 'viagem': vessel, date, rota, balsas, cheg, fonte). Chegada: cheg digitada, senão o 1º FR 027_L de chegada
     depois da saída e antes da saída seguinte; sem ela a chegada é ESTIMADA pela rota (ciclo da ROTAS0, até a saída seguinte).
   · Reforma = snap tipo 'reforma' (vessel, ini, fim, local, obs); sem fim = em reforma hoje. Empurrador marcado
     “Em reforma” em Administração (foraOp) também conta como em reforma. Balsa em reforma sai das contas (balEstado → 'ref').
   · Tela: resumo · operação por embarcação (empurradores | balsas) · linha do tempo · comboios por mês (barras de 16 px,
     como os gráficos do SMF, o mais juntas possível) · % do ano em viagem · tempo por rota · saídas · reformas · colar histórico.
   Tudo em snap e saida (o servidor já aceita): sem mudança no Code.gs.
   ===================================================================== */
'use strict';
const VG = { ano: null, modo: 'E', fe: '', fb: '', fr: '' };
const VG_COR = { pvh: '#378ADD', ita: '#7F77DD', bre: '#D85A30', vdc: '#1D9E75', mun: '#1D9E75', vlp: '#1D9E75', bip: '#BA7517', bpv: '#BA7517', bma: '#BA7517' };
const VG_GR = [['MAO × ITC × PVH', '#378ADD', ['pvh']], ['Vila do Conde', '#1D9E75', ['vdc', 'mun', 'vlp']], ['MAO × BRE × MAO', '#D85A30', ['bre']], ['MAO × ITC × MAO', '#7F77DD', ['ita']], ['Barcarena', '#BA7517', ['bip', 'bpv', 'bma']]];
const VG_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const vgRota = id => rotas().find(r => r.id === id) || null;
const vgRotaCurta = id => { const r = vgRota(id); return r ? r.nome.replace(/Manaus/g, 'MAO').replace(/Itacoatiara/g, 'ITC').replace(/Porto Velho/g, 'PVH').replace(/Vila do Conde/g, 'VLC').replace(/Bretaña \(Peru, via Iquitos\)/g, 'BRE').replace(/Barcarena/g, 'BAR') : (id || 'rota não informada'); };
const vgBalsas = () => typeof BALSAS !== 'undefined' ? BALSAS : [];
// ---------- reformas ----------
// reformas: lançadas no Histórico dos equipamentos (snap 'evento', equipamento UN, tipo ref/parc; SMF 3.132) + as antigas da 1.3 (snap 'reforma') até migrarem
const vgReformas = id => recs('snap').filter(r => !r.excluido && (!id || r.vessel === id) && (r.tipo === 'reforma' || (r.tipo === 'evento' && r.eq === 'UN' && (r.tp === 'ref' || r.tp === 'parc'))))
  .map(r => r.tipo === 'reforma' ? r : { id: r.id, vessel: r.vessel, ini: r.date, fim: r.fim || (r.emRef ? '' : r.date), local: r.local || '', obs: r.txt || '', por: r.por, ev: true })
  .sort((a, b) => (a.ini || '') < (b.ini || '') ? -1 : 1);
function vgEmReforma(id) {
  const R = vgReformas(id).filter(r => !r.fim); if (R.length) return R[R.length - 1];
  const v = vessel(id), f = v && foraOp(v); return f && /reforma/i.test(f.motivo) ? { vessel: id, ini: '', fim: '', obs: f.obs || '', cfg: true } : null;
}
const vgUltReforma = id => { const R = vgReformas(id); return R[R.length - 1] || vgEmReforma(id); };
// ---------- viagens ----------
function vgViagens() {
  const L = [];
  recs('saida').filter(r => !r.excluido).forEach(r => L.push({ id: r.id, vessel: r.vessel, date: r.date, rota: r.rota || '', balsas: r.balsas || [], cheg: r.cheg || '', src: 'saida', r }));
  recs('snap').filter(r => r.tipo === 'viagem' && !r.excluido).forEach(r => L.push({ id: r.id, vessel: r.vessel, date: r.date, rota: r.rota || '', balsas: r.balsas || [], cheg: r.cheg || '', src: 'hist', r }));
  L.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const H = isoD(hoje());
  L.forEach(x => {
    const nx = L.find(y => y.vessel === x.vessel && y.date > x.date), lim = nx ? nx.date : '9999';
    if (!x.cheg) { const c = recs('fr027').filter(f => f.vessel === x.vessel && f.mov === 'chegada' && f.date > x.date && f.date <= lim).sort((a, b) => a.date < b.date ? -1 : 1)[0]; if (c) x.cheg = c.date; }
    if (x.cheg) { x.fim = x.cheg; x.est = false; }
    else { const r = vgRota(x.rota), cic = r ? r.ciclo : 30; let f = isoD(new Date(+pD(x.date) + cic * 864e5)); if (nx && f > nx.date) f = nx.date; x.fim = f; x.est = true; }
    x.via = !x.cheg && x.fim > H && !nx;
    x.dur = Math.max(0, Math.round((pD(x.fim > H ? H : x.fim) - pD(x.date)) / 864e5));
  });
  return L;
}
// dias de viagem e de porto de uma embarcação no ano (até hoje), sem contar o período em reforma
function vgLinha(id, ehBalsa, V, ano) {
  const i0 = ano + '-01-01', H = isoD(hoje()), f0 = (ano + '-12-31') < H ? ano + '-12-31' : H, d = (a, b) => Math.max(0, Math.round((pD(b) - pD(a)) / 864e5));
  const T = V.filter(x => (ehBalsa ? x.balsas.includes(id) : x.vessel === id) && x.date <= f0 && x.fim >= i0);
  const dv = T.reduce((a, x) => a + d(x.date < i0 ? i0 : x.date, x.fim > f0 ? f0 : x.fim), 0);
  const dr = vgReformas(id).reduce((a, r) => { const a0 = (r.ini || i0) < i0 ? i0 : (r.ini || i0), b0 = (r.fim || f0) > f0 ? f0 : (r.fim || f0); return a + (b0 > a0 ? d(a0, b0) : 0); }, 0);
  const rf = vgEmReforma(id), u = V.filter(x => ehBalsa ? x.balsas.includes(id) : x.vessel === id).pop();
  let st = 'por'; if (rf) st = 'ref'; else if (u && (u.via || (!ehBalsa && u.src === 'saida' && !u.cheg && (situDe(vessel(id)) || {}).st === 'viagem'))) st = 'via';
  const base = [u && u.fim <= H ? u.fim : null, (vgUltReforma(id) || {}).fim || null].filter(Boolean).sort().pop();
  const tot = d(i0, f0);
  return { id, nome: vName(id), st, u, v: T.filter(x => x.date >= i0).length, dv, dp: rf && !rf.fim && !rf.ini ? null : Math.max(0, tot - dv - dr), ph: st === 'por' && base ? d(base, H) : null, pct: tot - dr > 0 ? dv / (tot - dr) * 100 : null, rf: vgUltReforma(id), est: T.some(x => x.est) };
}
// ---------- gráficos ----------
function vgGantt(N, V, ano, eb) {
  const i0 = pD(ano + '-01-01'), f0 = pD(ano + '-12-31'), Hd = hoje(), tot = (f0 - i0) / 864e5, rh = eb ? 15 : 21, L = 74, W = 900, pw = W - L - 8, H = N.length * rh + 22, x = dt => L + Math.max(0, Math.min(tot, (pD(dt) - i0) / 864e5)) / tot * pw;
  let s = '';
  for (let m = 0; m < 12; m++) { const dx = L + (new Date(ano, m, 1) - i0) / 864e5 / tot * pw; s += `<line x1="${dx}" x2="${dx}" y1="0" y2="${H - 18}" stroke="#D5DEEB" stroke-width=".6"/><text x="${dx + 3}" y="${H - 5}" font-size="11" fill="#5B6B80">${VG_MES[m]}</text>`; }
  N.forEach((v, i) => { const y = i * rh + 2;
    s += `<text x="0" y="${y + rh * .68}" font-size="${eb ? 11 : 12}" fill="#14233B">${esc(v.nome)}</text><rect x="${L}" y="${y + 2}" width="${pw}" height="${rh - 5}" fill="#F1F4F8" rx="2"/>`;
    vgReformas(v.id).forEach(r => { const a = r.ini || ano + '-01-01', b = r.fim || isoD(Hd); if (b < ano + '-01-01' || a > ano + '-12-31') return; s += `<rect x="${x(a)}" y="${y + 2}" width="${Math.max(2, x(b) - x(a))}" height="${rh - 5}" fill="#9AA5B4" rx="2"><title>${esc(v.nome)} · em reforma ${brD(a)} a ${r.fim ? brD(r.fim) : 'hoje'}${r.local ? ' · ' + esc(r.local) : ''}</title></rect>`; });
    const rf = vgEmReforma(v.id); if (rf && rf.cfg) s += `<rect x="${L}" y="${y + 2}" width="${x(isoD(Hd)) - L}" height="${rh - 5}" fill="#9AA5B4" rx="2"><title>${esc(v.nome)} · em reforma (Administração)</title></rect>`;
    V.filter(t => eb ? t.balsas.includes(v.id) : t.vessel === v.id).forEach(t => { if (t.fim < ano + '-01-01' || t.date > ano + '-12-31') return;
      s += `<rect x="${x(t.date)}" y="${y + 2}" width="${Math.max(2, x(t.fim > isoD(Hd) ? isoD(Hd) : t.fim) - x(t.date))}" height="${rh - 5}" fill="${VG_COR[t.rota] || '#5B6B80'}" rx="2"${t.est ? ' fill-opacity=".8"' : ''}><title>${esc(vName(t.vessel))} · saída ${brD(t.date)} · ${esc(vgRotaCurta(t.rota))} · ${t.balsas.map(vName).join(', ') || 'sem balsa'} · ${t.dur} d${t.est ? ' (chegada estimada)' : ''}</title></rect>`; }); });
  if (Hd.getFullYear() === ano) s += `<line x1="${x(isoD(Hd))}" x2="${x(isoD(Hd))}" y1="0" y2="${H - 18}" stroke="#C5221F" stroke-width="1.2"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${s}</svg>`;
}
function vgMeses(V, ano) {   // barras empilhadas por rota: 16 px como as do SMF (rmeGraf), o mais juntas possível
  const T = V.filter(x => x.date.slice(0, 4) === String(ano)), nm = ano === hoje().getFullYear() ? hoje().getMonth() + 1 : 12, bw = 16, gw = 26, E = 28, B = 22, Tp = 16, H = 190;
  const C = []; for (let m = 0; m < nm; m++) C.push(T.filter(x => +x.date.slice(5, 7) === m + 1));
  const mx = Math.max(2, ...C.map(c => c.length)), Y = v => Tp + (H - Tp - B) * (1 - v / mx), W = E + nm * gw + 6;
  let s = ''; for (let v = 1; v <= mx; v++) s += `<line x1="${E - 4}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="#E4EAF3" stroke-width=".6"/><text x="${E - 8}" y="${Y(v) + 4}" font-size="10.5" text-anchor="end" fill="#5B6B80">${v}</text>`;
  C.forEach((L, m) => { const cx = E + m * gw + (gw - bw) / 2; let a = 0;
    VG_GR.forEach(g => { const n = L.filter(x => g[2].includes(x.rota)).length; if (n) { s += `<rect x="${cx}" y="${Y(a + n)}" width="${bw}" height="${Y(a) - Y(a + n)}" fill="${g[1]}"><title>${VG_MES[m]} · ${g[0]} · ${n}</title></rect>`; a += n; } });
    const o = L.length - a; if (o > 0) { s += `<rect x="${cx}" y="${Y(a + o)}" width="${bw}" height="${Y(a) - Y(a + o)}" fill="#9AA5B4"><title>${VG_MES[m]} · rota não informada · ${o}</title></rect>`; a += o; }
    if (a) s += `<text x="${cx + bw / 2}" y="${Y(a) - 4}" font-size="11" text-anchor="middle" fill="#14233B">${a}</text>`;
    s += `<text x="${cx + bw / 2}" y="${H - 6}" font-size="10.5" text-anchor="middle" fill="#5B6B80">${VG_MES[m]}</text>`; });
  s += `<line x1="${E - 4}" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="#1F2A44" stroke-width="1"/>`;
  return `<div style="text-align:center"><svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%">${s}</svg></div>`;
}
const vgLeg = (ref) => `<div class="vg-lg">${VG_GR.map(g => `<span><i style="background:${g[1]}"></i>${g[0]}</span>`).join('')}${ref ? '<span><i style="background:#9AA5B4"></i>Em reforma</span>' : ''}</div>`;
// ---------- comboios em viagem agora (SMF 3.131, pedido do Supervisor: “enxergar os comboios que estão em viagem”) ----------
// ---------- onde está a frota (SMF 3.136; Supervisor, 01/11/2026: “visão do que está no porto e do que não está, de balsas e empurradores”) ----------
// posição = snap tipo 'pos' (boletim do Autotrac colado ou lançado à mão): vessel, date, at (data e hora), situ 'via'|'por', local, porto, parDesde, obs, fonte
const VG_PORTOS = ['Manaus', 'Porto Velho', 'Itacoatiara', 'Vila do Conde', 'Barcarena', 'Santarém', 'Munguba', 'Belém', 'Humaitá'];
const VG_PARADO_D = 3;   // fora do porto sem mudar de posição há mais de 3 dias = alerta (critério interno)
const vgPosicoes = id => recs('snap').filter(r => r.tipo === 'pos' && !r.excluido && r.vessel === id && r.date).sort((a, b) => (a.at || a.date) < (b.at || b.date) ? -1 : 1);
const vgDH = at => !at ? '' : brD(at.slice(0, 10)) + (at.length > 10 && at.slice(11, 16) !== '00:00' ? ' ' + at.slice(11, 16).replace(':', 'h') : '');
const vgNorm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function vgOndeDe(id, eb, V) {
  V = V || vgViagens(); const H = isoD(hoje()), dd = (a, b) => Math.max(0, Math.round((pD(b) - pD(a)) / 864e5));
  const lin = vgLinha(id, eb, V, hoje().getFullYear()), u = lin.u, P = eb ? [] : vgPosicoes(id), p = P[P.length - 1];
  const o = { id, nome: lin.nome, st: lin.st, u, balsas: u ? u.balsas : [], rota: u ? u.rota : '', emp: eb && u ? u.vessel : '' };
  const ref = u ? (lin.st === 'via' ? u.date : u.fim) : '';
  const usa = p && o.st !== 'ref' && p.date >= (ref || '');
  if (usa) o.st = p.situ === 'por' ? 'por' : 'via';
  if (o.st === 'por') {
    if (usa) { o.porto = p.porto || p.local || 'Porto não informado'; o.desde = p.at || p.date; o.local = p.local; }
    else if (u) { const c = !eb && recs('fr027').some(f => f.vessel === id && f.mov === 'chegada' && f.date === u.fim); o.porto = 'Manaus'; o.desde = u.fim; o.est = u.est && !c; }
    else o.porto = 'Manaus';
    o.dias = o.desde ? dd(o.desde.slice(0, 10), H) : null;
  } else if (o.st === 'via') {
    o.saida = u && u.via ? u.date : (usa ? '' : u ? u.date : '');
    const Pv = P.filter(x => x.situ !== 'por' && (!o.saida || x.date >= o.saida));
    const q = Pv[Pv.length - 1];
    if (q) { o.local = q.local; o.at = q.at || q.date; o.obs = q.obs;
      let des = q.parDesde || ''; if (!des) { let k = Pv.length - 1; while (k > 0 && vgNorm(Pv[k - 1].local) === vgNorm(q.local)) k--; if (k < Pv.length - 1) des = Pv[k].at || Pv[k].date; }
      if (des) { o.parDesde = des; o.parD = dd(des.slice(0, 10), H); } o.semPos = dd(o.at.slice(0, 10), H); }
    o.dias = o.saida ? dd(o.saida, H) : null;
    if (u && u.via) o.prev = u.fim;
  }
  return o;
}
// texto curto para a Situação da frota
let VG_VC = null;   // viagens em memória até a próxima gravação (a Situação da frota pede um texto por empurrador)
function vgOndeTx(id) { try { if (!VG_VC || VG_VC.v !== S.recs.__v) VG_VC = { v: S.recs.__v, V: vgViagens() }; const o = vgOndeDe(id, false, VG_VC.V);
  if (o.st === 'ref') return 'em reforma';
  if (o.st === 'por') return `${o.porto}${o.desde ? ' desde ' + vgDH(o.desde) : ''}${o.est ? ' (est.)' : ''}`;
  return `em viagem${o.local ? ' · ' + o.local : o.rota ? ' · ' + vgRotaCurta(o.rota) : ''}${o.at ? ' · ' + vgDH(o.at) : ''}${o.parD > VG_PARADO_D ? ' · parado há ' + o.parD + ' d' : ''}`; } catch (e) { return ''; } }
function vgOnde(V, nAno, ano) {
  const E = S.cfg.frota.filter(v => !foraOp(v) || vgEmReforma(v.id)).map(v => vgOndeDe(v.id, false, V)), B = vgBalsas().map(b => vgOndeDe(b.id, true, V));
  const via = E.filter(o => o.st === 'via').sort((a, b) => (b.parD || 0) - (a.parD || 0) || (a.saida < b.saida ? -1 : 1)), por = E.filter(o => o.st === 'por'), ref = E.filter(o => o.st === 'ref');
  const bVia = new Set(via.flatMap(o => o.balsas)), bRef = B.filter(o => o.st === 'ref'), bPor = B.filter(o => o.st !== 'ref' && !bVia.has(o.id));
  const par = via.filter(o => o.parD > VG_PARADO_D).length, ed = can.edit();
  const bt = id => ed ? `<button class="mbtn sm" data-vgpos="${id}" title="Informar posição">Posição</button>` : '';
  const lv = via.map(o => `<tr${o.parD > VG_PARADO_D ? ' class="vg-par"' : ''}><td class="nowrap"><b>${esc(o.nome)}</b></td><td>${o.rota ? `<i class="vg-dot" style="background:${VG_COR[o.rota] || '#9AA5B4'}"></i>${esc(vgRotaCurta(o.rota))}` : '<span class="note">rota não informada</span>'}${o.saida ? `<div class="note">saída ${brD(o.saida)}${o.prev ? ' · chegada prevista ' + brD(o.prev) : ''}</div>` : ''}</td>
    <td>${o.local ? esc(o.local) + `<div class="note">${vgDH(o.at)}${o.semPos > 2 ? ` · <span style="color:var(--warnt)">sem posição nova há ${o.semPos} d</span>` : ''}</div>` : '<span class="note">sem posição informada</span>'}${o.obs ? `<div class="note">${esc(o.obs)}</div>` : ''}</td>
    <td>${o.balsas.map(b => `<span class="vg-b">${esc(vName(b))}</span>`).join('') || '<span class="note">sem balsa</span>'}</td>
    <td class="nowrap">${o.parD > VG_PARADO_D ? `<span class="pill p-bad">parado há ${o.parD} d</span>` : o.dias != null ? `<span class="pill p-inf">${o.dias} d em viagem</span>` : ''}${o.prev && o.prev < isoD(hoje()) ? ' <span class="pill p-warn">passou da chegada</span>' : ''}</td><td>${bt(o.id)}</td></tr>`).join('');
  const portos = [...new Set(por.map(o => o.porto))].sort((a, b) => a === 'Manaus' ? -1 : b === 'Manaus' ? 1 : a < b ? -1 : 1);
  const lp = portos.map(pt => `<tr class="vg-m"><td colspan="3">${esc(pt)} · ${por.filter(o => o.porto === pt).length}</td></tr>` + por.filter(o => o.porto === pt).sort((a, b) => (b.dias ?? -1) - (a.dias ?? -1)).map(o => `<tr><td class="nowrap"><b>${esc(o.nome)}</b></td><td>${o.desde ? 'desde ' + vgDH(o.desde) + (o.est ? ' <span class="note">(chegada estimada)</span>' : '') : '<span class="note">desde quando não informado</span>'}</td><td class="nowrap">${o.dias != null ? `<span class="pill ${o.dias > 15 ? 'p-warn' : 'p-ok'}">${o.dias} d</span>` : ''} ${bt(o.id)}</td></tr>`).join('')).join('');
  const chips = A => A.map(o => `<span class="vg-b">${esc(o.nome)}</span>`).join('') || '<span class="note">nenhuma</span>';
  const nk = (l, v, c) => `<div><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${v}</b></div>`;
  // o quadro de números “Onde está a frota · hoje” saiu (Supervisor, 02/11/2026): está no painel embaixo do mapa; o total de comboios do ano foi para Comboios por mês
  return `<div class="card"><h2>Fora do porto · ${via.length} empurrador${via.length === 1 ? '' : 'es'} · ${bVia.size} balsa${bVia.size === 1 ? '' : 's'}</h2>${via.length ? `<div class="tw"><table class="t vg-ag"><thead><tr><th>Empurrador</th><th>Rota</th><th>Última posição</th><th>Balsas</th><th></th><th></th></tr></thead><tbody>${lv}</tbody></table></div>` : '<p class="note">Nenhum empurrador fora do porto.</p>'}
    <p class="note">Em viagem desde o “Saiu de viagem”; a posição vem do boletim colado ou informado. Mesma posição em boletins seguidos (ou “sem movimento desde”) por mais de ${VG_PARADO_D} dias = parado.</p></div>
   <div class="card"><h2>No porto · ${por.length} empurrador${por.length === 1 ? '' : 'es'} · ${bPor.length} balsa${bPor.length === 1 ? '' : 's'}</h2>${por.length ? `<div class="tw"><table class="t"><tbody>${lp}</tbody></table></div>` : '<p class="note">Nenhum empurrador no porto.</p>'}
    <h3 class="vg-h3">Balsas no porto</h3><div>${chips(bPor)}</div>
    <h3 class="vg-h3">Em reforma</h3><div>${chips(ref.concat(bRef))}</div>
    <p class="note">Porto = o informado na posição; sem ela, Manaus pela chegada (FR 027_L ou estimada pela rota). Mais de 15 dias no porto em âmbar.</p></div>`;
}
// saiu o 3º quadro (b2, Onde está a frota · hoje): os tamanhos guardados dos quadros de baixo sobem uma posição, uma vez só (chave nova)
function vgLayMigra() { try { if (localStorage.getItem('smf_enxviag_lay2') != null) return; const o = JSON.parse(localStorage.getItem('smf_enxviag_lay') || 'null'); if (!o) return; const n = {};
  const sobe = o.b2 && o.b3 && o.b3.y > o.b2.y ? o.b3.y - o.b2.y : 0;   // fecha o buraco do quadro que saiu
  Object.keys(o).forEach(k => { const i = +k.slice(1); if (i < 2) n[k] = o[k]; else if (i > 2) n['b' + (i - 1)] = Object.assign({}, o[k], o[k].y != null && o[k].y >= (o.b2 ? o.b2.y : 0) ? { y: o[k].y - sobe } : {}); }); localStorage.setItem('smf_enxviag_lay2', JSON.stringify(n)); } catch (e) { } }
function vgPosModal(id) {
  if (!can.edit()) return; const o = id ? vgOndeDe(id, false) : null;
  modal(`<h2>Informar posição</h2><div class="g">
    <label class="f s3">Empurrador<select id="vpV">${S.cfg.frota.map(v => `<option value="${v.id}"${v.id === id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></label>
    <label class="f s3">Situação<select id="vpS"><option value="via"${!o || o.st !== 'por' ? ' selected' : ''}>Fora do porto (em viagem)</option><option value="por"${o && o.st === 'por' ? ' selected' : ''}>No porto</option></select></label>
    <label class="f s2">Data<input type="date" id="vpD" value="${isoD(hoje())}"></label><label class="f s1">Hora<input type="time" id="vpH"></label>
    <label class="f s3" id="vpPl">Porto<input id="vpP" list="vpPL" placeholder="Manaus, Porto Velho…"><datalist id="vpPL">${[...(typeof VG_FIXO === 'object' ? Object.keys(VG_FIXO) : []), ...VG_PORTOS].map(x => `<option value="${x}">`).join('')}</datalist></label>
    <label class="f s6">Local / última posição<input id="vpL" placeholder="Paraná do Miriti, a 145 km de Humaitá"></label>
    <label class="f s3" id="vpQl">Sem movimento desde (se parado)<input type="date" id="vpQ"></label>
    <label class="f s3">Observação<input id="vpO" placeholder="opcional"></label></div>
    <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="vpOk">Salvar</button></div>`);
  const ui = () => { const pr = $('#vpS').value === 'por'; $('#vpPl').style.display = pr ? '' : 'none'; $('#vpQl').style.display = pr ? 'none' : ''; }; $('#vpS').onchange = ui; ui();
  $('#vpOk').onclick = async () => { const d = $('#vpD').value, pr = $('#vpS').value === 'por', l = $('#vpL').value.trim(), pt = $('#vpP').value.trim();
    if (!d) return toast('Informe a data.'); if (d > isoD(hoje())) return toast('A data não pode ser futura.'); if (pr ? !pt && !l : !l) return toast(pr ? 'Informe o porto.' : 'Informe a posição.');
    await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'pos', vessel: $('#vpV').value, date: d, at: d + 'T' + ($('#vpH').value || '00:00'), situ: pr ? 'por' : 'via', local: l, porto: pr ? pt || l : '', parDesde: !pr ? $('#vpQ').value : '', obs: $('#vpO').value.trim(), fonte: 'manual', por: S.session.name });
    closeModal(); toast('Posição salva.'); render(); };
}
// boletim do Autotrac colado: cada trecho que cita um empurrador vira uma posição (conferida antes de gravar)
// latitude e longitude no texto (decimal “-7,1234 -63,4567” ou “7°30'12\" S 63°02' W”); fora da região da frota (lat −15 a 6, lon −76 a −44) não conta
function vgCoord(t) {
  t = String(t || '').replace(/[−–](?=\s?\d)/g, '-');   // sinal de menos tipográfico (texto copiado de tabela ou e-mail) vira hífen
  const ok = (a, o) => a >= -15 && a <= 6 && o >= -76 && o <= -44, n = v => +String(v).replace(',', '.');
  // o texto que sobra para o local sai sem as coordenadas (as duas formas, quando vêm juntas) e sem as palavras latitude/longitude
  const limpa = s => s.replace(/-?\d{1,2}[.,]\d{3,}\s*[,;/]?\s+(?:lon\w*\s*:?\s*)?-?\d{1,3}[.,]\d{3,}/gi, ' ').replace(/\d{1,3}\s*°\s*(?:\d{1,2})?\s*['’′]?\s*(?:\d{1,2}(?:[.,]\d+)?)?\s*(?:''|["”″])?\s*[NSWOL][a-z]*\b/gi, ' ').replace(/\b(?:latitude|longitude|lat|lon|long)\b\s*:?/gi, ' ');
  let m = t.match(/(-?\d{1,2}[.,]\d{3,})\s*[,;/]?\s+(?:lon\w*\s*:?\s*)?(-?\d{1,3}[.,]\d{3,})/i);
  if (m && ok(n(m[1]), n(m[2]))) return { lat: n(m[1]), lon: n(m[2]), t: limpa(t) };
  // graus: 06° 39' 01'' Sul (e-mail do Monitoramento) ou 06°39'01" S
  const g = /(\d{1,3})\s*°\s*(\d{1,2})?\s*['’′]?\s*(\d{1,2}(?:[.,]\d+)?)?\s*(?:''|["”″])?\s*([NSWOL])[a-z]*\b/gi, D = []; let x; while ((x = g.exec(t))) D.push(x);
  if (D.length >= 2) { const v = q => (+q[1] + (q[2] ? +q[2] / 60 : 0) + (q[3] ? n(q[3]) / 3600 : 0)) * (/[SWO]/i.test(q[4]) ? -1 : 1), a = v(D[0]), o = v(D[1]);
    if (ok(a, o)) return { lat: Math.round(a * 1e5) / 1e5, lon: Math.round(o * 1e5) / 1e5, t: limpa(t) }; }
  return { lat: null, lon: null, t };
}
function vgLerBoletim(txt) {
  const F = S.cfg.frota.map(v => ({ v, re: new RegExp('\\b' + v.nome.replace(/\s+/g, '\\s*-?\\s*') + '(?![IVXL])', 'i') })).sort((a, b) => b.v.nome.length - a.v.nome.length);
  const it = []; let cur = null;
  String(txt || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => { const f = F.find(x => x.re.test(l)); if (f) { cur = { v: f.v, t: l.replace(f.re, ' ') }; it.push(cur); } else if (cur) cur.t += ' ' + l; });
  const H = hoje(), J = []; it.forEach(x => { const y = J.find(z => z.v === x.v); if (y) y.t += ' ' + x.t; else J.push(x); });   // e-mail que cita o empurrador mais de uma vez = uma posição só
  return J.map(x => { const c = vgCoord(x.t), tt = c.t.replace(/\s*\|\s*/g, ' · ').replace(/COMBOIO\s*:?/gi, ' ').replace(/\bVDA\s*-?\s*[IVXL]+\b(?:\s*(?:,|\be\b)\s*(?:VDA\s*-?\s*)?[IVXL]+\b)*\s*(?:,|\be\b)?/gi, ' ').replace(/HOR[IÍ]METRO\s*\/?\s*:?\s*[\d.,]+\s*h?/gi, ' ').replace(/[ÚU]LTIMA\s+ATUALIZA[CÇ][AÃ]O\s*:?/gi, ' ').replace(/^[\s\-–:]+/, '');
    const la = tt.match(/LOCALIZA[CÇ][AÃ]O\s+ATUAL\s*:?\s*(.+?)(?=\s*POSI[CÇ][AÃ]O|\s*OBSERVA[CÇ]|$)/i), t = la ? la[1] : tt;   // e-mail do Monitoramento: o local é o que vem depois de “Localização atual”
    const md = t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/); let date = isoD(H), hora = '';
    if (md) { let y = md[3] ? +md[3] : H.getFullYear(); if (y < 100) y += 2000; if (!md[3] && +md[2] > H.getMonth() + 2) y--; date = `${y}-${String(+md[2]).padStart(2, '0')}-${String(+md[1]).padStart(2, '0')}`; }
    const mh = t.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})/i); if (mh) hora = `${String(+mh[1]).padStart(2, '0')}:${mh[2]}`;
    const n = vgNorm(tt), fx = /boia|cimento|filial|estaleiro|\beram\b|navecunha/.test(vgNorm(t)) && typeof vgFixo === 'function' ? vgFixo(t) : null, parado = !fx && /parad|sem moviment|fundead/.test(n), porto = !!fx || (/atracad|chegou|no porto|chegada|no terminal/.test(n) && !parado);   // boia 1, boia 2 e filial = no porto, no ponto fixo (js/102)
    const pt = fx || VG_PORTOS.find(p => vgNorm(t).includes(vgNorm(p))) || VG_PORTOS.find(p => n.includes(vgNorm(p)));
    let local = t.replace(/(?:\s(?:desde|em|no dia|dia|de))?\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?:\s*(?:às|as)?\s*\d{1,2}\s*(?:h|:)\s*\d{2}\s*h?)?/gi, ' ').replace(/(?:\s(?:às|as))?\s*\b\d{1,2}\s*(?:h|:)\s*\d{2}\b/gi, ' ').replace(/(?:\s*·\s*){2,}/g, ' · ').replace(/\s{2,}/g, ' ');
    for (let k = 0; k < 4; k++) local = local.replace(/^[\s,.;:\-–|·]+|[\s,.;:\-–|·]+$/g, '').replace(/\s+(?:às|as|desde|em|de)$/i, '');
    if (local.length > 140) local = local.slice(0, 137) + '…';
    return { vessel: x.v.id, nome: x.v.nome, lat: c.lat, lon: c.lon, date: date > isoD(H) ? isoD(H) : date, hora, situ: porto ? 'por' : 'via', porto: porto ? pt || '' : '', local, parDesde: parado ? date : '' }; });
}
function vgBoletimModal(txt0) {
  if (!can.edit()) return;
  modal(`<h2>Colar boletim do Autotrac</h2><p class="note">Cole o texto do e-mail do boletim. Cada linha (ou trecho) que cita um empurrador vira uma posição; a data e a hora são lidas do texto. Confira antes de gravar.</p>
    <textarea id="vbT" rows="7" style="width:100%" placeholder="CJA I – Paraná do Miriti, a 145 km de Humaitá – 31/10 às 18h00">${esc(txt0 || '')}</textarea>
    <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="vbL">Ler</button></div><div id="vbR"></div>`, true);
  let R = [];
  $('#vbL').onclick = () => { R = vgLerBoletim($('#vbT').value);
    $('#vbR').innerHTML = !R.length ? '<p class="note" style="color:var(--badt)">Nenhum empurrador encontrado no texto.</p>' : `<div class="tw"><table class="t"><thead><tr><th></th><th>Empurrador</th><th>Situação</th><th>Data</th><th>Hora</th><th>Posição / porto</th><th>Parado</th></tr></thead><tbody>${R.map((r, k) => `<tr data-k="${k}"><td><input type="checkbox" class="vbI" checked></td><td><b>${esc(r.nome)}</b></td><td><select class="vbS"><option value="via"${r.situ === 'via' ? ' selected' : ''}>fora do porto</option><option value="por"${r.situ === 'por' ? ' selected' : ''}>no porto</option></select></td><td><input type="date" class="vbD" value="${r.date}"></td><td><input type="time" class="vbH" value="${r.hora}"></td><td><input class="vbLc" value="${esc(r.situ === 'por' && r.porto ? r.porto : r.local)}">${r.lat != null ? `<div class="note">${nf(r.lat, 4)} · ${nf(r.lon, 4)}</div>` : ''}</td><td><input type="checkbox" class="vbP"${r.parDesde ? ' checked' : ''}></td></tr>`).join('')}</tbody></table></div><div class="row end"><button class="mbtn pri" id="vbOk">Gravar ${R.length} posição(ões)</button></div>`;
    const ok = $('#vbOk'); if (ok) ok.onclick = async () => { let n = 0;
      for (const tr of $$('#vbR tr[data-k]')) { if (!tr.querySelector('.vbI').checked) continue; const r = R[+tr.dataset.k], d = tr.querySelector('.vbD').value, st = tr.querySelector('.vbS').value, l = tr.querySelector('.vbLc').value.trim(); if (!d || d > isoD(hoje())) continue;
        await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'pos', vessel: r.vessel, date: d, at: d + 'T' + (tr.querySelector('.vbH').value || '00:00'), situ: st, local: l, porto: st === 'por' ? l : '', parDesde: st === 'via' && tr.querySelector('.vbP').checked ? d : '', obs: '', fonte: 'boletim', por: S.session.name, ...(r.lat != null ? { lat: r.lat, lon: r.lon } : {}) }); n++; }
      closeModal(); toast(n + ' posição(ões) gravada(s).'); const ta = $('#vgMo'); if (ta) ta.value = ''; render(); }; };
  if (txt0) $('#vbL').onclick();
}
// ---------- tela ----------
function vEnxViag() {
  const V = vgViagens(), anos = [...new Set([hoje().getFullYear(), ...V.map(x => +x.date.slice(0, 4))])].sort((a, b) => b - a); if (!VG.ano) VG.ano = anos[0]; const ano = VG.ano, eb = VG.modo === 'B';
  const N = eb ? vgBalsas() : S.cfg.frota, L = N.map(v => { const x = vgLinha(v.id, eb, V, ano); if (!eb) x.st = vgOndeDe(v.id, false, V).st; return x; });
  const TA = V.filter(x => x.date.slice(0, 4) === String(ano));
  const STP = { via: '<span class="pill p-inf">em viagem</span>', por: '<span class="pill p-mut">no porto</span>', ref: '<span class="pill p-warn">em reforma</span>' };
  const man = id => { if (eb) { try { const e = balEstado(vgBalsas().find(b => b.id === id)); return e.st === 'ref' ? '' : balPil(BAL_ST, e.st); } catch (x) { return ''; } }
    try { const f = frotaMatriz().find(z => z.v.id === id); return f && f.sit >= 0 ? `<span class="pill ${['p-ok', 'p-warn', 'p-bad', 'p-bad'][f.sit]}">${['liberado à operação', 'liberado com restrição', 'impedido de operar', 'interditado'][f.sit]}</span>` : ''; } catch (x) { return ''; } };
  const rfTx = r => !r ? '—' : r.cfg ? 'em reforma (marcado em Administração)' : `${r.ini ? brD(r.ini) : 'início não informado'} a ${r.fim ? brD(r.fim) : '<b>hoje</b>'}${r.local ? ' · ' + esc(r.local) : ''}`;
  const tab = `<div class="tw"><table class="t vg-t"><thead><tr><th>${eb ? 'Balsa' : 'Empurrador'}</th><th>Hoje</th><th>Manutenção</th><th class="num">Viagens</th><th class="num">Dias em viagem</th><th class="num">Dias no porto</th><th class="num">Parado há</th><th>Última reforma</th></tr></thead><tbody>${L.map(x => `<tr><td><b>${esc(x.nome)}</b></td><td>${STP[x.st]}${x.st === 'via' && x.u ? `<div class="note">${esc(vgRotaCurta(x.u.rota))} · desde ${brD(x.u.date)}</div>` : ''}</td><td>${man(x.id)}</td><td class="num">${x.v}</td><td class="num">${x.st === 'ref' && !x.dv ? '—' : x.dv}${x.est ? '<span class="note"> est.</span>' : ''}</td><td class="num">${x.dp == null ? '—' : x.dp}</td><td class="num">${x.ph == null ? (x.st === 'por' && !x.u ? '<span class="note">sem viagem</span>' : '—') : `<span style="${x.ph > 60 ? 'color:var(--warnt);font-weight:600' : ''}">${x.ph} d</span>`}</td><td class="note">${rfTx(x.rf)}</td></tr>`).join('')}</tbody></table></div>`;
  const pct = L.filter(x => x.st !== 'ref' || x.dv).map(x => [x.nome, x.pct]).sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1));
  const pctH = `<div class="vg-pc">${pct.map(([nm, p]) => `<div><span>${esc(nm)}</span><i><b style="width:${Math.min(100, p || 0)}%"></b></i><strong style="${p != null && p < 20 ? 'color:var(--warnt)' : ''}">${p == null ? '—' : Math.round(p) + '%'}</strong></div>`).join('')}</div>`;
  const RR = rotas().map(r => { const T = TA.filter(x => x.rota === r.id); if (!T.length) return ''; const re = T.filter(x => !x.est); const m = A => A.length ? Math.round(A.reduce((a, x) => a + x.dur, 0) / A.length) : null;
    return `<tr><td><i class="vg-dot" style="background:${VG_COR[r.id] || '#5B6B80'}"></i>${esc(r.nome)}</td><td class="num">${T.length}</td><td class="num">${m(re) == null ? '—' : m(re) + ' d'}</td><td class="num">${m(T)} d${T.some(x => x.est) ? ' <span class="note">c/ est.</span>' : ''}</td><td class="num note">${r.ciclo} d</td></tr>`; }).join('');
  let Ls = TA.slice().reverse(); if (VG.fe) Ls = Ls.filter(x => x.vessel === VG.fe); if (VG.fb) Ls = Ls.filter(x => x.balsas.includes(VG.fb)); if (VG.fr) Ls = Ls.filter(x => x.rota === VG.fr);
  let mAnt = '', sai = '';
  Ls.forEach(x => { const m = +x.date.slice(5, 7); if (m !== mAnt) { mAnt = m; sai += `<tr class="vg-m"><td colspan="6">${VG_MES[m - 1]} · ${Ls.filter(y => +y.date.slice(5, 7) === m).length} saída(s)</td></tr>`; }
    sai += `<tr><td class="nowrap">${brD(x.date)}</td><td><b>${esc(vName(x.vessel))}</b></td><td>${x.balsas.map(b => `<span class="vg-b" data-vgb="${esc(b)}">${esc(vName(b))}</span>`).join('') || '<span class="note">sem balsa</span>'}</td><td class="nowrap"><i class="vg-dot" style="background:${VG_COR[x.rota] || '#9AA5B4'}"></i>${esc(vgRotaCurta(x.rota))}</td><td class="nowrap">${x.cheg ? brD(x.cheg) : `<span class="note">~${brD(x.fim)} est.</span>`}</td><td class="nowrap">${can.edit() ? `<button class="mbtn sm" data-vged="${x.id}">Editar</button>` : ''}</td></tr>`; });
  const opE = `<option value="">Todos os empurradores</option>${S.cfg.frota.map(v => `<option value="${v.id}"${VG.fe === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}`;
  const opB = `<option value="">Todas as balsas</option>${vgBalsas().map(b => `<option value="${b.id}"${VG.fb === b.id ? ' selected' : ''}>${esc(b.nome)}</option>`).join('')}`;
  const opR = `<option value="">Todas as rotas</option>${rotas().map(r => `<option value="${r.id}"${VG.fr === r.id ? ' selected' : ''}>${esc(vgRotaCurta(r.id))}</option>`).join('')}`;
  const seg = `<div class="seg"><button data-vgm="E" class="${eb ? '' : 'on'}">Empurradores</button><button data-vgm="B" class="${eb ? 'on' : ''}">Balsas</button></div>`;
  return enxCab('1.3 Layout da frota', 'Saídas de Manaus com as balsas do comboio, tempo de viagem, tempo parado no porto e reformas · a chegada vem do FR 027_L; sem ela, é estimada pela rota',
    `<label class="f">Ano<select id="vgA">${anos.map(a => `<option${a === ano ? ' selected' : ''}>${a}</option>`).join('')}</select></label><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + `${typeof vgMapaCard === 'function' ? vgMapaCard() : ''}${typeof vgManCard === 'function' ? vgManCard() : ''}${vgOnde(V, TA.length, ano)}
   <div class="card"><div class="row"><h2>Operação por ${eb ? 'balsa' : 'empurrador'}</h2><span class="sp"></span>${seg}</div>${tab}<p class="note">Dias em viagem e no porto contam de 01/01 até hoje; o período em reforma não entra. “est.” = tem chegada estimada pela rota. Parado há = desde a última chegada (ou do fim da reforma); acima de 60 dias fica em destaque. Reformas: lançar e consultar no <a href="#enxeq">Histórico dos equipamentos</a>.</p></div>
   <div class="card"><div class="row"><h2>Linha do tempo · ${ano}</h2><span class="sp"></span>${seg}</div>${vgLeg(true)}${vgGantt(N, V, ano, eb)}<p class="note">Barra = viagem; espaço vazio = no porto; linha vermelha = hoje. Passe o mouse na barra para ver o comboio.</p></div>
   <div class="card"><h2>Comboios por mês · ${ano} · ${TA.length} comboio${TA.length === 1 ? '' : 's'}</h2>${vgLeg(false)}${vgMeses(V, ano)}</div>
   <div class="card"><div class="row"><h2>% do ano em viagem</h2><span class="sp"></span>${seg}</div>${pctH}<p class="note">Dias em viagem ÷ dias do ano até hoje, sem o período em reforma.</p></div>
   <div class="card"><h2>Tempo de viagem por rota · ${ano}</h2><div class="tw"><table class="t"><thead><tr><th>Rota</th><th class="num">Comboios</th><th class="num">Médio real</th><th class="num">Médio com estimadas</th><th class="num">Ciclo previsto</th></tr></thead><tbody>${RR || '<tr><td colspan="5" class="note">Nenhuma viagem no ano.</td></tr>'}</tbody></table></div><p class="note">Real = com chegada pelo FR 027_L ou digitada. Ciclo previsto = o da rota (Administração → Rotas), usado para estimar a chegada.</p></div>
   <div class="card"><h2>Saídas · ${Ls.length}</h2><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px"><select id="vgFe" style="width:auto;min-width:190px">${opE}</select><select id="vgFb" style="width:auto;min-width:170px">${opB}</select><select id="vgFr" style="width:auto;min-width:200px">${opR}</select>${VG.fe || VG.fb || VG.fr ? '<button class="mbtn sm" data-vgx>Limpar</button>' : ''}</div>
     <div class="tw"><table class="t"><thead><tr><th>Saída</th><th>Empurrador</th><th>Balsas do comboio</th><th>Rota</th><th>Chegada</th><th></th></tr></thead><tbody>${sai || '<tr><td colspan="6" class="note">Nenhuma saída. As novas entram pelo “Saiu de viagem”; as antigas, pelo “Colar histórico de saídas” abaixo.</td></tr>'}</tbody></table></div></div>
   ${can.edit() ? `<div class="card"><h2>Colar e-mail do Monitoramento</h2><p class="note">Cole o texto do e-mail do Monitoramento (Autotrac) como vem: “COMBOIO: CJA XX - VDA II, VDA III, VDA IV … ULTIMA ATUALIZACAO: 23/5/2026”. O SMF acha o empurrador, a data, a hora, se está parado ou no porto e, se o e-mail trouxer, a latitude e a longitude. Confira antes de gravar.</p><textarea id="vgMo" rows="6" placeholder="COMBOIO: CJA XX - VDA II, VDA III, VDA IV&#10;HORÍMETRO: 22254  ULTIMA ATUALIZACAO: 23/5/2026 18:00"></textarea><div class="row end" style="margin-top:6px"><button class="mbtn" data-vgbolc>Ler e conferir</button></div></div>` : ''}
   ${can.edit() ? `<div class="card"><h2>Colar histórico de saídas</h2><p class="note">Cole a lista como você escreve: “CJA I – VDA I, VDA III e VDA IX” e embaixo “FLUXO: MAO X ITC X PVH (07/01/2026)”. O SMF reconhece o empurrador, as balsas, a rota (MAO, ITC, PVH, VLC/Vila do Conde, BRE, Munguba) e a data. Saída repetida (mesmo empurrador e data) é ignorada.</p><textarea id="vgC" rows="6" placeholder="CJA I – VDA I, VDA III e VDA IX&#10;FLUXO: MAO X ITC X PVH (07/01/2026)"></textarea><div class="row end" style="margin-top:6px"><button class="mbtn" data-vgcola>Ler e conferir</button></div></div>` : ''}</div></div>`;
}
// ---------- histórico colado ----------
function vgRotaTexto(t) {
  const u = String(t || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/VILA D[OE] CONDE/g, 'VLC').replace(/ITACOATIARA/g, 'ITC').replace(/PORTO VELHO/g, 'PVH').replace(/MANAUS/g, 'MAO').replace(/BRETANA/g, 'BRE').replace(/BARCARENA/g, 'BAR');
  const has = k => new RegExp('\\b' + k + '\\b').test(u);
  if (has('BRE')) return 'bre'; if (has('MUNGUBA')) return 'mun'; if (has('VLC') && has('PVH')) return 'vlp'; if (has('VLC')) return 'vdc';
  if (has('BAR')) return has('ITC') ? 'bip' : has('PVH') ? 'bpv' : 'bma'; if (has('PVH')) return 'pvh'; if (has('ITC')) return 'ita'; return '';
}
const vgAcha = (nome, L) => { const n = String(nome).toUpperCase().replace(/\s+/g, ' ').trim(); return (L.find(v => String(v.nome).toUpperCase() === n) || {}).id || ''; };
function vgLerHistorico(txt) {
  const re = /(CJA\s+[IVXL]+)\s*[–—-]\s*([\s\S]*?)FLUXO:\s*([^()]*?)\(\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*\)/gi, out = []; let m;
  while ((m = re.exec(txt))) { const bal = (m[2].match(/VDA\s+[IVXL]+/gi) || []).map(b => b.replace(/\s+/, ' ').toUpperCase());
    out.push({ emp: m[1].replace(/\s+/, ' ').toUpperCase(), vessel: vgAcha(m[1], S.cfg.frota), balN: bal, balsas: bal.map(b => vgAcha(b, vgBalsas())), fluxo: m[3].trim(), rota: vgRotaTexto(m[3]), date: gsData(m[4]) }); }
  return out;
}
function vgColar() {
  if (!S.session) return loginModal(); const L = vgLerHistorico($('#vgC').value), V = vgViagens();
  if (!L.length) return toast('Não reconheci nenhuma saída. Confira o formato: “CJA I – VDA I e VDA III” e “FLUXO: MAO X ITC X PVH (07/01/2026)”.', 6000);
  L.forEach(x => { x.dup = V.some(y => y.vessel === x.vessel && y.date === x.date); x.erro = !x.vessel ? 'empurrador não cadastrado' : !x.date ? 'data inválida' : x.balsas.includes('') ? 'balsa não cadastrada' : ''; });
  const ok = L.filter(x => !x.dup && !x.erro);
  modal(`<h2>Conferir histórico · ${L.length} saída(s) lida(s)</h2><p class="note">${ok.length} serão gravadas. ${L.length - ok.length ? (L.length - ok.length) + ' ficam de fora (repetidas ou com erro).' : ''} A chegada fica estimada pela rota até você informar a real (Editar, na lista de saídas).</p>
    <div class="tw" style="max-height:52vh;overflow:auto"><table class="t"><thead><tr><th>Data</th><th>Empurrador</th><th>Balsas</th><th>Fluxo lido</th><th>Rota no SMF</th><th></th></tr></thead><tbody>${L.map(x => `<tr><td class="nowrap">${x.date ? brD(x.date) : '—'}</td><td>${esc(x.emp)}</td><td>${esc(x.balN.join(', '))}</td><td class="note">${esc(x.fluxo)}</td><td>${x.rota ? esc(vgRotaCurta(x.rota)) : '<span style="color:var(--warnt)">não reconhecida</span>'}</td><td>${x.dup ? '<span class="pill p-mut">já existe</span>' : x.erro ? `<span class="pill p-bad">${esc(x.erro)}</span>` : '<span class="pill p-ok">ok</span>'}</td></tr>`).join('')}</tbody></table></div>
    <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="vgCok"${ok.length ? '' : ' disabled'}>Gravar ${ok.length} saída(s)</button></div>`, true);
  $('#vgCok').onclick = async () => { for (const x of ok) await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'viagem', vessel: x.vessel, date: x.date, rota: x.rota, balsas: x.balsas, cheg: '', fonte: 'histórico colado', por: S.session.name });
    closeModal(); toast(ok.length + ' saída(s) gravada(s) no histórico.'); render(); };
}
function vgEditar(id) {
  const x = vgViagens().find(v => v.id === id); if (!x || !S.session) return S.session ? null : loginModal(); const r = x.r, sel = new Set(x.balsas);
  modal(`<h2>Viagem · ${esc(vName(x.vessel))} · saída ${brD(x.date)}</h2><p class="note">${x.src === 'saida' ? 'Registro de saída feito no SMF.' : 'Saída do histórico colado.'} ${x.cheg ? '' : 'Sem chegada registrada: o SMF estima ~' + brD(x.fim) + ' pela rota.'}</p>
    <div class="g"><label class="f s3">Rota<select id="veR"><option value="">— rota não informada —</option>${rotas().map(t => `<option value="${t.id}"${x.rota === t.id ? ' selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></label>${x.src === 'hist' ? `<label class="f s1">Saída<input type="date" id="veD" value="${esc(x.date)}"></label>` : ''}<label class="f s2">Chegada em Manaus<input type="date" id="veC" value="${esc(r.cheg || '')}" min="${esc(x.date)}"></label></div>
    <div class="note" style="margin:8px 0 4px">Balsas do comboio</div><div class="vg-ch" id="veB">${vgBalsas().map(b => `<span class="vg-c${sel.has(b.id) ? ' on' : ''}" data-vgc="${b.id}">${esc(b.nome.replace('VDA ', ''))}</span>`).join('')}</div>
    <div class="note" id="veE" style="color:var(--badt)"></div><div class="row end">${can.admin() && x.src === 'hist' ? '<button class="mbtn" id="veX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="veOk">Salvar</button></div>`, true);
  $('#veB').onclick = e => { const c = e.target.closest('[data-vgc]'); if (!c) return; sel.has(c.dataset.vgc) ? sel.delete(c.dataset.vgc) : sel.add(c.dataset.vgc); c.classList.toggle('on'); };
  $('#veOk').onclick = async () => { const ch = $('#veC').value, d = ($('#veD') || {}).value || x.date; if (ch && ch < d) return $('#veE').textContent = 'A chegada não pode ser antes da saída.';
    Object.assign(r, { rota: $('#veR').value, balsas: [...sel], cheg: ch }); if (r.kind === 'saida') r.rotaNome = (vgRota(r.rota) || {}).nome || ''; else r.date = d; await saveRec(r); closeModal(); toast('Viagem salva.'); render(); };
  const del = $('#veX'); if (del) del.onclick = async () => { if (!confirm('Excluir esta saída do histórico?')) return; r.excluido = true; await saveRec(r); closeModal(); render(); };
}
// ---------- campo “Balsas do comboio” no registro de saída (js/46) ----------
function vgSaidaCampo() {
  return `<div class="f s6"><span>Balsas do comboio <span class="note">(deixe vazio se saiu sem balsa)</span></span><div class="vg-ch" id="saB">${vgBalsas().map(b => { const rf = vgEmReforma(b.id); return `<span class="vg-c${rf ? ' off' : ''}" data-vgc="${b.id}" title="${rf ? 'em reforma' : esc(b.nome)}">${esc(b.nome.replace('VDA ', ''))}</span>`; }).join('')}</div></div>`;
}
const vgSaidaLer = () => [...document.querySelectorAll('#saB .vg-c.on')].map(c => c.dataset.vgc);
document.addEventListener('click', e => { const c = e.target.closest('#saB [data-vgc]'); if (c && !c.classList.contains('off')) c.classList.toggle('on'); });
// ---------- telas, cliques e menu ----------
VX.enxviag = vEnxViag;
AFTER.enxviag = () => { const m = $('#main');
  m.onclick = e => { const t = e.target.closest('[data-vgm],[data-vgb],[data-vgx],[data-vged],[data-vgcola],[data-vgpos],[data-vgbol],[data-vgbolc]'); if (!t) return; const d = t.dataset;
    if (d.vgpos !== undefined) return vgPosModal(d.vgpos);
    if (d.vgbolc !== undefined) { const x = ($('#vgMo') || {}).value || ''; if (!x.trim()) return toast('Cole o texto do e-mail primeiro.'); return vgBoletimModal(x); }
    if (d.vgbol !== undefined) return vgBoletimModal();
    if (d.vgm) { VG.modo = d.vgm; return render(); }
    if (d.vgb) { VG.fb = d.vgb; return render(); }
    if (d.vgx !== undefined) { VG.fe = VG.fb = VG.fr = ''; return render(); }
    if (d.vged) return vgEditar(d.vged);
    if (d.vgcola !== undefined) return vgColar(); };
  m.onchange = e => { const t = e.target;
    if (t.id === 'vgA') { VG.ano = +t.value; return render(); }
    if (t.id === 'vgFe') { VG.fe = t.value; return render(); }
    if (t.id === 'vgFb') { VG.fb = t.value; return render(); }
    if (t.id === 'vgFr') { VG.fr = t.value; return render(); } };
  const ws = m.querySelector('.cm-ws'); if (ws) { vgLayMigra(); janelasLivres(ws, 'smf_enxviag_lay2', '[data-enxreset]'); } if (typeof vgMapaIniciar === 'function') vgMapaIniciar(); if (typeof heMigraReformas === 'function') heMigraReformas(); };
ENX_OK.push('enxviag'); PCM_ETAPAS[0][2].push('enxviag');
PCM_MENU.find(g => /^1 /.test(g[0]))[1].push(['enxviag', '1.3 Layout da frota', 'viag']);
ICO.viag = '<path d="M3 17h18l-2 3H5z"/><path d="M6 17V9h8l3 4v4"/><path d="M9 9V5h3v4"/>';
{ const st = document.createElement('style'); st.textContent = `
.vg-lg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--muted,#5B6B80);margin:2px 0 8px}.vg-lg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.vg-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:0}
.vg-b{display:inline-block;font-size:11.5px;padding:1px 6px;border-radius:6px;background:#E6F0FB;color:#0C447C;margin:0 3px 3px 0;cursor:pointer}
a.sf-onde{color:inherit;text-decoration:none}a.sf-onde:hover{text-decoration:underline}
tr.vg-par td{background:#FDECEA}.vg-h3{font-size:13px;font-weight:600;color:#41536A;margin:12px 0 4px}
tr.vg-m td{background:rgba(22,36,74,.05);font-weight:600;font-size:12px;color:#41536A}
.vg-t td{vertical-align:middle}
.vg-pc{display:flex;flex-direction:column;gap:3px;max-width:720px}.vg-pc>div{display:grid;grid-template-columns:86px 1fr 52px;gap:10px;align-items:center;font-size:12.5px}
.vg-pc i{display:block;height:11px;background:#F1F4F8;border-radius:4px;overflow:hidden}.vg-pc i b{display:block;height:100%;background:#378ADD;border-radius:4px}.vg-pc strong{text-align:right;font-weight:500}
.vg-ch{display:flex;flex-wrap:wrap;gap:4px}.vg-c{display:inline-block;min-width:36px;text-align:center;padding:4px 7px;border:1px solid #C9D3DF;border-radius:6px;font-size:12px;cursor:pointer;user-select:none;background:#fff}
.vg-c.on{background:#1A73E8;border-color:#1A73E8;color:#fff}.vg-c.off{opacity:.4;cursor:not-allowed;text-decoration:line-through}`; document.head.appendChild(st); }
