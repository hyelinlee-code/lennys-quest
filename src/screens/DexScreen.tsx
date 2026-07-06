import { useMemo, useState } from 'react';
import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import { DexGrid, cardMastery } from '../components/DexGrid';
import { ProgressBars } from '../components/ProgressBars';
import { TiltCard, shortExcerpt } from '../components/TiltCard';
import { HOUSES, type Card, type House } from '../types';

type Tab = 'all' | House;

export function DexScreen({ focusCardId }: { focusCardId?: string }) {
  const { state, dispatch } = useGame();
  const { cards, speakers, loading, error } = useCards();
  const save = state.save;
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<Card | null>(
    () => cards.find((c) => c.id === focusCardId) ?? null,
  );

  const speakerHouse = useMemo(() => new Map(speakers.map((s) => [s.id, s.house])), [speakers]);
  const visible = useMemo(
    () => (tab === 'all' ? cards : cards.filter((c) => speakerHouse.get(c.speakerId) === tab)),
    [cards, tab, speakerHouse],
  );

  const captured = visible.filter((c) => cardMastery(save, c.id) >= 1).length;
  const mastered = visible.filter((c) => cardMastery(save, c.id) >= 2).length;

  const selSpeaker = selected ? speakers.find((s) => s.id === selected.speakerId) : undefined;
  const selMastery = selected ? cardMastery(save, selected.id) : 0;
  const selDue = selected ? selMastery === 1 && save.reviewQueue.includes(selected.id) : false;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-5 flex flex-col gap-4 border-b border-[rgba(220,200,150,0.16)] pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="font-cinzel m-0 text-2xl font-bold text-[#f0e2c2]">My Grimoire</h1>
            <span className="font-cinzel rounded-full border border-[rgba(185,139,70,0.45)] px-2.5 py-0.5 text-[10px] uppercase tracking-[2px] text-[#b98b46]">
              Card Dex
            </span>
          </div>
          <button className="btn-ghost" onClick={() => dispatch({ type: 'GOTO', screen: { name: 'home' } })}>
            ← Back to the Study
          </button>
        </div>
        <ProgressBars captured={captured} mastered={mastered} total={visible.length} />
        <div className="flex flex-wrap gap-2">
          {(['all', 'founder', 'investor', 'operator'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-cinzel cursor-pointer rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                tab === t
                  ? 'border-[#caa24f] bg-[rgba(202,162,79,0.15)] text-[#f0e2c2]'
                  : 'border-[rgba(220,200,150,0.2)] bg-transparent text-[#9c8a6a] hover:text-[#e2d3b2]'
              }`}
            >
              {t === 'all' ? 'All' : HOUSES[t].name}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="italic text-[#9c8a6a]">Opening the grimoire…</div>}
      {error && <div className="text-[#e6a15e]">Couldn't load the grimoire: {error}</div>}

      <DexGrid cards={visible} speakers={speakers} save={save} onSelect={setSelected} />

      <div className="mt-6 text-center text-[13px] italic text-[#8c7d63]">
        The day every page is filled, all the wisdom of the Valley is yours
      </div>

      {/* card detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,4,10,0.78)] p-6 backdrop-blur-[7px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="relative flex w-full max-w-3xl flex-col items-center gap-6 md:flex-row">
            <button
              className="absolute -top-3 right-0 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-[rgba(220,200,150,0.35)] bg-[rgba(20,15,28,0.9)] text-lg text-[#e8d9b8]"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
            <TiltCard
              imageSrc={
                selSpeaker
                  ? `${import.meta.env.BASE_URL}${selSpeaker.portrait.replace(/^\//, '')}`
                  : `${import.meta.env.BASE_URL}cards/_placeholder.svg`
              }
              rarity={selected.rarity}
              veiled={selMastery === 0}
              zones={selSpeaker?.overlayZones}
              overlay={{
                expression: selected.keyPhrase.text,
                excerpt: shortExcerpt(selected.sentence, selected.keyPhrase.surface),
                speaker: selSpeaker?.name,
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`p-gem font-cinzel rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[1.5px] ${selected.rarity}`}>
                  {selected.rarity}
                </span>
                <span className="text-[15px] tracking-[2px] text-[#ffd87a]">
                  {selMastery === 2 ? '★★' : selMastery === 1 ? '★☆' : '☆☆'}
                </span>
                {selDue && <span className="text-[11px] italic text-[#cbb7de]">ink fading</span>}
              </div>
              <h2 className="font-cinzel m-0 text-2xl font-bold lowercase text-[#f0e2c2]">
                {selMastery === 0 ? '? ? ?' : selected.keyPhrase.text}
              </h2>
              {selMastery > 0 && (
                <>
                  <div className="font-kr text-[15px] font-semibold text-[#e2d3b2]">
                    {selected.keyPhrase.meaning_ko}
                  </div>
                  <blockquote className="m-0 border-l-2 border-[rgba(220,200,150,0.35)] pl-3 text-[14px] italic text-[#b6a585]">
                    “{selected.sentence}”
                  </blockquote>
                </>
              )}
              <div className="font-cinzel text-[11px] uppercase tracking-[1.5px] text-[#b98b46]">
                {selSpeaker ? `${selSpeaker.name} · ${selSpeaker.title}` : ''}
              </div>
              <div className="mt-1 flex flex-wrap gap-2.5">
                <button
                  className="btn-gold"
                  onClick={() => {
                    if (selMastery === 0) {
                      dispatch({
                        type: 'GOTO',
                        screen: { name: 'study', cardId: selected.id, from: 'audience' },
                      });
                    } else if (selDue) {
                      dispatch({
                        type: 'GOTO',
                        screen: { name: 'quiz', cardId: selected.id, mode: 'master', from: 'audience' },
                      });
                    } else {
                      dispatch({
                        type: 'GOTO',
                        screen: { name: 'study', cardId: selected.id, from: 'audience' },
                      });
                    }
                  }}
                >
                  {selMastery === 0 ? 'Study →' : selDue ? 'Master challenge →' : 'Study again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
