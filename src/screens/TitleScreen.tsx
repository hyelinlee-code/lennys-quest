import { useState } from 'react';
import { useGame } from '../game/GameProvider';
import { DialogueScene } from '../components/vn/DialogueScene';
import { VnScene, SpeechBubble } from '../components/vn/VnScene';
import { INTRO_AFTER_NAME, INTRO_LINES } from '../game/scenes';

type Phase = 'title' | 'intro' | 'name' | 'afterName';

export function TitleScreen() {
  const { dispatch } = useGame();
  const [phase, setPhase] = useState<Phase>('title');
  const [name, setName] = useState('');

  function finishIntro() {
    dispatch({ type: 'SCENE_SEEN', sceneId: 'intro' });
    dispatch({ type: 'UNLOCK_SPEAKER', speakerId: 'bret-taylor' });
    dispatch({ type: 'GOTO', screen: { name: 'audience', speakerId: 'bret-taylor' } });
  }

  if (phase === 'title') {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="fade-in flex flex-col items-center gap-6 text-center">
          <div className="font-cinzel text-xs uppercase tracking-[4px] text-[#b98b46]">Lenny's Quest</div>
          <h1 className="font-cinzel m-0 text-4xl font-bold text-[#f0e2c2] sm:text-5xl">
            Apprentice of the Valley
          </h1>
          <p className="m-0 max-w-md text-[15px] italic leading-relaxed text-[#9c8a6a]">
            A collectible-card adventure through the wisdom of the world's greatest builders —
            one business-English phrase at a time
          </p>
          <button className="btn-gold mt-4 px-8 py-3.5 text-[13px]" onClick={() => setPhase('intro')}>
            Begin the adventure →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return <DialogueScene lines={INTRO_LINES} onDone={() => setPhase('name')} />;
  }

  if (phase === 'name') {
    return (
      <VnScene scene="study">
        <div className="fade-in flex w-full max-w-xl flex-col gap-5">
          <SpeechBubble name="Lenny">And you, apprentice — what shall I call you?</SpeechBubble>
          <div className="flex w-full max-w-sm flex-col gap-3 sm:self-end">
            <input
              autoFocus
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  dispatch({ type: 'SET_NAME', name: name.trim() });
                  setPhase('afterName');
                }
              }}
              placeholder="Enter your name"
              className="rounded-xl border border-[rgba(220,200,150,0.35)] bg-[rgba(8,6,13,0.65)] px-4 py-3 text-center text-lg text-[#f0e2c2] outline-none backdrop-blur-sm placeholder:text-[#6f6450] focus:border-[#caa24f]"
            />
            <button
              className="btn-gold"
              disabled={!name.trim()}
              onClick={() => {
                dispatch({ type: 'SET_NAME', name: name.trim() });
                setPhase('afterName');
              }}
            >
              That's my name
            </button>
          </div>
        </div>
      </VnScene>
    );
  }

  return (
    <DialogueScene
      lines={INTRO_AFTER_NAME}
      vars={{ name: name.trim() }}
      onDone={finishIntro}
      skippable={false}
    />
  );
}
