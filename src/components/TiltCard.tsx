import { useLayoutEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import type { Rarity, Zone } from '../types';

/** Shrink the banner text until it fits its zone width (expressions vary in length). */
function useFitText(text: string | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !text) return;
    el.style.fontSize = '';
    const parent = el.parentElement;
    if (!parent) return;
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > parent.clientWidth && size > 7) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [text]);
  return ref;
}

/** Card text stays English-only — translations live in the side panel, so one
 *  card art + overlay works for every future translation language. */
export interface CardOverlay {
  expression: string;
  excerpt?: string;
  speaker?: string;
}

interface TiltCardProps {
  imageSrc: string;
  rarity: Rarity;
  veiled?: boolean;
  bloom?: boolean;
  /** Text laid over the art's empty banner/scroll zones (wizard_card.html layout) */
  overlay?: CardOverlay;
  /** Per-image plaque geometry (speaker.overlayZones); defaults to the CSS zones */
  zones?: { banner: Zone; scroll: Zone };
  onClick?: () => void;
}

function zoneStyle(z?: Zone): CSSProperties | undefined {
  if (!z) return undefined;
  return { left: `${z.left}%`, right: `${z.right}%`, top: `${z.top}%`, height: `${z.height}%` };
}

const PLACEHOLDER = `${import.meta.env.BASE_URL}cards/_placeholder.svg`;

/**
 * Trim a long sentence to a scroll-sized excerpt, keeping the key phrase visible —
 * reproduces the manual trimming convention from wizard_card.html
 * ("…but it was the sizzle to the steak.").
 */
export function shortExcerpt(sentence: string, surface?: string): string {
  if (sentence.length <= 60) return sentence;
  const needle = surface?.toLowerCase();
  const idx = needle ? sentence.toLowerCase().indexOf(needle) : -1;
  if (idx < 0) return `${sentence.slice(0, 57).replace(/\s+\S*$/, '')}…`;
  const start = Math.max(0, sentence.lastIndexOf(' ', Math.max(0, idx - 20)) + 1);
  const tail = sentence.slice(start);
  const clipped = tail.length > 80 ? `${tail.slice(0, 77).replace(/\s+\S*$/, '')}…` : tail;
  return start > 0 ? `…${clipped}` : clipped;
}

/** Full-art 5:7 card with pointer-follow 3D tilt + holo sheen + text overlay (ported from wizard_card.html). */
export function TiltCard({ imageSrc, rarity, veiled, bloom, overlay, zones, onClick }: TiltCardProps) {
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

  const showText = !veiled && overlay;
  const bannerRef = useFitText(showText ? overlay.expression : undefined);

  return (
    <div className="stage">
      <div
        ref={ref}
        className={`fcard ${rarity}${veiled ? ' veiled' : ''}${bloom ? ' bloom' : ''}`}
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
        <div className="fz fc-banner" style={zoneStyle(zones?.banner)}>
          <div className="fc-expr" ref={bannerRef}>
            {showText ? overlay.expression : ''}
          </div>
        </div>
        <div className="fz fc-scroll" style={zoneStyle(zones?.scroll)}>
          {showText && (
            <>
              {overlay.excerpt && <div className="fc-exc">“{overlay.excerpt}”</div>}
              {overlay.speaker && <div className="fc-spk">— {overlay.speaker}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
