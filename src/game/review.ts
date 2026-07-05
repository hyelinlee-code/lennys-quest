import type { SaveGame } from '../types';
import { todayStr } from '../lib/storage';

/**
 * Cards captured (★☆) in a PREVIOUS session are due for a master challenge.
 * MVP fixed interval: one session later. Adaptive SRS is post-MVP (storage v2).
 */
export function computeReviewQueue(save: SaveGame): string[] {
  return Object.entries(save.cards)
    .filter(([, p]) => p.mastery === 1 && (p.capturedSession ?? 0) < save.session.count)
    .map(([id]) => id);
}

/**
 * Called on app load and by the dev "다음 날 →" button.
 * Advances session if the calendar date changed (or when forced), rebuilds the
 * review queue, and updates the streak. Never punitive: a broken streak only
 * resets the lantern, cards are untouched.
 */
export function rollSession(save: SaveGame, force = false): SaveGame {
  const today = todayStr();
  const dateChanged = save.session.lastPlayedDate !== today;
  if (!dateChanged && !force) {
    return { ...save, reviewQueue: computeReviewQueue(save) };
  }
  const next: SaveGame = {
    ...save,
    session: { count: save.session.count + 1, lastPlayedDate: today },
  };
  return { ...next, reviewQueue: computeReviewQueue(next) };
}

/** Streak bumps once per calendar day of actual studying (a quiz pass). */
export function bumpStreak(save: SaveGame): SaveGame {
  const today = todayStr();
  if (save.streak.lastActiveDate === today) return save;
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const continued = save.streak.lastActiveDate === yesterday;
  const current = continued ? save.streak.current + 1 : 1;
  return {
    ...save,
    streak: { current, best: Math.max(save.streak.best, current), lastActiveDate: today },
  };
}

/** Lantern stage from streak length — ember → candle → torch → bonfire */
export function lanternStage(streak: number): { icon: string; label: string } {
  if (streak >= 14) return { icon: '🔥', label: 'bonfire' };
  if (streak >= 7) return { icon: '🕯️', label: 'torch' };
  if (streak >= 3) return { icon: '🕯️', label: 'candle' };
  return { icon: '✨', label: 'ember' };
}
