"""Great Adventure and autonomous worker regression tests; no microphones or AI chat."""
import asyncio
import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from aiohttp.test_utils import AioHTTPTestCase
from ai_cats import BOTS, make_lobbies
from bot_adventure import target_node, biome, choose_work, tick_workers, collect_bot_drop
from server import Room, ROOMS, SOCIAL, make_app, valid_role
from tag_house import SPAWNS, floor_at, TagHouse

class FakeSocket:
    closed=False
    def __init__(self):self.sent=[]
    async def send_json(self,msg):self.sent.append(msg)

class WorkerTests(unittest.IsolatedAsyncioTestCase):
    def test_six_playable_roles_and_six_walkable_tag_spawns(self):
        self.assertTrue(valid_role(4))
        self.assertTrue(valid_role(5))
        self.assertFalse(valid_role(6))
        self.assertFalse(valid_role("4"))
        self.assertEqual(len(SPAWNS),6)
        self.assertTrue(all(floor_at(x,y) for x,y in SPAWNS))

    def test_lobbies_three_people_two_workers(self):
        rooms={}
        n=[0]
        def code():
            n[0]+=1
            return 'AI%04d'%n[0]
        make_lobbies(Room,rooms,code)
        self.assertEqual(len(rooms),4)
        self.assertEqual(len(set(r.title for r in rooms.values())),4)
        for r in rooms.values():
            self.assertEqual(r.human_capacity,6)
            self.assertEqual(len(r.bots),2)
            self.assertTrue(all(bot['id'] in BOTS for bot in r.bots))

    def test_worker_reaches_tree_mines_and_leaves_claimable_drops(self):
        room=Room('BOT123')
        room.ai_room=True
        room.bots=[{'id':'mochi','name':'Mochi','x':500.,'y':600.,
                    'route':0,'job':'explore','activity':'explore','carried':{},
                    'target':None,'questHelping':False}]
        human=SimpleNamespace(id='p',ws=FakeSocket(),x=510.,y=620.,activity='explore',
                quest_started=False,in_boss=False,cave_id='')
        room.players[human.id]=human
        tick_workers(room,.18,100.)
        node=room.bots[0]['target']
        self.assertTrue(node['id'].startswith('mine:'))
        self.assertNotEqual(node['biome'],'town')
        room.bots[0]['x']=node['x']
        room.bots[0]['y']=node['y']
        tick_workers(room,.18,101.)
        self.assertTrue(room.bots[0]['swing'])
        self.assertEqual(room.bot_drops,[],'Resource cannot appear before actual work')
        tick_workers(room,.18,104.)
        self.assertTrue(room.bot_drops)
        drop=room.bot_drops[0]
        self.assertEqual(drop['by'],'Mochi')
        self.assertIn(node['id'],room.bot_harvested)
        human.x, human.y = drop['x'], drop['y']
        claimed=collect_bot_drop(room,human,drop['id'])
        self.assertEqual(claimed['material'],drop['material'])
        self.assertIsNone(collect_bot_drop(room,human,drop['id']),'Drop can only be collected once')

    def test_bots_react_to_player_activity(self):
        r=Room('BOTS55');r.ai_room=True
        r.bot_harvested=set()
        player=SimpleNamespace(x=-100,y=390,activity='chop')
        chosen=choose_work(r,{'route':0},0,player)
        self.assertEqual(chosen['job'],'chop')
        self.assertNotEqual(biome(chosen['cx'],chosen['cy']),'town')

