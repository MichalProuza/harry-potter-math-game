import { type HouseId, getHouse } from '../game/houses';
import { type Slot, getItem } from '../game/shop';
import { PET_ART, Sparkle, StarShape } from './art';

interface Props {
  house: HouseId | string | null;
  equipped: Partial<Record<Slot, string>>;
  size?: number;
  /** Přidá jemnou animaci (vznášení, jiskření hůlky). */
  animated?: boolean;
  /** Přiblíží jednu část výbavy (náhledy v obchodě). */
  focus?: Slot;
}

const SKIN = '#f8d7bd';
const SKIN_SHADE = '#eab894';
const HAIR = '#7a4a2a';
const HAIR_DARK = '#5e3620';
const HAIR_LIGHT = '#9a6238';
const INK = '#2b2140';

/** Výřez postavy pro náhled jedné věci: [x, y, šířka, výška]. */
const FOCUS: Record<Slot, [number, number, number, number]> = {
  wand: [136, 94, 64, 80],
  hat: [44, -6, 112, 112],
  cloak: [22, 44, 156, 192],
  scarf: [52, 82, 96, 96],
  glasses: [60, 50, 80, 80],
  pet: [146, 184, 56, 56],
  broom: [0, 132, 200, 104],
};
/** U těchto věcí se v náhledu kreslí jen věc sama, bez postavy. */
const SOLO: Slot[] = ['wand', 'pet', 'broom'];

const RAINBOW = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

