/* ===== Padrão das telas também na Frota e nas telas que estavam fixas (pedido do Supervisor, 22/10/2026: "essa aqui tá no meio, não tá como as outras no lado esquerdo e podendo mover as janelas") =====
   Painel da frota em janelas livres (Resumo · Como está a frota · O que fazer agora; as posições antigas da Frota são zeradas uma vez) e padTela nas telas da Biblioteca e no registro de horímetros. */
'use strict';
try { if (!localStorage.getItem('smf_painel_v1')) { JLAY('smf_frota_lay').S({}); localStorage.setItem('smf_painel_v1', '1'); } } catch (e) { }
padTela('bib', { titulo: 'Biblioteca · Documentos', desc: 'NP, formulários, normas e fluxos' });
padTela('pecas', { titulo: 'Peças e estoque mínimo', desc: 'Kits do mês seguinte e peças críticas do Anexo III' });
padTela('terc', { titulo: 'Prestadores de serviço', desc: 'Cadastro de terceiros e validade dos documentos' });
padTela('trein', { titulo: 'Treinamento', desc: 'Situação por colaborador e reciclagem anual' });
padTela('lubcons', { titulo: 'Óleo e resíduos', desc: 'Consumo de lubrificantes e geração de OLUC' });
padTela('hor', { titulo: 'Registro de horímetros', desc: 'Lançamentos de horímetro por empurrador e motor' });
