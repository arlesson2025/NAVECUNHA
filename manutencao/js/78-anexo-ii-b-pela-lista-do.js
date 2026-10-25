/* ===== Anexo II-B pela lista do cronograma (pedido do Supervisor, 24/10/2026: "na preventiva sai a lista do cronograma no anexo, eu realizo,
   anexo fotos antes e depois e pronto · quem vai querer saber de número do Anexo I?") =====
   · Um Anexo II-B por OM (a OM inteira, todas as partes juntas), sem número de item do Anexo I: equipamento, serviço em palavras, a cada quanto, Feito / Não feito, observação.
   · É o mesmo documento na emissão (imprimir e entregar à equipe, no lugar da ficha) e no encerramento (com o que foi feito, as fotos antes e depois e o carimbo do Supervisor).
   · Na OM em grupo, só a parte 1 gera o PDF (o documento já tem a OM inteira); as outras partes encerram sem PDF repetido.
   · Na tela de lançamento da OM o número do item também sai (só CSS). */
'use strict';
/* fotos em miniatura (9 por folha) e o anexo inteiro com no máximo 5 folhas (pedido do Supervisor, 24/10/2026: "como vou gerar 20 páginas de uma preventiva? · máximo 5 folhas");
   o que não couber fica na OM e no Drive, com aviso na última folha */
const ANX_MAX = 5, ANX_FPP = 9;
function anxFotos(o) { const ord = { 'FORMULÁRIO ASSINADO': 0, 'RELATÓRIO DO FORNECEDOR': 1, ANTES: 2, DURANTE: 3, DEPOIS: 4 };
  return (o.fotos || []).filter(x => x.src).slice().sort((a, b) => (ord[a.tipo] ?? 5) - (ord[b.tipo] ?? 5) || (a.at || 0) - (b.at || 0)); }
function anxFolhasFotos(o, L, ini, tot, sobra) {
  const out = [], nF = Math.ceil(L.length / ANX_FPP);
  for (let k = 0; k < nF; k++) { const ch = L.slice(k * ANX_FPP, (k + 1) * ANX_FPP), ult = k === nF - 1;
    out.push(`<div class="sheet">${HDR()}<div class="body"><div class="fbar"><div><small>Registro fotográfico · item 5.8</small><h3>Fotos da OM ${esc(o.num)} · ${esc(vName(o.vessel))}</h3></div><div class="om">Nº da OM<br><b>${esc(o.num)}</b></div></div>
     <div class="ph9">${ch.map((x, j) => `<figure><div class="im"><img src="${x.src}" alt=""></div><figcaption><b>${ini + k * ANX_FPP + j + 1} · ${esc(x.tipo === 'FORMULÁRIO ASSINADO' ? 'FORMULÁRIO' : x.tipo)}</b>${x.leg ? ' · ' + esc(x.leg) : ''}</figcaption></figure>`).join('')}</div>
     ${ult && sobra ? `<div class="note" style="margin-top:6px">Mais ${sobra} foto${sobra > 1 ? 's' : ''} ${sobra > 1 ? 'ficam' : 'fica'} na OM no SMF e no Google Drive (o anexo tem no máximo ${ANX_MAX} folhas).</div>` : ''}</div>${FOOT('@K')}</div>`); }
  return out; }
