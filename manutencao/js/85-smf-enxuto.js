/* ===== SMF enxuto (Supervisor, 27/10/2026: “controle enxuto, sequência lógica, que passe na auditoria e seja simples”) =====
   Sequência: 1 Horímetros (na chegada) → 2 Cronograma: o que venceu e o que vence no mês → texto da OM para o Sankhya → registrar feito
   (data, horímetro, nº da OM, quem) ou não feito com motivo → 3 Relatório de preventiva do mês, emitido e congelado.
   A execução, as fotos e o encerramento ficam na OM do Sankhya; o SMF guarda a ligação serviço × OM (achado de auditoria nº 1).
   Registros com os tipos que já existem: 'base' (feito; não feito = nf: true, não reinicia o prazo), 'hor' e 'snap' (relatório emitido, tipo 'relprev').
   O resto do SMF fica escondido, não apagado: “Modo completo neste aparelho” (Administração, só o Supervisor; localStorage smf_modo_completo). */
'use strict';
const ENX_MC = 'smf_modo_completo';
const enxModoCompleto = () => { try { return localStorage.getItem(ENX_MC) === '1'; } catch (e) { return false; } };
const enxuto = () => FROTA_TIPO !== 'bal' && !(typeof ehOperador === 'function' && ehOperador()) && !enxModoCompleto();
const ENX_OK = ['enxhoje', 'enx', 'enxcr', 'enxhor', 'enxcor', 'enxrel', 'enxacao', 'enxcal', 'enxbib', 'oleo', 'compr', 'anoleo', 'cxr', 'admin'];
// link de tela do modo completo → tela equivalente do enxuto (3.22: link fora da lista jogava no Painel; “clico em análise de óleo e vai pra outro canto”)
const ENX_ALIAS = { horfrota: 'enxhor', hor: 'enxhor', controle: 'enxcal', calib: 'enxcal', crono: 'enxcr', falhas2: 'enxcor', oms: 'enx', emitir: 'enx', omconf: 'enxcor', relmes: 'enxrel', rel: 'enxrel', kpi: 'enxrel', lubreg: 'oleo', lubcons: 'oleo', bib: 'enxbib', apoio: 'enxbib', mapa: 'enxhoje', rotina: 'enxhoje', geral: 'enxhoje', audit: 'enxcr', matriz: 'enxbib' };   // telas abertas no modo enxuto (cxr = aprovar o cronograma do ano)
function enxRota() {   // chamado pelo render: no modo enxuto, tela fora da lista volta para o Painel de pendências (js/87)
  if (!enxuto() || ENX_OK.includes(VIEW)) return;
  VIEW = ENX_ALIAS[VIEW] || 'enxhoje'; ARG = ''; try { history.replaceState(null, '', '#' + VIEW); } catch (e) { }
}
// menu em 4 etapas do PCM (SMF 3.22, Supervisor: “sequência, etapas, nomes técnicos”; “não deixa ruim de operar”)
const PCM_MENU = [['', [['enxhoje', 'Painel de pendências', 'hoje']]],
  ['1 · Recebimento da embarcação', [['enxhor', '1.1 Horímetros', 'hoje'], ['enxcor', '1.2 Manutenção corretiva', 'omsv2']]],
  ['2 · Planejamento (PCM)', [['enxcr', '2.1 Plano anual preventivo', 'crono'], ['enx', '2.2 Backlog e OM preventiva', 'prev2']]],
  ['3 · Monitoramento de condição', [['oleo', '3.1 Lubrificação (FR 049_B)', 'oleo'], ['compr', '3.2 Compressão do MCP', 'compr'], ['enxcal', '3.3 Calibração do MCP', 'compr'], ['anoleo', '3.4 Análise de óleo do MCP', 'oleo']]],
  ['4 · Fechamento mensal', [['enxacao', '4.1 Plano de ação', 'relm'], ['enxrel', '4.2 Relatório gerencial', 'relm']]],
  ['Apoio', [['enxbib', 'Biblioteca técnica', 'bib'], ['admin', 'Administração', 'adm']]]];
function enxNav() {
  const it = (k, n, ic, cnt) => `<a href="#${k}" class="${VIEW === k ? 'on' : ''}">${ico(ic)}<span>${n}</span>${cnt ? `<span class="n">${cnt}</span>` : ''}</a>`;
  let C = {}; try { C = typeof pcmContagem === 'function' ? pcmContagem() : {}; } catch (e) { }
  return PCM_MENU.map(([g, L]) => (g ? `<div class="grp-t${g === 'Apoio' ? ' grp-apoio' : ''}">${g}</div>` : '') + L.map(([k, n, ic]) => it(k, n, ic, C[k])).join('')).join('');
}
// ---------- dados do cronograma ----------
const ENX = { v: '', emDia: false, abertos: new Set() };   // abertos = grupos de equipamento abertos na lista do empurrador
const enxServ = t => t.chk || t.item, enxEq = t => EQN[t.eq] || t.eq;
const enxIv = (t, v, pos) => { const iv = intervalo(t, v, pos); return [iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + (iv.m === 1 ? ' mês' : ' meses') : ''].filter(Boolean).join(' ou ') || '—'; };
const enxNF = (vid, pos, item) => { let b = null; recs('base').forEach(r => { if (r.nf && r.vessel === vid && r.pos === pos && r.item === item && !r.excluido && (!b || r.date > b.date)) b = r; }); return b; };
function enxDados() {
  return S.cfg.frota.filter(v => !foraOp(v)).map(v => { const P = painelVessel(v).filter(x => x.t.kind === 'prog' && !(typeof CRONO_FORA !== 'undefined' && CRONO_FORA.includes(x.t.id)));
    const g = P.map(x => Object.assign(x, { g: emGrp(v, x) })), hp = mpos(v.id), hr = horAtual(v.id, hp), dias = hr && !hr.est ? Math.floor((hoje() - pD(hr.date)) / 864e5) : null;
    return { v, P: g, venc: g.filter(x => x.g === 'venc'), mes: g.filter(x => x.g === 'mes'), sem: g.filter(x => x.g === 'sem'), hr, dias }; }); }
