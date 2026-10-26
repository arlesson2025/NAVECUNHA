/* ===== Padrão profissional (Supervisor, 25/10/2026): nome da aba = título da tela, etiqueta da norma em todas as telas, versão com nota de liberação =====
   Telas: o render põe o título de TITULO e a etiqueta de NP_TAG (empurradores “NP 055 · item”, balsas “NP 024 · item”).
   A cada publicação: sobe VERSAO_APP (núcleo) e acrescenta a versão em VERSOES, com o que mudou e a data. */
'use strict';
// nome da aba igual ao título da tela
{ const ab = { rotina: 'Frota', emitir: 'Programar preventiva', kpi: 'Indicadores', relmes: 'Relatório mensal', apresmes: 'Apresentação mensal' };
  SECOES.forEach(s => s.views.forEach(v => { if (ab[v[0]]) v[1] = ab[v[0]]; })); }
// título da tela = nome da aba (só nas telas de aba, sem argumento: ficha, OM e cronograma de um empurrador mantêm o título próprio)
const TITULO = { matriz: 'Anexo I', oms: 'Preventivas', falhas2: 'Corretivas e falhas', horfrota: 'Horímetros', anoleo: 'Análise de óleo', compr: 'Compressão do MCP', lubcons: 'Óleo e resíduos' };   // a Biblioteca é uma página só (apoio): título “Biblioteca”
// etiqueta da norma nas telas das balsas (NP Navecunha 024)
Object.assign(NP_TAG, { bal: 'NP 024 · 5.4 e 6.1', balcr: 'NP 024 · 8', balpl: 'NP 024 · 7 e 8', baldoca: 'NP 024 · 7.0', balcal: 'NP 024 · 8.2.5 e 6.5', balcmp: 'NP 024 · 8.2.2 e 8.2.3', balkpi: 'NP 024 · 10', balft: 'NP 024 · 7.0' });
// versões do SMF e o que mudou em cada uma (controle de mudanças, ISO 9001 8.5.6 e 7.5.3); a publicação é autorizada pelo Supervisor
const VERSOES = [
  { v: '2.0', data: '25/10/2026', itens: ['Padrão único das telas: janelas livres (arrastar, redimensionar, Reorganizar) também nas balsas e no Relatório mensal; só a Apresentação mensal segue em tela de slides',
    'Nome da aba igual ao título da tela; grupos do menu Operação, Controle e Apoio (empurradores e balsas)', 'Cabeçalho único nos impressos (logos, título, norma, “Documento controlado pelo SGI” e folha N de T): cronograma previsto × realizado, evidências para auditoria e equipamentos críticos',
    'Etiqueta da norma ao lado do título em todas as telas (NP 055 nos empurradores, NP 024 nas balsas)', 'Versão do sistema com esta nota de liberação, em Administração'] },
  { v: '1.x', data: 'até 25/10/2026', itens: ['Versões anteriores sem número: o que mudou está no histórico do repositório (GitHub, mensagens “Área: o que mudou”), com data e autor de cada publicação.'] }];
// logos em data URL para os impressos abertos em janela própria (docCab)
const LOGO64 = {};
(async () => { for (const k of ['nav', 'vda']) { try { const bl = await (await fetch(LOGOS[k])).blob(); LOGO64[k] = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(''); f.readAsDataURL(bl); }); } catch (e) { } } })();
function versoesHTML() {
  return `<div class="card"><h2>Versão do SMF · ${VERSAO_APP}</h2><p class="note">Cada versão publicada com o que mudou. A publicação é autorizada pelo Supervisor de Manutenção (controle de mudanças · ISO 9001 8.5.6).</p>
   ${VERSOES.map(x => `<div class="vs-v"><b>SMF ${esc(x.v)}</b> <span class="note">${esc(x.data)}</span><ul>${x.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>`; }
{ const st = document.createElement('style'); st.textContent = `.vs-v{padding:6px 0;border-bottom:1px solid #EEF2F6}.vs-v:last-child{border:0}.vs-v ul{margin:4px 0 0 18px;padding:0}.vs-v li{font-size:13px;line-height:1.45}`; document.head.appendChild(st); }
