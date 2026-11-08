/**
 * API hry (Cloudflare Worker + D1). Statické soubory hry servíruje Cloudflare z ./dist.
 *
 * Rodič se přihlásí e-mailem a heslem (zařízení si to pamatuje). Dítě pak vybere
 * svůj profil a zadá 4místný PIN – dostane vlastní token, se kterým hraje.
 */

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

const PBKDF2_ITERATIONS = 100_000;
const PARENT_SESSION_DAYS = 365;
const PLAYER_SESSION_DAYS = 30;
const MAX_STATE_BYTES = 256 * 1024;
const MAX_PLAYERS_PER_PARENT = 6;

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ------------------------------------------------------------ kryptografie

const enc = new TextEncoder();

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pbkdf2(secret: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(secret, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const actual = await pbkdf2(secret, fromB64(salt), Number(iter));
  const expected = fromB64(hash);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

async function sha256(s: string): Promise<string> {
  return b64(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

// ------------------------------------------------------------ relace

type Kind = 'parent' | 'player';

async function createSession(env: Env, kind: Kind, subjectId: number): Promise<string> {
  const token = b64(crypto.getRandomValues(new Uint8Array(32)));
  const days = kind === 'parent' ? PARENT_SESSION_DAYS : PLAYER_SESSION_DAYS;
  await env.DB.prepare('INSERT INTO sessions (token_hash, kind, subject_id, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), kind, subjectId, Date.now() + days * 86_400_000)
    .run();
  return token;
}

async function auth(env: Env, req: Request, kind: Kind): Promise<number> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Nejsi přihlášený.');
  const row = await env.DB.prepare('SELECT subject_id, expires_at FROM sessions WHERE token_hash = ? AND kind = ?')
    .bind(await sha256(token), kind)
    .first<{ subject_id: number; expires_at: number }>();
  if (!row || row.expires_at < Date.now()) throw new HttpError(401, 'Přihlášení vypršelo, přihlas se znovu.');
  return row.subject_id;
}

// ------------------------------------------------------------ pomocné

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Neplatný požadavek.');
  }
}

function str(v: unknown, name: string, min: number, max: number): string {
  if (typeof v !== 'string') throw new HttpError(400, `Chybí ${name}.`);
  const s = v.trim();
  if (s.length < min || s.length > max) throw new HttpError(400, `Neplatná hodnota: ${name}.`);
  return s;
}

function pin(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}$/.test(v)) throw new HttpError(400, 'PIN musí mít 4 číslice.');
  return v;
}

async function ownedPlayer(env: Env, parentId: number, playerId: number) {
  const p = await env.DB.prepare('SELECT * FROM players WHERE id = ? AND parent_id = ?')
    .bind(playerId, parentId)
    .first<PlayerRow>();
  if (!p) throw new HttpError(404, 'Profil nenalezen.');
  return p;
}

interface PlayerRow {
  id: number;
  parent_id: number;
  name: string;
  pin_hash: string;
  state_json: string | null;
  state_rev: number;
  overrides_json: string;
}

