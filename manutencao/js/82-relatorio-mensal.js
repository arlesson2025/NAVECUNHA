/* ===== Relatório mensal e Apresentação mensal (pedido do Supervisor, 25/10/2026) =====
   Período livre (De/Até, atalhos Este mês · Mês passado · Trimestre · Ano), sempre recalculado dos registros: nada é congelado.
   Uma fonte só (rlDados) para o relatório A4 e para a apresentação em tela cheia, com as mesmas contas das telas
   (indispHoras/horasOperacao dos KPIs, prResumo do Cronograma, frotaMatriz, laudoSt, pmcAval, riscoDados, skPend).
   Evidências fotográficas: todas as fotos das OMs encerradas no período, agrupadas por OM.
   Item do menu só para o Supervisor; pode ser ocultado neste aparelho (Administração → Menu deste aparelho ou botão na tela).
   As notas de riscos e decisões ficam neste aparelho (localStorage), por período: o servidor não aceita tipo de registro novo. */
'use strict';
const RL = { de: '', ate: '', s: 0 };
const MENU_OC_K = 'smf_menu_oculto';
const menuOculto = id => { try { return (JSON.parse(localStorage.getItem(MENU_OC_K) || '[]')).includes(id); } catch (e) { return false; } };
function menuOcultar(id, oc) { try { const L = new Set(JSON.parse(localStorage.getItem(MENU_OC_K) || '[]')); if (oc) L.add(id); else L.delete(id); localStorage.setItem(MENU_OC_K, JSON.stringify([...L])); } catch (e) { } renderNav(); }
function rlPer() { const H = hoje(); if (!RL.de) { RL.de = isoD(new Date(H.getFullYear(), H.getMonth(), 1)); RL.ate = isoD(H); } return { ini: pD(RL.de), fim: new Date(pD(RL.ate).getTime() + 864e5) }; }
function rlAtalho(k) { const H = hoje(), y = H.getFullYear(), m = H.getMonth();
  const P = { mes: [new Date(y, m, 1), H], ant: [new Date(y, m - 1, 1), new Date(y, m, 0)], tri: [new Date(y, m - 2, 1), H], ano: [new Date(y, 0, 1), H] }[k]; if (!P) return; RL.de = isoD(P[0]); RL.ate = isoD(P[1]); }
const rlNotaK = () => 'smf_relnota_' + RL.de + '_' + RL.ate;
const rlNota = () => { try { return localStorage.getItem(rlNotaK()) || ''; } catch (e) { return ''; } };
const rlNum = s => { const x = numBR(s); return x == null ? null : x; };

// ---------- números do período ----------
function rlNumeros(ini, fim) {
  const ate = fim > hoje() ? new Date(hoje().getTime() + 864e5) : fim, dentro = (t, a = ini, b = fim) => t != null && t >= a && t < b;
  const tot = S.cfg.frota.length * Math.max(0, ate - ini) / 3600e3, disp = tot > 0 ? Math.max(0, (tot - indispHoras(ini, ate)) / tot * 100) : null;
  const O = oms().filter(o => !o.excluido), dt = s => s ? pD(s) : null;
  const corrAb = O.filter(o => o.tipo === 'C' && dentro(dt(o.abertura))), corrEnc = O.filter(o => o.tipo === 'C' && o.status === 'encerrada' && dentro(o.fechadoAt ? new Date(o.fechadoAt) : null));
  const prevEnc = O.filter(o => o.tipo !== 'C' && o.status === 'encerrada' && dentro(o.fechadoAt ? new Date(o.fechadoAt) : null));
  const lib = O.filter(o => ehFalha(o) && o.liberacao && o.abertura && dentro(pD(o.liberacao))), mttr = lib.length ? lib.reduce((s, o) => s + (pD(o.liberacao) - pD(o.abertura)) / 3600e3, 0) / lib.length : null;
  const fal = O.filter(o => ehFalha(o) && dentro(dt(o.abertura))).length, hOp = horasOperacao(ini, ate), mtbf = fal ? hOp / fal : null;
  // Cronograma: meses do período, por ano, com a mesma conta da tela (prResumo)
  let ok = 0, den = 0, naoPrazo = 0, prev = 0; const porV = {};
  for (let y = ini.getFullYear(); y <= new Date(fim - 1).getFullYear(); y++) {
    const sel = [...Array(12).keys()].filter(m => new Date(y, m + 1, 1) > ini && new Date(y, m, 1) < fim), hm = hoje().getFullYear() === y ? hoje().getMonth() : y < hoje().getFullYear() ? 12 : -1;
    if (!sel.length) continue;
    S.cfg.frota.filter(v => !foraOp(v)).forEach(v => { const r = prResumo(v, y, hm, sel); ok += r.ok; den += r.den; naoPrazo += r.venc; prev += r.tP; const q = porV[v.id] = porV[v.id] || { ok: 0, den: 0, venc: 0, tP: 0 }; q.ok += r.ok; q.den += r.den; q.venc += r.venc; q.tP += r.tP; });
  }
  const custo = [...corrEnc, ...prevEnc].reduce((a, o) => ({ hh: a.hh + (+o.hh || 0), r: a.r + (+o.custoMat || 0) + (+o.custoServ || 0) }), { hh: 0, r: 0 });
  return { disp, ader: den ? ok / den * 100 : null, naoPrazo, prev, corrAb, corrEnc, prevEnc, mttr, mtbf, fal, custo, porV };
}
// ---------- horas de motor (horímetro guardado = total do motor; horas no período = leitura no fim − leitura antes do início) ----------
function rlHoras(ini, fim) { const dFim = isoD(new Date(fim - 864e5)), dIni = isoD(new Date(ini - 864e5)), ateHoje = dFim >= isoD(hoje()), out = [];
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => mcpPos(v).concat(MCAS.filter(p => (v.mca || {})[p])).forEach(p => {
    const e = (ateHoje ? horAtual(v.id, p) : null) || horEm(v.id, p, dFim);
    let s = horEm(v.id, p, dIni); if (!s) s = recs('hor').filter(r => r.vessel === v.id && r.pos === p && r.date >= isoD(ini) && r.date <= dFim).sort((a, b) => a.date < b.date ? -1 : 1)[0] || null;
    const hrs = e && s && e.h >= s.h ? e.h - s.h : null, dias = e && s ? Math.max(1, Math.round((pD(e.date) - pD(s.date)) / 864e5)) : null;
    out.push({ v, p, nome: posCurtoE(v, p), mcp: isMcp(p), acum: e ? e.h : null, est: !!(e && e.est), hrs, hd: hrs != null && dias ? hrs / dias : null }); }));
  return out; }
function rlIndispV(vid, ini, fim) { let h = 0; const ate = fim > hoje() ? hoje() : fim;
  oms().forEach(o => { if (o.vessel !== vid || o.excluido) return;
    if (o.tipo === 'C' && o.interd === 'Sim' && o.interdDT) { const a = pD(o.interdDT), b = o.liberacao ? pD(o.liberacao) : hoje(), x = Math.max(a, ini), y = Math.min(b, ate); if (y > x) h += (y - x) / 3600e3; }
    if (o.tipo === 'P' && o.status === 'encerrada' && +o.indispH > 0) { const d = pD(o.dreal); if (d && d >= ini && d < fim) h += +o.indispH; } });
  return h; }
