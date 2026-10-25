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
const rlVazio = t => `<p class="rl-nada">${t}</p>`;
function rlFoto(f, o) { const leg = `<figcaption><b>${esc(f.tipo || 'FOTO')}</b>${f.leg ? ' · ' + esc(f.leg) : ''}</figcaption>`;
  if (f.src) return `<figure><img src="${f.src}" alt="${esc((f.tipo || '') + ' ' + (f.leg || ''))}">${leg}</figure>`;
  if (f.fid) return `<figure><a class="rl-ph" href="https://drive.google.com/file/d/${esc(f.fid)}/view" target="_blank" rel="noopener">☁ abrir no Drive</a>${leg}</figure>`;
  return `<figure><div class="rl-ph">${o.seed ? 'foto de exemplo' : 'foto só no aparelho que registrou'}</div>${leg}</figure>`; }
const rlOmTit = o => `OM ${esc(o.num || '—')} · ${esc(vName(o.vessel))} · ${o.tipo === 'C' ? 'Corretiva ' + esc(o.classe || '') : 'Preventiva'} · encerrada em ${o.fechadoAt ? brD(isoD(new Date(o.fechadoAt))) : '—'}`;
// compressão do MCP: último ensaio de cada motor, do mais perto do overhaul para o mais longe (mesma conta da tela de Compressão, cmpDados)
// gráficos tirados das próprias telas do SMF (mesmo desenho que o Supervisor já usa)
function rlTela(html, fn) { const t = document.createElement('div'); t.innerHTML = html; return fn(t) || ''; }
function rlOleoGraf() { if (typeof vOleoP !== 'function') return ''; const m = O3.mode; O3.mode = 'frota';
  try { return rlTela(vOleoP(), t => { const c = [...t.querySelectorAll('.card')].find(c => /Saldo para a troca/.test((c.querySelector('h2') || {}).textContent || '')); if (!c) return ''; const b = c.querySelector('.ol-bs'), f = c.querySelector('.ol-ft'); return (b ? b.outerHTML : '') + (f ? f.outerHTML : ''); }); }
  catch (e) { return ''; } finally { O3.mode = m; } }
