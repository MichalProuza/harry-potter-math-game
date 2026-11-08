export type Slot = 'wand' | 'hat' | 'cloak' | 'scarf' | 'glasses' | 'pet' | 'broom';

export interface ShopItem {
  id: string;
  slot: Slot;
  name: string;
  description: string;
  price: number;
  /** Barvy a vzhled pro vykreslení postavy. */
  look: { color?: string; accent?: string; emoji?: string; glow?: boolean };
}

export const SLOT_NAMES: Record<Slot, string> = {
  wand: 'Hůlky',
  hat: 'Klobouky',
  cloak: 'Pláště',
  scarf: 'Šály',
  glasses: 'Brýle',
  pet: 'Mazlíčci',
  broom: 'Košťata',
};

export const SHOP_ITEMS: ShopItem[] = [
  // hůlky
  { id: 'wand-school', slot: 'wand', name: 'Školní hůlka', description: 'Dostane ji každý prvňáček.', price: 0, look: { color: '#8b5a2b' } },
  { id: 'wand-oak', slot: 'wand', name: 'Dubová hůlka', description: 'Dub a žíně jednorožce. Pevná a spolehlivá.', price: 40, look: { color: '#a0703c', accent: '#f4f1e8' } },
  { id: 'wand-holly', slot: 'wand', name: 'Cesmínová hůlka', description: 'Cesmína a pero fénixe. Hřeje v ruce.', price: 90, look: { color: '#5b3a1e', accent: '#ff8a3d' } },
  { id: 'wand-ebony', slot: 'wand', name: 'Ebenová hůlka', description: 'Eben a dračí srdce. Pro odvážné kouzelnice.', price: 160, look: { color: '#1e1a1a', accent: '#c0392b' } },
  { id: 'wand-crystal', slot: 'wand', name: 'Křišťálová hůlka', description: 'Svítí ve tmě a třpytí se.', price: 260, look: { color: '#bfe6ff', accent: '#ffffff', glow: true } },
  // klobouky
  { id: 'hat-pointy', slot: 'hat', name: 'Špičatý klobouk', description: 'Klasika každé kouzelnice.', price: 30, look: { color: '#2b2140', accent: '#c9a227' } },
  { id: 'hat-star', slot: 'hat', name: 'Hvězdný klobouk', description: 'Posetý zlatými hvězdičkami.', price: 90, look: { color: '#1f2a6b', accent: '#ffd54a' } },
  { id: 'hat-crown', slot: 'hat', name: 'Kouzelná korunka', description: 'Pro mistryni počtů.', price: 220, look: { color: '#f2c94c', accent: '#e74c8b' } },
  // pláště
  { id: 'cloak-velvet', slot: 'cloak', name: 'Sametový plášť', description: 'Měkký jako kočičí kožíšek.', price: 70, look: { color: '#7b1e3a', accent: '#f2c94c' } },
  { id: 'cloak-night', slot: 'cloak', name: 'Plášť noční oblohy', description: 'Na plášti se třpytí souhvězdí.', price: 140, look: { color: '#141a3c', accent: '#ffe27a' } },
  { id: 'cloak-gold', slot: 'cloak', name: 'Slavnostní zlatý hábit', description: 'Na velkou hostinu ve Velké síni.', price: 240, look: { color: '#c9a227', accent: '#fff3c4' } },
  // šály
  { id: 'scarf-house', slot: 'scarf', name: 'Šála koleje', description: 'Pruhovaná šála v barvách tvé koleje.', price: 20, look: {} },
  { id: 'scarf-rainbow', slot: 'scarf', name: 'Duhová šála', description: 'Upletená z duhy po bouřce.', price: 80, look: { color: 'rainbow' } },
  // brýle
  { id: 'glasses-round', slot: 'glasses', name: 'Kulaté brýle', description: 'Pro bystrý pohled.', price: 25, look: { color: '#222' } },
  { id: 'glasses-star', slot: 'glasses', name: 'Hvězdičkové brýle', description: 'Všechno vidíš jako kouzelné.', price: 60, look: { color: '#e74c8b' } },
  // mazlíčci
  { id: 'pet-toad', slot: 'pet', name: 'Ropucha', description: 'Kváká, když odpovíš správně.', price: 60, look: { emoji: '🐸' } },
  { id: 'pet-cat', slot: 'pet', name: 'Kočka', description: 'Chytrá a trochu líná.', price: 120, look: { emoji: '🐈‍⬛' } },
  { id: 'pet-owl', slot: 'pet', name: 'Sova', description: 'Nosí dopisy a moudré rady.', price: 180, look: { emoji: '🦉' } },
  { id: 'pet-dragon', slot: 'pet', name: 'Dráček', description: 'Vzácný mazlíček pro opravdové mistry.', price: 400, look: { emoji: '🐉' } },
  // košťata
  { id: 'broom-school', slot: 'broom', name: 'Školní koště', description: 'Na první lekce létání.', price: 80, look: { color: '#8b5a2b', accent: '#d9b26a' } },
  { id: 'broom-fast', slot: 'broom', name: 'Rychlé koště', description: 'Předletí i sovu.', price: 180, look: { color: '#5b2a86', accent: '#e7b53b' } },
  { id: 'broom-lightning', slot: 'broom', name: 'Bleskové koště', description: 'Nejrychlejší koště v celé škole.', price: 350, look: { color: '#111', accent: '#ffd54a', glow: true } },
];

export const STARTER_ITEMS = ['wand-school'];

export function getItem(id: string | undefined): ShopItem | undefined {
  return id ? SHOP_ITEMS.find((i) => i.id === id) : undefined;
}
