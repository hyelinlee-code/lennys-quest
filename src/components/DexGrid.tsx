import type { Card, SaveGame, Speaker } from '../types';

interface DexGridProps {
  cards: Card[];
  speakers: Speaker[];
  save: SaveGame;
  onSelect: (card: Card) => void;
}

export function cardMastery(save: SaveGame, cardId: string): 0 | 1 | 2 {
  return save.cards[cardId]?.mastery ?? 0;
}

export function DexGrid({ cards, speakers, save, onSelect }: DexGridProps) {
  const bySpeaker = new Map(speakers.map((s) => [s.id, s]));
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[15px]">
      {cards.map((c) => {
        const mastery = cardMastery(save, c.id);
        const locked = mastery === 0;
        const fading = mastery === 1 && save.reviewQueue.includes(c.id);
        const stars = mastery === 2 ? '★★' : mastery === 1 ? '★☆' : '';
        const speaker = bySpeaker.get(c.speakerId);
        const img = speaker?.portrait
          ? `${import.meta.env.BASE_URL}${speaker.portrait.replace(/^\//, '')}`
          : `${import.meta.env.BASE_URL}cards/_placeholder.svg`;
        return (
          <div className="dex-cell" key={c.id}>
            <div
              className={`dex-card ${c.rarity}${locked ? ' locked' : ''}${fading ? ' fading' : ''}`}
              onClick={() => onSelect(c)}
            >
              <img
                className="por"
                src={img}
                alt=""
                onError={(e) => {
                  const ph = `${import.meta.env.BASE_URL}cards/_placeholder.svg`;
                  if (!e.currentTarget.src.endsWith('_placeholder.svg')) e.currentTarget.src = ph;
                }}
              />
              <div className="gholo" />
              {locked && <div className="lock">🔒</div>}
              {stars && <div className="stars">{stars}</div>}
              <div className={`gem ${c.rarity}`}>{c.rarity}</div>
              {fading && <div className="fade-badge">ink fading</div>}
              {mastery === 2 && <div className="seal">✦</div>}
              <div className="label">{locked ? '? ? ?' : c.keyPhrase.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
