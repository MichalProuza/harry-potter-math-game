import { useState } from 'preact/hooks';
import type { Go } from '../app';
import { Avatar } from '../components/Avatar';
import { Stars, TopBar, XpBar } from '../components/common';
import { HOUSES, type HouseId, SORTING_QUESTIONS, getHouse } from '../game/houses';
import { BRANCHES, type BranchId, LESSONS_TO_PASS, getBranch } from '../game/levels';
import { levelProgress, rankFor, unlockedUpTo } from '../game/state';
import { type PlayerSession, session } from '../session';

// ------------------------------------------------------------ moudrý klobouk

export function Sorting({ go, s }: { go: Go; s: PlayerSession }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<Record<HouseId, number>>({ nebelvir: 0, havraspar: 0, zmijozel: 0, mrzimor: 0 });
  const [chosen, setChosen] = useState<HouseId | null>(null);
  const [manual, setManual] = useState(false);

  function answer(house: HouseId) {
    const next = { ...score, [house]: score[house] + 1 };
    setScore(next);
    if (step + 1 < SORTING_QUESTIONS.length) setStep(step + 1);
    else {
      const best = (Object.entries(next) as Array<[HouseId, number]>).sort((a, b) => b[1] - a[1]);
      // při remíze rozhodne klobouk náhodně mezi nejlepšími
      const top = best.filter(([, v]) => v === best[0][1]);
      setChosen(top[Math.floor(Math.random() * top.length)][0]);
    }
  }

  function confirm(house: HouseId) {
    session.commit({ ...s.state, house });
    go({ name: 'hub' });
  }

  if (manual) {
    return (
      <main class="screen screen--center">
        <h1 class="title">Vyber si kolej</h1>
        <div class="houses">
          {HOUSES.map((h) => (
            <button
              type="button"
              key={h.id}
              class="house"
              style={{ '--house': h.primary, '--house2': h.secondary }}
              onClick={() => confirm(h.id)}
            >
              <span class="house__icon">{h.icon}</span>
              <strong>{h.name}</strong>
              <span>{h.trait}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (chosen) {
    const h = getHouse(chosen);
    return (
      <main class="screen screen--center">
        <div class="sorting-hat">🎩</div>
        <p class="speech">„Hmm… už to vím! Patříš do…“</p>
        <div class="house house--big" style={{ '--house': h.primary, '--house2': h.secondary }}>
          <span class="house__icon">{h.icon}</span>
          <strong>{h.name.toUpperCase()}!</strong>
          <span>{h.trait}</span>
        </div>
        <div class="row">
          <button type="button" class="btn btn--primary" onClick={() => confirm(chosen)}>
            Hurá, jdu do školy!
          </button>
          <button type="button" class="btn btn--ghost" onClick={() => setManual(true)}>
            Chci si vybrat sama
          </button>
        </div>
      </main>
    );
  }

  const q = SORTING_QUESTIONS[step];
  return (
    <main class="screen screen--center">
      <div class="sorting-hat">🎩</div>
      <p class="speech">
        {step === 0 && `Vítej v Kouzelné škole počtů, ${s.name}! Jsem moudrý klobouk a pomůžu ti najít tvou kolej. `}
        {q.q}
      </p>
      <div class="answers">
        {q.answers.map((a) => (
          <button type="button" key={a.text} class="btn btn--answer" onClick={() => answer(a.house)}>
            {a.text}
          </button>
        ))}
      </div>
      <p class="muted">
        Otázka {step + 1} z {SORTING_QUESTIONS.length}
      </p>
    </main>
  );
}

// ------------------------------------------------------------ Velká síň

export function Hub({ go, s }: { go: Go; s: PlayerSession }) {
  const { state } = s;
  const house = state.house ? getHouse(state.house) : null;
  const rank = rankFor(state.xp);

  return (
    <main class="screen">
      <TopBar session={s} title="Velká síň" />
      <section class="hero" style={house ? { '--house': house.primary, '--house2': house.secondary } : undefined}>
        <Avatar house={state.house} equipped={state.equipped} size={150} animated />
        <div class="hero__info">
          <h1 class="hero__name">{s.name}</h1>
          <p class="hero__rank">
            {house ? `${house.icon} ${house.name}` : ''} · <strong>{rank.name}</strong>
          </p>
          <XpBar xp={state.xp} />
          <p class="hero__streak">
            {state.streak.count > 0 ? `🔥 ${state.streak.count} ${daysWord(state.streak.count)} v řadě` : '🔥 Začni dnešní sérii!'}
          </p>
          <div class="row">
            <button type="button" class="btn btn--gold" onClick={() => go({ name: 'shop' })}>
              🛍️ Příčná ulice
            </button>
          </div>
        </div>
      </section>

      <h2 class="section-title">Vyber předmět</h2>
      <div class="branches">
        {BRANCHES.map((b) => {
          const unlocked = unlockedUpTo(state, b.id, s.overrides);
          const stars = b.levels.reduce((sum, l) => sum + levelProgress(state, b.id, l.n).bestStars, 0);
          const done = b.levels.filter((l) => levelProgress(state, b.id, l.n).passed >= LESSONS_TO_PASS).length;
          return (
            <button
              type="button"
              key={b.id}
              class="branch-card"
              style={{ '--branch': b.color }}
              onClick={() => go({ name: 'branch', branch: b.id })}
            >
              <span class="branch-card__icon">{b.icon}</span>
              <span class="branch-card__name">{b.name}</span>
              <span class="branch-card__subject">{b.subject}</span>
              <span class="branch-card__meta">
                Zvládnuto {done}/{b.levels.length} · odemčeno {unlocked} · ★ {stars}
              </span>
            </button>
          );
        })}
      </div>

      <footer class="footer">
        <button type="button" class="btn btn--ghost" onClick={() => void session.logout().then(() => go({ name: 'profiles' }))}>
          🚪 Odejít ze školy
        </button>
      </footer>
    </main>
  );
}

function daysWord(n: number): string {
  if (n === 1) return 'den';
  if (n >= 2 && n <= 4) return 'dny';
  return 'dní';
}

// ------------------------------------------------------------ mapa úrovní

export function BranchMap({ go, s, branch }: { go: Go; s: PlayerSession; branch: BranchId }) {
  const def = getBranch(branch);
  const unlocked = unlockedUpTo(s.state, branch, s.overrides);

  return (
    <main class="screen">
      <TopBar session={s} onBack={() => go({ name: 'hub' })} title={`${def.icon} ${def.name}`} />
      <p class="branch-subject">{def.subject}</p>
      <ol class="levels" style={{ '--branch': def.color }}>
        {def.levels.map((l) => {
          const p = levelProgress(s.state, branch, l.n);
          const locked = l.n > unlocked;
          const done = p.passed >= LESSONS_TO_PASS;
          return (
            <li key={l.n} class={`level ${locked ? 'level--locked' : ''} ${done ? 'level--done' : ''}`}>
              <button
                type="button"
                class="level__btn"
                disabled={locked}
                onClick={() => go({ name: 'lesson', branch, level: l.n })}
              >
                <span class="level__num">{locked ? '🔒' : l.n}</span>
                <span class="level__text">
                  <strong>{l.title}</strong>
                  <span class="muted">{l.example}</span>
                </span>
                <span class="level__status">
                  <Stars count={p.bestStars} size="sm" />
                  {!locked && (
                    <span class="level__dots" title="Úspěšné lekce">
                      {Array.from({ length: LESSONS_TO_PASS }, (_, i) => (
                        <span key={i} class={i < p.passed ? 'dot dot--on' : 'dot'} />
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p class="muted center">
        Úroveň zvládneš, když {LESSONS_TO_PASS}× dokončíš lekci aspoň s 8 správnými odpověďmi. Pak se odemkne další.
      </p>
    </main>
  );
}
