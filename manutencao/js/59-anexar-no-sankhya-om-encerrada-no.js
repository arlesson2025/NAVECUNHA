/* ===== Anexar no Sankhya: OM encerrada no SMF fica pendente até o PDF ser anexado e a OM encerrada no Sankhya =====
   Regra do Supervisor (21/10/2026): as evidências vão anexadas na OM do Sankhya, e a OM é encerrada lá. O SMF não fala com o Sankhya:
   a lista (tela Conferir e encerrar) mostra cada OM encerrada aqui com os PDFs de evidência (Anexo II, FR 027_L de origem, FR 049_B)
   até o Supervisor marcar "Anexado e encerrado no Sankhya" (r.skFim = { at, by }). Registros de exemplo (seed) não entram. */
'use strict';
function skPend() {
  const L = oms().filter(o => o.status === 'encerrada' && (!o.seed || o.skDemo) && !o.excluido && !o.skFim).map(o => ({ r: o, tipo: o.tipo === 'C' ? 'Corretiva' : 'Preventiva', num: o.num, vid: o.vessel, at: o.fechadoAt || o.updatedAt || 0 }));
  recs('lub').filter(r => r.tipo === 'fr049' && r.om && !r.seed && !r.excluido && !r.skFim).forEach(r => L.push({ r, tipo: 'Troca de óleo', num: r.om, vid: r.vessel, at: r.updatedAt || +pD(r.date) || 0 }));
  return L.sort((a, b) => a.at - b.at);
}


document.addEventListener('click', async e => { const b = e.target.closest('[data-skfim]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  if (!precisa(true)) return; const r = S.recs.get(b.dataset.skfim); if (!r) return; const num = r.kind === 'lub' ? r.om : r.num;
  if (!confirm('Confirma que o PDF foi anexado e a OM ' + (num || '') + ' foi encerrada no Sankhya?')) return;
  r.skFim = { at: Date.now(), by: S.session.name }; if (r.kind === 'om') r.hist = (r.hist || []).concat([{ at: Date.now(), by: S.session.name, ev: 'PDF anexado e OM encerrada no Sankhya' }]);
  await saveRec(r); toast('OM ' + (num || '') + ' marcada como encerrada no Sankhya.'); render(); }, true);
{ const c = SECOES.find(s => s.id === 'conf2'); if (c) c.sub = 'e anexar no Sankhya'; }
// preventiva sem os cliques "Iniciar execução" e "Terminou a execução": da emissão vai direto ao lançamento do formulário (decisão do Supervisor, 21/10/2026)
delete grpNext.emitida; delete grpNext.abordo;
