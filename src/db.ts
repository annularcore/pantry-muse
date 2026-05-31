import Dexie, { type Table } from 'dexie';
import type { AppState } from './types';
import { DEFAULT_SECTIONS, DEFAULT_ITEMS, DEFAULT_MOODS, DEFAULT_TASTE_PROFILE } from './defaults';

interface StateRecord {
  key: string;
  value: string;
}

class PantryMuseDB extends Dexie {
  appState!: Table<StateRecord>;

  constructor() {
    super('pantry-muse');
    this.version(1).stores({ appState: '&key' });
  }
}

export const db = new PantryMuseDB();

const STATE_KEY = 'state-v1';

export async function loadState(): Promise<AppState> {
  const rec = await db.appState.get(STATE_KEY);
  if (rec) return JSON.parse(rec.value) as AppState;

  const initial: AppState = {
    sections: DEFAULT_SECTIONS,
    items: DEFAULT_ITEMS,
    moodOptions: DEFAULT_MOODS,
    settings: { apiKey: '', tasteProfile: DEFAULT_TASTE_PROFILE },
  };
  await db.appState.put({ key: STATE_KEY, value: JSON.stringify(initial) });
  return initial;
}

export async function saveState(state: AppState): Promise<void> {
  await db.appState.put({ key: STATE_KEY, value: JSON.stringify(state) });
}
