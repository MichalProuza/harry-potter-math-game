import { describe, expect, it } from 'vitest';
import { buildLesson, weightFor } from '../src/game/lesson';
import { BRANCHES, LESSONS_TO_PASS } from '../src/game/levels';
import { ADD_SUB_GENERATORS, factKeys, makeProblem } from '../src/game/problems';
import { seededRng } from '../src/game/random';
import { type Answer, FLUENT_MS, applyLesson, applyPractice, buyItem, newState, normalizeState, unlockedUpTo, updateStat, weakestKeys } from '../src/game/state';

/** Spočítá zadání `display`, kde `?` nahradí odpověď, a ověří rovnost. */
function holds(display: string, answer: number): boolean {
  const [left, right] = display.replace('?', String(answer)).replace(/−/g, '-').replace(/·/g, '*').replace(/:/g, '/').split('=');
  // eslint-disable-next-line no-new-func
  return Function(`return (${left}) === (${right})`)() as boolean;
}

describe('příklady', () => {
  const rng = seededRng(42);

  it('sčítání a odčítání: správný výsledek a rozsah 0–100', () => {
    for (const [key, gen] of Object.entries(ADD_SUB_GENERATORS)) {
      for (let i = 0; i < 2000; i++) {
        const p = gen(rng);
        expect(p.key).toBe(key);
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(p.answer).toBeLessThanOrEqual(100);
        const numbers = p.display.match(/\d+/g)!.map(Number);
        for (const n of numbers) expect(n).toBeLessThanOrEqual(100);
        expect(holds(p.display, p.answer), p.display).toBe(true);
        expect(p.hint.length).toBeGreaterThan(0);
      }
    }
  });

  it('přechod přes desítku opravdu nastává jen tam, kde má', () => {
    for (let i = 0; i < 1000; i++) {
      const [a, b] = ADD_SUB_GENERATORS.add21(rng).display.match(/\d+/g)!.map(Number);
      expect((a % 10) + b).toBeLessThan(10);
      const [c, d] = ADD_SUB_GENERATORS.add21c(rng).display.match(/\d+/g)!.map(Number);
      expect((c % 10) + d).toBeGreaterThan(10);
      const [e, f] = ADD_SUB_GENERATORS.sub22c(rng).display.match(/\d+/g)!.map(Number);
      expect(f % 10).toBeGreaterThan(e % 10);
    }
  });

  it('všechny klíče ve všech úrovních jdou vygenerovat a sedí', () => {
    for (const branch of BRANCHES) {
      for (const level of branch.levels) {
        for (const key of level.pool) {
          const p = makeProblem(key, rng);
          expect(holds(p.display, p.answer), `${key}: ${p.display}`).toBe(true);
        }
      }
    }
  });
});

