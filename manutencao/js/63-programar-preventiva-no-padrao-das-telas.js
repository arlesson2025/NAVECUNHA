/* ===== Programar preventiva no padrão das telas (aprovado em 22/10/2026) =====
   Só apresentação, por cima do vEmitir que vale: cabeçalho padrão + Reorganizar, janela "Resumo" (vencidos · do mês · embarcadas · adiantar?),
   todos os blocos em janelas livres (smf_prev_lay). Sai o campo de horas digitadas à mão (#emH): a rota define as horas da viagem. */
'use strict';
VX.emitir = vEmitir;
{ const st = document.createElement('style'); st.textContent = `#main .cm-v label:has(#emH){display:none}`; document.head.appendChild(st); }
