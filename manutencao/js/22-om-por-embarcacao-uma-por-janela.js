/* ===== OM por embarcação (uma por janela) · ficha checklist para a equipe de terra · lançamento rápido · rotina do dia ===== */
'use strict';
ETAPAS_P[1][1] = 'Em execução'; ETAPAS_P[2][1] = 'Executada';
const omGrupo = g => oms().filter(o => o.tipo === 'P' && o.grupo === g).sort((a, b) => (a.parte || 0) - (b.parte || 0));
const grpOrd = ETAPAS_P.map(x => x[0]);
const grpStatus = P => grpOrd[Math.min(...P.map(o => Math.max(0, grpOrd.indexOf(o.status))))];
const grpItens = P => P.reduce((a, o) => a + (o.itensProg || o.items || []).length, 0);
const grpNext = { emitida: ['abordo', 'Iniciar execução'], abordo: ['executada', 'Terminou a execução'], executada: ['conferencia', 'Lançar a ficha'] };
const ivEmb = (t, v, p) => { const iv = intervalo(t, v, p); return [iv.h ? nf(iv.h) + ' h' : '', iv.m ? iv.m + ' m' : ''].filter(Boolean).join(' / '); };
const ladoMCA = (v, p) => { const l = v && v.mcaLoc && v.mcaLoc[p] ? v.mcaLoc[p] : ''; return /^bomb/i.test(l) ? 'BB' : /^bores/i.test(l) ? 'BE' : ''; };
const posCurtoE = (v, p) => { if (p === 'UN') return 'Embarcação'; if (isMcp(p)) return p === 'CE' || mcpPos(v).length < 2 ? 'MCP' : 'MCP ' + p; if (p === 'MCA3') return 'Motobomba de incêndio (MCA 3)'; if (MCAS.includes(p)) { const n = MCAS.filter(k => v && v.mca && v.mca[k] && k !== 'MCA3').length, l = ladoMCA(v, p); return n < 2 ? 'MCA' : l ? 'MCA ' + l : posNome(v, p); } return posNome(v, p); };

/* ---------- 1 · Programação: uma OM por embarcação ---------- */
function foraJanela(id, v, pos) { if (id === DOCA.item || (DOCA.junto || []).includes(id)) return true; if (!v || !pos) return false; const tr = trilha(v, pos, A1M[id]); return tr === 'bordo' || tr === 'doca'; }   // docagem, o que só se faz em dique e o que vai na troca de óleo: fora da OM de janela   // docagem e o que só se faz em dique: planejamento próprio
function embPartes(v) {
  const P = painelVessel(v, EM.viag ?? viagemDe(v)), viag = EM.viag ?? viagemDe(v), por = {};
  [...EM.sel].forEach(k => { const [p, id] = k.split('|'); (por[p] = por[p] || []).push(id); });
  const idn = id => id.split('.').map(n => String(+n).padStart(3, '0')).join('.');
  return posicoes(v).filter(p => por[p]).map(p => {
    const ids = por[p].sort((a, b) => idn(a) < idn(b) ? -1 : 1), sits = ids.map(id => (P.find(x => x.pos === p && x.t.id === id) || {}).s || {});
    const hs = sits.map(s => s.alvoH).filter(x => x), ds = sits.map(s => s.alvoD).filter(x => x), hr = horAtual(v.id, p === 'UN' ? mpos(v.id) : p);
    return { pos: p, ids, hr, alvoH: hs.length ? Math.min(...hs) : (hr ? hr.h + viag : null), alvoD: ds.length ? isoD(new Date(Math.min(...ds))) : null };
  });
}
function embTexto(v, partes) {
  const n = partes.reduce((a, p) => a + p.ids.length, 0), ds = partes.map(p => p.alvoD).filter(Boolean).sort();
  const PV = painelVessel(v, EM.viag ?? viagemDe(v)), emb = (pos, id) => { const x = PV.find(y => y.pos === pos && y.t.id === id); return x && emGrp(v, x) === 'emb' ? x : null; };   // OM embarcada (NP 7.3)
  const temEmb = partes.some(p => p.ids.some(id => emb(p.pos, id)));
  return `PREVENTIVA – ${v.nome} – janela de manutenção (equipe de terra)${temEmb ? ' + itens EMBARCADOS (CTF/MFM a bordo, na hora-alvo)' : ''}\n${n} itens do Anexo I (NP 055)${ds[0] ? ' · data-limite ' + brD(ds[0]) : ''}\n` +
    partes.map(p => `\n[${posCurtoE(v, p.pos)}]${p.hr ? ' horímetro ' + nf(p.hr.h) + ' h' : ''}${p.alvoH && p.pos !== 'UN' ? ' · hora-alvo ' + nf(p.alvoH) + ' h' : ''}\n` + p.ids.map(id => { const x = emb(p.pos, id); return '- ' + id + ' ' + A1M[id].chk + (x ? ' [EMBARCADA · CTF/MFM' + (x.s.alvoH ? ' · hora-alvo ' + nf(x.s.alvoH) + ' h' : '') + ']' : ''); }).join('\n')).join('\n');
}

