'use strict';
/* ===== Tema “Gelo” · caixas brancas viram vidro (SMF 3.69, 29/10/2026) =====
   O CSS de css/tema-vidro.css cobre o desenho comum (cartões, menu, botões, campos). As telas têm
   ~130 caixas com fundo branco próprio; em vez de uma regra para cada uma, este bloco olha a tela
   já desenhada (só com o tema ligado) e marca a caixa grande de fundo claro com tv-p (vidro claro).
   Os textos não mudam (o fundo continua claro). Com o tema desligado a classe não faz nada. */

function tvCor(s) {
  const m = s && s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
}
function tvAjusta() {
  if (!document.documentElement.classList.contains('tv')) return;
  for (const raiz of [document.getElementById('main'), ...document.querySelectorAll('.modal')]) {
    if (!raiz) continue;
    for (const el of raiz.querySelectorAll('div,section,table,ul,li,details,summary,article,aside,header,footer')) {
      if (el.classList.contains('tv-p') || el.closest('svg,.at-sl')) continue;   // slides da apresentação (4.4) ficam como impressos
      const c = tvCor(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.85 && c.r > 236 && c.g > 236 && c.b > 236 && el.offsetWidth > 110 && el.offsetHeight > 30) el.classList.add('tv-p');
    }
  }
}
{ let pend = 0;
  const agenda = () => { if (pend || !document.documentElement.classList.contains('tv')) return; pend = requestAnimationFrame(() => { pend = 0; tvAjusta(); }); };
  new MutationObserver(agenda).observe(document.body, { childList: true, subtree: true });
  agenda();
}
