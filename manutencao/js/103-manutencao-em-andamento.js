'use strict';
/* ===== 1.3 · Manutenção no porto e no estaleiro e ficha do empurrador (SMF 3.164, Supervisor 02/11/2026; prévia aprovada) =====
   Para a reunião com a diretoria: o que está em manutenção no porto e no estaleiro, com início e previsão de término, e as SC/RM de cada empurrador.
   Registro novo: snap tipo 'manut' (vessel, onde porto/estaleiro, local, txt, om, ini, prev, prevH = [[data, previsão, motivo, quem]] quando a previsão
   muda, serv = [{ t, ok, dep }], fotos, fim). Corretiva aberta entra sozinha (sem previsão até alguém abrir o acompanhamento com o mesmo nº de OM);
   empurrador em reforma sem acompanhamento entra no estaleiro pela reforma. SC/RM da 5.1 (snap screq): pendente = gsAberta; depende da manutenção
   quando tem o mesmo nº de OM ou é citada num serviço. Ficha (vgFicha): fotos da semana, manutenções, corretivas abertas, ocorrências da viagem e SC/RM. */
const vgMans = () => recs('snap').filter(r => r.tipo === 'manut' && !r.excluido && !r.fim);
const vgCorAb = vid => oms().filter(o => o.tipo === 'C' && o.status === 'aberta' && !o.excluido && (!vid || o.vessel === vid));
const vgDD = (a, b) => Math.round((pD(b) - pD(a)) / 864e5);
const vgSemIni = () => { const h = hoje(), d = (h.getDay() + 6) % 7; return isoD(new Date(h.getFullYear(), h.getMonth(), h.getDate() - d)); };   // segunda-feira desta semana
const vgReqs = vid => typeof gsReqs === 'function' ? gsReqs().filter(r => r.vessel === vid) : [];
const vgItens = r => (r.itens || []).length;
// SC/RM ligadas a uma manutenção: mesmo nº de OM ou citadas num serviço (“RM 278557”)
function vgDeps(vid, om, serv) { const txt = (serv || []).map(s => s.dep || '').join(' ');
  return vgReqs(vid).filter(r => gsAberta(r) && ((om && String(r.om) === String(om)) || (r.num && new RegExp('\\b' + r.num + '\\b').test(txt)))); }
