import type { ComponentChildren } from 'preact';
import { type HouseId, getHouse } from '../game/houses';
import type { BranchId } from '../game/levels';

/** Ručně kreslené obrázky hry (SVG), aby vypadaly stejně na všech zařízeních. */

export function StarShape({ x, y, r, fill, class: cls }: { x: number; y: number; r: number; fill: string; class?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} class={cls} />;
}

/** Čtyřcípá jiskra. */
export function Sparkle({ x, y, r, fill = '#ffe27a', class: cls }: { x: number; y: number; r: number; fill?: string; class?: string }) {
  const q = r * 0.22;
  return (
    <path
      class={cls}
      fill={fill}
      d={`M${x} ${y - r} L${x + q} ${y - q} L${x + r} ${y} L${x + q} ${y + q} L${x} ${y + r} L${x - q} ${y + q} L${x - r} ${y} L${x - q} ${y - q} Z`}
    />
  );
}

// ------------------------------------------------------------ galeon

export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg class="coin-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="10" fill="#9b7413" />
      <circle cx="12" cy="11.5" r="10" fill="#f2c230" />
      <circle cx="12" cy="11.5" r="7.4" fill="#ffe27a" />
      <path d="M5 8 A8.5 8.5 0 0 1 15 3.6" stroke="#fff6c8" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <StarShape x={12} y={11.8} r={4.6} fill="#d99a14" />
    </svg>
  );
}

// ------------------------------------------------------------ moudrý klobouk

export function SortingHat({ size = 150 }: { size?: number }) {
  return (
    <svg class="sorting-hat" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Moudrý klobouk">
      <ellipse cx="60" cy="112" rx="44" ry="5" fill="#000" opacity="0.3" />
      {/* krempa */}
      <path d="M4 96 Q20 82 60 86 Q100 82 116 96 Q100 110 60 108 Q20 110 4 96 Z" fill="#5a3619" />
      <path d="M8 94 Q24 82 60 85 Q96 82 112 94 Q96 103 60 101 Q24 103 8 94 Z" fill="#8a5a2e" />
      {/* kužel se zahnutou špičkou */}
      <path
        d="M24 92 Q28 62 44 40 Q56 22 72 13 Q88 5 100 16 Q88 13 82 24 Q76 36 82 54 Q92 76 96 92 Q60 102 24 92 Z"
        fill="#9a6835"
      />
      <path d="M72 13 Q88 5 100 16 Q88 13 82 24 Q76 36 82 54 Q92 76 96 92 Q84 96 72 97 Q80 60 66 40 Q62 26 72 13 Z" fill="#000" opacity="0.2" />
      <path d="M32 80 Q36 58 50 40" stroke="#fff" stroke-width="3" fill="none" opacity="0.14" stroke-linecap="round" />
      {/* záhyby */}
      <path d="M52 34 Q64 38 78 32" stroke="#5a3619" stroke-width="2.5" fill="none" stroke-linecap="round" />
      {/* obočí, oči, ústa ze záhybů */}
      <path d="M34 60 Q44 49 57 57" stroke="#4a2c12" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <path d="M65 57 Q78 49 88 60" stroke="#4a2c12" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <path d="M38 67 Q47 59 56 67 Q47 65 38 67 Z" fill="#2a1707" />
      <path d="M66 67 Q75 59 84 67 Q75 65 66 67 Z" fill="#2a1707" />
      <path d="M36 79 Q60 96 86 79 Q60 85 36 79 Z" fill="#2a1707" />
      {/* záplata */}
      <path d="M86 70 L96 74 L94 86 L84 82 Z" fill="#b8854a" />
      <path d="M86 70 L96 74 M94 86 L84 82" stroke="#4a2c12" stroke-width="1.2" stroke-dasharray="2 2" />
      <Sparkle x={104} y={34} r={6} class="twinkle" />
      <Sparkle x={18} y={46} r={4.5} class="twinkle twinkle--b" />
    </svg>
  );
}

// ------------------------------------------------------------ erby kolejí

