import { useCallback, useEffect, useState } from 'preact/hooks';
import { type PlayerSummary, api, tokens } from '../api';
import { Avatar } from '../components/Avatar';
import { ErrorText } from '../components/common';
import { Keypad } from '../components/Keypad';
import type { Go } from '../app';
import { session } from '../session';

// ------------------------------------------------------------ rodič

export function ParentAuth({ go }: { go: Go }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: Event) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = mode === 'login' ? await api.login(email, password) : await api.register(email, password);
      tokens.parent = res.token;
      go({ name: 'profiles' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main class="screen screen--center">
      <div class="card card--narrow">
        <h1 class="title">🏰 Kouzelná škola počtů</h1>
        <p class="muted">
          Účet zakládá rodič. Dítě se pak přihlašuje jen svým profilem a PINem, bez e-mailu.
        </p>
        <div class="tabs">
          <button type="button" class={mode === 'login' ? 'tab tab--on' : 'tab'} onClick={() => setMode('login')}>
            Přihlášení
          </button>
          <button type="button" class={mode === 'register' ? 'tab tab--on' : 'tab'} onClick={() => setMode('register')}>
            Nový účet
          </button>
        </div>
        <form onSubmit={submit} class="form">
          <label>
            E-mail rodiče
            <input type="email" required autocomplete="email" value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
          </label>
          <label>
            Heslo {mode === 'register' && <span class="muted">(aspoň 8 znaků)</span>}
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </label>
          <ErrorText error={error} />
          <button class="btn btn--primary" disabled={busy}>
            {mode === 'login' ? 'Přihlásit' : 'Založit účet'}
          </button>
        </form>
      </div>
    </main>
  );
}

// ------------------------------------------------------------ výběr profilu

export function Profiles({ go }: { go: Go }) {
  const [players, setPlayers] = useState<PlayerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.players();
      setPlayers(list);
      if (list.length === 0) setAdding(true);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        tokens.parent = null;
        go({ name: 'parentAuth' });
        return;
      }
      setError(err.message);
    }
  }, [go]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logoutParent() {
    const t = tokens.parent;
    tokens.parent = null;
    await api.logout(t).catch(() => undefined);
    go({ name: 'parentAuth' });
  }

  return (
    <main class="screen screen--center">
      <h1 class="title">Kdo dnes čaruje?</h1>
      <ErrorText error={error} />
      {players && players.length > 0 && (
        <div class="profiles">
          {players.map((p) => (
            <button type="button" key={p.id} class="profile" onClick={() => go({ name: 'pin', player: p })}>
              <Avatar house={p.house} equipped={p.equipped} size={110} />
              <span class="profile__name">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      {adding ? (
        <AddPlayer
          onDone={() => {
            setAdding(false);
            void load();
          }}
          onCancel={players && players.length > 0 ? () => setAdding(false) : undefined}
        />
      ) : (
        <div class="row">
          <button type="button" class="btn" onClick={() => setAdding(true)}>
            ➕ Přidat profil
          </button>
          <button type="button" class="btn" onClick={() => go({ name: 'parent' })}>
            👪 Pro rodiče
          </button>
          <button type="button" class="btn btn--ghost" onClick={logoutParent}>
            Odhlásit rodiče
          </button>
        </div>
      )}
      <p class="version">verze {__APP_VERSION__}</p>
    </main>
  );
}

function AddPlayer({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: Event) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN musí mít přesně 4 číslice.');
      return;
    }
    try {
      await api.addPlayer(name, pin);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form class="card card--narrow form" onSubmit={submit}>
      <h2>Nový profil</h2>
      <label>
        Jméno nebo přezdívka
        <input required maxLength={30} value={name} onInput={(e) => setName(e.currentTarget.value)} />
      </label>
      <label>
        PIN (4 číslice, dítě si ho zapamatuje)
        <input
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          required
          value={pin}
          onInput={(e) => setPin(e.currentTarget.value.replace(/\D/g, ''))}
        />
      </label>
      <ErrorText error={error} />
      <div class="row">
        <button class="btn btn--primary">Vytvořit</button>
        {onCancel && (
          <button type="button" class="btn btn--ghost" onClick={onCancel}>
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------ PIN

export function PinEntry({ go, player }: { go: Go; player: PlayerSummary }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (value: string) => {
      setBusy(true);
      setError(null);
      try {
        const { token } = await api.playerLogin(player.id, value);
        tokens.player = token;
        const s = await session.load();
        go(s?.state.house ? { name: 'hub' } : { name: 'sorting' });
      } catch (e) {
        setError((e as Error).message);
        setPin('');
      } finally {
        setBusy(false);
      }
    },
    [player.id, go],
  );

  const onDigit = useCallback(
    (d: string) => {
      setPin((p) => {
        if (p.length >= 4) return p;
        const next = p + d;
        if (next.length === 4) void submit(next);
        return next;
      });
    },
    [submit],
  );
  const onBackspace = useCallback(() => setPin((p) => p.slice(0, -1)), []);
  const onSubmit = useCallback(() => {
    if (pin.length === 4) void submit(pin);
  }, [pin, submit]);

  return (
    <main class="screen screen--center">
      <button type="button" class="btn btn--ghost back-link" onClick={() => go({ name: 'profiles' })}>
        ← Jiný profil
      </button>
      <Avatar house={player.house} equipped={player.equipped} size={120} />
      <h1 class="title">Ahoj, {player.name}!</h1>
      <p class="muted">Zadej svůj tajný PIN</p>
      <div class={error ? 'pin-dots pin-dots--error' : 'pin-dots'}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} class={i < pin.length ? 'pin-dot pin-dot--on' : 'pin-dot'} />
        ))}
      </div>
      <ErrorText error={error} />
      <Keypad onDigit={onDigit} onBackspace={onBackspace} onSubmit={onSubmit} disabled={busy} submitLabel="OK" />
    </main>
  );
}
