"""End-to-end Squishem plushies and limited-time worlds in Chromium."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True)
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto("http://127.0.0.1:8765/iphone",wait_until="domcontentloaded")
    page.locator("#cc-sq-collection").wait_for(state="attached",timeout=15000)
    for url in ("/squishems.js","/squishem-art.js","/squishem-places.js"):
        assert page.request.get("http://127.0.0.1:8765"+url).status==200
    assert page.evaluate("window.catCitySquishems.catalog.length")==10
    assert page.locator('#cc-sq-open').count()==1
    for event_name in ('galaxy_gala','ghost_2_0','pumpkin_cutie'):
        assert page.locator('#cc-admin-event option[value="'+event_name+'"]' ).count()==1,event_name
        assert page.locator('#cc-poll-one option[value="'+event_name+'"]' ).count()==1,event_name
    assert page.evaluate("window.catCitySquishemPlaces.portals().length")==0
    page.evaluate("window.__catCityEngine.state.tutorialCompleted=true")
    page.locator("#start-play").click()
    page.wait_for_function("!document.querySelector('#catcity-start-menu').classList.contains('show')")

    assert page.locator("#cc-sq-open").is_visible()
    page.locator("#cc-sq-open").click()
    # Opening through the real in-game button is the primary discovery path.
    assert page.locator("#cc-sq-collection.open").count()==1
    assert page.locator("#cc-sq-grid canvas").count()==10
    opaque=page.evaluate("""() => {
      const c=document.createElement('canvas');c.width=130;c.height=150;
      const g=c.getContext('2d');window.catCitySquishemArt.draw(g,'skyler',64,130,1.5);
      return Array.from(g.getImageData(0,0,130,150).data)
        .filter((v,i)=>i%4===3&&v>0).length;
    }""")
    assert opaque>1200
    page.locator("#cc-sq-close").click()

    def event(name,seconds=120):
        page.evaluate("""([name,seconds])=>window.dispatchEvent(new CustomEvent('catcity:server',{
          detail:{type:'admin_event',event:{name,endsAt:Math.floor(Date.now()/1000)+seconds,luck:4}}
        }))""",[name,seconds])
        page.wait_for_timeout(150)

    def position(x,y):
        page.evaluate("""([x,y])=>{const c=window.__catCityEngine;c.state.x=x*c.T;c.state.y=y*c.T}""",[x,y])

    event("galaxy_gala")
    page.locator("#cc-sq-event.show").wait_for(timeout=4000)
    assert "🌌" in page.locator("#cc-sq-event").inner_text()
    # Only a small, stable minority (about 1 in 5) of event drops are enchanted.
    effects=page.evaluate("""()=>Array.from({length:60},(_,i)=>window.catCitySquishems.eventItemEffect({
      name:'Sword',id:'test'+i,type:'weapon',durability:90,maxDurability:90}).effects||[])""")
    enchanted=[e for e in effects if e]
    assert enchanted and all(e==["galaxy"] for e in enchanted)
    assert len(enchanted)<len(effects)/2
    position(26,24)
    page.evaluate("window.__catCityEngine.interact()")
    assert page.evaluate("window.catCitySquishems.owned('galaxy')")
    assert page.evaluate("window.catCitySquishems.luckMultiplier()")>1.2

    event("none",0)
    position(22,17)
    assert not page.evaluate("window.catCitySquishems.worldFinds().some(x=>x.id==='baby')")
    page.evaluate("""()=>window.dispatchEvent(new CustomEvent('catcity:server',{
      detail:{type:'admin_stage',stage:{active:true,id:'test-show'}}
    }))""")
    page.evaluate("window.__catCityEngine.interact()")
    assert page.evaluate("window.catCitySquishems.owned('baby')")
    page.evaluate("""()=>window.dispatchEvent(new CustomEvent('catcity:server',{
      detail:{type:'admin_stage',stage:{active:false,id:'test-show'}}
    }))""")

    for event_name,pos,id,kind in [
        ("ghost_2_0",(31,18),"skyler","ghost"),
        ("pumpkin_cutie",(32,26),"pumpkin","pumpkin")
    ]:
        event(event_name)
        position(*pos)
        assert page.evaluate("window.catCitySquishemPlaces.portals().length")>0
        page.evaluate("window.__catCityEngine.interact()")
        page.locator("#cc-sq-place.open").wait_for(timeout=5000)
        assert page.evaluate("window.catCitySquishemPlaces.kind")==kind
        target=(537,145) if kind=="ghost" else (535,173)
        page.evaluate("([x,y])=>window.catCitySquishemPlaces.testMove(x,y)",list(target))
        page.locator("#cc-sq-place-action").click()
        assert page.evaluate("(id)=>window.catCitySquishems.owned(id)",id)
        event("none",0)
        page.wait_for_function("!window.catCitySquishemPlaces.inside",timeout=5000)
        assert page.evaluate("window.catCitySquishemPlaces.portals().length")==0
        if kind=="pumpkin":
            plain=page.evaluate("""()=>window.catCitySquishems.eventItemEffect({
              name:'Plain Armour',type:'body',id:'plain'})""")
            assert "effects" not in plain

    assert not page.evaluate("window.catCitySquishems.owned('harley')")
    page.evaluate("""()=>{
      for(let i=0;i<300&&!window.catCitySquishems.owned('harley');i++)
        window.dispatchEvent(new CustomEvent('catcity:wrangler-camp-loot',{detail:{id:'camp-'+i+',2'}}))
    }""")
    assert page.evaluate("window.catCitySquishems.owned('harley')")
    page.evaluate("window.catCitySquishems.carry('harley')")
    assert page.evaluate("window.catCitySquishems.damageMultiplier()")>1.2
    page.locator("#cc-bag-button").click(force=True)
    page.locator("#cc-terraria-inventory.open").wait_for(timeout=3000)
    page.locator('#cc-ti-grid button[aria-label*="Harley Squishem"]').click()
    assert page.locator("#cc-ti-actions button").filter(has_text="Squish").count()>0
    assert page.locator("#cc-ti-actions button").filter(has_text="Trash").count()==0
    page.locator("#cc-ti-actions button").filter(has_text="🫧 Squish!").click()
    page.locator("#cc-ti-close").click()

    page.evaluate("window.__catCityEngine.persist()")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("window.catCitySquishems?.catalog?.length===10",timeout=10000)
    for name in ("galaxy","baby","skyler","pumpkin","harley"):
        assert page.evaluate("(name)=>window.catCitySquishems.owned(name)",name),name
    assert not errors,errors
    print("PASS: 10 Squishems, rare event sources, cave/hut expiry, plush sprites, inventory/squish, bonuses, save")
    browser.close()
