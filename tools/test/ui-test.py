# UI-тест (Playwright + Chrome): python3 tools/test/ui-test.py [uk|en]
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LANG = sys.argv[1] if len(sys.argv) > 1 else 'uk'
OUT = '/tmp/shots'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 1500, 'height': 880})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
        await pg.goto('file://' + ROOT + '/index.html')
        await pg.evaluate(f"localStorage.setItem('lora_lang','{LANG}')"); await pg.reload(); await pg.wait_for_timeout(800)
        await pg.evaluate("startMode='company';startDiff='hard';coSector='military';startSel='POL';startScreen()")
        await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/{LANG}_start.png')
        await pg.evaluate("coName='Wisła Arms';startGame()"); await pg.wait_for_timeout(1000)
        await pg.evaluate("closeModal()")
        print(await pg.evaluate("JSON.stringify({player:G.player,pc:G.pc,cash:G.myCo().cash,tab, diff:G.diff.id})"))
        await pg.evaluate("focusReg(G.myCo().offices[0].t)"); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{OUT}/{LANG}_company.png')
        r = await pg.evaluate("(()=>{const c=G.myCo();const i=c.offices[0].t;const ks=D.companySectors[c.sector].assets;for(const k of ks){const r=G.coBuild(c,i,k);if(r.ok)return k;}return 'none'})()")
        print('build', r)
        await pg.evaluate("setSpeed(4)"); await pg.wait_for_timeout(6000); await pg.evaluate("setSpeed(0);subtab.co='infl';renderTab(true)")
        await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/{LANG}_infl.png')
        print(await pg.evaluate("JSON.stringify({day:G.day,val:G.coValue(G.myCo()).toFixed(2),assets:G.myCo().assets.length,pend:G.myCo().pend.length})"))
        # примусове захоплення для перевірки переходу в режим держави
        await pg.evaluate("(()=>{const c=G.myCo();c.infl[c.home]=95;c.cash+=200;G.coTakeover(c,c.home)})()"); await pg.wait_for_timeout(700)
        await pg.evaluate("closeModal()"); await pg.wait_for_timeout(200)
        print(await pg.evaluate("JSON.stringify({player:G.player,tab,tabs:curTabs().map(x=>x[0])})"))
        await pg.screenshot(path=f'{OUT}/{LANG}_takeover.png')
        await pg.evaluate("tab='co';renderTabs();renderTab(true)"); await pg.wait_for_timeout(200)
        await pg.evaluate("saveGame()"); ok = await pg.evaluate("loadGame()"); print('load', ok, await pg.evaluate("G.pc"))
        await pg.evaluate("tab='build';renderTabs();renderTab(true)"); await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/{LANG}_build.png')
        left = await pg.evaluate("[...document.body.innerText.matchAll(/[а-яіїєґА-ЯІЇЄҐ][^\\n]{0,40}/g)].map(m=>m[0]).slice(0,40)")
        if LANG == 'en': print('UA leftovers:', left)
        print('\n'.join(errs[:20]))
        await b.close()
asyncio.run(main())
