/* ===== SMF enxuto (proposta do Supervisor, 24/10/2026: "está muito confuso e trabalhoso") =====
   Liga com ?simples (fica gravado no aparelho); ?completo volta ao SMF completo. No modo completo este arquivo não muda nada.
   Operação
   · Preventiva: escolher o empurrador → o que está vencido e o que vence no mês já vem marcado → nº da OM do Sankhya → Anexo II-B em PDF
     → "Lançar realizado" (data, horímetro, quem executou, quem recebeu, foto do II-B assinado) → OM encerrada e o cronograma conta dali.
   · Corretiva: OM aberta no Sankhya → registrar aqui e gerar o Anexo II-A → "Lançar realizado"; serviço do Anexo I refeito reinicia o vencimento.
   · Cronograma (cxr) e Anexo I (matriz): telas existentes, alimentadas pelas OMs encerradas.
   · Troca de óleo: situação por empurrador e o FR 049_B oficial (lubAbrirForm). O Analista (role 'op') só vê esta tela.
   Acompanhamento: Condição dos motores, Calibração e docagem, Indicadores (telas existentes). Suporte: Administração.
   Fora do modo enxuto: FR 027_L, falhas sem OM, painel da frota e o ciclo 1 → 4. Os registros são os mesmos do SMF completo (kind 'om', 'hor', 'lub'). */
'use strict';
const SP_MODO = (() => {
  try {
    const q = location.search;
    if (/[?&]simples\b/.test(q)) localStorage.setItem('smf_modo', 'simples');
    if (/[?&]completo\b/.test(q)) localStorage.setItem('smf_modo', 'completo');
    return localStorage.getItem('smf_modo') === 'simples';
  } catch (e) { return /[?&]simples\b/.test(location.search); }
})();

