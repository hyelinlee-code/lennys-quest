import { useMemo, useState } from 'react';
import { useGame } from '../game/GameProvider';
import { useCards } from '../hooks/useCards';
import { HOME_GREETINGS, fill } from '../game/scenes';
import { lanternStage } from '../game/review';
import { nextQuestStep, questCounts } from '../game/quest';
import { SettingsModal } from '../components/SettingsModal';
import { VnScene, SpeechBubble } from '../components/vn/VnScene';

export function HomeScreen() {
  const { state, dispatch } = useGame();
  const { cards, loading } = useCards();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const save = state.save;

  const { reviews, newRemaining } = useMemo(() => questCounts(save, cards), [save, cards]);
  const lantern = lanternStage(save.streak.current);

  const greeting = useMemo(() => {
    const pickFrom =
      reviews > 0
        ? HOME_GREETINGS.reviewsDue
        : newRemaining > 0
          ? HOME_GREETINGS.newAvailable
          : HOME_GREETINGS.allClear;
    const template = pickFrom[save.session.count % pickFrom.length];
    return fill(template, { n: reviews, name: save.playerName });
  }, [reviews, newRemaining, save.session.count, save.playerName]);

  function startQuest() {
    const step = nextQuestStep(save, cards);
    if (!step) return;
    if (step.kind === 'review') {
      dispatch({ type: 'GOTO', screen: { name: 'quiz', cardId: step.cardId, mode: 'master', from: 'quest' } });
    } else {
      dispatch({ type: 'GOTO', screen: { name: 'study', cardId: step.cardId, from: 'quest' } });
    }
  }

  const questLabel =
    reviews > 0
      ? `Today's Quest (${reviews} review · ${newRemaining} new)`
      : newRemaining > 0
        ? `Today's Quest (${newRemaining} new)`
        : "Today's Quest complete ✦";

  return (
    <VnScene
      scene="study"
      topRight={
        <div className="flex items-center gap-3 rounded-full bg-[rgba(8,6,13,0.55)] px-4 py-1.5 backdrop-blur-sm">
          <span className="text-[13px] text-[#e2d3b2]" title={`${save.streak.current}-day streak`}>
            {lantern.icon} {lantern.label} · day {save.streak.current}
          </span>
          <span className="font-cinzel text-[11px] tracking-[1px] text-[#9c8a6a]">DAY {save.session.count}</span>
          <button
            className="cursor-pointer border-none bg-transparent text-lg text-[#cdbfa6] hover:text-[#f0e2c2]"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      }
    >
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="font-cinzel text-xs uppercase tracking-[3px] text-[#e7d6ad] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Lenny's Study
        </div>

        <SpeechBubble name="Lenny">{loading ? '…' : greeting}</SpeechBubble>

        {/* PM3-style menu stack, right of the character under the bubble */}
        <div className="flex flex-col gap-3 sm:max-w-sm sm:self-end">
          <button
            className="btn-gold py-3.5"
            disabled={loading || (reviews === 0 && newRemaining === 0)}
            onClick={startQuest}
          >
            {questLabel}
          </button>
          <button className="btn-ghost bg-[rgba(8,6,13,0.55)] py-3.5" onClick={() => dispatch({ type: 'GOTO', screen: { name: 'map' } })}>
            Valley Map
          </button>
          <button className="btn-ghost bg-[rgba(8,6,13,0.55)] py-3.5" onClick={() => dispatch({ type: 'GOTO', screen: { name: 'dex' } })}>
            My Grimoire
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </VnScene>
  );
}
