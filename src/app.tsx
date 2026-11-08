import { useCallback, useEffect, useState } from 'preact/hooks';
import { type PlayerSummary, tokens } from './api';
import type { BranchId } from './game/levels';
import type { LessonOutcome } from './game/state';
import { ParentAuth, PinEntry, Profiles } from './screens/auth';
import { BranchMap, Hub, Sorting } from './screens/hub';
import { Lesson, Results } from './screens/lesson';
import { ParentZone } from './screens/parent';
import { Shop } from './screens/shop';
import { session, useSession } from './session';

export type Screen =
  | { name: 'boot' }
  | { name: 'parentAuth' }
  | { name: 'profiles' }
  | { name: 'pin'; player: PlayerSummary }
  | { name: 'parent' }
  | { name: 'sorting' }
  | { name: 'hub' }
  | { name: 'branch'; branch: BranchId }
  | { name: 'lesson'; branch: BranchId; level: number }
  | { name: 'results'; branch: BranchId; level: number; outcome: LessonOutcome }
  | { name: 'shop' };

export type Go = (s: Screen) => void;

/** Obrazovky, na které se nesmí bez přihlášené hráčky. */
const PLAYER_SCREENS = new Set(['sorting', 'hub', 'branch', 'lesson', 'results', 'shop']);

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'boot' });
  // každá navigace dostane nový klíč, aby se např. „Další lekce“ spustila nanovo
  const [nav, setNav] = useState(0);
  const [bootError, setBootError] = useState<string | null>(null);
  const s = useSession();

  const go = useCallback<Go>((next) => {
    setScreen(next);
    setNav((n) => n + 1);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (tokens.player) {
          const loaded = await session.load();
          if (loaded) return go(loaded.state.house ? { name: 'hub' } : { name: 'sorting' });
        }
        go(tokens.parent ? { name: 'profiles' } : { name: 'parentAuth' });
      } catch (e) {
        setBootError((e as Error).message);
      }
    })();
  }, [go]);

  if (bootError) {
    return (
      <main class="screen screen--center">
        <h1 class="title">🦉 Sova se ztratila</h1>
        <p>{bootError}</p>
        <button type="button" class="btn btn--primary" onClick={() => location.reload()}>
          Zkusit znovu
        </button>
      </main>
    );
  }

  if (PLAYER_SCREENS.has(screen.name) && !s) {
    return <Loading />;
  }

  switch (screen.name) {
    case 'boot':
      return <Loading />;
    case 'parentAuth':
      return <ParentAuth key={nav} go={go} />;
    case 'profiles':
      return <Profiles key={nav} go={go} />;
    case 'pin':
      return <PinEntry key={nav} go={go} player={screen.player} />;
    case 'parent':
      return <ParentZone key={nav} go={go} />;
    case 'sorting':
      return <Sorting key={nav} go={go} s={s!} />;
    case 'hub':
      return <Hub key={nav} go={go} s={s!} />;
    case 'branch':
      return <BranchMap key={nav} go={go} s={s!} branch={screen.branch} />;
    case 'lesson':
      return <Lesson key={nav} go={go} s={s!} branch={screen.branch} level={screen.level} />;
    case 'results':
      return <Results key={nav} go={go} s={s!} branch={screen.branch} level={screen.level} outcome={screen.outcome} />;
    case 'shop':
      return <Shop key={nav} go={go} s={s!} />;
  }
}

function Loading() {
  return (
    <main class="screen screen--center">
      <div class="loading">✨</div>
    </main>
  );
}
