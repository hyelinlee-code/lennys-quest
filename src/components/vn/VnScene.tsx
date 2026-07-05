import { useState, type ReactNode } from 'react';

const LENNY_PNG = `${import.meta.env.BASE_URL}portraits/lenny.png`;
const LENNY_FALLBACK = `${import.meta.env.BASE_URL}portraits/lenny.svg`;

interface VnSceneProps {
  /** Background image name — loads /backgrounds/<scene>.png, hidden if missing */
  scene?: string;
  /** Show the Lenny sprite anchored bottom-left (Princess Maker 3 stage) */
  sprite?: boolean;
  /** Content rendered in the bubble zone, right of the character */
  children: ReactNode;
  /** Extra content pinned to the top-right corner inside the frame (status strip) */
  topRight?: ReactNode;
  /** Extra content pinned to the bottom-right corner inside the frame (skip button etc.) */
  bottomRight?: ReactNode;
  onClickScene?: () => void;
}

/**
 * Princess Maker 3-style visual-novel stage: painted background (optional),
 * ornate frame, large character sprite bottom-left, speech-bubble zone to its right.
 */
export function VnScene({ scene, sprite = true, children, topRight, bottomRight, onClickScene }: VnSceneProps) {
  const [bgOk, setBgOk] = useState(true);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" onClick={onClickScene}>
      {/* background layer */}
      {scene && bgOk && (
        <>
          <img
            src={`${import.meta.env.BASE_URL}backgrounds/${scene}.png`}
            alt=""
            onError={() => setBgOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,rgba(8,6,13,0.25)_0%,rgba(8,6,13,0.72)_100%)]" />
        </>
      )}

      {/* ornate frame */}
      <div className="pm-frame" aria-hidden="true">
        <span className="pm-corner pm-tl">✦</span>
        <span className="pm-corner pm-tr">✦</span>
        <span className="pm-corner pm-bl">✦</span>
        <span className="pm-corner pm-br">✦</span>
      </div>

      {/* character sprite — bottom-left, feet on the frame (PM3) */}
      {sprite && (
        <img
          src={LENNY_PNG}
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('.svg')) e.currentTarget.src = LENNY_FALLBACK;
          }}
          alt="Lenny"
          className="fade-in pointer-events-none absolute bottom-[3vh] left-[4vw] z-10 h-[40vh] w-auto drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] sm:bottom-[7vh] sm:left-[6vw] sm:h-[clamp(340px,68vh,760px)]"
        />
      )}

      {/* bubble zone — right of the character */}
      <div
        className={`relative z-20 flex min-h-screen flex-col justify-start px-5 pb-24 pt-[12vh] sm:justify-center sm:pb-[16vh] sm:pt-[8vh] ${
          sprite ? 'sm:ml-[clamp(280px,34vw,520px)] sm:mr-[6vw]' : 'items-center'
        }`}
      >
        {children}
      </div>

      {/* corner slots */}
      {topRight && <div className="absolute right-[3.5vw] top-[26px] z-30">{topRight}</div>}
      {bottomRight && <div className="absolute bottom-[26px] right-[3.5vw] z-30">{bottomRight}</div>}
    </div>
  );
}

interface SpeechBubbleProps {
  name?: string;
  /** Point the tail toward the character (left) — off for centered use */
  tail?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/** Parchment speech bubble with a tail — PM3's white bubble, in-theme. */
export function SpeechBubble({ name = 'Lenny', tail = true, children, onClick, className = '' }: SpeechBubbleProps) {
  return (
    <div className={`speech-bubble ${tail ? 'with-tail' : ''} ${className}`} onClick={onClick}>
      {name && <div className="bubble-name">{name}</div>}
      {children}
    </div>
  );
}
