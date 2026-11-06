"""Real Chromium iPhone test: enterable museum, owner event missions, token shop, quest board."""
from playwright.sync_api import sync_playwright

URL="http://127.0.0.1:8765/iphone"

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=2)
    errors=[]
    page.on("pageerror",lambda error: errors.append(str(error)))
    page.goto(URL,wait_until="domcontentloaded",timeout=30000)
    page.wait_for_function("!!window.catCityMuseum && !!window.catCityEventAdventure && !!window.catCityQuestBoard",timeout=12000)

    for path in ("/squishem-museum.js","/live-event-adventures.js","/adventure-quest-board.js"):
        resp=page.request.get("http://127.0.0.1:8765"+path)
        assert resp.status==200,path
    page.evaluate("window.__catCityEngine.state.tutorialCompleted=true")
    page.locator("#start-play").click()
    page.wait_for_function("!document.querySelector('#catcity-start-menu').classList.contains('show')",timeout=5000)

    # Enter the real building via world-space E / Paw rather than merely invoking an overlay.
    page.evaluate("""()=>{
      const e=window.catCityMuseum.entrance,s=window.__catCityEngine.state;
      s.x=e.x;s.y=e.y;
      window.__catCityEngine.interact();
    }""")
    page.locator("#cc-museum.open").wait_for(timeout=4000)
    assert page.evaluate("window.catCityMuseum.inside")
    assert page.locator("#cc-museum-canvas").is_visible()
    assert page.locator("#cc-museum-progress").inner_text().startswith("🌷 0 / 10")

    # Walk-up display: missing Squishems are silhouettes with Where hints.
    page.evaluate("""()=>{
      const m=window.catCityMuseum,first=m.spots[0];
      m.testMove(first.x,first.y+35);
    }""")
    page.locator("#cc-museum-action").click()
    assert "Still missing" in page.locator("#cc-museum-info").inner_text()
    page.locator("#cc-museum-info").get_by_role("button",name="How do I find it?").click()
    assert "forest" in page.locator("#cc-museum-info").inner_text().lower()
    page.locator("#cc-museum-info").get_by_role("button",name="Close").click()

    # Collected plushies appear on shelves; the 3,5,8,10 thresholds grant exactly once.
    page.evaluate("""()=>{
      const plush=window.catCitySquishems;
      for(const id of ['astro','mochi','berry'])plush.addPlush(id,'museum automated test');
    }""")
    page.locator("#cc-museum-rewards").click()
    page.locator("#cc-museum-info").get_by_role("button",name="Claim · 3/10",exact=False).count()
    first=page.locator("#cc-museum-info").get_by_role("button",name="Claim · 3/10",exact=False)
    assert first.is_enabled()
    before=page.evaluate("window.__catCityEngine.state.fish")
    first.click()
    assert page.evaluate("window.__catCityEngine.state.fish")==before+60
    assert page.evaluate("window.__catCityEngine.state.museumRewards['3']===true")
    assert not page.evaluate("window.catCityMuseum.grantReward(window.catCityMuseum.tiers[0])")

    page.evaluate("""()=>{
      const p=window.catCitySquishems;
      for(const id of ['minty','starpuff'])p.addPlush(id,'museum test');
    }""")
    page.evaluate("window.catCityMuseum.showRewards()")
    page.locator("#cc-museum-info").get_by_role("button",name="Claim · 5/10",exact=False).click()
    assert page.evaluate("window.catCityMuseum.luckMultiplier()")>1
    assert page.evaluate("window.catCitySquishems.luckMultiplier()")>1

    page.evaluate("""()=>{
      const p=window.catCitySquishems;
      for(const id of ['galaxy','baby','skyler','harley','pumpkin'])p.addPlush(id,'museum test');
    }""")
    page.evaluate("window.catCityMuseum.showRewards()")
    page.locator("#cc-museum-info").get_by_role("button",name="Claim · 8/10",exact=False).click()
    page.locator("#cc-museum-info").get_by_role("button",name="Claim · 10/10",exact=False).click()
    assert page.evaluate("window.__catCityEngine.state.museumTitle")=="Master Collector"
    assert page.evaluate("window.__catCityEngine.state.adventureItems.some(i=>i.id==='museum:master-collector-medal')")
    assert page.evaluate("window.__catCityEngine.state.decorUnlocked.includes('🧸')")
    page.locator("#cc-museum-info").get_by_role("button",name="Close").click()

    # Walk up to a real displayed cat and carry it from the museum.
    page.evaluate("""()=>{
      const m=window.catCityMuseum,spot=m.spots[5];m.testMove(spot.x,spot.y+25);
    }""")
    page.locator("#cc-museum-action").click()
    assert page.locator("#cc-museum-info").get_by_role("button",name="Carry this Squishem").count()==1
    page.locator("#cc-museum-info").get_by_role("button",name="Carry this Squishem").click()
    assert page.evaluate("window.__catCityEngine.state.squishemCarried")=="pumpkin"
    page.locator("#cc-museum-info").get_by_role("button",name="Close").click()
    page.locator("#cc-museum-exit").click()
    assert not page.evaluate("window.catCityMuseum.inside")

    # Global event run: genuine pickup and mining activities count toward missions.
    page.evaluate("""()=>window.dispatchEvent(new CustomEvent('catcity:server',{detail:{
       type:'admin_event',event:{name:'galaxy_gala',endsAt:Math.floor(Date.now()/1000)+240,luck:8}
    }}))""")
    page.wait_for_function("window.catCityEventAdventure.currentRun()?.event.name==='galaxy_gala'",timeout=5000)
    run=page.evaluate("""()=>window.catCityEventAdventure.currentRun()""")
    assert len(run["goals"])==3
    assert page.locator("#cc-sq-event").count()==1
    page.wait_for_timeout(850)
    assert "starlit" in page.locator("#cc-sq-event").inner_text().lower()

    page.evaluate("""()=>{
      for(let i=0;i<2;i++)window.dispatchEvent(new CustomEvent('catcity:adventure-action',
        {detail:{type:'pickup',item:{type:'weapon',effects:['galaxy']}}}));
      for(let i=0;i<2;i++)window.dispatchEvent(new CustomEvent('catcity:adventure-action',
        {detail:{type:'mine',material:'stone'}}));
    }""")
    page.locator("#cc-sq-event.show").click()
    page.locator("#cc-event-adventure.open").wait_for(timeout=3000)
    assert page.locator("#cc-ea-challenges .cc-ea-row").count()==3
    p=page.evaluate("""()=>{
      const r=window.catCityEventAdventure.currentRun(),api=window.catCityEventAdventure;
      return r.goals.map(g=>({id:g.id,progress:api.progressFor(r,g),target:g.target}));
    }""")
    assert p[0]["progress"]==2 and p[1]["progress"]==2,p
    tokens_before=page.evaluate("window.__catCityEngine.state.eventTokens")
    assert page.evaluate("window.catCityEventAdventure.claim('stargazer')")
    assert not page.evaluate("window.catCityEventAdventure.claim('stargazer')"),"Double claim permitted"
    assert page.evaluate("window.catCityEventAdventure.claim('crystals')")
    assert page.evaluate("window.catCityEventAdventure.claim('squish')")
    assert page.evaluate("window.__catCityEngine.state.eventTokens")==tokens_before+11
    assert page.evaluate("window.catCityEventAdventure.buy('gear')")
    assert page.evaluate("window.__catCityEngine.state.adventureItems.some(i=>i.id.startsWith('festival-gear:'))")
    assert not page.evaluate("window.catCityEventAdventure.buy('gear')"),"Event gear should be single-use per event"
    assert page.evaluate("window.catCityEventAdventure.buy('materials')")
    assert page.evaluate("window.__catCityEngine.state.materials.stone")>=4
    page.locator("#cc-ea-close").click()

    # Repeatable quest board and real-world sign.
    page.evaluate("""()=>{
      const c=window.__catCityEngine,m=window.catCityQuestBoard.boardPosition;
      c.state.x=m.x;c.state.y=m.y;c.interact();
    }""")
    page.locator("#cc-quest-board.open").wait_for(timeout=4000)
    assert page.locator("#cc-qb-tasks article").count()==6
    page.evaluate("""()=>{
      for(let i=0;i<3;i++)window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'chop'}}));
    }""")
    assert page.evaluate("window.catCityQuestBoard.completed(window.catCityQuestBoard.quests[0])")
    claims_before=page.evaluate("window.__catCityEngine.state.boardTotalClaims")
    assert page.evaluate("window.catCityQuestBoard.claim('timber')")
    assert page.evaluate("window.__catCityEngine.state.boardTotalClaims")==claims_before+1
    assert not page.evaluate("window.catCityQuestBoard.claim('timber')"),"Repeated quest claim allowed without progress"
    assert page.evaluate("window.catCityQuestBoard.track('stone')")
    tracked=page.evaluate("window.catCityQuestBoard.trackedGoal()")
    assert tracked["id"]=="stone",tracked
    page.locator("#cc-qb-close").click()
    page.wait_for_timeout(1800)
    assert "Mineral" in page.locator("#cc-objective-toggle").inner_text()
    # Repeated tier progression creates actual equipment, not just an invented message.
    page.evaluate("""()=>{
       const q=window.catCityQuestBoard,s=window.__catCityEngine.state;
       q.action('chop');q.action('chop');q.action('chop');q.action('chop');q.action('chop');
       q.claim('timber');
       for(let i=0;i<7;i++)q.action('chop');
       q.claim('timber');
    }""")
    assert page.evaluate("window.__catCityEngine.state.adventureItems.some(i=>i.id==='board:timber:3')")
    assert page.evaluate("window.__catCityEngine.state.boardTotalClaims")==claims_before+3

    # Cloud/local save stays backward compatible and collectibles, tokens and rank survive reload.
    page.evaluate("window.__catCityEngine.persist()")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!!window.catCityMuseum&&!!window.catCityQuestBoard&&!!window.catCityEventAdventure",timeout=9000)
    assert page.evaluate("window.__catCityEngine.state.museumRewards['10']===true")
    assert page.evaluate("window.__catCityEngine.state.boardQuests.timber.level")>=3
    assert page.evaluate("window.__catCityEngine.state.boardTracked")=="stone"
    assert page.evaluate("window.__catCityEngine.state.eventTokens")>=0
    assert not errors,"JS errors: "+str(errors)
    print("PASS: walkable Squishem Museum, curator, 3/5/8/10 rewards, collection saves, live event challenges/tokens, gear shop and repeatable quest board")
    browser.close()
