/* ===== Compressão do MCP: tela própria no menu (matriz da frota, histórico, critérios com manual e página) + alertas no Hoje ===== */
'use strict';
// regras: fabricante onde o manual define; o resto é critério interno, sempre identificado como tal
const CMP = { int: 1000, dif: 0.18, projProg: 2000, kgf: 10.197 };   // intervalo do ensaio (h) · diferença entre cilindros (MPa) · projeção que manda programar (h = 2 ensaios) · MPa → kgf/cm²
const kgf = x => x == null ? '—' : (x * CMP.kgf).toFixed(1).replace('.', ',');
const CMP_ST = { fora: ['p-bad', 'Fora do limite', 0], prog: ['p-warn', 'Programar overhaul', 1], aten: ['p-warn', 'Atenção', 2], sem: ['p-mut', 'Sem ensaio', 3], ok: ['p-ok', 'OK', 4] };
function cmpProj(H) {   // horas até 1,27 MPa pela reta das 3 últimas medições (pior cilindro × horímetro); Infinity = sem queda
  const P = H.filter(p => p.h != null && p.h !== '' && isFinite(+p.h)).slice(-3); if (P.length < 2) return null;
  const n = P.length, mx = P.reduce((a, p) => a + +p.h, 0) / n, my = P.reduce((a, p) => a + p.min, 0) / n;
  let sxy = 0, sxx = 0; P.forEach(p => { sxy += (+p.h - mx) * (p.min - my); sxx += (+p.h - mx) ** 2; });
  if (!sxx) return null; const b = sxy / sxx; if (b >= 0) return Infinity;
  return Math.max(0, (P[n - 1].min - COMP.lim) / -b);
}
function cmpStatus(v, pos) {
  const H = compHist(v.id, pos), u = H[H.length - 1] || null, a = H[H.length - 2] || null, hr = horAtual(v.id, pos);
  const r = { v, pos, H, u, hr, dif: u && u.vals.filter(x => x != null).length > 1 ? u.max - u.min : null, queda: u && a ? a.min - u.min : null, proj: cmpProj(H), mot: [] };
  r.prox = u && u.h != null && u.h !== '' ? +u.h + CMP.int : null; r.falta = r.prox != null && hr ? r.prox - hr.h : null; r.vencida = r.falta != null && r.falta < 0;
  if (!u) { r.st = 'sem'; r.mot.push('nenhum ensaio registrado'); }
  else if (u.min < COMP.lim) { r.st = 'fora'; r.mot.push(`cil. ${u.cil} com ${fMPa(u.min)} MPa, abaixo do limite: inspeção de overhaul (SM p. 4-4)`); }
  else if (u.min < COMP.aten || (r.proj != null && r.proj < CMP.projProg)) { r.st = 'prog'; if (u.min < COMP.aten) r.mot.push(`cil. ${u.cil} com ${fMPa(u.min)} MPa, abaixo de ${fMPa(COMP.aten)}`); if (r.proj != null && r.proj < CMP.projProg) r.mot.push(`~${nf(r.proj)} h até o limite`); }
  else if ((r.dif != null && r.dif > CMP.dif) || (r.queda != null && r.queda >= COMP.queda)) r.st = 'aten';
  else r.st = 'ok';
  if (u && u.min >= COMP.lim && r.dif != null && r.dif > CMP.dif) r.mot.push(`diferença de ${fMPa(r.dif)} MPa entre cilindros (falha localizada: válvula, anel ou junta)`);
  if (u && r.st !== 'prog' && r.queda != null && r.queda >= COMP.queda) r.mot.push(`queda de ${fMPa(r.queda)} MPa desde o ensaio anterior`);
  if (r.vencida) r.mot.push(`ensaio vencido há ${nf(-r.falta)} h`);
  return r;
}
function cmpDados() { const out = []; S.cfg.frota.forEach(v => { if (typeof foraOp === 'function' && foraOp(v)) return; if ((v.off || []).includes('MCP')) return; mcpPos(v).forEach(pos => out.push(cmpStatus(v, pos))); }); const ord = x => CMP_ST[x.st][2] - (x.vencida && x.st !== 'fora' ? 3.5 : 0);   // ensaio vencido (P1) sobe logo abaixo de "fora do limite"
  return out.sort((a, b) => ord(a) - ord(b) || (a.u ? a.u.min : 9) - (b.u ? b.u.min : 9)); }
