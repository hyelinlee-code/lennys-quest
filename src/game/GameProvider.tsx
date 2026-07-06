import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { SaveGame, Screen } from '../types';
import { freshSave, loadSave, persistSave, resetSave } from '../lib/storage';
import { bumpStreak, computeReviewQueue, rollSession } from './review';

interface GameState {
  screen: Screen;
  save: SaveGame;
  toast: string | null;
}

type Action =
  | { type: 'GOTO'; screen: Screen }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SCENE_SEEN'; sceneId: string }
  | { type: 'UNLOCK_SPEAKER'; speakerId: string }
  | { type: 'TOGGLE_FAVORITE'; cardId: string }
  | { type: 'QUIZ_PASSED'; cardId: string; mode: 'capture' | 'master' }
  | { type: 'QUIZ_FAILED'; cardId: string }
  | { type: 'NEXT_DAY' }
  | { type: 'TOAST'; message: string | null }
  | { type: 'RESET' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'GOTO':
      return { ...state, screen: action.screen };
    case 'SET_NAME':
      return { ...state, save: { ...state.save, playerName: action.name } };
    case 'SCENE_SEEN': {
      if (state.save.story.scenesSeen.includes(action.sceneId)) return state;
      return {
        ...state,
        save: {
          ...state.save,
          story: { ...state.save.story, scenesSeen: [...state.save.story.scenesSeen, action.sceneId] },
        },
      };
    }
    case 'UNLOCK_SPEAKER': {
      if (state.save.story.unlockedSpeakers.includes(action.speakerId)) return state;
      return {
        ...state,
        save: {
          ...state.save,
          story: {
            ...state.save.story,
            unlockedSpeakers: [...state.save.story.unlockedSpeakers, action.speakerId],
          },
        },
      };
    }
    case 'TOGGLE_FAVORITE': {
      const has = state.save.favorites.includes(action.cardId);
      return {
        ...state,
        save: {
          ...state.save,
          favorites: has
            ? state.save.favorites.filter((id) => id !== action.cardId)
            : [...state.save.favorites, action.cardId],
        },
      };
    }
    case 'QUIZ_PASSED': {
      const prev = state.save.cards[action.cardId] ?? { mastery: 0 as const, failCount: 0 };
      const isMaster = action.mode === 'master';
      const progress = isMaster
        ? { ...prev, mastery: 2 as const, masteredSession: state.save.session.count }
        : { ...prev, mastery: 1 as const, capturedSession: state.save.session.count };
      let save: SaveGame = {
        ...state.save,
        cards: { ...state.save.cards, [action.cardId]: progress },
      };
      save = { ...save, reviewQueue: computeReviewQueue(save) };
      save = bumpStreak(save);
      return { ...state, save };
    }
    case 'QUIZ_FAILED': {
      const prev = state.save.cards[action.cardId] ?? { mastery: 0 as const, failCount: 0 };
      return {
        ...state,
        save: {
          ...state.save,
          cards: { ...state.save.cards, [action.cardId]: { ...prev, failCount: prev.failCount + 1 } },
        },
      };
    }
    case 'NEXT_DAY':
      return { ...state, save: rollSession(state.save, true) };
    case 'TOAST':
      return { ...state, toast: action.message };
    case 'RESET':
      resetSave();
      return { screen: { name: 'title' }, save: freshSave(), toast: null };
    default:
      return state;
  }
}

function init(): GameState {
  const save = rollSession(loadSave());
  const started = save.playerName !== '';
  return { screen: started ? { name: 'home' } : { name: 'title' }, save, toast: null };
}

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<Action> } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    persistSave(state.save);
  }, [state.save]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
