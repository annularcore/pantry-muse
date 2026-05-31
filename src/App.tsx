import { useState, useEffect, useCallback } from 'react';
import type { AppState, Section, TabId } from './types';
import { loadState, saveState } from './db';
import { today, newItem } from './defaults';
import PantryTab from './tabs/PantryTab';
import StaplesTab from './tabs/StaplesTab';
import SettingsTab from './tabs/SettingsTab';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState<TabId>('pantry');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveState(next).catch(console.error);
      return next;
    });
  }, []);

  if (!state) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)' }}>
        読み込み中…
      </div>
    );
  }

  // ── セクション操作 ──
  const toggleCollapse = (id: string) =>
    update((s) => ({ ...s, sections: s.sections.map((x) => x.id === id ? { ...x, collapsed: !x.collapsed } : x) }));

  const updateWarnDays = (id: string, days: number) =>
    update((s) => ({ ...s, sections: s.sections.map((x) => x.id === id ? { ...x, warnDays: days } : x) }));

  const removeSection = (id: string) =>
    update((s) => ({ ...s, sections: s.sections.filter((x) => x.id !== id) }));

  const addSection = (name: string) => {
    if (!name) return;
    const sec: Section = { id: 'sec-' + Date.now(), name, warnDays: 30, collapsed: false };
    update((s) => ({ ...s, sections: [...s.sections, sec] }));
  };

  const renameSection = (id: string, name: string) => {
    if (!name.trim()) return;
    update((s) => ({ ...s, sections: s.sections.map((x) => x.id === id ? { ...x, name: name.trim() } : x) }));
  };

  const moveSection = (id: string, dir: 'up' | 'down') => {
    update((s) => {
      const idx = s.sections.findIndex((x) => x.id === id);
      if (idx < 0) return s;
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= s.sections.length) return s;
      const next = [...s.sections];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...s, sections: next };
    });
  };

  const expandAll = () =>
    update((s) => ({ ...s, sections: s.sections.map((x) => ({ ...x, collapsed: false })) }));

  const collapseAll = () =>
    update((s) => ({ ...s, sections: s.sections.map((x) => ({ ...x, collapsed: true })) }));

  // ── アイテム操作 ──
  const addItem = (sectionId: string, name: string, staple: boolean) => {
    if (!name.trim()) return;
    update((s) => ({ ...s, items: [...s.items, newItem(name.trim(), sectionId, staple)] }));
  };

  const toggleItem = (id: string) =>
    update((s) => ({
      ...s,
      items: s.items.map((x) =>
        x.id === id
          ? { ...x, on: !x.on, addedAt: !x.on ? today() : x.addedAt }
          : x
      ),
    }));

  const removeItem = (id: string) =>
    update((s) => ({ ...s, items: s.items.filter((x) => x.id !== id) }));

  const setAddedAt = (id: string, date: string) =>
    update((s) => ({ ...s, items: s.items.map((x) => x.id === id ? { ...x, addedAt: date } : x) }));

  const toggleKind = (id: string) =>
    update((s) => ({
      ...s,
      items: s.items.map((x) => {
        if (x.id !== id) return x;
        if (x.staple) return { ...x, staple: false };
        return { ...x, staple: true, on: true, addedAt: today() };
      }),
    }));

  const renameItem = (id: string, name: string) => {
    if (!name.trim()) return;
    update((s) => ({ ...s, items: s.items.map((x) => x.id === id ? { ...x, name: name.trim() } : x) }));
  };

  // ── その他 ──
  const updateMoodOptions = (opts: string[]) =>
    update((s) => ({ ...s, moodOptions: opts }));

  const updateSettings = (settings: AppState['settings']) =>
    update((s) => ({ ...s, settings }));

  const importState = (imported: AppState) => {
    update(() => imported);
    setTab('pantry');
    setEditMode(false);
  };

  const switchTab = (id: TabId) => {
    setTab(id);
    if (id !== 'pantry') setEditMode(false);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'pantry',   label: '在庫' },
    { id: 'staples',  label: '定番' },
    { id: 'settings', label: '設定' },
  ];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      maxWidth: 600, margin: '0 auto',
    }}>
      {/* 固定ヘッダー */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bone)', borderBottom: '1px solid var(--line)',
        padding: '0 20px',
        height: 'var(--header-h)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '.06em' }}>
          Pantry Muse
        </h1>
        {tab === 'pantry' && (
          <button
            onClick={() => setEditMode((v) => !v)}
            style={{
              background: 'none', border: 'none', color: 'var(--sage)', cursor: 'pointer',
              fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3,
              padding: '4px 0', minHeight: 44,
            }}
          >
            {editMode ? '完了' : '編集'}
          </button>
        )}
      </header>

      {/* タブコンテンツ（スクロール領域） */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--tab-h)' }}>
        {tab === 'pantry' && (
          <PantryTab
            sections={state.sections}
            items={state.items}
            moodOptions={state.moodOptions}
            settings={state.settings}
            editMode={editMode}
            onToggleCollapse={toggleCollapse}
            onUpdateWarnDays={updateWarnDays}
            onRemoveSection={removeSection}
            onAddSection={addSection}
            onAddItem={addItem}
            onToggleItem={toggleItem}
            onRemoveItem={removeItem}
            onSetAddedAt={setAddedAt}
            onToggleKind={toggleKind}
            onRenameItem={renameItem}
            onUpdateMoodOptions={updateMoodOptions}
            onRenameSection={renameSection}
            onMoveSection={moveSection}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        )}
        {tab === 'staples' && (
          <StaplesTab
            sections={state.sections}
            items={state.items}
            onToggleItem={toggleItem}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            settings={state.settings}
            state={state}
            onUpdateSettings={updateSettings}
            onImport={importState}
          />
        )}
      </div>

      {/* ボトムタブバー */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        height: 'var(--tab-h)',
        background: 'var(--bone)', borderTop: '1px solid var(--line)',
        display: 'flex',
        maxWidth: 600, margin: '0 auto',
      }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            style={{
              flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 12, letterSpacing: '.08em',
              color: tab === id ? 'var(--ink)' : 'var(--sub)',
              borderTop: `2px solid ${tab === id ? 'var(--ink)' : 'transparent'}`,
              transition: 'color .15s, border-color .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
