import type { BranchId } from './game/levels';
import type { Problem } from './game/problems';
import type { Answer } from './game/state';

/** Jeden příklad ve frontě lekce. */
export interface QueueItem {
  problem: Problem;
  /** Opakování příkladu, který byl napoprvé špatně – už se nepočítá do skóre. */
  retry: boolean;
}

/**
 * Rozehraná lekce. Ukládá se do prohlížeče po každé odpovědi, aby ji
 * obnovení stránky nebo zavření prohlížeče nezahodilo.
 */
export interface SavedLesson {
  branch: BranchId;
  level: number;
  startedAt: number;
  queue: QueueItem[];
  /** První odpovědi na příklady lekce (opakování na konci se nepočítá). */
  answers: Answer[];
  wrongDisplays: string[];
  /** Pozice ve frontě, kde se má pokračovat. */
  index: number;
  /** Na aktuální příklad už přišla jedna špatná odpověď. */
  secondTry: boolean;
  savedAt: number;
}

/** Po jak dlouhé pauze se rozehraná lekce zahodí a začne se nová. */
export const RESUME_LIMIT_MS = 30 * 60_000;

const key = (playerId: number) => `ksp.lesson.${playerId}`;

export function saveLesson(playerId: number, lesson: Omit<SavedLesson, 'savedAt'>, now = Date.now()): void {
  try {
    localStorage.setItem(key(playerId), JSON.stringify({ ...lesson, savedAt: now }));
  } catch {
    /* bez úložiště se lekce po obnovení stránky jen nezachová */
  }
}

export function clearLesson(playerId: number): void {
  try {
    localStorage.removeItem(key(playerId));
  } catch {
    /* ignore */
  }
}

/** Vrátí rozehranou lekci, pokud existuje a není moc stará. */
export function loadLesson(playerId: number, now = Date.now()): SavedLesson | null {
  try {
    const raw = localStorage.getItem(key(playerId));
    if (!raw) return null;
    const l = JSON.parse(raw) as SavedLesson;
    const valid = Array.isArray(l.queue) && Array.isArray(l.answers) && Number.isInteger(l.index) && l.queue.length > 0;
    if (!valid || now - l.savedAt > RESUME_LIMIT_MS) {
      clearLesson(playerId);
      return null;
    }
    return l;
  } catch {
    return null;
  }
}
