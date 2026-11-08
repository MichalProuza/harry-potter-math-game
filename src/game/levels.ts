import { factKeys } from './problems';

export type BranchId = 'lektvary' | 'formule' | 'premenovani';

export interface LevelDef {
  /** Číslo úrovně v rámci větve, od 1. */
  n: number;
  title: string;
  example: string;
  /** Klíče příkladů, ze kterých se lekce skládá. */
  pool: string[];
}

export interface BranchDef {
  id: BranchId;
  name: string;
  subject: string;
  icon: string;
  color: string;
  /** Kolik úrovní je odemčeno od začátku (dcera chodí do 3. třídy). */
  startUnlocked: number;
  levels: LevelDef[];
}

/** Kolik úspěšných lekcí je potřeba ke zvládnutí úrovně. */
export const LESSONS_TO_PASS = 3;
/** Kolik příkladů má lekce. */
export const LESSON_SIZE = 10;
/** Minimální počet správných odpovědí na první pokus, aby lekce byla úspěšná. */
export const PASS_SCORE = 8;

const T = (...tables: number[]) => tables;

function levels(defs: Array<Omit<LevelDef, 'n'>>): LevelDef[] {
  return defs.map((d, i) => ({ ...d, n: i + 1 }));
}

const lektvary: BranchDef = {
  id: 'lektvary',
  name: 'Lektvary',
  subject: 'Sčítání a odčítání do 100',
  icon: '⚗️',
  color: '#3fae6a',
  startUnlocked: 3,
  levels: levels([
    { title: 'Rozcvička do 20', example: '8 + 7, 15 − 9', pool: ['add20', 'sub20'] },
    { title: 'Celé desítky', example: '30 + 40, 90 − 60', pool: ['addTens', 'subTens'] },
    { title: 'Bez přechodu přes desítku', example: '43 + 5, 47 − 3', pool: ['add21', 'sub21'] },
    { title: 'S přechodem přes desítku', example: '47 + 8, 52 − 7', pool: ['add21c', 'sub21c'] },
    { title: 'Dvojciferná čísla', example: '43 + 25, 68 − 23', pool: ['add22', 'sub22'] },
    { title: 'Dvojciferná s přechodem', example: '47 + 38, 72 − 29', pool: ['add22c', 'sub22c'] },
    { title: 'Chybějící číslo', example: '35 + ? = 62', pool: ['missAdd', 'missSub', 'missSubtrahend'] },
    {
      title: 'Mistrovská zkouška',
      example: 'všechno dohromady',
      pool: ['add21c', 'sub21c', 'add22', 'sub22', 'add22c', 'sub22c', 'missAdd', 'missSub', 'missSubtrahend'],
    },
  ]),
};

const formule: BranchDef = {
  id: 'formule',
  name: 'Kouzelné formule',
  subject: 'Malá násobilka',
  icon: '🪄',
  color: '#c9a227',
  startUnlocked: 3,
  levels: levels([
    { title: 'Násobení 2 a 10', example: '2 · 7, 10 · 4', pool: factKeys('m', T(2, 10)) },
    { title: 'Násobení 5', example: '5 · 6', pool: factKeys('m', T(5)) },
    { title: 'Násobení 3 a 4', example: '3 · 8, 4 · 7', pool: factKeys('m', T(3, 4)) },
    { title: 'Násobení 6', example: '6 · 7', pool: factKeys('m', T(6)) },
    { title: 'Násobení 7', example: '7 · 8', pool: factKeys('m', T(7)) },
    { title: 'Násobení 8 a 9', example: '8 · 6, 9 · 7', pool: factKeys('m', T(8, 9)) },
    { title: 'Míchaná násobilka', example: 'všechny řady', pool: factKeys('m', T(2, 3, 4, 5, 6, 7, 8, 9, 10)) },
    {
      title: 'Mistrovská zkouška',
      example: '7 · ? = 56',
      pool: [...factKeys('m', T(3, 4, 6, 7, 8, 9)), ...factKeys('mm', T(2, 3, 4, 5, 6, 7, 8, 9))],
    },
  ]),
};

const premenovani: BranchDef = {
  id: 'premenovani',
  name: 'Přeměňování',
  subject: 'Dělení v oboru násobilky',
  icon: '🔮',
  color: '#8a5cd0',
  startUnlocked: 1,
  levels: levels([
    { title: 'Dělení 2 a 10', example: '14 : 2, 40 : 10', pool: factKeys('d', T(2, 10)) },
    { title: 'Dělení 5', example: '35 : 5', pool: factKeys('d', T(5)) },
    { title: 'Dělení 3 a 4', example: '24 : 3, 28 : 4', pool: factKeys('d', T(3, 4)) },
    { title: 'Dělení 6', example: '42 : 6', pool: factKeys('d', T(6)) },
    { title: 'Dělení 7', example: '56 : 7', pool: factKeys('d', T(7)) },
    { title: 'Dělení 8 a 9', example: '48 : 8, 63 : 9', pool: factKeys('d', T(8, 9)) },
    { title: 'Míchané dělení', example: 'všechny řady', pool: factKeys('d', T(2, 3, 4, 5, 6, 7, 8, 9, 10)) },
    {
      title: 'Mistrovská zkouška',
      example: 'násobení i dělení',
      pool: [...factKeys('d', T(3, 4, 6, 7, 8, 9)), ...factKeys('m', T(3, 4, 6, 7, 8, 9))],
    },
  ]),
};

export const BRANCHES: BranchDef[] = [lektvary, formule, premenovani];

export function getBranch(id: BranchId): BranchDef {
  const b = BRANCHES.find((x) => x.id === id);
  if (!b) throw new Error(`Neznámá větev: ${id}`);
  return b;
}