function anxMax5(paginas, o) {   // capa + até 5 folhas (formulário e fotos) + contracapa; capa e contracapa não contam no limite
  const L = anxFotos(o), livres = Math.max(0, ANX_MAX - paginas.length), cabe = Math.min(L.length, livres * ANX_FPP);
  return numerar([anxCapa(o)].concat(paginas, anxFolhasFotos(o, L.slice(0, cabe), 0, 0, L.length - cabe), [anxContra(o)]));
}
/* capa e contracapa do Anexo II no modelo do documento controlado (Anexo_II_Registro_de_Manutencao_NP055, Rev. 00) */
const ANX_SGI = { efet: '10/10/2026', valid: '17/04/2028', rev: '00', ed: '00', elab: 'Arlissom Azevedo', verif: 'Samy Lins', aprov: 'Conforme NP Navecunha 055 Rev. 04' };
function anxCapa(o) {
  const c = o.tipo === 'C', B = 'border:1px solid #1F2A44', cel = (lab, v, x) => `<div style="padding:6px 10px;${x || ''}"><div style="font-size:8.5px;letter-spacing:.06em;color:#5F6B7A;text-transform:uppercase">${lab}</div><div style="font-size:12px;font-weight:600;color:#1F2A44">${v}</div></div>`;
  const ln = (cols, cells) => `<div style="display:grid;grid-template-columns:${cols};border-bottom:1px solid #1F2A44">${cells}</div>`, sep = 'border-left:1px solid #1F2A44';
  const dado = (lab, v, span) => `<div style="padding:6px 8px;border:1px solid #C7CED8;margin:-1px 0 0 -1px${span ? `;grid-column:span ${span}` : ''}"><div style="font-size:8.5px;color:#5F6B7A;text-transform:uppercase">${lab}</div><div style="font-size:12px;min-height:16px">${esc(v || '') || '&nbsp;'}</div></div>`;
  const exec = o.exec === 'Terceiro' ? 'Terceiro' : o.exec ? 'Equipe própria' : '', fim = String(c ? o.termino || o.liberacao || '' : o.dreal || '').slice(0, 10);
  return `<div class="sheet"><div style="${B};height:1050px;margin:0;display:flex;flex-direction:column;background:#fff">
    ${ln('1.1fr 1.6fr 1.1fr', `<div style="display:flex;gap:14px;align-items:center;justify-content:center;padding:8px"><img src="${LOGOS.vda}" style="height:46px" alt=""><img src="${LOGOS.nav}" style="height:42px" alt=""></div><div style="${sep};display:flex;align-items:center;justify-content:center;font-size:22px;letter-spacing:.3em;font-weight:600;color:#1F2A44">ANEXO</div>${cel('Doc. nº', 'NP Navecunha 055 – Anexo II', sep)}`)}
    ${ln('2.7fr 1.1fr', cel('Título', 'Registro de Manutenção – Empurradores Fluviais') + cel('Página', '1 de @N', sep))}
    ${ln('1.35fr 1.35fr .55fr .55fr', cel('Data de efetivação', ANX_SGI.efet) + cel('Data de validade', ANX_SGI.valid, sep) + cel('Rev.', ANX_SGI.rev, sep) + cel('Ed.', ANX_SGI.ed, sep))}
    ${ln('2.7fr 1.1fr', cel('Origem', 'NBR ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018') + cel('Aplicável à', 'Navegação Cunha Ltda.', sep))}
    <div style="flex:1;padding:70px 60px 0">
      <div style="font-size:44px;font-weight:700;color:#1F2A44;line-height:1">Anexo II</div><div style="font-size:21px;color:#1F2A44;margin-top:10px">Registro de Manutenção</div><div style="font-size:13px;color:#5F6B7A;margin-top:8px">Empurradores Fluviais</div>
      <div style="display:flex;gap:12px;align-items:center;margin-top:60px"><span style="background:#1F2A44;color:#fff;font-weight:700;font-size:11px;padding:4px 10px">${c ? 'II-A' : 'II-B'}</span><div><div style="font-size:14px;color:#1F2A44">${c ? 'Manutenção Corretiva' : 'Manutenção Preventiva e Preditiva'}</div><div style="font-size:10px;color:#5F6B7A">${c ? 'Classe ' + esc(o.classe || '') + (o.rnc ? ' · RNC ' + esc(o.rnc) : '') : 'Preventiva sistemática e preditiva por condição'}</div></div></div>
      <div style="margin-top:60px;font-size:9.5px;font-weight:700;letter-spacing:.08em;color:#1F2A44">DADOS DO REGISTRO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 2fr;margin-top:6px;padding:1px 0 0 1px">${dado('Nº da O.M. (Sankhya)', o.num)}${dado('Nº da SC / OC', o.scoc)}${dado('Nº das RMs (requisições de material)', o.rms)}${dado('Embarcação', vName(o.vessel), 2)}${dado('Data de conclusão', fim ? brD(fim) : '')}${dado('Executado por', exec)}${dado('Nome / função ou empresa / responsável técnico', o.execn, 2)}</div>
      <p style="font-size:9px;color:#5F6B7A;margin-top:60px">Documento controlado pelo SGI. Propriedade da Navegação Cunha Ltda. É proibida a reprodução, a cessão a terceiros ou o uso fora da finalidade a que se destina sem autorização. Cópia impressa não controlada, exceto a distribuída a bordo.</p></div>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;border-top:1px solid #1F2A44;font-size:11px">
      <div style="padding:6px 10px"><div style="display:grid;grid-template-columns:50px 90px 1fr;font-size:8.5px;color:#5F6B7A;text-transform:uppercase"><span>Rev.</span><span>Data</span><span>Descrição</span></div><div style="display:grid;grid-template-columns:50px 90px 1fr;margin-top:4px"><span>${ANX_SGI.rev}</span><span>${ANX_SGI.efet}</span><span>Emissão inicial</span></div></div>
      <div style="${sep}">${cel('Área responsável', 'Manutenção', 'border-bottom:1px solid #1F2A44')}<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #1F2A44">${cel('Elaborado por', ANX_SGI.elab)}${cel('Verificado por', ANX_SGI.verif, sep)}</div>${cel('Aprovação', ANX_SGI.aprov)}</div></div></div>${FOOT(1)}</div>`;
}
function anxContra(o) {   // contracapa = rastreabilidade (decisão do Supervisor, 24/10/2026): histórico da OM, evidências, controle documental e itens da NP
  const c = o.tipo === 'C', P = !c && o.grupo ? omGrupo(o.grupo) : [o], o1 = P[0] || o, tit = t => `<div style="font-size:13px;font-weight:700;color:#1F2A44;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em">${t}</div>`;
  const H = (o1.hist || []).map(h => [new Date(h.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), h.by || '—', h.ev || '']);
  if (o1.skFim) H.push([new Date(o1.skFim.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), o1.skFim.by || '—', 'Anexado e encerrado no Sankhya']);
  const F = P.flatMap(x => x.fotos || []), nDrive = F.filter(f => f.fid).length, fr27 = o.fr027 ? S.recs.get(o.fr027) : null, fr49 = recs('lub').filter(r => r.tipo === 'fr049' && o.num && String(r.om) === String(o.num));
  const E = [];
  if (F.length) E.push(['Fotos', F.length + ' (' + F.filter(f => f.tipo === 'ANTES').length + ' de antes, ' + F.filter(f => f.tipo === 'DEPOIS').length + ' de depois)', nDrive === F.length ? 'Google Drive' : nDrive + ' no Drive · ' + (F.length - nDrive) + ' só no aparelho']);
  if (fr27) E.push(['FR 027_L de origem', (fr27.mov === 'saida' ? 'saída' : 'chegada') + ' de ' + brD(fr27.date), fr27.pdfFileId ? 'Google Drive (PDF)' : 'SMF']);
  fr49.forEach(r => E.push(['FR 049_B', 'troca de óleo de ' + brD(r.date), r.pdfFileId ? 'Google Drive (PDF)' : 'SMF']));
  if (o.rnc) E.push(['RNC', o.rnc, 'Sankhya (anexo da OM)']);
  if (o.relTerc || F.some(f => f.tipo === 'RELATÓRIO DO FORNECEDOR')) E.push(['Relatório do fornecedor (5.8)', o.relTerc || 'anexo', F.some(f => f.tipo === 'RELATÓRIO DO FORNECEDOR') ? 'Google Drive' : 'Sankhya (anexo da OM)']);
  if (o1.fr016 || o.fr016) E.push(['FR 016_E (resíduos)', o1.fr016 || o.fr016, 'Sankhya (anexo da OM)']);
  if (o1.pdfFileId) E.push(['Este Anexo II (PDF)', 'OM ' + o.num, 'Google Drive']);
  const itens = c ? 'NP 055 itens 4.7, 4.8, 5.2, 5.4.1 (comunicação, RNC e nova inspeção), 5.5.1 (criticidade e liberação), 5.7 (resíduos), 5.8 (inspeção final, terceiros e fotos), 5.11 (SESMT e terceiros) e 10.3 (treinamento pós-falha)'
    : 'NP 055 itens 4.7, 4.8, 5.2, 5.7 (resíduos), 5.8 (inspeção final, terceiros e fotos), 5.9 (lote e instrumentos), 5.11 (SESMT e terceiros), 7.2 e 7.4 (preventiva e preditiva) · Anexo I (intervalos e método executivo)';
  return `<div class="sheet">${HDR()}<div class="body">
    <div style="font-size:18px;color:#1F2A44;margin:6px 0 4px;border-bottom:1px solid #C7CED8;padding-bottom:6px">Rastreabilidade · OM ${esc(o.num || '')}</div>
    ${tit('1 · Histórico da OM')}${H.length ? tbl(['Data e hora', 'Quem', 'O que aconteceu'], H, ['22%', '24%', '54%']) : '<div class="note">Sem eventos registrados.</div>'}
    ${tit('2 · Evidências desta OM')}${E.length ? tbl(['Evidência', 'Identificação', 'Onde está'], E, ['30%', '40%', '30%']) : '<div class="note">Nenhuma evidência vinculada além deste formulário.</div>'}
    ${tit('3 · Controle documental (NP 055 item 4.8)')}<div style="font-size:11px;line-height:1.5">Registro retido por 10 anos · original anexado à OM no Sankhya, cópia no Google Drive · gerado pelo SMF ${esc(VERSAO_APP)} em ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${S.session ? ' por ' + esc(S.session.name) : ''} · código de verificação <b>${esc(o1.id || o.id)}</b></div>
    ${tit('4 · Referências')}<div style="font-size:11px;line-height:1.5">${itens}.</div>
   </div>${FOOT(0)}</div>`;
}
function docIIBOM(P) {
  P = P.slice().sort((a, b) => (a.parte || 0) - (b.parte || 0));
  const o1 = P[0], v = vessel(o1.vessel) || { nome: o1.vessel, mca: {} }, fechada = P.every(o => o.status === 'encerrada'), lancada = P.some(o => o.passosFicha || o.dreal);
  const sx = s => blk('', s[0], s[1], s[2]).replace('<code></code>', '');
  const dl = P.map(o => o.alvoD).filter(Boolean).sort()[0];
  const fbar = `<div class="fbar"><div><small>Serviços do cronograma preventivo · marque o que fez e tire fotos antes e depois</small><h3>Formulário II-B — Manutenção Preventiva</h3></div><div class="om">Nº da OM<br><b>${esc(o1.num)}</b></div></div>`;
  const B = [];
  B.push(sx(['Identificação', '', grid('1fr 1.2fr 1fr 1fr', dv('Nº da OM (Sankhya)', o1.num) + dv('Empurrador', v.nome) + dv('Aberta em', brD(o1.emitAt)) + dv('Fazer até', dl ? brD(dl) : '—')
    + dv('Data da execução', lancada ? brD(o1.dreal) : '') + dv('Executado por', lancada ? o1.execn || o1.exec || '' : '', 2) + dv('Empurrador parado (h)', lancada ? o1.indispH || '0' : ''))]));
  const mot = P.filter(o => o.pos !== 'UN');
  if (mot.length) B.push(sx(['Horímetros', 'anotar antes de começar', tbl(['Motor', 'Na abertura da OM', 'Previsto para', 'Na execução'], mot.map(o => [posCurtoE(v, o.pos), o.hEmit ? nf(o.hEmit) + ' h' : '—', o.alvoH ? nf(o.alvoH) + ' h' : '—', lancada && o.hreal ? nf(o.hreal) + ' h' : '']), ['34%', '22%', '22%', '22%'])]));
  const box = on => on ? '☒' : '☐';
  P.forEach(o => {
    const ids = o.itensProg || o.items || [], feitos = new Set(o.items || []), nao = {}; (o.naoExec || []).forEach(x => { nao[x.id] = x.motivo || ''; });
    /* troca de óleo (e o que se faz junto com ela) é do FR 049_B, que já dá baixa no cronograma: não sai no II-B (pedido do Supervisor, 24/10/2026) */
    const L = ids.map(id => A1M[id]).filter(t => t && !(typeof trilha === 'function' && trilha(v, o.pos, t) === 'bordo')).sort((a, b) => (EQN[a.eq] || a.eq).localeCompare(EQN[b.eq] || b.eq, 'pt-BR'));
    /* uma linha por serviço e o equipamento como subtítulo: cabe ~50 serviços por folha */
    let eq0 = '', lin = '';
    L.forEach(t => { const e = EQN[t.eq] || t.eq, f = lancada && feitos.has(t.id), n = lancada && !f;
      if (e !== eq0) { eq0 = e; lin += `<tr class="eqh"><td colspan="5">${esc(e)}</td></tr>`; }
      lin += `<tr><td>${esc(t.chk || t.item)}</td><td class="ac">${esc(ivEmb(t, v, o.pos))}</td><td class="c${f ? ' ok' : ''}">${box(f)}</td><td class="c${n ? ' bad' : ''}">${box(n)}</td><td>${n ? esc(nao[t.id] || '') : ''}</td></tr>`; });
    B.push(sx([posCurtoE(v, o.pos), L.length + (L.length === 1 ? ' serviço' : ' serviços'), `<table class="lst"><tr><th style="width:58%">Serviço</th><th style="width:11%">A cada</th><th style="width:6%">Feito</th><th style="width:7%">Não feito</th><th>Observação</th></tr>${lin}</table>`]));
  });
  if (P.some(o => (o.itensProg || o.items || []).some(id => A1M[id] && typeof trilha === 'function' && trilha(v, o.pos, A1M[id]) === 'bordo'))) B.push(`<div class="note" style="margin:0 0 4px">Troca de óleo e filtros desta OM: registrar no <b>FR 049_B</b>. É ele que dá baixa no cronograma.</div>`);
  const lx = (lab, val) => val ? dv(lab, val) : '', ext = lancada ? lx('Início', brDT(o1.inicio)) + lx('Término', brDT(o1.termino)) + lx('Gerou resíduo?', o1.resid) + lx('Nº FR 016_E', o1.fr016) + lx('Nº da PT do SESMT', o1.pt) : '';
  if (ext) B.push(sx(['Execução', '', grid('repeat(4,1fr)', ext)]));   // o que foi lançado na tela e não aparece na identificação
  if (lancada && o1.justif) B.push(sx(['Justificativa (passou da hora-alvo)', '', `<div class="v">${esc(o1.justif)}</div>`]));
  if (!lancada || (o1.mats || []).length) B.push(sx(['Materiais e peças usados', '', tbl(['Material / peça', 'Qtd.', 'Nº da RM / NF'], (o1.mats || []).length ? o1.mats.map(m => [m[0], m[1], m[2]]) : [['', '', ''], ['', '', ''], ['', '', '']], ['60%', '12%', '28%'])]));
  if (!lancada || o1.obsGeral) B.push(sx(['Observações', 'o que encontrou, o que não deu para fazer e por quê', `<div class="v" style="min-height:46px">${esc(o1.obsGeral || '')}&nbsp;</div>`]));
  const F = (o1.fotos || []), na = F.filter(x => x.tipo === 'ANTES').length, nd = F.filter(x => x.tipo === 'DEPOIS').length;
  B.push(sx(['Fotos', 'item 5.8', `<div>${F.length ? `${na} foto${na === 1 ? '' : 's'} de antes e ${nd} de depois nas folhas seguintes.` : 'Tirar fotos <b>antes</b> e <b>depois</b> de cada serviço principal.'}</div>`]));
  const ap = fechada ? `<span class="stamp">✓ Conferido e encerrado no SMF · ${esc(o1.aprovBy || '')}</span>` : '';
  B.push(sx(['Assinaturas', '', tbl(['Função', 'Nome', 'Assinatura', 'Data'], [['Executou (equipe de manutenção ou terceiro)', lancada ? (o1.ass || {}).exec || o1.execn || '' : '', '', ''], ['Recebeu a bordo (Comandante ou Coordenador de Operações)', lancada ? (o1.ass || {}).cmd || '' : '', '', ''], ['Supervisor de Manutenção (conferiu e encerrou)', fechada ? o1.aprovBy || '' : '', { h: ap }, fechada ? brD(String(o1.aprovAt || '').slice(0, 10)) : '']], ['40%', '24%', '22%', '14%'])]));
  return anxMax5(paginar(fbar, B), o1);
}
function docIIB(o) { return docIIBOM(o.grupo ? omGrupo(o.grupo) : [o]); }
/* Anexo II-A enxuto: o que quebrou, o que foi feito e os serviços do cronograma que a corretiva refez (são eles que alimentam o cronograma da preventiva), sem número do Anexo I */
function docIIA(o) {   // tudo o que foi preenchido na tela sai no PDF, na mesma ordem (decisão do Supervisor, 24/10/2026); campo em branco não sai
  const v = vessel(o.vessel) || { nome: o.vessel, mca: {} }, crit = o.classe === 'Crítica', fechada = o.status === 'encerrada', sx = s => blk('', s[0], s[1], s[2]).replace('<code></code>', '');
  const tx = x => Array.isArray(x) ? x.filter(Boolean).join(', ') : x == null ? '' : String(x).trim(), d = (lab, x, span) => tx(x) ? dv(lab, tx(x), span) : '';
  const caixa = (lab, x) => tx(x) ? `<div class="fl" style="margin-top:4px">${lab}</div><div class="v">${esc(tx(x))}</div>` : '';
  const sec = (tit, r, ...partes) => { const h = partes.join(''); return h ? sx([tit, r, h]) : null; }, g4 = c => c ? grid('repeat(4,1fr)', c) : '';
  const tab = (cols, L, w) => (L || []).filter(r => (r || []).some(x => tx(x))).length ? tbl(cols, L.filter(r => (r || []).some(x => tx(x))).map(r => cols.map((_, i) => r[i] || '')), w) : '';
  const fbar = `<div class="fbar"><div><small>Corretiva · o que quebrou, o que foi feito e o que volta a contar no cronograma</small><h3>Formulário II-A — Manutenção Corretiva</h3></div><div class="om">Nº da OM<br><b>${esc(o.num)}</b></div></div>`;
  const par = o.par || {}, parTx = [['oleo', 'Pressão de óleo'], ['tagua', 'Temp. da água'], ['toleo', 'Temp. do óleo'], ['rpm', 'RPM'], ['bat', 'Bateria'], ['outro', 'Outro']].map(([k, l]) => d(l, par[k])).join('');
  const R = (o.itensRefeitos || []).map(k => { const [pos, id] = k.split('|'), t = A1M[id]; return t ? [pos === 'UN' ? 'Embarcação' : posCurtoE(v, pos), { h: `<b>${esc(t.chk || t.item)}</b> <span style="color:#5F6368">· ${esc(EQN[t.eq] || t.eq)}</span>` }, ivEmb(t, v, pos)] : null; }).filter(Boolean);
  const Rv = (o.itensRev || []).map(k => { const t = A1M[k.split('|')[1]]; return t ? t.chk || t.item : ''; }).filter(Boolean);
  const B = [
    sec('1 · Descrição da falha', 'identificação e falha (“antes”)', g4(d('Nº da OM (Sankhya)', o.num) + d('Empurrador', v.nome) + d('Classe', o.classe) + d('Aberta em', brDT(o.abertura)) + d('Sistema', o.sistema) + d('Equipamento / componente', o.equip)
      + d('Onde', o.pos === 'UN' ? 'Embarcação' : posCurtoE(v, o.pos)) + d('Horímetro (h)', o.horimetro) + d('Local', o.local) + d('Trecho', o.trecho) + d('Origem', o.origem) + d('Modo de falha (ISO 14224)', o.modo)
      + d('Nº da RNC', o.rnc) + d('Comunicado a (5.4.1)', o.comunicado, 2) + d('Interditada desde', brDT(o.interdDT)) + d('Interdição determinada por', o.interdPor) + d('Detecção', brDT(o.deteccao))), caixa('Descrição da falha', o.descricao), parTx ? `<div class="fl" style="margin-top:4px">Parâmetros observados na hora</div>` + g4(parTx) : ''),
    sec('2 · Ação de contenção', 'ISO 9001 10.2.1 · ISO 14001 · ISO 45001', g4(d('A falha afetou', o.impacto, 2) + d('Nº da PT do SESMT', o.pt) + d('Liberação do SESMT', o.sesmt)), caixa('Ação de contenção executada', o.contencao)),
    sec('3 · Reparo e restabelecimento', 'execução e condição final (“depois”)', g4(d('Quem executou', o.exec) + d(o.exec === 'Terceiro' ? 'Empresa e responsável técnico' : 'Nome e função', o.execn, 2) + d('Autorização da Gerência', o.terceiroAut) + d('Nº SC / OC', o.scoc) + d('Relatório do fornecedor', o.relTerc)
      + d('Início do reparo', brDT(o.inicio)) + d('Término do reparo', brDT(o.termino)) + d('Nº das RMs', o.rms) + d('Horas-homem', o.hh) + d('Peças e materiais (R$)', o.custoMat) + d('Serviço de terceiro (R$)', o.custoServ)), caixa('Serviço executado', o.servicos),
      R.length ? `<div class="fl" style="margin-top:6px">Itens do Anexo I executados neste reparo <span style="text-transform:none">· o próximo vencimento conta da data de término</span></div>` + tbl(['Onde', 'Serviço', 'A cada'], R, ['18%', '67%', '15%']) : '',
      tab(['Peças e materiais', 'Qtd.', 'Nº da RM / NF', 'Lote', 'Validade'], o.mats, ['40%', '10%', '20%', '15%', '15%']), tab(['Medição / parâmetro', 'Especificado', 'Como encontrado', 'Como deixado', 'Unidade'], o.medsC),
      g4(d('Gerou resíduo? (5.7)', o.resid) + d('Quais', o.residT, 2) + d('Nº FR 016_E', o.fr016) + d('Teste funcional', o.teste, 2) + d('Resultado', o.resultado) + d('Nova inspeção de segurança (5.4.1)', o.inspecao))),
    sec('4 · Análise de causa e ação corretiva', crit || o.classe === 'Alta' ? 'obrigatório em Crítica e Alta · detalhe na RNC' : '', g4(d('Causa da falha (ISO 14224)', o.causaCat, 2) + d('Responsável', o.mitigResp) + d('Prazo', o.mitigPrazo ? brD(o.mitigPrazo) : '') + d('Situação', o.mitigSt) + d('Treinamento pós-falha', o.trPrev ? brD(o.trPrev) : '')
      + d('O plano preventivo precisa mudar?', o.revPlano) + d('Item do Anexo I a revisar', Rv, 2)), caixa('Análise de causa raiz (5 porquês)', o.causa), caixa('Ação corretiva (eliminação da causa raiz)', o.mitig)),
    sec('5 · Liberação para operação', '', g4(d('Liberação à operação', brDT(o.liberacao)) + d('Conferência documental', o.conferencia, 2)))
  ].filter(Boolean);
  const F = anxFotos(o);
  B.push(sx(['Fotos', 'item 5.8', `<div>${F.length ? F.length + ' foto' + (F.length > 1 ? 's' : '') + ' nas folhas seguintes.' : 'Tirar fotos <b>antes</b> e <b>depois</b> do conserto.'}</div>`]));
  const ap = fechada ? `<span class="stamp">✓ Conferido e encerrado no SMF · ${esc(o.aprovBy || '')}</span>` : '';
  const rows = [['Executou (equipe de manutenção ou terceiro)', (o.ass || {}).exec || o.execn || '', '', ''], ['Recebeu a bordo (Comandante ou Coordenador de Operações)', (o.ass || {}).cmd || '', '', ''], ['Supervisor de Manutenção (conferiu e encerrou)', fechada ? o.aprovBy || '' : '', { h: ap }, fechada ? brD(String(o.aprovAt || '').slice(0, 10)) : '']];
  if (crit) rows.push(['Coordenador de Operações (liberação após falha Crítica)', (o.ass || {}).coord || '', '', '']);
  B.push(sx(['Assinaturas', '', tbl(['Função', 'Nome', 'Assinatura', 'Data'], rows, ['40%', '24%', '22%', '14%'])]));
  return anxMax5(paginar(fbar, B), o);
}
/* FR 049_B só com óleo e filtro de óleo (decisão do Supervisor, 24/10/2026): os itens de 250 h que iam junto com a troca (correias e pré-filtro do MCP;
   bateria, correia, filtro de ar, radiador, zincos, combustível do MCA) deixam de ser da trilha "a bordo", não ganham baixa pelo FR 049_B e voltam para a
   preventiva da equipe de terra (Programar preventiva, Anexo II-B e cronograma da janela) */
