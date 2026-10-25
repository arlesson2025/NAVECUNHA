/* ===== Balsas petroleiras: cadastro, plano preventivo (NP Navecunha 024), situação, cronograma e ficha técnica (25/10/2026) =====
   Frota própria, escolhida no topo do menu (FROTA_TIPO = 'bal'); não entra nas contas dos empurradores (S.cfg.frota).
   Registros com os tipos que o servidor já aceita: 'base' (serviço executado, pos 'UN', item B…), 'hor' (horímetro do motor-bomba, pos 'MB'),
   'doclim' (data-limite da vistoria em seco / CSN) e 'avaria' (falha comunicada, até ser resolvida pela OM do Sankhya).
   Regras aprovadas pelo Supervisor em 25/10/2026: MWM 6.10 TCA pelo manual de oficina MWM Série 10 (p. 3-9, estacionários: óleo e filtros a 250 h,
   filtro de ar a 500 h, revisão a 1.000 h; folga 0,20 mm a frio, p. 9-25) · Cummins Série C com óleo a 250 h ou 6 meses · D229-6 pela NP 024 8.2.2 ·
   luzes de navegação Crítica (NP 024 6.1) · escotilhas mensal · diário e semanal ficam no FR 027_A (não geram OM nem entram no cronograma). */
'use strict';
// cadastro: planilha de características principais (Supervisor, 25/10/2026) + capacidade e ano do ClickUp
// [nome, tanques, marca, modelo na planilha, potência hp, rpm, vazão da bomba m³/h, bateria motor/bomba, bateria alarme, tanque de consumo m³, cabeços (qtde), cabeços (t), boias, extintores, machados, capacidade, ano]
const BAL_CAD = [
  ['VDA I', 8, 'Cummins', 'Mecânico', 234, 2200, 200, '1 × 150 Ah', '1 × 150 Ah', '0,380', '12', '8 t', 6, 10, 1, 2433, 2003],
  ['VDA II', 8, 'Cummins', 'Mecânico', 234, 2200, 200, '1 × 150 Ah', '1 × 150 Ah', '0,500', '12', '16 t', 6, 10, 1, 2436.88, 2003],
  ['VDA III', 8, 'Cummins', 'Mecânico', 234, 2200, 250, '1 × 150 Ah', '1 × 150 Ah', '0,510', '12', '16 t', 6, 10, 1, 2618, 2004],
  ['VDA IV', 8, 'MWM', '6.10 TCA', 212, 2500, 250, '1 × 150 Ah', '1 × 150 Ah', '0,500', '14', '16 t', 6, 10, 1, 2853.7, 2005],
  ['VDA V', 8, 'Cummins', 'Mecânico', 234, 2200, 250, '1 × 150 Ah', '1 × 150 Ah', '0,580', '14', '16 t', 6, 10, 1, 2847.28, 2005],
  ['VDA VI', 8, 'Cummins', 'Mecânico', 234, 2200, 500, '1 × 150 Ah', '1 × 150 Ah', '0,450', '11', '8 t', 6, 10, 1, 2853.51, 2007],
  ['VDA VII', 6, 'MWM', '6.10 TCA', 88.5, 1800, 300, '1 × 150 Ah', '1 × 150 Ah', '0,470', '13', '16 t', 6, 8, 1, 1169.97, 2007],
  ['VDA VIII', 6, 'MWM', '6.10 TCA', 88.5, 1800, 300, '1 × 150 Ah', '1 × 150 Ah', '0,470', '9', '16 t', 8, 8, 1, 1169.97, 2007],
  ['VDA IX', 8, 'MWM', '6.10 TCA', 234, 2200, 250, '1 × 150 Ah', '1 × 150 Ah', '0,580', '13', '16 t', 8, 8, 1, 3215, 2007],
  ['VDA X', 6, 'MWM', '6.10 TCA', 108.6, 2500, 300, '1 × 150 Ah', '1 × 150 Ah', '0,257', '9', '16 t', 8, 8, 1, 1169.96, 2009],
  ['VDA XI', 8, 'MWM', '6.10 TCA', 234, 2200, 550, '1 × 150 Ah', '1 × 150 Ah', '0,518', '12', '16 t', 8, 10, 1, 3424, 2009],
  ['VDA XII', 8, 'Cummins', 'Mecânico', 234, 2200, 650, '1 × 150 Ah', '1 × 150 Ah', '0,427', '12', '9 t', 8, 10, 1, 3410.81, 2009],
  ['VDA XIII', 10, 'MWM', '6.10 TCA', 212, 1780, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '8', '4 de 8 t e 4 de 12 t', 6, 12, 2, 4604.46, 2018],
  ['VDA XIV', 8, 'MWM', '6.10 TCA', 215, 2200, 600, '2 × 150 Ah', '1 × 60 Ah', '0,300', '14', '5 t', 6, 10, 2, 4052.04, 2015],
  ['VDA XV', 10, 'Cummins', 'Mecânico', 234, 2200, null, '', '', '', '', '', null, null, null, 4150.48, 2011],
  ['VDA XVI', 8, 'MWM', '6.10 TCA', 212, 1780, 600, '1 × 150 Ah', '1 × 60 Ah', '0,300', '14', '5 t', 6, 10, 2, 4052.04, 2015],
  ['VDA XVII', 8, 'Cummins', 'Mecânico', 215, 2200, 600, '2 × 150 Ah', '2 × 60 Ah', '0,300', '11', '5 t', 6, 10, 2, 3210, 2012],
  ['VDA XVIII', 8, 'MWM', '6.10 TCA', 212, 1780, 600, '1 × 150 Ah', '1 × 60 Ah', '0,300', '14', '5 t', 6, 10, 2, 4052.04, 2015],
  ['VDA XIX', 8, 'MWM', '6 CTA 8.3', 215, 2200, 600, '2 × 150 Ah', '1 × 60 Ah', '0,300', '14', '5 t', 6, 10, 2, 4052.04, 2015],
  ['VDA XX', 10, 'MWM', '6.10 TCA', 212, 1780, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '8', '8 t', 6, 12, 2, 4604.46, 2019],
  ['VDA XXI', 8, 'MWM', '6 CTA 8.3', 215, 2200, 600, '2 × 150 Ah', '1 × 60 Ah', '0,300', '12', '5 t', 6, 10, 2, 4052.04, 2015],
  ['VDA XXII', 8, 'MWM', '6.10 TAC', 212, 2500, 600, '1 × 150 Ah', '1 × 60 Ah', '0,300', '12', '5 t', 8, 10, 2, 4108, 2015],
  ['VDA XXIII', 8, 'MWM', '6.10 TCA', 212, 1780, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '4', '8 t', 6, 10, 2, 3315.8, 2020],
  ['VDA XXIV', 8, 'MWM', '6.10 TCA', 212, 1780, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '12', '4 de 8 t e 8 de 12 t', 6, 10, 2, 3315.8, 2020],
  ['VDA XXV', 8, 'MWM', '6.10 TCA', 212, 1780, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '11', '4 de 8 t e 7 de 12 t', 6, 10, 2, 3315.8, 2020],
  ['VDA XXVI', 8, 'MWM', '6.10 TCA', 212, 2500, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '11', '4 de 8 t e 7 de 12 t', 6, 10, 2, 3315.8, 2020],
  ['VDA XXVII', 8, 'MWM', '6.10 TCA', 212, 2500, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '12', '4 de 8 t e 8 de 12 t', 6, 10, 2, 3315.8, 2020],
  ['VDA XXVIII', 8, 'MWM', '6.10 TCA', 212, 2500, 835, '1 × 150 Ah', '1 × 60 Ah', '0,300', '4', '12 t', 6, 10, 2, 4000, null],
  ['VDA XXIX', 10, 'MWM', '6.10 TCA', 212, null, 835, '1 × 150 Ah', '', '0,664', '18', '5 t', 8, 12, 2, 4694, 2022]];
