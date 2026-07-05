import type { SaveGame, SaveGameV1 } from '../types';

const STORAGE_KEY = 'lennys-quest-save';

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function freshSave(): SaveGameV1 {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    playerName: '',
    session: { count: 1, lastPlayedDate: todayStr() },
    cards: {},
    reviewQueue: [],
    streak: { current: 0, best: 0, lastActiveDate: '' },
    story: { scenesSeen: [], unlockedSpeakers: [] },
  };
}

function migrate(raw: unknown): SaveGame {
  if (!raw || typeof raw !== 'object' || !('version' in raw)) return freshSave();
  const save = raw as { version: number };
  switch (save.version) {
    case 1:
      return raw as SaveGameV1;
    // future: case 2 migration goes here (post-MVP SRS fields)
    default:
      return freshSave();
  }
}

export function loadSave(): SaveGame {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshSave();
    return migrate(JSON.parse(raw));
  } catch {
    return freshSave();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function persistSave(save: SaveGame): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...save, updatedAt: new Date().toISOString() }));
    } catch {
      // storage full/unavailable — game continues in memory
    }
  }, 150);
}

export function resetSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
