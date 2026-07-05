import { useRef, type PointerEvent } from 'react';

interface TiltCardProps {
  imageSrc: string;
  rare: boolean;
  veiled?: boolean;
  bloom?: boolean;
  /** Text for the top banner zone (expression) */
  banner?: string;
  /** Text for the bottom scroll zone (speaker) */
  scroll?: string;
  onClick?: () => void;
}

const PLACEHOLDER = `${import.meta.env.BASE_URL}cards/_placeholder.svg`;

/** Full-art 5:7 card with pointer-follow 3D tilt + holographic glare (ported from wizard_dex_full.html). */
export function TiltCard({ imageSrc, rare, veiled, bloom, banner, scroll, onClick }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateY(${(px - 0.5) * 16}deg) rotateX(${-(py - 0.5) * 18}deg)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '35%');
  }

  return (
    <div className="stage">
      <div
        ref={ref}
        className={`fcard${rare ? ' rare' : ''}${veiled ? ' veiled' : ''}${bloom ? ' bloom' : ''}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={onClick}
      >
        <img
          src={imageSrc}
          alt=""
          onError={(e) => {
            if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
          }}
        />
        <div className="mholo" />
        <div className="fz fc-banner">
          <div className="fc-expr">{veiled ? '' : banner}</div>
        </div>
        <div className="fz fc-scroll">
          <div className="fc-spk">{veiled ? '' : scroll}</div>
        </div>
      </div>
    </div>
  );
}