function Lion() {
  const mane = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI / 6) * i;
    return <circle key={i} cx={50 + 21 * Math.cos(a)} cy={52 + 21 * Math.sin(a)} r="7.5" fill="#c9841c" />;
  });
  return (
    <g>
      {mane}
      <circle cx="50" cy="52" r="21" fill="#d9952a" />
      <circle cx="36" cy="38" r="5.5" fill="#f3c654" />
      <circle cx="64" cy="38" r="5.5" fill="#f3c654" />
      <circle cx="50" cy="54" r="16" fill="#f7d36b" />
      <ellipse cx="50" cy="61" rx="8" ry="6" fill="#fff1c2" />
      <circle cx="43" cy="51" r="2.4" fill="#3a1d10" />
      <circle cx="57" cy="51" r="2.4" fill="#3a1d10" />
      <path d="M46.5 57 H53.5 L50 61 Z" fill="#7a3418" />
      <path d="M50 61 V63.5 M50 63.5 Q46.5 67 44 64 M50 63.5 Q53.5 67 56 64" stroke="#7a3418" stroke-width="1.5" fill="none" stroke-linecap="round" />
    </g>
  );
}

function Eagle() {
  const wing = 'M44 48 Q30 30 12 34 Q18 38 16 44 Q22 43 21 50 Q27 49 27 56 Q33 55 34 62 Q40 60 44 66 Z';
  return (
    <g>
      <path d={wing} fill="#c9a063" />
      <path d={wing} fill="#c9a063" transform="translate(100 0) scale(-1 1)" />
      <path d="M44 72 L41 90 L50 84 L59 90 L56 72 Z" fill="#a8824a" />
      <ellipse cx="50" cy="60" rx="10" ry="16" fill="#d8b274" />
      <circle cx="50" cy="38" r="9.5" fill="#f4ead6" />
      <path d="M50 38 L58 44 Q52 50 48 45 Z" fill="#f2b632" />
      <circle cx="47" cy="36" r="1.9" fill="#1b1b2a" />
      <path d="M44 56 Q50 60 56 56 M44 63 Q50 67 56 63" stroke="#a8824a" stroke-width="1.6" fill="none" stroke-linecap="round" />
    </g>
  );
}

function Snake() {
  return (
    <g>
      <path
        d="M30 84 Q68 86 68 70 Q68 58 50 57 Q32 56 32 43 Q32 30 52 28"
        stroke="#d5dbe0"
        stroke-width="10"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M30 84 Q68 86 68 70 Q68 58 50 57 Q32 56 32 43 Q32 30 52 28"
        stroke="#8fa0a8"
        stroke-width="2"
        stroke-dasharray="1 7"
        fill="none"
        stroke-linecap="round"
      />
      <path d="M68 27 L77 23 M68 27 L77 30" stroke="#e24a4a" stroke-width="1.8" stroke-linecap="round" />
      <ellipse cx="57" cy="27" rx="11" ry="8" fill="#e6ebee" />
      <circle cx="60" cy="24.5" r="2.2" fill="#12301f" />
    </g>
  );
}

function Badger() {
  return (
    <g>
      <circle cx="31" cy="38" r="7" fill="#2b2522" />
      <circle cx="69" cy="38" r="7" fill="#2b2522" />
      <circle cx="31" cy="38" r="3.4" fill="#f5efe2" />
      <circle cx="69" cy="38" r="3.4" fill="#f5efe2" />
      <path d="M50 30 Q76 30 74 54 Q72 68 58 76 Q50 80 42 76 Q28 68 26 54 Q24 30 50 30 Z" fill="#f5efe2" stroke="#2b2522" stroke-width="2.5" />
      <path d="M33 34 Q44 32 46 46 L47 66 Q38 64 32 54 Q27 44 33 34 Z" fill="#2b2522" />
      <path d="M67 34 Q56 32 54 46 L53 66 Q62 64 68 54 Q73 44 67 34 Z" fill="#2b2522" />
      <circle cx="40" cy="51" r="2.6" fill="#fff" />
      <circle cx="60" cy="51" r="2.6" fill="#fff" />
      <ellipse cx="50" cy="71" rx="5" ry="3.6" fill="#2b2522" />
    </g>
  );
}

const EMBLEMS: Record<HouseId, () => ComponentChildren> = {
  nebelvir: Lion,
  havraspar: Eagle,
  zmijozel: Snake,
  mrzimor: Badger,
};

const SHIELD = 'M8 6 H92 V58 Q92 92 50 112 Q8 92 8 58 Z';

