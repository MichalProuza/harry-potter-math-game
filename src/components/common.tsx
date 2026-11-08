import type { ComponentChildren } from 'preact';
import { rankFor } from '../game/state';
import type { PlayerSession } from '../session';

export function Stars({ count, max = 3, size = 'md' }: { count: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span class={`stars stars--${size}`} aria-label={`${count} z ${max} hvězdiček`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} class={i < count ? 'star star--on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Coins({ amount }: { amount: number }) {
  return (
    <span class="coins" title="Galeony">
      <span class="coin">🪙</span> {amount}
    </span>
  );
}

interface TopBarProps {
  session: PlayerSession;
  onBack?: () => void;
  title?: string;
  children?: ComponentChildren;
}

/** Horní lišta s galeony, hodností a tlačítkem zpět. */
export function TopBar({ session, onBack, title, children }: TopBarProps) {
  const rank = rankFor(session.state.xp);
  return (
    <header class="topbar">
      {onBack ? (
        <button type="button" class="btn-icon" onClick={onBack} aria-label="Zpět">
          ←
        </button>
      ) : (
        <span class="topbar__spacer" />
      )}
      <div class="topbar__title">{title ?? `${session.name} · ${rank.name}`}</div>
      <div class="topbar__right">
        {children}
        {!session.synced && (
          <span class="sync-dot" title="Ukládám na server…">
            ☁️
          </span>
        )}
        <Coins amount={session.state.coins} />
      </div>
    </header>
  );
}

export function XpBar({ xp }: { xp: number }) {
  const r = rankFor(xp);
  const pct = r.next === null ? 100 : Math.round(((xp - r.current) / (r.next - r.current)) * 100);
  return (
    <div class="xpbar" title={`${xp} XP`}>
      <div class="xpbar__fill" style={{ width: `${pct}%` }} />
      <span class="xpbar__label">
        {r.next === null ? `${xp} XP · nejvyšší hodnost!` : `${xp} / ${r.next} XP do další hodnosti`}
      </span>
    </div>
  );
}

export function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p class="error" role="alert">
      {error}
    </p>
  ) : null;
}
