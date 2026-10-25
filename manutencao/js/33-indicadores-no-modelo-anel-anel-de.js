/* ===== Indicadores no modelo "anel": anel de progresso até a meta, nome, fórmula curta e periodicidade ===== */
const KR_INFO = {
  'Disponibilidade da frota': ['Disponibilidade da frota', '(Horas calendário − horas paradas) ÷ horas calendário'],
  'MTBF': ['MTBF', 'Horas de operação ÷ nº de falhas (12 meses)'],
  'MTTR': ['MTTR', 'Soma dos tempos de reparo ÷ nº de falhas'],
  'Backlog': ['Backlog', 'OM em atraso ÷ total de OM em aberto'],
  'Cumprimento do plano preditivo': ['Plano preditivo', 'Análises de óleo e tendência realizadas ÷ programadas'],
  'Conformidade de fotos': ['Registro fotográfico', 'OM encerradas com fotos antes/depois ÷ total']
};
function kpiCard(nome, val, unit, metaTxt, ok, chart, formula, freq, dec = 1) {
  const sem = val === null || val === undefined || isNaN(val), info = KR_INFO[nome] || [nome, ''], menor = /≤/.test(metaTxt);
  const meta = parseFloat(String(metaTxt).replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
  const pct = sem ? 0 : menor ? (val <= meta ? 1 : Math.max(.04, meta / val)) : (meta ? Math.max(0, Math.min(1, val / meta)) : 1);
  const cor = sem ? '#CBD5E1' : ok ? '#16A34A' : '#DC2626', C = 2 * Math.PI * 31;
  const txt = sem ? '—' : fmtv(val, dec) + (unit.trim() === '%' ? '%' : ' ' + unit.trim());
  const fq = String(freq || '').split('·')[0].trim();
  const st = sem ? '<span class="kr-t sem">sem dados</span>' : ok ? '<span class="kr-t ok">atende</span>' : '<span class="kr-t bad">fora da meta</span>';
  return `<div class="card kc kr" data-lk="Indicador ${esc(info[0])}" title="${esc(formula)}">
   <div class="kr-a"><svg viewBox="0 0 84 84" width="84" height="84"><circle cx="42" cy="42" r="39" fill="none" stroke="#A9C4F2" stroke-width="3"/><circle cx="42" cy="42" r="31" fill="none" stroke="#EEF2F6" stroke-width="8"/>
   <circle cx="42" cy="42" r="31" fill="none" stroke="${cor}" stroke-width="8" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/></svg><b style="font-size:${txt.length > 5 ? 13 : 15}px">${txt}</b></div>
   <div class="kr-b"><h3>${esc(info[0])}</h3><p>${esc(info[1] || formula)}</p><div class="kr-tags"><span class="kr-t">${esc(fq)}</span><span class="kr-t mt">meta ${esc(metaTxt)}</span>${st}</div></div></div>`;
}
{ const st = document.createElement('style'); st.textContent = `
.kgrid:has(> .kr){grid-template-columns:repeat(auto-fill,minmax(300px,1fr))!important;gap:14px}
.card.kr,.lb>.card.kr{display:flex!important;flex-direction:row!important;align-items:center!important;gap:16px;padding:26px 18px 16px;border:1px solid #E3E8EF;border-radius:14px;background:#fff;box-shadow:none;min-height:0}
.kr-a{position:relative;width:84px;height:84px;flex:none}.kr-a svg{display:block}
.kr-a b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0F172A;letter-spacing:-.01em}
.kr-b{min-width:0}.kr-b h3{margin:0 0 4px;font-size:15px;font-weight:700;color:#0F172A}
.kr-b p{margin:0 0 8px;font-size:12px;line-height:1.4;color:#64748B}
.kr-tags{display:flex;gap:6px;flex-wrap:wrap}
.kr-t{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#0F766E;border:1px solid #D7E3EA;border-radius:4px;padding:2px 7px;background:#fff}
.kr-t.mt{color:#475569}.kr-t.ok{color:#15803D;border-color:#BBF7D0;background:#F0FDF4}.kr-t.bad{color:#B91C1C;border-color:#FECACA;background:#FEF2F2}.kr-t.sem{color:#94A3B8}
`; document.head.appendChild(st); }

