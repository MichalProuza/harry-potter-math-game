import { type Rng, randInt } from './random';

/** Jeden příklad. `display` obsahuje `?` na místě, kam se píše odpověď. */
export interface Problem {
  /** Klíč pro statistiky zvládnutí (konkrétní spoj u násobilky, typ příkladu u sčítání). */
  key: string;
  display: string;
  answer: number;
  /** Kroky postupu. První krok slouží jako nápověda před odpovědí. */
  hint: string[];
}

const MINUS = '−';
const TIMES = '·';

function desitky(n: number): string {
  if (n === 1) return '1 desítka';
  if (n >= 2 && n <= 4) return `${n} desítky`;
  return `${n} desítek`;
}

// ---------------------------------------------------------------- postupy

export function addHint(a: number, b: number): string[] {
  const s = a + b;
  if (a % 10 === 0 && b % 10 === 0) {
    return [`${desitky(a / 10)} + ${desitky(b / 10)} = ${desitky(s / 10)}`, `${a} + ${b} = ${s}`];
  }
  if (b >= 10) {
    const tens = b - (b % 10);
    const mid = a + tens;
    if (b % 10 === 0) return [`Přičti jen desítky: ${a} + ${tens} = ${s}`];
    return [`Nejdřív desítky: ${a} + ${tens} = ${mid}`, `Pak jednotky: ${mid} + ${b % 10} = ${s}`];
  }
  const u = a % 10;
  if (u + b > 10) {
    const to = 10 - u;
    return [`Doplň do desítky: ${a} + ${to} = ${a + to}`, `Přičti zbytek: ${a + to} + ${b - to} = ${s}`];
  }
  if (u + b === 10) return [`${u} + ${b} = 10, takže ${a} + ${b} = ${s}`];
  if (a < 10) return [`Začni u ${a} a přičítej po jedné ${b}krát.`, `${a} + ${b} = ${s}`];
  return [`Sečti jednotky: ${u} + ${b} = ${u + b}`, `Desítky zůstávají: ${a} + ${b} = ${s}`];
}

export function subHint(a: number, b: number): string[] {
  const d = a - b;
  if (a % 10 === 0 && b % 10 === 0) {
    return [`${desitky(a / 10)} ${MINUS} ${desitky(b / 10)} = ${desitky(d / 10)}`, `${a} ${MINUS} ${b} = ${d}`];
  }
  if (b >= 10) {
    const tens = b - (b % 10);
    const mid = a - tens;
    if (b % 10 === 0) return [`Odečti jen desítky: ${a} ${MINUS} ${tens} = ${d}`];
    return [`Nejdřív desítky: ${a} ${MINUS} ${tens} = ${mid}`, `Pak jednotky: ${mid} ${MINUS} ${b % 10} = ${d}`];
  }
  const u = a % 10;
  if (b > u) {
    if (u === 0) {
      return [
        `Rozlož ${a} na ${a - 10} a 10.`,
        `10 ${MINUS} ${b} = ${10 - b}, takže ${a - 10} + ${10 - b} = ${d}`,
      ];
    }
    return [`Odečti do desítky: ${a} ${MINUS} ${u} = ${a - u}`, `Odečti zbytek: ${a - u} ${MINUS} ${b - u} = ${d}`];
  }
  if (a <= 10) return [`Začni u ${a} a ubírej po jedné ${b}krát.`, `${a} ${MINUS} ${b} = ${d}`];
  return [`Odečti jednotky: ${u} ${MINUS} ${b} = ${u - b}`, `Desítky zůstávají: ${a} ${MINUS} ${b} = ${d}`];
}

export function mulHint(a: number, b: number): string[] {
  const p = a * b;
  if (b === 1 || a === 1) return ['Krát 1 se číslo nezmění.', `${a} ${TIMES} ${b} = ${p}`];
  if (b === 10 || a === 10) return ['Krát 10: připiš k číslu nulu.', `${a} ${TIMES} ${b} = ${p}`];
  if (b <= 5) {
    const sums = Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ');
    return [`${b}krát ${a} je ${Array(b).fill(a).join(' + ')}`, `Počítej: ${sums}`];
  }
  return [
    `Rozděl to: ${a} ${TIMES} 5 = ${a * 5}`,
    `a ještě ${a} ${TIMES} ${b - 5} = ${a * (b - 5)}`,
    `${a * 5} + ${a * (b - 5)} = ${p}`,
  ];
}

