/* ===== Executar e lançar: preventiva e corretiva separadas (pedido do Supervisor, 22/10/2026: "onde enxergo o que foi preventiva e corretiva?") =====
   Preventivas em aberto e Corretivas em aberto em blocos próprios, tabelas com cabeçalho, etiqueta PREVENTIVA (verde) / CORRETIVA (vermelha) como na faixa-guia da OM,
   um botão por linha (o formulário para imprimir fica dentro da OM) e Encerradas com filtro. Os botões usam os mesmos data-* do AFTER.oms. */
'use strict';
let OMSF = 'todas';
function vOMs3() {
  const itx = n => n + (n === 1 ? ' item' : ' itens'), tag = c => c ? '<span class="tp-cr">CORRETIVA</span>' : '<span class="tp-pv">PREVENTIVA</span>';
  const ab = [], vis = new Set();
  oms().filter(o => !o.excluido && o.status !== 'encerrada').forEach(o => { const g = o.grupo || o.id; if (vis.has(g)) return; vis.add(g); const P = o.grupo ? omGrupo(o.grupo) : [o]; ab.push({ o: P[0], P, g, st: o.grupo ? grpStatus(P) : o.status }); });
  const etapa = x => esc(omStatusTxt(Object.assign({}, x.o, { status: x.st })));
  const passo = x => { const o = x.o; if (o.tipo === 'C' || !o.grupo) return `<a class="mbtn sm pri" href="#om/${o.id}">Abrir</a>`;
    const nx = grpNext[x.st]; return ['emitida', 'abordo', 'executada', 'conferencia'].includes(x.st) ? `<a class="mbtn sm pri" href="#omg/${encodeURIComponent(x.g)}">${x.st === 'conferencia' ? 'Conferir e aprovar' : 'Registrar a execução'}</a>` : nx ? `<button class="mbtn sm pri" data-gadv="${esc(x.g)}|${nx[0]}">${nx[1]}</button>` : `<a class="mbtn sm" href="#omg/${encodeURIComponent(x.g)}">Abrir</a>`; };
  const pv = ab.filter(x => x.o.tipo !== 'C'), cr = ab.filter(x => x.o.tipo === 'C');
  const tab = (cab, L, vazio) => `<div class="tw"><table class="t"><thead><tr>${cab.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${L || `<tr><td colspan="${cab.length}" class="note">${vazio}</td></tr>`}</tbody></table></div>`;
  const tPv = tab(['Tipo', 'OM', 'Empurrador', 'Itens', 'Etapa', ''], pv.map(x => `<tr><td>${tag(false)}</td><td class="mono"><b>OM ${esc(x.o.num || '—')}</b></td><td><b>${esc(vName(x.o.vessel))}</b></td><td>${itx(x.o.grupo ? grpItens(x.P) : (x.o.items || []).length)}</td><td class="note">${etapa(x)}</td><td class="rt-b">${passo(x)}</td></tr>`).join(''), 'Nenhuma preventiva em aberto.');
  const tCr = tab(['Tipo', 'OM', 'Empurrador', 'Falha', 'Classe', 'Etapa', ''], cr.map(x => `<tr><td>${tag(true)}</td><td class="mono"><b>OM ${esc(x.o.num || '—')}</b></td><td><b>${esc(vName(x.o.vessel))}</b></td><td>${esc(x.o.descricao || '')}</td><td>${x.o.classe ? `<span class="pill ${/Crít/.test(x.o.classe) ? 'p-bad' : /Alta/.test(x.o.classe) ? 'p-warn' : 'p-mut'}">${esc(x.o.classe)}</span>` : '<span class="note">—</span>'}</td><td class="note">${etapa(x)}</td><td class="rt-b">${passo(x)}</td></tr>`).join(''), 'Nenhuma corretiva em aberto.');
  const enc = [], vis2 = new Set();
  oms().filter(o => !o.excluido && o.status === 'encerrada').sort((a, b) => (b.fechadoAt || 0) - (a.fechadoAt || 0)).forEach(o => { const g = o.grupo || o.id; if (vis2.has(g)) return; vis2.add(g); enc.push(o); });
  const encF = enc.filter(o => o.tipo !== 'C');   /* corretivas: aba Corretivas e falhas */
  const chip = (k, l, n) => `<button class="cm-chip${OMSF === k ? ' on' : ''}" data-omsf="${k}">${l} <b>${n}</b></button>`;
  const tEnc = tab(['Encerrada em', 'Tipo', 'OM', 'Empurrador', 'Descrição', ''], encF.slice(0, 60).map(o => `<tr><td class="mono">${brD(o.dreal || isoD(new Date(o.fechadoAt || 0)))}</td><td>${tag(o.tipo === 'C')}</td><td class="mono">OM ${esc(o.num || '—')}</td><td><b>${esc(vName(o.vessel))}</b></td><td>${o.tipo === 'C' ? esc(o.descricao || '') : itx(o.grupo ? grpItens(omGrupo(o.grupo)) : (o.items || []).length)}</td><td class="rt-b"><a class="mbtn sm" href="${o.grupo ? '#omg/' + encodeURIComponent(o.grupo) : '#om/' + o.id}">Ver</a></td></tr>`).join(''), 'Nenhuma ainda.');
  return `<div class="vh"><div><h1>Executar e lançar</h1><p>OMs abertas no Sankhya</p></div><span class="sp"></span><button class="mbtn pri" data-act="novaCorr">⚠ Registrar falha</button></div>
   <div class="card"><h2>Preventivas em aberto · ${pv.length}</h2>${tPv}</div>
      <div class="card"><h2>Preventivas encerradas</h2><div style="max-height:420px;overflow:auto">${tEnc}</div></div>`;
}
VX.oms = vOMs3;
document.addEventListener('click', e => { const b = e.target.closest('[data-omsf]'); if (!b || VIEW !== 'oms') return; e.preventDefault(); e.stopPropagation(); OMSF = b.dataset.omsf; render(); }, true);
{ const st = document.createElement('style'); st.textContent = `.tp-pv,.tp-cr{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.4px;padding:2px 8px;border-radius:5px;color:#fff;white-space:nowrap}.tp-pv{background:#188038}.tp-cr{background:#C5221F}`; document.head.appendChild(st); }
