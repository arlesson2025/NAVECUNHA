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
    out.push({ v, hr: hr ? hr.h : null, ol: ol ? ol.horas : null, cal: cal ? cal.d : null, nivel, ab: ab.length, al });
  });
  const o = { alto: 0, medio: 1, baixo: 2 }; out.sort((a, b) => o[a.nivel] - o[b.nivel] || (a.cal ?? 1e9) - (b.cal ?? 1e9));
  alertas.sort((a, b) => a.p - b.p);
  return { out, alertas };
}

document.addEventListener('click', e => { const b = e.target.closest('[data-rkf]'); if (!b) return; RK_F = b.dataset.rkf; render(); });
{ const st = document.createElement('style'); st.textContent = `
.card.rk h2{margin:0;font-size:16px}

`; document.head.appendChild(st); }