const cmpNome = x => esc(x.v.nome) + (mcpPos(x.v).length > 1 ? ' · ' + x.pos : '');
const CF = { f: 'todas', sel: '', per: 12, hv: '' };   // filtro da matriz · motor do detalhe · período e motor do histórico
const CMP_COR = ['#1967D2', '#D93025', '#188038', '#E37400', '#A142F4', '#12B5CB', '#5F6368', '#F439A0', '#9E6A03', '#3367D6', '#1E8E3E', '#B06000', '#7B1FA2', '#00897B'];
const cmpKey = x => x.v.id + '|' + x.pos;
function cmpUsoDia(vid, pos) {   // h/dia pelas leituras de horímetro dos últimos 180 dias
  const L = recs('hor').filter(r => r.vessel === vid && r.pos === pos && r.date).sort((a, b) => a.date < b.date ? -1 : 1);
  if (L.length < 2) return null; const u = L[L.length - 1], lim = addM(pD(u.date), -6), a = L.find(r => pD(r.date) >= lim) || L[0];
  const dias = (pD(u.date) - pD(a.date)) / 864e5; return dias >= 7 && u.h > a.h ? (u.h - a.h) / dias : null;
}
function cmpTaxa(H) { const P = H.filter(p => p.h != null && p.h !== '' && isFinite(+p.h)).slice(-3); if (P.length < 2) return null; const n = P.length, mx = P.reduce((a, p) => a + +p.h, 0) / n, my = P.reduce((a, p) => a + p.min, 0) / n; let sxy = 0, sxx = 0; P.forEach(p => { sxy += (+p.h - mx) * (p.min - my); sxx += (+p.h - mx) ** 2; }); return sxx ? sxy / sxx : null; }   // MPa por hora
function cmpMeses(h, x) { const d = cmpUsoDia(x.v.id, x.pos); return d ? ' (' + Math.max(0, Math.round(h / d / 30.4)) + ' m)' : ''; }
function cmpDias(h, x) { const d = cmpUsoDia(x.v.id, x.pos); return d ? Math.round(h / d) : null; }
function cmpDiag(x) {   // leitura do padrão do último ensaio (interpretação; o manual só lista os sintomas, SM p. 4-3)
  const u = x.u; if (!u) return 'Sem ensaio registrado. Medir os 6 cilindros na próxima inspeção dos bicos (item 1.1.12).';
  const v = u.vals.filter(n => n != null), outros = v.filter((n, i) => i !== u.vals.indexOf(u.min)), mo = outros.length ? Math.min(...outros) : u.min, Mo = outros.length ? Math.max(...outros) : u.min;
  const lim = u.min < COMP.lim ? `Cilindro ${u.cil} com ${fMPa(u.min)} MPa, abaixo do limite de 1,27 MPa: fazer a inspeção de overhaul (SM p. 4-4). ` : '';
  if (x.dif != null && x.dif > CMP.dif && Mo - mo <= CMP.dif / 2) return lim + `Só o cilindro ${u.cil} está fora do grupo (${fMPa(u.min)} MPa contra ${fMPa(mo)}–${fMPa(Mo)} nos demais): padrão de falha localizada (vedação de válvula, anel quebrado ou junta do cabeçote). Confirmar no cilindro ${u.cil} antes de decidir por revisão geral.`;
  if (u.min < COMP.aten && x.dif != null && x.dif <= CMP.dif) return lim + `Queda parecida nos 6 cilindros (diferença de ${fMPa(x.dif)} MPa): desgaste geral (anéis e camisas). Avaliar a revisão geral junto com potência, consumo de óleo e blow-by (SM p. 4-3).`;
  if (lim) return lim.trim();
  return x.queda != null && x.queda >= COMP.queda ? `Queda de ${fMPa(x.queda)} MPa desde o ensaio anterior: repetir o ensaio na próxima inspeção dos bicos e acompanhar a tendência.` : 'Cilindros equilibrados e acima do critério de programação. Seguir com o ensaio a cada 1.000 h.';
}
function cmpMatriz(D) {
  const cnt = { todas: D.length, fora: D.filter(x => x.st === 'fora').length, prog: D.filter(x => x.st === 'prog').length, aten: D.filter(x => x.st === 'aten').length, ok: D.filter(x => x.st === 'ok').length, sem: D.filter(x => x.st === 'sem').length, venc: D.filter(x => x.vencida).length };
  const nomes = { todas: 'Todas', fora: 'Fora', prog: 'Programar', aten: 'Atenção', ok: 'OK', sem: 'Sem base', venc: 'Vencidas' };
  const F = D.filter(x => CF.f === 'todas' || (CF.f === 'venc' ? x.vencida : x.st === CF.f));
  const queda = x => { const t = cmpTaxa(x.H); return t == null ? '—' : fMPa(Math.max(0, -t * 1000)); };
  const proj = x => x.proj == null ? '—' : x.proj === Infinity ? 'sem queda' : nf(x.proj) + ' h' + cmpMeses(x.proj, x);
  const falta = x => { if (x.falta == null) return '—'; const d = cmpDias(Math.abs(x.falta), x); return `<span style="color:${x.vencida ? 'var(--badt)' : 'inherit'}">${x.vencida ? '−' : ''}${nf(Math.abs(x.falta))} h${d != null ? ' · ' + (x.vencida ? '−' : '') + d + ' d' : ''}</span>`; };
  const linha = x => `<tr class="click${cmpKey(x) === CF.sel ? ' cm-on' : ''}" data-cmsel="${cmpKey(x)}" title="${esc(x.mot.join(' · ') || 'Sem alerta')}"><td><b>${cmpNome(x)}</b></td><td class="mono r">${x.hr ? nf(x.hr.h) : '—'}</td>
    <td class="mono r">${x.u ? (x.u.h != null && x.u.h !== '' ? nf(+x.u.h) + ' · ' : '') + brD(x.u.date) : '—'}</td>
    <td class="mono r" style="color:${x.u && x.u.min < COMP.lim ? 'var(--badt)' : x.u && x.u.min < COMP.aten ? 'var(--warnt)' : 'inherit'}">${x.u ? `<b>${fMPa(x.u.min)}</b> C${x.u.cil} <span class="mut">{${kgf(x.u.min)}}</span>` : '—'}</td>
    <td class="mono r" style="color:${x.dif != null && x.dif > CMP.dif ? 'var(--warnt)' : 'inherit'}">${x.dif != null ? fMPa(x.dif) : '—'}</td><td class="mono r">${queda(x)}</td><td class="mono r">${proj(x)}</td>
    <td class="mono r">${x.prox != null ? nf(x.prox) : '—'}</td><td class="mono r">${falta(x)}</td>
    <td><span class="pill ${CMP_ST[x.st][0]}">${CMP_ST[x.st][1]}</span>${x.vencida ? ' <span class="pill p-bad">Vencida</span>' : ''}</td></tr>`;
  return `<div class="card"><div class="row"><h2>Matriz de compressão da frota</h2><span class="sp"></span><span class="note">MPa {kgf/cm²} · clique na linha para ver o detalhe</span></div>
   <div class="cm-chips">${Object.keys(nomes).map(k => `<button class="cm-chip${CF.f === k ? ' on' : ''}" data-cmf="${k}">${nomes[k]} <b>${cnt[k]}</b></button>`).join('')}</div>
   <div class="tw"><table class="t cm-t"><thead><tr><th>Embarcação</th><th class="r">Horímetro MCP</th><th class="r">Últ. medição</th><th class="r">Menor cil.</th><th class="r">Dif. cil.</th><th class="r">Queda /1.000 h</th><th class="r">Proj. até limite</th><th class="r">Próx. medição</th><th class="r">Falta</th><th>Status</th></tr></thead>
   <tbody>${F.map(linha).join('') || '<tr><td colspan="10" class="mut">Nenhum motor neste filtro.</td></tr>'}</tbody></table></div>
   <p class="note">Queda = inclinação das 3 últimas medições do pior cilindro, em MPa a cada 1.000 h · Projeção = horas até 1,27 MPa por essa reta (meses pelo uso real do horímetro) · Próx. medição = último ensaio + 1.000 h · Falta: negativo = vencido.</p></div>`;
}
function cmpDetalhe(D) {
  if (!CF.sel || !D.some(x => cmpKey(x) === CF.sel)) CF.sel = cmpKey(D[0] || { v: { id: '' }, pos: '' });
  const x = D.find(z => cmpKey(z) === CF.sel); if (!x) return '';
  const sel = `<select id="cmSel">${D.map(z => `<option value="${cmpKey(z)}"${cmpKey(z) === CF.sel ? ' selected' : ''}>${cmpNome(z).replace(/&amp;/g, '&')}</option>`).join('')}</select>`;
  const H = x.H.slice().reverse(), ud = cmpUsoDia(x.v.id, x.pos);
  const cel = (v, p) => v == null ? '<td class="mut r">—</td>' : `<td class="mono r" style="color:${v < COMP.lim ? 'var(--badt)' : v === p.min && p.max - p.min > CMP.dif ? 'var(--warnt)' : 'inherit'};font-weight:${v === p.min ? 700 : 400}" title="${fMPa(v)} MPa {${kgf(v)} kgf/cm²}">${fMPa(v)}</td>`;
  const tab = H.length ? `<table class="t cm-t"><thead><tr><th>Data</th><th class="r">Horímetro</th><th class="r">rpm</th>${[1, 2, 3, 4, 5, 6].map(i => `<th class="r">C${i}</th>`).join('')}<th>Origem</th></tr></thead><tbody>${H.map(p => `<tr><td>${brD(p.date)}</td><td class="mono r">${p.h != null && p.h !== '' ? nf(+p.h) : '—'}</td><td class="mono r">${p.rpm || '—'}</td>${[0, 1, 2, 3, 4, 5].map(i => cel(p.vals[i], p)).join('')}<td>${p.om ? `<a href="#om/${p.om}">${esc(p.src)}</a>` : esc(p.src)}</td></tr>`).join('')}</tbody></table>` : '<div class="note">Nenhum ensaio registrado para este motor.</div>';
  return `<div class="card"><div class="row"><h2>Detalhe por cilindro</h2><span class="sp"></span>${sel}<button class="mbtn sm" data-novacomp="${x.v.id}|${x.pos}">＋ Registrar compressão</button></div>
   <div class="row" style="gap:8px;margin:2px 0 8px"><span class="pill ${CMP_ST[x.st][0]}">${CMP_ST[x.st][1]}</span>${x.vencida ? '<span class="pill p-bad">Ensaio vencido</span>' : ''}<span class="note">Horímetro ${x.hr ? nf(x.hr.h) + ' h' : '—'}${ud ? ' · ' + nf(ud, 1) + ' h/dia' : ''}</span></div>
   <div class="cm-det"><div class="tw">${tab}<div class="cm-diag">${esc(cmpDiag(x))}</div></div><div>${cmpGrafDet(x)}<p class="note">Azul: pior cilindro · cinza: demais cilindros · laranja: projeção · vermelho: limite 1,27 MPa (SM p. 2-3). Passe o mouse nos pontos para ver os valores.</p></div></div></div>`;
}
function cmpGrafDet(x) {
  const P = x.H.filter(p => p.h != null && p.h !== '' && isFinite(+p.h)); if (!P.length) return '<div class="note" style="padding:30px 0">Sem medições com horímetro.</div>';
  const W = 460, Hh = 230, L = 40, R = 14, T = 10, B = 26, h0 = Math.min(...P.map(p => +p.h)), pj = x.proj != null && x.proj !== Infinity ? +P[P.length - 1].h + x.proj : null;
  const h1 = Math.max(...P.map(p => +p.h), pj || 0, +P[P.length - 1].h + 500), y0 = 1.1, y1 = 2.0, X = h => L + (h - h0) / ((h1 - h0) || 1) * (W - L - R), Y = v => T + (y1 - Math.max(y0, Math.min(y1, v))) / (y1 - y0) * (Hh - T - B);
  let s = [[1.8, '#188038', '4 3'], [COMP.lim, '#D93025', '']].map(([v, c, d]) => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c}" ${d ? `stroke-dasharray="${d}"` : ''}/><text x="${W - R}" y="${Y(v) - 3}" font-size="9.5" text-anchor="end" fill="${c}">${v === 1.8 ? 'padrão 1,8' : 'limite 1,27'}</text>`).join('');
  for (let v = 1.1; v <= 2.0001; v += 0.2) s += `<text x="${L - 5}" y="${Y(v) + 3}" font-size="9.5" text-anchor="end" fill="#5F6368">${v.toFixed(1).replace('.', ',')}</text>`;
  [0, 1, 2, 3, 4, 5].forEach(c => { const pts = P.filter(p => p.vals[c] != null); if (pts.length > 1) s += `<polyline fill="none" stroke="#C4C9D0" stroke-width="1.2" points="${pts.map(p => X(+p.h) + ',' + Y(p.vals[c])).join(' ')}"><title>Cilindro ${c + 1}</title></polyline>`; });
  s += `<polyline fill="none" stroke="#1967D2" stroke-width="2.4" points="${P.map(p => X(+p.h) + ',' + Y(p.min)).join(' ')}"/>`;
  s += P.map(p => `<circle cx="${X(+p.h)}" cy="${Y(p.min)}" r="4" fill="#1967D2"><title>${brD(p.date)} · ${nf(+p.h)} h${p.rpm ? ' · ' + p.rpm + ' rpm' : ''}\n${p.vals.map((v, i) => 'C' + (i + 1) + ' ' + (v == null ? '—' : fMPa(v))).join('  ')}\npior: C${p.cil} ${fMPa(p.min)} MPa {${kgf(p.min)} kgf/cm²}</title></circle>`).join('');
  if (pj) { const u = P[P.length - 1]; s += `<line x1="${X(+u.h)}" y1="${Y(u.min)}" x2="${X(pj)}" y2="${Y(COMP.lim)}" stroke="#E37400" stroke-width="2" stroke-dasharray="5 4"/><circle cx="${X(pj)}" cy="${Y(COMP.lim)}" r="4" fill="#E37400"><title>Projeção: ${nf(pj)} h atinge 1,27 MPa (~${nf(x.proj)} h a partir do último ensaio)</title></circle>`; }
  s += `<text x="${L}" y="${Hh - 6}" font-size="9.5" fill="#5F6368">${nf(h0)} h</text><text x="${W - R}" y="${Hh - 6}" font-size="9.5" text-anchor="end" fill="#5F6368">${nf(h1)} h</text>`;
  return `<svg viewBox="0 0 ${W} ${Hh}" style="width:100%;height:auto" role="img" aria-label="Compressão por cilindro × horímetro">${s}</svg>`;
}
function cmpHist(D) {
  const ini = CF.per ? addM(hoje(), -CF.per) : (() => { const ds = D.flatMap(x => x.H.map(p => pD(p.date))); return ds.length ? new Date(Math.min(...ds)) : addM(hoje(), -12); })(), fim = addM(hoje(), 3);
  const lista = CF.hv ? D.filter(x => cmpKey(x) === CF.hv) : D.filter(x => x.H.length);
  const W = 940, Hh = 300, L = 46, R = 210, T = 14, B = 30, y0 = 1.1, y1 = 2.0, X = d => L + (pD(d) - ini) / (fim - ini) * (W - L - R), Y = v => T + (y1 - Math.max(y0, Math.min(y1, v))) / (y1 - y0) * (Hh - T - B);
  let s = ''; const passo = CF.per && CF.per <= 12 ? 2 : 3, nm = Math.ceil((fim - ini) / (864e5 * 30.4));
  for (let m = 0; m <= nm; m += passo) { const d = addM(ini, m); const x = X(isoD(d)); s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${Hh - B}" stroke="#EEF1F4"/><text x="${x}" y="${Hh - B + 16}" font-size="10" text-anchor="middle" fill="#5F6368">${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}</text>`; }
  for (let v = 1.1; v <= 2.0001; v += 0.1) s += `<text x="${L - 6}" y="${Y(v) + 3}" font-size="10" text-anchor="end" fill="#5F6368">${v.toFixed(1).replace('.', ',')}</text>`;
  [[1.8, '#188038', 'padrão 1,8 MPa · SM p. 2-3'], [COMP.aten, '#B06000', 'programar 1,45 · critério interno'], [COMP.lim, '#D93025', 'limite 1,27 MPa · SM p. 2-3']].forEach(([v, c, t]) => { s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c}" stroke-dasharray="5 4"/><text x="${W - R + 6}" y="${Y(v) + 3}" font-size="10" fill="${c}">${t}</text>`; });
  const xh = X(isoD(hoje())); s += `<line x1="${xh}" x2="${xh}" y1="${T}" y2="${Hh - B}" stroke="#9AA0A6" stroke-dasharray="3 3"/><text x="${xh + 3}" y="${T + 9}" font-size="10" fill="#5F6368">hoje</text>`;
  const leg = [];
  lista.forEach((x, i) => { const c = CMP_COR[D.indexOf(x) % CMP_COR.length], P = x.H.filter(p => pD(p.date) >= ini);
    if (P.length) s += `<polyline fill="none" stroke="${c}" stroke-width="${CF.hv ? 2.6 : 1.8}" points="${P.map(p => X(p.date) + ',' + Y(p.min)).join(' ')}"/>` + P.map(p => `<circle cx="${X(p.date)}" cy="${Y(p.min)}" r="3.2" fill="#fff" stroke="${c}" stroke-width="1.8"><title>${cmpNome(x).replace(/&amp;/g, '&')} · ${brD(p.date)}${p.h != null && p.h !== '' ? ' · ' + nf(+p.h) + ' h' : ''} · C${p.cil} ${fMPa(p.min)} MPa {${kgf(p.min)} kgf/cm²}</title></circle>`).join('');
    if (x.falta != null) { const ud = cmpUsoDia(x.v.id, x.pos) || 20, dp = x.vencida ? hoje() : new Date(Date.now() + x.falta / ud * 864e5), px = X(isoD(dp)); if (px <= W - R) s += `<path d="M${px - 4},${Hh - B - 2} L${px + 4},${Hh - B - 2} L${px},${Hh - B - 9} Z" fill="${x.vencida ? '#D93025' : c}"><title>${cmpNome(x).replace(/&amp;/g, '&')} · próxima medição ${x.vencida ? 'VENCIDA' : '≈ ' + brD(isoD(dp))} (${nf(x.prox)} h)</title></path>`; }
    leg.push(`<button class="cm-lg${CF.hv === cmpKey(x) ? ' on' : ''}" data-cmhv="${cmpKey(x)}"><i style="background:${c}"></i>${cmpNome(x)} ${x.u ? '<b>' + fMPa(x.u.min) + '</b>' : ''}</button>`); });
  const opts = `<select id="cmHv"><option value="">Frota (geral)</option>${D.map(x => `<option value="${cmpKey(x)}"${CF.hv === cmpKey(x) ? ' selected' : ''}>${cmpNome(x).replace(/&amp;/g, '&')}</option>`).join('')}</select>`;
  return `<div class="card"><div class="row"><h2>Histórico de compressão</h2><span class="sp"></span>${[[12, '12 meses'], [24, '24 meses'], [0, 'Tudo']].map(([k, t]) => `<button class="cm-chip${CF.per === k ? ' on' : ''}" data-cmper="${k}">${t}</button>`).join('')}${opts}</div>
   <div class="cm-gw"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Histórico da compressão do pior cilindro">${s}</svg></div><div class="cm-leg">${leg.join('')}</div>
   <p class="note">Uma linha por motor = pior cilindro de cada ensaio · clique no nome para destacar · triângulo = próxima medição prevista (vermelho = vencida) · passe o mouse nos pontos para ver os valores.</p></div>`;
}
function cmpParam() {
  // o que o fabricante diz, documento por documento (Service Manual S6R/S6R2 Pub. 29202-00120 e Manual de O&M S6R2-MPTK2 Pub. 99410-15100)
  const man = [
    ['Service Manual S6R2-MPTK, p. 2-3', 'Padrão <b>1,8 MPa {18,5 kgf/cm²}</b>, limite <b>1,27 MPa {13 kgf/cm²}</b>, medidos na partida (~120 rpm).'],
    ['Service Manual, p. 4-4', 'Medir <b>todos</b> os cilindros, porque "os cilindros são todos independentes"; conferir a rotação (a pressão varia com ela); medir em intervalos regulares e acompanhar a variação; acima do limite, inspeção de overhaul. <b>Não traz diferença máxima entre cilindros.</b>'],
    ['Service Manual, p. 4-3', 'Overhaul por queda de compressão, apoiado nos sintomas: potência, consumo de combustível e de óleo, blow-by, vedação das válvulas, ruído e cor do escape. Sem intervalo em horas.'],
    ['Service Manual, cap. 3 (ferramentas)', 'Manômetro P/N 33A91-01700, escala de <b>0 a 7 MPa {0 a 71 kgf/cm²}</b>; adaptador P/N 37591-12200.'],
    ['Manual de O&amp;M S6R2-MPTK2, cap. 5', 'Inspeção dos bicos injetores a cada <b>1.000 h</b> — o ensaio é feito pelo furo do bico, por isso acompanha esse intervalo.'],
  ];
  const crit = [['p-bad', 'Fora do limite', 'cilindro abaixo de 1,27 MPa {13 kgf/cm²} — valor do fabricante'], ['p-warn', 'Programar overhaul', 'menor cilindro abaixo de 1,45 MPa {14,8 kgf/cm²} ou projeção de menos de 2.000 h até o limite'], ['p-warn', 'Atenção', 'diferença acima de 0,18 MPa {1,8 kgf/cm²} entre cilindros, ou queda de 0,15 MPa ou mais desde o ensaio anterior'], ['p-ok', 'OK', 'demais casos'], ['p-mut', 'Sem base', 'nenhum ensaio registrado'], ['p-bad', 'Vencida', 'mais de 1.000 h desde o último ensaio']];
  return `<div class="card"><h2>Parâmetros, critérios e método</h2>
   <div class="tw"><table class="t cm-man"><thead><tr><th>Documento</th><th>O que diz</th></tr></thead><tbody>${man.map(([d, t]) => `<tr><td><b>${d}</b></td><td>${t}</td></tr>`).join('')}</tbody></table></div>
   <p class="note">Manuais na pasta MANUAIS_FABRICANTE\\MITSUBISHI\\MANUAL DE OPERAÇÃO. O treinamento Mitsubishi "Training PT 2025" (seção "Necessidade de overhaul") repete 1,8 / 1,27 MPa a 120 rpm, também sem diferença entre cilindros.</p>
   <div class="cm-par" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:12px">
   <div><h3>Critérios internos</h3><ul class="cm-cr">${crit.map(([c, t, d]) => `<li><span class="pill ${c}">${t}</span> ${esc(d)}</li>`).join('')}</ul>
    <p class="note">Não constam do manual da S6R2 (Anexo I item 1.1.12). Diferença entre cilindros: 10% do padrão (0,18 MPa sobre 1,8 MPa), a mesma proporção do valor publicado num manual Mitsubishi de outra família de motores (0,29 MPa {3,0 kgf/cm²} sobre padrão de 2,9 MPa) e da prática de mercado de 10%. 1,45 MPa, 0,15 MPa e a projeção são critérios de programação da VDA.</p></div>
   <div><h3>Método</h3><p>Medir os <b>6 cilindros</b> a cada <b>1.000 h</b>, aproveitando a retirada dos bicos (item 1.1.12).</p>
    <p>Partida com a injeção cortada, bateria carregada, ~120 rpm, manômetro P/N 33A91-01700 com adaptador. Registrar a <b>rotação</b> e o <b>horímetro</b> (SM p. 4-4).</p>
    <p class="note">Lançamento: a OM do item 1.1.12 encerrada com os 6 cilindros entra sozinha; testes avulsos em "＋ Nova medição" (aceita MPa ou kgf/cm²).</p></div></div></div>`;
}
function vCompr() {
  const D = cmpDados();
  return `<div class="cm-v"><div class="vh"><div><h1>Controle de compressão · MCP</h1><p>Mitsubishi S6R2 · padrão 1,8 MPa {18,5 kgf/cm²} · limite 1,27 MPa {13 kgf/cm²} @ ~120 rpm (SM p. 2-3) · ensaio a cada 1.000 h</p></div><span class="sp"></span><button class="mbtn" data-cmreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button><button class="mbtn pri" data-novacomp>＋ Nova medição</button></div>`
    + '<div class="cm-ws">' + cmpMatriz(D) + cmpDetalhe(D) + cmpHist(D) + cmpParam() + '</div></div>';
}
VX.compr = vCompr;
AFTER.compr = () => { const m = $('#main');
  m.onclick = e => { const t = e.target;
    const nc = t.closest('[data-novacomp]'); if (nc) { const [v, p] = (nc.dataset.novacomp || '').split('|'); compModal(v || undefined, p || undefined); return; }
    const f = t.closest('[data-cmf]'); if (f) { CF.f = f.dataset.cmf; render(); return; }
    const pe = t.closest('[data-cmper]'); if (pe) { CF.per = +pe.dataset.cmper; render(); return; }
    const hv = t.closest('[data-cmhv]'); if (hv) { CF.hv = CF.hv === hv.dataset.cmhv ? '' : hv.dataset.cmhv; render(); return; }
    const s = t.closest('[data-cmsel]'); if (s && !t.closest('a')) { CF.sel = s.dataset.cmsel; render(); const d = $('#cmSel'); if (d) d.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  m.onchange = e => { if (e.target.id === 'cmSel') { CF.sel = e.target.value; render(); } if (e.target.id === 'cmHv') { CF.hv = e.target.value; render(); } };   cmpJanelas();
};
// blocos como janelas (igual ao Óleo): alça para qualquer tamanho, minimizar e tela cheia para apresentação; tamanhos salvos neste aparelho
// usado pela Compressão e pelo Cronograma: cada tela guarda o seu arranjo numa chave própria
const JLAY = k => ({ G() { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } }, S(v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } });
function janelasLivres(ws, chave, resetSel) {
  if (!ws) return; const LS = JLAY(chave);
  const rb = document.querySelector(resetSel); if (rb) rb.onclick = e => { e.stopPropagation(); LS.S({}); render(); };
  const livre = innerWidth > 760; if (livre) ws.classList.add('cm-wide');   // libera a largura total da tela antes de medir
  const cards = [...ws.children].filter(c => c.classList.contains('card')), L = LS.G(), W = ws.clientWidth;
  const nat = cards.map(c => ({ x: 0, y: c.offsetTop, w: W, h: c.offsetHeight }));   // padrão: empilhados na ordem da tela
  const pos = k => L[k] || (L[k] = Object.assign({}, nat[+k.slice(1)]));
  const salva = () => LS.S(L);
  const alinha = () => { const m = document.getElementById('main'); if (!m) return;   // cabeçalho e barra "Próximo" na mesma largura das janelas
    const R = cards.filter(c => c.offsetParent).map(c => c.getBoundingClientRect()); if (!livre || !R.length) { m.style.removeProperty('--ws-esq'); m.style.removeProperty('--ws-larg'); return; }
    const x0 = m.getBoundingClientRect().left + (parseFloat(getComputedStyle(m).paddingLeft) || 0), esq = Math.max(0, Math.min(...R.map(r => r.left)) - x0);
    m.style.setProperty('--ws-esq', esq + 'px'); m.style.setProperty('--ws-larg', (Math.max(...R.map(r => r.right)) - x0 - esq) + 'px'); };
  const fundo = () => { if (livre) ws.style.height = Math.max(...cards.map(c => { const p = pos(c.dataset.k); return p.y + (p.m ? c.offsetHeight : p.h); })) + 12 + 'px'; alinha(); };
  const aplica = c => { const p = pos(c.dataset.k); c.classList.toggle('cm-min', !!p.m); if (!livre) return;
    c.style.left = p.x + 'px'; c.style.top = p.y + 'px'; c.style.width = p.w + 'px'; c.style.height = p.m ? '' : p.h + 'px'; };
  let z = 5;
  cards.forEach((c, i) => {
    const k = 'b' + i; c.dataset.k = k; c.classList.add('cm-win');
    const tb = document.createElement('div'); tb.className = 'cm-tb';
    tb.innerHTML = `${livre ? '<span class="cm-grip" title="Arraste para mover o bloco">⋮⋮</span>' : ''}<button class="cm-ib" data-cmmin title="Minimizar">${(L[k] || {}).m ? '+' : '–'}</button><button class="cm-ib" data-cmfull title="Tela cheia (apresentação)">⛶</button>`;
    c.prepend(tb); if (livre) c.insertAdjacentHTML('beforeend', '<div class="cm-rz" title="Arraste para mudar o tamanho"></div>');
    tb.querySelector('[data-cmmin]').onclick = e => { e.stopPropagation(); const p = pos(k); p.m = !p.m; e.currentTarget.textContent = p.m ? '+' : '–'; aplica(c); fundo(); salva(); };
    tb.querySelector('[data-cmfull]').onclick = e => { e.stopPropagation(); const fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (fs || c.classList.contains('cm-full')) { if (fs) (document.exitFullscreen || document.webkitExitFullscreen).call(document); c.classList.remove('cm-full'); return; }
      const rq = c.requestFullscreen || c.webkitRequestFullscreen; if (rq) rq.call(c).catch(() => c.classList.add('cm-full')); else c.classList.add('cm-full'); };
  });
  cards.forEach(aplica);
  if (!livre) return;
  ws.classList.add('cm-free'); cards.forEach(aplica); fundo();
  cards.forEach(c => { const k = c.dataset.k;
    c.addEventListener('pointerdown', () => { c.style.zIndex = ++z; });
    const mover = e => { if (e.button !== 0 || (e.target.closest('button,select,input,a,textarea,option') && !e.target.closest('.cm-grip'))) return;
      e.preventDefault(); const el = e.currentTarget, p = pos(k), sx = e.clientX, sy = e.clientY, ox = p.x, oy = p.y; el.setPointerCapture(e.pointerId); c.classList.add('cm-drag');
      const mv = ev => { p.x = Math.max(0, ox + ev.clientX - sx); p.y = Math.max(0, oy + ev.clientY - sy); aplica(c); fundo(); };
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); c.classList.remove('cm-drag'); salva(); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); };
    c.querySelector('.cm-grip').addEventListener('pointerdown', mover);
    const hd = c.children[1]; if (hd && !hd.classList.contains('cm-rz')) { hd.classList.add('cm-hd'); hd.addEventListener('pointerdown', mover); }
    const rz = c.querySelector('.cm-rz');
    rz.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const p = pos(k), sx = e.clientX, sy = e.clientY, ow = p.w, oh = p.m ? c.offsetHeight : p.h; rz.setPointerCapture(e.pointerId);
      const mv = ev => { p.w = Math.max(300, ow + ev.clientX - sx); p.h = Math.max(90, oh + ev.clientY - sy); p.m = false; aplica(c); fundo(); };
      const up = () => { rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); salva(); };
      rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up); });
  });
}
function cmpJanelas() { janelasLivres(document.querySelector('#main .cm-ws'), 'smf_cmp_lay', '[data-cmreset]'); }
// menu: logo depois de Óleo
{ const i = SECOES.findIndex(s => s.id === 'oleo'); SECOES.splice(i < 0 ? 1 : i + 1, 0, { id: 'compr', nome: 'Compressão MCP', views: [['compr', 'Compressão do MCP']] });
  ICO.compr = '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4"/><path d="M9 3h6"/>'; }
