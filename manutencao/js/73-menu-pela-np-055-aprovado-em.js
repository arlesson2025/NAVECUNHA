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
// o que é cada documento (aparece ao passar o mouse no filtro e na etiqueta da tabela)



padTela('regs', { titulo: 'Registros e evidências', desc: 'Tudo o que a auditoria pede, por empurrador e período',
  resumo: () => { const L = regLista(); return [['Registros no total', L.length], ['Sem PDF no Drive', L.filter(x => /depois de sincronizar/.test(x.pdf)).length, 'var(--warnt)'], ['Falta anexar no Sankhya', L.filter(x => x.sk === false).length, 'var(--badt)']]; } });
document.addEventListener('click', e => { const b = e.target.closest('[data-rgf]'); if (!b || VIEW !== 'regs') return; e.preventDefault(); e.stopPropagation(); const [k, v] = b.dataset.rgf.split('|'); REGF[k] = v; render(); }, true);
document.addEventListener('change', e => { if (e.target.id === 'rgV' && VIEW === 'regs') { REGF.v = e.target.value; render(); } }, true);
/* Equipamentos críticos (NP 6), derivado da prioridade dos itens do Anexo I */
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
