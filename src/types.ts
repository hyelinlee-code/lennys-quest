// ---------- Content (pre-baked static JSON, never mutated at runtime) ----------
// UI language: English-first. The ONLY Korean field is keyPhrase.meaning_ko
// (product decision 2026-07-05 — shareable on X/LinkedIn).

export type House = 'founder' | 'investor' | 'operator';
export type Rarity = 'common' | 'rare';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface VocabItem {
  word: string;
  meaning: string;
  note?: string;
  synonyms?: string[];
}

export interface KeyPhrase {
  /** Canonical dictionary form, e.g. "learn the hard way" */
  text: string;
  /** Exact substring of `sentence` if the canonical form doesn't appear verbatim, e.g. "learned the hard way" */
  surface?: string;
  /** The one Korean field in the app: natural learner-dictionary Korean gloss */
  meaning_ko: string;
  usageTip?: string;
  /** Derived deterministically from `text` by the pipeline — never LLM-generated */
  chips: string[];
  distractorChips: string[];
}

export interface Card {
  id: string;
  speakerId: string;
  /** Verbatim transcript sentence, 15-35 words (legacy seed cards exempt) */
  sentence: string;
  keyPhrase: KeyPhrase;
  /** 1-2 sentence standalone situation/business-case explanation (English) */
  context: string;
  vocabulary: VocabItem[];
  topics: string[];
  difficulty: Difficulty;
  rarity: Rarity;
  timestamp?: string;
  legacy?: boolean;
}

/** Percent geometry of a blank text zone on the card art (from pipeline/calibrate_zones.py) */
export interface Zone {
  left: number;
  right: number;
  top: number;
  height: number;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  titleHistory?: string;
  house: House;
  epithet: string;
  motif: string;
  introLine: string;
  sealLine: string;
  portrait: string;
  episode: string;
  cardCount: number;
  /** Per-image plaque positions; falls back to the default CSS zones when absent */
  overlayZones?: { banner: Zone; scroll: Zone };
}

// ---------- Runtime save state (localStorage only) ----------

export interface CardProgress {
  mastery: 0 | 1 | 2;
  capturedSession?: number;
  masteredSession?: number;
  failCount: number;
}

export interface SaveGameV1 {
  version: 1;
  updatedAt: string;
  playerName: string;
  session: { count: number; lastPlayedDate: string };
  cards: Record<string, CardProgress>;
  reviewQueue: string[];
  streak: { current: number; best: number; lastActiveDate: string };
  story: { scenesSeen: string[]; unlockedSpeakers: string[] };
}

export type SaveGame = SaveGameV1;

// ---------- Screen state machine (no router) ----------

export type Screen =
  | { name: 'title' }
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'audience'; speakerId: string }
  | { name: 'study'; cardId: string; from: 'audience' | 'quest' }
  | { name: 'quiz'; cardId: string; mode: 'capture' | 'master'; from: 'audience' | 'quest' }
  | { name: 'reveal'; cardId: string; result: 'captured' | 'mastered'; from: 'audience' | 'quest' }
  | { name: 'dex'; focusCardId?: string };

export const HOUSES: Record<House, { name: string; subtitle: string; color: string }> = {
  founder: { name: "Founders' Keep", subtitle: 'the builders of castles', color: '#3b5bdb' },
  investor: { name: 'Verdant Exchange', subtitle: 'the tenders of gardens', color: '#2f9e44' },
  operator: { name: "Artisans' Guild", subtitle: 'the masters of craft', color: '#9c36b5' },
};
