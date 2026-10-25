/* ===== Eletrônicos de navegação e comunicação · NP 5.12 (lacuna 5 do fluxo NP 055 × SMF, 22/10/2026) =====
   Radar, GPS/Plotter, AIS, Ecobatímetro, Autotrac, VHF e CFTV: a Manutenção só verifica a alimentação elétrica (tensão, disjuntores, fusíveis, cabos, aterramento, terminais, suportes).
   a) causa na alimentação → a Manutenção corrige e encerra · b) alimentação normal → a OM vai para o TI, que repara ou terceiriza (relatório anexado, NP 5.8).
   Corretiva com palavra-chave ou dos sistemas 7.0/11.0 mostra o cartão; o.eletr (sim/não), o.ti = { res: 'alim' | 'ti', data, quem, obs, at }. Entra na conferência do Anexo II-A. */
'use strict';
const TI_RE = /\b(radar|gps|plotter|ais|ecobat[ií]metro|sonda|autotrac|vhf|cftv|r[aá]dio)\b/i;
const ehEletr = o => { if (!o || o.tipo !== 'C') return false; if (o.eletr === false) return false; if (o.eletr === true) return true; return TI_RE.test((o.descricao || '') + ' ' + (o.equipamento || '')); };
const talvezEletr = o => o && o.tipo === 'C' && o.eletr == null && !ehEletr(o) && /^(7\.0|11\.0)/.test(o.sistema || '');
function tiCard(o) { const T = o.ti;
  if (talvezEletr(o)) return `<div class="card ti-c"><div class="row" style="align-items:center"><h2 style="margin:0">É eletrônico de navegação ou comunicação? · NP 5.12</h2><span class="sp"></span><button class="mbtn sm" data-tieletr="${o.id}|1">Sim</button><button class="mbtn sm" data-tieletr="${o.id}|0">Não</button></div><p class="note" style="margin:6px 0 0">Radar, GPS/Plotter, AIS, Ecobatímetro, Autotrac, rádio VHF ou CFTV: a Manutenção só verifica a alimentação elétrica; o resto é do TI.</p></div>`;
  if (!ehEletr(o)) return '';
  return `<div class="card ti-c ${T ? (T.res === 'ti' ? 'ti' : 'ok') : ''}"><div class="row" style="align-items:center"><h2 style="margin:0">Eletrônico de navegação · NP 5.12</h2><span class="sp"></span><button class="mbtn sm${T ? '' : ' pri'}" data-timodal="${o.id}">${T ? 'Alterar' : 'Registrar a verificação'}</button></div>
    <p class="note" style="margin:6px 0 0">${T ? (T.res === 'ti' ? `🖥 <b>Direcionada ao TI</b>: alimentação normal · o TI repara ou terceiriza e o relatório é anexado à OM (NP 5.8)` : `🔌 <b>Causa na alimentação elétrica</b>: a Manutenção corrige e encerra`) + ` · ${brD(T.data)} · ${esc(T.quem)}${T.obs ? ' · ' + esc(T.obs) : ''}` : 'A Manutenção verifica só a alimentação elétrica (tensão, disjuntores, fusíveis, cabos, aterramento, terminais e suportes). Não abre, não configura e não troca componente interno.'}</p></div>`; }
function tiModal(o) { if (!precisa(false)) return;
  modal(`<h2>Verificação da alimentação elétrica · OM ${esc(o.num || '')} · ${esc(vName(o.vessel))}</h2><p class="note">NP 5.12: a Manutenção verifica tensão, disjuntores e fusíveis, cabos de alimentação e aterramento, terminais e fixação dos suportes.</p>
   <div class="g"><label class="f s2">Data<input type="date" id="tiD" value="${isoD(hoje())}"></label><label class="f s4">Verificada por<input id="tiQ" value="${esc(S.session ? S.session.name : '')}"></label>
    <div class="f s6"><span>Resultado</span><div style="display:flex;flex-direction:column;gap:6px;padding-top:6px"><label><input type="radio" name="tiR" value="alim"> a) Causa na alimentação elétrica · a Manutenção corrige e encerra</label><label><input type="radio" name="tiR" value="ti"> b) Alimentação normal · direcionar a OM ao TI</label></div></div>
    <label class="f s6">O que foi verificado<textarea id="tiO" rows="2" placeholder="Ex.: 24 V na entrada, fusível ok, aterramento ok"></textarea></label></div>
   <div class="err" id="tiE" style="color:var(--badt);min-height:18px"></div><div class="row end"><button class="mbtn" data-close>Cancelar</button><button class="mbtn pri" id="tiOk">Gravar</button></div>`, true);
  $('#tiOk').onclick = async () => { const r = document.querySelector('#modal input[name=tiR]:checked'), q = $('#tiQ').value.trim(); if (!q) return $('#tiE').textContent = 'Informe quem verificou.'; if (!r) return $('#tiE').textContent = 'Marque o resultado.';
    o.ti = { res: r.value, data: $('#tiD').value || isoD(hoje()), quem: q, obs: $('#tiO').value.trim(), at: Date.now() }; o.eletr = true;
    (o.hist = o.hist || []).push({ at: Date.now(), by: S.session ? S.session.name : '', ev: 'NP 5.12 · ' + (r.value === 'ti' ? 'alimentação normal: direcionada ao TI' : 'causa na alimentação elétrica') });
    await saveRec(o); closeModal(); toast(r.value === 'ti' ? 'OM direcionada ao TI.' : 'Registrado: causa na alimentação elétrica.'); render(); }; }
document.addEventListener('click', async e => { const a = e.target.closest('[data-timodal]'), b = e.target.closest('[data-tieletr]'); if (!a && !b) return; e.preventDefault(); e.stopPropagation();
  if (a) { const o = S.recs.get(a.dataset.timodal); if (o) tiModal(o); return; }
  if (!precisa(false)) return; const [id, s] = b.dataset.tieletr.split('|'), o = S.recs.get(id); if (!o) return; o.eletr = s === '1'; await saveRec(o); render(); }, true);
/* "→ TI" nas corretivas em andamento */
{ const st = document.createElement('style'); st.textContent = `.ti-c{border-left:5px solid #E3A008}.ti-c.ok{border-left-color:#188038}.ti-c.ti{border-left-color:#1967D2}`; document.head.appendChild(st); }
