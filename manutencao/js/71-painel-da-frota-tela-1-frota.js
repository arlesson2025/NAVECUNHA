/* ===== Painel da frota (tela 1 · Frota), aprovado pelo Supervisor em 22/10/2026: "cada quadrado é um empurrador; a cor diz se ele pode sair; embaixo está o que fazer agora" =====
   Faixa de números · Quadro da frota (um quadro por empurrador: verde liberado, âmbar com restrição, vermelho bloqueado, azul em viagem, cinza sem situação — o painel nunca pinta de verde o que não sabe)
   · O que fazer agora (Urgente = P1, Esta semana = P2; no máximo 8 linhas). Layout fixo (sem janelas livres). A cor do porto vem de frotaMatriz, a mesma conta do registro de saída.
   Desempenho: frotaMatriz e agoraLista guardam o resultado até a próxima gravação (saveRec/setConfig) ou por 20 s. O Operador continua na tela dele. */
'use strict';
{ let ver = 0; const memo = (nome) => { const f0 = window[nome]; let val = null, k = null, at = 0;
    window[nome] = function () { const kk = ver + '|' + S.recs.size + '|' + isoD(hoje()); if (val && kk === k && Date.now() - at < 20000) return val.slice(); val = f0.apply(this, arguments); k = kk; at = Date.now(); return val.slice(); }; };
  memo('frotaMatriz'); memo('agoraLista');
  { const s0 = saveRec; saveRec = async function () { ver++; try { return await s0.apply(this, arguments); } finally { ver++; } }; }
  if (typeof setConfig === 'function') { const c0 = setConfig; setConfig = async function () { ver++; try { return await c0.apply(this, arguments); } finally { ver++; } }; }
  window.pfInvalida = () => ver++; }
