/* ===== Inspeção antes da saída · NP 5.3 (lacuna 1 do fluxo NP 055 × SMF, 22/10/2026) =====
   A NP 5.3 diz que a inspeção do CTF/MFM antes de ligar os motores é requisito obrigatório para liberar a saída. O registro de saída passa a pedir os 9 itens
   (feitos e registrados no Diário de Máquinas) e quem fez. Item não feito ou irregularidade: escrever o que houve (fica no registro de saída, insp53) e a situação passa a "com restrição" no aviso. */
'use strict';
const INSP53 = ['Drenar o filtro separador de diesel dos MCPs e MCAs', 'Drenar o tanque de serviço', 'Nível de óleo dos MCPs, MCAs e reversores', 'Nível do líquido de arrefecimento dos MCPs e MCAs', 'Ajuste das correias dos motores',
  'Caixa de bateria, manta de isolamento, cabos e bornes (limpos, apertados, com vaselina)', 'Abrir a válvula de resfriamento do bucim', 'Testar o alarme de nível do porão', 'Testar a parada de emergência em marcha lenta'];
{ const st = document.createElement('style'); st.textContent = `.i53{border:1px solid #C6DAFC;background:#F8FAFF;border-radius:8px;padding:10px 12px}.i53-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:4px 14px;margin-top:8px;font-size:13px}.i53-l label{display:flex;gap:6px;align-items:flex-start;font-weight:400}`; document.head.appendChild(st); }
