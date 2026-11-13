import { type BranchId, LESSON_SIZE, getBranch } from './levels';
import { type Problem, isTrivialFact, makeProblem } from './problems';
import { type Rng, defaultRng, weightedPick } from './random';
import { type PlayerState, levelProgress } from './state';

/** Podíl příkladů z aktuální úrovně; zbytek je opakování starších úrovní. */
const CURRENT_SHARE = 0.7;

const DAY_MS = 86_400_000;
/** Váha podle krabičky (index = krabička) – slabší příklady chodí častěji. */
const BOX_WEIGHT = [0, 6, 4, 2.5, 1.5, 1];
/** Po kolika dnech je příklad v dané krabičce znovu na řadě. */
const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 14];
/** Spoje s 1 a 10 jsou snadné, dostávají jen zlomek váhy. */
const TRIVIAL_FACTOR = 0.3;

/**
 * Váha výběru příkladu. Roste, když je příklad ve slabší krabičce a když se
 * dlouho neprocvičoval (až na trojnásobek po dvou intervalech krabičky).
 */
export function weightFor(state: PlayerState, key: string, now: number): number {
  const stat = state.stats[key];
  let w = 4;
  if (stat) {
    w = BOX_WEIGHT[stat.box] ?? 1;
    const interval = BOX_INTERVAL_DAYS[stat.box] ?? 14;
    if (interval > 0) w *= 1 + Math.min(2, Math.max(0, now - stat.last) / (interval * DAY_MS));
  }
  return isTrivialFact(key) ? w * TRIVIAL_FACTOR : w;
}

function pickKeys(state: PlayerState, pool: string[], count: number, rng: Rng, used: Set<string>, now: number): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    // Spoje násobilky se v lekci neopakují, dokud je z čeho brát. Typy sčítání
    // se opakovat můžou (pokaždé se vygeneruje jiný příklad).
    const fresh = pool.filter((k) => !used.has(k));
    const candidates = fresh.length > 0 ? fresh : pool;
    const key = weightedPick(rng, candidates, (k) => weightFor(state, k, now));
    used.add(key);
    keys.push(key);
  }
  return keys;
}

/** Sestaví lekci: 70 % z aktuální úrovně, 30 % opakování z dřívějších úrovní stejné větve. */
export function buildLesson(
  state: PlayerState,
  branch: BranchId,
  level: number,
  rng: Rng = defaultRng,
  size = LESSON_SIZE,
  now = Date.now(),
): Problem[] {
  const def = getBranch(branch);
  const current = def.levels[level - 1];
  if (!current) throw new Error(`Úroveň ${level} neexistuje.`);

  const earlier = def.levels
    .filter((l) => l.n < level && levelProgress(state, branch, l.n).plays > 0)
    .flatMap((l) => l.pool);
  const reviewPool = Array.from(new Set(earlier));

  const reviewCount = reviewPool.length > 0 ? Math.round(size * (1 - CURRENT_SHARE)) : 0;
  const used = new Set<string>();
  const keys = [
    ...pickKeys(state, current.pool, size - reviewCount, rng, used, now),
    ...pickKeys(state, reviewPool, reviewCount, rng, used, now),
  ];

  // zamíchat, ale aby nešly dva stejné typy hned po sobě, pokud to jde
  const shuffled = keys
    .map((k) => ({ k, r: rng() }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.k);
  for (let i = 1; i < shuffled.length; i++) {
    if (shuffled[i] === shuffled[i - 1]) {
      const j = shuffled.findIndex((k, idx) => idx > i && k !== shuffled[i]);
      if (j > 0) [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }

  const problems: Problem[] = [];
  for (const key of shuffled) {
    let p = makeProblem(key, rng);
    // vyhnout se úplně stejnému zadání dvakrát v jedné lekci
    for (let tries = 0; tries < 5 && problems.some((q) => q.display === p.display); tries++) p = makeProblem(key, rng);
    problems.push(p);
  }
  return problems;
}