function pfPasso(v) {   /* próximo passo no porto, na ordem do ciclo: horímetro → programar preventiva → lançar formulário → troca de óleo → saída */
  const hp = mpos(v.id), hr = horAtual(v.id, hp), ch = String(v.situ.at || '').slice(0, 10);
  if (!hr || hr.date < ch) return { tx: 'Lançar o horímetro da chegada', b: `<a class="mbtn sm pri" href="#hor">Lançar horímetro</a>` };
  const P = painelVessel(v, viagemDe(v)).filter(y => y.t.kind === 'prog' && ['venc', 'mes', 'emb'].includes(emGrp(v, y)) && !y.om);
  if (P.length) return { tx: P.length + ' ite' + (P.length > 1 ? 'ns' : 'm') + ' para programar', b: `<a class="mbtn sm pri" href="#emitir/${v.id}">Programar preventiva</a>` };
  const G = {}; oms().filter(o => o.tipo === 'P' && o.vessel === v.id && !o.excluido && ['emitida', 'abordo', 'executada'].includes(o.status)).forEach(o => { G[o.grupo || o.id] = o; });
  const om = Object.entries(G)[0];
  if (om) return { tx: 'OM ' + esc(om[1].num) + ' emitida: lançar o formulário', b: `<a class="mbtn sm pri" href="${om[1].grupo ? '#omg/' + encodeURIComponent(om[0]) : '#om/' + om[1].id}">Lançar formulário</a>` };
  const O = (typeof oleoDoBarco === 'function' ? oleoDoBarco(v) : []).filter(o => o.rest < (typeof horasViagem === 'function' ? horasViagem(v, o.pos) : 480)), PP = typeof popaPend === 'function' ? popaPend(v) : [], n = O.length + PP.length;
  if (n) return { tx: n + ' troca' + (n > 1 ? 's' : '') + ' de óleo antes de sair', b: `<button class="mbtn sm pri" data-frv="${v.id}">Lançar troca de óleo</button>` };
  return { tx: 'Pronto para sair', b: `<button class="mbtn sm pri" data-situ="${v.id}|viagem">Saiu de viagem</button>` };
}
function vPainel() {
  const F = S.cfg.frota, op = F.filter(v => !foraOp(v)), fora = F.filter(v => foraOp(v)), FM = frotaMatriz(), AG = agoraLista();
  const pend = v => { const re = new RegExp('(^|[^A-Za-z])' + v.nome.replace(/[^\wÀ-ú ]/g, '.') + '(?![A-Za-z0-9])'); return AG.filter(a => re.test(a.txt.replace(/<[^>]+>/g, ''))); };
  const desde = (pre, d) => { const n = f2Dias(d); return n == null ? pre : n === 0 ? pre + ' desde hoje' : pre + ' há ' + f2DiasTx(n); };
  const Q = op.map(v => { const s = situDe(v), x = FM.find(y => y.v === v) || { sit: 0, n: { venc: 0 } };
    if (!s) return { v, cls: 'sem', rot: 'Sem situação', onde: 'Informe onde está', passo: { tx: 'Sem essa informação o painel não sabe se pode sair', b: `<button class="mbtn sm" data-situ="${v.id}|porto">No porto</button><button class="mbtn sm" data-situ="${v.id}|viagem">Em viagem</button>` }, x, p: pend(v) };
    if (v.situ.st === 'viagem') { const O = (typeof oleoDoBarco === 'function' ? oleoDoBarco(v) : [])[0];
      const ol = !O ? '' : O.rest < 0 ? `<span style="color:var(--badt)">Óleo do ${esc(O.nome)} vencido</span>` : O.porData ? `Óleo do ${esc(O.nome)}: vence em ${O.dd} dias` : `Óleo do ${esc(O.nome)}: faltam ${nf(O.rest)} h`;
      return { v, cls: 'via', rot: 'Em viagem', onde: desde('Viajando', v.situ.at), passo: { tx: ol || 'Acompanhar a viagem', b: `<button class="mbtn sm pri" data-situ="${v.id}|porto">Chegou em Manaus</button><details class="pf-m"><summary class="mbtn sm" aria-label="Mais ações">⋯</summary><div><button class="mbtn sm" data-pmcnovo="${v.id}">📋 Leituras do MCP</button><button class="mbtn sm" data-avaria="${v.id}">⚠ Avaria</button></div></details>` }, x, p: pend(v) }; }
    const cls = x.sit >= 2 ? 'blo' : x.sit === 1 ? 'res' : 'lib', rot = x.sit === 3 ? 'Interditado' : x.sit === 2 ? 'Bloqueado' : x.sit === 1 ? 'Com restrição' : 'Liberado';
    return { v, cls, rot, onde: desde('No porto', v.situ.at), passo: pfPasso(v), x, p: pend(v) }; });
  const c = k => Q.filter(q => q.cls === k).length;
  const ordem = { blo: 0, res: 1, sem: 2, lib: 3, via: 4 }; Q.sort((a, b) => ordem[a.cls] - ordem[b.cls] || a.v.nome.localeCompare(b.v.nome, 'pt-BR', { numeric: true }));
  const PFC = { lib: 'var(--okt)', res: 'var(--warnt)', blo: 'var(--badt)', via: '#1967D2', sem: 'var(--mut)' }, k = (cls, l, n) => `<div class="f2-k"><span>${l}</span><b style="color:${n ? PFC[cls] : 'inherit'}">${n}</b></div>`;
  const quadro = Q.map(q => { const n1 = q.p.filter(a => a.p === 1).length, n = q.p.length;
    /* lista: uma linha por empurrador (pedido do Supervisor, 24/10/2026: "deixa em forma de lista, está horrível assim") */
    return `<tr class="pf-r ${q.cls}" data-pfgo="${q.v.id}" title="Abrir a ficha do ${esc(q.v.nome)}"><td class="pf-c-nm"><b>${esc(q.v.nome)}</b></td><td><span class="pf-st">${q.rot}</span></td>
      <td class="pf-o">${q.onde}${q.x.n && q.x.n.venc ? `<div style="color:var(--badt)">${q.x.n.venc} ite${q.x.n.venc > 1 ? 'ns' : 'm'} vencido${q.x.n.venc > 1 ? 's' : ''}</div>` : ''}</td>
      <td class="pf-p">${q.passo.tx}</td><td class="pf-c-n">${n ? `<span class="pf-n${n1 ? ' u' : ''}" title="pendências deste empurrador">${n} pendência${n > 1 ? 's' : ''}</span>` : '<span class="note">—</span>'}</td><td class="pf-a">${q.passo.b}</td></tr>`; }).join('');
  const A = f2Agora(), U = A.filter(a => a.p === 1), W = A.filter(a => a.p !== 1), MX = 8;
  const lista = (L, cls, tit) => L.length ? `<div class="pf-g"><h3 class="${cls}">${tit} · ${L.length}</h3>${L.map((a, i) => `<div class="pf-l${i >= MX ? ' pf-x' : ''}"${i >= MX ? ' hidden' : ''}><span class="pf-d ${cls}"></span><span class="pf-lt">${a.txt}</span><span class="pf-lb">${a.btn || ''}</span></div>`).join('')}</div>` : '';
  const dia = hoje().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  return `<div class="cm-v pf"><div class="vh"><div><h1>Frota</h1><p>${esc(dia)} · ${op.length} empurradores em operação · clique na linha para abrir a ficha</p></div><span class="sp"></span><button class="mbtn" data-f2reset title="Volta os blocos à posição e ao tamanho original">Reorganizar</button></div>
   <div class="cm-ws"><div class="card"><h2>Resumo</h2><div class="f2-ks">${k('lib', 'Liberados', c('lib'))}${k('res', 'Com restrição', c('res'))}${k('blo', 'Bloqueados', c('blo'))}${k('via', 'Em viagem', c('via'))}${c('sem') ? k('sem', 'Sem situação', c('sem')) : ''}</div></div>
   <div class="card"><h2>1 · Como está a frota</h2><div class="pf-tw"><table class="pf-tb"><thead><tr><th>Empurrador</th><th>Situação</th><th>Onde está</th><th>Próximo passo</th><th>Pendências</th><th></th></tr></thead><tbody>${quadro}</tbody></table></div>${fora.length ? `<p class="note" style="margin-top:10px">Fora de operação: ${fora.map(v => esc(v.nome)).join(', ')}</p>` : ''}</div>
   <div class="card"><h2>2 · O que fazer agora</h2>${A.length ? `<div class="pf-ag">${lista(U, 'u', 'Urgente')}${lista(W, 'w', 'Esta semana')}${U.length > MX || W.length > MX ? '<button class="mbtn sm" data-pfmais>Mostrar todas</button>' : ''}</div>` : '<p class="note pf-ok">✓ Nada pendente agora.</p>'}</div></div></div>`;
}
document.addEventListener('click', e => { if (VIEW !== 'rotina') return;
  const m = e.target.closest('[data-pfmais]'); if (m) { document.querySelectorAll('#main .pf-x').forEach(x => x.hidden = false); m.remove(); return; }
  const q = e.target.closest('[data-pfgo]'); if (q && !e.target.closest('a,button,summary,details,select,input')) location.hash = '#barco/' + q.dataset.pfgo; }, true);
{ const st = document.createElement('style'); st.textContent = `
.pf .vh{margin-bottom:12px}









.pf-st{margin-left:auto;font-size:11.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;padding:2px 8px;border-radius:5px;color:#fff}
.lib .pf-st{background:#188038}.res .pf-st{background:#E3A008}.blo .pf-st{background:#D93025}.via .pf-st{background:#1967D2}.sem .pf-st{background:#80868B}
.pf-o{font-size:12.5px;color:#5F6368}.pf-p{font-size:14px;font-weight:600;color:#202124;min-height:38px}.pf-p small{display:block;font-size:11px;font-weight:500;color:#80868B;text-transform:uppercase;letter-spacing:.3px}
.pf-a{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pf-n{font-size:12px;color:#B06000;font-weight:600}.pf-n.u{color:#C5221F}
.pf-m{position:relative}.pf-m>summary{list-style:none}.pf-m>summary::-webkit-details-marker{display:none}.pf-m>div{position:absolute;left:0;top:calc(100% + 4px);background:#fff;border:1px solid #DADCE0;border-radius:8px;padding:6px;display:flex;flex-direction:column;gap:4px;z-index:30;box-shadow:0 4px 14px rgba(0,0,0,.12)}
.pf-ag{padding:0}
.pf-g h3{font-size:12.5px;text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px}.pf-g h3.u{color:#C5221F}.pf-g h3.w{color:#B06000}
.pf-l{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F3F4;font-size:13.5px}.pf-lt{flex:1}.pf-lb{white-space:nowrap}
.pf-d{width:9px;height:9px;border-radius:50%;flex:none}.pf-d.u{background:#D93025}.pf-d.w{background:#E3A008}
.pf-ok{color:#188038!important;font-size:14px}
.pf-tw{overflow-x:auto}.pf-tb{width:100%;border-collapse:collapse;font-size:13.5px}
.pf-tb th{text-align:left;font-size:11.5px;font-weight:600;color:#5F6368;text-transform:uppercase;letter-spacing:.3px;padding:6px 10px;border-bottom:1px solid #DADCE0;white-space:nowrap}
.pf-tb td{padding:3px 8px;border-bottom:1px solid #F1F3F4;vertical-align:middle;line-height:1.25}@media (min-width:701px){.pf-tb .pf-a{text-align:left!important}.pf-tb .pf-a>*:first-child{margin-left:0}.pf-tb .pf-a>.mbtn{min-width:170px;text-align:center;padding-top:4px;padding-bottom:4px}}
.pf-r{cursor:pointer}.pf-r:hover td{background:#F8F9FA}.pf-r td:first-child{border-left:4px solid #9AA0A6}
.pf-r.lib td:first-child{border-left-color:#188038}.pf-r.res td:first-child{border-left-color:#E3A008}.pf-r.blo td:first-child{border-left-color:#D93025}.pf-r.via td:first-child{border-left-color:#1967D2}
.pf-c-nm b{font-size:14.5px;white-space:nowrap}.pf-tb .pf-st{margin:0;white-space:nowrap}.pf-tb .pf-p{min-height:0;font-size:13.5px;font-weight:500}.pf-tb .pf-o{white-space:nowrap}
.pf-tb .pf-a{display:table-cell;text-align:right;white-space:nowrap}.pf-tb .pf-a>*{display:inline-block;vertical-align:middle;margin-left:4px}.pf-tb .pf-m>div{left:auto;right:0}
@media (max-width:700px){.pf-tb thead{display:none}.pf-tb,.pf-tb tbody{display:block}
 .pf-r{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:10px 12px;border-bottom:1px solid #EEF0F2;border-left:4px solid #9AA0A6}
 .pf-r.lib{border-left-color:#188038}.pf-r.res{border-left-color:#E3A008}.pf-r.blo{border-left-color:#D93025}.pf-r.via{border-left-color:#1967D2}
 .pf-r td{display:block;padding:0;border:0!important}.pf-r .pf-o,.pf-r .pf-p,.pf-r .pf-a{grid-column:1/-1}.pf-r .pf-c-n{grid-column:1/-1}.pf-r .pf-c-n:has(.note){display:none}.pf-tb .pf-a{text-align:left;margin-top:6px}.pf-tb .pf-a>*{margin:0 4px 0 0}}`; document.head.appendChild(st); }
