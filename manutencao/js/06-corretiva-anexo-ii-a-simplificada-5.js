/* =====================================================================
   CORRETIVA (Anexo II-A) SIMPLIFICADA · 5 blocos, campos conforme a classe
   ISO 9001 10.2 (reagir, causa, ação, eficácia) · ISO 14001 / 45001 (contenção)
   Os campos gravados são os mesmos de antes: indicadores, relatório e planilha continuam iguais.
   ===================================================================== */
'use strict';
// modo de falha e causa padronizados (base ISO 14224, simplificada para a frota)
const MODOS = ['Vazamento', 'Superaquecimento', 'Perda de pressão ou vazão', 'Vibração ou ruído anormal', 'Falha elétrica ou sem partida', 'Quebra ou ruptura', 'Desgaste ou folga excessiva', 'Contaminação (água, combustível, partículas)', 'Não funciona quando acionado', 'Indicação falsa ou instrumento', 'Outro'];
const CAUSAS = ['Desgaste natural (fim de vida)', 'Montagem ou instalação incorreta', 'Operação inadequada', 'Manutenção não feita ou fora do prazo', 'Peça ou material com defeito', 'Projeto ou especificação inadequada', 'Lubrificação inadequada', 'Causa externa (detrito, colisão, água do rio)', 'Causa não identificada'];
const IMPACTOS = ['Segurança da tripulação', 'Meio ambiente (vazamento / descarte)', 'Operação (parada ou atraso)', 'Sem impacto além do equipamento'];
const EF_DIAS = 90;   // verificação da eficácia: 90 dias após a liberação (ou o prazo da medida)
const efPrev = o => o.efPrev || (() => { const b = o.mitigPrazo ? pD(o.mitigPrazo) : o.liberacao ? pD(o.liberacao) : null; return b ? isoD(new Date(b.getTime() + EF_DIAS * 864e5)) : ''; })();
const ehCA = o => o.classe === 'Crítica' || o.classe === 'Alta';
const efPend = () => oms().filter(o => o.tipo === 'C' && o.status === 'encerrada' && ehCA(o) && !o.efRes && efPrev(o) && efPrev(o) <= isoD(hoje()));
const blkH = (n, t, r, cls) => `<div class="cblk-h ${cls || ''}"><b>${n}</b><div><h3>${t}</h3>${r ? `<span>${r}</span>` : ''}</div></div>`;
function formIIA(o) {
  const terc = o.exec === 'Terceiro', crit = o.classe === 'Crítica', ca = ehCA(o);
  if (crit && o.interd !== 'Sim') o.interd = 'Sim';
  return `<div class="card cblk">${blkH(1, 'Descrição da falha', 'identificação e falha (“antes”)')}<div class="g">
    <label class="f s2">Nº da OM (Sankhya)<input value="${esc(o.num)}" readonly></label><label class="f s2">Embarcação<input value="${esc(vName(o.vessel))}" readonly></label><label class="f s2">Classe<input value="${esc(o.classe)}" readonly></label>
    ${fSel(o, 'sistema', 'Sistema (7.1)', SISTEMAS, 's3')}${fIn(o, 'equip', 'Equipamento / componente', 's3')}
    <label class="f s1">Posição<input value="${POSN[o.pos]}" readonly></label>${fIn(o, 'horimetro', 'Horímetro (h)', 's1', 'inputmode="numeric"')}${fRad(o, 'local', 'Local', ['Terminal', 'Em viagem'], 's2')}${fIn(o, 'trecho', 'Trecho (se em viagem)', 's2')}
    ${fTA(o, 'descricao', 'Descrição da falha (modo de detecção, localização, sintomas)', 's6', 3)}${fSel(o, 'modo', 'Modo de falha (ISO 14224)' + (ca ? ' · obrigatório' : ''), MODOS, 's3')}
    ${fDT(o, 'abertura', 'Abertura da OM', 's2')}${fSel(o, 'origem', 'Origem', ['FR 027_L', 'Pré-operacional', 'Em viagem (Autotrac)', 'SESMT', 'Outra'], 's2')}${ca ? fIn(o, 'rnc', 'Nº da RNC (obrigatório)', 's2') : ''}
    ${ca ? fMul(o, 'comunicado', 'Comunicado imediatamente a (5.4.1)', ['Coordenação de Operações', 'Supervisão de Manutenção'], 's6') : ''}
    ${crit ? fDT(o, 'interdDT', 'Interditada desde', 's3') + fIn(o, 'interdPor', 'Interdição determinada por', 's3') : ''}</div>
    ${crit ? '<div class="banner bad">Falha Crítica: a embarcação está interditada até a liberação do Coordenador de Operações e do Supervisor de Manutenção (bloco 5).</div>' : ''}
    <details class="cdet"><summary>Parâmetros observados na hora (opcional)</summary><div class="g">${[['oleo', 'Pressão de óleo'], ['tagua', 'Temp. da água'], ['toleo', 'Temp. do óleo'], ['rpm', 'RPM'], ['bat', 'Bateria'], ['outro', 'Outro']].map(([k, l]) => fIn(o, 'par|' + k, l, 's1')).join('')}${fDT(o, 'deteccao', 'Detecção', 's2')}${fDT(o, 'comunicacao', 'Comunicação', 's2')}${fRad(o, 'meio', 'Meio', ['Autotrac', 'Telefone', 'Presencial'], 's2')}</div></details></div>

  <div class="card cblk">${blkH(2, 'Ação de contenção', 'proteger pessoas, meio ambiente e operação · ISO 9001 10.2.1 · ISO 14001 · ISO 45001', 'amb')}<div class="g">
    ${fMul(o, 'impacto', 'A falha afetou', IMPACTOS, 's6')}
    ${fTA(o, 'contencao', 'Ação de contenção executada' + (ca ? ' (obrigatório)' : ''), 's6', 2, 'ex.: motor parado, vazamento contido com absorvente, área isolada, empurrador fundeado')}
    ${fIn(o, 'pt', 'Nº da PT do SESMT (só atividade de risco · 5.11.2)', 's3', 'placeholder="N/A"')}${fIn(o, 'sesmt', 'Liberação do SESMT · responsável', 's3', 'placeholder="N/A"')}</div></div>

  <div class="card cblk">${blkH(3, 'Reparo e restabelecimento', 'execução e condição final (“depois”)')}<div class="g">
    ${fRad(o, 'exec', 'Quem executou', ['Equipe própria', 'Terceiro'], 's2')}${fIn(o, 'execn', terc ? 'Empresa e responsável técnico' : 'Nome e função', 's4')}
    ${terc ? fRad(o, 'terceiroAut', 'Autorização da Gerência (5.11.3)', ['Sim — autorização da Gerência/Diretoria', 'Não'], 's3') + fIn(o, 'scoc', 'Nº SC / OC', 's1') + fRad(o, 'relTerc', 'Relatório do fornecedor (5.8)', ['Relatório do fornecedor anexo', 'Fornecedor não emitiu — Supervisor preenche'], 's2') : ''}
    ${fDT(o, 'inicio', 'Início do reparo', 's2')}${fDT(o, 'termino', 'Término do reparo', 's2')}${fIn(o, 'rms', 'Nº das RMs', 's2')}
    ${fIn(o, 'hh', 'Horas-homem (HH)', 's2', 'inputmode="decimal"')}${fIn(o, 'custoMat', 'Custo de peças e materiais (R$)', 's2', 'inputmode="decimal"')}${fIn(o, 'custoServ', 'Custo de serviço de terceiro (R$)', 's2', 'inputmode="decimal"')}
    ${fTA(o, 'servicos', 'Serviço executado (consultar o Anexo I · 7.2)', 's6', 3)}${refeitosHTML(o)}</div>
    ${tabelaLivre(o, 'mats', 'Peças e materiais', ['Descrição', 'Qtd.', 'Nº da RM / NF', 'Lote', 'Validade'])}
    <details class="cdet"${(o.medsC || []).length ? ' open' : ''}><summary>Medições (se houver)</summary>${tabelaLivre(o, 'medsC', 'Medições', ['Medição / parâmetro', 'Especificado', 'Como encontrado', 'Como deixado', 'Unidade'])}</details>
    <div class="g">${fRad(o, 'resid', 'Gerou resíduo? (5.7)', ['Não', 'Sim'], 's2')}${fMul(o, 'residT', 'Quais (se gerou)', ['Óleo usado', 'Filtros', 'Estopas/panos', 'Metais', 'Outros'], 's2')}${fIn(o, 'fr016', 'Nº FR 016_E (se gerou)', 's2')}
    ${fIn(o, 'teste', 'Teste funcional para liberação', 's4')}${fRad(o, 'resultado', 'Resultado', ['Conforme', 'Não conforme'], 's2')}${fIn(o, 'inspecao', 'Nova inspeção de segurança (5.4.1) · responsável', 's6')}</div>
    <div class="sec-h" style="margin-top:8px">Fotos antes e depois <span class="r">item 5.8</span></div>${fotosHtml(o)}</div>

  <div class="card cblk">${blkH(4, 'Análise de causa e ação corretiva', ca ? 'obrigatório em Crítica e Alta · detalhe na RNC' : 'opcional em Média e Baixa')}
    ${ca ? '' : '<details class="cdet"' + ((o.causa || o.mitig) ? ' open' : '') + '><summary>Registrar causa e ação (opcional)</summary>'}<div class="g">
    ${fSel(o, 'causaCat', 'Causa da falha (ISO 14224)', CAUSAS, 's3')}${fTA(o, 'causa', 'Análise de causa raiz (5 porquês)', 's6', 2)}
    ${fTA(o, 'mitig', 'Ação corretiva (eliminação da causa raiz)', 's6', 2)}${fIn(o, 'mitigResp', 'Responsável', 's2')}${fDT(o, 'mitigPrazo', 'Prazo', 's2', 'date')}${fSel(o, 'mitigSt', 'Situação', ['Pendente', 'Em andamento', 'Concluída'], 's2')}
    ${fRad(o, 'revPlano', 'A falha mostra que o plano preventivo precisa mudar?', ['Não', 'Sim'], 's4')}${ca ? fDT(o, 'trPrev', 'Treinamento pós-falha (2 h · 10.3)', 's2', 'date') : ''}${o.revPlano === 'Sim' ? revPlanoHTML(o) : ''}</div>${ca ? '' : '</details>'}</div>

  <div class="card cblk">${blkH(5, 'Liberação para operação', 'assinaturas e aprovação do Supervisor')}<div class="g">
    ${fIn(o, 'ass|exec', 'Executor', 's2')}${fIn(o, 'ass|cmd', 'Recebido a bordo · Comandante ou Coordenador de Operações (4.7)', 's2')}${crit ? fIn(o, 'ass|coord', 'Coordenador de Operações · liberação', 's2') : ''}${fDT(o, 'liberacao', 'Liberação à operação', 's2')}${fIn(o, 'conferencia', 'Conferência documental · nome', 's2')}</div>
    <div class="note">${ca ? `Depois de encerrada, a corretiva pede a <b>verificação da eficácia</b> em ${EF_DIAS} dias (ISO 9001 10.2): confirmar que a falha não voltou.` : ''}</div>${aprovacaoHtml(o)}</div>`;
}
// verificação da eficácia: fica editável depois de encerrada (fora do formulário bloqueado)
function omEficaciaHTML(o) {   /* verificação de eficácia da corretiva Crítica/Alta encerrada (ISO 9001 10.2.1 d) */
  if (!o || o.tipo !== 'C' || o.status !== 'encerrada' || !ehCA(o)) return '';
  const pv = efPrev(o), venc = !o.efRes && pv && pv <= isoD(hoje()), reinc = typeof falhasDados === 'function' && falhasDados(24).some(f => f.id !== o.id && f.vessel === o.vessel && f._comp && (f._comp || '').toLowerCase() === String(o.equip || '').toLowerCase() && pD(f.abertura) > pD(o.liberacao || o.abertura));
  const card = `<div class="card cblk ef">${blkH('✓', 'Verificação da eficácia', 'ISO 9001 10.2.1 d · a ação funcionou?')}
   ${reinc ? '<div class="banner bad">Atenção: houve nova falha do mesmo componente neste empurrador depois desta corretiva.</div>' : ''}
   ${o.efRes ? `<p>${o.efRes === 'Eficaz' ? '<span class="pill p-ok">Eficaz</span>' : '<span class="pill p-bad">Não eficaz</span>'} verificada em ${brD(o.efData)} por ${esc(o.efBy || '')}${o.efObs ? ' · ' + esc(o.efObs) : ''}</p>` : `<p class="note">${venc ? '<b style="color:var(--badt)">Verificação vencida</b> desde ' + brD(pv) : 'Verificar a partir de ' + brD(pv)} (${EF_DIAS} dias depois da liberação ou do prazo da medida). Confira se a falha voltou, se a medida foi aplicada e se precisa mudar o Anexo I.</p>`}
   ${can.admin() ? `<div class="g"><label class="f s2">Resultado<select id="efR"><option value="">Escolha…</option>${['Eficaz', 'Não eficaz'].map(x => `<option${o.efRes === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label><label class="f s2">Data<input id="efD" type="date" value="${esc(o.efData || isoD(hoje()))}"></label><label class="f s4">Observação<input id="efO" value="${esc(o.efObs || '')}" placeholder="ex.: 4 meses sem reincidência; não eficaz → nova OM 48xxx"></label></div><div class="row"><button class="mbtn pri" data-ef="salvar">Registrar verificação</button></div>` : '<p class="note">Somente o Supervisor registra a verificação.</p>'}</div>`;
  return card;
}