function rlDados() {
  const { ini, fim } = rlPer(), dias = Math.round((fim - ini) / 864e5), iniA = new Date(ini.getTime() - dias * 864e5);
  const N = rlNumeros(ini, fim), A = rlNumeros(iniA, ini), dentro = s => s && pD(s) >= ini && pD(s) < fim, ateHoje = isoD(new Date(fim - 864e5)) >= isoD(hoje());
  const V = S.cfg.frota.filter(v => !foraOp(v)), FM = frotaMatriz().filter(x => x.sit >= 0);
  const frota = { lib: 0, rest: 0, bloq: 0, viag: 0, sem: 0, bloqN: [] }; FM.forEach(x => { const s = situDe(x.v); if (!s) frota.sem++; else if (s.st === 'viagem') frota.viag++; else if (x.sit >= 2) { frota.bloq++; frota.bloqN.push(x.v.nome); } else if (x.sit === 1) frota.rest++; else frota.lib++; });
  const saidas = recs('saida').filter(r => !r.excluido && dentro(r.date) && r.sit >= 1).sort((a, b) => a.date < b.date ? -1 : 1);
  const cl = {}; N.corrAb.forEach(o => { cl[o.classe || '—'] = (cl[o.classe || '—'] || 0) + 1; });
  const eq = {}; N.corrAb.forEach(o => { const k = String(o.equip || '').trim() || 'Equipamento não informado'; (eq[k] = eq[k] || []).push(o); });
  const pareto = Object.entries(eq).map(([k, L]) => [k, L.length, L]).sort((a, b) => b[1] - a[1]);
  const atrasadas = oms().filter(o => !o.excluido && o.status !== 'encerrada' && omAtrasada(o)), efic = typeof efPend === 'function' ? efPend() : [];
  const trocas = recs('lub').filter(r => r.tipo === 'fr049' && !r.excluido && dentro(r.date)).length;
  const oleoVenc = lubDados().filter(x => x.horas != null && x.horas < 0 && !foraOp(x.v));
  const laudos = recs('laudo').filter(r => !r.excluido && dentro(r.date)).map(r => ({ r, a: laudoSt(r) })).filter(x => x.a.st !== 'ok');
  const comp = recs('comp').filter(r => !r.excluido && dentro(r.date)).map(r => ({ r, min: Math.min(...(r.vals || []).map(rlNum).filter(x => x != null)) })).filter(x => isFinite(x.min) && x.min < COMP.aten);
  const pm = {}; recs('param').filter(r => !r.excluido && dentro(r.date)).forEach(r => { const a = pmcAval(r); if (a.st === 'ok') return; const k = r.vessel + '|' + (r.pos || ''); const q = pm[k] = pm[k] || { r, n: 0, venc: 0, ult: r, a }; q.n++; if (a.st === 'venc') q.venc++; if (r.date >= q.ult.date) { q.ult = r; q.a = a; } });
  const param = Object.values(pm).sort((a, b) => b.venc - a.venc || b.n - a.n);
  const prox = riscoDados().alertas, sk = typeof skPend === 'function' ? skPend() : [];
  const fotos = [...N.prevEnc, ...N.corrEnc].filter(o => (o.fotos || []).length).sort((a, b) => (a.fechadoAt || 0) - (b.fechadoAt || 0));
  const H = rlHoras(ini, fim), HA = rlHoras(iniA, ini), hMcp = L => L.filter(x => x.mcp && x.hrs != null).reduce((a, x) => a + x.hrs, 0);
  const meses = []; for (let d = new Date(ini.getFullYear(), ini.getMonth(), 1); d < fim; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) { const a = d < ini ? ini : d, b = new Date(Math.min(+new Date(d.getFullYear(), d.getMonth() + 1, 1), +fim)); meses.push({ lab: MESES[d.getMonth()] + '/' + String(d.getFullYear()).slice(2), h: hMcp(rlHoras(a, b)) }); }
  const indisp = V.map(v => ({ v, h: rlIndispV(v.id, ini, fim) })).filter(x => x.h > 0).sort((a, b) => b.h - a.h);
  const tq = trimestre(new Date(fim - 864e5)), pred = kpiPreditivo(tq.y, tq.q), predA = kpiPreditivo(tq.q ? tq.y : tq.y - 1, tq.q ? tq.q - 1 : 3);
  const metas = [['Disponibilidade da frota', '≥ 95%', N.disp, A.disp, '%', 1, v => v >= 95], ['MTBF', '≥ 500 h', N.mtbf, A.mtbf, ' h', 0, v => v >= 500], ['MTTR', '≤ 8 h', N.mttr, A.mttr, ' h', 1, v => v <= 8],
    ['Backlog (hoje)', '≤ 5%', kpiBacklog().v, null, '%', 1, v => v <= 5], [`Plano preditivo (${tq.q + 1}º trim./${tq.y})`, '≥ 80%', pred ? pred.v : null, predA ? predA.v : null, '%', 0, v => v >= 80],
    ['Conformidade de fotos', '100%', kpiFotos(ini, fim), kpiFotos(iniA, ini), '%', 0, v => v >= 99.95], ['Aderência ao cronograma', 'referência ≥ 90%', N.ader, A.ader, '%', 0, v => v >= 90]];
  return { ini, fim, dias, ateHoje, N, A, V, FM, frota, saidas, cl, pareto, atrasadas, efic, trocas, oleoVenc, laudos, comp, param, prox, sk, fotos, H, hPer: hMcp(H), hAnt: hMcp(HA), meses, indisp, metas };
}
// ---------- peças de apresentação ----------
const rlFmt = (v, d = 0, un = '') => v == null || !isFinite(v) ? '—' : nf(v, d) + un;
function rlSeta(a, b, maior = true, dec) { if (a == null || b == null || !isFinite(a) || !isFinite(b)) return '<span class="rl-eq">sem comparação</span>'; const d = a - b; if (Math.abs(d) < 0.05) return '<span class="rl-eq">= anterior</span>';
  const bom = maior ? d > 0 : d < 0; return `<span class="${bom ? 'rl-up' : 'rl-dn'}">${d > 0 ? '▲' : '▼'} ${nf(Math.abs(d), dec != null ? dec : Math.abs(d) < 10 ? 1 : 0)} vs anterior</span>`; }
function rlResumo(D) { const N = D.N, A = D.A;
  const c = (t, v, s, meta, nota) => `<div class="rl-k"><small>${t}</small><b>${v}</b><div>${s}</div>${meta ? `<em>${meta}</em>` : ''}${nota ? `<i>${nota}</i>` : ''}</div>`;
  return `<div class="rl-ks">${c('Disponibilidade da frota', rlFmt(N.disp, 1, '%'), rlSeta(N.disp, A.disp), 'meta ≥ 95%')}${c('Aderência ao cronograma', rlFmt(N.ader, 0, '%'), rlSeta(N.ader, A.ader), 'feito no prazo ÷ o que venceu')}
    ${c('Serviços não realizados no prazo', nf(N.naoPrazo), rlSeta(N.naoPrazo, A.naoPrazo, false, 0), 'serviços preventivos do cronograma')}${c('Corretivas abertas · encerradas', N.corrAb.length + ' · ' + N.corrEnc.length, rlSeta(N.corrAb.length, A.corrAb.length, false, 0), 'no período')}
    ${c('MTTR', rlFmt(N.mttr, 1, ' h'), rlSeta(N.mttr, A.mttr, false), 'meta ≤ 8 h · falhas Crítica e Alta')}${c('MTBF', rlFmt(N.mtbf, 0, ' h'), rlSeta(N.mtbf, A.mtbf), 'h de operação ÷ falhas Crítica e Alta')}</div>`; }
