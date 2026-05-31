import { useState, useEffect } from 'react';
import type { Item, Section } from '../types';
import { today } from '../defaults';
import Toggle from './Toggle';

interface ItemRowProps {
  item: Item;
  section: Section;
  editMode: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetAddedAt: (id: string, date: string) => void;
  onToggleKind: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function ageLabel(days: number): string {
  if (days <= 0) return '今日';
  if (days < 30) return `${days}日前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年以上前`;
}

export default function ItemRow({ item, section, editMode, onToggle, onRemove, onSetAddedAt, onToggleKind, onRename }: ItemRowProps) {
  const [editingDate, setEditingDate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(item.name);

  // 編集モード終了時に名前編集も閉じる
  useEffect(() => {
    if (!editMode) setEditingName(false);
  }, [editMode]);

  const commitName = () => {
    const n = nameInput.trim();
    if (n && n !== item.name) onRename(item.id, n);
    else setNameInput(item.name);
    setEditingName(false);
  };

  const present = item.staple ? item.on : true;
  const days = daysSince(item.addedAt);
  const warn = present && days >= section.warnDays;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '11px 0', borderBottom: '1px solid var(--line)',
      minHeight: 44,
    }}>
      {/* 名前（編集モードでタップするとインライン編集） */}
      {editMode && editingName ? (
        <input
          value={nameInput}
          autoFocus
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') { setNameInput(item.name); setEditingName(false); }
          }}
          style={{
            flex: 1, fontSize: 15, color: 'var(--ink)',
            background: 'transparent', outline: 'none',
            border: 'none', borderBottom: '1px solid var(--sage)',
            padding: '2px 2px',
          }}
        />
      ) : (
        <span
          style={{
            flex: 1, fontSize: 15, opacity: present ? 1 : 0.38, lineHeight: 1.3,
            cursor: editMode ? 'text' : 'default',
            borderBottom: editMode ? '1px dotted var(--line)' : 'none',
          }}
          onClick={editMode ? () => { setEditingName(true); setNameInput(item.name); } : undefined}
        >
          {item.name}
        </span>
      )}

      {/* 経過表示 / 日付入力（常時タップ可） */}
      {editingDate ? (
        <input
          type="date"
          value={item.addedAt}
          max={today()}
          autoFocus
          onChange={(e) => onSetAddedAt(item.id, e.target.value)}
          onBlur={() => setEditingDate(false)}
          style={{
            fontSize: 12, color: 'var(--ink)', background: 'var(--bone)',
            border: '1px solid var(--sage)', borderRadius: 2,
            padding: '4px 6px', outline: 'none', flexShrink: 0,
          }}
        />
      ) : (
        <button
          onClick={() => setEditingDate(true)}
          title="登録日を編集"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11.5, whiteSpace: 'nowrap', flexShrink: 0,
            color: warn ? 'var(--warn)' : 'var(--sub)',
            fontWeight: warn ? 600 : 400,
            borderBottom: '1px dotted var(--line)',
            padding: '4px 2px',
            minHeight: 44, display: 'flex', alignItems: 'center',
          }}
        >
          {present ? `${warn ? '⚠ ' : ''}${ageLabel(days)}` : '—'}
        </button>
      )}

      {/* 定⇄臨（編集モード時のみ） */}
      {editMode && (
        <button
          onClick={() => onToggleKind(item.id)}
          title={item.staple ? '臨時に変更' : '定番に変更'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--sub)', flexShrink: 0,
            padding: '0 4px', minWidth: 44, minHeight: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ⇄
        </button>
      )}

      {/* 削除（編集モード時のみ） */}
      {editMode && (
        <button
          onClick={() => onRemove(item.id)}
          title="削除"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: 'var(--warn)', flexShrink: 0,
            padding: '0 4px', minWidth: 44, minHeight: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}

      {/* トグル（定番のみ） */}
      {item.staple && (
        <Toggle on={item.on} onClick={() => onToggle(item.id)} />
      )}
    </div>
  );
}