export function Crest({ house, size = 64 }: { house: HouseId | string; size?: number }) {
  const h = getHouse(house);
  const Emblem = EMBLEMS[h.id];
  return (
    <svg class="crest" width={size} height={size * 1.16} viewBox="0 0 100 116" role="img" aria-label={h.name}>
      <path d={SHIELD} fill={h.primary} />
      <path d="M50 6 H92 V58 Q92 92 50 112 Z" fill="#000" opacity="0.18" />
      <path d="M14 12 H50 V20 Q24 22 14 40 Z" fill="#fff" opacity="0.14" />
      <path d={SHIELD} fill="none" stroke={h.secondary} stroke-width="5" stroke-linejoin="round" />
      <path d="M14 12 H86 V57 Q86 87 50 105 Q14 87 14 57 Z" fill="none" stroke="#000" stroke-width="1" opacity="0.25" />
      <Emblem />
    </svg>
  );
}

// ------------------------------------------------------------ předměty

function Cauldron() {
  return (
    <g>
      <ellipse cx="32" cy="59" rx="19" ry="3" fill="#000" opacity="0.3" />
      <path d="M19 52 L15 60 M45 52 L49 60" stroke="#221d36" stroke-width="4" stroke-linecap="round" />
      <path d="M11 29 Q8 56 32 56 Q56 56 53 29 Z" fill="#3c3658" />
      <path d="M36 56 Q56 55 53 29 L44 29 Q48 48 36 56 Z" fill="#000" opacity="0.25" />
      <path d="M15 33 Q14 46 22 52" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.2" stroke-linecap="round" />
      <ellipse cx="32" cy="29" rx="24" ry="6.5" fill="#28233f" />
      <ellipse cx="32" cy="29" rx="19.5" ry="4.5" fill="#52d884" />
      <ellipse cx="27" cy="28" rx="7" ry="1.6" fill="#b4f7cb" opacity="0.7" />
      <circle class="bubble" cx="24" cy="18" r="4.2" fill="#7deaa4" />
      <circle class="bubble bubble--b" cx="37" cy="10" r="3" fill="#7deaa4" />
      <circle class="bubble bubble--c" cx="43" cy="20" r="2.2" fill="#b4f7cb" />
      <circle cx="22.8" cy="16.8" r="1.2" fill="#fff" opacity="0.8" />
    </g>
  );
}

function SpellWand() {
  return (
    <g>
      <path d="M12 54 L42 22" stroke="#7a4a22" stroke-width="6" stroke-linecap="round" />
      <path d="M12 54 L22 43" stroke="#4d2c12" stroke-width="7" stroke-linecap="round" />
      <path d="M38 26 L42 22" stroke="#fff6d8" stroke-width="6" stroke-linecap="round" />
      <path d="M14 51 L39 24" stroke="#fff" stroke-width="1.4" opacity="0.3" stroke-linecap="round" />
      <StarShape x={46} y={16} r={11} fill="#ffd54a" class="twinkle" />
      <StarShape x={46} y={16} r={5} fill="#fff6c8" />
      <Sparkle x={22} y={16} r={6} fill="#ffe27a" class="twinkle twinkle--b" />
      <Sparkle x={54} y={40} r={5} fill="#ffe27a" class="twinkle twinkle--c" />
      <circle cx="33" cy="8" r="1.6" fill="#fff6c8" />
    </g>
  );
}

function CrystalBall() {
  return (
    <g>
      <ellipse cx="32" cy="59" rx="19" ry="3" fill="#000" opacity="0.3" />
      <path d="M17 58 Q18 46 32 46 Q46 46 47 58 Z" fill="#c9a227" />
      <path d="M34 46 Q46 46 47 58 L38 58 Q40 50 34 46 Z" fill="#000" opacity="0.2" />
      <circle cx="32" cy="27" r="21" fill="#8a5cd0" />
      <circle cx="32" cy="27" r="21" fill="#c9a8ff" opacity="0.25" />
      <path d="M18 34 Q26 22 36 28 Q44 33 46 22" stroke="#e6d6ff" stroke-width="2.5" fill="none" opacity="0.75" stroke-linecap="round" />
      <path d="M22 40 Q30 34 40 39" stroke="#e6d6ff" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round" />
      <path d="M17 22 Q20 12 30 9" stroke="#fff" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round" />
      <Sparkle x={38} y={17} r={5} fill="#fff" class="twinkle" />
      <Sparkle x={25} y={30} r={3.5} fill="#fff" class="twinkle twinkle--b" />
    </g>
  );
}