/* ---------- 2 · Ficha impressa: checklist em poucas folhas ---------- */


/* ---------- 3 · Quadro de OMs: uma linha por OM da embarcação ---------- */
function vAcomp() {
  const ab = oms().filter(o => o.status !== 'encerrada' || (o.fechadoAt && Date.now() - o.fechadoAt < 7 * 864e5));
  const vis = new Set(), L = [];
  ab.filter(o => AC.tipo === 'todas' || o.tipo === AC.tipo).forEach(o => { if (o.grupo) { if (vis.has(o.grupo)) return; vis.add(o.grupo); const P = omGrupo(o.grupo); L.push({ g: o.grupo, P, o: P[0], status: grpStatus(P) }); } else L.push({ o, status: o.status }); });
  const colOf = x => x.o.tipo === 'C' ? { aberta: 'emitida', execucao: 'abordo', conferencia: 'conferencia', encerrada: 'encerrada' }[x.status] : x.status;
  const cols = AC.tipo === 'C' ? ETAPAS_C : ETAPAS_P;
  const card = x => { const o = x.o, late = x.P ? x.P.some(omAtrasada) : omAtrasada(o);
    if (x.P) { const nx = grpNext[x.status], v = vessel(o.vessel);
      return `<div class="omc" style="--c:var(--navy)"><div class="h"><b class="num">OM ${esc(o.num)}</b><span class="pill p-inf">Preventiva</span></div><div><b>${esc(vName(o.vessel))}</b></div>
       <div class="note">${grpItens(x.P)} itens · ${x.P.map(p => posCurtoE(v, p.pos)).join(', ')}</div><div class="note mono">emitida ${brD(o.emitAt)}${x.P.map(p => p.alvoD).filter(Boolean).sort()[0] ? ' · até ' + brD(x.P.map(p => p.alvoD).filter(Boolean).sort()[0]) : ''}</div>
       ${late ? '<span class="pill p-bad">Início em atraso</span>' : ''}${o.devolvida ? `<span class="pill p-warn">Devolvida: ${esc(o.devolvida)}</span>` : ''}
       <div class="acts">${nx && x.status !== 'encerrada' ? `<button class="mbtn sm ${nx[0] === 'conferencia' ? 'pri' : ''}" data-gadv="${esc(x.g)}|${nx[0]}">${nx[1]}</button>` : ''}<a class="mbtn sm ${x.status === 'conferencia' ? 'pri' : ''}" href="#omg/${encodeURIComponent(x.g)}">${x.status === 'conferencia' ? 'Conferir' : x.status === 'encerrada' ? 'Ver' : 'Abrir'}</a><button class="mbtn sm" data-ficha="${o.id}">Ficha</button></div></div>`; }
    const c = o.pos === 'BB' ? 'var(--bb)' : o.pos === 'BE' ? 'var(--be)' : o.pos === 'CE' ? 'var(--navy)' : 'var(--acc)';
    const next = o.tipo === 'C' ? { aberta: ['execucao', 'Iniciar execução'], execucao: ['conferencia', 'Conferir'] }[o.status] : { emitida: ['abordo', 'Iniciar execução'], abordo: ['executada', 'Terminou a execução'], executada: ['conferencia', 'Conferir'] }[o.status];
    return `<div class="omc" style="--c:${c}"><div class="h"><b class="num">OM ${esc(o.num)}</b>${posTag(o.pos)}</div><div>${esc(vName(o.vessel))}</div>${tipoPill(o)}
      <div class="note">${o.tipo === 'C' ? esc(o.descricao || '') : (o.items || []).join(' · ')}</div>
      <div class="note mono">${o.tipo === 'C' ? 'aberta ' + brDT(o.abertura) : (o.alvoH ? 'alvo ' + nf(o.alvoH) + ' h' : '') + (o.alvoD ? ' · até ' + brD(o.alvoD) : '')}</div>
      ${late ? '<span class="pill p-bad">Início em atraso</span>' : ''}${o.devolvida ? `<span class="pill p-warn">Devolvida: ${esc(o.devolvida)}</span>` : ''}
      <div class="acts">${next && o.status !== 'encerrada' ? `<button class="mbtn sm ${next[0] === 'conferencia' ? 'pri' : ''}" data-adv="${o.id}|${next[0]}">${next[1]}</button>` : ''}<a class="mbtn sm" href="#om/${o.id}">Abrir</a>${o.tipo === 'P' ? `<button class="mbtn sm" data-ficha="${o.id}">Ficha</button>` : ''}</div></div>`; };
  const colsH = (AC.tipo === 'todas' ? ETAPAS_P : cols).map(([k, l]) => { const l2 = L.filter(x => (AC.tipo === 'C' ? x.status : colOf(x)) === k); return `<div class="col"><h4>${AC.tipo === 'todas' && k === 'emitida' ? 'Emitida / aberta' : l}<span class="mono">${l2.length}</span></h4>${l2.map(card).join('') || '<div class="note">Nenhuma</div>'}</div>`; }).join('');
  return `<div class="vh"><div><h1>OMs em execução</h1><p>Cada cartão é uma OM. Preventiva: uma por embarcação, executada pela equipe de terra. Avance o cartão conforme o serviço anda; na volta da ficha, clique em <b>Lançar a ficha</b>.</p></div><span class="sp"></span>
   <div class="seg">${[['todas', 'Todas'], ['P', 'Preventivas'], ['C', 'Corretivas']].map(([k, l]) => `<button data-ac="${k}" class="${AC.tipo === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
   <div class="kan" style="grid-template-columns:repeat(${AC.tipo === 'C' ? 4 : 5},minmax(210px,1fr))">${colsH}</div><p class="note">Encerradas aparecem por 7 dias.</p>`;
}
async function grpAvancar(g, st) {
  const P = omGrupo(g), i = grpOrd.indexOf(st);
  for (const o of P) if (grpOrd.indexOf(o.status) < i) { o.status = st; (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: omStatusTxt(o) }); if (st === 'abordo' && !o.inicio) o.inicio = isoDT(hoje()); await saveRec(o); }
}

/* ---------- 4 · Lançamento rápido da ficha (OM inteira numa tela) ---------- */
const RG = { t: null };
function rgDados(P) { const o = P[0]; o.rap = o.rap || { res: {}, obs: {}, med: {}, hr: {}, regs: {} }; ['res', 'obs', 'med', 'hr', 'regs'].forEach(k => o.rap[k] = o.rap[k] || {}); return o.rap; }
function rgSalvar(P) { clearTimeout(RG.t); RG.t = setTimeout(() => saveRec(P[0]), 700); }
const rgRegs = P => { const s = new Set(); P.forEach(o => regsDe({ items: o.itensProg || o.items }).forEach(r => s.add(r))); return [...s].filter(r => ['end', 'cert'].includes(r)); };   // lote do lubrificante, FR 049_B e instrumento ficam no formulário de troca de óleo
/* Lançar OM num bloco só (24/10/2026): faixa-guia (guiaOM) + lançamento + histórico; antes eram 3 camadas por cima (troca de "ficha", histórico e faixa-guia) */
function vOmg() { const P = omGrupo(ARG); if (!P.length) return omgCorpo(); return guiaOM(P[0], P) + emTroca(omgCorpo()) + omHistHTML(P[0]); }
VX.omg = vOmg;
function omgCorpo() {
  const g = ARG, P = omGrupo(g); if (!P.length) return '<div class="empty">OM não encontrada. Talvez ainda não tenha sincronizado.</div>';
  const o1 = P[0], v = vessel(o1.vessel), R = rgDados(P), st = grpStatus(P), fechada = st === 'encerrada', ro = fechada || !can.edit(), idx = grpOrd.indexOf(st);
  const bar = `<div class="stepsbar">${ETAPAS_P.map(([k, l], i) => `<div class="${i < idx || fechada ? 'done' : i === idx ? 'cur' : ''}"><b>${i < idx || fechada ? '✓' : i + 1}</b>${l}</div>`).join('')}</div>`;
  const inp = (k, lab, cls, at = '') => `<label class="f ${cls}">${lab}<input data-rg="${k}" value="${esc(R[k] || '')}" ${at}></label>`;
  const seg = (k, val) => `<div class="seg rg-seg" data-rk="${esc(k)}">${[['ok', 'OK'], ['nok', 'NOK'], ['na', 'NA']].map(([c, l]) => `<button type="button" data-rv="${c}" class="${val === c ? 'on ' + c : ''}">${l}</button>`).join('')}</div>`;
  let tot = 0, ok = 0, nok = 0, na = 0;
  const partes = P.map(o => { const ids = o.itensProg || o.items || [];
    const sis = [...new Set(ids.map(id => parseInt(id)))];
    return `<div class="rg-parte"><h3>${esc(posCurtoE(v, o.pos))}${o.pos !== 'UN' ? `<label class="rg-hr">Horímetro na execução <input data-rgh="${o.pos}" inputmode="numeric" value="${esc(R.hr[o.pos] || '')}" placeholder="${o.alvoH ? 'alvo ' + nf(o.alvoH) : 'h'}"> h</label>` : ''}</h3>
     ${sis.map(sn => `<div class="rg-sis">${esc(SISTEMAS[sn - 1] || '')}</div>` + ids.filter(id => parseInt(id) === sn).map(id => { const t = A1M[id], k = o.pos + '|' + id, r = R.res[k] || ''; tot++; if (r === 'ok') ok++; if (r === 'nok') nok++; if (r === 'na') na++;
      return `<div class="rg-it ${r}" data-it="${esc(k)}"><span class="mono">${id}</span><span class="rg-tx">${esc(t.chk)}<small>${esc(EQN[t.eq] || t.eq)} · ${ivEmb(t, v, o.pos)}</small></span>${seg(k, r)}
        <input class="rg-obs" data-rgo="${esc(k)}" value="${esc(R.obs[k] || '')}" placeholder="${r === 'nok' || r === 'na' ? 'Motivo (obrigatório)' : 'Obs.'}">
        ${t.meds.length ? `<div class="rg-meds">${t.meds.map((m, i) => { const md = (R.med[k] || [])[i] || {}; return `<span>${esc(m[0])} <i>(${esc(m[1])} ${esc(m[2] || '')})</i> <input data-rgm="${esc(k)}|${i}|enc" value="${esc(md.enc || '')}" placeholder="encontrado" inputmode="decimal"><input data-rgm="${esc(k)}|${i}|dei" value="${esc(md.dei || '')}" placeholder="deixado" inputmode="decimal" class="${medFora(m, md.dei) ? 'out' : ''}"></span>`; }).join('')}</div>` : ''}</div>`; }).join('')).join('')}</div>`; }).join('');
  const regs = rgRegs(P), pend = fechada ? [] : rgPend(P), f = o1.fotos || [];
  return `<div class="vh"><div><h1>OM ${esc(o1.num)} · ${esc(v ? v.nome : o1.vessel)} · preventiva da janela</h1><p>Lance aqui a ficha que voltou da equipe de terra: uma tela para a OM inteira. Emitida em ${brD(o1.emitAt)} · ${tot} itens em ${P.length} ${P.length === 1 ? 'parte' : 'partes'}.</p></div><span class="sp"></span>
    <button class="mbtn" data-ficha="${o1.id}">🖨 Imprimir ficha</button></div>${bar}<p class="note" style="margin:-4px 0 10px">Anexo II-B de cada parte (gerado na aprovação): ${P.map(o => `<a href="#om/${o.id}">${esc(posCurtoE(v, o.pos))}</a>`).join(' · ')}</p>
   ${fechada ? `<div class="banner info">OM encerrada. Somente leitura. Os PDFs do Anexo II-B de cada parte estão no Drive.</div>` : ''}
   <div ${ro ? 'inert' : ''} id="rgForm">
   <div class="card"><div class="row"><h2>1 · Dados da execução</h2></div><div class="g">
    ${inp('dreal', 'Data da execução', 's2', 'type="date"')}${inp('inicio', 'Início', 's2', 'type="datetime-local"')}${inp('termino', 'Término', 's2', 'type="datetime-local"')}
    ${rgExecHTML(R)}${inp('indispH', 'Empurrador parado para a manutenção (h)', 's2', 'inputmode="decimal" placeholder="0 se não parou"')}
    <label class="f s2">Gerou resíduo?<select data-rg="resid"><option value="">Escolha…</option>${['Não', 'Sim'].map(x => `<option${R.resid === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>${inp('fr016', 'Nº FR 016_E', 's2')}${inp('pt', 'Nº da PT do SESMT (se houver)', 's2')}
    ${inp('justif', 'Justificativa (se passou da hora-alvo)', 's6')}
    <label class="f s6">Materiais e peças usados <small class="note">um por linha: peça · quantidade · nº da RM</small><textarea data-rg="matsTxt" rows="3" placeholder="Correia A-38 · 1 · RM 55100">${esc(R.matsTxt || '')}</textarea></label>
    <label class="f s6">Observações <small class="note">o que encontrou, o que não deu para fazer e por quê</small><textarea data-rg="obsGeral" rows="2">${esc(R.obsGeral || '')}</textarea></label></div>${rgProvaHTML(P[0], R)}</div>
   <div class="card"><div class="row"><h2>2 · Itens da ficha</h2><span class="sp"></span><span class="note" id="rgCnt">${ok} OK · ${nok} NOK · ${na} NA · ${tot - ok - nok - na} sem marcação</span><button class="mbtn" data-rgall="ok">Marcar todos sem marcação como OK</button></div>
    <p class="note">Copie da ficha: OK = feito e conforme. NOK = não conforme ou não feito (escreva o motivo). Todo NOK fica como "falha sem OM" na Frota até ganhar uma corretiva ou ser marcado "não é falha" (só não foi feito). NA = não se aplica. Item NOK ou NA não conta como feito: continua vencido e volta na próxima programação.</p>${partes}</div>
   ${regs.length ? `<div class="card"><h2>3 · Registros exigidos por estes itens</h2><div class="g">${regs.map(r => `<label class="f s3">${REGN[r]}<input data-rgr="${r}" value="${esc(R.regs[r] || '')}"></label>`).join('')}</div></div>` : ''}
   <div class="card"><h2>${regs.length ? 4 : 3} · Fotos (antes e depois)</h2><div class="phgrid">${f.map((x, i) => RG_PROVA.includes(x.tipo) ? '' : `<div class="phc"><div class="img">${x.src ? `<img src="${x.src}" alt="Foto ${i + 1}">` : '<div class="note" style="padding:20px">Foto no PDF do Drive</div>'}<span class="no">Foto ${i + 1}</span>${x.fid ? '<span class="ph-nv ok" title="Cópia guardada no Google Drive">☁ no Drive</span>' : x.src ? '<span class="ph-nv" title="Sobe ao Drive quando houver sinal">só neste aparelho</span>' : ''}</div>
     <div class="meta"><select data-rgf="${i}|tipo">${['ANTES', 'DURANTE', 'DEPOIS'].map(t => `<option${t === x.tipo ? ' selected' : ''}>${t}</option>`).join('')}</select><input data-rgf="${i}|leg" placeholder="Legenda (o que mostra)" value="${esc(x.leg || '')}"><button class="xbtn" data-rgfdel="${i}" aria-label="Remover foto">✕</button></div></div>`).join('')}
    <label class="addph cam"><span style="font-size:28px;line-height:1">📷</span>Tirar foto<small>abre a câmera · vai direto para o formulário</small><input type="file" id="rgFoto" accept="image/*" capture="environment"></label><label class="addph"><span style="font-size:28px;line-height:1">🖼</span>Da galeria<small>escolher uma ou várias fotos já tiradas</small><input type="file" id="rgFoto" accept="image/*" multiple></label></div></div>
   </div>
   <div class="card rg-fim"><h2>${regs.length ? 5 : 4} · Conferência e encerramento</h2>
    ${fechada ? '<p class="note">Encerrada.</p>' : pend.length ? `<div class="banner warn"><b>Falta:</b> ${pend.map(esc).join(' · ')}</div>` : '<div class="banner ok">Tudo preenchido. Pode aprovar.</div>'}
    ${fechada ? '' : `<div class="row"><button class="mbtn" data-rgact="salvar">💾 Salvar</button>${st !== 'conferencia' ? '<button class="mbtn" data-rgact="conf">Enviar para conferência</button>' : ''}<span class="sp"></span><button class="mbtn ok" data-rgact="aprovar" ${pend.length ? 'disabled' : ''}>✓ Aprovar a OM inteira e gerar os PDFs</button></div><p class="note">Ao aprovar, cada parte (motor / embarcação) gera o seu Anexo II-B com a mesma OM ${esc(o1.num)}. Itens OK passam a contar como feitos; NOK/NA continuam vencidos.</p>`}</div>`;
}
async function rgAplicar(P) {
  const R = rgDados(P), v = vessel(P[0].vessel), regs = rgRegs(P);
  P.forEach((o, n) => { const ids = o.itensProg = o.itensProg || (o.items || []).slice();
    o.items = ids.filter(id => R.res[o.pos + '|' + id] === 'ok');
    o.naoExec = ids.filter(id => R.res[o.pos + '|' + id] && R.res[o.pos + '|' + id] !== 'ok').map(id => ({ id, r: R.res[o.pos + '|' + id], motivo: R.obs[o.pos + '|' + id] || '' }));
    o.conf = {}; o.passosFicha = true; o.items.forEach(id => { const k = o.pos + '|' + id; o.conf[id] = { steps: [], meds: (R.med[k] || []).map(x => ({ enc: x.enc || '', dei: x.dei || '' })) }; });   // passos: conforme o formulário assinado (foto), nunca marcados automaticamente
    o.dreal = R.dreal || ''; o.inicio = R.inicio || o.inicio || ''; o.termino = R.termino || ''; rgExecAplicar(o, R);
    o.hreal = o.pos === 'UN' ? (R.hr[mpos(o.vessel)] || Object.values(R.hr)[0] || '') : (R.hr[o.pos] || '');
    if (o.pos === 'UN' && !o.hreal) { const hr = horAtual(o.vessel, mpos(o.vessel)); o.hreal = hr ? hr.h : ''; }
    o.indispH = n === 0 ? (R.indispH || '0') : '0'; o.resid = R.resid || ''; o.residT = R.resid === 'Sim' ? (o.residT || ['Óleo usado']) : []; o.fr016 = R.fr016 || ''; o.pt = R.pt || ''; o.justif = R.justif || '';
    o.obsGeral = R.obsGeral || ''; o.mats = String(R.matsTxt || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const c = l.split(/\s*[·;|]\s*/); return [c[0] || '', c[1] || '', c.slice(2).join(' ') || '']; });   // vão para o PDF do Anexo II-B
    o.reg = Object.assign({}, o.reg || {}, R.regs); o.teste = 'Itens conferidos conforme o formulário de execução assinado pelo executor e por quem recebeu a bordo (foto anexa à OM)' + (o.naoExec.length ? '; não executados: ' + o.naoExec.map(x => x.id + ' (' + x.r.toUpperCase() + (x.motivo ? ': ' + x.motivo : '') + ')').join(', ') : '');
    o.criterio = 'Especificação do Anexo I (NP 055)'; o.resultado = 'Conforme'; o.anomalia = o.anomalia && o.anomalia !== 'Não' ? o.anomalia : 'Não'; o.omCorr = o.omCorr || 'N/A';
    o.condEnc = o.condEnc || 'Conforme ficha de execução da OM ' + o.num + '.'; o.origem = o.origem || 'Plano (ClickUp)';
    o.liberacao = o.liberacao || (R.termino || (R.dreal ? R.dreal + 'T17:00' : '')); });
  for (const o of P) await saveRec(o);
}
AFTER.omg = function () {
  const m = $('#main'), P = omGrupo(ARG); if (!P.length) return; const R = rgDados(P);
  const cnt = () => { let t = 0, a = 0, b = 0, c = 0; m.querySelectorAll('.rg-it').forEach(el => { t++; if (el.classList.contains('ok')) a++; if (el.classList.contains('nok')) b++; if (el.classList.contains('na')) c++; }); const x = $('#rgCnt'); if (x) x.textContent = `${a} OK · ${b} NOK · ${c} NA · ${t - a - b - c} sem marcação`; };
  m.oninput = m.onchange = async e => { const t = e.target; if (!can.edit()) return;
    if (t.dataset.rg) { R[t.dataset.rg] = t.value; if (e.type === 'change' && ['execTipo', 'relTerc'].includes(t.dataset.rg)) { await saveRec(P[0]); render(); return; } } else if (t.dataset.rgh) R.hr[t.dataset.rgh] = t.value.replace(/\D/g, ''); else if (t.dataset.rgo) R.obs[t.dataset.rgo] = t.value; else if (t.dataset.rgr) R.regs[t.dataset.rgr] = t.value;
    else if (t.dataset.rgm) { const [p, id, i, f] = t.dataset.rgm.split('|'), k = p + '|' + id; R.med[k] = R.med[k] || []; R.med[k][i] = R.med[k][i] || {}; R.med[k][i][f] = t.value; if (f === 'dei') t.classList.toggle('out', medFora(A1M[id].meds[i], t.value)); }
    else if (t.dataset.rgf) { const [i, f] = t.dataset.rgf.split('|'); P[0].fotos[i][f] = t.value; }
    else if (t.dataset.rgprova && e.type === 'change') { const tipo = t.dataset.rgprova; for (const f of t.files) { const src = await comprimir(f); P[0].fotos = (P[0].fotos || []).filter(x => x.tipo !== tipo); P[0].fotos.push({ src, tipo, leg: tipo === 'FORMULÁRIO ASSINADO' ? 'Formulário de execução assinado pelo executor e por quem recebeu a bordo' : 'Relatório técnico do fornecedor (NP 5.8)', at: Date.now() }); } await saveRec(P[0]); render(); return; }
    else if (t.id === 'rgFoto' && e.type === 'change') { for (const f of t.files) { const src = await comprimir(f); P[0].fotos = P[0].fotos || []; P[0].fotos.push({ src, tipo: P[0].fotos.some(x => x.tipo === 'ANTES') ? 'DEPOIS' : 'ANTES', leg: '', at: Date.now() }); } await saveRec(P[0]); render(); return; }
    else return;
    rgSalvar(P); };
  m.onclick = async e => { const t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.ficha) return fichaModal(S.recs.get(t.dataset.ficha));
    if (t.dataset.rv) { if (!can.edit()) return; const s = t.closest('[data-rk]'), k = s.dataset.rk, it = t.closest('.rg-it'), v = R.res[k] === t.dataset.rv ? '' : t.dataset.rv; R.res[k] = v;
      s.querySelectorAll('button').forEach(b => b.className = b.dataset.rv === v ? 'on ' + v : ''); it.className = 'rg-it ' + v; const ob = it.querySelector('.rg-obs'); if (ob) ob.placeholder = v === 'nok' || v === 'na' ? 'Motivo (obrigatório)' : 'Obs.'; cnt(); rgSalvar(P); return; }
    if (t.dataset.rgall) { if (!can.edit()) return; P.forEach(o => (o.itensProg || o.items || []).forEach(id => { const k = o.pos + '|' + id; if (!R.res[k]) R.res[k] = 'ok'; })); await saveRec(P[0]); render(); return; }
    if (t.dataset.rgfdel) { P[0].fotos.splice(+t.dataset.rgfdel, 1); await saveRec(P[0]); render(); return; }
    if (t.dataset.rgact === 'salvar') { clearTimeout(RG.t); await saveRec(P[0]); toast('Salvo.'); render(); return; }
    if (t.dataset.rgact === 'conf') { if (!precisa(false)) return; clearTimeout(RG.t); await rgAplicar(P); await grpAvancar(ARG, 'conferencia'); toast('OM ' + P[0].num + ' enviada para conferência.'); render(); return; }
    if (t.dataset.rgact === 'aprovar') { if (!precisa(true)) return; clearTimeout(RG.t); if (rgPend(P).length) return toast('Ainda há pendências.');
      t.disabled = true; t.textContent = 'Gerando PDFs…'; await rgAplicar(P); await grpAvancar(ARG, 'conferencia');
      const falha = []; P.forEach(o => { const g = gateIIB(o).filter(x => !x[1]); if (g.length) falha.push(posCurtoE(vessel(o.vessel), o.pos) + ': ' + g.map(x => x[0]).join(', ')); });
      if (falha.length) { toast('Não foi possível aprovar: ' + falha.join(' | '), 9000); render(); return; }
      for (const o of P) await aprovarOM(o); toast('OM ' + P[0].num + ' aprovada: ' + P.length + (P.length === 1 ? ' PDF gerado.' : ' PDFs gerados.'), 5000); render(); return; } };
};
{ const s = SECOES.find(x => x.id === 'exec'); if (s) s.extra = (s.extra || []).concat(['omg']); }

