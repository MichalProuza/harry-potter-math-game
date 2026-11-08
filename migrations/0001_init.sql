-- Rodičovský účet
CREATE TABLE parents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

-- Profil dítěte. Herní stav je JSON (viz shared/state.ts),
-- ruční odemčení úrovní od rodiče je zvlášť, aby se nepřepisovalo.
CREATE TABLE players (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id      INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  pin_hash       TEXT NOT NULL,
  state_json     TEXT,
  state_rev      INTEGER NOT NULL DEFAULT 0,
  overrides_json TEXT NOT NULL DEFAULT '{}',
  created_at     INTEGER NOT NULL
);
CREATE INDEX players_parent ON players(parent_id);

-- Přihlášení (rodič na zařízení, dítě po zadání PINu)
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('parent', 'player')),
  subject_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Historie lekcí pro rodičovský přehled
CREATE TABLE lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  branch      TEXT NOT NULL,
  level       INTEGER NOT NULL,
  correct     INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  duration_s  INTEGER NOT NULL,
  mistakes    TEXT NOT NULL,
  finished_at INTEGER NOT NULL
);
CREATE INDEX lessons_player ON lessons(player_id, finished_at);
