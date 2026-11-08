import { describe, expect, it } from 'vitest';
import { buildLesson } from '../src/game/lesson';
import { BRANCHES, LESSONS_TO_PASS } from '../src/game/levels';
import { ADD_SUB_GENERATORS, makeProblem } from '../src/game/problems';
import { seededRng } from '../src/game/random';
import { applyLesson, buyItem, newState, unlockedUpTo } from '../src/game/state';

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
    for (let b = 1; b <= 10; b++) state.stats[`m7x${b}`] = { box: 5, seen: 5, correct: 5, last: 0 };
    state.stats['m7x8'] = { box: 1, seen: 5, correct: 1, last: 0 };
    let hits = 0;
    const rng = seededRng(7);
    for (let i = 0; i < 200; i++) if (buildLesson(state, 'formule', 5, rng, 1)[0].key === 'm7x8') hits++;
    expect(hits).toBeGreaterThan(50); // bez váhy by to bylo kolem 20
  });
});

describe('postup a odměny', () => {
  const ok = (n: number) => Array.from({ length: n }, (_, i) => `k${i}`);

  it('úroveň se odemkne po třech úspěšných lekcích', () => {
    let state = newState();
    expect(unlockedUpTo(state, 'premenovani')).toBe(1);
    for (let i = 0; i < LESSONS_TO_PASS; i++) {
      const out = applyLesson(state, { branch: 'premenovani', level: 1, correctKeys: ok(9), wrongKeys: ['x'] });
      state = out.state;
      expect(out.newlyUnlocked).toBe(i === LESSONS_TO_PASS - 1 ? 2 : null);
    }
    expect(unlockedUpTo(state, 'premenovani')).toBe(2);
  });

  it('neúspěšná lekce nic nebere a nepočítá se do odemčení', () => {
    const out = applyLesson(newState(), { branch: 'lektvary', level: 1, correctKeys: ok(4), wrongKeys: ok(6) });
    expect(out.passed).toBe(false);
    expect(out.coins).toBeGreaterThan(0);
    expect(out.state.progress.lektvary[1].passed).toBe(0);
  });

  it('denní bonus a série dní', () => {
    const day1 = new Date(2026, 10, 8, 17);
    const day2 = new Date(2026, 10, 9, 17);
    const r = { branch: 'lektvary' as const, level: 1, correctKeys: ok(10), wrongKeys: [] };
    const a = applyLesson(newState(), r, {}, day1);
    expect(a.dailyBonus).toBe(true);
    expect(a.coins).toBe(10 + 5 + 10 + 10);
    const b = applyLesson(a.state, r, {}, day1);
    expect(b.dailyBonus).toBe(false);
    const c = applyLesson(b.state, r, {}, day2);
    expect(c.streak).toBe(2);
  });

  it('rodič může odemknout úroveň ručně', () => {
    expect(unlockedUpTo(newState(), 'premenovani', { premenovani: 5 })).toBe(5);
  });

  it('obchod: nákup odečte zlaťáky a věc rovnou nasadí', () => {
    const s = { ...newState(), coins: 50 };
    const after = buyItem(s, 'wand-oak');
    expect(after.coins).toBe(10);
    expect(after.equipped.wand).toBe('wand-oak');
    expect(() => buyItem(after, 'pet-dragon')).toThrow();
  });
});
