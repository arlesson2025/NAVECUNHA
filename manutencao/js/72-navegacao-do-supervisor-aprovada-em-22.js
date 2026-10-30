/* ===== Navegação do Supervisor (aprovada em 22/10/2026): Operação (o dia, 1 → 4) · Acompanhamento (plano, motores, indicadores) · Apoio (consulta) =====
   · número no menu = trabalho pendente (Frota: urgentes; 2: empurradores com itens para programar; 3: OMs abertas + falhas sem OM; 4: a conferir + a anexar no Sankhya); item da operação sem nada fica apagado
   · 3 · Executar e lançar com duas abas: Preventivas (oms) e Corretivas e falhas (falhas2) · Calibração e docagem vai para o Plano preventivo · "Condição dos motores"
   · cada tela da operação termina com "→ Próximo" para a etapa seguinte; a ficha técnica do empurrador tem "← Frota". */
'use strict';
const NAV_C = { v: -1, d: '', r: null };
function navCont() { const k = (S.recs.__v || 0) + '|' + S.recs.size + '|' + isoD(hoje()); if (NAV_C.r && NAV_C.v === k) return NAV_C.r;
  const op = S.cfg.frota.filter(v => !foraOp(v)), G = new Map();
  oms().filter(o => !o.excluido && o.status !== 'encerrada').forEach(o => { const g = o.grupo || o.id; if (!G.has(g)) G.set(g, { o, st: o.grupo ? grpStatus(omGrupo(o.grupo)) : o.status }); });
  const L = [...G.values()], falhas = op.reduce((a, v) => a + fr27Pend(v.id).length, 0);
  const prog = op.filter(v => situDe(v) && v.situ.st === 'porto' && painelVessel(v, viagemDe(v)).some(y => y.t.kind === 'prog' && ['venc', 'mes', 'emb'].includes(emGrp(v, y)) && !y.om)).length;
  let urg = 0; try { urg = agoraLista().filter(a => a.p === 1).length; } catch (e) { }
  const r = { rotina: urg, emitir: prog, oms: L.filter(x => x.o.tipo !== 'C' && x.st !== 'conferencia').length, falhas2: L.filter(x => x.o.tipo === 'C' && x.st !== 'conferencia').length + falhas, falhasSem: falhas,
    omconf: L.filter(x => x.st === 'conferencia').length + (typeof skPend === 'function' ? skPend().length : 0) };
  NAV_C.v = k; NAV_C.r = r; return r; }
{ const by = id => SECOES.find(s => s.id === id), cr = by('crono'), cd = by('cond2'), om = by('omsv2'), h = by('hoje');
  if (cd) { cd.views = cd.views.filter(x => x[0] !== 'controle'); cd.nome = 'Condição dos motores'; cd.sub = 'horímetros, óleo, compressão'; }
  if (cr) { if (!cr.views.some(x => x[0] === 'controle')) cr.views.push(['controle', 'Calibração e docagem']); cr.sub = 'cronograma, Anexo I, calibração'; }
  if (om) { om.views = [['oms', 'Preventivas'], ['falhas2', 'Corretivas e falhas']]; om.sub = 'preventivas e corretivas'; }
  if (h) h.sub = 'comece por aqui'; }
/* 3 · Executar e lançar · aba Corretivas e falhas */
/* Corretivas e falhas num bloco só (24/10/2026): a etiqueta dos eletrônicos de navegação (NP 5.12) entra direto na coluna Etapa */


padTela('falhas2', { titulo: 'Executar e lançar · Corretivas e falhas', desc: 'Da falha detectada à corretiva aberta no Sankhya e executada (Anexo II-A)',
  resumo: () => { const C = navCont(); return [['Falhas sem OM', C.falhasSem, C.falhasSem ? 'var(--badt)' : 'var(--okt)'], ['Corretivas em andamento', C.falhas2 - C.falhasSem], ['Prazo estourado', agoraLista().filter(a => /prazo estourado/.test(a.txt)).length, 'var(--badt)']]; } });
/* → Próximo no fim de cada tela da operação */
{ const nx = (view, f) => { const v0 = VX[view]; if (!v0) return; VX[view] = function () { const h = v0.apply(this, arguments); if (typeof ehOperador === 'function' && ehOperador()) return h; let r = ''; try { r = f(); } catch (e) { } return h + r; }; };
  const bar = (txt, href, bt) => `<div class="nx-bar"><span>${txt}</span><span class="sp"></span><a class="mbtn pri" href="${href}">${bt} →</a></div>`;
  nx('emitir', () => { const n = navCont().oms; return bar(`Depois de emitir a OM e entregar o formulário: <b>3 · Executar e lançar</b>${n ? ` · ${n} preventiva${n > 1 ? 's' : ''} aberta${n > 1 ? 's' : ''}` : ''}`, '#oms', 'Próximo: Executar e lançar'); });
  nx('oms', () => { const n = navCont().omconf; return bar(`Formulário lançado vai para <b>4 · Conferir e encerrar</b>${n ? ` · ${n} esperando` : ''}`, '#omconf', 'Próximo: Conferir e encerrar'); });
  nx('falhas2', () => { const n = navCont().omconf; return bar(`Corretiva executada vai para <b>4 · Conferir e encerrar</b>${n ? ` · ${n} esperando` : ''}`, '#omconf', 'Próximo: Conferir e encerrar'); });
  nx('omconf', () => bar('Encerrado no SMF e anexado no Sankhya: volte ao painel para o próximo passo de cada empurrador', '#rotina', 'Voltar à 1 · Frota')); }
{ const st = document.createElement('style'); st.textContent = `#nav .n.blue{background:#1967D2!important;color:#fff}#nav a.nav-zero{opacity:.55}#nav a.nav-zero:hover{opacity:1}
.nx-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:16px 0 4px;padding:12px 16px;background:#E8F0FE;border:1px solid #C6DAFC;border-radius:10px;font-size:13.5px;color:#174EA6}`; document.head.appendChild(st); }
