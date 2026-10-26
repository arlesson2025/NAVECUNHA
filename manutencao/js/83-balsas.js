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
  { id: 'B6.2', eq: 'PSV e válvula de alívio', m: 12, prio: 'Crítica', exec: 'Terceiro (calibração)', serv: 'Calibração de pressão e vácuo da PSV nos set-points de projeto, com certificado', ref: 'NP 024 8.2.5 e 6.5' },
  { id: 'B6.4', eq: 'PSV e válvula de alívio', m: 12, prio: 'Crítica', exec: 'Terceiro (calibração)', serv: 'Calibração da válvula de alívio da linha na pressão de projeto, com certificado', ref: 'NP 024 7.0 e 8.2.5' },
  { id: 'B6.3', eq: 'PSV e válvula de alívio', doca: true, prio: 'Crítica', exec: 'Terceiro (certificadora)', serv: 'Revisão geral e recertificação por entidade certificadora', ref: 'NP 024 8.2.5' },
  { id: 'B7.1', eq: 'Luzes de navegação', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Limpeza das lentes, funcionamento 100% (bombordo, boreste, fundeio, mastro, carga e descarga) e inspeção elétrica', ref: 'NP 024 8.2.6' },
  { id: 'B8.1', eq: 'Alarme de nível alto', m: 6, prio: 'Crítica', exec: 'Equipe de manutenção', serv: 'Inspeção elétrica, teste do alarme sonoro e visual, boia de medição e tanque', ref: 'NP 024 8.2.7' },
  { id: 'B9.1', eq: 'Baterias', m: 6, prio: 'Alta', exec: 'Equipe de manutenção', serv: 'Indicador de carga, cabos e terminais, caixa de madeira e manta de proteção', ref: 'NP 024 8.2.9' },
  { id: 'B10.1', eq: 'Casco', doca: true, prio: 'Crítica', exec: 'Terceiro (estaleiro)', serv: 'Docagem: inspeção de fundo, espessura de chapa, limpeza e desgaseificação', ref: 'NP 024 7.0' },
  { id: 'B12.1', eq: 'Manômetro da rede de carga', m: 12, prio: 'Alta', exec: 'Terceiro (calibração)', serv: 'Calibração do manômetro da rede de carga, com certificado (critério interno; a NP 024 só pede ponteiro no zero e vidro íntegro)', ref: 'Critério interno · NP 024 5.4' },
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
const BAL_VIEWS = [['bal', 'Situação das balsas'], ['balcr', 'Cronograma'], ['balpl', 'Plano preventivo'], ['baldoca', 'Docagem'], ['balcal', 'Plano de calibração'], ['balcmp', 'Compressão dos motores'], ['balkpi', 'Indicadores'], ['balft', 'Ficha técnica']];
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
// cronograma no formato clássico (P e R mês a mês), com o previsto do passado reconstruído pela cadeia de vencimentos:
// a partir do último serviço antes do ano, cada vencimento (data, ou horas no ritmo medido do motor-bomba) vira previsto no mês;
// feito até o fim do mês do vencimento = no prazo · feito depois = com atraso · vencimento passado sem serviço = não realizado no prazo
const BALCR = { ano: hoje().getFullYear(), b: '' };
const balExecs = (vid, item) => recs('base').filter(r => r.vessel === vid && r.item === item && !r.excluido && r.date).sort((a, b) => a.date < b.date ? -1 : 1);
function balCxItem(b, t, y) {
  const M = Array.from({ length: 12 }, () => ({ plan: 0, ok: 0, late: 0, miss: 0, tx: [] })), ini = new Date(y, 0, 1), fim = new Date(y + 1, 0, 1), H = hoje(), iv = balIv(t), tx = balTaxa(b.id), csn = t.doca ? balCsn(b.id) : null;
  const E = balExecs(b.id, t.id), usados = new Set(); let cur = null;
  E.forEach(e => { if (pD(e.date) < ini) cur = e; });
  if (!cur) { const f = E.find(e => pD(e.date) >= ini); if (!f) return M; cur = f; usados.add(f.id); const i = pD(f.date).getMonth(); M[i].ok++; M[i].tx.push('feito ' + brD(f.date) + (f.om ? ' · OM ' + f.om : '')); }   // sem serviço antes do ano: a cadeia começa no primeiro do ano
  const prox = c => { const d0 = pD(c.date); let d = iv.m ? addM(d0, iv.m) : null; if (iv.h && tx) { const dh = new Date(d0.getTime() + iv.h / tx * 864e5); if (!d || dh < d) d = dh; }
    if (csn && csn.date && c === E[E.length - 1]) d = pD(csn.date); return d; };
  for (let n = 0; n < 80; n++) { const D = prox(cur); if (!D || D >= fim) break;
    const e = E.find(x => !usados.has(x.id) && pD(x.date) > pD(cur.date)), fimMes = new Date(D.getFullYear(), D.getMonth() + 1, 1);
    if (e && pD(e.date) < fim) { usados.add(e.id); const de = pD(e.date), iE = de.getMonth(), late = de >= fimMes;
      if (D >= ini) M[D.getMonth()].plan++; if (de >= ini) { M[iE][late ? 'late' : 'ok']++; M[iE].tx.push((late ? 'feito com atraso ' : 'feito ') + brD(e.date) + (e.om ? ' · OM ' + e.om : '')); }
      if (late && D >= ini && D < H) { /* atraso: o previsto fica no mês do vencimento */ } cur = e; continue; }
    if (D >= ini) { if (fimMes <= H) { M[D.getMonth()].miss++; M[D.getMonth()].tx.push('venceu ' + brD(isoD(D)) + ' sem registro'); } else M[D.getMonth()].plan++; }
    cur = { date: isoD(D), h: null, id: 'proj' + n }; }
  E.forEach(e => { if (!usados.has(e.id) && pD(e.date) >= ini && pD(e.date) < fim) { const i = pD(e.date).getMonth(); M[i].ok++; M[i].tx.push('feito ' + brD(e.date) + (e.om ? ' · OM ' + e.om : '')); } });   // feito fora da cadeia (adiantado)
  return M; }
function balCxBalsa(b, y) { const L = balItens(b).map(t => ({ t, M: balCxItem(b, t, y) })), P = Array(12).fill(0), R = Array(12).fill(0), Ok = Array(12).fill(0), Lt = Array(12).fill(0), Ms = Array(12).fill(0);
  L.forEach(({ M }) => M.forEach((m, i) => { P[i] += m.plan + m.ok + m.late + m.miss; R[i] += m.ok + m.late; Ok[i] += m.ok; Lt[i] += m.late; Ms[i] += m.miss; })); return { b, L, P, R, Ok, Lt, Ms }; }
function vBalCr() {
  const y = BALCR.ano, hm = hoje().getFullYear() === y ? hoje().getMonth() : y < hoje().getFullYear() ? 12 : -1, sel = balsaDe(BALCR.b);
  const anoBt = `<div class="seg">${[y - 1, y, y + 1].map(a => `<button data-balano="${a}" class="${a === y ? 'on' : ''}">${a}</button>`).join('')}</div>`;
  const ad = (ok, den) => den ? Math.round(ok / den * 100) : null, adCor = a => a == null ? '#5F6368' : a >= 90 ? '#188038' : a >= 75 ? '#B06000' : '#C5221F';
  if (sel) {   // uma balsa: uma linha por serviço, P e R mês a mês
    const D = balCxBalsa(sel, y); let rows = '';
    D.L.forEach(({ t, M }) => { const P = M.map(m => m.plan + m.ok + m.late + m.miss);
      const cP = P.map((n, i) => `<td class="pr-c p${i === hm ? ' hj' : ''}">${n ? (n > 1 ? n : '●') : ''}</td>`).join('');
      const cR = M.map((m, i) => { const r = m.ok + m.late, tip = esc(m.tx.join('\n')); if (r) return `<td class="pr-c r ${m.late ? 'late' : 'ok'}${i === hm ? ' hj' : ''}" title="${tip}">${r > 1 ? r + '×' : '✓'}</td>`; if (m.miss) return `<td class="pr-c r miss${i === hm ? ' hj' : ''}" title="${tip}">✗</td>`; return `<td class="pr-c r${i === hm ? ' hj' : ''}"></td>`; }).join('');
      rows += `<tr class="pr-p"><td class="pr-sv" rowspan="2"><b>${t.id} · ${esc(t.eq)}</b><small>${esc(t.serv)}</small></td><td class="pr-f" rowspan="2">${balIvTx(t)}</td><td class="pr-l">P</td>${cP}<td class="pr-t">${P.reduce((a, x) => a + x, 0)}</td></tr><tr class="pr-r"><td class="pr-l">R</td>${cR}<td class="pr-t">${M.reduce((a, m) => a + m.ok + m.late, 0)}</td></tr>`; });
    const ok = D.Ok.slice(0, hm + 1).reduce((a, x) => a + x, 0), den = ok + D.Lt.slice(0, hm + 1).reduce((a, x) => a + x, 0) + D.Ms.slice(0, hm + 1).reduce((a, x) => a + x, 0), a = ad(ok, den);
    return balCab(`Cronograma · ${sel.nome}`, `${esc(balMotTx(sel))} · ● previsto · ✓ feito no prazo · ✓ âmbar feito com atraso · ✗ venceu sem registro · passe o mouse para ver datas e OMs`, `<a class="mbtn" href="#balcr" data-balcrb="">← Frota de balsas</a>${anoBt}`)
     + `<div class="card"><div class="cm-chips"><span class="cm-chip on">Aderência no prazo <b style="color:${adCor(a)}">${a == null ? '—' : a + '%'}</b></span><span class="cm-chip">Não realizados no prazo <b>${D.Ms.reduce((x, y2) => x + y2, 0)}</b></span><span class="cm-chip">Previsto no ano <b>${D.P.reduce((x, y2) => x + y2, 0)}</b></span></div>
       <div class="tw"><table class="pr-t"><colgroup><col style="width:260px"><col style="width:96px"><col style="width:22px">${PR_MES.map(() => '<col>').join('')}<col style="width:40px"></colgroup><thead><tr><th>Serviço</th><th>Frequência</th><th></th>${PR_MES.map((m, i) => `<th${i === hm ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>Total</th></tr></thead><tbody>${rows}</tbody></table></div></div>`; }
  const tot = PR_MES.map(() => ({ p: 0, r: 0, ok: 0, den: 0 })); let tF = 0;
  const rows = BALSAS.map(b => { const d = balCxBalsa(b, y), venc = d.Ms.reduce((a, x) => a + x, 0), ok = d.Ok.slice(0, hm + 1).reduce((a, x) => a + x, 0), den = ok + d.Lt.slice(0, hm + 1).reduce((a, x) => a + x, 0) + d.Ms.slice(0, hm + 1).reduce((a, x) => a + x, 0), a = ad(ok, den);
    tF += venc; d.P.forEach((x, i) => { tot[i].p += x; tot[i].r += d.R[i]; tot[i].ok += d.Ok[i]; if (i <= hm) tot[i].den += d.Ok[i] + d.Lt[i] + d.Ms[i]; });
    const cP = d.P.map((n, i) => `<td class="pr-c p${i === hm ? ' hj' : ''}">${n || ''}</td>`).join('');
    const cR = d.R.map((n, i) => `<td class="pr-c r ${i > hm ? '' : d.Ms[i] ? 'miss' : d.Lt[i] ? 'late' : n ? 'ok' : ''}${i === hm ? ' hj' : ''}" title="${n} realizados · ${d.Lt[i]} com atraso · ${d.Ms[i]} não feitos no prazo">${i > hm ? '' : (n || (d.P[i] ? '0' : '')) + (d.Ms[i] ? '<small> ✗' + d.Ms[i] + '</small>' : '')}</td>`).join('');
    return `<tr class="pr-p"><td class="pr-sv" rowspan="2"><a href="#balcr" data-balcrb="${b.id}"><b>${esc(b.nome)}</b></a><small>${esc(BAL_MOTOR[b.mot])}</small></td><td class="pr-l">P</td>${cP}<td class="pr-t">${d.P.reduce((x, y2) => x + y2, 0)}</td><td class="pr-fa" rowspan="2">${venc ? `<b style="color:#C5221F">${venc} não realizado${venc > 1 ? 's' : ''}</b>` : '<span style="color:#188038">nada vencido</span>'}</td><td class="pr-ad" rowspan="2"><b style="color:${adCor(a)}">${a == null ? '—' : a + '%'}</b></td></tr>
     <tr class="pr-r"><td class="pr-l">R</td>${cR}<td class="pr-t">${d.R.reduce((x, y2) => x + y2, 0)}</td></tr>`; }).join('');
  const okT = tot.reduce((a, t) => a + t.ok, 0), dT = tot.reduce((a, t) => a + t.den, 0), aT = ad(okT, dT);
  return balCab('Cronograma das balsas', 'Previsto × realizado mês a mês · aderência = feito no prazo ÷ o que já venceu · clique na balsa para ver serviço por serviço', anoBt)
   + `<div class="card"><div class="cm-chips"><span class="cm-chip on">Aderência no prazo <b style="color:${adCor(aT)}">${aT == null ? '—' : aT + '%'}</b></span><span class="cm-chip">Serviços preventivos não realizados dentro do prazo <b>${tF}</b></span><span class="cm-chip">Previsto no ano <b>${tot.reduce((a, t) => a + t.p, 0)}</b></span></div>
     <div class="tw"><table class="pr-t"><colgroup><col style="width:150px"><col style="width:22px">${PR_MES.map(() => '<col>').join('')}<col style="width:46px"><col style="width:150px"><col style="width:80px"></colgroup>
     <thead><tr><th>Balsa</th><th></th>${PR_MES.map((m, i) => `<th${i === hm ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>Total</th><th>No prazo</th><th>Aderência</th></tr></thead><tbody>${rows}</tbody>
     <tfoot><tr class="pr-tot"><td colspan="2">Frota · previsto</td>${tot.map(x => `<td class="pr-c">${x.p || ''}</td>`).join('')}<td class="pr-t">${tot.reduce((a, x) => a + x.p, 0)}</td><td rowspan="3" class="pr-fa"><b style="color:${tF ? '#C5221F' : '#188038'}">${tF} não realizados</b></td><td rowspan="3" class="pr-ad"><b>${aT == null ? '—' : aT + '%'}</b></td></tr>
     <tr class="pr-tot"><td colspan="2">Frota · realizado</td>${tot.map((x, i) => `<td class="pr-c">${i > hm ? '' : x.r}</td>`).join('')}<td class="pr-t">${tot.reduce((a, x) => a + x.r, 0)}</td></tr>
     <tr class="pr-tot"><td colspan="2">Aderência</td>${tot.map((x, i) => `<td class="pr-c"><b>${i <= hm && x.den ? Math.round(x.ok / x.den * 100) + '%' : ''}</b></td>`).join('')}<td class="pr-t"></td></tr></tfoot></table></div>
     <p class="note">Previsto pela data do último serviço e pelas horas no ritmo medido do motor-bomba (sem 2 leituras de horímetro, o serviço por horas só conta pelo prazo em meses). Feito até o fim do mês do vencimento = no prazo. Item sem nenhum serviço registrado não entra.</p></div>`;
}
// ---------- docagem: última, data-limite do CSN, histórico com estaleiro, dias parada e custo, projeção de 5 anos ----------
const balDocas = vid => balExecs(vid, 'B10.1').slice().reverse();
function balDocaSit(b) { const t = BA1M['B10.1'], s = balSit(b, t), L = balDocas(b.id), u = L[0] || null, csn = balCsn(b.id), dias = s.alvoD ? Math.round((s.alvoD - pD(isoD(hoje()))) / 864e5) : null;
  return { b, s, L, u, csn, dias, st: !s.alvoD ? 'sem' : dias < 0 ? 'venc' : dias <= 365 ? 'prox' : 'ok' }; }
const BAL_DST = { venc: ['p-bad', 'Vencida'], prox: ['p-warn', 'Programar (até 12 meses)'], ok: ['p-ok', 'Em dia'], sem: ['p-mut', 'Sem data'] };
function vBalDoca() {
  const D = BALSAS.map(balDocaSit).sort((a, b) => (a.dias == null ? 1e9 : a.dias) - (b.dias == null ? 1e9 : b.dias)), y0 = hoje().getFullYear(), anos = [0, 1, 2, 3, 4].map(k => y0 + k), c = k => D.filter(d => d.st === k).length;
  const par = h => h && h.saida ? Math.max(0, Math.round((pD(h.saida) - pD(h.date)) / 864e5)) + ' d' : h ? 'no estaleiro' : '—';
  const proj = d => anos.map(a => { const hit = d.s.alvoD && d.s.alvoD.getFullYear() === a; return `<td class="c${hit ? (d.st === 'venc' ? ' bal-dv' : ' bal-dp') : ''}">${hit ? MESES[d.s.alvoD.getMonth()] : ''}</td>`; }).join('');
  return balCab('Docagem das balsas', 'Vistoria em seco · vale a data-limite do CSN lançada; sem ela, 5 anos depois da última docagem (critério interno) · a revisão das válvulas de gaveta e a recertificação da PSV vão junto', '')
   + `<div class="cm-chips">${[['venc', 'Vencidas'], ['prox', 'Programar (até 12 meses)'], ['ok', 'Em dia'], ['sem', 'Sem data']].map(([k, t]) => `<span class="cm-chip">${t} <b>${c(k)}</b></span>`).join('')}</div>
   <div class="card"><h2>Situação e projeção</h2><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th>Última docagem</th><th>Estaleiro</th><th class="r">Parada</th><th class="r">Custo (R$ mil)</th><th>CSN até</th><th>Situação</th>${anos.map(a => `<th class="c">${a}</th>`).join('')}<th></th></tr></thead><tbody>
   ${D.map(d => `<tr><td><a href="#balft/${d.b.id}"><b>${esc(d.b.nome)}</b></a></td><td>${d.u ? brD(d.u.date) : '—'}</td><td>${esc(d.u && d.u.estaleiro || '—')}</td><td class="r">${par(d.u)}</td><td class="r">${d.u && d.u.custo != null && d.u.custo !== '' ? nf(d.u.custo) : '—'}</td><td>${d.csn && d.csn.date ? brD(d.csn.date) : '<span class="mut">não lançado</span>'}</td><td>${balPil(BAL_DST, d.st)}<div class="note">${d.dias == null ? '' : d.dias < 0 ? (-d.dias) + ' dias vencida' : 'faltam ' + d.dias + ' dias'}</div></td>${proj(d)}<td class="nowrap"><button class="mbtn sm pri" data-baldoca="${d.b.id}">Registrar docagem</button> <button class="mbtn sm" data-balcsn="${d.b.id}">CSN</button></td></tr>`).join('')}</tbody></table></div>
   <p class="note">Colunas dos anos = mês em que a próxima docagem vence (vermelho = já vencida).</p></div>
   <div class="card"><h2>Histórico de docagens</h2>${(() => { const H = BALSAS.flatMap(b => balDocas(b.id).map(h => ({ b, h }))).sort((a, b) => a.h.date < b.h.date ? 1 : -1); return H.length ? `<div class="tw"><table class="t"><thead><tr><th>Balsa</th><th>Entrada</th><th>Saída</th><th class="r">Parada</th><th>Estaleiro</th><th>Serviços</th><th class="r">Custo (R$ mil)</th><th>OM</th></tr></thead><tbody>${H.map(({ b, h }) => `<tr><td><b>${esc(b.nome)}</b></td><td>${brD(h.date)}</td><td>${h.saida ? brD(h.saida) : 'no estaleiro'}</td><td class="r">${par(h)}</td><td>${esc(h.estaleiro || '—')}</td><td>${esc(h.servicos || h.obs || '—')}</td><td class="r">${h.custo != null && h.custo !== '' ? nf(h.custo) : '—'}</td><td>${esc(h.om || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhuma docagem registrada.</p>'; })()}</div>`;
}
function balDocaModal(vid) {
  if (!balPode()) return; const b = balsaDe(vid);
  modal(`<h2>Registrar docagem · ${esc(b.nome)}</h2><p class="note">Entrada e saída do estaleiro. Marque o que foi feito junto: dá baixa nesses itens do plano na data de entrada.</p>
   <div class="g"><label class="f s3">Entrada<input type="date" id="bdE" value="${isoD(hoje())}"></label><label class="f s3">Saída<input type="date" id="bdS"></label><label class="f s3">Nº da OM (Sankhya)<input id="bdO" inputmode="numeric"></label><label class="f s3">Custo (R$ mil)<input id="bdC" inputmode="decimal"></label></div>
   <label class="f">Estaleiro<input id="bdT"></label><label class="f">Serviços<input id="bdX" placeholder="jateamento, pintura, medição de espessura, desgaseificação…"></label>
   <div class="bal-ck">${['B5.4', 'B6.3'].map(i => `<label><input type="checkbox" value="${i}" checked> <b>${i}</b> ${esc(BA1M[i].eq)} · ${esc(BA1M[i].serv)}</label>`).join('')}</div>
   <div class="note" id="bdErr" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bdOk">Salvar</button></div>`, true);
  $('#bdOk').onclick = async () => { const e = $('#bdE').value, om = $('#bdO').value.trim(); if (!e) return $('#bdErr').textContent = 'Informe a entrada.'; if (!om) return $('#bdErr').textContent = 'Informe o nº da OM do Sankhya.';
    const by = S.session.name, cv = $('#bdC').value.trim().replace(',', '.'), base = { kind: 'base', vessel: vid, pos: 'UN', h: null, date: e, om, by, bal: true, quem: $('#bdT').value.trim() };
    await saveRec(Object.assign({ id: uid('base'), item: 'B10.1', saida: $('#bdS').value, estaleiro: $('#bdT').value.trim(), servicos: $('#bdX').value.trim(), custo: cv === '' ? null : +cv }, base));
    for (const i of $$('#modal .bal-ck input:checked').map(x => x.value)) await saveRec(Object.assign({ id: uid('base'), item: i, obs: 'na docagem' }, base));
    closeModal(); toast('Docagem registrada.'); render(); };
}
// ---------- plano de calibração: PSV, válvula de alívio, manômetro da rede de carga e injeção (bicos e bomba injetora) ----------
const BAL_CAL = [['B6.2', 'PSV (pressão e vácuo)'], ['B6.4', 'Válvula de alívio da linha'], ['B12.1', 'Manômetro da rede de carga'], ['inj', 'Bicos e bomba injetora']];
const balInj = b => ({ m610: 'B2.3', cum: 'B3.3', m229: 'B4.2' })[b.mot];
function vBalCal() {
  const cel = (b, k) => { const id = k === 'inj' ? balInj(b) : k, t = BA1M[id], s = balSit(b, t), L = s.L;
    return `<td>${balPil(BAL_SIT, s.st)}<div class="note">${L ? brD(L.date) + (L.cert ? ' · cert. ' + esc(L.cert) : '') : 'sem registro'}${s.txt && L ? '<br>' + esc(s.txt) : ''}</div></td>`; };
  const E = BALSAS.map(b => ({ b, S: BAL_CAL.map(([k]) => balSit(b, BA1M[k === 'inj' ? balInj(b) : k]).st) })), n = st => E.reduce((a, e) => a + e.S.filter(x => x === st).length, 0);
  return balCab('Plano de calibração das balsas', 'PSV e válvula de alívio: anual (NP 024 8.2.5) · manômetro da rede de carga: anual (critério interno) · bicos e bomba injetora: na revisão de 1.000 h · cada calibração com nº do certificado (NP 024 6.5)', '')
   + `<div class="cm-chips"><span class="cm-chip">Vencidas <b>${n('venc')}</b></span><span class="cm-chip">Em até 30 dias ou 50 h <b>${n('prox')}</b></span><span class="cm-chip">Em dia <b>${n('ok')}</b></span><span class="cm-chip">Sem registro <b>${n('sem')}</b></span></div>
   <div class="card"><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th>${BAL_CAL.map(([k, n2]) => `<th>${n2}<div class="note">${k === 'inj' ? '1.000 h' : 'anual'}</div></th>`).join('')}<th></th></tr></thead><tbody>
   ${E.map(({ b }) => `<tr><td><a href="#balft/${b.id}"><b>${esc(b.nome)}</b></a><div class="note">${esc(BAL_MOTOR[b.mot])}</div></td>${BAL_CAL.map(([k]) => cel(b, k)).join('')}<td><button class="mbtn sm pri" data-balcal="${b.id}">Registrar calibração</button></td></tr>`).join('')}</tbody></table></div>
   <p class="note">Os certificados de rastreabilidade da PSV e do teste de rede ficam com a Área Técnica (NP 024 6.5); aqui ficam a data, o nº do certificado e quem calibrou.</p></div>`;
}
function balCalModal(vid) {
  if (!balPode()) return; const b = balsaDe(vid), hr = balHor(vid);
  modal(`<h2>Registrar calibração · ${esc(b.nome)}</h2><div class="g"><label class="f s6">Instrumento<select id="bkI">${BAL_CAL.map(([k, n]) => `<option value="${k === 'inj' ? balInj(b) : k}">${n}</option>`).join('')}</select></label><label class="f s3">Data<input type="date" id="bkD" value="${isoD(hoje())}"></label><label class="f s3">Horímetro (bicos e bomba)<input id="bkH" inputmode="decimal" value="${hr ? hr.h : ''}"></label>
   <label class="f s3">Nº do certificado<input id="bkC"></label><label class="f s3">Laboratório / quem calibrou<input id="bkL"></label><label class="f s3">Nº da OM (Sankhya)<input id="bkO" inputmode="numeric"></label><label class="f s3">Resultado<select id="bkR"><option>Aprovado</option><option>Ajustado e aprovado</option><option>Reprovado (substituir)</option></select></label></div>
   <div class="note" id="bkE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bkOk">Salvar</button></div>`, true);
  $('#bkOk').onclick = async () => { const it = $('#bkI').value, d = $('#bkD').value, cert = $('#bkC').value.trim(), om = $('#bkO').value.trim(), hv = $('#bkH').value.trim().replace(',', '.');
    if (!d || !cert || !om) return $('#bkE').textContent = 'Informe a data, o nº do certificado e o nº da OM.'; if (BA1M[it].h && hv === '') return $('#bkE').textContent = 'Bicos e bomba injetora: informe o horímetro.';
    const res = $('#bkR').value; if (/Reprovado/.test(res)) { toast('Reprovado: registre a falha e a substituição; o prazo não reinicia.'); closeModal(); return balFalhaModal(vid); }
    await saveRec({ id: uid('base'), kind: 'base', vessel: vid, pos: 'UN', item: it, h: BA1M[it].h ? +hv : null, date: d, om, cert, quem: $('#bkL').value.trim(), obs: res, by: S.session.name, bal: true });
    closeModal(); toast('Calibração registrada.'); render(); };
}
// ---------- compressão do motor-bomba (decisão do Supervisor, 25/10/2026) ----------
// MWM (6.10 TCA e D229-6): mínimo 20 bar, diferença máxima 2 bar (manual técnico do 6.10 TCA; D229-6 a confirmar) · Cummins: sem valor do fabricante —
// critério interno: diferença entre cilindros até 10% da média e queda de 10% desde o ensaio anterior; blow-by registrado junto · ensaio na revisão de 1.000 h
const BAL_CMP = { min: 20, novo: 23, dif: 2, difPct: .10, queda: .10, int: 1000 };
function balCmpHist(vid) { return recs('base').filter(r => r.vessel === vid && r.item === 'BCMP' && !r.excluido && r.date).map(r => { const v = (r.vals || []).map(x => x == null || x === '' ? null : +String(x).replace(',', '.')).filter(x => x != null && isFinite(x));
  return v.length ? { r, date: r.date, h: r.h != null && r.h !== '' ? +r.h : null, vals: v, min: Math.min(...v), max: Math.max(...v), med: v.reduce((a, x) => a + x, 0) / v.length, cil: (r.vals || []).map(x => x == null || x === '' ? null : +String(x).replace(',', '.')).indexOf(Math.min(...v)) + 1, bb: r.blowby || '' } : null; }).filter(Boolean).sort((a, b) => a.date < b.date ? -1 : 1); }
function balCmpSit(b) {
  const H = balCmpHist(b.id), u = H[H.length - 1] || null, a = H[H.length - 2] || null, hr = balHor(b.id), mwm = b.mot !== 'cum', mot = [];
  const r = { b, H, u, hr, mwm, dif: u ? u.max - u.min : null, queda: u && a ? (a.min - u.min) / a.min : null, proj: null };
  r.prox = u && u.h != null ? u.h + BAL_CMP.int : null; r.falta = r.prox != null && hr ? r.prox - hr.h : null; r.vencida = r.falta != null && r.falta < 0;
  if (mwm && H.length >= 2) { const P = H.filter(p => p.h != null).slice(-3); if (P.length >= 2) { const n = P.length, mx = P.reduce((s, p) => s + p.h, 0) / n, my = P.reduce((s, p) => s + p.min, 0) / n; let sxy = 0, sxx = 0; P.forEach(p => { sxy += (p.h - mx) * (p.min - my); sxx += (p.h - mx) ** 2; }); const k = sxx ? sxy / sxx : 0; r.proj = k < 0 ? Math.max(0, (u.min - BAL_CMP.min) / -k) : Infinity; } }
  if (!u) { r.st = 'sem'; mot.push('nenhum ensaio registrado'); }
  else if (mwm && u.min < BAL_CMP.min) { r.st = 'fora'; mot.push(`cilindro ${u.cil} com ${nf(u.min, 1)} bar, abaixo do mínimo de ${BAL_CMP.min} bar`); }
  else if (mwm ? r.dif > BAL_CMP.dif : r.dif > u.med * BAL_CMP.difPct) { r.st = 'aten'; mot.push(`diferença de ${nf(r.dif, 1)} bar entre cilindros (${mwm ? 'máx. ' + BAL_CMP.dif + ' bar' : 'máx. 10% da média'})`); }
  else if (r.queda != null && r.queda >= BAL_CMP.queda) { r.st = 'aten'; mot.push(`queda de ${nf(r.queda * 100)}% desde o ensaio anterior`); }
  else if (mwm && r.proj != null && r.proj < 2000) { r.st = 'aten'; mot.push(`~${nf(r.proj)} h até o mínimo`); }
  else r.st = 'ok';
  if (r.vencida) mot.push(`ensaio vencido há ${nf(-r.falta)} h`); r.mot = mot; return r; }
const BAL_CST = { fora: ['p-bad', 'Abaixo do mínimo'], aten: ['p-warn', 'Atenção'], ok: ['p-ok', 'Normal'], sem: ['p-mut', 'Sem ensaio'] };
function vBalCmp() {
  const D = BALSAS.map(balCmpSit).sort((a, b) => ({ fora: 0, aten: 1, sem: 3, ok: 2 })[a.st] - ({ fora: 0, aten: 1, sem: 3, ok: 2 })[b.st] || (a.u ? a.u.min : 99) - (b.u ? b.u.min : 99)), c = k => D.filter(d => d.st === k).length;
  return balCab('Compressão dos motores das balsas', `Motor-bomba · ensaio na revisão de 1.000 h · MWM: mínimo ${BAL_CMP.min} bar e diferença máxima de ${BAL_CMP.dif} bar entre cilindros (novo ${BAL_CMP.novo} bar) · Cummins: sem valor do fabricante, critério interno de diferença até 10% da média e queda de 10%, com o blow-by registrado junto`, '')
   + `<div class="cm-chips"><span class="cm-chip">Abaixo do mínimo <b>${c('fora')}</b></span><span class="cm-chip">Atenção <b>${c('aten')}</b></span><span class="cm-chip">Normal <b>${c('ok')}</b></span><span class="cm-chip">Sem ensaio <b>${c('sem')}</b></span><span class="cm-chip">Ensaio vencido <b>${D.filter(d => d.vencida).length}</b></span></div>
   <div class="card"><h2>Matriz de compressão das balsas</h2><div class="tw"><table class="t bal-t"><thead><tr><th>Balsa</th><th class="r">Horímetro</th><th>Último ensaio</th><th class="r">Menor cil.</th><th class="r">Dif. cil.</th><th>Blow-by</th><th class="r">Até o mínimo</th><th class="r">Próximo ensaio</th><th>Situação</th><th></th></tr></thead><tbody>
   ${D.map(d => `<tr title="${esc(d.mot.join(' · ') || 'sem alerta')}"><td><a href="#balft/${d.b.id}"><b>${esc(d.b.nome)}</b></a><div class="note">${esc(BAL_MOTOR[d.b.mot])}${d.b.mot === 'm229' ? ' · limite a confirmar' : ''}</div></td><td class="r">${d.hr ? nf(d.hr.h) + ' h' : '—'}</td><td>${d.u ? brD(d.u.date) + (d.u.h != null ? '<div class="note">' + nf(d.u.h) + ' h</div>' : '') : '—'}</td>
     <td class="r">${d.u ? `<b class="${d.mwm && d.u.min < BAL_CMP.min ? 'rl-ruim' : ''}">${nf(d.u.min, 1)} bar</b> C${d.u.cil}` : '—'}</td><td class="r">${d.dif != null ? nf(d.dif, 1) + ' bar' : '—'}</td><td>${esc(d.u && d.u.bb || '—')}</td><td class="r">${!d.mwm ? '<span class="mut">sem limite</span>' : d.st === 'fora' ? '<span class="rl-ruim">já abaixo</span>' : d.proj == null ? '—' : d.proj === Infinity ? 'sem queda' : nf(d.proj) + ' h'}</td>
     <td class="r">${d.prox != null ? nf(d.prox) + ' h' + (d.vencida ? `<div class="note rl-ruim">vencido há ${nf(-d.falta)} h</div>` : '') : '—'}</td><td>${balPil(BAL_CST, d.st)}${d.mot.length && d.st !== 'ok' ? '<div class="note">' + esc(d.mot[0]) + '</div>' : ''}</td><td class="nowrap"><button class="mbtn sm pri" data-balcmp="${d.b.id}">Lançar ensaio</button>${d.H.length ? ` <button class="mbtn sm" data-balcmph="${d.b.id}">Histórico</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
   <p class="note">Valores em bar, motor frio, todos os bicos fora, na rotação de partida. Fontes: manual técnico MWM 6.10 TCA (23 bar novo, 20 bar mínimo, 2 bar de diferença; confiança moderada, documento de terceiros). Cummins não publica pressão de compressão para o 6CTA 8.3: acompanha-se a diferença entre cilindros, a tendência e o blow-by.</p></div>`;
}
function balCmpModal(vid) {
  if (!balPode()) return; const b = balsaDe(vid), hr = balHor(vid);
  modal(`<h2>Lançar ensaio de compressão · ${esc(b.nome)}</h2><p class="note">${esc(BAL_MOTOR[b.mot])} · valores em bar · 6 cilindros.</p>
   <div class="g"><label class="f s3">Data<input type="date" id="bcpD" value="${isoD(hoje())}"></label><label class="f s3">Horímetro<input id="bcpH" inputmode="decimal" value="${hr ? hr.h : ''}"></label><label class="f s3">Nº da OM (Sankhya)<input id="bcpO" inputmode="numeric"></label><label class="f s3">Quem mediu<input id="bcpQ"></label></div>
   <div class="g">${[1, 2, 3, 4, 5, 6].map(i => `<label class="f s2">Cil. ${i}<input class="bcpV" inputmode="decimal"></label>`).join('')}</div><label class="f">Blow-by (valor e unidade, ou observação)<input id="bcpB"></label>
   <div class="note" id="bcpE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bcpOk">Salvar</button></div>`, true);
  $('#bcpOk').onclick = async () => { const vals = $$('#modal .bcpV').map(i => i.value.trim().replace(',', '.')), d = $('#bcpD').value, hv = $('#bcpH').value.trim().replace(',', '.'), om = $('#bcpO').value.trim();
    if (vals.filter(v => v !== '' && isFinite(+v)).length < 6) return $('#bcpE').textContent = 'Informe os 6 cilindros.'; if (!d || hv === '' || !om) return $('#bcpE').textContent = 'Informe a data, o horímetro e o nº da OM.';
    await saveRec({ id: uid('base'), kind: 'base', vessel: vid, pos: 'UN', item: 'BCMP', h: +hv, date: d, vals: vals.map(Number), un: 'bar', blowby: $('#bcpB').value.trim(), om, quem: $('#bcpQ').value.trim(), by: S.session.name, bal: true });
    if (!hr || +hv > hr.h) await saveRec({ id: uid('hor'), kind: 'hor', vessel: vid, pos: 'MB', h: +hv, date: d, by: S.session.name, bal: true });
    closeModal(); toast('Ensaio registrado.'); render(); };
}
function balCmpHistModal(vid) {
  const b = balsaDe(vid), H = balCmpHist(vid).slice().reverse();
  modal(`<div class="row"><h2>${esc(b.nome)} · ensaios de compressão</h2><span class="sp"></span><button class="mbtn" data-close>Fechar</button></div>${balCmpGraf(b)}<div class="tw"><table class="t"><thead><tr><th>Data</th><th class="r">Horímetro</th>${[1, 2, 3, 4, 5, 6].map(i => `<th class="r">C${i}</th>`).join('')}<th class="r">Dif.</th><th>Blow-by</th><th>OM</th></tr></thead><tbody>
   ${H.map(p => `<tr><td>${brD(p.date)}</td><td class="r">${p.h != null ? nf(p.h) : '—'}</td>${p.r.vals.map(v => `<td class="r"${+v === p.min ? ' style="font-weight:700;color:' + (b.mot !== 'cum' && p.min < BAL_CMP.min ? 'var(--badt)' : 'inherit') + '"' : ''}>${nf(+v, 1)}</td>`).join('')}<td class="r">${nf(p.max - p.min, 1)}</td><td>${esc(p.bb || '—')}</td><td>${esc(p.r.om || '—')}</td></tr>`).join('')}</tbody></table></div>`, true);
}
// ---------- indicadores das balsas (NP 024 item 10; aprovado pelo Supervisor em 25/10/2026) ----------
// disponibilidade = horas sem falha Crítica aberta ÷ horas do período · MTBF = horas do motor-bomba ÷ falhas · MTTR = registro da falha → resolvida (com hora)
// backlog = falhas abertas há mais de 15 dias ÷ abertas (NP 024) · % preditiva = ensaios de compressão ÷ (serviços preventivos + ensaios) · fotos: na OM do Sankhya
const BALK = { p: 'mes' };
function balPer() { const H = hoje(), y = H.getFullYear(), m = H.getMonth(), amanha = new Date(pD(isoD(H)).getTime() + 864e5);
  if (BALK.p === 'ant') return { ini: new Date(y, m - 1, 1), fim: new Date(y, m, 1), tx: 'Mês passado' };
  if (BALK.p === 'tri') return { ini: new Date(y, m - 2, 1), fim: amanha, tx: 'Últimos 3 meses' };
  if (BALK.p === 'ano') return { ini: new Date(y, 0, 1), fim: amanha, tx: 'Ano ' + y };
  return { ini: new Date(y, m, 1), fim: amanha, tx: 'Este mês' }; }
const balAt = a => a.at || +pD(a.date);   // falhas antigas sem hora: meio-dia da data
const balFim = a => a.fim ? a.fim.at : null;
function balHorasMB(vid, ini, fim) {   // horas do motor-bomba no período pelas leituras (a leitura até o início, ou a primeira do período, até a última antes do fim)
  const L = recs('hor').filter(r => r.vessel === vid && r.pos === 'MB' && !r.excluido).sort((a, b) => a.date < b.date ? -1 : 1), dI = isoD(ini), dF = isoD(new Date(fim - 864e5));
  const a = [...L].reverse().find(r => r.date <= dI) || L.find(r => r.date >= dI && r.date <= dF), b = [...L].reverse().find(r => r.date <= dF);
  return a && b && b.h >= a.h ? b.h - a.h : 0; }
function balKpi(ini, fim) {
  const ate = Math.min(+fim, Date.now()), horas = Math.max(0, (ate - ini) / 3600e3), F = recs('avaria').filter(a => !a.excluido && balsaDe(a.vessel));
  const parada = vid => F.filter(a => a.vessel === vid && a.c === 'Crítica').reduce((s, a) => { const x = Math.max(balAt(a), +ini), y = Math.min(balFim(a) || Date.now(), ate); return s + (y > x ? (y - x) / 3600e3 : 0); }, 0);
  const porB = BALSAS.map(b => ({ b, par: parada(b.id), disp: horas ? (1 - parada(b.id) / horas) * 100 : null, hMB: balHorasMB(b.id, ini, fim) }));
  const fal = F.filter(a => balAt(a) >= +ini && balAt(a) < ate), hMB = porB.reduce((s, x) => s + x.hMB, 0);
  const res = F.filter(a => balFim(a) && balFim(a) >= +ini && balFim(a) < ate), mttr = res.length ? res.reduce((s, a) => s + (balFim(a) - balAt(a)) / 3600e3, 0) / res.length : null;
  const ab = F.filter(a => !a.fim), back = ab.length ? ab.filter(a => Date.now() - balAt(a) > 15 * 864e5).length / ab.length * 100 : 0;
  const dI = isoD(ini), dF = isoD(new Date(ate - 1)), B = recs('base').filter(r => !r.excluido && balsaDe(r.vessel) && r.date >= dI && r.date <= dF), pred = B.filter(r => r.item === 'BCMP').length, prev = B.filter(r => BA1M[r.item]).length;
  return { horas, porB, fal, res, ab, hMB, disp: horas ? porB.reduce((s, x) => s + x.disp, 0) / porB.length : null, mtbf: fal.length && hMB > 0 ? hMB / fal.length : null, mttr, back, pred, prev, pPred: pred + prev ? pred / (pred + prev) * 100 : null }; }
function balBarras(L, fmt, meta, alto) {   // barras verticais no desenho do SMF: rótulos embaixo, linha da meta tracejada
  const n = L.length, W = Math.max(640, n * 44), H = 220, E = 34, T = 18, B = 34, gw = (W - E - 10) / Math.max(1, n), bw = Math.min(42, gw * .62), mx = Math.max(100, ...L.map(x => x[1] || 0)), Y = v => T + (H - T - B) * (1 - v / mx);
  let g = [0, 50, 100].map(t => `<line x1="${E}" x2="${W - 10}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${E - 6}" y="${Y(t) + 3}" text-anchor="end" font-size="10" fill="#64748B">${t}%</text>`).join('');
  L.forEach(([lab, v], i) => { const cx = E + i * gw + gw / 2; if (v != null) { const ok = alto ? v >= meta : v <= meta; g += `<rect x="${cx - bw / 2}" y="${Y(v)}" width="${bw}" height="${Y(0) - Y(v)}" rx="3" fill="${ok ? '#2563EB' : '#D93025'}"><title>${esc(lab)}: ${fmt(v)}</title></rect><text x="${cx}" y="${Y(v) - 4}" text-anchor="middle" font-size="10" fill="#0F172A">${fmt(v)}</text>`; }
    g += `<text x="${cx}" y="${H - 18}" text-anchor="middle" font-size="10" fill="#475569">${esc(lab)}</text>`; });
  g += `<line x1="${E}" x2="${W - 10}" y1="${Y(meta)}" y2="${Y(meta)}" stroke="#D97706" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${E + 4}" y="${Y(meta) + 12}" font-size="10" fill="#B06000">meta ${meta}%</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>`; }
function vBalKpi() {
  const P = balPer(), K = balKpi(P.ini, P.fim), ant = (() => { const d = P.fim - P.ini; return balKpi(new Date(+P.ini - d), P.ini); })();
  const card = (nome, v, a, fmt, meta, ok, como) => `<div class="card bal-k"><div class="bal-kn">${nome}</div><div class="bal-kv" style="color:${v == null ? '#64748B' : ok(v) ? '#188038' : '#C5221F'}">${v == null ? '—' : fmt(v)}</div>
    <div class="bal-km"><span class="pill p-mut">meta ${meta}</span> ${v == null ? '<span class="pill p-mut">sem dados</span>' : ok(v) ? '<span class="pill p-ok">atende</span>' : '<span class="pill p-bad">fora da meta</span>'}</div><div class="note">Anterior: ${a == null ? '—' : fmt(a)}</div><div class="note">${como}</div></div>`;
  const pc = v => nf(v, 1) + '%', hh = v => nf(v) + ' h', h1 = v => nf(v, 1) + ' h';
  const y = P.ini.getFullYear(), hm = hoje().getFullYear() === y ? hoje().getMonth() : 11, A = Array(12).fill(0).map(() => ({ ok: 0, den: 0 }));
  BALSAS.forEach(b => { const d = balCxBalsa(b, y); for (let i = 0; i <= Math.min(hm, 11); i++) { A[i].ok += d.Ok[i]; A[i].den += d.Ok[i] + d.Lt[i] + d.Ms[i]; } });
  const eq = {}; K.fal.forEach(a => { const k = a.sis || 'Não informado'; (eq[k] = eq[k] || []).push(a); });
  const E = Object.entries(eq).map(([k, L]) => [k, L.length]).sort((a, b) => b[1] - a[1]);
  const det = RM_DET && RM_DET.t === 'par' && eq[RM_DET.k] ? eq[RM_DET.k] : null;
  return balCab('Indicadores das balsas', `${P.tx} · ${brD(isoD(P.ini))} a ${brD(isoD(new Date(Math.min(+P.fim, Date.now()) - 1)))} · metas da NP 024 item 10 · anterior = período de mesmo tamanho logo antes`,
    `<div class="seg">${[['mes', 'Este mês'], ['ant', 'Mês passado'], ['tri', '3 meses'], ['ano', 'Ano']].map(([k, t]) => `<button data-balkp="${k}" class="${BALK.p === k ? 'on' : ''}">${t}</button>`).join('')}</div>`)
   + `<div class="bal-kg">${card('Disponibilidade da frota', K.disp, ant.disp, pc, '≥ 95%', v => v >= 95, 'Horas sem falha Crítica aberta ÷ horas do período, média das 29 balsas. Serviço vencido não entra.')}
     ${card('MTBF', K.mtbf, ant.mtbf, hh, '≥ 500 h', v => v >= 500, `Horas do motor-bomba (${nf(K.hMB)} h) ÷ falhas registradas (${K.fal.length}).${K.fal.length && !K.hMB ? ' Sem leitura de horímetro no período.' : ''}`)}
     ${card('MTTR', K.mttr, ant.mttr, h1, '≤ 8 h', v => v <= 8, `Do registro da falha até “Resolvida”, nas ${K.res.length} falhas resolvidas no período.`)}
     ${card('Backlog', K.back, null, pc, '≤ 5%', v => v <= 5, `Hoje: falhas abertas há mais de 15 dias ÷ falhas abertas (${K.ab.length}).`)}
     ${card('% manutenção preditiva', K.pPred, ant.pPred, pc, '≥ 30%', v => v >= 30, `Ensaios de compressão (${K.pred}) ÷ serviços preventivos e ensaios (${K.prev + K.pred}). Pela fórmula da NP, a meta de 30% não é alcançável com o plano atual: revisar na NP 024.`)}
     <div class="card bal-k"><div class="bal-kn">Registro fotográfico</div><div class="bal-kv" style="color:#64748B">Sankhya</div><div class="bal-km"><span class="pill p-mut">meta 100%</span></div><div class="note">As fotos de antes e depois das balsas ficam na OM do Sankhya (NP 024 6.4 e 9); o SMF não tem como medir.</div></div></div>
   <div class="rl-2c bal-2c"><div class="card"><h2>Aderência ao cronograma · ${y}</h2>${balBarras(A.map((x, i) => [PR_MES[i], i <= hm && x.den ? x.ok / x.den * 100 : null]), v => Math.round(v) + '%', 90, true)}<p class="note">Feito no prazo ÷ o que venceu no mês (cronograma das balsas). Vermelho = abaixo de 90%.</p></div>
     <div class="card"><h2>Falhas por equipamento · ${K.fal.length}</h2>${E.length ? rmPareto(E) : '<p class="note">Nenhuma falha registrada no período.</p>'}${E.length ? '<p class="note">Clique numa barra para ver as falhas.</p>' : ''}
       ${det ? `<div class="rm-det"><b>${esc(RM_DET.k)}</b><ul class="bal-ag">${det.map(a => `<li>${brD(a.date)} · <a href="#balft/${a.vessel}"><b>${esc(vName(a.vessel))}</b></a> · <span class="pill ${a.c === 'Crítica' ? 'p-bad' : a.c === 'Alta' ? 'p-warn' : 'p-mut'}">${esc(a.c)}</span> ${esc(a.desc)}${a.om ? ' · OM ' + esc(a.om) : ''}${a.fim ? ' · resolvida' : ' · <b class="rl-ruim">aberta</b>'}</li>`).join('')}</ul></div>` : ''}</div></div>
   <div class="card"><h2>Disponibilidade por balsa</h2>${balBarras(K.porB.map(x => [x.b.nome.replace('VDA ', ''), x.disp]), v => Math.round(v) + '%', 95, true)}<p class="note">Horas sem falha Crítica aberta no período. Vermelho = abaixo de 95%.</p></div>`;
}
// tendência da compressão: menor cilindro × horímetro, com a linha do mínimo (MWM)
function balCmpGraf(b) {
  const H = balCmpHist(b.id).filter(p => p.h != null); if (H.length < 2) return '<p class="note">Gráfico com 2 ensaios ou mais com horímetro.</p>';
  const W = 640, Hh = 220, E = 40, T = 16, B = 30, x0 = Math.min(...H.map(p => p.h)), x1 = Math.max(...H.map(p => p.h)), mwm = b.mot !== 'cum', lo = Math.min(mwm ? BAL_CMP.min - 1 : 99, ...H.map(p => p.min)) - .5, hi = Math.max(mwm ? BAL_CMP.novo : 0, ...H.map(p => p.max)) + .5;
  const X = h => E + (W - E - 14) * (x1 > x0 ? (h - x0) / (x1 - x0) : .5), Y = v => T + (Hh - T - B) * (1 - (v - lo) / (hi - lo));
  let g = [lo, (lo + hi) / 2, hi].map(t => `<line x1="${E}" x2="${W - 14}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${E - 6}" y="${Y(t) + 3}" text-anchor="end" font-size="10" fill="#64748B">${nf(t, 1)}</text>`).join('');
  if (mwm) g += `<line x1="${E}" x2="${W - 14}" y1="${Y(BAL_CMP.min)}" y2="${Y(BAL_CMP.min)}" stroke="#D93025" stroke-dasharray="5 4"/><text x="${W - 16}" y="${Y(BAL_CMP.min) - 4}" text-anchor="end" font-size="10" fill="#C5221F">mínimo ${BAL_CMP.min} bar</text>`;
  g += `<polyline points="${H.map(p => X(p.h) + ',' + Y(p.max)).join(' ')}" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3 3"/><polyline points="${H.map(p => X(p.h) + ',' + Y(p.min)).join(' ')}" fill="none" stroke="#2563EB" stroke-width="2"/>`
    + H.map(p => `<circle cx="${X(p.h)}" cy="${Y(p.min)}" r="4" fill="#2563EB"><title>${brD(p.date)} · ${nf(p.h)} h · menor ${nf(p.min, 1)} bar (C${p.cil})</title></circle><text x="${X(p.h)}" y="${Hh - 12}" text-anchor="middle" font-size="10" fill="#475569">${nf(p.h)} h</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" style="display:block">${g}</svg><p class="note">Azul = menor cilindro · cinza tracejado = maior cilindro · bar × horímetro do motor-bomba.</p>`; }
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
  const H = [...recs('base').filter(r => r.vessel === b.id && !r.excluido && BA1M[r.item]).map(r => ({ d: r.date, tx: `${r.item} ${BA1M[r.item].eq}: executado${r.h != null && r.h !== '' ? ' com ' + nf(r.h) + ' h' : ''}${r.om ? ' · OM ' + r.om : ''}${r.cert ? ' · cert. ' + r.cert : ''}${r.estaleiro ? ' · ' + r.estaleiro : ''}${r.quem && !r.estaleiro ? ' · ' + r.quem : ''}${r.obs ? ' · ' + r.obs : ''}`, by: r.by })),
    ...balCmpHist(b.id).map(p => ({ d: p.date, tx: `Ensaio de compressão: menor ${nf(p.min, 1)} bar (C${p.cil}), diferença ${nf(p.max - p.min, 1)} bar${p.bb ? ' · blow-by ' + p.bb : ''}${p.r.om ? ' · OM ' + p.r.om : ''}`, by: p.r.by })),
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
   <div class="g"><label class="f s3">Balsa<select id="bfV">${BALSAS.map(b => `<option value="${b.id}"${b.id === vid ? ' selected' : ''}>${esc(b.nome)}</option>`).join('')}</select></label><label class="f s3">Data<input type="date" id="bfD" value="${isoD(hoje())}"></label><label class="f s3">Hora<input type="time" id="bfH" value="${new Date().toTimeString().slice(0, 5)}"></label><label class="f s3">Classe<select id="bfC">${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `<option>${c}</option>`).join('')}</select></label><label class="f s3">Nº da OM (Sankhya)<input id="bfO" inputmode="numeric" placeholder="se já aberta"></label></div>
   <label class="f">Equipamento<select id="bfQ">${[...new Set(BA1.map(t => t.eq))].concat(['Rede de carga e tubulações', 'Tanques', 'Outro']).map(q => `<option>${esc(q)}</option>`).join('')}</select></label><label class="f">O que aconteceu<input id="bfX"></label>
   <p class="note">Crítica (NP 024 6.1): lubrificação, refrigeração e arrefecimento, injeção, sistema elétrico, estanqueidade, bombeio, dutos, válvulas de segurança, eixo ou rotor da bomba.</p><div class="note" id="bfE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bfOk">Salvar</button></div>`, true);
  $('#bfOk').onclick = async () => { const desc = $('#bfX').value.trim(), hora = $('#bfH').value || '12:00'; if (!desc) return $('#bfE').textContent = 'Descreva a falha.'; if (!$('#bfD').value) return $('#bfE').textContent = 'Informe a data.';
    await saveRec({ id: uid('avaria'), kind: 'avaria', vessel: $('#bfV').value, date: $('#bfD').value, c: $('#bfC').value, om: $('#bfO').value.trim(), sis: $('#bfQ').value, pos: 'UN', desc, quem: S.session.name, meio: 'FR 027_A / tripulação', hora, at: +new Date($('#bfD').value + 'T' + hora), by: S.session.name, bal: true });
    closeModal(); toast('Falha registrada.'); render(); };
}
function balFimModal(id) {   // liberação da balsa: data e hora contam no MTTR
  if (!balPode()) return; const r = S.recs.get(id); if (!r) return; const a = new Date();
  modal(`<h2>Falha resolvida · ${esc(vName(r.vessel))}</h2><p class="note">${esc(r.c)} · ${esc(r.desc)}. Data e hora em que a balsa foi liberada (o MTTR conta do registro da falha até aqui).</p>
   <div class="g"><label class="f s3">Data<input type="date" id="bxD" value="${isoD(a)}"></label><label class="f s3">Hora<input type="time" id="bxH" value="${a.toTimeString().slice(0, 5)}"></label><label class="f s3">Nº da OM (Sankhya)<input id="bxO" value="${esc(r.om || '')}"></label></div>
   <div class="note" id="bxE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bxOk">Salvar</button></div>`);
  $('#bxOk').onclick = async () => { const t = +new Date($('#bxD').value + 'T' + ($('#bxH').value || '12:00')), om = $('#bxO').value.trim(); if (!$('#bxD').value) return $('#bxE').textContent = 'Informe a data.';
    if (t < balAt(r)) return $('#bxE').textContent = 'A liberação não pode ser antes do registro da falha.'; if (!om) return $('#bxE').textContent = 'Informe o nº da OM encerrada no Sankhya.';
    await saveRec(Object.assign({}, r, { om, fim: { at: t, by: S.session.name } })); closeModal(); toast('Falha resolvida.'); render(); };
}
function balCsnModal(vid) {
  if (!balPode()) return; const b = balsaDe(vid), c = balCsn(vid);
  modal(`<h2>Data-limite do CSN · ${esc(b.nome)}</h2><p class="note">Data-limite da vistoria em seco do certificado. Manda no prazo da docagem (B10.1), da revisão das válvulas de gaveta (B5.4) e da recertificação da PSV (B6.3).</p><div class="g"><label class="f s3">Data-limite<input type="date" id="bcD" value="${c && c.date ? c.date : ''}"></label><label class="f s6">Observação<input id="bcO" value="${esc(c && c.obs || '')}"></label></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="bcOk">Salvar</button></div>`);
  $('#bcOk').onclick = async () => { if (!$('#bcD').value) return toast('Informe a data.'); await saveRec({ id: uid('doclim'), kind: 'doclim', vessel: vid, date: $('#bcD').value, obs: $('#bcO').value.trim(), by: S.session.name, bal: true }); closeModal(); toast('Data-limite salva.'); render(); };
}
function balAfter() {
  const m = $('#main'); m.onclick = async e => { const t = e.target.closest('[data-balexe],[data-balhor],[data-balfalha],[data-balcsn],[data-balfim],[data-balf],[data-balano],[data-balft],[data-balcrb],[data-baldoca],[data-balcal],[data-balcmp],[data-balcmph],[data-balkp]'); if (!t) return; const d = t.dataset;
    if (d.balkp !== undefined) { BALK.p = d.balkp; RM_DET = null; return render(); }
    if (d.balcrb !== undefined) { e.preventDefault(); BALCR.b = d.balcrb; return render(); }
    if (d.baldoca !== undefined) return balDocaModal(d.baldoca);
    if (d.balcal !== undefined) return balCalModal(d.balcal);
    if (d.balcmp !== undefined) return balCmpModal(d.balcmp);
    if (d.balcmph !== undefined) return balCmpHistModal(d.balcmph);
    if (d.balexe !== undefined) { const [v, i] = d.balexe.split('|'); return balExeModal(v, i); }
    if (d.balhor !== undefined) return balHorModal(d.balhor);
    if (d.balfalha !== undefined) return balFalhaModal(d.balfalha);
    if (d.balcsn !== undefined) return balCsnModal(d.balcsn);
    if (d.balfim !== undefined) return balFimModal(d.balfim);
    if (d.balf !== undefined) { BALF.f = d.balf; return render(); }
    if (d.balano !== undefined) { BALCR.ano = +d.balano; return render(); }
    if (d.balft !== undefined) go('#balft/' + d.balft); };
}
Object.assign(VX, { bal: vBal, balcr: vBalCr, balpl: vBalPl, baldoca: vBalDoca, balcal: vBalCal, balcmp: vBalCmp, balkpi: vBalKpi, balft: vBalFt }); BAL_VIEWS.forEach(([k]) => { AFTER[k] = balAfter; });
// menu da frota de balsas (renderNav chama quando FROTA_TIPO = 'bal')
function balNav() {
  const it = (k, n, ic) => `<a href="#${k}" class="${VIEW === k ? 'on' : ''}">${ico(ic)}<span>${n}</span>${k === 'bal' ? (n2 => n2 ? `<span class="n">${n2}</span>` : '')(BALSAS.filter(b => balEstado(b).st === 'bloq').length) : ''}</a>`;
  return '<div class="grp-t grp-trab">Balsas petroleiras</div>' + it('bal', 'Situação das balsas', 'hoje') + it('balcr', 'Cronograma', 'crono') + it('balpl', 'Plano preventivo', 'plan') + it('baldoca', 'Docagem', 'cons') + it('balcal', 'Plano de calibração', 'cond2') + it('balcmp', 'Compressão dos motores', 'compr') + it('balkpi', 'Indicadores', 'graf') + it('balft', 'Ficha técnica', 'barcos')
    + '<div class="grp-t grp-apoio">Suporte</div>' + it('bib', 'Biblioteca', 'bib') + it('admin', 'Administração', 'adm'); }
// ---------- dados de exemplo das balsas (seed: some em “Limpar dados de exemplo”) ----------
async function balExemplo() {
  if (!temExemplo() || S.recs.has('ex-bal-v5')) return;
  let sd = 2421; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280, agora = Date.now(), put = [], base = { seed: true, createdAt: agora, updatedAt: agora, by: 'Supervisor (exemplo)', bal: true };
  const dia = n => isoD(new Date(hoje().getTime() - n * 864e5));
  BALSAS.forEach((b, i) => { const tx = 1.5 + R() * 3.5, h1 = Math.round(3000 + R() * 9000), h0 = Math.round(h1 - tx * 60);
    put.push(Object.assign({ id: 'ex-balh0-' + b.id, kind: 'hor', vessel: b.id, pos: 'MB', h: h0, date: dia(65) }, base), Object.assign({ id: 'ex-balh1-' + b.id, kind: 'hor', vessel: b.id, pos: 'MB', h: h1, date: dia(5) }, base));
    put.push(Object.assign({ id: 'ex-balcsn-' + b.id, kind: 'doclim', vessel: b.id, date: isoD(addM(hoje(), 6 + Math.round(R() * 40))), obs: 'Certificado (exemplo)' }, base));
    balItens(b).forEach(t => { const iv = balIv(t), atr = R(), fr = i % 6 === 2 && atr < .3 ? 1.08 + R() * .3 : atr < .12 ? .9 + R() * .09 : R() * .8;   // vencidos só em 1 de cada 6 balsas; ~12% em breve
      const dias = iv.m ? Math.round(iv.m * 30.4 * fr) : Math.round((iv.h || 500) / tx * fr), hFeito = iv.h ? Math.round(h1 + tx * 5 - iv.h * fr) : null;
      const ex = Object.assign({ id: 'ex-bals-' + b.id + '-' + t.id, kind: 'base', vessel: b.id, pos: 'UN', item: t.id, h: hFeito != null && hFeito > 0 ? hFeito : null, date: dia(Math.max(1, Math.min(dias, 3650))), om: String(46000 + i * 40 + Math.round(R() * 30)), quem: t.exec + ' (exemplo)' }, base);
      if (['B6.2', 'B6.4', 'B12.1', 'B2.3', 'B3.3', 'B4.2'].includes(t.id)) ex.cert = 'CC-' + (2026 - (dias > 365 ? 1 : 0)) + '-' + String(100 + i * 7 + t.id.length).padStart(4, '0');
      if (t.id === 'B10.1') { const sai = new Date(pD(ex.date).getTime() + (12 + Math.round(R() * 18)) * 864e5); Object.assign(ex, { saida: isoD(sai), estaleiro: ['Estaleiro Rio Negro (exemplo)', 'Estaleiro Juruá (exemplo)', 'Estaleiro São Raimundo (exemplo)'][i % 3], servicos: 'Jateamento e pintura do casco, medição de espessura, desgaseificação dos tanques', custo: Math.round(90 + R() * 160) });
        put.push(Object.assign({}, ex, { id: 'ex-balsd-' + b.id, date: isoD(addM(pD(ex.date), -60 - Math.round(R() * 4))), saida: isoD(addM(sai, -60)), custo: Math.round(70 + R() * 120), om: String(30000 + i) })); }
      put.push(ex); });
    const mw = b.mot !== 'cum', n0 = mw ? 21.6 + R() * 1.2 : 26 + R() * 3; [[2, Math.round(2000 / tx)], [1, Math.round(1000 / tx)], [0, 0]].forEach(([k, dd]) => { const qd = (2 - k) * (b.nome === 'VDA XI' ? 0.9 : 0.25 + R() * 0.2), hk = Math.round(h1 - tx * (dd + 40));
      const vals = [1, 2, 3, 4, 5, 6].map(c => +(n0 - qd - (c === 4 && b.nome === 'VDA XVI' ? 2.4 : R() * 0.8)).toFixed(1));
      put.push(Object.assign({ id: 'ex-balc-' + b.id + '-' + k, kind: 'base', vessel: b.id, pos: 'UN', item: 'BCMP', h: hk > 0 ? hk : null, date: dia(dd + 40), vals, un: 'bar', blowby: mw ? '' : (40 + Math.round(R() * 30)) + ' L/min', om: String(47000 + i * 3 + k), quem: 'Diesel Norte (exemplo)' }, base)); }); });
  [['bal7', 'Crítica', 'Bomba centrífuga', 'Vazamento no selo mecânico da bomba de carga'], ['bal14', 'Alta', 'Luzes de navegação', 'Luz de mastro apagada'], ['bal22', 'Média', 'Válvulas de gaveta', 'Gaxeta da válvula de descarga com gotejamento']]
    .forEach(([v, c, q, x], k) => put.push(Object.assign({ id: 'ex-balav-' + k, kind: 'avaria', vessel: v, date: dia(1 + k), c, sis: q, pos: 'UN', desc: x + ' (exemplo)', om: k === 2 ? '' : String(48300 + k), quem: 'Operador de Medição (exemplo)', meio: 'FR 027_A', at: agora - (1 + k) * 864e5 }, base)));
  [['bal3', 'Crítica', 'Bomba centrífuga', 'Rolamento do mancal da bomba aquecendo', 12, 6], ['bal9', 'Alta', 'Válvulas de gaveta', 'Vazamento pela gaxeta da válvula de sucção', 20, 3], ['bal18', 'Crítica', 'Motor MWM 6.10 TCA', 'Motor-bomba não parte: motor de arranque', 35, 11],
   ['bal25', 'Média', 'Baterias', 'Bateria do alarme de nível descarregada', 41, 2], ['bal5', 'Alta', 'Luzes de navegação', 'Luz de fundeio apagada', 58, 5], ['bal12', 'Crítica', 'Alarme de nível alto', 'Alarme de nível sem sinal sonoro', 70, 9], ['bal21', 'Alta', 'Motor Cummins Série C', 'Vazamento de óleo no cárter do motor-bomba', 95, 14]]
    .forEach(([v, c, q, x, d, dur], k) => { const at = +pD(dia(d)) - 3.5 * 36e5; put.push(Object.assign({ id: 'ex-balavr-' + k, kind: 'avaria', vessel: v, date: dia(d), hora: '08:30', c, sis: q, pos: 'UN', desc: x + ' (exemplo)', om: String(48200 + k), quem: 'Operador de Medição (exemplo)', meio: 'FR 027_A', at, fim: { at: at + dur * 36e5, by: 'Supervisor (exemplo)' } }, base)); });
  put.push(Object.assign({ id: 'ex-bal-v5', kind: 'marca' }, base));
  put.forEach(r => S.recs.set(r.id, r)); if (MEM) put.forEach(r => MEM.set(r.id, r)); else await DB.putMany(put);
  if (typeof render === 'function' && S.session) render();
}
(async () => { for (let i = 0; i < 120; i++) { if (typeof S !== 'undefined' && S.pronto) break; await new Promise(r => setTimeout(r, 500)); } await new Promise(r => setTimeout(r, 3500)); try { await balExemplo(); } catch (e) { console.warn('balExemplo', e); } })();
{ const st = document.createElement('style'); st.textContent = `.bal-t td{vertical-align:top}.bal-t td:first-child{white-space:nowrap}.bal-dv{background:#FCE8E6;color:#C5221F;font-weight:700}.bal-dp{background:#FEF7E0;color:#B06000;font-weight:700}.bal-ag{margin:4px 0;padding-left:0;list-style:none}.bal-ag li{padding:5px 0;border-bottom:1px solid #EEF2F6;font-size:13px}.bal-ag li:last-child{border:0}
.nowrap{white-space:nowrap}
.bal-dados{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px 18px}.bal-dados>div{display:flex;flex-direction:column;gap:2px}.bal-dados b{font-size:13.5px}
.bal-ck{display:flex;flex-direction:column;gap:6px;max-height:46vh;overflow:auto;border:1px solid #E3E8EF;border-radius:8px;padding:8px 10px;margin:8px 0}.bal-ck label{font-size:13px;line-height:1.35;display:block}
.bal-kg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-bottom:12px}.bal-k{margin:0!important;display:flex;flex-direction:column;gap:4px}.bal-kn{font-weight:600;color:#1F2A44}.bal-kv{font-size:30px;font-weight:700;line-height:1.1}.bal-km{display:flex;gap:6px;flex-wrap:wrap}.bal-2c{margin-bottom:12px}@media(max-width:760px){.bal-2c{grid-template-columns:1fr}}`; document.head.appendChild(st); }