/** Postava kouzelnice složená z vrstev podle nasazené výbavy. */
export function Avatar({ house, equipped, size = 200, animated = false, focus }: Props) {
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
  const rainbow = scarf?.look.color === 'rainbow';
  const scarfMain = rainbow ? RAINBOW[0] : primary;
  const scarfStripe = rainbow ? RAINBOW[2] : secondary;

  const box = focus ? FOCUS[focus] : [0, 0, 200, 240];
  const solo = !!focus && SOLO.includes(focus);
  const Pet = pet ? PET_ART[pet.id] : undefined;
  const pointyHat = hat?.id === 'hat-pointy' || hat?.id === 'hat-star';

  return (
    <svg
      class={focus ? 'avatar avatar--focus' : animated ? 'avatar avatar--animated' : 'avatar'}
      width={focus ? (size * box[2]) / box[3] : size}
      height={focus ? size : size * 1.2}
      viewBox={box.join(' ')}
      role="img"
      aria-label={focus ? undefined : 'Tvoje kouzelnice'}
      aria-hidden={focus ? 'true' : undefined}
    >
      {!focus && <ellipse cx="100" cy="231" rx="58" ry="6" fill="#000" opacity="0.28" />}

      {/* koště za postavou */}
      {broom && (!solo || focus === 'broom') && (
        <g>
          <line x1="40" y1="200" x2="192" y2="148" stroke={broom.look.color} stroke-width="7" stroke-linecap="round" />
          <line x1="44" y1="197" x2="190" y2="147" stroke="#fff" stroke-width="1.5" opacity="0.25" stroke-linecap="round" />
          <path d="M46 190 Q20 186 4 200 Q10 204 2 212 Q12 214 6 224 Q18 222 16 232 Q34 226 52 208 Z" fill={broom.look.accent} />
          <path
            d="M44 196 L10 206 M46 200 L12 216 M48 204 L20 226"
            stroke="#000"
            stroke-width="1.6"
            opacity="0.25"
            stroke-linecap="round"
          />
          <path d="M43 188 L55 210" stroke={broom.look.color} stroke-width="5" stroke-linecap="round" />
          <path d="M43 188 L55 210" stroke="#fff" stroke-width="1.2" opacity="0.3" stroke-linecap="round" />
          {broom.look.glow && (
            <g class={animated ? 'twinkle' : undefined}>
              <path d="M150 150 l9 -17 l-2 11 l9 -2 l-11 17 l2 -10 z" fill="#ffe27a" />
              <Sparkle x={120} y={160} r={6} />
              <Sparkle x={176} y={136} r={4} />
            </g>
          )}
        </g>
      )}

      {!solo && (
        <g>
          {/* vlasy vzadu */}
          <path d="M60 84 Q52 150 64 176 Q100 186 136 176 Q148 150 140 84 Z" fill={HAIR_DARK} />

          {/* boty */}
          <ellipse cx="84" cy="228" rx="12" ry="6" fill={INK} />
          <ellipse cx="116" cy="228" rx="12" ry="6" fill={INK} />

          {/* levá ruka */}
          <path d="M78 126 Q62 146 60 168" stroke={cloakColor} stroke-width="17" stroke-linecap="round" fill="none" />
          <path d="M78 126 Q62 146 60 168" stroke="#000" stroke-width="17" stroke-linecap="round" fill="none" opacity="0.12" />
          <circle cx="59" cy="174" r="7.5" fill={SKIN} />

          {/* hábit */}
          <path d="M74 120 Q100 110 126 120 Q140 170 154 222 Q100 236 46 222 Q60 170 74 120 Z" fill={cloakColor} />
          <path d="M112 116 Q120 117 126 120 Q140 170 154 222 Q134 228 116 229 Q120 170 112 116 Z" fill="#000" opacity="0.16" />
          <path d="M70 140 Q62 180 54 220" stroke="#fff" stroke-width="3" fill="none" opacity="0.12" stroke-linecap="round" />
          <path d="M100 152 L108 230 Q100 231 92 230 Z" fill="#000" opacity="0.22" />
          <path d="M86 116 L100 154 L114 116 Q100 111 86 116 Z" fill={lining} />
          <path d="M94 114 L100 124 L106 114 Z" fill="#fff" opacity="0.85" />
          <path d="M46 222 Q100 236 154 222" stroke={lining} stroke-width="3.5" fill="none" opacity="0.9" />
          {cloak?.id === 'cloak-night' && (
            <g>
              <StarShape x={70} y={176} r={5.5} fill={lining} />
              <StarShape x={130} y={194} r={4.5} fill={lining} />
              <StarShape x={86} y={208} r={3.5} fill={lining} />
              <circle cx="122" cy="164" r="1.8" fill={lining} />
              <circle cx="72" cy="202" r="1.5" fill={lining} />
              <circle cx="118" cy="214" r="1.5" fill={lining} />
              <path d="M70 176 L86 208 L130 194" stroke={lining} stroke-width="0.8" fill="none" opacity="0.5" />
            </g>
          )}
          {cloak?.id === 'cloak-gold' && (
            <g>
              <path d="M48 214 Q100 228 152 214" stroke={lining} stroke-width="2" fill="none" stroke-dasharray="2 5" stroke-linecap="round" />
              <Sparkle x={70} y={186} r={5} fill={lining} />
              <Sparkle x={128} y={176} r={4} fill={lining} />
            </g>
          )}
          {cloak?.id === 'cloak-velvet' && (
            <path d="M76 124 Q66 170 52 216" stroke={lining} stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round" />
          )}
          {!cloak && h && (
            <g transform="translate(70 142) scale(0.2)">
              <path d="M8 6 H92 V58 Q92 92 50 112 Q8 92 8 58 Z" fill={secondary} stroke="#000" stroke-opacity="0.25" stroke-width="4" />
              <path d="M50 6 H92 V58 Q92 92 50 112 Z" fill={primary} opacity="0.55" />
            </g>
          )}
        </g>
      )}

      {/* ruka s hůlkou */}
      {!solo && (
        <g>
          <path d="M124 124 Q146 134 153 156" stroke={cloakColor} stroke-width="17" stroke-linecap="round" fill="none" />
          <path d="M124 132 Q142 140 148 160" stroke="#000" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.14" />
        </g>
      )}
      {wand && (!solo || focus === 'wand') && (
        <g class={wand.look.glow ? 'wand wand--glow' : 'wand'}>
          <line x1="152" y1="164" x2="188" y2="110" stroke={wand.look.color} stroke-width="5" stroke-linecap="round" />
          <line x1="152" y1="164" x2="163" y2="147.5" stroke={wand.look.color} stroke-width="8" stroke-linecap="round" />
          <line x1="152" y1="164" x2="163" y2="147.5" stroke="#000" stroke-width="8" stroke-linecap="round" opacity="0.22" />
          <line x1="164" y1="143" x2="186" y2="110" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity="0.35" />
          {wand.look.accent && <circle cx="165" cy="144.5" r="3.4" fill={wand.look.accent} />}
          {wand.look.accent && <circle cx="188" cy="110" r="3" fill={wand.look.accent} />}
          {(animated || focus === 'wand') && (
            <g class={animated ? 'twinkle' : undefined}>
              <Sparkle x={190} y={104} r={9} />
              <Sparkle x={178} y={100} r={3.5} fill="#fff" />
            </g>
          )}
        </g>
      )}
      {!solo && <circle cx="154" cy="160" r="7.5" fill={SKIN} />}

      {!solo && (
        <g>
          {/* šála */}
          {scarf && (
            <g>
              <path d="M110 116 L124 118 L126 160 L112 162 Z" fill={scarfMain} />
              {rainbow ? (
                RAINBOW.slice(1).map((c, i) => <path key={c} d={`M111 ${123 + i * 8} l14 1 v6 l-14 -1 Z`} fill={c} />)
              ) : (
                <path d="M111 126 l14 1 v6 l-14 -1 Z M111.5 142 l14 1 v6 l-14 -1 Z" fill={scarfStripe} />
              )}
              <path d="M112 162 l2 6 M117 161.5 l1 6 M122 161 l1 6 M126 160 l0 6" stroke={scarfMain} stroke-width="2" stroke-linecap="round" />
              <path d="M72 112 Q100 104 128 112 Q130 120 126 124 Q100 116 74 124 Q70 120 72 112 Z" fill={scarfMain} />
              {rainbow ? (
                RAINBOW.slice(1).map((c, i) => <path key={c} d={`M${80 + i * 9} 109.5 l6 -1 v12 l-6 1 Z`} fill={c} />)
              ) : (
                <path d="M84 109 l7 -1.5 v12 l-7 1.5 Z M100 107 h7 v12 h-7 Z M116 108.5 l6 1.5 v12 l-6 -1.5 Z" fill={scarfStripe} />
              )}
              <path d="M74 124 Q100 116 126 124" stroke="#000" stroke-width="2" fill="none" opacity="0.18" />
            </g>
          )}

          {/* hlava */}
          <circle cx="66" cy="92" r="6" fill={SKIN_SHADE} />
          <circle cx="134" cy="92" r="6" fill={SKIN_SHADE} />
          <circle cx="100" cy="86" r="34" fill={SKIN} />
          <path d="M70 100 Q84 122 112 118 Q94 124 78 112 Z" fill={SKIN_SHADE} opacity="0.5" />
          {/* vlasy */}
          <path d="M64 90 Q60 46 100 46 Q140 46 136 90 Q132 70 114 62 Q104 76 86 74 Q70 74 64 90 Z" fill={HAIR} />
          <path d="M64 84 Q58 116 68 140 Q76 120 72 86 Z" fill={HAIR} />
          <path d="M136 84 Q142 116 132 140 Q124 120 128 86 Z" fill={HAIR} />
          <path d="M78 58 Q92 50 108 53" stroke={HAIR_LIGHT} stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8" />
          {/* obličej */}
          <path d="M80 80 Q87 76 93 79 M107 79 Q113 76 120 80" stroke={HAIR_DARK} stroke-width="2" fill="none" stroke-linecap="round" />
          <ellipse cx="87" cy="91" rx="5.2" ry="6.6" fill={INK} />
          <ellipse cx="113" cy="91" rx="5.2" ry="6.6" fill={INK} />
          <circle cx="89" cy="88.5" r="2.1" fill="#fff" />
          <circle cx="115" cy="88.5" r="2.1" fill="#fff" />
          <circle cx="85.5" cy="93.5" r="1" fill="#fff" opacity="0.8" />
          <circle cx="111.5" cy="93.5" r="1" fill="#fff" opacity="0.8" />
          <ellipse cx="77" cy="102" rx="6.5" ry="4.2" fill="#f58f98" opacity="0.5" />
          <ellipse cx="123" cy="102" rx="6.5" ry="4.2" fill="#f58f98" opacity="0.5" />
          <path d="M98 98 Q100 100 102 98" stroke={SKIN_SHADE} stroke-width="1.8" fill="none" stroke-linecap="round" />
          <path d="M92 104 Q100 114 108 104 Q100 107 92 104 Z" fill="#a8423f" />

          {/* brýle */}
          {glasses?.id === 'glasses-round' && (
            <g>
              <circle cx="87" cy="91" r="10.5" fill="#cfe8ff" opacity="0.22" />
              <circle cx="113" cy="91" r="10.5" fill="#cfe8ff" opacity="0.22" />
              <g stroke={glasses.look.color} stroke-width="2.6" fill="none" stroke-linecap="round">
                <circle cx="87" cy="91" r="10.5" />
                <circle cx="113" cy="91" r="10.5" />
                <path d="M97.5 90 Q100 88 102.5 90 M76.5 90 L68 87 M123.5 90 L132 87" />
              </g>
              <path d="M80 86 Q82 83 85 82.5 M106 86 Q108 83 111 82.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8" />
            </g>
          )}
          {glasses?.id === 'glasses-star' && (
            <g>
              <StarShape x={87} y={90} r={14} fill={glasses.look.color ?? '#e74c8b'} />
              <StarShape x={113} y={90} r={14} fill={glasses.look.color ?? '#e74c8b'} />
              <circle cx="87" cy="91" r="6.5" fill="#ffd9ea" />
              <circle cx="113" cy="91" r="6.5" fill="#ffd9ea" />
              <ellipse cx="87" cy="91.5" rx="3" ry="3.8" fill={INK} />
              <ellipse cx="113" cy="91.5" rx="3" ry="3.8" fill={INK} />
              <circle cx="88.2" cy="90" r="1.2" fill="#fff" />
              <circle cx="114.2" cy="90" r="1.2" fill="#fff" />
              <path d="M97 90 H103" stroke={glasses.look.color} stroke-width="2.5" />
            </g>
          )}

          {/* klobouk */}
          {pointyHat && hat && (
            <g>
              <path d="M44 62 Q100 44 156 62 Q100 76 44 62 Z" fill={hat.look.color} />
              <path d="M44 62 Q100 76 156 62 Q100 70 44 62 Z" fill="#000" opacity="0.3" />
              <path d="M68 58 Q80 30 90 14 Q98 0 114 4 Q106 8 108 18 Q116 38 132 58 Q100 48 68 58 Z" fill={hat.look.color} />
              <path d="M100 6 Q106 2 114 4 Q106 8 108 18 Q116 38 132 58 Q118 53 106 51.5 Q110 30 100 6 Z" fill="#000" opacity="0.22" />
              <path d="M76 50 Q84 30 92 18" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.16" stroke-linecap="round" />
              <path d="M70 53 Q100 43 130 53 L132 58 Q100 48 68 58 Z" fill={hat.look.accent} />
              <rect x="94" y="43.5" width="12" height="9" rx="2" fill="none" stroke="#fff6c8" stroke-width="2" />
              {hat.id === 'hat-star' && (
                <g>
                  <StarShape x={100} y={30} r={6} fill={hat.look.accent!} />
                  <StarShape x={88} y={40} r={3.5} fill={hat.look.accent!} />
                  <StarShape x={114} y={38} r={3} fill={hat.look.accent!} />
                  <StarShape x={101} y={14} r={3} fill={hat.look.accent!} />
                </g>
              )}
            </g>
          )}
          {hat?.id === 'hat-crown' && (
            <g>
              <path d="M70 60 L66 30 L82 44 L100 22 L118 44 L134 30 L130 60 Q100 52 70 60 Z" fill={hat.look.color} />
              <path d="M100 22 L118 44 L134 30 L130 60 Q114 55.5 100 55 Z" fill="#000" opacity="0.14" />
              <path d="M70 60 Q100 52 130 60 L131 53 Q100 45 69 53 Z" fill="#d99a14" />
              <circle cx="66" cy="30" r="3.5" fill="#fff6c8" />
              <circle cx="134" cy="30" r="3.5" fill="#fff6c8" />
              <circle cx="100" cy="22" r="4" fill="#fff6c8" />
              <circle cx="100" cy="42" r="5" fill={hat.look.accent} />
              <circle cx="98.5" cy="40.5" r="1.5" fill="#fff" opacity="0.8" />
              <circle cx="82" cy="52" r="3" fill="#4fc3f7" />
              <circle cx="118" cy="52" r="3" fill="#4fc3f7" />
            </g>
          )}
        </g>
      )}

      {/* mazlíček */}
      {Pet && (!solo || focus === 'pet') && (
        <g transform="translate(150 186)">
          <g class={animated ? 'pet pet--animated' : 'pet'}>
            <Pet />
          </g>
        </g>
      )}
    </svg>
  );
}
