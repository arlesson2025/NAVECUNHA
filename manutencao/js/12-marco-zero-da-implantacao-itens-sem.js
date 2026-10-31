/* ===== MARCO ZERO da implantação: itens sem histórico contam a partir da data e do horímetro do marco ===== */
'use strict';
// horímetro do marco = leitura real do dia do marco ou até 30 dias antes (SMF 3.110): antes era a leitura mais recente, de qualquer data, e um marco com a
// data de hoje e o horímetro de meses antes fazia o SMF contar as horas de todos esses meses (vencimentos falsos); sem leitura perto da data o motor
// fica sem horímetro no marco (os itens por horas não contam dele) e aparece no aviso
const MARCO_D = 30;
let MARCO_SEM = [];
async function aplicarMarco(date, ids) {
  let n = 0; MARCO_SEM = []; S.cfg.frota.forEach(v => { if (!ids.includes(v.id)) return; const h = {}; [...mcpPos(v), ...MCAS.filter(p => v.mca && v.mca[p])].forEach(p => { const r = horEm(v.id, p, date); if (r && !r.est && (pD(date) - pD(r.date)) / 864e5 <= MARCO_D) h[p] = r.h; else MARCO_SEM.push(v.nome + ' ' + posCurtoE(v, p)); }); v.marco = { date, h }; n++; });
  S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg);
  if (S.url) { try { const j = await api('setConfig', { cfg: { frota: S.cfg.frota } }); if (j.ok) { S.cfg.cfgAt = j.cfgAt; await kvSet('cfg', S.cfg); } else toast('A planilha não aceitou: ' + j.error); } catch (e) { } }
  return n;
}
function admMarcoHTML() { const a = can.admin(), F = S.cfg.frota, sem = F.filter(v => !v.marco && !foraOp(v));
  return `<div class="card" id="cardMarco"><div class="row"><h2>Marco zero da implantação</h2><span class="sp"></span><span class="note">${F.filter(v => v.marco).length} de ${F.length} empurradores com marco</span></div>
   <p class="note">Os itens do Anexo I que ainda não têm último serviço registrado passam a contar a partir desta data e do horímetro de cada motor <b>nesta data</b> (leitura do dia ou de até 30 dias antes; lance a leitura em 1.1 Horímetros antes). Use a data real do início do controle no SMF. Quando uma OM for encerrada ou um último serviço real for lançado, ele substitui o marco automaticamente. Empurradores fora de operação ficam de fora.</p>
   <div class="row"><label class="f" style="max-width:200px">Data do marco<input type="date" id="mzD" value="${isoD(hoje())}" ${a ? '' : 'disabled'}></label>
    <button class="mbtn pri" id="mzB" ${a && sem.length ? '' : 'disabled'}>Aplicar marco zero em ${sem.length} empurrador(es)</button></div>
   <div class="tw"><table class="t"><thead><tr><th>Empurrador</th><th>Marco</th><th>Horímetros no marco</th><th></th></tr></thead><tbody>${F.map(v => `<tr><td><b>${esc(v.nome)}</b></td><td>${v.marco ? brD(v.marco.date) : foraOp(v) ? '<span class="note">fora de operação</span>' : '<span class="note">sem marco</span>'}</td><td class="mono">${v.marco ? Object.entries(v.marco.h || {}).map(([p, h]) => (MCAS.includes(p) ? p.replace('MCA', 'MCA ') : p) + ' ' + nf(h)).join(' · ') || '—' : ''}</td><td>${v.marco && a ? `<button class="mbtn sm" data-mzdel="${v.id}">Remover</button>` : !v.marco && foraOp(v) && a ? `<button class="mbtn sm" data-mzone="${v.id}">Aplicar</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`; }
document.addEventListener('click', async e => {
  const b = e.target.closest('#mzB,[data-mzdel],[data-mzone]'); if (!b || !can.admin()) return;
  if (b.id === 'mzB') { const d = $('#mzD').value; if (!d) return toast('Informe a data.'); const ids = S.cfg.frota.filter(v => !v.marco && !foraOp(v)).map(v => v.id);
    confirmar('Aplicar o marco zero em ' + brD(d) + ' para ' + ids.length + ' empurradores? Itens sem histórico passam a contar a partir daí.', async () => { const n = await aplicarMarco(d, ids); toast('Marco zero aplicado em ' + n + ' empurradores.' + (MARCO_SEM.length ? ' Sem leitura de horímetro até ' + MARCO_D + ' dias antes de ' + brD(d) + ' (itens por horas não contam do marco): ' + MARCO_SEM.join(', ') + '. Lance a leitura do dia em 1.1 Horímetros e aplique de novo.' : ''), MARCO_SEM.length ? 12000 : 3000); render(); }); }
  else if (b.dataset.mzone) { const n = await aplicarMarco($('#mzD').value || isoD(hoje()), [b.dataset.mzone]); toast('Marco aplicado.'); render(); }
  else { const v = vessel(b.dataset.mzdel); confirmar('Remover o marco zero de ' + v.nome + '?', async () => { delete v.marco; S.cfg.cfgAt = Date.now(); await kvSet('cfg', S.cfg); if (S.url) { try { await api('setConfig', { cfg: { frota: S.cfg.frota } }); } catch (er) { } } render(); }); }
});
// aviso no painel enquanto houver empurrador em operação sem marco nem histórico

