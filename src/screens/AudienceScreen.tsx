import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import { HOUSES } from '../types';

const PLACEHOLDER = `${import.meta.env.BASE_URL}cards/_placeholder.svg`;

export function AudienceScreen({ speakerId }: { speakerId: string }) {
  const { state, dispatch } = useGame();
  const { cards, speakers, loading } = useCards();
  const save = state.save;

  const speaker = speakers.find((s) => s.id === speakerId);
  const spCards = cards.filter((c) => c.speakerId === speakerId);
  const captured = spCards.filter((c) => (save.cards[c.id]?.mastery ?? 0) >= 1).length;
  const complete = spCards.length > 0 && captured === spCards.length;

  if (loading) {
    return <div className="grid min-h-screen place-items-center italic text-[#9c8a6a]">Requesting an audience…</div>;
  }
  if (!speaker) {
    return (
      <div className="grid min-h-screen place-items-center">
        <button className="btn-ghost" onClick={() => dispatch({ type: 'GOTO', screen: { name: 'map' } })}>
          ← Back to the map
        </button>
      </div>
    );
  }

  const house = HOUSES[speaker.house];

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-cinzel text-[10px] uppercase tracking-[2px]" style={{ color: house.color }}>
          {house.name}
        </span>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'GOTO', screen: { name: 'map' } })}>
          ← Back to the map
        </button>
      </div>

      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <img
          src={`${import.meta.env.BASE_URL}${speaker.portrait.replace(/^\//, '')}`}
          alt={speaker.name}
          className="h-40 w-32 rounded-xl border-2 border-[#8a5e30] object-cover"
          style={{ objectPosition: '50% 22%' }}
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('_placeholder.svg')) e.currentTarget.src = PLACEHOLDER;
          }}
        />
        <div className="flex-1 text-center sm:text-left">
          <div className="text-[13px] italic text-[#b98b46]">{speaker.epithet}</div>
          <h1 className="font-cinzel m-0 text-2xl font-bold text-[#f0e2c2]">{speaker.name}</h1>
          <div className="mt-1 text-[13px] text-[#9c8a6a]">{speaker.title}</div>
          {speaker.titleHistory && <div className="text-[12px] text-[#6f6450]">{speaker.titleHistory}</div>}
          <div className="vn-box mt-3 p-4">
            <div className="text-[15px] italic leading-relaxed text-[#f0e2c2]">
              “{complete ? speaker.sealLine : speaker.introLine}”
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-cinzel m-0 text-base font-bold text-[#e2d3b2]">Teachings</h2>
        <span className="text-[12px] text-[#b98b46]">
          {captured}/{spCards.length} inscribed {complete && '· Seal earned ✦'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {spCards.map((c) => {
          const mastery = save.cards[c.id]?.mastery ?? 0;
          const due = mastery === 1 && save.reviewQueue.includes(c.id);
          const locked = mastery === 0;
          return (
            <button
              key={c.id}
              onClick={() => {
                if (due) {
                  dispatch({
                    type: 'GOTO',
                    screen: { name: 'quiz', cardId: c.id, mode: 'master', from: 'audience' },
                  });
                } else {
                  dispatch({ type: 'GOTO', screen: { name: 'study', cardId: c.id, from: 'audience' } });
                }
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                locked
                  ? 'border-dashed border-[#3a3344] bg-[#0d0a14] hover:border-[#6b573a]'
                  : 'border-[rgba(220,200,150,0.25)] bg-[#120d18] hover:border-[#caa24f]'
              }`}
            >
              <span className="w-9 text-center text-[15px] text-[#ffd87a]">
                {mastery === 2 ? '★★' : mastery === 1 ? '★☆' : '🔒'}
              </span>
              <span
                className={`font-cinzel flex-1 text-[14px] ${
                  locked ? 'tracking-[3px] text-[#5b5168]' : 'text-[#ecdcb6]'
                }`}
              >
                {locked ? '? ? ?' : c.keyPhrase.text}
              </span>
              {due && <span className="text-[11px] italic text-[#cbb7de]">ink fading — review!</span>}
              <span className={`gem ${c.rarity} static`}>{c.rarity}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
