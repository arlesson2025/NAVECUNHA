/* ===== Lançamento rápido honesto (OM preventiva de janela, vOmg) =====
   Executa a equipe de manutenção ou um terceiro (CTF/MFM nunca: eles fazem só rotina e troca de óleo). Recebe a bordo o Comandante ou o Coordenador de Operações.
   Prova: foto do formulário de execução assinado (obrigatória). Terceiro: prestador do cadastro + relatório do fornecedor anexado ou, sem ele, o Supervisor registra (NP 5.8).
   Os passos do Anexo I não são mais marcados automaticamente: ficam "conforme o formulário assinado" (o.passosFicha). */
'use strict';
const RG_PROVA = ['FORMULÁRIO ASSINADO', 'RELATÓRIO DO FORNECEDOR'];
const RG_REL = ['Relatório do fornecedor anexo', 'Fornecedor não emitiu — Supervisor preenche'];
const rgSel = (k, lab, cls, ops, val) => `<label class="f ${cls}">${lab}<select data-rg="${k}"><option value="">Escolha…</option>${ops.map(([v, l]) => `<option value="${esc(v)}"${val === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
const rgIn = (k, lab, cls, R, ph = '') => `<label class="f ${cls}">${lab}<input data-rg="${k}" value="${esc(R[k] || '')}"${ph ? ` placeholder="${esc(ph)}"` : ''}></label>`;
function rgExecHTML(R) {
  const terc = R.execTipo === 'terceiro', T = recs('terc').filter(x => !x.excluido).sort((a, b) => (a.empresa || '').localeCompare(b.empresa || ''));
  return rgSel('execTipo', 'Quem executou', 's2', [['equipe', 'Equipe de manutenção'], ['terceiro', 'Terceiro (prestador)']], R.execTipo)
    + (terc ? (T.length ? rgSel('terc', 'Prestador (cadastro)', 's2', T.map(x => [x.id, x.empresa + (x.validade && x.validade < isoD(hoje()) ? ' · contrato vencido' : '')]), R.terc) : `<div class="f s2"><span>Prestador (cadastro)</span><a class="note" href="#terc">cadastrar o prestador primeiro</a></div>`)
        + rgIn('execn', 'Responsável técnico do terceiro', 's2', R, 'Nome e função')
        + rgSel('relTerc', 'Relatório do terceiro (NP 5.8)', 's3', RG_REL.map(x => [x, x]), R.relTerc) + (R.relTerc === RG_REL[0] ? rgIn('relNum', 'Nº do relatório', 's2', R) : '')
      : R.execTipo === 'equipe' ? rgIn('execn', 'Equipe de manutenção (nomes e funções)', 's4', R, 'Ex.: João (mecânico), Pedro (auxiliar)') : '')
    + rgSel('recFunc', 'Recebido a bordo por', 's2', [['Comandante', 'Comandante'], ['Coordenador de Operações', 'Coordenador de Operações']], R.recFunc) + rgIn('recNome', 'Nome de quem recebeu', 's3', R);
}
function rgProvaHTML(o1, R) {
  const F = o1.fotos || [], ficha = F.find(x => x.tipo === RG_PROVA[0]), rel = F.find(x => x.tipo === RG_PROVA[1]), precisaRel = R.execTipo === 'terceiro' && R.relTerc === RG_REL[0];
  const caixa = (tipo, x, txt) => `<label class="addph${x ? ' rg-pok' : ''}">${x && x.src ? `<img src="${x.src}" alt="${esc(tipo)}" style="max-height:90px;border-radius:6px">` : `<span style="font-size:26px;line-height:1">${x ? '✓' : '📄'}</span>`}${esc(txt)}<small>${x ? 'anexada · toque para trocar' : 'obrigatória · câmera ou galeria'}</small><input type="file" data-rgprova="${tipo}" accept="image/*"></label>`;
  return `<div class="rg-prova"><p class="note" style="margin:8px 0 6px">Prova da execução: o formulário de execução volta assinado pelo executor e por quem recebeu a bordo. A foto dele fica na OM e no PDF; os passos do Anexo I contam como feitos <b>conforme o formulário assinado</b>, não por marcação na tela.${R.execTipo === 'terceiro' && R.relTerc === RG_REL[1] ? ' Sem relatório do fornecedor: preencha os itens e as medições abaixo a partir do que foi verificado (NP 5.8).' : ''}</p>
   <div class="phgrid">${caixa(RG_PROVA[0], ficha, 'Foto do formulário assinado')}${precisaRel ? caixa(RG_PROVA[1], rel, 'Relatório do fornecedor') : ''}</div></div>`;
}
function rgExecAplicar(o, R) {
  const terc = R.execTipo === 'terceiro', T = terc ? S.recs.get(R.terc) : null;
  o.exec = terc ? 'Terceiro' : 'Equipe de manutenção';
  o.execn = terc ? [(T && T.empresa) || '', (R.execn || '').trim()].filter(Boolean).join(' · resp. técnico: ') : (R.execn || '').trim();
  o.terc = terc ? R.terc || '' : ''; o.relTerc = terc ? R.relTerc || '' : ''; o.relNum = terc && R.relTerc === RG_REL[0] ? R.relNum || '' : '';
  o.receb = { func: R.recFunc || '', nome: (R.recNome || '').trim() };
  o.ass = Object.assign({}, o.ass || {}, { exec: terc ? (R.execn || '').trim() + (T ? ' (' + T.empresa + ')' : '') : (R.execn || '').trim(), cmd: o.receb.nome ? o.receb.nome + ' (' + o.receb.func + ')' : '' });
}
// conferência: no lançamento rápido a prova dos passos é a ficha assinada (não a marcação passo a passo)
{ const g1 = gateIIB;  }
{ const st = document.createElement('style'); st.textContent = `.rg-prova .addph{min-height:110px}.rg-prova .addph.rg-pok{border-color:var(--okt,#137333);color:var(--okt,#137333)}`; document.head.appendChild(st); }
