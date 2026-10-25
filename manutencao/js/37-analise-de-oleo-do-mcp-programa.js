/* ===== Análise de óleo do MCP · programa de amostragem: cada MCP a cada 1.000 h ou 12 meses (Anexo I 1.1.29), na troca de óleo mais próxima, junto com os bicos e a compressão (1.1.12) ===== */
function amoDados() {
  const d = hoje(), CM = typeof lubConsumoMCP === 'function' ? lubConsumoMCP(120) : { out: [] }, t = A1M['1.1.29'], M = [];
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => mcpPos(v).forEach(pos => { if ((v.off || []).includes('MCP') || !aplica(v, pos, t)) return;
    const L = laudos(v.id, pos), ul = L[L.length - 1], s = situacao(v, pos, t), dt = ul ? ul.date : s.L ? s.L.date : null;
    const meses = dt ? Math.floor((d - pD(dt)) / (864e5 * 30.4)) : null, ls = ul ? laudoSt(ul) : { st: 'sem', alertas: [] }, c = CM.out.find(y => y.v === v && y.p === pos) || { st: 'sem', taxa: null };
    const extra = ls.st === 'venc' || ls.st === 'viag';   // laudo anterior com alerta: nova amostra na próxima troca
    M.push({ v, pos, ul, dt, meses, ls, c, s, extra, om: omAberta(v.id, pos, '1.1.29') }); }));
  const pri = x => x.extra ? 0 : x.s.st === 'venc' ? 1 : x.s.st === 'viag' ? 2 : x.s.st === 'sem' ? 3 : 4;
  return { M, fila: M.slice().sort((a, b) => pri(a) - pri(b) || (b.meses ?? 1e3) - (a.meses ?? 1e3)) };
}
// próxima amostra pelo critério que vence primeiro (1.000 h ou 12 meses): horas restantes com a data estimada pelo uso do motor, ou a data
function amoProx(x) { const s = x.s, H = hoje();
  if (s.rest != null) { if (s.rest < 0) return `<span style="color:var(--badt)">vencida há ${nf(-s.rest)} h</span>`; const r = horasDiaPos(x.v.id, x.pos), d = r ? new Date(H.getTime() + s.rest / r * 864e5) : null; return `em ${nf(s.rest)} h${d ? ' <span class="note">≈ ' + brD(isoD(d)) + '</span>' : ''}`; }
  if (s.alvoD) { const d = new Date(s.alvoD); return d < H ? `<span style="color:var(--badt)">vencida desde ${brD(isoD(d))}</span>` : 'até ' + brD(isoD(d)); }
  return '<span class="mut">sem histórico</span>'; }
function amoCard() {
  const { fila } = amoDados(), n = f => fila.filter(f).length, nv = n(x => x.s.st === 'venc'), np = n(x => x.s.st === 'viag'), ne = n(x => x.extra);
  const nm = x => esc(x.v.nome) + (x.v.mcp === 'mono' ? '' : ' ' + x.pos);
  const sit = x => x.extra ? '<span class="pill p-warn">coleta extra (laudo com alerta)</span>' : x.s.st === 'venc' ? '<span class="pill p-bad">amostra vencida</span>' : x.s.st === 'viag' ? '<span class="pill p-inf">na próxima troca</span>' : x.s.st === 'sem' ? '<span class="pill p-mut">sem histórico</span>' : '<span class="pill p-ok">em dia</span>';
  const ban = nv || np || ne ? `<div class="banner ${nv ? 'warn' : 'info'}"><b>${[[nv, 'vencida', 'vencidas'], [ne, 'coleta extra', 'coletas extras'], [np, 'na próxima troca', 'na próxima troca']].filter(a => a[0]).map(a => a[0] + ' ' + (a[0] === 1 ? a[1] : a[2])).join(' · ')}</b>&nbsp;· colher na troca de óleo, antes de drenar, e anotar o horímetro e as horas do óleo.<span class="sp"></span><button class="mbtn sm" data-laudo2="">＋ Registrar laudo</button></div>`
    : `<div class="banner ok"><b>Todas as amostras em dia.</b><span class="sp"></span><button class="mbtn sm" data-laudo2="">＋ Registrar laudo</button></div>`;
  return `<div class="card amo"><div class="row"><h2>Programa de amostragem</h2><span class="sp"></span><span class="note">cada MCP a cada 1.000 h ou 12 meses (Anexo I, item 1.1.29)</span></div>${ban}
   <div class="tw"><table class="t"><thead><tr><th>Motor</th><th>Último laudo</th><th>Próxima amostra</th><th>Resultado do último laudo</th><th>Consumo de óleo</th><th>Situação</th></tr></thead><tbody>
   ${fila.map(x => `<tr class="click" data-laudov2="${x.v.id}|${x.pos}"><td><b>${nm(x)}</b></td>
    <td>${x.dt ? brD(x.dt) + ' <span class="note">· há ' + x.meses + ' ' + (x.meses === 1 ? 'mês' : 'meses') + '</span>' : '<span class="mut">nunca</span>'}</td>
    <td>${amoProx(x)}${x.om ? ' <span class="note">· OM ' + esc(x.om.num) + '</span>' : ''}</td>
    <td>${x.ul ? (x.ls.alertas.length ? '<span style="color:' + (x.ls.st === 'venc' ? '#C5221F' : '#B06000') + '">' + x.ls.alertas.slice(0, 2).map(a => a.nome.split(' (')[0] + ' ' + nf(a.v, a.v < 10 ? 1 : 0)).join(', ') + '</span>' : '<span style="color:#188038">normal</span>') : '<span class="mut">sem laudo</span>'}</td>
    <td>${x.c.taxa != null ? nf(x.c.taxa, 2) + ' L/100 h' : '<span class="mut">sem complementos</span>'}</td><td>${sit(x)}</td></tr>`).join('')}
   </tbody></table></div>
   <p class="note">Regra: amostra de cada MCP a cada 1.000 h ou 12 meses, colhida na troca de óleo mais próxima (a cada ~3 trocas de 350 h), junto com a revisão dos bicos e o ensaio de compressão (item 1.1.12) — o mesmo pacote de condição. Coleta extra na próxima troca quando o laudo anterior tem alerta ou há suspeita (consumo de óleo, fumaça, água ou combustível no óleo). O fabricante recomenda analisar a cada troca (O&M 6-2). Clique num motor para ver os laudos.</p></div>`;
}

