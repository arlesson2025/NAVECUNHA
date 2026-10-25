/* ===== Faixa-guia no topo da OM (pedido do Supervisor, 22/10/2026: "olho pra tela e fico sem rumo") =====
   Tipo em destaque (PREVENTIVA / CORRETIVA), linha de etapas até o Sankhya, AGORA (uma frase + um botão) e o que FALTA para aprovar (gateIIA/gateIIB). */
'use strict';
function guiaOM(o, P) {
  if (!o) return '';
  const prev = o.tipo !== 'C', st = P && P.length > 1 && typeof grpStatus === 'function' ? grpStatus(P) : o.status, sk = !!(o.skFim || (P || []).some(p => p.skFim));
  const et = prev ? ['Emitida', 'Lançada (conferência)', 'Encerrada no SMF', 'Encerrada no Sankhya'] : ['Aberta', 'Em execução', 'Em conferência', 'Encerrada no SMF', 'Encerrada no Sankhya'];
  const idx = prev ? (st === 'encerrada' ? (sk ? 3 : 2) : st === 'conferencia' ? 1 : 0) : (st === 'encerrada' ? (sk ? 4 : 3) : st === 'conferencia' ? 2 : st === 'execucao' ? 1 : 0);
  const agora = prev ? [['marcar o que foi feito e anexar as fotos de antes e depois', 'Lançar o realizado'], ['conferir e aprovar · só o Supervisor', 'Conferir'], ['anexar o PDF (Anexo II-B) e encerrar a OM no Sankhya', 'Anexar no Sankhya'], ['nada a fazer · OM fechada nos dois sistemas', '']][idx]
    : [['começar o serviço · marca o início para o prazo da NP 5.5.1', 'Ir para o início'], ['registrar o que foi feito, as fotos de depois e a causa', 'Continuar'], ['conferir e aprovar · só o Supervisor', 'Conferir'], ['anexar o PDF (Anexo II-A) e encerrar a OM no Sankhya', 'Anexar no Sankhya'], ['nada a fazer · OM fechada nos dois sistemas', '']][idx];
  let falta = []; try { const g = prev ? gateIIB(o) : gateIIA(o); falta = g.filter(x => !x[1]).map(x => x[0]); } catch (e) { }
  const destino = (prev && idx === 2) || (!prev && idx === 3) ? 'sankhya' : (prev && idx === 0 && o.grupo && VIEW === 'om') ? 'lancar' : 'form';
  const passos = et.map((e, i) => `<div class="gu-p${i < idx ? ' feito' : i === idx ? ' atual' : ''}"><i>${i < idx ? '✓' : i + 1}</i><span>${e}</span></div>`).join('<div class="gu-l"></div>');
  return `<div class="card gu"><div class="gu-h"><span class="gu-t ${prev ? 'pv' : 'cr'}">${prev ? 'PREVENTIVA' : 'CORRETIVA'}${!prev && o.classe ? ' · ' + esc(o.classe) : ''}</span><b>OM ${esc(o.num || '—')}</b><span class="note">${esc(vName(o.vessel))}${prev ? ' · Anexo II-B' : ' · Anexo II-A'}</span></div>
    <div class="gu-ps">${passos}</div>
    <div class="gu-a"><span><b>AGORA:</b> ${agora[0]}</span><span class="sp"></span>${agora[1] ? `<button class="mbtn pri" data-guia="${destino}" data-gg="${esc(o.grupo || '')}">${agora[1]}</button>` : ''}</div>
    ${falta.length && idx < (prev ? 2 : 3) ? `<div class="gu-f"><b>Falta para aprovar:</b> ${falta.slice(0, 6).map(esc).join(' · ')}${falta.length > 6 ? ' · +' + (falta.length - 6) : ''}</div>` : ''}</div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-guia]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const d = b.dataset.guia;
  if (d === 'sankhya') { location.hash = '#omconf'; return; }
  if (d === 'lancar') { location.hash = '#omg/' + encodeURIComponent(b.dataset.gg); return; }
  const alvo = document.querySelector('#main #btnAprovar:not([disabled]), #main [data-rgact="aprovar"]:not([disabled])') && /Conferir/.test(b.textContent) ? document.querySelector('#main #btnAprovar, #main [data-rgact="aprovar"]')
    : document.querySelector('#main #omGate') || document.querySelectorAll('#main .card')[1];
  if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, true);
{ const st = document.createElement('style'); st.textContent = `.gu{border:1px solid #DADCE0;padding:12px 16px!important}.gu-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.gu-h b{font-size:16px}
.gu-t{font-size:13px;font-weight:700;letter-spacing:.5px;padding:3px 10px;border-radius:6px;color:#fff}.gu-t.pv{background:#188038}.gu-t.cr{background:#C5221F}
.gu-ps{display:flex;align-items:center;gap:6px;margin:12px 0 10px;flex-wrap:wrap}.gu-p{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#80868B}.gu-p i{font-style:normal;width:22px;height:22px;border-radius:50%;border:2px solid #DADCE0;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.gu-p.feito{color:#188038}.gu-p.feito i{background:#188038;border-color:#188038;color:#fff}.gu-p.atual{color:#1967D2;font-weight:700}.gu-p.atual i{border-color:#1967D2;color:#1967D2}.gu-l{flex:0 0 22px;height:2px;background:#DADCE0}
#main:has(.gu) .stepsbar{display:none}.gu-a{display:flex;align-items:center;gap:10px;background:#E8F0FE;border-radius:8px;padding:8px 12px;font-size:13.5px}.gu-f{margin-top:8px;font-size:12.5px;color:#B3261E}`; document.head.appendChild(st); }
