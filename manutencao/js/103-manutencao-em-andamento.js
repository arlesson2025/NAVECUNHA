'use strict';
/* ===== 1.3 · Manutenção no porto e no estaleiro e ficha do empurrador (SMF 3.164, Supervisor 02/11/2026; prévia aprovada) =====
   Para a reunião com a diretoria: o que está em manutenção no porto e no estaleiro, com início e previsão de término, e as SC/RM de cada empurrador.
   Registro novo: snap tipo 'manut' (vessel, onde porto/estaleiro, local, txt, om, ini, prev, prevH = [[data, previsão, motivo, quem]] quando a previsão
   muda, serv = [{ t, ok, dep }], fotos, fim). Corretiva aberta entra sozinha (sem previsão até alguém abrir o acompanhamento com o mesmo nº de OM);
   empurrador em reforma sem acompanhamento entra no estaleiro pela reforma. SC/RM da 5.1 (snap screq): pendente = gsAberta; depende da manutenção
   quando tem o mesmo nº de OM ou é citada num serviço. Ficha (vgFicha): fotos da semana, manutenções, corretivas abertas, ocorrências da viagem e SC/RM. */
// lista padrão dos serviços de uma reforma no estaleiro (ponto de partida; o Supervisor edita em cada reforma)
const VG_REF_SERV = ['Casco · chapas, solda e medição de espessura', 'Convés e acessórios', 'Tubulação', 'Motores', 'Elétrica', 'Pintura', 'Docagem'];
const vgMans = () =>recs('snap').filter(r => r.tipo === 'manut' && !r.excluido && !r.fim);
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
  // empurradores e balsas em reforma (as balsas entram desde a 3.168, para terem previsão e serviços da reforma)
  S.cfg.frota.concat(vgBalsas()).forEach(v => { const r = vgEmReforma(v.id); if (!r || M.some(m => m.vessel === v.id && m.onde === 'estaleiro')) return;
    L.push({ ref: r, vid: v.id, onde: 'estaleiro', local: r.local, txt: 'Reforma' + (r.obs ? ' · ' + r.obs : ''), ini: r.ini, prev: '', serv: [] }); });
  return L.map(x => Object.assign(x, { deps: vgDeps(x.vid, x.om, x.serv), nome: vName(x.vid), bal: typeof balsaDe === 'function' && !!balsaDe(x.vid) })).sort((a, b) => (a.prev || '9') < (b.prev || '9') ? -1 : 1);
}
function vgManCard() {
  const L = vgManLinhas(), H = isoD(hoje()), ed = can.edit();
  const prevTx = x => { if (!x.prev) return '<span class="pill p-mut">sem previsão</span>'; const d = vgDD(H, x.prev);
    return `${brD(x.prev)} <span class="pill ${d < 0 ? 'p-bad' : d <= 3 ? 'p-warn' : 'p-ok'}">${d < 0 ? (-d) + ' d atrasada' : d === 0 ? 'hoje' : 'faltam ' + d + ' d'}</span>${x.nPrev ? `<div class="note">previsão mudou ${x.nPrev} vez${x.nPrev > 1 ? 'es' : ''}${x.m.prevH[x.nPrev - 1][2] ? ' · ' + esc(x.m.prevH[x.nPrev - 1][2]) : ''}</div>` : ''}`; };
  const depTx = x => x.deps.length ? x.deps.map(r => { const d = gsDias(r); return `${esc(r.tp)} ${esc(r.num)} <span class="pill ${d > 30 ? 'p-bad' : d > 15 ? 'p-warn' : 'p-mut'}">${d} d</span>${vgItens(r) ? ` <span class="note">${vgItens(r)} itens</span>` : ''}`; }).join('<br>') : '<span class="note">—</span>';
  const lug = x => { const o = vgOndeDe(x.vid, false); return x.local || (o.st === 'por' && typeof vgLugar === 'function' ? vgLugar(o.porto) || o.porto : '') || ''; };
  const tab = (onde, tit, cIni, cPrev) => { const R = L.filter(x => x.onde === onde);
    return `<h3 class="vgm-h">${tit} · ${R.length}</h3>${R.length ? `<div class="tw"><table class="t vgm-t"><thead><tr><th>${R.some(x => x.bal) ? 'Embarcação' : 'Empurrador'}</th><th>O que é</th><th>${cIni}</th><th>${cPrev}</th><th>SC/RM pendentes</th><th></th></tr></thead><tbody>
      ${R.map(x => { const nF = x.serv.filter(s => s.ok).length; return `<tr><td>${x.bal ? `<b>${esc(x.nome)}</b> <span class="note">balsa</span>` : `<a href="#" data-vgficha="${x.vid}"><b>${esc(x.nome)}</b></a>`}<div class="note">${esc(lug(x))}</div></td>
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
  const linha = (s, k) => `<div class="g vgm-s" data-em="${esc(s.em || '')}"><label class="f s1" style="align-self:end"><input type="checkbox" class="vgmK"${s.ok ? ' checked' : ''}> feito</label><label class="f s7">Serviço<input class="vgmT" value="${esc(s.t || '')}"></label><label class="f s4">Depende de (SC/RM)<input class="vgmD" value="${esc(s.dep || '')}" placeholder="RM 278557"></label></div>`;
  // reforma no estaleiro começa com a lista padrão de serviços (Supervisor, 02/11/2026), que se edita em cada reforma
  const ehRef = !m && onde === 'estaleiro' && /reforma/i.test(p.txt || '');
  const S0 = m && m.serv && m.serv.length ? m.serv : ehRef ? VG_REF_SERV.map(t => ({ t })) : [{}, {}, {}];
  const op = L0 => L0.map(v => `<option value="${v.id}"${v.id === v0 ? ' selected' : ''}>${esc(v.nome)}</option>`).join('');
  modal(`<h2>${m ? 'Atualizar acompanhamento · ' + esc(vName(m.vessel)) : 'Abrir acompanhamento da manutenção'}</h2>
    <div class="g"><label class="f s3">Empurrador ou balsa<select id="vgmV"${m ? ' disabled' : ''}><optgroup label="Empurradores">${op(S.cfg.frota)}</optgroup>${vgBalsas().length ? `<optgroup label="Balsas">${op(vgBalsas())}</optgroup>` : ''}</select></label>
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
    // em = dia em que o serviço foi marcado feito (marca na linha do tempo da reforma); desmarcado perde a data
    const serv = $$('#vgmSL .vgm-s').map(d => { const ok = d.querySelector('.vgmK').checked; return { t: d.querySelector('.vgmT').value.trim(), ok, dep: d.querySelector('.vgmD').value.trim(), em: ok ? d.dataset.em || isoD(hoje()) : '' }; }).filter(s => s.t);
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
// mk = marcas a mais (reforma): [{ d, cls: 'sv' serviço concluído | 'pv' previsão mudou, tip }]
function vgLinhaTempo(key, d0, a0, d1, a1, Oc, mk) {
  const H = isoD(hoje()), fim = d1 && d1 > H ? d1 : H, t0 = +pD(d0), t1 = Math.max(+pD(fim), t0 + 864e5), X = d => Math.max(0, Math.min(100, (+pD(d) - t0) / (t1 - t0) * 100));
  const hj = X(H), dots = (mk || []).map(x => `<i class="vgt-m ${x.cls}" style="left:${X(x.d)}%" title="${esc(x.tip || '')}"></i>`).join('') + Oc.map((x, i) => `<button class="vgt-o ${x.ok ? 'ok' : 'ab'}" style="left:${X(x.d)}%" data-vgoc="${key}|${i}" data-nodrag title="${esc(brD(x.d) + ' · ' + (x.eq || '') + (x.ok ? ' · resolvida' : ' · em andamento'))}"></button>`).join('');
  return `<div class="vgt"><div class="vgt-b"><i class="vgt-f" style="width:${hj}%"></i>${d1 && d1 > H ? `<i class="vgt-p" style="left:${hj}%;width:${100 - hj}%"></i>` : ''}<i class="vgt-h" style="left:${hj}%"></i><span class="vgt-lh" style="left:${hj}%">hoje</span>${dots}</div>
    <div class="vgt-l"><span><b>${esc(a0)}</b><br>${brD(d0)}</span>${d1 ? `<span style="text-align:right"><b>${esc(a1)}</b><br>${brD(d1)}</span>` : ''}</div></div><div class="vgt-d" id="vgtd-${key}"></div>`;
}
// um bloco: título, resumo, ocorrências e linha do tempo
function vgPainelBloco(key, tit, linhas, d0, a0, d1, a1, Oc, mk, mais) {
  VG_PAINEL.oc[key] = Oc; const ab = Oc.filter(x => !x.ok);
  const res = Oc.length ? `<b>${Oc.length} ocorrência${Oc.length > 1 ? 's' : ''}</b> · ${Oc.length - ab.length} resolvida${Oc.length - ab.length === 1 ? '' : 's'} · ${ab.length ? `<b style="color:var(--badt)">${ab.length} em andamento</b> (${esc(ab.map(x => x.eq || 'falha').join('; '))})` : '0 em andamento'}` : 'Nenhuma ocorrência';
  return `<div class="vgp-b"><div class="vgp-t">${tit}</div>${linhas.filter(Boolean).map(l => `<div>${l}</div>`).join('')}<div>${res}</div>${vgLinhaTempo(key, d0, a0, d1, a1, Oc, mk)}${mais || ''}</div>`;
}
/* ===== reforma no estaleiro (SMF 3.168, Supervisor 02/11/2026; prévia aprovada): quando fica pronta, quanto falta e o que trava. Dados do
   acompanhamento (snap 'manut', onde estaleiro: serviços com feito, data em que foi feito e SC/RM de que depende; previsão e cada mudança dela com o
   motivo; fotos da semana) e da reforma lançada no Histórico dos equipamentos (início, local, fotos). Sem custo (o SMF não registra custo). */
const vgFotoAt = f => typeof f.at === 'number' ? f.at : f.at ? +new Date(f.at) : 0;
function vgRefDados(id) {
  const H = isoD(hoje()), r = vgEmReforma(id) || {}, m = vgMans().find(x => x.vessel === id && x.onde === 'estaleiro') || null, rr = r.id ? S.recs.get(r.id) : null;
  const ini = (m && m.ini) || r.ini || '', prev = (m && m.prev) || '', serv = (m && m.serv) || [], nF = serv.filter(s => s.ok).length;
  const F = [...((m && m.fotos) || []), ...((rr && rr.fotos) || [])].map(f => ({ f, at: vgFotoAt(f) })).sort((a, b) => b.at - a.at);
  const ult = F.length && F[0].at ? Math.max(0, Math.round((Date.now() - F[0].at) / 864e5)) : null, deps = vgDeps(id, m && m.om, serv);
  const A = []; if (!prev) A.push('sem previsão de entrega'); else if (prev < H) A.push(`previsão vencida há ${-vgDD(H, prev)} d`);
  if (!F.length) A.push('nenhuma foto'); else if (ult == null || ult > 14) A.push(ult == null ? 'foto sem data' : `sem foto há ${ult} d`);
  return { id, nome: vName(id), bal: typeof balsaDe === 'function' && !!balsaDe(id), r, m, ini, prev, prevH: (m && m.prevH) || [], serv, nF, F, ult, deps, A, dd: ini ? vgDD(ini, H) : null };
}
function vgRefBloco(z) {
  const H = isoD(hoje()), d0 = z.ini || isoD(new Date(Date.now() - 30 * 864e5)), key = 'r' + z.id;
  const mk = [...z.serv.filter(s => s.ok && s.em).map(s => ({ d: s.em, cls: 'sv', tip: 'Concluído em ' + brD(s.em) + ': ' + s.t })), ...z.prevH.map(p => ({ d: p[0], cls: 'pv', tip: `Previsão mudou em ${brD(p[0])} (era ${brD(p[1])})${p[2] ? ': ' + p[2] : ''}` }))];
  const sv = z.serv.length ? `<h3 class="vgm-h">Serviços · ${z.nF} de ${z.serv.length} feitos</h3><table class="t"><tbody>${z.serv.map(s => `<tr><td>${esc(s.t)}</td><td class="nowrap"><span class="pill ${s.ok ? 'p-ok' : 'p-warn'}">${s.ok ? 'feito' + (s.em ? ' ' + brD(s.em) : '') : 'pendente'}</span></td><td class="note">${esc(s.dep || '')}</td></tr>`).join('')}</tbody></table>` : '<p class="note">Nenhum serviço lançado: use “Pôr previsão” para lançar a lista.</p>';
  const ph = z.prevH.length ? `<h3 class="vgm-h">A previsão mudou ${z.prevH.length} vez${z.prevH.length > 1 ? 'es' : ''}</h3>${z.prevH.map(p => `<div class="note">${brD(p[0])}: era ${brD(p[1])}${p[2] ? ' · ' + esc(p[2]) : ''}${p[3] ? ' · ' + esc(p[3]) : ''}</div>`).join('')}` : '';
  // fotos da evolução por semana (segunda-feira), a mais nova primeiro; clique = tela cheia
  VG_PAINEL.oc['g' + z.id] = [{ fotos: z.F.map(x => x.f) }]; const W = {};
  z.F.forEach((x, k) => { const d = x.at ? new Date(x.at) : null, s = d ? isoD(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7)) : ''; (W[s] = W[s] || []).push(k); });
  const ft = z.F.length ? `<h3 class="vgm-h">Fotos da evolução · ${z.F.length}</h3>${Object.keys(W).map(s => `<div class="note" style="margin-top:4px">${s ? 'Semana de ' + brD(s) : 'Sem data'}</div><div class="vgt-fs">${W[s].map(k => vgFotoImg(z.F[k].f, 'vgt-ft', ` data-vgfg="g${z.id}|0|${k}" data-nodrag`)).join('')}</div>`).join('')}` : '<p class="note">Nenhuma foto da reforma: cada semana, uma foto pelo “Pôr previsão” / “Atualizar”.</p>';
  const bt = can.edit() ? (z.m ? `<button class="mbtn sm" data-vgman="${z.m.id}" data-nodrag>Atualizar serviços, previsão e fotos</button>` : `<button class="mbtn sm" data-vgman="" data-vgv="${z.id}" data-vgw="estaleiro" data-vgt="${esc('Reforma' + (z.r.obs ? ' · ' + z.r.obs : ''))}" data-vgi="${z.ini || ''}" data-nodrag>Pôr previsão e serviços</button>`) : '';
  return vgPainelBloco(key, `${esc(z.nome)} · reforma${z.r.local ? ' · ' + esc(z.r.local) : ''}`, [z.r.obs ? `<span class="note">${esc(z.r.obs)}</span>` : '', bt],
    d0, z.ini ? 'Entrada' : 'Há 30 dias', z.prev, 'Entrega prevista', vgOcorr(z.id, d0), mk, sv + ph + ft);
}
function vgRefTabela(ids) {
  const H = isoD(hoje()), Z = ids.map(vgRefDados).sort((a, b) => (b.A.length - a.A.length) || ((a.prev || '9') < (b.prev || '9') ? -1 : 1));
  return `<h3 class="vgm-h">Em reforma · ${Z.length}</h3><div class="tw"><table class="t vgp-tab"><thead><tr><th>Embarcação</th><th>No estaleiro há</th><th>Previsão de entrega</th><th>Andamento</th><th>Última foto</th></tr></thead><tbody>${Z.map(z => {
    const pc = z.serv.length ? Math.round(z.nF / z.serv.length * 100) : null;
    const pv = z.prev ? `${brD(z.prev)}${z.prev < H ? ` <span class="pill p-bad">${-vgDD(H, z.prev)} d atrasada</span>` : ` <span class="pill p-ok">faltam ${vgDD(H, z.prev)} d</span>`}${z.prevH.length ? `<div class="note">mudou ${z.prevH.length} vez${z.prevH.length > 1 ? 'es' : ''}</div>` : ''}` : '<span class="pill p-bad">sem previsão</span>';
    const an = pc == null ? '<span class="note">serviços não lançados</span>' : `<div class="vgp-an"><i style="width:${pc}%"></i></div><span class="note">${z.nF} de ${z.serv.length} serviços</span>`;
    const fo = !z.F.length ? '<span class="pill p-bad">nunca</span>' : z.ult == null ? '<span class="note">sem data</span>' : `<span class="pill ${z.ult > 14 ? 'p-bad' : z.ult > 7 ? 'p-warn' : 'p-ok'}">há ${z.ult} d</span>`;
    return `<tr class="vgp-l" data-vgdet="${z.id}"><td class="nowrap"><b>${esc(z.nome)}</b>${z.bal ? ' <span class="note">balsa</span>' : ''} <span class="vgp-sx">▸</span></td><td class="nowrap">${z.dd != null ? z.dd + ' d' : '<span class="note">início não lançado</span>'}</td><td>${pv}</td><td style="min-width:130px">${an}</td><td class="nowrap">${fo}</td></tr>
      <tr class="vgp-det" id="vgdet-${z.id}" style="display:none"><td colspan="5">${vgRefBloco(z)}</td></tr>`; }).join('')}</tbody></table></div>`;
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
  const ehBal = id => typeof balsaDe === 'function' && !!balsaDe(id), emRef = id => ehBal(id) ? !!vgEmReforma(id) : vgOndeDe(id, false).st === 'ref', IR = ids.filter(emRef);
  // empurradores (os em reforma vão para a tabela da reforma)
  const E = ids.filter(id => !ehBal(id) && !emRef(id)).map(id => { const z = vgFixDados(id), x = SD.find(y => y.v.id === id), P = [];
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
  const Bs = vgBalsas().filter(b => emp.has(dono[b.id]) && !vgEmReforma(b.id)).map(b => { const e = typeof balEstado === 'function' ? balEstado(b) : { st: 'sem', A: [], venc: [], crit: [] }, P = [];
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
  const nE = E.length, nB = E.filter(e => e.sit[2] >= 2).length, nR = E.filter(e => e.sit[2] === 1).length;
  const tR = IR.length ? vgRefTabela(IR) + '<p class="note">Clique na linha para ver os serviços, a linha do tempo (quadrado verde = serviço concluído, losango laranja = previsão mudou), o histórico da previsão e as fotos da evolução por semana.</p>' : '';
  VG_PAINEL.pf = { k, E, Bs, IR };
  return `<div class="vgp-t" style="font-size:15px">${esc(k)}${nE ? ` · ${nE} empurrador${nE === 1 ? '' : 'es'}` : ''}${nB ? ` · <span style="color:var(--badt)">${nB} impedido${nB > 1 ? 's' : ''} de operar</span>` : ''}${nR ? ` · <span style="color:var(--warnt)">${nR} com restrição</span>` : ''}${IR.length ? ` · ${IR.length} em reforma` : ''}</div>
    ${nE ? '<p class="note" style="margin:0 0 4px">Pendências primeiro. Clique na linha para ver as ocorrências e a linha do tempo. Clique na pendência para ir à tela que resolve.</p>' : ''}${tR}${tE}${tB}`;
}
/* ===== painel da diretoria abaixo do mapa (SMF 3.170, Supervisor 02/11/2026: “algo que fique embaixo do mapa mesmo, com destaques grandes onde for
   preciso para apresentar… informações técnicas para a diretoria”): quatro visões, Manaus (porto da Navecunha e Boia 2), Porto Velho (filial), Estaleiro e
   Em viagem, cada uma com a faixa de números, a conclusão em uma frase e um cartão por embarcação que precisa de atenção; termos da NP 055. A tabela de
   trabalho continua em “Detalhes técnicos”. Horímetro sem leitura e chegada não registrada vão para o rodapé (dados a atualizar). */
const vgTxt = h => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const VGD_C = { ok: '#137333', at: '#B06000', bad: '#C5221F', nv: '#16244A', mut: '#5B6B80' };
const VG_GRP = [['man', 'Manaus · porto e Boia 2'], ['pvh', 'Porto Velho · filial'], ['est', 'Estaleiro'], ['via', 'Em viagem']];
const vgGrupoDe = k => /eram|estaleiro/i.test(k) ? 'est' : /porto velho/i.test(k) ? 'pvh' : /boia|manaus|navecunha|cimento/i.test(k) ? 'man' : 'p:' + k;
function vgGrupos() {
  const D = vgMapaDados(), G = { man: [], pvh: [], est: [], via: [] }, nomes = {};
  Object.entries(D.P).forEach(([k, L]) => { const g = vgGrupoDe(k); (G[g] = G[g] || []).push(...L.map(o => o.id)); if (g.startsWith('p:')) nomes[g] = k; });
  Object.values(D.F).forEach(L => G.est.push(...L.map(o => o.id)));
  G.via = S.cfg.frota.filter(v => { try { return vgOndeDe(v.id, false).st === 'via'; } catch (e) { return false; } }).map(v => v.id);
  return { G, nomes };
}
const vgdK = (v, l, sub, cor) => `<div class="vgd-k"><b${cor ? ` style="color:${cor}"` : ''}>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
const vgdTec = t => vgTxt(t).replace(/^Serviços vencidos:/, 'Preventivas vencidas por sistema:');
const vgdPl = (n, s, p) => n + ' ' + (n === 1 ? s : p);
// ---------- porto (Manaus, Porto Velho e outros portos) ----------
function vgDirPorto(tit, ids) {
  const det = vgPainelFix(tit, ids), A = VG_PAINEL.pf || { E: [], Bs: [] }, H = isoD(hoje());
  // corretiva aberta pela classe: Crítica e Alta entram como restrição; Média e Baixa só como nota (não impedem a operação), sem repetir
  const L = A.E.map(e => { const reg = !!(e.z.dt && !e.z.o.est), ab = e.z.Oc.filter(y => y.ab), cor = ab.filter(y => !/Crítica|Alta/.test(y.c || ''));
    const P = e.P.filter(p => !/Horímetro|corretivas? abertas?$|^Sem previsão de término: Corretiva (Média|Baixa)/.test(vgTxt(p[1])))
      .concat(ab.filter(y => /Crítica|Alta/.test(y.c || '')).map(y => ['bad', `Corretiva aberta (${y.c}): ${y.eq || ''}${y.om ? ' · OM ' + y.om : ''}`]));
    return { e, reg, P, cor, hor: e.P.some(p => /Horímetro/.test(p[1])), n: e.sit[2] }; });
  if (!L.length) return `<p class="vgd-c">Nenhum empurrador em porto${A.Bs.length ? '' : ''}.</p><details class="vgd-det"><summary>Detalhes técnicos</summary>${det}</details>`;
  const im = L.filter(x => x.n >= 2), rs = L.filter(x => x.n === 1), lb = L.filter(x => x.n === 0), R = L.filter(x => x.reg);
  // faixa de números (Supervisor, 02/11/2026: “X empurradores · X liberados · X em manutenção…”): manutenção = corretiva aberta ou serviço lançado em andamento
  const mn = L.filter(x => x.e.z.M.length);
  const ks = vgdK(L.length, 'Empurradores') + vgdK(lb.length + rs.length, 'Liberados', rs.length ? `${rs.length} com restrição` : 'sem restrição', VGD_C.ok)
    + vgdK(mn.length, 'Em manutenção', mn.length ? mn.map(x => esc(x.e.z.o.nome)).join(' · ') : 'nenhum', mn.length ? VGD_C.at : VGD_C.ok)
    + vgdK(im.length, 'Impedidos de operar', im.length ? im.map(x => esc(x.e.z.o.nome)).join(' · ') : 'nenhum', im.length ? VGD_C.bad : VGD_C.ok);
  const pri = x => vgdTec((x.P.find(p => p[0] === 'bad') || x.P[0] || [])[1]);
  const conc = im.length ? `${lb.length + rs.length} de ${L.length} empurradores liberados à operação. ${vgdPl(im.length, 'impedido', 'impedidos')} de operar: ${im.map(x => `<b>${esc(x.e.z.o.nome)}</b> (${esc(pri(x))})`).join('; ')}.`
    : `Todos os ${L.length} empurradores em porto estão liberados à operação${rs.length ? `, ${rs.length} com restrição` : ''}.`;
  const card = x => { const c = x.n >= 2 ? VGD_C.bad : VGD_C.at, P = x.P.slice(0, 4);
    return `<div class="vgd-cd" style="border-left-color:${c}"><div class="vgd-ct"><b>${esc(x.e.z.o.nome)}</b><span style="color:${c}">${esc(x.e.sit[1])}</span></div>
      <div class="vgd-cl">${x.reg ? `Permanência em porto: <b>${x.e.z.dd} dias</b>` : '<span class="vgd-m">Chegada não registrada</span>'}</div>
      ${P.length ? `<div class="vgd-cr"><small>Restrições à operação</small>${P.map(p => `<div style="border-color:${p[0] === 'bad' ? VGD_C.bad : p[0] === 'at' ? VGD_C.at : '#C9D3DF'}">${esc(vgdTec(p[1]))}</div>`).join('')}${x.P.length > 4 ? `<div class="vgd-m">e mais ${x.P.length - 4}</div>` : ''}</div>` : ''}
      ${x.cor.length ? `<div class="vgd-m">Corretiva aberta (${esc(x.cor.map(c0 => c0.c || '').join(', '))}): ${esc(x.cor.map(c0 => c0.eq || '').join('; '))} · não impede a operação</div>` : ''}
      <div class="vgd-cp">Previsão de liberação: ${x.e.z.prev ? `<b>${brD(x.e.z.prev)}</b>${x.e.z.prev < H ? ` <b style="color:${VGD_C.bad}">(${-vgDD(H, x.e.z.prev)} d de atraso)</b>` : ''}` : x.n >= 2 ? `<b style="color:${VGD_C.bad}">sem previsão</b>` : '<span class="vgd-m">não se aplica</span>'}</div></div>`; };
  const nBi = A.Bs.filter(x => x.e.st === 'bloq').length, nBr = A.Bs.filter(x => x.e.st === 'rest').length, nBs = A.Bs.filter(x => x.e.st === 'sem').length;
  const dq = [L.filter(x => x.hor).length ? `horímetro do MCP sem leitura em ${vgdPl(L.filter(x => x.hor).length, 'empurrador', 'empurradores')}` : '', L.length - R.length ? `chegada não registrada em ${L.length - R.length}` : ''].filter(Boolean);
  return `<div class="vgd-ks">${ks}</div><p class="vgd-c">${conc}</p>
    ${im.length || rs.length ? `<div class="vgd-cs">${im.concat(rs).map(card).join('')}</div>` : ''}
    ${lb.length ? `<p class="vgd-lb"><b style="color:${VGD_C.ok}">Liberados à operação sem restrição:</b> ${lb.map(x => esc(x.e.z.o.nome)).join(' · ')}</p>` : ''}
    ${A.Bs.length ? `<p class="vgd-lb"><b>Balsas em porto:</b> ${A.Bs.length} · impedidas de operar <b style="color:${nBi ? VGD_C.bad : VGD_C.ok}">${nBi}</b> · liberadas com restrição ${nBr}${nBs ? ` · sem plano preventivo lançado ${nBs}` : ''} <span class="vgd-m">(as que chegaram com esses empurradores)</span></p>` : ''}
    ${dq.length ? `<p class="vgd-m">Dados a atualizar: ${dq.join(' · ')}.</p>` : ''}
    <details class="vgd-det"><summary>Detalhes técnicos (tabela de trabalho)</summary>${det}</details>`;
}
// ---------- estaleiro ----------
function vgDirEst(ids) {
  const H = isoD(hoje()), Z = ids.map(vgRefDados).sort((a, b) => (a.prev || '9') < (b.prev || '9') ? -1 : 1), det = vgPainelFix('Estaleiro', ids);
  if (!Z.length) return '<p class="vgd-c">Nenhuma embarcação em reforma no estaleiro.</p>';
  const cS = Z.filter(z => z.serv.length), tS = cS.reduce((s, z) => s + z.serv.length, 0), fS = cS.reduce((s, z) => s + z.nF, 0), sp = Z.filter(z => !z.prev), at = Z.filter(z => z.prev && z.prev < H);
  const p30 = Z.filter(z => z.prev && z.prev >= H && vgDD(H, z.prev) <= 30), rp = Z.reduce((s, z) => s + z.prevH.length, 0);
  const ks = vgdK(Z.length, 'Em reforma', Z.map(z => esc(z.nome)).join(' · ')) + vgdK(tS ? Math.round(fS / tS * 100) + '%' : '—', 'Avanço físico', tS ? `${fS} de ${tS} serviços concluídos` : 'serviços não lançados', tS ? VGD_C.nv : VGD_C.mut)
    + vgdK(p30.length, 'Entregas previstas em 30 dias', p30.length ? p30.map(z => esc(z.nome) + ' ' + brD(z.prev)).join(' · ') : 'nenhuma') + vgdK(sp.length + at.length, 'Sem previsão ou com atraso', [sp.length ? sp.length + ' sem previsão' : '', at.length ? at.length + ' com atraso' : ''].filter(Boolean).join(' · ') || 'todas no prazo', sp.length + at.length ? VGD_C.bad : VGD_C.ok);
  const px = Z.find(z => z.prev && z.prev >= H);
  const conc = `${vgdPl(Z.length, 'embarcação', 'embarcações')} em reforma.${px ? ` Próxima entrega prevista: <b>${esc(px.nome)}</b> em <b>${brD(px.prev)}</b>${px.serv.length ? ` (avanço físico ${Math.round(px.nF / px.serv.length * 100)}%)` : ''}.` : ''}${sp.length ? ` Sem previsão de entrega: <b>${sp.map(z => esc(z.nome)).join(', ')}</b>.` : ''}${at.length ? ` Entrega atrasada: <b>${at.map(z => esc(z.nome) + ' (' + -vgDD(H, z.prev) + ' d)').join(', ')}</b>.` : ''}${rp ? ` ${vgdPl(rp, 'reprogramação', 'reprogramações')} da entrega registradas.` : ''}`;
  const card = z => { const pc = z.serv.length ? Math.round(z.nF / z.serv.length * 100) : null, key = 'd' + z.id, c = !z.prev || z.prev < H ? VGD_C.bad : VGD_C.nv;
    VG_PAINEL.oc['g' + z.id] = [{ fotos: z.F.map(x => x.f) }];
    const mk = [...z.serv.filter(s => s.ok && s.em).map(s => ({ d: s.em, cls: 'sv', tip: 'Concluído em ' + brD(s.em) + ': ' + s.t })), ...z.prevH.map(p => ({ d: p[0], cls: 'pv', tip: `Reprogramação em ${brD(p[0])} (era ${brD(p[1])})${p[2] ? ': ' + p[2] : ''}` }))];
    VG_PAINEL.oc[key] = vgOcorr(z.id, z.ini || H);
    return `<div class="vgd-cd vgd-est" style="border-left-color:${c}"><div class="vgd-ef">${z.F.length ? vgFotoImg(z.F[0].f, 'vgd-ft', ` data-vgfg="g${z.id}|0|0" data-nodrag`) + `<small>Último registro fotográfico: ${z.ult == null ? 'sem data' : z.ult === 0 ? 'hoje' : 'há ' + z.ult + ' d'} · ${z.F.length} foto(s)</small>` : '<div class="vgd-sf">Sem registro fotográfico</div>'}</div>
      <div class="vgd-eb"><div class="vgd-ct"><b>${esc(z.nome)}</b><span>${z.bal ? 'balsa' : 'empurrador'} · ${esc(z.r.local || 'estaleiro')}</span></div>
      <div class="vgd-cl">Tempo de estaleiro: <b>${z.dd != null ? z.dd + ' dias' : 'início não lançado'}</b>${z.ini ? ` (entrada ${brD(z.ini)})` : ''}</div>
      <div class="vgd-cp">Previsão de entrega: ${z.prev ? `<b>${brD(z.prev)}</b> ${z.prev < H ? `<b style="color:${VGD_C.bad}">${-vgDD(H, z.prev)} d de atraso</b>` : `<span class="vgd-m">faltam ${vgDD(H, z.prev)} d</span>`}` : `<b style="color:${VGD_C.bad}">sem previsão</b>`}${z.prevH.length ? ` <span class="vgd-m">· ${vgdPl(z.prevH.length, 'reprogramação', 'reprogramações')}</span>` : ''}</div>
      <div class="vgd-av"><div><i style="width:${pc || 0}%"></i></div><span>${pc == null ? 'Avanço físico: serviços não lançados' : `Avanço físico <b>${pc}%</b> · ${z.nF} de ${z.serv.length} serviços`}</span></div>
      
      ${vgLinhaTempo(key, z.ini || isoD(new Date(Date.now() - 30 * 864e5)), 'Entrada', z.prev, 'Entrega prevista', VG_PAINEL.oc[key], mk)}</div></div>`; };
  return `<div class="vgd-ks">${ks}</div><p class="vgd-c">${conc}</p><div class="vgd-cs vgd-cs1">${Z.map(card).join('')}</div>
    <p class="vgd-m">Linha do tempo: quadrado verde = serviço concluído · losango laranja = reprogramação da entrega · ponto = ocorrência (clique para ver). Clique na foto para ampliar.</p>
    <details class="vgd-det"><summary>Detalhes técnicos (tabela de trabalho)</summary>${det}</details>`;
}
// ---------- em viagem ----------
// um comboio em viagem: dias, previsão, ocorrências (vid = balsa do comboio: as ocorrências da balsa)
function vgViaX(id, vid) {
  const H = isoD(hoje()), o = vgOndeDe(id, false), r = vgRota(o.rota), d0 = o.saida || H, Oc = vgOcorr(vid || id, d0);
  return { id, vid, o, r, d0, Oc, ab: Oc.filter(x => !x.ok), dest: r ? r.nome.split('×').pop().trim() : '', par: o.parD > VG_PARADO_D };
}
function vgViaCard(x, key, sel) {
  const H = isoD(hoje()), o = x.o, dv = vgDD(x.d0, H), c = x.ab.length || x.par ? VGD_C.bad : VGD_C.nv; VG_PAINEL.oc[key] = x.Oc;
  const b = x.vid && typeof balsaDe === 'function' ? balsaDe(x.vid) : null, st = b && typeof balEstado === 'function' && typeof BAL_ST !== 'undefined' ? BAL_ST[balEstado(b).st] : null;
  const tit = b ? `<b>Balsa ${esc(b.nome)}</b><span>comboio ${esc(o.nome)}</span>` : `<b>Comboio ${esc(o.nome)}</b><span>${o.rota ? esc(vgRotaCurta(o.rota)) : 'rota não informada'}</span>`;
  const sub = b ? (st ? `<span class="pill ${st[0]}">${esc(st[1])}</span>` : '') + (o.rota ? ` <span class="vgd-m">${esc(vgRotaCurta(o.rota))}</span>` : '') : o.balsas && o.balsas.length ? esc(o.balsas.map(vName).join(' · ')) : '';
  return `<div class="vgd-cd${x.id === sel ? ' vgd-sel' : ''}" style="border-left-color:${c}"><div class="vgd-ct">${tit}</div>
      ${sub ? `<div class="vgd-cl">${sub}</div>` : ''}
      <div class="vgd-cl">${o.saida ? `Em viagem há <b>${dv} dias</b> (saída ${brD(o.saida)})` : '<span class="vgd-m">Saída não registrada</span>'}${x.par ? ` · <b style="color:${VGD_C.bad}">parado há ${o.parD} dias</b>` : ''}</div>
      <div class="vgd-cp">Chegada prevista${x.dest ? ' em ' + esc(x.dest) : ''}: ${o.prev ? `<b>${brD(o.prev)}</b> ${vgDD(H, o.prev) >= 0 ? `<span class="vgd-m">faltam ${vgDD(H, o.prev)} d · estimada pela rota</span>` : `<b style="color:${VGD_C.bad}">passou ${-vgDD(H, o.prev)} d</b>`}` : '<span class="vgd-m">rota não informada</span>'}</div>
      <div class="vgd-cl">${x.Oc.length ? `${vgdPl(x.Oc.length, 'ocorrência', 'ocorrências')} · ${x.Oc.length - x.ab.length} resolvida(s) · ${x.ab.length ? `<b style="color:${VGD_C.bad}">${x.ab.length} em andamento</b> (${esc(x.ab.map(a => a.eq || 'falha').join('; '))})` : '0 em andamento'}` : `Nenhuma ocorrência ${b ? 'da balsa ' : ''}na viagem`}</div>
      ${o.local && !b ? `<div class="vgd-m">Última posição: ${esc(o.local)}${o.at ? ' · ' + vgDH(o.at) : ''}</div>` : ''}
      ${o.saida ? vgLinhaTempo(key, x.d0, 'Saída', o.prev, 'Chegada prevista', x.Oc) : ''}</div>`;
}
// cartão grande no meio da tela ao clicar no comboio (ou numa balsa do desenho), para apresentar (Supervisor, 02/11/2026: “grande, visível para a
// apresentação, com linha do tempo, fotos”): a ocorrência mais recente já aberta com as fotos; fecha no ×, clicando fora ou no Esc
// o mesmo cartão para quem está parado (porto, boia, estaleiro): situação, há quantos dias, término ou entrega prevista, ocorrências e linha do tempo
function vgFixCard(vid, key) {
  const H = isoD(hoje()), b = typeof balsaDe === 'function' ? balsaDe(vid) : null, ref = b ? !!vgEmReforma(vid) : vgOndeDe(vid, false).st === 'ref';
  let nome, onde, dt, prev, st, mais = '';
  if (ref) { const z = vgRefDados(vid); nome = z.nome; dt = z.ini; prev = z.prev; onde = 'em reforma' + (z.r && z.r.local ? ' · ' + z.r.local : ' no estaleiro');
    if (z.serv.length) mais = `Serviços: <b>${z.nF} de ${z.serv.length}</b> feitos (${Math.round(z.nF / z.serv.length * 100)}%)`; }
  else if (b) { const dono = vgMapaDados().dono || {}; nome = b.nome; dt = ''; prev = ''; onde = dono[vid] ? 'chegou com o ' + vName(dono[vid]) : 'no porto'; }
  else { const z = vgFixDados(vid); nome = z.o.nome; dt = z.dt; prev = z.prev; onde = 'no porto' + (z.o.porto ? ' · ' + ((typeof vgLugar === 'function' && vgLugar(z.o.porto)) || z.o.porto) : '');
    if (z.M.length) mais = 'Manutenção em andamento: ' + z.M.map(m => esc(m.txt || '')).join('; '); }
  if (b) { const e = typeof balEstado === 'function' && typeof BAL_ST !== 'undefined' ? BAL_ST[balEstado(b).st] : null; if (e) st = e; }
  else { const x = (typeof sfDados === 'function' ? sfDados() : []).find(y => y.v.id === vid); if (ref) st = ['p-mut', 'Em reforma']; else if (x && typeof SF_SIT !== 'undefined') st = [{ ok: 'p-ok', at: 'p-warn', bad: 'p-bad' }[SF_SIT[x.sit][0]] || 'p-mut', SF_SIT[x.sit][1]]; }
  const d0 = dt || isoD(new Date(Date.now() - 30 * 864e5)), Oc = vgOcorr(vid, d0), ab = Oc.filter(x => !x.ok); VG_PAINEL.oc[key] = Oc;
  const c = ab.length || (prev && prev < H) ? VGD_C.bad : VGD_C.nv, tp = ref ? 'Entrega prevista' : 'Término previsto';
  return `<div class="vgd-cd" style="border-left-color:${c}"><div class="vgd-ct"><b>${b ? 'Balsa' : 'Empurrador'} ${esc(nome)}</b><span>${esc(onde)}</span></div>
      ${st ? `<div class="vgd-cl"><span class="pill ${st[0]}">${esc(st[1])}</span></div>` : ''}
      <div class="vgd-cl">${dt ? `${ref ? 'No estaleiro' : 'No porto'} há <b>${vgDD(dt, H)} dias</b> (${ref ? 'entrada' : 'chegada'} ${brD(dt)})` : `<span class="vgd-m">${ref ? 'Entrada' : 'Chegada'} não registrada · ocorrências dos últimos 30 dias</span>`}</div>
      ${prev ? `<div class="vgd-cp">${tp}: <b>${brD(prev)}</b> ${prev < H ? `<b style="color:${VGD_C.bad}">${-vgDD(H, prev)} d de atraso</b>` : `<span class="vgd-m">faltam ${vgDD(H, prev)} d</span>`}</div>` : ref || mais ? `<div class="vgd-cp"><span class="vgd-m">${tp}: não informado</span></div>` : ''}
      ${mais ? `<div class="vgd-cl">${mais}</div>` : ''}
      <div class="vgd-cl">${Oc.length ? `${vgdPl(Oc.length, 'ocorrência', 'ocorrências')} · ${Oc.length - ab.length} resolvida(s) · ${ab.length ? `<b style="color:${VGD_C.bad}">${ab.length} em andamento</b> (${esc(ab.map(a => a.eq || 'falha').join('; '))})` : '0 em andamento'}` : 'Nenhuma ocorrência no período'}</div>
      ${vgLinhaTempo(key, d0, dt ? (ref ? 'Entrada' : 'Chegada') : 'Há 30 dias', prev, tp, Oc)}</div>`;
}
// em tela cheia (botão ⛶ do quadro do mapa) só aparece o que está dentro do quadro: o cartão e a foto ampliada entram nele
const vgRaiz = () => document.fullscreenElement || document.body;
function vgCartaoGrande(id, vid, rod) {
  document.querySelectorAll('.vgd-ov').forEach(x => x.remove());
  const key = 'p' + (vid || id), ov = document.createElement('div'); ov.className = 'vgd-ov';
  try {
    ov.innerHTML = `<div class="vgd-ovc"><button class="mbtn sm vgd-ovx">Fechar ×</button>${!(typeof balsaDe === 'function' && balsaDe(id)) && vgOndeDe(id, false).st === 'via' ? vgViaCard(vgViaX(id, vid), key) : vgFixCard(vid || id, key)}
      <p class="vgd-m" style="margin:10px 0 0;font-size:14px">Clique no ponto da linha do tempo para ver a ocorrência e as fotos · clique na foto para ampliar${rod ? ' · ' + rod : ''}</p></div>`;
  } catch (e) { console.error(e); toast('Não consegui abrir o cartão: ' + e.message); return; }
  vgRaiz().appendChild(ov);
  const sai = () => { ov.remove(); document.removeEventListener('keydown', kb); }, kb = e => { if (e.key === 'Escape' && !document.querySelector('.vgt-g')) sai(); };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.vgd-ovx')) sai(); });
  ov.addEventListener('pointerdown', e => { if (e.target.closest('[data-vgficha]')) setTimeout(sai, 0); });
  document.addEventListener('keydown', kb);
  if ((VG_PAINEL.oc[key] || []).length) vgOcDetalhe(key, 0);
  if (typeof heCarregaFotos === 'function') heCarregaFotos();
}
function vgDirVia(ids, sel) {
  const H = isoD(hoje());
  const L = ids.map(id => vgViaX(id))
    .sort((a, b) => (b.id === sel) - (a.id === sel) || b.ab.length - a.ab.length || ((a.o.prev || '9') < (b.o.prev || '9') ? -1 : 1));
  if (!L.length) return '<p class="vgd-c">Nenhum comboio em viagem.</p>';
  const nAb = L.reduce((s, x) => s + x.ab.length, 0), par = L.filter(x => x.par), pv = L.filter(x => x.o.prev).sort((a, b) => a.o.prev < b.o.prev ? -1 : 1)[0];
  const ks = vgdK(L.length, 'Comboios em viagem', L.reduce((s, x) => s + (x.o.balsas || []).length, 0) + ' balsas em comboio') + vgdK(nAb, 'Ocorrências em andamento', nAb ? L.filter(x => x.ab.length).map(x => esc(x.o.nome)).join(' · ') : 'nenhuma', nAb ? VGD_C.bad : VGD_C.ok)
    + vgdK(par.length, `Parados há mais de ${VG_PARADO_D} dias`, par.length ? par.map(x => esc(x.o.nome)).join(' · ') : 'nenhum', par.length ? VGD_C.bad : VGD_C.ok) + vgdK(pv ? brD(pv.o.prev) : '—', 'Próxima chegada prevista', pv ? esc(pv.o.nome) + (pv.dest ? ' em ' + esc(pv.dest) : '') + ' · estimada pela rota' : 'rotas não informadas');
  const conc = `${vgdPl(L.length, 'comboio', 'comboios')} em viagem. ${nAb ? `${vgdPl(nAb, 'ocorrência', 'ocorrências')} em andamento: ${L.filter(x => x.ab.length).map(x => `<b>${esc(x.o.nome)}</b> (${esc(x.ab.map(a => a.eq || 'falha').join('; '))})`).join(', ')}.` : 'Nenhuma ocorrência em andamento.'}${par.length ? ` Parado há mais de ${VG_PARADO_D} dias: <b>${par.map(x => esc(x.o.nome)).join(', ')}</b>.` : ''}`;
  return `<div class="vgd-ks">${ks}</div><p class="vgd-c">${conc}</p><div class="vgd-cs">${L.map(x => vgViaCard(x, 'w' + x.id, sel)).join('')}</div>
    <p class="vgd-m">Chegada prevista = saída + duração da rota (estimada). Clique no ponto da linha do tempo para ver a ocorrência e as fotos.</p>`;
}
// ---------- comboios programados e confirmados (Supervisor, 02/11/2026) ----------
// lançamento snap tipo 'prog': empurrador, balsas, rota, saída prevista, situação (prog = programado · conf = confirmado) e observação.
// Sai da lista quando o empurrador sai de viagem (saída a partir de 3 dias antes da prevista) ou quando a programação é cancelada.
const vgProgs = () => recs('snap').filter(r => r.tipo === 'prog' && !r.excluido && !r.fim).filter(r => { try { const o = vgOndeDe(r.vessel, false);
  return !(o.st === 'via' && o.saida && o.saida >= isoD(new Date(+pD(r.date) - 3 * 864e5))); } catch (e) { return true; } }).sort((a, b) => a.date < b.date ? -1 : 1);
function vgProgModal(id) {
  if (!can.edit()) return; const m = id ? S.recs.get(id) : null, sel = new Set(m ? m.balsas || [] : []);
  const opE = S.cfg.frota.map(v => `<option value="${v.id}"${m && m.vessel === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('');
  const opR = '<option value="">rota não definida</option>' + rotas().map(r => `<option value="${r.id}"${m && m.rota === r.id ? ' selected' : ''}>${esc(vgRotaCurta(r.id))}</option>`).join('');
  const chB = vgBalsas().map(b => `<label class="vgp-bc"><input type="checkbox" value="${esc(b.id)}"${sel.has(b.id) ? ' checked' : ''}> ${esc(b.nome)}</label>`).join('');
  modal(`<h2>${m ? 'Comboio programado · ' + esc(vName(m.vessel)) : 'Programar comboio'}</h2>
    <div class="g"><label class="f s3">Empurrador<select id="vpE">${opE}</select></label><label class="f s3">Rota<select id="vpR">${opR}</select></label>
      <label class="f s3">Saída prevista<input type="date" id="vpD" value="${m ? m.date || '' : ''}"></label>
      <label class="f s3">Situação<select id="vpS"><option value="prog">Programado</option><option value="conf"${m && m.st === 'conf' ? ' selected' : ''}>Confirmado</option></select></label>
      <label class="f s12">Observação<input id="vpO" value="${esc(m ? m.obs || '' : '')}" placeholder="carregamento, cliente, destino…"></label></div>
    <h3 style="margin:10px 0 4px;font-size:13px">Balsas do comboio</h3><div class="vgp-bl">${chB}</div>
    <p class="note" id="vpErr" style="color:var(--badt)"></p>
    <div class="row end">${m ? '<button class="mbtn" id="vpX">Cancelar programação</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Fechar</button><button class="mbtn pri" id="vpOk">Salvar</button></div>`, true);
  $('#vpOk').onclick = async () => { const d = $('#vpD').value; if (!d) { $('#vpErr').textContent = 'Informe a saída prevista.'; return; }
    const r = Object.assign({}, m || { id: uid('snap'), kind: 'snap', tipo: 'prog', por: S.session.name }, { vessel: $('#vpE').value, rota: $('#vpR').value, date: d, st: $('#vpS').value, obs: $('#vpO').value.trim(), balsas: $$('.vgp-bl input:checked').map(x => x.value), at: Date.now() });
    await saveRec(r); closeModal(); toast('Comboio programado salvo.'); render(); };
  const x = $('#vpX'); if (x) x.onclick = async () => { await saveRec(Object.assign({}, m, { excluido: true, at: Date.now() })); closeModal(); toast('Programação cancelada.'); render(); };
}
// ---------- frota em números (Supervisor, 02/11/2026: “gráfico KPI pra diretoria bater o olho”): totais, onde está cada um e a capacidade ----------
// cada embarcação conta uma vez só, na ordem: estaleiro · em viagem · programada para sair · no porto · sem posição (cinza = dado não lançado)
function vgFrotaNum(G, dono, PR) {
  const ehBal = id => typeof balsaDe === 'function' && !!balsaDe(id), BL = vgBalsas(), E = S.cfg.frota, cap = b => +(b.cap || 0) || 0;
  const via = new Set(G.via), est = new Set(G.est), porto = new Set(Object.keys(G).filter(k => k !== 'via' && k !== 'est').flatMap(k => G[k]).filter(id => !ehBal(id)));
  const pE = new Set(PR.map(r => r.vessel)), pB = new Set(PR.flatMap(r => r.balsas || [])), bVia = new Set(G.via.flatMap(id => vgOndeDe(id, false).balsas || []));
  const ondeE = id => est.has(id) ? 'est' : via.has(id) ? 'via' : pE.has(id) ? 'prog' : porto.has(id) ? 'por' : 'sem';
  const ondeB = b => vgEmReforma(b.id) || est.has(b.id) ? 'est' : bVia.has(b.id) ? 'via' : pB.has(b.id) ? 'prog' : porto.has(dono[b.id]) ? 'por' : 'sem';
  const K = ['via', 'prog', 'por', 'est', 'sem'], NOME = { via: 'em viagem', prog: 'programado para sair', por: 'no porto', est: 'no estaleiro', sem: 'sem posição' };
  const COR = { via: '#1A73E8', prog: '#7B5CC4', por: '#188038', est: '#B06000', sem: '#C9D3DF' };
  const conta = (L, f) => { const c = {}; K.forEach(k => c[k] = []); L.forEach(x => c[f(x)].push(x)); return c; };
  const cE = conta(E.map(v => v.id), ondeE), cB = conta(BL, ondeB), tot = BL.reduce((a, b) => a + cap(b), 0), cc = k => cB[k].reduce((a, b) => a + cap(b), 0);
  const SD = typeof sfDados === 'function' ? sfDados() : [], lib = SD.filter(x => x.sit < 2 && !est.has(x.v.id)).length;
  const barra = (c, n, nome) => `<div class="vgf-bl"><span class="vgf-bn">${nome}</span><div class="vgf-b">${K.filter(k => c[k].length).map(k => `<i style="flex:${c[k].length};background:${COR[k]}" title="${c[k].length} ${NOME[k]}">${c[k].length}</i>`).join('')}</div></div>`;
  const leg = K.map(k => `<span><i style="background:${COR[k]}"></i>${NOME[k]}</span>`).join('');
  const n = v => Math.round(v).toLocaleString('pt-BR'), pc = v => tot ? Math.round(v / tot * 100) + '%' : '';
  return `<div class="vgf"><div class="vgf-k"><div><b>${E.length}</b><span>empurradores</span><small>${lib} liberados à operação</small></div><div><b>${BL.length}</b><span>balsas</span><small>${cB.via.length} em viagem · ${cB.est.length} no estaleiro</small></div>
    <div><b>${n(tot)}</b><span>capacidade das balsas</span><small>soma do cadastro (unidade a confirmar)</small></div><div><b>${PR.length}</b><span>comboios programados</span><small>${vgdPl(PR.filter(r => r.st === 'conf').length, 'confirmado', 'confirmados')}</small></div></div>
    ${barra(cE, E.length, 'Empurradores')}${barra(cB, BL.length, 'Balsas')}<div class="vgf-lg">${leg}</div>
    <div class="vgf-cap">Capacidade: em viagem <b>${n(cc('via'))}</b> (${pc(cc('via'))}) · programada para sair <b>${n(cc('prog'))}</b> · no porto <b>${n(cc('por'))}</b> · parada no estaleiro <b style="color:${VGD_C.at}">${n(cc('est'))}</b> (${pc(cc('est'))})${cB.sem.length ? ` · sem posição <b>${n(cc('sem'))}</b>` : ''}</div></div>`;
}
// ---------- resumo (Supervisor, 02/11/2026): antes de escolher uma visão, embaixo dos botões, onde está cada um, com as datas que importam ----------
function vgResumo() {
  let G; try { G = vgGrupos().G; } catch (e) { return ''; }
  const H = isoD(hoje()), ehBal = id => typeof balsaDe === 'function' && !!balsaDe(id), SD = typeof sfDados === 'function' ? sfDados() : [], dono = vgMapaDados().dono || {};
  const sit = id => { const x = SD.find(y => y.v.id === id); if (!x || typeof SF_SIT === 'undefined') return ''; const c = { ok: 'p-ok', at: 'p-warn', bad: 'p-bad' }[SF_SIT[x.sit][0]] || 'p-mut'; return ` <span class="pill ${c}">${esc(SF_SIT[x.sit][1])}</span>`; };
  const prevTx = (p, t) => p ? `${t} <b>${brD(p)}</b>${p < H ? ` <b style="color:${VGD_C.bad}">(${-vgDD(H, p)} d de atraso)</b>` : ` <span class="vgd-m">(faltam ${vgDD(H, p)} d)</span>`}` : `<span class="vgd-m">${t} não informada</span>`;
  const it = h => `<div class="vgr-i">${h}</div>`, sub = (t, L) => L.length ? `<div class="vgr-s">${t}</div>${L.join('')}` : '';
  // em viagem: comboio, balsas, saída, dias, chegada prevista
  const via = G.via.map(id => { const o = vgOndeDe(id, false), r = vgRota(o.rota), dest = r ? r.nome.split('×').pop().trim() : '';
    return it(`<b>Comboio ${esc(o.nome)}</b>${o.balsas && o.balsas.length ? ` · ${esc(o.balsas.map(vName).join(', '))}` : ''}${o.rota ? `<br><span class="vgd-m">${esc(vgRotaCurta(o.rota))}</span>` : ''}
      <br>${o.saida ? `Saída <b>${brD(o.saida)}</b> · há ${vgDD(o.saida, H)} d` : '<span class="vgd-m">saída não registrada</span>'}${o.parD > VG_PARADO_D ? ` · <b style="color:${VGD_C.bad}">parado há ${o.parD} d</b>` : ''}<br>${prevTx(o.prev, 'Chegada prevista' + (dest ? ' em ' + esc(dest) : ''))}`); });
  // no porto: empurradores (chegada, situação) e as balsas que chegaram com eles
  const porto = (ids, t) => { const E = ids.filter(id => !ehBal(id) && vgOndeDe(id, false).st !== 'ref'), emp = new Set(E);
    const LE = E.map(id => { const o = vgOndeDe(id, false), d = (o.desde || '').slice(0, 10); return it(`<b>${esc(o.nome)}</b>${sit(id)}<br>${d ? `Chegada <b>${brD(d)}</b>${o.est ? ' <span class="vgd-m">(estimada)</span>' : ''} · há ${vgDD(d, H)} d` : '<span class="vgd-m">chegada não registrada</span>'}`); });
    const LB = (typeof vgBalsas === 'function' ? vgBalsas() : []).filter(b => emp.has(dono[b.id]) && !vgEmReforma(b.id)).map(b => { const st = typeof balEstado === 'function' && typeof BAL_ST !== 'undefined' ? BAL_ST[balEstado(b).st] : null;
      return it(`<b>${esc(b.nome)}</b>${st ? ` <span class="pill ${st[0]}">${esc(st[1])}</span>` : ''}<br><span class="vgd-m">chegou com o ${esc(vName(dono[b.id]))}</span>`); });
    return LE.length || LB.length ? `<div class="vgr-b"><h4 data-vgg="${t[0]}" data-nodrag>${esc(t[1])}</h4><div class="vgr-c">${vgdPl(LE.length, 'empurrador', 'empurradores')} e ${vgdPl(LB.length, 'balsa', 'balsas')}</div>${sub('Empurradores', LE)}${sub('Balsas', LB)}</div>` : ''; };
  // estaleiro: entrada, tempo de estaleiro, entrega prevista
  const est = id => { const z = vgRefDados(id); return it(`<b>${esc(z.nome)}</b>${z.r && z.r.local ? ` <span class="vgd-m">· ${esc(z.r.local)}</span>` : ''}<br>${z.ini ? `Entrada <b>${brD(z.ini)}</b> · há ${vgDD(z.ini, H)} d` : '<span class="vgd-m">entrada não registrada</span>'}<br>${prevTx(z.prev, 'Entrega prevista')}`); };
  const EE = G.est.filter(id => !ehBal(id)).map(est), EB = G.est.filter(ehBal).map(est);
  const PR = vgProgs(), ed = can.edit();
  const prog = `<div class="vgr-b"><h4>Comboios programados e confirmados</h4><div class="vgr-c">${vgdPl(PR.filter(r => r.st === 'conf').length, 'confirmado', 'confirmados')} e ${vgdPl(PR.filter(r => r.st !== 'conf').length, 'programado', 'programados')}</div>${PR.map(r => it(`<b>Comboio ${esc(vName(r.vessel))}</b> <span class="pill ${r.st === 'conf' ? 'p-ok' : 'p-warn'}">${r.st === 'conf' ? 'Confirmado' : 'Programado'}</span>${(r.balsas || []).length ? ` · ${esc(r.balsas.map(vName).join(', '))}` : ''}${r.rota ? `<br><span class="vgd-m">${esc(vgRotaCurta(r.rota))}</span>` : ''}
      <br>Saída prevista <b>${brD(r.date)}</b> ${r.date < H ? `<b style="color:${VGD_C.bad}">(passou ${-vgDD(H, r.date)} d)</b>` : `<span class="vgd-m">(faltam ${vgDD(H, r.date)} d)</span>`}${r.obs ? `<br><span class="vgd-m">${esc(r.obs)}</span>` : ''}${ed ? ` <button class="mbtn sm" data-vgprog="${r.id}" data-nodrag>Editar</button>` : ''}`)).join('') || '<p class="vgd-m">Nenhum comboio programado.</p>'}${ed ? '<button class="mbtn sm" data-vgprog="" data-nodrag style="margin-top:8px">+ Programar comboio</button>' : ''}</div>`;
  const blocos = [via.length ? `<div class="vgr-b"><h4 data-vgg="via" data-nodrag>Em viagem</h4><div class="vgr-c">${vgdPl(G.via.length, 'empurrador', 'empurradores')} e ${(n => vgdPl(n, 'balsa', 'balsas'))(G.via.reduce((a, id) => a + ((vgOndeDe(id, false).balsas || []).length), 0))}</div>${via.join('')}</div>` : '',
    porto(G.man, ['man', 'Em Manaus']), prog, porto(G.pvh, ['pvh', 'Porto Velho · filial']),
    EE.length || EB.length ? `<div class="vgr-b"><h4 data-vgg="est" data-nodrag>No estaleiro</h4><div class="vgr-c">${vgdPl(EE.length, 'empurrador', 'empurradores')} e ${vgdPl(EB.length, 'balsa', 'balsas')}</div>${sub('Empurradores', EE)}${sub('Balsas', EB)}</div>` : ''].filter(Boolean);
  return `<p class="note" style="margin:0 0 4px">${brD(H)} · clique no título de um quadro para ver os detalhes</p>${vgFrotaNum(G, dono, PR)}<div class="vgr">${blocos.join('') || '<p class="vgd-c">Nenhuma posição lançada.</p>'}</div>`;
}
// ---------- abrir ----------
function vgDirTabs(g) {
  let n = {}; try { const R = vgGrupos(); n = R; } catch (e) { n = { G: {}, nomes: {} }; }
  const L = VG_GRP.concat(Object.keys(n.nomes || {}).map(k => [k, n.nomes[k]]));
  return L.map(([k, t]) => `<button class="vgd-tb${k === g ? ' on' : ''}" data-vgg="${esc(k)}" data-nodrag>${esc(t)} <b>${((n.G || {})[k] || []).length}</b></button>`).join('');
}
function vgDirAbrir(g, sel) {
  const el = $('#vgPainel'); if (!el) return; VG_PAINEL.g = g;
  const { G, nomes } = vgGrupos(), ids = G[g] || [], tit = (VG_GRP.find(x => x[0] === g) || [g, nomes[g] || ''])[1];
  const corpo = g === 'est' ? vgDirEst(ids) : g === 'via' ? vgDirVia(ids, sel) : vgDirPorto(tit, ids);
  const tb = $('#vgTabs'); if (tb) tb.innerHTML = vgDirTabs(g);
  el.innerHTML = `<div class="vgd-h"><div><h3>${esc(tit)}</h3><span>${brD(isoD(hoje()))} · ${vgdPl(ids.length, 'embarcação', 'embarcações')}</span></div><button class="mbtn sm" data-vgpx data-nodrag>Fechar</button></div>${corpo}`;
  el.style.display = ''; if (typeof heCarregaFotos === 'function') heCarregaFotos(); try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { }
}
function vgPainelAbrir(tp, a, b) { return tp === 'via' ? vgDirAbrir('via', a) : vgDirAbrir(vgGrupoDe(a)); }
// detalhe da ocorrência clicada na linha do tempo, com as fotos (clique na foto = tela cheia)
function vgOcDetalhe(key, i) {
  const x = (VG_PAINEL.oc[key] || [])[+i], el = $('#vgtd-' + key); if (!x || !el) return;
  el.innerHTML = `<div class="vgt-x"><b>${brD(x.d)}${x.h ? ' ' + esc(x.h) : ''} · ${esc(x.eq || 'Ocorrência')}</b>${x.c ? ' <span class="pill p-mut">' + esc(x.c) + '</span>' : ''} <span class="pill ${x.ok ? 'p-ok' : 'p-bad'}">${x.ok ? 'resolvida' : 'em andamento'}</span>${x.om ? ' · OM ' + esc(x.om) : ''}
    ${x.txt ? `<div>${esc(x.txt)}</div>` : ''}${x.feito ? `<div class="note">Feito: ${esc(x.feito)}</div>` : ''}${x.fotos.length ? `<div class="vgt-fs">${x.fotos.map((f, k) => vgFotoImg(f, 'vgt-ft', ` data-vgfg="${key}|${i}|${k}" data-nodrag`)).join('')}</div>` : '<div class="note">Sem foto.</div>'}</div>`;
  if (typeof heCarregaFotos === 'function') heCarregaFotos();
}
function vgFotoGrande(key, i, k) {
  const L = ((VG_PAINEL.oc[key] || [])[+i] || {}).fotos || []; let n = +k; if (!L.length) return;
  const d = document.createElement('div'); d.className = 'vgt-g'; vgRaiz().appendChild(d);
  const des = () => { d.innerHTML = `${vgFotoImg(L[n], '')}<div class="vgt-gb">${L.length > 1 ? '<button data-g="-1">‹</button>' : ''}<span>${n + 1} de ${L.length} · clique na foto para voltar</span>${L.length > 1 ? '<button data-g="1">›</button>' : ''}</div>`; if (typeof heCarregaFotos === 'function') heCarregaFotos(); };
  const sai = () => { d.remove(); document.removeEventListener('keydown', kb); }, kb = e => { if (e.key === 'Escape') sai(); else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { n = (n + (e.key === 'ArrowRight' ? 1 : -1) + L.length) % L.length; des(); } };
  d.onclick = e => { const g = e.target.closest('[data-g]'); if (g) { n = (n + +g.dataset.g + L.length) % L.length; des(); } else sai(); };
  document.addEventListener('keydown', kb); des();
}
document.addEventListener('click', e => { const t = e.target.closest('[data-vgoc],[data-vgfg],[data-vgpx],[data-vgdet],[data-vgg],[data-vgprog]'); if (!t || VIEW !== 'enxviag') return;
  if (t.dataset.vgdet && e.target.closest('a')) return;   // clique na pendência: vai para a tela que resolve
  e.preventDefault(); e.stopPropagation(); const d = t.dataset;
  if (d.vgdet) { const r = $('#vgdet-' + d.vgdet), ab = r && r.style.display === 'none'; if (r) { r.style.display = ab ? '' : 'none'; t.classList.toggle('on', ab); if (ab && typeof heCarregaFotos === 'function') heCarregaFotos(); } return; }
  if (d.vgprog !== undefined) return vgProgModal(d.vgprog);
  if (d.vgg) return vgDirAbrir(d.vgg);
  if (d.vgpx !== undefined) { const el = $('#vgPainel'), tb = $('#vgTabs'); if (el) { el.innerHTML = vgResumo(); el.style.display = ''; if (typeof heCarregaFotos === 'function') heCarregaFotos(); } if (tb) tb.innerHTML = vgDirTabs(''); return; }
  if (d.vgoc) return vgOcDetalhe(...d.vgoc.split('|'));
  if (d.vgfg) return vgFotoGrande(...d.vgfg.split('|')); }, true);
{ const st = document.createElement('style'); st.textContent = '#vgPainel{margin-top:10px;border-top:1px solid #DCE3EC;padding-top:8px}.vgp-b{border:1px solid #DCE3EC;border-radius:8px;padding:10px 12px;margin:8px 0;background:#fff;line-height:1.55}.vgp-t{font-weight:700;color:#16244A;font-size:14px;margin-bottom:2px}'
  + '.vgt{margin:22px 4px 2px}.vgt-b{position:relative;height:8px;border-radius:4px;background:#E3E8EF;margin:10px 0}.vgt-f{position:absolute;left:0;top:0;bottom:0;background:#9DB4D3;border-radius:4px}.vgt-p{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(90deg,#C9D3E0 0 6px,transparent 6px 10px)}.vgt-h{position:absolute;top:-6px;bottom:-6px;width:2px;background:#C5221F;margin-left:-1px}'
  + '.vgt-o{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);cursor:pointer;padding:0}.vgt-b .vgt-o.ok{background:#188038!important}.vgt-b .vgt-o.ab{background:#D93025!important}.vgp-tab .vgp-l{cursor:pointer}.vgp-tab .vgp-l:hover td{background:#F3F6FA}.vgp-tab .vgp-l.on .vgp-sx{display:inline-block;transform:rotate(90deg)}.vgp-sx{color:#8A94A6;font-size:11px}.vgp-det>td{padding:0 6px 8px!important;background:#FAFBFD}.vgp-tab .sf-pm{margin:1px 0}.vgt-m{position:absolute;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border:1.5px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)}.vgt-m.sv{background:#188038;border-radius:2px}.vgt-m.pv{background:#E37400;transform:rotate(45deg)}.vgp-an{height:8px;background:#E3E8EF;border-radius:4px;overflow:hidden;margin:3px 0 2px}.vgp-an i{display:block;height:100%;background:#188038}'
  + '#vgPainel{margin-top:8px}#vgTabs{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px}.vgd-tb{font:600 14px/1.2 system-ui,sans-serif;padding:9px 14px;border-radius:8px;border:1px solid #C9D3DF;background:#fff;color:#16244A;cursor:pointer}.vgd-tb b{display:inline-block;min-width:22px;margin-left:6px;padding:1px 7px;border-radius:10px;background:#E8EEF5;font-size:13px}.vgd-tb.on{background:#16244A;color:#fff;border-color:#16244A}.vgd-tb.on b{background:rgba(255,255,255,.2)}'
  + '.vgd-h{display:flex;justify-content:space-between;align-items:flex-start;margin:6px 0 10px}.vgd-h h3{font-size:26px;margin:0;color:#16244A}.vgd-h span{font-size:14px;color:#5B6B80}.vgd-ks{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.vgd-k{background:#fff;border:1px solid #DCE3EC;border-radius:12px;padding:14px 18px}.vgd-k b{display:block;font-size:48px;line-height:1.05;font-weight:800;color:#16244A}.vgd-k span{display:block;font-size:16px;font-weight:700;color:#16244A;margin-top:6px}.vgd-k small{display:block;font-size:12.5px;color:#5B6B80;margin-top:3px;line-height:1.35}'
  + '.vgd-pop .vgd-cd{border-top:0;border-right:0;border-bottom:0;border-radius:6px;padding:4px 4px 4px 12px;font-size:14px}.vgd-pop .vgd-ct b{font-size:19px}.vgd-pop .vgd-ct span{font-size:13px}.vgd-pop .vgd-cp{font-size:15px}.vg-pop .leaflet-popup-content{margin:12px 14px}.vgr{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px;margin-top:8px}.vgr-b{background:#fff;border:1px solid #DCE3EC;border-radius:10px;padding:12px 16px}.vgr-b h4{margin:0 0 4px;font-size:16px;letter-spacing:.04em;text-transform:uppercase;color:#16244A;cursor:pointer}.vgr-b h4:hover{text-decoration:underline}.vgf{background:#fff;border:1px solid #DCE3EC;border-radius:10px;padding:14px 18px;margin:6px 0 10px}.vgf-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}.vgf-k div{display:flex;flex-direction:column}.vgf-k b{font-size:34px;line-height:1.05;color:#16244A}.vgf-k span{font-size:14px;font-weight:700;color:#16244A}.vgf-k small{font-size:12.5px;color:#5B6B80}.vgf-bl{display:flex;align-items:center;gap:10px;margin:6px 0}.vgf-bn{width:110px;font-size:13px;font-weight:700;color:#16244A}.vgf-b{flex:1;display:flex;height:26px;border-radius:6px;overflow:hidden;gap:2px}.vgf-b i{display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px system-ui,sans-serif;font-style:normal;min-width:22px}.vgf-lg{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:#5B6B80;margin:4px 0 0 120px}.vgf-lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}.vgf-cap{margin-top:10px;font-size:14px;color:#16244A}.vgp-bl{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:4px 10px}.vgp-bc{font-size:13px;display:flex;align-items:center;gap:6px}.vgr-c{font-size:15px;font-weight:700;color:#16244A;margin:0 0 4px}.vgr-s{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#5B6B80;margin:10px 0 2px}.vgr-i{padding:7px 0;border-top:1px solid #EEF2F6;font-size:14.5px;line-height:1.5}.vgr-i b{color:#16244A}.vgd-ov{position:fixed;inset:0;z-index:99990;background:rgba(10,20,40,.6);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:4vh 16px}.vgd-ovc{position:relative;width:min(960px,100%);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.45);padding:26px 32px}.vgd-ovx{position:absolute;top:14px;right:16px}.vgd-ov .vgd-cd{border:0;border-left:8px solid;border-radius:6px;padding:4px 4px 4px 22px;font-size:19px;line-height:1.55}.vgd-ov .vgd-ct{padding-right:110px}.vgd-ov .vgd-ct b{font-size:34px}.vgd-ov .vgd-ct span{font-size:19px}.vgd-ov .vgd-cp{font-size:24px;margin:10px 0}.vgd-ov .vgd-cl,.vgd-ov .vgd-m{font-size:19px}.vgd-ov .vgt-x .note,.vgd-ov .vgt-x div{font-size:18px}.vgd-ov .pill{font-size:15px}.vgd-ov .vgt{margin:42px 4px 4px}.vgd-ov .vgt-b{height:14px;border-radius:7px}.vgd-ov .vgt-o{width:26px;height:26px;margin:-13px 0 0 -13px;border-width:3px}.vgd-ov .vgt-l{font-size:15px}.vgd-ov .vgt-lh{font-size:15px;top:-28px}.vgd-ov .vgt-x{font-size:18px;padding:14px 18px;margin-top:12px}.vgd-ov .vgt-ft{width:230px;height:172px;border-radius:8px}.vgd-ov .vgt-fs{gap:10px}.vgd-c{font-size:19px;line-height:1.45;color:#16244A;background:#EEF3F9;border-left:5px solid #16244A;border-radius:8px;padding:12px 16px;margin:14px 0}.vgd-cs{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:12px}.vgd-cs1{grid-template-columns:1fr}.vgd-cd{background:#fff;border:1px solid #DCE3EC;border-left:6px solid #16244A;border-radius:10px;padding:14px 18px;font-size:15.5px;line-height:1.5}.vgd-sel{box-shadow:0 0 0 3px #9DB4D3}'
  + '.vgd-ct{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:4px}.vgd-ct b{font-size:22px;color:#16244A}.vgd-ct span{font-weight:700;font-size:15px;color:#5B6B80}.vgd-cl{margin:2px 0}.vgd-cp{margin:6px 0;font-size:16.5px}.vgd-cr small{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#5B6B80;margin:6px 0 2px}.vgd-cr div{border-left:3px solid;padding:1px 0 1px 8px;margin:3px 0}.vgd-m{color:#6B7785}.vgd-lb{font-size:16px;margin:10px 0}'
  + '.vgd-est{display:grid;grid-template-columns:300px 1fr;gap:18px}.vgd-ft{width:100%;height:210px;object-fit:cover;border-radius:8px;cursor:zoom-in;background:#E8EEF5}.vgd-ef small{display:block;font-size:12.5px;color:#5B6B80;margin-top:4px}.vgd-sf{height:210px;border:2px dashed #E3B4AF;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#C5221F;font-weight:700}.vgd-av{margin:8px 0}.vgd-av div{height:14px;background:#E3E8EF;border-radius:7px;overflow:hidden}.vgd-av i{display:block;height:100%;background:#137333}.vgd-av span{font-size:15px}'
  + '.vgd-det{margin-top:16px;border-top:1px solid #DCE3EC;padding-top:8px}.vgd-det summary{cursor:pointer;font-weight:600;color:#5B6B80;font-size:13px}@media(max-width:760px){.vgd-est{grid-template-columns:1fr}.vgd-cs{grid-template-columns:1fr}.vgd-k b{font-size:36px}}.vgt-o:hover{transform:scale(1.25)}'
  + '.vgt-l{position:relative;display:flex;justify-content:space-between;font-size:11.5px;color:#5F6368;min-height:30px}.vgt-lh{position:absolute;top:-19px;transform:translateX(-50%);color:#C5221F;font-weight:600;font-size:11px;white-space:nowrap}.vgt-x{margin-top:6px;padding:8px 10px;background:#F6F8FB;border-radius:6px}.vgt-fs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}'
  + '.vgt-ft{width:120px;height:90px;object-fit:cover;border-radius:6px;cursor:zoom-in;background:#E8EEF5}.vgt-g{position:fixed;inset:0;z-index:100000;background:rgba(10,15,25,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out}.vgt-g img{max-width:94vw;max-height:86vh;object-fit:contain;border-radius:4px;cursor:default}'
  + '.vgt-gb{display:flex;gap:16px;align-items:center;color:#fff;font:13px system-ui;margin-top:10px}.vgt-gb button{font-size:26px;line-height:1;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:6px;padding:4px 14px;cursor:pointer}'; document.head.appendChild(st); }
// cliques: no quadro e também dentro do balão do mapa (o Leaflet não deixa o clique chegar ao #main)
document.addEventListener('click', e => { const t = e.target.closest('[data-vgficha],[data-vgman]'); if (!t || VIEW !== 'enxviag') return; e.preventDefault(); e.stopPropagation(); const d = t.dataset;
  if (d.vgficha !== undefined) return vgFicha(d.vgficha);
  if (d.vgman !== undefined) return vgManModal(d.vgman || null, d.vgv ? { vid: d.vgv, om: d.vgo, onde: d.vgw, txt: d.vgt, ini: d.vgi } : null); }, true);
{ const st = document.createElement('style'); st.textContent = '.vgm-h{font-size:13.5px;margin:12px 0 4px;color:#16244A}.vgm-t td{vertical-align:top}.vgf-ft{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.vgf-ft figure{margin:0}.vgf-ft img{width:100%;height:110px;object-fit:cover;border-radius:6px;background:#E8EEF5}.vgf-ft figcaption{font-size:11px;color:#5F6368}.vgf-b{margin:6px 0 10px}.vgf-b .t{margin-top:4px}'; document.head.appendChild(st); }
