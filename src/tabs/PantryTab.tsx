import { useState } from 'react';
import type { Item, Section, AppSettings, SuggestKind, TokenUsage } from '../types';
import SectionBlock from '../components/SectionBlock';
import RecipeResult from '../components/RecipeResult';

interface PantryTabProps {
  sections: Section[];
  items: Item[];
  moodOptions: string[];
  settings: AppSettings;
  editMode: boolean;
  onToggleCollapse: (id: string) => void;
  onUpdateWarnDays: (id: string, days: number) => void;
  onRemoveSection: (id: string) => void;
  onAddSection: (name: string) => void;
  onAddItem: (sectionId: string, name: string, staple: boolean) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onSetAddedAt: (id: string, date: string) => void;
  onToggleKind: (id: string) => void;
  onRenameItem: (id: string, name: string) => void;
  onUpdateMoodOptions: (opts: string[]) => void;
  onRenameSection: (id: string, name: string) => void;
  onMoveSection: (id: string, dir: 'up' | 'down') => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000);
}

function isPresent(it: Item): boolean {
  return it.staple ? it.on : true;
}

function expiryRatio(it: Item, sec: Section | undefined): number {
  if (!isPresent(it)) return -1;
  return daysSince(it.addedAt) / (sec?.warnDays || 30);
}

function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (a.staple !== b.staple) return a.staple ? -1 : 1;
    return a.name.localeCompare(b.name, 'ja');
  });
}

