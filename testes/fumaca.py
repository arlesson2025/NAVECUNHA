"""Teste de fumaça do SMF (CLAUDE.md, "Antes de publicar").

Abre a versão desta pasta com os dados de exemplo, logado como Supervisor, e renderiza cada tela
(mais uma #omg/…, uma #om/… e a rotina do Operador), escutando `pageerror` e `unhandledrejection`.
Tem de dar zero erros. Precisa de playwright + Chromium, como o testes/telas.py.

    python testes/fumaca.py
"""
import asyncio, datetime, mimetypes, os, re, sys, urllib.parse
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'http://smf.test'
DATA = datetime.datetime(2026, 10, 24, 10, 0, 0)
TELAS = ['rotina', 'cxr', 'crono', 'audit', 'oms', 'emitir', 'oleo', 'anoleo', 'parmcp', 'compr', 'controle', 'kpi',
         'falhas', 'bib', 'terc', 'trein', 'pecas', 'matriz', 'admin', 'hor']
INICIO = """
(() => { let s = 20261024; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  try { sessionStorage.setItem('sgmf_ok', '1'); localStorage.clear(); } catch (e) {}
  addEventListener('unhandledrejection', e => { (window.__erros = window.__erros || []).push('promessa: ' + (e.reason && e.reason.message || e.reason)); }); })();
"""


async def entregar(rota):   # arquivos direto do disco, como no telas.py
    caminho = urllib.parse.unquote(urllib.parse.urlsplit(rota.request.url).path).lstrip('/')
    arq = os.path.join(RAIZ, *caminho.split('/'))
    if os.path.isdir(arq):
        arq = os.path.join(arq, 'index.html')
    if not os.path.isfile(arq):
        return await rota.fulfill(status=404, body='')
    tipo = mimetypes.guess_type(arq)[0] or 'application/octet-stream'
    await rota.fulfill(status=200, body=open(arq, 'rb').read(), headers={'Content-Type': tipo + ('; charset=utf-8' if tipo.startswith('text/') or tipo.endswith('javascript') else '')})


async def main():
    erros = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1366, 'height': 900})
        await ctx.route(URL + '/**', entregar)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: erros.append(f'[{atual}] {e}'))
        atual = 'carga'
        await pg.clock.set_fixed_time(DATA)
        await pg.add_init_script(INICIO)
        await pg.route(re.compile(r'^https://(script|fonts)\.google'), lambda r: r.abort())
        await pg.goto(URL + '/manutencao/?completo')
        await pg.wait_for_function('typeof S !== "undefined" && S.cfg && S.recs.size > 100', timeout=60000)
        await pg.wait_for_timeout(3000)
        await pg.evaluate("async () => { S.url = ''; S.session = { name: 'Teste', role: 'admin', token: null }; await kvSet('session', S.session); }")
        alvos = TELAS + await pg.evaluate("""() => { const P = oms().filter(o => o.tipo === 'P' && o.grupo)[0], C = oms().filter(o => o.tipo === 'C')[0];
          return [P ? 'omg/' + P.grupo : '', C ? 'om/' + C.id : ''].filter(Boolean); }""")
        for t in alvos:
            atual = t
            v, _, a = t.partition('/')
            r = await pg.evaluate("([v, a]) => { try { VIEW = v; ARG = a; render(); return ''; } catch (e) { return e.message; } }", [v, a])
            if r:
                erros.append(f'[{t}] {r}')
            await pg.wait_for_timeout(150)
        atual = 'rotina (Operador)'
        r = await pg.evaluate("() => { try { S.session = { name: 'Operador', role: 'opr', token: null }; VIEW = 'rotina'; ARG = ''; render(); return ''; } catch (e) { return e.message; } }")
        if r:
            erros.append(f'[{atual}] {r}')
        await pg.wait_for_timeout(500)
        erros += await pg.evaluate('window.__erros || []')
        await b.close()
    if erros:
        print('ERROS no teste de fumaça:')
        print('\n'.join(erros))
        sys.exit(1)
    print(f'OK · {len(alvos) + 1} telas abertas sem erro.')


asyncio.run(main())
