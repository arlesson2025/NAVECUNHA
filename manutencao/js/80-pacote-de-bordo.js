/* ===== Instruções de Máquinas para o CTF/MFM (NP 055 itens 4.5, 4.6, 5.3, 5.4 e 5.4.1; pedido do Supervisor, 24/10/2026) =====
   Impresso na saída e entregue ao CTF com a OM: serviços embarcados com a hora-alvo, trocas de óleo da viagem (com quantos FR 049_B levar),
   material para conferir antes de sair, amostra de óleo a coletar, limites dos parâmetros do MCP e prazos de comunicação, e a folha diária
   do Diário de Máquinas (NP 5.4) para os dias da viagem. Botão "Instruções de Máquinas" na janela de saída e na Programar preventiva. */
'use strict';
function pacoteBordo(vid) {
  const v = vessel(vid); if (!v) return [];
  const r = rotaUso(v), dias = r ? Math.min(14, Math.max(1, Math.ceil(r.ciclo || 7))) : 7, box = '☐', B = [];
  const sx = s => blk('', s[0], s[1], s[2]).replace('<code></code>', '');
  const motores = mcpPos(v).map(p => [p, posCurtoE(v, p)]).concat(MCAS.filter(p => (v.mca || {})[p]).map(p => [p, posCurtoE(v, p)]));
  const hdr = `<div class="hdr"><div><img class="ln" src="${LOGOS.nav}" alt=""></div><div class="c"><b>INSTRUÇÕES DE MÁQUINAS · CTF / MFM</b><span>${esc(v.nome)} · viagem que começa em ${brD(isoD(hoje()))}</span><span class="np">NP Navecunha 055 · itens 4.5, 5.3, 5.4 e 5.4.1</span></div><div><img class="lv" src="${LOGOS.vda}" alt=""></div></div>`;
  const fbar = `<div class="fbar"><div><small>Entregue ao CTF na saída, junto com a OM · devolva ao Supervisor na chegada</small><h3>Instruções de Máquinas — ${esc(v.nome)}</h3></div><div class="om">Saída<br><b>${brD(isoD(hoje()))}</b></div></div>`;
  // identificação da viagem e horímetros de partida
  B.push(sx(['Viagem', r ? esc(r.nome) : 'rota não escolhida', grid('repeat(4,1fr)', dv('Empurrador', v.nome) + dv('Saída', brD(isoD(hoje()))) + dv('Duração prevista', dias + ' dias') + dv('Horas previstas', r ? 'MCP ' + nf(rotaHmcp(r)) + ' h · MCA ' + nf(rotaHmca(r)) + ' h cada' : '—'))
    + tbl(['Motor', 'Horímetro na saída (último lançado)', 'Horímetro na saída (anotar)'], motores.map(([p, n]) => { const h = horAtual(v.id, p); return [n, h ? nf(h.h) + ' h · ' + brD(h.date) : '—', '']; }), ['30%', '40%', '30%'])]));
  // 1 · serviços embarcados (OM embarcada, NP 7.3): os itens de EMBARCA das preventivas abertas, na hora-alvo
  const emb = []; oms().filter(o => o.tipo === 'P' && o.vessel === v.id && !o.excluido && o.status !== 'encerrada').forEach(o => (o.itensProg || o.items || []).forEach(id => { if (!EMBARCA.includes(id)) return; const t = A1M[id]; if (!t) return;
    const s = situacao(v, o.pos, t); emb.push([o.num, posCurtoE(v, o.pos), { h: `<b>${esc(t.chk || t.item)}</b> <span style="color:#5F6368">· ${esc(EQN[t.eq] || t.eq)}</span>` }, s.alvoH ? nf(s.alvoH) + ' h' : o.alvoH ? nf(o.alvoH) + ' h' : '—', { h: box, c: 'c' }, '']); }));
  B.push(sx(['1 · Serviços embarcados', 'executar na hora-alvo e registrar na OM (NP 4.5)', emb.length ? tbl(['OM', 'Motor', 'Serviço', 'Hora-alvo', 'Feito', 'Horímetro / data'], emb, ['10%', '12%', '44%', '12%', '7%', '15%']) : '<div class="note">Nenhum serviço embarcado nesta viagem.</div>']));
  // 2 · trocas de óleo da viagem
  const T = (typeof bordoTrocas === 'function' && bordoTrocas(v)) || [], nFR = T.reduce((a, x) => a + (x.antes ? 1 : 0) + x.n, 0);
  const LD = lubDados().filter(x => x.v === v), oleoDe = nome => { const x = LD.find(y => eqNomeC(v, y.e) === nome); return x && x.e ? x.e.oleo || '' : ''; };
  B.push(sx(['2 · Trocas de óleo na viagem', 'FR 049_B em cada troca (NP 4.5)', T.length ? tbl(['Equipamento', 'Falta hoje', 'Intervalo', 'Trocas na viagem', 'Óleo', 'Cárter'], T.map(x => [x.nome, x.antes ? 'trocar antes de sair' : nf(x.rest) + ' h', x.iv ? nf(x.iv) + ' h' : '—', String((x.antes ? 1 : 0) + x.n), oleoDe(x.nome) || '—', x.cart]), ['24%', '16%', '12%', '14%', '18%', '16%'])
    + `<div class="note" style="margin-top:4px">Levar <b>${nFR} formulário${nFR === 1 ? '' : 's'} FR 049_B</b>. Óleo e filtros vencidos não se usam (NP 5.9: anotar lote e validade).</div>` : '<div class="note">Nenhuma troca de óleo prevista para esta viagem.</div>']));
  // 3 · material para conferir antes de sair
  const M = []; T.forEach(x => { const n = (x.antes ? 1 : 0) + x.n; if (!n) return; M.push(['Óleo ' + (oleoDe(x.nome) || '') + ' · ' + x.nome, x.L ? nf(Math.ceil(n * x.L)) + ' L' : n + ' troca(s)', { h: box, c: 'c' }]); M.push(['Filtros de óleo · ' + x.nome, n + ' jogo' + (n > 1 ? 's' : ''), { h: box, c: 'c' }]); });
  emb.forEach(e => M.push(['Material da OM ' + e[0] + ' · ' + e[1] + ' · ' + String(e[2].h).replace(/<[^>]+>/g, ''), 'conforme a OM', { h: box, c: 'c' }]));
  M.push(['Absorvente, sacos e recipientes identificados para resíduos (FR 016_E)', '', { h: box, c: 'c' }], ['Frascos de amostra de óleo (se houver coleta)', '', { h: box, c: 'c' }]);
  B.push(sx(['3 · Material para conferir antes de sair', 'o que faltar, pedir à Manutenção antes da saída (NP 4.5)', tbl(['Material', 'Quantidade', 'A bordo'], M, ['70%', '18%', '12%'])]));
  // 4 · amostra de óleo do MCP
  const AM = (typeof amoDados === 'function' ? amoDados().M : []).filter(x => x.v === v && (x.extra || ['venc', 'viag', 'sem'].includes(x.s.st)));
  B.push(sx(['4 · Amostra de óleo do MCP', 'Anexo I 1.1.29 · NP 4.5', AM.length ? tbl(['MCP', 'Motivo', 'Quando coletar', 'Identificação do frasco'], AM.map(x => [posCurtoE(v, x.pos), x.extra ? 'laudo anterior com alerta' : x.s.st === 'venc' ? 'amostra vencida' : x.s.st === 'sem' ? 'sem laudo registrado' : 'vence nesta viagem', 'na próxima troca de óleo, com o óleo morno', v.nome + ' · ' + posCurtoE(v, x.pos) + ' · data · horímetro']), ['14%', '28%', '30%', '28%']) : '<div class="note">Nenhuma coleta de amostra nesta viagem.</div>']));
  // 5 · limites dos parâmetros do MCP e prazos de comunicação
  const L = PMC_LIM, mp = x => nf(x, 2).replace('.', ',') + ' MPa';
  B.push(sx(['5 · Limites do MCP', 'fabricante: SM 2-3 e O&M 3-7', tbl(['Parâmetro', 'Normal', 'Avisar já se'], [['Pressão do óleo · rotação nominal', mp(L.nominal.po[0]) + ' a ' + mp(L.nominal.po[1]), 'abaixo de ' + mp(L.nominal.poMin)], ['Pressão do óleo · marcha lenta', mp(L.lenta.po[0]) + ' a ' + mp(L.lenta.po[1]), 'abaixo de ' + mp(L.lenta.poMin)], ['Temperatura da água', L.nominal.ag[0] + ' a ' + L.nominal.ag[1] + ' °C', 'fora da faixa'], ['Pressão do ar de carga', mp(L.nominal.ar[0]) + ' a ' + mp(L.nominal.ar[1]), 'fora da faixa'], ['Temperatura do óleo (para comparar)', '90 a 100 °C', '—']], ['40%', '32%', '28%'])]));
  B.push(sx(['5 · Comunicação de anomalias', 'NP 5.4.1 e 4.5', `<div style="font-size:10.5px;line-height:1.5"><b>Falha Crítica ou Alta:</b> avisar <b>na hora</b> a Coordenação de Operações e a Supervisão de Manutenção, pelo Comandante, via Autotrac. <b>Falha Crítica</b> (risco à segurança, ao meio ambiente ou ao motor): <b>parar o equipamento</b> e avisar o Comandante.<br><b>Falha Média ou Baixa:</b> anotar horímetro e parâmetros e avisar via Autotrac em até <b>24 horas</b>. Nada de óleo, filtro ou resíduo na água (NP 5.7).</div>`]));
  // 6 · folha diária do Diário de Máquinas (NP 5.4)
  const linhas = []; for (let d = 1; d <= dias; d++) motores.forEach(([p, n], i) => linhas.push([i ? '' : 'Dia ' + d + ' · __/__', n, '', '', '', '', '', '']));
  B.push(sx(['6 · Diário de Máquinas · parâmetros', 'anotar todo dia (NP 5.4)', tbl(['Dia', 'Motor', 'Horímetro', 'Pressão óleo', 'Temp. óleo', 'Temp. água', 'RPM', 'Óleo completado (L)'], linhas, ['13%', '13%', '13%', '12%', '11%', '11%', '9%', '18%'])]));
  const chk = []; for (let d = 1; d <= dias; d++) chk.push(['Dia ' + d, { h: box, c: 'c' }, { h: box, c: 'c' }, { h: box, c: 'c' }, { h: box, c: 'c' }, { h: box, c: 'c' }, '', '']);
  B.push(sx(['6 · Diário de Máquinas · inspeção diária', 'NP 5.4 · marcar o que foi verificado', tbl(['Dia', 'Instrumentos', 'Vazamentos (motores e governo)', 'Bucim', 'Porão e alarme', 'Filtro separador e níveis', 'Anomalia (o quê)', 'Visto CTF/MFM'], chk, ['9%', '10%', '14%', '8%', '10%', '12%', '22%', '15%'])
    + '<div class="note" style="margin-top:4px">MCA fora de operação: drenar o filtro separador e conferir óleo e arrefecimento antes de pôr em uso. MCPs: drenar o filtro separador e conferir os níveis ao menos uma vez por dia, nas paradas.</div>']));
  B.push(sx(['Entrega e devolução', '', tbl(['Função', 'Nome', 'Assinatura', 'Data'], [['Entregue por (Supervisor de Manutenção)', S.session ? S.session.name : '', '', brD(isoD(hoje()))], ['Recebido por (CTF)', '', '', ''], ['Devolvido na chegada (CTF)', '', '', '']], ['40%', '24%', '22%', '14%'])]));
  return numerar(paginar(fbar, B, hdr));
}
function pacoteModal(vid) {
  const v = vessel(vid); if (!v) return; const docs = pacoteBordo(vid), nm = `Instrucoes_de_Maquinas_${v.nome.replace(/\s+/g, '_')}_${isoD(hoje())}.pdf`;
  modal(`<div class="row"><h2>Instruções de Máquinas · ${esc(v.nome)}</h2><span class="sp"></span><button class="mbtn pri" data-act="pdfPac">⬇ Baixar PDF para imprimir</button><button class="mbtn" data-close>Fechar</button></div>
   <p class="note">Imprima e entregue ao CTF junto com a OM: serviços embarcados, trocas de óleo, material para conferir, amostra de óleo, limites do MCP e a folha diária do Diário de Máquinas. Na chegada, o CTF devolve preenchido.</p><div class="pdfwrap" id="pacPrev"></div>`, true);
  previewPages($('#pacPrev'), docs, 560);
  $('#modal').addEventListener('click', async e => { if (e.target.closest('[data-act="pdfPac"]')) await baixarPDF(docs, nm); });
}
document.addEventListener('click', e => { const b = e.target.closest('[data-pacote]'); if (!b) return; e.preventDefault(); e.stopPropagation(); pacoteModal(b.dataset.pacote); }, true);
