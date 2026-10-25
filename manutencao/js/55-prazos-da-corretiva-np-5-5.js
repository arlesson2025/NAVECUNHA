/* ===== Prazos da corretiva (NP 5.5.1) e eficácia no "O que precisa de você agora" =====
   Prazo de início da OM conta da ABERTURA (NP 5.5.1; o mesmo critério do Backlog, omAtrasada): Crítica imediato · Alta 4 h · Média 48 h · Baixa 15 dias (CLASSES).
   Falha ainda sem OM conta da detecção (critério interno: a OM não pode esconder a demora em ser aberta).
   Corretiva ainda "aberta" depois do prazo = P1. Falha sem OM (NO, NOK, avaria) além do prazo da classe = "prazo estourado".
   Verificação de eficácia (90 dias, Crítica e Alta) vencida = P2. */
'use strict';
const prazoDe = (classe, desde) => { const c = CLASSES[classe]; if (!c || !desde) return null; const t = typeof desde === 'number' ? desde : +new Date(String(desde).length > 10 ? desde : desde + 'T12:00'); return isNaN(t) ? null : t + c.h * 3600e3; };
const atrasoTx = ms => { const h = ms / 3600e3; return h < 48 ? Math.round(h) + ' h' : Math.round(h / 24) + ' d'; };
