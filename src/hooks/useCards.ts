import { useEffect, useState } from 'react';
import type { Card, Speaker } from '../types';

export interface ContentData {
  cards: Card[];
  speakers: Speaker[];
  loading: boolean;
  error: string | null;
}

/** Fetches the pre-baked static content (same pattern as Eng-Study's useQuotes). */
export function useCards(): ContentData {
  const [data, setData] = useState<ContentData>({ cards: [], speakers: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/cards.json`).then((r) => {
        if (!r.ok) throw new Error(`cards.json ${r.status}`);
        return r.json() as Promise<Card[]>;
      }),
      fetch(`${import.meta.env.BASE_URL}data/speakers.json`).then((r) => {
        if (!r.ok) throw new Error(`speakers.json ${r.status}`);
        return r.json() as Promise<Speaker[]>;
      }),
    ])
      .then(([cards, speakers]) => {
        if (!cancelled) setData({ cards, speakers, loading: false, error: null });
      })
      .catch((e: Error) => {
        if (!cancelled) setData({ cards: [], speakers: [], loading: false, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
