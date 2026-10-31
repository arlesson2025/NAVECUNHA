# Teste de fumaça: abre cada tela em uso (empurradores, balsas, links do menu e a tela do Operador) e falha com qualquer erro de JavaScript.
# Uso: python testes/fumaca.py
from playwright.async_api import async_playwright
from _base import abrir, resultado, rodar


async def main():
    async with async_playwright() as p:
        b, ctx, pg, E = await abrir(p)
        pg.on('console', lambda m: E.append('console: ' + m.text[:200]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        vid = await pg.evaluate("() => S.cfg.frota[0].id")
        emp = await pg.evaluate("() => ENX_OK.slice()")
        bal = await pg.evaluate("() => BAL_VIEWS.map(v => v[0])")
        ruins = []

        async def abre(h, tipo):
            n0 = len(E)
            r = await pg.evaluate("""async ([h, t]) => { FROTA_TIPO = t; location.hash = '#' + h; await new Promise(r => setTimeout(r, 450)); const m = document.querySelector('#main'); return [VIEW, m.innerHTML.length]; }""", [h, tipo])
            if r[0] != h.split('/')[0] or r[1] < 300 or len(E) > n0:
                ruins.append((h, r, E[n0:n0 + 3]))

        for v in emp:
            await abre(v, 'emp')
        for v in ['enx/' + vid, 'enxcr/' + vid, 'enxhor/' + vid]:
            await abre(v, 'emp')
        for v in bal:
            await abre(v, 'bal')
        await abre('balft/' + await pg.evaluate("() => BALSAS[0].id"), 'bal')
        await abre('enxbib', 'bal')
        await abre('admin', 'bal')
        await pg.evaluate("() => { FROTA_TIPO = 'emp'; location.hash = '#enxhoje'; }")
        await pg.wait_for_timeout(600)
        links = await pg.evaluate("() => [...document.querySelectorAll('#nav a[href^=\"#\"]')].map(a => a.getAttribute('href').slice(1))")
        for h in links:
            await abre(h, 'emp')
        await pg.evaluate("() => { S.session = { name: 'Operador', role: 'opr', token: null }; location.hash = '#rotina'; render(); }")
        await pg.wait_for_timeout(800)
        op = await pg.evaluate("() => VIEW === 'rotina' && document.querySelector('#main').innerHTML.length > 300")
        for r in ruins:
            print('  ', r)
        for e in E[:8]:
            print('  ', e)
        await b.close()
        return resultado('fumaça', not ruins and not E and op, f'{len(emp)} telas de empurrador, {len(bal)} de balsas, {len(links)} links do menu, Operador {"ok" if op else "com problema"}, {len(E)} erro(s)')

rodar(main())