function divHint(a: number, b: number): string[] {
  const n = a * b;
  if (a === 1) return ['Když dělíš jedničkou, číslo se nezmění.', `${n} : 1 = ${b}`];
  if (a === 10) return ['Když dělíš deseti, uber nulu na konci.', `${n} : 10 = ${b}`];
  return [
    `Kolikrát se ${a} vejde do ${n}? Vzpomeň si na násobilku ${a}.`,
    `${a} ${TIMES} ${b} = ${n}`,
    `Takže ${n} : ${a} = ${b}`,
  ];
}

function tableHint(a: number, b: number): string[] {
  const row = Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ');
  return [`Kolikrát ${a} je ${a * b}? Vyjmenuj násobilku ${a}.`, row, `${a} ${TIMES} ${b} = ${a * b}`];
}

// ------------------------------------------------- sčítání a odčítání

type Gen = (rng: Rng) => Problem;

function add(key: string, a: number, b: number): Problem {
  return { key, display: `${a} + ${b} = ?`, answer: a + b, hint: addHint(a, b) };
}
function sub(key: string, a: number, b: number): Problem {
  return { key, display: `${a} ${MINUS} ${b} = ?`, answer: a - b, hint: subHint(a, b) };
}

/** Generátory typů příkladů na sčítání a odčítání. Všechny výsledky jsou v rozsahu 0–100. */
export const ADD_SUB_GENERATORS: Record<string, Gen> = {
  // do 20
  add20: (r) => {
    const a = randInt(r, 2, 15);
    return add('add20', a, randInt(r, 2, 20 - a));
  },
  sub20: (r) => {
    const a = randInt(r, 5, 20);
    return sub('sub20', a, randInt(r, 2, a - 1));
  },
  // celé desítky
  addTens: (r) => {
    const a = randInt(r, 1, 8);
    return add('addTens', a * 10, randInt(r, 1, 10 - a) * 10);
  },
  subTens: (r) => {
    const a = randInt(r, 2, 10);
    return sub('subTens', a * 10, randInt(r, 1, a - 1) * 10);
  },
  // dvojciferné ± jednociferné bez přechodu
  add21: (r) => {
    const u = randInt(r, 0, 8);
    return add('add21', randInt(r, 1, 9) * 10 + u, randInt(r, 1, 9 - u));
  },
  sub21: (r) => {
    const u = randInt(r, 1, 9);
    return sub('sub21', randInt(r, 1, 9) * 10 + u, randInt(r, 1, u));
  },
  // dvojciferné ± jednociferné s přechodem
  add21c: (r) => {
    const u = randInt(r, 2, 9);
    return add('add21c', randInt(r, 1, 8) * 10 + u, randInt(r, 11 - u, 9));
  },
  sub21c: (r) => {
    const u = randInt(r, 0, 8);
    return sub('sub21c', randInt(r, 1, 9) * 10 + u, randInt(r, u + 1, 9));
  },
  // dvojciferné ± dvojciferné bez přechodu
  add22: (r) => {
    const t1 = randInt(r, 1, 8);
    const t2 = randInt(r, 1, 9 - t1);
    const u1 = randInt(r, 0, 8);
    const u2 = randInt(r, 1, 9 - u1);
    return add('add22', t1 * 10 + u1, t2 * 10 + u2);
  },
  sub22: (r) => {
    const t1 = randInt(r, 2, 9);
    const t2 = randInt(r, 1, t1 - 1);
    const u1 = randInt(r, 1, 9);
    const u2 = randInt(r, 0, u1);
    return sub('sub22', t1 * 10 + u1, t2 * 10 + u2);
  },
  // dvojciferné ± dvojciferné s přechodem
  add22c: (r) => {
    const t1 = randInt(r, 1, 7);
    const t2 = randInt(r, 1, 8 - t1);
    const u1 = randInt(r, 1, 9);
    const u2 = randInt(r, Math.max(1, 10 - u1), 9);
    return add('add22c', t1 * 10 + u1, t2 * 10 + u2);
  },
  sub22c: (r) => {
    const t1 = randInt(r, 2, 9);
    const t2 = randInt(r, 1, t1 - 1);
    const u1 = randInt(r, 0, 8);
    const u2 = randInt(r, u1 + 1, 9);
    return sub('sub22c', t1 * 10 + u1, t2 * 10 + u2);
  },
  // chybějící číslo
  missAdd: (r) => {
    const c = randInt(r, 20, 100);
    const a = randInt(r, 10, c - 5);
    return {
      key: 'missAdd',
      display: `${a} + ? = ${c}`,
      answer: c - a,
      hint: [`Kolik musíš přičíst k ${a}, aby vyšlo ${c}? Spočítej ${c} ${MINUS} ${a}.`, ...subHint(c, a)],
    };
  },
  missSub: (r) => {
    const b = randInt(r, 5, 60);
    const c = randInt(r, 5, 100 - b);
    return {
      key: 'missSub',
      display: `? ${MINUS} ${b} = ${c}`,
      answer: b + c,
      hint: [`Od jakého čísla odečteš ${b}, aby vyšlo ${c}? Spočítej ${c} + ${b}.`, ...addHint(c, b)],
    };
  },
  missSubtrahend: (r) => {
    const a = randInt(r, 20, 100);
    const c = randInt(r, 1, a - 5);
    return {
      key: 'missSubtrahend',
      display: `${a} ${MINUS} ? = ${c}`,
      answer: a - c,
      hint: [`Kolik musíš odečíst od ${a}, aby vyšlo ${c}? Spočítej ${a} ${MINUS} ${c}.`, ...subHint(a, c)],
    };
  },
};

