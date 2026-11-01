/* ===== Começar do zero (SMF 3.118, 01/11/2026; pedido do Supervisor: “colocar o início de tudo hoje, vou começar a usar hoje”) =====
   Administração → “Começar do zero”: baixa a cópia de segurança (JSON), apaga TODOS os registros neste aparelho e na planilha (marca excluido,
   o mesmo caminho da exclusão de OM: os outros aparelhos recebem em “deleted”), tira os dados de exemplo e aplica o marco zero na data em todos
   os empurradores em operação, com v.marco.inicio = true. Ficam: cadastro da frota, intervalos, senhas, nuvem. PDFs e fotos no Drive ficam.
   Com marco.inicio, o motor sem leitura na data do marco pega a primeira leitura real até MARCO_D dias depois (marcoHor, no js/12):
   o Supervisor escolheu “marco hoje, horímetro depois”, sem precisar reaplicar o marco quando a leitura chegar.
   Outro aparelho com dados de exemplo: ao receber a frota com marco.inicio, limpa o exemplo sozinho (zeroVigia). */
'use strict';
const ZERO_TXT = 'COMEÇAR DO ZERO';
const zeroInicio = () => (S.cfg.frota.find(v => v.marco && v.marco.inicio) || {}).marco || null;
function zeroAdminHTML() {
  const a = can.admin(), ini = zeroInicio(), n = [...S.recs.values()].filter(r => !r.seed && !r.excluido).length;
  return `<div class="card" id="cardZero"><h2>Começar do zero (início do uso do SMF)</h2>
   ${ini ? `<p class="note">Início do uso do SMF: <b>${brD(ini.date)}</b>. Os itens sem histórico contam desta data; motor sem leitura nesse dia pega a primeira leitura lançada até ${MARCO_D} dias depois.</p>` : ''}
   <p class="note">Apaga <b>todos</b> os registros (${n} neste aparelho: leituras de horímetro, serviços, OMs, corretivas, FR 049_B, FR 027_L, ações, relatórios emitidos) neste aparelho e na planilha, tira os dados de exemplo e aplica o marco zero na data escolhida em todos os empurradores em operação. Ficam o cadastro da frota, os intervalos, as senhas e a nuvem. Antes de apagar, o SMF baixa uma cópia de segurança (JSON). PDFs e fotos já enviados ao Google Drive não são apagados. <b>Não tem volta.</b></p>
   <div class="row" style="align-items:end"><label class="f" style="max-width:190px">Data do início<input type="date" id="zeD" value="${isoD(hoje())}" max="${isoD(hoje())}" ${a ? '' : 'disabled'}></label>
    <label class="f" style="max-width:240px">Para confirmar, digite ${ZERO_TXT}<input id="zeT" autocomplete="off" ${a ? '' : 'disabled'}></label>
    <button class="mbtn bad" id="zeB" ${a ? '' : 'disabled'}>Apagar tudo e começar</button></div><p class="note" id="zeMsg"></p></div>`;
}
async function comecarDoZero(d) {
  const msg = t => { const e = $('#zeMsg'); if (e) e.textContent = t; };
  if (S.url) {
    if (!navigator.onLine) return toast('Sem internet: conecte para apagar também na planilha.');
    if (!S.session || !S.session.token) return toast('Entre como Supervisor (com a nuvem) antes de começar do zero.');
    msg('Buscando o que está na planilha…');
    for (let i = 0; syncing && i < 240; i++) await new Promise(r => setTimeout(r, 500));
    await syncNow();
  }
  // cópia de segurança antes de apagar
  const blob = new Blob([JSON.stringify({ app: 'ctle_man', at: new Date().toISOString(), cfg: S.cfg, recs: [...S.recs.values()].filter(r => !r.seed) })], { type: 'application/json' });
  { const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'SMF_copia_antes_do_inicio_' + isoD(hoje()) + '.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
  msg('Apagando…');
  await limparExemplo();
  const agora = Date.now(), L = [...S.recs.values()].filter(r => !r.seed && !r.excluido).map(r => ({ id: r.id, kind: r.kind, vessel: r.vessel || '', excluido: true, createdAt: r.createdAt || agora, updatedAt: agora }));
  L.forEach(r => S.recs.set(r.id, r)); if (MEM) L.forEach(r => MEM.set(r.id, r)); else await DB.putMany(L);
  L.forEach(r => { S.pending.add(r.id); delete S.pdfPend[r.id]; }); await kvSet('pending', [...S.pending]); await kvSet('pdfPend', S.pdfPend);
  // marco zero novo em todos (o antigo e as trocas de horímetro apontavam para leituras que foram apagadas)
  S.cfg.frota.forEach(v => { delete v.marco; delete v.horOff; });
  await aplicarMarco(d, S.cfg.frota.filter(v => !foraOp(v)).map(v => v.id));
  S.cfg.frota.forEach(v => { if (v.marco) v.marco.inicio = true; });
  S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg);
  if (S.url) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota } }); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } else toast('A planilha não aceitou a frota: ' + j.error); } catch (e) { } }
  toast(`Pronto: ${L.length} registros apagados e marco zero em ${brD(d)}. ${S.url ? 'Deixe o SMF aberto até “aguardando envio” chegar a 0 (a planilha recebe um por um).' : ''}`, 9000);
  render(); if (S.url) syncNow();
}
document.addEventListener('click', e => {
  const b = e.target.closest('#zeB'); if (!b || !can.admin()) return;
  const d = $('#zeD').value, t = ($('#zeT').value || '').trim().toUpperCase();
  if (!d || d > isoD(hoje())) return toast('Informe a data do início (hoje ou antes).');
  if (t !== ZERO_TXT && t !== 'COMECAR DO ZERO') return toast('Para confirmar, digite ' + ZERO_TXT + '.');
  confirmar(`Apagar TODOS os registros do SMF (aparelho e planilha) e começar em ${brD(d)}? Não tem volta.`, () => comecarDoZero(d));
});
// outro aparelho que ainda mostra o exemplo: quando a frota chega com o início do uso, o exemplo sai sozinho
async function zeroVigia() { try { if (typeof S !== 'undefined' && S.pronto && zeroInicio() && temExemplo()) { await limparExemplo(); if (S.session) render(); } } catch (e) { } }
setInterval(zeroVigia, 15000);