const BRANCH_ART: Record<BranchId, () => ComponentChildren> = {
  lektvary: Cauldron,
  formule: SpellWand,
  premenovani: CrystalBall,
};

export function BranchIcon({ branch, size = 56 }: { branch: BranchId; size?: number }) {
  const Art = BRANCH_ART[branch];
  return (
    <svg class="branch-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <Art />
    </svg>
  );
}

// ------------------------------------------------------------ mazlíčci (kreslí se do čtverce 48 × 48)

function Toad() {
  return (
    <g>
      <ellipse cx="24" cy="34" rx="18" ry="12" fill="#5fbf4a" />
      <ellipse cx="24" cy="38" rx="11" ry="6.5" fill="#c8ef9b" />
      <ellipse cx="9" cy="43" rx="6.5" ry="3" fill="#4aa63a" />
      <ellipse cx="39" cy="43" rx="6.5" ry="3" fill="#4aa63a" />
      <circle cx="15" cy="22" r="6.5" fill="#5fbf4a" />
      <circle cx="33" cy="22" r="6.5" fill="#5fbf4a" />
      <circle cx="15" cy="22" r="4.2" fill="#fff" />
      <circle cx="33" cy="22" r="4.2" fill="#fff" />
      <circle cx="16" cy="22.5" r="2.2" fill="#22301c" />
      <circle cx="32" cy="22.5" r="2.2" fill="#22301c" />
      <path d="M14 33 Q24 40 34 33" stroke="#2f6e25" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <circle cx="10" cy="33" r="1.6" fill="#4aa63a" />
      <circle cx="38" cy="32" r="1.6" fill="#4aa63a" />
    </g>
  );
}

function Cat() {
  return (
    <g>
      <path d="M36 40 Q48 38 44 26 Q43 22 40 24" stroke="#453c63" stroke-width="4.5" fill="none" stroke-linecap="round" />
      <ellipse cx="23" cy="36" rx="12" ry="10.5" fill="#453c63" />
      <path d="M11 16 L12 4 L21 11 Z M35 16 L34 4 L25 11 Z" fill="#453c63" />
      <path d="M13.5 12 L14 7.5 L17.5 10.5 Z M32.5 12 L32 7.5 L28.5 10.5 Z" fill="#f29bb0" />
      <circle cx="23" cy="19" r="12.5" fill="#453c63" />
      <ellipse cx="18" cy="18.5" rx="3.3" ry="3.8" fill="#ffd54a" />
      <ellipse cx="28" cy="18.5" rx="3.3" ry="3.8" fill="#ffd54a" />
      <ellipse cx="18" cy="18.5" rx="1.2" ry="3" fill="#15121f" />
      <ellipse cx="28" cy="18.5" rx="1.2" ry="3" fill="#15121f" />
      <path d="M21.5 23.5 H24.5 L23 25.5 Z" fill="#f29bb0" />
      <path d="M12 23 L5 22 M12 25 L5 27 M34 23 L41 22 M34 25 L41 27" stroke="#c9c2dd" stroke-width="0.9" stroke-linecap="round" />
      <ellipse cx="17" cy="45" rx="4.5" ry="2.4" fill="#574d78" />
      <ellipse cx="29" cy="45" rx="4.5" ry="2.4" fill="#574d78" />
    </g>
  );
}

function Owl() {
  return (
    <g>
      <path d="M11 12 L9 3 L18 8 Z M37 12 L39 3 L30 8 Z" fill="#8a5a33" />
      <ellipse cx="24" cy="27" rx="16" ry="19" fill="#a8703f" />
      <ellipse cx="24" cy="33" rx="10" ry="11.5" fill="#f1dcb5" />
      <path d="M19 31 l2.5 2 l2.5 -2 M24 31 l2.5 2 l2.5 -2 M21.5 37 l2.5 2 l2.5 -2" stroke="#c89a62" stroke-width="1.3" fill="none" stroke-linecap="round" />
      <path d="M8 24 Q4 36 11 43 Q14 34 12 24 Z M40 24 Q44 36 37 43 Q34 34 36 24 Z" fill="#7d4f2b" />
      <circle cx="17" cy="19" r="7.2" fill="#fff8e6" />
      <circle cx="31" cy="19" r="7.2" fill="#fff8e6" />
      <circle cx="17.6" cy="19.4" r="3.6" fill="#2b2140" />
      <circle cx="30.4" cy="19.4" r="3.6" fill="#2b2140" />
      <circle cx="18.8" cy="18" r="1.2" fill="#fff" />
      <circle cx="31.6" cy="18" r="1.2" fill="#fff" />
      <path d="M21.5 23 H26.5 L24 28 Z" fill="#f2a22a" />
      <path d="M17 45 v2.5 M20 45 v2.5 M28 45 v2.5 M31 45 v2.5" stroke="#f2a22a" stroke-width="1.8" stroke-linecap="round" />
    </g>
  );
}

