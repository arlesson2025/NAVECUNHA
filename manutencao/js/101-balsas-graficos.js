'use strict';
/* ===== Balsas: gráficos das telas 1.1, 1.2, 2.2, 3.1, 3.2 e 3.3 (SMF 3.160, Supervisor 02/11/2026: “estão sem gráficos… de não ter visto como é nos empurradores?”) =====
   Cada gráfico é o mesmo desenho que os empurradores já têm, com os dados das balsas (prévia aprovada pelo Supervisor):
   1.1 Pareto de horas do motor-bomba por balsa (hpGrupos, como a 1.1) e horas da frota por mês (lineChart) · 1.2 corretivas por mês empilhadas por classe (stackChart)
   2.2 linha do tempo em horas da balsa escolhida (classes elt, como a 2.2) · 3.1 docagem histórico e projeção (classes dh, como a aba 6 Docagem)
   3.2 dias até a próxima calibração e 3.3 pior cilindro contra o mínimo, em barras de atraso e saldo (classes ol-sg, como a calibração dos empurradores).
   As telas chamam estas funções (vBalHor, vBalCor, vBalProg, vBalDoca, vBalCal, vBalCmp). */
const BALHP = { mes: 0 };
const balEmRef = b => { try { return balEstado(b).st === 'ref'; } catch (e) { return false; } };
function balMesIni(k) { const h = hoje(); return new Date(h.getFullYear(), h.getMonth() - k, 1); }
// ---------- 1.1 · horas de operação do motor-bomba ----------
// horas no período pela mesma conta da 1.1 dos empurradores (rmeHoras: soma leitura a leitura e reparte o intervalo entre duas leituras pelos dias de cada mês)
const balHorP = (I, vid, a, b) => typeof rmeHoras === 'function' ? rmeHoras(I, vid, 'MB', isoD(a), isoD(b)).h || 0 : 0;
function balHorGraf() {
  const I = typeof rmeHorIdx === 'function' ? rmeHorIdx() : {}, a = balMesIni(BALHP.mes), b = BALHP.mes ? new Date(+balMesIni(0) - 864e5) : hoje(), ref = MESES[a.getMonth()] + '/' + a.getFullYear();
  const V = BALSAS.filter(x => !balEmRef(x)).map(x => [x.nome, Math.round(balHorP(I, x.id, a, b))]), C = V.filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]), tot = C.reduce((s, x) => s + x[1], 0);
  const bt = (k, t) => `<button class="cm-chip${BALHP.mes === k ? ' on' : ''}" data-bhpm="${k}">${t}</button>`;
  const leg = `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><i style="display:inline-block;width:9px;height:9px;background:#0B2A5B"></i>horas do motor-bomba no mês</span><span style="display:inline-flex;align-items:center;gap:4px"><i style="display:inline-block;width:12px;height:1px;background:#E07B24"></i>horas somadas balsa a balsa (no fim, o total da frota)</span>`;
  const par = `<div class="card"><h2>Horas de operação do motor-bomba por balsa · ${ref}</h2><p class="note" style="margin:0 0 4px">Total da frota: <b>${nf(tot)} h</b> no mês · ${C.length} de ${V.length} balsas com horas · da que mais rodou para a que menos rodou · linha tracejada = 80% das horas</p>
    <div class="cm-chips" style="margin:0 0 6px">${bt(0, 'Este mês')}${bt(1, 'Mês passado')}</div>${C.length ? hpGrupos(C.map(x => [x[0], [['MB', x[1]]], x[1]]), ['#0B2A5B'], { p80: true }) + `<p class="note" style="text-align:center;margin:2px 0 0">${leg}</p>` : '<p class="note">Sem horas lançadas no período.</p>'}
    <p class="note">Horas pelas leituras do motor-bomba, a mesma conta dos empurradores: o intervalo entre duas leituras é repartido pelos dias de cada mês · balsa sem leitura no mês entra com 0 h e fica fora do gráfico · balsa em reforma fica fora.</p></div>`;
  const M = [...Array(12).keys()].map(i => { const d = balMesIni(11 - i), f = i === 11 ? hoje() : new Date(+balMesIni(10 - i) - 864e5); return [MESES[d.getMonth()] + '/' + String(d.getFullYear()).slice(2), d, f]; });
  const T = M.map(([, d, f]) => Math.round(BALSAS.reduce((s, x) => s + balHorP(I, x.id, d, f), 0))), t12 = T.reduce((s, x) => s + x, 0), med = Math.round(t12 / 12);
  const lin = `<div class="card"><h2>Horas de operação das balsas por mês</h2><p class="note" style="margin-top:0">${BALSAS.length} balsas · 12 meses: <b>${nf(t12)} h</b> · média <b>${nf(med)} h/mês</b> · linha tracejada = média</p>
    ${t12 ? lineChart(T, M.map(x => x[0]), med, ' h', 0, { h: 190 }).replace(/(lnc-p(?: u)?) f"/g, '$1"').replace(/>meta /, '>média ') : '<p class="note">Sem leituras de horímetro nos últimos 12 meses.</p>'}
    <p class="note">Frota = soma das horas do motor-bomba de todas as balsas no mês · lance as leituras na chegada para a curva ficar certa.</p></div>`;
  return par + lin;
}
document.addEventListener('click', e => { if (VIEW !== 'balhor') return; const t = e.target.closest('[data-bhpm]'); if (!t) return; e.preventDefault(); e.stopPropagation(); BALHP.mes = +t.dataset.bhpm; render(); }, true);
// ---------- 1.2 · corretivas por mês, empilhadas por classe ----------
function balCorMesGraf(F) {
  const ms = mesesAte(12), cls = [['Crítica', '#D93025'], ['Alta', '#F9AB00'], ['Média e baixa', '#7FA8D6']], mk = r => { const d = new Date(balAt(r)); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  const de = (r, c) => c === 'Média e baixa' ? r.c !== 'Crítica' && r.c !== 'Alta' : r.c === c, ser = cls.map(([c, cor]) => ({ nome: c, cor, vals: ms.map(m => F.filter(r => mk(r) === m.k && de(r, c)).length) }));
  const n = ser.reduce((s, x) => s + x.vals.reduce((a, v) => a + v, 0), 0);
  return `<div class="card"><h2>Falhas registradas por mês · por classe</h2><p class="note" style="margin-top:0">12 meses: <b>${n}</b> falha${n === 1 ? '' : 's'} (${ser.map(x => x.nome.toLowerCase() + ' ' + x.vals.reduce((a, v) => a + v, 0)).join(' · ')}) · pela data em que a falha foi registrada</p>
    ${stackChart(ms.map(m => m.lab), ser, '')}<div class="clegend note">${cls.map(([c, cor]) => `<span><i style="background:${cor}"></i>${c}</span>`).join('')}</div>
    <p class="note">O Pareto por equipamento, o modo e a causa ficam na aba Análise de falhas.</p></div>`;
}
// ---------- 2.2 · linha do tempo em horas da balsa escolhida ----------
function balLinhaTempo(b, I) {
  const hr = balHor(b.id), tx = balTaxa(b.id) || 0, dias = hr ? Math.max(0, Math.round((pD(isoD(hoje())) - pD(hr.date)) / 864e5)) : null, velho = dias == null || dias > 14, lim30 = Math.max(BAL_PROX_H, Math.round(tx * 30));
  const L = I.filter(x => x.s.rest != null).map(x => ({ t: x.t, r: Math.round(x.s.rest) }));
  if (!hr) return `<div class="card"><h2>Linha do tempo em horas · ${esc(b.nome)}</h2><p class="note">Sem leitura do horímetro do motor-bomba: lance em 1.1 Horímetros.</p></div>`;
  const ini = Math.max(-300, Math.min(0, ...L.map(z => z.r))), fim = 1000, W = 700, E = 46, D = 20, X = h => E + (W - E - D) * (Math.max(ini, Math.min(fim, h)) - ini) / (fim - ini);
  const G = {}, alem = L.filter(z => z.r > fim); L.filter(z => z.r <= fim).forEach(z => { const k = Math.round(Math.max(z.r, ini) / 25) * 25; (G[k] = G[k] || []).push(z); });
  const cor = r => velho ? '#9AA0A6' : r < 0 ? '#C5221F' : r <= lim30 ? '#B06000' : '#16244A';
  let g = ini < 0 ? `<rect x="${X(ini)}" y="30" width="${X(0) - X(ini)}" height="34" fill="#FCE8E6"/><text x="${X(ini) + 4}" y="27" font-size="9.5" fill="#C5221F">vencido</text>` : '';
  if (lim30 > 0 && !velho) g += `<rect x="${X(0)}" y="30" width="${Math.max(0, X(lim30) - X(0))}" height="34" fill="#FEF3E0"/><text x="${X(0) + 4}" y="27" font-size="9.5" fill="#B06000">próximos 30 dias · ~${nf(lim30)} h${tx ? ' no ritmo de ' + nf(tx, 1) + ' h/dia' : ''}</text>`;
  g += `<line x1="${E}" x2="${W - D}" y1="47" y2="47" stroke="#1F2A44" stroke-width="1"/><line x1="${X(0)}" x2="${X(0)}" y1="24" y2="70" stroke="#1F2A44" stroke-width="1.5"/><text x="${X(0)}" y="84" text-anchor="middle" font-size="10" font-weight="700" fill="#1F2A44">agora · ${nf(hr.h)} h</text>`;
  [250, 500, 750, 1000].filter(h => X(h) - X(0) > 40).forEach(h => { g += `<line x1="${X(h)}" x2="${X(h)}" y1="44" y2="50" stroke="#9AA0A6"/><text x="${X(h)}" y="84" text-anchor="middle" font-size="9" fill="#5F6368">+${nf(h)} h</text>`; });
  Object.entries(G).forEach(([k, Z]) => { const r = Math.min(...Z.map(z => z.r)), cx = X(+k), n = Z.length, rad = n > 1 ? 8 : 5.5;
    g += `<g><title>${esc(Z.map(z => z.t.serv + ' · ' + (z.r < 0 ? 'vencido há ' + nf(-z.r) + ' h' : 'em ' + nf(z.r) + ' h')).join('\n'))}</title><circle cx="${cx}" cy="47" r="${rad}" fill="${cor(r)}"/>${n > 1 ? `<text x="${cx}" y="50.5" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">${n}</text>` : ''}</g>`; });
  if (alem.length) g += `<text x="${W - D}" y="66" text-anchor="end" font-size="9" fill="#5F6368">+ ${alem.length} depois de ${nf(fim)} h</text>`;
  const venc = L.filter(z => z.r < 0).sort((a, b) => a.r - b.r), logo = L.filter(z => z.r >= 0 && z.r <= lim30).sort((a, b) => a.r - b.r);
  return `<div class="card"><h2>Linha do tempo em horas · ${esc(b.nome)}</h2><p class="note" style="margin-top:0">Serviços do motor-bomba que vencem por horas, a partir do horímetro de agora · vermelho = vencido, âmbar = vence nos próximos 30 dias no ritmo medido, azul = depois · número no círculo = serviços no mesmo ponto (passe o mouse para ver)</p>
    <div class="elt">${velho ? `<div class="elt-h"><span class="pill p-mut">horímetro ${dias == null ? 'sem leitura' : 'de ' + dias + ' dias atrás'} · posição aproximada</span></div>` : ''}<svg viewBox="0 0 ${W} 92" width="100%" style="display:block" data-nodrag>${g}</svg>
    ${venc.length ? `<p class="elt-l"><span class="pill p-bad">vencidos · ${venc.length}</span> ${venc.map(z => esc(z.t.serv) + ' <span class="note">há ' + nf(-z.r) + ' h</span>').join(' · ')}</p>` : ''}
    ${logo.length ? `<p class="elt-l"><span class="pill p-warn">próximos 30 dias · ${logo.length}</span> ${logo.map(z => esc(z.t.serv) + ' <span class="note">em ' + nf(z.r) + ' h</span>').join(' · ')}</p>` : ''}
    ${!L.length ? '<p class="elt-l note">Nenhum serviço por horas com último registro e horímetro.</p>' : ''}</div></div>`;
}
// ---------- 3.1 · docagem: histórico e projeção, uma linha por balsa ----------
function balDocaGraf(D) {
  const datas = D.flatMap(d => d.L.map(h => pD(h.date))).concat(D.filter(d => d.s.alvoD).map(d => d.s.alvoD));
  const y0 = Math.min(hoje().getFullYear() - 6, ...datas.map(d => d.getFullYear())), y1 = Math.max(hoje().getFullYear() + 4, ...datas.map(d => d.getFullYear()));
  const t0 = new Date(y0, 0, 1), t1 = new Date(y1 + 1, 0, 1), X = d => Math.max(0, Math.min(100, (d - t0) / (t1 - t0) * 100)), hj = X(hoje()), anos = []; for (let y = y0; y <= y1 + 1; y++) anos.push(y);
  const corN = { venc: '#D93025', prox: '#E37400', ok: '#188038', sem: '#9AA0A6' };
  const linhas = D.map(d => { const ref = balEmRef(d.b);
    const mk = d.L.map((h, i) => `<i class="dh-m" style="left:${X(pD(h.date))}%" data-tip="${d.L.length - i}ª docagem · entrada ${brD(h.date)}${h.saida ? ' · saída ' + brD(h.saida) : ''}${h.estaleiro ? ' · ' + esc(h.estaleiro) : ''}"></i>`).join('');
    const ins = balExecs(d.b.id, 'B10.1').filter(r => r.insp).map(r => `<i class="dh-m" style="left:${X(pD(r.date))}%;background:#fff;border:2px solid #1A73E8" data-tip="Inspeção ${brD(r.date)} · sem necessidade de docar${r.prox ? ' · próxima avaliação ' + brD(r.prox) : ''}"></i>`).join('');
    const nx = d.s.alvoD ? `<i class="dh-n" style="left:${X(d.s.alvoD)}%;border-color:${corN[d.st]}" data-tip="Próxima: ${brD(isoD(d.s.alvoD))}${d.csn && d.csn.date ? ' (data-limite do CSN)' : ' (5 anos depois da última)'}"></i>` : '';
    const atr = d.st === 'venc' && d.s.alvoD ? `<i class="dh-a" style="left:${X(d.s.alvoD)}%;width:${hj - X(d.s.alvoD)}%"></i><span class="dh-at" style="left:${hj}%">vencida há ${-d.dias} d</span>` : '';
    return `<div class="dh-r${ref ? ' fora' : ''}" data-balft="${d.b.id}"><span class="dh-l">${esc(d.b.nome)}</span><div class="dh-t">${anos.slice(0, -1).map(y => `<i class="dh-g" style="left:${X(new Date(y, 0, 1))}%"></i>`).join('')}<i class="dh-hjr" style="left:${hj}%"></i>${atr}${mk}${ins}${nx}${!d.L.length && !d.s.alvoD ? `<span class="dh-sem">${ref ? 'em reforma' : 'sem registro de docagem'}</span>` : ''}</div></div>`; }).join('');
  const eixo = `<div class="dh-r dh-ax"><span class="dh-l"></span><div class="dh-t">${anos.map(y => `<span style="left:${X(new Date(y, 0, 1))}%">${y}</span>`).join('')}</div></div>`, rodape = `<div class="dh-r dh-ax"><span class="dh-l"></span><div class="dh-t"><span style="left:${hj}%;color:#188038">hoje</span></div></div>`;
  return `<div class="card"><h2>Docagem · histórico e projeção (${y0}–${y1})</h2><p class="note" style="margin-top:0">Uma linha por balsa · clique numa balsa para abrir a ficha técnica</p>
    <div class="clegend note"><span><i style="background:#1A73E8;border-radius:3px"></i>Docagem feita</span><span><i style="background:#fff;border:2px solid #1A73E8;border-radius:3px;width:8px;height:10px"></i>Inspeção sem docar</span><span><i style="background:#fff;border:2px solid #188038;border-radius:3px;width:8px;height:10px"></i>Próxima (cor = situação: vermelho vencida, laranja até 12 meses, verde em dia)</span><span><i style="background:#F6AEA9"></i>Atraso até hoje</span></div>
    <div class="dh">${eixo}${linhas}${rodape}</div></div>`;
}
// ---------- barras de atraso e saldo (o desenho da calibração dos empurradores, pcmCalGraf) ----------
// L = [{ lab, sub, v (negativo = atraso), max (barra cheia à direita), st: venc/aten/ok/cin, tx, at (atributo do clique) }]
function balSgGraf(L, esq, dir) {
  const C = { venc: '#D93025', aten: '#F9AB00', ok: '#1E8E3E', cin: '#9AA0A6' }, T = { venc: '#C5221F', aten: '#B06000', ok: '#137333', cin: '#5F6368' }, mxN = Math.max(1, ...L.filter(x => x.v < 0).map(x => -x.v));
  return `<div class="ol-sg ol-sgc" data-nodrag>${L.map(x => { const neg = x.v < 0, w = neg ? Math.max(4, -x.v / mxN * 100) : Math.max(3, Math.min(x.v, x.max) / x.max * 100), tx = `<b style="color:${T[x.st]}">${x.tx}</b>`;
    return `<div class="ol-sgr click" ${x.at}><span class="ol-sgl"><b>${esc(x.lab)}</b>${x.sub ? ' · ' + esc(x.sub) : ''}</span><span class="ol-sgL">${neg ? `${tx}<i style="width:${w}%;background:${C[x.st]}"></i>` : ''}</span><span class="ol-sgR">${!neg ? `<i style="width:${w}%;background:${C[x.st]}"></i>${tx}` : ''}</span></div>`; }).join('')}
    <div class="ol-sgr ol-sgx"><span></span><span class="ol-sgL"><small>← ${esq}</small></span><span class="ol-sgR"><small>${dir} →</small></span></div></div>`;
}
// ---------- 3.2 · dias até a próxima calibração (PSV, válvula de alívio, manômetro) ----------
function balCalGraf() {
  const hj = pD(isoD(hoje())), R = [], sem = [];
  BALSAS.filter(b => !balEmRef(b)).forEach(b => BAL_CAL.filter(c => c[0] !== 'inj').forEach(([k, n]) => { const s = balSit(b, BA1M[k]);
    if (!s.alvoD) return sem.push(b.nome); const d = Math.round((s.alvoD - hj) / 864e5); R.push({ lab: b.nome, sub: n.replace(' (pressão e vácuo)', '').replace(' da linha', '').replace(' da rede de carga', ''), v: d, max: 365, st: d < 0 ? 'venc' : d <= BAL_PROX_D ? 'aten' : 'ok', tx: d < 0 ? '−' + nf(-d) + ' d' : nf(d) + ' d', at: `data-balcal="${b.id}" title="Registrar calibração de ${esc(b.nome)}"` }); }));
  const A = R.filter(x => x.v <= 120).sort((a, b) => a.v - b.v), resto = R.length - A.length;
  return `<div class="card"><h2>Dias até a próxima calibração</h2><p class="note" style="margin-top:0">PSV, válvula de alívio e manômetro da rede de carga (anuais) · mais urgente primeiro · só os que vencem em até 120 dias · clique numa linha para registrar a calibração</p>
    ${A.length ? balSgGraf(A, 'atrasada', 'vence agora · quanto falta (barra cheia = 1 ano)') : '<p class="note">Nenhuma calibração vence nos próximos 120 dias.</p>'}
    <div class="ol-leg"><span><i style="background:#D93025"></i>Vencida (atraso)</span><span><i style="background:#F9AB00"></i>Vence em até ${BAL_PROX_D} dias</span><span><i style="background:#1E8E3E"></i>Em dia</span></div>
    <p class="note">${resto ? `Mais ${resto} calibraç${resto === 1 ? 'ão' : 'ões'} com mais de 120 dias. ` : ''}${sem.length ? `${sem.length} sem registro (na tabela abaixo). ` : ''}Bicos e bomba injetora vencem pelas horas, na revisão de 1.000 h: veja a 2.2 Backlog e OM preventiva.</p></div>`;
}
// ---------- 3.3 · pior cilindro de cada motor contra o mínimo ----------
function balCmpBarras(D) {
  const L = [];   // ordem pela fração do caminho até o motor novo (o D229 tem outra escala)
  D.filter(d => d.u).forEach(d => { const CL = balCmpL(d.b), at = `data-balcmph="${d.b.id}" title="Histórico de ensaios de ${esc(d.b.nome)}"`;
    if (d.mwm) { const v = Math.round((d.u.min - CL.min) * 10) / 10; L.push({ lab: d.b.nome, sub: BAL_MOTOR[d.b.mot].replace('MWM ', ''), v, max: CL.novo - CL.min, st: d.st === 'fora' ? 'venc' : d.st === 'aten' ? 'aten' : 'ok', tx: nf(d.u.min, 1) + ' bar · C' + d.u.cil, at, o: v / (CL.novo - CL.min) }); }
    else { const p = d.u.med ? d.dif / d.u.med * 100 : 0; L.push({ lab: d.b.nome, sub: 'Cummins', v: Math.min(p, 10), max: 10, st: d.st === 'aten' ? 'aten' : 'cin', tx: 'dif. ' + nf(p, 1) + '% entre cilindros', at, o: 99 }); } });
  L.sort((a, b) => a.o - b.o); const sem = D.filter(d => !d.u).length;
  return `<div class="card"><h2>Pior cilindro de cada motor · contra o mínimo</h2><p class="note" style="margin-top:0">Último ensaio · zero no mínimo do motor (6.10 TCA ${BAL_CMP.min} bar, D229 ${BAL_CMP_MOT.m229.min} bar) · abaixo do mínimo à esquerda · barra cheia à direita = motor novo · clique numa linha para ver o histórico</p>
    ${L.length ? balSgGraf(L, 'abaixo do mínimo', 'acima do mínimo, até o valor de motor novo') : '<p class="note">Nenhum ensaio registrado.</p>'}
    <div class="ol-leg"><span><i style="background:#D93025"></i>Abaixo do mínimo</span><span><i style="background:#F9AB00"></i>Atenção (diferença, queda ou projeção)</span><span><i style="background:#1E8E3E"></i>Normal</span><span><i style="background:#9AA0A6"></i>Cummins · critério interno (barra cheia = 10% de diferença)</span></div>
    <p class="note">${sem ? `${sem} balsa${sem === 1 ? '' : 's'} sem ensaio (na tabela abaixo). ` : ''}Cummins não publica pressão de compressão para o 6CTA 8.3: a barra mostra a diferença entre o maior e o menor cilindro ÷ a média.</p></div>`;
}
