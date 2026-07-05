import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import { HOUSES, type House, type Speaker } from '../types';

const PLACEHOLDER = `${import.meta.env.BASE_URL}cards/_placeholder.svg`;

/** Silhouette plaques shown for Masters not yet in the dataset — creates "want". */
const COMING_SOON: Record<House, number> = { founder: 1, investor: 2, operator: 1 };

export function MapScreen() {
  const { state, dispatch } = useGame();
  const { cards, speakers, loading, error } = useCards();
  const save = state.save;

  function progressFor(sp: Speaker) {
    const spCards = cards.filter((c) => c.speakerId === sp.id);
    const captured = spCards.filter((c) => (save.cards[c.id]?.mastery ?? 0) >= 1).length;
    return { captured, total: spCards.length };
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-[rgba(220,200,150,0.16)] pb-5">
        <div>
          <h1 className="font-cinzel m-0 text-2xl font-bold text-[#f0e2c2]">Valley Map</h1>
          <p className="m-0 mt-1 text-[13px] italic text-[#9c8a6a]">Seek out a sage and ask for a teaching</p>
        </div>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'GOTO', screen: { name: 'home' } })}>
          ← Back to the Study
        </button>
      </div>

      {loading && <div className="italic text-[#9c8a6a]">Unrolling the map…</div>}
      {error && <div className="text-[#e6a15e]">Couldn't load the map: {error}</div>}

      {(Object.keys(HOUSES) as House[]).map((house) => {
        const houseSpeakers = speakers.filter((s) => s.house === house);
        const info = HOUSES[house];
        return (
          <section key={house} className="mb-8">
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-cinzel m-0 text-lg font-bold" style={{ color: info.color }}>
                {info.name}
              </h2>
              <span className="text-[11px] italic text-[#6f6450]">{info.subtitle}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {houseSpeakers.map((sp) => {
                const { captured, total } = progressFor(sp);
                const complete = total > 0 && captured === total;
                return (
                  <button
                    key={sp.id}
                    onClick={() => dispatch({ type: 'GOTO', screen: { name: 'audience', speakerId: sp.id } })}
                    className="cursor-pointer rounded-xl border-2 bg-[#120d18] p-3 text-left transition-transform hover:-translate-y-1"
                    style={{ borderColor: complete ? '#f0c46a' : `${info.color}88` }}
                  >
                    <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg">
                      <img
                        src={`${import.meta.env.BASE_URL}${sp.portrait.replace(/^\//, '')}`}
                        alt={sp.name}
                        className="portrait-window h-full w-full"
                        style={{ objectPosition: '50% 22%' }}
                        onError={(e) => {
                          if (!e.currentTarget.src.endsWith('_placeholder.svg')) e.currentTarget.src = PLACEHOLDER;
                        }}
                      />
                      {complete && (
                        <div className="absolute right-1.5 top-1.5 grid h-8 w-8 rotate-[-12deg] place-items-center rounded-full border-2 border-[#f0c46a] bg-[radial-gradient(circle_at_35%_30%,#c64a35,#7e1f14)] font-cinzel text-[13px] text-[#ffe7b0]">
                          ✦
                        </div>
                      )}
                    </div>
                    <div className="font-cinzel text-[13px] font-semibold text-[#ecdcb6]">{sp.name}</div>
                    <div className="text-[11px] italic text-[#9c8a6a]">{sp.epithet}</div>
                    <div className="mt-1 text-[11px] text-[#b98b46]">
                      Teachings {captured}/{total}
                    </div>
                  </button>
                );
              })}
              {Array.from({ length: COMING_SOON[house] }).map((_, i) => (
                <div
                  key={`soon-${i}`}
                  className="rounded-xl border-2 border-dashed border-[#3a3344] bg-[#0d0a14] p-3 opacity-70"
                >
                  <div className="mb-2 grid aspect-square w-full place-items-center rounded-lg bg-[#120d18] text-4xl text-[rgba(170,150,120,0.2)]">
                    ?
                  </div>
                  <div className="font-cinzel text-[13px] tracking-[3px] text-[#5b5168]">? ? ?</div>
                  <div className="text-[11px] italic text-[#5b5168]">a sage yet to arrive</div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
