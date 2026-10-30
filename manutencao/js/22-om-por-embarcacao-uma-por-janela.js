/* ===== OM por empurrador (uma por janela) · ficha checklist para a equipe de terra · lançamento rápido · rotina do dia ===== */
'use strict';
ETAPAS_P[1][1] = 'Em execução'; ETAPAS_P[2][1] = 'Executada';
const omGrupo = g => oms().filter(o => o.tipo === 'P' && o.grupo === g).sort((a, b) => (a.parte || 0) - (b.parte || 0));
const grpOrd = ETAPAS_P.map(x => x[0]);
const grpStatus = P => grpOrd[Math.min(...P.map(o => Math.max(0, grpOrd.indexOf(o.status))))];

const grpNext = { emitida: ['abordo', 'Registrar início do serviço'], abordo: ['executada', 'Terminou a execução'], executada: ['conferencia', 'Lançar a ficha'] };
const ivEmb = (t, v, p) => { const iv = intervalo(t, v, p); return [iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' m' : ''].filter(Boolean).join(' / '); };
const ladoMCA = (v, p) => { const l = v && v.mcaLoc && v.mcaLoc[p] ? v.mcaLoc[p] : ''; return /^bomb/i.test(l) ? 'BB' : /^bores/i.test(l) ? 'BE' : ''; };
const posCurtoE = (v, p) => { if (p === 'UN') return 'Empurrador'; if (isMcp(p)) return p === 'CE' || mcpPos(v).length < 2 ? 'MCP' : 'MCP ' + p; if (p === 'MCA3') return 'Motobomba de incêndio (MCA 3)'; if (MCAS.includes(p)) { const n = MCAS.filter(k => v && v.mca && v.mca[k] && k !== 'MCA3').length, l = ladoMCA(v, p); return n < 2 ? 'MCA' : l ? 'MCA ' + l : posNome(v, p); } return posNome(v, p); };

/* ---------- 1 · Programação: uma OM por empurrador ---------- */
function foraJanela(id, v, pos) { if (id === DOCA.item || (DOCA.junto || []).includes(id)) return true; if (!v || !pos) return false; const tr = trilha(v, pos, A1M[id]); return tr === 'bordo' || tr === 'doca'; }   // docagem, o que só se faz em dique e o que vai na troca de óleo: fora da OM de janela   // docagem e o que só se faz em dique: planejamento próprio



/* ---------- 2 · Ficha impressa: checklist em poucas folhas ---------- */


/* ---------- 3 · Quadro de OMs: uma linha por OM do empurrador ---------- */
async function grpAvancar(g, st) {
  const P = omGrupo(g), i = grpOrd.indexOf(st);
  for (const o of P) if (grpOrd.indexOf(o.status) < i) { o.status = st; (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: omStatusTxt(o) }); if (st === 'abordo' && !o.inicio) o.inicio = isoDT(hoje()); await saveRec(o); }
}

/* ---------- 4 · Lançamento rápido da ficha (OM inteira numa tela) ---------- */



/* Lançar OM num bloco só (24/10/2026): faixa-guia (guiaOM) + lançamento + histórico; antes eram 3 camadas por cima (troca de "ficha", histórico e faixa-guia) */





{ const s = SECOES.find(x => x.id === 'exec'); if (s) s.extra = (s.extra || []).concat(['omg']); }

/* ---------- 5 · Rotina do dia: o que fazer, em ordem, por empurrador ---------- */

{ const s = SECOES.find(x => x.id === 'inicio'); if (s) { s.nome = '0 · Rotina do dia'; s.views.unshift(['rotina', 'Rotina do dia']); s.views = s.views.slice(0, 1); }
  const pg = { id: 'painel', nome: '1 · Painel de gestão', views: [['geral', 'Painel de gestão']] }; ICO.painel = ICO.inicio; const i = SECOES.findIndex(x => x.id === 'inicio'); SECOES.splice(i + 1, 0, pg);
  ICO.inicio = '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'; }
if (!location.hash) { try { history.replaceState(null, '', '#rotina'); } catch (e) { } if (typeof VIEW !== 'undefined' && VIEW === 'geral' && S.cfg) { VIEW = 'rotina'; } }

