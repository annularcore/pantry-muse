import { useState } from 'react';
import type { Item, Section } from '../types';
import ItemRow from './ItemRow';

interface SectionBlockProps {
  section: Section;
  items: Item[];
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleCollapse: (id: string) => void;
  onUpdateWarnDays: (id: string, days: number) => void;
  onRemoveSection: (id: string) => void;
  onAddItem: (sectionId: string, name: string, staple: boolean) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onSetAddedAt: (id: string, date: string) => void;
  onToggleKind: (id: string) => void;
  onRenameSection: (id: string, name: string) => void;
  onRenameItem: (id: string, name: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function SectionBlock({
  section, items,
  editMode, isFirst, isLast,
  onToggleCollapse, onUpdateWarnDays, onRemoveSection,
  onAddItem, onToggleItem, onRemoveItem, onSetAddedAt, onToggleKind,
  onRenameSection, onRenameItem, onMoveUp, onMoveDown,
}: SectionBlockProps) {
  const [draftName, setDraftName] = useState('');
  const [editingWarn, setEditingWarn] = useState(false);
  const [warnInput, setWarnInput] = useState(String(section.warnDays));
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(section.name);

  // 折り畳み時の警告判定
  const hasWarn = items.some((it) => {
    const present = it.staple ? it.on : true;
    if (!present) return false;
    const days = Math.floor((Date.now() - new Date(it.addedAt + 'T00:00:00').getTime()) / 86400000);
    return days >= section.warnDays;
  });

  const commitWarn = () => {
    const n = parseInt(warnInput, 10);
    if (n >= 1) onUpdateWarnDays(section.id, n);
    else setWarnInput(String(section.warnDays));
    setEditingWarn(false);
  };

  const commitName = () => {
    const n = nameInput.trim();
    if (n) onRenameSection(section.id, n);
    else setNameInput(section.name);
    setEditingName(false);
  };

  const handleAddItem = (staple: boolean) => {
    const n = draftName.trim();
    if (!n) return;
    onAddItem(section.id, n, staple);
    setDraftName('');
  };

  return (
    <div style={{ marginBottom: 4 }}>
      {/* セクションヘッダー */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '14px 0 10px', borderBottom: '1px solid var(--ink)',
        cursor: 'pointer', minHeight: 44,
      }} onClick={() => onToggleCollapse(section.id)}>

        {/* 並び替えボタン（編集モード時） */}
        {editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={isFirst}
              style={arrowBtn(isFirst)}
            >↑</button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={isLast}
              style={arrowBtn(isLast)}
            >↓</button>
          </div>
        )}

        {/* 折り畳みキャレット */}
        <span style={{
          fontSize: 10, color: 'var(--sub)',
          transform: section.collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
          transition: 'transform .2s', display: 'inline-block', flexShrink: 0,
        }}>▶</span>

        {/* セクション名 */}
        {editMode && editingName ? (
          <input
            value={nameInput}
            autoFocus
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') { setNameInput(section.name); setEditingName(false); }
            }}
            onClick={(e) => e.stopPropagation()}
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
              fontSize: 15, letterSpacing: '.04em', flex: 1,
              cursor: editMode ? 'text' : 'default',
              borderBottom: editMode ? '1px dotted var(--line)' : 'none',
              padding: '2px 0',
            }}
            onClick={editMode ? (e) => { e.stopPropagation(); setEditingName(true); setNameInput(section.name); } : undefined}
          >
            {section.name}
          </span>
        )}

        <span style={{ fontSize: 11, color: 'var(--sub)', flexShrink: 0 }}>
          {items.length}品
        </span>
        {section.collapsed && hasWarn && (
          <span style={{ fontSize: 13, color: 'var(--warn)', flexShrink: 0 }}>⚠</span>
        )}

        {/* warnDays */}
        {editingWarn ? (
          <input
            type="number"
            min={1}
            value={warnInput}
            autoFocus
            onChange={(e) => setWarnInput(e.target.value)}
            onBlur={commitWarn}
            onKeyDown={(e) => { if (e.key === 'Enter') commitWarn(); if (e.key === 'Escape') setEditingWarn(false); }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 52, fontSize: 11, textAlign: 'center',
              border: '1px solid var(--sage)', borderRadius: 2,
              padding: '2px 4px', background: 'var(--bone)', color: 'var(--ink)',
              outline: 'none',
            }}
          />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingWarn(true); setWarnInput(String(section.warnDays)); }}
            title="警告日数を編集"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--sub)',
              borderBottom: '1px dotted var(--line)', padding: '2px 2px',
              flexShrink: 0,
            }}
          >
            警告 {section.warnDays}日
          </button>
        )}

        {/* セクション削除（空のときのみ） */}
        {items.length === 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveSection(section.id); }}
            title="セクションを削除"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: 'var(--sub)',
              minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* 中身（折り畳み時は非表示） */}
      {!section.collapsed && (
        <div>
          {items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              section={section}
              editMode={editMode}
              onToggle={onToggleItem}
              onRemove={onRemoveItem}
              onSetAddedAt={onSetAddedAt}
              onToggleKind={onToggleKind}
              onRename={onRenameItem}
            />
          ))}
          {/* 追加入力 */}
          <div style={{ display: 'flex', gap: 8, margin: '10px 0 6px' }}>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem(false)}
              placeholder={`${section.name}に追加`}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--line)', padding: '8px 2px',
                fontSize: 14, color: 'var(--ink)', outline: 'none',
                minHeight: 44,
              }}
            />
            <button onClick={() => handleAddItem(false)} style={miniBtn}>臨時</button>
            <button onClick={() => handleAddItem(true)}  style={miniBtn}>定番</button>
          </div>
        </div>
      )}
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--line)', color: 'var(--sub)',
  borderRadius: 2, padding: '0 12px', fontSize: 12.5, cursor: 'pointer',
  minHeight: 44, flexShrink: 0,
};

function arrowBtn(disabled: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 12, color: disabled ? 'var(--line)' : 'var(--sub)',
    padding: '1px 6px', lineHeight: 1.2, display: 'block',
    minWidth: 28,
  };
}
