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
const ENX_OK = ['enx', 'enxcr', 'enxhor', 'enxcor', 'enxrel', 'enxbib', 'oleo', 'compr', 'cxr', 'admin'];   // telas abertas no modo enxuto (cxr = aprovar o cronograma do ano)
function enxRota() {   // chamado pelo render: no modo enxuto, tela fora da lista volta para o Cronograma
  if (!enxuto() || ENX_OK.includes(VIEW)) return;
  VIEW = 'enx'; ARG = ''; try { history.replaceState(null, '', '#enx'); } catch (e) { }
}
function enxNav() {
  const it = (k, n, ic, cnt) => `<a href="#${k}" class="${VIEW === k ? 'on' : ''}">${ico(ic)}<span>${n}</span>${cnt ? `<span class="n">${cnt}</span>` : ''}</a>`;
  let v = 0; try { v = enxDados().reduce((a, x) => a + x.venc.length, 0); } catch (e) { }
  return '<div class="grp-t grp-trab">Manutenção</div>' + it('enxhor', '1 · Horímetros', 'hoje') + it('enxcr', '2 · Cronograma', 'crono') + it('enx', '3 · Executar', 'prev2', v) + it('enxcor', '4 · Corretivas', 'omsv2') + it('enxrel', '5 · Relatório mensal', 'relm')
    + '<div class="grp-t">Condição</div>' + it('oleo', 'Óleo', 'oleo') + it('compr', 'Compressão do MCP', 'compr')
    + '<div class="grp-t grp-apoio">Apoio</div>' + it('enxbib', 'Biblioteca', 'bib') + it('admin', 'Administração', 'adm');
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
const ENX_GR = { venc: ['p-bad', 'Vencido'], mes: ['p-warn', 'Vence no mês'], sem: ['p-mut', 'Sem histórico'], ok: ['p-ok', 'Em dia'], emb: ['p-ok', 'Em dia'], adi: ['p-ok', 'Em dia'] };
const enxCab = (tit, sub, bt) => `<div class="cm-v"><div class="vh"><div><h1>${tit}</h1><p>${sub}</p></div><span class="sp"></span>${bt || ''}</div><div class="cm-ws">`;
// ---------- 2 · Cronograma ----------
function vEnx() {
  const D = enxDados(), v = vessel(ENX.v);
  if (!v) {
    const nSem = D.reduce((a, x) => a + x.sem.length, 0), ano = hoje().getFullYear(), aprov = D.filter(x => cronoBase(ano, x.v.id)).length;
    return enxCab('Executar', 'O que venceu e o que vence no mês em cada empurrador · abra o empurrador, copie o texto da OM para o Sankhya e registre o que foi feito com o nº da OM', '<button class="mbtn" data-enxreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button>')
     + `<div class="card"><h2>Resumo</h2><div class="f2-ks">${[['Vencidos', D.reduce((a, x) => a + x.venc.length, 0), 'var(--badt)'], ['Vencem no mês', D.reduce((a, x) => a + x.mes.length, 0), 'var(--warnt)'], ['Sem histórico', nSem, nSem ? 'var(--badt)' : ''], [`Cronograma ${ano} aprovado`, aprov + ' de ' + D.length, aprov < D.length ? 'var(--warnt)' : 'var(--okt)']].map(([l, n, c]) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${n}</b></div>`).join('')}</div>
       ${nSem ? `<p class="note" style="color:var(--badt)">${nSem} serviço${nSem === 1 ? '' : 's'} sem histórico não vence${nSem === 1 ? '' : 'm'} nunca: registre o último serviço ou defina o marco zero em Administração antes de usar o cronograma de verdade.</p>` : ''}
       ${aprov < D.length ? `<p class="note">O previsto do ano só fica valendo para a aderência depois de aprovado: aprove em <a href="#enxcr">2 · Cronograma</a>.</p>` : ''}</div>
     <div class="card"><h2>Empurradores</h2><div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Onde está</th><th class="r">Vencidos</th><th class="r">Vencem no mês</th><th class="r">Sem histórico</th><th>Horímetro do MCP</th><th></th></tr></thead><tbody>
     ${D.sort((a, b) => b.venc.length - a.venc.length || b.mes.length - a.mes.length).map(x => { const s = situDe(x.v);
       return `<tr class="click" data-enxv="${x.v.id}"><td><b>${esc(x.v.nome)}</b></td><td>${!s ? '<span class="mut">não informado</span>' : s.st === 'viagem' ? 'em viagem' : 'no porto'}</td><td class="r">${x.venc.length ? `<b class="rl-ruim">${x.venc.length}</b>` : '0'}</td><td class="r">${x.mes.length ? `<b class="rl-at">${x.mes.length}</b>` : '0'}</td><td class="r">${x.sem.length || '0'}</td>
         <td>${x.hr ? nf(x.hr.h) + ' h · ' + brD(x.hr.date) + (x.dias != null && x.dias > 14 ? ` <span class="pill p-warn">há ${x.dias} dias</span>` : '') : '<span class="pill p-bad">sem leitura</span>'}</td><td><button class="mbtn sm pri" data-enxv="${x.v.id}">Abrir</button></td></tr>`; }).join('')}</tbody></table></div>
     <p class="note">Vencido e vence no mês pela data ou pelas horas no ritmo do motor (Anexo I). Horímetro com mais de 14 dias deixa os serviços por horas imprecisos: lance em <a href="#enxhor">1 · Horímetros</a>.</p></div></div></div>`;
  }
  const x = D.find(y => y.v === v), ord = { venc: 0, mes: 1, sem: 2 }, L = x.P.filter(y => ENX.emDia || ['venc', 'mes', 'sem'].includes(y.g)).sort((a, b) => (ord[a.g] ?? 3) - (ord[b.g] ?? 3) || a.t.id.localeCompare(b.t.id, 'pt-BR', { numeric: true }));
  const lin = y => { const nfr = enxNF(v.id, y.pos, y.t.id), k = y.pos + '|' + y.t.id, L0 = y.s.L;
    return `<tr><td><input type="checkbox" class="enx-ck" value="${k}"></td><td><b>${esc(enxServ(y.t))}</b>${y.t.prio === 'Crítica' ? ' <span class="note rl-ruim">Crítica</span>' : ''}</td><td class="nowrap">${enxIv(y.t, v, y.pos)}</td>
      <td class="nowrap">${L0 ? brD(L0.date) + (L0.h != null ? '<div class="note">' + nf(L0.h) + ' h</div>' : '') : '—'}</td><td><span class="pill ${ENX_GR[y.g][0]}">${ENX_GR[y.g][1]}</span><div class="note">${esc(y.s.txt || '')}</div>${nfr && (!L0 || nfr.date > L0.date) ? `<div class="note rl-ruim">não feito em ${brD(nfr.date)}: ${esc(nfr.motivo || '')}</div>` : ''}</td></tr>`; };
  return enxCab(`Executar · ${esc(v.nome)}`, 'Marque os serviços · “Copiar texto da OM” para abrir a OM no Sankhya com a lista · depois “Registrar feito” com o nº dessa OM, ou “Não feito” com o motivo',
      `<button class="mbtn" data-enxv="">← Frota</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + `<div class="card"><h2>Serviços · ${x.venc.length} vencido${x.venc.length === 1 ? '' : 's'} · ${x.mes.length} no mês</h2>
     <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="mbtn" data-enxtodos>Marcar vencidos e do mês</button><button class="mbtn" data-enxabre>Abrir todos os grupos</button><button class="mbtn" data-enxcopiar>📋 Copiar texto da OM</button><button class="mbtn pri" data-enxfeito>✓ Registrar feito</button><button class="mbtn" data-enxnf>Não feito</button><span class="sp"></span><label class="note"><input type="checkbox" id="enxEmDia"${ENX.emDia ? ' checked' : ''}> mostrar os em dia</label></div>
     ${(() => { const G = {}; L.forEach(y => { const k = enxEq(y.t) + ' · ' + posCurtoE(v, y.pos); (G[k] = G[k] || []).push(y); });
       const ks = Object.keys(G).sort((a, b) => G[b].filter(y => y.g === 'venc').length - G[a].filter(y => y.g === 'venc').length || a.localeCompare(b, 'pt-BR'));
       return ks.length ? ks.map(k => { const g = G[k], nv = g.filter(y => y.g === 'venc').length, nm = g.filter(y => y.g === 'mes').length, ns = g.filter(y => y.g === 'sem').length;
         return `<details class="enx-g"${ENX.abertos.has(k) ? ' open' : ''} data-enxg="${esc(k)}"><summary><b>${esc(k)}</b><span class="sp"></span>${nv ? `<span class="pill p-bad">${nv} vencido${nv === 1 ? '' : 's'}</span>` : ''}${nm ? `<span class="pill p-warn">${nm} no mês</span>` : ''}${ns ? `<span class="pill p-mut">${ns} sem histórico</span>` : ''}${!nv && !nm && !ns ? `<span class="pill p-ok">${g.length} em dia</span>` : ''}</summary>
           <table class="t"><thead><tr><th></th><th>Serviço</th><th>A cada</th><th>Último</th><th>Situação</th></tr></thead><tbody>${g.map(lin).join('')}</tbody></table></details>`; }).join('') : '<p class="note">Nada vencido nem vencendo no mês.</p>'; })()}
     <p class="note">Rastreabilidade: o texto copiado vai na OM do Sankhya, e o mesmo nº de OM fica em cada serviço registrado aqui; o relatório lista serviço × OM para conferência. Fotos e encerramento ficam na OM do Sankhya.</p></div>
   <div class="card"><h2>OMs preventivas registradas</h2>${(() => { const G = enxOMsDe(v.id).slice(0, 12); return G.length ? `<table class="t"><thead><tr><th>OM</th><th>Data</th><th class="r">Serviços</th><th></th></tr></thead><tbody>${G.map(g => `<tr><td><b>${esc(g.om)}</b></td><td>${brD(g.date)}</td><td class="r">${g.n}</td><td><button class="mbtn sm" data-enx2b="${esc(g.om)}">Anexo II-B</button></td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhuma ainda.</p>'; })()}</div></div></div>`;
}
const enxSel = () => $$('#main .enx-ck:checked').map(i => { const [pos, item] = i.value.split('|'); return { pos, t: A1M[item] }; }).filter(y => y.t);
function enxCopiar() {
  const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços primeiro.');
  const txt = `PREVENTIVA · ${v.nome} · ${brD(isoD(hoje()))}\nServiços (Anexo I · NP Navecunha 055):\n` + S0.map(y => `- ${enxEq(y.t)} · ${posCurtoE(v, y.pos)}: ${enxServ(y.t)} (a cada ${enxIv(y.t, v, y.pos)})`).join('\n') + '\nRegistrar a execução no SMF com o nº desta OM.';
  try { navigator.clipboard.writeText(txt).catch(() => { }); } catch (e) { }
  modal(`<h2>Texto da OM · ${esc(v.nome)}</h2><p class="note">Já copiado. Cole na descrição da OM no Sankhya. Se não colou, selecione e copie daqui.</p><textarea rows="${Math.min(18, S0.length + 4)}" style="width:100%" readonly>${esc(txt)}</textarea><div class="row end"><button class="mbtn pri" data-close>Fechar</button></div>`, true);
}
// fotos de evidência (Supervisor, 27/10/2026: “as evidências falam mais que palavras”): antes e depois, obrigatórias; sobem ao Drive (fotosEnviar) e vão para o relatório mensal
// execução por equipe própria ou por terceiro (Supervisor, 27/10/2026: “o gerente precisa saber o que foi feito por terceiros e o que foi feito com equipe própria”)
const enxExecCampos = () => `<label class="f s3">Execução<select id="fxT"><option value="Equipe própria">Equipe própria</option><option value="Terceiro">Terceiro (prestador)</option></select></label><label class="f s3">Empresa (se terceiro)<input id="fxE" list="fxEL" placeholder="nome do prestador"><datalist id="fxEL">${recs('terc').map(t => `<option value="${esc(t.empresa)}">`).join('')}</datalist></label>`;
function enxExecLer() { const exec = ($('#fxT') || {}).value || 'Equipe própria', empresa = exec === 'Terceiro' ? (($('#fxE') || {}).value || '').trim() : ''; return exec === 'Terceiro' && !empresa ? null : { exec, empresa }; }
const enxExecTxt = r => r && r.exec ? r.exec + (r.empresa ? ' · ' + r.empresa : '') : 'não informado';
const enxFotosCampos = () => `<div class="g"><label class="f s3">Fotos de antes<input type="file" id="fxA" accept="image/*" multiple></label><label class="f s3">Fotos de depois<input type="file" id="fxD" accept="image/*" multiple></label></div>`;
async function enxFotosLer() {
  const A = [...($('#fxA') || {}).files || []], D = [...($('#fxD') || {}).files || []]; if (!A.length || !D.length) return null;
  const out = [], at = Date.now(); for (const [tipo, L] of [['ANTES', A], ['DEPOIS', D]]) for (const f of L.slice(0, 6)) out.push({ tipo, src: await comprimir(f), at }); return out;
}
function enxFeitoModal() {
  if (!S.session) return loginModal(); const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços feitos.');
  const hp = [...new Set(S0.filter(y => intervalo(y.t, v, y.pos).h).map(y => posHor(y.pos, y.t, v.id)))];
  modal(`<h2>Registrar feito · ${esc(v.nome)} · ${S0.length} serviço${S0.length === 1 ? '' : 's'}</h2><p class="note">${S0.map(y => esc(enxServ(y.t)) + ' (' + esc(posCurtoE(v, y.pos)) + ')').join(' · ')}</p>
   <div class="g"><label class="f s3">Data da execução<input type="date" id="exD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s3">Nº da OM no Sankhya<input id="exO" inputmode="numeric"></label>${enxExecCampos()}<label class="f s6">Quem executou (nomes ou responsável técnico)<input id="exQ" placeholder="nomes da equipe ou responsável técnico do prestador"></label>
   ${hp.map(p => { const h = horAtual(v.id, p); return `<label class="f s3">Horímetro · ${esc(posCurtoE(v, p))}<input class="exH" data-pos="${p}" inputmode="decimal" value="${h ? h.h : ''}"></label>`; }).join('')}</div>
   ${enxFotosCampos()}<div class="note" id="exE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="exOk">Registrar</button></div>`, true);
  $('#exOk').onclick = async () => { const d = $('#exD').value, om = $('#exO').value.replace(/\D/g, ''), quem = $('#exQ').value.trim(), H = {}, E = $('#exE');
    if (!d || d > isoD(hoje())) return E.textContent = 'Data inválida (não pode ser futura).'; if (om.length < 3) return E.textContent = 'Informe o nº da OM do Sankhya (rastreabilidade).'; if (!quem) return E.textContent = 'Informe quem executou.';
    for (const i of $$('#modal .exH')) { const h = +i.value.replace(',', '.'), a = horAtual(v.id, i.dataset.pos); if (!(h > 0)) return E.textContent = 'Informe o horímetro de ' + posCurtoE(v, i.dataset.pos) + '.'; if (a && !a.est && a.date <= d && h < a.h) return E.textContent = 'Horímetro de ' + posCurtoE(v, i.dataset.pos) + ' menor que a última leitura (' + nf(a.h) + ' h).'; H[i.dataset.pos] = h; }
    for (const y of S0) { const L0 = y.s ? y.s.L : ultimoServico(v.id, y.pos, y.t.id); if (L0 && L0.date > d) return E.textContent = enxServ(y.t) + ': já há registro mais novo (' + brD(L0.date) + ').'; }
    const ex = enxExecLer(); if (!ex) return E.textContent = 'Execução por terceiro: informe a empresa.';
    E.textContent = 'Preparando as fotos…'; const fotos = await enxFotosLer(); if (!fotos) return E.textContent = 'Anexe ao menos uma foto de antes e uma de depois (evidência da execução).';
    const by = S.session.name, at = Date.now();
    for (const [k, y] of S0.entries()) { const hp1 = posHor(y.pos, y.t, v.id); await saveRec(Object.assign({ id: uid('base'), kind: 'base', vessel: v.id, pos: y.pos, item: y.t.id, h: H[hp1] ?? null, date: d, om, quem, exec: ex.exec, empresa: ex.empresa, by, enx: true, createdAt: at }, k ? {} : { fotos })); }   // as fotos ficam no primeiro serviço da OM
    for (const [p, h] of Object.entries(H)) await lubHor(v.id, p, h, d, 'OM ' + om);
    closeModal(); toast(S0.length + ' serviço' + (S0.length === 1 ? '' : 's') + ' registrado' + (S0.length === 1 ? '' : 's') + ' com a OM ' + om + '.'); render(); enxIIB(v.id, om); };
}
function enxNFModal() {
  if (!S.session) return loginModal(); const v = vessel(ENX.v), S0 = enxSel(); if (!S0.length) return toast('Marque os serviços não feitos.');
  modal(`<h2>Não feito · ${esc(v.nome)}</h2><p class="note">Fica registrado com o motivo (evidência para a auditoria). O serviço continua vencido até ser feito.</p>
   <div class="g"><label class="f s3">Data<input type="date" id="nfD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><label class="f s3">Nº da OM (se houver)<input id="nfO" inputmode="numeric"></label></div>
   <label class="f">Motivo<select id="nfM"><option value="">Escolha…</option><option>Falta de material</option><option>Empurrador saiu antes do fim da janela</option><option>Sem equipe disponível</option><option>Aguardando terceiro</option><option>Outro</option></select></label><label class="f">Detalhe<input id="nfX"></label>
   <div class="note" id="nfE" style="color:var(--badt)"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="nfOk">Registrar</button></div>`, true);
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
    return `<tr>${i ? '<td></td>' : `<td><b>${esc(v.nome)}</b></td>`}<td>${esc(posCurtoE(v, p))}</td><td class="r">${h ? nf(h.h) + ' h' + (h.est ? ' <span class="note">estimado</span>' : '') : '—'}</td><td>${h ? brD(h.date) : '—'}${d != null && d > 14 ? ` <span class="pill p-warn">há ${d} dias</span>` : ''}</td><td><input class="ehH" data-v="${v.id}" data-p="${p}" inputmode="decimal" placeholder="nova leitura" style="width:120px"> ${h && !h.est ? `<button class="mbtn sm" data-ehno="${v.id}|${p}" title="Motor parado: repete a última leitura (0 h no período)">Não operou</button>` : ''}</td></tr>`; }).join('');
  return enxCab('Horímetros', 'Escolha o empurrador que chegou e lance as leituras dos motores · os serviços por horas vencem por estas leituras · em âmbar, os que estão há mais de 14 dias sem leitura', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Leituras</h2><div class="row" style="gap:8px;margin-bottom:8px"><label class="f">Data da leitura<input type="date" id="ehD" value="${isoD(hoje())}" max="${isoD(hoje())}"></label><span class="sp"></span><button class="mbtn pri" data-ehsalvar>Salvar leituras</button></div>
     <div class="cm-chips" style="margin-bottom:8px">${V.map(v => { const d = idade(v); return `<button class="cm-chip${v.id === ENXH.v ? ' on' : ''}" data-ehv="${v.id}">${esc(v.nome)}${d > 14 ? ` <b style="color:var(--warnt)">${d === 999 ? 'sem leitura' : d + ' d'}</b>` : ''}</button>`; }).join('')}</div>
     <div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Motor</th><th class="r">Última leitura</th><th>Data</th><th>Nova leitura</th></tr></thead><tbody>${V.filter(v => v.id === ENXH.v).map(lin).join('')}</tbody></table></div>
     <p class="note">Motor que não rodou: “Não operou” repete a última leitura e o relatório mensal conta 0 h confirmado (sem leitura no mês também sai 0 h, mas com o aviso “sem leitura”). Leitura menor que a anterior ou com mais horas do que dias × 24 é recusada: confira o número (horímetro trocado ou que voltou a zero se ajusta no Modo completo).</p></div></div></div>`;
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
  return `<div class="enx-rel"><p><b>Referência:</b> ${esc(R.ref)} · <b>Aderência no mês:</b> ${R.ad == null ? '—' : R.ad + '%'} (feito no prazo ÷ o que venceu; referência ≥ 90%) · previsto ${R.T.prev} · no prazo ${R.T.ok} · com atraso ${R.T.late} · não feito no prazo ${R.T.miss}${R.semHist ? ` · <span class="rl-ruim">${R.semHist} serviços sem histórico (não entram)</span>` : ''}</p>
   <h3>1 · Por empurrador</h3><table class="t"><thead><tr><th>Empurrador</th><th class="r">Previsto</th><th class="r">No prazo</th><th class="r">Com atraso</th><th class="r">Não feito</th><th class="r">Aderência mês</th><th class="r">Aderência ano</th><th>Cronograma aprovado</th></tr></thead><tbody>${R.por.map(p => `<tr><td><b>${esc(p.nome)}</b></td><td class="r">${p.prev}</td><td class="r">${p.ok}</td><td class="r">${p.late}</td><td class="r">${p.miss}</td><td class="r">${p.ad == null ? '—' : p.ad + '%'}</td><td class="r">${p.adAno == null ? '—' : p.adAno + '%'}</td><td>${p.aprov ? 'sim' : 'não'}</td></tr>`).join('')}</tbody></table>
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
  const F = B.filter(r => !r.nf), N = B.filter(r => r.nf), d = F.concat(N).map(r => r.date).sort().pop(), hs = [...new Set(F.filter(r => r.h != null).map(r => posCurtoE(v, posHor(r.pos, A1M[r.item], vid)) + ': ' + nf(r.h) + ' h'))];
  enxDoc('ANEXO II-B · RELATÓRIO DE SERVIÇO REALIZADO · PREVENTIVA', `${esc(v.nome)} · OM ${esc(om)}`,
    enxK([['Empurrador', esc(v.nome)], ['OM (Sankhya)', esc(om)], ['Data', brD(d)], ['Horímetro', esc(hs.join(' · ') || '—')], ['Execução', esc(enxExecTxt(F[0]))], ['Executado por', esc([...new Set(F.map(r => r.quem).filter(Boolean))].join(', ') || '—')]])
    + `<h3>Serviços realizados · ${F.length}</h3><table><thead><tr><th style="width:30%">Equipamento</th><th>Serviço</th></tr></thead><tbody>${F.map(r => `<tr><td>${esc(enxEq(A1M[r.item]))} · ${esc(posCurtoE(v, r.pos))}</td><td>${esc(enxServ(A1M[r.item]))}</td></tr>`).join('')}</tbody></table>`
    + (N.length ? `<h3>Não realizados · ${N.length}</h3><table><thead><tr><th style="width:30%">Equipamento</th><th>Serviço</th><th style="width:30%">Motivo</th></tr></thead><tbody>${N.map(r => `<tr><td>${esc(enxEq(A1M[r.item]))}</td><td>${esc(enxServ(A1M[r.item]))}</td><td>${esc(r.motivo || '')}</td></tr>`).join('')}</tbody></table>` : '')
    + '<h3>Observações</h3><table><tr><td style="height:44px"></td></tr></table>' + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'));
}
function enxIIA(o) {
  const v = vessel(o.vessel), dt = s => s ? brD(String(s).slice(0, 10)) + (String(s).length > 10 ? ' ' + String(s).slice(11, 16) : '') : '—';
  enxDoc('ANEXO II-A · RELATÓRIO DE SERVIÇO REALIZADO · CORRETIVA', `${esc(v ? v.nome : o.vessel)} · OM ${esc(o.num || '—')}`,
    enxK([['Empurrador', esc(v ? v.nome : o.vessel)], ['OM (Sankhya)', esc(o.num || '—')], ['Classe', esc(o.classe || '—')], ['Sistema / equipamento', esc([o.sistema, o.equip].filter(Boolean).join(' · ') || '—')], ['Início do reparo', dt(o.abertura)], ['Liberação', dt(o.liberacao)], ['Execução', esc(enxExecTxt(o))], ['Executado por', esc(o.execn || '—')]])
    + `<h3>O que aconteceu</h3><table><tr><td style="height:40px">${esc(o.descricao || '')}</td></tr></table><h3>O que foi feito</h3><table><tr><td style="height:60px">${esc(o.servicos || '')}</td></tr></table><h3>Observações</h3><table><tr><td style="height:36px">${esc(o.obsEnx || '')}</td></tr></table>`
    + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'));
}
// OMs preventivas registradas de um empurrador (para reimprimir o II-B)
const enxOMsDe = vid => { const G = {}; recs('base').forEach(r => { if (r.vessel === vid && r.om && !r.excluido && A1M[r.item]) { const g = G[r.om] = G[r.om] || { om: r.om, date: r.date, n: 0 }; g.n++; if (r.date > g.date) g.date = r.date; } }); return Object.values(G).sort((a, b) => a.date < b.date ? 1 : -1); };
// ---------- Biblioteca do enxuto: formulários padrão, NP, Anexo I e Matriz técnica (Supervisor, 27/10/2026) ----------
// Formulários em branco para imprimir; os preenchidos saem das próprias telas (Executar, Corretivas, Óleo).
const ENXB_DOCS = [
  ['form', 'Anexo II-B · Relatório de serviço realizado · preventiva', 'Em branco, uma folha. Preenchido, sai em 3 · Executar → Registrar feito', 'iib'],
  ['form', 'Anexo II-A · Relatório de serviço realizado · corretiva', 'Em branco, uma folha. Preenchido, sai em 4 · Corretivas', 'iia'],
  ['form', 'FR 049_B Rev.03 · Troca de óleo, filtros e fluidos', 'Preencher pelo SMF (Óleo) ou imprimir em branco', 'forms/FR_049_B.html'],
  ['form', 'FR 027_L Rev.05 · Check-list de chegada e saída', 'Operador de Medição / Líder, CTF e Coordenador de Operações', 'forms/FR_027_L.html'],
  ['form', 'FR 016_E · Controle de materiais Classe I e II', 'Entrega de resíduos ao SGI (NP 5.7)', 'forms/FR_016_E.html'],
  ['ref', 'Matriz técnica de equipamentos e lubrificação', 'Modelos, óleos, volumes e intervalos da frota', '../docs/Matriz_tecnica.atual17.10.26.html'],
  ['ref', 'Anexo I · Matriz de manutenção preventiva', 'Serviços, frequências e métodos (o plano que gera o cronograma)', '../docs/Anexo_I_NP_055_visual_matriz.html'],
  ['ref', 'NP Navecunha 055 · Plano de Gestão de Manutenção', 'Procedimento vigente (revisão em aprovação)', '../docs/NP_Navecunha_055_corrigida.html'],
];
function enxIIBBranco() {
  const L = n => Array.from({ length: n }, () => '<tr><td style="height:22px"></td><td></td><td style="width:9%"></td><td style="width:9%"></td></tr>').join('');
  enxDoc('ANEXO II-B · RELATÓRIO DE SERVIÇO REALIZADO · PREVENTIVA', 'Formulário em branco',
    enxK([['Empurrador', ''], ['OM (Sankhya)', ''], ['Data', ''], ['Horímetro', 'MCP BB: ______ h · MCP BE: ______ h · MCA 1: ______ h · MCA 2: ______ h'], ['Execução', 'Equipe própria ☐ · Terceiro ☐ · empresa: ____________________'], ['Executado por', '']])
    + `<h3>Serviços</h3><table><thead><tr><th style="width:30%">Equipamento</th><th>Serviço</th><th>Feito</th><th>Não feito</th></tr></thead><tbody>${L(14)}</tbody></table>`
    + '<h3>Motivo dos não feitos e observações</h3><table><tr><td style="height:54px"></td></tr></table>' + enxAss('Executante', 'Recebido a bordo (Comandante ou Coord. de Operações)', 'Supervisor de Manutenção'));
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
  return enxCab('Biblioteca', 'Formulários padrão para imprimir, a Matriz técnica, o Anexo I e a NP 055 · manuais e catálogos enviados ficam no Google Drive', `<button class="mbtn" data-ebibnovo>＋ Adicionar documento</button><button class="mbtn" data-enxreset>Reorganizar</button>`)
   + sec('form', 'Formulários padrão') + sec('ref', 'Normas e matrizes')
   + `<div class="card"><h2>Manuais e documentos enviados · ${D.length}</h2>${D.length ? `<table class="t"><tbody>${D.map(r => `<tr><td><b>${esc(r.titulo)}</b><div class="note">${esc([r.desc, r.equip ? EQN[r.equip] || r.equip : '', r.rev ? 'Rev. ' + r.rev : ''].filter(Boolean).join(' · '))}</div></td><td style="width:1%;white-space:nowrap"><button class="mbtn sm pri" data-ebibdoc="${r.id}">Abrir</button></td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum ainda. Use “Adicionar documento” para manuais de fabricante, catálogos e procedimentos (arquivo até 10 MB ou link).</p>'}</div></div></div>`;
}
// ---------- Corretivas: registro de uma tela, com início e liberação (MTTR) e o Anexo II-A ----------
function vEnxCor() {
  const V = S.cfg.frota.filter(v => !foraOp(v)), L = oms().filter(o => o.tipo === 'C' && !o.excluido).sort((a, b) => (b.abertura || '') < (a.abertura || '') ? -1 : 1).slice(0, 40), agora = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  return enxCab('Corretivas', 'Registre a corretiva feita: o que aconteceu, o que foi feito, início e liberação · sai o Anexo II-A de uma folha · a OM e as fotos ficam no Sankhya', '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Registrar corretiva</h2><div class="g">
      <label class="f s2">Empurrador<select id="ecV">${V.map(v => `<option value="${v.id}">${esc(v.nome)}</option>`).join('')}</select></label><label class="f s2">Nº da OM (Sankhya)<input id="ecO" inputmode="numeric"></label>
      <label class="f s2">Classe<select id="ecC">${['Crítica', 'Alta', 'Média', 'Baixa'].map(c => `<option>${c}</option>`).join('')}</select></label>
      <label class="f s3">Sistema<select id="ecS">${SISTEMAS.map(s => `<option>${esc(s)}</option>`).join('')}</select></label><label class="f s3">Equipamento<input id="ecE" placeholder="ex.: bomba de água salgada do MCA"></label>
      <label class="f s3">Início do reparo<input type="datetime-local" id="ecI" max="${agora}"></label><label class="f s3">Liberação<input type="datetime-local" id="ecL" max="${agora}"></label>
      <label class="f s6">O que aconteceu<textarea id="ecD" rows="2"></textarea></label><label class="f s6">O que foi feito<textarea id="ecF" rows="2"></textarea></label>
      ${enxExecCampos()}<label class="f s3">Executado por (nomes)<input id="ecQ" placeholder="nomes da equipe ou responsável técnico"></label><label class="f s3">Observação<input id="ecX"></label></div>
     ${enxFotosCampos()}
     <div class="note" id="ecErr" style="color:var(--badt)"></div><div class="row end"><button class="mbtn pri" data-ecsalvar>Registrar e imprimir o Anexo II-A</button></div></div>
   <div class="card"><h2>Corretivas registradas</h2><div class="tw"><table class="t"><thead><tr><th>Início</th><th>Empurrador</th><th>OM</th><th>Equipamento</th><th>O que aconteceu</th><th>Classe</th><th class="r">Parado</th><th></th></tr></thead><tbody>
   ${L.map(o => { const h = o.abertura && o.liberacao ? Math.max(0, (new Date(o.liberacao) - new Date(o.abertura)) / 36e5) : null; return `<tr><td class="nowrap">${brD(String(o.abertura || '').slice(0, 10))}</td><td><b>${esc(vName(o.vessel))}</b></td><td>${esc(o.num || '—')}</td><td>${esc(o.equip || o.sistema || '—')}</td><td>${esc(String(o.descricao || '').slice(0, 90))}</td><td>${esc(o.classe || '—')}</td><td class="r">${h == null ? '<span class="mut">em aberto</span>' : nf(h, 1) + ' h'}</td><td><button class="mbtn sm" data-ec2a="${o.id}">Anexo II-A</button></td></tr>`; }).join('') || '<tr><td colspan="8" class="note">Nenhuma corretiva registrada.</td></tr>'}</tbody></table></div></div></div></div>`;
}
async function enxCorSalvar() {
  if (!S.session) return loginModal(); const g = id => $('#' + id).value.trim(), E = $('#ecErr'), num = g('ecO').replace(/\D/g, ''), ini = g('ecI'), lib = g('ecL');
  if (num.length < 3) return E.textContent = 'Informe o nº da OM do Sankhya.'; if (oms().some(o => o.num === num)) return E.textContent = 'A OM ' + num + ' já está registrada.';
  if (!ini || !lib) return E.textContent = 'Informe o início e a liberação (data e hora).'; if (lib < ini) return E.textContent = 'A liberação não pode ser antes do início.';
  if (!g('ecD') || !g('ecF') || !g('ecQ')) return E.textContent = 'Preencha o que aconteceu, o que foi feito e quem executou.';
  const ex = enxExecLer(); if (!ex) return E.textContent = 'Execução por terceiro: informe a empresa.';
  E.textContent = 'Preparando as fotos…'; const fotos = await enxFotosLer(); if (!fotos) return E.textContent = 'Anexe ao menos uma foto de antes e uma de depois (evidência do reparo).'; E.textContent = '';
  const o = { id: uid('om'), kind: 'om', tipo: 'C', num, vessel: $('#ecV').value, pos: 'UN', status: 'encerrada', classe: $('#ecC').value, sistema: $('#ecS').value, equip: g('ecE'), descricao: g('ecD'), servicos: g('ecF'), execn: g('ecQ'), exec: ex.exec, empresa: ex.empresa, obsEnx: g('ecX'),
    abertura: ini, deteccao: ini, inicio: ini, termino: lib, liberacao: lib, interd: 'N/A', resultado: 'Conforme', fotos, fechadoAt: Date.now(), aprovBy: S.session.name, aprovAt: isoD(hoje()), enx: true, hist: [{ at: Date.now(), by: S.session.name, ev: 'Registrada no modo enxuto' }] };
  await saveRec(o); toast('Corretiva ' + num + ' registrada.'); enxIIA(o); render(); }
// ---------- Cronograma corporativo (Supervisor, 27/10/2026: “sem visão clara, sem poder imprimir”) ----------
// Frota: empurradores × 12 meses (feito/previsto com cor) · empurrador: serviço × 12 meses (grade clássica prTabela) · imprimir A4/A3 paisagem · aprovar o ano.
// Mesmas contas do cronograma de sempre (prResumo / prLinhas): os números batem com a aderência e com o relatório.
const ENXC = { ano: hoje().getFullYear(), v: '', papel: 'A4' };
function enxCrGrade(ano, imp) {
  const V = S.cfg.frota.filter(v => !foraOp(v)), hm = hoje().getFullYear() === ano ? hoje().getMonth() : ano < hoje().getFullYear() ? 12 : -1, sel = [...Array(12).keys()];
  const T = Array.from({ length: 12 }, () => ({ p: 0, r: 0, ok: 0, lt: 0, ms: 0 })); let aOk = 0, aDen = 0;
  const rows = V.map(v => { const r = prResumo(v, ano, hm, sel), B = cronoBase(ano, v.id), dc = typeof docaVessel === 'function' ? docaVessel(v) : null, dm = dc && dc.due && dc.due.getFullYear() === ano ? dc.due.getMonth() : -1;
    aOk += r.ok; aDen += r.den;
    const cel = i => { const p = r.P[i], rr = Math.min(p, r.R[i]) || r.R[i], ok = r.Ok[i], lt = r.Lt[i], ms = r.Ms[i]; T[i].p += p; T[i].r += r.R[i]; T[i].ok += ok; T[i].lt += lt; T[i].ms += ms;
      const cls = i > hm ? 'fut' : i === hm ? (ms ? 'ms' : 'hj') : ms ? 'ms' : lt ? 'lt' : p || r.R[i] ? 'ok' : 'nd';
      const tx = i > hm ? (p ? p : '') : (p || r.R[i] ? `${r.R[i]}<small>/${p}</small>` : ''), tip = `${MESES[i]}: ${p} previsto${p === 1 ? '' : 's'} · ${ok} no prazo · ${lt} com atraso · ${ms} não feito${ms === 1 ? '' : 's'}${i === dm ? ' · docagem' : ''}`;
      return `<td class="ecr-c ${cls}" title="${tip}">${tx}${i === dm ? '<span class="ecr-dk" title="Docagem">⚓</span>' : ''}</td>`; };
    const nome = imp ? `<b>${esc(v.nome)}</b>` : `<a href="#enxcr" data-ecrv="${v.id}"><b>${esc(v.nome)}</b></a>`;
    return `<tr><td class="ecr-n">${nome}<small>${B ? 'aprovado ' + brD(B.aprovAt) + ' · rev. ' + B.rev : '<span style="color:#B06000">não aprovado</span>'}</small></td>${sel.map(cel).join('')}<td class="ecr-t">${r.tP}</td><td class="ecr-t"><b style="color:${r.ad == null ? '#5F6368' : r.ad >= 90 ? '#188038' : r.ad >= 75 ? '#B06000' : '#C5221F'}">${r.ad == null ? '—' : r.ad + '%'}</b></td></tr>`; }).join('');
  const ad = aDen ? Math.round(aOk / aDen * 100) : null;
  const foot = `<tr class="ecr-f"><td class="ecr-n"><b>Frota</b></td>${T.map((t, i) => `<td class="ecr-c">${i > hm ? t.p : `${t.r}<small>/${t.p}</small>`}</td>`).join('')}<td class="ecr-t">${T.reduce((a, t) => a + t.p, 0)}</td><td class="ecr-t"><b>${ad == null ? '—' : ad + '%'}</b></td></tr>
    <tr class="ecr-f"><td class="ecr-n">Aderência no mês</td>${T.map((t, i) => { const d = t.ok + t.lt + t.ms; return `<td class="ecr-c">${i <= hm && d ? Math.round(t.ok / d * 100) + '%' : ''}</td>`; }).join('')}<td></td><td></td></tr>`;
  return { html: `<table class="ecr"><thead><tr><th class="ecr-n">Empurrador</th>${MESES.map((m, i) => `<th${i === hm ? ' class="hj"' : ''}>${m}</th>`).join('')}<th>Total</th><th>Aderência</th></tr></thead><tbody>${rows}</tbody><tfoot>${foot}</tfoot></table>`, ad, n: V.length, aprov: V.filter(v => cronoBase(ano, v.id)).length };
}
const ENX_LEG = '<div class="ecr-lg"><span><i class="ok"></i>feito no prazo</span><span><i class="lt"></i>feito com atraso</span><span><i class="ms"></i>venceu sem fazer</span><span><i class="hj"></i>mês atual</span><span><i class="fut"></i>previsto</span><span>⚓ docagem</span><span>número = feito/previsto no mês</span></div>';
function vEnxCr() {
  const ano = ENXC.ano, v = vessel(ENXC.v), anos = [ano - 1, ano, ano + 1], seg = `<div class="seg">${anos.map(a => `<button data-ecrano="${a}" class="${a === ano ? 'on' : ''}">${a}</button>`).join('')}</div>`;
  const imp = `<select id="ecrPapel" style="width:auto">${['A4', 'A3'].map(p => `<option${p === ENXC.papel ? ' selected' : ''}>${p}</option>`).join('')}</select><button class="mbtn pri" data-ecrimp>🖨 Imprimir</button>`;
  if (!v) { const G = enxCrGrade(ano);
    return enxCab('Cronograma anual de manutenção preventiva', `Frota de empurradores · ${ano} · plano do Anexo I (NP Navecunha 055 item 7.3) · clique no empurrador para ver serviço por serviço`, seg + imp + '<button class="mbtn" data-enxreset>Reorganizar</button>')
     + `<div class="card"><h2>Resumo ${ano}</h2><div class="f2-ks">${[['Aderência no ano', G.ad == null ? '—' : G.ad + '%', G.ad == null ? '' : G.ad >= 90 ? 'var(--okt)' : 'var(--badt)'], ['Cronogramas aprovados', G.aprov + ' de ' + G.n, G.aprov < G.n ? 'var(--warnt)' : 'var(--okt)']].map(([l, n, c]) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${n}</b></div>`).join('')}</div>${can.admin() && G.aprov < G.n ? `<p class="note">Aprovar congela o previsto do ano (linha de base): a aderência passa a medir contra o plano aprovado. <button class="mbtn sm" data-ecraprov="todos">Aprovar o cronograma ${ano} da frota</button></p>` : ''}</div>
     <div class="card"><h2>Cronograma ${ano} · frota</h2>${ENX_LEG}<div class="tw">${G.html}</div></div></div></div>`; }
  const B = cronoBase(ano, v.id);
  return enxCab(`Cronograma anual · ${esc(v.nome)}`, `${ano} · serviço por serviço: ● previsto · ✓ feito no prazo · ✓ âmbar com atraso · ✗ venceu sem fazer · passe o mouse para ver data e OM`, `<button class="mbtn" data-ecrv="">← Frota</button>` + seg + imp + '<button class="mbtn" data-enxreset>Reorganizar</button>')
   + `<div class="card"><h2>Situação do cronograma</h2><p>${B ? `Previsto <b>aprovado</b> por ${esc(B.aprovBy)} em ${brD(B.aprovAt)} · rev. ${B.rev}` : '<b style="color:#B06000">Previsto ainda não aprovado</b> · a aderência mede contra o plano calculado, que muda conforme os serviços são feitos'}
     ${can.admin() ? ` <button class="mbtn sm${B ? '' : ' pri'}" data-ecraprov="${v.id}">${B ? 'Aprovar de novo (nova revisão)' : 'Aprovar o cronograma ' + ano}</button>` : ''} <a class="mbtn sm" href="#enx" data-enxir="${v.id}">Executar: o que vence agora →</a></p></div>
   <div class="card"><h2>Serviços · ${ano}</h2><div class="tw">${prTabela(v, ano)}</div></div></div></div>`;
}
function enxCrImprimir() {
  const ano = ENXC.ano, v = vessel(ENXC.v); if (v) return prPDF([v], ano, false);
  const G = enxCrGrade(ano, true), css = [...document.querySelectorAll('style')].map(x => x.textContent).filter(x => x.includes('.ecr{')).join('\n'), w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cronograma ${ano}</title><style>${css}${DOC_CAB_CSS}@page{size:${ENXC.papel} landscape;margin:8mm}body{margin:0;font-family:Arial,sans-serif;color:#202124}.ecr{font-size:${ENXC.papel === 'A3' ? 12 : 10}px}
   .ass{display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:26px}.ass div{border-top:1px solid #000;padding-top:3px;text-align:center;font-size:10px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
   ${docCab(`CRONOGRAMA ANUAL DE MANUTENÇÃO PREVENTIVA · ${ano}`, `Frota de empurradores · ${G.aprov} de ${G.n} cronogramas aprovados · aderência no ano ${G.ad == null ? '—' : G.ad + '%'} · emitido em ${hoje().toLocaleDateString('pt-BR')}`, 'NP Navecunha 055 · item 7.3 · plano: Anexo I')}
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
  m.onclick = async e => { const t = e.target.closest('[data-ecrv],[data-ecrano],[data-ecrimp],[data-ecraprov],[data-enxir],[data-enxv],[data-enxcopiar],[data-enxfeito],[data-enxnf],[data-enxtodos],[data-enxabre],[data-ehv],[data-ehno],[data-ehsalvar],[data-erimp],[data-enx2b],[data-ecsalvar],[data-ec2a],[data-ebib],[data-ebibdoc],[data-ebibnovo]'); if (!t) return; const d = t.dataset;
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
    if (d.ec2a !== undefined) { const o = S.recs.get(d.ec2a); if (o) enxIIA(o); return; }
    if (d.enxcopiar !== undefined) return enxCopiar();
    if (d.enxfeito !== undefined) return enxFeitoModal();
    if (d.enxnf !== undefined) return enxNFModal();
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