function rlBarras(L, W = 640, H = 200) {   // [[rótulo, valor, cor]] barras horizontais
  const mx = Math.max(1, ...L.map(x => x[1])), lh = Math.min(26, (H - 6) / Math.max(1, L.length)), lw = 210;
  return `<svg viewBox="0 0 ${W} ${L.length * lh + 6}" width="100%" style="display:block">${L.map(([t, v, c], i) => { const w = (W - lw - 50) * v / mx, y = 3 + i * lh;
    return `<text x="${lw - 8}" y="${y + lh * .66}" text-anchor="end" font-size="12" fill="#334155">${esc(t.length > 32 ? t.slice(0, 31) + '…' : t)}</text><rect x="${lw}" y="${y + 3}" width="${Math.max(2, w)}" height="${lh - 7}" rx="3" fill="${c || '#2563EB'}"/><text x="${lw + w + 6}" y="${y + lh * .66}" font-size="12" font-weight="700" fill="#0F172A">${nf(v)}</text>`; }).join('')}</svg>`; }
const rlVazio = t => `<p class="rl-nada">${t}</p>`;
function rlFoto(f, o) { const leg = `<figcaption><b>${esc(f.tipo || 'FOTO')}</b>${f.leg ? ' · ' + esc(f.leg) : ''}</figcaption>`;
  if (f.src) return `<figure><img src="${f.src}" alt="${esc((f.tipo || '') + ' ' + (f.leg || ''))}">${leg}</figure>`;
  if (f.fid) return `<figure><a class="rl-ph" href="https://drive.google.com/file/d/${esc(f.fid)}/view" target="_blank" rel="noopener">☁ abrir no Drive</a>${leg}</figure>`;
  return `<figure><div class="rl-ph">${o.seed ? 'foto de exemplo' : 'foto só no aparelho que registrou'}</div>${leg}</figure>`; }
const rlOmTit = o => `OM ${esc(o.num || '—')} · ${esc(vName(o.vessel))} · ${o.tipo === 'C' ? 'Corretiva ' + esc(o.classe || '') : 'Preventiva'} · encerrada em ${o.fechadoAt ? brD(isoD(new Date(o.fechadoAt))) : '—'}`;
// ---------- relatório A4: capa · resumo executivo · metas · … · contracapa · anexo de fotos ----------
const rlPerTx = D => `${brD(isoD(D.ini))} a ${brD(isoD(new Date(D.fim - 864e5)))}`;
const rlNumDoc = D => 'RM-' + isoD(new Date(D.fim - 864e5)).slice(0, 7);
function rlExec(D) { const N = D.N, A = D.A, L = [], top = D.pareto[0];
  L.push(`Disponibilidade da frota de <b>${rlFmt(N.disp, 1, '%')}</b>, ${N.disp == null ? 'sem dados' : N.disp >= 95 ? 'dentro da meta de 95%' : '<b class="rl-ruim">abaixo da meta de 95%</b>'}.`);
  L.push(`Aderência ao cronograma de <b>${rlFmt(N.ader, 0, '%')}</b>${A.ader != null && N.ader != null ? ` (${N.ader >= A.ader ? 'melhor' : 'pior'} que os ${nf(A.ader)}% do período anterior)` : ''}; <b>${nf(N.naoPrazo)}</b> serviços preventivos não realizados dentro do prazo.`);
  L.push(`<b>${N.corrAb.length}</b> corretivas abertas no período (${['Crítica', 'Alta'].map(c => `${D.cl[c] || 0} ${c}`).join(', ')}) contra ${A.corrAb.length} no período anterior${top ? `; o que mais quebrou foi <b>${esc(top[0])}</b> (${top[1]} falha${top[1] === 1 ? '' : 's'})` : ''}.`);
  L.push(`MCPs da frota trabalharam <b>${nf(D.hPer)} h</b> no período${D.hAnt ? ` (${D.hPer >= D.hAnt ? '+' : '−'}${nf(Math.abs(D.hPer - D.hAnt))} h em relação ao anterior)` : ''}.`);
  if (D.frota.bloq || D.frota.rest) L.push(`Hoje: <b class="${D.frota.bloq ? 'rl-ruim' : ''}">${D.frota.bloq} bloqueado${D.frota.bloq === 1 ? '' : 's'}</b>${D.frota.bloqN.length ? ' (' + D.frota.bloqN.map(esc).join(', ') + ')' : ''} e ${D.frota.rest} com restrição para sair.`);
  const cond = [D.laudos.length ? `${D.laudos.length} laudo${D.laudos.length === 1 ? '' : 's'} de óleo com alerta` : '', D.comp.length ? `${D.comp.length} ensaio${D.comp.length === 1 ? '' : 's'} de compressão abaixo de 1,45 MPa` : '', D.oleoVenc.length ? `${D.oleoVenc.length} troca${D.oleoVenc.length === 1 ? '' : 's'} de óleo vencida${D.oleoVenc.length === 1 ? '' : 's'}` : ''].filter(Boolean);
  if (cond.length) L.push('Condição dos motores: ' + cond.join(', ') + '.');
  if (D.sk.length) L.push(`<b>${D.sk.length}</b> evidência${D.sk.length === 1 ? '' : 's'} ainda não anexada${D.sk.length === 1 ? '' : 's'} no Sankhya.`);
  return L; }
function rlMetas(D) { return `<table class="rl-t"><thead><tr><th>Indicador (NP 055 item 9)</th><th>Meta</th><th>Resultado</th><th>Período anterior</th><th>Situação</th></tr></thead><tbody>${D.metas.map(([n, m, v, a, un, dc, ok]) => { const st = v == null ? '<span class="rl-eq">sem dados</span>' : ok(v) ? '<b class="rl-ok">Atende</b>' : '<b class="rl-ruim">Não atende</b>';
    return `<tr><td>${n}</td><td>${m}</td><td><b>${rlFmt(v, dc, un)}</b></td><td>${rlFmt(a, dc, un)}</td><td>${st}</td></tr>`; }).join('')}</tbody></table>${D.N.fal < 3 ? `<p class="rl-m">Atenção: só ${D.N.fal} falha${D.N.fal === 1 ? '' : 's'} Crítica ou Alta no período; com tão poucas falhas, MTBF e MTTR oscilam muito de um período para outro.</p>` : ''}`; }