// --------------------------------------------- násobení a dělení

const FACT_KEY = /^(m|mm|d)(\d+)x(\d+)$/;

export type FactKind = 'm' | 'mm' | 'd';

/** Rozebere klíč spoje násobilky nebo dělení. U typů sčítání a odčítání vrací null. */
export function parseFactKey(key: string): { kind: FactKind; a: number; b: number } | null {
  const m = FACT_KEY.exec(key);
  return m ? { kind: m[1] as FactKind, a: Number(m[2]), b: Number(m[3]) } : null;
}

/**
 * Sjednotí klíč spoje. 7 · 8 a 8 · 7 je jeden spoj, proto má násobení vždy
 * menší činitel první (`m7x8`). U dělení a chybějícího činitele na pořadí záleží.
 */
export function canonicalKey(key: string): string {
  const f = parseFactKey(key);
  if (!f || f.kind !== 'm' || f.a <= f.b) return key;
  return `m${f.b}x${f.a}`;
}

/** Spoje s 1 a 10 jsou snadné, v lekcích se objevují méně často. */
export function isTrivialFact(key: string): boolean {
  const f = parseFactKey(key);
  return !!f && (f.a === 1 || f.a === 10 || f.b === 1 || f.b === 10);
}

/** Klíče spojů: `m7x8` = 7 · 8, `mm7x8` = 7 · ? = 56, `d7x8` = 56 : 7. */
export function factKeys(prefix: FactKind, tables: number[]): string[] {
  const keys = tables.flatMap((a) => Array.from({ length: 10 }, (_, i) => canonicalKey(`${prefix}${a}x${i + 1}`)));
  return Array.from(new Set(keys));
}

function factProblem(key: string, rng: Rng): Problem {
  const f = parseFactKey(key);
  if (!f) throw new Error(`Neznámý klíč příkladu: ${key}`);
  const { kind, a, b } = f;
  if (kind === 'm') {
    // pořadí činitelů se střídá, postup odpovídá zobrazenému zadání
    const [x, y] = rng() < 0.5 ? [b, a] : [a, b];
    return { key, display: `${x} ${TIMES} ${y} = ?`, answer: a * b, hint: mulHint(x, y) };
  }
  if (kind === 'mm') {
    return { key, display: `${a} ${TIMES} ? = ${a * b}`, answer: b, hint: tableHint(a, b) };
  }
  return { key, display: `${a * b} : ${a} = ?`, answer: b, hint: divHint(a, b) };
}

/** Vytvoří příklad podle klíče (typ příkladu nebo konkrétní spoj). */
export function makeProblem(key: string, rng: Rng): Problem {
  const gen = ADD_SUB_GENERATORS[key];
  return gen ? gen(rng) : factProblem(key, rng);
}
