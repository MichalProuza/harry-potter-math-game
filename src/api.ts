import type { PlayerState, UnlockOverrides } from './game/state';

const PARENT_TOKEN = 'ksp.parentToken';
const PLAYER_TOKEN = 'ksp.playerToken';

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* soukromé okno apod. – token platí aspoň do zavření stránky */
  }
}

export const tokens = {
  get parent() {
    return storageGet(PARENT_TOKEN);
  },
  set parent(v: string | null) {
    storageSet(PARENT_TOKEN, v);
  },
  get player() {
    return storageGet(PLAYER_TOKEN);
  },
  set player(v: string | null) {
    storageSet(PLAYER_TOKEN, v);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, token: string | null, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Nejde se připojit k internetu.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Něco se pokazilo.', data);
  return data as T;
}

export interface PlayerSummary {
  id: number;
  name: string;
  house: string | null;
  equipped: PlayerState['equipped'];
  xp: number;
}

export interface MeResponse {
  id: number;
  name: string;
  state: unknown;
  rev: number;
  overrides: UnlockOverrides;
}

export interface LessonLog {
  branch: string;
  level: number;
  correct: number;
  total: number;
  durationS: number;
  mistakes: string[];
}

export interface Overview {
  id: number;
  name: string;
  state: unknown;
  overrides: UnlockOverrides;
  lessons: Array<{
    branch: string;
    level: number;
    correct: number;
    total: number;
    duration_s: number;
    mistakes: string[];
    finished_at: number;
  }>;
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string }>('POST', '/api/parent/register', null, { email, password }),
  login: (email: string, password: string) => request<{ token: string }>('POST', '/api/parent/login', null, { email, password }),
  verifyParent: (password: string) => request<{ ok: true }>('POST', '/api/parent/verify', tokens.parent, { password }),
  players: () => request<PlayerSummary[]>('GET', '/api/players', tokens.parent),
  addPlayer: (name: string, pin: string) => request<{ id: number }>('POST', '/api/players', tokens.parent, { name, pin }),
  playerLogin: (id: number, pin: string) => request<{ token: string }>('POST', `/api/players/${id}/login`, tokens.parent, { pin }),
  setPin: (id: number, pin: string) => request<{ ok: true }>('PUT', `/api/players/${id}/pin`, tokens.parent, { pin }),
  overview: (id: number) => request<Overview>('GET', `/api/players/${id}/overview`, tokens.parent),
  setOverrides: (id: number, overrides: UnlockOverrides) =>
    request<{ overrides: UnlockOverrides }>('PUT', `/api/players/${id}/overrides`, tokens.parent, { overrides }),
  me: () => request<MeResponse>('GET', '/api/me', tokens.player),
  saveState: (state: PlayerState, baseRev: number, lesson?: LessonLog) =>
    request<{ rev: number }>('PUT', '/api/me/state', tokens.player, { state, baseRev, lesson }),
  logout: (token: string | null) => request<{ ok: true }>('POST', '/api/logout', token),
};
