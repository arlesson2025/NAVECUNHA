/* ===== Gestão de riscos & alertas críticos (abaixo dos indicadores) ===== */
let RK_F = 'todas';
function riscoDados() {
  const L = lubDados(), C = calibDados(), out = [], alertas = [];
  S.cfg.frota.filter(v => !foraOp(v)).forEach(v => {
    const p0 = mcpPos(v)[0], hr = p0 ? horAtual(v.id, p0) : null;
    const ol = L.filter(x => x.v === v && x.e.g === 'mcp' && x.horas != null).sort((a, b) => a.horas - b.horas)[0];
    const cal = C.filter(x => x.v === v && x.s.st !== 'sem' && x.s.st !== 'cond').map(x => { const s = x.s; let d = s.alvoD ? Math.floor((s.alvoD - hoje()) / 864e5) : null; if (s.rest != null) { const dh = Math.floor(s.rest / horasDia(v.id)); d = d == null ? dh : Math.min(d, dh); } return { x, d }; }).filter(c => c.d != null).sort((a, b) => a.d - b.d)[0];
    const dc = docaVessel(v), interd = interditada(v.id), ab = oms().filter(o => o.vessel === v.id && o.status !== 'encerrada');
    const al = [];
    if (interd) al.push([1, `${v.nome} · interditada (OM ${interd.num || ''})`]);
    if (dc.dias != null && dc.dias < 0) al.push([1, `${v.nome} · docagem vencida há ${nf(-dc.dias)} dia${dc.dias === -1 ? '' : 's'}`]);
    if (cal && cal.d < 0) al.push([1, `${v.nome} · calibração vencida há ${nf(-cal.d)} dia${cal.d === -1 ? '' : 's'} (${cal.x.nm})`]);
    if (ol && ol.horas < 0) al.push([1, `${v.nome} · óleo do ${eqNomeC(v, ol.e)} vencido há ${nf(-ol.horas)} h`]);
    if (dc.dias != null && dc.dias >= 0 && dc.dias <= 90) al.push([2, `${v.nome} · docagem em ${nf(dc.dias)} dia${dc.dias === 1 ? '' : 's'}`]);
    if (cal && cal.d >= 0 && cal.d <= 30) al.push([2, `${v.nome} · calibração em ${nf(cal.d)} dia${cal.d === 1 ? '' : 's'} (${cal.x.nm})`]);
    if (ol && ol.horas >= 0 && ol.horas <= 50) al.push([2, `${v.nome} · óleo do ${eqNomeC(v, ol.e)} em ${nf(ol.horas)} h`]);
    const corA = ab.some(o => o.tipo === 'C' && o.classe === 'Alta');
    const nivel = al.some(a => a[0] === 1) ? 'alto' : (al.length || corA) ? 'medio' : 'baixo';
    al.forEach(a => alertas.push({ p: a[0], t: a[1], v }));
    out.push({ v, hr: hr ? hr.h : null, ol: ol ? ol.horas : null, cal: cal ? cal.d : null, nivel, ab: ab.length });
  });
  const o = { alto: 0, medio: 1, baixo: 2 }; out.sort((a, b) => o[a.nivel] - o[b.nivel] || (a.cal ?? 1e9) - (b.cal ?? 1e9));
  alertas.sort((a, b) => a.p - b.p);
  return { out, alertas };
}
function riscoHTML() {
  const { out, alertas } = riscoDados(), alto = out.filter(x => x.nivel === 'alto'), sg = n => (n > 0 ? '+' : n < 0 ? '−' : '+') + nf(Math.abs(n));
  const omA = alto.reduce((a, x) => a + x.ab, 0), hm = out.filter(x => x.hr != null), med = hm.length ? hm.reduce((a, x) => a + x.hr, 0) / hm.length : null;
  const L = out.filter(x => RK_F === 'todas' || x.nivel === RK_F);
  const cab = `<div class="ab4-sec rk-sec"><h2>Gestão de riscos e alertas críticos</h2><span class="note">empurradores em risco, pendências regulatórias e matriz da frota</span><span class="sp"></span><div class="seg">${[6, 12, 24].map(m => `<button data-falper="${m}" class="${m === FALPER ? 'on' : ''}">${m} meses</button>`).join('')}</div><button class="mbtn pri" data-act="novaCorr">＋ Nova corretiva</button></div>`;
  const c1 = `<div class="card rk" data-lk="Risco alto"><div class="rk-h"><h2>Empurradores em risco alto</h2>${alto.length ? '<span class="rk-bd alto">AÇÃO IMEDIATA</span>' : '<span class="rk-bd baixo">SOB CONTROLE</span>'}</div>
    <div class="rk-big"><span style="color:${alto.length ? '#DC2626' : '#16A34A'}">${alto.length}</span><em>de ${out.length} empurradores ativos</em></div>
    <div class="rk-2"><div><b>${omA}</b><small>OM aberta${omA === 1 ? '' : 's'}${alto.length ? ' nos empurradores em risco' : ''}</small></div><div><b>${med == null ? '—' : nf(Math.round(med)) + ' h'}</b><small>horímetro médio MCP</small></div></div></div>`;
  const c2 = `<div class="card rk" data-lk="Alertas criticos"><div class="rk-h"><h2>Alertas críticos</h2><span class="note"><b style="color:#DC2626">${alertas.filter(a => a.p === 1).length}</b> P1 · <b style="color:#D97706">${alertas.filter(a => a.p === 2).length}</b> P2</span></div>
    ${alertas.length ? alertas.slice(0, 12).map(a => `<div class="rk-al"><span class="rk-pp p${a.p}">P${a.p}</span>${esc(a.t)}</div>`).join('') + (alertas.length > 12 ? `<div class="note">+ ${alertas.length - 12} alertas</div>` : '') : '<div class="note">Nenhum alerta crítico.</div>'}
    <div class="note" style="margin-top:8px">P1 = vencido ou interditado · P2 = vence em breve (docagem ≤ 90 d, calibração ≤ 30 d, óleo ≤ 50 h)</div></div>`;
  const c3 = `<div class="card rk" data-lk="Matriz de risco"><h2>Matriz de risco da frota</h2><div class="rk-f">${[['todas', 'Todas'], ['alto', 'Alto'], ['medio', 'Médio'], ['baixo', 'Baixo']].map(([k, n]) => `<button data-rkf="${k}" class="${RK_F === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="tw"><table class="rk-t"><thead><tr><th>Empurrador</th><th>Horímetro MCP</th><th>Até óleo</th><th>Calibração</th><th>OMs abertas</th><th>Risco</th></tr></thead><tbody>
    ${L.map(x => `<tr><td><b>${esc(x.v.nome)}</b></td><td>${x.hr == null ? '—' : nf(x.hr, 1)}</td><td style="color:${x.ol != null && x.ol < 0 ? '#DC2626' : ''}">${x.ol == null ? '—' : sg(x.ol) + ' h'}</td><td style="color:${x.cal != null && x.cal < 0 ? '#DC2626' : ''}">${x.cal == null ? '—' : sg(x.cal) + ' d'}</td><td>${x.ab || '—'}</td><td><span class="rk-bd ${x.nivel}">${x.nivel === 'medio' ? 'MÉDIO' : x.nivel.toUpperCase()}</span></td></tr>`).join('') || '<tr><td colspan="6" class="note">Nenhum empurrador neste filtro.</td></tr>'}
    </tbody></table></div><div class="note">Até óleo = horas até a troca do MCP mais próxima · Calibração = dias até a próxima calibração · negativo = vencido</div></div>`;
  return cab + `<div class="two">${c1}${c2}</div>` + c3;
}

document.addEventListener('click', e => { const b = e.target.closest('[data-rkf]'); if (!b) return; RK_F = b.dataset.rkf; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.rk h2{margin:0;font-size:16px}.rk-sec .seg{margin:0}.rk-sec{align-items:center!important;flex-wrap:wrap}.card.rk .rk-h{margin-bottom:6px;padding-right:62px}


.rk-h b {font-size:15px;font-weight:700;color:#0F172A}
.rk-h{display:flex;justify-content:space-between;align-items:center;gap:8px}
.rk-big{display:flex;align-items:baseline;gap:12px;margin:8px 0 12px}.rk-big span{font-size:46px;font-weight:800;line-height:1}.rk-big em{font-style:normal;color:#64748B;font-size:13px}
.rk-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}.rk-2 div{border:1px solid #E3E8EF;background:#F8FAFC;border-radius:8px;padding:12px}
.rk-2 b{display:block;font-size:19px;font-weight:700;color:#0F766E}.rk-2 small{color:#64748B;font-size:11.5px}

.rk-al{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #E3E8EF;font-size:13.5px;color:#0F172A}
.rk-pp{font-size:10.5px;font-weight:700;border-radius:4px;padding:2px 8px;flex:none}.rk-pp.p2{color:#D97706;background:#FFFBEB;border:1px solid #FDE68A}
.rk-bd{font-size:10.5px;font-weight:700;border-radius:4px;padding:2px 8px;letter-spacing:.03em}
.rk-bd.alto{color:#DC2626;background:#FEF2F2;border:1px solid #FECACA}.rk-bd.medio{color:#D97706;background:#FFFBEB;border:1px solid #FDE68A}.rk-bd.baixo{color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0}
.rk-f{display:flex;gap:8px;margin:10px 0 12px}.rk-f button{font:inherit;font-size:12.5px;font-weight:600;border:1px solid #E3E8EF;background:#fff;border-radius:6px;padding:6px 14px;cursor:pointer}
.rk-f button.on{background:#ECFDF5;border-color:#5EEAD4;color:#0F766E}
.rk-t{width:100%;border-collapse:collapse;font-size:13.5px}.rk-t th{background:#F8FAFC;text-align:left;font-weight:600;color:#0F172A;padding:9px 10px;border-bottom:1px solid #E3E8EF}
.rk-t td{color:#0F172A;padding:9px 10px;border-bottom:1px solid #E3E8EF;white-space:nowrap}.rk-t td b{font-weight:600}
`; document.head.appendChild(st); }

