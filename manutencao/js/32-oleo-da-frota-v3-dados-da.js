/* ===== Óleo da frota v3: dados da tela (o3Dados) + coluna Cárter da matriz de lubrificação · a tela fica no bloco "Óleo da frota no padrão do painel" ===== */
'use strict';
// capDe passa a levar também o texto do cárter da matriz (ex.: "140 L", "≈ 65 L") e a observação
if (typeof LAY_VIEWS !== 'undefined') { const i = LAY_VIEWS.indexOf('oleo'); if (i >= 0) LAY_VIEWS.splice(i, 1); }
const O3 = {
  S: (k, v) => { try { localStorage.setItem('oleo_' + k, JSON.stringify(v)); } catch (e) { } },
  G: (k, d) => { try { const v = localStorage.getItem('oleo_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  open: null, mode: null, ves: null, L: null, z: 5
};
const o3nf = n => Math.round(n).toLocaleString('pt-BR');
const o3nome = (v, e) => String(eqNomeC(v, e) || '').replace(/^Motobomba de incêndio.*$/, 'Motobomba').replace(/^Governo.*$/, 'Governo').replace(/ \(Linha de centro\)/, ' LC');
function o3Carter(e) {
  if (e.carterTxt) return { t: e.carterTxt, s: e.carterSub };
  const r = e.key === 'inc' ? LUB_PLANO.find(x => /motobomba/i.test(x.eq)) : null;
  return r ? { t: r.carter || '', s: r.carterSub || '' } : { t: e.cap ? String(e.cap).replace('.', ',') + ' L' : '—', s: '' };
}
function o3Dados() {
  const H = hoje(), F = [], ENG = [];
  lubDados().filter(x => !x.saida && !foraOp(x.v)).forEach(x => {
    const v = x.v, e = x.e, hr = horAtual(v.id, lubHp(v, e)), iv = intervalo(x.t, v, e.pos), L = x.s.L || null;
    let b = F.find(f => f.id === v.id); if (!b) { const s = situDe(v); b = { id: v.id, n: v.nome, st: s ? s.st : '' }; F.push(b); }
    const sem = x.horas == null, porD = !sem && (x.porData || !iv.h), u = porD ? 'd' : 'h';
    const val = sem ? null : porD ? Math.round(x.dias) : Math.round(x.horas);
    const I = porD ? (iv.m ? iv.m * 30.44 : 365) : iv.h;
    const proxD = x.dias != null ? new Date(H.getTime() + x.dias * 864e5) : (x.s.alvoD || null);
    const c = o3Carter(e);
    ENG.push({ b: b.n, vid: v.id, g: e.key === 'inc' ? 'inc' : e.g, name: o3nome(v, e), car: c.t, carS: c.s, atual: hr ? hr.h : null, ultH: L && L.h != null ? L.h : null, ultD: L && L.date ? pD(L.date) : null,
      proxH: x.s.alvoH != null ? x.s.alvoH : null, proxD, v: val, u, sem,
      restTxt: sem ? 'sem hist.' : (val < 0 ? '−' : '') + o3nf(Math.abs(val)) + ' ' + u,
      pct: sem ? 0 : Math.max(0, Math.min(1, val / (I || 1))),
      st: sem ? 'sem' : val < 0 ? 'red' : ((u === 'h' && val <= 50) || (u === 'd' && val <= 7)) ? 'amber' : 'green',
      daysLeft: proxD ? (proxD - H) / 864e5 : 1e9 });
  });
  return { F: F.filter(b => ENG.some(e => e.vid === b.id)), ENG };
}

