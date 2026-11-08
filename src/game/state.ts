import type { HouseId } from './houses';
import { BRANCHES, type BranchId, LESSONS_TO_PASS, LESSON_SIZE, PASS_SCORE, getBranch } from './levels';
import { STARTER_ITEMS, type Slot, getItem } from './shop';

export interface LevelProgress {
  /** Počet úspěšných lekcí (alespoň PASS_SCORE správně). */
  passed: number;
  bestStars: number;
  plays: number;
}

export interface FactStat {
  /** Leitnerova krabička 1–5 (1 = ještě to nejde, 5 = umím). */
  box: number;
  seen: number;
  correct: number;
  /** Čas posledního procvičení (ms). */
  last: number;
}

export interface PlayerState {
  version: 1;
  house: HouseId | null;
  xp: number;
  coins: number;
  progress: Record<BranchId, Record<number, LevelProgress>>;
  stats: Record<string, FactStat>;
  owned: string[];
  equipped: Partial<Record<Slot, string>>;
  streak: { count: number; lastDay: string | null };
  lessonsTotal: number;
}

/** Ruční odemčení úrovní od rodiče: nejvyšší odemčená úroveň pro větev. */
export type UnlockOverrides = Partial<Record<BranchId, number>>;

export function newState(): PlayerState {
  return {
    version: 1,
    house: null,
    xp: 0,
    coins: 0,
    progress: { lektvary: {}, formule: {}, premenovani: {} },
    stats: {},
    owned: [...STARTER_ITEMS],
    equipped: { wand: 'wand-school' },
    streak: { count: 0, lastDay: null },
    lessonsTotal: 0,
  };
}

/** Doplní chybějící pole (např. u stavu uloženého starší verzí hry). */
export function normalizeState(raw: unknown): PlayerState {
  const base = newState();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<PlayerState>;
  return {
    ...base,
    ...s,
    progress: { ...base.progress, ...(s.progress ?? {}) },
    stats: s.stats ?? {},
    owned: Array.from(new Set([...(s.owned ?? []), ...STARTER_ITEMS])),
    equipped: s.equipped ?? base.equipped,
    streak: s.streak ?? base.streak,
  };
}

export function levelProgress(state: PlayerState, branch: BranchId, n: number): LevelProgress {
  return state.progress[branch]?.[n] ?? { passed: 0, bestStars: 0, plays: 0 };
}

/** Nejvyšší odemčená úroveň ve větvi. */
export function unlockedUpTo(state: PlayerState, branch: BranchId, overrides: UnlockOverrides = {}): number {
  const def = getBranch(branch);
  let max = Math.max(def.startUnlocked, overrides[branch] ?? 0);
  for (const level of def.levels) {
    if (levelProgress(state, branch, level.n).passed >= LESSONS_TO_PASS) max = Math.max(max, level.n + 1);
  }
  return Math.min(max, def.levels.length);
}

// ------------------------------------------------------------ hodnosti

export const RANKS = [
  { xp: 0, name: 'Prvňáček' },
  { xp: 300, name: 'Učednice' },
  { xp: 800, name: 'Mladá kouzelnice' },
  { xp: 1600, name: 'Kouzelnice' },
  { xp: 3000, name: 'Čarodějka' },
  { xp: 5000, name: 'Mistryně kouzel' },
  { xp: 8000, name: 'Velká mágyně' },
];

export function rankFor(xp: number): { name: string; index: number; current: number; next: number | null } {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) index = i;
  const next = RANKS[index + 1]?.xp ?? null;
  return { name: RANKS[index].name, index, current: RANKS[index].xp, next };
}

// ------------------------------------------------------------ odměny

export const REWARDS = {
  coinsPerCorrect: 1,
  xpPerCorrect: 10,
  lessonCoins: 5,
  lessonXp: 20,
  perfectCoins: 10,
  dailyCoins: 10,
};

