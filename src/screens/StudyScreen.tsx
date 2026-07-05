import { useMemo, useState } from 'react';
import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import type { Card } from '../types';

/** Split the sentence around the key phrase occurrence for highlighting. */
function splitSentence(card: Card): { before: string; match: string; after: string } | null {
  const { sentence } = card;
  const needle = card.keyPhrase.surface ?? card.keyPhrase.text;
  const idx = sentence.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return null;
  return {
    before: sentence.slice(0, idx),
    match: sentence.slice(idx, idx + needle.length),
    after: sentence.slice(idx + needle.length),
  };
}

export function StudyScreen({ cardId, from }: { cardId: string; from: 'audience' | 'quest' }) {
  const { state, dispatch } = useGame();
  const { cards, speakers, loading } = useCards();
  const [showKo, setShowKo] = useState(false);
  const [vocabOpen, setVocabOpen] = useState<string | null>(null);

  const card = cards.find((c) => c.id === cardId);
  const speaker = card ? speakers.find((s) => s.id === card.speakerId) : undefined;
  const mastery = state.save.cards[cardId]?.mastery ?? 0;

  const parts = useMemo(() => (card ? splitSentence(card) : null), [card]);

  if (loading || !card) {
    return <div className="grid min-h-screen place-items-center italic text-[#9c8a6a]">Opening the teaching…</div>;
  }

  const due = mastery === 1 && state.save.reviewQueue.includes(card.id);
  const quizMode: 'capture' | 'master' = mastery === 0 ? 'capture' : 'master';
  const canQuiz = mastery === 0 || due;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[13px] italic text-[#b98b46]">A teaching from {speaker?.name ?? card.speakerId}</span>
        <button
          className="btn-ghost"
          onClick={() =>
            dispatch({
              type: 'GOTO',
              screen:
                from === 'audience'
                  ? { name: 'audience', speakerId: card.speakerId }
                  : { name: 'home' },
            })
          }
        >
          ← Back
        </button>
      </div>

      {/* full sentence with highlighted key phrase */}
      <blockquote className="m-0 mb-2 border-l-2 border-[rgba(220,200,150,0.35)] pl-4 text-[22px] italic leading-relaxed text-[#e2d3b2]">
        “
        {parts ? (
          <>
            {parts.before}
            <mark className="rounded bg-[rgba(240,213,136,0.22)] px-1 not-italic text-[#ffe9a8]">
              {parts.match}
            </mark>
            {parts.after}
          </>
        ) : (
          card.sentence
        )}
        ”
      </blockquote>
      <div className="font-cinzel mb-6 text-[11px] uppercase tracking-[1.5px] text-[#b98b46]">
        — {speaker?.name ?? card.speakerId}
        {card.timestamp ? ` · ${card.timestamp}` : ''}
      </div>

      {/* key phrase card — meaning_ko is the one Korean element in the app */}
      <section className="mb-4 rounded-xl border border-[#8a5e30] bg-[#120d18] p-4">
        <div className="mb-1 text-[11px] uppercase tracking-[1px] text-[#9c8a6a]">🗝 Key Phrase</div>
        <div className="font-cinzel text-xl font-bold lowercase text-[#f0e2c2]">{card.keyPhrase.text}</div>
        <div
          className="mt-2 cursor-pointer"
          onClick={() => setShowKo((v) => !v)}
          title="Tap to reveal the Korean meaning"
        >
          {showKo ? (
            <div className="fade-in font-kr text-[15px] font-semibold text-[#e2d3b2]">
              {card.keyPhrase.meaning_ko}
            </div>
          ) : (
            <div className="select-none text-[13px] italic text-[#6f6450]">🇰🇷 tap to reveal Korean meaning</div>
          )}
        </div>
        {card.keyPhrase.usageTip && (
          <div className="mt-2 text-[13px] leading-relaxed text-[#9c8a6a]">💡 {card.keyPhrase.usageTip}</div>
        )}
      </section>

      {/* context */}
      <section className="mb-4 rounded-xl border border-[rgba(220,200,150,0.2)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="mb-1 text-[11px] uppercase tracking-[1px] text-[#9c8a6a]">📖 The Story</div>
        <p className="m-0 text-[14px] leading-relaxed text-[#cdbfa6]">{card.context}</p>
      </section>

      {/* vocabulary */}
      {card.vocabulary.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 text-[11px] uppercase tracking-[1px] text-[#9c8a6a]">📚 Vocabulary</div>
          <div className="flex flex-wrap gap-2">
            {card.vocabulary.map((v) => (
              <button
                key={v.word}
                className="chip"
                onClick={() => setVocabOpen(vocabOpen === v.word ? null : v.word)}
              >
                {v.word}
              </button>
            ))}
          </div>
          {vocabOpen && (
            <div className="fade-in mt-3 rounded-xl border border-[rgba(220,200,150,0.25)] bg-[#120d18] p-4">
              {card.vocabulary
                .filter((v) => v.word === vocabOpen)
                .map((v) => (
                  <div key={v.word}>
                    <div className="font-cinzel text-[15px] font-semibold text-[#f0e2c2]">{v.word}</div>
                    <div className="mt-1 text-[13px] text-[#e2d3b2]">{v.meaning}</div>
                    {v.note && <div className="mt-1 text-[12px] italic text-[#9c8a6a]">{v.note}</div>}
                    {v.synonyms && v.synonyms.length > 0 && (
                      <div className="font-cinzel mt-1.5 text-[11px] tracking-[1px] text-[#b98b46]">
                        ≈ {v.synonyms.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      <div className="flex justify-center pb-8">
        {canQuiz ? (
          <button
            className="btn-gold px-8 py-3.5 text-[13px]"
            onClick={() =>
              dispatch({ type: 'GOTO', screen: { name: 'quiz', cardId: card.id, mode: quizMode, from } })
            }
          >
            {quizMode === 'capture' ? 'Inscribe this teaching →' : 'Retrace the fading ink → (Master)'}
          </button>
        ) : (
          <div className="text-[13px] italic text-[#9c8a6a]">
            {mastery === 2 ? '✦ Already mastered' : 'The master challenge opens tomorrow'}
          </div>
        )}
      </div>
    </div>
  );
}
