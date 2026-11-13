import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { Go } from '../app';
import { Avatar } from '../components/Avatar';
import { Coins, Stars } from '../components/common';
import { Keypad } from '../components/Keypad';
import { buildLesson } from '../game/lesson';
import { type BranchId, LESSONS_TO_PASS, PASS_SCORE, getBranch } from '../game/levels';
import { type Answer, type LessonOutcome, applyLesson, applyPractice, levelProgress } from '../game/state';
import { type QueueItem, clearLesson, loadLesson, saveLesson } from '../lessonStore';
import { type PlayerSession, session } from '../session';

const PRAISE = ['Výborně!', 'Skvělé kouzlo!', 'Přesně tak!', 'Bravo!', 'Kouzelné!', 'Paráda!', 'Jsi hvězda!'];

export function Lesson({
  go,
  s,
  branch,
  level,
  setBack,
}: {
  go: Go;
  s: PlayerSession;
  branch: BranchId;
  level: number;
  /** Zaregistruje, co má udělat tlačítko Zpět v prohlížeči. */
  setBack: (handler: (() => void) | null) => void;
}) {
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
    /** Kde pokračovat po obnovení stránky. */
    resume: { index: number; secondTry: boolean };
  } | null>(null);
  if (!run.current) {
    const saved = loadLesson(s.id);
    const resumed = saved && saved.branch === branch && saved.level === level ? saved : null;
    run.current = {
      startedAt: resumed?.startedAt ?? Date.now(),
      queue: resumed?.queue ?? buildLesson(s.state, branch, level).map((problem) => ({ problem, retry: false })),
      answers: resumed?.answers ?? [],
      wrongDisplays: resumed?.wrongDisplays ?? [],
      shownAt: Date.now(),
      finished: false,
      resume: { index: resumed?.index ?? 0, secondTry: resumed?.secondTry ?? false },
    };
  }
  const r = run.current;
  const firstCount = r.queue.filter((q) => !q.retry).length;

  const [index, setIndex] = useState(r.resume.index);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<null | { ok: boolean; text: string }>(null);
  const [hint, setHint] = useState(false);
  /** Po první chybě dostane dítě ještě jeden pokus s nápovědou. */
  const [secondTry, setSecondTry] = useState(r.resume.secondTry);

  const current = r.queue[index];
  const answeredFirst = r.answers.length;
  /** Pořadové číslo aktuálního příkladu (při druhém pokusu už je první odpověď započítaná). */
  const position = Math.min(answeredFirst + (secondTry ? 0 : 1), firstCount);

  useEffect(() => {
    r.shownAt = Date.now();
  }, [r, index]);

  /** Uloží rozehranou lekci do prohlížeče. */
  const save = useCallback(
    (at: number, second: boolean) => {
      if (r.finished) return;
      saveLesson(s.id, {
        branch,
        level,
        startedAt: r.startedAt,
        queue: r.queue,
        answers: r.answers,
        wrongDisplays: r.wrongDisplays,
        index: at,
        secondTry: second,
      });
    },
    [r, s.id, branch, level],
  );

  const finish = useCallback(() => {
    if (r.finished) return;
    r.finished = true;
    clearLesson(s.id);
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
  }, [r, s.id, s.state, s.overrides, branch, level, go]);

  const next = useCallback(() => {
    if (r.finished) return;
    setFeedback(null);
    setHint(false);
    setSecondTry(false);
    setInput('');
    if (index + 1 < r.queue.length) setIndex(index + 1);
    else finish();
  }, [r, index, finish]);

  // Lekce obnovená těsně po poslední odpovědi už nemá co ukázat – rovnou se vyhodnotí.
  useEffect(() => {
    if (index >= r.queue.length) finish();
    else save(index, secondTry);
    // jen při startu lekce; další ukládání řídí odpovědi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      save(index + 1, false);
      setTimeout(next, 900);
    } else if (!secondTry) {
      if (!current.retry) {
        r.wrongDisplays.push(current.problem.display.replace('?', String(current.problem.answer)));
        // příklad se na konci lekce zopakuje
        r.queue.push({ problem: current.problem, retry: true });
      }
      setSecondTry(true);
      setInput('');
      save(index, true);
    } else {
      setFeedback({ ok: false, text: 'Nevadí! Podívej se, jak na to:' });
      save(index + 1, false);
    }
  }, [r, feedback, input, current, next, secondTry, hint, index, save]);

  const onDigit = useCallback((d: string) => {
    if (feedback) return;
    setInput((v) => (v.length >= 3 ? v : v === '0' ? d : v + d));
  }, [feedback]);
  const onBackspace = useCallback(() => !feedback && setInput((v) => v.slice(0, -1)), [feedback]);

  const quit = useCallback(() => {
    if (r.finished) return;
    if (r.answers.length > 0 && !confirm('Opravdu chceš lekci ukončit? Galeony z ní nedostaneš.')) return;
    r.finished = true;
    clearLesson(s.id);
    // co už dítě spočítalo, se do statistik příkladů započítá i bez dokončení lekce
    if (r.answers.length > 0) session.commit(applyPractice(s.state, r.answers));
    go({ name: 'branch', branch });
  }, [r, s.id, s.state, branch, go]);

  useEffect(() => {
    setBack(quit);
    return () => setBack(null);
  }, [setBack, quit]);

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
