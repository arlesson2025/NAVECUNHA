'use strict';
/* ===== Tema “Vidro azul” · ajuste automático das telas (SMF 3.66, 29/10/2026) =====
   O CSS de css/tema-vidro.css cobre o desenho comum (cartões, menu, tabelas, botões, campos).
   As telas têm ~130 caixas com fundo branco próprio e textos em cinza-escuro escritos em cada bloco;
   em vez de repetir uma regra para cada uma, este bloco olha a tela já desenhada (só com o tema ligado):
   · caixa grande de fundo claro → classe tv-p (vira vidro);
   · texto cinza-escuro em cima do vidro → tv-t (branco) ou tv-m (cinza claro, se era texto secundário);
   · texto colorido escuro em cima do vidro → tv-r / tv-a / tv-g / tv-b (a mesma cor, mais clara);
   · texto de gráfico em SVG → tv-st.
   Pílulas e selos pequenos de fundo claro ficam como estão (texto escuro sobre fundo claro já se lê).
   Com o tema desligado as classes não fazem nada (todas as regras pedem html.tv). */
const TV_IGNORA = 'input,select,textarea,option,img,canvas,video,iframe,br,hr,script,style';
function tvCor(s) {
  const m = s && s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
}
const tvLum = c => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
function tvClasseCor(c) {   // texto escuro: cinza vira branco; colorido vira a mesma cor mais clara
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
  if (mx - mn < 45) return tvLum(c) > 0.33 ? 'tv-m' : 'tv-t';
  if (c.r === mx && c.g < c.r * 0.55) return 'tv-r';
  if (c.r === mx) return 'tv-a';
  if (c.g === mx) return 'tv-g';
  return 'tv-b';
}
function tvFundoClaro(el) {   // o fundo efetivo por trás do elemento é claro e opaco (pílula, selo, caixa que ficou clara)?
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (e.classList.contains('tv-p')) return false;
    const c = tvCor(getComputedStyle(e).backgroundColor);
    if (c && c.a > 0.5) return tvLum(c) > 0.6;
    if (e.id === 'main' || e.classList.contains('modal')) return false;
  }
  return false;
}
function tvAjusta() {
  if (!document.documentElement.classList.contains('tv')) return;
  const raizes = [document.getElementById('main'), ...document.querySelectorAll('.modal')].filter(Boolean);
  for (const raiz of raizes) {
    const els = raiz.querySelectorAll('*');
    for (const el of els) {   // 1) caixas claras grandes viram vidro
      if (el.matches(TV_IGNORA) || el.closest('svg')) continue;
      const c = tvCor(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.8 && tvLum(c) > 0.86 && el.offsetWidth > 110 && el.offsetHeight > 30 && !el.matches('button,a')) el.classList.add('tv-p');
    }
    for (const el of els) {   // 2) texto escuro fora de fundo claro
      if (el.matches(TV_IGNORA)) continue;
      if (el.closest('svg')) {
        if (el.tagName === 'text' || el.tagName === 'tspan') {
          const f = tvCor(getComputedStyle(el).fill);
          if (f && tvLum(f) < 0.45 && Math.max(f.r, f.g, f.b) - Math.min(f.r, f.g, f.b) < 45 && !tvFundoClaro(el.closest('svg'))) el.classList.add('tv-st');
        }
        continue;
      }
      if (!Array.prototype.some.call(el.childNodes, n => n.nodeType === 3 && n.textContent.trim())) continue;
      const c = tvCor(getComputedStyle(el).color);
      if (!c || tvLum(c) > 0.5) continue;
      if (tvFundoClaro(el)) continue;
      el.classList.add(tvClasseCor(c));
    }
  }
}
{ let pend = 0;
  const agenda = () => { if (pend || !document.documentElement.classList.contains('tv')) return; pend = requestAnimationFrame(() => { pend = 0; tvAjusta(); }); };
  new MutationObserver(agenda).observe(document.body, { childList: true, subtree: true });
  agenda();
}
