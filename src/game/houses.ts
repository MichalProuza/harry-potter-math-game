export type HouseId = 'fenix' | 'sova' | 'drak' | 'jednorozec';

export interface House {
  id: HouseId;
  name: string;
  trait: string;
  icon: string;
  primary: string;
  secondary: string;
}

/** Vlastní koleje inspirované kouzelnickou školou (bez oficiálních názvů). */
export const HOUSES: House[] = [
  { id: 'fenix', name: 'Kolej Fénixe', trait: 'odvaha a srdce', icon: '🔥', primary: '#a4232f', secondary: '#e7b53b' },
  { id: 'sova', name: 'Kolej Sovy', trait: 'moudrost a zvídavost', icon: '🦉', primary: '#1f4f99', secondary: '#c8a26a' },
  { id: 'drak', name: 'Kolej Draka', trait: 'odhodlání a důvtip', icon: '🐉', primary: '#1d6b45', secondary: '#c0c6cc' },
  {
    id: 'jednorozec',
    name: 'Kolej Jednorožce',
    trait: 'laskavost a věrnost',
    icon: '🦄',
    primary: '#6b3fa0',
    secondary: '#f2c94c',
  },
];

export function getHouse(id: HouseId): House {
  return HOUSES.find((h) => h.id === id) ?? HOUSES[0];
}

/** Otázky moudrého klobouku. Každá odpověď dává bod jedné koleji. */
export const SORTING_QUESTIONS: Array<{ q: string; answers: Array<{ text: string; house: HouseId }> }> = [
  {
    q: 'Co bys nejraději dělala v kouzelnické škole?',
    answers: [
      { text: 'Létala na koštěti', house: 'fenix' },
      { text: 'Četla staré knihy kouzel', house: 'sova' },
      { text: 'Vařila tajné lektvary', house: 'drak' },
      { text: 'Starala se o kouzelná zvířata', house: 'jednorozec' },
    ],
  },
  {
    q: 'Jaké kouzlo by ses chtěla naučit jako první?',
    answers: [
      { text: 'Štít proti zlým kouzlům', house: 'fenix' },
      { text: 'Kouzlo, které odpoví na každou otázku', house: 'sova' },
      { text: 'Kouzlo neviditelnosti', house: 'drak' },
      { text: 'Kouzlo, které uzdraví kamaráda', house: 'jednorozec' },
    ],
  },
  {
    q: 'Na výletě v Zakázaném lese najdeš tajné dveře. Co uděláš?',
    answers: [
      { text: 'Hned je otevřu!', house: 'fenix' },
      { text: 'Prozkoumám nápis na dveřích', house: 'sova' },
      { text: 'Vymyslím chytrý plán', house: 'drak' },
      { text: 'Zavolám kamarády, ať jdeme spolu', house: 'jednorozec' },
    ],
  },
];
