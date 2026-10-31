# Teste de sincronização com um servidor simulado que responde como o Code.gs v15 (ping, login, push, list, foto, getFile, delete).
# Não fala com o servidor real. Confere: login, envio da fila, foto enviada sem a imagem (só a referência), foto no Drive e de volta,
# registro de outro aparelho chegando, exclusão do servidor aplicada e sessão vencida guardando o registro na fila.
# Uso: python testes/sincronizacao.py
import asyncio, io, json, re, time
from playwright.async_api import async_playwright
from _base import T, U, resultado, rodar

SRV = {'recs': {}, 'del': set(), 'fotos': {}, 'pushes': 0, 'tok': 'tok-teste'}


def resposta(body):
    a = body.get('action'); agora = int(time.time() * 1000)
    if a == 'ping': return {'ok': True, 'versao': 15}
    if a == 'login': return {'ok': True, 'token': SRV['tok'], 'role': 'admin', 'name': body.get('name')} if body.get('password') == 'senha-teste' else {'ok': False, 'error': 'senha'}
    if body.get('token') != SRV['tok']: return {'ok': False, 'error': 'auth'}
    if a == 'push':
        r = body['record']; SRV['pushes'] += 1; SRV['recs'][r['id']] = {'r': r, 'at': agora}
        return {'ok': True, **({'pdfFileId': 'pdf-' + r['id']} if body.get('pdfB64') else {})}
    if a == 'list':
        d = body.get('since', 0)
        return {'ok': True, 'records': [x['r'] for x in SRV['recs'].values() if x['at'] >= d], 'deleted': list(SRV['del']), 'now': agora, 'cfg': None, 'cfgAt': 0}
    if a == 'foto': fid = 'foto-%d' % (len(SRV['fotos']) + 1); SRV['fotos'][fid] = body['b64']; return {'ok': True, 'fileId': fid}
    if a == 'getFile': return {'ok': True, 'mime': 'image/jpeg', 'data': SRV['fotos'].get(body.get('fileId'), '')}
    if a == 'delete': SRV['del'].add(body.get('id')); return {'ok': True}
    return {'ok': False, 'error': 'acao'}