// linhas do quadro: acompanhamentos abertos + corretivas abertas sem acompanhamento + reformas sem acompanhamento
function vgManLinhas() {
  const M = vgMans(), com = new Set(M.filter(m => m.om).map(m => m.vessel + '|' + m.om)), L = [];
  M.forEach(m => L.push({ m, vid: m.vessel, onde: m.onde, local: m.local, txt: m.txt, om: m.om, ini: m.ini, prev: m.prev, serv: m.serv || [], nPrev: (m.prevH || []).length }));
  vgCorAb().forEach(o => { if (com.has(o.vessel + '|' + o.num)) return; const st = vgOndeDe(o.vessel, false).st; if (st === 'via') return;
    L.push({ cor: o, vid: o.vessel, onde: st === 'ref' ? 'estaleiro' : 'porto', txt: `Corretiva ${o.classe || ''} · ${o.equip || o.sistema || ''}${o.descricao ? ' · ' + o.descricao : ''}`, om: o.num, ini: (o.abertura || '').slice(0, 10), prev: '', serv: [] }); });
  S.cfg.frota.forEach(v => { const r = vgEmReforma(v.id); if (!r || M.some(m => m.vessel === v.id && m.onde === 'estaleiro')) return;
    L.push({ ref: r, vid: v.id, onde: 'estaleiro', local: r.local, txt: 'Reforma' + (r.obs ? ' · ' + r.obs : ''), ini: r.ini, prev: '', serv: [] }); });
  return L.map(x => Object.assign(x, { deps: vgDeps(x.vid, x.om, x.serv), nome: vName(x.vid) })).sort((a, b) => (a.prev || '9') < (b.prev || '9') ? -1 : 1);
}
function vgManCard() {
  const L = vgManLinhas(), H = isoD(hoje()), ed = can.edit();
  const prevTx = x => { if (!x.prev) return '<span class="pill p-mut">sem previsão</span>'; const d = vgDD(H, x.prev);
    return `${brD(x.prev)} <span class="pill ${d < 0 ? 'p-bad' : d <= 3 ? 'p-warn' : 'p-ok'}">${d < 0 ? (-d) + ' d atrasada' : d === 0 ? 'hoje' : 'faltam ' + d + ' d'}</span>${x.nPrev ? `<div class="note">previsão mudou ${x.nPrev} vez${x.nPrev > 1 ? 'es' : ''}${x.m.prevH[x.nPrev - 1][2] ? ' · ' + esc(x.m.prevH[x.nPrev - 1][2]) : ''}</div>` : ''}`; };
  const depTx = x => x.deps.length ? x.deps.map(r => { const d = gsDias(r); return `${esc(r.tp)} ${esc(r.num)} <span class="pill ${d > 30 ? 'p-bad' : d > 15 ? 'p-warn' : 'p-mut'}">${d} d</span>${vgItens(r) ? ` <span class="note">${vgItens(r)} itens</span>` : ''}`; }).join('<br>') : '<span class="note">—</span>';
  const lug = x => { const o = vgOndeDe(x.vid, false); return x.local || (o.st === 'por' && typeof vgLugar === 'function' ? vgLugar(o.porto) || o.porto : '') || ''; };
  const tab = (onde, tit, cIni, cPrev) => { const R = L.filter(x => x.onde === onde);
    return `<h3 class="vgm-h">${tit} · ${R.length}</h3>${R.length ? `<div class="tw"><table class="t vgm-t"><thead><tr><th>Empurrador</th><th>O que é</th><th>${cIni}</th><th>${cPrev}</th><th>SC/RM pendentes</th><th></th></tr></thead><tbody>
      ${R.map(x => { const nF = x.serv.filter(s => s.ok).length; return `<tr><td><a href="#" data-vgficha="${x.vid}"><b>${esc(x.nome)}</b></a><div class="note">${esc(lug(x))}</div></td>
        <td>${esc(x.txt || '')}<div class="note">${x.om ? 'OM ' + esc(x.om) : 'sem OM'}${x.serv.length ? ` · ${nF} de ${x.serv.length} serviços feitos` : ''}</div></td><td class="nowrap">${x.ini ? brD(x.ini) : '—'}</td><td>${prevTx(x)}</td><td>${depTx(x)}</td>
        <td class="nowrap">${ed ? (x.m ? `<button class="mbtn sm" data-vgman="${x.m.id}">Atualizar</button>` : `<button class="mbtn sm" data-vgman="" data-vgv="${x.vid}" data-vgo="${esc(x.om || '')}" data-vgw="${onde}" data-vgt="${esc(x.txt || '')}" data-vgi="${x.ini || ''}">Pôr previsão</button>`) : ''}</td></tr>`; }).join('')}</tbody></table></div>` : `<p class="note">Nenhum empurrador em manutenção ${onde === 'porto' ? 'no porto' : 'no estaleiro'}.</p>`}`; };
  // SC/RM por empurrador: pendentes (todas, com a mais antiga) e atendidas nesta semana (segunda a hoje)
  const s0 = vgSemIni(), Q = S.cfg.frota.map(v => { const R = vgReqs(v.id), P = R.filter(gsAberta), A = R.filter(r => r.st === 'fim' && (r.fim || '') >= s0);
    return { v, P, A, ant: P.length ? Math.max(...P.map(gsDias)) : null }; }).filter(x => x.P.length || x.A.length).sort((a, b) => (b.ant ?? -1) - (a.ant ?? -1));
  const it = L0 => L0.reduce((s, r) => s + vgItens(r), 0), nq = L0 => `${L0.length}${it(L0) ? ' · ' + it(L0) + ' itens' : ''}`;
  const scrm = `<h3 class="vgm-h">SC e RM · semana de ${brD(s0)} a ${brD(H)}</h3>${Q.length ? `<div class="tw"><table class="t vgm-t"><thead><tr><th>Empurrador</th><th>Pendentes</th><th>Mais antiga</th><th>Atendidas na semana</th></tr></thead><tbody>
    ${Q.map(x => `<tr><td><a href="#" data-vgficha="${x.v.id}"><b>${esc(x.v.nome)}</b></a></td><td>${x.P.length ? nq(x.P) + `<div class="note">${x.P.map(r => esc(r.tp + ' ' + r.num)).join(' · ')}</div>` : '—'}</td><td>${x.ant == null ? '—' : `<span class="pill ${x.ant > 30 ? 'p-bad' : x.ant > 15 ? 'p-warn' : 'p-mut'}">${x.ant} d</span>`}</td><td>${x.A.length ? nq(x.A) + `<div class="note">${x.A.map(r => esc(r.tp + ' ' + r.num)).join(' · ')}</div>` : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhuma SC ou RM de empurrador pendente nem atendida nesta semana (lançadas em 5.1 Solicitações e requisições).</p>'}`;
  return `<div class="card"><div class="row"><h2>Manutenção no porto e no estaleiro</h2><span class="sp"></span>${ed ? '<button class="mbtn pri" data-vgman="">+ Abrir acompanhamento</button>' : ''}</div>
    <p class="note" style="margin-top:0">Início e previsão de término de cada manutenção · corretiva aberta entra sozinha · previsão vencida em vermelho · SC/RM pendente há mais de 15 dias em âmbar, mais de 30 em vermelho · clique no empurrador para ver a ficha (fotos da semana, serviços e itens das requisições)</p>
    ${tab('porto', 'Em manutenção no porto', 'Início', 'Previsão de término')}${tab('estaleiro', 'Em manutenção ou reforma no estaleiro', 'Entrada', 'Previsão de entrega')}${scrm}</div>`;
}
// ---------- abrir ou atualizar o acompanhamento ----------
function vgManModal(id, pre) {
  if (!can.edit()) return; const m = id ? S.recs.get(id) : null, p = pre || {}, v0 = m ? m.vessel : p.vid || '', onde = m ? m.onde : p.onde || 'porto';
  const linha = (s, k) => `<div class="g vgm-s"><label class="f s1" style="align-self:end"><input type="checkbox" class="vgmK"${s.ok ? ' checked' : ''}> feito</label><label class="f s7">Serviço<input class="vgmT" value="${esc(s.t || '')}"></label><label class="f s4">Depende de (SC/RM)<input class="vgmD" value="${esc(s.dep || '')}" placeholder="RM 278557"></label></div>`;
  const S0 = m && m.serv && m.serv.length ? m.serv : [{}, {}, {}];
  modal(`<h2>${m ? 'Atualizar acompanhamento · ' + esc(vName(m.vessel)) : 'Abrir acompanhamento da manutenção'}</h2>
    <div class="g"><label class="f s3">Empurrador<select id="vgmV"${m ? ' disabled' : ''}>${S.cfg.frota.map(v => `<option value="${v.id}"${v.id === v0 ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></label>
      <label class="f s3">Onde<select id="vgmW"><option value="porto"${onde === 'porto' ? ' selected' : ''}>No porto</option><option value="estaleiro"${onde === 'estaleiro' ? ' selected' : ''}>No estaleiro</option></select></label>
      <label class="f s3">Local<input id="vgmL" list="vgmLL" value="${esc(m ? m.local || '' : onde === 'estaleiro' ? 'Estaleiro Rio Amazonas (ERAM)' : '')}" placeholder="Boia 1, ERAM…"><datalist id="vgmLL">${Object.keys(typeof VG_FIXO === 'object' ? VG_FIXO : {}).map(k => `<option value="${esc(k)}">`).join('')}</datalist></label>
      <label class="f s3">Nº da OM (Sankhya)<input id="vgmO" inputmode="numeric" value="${esc(m ? m.om || '' : p.om || '')}"></label>
      <label class="f s6">O que é<input id="vgmX" value="${esc(m ? m.txt || '' : p.txt || '')}" placeholder="Preventiva de 1.000 h dos MCP, reforma geral, corretiva do reversor…"></label>
      <label class="f s3">Início / entrada<input type="date" id="vgmI" value="${m ? m.ini || '' : p.ini || isoD(hoje())}"></label><label class="f s3">Previsão de término<input type="date" id="vgmP" value="${m ? m.prev || '' : ''}"></label>
      <label class="f s12" id="vgmMl" style="display:none">Por que a previsão mudou<input id="vgmM" placeholder="aguardando peça da RM 278557, serviço a mais encontrado na desmontagem…"></label></div>
    <h3 style="margin:10px 0 4px;font-size:13px">Serviços</h3><div id="vgmSL">${S0.map(linha).join('')}</div><button class="mbtn sm" id="vgmAdd">+ serviço</button>
    <div class="g" style="margin-top:8px">${enxFotoCampo('vgmF', 'Fotos da semana (até 6 por vez)')}</div>${m && (m.fotos || []).length ? `<p class="note">${m.fotos.length} foto(s) já registradas neste acompanhamento.</p>` : ''}
    <p class="note" id="vgmE" style="color:var(--badt)"></p>
    <div class="row end">${m ? '<button class="mbtn" id="vgmFim">Concluída</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="vgmOk">Salvar</button></div>`, true);
  $('#vgmAdd').onclick = () => $('#vgmSL').insertAdjacentHTML('beforeend', linha({}));
  $('#vgmP').onchange = () => { if (m && m.prev) $('#vgmMl').style.display = $('#vgmP').value !== m.prev ? '' : 'none'; };
  const ler = async () => { const prev = $('#vgmP').value, ini = $('#vgmI').value, txt = $('#vgmX').value.trim(), E = $('#vgmE');
    if (!txt) { E.textContent = 'Diga o que é a manutenção.'; return null; } if (!ini) { E.textContent = 'Informe o início.'; return null; } if (prev && prev < ini) { E.textContent = 'A previsão não pode ser antes do início.'; return null; }
    const mudou = m && m.prev && prev !== m.prev, mot = $('#vgmM').value.trim(); if (mudou && !mot) { E.textContent = 'Diga por que a previsão mudou.'; return null; }
    const serv = $$('#vgmSL .vgm-s').map(d => ({ t: d.querySelector('.vgmT').value.trim(), ok: d.querySelector('.vgmK').checked, dep: d.querySelector('.vgmD').value.trim() })).filter(s => s.t);
    const novas = []; for (const f of fxArq('vgmF').slice(0, 6)) novas.push({ tipo: 'FOTO', src: await comprimir(f), at: Date.now() });
    const r = Object.assign({}, m || { id: uid('snap'), kind: 'snap', tipo: 'manut', vessel: $('#vgmV').value, por: S.session.name, prevH: [], fotos: [] },
      { onde: $('#vgmW').value, local: $('#vgmL').value.trim(), om: $('#vgmO').value.trim(), txt, ini, prev, serv, fotos: [...((m && m.fotos) || []), ...novas], at: Date.now() });
    if (mudou) r.prevH = [...(m.prevH || []), [isoD(hoje()), m.prev, mot, S.session.name]]; return r; };
  $('#vgmOk').onclick = async () => { const r = await ler(); if (!r) return; await saveRec(r); closeModal(); toast('Acompanhamento salvo.'); render(); };
  const fim = $('#vgmFim'); if (fim) fim.onclick = async () => { const r = await ler(); if (!r) return; r.fim = isoD(hoje()); await saveRec(r); closeModal(); toast('Manutenção concluída.'); render(); };
}
// ---------- ficha do empurrador (clique no mapa ou na tabela) ----------
function vgFotosSemana(vid) {
  const t0 = Date.now() - 7 * 864e5, d0 = isoD(new Date(t0)), F = [];
  for (const r of S.recs.values()) { if (r.excluido || r.vessel !== vid || !(r.fotos || []).length) continue; const dr = (r.date || r.abertura || '').slice(0, 10);
    r.fotos.forEach(f => { const at = typeof f.at === 'number' ? f.at : f.at ? +new Date(f.at) : 0; if ((at && at >= t0) || (!at && dr >= d0)) F.push({ f, at: at || +pD(dr), r }); }); }
  return F.sort((a, b) => b.at - a.at).slice(0, 9);
}
// ocorrências desde a data d0: avaria em viagem e corretiva aberta nesse período (a avaria que virou corretiva conta uma vez só, pela corretiva)
function vgOcorr(vid, d0) {
  const C = oms().filter(c => c.tipo === 'C' && c.vessel === vid && !c.excluido && (c.abertura || '').slice(0, 10) >= d0), om = new Set(C.map(c => String(c.num || '')).filter(Boolean));
  return [...recs('avaria').filter(a => a.vessel === vid && !a.excluido && (a.date || '') >= d0 && !(a.om && om.has(String(a.om)))).map(a => ({ id: a.id, d: a.date, h: a.hora, c: a.c, eq: a.sis, txt: a.desc, feito: a.fim ? (a.fim.txt || a.servicos || 'resolvida') : '', om: a.om, ok: !!a.fim, fotos: (a.fotos || []).concat((a.fim || {}).fotos || []) })),
    ...C.map(c => ({ id: c.id, d: (c.abertura || '').slice(0, 10), h: (c.abertura || '').slice(11, 16), c: c.classe, eq: c.equip || c.sistema, txt: c.descricao, feito: c.servicos || (c.status === 'aberta' ? '' : 'liberada'), om: c.num, ab: c.status === 'aberta', ok: c.status !== 'aberta', fotos: c.fotos || [] }))].sort((a, b) => a.d < b.d ? 1 : -1);
}
function vgFicha(vid) {
  const v = vessel(vid); if (!v) return; const o = vgOndeDe(vid, false), H = isoD(hoje());
  const onde = o.st === 'via' ? `em rota${o.rota ? ' · ' + esc(vgRotaCurta(o.rota)) : ''}${o.saida ? ' · saiu em ' + brD(o.saida) : ''}${o.local ? ' · ' + esc(o.local) : ''}` : o.st === 'ref' ? 'em reforma' : 'no porto · ' + esc((typeof vgLugar === 'function' && vgLugar(o.porto)) || o.porto || '');
  const F = vgFotosSemana(vid), fotos = F.length ? `<div class="vgf-ft">${F.map(x => `<figure><img ${x.f.src ? `src="${x.f.src}"` : `data-hefid="${esc(x.f.fid)}" alt="carregando"`}><figcaption>${brD(isoD(new Date(x.at)))}</figcaption></figure>`).join('')}</div>` : '<p class="note">Nenhuma foto registrada nos últimos 7 dias.</p>';
  const M = vgManLinhas().filter(x => x.vid === vid), man = M.length ? M.map(x => `<div class="vgf-b"><b>${esc(x.txt || '')}</b> <span class="note">${x.onde === 'estaleiro' ? 'no estaleiro' : 'no porto'}${x.om ? ' · OM ' + esc(x.om) : ''} · início ${x.ini ? brD(x.ini) : '—'} · previsão ${x.prev ? brD(x.prev) + (x.prev < H ? ` <b style="color:var(--badt)">(${-vgDD(H, x.prev)} d atrasada)</b>` : '') : 'não informada'}</span>
      ${x.serv.length ? `<table class="t"><tbody>${x.serv.map(s => `<tr><td>${esc(s.t)}</td><td class="nowrap"><span class="pill ${s.ok ? 'p-ok' : 'p-warn'}">${s.ok ? 'feito' : 'pendente'}</span></td><td class="note">${esc(s.dep || '')}</td></tr>`).join('')}</tbody></table>` : ''}</div>`).join('') : '<p class="note">Nenhuma manutenção em andamento.</p>';
  // ocorrências da viagem em curso (ou dos últimos 30 dias no porto): avaria em viagem e corretivas abertas nesse período, com o que foi feito
  const d0 = o.st === 'via' && o.saida ? o.saida : isoD(new Date(Date.now() - 30 * 864e5));
  const Oc = vgOcorr(vid, d0);
  const oc = Oc.length ? `<table class="t"><thead><tr><th>Data</th><th>Classe</th><th>O que aconteceu</th><th>O que foi feito</th><th>OM</th></tr></thead><tbody>${Oc.map(x => `<tr><td class="nowrap">${brD(x.d)}${x.h ? ' ' + esc(x.h) : ''}</td><td>${esc(x.c || '')}</td><td>${esc(x.eq || '')}${x.txt ? '<div class="note">' + esc(x.txt) + '</div>' : ''}</td><td>${x.feito ? esc(x.feito) : '<span class="pill p-warn">em aberto</span>'}</td><td>${esc(x.om || '—')}</td></tr>`).join('')}</tbody></table>` : `<p class="note">Nenhuma ocorrência ${o.st === 'via' ? 'nesta viagem' : 'nos últimos 30 dias'}.</p>`;
  const R = vgReqs(vid).filter(gsAberta).sort((a, b) => gsDias(b) - gsDias(a)), req = R.length ? R.map(r => { const d = gsDias(r);
    return `<div class="vgf-b"><b>${esc(r.tp)} ${esc(r.num)}</b> <span class="pill ${d > 30 ? 'p-bad' : d > 15 ? 'p-warn' : 'p-mut'}">pendente há ${d} d</span> <span class="note">${brD(r.date)}${r.om ? ' · OM ' + esc(r.om) : ''} · ${esc(gsStTx(r))}</span>${r.txt ? `<div class="note">${esc(r.txt)}</div>` : ''}
      ${vgItens(r) ? `<table class="t"><thead><tr><th>Item</th><th>Descrição</th><th class="r">Qtd.</th></tr></thead><tbody>${r.itens.map(i => `<tr><td>${esc(i[0])}</td><td>${esc(i[2])}</td><td class="r nowrap">${esc(i[4])} ${esc(i[3])}</td></tr>`).join('')}</tbody></table>` : ''}</div>`; }).join('') : '<p class="note">Nenhuma SC ou RM pendente.</p>';
  modal(`<div class="row"><h2>${esc(v.nome)}</h2><span class="sp"></span><button class="mbtn" data-close>Fechar</button></div><p class="note" style="margin-top:0">${onde}${o.balsas && o.balsas.length ? ' · balsas ' + esc(o.balsas.map(vName).join(', ')) : ''}</p>
    <h3 class="vgm-h">Fotos da semana</h3>${fotos}<h3 class="vgm-h">Manutenção em andamento</h3>${man}<h3 class="vgm-h">${o.st === 'via' ? 'Ocorrências nesta viagem' : 'Ocorrências dos últimos 30 dias'}</h3>${oc}<h3 class="vgm-h">SC e RM pendentes</h3>${req}`, true);
  if (typeof heCarregaFotos === 'function') heCarregaFotos();
}
/* ===== painel abaixo do mapa (SMF 3.166, Supervisor 02/11/2026; prévia aprovada): clicou no comboio em viagem ou num ponto de fundeio, aparecem
   os dias em viagem (ou no porto), as ocorrências (resolvidas e em andamento), a previsão de chegada (saída + ciclo da rota, estimada) ou de término
   da manutenção, e a linha do tempo com as ocorrências; a foto da ocorrência abre em tela cheia para apresentar. */
const VG_PAINEL = { oc: {} };
const vgFotoSrc = f => f.src || (typeof HE_FT !== 'undefined' && HE_FT[f.fid]) || '';
const vgFotoImg = (f, cls, at) => { const s = vgFotoSrc(f); return `<img class="${cls}" ${s ? `src="${s}"` : f.fid ? `data-hefid="${esc(f.fid)}" alt="carregando"` : 'alt=""'}${at || ''}>`; };
// linha do tempo de d0 (rótulo a0) até d1 (rótulo a1), com hoje e um ponto por ocorrência
function vgLinhaTempo(key, d0, a0, d1, a1, Oc) {
  const H = isoD(hoje()), fim = d1 && d1 > H ? d1 : H, t0 = +pD(d0), t1 = Math.max(+pD(fim), t0 + 864e5), X = d => Math.max(0, Math.min(100, (+pD(d) - t0) / (t1 - t0) * 100));
  const hj = X(H), dots = Oc.map((x, i) => `<button class="vgt-o ${x.ok ? 'ok' : 'ab'}" style="left:${X(x.d)}%" data-vgoc="${key}|${i}" data-nodrag title="${esc(brD(x.d) + ' · ' + (x.eq || '') + (x.ok ? ' · resolvida' : ' · em andamento'))}"></button>`).join('');
  return `<div class="vgt"><div class="vgt-b"><i class="vgt-f" style="width:${hj}%"></i>${d1 && d1 > H ? `<i class="vgt-p" style="left:${hj}%;width:${100 - hj}%"></i>` : ''}<i class="vgt-h" style="left:${hj}%"></i>${dots}</div>
    <div class="vgt-l"><span><b>${esc(a0)}</b><br>${brD(d0)}</span><span class="vgt-lh" style="left:${hj}%">hoje</span>${d1 ? `<span style="text-align:right"><b>${esc(a1)}</b><br>${brD(d1)}</span>` : ''}</div></div><div class="vgt-d" id="vgtd-${key}"></div>`;
}
// um bloco: título, resumo, ocorrências e linha do tempo
function vgPainelBloco(key, tit, linhas, d0, a0, d1, a1, Oc) {
  VG_PAINEL.oc[key] = Oc; const ab = Oc.filter(x => !x.ok);
  const res = Oc.length ? `<b>${Oc.length} ocorrência${Oc.length > 1 ? 's' : ''}</b> · ${Oc.length - ab.length} resolvida${Oc.length - ab.length === 1 ? '' : 's'} · ${ab.length ? `<b style="color:var(--badt)">${ab.length} em andamento</b> (${esc(ab.map(x => x.eq || 'falha').join('; '))})` : '0 em andamento'}` : 'Nenhuma ocorrência';
  return `<div class="vgp-b"><div class="vgp-t">${tit}</div>${linhas.filter(Boolean).map(l => `<div>${l}</div>`).join('')}<div>${res}</div>${vgLinhaTempo(key, d0, a0, d1, a1, Oc)}</div>`;
}
function vgPainelVia(id) {
  const o = vgOndeDe(id, false), H = isoD(hoje()), r = vgRota(o.rota), dest = r ? r.nome.split('×').pop().trim() : '', d0 = o.saida || H, dv = vgDD(d0, H), prev = o.prev || '';
  const pr = prev ? (d => `<b>Previsão de chegada${dest ? ' em ' + esc(dest) : ''}: ${brD(prev)}</b> · ${d > 0 ? 'faltam ' + d + ' dia' + (d > 1 ? 's' : '') : d === 0 ? 'hoje' : `<b style="color:var(--badt)">passou ${-d} dia${d < -1 ? 's' : ''}</b>`}${o.u && o.u.est ? ' <span class="note">(estimada pela rota: saída + ' + (r ? r.ciclo : 30) + ' dias)</span>' : ''}`)(vgDD(H, prev)) : '<span class="note">Previsão de chegada: rota não informada</span>';
  return vgPainelBloco('v' + id, `Comboio ${esc(o.nome)}${o.balsas && o.balsas.length ? ' · ' + esc(o.balsas.map(vName).join(', ')) : ''}${o.rota ? ' · ' + esc(vgRotaCurta(o.rota)) : ''}`,
    [o.saida ? `<b>Em viagem há ${dv} dia${dv === 1 ? '' : 's'}</b> (saída ${brD(o.saida)})` : '<b>Em viagem</b> <span class="note">(saída não lançada)</span>', pr, o.local ? `<span class="note">Última posição: ${esc(o.local)}${o.at ? ' · ' + vgDH(o.at) : ''}</span>` : ''],
    d0, 'Saída', prev, 'Chegada prevista', vgOcorr(id, d0));
}
/* no porto e no estaleiro (Supervisor, 02/11/2026: “o que está no porto não precisa tratar como comboio… uma lista de empurradores e balsas com
   destaque de pendências”): uma linha por empurrador, as pendências primeiro (mesma conta da Situação da frota, sfMotivos no js/87); clicando na
   linha abre o detalhe com a linha do tempo. Balsas numa segunda lista: as que chegaram com esses empurradores (o SMF não registra onde a balsa
   fica; vem da última viagem de cada uma) e as que estão em reforma ali. */
function vgFixDados(id) {
  const H = isoD(hoje()), o = vgOndeDe(id, false), ref = o.st === 'ref', r = ref ? vgEmReforma(id) || {} : null, dt = ((ref ? r.ini : o.desde) || '').slice(0, 10);
  const d0 = dt || isoD(new Date(Date.now() - 30 * 864e5)), M = vgManLinhas().filter(x => x.vid === id), P = M.filter(x => x.prev).map(x => x.prev).sort();
  return { o, ref, r, dt, d0, M, prev: P[P.length - 1] || '', Oc: vgOcorr(id, d0), dd: dt ? vgDD(dt, H) : null };
}
function vgFixBloco(id, z) {
  const H = isoD(hoje()), { o, ref, dt, d0, M, prev, Oc } = z;
  return vgPainelBloco('f' + id, `${esc(o.nome)} · ${ref ? 'em reforma' : 'no porto'}`,
    [dt ? '' : '<span class="note">Data de chegada não lançada: ocorrências dos últimos 30 dias.</span>',
      M.length ? `Manutenção em andamento: ${M.map(x => esc(x.txt || '') + (x.prev ? ` · <b>término previsto ${brD(x.prev)}</b>` + (x.prev < H ? ` <b style="color:var(--badt)">(${-vgDD(H, x.prev)} d atrasada)</b>` : '') : ' · <span class="note">sem previsão</span>')).join('; ')}` : ''],
    d0, dt ? (ref ? 'Entrada' : 'Chegada') : 'Há 30 dias', prev, 'Término previsto', Oc);
}
function vgPainelFix(k, ids) {
  const H = isoD(hoje()), SD = typeof sfDados === 'function' ? sfDados() : [], cls = { ok: 'p-ok', at: 'p-warn', bad: 'p-bad' };
  const ehBal = id => typeof balsaDe === 'function' && !!balsaDe(id);
  // empurradores
  const E = ids.filter(id => !ehBal(id)).map(id => { const z = vgFixDados(id), x = SD.find(y => y.v.id === id), P = [];
    if (!z.ref && x && typeof sfMotivos === 'function') sfMotivos(x).forEach(m => P.push(m));
    if (z.ref) z.Oc.filter(y => y.ab).forEach(y => P.push(['bad', 'Corretiva aberta: ' + esc(y.eq || '') + (y.om ? ' · OM ' + esc(y.om) : '')]));
    // avaria em aberto (a Crítica ou Alta sem OM já entra pela Situação da frota como “Falha sem OM”)
    z.Oc.filter(y => !y.ok && !y.ab && (z.ref || y.om || !/Crítica|Alta/.test(y.c || ''))).forEach(y => P.push([/Crítica/.test(y.c || '') ? 'bad' : 'at', 'Avaria em aberto: ' + esc(y.eq || '') + (y.om ? ' · OM ' + esc(y.om) : ' · sem OM')]));
    const R = vgReqs(id).filter(gsAberta); if (R.length) { const mx = Math.max(...R.map(gsDias)); P.push([mx > 30 ? 'bad' : mx > 15 ? 'at' : 'mut', `${R.length} SC/RM pendente${R.length > 1 ? 's' : ''} (mais antiga há ${mx} d)`]); }
    z.M.filter(m => !m.prev).forEach(m => P.push(['at', 'Sem previsão de término: ' + esc(m.txt || '')]));
    const sit = z.ref ? ['p-mut', 'Em reforma', 4] : x ? [cls[SF_SIT[x.sit][0]] || 'p-mut', SF_SIT[x.sit][1], x.sit] : ['p-mut', '—', 0];
    return { id, z, P, sit, peso: (z.ref ? 0 : sit[2] * 100) + P.filter(p => p[0] === 'bad').length * 10 + P.length }; }).sort((a, b) => b.peso - a.peso);
  const prevTx = p => p ? `${brD(p)}${p < H ? ` <b style="color:var(--badt)">(${-vgDD(H, p)} d atrasada)</b>` : ''}` : '<span class="note">—</span>';
  const tE = E.length ? `<div class="tw"><table class="t vgp-tab"><thead><tr><th>Empurrador</th><th>${E.some(e => e.z.ref) ? 'No porto / estaleiro há' : 'No porto há'}</th><th>Situação</th><th>Pendências</th><th>Previsão de término</th></tr></thead><tbody>${E.map(e =>
    `<tr class="vgp-l" data-vgdet="${e.id}"><td class="nowrap"><b>${esc(e.z.o.nome)}</b> <span class="vgp-sx">▸</span></td><td class="nowrap">${e.z.dd != null ? e.z.dd + ' d' : '<span class="note">chegada não lançada</span>'}</td><td><span class="pill ${e.sit[0]}">${esc(e.sit[1])}</span></td>
      <td>${e.P.length ? e.P.map(([c, t]) => `<div class="sf-pm ${c === 'mut' ? '' : c}">${t}</div>`).join('') : '<span class="note">nenhuma</span>'}</td><td class="nowrap">${prevTx(e.z.prev)}</td></tr>
    <tr class="vgp-det" id="vgdet-${e.id}" style="display:none"><td colspan="5">${vgFixBloco(e.id, e.z)}</td></tr>`).join('')}</tbody></table></div>` : '';
  // balsas: em reforma ali + as que chegaram com esses empurradores
  const dono = typeof vgMapaDados === 'function' ? vgMapaDados().dono : {}, emp = new Set(ids);
  const Bs = vgBalsas().filter(b => ids.includes(b.id) || (emp.has(dono[b.id]) && !vgEmReforma(b.id))).map(b => { const e = typeof balEstado === 'function' ? balEstado(b) : { st: 'sem', A: [], venc: [], crit: [] }, P = [];
    if (e.st === 'ref') { const r = vgEmReforma(b.id) || {}; return { b, e, P, ref: r, peso: -1 }; }
    if (e.crit.length) P.push(['bad', `${e.crit.length} ${e.crit.length > 1 ? 'itens' : 'item'} crítico${e.crit.length > 1 ? 's' : ''} vencido${e.crit.length > 1 ? 's' : ''}`]);
    if (e.venc.length > e.crit.length) P.push(['at', `${e.venc.length - e.crit.length} serviço${e.venc.length - e.crit.length > 1 ? 's' : ''} vencido${e.venc.length - e.crit.length > 1 ? 's' : ''}`]);
    e.A.forEach(a => P.push([a.c === 'Crítica' ? 'bad' : a.c === 'Alta' ? 'at' : '', `Falha ${esc((a.c || '').toLowerCase())} em aberto: ${esc(a.sis || a.desc || '')}${a.om ? ' · OM ' + esc(a.om) : ''}`]));
    try { if (balDocaSit(b).st === 'venc') P.push(['bad', 'Docagem vencida']); } catch (er) { }
    return { b, e, P, peso: ({ bloq: 3, rest: 2, sem: 1, lib: 0 }[e.st] || 0) * 100 + P.length }; }).sort((a, b) => b.peso - a.peso);
  const tB = Bs.length ? `<h3 class="vgm-h">Balsas · ${Bs.length}</h3><div class="tw"><table class="t vgp-tab"><thead><tr><th>Balsa</th><th>Chegou com</th><th>Situação</th><th>Pendências</th></tr></thead><tbody>${Bs.map(x => {
    const st = (typeof BAL_ST !== 'undefined' && BAL_ST[x.e.st]) || ['p-mut', x.e.st];
    return `<tr><td class="nowrap"><b>${esc(x.b.nome)}</b></td><td class="nowrap">${x.ref ? `<span class="note">no estaleiro${x.ref.ini ? ' há ' + vgDD(x.ref.ini, H) + ' d' : ''}</span>` : esc(vName(dono[x.b.id]) || '—')}</td><td><span class="pill ${st[0]}">${esc(st[1])}</span></td><td>${x.ref ? `<span class="note">${esc(x.ref.local || '')}${x.ref.obs ? ' · ' + esc(x.ref.obs) : ''}</span>` : x.P.length ? x.P.map(([c, t]) => `<div class="sf-pm ${c}">${t}</div>`).join('') : '<span class="note">nenhuma</span>'}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="note">O SMF não registra onde cada balsa fica: aqui estão as que chegaram com esses empurradores na última viagem de cada uma, e as que estão em reforma neste lugar.</p>` : '';
  const nE = E.length, nB = E.filter(e => !e.z.ref && e.sit[2] >= 2).length, nR = E.filter(e => !e.z.ref && e.sit[2] === 1).length;
  return `<div class="vgp-t" style="font-size:15px">${esc(k)} · ${nE} empurrador${nE === 1 ? '' : 'es'}${nB ? ` · <span style="color:var(--badt)">${nB} bloqueado${nB > 1 ? 's' : ''}</span>` : ''}${nR ? ` · <span style="color:var(--warnt)">${nR} com restrição</span>` : ''}</div>
    <p class="note" style="margin:0 0 4px">Pendências primeiro. Clique na linha para ver as ocorrências e a linha do tempo. Clique na pendência para ir à tela que resolve.</p>${tE}${tB}`;
}
function vgPainelAbrir(tp, a, b) {
  const el = $('#vgPainel'); if (!el) return; VG_PAINEL.oc = {};
  el.innerHTML = `<div class="row" style="margin-bottom:4px"><span class="sp"></span><button class="mbtn sm" data-vgpx data-nodrag>Fechar</button></div>` + (tp === 'via' ? vgPainelVia(a) : vgPainelFix(a, b));
  el.style.display = ''; if (typeof heCarregaFotos === 'function') heCarregaFotos(); try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { }
}
// detalhe da ocorrência clicada na linha do tempo, com as fotos (clique na foto = tela cheia)
function vgOcDetalhe(key, i) {
  const x = (VG_PAINEL.oc[key] || [])[+i], el = $('#vgtd-' + key); if (!x || !el) return;
  el.innerHTML = `<div class="vgt-x"><b>${brD(x.d)}${x.h ? ' ' + esc(x.h) : ''} · ${esc(x.eq || 'Ocorrência')}</b>${x.c ? ' <span class="pill p-mut">' + esc(x.c) + '</span>' : ''} <span class="pill ${x.ok ? 'p-ok' : 'p-bad'}">${x.ok ? 'resolvida' : 'em andamento'}</span>${x.om ? ' · OM ' + esc(x.om) : ''}
    ${x.txt ? `<div>${esc(x.txt)}</div>` : ''}${x.feito ? `<div class="note">Feito: ${esc(x.feito)}</div>` : ''}${x.fotos.length ? `<div class="vgt-fs">${x.fotos.map((f, k) => vgFotoImg(f, 'vgt-ft', ` data-vgfg="${key}|${i}|${k}" data-nodrag`)).join('')}</div>` : '<div class="note">Sem foto.</div>'}</div>`;
  if (typeof heCarregaFotos === 'function') heCarregaFotos();
}
function vgFotoGrande(key, i, k) {
  const L = ((VG_PAINEL.oc[key] || [])[+i] || {}).fotos || []; let n = +k; if (!L.length) return;
  const d = document.createElement('div'); d.className = 'vgt-g'; document.body.appendChild(d);
  const des = () => { d.innerHTML = `${vgFotoImg(L[n], '')}<div class="vgt-gb">${L.length > 1 ? '<button data-g="-1">‹</button>' : ''}<span>${n + 1} de ${L.length} · clique fora ou Esc para fechar</span>${L.length > 1 ? '<button data-g="1">›</button>' : ''}</div>`; if (typeof heCarregaFotos === 'function') heCarregaFotos(); };
  const sai = () => { d.remove(); document.removeEventListener('keydown', kb); }, kb = e => { if (e.key === 'Escape') sai(); else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { n = (n + (e.key === 'ArrowRight' ? 1 : -1) + L.length) % L.length; des(); } };
  d.onclick = e => { const g = e.target.closest('[data-g]'); if (g) { n = (n + +g.dataset.g + L.length) % L.length; des(); } else if (e.target === d) sai(); };
  document.addEventListener('keydown', kb); des();
}
document.addEventListener('click', e => { const t = e.target.closest('[data-vgoc],[data-vgfg],[data-vgpx],[data-vgdet]'); if (!t || VIEW !== 'enxviag') return;
  if (t.dataset.vgdet && e.target.closest('a')) return;   // clique na pendência: vai para a tela que resolve
  e.preventDefault(); e.stopPropagation(); const d = t.dataset;
  if (d.vgdet) { const r = $('#vgdet-' + d.vgdet), ab = r && r.style.display === 'none'; if (r) { r.style.display = ab ? '' : 'none'; t.classList.toggle('on', ab); if (ab && typeof heCarregaFotos === 'function') heCarregaFotos(); } return; }
  if (d.vgpx !== undefined) { const el = $('#vgPainel'); if (el) { el.innerHTML = ''; el.style.display = 'none'; } return; }
  if (d.vgoc) return vgOcDetalhe(...d.vgoc.split('|'));
  if (d.vgfg) return vgFotoGrande(...d.vgfg.split('|')); }, true);
{ const st = document.createElement('style'); st.textContent = '#vgPainel{margin-top:10px;border-top:1px solid #DCE3EC;padding-top:8px}.vgp-b{border:1px solid #DCE3EC;border-radius:8px;padding:10px 12px;margin:8px 0;background:#fff;line-height:1.55}.vgp-t{font-weight:700;color:#16244A;font-size:14px;margin-bottom:2px}'
  + '.vgt{margin:10px 4px 2px}.vgt-b{position:relative;height:8px;border-radius:4px;background:#E3E8EF;margin:10px 0}.vgt-f{position:absolute;left:0;top:0;bottom:0;background:#9DB4D3;border-radius:4px}.vgt-p{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(90deg,#C9D3E0 0 6px,transparent 6px 10px)}.vgt-h{position:absolute;top:-6px;bottom:-6px;width:2px;background:#C5221F;margin-left:-1px}'
  + '.vgt-o{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);cursor:pointer;padding:0}.vgt-b .vgt-o.ok{background:#188038!important}.vgt-b .vgt-o.ab{background:#D93025!important}.vgp-tab .vgp-l{cursor:pointer}.vgp-tab .vgp-l:hover td{background:#F3F6FA}.vgp-tab .vgp-l.on .vgp-sx{display:inline-block;transform:rotate(90deg)}.vgp-sx{color:#8A94A6;font-size:11px}.vgp-det>td{padding:0 6px 8px!important;background:#FAFBFD}.vgp-tab .sf-pm{margin:1px 0}.vgt-o:hover{transform:scale(1.25)}'
  + '.vgt-l{position:relative;display:flex;justify-content:space-between;font-size:11.5px;color:#5F6368;min-height:30px}.vgt-lh{position:absolute;top:0;transform:translateX(-50%);color:#C5221F;font-weight:600}.vgt-x{margin-top:6px;padding:8px 10px;background:#F6F8FB;border-radius:6px}.vgt-fs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}'
  + '.vgt-ft{width:120px;height:90px;object-fit:cover;border-radius:6px;cursor:zoom-in;background:#E8EEF5}.vgt-g{position:fixed;inset:0;z-index:100000;background:rgba(10,15,25,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out}.vgt-g img{max-width:94vw;max-height:86vh;object-fit:contain;border-radius:4px;cursor:default}'
  + '.vgt-gb{display:flex;gap:16px;align-items:center;color:#fff;font:13px system-ui;margin-top:10px}.vgt-gb button{font-size:26px;line-height:1;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:6px;padding:4px 14px;cursor:pointer}'; document.head.appendChild(st); }
// cliques: no quadro e também dentro do balão do mapa (o Leaflet não deixa o clique chegar ao #main)
document.addEventListener('click', e => { const t = e.target.closest('[data-vgficha],[data-vgman]'); if (!t || VIEW !== 'enxviag') return; e.preventDefault(); e.stopPropagation(); const d = t.dataset;
  if (d.vgficha !== undefined) return vgFicha(d.vgficha);
  if (d.vgman !== undefined) return vgManModal(d.vgman || null, d.vgv ? { vid: d.vgv, om: d.vgo, onde: d.vgw, txt: d.vgt, ini: d.vgi } : null); }, true);
{ const st = document.createElement('style'); st.textContent = '.vgm-h{font-size:13.5px;margin:12px 0 4px;color:#16244A}.vgm-t td{vertical-align:top}.vgf-ft{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.vgf-ft figure{margin:0}.vgf-ft img{width:100%;height:110px;object-fit:cover;border-radius:6px;background:#E8EEF5}.vgf-ft figcaption{font-size:11px;color:#5F6368}.vgf-b{margin:6px 0 10px}.vgf-b .t{margin-top:4px}'; document.head.appendChild(st); }
