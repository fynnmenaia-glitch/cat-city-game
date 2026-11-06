"""Real iPhone-style touch-swipe tests for public rooms, Squishems and event scenery."""
import json
from playwright.sync_api import sync_playwright

URL="http://127.0.0.1:8765/iphone"
ROOMS=[{
  "code":f"CAT{i:03}","title":f"Cozy Adventure Server {i}",
  "players":i%3,"capacity":5,"crewRoom":False,"crewBots":[],
  "availableCats":[0,1,2,3,4,5]
} for i in range(1,15)]

def swipe_from(page,selector,distance=210):
    node=page.locator(selector).first
    box=node.bounding_box()
    assert box is not None,("No visible swipe target",selector)
    x=box["x"]+min(box["width"]*.45,130)
    y=box["y"]+box["height"]*.52
    # Use actual Chrome touch dispatch, not a synthetic wheel or scrollTop setter:
    # the previous bug only happened when the finger started on a child element.
    cd=page.context.new_cdp_session(page)
    cd.send("Input.dispatchTouchEvent",{
        "type":"touchStart","touchPoints":[{"x":x,"y":y,"id":1}]
    })
    for n in range(1,13):
        cd.send("Input.dispatchTouchEvent",{
            "type":"touchMove","touchPoints":[{"x":x,"y":y-distance*n/12,"id":1}]
        })
        page.wait_for_timeout(12)
    cd.send("Input.dispatchTouchEvent",{"type":"touchEnd","touchPoints":[]})
    page.wait_for_timeout(350)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,
                          has_touch=True,device_scale_factor=2)
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.route("**/public-rooms",lambda route:route.fulfill(
        status=200,content_type="application/json",body=json.dumps({
            "activeRooms":14,"maxRooms":16,"rooms":ROOMS
        })
    ))
    page.goto(URL,wait_until="domcontentloaded",timeout=30000)
    page.locator("#cc-sq-collection").wait_for(state="attached",timeout=15000)
    page.evaluate("window.__catCityEngine.state.tutorialCompleted=true")
    page.locator("#start-play").click()
    page.wait_for_function("!document.querySelector('#catcity-start-menu').classList.contains('show')")

    # Open public server browser via the real HUD, not a helper method.
    page.locator("#catcity-online-open").click(force=True)
    page.locator("#catcity-online-panel.open").wait_for(timeout=3000)
    page.locator("#online-tab-public").click()
    page.locator("#online-public-results .room-card").first.wait_for(timeout=5000)
    assert page.locator("#online-public-results .room-card").count()==len(ROOMS)
    geom=page.locator("#online-public-results").evaluate("""el=>({
       scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
       touch:getComputedStyle(el).touchAction
    })""")
    assert geom["scrollHeight"]>geom["clientHeight"]+150,geom
    assert "pan-y" in geom["touch"],geom
    touch=page.locator("#online-public-results .room-card small").first.evaluate(
        "el=>getComputedStyle(el).touchAction")
    assert "pan-y" in touch,("Text is blocking touch swipes",touch)
    swipe_from(page,"#online-public-results .room-card small",160)
    scrolled=page.locator("#online-public-results").evaluate("el=>el.scrollTop")
    assert scrolled>35,("Public server list still cannot swipe-scroll",scrolled,geom)
    page.locator("#online-close").click(force=True)

    # Squishems: the finger can begin on plush artwork or item text.
    page.locator("#cc-sq-open").click()
    page.locator("#cc-sq-collection.open").wait_for(timeout=3000)
    geom=page.locator("#cc-sq-card").evaluate("""el=>({
      scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
      touch:getComputedStyle(el).touchAction
    })""")
    assert geom["scrollHeight"]>geom["clientHeight"]+50,geom
    assert "pan-y" in geom["touch"]
    canvas_touch=page.locator("#cc-sq-grid .squishem-card canvas").first.evaluate(
        "el=>getComputedStyle(el).touchAction")
    assert "pan-y" in canvas_touch,canvas_touch
    swipe_from(page,"#cc-sq-grid .squishem-card canvas",155)
    scrolled=page.locator("#cc-sq-card").evaluate("el=>el.scrollTop")
    assert scrolled>25,("Squishem collection cannot swipe-scroll",scrolled,geom)

    # Where? must display a real on-screen clue, not an invisible note behind the modal.
    # Find Skylar, a timed event exclusive, when its event has not started.
    page.locator("#cc-sq-grid .squishem-card").filter(has_text="Skylar Squishem").get_by_role(
        "button",name="Where?").click()
    guide=page.locator("#cc-sq-guide.open")
    guide.wait_for(timeout=3000)
    assert "Ghost 2.0" in guide.inner_text()
    assert "not running" in guide.inner_text().lower()
    assert page.locator("#cc-sq-guide-track").is_disabled()
    assert page.locator("#cc-sq-card").evaluate("el=>el.scrollTop")<=6

    # The same Where? clue becomes a usable trackable cave entrance during the event.
    def start_event(name,duration=120):
        page.evaluate("""([name,duration])=>window.dispatchEvent(new CustomEvent(
            'catcity:server',{detail:{type:'admin_event',event:{
            name,endsAt:Math.floor(Date.now()/1000)+duration,luck:4
        }}}))""",[name,duration])
    start_event("ghost_2_0")
    page.locator("#cc-sq-grid .squishem-card").filter(has_text="Skylar Squishem").get_by_role(
        "button",name="Where?").click()
    assert page.locator("#cc-sq-guide-track").is_enabled()
    assert "cave entrance" in guide.inner_text().lower()
    page.locator("#cc-sq-guide-track").click()
    assert page.evaluate("window.catCitySquishems.trackedId")=="skyler"
    page.locator("#cc-sq-close").click()
    page.wait_for_function("document.querySelector('#cc-sq-open').textContent.includes('🧭')")
    assert page.evaluate("window.catCitySquishemPlaces.portals().length")>0

    # Natural spawn directions point to the same actual spawn system used by game pickups.
    astro=page.evaluate("window.catCitySquishems.findGuide('astro')")
    assert astro["available"] and astro["waypoint"],astro
    page.evaluate("""([x,y])=>{const s=window.__catCityEngine.state;s.x=x;s.y=y}""",
                  [astro["waypoint"]["x"],astro["waypoint"]["y"]])
    assert page.evaluate("window.catCitySquishems.worldFinds().some(x=>x.id==='astro')")

    # Event decorations: real world-anchored pixels and themed props, not only HUD labels.
    theme_list=page.evaluate("Object.keys(window.catCityEventDecorations.themes)")
    assert len(theme_list)>=15,theme_list
    def scene():
        return page.evaluate("""() => {
          const c=document.createElement('canvas');c.width=390;c.height=844;
          const g=c.getContext('2d');
          const fixtures=window.catCityEventDecorations.decorate(g,390,844,2);
          const pixels=g.getImageData(0,0,390,844).data;
          let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])opaque++;
          return {fixtures,opaque,theme:window.catCityEventDecorations.currentTheme()?.id||null};
        }""")
    for event_name in ("ghost_2_0","galaxy_gala","pumpkin_cutie","winter_snow"):
        start_event(event_name)
        snap=scene()
        assert snap["theme"]==event_name,snap
        assert snap["fixtures"]>5 and snap["opaque"]>300,snap
    start_event("none",0)
    snap=scene()
    assert snap["theme"] is None and snap["fixtures"]==0 and snap["opaque"]==0,snap
    page.wait_for_timeout(750)
    assert page.evaluate("window.catCitySquishems.trackedId")=="" , "Expired event cave must stop tracking"

    assert not errors,errors
    print("PASS: public-server swipe, Squishem swipe, visible Where clues, compass tracker, four themed decorations and expiry")
    browser.close()
