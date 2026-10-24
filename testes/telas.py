"""Teste das telas do SMF: compara o HTML de cada tela desta pasta com o da versão publicada (branch main).

Uso (na raiz do repositório):
    python testes/telas.py            # compara com origin/main
    python testes/telas.py --ref HEAD # compara com outro commit

Precisa de Python com playwright e o Chromium do playwright instalados.
As duas versões abrem com a mesma data e o mesmo sorteio (dados de exemplo iguais), logadas como Supervisor, em modo local.
Para cada tela grava o HTML normalizado em testes/saida/<ref|atual>/ e mostra IGUAL ou DIFERENTE.
Uma tela DIFERENTE numa limpeza de código quer dizer que a limpeza mudou o que o usuário vê: desfaça ou explique.
"""
import argparse, asyncio, datetime, difflib, functools, http.server, os, re, shutil, subprocess, sys, tempfile, threading
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'testes', 'saida')
DATA = datetime.datetime(2026, 10, 24, 10, 0, 0)
TELAS = ['rotina', 'barco/v1', 'emitir', 'emitir/v3', 'oms', 'acomp', 'omconf', 'falhas', 'falhas2', 'cxr', 'crono', 'audit', 'matriz', 'critic',
         'controle', 'horfrota', 'hor', 'oleo', 'anoleo', 'parmcp', 'compr', 'kpi', 'regs', 'bib', 'pecas', 'terc', 'trein', 'lubcons', 'admin']
INICIO = """
(() => { let s = 20261024; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  try { sessionStorage.setItem('sgmf_ok', '1'); localStorage.clear(); } catch (e) {} })();
"""
NORMALIZA = [(re.compile(r'\b(om|r|hor|lub|ap|cmp|base|fr27|situ|saida|param)-[a-z0-9]{6,9}-[a-z0-9]{5}\b'), r'\1-ID'),
             (re.compile(r'\d{1,2}:\d{2}(:\d{2})?'), 'HH:MM'),
             (re.compile(r'Modo local[^<]*'), 'Modo local…'), (re.compile(r'\d+ (aguardando envio|não enviados?)'), 'N \\1')]   # fila de envio muda com o tempo