function compDe() { return null; }
/* Conferência da preventiva simples (pedido do Supervisor, 24/10/2026: "não sei o que é isso nem onde resolvo"): para encerrar basta
   data, horímetro, quem executou, cada serviço marcado (feito ou não feito) e foto de antes e de depois. Sai a cobrança de passo a passo,
   medição, registros e legenda por item do Anexo I. A OM preventiva solta (sem grupo) abre na mesma tela de lançamento da OM em grupo. */
const fotosPrev = o => ((o.grupo && omGrupo(o.grupo)[0]) || o).fotos || [];
function rgPend(P) {
  const R = rgDados(P), v = vessel(P[0].vessel), out = [], F = P[0].fotos || [];
  if (!R.dreal) out.push('Data da execução');
  if (!(R.execn || '').trim()) out.push('Quem executou');
  P.filter(o => o.pos !== 'UN').forEach(o => { if (!R.hr[o.pos]) out.push('Horímetro · ' + posCurtoE(v, o.pos)); });
  let sem = 0; P.forEach(o => (o.itensProg || o.items || []).forEach(id => { if (!R.res[o.pos + '|' + id]) sem++; }));
  if (sem) out.push(sem + (sem === 1 ? ' serviço sem marcar (feito ou não feito)' : ' serviços sem marcar (feito ou não feito)'));
  if (!F.some(x => x.tipo === 'ANTES')) out.push('Foto de antes');
  if (!F.some(x => x.tipo === 'DEPOIS')) out.push('Foto de depois');
  return out;
}
{ const st = document.createElement('style'); st.textContent = `.sheet .ph9{flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:8px;min-height:0}.sheet .ph9 figure{margin:0;border:.6px solid #B9C5D1;background:#fff;display:flex;flex-direction:column;min-height:0}.sheet .ph9 .im{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#F4F7FA}.sheet .ph9 img{max-width:100%;max-height:100%;object-fit:contain}.sheet .ph9 figcaption{font-size:8.6px;padding:3px 5px;line-height:1.25;max-height:34px;overflow:hidden}.sheet table.lst td{padding:1.5px 5px;font-size:9.2px;line-height:1.25}.sheet table.lst th{padding:2px 5px;font-size:8.6px}.sheet table.lst tr.eqh td{background:#EEF3F8;font-weight:700;color:#16244A;font-size:9px;padding:2px 5px}.sheet table.lst td.ac{white-space:nowrap;color:#3C4043}.rg-it>.mono{display:none}/* Anexo I: barras dos sistemas coladas, sem espaço branco entre uma e outra (pedido do Supervisor, 24/10/2026) */.a1-lista{gap:0!important}.a1-lista>.a1-sis{border-radius:0!important;box-shadow:none!important;border-color:#1A73E8!important;border-top-width:0!important}.a1-lista>.a1-sis:first-child{border-top-width:1px!important;border-radius:10px 10px 0 0!important}.a1-lista>.a1-sis:last-child{border-radius:0 0 10px 10px!important}.a1-lista>.a1-sis>header{border-radius:0!important;border-bottom:1px solid rgba(255,255,255,.25)}.a1-lista>.a1-sis.ab{border-color:#DADCE0!important}.sheet td.ok{color:#137333;font-weight:700}.sheet td.bad{color:#C5221F;font-weight:700}`; document.head.appendChild(st); }
