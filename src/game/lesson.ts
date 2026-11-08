import { type BranchId, LESSON_SIZE, getBranch } from './levels';
import { type Problem, makeProblem } from './problems';
import { type Rng, defaultRng, weightedPick } from './random';
import { type PlayerState, levelProgress } from './state';

/** Podíl příkladů z aktuální úrovně; zbytek je opakování starších úrovní. */
const CURRENT_SHARE = 0.7;

/** Váha výběru podle Leitnerovy krabičky – slabší příklady chodí častěji. */
function weightFor(state: PlayerState, key: string): number {
  const stat = state.stats[key];
  if (!stat) return 4;
  return [0, 6, 4, 2.5, 1.5, 1][stat.box] ?? 1;
}

function pickKeys(state: PlayerState, pool: string[], count: number, rng: Rng, used: Set<string>): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    // Spoje násobilky se v lekci neopakují, dokud je z čeho brát. Typy sčítání
    // se opakovat můžou (pokaždé se vygeneruje jiný příklad).
    const fresh = pool.filter((k) => !used.has(k));
    const candidates = fresh.length > 0 ? fresh : pool;
    const key = weightedPick(rng, candidates, (k) => weightFor(state, k));
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
    ...pickKeys(state, current.pool, size - reviewCount, rng, used),
    ...pickKeys(state, reviewPool, reviewCount, rng, used),
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