def servir(pasta, porta):
    class Quieto(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quieto, directory=pasta)
    s = http.server.ThreadingHTTPServer(('127.0.0.1', porta), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


async def fotografar(b, url):
    ctx = await b.new_context(viewport={'width': 1366, 'height': 900})
    pg = await ctx.new_page()
    erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.clock.set_fixed_time(DATA)
    await pg.add_init_script(INICIO)
    await pg.route(re.compile(r'^https://(script|fonts)\.google'), lambda r: r.abort())
    await pg.goto(url + '/manutencao/?completo')
    await pg.wait_for_function('typeof S !== "undefined" && S.cfg && S.recs.size > 100', timeout=60000)
    # o SMF ainda grava registros de exemplo e de situação logo depois de abrir: espera o número de registros parar de mudar
    n0, iguais = -1, 0
    while iguais < 3:
        await pg.wait_for_timeout(1000)
        n = await pg.evaluate('S.recs.size')
        iguais = iguais + 1 if n == n0 else 0
        n0 = n
    await pg.evaluate("async () => { S.url = ''; S.session = { name: 'Teste', role: 'admin', token: null }; await kvSet('session', S.session); }")
    fotos = {}
    alvos = TELAS + await pg.evaluate("""() => { const P = oms().filter(o => o.tipo === 'P' && o.grupo).sort((a, b) => a.id < b.id ? -1 : 1)[0], C = oms().filter(o => o.tipo === 'C').sort((a, b) => a.id < b.id ? -1 : 1)[0];
      return [P ? 'omg/' + P.grupo : '', C ? 'om/' + C.id : ''].filter(Boolean); }""")
    for t in alvos:   # primeira volta só aquece (memórias e gravações em segundo plano); a foto é da segunda
        v, _, a = t.partition('/')
        await pg.evaluate("([v, a]) => { try { VIEW = v; ARG = a; render(); } catch (e) {} }", [v, a])
    await pg.wait_for_timeout(1500)
    for t in alvos:
        v, _, a = t.partition('/')
        html = await pg.evaluate("""async ([v, a]) => { if (v === 'emitir') { EM.sel.clear(); EM.draft = null; EM.vid = null; EM.pvVid = null; EM.pvIni = false; EM.passo = 1; }   // estado da tela de programação parte do zero
          try { history.replaceState(null, '', '#' + v + (a ? '/' + a : '')); VIEW = v; ARG = a; render(); await new Promise(r => setTimeout(r, 500)); VIEW = v; ARG = a; render(); } catch (e) { return 'ERRO: ' + e.message; }
          await new Promise(r => setTimeout(r, 500)); return document.getElementById('nav').innerHTML + '\\n=====\\n' + document.getElementById('main').innerHTML; }""", [v, a])
        fotos[t] = html
    # Programar preventiva nos passos 2 (o que entra) e 3 (abrir a OM)
    for nome, js in (('emitir/v3 passo 2', "EM.passo = 2; EM.draft = null;"), ('emitir/v3 passo 3', "EM.draft = { emb: true };")):
        fotos[nome] = await pg.evaluate("async () => { EM.sel.clear(); EM.draft = null; EM.vid = null; EM.pvVid = null; EM.pvIni = false; EM.passo = 1; VIEW = 'emitir'; ARG = 'v3'; render(); " + js + " render(); await new Promise(r => setTimeout(r, 400)); const h = document.getElementById('main').innerHTML; EM.draft = null; EM.passo = 1; return h; }")
    docs = await pg.evaluate("""() => { const out = {}; const P = oms().filter(o => o.tipo === 'P').sort((a, b) => a.id < b.id ? -1 : 1).slice(0, 3), C = oms().filter(o => o.tipo === 'C').sort((a, b) => a.id < b.id ? -1 : 1).slice(0, 3);
      P.forEach(o => { try { out['doc II-B ' + o.num] = docIIB(o).join('\\n'); } catch (e) { out['doc II-B ' + o.num] = 'ERRO: ' + e.message; } });
      C.forEach(o => { try { out['doc II-A ' + o.num] = docIIA(o).join('\\n'); } catch (e) { out['doc II-A ' + o.num] = 'ERRO: ' + e.message; } }); return out; }""")
    fotos.update(docs)
    # o que roda nos cliques: o código final de cada tela (VX), de cada conjunto de botões (AFTER) e das funções globais
    fotos['codigo final (VX e AFTER)'] = await pg.evaluate("() => Object.keys(VX).sort().map(k => 'VX.' + k + ' = ' + String(VX[k])).concat(Object.keys(AFTER).sort().map(k => 'AFTER.' + k + ' = ' + String(AFTER[k]))).join('\\n')")
    await pg.evaluate("async () => { S.session = { name: 'Operador', role: 'opr', token: null }; }")
    fotos['rotina (Operador)'] = await pg.evaluate("async () => { VIEW = 'rotina'; ARG = ''; render(); await new Promise(r => setTimeout(r, 400)); return document.getElementById('main').innerHTML; }")
    await ctx.close()
    return fotos, erros


def normal(h):
    for rx, sub in NORMALIZA:
        h = rx.sub(sub, h)
    return re.sub(r'>\s*<', '>\n<', h)


async def principal(ref):
    tmp = tempfile.mkdtemp(prefix='smf-ref-')
    try:
        subprocess.run(['git', '-C', RAIZ, 'worktree', 'add', '--detach', tmp, ref], check=True, capture_output=True)
        s1, s2 = servir(tmp, 8781), servir(RAIZ, 8782)
        async with async_playwright() as p:
            b = await p.chromium.launch()
            base, e1 = await fotografar(b, 'http://127.0.0.1:8781')
            atual, e2 = await fotografar(b, 'http://127.0.0.1:8782')
            await b.close()
        s1.shutdown(); s2.shutdown()
    finally:
        subprocess.run(['git', '-C', RAIZ, 'worktree', 'remove', '--force', tmp], capture_output=True)
        shutil.rmtree(tmp, ignore_errors=True)
    shutil.rmtree(SAIDA, ignore_errors=True)
    for nome, F in (('ref', base), ('atual', atual)):
        os.makedirs(os.path.join(SAIDA, nome), exist_ok=True)
        for t, h in F.items():
            open(os.path.join(SAIDA, nome, re.sub(r'[^\w.-]+', '_', t) + '.html'), 'w', encoding='utf8').write(normal(h))
    dif = 0
    for t in sorted(set(base) | set(atual)):
        a, b2 = normal(base.get(t, '(sem tela)')), normal(atual.get(t, '(sem tela)'))
        if a == b2:
            print(f'IGUAL      {t}')
        else:
            dif += 1
            linhas = [l for l in difflib.unified_diff(a.splitlines(), b2.splitlines(), lineterm='', n=0) if l[:1] in '+-' and l[:3] not in ('+++', '---')]
            print(f'DIFERENTE  {t}  ({len(linhas)} linhas)')
            for l in linhas[:6]:
                print('           ' + l[:160])
    print(f'\nErros de JavaScript: ref {len(e1)} · atual {len(e2)}')
    for e in e2[:5]:
        print('  atual: ' + e[:200])
    print(f'{dif} tela(s) diferente(s) de {len(set(base) | set(atual))}')
    return 1 if dif or e2 else 0


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref', default='origin/main')
    sys.exit(asyncio.run(principal(ap.parse_args().ref)))
