import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { Go } from '../app';
import { Avatar } from '../components/Avatar';
import { Coins, Stars } from '../components/common';
import { Keypad } from '../components/Keypad';
import { buildLesson } from '../game/lesson';
import { type BranchId, LESSONS_TO_PASS, PASS_SCORE, getBranch } from '../game/levels';
import type { Problem } from '../game/problems';
import { type Answer, type LessonOutcome, applyLesson, levelProgress } from '../game/state';
import { type PlayerSession, session } from '../session';

const PRAISE = ['Výborně!', 'Skvělé kouzlo!', 'Přesně tak!', 'Bravo!', 'Kouzelné!', 'Paráda!', 'Jsi hvězda!'];

interface QueueItem {
  problem: Problem;
  /** Opakování příkladu, který byl napoprvé špatně – už se nepočítá do skóre. */
  retry: boolean;
}

export function Lesson({ go, s, branch, level }: { go: Go; s: PlayerSession; branch: BranchId; level: number }) {
  const def = getBranch(branch);
  const levelDef = def.levels[level - 1];
  // Průběh lekce držíme v refu, aby časovač po správné odpovědi viděl aktuální data.
  const run = useRef<{
    startedAt: number;
    queue: QueueItem[];
    /** První odpovědi na příklady lekce (opakování na konci se nepočítá). */
    answers: Answer[];
    wrongDisplays: string[];
    /** Kdy se aktuální příklad objevil – pro měření rychlosti odpovědi. */
    shownAt: number;
    finished: boolean;
  } | null>(null);
  if (!run.current) {
    run.current = {
      startedAt: Date.now(),
      queue: buildLesson(s.state, branch, level).map((problem) => ({ problem, retry: false })),
      answers: [],
      wrongDisplays: [],
      shownAt: Date.now(),
      finished: false,
    };
  }
  const r = run.current;
  const firstCount = r.queue.filter((q) => !q.retry).length;

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<null | { ok: boolean; text: string }>(null);
  const [hint, setHint] = useState(false);
  /** Po první chybě dostane dítě ještě jeden pokus s nápovědou. */
  const [secondTry, setSecondTry] = useState(false);

  const current = r.queue[index];
  const answeredFirst = r.answers.length;
  /** Pořadové číslo aktuálního příkladu (při druhém pokusu už je první odpověď započítaná). */
  const position = Math.min(answeredFirst + (secondTry ? 0 : 1), firstCount);

  useEffect(() => {
    r.shownAt = Date.now();
  }, [r, index]);

  const next = useCallback(() => {
    if (r.finished) return;
    setFeedback(null);
    setHint(false);
    setSecondTry(false);
    setInput('');
    if (index + 1 < r.queue.length) {
      setIndex(index + 1);
      return;
    }
    r.finished = true;
    const outcome = applyLesson(s.state, { branch, level, answers: r.answers }, s.overrides);
    session.commit(outcome.state, {
      branch,
      level,
      correct: outcome.correct,
      total: outcome.total,
      durationS: (Date.now() - r.startedAt) / 1000,
      mistakes: r.wrongDisplays,
    });
    go({ name: 'results', branch, level, outcome });
  }, [r, index, s.state, s.overrides, branch, level, go]);

  const submit = useCallback(() => {
    if (feedback) {
      // po chybě se pokračuje tlačítkem / Enterem
      if (!feedback.ok) next();
      return;
    }
    if (input === '' || !current) return;
    const ok = Number(input) === current.problem.answer;
    if (!secondTry && !current.retry) {
      r.answers.push({ key: current.problem.key, correct: ok, ms: Date.now() - r.shownAt, hinted: hint });
    }
    if (ok) {
      const text = secondTry ? 'Teď to vyšlo!' : PRAISE[Math.floor(Math.random() * PRAISE.length)];
      setFeedback({ ok: true, text });
      setTimeout(next, 900);
    } else if (!secondTry) {
      if (!current.retry) {
        r.wrongDisplays.push(current.problem.display.replace('?', String(current.problem.answer)));
        // příklad se na konci lekce zopakuje
        r.queue.push({ problem: current.problem, retry: true });
      }
      setSecondTry(true);
      setInput('');
    } else {
      setFeedback({ ok: false, text: 'Nevadí! Podívej se, jak na to:' });
    }
  }, [r, feedback, input, current, next, secondTry, hint]);

  const onDigit = useCallback((d: string) => {
    if (feedback) return;
    setInput((v) => (v.length >= 3 ? v : v === '0' ? d : v + d));
  }, [feedback]);
  const onBackspace = useCallback(() => !feedback && setInput((v) => v.slice(0, -1)), [feedback]);

  function quit() {
    if (answeredFirst === 0 || confirm('Opravdu chceš lekci ukončit? Body z ní se nezapočítají.')) {
      r.finished = true;
      go({ name: 'branch', branch });
    }
  }

  if (!current) return null;
  const [left, right] = current.problem.display.split('?');
  const shown = feedback && !feedback.ok ? String(current.problem.answer) : input;

  return (
    <main class="screen lesson" style={{ '--branch': def.color }}>
      <header class="lesson__top">
        <button type="button" class="btn-icon" onClick={quit} aria-label="Ukončit lekci">
          ✕
        </button>
        <div class="progress" aria-label={`Příklad ${position} z ${firstCount}`}>
          <div class="progress__fill" style={{ width: `${(answeredFirst / firstCount) * 100}%` }} />
        </div>
        <span class="lesson__count">
          {current.retry ? '🔁' : `${position}/${firstCount}`}
        </span>
      </header>

      <p class="lesson__title">
        {def.icon} {levelDef.title}
      </p>

      <div class={`problem ${feedback ? (feedback.ok ? 'problem--ok' : 'problem--wrong') : ''}`}>
        {current.retry && <p class="problem__retry">Zkusíme to ještě jednou:</p>}
        <div class="problem__text">
          <span>{left}</span>
          <span class={`answer-box ${shown ? '' : 'answer-box--empty'}`}>{shown || '?'}</span>
          <span>{right}</span>
        </div>
        {feedback?.ok && (
          <div class="sparkles" aria-live="polite">
            ✨ {feedback.text} ✨
          </div>
        )}
      </div>

      {feedback && !feedback.ok && (
        <div class="hint hint--full" aria-live="polite">
          <p>
            <strong>{feedback.text}</strong>
          </p>
          <ol>
            {current.problem.hint.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
          <button type="button" class="btn btn--primary" onClick={next}>
            Pokračovat →
          </button>
        </div>
      )}

      {!feedback && (
        <div class="hint-row">
          {secondTry ? (
            <p class="hint hint--retry" aria-live="polite">
              <strong>To není ono. Zkus to ještě jednou:</strong>
              <br />
              💡 {current.problem.hint[0]}
            </p>
          ) : hint ? (
            <p class="hint">💡 {current.problem.hint[0]}</p>
          ) : (
            <button type="button" class="btn btn--ghost" onClick={() => setHint(true)}>
              💡 Lumos (nápověda)
            </button>
          )}
        </div>
      )}

      <Keypad onDigit={onDigit} onBackspace={onBackspace} onSubmit={submit} disabled={!!feedback && feedback.ok} />
    </main>
  );
}

// ------------------------------------------------------------ výsledek

export function Results({
  go,
  s,
  branch,
  level,
  outcome,
}: {
  go: Go;
  s: PlayerSession;
  branch: BranchId;
  level: number;
  outcome: LessonOutcome;
}) {
  const def = getBranch(branch);
  const p = levelProgress(s.state, branch, level);
  const title =
    outcome.stars === 3 ? 'Dokonalé!' : outcome.passed ? 'Skvělá práce!' : outcome.stars > 0 ? 'Dobrý pokus!' : 'Nevzdávej to!';

  return (
    <main class="screen screen--center results">
      <Avatar house={s.state.house} equipped={s.state.equipped} size={120} animated />
      <h1 class="title">{title}</h1>
      <Stars count={outcome.stars} size="lg" />
      <p class="results__score">
        Správně napoprvé: <strong>{outcome.correct}</strong> z {outcome.total}
      </p>
      <div class="rewards">
        <span class="reward">
          +<Coins amount={outcome.coins} />
        </span>
        <span class="reward">+{outcome.xp} XP</span>
      </div>
      {outcome.dailyBonus && (
        <p class="badge">
          🔥 Denní úkol splněn! +10 galeonů · série {outcome.streak} {outcome.streak === 1 ? 'den' : outcome.streak < 5 ? 'dny' : 'dní'}
        </p>
      )}
      {outcome.rankUp && <p class="badge badge--gold">🎓 Nová hodnost: {outcome.rankUp}!</p>}
      {outcome.newlyUnlocked && (
        <p class="badge badge--gold">
          🔓 Odemkla se úroveň {outcome.newlyUnlocked}: {def.levels[outcome.newlyUnlocked - 1]?.title}
        </p>
      )}
      <p class="muted">
        {outcome.passed
          ? `Úspěšné lekce v této úrovni: ${Math.min(p.passed, LESSONS_TO_PASS)}/${LESSONS_TO_PASS}`
          : `Na úspěšnou lekci potřebuješ aspoň ${PASS_SCORE} správně. Příště to dáš!`}
      </p>
      <div class="row">
        <button type="button" class="btn btn--primary" onClick={() => go({ name: 'lesson', branch, level })}>
          Další lekce
        </button>
        {outcome.newlyUnlocked && (
          <button
            type="button"
            class="btn btn--gold"
            onClick={() => go({ name: 'lesson', branch, level: outcome.newlyUnlocked! })}
          >
            Na novou úroveň!
          </button>
        )}
        <button type="button" class="btn" onClick={() => go({ name: 'branch', branch })}>
          Mapa
        </button>
        <button type="button" class="btn" onClick={() => go({ name: 'shop' })}>
          🛍️ Obchod
        </button>
      </div>
    </main>
  );
}