def foto_jpg():
    try:
        from PIL import Image
        b = io.BytesIO(); Image.new('RGB', (640, 480), (40, 90, 140)).save(b, 'JPEG', quality=85); return b.getvalue()
    except ImportError:
        return None


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context()
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
        ok = []
        ping = await pg.evaluate("async () => { S.url = 'https://script.google.com/macros/s/TESTE/exec'; S.pending.clear(); return (await api('ping')).ok; }")
        login = await pg.evaluate("async () => { const j = await api('login', { name: 'Supervisor', password: 'senha-teste' }); if (j.ok) S.session = { name: 'Supervisor', role: j.role, token: j.token }; return j.ok; }")
        ok.append(resultado('ping e login', ping and login))
        # grava uma leitura de horímetro e uma corretiva com foto pela tela 1.2
        await pg.evaluate("async () => { const v = S.cfg.frota[0]; const h = horAtual(v.id, mpos(v.id)); await lubHor(v.id, mpos(v.id), (h ? h.h : 1000) + 5, isoD(hoje()), 'teste'); }")
        await pg.evaluate("() => { location.hash = '#enxcor'; }"); await pg.wait_for_timeout(1500)
        await pg.evaluate("async () => { await syncNow(); clearTimeout(syncTimer); }"); await pg.wait_for_timeout(800)
        await pg.evaluate("""() => { const card = document.querySelector('[data-ecsalvar]').closest('.card');
          card.querySelectorAll('input,textarea,select').forEach(i => { if (i.type === 'file' || i.type === 'checkbox' || i.type === 'radio') return;
            if (i.tagName === 'SELECT') { const o = [...i.options].find(o => o.value); if (o && !i.value) i.value = o.value; return; }
            if (i.type === 'datetime-local') { i.value = i.id === 'ecL' ? '2026-10-20T15:00' : '2026-10-20T08:00'; return; }
            if (i.type === 'date') { i.value = '2026-10-20'; return; } if (i.id === 'ecO') { i.value = '88001'; return; }
            if (i.inputMode === 'numeric' || i.inputMode === 'decimal' || i.type === 'number') { i.value = '1000'; return; } if (!i.value) i.value = 'Teste de sincronização'; }); }""")
        jpg = foto_jpg()
        if jpg:
            for f in await pg.query_selector_all('input[type=file]'):
                await f.set_input_files({'name': 'foto.jpg', 'mimeType': 'image/jpeg', 'buffer': jpg})
        try:
            async with ctx.expect_page(timeout=8000) as pi: await pg.click('[data-ecsalvar]')
            await (await pi.value).close()
        except Exception: pass
        await pg.wait_for_timeout(1500)
        gravou = await pg.evaluate("() => { const o = oms().find(o => o.num === '88001'); return o ? (o.fotos || []).length : -1; }")
        ok.append(resultado('corretiva gravada no aparelho com fotos', gravou > 0, f'{gravou} foto(s)' if jpg else 'sem PIL para gerar a foto'))
        await pg.evaluate("async () => { await syncNow(); }"); await pg.wait_for_timeout(500)
        cor = [x['r'] for x in SRV['recs'].values() if x['r'].get('num') == '88001']
        ok.append(resultado('fila enviada ao servidor', bool(cor) and await pg.evaluate("() => S.pending.size") == 0, f"{SRV['pushes']} envio(s)"))
        ok.append(resultado('foto vai sem a imagem, só a referência', bool(cor) and all('src' not in f for f in cor[0].get('fotos', []))))
        await pg.evaluate("async () => { if (typeof fotosEnviar === 'function') { fotoSync = false; await fotosEnviar(); } await syncNow(); }"); await pg.wait_for_timeout(500)
        cor = [x['r'] for x in SRV['recs'].values() if x['r'].get('num') == '88001']
        ok.append(resultado('fotos no Drive e referência atualizada', len(SRV['fotos']) > 0 and bool(cor) and all(f.get('fid') for f in cor[0].get('fotos', []))))
        volta = await pg.evaluate("async () => { const o = oms().find(o => o.num === '88001'), f = o && o.fotos && o.fotos[0]; if (!f || !f.fid) return false; const j = await api('getFile', { fileId: f.fid }); return j.ok && j.data.length > 1000; }")
        ok.append(resultado('foto volta do Drive', volta))
        agora = int(time.time() * 1000) + 5000; vid = await pg.evaluate("() => S.cfg.frota[1].id")
        SRV['recs']['hor-outro-aparelho'] = {'r': {'id': 'hor-outro-aparelho', 'kind': 'hor', 'vessel': vid, 'pos': 'BB', 'h': 99999, 'date': '2026-10-23', 'by': 'outro aparelho', 'updatedAt': agora}, 'at': agora}
        SRV['del'].add('ex-demo-v1')
        await pg.evaluate("async () => { S.lastSync = 0; await syncNow(); }"); await pg.wait_for_timeout(500)
        ok.append(resultado('registro de outro aparelho chega', await pg.evaluate("() => !!S.recs.get('hor-outro-aparelho')")))
        ok.append(resultado('exclusão feita no servidor é aplicada', await pg.evaluate("() => !S.recs.has('ex-demo-v1')")))
        SRV['tok'] = 'outro'
        await pg.evaluate("async () => { await saveRec({ id: 'hor-teste-x', kind: 'hor', vessel: S.cfg.frota[0].id, pos: 'BB', h: 1, date: '2026-10-24' }); await syncNow(); }"); await pg.wait_for_timeout(500)
        ok.append(resultado('sessão vencida: sai da sessão e guarda o registro na fila', await pg.evaluate("() => S.session === null && S.pending.has('hor-teste-x')")))
        ok.append(resultado('sem erro de JavaScript', not E, '; '.join(E[:3])))
        await b.close()
        return all(ok)

rodar(main())
