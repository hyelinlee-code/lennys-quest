import { useMemo, useState } from 'react';
import type { Card } from '../types';

interface ChipQuizProps {
  card: Card;
  mode: 'capture' | 'master';
  onSuccess: () => void;
  onFail: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Chip-arrangement quiz (ported from wizard_dex_full.html).
 * Capture: chips only, Korean-meaning hint. Master: chips + distractors, no hint.
 * `placed` stores pool INDICES so duplicate words ("the ... the ...") work correctly.
 */
export function ChipQuiz({ card, mode, onSuccess, onFail }: ChipQuizProps) {
  const isMaster = mode === 'master';
  const { chips, distractorChips } = card.keyPhrase;

  const [pool, setPool] = useState<string[]>(() =>
    shuffle(isMaster ? [...chips, ...distractorChips] : [...chips]),
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ text: string; kind: '' | 'warn' | 'ok' }>({
    text: isMaster ? 'Decoy words are mixed in — real ones only, in order!' : 'Tap the words in order to build the phrase',
    kind: '',
  });
  const [shaking, setShaking] = useState(false);
  const [done, setDone] = useState(false);

  const hint = useMemo(
    () => (isMaster ? 'Decoy words are mixed in — real ones only, in order!' : 'Tap the words in order to build the phrase'),
    [isMaster],
  );

  function place(idx: number) {
    if (done) return;
    setPlaced((p) => [...p, idx]);
    setMsg({ text: hint, kind: '' });
  }

  function unplace(pos: number) {
    if (done) return;
    setPlaced((p) => p.filter((_, i) => i !== pos));
    setMsg({ text: hint, kind: '' });
  }

  function reset() {
    if (done) return;
    setPlaced([]);
    setPool(shuffle(isMaster ? [...chips, ...distractorChips] : [...chips]));
    setMsg({ text: hint, kind: '' });
  }

  function check() {
    if (done) return;
    const built = placed.map((i) => pool[i]);
    if (built.length === 0) {
      setMsg({ text: 'Tap some words first', kind: 'warn' });
      return;
    }
    if (built.join(' ') !== chips.join(' ')) {
      setMsg({
        text: isMaster
          ? 'Not yet — drop the decoys and fix the order'
          : 'Order is off — try again (no penalty)',
        kind: 'warn',
      });
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      onFail();
      return;
    }
    setDone(true);
    setMsg({ text: isMaster ? 'Mastered! ★★' : 'Captured! ★☆', kind: 'ok' });
    setTimeout(onSuccess, 650);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`cap-answer${shaking ? ' shake' : ''}`}>
        {placed.length === 0 && (
          <span className="italic text-[13px] text-[#6f6450]">words stack here, in order</span>
        )}
        {placed.map((poolIdx, pos) => (
          <button key={`${poolIdx}-${pos}`} className="chip placed" onClick={() => unplace(pos)}>
            {pool[poolIdx]}
          </button>
        ))}
      </div>
      <div className="flex min-h-[38px] flex-wrap gap-2">
        {pool.map((tok, idx) =>
          placed.includes(idx) ? null : (
            <button key={idx} className="chip" onClick={() => place(idx)}>
              {tok}
            </button>
          ),
        )}
      </div>
      <div
        className={`min-h-[18px] text-[13px] tracking-[0.3px] ${
          msg.kind === 'warn' ? 'text-[#e6a15e]' : msg.kind === 'ok' ? 'text-[#7ed08f]' : 'text-[#9c8a6a]'
        }`}
      >
        {msg.text}
      </div>
      <div className="flex items-center gap-2.5">
        <button className="btn-gold" onClick={check}>
          Check →
        </button>
        <button className="btn-ghost" onClick={reset}>
          Shuffle
        </button>
      </div>
    </div>
  );
}
