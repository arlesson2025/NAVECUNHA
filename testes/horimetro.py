# Teste da regra de horímetro possível (SMF 3.110): horPossivel recusa horímetro que não cabe entre as leituras do motor (24 h por dia),
# situacao marca o item como “horímetro inconsistente” nos dois sentidos, a lista de 1.1 Horímetros mostra o registro e o marco zero usa a
# leitura do dia do marco (não a mais recente de qualquer data).
# Uso: python testes/horimetro.py
from playwright.async_api import async_playwright
from _base import abrir, resultado, rodar

CASOS = """() => {
  const v = S.cfg.frota.find(v => !foraOp(v) && mcpPos(v).length), p = mcpPos(v)[0];
  const L = recs('hor').filter(r => r.vessel === v.id && r.pos === p && !r.est).sort((a, b) => a.date < b.date ? -1 : 1), r = L[L.length - 1], d12 = isoD(new Date(+pD(r.date) - 12 * 864e5));
  const c = (h, d) => horPossivel(v.id, p, h, d);
  return { v: v.id, p, item: '1.1.11', dl: r.date, hl: +r.h, d12,
    igual: c(+r.h, r.date), mais1000: c(+r.h + 1000, r.date), menor: c(+r.h - 5000, r.date), casoSupervisor: c(+r.h - 1571, d12), possivel12d: c(+((horEm(v.id, p, d12) || r).h) + 10, d12) };
}"""


async def main():
    async with async_playwright() as p:
        b, ctx, pg, E = await abrir(p)
        await pg.evaluate("() => { saveRec = async r => { S.recs.set(r.id, r); }; S.url = null; }")
        c = await pg.evaluate(CASOS)
        ok = []
        ok.append(resultado('leitura igual à última é aceita', c['igual'] == '', c['igual']))
        ok.append(resultado('1.000 h acima da leitura do mesmo dia é recusado', c['mais1000'] != '', c['mais1000'][:110]))
        ok.append(resultado('menor que a leitura anterior é recusado', c['menor'] != '', c['menor'][:110]))
        ok.append(resultado('1.571 h abaixo da leitura, 12 dias antes, é recusado', c['casoSupervisor'] != '', c['casoSupervisor'][:110]))
        ok.append(resultado('10 h acima da leitura de 12 dias antes é aceito', c['possivel12d'] == '', c['possivel12d']))
        # caso do Supervisor: serviço registrado com o horímetro de meses antes (1.571 h abaixo da leitura do mesmo dia): o item vira “horímetro inconsistente” e aparece na lista para corrigir
        s = await pg.evaluate("""c => { const id = 'teste-hor-inc'; S.recs.set(id, { id, kind: 'base', vessel: c.v, pos: c.p, item: c.item, h: c.hl - 1571, date: c.dl, by: 'teste' });
          const v = vessel(c.v), x = situacao(v, c.p, A1M[c.item]), lista = pcmHorInc().some(y => y.v.id === c.v && y.pos === c.p && y.t.id === c.item);
          return { inc: !!x.inc, txt: x.txt, lista, card: pcmHorIncCard().includes('Registros com horímetro inconsistente') }; }""", c)
        ok.append(resultado('serviço impossível vira “horímetro inconsistente”', s['inc'], s['txt'][:110]))
        ok.append(resultado('aparece na lista de 1.1 Horímetros para corrigir', s['lista'] and s['card']))
        # marco zero: horímetro do dia do marco; sem leitura até 30 dias antes, o motor fica sem horímetro e entra no aviso
        m = await pg.evaluate("""async c => { const v = vessel(c.v), m0 = v.marco; await aplicarMarco(c.dl, [c.v]); const h1 = (v.marco.h || {})[c.p];
          await aplicarMarco('2020-01-01', [c.v]); const h2 = (v.marco.h || {})[c.p], sem = MARCO_SEM.slice(); if (m0) v.marco = m0; else delete v.marco;
          return { h1, h2: h2 == null ? null : h2, sem: sem.length }; }""", c)
        ok.append(resultado('marco zero usa a leitura do dia do marco', m['h1'] == c['hl'], f"{m['h1']} h"))
        ok.append(resultado('marco zero sem leitura perto da data fica sem horímetro e avisa', m['h2'] is None and m['sem'] > 0))
        # a tela 1.1 abre com o cartão sem erro
        await pg.evaluate("() => { location.hash = '#enxhor'; }")
        await pg.wait_for_timeout(900)
        tela = await pg.evaluate("() => document.querySelector('#main').innerText.includes('Registros com horímetro inconsistente')")
        ok.append(resultado('1.1 Horímetros mostra o cartão', tela))
        ok.append(resultado('sem erro de JavaScript', not E, '; '.join(E[:3])))
        await b.close()
        return all(ok)

rodar(main())
