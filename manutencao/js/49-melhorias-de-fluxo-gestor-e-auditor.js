/* ===== Melhorias de fluxo (gestor e auditor) =====
   1 · NO do FR 027_L sem OM conta na Situação da frota (Crítica bloqueia, Alta deixa com restrição) até ganhar a OM
   4 · links da cadeia de evidência (OM → PDF do FR 027_L de origem; saída → PDF do FR 027_L de saída)
   5 · histórico de cada OM visível (quem emitiu, avançou, devolveu, aprovou e quando)
   6 · Hoje: "O que precisa de você agora" no topo, em ordem de risco
   (2 · horímetro recusado vira pendência · 3 · aviso de FR 027_L em duplicidade · 7 · nº de OM de outro empurrador: no bloco FR 027_L) */
'use strict';
function fr27Pend(vid) { return fr27s(vid).flatMap(r => fr27SemOM(r).map(x => Object.assign({ orig: 'FR 027_L', rec: r.id, date: r.date, mov: r.mov }, x))).concat(nokPend(vid), avPend(vid)); }   // falhas sem OM: NO do FR 027_L, NOK da preventiva e avaria em viagem   // embrulhada no bloco "Falhas sem OM" (NOK e avaria)
const drivePdf = (id, txt) => id ? `<a href="https://drive.google.com/file/d/${encodeURIComponent(id)}/view" target="_blank" rel="noopener">${txt}</a>` : '<span class="note">PDF no Drive depois de sincronizar</span>';
// 4 e 5 · OM: de onde veio (FR 027_L) e linha do tempo
function omHistHTML(o) {
  const H = (o.hist || []).slice(); if (!H.some(h => /Emitida|Aberta/.test(h.ev || ''))) { if (o.emitAt) H.unshift({ at: +pD(String(o.emitAt).slice(0, 10)), by: o.emitBy || '', ev: 'Emitida' }); }
  if (o.aprovAt && !H.some(h => /provad/.test(h.ev || ''))) H.push({ at: o.aprovAt, by: o.aprovBy || '', ev: 'Aprovada e encerrada' });
  H.sort((a, b) => (a.at || 0) - (b.at || 0)); if (!H.length) return '';
  const dt = t => { const d = new Date(t); return isNaN(d) ? '—' : brD(isoD(d)) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  return `<div class="card"><div class="row"><h2>Histórico da OM</h2><span class="sp"></span><span class="note">trilha de auditoria: cada mudança de etapa, com quem fez e quando</span></div><div class="tw"><table class="t"><thead><tr><th>Data e hora</th><th>Quem</th><th>O que aconteceu</th></tr></thead><tbody>${H.map(h => `<tr><td class="mono">${dt(h.at)}</td><td>${esc(h.by || '—')}</td><td>${esc(h.ev || '')}${h.motivo ? ' · ' + esc(h.motivo) : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function omOrigemHTML(o) { if (!o || !o.fr027) return ''; const r = S.recs.get(o.fr027); if (!r) return '';
  return `<div class="banner info">Aberta pelo <b>FR 027_L de ${r.mov === 'saida' ? 'saída' : 'chegada'}</b> de ${brD(r.date)} ${esc(r.hora || '')} · ${esc(((r.ass || [])[0] || {}).nome || '')}${((r.ass || [])[1] || {}).nome ? ' · CTF ' + esc(r.ass[1].nome) : ''}<span class="sp"></span>${drivePdf(r.pdfFileId, '📄 Abrir o FR 027_L')}</div>`; }
// 6 · Hoje: o que precisa de você agora
function agoraLista() {
  const out = [], add = (p, txt, btn) => out.push({ p, txt, btn }), FM = frotaMatriz();
  FM.filter(x => x.sit >= 2 && !foraOp(x.v) && situDe(x.v) && x.v.situ.st === 'porto' && (x.sit === 3 || !x.noPend.some(p => p.c === 'Crítica'))).forEach(x => add(1, `<b>${esc(x.v.nome)}</b> · ${x.sit === 3 ? 'interditada' : 'saída bloqueada'}${x.noPend.some(p => p.c === 'Crítica') ? ' (falha Crítica sem OM)' : ''}`, `<button class="mbtn sm" data-agfs="${x.v.id}">Ver situação</button>`));
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => { const P = fr27Pend(v.id); if (!P.length) return; const g = P.some(p => p.c === 'Crítica' || p.c === 'Alta') ? 1 : 2;
    add(g, `<b>${esc(v.nome)}</b> · ${P.length} falha${P.length > 1 ? 's' : ''} sem OM (${[...new Set(P.map(x => (x.orig || 'FR 027_L').replace(/ \(.*$/, '').replace(/ OM \d+$/, '')))].join(', ')})${P.some(p => p.c === 'Crítica') ? ' · <b>Crítica · saída bloqueada</b>' : P.some(p => p.c === 'Alta') ? ' · Alta' : ''}`, `<button class="mbtn sm pri" data-fr27pend="${P[0].rec}">Informar OM</button>`); });
  oms().filter(o => o.tipo === 'C' && o.status !== 'encerrada' && (o.classe === 'Crítica' || o.classe === 'Alta') && !o.excluido).forEach(o => add(o.classe === 'Crítica' ? 1 : 2, `Corretiva <b>${esc(o.classe)}</b> OM ${esc(o.num)} · ${esc(vName(o.vessel))} · ${esc(ETAPAS_C.find(e => e[0] === o.status)?.[1] || o.status)}`, `<a class="mbtn sm" href="#om/${o.id}">Abrir</a>`));
  const G = {}; oms().filter(o => o.tipo === 'P' && !o.excluido && ['emitida', 'abordo', 'executada', 'conferencia'].includes(o.status)).forEach(o => (G[o.grupo || o.id] = G[o.grupo || o.id] || []).push(o));
  Object.entries(G).forEach(([g, L]) => { const o = L[0], st = o.grupo ? grpStatus(omGrupo(g)) : o.status, link = o.grupo ? `#omg/${encodeURIComponent(g)}` : `#om/${o.id}`; if (foraOp(vessel(o.vessel) || {})) return;
    if (st === 'conferencia') add(2, `OM ${esc(o.num)} · ${esc(vName(o.vessel))} · lançada, falta conferir e aprovar`, `<a class="mbtn sm pri" href="${link}">Conferir</a>`);
    else if (st === 'executada') add(2, `OM ${esc(o.num)} · ${esc(vName(o.vessel))} · executada, falta registrar a execução`, `<a class="mbtn sm" href="${link}">Lançar</a>`);
    else { const d = Math.floor((Date.now() - (Date.parse(o.emitAt || '') || o.createdAt || Date.now())) / 864e5); if (d >= 7) add(2, `OM ${esc(o.num)} · ${esc(vName(o.vessel))} · emitida há ${d} dias: o formulário já voltou? lançar`, `<a class="mbtn sm" href="${link}">Lançar</a>`); } });   /* sem os cliques Iniciar/Terminou: a OM vai de Emitida direto ao lançamento (decisão do Supervisor, 21/10/2026) */
  const hp = recs('horp').filter(r => !r.excluido).length; if (hp) add(2, `${hp} leitura(s) de horímetro esperando a sua confirmação`, `<a class="mbtn sm" href="#hor">Confirmar</a>`);
  const ol = lubDados().filter(x => !foraOp(x.v) && olStatus(x) === 'venc').length; if (ol) add(1, `${ol} troca(s) de óleo vencida(s)`, `<a class="mbtn sm" href="#oleo">Ver</a>`);
  const cp = cmpDados().filter(x => x.st === 'fora' || x.vencida).length; if (cp) add(1, `${cp} MCP com compressão abaixo do limite ou ensaio vencido`, `<a class="mbtn sm" href="#compr">Ver</a>`);
  const am = amoDados().M.filter(x => x.s.st === 'venc' || x.extra).length; if (am) add(2, `${am} amostra(s) de óleo do MCP vencida(s) ou coleta extra`, `<a class="mbtn sm" href="#anoleo">Ver</a>`);
  // MCA sem leitura há MCA_SEM_LEITURA_D dias e sem estimativa (bloco "Horímetros na prática")
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => MCAS.filter(p => (v.mca || {})[p]).forEach(p => { if (horEst(v, p)) return; const r = horAtual(v.id, p); if (!r) return;
    const dias = Math.floor((hoje() - pD(r.date)) / 864e5); if (dias < MCA_SEM_LEITURA_D) return; if (situEventos(v.id).length && horasPorEstado(v.id, +pD(r.date), Date.now(), { viagem: 12, boia: 12, cais: 0 }) < 24) return;   // ficou no cais: não trabalhou
    add(2, `<b>${esc(v.nome)}</b> · ${esc(posNome(v, p))} sem leitura há ${dias} dias (horímetro danificado ou obstruído?)`, `<button class="mbtn sm" data-agest="${v.id}|${p}">Estimar</button>`); }));
  // FR 022_B (SESMT) vencido no porto (bloco "Terminal")
  S.cfg.frota.filter(v => !foraOp(v) && situDe(v) && v.situ.st === 'porto' && fr22Vencido(v.id)).forEach(v => add(2, `<b>${esc(v.nome)}</b> · FR 022_B (SESMT) vencido desde ${brD(isoD(new Date(+pD(fr22Ult(v.id)) + FR22_DIAS * 864e5)))} · comunicar o SESMT antes da saída`, ''));
  // prazos da corretiva (NP 5.5.1) e eficácia
  const agora = Date.now(), atrasadas = new Set();
  oms().filter(o => o.tipo === 'C' && !o.excluido && omAtrasada(o) && !foraOp(vessel(o.vessel) || {})).forEach(o => { const p = +prazoCorretiva(o); if (!p) return; atrasadas.add(o.num);
    add(1, `Corretiva <b>${esc(o.classe)}</b> OM ${esc(o.num)} · ${esc(vName(o.vessel))} · <b>prazo de início estourado</b> há ${atrasoTx(agora - p)} (${esc(CLASSES[o.classe].prazo)})`, `<a class="mbtn sm pri" href="#om/${o.id}">Abrir</a>`); });
  const sem = out.filter(x => !(/^Corretiva <b>/.test(x.txt) && !/prazo de início/.test(x.txt) && [...atrasadas].some(n => x.txt.includes('OM ' + n + ' ·'))));   // sem repetir a corretiva atrasada
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => { const P = fr27Pend(v.id).filter(x => { const p = prazoDe(x.c, x.date ? (S.recs.get(x.rec) || {}).at || x.date : null); return p && agora > p; });
    if (!P.length) return; const pz = ` · <b>prazo estourado</b> (${[...new Set(P.map(x => x.c))].join(', ')})`, cab = `<b>${esc(v.nome)}</b> · `;
    const ja = sem.find(x => x.txt.startsWith(cab) && x.txt.includes(' sem OM ('));   /* a mesma falha já tem linha: acrescenta o prazo nela (antes eram 3 linhas P1) */
    if (ja) { ja.txt += pz; ja.p = Math.min(ja.p, P.some(x => x.c === 'Crítica' || x.c === 'Alta') ? 1 : 2); return; }
    sem.push({ p: P.some(x => x.c === 'Crítica' || x.c === 'Alta') ? 1 : 2, txt: cab + `${P.length} falha${P.length > 1 ? 's' : ''} sem OM` + pz, btn: `<button class="mbtn sm pri" data-fr27pend="${P[0].rec}">Informar OM</button>` }); });
  oms().filter(o => o.tipo === 'C' && !o.excluido && o.revPlano === 'Sim' && (o.itensRev || []).length && !o.revFeita).forEach(o => sem.push({ p: 2, txt: `Revisar no Anexo I: ${esc(o.itensRev.map(k => { const t = A1M[k.split('|')[1]]; return t ? t.chk || t.item : k; }).join(', '))} · corretiva OM ${esc(o.num)} · ${esc(vName(o.vessel))}`, btn: `<a class="mbtn sm" href="#om/${o.id}">Ver</a>` }));   // a falha mostrou que o plano precisa mudar
  efPend().forEach(o => sem.push({ p: 2, txt: `Verificação de eficácia da corretiva <b>${esc(o.classe)}</b> OM ${esc(o.num)} · ${esc(vName(o.vessel))} (${EF_DIAS} dias) pendente`, btn: `<a class="mbtn sm" href="#om/${o.id}">Verificar</a>` }));
  // parâmetros do MCP em viagem (bloco "Parâmetros do MCP em viagem")
  pmcDados().forEach(x => { if (!x.ul || x.st === 'ok' || x.dias > PMC_REC_D) return;
    sem.push({ p: x.st === 'venc' ? 1 : 2, txt: `<b>${esc(pmcNome(x.v, x.pos))}</b> · ${esc(x.a.txt.join(' · '))} · leitura de ${brD(x.ul.date)} informada por ${esc(x.ul.quem || '')}${x.a.aprox ? ' (sem óleo a 90–100 °C: comparação aproximada)' : ''}`,
      btn: `<a class="mbtn sm" href="#parmcp" data-pmcsel="${pmcKey(x)}">Ver</a>${x.st === 'venc' ? ` <button class="mbtn sm" data-avaria="${x.v.id}">⚠ Avaria</button>` : ''}` }); });
  const nsk = skPend().length;   // Anexar no Sankhya
  if (nsk) sem.push({ p: 2, txt: `${nsk} OM${nsk > 1 ? 's' : ''} encerrada${nsk > 1 ? 's' : ''} no SMF: falta anexar o PDF e encerrar no Sankhya`, btn: '<a class="mbtn sm" href="#omconf">Ver</a>' });
  S.cfg.frota.forEach(v => { const P = popaPend(v); if (P.length) sem.push({ p: 2, txt: `<b>${esc(v.nome)}</b> · trocar o óleo ${P.map(popaDo).join(' e ')} antes de sair (a cada saída · sem isso a saída fica com restrição)`, btn: `<a class="mbtn sm" href="#oleo">FR 049_B</a>` }); });   // motor de popa e motobomba 5 HP
  return sem.sort((a, b) => a.p - b.p);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-agfs]'); if (!b) return; e.preventDefault(); e.stopPropagation(); FS_SEL = b.dataset.agfs; render(); setTimeout(() => { const c = document.querySelector('#main .fs-card'); if (c) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 350); }, true);