// motor adotado no plano (decisão de 25/10/2026, pela potência e pelo nome do modelo):
// VII, VIII e X = MWM D229-6 (88,5 e 108,6 HP não são de 6.10 TCA) · XIX e XXI = Cummins 6CTA 8.3 (designação Cummins) · XXII = 6.10 TCA (“6.10 TAC” é erro de digitação)
const BAL_MOTOR = { m610: 'MWM 6.10 TCA', cum: 'Cummins Série C (6CTA 8.3)', m229: 'MWM D229-6' };
const BAL_NOTA = { 'VDA VII': 'Planilha diz 6.10 TCA, mas 88,5 HP é potência do D229-6: plano do D229-6 até conferir a placa.', 'VDA VIII': 'Planilha diz 6.10 TCA, mas 88,5 HP é potência do D229-6: plano do D229-6 até conferir a placa.',
  'VDA X': 'Planilha diz 6.10 TCA, mas 108,6 HP é potência do D229-6: plano do D229-6 até conferir a placa.', 'VDA XIX': 'Planilha diz MWM 6 CTA 8.3; 6CTA 8.3 é modelo Cummins: plano do Cummins Série C até conferir a placa.',
  'VDA XXI': 'Planilha diz MWM 6 CTA 8.3; 6CTA 8.3 é modelo Cummins: plano do Cummins Série C até conferir a placa.', 'VDA XXII': 'Planilha diz “6.10 TAC”: erro de digitação de 6.10 TCA.',
  'VDA IX': 'Planilha diz MWM 6.10 TCA com 234 HP a 2.200 rpm (os números dos Cummins da frota): conferir a placa.', 'VDA XV': 'Planilha sem dados de bomba, baterias, tanque, cabeços, boias e extintores.', 'VDA XXIX': 'Planilha sem rotação e sem bateria do alarme de nível.', 'VDA XXVIII': 'Sem ano de construção no ClickUp.' };
const BALSAS = BAL_CAD.map((c, i) => { const n = c[0], mot = ['VDA VII', 'VDA VIII', 'VDA X'].includes(n) ? 'm229' : c[2] === 'Cummins' || /CTA 8\.3/.test(c[3]) ? 'cum' : 'm610';
  return { id: 'bal' + (i + 1), nome: n, tanques: c[1], marca: c[2], modelo: c[3], hp: c[4], rpm: c[5], vazao: c[6], batM: c[7], batA: c[8], tqCons: c[9], cabQ: c[10], cabT: c[11], boias: c[12], ext: c[13], mach: c[14], cap: c[15], ano: c[16], mot, nota: BAL_NOTA[n] || '' }; });
