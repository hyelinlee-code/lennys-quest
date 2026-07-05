import { useEffect, useMemo, useState } from 'react';
import type { DialogueLine } from '../../game/scenes';
import { fill } from '../../game/scenes';
import { VnScene, SpeechBubble } from './VnScene';

interface DialogueSceneProps {
  lines: DialogueLine[];
  vars?: Record<string, string | number>;
  onDone: () => void;
  /** Extra content rendered under the bubble (e.g. choice buttons on the last line) */
  footer?: React.ReactNode;
  skippable?: boolean;
  /** Background scene name (public/backgrounds/<scene>.png) */
  scene?: string;
}

/** PM3-style dialogue player: big sprite left, parchment speech bubble right, tap anywhere to advance. */
export function DialogueScene({ lines, vars = {}, onDone, footer, skippable = true, scene = 'study' }: DialogueSceneProps) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const line = lines[Math.min(lineIdx, lines.length - 1)];
  const text = useMemo(() => fill(line.text, vars), [line, vars]);
  const fullyTyped = reduce || charCount >= text.length;
  const isLast = lineIdx >= lines.length - 1;

  useEffect(() => {
    setCharCount(0);
  }, [lineIdx]);

  useEffect(() => {
    if (reduce || charCount >= text.length) return;
    const t = setTimeout(() => setCharCount((c) => c + 1), 28);
    return () => clearTimeout(t);
  }, [charCount, text, reduce]);

  function advance() {
    if (!fullyTyped) {
      setCharCount(text.length);
      return;
    }
    if (isLast) {
      onDone();
    } else {
      setLineIdx((i) => i + 1);
    }
  }

  return (
    <VnScene
      scene={scene}
      sprite={line.portrait !== 'none'}
      onClickScene={advance}
      bottomRight={
        skippable && !isLast ? (
          <button
            className="btn-ghost opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
          >
            Skip »
          </button>
        ) : undefined
      }
    >
      <div className="flex w-full max-w-xl flex-col gap-5 select-none">
        <SpeechBubble name={line.speaker}>
          <div className="min-h-[3.2em]">
            {reduce ? text : text.slice(0, charCount)}
            {fullyTyped && <span className="vn-cursor"> ▼</span>}
          </div>
        </SpeechBubble>
        {footer && <div onClick={(e) => e.stopPropagation()}>{footer}</div>}
      </div>
    </VnScene>
  );
}