class GameServerTests(AioHTTPTestCase):
    async def get_application(self):
        ROOMS.clear()
        return make_app()

    async def test_public_lobbies_and_gameplay_assets(self):
        res=await self.client.get('/public-rooms')
        self.assertEqual(res.status,200)
        rooms=(await res.json())['rooms']
        bots=[r for r in rooms if r['crewRoom']]
        self.assertEqual(len(bots),4)
        self.assertTrue(all(r['capacity']==6 and len(r['crewBots'])==2 for r in bots))
        for path in ('/adventure-update.js','/adventure-mining.js','/bot-adventure.js','/pc-house.js',
                     '/world-overhaul.js','/tag-house.js','/cave-voice.js',
                     '/terraria-inventory.js','/tutorial-island.js','/ui-layout-polish.js','/resource-trees.js'):
            response=await self.client.get(path)
            self.assertEqual(response.status,200,path)
        self.assertEqual((await self.client.get('/api/ai/cats')).status,404)
        self.assertEqual((await self.client.post('/api/ai/chat',json={})).status,404)

    async def next_packet(self,ws,kind,limit=25):
        for _ in range(limit):
            packet=await asyncio.wait_for(ws.receive_json(),timeout=5)
            if packet.get('type')==kind:return packet
        self.fail('Did not get '+kind)

    async def test_six_players_and_party_tag_enter(self):
        sockets=[]
        try:
            owner=await self.client.ws_connect('/ws')
            sockets.append(owner)
            await owner.send_json({'type':'create','cat':0,'public':True,'title':'Six Cat Party'})
            welcome=await self.next_packet(owner,'welcome')
            code=welcome['code']
            self.assertEqual(welcome['humanCapacity'],6)
            for cat in (1,2,3,4,5):
                ws=await self.client.ws_connect('/ws')
                sockets.append(ws)
                await ws.send_json({'type':'join','cat':cat,'code':code})
                joined=await self.next_packet(ws,'welcome')
                self.assertEqual(joined['cat'],cat)
            await owner.send_json({'type':'tag_enter'})
            found=None
            for _ in range(35):
                p=await asyncio.wait_for(owner.receive_json(),timeout=5)
                if p.get('type')=='state' and len(p.get('tag',{}).get('players',[]))==6:
                    found=p
                    break
            self.assertIsNotNone(found)
            self.assertTrue(all(p['inHouse'] for p in found['tag']['players']))
        finally:
            for ws in sockets:await ws.close()

    async def test_six_humans_can_join_ai_public_room_and_seventh_is_full(self):
        ai_room=next(r for r in ROOMS.values() if r.ai_room)
        sockets=[]
        try:
            self.assertEqual(ai_room.human_capacity,6)
            self.assertEqual(len(ai_room.bots),2)
            for role in range(6):
                ws=await self.client.ws_connect('/ws')
                sockets.append(ws)
                await ws.send_json({'type':'join','cat':role,'code':ai_room.code})
                welcome=await self.next_packet(ws,'welcome')
                self.assertEqual(welcome['humanCapacity'],6)
                self.assertEqual(welcome['cat'],role)
            state=ai_room.snapshot()
            self.assertEqual(len(state['players']),6)
            self.assertEqual(len(state['bots']),2)
            extra=await self.client.ws_connect('/ws')
            sockets.append(extra)
            await extra.send_json({'type':'join','cat':0,'code':ai_room.code})
            rejected=await self.next_packet(extra,'error')
            self.assertEqual(rejected.get('code'),'FULL')
        finally:
            for ws in sockets:await ws.close()

    async def test_owner_event_poll_unique_drop_and_fish_are_protected(self):
        denied=await self.client.post('/api/admin/action',json={'action':'give_fish','amount':1000})
        self.assertIn(denied.status,(401,403))
        with patch.object(SOCIAL.accounts,'require',return_value={'username':'Owner','admin':True}):
            coins=await self.client.post('/api/admin/action',json={'action':'give_fish','amount':500})
            self.assertEqual(coins.status,200)
            self.assertEqual((await coins.json())['fish'],500)
            gear=await self.client.post('/api/admin/action',json={'action':'gear_set','theme':'Eli-geode'})
            self.assertEqual(gear.status,200)
            self.assertEqual(len((await gear.json())['items']),4)
            event=await self.client.post('/api/admin/action',json={
                'action':'event','value':'ghost_parade','durationSeconds':900,'luck':24
            })
            self.assertEqual(event.status,200)
            result=(await event.json())['event']
            self.assertEqual(result['luck'],24)
            self.assertGreater(result['endsAt'],int(time.time())+800)
            vote=await self.client.post('/api/admin/action',json={
                'action':'event_poll','options':['fish_festival','crystal_carnival'],'luck':6
            })
            self.assertEqual(vote.status,200)
            self.assertTrue((await vote.json())['poll']['active'])
            ws=await self.client.ws_connect('/ws')
            try:
                await ws.send_json({'type':'join','cat':0,'code':next(iter(ROOMS))})
                await self.next_packet(ws,'welcome')
                unique=await self.client.post('/api/admin/action',json={'action':'unique_drop'})
                self.assertEqual(unique.status,200)
                item=await self.next_packet(ws,'bot_unique_loot')
                self.assertTrue(item['item']['id'].startswith('global:'))
                self.assertEqual(item['item']['rarity'],'impossible')
            finally:
                await ws.close()
            finish=await self.client.post('/api/admin/action',json={'action':'event_poll_finish'})
            self.assertEqual(finish.status,200)

    async def test_autonomous_ai_votes_are_real_simulations_and_not_human_votes(self):
        # All eight worker cats in the four public lobbies can vote once.
        with patch.object(SOCIAL.accounts,'require',return_value={'username':'Owner','admin':True}):
            result=await self.client.post('/api/admin/action',json={
                'action':'event_poll','options':['starfall','crystal_carnival','fish_festival'],'luck':4
            })
            self.assertEqual(result.status,200)
            packet=(await result.json())['poll']
            self.assertEqual(packet['botTotal'],0)
            self.assertEqual(packet['humanTotal'],0)
            self.assertEqual(len(SOCIAL.poll['aiQueue']),8)
            for candidate in SOCIAL.poll['aiQueue']:
                candidate['dueAt']=0
            await SOCIAL.maybe_finish_poll()
            packet=SOCIAL.poll_packet()
            self.assertEqual(packet['botTotal'],8)
            self.assertEqual(packet['humanTotal'],0)
            self.assertEqual(sum(packet['botVotes'].values()),8)
            self.assertEqual(sum(packet['humanVotes'].values()),0)
            self.assertEqual(sum(packet['votes'].values()),8)
            await SOCIAL.maybe_finish_poll()
            self.assertEqual(SOCIAL.poll_packet()['botTotal'],8,'AI votes cannot be counted twice')
            SOCIAL.poll['endsAt']=0
            await SOCIAL.maybe_finish_poll()
            self.assertIsNone(SOCIAL.poll,'Poll must finish after the deadline')

    async def test_owner_boss_travel_for_all_three_chapters_is_privileged(self):
        denied=await self.client.post('/api/admin/action',json={'action':'boss_travel','chapter':11})
        self.assertIn(denied.status,(401,403))
        with patch.object(SOCIAL.accounts,'require',return_value={'username':'Owner','admin':True}):
            for chapter in (7,11,15):
                result=await self.client.post('/api/admin/action',json={'action':'boss_travel','chapter':chapter})
                self.assertEqual(result.status,200)
                payload=await result.json()
                self.assertTrue(payload['ok'])
                self.assertEqual(payload['chapter'],chapter)

    async def test_squishem_events_validate_owner_permissions_and_vote_choices(self):
        for name in ('galaxy_gala','ghost_2_0','pumpkin_cutie'):
            denied=await self.client.post('/api/admin/action',json={'action':'event','value':name})
            self.assertIn(denied.status,(401,403))
        with patch.object(SOCIAL.accounts,'require',return_value={'username':'Owner','admin':True}):
            for name in ('galaxy_gala','ghost_2_0','pumpkin_cutie'):
                result=await self.client.post('/api/admin/action',json={
                    'action':'event','value':name,'durationSeconds':300,'luck':12
                })
                self.assertEqual(result.status,200,name)
                payload=await result.json()
                self.assertEqual(payload['event']['name'],name)
                self.assertEqual(payload['event']['luck'],12)
            poll=await self.client.post('/api/admin/action',json={
                'action':'event_poll','options':['galaxy_gala','ghost_2_0','pumpkin_cutie']
            })
            self.assertEqual(poll.status,200)
            state=(await poll.json())['poll']
            self.assertEqual(len(state['options']),3)
            self.assertEqual(len(SOCIAL.poll['aiQueue']),8)
            end=await self.client.post('/api/admin/action',json={'action':'event_poll_finish'})
            self.assertEqual(end.status,200)

    async def test_squishem_client_files_are_public_no_premium_api_required(self):
        for path in ('/squishems.js','/squishem-art.js','/squishem-places.js'):
            result=await self.client.get(path)
            self.assertEqual(result.status,200,path)
            body=await result.text()
            self.assertIn('Squishem',body)

    async def test_removed_voice_chat_is_rejected(self):
        ws=await self.client.ws_connect('/ws')
        await ws.send_json({'type':'create','cat':0,'title':'No Voice'})
        await self.next_packet(ws,'welcome')
        await ws.send_json({'type':'voice_status','enabled':True})
        error=await self.next_packet(ws,'voice_error')
        self.assertIn('removed',error['message'].lower())
        await ws.close()

if __name__=='__main__':
    unittest.main()
