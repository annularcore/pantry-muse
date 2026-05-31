export interface Section {
  id: string;
  name: string;
  warnDays: number;
  collapsed: boolean;
}

export interface Item {
  id: string;
  name: string;
  sectionId: string;
  staple: boolean;
  on: boolean;
  addedAt: string;   // YYYY-MM-DD。購入日の代替として手動編集可
  createdAt: number; // Date.now()。ソート安定化用（編集不可）
}

export interface AppSettings {
  apiKey: string;
  tasteProfile: string;
}

export interface AppState {
  sections: Section[];
  items: Item[];
  moodOptions: string[];
  settings: AppSettings;
}

export type SuggestKind = 'mood' | 'soon';
export type TabId = 'pantry' | 'staples' | 'settings';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}