function Dragon() {
  return (
    <g>
      <path d="M30 26 Q40 6 47 10 Q42 14 45 20 Q40 20 41 26 Q36 25 34 30 Z" fill="#f29a3b" />
      <path d="M14 30 Q8 14 1 18 Q6 21 4 27 Q9 26 9 32 Z" fill="#f29a3b" />
      <path d="M34 40 Q46 44 46 34 Q46 30 42 31" stroke="#3fae6a" stroke-width="4.5" fill="none" stroke-linecap="round" />
      <path d="M40.5 29 L46 28 L43.5 33 Z" fill="#f29a3b" />
      <ellipse cx="23" cy="35" rx="12.5" ry="11" fill="#3fae6a" />
      <ellipse cx="22" cy="38" rx="7.5" ry="7.5" fill="#ffe9a8" />
      <path d="M17 35 H27 M16 39 H28 M17.5 43 H26.5" stroke="#e0c070" stroke-width="1.1" stroke-linecap="round" />
      <path d="M14 7 L16 1 L19 6 M26 6 L29 1 L31 7" fill="#f29a3b" />
      <ellipse cx="22.5" cy="16" rx="12" ry="10.5" fill="#4cc27a" />
      <ellipse cx="22.5" cy="21" rx="8" ry="5" fill="#6fd896" />
      <circle cx="17.5" cy="14" r="3.4" fill="#fff" />
      <circle cx="27.5" cy="14" r="3.4" fill="#fff" />
      <circle cx="18.2" cy="14.4" r="1.8" fill="#22301c" />
      <circle cx="26.8" cy="14.4" r="1.8" fill="#22301c" />
      <circle cx="20" cy="20.5" r="0.9" fill="#2f7f4c" />
      <circle cx="25" cy="20.5" r="0.9" fill="#2f7f4c" />
      <path d="M18.5 23.5 Q22.5 26 26.5 23.5" stroke="#2f7f4c" stroke-width="1.2" fill="none" stroke-linecap="round" />
      <ellipse cx="16" cy="45.5" rx="4.5" ry="2.2" fill="#2f9457" />
      <ellipse cx="29" cy="45.5" rx="4.5" ry="2.2" fill="#2f9457" />
    </g>
  );
}

export const PET_ART: Record<string, () => ComponentChildren> = {
  'pet-toad': Toad,
  'pet-cat': Cat,
  'pet-owl': Owl,
  'pet-dragon': Dragon,
};

// ------------------------------------------------------------ pozadí: noční obloha a hrad