const ENX_GR = { venc: ['p-bad', 'Vencido'], mes: ['p-warn', 'Vencimento no mês'], sem: ['p-mut', 'Sem referência'], ok: ['p-ok', 'Dentro do prazo'], emb: ['p-ok', 'Dentro do prazo'], adi: ['p-ok', 'Dentro do prazo'] };
const enxCab = (tit, sub, bt) => `<div class="cm-v"><div class="vh"><div><h1>${tit}</h1><p>${sub}</p></div><span class="sp"></span>${bt || ''}</div><div class="cm-ws">`;
// ---------- 2 · Cronograma ----------
function vEnx() {
  const D = enxDados(), v = vessel(ENX.v);
  if (!v) {
    const nSem = D.reduce((a, x) => a + x.sem.length, 0), ano = hoje().getFullYear(), aprov = D.filter(x => cronoBase(ano, x.v.id)).length;
    return enxCab('2.2 Backlog e OM preventiva', 'Backlog = serviços do plano vencidos e a vencer no mês · selecione o empurrador, gere o descritivo da OM para o Sankhya e aponte o que foi feito com o nº da OM', '<button class="mbtn" data-enxreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button>')
     + `<div class="card"><h2>Resumo</h2><div class="f2-ks">${[['Vencidos', D.reduce((a, x) => a + x.venc.length, 0), 'var(--badt)'], ['Vencimento no mês', D.reduce((a, x) => a + x.mes.length, 0), 'var(--warnt)'], ['Sem histórico', nSem, nSem ? 'var(--badt)' : ''], [`Cronograma ${ano} aprovado`, aprov + ' de ' + D.length, aprov < D.length ? 'var(--warnt)' : 'var(--okt)']].map(([l, n, c]) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${n}</b></div>`).join('')}</div>
       ${nSem ? `<p class="note" style="color:var(--badt)">${nSem} serviço${nSem === 1 ? '' : 's'} sem histórico não vence${nSem === 1 ? '' : 'm'} nunca: registre o último serviço ou defina o marco zero em Administração antes de usar o cronograma de verdade.</p>` : ''}
       ${aprov < D.length ? `<p class="note">O previsto do ano só fica valendo para a aderência depois de aprovado: aprove em <a href="#enxcr">2 · Cronograma</a>.</p>` : ''}</div>
     <div class="card"><h2>Empurradores</h2><div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Situação operacional</th><th class="r">Vencidos</th><th class="r">Vencem no mês</th><th class="r">Sem referência</th><th>Horímetro do MCP</th><th></th></tr></thead><tbody>
     ${D.sort((a, b) => b.venc.length - a.venc.length || b.mes.length - a.mes.length).map(x => { const s = situDe(x.v);
       return `<tr class="click" data-enxv="${x.v.id}"><td><b>${esc(x.v.nome)}</b></td><td>${!s ? '<span class="mut">não informado</span>' : s.st === 'viagem' ? 'em viagem' : 'no porto'}</td><td class="r">${x.venc.length ? `<b class="rl-ruim">${x.venc.length}</b>` : '0'}</td><td class="r">${x.mes.length ? `<b class="rl-at">${x.mes.length}</b>` : '0'}</td><td class="r">${x.sem.length || '0'}</td>
         <td>${x.hr ? nf(x.hr.h) + ' h · ' + brD(x.hr.date) + (x.dias != null && x.dias > 14 ? ` <span class="pill p-warn">há ${x.dias} dias</span>` : '') : '<span class="pill p-bad">sem leitura</span>'}</td><td><button class="mbtn sm pri" data-enxv="${x.v.id}">Abrir</button></td></tr>`; }).join('')}</tbody></table></div>
     <p class="note">Vencido e vence no mês pela data ou pelas horas no ritmo do motor (Anexo I). Horímetro com mais de 14 dias deixa os serviços por horas imprecisos: lance em <a href="#enxhor">1 · Horímetros</a>.</p></div></div></div>`;
  }
  const x = D.find(y => y.v === v), ord = { venc: 0, mes: 1, sem: 2 }, L = x.P.filter(y => ENX.emDia || ['venc', 'mes', 'sem'].includes(y.g)).sort((a, b) => (ord[a.g] ?? 3) - (ord[b.g] ?? 3) || a.t.id.localeCompare(b.t.id, 'pt-BR', { numeric: true }));
  const lin = y => { const nfr = enxNF(v.id, y.pos, y.t.id), k = y.pos + '|' + y.t.id, L0 = y.s.L;
    const cr = enxCrit(y.t);
    return `<tr${cr ? ' style="background:rgba(179,38,30,.07);box-shadow:inset 4px 0 0 #B3261E"' : ''}><td><input type="checkbox" class="enx-ck" value="${k}"></td><td><b${cr ? ' style="color:#B3261E"' : ''}>${esc(enxServ(y.t))}</b>${cr ? enxCritSelo() : enxCritAnx(y.t) ? ' <span class="note" title="Prioridade Crítica no Anexo I, fora da tabela da NP 6.3: vencido bloqueia a saída (NP 5.5)">prioridade crítica · Anexo I</span>' : ''}</td><td class="nowrap">${enxIv(y.t, v, y.pos)}</td>
      <td class="nowrap">${L0 ? brD(L0.date) + (L0.h != null ? '<div class="note">' + nf(L0.h) + ' h</div>' : '') + (L0.insp ? '<div class="note" style="color:#1A73E8" title="' + esc(L0.obs || '') + '">inspecionado · sem intervenção</div>' : '') : '—'}</td><td><span class="pill ${ENX_GR[y.g][0]}">${ENX_GR[y.g][1]}</span><div class="note">${esc(y.s.txt || '')}</div>${nfr && (!L0 || nfr.date > L0.date) ? `<div class="note rl-ruim">não executado em ${brD(nfr.date)}: ${esc(nfr.motivo || '')}</div>` : ''}</td></tr>`; };
  return enxCab(`2.2 OM preventiva · ${esc(v.nome)}`, 'Selecione os itens · “Gerar descritivo da OM” para abrir a OM no Sankhya com a lista · depois “Apontar execução” com o nº dessa OM, “Inspecionado · sem intervenção” quando avaliou e não precisa fazer agora, ou “Apontar não execução” com o motivo',
      `<button class="mbtn" data-enxv="">← Frota</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + `<div class="card"><h2>Serviços · ${x.venc.length} vencido${x.venc.length === 1 ? '' : 's'} · ${x.mes.length} no mês</h2>
     <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="mbtn" data-enxtodos>Selecionar backlog (vencidos e do mês)</button><button class="mbtn" data-enxabre>Expandir todos</button><button class="mbtn" data-enxcopiar>📋 Gerar descritivo da OM</button><button class="mbtn" data-enxcampo>🖨 Formulário de campo (II-B)</button><button class="mbtn pri" data-enxfeito>✓ Apontar execução</button><button class="mbtn" data-enxinsp title="Avaliou e não precisa intervir agora: conta como atendido e o próximo vencimento vai para a data que você definir">🔍 Inspecionado · sem intervenção</button><button class="mbtn" data-enxnf>Apontar não execução</button><span class="sp"></span><label class="note"><input type="checkbox" id="enxEmDia"${ENX.emDia ? ' checked' : ''}> exibir itens dentro do prazo</label></div>
     ${(() => { const G = {}; L.forEach(y => { const k = enxEq(y.t) + ' · ' + posCurtoE(v, y.pos); (G[k] = G[k] || []).push(y); });
       const ks = Object.keys(G).sort((a, b) => G[b].filter(y => y.g === 'venc').length - G[a].filter(y => y.g === 'venc').length || a.localeCompare(b, 'pt-BR'));
       return ks.length ? ks.map(k => { const g = G[k], nc = g.filter(y => enxCrit(y.t)).length, nv = g.filter(y => y.g === 'venc').length, nm = g.filter(y => y.g === 'mes').length, ns = g.filter(y => y.g === 'sem').length;
         return `<details class="enx-g"${ENX.abertos.has(k) ? ' open' : ''} data-enxg="${esc(k)}"><summary><b>${esc(k)}</b>${nc ? `<span class="pill p-bad" style="font-weight:700;margin-left:8px">⚠ ${nc} crítico${nc === 1 ? '' : 's'} · NP 6.3</span>` : ''}<span class="sp"></span>${nv ? `<span class="pill p-bad">${nv} vencido${nv === 1 ? '' : 's'}</span>` : ''}${nm ? `<span class="pill p-warn">${nm} no mês</span>` : ''}${ns ? `<span class="pill p-mut">${ns} sem histórico</span>` : ''}${!nv && !nm && !ns ? `<span class="pill p-ok">${g.length} dentro do prazo</span>` : ''}</summary>
           <table class="t"><thead><tr><th></th><th>Serviço</th><th>Periodicidade</th><th>Última execução</th><th>Situação</th></tr></thead><tbody>${g.map(lin).join('')}</tbody></table></details>`; }).join('') : '<p class="note">Nada vencido nem vencendo no mês.</p>'; })()}
     <p class="note">Rastreabilidade: o texto copiado vai na OM do Sankhya, e o mesmo nº de OM fica em cada serviço registrado aqui; o relatório lista serviço × OM para conferência. Fotos e encerramento ficam na OM do Sankhya.</p></div>
   <div class="card"><h2>OMs preventivas apontadas</h2>${(() => { const G = enxOMsDe(v.id).slice(0, 12); return G.length ? `<table class="t"><thead><tr><th>OM</th><th>Data</th><th class="r">Serviços</th><th></th></tr></thead><tbody>${G.map(g => `<tr><td><b>${esc(g.om)}</b></td><td>${brD(g.date)}</td><td class="r">${g.n}</td><td><button class="mbtn sm" data-enx2b="${esc(g.om)}">Anexo II-B</button></td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma ainda.</p>'; })()}</div></div></div>`;
}
// itens críticos da NP = prioridade Crítica no Anexo I E equipamento da tabela da NP 055 item 6.3 (Supervisor, 28/10/2026: “não acredito que coloque geladeira como item crítico na NP”)
// 6.3: 1 propulsão (MCP, reversores) · 2 governo · 3 geração (MCA, alternador 30 kVA) · 4 motobomba de incêndio · 5 porão e linha de eixos · 6 Racor e válvulas de fechamento rápido · 7 VHF, luzes e parada remota · 8 amarra
// Crítica fora da 6.3 (caixa de mar, QGD, casco, fogão a gás 10.1.3) continua bloqueando a saída pela NP 5.5, mas sem o selo da 6.3: só a marca discreta “prioridade crítica · Anexo I”
const NP63_EQ = new Set(['MCP', 'HITACHI', 'MASSON', 'REINTJES', 'GOV', 'MWM', 'YANMAR', 'BAMB30', 'MBINC', 'PEMERG', 'PORAO', 'EIXO', 'RACOR', 'NAV', 'AMARRA']);
const enxCrit = t => !!t && t.prio === 'Crítica' && NP63_EQ.has(t.eq);
const enxCritAnx = t => !!t && t.prio === 'Crítica' && !NP63_EQ.has(t.eq);
const enxCritSelo = () => ' <span class="pill p-bad" style="font-weight:700">⚠ CRÍTICO · NP 6.3</span>';
const enxCritDoc = '<b style="color:#B3261E;white-space:nowrap">⚠ CRÍTICO · NP 6.3</b>';
const enxCritLeg = '<p style="font-size:10.5px;margin:4px 0;padding:4px 8px;background:#FDECEA;border-left:4px solid #B3261E">⚠ <b>CRÍTICO · NP 6.3</b> = serviço de equipamento crítico (NP Navecunha 055 item 6.3). Vencido sem OM bloqueia a saída do empurrador (NP 5.5).</p>';
const enxSel = () => $$('#main .enx-ck:checked').map(i => { const [pos, item] = i.value.split('|'); return { pos, t: A1M[item] }; }).filter(y => y.t);
function enxCopiar() {
  const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços primeiro.');
  // agrupado por equipamento: o nome do equipamento sai uma vez, como título, e os serviços embaixo (Supervisor, 28/10/2026: repetia o nome em toda linha)
  const G = new Map(); S0.forEach(y => { const k = `${enxEq(y.t)} · ${posCurtoE(v, y.pos)}`; if (!G.has(k)) G.set(k, []); G.get(k).push(`- ${enxCrit(y.t) ? '[CRÍTICO NP 6.3] ' : ''}${enxServ(y.t)} (a cada ${enxIv(y.t, v, y.pos)})`); });
  const nC = S0.filter(y => enxCrit(y.t)).length;
  const txt = `PREVENTIVA · ${v.nome} · ${brD(isoD(hoje()))}\nServiços (Anexo I · NP Navecunha 055):\n` + (nC ? `ATENÇÃO: ${nC} serviço${nC === 1 ? '' : 's'} de equipamento crítico (NP 055 item 6.3), marcado${nC === 1 ? '' : 's'} [CRÍTICO NP 6.3].\n` : '') + [...G].map(([k, L]) => `\n${k}\n${L.join('\n')}`).join('\n') + '\n\nRegistrar a execução no SMF com o nº desta OM.';
  try { navigator.clipboard.writeText(txt).catch(() => { }); } catch (e) { }
  modal(`<h2>Descritivo da OM · ${esc(v.nome)}</h2><p class="note">Já copiado. Cole na descrição da OM no Sankhya. Se não colou, selecione e copie daqui.</p><textarea rows="${Math.min(22, S0.length + G.size * 2 + 5)}" style="width:100%" readonly>${esc(txt)}</textarea><div class="row end"><button class="mbtn pri" data-close>Fechar</button></div>`, true);
}
// fotos de evidência (Supervisor, 27/10/2026: “as evidências falam mais que palavras”): antes e depois, obrigatórias; sobem ao Drive (fotosEnviar) e vão para o relatório mensal
// execução por equipe própria ou por terceiro (Supervisor, 27/10/2026: “o gerente precisa saber o que foi feito por terceiros e o que foi feito com equipe própria”)
const enxExecCampos = () => `<label class="f s3">Mão de obra<select id="fxT"><option value="Equipe própria">Equipe própria</option><option value="Terceiro">Terceiro (prestador)</option></select></label><label class="f s3">Prestador de serviço (se terceiro)<input id="fxE" list="fxEL" placeholder="nome do prestador"><datalist id="fxEL">${recs('terc').map(t => `<option value="${esc(t.empresa)}">`).join('')}</datalist></label>`;
function enxExecLer() { const exec = ($('#fxT') || {}).value || 'Equipe própria', empresa = exec === 'Terceiro' ? (($('#fxE') || {}).value || '').trim() : ''; return exec === 'Terceiro' && !empresa ? null : { exec, empresa }; }
const enxExecTxt = r => r && r.exec ? r.exec + (r.empresa ? ' · ' + r.empresa : '') : 'não informado';
// campo de foto com miniaturas e “✕ Limpar” (3.24, Supervisor: “como faço pra limpar quando coloco foto errada?”)
const enxFotoCampo = (id, lb) => `<div class="s3 fx-w"><label class="f">${lb}<input type="file" id="${id}" accept="image/*" multiple></label><div class="fx-pv" data-fxpv="${id}"></div></div>`;
const enxFotosCampos = () => `<div class="g">${enxFotoCampo('fxA', 'Registro fotográfico · antes')}${enxFotoCampo('fxD', 'Registro fotográfico · depois')}</div>`;
// cada escolha ACRESCENTA fotos (até 6; no celular a câmera tira uma por vez) — 3.25, Supervisor: “só está dando pra colocar 1 foto”
const fxArq = id => { const i = document.getElementById(id); return i ? (i._fx || [...i.files]) : []; };   // fotos escolhidas no campo (as acumuladas)
const fxDT = L => { const dt = new DataTransfer(); L.forEach(f => dt.items.add(f)); return dt.files; };
function fxMostra(i) { const pv = document.querySelector(`[data-fxpv="${i.id}"]`); if (!pv) return; const L = i._fx || [];
  pv.querySelectorAll('img').forEach(im => URL.revokeObjectURL(im.src));
  pv.innerHTML = L.length ? L.map((f, k) => `<span class="fx-t"><img src="${URL.createObjectURL(f)}" alt="" title="${esc(f.name)}"><button type="button" data-fxrm="${i.id}|${k}" title="Tirar esta foto">✕</button></span>`).join('')
    + `<span class="note">${L.length} de 6${L.length < 6 ? ' · clique em escolher de novo para acrescentar' : ''}</span><button type="button" class="mbtn sm" data-fxlimpa="${i.id}">✕ Limpar todas</button>` : ''; }
document.addEventListener('change', e => { const i = e.target; if (!i.matches || !i.matches('.fx-w input[type=file]')) return;
  const novos = [...i.files].filter(f => !(i._fx || []).includes(f)), L = (i._fx || []).concat(novos);
  if (L.length > 6) toast('Máximo de 6 fotos por campo: entraram as 6 primeiras.');
  i._fx = L.slice(0, 6); try { i.files = fxDT(i._fx); } catch (er) { } fxMostra(i); });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-fxlimpa],[data-fxrm]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  const [id, k] = (b.dataset.fxrm || b.dataset.fxlimpa).split('|'), i = document.getElementById(id); if (!i) return;
  i._fx = b.dataset.fxrm ? (i._fx || []).filter((f, j) => j !== +k) : [];
  try { i.files = fxDT(i._fx); } catch (er) { if (!i._fx.length) i.value = ''; } fxMostra(i); }, true);
{ const st = document.createElement('style'); st.textContent = '.fx-w{display:flex;flex-direction:column;gap:6px;min-width:0}.fx-pv{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.fx-pv:empty{display:none}.fx-pv img{width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #DADCE0;display:block}.fx-t{position:relative}.fx-t button{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:0;background:#D93025;color:#fff;font-size:11px;line-height:20px;padding:0;cursor:pointer}'; document.head.appendChild(st); }
async function enxFotosLer() {
  const A = fxArq('fxA'), D = fxArq('fxD'); if (!A.length || !D.length) return null;
  const out = [], at = Date.now(); for (const [tipo, L] of [['ANTES', A], ['DEPOIS', D]]) for (const f of L.slice(0, 6)) out.push({ tipo, src: await comprimir(f), at }); return out;
}
function enxFeitoModal() {
  if (!S.session) return loginModal(); const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços feitos.');
  const hp = [...new Set(S0.filter(y => intervalo(y.t, v, y.pos).h).map(y => posHor(y.pos, y.t, v.id)))];
  modal(`<h2>Apontamento de execução · OM preventiva · ${esc(v.nome)} · ${S0.length} serviço${S0.length === 1 ? '' : 's'}</h2><div class="note" style="max-height:180px;overflow:auto;border:1px solid var(--line,#dde);border-radius:6px;padding:6px 10px">${(() => { const G = new Map(); S0.forEach(y => { const k = enxEq(y.t) + ' · ' + posCurtoE(v, y.pos); if (!G.has(k)) G.set(k, []); G.get(k).push(enxCrit(y.t) ? '<b style="color:#B3261E">⚠ ' + esc(enxServ(y.t)) + ' (crítico)</b>' : esc(enxServ(y.t))); }); return [...G].map(([k, L]) => `<b>${esc(k)}</b><br>${L.join(' · ')}`).join('<br>'); })()}</div><p class="note">Transcreva aqui o formulário de campo assinado a bordo (🖨 Formulário de campo). Serviço marcado “Insp. OK” ou “Não feito” no papel: desmarque aqui e use “Inspecionado · sem intervenção” ou “Apontar não execução”.</p>
   <div class="g"><label class="f s3">Data de execução<input type="date" id="exD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s3">Nº da OM no Sankhya<input id="exO" inputmode="numeric"></label>${enxExecCampos()}<label class="f s6">Executante / responsável técnico<input id="exQ" placeholder="nomes da equipe ou responsável técnico do prestador"></label>
   ${hp.map(p => { const h = horAtual(v.id, p); return `<label class="f s3">Horímetro · ${esc(posCurtoE(v, p))}<input class="exH" data-pos="${p}" inputmode="decimal" value="${h ? h.h : ''}"></label>`; }).join('')}</div>
   ${enxCmpCampos(v, S0)}${enxFotosCampos()}<div class="note" id="exE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="exOk">Confirmar apontamento</button></div>`, true);
  $('#exOk').onclick = async () => { const d = $('#exD').value, om = $('#exO').value.replace(/\D/g, ''), quem = $('#exQ').value.trim(), H = {}, E = $('#exE');
    if (!d || d > isoD(hoje())) return E.textContent = 'Data inválida (não pode ser futura).'; if (om.length < 3) return E.textContent = 'Informe o nº da OM do Sankhya (rastreabilidade).'; if (!quem) return E.textContent = 'Informe quem executou.';
    for (const i of $$('#modal .exH')) { const h = +i.value.replace(',', '.'), a = horAtual(v.id, i.dataset.pos); if (!(h > 0)) return E.textContent = 'Informe o horímetro de ' + posCurtoE(v, i.dataset.pos) + '.'; if (a && !a.est && a.date <= d && h < a.h) return E.textContent = 'Horímetro de ' + posCurtoE(v, i.dataset.pos) + ' menor que a última leitura (' + nf(a.h) + ' h).'; if (a && !a.est && a.date <= d && h - a.h > (pD(d) - pD(a.date)) / 864e5 * 24 + 1) return E.textContent = 'Horímetro de ' + posCurtoE(v, i.dataset.pos) + ' impossível: ' + nf(h - a.h) + ' h a mais que a última leitura (' + nf(a.h) + ' h em ' + brD(a.date) + '). Confira o número.'; H[i.dataset.pos] = h; }
    for (const y of S0) { const L0 = y.s ? y.s.L : ultimoServico(v.id, y.pos, y.t.id); if (L0 && L0.date > d) return E.textContent = enxServ(y.t) + ': já há registro mais novo (' + brD(L0.date) + ').'; }
    const ex = enxExecLer(); if (!ex) return E.textContent = 'Execução por terceiro: informe a empresa.';
    const CMP = enxCmpLer(); if (typeof CMP === 'string') return E.textContent = CMP;
    E.textContent = 'Preparando as fotos…'; const fotos = await enxFotosLer(); if (!fotos) return E.textContent = 'Anexe ao menos uma foto de antes e uma de depois (evidência da execução).';
    const by = S.session.name, at = Date.now();
    for (const [k, y] of S0.entries()) { const hp1 = posHor(y.pos, y.t, v.id); await saveRec(Object.assign({ id: uid('base'), kind: 'base', vessel: v.id, pos: y.pos, item: y.t.id, h: H[hp1] ?? null, date: d, om, quem, exec: ex.exec, empresa: ex.empresa, by, enx: true, createdAt: at }, k ? {} : { fotos })); }   // as fotos ficam no primeiro serviço da OM
    for (const [p, h] of Object.entries(H)) await lubHor(v.id, p, h, d, 'OM ' + om);
    for (const c of CMP) { const h = H[c.pos] ?? (horAtual(v.id, c.pos) || {}).h; await saveRec({ id: uid('comp'), kind: 'comp', vessel: v.id, pos: c.pos, date: d, h: h == null ? null : +h, vals: c.vals, rpm: c.rpm, om, by, enx: true }); }
    closeModal(); toast(S0.length + ' serviço' + (S0.length === 1 ? '' : 's') + ' registrado' + (S0.length === 1 ? '' : 's') + ' com a OM ' + om + '.'); render(); enxIIB(v.id, om); };
}
// ensaio de compressão junto com a calibração dos bicos injetores (Anexo I 1.1.12; NP 055 7.3): aparece no apontamento quando o 1.1.12 está marcado
function enxCmpCampos(v, S0) {
  const P = [...new Set(S0.filter(y => y.t.id === '1.1.12' && isMcp(y.pos)).map(y => y.pos))]; if (!P.length) return '';
  return `<h3 style="margin:12px 0 4px">Ensaio de compressão do MCP · executado com a calibração dos bicos injetores (1.1.12)</h3><p class="note">Pressão de cada cilindro em MPa (ex.: 1,72) ou kgf/cm² (ex.: 17,5). Deixe em branco se o ensaio não foi feito; vai para 3.2 Compressão do MCP e para o relatório.</p>`
    + P.map(p => `<div class="g" data-cmpm="${p}"><div class="f s6"><b>${esc(posCurtoE(v, p))}</b></div>${[1, 2, 3, 4, 5, 6].map(i => `<label class="f s1">Cil. ${i}<input class="exC" inputmode="decimal"></label>`).join('')}<label class="f s2">Rotação (rpm)<input class="exR" inputmode="numeric" placeholder="~120"></label></div>`).join('');
}
function enxCmpLer() {
  const out = [], mpa = t => { const n = numBR(t); return n == null ? null : n > 4 ? n / 10.197 : n; };
  for (const b of $$('#modal [data-cmpm]')) { const I = [...b.querySelectorAll('.exC')].map(i => i.value.trim()); if (!I.some(Boolean)) continue;
    const N = I.map(mpa); if (N.some(n => n == null || n < 0.3 || n > 4)) return 'Compressão ' + b.dataset.cmpm + ': informe os 6 cilindros (MPa, ex.: 1,72, ou kgf/cm², ex.: 17,5).';
    out.push({ pos: b.dataset.cmpm, vals: N.map(n => n.toFixed(2).replace('.', ',')), rpm: (b.querySelector('.exR') || {}).value || '' }); }
  return out;
}
// inspecionado sem intervenção (Supervisor, 28/10/2026: “não precisa docar, mas também não posso dizer que foi feito, mas foi inspecionado”; “isso serve pra tudo”):
// base com insp: true, obs (justificativa), prox (data) e proxH (horímetro) da próxima avaliação — nunca além do intervalo normal; na docagem, nunca além da data-limite do CSN.
// Conta como atendido no cronograma (marca I), não é execução (relatório, II-B e docagem mostram à parte) e não muda a última docagem real.
function enxInspModal() {
  if (!S.session) return loginModal(); const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços inspecionados.');
  const hp = [...new Set(S0.filter(y => intervalo(y.t, v, y.pos).h).map(y => posHor(y.pos, y.t, v.id)))], lim = docaLim(v.id);
  const lin = (y, i) => { const iv = intervalo(y.t, v, y.pos);
    return `<tr><td>${enxCrit(y.t) ? '<b style="color:#B3261E">⚠ </b>' : ''}<b>${esc(enxServ(y.t))}</b><div class="note">${esc(enxEq(y.t))} · ${esc(posCurtoE(v, y.pos))} · a cada ${esc(enxIv(y.t, v, y.pos))}</div></td>
      <td>${iv.m ? `<input class="isM" data-i="${i}" inputmode="numeric" value="${iv.m}" style="width:70px"> meses <span class="note">(máx. ${iv.m})</span>` : '—'}</td><td>${iv.h ? `<input class="isH" data-i="${i}" inputmode="numeric" value="${iv.h}" style="width:80px"> h <span class="note">(máx. ${nf(iv.h)})</span>` : '—'}</td></tr>`; };
  modal(`<h2>Inspecionado · sem intervenção · ${esc(v.nome)} · ${S0.length} serviço${S0.length === 1 ? '' : 's'}</h2>
   <p class="note">Use quando avaliou e não precisa intervir agora (ex.: casco sem corrosão relevante, não precisa docar; zinco ainda bom). Fica no histórico como <b>inspeção</b>, não como execução. O cronograma marca <b>I</b> (atendido) e o próximo vencimento passa a ser a próxima avaliação abaixo, que pode ser antes do intervalo normal, nunca depois.${S0.some(y => y.t.id === DOCA.item) ? ` <b>Docagem:</b> a última docagem continua a real; a próxima avaliação não passa da data-limite do CSN${lim && lim.date ? ' (' + brD(lim.date) + ')' : ''}.` : ''}</p>
   <div class="tw"><table class="t"><thead><tr><th>Serviço</th><th>Próxima avaliação em</th><th>ou em horas</th></tr></thead><tbody>${S0.map(lin).join('')}</tbody></table></div>
   <div class="g"><label class="f s3">Data da inspeção<input type="date" id="isD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s3">Nº da OM no Sankhya<input id="isO" inputmode="numeric"></label>${enxExecCampos()}<label class="f s6">Inspecionado por<input id="isQ" placeholder="nome de quem inspecionou"></label>
   ${hp.map(p => { const h = horAtual(v.id, p); return `<label class="f s3">Horímetro · ${esc(posCurtoE(v, p))}<input class="isHr" data-pos="${p}" inputmode="decimal" value="${h ? h.h : ''}"></label>`; }).join('')}
   <label class="f s6">O que foi verificado e por que não precisa intervir agora (obrigatório)<textarea id="isJ" rows="2" placeholder="ex.: casco inspecionado, sem corrosão relevante nem perda de espessura aparente; reavaliar em 12 meses"></textarea></label></div>
   ${enxFotosCampos()}<div class="note" id="isE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="isOk">Registrar inspeção</button></div>`, true);
  $('#isOk').onclick = async () => { const d = $('#isD').value, om = $('#isO').value.replace(/\D/g, ''), quem = $('#isQ').value.trim(), just = $('#isJ').value.trim(), H = {}, E = $('#isE');
    if (!d || d > isoD(hoje())) return E.textContent = 'Data inválida (não pode ser futura).'; if (om.length < 3) return E.textContent = 'Informe o nº da OM do Sankhya (rastreabilidade).'; if (!quem) return E.textContent = 'Informe quem inspecionou.';
    if (just.length < 10) return E.textContent = 'Descreva o que foi verificado e por que não precisa intervir (evidência para a auditoria).';
    for (const i of $$('#modal .isHr')) { const h = +i.value.replace(',', '.'), a = horAtual(v.id, i.dataset.pos); if (!(h > 0)) return E.textContent = 'Informe o horímetro de ' + posCurtoE(v, i.dataset.pos) + '.'; if (a && !a.est && a.date <= d && h < a.h) return E.textContent = 'Horímetro de ' + posCurtoE(v, i.dataset.pos) + ' menor que a última leitura (' + nf(a.h) + ' h).'; if (a && !a.est && a.date <= d && h - a.h > (pD(d) - pD(a.date)) / 864e5 * 24 + 1) return E.textContent = 'Horímetro de ' + posCurtoE(v, i.dataset.pos) + ' impossível: ' + nf(h - a.h) + ' h a mais que a última leitura. Confira o número.'; H[i.dataset.pos] = h; }
    const P = [];
    for (const [i, y] of S0.entries()) { const iv = intervalo(y.t, v, y.pos), mI = $(`#modal .isM[data-i="${i}"]`), hI = $(`#modal .isH[data-i="${i}"]`), nm = enxServ(y.t);
      const L0 = y.s ? y.s.L : ultimoServico(v.id, y.pos, y.t.id); if (L0 && L0.date > d) return E.textContent = nm + ': já há registro mais novo (' + brD(L0.date) + ').';
      let prox = null, proxH = null;
      if (mI) { const m = +mI.value.replace(',', '.'); if (!(m > 0) || m > iv.m) return E.textContent = nm + ': próxima avaliação entre 1 e ' + iv.m + ' meses.'; prox = isoD(addM(pD(d), m)); }
      if (hI) { const n = +hI.value.replace(/\./g, '').replace(',', '.'), h0 = H[posHor(y.pos, y.t, v.id)]; if (!(n > 0) || n > iv.h) return E.textContent = nm + ': próxima avaliação entre 1 e ' + nf(iv.h) + ' h.'; proxH = h0 != null ? h0 + n : null; }
      if (y.t.id === DOCA.item && lim && lim.date && prox && prox > lim.date) return E.textContent = 'Docagem: a próxima avaliação (' + brD(prox) + ') passa da data-limite do CSN (' + brD(lim.date) + '). Diminua os meses.';
      P.push({ y, prox, proxH }); }
    const ex = enxExecLer(); if (!ex) return E.textContent = 'Execução por terceiro: informe a empresa.';
    if (!fxArq('fxA').length && !fxArq('fxD').length) return E.textContent = 'Anexe ao menos uma foto da inspeção (evidência).';
    E.textContent = 'Preparando as fotos…'; const fotos = []; for (const [tipo, id] of [['ANTES', 'fxA'], ['DEPOIS', 'fxD']]) for (const f of fxArq(id).slice(0, 6)) fotos.push({ tipo, src: await comprimir(f), at: Date.now() });
    const by = S.session.name, at = Date.now();
    for (const [k, x] of P.entries()) { const hp1 = posHor(x.y.pos, x.y.t, v.id); await saveRec(Object.assign({ id: uid('base'), kind: 'base', vessel: v.id, pos: x.y.pos, item: x.y.t.id, h: H[hp1] ?? null, date: d, insp: true, obs: just, prox: x.prox, proxH: x.proxH, om, quem, exec: ex.exec, empresa: ex.empresa, by, enx: true, createdAt: at }, k ? {} : { fotos })); }
    for (const [p, h] of Object.entries(H)) await lubHor(v.id, p, h, d, 'OM ' + om);
    closeModal(); toast(P.length + ' serviço' + (P.length === 1 ? '' : 's') + ' registrado' + (P.length === 1 ? '' : 's') + ' como inspecionado sem intervenção (OM ' + om + ').'); render(); enxIIB(v.id, om); };
}
function enxNFModal() {
  if (!S.session) return loginModal(); const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços não feitos.');
  modal(`<h2>Apontamento de não execução · ${esc(v.nome)}</h2><p class="note">Fica registrado com o motivo (evidência para a auditoria). O serviço continua vencido até ser feito.</p>
   <div class="g"><label class="f s3">Data<input type="date" id="nfD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s3">Nº da OM (se houver)<input id="nfO" inputmode="numeric"></label></div>
   <label class="f">Motivo<select id="nfM"><option value="">Escolha…</option><option>Indisponibilidade de material / sobressalente</option><option>Janela de manutenção insuficiente (saída antecipada)</option><option>Indisponibilidade de mão de obra</option><option>Aguardando prestador de serviço</option><option>Outro</option></select></label><label class="f">Justificativa<input id="nfX"></label>
   <div class="note" id="nfE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="nfOk">Confirmar apontamento</button></div>`, true);
  $('#nfOk').onclick = async () => { const d = $('#nfD').value, m = $('#nfM').value, motivo = m + ($('#nfX').value.trim() ? ': ' + $('#nfX').value.trim() : '');
    if (!d || !m) return $('#nfE').textContent = 'Informe a data e o motivo.'; const by = S.session.name;
    for (const y of S0) await saveRec({ id: uid('base'), kind: 'base', vessel: v.id, pos: y.pos, item: y.t.id, h: null, date: d, nf: true, motivo, om: $('#nfO').value.replace(/\D/g, ''), by, enx: true });
    closeModal(); toast('Registrado como não feito.'); render(); };
}
// ---------- 1 · Horímetros ----------
const ENXH = { v: '' };
function vEnxHor() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), idade = v => { const h = horAtual(v.id, mpos(v.id)); return h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : 999; };
  if (!V.some(v => v.id === ENXH.v)) ENXH.v = (V.slice().sort((a, b) => idade(b) - idade(a))[0] || {}).id;   // abre no que está há mais tempo sem leitura
  const lin = v => posicoes(v).filter(p => p !== 'UN').map((p, i) => { const h = horAtual(v.id, p), d = h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : null;
    return `<tr>${i ? '<td></td>' : `<td><b>${esc(v.nome)}</b></td>`}<td>${esc(posCurtoE(v, p))}</td><td class="r">${h ? nf(h.h) + ' h' + (h.est ? ' <span class="note">estimado</span>' : '') : '—'}</td><td>${h ? brD(h.date) : '—'}${d != null && d > 14 ? ` <span class="pill p-warn">há ${d} dias</span>` : ''}</td><td><input class="ehH" data-v="${v.id}" data-p="${p}" inputmode="decimal" placeholder="nova leitura" style="width:120px"> ${h && !h.est ? `<button class="mbtn sm" data-ehno="${v.id}|${p}" title="Motor parado: repete a última leitura (0 h no período)">Sem operação</button>` : ''}</td></tr>`; }).join('');
  return enxCab('1.1 Apontamento de horímetros', 'Na chegada ao porto: lance a leitura de cada motor · os serviços por horas vencem por estas leituras · em âmbar, os que estão há mais de 14 dias sem leitura', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Leitura de horímetros</h2><div class="row" style="gap:8px;margin-bottom:8px"><label class="f">Data da leitura<input type="date" id="ehD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><span class="sp"></span><button class="mbtn pri" data-ehsalvar>Registrar leituras</button></div>
     <div class="cm-chips" style="margin-bottom:8px">${V.map(v => { const d = idade(v); return `<button class="cm-chip${v.id === ENXH.v ? ' on' : ''}" data-ehv="${v.id}">${esc(v.nome)}${d > 14 ? ` <b style="color:var(--warnt)">${d === 999 ? 'sem leitura' : d + ' d'}</b>` : ''}</button>`; }).join('')}</div>
     <div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Motor</th><th class="r">Última leitura</th><th>Data</th><th>Nova leitura</th></tr></thead><tbody>${V.filter(v => v.id === ENXH.v).map(lin).join('')}</tbody></table></div>
     <p class="note">Motor que não rodou: “Sem operação” repete a última leitura e o relatório mensal conta 0 h confirmado (sem leitura no mês também sai 0 h, mas com o aviso “sem leitura”). Leitura menor que a anterior ou com mais horas do que dias × 24 é recusada: confira o número (horímetro trocado ou que voltou a zero se ajusta no Modo completo).</p></div>${typeof pcmHorIncCard === 'function' ? pcmHorIncCard() : ''}</div></div>`;
}
async function enxHorSalvar() {
  if (!S.session) return loginModal(); const d = $('#ehD').value; if (!d || d > isoD(hoje())) return toast('Data inválida.');
  const L = $$('#main .ehH').filter(i => i.value.trim()), erro = []; let ok = 0;
  for (const i of L) { const v = vessel(i.dataset.v), p = i.dataset.p, h = +i.value.trim().replace(/\./g, '').replace(',', '.'), a = horAtual(v.id, p), nome = v.nome + ' · ' + posCurtoE(v, p);
    if (!(h > 0)) { erro.push(nome + ': número inválido'); continue; }
    if (a && !a.est && a.date <= d && h < a.h) { erro.push(nome + ': menor que a última (' + nf(a.h) + ' h)'); continue; }
    if (a && !a.est && a.date < d && h - a.h > (pD(d) - pD(a.date)) / 864e5 * 24 + 1) { erro.push(nome + ': mais horas do que o tempo desde a última leitura'); continue; }
    if (await lubHor(v.id, p, h, d, 'Horímetros')) ok++; }
  toast(ok + ' leitura' + (ok === 1 ? '' : 's') + ' salva' + (ok === 1 ? '' : 's') + (erro.length ? ' · ' + erro.length + ' recusada' + (erro.length === 1 ? '' : 's') : '') + '.', 6000);
  if (erro.length) modal(`<h2>Leituras recusadas</h2><ul>${erro.map(e => `<li>${esc(e)}</li>`).join('')}</ul><div class="row end"><button class="mbtn pri" data-close>Fechar</button></div>`); render(); }
// ---------- relatórios de preventiva emitidos antes da 3.5 (só a reimpressão; o relatório mensal está em js/86) ----------
function enxRelHTML(R, emi) {
  const pc = (vid, pos) => { const v = vessel(vid); return v ? posCurtoE(v, pos) : pos; }, sv = id => A1M[id] ? enxServ(A1M[id]) : id;
  const t = (cab, L, w) => L.length ? `<table class="t"><thead><tr>${cab.map((c, i) => `<th${w && w[i] ? ` style="width:${w[i]}"` : ''}>${c}</th>`).join('')}</tr></thead><tbody>${L.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum.</p>';
  return `<div class="enx-rel"><p><b>Referência:</b> ${esc(R.ref)} · <b>Aderência no mês:</b> ${R.ad == null ? '—' : R.ad + '%'} (feito no prazo ÷ o que venceu; referência ≥ 90%) · previsto ${R.T.prev} · no prazo ${R.T.ok} · com atraso ${R.T.late} · não executado no prazo ${R.T.miss}${R.semHist ? ` · <span class="rl-ruim">${R.semHist} serviços sem histórico (não entram)</span>` : ''}</p>
   <h3>1 · Por empurrador</h3><table class="t"><thead><tr><th>Empurrador</th><th class="r">Previsto</th><th class="r">No prazo</th><th class="r">Com atraso</th><th class="r">Não executado</th><th class="r">Aderência mês</th><th class="r">Aderência ano</th><th>Cronograma aprovado</th></tr></thead><tbody>${R.por.map(p => `<tr><td><b>${esc(p.nome)}</b></td><td class="r">${p.prev}</td><td class="r">${p.ok}</td><td class="r">${p.late}</td><td class="r">${p.miss}</td><td class="r">${p.ad == null ? '—' : p.ad + '%'}</td><td class="r">${p.adAno == null ? '—' : p.adAno + '%'}</td><td>${p.aprov ? 'sim' : 'não'}</td></tr>`).join('')}</tbody></table>
   ${R.ads ? `<h3>2 · Aderência mês a mês · ${R.ano}</h3><div class="enx-gr">${balBarras(R.ads.map((a, i) => [MESES[i], a]), v => Math.round(v) + '%', 90, true)}</div><p class="note">Feito no prazo ÷ o que venceu em cada mês · linha tracejada = referência de 90% · vermelho = abaixo dela.</p>` : ''}
   ${R.cor ? `<h3>3 · Corretivas do mês · ${R.cor.length}</h3><p>Horas paradas: <b>${nf(R.hPar || 0, 1)} h</b> · MTTR (tempo médio do início à liberação): <b>${R.mttr == null ? '—' : nf(R.mttr, 1) + ' h'}</b> (meta NP 055: ≤ 8 h)</p>${t(['Início', 'Empurrador', 'OM', 'Equipamento', 'Classe', 'Parado'], R.cor.map(c => [brD(c[0]), vName(c[1]), c[2] || '—', c[3], c[4], c[5] == null ? 'em aberto' : nf(c[5], 1) + ' h']))}` : ''}
   <h3>4 · OMs preventivas do mês · ${R.feitos.length} serviços</h3>${(() => { const G = {}; R.feitos.forEach(f => { const k = f[1] + '|' + (f[4] || ''); const g = G[k] = G[k] || { d: f[0], v: f[1], om: f[4], n: 0, q: new Set() }; g.n++; if (f[0] > g.d) g.d = f[0]; if (f[5]) g.q.add(f[5]); });
     return t(['Data', 'Empurrador', 'OM (Sankhya)', 'Serviços', 'Executou'], Object.values(G).sort((a, b) => a.d < b.d ? -1 : 1).map(g => [brD(g.d), vName(g.v), g.om || 'sem OM (registro anterior)', String(g.n), [...g.q].join(', ')]), ['12%', '16%', '18%', '10%', '44%']); })()}
   <p class="note">O detalhe de cada OM (serviço por serviço e assinaturas) está no Anexo II-B anexado na OM do Sankhya.</p>
   <h3>5 · Não feitos, com motivo</h3>${t(['Data', 'Empurrador', 'Serviço', 'Motivo'], R.nfs.map(f => [brD(f[0]), vName(f[1]), sv(f[2]), f[3]]))}
   <h3>6 · Vencidos na data ${emi ? 'da emissão' : 'de hoje'} · ${R.venc.length}</h3>${(() => { const G = {}; R.venc.forEach(f => { (G[f[0]] = G[f[0]] || []).push(sv(f[2])); });
     return t(['Empurrador', 'Vencidos', 'Serviços'], Object.entries(G).sort((a, b) => b[1].length - a[1].length).map(([v, L]) => [vName(v), String(L.length), L.slice(0, 6).join(' · ') + (L.length > 6 ? ` · e mais ${L.length - 6}` : '')]), ['16%', '10%', '74%']); })()}
   <p class="note">Vencem ainda no mês: ${R.mes.length} serviços (lista na tela 3 · Executar).</p>
   ${emi ? `<p class="note">Emitido em ${esc(emi.em)} por ${esc(emi.por)} · ${esc(emi.num)} · cópia congelada: não muda se os registros forem corrigidos depois.</p><table class="rl-ass"><tr><th>Elaborado por</th><th>Aprovado por</th></tr><tr><td>Supervisor de Manutenção</td><td>Gerência</td></tr><tr><td class="rl-lin">Assinatura e data</td><td class="rl-lin">Assinatura e data</td></tr></table>` : ''}</div>`;
}
const enxEmitidos = () => recs('snap').filter(s => s.tipo === 'relprev' && !s.excluido).sort((a, b) => (b.at || 0) - (a.at || 0));
function enxRelImprimir(s) {
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(tituloArq(s.num))}</title><style>@page{size:A4;margin:10mm}${DOC_CAB_CSS}body{font:11px Arial,sans-serif;color:#202124;margin:0}h3{font-size:12px;color:#1F2A44;margin:12px 0 4px}.enx-gr svg{max-height:170px;width:100%}table{width:100%;border-collapse:collapse;margin-bottom:4px}th,td{border:1px solid #CBD5E1;padding:3px 5px;text-align:left;vertical-align:top}th{background:#16244A;color:#fff;font-size:10px}.r{text-align:right}.note{color:#5F6368;font-size:10px}.rl-ruim{color:#C5221F}.rl-ass th{width:50%}.rl-lin{height:34px;vertical-align:bottom;color:#5F6368}tr{page-break-inside:avoid}thead{display:table-header-group}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
   ${docCab('RELATÓRIO DE MANUTENÇÃO PREVENTIVA', `Empurradores fluviais · ${esc(s.dados.ref)} · ${esc(s.num)}`, 'NP Navecunha 055 · itens 7.3 e 9 · Anexo I')}${enxRelHTML(s.dados, s)}<script>setTimeout(function(){window.print()},600)<\/script></body></html>`); w.document.close();
}
// ---------- Modo completo (só o Supervisor, neste aparelho) ----------
function enxAdminHTML() {
  if (!can.admin()) return '';
  return `<div class="card"><h2>Modo do SMF neste aparelho</h2><p class="note">O SMF abre no modo enxuto: Horímetros, Cronograma, Executar, Corretivas, Relatório mensal, Óleo, Compressão e Biblioteca. O modo completo mostra de novo todas as telas antigas (OMs, Anexo II, falhas, FR 027_L, indicadores…). Nada foi apagado.</p>
    <label class="row" style="gap:8px"><input type="checkbox" data-enxmc${enxModoCompleto() ? ' checked' : ''}> Modo completo neste aparelho</label></div>`;
}
// ---------- Anexo II simples = relatório de serviço realizado, uma folha (Supervisor, 27/10/2026) ----------
// II-B (preventiva): os serviços registrados com o mesmo nº de OM · II-A (corretiva): o registro da corretiva. Sem nº de item, passo a passo nem medição.
// título da janela de impressão só em ASCII: a impressora “Microsoft Print to PDF” grava acento e “·” corrompidos no título do PDF e o visualizador do Edge não abre o arquivo (Supervisor, 27/10/2026)
const tituloArq = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '-').replace(/\s+-\s+|\s{2,}/g, ' - ').trim();
function enxDoc(tit, sub, corpo) {
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(tituloArq(tit))}</title><style>@page{size:A4;margin:10mm}${DOC_CAB_CSS}body{font:11.5px Arial,sans-serif;color:#202124;margin:0}h3{font-size:12px;color:#1F2A44;margin:12px 0 4px}
   table{width:100%;border-collapse:collapse;margin-bottom:6px}th,td{border:1px solid #CBD5E1;padding:4px 6px;text-align:left;vertical-align:top}th{background:#16244A;color:#fff;font-size:10.5px}.k td:first-child{width:24%;background:#F4F6F9;font-weight:600}.ass td{height:46px;vertical-align:bottom;color:#5F6368;font-size:10px;width:33%}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
   ${docCab(tit, sub, 'NP Navecunha 055 · Anexo II · Rev. 00')}${corpo}<script>setTimeout(function(){window.print()},600)<\/script></body></html>`); w.document.close(); }
