"""Cat City account authentication and optional durable PostgreSQL saves.

Never store readable passwords. Deploy with a persistent DATABASE_URL for player
registration and cloud saves. The owner's credential hash may be provisioned as
an environment secret while waiting for a persistent database.
"""
from __future__ import annotations
import asyncio
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from collections import defaultdict, deque

from aiohttp import web

USERNAME = re.compile(r'^[A-Za-z0-9_]{3,20}$')
ROUNDS = 600_000
SESSION_SECONDS = 7 * 24 * 60 * 60
LOGIN_ATTEMPTS = defaultdict(deque)


def password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ROUNDS)
    return f'pbkdf2_sha256${ROUNDS}${salt.hex()}${digest.hex()}'


def check_hash(password: str, encoded: str) -> bool:
    try:
        alg, iterations, salt, expected = encoded.split('$')
        rounds = int(iterations)
        if alg != 'pbkdf2_sha256' or not (200_000 <= rounds <= 2_000_000):
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), rounds)
        return hmac.compare_digest(actual, bytes.fromhex(expected))
    except (TypeError, ValueError, AttributeError):
        return False


def b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip('=')


def deb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))


def same_origin(request):
    origin = request.headers.get('Origin')
    if not origin:
        return True
    expected_host = request.headers.get('X-Forwarded-Host', request.host).split(',')[0].strip()
    return origin in (f'https://{expected_host}', f'http://{expected_host}')


def limited(key: str, max_count=8, window=60) -> bool:
    q = LOGIN_ATTEMPTS[key]
    now = time.monotonic()
    while q and q[0] < now - window:
        q.popleft()
    if len(q) >= max_count:
        return True
    q.append(now)
    return False


