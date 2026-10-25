/* ===== Troca de óleo do MCP: barras horizontais simples (sem animação) ===== */
'use strict';
function rioCard() {
  const t11 = A1M['1.1.1']; if (!t11) return '';
  const L = []; S.cfg.frota.forEach(v => { if (foraOp(v)) return; mcpPos(v).forEach(pos => { const s = situacao(v, pos, t11), iv = intervalo(t11, v, pos); if (!s || s.rest == null || !iv.h) return;
    L.push({ v, pos, iv: iv.h, feito: Math.max(0, iv.h - s.rest), rest: s.rest, hd: horasDia(v.id), om: omAberta(v.id, pos, '1.1.1') }); }); });
  L.sort((a, b) => a.rest - b.rest);
  const IV = L[0] ? L[0].iv : 350, MX = Math.ceil(Math.max(IV * 1.1, ...L.map(x => x.feito)) / 50) * 50, X = h => Math.min(100, h / MX * 100);
  const cor = x => x.rest < 0 ? '#D93025' : x.rest <= 50 ? '#F9AB00' : '#1A73E8';
  const venc = L.filter(x => x.rest < 0).length, prox = L.filter(x => x.rest >= 0 && x.rest <= 50).length;
  const ticks = []; for (let h = 0; h <= MX; h += 50) ticks.push(h);
  const linha = x => { const d = x.rest > 0 && x.hd ? Math.round(x.rest / x.hd) : 0;
    const txt = x.rest < 0 ? `<b style="color:#D93025">vencida há ${nf(-x.rest)} h</b>` : `<b>faltam ${nf(x.rest)} h</b>${x.rest > 0 ? ` <span>≈ ${d} d</span>` : ''}`;
    return `<div class="ol-r" data-vessel="${x.v.id}" data-tip="${esc(x.v.nome)}${x.v.mcp === 'mono' ? '' : ' ' + x.pos}: ${nf(x.feito)} de ${nf(x.iv)} h no óleo atual${x.hd ? ' · ritmo ' + nf(x.hd, 1) + ' h/dia' : ''}${x.om ? ' · OM ' + x.om.num + ' aberta' : ''}">
     <span class="ol-l">${esc(x.v.nome)}${x.v.mcp === 'mono' ? '' : ' <small>' + x.pos + '</small>'}</span>
     <div class="ol-t">${ticks.map(h => `<i class="ol-g" style="left:${X(h)}%"></i>`).join('')}<i class="ol-b" style="width:${X(x.feito)}%;background:${cor(x)}"></i><i class="ol-ref a" style="left:${X(IV - 50)}%"></i><i class="ol-ref" style="left:${X(IV)}%"></i></div>
     <span class="ol-v">${txt}${x.om ? ' <span class="pill p-inf">OM</span>' : ''}</span></div>`; };
  return `<div class="card"><div class="row"><h2>Troca de óleo do MCP · horas rodadas no óleo atual</h2><span class="sp"></span><span class="note"><b style="color:#D93025">${venc}</b> vencida(s) · <b style="color:#E37400">${prox}</b> até 50 h · <b style="color:#1A73E8">${L.length - venc - prox}</b> em dia</span></div>
   <div class="note">Item 1.1.1 · troca a cada ${nf(IV)} h ou 6 meses. A barra é quanto o óleo já rodou desde a última troca; à direita, quanto falta. Ordenado pelo mais urgente.</div>
   <div class="clegend note" style="margin-top:8px"><span><i style="background:#1A73E8"></i>Em dia</span><span><i style="background:#F9AB00"></i>Faltam até 50 h</span><span><i style="background:#D93025"></i>Vencida</span><span><i style="background:#D93025;width:2px"></i>Troca (${nf(IV)} h)</span><span><i style="background:#F9AB00;width:2px"></i>${nf(IV - 50)} h</span></div>
   ${L.length ? `<div class="ol">${L.map(linha).join('')}<div class="ol-r ol-ax"><span class="ol-l"></span><div class="ol-t">${ticks.map(h => `<span style="left:${X(h)}%">${h}</span>`).join('')}</div><span class="ol-v note">horas</span></div></div>` : '<div class="note">Sem leituras de horímetro do MCP.</div>'}</div>`;
}
var horMcpCard = rioCard;