const enxAss = (a, b, c) => `<h3>Assinaturas</h3><table class="ass"><tr><th>${a}</th><th>${b}</th><th>${c}</th></tr><tr><td>Nome, assinatura e data</td><td>Nome, assinatura e data</td><td>Nome, assinatura e data</td></tr></table>`;
const enxK = L => `<table class="k">${L.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
function enxIIB(vid, om) {
  const v = vessel(vid), B = recs('base').filter(r => r.vessel === vid && r.om === om && !r.excluido && A1M[r.item]); if (!B.length) return toast('Nenhum serviço com a OM ' + om + '.');
  const F = B.filter(r => !r.nf && !r.insp), I = B.filter(r => r.insp), N = B.filter(r => r.nf), d = B.map(r => r.date).sort().pop(), hs = [...new Set(F.concat(I).filter(r => r.h != null).map(r => posCurtoE(v, posHor(r.pos, A1M[r.item], vid)) + ': ' + nf(r.h) + ' h'))];
  enxDoc('ANEXO II-B · RELATÓRIO DE SERVIÇO REALIZADO · PREVENTIVA', `${esc(v.nome)} · OM ${esc(om)}`,
    enxK([['Empurrador', esc(v.nome)], ['OM (Sankhya)', esc(om)], ['Data', brD(d)], ['Horímetro', esc(hs.join(' · ') || '—')], ['Execução', esc(enxExecTxt(F[0] || I[0]))], ['Executado por', esc([...new Set(F.concat(I).map(r => r.quem).filter(Boolean))].join(', ') || '—')]])
    + (B.some(r => enxCrit(A1M[r.item])) ? enxCritLeg : '') + (F.length ? `<h3>Serviços realizados · ${F.length}</h3><table><thead><tr><th style="width:30%">Equipamento</th><th>Serviço</th></tr></thead><tbody>${F.map(r => `<tr${enxCrit(A1M[r.item]) ? ' style="background:#FDECEA"' : ''}><td>${esc(enxEq(A1M[r.item]))} · ${esc(posCurtoE(v, r.pos))}</td><td>${esc(enxServ(A1M[r.item]))}${enxCrit(A1M[r.item]) ? ' ' + enxCritDoc : ''}</td></tr>`).join('')}</tbody></table>` : '')
    + (I.length ? `<h3>Inspecionados · sem intervenção · ${I.length}</h3><table><thead><tr><th style="width:26%">Equipamento</th><th>Serviço</th><th style="width:30%">O que foi verificado</th><th style="width:15%">Próxima avaliação</th></tr></thead><tbody>${I.map(r => `<tr${enxCrit(A1M[r.item]) ? ' style="background:#FDECEA"' : ''}><td>${esc(enxEq(A1M[r.item]))} · ${esc(posCurtoE(v, r.pos))}</td><td>${esc(enxServ(A1M[r.item]))}${enxCrit(A1M[r.item]) ? ' ' + enxCritDoc : ''}</td><td>${esc(r.obs || '')}</td><td>${[r.prox ? brD(r.prox) : '', r.proxH != null ? nf(r.proxH) + ' h' : ''].filter(Boolean).join(' ou ') || '—'}</td></tr>`).join('')}</tbody></table>` : '')
    + (N.length ? `<h3>Não realizados · ${N.length}</h3><table><thead><tr><th style="width:30%">Equipamento</th><th>Serviço</th><th style="width:30%">Motivo</th></tr></thead><tbody>${N.map(r => `<tr><td>${esc(enxEq(A1M[r.item]))}</td><td>${esc(enxServ(A1M[r.item]))}${enxCrit(A1M[r.item]) ? ' ' + enxCritDoc : ''}</td><td>${esc(r.motivo || '')}</td></tr>`).join('')}</tbody></table>` : '')
    + '<h3>Observações</h3><table><tr><td style="height:44px"></td></tr></table>' + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'));
}
// ---------- Anexo II-A técnico (Supervisor, 28/10/2026: “precisa ter capa, contracapa, índice, ser técnico, palavras técnicas, evidência de fotos”) ----------
// Relatório Técnico de Manutenção Corretiva: capa · índice · 1 identificação · 2 descrição da falha · 3 diagnóstico e causa · 4 intervenção · 5 tempos e disponibilidade ·
// 6 teste funcional e liberação · 7 recomendações e recorrência · 8 registro fotográfico · 9 rastreabilidade · 10 aprovação · contracapa (controle, referências, glossário).
// Paginação na própria janela: cada seção entra inteira na folha A4; o índice lê a folha de cada seção. Fotos: as do registro ou a cópia do Drive (getFile), 6 por folha.
const ENX_DETEC = ['Inspeção de rotina a bordo (NP 5.4)', 'Operação · relato da tripulação', 'Alarme ou instrumento do painel', 'Check-list de chegada (FR 027_L)', 'Manutenção preventiva programada', 'Monitoramento de condição (óleo, compressão, parâmetros)', 'Outro'];
const enxSel_ = (id, L, val, vazio) => `<select id="${id}">${vazio ? `<option value="">${vazio}</option>` : ''}${L.map(x => `<option${x === val ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
async function enxIIA(o) {
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  w.document.write('<p style="font:14px Arial;padding:20px">Montando o Anexo II-A…</p>');
  const v = vessel(o.vessel), nm = v ? v.nome : o.vessel, X = s => esc(s == null || s === '' ? '—' : String(s)), NI = s => s && String(s).trim() ? esc(s) : '<i style="color:#80868B">não informado</i>';
  const ini = o.abertura ? new Date(o.abertura) : null, lib = o.liberacao ? new Date(o.liberacao) : null, ttr = ini && lib ? (lib - ini) / 36e5 : null, cl = CLASSES[o.classe] || null;
  const fH = h => h == null ? '—' : h < 1 ? Math.round(h * 60) + ' min' : nf(h, 1) + ' h';
  const sisN = parseInt(o.sistema || ''), crit63 = sisN >= 1 && sisN <= 8;
  const st = o.status === 'encerrada' ? 'Encerrada (conferida pelo Supervisor)' : o.liberacao ? 'Liberada para operação · aguardando conferência' : 'Em reparo · ativo indisponível';
  const rec12 = oms().filter(x => x.tipo === 'C' && !x.excluido && x.id !== o.id && x.vessel === o.vessel && x.abertura && ini && (ini - new Date(x.abertura)) < 365 * 864e5 && (ini - new Date(x.abertura)) >= 0
    && ((o.equip && String(x.equip || '').trim().toLowerCase() === String(o.equip).trim().toLowerCase()) || (!o.equip && x.sistema === o.sistema)));
  // fotos: do registro ou do Drive
  const F = []; for (const f of (o.fotos || [])) { let src = f.src || ''; if (!src && f.fid && S.url && S.session) { try { const j = await api('getFile', { fileId: f.fid }); if (j.ok) src = 'data:' + (j.mime || 'image/jpeg') + ';base64,' + j.data; } catch (e) { } } F.push({ src, tipo: f.tipo || '', at: f.at }); }
  const leg = { 'ANTES': 'Condição encontrada · antes da intervenção', 'DEPOIS': 'Condição após a intervenção' };
  const T = (L) => `<table class="k">${L.map(([k, val]) => `<tr><td>${k}</td><td>${val}</td></tr>`).join('')}</table>`;
  const box = (t, s, h) => `<h4>${t}</h4><div class="bx" style="min-height:${h || 30}px">${s && String(s).trim() ? esc(s).replace(/\n/g, '<br>') : '<i style="color:#80868B">não informado</i>'}</div>`;
  const sec = (n, t, html, nova) => `<section data-t="${n} ${esc(t)}"${nova ? ' data-nova="1"' : ''}><h2><span class="nu">${n}</span>${esc(t)}</h2>${html}</section>`;
  const S1 = sec(1, 'Identificação do ativo e da ordem de manutenção', T([['Empurrador', X(nm)], ['Ordem de manutenção (Sankhya)', X(o.num)], ['Sistema', X(o.sistema)], ['Equipamento / componente', NI(o.equip)],
    ['Criticidade da falha (NP 055 · 5.5.1)', `${X(o.classe)}${cl ? ' · prazo de atendimento: ' + esc(cl.prazo) + ' · ' + esc(cl.acao) : ''}`], ['Equipamento crítico (NP 055 · 6.3)', crit63 ? 'Sim · sistema relacionado na tabela de equipamentos críticos' : 'Não relacionado na tabela 6.3'],
    ['Horímetro do equipamento', o.horimetro ? nf(+o.horimetro) + ' h' : NI('')], ['Situação da OM', esc(st)]]));
  const S2 = sec(2, 'Descrição da falha', T([['Data e hora da detecção', X(brDT(o.deteccao || o.abertura))], ['Método de detecção', NI(o.detec)], ['Modo de falha (ISO 14224)', NI(o.modo)], ['Consequência / impacto', NI(o.impacto)]])
    + box('Sintoma observado', o.descricao, 40));
  const S3 = sec(3, 'Diagnóstico e causa da falha', T([['Causa da falha (categoria)', NI(o.causaCat)]]) + box('Análise técnica da causa', o.causa, 50));
  const S4 = sec(4, 'Intervenção executada', box('Descrição técnica da intervenção', o.servicos, 60) + box('Peças, materiais e consumíveis aplicados', o.materiais, 30)
    + T([['Mão de obra', esc(enxExecTxt(o))], ['Executante / responsável técnico', NI(o.execn)]]));
  const prazoOk = cl && ini && o.inicio ? ((new Date(o.inicio) - ini) / 36e5 <= cl.h ? 'Atendido' : 'Fora do prazo') : '—';
  const S5 = sec(5, 'Tempos de reparo e disponibilidade', T([['Início da indisponibilidade (parada)', X(brDT(o.abertura))], ['Liberação para operação', lib ? X(brDT(o.liberacao)) : 'Ainda em reparo'],
    ['Tempo de reparo (TTR)', ttr != null ? fH(ttr) : 'em curso'], ['Indisponibilidade do empurrador', ttr != null ? fH(ttr) + ' (do início da parada à liberação)' : 'em curso'], ['Prazo de atendimento da criticidade', esc(cl ? cl.prazo : '—') + ' · ' + prazoOk]])
    + '<p class="nt">O TTR deste registro alimenta o MTTR e a disponibilidade da frota no relatório gerencial (NP 055 · item 9).</p>');
  const S6 = sec(6, 'Teste funcional e liberação para operação', T([['Teste funcional após o reparo', NI(o.teste)], ['Resultado', NI(o.resultado)], ['Liberado para operação em', lib ? X(brDT(o.liberacao)) : '—'],
    ['Conferido e encerrado por', o.aprovBy ? esc(o.aprovBy) + (o.aprovAt ? ' · ' + brD(o.aprovAt) : '') : NI('')]]));
  const S7 = sec(7, 'Recomendações e análise de recorrência', box('Recomendação / ação para evitar a recorrência', o.mitig, 40)
    + T([['Falhas no mesmo equipamento (12 meses anteriores)', rec12.length ? `<b>${rec12.length}</b> · OM ${rec12.map(x => esc(x.num || '—')).join(', ')}${rec12.length >= 2 ? ' · <b style="color:#B3261E">falha repetitiva: avaliar análise de causa raiz e revisão do plano (Anexo I)</b>' : ''}` : 'Nenhuma registrada']]));
  const fotosHTML = F.length ? (() => { const P = []; for (let i = 0; i < F.length; i += 6) P.push(F.slice(i, i + 6)); return P.map((L, k) => sec(8, 'Registro fotográfico (evidências)' + (P.length > 1 ? ` · ${k + 1}/${P.length}` : ''),
    `<div class="ft">${L.map((f, j) => `<figure>${f.src ? `<img src="${f.src}">` : '<div class="sem">imagem no Google Drive, indisponível neste aparelho</div>'}<figcaption><b>Foto ${k * 6 + j + 1}</b> · ${esc(leg[f.tipo] || f.tipo || 'Evidência')}${f.at ? ' · ' + new Date(f.at).toLocaleString('pt-BR').slice(0, 17) : ''}</figcaption></figure>`).join('')}</div>`, true)).join(''); })()
    : sec(8, 'Registro fotográfico (evidências)', '<p class="nt">Sem fotos registradas nesta OM. A NP 055 (5.8) exige foto de antes e de depois.</p>', true);
  const S9 = sec(9, 'Rastreabilidade da OM', (o.hist || []).length ? `<table class="g"><thead><tr><th style="width:24%">Data e hora</th><th style="width:26%">Responsável</th><th>Evento</th></tr></thead><tbody>${o.hist.map(h => `<tr><td>${new Date(h.at).toLocaleString('pt-BR').slice(0, 17)}</td><td>${esc(h.by || '')}</td><td>${esc(h.ev || '')}</td></tr>`).join('')}</tbody></table>` : '<p class="nt">Sem eventos registrados.</p>');
  const ass = ['Executante / responsável técnico', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'].concat(o.classe === 'Crítica' ? ['Coordenador de Operações (falha Crítica)'] : []);
  const S10 = sec(10, 'Aprovação', `<table class="as"><tr>${ass.map(a => `<th>${a}</th>`).join('')}</tr><tr>${ass.map(() => '<td>Nome, assinatura e data</td>').join('')}</tr></table>`);
  const lg = k => `<img src="${docLogo(k)}">`, rel = 'RTC-' + (o.num || o.id);
  const capa = `<div class="pg capa"><div class="cl">${lg('nav')}${lg('vda')}</div><div class="ct"><p class="k1">ANEXO II-A · NP NAVECUNHA 055</p><h1>Relatório Técnico de<br>Manutenção Corretiva</h1><p class="k2">${X(nm)} · OM ${X(o.num)}</p>
    <table class="k ck">${[['Relatório nº', rel], ['Sistema', X(o.sistema)], ['Equipamento / componente', NI(o.equip)], ['Criticidade', X(o.classe)], ['Data da falha', X(brDT(o.abertura))], ['Liberação para operação', lib ? X(brDT(o.liberacao)) : 'em reparo'], ['Situação', esc(st)], ['Emitido em', new Date().toLocaleString('pt-BR').slice(0, 17) + ' · ' + esc(S.session ? S.session.name : '')]].map(([k, val]) => `<tr><td>${k}</td><td>${val}</td></tr>`).join('')}</table></div>
    <p class="rd">Gerência de Manutenção · Frota de Empurradores Fluviais</p></div>`;
  const contra = `<div class="pg"><div class="hd2">${esc(rel)} · Controle do documento</div><h2><span class="nu">·</span>Contracapa · controle do documento</h2>
    ${T([['Documento', 'Anexo II-A · Relatório Técnico de Manutenção Corretiva'], ['Número', esc(rel)], ['Revisão', '00 · emissão inicial'], ['Gerado por', 'SMF · Sistema de Manutenção da Frota · versão ' + esc(typeof VERSAO_APP !== 'undefined' ? VERSAO_APP : '')], ['Arquivamento', 'Anexado à OM ' + X(o.num) + ' no Sankhya · fotos originais no Google Drive do SMF']])}
    <h4>Referências normativas</h4><ul><li>NP Navecunha 055 · Plano de Gestão de Manutenção: 5.5 (manutenção corretiva), 5.5.1 (criticidade e prazos), 5.8 (registro e evidências), 6.3 (equipamentos críticos), 9 (indicadores)</li><li>ISO 14224:2016 · Coleta e intercâmbio de dados de confiabilidade e manutenção (taxonomia, modo e causa de falha)</li><li>ABNT NBR 5462 · Confiabilidade e mantenabilidade (terminologia)</li><li>ISO 9001:2015 · 7.5 Informação documentada</li></ul>
    <h4>Glossário</h4><table class="g"><tbody>${[['Modo de falha', 'Forma observável pela qual a falha se manifesta (ex.: vazamento, superaquecimento).'], ['Causa da falha', 'Circunstância de projeto, fabricação, montagem, operação ou manutenção que levou à falha.'], ['TTR', 'Tempo para reparo: do início da indisponibilidade à liberação para operação.'], ['MTTR', 'Tempo médio para reparo: média dos TTR no período.'], ['Liberação para operação', 'Momento em que o ativo volta a operar após o teste funcional.'], ['Criticidade', 'Classificação da falha pelo risco (Crítica, Alta, Média, Baixa) que define o prazo de atendimento.']].map(([a, b]) => `<tr><td style="width:26%"><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table>
    <h4>Distribuição</h4><p class="nt">OM do Sankhya (anexo) · Supervisor de Manutenção · Coordenação de Operações · Comandante do empurrador</p><div class="ft2"><span>Relatório Técnico de Manutenção Corretiva · documento controlado pelo SGI</span><span>Folha <span class="fn"></span></span></div></div>`;
  const css = `@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;background:#E8EAED;font:11px Arial,sans-serif;color:#202124}
   .pg{width:210mm;height:297mm;padding:14mm 14mm 16mm;background:#fff;margin:0 auto 8px;position:relative;overflow:hidden;page-break-after:always;break-after:page}@media print{body{background:#fff}.pg{margin:0}}
   .hd2{border-bottom:2px solid #16244A;color:#16244A;font-weight:700;font-size:10px;padding-bottom:4px;margin-bottom:10px;display:flex;justify-content:space-between}
   .ft2{position:absolute;left:14mm;right:14mm;bottom:8mm;border-top:1px solid #CBD5E1;padding-top:3px;font-size:9px;color:#5F6368;display:flex;justify-content:space-between}
   h2{font-size:13.5px;color:#16244A;margin:12px 0 6px;display:flex;align-items:center;gap:8px}h2 .nu{background:#16244A;color:#fff;border-radius:3px;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;padding:0 5px}
   h4{font-size:11px;color:#16244A;margin:8px 0 3px}table{width:100%;border-collapse:collapse;margin-bottom:6px}td,th{border:1px solid #CBD5E1;padding:4px 6px;text-align:left;vertical-align:top}
   .k td:first-child{width:36%;background:#F4F6F9;font-weight:600}.g th,.as th{background:#16244A;color:#fff;font-size:10px}.as td{height:52px;vertical-align:bottom;color:#80868B;font-size:9.5px}
   .bx{border:1px solid #CBD5E1;padding:6px 8px;line-height:1.45}.nt{font-size:10px;color:#5F6368;margin:4px 0}ul{margin:2px 0 6px 16px;padding:0;line-height:1.5}
   .ft{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ft figure{margin:0;border:1px solid #CBD5E1;padding:4px;break-inside:avoid}.ft img{width:100%;height:62mm;object-fit:contain;background:#F4F6F9;display:block}.ft .sem{height:62mm;display:flex;align-items:center;justify-content:center;background:#F4F6F9;color:#80868B;font-size:10px;text-align:center}.ft figcaption{font-size:9.5px;margin-top:3px}
   .capa{display:flex;flex-direction:column;padding:22mm 20mm}.capa .cl{display:flex;justify-content:space-between;align-items:center}.capa .cl img{height:20mm}.capa .ct{margin-top:40mm}.capa .k1{letter-spacing:.12em;color:#5F6368;font-size:11px;margin:0}
   .capa h1{font-size:30px;color:#16244A;margin:8px 0 6px;line-height:1.15;border-left:6px solid #16244A;padding-left:12px}.capa .k2{font-size:15px;margin:0 0 26px 18px;color:#202124}.ck td{font-size:11.5px;padding:6px 8px}.capa .rd{margin-top:auto;border-top:2px solid #16244A;padding-top:6px;color:#16244A;font-weight:700;font-size:11px}
   #contra .pg{page-break-after:auto;break-after:auto}.ix td{border:none;border-bottom:1px dotted #9AA0A6;padding:6px 2px;font-size:12px}.ix td:last-child{text-align:right;width:60px}`;
  const js = `(function(){var src=document.getElementById('src'),out=document.getElementById('out'),secs=[].slice.call(src.children),pags=[],cur=null,body=null,mapa=[];
    function nova(){cur=document.createElement('div');cur.className='pg';cur.innerHTML='<div class="hd2"><span>${esc(rel)} · ${esc(nm)} · OM ${esc(o.num || '')}</span><span>Anexo II-A · NP Navecunha 055</span></div><div class="bd"></div><div class="ft2"><span>Relatório Técnico de Manutenção Corretiva · documento controlado pelo SGI</span><span>Folha <span class="fn"></span></span></div>';out.insertBefore(cur,document.getElementById('contra'));body=cur.querySelector('.bd');body.style.height=(297-14-16-14)+'mm';body.style.overflow='hidden';pags.push(cur);}
    nova();secs.forEach(function(s){if(s.dataset.nova&&body.children.length)nova();body.appendChild(s);if(body.scrollHeight>body.clientHeight+1&&body.children.length>1){body.removeChild(s);nova();body.appendChild(s);}var t=s.dataset.t,n=t.split(' ')[0];if(!mapa.some(function(m){return m[0]===n}))mapa.push([n,t.replace(/ · \\d+\\/\\d+$/,''),pags.length+2]);});
    src.parentNode.removeChild(src);var todas=document.querySelectorAll('.pg'),tot=todas.length;[].forEach.call(todas,function(p,i){var f=p.querySelector('.fn');if(f)f.textContent=(i+1)+' de '+tot;});
    document.getElementById('ix').innerHTML=mapa.map(function(m){return '<tr><td>'+m[1]+'</td><td>'+m[2]+'</td></tr>'}).join('')+'<tr><td>Contracapa · controle do documento, referências normativas e glossário</td><td>'+tot+'</td></tr>';
    setTimeout(function(){window.print()},700);})();`;
  const indice = `<div class="pg"><div class="hd2"><span>${esc(rel)} · ${esc(nm)} · OM ${esc(o.num || '')}</span><span>Anexo II-A · NP Navecunha 055</span></div><h2><span class="nu">·</span>Índice</h2><table class="ix"><tbody id="ix"></tbody></table>
    <h4 style="margin-top:18px">Resumo</h4>${T([['Falha', NI(o.descricao)], ['Modo de falha', NI(o.modo)], ['Causa', NI(o.causaCat)], ['Intervenção', NI(o.servicos)], ['TTR', ttr != null ? fH(ttr) : 'em curso']])}<div class="ft2"><span>Relatório Técnico de Manutenção Corretiva · documento controlado pelo SGI</span><span>Folha <span class="fn"></span></span></div></div>`;
  w.document.open(); w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(tituloArq('Anexo II-A ' + rel + ' ' + nm))}</title><style>${css}</style></head><body>${capa}${indice}<div id="out"><div id="contra">${contra}</div></div><div id="src" style="position:absolute;left:-9999px;width:182mm">${S1 + S2 + S3 + S4 + S5 + S6 + S7 + fotosHTML + S9 + S10}</div><script>window.onload=function(){${js}}<\/script></body></html>`); w.document.close();
}
// OMs preventivas registradas de um empurrador (para reimprimir o II-B)
const enxOMsDe = vid => { const G = {}; recs('base').forEach(r => { if (r.vessel === vid && r.om && !r.excluido && A1M[r.item]) { const g = G[r.om] = G[r.om] || { om: r.om, date: r.date, n: 0 }; g.n++; if (r.date > g.date) g.date = r.date; } }); return Object.values(G).sort((a, b) => a.date < b.date ? 1 : -1); };
// ---------- Biblioteca do enxuto: formulários padrão, NP, Anexo I e Matriz técnica (Supervisor, 27/10/2026) ----------
// Formulários em branco para imprimir; os preenchidos saem das próprias telas (Executar, Corretivas, Óleo).
const ENXB_DOCS = [
  ['form', 'Anexo II-B · Relatório de serviço realizado · preventiva', 'Em branco, uma folha. Com os serviços já listados para levar a bordo: 2.2 OM preventiva → Formulário de campo', 'iib'],
  ['form', 'Anexo II-A · Relatório de serviço realizado · corretiva', 'Em branco, uma folha. Preenchido, sai em 4 · Corretivas', 'iia'],
  ['form', 'FR 049_B Rev.03 · Troca de óleo, filtros e fluidos', 'Preencher pelo SMF (Óleo) ou imprimir em branco', 'forms/FR_049_B.html'],
  ['form', 'FR 027_L Rev.05 · Check-list de chegada e saída', 'Operador de Medição / Líder, CTF e Coordenador de Operações', 'forms/FR_027_L.html'],
  ['form', 'FR 016_E · Controle de materiais Classe I e II', 'Entrega de resíduos ao SGI (NP 5.7)', 'forms/FR_016_E.html'],
  ['ref', 'Matriz técnica de equipamentos e lubrificação', 'Modelos, óleos, volumes e intervalos da frota', '../docs/Matriz_tecnica.atual17.10.26.html'],
  ['ref', 'Anexo I · Matriz de manutenção preventiva', 'Serviços, frequências e métodos (o plano que gera o cronograma)', '../docs/Anexo_I_NP_055_visual_matriz.html'],
  ['ref', 'NP Navecunha 055 · Plano de Gestão de Manutenção', 'Procedimento vigente (revisão em aprovação)', '../docs/NP_Navecunha_055_corrigida.html'],
];
function enxIIBBranco() {
  const L = n => Array.from({ length: n }, () => '<tr><td style="height:22px"></td><td></td><td style="width:8%"></td><td style="width:8%"></td><td style="width:8%"></td></tr>').join('');
  enxDoc('ANEXO II-B · RELATÓRIO DE SERVIÇO REALIZADO · PREVENTIVA', 'Formulário em branco',
    enxK([['Empurrador', ''], ['OM (Sankhya)', ''], ['Data', ''], ['Horímetro', 'MCP BB: ______ h · MCP BE: ______ h · MCA 1: ______ h · MCA 2: ______ h'], ['Execução', 'Equipe própria ☐ · Terceiro ☐ · empresa: ____________________'], ['Executado por', '']])
    + `<h3>Serviços</h3><table><thead><tr><th style="width:30%">Equipamento</th><th>Serviço</th><th>Feito</th><th>Insp. OK</th><th>Não feito</th></tr></thead><tbody>${L(14)}</tbody></table>`
    + '<h3>Motivo dos não feitos, o que foi visto nos “Insp. OK” e próxima avaliação</h3><table><tr><td style="height:54px"></td></tr></table>' + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'));
}
// formulário de campo (Supervisor, 28/10/2026: “não era pra sair um formulário pra eu preencher em campo? e o que o Comandante assina?”):
// os serviços marcados na 2.2, agrupados por equipamento, com Feito / Não feito / Observação, horímetros e compressão em branco; vai a bordo, o Comandante assina, depois é transcrito em “Apontar execução”
function enxIIBCampo() {
  const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços primeiro.');
  const G = new Map(); S0.forEach(y => { const k = `${enxEq(y.t)} · ${posCurtoE(v, y.pos)}`; if (!G.has(k)) G.set(k, []); G.get(k).push(y); });
  const hp = [...new Set(S0.filter(y => intervalo(y.t, v, y.pos).h).map(y => posHor(y.pos, y.t, v.id)))];
  const cmp = [...new Set(S0.filter(y => y.t.id === '1.1.12' && isMcp(y.pos)).map(y => y.pos))];
  const cx = '<td style="text-align:center;font-size:15px">☐</td>';
  enxDoc('ANEXO II-B · RELATÓRIO DE SERVIÇO REALIZADO · PREVENTIVA', `${esc(v.nome)} · formulário de campo · ${S0.length} serviço${S0.length === 1 ? '' : 's'}`,
    enxK([['Empurrador', esc(v.nome)], ['OM (Sankhya)', ''], ['Data de execução', '____/____/______'], ['Horímetro', hp.length ? hp.map(p => `${esc(posCurtoE(v, p))}: __________ h`).join(' · ') : '—'], ['Execução', 'Equipe própria ☐ · Terceiro ☐ · empresa: ______________________'], ['Executado por', '']])
    + (S0.some(y => enxCrit(y.t)) ? enxCritLeg : '') + `<h3>Serviços · marque uma opção em cada linha</h3><p style="font-size:10px;margin:0 0 4px;color:#5F6368"><b>Feito</b> = executou (trocou, limpou, ajustou) · <b>Insp. OK</b> = inspecionou e não precisa intervir agora (escreva o que viu e a próxima avaliação) · <b>Não feito</b> = não foi possível (escreva o motivo)</p><table><thead><tr><th>Serviço</th><th style="width:12%">A cada</th><th style="width:7%">Feito</th><th style="width:7%">Insp. OK</th><th style="width:7%">Não feito</th><th style="width:27%">Observação / motivo / próxima avaliação</th></tr></thead><tbody>`
    + [...G].map(([k, L]) => `<tr style="break-after:avoid;page-break-after:avoid"><td colspan="6" style="background:#E8EDF5;font-weight:700;color:#16244A">${esc(k)}</td></tr>` + L.map(y => `<tr${enxCrit(y.t) ? ' style="background:#FDECEA"' : ''}><td${enxCrit(y.t) ? ' style="border-left:4px solid #B3261E;font-weight:700"' : ''}>${esc(enxServ(y.t))}${enxCrit(y.t) ? '<br>' + enxCritDoc : ''}</td><td>${esc(enxIv(y.t, v, y.pos))}</td>${cx}${cx}${cx}<td></td></tr>`).join('')).join('') + '</tbody></table>'
    + (cmp.length ? `<h3>Ensaio de compressão do MCP · pressão por cilindro (MPa ou kgf/cm²)</h3><table><thead><tr><th style="width:16%">Motor</th>${[1, 2, 3, 4, 5, 6].map(i => `<th>Cil. ${i}</th>`).join('')}<th>Rotação (rpm)</th></tr></thead><tbody>${cmp.map(p => `<tr><td><b>${esc(posCurtoE(v, p))}</b></td>${'<td style="height:24px"></td>'.repeat(7)}</tr>`).join('')}</tbody></table>` : '')
    + '<h3>Materiais utilizados e observações</h3><table><tr><td style="height:54px"></td></tr></table>'
    + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção')
    + '<p style="font-size:10px;color:#5F6368;margin-top:6px">Depois de assinado: anexar este formulário na OM do Sankhya e registrar no SMF em 2.2 OM preventiva → “Apontar execução” (o mesmo nº de OM, os horímetros e as fotos de antes e depois).</p>');
}
function enxIIABranco() {
  enxDoc('ANEXO II-A · RELATÓRIO DE SERVIÇO REALIZADO · CORRETIVA', 'Formulário em branco',
    enxK([['Empurrador', ''], ['OM (Sankhya)', ''], ['Classe', 'Crítica ☐ · Alta ☐ · Média ☐ · Baixa ☐'], ['Sistema / equipamento', ''], ['Início do reparo', '____/____/______ às ____:____'], ['Liberação', '____/____/______ às ____:____'], ['Execução', 'Equipe própria ☐ · Terceiro ☐ · empresa: ____________________'], ['Executado por', '']])
    + '<h3>O que aconteceu</h3><table><tr><td style="height:80px"></td></tr></table><h3>O que foi feito</h3><table><tr><td style="height:120px"></td></tr></table><h3>Observações</h3><table><tr><td style="height:50px"></td></tr></table>'
    + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'));
}
function vEnxBib() {
  const item = (d, i) => `<tr><td><b>${esc(d[1])}</b><div class="note">${esc(d[2])}</div></td><td style="width:1%;white-space:nowrap"><button class="mbtn sm pri" data-ebib="${i}">${d[3].length < 4 ? '🖨 Imprimir' : 'Abrir'}</button></td></tr>`;
  const sec = (k, t) => `<div class="card"><h2>${t}</h2><table class="t"><tbody>${ENXB_DOCS.map((d, i) => d[0] === k ? item(d, i) : '').join('')}</tbody></table></div>`;
  const D = recs('doc').sort((a, b) => a.titulo.localeCompare(b.titulo));
  return enxCab('Biblioteca técnica', 'Formulários padrão para imprimir, a Matriz técnica, o Anexo I e a NP 055 · manuais e catálogos enviados ficam no Google Drive', `<button class="mbtn" data-ebibnovo>＋ Adicionar documento</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + sec('form', 'Formulários padrão') + sec('ref', 'Normas e matrizes')
   + `<div class="card"><h2>Manuais e documentos enviados · ${D.length}</h2>${D.length ? `<table class="t"><tbody>${D.map(r => `<tr><td><b>${esc(r.titulo)}</b><div class="note">${esc([r.desc, r.equip ? EQN[r.equip] || r.equip : '', r.rev ? 'Rev. ' + r.rev : ''].filter(Boolean).join(' · '))}</div></td><td style="width:1%;white-space:nowrap"><button class="mbtn sm pri" data-ebibdoc="${r.id}">Abrir</button></td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum ainda. Use “Adicionar documento” para manuais de fabricante, catálogos e procedimentos (arquivo até 10 MB ou link).</p>'}</div></div></div>`;
}
// ---------- 1.2 Manutenção corretiva: abre na falha (OM aberta), libera depois; MTTR e disponibilidade saem de início × liberação; Anexo II-A na liberação ----------
// Status: aberta (em reparo) → conferencia (liberada pela equipe, aguarda o Supervisor) → encerrada. Liberada pelo Supervisor vai direto a encerrada (o servidor só aceita “encerrada” do Supervisor).
const enxCorSt = o => o.status === 'encerrada' ? ['p-ok', 'Encerrada'] : o.liberacao ? ['p-warn', 'Aguardando conferência'] : ['p-bad', 'Indisponível · em reparo'];
const enxAgora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
async function enxFotosDe(id, tipo) { const L = fxArq(id), at = Date.now(), out = []; for (const f of L.slice(0, 6)) out.push({ tipo, src: await comprimir(f), at }); return out; }
function vEnxCor() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), T = oms().filter(o => o.tipo === 'C' && !o.excluido), ab = T.filter(o => o.status !== 'encerrada').sort((a, b) => (a.abertura || '') < (b.abertura || '') ? -1 : 1),
    L = T.filter(o => o.status === 'encerrada').sort((a, b) => (b.abertura || '') < (a.abertura || '') ? -1 : 1).slice(0, 30), ag = enxAgora(), adm = can.admin();
  const hP = o => o.abertura ? Math.max(0, ((o.liberacao ? new Date(o.liberacao) : new Date()) - new Date(o.abertura)) / 36e5) : null;
  const lin = o => { const st = enxCorSt(o), h = hP(o); return `<tr><td class="nowrap">${brDT(o.abertura || '')}</td><td><b>${esc(vName(o.vessel))}</b></td><td>${esc(o.num || '—')}</td><td>${esc(o.equip || o.sistema || '—')}<div class="note">${esc(o.classe || '')}</div></td><td>${esc(String(o.descricao || '').slice(0, 90))}</td><td><span class="pill ${st[0]}">${st[1]}</span></td><td class="r nowrap">${h == null ? '—' : nf(h, 1) + ' h'}</td>
    <td class="nowrap">${!o.liberacao ? `<button class="mbtn sm pri" data-eclib="${o.id}">Liberar para operação</button>` : o.status !== 'encerrada' && adm ? `<button class="mbtn sm pri" data-ecenc="${o.id}">Conferir e encerrar</button> ` : ''}${o.liberacao ? `<button class="mbtn sm" data-ec2a="${o.id}">Anexo II-A</button>` : ''}</td></tr>`; };
  const tab = (R, vz) => `<div class="tw"><table class="t"><thead><tr><th>Início</th><th>Empurrador</th><th>OM</th><th>Equipamento · criticidade</th><th>Falha (sintoma)</th><th>Situação</th><th class="r">Indisponível</th><th></th></tr></thead><tbody>${R.map(lin).join('') || `<tr><td colspan="8" class="note">${vz}</td></tr>`}</tbody></table></div>`;
  return enxCab('1.2 Manutenção corretiva', 'Abra a corretiva na falha (fica “em reparo” e conta como indisponibilidade) · na liberação, informe a intervenção e as fotos de depois · sai o Anexo II-A · MTTR = início → liberação', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>OMs corretivas em aberto · ${ab.length}</h2>${tab(ab, 'Nenhuma corretiva em aberto.')}</div>
   <div class="card"><h2>Abertura de OM corretiva</h2><div class="g">
      <label class="f s2">Empurrador<select id="ecV">${V.map(v => `<option value="${v.id}">${esc(v.nome)}</option>`).join('')}</select></label><label class="f s2">Nº da OM (Sankhya)<input id="ecO" inputmode="numeric"></label>
      <label class="f s2">Criticidade<select id="ecC">${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `<option>${c}</option>`).join('')}</select></label>
      <label class="f s3">Sistema<select id="ecS">${SISTEMAS.map(s => `<option>${esc(s)}</option>`).join('')}</select></label><label class="f s3">Modo de falha (ISO 14224)${enxSel_('ecMo', MODOS, '', 'Escolha…')}</label><label class="f s3">Método de detecção${enxSel_('ecDt', ENX_DETEC, '', 'Escolha…')}</label><label class="f s3">Consequência / impacto${enxSel_('ecIm', IMPACTOS, '', 'Escolha…')}</label><label class="f s3">Horímetro do equipamento <span class="note">(se tiver)</span><input id="ecH" inputmode="decimal"></label><label class="f s3">Equipamento / componente<input id="ecE" placeholder="ex.: bomba de água salgada do MCA"></label>
      <label class="f s3">Início da indisponibilidade (parada)<input type="datetime-local" id="ecI" max="${ag}" value="${ag}"></label><label class="f s3">Liberação <span class="note">(vazio = continua em reparo)</span><input type="datetime-local" id="ecL" max="${ag}"></label>
      <label class="f s6">Descrição da falha (sintoma observado)<textarea id="ecD" rows="2"></textarea></label><label class="f s3">Causa da falha <span class="note">(na liberação)</span>${enxSel_('ecCa', CAUSAS, '', '—')}</label><label class="f s3">Teste funcional após o reparo <span class="note">(na liberação)</span><input id="ecTf" placeholder="ex.: motor em carga 30 min, sem vazamento, temperatura normal"></label><label class="f s6">Peças, materiais e consumíveis aplicados <span class="note">(na liberação)</span><input id="ecPm"></label><label class="f s6">Intervenção executada <span class="note">(na liberação)</span><textarea id="ecF" rows="2"></textarea></label>
      ${enxExecCampos()}<label class="f s3">Executante / responsável técnico<input id="ecQ" placeholder="nomes da equipe ou responsável técnico"></label><label class="f s3">Observação<input id="ecX"></label>
      ${enxFotoCampo('fxA', 'Registro fotográfico · antes (obrigatório)')}${enxFotoCampo('fxD', 'Registro fotográfico · depois (na liberação)')}</div>
     <div class="note" id="ecErr" style="color:var(--badt)"></div><div class="row end"><button class="mbtn pri" data-ecsalvar>Abrir OM corretiva</button></div></div>
   <div class="card"><h2>OMs corretivas encerradas · últimas ${L.length}</h2>${tab(L, 'Nenhuma corretiva encerrada.')}</div></div></div>`;
}
async function enxCorSalvar() {
  if (!S.session) return loginModal(); const g = id => $('#' + id).value.trim(), E = $('#ecErr'), num = g('ecO').replace(/\D/g, ''), ini = g('ecI'), lib = g('ecL');
  if (num.length < 3) return E.textContent = 'Informe o nº da OM do Sankhya.'; if (oms().some(o => o.num === num && !o.excluido)) return E.textContent = 'A OM ' + num + ' já está registrada.';
  if (!ini) return E.textContent = 'Informe o início do reparo (data e hora).'; if (ini > enxAgora()) return E.textContent = 'O início não pode ser no futuro.';
  if (!g('ecD')) return E.textContent = 'Descreva a falha (sintoma observado).'; if (!g('ecMo')) return E.textContent = 'Informe o modo de falha.';
  if (lib) { if (lib < ini) return E.textContent = 'A liberação não pode ser antes do início.'; if (!g('ecF') || !g('ecQ')) return E.textContent = 'Para liberar: preencha a intervenção executada e o executante.'; if (!g('ecCa') || !g('ecTf')) return E.textContent = 'Para liberar: informe a causa da falha e o teste funcional após o reparo.'; }
  const ex = enxExecLer(); if (!ex) return E.textContent = 'Execução por terceiro: informe a empresa.';
  E.textContent = 'Preparando as fotos…'; const fa = await enxFotosDe('fxA', 'ANTES'), fd = await enxFotosDe('fxD', 'DEPOIS'); E.textContent = '';
  if (!fa.length) return E.textContent = 'Anexe ao menos uma foto de antes (evidência da falha).'; if (lib && !fd.length) return E.textContent = 'Para liberar: anexe ao menos uma foto de depois.';
  const o = { id: uid('om'), kind: 'om', tipo: 'C', num, vessel: $('#ecV').value, pos: 'UN', status: lib ? (can.admin() ? 'encerrada' : 'conferencia') : 'aberta', classe: $('#ecC').value, sistema: $('#ecS').value, equip: g('ecE'), descricao: g('ecD'), modo: g('ecMo'), detec: g('ecDt'), impacto: g('ecIm'), horimetro: g('ecH').replace(',', '.') || '', causaCat: g('ecCa'), teste: g('ecTf'), materiais: g('ecPm'), servicos: g('ecF'), execn: g('ecQ'), exec: ex.exec, empresa: ex.empresa, obsEnx: g('ecX'),
    abertura: ini, deteccao: ini, inicio: ini, termino: lib || null, liberacao: lib || null, interd: 'N/A', resultado: lib ? 'Conforme' : '', fotos: fa.concat(fd), enx: true, hist: [{ at: Date.now(), by: S.session.name, ev: lib ? 'Registrada e liberada' : 'Aberta (em reparo)' }] };
  if (o.status === 'encerrada') Object.assign(o, { fechadoAt: Date.now(), aprovBy: S.session.name, aprovAt: isoD(hoje()) });
  await saveRec(o); toast('Corretiva ' + num + (lib ? ' registrada e liberada.' : ' aberta: em reparo.')); if (lib) enxIIA(o); render(); }
function enxCorLiberar(id) {
  const o = S.recs.get(id); if (!o) return; if (!S.session) return loginModal(); const ag = enxAgora(), temA = (o.fotos || []).some(f => f.tipo === 'ANTES');
  modal(`<h2>Liberação para operação · OM corretiva ${esc(o.num)} · ${esc(vName(o.vessel))}</h2><p class="note">${esc(o.equip || o.sistema || '')} · início ${brDT(o.abertura)} · ${esc(o.descricao || '')}</p>
   <div class="g"><label class="f s3">Liberação para operação (data e hora)<input type="datetime-local" id="lbL" max="${ag}" value="${ag}"></label>${enxExecCampos()}<label class="f s3">Executante / responsável técnico<input id="lbQ" value="${esc(o.execn || '')}"></label>
   <label class="f s3">Modo de falha (ISO 14224)${enxSel_('lbMo', MODOS, o.modo || '', 'Escolha…')}</label><label class="f s3">Causa da falha${enxSel_('lbCa', CAUSAS, o.causaCat || '', 'Escolha…')}</label>
   <label class="f s6">Intervenção executada (descrição técnica)<textarea id="lbF" rows="3">${esc(o.servicos || '')}</textarea></label><label class="f s6">Análise técnica da causa <span class="note">(o que levou à falha)</span><textarea id="lbAn" rows="2">${esc(o.causa || '')}</textarea></label>
   <label class="f s6">Peças, materiais e consumíveis aplicados<input id="lbPm" value="${esc(o.materiais || '')}"></label><label class="f s6">Teste funcional após o reparo<input id="lbTf" value="${esc(o.teste || '')}" placeholder="ex.: motor em carga 30 min, sem vazamento, temperatura e pressão normais"></label>
   <label class="f s6">Recomendação para evitar a recorrência <span class="note">(opcional)</span><input id="lbRc" value="${esc(o.mitig || '')}"></label>${temA ? '' : enxFotoCampo('fxA', 'Registro fotográfico · antes')}${enxFotoCampo('fxD', 'Registro fotográfico · depois')}</div>
   <div class="note" id="lbE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="lbOk">Liberar para operação e emitir o Anexo II-A</button></div>`, true);
  $('#lbOk').onclick = async () => { const lib = $('#lbL').value, E = $('#lbE'), F = $('#lbF').value.trim(), Q = $('#lbQ').value.trim();
    if (!lib || lib > enxAgora()) return E.textContent = 'Informe a liberação (não pode ser no futuro).'; if (lib < o.abertura) return E.textContent = 'A liberação não pode ser antes do início (' + brDT(o.abertura) + ').';
    if (!F || !Q) return E.textContent = 'Preencha a intervenção executada e o executante.'; if (!$('#lbMo').value || !$('#lbCa').value) return E.textContent = 'Informe o modo e a causa da falha.'; if (!$('#lbTf').value.trim()) return E.textContent = 'Descreva o teste funcional após o reparo.'; const ex = enxExecLer(); if (!ex) return E.textContent = 'Execução por terceiro: informe a empresa.';
    E.textContent = 'Preparando as fotos…'; const fa = temA ? [] : await enxFotosDe('fxA', 'ANTES'), fd = await enxFotosDe('fxD', 'DEPOIS'); E.textContent = '';
    if (!temA && !fa.length) return E.textContent = 'Anexe ao menos uma foto de antes.'; if (!fd.length) return E.textContent = 'Anexe ao menos uma foto de depois.';
    const adm = can.admin(); Object.assign(o, { modo: $('#lbMo').value, causaCat: $('#lbCa').value, causa: $('#lbAn').value.trim(), materiais: $('#lbPm').value.trim(), teste: $('#lbTf').value.trim(), mitig: $('#lbRc').value.trim(), liberacao: lib, termino: lib, servicos: F, execn: Q, exec: ex.exec, empresa: ex.empresa, resultado: 'Conforme', status: adm ? 'encerrada' : 'conferencia', fotos: (o.fotos || []).concat(fa, fd), hist: (o.hist || []).concat([{ at: Date.now(), by: S.session.name, ev: 'Liberada' }]) });
    if (adm) Object.assign(o, { fechadoAt: Date.now(), aprovBy: S.session.name, aprovAt: isoD(hoje()) });
    await saveRec(o); closeModal(); toast('OM ' + o.num + (adm ? ' liberada e encerrada.' : ' liberada: aguarda conferência do Supervisor.')); enxIIA(o); render(); };
}
async function enxCorEncerrar(id) {
  const o = S.recs.get(id); if (!o || !can.admin()) return toast('Só o Supervisor confere e encerra.');
  Object.assign(o, { status: 'encerrada', fechadoAt: Date.now(), aprovBy: S.session.name, aprovAt: isoD(hoje()), hist: (o.hist || []).concat([{ at: Date.now(), by: S.session.name, ev: 'Conferida e encerrada' }]) });
  await saveRec(o); toast('OM ' + o.num + ' encerrada.'); render(); }
const ENXC = { ano: hoje().getFullYear(), v: '', papel: 'A4' };
function enxCrGrade(ano, imp) {
  const V = S.cfg.frota.filter(v => !foraOp(v)), hm = hoje().getFullYear() === ano ? hoje().getMonth() : ano < hoje().getFullYear() ? 12 : -1, sel = [...Array(12).keys()];
  const T = Array.from({ length: 12 }, () => ({ p: 0, r: 0, ok: 0, lt: 0, ms: 0 })); let aOk = 0, aDen = 0;
  const rows = V.map(v => { const r = prResumo(v, ano, hm, sel), B = cronoBase(ano, v.id), dc = typeof docaVessel === 'function' ? docaVessel(v) : null, dm = dc && dc.due && dc.due.getFullYear() === ano ? dc.due.getMonth() : -1;
    aOk += r.ok; aDen += r.den;
    const cel = i => { const p = r.P[i], rr = Math.min(p, r.R[i]) || r.R[i], ok = r.Ok[i], lt = r.Lt[i], ms = r.Ms[i]; T[i].p += p; T[i].r += r.R[i]; T[i].ok += ok; T[i].lt += lt; T[i].ms += ms;
      const cls = i > hm ? 'fut' : i === hm ? (ms ? 'ms' : 'hj') : ms ? 'ms' : lt ? 'lt' : p || r.R[i] ? 'ok' : 'nd';
      const tx = i > hm ? (p ? p : '') : (p || r.R[i] ? `${r.R[i]}<small>/${p}</small>` : ''), tip = `${MESES[i]}: ${p} previsto${p === 1 ? '' : 's'} · ${ok} no prazo · ${lt} com atraso · ${ms} não executado${ms === 1 ? '' : 's'}${i === dm ? ' · docagem' : ''}`;
      return `<td class="ecr-c ${cls}" title="${tip}">${tx}${i === dm ? '<span class="ecr-dk" title="Docagem">⚓</span>' : ''}</td>`; };
    const nome = imp ? `<b>${esc(v.nome)}</b>` : `<a href="#enxcr" data-ecrv="${v.id}"><b>${esc(v.nome)}</b></a>`;
    return `<tr><td class="ecr-n">${nome}</td>${sel.map(cel).join('')}<td class="ecr-t">${r.tP}</td><td class="ecr-t"><b style="color:${r.ad == null ? '#5F6368' : r.ad >= 90 ? '#188038' : r.ad >= 75 ? '#B06000' : '#C5221F'}">${r.ad == null ? '—' : r.ad + '%'}</b></td></tr>`; }).join('');
  const ad = aDen ? Math.round(aOk / aDen * 100) : null;
  const foot = `<tr class="ecr-f"><td class="ecr-n"><b>Frota</b></td>${T.map((t, i) => `<td class="ecr-c">${i > hm ? t.p : `${t.r}<small>/${t.p}</small>`}</td>`).join('')}<td class="ecr-t">${T.reduce((a, t) => a + t.p, 0)}</td><td class="ecr-t"><b>${ad == null ? '—' : ad + '%'}</b></td></tr>
    <tr class="ecr-f"><td class="ecr-n">Aderência no mês</td>${T.map((t, i) => { const d = t.ok + t.lt + t.ms; return `<td class="ecr-c">${i <= hm && d ? Math.round(t.ok / d * 100) + '%' : ''}</td>`; }).join('')}<td></td><td></td></tr>`;
  return { html: `<table class="ecr"><thead><tr><th class="ecr-n">Empurrador</th>${MESES.map((m, i) => `<th${i === hm ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>Total</th><th>Aderência</th></tr></thead><tbody>${rows}</tbody><tfoot>${foot}</tfoot></table>`, ad, n: V.length, aprov: V.filter(v => cronoBase(ano, v.id)).length, aprovTxt: enxCrAprovTxt(V, ano) };
}
// aprovação do cronograma da frota numa linha só (Supervisor, 27/10/2026: tira a data de cada empurrador e põe embaixo do título)
function enxCrAprovTxt(V, ano) { const B = V.map(v => cronoBase(ano, v.id)).filter(Boolean); if (!B.length) return 'Cronograma ainda não aprovado';
  const u = B.slice().sort((a, b) => String(a.aprovAt) < String(b.aprovAt) ? 1 : -1)[0], rev = Math.max(...B.map(b => +b.rev || 0));
  return (B.length === V.length ? 'Aprovado' : `Aprovado para ${B.length} de ${V.length} empurradores ·`) + ` por ${u.aprovBy || '—'} em ${brD(u.aprovAt)} · rev. ${rev}`; }
const ENX_LEG = '<div class="ecr-lg"><span><i class="ok"></i>executado no prazo</span><span><i class="lt"></i>executado com atraso</span><span><i class="ms"></i>vencido sem execução</span><span><i class="hj"></i>mês atual</span><span><i class="fut"></i>previsto</span><span>⚓ docagem</span><span>número = executado/previsto no mês</span></div>';
function vEnxCr() {
  const ano = ENXC.ano, v = vessel(ENXC.v), anos = [ano - 1, ano, ano + 1], seg = `<div class="seg">${anos.map(a => `<button data-ecrano="${a}" class="${a === ano ? 'on' : ''}">${a}</button>`).join('')}</div>`;
  const imp = `<select id="ecrPapel" style="width:auto">${['A4', 'A3'].map(p => `<option${p === ENXC.papel ? ' selected' : ''}>${p}</option>`).join('')}</select><button class="mbtn pri" data-ecrimp>🖨 Imprimir</button>`;
  if (!v) { const G = enxCrGrade(ano);
    return enxCab('2.1 Plano anual de manutenção preventiva', `Frota de empurradores · ${ano} · plano do Anexo I (NP Navecunha 055 item 7.3) · clique no empurrador para ver serviço por serviço`, seg + imp + '<button class="mbtn" data-enxreset>Reorganizar</button>')
     + `<div class="card"><h2>Resumo ${ano}</h2><div class="f2-ks">${[['Aderência no ano', G.ad == null ? '—' : G.ad + '%', G.ad == null ? '' : G.ad >= 90 ? 'var(--okt)' : 'var(--badt)'], ['Cronogramas aprovados', G.aprov + ' de ' + G.n, G.aprov < G.n ? 'var(--warnt)' : 'var(--okt)']].map(([l, n, c]) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${n}</b></div>`).join('')}</div>${can.admin() && G.aprov < G.n ? `<p class="note">Aprovar congela o previsto do ano (linha de base): a aderência passa a medir contra o plano aprovado. <button class="mbtn sm" data-ecraprov="todos">Aprovar o cronograma ${ano} da frota</button></p>` : ''}</div>
     <div class="card"><h2>Cronograma da Frota de Empurradores ${ano}</h2><p class="note" style="margin:-4px 0 8px">${esc(G.aprovTxt)}</p>${ENX_LEG}<div class="tw">${G.html}</div></div></div></div>`; }
  const B = cronoBase(ano, v.id);
  return enxCab(`Cronograma anual · ${esc(v.nome)}`, `${ano} · serviço por serviço: ● previsto · ✓ feito no prazo · ✓ âmbar com atraso · ✗ venceu sem fazer · passe o mouse para ver data e OM`, `<button class="mbtn" data-ecrv="">← Frota</button>` + seg + imp + '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Situação do cronograma</h2><p>${B ? `Previsto <b>aprovado</b> por ${esc(B.aprovBy)} em ${brD(B.aprovAt)} · rev. ${B.rev}` : '<b style="color:#B06000">Previsto ainda não aprovado</b> · a aderência mede contra o plano calculado, que muda conforme os serviços são feitos'}
     ${can.admin() ? ` <button class="mbtn sm${B ? '' : ' pri'}" data-ecraprov="${v.id}">${B ? 'Aprovar de novo (nova revisão)' : 'Aprovar o cronograma ' + ano}</button>` : ''} <a class="mbtn sm" href="#enx" data-enxir="${v.id}">Executar: o que vence agora →</a></p></div>
   <div class="card"><h2>Serviços · ${ano}</h2><div class="tw">${prTabela(v, ano)}</div></div></div></div>`;
}
function enxCrImprimir() {
  const ano = ENXC.ano, v = vessel(ENXC.v); if (v) return prPDF([v], ano, false);
  const G = enxCrGrade(ano, true), css = [...document.querySelectorAll('style')].map(x => x.textContent).filter(x => x.includes('.ecr{')).join('\n'), w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cronograma da frota de empurradores ${ano}</title><style>${css}${DOC_CAB_CSS}@page{size:${ENXC.papel} landscape;margin:8mm}body{margin:0;font-family:Arial,sans-serif;color:#202124}.ecr{font-size:${ENXC.papel === 'A3' ? 12 : 10}px}
   .ass{display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:26px}.ass div{border-top:1px solid #000;padding-top:3px;text-align:center;font-size:10px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
   ${docCab(`CRONOGRAMA DA FROTA DE EMPURRADORES ${ano}`, `${esc(G.aprovTxt)} · aderência no ano ${G.ad == null ? '—' : G.ad + '%'} · emitido em ${hoje().toLocaleDateString('pt-BR')}`, 'NP Navecunha 055 · item 7.3 · plano: Anexo I')}
   ${ENX_LEG}${G.html}<div class="ass"><div>Elaborado por · Supervisor de Manutenção</div><div>Aprovado por · Gerência</div><div>Data</div></div><script>setTimeout(function(){window.print()},600)<\/script></body></html>`); w.document.close();
}
async function enxCrAprovar(id) {
  if (!can.admin()) return toast('Só o Supervisor aprova o cronograma.'); const ano = ENXC.ano, vs = id === 'todos' ? S.cfg.frota.filter(v => !foraOp(v)) : [vessel(id)];
  confirmar(`Aprovar o cronograma ${ano} de ${id === 'todos' ? 'toda a frota' : vs[0].nome}? O previsto fica congelado como linha de base (nova revisão se já houver).`, async () => { await prAprovar(vs, ano); toast('Cronograma aprovado.'); render(); });
}
{ const st = document.createElement('style'); st.textContent = `.ecr{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}.ecr th{background:#1F2A44;color:#fff;font-weight:600;padding:6px 4px;font-size:11px;letter-spacing:.04em;text-align:center}.ecr th.hj{background:#1967D2}.ecr th.ecr-n{text-align:left;padding-left:10px}
.ecr td{border:1px solid #E3E8EF;padding:5px 3px;text-align:center;position:relative}.ecr td.ecr-n{text-align:left;padding:5px 10px;white-space:nowrap}.ecr td.ecr-n small{display:block;font-size:10.5px;color:#5F6368}.ecr td.ecr-n a{color:inherit;text-decoration:none}.ecr td.ecr-n a:hover{color:#1967D2;text-decoration:underline}
.ecr-c small{color:inherit;opacity:.7;font-size:.85em}.ecr-c.ok{background:#E6F4EA;color:#137333;font-weight:600}.ecr-c.lt{background:#FEF3E0;color:#B06000;font-weight:600}.ecr-c.ms{background:#FCE8E6;color:#C5221F;font-weight:700}.ecr-c.hj{background:#E8F0FE;color:#174EA6;font-weight:700;box-shadow:inset 0 0 0 2px #1967D2}.ecr-c.fut{background:#F5F8FE;color:#5F6368}.ecr-c.nd{background:#fff}
.ecr-t{font-weight:600;background:#F8F9FA}.ecr-f td{background:#F1F3F4;font-weight:600}.ecr-dk{position:absolute;top:1px;right:2px;font-size:10px}
.ecr-lg{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:#3C4043;margin:0 0 8px}.ecr-lg i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:4px;border:1px solid #DADCE0}.ecr-lg i.ok{background:#E6F4EA}.ecr-lg i.lt{background:#FEF3E0}.ecr-lg i.ms{background:#FCE8E6}.ecr-lg i.hj{background:#E8F0FE;border-color:#1967D2}.ecr-lg i.fut{background:#F5F8FE}`; document.head.appendChild(st); }
// ---------- telas e cliques ----------
const enxAfter = k => () => { const m = $('#main');
  m.onclick = async e => { const t = e.target.closest('[data-ecrv],[data-ecrano],[data-ecrimp],[data-ecraprov],[data-enxir],[data-enxv],[data-enxcopiar],[data-enxcampo],[data-enxfeito],[data-enxnf],[data-enxinsp],[data-enxtodos],[data-enxabre],[data-ehv],[data-ehno],[data-ehsalvar],[data-erimp],[data-enx2b],[data-ecsalvar],[data-ec2a],[data-eclib],[data-ecenc],[data-ebib],[data-ebibdoc],[data-ebibnovo]'); if (!t) return; const d = t.dataset;
    if (d.ebib !== undefined) { const x = ENXB_DOCS[+d.ebib][3]; return x === 'iib' ? enxIIBBranco() : x === 'iia' ? enxIIABranco() : window.open(x, '_blank', 'noopener'); }
    if (d.ebibdoc !== undefined) return abrirDoc(S.recs.get(d.ebibdoc));
    if (d.ebibnovo !== undefined) return docModal(null, 'manual');
    if (d.ecrv !== undefined) { e.preventDefault(); ENXC.v = d.ecrv; return render(); }
    if (d.ecrano !== undefined) { ENXC.ano = +d.ecrano; return render(); }
    if (d.ecrimp !== undefined) return enxCrImprimir();
    if (d.ecraprov !== undefined) return enxCrAprovar(d.ecraprov);
    if (d.enxir !== undefined) { e.preventDefault(); ENX.v = d.enxir; ENX.abertos = new Set(); location.hash = '#enx'; return; }
    if (d.enxv !== undefined) { ENX.v = d.enxv; ENX.abertos = new Set(); return render(); }
    if (d.ehno !== undefined) { const [vid, p] = d.ehno.split('|'), h = horAtual(vid, p), i = $$('#main .ehH').find(x => x.dataset.v === vid && x.dataset.p === p); if (h && i) { i.value = String(h.h).replace('.', ','); toast('Mesma leitura preenchida (0 h). Clique em Salvar leituras.'); } return; }
    if (d.ehv !== undefined) { ENXH.v = d.ehv; return render(); }
    if (d.enxabre !== undefined) { $$('#main details.enx-g').forEach(g => { g.open = true; ENX.abertos.add(g.dataset.enxg); }); return; }
    if (d.enx2b !== undefined) return enxIIB(ENX.v, d.enx2b);
    if (d.ecsalvar !== undefined) return enxCorSalvar();
    if (d.eclib !== undefined) return enxCorLiberar(d.eclib);
    if (d.ecenc !== undefined) return enxCorEncerrar(d.ecenc);
    if (d.ec2a !== undefined) { const o = S.recs.get(d.ec2a); if (o) enxIIA(o); return; }
    if (d.enxcopiar !== undefined) return enxCopiar();
    if (d.enxcampo !== undefined) return enxIIBCampo();
    if (d.enxfeito !== undefined) return enxFeitoModal();
    if (d.enxnf !== undefined) return enxNFModal();
    if (d.enxinsp !== undefined) return enxInspModal();
    if (d.enxtodos !== undefined) { const D = enxDados().find(x => x.v.id === ENX.v), ks = new Set([...D.venc, ...D.mes].map(y => y.pos + '|' + y.t.id)); $$('#main .enx-ck').forEach(i => { i.checked = ks.has(i.value); if (i.checked) { const g = i.closest('details'); if (g) { g.open = true; ENX.abertos.add(g.dataset.enxg); } } }); return; }
    if (d.ehsalvar !== undefined) return enxHorSalvar();
    if (d.erimp !== undefined) { const s = S.recs.get(d.erimp); if (s) enxRelImprimir(s); } };
  if (!m._enxTg) m._enxTg = m.addEventListener('toggle', e => { const g = e.target; if (g.matches && g.matches('details.enx-g')) { if (g.open) ENX.abertos.add(g.dataset.enxg); else ENX.abertos.delete(g.dataset.enxg); } }, true) || 1;   // um ouvinte só no #main
  m.onchange = e => { if (e.target.id === 'enxEmDia') { ENX.emDia = e.target.checked; render(); } if (e.target.id === 'ecrPapel') ENXC.papel = e.target.value; };
  const ws = m.querySelector('.cm-ws'); if (ws) janelasLivres(ws, 'smf_' + k + (k === 'enx' && ENX.v ? '1' : '') + (k === 'enxcr' && ENXC.v ? '1' : '') + '_lay', '[data-enxreset]'); };
Object.assign(VX, { enx: vEnx, enxcr: vEnxCr, enxhor: vEnxHor, enxcor: vEnxCor, enxbib: vEnxBib }); ['enx', 'enxcr', 'enxhor', 'enxcor', 'enxbib'].forEach(k => { AFTER[k] = enxAfter(k); });
Object.assign(NP_TAG, { enxcr: '7.3 · Anexo I', enx: '7.3 · Anexo I', enxhor: '5.5.1', enxcor: '5.5 · Anexo II-A', enxrel: '7.3 e 9', enxbib: '8' });
document.addEventListener('change', e => { const c = e.target.closest('[data-enxmc]'); if (!c) return; try { localStorage.setItem(ENX_MC, c.checked ? '1' : '0'); } catch (er) { } toast(c.checked ? 'Modo completo ligado neste aparelho.' : 'Modo enxuto.'); render(); });
{ const st = document.createElement('style'); st.textContent = `.enx-rel h3{font-size:14px;margin:14px 0 6px;color:#1F2A44}.enx-gr svg{max-height:200px}.enx-ck{width:18px;height:18px}.enx-g{border:1px solid #E3E8EF;border-radius:8px;margin:0 0 8px;background:#fff}.enx-g>summary{display:flex;align-items:center;gap:6px;padding:9px 12px;cursor:pointer;list-style:none}.enx-g>summary::-webkit-details-marker{display:none}.enx-g>summary::before{content:'▸';color:#5F6368;margin-right:4px}.enx-g[open]>summary::before{content:'▾'}.enx-g[open]>summary{border-bottom:1px solid #E3E8EF}.enx-g table{margin:0}`; document.head.appendChild(st); }