export function starsFor(correct: number, total = LESSON_SIZE): number {
  if (correct >= total) return 3;
  if (correct >= PASS_SCORE) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

export interface LessonResult {
  branch: BranchId;
  level: number;
  /** Klíče příkladů zodpovězených správně na první pokus. */
  correctKeys: string[];
  /** Klíče příkladů, u kterých byla první odpověď špatně. */
  wrongKeys: string[];
}

export interface LessonOutcome {
  state: PlayerState;
  correct: number;
  total: number;
  stars: number;
  passed: boolean;
  coins: number;
  xp: number;
  dailyBonus: boolean;
  streak: number;
  newlyUnlocked: number | null;
  rankUp: string | null;
}

export function dayKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

/** Aktualizuje statistiku jednoho příkladu podle Leitnerova systému. */
export function updateStat(stat: FactStat | undefined, correct: boolean, now: number): FactStat {
  const box = stat?.box ?? 1;
  return {
    box: correct ? Math.min(5, stat ? box + 1 : 2) : 1,
    seen: (stat?.seen ?? 0) + 1,
    correct: (stat?.correct ?? 0) + (correct ? 1 : 0),
    last: now,
  };
}

/** Započítá dokončenou lekci do stavu a spočítá odměny. Původní stav nemění. */
export function applyLesson(
  prev: PlayerState,
  result: LessonResult,
  overrides: UnlockOverrides = {},
  now = new Date(),
): LessonOutcome {
  const state: PlayerState = structuredClone(prev);
  const correct = result.correctKeys.length;
  const total = correct + result.wrongKeys.length;
  const stars = starsFor(correct, total);
  const passed = correct >= PASS_SCORE;
  const ts = now.getTime();

  for (const key of result.correctKeys) state.stats[key] = updateStat(state.stats[key], true, ts);
  for (const key of result.wrongKeys) state.stats[key] = updateStat(state.stats[key], false, ts);

  const unlockedBefore = unlockedUpTo(prev, result.branch, overrides);
  const lp = levelProgress(state, result.branch, result.level);
  state.progress[result.branch] = {
    ...state.progress[result.branch],
    [result.level]: {
      passed: lp.passed + (passed ? 1 : 0),
      bestStars: Math.max(lp.bestStars, stars),
      plays: lp.plays + 1,
    },
  };
  const unlockedAfter = unlockedUpTo(state, result.branch, overrides);

  let coins = correct * REWARDS.coinsPerCorrect + REWARDS.lessonCoins;
  if (stars === 3) coins += REWARDS.perfectCoins;
  const xp = correct * REWARDS.xpPerCorrect + REWARDS.lessonXp;

  const today = dayKey(now);
  const dailyBonus = state.streak.lastDay !== today;
  if (dailyBonus) {
    coins += REWARDS.dailyCoins;
    state.streak = {
      count: state.streak.lastDay === previousDay(today) ? state.streak.count + 1 : 1,
      lastDay: today,
    };
  }

  const rankBefore = rankFor(state.xp);
  state.coins += coins;
  state.xp += xp;
  state.lessonsTotal += 1;
  const rankAfter = rankFor(state.xp);

  return {
    state,
    correct,
    total,
    stars,
    passed,
    coins,
    xp,
    dailyBonus,
    streak: state.streak.count,
    newlyUnlocked: unlockedAfter > unlockedBefore ? unlockedAfter : null,
    rankUp: rankAfter.index > rankBefore.index ? rankAfter.name : null,
  };
}

// ------------------------------------------------------------ obchod

export function buyItem(prev: PlayerState, itemId: string): PlayerState {
  const item = getItem(itemId);
  if (!item) throw new Error('Tahle věc v obchodě není.');
  if (prev.owned.includes(itemId)) throw new Error('Tohle už máš.');
  if (prev.coins < item.price) throw new Error('Na tohle zatím nemáš dost zlaťáků.');
  return {
    ...prev,
    coins: prev.coins - item.price,
    owned: [...prev.owned, itemId],
    equipped: { ...prev.equipped, [item.slot]: itemId },
  };
}

export function toggleEquip(prev: PlayerState, itemId: string): PlayerState {
  const item = getItem(itemId);
  if (!item || !prev.owned.includes(itemId)) return prev;
  const equipped = { ...prev.equipped };
  if (equipped[item.slot] === itemId && item.slot !== 'wand') delete equipped[item.slot];
  else equipped[item.slot] = itemId;
  return { ...prev, equipped };
}

/** Celková úspěšnost a nejslabší příklady – pro rodičovský přehled. */
export function weakestKeys(state: PlayerState, limit = 8): Array<{ key: string; stat: FactStat }> {
  return Object.entries(state.stats)
    .filter(([, s]) => s.seen >= 2 && s.box <= 2)
    .sort(([, a], [, b]) => a.correct / a.seen - b.correct / b.seen)
    .slice(0, limit)
    .map(([key, stat]) => ({ key, stat }));
}

export function allBranchIds(): BranchId[] {
  return BRANCHES.map((b) => b.id);
}
