import { type HouseId, getHouse } from '../game/houses';
import { type Slot, getItem } from '../game/shop';

interface Props {
  house: HouseId | string | null;
  equipped: Partial<Record<Slot, string>>;
  size?: number;
  /** Přidá jemnou animaci (vznášení, jiskření hůlky). */
  animated?: boolean;
}

const SKIN = '#f6d2b5';
const HAIR = '#7a4a2a';

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} />;
}

/** Postava kouzelnice složená z vrstev podle nasazené výbavy. */
export function Avatar({ house, equipped, size = 200, animated = false }: Props) {
  const h = house ? getHouse(house as HouseId) : null;
  const primary = h?.primary ?? '#3a3550';
  const secondary = h?.secondary ?? '#b8b0c8';

  const wand = getItem(equipped.wand);
  const hat = getItem(equipped.hat);
  const cloak = getItem(equipped.cloak);
  const scarf = getItem(equipped.scarf);
  const glasses = getItem(equipped.glasses);
  const pet = getItem(equipped.pet);
  const broom = getItem(equipped.broom);

  const cloakColor = cloak?.look.color ?? primary;
  const lining = cloak?.look.accent ?? secondary;

  return (
    <svg
      class={animated ? 'avatar avatar--animated' : 'avatar'}
      width={size}
      height={size * 1.2}
      viewBox="0 0 200 240"
      role="img"
      aria-label="Tvoje kouzelnice"
    >
      {/* koště za postavou */}
      {broom && (
        <g>
          <line x1="28" y1="205" x2="190" y2="150" stroke={broom.look.color} stroke-width="7" stroke-linecap="round" />
          <polygon points="34,196 2,212 8,232 40,212" fill={broom.look.accent} />
          <line x1="36" y1="196" x2="42" y2="212" stroke={broom.look.color} stroke-width="4" />
          {broom.look.glow && <path d="M150 158 l8 -14 l-2 10 l8 -2 l-10 14 l2 -9 z" fill="#ffe27a" />}
        </g>
      )}

      {/* vlasy vzadu */}
      <path d="M62 86 Q60 140 74 150 L126 150 Q140 140 138 86 Z" fill={HAIR} />

      {/* plášť */}
      <path d="M72 118 Q100 108 128 118 L156 226 Q100 236 44 226 Z" fill={cloakColor} />
      <path d="M88 116 L100 160 L112 116 Z" fill={lining} />
      {cloak?.id === 'cloak-night' && (
        <g>
          <Star x={70} y={170} r={5} fill={lining} />
          <Star x={128} y={190} r={4} fill={lining} />
          <Star x={95} y={205} r={3.5} fill={lining} />
          <circle cx="118" cy="160" r="1.8" fill={lining} />
          <circle cx="80" cy="200" r="1.5" fill={lining} />
        </g>
      )}
      {cloak?.id === 'cloak-gold' && <path d="M46 222 Q100 232 154 222" stroke={lining} stroke-width="5" fill="none" />}
      {!cloak && h && (
        <g>
          <circle cx="82" cy="150" r="9" fill={secondary} />
          <text x="82" y="154" font-size="10" text-anchor="middle">
            {h.icon}
          </text>
        </g>
      )}

      {/* ruka s hůlkou */}
      <path d="M126 122 Q150 135 156 158" stroke={cloakColor} stroke-width="16" stroke-linecap="round" fill="none" />
      <circle cx="157" cy="160" r="7" fill={SKIN} />
      {wand && (
        <g class={wand.look.glow ? 'wand wand--glow' : 'wand'}>
          <line x1="156" y1="162" x2="188" y2="112" stroke={wand.look.color} stroke-width="5" stroke-linecap="round" />
          {wand.look.accent && <circle cx="188" cy="112" r="3" fill={wand.look.accent} />}
          {animated && <Star x={190} y={106} r={7} fill="#ffe27a" />}
        </g>
      )}

      {/* šála */}
      {scarf && (
        <g>
          <rect x="74" y="110" width="52" height="12" rx="6" fill={scarf.look.color === 'rainbow' ? '#e74c3c' : primary} />
          {scarf.look.color === 'rainbow' ? (
            <g>
              <rect x="112" y="116" width="11" height="40" rx="3" fill="#f39c12" />
              <rect x="112" y="124" width="11" height="6" fill="#f1c40f" />
              <rect x="112" y="134" width="11" height="6" fill="#2ecc71" />
              <rect x="112" y="144" width="11" height="6" fill="#3498db" />
            </g>
          ) : (
            <g>
              <rect x="112" y="116" width="11" height="40" rx="3" fill={primary} />
              <rect x="112" y="124" width="11" height="5" fill={secondary} />
              <rect x="112" y="136" width="11" height="5" fill={secondary} />
              <rect x="88" y="110" width="6" height="12" fill={secondary} />
              <rect x="104" y="110" width="6" height="12" fill={secondary} />
            </g>
          )}
        </g>
      )}

      {/* hlava */}
      <circle cx="100" cy="84" r="32" fill={SKIN} />
      <path d="M68 80 Q72 48 100 50 Q128 48 132 80 Q118 66 100 68 Q84 64 68 80 Z" fill={HAIR} />
      <circle cx="88" cy="88" r="3.6" fill="#2b2140" />
      <circle cx="112" cy="88" r="3.6" fill="#2b2140" />
      <circle cx="80" cy="98" r="5" fill="#f4a7a7" opacity="0.6" />
      <circle cx="120" cy="98" r="5" fill="#f4a7a7" opacity="0.6" />
      <path d="M90 101 Q100 110 110 101" stroke="#8a3b3b" stroke-width="2.5" fill="none" stroke-linecap="round" />

      {/* brýle */}
      {glasses?.id === 'glasses-round' && (
        <g stroke={glasses.look.color} stroke-width="2.5" fill="none">
          <circle cx="88" cy="88" r="9" />
          <circle cx="112" cy="88" r="9" />
          <line x1="97" y1="88" x2="103" y2="88" />
        </g>
      )}
      {glasses?.id === 'glasses-star' && (
        <g opacity="0.85">
          <Star x={88} y={88} r={11} fill={glasses.look.color ?? '#e74c8b'} />
          <Star x={112} y={88} r={11} fill={glasses.look.color ?? '#e74c8b'} />
          <circle cx="88" cy="89" r="3" fill="#2b2140" />
          <circle cx="112" cy="89" r="3" fill="#2b2140" />
          <line x1="98" y1="87" x2="102" y2="87" stroke={glasses.look.color} stroke-width="2" />
        </g>
      )}

      {/* klobouk */}
      {(hat?.id === 'hat-pointy' || hat?.id === 'hat-star') && (
        <g>
          <path d="M66 62 Q100 54 134 62 L112 4 Q108 0 104 6 Z" fill={hat.look.color} />
          <ellipse cx="100" cy="62" rx="46" ry="9" fill={hat.look.color} />
          <path d="M70 56 Q100 48 130 56 L128 50 Q100 42 72 50 Z" fill={hat.look.accent} />
          {hat.id === 'hat-star' && (
            <g>
              <Star x={104} y={30} r={6} fill={hat.look.accent!} />
              <Star x={92} y={44} r={4} fill={hat.look.accent!} />
              <Star x={116} y={18} r={3.5} fill={hat.look.accent!} />
            </g>
          )}
        </g>
      )}
      {hat?.id === 'hat-crown' && (
        <g>
          <polygon points="72,58 72,34 84,46 100,28 116,46 128,34 128,58" fill={hat.look.color} />
          <circle cx="100" cy="46" r="4" fill={hat.look.accent} />
          <circle cx="82" cy="52" r="3" fill="#4fc3f7" />
          <circle cx="118" cy="52" r="3" fill="#4fc3f7" />
        </g>
      )}

      {/* mazlíček */}
      {pet?.look.emoji && (
        <text x="168" y="234" font-size="38" text-anchor="middle" class={animated ? 'pet pet--animated' : 'pet'}>
          {pet.look.emoji}
        </text>
      )}
    </svg>
  );
}
