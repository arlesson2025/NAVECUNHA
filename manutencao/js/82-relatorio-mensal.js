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
  // todas as fotos do período: OMs encerradas no período e OMs ainda abertas que foram abertas no período
  const fotos = [...N.prevEnc, ...N.corrEnc, ...oms().filter(o => !o.excluido && o.status !== 'encerrada' && dentro(String(o.abertura || o.dprev || '').slice(0, 10)))].filter(o => (o.fotos || []).length).sort((a, b) => (a.fechadoAt || Infinity) - (b.fechadoAt || Infinity));
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
const rlOmTit = o => `OM ${esc(o.num || '—')} · ${esc(vName(o.vessel))} · ${o.tipo === 'C' ? 'Corretiva ' + esc(o.classe || '') : 'Preventiva'} · ${o.fechadoAt ? 'encerrada em ' + brD(isoD(new Date(o.fechadoAt))) : 'em andamento'}`;
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
// ---------- relatório gerencial: capa + 4 folhas A4, escrito para quem não usa o SMF (decisão do Supervisor, 25/10/2026) ----------
// 2 o mês em uma página (indicadores com “como se lê” e o que precisa da gerência) · 3 falhas e corretivas · 4 preventiva e condição dos motores · 5 frota hoje, próximos dias e assinaturas
// cada folha é uma .sheet do Anexo II; o conteúdo que passar do tamanho é reduzido para caber (rlCaber), nunca vira 2 páginas
const RL_FOLHAS = 5;
function rlFolha(D, n, titulo, corpo, tot = RL_FOLHAS, sec = n) {
  return `<div class="sheet rl-folha rl-g"><div class="hdr"><div><img class="ln" src="${LOGOS.nav}" alt=""></div><div class="c"><b>RELATÓRIO MENSAL – MANUTENÇÃO DA FROTA</b><span>Empurradores Fluviais · ${rlPerTx(D)}</span><span>${rlNumDoc(D)} · NP Navecunha 055 item 9 · Rev. 00</span></div><div><img class="lv" src="${LOGOS.vda}" alt=""></div></div>
    <div class="body"><h2 class="rl-sh"><span>${sec}</span>${esc(titulo)}</h2>${corpo}</div><div class="sf"><span>Documento controlado pelo SGI · gerado pelo SMF ${VERSAO_APP}</span><span>Folha <b>${n}</b> de <b>${tot}</b></span></div></div>`; }
