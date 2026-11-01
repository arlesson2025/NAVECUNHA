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
const vgReformas = id => recs('snap').filter(r => r.tipo === 'reforma' && !r.excluido && (!id || r.vessel === id)).sort((a, b) => (a.ini || '') < (b.ini || '') ? -1 : 1);
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
// ---------- tela ----------
function vEnxViag() {
  const V = vgViagens(), anos = [...new Set([hoje().getFullYear(), ...V.map(x => +x.date.slice(0, 4))])].sort((a, b) => b - a); if (!VG.ano) VG.ano = anos[0]; const ano = VG.ano, eb = VG.modo === 'B';
  const N = eb ? vgBalsas() : S.cfg.frota, L = N.map(v => vgLinha(v.id, eb, V, ano)), LE = S.cfg.frota.map(v => vgLinha(v.id, false, V, ano)), LB = vgBalsas().map(b => vgLinha(b.id, true, V, ano));
  const TA = V.filter(x => x.date.slice(0, 4) === String(ano)), n = (A, k) => A.filter(x => x.st === k).length;
  const STP = { via: '<span class="pill p-inf">em viagem</span>', por: '<span class="pill p-mut">no porto</span>', ref: '<span class="pill p-warn">em reforma</span>' };
  const man = id => { if (eb) { try { const e = balEstado(vgBalsas().find(b => b.id === id)); return e.st === 'ref' ? '' : balPil(BAL_ST, e.st); } catch (x) { return ''; } }
    try { const f = frotaMatriz().find(z => z.v.id === id); return f && f.sit >= 0 ? `<span class="pill ${['p-ok', 'p-warn', 'p-bad', 'p-bad'][f.sit]}">${['liberado', 'com restrição', 'bloqueado', 'interditado'][f.sit]}</span>` : ''; } catch (x) { return ''; } };
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
  const RF = vgReformas().slice().reverse();
  const opE = `<option value="">Todos os empurradores</option>${S.cfg.frota.map(v => `<option value="${v.id}"${VG.fe === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}`;
  const opB = `<option value="">Todas as balsas</option>${vgBalsas().map(b => `<option value="${b.id}"${VG.fb === b.id ? ' selected' : ''}>${esc(b.nome)}</option>`).join('')}`;
  const opR = `<option value="">Todas as rotas</option>${rotas().map(r => `<option value="${r.id}"${VG.fr === r.id ? ' selected' : ''}>${esc(vgRotaCurta(r.id))}</option>`).join('')}`;
  const opV = sel => `<optgroup label="Empurradores">${S.cfg.frota.map(v => `<option value="${v.id}"${sel === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</optgroup><optgroup label="Balsas">${vgBalsas().map(b => `<option value="${b.id}"${sel === b.id ? ' selected' : ''}>${esc(b.nome)}</option>`).join('')}</optgroup>`;
  const seg = `<div class="seg"><button data-vgm="E" class="${eb ? '' : 'on'}">Empurradores</button><button data-vgm="B" class="${eb ? 'on' : ''}">Balsas</button></div>`;
  const nk = (l, v, c) => `<div><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${v}</b></div>`;
  return enxCab('1.3 Viagens e comboios', 'Saídas de Manaus com as balsas do comboio, tempo de viagem, tempo parado no porto e reformas · a chegada vem do FR 027_L; sem ela, é estimada pela rota',
    `<label class="f">Ano<select id="vgA">${anos.map(a => `<option${a === ano ? ' selected' : ''}>${a}</option>`).join('')}</select></label><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + `<div class="card"><h2>Resumo · ${ano}</h2><div class="sf-k">${nk('Comboios no ano', TA.length)}${nk('Empurradores em viagem', n(LE, 'via'))}${nk('Balsas em viagem', n(LB, 'via'))}${nk('No porto', n(LE, 'por') + ' emp. · ' + n(LB, 'por') + ' balsas')}${nk('Em reforma', n(LE, 'ref') + n(LB, 'ref'), n(LE, 'ref') + n(LB, 'ref') ? 'var(--warnt)' : '')}</div></div>
   <div class="card"><div class="row"><h2>Operação por ${eb ? 'balsa' : 'empurrador'}</h2><span class="sp"></span>${seg}</div>${tab}<p class="note">Dias em viagem e no porto contam de 01/01 até hoje; o período em reforma não entra. “est.” = tem chegada estimada pela rota. Parado há = desde a última chegada (ou do fim da reforma); acima de 60 dias fica em destaque.</p></div>
   <div class="card"><div class="row"><h2>Linha do tempo · ${ano}</h2><span class="sp"></span>${seg}</div>${vgLeg(true)}${vgGantt(N, V, ano, eb)}<p class="note">Barra = viagem; espaço vazio = no porto; linha vermelha = hoje. Passe o mouse na barra para ver o comboio.</p></div>
   <div class="card"><h2>Comboios por mês · ${ano}</h2>${vgLeg(false)}${vgMeses(V, ano)}</div>
   <div class="card"><div class="row"><h2>% do ano em viagem</h2><span class="sp"></span>${seg}</div>${pctH}<p class="note">Dias em viagem ÷ dias do ano até hoje, sem o período em reforma.</p></div>
   <div class="card"><h2>Tempo de viagem por rota · ${ano}</h2><div class="tw"><table class="t"><thead><tr><th>Rota</th><th class="num">Comboios</th><th class="num">Médio real</th><th class="num">Médio com estimadas</th><th class="num">Ciclo previsto</th></tr></thead><tbody>${RR || '<tr><td colspan="5" class="note">Nenhuma viagem no ano.</td></tr>'}</tbody></table></div><p class="note">Real = com chegada pelo FR 027_L ou digitada. Ciclo previsto = o da rota (Administração → Rotas), usado para estimar a chegada.</p></div>
   <div class="card"><h2>Saídas · ${Ls.length}</h2><div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px"><select id="vgFe" style="width:auto;min-width:190px">${opE}</select><select id="vgFb" style="width:auto;min-width:170px">${opB}</select><select id="vgFr" style="width:auto;min-width:200px">${opR}</select>${VG.fe || VG.fb || VG.fr ? '<button class="mbtn sm" data-vgx>Limpar</button>' : ''}</div>
     <div class="tw"><table class="t"><thead><tr><th>Saída</th><th>Empurrador</th><th>Balsas do comboio</th><th>Rota</th><th>Chegada</th><th></th></tr></thead><tbody>${sai || '<tr><td colspan="6" class="note">Nenhuma saída. As novas entram pelo “Saiu de viagem”; as antigas, pelo “Colar histórico de saídas” abaixo.</td></tr>'}</tbody></table></div></div>
   <div class="card"><h2>Reformas</h2><div class="tw"><table class="t"><thead><tr><th>Embarcação</th><th>Início</th><th>Fim</th><th>Estaleiro / local</th><th>Observação</th><th></th></tr></thead><tbody>${RF.map(r => `<tr><td><b>${esc(vName(r.vessel))}</b></td><td>${r.ini ? brD(r.ini) : '—'}</td><td>${r.fim ? brD(r.fim) : '<span class="pill p-warn">em reforma</span>'}</td><td>${esc(r.local || '')}</td><td class="note">${esc(r.obs || '')}</td><td class="nowrap">${can.edit() ? `<button class="mbtn sm" data-vgref="${r.id}">${r.fim ? 'Editar' : 'Encerrar / editar'}</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="note">Nenhuma reforma registrada.</td></tr>'}</tbody></table></div>
     ${can.edit() ? `<div class="g" style="margin-top:8px"><label class="f s2">Embarcação<select id="vgRv">${opV('')}</select></label><label class="f s1">Início<input type="date" id="vgRi"></label><label class="f s1">Fim (vazio = em reforma)<input type="date" id="vgRf"></label><label class="f s2">Estaleiro / local<input id="vgRl"></label><label class="f s6">Observação<input id="vgRo" placeholder="ex.: motores novos; casco e convés"></label></div><div class="note" id="vgRe" style="color:var(--badt)"></div><div class="row end"><button class="mbtn pri" data-vgrnova>Registrar reforma</button></div>` : ''}</div>
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
async function vgRefNova() {
  if (!S.session) return loginModal(); const v = $('#vgRv').value, i = $('#vgRi').value, f = $('#vgRf').value, E = $('#vgRe');
  if (!v || (!i && !f)) return E.textContent = 'Escolha a embarcação e informe ao menos o início (ou o fim, se não souber o início).';
  if (i && f && f < i) return E.textContent = 'O fim não pode ser antes do início.';
  if (!f && vgReformas(v).some(r => !r.fim)) return E.textContent = vName(v) + ' já tem uma reforma em aberto: encerre-a na lista.';
  await saveRec({ id: uid('snap'), kind: 'snap', tipo: 'reforma', vessel: v, ini: i, fim: f, local: $('#vgRl').value.trim(), obs: $('#vgRo').value.trim(), por: S.session.name });
  toast('Reforma registrada · ' + vName(v) + (f ? '' : ' (em reforma)')); render();
}
function vgRefEditar(id) {
  const r = S.recs.get(id); if (!r) return; if (!S.session) return loginModal();
  modal(`<h2>Reforma · ${esc(vName(r.vessel))}</h2><div class="g"><label class="f s2">Início<input type="date" id="reI" value="${esc(r.ini || '')}"></label><label class="f s2">Fim (saída da reforma)<input type="date" id="reF" value="${esc(r.fim || '')}"></label><label class="f s2">Estaleiro / local<input id="reL" value="${esc(r.local || '')}"></label><label class="f s6">Observação<input id="reO" value="${esc(r.obs || '')}"></label></div>
    ${vessel(r.vessel) && foraOp(r.vessel) ? '<p class="note">Este empurrador também está marcado “fora de operação” em Administração. Ao encerrar a reforma, tire a marca lá para ele voltar às contas da frota.</p>' : ''}
    <div class="note" id="reE" style="color:var(--badt)"></div><div class="row end">${can.admin() ? '<button class="mbtn" id="reX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="reOk">Salvar</button></div>`);
  $('#reOk').onclick = async () => { const i = $('#reI').value, f = $('#reF').value; if (i && f && f < i) return $('#reE').textContent = 'O fim não pode ser antes do início.';
    Object.assign(r, { ini: i, fim: f, local: $('#reL').value.trim(), obs: $('#reO').value.trim() }); await saveRec(r); closeModal(); toast(f ? vName(r.vessel) + ' saiu da reforma em ' + brD(f) + '.' : 'Reforma salva.'); render(); };
  const del = $('#reX'); if (del) del.onclick = async () => { if (!confirm('Excluir este registro de reforma?')) return; r.excluido = true; await saveRec(r); closeModal(); render(); };
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
  m.onclick = e => { const t = e.target.closest('[data-vgm],[data-vgb],[data-vgx],[data-vged],[data-vgref],[data-vgrnova],[data-vgcola]'); if (!t) return; const d = t.dataset;
    if (d.vgm) { VG.modo = d.vgm; return render(); }
    if (d.vgb) { VG.fb = d.vgb; return render(); }
    if (d.vgx !== undefined) { VG.fe = VG.fb = VG.fr = ''; return render(); }
    if (d.vged) return vgEditar(d.vged);
    if (d.vgref) return vgRefEditar(d.vgref);
    if (d.vgrnova !== undefined) return vgRefNova();
    if (d.vgcola !== undefined) return vgColar(); };
  m.onchange = e => { const t = e.target;
    if (t.id === 'vgA') { VG.ano = +t.value; return render(); }
    if (t.id === 'vgFe') { VG.fe = t.value; return render(); }
    if (t.id === 'vgFb') { VG.fb = t.value; return render(); }
    if (t.id === 'vgFr') { VG.fr = t.value; return render(); } };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_enxviag_lay', '[data-enxreset]'); };
ENX_OK.push('enxviag'); PCM_ETAPAS[0][2].push('enxviag');
PCM_MENU.find(g => /^1 /.test(g[0]))[1].push(['enxviag', '1.3 Viagens e comboios', 'viag']);
ICO.viag = '<path d="M3 17h18l-2 3H5z"/><path d="M6 17V9h8l3 4v4"/><path d="M9 9V5h3v4"/>';
{ const st = document.createElement('style'); st.textContent = `
.vg-lg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--muted,#5B6B80);margin:2px 0 8px}.vg-lg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.vg-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:0}
.vg-b{display:inline-block;font-size:11.5px;padding:1px 6px;border-radius:6px;background:#E6F0FB;color:#0C447C;margin:0 3px 3px 0;cursor:pointer}
tr.vg-m td{background:rgba(22,36,74,.05);font-weight:600;font-size:12px;color:#41536A}
.vg-t td{vertical-align:middle}
.vg-pc{display:flex;flex-direction:column;gap:3px;max-width:720px}.vg-pc>div{display:grid;grid-template-columns:86px 1fr 52px;gap:10px;align-items:center;font-size:12.5px}
.vg-pc i{display:block;height:11px;background:#F1F4F8;border-radius:4px;overflow:hidden}.vg-pc i b{display:block;height:100%;background:#378ADD;border-radius:4px}.vg-pc strong{text-align:right;font-weight:500}
.vg-ch{display:flex;flex-wrap:wrap;gap:4px}.vg-c{display:inline-block;min-width:36px;text-align:center;padding:4px 7px;border:1px solid #C9D3DF;border-radius:6px;font-size:12px;cursor:pointer;user-select:none;background:#fff}
.vg-c.on{background:#1A73E8;border-color:#1A73E8;color:#fff}.vg-c.off{opacity:.4;cursor:not-allowed;text-decoration:line-through}`; document.head.appendChild(st); }