const balsaDe = id => BALSAS.find(b => b.id === id) || null;
// plano preventivo das balsas (NP 024 itens 7 e 8, com as correções aprovadas): h = horas do motor-bomba · m = meses · doca = vence com a docagem (CSN)
const BA1 = [
  { id: 'B1.1', eq: 'Bomba centrífuga', m: 1, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Lubrificação dos mancais (SAE 20 ou 30, sem aditivo HD), inspeção dos acoplamentos (alinhamento ≤ 0,05 mm) e teste da bomba reserva', ref: 'NP 024 8.2.1' },
  { id: 'B1.2', eq: 'Bomba centrífuga', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Troca do óleo dos mancais, inspeção dos retentores, folga dos mancais e reaperto geral', ref: 'NP 024 8.2.1' },
  { id: 'B1.3', eq: 'Bomba centrífuga', m: 12, prio: 'Crítica', exec: 'Equipe de manutenção ou terceiro', serv: 'Limpeza dos mancais e rolamentos, carcaça, troca da gaxeta, rotor e difusores, câmara de resfriamento e realinhamento bomba e motor', ref: 'NP 024 8.2.1' },
  { id: 'B2.1', eq: 'Motor MWM 6.10 TCA', mot: 'm610', h: 250, m: 6, prio: 'Crítica', exec: 'CTF / MFM', serv: 'Troca do óleo (SAE 15W-40 API CI-4), do filtro de óleo e do filtro de combustível', ref: 'Manual MWM Série 10 p. 3-9 · FR 049_A' },
  { id: 'B2.2', eq: 'Motor MWM 6.10 TCA', mot: 'm610', h: 500, prio: 'Alta', exec: 'CTF / MFM', serv: 'Troca do filtro de ar', ref: 'Manual MWM Série 10 p. 3-9' },
  { id: 'B2.3', eq: 'Motor MWM 6.10 TCA', mot: 'm610', h: 1000, m: 12, prio: 'Crítica', exec: 'Equipe de manutenção ou terceiro', serv: 'Folga de válvulas (0,20 mm a frio), damper, teste e limpeza dos bicos, teste da bomba injetora, troca da correia e do líquido de arrefecimento, limpeza do tanque de combustível', ref: 'Manual MWM Série 10 p. 3-9 e 9-25' },
  { id: 'B3.1', eq: 'Motor Cummins Série C', mot: 'cum', h: 250, m: 6, prio: 'Crítica', exec: 'CTF / MFM', serv: 'Troca do óleo (SAE 15W-40 API CI-4) e do filtro de óleo (Fleetguard LF3000; conferir na peça)', ref: 'NP 024 8.2.3 (intervalo corrigido) · FR 049_A' },
  { id: 'B3.2', eq: 'Motor Cummins Série C', mot: 'cum', h: 500, prio: 'Alta', exec: 'CTF / MFM', serv: 'Troca do filtro de combustível e do filtro de ar, drenagem do sistema de combustível e inspeção do damper', ref: 'NP 024 8.2.3' },
  { id: 'B3.3', eq: 'Motor Cummins Série C', mot: 'cum', h: 1000, prio: 'Crítica', exec: 'Equipe de manutenção ou terceiro', serv: 'Válvulas (admissão 0,30 mm, escape 0,61 mm), bicos, bomba injetora, turbo, restrição de admissão, contrapressão de escape e blow-by', ref: 'NP 024 8.2.3' },
  { id: 'B3.4', eq: 'Motor Cummins Série C', mot: 'cum', h: 2000, m: 12, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Troca do líquido de arrefecimento, termostatos, bomba d’água, mangueiras e cubo do ventilador', ref: 'NP 024 8.2.3' },
  { id: 'B3.5', eq: 'Motor Cummins Série C', mot: 'cum', h: 6000, m: 24, prio: 'Crítica', exec: 'Terceiro (assistência autorizada)', serv: 'Revisão do arrefecimento, recondicionamento do cabeçote, protrusão e ovalização das camisas e reaperto estrutural', ref: 'NP 024 8.2.3' },
  { id: 'B4.1', eq: 'Motor MWM D229-6', mot: 'm229', h: 500, m: 6, prio: 'Crítica', exec: 'CTF / MFM', serv: 'Troca do óleo (SAE 15W-40), dos filtros de óleo, de ar e de combustível e inspeção do damper (confirmar no manual do D229-6)', ref: 'NP 024 8.2.2 · FR 049_A' },
  { id: 'B4.2', eq: 'Motor MWM D229-6', mot: 'm229', h: 1000, m: 12, prio: 'Crítica', exec: 'Equipe de manutenção ou terceiro', serv: 'Folga de válvulas (0,20 a 0,40 mm a frio), bicos, bomba injetora, correia e líquido de arrefecimento', ref: 'NP 024 8.2.2' },
  { id: 'B5.1', eq: 'Válvulas de gaveta', m: 1, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Lubrificação da rosca da haste, teste de abertura e fechamento total e inspeção de vazamento no castelo', ref: 'NP 024 8.2.4' },
  { id: 'B5.2', eq: 'Válvulas de gaveta', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Limpeza da haste e teste de vedação da sede (fluxo zero)', ref: 'NP 024 8.2.4' },
  { id: 'B5.3', eq: 'Válvulas de gaveta', m: 12, prio: 'Alta', exec: 'Equipe de manutenção', serv: 'Troca das gaxetas, inspeção de flanges, estojos e porcas e retoque da pintura', ref: 'NP 024 8.2.4' },
  { id: 'B5.4', eq: 'Válvulas de gaveta', doca: true, prio: 'Crítica', exec: 'Terceiro (estaleiro)', serv: 'Revisão geral: desmontagem, inspeção da cunha e das guias, lapidação das sedes (API 598)', ref: 'NP 024 8.2.4' },
  { id: 'B6.1', eq: 'PSV e válvula de alívio', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Limpeza da tela corta-chamas da PSV', ref: 'NP 024 7.0' },
  { id: 'B6.2', eq: 'PSV e válvula de alívio', m: 12, prio: 'Crítica', exec: 'Terceiro (calibração)', serv: 'Calibração de pressão e vácuo da PSV e da válvula de alívio da linha nos set-points de projeto', ref: 'NP 024 8.2.5' },
  { id: 'B6.3', eq: 'PSV e válvula de alívio', doca: true, prio: 'Crítica', exec: 'Terceiro (certificadora)', serv: 'Revisão geral e recertificação por entidade certificadora', ref: 'NP 024 8.2.5' },
  { id: 'B7.1', eq: 'Luzes de navegação', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Limpeza das lentes, funcionamento 100% (bombordo, boreste, fundeio, mastro, carga e descarga) e inspeção elétrica', ref: 'NP 024 8.2.6' },
  { id: 'B8.1', eq: 'Alarme de nível alto', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Inspeção elétrica, teste do alarme sonoro e visual, boia de medição e tanque', ref: 'NP 024 8.2.7' },
  { id: 'B9.1', eq: 'Baterias', m: 6, prio: 'Alta', exec: 'Equipe de manutenção', serv: 'Indicador de carga, cabos e terminais, caixa de madeira e manta de proteção', ref: 'NP 024 8.2.9' },
  { id: 'B10.1', eq: 'Casco', doca: true, prio: 'Crítica', exec: 'Terceiro (estaleiro)', serv: 'Docagem: inspeção de fundo, espessura de chapa, limpeza e desgaseificação', ref: 'NP 024 7.0' },
  { id: 'B11.1', eq: 'Escotilhas', m: 1, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Borrachas de vedação e atracadores das escotilhas (estanqueidade)', ref: 'NP 024 8.2.8' }];
const BA1M = Object.fromEntries(BA1.map(t => [t.id, t]));
const BAL_DOCA_M = 60;   // docagem sem certificado lançado: 5 anos depois da última (critério interno; a data-limite do CSN, quando lançada, manda)
const BAL_PROX_H = 50, BAL_PROX_D = 30;   // “vence em breve”
const balItens = b => BA1.filter(t => !t.mot || t.mot === b.mot);
const balIv = t => t.doca ? { h: null, m: BAL_DOCA_M } : { h: t.h || null, m: t.m || null };
function balHor(vid) { let b = null; recs('hor').forEach(r => { if (r.vessel === vid && r.pos === 'MB' && !r.excluido && (!b || r.date > b.date || (r.date === b.date && r.h > b.h))) b = r; }); return b; }
function balUlt(vid, item) { let b = null; recs('base').forEach(r => { if (r.vessel === vid && r.item === item && !r.excluido && r.date && (!b || r.date > b.date)) b = r; }); return b; }
function balTaxa(vid) {   // h/dia do motor-bomba pelas leituras dos últimos 180 dias
  const L = recs('hor').filter(r => r.vessel === vid && r.pos === 'MB' && !r.excluido).sort((a, b) => a.date < b.date ? -1 : 1); if (L.length < 2) return null;
  const u = L[L.length - 1], a = L.find(r => pD(r.date) >= addM(pD(u.date), -6)) || L[0], d = (pD(u.date) - pD(a.date)) / 864e5; return d >= 7 && u.h > a.h ? (u.h - a.h) / d : null; }
function balCsn(vid) { let b = null; recs('doclim').forEach(r => { if (r.vessel === vid && !r.excluido && (!b || (r.updatedAt || 0) > (b.updatedAt || 0))) b = r; }); return b; }
// situação de um item: venc | prox | ok | sem
function balSit(b, t) {
  const L = balUlt(b.id, t.id), hr = balHor(b.id), cur = hr ? hr.h : null, iv = balIv(t), dHoje = pD(isoD(hoje()));
  const csn = t.doca ? balCsn(b.id) : null;
  if (!L && !(csn && csn.date)) return { st: 'sem', txt: 'Sem último serviço registrado', cur };
  let st = 'ok', alvoD = null, alvoH = null, rest = null; const txt = [], ord = { ok: 0, prox: 1, venc: 2 }, up = s => { if (ord[s] > ord[st]) st = s; };
  if (iv.h && L && L.h != null && L.h !== '' && cur != null) { alvoH = +L.h + iv.h; rest = alvoH - cur; txt.push(rest < 0 ? nf(-rest) + ' h vencido' : 'faltam ' + nf(rest) + ' h'); up(rest < 0 ? 'venc' : rest <= BAL_PROX_H ? 'prox' : 'ok'); }
  else if (iv.h) txt.push(cur == null ? 'sem horímetro' : 'sem horímetro no último serviço');
  if (iv.m) { alvoD = csn && csn.date ? pD(csn.date) : L ? addM(pD(L.date), iv.m) : null;   // docagem: a data-limite do CSN manda
    if (alvoD) { const dd = Math.round((alvoD - dHoje) / 864e5); txt.push(dd < 0 ? (-dd) + (dd === -1 ? ' dia vencido' : ' dias vencido') : 'vence ' + brD(isoD(alvoD))); up(dd < 0 ? 'venc' : dd <= BAL_PROX_D ? 'prox' : 'ok'); } }
  return { st, txt: txt.join(' · '), alvoD, alvoH, rest, cur, L };
}
const balAvarias = vid => recs('avaria').filter(r => r.vessel === vid && !r.excluido && !r.fim);
// situação da balsa para operar: bloqueada = item Crítico vencido ou falha Crítica aberta (NP 024 6.1) · com restrição = algum vencido ou falha Alta · sem histórico = nenhum serviço registrado
function balEstado(b) {
  const P = balItens(b).map(t => ({ t, s: balSit(b, t) })), A = balAvarias(b.id), venc = P.filter(x => x.s.st === 'venc'), crit = venc.filter(x => x.t.prio === 'Crítica');
  const st = crit.length || A.some(a => a.c === 'Crítica') ? 'bloq' : venc.length || A.some(a => a.c === 'Alta') ? 'rest' : P.every(x => x.s.st === 'sem') ? 'sem' : 'lib';
  return { b, P, A, venc, crit, prox: P.filter(x => x.s.st === 'prox'), sem: P.filter(x => x.s.st === 'sem'), st };
}
const BAL_ST = { bloq: ['p-bad', 'Bloqueada'], rest: ['p-warn', 'Com restrição'], lib: ['p-ok', 'Liberada'], sem: ['p-mut', 'Sem histórico'] };
const BAL_SIT = { venc: ['p-bad', 'Vencido'], prox: ['p-warn', 'Vence em breve'], ok: ['p-ok', 'Em dia'], sem: ['p-mut', 'Sem histórico'] };
const balPil = (M, k) => `<span class="pill ${M[k][0]}">${M[k][1]}</span>`;
const balIvTx = t => t.doca ? 'na docagem (CSN)' : [t.h ? nf(t.h) + ' h' : '', t.m ? (t.m === 1 ? 'mensal' : t.m === 6 ? 'semestral' : t.m === 12 ? 'anual' : t.m + ' meses') : ''].filter(Boolean).join(' ou ');
const balMotTx = b => `${BAL_MOTOR[b.mot]}`;
// ---------- telas ----------
const BAL_VIEWS = [['bal', 'Situação das balsas'], ['balcr', 'Cronograma'], ['balpl', 'Plano preventivo'], ['balft', 'Ficha técnica']];
const balCab = (tit, sub, bt) => `<div class="vh"><div><h1>${esc(tit)}<span class="np-tag">NP 024</span></h1><p>${sub}</p></div><span class="sp"></span>${bt || ''}</div>`;
const BALF = { f: 'todas', q: '' };
function vBal() {
  const E = BALSAS.map(balEstado), cnt = k => E.filter(e => e.st === k).length;
  const F = E.filter(e => BALF.f === 'todas' || e.st === BALF.f).sort((a, b) => ({ bloq: 0, rest: 1, lib: 2, sem: 3 })[a.st] - ({ bloq: 0, rest: 1, lib: 2, sem: 3 })[b.st] || b.venc.length - a.venc.length);
  const prox = e => { const L = e.P.filter(x => x.s.alvoD || x.s.rest != null).sort((a, b) => (a.s.st === 'venc' ? 0 : 1) - (b.s.st === 'venc' ? 0 : 1) || ((a.s.alvoD || Infinity) - (b.s.alvoD || Infinity))); const x = L[0]; return x ? `${esc(x.t.eq)}: ${esc(x.s.txt)}` : '—'; };
  const lin = e => { const b = e.b, hr = balHor(b.id); return `<tr class="click" data-balft="${b.id}"><td><b>${esc(b.nome)}</b><div class="note">${esc(balMotTx(b))}</div></td><td class="r">${hr ? nf(hr.h) + ' h<div class="note">' + brD(hr.date) + '</div>' : '<span class="mut">—</span>'}</td>
    <td>${balPil(BAL_ST, e.st)}</td><td class="r">${e.venc.length ? `<b class="rl-ruim">${e.venc.length}</b>` : '0'}${e.crit.length ? `<div class="note">${e.crit.length} crítico${e.crit.length === 1 ? '' : 's'}</div>` : ''}</td><td class="r">${e.prox.length}</td><td>${e.A.length ? `<span class="pill p-bad">${e.A.length} falha${e.A.length === 1 ? '' : 's'}</span>` : '—'}</td><td>${prox(e)}</td>
    <td class="nowrap"><button class="mbtn sm pri" data-balexe="${b.id}">Registrar execução</button> <button class="mbtn sm" data-balhor="${b.id}">Horímetro</button></td></tr>`; };
  const agora = E.flatMap(e => [...(e.crit.length ? [{ p: 1, b: e.b, tx: `${e.crit.length} serviço${e.crit.length === 1 ? '' : 's'} crítico${e.crit.length === 1 ? '' : 's'} vencido${e.crit.length === 1 ? '' : 's'}: ${[...new Set(e.crit.map(x => x.t.eq))].join(', ')}` }] : []),
    ...(e.venc.length > e.crit.length ? [{ p: 2, b: e.b, tx: `${e.venc.length - e.crit.length} outro${e.venc.length - e.crit.length === 1 ? '' : 's'} vencido${e.venc.length - e.crit.length === 1 ? '' : 's'}: ${[...new Set(e.venc.filter(x => x.t.prio !== 'Crítica').map(x => x.t.eq))].join(', ')}` }] : []),
    ...e.A.map(a => ({ p: a.c === 'Crítica' ? 1 : 2, b: e.b, tx: `Falha ${a.c}: ${a.desc}${a.om ? ' · OM ' + a.om : ' · sem OM no Sankhya'}` }))]).sort((a, b) => a.p - b.p);
  return balCab('Situação das balsas', `${BALSAS.length} balsas petroleiras · vencido, em breve e em dia pelo plano da NP 024 · bloqueada = serviço Crítico vencido ou falha Crítica aberta`, `<button class="mbtn" data-balfalha="">⚠ Registrar falha</button>`)
   + `<div class="cm-chips">${[['todas', 'Todas', E.length], ['bloq', 'Bloqueadas', cnt('bloq')], ['rest', 'Com restrição', cnt('rest')], ['lib', 'Liberadas', cnt('lib')], ['sem', 'Sem histórico', cnt('sem')]].map(([k, t, n]) => `<button class="cm-chip${BALF.f === k ? ' on' : ''}" data-balf="${k}">${t} <b>${n}</b></button>`).join('')}</div>
   ${agora.length ? `<div class="card"><h2>O que precisa de você agora · ${agora.length}</h2><ul class="bal-ag">${agora.slice(0, 12).map(a => `<li><span class="pill ${a.p === 1 ? 'p-bad' : 'p-warn'}">P${a.p}</span> <a href="#balft/${a.b.id}"><b>${esc(a.b.nome)}</b></a> · ${esc(a.tx)}</li>`).join('')}</ul>${agora.length > 12 ? `<p class="note">Mais ${agora.length - 12} nas fichas das balsas.</p>` : ''}</div>` : ''}
   <div class="card"><h2>Balsas</h2><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th class="r">Horímetro do motor-bomba</th><th>Para operar</th><th class="r">Vencidos</th><th class="r">Em breve</th><th>Falhas</th><th>Próximo serviço</th><th></th></tr></thead><tbody>${F.map(lin).join('') || '<tr><td colspan="8" class="mut">Nenhuma balsa neste filtro.</td></tr>'}</tbody></table></div>
   <p class="note">Em breve = até ${BAL_PROX_H} h ou ${BAL_PROX_D} dias. O check-list diário e semanal (NP 024 5.4 e 5.5, FR 027_A) não entra aqui: só os serviços com intervalo do plano. Clique na balsa para ver a ficha.</p></div>`;
}
// cronograma do ano: previsto pela data (e pelas horas no ritmo medido do motor-bomba) × realizado (serviços registrados)
const BALCR = { ano: hoje().getFullYear() };
function balPrevAno(b, y) {   // nº de serviços previstos por mês no ano y
  const P = Array(12).fill(0), ini = new Date(y, 0, 1), fim = new Date(y + 1, 0, 1), tx = balTaxa(b.id), hr = balHor(b.id);
  balItens(b).forEach(t => { const L = balUlt(b.id, t.id), iv = balIv(t), s = balSit(b, t); if (s.st === 'sem') return;
    let d = s.alvoD ? new Date(s.alvoD) : null;
    if (iv.h && s.rest != null && tx && hr) { const dh = new Date(pD(hr.date).getTime() + s.rest / tx * 864e5); if (!d || dh < d) d = dh; }
    if (d && d < hoje()) d = new Date(hoje());   // vencido agora conta no mês atual
    let n = 0; while (d && d < fim && n++ < 60) { if (d >= ini) P[d.getMonth()]++; const passo = iv.m ? addM(d, iv.m) : null, ph = iv.h && tx ? new Date(d.getTime() + iv.h / tx * 864e5) : null; d = passo && ph ? (passo < ph ? passo : ph) : passo || ph; } });
  return P; }
function balRealAno(b, y) { const R = Array(12).fill(0); recs('base').forEach(r => { if (r.vessel === b.id && !r.excluido && BA1M[r.item] && r.date && +r.date.slice(0, 4) === y) R[+r.date.slice(5, 7) - 1]++; }); return R; }
function vBalCr() {
  const y = BALCR.ano, hm = hoje().getFullYear() === y ? hoje().getMonth() : y < hoje().getFullYear() ? 12 : -1;
  const D = BALSAS.map(b => ({ b, P: balPrevAno(b, y), R: balRealAno(b, y), venc: balEstado(b).venc.length })), T = i => D.reduce((a, d) => a + d.P[i], 0), TR = i => D.reduce((a, d) => a + d.R[i], 0);
  const cel = (d, i) => { const p = d.P[i], r = d.R[i]; if (!p && !r) return `<td class="c mut">·</td>`;   // mês que passou: só o realizado (o previsto do passado não é reconstruído)
    if (i < hm) return `<td class="c" title="${r} serviço${r === 1 ? '' : 's'} registrado${r === 1 ? '' : 's'}"><b class="rl-ok">${r}</b></td>`;
    return `<td class="c${i === hm ? ' bal-mes' : ''}" title="${p} previsto${p === 1 ? '' : 's'} · ${r} realizado${r === 1 ? '' : 's'}"><b>${r}</b><span class="mut">/${p}</span></td>`; };
  return balCab('Cronograma das balsas', 'Meses que passaram: serviços registrados · mês atual em diante: realizado / previsto, pela data do último serviço e pelas horas no ritmo medido do motor-bomba · vencido agora conta no mês atual',
    `<div class="seg">${[y - 1, y, y + 1].map(a => `<button data-balano="${a}" class="${a === y ? 'on' : ''}">${a}</button>`).join('')}</div>`)
   + `<div class="card"><div class="tw"><table class="t bal-cr"><thead><tr><th>Balsa</th>${MESES.map((m, i) => `<th class="c${i === hm ? ' bal-mes' : ''}">${m}</th>`).join('')}<th class="r">Vencido agora</th></tr></thead><tbody>
   ${D.map(d => `<tr class="click" data-balft="${d.b.id}"><td><b>${esc(d.b.nome)}</b></td>${MESES.map((m, i) => cel(d, i)).join('')}<td class="r">${d.venc ? `<b class="rl-ruim">${d.venc}</b>` : '0'}</td></tr>`).join('')}
   <tr class="bal-tot"><td><b>Frota de balsas</b></td>${MESES.map((m, i) => i < hm ? `<td class="c"><b>${TR(i)}</b></td>` : `<td class="c"><b>${TR(i)}</b><span class="mut">/${T(i)}</span></td>`).join('')}<td class="r"><b>${D.reduce((a, d) => a + d.venc, 0)}</b></td></tr></tbody></table></div>
   <p class="note">Sem horímetro com 2 leituras (7 dias ou mais de intervalo) o serviço por horas só entra pelo prazo em meses, quando tem. Item sem histórico não entra no previsto: registre o último serviço na ficha da balsa.</p></div>`;
}
function vBalPl() {
  const G = [...new Set(BA1.map(t => t.eq))], n = mot => BALSAS.filter(b => !mot || b.mot === mot).length;
  return balCab('Plano preventivo das balsas', 'NP Navecunha 024 itens 7 e 8, com as correções aprovadas em 25/10/2026 · o diário e o semanal ficam no FR 027_A e na rotina da tripulação · extintores e salvatagem com o SESMT (FR 022_C)')
   + G.map(g => { const L = BA1.filter(t => t.eq === g), mot = L[0].mot; return `<div class="card"><h2>${esc(g)} <span class="note">${n(mot)} balsa${n(mot) === 1 ? '' : 's'}${mot ? ': ' + BALSAS.filter(b => b.mot === mot).map(b => esc(b.nome.replace('VDA ', ''))).join(', ') : ''}</span></h2>
     <div class="tw"><table class="t"><thead><tr><th>Item</th><th>Serviço</th><th>Intervalo</th><th>Criticidade</th><th>Quem executa</th><th>Referência</th></tr></thead><tbody>${L.map(t => `<tr><td class="nowrap"><b>${t.id}</b></td><td>${esc(t.serv)}</td><td class="nowrap">${balIvTx(t)}</td><td><span class="pill ${t.prio === 'Crítica' ? 'p-bad' : 'p-warn'}">${t.prio}</span></td><td>${esc(t.exec)}</td><td class="note">${esc(t.ref)}</td></tr>`).join('')}</tbody></table></div></div>`; }).join('')
   + `<div class="card"><h2>Fontes e decisões</h2><ul class="bal-ag"><li><b>MWM 6.10 TCA:</b> manual de oficina MWM Série 10, tabela dos motores estacionários (p. 3-9): óleo e filtros a 250 h, filtro de ar a 500 h, revisão a 1.000 h, óleo no máximo a cada 6 meses; folga de válvulas 0,20 mm a frio (p. 9-25). A NP 024 dizia 500 h.</li>
     <li><b>Cummins Série C:</b> óleo a 250 h ou 6 meses (fontes secundárias; a NP dizia 500 h); filtro LF3000 pelo catálogo Cummins do 6CTA 8.3 (a NP dizia LF3349, do Série B).</li><li><b>MWM D229-6:</b> NP 024 8.2.2, a confirmar no manual do motor.</li>
     <li><b>Docagem:</b> vale a data-limite do CSN lançada na ficha; sem ela, ${BAL_DOCA_M / 12} anos depois da última docagem (critério interno). Revisão das válvulas de gaveta e recertificação da PSV vão junto.</li><li><b>Criticidade:</b> NP 024 6.1 (luzes de navegação Crítica, decisão do Supervisor).</li></ul></div>`;
}
function vBalFt() {
  const b = balsaDe(ARG);
  if (!b) return balCab('Ficha técnica das balsas', 'Planilha de características principais · clique numa balsa para ver o plano, o histórico e registrar')
   + `<div class="card"><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th class="r">Ano</th><th class="r">Capacidade</th><th class="r">Tanques</th><th>Motor (planilha)</th><th>Plano adotado</th><th class="r">Potência</th><th class="r">Rotação</th><th class="r">Bomba</th><th>Baterias (motor · alarme)</th><th class="r">Tanque de consumo</th><th>Cabeços</th><th class="r">Boias</th><th class="r">Extintores</th><th class="r">Machados</th></tr></thead><tbody>
     ${BALSAS.map(b => `<tr class="click" data-balft="${b.id}"><td><b>${esc(b.nome)}</b>${b.nota ? ' <span class="pill p-warn" title="' + esc(b.nota) + '">conferir</span>' : ''}</td><td class="r">${b.ano || '—'}</td><td class="r">${nf(b.cap, 2)}</td><td class="r">${b.tanques}</td><td>${esc(b.marca + ' ' + b.modelo)}</td><td>${esc(BAL_MOTOR[b.mot])}</td><td class="r">${b.hp ? nf(b.hp, 1).replace(',0', '') + ' HP' : '—'}</td><td class="r">${b.rpm ? nf(b.rpm) : '—'}</td><td class="r">${b.vazao ? b.vazao + ' m³/h' : '—'}</td><td>${esc([b.batM, b.batA].filter(Boolean).join(' · ') || '—')}</td><td class="r">${b.tqCons ? b.tqCons + ' m³' : '—'}</td><td>${b.cabQ ? esc(b.cabQ + ' · ' + b.cabT) : '—'}</td><td class="r">${b.boias ?? '—'}</td><td class="r">${b.ext ?? '—'}</td><td class="r">${b.mach ?? '—'}</td></tr>`).join('')}</tbody></table></div>
     <p class="note">“Conferir” = dado da planilha que não fecha (passe o mouse). Capacidade e ano vêm do ClickUp; a unidade da capacidade não está na lista.</p></div>`;
  const e = balEstado(b), hr = balHor(b.id), csn = balCsn(b.id), tx = balTaxa(b.id);
  const H = [...recs('base').filter(r => r.vessel === b.id && !r.excluido && BA1M[r.item]).map(r => ({ d: r.date, tx: `${r.item} ${BA1M[r.item].eq}: executado${r.h != null && r.h !== '' ? ' com ' + nf(r.h) + ' h' : ''}${r.om ? ' · OM ' + r.om : ''}${r.quem ? ' · ' + r.quem : ''}${r.obs ? ' · ' + r.obs : ''}`, by: r.by })),
    ...recs('hor').filter(r => r.vessel === b.id && r.pos === 'MB' && !r.excluido).map(r => ({ d: r.date, tx: `Horímetro do motor-bomba: ${nf(r.h)} h`, by: r.by })),
    ...recs('avaria').filter(r => r.vessel === b.id && !r.excluido).map(r => ({ d: r.date, tx: `Falha ${r.c}: ${r.desc}${r.om ? ' · OM ' + r.om : ''}${r.fim ? ' · resolvida em ' + brD(isoD(new Date(r.fim.at))) : ''}`, by: r.by }))].sort((a, b) => a.d < b.d ? 1 : -1);
  const dado = (k, v) => `<div><span class="note">${k}</span><b>${v}</b></div>`;
  return balCab(b.nome, `${esc(balMotTx(b))} · ${b.tanques} tanques · ficha técnica, plano e histórico`, `<a class="mbtn" href="#balft">← Todas</a><button class="mbtn" data-balhor="${b.id}">Horímetro</button><button class="mbtn" data-balfalha="${b.id}">⚠ Registrar falha</button><button class="mbtn" data-balcsn="${b.id}">Data-limite do CSN</button><button class="mbtn pri" data-balexe="${b.id}">Registrar execução</button>`)
   + `<div class="card"><div class="bal-dados">${dado('Para operar', balPil(BAL_ST, e.st))}${dado('Horímetro', hr ? nf(hr.h) + ' h em ' + brD(hr.date) : '—')}${dado('Uso medido', tx ? nf(tx, 1) + ' h/dia' : '—')}${dado('Docagem (CSN)', csn && csn.date ? 'até ' + brD(csn.date) : 'sem data-limite')}${dado('Motor (planilha)', esc(b.marca + ' ' + b.modelo + (b.hp ? ' · ' + nf(b.hp, 1).replace(',0', '') + ' HP' : '') + (b.rpm ? ' · ' + nf(b.rpm) + ' rpm' : '')))}${dado('Bomba', b.vazao ? b.vazao + ' m³/h' : '—')}${dado('Baterias', esc([b.batM, b.batA].filter(Boolean).join(' · ') || '—'))}${dado('Tanque de consumo', b.tqCons ? b.tqCons + ' m³' : '—')}${dado('Cabeços', b.cabQ ? esc(b.cabQ + ' · ' + b.cabT) : '—')}${dado('Boias · extintores · machados', [b.boias, b.ext, b.mach].map(x => x ?? '—').join(' · '))}${dado('Capacidade · ano', nf(b.cap, 2) + ' · ' + (b.ano || '—'))}</div>${b.nota ? `<p class="note">⚠ ${esc(b.nota)}</p>` : ''}</div>
   ${e.A.length ? `<div class="card"><h2>Falhas abertas · ${e.A.length}</h2><ul class="bal-ag">${e.A.map(a => `<li><span class="pill ${a.c === 'Crítica' ? 'p-bad' : a.c === 'Alta' ? 'p-warn' : 'p-mut'}">${esc(a.c)}</span> ${brD(a.date)} · ${esc(a.desc)}${a.om ? ' · OM ' + esc(a.om) : ' · <b class="rl-ruim">sem OM no Sankhya</b>'} <button class="mbtn sm" data-balfim="${a.id}">Resolvida</button></li>`).join('')}</ul></div>` : ''}
   <div class="card"><h2>Plano desta balsa</h2><div class="tw"><table class="t"><thead><tr><th>Item</th><th>Equipamento</th><th>Serviço</th><th>Intervalo</th><th>Último</th><th>Situação</th><th></th></tr></thead><tbody>
   ${e.P.map(({ t, s }) => `<tr><td class="nowrap"><b>${t.id}</b></td><td>${esc(t.eq)}</td><td>${esc(t.serv)}<div class="note">${esc(t.exec)} · <span class="${t.prio === 'Crítica' ? 'rl-ruim' : 'rl-at'}">${t.prio}</span></div></td><td class="nowrap">${balIvTx(t)}</td><td class="nowrap">${s.L ? brD(s.L.date) + (s.L.h != null && s.L.h !== '' ? '<div class="note">' + nf(s.L.h) + ' h</div>' : '') : '—'}</td><td>${balPil(BAL_SIT, s.st)}<div class="note">${esc(s.txt)}</div></td><td><button class="mbtn sm" data-balexe="${b.id}|${t.id}">Registrar</button></td></tr>`).join('')}</tbody></table></div></div>
   <div class="card"><h2>Histórico</h2>${H.length ? `<ul class="bal-ag">${H.slice(0, 40).map(h => `<li>${brD(h.d)} · ${esc(h.tx)}${h.by ? ' <span class="note">(' + esc(h.by) + ')</span>' : ''}</li>`).join('')}</ul>` : '<p class="note">Nada registrado ainda.</p>'}</div>`;
}
// ---------- registros ----------
const balPode = () => { if (S.session) return true; toast('Entre no SMF para registrar.'); return false; };
function balExeModal(vid, item) {
  if (!balPode()) return; const b = balsaDe(vid); if (!b) return; const hr = balHor(b.id), L = balItens(b);
  modal(`<h2>Registrar execução · ${esc(b.nome)}</h2><p class="note">Marque os serviços feitos na mesma intervenção. A OM e as fotos de antes e depois ficam no Sankhya (NP 024 6.4 e 9).</p>
   <div class="g"><label class="f s3">Data<input type="date" id="beD" value="${isoD(hoje())}"></label><label class="f s3">Horímetro do motor-bomba<input id="beH" inputmode="decimal" value="${hr ? hr.h : ''}" placeholder="h"></label><label class="f s3">Nº da OM (Sankhya)<input id="beO" inputmode="numeric"></label><label class="f s3">Quem executou<input id="beQ" placeholder="equipe, CTF/MFM ou terceiro"></label></div>
   <div class="bal-ck">${L.map(t => `<label><input type="checkbox" value="${t.id}"${t.id === item ? ' checked' : ''}> <b>${t.id}</b> ${esc(t.eq)} · ${esc(t.serv)} <span class="note">(${balIvTx(t)})</span></label>`).join('')}</div>
   <label class="f">Observação<input id="beX"></label><div class="note" id="beE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="beOk">Salvar</button></div>`, true);
  $('#beOk').onclick = async () => { const its = $$('#modal .bal-ck input:checked').map(i => i.value), d = $('#beD').value, hv = $('#beH').value.trim().replace(',', '.'), om = $('#beO').value.trim();
    if (!its.length) return $('#beE').textContent = 'Marque pelo menos um serviço.'; if (!d) return $('#beE').textContent = 'Informe a data.'; if (!om) return $('#beE').textContent = 'Informe o nº da OM do Sankhya (NP 024: toda intervenção tem OM).';
    if (its.some(i => BA1M[i].h) && hv === '') return $('#beE').textContent = 'Serviço por horas: informe o horímetro.';
    const h = hv === '' ? null : +hv, quem = $('#beQ').value.trim(), obs = $('#beX').value.trim(), by = S.session.name, at = Date.now();
    for (const it of its) await saveRec({ id: uid('base'), kind: 'base', vessel: b.id, pos: 'UN', item: it, h, date: d, om, quem, obs, by, bal: true, createdAt: at });
    if (h != null && (!hr || h > hr.h || d > hr.date)) await saveRec({ id: uid('hor'), kind: 'hor', vessel: b.id, pos: 'MB', h, date: d, by, bal: true });
    closeModal(); toast(its.length + ' serviço' + (its.length === 1 ? '' : 's') + ' registrado' + (its.length === 1 ? '' : 's') + '.'); render(); };
}
function balHorModal(vid) {
  if (!balPode()) return; const b = balsaDe(vid), hr = balHor(vid);
  modal(`<h2>Horímetro do motor-bomba · ${esc(b.nome)}</h2><p class="note">Última leitura: ${hr ? nf(hr.h) + ' h em ' + brD(hr.date) : 'nenhuma'}.</p><div class="g"><label class="f s3">Data<input type="date" id="bhD" value="${isoD(hoje())}"></label><label class="f s3">Horas<input id="bhH" inputmode="decimal"></label></div><div class="note" id="bhE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bhOk">Salvar</button></div>`);
  $('#bhOk').onclick = async () => { const h = +$('#bhH').value.trim().replace(',', '.'), d = $('#bhD').value; if (!d || !isFinite(h) || $('#bhH').value.trim() === '') return $('#bhE').textContent = 'Informe a data e as horas.';
    if (hr && h < hr.h && d >= hr.date) return $('#bhE').textContent = 'Leitura menor que a anterior (' + nf(hr.h) + ' h). Se o horímetro foi trocado, anote na observação de uma execução.';
    await saveRec({ id: uid('hor'), kind: 'hor', vessel: vid, pos: 'MB', h, date: d, by: S.session.name, bal: true }); closeModal(); toast('Horímetro salvo.'); render(); };
}
function balFalhaModal(vid) {
  if (!balPode()) return;
  modal(`<h2>Registrar falha · balsa</h2><p class="note">NP 024 6.1: toda irregularidade vira OM no Sankhya. Crítica impede a balsa de operar até a liberação do Supervisor; Alta deixa com restrição.</p>
   <div class="g"><label class="f s3">Balsa<select id="bfV">${BALSAS.map(b => `<option value="${b.id}"${b.id === vid ? ' selected' : ''}>${esc(b.nome)}</option>`).join('')}</select></label><label class="f s3">Data<input type="date" id="bfD" value="${isoD(hoje())}"></label><label class="f s3">Classe<select id="bfC">${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `<option>${c}</option>`).join('')}</select></label><label class="f s3">Nº da OM (Sankhya)<input id="bfO" inputmode="numeric" placeholder="se já aberta"></label></div>
   <label class="f">Equipamento<select id="bfQ">${[...new Set(BA1.map(t => t.eq))].concat(['Rede de carga e tubulações', 'Tanques', 'Outro']).map(q => `<option>${esc(q)}</option>`).join('')}</select></label><label class="f">O que aconteceu<input id="bfX"></label>
   <p class="note">Crítica (NP 024 6.1): lubrificação, refrigeração e arrefecimento, injeção, sistema elétrico, estanqueidade, bombeio, dutos, válvulas de segurança, eixo ou rotor da bomba.</p><div class="note" id="bfE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bfOk">Salvar</button></div>`, true);
  $('#bfOk').onclick = async () => { const desc = $('#bfX').value.trim(); if (!desc) return $('#bfE').textContent = 'Descreva a falha.';
    await saveRec({ id: uid('avaria'), kind: 'avaria', vessel: $('#bfV').value, date: $('#bfD').value, c: $('#bfC').value, om: $('#bfO').value.trim(), sis: $('#bfQ').value, pos: 'UN', desc, quem: S.session.name, meio: 'FR 027_A / tripulação', at: Date.now(), by: S.session.name, bal: true });
    closeModal(); toast('Falha registrada.'); render(); };
}
function balCsnModal(vid) {
  if (!balPode()) return; const b = balsaDe(vid), c = balCsn(vid);
  modal(`<h2>Data-limite do CSN · ${esc(b.nome)}</h2><p class="note">Data-limite da vistoria em seco do certificado. Manda no prazo da docagem (B10.1), da revisão das válvulas de gaveta (B5.4) e da recertificação da PSV (B6.3).</p><div class="g"><label class="f s3">Data-limite<input type="date" id="bcD" value="${c && c.date ? c.date : ''}"></label><label class="f s6">Observação<input id="bcO" value="${esc(c && c.obs || '')}"></label></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bcOk">Salvar</button></div>`);
  $('#bcOk').onclick = async () => { if (!$('#bcD').value) return toast('Informe a data.'); await saveRec({ id: uid('doclim'), kind: 'doclim', vessel: vid, date: $('#bcD').value, obs: $('#bcO').value.trim(), by: S.session.name, bal: true }); closeModal(); toast('Data-limite salva.'); render(); };
}
function balAfter() {
  const m = $('#main'); m.onclick = async e => { const t = e.target.closest('[data-balexe],[data-balhor],[data-balfalha],[data-balcsn],[data-balfim],[data-balf],[data-balano],[data-balft]'); if (!t) return; const d = t.dataset;
    if (d.balexe !== undefined) { const [v, i] = d.balexe.split('|'); return balExeModal(v, i); }
    if (d.balhor !== undefined) return balHorModal(d.balhor);
    if (d.balfalha !== undefined) return balFalhaModal(d.balfalha);
    if (d.balcsn !== undefined) return balCsnModal(d.balcsn);
    if (d.balfim !== undefined) { if (!balPode()) return; const r = S.recs.get(d.balfim); if (r && confirm('Marcar a falha como resolvida (OM encerrada no Sankhya)?')) { await saveRec(Object.assign({}, r, { fim: { at: Date.now(), by: S.session.name } })); render(); } return; }
    if (d.balf !== undefined) { BALF.f = d.balf; return render(); }
    if (d.balano !== undefined) { BALCR.ano = +d.balano; return render(); }
    if (d.balft !== undefined) go('#balft/' + d.balft); };
}
Object.assign(VX, { bal: vBal, balcr: vBalCr, balpl: vBalPl, balft: vBalFt }); BAL_VIEWS.forEach(([k]) => { AFTER[k] = balAfter; });
// menu da frota de balsas (renderNav chama quando FROTA_TIPO = 'bal')
function balNav() {
  const it = (k, n, ic) => `<a href="#${k}" class="${VIEW === k ? 'on' : ''}">${ico(ic)}<span>${n}</span>${k === 'bal' ? (n2 => n2 ? `<span class="n">${n2}</span>` : '')(BALSAS.filter(b => balEstado(b).st === 'bloq').length) : ''}</a>`;
  return '<div class="grp-t grp-trab">Balsas petroleiras</div>' + it('bal', 'Situação das balsas', 'hoje') + it('balcr', 'Cronograma', 'crono') + it('balpl', 'Plano preventivo', 'plan') + it('balft', 'Ficha técnica', 'barcos')
    + '<div class="grp-t grp-apoio">Suporte</div>' + it('bib', 'Biblioteca', 'bib') + it('admin', 'Administração', 'adm'); }
// ---------- dados de exemplo das balsas (seed: some em “Limpar dados de exemplo”) ----------
async function balExemplo() {
  if (!temExemplo() || S.recs.has('ex-bal-v2')) return;
  let sd = 2421; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280, agora = Date.now(), put = [], base = { seed: true, createdAt: agora, updatedAt: agora, by: 'Supervisor (exemplo)', bal: true };
  const dia = n => isoD(new Date(hoje().getTime() - n * 864e5));
  BALSAS.forEach((b, i) => { const tx = 1.5 + R() * 3.5, h1 = Math.round(3000 + R() * 9000), h0 = Math.round(h1 - tx * 60);
    put.push(Object.assign({ id: 'ex-balh0-' + b.id, kind: 'hor', vessel: b.id, pos: 'MB', h: h0, date: dia(65) }, base), Object.assign({ id: 'ex-balh1-' + b.id, kind: 'hor', vessel: b.id, pos: 'MB', h: h1, date: dia(5) }, base));
    put.push(Object.assign({ id: 'ex-balcsn-' + b.id, kind: 'doclim', vessel: b.id, date: isoD(addM(hoje(), 6 + Math.round(R() * 40))), obs: 'Certificado (exemplo)' }, base));
    balItens(b).forEach(t => { const iv = balIv(t), atr = R(), fr = i % 6 === 2 && atr < .3 ? 1.08 + R() * .3 : atr < .12 ? .9 + R() * .09 : R() * .8;   // vencidos só em 1 de cada 6 balsas; ~12% em breve
      const dias = iv.m ? Math.round(iv.m * 30.4 * fr) : Math.round((iv.h || 500) / tx * fr), hFeito = iv.h ? Math.round(h1 + tx * 5 - iv.h * fr) : null;
      put.push(Object.assign({ id: 'ex-bals-' + b.id + '-' + t.id, kind: 'base', vessel: b.id, pos: 'UN', item: t.id, h: hFeito != null && hFeito > 0 ? hFeito : null, date: dia(Math.max(1, Math.min(dias, 3650))), om: String(46000 + i * 40 + Math.round(R() * 30)), quem: t.exec + ' (exemplo)' }, base)); }); });
  [['bal7', 'Crítica', 'Bomba centrífuga', 'Vazamento no selo mecânico da bomba de carga'], ['bal14', 'Alta', 'Luzes de navegação', 'Luz de mastro apagada'], ['bal22', 'Média', 'Válvulas de gaveta', 'Gaxeta da válvula de descarga com gotejamento']]
    .forEach(([v, c, q, x], k) => put.push(Object.assign({ id: 'ex-balav-' + k, kind: 'avaria', vessel: v, date: dia(1 + k), c, sis: q, pos: 'UN', desc: x + ' (exemplo)', om: k === 2 ? '' : String(48300 + k), quem: 'Operador de Medição (exemplo)', meio: 'FR 027_A', at: agora - (1 + k) * 864e5 }, base)));
  put.push(Object.assign({ id: 'ex-bal-v2', kind: 'marca' }, base));
  put.forEach(r => S.recs.set(r.id, r)); if (MEM) put.forEach(r => MEM.set(r.id, r)); else await DB.putMany(put);
  if (typeof render === 'function' && S.session) render();
}
(async () => { for (let i = 0; i < 120; i++) { if (typeof S !== 'undefined' && S.pronto) break; await new Promise(r => setTimeout(r, 500)); } await new Promise(r => setTimeout(r, 3500)); try { await balExemplo(); } catch (e) { console.warn('balExemplo', e); } })();
{ const st = document.createElement('style'); st.textContent = `.bal-t td{vertical-align:top}.bal-ag{margin:4px 0;padding-left:0;list-style:none}.bal-ag li{padding:5px 0;border-bottom:1px solid #EEF2F6;font-size:13px}.bal-ag li:last-child{border:0}
.bal-cr td,.bal-cr th{padding:5px 6px!important;font-size:12px}.bal-cr .c{text-align:center}.bal-mes{background:#E8F0FE}.bal-tot td{border-top:2px solid #CBD5E1}.nowrap{white-space:nowrap}
.bal-dados{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px 18px}.bal-dados>div{display:flex;flex-direction:column;gap:2px}.bal-dados b{font-size:13.5px}
.bal-ck{display:flex;flex-direction:column;gap:6px;max-height:46vh;overflow:auto;border:1px solid #E3E8EF;border-radius:8px;padding:8px 10px;margin:8px 0}.bal-ck label{font-size:13px;line-height:1.35;display:block}`; document.head.appendChild(st); }
