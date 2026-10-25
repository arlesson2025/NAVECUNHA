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
  return numerar([anxCapa(o)].concat(paginas, anxFolhasFotos(o, L.slice(0, cabe), 0, 0, L.length - cabe), [anxContra()]));
}
/* capa e contracapa do Anexo II no modelo do documento controlado (Anexo_II_Registro_de_Manutencao_NP055, Rev. 00) */
const ANX_SGI = { efet: '10/10/2026', valid: '17/04/2028', rev: '00', ed: '00', elab: 'Arlissom Azevedo', verif: 'Samy Lins', aprov: 'Conforme NP Navecunha 055 Rev. 04' };
const ANX_REFS = [['NP Navecunha 055, item 4.7', 'Aceite técnico do Comandante'], ['NP Navecunha 055, item 4.8', 'Controle documental e retenção por 10 anos'], ['NP Navecunha 055, item 5.2', 'Registro exigido por tipo e classe de manutenção'],
  ['NP Navecunha 055, item 5.4.1', 'Prazos de comunicação, RNC e nova inspeção de segurança'], ['NP Navecunha 055, item 5.5.1', 'Classificação de criticidade e liberação formal pós-falha Crítica'], ['NP Navecunha 055, item 5.7', 'Gestão de resíduos e comprovante do SGI'],
  ['NP Navecunha 055, item 5.8', 'Inspeção final, relatório de terceiros e registro fotográfico'], ['NP Navecunha 055, item 5.9', 'Lote e validade de lubrificantes'], ['NP Navecunha 055, item 5.11', 'Liberação de segurança do SESMT e autorização de terceiros'],
  ['NP Navecunha 055, itens 7.2 e 7.4', 'Uso do Anexo II nas preventivas e preditivas'], ['NP Navecunha 055, item 10.3', 'Treinamento pós-falha Crítica ou Alta'], ['Anexo I – Matriz de Manutenção Preventiva', 'Especificações, intervalos e procedimento executivo'],
  ['FR 027_L – Check-list dos Empurradores', 'Origem da demanda (inspeção de chegada e saída)'], ['FR 049_B – Troca de óleo e filtros', 'Registro complementar da troca de óleo e filtros'], ['FR 016_E – Entrega de resíduos ao SGI', 'Comprovante de destinação de resíduos'],
  ['RNC – Relatório de Não Conformidade', 'Análise de causa raiz nas falhas Crítica e Alta'], ['OM e SOLICITA (Sankhya)', 'Ordem de manutenção e solicitação de compra vinculadas']];
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
function anxContra() {
  return `<div class="sheet">${HDR()}<div class="body"><div style="font-size:18px;color:#1F2A44;margin:6px 0 10px;border-bottom:1px solid #C7CED8;padding-bottom:6px">Referências</div>${tbl(['Documento / item', 'Uso neste anexo'], ANX_REFS, ['42%', '58%'])}</div>${FOOT(0)}</div>`;
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
  B.push(sx(['Materiais e peças usados', '', tbl(['Material / peça', 'Qtd.', 'Nº da RM / NF'], (o1.mats || []).length ? o1.mats.map(m => [m[0], m[1], m[2]]) : [['', '', ''], ['', '', ''], ['', '', '']], ['60%', '12%', '28%'])]));
  B.push(sx(['Observações', 'o que encontrou, o que não deu para fazer e por quê', `<div class="v" style="min-height:46px">${esc(o1.obsGeral || '')}&nbsp;</div>`]));
  const F = (o1.fotos || []), na = F.filter(x => x.tipo === 'ANTES').length, nd = F.filter(x => x.tipo === 'DEPOIS').length;
  B.push(sx(['Fotos', 'item 5.8', `<div>${F.length ? `${na} foto${na === 1 ? '' : 's'} de antes e ${nd} de depois nas folhas seguintes.` : 'Tirar fotos <b>antes</b> e <b>depois</b> de cada serviço principal.'}</div>`]));
  const ap = fechada ? `<span class="stamp">✓ Conferido e encerrado no SMF · ${esc(o1.aprovBy || '')}</span>` : '';
  B.push(sx(['Assinaturas', '', tbl(['Função', 'Nome', 'Assinatura', 'Data'], [['Executou (equipe de manutenção ou terceiro)', lancada ? (o1.ass || {}).exec || o1.execn || '' : '', '', ''], ['Recebeu a bordo (Comandante ou Coordenador de Operações)', lancada ? (o1.ass || {}).cmd || '' : '', '', ''], ['Supervisor de Manutenção (conferiu e encerrou)', fechada ? o1.aprovBy || '' : '', { h: ap }, fechada ? brD(String(o1.aprovAt || '').slice(0, 10)) : '']], ['40%', '24%', '22%', '14%'])]));
  return anxMax5(paginar(fbar, B), o1);
}
function docIIB(o) { return docIIBOM(o.grupo ? omGrupo(o.grupo) : [o]); }
/* Anexo II-A enxuto: o que quebrou, o que foi feito e os serviços do cronograma que a corretiva refez (são eles que alimentam o cronograma da preventiva), sem número do Anexo I */
function docIIA(o) {
  const v = vessel(o.vessel) || { nome: o.vessel, mca: {} }, crit = o.classe === 'Crítica', fechada = o.status === 'encerrada', sx = s => blk('', s[0], s[1], s[2]).replace('<code></code>', '');
  const fbar = `<div class="fbar"><div><small>Corretiva · o que quebrou, o que foi feito e o que volta a contar no cronograma</small><h3>Formulário II-A — Manutenção Corretiva</h3></div><div class="om">Nº da OM<br><b>${esc(o.num)}</b></div></div>`;
  const B = [];
  B.push(sx(['Identificação', '', grid('1fr 1.2fr 1fr 1fr', dv('Nº da OM (Sankhya)', o.num) + dv('Empurrador', v.nome) + dv('Aberta em', brDT(o.abertura)) + dv('Classe', o.classe || '')
    + dv('Onde', o.pos === 'UN' ? 'Embarcação' : posCurtoE(v, o.pos)) + dv('Equipamento', o.equip || '') + dv('Sistema', o.sistema || '') + dv('Local', o.local || '')
    + (crit || o.classe === 'Alta' ? dv('Nº da RNC', o.rnc || '') : '') + (crit ? dv('Interditado em', brDT(o.interdDT)) : ''))]));
  B.push(sx(['O que aconteceu', '', `<div class="v" style="min-height:40px">${esc(o.descricao || '')}&nbsp;</div>`]));
  B.push(sx(['O que foi feito', '', `<div class="v" style="min-height:52px">${esc(o.servicos || '')}&nbsp;</div>` + grid('1fr 1fr 1.6fr', dv('Início', brDT(o.inicio)) + dv('Término', brDT(o.termino)) + dv('Executado por', o.execn || o.exec || ''))
    + (o.causa ? dv('Causa provável', o.causa) : '')]));
  const R = (o.itensRefeitos || []).map(k => { const [pos, id] = k.split('|'), t = A1M[id]; return t ? [pos === 'UN' ? 'Embarcação' : posCurtoE(v, pos), { h: `<b>${esc(t.chk || t.item)}</b> <span style="color:#5F6368">· ${esc(EQN[t.eq] || t.eq)}</span>` }, ivEmb(t, v, pos)] : null; }).filter(Boolean);
  B.push(sx(['Serviços do cronograma refeitos nesta corretiva', 'o próximo vencimento conta da data de término', R.length ? tbl(['Onde', 'Serviço', 'A cada'], R, ['18%', '67%', '15%']) : '<div class="note">Nenhum.</div>']));
  if ((o.mats || []).length) B.push(sx(['Materiais e peças usados', '', tbl(['Material / peça', 'Qtd.', 'Nº da RM / NF'], o.mats.map(m => [m[0], m[1], m[2]]), ['60%', '12%', '28%'])]));
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
