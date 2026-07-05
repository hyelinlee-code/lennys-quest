import { useMemo } from 'react';
import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import { TiltCard, shortExcerpt } from '../components/TiltCard';
import { SpeechBubble } from '../components/vn/VnScene';
import { CARD_EARNED_LINES, CARD_MASTERED_LINES, fill } from '../game/scenes';
import { nextQuestStep } from '../game/quest';

export function RevealScreen({
  cardId,
  result,
  from,
}: {
  cardId: string;
  result: 'captured' | 'mastered';
  from: 'audience' | 'quest';
}) {
  const { state, dispatch } = useGame();
  const { cards, speakers, loading } = useCards();
  const save = state.save;

  const card = cards.find((c) => c.id === cardId);
  const speaker = card ? speakers.find((s) => s.id === card.speakerId) : undefined;

  const spCards = card ? cards.filter((c) => c.speakerId === card.speakerId) : [];
  const sealJustEarned =
    result === 'captured' &&
    spCards.length > 0 &&
    spCards.every((c) => (save.cards[c.id]?.mastery ?? 0) >= 1);

  const lennyLine = useMemo(() => {
    if (!card) return '';
    if (sealJustEarned && speaker) {
      return `Incredible… you've inscribed all ${spCards.length} of ${speaker.name}'s teachings! The sage has granted you their Seal. ✦`;
    }
    const pool = result === 'mastered' ? CARD_MASTERED_LINES : CARD_EARNED_LINES;
    const template = pool[card.id.length % pool.length];
    return fill(template, { phrase: card.keyPhrase.text, speaker: speaker?.name ?? '' });
  }, [card, result, sealJustEarned, speaker, spCards.length]);

  if (loading || !card) {
    return <div className="grid min-h-screen place-items-center text-[#9c8a6a]">…</div>;
  }

  const img = speaker
    ? `${import.meta.env.BASE_URL}${speaker.portrait.replace(/^\//, '')}`
    : `${import.meta.env.BASE_URL}cards/_placeholder.svg`;

  function continueNext() {
    if (from === 'quest') {
      const step = nextQuestStep(save, cards);
      if (step) {
        if (step.kind === 'review') {
          dispatch({
            type: 'GOTO',
            screen: { name: 'quiz', cardId: step.cardId, mode: 'master', from: 'quest' },
          });
        } else {
          dispatch({ type: 'GOTO', screen: { name: 'study', cardId: step.cardId, from: 'quest' } });
        }
        return;
      }
      dispatch({ type: 'GOTO', screen: { name: 'home' } });
      return;
    }
    dispatch({ type: 'GOTO', screen: { name: 'audience', speakerId: card!.speakerId } });
  }

  const nextStep = from === 'quest' ? nextQuestStep(save, cards) : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="font-cinzel text-[13px] uppercase tracking-[3px] text-[#ffd87a]">
        {result === 'mastered' ? '✦ Mastered ★★' : '✦ Captured ★☆'}
      </div>

      <TiltCard
        imageSrc={img}
        rarity={card.rarity}
        bloom
        overlay={{
          expression: card.keyPhrase.text,
          excerpt: shortExcerpt(card.sentence, card.keyPhrase.surface),
          speaker: speaker?.name,
        }}
      />

      <SpeechBubble name="Lenny" tail={false} className="w-full max-w-xl">
        {lennyLine}
      </SpeechBubble>

      <div className="flex gap-3">
        <button className="btn-gold px-7 py-3" onClick={continueNext}>
          {from === 'quest' && nextStep
            ? nextStep.kind === 'review'
              ? 'Next: review →'
              : 'Next teaching →'
            : 'Into the grimoire →'}
        </button>
        <button
          className="btn-ghost"
          onClick={() => dispatch({ type: 'GOTO', screen: { name: 'dex', focusCardId: card.id } })}
        >
          Open grimoire
        </button>
      </div>
    </div>
  );
}