/* ---------- 5 · Rotina do dia: o que fazer, em ordem, por embarcação ---------- */
function rotinaDados() {
  return S.cfg.frota.map(v => {
    if (foraOp(v)) return { v, fora: true };
    const P = painelVessel(v), venc = P.filter(x => x.t.kind === 'prog' && x.s.st === 'venc' && !x.om && !foraJanela(x.t.id, x.v || v, x.pos)), viag = P.filter(x => x.t.kind === 'prog' && x.s.st === 'viag' && !x.om && !foraJanela(x.t.id, x.v || v, x.pos));
    const abertas = oms().filter(o => o.vessel === v.id && o.tipo === 'P' && o.status !== 'encerrada'), gs = [...new Set(abertas.map(o => o.grupo || o.id))];
    const om = gs.map(g => { const L = abertas.filter(o => (o.grupo || o.id) === g); return { g, L, num: L[0].num, st: grpStatus(L), grp: !!L[0].grupo, id: L[0].id }; }).sort((a, b) => grpOrd.indexOf(a.st) - grpOrd.indexOf(b.st))[0];
    const corr = oms().filter(o => o.vessel === v.id && o.tipo === 'C' && o.status !== 'encerrada');
    const hr = horAtual(v.id, mpos(v.id)), dHr = hr ? Math.floor((hoje() - pD(hr.date)) / 864e5) : null, crit = bloqueioSaida(v.id).length;
    return { v, venc, viag, om, corr, hr, dHr, crit };
  });
}
function rotinaPasso(x) {
  if (x.fora) return { n: 0, txt: 'Fora de operação', btn: '' };
  if (x.om) { const o = x.om, L = x.om.grp ? `#omg/${encodeURIComponent(o.g)}` : `#om/${o.id}`;
    if (o.st === 'emitida') return { n: 2, txt: `OM ${esc(o.num)} emitida: imprimir a ficha e entregar à equipe de terra`, btn: `<button class="mbtn sm" data-ficha="${o.id}">🖨 Ficha</button><button class="mbtn sm pri" data-rtadv="${esc(o.g)}|abordo|${o.grp ? 1 : 0}">Iniciar execução</button>` };
    if (o.st === 'abordo') return { n: 3, txt: `OM ${esc(o.num)} em execução pela equipe de terra`, btn: `<button class="mbtn sm pri" data-rtadv="${esc(o.g)}|executada|${o.grp ? 1 : 0}">Terminou a execução</button>` };
    if (o.st === 'executada') return { n: 4, txt: `OM ${esc(o.num)} executada: lançar a ficha que voltou`, btn: `<a class="mbtn sm pri" href="${L}">Lançar a ficha</a>` };
    if (o.st === 'conferencia') return { n: 5, txt: `OM ${esc(o.num)} lançada: conferir e aprovar`, btn: `<a class="mbtn sm pri" href="${L}">Conferir e aprovar</a>` }; }
  const n = x.venc.length + x.viag.length;
  if (n) return { n: 1, txt: `${x.venc.length ? `<b style="color:#D93025">${x.venc.length} vencidos</b>` : ''}${x.venc.length && x.viag.length ? ' + ' : ''}${x.viag.length ? x.viag.length + ' vencem na próxima viagem' : ''}: programar a OM`, btn: `<a class="mbtn sm pri" href="#emitir/${x.v.id}">Programar OM</a>` };
  return { n: 6, txt: 'Em dia: nada a programar', btn: '' };
}
{ const s = SECOES.find(x => x.id === 'inicio'); if (s) { s.nome = '0 · Rotina do dia'; s.views.unshift(['rotina', 'Rotina do dia']); s.views = s.views.slice(0, 1); }
  const pg = { id: 'painel', nome: '1 · Painel de gestão', views: [['geral', 'Painel de gestão']] }; ICO.painel = ICO.inicio; const i = SECOES.findIndex(x => x.id === 'inicio'); SECOES.splice(i + 1, 0, pg);
  ICO.inicio = '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'; }
if (!location.hash) { try { history.replaceState(null, '', '#rotina'); } catch (e) { } if (typeof VIEW !== 'undefined' && VIEW === 'geral' && S.cfg) { VIEW = 'rotina'; } }

