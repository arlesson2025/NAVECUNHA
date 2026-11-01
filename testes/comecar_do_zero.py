# Teste do “Começar do zero” (SMF 3.118) com um servidor simulado como o Code.gs (push com excluido vai para “deleted”, setConfig guarda a frota).
# Confere: botão da Administração apaga tudo no aparelho e na planilha (inclusive o que só estava na planilha), baixa a cópia de segurança,
# tira o exemplo, aplica o marco com início em todos, o marco pega a primeira leitura lançada depois e outro aparelho limpa o exemplo sozinho.
# Uso: python testes/comecar_do_zero.py
import json, re, time
from playwright.async_api import async_playwright
from _base import T, U, resultado, rodar

SRV = {'recs': {}, 'del': set(), 'cfg': None, 'cfgAt': 0, 'tok': 'tok-teste'}
URL = 'https://script.google.com/macros/s/TESTE/exec'


def resposta(body):
    a = body.get('action'); agora = int(time.time() * 1000)
    if a == 'ping': return {'ok': True, 'versao': 15}
    if a == 'login': return {'ok': True, 'token': SRV['tok'], 'role': 'admin', 'name': body.get('name')}
    if body.get('token') != SRV['tok']: return {'ok': False, 'error': 'auth'}
    if a == 'push':
        r = body['record']; SRV['recs'][r['id']] = {'r': r, 'at': agora}
        if r.get('excluido'): SRV['del'].add(r['id'])
        return {'ok': True}
    if a == 'list':
        d = body.get('since', 0)
        return {'ok': True, 'records': [x['r'] for k, x in SRV['recs'].items() if x['at'] >= d and k not in SRV['del']], 'deleted': list(SRV['del']), 'now': agora, 'cfg': SRV['cfg'], 'cfgAt': SRV['cfgAt']}
    if a == 'setConfig': SRV['cfg'] = body['cfg']; SRV['cfgAt'] = agora; return {'ok': True, 'cfgAt': agora}
    if a == 'delete': SRV['del'].add(body.get('id')); return {'ok': True}
    return {'ok': True}


async def pagina(p):
    b = await p.chromium.launch(); ctx = await b.new_context(accept_downloads=True)
    await ctx.route(U + '/**', lambda r: T.entregar(r, T.RAIZ))

    async def gas(route):
        try: body = json.loads(route.request.post_data or '{}')
        except Exception: body = {}
        await route.fulfill(status=200, content_type='application/json', body=json.dumps(resposta(body)))
    await ctx.route(re.compile(r'^https://script\.google\.com/'), gas)
    await ctx.route(re.compile(r'^https://(?!script\.google\.com)'), lambda r: r.abort())
    pg = await ctx.new_page(); E = []; pg.on('pageerror', lambda e: E.append(str(e)[:200]))
    await pg.clock.set_fixed_time(T.DATA); await pg.add_init_script(T.INICIO)
    await pg.goto(U + '/manutencao/'); await pg.wait_for_function('typeof S !== "undefined" && S.pronto', timeout=120000)
    await pg.wait_for_function('S.recs.has("ex-demo-v1")', timeout=90000); await pg.wait_for_timeout(1500)
    await pg.evaluate("async u => { S.url = u; S.pending.clear(); const j = await api('login', { name: 'Supervisor', password: 'x' }); S.session = { name: 'Supervisor', role: j.role, token: j.token }; }", URL)
    return b, pg, E


