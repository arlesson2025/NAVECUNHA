/* ===== Ficha do empurrador e Saldo para a troca no padrão (pedido do Supervisor, 22/10/2026: "quando eu clicava no empurrador mostrava as horas de cada equipamento") =====
   Ficha (#barco/<id>): cabeçalho com o empurrador e a situação, Resumo, Equipamentos (horímetro, leitura, última/próxima troca e saldo em barra), Preventivas, OMs abertas e Histórico, em janelas livres (smf_barco_lay).
   O nome do empurrador na tela Frota abre a ficha. Saldo para a troca (Óleo da frota): barra só para a direita (atraso = barra vermelha cheia), texto "faltam / vence hoje / atrasado", sem os eixos. */
'use strict';
function sbTxt(e) { if (!e || e.sem || e.v == null) return 'sem histórico'; const n = Math.round(Math.abs(e.v)), u = e.u === 'd' ? (n === 1 ? ' dia' : ' dias') : ' h';
  return e.v < 0 ? 'atrasado ' + nf(n) + u : n === 0 ? (e.u === 'd' ? 'vence hoje' : 'vence agora') : 'faltam ' + nf(n) + u; }
function vBarco2() {   /* ficha compacta (22/10/2026): situação no cabeçalho, Resumo, Equipamentos no mesmo desenho do Saldo para a troca, OMs abertas + histórico numa janela só */
  const ativos = S.cfg.frota.filter(v => !foraOp(v)), vid = ARG || BR.v || (ativos[0] || {}).id; BR.v = vid; const v = vessel(vid); if (!v) return '<div class="empty">Empurrador não encontrado.</div>';
  const x = rotinaDados().find(d => d.v === v) || { venc: [], viag: [] }, s = situDe(v), { ENG } = o3Dados(), E = ENG.filter(e => e.vid === v.id), LD = lubDados().filter(d => d.v === v && !d.saida);
  const cor = st => st === 'red' ? 'var(--badt)' : st === 'amber' ? 'var(--warnt)' : st === 'green' ? '#1967D2' : 'var(--mut)';
  const hl = e => { const d = LD.find(q => eqNomeC(v, q.e).startsWith(e.name)), h = d && horAtual(v.id, lubHp(v, d.e)), dd = h && !h.est ? Math.floor((hoje() - pD(h.date)) / 864e5) : null;
    return !h ? 'sem leitura' : h.est ? 'estimado' : `<span class="${dd > MCA_SEM_LEITURA_D ? 'ol-old' : ''}">lido ${brD(h.date)}${dd > MCA_SEM_LEITURA_D ? ' · ' + dd + ' d' : ''}</span>`; };
  const mx1 = Math.max(1, ...E.filter(e => !e.sem && e.v < 0).map(e => -e.v));
  const lin = e => { const L = !e.sem && e.v < 0 ? Math.max(3, -e.v / mx1 * 100) : 0, R = !e.sem && e.v >= 0 ? Math.max(2, (e.pct || 0) * 100) : 0;
    return `<div class="o1-r"><span><b>${esc(e.name)}</b>${['crp', 'hid'].includes(e.g) ? '<small>pelas horas do MCP</small>' : ''}</span><span class="r"><b class="o1-h">${e.atual != null ? nf(e.atual) + ' h' : '—'}</b><small>${hl(e)}</small></span>
      <span class="o1-b"><span class="o1-L"><i style="width:${L}%"></i></span><span class="o1-R"><i class="o1-${e.sem ? 'sem' : e.st}" style="width:${R}%"></i></span></span><span class="r o1-s" style="color:${cor(e.sem ? 'sem' : e.st)}"><b>${sbTxt(e)}</b></span>
      <span class="r mono">${e.proxH != null ? nf(e.proxH) + ' h' : '—'}<small>${e.proxD ? brD(isoD(e.proxD)) : ''}</small></span></div>`; };
  const ab = [], vis = new Set(); oms().filter(o => !o.excluido && o.vessel === v.id && o.status !== 'encerrada').forEach(o => { const g = o.grupo || o.id; if (vis.has(g)) return; vis.add(g); const P = o.grupo ? omGrupo(o.grupo) : [o]; ab.push({ o: P[0], P, g, st: o.grupo ? grpStatus(P) : o.status }); });
  const hist = [];
  oms().filter(o => !o.excluido && o.vessel === v.id && o.status === 'encerrada').forEach(o => { if (o.grupo && hist.some(h => h.g === o.grupo)) return; hist.push({ g: o.grupo, d: o.dreal || isoD(new Date(o.fechadoAt || 0)), c: o.tipo === 'C', t: o.tipo === 'C' ? esc(o.descricao || o.sistema || '') + ' · OM ' + esc(o.num) : 'OM ' + esc(o.num) + ' · ' + (o.grupo ? grpItens(omGrupo(o.grupo)) : (o.items || []).length) + ' itens' }); });
  recs('lub').filter(r => r.tipo === 'fr049' && r.vessel === v.id).forEach(r => hist.push({ d: r.date, o: true, t: (r.eq || []).filter(q => q.status === 'T').map(q => { const e = lubEq(v, q.key); return esc(e ? eqNomeC(v, e) : q.key); }).join(', ') }));
  hist.sort((a, b) => a.d < b.d ? 1 : -1);
  const tag = h => h.o ? '<span class="pill p-inf">ÓLEO</span>' : h.c ? '<span class="tp-cr">CORRETIVA</span>' : '<span class="tp-pv">PREVENTIVA</span>';
  const k = (l, val, c) => `<div class="f2-k"><span>${l}</span><b${c ? ` style="color:${c}"` : ''}>${val}</b></div>`;
  const nVenc = (x.venc || []).length, nViag = (x.viag || []).length, nOl = E.filter(e => e.st === 'red').length;
  const resumo = `<div class="card"><h2>Resumo</h2><div class="f2-ks">${k('Itens do plano vencidos', nVenc, nVenc ? 'var(--badt)' : 'var(--okt)')}${k('Vencem antes de voltar', nViag, nViag ? 'var(--warnt)' : '')}${k('Troca de óleo vencida', nOl, nOl ? 'var(--badt)' : 'var(--okt)')}${k('OMs abertas', ab.length)}</div>${x.crit ? '<div class="banner bad" style="margin-top:8px">Saída bloqueada: item Crítico vencido sem OM.</div>' : ''}</div>`;
  const eq = `<div class="card"><h2>Equipamentos · horímetro e troca de óleo</h2><div class="o1"><div class="o1-r o1-hd"><span>Equipamento</span><span class="r">Horímetro atual</span><span class="o1-b"><span class="r">← atraso</span><span>intervalo que resta →</span></span><span class="r">Saldo</span><span class="r">Próxima troca</span></div>${E.map(lin).join('') || '<p class="note">Sem equipamentos cadastrados.</p>'}</div></div>`;
  const omsH = `<div class="card"><h2>OMs abertas e histórico</h2><table class="t fb-t"><tbody>
    ${ab.map(a => `<tr><td>${a.o.tipo === 'C' ? '<span class="tp-cr">CORRETIVA</span>' : '<span class="tp-pv">PREVENTIVA</span>'}</td><td class="mono"><b>OM ${esc(a.o.num || '—')}</b></td><td>${a.o.tipo === 'C' ? esc(a.o.descricao || '') : grpItens(a.P) + ' itens'}</td><td class="note">${esc(omStatusTxt(Object.assign({}, a.o, { status: a.st })))}</td><td class="rt-b"><a class="mbtn sm pri" href="${a.o.grupo ? '#omg/' + encodeURIComponent(a.g) : '#om/' + a.o.id}">Abrir</a></td></tr>`).join('') || '<tr><td colspan="5" class="note">Nenhuma OM aberta.</td></tr>'}
    <tr class="fb-sep"><td colspan="5">Histórico</td></tr>
    ${hist.slice(0, 12).map(h => `<tr><td>${tag(h)}</td><td class="mono">${brD(h.d)}</td><td colspan="3">${h.t}</td></tr>`).join('') || '<tr><td colspan="5" class="note">Nada registrado ainda.</td></tr>'}</tbody></table></div>`;
  const sel = `<select id="brV" style="font-size:15px;font-weight:600;width:auto">${ativos.map(a => `<option value="${a.id}"${a.id === v.id ? ' selected' : ''}>${esc(a.nome)}</option>`).join('')}</select>`;
  const situ = s ? (s.st === 'porto' ? '⚓ No porto' : '⛴ Em viagem') + ' desde ' + brD(s.at) : 'Situação não informada';
  return `<div class="cm-v fb-v"><div class="vh"><div><h1>${esc(v.nome)}</h1><p>${situ} · ficha técnica do empurrador</p></div><span class="sp"></span><a class="mbtn" href="#rotina">← Frota</a>${sel}<a class="mbtn" href="#hor">⏱ Lançar horímetro</a><a class="mbtn pri" href="#emitir/${v.id}">Programar preventiva</a>
    <details class="pt-mais"><summary class="mbtn" title="Mais opções">⋯</summary><div><button class="mbtn" data-frv="${v.id}">🛢 Lançar troca de óleo</button><br><button class="mbtn" data-situ="${v.id}|${s && s.st === 'porto' ? 'viagem' : 'porto'}">${s && s.st === 'porto' ? '⛴ Saiu de viagem' : '⚓ Chegou em Manaus'}</button><br><a class="mbtn" href="#crono" data-prit="${v.id}">Item por item (Anexo I)</a></div></details>
    <button class="mbtn" data-brreset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button></div>
   <div class="cm-ws">${resumo}${eq}${omsH}</div></div>`;
}
VX.barco = vBarco2;
/* (Saldo para a troca: voltou o gráfico original a pedido do Supervisor) */
{ const st = document.createElement('style'); st.textContent = `


.fb-v{max-width:1180px}.fb-t td{padding:4px 8px}.fb-sep td{font-size:11px;color:#5F6368;text-transform:uppercase;letter-spacing:.3px;padding-top:12px!important;border-bottom:1px solid #E3E6EA}a.f2-nm{color:inherit;text-decoration:none;border-bottom:1px dotted #9AA0A6}a.f2-nm:hover{color:#1967D2;border-bottom-color:#1967D2}`; document.head.appendChild(st); }
