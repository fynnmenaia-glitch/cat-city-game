"""Four public Cat City rooms with autonomous resource-gathering AI cats.

No conversational AI, speech, microphone, paid API, or user-message storage.
Worker behaviour is implemented server-side in bot_adventure.py.
"""
from __future__ import annotations
import secrets

BOTS={
    # These characters occupy vacant cat slots in the public room, yielding
    # their visible slot when a human chooses the same playable character.
    'baby': {'id':'baby','name':'Baby','role':2,'coat':'#82776f','belly':'#b3a49a','eye':'#a6ca69'},
    'harley': {'id':'harley','name':'Harley','role':3,'coat':'#f7f6f0','belly':'#fffefa','eye':'#c6bd70'},
    'skylar': {'id':'skylar','name':'Skylar','role':4,'coat':'#f7f7f2','belly':'#fffefa','eye':'#c4ad61'},
}
# Two computer cats per public room; each room gets a different pair.
AI_LOBBIES=(('baby','harley'),('baby','skylar'),('harley','skylar'),('baby','harley'))
ADJECTIVES=('Sparkling','Cozy','Moonlit','Wandering','Glowing','Lucky','Secret','Whisker')
PLACES=('Paw Party','Forest Camp','Crystal Crew','Cherry Club','Cat Expedition','Moon Patrol')

def make_lobbies(Room, rooms, make_code):
    """Public worlds with six playable character slots and two autonomous teammates."""
    for group in AI_LOBBIES:
        for _ in range(80):
            title=f'{secrets.choice(ADJECTIVES)} {secrets.choice(PLACES)}'
            if title not in (r.title for r in rooms.values()):
                break
        else:
            title='Bot Crew '+secrets.token_hex(3)
        room=Room(make_code())
        room.title=title
        room.is_public=True
        room.started=True
        room.ai_room=True
        room.human_capacity=6
        for index,identity in enumerate(group):
            profile=BOTS[identity]
            room.bots.append({
                **profile,'x':float(485+index*82),'y':float(572+index*40),
                'job':'explore','activity':'exploring','questHelping':False,
                'swing':0,'carried':{},'route':index*3,'target':None
            })
        rooms[room.code]=room
