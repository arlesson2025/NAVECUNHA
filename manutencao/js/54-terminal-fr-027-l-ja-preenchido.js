/* ===== Terminal: FR 027_L já preenchido com o que o SMF sabe; FR 022_B (SESMT) vencido avisa =====
   Saída: "OMs pendentes da chegada" vem das corretivas abertas pelas NO do FR 027_L de chegada (resolvidas / em aberto com os números / não há).
   Chegada e saída: data da última inspeção do SESMT (FR 022_B) vem do último FR 027_L do empurrador; vencida (> 30 dias) entra no Hoje. */
'use strict';
const FR22_DIAS = 30;
const fr22Ult = vid => { const r = fr27s(vid).filter(x => x.fr22 && x.fr22.date).pop(); return r ? r.fr22.date : null; };
const fr22Vencido = vid => { const d = fr22Ult(vid); return d ? Math.floor((hoje() - pD(d)) / 864e5) > FR22_DIAS : false; };
function omsDaChegada(vid) { const r = fr27s(vid).filter(x => x.mov === 'chegada').pop(); if (!r) return null;
  const nums = [...new Set((r.nc || []).map(x => x.o).filter(o => /^\d{3,}$/.test(o || '')))], abertas = nums.filter(n => { const o = oms().find(x => x.num === n); return o && o.status !== 'encerrada'; });
  return { r, nums, abertas }; }