function rlColunas(L, W = 640, H = 170) {   // [[rótulo, valor]] colunas verticais
  const n = L.length, mx = Math.max(1, ...L.map(x => x[1])), gw = (W - 20) / Math.max(1, n), bw = Math.min(46, gw * .6), Y = v => 18 + (H - 44) * (1 - v / mx);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${L.map(([t, v], i) => { const cx = 10 + i * gw + gw / 2; return `<rect x="${cx - bw / 2}" y="${Y(v)}" width="${bw}" height="${H - 26 - Y(v)}" rx="3" fill="#1967D2"/><text x="${cx}" y="${Y(v) - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#0F172A">${nf(v)}</text><text x="${cx}" y="${H - 9}" text-anchor="middle" font-size="11" fill="#475569">${esc(t)}</text>`; }).join('')}</svg>`; }
function rlHorasHTML(D) { const M = D.H.filter(x => x.mcp), porV = D.V.map(v => [v.nome, M.filter(x => x.v === v && x.hrs != null).reduce((a, x) => a + x.hrs, 0)]);
  const acum = M.filter(x => x.acum != null).map(x => [x.v.nome + (mcpPos(x.v).length > 1 ? ' ' + x.p : ''), x.acum, '#16244A']);
  return `<h3>Horas trabalhadas no período · MCP · frota ${nf(D.hPer)} h</h3>${rlBarras(porV.map(([t, h]) => [t, h, '#1967D2']), 640, 260)}
    ${D.meses.length > 1 ? `<h3>Horas de MCP da frota por mês</h3>${rlColunas(D.meses.map(m => [m.lab, m.h]))}` : ''}
    <h3>Horímetro acumulado · MCP</h3>${rlBarras(acum, 640, 300)}
    <table class="rl-t"><thead><tr><th>Empurrador</th><th>Motor</th><th>Horímetro acumulado</th><th>Horas no período</th><th>Média por dia</th></tr></thead><tbody>${D.H.map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td>${esc(x.nome)}</td><td>${x.acum == null ? '—' : nf(x.acum) + ' h'}${x.est ? ' <span class="rl-m">(estimado)</span>' : ''}</td><td>${x.hrs == null ? '—' : nf(x.hrs) + ' h'}</td><td>${x.hd == null ? '—' : nf(x.hd, 1) + ' h/dia'}</td></tr>`).join('')}</tbody></table>`; }
function rlCapa(D) { const per = rlPerTx(D);
  return `<section class="rl-pg rl-pcapa"><table class="rl-carimbo"><tr><td rowspan="2" class="rl-lg"><img src="${LOGOS.vda}" alt="Grupo VDA"><img src="${LOGOS.nav}" alt="Navecunha"></td><td class="rl-cx" colspan="2"><small>Documento</small>RELATÓRIO DE MANUTENÇÃO DA FROTA</td><td><small>Nº</small>${rlNumDoc(D)}</td></tr>
    <tr><td><small>Período</small>${per}</td><td><small>Emissão</small>${brD(isoD(hoje()))}</td><td><small>Revisão</small>00</td></tr></table>
    <div class="rl-ctit"><small>NAVEGAÇÃO CUNHA LTDA. · MANUTENÇÃO</small><h1>Relatório de Manutenção<br>da Frota de Empurradores</h1><p>${per} · ${D.V.length} empurradores em operação</p><p class="rl-m">NP Navecunha 055 · item 9 (indicadores) · gerado pelo SMF a partir dos registros do período${temExemplo() ? ' · <b>dados de exemplo</b>' : ''}</p></div>
    <table class="rl-ass"><tr><th>Elaborado por</th><th>Aprovado por</th></tr><tr><td>${esc(S.session ? S.session.name : '')}<br><span class="rl-m">Supervisor de Manutenção</span></td><td><br><span class="rl-m">Gerência</span></td></tr><tr><td class="rl-lin">Assinatura e data</td><td class="rl-lin">Assinatura e data</td></tr></table>
    <p class="rl-m"><b>Distribuição:</b> Gerência · Coordenação de Operações · SGI (Qualidade, Meio Ambiente e Segurança)</p></section>`; }
function rlContra(D) { const nF = D.fotos.reduce((a, o) => a + o.fotos.length, 0);
  return `<section class="rl-pg rl-contra"><h2 class="rl-ch">Como os números são calculados</h2><table class="rl-t"><thead><tr><th>Indicador</th><th>Fórmula</th><th>Meta</th></tr></thead><tbody>
    <tr><td>Disponibilidade</td><td>(horas calendário − horas paradas por manutenção) ÷ horas calendário</td><td>≥ 95%</td></tr><tr><td>MTBF</td><td>horas de operação ÷ nº de falhas Crítica e Alta</td><td>≥ 500 h</td></tr>
    <tr><td>MTTR</td><td>soma do tempo de reparo (abertura → liberação) ÷ nº de falhas liberadas</td><td>≤ 8 h</td></tr><tr><td>Backlog</td><td>OMs com início vencido ÷ OMs em aberto</td><td>≤ 5%</td></tr>
    <tr><td>Plano preditivo</td><td>análises de óleo e avaliações de tendência feitas ÷ programadas no trimestre</td><td>≥ 80%</td></tr><tr><td>Conformidade de fotos</td><td>OMs encerradas com foto de antes e depois ÷ OMs encerradas</td><td>100%</td></tr>
    <tr><td>Aderência ao cronograma</td><td>serviços feitos no prazo ÷ serviços que já venceram, nos meses do período</td><td>referência ≥ 90%</td></tr>
    <tr><td>Horas de motor</td><td>horímetro no fim do período − horímetro antes do início (MCA sem horímetro: estimativa por estado)</td><td>—</td></tr></tbody></table>
    <h2 class="rl-ch">De onde vêm os dados</h2><p>Registros do SMF no período: OMs preventivas e corretivas (Anexos II-B e II-A), FR 027_L (chegada e saída), FR 049_B (troca de óleo), horímetros, laudos de óleo, ensaios de compressão, leituras do MCP e registros de saída. O relatório é recalculado a cada emissão: dois relatórios do mesmo período emitidos em datas diferentes podem diferir se houver lançamentos atrasados.</p>
    <h2 class="rl-ch">Controle documental (NP 055 item 4.8)</h2><table class="rl-t"><tbody><tr><td>Documento</td><td>${rlNumDoc(D)} · Relatório de Manutenção da Frota · revisão 00</td></tr><tr><td>Emitido</td><td>${brD(isoD(hoje()))} por ${esc(S.session ? S.session.name : '—')} (SMF)</td></tr><tr><td>Evidências</td><td>${nF} fotos de ${D.fotos.length} OMs no anexo · PDFs dos Anexos II no Google Drive e anexados na OM do Sankhya</td></tr><tr><td>Guarda</td><td>arquivo do SGI, junto com a análise crítica do período</td></tr></tbody></table>
    <table class="rl-ass" style="margin-top:22px"><tr><th>Elaborado por</th><th>Aprovado por</th></tr><tr><td class="rl-lin">${esc(S.session ? S.session.name : '')} · Supervisor de Manutenção</td><td class="rl-lin">Gerência</td></tr></table></section>`; }
function rlRelatorio(D) {
  const N = D.N, nota = rlNota(), sec = (n, t, h) => `<section class="rl-sec"><h2><span>${n}</span>${t}</h2>${h}</section>`;
  const tPrev = `<table class="rl-t"><thead><tr><th>Empurrador</th><th>Previsto</th><th>Aderência</th><th>Não realizados no prazo</th><th>OMs preventivas encerradas</th><th>Parado por manutenção</th></tr></thead><tbody>${D.V.map(v => { const q = N.porV[v.id] || {}, ih = (D.indisp.find(x => x.v === v) || {}).h;
    return `<tr><td><b>${esc(v.nome)}</b></td><td>${nf(q.tP || 0)}</td><td>${q.den ? nf(q.ok / q.den * 100) + '%' : '—'}</td><td class="${q.venc ? 'rl-ruim' : ''}">${nf(q.venc || 0)}</td><td>${N.prevEnc.filter(o => o.vessel === v.id).length}</td><td>${ih ? nf(ih, 0) + ' h' : '—'}</td></tr>`; }).join('')}</tbody></table>`;
  const top3 = D.pareto.slice(0, 3).map(([k, n, L]) => { const o = L[L.length - 1]; return `<div class="rl-f"><b>${esc(k)} · ${n} falha${n === 1 ? '' : 's'}</b><div>${L.map(x => `${esc(vName(x.vessel))} (OM ${esc(x.num || '—')}): ${esc(x.descricao || '')}`).join('<br>')}</div>${o.causa ? `<div><i>Causa:</i> ${esc(o.causa)}</div>` : ''}${o.mitig ? `<div><i>Ação:</i> ${esc(o.mitig)}</div>` : ''}</div>`; }).join('');
  const hojeTx = `em ${brD(isoD(hoje()))} (hoje)${D.ateHoje ? '' : ' · o SMF não guarda a situação de cada dia, por isso este quadro mostra hoje e não o fim do período'}`;
  return `<div class="rl-doc">${rlCapa(D)}
   <section class="rl-pg">
   ${sec(1, 'Resumo executivo', `<ul class="rl-exec">${rlExec(D).map(x => `<li>${x}</li>`).join('')}</ul><h3>Decisões e ações necessárias</h3>${nota ? `<div class="rl-nota">${esc(nota).replace(/\n/g, '<br>')}</div>` : rlVazio('Escreva no campo “Riscos, ações e decisões” acima do relatório.')}`)}
   ${sec(2, 'Indicadores e metas', rlResumo(D) + rlMetas(D))}
   ${sec(3, 'Frota e saídas', `<p class="rl-m">Situação ${hojeTx}</p><div class="rl-ks rl-ks5">${[['Liberados', D.frota.lib, '#16A34A'], ['Com restrição', D.frota.rest, '#D97706'], ['Bloqueados', D.frota.bloq, '#DC2626'], ['Em viagem', D.frota.viag, '#1967D2'], ['Local não informado', D.frota.sem, '#64748B']].map(([t, n, c]) => `<div class="rl-k"><small>${t}</small><b style="color:${c}">${n}</b></div>`).join('')}</div>
     <h3>Saídas com restrição ou bloqueio no período · ${D.saidas.length}</h3>${D.saidas.length ? `<table class="rl-t"><thead><tr><th>Data</th><th>Empurrador</th><th>Situação</th><th>Autorizou</th><th>Justificativa</th></tr></thead><tbody>${D.saidas.map(r => `<tr><td>${brD(r.date)}</td><td><b>${esc(vName(r.vessel))}</b></td><td>${esc(r.sitTxt || '')}</td><td>${esc(r.autorizou || '—')}</td><td>${esc(r.just || '—')}</td></tr>`).join('')}</tbody></table>` : rlVazio('Nenhuma saída com restrição ou bloqueio.')}`)}
   ${sec(4, 'Horas de motor', rlHorasHTML(D))}
   ${sec(5, 'Manutenção preventiva', `<p>Aderência ao cronograma no período: <b>${rlFmt(N.ader, 0, '%')}</b> · ${nf(N.naoPrazo)} serviços preventivos não realizados dentro do prazo · ${N.prevEnc.length} OMs preventivas encerradas.</p>${tPrev}`)}
   ${sec(6, 'Manutenção corretiva', `<p>${N.corrAb.length} corretivas abertas (${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `${c}: ${D.cl[c] || 0}`).join(' · ')}) · ${N.corrEnc.length} encerradas · ${D.atrasadas.length} com prazo estourado agora · ${D.efic.length} eficácias vencidas.</p>
     <h3>O que mais quebrou · por equipamento</h3>${D.pareto.length ? rlBarras(D.pareto.slice(0, 8).map(([k, n]) => [k, n, '#D97706'])) : rlVazio('Nenhuma falha no período.')}
     ${top3 ? `<h3>As falhas que mais se repetiram</h3>${top3}` : ''}`)}
   ${sec(7, 'Condição dos motores', `<div class="rl-ks rl-ks4">${[['Trocas de óleo (FR 049_B)', D.trocas], ['Óleo vencido agora', D.oleoVenc.length], ['Laudos com alerta', D.laudos.length], ['Compressão abaixo de 1,45 MPa', D.comp.length]].map(([t, n]) => `<div class="rl-k"><small>${t}</small><b>${n}</b></div>`).join('')}</div>
     ${D.oleoVenc.length ? `<h3>Óleo vencido</h3><ul>${D.oleoVenc.map(x => `<li><b>${esc(x.v.nome)}</b> · ${esc(eqNomeC(x.v, x.e))} · vencido há ${nf(-x.horas)} h</li>`).join('')}</ul>` : ''}
     ${D.laudos.length ? `<h3>Laudos de óleo com alerta</h3><ul>${D.laudos.map(x => `<li><b>${esc(vName(x.r.vessel))} ${esc(x.r.pos)}</b> · ${brD(x.r.date)} · ${x.a.alertas.slice(0, 3).map(a => esc(a.nome) + ' ' + nf(a.v, 1) + ' ' + esc(a.un)).join(', ')}</li>`).join('')}</ul>` : ''}
     ${D.comp.length ? `<h3>Compressão</h3><ul>${D.comp.map(x => `<li><b>${esc(vName(x.r.vessel))} ${esc(x.r.pos)}</b> · ${brD(x.r.date)} · pior cilindro ${nf(x.min, 2)} MPa</li>`).join('')}</ul>` : ''}
     ${D.param.length ? `<h3>Parâmetros do MCP fora do limite · por motor</h3><table class="rl-t"><thead><tr><th>Motor</th><th>Leituras fora</th><th>Abaixo do limite</th><th>Última leitura fora</th></tr></thead><tbody>${D.param.map(q => `<tr><td><b>${esc(vName(q.r.vessel))} ${esc(q.r.pos || '')}</b></td><td>${q.n}</td><td class="${q.venc ? 'rl-ruim' : ''}">${q.venc}</td><td>${brD(q.ult.date)} · ${q.a.txt.map(esc).join('; ')}</td></tr>`).join('')}</tbody></table>` : ''}`)}
   ${sec(8, 'Próximos 90 dias e alertas', D.prox.length ? `<ul>${D.prox.map(a => `<li><b class="${a.p === 1 ? 'rl-ruim' : 'rl-at'}">P${a.p}</b> ${esc(a.t)}</li>`).join('')}</ul><p class="rl-m">P1 = vencido ou interditado · P2 = vence em breve (docagem ≤ 90 d, calibração ≤ 30 d, óleo ≤ 50 h)</p>` : rlVazio('Nenhum alerta.'))}
   ${sec(9, 'Custos e horas-homem', N.custo.hh || N.custo.r ? `<p><b>${nf(N.custo.hh)} h</b> de mão de obra e <b>R$ ${nf(N.custo.r)}</b> em materiais e serviços nas OMs encerradas no período.</p>` : rlVazio('Sem custos lançados nas OMs encerradas no período.'))}
   ${sec(10, 'Evidências pendentes no Sankhya', D.sk.length ? `<ul>${D.sk.map(x => `<li><b>${esc(x.tipo)}</b> · OM ${esc(x.num || '—')} · ${esc(vName(x.vid))}</li>`).join('')}</ul>` : rlVazio('Nada pendente: todas as OMs encerradas estão anexadas no Sankhya.'))}
   </section>
   ${rlContra(D)}
   <section class="rl-pg rl-anexo"><h2 class="rl-ch">Anexo · Evidências fotográficas</h2><p class="rl-m">${D.fotos.reduce((a, o) => a + o.fotos.length, 0)} fotos de ${D.fotos.length} OMs encerradas no período, agrupadas por OM. Referência: ${rlNumDoc(D)}.</p>
   ${D.fotos.length ? D.fotos.map(o => `<div class="rl-om"><h3>${rlOmTit(o)}</h3>${o.tipo === 'C' && o.descricao ? `<p class="rl-m">${esc(o.descricao)}</p>` : ''}<div class="rl-ph-g">${o.fotos.map(f => rlFoto(f, o)).join('')}</div></div>`).join('') : rlVazio('Nenhuma OM encerrada com fotos no período.')}</section>
  </div>`;
}
// ---------- apresentação: capa · resumo executivo · metas · frota · horas · preventiva · corretiva · condição · próximos 90 dias · fotos ----------
function rlSlides(D) {
  const per = rlPerTx(D), N = D.N, fotosT = D.fotos.flatMap(o => o.fotos.map(f => ({ f, o }))), nota = rlNota();
  const sl = (t, h, sub) => `<div class="rl-s"><div class="rl-s-h"><small>${per}</small><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ''}</div><div class="rl-s-c">${h}</div></div>`;
  return [
    `<div class="rl-s rl-s-capa"><img src="${LOGOS.nav}" alt="Navecunha"><small>NAVEGAÇÃO CUNHA · MANUTENÇÃO DA FROTA</small><h1>Relatório de manutenção</h1><p>${per}</p><p class="rl-m">${rlNumDoc(D)} · ${D.V.length} empurradores em operação${temExemplo() ? ' · dados de exemplo' : ''}</p></div>`,
    sl('Resumo executivo', `<ul class="rl-exec rl-s-l">${rlExec(D).slice(0, 5).map(x => `<li>${x}</li>`).join('')}</ul>${nota ? `<div class="rl-nota rl-s-nota"><b>Decisões:</b> ${esc(nota).replace(/\n/g, '<br>')}</div>` : ''}`),
    sl('Indicadores e metas', `<div class="rl-s-metas">${rlMetas(D)}</div>`, 'NP 055 item 9 · comparação com o período anterior de mesma duração'),
    sl('Frota e saídas', `<div class="rl-ks rl-ks5">${[['Liberados', D.frota.lib, '#16A34A'], ['Com restrição', D.frota.rest, '#D97706'], ['Bloqueados', D.frota.bloq, '#DC2626'], ['Em viagem', D.frota.viag, '#1967D2'], ['Sem local', D.frota.sem, '#64748B']].map(([t, n, c]) => `<div class="rl-k"><small>${t}</small><b style="color:${c}">${n}</b></div>`).join('')}</div><p><b>${D.saidas.length}</b> saída${D.saidas.length === 1 ? '' : 's'} com restrição ou bloqueio no período${D.saidas.length ? ': ' + D.saidas.slice(0, 4).map(r => `${esc(vName(r.vessel))} (${esc(r.autorizou || 'sem nome')})`).join(' · ') : ''}.</p>`, `situação em ${brD(isoD(hoje()))} (hoje)`),
    sl('Horas de motor', `<div class="rl-two"><div>${rlBarras(D.V.map(v => [v.nome, D.H.filter(x => x.v === v && x.mcp && x.hrs != null).reduce((a, x) => a + x.hrs, 0), '#1967D2']), 640, 280)}</div><div>${D.meses.length > 1 ? rlColunas(D.meses.map(m => [m.lab, m.h]), 640, 280) : rlBarras(D.H.filter(x => x.mcp && x.acum != null).map(x => [x.v.nome + (mcpPos(x.v).length > 1 ? ' ' + x.p : ''), x.acum, '#16244A']), 640, 280)}</div></div>`, `MCP · ${nf(D.hPer)} h no período · ${D.meses.length > 1 ? 'à direita: frota por mês' : 'à direita: horímetro acumulado'}`),
    sl('Manutenção preventiva', rlBarras(D.V.map(v => { const q = N.porV[v.id] || {}; return [v.nome, q.den ? Math.round(q.ok / q.den * 100) : 0, q.den && q.ok / q.den >= .9 ? '#16A34A' : '#D97706']; }), 640, 280), `aderência por empurrador (%) · frota ${rlFmt(N.ader, 0, '%')} · ${nf(N.naoPrazo)} serviços não realizados no prazo`),
    sl('O que mais quebrou', D.pareto.length ? rlBarras(D.pareto.slice(0, 8).map(([k, n]) => [k, n, '#D97706']), 640, 260) : rlVazio('Nenhuma falha no período.'), `${N.corrAb.length} corretivas abertas · ${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `${c} ${D.cl[c] || 0}`).join(' · ')}`),
    sl('Condição dos motores', `<div class="rl-ks rl-ks4">${[['Trocas de óleo', D.trocas], ['Óleo vencido agora', D.oleoVenc.length], ['Laudos com alerta', D.laudos.length], ['Compressão < 1,45 MPa', D.comp.length]].map(([t, n]) => `<div class="rl-k"><small>${t}</small><b>${n}</b></div>`).join('')}</div>${D.laudos.length ? `<p>Laudos: ${D.laudos.slice(0, 4).map(x => `${esc(vName(x.r.vessel))} ${esc(x.r.pos)}`).join(' · ')}</p>` : ''}${D.param.length ? `<p>Parâmetros fora do limite: ${D.param.slice(0, 4).map(q => `${esc(vName(q.r.vessel))} ${esc(q.r.pos || '')} (${q.n})`).join(' · ')}</p>` : ''}`),
    sl('Próximos 90 dias', D.prox.length ? `<ul class="rl-s-l">${D.prox.slice(0, 9).map(a => `<li><b class="${a.p === 1 ? 'rl-ruim' : 'rl-at'}">P${a.p}</b> ${esc(a.t)}</li>`).join('')}</ul>` : rlVazio('Nenhum alerta.'), D.sk.length ? `${D.sk.length} evidência${D.sk.length === 1 ? '' : 's'} pendente${D.sk.length === 1 ? '' : 's'} no Sankhya` : ''),
    sl(`Evidências fotográficas · ${fotosT.length}`, fotosT.length ? `<div class="rl-ph-g rl-ph-s">${fotosT.slice(0, 12).map(x => rlFoto(x.f, x.o)).join('')}</div>${fotosT.length > 12 ? `<p class="rl-m">+ ${fotosT.length - 12} fotos no anexo do relatório</p>` : ''}` : rlVazio('Nenhuma foto no período.'), `${D.fotos.length} OMs encerradas com fotos de antes e depois`),
  ];
}
// ---------- telas ----------
function rlBarra(aba) {
  const at = [['mes', 'Este mês'], ['ant', 'Mês passado'], ['tri', 'Trimestre'], ['ano', 'Ano']];
  return `<div class="vh"><div><h1>${aba === 'apres' ? 'Apresentação mensal' : 'Relatório mensal'}</h1><p>Sempre recalculado dos registros no período escolhido · ${aba === 'apres' ? 'setas do teclado para avançar · tela cheia para o projetor' : 'imprima ou salve em PDF pelo botão'}</p></div><span class="sp"></span>
    <button class="mbtn" data-rlocultar title="Tira este item do menu neste aparelho; volta em Administração → Menu deste aparelho">Ocultar do menu</button>${aba === 'apres' ? '<button class="mbtn pri" data-rlcheia>⛶ Tela cheia</button>' : '<button class="mbtn pri" data-rlimp>🖨 Imprimir / PDF</button>'}</div>
   <div class="card rl-per"><label class="f">De<input type="date" id="rlDe" value="${RL.de}"></label><label class="f">Até<input type="date" id="rlAte" value="${RL.ate}"></label><div class="cm-chips">${at.map(([k, t]) => `<button class="cm-chip" data-rlat="${k}">${t}</button>`).join('')}</div></div>`;
}
function vRelMes() { rlPer(); const D = rlDados();
  return rlBarra('rel') + `<div class="card"><h2>Riscos, ações e decisões</h2><p class="note">Texto seu para este período (salvo neste aparelho). Entra no fim do relatório e no último slide.</p><textarea id="rlNota" rows="4" placeholder="Ex.: CJA X segue bloqueado aguardando bomba injetora; decidir compra do kit de reversor; antecipar docagem do CJA XX.">${esc(rlNota())}</textarea></div>
   <div class="card rl-wrap">${rlRelatorio(D)}</div>`; }
