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
function rlDados() {
  const { ini, fim } = rlPer(), dias = Math.round((fim - ini) / 864e5), iniA = new Date(ini.getTime() - dias * 864e5);
  const N = rlNumeros(ini, fim), A = rlNumeros(iniA, ini), dentro = s => s && pD(s) >= ini && pD(s) < fim;
  const V = S.cfg.frota.filter(v => !foraOp(v)), FM = frotaMatriz().filter(x => x.sit >= 0);
  const frota = { lib: 0, rest: 0, bloq: 0, viag: 0, sem: 0 }; FM.forEach(x => { const s = situDe(x.v); if (!s) frota.sem++; else if (s.st === 'viagem') frota.viag++; else if (x.sit >= 2) frota.bloq++; else if (x.sit === 1) frota.rest++; else frota.lib++; });
  const saidas = recs('saida').filter(r => !r.excluido && dentro(r.date) && r.sit >= 1).sort((a, b) => a.date < b.date ? -1 : 1);
  const cl = {}; N.corrAb.forEach(o => { cl[o.classe || '—'] = (cl[o.classe || '—'] || 0) + 1; });
  const eq = {}; N.corrAb.forEach(o => { const k = String(o.equip || '').trim() || 'Equipamento não informado'; (eq[k] = eq[k] || []).push(o); });
  const pareto = Object.entries(eq).map(([k, L]) => [k, L.length, L]).sort((a, b) => b[1] - a[1]);
  const atrasadas = oms().filter(o => !o.excluido && o.status !== 'encerrada' && omAtrasada(o)), efic = typeof efPend === 'function' ? efPend() : [];
  const trocas = recs('lub').filter(r => r.tipo === 'fr049' && !r.excluido && dentro(r.date)).length;
  const oleoVenc = lubDados().filter(x => x.horas != null && x.horas < 0 && !foraOp(x.v));
  const laudos = recs('laudo').filter(r => !r.excluido && dentro(r.date)).map(r => ({ r, a: laudoSt(r) })).filter(x => x.a.st !== 'ok');
  const comp = recs('comp').filter(r => !r.excluido && dentro(r.date)).map(r => ({ r, min: Math.min(...(r.vals || []).map(rlNum).filter(x => x != null)) })).filter(x => isFinite(x.min) && x.min < COMP.aten);
  const param = recs('param').filter(r => !r.excluido && dentro(r.date)).map(r => ({ r, a: pmcAval(r) })).filter(x => x.a.st !== 'ok');
  const prox = riscoDados().alertas;
  const sk = typeof skPend === 'function' ? skPend() : [];
  const fotos = [...N.prevEnc, ...N.corrEnc].filter(o => (o.fotos || []).length).sort((a, b) => (a.fechadoAt || 0) - (b.fechadoAt || 0));
  return { ini, fim, dias, N, A, V, FM, frota, saidas, cl, pareto, atrasadas, efic, trocas, oleoVenc, laudos, comp, param, prox, sk, fotos };
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
// ---------- relatório A4 ----------
function rlRelatorio(D) {
  const per = `${brD(isoD(D.ini))} a ${brD(isoD(new Date(D.fim - 864e5)))}`, ant = `período anterior de ${D.dias} dias`, N = D.N;
  const sec = (n, t, h) => `<section class="rl-sec"><h2><span>${n}</span>${t}</h2>${h}</section>`;
  const tPrev = `<table class="rl-t"><thead><tr><th>Empurrador</th><th>Previsto</th><th>Aderência</th><th>Não realizados no prazo</th><th>OMs preventivas encerradas</th><th>Situação agora</th></tr></thead><tbody>${D.V.map(v => { const q = N.porV[v.id] || {}, fm = D.FM.find(x => x.v === v) || {}, s = situDe(v);
    return `<tr><td><b>${esc(v.nome)}</b></td><td>${nf(q.tP || 0)}</td><td>${q.den ? nf(q.ok / q.den * 100) + '%' : '—'}</td><td class="${q.venc ? 'rl-ruim' : ''}">${nf(q.venc || 0)}</td><td>${N.prevEnc.filter(o => o.vessel === v.id).length}</td><td>${s && s.st === 'viagem' ? 'Em viagem' : fm.sit >= 2 ? '<b class="rl-ruim">Bloqueado</b>' : fm.sit === 1 ? 'Com restrição' : s ? 'Liberado' : 'Local não informado'}</td></tr>`; }).join('')}</tbody></table>`;
  const top3 = D.pareto.slice(0, 3).map(([k, n, L]) => { const o = L[L.length - 1]; return `<div class="rl-f"><b>${esc(k)} · ${n} falha${n === 1 ? '' : 's'}</b><div>${L.map(x => `${esc(vName(x.vessel))} (OM ${esc(x.num || '—')}): ${esc(x.descricao || '')}`).join('<br>')}</div>${o.causa ? `<div><i>Causa:</i> ${esc(o.causa)}</div>` : ''}${o.mitig ? `<div><i>Ação:</i> ${esc(o.mitig)}</div>` : ''}</div>`; }).join('');
  const nota = rlNota();
  return `<div class="rl-doc">
   <header class="rl-capa"><img src="${LOGOS.nav}" alt="Navecunha"><div><small>NAVEGAÇÃO CUNHA · MANUTENÇÃO DA FROTA</small><h1>Relatório de manutenção</h1><p>${per} · ${D.V.length} empurradores em operação · comparação com o ${ant}</p><p class="rl-m">Emitido em ${brD(isoD(hoje()))} por ${esc(S.session ? S.session.name : '—')} · SMF · NP Navecunha 055 item 9</p></div><img src="${LOGOS.vda}" alt="Grupo VDA"></header>
   ${S.recs.size && temExemplo() ? '<div class="rl-ex">Dados de exemplo: frota simulada.</div>' : ''}
   ${sec(1, 'Resumo do período', rlResumo(D))}
   ${sec(2, 'Situação da frota agora', `<div class="rl-ks rl-ks5">${[['Liberados', D.frota.lib, '#16A34A'], ['Com restrição', D.frota.rest, '#D97706'], ['Bloqueados', D.frota.bloq, '#DC2626'], ['Em viagem', D.frota.viag, '#1967D2'], ['Local não informado', D.frota.sem, '#64748B']].map(([t, n, c]) => `<div class="rl-k"><small>${t}</small><b style="color:${c}">${n}</b></div>`).join('')}</div>
     <h3>Saídas com restrição ou bloqueio no período · ${D.saidas.length}</h3>${D.saidas.length ? `<table class="rl-t"><thead><tr><th>Data</th><th>Empurrador</th><th>Situação</th><th>Autorizou</th><th>Justificativa</th></tr></thead><tbody>${D.saidas.map(r => `<tr><td>${brD(r.date)}</td><td><b>${esc(vName(r.vessel))}</b></td><td>${esc(r.sitTxt || '')}</td><td>${esc(r.autorizou || '—')}</td><td>${esc(r.just || '—')}</td></tr>`).join('')}</tbody></table>` : rlVazio('Nenhuma saída com restrição ou bloqueio.')}`)}
   ${sec(3, 'Manutenção preventiva', `<p>Aderência ao cronograma no período: <b>${rlFmt(N.ader, 0, '%')}</b> · ${nf(N.naoPrazo)} serviços preventivos não realizados dentro do prazo · ${N.prevEnc.length} OMs preventivas encerradas.</p>${tPrev}`)}
   ${sec(4, 'Manutenção corretiva', `<p>${N.corrAb.length} corretivas abertas (${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `${c}: ${D.cl[c] || 0}`).join(' · ')}) · ${N.corrEnc.length} encerradas · ${D.atrasadas.length} com prazo estourado agora · ${D.efic.length} eficácias vencidas.</p>
     <h3>O que mais quebrou · por equipamento</h3>${D.pareto.length ? rlBarras(D.pareto.slice(0, 8).map(([k, n]) => [k, n, '#D97706'])) : rlVazio('Nenhuma falha no período.')}
     ${top3 ? `<h3>As falhas que mais se repetiram</h3>${top3}` : ''}`)}
   ${sec(5, 'Condição dos motores', `<div class="rl-ks rl-ks4">${[['Trocas de óleo (FR 049_B)', D.trocas], ['Óleo vencido agora', D.oleoVenc.length], ['Laudos com alerta', D.laudos.length], ['Compressão abaixo de 1,45 MPa', D.comp.length]].map(([t, n]) => `<div class="rl-k"><small>${t}</small><b>${n}</b></div>`).join('')}</div>
     ${D.oleoVenc.length ? `<h3>Óleo vencido</h3><ul>${D.oleoVenc.map(x => `<li><b>${esc(x.v.nome)}</b> · ${esc(eqNomeC(x.v, x.e))} · vencido há ${nf(-x.horas)} h</li>`).join('')}</ul>` : ''}
     ${D.laudos.length ? `<h3>Laudos de óleo com alerta</h3><ul>${D.laudos.map(x => `<li><b>${esc(vName(x.r.vessel))} ${esc(x.r.pos)}</b> · ${brD(x.r.date)} · ${x.a.alertas.slice(0, 3).map(a => esc(a.nome) + ' ' + nf(a.v, 1) + ' ' + esc(a.un)).join(', ')}</li>`).join('')}</ul>` : ''}
     ${D.comp.length ? `<h3>Compressão</h3><ul>${D.comp.map(x => `<li><b>${esc(vName(x.r.vessel))} ${esc(x.r.pos)}</b> · ${brD(x.r.date)} · pior cilindro ${nf(x.min, 2)} MPa</li>`).join('')}</ul>` : ''}
     ${D.param.length ? `<h3>Parâmetros do MCP fora do limite</h3><ul>${D.param.map(x => `<li><b>${esc(vName(x.r.vessel))} ${esc(x.r.pos || '')}</b> · ${brD(x.r.date)} · ${x.a.txt.map(esc).join('; ')}</li>`).join('')}</ul>` : ''}`)}
   ${sec(6, 'Próximos 90 dias e alertas', D.prox.length ? `<ul>${D.prox.map(a => `<li><b class="${a.p === 1 ? 'rl-ruim' : 'rl-at'}">P${a.p}</b> ${esc(a.t)}</li>`).join('')}</ul><p class="rl-m">P1 = vencido ou interditado · P2 = vence em breve (docagem ≤ 90 d, calibração ≤ 30 d, óleo ≤ 50 h)</p>` : rlVazio('Nenhum alerta.'))}
   ${sec(7, 'Custos e horas-homem', N.custo.hh || N.custo.r ? `<p><b>${nf(N.custo.hh)} h</b> de mão de obra e <b>R$ ${nf(N.custo.r)}</b> em materiais e serviços nas OMs encerradas no período.</p>` : rlVazio('Sem custos lançados nas OMs encerradas no período.'))}
   ${sec(8, 'Evidências pendentes no Sankhya', D.sk.length ? `<ul>${D.sk.map(x => `<li><b>${esc(x.tipo)}</b> · OM ${esc(x.num || '—')} · ${esc(vName(x.vid))}</li>`).join('')}</ul>` : rlVazio('Nada pendente: todas as OMs encerradas estão anexadas no Sankhya.'))}
   ${sec(9, 'Riscos, ações e decisões', nota ? `<div class="rl-nota">${esc(nota).replace(/\n/g, '<br>')}</div>` : rlVazio('Escreva no campo “Riscos, ações e decisões” acima do relatório.'))}
   ${sec(10, `Evidências fotográficas · ${D.fotos.reduce((a, o) => a + o.fotos.length, 0)} fotos de ${D.fotos.length} OMs`, D.fotos.length ? D.fotos.map(o => `<div class="rl-om"><h3>${rlOmTit(o)}</h3>${o.tipo === 'C' && o.descricao ? `<p class="rl-m">${esc(o.descricao)}</p>` : ''}<div class="rl-ph-g">${o.fotos.map(f => rlFoto(f, o)).join('')}</div></div>`).join('') : rlVazio('Nenhuma OM encerrada com fotos no período.'))}
  </div>`;
}
// ---------- apresentação ----------
function rlSlides(D) {
  const per = `${brD(isoD(D.ini))} a ${brD(isoD(new Date(D.fim - 864e5)))}`, N = D.N, fotosT = D.fotos.flatMap(o => o.fotos.map(f => ({ f, o }))), nota = rlNota();
  const sl = (t, h, sub) => `<div class="rl-s"><div class="rl-s-h"><small>${per}</small><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ''}</div><div class="rl-s-c">${h}</div></div>`;
  return [
    `<div class="rl-s rl-s-capa"><img src="${LOGOS.nav}" alt="Navecunha"><small>NAVEGAÇÃO CUNHA · MANUTENÇÃO DA FROTA</small><h1>Relatório de manutenção</h1><p>${per}</p><p class="rl-m">${D.V.length} empurradores em operação${temExemplo() ? ' · dados de exemplo' : ''}</p></div>`,
    sl('Resumo do período', rlResumo(D), 'comparação com o período anterior de mesma duração'),
    sl('Situação da frota agora', `<div class="rl-ks rl-ks5">${[['Liberados', D.frota.lib, '#16A34A'], ['Com restrição', D.frota.rest, '#D97706'], ['Bloqueados', D.frota.bloq, '#DC2626'], ['Em viagem', D.frota.viag, '#1967D2'], ['Sem local', D.frota.sem, '#64748B']].map(([t, n, c]) => `<div class="rl-k"><small>${t}</small><b style="color:${c}">${n}</b></div>`).join('')}</div><p><b>${D.saidas.length}</b> saída${D.saidas.length === 1 ? '' : 's'} com restrição ou bloqueio no período${D.saidas.length ? ': ' + D.saidas.slice(0, 4).map(r => `${esc(vName(r.vessel))} (${esc(r.autorizou || 'sem nome')})`).join(' · ') : ''}.</p>`),
    sl('Manutenção preventiva', rlBarras(D.V.map(v => { const q = N.porV[v.id] || {}; return [v.nome, q.den ? Math.round(q.ok / q.den * 100) : 0, q.den && q.ok / q.den >= .9 ? '#16A34A' : '#D97706']; }), 640, 280), `aderência por empurrador (%) · frota ${rlFmt(N.ader, 0, '%')} · ${nf(N.naoPrazo)} serviços não realizados no prazo`),
    sl('O que mais quebrou', D.pareto.length ? rlBarras(D.pareto.slice(0, 8).map(([k, n]) => [k, n, '#D97706']), 640, 260) : rlVazio('Nenhuma falha no período.'), `${N.corrAb.length} corretivas abertas · ${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `${c} ${D.cl[c] || 0}`).join(' · ')}`),
    sl('Condição dos motores', `<div class="rl-ks rl-ks4">${[['Trocas de óleo', D.trocas], ['Óleo vencido agora', D.oleoVenc.length], ['Laudos com alerta', D.laudos.length], ['Compressão < 1,45 MPa', D.comp.length]].map(([t, n]) => `<div class="rl-k"><small>${t}</small><b>${n}</b></div>`).join('')}</div>${D.laudos.length ? `<p>Laudos: ${D.laudos.slice(0, 4).map(x => `${esc(vName(x.r.vessel))} ${esc(x.r.pos)}`).join(' · ')}</p>` : ''}`),
    sl('Próximos 90 dias', D.prox.length ? `<ul class="rl-s-l">${D.prox.slice(0, 9).map(a => `<li><b class="${a.p === 1 ? 'rl-ruim' : 'rl-at'}">P${a.p}</b> ${esc(a.t)}</li>`).join('')}</ul>` : rlVazio('Nenhum alerta.')),
    sl(`Evidências fotográficas · ${fotosT.length}`, fotosT.length ? `<div class="rl-ph-g rl-ph-s">${fotosT.slice(0, 12).map(x => rlFoto(x.f, x.o)).join('')}</div>${fotosT.length > 12 ? `<p class="rl-m">+ ${fotosT.length - 12} fotos no relatório</p>` : ''}` : rlVazio('Nenhuma foto no período.'), `${D.fotos.length} OMs encerradas com fotos de antes e depois`),
    sl('Riscos, ações e decisões', nota ? `<div class="rl-nota rl-s-nota">${esc(nota).replace(/\n/g, '<br>')}</div>` : rlVazio('Escreva no campo “Riscos, ações e decisões” na aba Relatório.'), D.sk.length ? `${D.sk.length} evidência${D.sk.length === 1 ? '' : 's'} pendente${D.sk.length === 1 ? '' : 's'} no Sankhya` : ''),
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
function rlImprimir() { const w = window.open('', '_blank'); if (!w) { toast('O navegador bloqueou a janela de impressão. Permita pop-ups para o SMF.'); return; }
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de manutenção ${RL.de} a ${RL.ate}</title><base href="${location.href.replace(/[#?].*$/, '')}"><style>body{margin:0;font:13px/1.45 "Segoe UI",Arial,sans-serif;color:#0F172A;background:#fff}${RL_CSS}@page{size:A4;margin:12mm}.rl-sec{break-inside:auto}.rl-om,.rl-k,.rl-f{break-inside:avoid}</style></head><body>${rlRelatorio(rlDados())}<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`); w.document.close(); }
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
.rl-om{margin:10px 0;break-inside:avoid}.rl-om h3{margin:0 0 2px}.rl-ph-g{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:6px}.rl-ph-g figure{margin:0;border:1px solid #E3E8EF;border-radius:6px;overflow:hidden;background:#fff}.rl-ph-g img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}.rl-ph{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#F1F5F9,#F1F5F9 8px,#E2E8F0 8px,#E2E8F0 16px);color:#64748B;font-size:12px;text-decoration:none}.rl-ph-g figcaption{font-size:11px;padding:4px 6px;color:#334155}`;
{ const st = document.createElement('style'); st.textContent = RL_CSS + `
.rl-per{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.rl-per .f{width:170px}.rl-wrap{padding:22px}
.rl-ap{outline:none;background:#0F172A;border-radius:12px;padding:14px;container-type:inline-size}.rl-ap:fullscreen{display:flex;flex-direction:column;justify-content:center;padding:2vw}.rl-stage{background:#F4F1EA;border-radius:10px;aspect-ratio:16/9;overflow:hidden}
.rl-s{height:100%;display:flex;flex-direction:column;padding:3.2cqw 4cqw;box-sizing:border-box;font-size:1.6cqw}.rl-s-h small{color:#9A5B00;font-weight:700;letter-spacing:.1em;font-size:1.2cqw}.rl-s-h h2{margin:.3cqw 0;font-size:3.4cqw;color:#16244A}.rl-s-h p{margin:0 0 1cqw;color:#475569;font-size:1.5cqw}.rl-s-c{flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.4cqw}
.rl-s .rl-ks{gap:1.2cqw}.rl-s .rl-k{padding:1.2cqw 1.4cqw}.rl-s .rl-k small{font-size:1.3cqw}.rl-s .rl-k b{font-size:3.2cqw}.rl-s .rl-k em,.rl-s .rl-up,.rl-s .rl-dn,.rl-s .rl-eq{font-size:1.15cqw}.rl-s svg text{font-size:12px}
.rl-s-capa{justify-content:center;background:#16244A;color:#F4F1EA}.rl-s-capa img{height:5cqw;background:#F4F1EA;border-radius:.6cqw;padding:.6cqw;align-self:flex-start;margin-bottom:2cqw}.rl-s-capa small{color:#E8A33D;font-weight:700;letter-spacing:.12em;font-size:1.3cqw}.rl-s-capa h1{font-size:5.4cqw;margin:.6cqw 0}.rl-s-capa p{font-size:2cqw;margin:.3cqw 0}.rl-s-capa .rl-m{color:#C9D3E6;font-size:1.5cqw}
.rl-s-l{font-size:1.6cqw;line-height:1.5;margin:0}.rl-ph-s{grid-template-columns:repeat(6,1fr)}.rl-ph-s figcaption{font-size:1cqw}.rl-s-nota{font-size:1.8cqw}
.rl-nav{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:10px;color:#C9D3E6}.rl-ap:fullscreen .rl-nav{opacity:.35}.rl-ap:fullscreen .rl-nav:hover{opacity:1}`; document.head.appendChild(st); }