async def main():
    async with async_playwright() as p:
        ok = []
        b, pg, E = await pagina(p)
        # registros “reais” de teste: uma leitura e um serviço; e um que só está na planilha (de outro aparelho)
        await pg.evaluate("""async () => { const v = S.cfg.frota[0], p = mpos(v.id), h = horAtual(v.id, p);
          await lubHor(v.id, p, (h ? h.h : 1000) + 5, isoD(hoje()), 'teste');
          await saveRec({ id: 'base-teste', kind: 'base', vessel: v.id, pos: p, item: '1.1.1', h: 1000, date: isoD(hoje()), om: '90001', quem: 'teste' }); await syncNow(); }""")
        agora = int(time.time() * 1000)
        SRV['recs']['hor-so-na-planilha'] = {'r': {'id': 'hor-so-na-planilha', 'kind': 'hor', 'vessel': 'v2', 'pos': 'BB', 'h': 500, 'date': '2026-10-20', 'updatedAt': agora}, 'at': agora}
        reais = await pg.evaluate("() => [...S.recs.values()].filter(r => !r.seed && !r.excluido).length")
        await pg.evaluate("() => { location.hash = '#admin'; render(); }"); await pg.wait_for_timeout(800)
        tem_card = await pg.evaluate("() => !!document.querySelector('#cardZero #zeB')")
        ok.append(resultado('cartão “Começar do zero” na Administração', tem_card))
        # sem digitar a confirmação não apaga
        await pg.click('#zeB'); await pg.wait_for_timeout(300)
        ok.append(resultado('sem digitar COMEÇAR DO ZERO não abre a confirmação', not await pg.evaluate("() => !!document.querySelector('#cfOk')")))
        await pg.fill('#zeT', 'começar do zero'); await pg.click('#zeB'); await pg.wait_for_timeout(300)
        async with pg.expect_download(timeout=30000) as dl:
            await pg.click('#cfOk')
        nome = (await dl.value).suggested_filename
        ok.append(resultado('cópia de segurança baixada antes de apagar', nome.startswith('SMF_copia_antes_do_inicio_'), nome))
        await pg.wait_for_function("() => S.cfg.frota.some(v => v.marco && v.marco.inicio)", timeout=60000)
        for _ in range(30):
            if await pg.evaluate("async () => { await syncNow(); return S.pending.size; }") == 0: break
            await pg.wait_for_timeout(500)
        sobra = await pg.evaluate("() => [...S.recs.values()].filter(r => !r.excluido).length")
        ok.append(resultado('aparelho vazio (sem exemplo e sem registros)', sobra == 0 and not await pg.evaluate("() => temExemplo()"), f'{reais} registros reais apagados; sobraram {sobra}'))
        ok.append(resultado('tudo marcado como excluído na planilha (inclusive o que só estava nela)', 'hor-so-na-planilha' in SRV['del'] and 'base-teste' in SRV['del'] and all(k in SRV['del'] for k in SRV['recs'])))
        F = (SRV['cfg'] or {}).get('frota') or []
        ok.append(resultado('marco zero com início em todos os empurradores em operação, na planilha', bool(F) and all((v.get('marco') or {}).get('inicio') and v['marco']['date'] == T.DATA.strftime('%Y-%m-%d') for v in F if not (v.get('foraOp') or {}).get('motivo'))))
        ok.append(resultado('sem o botão de carregar exemplo depois do início', not await pg.evaluate("() => { render(); return !!document.querySelector('[data-act=carregarEx]'); }")))
        # leitura lançada depois do marco vira o horímetro do marco
        res = await pg.evaluate("""async () => { const v = S.cfg.frota[0], p = mpos(v.id), a = marcoHor(v, p);
          await lubHor(v.id, p, 4321, isoD(hoje()), 'teste'); const b = marcoHor(v, p), u = ultimoServico(v.id, p, '1.1.1');
          return [a, b && b.h, u && u.h, u && u.src]; }""")
        ok.append(resultado('motor sem leitura: marco aguarda e pega a primeira leitura lançada', res[0] is None and res[1] == 4321 and res[2] == 4321 and res[3] == 'marco', str(res)))
        # todas as telas em uso abrem com o SMF vazio
        for t in T.TELAS + ['admin']:
            await pg.evaluate("t => { location.hash = '#' + t; render(); }", t); await pg.wait_for_timeout(250)
        ok.append(resultado('sem erro de JavaScript (aparelho 1)', not E, '; '.join(E[:3])))
        await b.close()
        # outro aparelho, ainda com exemplo: recebe o início e limpa sozinho
        b2, pg2, E2 = await pagina(p)
        await pg2.evaluate("async () => { S.lastSync = 0; await syncNow(); }")
        try:
            await pg2.wait_for_function("() => !temExemplo()", timeout=40000); limpo = True
        except Exception: limpo = False
        ok.append(resultado('outro aparelho limpa o exemplo ao receber o início', limpo and await pg2.evaluate("() => !!zeroInicio() && [...S.recs.values()].filter(r => !r.excluido && r.kind !== 'snap').length === 1")))
        ok.append(resultado('sem erro de JavaScript (aparelho 2)', not E2, '; '.join(E2[:3])))
        await b2.close()
        return all(ok)

rodar(main())
