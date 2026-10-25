/* ===== Cronograma × Realizado por SERVIÇO (pacote do cronograma), não por item ===== */
'use strict';
function cx2Dados(ano) {
  return S.cfg.frota.filter(v => !foraOp(v)).map(v => { const R = cronoMarcas(v, ano), c = { ok: 0, late: 0, miss: 0, plan: 0 }, mes = Array.from({ length: 12 }, () => ({ ok: 0, late: 0, miss: 0, plan: 0, oleo: 0, jan: 0 }));
    R.forEach(l => l.M.forEach((m, i) => { ['ok', 'late', 'miss', 'plan'].forEach(k => { c[k] += m[k]; mes[i][k] += m[k]; }); if (m.plan) { if (l.tr === 'bordo') mes[i].oleo += m.plan; else mes[i].jan = 1; } }));
    c.den = c.ok + c.late + c.miss; c.ad = c.den ? c.ok / c.den * 100 : null; return { v, R, c, mes }; });
}

function cxPDF() {
  const ano = +CX.ano, D = cx2Dados(ano), vs = CX.v ? D.filter(x => x.v.id === CX.v) : D;
  const T = vs.reduce((a, x) => { ['ok', 'late', 'miss', 'plan'].forEach(k => a[k] += x.c[k]); return a; }, { ok: 0, late: 0, miss: 0, plan: 0 }); T.den = T.ok + T.late + T.miss; T.ad = T.den ? T.ok / T.den * 100 : null;
  const s0 = { v: CR2.v, ano: CR2.ano };
  const grades = vs.map(x => { CR2.v = x.v.id; CR2.ano = ano; const h = vCrono2(), i = h.indexOf('<div class="card"><div class="row"><h2>3 ·'); return '<div class="pb">' + (i > 0 ? h.slice(i) : '') + '</div>'; }).join('');
  Object.assign(CR2, s0);
  const css = `@page{size:A4 landscape;margin:9mm}body{font-family:Arial,sans-serif;font-size:9.5px;color:#202124;margin:0}.hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #16244A;padding-bottom:6px;margin-bottom:8px}.hd img{height:36px}.hd h1{font-size:15px;margin:0;color:#16244A}.hd p{margin:2px 0 0;color:#5F6368}
   button,.mbtn,select{display:none!important}.pill{font-size:9px;border:1px solid #DADCE0;border-radius:10px;padding:1px 6px}.row{display:flex;gap:8px;align-items:center}.sp{flex:1}h2{font-size:12px;color:#16244A;margin:0}.pb{page-break-before:always}
   .k{display:flex;gap:10px;margin:6px 0 10px}.k div{border:1px solid #DADCE0;border-radius:4px;padding:5px 10px}.k b{display:block;font-size:16px}
   table{width:100%;border-collapse:collapse}th,td{border:1px solid #DADCE0;padding:2px 3px;text-align:center}th{background:#16244A;color:#fff}td.c2-n{text-align:left}td.c2-n small{display:block;color:#5F6368;font-size:7.5px}tr.c2-tr td{background:#E8EEF8;text-align:left}tr.c2-tr span{margin-left:8px;color:#5F6368}
   .c2{display:inline-block;min-width:16px;border-radius:3px;color:#fff;font-weight:700;padding:0 3px}.c2 small{font-size:7px;margin-left:1px}.plan{background:#80868B}.est{background:#fff;color:#5F6368;border:1px dashed #80868B}.ok{background:#188038}.late{background:#E37400}.miss{background:#D93025}
   .c2-leg{margin:6px 0}.c2-leg span{margin-right:12px}.note{color:#5F6368}.ass{display:flex;gap:60px;margin-top:26px}.ass div{flex:1;border-top:1px solid #202124;padding-top:4px;text-align:center}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}tr{page-break-inside:avoid}thead{display:table-header-group}`;
  const w = window.open('', '_blank'); if (!w) { toast('Permita pop-ups para gerar o PDF.'); return; }
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cronograma x Realizado ${ano}</title><style>${css}</style></head><body>
   <div class="hd"><img src="${LOGOS.nav}" alt=""><img src="${LOGOS.vda}" alt=""><div><h1>Cronograma × Realizado · manutenção preventiva · ${ano}</h1><p>Cronograma tirado do Anexo I da NP Navecunha 055 · ${CX.v ? esc(vName(CX.v)) : 'frota em operação'} · emitido em ${hoje().toLocaleDateString('pt-BR')} pelo SMF</p></div></div>
   <div class="k"><div><b>${T.ad == null ? '—' : nf(T.ad, 0) + '%'}</b>aderência (${T.ok} de ${T.den} serviços)</div><div><b style="color:#188038">${T.ok}</b>no prazo</div><div><b style="color:#E37400">${T.late}</b>com atraso</div><div><b style="color:#D93025">${T.miss}</b>não feitos</div><div><b>${T.plan}</b>programados até dez.</div></div>
   <table><thead><tr><th style="text-align:left">Embarcação</th><th>No prazo</th><th>Com atraso</th><th>Não feitos</th><th>Programados até dez.</th><th>Cronograma aprovado</th><th>Aderência</th></tr></thead><tbody>${vs.map(x => { const B = cronoBase(ano, x.v.id); return `<tr><td style="text-align:left">${esc(x.v.nome)}</td><td>${x.c.ok}</td><td>${x.c.late}</td><td>${x.c.miss}</td><td>${x.c.plan}</td><td>${B ? 'rev. ' + B.rev + ' · ' + esc(B.aprovBy) + ' · ' + brD(B.aprovAt) : 'não aprovado'}</td><td><b>${x.c.ad == null ? '—' : nf(x.c.ad, 0) + '%'}</b></td></tr>`; }).join('')}</tbody></table>
   <p class="note">Serviço = pacote do cronograma (troca de óleo com itens de 250 h, revisões por hora da janela, trimestral, semestral, anual). Aderência = serviços feitos no prazo ÷ serviços já vencidos.</p>
   ${grades}
   <div class="ass"><div>Supervisor de Manutenção</div><div>Gerência</div><div>Data</div></div><script>setTimeout(function(){window.print()},500)<\/script></body></html>`); w.document.close();
}

