# Teste de cliques: em cada tela em uso clica em todos os botões (até 45 por tela), fecha o que abrir e falha com qualquer erro de JavaScript.
# Os cliques não gravam nada (saveRec só põe na memória). Também clica na tela do Operador.
# Uso: python testes/cliques.py
import asyncio
from playwright.async_api import async_playwright
from _base import abrir, resultado, rodar

CLIQUE = """async ([i, v, t]) => { const L = document.querySelectorAll('#main button, #main [data-ebib], #main a[data-enxv]'); const el = L[i]; if (!el || el.closest('[data-enxreset]') || /excluir|apagar|limpar|sair/i.test(el.textContent)) return;
  try { el.click(); } catch (e) { } await new Promise(r => setTimeout(r, 160));
  document.querySelectorAll('#modal [data-close], .form-overlay [data-fo="fechar"]').forEach(x => { try { x.click(); } catch (e) { } });
  if (typeof closeModal === 'function') try { closeModal(); } catch (e) { }
  document.querySelectorAll('.form-overlay, .at-ov').forEach(x => x.remove()); document.body.style.overflow = '';
  if (VIEW !== v.split('/')[0]) { FROTA_TIPO = t; location.hash = '#' + v; await new Promise(r => setTimeout(r, 300)); } }"""


async def clicar(pg, E, telas):
    total, por = 0, {}
    for v, t in telas:
        await pg.evaluate("async ([v, t]) => { FROTA_TIPO = t; location.hash = '#' + v; await new Promise(r => setTimeout(r, 400)); }", [v, t])
        n = await pg.evaluate("() => document.querySelectorAll('#main button, #main [data-ebib], #main a[data-enxv]').length")
        for i in range(min(n, 45)):
            e0 = len(E)
            await pg.evaluate(CLIQUE, [i, v, t])
            total += 1
            if len(E) > e0:
                por.setdefault(v, []).extend(E[e0:])
    return total, por


async def uma(p, papel, nome, telas_js):
    b, ctx, pg, E = await abrir(p, papel, nome, extra_init=';window.print=()=>{};')
    ctx.on('page', lambda np: (np.on('pageerror', lambda e: E.append('janela: ' + str(e)[:160])), asyncio.ensure_future(np.close())))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
    await pg.evaluate("() => { saveRec = async r => { S.recs.set(r.id, r); }; }")
    telas = await pg.evaluate(telas_js)
    total, por = await clicar(pg, E, telas)
    await b.close()
    return total, len(telas), por, E


async def main():
    async with async_playwright() as p:
        t1, n1, por1, E1 = await uma(p, 'admin', 'Supervisor', "() => ENX_OK.map(v => [v, 'emp']).concat(BAL_VIEWS.map(v => [v[0], 'bal']))")
        t2, n2, por2, E2 = await uma(p, 'opr', 'Operador', "() => [['rotina', 'emp']]")
        for v, L in list(por1.items()) + list(por2.items()):
            print('  ', v, '->', L[:3])
        return resultado('cliques', not E1 and not E2, f'Supervisor {t1} cliques em {n1} telas, Operador {t2} cliques, {len(E1) + len(E2)} erro(s)')

rodar(main())