describe('lekce', () => {
  it('má 10 příkladů a u násobilky se neopakují', () => {
    const lesson = buildLesson(newState(), 'formule', 5, seededRng(1));
    expect(lesson).toHaveLength(10);
    expect(new Set(lesson.map((p) => p.key)).size).toBe(10);
  });

  it('slabé příklady chodí častěji', () => {
    const state = newState();
    const now = Date.now();
    for (const k of factKeys('m', [7])) state.stats[k] = { box: 5, seen: 5, correct: 5, last: now };
    state.stats['m7x8'] = { box: 1, seen: 5, correct: 1, last: now };
    let hits = 0;
    const rng = seededRng(7);
    for (let i = 0; i < 200; i++) if (buildLesson(state, 'formule', 5, rng, 1, now)[0].key === 'm7x8') hits++;
    expect(hits).toBeGreaterThan(50); // bez váhy by to bylo kolem 20
  });

  it('7 · 8 a 8 · 7 je jeden spoj', () => {
    expect(factKeys('m', [8])).toContain('m7x8');
    expect(factKeys('m', [8])).not.toContain('m8x7');
    expect(new Set(factKeys('m', [8, 9])).size).toBe(factKeys('m', [8, 9]).length);
    // dělení se neslučuje: 56 : 7 a 56 : 8 jsou různé spoje
    expect(factKeys('d', [8])).toContain('d8x7');
    const merged = normalizeState({
      stats: {
        m8x7: { box: 1, seen: 3, correct: 1, last: 10 },
        m7x8: { box: 4, seen: 4, correct: 4, last: 20 },
      },
    }).stats;
    expect(merged.m8x7).toBeUndefined();
    expect(merged.m7x8).toMatchObject({ box: 1, seen: 7, correct: 5, last: 20 });
  });

  it('dlouho neprocvičený příklad má větší váhu', () => {
    const state = newState();
    const now = 100 * 86_400_000;
    state.stats.m6x7 = { box: 4, seen: 4, correct: 4, last: now };
    state.stats.m6x8 = { box: 4, seen: 4, correct: 4, last: now - 30 * 86_400_000 };
    expect(weightFor(state, 'm6x8', now)).toBeCloseTo(3 * weightFor(state, 'm6x7', now));
  });

  it('spoje s 1 a 10 mají menší váhu', () => {
    const state = newState();
    expect(weightFor(state, 'm1x7', 0)).toBeLessThan(weightFor(state, 'm6x7', 0) / 2);
    expect(weightFor(state, 'd10x4', 0)).toBeLessThan(weightFor(state, 'd6x4', 0) / 2);
  });
});

describe('zvládnutí příkladů', () => {
  const fast: Answer = { key: 'm6x7', correct: true, ms: 2500 };

  it('spoj postupuje jen po rychlé odpovědi bez nápovědy', () => {
    let stat = updateStat('m6x7', undefined, fast, 1);
    expect(stat.box).toBe(2);
    stat = updateStat('m6x7', stat, { ...fast, ms: FLUENT_MS + 1 }, 2);
    expect(stat.box).toBe(2);
    stat = updateStat('m6x7', stat, { ...fast, hinted: true }, 3);
    expect(stat.box).toBe(2);
    expect(stat).toMatchObject({ seen: 3, correct: 3 });
    stat = updateStat('m6x7', stat, fast, 4);
    expect(stat.box).toBe(3);
    stat = updateStat('m6x7', stat, { ...fast, correct: false }, 5);
    expect(stat.box).toBe(1);
  });

  it('typ sčítání: krabička podle posledních pokusů, ne podle jedné odpovědi', () => {
    const right: Answer = { key: 'add21c', correct: true };
    let stat = updateStat('add21c', undefined, right, 1);
    // čtyři správné odpovědi v jedné lekci ještě neznamenají „umím“
    for (let i = 0; i < 3; i++) stat = updateStat('add21c', stat, right, 1);
    expect(stat.box).toBe(3);
    for (let i = 0; i < 6; i++) stat = updateStat('add21c', stat, right, 1);
    expect(stat.box).toBe(5);
    // jedna chyba z deseti krabičku nevynuluje
    stat = updateStat('add21c', stat, { ...right, correct: false }, 1);
    expect(stat.box).toBe(5);
    stat = updateStat('add21c', stat, { ...right, correct: false }, 1);
    expect(stat.box).toBe(4);
    // odpověď s nápovědou se do úspěšnosti nepočítá
    const before = stat.recent;
    stat = updateStat('add21c', stat, { ...right, hinted: true }, 1);
    expect(stat.recent).toBe(before);
    expect(stat.seen).toBe(13);
  });

  it('rodič vidí chyby a pomalé spoje, ne správné odpovědi z prvních pokusů', () => {
    let state = newState();
    const answers: Answer[] = [
      { key: 'add20', correct: true },
      { key: 'add20', correct: true },
      { key: 'm6x7', correct: true, ms: 15_000 },
      { key: 'm6x8', correct: false, ms: 3000 },
    ];
    state = applyLesson(state, { branch: 'formule', level: 4, answers }).state;
    state = applyLesson(state, { branch: 'formule', level: 4, answers }).state;
    expect(weakestKeys(state).map((w) => w.key).sort()).toEqual(['m6x7', 'm6x8']);
  });
});