function parseJson(s: string | null, fallback: unknown): unknown {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

// ------------------------------------------------------------ routy

type Handler = (req: Request, env: Env, params: string[]) => Promise<Response>;

const routes: Array<[string, RegExp, Handler]> = [
  [
    'POST',
    /^\/api\/parent\/register$/,
    async (req, env) => {
      const b = await body<{ email?: string; password?: string }>(req);
      const email = str(b.email, 'e-mail', 3, 200).toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Neplatný e-mail.');
      const password = str(b.password, 'heslo', 8, 200);
      const exists = await env.DB.prepare('SELECT id FROM parents WHERE email = ?').bind(email).first();
      if (exists) throw new HttpError(409, 'Účet s tímto e-mailem už existuje.');
      const res = await env.DB.prepare('INSERT INTO parents (email, password_hash, created_at) VALUES (?, ?, ?)')
        .bind(email, await hashSecret(password), Date.now())
        .run();
      const id = Number(res.meta.last_row_id);
      return json({ token: await createSession(env, 'parent', id) }, 201);
    },
  ],
  [
    'POST',
    /^\/api\/parent\/login$/,
    async (req, env) => {
      const b = await body<{ email?: string; password?: string }>(req);
      const email = str(b.email, 'e-mail', 3, 200).toLowerCase();
      const row = await env.DB.prepare('SELECT id, password_hash FROM parents WHERE email = ?')
        .bind(email)
        .first<{ id: number; password_hash: string }>();
      if (!row || !(await verifySecret(String(b.password ?? ''), row.password_hash))) {
        throw new HttpError(401, 'Špatný e-mail nebo heslo.');
      }
      return json({ token: await createSession(env, 'parent', row.id) });
    },
  ],
  [
    'POST',
    /^\/api\/parent\/verify$/,
    async (req, env) => {
      // Ověření hesla před vstupem do rodičovské sekce (aby tam nemohlo dítě).
      const parentId = await auth(env, req, 'parent');
      const b = await body<{ password?: string }>(req);
      const row = await env.DB.prepare('SELECT password_hash FROM parents WHERE id = ?')
        .bind(parentId)
        .first<{ password_hash: string }>();
      if (!row || !(await verifySecret(String(b.password ?? ''), row.password_hash))) {
        throw new HttpError(401, 'Špatné heslo.');
      }
      return json({ ok: true });
    },
  ],
  [
    'GET',
    /^\/api\/players$/,
    async (req, env) => {
      const parentId = await auth(env, req, 'parent');
      const { results } = await env.DB.prepare('SELECT id, name, state_json FROM players WHERE parent_id = ? ORDER BY id')
        .bind(parentId)
        .all<{ id: number; name: string; state_json: string | null }>();
      return json(
        results.map((p) => {
          const s = parseJson(p.state_json, {}) as { house?: string; equipped?: unknown; xp?: number };
          return { id: p.id, name: p.name, house: s.house ?? null, equipped: s.equipped ?? {}, xp: s.xp ?? 0 };
        }),
      );
    },
  ],
  [
    'POST',
    /^\/api\/players$/,
    async (req, env) => {
      const parentId = await auth(env, req, 'parent');
      const b = await body<{ name?: string; pin?: string }>(req);
      const name = str(b.name, 'jméno', 1, 30);
      const p = pin(b.pin);
      const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM players WHERE parent_id = ?')
        .bind(parentId)
        .first<{ n: number }>();
      if ((count?.n ?? 0) >= MAX_PLAYERS_PER_PARENT) throw new HttpError(400, 'Víc profilů už přidat nejde.');
      const res = await env.DB.prepare('INSERT INTO players (parent_id, name, pin_hash, created_at) VALUES (?, ?, ?, ?)')
        .bind(parentId, name, await hashSecret(p), Date.now())
        .run();
      return json({ id: Number(res.meta.last_row_id) }, 201);
    },
  ],
  [
    'POST',
    /^\/api\/players\/(\d+)\/login$/,
    async (req, env, [id]) => {
      const parentId = await auth(env, req, 'parent');
      const player = await ownedPlayer(env, parentId, Number(id));
      const b = await body<{ pin?: string }>(req);
      if (!(await verifySecret(String(b.pin ?? ''), player.pin_hash))) throw new HttpError(401, 'Špatný PIN.');
      return json({ token: await createSession(env, 'player', player.id) });
    },
  ],
  [
    'PUT',
    /^\/api\/players\/(\d+)\/pin$/,
    async (req, env, [id]) => {
      const parentId = await auth(env, req, 'parent');
      const player = await ownedPlayer(env, parentId, Number(id));
      const b = await body<{ pin?: string }>(req);
      await env.DB.prepare('UPDATE players SET pin_hash = ? WHERE id = ?').bind(await hashSecret(pin(b.pin)), player.id).run();
      return json({ ok: true });
    },
  ],
  [
    'GET',
    /^\/api\/players\/(\d+)\/overview$/,
    async (req, env, [id]) => {
      const parentId = await auth(env, req, 'parent');
      const player = await ownedPlayer(env, parentId, Number(id));
      const { results } = await env.DB.prepare(
        'SELECT branch, level, correct, total, duration_s, mistakes, finished_at FROM lessons WHERE player_id = ? ORDER BY finished_at DESC LIMIT 50',
      )
        .bind(player.id)
        .all<Record<string, unknown>>();
      return json({
        id: player.id,
        name: player.name,
        state: parseJson(player.state_json, null),
        overrides: parseJson(player.overrides_json, {}),
        lessons: results.map((l) => ({ ...l, mistakes: parseJson(l.mistakes as string, []) })),
      });
    },
  ],
  [
    'PUT',
    /^\/api\/players\/(\d+)\/overrides$/,
    async (req, env, [id]) => {
      const parentId = await auth(env, req, 'parent');
      const player = await ownedPlayer(env, parentId, Number(id));
      const b = await body<{ overrides?: Record<string, unknown> }>(req);
      const clean: Record<string, number> = {};
      for (const [k, v] of Object.entries(b.overrides ?? {})) {
        if (/^[a-z]{1,20}$/.test(k) && Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 20) clean[k] = v as number;
      }
      await env.DB.prepare('UPDATE players SET overrides_json = ? WHERE id = ?').bind(JSON.stringify(clean), player.id).run();
      return json({ overrides: clean });
    },
  ],
  [
    'GET',
    /^\/api\/me$/,
    async (req, env) => {
      const playerId = await auth(env, req, 'player');
      const p = await env.DB.prepare('SELECT * FROM players WHERE id = ?').bind(playerId).first<PlayerRow>();
      if (!p) throw new HttpError(404, 'Profil nenalezen.');
      return json({
        id: p.id,
        name: p.name,
        state: parseJson(p.state_json, null),
        rev: p.state_rev,
        overrides: parseJson(p.overrides_json, {}),
      });
    },
  ],
  [
    'PUT',
    /^\/api\/me\/state$/,
    async (req, env) => {
      const playerId = await auth(env, req, 'player');
      const raw = await req.text();
      if (raw.length > MAX_STATE_BYTES) throw new HttpError(413, 'Uložený stav je příliš velký.');
      let b: { state?: unknown; baseRev?: number; lesson?: Record<string, unknown> };
      try {
        b = JSON.parse(raw);
      } catch {
        throw new HttpError(400, 'Neplatný požadavek.');
      }
      if (!b.state || typeof b.state !== 'object') throw new HttpError(400, 'Chybí stav hry.');

      // Optimistické zamykání: když mezitím uložilo jiné zařízení, vrátíme jeho stav.
      const res = await env.DB.prepare('UPDATE players SET state_json = ?, state_rev = state_rev + 1 WHERE id = ? AND state_rev = ?')
        .bind(JSON.stringify(b.state), playerId, Number(b.baseRev ?? 0))
        .run();
      if (res.meta.changes === 0) {
        const p = await env.DB.prepare('SELECT state_json, state_rev FROM players WHERE id = ?')
          .bind(playerId)
          .first<{ state_json: string | null; state_rev: number }>();
        return json({ conflict: true, state: parseJson(p?.state_json ?? null, null), rev: p?.state_rev ?? 0 }, 409);
      }

      const l = b.lesson;
      if (l && typeof l === 'object') {
        await env.DB.prepare(
          'INSERT INTO lessons (player_id, branch, level, correct, total, duration_s, mistakes, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            playerId,
            String(l.branch ?? '').slice(0, 20),
            Number(l.level) || 0,
            Number(l.correct) || 0,
            Number(l.total) || 0,
            Math.round(Number(l.durationS) || 0),
            JSON.stringify(Array.isArray(l.mistakes) ? l.mistakes.slice(0, 20).map(String) : []),
            Date.now(),
          )
          .run();
      }
      const p = await env.DB.prepare('SELECT state_rev FROM players WHERE id = ?').bind(playerId).first<{ state_rev: number }>();
      return json({ rev: p?.state_rev ?? 0 });
    },
  ],
  [
    'POST',
    /^\/api\/logout$/,
    async (req, env) => {
      const header = req.headers.get('Authorization') ?? '';
      if (header.startsWith('Bearer ')) {
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(header.slice(7))).run();
      }
      return json({ ok: true });
    },
  ],
];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      for (const [method, pattern, handler] of routes) {
        const m = pattern.exec(url.pathname);
        if (m && req.method === method) return await handler(req, env, m.slice(1));
      }
      return json({ error: 'Nenalezeno.' }, 404);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'Něco se pokazilo. Zkus to prosím znovu.' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
