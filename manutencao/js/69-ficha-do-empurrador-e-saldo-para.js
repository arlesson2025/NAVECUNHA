/* ===== Ficha do empurrador e Saldo para a troca no padrão (pedido do Supervisor, 22/10/2026: "quando eu clicava no empurrador mostrava as horas de cada equipamento") =====
   Ficha (#barco/<id>): cabeçalho com o empurrador e a situação, Resumo, Equipamentos (horímetro, leitura, última/próxima troca e saldo em barra), Preventivas, OMs abertas e Histórico, em janelas livres (smf_barco_lay).
   O nome do empurrador na tela Frota abre a ficha. Saldo para a troca (Óleo da frota): barra só para a direita (atraso = barra vermelha cheia), texto "faltam / vence hoje / atrasado", sem os eixos. */
'use strict';



/* (Saldo para a troca: voltou o gráfico original a pedido do Supervisor) */
{ const st = document.createElement('style'); st.textContent = `


.fb-v{max-width:1180px}.fb-t td{padding:4px 8px}.fb-sep td{font-size:11px;color:#5F6368;text-transform:uppercase;letter-spacing:.3px;padding-top:12px!important;border-bottom:1px solid #E3E6EA}a.f2-nm{color:inherit;text-decoration:none;border-bottom:1px dotted #9AA0A6}a.f2-nm:hover{color:#1967D2;border-bottom-color:#1967D2}`; document.head.appendChild(st); }
