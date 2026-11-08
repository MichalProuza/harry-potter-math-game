import { useEffect, useState } from 'preact/hooks';
import { ApiError, type LessonLog, api, tokens } from './api';
import { type PlayerState, type UnlockOverrides, normalizeState } from './game/state';

/**
 * Stav přihlášené hráčky. Ukládá se nejdřív do prohlížeče (hra jde hrát i bez
 * internetu) a hned potom na server. Neodeslané lekce se pošlou při dalším pokusu.
 */
export interface PlayerSession {
  id: number;
  name: string;
  state: PlayerState;
  rev: number;
  overrides: UnlockOverrides;
  /** false = poslední změny ještě nejsou na serveru */
  synced: boolean;
}

interface Cache {
  state: PlayerState;
  rev: number;
  pending: LessonLog[];
  dirty: boolean;
}

const cacheKey = (id: number) => `ksp.cache.${id}`;

function readCache(id: number): Cache | null {
  try {
    const raw = localStorage.getItem(cacheKey(id));
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}
function writeCache(id: number, c: Cache): void {
  try {
    localStorage.setItem(cacheKey(id), JSON.stringify(c));
  } catch {
    /* bez úložiště se jen hned ukládá na server */
  }
}

type Listener = (s: PlayerSession | null) => void;

class SessionStore {
  current: PlayerSession | null = null;
  private pending: LessonLog[] = [];
  private listeners = new Set<Listener>();
  private syncing = false;

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit(): void {
    for (const l of this.listeners) l(this.current);
  }

  private persist(dirty: boolean): void {
    if (!this.current) return;
    writeCache(this.current.id, { state: this.current.state, rev: this.current.rev, pending: this.pending, dirty });
  }

  /** Načte profil po přihlášení PINem (nebo po obnovení stránky). */
  async load(): Promise<PlayerSession | null> {
    if (!tokens.player) return null;
    let me;
    try {
      me = await api.me();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        tokens.player = null;
        return null;
      }
      // bez internetu hrajeme z uloženého stavu
      const lastId = Number(localStorageGet('ksp.lastPlayer'));
      const cache = lastId ? readCache(lastId) : null;
      if (!cache) throw e;
      this.pending = cache.pending ?? [];
      this.current = {
        id: lastId,
        name: localStorageGet('ksp.lastPlayerName') ?? '',
        state: normalizeState(cache.state),
        rev: cache.rev,
        overrides: {},
        synced: false,
      };
      this.emit();
      return this.current;
    }

    const cache = readCache(me.id);
    let state = normalizeState(me.state);
    let rev = me.rev;
    let dirty = false;
    this.pending = [];
    if (cache?.dirty) {
      const local = normalizeState(cache.state);
      // Neodeslané změny z tohoto zařízení vyhrávají, pokud jsou novější.
      if (cache.rev === me.rev || local.lessonsTotal > state.lessonsTotal) {
        state = local;
        dirty = true;
        this.pending = cache.pending ?? [];
      }
    }
    localStorageSet('ksp.lastPlayer', String(me.id));
    localStorageSet('ksp.lastPlayerName', me.name);
    this.current = { id: me.id, name: me.name, state, rev, overrides: me.overrides ?? {}, synced: !dirty };
    this.persist(dirty);
    this.emit();
    if (dirty) void this.sync();
    return this.current;
  }

  /** Uloží nový stav (např. po lekci nebo nákupu). */
  commit(state: PlayerState, lesson?: LessonLog): void {
    if (!this.current) return;
    if (lesson) this.pending.push(lesson);
    this.current = { ...this.current, state, synced: false };
    this.persist(true);
    this.emit();
    void this.sync();
  }

  async sync(): Promise<void> {
    if (this.syncing || !this.current) return;
    this.syncing = true;
    try {
      for (let attempt = 0; attempt < 20; attempt++) {
        const cur = this.current;
        if (!cur) return;
        const lesson = this.pending[0];
        try {
          const { rev } = await api.saveState(cur.state, cur.rev, lesson);
          if (lesson) this.pending.shift();
          if (!this.current) return;
          // Během ukládání mohl přibýt nový stav – pošleme ho v dalším kole.
          const changed = this.current.state !== cur.state;
          this.current = { ...this.current, rev };
          if (this.pending.length === 0 && !changed) break;
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            const server = e.data as { state: unknown; rev: number };
            const remote = normalizeState(server.state);
            if (remote.lessonsTotal > cur.state.lessonsTotal) {
              // jiné zařízení je dál – převezmeme jeho stav
              this.pending = [];
              this.current = { ...cur, state: remote, rev: server.rev, synced: true };
              this.persist(false);
              this.emit();
              return;
            }
            if (!this.current) return;
            this.current = { ...this.current, rev: server.rev };
            continue;
          }
          return; // bez připojení – zkusíme později
        }
      }
      if (this.current) {
        this.current = { ...this.current, synced: true };
        this.persist(false);
        this.emit();
      }
    } finally {
      this.syncing = false;
    }
  }

  async logout(): Promise<void> {
    await this.sync().catch(() => undefined);
    const token = tokens.player;
    tokens.player = null;
    this.current = null;
    this.pending = [];
    this.emit();
    api.logout(token).catch(() => undefined);
  }
}

function localStorageGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function localStorageSet(k: string, v: string): void {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

export const session = new SessionStore();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void session.sync());
}

export function useSession(): PlayerSession | null {
  const [s, setS] = useState(session.current);
  useEffect(() => session.subscribe(setS), []);
  return s;
}
