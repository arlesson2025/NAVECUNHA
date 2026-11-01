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
// compressão do MCP: último ensaio de cada motor, do mais perto do overhaul para o mais longe (mesma conta da tela de Compressão, cmpDados)
// gráficos tirados das próprias telas do SMF (mesmo desenho que o Supervisor já usa)
// capa no modelo do Anexo II (carimbo do documento controlado, título, dados do registro, revisão e aprovação)
// contracapa = rastreabilidade do relatório (mesma lógica da contracapa do Anexo II): cálculo, registros usados, evidências, controle documental, referências e assinaturas
// ---------- quadros das telas (o relatório é montado com os próprios quadros do SMF, sem desenho próprio) ----------
// capa e índice: as mesmas folhas do Anexo II (.sheet, carimbo, cabeçalho e rodapé do documento controlado)
// anexo técnico e evidências: todos os quadros completos das telas, a contracapa de rastreabilidade e todas as fotos
// ---------- relatório gerencial: capa + 4 folhas A4, escrito para quem não usa o SMF (decisão do Supervisor, 25/10/2026) ----------
// 2 o mês em uma página (indicadores com “como se lê” e o que precisa da gerência) · 3 falhas e corretivas · 4 preventiva e condição dos motores · 5 frota hoje, próximos dias e assinaturas
// cada folha é uma .sheet do Anexo II; o conteúdo que passar do tamanho é reduzido para caber (rlCaber), nunca vira 2 páginas
// como se lê cada indicador e o que fazer quando está fora da meta (o nome é o mesmo de rlDados().metas)
// o que precisa da gerência: tudo o que pede decisão, dinheiro ou prazo, com a ação proposta
// cronograma do ano da frota: previsto, realizado e no prazo mês a mês (a mesma conta da tela, prResumo)
// últimos 6 meses: corretivas, MTTR e disponibilidade, mês a mês
// ---------- relatório técnico: só os gráficos que já existem nas telas do SMF (lineChart, stackChart, rmPareto, rmBarras, prGrafico, prGrafAcum, Histórico de compressão, Saldo para a troca, hfPareto) ----------
// série mensal dos indicadores (12 meses até o fim do período): mesmas contas dos Indicadores (kpiDisp, kpiMTBF móvel 12 meses, MTTR das falhas liberadas no mês)
// tendência em palavras: média dos 3 últimos meses × 3 anteriores
// responsável pela ação: dinheiro, estaleiro e indicador da frota sobem para a gerência
// evidências fotográficas: todas as fotos do período, 9 por folha, quantas folhas forem precisas (decisão do Supervisor, 25/10/2026)
function rlCaber(raiz) { (raiz || document).querySelectorAll('.rl-g .body').forEach(b => { b.style.zoom = 1; if (b.scrollHeight <= b.clientHeight) return;   // reduzir muda a quebra das linhas: procura o maior zoom que cabe
  let lo = .45, hi = 1; for (let i = 0; i < 8; i++) { const m = (lo + hi) / 2; b.style.zoom = m; if (b.scrollHeight <= b.clientHeight) lo = m; else hi = m; } b.style.zoom = lo; }); }
// apresentação: as mesmas folhas, um assunto por slide, ajustados ao tamanho do slide (rlFit)
function rlFit() { const c = document.querySelector('.rl-stage .rl-s-c'), z = c && c.querySelector('.rl-s-z'); if (!z) return; z.style.zoom = 1; const k = Math.min(1, (c.clientHeight - 4) / z.scrollHeight, (c.clientWidth - 4) / z.scrollWidth); z.style.zoom = k > 0 ? k : 1; }
// ---------- relatório A4: capa · resumo executivo · metas · … · contracapa · anexo de fotos ----------
// ---------- apresentação: capa · resumo executivo · metas · frota · horas · preventiva · corretiva · condição · próximos 90 dias · fotos ----------
// ---------- telas ----------
// as logos vão embutidas (data URL): a janela de impressão nem sempre consegue buscar arquivos (sem sinal ou pelo service worker)
// todo o estilo do SMF (smf.css e os estilos dos blocos) vai embutido: a janela de impressão nem sempre consegue buscar arquivos
// trocar de slide mexe só no palco: render() recriaria a tela e tiraria o projetor da tela cheia
function rlIr(d) { const L = RL.cache || []; if (!L.length) return; RL.s = Math.max(0, Math.min(L.length - 1, RL.s + d)); const st = document.querySelector('.rl-stage'), n = document.querySelector('.rl-nav span'); if (st) st.innerHTML = L[RL.s]; if (n) n.textContent = (RL.s + 1) + ' / ' + L.length; rlFit(); }
window.addEventListener('resize', () => { if (VIEW === 'apresmes') setTimeout(rlFit, 120); });
document.addEventListener('fullscreenchange', () => { if (VIEW === 'apresmes') setTimeout(rlFit, 200); });
document.addEventListener('keydown', e => { if (VIEW !== 'apresmes' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); rlIr(1); } else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); rlIr(-1); } });
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

.rl-stage{background:#F4F1EA;border-radius:10px;aspect-ratio:16/9;overflow:hidden}
.rl-s{height:100%;display:flex;flex-direction:column;padding:3.2cqw 4cqw;box-sizing:border-box;font-size:1.6cqw}.rl-s-c{flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.4cqw}
.rl-s svg text{font-size:12px}

.rl-nav{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:10px;color:#C9D3E6}`; document.head.appendChild(st); }
