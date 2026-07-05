import { useMemo } from 'react';
import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import { ChipQuiz } from '../components/ChipQuiz';
import { TiltCard } from '../components/TiltCard';
import type { Card } from '../types';

/** Cloze: replace the key-phrase occurrence in the sentence with a blank. */
function clozeSentence(card: Card): string | null {
  const needle = card.keyPhrase.surface ?? card.keyPhrase.text;
  const idx = card.sentence.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return null;
  return `${card.sentence.slice(0, idx)}⟨ ______ ⟩${card.sentence.slice(idx + needle.length)}`;
}

export function QuizScreen({
  cardId,
  mode,
  from,
}: {
  cardId: string;
  mode: 'capture' | 'master';
  from: 'audience' | 'quest';
}) {
  const { dispatch } = useGame();
  const { cards, speakers, loading } = useCards();

  const card = cards.find((c) => c.id === cardId);
  const speaker = card ? speakers.find((s) => s.id === card.speakerId) : undefined;
  const cloze = useMemo(() => (card ? clozeSentence(card) : null), [card]);

  if (loading || !card) {
    return <div className="grid min-h-screen place-items-center text-[#9c8a6a]">…</div>;
  }

  const isMaster = mode === 'master';
  const img = speaker
    ? `${import.meta.env.BASE_URL}${speaker.portrait.replace(/^\//, '')}`
    : `${import.meta.env.BASE_URL}cards/_placeholder.svg`;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-cinzel text-[12px] uppercase tracking-[2px] text-[#b98b46]">
          {isMaster ? 'Master Challenge' : 'Capture Challenge'}
        </span>
        <button
          className="btn-ghost"
          onClick={() =>
            dispatch({
              type: 'GOTO',
              screen: { name: 'study', cardId: card.id, from },
            })
          }
        >
          ← Back to study
        </button>
      </div>

      <div className="flex flex-col items-center gap-7 md:flex-row md:items-start">
        <TiltCard imageSrc={img} rarity={card.rarity} veiled />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className={`p-gem font-cinzel rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[1.5px] ${card.rarity}`}>
              {card.rarity}
            </span>
          </div>

          {/* cloze sentence — the phrase's place in the real sentence */}
          {cloze && (
            <blockquote className="m-0 border-l-2 border-[rgba(220,200,150,0.35)] pl-3 text-[16px] italic leading-relaxed text-[#b6a585]">
              “{cloze}”
            </blockquote>
          )}

          {/* capture shows the Korean meaning; master shows nothing more (no hint) */}
          {!isMaster ? (
            <div className="font-kr text-lg font-semibold leading-relaxed text-[#f0e2c2]">
              {card.keyPhrase.meaning_ko}
            </div>
          ) : (
            <div className="text-[13px] italic text-[#9c8a6a]">
              Complete the blank from memory — no hints this time.
            </div>
          )}

          <ChipQuiz
            key={`${card.id}-${mode}`}
            card={card}
            mode={mode}
            onFail={() => dispatch({ type: 'QUIZ_FAILED', cardId: card.id })}
            onSuccess={() => {
              dispatch({ type: 'QUIZ_PASSED', cardId: card.id, mode });
              dispatch({
                type: 'GOTO',
                screen: {
                  name: 'reveal',
                  cardId: card.id,
                  result: isMaster ? 'mastered' : 'captured',
                  from,
                },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
