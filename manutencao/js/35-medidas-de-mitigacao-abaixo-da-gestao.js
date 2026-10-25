/* ===== Medidas de mitigação (abaixo da gestão de riscos) ===== */
function mitigHTML() {
  const C = falhasDados(FALPER), L = C.filter(o => (o.mitig || '').trim() || o.classe === 'Crítica' || o.classe === 'Alta')
    .sort((a, b) => (pDT(b.abertura) || 0) - (pDT(a.abertura) || 0)).slice(0, 15);
  const cls = { ok: 'ok', and: 'and', atraso: 'bad', falta: 'bad', nd: 'nd' };
  const rei = o => { const n = C.filter(p => p._reinc === o).length; if (n) return `<span style="color:#DC2626">Sim (${n + 1}ª vez)</span>`;
    if (o.mitigSt === 'Concluída') { const ref = o.liberacao ? pDT(o.liberacao) : o.updatedAt ? new Date(o.updatedAt) : null, d = ref ? Math.max(0, Math.floor((hoje() - ref) / 864e5)) : null; return `<span style="color:#16A34A">Não${d != null ? ' (' + d + ' d)' : ''}</span>`; }
    return (o.mitig || '').trim() ? '<span style="color:#64748B">Em observação</span>' : '—'; };
  const pz = o => o.mitigPrazo ? brD(o.mitigPrazo).slice(0, 5) : '—';
  return `<div class="card mg" data-lk="Medidas de mitigacao"><div class="row"><div><h2>Medidas de mitigação</h2><p class="mg-sub">Falha, causa, ação executada e se voltou a ocorrer depois da ação</p></div></div>
  ${L.length ? `<div class="tw"><table class="mg-t"><thead><tr><th>Empurrador</th><th>Falha</th><th>Causa</th><th>Ação</th><th>Resp.</th><th>Prazo</th><th>Status</th><th>Reincidência</th></tr></thead><tbody>
  ${L.map(o => { const s = mitigSit(o); return `<tr class="click" data-open="${o.id}" title="Abrir a OM ${esc(o.num || '')}"><td><b>${esc(vName(o.vessel))}</b></td><td>${esc(o.descricao || '—')}</td><td>${esc(o.causa || '—')}</td><td>${esc(o.mitig || '—')}</td><td>${esc(o.mitigResp || '—')}</td><td>${pz(o)}</td><td><span class="mg-st ${cls[s.k]}">${esc(s.t.toUpperCase())}</span></td><td>${rei(o)}</td></tr>`; }).join('')}
  </tbody></table></div>` : '<div class="note">Nenhuma falha registrada nos últimos 12 meses.</div>'}
  <div class="note" style="margin-top:8px">Últimos ${FALPER} meses · clique numa linha para abrir a OM · a medida é registrada na própria corretiva (campo A9 · Análise) · reincidência = mesma falha no mesmo empurrador depois da ação.</div></div>`;
}
document.addEventListener('click', e => { const p = e.target.closest('[data-falper]'); if (!p || VIEW !== 'kpi') return; FALPER = +p.dataset.falper; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.mg h2{margin:0}.mg-sub{margin:2px 0 10px;color:#334155;font-size:13.5px}
.mg-t{width:100%;border-collapse:collapse;font-size:13px}.mg-t th{background:#F8FAFC;text-align:left;font-weight:600;color:#0F172A;padding:9px 10px;border-bottom:1px solid #E3E8EF;white-space:nowrap}
.mg-t td{color:#334155;padding:9px 10px;border-bottom:1px solid #E3E8EF;vertical-align:top}.mg-t td b{font-weight:600;color:#0F172A;white-space:nowrap}
.mg-st{font-size:10.5px;font-weight:700;border-radius:4px;padding:2px 8px;letter-spacing:.03em;white-space:nowrap}
.mg-st.ok{color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0}.mg-st.and{color:#D97706;background:#FFFBEB;border:1px solid #FDE68A}.mg-st.bad{color:#DC2626;background:#FEF2F2;border:1px solid #FECACA}.mg-st.nd{color:#64748B;background:#F1F5F9;border:1px solid #E2E8F0}
`; document.head.appendChild(st); }