/** Jednoduchý opakovatelný generátor, aby hvězdy byly pokaždé na stejném místě. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const STARS = (() => {
  const rnd = seeded(7);
  return Array.from({ length: 70 }, (_, i) => ({
    x: (rnd() * 100).toFixed(1),
    y: (Math.pow(rnd(), 1.4) * 78).toFixed(1),
    r: (0.5 + rnd() * 1.1).toFixed(2),
    gold: rnd() > 0.8,
    group: i % 3,
  }));
})();

const WINDOWS: Array<[number, number]> = [
  [573, 135], [592, 135], [611, 135], [582, 165], [602, 165], [621, 165],
  [514, 160], [514, 185], [670, 100], [670, 130], [670, 165], [461, 188],
  [727, 180], [540, 205], [650, 205], [690, 205], [490, 208],
];

export function Backdrop() {
  return (
    <div class="backdrop" aria-hidden="true">
      <svg class="backdrop__stars" width="100%" height="100%">
        {STARS.map((s, i) => (
          <circle key={i} class={`bstar bstar--${s.group}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={s.gold ? '#ffe27a' : '#fff'} />
        ))}
      </svg>
      <div class="backdrop__moon" />
      <svg class="backdrop__castle" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax meet">
        <path d="M0 300 V262 Q150 228 320 250 Q420 226 520 232 H700 Q800 222 900 246 Q1060 224 1200 256 V300 Z" fill="#0d0820" />
        <g fill="#150e30">
          <rect x="446" y="182" width="312" height="60" />
          <rect x="560" y="110" width="80" height="130" />
          <path d="M550 112 L600 46 L650 112 Z" />
          <rect x="500" y="140" width="40" height="100" />
          <path d="M493 142 L520 88 L547 142 Z" />
          <rect x="660" y="80" width="32" height="160" />
          <path d="M653 82 L676 18 L699 82 Z" />
          <rect x="450" y="170" width="30" height="70" />
          <path d="M444 172 L465 134 L486 172 Z" />
          <rect x="715" y="160" width="36" height="80" />
          <path d="M709 162 L733 118 L757 162 Z" />
          <path d="M446 182 h12 v-8 h12 v8 h12 v-8 h12 v8 M700 182 v-8 h10 v8" />
          <path d="M758 214 H880 V240 H758 Z M776 240 a14 18 0 0 1 28 0 Z" />
          <rect x="598" y="30" width="2.5" height="22" />
          <path d="M600.5 30 L616 35 L600.5 40 Z" fill="#7a2030" />
        </g>
        <g fill="#0d0820">
          <path d="M790 240 a13 16 0 0 1 26 0 Z M834 240 a13 16 0 0 1 26 0 Z" />
        </g>
        <g fill="#ffd76a" class="castle-windows">
          {WINDOWS.map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="6" height="10" rx="3" class={i % 4 === 0 ? 'flicker' : undefined} />
          ))}
          <path d="M591 240 v-18 a9 9 0 0 1 18 0 v18 Z" opacity="0.85" />
        </g>
        <path d="M0 300 V280 Q200 262 420 276 Q600 262 800 274 Q1000 262 1200 280 V300 Z" fill="#090516" />
      </svg>
    </div>
  );
}

/** Vznášející se svíčky ve Velké síni. */
export function Candles() {
  const spots: Array<[number, number, number]> = [
    [4, 6, 0], [13, 26, 1.2], [90, 5, 0.6], [95.5, 30, 1.8], [76, 2, 2.4], [84, 22, 3],
  ];
  return (
    <div class="candles" aria-hidden="true">
      {spots.map(([x, y, delay], i) => (
        <svg key={i} class="candle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} width="14" height="40" viewBox="0 0 14 40">
          <circle cx="7" cy="9" r="7" fill="#ffd76a" opacity="0.25" />
          <path class="flame" d="M7 2 Q11 8 7 13 Q3 8 7 2 Z" fill="#ffd76a" />
          <path d="M7 6 Q9 9 7 12 Q5 9 7 6 Z" fill="#fff6c8" />
          <rect x="4" y="13" width="6" height="24" rx="2" fill="#f4ead6" />
          <rect x="7" y="13" width="3" height="24" rx="1.5" fill="#000" opacity="0.15" />
        </svg>
      ))}
    </div>
  );
}

/** Výbuch jisker po správné odpovědi. */
export function Burst() {
  return (
    <div class="burst" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} class="burst__star" style={{ '--angle': `${i * 36 + 10}deg`, '--dist': `${70 + (i % 3) * 26}px` }}>
          {i % 2 ? '✦' : '★'}
        </span>
      ))}
    </div>
  );
}

/** Padající hvězdičky na obrazovce s výsledkem. */
export function Confetti() {
  const rnd = seeded(11);
  const colors = ['#ffe27a', '#e7b53b', '#b99bff', '#7deaa4', '#ff9bb5'];
  return (
    <div class="confetti" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          class="confetti__piece"
          style={{
            left: `${(rnd() * 100).toFixed(1)}%`,
            color: colors[i % colors.length],
            animationDelay: `${(rnd() * 1.6).toFixed(2)}s`,
            animationDuration: `${(2.6 + rnd() * 2).toFixed(2)}s`,
            fontSize: `${(0.8 + rnd() * 1).toFixed(2)}rem`,
          }}
        >
          {i % 3 === 0 ? '✦' : '★'}
        </span>
      ))}
    </div>
  );
}
