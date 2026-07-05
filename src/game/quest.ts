import type { Card, SaveGame } from '../types';

export const NEW_CARDS_PER_SESSION = 2;

export type QuestStep = { kind: 'review'; cardId: string } | { kind: 'new'; cardId: string };

export function capturedThisSession(save: SaveGame): number {
  return Object.values(save.cards).filter(
    (p) => p.mastery >= 1 && p.capturedSession === save.session.count,
  ).length;
}

/**
 * Today's quest board: due reviews FIRST (soft review gate), then up to
 * NEW_CARDS_PER_SESSION new teachings. Streak 3+ biases new picks toward rare
 * ("레니가 소문을 들었어요").
 */
export function nextQuestStep(save: SaveGame, cards: Card[]): QuestStep | null {
  const due = save.reviewQueue.find((id) => (save.cards[id]?.mastery ?? 0) === 1);
  if (due) return { kind: 'review', cardId: due };

  if (capturedThisSession(save) >= NEW_CARDS_PER_SESSION) return null;

  const fresh = cards.filter((c) => (save.cards[c.id]?.mastery ?? 0) === 0);
  if (fresh.length === 0) return null;

  const rareBias = save.streak.current >= 3;
  const pick = rareBias ? fresh.find((c) => c.rarity === 'rare') ?? fresh[0] : fresh[0];
  return { kind: 'new', cardId: pick.id };
}

export function questCounts(save: SaveGame, cards: Card[]) {
  const reviews = save.reviewQueue.filter((id) => (save.cards[id]?.mastery ?? 0) === 1).length;
  const fresh = cards.filter((c) => (save.cards[c.id]?.mastery ?? 0) === 0).length;
  const newRemaining = Math.max(0, Math.min(NEW_CARDS_PER_SESSION - capturedThisSession(save), fresh));
  return { reviews, newRemaining };
}
