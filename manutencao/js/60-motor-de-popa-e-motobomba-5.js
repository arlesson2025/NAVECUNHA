/* ===== Motor de popa e motobomba 5 HP: troca de óleo a cada saída do comboio (Anexo I 11.1.2 e 11.3.2) =====
   Decisão do Supervisor (22/10/2026), desfazendo em parte a remoção de 18/10: os dois voltam só para a TROCA DE ÓLEO (as inspeções 11.1.1/11.3.1 seguem fora).
   Sem horímetro: a troca vale por saída. Empurrador no porto sem FR 049_B dessa troca desde a última chegada = troca pendente;
   "Saiu de viagem" com troca pendente = RESTRIÇÃO (justificativa + foto do FR 027_L de saída). Itens com kind 'saida' (fora do cronograma e da Fazer preventiva). */
'use strict';
// data da última chegada: FR 027_L de chegada ou "está no porto"
function ultChegada(v) { const fr = recs('fr027').filter(r => r.vessel === v.id && r.mov !== 'saida').map(r => r.date).sort().pop() || ''; const st = situDe(v) && v.situ.st === 'porto' ? String(v.situ.at || '').slice(0, 10) : ''; return [fr, st].sort().pop() || ''; }
// equipamentos de troca a cada saída ainda sem troca desde a última chegada (só com o empurrador no porto)
function popaPend(v) { if (!v || foraOp(v) || !situDe(v) || v.situ.st !== 'porto') return []; const ch = ultChegada(v); if (!ch) return [];
  return lubEquip(v).filter(e => (e.key === 'popa' || e.key === 'bomba') && (() => { const u = ultimoServico(v.id, 'UN', e.itens[0]); return !u || u.date < ch; })()); }
const popaDo = e => e.key === 'popa' ? 'do motor de popa' : 'da motobomba 5 HP';
function popaSit(v, e, s) { const pend = popaPend(v).some(x => x.key === e.key), u = ultimoServico(v.id, 'UN', e.itens[0]);
  return Object.assign({}, s, { st: pend ? 'venc' : u ? 'ok' : 'sem', rest: null, alvoH: null, alvoD: null, txt: pend ? 'trocar antes de sair (troca a cada saída do comboio)' : 'troca a cada saída do comboio' + (u ? ' · última ' + brD(u.date) : '') }); }
