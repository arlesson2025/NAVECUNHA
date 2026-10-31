# Base comum dos testes de funcionamento (fumaça, cliques, sincronização, horímetro).
# Abre o SMF desta pasta direto do disco (sem servidor HTTP), com a mesma data e os mesmos dados de exemplo do telas.py.
import asyncio, importlib.util, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('telas', os.path.join(AQUI, 'telas.py'))
T = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(T)
U = 'http://127.0.0.1:8891'


async def abrir(p, papel='admin', nome='Supervisor', viewport=None, extra_init='', bloquear_https=True, data_fixa=True):
    """Abre o SMF logado com o papel pedido e espera os dados de exemplo. Devolve (navegador, contexto, página, erros)."""
    b = await p.chromium.launch()
    ctx = await b.new_context(viewport=viewport or {'width': 1366, 'height': 900})
    await ctx.route(U + '/**', lambda r: T.entregar(r, T.RAIZ))
    if bloquear_https:
        await ctx.route(re.compile(r'^https://'), lambda r: r.abort())
    pg = await ctx.new_page()
    E = []
    pg.on('pageerror', lambda e: E.append(str(e)[:220]))
    if data_fixa:
        await pg.clock.set_fixed_time(T.DATA)
    await pg.add_init_script(T.INICIO + extra_init)
    await pg.goto(U + '/manutencao/')
    await pg.wait_for_function('typeof S !== "undefined" && S.pronto', timeout=120000)
    await pg.evaluate("([r, n]) => { S.session = { name: n, role: r, token: null }; }", [papel, nome])
    await pg.wait_for_function('S.recs.has("ex-demo-v1")', timeout=90000)
    await pg.wait_for_timeout(1500)
    return b, ctx, pg, E


def resultado(nome, ok, detalhe=''):
    print(('OK     ' if ok else 'FALHOU ') + nome + (' · ' + detalhe if detalhe else ''))
    return ok


def rodar(coro):
    ok = asyncio.run(coro)
    sys.exit(0 if ok else 1)
