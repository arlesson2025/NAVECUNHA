/* ===== Busca única: campo no topo do menu (e 🔍 na barra do celular) que procura em empurradores, OMs, itens do Anexo I e Biblioteca, e "Perguntar à IA" no fim do painel =====
   Todas as palavras precisam aparecer (sem diferença de acento ou maiúscula). Atalho "/" foca o campo. O Operador não vê a busca. */
'use strict';
const BQ_NORM = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const BQ_ST = { emitida: 'emitida', aberta: 'aberta', execucao: 'em execução', encerrada: 'encerrada' };
function bqResultados(q) {
  let qn = BQ_NORM(q).replace(/\s+/g, ' ').trim(); if (!qn) return [];
  // nome de empurrador escrito inteiro vira filtro exato ("cja i" não traz CJA II, CJA III…)
  const F = S.cfg.frota || [], exV = F.filter(v => new RegExp(`(^| )${BQ_NORM(v.nome).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(qn)).sort((a, z) => z.nome.length - a.nome.length)[0];
  if (exV) qn = qn.replace(BQ_NORM(exV.nome), ' ').replace(/\s+/g, ' ').trim();
  const T = qn.split(' ').filter(Boolean);
  const ok = (...c) => { const s = BQ_NORM(c.join(' ')); return T.every(t => s.includes(t)); };
  const G = [];
  const emp = (exV ? (T.length ? [] : [exV]) : F.filter(v => ok(v.nome, v.id, Object.values(v.mcpMod || {}).join(' '), Object.values(v.mcaMod || {}).join(' '))))
    .map(v => ({ t: v.nome, s: typeof foraOp === 'function' && foraOp(v) ? 'fora de operação' : 'abrir o cartão do empurrador', go: '#barco/' + encodeURIComponent(v.id) }));
  if (emp.length) G.push(['Empurradores', emp]);
  const om = recs('om').filter(o => (!exV || o.vessel === exV.id) && ok(o.num, o.rnc, o.descricao, o.equip, o.sistema, o.classe, exV ? '' : vName(o.vessel), o.pos, (o.items || []).join(' '), o.tipo === 'C' ? 'corretiva' : 'preventiva'))
    .sort((a, z) => (z.updatedAt || 0) - (a.updatedAt || 0))
    .map(o => ({ t: `OM ${o.num || '—'} · ${vName(o.vessel)}`, s: [o.tipo === 'C' ? 'Corretiva' + (o.classe ? ' ' + o.classe : '') : 'Preventiva', BQ_ST[o.status] || o.status, o.descricao || o.equip || ''].filter(Boolean).join(' · '), go: '#om/' + encodeURIComponent(o.id) }));
  if (om.length) G.push(['Ordens de manutenção', om]);
  if (exV && !T.length) return G;   // só o nome do empurrador: o cartão e as OMs dele
  const it = A1.filter(a => ok(a.id, a.eq, a.eqn, a.item, a.chk, a.freq)).sort((a, z) => (z.id === qn) - (a.id === qn)).map(a => ({ t: `${a.id} · ${a.item}`, s: `${a.eq} · ${a.chk || ''} · ${a.freq || ''}`, mx: a.id }));
  if (it.length) G.push(['Itens do Anexo I', it]);
  const bib = recs('doc').map(r => ({ t: r.titulo, d: [r.desc, r.equip, r.tags].join(' ') })).concat((typeof BIB_FIXOS !== 'undefined' ? BIB_FIXOS : []).filter(r => !r.sug).map(r => ({ t: r.titulo, d: r.desc })))
    .filter(r => ok(r.t, r.d)).map(r => ({ t: r.t, s: r.d && r.d.trim() ? r.d : 'Biblioteca', bb: q }));
  if (bib.length) G.push(['Biblioteca', bib]);
  return G;
}
/* --- Perguntar à IA (servidor v16, ação 'ia': Claude → Gemini → ChatGPT → Grok → DeepSeek com novas tentativas; chaves só nas Propriedades do script) ---
   O SMF manda um resumo dos dados deste aparelho junto com a pergunta. Só Supervisor e Analista logados na nuvem; sem internet o botão fica desativado. */
const IA_MAXCTX = 60000;   // caracteres de contexto por pergunta (o servidor corta em 80.000)
const IA_EST = { q: '', on: false, txt: '', mod: '', err: '' };

function iaContexto() {
  const L = [], add = (t, f) => { try { const s = f(); if (s && s.length) L.push('## ' + t + '\n' + s.join('\n')); } catch (e) { L.push('## ' + t + '\n(não foi possível montar esta parte)'); } };
  const cut = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const F = S.cfg.frota || [];
  L.push('Data de hoje: ' + brD(isoD(hoje())));
  add('Frota (empurradores)', () => F.map(v => {
    const fo = typeof foraOp === 'function' && foraOp(v), si = typeof situDe === 'function' && situDe(v);
    const ol = typeof oleoDoBarco === 'function' ? oleoDoBarco(v).slice(0, 3).map(o => `${o.nome}: ${o.rest <= 0 ? 'VENCIDA há ' + Math.round(-o.rest) + ' h' : 'faltam ' + Math.round(o.rest) + ' h'}${o.porData ? ' (pela data)' : ''}`).join('; ') : '';
    return `- ${v.nome} [id ${v.id}]` + (fo ? ` · FORA DE OPERAÇÃO: ${cut(fo.motivo, 80)}` : '') + (si ? ` · ${si.st === 'viagem' ? 'em viagem' : 'no porto'} desde ${brD(si.at)}` : '') + (ol ? ` · próximas trocas de óleo: ${ol}` : '');
  }));
  add('Trocas de óleo vencidas ou próximas', () => (typeof lubDados === 'function' ? lubDados() : []).filter(x => x.s && (x.s.st === 'venc' || x.s.st === 'prox'))
    .map(x => `- ${x.v.nome} · ${x.e.nome}: ${x.s.st === 'venc' ? 'VENCIDA' : 'próxima'}` + (x.horas != null ? ` (${Math.round(x.horas)} h)` : '') + (x.dias != null ? ` (${Math.round(x.dias)} dias)` : '') + (x.om ? ` · OM ${x.om.num || ''} aberta` : ' · sem OM')));
  const OM = recs('om').filter(o => !o.excluido);
  add('OMs não encerradas', () => OM.filter(o => o.status !== 'encerrada').sort((a, z) => (z.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 200)
    .map(o => `- OM ${o.num || '—'} · ${vName(o.vessel)} · ${o.tipo === 'C' ? 'Corretiva' + (o.classe ? ' ' + o.classe : '') : 'Preventiva'} · ${BQ_ST[o.status] || o.status}` + (o.pos ? ` · ${o.pos}` : '') + ` · desde ${brD(String(o.abertura || o.emitAt || '').slice(0, 10)) || '?'}` + (o.descricao ? ` · ${cut(o.descricao, 120)}` : '') + (o.items && o.items.length ? ` · itens ${o.items.slice(0, 8).join(', ')}` : '')));
  const ano = isoD(new Date(hoje() - 365 * 864e5));
  add('Corretivas dos últimos 12 meses (inclui encerradas)', () => OM.filter(o => o.tipo === 'C' && String(o.abertura || '').slice(0, 10) >= ano).sort((a, z) => String(z.abertura).localeCompare(String(a.abertura))).slice(0, 250)
    .map(o => `- OM ${o.num || '—'} · ${vName(o.vessel)} · ${o.classe || 'sem classe'} · ${o.sistema || ''} · aberta ${brD(String(o.abertura).slice(0, 10))} · ${BQ_ST[o.status] || o.status} · ${cut(o.descricao, 100)}`));
  add('Avarias em viagem ainda sem OM', () => recs('avaria').filter(r => !r.excluido && !r.om).map(r => `- ${vName(r.vessel)} · ${brD(r.date)} ${r.hora || ''} · ${r.c || ''} · ${cut(r.desc, 140)}`));
  add('Último laudo de óleo por motor', () => { const U = {}; recs('laudo').filter(r => !r.excluido).forEach(r => { const k = r.vessel + '|' + r.pos; if (!U[k] || r.date > U[k].date) U[k] = r; });
    return Object.values(U).map(r => `- ${vName(r.vessel)} · ${r.pos} · ${brD(r.date)} · óleo com ${r.hOleo || '?'} h · ` + Object.entries(r.vals || {}).filter(([, x]) => x !== '' && x != null).map(([k, x]) => k + ' ' + x).join(', ') + (r.obs ? ` · ${cut(r.obs, 100)}` : '')); });
  let t = L.join('\n\n'); if (t.length > IA_MAXCTX) t = t.slice(0, IA_MAXCTX) + '\n(resumo cortado por tamanho)';
  return t;
}

// resposta em texto simples → HTML seguro, com links para os empurradores e OMs citados
function iaHTML(txt) {
  let h = esc(txt).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  (S.cfg.frota || []).slice().sort((a, z) => z.nome.length - a.nome.length).forEach(v => {
    const n = esc(v.nome).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    h = h.replace(new RegExp(`(^|[^\\wÀ-ÿ>#])(${n})(?![\\wÀ-ÿ]| I| V| X)`, 'g'), (m, a, b) => `${a}<a href="#barco/${encodeURIComponent(v.id)}" data-iago>${b}</a>`);
  });
  const OM = recs('om').filter(o => o.num && !o.excluido);
  h = h.replace(/\bOM (?:nº ?)?([\w./-]+)/g, (m, n) => { const o = OM.find(x => String(x.num) === n); return o ? `<a href="#om/${encodeURIComponent(o.id)}" data-iago>${m}</a>` : m; });
  return h.split(/\n{2,}/).map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
}

function iaBloco(q) {
  const pode = !!(S.url && S.session && S.session.token && !(typeof ehOperador === 'function' && ehOperador()));
  if (!pode) return '';
  const E = IA_EST.q === q ? IA_EST : { on: false, txt: '', err: '' };
  if (E.on) return `<div class="ia-b"><div class="ia-load">Consultando a IA…</div></div>`;
  if (E.txt) return `<div class="ia-b"><div class="bq-g">Resposta da IA</div><div class="ia-txt">${iaHTML(E.txt)}</div><small class="ia-mod">Respondido por ${esc(E.mod)} com os dados deste aparelho. Confira antes de decidir.</small></div>`;
  return `<div class="ia-b">${E.err ? `<div class="ia-err">${esc(E.err)}</div>` : ''}<button type="button" class="ia-btn" data-iaq${navigator.onLine ? '' : ' disabled title="Sem internet"'}>✨ Perguntar à IA${navigator.onLine ? '' : ' (sem internet)'}</button></div>`;
}

async function iaPerguntar() {
  const inp = $('#bqI'), q = inp ? inp.value.trim() : ''; if (!q) return;
  Object.assign(IA_EST, { q, on: true, txt: '', mod: '', err: '' }); bqPainel();
  try {
    const j = await api('ia', { pergunta: q.slice(0, 500), contexto: iaContexto() });
    if (IA_EST.q !== q) return;   // a pessoa já mudou a pergunta
    if (j.ok) Object.assign(IA_EST, { on: false, txt: j.resposta || '(resposta vazia)', mod: j.modelo || 'IA' });
    else Object.assign(IA_EST, { on: false, err: j.error === 'auth' ? 'Entre de novo para usar a IA.' : j.error === 'ia_limite' ? 'Limite de perguntas por hora atingido. Tente mais tarde.' : j.error === 'ia_sem_chave' ? 'Nenhuma chave de IA configurada no servidor.' : j.error === 'acao_desconhecida' ? 'O servidor ainda não tem a IA (precisa da versão 16).' : 'A IA não respondeu agora (todos os modelos falharam). Tente de novo em instantes.' });
  } catch (e) { if (IA_EST.q === q) Object.assign(IA_EST, { on: false, err: 'Não foi possível falar com o servidor.' }); }
  if ($('#bqI') && $('#bqI').value.trim() === q) bqPainel();
}
function bqPainel() {
  const inp = $('#bqI'), p = $('#bqP'); if (!inp || !p) return;
  const q = inp.value.trim(); if (!q) { p.hidden = true; p.innerHTML = ''; return; }
  const G = bqResultados(q), MAX = 6; let i = 0;
  p.innerHTML = G.length ? G.map(([g, L]) => `<div class="bq-g">${esc(g)} <span>${L.length}</span></div>` + L.slice(0, MAX).map(r => `<button type="button" class="bq-r" data-bqi="${i++}"${r.go ? ` data-bqgo="${esc(r.go)}"` : ''}${r.mx ? ` data-bqmx="${esc(r.mx)}"` : ''}${r.bb != null ? ` data-bqbb="${esc(r.bb)}"` : ''}><b>${esc(r.t)}</b><small>${esc(r.s)}</small></button>`).join('') + (L.length > MAX ? `<div class="bq-mais">+ ${L.length - MAX} — refine a busca</div>` : '')).join('')
    : `<div class="bq-vz">Nada encontrado para “${esc(q)}”.</div>`;
  if (IA_EST.q && IA_EST.q !== q) Object.assign(IA_EST, { q: '', on: false, txt: '', mod: '', err: '' });
  p.insertAdjacentHTML('beforeend', iaBloco(q));
  p.hidden = false; bqPos();
}
function bqPos() { const inp = $('#bqI'), p = $('#bqP'); if (!inp || !p || p.hidden) return;
  // celular: dentro do menu, abaixo do campo · computador: no body, à direita do menu (o .side tem empilhamento próprio e ficaria atrás dos cartões)
  if (matchMedia('(max-width:760px)').matches) { if (p.parentNode !== $('#bqW')) $('#bqW').appendChild(p); p.style.cssText = ''; return; }
  if (p.parentNode !== document.body) document.body.appendChild(p);
  const r = inp.getBoundingClientRect(); p.style.cssText = `position:fixed;left:${Math.round(r.right + 10)}px;top:${Math.round(r.top)}px;width:460px;max-height:${Math.round(innerHeight - r.top - 16)}px`; }
function bqFechar(limpa) { const p = $('#bqP'), inp = $('#bqI'); if (p) { p.hidden = true; } if (limpa && inp) inp.value = ''; }
function bqIr(b) {
  bqFechar(true); document.body.classList.remove('menu');
  if (b.dataset.bqmx) { MX.q = b.dataset.bqmx; if (location.hash === '#matriz') render(); else location.hash = '#matriz'; return; }
  if (b.dataset.bqbb != null) { BB.q = b.dataset.bqbb; if (location.hash === '#apoio') render(); else location.hash = '#apoio'; return; }
  if (b.dataset.bqgo) location.hash = b.dataset.bqgo;
}
{ const nav = document.getElementById('nav');
  const w = document.createElement('div'); w.className = 'bq'; w.id = 'bqW';
  w.innerHTML = `<input id="bqI" type="search" placeholder="Buscar empurrador, OM, item, documento…" autocomplete="off" aria-label="Busca" title="Atalho: /"><div id="bqP" class="bq-p" hidden></div>`;
  nav.parentNode.insertBefore(w, nav);
  const mt = document.querySelector('.mtop'), mn = document.getElementById('mnu');
  if (mt && mn) { const b = document.createElement('button'); b.id = 'bqM'; b.type = 'button'; b.setAttribute('aria-label', 'Buscar'); b.textContent = '🔍'; mt.appendChild(b);
    b.onclick = e => { e.stopPropagation(); /* sem o stop, o clique global fecha o menu (clique fora do #side) */ document.body.classList.add('menu'); setTimeout(() => $('#bqI').focus(), 220); }; }
  const inp = $('#bqI'), p = $('#bqP'); let tm = 0;
  inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(bqPainel, 120); });
  inp.addEventListener('focus', () => { if (inp.value.trim()) bqPainel(); });
  inp.addEventListener('keydown', e => {
    const bs = [...p.querySelectorAll('.bq-r')], at = p.querySelector('.bq-r.on'), k = bs.indexOf(at);
    if (e.key === 'Escape') { bqFechar(true); inp.blur(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!bs.length) return; const n = bs[(k + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length] || bs[0]; if (at) at.classList.remove('on'); n.classList.add('on'); n.scrollIntoView({ block: 'nearest' }); return; }
    if (e.key === 'Enter') { e.preventDefault(); const b = at || bs[0]; if (b) bqIr(b); } });
  p.addEventListener('mousedown', e => e.preventDefault());   // não tirar o foco do campo antes do clique
  p.addEventListener('click', e => { const b = e.target.closest('.bq-r'); if (b) return bqIr(b);
    if (e.target.closest('[data-iaq]')) { e.preventDefault(); iaPerguntar(); return; }
    if (e.target.closest('[data-iago]')) { bqFechar(true); document.body.classList.remove('menu'); } });
  ['online', 'offline'].forEach(ev => addEventListener(ev, () => { if (!p.hidden) bqPainel(); }));
  document.addEventListener('click', e => { if (!e.target.closest('#bqW,#bqP')) bqFechar(false); });
  addEventListener('resize', bqPos);
  document.addEventListener('keydown', e => { if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target; if (t.closest && t.closest('input,textarea,select,[contenteditable="true"]')) return; if (ehOperador() || !S.session) return; e.preventDefault(); inp.focus(); inp.select(); });
  const st = document.createElement('style'); st.textContent = `.bq{position:relative;padding:0 2px}
#bqI{width:100%;box-sizing:border-box;font:inherit;font-size:13px;padding:8px 10px;border:1px solid #DADCE0;border-radius:8px;background:#F8F9FA;color:#202124}
#bqI:focus{outline:none;border-color:#1967D2;background:#fff;box-shadow:0 0 0 2px rgba(25,103,210,.15)}
.bq-p{z-index:2000;background:#fff;border:1px solid #DADCE0;border-radius:10px;box-shadow:0 8px 24px rgba(60,64,67,.18);overflow-y:auto;padding:6px 0;color:#202124}
.bq-g{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#5F6368;padding:8px 14px 4px}.bq-g span{font-weight:400}
.bq-r{display:block;width:100%;text-align:left;border:0;background:none;font:inherit;padding:6px 14px;cursor:pointer;color:inherit}
.bq-r:hover,.bq-r.on{background:#E8F0FE}.bq-r b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bq-r small{display:block;font-size:11.5px;color:#5F6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bq-mais,.bq-vz{font-size:12px;color:#5F6368;padding:4px 14px 6px}
#bqM{background:none;border:0;font-size:18px;padding:2px 4px;cursor:pointer;color:inherit}
body.perfil-opr .bq,body.perfil-opr #bqM,body.perfil-opr #bqP,html.gated #bqP{display:none}
@media (max-width:760px){.bq-p{position:static;margin-top:6px;max-height:60vh}}
.ia-b{border-top:1px solid #E8EAED;margin-top:6px;padding:8px 14px 6px}
.ia-btn{font:inherit;font-size:13px;font-weight:600;color:#1967D2;background:#E8F0FE;border:0;border-radius:8px;padding:8px 12px;cursor:pointer;width:100%}
.ia-btn:hover{background:#D2E3FC}.ia-btn[disabled]{color:#80868B;background:#F1F3F4;cursor:default}
.ia-load{font-size:13px;color:#5F6368;padding:6px 0}
.ia-err{font-size:12px;color:#C5221F;margin-bottom:6px}
.ia-b .bq-g{padding:0 0 4px}
.ia-txt{font-size:13px;line-height:1.45}.ia-txt p{margin:0 0 6px}.ia-txt a{color:#1967D2}
.ia-mod{display:block;font-size:11px;color:#80868B;margin-top:4px}`;
  document.head.appendChild(st); }