export default function PantryTab({
  sections, items, moodOptions, settings, editMode,
  onToggleCollapse, onUpdateWarnDays, onRemoveSection, onAddSection,
  onAddItem, onToggleItem, onRemoveItem, onSetAddedAt, onToggleKind,
  onRenameItem, onUpdateMoodOptions, onRenameSection, onMoveSection,
  onExpandAll, onCollapseAll,
}: PantryTabProps) {
  const [moods, setMoods] = useState<string[]>([]);
  const [moodFreeText, setMoodFreeText] = useState('');
  const [newMood, setNewMood] = useState('');
  const [newSection, setNewSection] = useState('');
  const [recipe, setRecipe] = useState('');
  const [recipeKind, setRecipeKind] = useState<SuggestKind | ''>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [promptText, setPromptText] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [suggestMode, setSuggestMode] = useState<'api' | 'prompt'>('prompt');

  const expiringCount = items.filter((x) => {
    const sec = sections.find((s) => s.id === x.sectionId);
    return expiryRatio(x, sec) >= 1;
  }).length;

  const toggleMood = (m: string) =>
    setMoods((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  const addMood = () => {
    const n = newMood.trim();
    if (!n || moodOptions.includes(n)) return;
    onUpdateMoodOptions([...moodOptions, n]);
    setNewMood('');
  };

  const removeMood = (m: string) => {
    onUpdateMoodOptions(moodOptions.filter((x) => x !== m));
    setMoods((p) => p.filter((x) => x !== m));
  };

  const buildPrompt = (kind: SuggestKind): string => {
    const available = items.filter(isPresent).map((x) => x.name);
    const allMoods = [...moods, moodFreeText.trim()].filter(Boolean);
    let extra = '';
    if (kind === 'soon') {
      const priorityItems = items
        .filter(isPresent)
        .map((x) => ({ name: x.name, ratio: expiryRatio(x, sections.find((s) => s.id === x.sectionId)) }))
        .filter((x) => x.ratio >= 0.6)
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 6)
        .map((x) => x.name);
      extra = priorityItems.length
        ? `\n\n特に優先して使い切るべき食材（追加から時間が経っている）: ${priorityItems.join('、')}\nこれらを主役に据えた提案にすること。`
        : '\n\n（今のところ緊急に使うべき食材はありません。在庫から自由に提案してください。）';
    }
    return `${settings.tasteProfile}

今ある食材・調味料: ${available.join('、') || '（なし）'}
今の気分・状態: ${allMoods.join('、') || '（特になし）'}${extra}

上記の在庫のみを使って、この人物が「これなら食べられる」と感じる一品を1つ提案してください。
出力形式:
【料理名】
【提案理由】1〜2文
【材料】箇条書き
【手順】番号付き、各手順に実働時間の目安
【料理のアピールポイント】この料理の最大の魅力を1〜2文で
余計な前置きは不要。`;
  };

  const showPrompt = (kind: SuggestKind) => {
    setPromptText(buildPrompt(kind));
    setPromptCopied(false);
    setRecipe('');
    setErr('');
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch { /* フォールバック不要 */ }
  };

  const runSuggest = async (kind: SuggestKind) => {
    if (!settings.apiKey) {
      setErr('APIキーが設定されていません。設定タブから入力してください。');
      return;
    }
    setLoading(true);
    setErr('');
    setRecipe('');
    setTokenUsage(null);
    setPromptText('');
    setRecipeKind(kind);

    const prompt = buildPrompt(kind);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(`APIエラー: ${data.error?.message ?? res.status}`);
        return;
      }
      const text = (data.content as { type: string; text: string }[])
        .filter((x) => x.type === 'text').map((x) => x.text).join('\n');
      setRecipe(text || '提案を取得できませんでした。');
      if (data.usage) {
        setTokenUsage({ inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens });
      }
    } catch {
      setErr('通信に失敗しました。接続状況を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = (kind: SuggestKind) => {
    if (suggestMode === 'api') runSuggest(kind);
    else showPrompt(kind);
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 警告バナー */}
      {expiringCount > 0 && (
        <div style={{
          margin: '0 20px 0', padding: '10px 14px',
          border: '1px solid var(--warn)', borderRadius: 2,
          color: 'var(--warn)', fontSize: 13,
          background: 'rgba(168,85,63,.05)',
        }}>
          ⚠ そろそろ使った方がよい食材が {expiringCount} 品あります
        </div>
      )}

      {/* 在庫セクション */}
      <div style={{ padding: '0 20px' }}>
        {/* 在庫ヘッダー（sticky） */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 0',
          position: 'sticky', top: 0,
          background: 'var(--bone)', zIndex: 10,
          borderBottom: '1px solid var(--line)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '.16em', flex: 1 }}>在庫</span>
          <button onClick={onExpandAll} style={subtleBtn}>全展開</button>
          <button onClick={onCollapseAll} style={subtleBtn}>全折畳</button>
        </div>

        {sections.map((sec, idx) => {
          const secItems = sortItems(items.filter((x) => x.sectionId === sec.id));
          return (
            <SectionBlock
              key={sec.id}
              section={sec}
              items={secItems}
              editMode={editMode}
              isFirst={idx === 0}
              isLast={idx === sections.length - 1}
              onToggleCollapse={onToggleCollapse}
              onUpdateWarnDays={onUpdateWarnDays}
              onRemoveSection={onRemoveSection}
              onAddItem={onAddItem}
              onToggleItem={onToggleItem}
              onRemoveItem={onRemoveItem}
              onSetAddedAt={onSetAddedAt}
              onToggleKind={onToggleKind}
              onRenameSection={onRenameSection}
              onRenameItem={onRenameItem}
              onMoveUp={() => onMoveSection(sec.id, 'up')}
              onMoveDown={() => onMoveSection(sec.id, 'down')}
            />
          );
        })}

        {/* 新規セクション追加 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <input
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { onAddSection(newSection.trim()); setNewSection(''); } }}
            placeholder="セクションを追加"
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: '1px solid var(--line)', padding: '8px 2px',
              fontSize: 14, color: 'var(--ink)', outline: 'none', minHeight: 44,
            }}
          />
          <button
            onClick={() => { onAddSection(newSection.trim()); setNewSection(''); }}
            style={miniBtn}
          >
            + 追加
          </button>
        </div>
      </div>

      {/* 気分・状態セクション */}
      <div style={{ padding: '0 20px', marginTop: 8 }}>
        <div style={{
          fontSize: 11, color: 'var(--sub)', letterSpacing: '.16em',
          padding: '12px 0 10px',
          borderBottom: '1px solid var(--line)',
        }}>
          今の気分・状態
        </div>

        {/* タグチップ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 0 12px' }}>
          {moodOptions.map((m) => (
            <button
              key={m}
              onClick={() => editMode ? removeMood(m) : toggleMood(m)}
              style={{
                padding: '9px 16px', borderRadius: 2, cursor: 'pointer',
                border: `1px solid ${!editMode && moods.includes(m) ? 'var(--clay)' : 'var(--line)'}`,
                background: !editMode && moods.includes(m) ? 'var(--clay)' : 'transparent',
                color: !editMode && moods.includes(m) ? 'var(--bone)' : 'var(--ink)',
                fontSize: 13.5, transition: 'all .18s ease',
                minHeight: 44,
              }}
            >
              {editMode ? `${m} ×` : m}
            </button>
          ))}
        </div>

        {/* タグ追加（編集モード時） */}
        {editMode && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={newMood}
              onChange={(e) => setNewMood(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMood()}
              placeholder="状態の選択肢を追加（例：胃が重い）"
              style={{
                flex: 1, background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--line)', padding: '8px 2px',
                fontSize: 14, color: 'var(--ink)', outline: 'none', minHeight: 44,
              }}
            />
            <button onClick={addMood} style={miniBtn}>+ 追加</button>
          </div>
        )}

        {/* 自由記入欄（常時表示） */}
        <input
          value={moodFreeText}
          onChange={(e) => setMoodFreeText(e.target.value)}
          placeholder="一言メモ（例：豆腐を使い切りたい、今日は暑い）"
          style={{
            width: '100%', background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--line)', padding: '8px 2px',
            fontSize: 14, color: 'var(--ink)', outline: 'none',
            minHeight: 44, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 提案セクション */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* モードトグル */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          border: '1px solid var(--line)', borderRadius: 2, overflow: 'hidden',
        }}>
          <button
            onClick={() => setSuggestMode('api')}
            style={{
              padding: '10px 0', border: 'none', cursor: 'pointer', fontSize: 12.5,
              background: suggestMode === 'api' ? 'var(--ink)' : 'transparent',
              color: suggestMode === 'api' ? 'var(--bone)' : 'var(--sub)',
              letterSpacing: '.04em',
            }}
          >
            API実行
          </button>
          <button
            onClick={() => setSuggestMode('prompt')}
            style={{
              padding: '10px 0', border: 'none', borderLeft: '1px solid var(--line)',
              cursor: 'pointer', fontSize: 12.5,
              background: suggestMode === 'prompt' ? 'var(--ink)' : 'transparent',
              color: suggestMode === 'prompt' ? 'var(--bone)' : 'var(--sub)',
              letterSpacing: '.04em',
            }}
          >
            プロンプト出力
          </button>
        </div>

        <button
          onClick={() => handleSuggest('mood')}
          disabled={loading}
          style={ctaBtn(true, loading && recipeKind === 'mood')}
        >
          {loading && recipeKind === 'mood' ? '考えています…' : '気分から一皿を提案'}
        </button>
        <button
          onClick={() => handleSuggest('soon')}
          disabled={loading}
          style={{ ...ctaBtn(false, loading && recipeKind === 'soon'), marginTop: 2 }}
        >
          {loading && recipeKind === 'soon' ? '考えています…' : 'そろそろ使うべきものから一皿'}
        </button>
      </div>

      {/* プロンプト表示エリア */}
      {promptText && (
        <div style={{ margin: '16px 20px 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 11.5, color: 'var(--sub)' }}>
              このテキストをコピーして claude.ai に貼り付けてください
            </span>
            <button
              onClick={copyPrompt}
              style={{
                background: 'none', border: '1px solid var(--line)', borderRadius: 2,
                padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                color: promptCopied ? 'var(--sage)' : 'var(--sub)',
                borderColor: promptCopied ? 'var(--sage)' : 'var(--line)',
                flexShrink: 0,
              }}
            >
              {promptCopied ? 'コピーしました' : 'コピー'}
            </button>
          </div>
          <textarea
            readOnly
            value={promptText}
            onFocus={(e) => e.target.select()}
            rows={8}
            style={{
              width: '100%', background: '#fbfaf6', border: '1px solid var(--line)',
              borderRadius: 2, padding: 12, fontSize: 12,
              fontFamily: 'inherit', color: 'var(--ink)',
              lineHeight: 1.7, resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}

      {/* 結果 */}
      {err && (
        <div style={{
          margin: '16px 20px 0', padding: '14px 16px',
          border: '1px solid var(--warn)', borderRadius: 2,
          color: 'var(--warn)', fontSize: 13,
        }}>
          {err}
        </div>
      )}
      {recipe && <RecipeResult text={recipe} usage={tokenUsage} />}
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--line)', color: 'var(--sub)',
  borderRadius: 2, padding: '0 12px', fontSize: 12.5, cursor: 'pointer',
  minHeight: 44, flexShrink: 0,
};

const subtleBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer',
  fontSize: 11.5, padding: '4px 6px', minHeight: 36, flexShrink: 0,
};

function ctaBtn(primary: boolean, busy: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '16px', borderRadius: 2,
    fontSize: 15.5, letterSpacing: '.06em', cursor: busy ? 'default' : 'pointer',
    border: primary ? 'none' : '1px solid var(--ink)',
    background: primary ? (busy ? 'var(--sub)' : 'var(--ink)') : 'transparent',
    color: primary ? 'var(--bone)' : 'var(--ink)',
  };
}
