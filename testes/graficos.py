# Inventário dos gráficos: abre cada tela em uso e confere que todo gráfico da lista testes/graficos.txt continua lá.
# Nasceu da limpeza da 3.95, que levou junto o gráfico histórico da docagem sem ninguém perceber (Supervisor, 01/11/2026).
# Gráfico = desenho (svg ou canvas) com mais de 120 × 60 px, ou 5 ou mais barras/marcas desenhadas em % (gráficos em HTML,
# como o da docagem), dentro de um quadro (.card) com título.
# Uso: python testes/graficos.py            confere (falha se algum gráfico da lista sumiu; avisa os novos)
#      python testes/graficos.py --gravar   regrava a lista com o que existe hoje (só depois do Supervisor aprovar a retirada)
import os, re, sys
from playwright.async_api import async_playwright
from _base import abrir, resultado, rodar, AQUI

LISTA = os.path.join(AQUI, 'graficos.txt')
GRAVAR = '--gravar' in sys.argv

COLETA = r"""() => { const out = [];
  document.querySelectorAll('#main .card').forEach(c => {
    const h = c.querySelector('h2'); if (!h) return;
    const tem = [...c.querySelectorAll('svg, canvas')].some(g => { const r = g.getBoundingClientRect(); return r.width > 120 && r.height > 60; });
    const barras = [...c.querySelectorAll('[style*="%"]')].filter(e => /(^|;)\s*(width|left|height)\s*:\s*[\d.]+%/.test(e.getAttribute('style'))).length;
    if (!tem && barras < 5) return;
    const pt = h.textContent.split(' · '); let t = (pt[0].trim().length <= 2 && pt[1] ? pt[0] + ' · ' + pt[1] : pt[0]).replace(/\d[\d.,]*/g, '').replace(/\s+/g, ' ').trim();
    if (t) out.push(t); });
  return [...new Set(out)]; }"""


async def main():
    async with async_playwright() as p:
        b, ctx, pg, E = await abrir(p)
        vid = await pg.evaluate("() => S.cfg.frota[0].id")
        emp = await pg.evaluate("() => ENX_OK.slice()")
        bal = await pg.evaluate("() => BAL_VIEWS.map(v => v[0])")
        bid = await pg.evaluate("() => BALSAS[0].id")
        telas = [(v, 'emp') for v in emp] + [(v + '/' + vid, 'emp') for v in ['enx', 'enxcr', 'enxhor', 'enxeq']]
        telas += [(v, 'bal') for v in bal] + [('balft/' + bid, 'bal')]
        achados = set()
        espera_bal = True
        for h, tipo in telas:
            await pg.evaluate("async ([h, t]) => { FROTA_TIPO = t; location.hash = '#' + h; await new Promise(r => setTimeout(r, 700)); }", [h, tipo])
            if tipo == 'bal' and espera_bal:   # o exemplo das balsas é gerado na primeira visita à frota de balsas
                espera_bal = False
                await pg.wait_for_function('S.recs.has("ex-bal-v5")', timeout=90000)
                await pg.evaluate("async () => { render(); await new Promise(r => setTimeout(r, 700)); }")
            v = h.split('/')[0] + ('/…' if '/' in h else '')
            for t in await pg.evaluate(COLETA):
                achados.add(f'{v} | {t}')
        await b.close()

    if GRAVAR:
        with open(LISTA, 'w', encoding='utf-8', newline='\n') as f:
            f.write('# Gráficos que precisam continuar no SMF (tela | título do quadro). Gerado por: python testes/graficos.py --gravar\n')
            f.write('# Tirar uma linha daqui = retirar o gráfico de propósito; só com aprovação do Supervisor e registro em VERSOES.\n')
            f.write('\n'.join(sorted(achados)) + '\n')
        return resultado('inventário dos gráficos gravado', True, f'{len(achados)} gráfico(s) em {LISTA}')

    if not os.path.exists(LISTA):
        return resultado('inventário dos gráficos', False, 'falta testes/graficos.txt: rode com --gravar')
    base = {l.strip() for l in open(LISTA, encoding='utf-8') if l.strip() and not l.startswith('#')}
    sumiram, novos = sorted(base - achados), sorted(achados - base)
    for s in sumiram:
        print('   sumiu:', s)
    for s in novos:
        print('   novo (rode --gravar para incluir):', s)
    return resultado('inventário dos gráficos', not sumiram, f'{len(base & achados)} de {len(base)} na lista' + (f', {len(sumiram)} SUMIRAM' if sumiram else '') + (f', {len(novos)} novo(s)' if novos else ''))

rodar(main())