function vApresMes() { rlPer(); const S0 = RL.cache = rlSlides(rlDados()); RL.s = Math.min(RL.s, S0.length - 1);
  return rlBarra('apres') + `<div class="rl-ap" id="rlAp" tabindex="0"><div class="rl-stage">${S0[RL.s]}</div><div class="rl-nav"><button class="mbtn" data-rlv="-1">◀</button><span>${RL.s + 1} / ${S0.length}</span><button class="mbtn" data-rlv="1">▶</button></div></div>`; }
// as logos vão embutidas (data URL): a janela de impressão nem sempre consegue buscar arquivos (sem sinal ou pelo service worker)
const rlLogo64 = async u => { try { const b = await (await fetch(u)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(u); f.readAsDataURL(b); }); } catch (e) { return u; } };
async function rlImprimir() { const w = window.open('', '_blank'); if (!w) { toast('O navegador bloqueou a janela de impressão. Permita pop-ups para o SMF.'); return; }
  w.document.write('<p style="font:14px Arial;padding:20px">Montando o relatório…</p>');
  const nav = await rlLogo64(LOGOS.nav), vda = await rlLogo64(LOGOS.vda), html = rlRelatorio(rlDados()).split('src="' + LOGOS.nav + '"').join('src="' + nav + '"').split('src="' + LOGOS.vda + '"').join('src="' + vda + '"');
  w.document.open(); w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de manutenção ${RL.de} a ${RL.ate}</title><style>body{margin:0;font:13px/1.45 "Segoe UI",Arial,sans-serif;color:#0F172A;background:#fff}${RL_CSS}@page{size:A4;margin:12mm}.rl-sec{break-inside:auto}.rl-om,.rl-k,.rl-f{break-inside:avoid}</style></head><body>${html}<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`); w.document.close(); }
const AFTER_RL = () => { const m = $('#main');
  m.onchange = e => { const t = e.target; if (t.id === 'rlDe' || t.id === 'rlAte') { RL[t.id === 'rlDe' ? 'de' : 'ate'] = t.value; if (RL.de && RL.ate && RL.de > RL.ate) [RL.de, RL.ate] = [RL.ate, RL.de]; render(); } };
  m.oninput = e => { if (e.target.id === 'rlNota') { try { localStorage.setItem(rlNotaK(), e.target.value); } catch (er) { } } };
  m.onclick = e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rlat) { rlAtalho(b.dataset.rlat); render(); }
    else if (b.dataset.rlimp != null) rlImprimir();
    else if (b.dataset.rlocultar != null) { menuOcultar('relm', true); toast('Relatório mensal oculto no menu deste aparelho. Para voltar: Administração → Menu deste aparelho.'); }
    else if (b.dataset.rlv) rlIr(+b.dataset.rlv);
    else if (b.dataset.rlcheia != null) { const a = $('#rlAp'); if (a && a.requestFullscreen) a.requestFullscreen(); if (a) a.focus(); } }; };
