/* ===== Menu pela NP 055 (aprovado em 22/10/2026): Operação (NP 5 e 7.3) · Acompanhamento (NP 6, 7 e 9) · Suporte (NP 5.6, 5.7, 8 e 10) =====
   · Registros e evidências (view regs, NP 8): FR 027_L, Anexo II-B, Anexo II-A (+ RNC em Crítica/Alta) e FR 049_B num lugar só, por empurrador, período e tipo, com o PDF no Drive e se já foi anexado no Sankhya (skFim)
   · item da NP ao lado do título de cada tela (NP_TAG) · Biblioteca em abas (Documentos, Peças e estoque mínimo, Prestadores, Treinamento, Óleo e resíduos)
   · Plano preventivo ganha a aba Equipamentos críticos (view critic, NP 6, derivada da prioridade do Anexo I) */
'use strict';
const REGF = { v: '', per: '3m', t: 'todos', sk: '' };
function regLista() {
  const L = [], vis = new Set();
  recs('fr027').forEach(r => L.push({ d: r.date, vid: r.vessel, doc: 'FR 027_L', cls: 'p-inf', ref: r.mov === 'saida' ? 'Saída' : 'Chegada', pdf: drivePdf(r.pdfFileId, '📄 PDF'), sk: null, go: '' }));
  oms().filter(o => o.status === 'encerrada' && !o.excluido).forEach(o => { const g = o.grupo || o.id; if (vis.has(g)) return; vis.add(g); const P = o.grupo ? omGrupo(o.grupo) : [o], h = P.find(x => x.pdfFileId) || P[0], c = o.tipo === 'C';
    L.push({ d: o.dreal || isoD(new Date(o.fechadoAt || 0)), vid: o.vessel, doc: c ? 'Anexo II-A' : 'Anexo II-B', cls: c ? 'p-bad' : 'p-ok', ref: 'OM ' + (o.num || '—') + (c && /Crít|Alta/.test(o.classe || '') ? ' · RNC' : ''), pdf: drivePdf(h.pdfFileId, '📄 PDF'), sk: P.some(x => x.skFim) ? (P.find(x => x.skFim).skFim) : (o.seed ? 'seed' : false), go: o.grupo ? '#omg/' + encodeURIComponent(g) : '#om/' + o.id }); });
  recs('lub').filter(r => r.tipo === 'fr049').forEach(r => L.push({ d: r.date, vid: r.vessel, doc: 'FR 049_B', cls: 'p-warn', ref: r.om ? 'OM ' + r.om : 'sem nº de OM', pdf: drivePdf(r.pdfFileId, '📄 PDF'), sk: r.om ? (r.skFim || (r.seed ? 'seed' : false)) : null, go: '' }));
  return L.sort((a, b) => String(b.d).localeCompare(String(a.d)));
}
function vRegs() {
  const H = hoje(), ini = REGF.per === 'mes' ? isoD(new Date(H.getFullYear(), H.getMonth(), 1)) : REGF.per === '3m' ? isoD(new Date(H.getFullYear(), H.getMonth() - 2, 1)) : REGF.per === 'ano' ? isoD(new Date(H.getFullYear(), 0, 1)) : '';
  const T0 = regLista().filter(x => (!REGF.v || x.vid === REGF.v) && (!ini || String(x.d) >= ini));
  const T = T0.filter(x => (REGF.t === 'todos' || x.doc === REGF.t) && (!REGF.sk || x.sk === false));
  const chip = (k, val, l, n) => `<button class="cm-chip${REGF[k] === val ? ' on' : ''}" data-rgf="${k}|${val}">${l}${n != null ? ` <b>${n}</b>` : ''}</button>`;
  const c = d => T0.filter(x => x.doc === d).length, falta = T0.filter(x => x.sk === false).length;
  const skTx = x => x.sk === null ? '<span class="note">—</span>' : x.sk === 'seed' ? '<span class="note">exemplo</span>' : x.sk ? `<span class="pill p-ok">✓ anexado ${x.sk.at ? brD(String(x.sk.at).slice(0, 10)) : ''}</span>` : '<span class="pill p-bad">falta anexar</span>';
  const sel = `<select id="rgV" style="width:auto"><option value="">Todos os empurradores</option>${S.cfg.frota.map(v => `<option value="${v.id}"${REGF.v === v.id ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</select>`;
  return `<div class="vh"><div><h1>Registros e evidências</h1><p>x</p></div></div>
   <div class="card"><h2>Registros · ${T.length}</h2>
    <div class="cm-chips" style="margin-bottom:6px">${sel}<span class="note" style="margin:0 4px 0 10px">Período</span>${chip('per', 'mes', 'Este mês')}${chip('per', '3m', 'Últimos 3 meses')}${chip('per', 'ano', 'Este ano')}${chip('per', 'tudo', 'Tudo')}</div>
    <div class="cm-chips" style="margin-bottom:10px"><span class="note" style="margin-right:4px">Documento</span>${chip('t', 'todos', 'Todos', T0.length)}${['FR 027_L', 'Anexo II-B', 'Anexo II-A', 'FR 049_B'].map(d => chip('t', d, d, c(d))).join('')}<span style="width:10px"></span>${chip('sk', REGF.sk ? '' : '1', 'Só o que falta anexar no Sankhya', falta)}</div>
    <div class="tw" style="max-height:560px;overflow:auto"><table class="t"><thead><tr><th>Data</th><th>Empurrador</th><th>Documento</th><th>Referência</th><th>Evidência</th><th>Sankhya</th><th></th></tr></thead><tbody>
    ${T.slice(0, 300).map(x => `<tr><td class="mono">${x.d ? brD(String(x.d).slice(0, 10)) : '—'}</td><td><b>${esc(vName(x.vid))}</b></td><td><span class="pill ${x.cls}">${x.doc}</span></td><td>${esc(x.ref)}</td><td>${x.pdf}</td><td>${skTx(x)}</td><td class="rt-b">${x.go ? `<a class="mbtn sm" href="${x.go}">Abrir</a>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="note">Nenhum registro neste filtro.</td></tr>'}</tbody></table></div>
    <p class="note">FR 027_L não vai para o Sankhya (fica no Drive). Anexo II e FR 049_B com nº de OM são anexados na OM do Sankhya, marcados em 4 · Conferir e encerrar.</p></div>`;
}
VX.regs = vRegs;
padTela('regs', { titulo: 'Registros e evidências', desc: 'Tudo o que a auditoria pede, por empurrador e período',
  resumo: () => { const L = regLista(); return [['Registros no total', L.length], ['Sem PDF no Drive', L.filter(x => /depois de sincronizar/.test(x.pdf)).length, 'var(--warnt)'], ['Falta anexar no Sankhya', L.filter(x => x.sk === false).length, 'var(--badt)']]; } });
document.addEventListener('click', e => { const b = e.target.closest('[data-rgf]'); if (!b || VIEW !== 'regs') return; e.preventDefault(); e.stopPropagation(); const [k, v] = b.dataset.rgf.split('|'); REGF[k] = v; render(); }, true);
document.addEventListener('change', e => { if (e.target.id === 'rgV' && VIEW === 'regs') { REGF.v = e.target.value; render(); } }, true);
/* Equipamentos críticos (NP 6), derivado da prioridade dos itens do Anexo I */
VX.critic = () => { MX.prio = 'Crítica'; setTimeout(() => location.replace('#matriz'), 0); return ''; };   // aba saiu (decisão do Supervisor, 24/10/2026): Anexo I com o filtro Crítica e Alta
/* NP Navecunha 055, item 6.3 · Relação de Equipamentos Críticos (texto da norma) */
const NP63 = [
  ['1. Sistema de Propulsão', 'Motores principais Mitsubishi (S6R2 / S6R) e Reversores/Redutores (Hitachi, Masson e Reintjes)', 'Avaria mecânica severa por fadiga ou perda de pressão; colisão direta de comboios e comboio à deriva.', 'Monitoramento visual do padrão da fumaça de escape, controle do nível de óleo por vareta mecânica e verificação de ruídos/vibrações incomuns.', 'Inspeção antes da saída (item 5.3) e inspeção diária em viagem (item 5.4).'],
  ['2. Manobrabilidade e Governo', 'Cilindro Hidráulico do Leme, Bombas e Orbitrol', 'Travamento mecânico ou perda súbita de fluido por estouro de mangueira, resultando em perda total de governo.', 'Inspeção diária visual de mangueiras de alta pressão (procura por bolhas, fissuras) e teste de batente antes de desatracar.', 'Check pré-operação diário e monitoramento de pressão no painel.'],
  ['3. Geração Elétrica de Bordo', 'Grupo Gerador Auxiliar (MCA) e Alternador Bambozzi 30 kVA', 'Blackout total na embarcação; apagamento de instrumentos de navegação noturna e falha de bombas.', 'Exame visual de bornes e cabos de bateria (limpeza/aperto), conferência do nível de solução e teste de carga no arranque.', 'Inspeção antes da saída (item 5.3) e inspeção diária em viagem (item 5.4).'],
  ['4. Resposta a Emergências', 'Motobomba de Combate a Incêndio de Alta Pressão', 'Fogo fora de controle na praça de máquinas ou em balsas por indisponibilidade de recalque.', 'Simulado de partida rápida com motor frio; inspeção visual de corrosão na carcaça e alinhamento de suportes.', 'Teste mecânico de funcionamento Semestral com registro em folha de bordo.'],
  ['5. Salvaguarda e Flutuabilidade (Sensores, Bombas de Porão e Linha de Eixos)', 'Sensores de Nível e Bombas Centrífugas de Porão', 'Alagamento silencioso da praça de máquinas ou porões, progredindo para adernamento ou sinistro.', 'Teste manual do braço atuador das boias, acionamento das bombas e ajuste do gotejamento das gaxetas do eixo.', 'Inspeção visual diária do porão e teste de sensores semanal.'],
  ['6. Alimentação de Combustível', 'Filtros Separadores (Racor) e Válvulas de Fechamento Rápido', 'Contaminação por água causando corte súbito de potência; vazamento de diesel com risco de ignição.', 'Drenagem física e purga do copo sedimentador; inspeção de trincas nas vedações e teste das válvulas de corte.', 'Drenagem diária na rotina matinal e teste das válvulas trimestral.'],
  ['7. Sinalização e Comunicação', 'Rádio VHF Fixo, Luzes de Navegação.', 'Incomunicabilidade em sinistros; colisão por falta de sinalização noturna; falha na parada remota.', 'Teste prático de rádio; verificação noturna da sinalização; teste mecânico do botão de emergência.', 'Rádio VHF e sinalização: verificação diária antes da navegação. Botão de parada de emergência: teste a cada saída do porto (item 5.3).'],
  ['8. Fainas de Amarra e Carga', 'Guinchos de Amarra, Molinetes e Cabos de Aço de Fixação', 'Rompimento de cabos sob tensão extrema; balsas à deriva e risco de esmagamento de tripulantes.', 'Inspeção visual minuciosa buscando fios partidos, amassamentos ou corrosão e verificação dos freios.', 'Inspeção visual obrigatória a cada faina de engate/desengate.']];
function critPDF() {   // lista de equipamentos críticos (NP 6) para a auditoria, em A4
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para gerar o PDF.');
  const corpo = `<table><thead><tr><th style="width:15%">Sistema operacional</th><th style="width:19%">Ativo crítico mapeado</th><th style="width:24%">Impacto de risco / causa raiz</th><th style="width:24%">Controle e ação técnica</th><th>Gatilho / frequência</th></tr></thead><tbody>${NP63.map(r => `<tr>${r.map((c, i) => `<td>${i ? esc(c) : '<b>' + esc(c) + '</b>'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Equipamentos críticos · NP 055 item 6.3</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;font-size:11px;color:#202124;margin:0}
   .hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #16244A;padding-bottom:6px;margin-bottom:10px}.hd img{height:34px}.hd h1{font-size:16px;margin:0;color:#16244A}.hd p{margin:2px 0 0;font-size:10px;color:#5F6368}
   .card{margin:0 0 12px;break-inside:avoid}.card h2{font-size:13px;margin:0 0 4px;color:#16244A}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #DADCE0;padding:3px 5px;text-align:left;vertical-align:top}th{font-size:9.5px;text-transform:uppercase;color:#5F6368}.r{text-align:right}.note{font-size:10px;color:#5F6368}
   .ass{display:flex;gap:80px;margin-top:24px}.ass div{flex:1;border-top:1px solid #000;padding-top:3px;text-align:center;font-size:10px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
   <div class="hd"><img src="${new URL(LOGOS.nav, location.href)}" alt=""><img src="${new URL(LOGOS.vda, location.href)}" alt=""><div><h1>Relação de equipamentos críticos · NP Navecunha 055 item 6.3</h1><p>Critérios de criticidade: segurança e saúde, meio ambiente, operação e qualidade (item 6.2) · emitido em ${hoje().toLocaleDateString('pt-BR')} pelo SMF</p></div></div>
   ${corpo}<p class="note">Itens do Anexo I desses equipamentos têm prioridade Crítica: vencido sem OM bloqueia a saída (NP 5.5).</p><div class="ass"><div>Supervisor de Manutenção</div><div>Data</div></div><script>setTimeout(function(){window.print()},600)<\/script></body></html>`); w.document.close();
}
padTela('critic', { titulo: 'Equipamentos críticos', desc: 'Equipamentos com itens de prioridade Crítica ou Alta no Anexo I',
  resumo: () => { const P = A1.filter(t => t.kind !== 'sup'); let blo = 0; try { blo = frotaMatriz().filter(x => x.sit >= 2).length; } catch (e) { } return [['Equipamentos com item Crítico', new Set(P.filter(t => t.prio === 'Crítica').map(t => t.sis + t.eqn)).size, 'var(--badt)'], ['Itens Críticos', P.filter(t => t.prio === 'Crítica').length, 'var(--badt)'], ['Itens Alta', P.filter(t => t.prio === 'Alta').length, 'var(--warnt)'], ['Empurradores bloqueados agora', blo, blo ? 'var(--badt)' : 'var(--okt)']]; } });
/* menu: Suporte = Registros e evidências · Biblioteca (abas) · Administração; Plano preventivo ganha Equipamentos críticos */
{ const by = id => SECOES.find(s => s.id === id), cr = by('crono'), cd = by('cond2'), bib = by('apoio2'), adm = by('adm');
  if (cr) cr.sub = 'cronograma, Anexo I';   // a aba Equipamentos críticos saiu: o Anexo I tem o filtro Crítica e Alta e o PDF da NP 6
  if (cd) cd.extra = (cd.extra || []).filter(x => x !== 'lubcons');
  if (bib) { bib.views = [['bib', 'Documentos'], ['pecas', 'Peças e estoque mínimo'], ['terc', 'Prestadores'], ['trein', 'Treinamento'], ['lubcons', 'Óleo e resíduos']]; bib.extra = [...new Set((bib.extra || []).filter(x => !['bib', 'pecas', 'terc', 'trein', 'lubcons'].includes(x)).concat(['apoio']))]; bib.sub = 'documentos, peças, treinamento'; }
  if (!by('regs2')) { const i = SECOES.indexOf(bib); SECOES.splice(i < 0 ? SECOES.length : i, 0, { id: 'regs2', nome: 'Registros e evidências', sub: 'para a auditoria', views: [['regs', 'Registros e evidências']], cfg: true }); }
  if (adm) adm.sub = 'usuários, frota, nuvem';
  ICO.regs2 = '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13l2 2 4-4"/>'; }
/* item da NP 055 ao lado do título de cada tela */
const NP_TAG = { rotina: '5.3 a 5.5', barco: '5.3 a 5.5', emitir: '7.3', oms: '7.2', falhas2: '5.5', omconf: '7.4 e 5.8', om: '7.4 · Anexo II', omg: '7.4 · Anexo II-B', cxr: '7.3', matriz: '7 · Anexo I', critic: '6', controle: '7',
  horfrota: '5.5.1', hor: '5.5.1', oleo: '7 · FR 049_B', anoleo: '7', parmcp: '5.4', compr: '7', kpi: '9', regs: '8', bib: '8', apoio: '8', pecas: '5.6 e 5.6.1', terc: '5.8', trein: '10', lubcons: '5.7', admin: '4' };
{ const st = document.createElement('style'); st.textContent = `.np-tag{display:inline-block;margin-left:10px;padding:2px 8px;border:1px solid #C6DAFC;background:#F3F7FE;color:#1967D2;border-radius:5px;font-size:11.5px;font-weight:600;letter-spacing:.2px;vertical-align:middle}`; document.head.appendChild(st); }
