# Teste dos formulários salvos pelo SMF (SMF 3.144): o FR 049_B gera o PDF (empurrador e balsa) e, na balsa, dá baixa no plano e lança o horímetro
# do motor-bomba; o FR 027_A gera o PDF, grava as não conformidades da manutenção como falha da balsa e as da operação sem falha.
# Em 02/11/2026 o PDF do FR 049_B falhava em todo salvamento (linha de .5pt em gradiente virava padrão de 0 px no html2canvas).
# Uso: python testes/formularios.py
from playwright.async_api import async_playwright
from _base import abrir, resultado, rodar

PDF49 = """async vid => { await lubAbrirForm(vid); await new Promise(r => setTimeout(r, 2500)); const w = document.querySelector('#lubFO iframe').contentWindow;
  let r = ''; try { const o = await lubMakePdf(w); r = 'ok ' + o.pages.length; } catch (e) { r = 'ERRO ' + e.message.slice(0, 120); } lubFecharOverlay('lubFO'); return r; }"""
SALVA49 = """async () => { await lubAbrirForm('bal4'); await new Promise(r => setTimeout(r, 2500)); const w = document.querySelector('#lubFO iframe').contentWindow, d = w.document;
  d.getElementById('om').value = '55501'; d.getElementById('dt').value = isoD(hoje()); const m = d.querySelector('tr[data-eq="9"]'); m.querySelector('input[name="st-9"][value="T"]').click();
  ['oleo', 'comb'].forEach(v => { const c = m.querySelector(`input[name="flt-9"][value="${v}"]`); if (!c.checked) c.click(); }); m.querySelector('.hr').value = String(balHor('bal4').h + 100);
  d.querySelector('tr[data-eq="10"] input[name="st-10"][value="T"]').click(); window.confirm = () => true; let err = ''; try { await lubSalvarForm(w.collect(), w); } catch (e) { err = String(e.message || e).slice(0, 120); }
  const R = recs('lub').find(r => r.om === '55501'); return { err, vessel: R && R.vessel, itens: recs('base').filter(b => R && b.fr049 === R.id).map(b => b.item).sort(), hor: recs('hor').some(h => R && h.fr049 === R.id) }; }"""
SALVA27 = """async () => { await f27aAbrir('bal4'); await new Promise(r => setTimeout(r, 2500)); const w = document.querySelector('#f27aFO iframe').contentWindow, d = w.document;
  d.querySelector('input[name=mov][value=chegada]').click(); for (let n = 1; n <= 70; n++) d.querySelector(`input[name="a-${n}"][value="${n === 16 || n === 49 ? 'N' : n === 8 || n === 9 ? 'N' : 'S'}"]`).click();
  [...d.querySelectorAll('table.nc tbody tr[data-k]')].forEach((tr, i) => { tr.querySelector('.ncd').value = 't' + i; tr.querySelector('.ncc').value = 'Alta'; tr.querySelector('.ncm').selectedIndex = 1; tr.querySelector('.ncx').value = i ? 'man' : 'op'; });
  d.querySelectorAll('#sec-ass .sgg > div').forEach(x => { x.querySelector('input').value = 'Nome'; x.querySelector('i').innerHTML = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">'; });
  window.confirm = () => true; let al = ''; window.alert = m => { al = m; }; await f27aSalvar(w, document.getElementById('f27aFO'));
  const R = recs('fr027a').pop(); return { al, nc: R ? R.nc.map(x => x.dst) : null, falhas: recs('avaria').filter(a => R && a.fr027a === R.id).length }; }"""


async def main():
    async with async_playwright() as p:
        b, ctx, pg, E = await abrir(p)
        await pg.evaluate("() => { const s0 = saveRec; saveRec = async (r, o) => { r.updatedAt = Date.now(); S.recs.set(r.id, r); }; S.url = null; }")
        ok = []
        v = await pg.evaluate("S.cfg.frota[0].id")
        r = await pg.evaluate(PDF49, v); ok.append(resultado('FR 049_B gera o PDF · empurrador', r.startswith('ok'), r))
        r = await pg.evaluate(PDF49, 'bal4'); ok.append(resultado('FR 049_B gera o PDF · balsa', r.startswith('ok'), r))
        s = await pg.evaluate(SALVA49)
        ok.append(resultado('FR 049_B da balsa salvo ligado à balsa', not s['err'] and s['vessel'] == 'bal4', s['err'] or str(s['vessel'])))
        ok.append(resultado('baixa no plano: óleo do motor 6.10 TCA (B2.1) e mancais da bomba (B1.2)', s['itens'] == ['B1.2', 'B2.1'], ', '.join(s['itens'])))
        ok.append(resultado('horímetro do motor-bomba lançado', s['hor']))
        s = await pg.evaluate(SALVA27)
        ok.append(resultado('FR 027_A salvo com destino operação e manutenção', not s['al'] and s['nc'] == ['op', 'man'], s['al'][:120] or str(s['nc'])))
        ok.append(resultado('só a não conformidade da manutenção vira falha', s['falhas'] == 1, str(s['falhas'])))
        ok.append(resultado('sem erro de JavaScript', not E, '; '.join(E)[:300]))
        await b.close()
        return all(ok)

rodar(main())
