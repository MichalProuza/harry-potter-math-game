export type HouseId = 'nebelvir' | 'havraspar' | 'zmijozel' | 'mrzimor';

/** Původní označení kolejí z první verze hry – převádějí se na nová. */
const LEGACY_IDS: Record<string, HouseId> = {
  fenix: 'nebelvir',
  sova: 'havraspar',
  drak: 'zmijozel',
  jednorozec: 'mrzimor',
};

/** Vrátí platné ID koleje (převede i označení z první verze), nebo null. */
export function toHouseId(id: unknown): HouseId | null {
  if (typeof id !== 'string') return null;
  if (id in LEGACY_IDS) return LEGACY_IDS[id];
  return HOUSES.some((h) => h.id === id) ? (id as HouseId) : null;
}

export interface House {
  id: HouseId;
  name: string;
  trait: string;
  icon: string;
  primary: string;
  secondary: string;
}

export const HOUSES: House[] = [
  { id: 'nebelvir', name: 'Nebelvír', trait: 'odvaha a statečnost', icon: '🦁', primary: '#9c1c26', secondary: '#e3b23c' },
  { id: 'havraspar', name: 'Havraspár', trait: 'moudrost a důvtip', icon: '🦅', primary: '#1f3f8a', secondary: '#b08d57' },
  { id: 'zmijozel', name: 'Zmijozel', trait: 'ctižádost a odhodlání', icon: '🐍', primary: '#1a5c38', secondary: '#c0c6cc' },
  { id: 'mrzimor', name: 'Mrzimor', trait: 'věrnost a laskavost', icon: '🦡', primary: '#d9a21b', secondary: '#2b2522' },
];

export function getHouse(id: HouseId | string): House {
  const hid = toHouseId(id);
  return HOUSES.find((h) => h.id === hid) ?? HOUSES[0];
}

/** Otázky moudrého klobouku. Každá odpověď dává bod jedné koleji. */
export const SORTING_QUESTIONS: Array<{ q: string; answers: Array<{ text: string; house: HouseId }> }> = [
  {
    q: 'Co bys nejraději dělala v kouzelnické škole?',
    answers: [
      { text: 'Létala na koštěti', house: 'nebelvir' },
      { text: 'Četla staré knihy kouzel', house: 'havraspar' },
      { text: 'Vařila tajné lektvary', house: 'zmijozel' },
      { text: 'Starala se o kouzelná zvířata', house: 'mrzimor' },
    ],
  },
  {
    q: 'Jaké kouzlo by ses chtěla naučit jako první?',
    answers: [
      { text: 'Štít proti zlým kouzlům', house: 'nebelvir' },
      { text: 'Kouzlo, které odpoví na každou otázku', house: 'havraspar' },
      { text: 'Kouzlo neviditelnosti', house: 'zmijozel' },
      { text: 'Kouzlo, které uzdraví kamaráda', house: 'mrzimor' },
    ],
  },
  {
    q: 'Na výletě v Zakázaném lese najdeš tajné dveře. Co uděláš?',
    answers: [
      { text: 'Hned je otevřu!', house: 'nebelvir' },
      { text: 'Prozkoumám nápis na dveřích', house: 'havraspar' },
      { text: 'Vymyslím chytrý plán', house: 'zmijozel' },
      { text: 'Zavolám kamarády, ať jdeme spolu', house: 'mrzimor' },
    ],
  },
];