// trocar de slide mexe só no palco: render() recriaria a tela e tiraria o projetor da tela cheia
function rlIr(d) { const L = RL.cache || []; if (!L.length) return; RL.s = Math.max(0, Math.min(L.length - 1, RL.s + d)); const st = document.querySelector('.rl-stage'), n = document.querySelector('.rl-nav span'); if (st) st.innerHTML = L[RL.s]; if (n) n.textContent = (RL.s + 1) + ' / ' + L.length; }
document.addEventListener('keydown', e => { if (VIEW !== 'apresmes' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); rlIr(1); } else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); rlIr(-1); } });
VX.relmes = vRelMes; VX.apresmes = vApresMes; AFTER.relmes = AFTER_RL; AFTER.apresmes = AFTER_RL;
NP_TAG.relmes = '9'; NP_TAG.apresmes = '9';
ICO.relm = '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 17v-3M12 17v-6M15 17v-4"/>';
{ const g = SECOES.findIndex(s => s.id === 'graf'); SECOES.splice(g < 0 ? SECOES.length : g + 1, 0, { id: 'relm', nome: 'Relatório mensal', sub: 'relatório e apresentação', cfg: true, views: [['relmes', 'Relatório'], ['apresmes', 'Apresentação']] }); }
// Administração: menu deste aparelho
function admMenuHTML() { if (!can.admin()) return '';
  return `<div class="card"><h2>Menu deste aparelho</h2><p class="note">Mostra ou esconde itens só neste aparelho (útil antes de uma apresentação). Esconder não apaga nada.</p><label class="chk"><input type="checkbox" data-menuoc="relm"${menuOculto('relm') ? '' : ' checked'}> Mostrar <b>Relatório mensal</b> no menu</label></div>`; }
