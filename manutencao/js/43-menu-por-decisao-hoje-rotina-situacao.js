/* ===== Menu por decisão: Hoje (rotina + situação da frota + alertas) · Cronograma · OMs · Condição · Indicadores · Biblioteca · Administração =====
   Nomes que não se repetem: "Itens em dia" e "Vencidos agora" = foto de agora (Situação da frota);
   "Aderência ao cronograma" e "Serviços preventivos não realizados dentro do prazo" = execução do previsto nos meses marcados (Cronograma). */
// Hoje: troca de óleo vencida (P1) · vence em até OL_ALERTA_H horas ou OL_ALERTA_D dias (P2) — mesmo critério da tela Óleo da frota
// #lubreg (antiga tela de registros) abre o Óleo da frota no bloco Trocas lançadas
let OL_IR = 0;   // veio de #lubreg: rolar até o bloco das trocas

// links cruzados: situação → cronograma do empurrador · cronograma → situação de hoje
// Controle: sem a parte de vencimentos (agora no Hoje)
{ const by = id => SECOES.find(s => s.id === id), oleo = by('oleo'), compr = by('compr'), graf = by('graf'), adm = by('adm');
  const cond = { id: 'cond2', nome: 'Condição', views: [...(oleo ? oleo.views.filter(x => x[0] !== 'lubreg') : []), ['anoleo', 'Análise de óleo'], ...(compr ? compr.views : []), ['controle', 'Calibração e docagem']], extra: [...(oleo && oleo.extra || []), ...(compr && compr.extra || []), 'lubreg'] };
  if (graf) graf.views = graf.views.filter(x => x[0] !== 'controle');
  if (adm) adm.views = adm.views.filter(x => x[0] !== 'frota');
  const ord = ['hoje', 'crono', 'omsv2'].map(by).filter(Boolean).concat([cond], ['graf', 'apoio2', 'adm'].map(by).filter(Boolean));
  SECOES.splice(0, SECOES.length, ...ord);
  // Biblioteca: #bib/#pecas/#terc/#trein viram a página única #apoio (paginaUnica); sem 'apoio' na seção, secDe caía no Hoje e o link do Hoje passava a abrir a Biblioteca
  const bib = by('apoio2'); if (bib && VX.apoio) { bib.extra = [...new Set((bib.extra || []).concat(bib.views.map(x => x[0])))]; bib.views = [['apoio', 'Biblioteca']]; }
  // nomes do menu (pedido do Supervisor, 21/10/2026): Hoje → "Frota N Empurradores" com "Diário & Viagens" embaixo · Cronograma → "Plano preventivo" · OMs → "OMs (Sankhya)"
  const h = by('hoje'), cr = by('crono'), om = by('omsv2'); if (h) h.sub = 'Diário & Viagens'; if (cr) { cr.nome = 'Plano preventivo'; cr.views = [['cxr', 'Cronograma preventivo'], ['matriz', 'Anexo I']]; if (adm) adm.views = adm.views.filter(x => x[0] !== 'matriz'); }   /* Anexo I: aba do Plano preventivo (antes em Administração) */ if (om) om.nome = 'OMs (Sankhya)';
  ICO.cond2 = ICO.compr || ICO.oleo || ICO.cond; }
// o número de empurradores acompanha o cadastro da frota · subtítulo (s.sub) em letra pequena dentro do item do menu
{ const st = document.createElement('style'); st.textContent = `#nav .nav-sub{display:block;font-size:10.5px;font-weight:400;line-height:1.15;opacity:.75;margin-top:1px}`; document.head.appendChild(st); }
/* menu na ordem do trabalho (pedido do Supervisor, 21/10/2026): Frota (chegou · saiu · em viagem) → Fazer preventiva → OMs (Sankhya) → Conferir e encerrar;
   Plano preventivo, Condição, Indicadores, Biblioteca e Administração descem para "Consulta" (cfg). A preventiva tinha a entrada escondida no cartão Situação da frota. */
{ const by = id => SECOES.find(s => s.id === id), om = by('omsv2');
  const prev = { id: 'prev2', nome: 'Fazer preventiva', sub: 'o que vence na janela', views: [['emitir', 'Programação da janela']] };
  const conf = { id: 'conf2', nome: 'Conferir e encerrar', sub: 'OMs lançadas', views: [['omconf', 'Conferir e encerrar']] };
  { const c = by('cond2'); if (c) c.extra = [...new Set((c.extra || []).concat(['plano', 'lubcons']))]; }   // Plano de lubrificação (aberto pela Biblioteca) e Consumo e OLUC: telas do óleo
  if (om) { om.extra = (om.extra || []).filter(x => x !== 'emitir'); om.sub = 'lançar o que foi feito'; SECOES.splice(SECOES.indexOf(om), 0, prev); SECOES.splice(SECOES.indexOf(om) + 1, 0, conf); }
  ['crono', 'cond2', 'graf', 'apoio2', 'adm'].forEach(id => { const s = by(id); if (s) s.cfg = true; });
  ICO.prev2 = ICO.crono || ICO.oms || ICO.hoje; ICO.conf2 = ICO.adm || ICO.omsv2 || ICO.oms; }
// Conferir e encerrar: OMs (preventiva e corretiva) na etapa "Em conferência", que só o Supervisor aprova
/* Conferir e encerrar num bloco só (24/10/2026) */
/* + Anexar no Sankhya (bloco do Sankhya) */
// Calibração e docagem: mesma largura e alinhamento da Compressão do MCP (largura toda, encostada à esquerda)
{ const st = document.createElement('style'); st.textContent = `body:has(#main .cs-idx) #main{max-width:none!important;margin-left:0!important;margin-right:0!important}`; document.head.appendChild(st); }
{ const st = document.createElement('style'); st.textContent = `.fs-sm{display:block;font-size:11.5px;font-weight:400;color:#64748B;line-height:1.2}
@media(max-width:760px){.fs-p{white-space:normal}}`; document.head.appendChild(st); }
