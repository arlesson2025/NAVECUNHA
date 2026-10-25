/* =====================================================================
   BIBLIOTECA · documentos (manuais, fluxogramas, SESMT, NRs, SGI),
   terceirizados e treinamentos (NP 055 itens 4.10, 5.8, 5.11 e 10)
   Arquivos enviados vão para o Google Drive: pasta "Biblioteca/<categoria>".
   ===================================================================== */
'use strict';
const BIB_CAT = [
  ['fluxo', 'Fluxogramas e mapas mentais', '<path d="M4 4h6v6H4zM14 14h6v6h-6zM7 10v4a3 3 0 0 0 3 3h4"/>'],
  ['manual', 'Manuais e catálogos de fabricante', '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>'],
  ['sgi', 'Procedimentos e formulários (SGI)', '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'],
  ['sesmt', 'SESMT · APR, PT e regras', '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'],
  ['norma', 'NRs, NORMAM e normas', '<path d="M5 21V4h14v17l-7-4z"/>'],
  ['outros', 'Outros', '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'],
];
const bicon = (p, s) => `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
// documentos que já fazem parte do sistema (não precisam de cadastro)
const BIB_FIXOS = [
  { cat: 'fluxo', titulo: 'Fluxo do processo de manutenção (PDCA)', desc: 'Plano (Anexo I) → cronograma → programação → execução → controle → análise → melhoria (PDCA)', abre: 'fluxo' },
  { cat: 'fluxo', titulo: 'Procedimento de troca de óleo (FR 049_B)', desc: 'Preparar, drenar, filtros, abastecer, conferir, registrar, resíduos', abre: '#plano' },
  { cat: 'sgi', titulo: 'NP Navecunha 055 · Plano de Gestão de Manutenção', desc: 'Procedimento vigente (revisão em aprovação)', url: '../docs/NP_Navecunha_055_corrigida.html' },
  { cat: 'sgi', titulo: 'Anexo I · Matriz de manutenção preventiva', desc: 'Itens, frequências, métodos e registros', url: '../docs/Anexo_I_NP_055_visual_matriz.html' },
  { cat: 'sgi', titulo: 'Matriz técnica de equipamentos e lubrificação', desc: 'Modelos, óleos, volumes e intervalos da frota', url: '../docs/Matriz_tecnica.atual17.10.26.html' },
  { cat: 'sgi', titulo: 'FR 049_B Rev.03 · Troca de óleo, filtros e fluidos', desc: 'Preencher pelo sistema (Lubrificação) ou imprimir', url: '../docs/FR_049_B_Rev03_Troca_de_Oleo.html' },
  { cat: 'sgi', titulo: 'FR 016_E · Controle de materiais Classe I e II', desc: 'Entrega de resíduos ao SGI (NP 5.7)', abre: 'fr016' },
  { cat: 'norma', titulo: 'NR-06 · Equipamento de proteção individual', desc: 'Sugestão: anexe o link oficial', sug: true },
  { cat: 'norma', titulo: 'NR-10 · Segurança em instalações elétricas', desc: 'NP 5.11.2: eletricidade acima de 50 V exige PT', sug: true },
  { cat: 'norma', titulo: 'NR-11 e NR-12 · Movimentação e máquinas', desc: 'NP 6.2: treinamento dos operadores', sug: true },
  { cat: 'norma', titulo: 'NR-30 · Segurança no trabalho aquaviário', desc: 'Sugestão: anexe o link oficial', sug: true },
  { cat: 'norma', titulo: 'NR-33 e NR-35 · Espaço confinado e altura', desc: 'NP 5.11.2: atividades de risco com PT', sug: true },
];
const SERV_TERC = ['Retífica / overhaul de motor', 'Calibração de bicos e bomba injetora', 'Análise de óleo (laboratório)', 'Elétrica e alternadores', 'Reversores', 'Solda e caldeiraria', 'Estaleiro / docagem', 'Hidráulica (governo)', 'Refrigeração', 'Eletrônica de navegação (T.I.)', 'Destinação de resíduos', 'Fornecedor de peças / lubrificantes', 'Outros'];
const TREIN_TIPOS = [['integ', 'Integração (admissão)', 0, 8], ['recic', 'Reciclagem anual', 12, 4], ['posf', 'Pós-falha Crítica/Alta', 0, 2], ['nr', 'NR / curso específico', 0, 0]];
const TREIN_N = Object.fromEntries(TREIN_TIPOS.map(t => [t[0], t[1]]));
const FUNCOES = ['CTF – Condutor Maquinista', 'MFM – Marinheiro de Máquinas', 'Comandante / Capitão Fluvial', 'Líder de Operação', 'Operador de Medição', 'Supervisor de Manutenção', 'Analista de Manutenção', 'Terceiro'];
const diasAte = d => d ? Math.round((pD(d) - pD(isoD(hoje()))) / 864e5) : null;   // dia contra dia (os dois ao meio-dia): vence no fim do dia, não ao meio-dia
const valSt = d => { const n = diasAte(d); return n === null ? 'sem' : n < 0 ? 'venc' : n <= 30 ? 'viag' : 'ok'; };
const valPill = (d, okTxt) => { const s = valSt(d), n = diasAte(d); return s === 'sem' ? '<span class="pill p-mut">sem validade</span>' : s === 'venc' ? `<span class="pill p-bad">vencido ${brD(d)}</span>` : s === 'viag' ? `<span class="pill p-warn">vence em ${n} d</span>` : `<span class="pill p-ok">${okTxt || 'válido até'} ${brD(d)}</span>`; };
function lerArquivo(f) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(f); }); }
function abrirDoc(r) {
  if (r.pdfFileId) { window.open('https://drive.google.com/file/d/' + r.pdfFileId + '/view', '_blank', 'noopener'); return; }
  const b = S.pdfPend[r.id];
  if (b) { const bin = atob(b), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const url = URL.createObjectURL(new Blob([u], { type: r.mime || 'application/octet-stream' })); window.open(url, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(url), 60000); return; }
  if (r.url) { window.open(r.url, '_blank', 'noopener'); return; }
  toast('Arquivo ainda não disponível neste aparelho.');
}

/* ---------- DOCUMENTOS ---------- */
const BB = { q: '', cat: '' };
function vBib() {
  const q = BB.q.trim().toLowerCase(), hit = s => !q || String(s || '').toLowerCase().includes(q);
  const D = recs('doc').filter(r => (!BB.cat || r.cat === BB.cat) && (hit(r.titulo) || hit(r.desc) || hit(r.equip) || hit(r.tags)));
  const F = BIB_FIXOS.filter(r => (!BB.cat || r.cat === BB.cat) && (hit(r.titulo) || hit(r.desc)) && !(r.sug && recs('doc').some(d => d.titulo.slice(0, 5) === r.titulo.slice(0, 5))));
  const cont = c => recs('doc').filter(r => r.cat === c).length + BIB_FIXOS.filter(r => r.cat === c && !r.sug).length;
  const item = (r, fixo) => `<div class="bitem${r.sug ? ' sug' : ''}">
     <div class="bic">${bicon(BIB_CAT.find(c => c[0] === r.cat)[2], 20)}</div>
     <div class="bxt"><b>${esc(r.titulo)}</b><span>${esc(r.desc || '')}${r.equip ? ' · ' + esc(EQN[r.equip] || r.equip) : ''}${r.rev ? ' · Rev. ' + esc(r.rev) : ''}${fixo ? (r.sug ? ' · <i>sugestão</i>' : ' · <i>do sistema</i>') : r.fileName ? ' · ' + esc(r.fileName) : r.url ? ' · link' : ''}</span></div>
     ${r.validade ? valPill(r.validade) : ''}
     <div class="bact">${fixo ? (r.sug ? `<button class="mbtn sm" data-bibnovo="${r.cat}" data-tit="${esc(r.titulo)}">＋ Anexar</button>` : `<button class="mbtn sm pri" data-bibfixo="${BIB_FIXOS.indexOf(r)}">Abrir</button>`)
       : `<button class="mbtn sm pri" data-bibabre="${r.id}">Abrir</button>${S.session ? `<button class="mbtn sm" data-bibed="${r.id}">Editar</button>` : ''}`}</div></div>`;
  const grupos = BIB_CAT.filter(c => !BB.cat || c[0] === BB.cat).map(([c, nome, ic]) => { const L = F.filter(r => r.cat === c).map(r => item(r, true)).concat(D.filter(r => r.cat === c).sort((a, b) => a.titulo.localeCompare(b.titulo)).map(r => item(r, false))); return L.length ? `<div class="card"><div class="row"><h2 style="display:flex;gap:8px;align-items:center">${bicon(ic)} ${nome}</h2><span class="sp"></span><button class="mbtn sm" data-bibnovo="${c}">＋ Adicionar</button></div><div class="blist">${L.join('')}</div></div>` : ''; }).join('');
  return `<div class="vh"><div><h1>Biblioteca</h1><p>Tudo o que a equipe precisa consultar, num lugar só: fluxogramas, manuais e catálogos dos fabricantes, procedimentos e formulários do SGI, regras do SESMT e normas. Os arquivos enviados ficam no Google Drive (pasta "Biblioteca").</p></div><span class="sp"></span><button class="mbtn pri" data-bibnovo="">＋ Adicionar documento</button></div>
   <div class="card"><div class="g"><label class="f s4">Buscar<input id="bbQ" value="${esc(BB.q)}" placeholder="título, equipamento, assunto…"></label></div>
    <div class="bchips"><button class="${!BB.cat ? 'on' : ''}" data-bibcat="">Todos</button>${BIB_CAT.map(([c, n]) => `<button class="${BB.cat === c ? 'on' : ''}" data-bibcat="${c}">${n.split(' · ')[0]} <small>${cont(c)}</small></button>`).join('')}</div></div>
   ${grupos || '<div class="card note">Nada encontrado.</div>'}`;
}
AFTER.bib = () => { const m = $('#main');
  m.oninput = e => { if (e.target.id === 'bbQ') { BB.q = e.target.value; clearTimeout(m._t); m._t = setTimeout(() => { render(); const i = $('#bbQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 350); } };
  m.onclick = e => {
    const c = e.target.closest('[data-bibcat]'); if (c) { BB.cat = c.dataset.bibcat; render(); return; }
    const n = e.target.closest('[data-bibnovo]'); if (n) { docModal(null, n.dataset.bibnovo, n.dataset.tit); return; }
    const a = e.target.closest('[data-bibabre]'); if (a) { abrirDoc(S.recs.get(a.dataset.bibabre)); return; }
    const ed = e.target.closest('[data-bibed]'); if (ed) { docModal(S.recs.get(ed.dataset.bibed)); return; }
    const f = e.target.closest('[data-bibfixo]'); if (f) { const r = BIB_FIXOS[+f.dataset.bibfixo]; if (r.url) window.open(r.url, '_blank', 'noopener'); else if (r.abre === 'fluxo') fluxoModal(); else if (r.abre === 'fr016') lubAbrirFr016(); else go(r.abre.slice(1)); }
  }; };
function docModal(r, cat, tit) {
  if (!precisa(false)) return;
  const o = r || { cat: cat || 'manual', titulo: tit || '' };
  modal(`<h2>${r ? 'Editar documento' : 'Adicionar à biblioteca'}</h2>
   <div class="g"><label class="f s6">Título<input id="dT" value="${esc(o.titulo)}" placeholder="ex.: Manual de serviço Mitsubishi S6R2"></label>
    <label class="f s3">Categoria<select id="dC">${BIB_CAT.map(([c, n]) => `<option value="${c}"${o.cat === c ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="f s3">Equipamento<select id="dE"><option value="">Geral (frota)</option>${Object.entries(EQN).map(([k, n]) => `<option value="${k}"${o.equip === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    <label class="f s6">Descrição<input id="dD" value="${esc(o.desc || '')}" placeholder="o que tem nele, para que serve"></label>
    <label class="f s2">Revisão / edição<input id="dR" value="${esc(o.rev || '')}"></label><label class="f s2">Validade (se tiver)<input id="dV" type="date" value="${esc(o.validade || '')}"></label><label class="f s2">Palavras-chave<input id="dK" value="${esc(o.tags || '')}" placeholder="bicos, torque…"></label>
    <label class="f s6">Arquivo (PDF, imagem, Word, Excel · até 10 MB)<input id="dF" type="file"></label>
    <label class="f s6">ou link (Google Drive, site do fabricante, gov.br…)<input id="dU" value="${esc(o.url || '')}" placeholder="https://"></label></div>
   ${o.fileName ? `<p class="note">Arquivo atual: ${esc(o.fileName)}. Escolha outro só se quiser substituir.</p>` : ''}
   <div class="note" id="dErr" style="color:var(--badt)"></div>
   <div class="row end">${r && can.admin() ? '<button class="mbtn" id="dX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="dOk">Salvar</button></div>`, true);
  const x = $('#dX'); if (x) x.onclick = () => confirmar('Excluir "' + o.titulo + '" da biblioteca?', async () => { r.excluido = true; await saveRec(r); closeModal(); toast('Excluído.'); render(); });
  $('#dOk').onclick = async () => {
    const t = $('#dT').value.trim(), f = $('#dF').files[0], u = $('#dU').value.trim();
    if (!t) { $('#dErr').textContent = 'Informe o título.'; return; }
    if (!f && !u && !o.fileName && !o.pdfFileId) { $('#dErr').textContent = 'Escolha um arquivo ou cole um link.'; return; }
    if (f && f.size > 10 * 1024 * 1024) { $('#dErr').textContent = 'Arquivo maior que 10 MB. Coloque no Google Drive e cole o link.'; return; }
    if (u && !/^https?:\/\//i.test(u)) { $('#dErr').textContent = 'O link precisa começar com http:// ou https://'; return; }
    const rec = Object.assign(r || { id: uid('doc'), kind: 'doc' }, { titulo: t, cat: $('#dC').value, equip: $('#dE').value, desc: $('#dD').value.trim(), rev: $('#dR').value.trim(), validade: $('#dV').value, tags: $('#dK').value.trim(), url: u, by: S.session.name });
    let b64 = null; if (f) { b64 = await lerArquivo(f); rec.fileName = f.name; rec.mime = f.type || 'application/octet-stream'; rec.size = f.size; }
    await saveRec(rec, b64 ? { pdfB64: b64 } : {});
    closeModal(); toast(b64 ? (S.url ? 'Salvo. O arquivo vai para o Google Drive na próxima sincronização.' : 'Salvo neste aparelho (sem nuvem configurada).') : 'Salvo.'); render();
  };
}
function fluxoModal() {
  const col = (t, cls, L) => `<div class="fxcol"><b>${t}</b>${L.map(([a, b], i) => `<div class="fxb ${cls}"><b>${a}</b><span>${b}</span></div>${i < L.length - 1 ? '<i>↓</i>' : ''}`).join('')}</div>`;
  modal(`<div class="row"><h2>Fluxo do processo de manutenção (PDCA)</h2><span class="sp"></span><button class="mbtn" onclick="window.print()">🖨 Imprimir</button><button class="mbtn" data-close>Fechar</button></div>
   <div class="fx">${col('Início · planejar', 'p', [['Anexo I + matriz', 'o que fazer e quando'], ['Horímetro', 'FR 027_L, toda chegada'], ['Painel de comando', 'o que vence na viagem'], ['Programação da janela', 'programação e material antes da saída']])}<div class="fxa">→</div>
   ${col('Meio · executar', 't', [['Executar', 'porto ou a bordo'], ['Registrar', 'II-B, FR 049_B, fotos'], ['Falha? Corretiva', 'II-A, classe, RNC'], ['Conferir e encerrar', 'Supervisor aprova']])}<div class="fxa">→</div>
   ${col('Fim · analisar', 'p', [['Condição da frota', 'compressão, óleo, falhas'], ['Indicadores de desempenho (KPI) · NP 055', 'disponibilidade, MTBF, MTTR'], ['Relatório mensal', 'gerência e SGI'], ['Melhorar', 'eficácia, rever Anexo I']])}</div>
   <p class="note" style="text-align:center">↻ O "Melhorar" volta ao início: ajusta o Anexo I, os intervalos e o estoque (ciclo PDCA das ISO 9001, 14001 e 45001).</p>`, true);
}

/* ---------- TERCEIRIZADOS ---------- */
const TC = { serv: '' };
function vTerc() {
  const L = recs('terc').filter(r => !TC.serv || (r.servicos || []).includes(TC.serv)).sort((a, b) => a.empresa.localeCompare(b.empresa));
  const venc = recs('terc').filter(r => ['venc', 'viag'].includes(valSt(r.validade))).length;
  const estrelas = n => n ? '★'.repeat(n) + '<span class="mut">' + '★'.repeat(5 - n) + '</span>' : '<span class="mut">sem avaliação</span>';
  return `<div class="vh"><div><h1>Prestadores de serviço</h1><p>Empresas que prestam serviço à manutenção, o que cada uma faz, contato e validade do contrato e das certidões. Serviço de terceiro exige autorização da Gerência e relatório técnico anexado ao Anexo II (NP 5.8 e 5.11.3).</p></div><span class="sp"></span><button class="mbtn pri" data-tercnovo>＋ Cadastrar empresa</button></div>
   <div class="kgrid six"><div class="card mini"><b>${recs('terc').length}</b><span>empresas cadastradas</span></div><div class="card mini ${venc ? 'warn' : 'ok'}"><b>${venc}</b><span>com contrato ou certidão vencendo em 30 dias ou vencido</span></div></div>
   <div class="card"><div class="bchips"><button class="${!TC.serv ? 'on' : ''}" data-tercserv="">Todos</button>${SERV_TERC.filter(s => recs('terc').some(r => (r.servicos || []).includes(s))).map(s => `<button class="${TC.serv === s ? 'on' : ''}" data-tercserv="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    ${L.length ? `<div class="tw"><table class="t"><thead><tr><th>Empresa</th><th>Serviços</th><th>Contato</th><th>Validade</th><th>Avaliação</th><th></th></tr></thead><tbody>${L.map(r => `<tr><td><b>${esc(r.empresa)}</b><div class="note">${[r.cnpj, r.cidade].filter(Boolean).map(esc).join(' · ')}</div></td><td>${(r.servicos || []).map(s => `<span class="pill p-mut" style="margin:1px">${esc(s)}</span>`).join('')}${r.obs ? `<div class="note">${esc(r.obs)}</div>` : ''}</td><td>${esc(r.contato || '')}<div class="note">${r.fone ? `<a href="tel:${esc(r.fone.replace(/[^\d+]/g, ''))}">${esc(r.fone)}</a>` : ''}${r.email ? ' · <a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' : ''}</div></td><td>${valPill(r.validade)}</td><td style="color:var(--warn);white-space:nowrap">${estrelas(+r.nota || 0)}</td><td><button class="mbtn sm" data-terced="${r.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`
    : '<div class="note">Nenhuma empresa cadastrada ainda. Comece pelas que mais atendem a frota: retífica, calibração de bicos, laboratório de óleo, estaleiro, elétrica.</div>'}</div>`;
}
AFTER.terc = () => { $('#main').onclick = e => { const s = e.target.closest('[data-tercserv]'); if (s) { TC.serv = s.dataset.tercserv; render(); return; } if (e.target.closest('[data-tercnovo]')) { tercModal(); return; } const ed = e.target.closest('[data-terced]'); if (ed) tercModal(S.recs.get(ed.dataset.terced)); }; };
function tercModal(r) {
  if (!precisa(false)) return;
  const o = r || { servicos: [] };
  modal(`<h2>${r ? 'Editar empresa' : 'Cadastrar empresa'}</h2>
   <div class="g"><label class="f s4">Empresa<input id="tE" value="${esc(o.empresa || '')}"></label><label class="f s2">CNPJ<input id="tC" value="${esc(o.cnpj || '')}"></label>
    <label class="f s2">Cidade<input id="tCi" value="${esc(o.cidade || 'Manaus')}"></label><label class="f s2">Contato<input id="tP" value="${esc(o.contato || '')}"></label><label class="f s2">Telefone<input id="tF" value="${esc(o.fone || '')}"></label>
    <label class="f s3">E-mail<input id="tM" value="${esc(o.email || '')}"></label><label class="f s3">Validade do contrato / certidões<input id="tV" type="date" value="${esc(o.validade || '')}"></label>
    <div class="f s6"><span>Serviços que presta</span><div class="bchips">${SERV_TERC.map(s => `<label class="chk"><input type="checkbox" value="${esc(s)}"${(o.servicos || []).includes(s) ? ' checked' : ''}> ${esc(s)}</label>`).join('')}</div></div>
    <label class="f s2">Avaliação (1 a 5)<select id="tN"><option value="">—</option>${[5, 4, 3, 2, 1].map(n => `<option${+o.nota === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label><label class="f s4">Observações<input id="tO" value="${esc(o.obs || '')}" placeholder="prazo médio, garantia, pontos de atenção"></label></div>
   <div class="note" id="tErr" style="color:var(--badt)"></div>
   <div class="row end">${r && can.admin() ? '<button class="mbtn" id="tX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="tOk">Salvar</button></div>`, true);
  const x = $('#tX'); if (x) x.onclick = () => confirmar('Excluir ' + o.empresa + '?', async () => { r.excluido = true; await saveRec(r); closeModal(); render(); });
  $('#tOk').onclick = async () => {
    const emp = $('#tE').value.trim(); if (!emp) { $('#tErr').textContent = 'Informe o nome da empresa.'; return; }
    const sv = $$('#modal .chk input:checked').map(i => i.value); if (!sv.length) { $('#tErr').textContent = 'Marque pelo menos um serviço.'; return; }
    await saveRec(Object.assign(r || { id: uid('terc'), kind: 'terc' }, { empresa: emp, cnpj: $('#tC').value.trim(), cidade: $('#tCi').value.trim(), contato: $('#tP').value.trim(), fone: $('#tF').value.trim(), email: $('#tM').value.trim(), validade: $('#tV').value, servicos: sv, nota: $('#tN').value, obs: $('#tO').value.trim(), by: S.session.name }));
    closeModal(); toast('Empresa salva.'); render();
  };
}

/* ---------- TREINAMENTOS (NP 055 item 10) ---------- */
function treinPessoas() {
  const P = {};
  recs('trein').forEach(r => { const k = r.pessoa.trim().toLowerCase(); const p = P[k] || (P[k] = { nome: r.pessoa.trim(), funcao: r.funcao, barco: r.barco, L: [] }); p.L.push(r); if (r.data >= (p.ult || '')) { p.ult = r.data; p.funcao = r.funcao || p.funcao; p.barco = r.barco || p.barco; } });
  return Object.values(P).map(p => {
    const integ = p.L.find(r => r.tipo === 'integ'), rec = p.L.filter(r => r.tipo === 'recic').sort((a, b) => a.data < b.data ? 1 : -1)[0];
    const valRec = rec ? isoD(addM(pD(rec.data), 12)) : integ ? isoD(addM(pD(integ.data), 12)) : null;
    const nrs = p.L.filter(r => r.tipo === 'nr');
    const st = !integ ? 'venc' : valSt(valRec);
    return Object.assign(p, { integ, rec, valRec, nrs, st });
  }).sort((a, b) => ({ venc: 0, viag: 1, sem: 2, ok: 3 }[a.st] - { venc: 0, viag: 1, sem: 2, ok: 3 }[b.st]) || a.nome.localeCompare(b.nome));
}
function vTrein() {
  const P = treinPessoas(), n = s => P.filter(p => p.st === s).length;
  const ult = recs('trein').sort((a, b) => a.data < b.data ? 1 : -1).slice(0, 12);
  return `<div class="vh"><div><h1>Treinamentos</h1><p>Integração antes da primeira operação (8 h), reciclagem anual (4 h) e treinamento pós-falha Crítica ou Alta (2 h, focado na causa raiz), conforme a NP 055 item 10. A lista de presença e o certificado continuam com o SESMT (10.5); aqui fica o controle de validade.</p></div><span class="sp"></span><button class="mbtn pri" data-treinnovo>＋ Registrar treinamento</button></div>
   <div class="kgrid six"><div class="card mini"><b>${P.length}</b><span>pessoas com registro</span></div><div class="card mini ${n('venc') ? 'bad' : 'ok'}"><b>${n('venc')}</b><span>sem integração ou com reciclagem vencida</span></div><div class="card mini ${n('viag') ? 'warn' : 'ok'}"><b>${n('viag')}</b><span>reciclagem vence em 30 dias</span></div><div class="card mini ok"><b>${n('ok')}</b><span>em dia</span></div></div>
   <div class="card"><div class="row"><h2>Situação por colaborador</h2></div>
    ${P.length ? `<div class="tw"><table class="t"><thead><tr><th>Pessoa</th><th>Função</th><th>Integração</th><th>Reciclagem anual</th><th>NRs e cursos</th></tr></thead><tbody>${P.map(p => `<tr><td><b>${esc(p.nome)}</b>${p.barco ? `<div class="note">${esc(p.barco)}</div>` : ''}</td><td>${esc(p.funcao || '')}</td><td>${p.integ ? '<span class="pill p-ok">' + brD(p.integ.data) + '</span>' : '<span class="pill p-bad">não registrada</span>'}</td><td>${p.valRec ? valPill(p.valRec, 'válida até') : '—'}</td><td>${p.nrs.map(r => `<span class="pill ${valSt(r.validade) === 'venc' ? 'p-bad' : 'p-mut'}" style="margin:1px" data-tip="${esc(r.tema + (r.validade ? ' · validade ' + brD(r.validade) : ''))}">${esc(r.tema.split(' ')[0] || 'curso')}</span>`).join('') || '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="note">Nenhum treinamento registrado ainda.</div>'}</div>
   ${ult.length ? `<div class="card"><div class="row"><h2>Últimos registros</h2></div><div class="tw"><table class="t"><thead><tr><th>Data</th><th>Pessoa</th><th>Tipo</th><th>Tema</th><th>Carga</th><th>Ministrante</th><th></th></tr></thead><tbody>${ult.map(r => `<tr><td class="mono">${brD(r.data)}</td><td>${esc(r.pessoa)}</td><td>${TREIN_N[r.tipo]}</td><td>${esc(r.tema || '')}</td><td class="mono">${r.horas ? r.horas + ' h' : '—'}</td><td>${esc(r.ministrante || '')}</td><td>${r.url ? `<a class="mbtn sm" href="${esc(r.url)}" target="_blank" rel="noopener">Evidência</a>` : ''} <button class="mbtn sm" data-treined="${r.id}">Editar</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
}
AFTER.trein = () => { $('#main').onclick = e => { if (e.target.closest('[data-treinnovo]')) { treinModal(); return; } const ed = e.target.closest('[data-treined]'); if (ed) treinModal(S.recs.get(ed.dataset.treined)); }; };
function treinModal(r) {
  if (!precisa(false)) return;
  const o = r || { tipo: 'recic', data: isoD(hoje()) };
  modal(`<h2>${r ? 'Editar treinamento' : 'Registrar treinamento'}</h2><p class="note">Para registrar a turma inteira, escreva um nome por linha.</p>
   <div class="g"><label class="f s3">${r ? 'Pessoa' : 'Pessoa(s)'}${r ? `<input id="rP" value="${esc(o.pessoa)}">` : '<textarea id="rP" rows="3"></textarea>'}</label>
    <label class="f s3">Função<select id="rF">${FUNCOES.map(f => `<option${o.funcao === f ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
    <label class="f s2">Tipo<select id="rT">${TREIN_TIPOS.map(t => `<option value="${t[0]}"${o.tipo === t[0] ? ' selected' : ''}>${t[1]}</option>`).join('')}</select></label><label class="f s2">Data<input id="rD" type="date" value="${esc(o.data)}"></label><label class="f s2">Carga (h)<input id="rH" inputmode="decimal" value="${esc(o.horas || '')}"></label>
    <label class="f s4">Tema / NR<input id="rM" value="${esc(o.tema || '')}" placeholder="ex.: NR-10 básico, resposta a emergências, RNC 2026-033"></label><label class="f s2">Validade (NR/curso)<input id="rV" type="date" value="${esc(o.validade || '')}"></label>
    <label class="f s3">Empurrador<select id="rB"><option value="">—</option>${S.cfg.frota.map(v => `<option${o.barco === v.nome ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></label><label class="f s3">Ministrante<input id="rI" value="${esc(o.ministrante || '')}" placeholder="SESMT, Supervisor, Assist. técnica"></label>
    <label class="f s6">Link da evidência (lista de presença, certificado no Drive)<input id="rU" value="${esc(o.url || '')}" placeholder="https://"></label></div>
   <div class="note" id="rErr" style="color:var(--badt)"></div>
   <div class="row end">${r && can.admin() ? '<button class="mbtn" id="rX">Excluir</button><span class="sp"></span>' : ''}<button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="rOk">Salvar</button></div>`, true);
  const hDef = () => { const t = TREIN_TIPOS.find(t => t[0] === $("#rT").value); $("#rH").value = t[3] || ""; };
  $('#rT').onchange = hDef; if (!r) hDef();
  const x = $('#rX'); if (x) x.onclick = () => confirmar('Excluir este registro?', async () => { r.excluido = true; await saveRec(r); closeModal(); render(); });
  $('#rOk').onclick = async () => {
    const nomes = $('#rP').value.split('\n').map(s => s.trim()).filter(Boolean), d = $('#rD').value, tipo = $('#rT').value;
    if (!nomes.length) { $('#rErr').textContent = 'Informe a pessoa.'; return; } if (!d) { $('#rErr').textContent = 'Informe a data.'; return; }
    if (tipo === 'posf' && !$('#rM').value.trim()) { $('#rErr').textContent = 'No pós-falha, informe a RNC ou a falha no campo Tema.'; return; }
    const base = { funcao: $('#rF').value, tipo, data: d, horas: $('#rH').value.trim(), tema: $('#rM').value.trim(), validade: $('#rV').value, barco: $('#rB').value, ministrante: $('#rI').value.trim(), url: $('#rU').value.trim(), by: S.session.name };
    if (r) await saveRec(Object.assign(r, base, { pessoa: nomes[0] }));
    else for (const p of nomes) await saveRec(Object.assign({ id: uid('trein'), kind: 'trein', pessoa: p }, base));
    closeModal(); toast(nomes.length > 1 ? nomes.length + ' registros salvos.' : 'Treinamento salvo.'); render();
  };
}

/* ---------- menu ---------- */
const VX2 = { bib: vBib, terc: vTerc, trein: vTrein };
Object.assign(VX, VX2);
{ const i = SECOES.findIndex(s => s.id === 'ref'); SECOES.splice(i, 1, { id: 'bib', nome: 'Biblioteca', views: [['bib', 'Documentos'], ['terc', 'Prestadores de serviço'], ['trein', 'Treinamentos'], ['matriz', 'Plano de manutenção · Anexo I']] }); }
ICO.bib = '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>';