// capa no modelo do Anexo II (carimbo do documento controlado, título, dados do registro, revisão e aprovação)
// contracapa = rastreabilidade do relatório (mesma lógica da contracapa do Anexo II): cálculo, registros usados, evidências, controle documental, referências e assinaturas
function rlContra(D) { const { ini, fim } = D, dentro = s => s && pD(s) >= ini && pD(s) < fim, nF = D.fotos.reduce((a, o) => a + o.fotos.length, 0), F = D.fotos.flatMap(o => o.fotos), nDrive = F.filter(f => f.fid).length;
  const tit = t => `<div style="font-size:13px;font-weight:700;color:#1F2A44;margin:14px 0 4px;text-transform:uppercase;letter-spacing:.05em">${t}</div>`;
  const tb = (cab, L, w) => `<table class="rl-t"><thead><tr>${cab.map((c, i) => `<th style="width:${w[i]}">${c}</th>`).join('')}</tr></thead><tbody>${L.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const R = [['OMs preventivas encerradas (Anexo II-B)', D.N.prevEnc.length, 'Google Drive (PDF) e anexo da OM no Sankhya'], ['OMs corretivas abertas · encerradas (Anexo II-A)', D.N.corrAb.length + ' · ' + D.N.corrEnc.length, 'Google Drive (PDF) e anexo da OM no Sankhya'],
    ['FR 027_L (chegada e saída)', recs('fr027').filter(r => !r.excluido && dentro(r.date)).length, 'Google Drive (PDF)'], ['FR 049_B (troca de óleo)', D.trocas, 'Google Drive (PDF)'], ['Registros de saída', recs('saida').filter(r => !r.excluido && dentro(r.date)).length, 'SMF'],
    ['Leituras de horímetro', recs('hor').filter(r => dentro(r.date)).length, 'SMF'], ['Laudos de óleo', recs('laudo').filter(r => !r.excluido && dentro(r.date)).length, 'SMF e laboratório'], ['Ensaios de compressão', recs('comp').filter(r => !r.excluido && dentro(r.date)).length, 'SMF'],
    ['Leituras do MCP em viagem', recs('param').filter(r => !r.excluido && dentro(r.date)).length, 'SMF'], ['Fotos das OMs (anexo)', nF + (nF ? ` (${nDrive} no Drive)` : ''), nF && nDrive === nF ? 'Google Drive' : 'Google Drive e aparelhos que registraram']];
  const C = [['Disponibilidade', '(horas calendário − horas paradas por manutenção) ÷ horas calendário', '≥ 95%'], ['MTBF', 'horas de operação ÷ nº de falhas Crítica e Alta', '≥ 500 h'], ['MTTR', 'tempo de reparo (abertura → liberação) ÷ falhas liberadas', '≤ 8 h'], ['Backlog', 'OMs com início vencido ÷ OMs em aberto', '≤ 5%'],
    ['Plano preditivo', 'análises de óleo e tendências feitas ÷ programadas no trimestre', '≥ 80%'], ['Conformidade de fotos', 'OMs encerradas com foto de antes e depois ÷ OMs encerradas', '100%'], ['Aderência ao cronograma', 'feito no prazo ÷ o que já venceu, nos meses do período', 'referência ≥ 90%'], ['Horas de motor', 'horímetro no fim − horímetro antes do início (MCA sem horímetro: estimativa)', '—']];
  return `<section class="rl-pg rl-contra"><div style="font-size:18px;color:#1F2A44;margin:6px 0 4px;border-bottom:1px solid #C7CED8;padding-bottom:6px">Rastreabilidade · ${rlNumDoc(D)}</div>
    ${tit('1 · Como os números são calculados')}${tb(['Indicador', 'Fórmula', 'Meta'], C, ['24%', '60%', '16%'])}
    ${tit('2 · Registros usados e onde estão')}${tb(['Registro', 'Quantidade no período', 'Onde está'], R, ['44%', '22%', '34%'])}
    ${tit('3 · Controle documental (NP 055 item 4.8)')}<div style="font-size:11.5px;line-height:1.55">Relatório gerado pelo SMF ${esc(VERSAO_APP)} em ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${S.session ? ' por ' + esc(S.session.name) : ''} · recalculado dos registros a cada emissão: relatórios do mesmo período emitidos em datas diferentes podem diferir se houver lançamentos atrasados · guardar a via assinada com a análise crítica do período (SGI).</div>
    ${tit('4 · Referências')}<div style="font-size:11.5px;line-height:1.55">NP Navecunha 055 itens 4.8 (registros), 5.3 a 5.5 (inspeções, viagem e corretiva), 7.2 a 7.4 (preventiva e preditiva) e 9 (indicadores) · Anexo I (plano preventivo) · Anexos II-A e II-B (registros de manutenção) · FR 027_L e FR 049_B.</div>
    <table class="rl-ass" style="margin-top:26px"><tr><th>Elaborado por</th><th>Aprovado por</th></tr><tr><td>${esc(S.session ? S.session.name : '')}<br><span class="rl-m">Supervisor de Manutenção</span></td><td><br><span class="rl-m">Gerência</span></td></tr><tr><td class="rl-lin">Assinatura e data</td><td class="rl-lin">Assinatura e data</td></tr></table></section>`; }
// ---------- quadros das telas (o relatório é montado com os próprios quadros do SMF, sem desenho próprio) ----------
function rlQuadros(html, titulos) { const t = document.createElement('div'); t.innerHTML = html; const cards = [...t.querySelectorAll('.card')];
  return titulos.map(tt => { const re = tt instanceof RegExp ? tt : new RegExp('^\\s*' + tt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const c = cards.find(c => { const h = c.querySelector('h2,h3,.cf-hd'); return h && re.test(h.textContent); }); if (!c) return '';
    const x = c.cloneNode(true); x.querySelectorAll('button,select,input,textarea,.cm-grip,.cm-rz,.lrz,a.mbtn,.mbtn,details,summary,.rt-b').forEach(e => e.remove()); x.classList.add('rl-q'); if (/Resumo por item/.test((x.querySelector('h2') || {}).textContent || '')) x.querySelectorAll('table').forEach(tb => tb.classList.add('rl-fix')); return x.outerHTML; }).join(''); }
function rlTelaQ(fn, titulos, prep, volta) { const v0 = VIEW, a0 = ARG; try { if (prep) prep(); ARG = ''; return rlQuadros(fn(), titulos); } catch (e) { console.warn('relatório', e); return ''; } finally { VIEW = v0; ARG = a0; if (volta) volta(); } }
function rlSecoes(D) { const per = rlPerTx(D), ini = D.ini, fim = D.fim, mesmoMes = ini.getFullYear() === new Date(fim - 864e5).getFullYear() && ini.getMonth() === new Date(fim - 864e5).getMonth();
  const dentro = s => s && pD(s) >= ini && pD(s) < fim, nota = rlNota(), rm0 = RM_SEL, pa0 = PRV.ano;
  const kg = (() => { const t = document.createElement('div'); t.innerHTML = vKpi(); const g = t.querySelector('.kgrid'); return g ? `<div class="card rl-q">${g.outerHTML}</div>` : ''; })();
  const troc = recs('lub').filter(r => r.tipo === 'fr049' && !r.excluido && dentro(r.date)).sort((a, b) => a.date < b.date ? 1 : -1);
  const docs = D.V.flatMap(v => (typeof docaHist === 'function' ? docaHist(v) : []).filter(h => dentro(h.ent) || dentro(h.sai)).map(h => ({ v, h })));
  const docTab = `<div class="card rl-q"><h2>Docagens no período · ${docs.length}</h2>${docs.length ? `<table class="t"><thead><tr><th>Empurrador</th><th>Entrada</th><th>Saída</th><th>Parada</th><th>Estaleiro</th><th>Serviços</th><th>Custo (R$ mil)</th></tr></thead><tbody>${docs.map(({ v, h }) => `<tr><td><b>${esc(v.nome)}</b></td><td>${brD(h.ent)}</td><td>${h.sai ? brD(h.sai) : 'no estaleiro'}</td><td>${h.parada != null ? h.parada + ' d' : '—'}</td><td>${esc(h.est || '—')}</td><td>${esc(h.serv || '—')}</td><td>${h.custo != null ? nf(h.custo) : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma docagem com entrada ou saída no período. O cronograma acima mostra o histórico e as próximas.</p>'}</div>`;
  const trocTab = `<div class="card rl-q"><h2>Trocas de óleo lançadas no período · ${troc.length}</h2>${troc.length ? `<table class="t"><thead><tr><th>Data</th><th>Empurrador</th><th>OM</th><th>Local</th><th>Equipamentos trocados</th><th>Litros</th></tr></thead><tbody>${troc.slice(0, 60).map(r => `<tr><td>${brD(r.date)}</td><td><b>${esc(vName(r.vessel))}</b></td><td>${esc(r.om || '—')}</td><td>${esc(r.localTx || r.local || '—')}</td><td>${esc(Array.isArray(r.eq) ? r.eq.join(', ') : r.eq || '—')}</td><td>${r.L != null ? nf(+r.L, 1) + ' L' : '—'}</td></tr>`).join('')}</tbody></table>${troc.length > 60 ? `<p class="note">+ ${troc.length - 60} trocas no período (lista completa em Condição dos motores → Óleo da frota).</p>` : ''}` : '<p class="note">Nenhuma troca lançada no período.</p>'}</div>`;
  const sai = D.saidas.length ? `<div class="card rl-q"><h2>Saídas com restrição ou bloqueio no período · ${D.saidas.length}</h2><table class="t"><thead><tr><th>Data</th><th>Empurrador</th><th>Situação</th><th>Autorizou</th><th>Justificativa</th></tr></thead><tbody>${D.saidas.map(r => `<tr><td>${brD(r.date)}</td><td><b>${esc(vName(r.vessel))}</b></td><td>${esc(r.sitTxt || '')}</td><td>${esc(r.autorizou || '—')}</td><td>${esc(r.just || '—')}</td></tr>`).join('')}</tbody></table></div>` : '';
  const S0 = [
    ['Resumo executivo', `<div class="card rl-q"><h2>Resumo do período · ${per}</h2><ul class="rl-exec">${rlExec(D).map(x => `<li>${x}</li>`).join('')}</ul><h3>Decisões e ações necessárias</h3>${nota ? `<div class="rl-nota">${esc(nota).replace(/\n/g, '<br>')}</div>` : '<p class="note">Escreva no campo “Riscos, ações e decisões” acima do relatório.</p>'}</div>`],
    ['Indicadores da NP 055', kg + rlTelaQ(vKpi, ['Empurradores em risco alto', 'Alertas críticos'])],
    ['Frota agora e próximos dias', rlTelaQ(vPainel, ['1 · Como está a frota', '2 · O que fazer agora']) + sai + rlTelaQ(vEmitir, ['O que tem para abrir na frota']) + rlTelaQ(vOMs3, ['Preventivas em aberto']) + rlTelaQ(vFalhas2, ['Corretivas em andamento'])],
    ['Cronograma preventivo', rlTelaQ(vPR, [/previsto\s*×\s*realizado/i, 'Resumo'], () => { PRV.ano = new Date(fim - 864e5).getFullYear(); }, () => { PRV.ano = pa0; })],
    ['O que foi feito e o que mais quebrou', (() => { RM_SEL = mesmoMes ? ini.getFullYear() * 12 + ini.getMonth() : 'todos'; try { const t = document.createElement('div'); t.innerHTML = resumoMesHTML(); t.querySelectorAll('button,select,input,.ab4-sec').forEach(e => e.remove()); return `<div class="rl-q rl-rm">${t.innerHTML}</div>`; } finally { RM_SEL = rm0; } })()],
    ['Horas de motor', typeof hfPareto === 'function' ? `<div class="card rl-q"><h2>Pareto · horas viajadas por empurrador</h2>${hfPareto()}</div>` : ''],
    ['Óleo da frota', `<div class="card rl-q"><h2>Saldo para a troca · frota</h2>${rlOleoGraf()}</div>` + trocTab],
    ['Análise de óleo', rlTelaQ(vAnOleo, ['Matriz do laudo', /^\s*Tendência/i])],
    ['Compressão do MCP', rlTelaQ(vCompr, ['Matriz de compressão da frota', 'Histórico de compressão'])],
    ['Calibração e docagem', rlTelaQ(VX.controle, ['A · Resumo por item', 'A · Cronograma histórico']) + docTab],
  ].filter(s => s[1]);
  return S0; }
// capa e índice: as mesmas folhas do Anexo II (.sheet, carimbo, cabeçalho e rodapé do documento controlado)
function rlCapa(D, anexo) { const per = rlPerTx(D), B = 'border:1px solid #1F2A44', sep = 'border-left:1px solid #1F2A44', T = rlSecoes.cache || [];
  const cel = (lab, v, x) => `<div style="padding:6px 10px;${x || ''}"><div style="font-size:8.5px;letter-spacing:.06em;color:#5F6B7A;text-transform:uppercase">${lab}</div><div style="font-size:12px;font-weight:600;color:#1F2A44">${v}</div></div>`;
  const ln = (cols, cells) => `<div style="display:grid;grid-template-columns:${cols};border-bottom:1px solid #1F2A44">${cells}</div>`;
  const dado = (lab, v, span) => `<div style="padding:6px 8px;border:1px solid #C7CED8;margin:-1px 0 0 -1px${span ? `;grid-column:span ${span}` : ''}"><div style="font-size:8.5px;color:#5F6B7A;text-transform:uppercase">${lab}</div><div style="font-size:12px;min-height:16px">${v || '&nbsp;'}</div></div>`;
  return `<div class="sheet rl-folha"><div style="${B};height:1050px;margin:0;display:flex;flex-direction:column;background:#fff">
    ${ln('1.1fr 1.6fr 1.1fr', `<div style="display:flex;gap:14px;align-items:center;justify-content:center;padding:8px"><img src="${LOGOS.vda}" style="height:46px" alt=""><img src="${LOGOS.nav}" style="height:42px" alt=""></div><div style="${sep};display:flex;align-items:center;justify-content:center;font-size:22px;letter-spacing:.3em;font-weight:600;color:#1F2A44">RELATÓRIO</div>${cel('Doc. nº', rlNumDoc(D), sep)}`)}
    ${ln('2.7fr 1.1fr', cel('Título', 'Relatório de Manutenção – Empurradores Fluviais') + cel('Página', '1', sep))}
    ${ln('1.35fr 1.35fr .55fr .55fr', cel('Data de emissão', brD(isoD(hoje()))) + cel('Período', per, sep) + cel('Rev.', '00', sep) + cel('Ed.', '00', sep))}
    ${ln('2.7fr 1.1fr', cel('Origem', 'NBR ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018 · NP Navecunha 055 item 9') + cel('Aplicável à', 'Navegação Cunha Ltda.', sep))}
    <div style="flex:1;padding:70px 60px 0">
      <div style="font-size:44px;font-weight:700;color:#1F2A44;line-height:1">${anexo ? 'Anexo Técnico' : 'Relatório Mensal'}</div><div style="font-size:21px;color:#1F2A44;margin-top:10px">${anexo ? 'Quadros completos e evidências fotográficas' : 'Manutenção da Frota'}</div><div style="font-size:13px;color:#5F6B7A;margin-top:8px">Empurradores Fluviais · ${per}${temExemplo() ? ' · dados de exemplo' : ''}</div>
      <div style="margin-top:46px">${(anexo ? T.slice(0, 4) : T).map((s, i) => `<div style="display:flex;gap:12px;align-items:center;margin:10px 0"><span style="background:#1F2A44;color:#fff;font-weight:700;font-size:11px;padding:4px 10px;min-width:22px;text-align:center">${anexo ? i + 1 : 'Folha ' + (i + 2)}</span><div style="flex:1;font-size:14px;color:#1F2A44;border-bottom:1px dotted #9AA5B1">${esc(s[0])}</div></div>`).join('')}${anexo ? `<div style="font-size:10px;color:#5F6B7A;margin-top:6px">… e mais ${Math.max(0, T.length - 4)} seções · índice na página 2</div>` : '<div style="font-size:10px;color:#5F6B7A;margin-top:6px">Quadros completos e todas as fotos: Anexo técnico e evidências</div>'}</div>
      <div style="margin-top:46px;font-size:9.5px;font-weight:700;letter-spacing:.08em;color:#1F2A44">DADOS DO RELATÓRIO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 2fr;margin-top:6px;padding:1px 0 0 1px">${dado('Nº do relatório', rlNumDoc(D))}${dado('Empurradores em operação', String(D.V.length))}${dado('Período analisado', per)}${dado('OMs encerradas', String(D.N.prevEnc.length + D.N.corrEnc.length))}${dado('Corretivas abertas', String(D.N.corrAb.length))}${dado('Evidências fotográficas', D.fotos.reduce((a, o) => a + o.fotos.length, 0) + ' fotos em anexo')}${dado('Elaborado por', esc(S.session ? S.session.name : '') + ' · Supervisor de Manutenção', 2)}${dado('Aprovado por (Gerência)', '')}</div>
      <p style="font-size:9px;color:#5F6B7A;margin-top:46px">Documento controlado pelo SGI. Propriedade da Navegação Cunha Ltda. É proibida a reprodução, a cessão a terceiros ou o uso fora da finalidade a que se destina sem autorização. Recalculado dos registros do SMF a cada emissão.</p></div>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;border-top:1px solid #1F2A44;font-size:11px">
      <div style="padding:6px 10px"><div style="display:grid;grid-template-columns:50px 90px 1fr;font-size:8.5px;color:#5F6B7A;text-transform:uppercase"><span>Rev.</span><span>Data</span><span>Descrição</span></div><div style="display:grid;grid-template-columns:50px 90px 1fr;margin-top:4px"><span>00</span><span>${brD(isoD(hoje()))}</span><span>Emissão do período</span></div></div>
      <div style="${sep}">${cel('Área responsável', 'Manutenção', 'border-bottom:1px solid #1F2A44')}<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #1F2A44">${cel('Elaborado por', esc(S.session ? S.session.name : '—'))}${cel('Verificado por', '&nbsp;', sep)}</div>${cel('Aprovação', 'Gerência')}</div></div></div><div class="sf"><span>Documento controlado pelo SGI · gerado pelo SMF ${VERSAO_APP}</span><span>GRUPO VDA · ISO 9001 · ISO 14001 · ISO 45001</span></div></div>`; }
function rlIndice(D, T) { return `<div class="sheet rl-folha"><div class="hdr"><div><img class="ln" src="${LOGOS.nav}" alt=""></div><div class="c"><b>RELATÓRIO MENSAL – MANUTENÇÃO DA FROTA</b><span>Empurradores Fluviais · ${rlPerTx(D)}</span><span>${rlNumDoc(D)} · NP Navecunha 055 item 9 · Rev. 00</span></div><div><img class="lv" src="${LOGOS.vda}" alt=""></div></div><div class="body">
    <div style="font-size:18px;color:#1F2A44;margin:10px 0 8px;border-bottom:1px solid #C7CED8;padding-bottom:6px">Índice</div>
    ${T.map((s, i) => `<div style="display:flex;gap:8px;align-items:baseline;font-size:13px;margin:7px 0"><span style="width:26px;color:#1F2A44;font-weight:700">${i + 1}.</span><span style="flex:1;border-bottom:1px dotted #9AA5B1;color:#1F2A44">${esc(s[0])}</span></div>`).join('')}
    <div style="display:flex;gap:8px;align-items:baseline;font-size:13px;margin:7px 0"><span style="width:26px;color:#1F2A44;font-weight:700">${T.length + 1}.</span><span style="flex:1;border-bottom:1px dotted #9AA5B1;color:#1F2A44">Rastreabilidade (contracapa)</span></div>
    <div style="display:flex;gap:8px;align-items:baseline;font-size:13px;margin:7px 0"><span style="width:26px;color:#1F2A44;font-weight:700">A.</span><span style="flex:1;border-bottom:1px dotted #9AA5B1;color:#1F2A44">Anexo · evidências fotográficas</span></div>
    <p style="font-size:11px;color:#5F6B7A;margin-top:18px">Cada seção traz os mesmos quadros das telas do SMF, com os dados do período ${rlPerTx(D)} (situação da frota e alertas: na data de emissão).</p></div><div class="sf"><span>Documento controlado pelo SGI · gerado pelo SMF ${VERSAO_APP}</span><span>Página <b>2</b></span></div></div>`; }
// anexo técnico e evidências: todos os quadros completos das telas, a contracapa de rastreabilidade e todas as fotos
function rlAnexoTec(D) { const T = rlSecoes.cache = rlSecoes(D);
  return `<div class="rl-doc">${rlCapa(D, true)}${rlIndice(D, T)}
   ${T.map((s, i) => `<section class="rl-pg rl-sec"><h2 class="rl-sh"><span>${i + 1}</span>${esc(s[0])}</h2>${s[1]}</section>`).join('')}
   ${rlContra(D)}
   <section class="rl-pg rl-anexo"><h2 class="rl-sh"><span>A</span>Anexo · Evidências fotográficas</h2><p class="rl-m">${D.fotos.reduce((a, o) => a + o.fotos.length, 0)} fotos de ${D.fotos.length} OMs encerradas no período, agrupadas por OM. Referência: ${rlNumDoc(D)}.</p>
   ${D.fotos.length ? D.fotos.map(o => `<div class="rl-om"><h3>${rlOmTit(o)}</h3>${o.tipo === 'C' && o.descricao ? `<p class="rl-m">${esc(o.descricao)}</p>` : ''}<div class="rl-ph-g">${o.fotos.map(f => rlFoto(f, o)).join('')}</div></div>`).join('') : rlVazio('Nenhuma OM encerrada com fotos no período.')}</section></div>`; }
// ---------- relatório gerencial: 6 folhas A4 (decisão do Supervisor, 25/10/2026: a gerência lê no máximo 5 ou 6 folhas) ----------
// cada folha é uma .sheet do Anexo II; o conteúdo que passar do tamanho é reduzido para caber (rlCaber), nunca vira 2 páginas
function rlLinhas(cardHtml, manter) { if (!cardHtml) return ''; const t = document.createElement('div'); t.innerHTML = cardHtml; t.querySelectorAll('tbody tr').forEach((tr, i) => { if (!manter(tr, i)) tr.remove(); }); return t.innerHTML; }
function rlFolha(D, n, titulo, corpo) {
  return `<div class="sheet rl-folha rl-g"><div class="hdr"><div><img class="ln" src="${LOGOS.nav}" alt=""></div><div class="c"><b>RELATÓRIO MENSAL – MANUTENÇÃO DA FROTA</b><span>Empurradores Fluviais · ${rlPerTx(D)}</span><span>${rlNumDoc(D)} · NP Navecunha 055 item 9 · Rev. 00</span></div><div><img class="lv" src="${LOGOS.vda}" alt=""></div></div>
    <div class="body"><h2 class="rl-sh"><span>${n}</span>${esc(titulo)}</h2>${corpo}</div><div class="sf"><span>Documento controlado pelo SGI · gerado pelo SMF ${VERSAO_APP}</span><span>Folha <b>${n}</b> de <b>6</b></span></div></div>`; }
function rlCorrTab(L) { const hP = o => o.interd === 'Sim' && o.interdDT ? Math.max(0, Math.round(((o.liberacao ? pD(o.liberacao) : hoje()) - pD(o.interdDT)) / 3600e3)) : null;
  return L.length ? `<table class="t"><thead><tr><th>Aberta</th><th>Empurrador</th><th>OM</th><th>Equipamento</th><th>O que aconteceu</th><th>O que foi feito</th><th>Classe</th><th>Parado</th></tr></thead><tbody>${L.map(o => `<tr><td style="white-space:nowrap!important">${brD(String(o.abertura || '').slice(0, 10))}</td><td style="white-space:nowrap!important"><b>${esc(vName(o.vessel))}</b></td><td style="white-space:nowrap!important">${esc(o.num || '—')}</td><td>${esc(o.equip || '—')}</td><td>${esc(o.descricao || '')}</td><td>${o.status === 'encerrada' ? esc(String(o.servicos || '').trim() || 'serviço não informado') : '<i>em andamento</i>'}</td><td><span class="pill ${o.classe === 'Crítica' ? 'p-bad' : o.classe === 'Alta' ? 'p-warn' : 'p-mut'}">${esc(o.classe || '—')}</span></td><td>${hP(o) != null ? hP(o) + ' h' : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma corretiva aberta no período.</p>'; }
function rlGerencial(D) { const N = D.N, A = D.A, nota = rlNota(), { ini, fim } = D, dentro = s => s && pD(s) >= ini && pD(s) < fim;
  const kg = (() => { const t = document.createElement('div'); t.innerHTML = vKpi(); const g = t.querySelector('.kgrid'); return g ? `<div class="card rl-q">${g.outerHTML}</div>` : ''; })();
  // folha 3: frota e próximos dias
  const frota = rlLinhas(rlTelaQ(vPainel, ['1 · Como está a frota']), tr => /BLOQUEAD|COM RESTRI|INTERDIT/i.test(tr.textContent));
  const urg = (typeof f2Agora === 'function' ? f2Agora() : []).filter(x => x.p === 1);
  const abrir = rlLinhas(rlTelaQ(vEmitir, ['O que tem para abrir na frota']), tr => !/^\s*Frota\b/.test(tr.textContent) || true);
  const cron = rlLinhas(rlTelaQ(vPR, [/previsto\s*×\s*realizado/i], () => { PRV.ano = new Date(fim - 864e5).getFullYear(); }, () => { PRV.ano = hoje().getFullYear(); }), tr => /Consolidado/i.test(tr.textContent));
  // folha 4: o que mais quebrou
  const eqA = {}; A.corrAb.forEach(o => { const k = String(o.equip || '').trim() || 'Equipamento não informado'; eqA[k] = (eqA[k] || 0) + 1; });
  const rep = D.pareto.filter(p => p[1] > 1), comp = D.pareto.slice(0, 8).map(([k, n]) => `<tr><td>${esc(k)}</td><td><b>${n}</b></td><td>${eqA[k] || 0}</td><td class="${n > (eqA[k] || 0) ? 'rl-ruim' : 'rl-ok'}">${n > (eqA[k] || 0) ? '▲ piorou' : n < (eqA[k] || 0) ? '▼ melhorou' : '= igual'}</td></tr>`).join('');
  const corr = [...N.corrAb].sort((a, b) => (a.abertura || '') < (b.abertura || '') ? 1 : -1);
  // folha 5: condição
  const cmp = rlLinhas(rlTelaQ(vCompr, ['Matriz de compressão da frota']), (tr, i) => i < 5);
  const lau = rlLinhas(rlTelaQ(vAnOleo, ['Matriz do laudo']), tr => /Crítico|Atenção/i.test(tr.textContent));
  const ol = lubDados().filter(x => !foraOp(x.v) && x.horas != null && x.horas <= OL_ALERTA_H).sort((a, b) => a.horas - b.horas);
  // folha 6: docagem e calibração
  const docs = D.V.flatMap(v => (typeof docaHist === 'function' ? docaHist(v) : []).filter(h => dentro(h.ent) || dentro(h.sai)).map(h => ({ v, h })));
  const prox = D.V.map(v => ({ v, d: docaVessel(v) })).filter(x => x.d && x.d.dias != null && x.d.dias <= 90).sort((a, b) => a.d.dias - b.d.dias);
  const cal = D.prox.filter(a => /calibra/i.test(a.t));
  const f2 = `<div class="card rl-q"><h2>Resumo do período</h2><ul class="rl-exec">${rlExec(D).slice(0, 5).map(x => `<li>${x}</li>`).join('')}</ul><h3>Decisões e ações necessárias</h3>${nota ? `<div class="rl-nota">${esc(nota).replace(/\n/g, '<br>')}</div>` : '<p class="note">Escreva no campo “Riscos, ações e decisões” acima do relatório.</p>'}</div>${kg}`;
  const f3 = (frota || '<div class="card rl-q"><h2>Empurradores bloqueados ou com restrição</h2><p class="note">Nenhum: toda a frota liberada.</p></div>')
    + `<div class="card rl-q"><h2>Urgente agora · ${urg.length}</h2>${urg.length ? `<ul class="rl-urg">${urg.map(x => `<li>${x.txt}</li>`).join('')}</ul>` : '<p class="note">Nada urgente.</p>'}</div>` + abrir + cron;
  const f4 = `<div class="rl-2c"><div class="card rl-q"><h2>Pareto por equipamento · ${N.corrAb.length} falhas</h2>${D.pareto.length ? rmPareto(D.pareto.slice(0, 8).map(([k, n]) => [k, n])) : '<p class="note">Nenhuma falha no período.</p>'}</div>
    <div class="card rl-q"><h2>Comparação com o período anterior</h2>${comp ? `<table class="t"><thead><tr><th>Equipamento</th><th>Período</th><th>Anterior</th><th></th></tr></thead><tbody>${comp}</tbody></table>` : '<p class="note">Sem falhas.</p>'}<p class="note">${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `${c}: ${D.cl[c] || 0}`).join(' · ')} · ${D.atrasadas.length} com prazo estourado agora · ${D.efic.length} eficácia${D.efic.length === 1 ? '' : 's'} vencida${D.efic.length === 1 ? '' : 's'}</p></div></div>
    <div class="card rl-q"><h2>Corretivas do período</h2>${rlCorrTab(corr)}</div>
    ${rep.length ? `<div class="card rl-q"><h2>Falhas que se repetiram</h2>${rep.slice(0, 4).map(([k, n, L]) => { const o = L.find(x => x.causa || x.mitig) || L[L.length - 1]; return `<div class="rl-f"><b>${esc(k)} · ${n} falhas</b> (${L.map(x => esc(vName(x.vessel))).join(', ')})${o.causa ? `<div><i>Causa:</i> ${esc(o.causa)}</div>` : ''}${o.mitig ? `<div><i>Ação:</i> ${esc(o.mitig)}</div>` : '<div><i>Ação:</i> não registrada</div>'}</div>`; }).join('')}</div>` : ''}`;
  const f5 = `${cmp}${lau || '<div class="card rl-q"><h2>Matriz do laudo</h2><p class="note">Nenhum laudo com alerta.</p></div>'}
    <div class="rl-2c"><div class="card rl-q"><h2>Óleo: vencido ou perto da troca · ${ol.length}</h2>${ol.length ? `<table class="t"><thead><tr><th>Empurrador</th><th>Equipamento</th><th>Saldo</th></tr></thead><tbody>${ol.slice(0, 10).map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td>${esc(eqNomeC(x.v, x.e))}</td><td class="${x.horas < 0 ? 'rl-ruim' : 'rl-at'}">${x.horas < 0 ? 'vencido há ' + nf(-x.horas) + ' h' : 'faltam ' + nf(x.horas) + ' h'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma troca vencida nem nas próximas ' + OL_ALERTA_H + ' h.</p>'}</div>
    <div class="card rl-q"><h2>Pareto · horas viajadas</h2>${typeof hfPareto === 'function' ? hfPareto() : ''}</div></div>`;
  const f6 = `<div class="card rl-q"><h2>Docagens no período · ${docs.length}</h2>${docs.length ? `<table class="t"><thead><tr><th>Empurrador</th><th>Entrada</th><th>Saída</th><th>Parada</th><th>Estaleiro</th><th>Custo (R$ mil)</th></tr></thead><tbody>${docs.map(({ v, h }) => `<tr><td><b>${esc(v.nome)}</b></td><td>${brD(h.ent)}</td><td>${h.sai ? brD(h.sai) : 'no estaleiro'}</td><td>${h.parada != null ? h.parada + ' d' : '—'}</td><td>${esc(h.est || '—')}</td><td>${h.custo != null ? nf(h.custo) : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma docagem com entrada ou saída no período.</p>'}</div>
    <div class="rl-2c"><div class="card rl-q"><h2>Próximas docagens (90 dias) · ${prox.length}</h2>${prox.length ? `<table class="t"><thead><tr><th>Empurrador</th><th>Prazo</th><th>Situação</th></tr></thead><tbody>${prox.map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td>${x.d.due ? brD(isoD(x.d.due)) : '—'}</td><td class="${x.d.dias < 0 ? 'rl-ruim' : 'rl-at'}">${x.d.dias < 0 ? 'vencida há ' + (-x.d.dias) + ' d' : 'em ' + x.d.dias + ' d'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma nos próximos 90 dias.</p>'}</div>
    <div class="card rl-q"><h2>Calibração: vencida ou nos próximos 30 dias · ${cal.length}</h2>${cal.length ? `<ul class="rl-urg">${cal.map(a => `<li><b class="${a.p === 1 ? 'rl-ruim' : 'rl-at'}">P${a.p}</b> ${esc(a.t)}</li>`).join('')}</ul>` : '<p class="note">Nada vencido nem nos próximos 30 dias.</p>'}</div></div>
    <div class="card rl-q"><h2>Rastreabilidade</h2><p class="note" style="font-size:11px;line-height:1.5">Relatório ${rlNumDoc(D)} recalculado dos registros do SMF em ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · fórmulas dos indicadores, registros usados e as ${D.fotos.reduce((a, o) => a + o.fotos.length, 0)} fotos das OMs encerradas estão no <b>Anexo técnico e evidências</b> · Anexos II no Google Drive e anexados na OM do Sankhya · NP Navecunha 055 itens 4.8 e 9.</p>
    <table class="rl-ass"><tr><th>Elaborado por</th><th>Aprovado por</th></tr><tr><td>${esc(S.session ? S.session.name : '')}<br><span class="rl-m">Supervisor de Manutenção</span></td><td><br><span class="rl-m">Gerência</span></td></tr><tr><td class="rl-lin">Assinatura e data</td><td class="rl-lin">Assinatura e data</td></tr></table></div>`;
  return [['Resumo executivo e indicadores', f2], ['Frota e próximos dias', f3], ['O que mais quebrou no período', f4], ['Condição dos motores', f5], ['Docagem, calibração e assinaturas', f6]]; }
function rlRelatorio(D) { const F = rlGerencial(D); rlSecoes.cache = F;
  return `<div class="rl-doc">${rlCapa(D)}${F.map((f, i) => rlFolha(D, i + 2, f[0], f[1])).join('')}</div>`; }
function rlCaber(raiz) { (raiz || document).querySelectorAll('.rl-g .body').forEach(b => { b.style.zoom = 1; const k = b.clientHeight / b.scrollHeight; if (k < 1) b.style.zoom = Math.max(.45, k - .01); }); }
// apresentação: os mesmos quadros, um assunto por slide, ajustados ao tamanho do slide (rlFit)
function rlSlides(D) { const per = rlPerTx(D), F = rlGerencial(D), sl = (tt, h) => `<div class="rl-s"><div class="rl-s-h"><small>${per}</small><h2>${esc(tt)}</h2></div><div class="rl-s-c"><div class="rl-s-z">${h}</div></div></div>`;
  const parte = (h, de, ate) => { const t = document.createElement('div'); t.innerHTML = h; return [...t.children].slice(de, ate).map(e => e.outerHTML).join(''); };
  const sem = h => { const t = document.createElement('div'); t.innerHTML = h; const r = [...t.querySelectorAll('.card')].find(c => /Rastreabilidade/.test(c.textContent)); if (r) r.remove(); return t.innerHTML; };
  return [`<div class="rl-s rl-s-capa"><img src="${LOGOS.nav}" alt="Navecunha"><small>NAVEGAÇÃO CUNHA · MANUTENÇÃO DA FROTA</small><h1>Relatório Mensal</h1><p>${per}</p><p class="rl-m">${rlNumDoc(D)} · ${D.V.length} empurradores em operação${temExemplo() ? ' · dados de exemplo' : ''}</p></div>`,
    sl(F[0][0], F[0][1]), sl(F[1][0], F[1][1]), sl(F[2][0], parte(F[2][1], 0, 1)), sl(F[2][0] + ' · corretivas e repetições', parte(F[2][1], 1, 9)), sl(F[3][0], F[3][1]), sl(F[4][0], sem(F[4][1]))]; }
function rlFit() { const c = document.querySelector('.rl-stage .rl-s-c'), z = c && c.querySelector('.rl-s-z'); if (!z) return; z.style.zoom = 1; const k = Math.min(1, (c.clientHeight - 4) / z.scrollHeight, (c.clientWidth - 4) / z.scrollWidth); z.style.zoom = k > 0 ? k : 1; }
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
// ---------- apresentação: capa · resumo executivo · metas · frota · horas · preventiva · corretiva · condição · próximos 90 dias · fotos ----------
// ---------- telas ----------
function rlBarra(aba) {
  const at = [['mes', 'Este mês'], ['ant', 'Mês passado'], ['tri', 'Trimestre'], ['ano', 'Ano']];
  return `<div class="vh"><div><h1>${aba === 'apres' ? 'Apresentação mensal' : 'Relatório mensal'}</h1><p>Sempre recalculado dos registros no período escolhido · ${aba === 'apres' ? 'setas do teclado para avançar · tela cheia para o projetor' : 'imprima ou salve em PDF pelo botão'}</p></div><span class="sp"></span>
    <button class="mbtn" data-rlocultar title="Tira este item do menu neste aparelho; volta em Administração → Menu deste aparelho">Ocultar do menu</button>${aba === 'apres' ? '<button class="mbtn pri" data-rlcheia>⛶ Tela cheia</button>' : '<button class="mbtn" data-rlimp="a" title="Quadros completos das telas, rastreabilidade e todas as fotos (para auditoria)">🖨 Anexo técnico e evidências</button><button class="mbtn pri" data-rlimp="g">🖨 Relatório gerencial (6 folhas)</button>'}</div>
   <div class="card rl-per"><label class="f">De<input type="date" id="rlDe" value="${RL.de}"></label><label class="f">Até<input type="date" id="rlAte" value="${RL.ate}"></label><div class="cm-chips">${at.map(([k, t]) => `<button class="cm-chip" data-rlat="${k}">${t}</button>`).join('')}</div></div>`;
}
function vRelMes() { rlPer(); const D = rlDados();
  return rlBarra('rel') + `<div class="card"><h2>Riscos, ações e decisões</h2><p class="note">Texto seu para este período (salvo neste aparelho). Entra no fim do relatório e no último slide.</p><textarea id="rlNota" rows="4" placeholder="Ex.: CJA X segue bloqueado aguardando bomba injetora; decidir compra do kit de reversor; antecipar docagem do CJA XX.">${esc(rlNota())}</textarea></div>
   <div class="card rl-wrap">${rlRelatorio(D)}</div>`; }
function vApresMes() { rlPer(); const S0 = RL.cache = rlSlides(rlDados()); RL.s = Math.min(RL.s, S0.length - 1);
  return rlBarra('apres') + `<div class="rl-ap" id="rlAp" tabindex="0"><div class="rl-stage">${S0[RL.s]}</div><div class="rl-nav"><button class="mbtn" data-rlv="-1">◀</button><span>${RL.s + 1} / ${S0.length}</span><button class="mbtn" data-rlv="1">▶</button></div></div>`; }
// as logos vão embutidas (data URL): a janela de impressão nem sempre consegue buscar arquivos (sem sinal ou pelo service worker)
const rlLogo64 = async u => { try { const b = await (await fetch(u)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(u); f.readAsDataURL(b); }); } catch (e) { return u; } };
// todo o estilo do SMF (smf.css e os estilos dos blocos) vai embutido: a janela de impressão nem sempre consegue buscar arquivos
function rlEstilos() { return [...document.styleSheets].map(ss => { try { return [...ss.cssRules].map(r => r.cssText).join(' '); } catch (e) { return ''; } }).join(' '); }
async function rlImprimir(tipo) { const w = window.open('', '_blank'); if (!w) { toast('O navegador bloqueou a janela de impressão. Permita pop-ups para o SMF.'); return; }
  w.document.write('<p style="font:14px Arial;padding:20px">Montando o relatório…</p>');
  const nav = await rlLogo64(LOGOS.nav), vda = await rlLogo64(LOGOS.vda), html = (tipo === 'a' ? rlAnexoTec : rlRelatorio)(rlDados()).split('src="' + LOGOS.nav + '"').join('src="' + nav + '"').split('src="' + LOGOS.vda + '"').join('src="' + vda + '"');
  w.document.open(); w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de manutenção ${RL.de} a ${RL.ate}</title><style>${rlEstilos()}</style><style>html,body{height:auto!important;background:#fff!important}body{margin:0;font:13px/1.45 "Segoe UI",Arial,sans-serif;color:#0F172A}body::before,body::after{display:none!important}${RL_CSS}@page{size:A4;margin:0}.rl-pg{padding:11mm 12mm}.rl-sec{break-inside:auto}.sheet{margin:0!important;break-after:page}.rl-om,.rl-k,.rl-f{break-inside:avoid}</style></head><body>${html}<script>${rlCaber.toString()};window.onload=()=>{rlCaber();setTimeout(()=>window.print(),400)}<\/script></body></html>`); w.document.close(); }
const AFTER_RL = () => { const m = $('#main'); if (VIEW === 'apresmes') setTimeout(rlFit, 60); else setTimeout(() => rlCaber(m), 60);
  m.onchange = e => { const t = e.target; if (t.id === 'rlDe' || t.id === 'rlAte') { RL[t.id === 'rlDe' ? 'de' : 'ate'] = t.value; if (RL.de && RL.ate && RL.de > RL.ate) [RL.de, RL.ate] = [RL.ate, RL.de]; render(); } };
  m.oninput = e => { if (e.target.id === 'rlNota') { try { localStorage.setItem(rlNotaK(), e.target.value); } catch (er) { } } };
  m.onclick = e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rlat) { rlAtalho(b.dataset.rlat); render(); }
    else if (b.dataset.rlimp != null) rlImprimir(b.dataset.rlimp);
    else if (b.dataset.rlocultar != null) { menuOcultar('relm', true); toast('Relatório mensal oculto no menu deste aparelho. Para voltar: Administração → Menu deste aparelho.'); }
    else if (b.dataset.rlv) rlIr(+b.dataset.rlv);
    else if (b.dataset.rlcheia != null) { const a = $('#rlAp'); if (a && a.requestFullscreen) a.requestFullscreen(); if (a) a.focus(); } }; };
// trocar de slide mexe só no palco: render() recriaria a tela e tiraria o projetor da tela cheia
function rlIr(d) { const L = RL.cache || []; if (!L.length) return; RL.s = Math.max(0, Math.min(L.length - 1, RL.s + d)); const st = document.querySelector('.rl-stage'), n = document.querySelector('.rl-nav span'); if (st) st.innerHTML = L[RL.s]; if (n) n.textContent = (RL.s + 1) + ' / ' + L.length; rlFit(); }
window.addEventListener('resize', () => { if (VIEW === 'apresmes') setTimeout(rlFit, 120); });
document.addEventListener('fullscreenchange', () => { if (VIEW === 'apresmes') setTimeout(rlFit, 200); });
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
.rl-sh{font-size:17px;color:#1F2A44;display:flex;align-items:center;gap:10px;border-bottom:2px solid #1F2A44;padding-bottom:5px;margin:0 0 10px}.rl-sh span{background:#1F2A44;color:#fff;border-radius:4px;min-width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:13px}
.rl-q{margin:0 0 12px!important;max-height:none!important;height:auto!important;overflow:visible!important;position:relative!important;left:auto!important;top:auto!important;width:auto!important;break-inside:avoid}.rl-q .tw{max-height:none!important;overflow:visible!important}.rl-q thead th,.rl-q th{position:static!important;top:auto!important}.rl-q td,.rl-q td *{white-space:normal!important}.rl-q td{max-width:300px;overflow-wrap:anywhere}.rl-q table.rl-fix{table-layout:fixed!important}.rl-q th{white-space:normal!important}.rl-fix th:nth-child(1){width:15%}.rl-fix th:nth-child(2){width:9%}.rl-fix th:nth-child(3){width:9%}.rl-fix th:nth-child(4){width:8%}.rl-fix th:nth-child(5){width:11%}.rl-fix th:nth-child(6){width:8%}.rl-fix th:nth-child(7){width:40%}.rl-fix td{max-width:none!important}.rl-q td span{display:inline-block}.rl-q .cf-card table,.rl-q table.t{font-size:10.5px}.rl-q .cf-card td,.rl-q .cf-card th{padding:4px 3px!important}.rl-q table{width:100%!important;table-layout:auto}.rl-q .cf-card,.rl-q.cf-card{overflow:visible!important}.rl-rm .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rl-2c{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rl-2c>.rl-q{margin:0!important}.rl-g .body{overflow:hidden}.rl-g .rl-q{padding:10px 12px!important}.rl-g .rl-q h2{font-size:13px!important;margin:0 0 6px!important}.rl-urg{margin:4px 0 0 16px;padding:0;font-size:11.5px;line-height:1.5}.rl-g table.t{font-size:10px}.rl-folha{margin:0 auto 18px;box-shadow:0 1px 6px rgba(0,0,0,.12)}.rl-s-z{transform-origin:0 0}.rl-s-c{overflow:hidden;justify-content:flex-start!important}.rl-s .card{background:#fff}
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