if (SP_MODO) {
  /* ---------- menu ---------- */
  const SPS = [
    { id: 'sp1', g: 'op', ico: 'prev', nome: 'Preventiva', views: [['sp_prev', 'Preventiva']], extra: ['omg', 'emitir', 'oms', 'omconf'] },
    { id: 'sp2', g: 'op', ico: 'corr', nome: 'Corretiva', views: [['sp_corr', 'Corretiva']], extra: ['om', 'falhas2'] },
    { id: 'sp3', g: 'op', ico: 'cron', nome: 'Cronograma', views: [['cxr', 'Cronograma preventivo'], ['matriz', 'Anexo I']] },
    { id: 'sp4', g: 'op', ico: 'oleo', nome: 'Troca de óleo', views: [['sp_oleo', 'Troca de óleo']], analista: true },
    { id: 'sp5', g: 'ac', ico: 'cond', nome: 'Condição dos motores', views: [['horfrota', 'Horímetros'], ['oleo', 'Óleo da frota'], ['anoleo', 'Análise de óleo'], ['parmcp', 'Parâmetros do MCP'], ['compr', 'Compressão do MCP']] },
    { id: 'sp6', g: 'ac', ico: 'calib', nome: 'Calibração e docagem', views: [['controle', 'Calibração e docagem']] },
    { id: 'sp7', g: 'ac', ico: 'kpi', nome: 'Indicadores', views: [['kpi', 'Indicadores e riscos']] },
    { id: 'sp8', g: 'su', ico: 'adm', nome: 'Administração', views: [['admin', 'Administração']] },
  ];
  SECOES.splice(0, SECOES.length, ...SPS);
  const SP_ICO = {
    prev: '<path d="M9 4h6v2H9z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 12l2 2 4-4"/>',
    corr: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.8-.4-.4-2.8z"/>',
    cron: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h3M14 14h3M7 17h3"/>',
    oleo: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
    cond: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    calib: '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M12 3v2"/>',
    kpi: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    adm: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  };
  const spIco = k => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SP_ICO[k] || ''}</svg>`;
  const spAnalista = () => !!S.session && S.session.role !== 'admin';
  const spOp = () => S.cfg.frota.filter(v => !foraOp(v));

  /* ---------- contas usadas pelas telas (guardadas até o próximo registro gravado) ---------- */
  const SPC = { k: '', r: null };
  const spChave = () => (S.recs.__v || 0) + '|' + S.recs.size + '|' + isoD(hoje());
  function spPend(v) {   // o que a equipe de terra faz: vencido e vence no mês, sem OM aberta; troca de óleo (FR 049_B) e docagem ficam fora
    return painelVessel(v, viagemDe(v)).filter(x => x.t.kind === 'prog' && !x.om && !foraJanela(x.t.id, v, x.pos))
      .map(x => Object.assign(x, { g: emGrp(v, x) })).filter(x => x.g === 'venc' || x.g === 'mes');
  }
  function spDados() {
    const k = spChave(); if (SPC.r && SPC.k === k) return SPC.r;
    const frota = spOp().map(v => { const P = spPend(v); return { v, P, venc: P.filter(x => x.g === 'venc').length, mes: P.filter(x => x.g === 'mes').length }; });
    const G = new Map();
    oms().filter(o => o.tipo === 'P' && !o.excluido).forEach(o => { const g = o.grupo || o.id; if (!G.has(g)) G.set(g, o.grupo ? omGrupo(o.grupo) : [o]); });
    const grupos = [...G.entries()].map(([g, P]) => ({ g, P, o: P[0], fechada: P.every(o => o.status === 'encerrada') }));
    const corr = oms().filter(o => o.tipo === 'C' && !o.excluido);
    const oleo = lubDados().filter(x => !foraOp(x.v));
    SPC.k = k; SPC.r = { frota, grupos, corr, oleo }; return SPC.r;
  }
  const spCont = () => { const D = spDados(); return {
    sp1: D.grupos.filter(x => !x.fechada).length,
    sp2: D.corr.filter(o => o.status !== 'encerrada').length, sp2red: D.corr.some(o => o.status !== 'encerrada' && /Crít|Alta/.test(o.classe || '')),
    sp4: D.oleo.filter(x => x.s.st === 'venc' && !x.om).length, sp4red: true }; };

  renderNav = function () {
    const nav = $('#nav'); if (!nav) return;
    const an = spAnalista(), cur = secDe(VIEW); let C = {}; try { C = S.session ? spCont() : {}; } catch (e) { }
    const item = s => { const n = C[s.id] || 0; return `<a href="#${s.views[0][0]}" class="${s === cur ? 'on' : ''}">${spIco(s.ico)}<span>${s.nome}</span>${n ? `<span class="n${C[s.id + 'red'] ? '' : ' blue'}">${n}</span>` : ''}</a>`; };
    const grp = (g, t) => { const L = SPS.filter(s => s.g === g && (!an || s.analista)); return L.length ? `<div class="grp-t">${t}</div>` + L.map(item).join('') : ''; };
    nav.innerHTML = grp('op', 'Operação') + grp('ac', 'Acompanhamento') + grp('su', 'Suporte') + (an ? '' : '<a class="sp-modo" href="?completo" title="Volta ao SMF com todas as telas">↩ SMF completo</a>');
  };
  abasHtml = function () {
    const s = secDe(VIEW); if (!s || s.views.length < 2 || !s.views.some(x => x[0] === VIEW)) return '';
    return `<nav class="abas" aria-label="${esc(s.nome)}"><span class="abas-t">${esc(s.nome)}</span>${s.views.map(([k, l]) => `<a href="#${k}" class="${k === VIEW ? 'on' : ''}">${l}</a>`).join('')}</nav>`;
  };
  /* telas que saíram do modo enxuto levam para a tela nova; o Analista só abre a Troca de óleo */
  const SP_TROCA = { '': 'sp_prev', geral: 'sp_prev', rotina: 'sp_prev', hoje: 'sp_prev', emitir: 'sp_prev', oms: 'sp_prev', omconf: 'sp_prev', acomp: 'sp_prev', falhas2: 'sp_corr', regs: 'sp_prev' };
  { const r0 = render; render = function () {
    if (S.session) {
      const alvo = spAnalista() ? (VIEW === 'sp_oleo' ? '' : 'sp_oleo') : SP_TROCA[VIEW] || '';
      if (alvo) { VIEW = alvo; ARG = ''; try { history.replaceState(null, '', '#' + alvo); } catch (e) { } }
    }
    return r0.apply(this, arguments);
  }; }

  /* ---------- peças comuns ---------- */
  const spPill = g => g === 'venc' ? '<span class="pill p-bad">Vencido</span>' : g === 'mes' ? '<span class="pill p-warn">Vence no mês</span>' : g === 'viag' ? '<span class="pill p-warn">Trocar antes de sair</span>' : g === 'ok' ? '<span class="pill p-ok">Em dia</span>' : '<span class="pill p-mut">Sem histórico</span>';
  const spClasse = c => `<span class="pill ${/Crít/.test(c || '') ? 'p-bad' : /Alta/.test(c || '') ? 'p-warn' : 'p-mut'}">${esc(c || '—')}</span>`;
  const spNum = s => String(s || '').replace(/\D/g, '');
  const spHead = (t, p, btn) => `<div class="vh"><div><h1>${t}</h1><p>${p}</p></div><span class="sp"></span>${btn || ''}</div>`;
  const spResumo = L => `<div class="sp-res">${L.map(([l, n, c]) => `<div><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${n}</b></div>`).join('')}</div>`;
  const spPdfNome = (tipo, o) => `Anexo_${tipo}_OM${o.num}_${vName(o.vessel).replace(/\s+/g, '_')}.pdf`;
  async function spBaixar(pages, nome) {
    toast('Gerando o PDF…', 2500);
    try { const pdf = await gerarPDF(pages); pdf.save(nome); return pdf; }
    catch (e) { toast('Não foi possível gerar o PDF: ' + e.message, 6000); return null; }
  }
  const spGrupoDe = g => { const P = omGrupo(g); if (P.length) return P; const o = S.recs.get(g); return o ? [o] : []; };
  const spDocsIIB = P => P.reduce((a, o) => a.concat(docIIB(o)), []);
  async function spFoto(input) { const f = input.files && input.files[0]; if (!f) return null; try { return await comprimir(f); } catch (e) { toast('Não consegui ler a foto.'); return null; } }
  const spExecHTML = (pre) => `<label class="f s2">Quem executou<select id="spExT"><option value="equipe">Equipe de manutenção</option><option value="terceiro">Terceiro (prestador)</option></select></label>
     <label class="f s4">Nomes (ou empresa e responsável técnico)<input id="spExN" placeholder="Ex.: João (mecânico), Pedro (auxiliar)" value="${esc(pre.execn || '')}"></label>
     <label class="f s2">Recebido a bordo por<select id="spRcF"><option>Comandante</option><option>Coordenador de Operações</option></select></label>
     <label class="f s4">Nome de quem recebeu<input id="spRcN" value="${esc((pre.receb || {}).nome || '')}"></label>`;
  function spExecLer() {
    const t = $('#spExT').value, n = $('#spExN').value.trim(), rf = $('#spRcF').value, rn = $('#spRcN').value.trim();
    return { t, n, rf, rn, falta: [!n && 'quem executou', !rn && 'quem recebeu a bordo'].filter(Boolean) };
  }
  function spExecAplicar(o, X) {
    o.exec = X.t === 'terceiro' ? 'Terceiro' : 'Equipe de manutenção'; o.execn = X.n;
    o.receb = { func: X.rf, nome: X.rn };
    o.ass = Object.assign({}, o.ass || {}, { exec: X.n, cmd: X.rn + ' (' + X.rf + ')' });
    if (X.t === 'terceiro') o.relTerc = o.relTerc || 'Fornecedor não emitiu — Supervisor preenche';
  }
  const spFotoBox = (id, txt) => `<label class="addph sp-foto" id="${id}B"><span style="font-size:26px;line-height:1">📄</span>${txt}<small>obrigatória · câmera ou galeria</small><input type="file" id="${id}" accept="image/*"></label>`;
  function spFotoLigar(id, alvo) {
    const i = $('#' + id); if (!i) return;
    i.onchange = async () => { const src = await spFoto(i); if (!src) return; alvo.src = src; const b = $('#' + id + 'B'); b.classList.add('ok'); b.innerHTML = `<img src="${src}" alt="" style="max-height:110px;border-radius:6px">Foto anexada<small>toque para trocar</small>`; b.appendChild(i); };
  }

  /* =====================================================================
     PREVENTIVA
     ===================================================================== */
  const SPP = { sel: {}, vid: '' };
  function vSpPrev() {
    if (ARG) return vSpPrevEmp(ARG);
    const D = spDados(), ab = D.grupos.filter(x => !x.fechada).sort((a, b) => String(a.o.emitAt || '').localeCompare(String(b.o.emitAt || '')));
    const enc = D.grupos.filter(x => x.fechada).sort((a, b) => Math.max(...b.P.map(o => o.fechadoAt || 0)) - Math.max(...a.P.map(o => o.fechadoAt || 0))).slice(0, 8);
    const F = D.frota.slice().sort((a, b) => b.venc - a.venc || b.mes - a.mes || a.v.nome.localeCompare(b.v.nome, 'pt', { numeric: true }));
    const tV = F.reduce((a, x) => a + x.venc, 0), tM = F.reduce((a, x) => a + x.mes, 0);
    const itn = P => P.reduce((a, o) => a + (o.itensProg || o.items || []).length, 0);
    const emps = F.map(x => { const abre = ab.find(y => y.o.vessel === x.v.id);
      return `<a class="sp-emp${x.venc ? ' bad' : x.mes ? ' warn' : ' ok'}" href="#sp_prev/${x.v.id}"><b>${esc(x.v.nome)}</b>
        <span>${x.venc ? `<i class="bad">${x.venc} vencido${x.venc > 1 ? 's' : ''}</i>` : ''}${x.mes ? `<i class="warn">${x.mes} no mês</i>` : ''}${!x.venc && !x.mes ? '<i class="ok">nada pendente</i>' : ''}</span>
        ${abre ? `<small>OM ${esc(abre.o.num)} aberta</small>` : `<small>${x.venc || x.mes ? 'Programar →' : ''}</small>`}</a>`; }).join('');
    const linhaAb = x => `<div class="sp-li"><div class="sp-li-t"><div><b>OM ${esc(x.o.num)}</b> · ${esc(vName(x.o.vessel))}</div><small>emitida em ${brD(x.o.emitAt)} · ${itn(x.P)} ${itn(x.P) === 1 ? 'item' : 'itens'}${x.o.alvoD ? ' · data-limite ' + brD(x.o.alvoD) : ''}</small></div>
       <div class="sp-li-b"><button class="mbtn sm" data-sppdf="${esc(x.g)}">📄 Anexo II-B</button><button class="mbtn sm pri" data-splan="${esc(x.g)}">✔ Lançar realizado</button></div></div>`;
    const linhaEnc = x => { const h = x.P.find(o => o.pdfFileId); const feitos = x.P.reduce((a, o) => a + (o.items || []).length, 0);
      return `<div class="sp-li"><div class="sp-li-t"><div><b>OM ${esc(x.o.num)}</b> · ${esc(vName(x.o.vessel))}</div><small>realizada em ${brD(x.o.dreal)} · ${feitos} ${feitos === 1 ? 'item feito' : 'itens feitos'}${x.o.execn ? ' · ' + esc(x.o.execn) : ''}</small></div>
       <div class="sp-li-b">${h ? drivePdf(h.pdfFileId, '📄 PDF no Drive') : ''}<button class="mbtn sm" data-sppdf="${esc(x.g)}">Baixar PDF</button></div></div>`; };
    return spHead('Preventiva', 'Escolha o empurrador, gere o Anexo II-B e, quando o serviço voltar assinado, lance o realizado.')
      + spResumo([['Itens vencidos', tV, tV ? 'var(--badt)' : 'var(--okt)'], ['Vencem neste mês', tM, tM ? 'var(--warnt)' : ''], ['OMs para lançar', ab.length, ab.length ? '#1967D2' : '']])
      + `<div class="card"><h2>1 · Escolha o empurrador</h2><p class="note" style="margin:-4px 0 10px">Conta só o serviço da equipe de terra. Troca de óleo fica na aba Troca de óleo.</p><div class="sp-emps">${emps}</div></div>`
      + `<div class="card"><h2>2 · OMs para lançar o realizado · ${ab.length}</h2>${ab.map(linhaAb).join('') || '<p class="note">Nenhuma OM preventiva aberta.</p>'}</div>`
      + `<div class="card"><h2>Realizadas recentemente</h2>${enc.map(linhaEnc).join('') || '<p class="note">Nenhuma ainda.</p>'}</div>`;
  }
  function vSpPrevEmp(vid) {
    const v = vessel(vid); if (!v) return '<div class="empty">Empurrador não encontrado.</div>';
    const P = spPend(v), ab = spDados().grupos.filter(x => !x.fechada && x.o.vessel === vid);
    if (SPP.vid !== vid || !SPP.sel[vid]) { SPP.vid = vid; SPP.sel[vid] = new Set(P.map(x => x.pos + '|' + x.t.id)); }
    const sel = SPP.sel[vid], ps = posicoes(v).filter(p => P.some(x => x.pos === p));
    const motores = mcpPos(v).concat(MCAS.filter(k => v.mca && v.mca[k]));
    const horBox = motores.map(p => { const h = horAtual(v.id, p); return `<label class="f s2">${esc(posCurtoE(v, p))}<input data-sphor="${p}" inputmode="numeric" placeholder="${h ? nf(h.h) + ' h em ' + brD(h.date) : 'sem leitura'}"></label>`; }).join('');
    const grupo = p => { const L = P.filter(x => x.pos === p).sort((a, b) => (a.g === 'venc' ? 0 : 1) - (b.g === 'venc' ? 0 : 1)), hr = horAtual(v.id, p === 'UN' ? mpos(v.id) : p);
      return `<div class="sp-pos"><div class="sp-pos-h"><b>${esc(posCurtoE(v, p))}</b>${p !== 'UN' && hr ? `<span class="note">horímetro ${nf(hr.h)} h</span>` : ''}<span class="sp"></span><button class="mbtn sm" data-sptodos="${p}">marcar todos</button></div>
        ${L.map(x => { const k = x.pos + '|' + x.t.id; return `<label class="sp-it"><input type="checkbox" data-spk="${esc(k)}"${sel.has(k) ? ' checked' : ''}><span class="mono">${esc(x.t.id)}</span><span class="sp-it-t">${esc(x.t.chk || x.t.item)}<small>${esc(EQN[x.t.eq] || x.t.eq)} · ${esc(x.s.txt || '')}</small></span>${spPill(x.g)}</label>`; }).join('')}</div>`; };
    const n = sel.size;
    return spHead(`Preventiva · ${esc(v.nome)}`, 'Vencidos e o que vence no mês já vêm marcados. Desmarque o que não vai fazer agora.', '<a class="mbtn" href="#sp_prev">← Voltar</a>')
      + (ab.length ? `<div class="banner info">Este empurrador já tem ${ab.length === 1 ? 'a OM' : 'as OMs'} ${ab.map(x => '<b>' + esc(x.o.num) + '</b>').join(', ')} aberta${ab.length > 1 ? 's' : ''}. Os itens dela${ab.length > 1 ? 's' : ''} não aparecem aqui. <a href="#sp_prev">Lançar o realizado</a></div>` : '')
      + `<div class="card"><h2>Horímetros de hoje <span class="note" style="font-weight:400">(opcional)</span></h2><p class="note" style="margin:-4px 0 8px">Se tiver a leitura do dia, informe: o vencimento por horas fica exato.</p><div class="g">${horBox}</div><div class="row"><button class="mbtn sm" data-act="spHor">Atualizar horímetros</button></div></div>`
      + `<div class="card"><h2>O que fazer · ${P.length} ${P.length === 1 ? 'item' : 'itens'}</h2>${ps.map(grupo).join('') || '<p class="note">Nada vencido nem vencendo neste mês. 👍</p>'}</div>`
      + (P.length ? `<div class="card sp-gerar"><h2>Gerar o Anexo II-B</h2><p class="note" style="margin:-4px 0 10px">Abra a OM no Sankhya e digite o número aqui. Sai um PDF do Anexo II-B para a equipe executar e assinar.</p>
         <div class="row"><label class="f" style="min-width:200px">Nº da OM no Sankhya<input id="spNum" inputmode="numeric" placeholder="Ex.: 48231"></label><span class="sp"></span>
         <button class="mbtn pri" data-act="spGerar" ${n ? '' : 'disabled'}>📄 Gerar Anexo II-B · ${n} ${n === 1 ? 'item' : 'itens'}</button></div><div class="note" id="spErr" style="color:var(--badt)"></div></div>` : '');
  }
  async function spGerarIIB(v) {
    const n = spNum($('#spNum').value), err = $('#spErr'), sel = SPP.sel[v.id];
    if (n.length < 3) { err.textContent = 'Digite o número da OM gerado no Sankhya (só números).'; return; }
    if (oms().some(o => o.num === n && !o.excluido)) { err.textContent = 'Já existe uma OM com o número ' + n + ' no SMF.'; return; }
    if (!sel || !sel.size) { err.textContent = 'Marque pelo menos um item.'; return; }
    const P = spPend(v), por = {};
    [...sel].forEach(k => { const [p, id] = k.split('|'); if (P.some(x => x.pos === p && x.t.id === id)) (por[p] = por[p] || []).push(id); });
    const idn = id => id.split('.').map(x => String(+x).padStart(3, '0')).join('.');
    const partes = posicoes(v).filter(p => por[p]).map(p => {
      const ids = por[p].sort((a, b) => idn(a) < idn(b) ? -1 : 1), sits = ids.map(id => P.find(x => x.pos === p && x.t.id === id).s);
      const hs = sits.map(s => s.alvoH).filter(x => x), ds = sits.map(s => s.alvoD).filter(x => x), hr = horAtual(v.id, p === 'UN' ? mpos(v.id) : p);
      return { pos: p, ids, hr, alvoH: p === 'UN' ? null : hs.length ? Math.min(...hs) : null, alvoD: ds.length ? isoD(new Date(Math.min(...ds))) : null };
    });
    const b = document.querySelector('[data-act="spGerar"]'); if (b) { b.disabled = true; b.textContent = 'Gerando…'; }
    const L = []; let i = 0;
    for (const p of partes) {
      const o = { id: uid('om'), kind: 'om', tipo: 'P', num: n, grupo: n, parte: ++i, partes: partes.length, vessel: v.id, pos: p.pos, items: p.ids.slice(), itensProg: p.ids.slice(), status: 'emitida', emitAt: isoD(hoje()), emitBy: S.session.name,
        alvoH: p.alvoH, alvoD: p.alvoD, hEmit: p.hr ? p.hr.h : null, conf: {}, extras: [], fotos: [], exec: 'Equipe de manutenção', execTerra: true, origem: 'Cronograma preventivo (SMF)', hist: [{ at: Date.now(), by: S.session.name, ev: 'Emitida (SMF enxuto)' }] };
      await saveRec(o); L.push(o);
    }
    delete SPP.sel[v.id];
    await spBaixar(spDocsIIB(L), spPdfNome('II-B', L[0]));
    toast('OM ' + n + ' emitida para ' + v.nome + '. Quando voltar assinada, lance o realizado.', 5000);
    location.hash = '#sp_prev';
  }
  async function spHorSalvar(v) {
    const ins = $$('#main [data-sphor]').filter(i => spNum(i.value)); if (!ins.length) return toast('Digite pelo menos uma leitura.');
    const d = isoD(hoje()), ruins = [];
    for (const i of ins) { const p = i.dataset.sphor, h = +spNum(i.value); const tot = (typeof horPainelTotal === 'function' && horPainelTotal(v.id, p, h, d)) || h;
      if (!(await lubHor(v.id, p, tot, d, 'Preventiva (SMF enxuto)'))) ruins.push(posCurtoE(v, p)); }
    toast(ruins.length ? 'Não gravei ' + ruins.join(', ') + ': a leitura não bate com as anteriores (menor que a última ou repetida).' : 'Horímetros atualizados.', ruins.length ? 7000 : 2500);
    delete SPP.sel[v.id]; render();
  }
  function spLancarPrev(g) {
    if (!precisa(true)) return;
    const P = spGrupoDe(g); if (!P.length) return; const o1 = P[0], v = vessel(o1.vessel); if (!v) return;
    const foto = { src: null };
    const parte = o => { const ids = o.itensProg || o.items || [], hp = o.pos === 'UN' ? null : o.pos, hr = hp ? horAtual(v.id, hp) : null;
      return `<div class="sp-pos"><div class="sp-pos-h"><b>${esc(posCurtoE(v, o.pos))}</b><span class="sp"></span>${hp ? `<label class="sp-hr">Horímetro <input data-splh="${o.id}" inputmode="numeric" value="${hr ? hr.h : ''}"> h</label>` : ''}</div>
        ${ids.map(id => `<label class="sp-it"><input type="checkbox" data-spf="${o.id}|${id}" checked><span class="mono">${esc(id)}</span><span class="sp-it-t">${esc(A1M[id] ? A1M[id].chk : id)}</span></label>`).join('')}</div>`; };
    modal(`<h2>Lançar realizado · OM ${esc(o1.num)} · ${esc(v.nome)}</h2>
      <p class="note">Copie do Anexo II-B assinado. Desmarque o item que <b>não</b> foi feito: ele continua pendente e volta na próxima programação.</p>
      <div class="g"><label class="f s2">Data da execução<input id="spDt" type="date" value="${isoD(hoje())}" max="${isoD(hoje())}"></label>${spExecHTML(o1)}</div>
      ${P.map(parte).join('')}
      <div class="phgrid" style="margin-top:10px">${spFotoBox('spFt', 'Foto do Anexo II-B assinado')}</div>
      <div class="note" id="spLE" style="color:var(--badt)"></div>
      <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn ok" id="spLOk">✔ Encerrar OM e baixar o PDF</button></div>`, true);
    spFotoLigar('spFt', foto);
    $('#spLOk').onclick = async () => {
      const X = spExecLer(), dt = $('#spDt').value, falta = X.falta.slice(); if (!dt) falta.unshift('data da execução'); if (!foto.src) falta.push('foto do Anexo II-B assinado');
      if (falta.length) { $('#spLE').textContent = 'Falta: ' + falta.join(', ') + '.'; return; }
      const bt = $('#spLOk'); bt.disabled = true; bt.textContent = 'Encerrando…';
      const marc = new Set($$('#modal [data-spf]').filter(c => c.checked).map(c => c.dataset.spf));
      const hrs = {}; $$('#modal [data-splh]').forEach(i => { hrs[i.dataset.splh] = spNum(i.value); });
      for (const o of P) {
        const ids = o.itensProg = o.itensProg || (o.items || []).slice();
        o.items = ids.filter(id => marc.has(o.id + '|' + id)); o.naoExec = ids.filter(id => !marc.has(o.id + '|' + id)).map(id => ({ id, r: 'na', motivo: 'não executado (lançamento do SMF enxuto)' }));
        o.conf = {}; o.items.forEach(id => { o.conf[id] = { steps: [], meds: [] }; }); o.passosFicha = true;
        o.dreal = dt; o.inicio = o.inicio || dt + 'T07:00'; o.termino = dt + 'T17:00'; spExecAplicar(o, X);
        let h = o.pos === 'UN' ? '' : +hrs[o.id] || '';
        if (h && o.pos !== 'UN') { const tot = (typeof horPainelTotal === 'function' && horPainelTotal(v.id, o.pos, h, dt)) || h; h = tot; await lubHor(v.id, o.pos, h, dt, 'OM ' + o.num); }
        if (o.pos === 'UN') { const hr = horEm(v.id, mpos(v.id), dt) || horAtual(v.id, mpos(v.id)); h = hr ? hr.h : ''; }
        o.hreal = h; o.indispH = o.indispH || '0'; o.resid = o.resid || 'Não'; o.resultado = 'Conforme'; o.anomalia = 'Não'; o.omCorr = 'N/A'; o.criterio = 'Especificação do Anexo I (NP 055)';
        o.teste = 'Itens conferidos conforme o Anexo II-B assinado pelo executor e por quem recebeu a bordo (foto anexa)' + (o.naoExec.length ? '; não executados: ' + o.naoExec.map(x => x.id).join(', ') : '');
        o.condEnc = o.condEnc || 'Conforme o Anexo II-B assinado da OM ' + o.num + '.';
        o.status = 'encerrada'; o.fechadoAt = Date.now(); o.aprovBy = S.session.name; o.aprovAt = isoDT(hoje()); o.liberacao = o.termino;
        (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Realizado lançado e OM encerrada (SMF enxuto): ' + o.items.length + ' de ' + ids.length + ' itens' });
      }
      P[0].fotos = (P[0].fotos || []).filter(x => x.tipo !== 'FORMULÁRIO ASSINADO').concat([{ src: foto.src, tipo: 'FORMULÁRIO ASSINADO', leg: 'Anexo II-B assinado pelo executor e por quem recebeu a bordo', at: Date.now() }]);
      let b64 = null; toast('Gerando o PDF…', 3000);
      const Pf = P.filter(o => (o.items || []).length), pg = spDocsIIB(Pf.length ? Pf : P).concat(Pf.length && !Pf.includes(P[0]) ? numerar(paginasFotos(P[0], 'Fotos da OM ' + P[0].num)) : []);   /* parte sem nenhum item feito não entra no PDF final */
      try { const pdf = await gerarPDF(pg); b64 = pdf.output('datauristring').split(',')[1]; pdf.save(spPdfNome('II-B', P[0])); } catch (e) { toast('OM encerrada, mas o PDF não saiu: ' + e.message, 7000); }
      for (let i = 0; i < P.length; i++) await saveRec(P[i], i === 0 && b64 ? { pdfB64: b64 } : {});
      closeModal(); toast('OM ' + o1.num + ' encerrada. O cronograma já conta a partir de ' + brD(dt) + '. Anexe o PDF na OM do Sankhya.', 6500); render();
    };
  }
  VX.sp_prev = vSpPrev;
  AFTER.sp_prev = function () {
    const m = $('#main');
    m.onchange = e => { const t = e.target; if (t.dataset.spk) { const s = SPP.sel[ARG]; if (!s) return; t.checked ? s.add(t.dataset.spk) : s.delete(t.dataset.spk); const n = s.size, b = document.querySelector('[data-act="spGerar"]'); if (b) { b.disabled = !n; b.textContent = `📄 Gerar Anexo II-B · ${n} ${n === 1 ? 'item' : 'itens'}`; } } };
    m.onclick = async e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.sptodos) { const s = SPP.sel[ARG]; spPend(vessel(ARG)).filter(x => x.pos === t.dataset.sptodos).forEach(x => s.add(x.pos + '|' + x.t.id)); render(); return; }
      if (t.dataset.act === 'spGerar') { if (!precisa(true)) return; await spGerarIIB(vessel(ARG)); return; }
      if (t.dataset.act === 'spHor') { if (!precisa(false)) return; await spHorSalvar(vessel(ARG)); return; }
      if (t.dataset.sppdf) { const P = spGrupoDe(t.dataset.sppdf); if (P.length) await spBaixar(spDocsIIB(P), spPdfNome('II-B', P[0])); return; }
      if (t.dataset.splan) return spLancarPrev(t.dataset.splan); };
  };

  /* =====================================================================
     CORRETIVA
     ===================================================================== */
  const SP_ORD = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
  function vSpCorr() {
    const C = spDados().corr, ab = C.filter(o => o.status !== 'encerrada').sort((a, b) => (SP_ORD[a.classe] ?? 9) - (SP_ORD[b.classe] ?? 9) || String(a.abertura || '').localeCompare(String(b.abertura || '')));
    const enc = C.filter(o => o.status === 'encerrada').sort((a, b) => (b.fechadoAt || 0) - (a.fechadoAt || 0)).slice(0, 15);
    const atras = ab.filter(o => { try { return omAtrasada(o); } catch (e) { return false; } }).length;
    const linha = o => `<div class="sp-li"><div class="sp-li-t"><div><b>OM ${esc(o.num || '—')}</b> · ${esc(vName(o.vessel))} ${spClasse(o.classe)}</div><small>${esc((o.descricao || '').split('\n')[0])}${o.abertura ? ' · aberta em ' + brDT(o.abertura) : ''}</small></div>
       <div class="sp-li-b"><button class="mbtn sm" data-spcpdf="${o.id}">📄 Anexo II-A</button><button class="mbtn sm pri" data-spclan="${o.id}">✔ Lançar realizado</button></div></div>`;
    const linhaE = o => `<div class="sp-li"><div class="sp-li-t"><div><b>OM ${esc(o.num || '—')}</b> · ${esc(vName(o.vessel))} ${spClasse(o.classe)}</div><small>${esc((o.descricao || '').split('\n')[0])} · encerrada em ${brD(String(o.termino || o.liberacao || '').slice(0, 10) || isoD(new Date(o.fechadoAt || 0)))}${(o.itensRefeitos || []).length ? ' · refez ' + o.itensRefeitos.map(k => k.split('|')[1]).join(', ') : ''}</small></div>
       <div class="sp-li-b">${o.pdfFileId ? drivePdf(o.pdfFileId, '📄 PDF no Drive') : ''}<button class="mbtn sm" data-spcpdf="${o.id}">Baixar PDF</button></div></div>`;
    return spHead('Corretiva', 'A OM nasce no Sankhya. Registre aqui, gere o Anexo II-A e, depois do conserto, lance o realizado.', '<button class="mbtn pri" data-act="spNovaC">+ Nova corretiva</button>')
      + spResumo([['Abertas', ab.length, ab.length ? '#1967D2' : ''], ['Crítica ou Alta', ab.filter(o => /Crít|Alta/.test(o.classe || '')).length, 'var(--badt)'], ['Fora do prazo de início', atras, atras ? 'var(--badt)' : 'var(--okt)']])
      + `<div class="card"><h2>Abertas · ${ab.length}</h2>${ab.map(linha).join('') || '<p class="note">Nenhuma corretiva aberta.</p>'}</div>`
      + `<div class="card"><h2>Encerradas recentemente</h2>${enc.map(linhaE).join('') || '<p class="note">Nenhuma ainda.</p>'}</div>`;
  }
  function spNovaCorr() {
    if (!precisa(true)) return;
    const F = spOp(), agora = isoDT(hoje());
    const posOpts = v => posicoes(v).map(p => `<option value="${p}">${esc(p === 'UN' ? 'Embarcação (geral)' : posCurtoE(v, p))}</option>`).join('');
    modal(`<h2>Nova corretiva</h2><p class="note">Use o número da OM que você abriu no Sankhya. Sai o Anexo II-A em PDF para a equipe.</p>
      <div class="g">
       <label class="f s2">Nº da OM no Sankhya<input id="ncN" inputmode="numeric"></label>
       <label class="f s2">Empurrador<select id="ncV">${F.map(v => `<option value="${v.id}">${esc(v.nome)}</option>`).join('')}</select></label>
       <label class="f s2">Onde<select id="ncP">${F[0] ? posOpts(F[0]) : ''}</select></label>
       <label class="f s3">Sistema<select id="ncS">${SISTEMAS.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
       <label class="f s3">Equipamento / componente<input id="ncE" placeholder="Ex.: bomba de água bruta"></label>
       <label class="f s6">O que aconteceu<textarea id="ncD" rows="3" placeholder="Descreva a falha"></textarea></label>
       <label class="f s2">Classe<select id="ncC">${Object.keys(CLASSES).map(c => `<option${c === 'Média' ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
       <label class="f s2">Local<select id="ncL"><option>Terminal</option><option>Em viagem</option></select></label>
       <label class="f s2">Aberta em<input id="ncA" type="datetime-local" value="${agora}"></label>
      </div><div class="note" id="ncI"></div><div class="note" id="ncErr" style="color:var(--badt)"></div>
      <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="ncOk">📄 Registrar e gerar Anexo II-A</button></div>`, true);
    const info = () => { const c = CLASSES[$('#ncC').value]; $('#ncI').innerHTML = c ? `Prazo para começar: <b>${esc(c.prazo)}</b> · ${esc(c.acao)}` : ''; };
    $('#ncC').onchange = info; info();
    $('#ncV').onchange = () => { const v = vessel($('#ncV').value); $('#ncP').innerHTML = posOpts(v); };
    $('#ncOk').onclick = async () => {
      const n = spNum($('#ncN').value), d = $('#ncD').value.trim(), er = $('#ncErr');
      if (n.length < 3) { er.textContent = 'Digite o número da OM do Sankhya (só números).'; return; }
      if (oms().some(o => o.num === n && !o.excluido)) { er.textContent = 'Já existe uma OM com o número ' + n + ' no SMF.'; return; }
      if (!d) { er.textContent = 'Descreva o que aconteceu.'; return; }
      const cl = $('#ncC').value, ab = $('#ncA').value || agora, vid = $('#ncV').value, pos = $('#ncP').value, hr = horAtual(vid, pos === 'UN' ? mpos(vid) : pos);
      const o = { id: uid('om'), kind: 'om', tipo: 'C', num: n, vessel: vid, pos, status: 'aberta', abertura: ab, deteccao: ab, sistema: $('#ncS').value, equip: $('#ncE').value.trim(), classe: cl, descricao: d, local: $('#ncL').value,
        horimetro: hr ? hr.h : '', origem: 'OM do Sankhya', interd: cl === 'Crítica' ? 'Sim' : 'N/A', interdDT: cl === 'Crítica' ? ab : '', fotos: [], hist: [{ at: Date.now(), by: S.session.name, ev: 'Aberta (SMF enxuto)' }] };
      $('#ncOk').disabled = true; await saveRec(o); closeModal();
      await spBaixar(docIIA(o), spPdfNome('II-A', o)); toast('Corretiva OM ' + n + ' registrada.'); render();
    };
  }
  function spLancarCorr(id) {
    if (!precisa(true)) return;
    const o = S.recs.get(id); if (!o) return; const v = vessel(o.vessel); if (!v) return;
    const foto = { src: null }, sel = new Set(o.itensRefeitos || []);
    const lista = () => { const q = BQ_NORM(($('#lcQ') || {}).value || ''), p = ($('#lcP') || {}).value || o.pos;
      return A1.filter(t => t.kind === 'prog' && aplica(v, p, t) && (!q || BQ_NORM(t.id + ' ' + t.item + ' ' + (t.chk || '') + ' ' + t.eq).includes(q))).map(t => { const k = p + '|' + t.id;
        return `<label class="sp-it"><input type="checkbox" data-lck="${esc(k)}"${sel.has(k) ? ' checked' : ''}><span class="mono">${esc(t.id)}</span><span class="sp-it-t">${esc(t.chk || t.item)}<small>${esc(EQN[t.eq] || t.eq)} · ${esc(t.freq || '')}</small></span></label>`; }).join('') || '<p class="note">Nenhum item do plano aqui.</p>'; };
    const ps = posicoes(v);
    modal(`<h2>Lançar realizado · OM ${esc(o.num)} · ${esc(v.nome)}</h2><p class="note">${esc((o.descricao || '').split('\n')[0])} · ${esc(o.classe || '')}</p>
      <div class="g"><label class="f s3">Início do conserto<input id="lcI" type="datetime-local" value="${esc(o.inicio || o.abertura || '')}"></label><label class="f s3">Término<input id="lcT" type="datetime-local" value="${isoDT(hoje())}"></label>
       <label class="f s6">O que foi feito<textarea id="lcS" rows="3" placeholder="Serviços executados, peças trocadas">${esc(o.servicos || '')}</textarea></label>
       ${spExecHTML(o)}
       <label class="f s6">Causa provável <span class="note">(opcional)</span><input id="lcC" value="${esc(o.causa || '')}"></label></div>
      <details class="sp-ref"${sel.size ? ' open' : ''}><summary><b>Refez algum serviço do Anexo I por completo?</b> <span class="note">(ex.: trocou a correia junto) · o vencimento desse item volta a contar da data de término</span></summary>
       <div class="g"><label class="f s2">Onde<select id="lcP">${ps.map(p => `<option value="${p}"${p === o.pos ? ' selected' : ''}>${esc(p === 'UN' ? 'Embarcação (geral)' : posCurtoE(v, p))}</option>`).join('')}</select></label><label class="f s4">Buscar<input id="lcQ" placeholder="nº do item, peça, serviço…"></label></div>
       <div id="lcL" style="max-height:34vh;overflow:auto">${lista()}</div><div class="note" id="lcN">${sel.size ? sel.size + ' marcado(s)' : ''}</div></details>
      <div class="phgrid" style="margin-top:10px">${spFotoBox('lcF', 'Foto do Anexo II-A assinado')}</div>
      <div class="note" id="lcE" style="color:var(--badt)"></div>
      <div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn ok" id="lcOk">✔ Encerrar OM e baixar o PDF</button></div>`, true);
    spFotoLigar('lcF', foto);
    const sync = () => { $$('#lcL [data-lck]').forEach(c => c.checked ? sel.add(c.dataset.lck) : sel.delete(c.dataset.lck)); $('#lcN').textContent = sel.size ? sel.size + ' marcado(s)' : ''; };
    $('#lcL').onchange = sync; $('#lcP').onchange = () => { sync(); $('#lcL').innerHTML = lista(); }; $('#lcQ').oninput = () => { sync(); $('#lcL').innerHTML = lista(); };
    $('#lcOk').onclick = async () => {
      sync(); const X = spExecLer(), T = $('#lcT').value, srv = $('#lcS').value.trim(), falta = [];
      if (!T) falta.push('término'); if (!srv) falta.push('o que foi feito'); falta.push(...X.falta); if (!foto.src) falta.push('foto do Anexo II-A assinado');
      if (falta.length) { $('#lcE').textContent = 'Falta: ' + falta.join(', ') + '.'; return; }
      const bt = $('#lcOk'); bt.disabled = true; bt.textContent = 'Encerrando…';
      o.inicio = $('#lcI').value || o.inicio || o.abertura; o.termino = T; o.liberacao = T; o.servicos = srv; o.causa = $('#lcC').value.trim(); spExecAplicar(o, X);
      o.itensRefeitos = [...sel]; o.teste = 'Conforme o Anexo II-A assinado (foto anexa)'; o.criterio = 'Funcionamento normal do equipamento'; o.resultado = 'Conforme'; o.resid = o.resid || 'Não';
      o.fotos = (o.fotos || []).filter(x => x.tipo !== 'FORMULÁRIO ASSINADO').concat([{ src: foto.src, tipo: 'FORMULÁRIO ASSINADO', leg: 'Anexo II-A assinado pelo executor e por quem recebeu a bordo', at: Date.now() }]);
      o.status = 'encerrada'; o.fechadoAt = Date.now(); o.aprovBy = S.session.name; o.aprovAt = isoDT(hoje()); o.dreal = T.slice(0, 10);
      (o.hist = o.hist || []).push({ at: Date.now(), by: S.session.name, ev: 'Realizado lançado e OM encerrada (SMF enxuto)' + (o.itensRefeitos.length ? '; refeitos: ' + o.itensRefeitos.map(k => k.replace('|', ' ')).join(', ') : '') });
      let b64 = null; toast('Gerando o PDF…', 3000);
      try { const pdf = await gerarPDF(docIIA(o)); b64 = pdf.output('datauristring').split(',')[1]; pdf.save(spPdfNome('II-A', o)); } catch (e) { toast('OM encerrada, mas o PDF não saiu: ' + e.message, 7000); }
      await saveRec(o, b64 ? { pdfB64: b64 } : {});
      closeModal(); toast('OM ' + o.num + ' encerrada.' + (o.itensRefeitos.length ? ' ' + o.itensRefeitos.length + ' item(ns) do Anexo I reiniciado(s) no cronograma.' : '') + ' Anexe o PDF na OM do Sankhya.', 6500); render();
    };
  }
  VX.sp_corr = vSpCorr;
  AFTER.sp_corr = function () {
    $('#main').onclick = async e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.act === 'spNovaC') return spNovaCorr();
      if (t.dataset.spclan) return spLancarCorr(t.dataset.spclan);
      if (t.dataset.spcpdf) { const o = S.recs.get(t.dataset.spcpdf); if (o) await spBaixar(docIIA(o), spPdfNome('II-A', o)); } };
  };

  /* =====================================================================
     TROCA DE ÓLEO (FR 049_B) · tela do Analista
     ===================================================================== */
  function vSpOleo() {
    const L = spDados().oleo, ord = { venc: 0, viag: 1, sem: 2, ok: 3, cond: 4 }, por = new Map();
    L.forEach(x => { if (!por.has(x.v.id)) por.set(x.v.id, []); por.get(x.v.id).push(x); });
    const pior = A => Math.min(...A.map(x => ord[x.s.st] ?? 5));
    const E = [...por.entries()].map(([vid, A]) => ({ v: vessel(vid), A: A.sort((a, b) => (ord[a.s.st] ?? 5) - (ord[b.s.st] ?? 5)), p: pior(A) })).sort((a, b) => a.p - b.p || a.v.nome.localeCompare(b.v.nome, 'pt', { numeric: true }));
    const nV = L.filter(x => x.s.st === 'venc').length, nA = L.filter(x => x.s.st === 'viag').length, hj = isoD(hoje()), mes = hj.slice(0, 7);
    const feitas = recs('lub').filter(r => r.tipo === 'fr049' && String(r.date || '').startsWith(mes)).length;
    const ult = x => x.s.L ? `${brD(x.s.L.date)}${x.s.L.h != null ? ' · ' + nf(x.s.L.h) + ' h' : ''}` : '—';
    const prox = x => [x.s.alvoH != null ? nf(x.s.alvoH) + ' h' : '', x.s.alvoD ? brD(isoD(x.s.alvoD)) : ''].filter(Boolean).join(' ou ') || '—';
    const card = ({ v, A, p }) => `<div class="card sp-ol ${p === 0 ? 'bad' : p === 1 ? 'warn' : ''}"><div class="sp-pos-h"><h2 style="margin:0">${esc(v.nome)}</h2><span class="sp"></span><button class="mbtn ${p <= 1 ? 'pri' : ''} sm" data-sploleo="${v.id}">📝 Lançar troca (FR 049_B)</button></div>
      <div class="tw"><table class="t"><thead><tr><th>Equipamento</th><th>Última troca</th><th>Próxima</th><th class="r">Falta</th><th>Situação</th></tr></thead><tbody>
      ${A.map(x => `<tr><td><b>${esc(x.e.nome)}</b><div class="note">${esc(x.e.mod || '')}</div></td><td class="mono">${ult(x)}</td><td class="mono">${x.saida ? 'a cada saída' : prox(x)}</td><td class="r mono">${x.saida ? '—' : esc(lubVal(x))}</td><td>${spPill(x.s.st)}${x.om ? `<div class="note">OM ${esc(x.om.num)}</div>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
    return spHead('Troca de óleo', 'FR 049_B · executa o CTF/MFM a bordo, recebe o Supervisor. Ao salvar o formulário, a troca e o horímetro entram aqui sozinhos.', '<button class="mbtn" data-act="spF16">🖨 FR 016_E (resíduos)</button>')
      + spResumo([['Trocas vencidas', nV, nV ? 'var(--badt)' : 'var(--okt)'], ['Trocar antes da próxima viagem', nA, nA ? 'var(--warnt)' : ''], ['FR 049_B lançados no mês', feitas]])
      + E.map(card).join('');
  }
  VX.sp_oleo = vSpOleo;
  AFTER.sp_oleo = function () {
    $('#main').onclick = async e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.sploleo) return lubAbrirForm(t.dataset.sploleo);
      if (t.dataset.act === 'spF16') return lubAbrirFr016(); };
  };

  /* ---------- estilo ---------- */
  { const st = document.createElement('style'); st.textContent = `
#nav a.sp-modo{margin-top:18px;font-size:12px;opacity:.65}#nav a.sp-modo:hover{opacity:1}
.sp-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 14px}
.sp-res>div{background:#fff;border:1px solid #DADCE0;border-radius:10px;padding:10px 14px;display:flex;flex-direction:column;gap:2px}
.sp-res span{font-size:12px;color:#5F6368}.sp-res b{font-size:24px;font-weight:600;line-height:1.15}
.sp-emps{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.sp-emp{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid #DADCE0;border-left:4px solid #9AA0A6;border-radius:10px;background:#fff;color:inherit;text-decoration:none}
.sp-emp:hover{box-shadow:0 2px 8px rgba(60,64,67,.15)}.sp-emp.bad{border-left-color:#D93025}.sp-emp.warn{border-left-color:#F9AB00}.sp-emp.ok{border-left-color:#1E8E3E}
.sp-emp b{font-size:15px}.sp-emp span{display:flex;gap:8px;flex-wrap:wrap}.sp-emp i{font-style:normal;font-size:12.5px;font-weight:600}
.sp-emp i.bad{color:var(--badt)}.sp-emp i.warn{color:var(--warnt)}.sp-emp i.ok{color:var(--okt)}.sp-emp small{color:#1967D2;font-size:12px}
.sp-li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0;border-top:1px solid #EEF0F2}.sp-li:first-of-type{border-top:0}
.sp-li-t{flex:1;min-width:220px;display:flex;flex-direction:column;align-items:flex-start;gap:3px}.sp-li-t .pill{margin-left:6px}.sp-li-t small{color:#5F6368;font-size:12.5px}
.sp-li-b{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sp-pos{border:1px solid #E3E6EA;border-radius:10px;padding:8px 12px;margin:8px 0;background:#fff}
.sp-pos-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:2px 0 6px}
.sp-it{display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-top:1px solid #F1F3F4;cursor:pointer}
.sp-it input{margin-top:3px;width:18px;height:18px;flex:none}.sp-it .mono{min-width:44px;color:#5F6368;font-size:12.5px;padding-top:2px}
.sp-it-t{flex:1;display:flex;flex-direction:column;gap:1px}.sp-it-t small{color:#5F6368;font-size:12px}
.sp-hr input{width:90px;margin-left:4px}
.sp-gerar{border:1px solid #C6DAFC;background:#F8FBFF}
.sp-foto{min-height:110px}.sp-foto.ok{border-color:var(--okt,#137333);color:var(--okt,#137333)}
.sp-ref{margin:10px 0;padding:8px 12px;border:1px solid #E3E6EA;border-radius:10px}.sp-ref summary{cursor:pointer;padding:4px 0}
.sp-ol.bad{border-left:4px solid #D93025}.sp-ol.warn{border-left:4px solid #F9AB00}
@media (max-width:640px){.sp-li-b{width:100%}.sp-li-b .mbtn{flex:1;justify-content:center}.sp-emps{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st); }
}
