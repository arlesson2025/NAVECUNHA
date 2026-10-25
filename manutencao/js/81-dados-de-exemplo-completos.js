/* ===== Dados de exemplo completos para apresentação (pedido do Supervisor, 25/10/2026) =====
   Completa a frota simulada para todas as telas terem conteúdo: onde está cada empurrador (porto/viagem, com registro de saída),
   histórico de docagens (entrada, saída, estaleiro, serviços e custo), laudos de óleo anteriores (tendência), uma OM em conferência,
   OMs encerradas para anexar no Sankhya (skDemo), uma avaria em viagem, prestadores e treinamentos.
   Tudo marcado seed:true (some em "Limpar dados de exemplo"); roda uma vez por aparelho (registro 'ex-demo-v1'). */
'use strict';
async function exemploDemo() {
  if (!temExemplo() || S.recs.has('ex-demo-v1')) return;
  let sd = 2610; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280, put = [], agora = Date.now();
  const dia = n => { const d = new Date(hoje()); d.setDate(d.getDate() - n); return d; }, nOm = n => oms().find(o => o.num === n);
  const op = S.cfg.frota.filter(v => !foraOp(v)), base = { seed: true, createdAt: agora, updatedAt: agora, by: 'Supervisor (exemplo)' };
  // 1) onde está cada empurrador: CJA XVI e XVII em viagem (com registro de saída), o resto no porto
  let mudouCfg = false;
  op.forEach((v, i) => { if (v.situ) return; const viagem = /^CJA XVI{1,2}$/.test(v.nome), d = dia(viagem ? 3 + i % 4 : i % 5);
    v.situ = { st: viagem ? 'viagem' : 'porto', at: isoD(d), by: 'Supervisor (exemplo)', ts: +d + 8 * 36e5 }; mudouCfg = true;
    if (viagem) put.push(Object.assign({ id: 'ex-sai-' + v.id, kind: 'saida', vessel: v.id, date: isoD(d), hora: '08:00', at: +d + 8 * 36e5, sit: 1, sitTxt: 'Com restrição', pend: [], corr: [], nc: [], just: 'Itens vencidos programados para a próxima janela (exemplo).' }, base)); });
  if (mudouCfg) { S.cfg.situExemplo = true; await kvSet('cfg', S.cfg); }
  // 2) docagens: completa a última (saída, estaleiro, serviços, custo) e cria a anterior (~60 meses antes)
  const EST = ['Estaleiro Rio Negro (exemplo)', 'Estaleiro Juruá (exemplo)', 'Estaleiro São Raimundo (exemplo)'];
  const SERV = 'Jateamento e pintura do casco; medição de espessura por ultrassom; troca de zincos; revisão de eixos, buchas e lemes';
  op.forEach((v, i) => { const b = recs('base').find(r => r.seed && r.vessel === v.id && r.item === DOCA.item); if (!b || !b.date) return;
    const ent = pD(b.date), dur = 12 + Math.round(R() * 16), sai = new Date(ent); sai.setDate(sai.getDate() + dur);
    if (!b.saida && sai < hoje()) Object.assign(b, { saida: isoD(sai), estaleiro: EST[i % 3], servicos: SERV, custo: Math.round(180 + R() * 240), updatedAt: agora });
    put.push(b);
    const atraso = [-1, 0, 0, 1, 2, 3][i % 6], e0 = addM(ent, -(60 + atraso)), s0 = new Date(e0); s0.setDate(s0.getDate() + 14 + Math.round(R() * 14));
    put.push(Object.assign({ id: 'ex-doca-' + v.id, kind: 'base', vessel: v.id, pos: b.pos || 'UN', item: DOCA.item, h: null, date: isoD(e0), saida: isoD(s0), estaleiro: EST[(i + 1) % 3], servicos: 'Jateamento e pintura; medição de espessura; troca de zincos', custo: Math.round(140 + R() * 180) }, base)); });
  // 3) laudos de óleo anteriores (tendência): exLaudoHist
  exLaudoHist(R, base).forEach(l => put.push(l));
  // 4) OM em conferência e OMs encerradas esperando o anexo no Sankhya (skDemo: o cartão ignora os seed sem essa marca)
  const c1 = nOm('48213'); if (c1 && c1.status === 'executada') { c1.status = 'conferencia'; c1.updatedAt = agora - 2 * 864e5; put.push(c1); }
  ['P', 'C'].forEach(t => { const o = oms().filter(o => o.seed && o.tipo === t && o.status === 'encerrada').sort((a, b) => (b.fechadoAt || 0) - (a.fechadoAt || 0))[0]; if (o && !o.skFim) { o.skDemo = true; put.push(o); } });
  // 5) avaria comunicada em viagem (falha sem OM)
  const vA = op.find(v => v.nome === 'CJA XVI'); if (vA) { const d = dia(1);
    put.push(Object.assign({ id: 'ex-av-1', kind: 'avaria', vessel: vA.id, date: isoD(d), hora: '14:20', at: +d + 14.3 * 36e5, quem: 'Comandante (exemplo)', meio: 'Autotrac', sis: SISTEMAS[0], pos: mcpPos(vA)[0], c: 'Alta', desc: 'Vazamento de óleo na junta do cárter do MCP, nível baixando entre os quartos (avisado por Comandante (exemplo), autotrac)', om: '' }, base)); }
  // 6) prestadores e treinamentos
  [['Diesel Norte (exemplo)', ['Calibração de bicos e bomba injetora', 'Retífica / overhaul de motor'], 5], ['Estaleiro Rio Negro (exemplo)', ['Estaleiro / docagem', 'Solda e caldeiraria'], 4], ['Elétrica Amazonas (exemplo)', ['Elétrica e alternadores'], 4], ['Hidráulica Manaus (exemplo)', ['Hidráulica (governo)', 'Reversores'], 3], ['Laboratório de Óleo (exemplo)', ['Análise de óleo (laboratório)'], 4], ['Ambiental Norte (exemplo)', ['Destinação de resíduos'], 5]]
    .forEach(([emp, sv, nota], i) => put.push(Object.assign({ id: 'ex-terc-' + i, kind: 'terc', empresa: emp, cnpj: '', cidade: 'Manaus/AM', contato: 'Responsável técnico', fone: '(92) 0000-000' + i, email: '', validade: isoD(addM(hoje(), 3 + i * 2)), servicos: sv, nota: String(nota), obs: 'Cadastro de exemplo' }, base)));
  [['CTF do CJA I (exemplo)', FUNCOES[0], 'recic', -2, 'Diário de Máquinas e comunicação de anomalias (NP 5.4 e 5.4.1)'], ['MFM do CJA I (exemplo)', FUNCOES[1], 'recic', -2, 'Diário de Máquinas e comunicação de anomalias (NP 5.4 e 5.4.1)'], ['CTF do CJA X (exemplo)', FUNCOES[0], 'posf', -1, 'Superaquecimento do MCP: leitura de temperatura e parada segura'], ['Operador de Medição (exemplo)', FUNCOES[4], 'integ', -5, 'FR 027_L no SMF: chegada e saída'], ['Líder de Operação (exemplo)', FUNCOES[3], 'integ', -5, 'FR 027_L no SMF: chegada e saída'], ['Analista de Manutenção (exemplo)', FUNCOES[6], 'recic', -11, 'SMF: registrar a execução e conferir OMs']]
    .forEach(([p, f, tipo, m, tema], i) => { const d = addM(hoje(), m), tt = TREIN_TIPOS.find(t => t[0] === tipo);
      put.push(Object.assign({ id: 'ex-trein-' + i, kind: 'trein', pessoa: p, funcao: f, tipo, data: isoD(d), horas: String(tt[3] || 2), tema, validade: tt[2] ? isoD(addM(d, tt[2])) : '', barco: '', ministrante: 'Supervisor de Manutenção', url: '' }, base)); });
  put.push(Object.assign({ id: 'ex-demo-v1', kind: 'marca' }, base));
  put.forEach(r => S.recs.set(r.id, r)); if (MEM) put.forEach(r => MEM.set(r.id, r)); else await DB.putMany(put);
  if (typeof render === 'function' && S.session) render();
}
// laudos anteriores de cada MCP: 3 por motor (~1.000 h e ~4 meses entre eles), para o gráfico de tendência
function exLaudoHist(R, base) { const out = [];
  const num = (s, f) => { const x = parseFloat(String(s).replace(',', '.')); return isNaN(x) ? s : f(x); }, fmt = (x, c) => c ? x.toFixed(c).replace('.', ',') : String(Math.round(x));
  recs('laudo').filter(l => l.seed && !/-a\d$/.test(l.id)).forEach((L, i) => { const ruim = L.vessel === (S.cfg.frota.find(v => v.nome === 'CJA II') || {}).id && L.pos === 'BB', meio = L.vessel === (S.cfg.frota.find(v => v.nome === 'CJA XX') || {}).id && L.pos === 'BB';
    for (let k = 1; k <= 3; k++) { const h = (+L.h || 0) - 1000 * k; if (h < 300) break; const f = ruim ? [1, .76, .57, .41][k] : 1, n = () => .85 + R() * .3, vv = L.vals || {};
      const vals = { fe: num(vv.fe, x => fmt(x * f * n())), cr: num(vv.cr, x => fmt(Math.max(1, x * f * n()))), al: num(vv.al, x => fmt(x * n())), cu: num(vv.cu, x => fmt(x * n())), pb: num(vv.pb, x => fmt(x * n())),
        si: num(vv.si, x => fmt(x * (ruim ? f : 1) * n())), na: num(vv.na, x => fmt(x * n())), agua: '0,05', comb: meio ? ['2,6', '1,6', '1,0', '0,8'][k] : '0,8',
        fuligem: num(vv.fuligem, x => fmt(Math.max(.3, x * (ruim ? f : 1) * n()), 1)), tbn: num(vv.tbn, x => fmt(Math.min(9.6, ruim ? x + 1.1 * k : x + (R() - .3) * .6), 1)), visc: num(vv.visc, x => fmt(ruim ? x + .3 * k : x + (R() - .5) * .4, 1)) };
      out.push(Object.assign({ id: L.id + '-a' + k, kind: 'laudo', vessel: L.vessel, pos: L.pos, date: isoD(addM(pD(L.date), -4 * k)), h: Math.round(h), hOleo: String(180 + Math.round(R() * 150)), lab: L.lab, num: (L.num || 'EX') + '-' + k, vals }, base)); } });
  return out; }
// roda uma vez depois do boot; também conserta aparelhos cujo exemplo antigo ficou sem laudos (o tecExemplo marcou tecV sem gerar)
(async () => { for (let i = 0; i < 120; i++) { if (typeof S !== 'undefined' && S.pronto) break; await new Promise(r => setTimeout(r, 500)); }
  await new Promise(r => setTimeout(r, 3000));
  try {
    const grava = async l => { if (!l.length) return; l.forEach(r => S.recs.set(r.id, r)); if (MEM) l.forEach(r => MEM.set(r.id, r)); else await DB.putMany(l); };
    if (temExemplo() && !recs('laudo').some(l => l.seed)) await grava(exemploLaudos(rnd(1405)));
    await exemploDemo();
    if (temExemplo() && !recs('laudo').some(l => l.seed && /-a\d$/.test(l.id))) { let sd = 2611; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280; await grava(exLaudoHist(R, { seed: true, createdAt: Date.now(), updatedAt: Date.now(), by: 'Supervisor (exemplo)' })); }
    if (typeof render === 'function' && S.session) render();
  } catch (e) { console.warn('exemploDemo', e); } })();
