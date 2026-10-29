/* ===== tela de acesso: o SMF só abre com nome e senha ===== */
'use strict';
const sessOk = () => { try { return sessionStorage.getItem('sgmf_ok') === '1'; } catch (e) { return false; } };
function gate() {
  if (S.session && !sessOk()) { S.session = null; kvSet('session', null); }
  let g = document.getElementById('gate');
  if (S.session) { if (g) g.remove(); document.documentElement.classList.remove('gated'); return; }
  document.documentElement.classList.add('gated');
  if (g) return;
  g = document.createElement('div'); g.id = 'gate';
  // quadro de apresentação ao lado da senha (Supervisor, 28/10/2026: “deixa isso como um banner na entrada do app, resumido, com os destaques”)
  const ban = `<aside class="gban"><p class="gk">O que é o SMF</p><h2>CMMS próprio da frota Navecunha</h2>
   <p>Sistema informatizado de gestão da manutenção, desenvolvido internamente sobre a <b>NP Navecunha 055</b>.</p>
   <ul><li><b>Feito sobre o nosso processo:</b> plano do Anexo I, equipamentos críticos da NP 6.3, Anexos II, FR 049_B e FR 027_L. Um CMMS comprado não chega tão perto da rotina da frota.</li>
   <li><b>Ciclo completo:</b> horímetro, plano anual, OM, execução com foto, indicadores e relatório mensal.</li>
   <li><b>Rastreável na auditoria:</b> cada serviço ligado à OM do Sankhya, com evidência de antes e depois.</li>
   <li><b>Funciona a bordo:</b> sem internet, e sincroniza quando o sinal volta.</li></ul>
   <p class="gf">Apoia o SGI · ISO 9001, 14001 e 45001</p></aside>`;
  g.innerHTML = `<div class="gwrap"><form class="gbox" autocomplete="on"><div class="glogos"><img src="${LOGOS.nav}" alt="Navecunha"><i></i><img src="${LOGOS.vda}" alt="Grupo VDA"></div>
   <h1>SMF</h1><p class="gsub">Sistema de Manutenção da Frota</p>
   <label>Seu nome<input id="gN" autocomplete="username" required></label>
   <label>Senha<input id="gP" type="password" autocomplete="current-password" required></label>
   <div id="gCaps" style="display:none;color:#B06000;font-size:12px">Caps Lock está ligado.</div><div id="gE"></div><button type="submit" id="gB">Entrar</button>
   <p class="gnote">Acesso restrito à equipe de manutenção Navecunha.<br><span id="gMode">${S.url ? 'Conectado à planilha do Google' : 'Modo local (sem planilha)'}</span></p></form>${ban}</div>`;
  document.body.appendChild(g);
  try { const n = localStorage.getItem('sgmf_nome'); if (n) { $('#gN').value = n; setTimeout(() => $('#gP').focus(), 50); } else setTimeout(() => $('#gN').focus(), 50); } catch (e) { }
  $('#gP').addEventListener('keyup', ev => { $('#gCaps').style.display = ev.getModifierState && ev.getModifierState('CapsLock') ? '' : 'none'; });
  g.querySelector('form').onsubmit = async ev => { ev.preventDefault(); const b = $('#gB'); b.disabled = true; b.textContent = 'Entrando…'; $('#gE').textContent = '';
    const nome = $('#gN').value.trim(), pw = $('#gP').value.trim();
    if (!nome) { b.disabled = false; b.textContent = 'Entrar'; $('#gE').textContent = 'Digite seu nome (qualquer nome, ex.: Arlesson).'; $('#gN').focus(); return; }
    let e; try { e = await login(nome, pw); } catch (er) { e = 'Não consegui falar com o servidor do Google. Verifique a internet e tente de novo.'; }
    b.disabled = false; b.textContent = 'Entrar';
    if (e) { $('#gE').innerHTML = esc(S.url ? 'Senha não aceita pela planilha do Google. Confira a senha do Supervisor configurada na planilha.' : 'Senha incorreta.') + (S.url ? '<br><button type="button" class="glink" id="gLoc">Entrar sem a planilha (modo local neste computador)</button>' : '');
      const l = $('#gLoc'); if (l) l.onclick = async () => { S.url = ''; await kvSet('url', ''); $('#gE').textContent = 'Modo local ativado. Digite a senha de novo.'; $('#gMode').textContent = 'Modo local (sem planilha)'; $('#gP').focus(); };
      $('#gP').select(); return; }
    try { localStorage.setItem('sgmf_nome', S.session.name); } catch (er) { }
    gate(); toast('Bem-vindo, ' + S.session.name + '.'); render(); };
}
{ let n = 0; const t = setInterval(() => { n++; if (typeof S !== 'undefined' && S.cfg && typeof LOGOS !== 'undefined') { clearInterval(t); gate(); } else if (n > 100) clearInterval(t); }, 100); }