class AccountService:
    def __init__(self):
        self.pool = None
        self.database_url = os.getenv('DATABASE_URL', '')
        self.owner_username = os.getenv('OWNER_USERNAME', 'Elidagoat')
        self.owner_hash = os.getenv('OWNER_PASSWORD_HASH', '')
        self.session_key = os.getenv('AUTH_SIGNING_SECRET', '').encode('utf8')
        if not self.session_key:
            # Dev-only fallback rotates at restart; production should set env secret.
            self.session_key = secrets.token_bytes(32)
        self.error = None

    async def startup(self, app):
        if self.database_url:
            try:
                import asyncpg
                self.pool = await asyncpg.create_pool(dsn=self.database_url, min_size=0, max_size=3,
                    max_inactive_connection_lifetime=25, timeout=25, command_timeout=15)
                async with self.pool.acquire() as conn:
                    await conn.execute('''CREATE TABLE IF NOT EXISTS catcity_accounts (
                        id BIGSERIAL PRIMARY KEY,
                        username VARCHAR(20) NOT NULL,
                        username_lower VARCHAR(20) UNIQUE NOT NULL,
                        passhash TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )''')
                    await conn.execute('''CREATE TABLE IF NOT EXISTS catcity_cloud_saves (
                        account_id BIGINT PRIMARY KEY REFERENCES catcity_accounts(id) ON DELETE CASCADE,
                        progress JSONB NOT NULL,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )''')
                    await conn.execute('''CREATE TABLE IF NOT EXISTS catcity_owner_saves (
                        username_lower VARCHAR(20) PRIMARY KEY,
                        progress JSONB NOT NULL,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )''')
            except Exception as exc:
                self.error = type(exc).__name__
                if self.pool:
                    await self.pool.close()
                    self.pool = None
        yield
        if self.pool:
            await self.pool.close()

    def sign(self, username: str, admin: bool = False):
        data = {'u': username, 'a': bool(admin), 'iat': int(time.time()), 'exp': int(time.time()) + SESSION_SECONDS}
        encoded = b64(json.dumps(data, separators=(',', ':')).encode())
        signature = b64(hmac.new(self.session_key, encoded.encode(), hashlib.sha256).digest())
        return f'{encoded}.{signature}'

    def user(self, request):
        cookie = request.cookies.get('cc_session', '')
        try:
            data_part, sig = cookie.split('.', 1)
            expected = b64(hmac.new(self.session_key, data_part.encode(), hashlib.sha256).digest())
            if not hmac.compare_digest(sig, expected):
                return None
            data = json.loads(deb64(data_part))
            if int(data['exp']) <= time.time() or not USERNAME.fullmatch(data['u']):
                return None
            owner = data['u'].lower() == self.owner_username.lower()
            # Never trust a token's admin flag without checking configured owner identity.
            is_admin = owner and data.get('a') is True and bool(self.owner_hash)
            return {'username': data['u'], 'admin': is_admin, 'owner': owner}
        except (ValueError, KeyError, TypeError, UnicodeError):
            return None

    def cookie(self, response, token, request):
        secure = request.secure or request.headers.get('X-Forwarded-Proto','').split(',')[0].strip() == 'https'
        response.set_cookie('cc_session', token, max_age=SESSION_SECONDS, httponly=True,
                            secure=secure, samesite='Lax', path='/')

    def require(self, request, admin=False):
        user = self.user(request)
        if not user or (admin and not user['admin']):
            raise web.HTTPForbidden(text='Account permission required.')
        return user

    async def account_status(self, _request):
        return web.json_response({'registrationAvailable': self.pool is not None,
                                  'ownerLoginAvailable': bool(self.owner_hash),
                                  'cloudSavesAvailable': self.pool is not None,
                                  'message': ('Persistent database connected.' if self.pool is not None else
                                              'Player registration and cloud saves require a persistent database.')})

    async def me(self, request):
        return web.json_response({'account': self.user(request), 'cloudSaves': self.pool is not None},
                                 headers={'Cache-Control': 'no-store'})

    async def register(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden(text='Invalid origin.')
        if self.pool is None:
            return web.json_response({'error':'Cloud registration needs a persistent PostgreSQL database.'}, status=503)
        if limited('register:'+str(request.remote),5,300):
            return web.json_response({'error':'Too many sign-up attempts. Try again later.'}, status=429)
        data = await request.json()
        username, password = str(data.get('username','')).strip(), str(data.get('password',''))
        if not USERNAME.fullmatch(username):
            return web.json_response({'error':'Username: 3–20 letters, numbers or underscores.'}, status=400)
        if username.lower() == self.owner_username.lower():
            return web.json_response({'error':'That username is reserved.'}, status=409)
        if not (12 <= len(password) <= 128):
            return web.json_response({'error':'Use a unique password at least 12 characters long.'}, status=400)
        hashed = await asyncio.to_thread(password_hash, password)
        try:
            async with self.pool.acquire() as conn:
                await conn.execute('INSERT INTO catcity_accounts (username, username_lower, passhash) VALUES ($1,$2,$3)',
                                   username, username.lower(), hashed)
        except Exception as exc:
            if type(exc).__name__ == 'UniqueViolationError':
                return web.json_response({'error':'That username is already taken.'}, status=409)
            return web.json_response({'error':'Could not create an account right now.'}, status=503)
        response = web.json_response({'account':{'username': username, 'admin':False}})
        self.cookie(response,self.sign(username),request)
        return response

    async def login(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden(text='Invalid origin.')
        if limited('login:'+str(request.remote),8,120):
            return web.json_response({'error':'Too many login attempts. Try again later.'}, status=429)
        data = await request.json()
        username, password = str(data.get('username','')).strip(), str(data.get('password',''))
        if not USERNAME.fullmatch(username) or len(password)>128:
            return web.json_response({'error':'Username or password is incorrect.'}, status=401)
        owner = username.lower() == self.owner_username.lower()
        if owner and self.owner_hash:
            valid = await asyncio.to_thread(check_hash, password, self.owner_hash)
            actual_username = self.owner_username
        elif self.pool:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow('SELECT username, passhash FROM catcity_accounts WHERE username_lower=$1',username.lower())
            valid = bool(row and await asyncio.to_thread(check_hash, password, row['passhash']))
            actual_username = row['username'] if row else username
        else:
            valid = False
            actual_username = username
        if not valid:
            return web.json_response({'error':'Username or password is incorrect.'}, status=401)
        response=web.json_response({'account':{'username':actual_username, 'admin':owner and bool(self.owner_hash)},
                                    'cloudSaves': self.pool is not None})
        self.cookie(response, self.sign(actual_username, owner), request)
        return response

    async def logout(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        response = web.json_response({'ok':True})
        response.del_cookie('cc_session',path='/')
        return response

    async def cloud_save(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        user=self.require(request)
        if self.pool is None:
            return web.json_response({'error':'Cloud saves require a permanent database.'}, status=503)
        data=await request.json()
        progress=data.get('progress')
        if not isinstance(progress, dict) or len(json.dumps(progress))>200_000:
            return web.json_response({'error':'Invalid or oversized save file.'},status=400)
        async with self.pool.acquire() as conn:
            if user['owner']:
                await conn.execute('''INSERT INTO catcity_owner_saves (username_lower,progress) VALUES ($1,$2::jsonb)
                    ON CONFLICT (username_lower) DO UPDATE SET progress=EXCLUDED.progress,updated_at=CURRENT_TIMESTAMP''',
                    user['username'].lower(),json.dumps(progress))
            else:
                await conn.execute('''INSERT INTO catcity_cloud_saves (account_id,progress)
                    SELECT id,$2::jsonb FROM catcity_accounts WHERE username_lower=$1
                    ON CONFLICT (account_id) DO UPDATE SET progress=EXCLUDED.progress,updated_at=CURRENT_TIMESTAMP''',
                    user['username'].lower(),json.dumps(progress))
        return web.json_response({'ok':True})

    async def cloud_load(self,request):
        user=self.require(request)
        if not self.pool:
            return web.json_response({'error':'Cloud save not available for this account yet.'},status=503)
        async with self.pool.acquire() as conn:
            if user['owner']:
                row=await conn.fetchrow('SELECT progress,updated_at FROM catcity_owner_saves WHERE username_lower=$1',user['username'].lower())
            else:
                row=await conn.fetchrow('''SELECT s.progress,s.updated_at FROM catcity_cloud_saves s
                JOIN catcity_accounts a ON a.id=s.account_id WHERE a.username_lower=$1''',user['username'].lower())
        return web.json_response({'progress': row['progress'] if row else None,
                                  'updatedAt':row['updated_at'].isoformat() if row else None})


def install_routes(app, service):
    app.router.add_get('/api/account/status',service.account_status)
    app.router.add_get('/api/account/me',service.me)
    app.router.add_post('/api/account/register',service.register)
    app.router.add_post('/api/account/login',service.login)
    app.router.add_post('/api/account/logout',service.logout)
    app.router.add_post('/api/account/save',service.cloud_save)
    app.router.add_get('/api/account/save',service.cloud_load)