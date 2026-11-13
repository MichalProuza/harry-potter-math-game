import { type HouseId, toHouseId } from './houses';
import { BRANCHES, type BranchId, LESSONS_TO_PASS, LESSON_SIZE, PASS_SCORE, getBranch } from './levels';
import { canonicalKey, parseFactKey } from './problems';
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
  /**
   * Jen u typů sčítání a odčítání: výsledky posledních pokusů bez nápovědy
   * (`1` = správně, `0` = špatně), nejnovější na konci. Z nich se počítá krabička.
   */
  recent?: string;
  /** Jen u spojů násobilky a dělení: klouzavý průměr času správné odpovědi (ms). */
  ms?: number;
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
    house: toHouseId(s.house),
    progress: { ...base.progress, ...(s.progress ?? {}) },
    stats: mergeStats(s.stats ?? {}),
    owned: Array.from(new Set([...(s.owned ?? []), ...STARTER_ITEMS])),
    equipped: s.equipped ?? base.equipped,
    streak: s.streak ?? base.streak,
  };
}

/** Sloučí statistiky uložené pod starými klíči (8 · 7 a 7 · 8 zvlášť) do jednoho spoje. */
function mergeStats(stats: Record<string, FactStat>): Record<string, FactStat> {
  const out: Record<string, FactStat> = {};
  for (const [key, stat] of Object.entries(stats)) {
    const k = canonicalKey(key);
    const other = out[k];
    out[k] = other
      ? {
          ...other,
          box: Math.min(other.box, stat.box),
          seen: other.seen + stat.seen,
          correct: other.correct + stat.correct,
          last: Math.max(other.last, stat.last),
        }
      : stat;
  }
  return out;
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

/** Jedna odpověď na první pokus. */
export interface Answer {
  /** Klíč příkladu (spoj nebo typ). */
  key: string;
  correct: boolean;
  /** Čas od zobrazení příkladu po odeslání odpovědi (ms). */
  ms?: number;
  /** Před odpovědí si dítě rozsvítilo nápovědu. */
  hinted?: boolean;
}

export interface LessonResult {
  branch: BranchId;
  level: number;
  /** První odpovědi na příklady lekce, v pořadí, v jakém přišly. */
  answers: Answer[];
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

/** Do kolika ms musí přijít správná odpověď na spoj, aby se počítal jako zvládnutý zpaměti. */
export const FLUENT_MS = 6000;
/** Z kolika posledních pokusů se počítá úspěšnost u typů sčítání a odčítání. */
export const RECENT_WINDOW = 10;

/** Krabička typu příkladu podle úspěšnosti posledních pokusů. Málo pokusů krabičku omezuje shora. */
export function boxFromRecent(recent: string): number {
  const n = recent.length;
  if (n === 0) return 1;
  const rate = recent.split('1').length - 1;
  const share = rate / n;
  const box = share >= 0.9 ? 5 : share >= 0.8 ? 4 : share >= 0.65 ? 3 : share >= 0.5 ? 2 : 1;
  return Math.min(box, 2 + Math.floor(n / 3));
}

/**
 * Aktualizuje statistiku jednoho příkladu.
 *
 * - Spoj násobilky a dělení: Leitnerova krabička. Nahoru jde jen po rychlé
 *   správné odpovědi bez nápovědy, po chybě se vrací na 1.
 * - Typ sčítání a odčítání: krabička podle úspěšnosti posledních pokusů.
 *   Správná odpověď s nápovědou se do ní nepočítá.
 */
export function updateStat(key: string, stat: FactStat | undefined, answer: Answer, now: number): FactStat {
  const next: FactStat = {
    ...stat,
    box: stat?.box ?? 1,
    seen: (stat?.seen ?? 0) + 1,
    correct: (stat?.correct ?? 0) + (answer.correct ? 1 : 0),
    last: now,
  };

  if (!parseFactKey(key)) {
    const counts = !answer.correct || !answer.hinted;
    const recent = counts ? ((stat?.recent ?? '') + (answer.correct ? '1' : '0')).slice(-RECENT_WINDOW) : stat?.recent;
    if (recent !== undefined) {
      next.recent = recent;
      next.box = boxFromRecent(recent);
    }
    return next;
  }

  if (!answer.correct) {
    next.box = 1;
    return next;
  }
  if (answer.ms !== undefined) next.ms = Math.round(stat?.ms === undefined ? answer.ms : stat.ms * 0.6 + answer.ms * 0.4);
  const fluent = !answer.hinted && (answer.ms === undefined || answer.ms <= FLUENT_MS);
  if (fluent) next.box = Math.min(5, next.box + 1);
  return next;
}

/** Započítá dokončenou lekci do stavu a spočítá odměny. Původní stav nemění. */
export function applyLesson(
  prev: PlayerState,
  result: LessonResult,
  overrides: UnlockOverrides = {},
  now = new Date(),
): LessonOutcome {
  const state: PlayerState = structuredClone(prev);
  const correct = result.answers.filter((a) => a.correct).length;
  const total = result.answers.length;
  const stars = starsFor(correct, total);
  const passed = correct >= PASS_SCORE;
  const ts = now.getTime();

  for (const a of result.answers) state.stats[a.key] = updateStat(a.key, state.stats[a.key], a, ts);

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

/**
 * Započítá odpovědi z nedokončené lekce jen do statistik příkladů.
 * Odměny, série ani postup v úrovni se nemění. Původní stav nemění.
 */
export function applyPractice(prev: PlayerState, answers: Answer[], now = new Date()): PlayerState {
  const state: PlayerState = structuredClone(prev);
  const ts = now.getTime();
  for (const a of answers) state.stats[a.key] = updateStat(a.key, state.stats[a.key], a, ts);
  return state;
}

// ------------------------------------------------------------ obchod

export function buyItem(prev: PlayerState, itemId: string): PlayerState {
  const item = getItem(itemId);
  if (!item) throw new Error('Tahle věc v obchodě není.');
  if (prev.owned.includes(itemId)) throw new Error('Tohle už máš.');
  if (prev.coins < item.price) throw new Error('Na tohle zatím nemáš dost galeonů.');
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

/** Nejslabší příklady – pro rodičovský přehled. */
export function weakestKeys(state: PlayerState, limit = 8): Array<{ key: string; stat: FactStat }> {
  return Object.entries(state.stats)
    // slabé = chybuje se v něm, nebo je správně, ale pomalu (dopočítává se)
    .filter(([, s]) => s.seen >= 2 && s.box <= 2 && (s.correct < s.seen || (s.ms ?? 0) > FLUENT_MS))
    .sort(([, a], [, b]) => a.correct / a.seen - b.correct / b.seen)
    .slice(0, limit)
    .map(([key, stat]) => ({ key, stat }));
}

export function allBranchIds(): BranchId[] {
  return BRANCHES.map((b) => b.id);
}
