import { useEffect, useState } from 'preact/hooks';
import { type Overview, type PlayerSummary, api } from '../api';
import type { Go } from '../app';
import { ErrorText } from '../components/common';
import { keyLabel } from '../game/labels';
import { BRANCHES, type BranchId, getBranch } from '../game/levels';
import { type UnlockOverrides, normalizeState, unlockedUpTo, weakestKeys } from '../game/state';

/** Rodičovská sekce – chráněná heslem rodiče, aby se do ní nedostalo dítě. */
export function ParentZone({ go }: { go: Go }) {
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function verify(e: Event) {
    e.preventDefault();
    try {
      await api.verifyParent(password);
      setVerified(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!verified) {
    return (
      <main class="screen screen--center">
        <form class="card card--narrow form" onSubmit={verify}>
          <h1 class="title">👪 Pro rodiče</h1>
          <label>
            Heslo rodiče
            <input type="password" autocomplete="current-password" required value={password} onInput={(e) => setPassword(e.currentTarget.value)} />
          </label>
          <ErrorText error={error} />
          <div class="row">
            <button class="btn btn--primary">Pokračovat</button>
            <button type="button" class="btn btn--ghost" onClick={() => go({ name: 'profiles' })}>
              Zpět
            </button>
          </div>
        </form>
      </main>
    );
  }
  return <Dashboard go={go} />;
}

function Dashboard({ go }: { go: Go }) {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .players()
      .then((list) => {
        setPlayers(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <main class="screen parent">
      <header class="topbar">
        <button type="button" class="btn-icon" onClick={() => go({ name: 'profiles' })} aria-label="Zpět">
          ←
        </button>
        <div class="topbar__title">👪 Rodičovský přehled</div>
        <span class="topbar__spacer" />
      </header>
      <ErrorText error={error} />
      {players.length > 1 && (
        <div class="chips">
          {players.map((p) => (
            <button type="button" key={p.id} class={p.id === selected ? 'chip chip--on' : 'chip'} onClick={() => setSelected(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      )}
      {selected !== null && <PlayerOverview key={selected} id={selected} />}
    </main>
  );
}

const DAY = 86_400_000;

function PlayerOverview({ id }: { id: number }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    api.overview(id).then(setData).catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) return <ErrorText error={error} />;
  if (!data) return <p class="muted center">Načítám…</p>;

  const state = normalizeState(data.state);
  const weekAgo = Date.now() - 7 * DAY;
  const week = data.lessons.filter((l) => l.finished_at >= weekAgo);
  const weekMinutes = Math.round(week.reduce((s, l) => s + l.duration_s, 0) / 60);
  const weekCorrect = week.reduce((s, l) => s + l.correct, 0);
  const weekTotal = week.reduce((s, l) => s + l.total, 0);
  const weak = weakestKeys(state);

  async function setUnlock(branch: BranchId, value: number) {
    const overrides: UnlockOverrides = { ...data!.overrides, [branch]: value };
    try {
      const res = await api.setOverrides(id, overrides);
      setData({ ...data!, overrides: res.overrides });
      setSaved('Uloženo. Projeví se při příštím přihlášení dítěte.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function changePin(e: Event) {
    e.preventDefault();
    try {
      await api.setPin(id, newPin);
      setNewPin('');
      setSaved('PIN byl změněn.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div class="parent__grid">
      <section class="card">
        <h2>Posledních 7 dní</h2>
        <div class="kpis">
          <div class="kpi">
            <span class="kpi__value">{week.length}</span>
            <span class="kpi__label">lekcí</span>
          </div>
          <div class="kpi">
            <span class="kpi__value">{weekMinutes}</span>
            <span class="kpi__label">minut</span>
          </div>
          <div class="kpi">
            <span class="kpi__value">{weekTotal ? Math.round((weekCorrect / weekTotal) * 100) : '–'}%</span>
            <span class="kpi__label">správně napoprvé</span>
          </div>
          <div class="kpi">
            <span class="kpi__value">{state.streak.count}</span>
            <span class="kpi__label">dní v řadě</span>
          </div>
        </div>
        <p class="muted">
          Celkem {state.lessonsTotal} lekcí · {state.xp} XP · {state.coins} galeonů
        </p>
      </section>

      <section class="card">
        <h2>Na čem ještě zapracovat</h2>
        {weak.length === 0 ? (
          <p class="muted">Zatím žádné problematické příklady. 👍</p>
        ) : (
          <ul class="weak">
            {weak.map(({ key, stat }) => (
              <li key={key}>
                <span>{keyLabel(key)}</span>
                <span class="muted">
                  {stat.correct}/{stat.seen} správně
                  {stat.ms ? ` · průměrně ${Math.round(stat.ms / 1000)} s` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section class="card">
        <h2>Odemčené úrovně</h2>
        <p class="muted">Když něco už probrali ve škole, můžete úrovně odemknout ručně.</p>
        {BRANCHES.map((b) => {
          const auto = unlockedUpTo(state, b.id);
          const current = unlockedUpTo(state, b.id, data.overrides);
          return (
            <label key={b.id} class="unlock">
              <span>
                {b.icon} {b.name} <span class="muted">({b.subject})</span>
              </span>
              <select value={String(current)} onChange={(e) => void setUnlock(b.id, Number(e.currentTarget.value))}>
                {b.levels.map((l) => (
                  <option key={l.n} value={String(l.n)} disabled={l.n < auto}>
                    do úrovně {l.n}: {l.title}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        {saved && <p class="badge">{saved}</p>}
      </section>

      <section class="card">
        <h2>Poslední lekce</h2>
        {data.lessons.length === 0 ? (
          <p class="muted">Zatím žádná lekce.</p>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th>Kdy</th>
                <th>Úroveň</th>
                <th>Výsledek</th>
                <th>Chyby</th>
              </tr>
            </thead>
            <tbody>
              {data.lessons.slice(0, 15).map((l) => {
                const b = BRANCHES.find((x) => x.id === l.branch);
                return (
                  <tr key={l.finished_at}>
                    <td>{new Date(l.finished_at).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      {b ? `${b.icon} ${getBranch(b.id).levels[l.level - 1]?.title ?? l.level}` : l.branch}
                    </td>
                    <td>
                      {l.correct}/{l.total}
                    </td>
                    <td class="muted">{l.mistakes.join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section class="card">
        <h2>Změnit PIN</h2>
        <form class="row" onSubmit={changePin}>
          <input
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            placeholder="nový PIN"
            value={newPin}
            onInput={(e) => setNewPin(e.currentTarget.value.replace(/\D/g, ''))}
          />
          <button class="btn">Uložit</button>
        </form>
      </section>
    </div>
  );
}