describe('postup a odměny', () => {
  const result = (right: number, wrong: number): Answer[] => [
    ...Array.from({ length: right }, (_, i) => ({ key: `k${i}`, correct: true })),
    ...Array.from({ length: wrong }, (_, i) => ({ key: `w${i}`, correct: false })),
  ];

  it('úroveň se odemkne po třech úspěšných lekcích', () => {
    let state = newState();
    expect(unlockedUpTo(state, 'premenovani')).toBe(1);
    for (let i = 0; i < LESSONS_TO_PASS; i++) {
      const out = applyLesson(state, { branch: 'premenovani', level: 1, answers: result(9, 1) });
      state = out.state;
      expect(out.newlyUnlocked).toBe(i === LESSONS_TO_PASS - 1 ? 2 : null);
    }
    expect(unlockedUpTo(state, 'premenovani')).toBe(2);
  });

  it('neúspěšná lekce nic nebere a nepočítá se do odemčení', () => {
    const out = applyLesson(newState(), { branch: 'lektvary', level: 1, answers: result(4, 6) });
    expect(out.passed).toBe(false);
    expect(out.coins).toBeGreaterThan(0);
    expect(out.state.progress.lektvary[1].passed).toBe(0);
  });

  it('denní bonus a série dní', () => {
    const day1 = new Date(2026, 10, 8, 17);
    const day2 = new Date(2026, 10, 9, 17);
    const r = { branch: 'lektvary' as const, level: 1, answers: result(10, 0) };
    const a = applyLesson(newState(), r, {}, day1);
    expect(a.dailyBonus).toBe(true);
    expect(a.coins).toBe(10 + 5 + 10 + 10);
    const b = applyLesson(a.state, r, {}, day1);
    expect(b.dailyBonus).toBe(false);
    const c = applyLesson(b.state, r, {}, day2);
    expect(c.streak).toBe(2);
  });

  it('nedokončená lekce se započítá jen do statistik příkladů', () => {
    const before = newState();
    const after = applyPractice(before, [
      { key: 'm6x7', correct: true, ms: 2000 },
      { key: 'm6x8', correct: false, ms: 2000 },
    ]);
    expect(after.stats.m6x7.box).toBe(2);
    expect(after.stats.m6x8.box).toBe(1);
    expect(after).toMatchObject({ coins: 0, xp: 0, lessonsTotal: 0, streak: before.streak, progress: before.progress });
    expect(before.stats).toEqual({});
  });

  it('rodič může odemknout úroveň ručně', () => {
    expect(unlockedUpTo(newState(), 'premenovani', { premenovani: 5 })).toBe(5);
  });

  it('obchod: nákup odečte galeony a věc rovnou nasadí', () => {
    const s = { ...newState(), coins: 50 };
    const after = buyItem(s, 'wand-oak');
    expect(after.coins).toBe(10);
    expect(after.equipped.wand).toBe('wand-oak');
    expect(() => buyItem(after, 'pet-dragon')).toThrow();
  });
});

describe('koleje', () => {
  it('profily z první verze dostanou odpovídající kolej', () => {
    expect(normalizeState({ house: 'fenix' }).house).toBe('nebelvir');
    expect(normalizeState({ house: 'sova' }).house).toBe('havraspar');
    expect(normalizeState({ house: 'drak' }).house).toBe('zmijozel');
    expect(normalizeState({ house: 'jednorozec' }).house).toBe('mrzimor');
    expect(normalizeState({ house: 'mrzimor' }).house).toBe('mrzimor');
    expect(normalizeState({}).house).toBe(null);
  });
});
