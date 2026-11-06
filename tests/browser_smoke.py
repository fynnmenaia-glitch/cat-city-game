"""Chromium mobile smoke: playable tutorial, 40-slot inventory, tree art and HUD safety."""
from playwright.sync_api import sync_playwright

URL="http://127.0.0.1:8765/iphone"
def step(page,n):
    page.wait_for_function("(n)=>window.catCityTutorial?.step===n",arg=n,timeout=10000)

def walk(page,direction,millis):
    page.keyboard.down(direction)
    page.wait_for_timeout(millis)
    page.keyboard.up(direction)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=2)
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)+" | "+str(getattr(error,"stack",""))))
    page.goto(URL,wait_until="domcontentloaded",timeout=30000)
    page.locator("#cc-terraria-inventory").wait_for(state="attached",timeout=15000)
    assert page.locator("#cc-hotbar-ten button").count()==10
    assert page.locator("#cc-ai-panel").count()==0
    assert page.locator("#cc-voice-button").count()==0
    assert page.evaluate("window.catCityTreeAsset?.exists===true")

    # Training Village tutorial: a fenced-off mini Cat City, every step done for real.
    def ready(n):
        page.wait_for_function("(n)=>window.catCityTutorial?.step===n&&!window.catCityTutorial.waiting",arg=n,timeout=15000)
    def go():
        page.evaluate("window.catCityTutorial.standNear()");page.wait_for_timeout(200)
    def paw():
        page.locator("#cc-tv-act").click();page.wait_for_timeout(200)
    page.locator("#start-play").click()
    page.locator("#cc-tutorial-island.open").wait_for(timeout=5000)
    assert page.evaluate("window.catCityTutorial.tasks")==15
    ready(1);walk(page,"d",400);go()                          # walk to the signpost
    ready(2);go();paw();page.locator("#cc-tv-talk-ok").click()   # talk to Biscuit
    ready(3);go();paw()                                          # pick up the sword
    ready(4);page.locator("#cc-tv-bag").click()                  # open the real backpack
    page.locator("#cc-terraria-inventory.open").wait_for(timeout=5000)
    ready(5)
    assert page.locator("#cc-ti-grid button").count()==40
    assert page.locator("#cc-ti-money button").count()==9
    assert page.locator("#cc-hotbar-ten button").count()==10
    page.locator("#cc-spotlight.on").wait_for(timeout=4000)       # screen dims except the target
    page.locator('#cc-ti-grid button[aria-label*="Training Paw Blade"]').click()
    page.locator("#cc-ti-actions button").filter(has_text="Equip").click()
    ready(6);go();paw();paw();paw()                              # 3 chops of the tree
    ready(7);go();paw();paw();paw()                              # 3 strikes on the rock
    ready(8);go();paw()                                          # treasure chest
    ready(9);go();paw()                                          # crafting table
    page.locator("#cc-terraria-inventory.open").wait_for(timeout=5000)
    page.locator("#cc-ti-craft-arrows").click()
    ready(10);go();paw()                                         # into Marmalade's walk-in shop
    page.wait_for_function("window.catCityInteriors?.inside===true",timeout=5000)
    page.evaluate("window.catCityTutorialShop()")                # her counter
    page.locator("#cc-tv-talk-ok").click()
    ready(11);go();paw();page.locator("#cc-tv-talk-ok").click()  # Forge
    ready(12);go();paw();page.locator("#cc-tv-talk-ok").click()  # quest board
    ready(13);go();page.keyboard.down("Shift");walk(page,"d",900);page.keyboard.up("Shift")  # sprint
    ready(14);walk(page,"d",1500)                                # through the gate
    page.wait_for_function("window.__catCityEngine.state.tutorialCompleted===true",timeout=15000)
    page.wait_for_timeout(3200)
    assert page.locator("#cc-tutorial-island.open").count()==0
    assert page.evaluate("window.__catCityEngine.state.owned.includes('Fish Snack')")
    assert page.locator("#catcity-start-menu.show").count()==0

    # Real tree artwork generates opaque pixels.
    drawn=page.evaluate("""() => {
      const c=document.createElement('canvas');c.width=110;c.height=145;
      const ctx=c.getContext('2d');window.catCityTreeAsset.draw(ctx,52,126,'wild',2);
      const pixels=ctx.getImageData(0,0,110,145).data;
      let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])count++;
      return count;
    }""")
    assert drawn>1200,"No visible tree asset painted"

    # Inventory persists in the existing save; gear, materials and arrows survived training.
    state=page.evaluate("""()=>({
      slots:window.catCityGetTerrariaInventory().slots,
      count:window.__catCityEngine.state.adventureItems.length,
      arrow:window.__catCityEngine.state.ammoArrows,
      wood:window.__catCityEngine.state.materials?.wood,
      weapon:window.__catCityEngine.state.adventureEquipment?.weapon
    })""")
    assert len(state["slots"])==40
    assert state["count"]>=2 and state["arrow"]>=5 and state["wood"]>=2 and state["weapon"]
    page.locator("#cc-bag-button").click(force=True)
    page.locator("#cc-terraria-inventory.open").wait_for(timeout=5000)
    page.locator("#cc-ti-close").click()

    # The shop's Bow becomes genuine equipment; Ammo is no longer a decorative slot.
    page.evaluate("""() => window.__catCityEngine.state.owned.push('Bow')""")
    page.wait_for_function("window.__catCityEngine.state.adventureItems.some(x=>x.id==='owned:bow')",timeout=6000)
    page.locator("#cc-bag-button").click(force=True)
    page.locator('#cc-ti-grid button[aria-label*="Adventurer Bow"]').click()
    page.locator("#cc-ti-actions button").filter(has_text="Equip").click()
    assert page.evaluate("window.__catCityEngine.state.adventureEquipment.weapon")=="owned:bow"
    page.locator("#cc-ti-close").click()

    # Event luck and floor item availability genuinely change while a timed event runs.
    before=page.evaluate("window.catCityGetFloorLoot().length")
    page.evaluate("""() => window.dispatchEvent(new CustomEvent('catcity:server',{detail:{
      type:'admin_event',event:{name:'treasure_rain',endsAt:Math.floor(Date.now()/1000)+120,luck:24}
    }}))""")
    after=page.evaluate("window.catCityGetFloorLoot().length")
    assert after>before,"Treasure Rain should produce more biome-appropriate floor items"
    # The event chip is switched on; the Squishem event badge may sit in its place
    # (by design it hides the chip while it shows), so open the chip directly.
    page.wait_for_function("document.getElementById('cc-event-chip')?.classList.contains('show')",timeout=4000)
    page.evaluate("document.getElementById('cc-event-chip').click()")
    assert "24× luck" in page.locator("#cc-goal-event").inner_text()
    page.locator("#cc-goal-close").click()

    # Test important mobile controls do not occupy each other's touch areas.
    overlaps=page.evaluate("""() => {
      const r=id=>document.querySelector(id).getBoundingClientRect();
      const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      const pair=(a,b)=>hit(r(a),r(b));
      return {
        hotStick:pair('#cc-hotbar-ten','#mobile'),
        hotPaw:pair('#cc-hotbar-ten','#interact'),
        hudStamina:pair('#cc-compact-status','#stamina-ui'),
        staminaGoal:pair('#stamina-ui','#cc-objective-toggle'),
        goalBag:pair('#cc-objective-toggle','#cc-bag-button'),
        bagOnline:pair('#cc-bag-button','#catcity-online-open'),
        geometry:{hot:Object.fromEntries(['top','bottom','left','right','width','height'].map(k=>[k,r('#cc-hotbar-ten')[k]])),stick:Object.fromEntries(['top','bottom','left','right','width','height'].map(k=>[k,r('#mobile')[k]]))}
      };
    }""")
    assert not any(v for k,v in overlaps.items() if k!='geometry'),str(overlaps)

    # Regression: Inventory hotbar must be ABOVE stamina, stamina ABOVE joystick.
    # Test portrait and landscape, including wide iPhone landscape CSS viewports.
    for width,height in ((390,844),(844,390),(1024,430)):
        page.set_viewport_size({"width":width,"height":height})
        layout=page.evaluate("""() => {
          const box=id=>{const b=document.querySelector(id).getBoundingClientRect();
            return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,
                    height:b.height,width:b.width};};
          return {hotbar:box('#cc-hotbar-ten'),stamina:box('#stamina-ui'),stick:box('#mobile')};
        }""")
        hot,stamina,stick=layout["hotbar"],layout["stamina"],layout["stick"]
        assert hot["bottom"]+8<=stamina["top"],("Hotbar must be above stamina",width,height,layout)
        assert stamina["bottom"]+6<=stick["top"],("Stamina must be above joystick",width,height,layout)
        assert hot["top"]>=0 and stick["bottom"]<=height+2,("HUD must fit screen",width,height,layout)
    page.set_viewport_size({"width":390,"height":844})

    # Inline voting must show TWO real buttons immediately, not a tiny chip or
    # a full-screen modal. One tap records a choice and updates the compact UI.
    page.evaluate("""() => {
      window.catCityOnlineConnected=()=>true;
      window.__voteSent=null;
      window.catCityOnlineSend=(packet)=>window.__voteSent=packet;
      window.dispatchEvent(new CustomEvent('catcity:server',{detail:{
        type:'poll_state',active:true,id:'testpoll',options:['starfall','crystal_carnival'],
        votes:{starfall:3,crystal_carnival:1},
        botVotes:{starfall:2,crystal_carnival:1},
        humanVotes:{starfall:1,crystal_carnival:0},
        botTotal:3,humanTotal:1,endsAt:Math.floor(Date.now()/1000)+90
      }}));
    }""")
    page.locator("#cc-global-poll.open").wait_for(timeout=3000)
    assert page.locator("#cc-poll-options button").count()==2
    assert "Which event?" in page.locator("#cc-poll-chip").inner_text()
    assert "4 total votes" in page.locator("#cc-poll-meta").inner_text()
    assert "Starfall" in page.locator("#cc-poll-options").inner_text()
    assert "Crystal Carnival" in page.locator("#cc-poll-options").inner_text()

    page.evaluate("""() => window.dispatchEvent(new CustomEvent('catcity:server',{detail:{
        type:'admin_event',event:{
          name:'galaxy_gala',endsAt:Math.floor(Date.now()/1000)+180,luck:4
        }
    }}))""")
    page.locator("#cc-sq-event.show").wait_for(timeout=2500)

    # Geometry test: vote choices fit in one compact card and must not block
    # the bag, chat, map, or ongoing event timer on actual mobile viewports.
    def poll_rects():
        return page.evaluate("""() => {
          const ids=['cc-global-poll','cc-sq-event','cc-bag-button',
                     'cc-chat-float','map-open','quest-btn'];
          const box=id=>{
            const e=document.getElementById(id),b=e?.getBoundingClientRect();
            if(!b||getComputedStyle(e).display==='none')return null;
            return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,
                    width:b.width,height:b.height};
          };
          return Object.fromEntries(ids.map(id=>[id,box(id)]));
        }""")

    def hits(a,b):
        return (a and b and a["left"] < b["right"]-2 and a["right"] > b["left"]+2
                and a["top"] < b["bottom"]-2 and a["bottom"] > b["top"]+2)

    for width,height in [(390,844),(320,700),(844,390)]:
        page.set_viewport_size({"width":width,"height":height})
        page.wait_for_timeout(120)
        rects=poll_rects()
        poll=rects["cc-global-poll"]
        assert poll is not None and poll["width"]<=265, (width,height,rects)
        assert poll["height"]<=165 and poll["top"]>=0 and poll["bottom"]<=height+2,(width,height,rects)
        for sibling in ("cc-sq-event","cc-bag-button","cc-chat-float","map-open","quest-btn"):
            assert not hits(poll,rects[sibling]),("Overlapping inline event vote",width,height,sibling,rects)
    page.set_viewport_size({"width":390,"height":844})
    page.locator('#cc-poll-options button[aria-label="Vote for Starfall"]').click()
    assert page.evaluate("window.__voteSent")=={"type":"poll_vote","event":"starfall"}
    assert "Vote sent" in page.locator("#cc-poll-chip").inner_text()
    assert page.locator("#cc-poll-options button:disabled").count()==2
    # AI votes arrive while the poll continues; the voted choices stay visible.
    page.evaluate("""() => window.dispatchEvent(new CustomEvent('catcity:server',{detail:{
        type:'poll_state',active:true,id:'testpoll',options:['starfall','crystal_carnival'],
        votes:{starfall:5,crystal_carnival:4},
        botVotes:{starfall:4,crystal_carnival:3},
        humanVotes:{starfall:1,crystal_carnival:1},
        botTotal:7,humanTotal:2,endsAt:Math.floor(Date.now()/1000)+70
    }}))""")
    assert page.locator("#cc-global-poll.open").count()==1
    assert page.locator("#cc-poll-options button:disabled").count()==2
    assert "9 total votes" in page.locator("#cc-poll-meta").inner_text()
    # The next poll is voteable again, and closed polls remove the card.
    page.evaluate("""() => window.dispatchEvent(new CustomEvent('catcity:server',{detail:{
        type:'poll_state',active:true,id:'nextpoll',options:['galaxy_gala','pumpkin_cutie'],
        votes:{galaxy_gala:0,pumpkin_cutie:0},botVotes:{},humanVotes:{},
        botTotal:0,humanTotal:0,endsAt:Math.floor(Date.now()/1000)+90
    }}))""")
    assert page.locator("#cc-poll-options button:not(:disabled)").count()==2
    page.evaluate("window.dispatchEvent(new CustomEvent('catcity:server',{detail:{type:'poll_state',active:false}}))")
    assert page.locator("#cc-global-poll.open").count()==0

    # ALL notifications share the same toast — resource, equipment, quest and helper.
    # The previously reported dark rectangle must never stretch over the game.
    page.evaluate("window.catCityOnlineConnected=()=>false")
    for notification in ("Your cat helpers found 1 Wood!", "⚔️ Equipped Star Sword",
                         "🎁 Treasure chest reward", "Quest completed!"):
        page.evaluate("(message)=>window.__catCityEngine.note(message)",notification)
        dims=page.evaluate("""() => {
          const el=document.getElementById('toast'),b=el.getBoundingClientRect(),c=getComputedStyle(el);
          return {width:b.width,height:b.height,top:b.top,bottom:b.bottom,display:c.display,text:el.textContent};
        }""")
        assert dims["display"]!="none",dims
        assert 15<=dims["height"]<=75,("Notification is covering gameplay",dims)
        assert dims["width"]<=325,("Notification is too wide",dims)
        assert dims["top"]>=0 and dims["bottom"]<=844,("Notification outside iPhone",dims)
    page.wait_for_timeout(2300)
    assert page.locator("#toast").evaluate("(el)=>getComputedStyle(el).display")=="none"

    # Six selectable and genuinely rendered animated game characters.
    roster=page.evaluate("window.__catCityEngine.cats.map(c=>({name:c.name,pattern:c.pattern||''}))")
    assert [c["name"] for c in roster]==["Astro","Galaxy","Baby","Harley","Skylar","Pumpkin"]
    assert [c["pattern"] for c in roster[3:]]==["harley","skyler","pumpkin"]
    assert page.locator("#cat-menu [data-cat]").count()==6
    assert page.locator("#online-cat option").count()==6
    for idx in (3,4,5):
        # Open only if closed; clicking the toggle a second time closes it.
        if not page.locator("#cat-menu").evaluate("(el)=>el.classList.contains('open')"):
            page.locator("#cat-toggle").click()
        assert page.locator("#cat-menu").evaluate("(el)=>el.classList.contains('open')")
        choice=page.locator(f'#cat-menu [data-cat="{idx}"]')
        choice.scroll_into_view_if_needed()
        choice.click()
        actual=page.evaluate("window.__catCityEngine.state.cat")
        assert actual==idx,{"requested":idx,"actual":actual,
                           "menu":page.locator("#cat-menu").get_attribute("class"),
                           "note":page.locator("#toast").inner_text(),
                           "role":page.evaluate("window.__catCityEngine.cats[window.__catCityEngine.state.cat]?.name")}
        page.wait_for_timeout(300)   # run animated walking/blink/sit renderer

    # Owner practice mode must bypass quest gating but not alter quest progress.
    for chapter in (7,11,15):
        boss=page.evaluate("""(chapter) => {
          const e=window.__catCityEngine,before=e.state.questStage;
          const result=e.startBoss(chapter,{force:true});
          return {result,active:e.bossMode,chapter:e.bossChapter,before,after:e.state.questStage,
                  attackDisabled:document.getElementById('boss-attack').disabled};
        }""",chapter)
        assert boss["result"] and boss["active"],("Boss didn't start",boss)
        assert boss["chapter"]==chapter and boss["before"]==boss["after"],boss
        assert not boss["attackDisabled"]
        page.evaluate("document.getElementById('boss-exit').click()")
        assert not page.evaluate("window.__catCityEngine.bossMode")

    # Giant pixel update: tiers, lucky blocks, art, soundtrack, takeover, Admin Birman, kitties, TV Glitch.
    giant=page.evaluate("""() => {
      const s=window.__catCityEngine.state,e=window.__catCityEngine;s.adventureEquipment=s.adventureEquipment||{};
      const before=s.adventureEquipment.weapon;s.adventureEquipment.weapon=null;const none=catCityHitDamage();
      s.materials.wood=(s.materials.wood||0)+9;catCityTiers.craft('wood','weapon');const sword=s.adventureItems.at(-1);s.adventureEquipment.weapon=sword.id;const wood=catCityHitDamage();
      s.adventureEquipment.weapon=before||null;
      const r=catCityLuckyBlocks.rarityAt(5,5);const c=document.createElement('canvas').getContext('2d');catCityLuckyBlocks.draw(c,'impossible',50,50);
      const e99=e.startBoss(99,{force:true});const boss99=e.bossMode&&e.bossChapter===99;document.getElementById('boss-exit').click();
      return {none,wood,name:sword.name,rarityOk:catCityLuckyBlocks.byKey[r]!=null,floors:catCityFloors.kinds.length,squishem:!!catCitySquishemArt.url('astro'),
        songs:Object.keys(catCitySoundtrack.songs).length,boss99,afterExit:e.bossMode,villageDist:catCityInfected.villageDist(10,10),tv:catCityTVGlitch.active(),
        decor:catCityDecor.names.length,owner:!!catCityAdminBirman.owner(true)}
    }""")
    assert giant["none"]==1 and giant["wood"]==2 and giant["name"]=="Wood Sword",giant
    assert giant["rarityOk"] and giant["floors"]>=12 and giant["squishem"] and giant["songs"]>=11,giant
    assert giant["boss99"] and not giant["afterExit"] and giant["villageDist"]==0 and not giant["tv"],giant
    page.evaluate("catCityTakeover.play()");page.wait_for_timeout(1200)
    assert page.evaluate("document.getElementById('cc-takeover-cut').classList.contains('on')")
    page.wait_for_timeout(11000)
    assert not page.evaluate("document.getElementById('cc-takeover-cut').classList.contains('on')")

    # The shop never survives return to main title or re-entry.
    page.locator("#shop-toggle").click(force=True)
    assert "open" in page.locator("#shop-menu").get_attribute("class")
    page.evaluate("window.catCityReturnToTitle()")
    page.wait_for_timeout(150)
    assert "open" not in (page.locator("#shop-menu").get_attribute("class") or "")
    page.locator("#start-play").click()
    assert "open" not in (page.locator("#shop-menu").get_attribute("class") or "")

    # Save load backwards compatibility after a refresh.
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("window.catCityGetTerrariaInventory!=null",timeout=10000)
    assert page.evaluate("window.__catCityEngine.state.tutorialCompleted===true")
    assert page.evaluate("window.catCityGetTerrariaInventory().arrows")>=5
    assert page.request.get("http://127.0.0.1:8765/api/ai/cats").status==404
    assert not errors,"Browser JavaScript errors: "+str(errors)
    print("PASS: interactive tutorial, visible tree, inventory grid, mobile layout, event voting, shop cleanup and save reload")
    browser.close()