document.addEventListener('change', e => { const t = e.target.closest('[data-menuoc]'); if (!t) return; menuOcultar(t.dataset.menuoc, !t.checked); toast(t.checked ? 'Item de volta no menu.' : 'Item oculto no menu deste aparelho.'); });
const RL_CSS = `.rl-doc{max-width:900px;margin:0 auto;color:#0F172A}.rl-capa{display:flex;align-items:center;gap:18px;border-bottom:3px solid #16244A;padding-bottom:12px;margin-bottom:10px}.rl-capa img{height:46px}.rl-capa>div{flex:1}.rl-capa small{color:#1967D2;font-weight:700;letter-spacing:.08em;font-size:11px}.rl-capa h1{margin:2px 0;font-size:24px;color:#16244A}.rl-capa p{margin:2px 0}
.rl-m{color:#64748B;font-size:12px}.rl-ex{background:#FEF7E0;border-radius:6px;padding:6px 10px;font-size:12px;margin:6px 0}
.rl-sec{margin:16px 0 8px}.rl-sec h2{font-size:16px;color:#16244A;display:flex;align-items:center;gap:8px;border-bottom:1px solid #E3E8EF;padding-bottom:4px;margin:0 0 8px}.rl-sec h2 span{background:#16244A;color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px}.rl-sec h3{font-size:13.5px;margin:12px 0 4px;color:#16244A}
.rl-ks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.rl-ks4{grid-template-columns:repeat(4,1fr)}.rl-ks5{grid-template-columns:repeat(5,1fr)}.rl-k{border:1px solid #E3E8EF;border-radius:8px;padding:8px 10px;background:#F8FAFC}.rl-k small{display:block;color:#475569;font-size:11.5px}.rl-k b{display:block;font-size:22px;margin:2px 0}.rl-k em{display:block;font-style:normal;color:#64748B;font-size:11px}
.rl-up{color:#16A34A;font-size:11.5px;font-weight:600}.rl-dn{color:#DC2626;font-size:11.5px;font-weight:600}.rl-eq{color:#64748B;font-size:11.5px}.rl-ruim{color:#DC2626}.rl-at{color:#D97706}
.rl-t{width:100%;border-collapse:collapse;font-size:12.5px;margin:4px 0}.rl-t th{background:#16244A;color:#fff;text-align:left;padding:5px 7px;font-weight:600}.rl-t td{border-bottom:1px solid #E3E8EF;padding:5px 7px;vertical-align:top}
.rl-f{border-left:4px solid #D97706;background:#FFFBEB;border-radius:6px;padding:7px 10px;margin:6px 0;font-size:12.5px}.rl-nada{color:#64748B;font-style:italic}.rl-nota{background:#F1F5F9;border-radius:8px;padding:10px 12px;white-space:normal}
.rl-om{margin:10px 0;break-inside:avoid}.rl-om h3{margin:0 0 2px}.rl-ph-g{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:6px}.rl-ph-g figure{margin:0;border:1px solid #E3E8EF;border-radius:6px;overflow:hidden;background:#fff}.rl-ph-g img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}.rl-ph{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#F1F5F9,#F1F5F9 8px,#E2E8F0 8px,#E2E8F0 16px);color:#64748B;font-size:12px;text-decoration:none}.rl-ph-g figcaption{font-size:11px;padding:4px 6px;color:#334155}
.rl-pg{break-after:page}.rl-pg:last-child{break-after:auto}.rl-pcapa{display:flex;flex-direction:column;min-height:900px;gap:26px}.rl-carimbo{width:100%;border-collapse:collapse;font-size:12px}.rl-carimbo td{border:1px solid #16244A;padding:6px 8px;vertical-align:top}.rl-carimbo small{display:block;color:#64748B;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.rl-carimbo .rl-lg{width:160px;text-align:center}.rl-carimbo .rl-lg img{height:34px;margin:2px 4px}.rl-carimbo .rl-cx{font-weight:700;color:#16244A;font-size:14px}
.rl-ctit{margin-top:120px}.rl-ctit small{color:#1967D2;font-weight:700;letter-spacing:.1em}.rl-ctit h1{font-size:36px;color:#16244A;margin:8px 0;line-height:1.15}.rl-ctit p{font-size:15px;margin:4px 0}
.rl-ass{width:100%;border-collapse:collapse;margin-top:auto;font-size:12.5px}.rl-ass th{background:#16244A;color:#fff;padding:5px 8px;text-align:left;width:50%}.rl-ass td{border:1px solid #CBD5E1;padding:8px;height:34px;vertical-align:top}.rl-ass .rl-lin{color:#64748B;font-size:11px}
.rl-ch{font-size:17px;color:#16244A;border-bottom:2px solid #16244A;padding-bottom:4px;margin:18px 0 8px}.rl-exec{margin:4px 0 10px 18px;padding:0;line-height:1.55}.rl-ok{color:#16A34A}.rl-two{display:grid;grid-template-columns:1fr 1fr;gap:2cqw}.rl-s-metas .rl-t{font-size:1.25cqw}.rl-s-metas .rl-m{font-size:1.1cqw}
@media screen{.rl-pg{border-bottom:2px dashed #CBD5E1;padding-bottom:18px;margin-bottom:18px}.rl-pcapa{min-height:auto}.rl-ctit{margin-top:40px}}`;
{ const st = document.createElement('style'); st.textContent = RL_CSS + `
.rl-per{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.rl-per .f{width:170px}.rl-wrap{padding:22px}
.rl-ap{outline:none;background:#0F172A;border-radius:12px;padding:14px;container-type:inline-size}.rl-ap:fullscreen{display:flex;flex-direction:column;justify-content:center;padding:2vw}.rl-stage{background:#F4F1EA;border-radius:10px;aspect-ratio:16/9;overflow:hidden}
.rl-s{height:100%;display:flex;flex-direction:column;padding:3.2cqw 4cqw;box-sizing:border-box;font-size:1.6cqw}.rl-s-h small{color:#9A5B00;font-weight:700;letter-spacing:.1em;font-size:1.2cqw}.rl-s-h h2{margin:.3cqw 0;font-size:3.4cqw;color:#16244A}.rl-s-h p{margin:0 0 1cqw;color:#475569;font-size:1.5cqw}.rl-s-c{flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.4cqw}
.rl-s .rl-ks{gap:1.2cqw}.rl-s .rl-k{padding:1.2cqw 1.4cqw}.rl-s .rl-k small{font-size:1.3cqw}.rl-s .rl-k b{font-size:3.2cqw}.rl-s .rl-k em,.rl-s .rl-up,.rl-s .rl-dn,.rl-s .rl-eq{font-size:1.15cqw}.rl-s svg text{font-size:12px}
.rl-s-capa{justify-content:center;background:#16244A;color:#F4F1EA}.rl-s-capa img{height:5cqw;background:#F4F1EA;border-radius:.6cqw;padding:.6cqw;align-self:flex-start;margin-bottom:2cqw}.rl-s-capa small{color:#E8A33D;font-weight:700;letter-spacing:.12em;font-size:1.3cqw}.rl-s-capa h1{font-size:5.4cqw;margin:.6cqw 0}.rl-s-capa p{font-size:2cqw;margin:.3cqw 0}.rl-s-capa .rl-m{color:#C9D3E6;font-size:1.5cqw}
.rl-s-l{font-size:1.6cqw;line-height:1.5;margin:0}.rl-ph-s{grid-template-columns:repeat(6,1fr)}.rl-ph-s figcaption{font-size:1cqw}.rl-s-nota{font-size:1.8cqw}
.rl-nav{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:10px;color:#C9D3E6}.rl-ap:fullscreen .rl-nav{opacity:.35}.rl-ap:fullscreen .rl-nav:hover{opacity:1}`; document.head.appendChild(st); }
