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

// documentos que já fazem parte do sistema (não precisam de cadastro)
const BIB_FIXOS = [
  { cat: 'sgi', titulo: 'Apresentação do SMF · gerência e Coordenação de Operações', desc: '25 slides com as telas do sistema, o ciclo completo e as decisões (rascunho, em revisão)', url: 'https://claude.ai/artifact/VAANPwnQv27KL73mzEGwnZ' },
  { cat: 'sgi', titulo: 'Roteiro da apresentação do SMF', desc: 'Uma folha: o que dizer em cada slide e respostas para as perguntas difíceis', url: '../docs/Roteiro_Apresentacao_SMF.html' },
  { cat: 'sgi', titulo: 'Manual de Operação do SMF', desc: 'Caderno de instruções: papéis, ciclos em fluxograma (chegada e saída, preventiva, corretiva, óleo, viagem), telas, regras, documentos, rotina e glossário', url: '../docs/Manual_Operacao_SMF.html' },
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

const TREIN_TIPOS = [['integ', 'Integração (admissão)', 0, 8], ['recic', 'Reciclagem anual', 12, 4], ['posf', 'Pós-falha Crítica/Alta', 0, 2], ['nr', 'NR / curso específico', 0, 0]];

const FUNCOES = ['CTF – Condutor Maquinista', 'MFM – Marinheiro de Máquinas', 'Comandante / Capitão Fluvial', 'Líder de Operação', 'Operador de Medição', 'Supervisor de Manutenção', 'Analista de Manutenção', 'Terceiro'];
const diasAte = d => d ? Math.round((pD(d) - pD(isoD(hoje()))) / 864e5) : null;   // dia contra dia (os dois ao meio-dia): vence no fim do dia, não ao meio-dia
const valSt = d => { const n = diasAte(d); return n === null ? 'sem' : n < 0 ? 'venc' : n <= 30 ? 'viag' : 'ok'; };

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


/* ---------- TERCEIRIZADOS ---------- */
const TC = { serv: '' };




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




/* ---------- menu ---------- */
{ const i = SECOES.findIndex(s => s.id === 'ref'); SECOES.splice(i, 1, { id: 'bib', nome: 'Biblioteca', views: [['bib', 'Documentos'], ['terc', 'Prestadores de serviço'], ['trein', 'Treinamentos'], ['matriz', 'Plano de manutenção · Anexo I']] }); }
ICO.bib = '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>';