function rlCorrTab(L) { const hP = o => o.interd === 'Sim' && o.interdDT ? Math.max(0, Math.round(((o.liberacao ? pD(o.liberacao) : hoje()) - pD(o.interdDT)) / 3600e3)) : null;
  return L.length ? `<table class="t"><thead><tr><th>Aberta</th><th>Empurrador</th><th>OM</th><th>Equipamento</th><th>O que aconteceu</th><th>O que foi feito</th><th>Classe</th><th>Parado</th></tr></thead><tbody>${L.map(o => `<tr><td style="white-space:nowrap!important">${brD(String(o.abertura || '').slice(0, 10))}</td><td style="white-space:nowrap!important"><b>${esc(vName(o.vessel))}</b></td><td style="white-space:nowrap!important">${esc(o.num || '—')}</td><td>${esc(o.equip || '—')}</td><td>${esc(o.descricao || '')}</td><td>${o.status === 'encerrada' ? esc(String(o.servicos || '').trim() || 'serviço não informado') : '<i>em andamento</i>'}</td><td><span class="pill ${o.classe === 'Crítica' ? 'p-bad' : o.classe === 'Alta' ? 'p-warn' : 'p-mut'}">${esc(o.classe || '—')}</span></td><td style="white-space:nowrap!important">${hP(o) != null ? hP(o) + ' h' : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma corretiva aberta no período.</p>'; }
// como se lê cada indicador e o que fazer quando está fora da meta (o nome é o mesmo de rlDados().metas)
const RL_COMO = [[/^Disponibilidade/, 'horas sem parada por corretiva com interdição ou por preventiva ÷ horas do período. Empurrador bloqueado por serviço vencido não entra nesta conta (está na seção 6.3)', 'reduzir o tempo parado nas corretivas com interdição'],
  [/^MTBF/, 'horas de MCP ÷ falhas abertas no período: quanto maior, mais tempo entre uma falha e outra', 'atacar as falhas que se repetem (seção 3.5)'],
  [/^MTTR/, 'tempo médio da abertura da OM até a liberação, nas falhas liberadas no período', 'ter peça e equipe antes de abrir a OM'],
  [/^Backlog/, 'OMs abertas hoje com prazo de início estourado ÷ OMs abertas', 'iniciar as OMs atrasadas'],
  [/^Plano preditivo/, 'tendência dos MCPs e amostras de óleo feitas ÷ programadas no trimestre', 'coletar as amostras de óleo e lançar as leituras pendentes'],
  [/^Conformidade de fotos/, 'OMs encerradas com foto de antes e de depois ÷ OMs encerradas', 'cobrar a foto antes de encerrar'],
  [/^Aderência/, 'serviços preventivos feitos no prazo ÷ os que venceram nos meses do período', 'programar os serviços vencidos na próxima janela']];
const rlComo = nome => RL_COMO.find(c => c[0].test(nome)) || [null, '', ''];
// o que precisa da gerência: tudo o que pede decisão, dinheiro ou prazo, com a ação proposta
function rlDecisoes(D) { const R = [], nmM = (v, pos) => v.nome + (mcpPos(v).length > 1 ? ' · MCP ' + pos : '');
  D.FM.filter(x => x.sit >= 2).forEach(x => { const cr = (x.noPend || []).filter(p => p.c === 'Crítica').length;
    const mot = x.it ? `interditado pela OM ${esc(x.it.num || '')} (${esc(x.it.descricao || '')})` : [x.bq.length ? `${x.bq.length} serviço${x.bq.length === 1 ? '' : 's'} crítico${x.bq.length === 1 ? '' : 's'} vencido${x.bq.length === 1 ? '' : 's'} sem OM: ${x.bq.slice(0, 3).map(b => esc(b.t.chk || b.t.item)).join('; ')}${x.bq.length > 3 ? '…' : ''}` : '', cr ? `${cr} falha${cr === 1 ? '' : 's'} crítica${cr === 1 ? '' : 's'} sem OM` : ''].filter(Boolean).join(' · ');
    R.push([1, x.it ? 'Empurrador interditado' : 'Empurrador bloqueado para sair', esc(x.v.nome), mot, x.it ? 'Concluir o reparo e liberar' : 'Abrir a OM e executar os serviços críticos', 'Antes da próxima saída']); });
  cmpDados().forEach(x => { const nm = esc(nmM(x.v, x.pos));
    if (x.st === 'fora') R.push([1, 'Overhaul do MCP', nm, `cilindro ${x.u.cil} com ${fMPa(x.u.min)} MPa, abaixo do limite do fabricante (1,27 MPa)`, 'Inspeção de overhaul (Mitsubishi SM p. 4-4) e orçamento da revisão', 'Imediato']);
    else if (x.st === 'prog') R.push([2, 'Programar overhaul do MCP', nm, esc(x.mot.filter(m => !/vencido/.test(m)).join('; ')), 'Orçar e programar a revisão, de preferência na docagem', x.proj != null && isFinite(x.proj) ? '~' + nf(x.proj) + ' h' + cmpMeses(x.proj, x) : 'Próximos meses']);
    if (x.vencida) R.push([2, 'Ensaio de compressão vencido', nm, `último ensaio passou do prazo há ${nf(-x.falta)} h`, 'Medir na próxima inspeção dos bicos', 'Próxima chegada']); });
  const LU = {}; recs('laudo').filter(r => !r.excluido).forEach(r => { const k = r.vessel + '|' + r.pos; if (!LU[k] || r.date > LU[k].date) LU[k] = r; });
  Object.values(LU).forEach(r => { const v = vessel(r.vessel); if (!v || foraOp(v)) return; const a = laudoSt(r); if (a.st !== 'venc') return;
    R.push([1, 'Laudo de óleo crítico', esc(v.nome + ' · ' + r.pos), a.alertas.filter(z => z.s === 'venc').map(z => `${esc(z.nome)} ${esc(String(z.v).replace('.', ','))}${z.un ? ' ' + esc(z.un) : ''}`).join('; ') + ` (amostra de ${brD(r.date)})`, 'Investigar a causa e coletar nova amostra', 'Próxima troca de óleo']); });
  D.prox.forEach(a => { const tx = a.t.replace(/^[^·]+·\s*/, ''); if (/interdit/i.test(tx)) return;
    if (a.p === 1 && /calibra/i.test(tx)) R.push([1, 'Calibração vencida', esc(a.v.nome), esc(tx), 'Calibrar antes da próxima saída', 'Imediato']);
    else if (a.p === 1 && /docagem/i.test(tx)) R.push([1, 'Docagem vencida', esc(a.v.nome), esc(tx), 'Programar estaleiro e regularizar o certificado', 'Imediato']);
    else if (a.p === 1 && /óleo/i.test(tx)) R.push([1, 'Troca de óleo vencida', esc(a.v.nome), esc(tx), 'Trocar antes da próxima saída', 'Imediato']);
    else if (a.p === 2 && /docagem/i.test(tx)) R.push([2, 'Docagem nos próximos 90 dias', esc(a.v.nome), esc(tx), 'Reservar estaleiro e aprovar o orçamento', esc(tx.replace(/^docagem\s*/i, ''))]); });
  D.atrasadas.filter(o => o.tipo === 'C').forEach(o => R.push([1, 'Corretiva com prazo estourado', esc(vName(o.vessel)), `OM ${esc(o.num || '—')} · ${esc(o.classe || '')} · ${esc(o.descricao || o.equip || '')}`, 'Iniciar o reparo (prazo da NP 5.5.1)', 'Vencido']));
  D.metas.forEach(m => { if (m[2] == null || m[6](m[2])) return; R.push([2, 'Indicador fora da meta', '—', `${esc(m[0])}: ${rlFmt(m[2], m[5], m[4])} (meta ${esc(m[1])})`, esc(rlComo(m[0])[2] || 'analisar a causa'), 'Próximo mês']); });
  return R.sort((a, b) => a[0] - b[0]); }
// cronograma do ano da frota: previsto, realizado e no prazo mês a mês (a mesma conta da tela, prResumo)
// últimos 6 meses: corretivas, MTTR e disponibilidade, mês a mês
const rlSis = s => String(s || '').replace(/^\s*\d+(\.\d+)?\.?\s*/, '').trim() || 'Sistema não informado';
const rlPil = (c, t) => `<span class="pill ${c}">${t}</span>`;
// ---------- relatório técnico: só os gráficos que já existem nas telas do SMF (lineChart, stackChart, rmPareto, rmBarras, prGrafico, prGrafAcum, Histórico de compressão, Saldo para a troca, hfPareto) ----------
const rlGraf = (tit, svg, an, fonte) => `<div class="rl-gf"><div class="rl-gt">${tit}</div>${svg || '<p class="note">Sem dados no período.</p>'}${an ? `<p class="rl-an"><b>Análise:</b> ${an}</p>` : ''}${fonte ? `<p class="rl-fo">${fonte}</p>` : ''}</div>`;
// série mensal dos indicadores (12 meses até o fim do período): mesmas contas dos Indicadores (kpiDisp, kpiMTBF móvel 12 meses, MTTR das falhas liberadas no mês)
function rlSerie(D, n = 12) { const u = new Date(D.fim - 864e5), M = [], O = oms().filter(o => !o.excluido);
  for (let k = n - 1; k >= 0; k--) { const ini = new Date(u.getFullYear(), u.getMonth() - k, 1), f0 = new Date(ini.getFullYear(), ini.getMonth() + 1, 1), fim = f0 > hoje() ? new Date(hoje().getTime() + 864e5) : f0, dentro = t => t && t >= ini && t < fim;
    const C = O.filter(o => o.tipo === 'C' && dentro(o.abertura ? pD(o.abertura) : null)), lib = O.filter(o => ehFalha(o) && o.liberacao && o.abertura && dentro(pD(o.liberacao)));
    const cl = c => C.filter(o => (o.classe || 'Baixa') === c).length;
    M.push({ lab: MESES[ini.getMonth()] + '/' + String(ini.getFullYear()).slice(2), per: f0 > D.ini && ini < D.fim, c: C.length, cr: cl('Crítica'), al: cl('Alta'), me: cl('Média'), ba: C.length - cl('Crítica') - cl('Alta') - cl('Média'),
      mttr: lib.length ? lib.reduce((s, o) => s + (pD(o.liberacao) - pD(o.abertura)) / 3600e3, 0) / lib.length : null, mtbf: kpiMTBF(fim).v, disp: kpiDisp(ini.getFullYear(), ini.getMonth()) }); }
  return M; }
// tendência em palavras: média dos 3 últimos meses × 3 anteriores
function rlTendTx(L, melhorAlto, dec = 0, un = '') { const v = L.filter(x => x != null && isFinite(x)); if (v.length < 4) return 'série curta para tendência';
  const m = a => a.reduce((s, x) => s + x, 0) / a.length, a = m(v.slice(-3)), b = m(v.slice(-6, -3)); if (!b) return '';
  const d = (a - b) / Math.abs(b) * 100; if (Math.abs(d) < 5) return `estável (média dos 3 últimos meses ${nf(a, dec)}${un})`;
  const bom = (d > 0) === melhorAlto; return `<b class="${bom ? 'rl-ok' : 'rl-ruim'}">${d > 0 ? 'subindo' : 'caindo'} ${nf(Math.abs(d))}%</b> (média dos 3 últimos meses ${nf(a, dec)}${un} contra ${nf(b, dec)}${un} nos 3 anteriores)`; }
const rlVar = (v, a, dec, un, melhorAlto) => v == null || a == null ? '—' : Math.abs(v - a) < Math.pow(10, -dec) / 2 ? '=' : `<span class="${(v > a) === melhorAlto ? 'rl-ok' : 'rl-ruim'}">${v > a ? '▲' : '▼'} ${nf(Math.abs(v - a), dec)}${un}</span>`;
// responsável pela ação: dinheiro, estaleiro e indicador da frota sobem para a gerência
const rlResp = r => /overhaul|docagem|indicador/i.test(r[1]) ? 'Supervisor + Gerência' : 'Supervisor de Manutenção';
function rlGerencial(D) { const N = D.N, A = D.A, nota = rlNota(), { ini, fim } = D, dentro = s => s && pD(s) >= ini && pD(s) < fim, M = rlSerie(D), dest = M.map(m => m.per);
  const metaOk = D.metas.filter(m => m[2] != null && m[6](m[2])), metaFora = D.metas.filter(m => m[2] != null && !m[6](m[2])), DEC = rlDecisoes(D);
  const fora = S.cfg.frota.filter(v => foraOp(v));
  // ===== 1 · Introdução e resumo executivo =====
  const kpiT = `<table class="t rl-ind"><thead><tr><th>Indicador (NP 055 item 9)</th><th>Meta</th><th class="r">Período</th><th class="r">Anterior</th><th class="r">Variação</th><th>Resultado</th></tr></thead><tbody>${D.metas.map(([nome, meta, v, a, un, dec, ok]) => {
    const alto = !/MTTR|Backlog/.test(nome); return `<tr><td><b>${esc(nome)}</b></td><td style="white-space:nowrap!important">${esc(meta)}</td><td class="r"><b>${rlFmt(v, dec, un)}</b></td><td class="r">${rlFmt(a, dec, un)}</td><td class="r">${rlVar(v, a, dec, un, alto)}</td><td>${v == null ? rlPil('p-mut', 'sem dados') : ok(v) ? rlPil('p-ok', 'Atende') : rlPil('p-bad', 'Não atende')}</td></tr>`; }).join('')}</tbody></table>`;
  const defs = D.metas.map(m => `<b>${esc(m[0].replace(/ \(.*\)$/, ''))}</b>: ${esc(rlComo(m[0])[1])}`).join(' · ');
  const conc0 = [`${metaOk.length} de ${metaOk.length + metaFora.length} indicadores atendem a meta${metaFora.length ? '; não atendem: ' + metaFora.map(m => `<b>${esc(m[0])}</b> (${rlFmt(m[2], m[5], m[4])}, meta ${esc(m[1])})`).join(', ') : ''}.`,
    DEC.filter(r => r[0] === 1).length ? `${DEC.filter(r => r[0] === 1).length} ponto${DEC.filter(r => r[0] === 1).length === 1 ? '' : 's'} de ação imediata (P1) e ${DEC.filter(r => r[0] === 2).length} a programar (P2), detalhados no plano de ação (seção 6).` : 'Nenhum ponto de ação imediata (P1).'];
  const f1 = `<div class="card rl-q"><h2>1.1 Objetivo</h2><p class="rl-p">Apresentar o desempenho da manutenção da frota de empurradores no período de <b>${rlPerTx(D)}</b>, medido pelos indicadores da NP Navecunha 055 item 9, a condição técnica dos equipamentos e as ações necessárias para o período seguinte.</p></div>
    <div class="card rl-q"><h2>1.2 Escopo e método</h2><table class="t rl-esc"><tbody>
      <tr><td><b>Frota analisada</b></td><td>${D.V.length} empurradores em operação (${D.V.map(v => esc(v.nome)).join(', ')})${fora.length ? `; fora de operação e fora das contas: ${fora.map(v => esc(v.nome)).join(', ')}` : ''}.</td></tr>
      <tr><td><b>Fonte dos dados</b></td><td>Registros do SMF (OMs preventivas e corretivas, horímetros, FR 049_B, ensaios de compressão e laudos de óleo), recalculados em ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${temExemplo() ? ' · <b class="rl-ruim">dados de exemplo</b>' : ''}.</td></tr>
      <tr><td><b>Comparação</b></td><td>Período anterior de mesma duração (${D.dias} dias) e tendência dos últimos 12 meses.</td></tr>
      <tr><td><b>Critérios</b></td><td>Metas da NP 055 item 9; limites do fabricante (Mitsubishi S6R2, Service Manual p. 2-3) e critérios internos do Anexo I (1.1.12 compressão, 1.1.29 análise de óleo).</td></tr></tbody></table></div>
    <div class="card rl-q"><h2>1.3 Resultados do período</h2>${kpiT}<p class="rl-fo">${defs}.</p></div>
    <div class="card rl-q"><h2>1.4 Resumo executivo</h2><ul class="rl-exec">${rlExec(D).concat(conc0).map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  // ===== 2 · Indicadores de desempenho: 12 meses, nos mesmos gráficos da tela Indicadores (lineChart) =====
  const labs = M.map(m => m.lab), lc = (vals, meta, un, dec, opt) => lineChart(vals, labs, meta, un, dec, Object.assign({ h: 130 }, opt || {}));
  const mesF = (L, f) => L.filter(v => v != null && f(v)).length;
  const gC = stackChart(labs, [{ nome: 'Crítica', cor: '#C5221F', vals: M.map(m => m.cr) }, { nome: 'Alta', cor: '#E37400', vals: M.map(m => m.al) }, { nome: 'Média', cor: '#669DF6', vals: M.map(m => m.me) }, { nome: 'Baixa', cor: '#AECBFA', vals: M.map(m => m.ba) }], '');
  const f2 = `<div class="card rl-q">${rlGraf('2.1 Disponibilidade da frota (%) · meta ≥ 95%', lc(M.map(m => m.disp), 95, '%', 1), `${mesF(M.map(m => m.disp), v => v >= 95)} de ${M.filter(m => m.disp != null).length} meses na meta; tendência ${rlTendTx(M.map(m => m.disp), true, 1, '%')}.`, 'Horas sem parada por corretiva com interdição ou preventiva ÷ horas do mês.')}</div>
    <div class="card rl-q">${rlGraf('2.2 MTBF (h) · meta ≥ 500 h', lc(M.map(m => m.mtbf || null), 500, ' h', 0), `${mesF(M.map(m => m.mtbf || null), v => v >= 500)} de ${M.filter(m => m.mtbf).length} meses na meta; tendência ${rlTendTx(M.map(m => m.mtbf || null), true, 0, ' h')}.`, 'Móvel de 12 meses: horas de MCP ÷ falhas Crítica/Alta abertas.')}</div>
    <div class="card rl-q">${rlGraf('2.3 MTTR (h) · meta ≤ 8 h', lc(M.map(m => m.mttr), 8, ' h', 1, { menor: 1 }), `${mesF(M.map(m => m.mttr), v => v <= 8)} de ${M.filter(m => m.mttr != null).length} meses na meta; tendência ${rlTendTx(M.map(m => m.mttr), false, 1, ' h')}.`, 'Abertura da OM até a liberação, falhas Crítica/Alta liberadas no mês.')}</div>
    <div class="card rl-q">${rlGraf('2.4 Corretivas abertas por classe', gC + `<p class="rl-fo">■ Crítica (vermelho) · Alta (laranja) · Média (azul) · Baixa (azul claro)</p>`, `${M.reduce((a, m) => a + m.c, 0)} corretivas em 12 meses (média ${nf(M.reduce((a, m) => a + m.c, 0) / M.length, 1)}/mês), ${M.reduce((a, m) => a + m.cr + m.al, 0)} Crítica ou Alta; tendência ${rlTendTx(M.map(m => m.c), false, 1)}.`, 'Classe da NP 5.5.1 informada na abertura da OM.')}</div>
    <p class="rl-fo">Mesmos gráficos da tela Indicadores, com 12 meses até o fim do período.</p>`;
  // ===== 3 · Manutenção corretiva: Pareto e OMs por empurrador da tela Resumo do mês (rmPareto, rmBarras) =====
  const ini12 = new Date(fim.getTime() - 365 * 864e5), F12 = oms().filter(o => !o.excluido && o.tipo === 'C' && o.abertura && pD(o.abertura) >= ini12 && pD(o.abertura) < fim);
  const grp = (L, f) => Object.entries(L.reduce((g, o) => { const k = f(o); g[k] = (g[k] || 0) + 1; return g; }, {})).sort((a, b) => b[1] - a[1]);
  const pS = grp(F12, o => rmSis(o.sistema)), pE = grp(F12, o => String(o.equip || '').trim() || 'Equipamento não informado').slice(0, 8);
  const ac80 = E => { let ac = 0, k = 0; const t = E.reduce((a, e) => a + e[1], 0); for (const e of E) { ac += e[1]; k++; if (ac / t >= .8) break; } return k; };
  const eq12 = {}; F12.filter(ehFalha).forEach(o => { const k = String(o.equip || '').trim(); if (k) (eq12[k] = eq12[k] || []).push(o); });
  const rep = Object.entries(eq12).filter(([, L]) => L.length > 1).sort((a, b) => b[1].length - a[1].length);
  const repH = rep.length ? `<table class="t"><thead><tr><th>Equipamento</th><th class="r">Falhas</th><th>Empurradores</th><th>Causa registrada</th><th>Ação de bloqueio</th></tr></thead><tbody>${rep.slice(0, 6).map(([k, L]) => { const o = L.find(x => x.causa || x.mitig) || L[L.length - 1]; return `<tr><td><b>${esc(k)}</b></td><td class="r">${L.length}</td><td>${[...new Set(L.map(x => vName(x.vessel)))].map(esc).join(', ')}</td><td>${o.causa ? esc(o.causa) : '<span class="rl-ruim">não registrada</span>'}</td><td>${o.mitig ? esc(o.mitig) : '<span class="rl-ruim">não registrada</span>'}</td></tr>`; }).join('')}</tbody></table>` : '<p class="note">Nenhuma falha Crítica/Alta repetida no mesmo equipamento em 12 meses.</p>';
  const fech = [...N.prevEnc, ...N.corrEnc], vE = D.V.filter(v => fech.some(o => o.vessel === v.id)).sort((a, b) => fech.filter(o => o.vessel === b.id).length - fech.filter(o => o.vessel === a.id).length);
  const gEmp = vE.length ? rmBarras(vE.map(v => v.nome.replace(/^CJA /, '')), vE.map(v => N.prevEnc.filter(o => o.vessel === v.id).length), vE.map(v => N.corrEnc.filter(o => o.vessel === v.id).length), vE.map(v => v.id)) : '';
  const corr = [...N.corrAb].sort((a, b) => (a.abertura || '') < (b.abertura || '') ? 1 : -1);
  const f3 = `<div class="card rl-q">${rlGraf(`3.1 Pareto das corretivas por sistema · ${F12.length} em 12 meses`, pS.length ? rmPareto(pS) : '', pS.length ? `<b>${esc(pS[0][0])}</b> responde por ${Math.round(pS[0][1] / F12.length * 100)}% das corretivas; ${ac80(pS)} de ${pS.length} sistemas somam 80%.` : '', 'Mesmo Pareto da tela Indicadores → Resumo do mês (linha laranja = % acumulado).')}</div>
    <div class="card rl-q">${rlGraf('3.2 Pareto por equipamento (12 meses)', pE.length ? rmPareto(pE) : '', pE.length ? `${esc(pE[0][0])} lidera com ${pE[0][1]} ocorrência${pE[0][1] === 1 ? '' : 's'}.` : '')}</div>
    <div class="rl-2c"><div class="card rl-q">${rlGraf('3.3 OMs encerradas no período por empurrador', gEmp, fech.length ? `${N.prevEnc.length} preventivas e ${N.corrEnc.length} corretivas encerradas.` : 'Nenhuma OM encerrada no período.')}</div>
    <div class="card rl-q"><h2>3.4 Corretiva em números</h2><table class="t"><thead><tr><th></th><th class="r">Período</th><th class="r">Anterior</th></tr></thead><tbody>${[['Corretivas abertas', N.corrAb.length, A.corrAb.length, 0, ''], ['Crítica ou Alta', N.corrAb.filter(ehFalha).length, A.corrAb.filter(ehFalha).length, 0, ''], ['Corretivas encerradas', N.corrEnc.length, A.corrEnc.length, 0, ''], ['MTTR', N.mttr, A.mttr, 1, ' h'], ['MTBF', N.mtbf, A.mtbf, 0, ' h'], ['Horas paradas', D.indisp.reduce((a, x) => a + x.h, 0), null, 0, ' h']].map(([t, v, a, d, u]) => `<tr><td>${t}</td><td class="r"><b>${rlFmt(v, d, u)}</b></td><td class="r">${rlFmt(a, d, u)}</td></tr>`).join('')}</tbody></table>${D.indisp.length ? `<p class="rl-fo">Mais parado: ${D.indisp.slice(0, 3).map(x => `${esc(x.v.nome)} ${nf(x.h)} h`).join(' · ')}.</p>` : ''}</div></div>`;
  const f3b = `<div class="card rl-q"><h2>3.5 Falhas repetitivas (Crítica/Alta, 12 meses)</h2>${repH}</div>
    <div class="card rl-q"><h2>3.6 Corretivas abertas no período · ${N.corrAb.length} (anterior: ${A.corrAb.length})</h2>${rlCorrTab(corr)}</div>`;
  // ===== 4 · Manutenção preventiva: gráficos da tela Cronograma (prGrafico e curva acumulada prGrafAcum) =====
  const y = new Date(fim - 864e5).getFullYear(), ms0 = PRV.ms, gm0 = PRV.gm; let TF = null, gBar = '', gAc = ''; try { PRV.ms = null; TF = prFrotaV2(y); PRV.gm = ''; gBar = prGrafico(TF.F, TF.hm, TF.sel); gAc = prGrafAcum(TF.F, TF.hm, TF.sel); } catch (e) { } finally { PRV.ms = ms0; PRV.gm = gm0; }
  const hm = TF ? TF.hm : -1, P = TF ? TF.F.P || [] : [];
  const pv = D.V.map(v => ({ v, q: N.porV[v.id] || { ok: 0, den: 0, venc: 0, tP: 0 } })).filter(x => x.q.den || x.q.tP).map(x => ({ ...x, a: x.q.den ? x.q.ok / x.q.den * 100 : null })).sort((a, b) => (a.a == null ? 101 : a.a) - (b.a == null ? 101 : b.a));
  const pvH = pv.length ? `<table class="t"><thead><tr><th>Empurrador</th><th class="r">Previstos no período</th><th class="r">Venceram</th><th class="r">Feitos no prazo</th><th class="r">Aderência</th><th class="r">Não realizados no prazo</th></tr></thead><tbody>${pv.map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td class="r">${nf(x.q.tP)}</td><td class="r">${nf(x.q.den)}</td><td class="r">${nf(x.q.ok)}</td><td class="r"><b class="${x.a == null ? '' : x.a >= 90 ? 'rl-ok' : x.a >= 75 ? 'rl-at' : 'rl-ruim'}">${rlFmt(x.a, 0, '%')}</b></td><td class="r">${x.q.venc ? `<b class="rl-ruim">${x.q.venc}</b>` : '0'}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum serviço previsto no período.</p>';
  const f4 = `<div class="card rl-q">${rlGraf(`4.1 Cronograma preventivo ${y} · carga e execução por mês`, gBar, `No período: aderência de <b>${rlFmt(N.ader, 0, '%')}</b> (anterior ${rlFmt(A.ader, 0, '%')}, referência ≥ 90%) e <b>${nf(N.naoPrazo)}</b> serviços não realizados dentro do prazo.`, 'Mesmo gráfico da tela Cronograma (frota).')}</div>
    <div class="card rl-q">${rlGraf(`4.2 Curva acumulada ${y} · previsto × realizado`, gAc, '', 'Mesmo gráfico da tela Cronograma (curva acumulada).')}</div>
    <div class="card rl-q"><h2>4.3 Aderência por empurrador no período</h2>${pvH}<p class="rl-fo">Aderência = feitos no prazo ÷ serviços que venceram no período (referência ≥ 90%). ${N.prevEnc.length} OMs preventivas encerradas e ${D.trocas} trocas de óleo (FR 049_B) no período.</p></div>`;
  // ===== 5 · Condição dos equipamentos: gráficos das telas Compressão, Óleo da frota e Horas viajadas =====
  const CD = cmpDados().filter(x => x.u).sort((a, b) => a.u.min - b.u.min), cF = CD.filter(x => x.u.min < COMP.lim), cA = CD.filter(x => x.u.min >= COMP.lim && x.u.min < COMP.aten);
  const cAte = x => x.st === 'fora' ? '<span class="rl-ruim">já abaixo</span>' : x.proj == null ? 'menos de 2 ensaios' : x.proj === Infinity ? 'sem queda medida' : nf(x.proj) + ' h' + cmpMeses(x.proj, x);
  const motH = CD.length ? `<table class="t"><thead><tr><th>Motor</th><th class="r">Horímetro</th><th>Pior cilindro (último ensaio)</th><th>Até o limite</th></tr></thead><tbody>${CD.slice(0, 6).map(x => `<tr><td style="white-space:nowrap!important"><b>${cmpNome(x)}</b></td><td class="r">${x.hr ? nf(x.hr.h) + ' h' : '—'}</td><td>C${x.u.cil}: <b class="${x.u.min < COMP.lim ? 'rl-ruim' : x.u.min < COMP.aten ? 'rl-at' : ''}">${fMPa(x.u.min)} MPa</b> em ${brD(x.u.date)}</td><td>${cAte(x)}</td></tr>`).join('')}</tbody></table>` : '';
  const gCmp = rlTelaQ(vCompr, ['Histórico de compressão']);
  const ol = lubDados().filter(x => !foraOp(x.v) && x.horas != null), oV = ol.filter(x => x.horas < 0), oP = ol.filter(x => x.horas >= 0 && x.horas <= OL_ALERTA_H);
  const LU = {}; recs('laudo').filter(r => !r.excluido).forEach(r => { const k = r.vessel + '|' + r.pos; if (!LU[k] || r.date > LU[k].date) LU[k] = r; });
  const LA = Object.values(LU).filter(r => { const v = vessel(r.vessel); return v && !foraOp(v); }).map(r => ({ r, a: laudoSt(r) })), LAl = LA.filter(x => x.a.st !== 'ok').sort((a, b) => (a.a.st === 'venc' ? 0 : 1) - (b.a.st === 'venc' ? 0 : 1));
  const lauH = LAl.length ? `<table class="t"><thead><tr><th>Motor</th><th>Amostra</th><th>Parâmetros fora do limite</th><th>Situação</th></tr></thead><tbody>${LAl.map(({ r, a }) => `<tr><td style="white-space:nowrap!important"><b>${esc(vName(r.vessel) + ' · ' + r.pos)}</b></td><td>${brD(r.date)}</td><td>${a.alertas.map(z => `${esc(z.nome)} ${esc(String(z.v).replace('.', ','))}${z.un ? ' ' + esc(z.un) : ''}`).join('; ')}</td><td>${a.st === 'venc' ? rlPil('p-bad', 'Crítico') : rlPil('p-warn', 'Atenção')}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum laudo com alerta.</p>';
  const f5 = `<div class="card rl-q">${rlGraf(`5.1 Compressão do MCP · ${CD.length} motores com ensaio`, (gCmp ? rlTela(gCmp, t => { t.querySelectorAll('h2').forEach(h => h.remove()); return t.innerHTML; }) : '') + motH, `${cF.length ? `<b class="rl-ruim">${cF.length} motor${cF.length === 1 ? '' : 'es'} abaixo do limite do fabricante</b> (${cF.map(x => cmpNome(x)).join(', ')}): overhaul. ` : 'Nenhum motor abaixo do limite do fabricante. '}${cA.length ? `${cA.length} na faixa de atenção (1,27–1,45 MPa): programar a revisão.` : 'Nenhum na faixa de atenção.'}`, 'Mesmo gráfico da tela Compressão. Mitsubishi S6R2: padrão 1,8 MPa e limite 1,27 MPa (Service Manual p. 2-3); 1,45 MPa = critério interno (Anexo I 1.1.12).')}</div>
    <div class="card rl-q">${rlGraf('5.2 Saldo para a troca de óleo', rlOleoGraf(), `${oV.length ? `<b class="rl-ruim">${oV.length} troca${oV.length === 1 ? '' : 's'} vencida${oV.length === 1 ? '' : 's'}</b>` : 'Nenhuma troca vencida'}; ${oP.length} nas próximas ${OL_ALERTA_H} h.`, 'Mesmo gráfico da tela Óleo da frota, na data de emissão.')}</div>`;
  const f5b = `<div class="card rl-q">${rlGraf('5.3 Horas viajadas por empurrador', hfPareto(), `MCPs da frota trabalharam ${nf(D.hPer)} h no período (${D.hAnt ? (D.hPer >= D.hAnt ? '+' : '−') + nf(Math.abs(D.hPer - D.hAnt)) + ' h sobre o anterior' : 'sem base anterior'}).`, 'Mesmo gráfico da tela Horas viajadas (horímetro acumulado do MCP).')}</div>
    <div class="card rl-q"><h2>5.4 Análise de óleo · ${LA.length} MCPs com laudo, ${LAl.length} com alerta</h2>${lauH}<p class="rl-fo">Último laudo de cada motor. Limites do laudo do Anexo I 1.1.29.</p></div>`;
  // ===== 6 · Situação da frota, conclusões e plano de ação =====
  const FM = frotaMatriz();
  const frH = D.V.map(v => { const x = FM.find(z => z.v === v) || { sit: 0, n: { venc: 0 }, bq: [], noPend: [] }, s = situDe(v);
    const st = x.sit >= 3 ? rlPil('p-bad', 'Interditado') : x.sit === 2 ? rlPil('p-bad', 'Bloqueado') : x.sit === 1 ? rlPil('p-warn', 'Com restrição') : rlPil('p-ok', 'Liberado');
    const mot = [x.it ? 'OM ' + esc(x.it.num || '') + ' com interdição' : '', x.bq.length ? `${x.bq.length} crítico${x.bq.length === 1 ? '' : 's'} vencido${x.bq.length === 1 ? '' : 's'} sem OM` : '', x.n.venc > x.bq.length ? `${x.n.venc - x.bq.length} serviço${x.n.venc - x.bq.length === 1 ? '' : 's'} vencido${x.n.venc - x.bq.length === 1 ? '' : 's'}` : '', (x.noPend || []).length ? `${x.noPend.length} falha${x.noPend.length === 1 ? '' : 's'} sem OM` : ''].filter(Boolean).join(' · ') || '—';
    return `<tr><td style="white-space:nowrap!important"><b>${esc(v.nome)}</b></td><td>${!s ? 'Local não informado' : s.st === 'viagem' ? 'Em viagem' : 'No porto'}</td><td>${st}</td><td>${mot}</td></tr>`; }).join('');
  const topS = Object.entries(N.corrAb.reduce((g, o) => { const k = rlSis(o.sistema); g[k] = (g[k] || 0) + 1; return g; }, {})).sort((a, b) => b[1] - a[1])[0];
  const conc = [
    `<b>Desempenho:</b> ${metaOk.length} de ${metaOk.length + metaFora.length} indicadores atendem a meta.${metaFora.length ? ' Não atendem: ' + metaFora.map(m => `${esc(m[0])} ${rlFmt(m[2], m[5], m[4])} (meta ${esc(m[1])})`).join('; ') + '.' : ''}`,
    `<b>Corretiva:</b> ${N.corrAb.length} corretivas abertas (${A.corrAb.length} no período anterior)${topS ? `; maior concentração em ${esc(topS[0])} (${topS[1]})` : ''}${rep.length ? `; ${rep.length} equipamento${rep.length === 1 ? '' : 's'} com falha repetida em 12 meses${rep.some(([, L]) => !L.some(o => o.mitig)) ? ', alguns sem ação de bloqueio registrada' : ''}` : ''}.`,
    `<b>Preventiva:</b> aderência de ${rlFmt(N.ader, 0, '%')} no período (referência 90%) e ${nf(N.naoPrazo)} serviços não realizados no prazo${pv.filter(x => x.q.venc).sort((a, b) => b.q.venc - a.q.venc).slice(0, 1).map(x => `, com maior atraso em ${esc(x.v.nome)} (${x.q.venc})`).join('')}.`,
    `<b>Condição:</b> ${cF.length} MCP abaixo do limite de compressão, ${cA.length} na faixa de atenção; ${LAl.filter(x => x.a.st === 'venc').length} laudo crítico e ${LAl.filter(x => x.a.st !== 'venc').length} em atenção; ${oV.length} troca de óleo vencida.`,
    `<b>Frota em ${brD(isoD(hoje()))}:</b> ${D.frota.lib} liberados, ${D.frota.rest} com restrição, ${D.frota.bloq} bloqueados${D.frota.bloqN.length ? ' (' + D.frota.bloqN.map(esc).join(', ') + ')' : ''}, ${D.frota.viag} em viagem.`];
  const plano = DEC.length ? `<table class="t rl-dec"><thead><tr><th>Nº</th><th>Prior.</th><th>Ação</th><th>Empurrador</th><th>Motivo</th><th>Responsável</th><th>Prazo</th></tr></thead><tbody>${DEC.slice(0, 14).map((r, i) => `<tr><td>${i + 1}</td><td>${rlPil(r[0] === 1 ? 'p-bad' : 'p-warn', 'P' + r[0])}</td><td><b>${String(r[4]).charAt(0).toUpperCase() + String(r[4]).slice(1)}</b></td><td style="white-space:nowrap!important">${r[2]}</td><td>${r[3]}</td><td>${rlResp(r)}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table>${DEC.length > 14 ? `<p class="rl-fo">Mais ${DEC.length - 14} ações no Anexo técnico.</p>` : ''}` : '<p class="note">Nenhuma ação pendente.</p>';
  const quem = S.session && S.session.name && !/^supervisor$/i.test(S.session.name.trim()) ? esc(S.session.name) + '<br>' : '';
  const f6 = `<div class="card rl-q"><h2>6.1 Conclusões</h2><ol class="rl-conc">${conc.map(c => `<li>${c}</li>`).join('')}</ol></div>
    <div class="card rl-q"><h2>6.2 Plano de ação · ${DEC.length}</h2>${plano}<p class="rl-fo">P1 = executar já · P2 = programar no próximo período.</p>${nota ? `<h3>Observações do Supervisor</h3><div class="rl-nota">${esc(nota).replace(/\n/g, '<br>')}</div>` : ''}</div>
    <div class="card rl-q"><h2>6.3 Situação da frota em ${brD(isoD(hoje()))}</h2><table class="t"><thead><tr><th>Empurrador</th><th>Local</th><th>Para sair</th><th>Motivo</th></tr></thead><tbody>${frH}</tbody></table><p class="rl-fo">Bloqueado = serviço crítico vencido ou falha crítica sem OM · Com restrição = algum serviço vencido (mesma conta do registro de saída).</p></div>
    <div class="card rl-q"><h2>6.4 Aprovação</h2><p class="rl-fo">Relatório ${rlNumDoc(D)}. Evidências fotográficas nas folhas seguintes; quadros completos no Anexo técnico; Anexos II no Google Drive e na OM do Sankhya (NP 055 itens 4.8 e 9).</p><table class="rl-ass"><tr><th>Elaborado por</th><th>Aprovado por</th></tr><tr><td>${quem}<span class="rl-m">Supervisor de Manutenção</span></td><td><span class="rl-m">Gerência</span></td></tr><tr><td class="rl-lin">Assinatura e data</td><td class="rl-lin">Assinatura e data</td></tr></table></div>`;
  return [['Introdução e resumo executivo', f1, 1], ['Indicadores de desempenho (12 meses)', f2, 2], ['Manutenção corretiva', f3, 3], ['Manutenção corretiva (continuação)', f3b, 3], ['Manutenção preventiva', f4, 4], ['Condição dos equipamentos', f5, 5], ['Condição dos equipamentos (continuação)', f5b, 5], ['Conclusões e plano de ação', f6, 6]]; }
// evidências fotográficas: todas as fotos do período, 9 por folha, quantas folhas forem precisas (decisão do Supervisor, 25/10/2026)
const RL_FOTOS_FOLHA = 9;
function rlFotosFolhas(D) { const F = D.fotos.flatMap(o => o.fotos.map(f => ({ f, o }))), out = [];
  for (let i = 0; i < F.length; i += RL_FOTOS_FOLHA) out.push(F.slice(i, i + RL_FOTOS_FOLHA));
  return out.map((L, k) => [`Evidências fotográficas${out.length > 1 ? ` (${k + 1} de ${out.length})` : ''}`, `${k ? '' : `<p class="note">${F.length} fotos de ${D.fotos.length} OMs do período (encerradas no período e abertas no período ainda em andamento), na ordem do encerramento. Originais no Google Drive e anexados na OM do Sankhya.</p>`}<div class="rl-fg">${L.map(({ f, o }) => rlFoto(Object.assign({}, f, { leg: `OM ${o.num || '—'} · ${vName(o.vessel)}${f.leg ? ' · ' + f.leg : ''}` }), o)).join('')}</div>`]); }
function rlRelatorio(D) { const F = rlGerencial(D).concat(rlFotosFolhas(D)); rlSecoes.cache = F;
  const nG = F.length - rlFotosFolhas(D).length; return `<div class="rl-doc">${rlCapa(D)}${F.map((f, i) => rlFolha(D, i + 2, f[0], f[1], F.length + 1, i < nG ? f[2] : 'A')).join('')}</div>`; }
function rlCaber(raiz) { (raiz || document).querySelectorAll('.rl-g .body').forEach(b => { b.style.zoom = 1; if (b.scrollHeight <= b.clientHeight) return;   // reduzir muda a quebra das linhas: procura o maior zoom que cabe
  let lo = .45, hi = 1; for (let i = 0; i < 8; i++) { const m = (lo + hi) / 2; b.style.zoom = m; if (b.scrollHeight <= b.clientHeight) lo = m; else hi = m; } b.style.zoom = lo; }); }
// apresentação: as mesmas folhas, um assunto por slide, ajustados ao tamanho do slide (rlFit)
function rlSlides(D) { const per = rlPerTx(D), F = rlGerencial(D), sl = (tt, h) => `<div class="rl-s"><div class="rl-s-h"><small>${per}</small><h2>${tt}</h2></div><div class="rl-s-c"><div class="rl-s-z">${h}</div></div></div>`, out = [];
  F.forEach(([tit, h, sec]) => { const t = document.createElement('div'); t.innerHTML = h; t.querySelectorAll('.rl-q').forEach(c => { const hd = c.querySelector('h2,.rl-gt'), tt = hd ? hd.innerHTML : esc(tit); if (hd) hd.remove(); out.push(sl(`${sec} · ${esc(tit.replace(/ \(continuação\)$/, ''))} — ${tt}`, c.innerHTML)); }); });
  return [`<div class="rl-s rl-s-capa"><img src="${LOGOS.nav}" alt="Navecunha"><small>NAVEGAÇÃO CUNHA · MANUTENÇÃO DA FROTA</small><h1>Relatório Mensal</h1><p>${per}</p><p class="rl-m">${rlNumDoc(D)} · ${D.V.length} empurradores em operação${temExemplo() ? ' · dados de exemplo' : ''}</p></div>`].concat(out); }
function rlFit() { const c = document.querySelector('.rl-stage .rl-s-c'), z = c && c.querySelector('.rl-s-z'); if (!z) return; z.style.zoom = 1; const k = Math.min(1, (c.clientHeight - 4) / z.scrollHeight, (c.clientWidth - 4) / z.scrollWidth); z.style.zoom = k > 0 ? k : 1; }
// ---------- relatório A4: capa · resumo executivo · metas · … · contracapa · anexo de fotos ----------
const rlPerTx = D => `${brD(isoD(D.ini))} a ${brD(isoD(new Date(D.fim - 864e5)))}`;
const rlNumDoc = D => 'RM-' + isoD(new Date(D.fim - 864e5)).slice(0, 7);
function rlExec(D) { const N = D.N, A = D.A, L = [];
  L.push(`Disponibilidade da frota de <b>${rlFmt(N.disp, 1, '%')}</b>, ${N.disp == null ? 'sem dados' : N.disp >= 95 ? 'dentro da meta de 95%' : '<b class="rl-ruim">abaixo da meta de 95%</b>'}.`);
  L.push(`Aderência ao cronograma de <b>${rlFmt(N.ader, 0, '%')}</b>${A.ader != null && N.ader != null ? ` (${N.ader >= A.ader ? 'melhor' : 'pior'} que os ${nf(A.ader)}% do período anterior)` : ''}; <b>${nf(N.naoPrazo)}</b> serviços preventivos não realizados dentro do prazo.`);
  L.push(`<b>${N.corrAb.length}</b> corretivas abertas no período (${['Crítica', 'Alta'].map(c => `${D.cl[c] || 0} ${c}`).join(', ')}) contra ${A.corrAb.length} no período anterior${(() => { const g = {}; N.corrAb.forEach(o => { const k = rlSis(o.sistema); g[k] = (g[k] || 0) + 1; }); const t = Object.entries(g).sort((x, y) => y[1] - x[1])[0]; return !t ? '' : t[1] > 1 ? `; o sistema que mais quebrou foi <b>${esc(t[0])}</b> (${t[1]} corretivas)` : '; cada uma num sistema diferente'; })()}.`);
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
    ${aba === 'apres' ? '' : '<button class="mbtn" data-rlreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button>'}<button class="mbtn" data-rlocultar title="Tira este item do menu neste aparelho; volta em Administração → Menu deste aparelho">Ocultar do menu</button>${aba === 'apres' ? '<button class="mbtn pri" data-rlcheia>⛶ Tela cheia</button>' : '<button class="mbtn" data-rlimp="a" title="Quadros completos das telas, rastreabilidade e todas as fotos (para auditoria)">🖨 Anexo técnico e evidências</button><button class="mbtn pri" data-rlimp="g">🖨 Relatório gerencial</button>'}</div>
   <div class="card rl-per"><label class="f">De<input type="date" id="rlDe" value="${RL.de}"></label><label class="f">Até<input type="date" id="rlAte" value="${RL.ate}"></label><div class="cm-chips">${at.map(([k, t]) => `<button class="cm-chip" data-rlat="${k}">${t}</button>`).join('')}</div></div>`;
}
function vRelMes() { rlPer(); const D = rlDados(), bb = rlBarra('rel'), ib = bb.indexOf('<div class="card rl-per">');   // janelas livres (padrão único): cabeçalho fora, quadros dentro
  return '<div class="cm-v">' + bb.slice(0, ib) + '<div class="cm-ws">' + bb.slice(ib) + `<div class="card"><h2>Riscos, ações e decisões</h2><p class="note">Texto seu para este período (salvo neste aparelho). Entra no fim do relatório e no último slide.</p><textarea id="rlNota" rows="4" placeholder="Ex.: CJA X segue bloqueado aguardando bomba injetora; decidir compra do kit de reversor; antecipar docagem do CJA XX.">${esc(rlNota())}</textarea></div>
   <div class="card rl-wrap">${rlRelatorio(D)}</div></div></div>`; }
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
const AFTER_RL = () => { const m = $('#main'); if (VIEW === 'apresmes') setTimeout(rlFit, 60); else { setTimeout(() => rlCaber(m), 60); const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_relmes_lay', '[data-rlreset]'); }
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
const RL_CSS = `.rl-doc{max-width:900px;margin:0 auto;color:#0F172A}
.rl-m{color:#64748B;font-size:12px}
.rl-sec{margin:16px 0 8px}.rl-sec h2{font-size:16px;color:#16244A;display:flex;align-items:center;gap:8px;border-bottom:1px solid #E3E8EF;padding-bottom:4px;margin:0 0 8px}.rl-sec h2 span{background:#16244A;color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px}.rl-sec h3{font-size:13.5px;margin:12px 0 4px;color:#16244A}

.rl-ruim{color:#DC2626}.rl-at{color:#D97706}
.rl-t{width:100%;border-collapse:collapse;font-size:12.5px;margin:4px 0}.rl-t th{background:#16244A;color:#fff;text-align:left;padding:5px 7px;font-weight:600}.rl-t td{border-bottom:1px solid #E3E8EF;padding:5px 7px;vertical-align:top}
.rl-nada{color:#64748B;font-style:italic}.rl-nota{background:#F1F5F9;border-radius:8px;padding:10px 12px;white-space:normal}
.rl-om{margin:10px 0;break-inside:avoid}.rl-om h3{margin:0 0 2px}.rl-ph-g{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:6px}.rl-ph-g figure{margin:0;border:1px solid #E3E8EF;border-radius:6px;overflow:hidden;background:#fff}.rl-ph-g img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}.rl-ph{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#F1F5F9,#F1F5F9 8px,#E2E8F0 8px,#E2E8F0 16px);color:#64748B;font-size:12px;text-decoration:none}.rl-ph-g figcaption{font-size:11px;padding:4px 6px;color:#334155}
.rl-sh{font-size:17px;color:#1F2A44;display:flex;align-items:center;gap:10px;border-bottom:2px solid #1F2A44;padding-bottom:5px;margin:0 0 10px}.rl-sh span{background:#1F2A44;color:#fff;border-radius:4px;min-width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:13px}
.rl-q{margin:0 0 12px!important;max-height:none!important;height:auto!important;overflow:visible!important;position:relative!important;left:auto!important;top:auto!important;width:auto!important;break-inside:avoid}.rl-q .tw{max-height:none!important;overflow:visible!important}.rl-q thead th,.rl-q th{position:static!important;top:auto!important}.rl-q td,.rl-q td *{white-space:normal!important}.rl-q td{max-width:300px;overflow-wrap:anywhere}.rl-q table.rl-fix{table-layout:fixed!important}.rl-q th{white-space:normal!important}.rl-fix th:nth-child(1){width:15%}.rl-fix th:nth-child(2){width:9%}.rl-fix th:nth-child(3){width:9%}.rl-fix th:nth-child(4){width:8%}.rl-fix th:nth-child(5){width:11%}.rl-fix th:nth-child(6){width:8%}.rl-fix th:nth-child(7){width:40%}.rl-fix td{max-width:none!important}.rl-q td span{display:inline-block}.rl-q .cf-card table,.rl-q table.t{font-size:10.5px}.rl-q .cf-card td,.rl-q .cf-card th{padding:4px 3px!important}.rl-q table{width:100%!important;table-layout:auto}.rl-q .cf-card,.rl-q.cf-card{overflow:visible!important}.rl-rm .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rl-g .pill{white-space:nowrap}.rl-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.rl-fg figure{margin:0;border:1px solid #E3E8EF;border-radius:6px;overflow:hidden;background:#fff}.rl-fg img,.rl-fg .rl-ph{width:100%;aspect-ratio:4/3;object-fit:cover;display:flex;align-items:center;justify-content:center;background:#F1F5F9;color:#64748B;font-size:11px}.rl-fg figcaption{font-size:10.5px;padding:4px 6px;line-height:1.3}.rl-ind td,.rl-dec td{padding:4px 6px!important}.rl-dec td{font-size:11.5px!important;vertical-align:top}.rl-2c{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rl-2c>.rl-q{margin:0!important}.rl-g .body{overflow:hidden}.rl-g .rl-q{padding:10px 12px!important}.rl-g .rl-q h2{font-size:13px!important;margin:0 0 6px!important}.rl-g table.t{font-size:10px}.rl-folha{margin:0 auto 18px;box-shadow:0 1px 6px rgba(0,0,0,.12)}.rl-s-z{transform-origin:0 0}.rl-s-c{overflow:hidden;justify-content:flex-start!important}.rl-s .card{background:#fff}
.rl-pg{break-after:page}.rl-pg:last-child{break-after:auto}

.rl-ass{width:100%;border-collapse:collapse;margin-top:auto;font-size:12.5px}.rl-ass th{background:#16244A;color:#fff;padding:5px 8px;text-align:left;width:50%}.rl-ass td{border:1px solid #CBD5E1;padding:8px;height:34px;vertical-align:top}.rl-ass .rl-lin{color:#64748B;font-size:11px}
.rl-exec{margin:4px 0 10px 18px;padding:0;line-height:1.55}.rl-ok{color:#16A34A}
@media screen{.rl-pg{border-bottom:2px dashed #CBD5E1;padding-bottom:18px;margin-bottom:18px}}`;
const RL_CSS_G = `.rl-svg{width:100%;height:auto;display:block}.rl-gf{break-inside:avoid}.rl-gt{font-weight:700;font-size:13px;color:#1F2A44;margin:0 0 4px}.rl-an{font-size:11.5px;line-height:1.45;margin:5px 0 0;color:#1F2A44}.rl-fo{font-size:10px;color:#64748B;margin:3px 0 0;line-height:1.35}.rl-p{margin:2px 0;font-size:12.5px;line-height:1.5}.rl-esc td{font-size:11.5px;padding:4px 6px!important;vertical-align:top}.rl-esc td:first-child{width:130px;white-space:nowrap!important}.rl-conc{margin:4px 0 0 18px;padding:0;line-height:1.55;font-size:12.5px}.rl-conc li{margin:0 0 4px}.rl-q h3{font-size:12.5px;margin:10px 0 4px}`;
{ const st = document.createElement('style'); st.textContent = RL_CSS + RL_CSS_G + `
.rl-per{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.rl-per .f{width:170px}.rl-wrap{padding:22px}
.rl-ap{outline:none;background:#0F172A;border-radius:12px;padding:14px;container-type:inline-size}.rl-ap:fullscreen{display:flex;flex-direction:column;justify-content:center;padding:2vw}.rl-stage{background:#F4F1EA;border-radius:10px;aspect-ratio:16/9;overflow:hidden}
.rl-s{height:100%;display:flex;flex-direction:column;padding:3.2cqw 4cqw;box-sizing:border-box;font-size:1.6cqw}.rl-s-h small{color:#9A5B00;font-weight:700;letter-spacing:.1em;font-size:1.2cqw}.rl-s-h h2{margin:.3cqw 0;font-size:3.4cqw;color:#16244A}.rl-s-h p{margin:0 0 1cqw;color:#475569;font-size:1.5cqw}.rl-s-c{flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.4cqw}
.rl-s .rl-ks{gap:1.2cqw}.rl-s .rl-k{padding:1.2cqw 1.4cqw}.rl-s .rl-k small{font-size:1.3cqw}.rl-s .rl-k b{font-size:3.2cqw}.rl-s .rl-k em,.rl-s .rl-up,.rl-s .rl-dn,.rl-s .rl-eq{font-size:1.15cqw}.rl-s svg text{font-size:12px}
.rl-s-capa{justify-content:center;background:#16244A;color:#F4F1EA}.rl-s-capa img{height:5cqw;background:#F4F1EA;border-radius:.6cqw;padding:.6cqw;align-self:flex-start;margin-bottom:2cqw}.rl-s-capa small{color:#E8A33D;font-weight:700;letter-spacing:.12em;font-size:1.3cqw}.rl-s-capa h1{font-size:5.4cqw;margin:.6cqw 0}.rl-s-capa p{font-size:2cqw;margin:.3cqw 0}.rl-s-capa .rl-m{color:#C9D3E6;font-size:1.5cqw}
.rl-s-l{font-size:1.6cqw;line-height:1.5;margin:0}.rl-ph-s{grid-template-columns:repeat(6,1fr)}.rl-ph-s figcaption{font-size:1cqw}.rl-s-nota{font-size:1.8cqw}
.rl-nav{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:10px;color:#C9D3E6}.rl-ap:fullscreen .rl-nav{opacity:.35}.rl-ap:fullscreen .rl-nav:hover{opacity:1}`; document.head.appendChild(st); }