// Hoje: motor fora do limite e ensaio vencido (P1) · overhaul a programar (P2)
// troca uma única vez os exemplos de compressão já guardados no aparelho (só registros de exemplo)
{ let n = 0; const t = setInterval(async () => { if (++n > 200) return clearInterval(t); if (typeof S === 'undefined' || !S.pronto || !S.cfg || !S.recs.size || !(DB.db || MEM)) return; clearInterval(t);
    try { if (!temExemplo() || (await kvGet('cmpExV')) === 3) return;
      for (const r of recs('comp').filter(r => r.seed)) { S.recs.delete(r.id); if (MEM) MEM.delete(r.id); else await DB.del(r.id); }
      const l = exemploComp().filter(r => r.kind === 'comp'); l.forEach(r => { r.updatedAt = r.createdAt = Date.now(); S.recs.set(r.id, r); }); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l);
      await kvSet('cmpExV', 3); render(); } catch (e) { console.warn(e); } }, 300); }
{ const st = document.createElement('style'); st.textContent = `.cm-ws{position:relative}.cm-ws.cm-free>.card{position:absolute;margin:0!important;box-sizing:border-box}.cm-v .card.cm-win{position:relative;overflow:auto;min-width:300px;min-height:70px}body:has(.cm-ws.cm-wide) #main{max-width:none!important;margin-left:0!important;margin-right:0!important}#main .cm-ws.cm-free>.card.cm-win{position:absolute}#main .card>.cm-tb{position:absolute}#main .card>.cm-rz{position:sticky}.cm-grip{cursor:grab;color:#9AA0A6;padding:2px 6px;letter-spacing:-2px;user-select:none;touch-action:none;font-size:13px}.cm-hd{cursor:grab;user-select:none}.cm-drag{box-shadow:0 12px 32px rgba(22,33,44,.22)!important;opacity:.96}.cm-drag,.cm-drag .cm-hd{cursor:grabbing}.cm-rz{position:sticky;bottom:0;align-self:flex-end;flex:none;width:16px;height:16px;margin:-16px -10px -8px auto;cursor:nwse-resize;touch-action:none;z-index:4;background:linear-gradient(135deg,transparent 50%,#9AA0A6 50%,#9AA0A6 56%,transparent 56%,transparent 68%,#9AA0A6 68%,#9AA0A6 74%,transparent 74%)}.cm-win.cm-min .cm-rz,.cm-win:fullscreen .cm-rz,.cm-win.cm-full .cm-rz{display:none}.cm-tb{position:absolute;top:6px;right:8px;display:flex;gap:2px;z-index:3}.cm-ib{border:0;background:transparent;width:26px;height:24px;border-radius:5px;cursor:pointer;color:var(--mut);font-size:15px;line-height:1;padding:0;min-height:0;box-shadow:none}.cm-ib:hover{background:#E8EAED}.cm-win>.row:nth-child(2),.cm-win>h2:nth-child(2){padding-right:86px}.cm-win.cm-min{height:auto!important;min-height:0}.cm-win.cm-min>:not(.cm-tb):not(:nth-child(2)){display:none!important}
 .cm-gw{flex:1;min-height:0;display:flex}.cm-gw svg{width:100%;height:100%;min-height:180px}
 .cm-win:fullscreen,.cm-win.cm-full{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;margin:0!important;border-radius:0;z-index:9999;background:#fff;padding:18px 26px!important;resize:none;overflow:auto;font-size:15px}.cm-win:fullscreen h2,.cm-win.cm-full h2{font-size:22px}.cm-win:fullscreen .t td,.cm-win:fullscreen .t th,.cm-win.cm-full .t td,.cm-win.cm-full .t th{font-size:15px!important;padding:5px 10px!important}.cm-win:fullscreen .cm-gw svg,.cm-win.cm-full .cm-gw svg{max-height:calc(100vh - 170px)}.cm-win:fullscreen .cm-det svg,.cm-win.cm-full .cm-det svg{max-height:calc(100vh - 200px)}.cm-win:fullscreen .note,.cm-win:fullscreen p,.cm-win:fullscreen li{font-size:14px}
 @media(max-width:760px){#main .cm-v .card.cm-win{position:relative!important;left:auto!important;top:auto!important;width:auto!important;height:auto!important}}
 .cm-v .vh{margin-bottom:8px}.cm-v .vh p{margin:2px 0 0}.cm-v .card{padding:10px 14px;margin-bottom:10px;gap:4px}.cm-v .card h2{margin:0 0 4px}.cm-v .row{margin-bottom:2px}.cm-v .t th,.cm-v .t td{padding:3px 8px;line-height:1.25}.cm-v .note{margin:4px 0 0;line-height:1.3}.cm-v p{margin:0 0 4px;line-height:1.3}.cm-v h3{margin:0 0 4px}.cm-v .cm-chips{margin:2px 0 6px;gap:4px}.cm-v .cm-chip{padding:1px 9px}.cm-v .cm-cr{gap:3px;margin-bottom:4px}.cm-v .cm-cr li{line-height:1.3}.cm-v .cm-diag{margin-top:6px;padding:5px 10px;line-height:1.3}.cm-v .cm-leg{margin-top:4px;gap:4px}.cm-v .cm-lg{padding:1px 8px}.cm-v .cm-det{gap:12px}.cm-v .cm-par{gap:14px}.cm-v .cm-par[style]{margin-top:8px!important}.cm-man td{white-space:normal!important;vertical-align:top}.cm-man td:first-child{width:230px}#cmSel,#cmHv{width:auto;min-width:190px;max-width:260px}.cm-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.cm-chip{border:1px solid #DADCE0;background:#fff;border-radius:16px;padding:3px 11px;font:inherit;font-size:12.5px;cursor:pointer}.cm-chip b{color:var(--mut);font-weight:600}.cm-chip.on{background:#E8F0FE;border-color:#1967D2;color:#1967D2}.cm-chip.on b{color:#1967D2}.cm-t td,.cm-t th{white-space:nowrap}.cm-t .r{text-align:right}.cm-t tr.cm-on td{background:#E8F0FE}.cm-det{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px;align-items:start}@media(max-width:1000px){.cm-det{grid-template-columns:1fr}}.cm-diag{margin-top:8px;padding:9px 12px;border-left:3px solid #1967D2;background:#F3F7FD;border-radius:6px;font-size:13px}.cm-leg{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.cm-lg{border:1px solid #DADCE0;background:#fff;border-radius:14px;padding:2px 9px;font:inherit;font-size:12px;cursor:pointer}.cm-lg.on{border-color:#1967D2;background:#E8F0FE}.cm-lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}.cm-par{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}@media(max-width:1000px){.cm-par{grid-template-columns:1fr}}.cm-par h3{font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px}.cm-par p{font-size:13px;margin:0 0 8px}.cm-cr{list-style:none;padding:0;margin:0 0 8px;display:flex;flex-direction:column;gap:6px;font-size:13px}`; document.head.appendChild(st); }
{ const st = document.createElement('style'); st.textContent = `a[href="#rel"],a[href="#apres"],button[onclick*="go('rel')"],button[onclick*="go('apres')"]{display:none!important}`; document.head.appendChild(st); }
