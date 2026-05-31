import { useState } from 'react';
import type { AppSettings, AppState } from '../types';
import { DEFAULT_TASTE_PROFILE } from '../defaults';

interface SettingsTabProps {
  settings: AppSettings;
  state: AppState;
  onUpdateSettings: (s: AppSettings) => void;
  onImport: (state: AppState) => void;
}

export default function SettingsTab({ settings, state, onUpdateSettings, onImport }: SettingsTabProps) {
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [profileDraft, setProfileDraft] = useState(settings.tasteProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importConfirm, setImportConfirm] = useState(false);

  const maskedKey = settings.apiKey
    ? '••••••••' + settings.apiKey.slice(-4)
    : '';

  const saveApiKey = () => {
    const k = apiKeyDraft.trim();
    if (!k) return;
    onUpdateSettings({ ...settings, apiKey: k });
    setApiKeyDraft('');
    setShowKey(false);
  };

  const saveProfile = () => {
    onUpdateSettings({ ...settings, tasteProfile: profileDraft });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1500);
  };

  const resetProfile = () => {
    setProfileDraft(DEFAULT_TASTE_PROFILE);
    onUpdateSettings({ ...settings, tasteProfile: DEFAULT_TASTE_PROFILE });
  };

  const exportJSON = () => {
    const payload = {
      sections: state.sections,
      items: state.items,
      moodOptions: state.moodOptions,
      settings: { tasteProfile: state.settings.tasteProfile },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pantry-muse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (raw: string) => {
    setImportMsg('');
    if (!raw.trim()) { setImportMsg('JSONを貼り付けてから読み込んでください。'); return; }
    let d: Partial<AppState> & { exportedAt?: string };
    try { d = JSON.parse(raw); } catch { setImportMsg('JSONとして読み込めませんでした。コピー範囲を確認してください。'); return; }
    if (!Array.isArray(d.sections) || !Array.isArray(d.items)) {
      setImportMsg('Pantry Museのバックアップファイルではないようです。');
      return;
    }
    if (!importConfirm) {
      setImportConfirm(true);
      setImportMsg('現在の在庫データに上書きされます。もう一度「読み込む」を押すと実行します。');
      return;
    }
    const newSettings: AppSettings = {
      apiKey: settings.apiKey, // APIキーはインポートで上書きしない
      tasteProfile: (d as { settings?: { tasteProfile?: string } }).settings?.tasteProfile ?? settings.tasteProfile,
    };
    onImport({
      sections: d.sections!,
      items: d.items!,
      moodOptions: d.moodOptions ?? state.moodOptions,
      settings: newSettings,
    });
    setImportOpen(false);
    setImportText('');
    setImportMsg('');
    setImportConfirm(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
      setImportConfirm(false);
      setImportMsg('');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '0 20px 24px' }}>
      {/* APIキー */}
      <section style={sectionStyle}>
        <div style={labelStyle}>APIキー</div>
        {settings.apiKey && !showKey && (
          <div style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{maskedKey}</span>
            <button onClick={() => setShowKey(true)} style={linkBtn}>変更</button>
          </div>
        )}
        {(!settings.apiKey || showKey) && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
              placeholder="sk-ant-..."
              style={inputStyle}
            />
            <button onClick={saveApiKey} style={miniBtn}>保存</button>
          </div>
        )}
        <p style={{ fontSize: 11.5, color: 'var(--sub)', marginTop: 8, lineHeight: 1.6 }}>
          Anthropicのコンソールで発行したAPIキーを入力してください。このデバイス内にのみ保存されます。
        </p>
      </section>

      {/* 味覚プロファイル */}
      <section style={sectionStyle}>
        <div style={labelStyle}>味覚プロファイル</div>
        <textarea
          value={profileDraft}
          onChange={(e) => setProfileDraft(e.target.value)}
          rows={10}
          style={{
            width: '100%', background: '#fbfaf6', border: '1px solid var(--line)',
            borderRadius: 2, padding: 12, fontSize: 13, color: 'var(--ink)',
            lineHeight: 1.7, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={saveProfile} style={{ ...miniBtn, borderColor: profileSaved ? 'var(--sage)' : undefined, color: profileSaved ? 'var(--sage)' : undefined }}>
            {profileSaved ? '保存しました' : '保存'}
          </button>
          <button onClick={resetProfile} style={{ ...miniBtn, color: 'var(--sub)' }}>
            初期値に戻す
          </button>
        </div>
      </section>

      {/* エクスポート / インポート */}
      <section style={sectionStyle}>
        <div style={labelStyle}>バックアップ</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportJSON} style={outlineBtn}>JSONをダウンロード</button>
          <button onClick={() => { setImportOpen((v) => !v); setImportConfirm(false); setImportMsg(''); }} style={outlineBtn}>
            {importOpen ? '閉じる' : '読み込み'}
          </button>
        </div>

        {importOpen && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12.5, color: 'var(--sub)', marginBottom: 10, lineHeight: 1.6 }}>
              バックアップJSONをファイルで読み込むか、テキストを貼り付けてください（現在のデータに上書きされます）。
            </p>
            <label style={{ ...miniBtn, display: 'inline-block', cursor: 'pointer', marginBottom: 10 }}>
              ファイルを選択
              <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
            {importText && (
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 8 }}>
                ファイル読み込み済み ({importText.length.toLocaleString()} 文字)
              </div>
            )}
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportConfirm(false); setImportMsg(''); }}
              placeholder="またはここにJSONを貼り付ける"
              rows={4}
              style={{
                width: '100%', background: '#fbfaf6', border: '1px solid var(--line)',
                borderRadius: 2, padding: 10, fontSize: 12,
                fontFamily: 'ui-monospace, Consolas, monospace',
                color: 'var(--ink)', lineHeight: 1.5, resize: 'vertical', outline: 'none',
              }}
            />
            {importMsg && (
              <p style={{ fontSize: 12.5, color: 'var(--warn)', marginTop: 8, lineHeight: 1.6 }}>{importMsg}</p>
            )}
            <button
              onClick={() => doImport(importText)}
              style={{ ...miniBtn, marginTop: 10, borderColor: importConfirm ? 'var(--warn)' : undefined, color: importConfirm ? 'var(--warn)' : undefined }}
            >
              {importConfirm ? '上書きして読み込む' : '読み込む'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: '20px 0 0', borderTop: '1px solid var(--line)', marginTop: 20,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--sub)', letterSpacing: '.16em', marginBottom: 12,
};
const inputStyle: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none',
  borderBottom: '1px solid var(--line)', padding: '8px 2px',
  fontSize: 14, color: 'var(--ink)', outline: 'none', minHeight: 44,
};
const miniBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--line)', color: 'var(--sub)',
  borderRadius: 2, padding: '0 14px', fontSize: 12.5, cursor: 'pointer',
  minHeight: 44, flexShrink: 0,
};
const outlineBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--sage)', color: 'var(--sage)',
  borderRadius: 2, padding: '10px 16px', fontSize: 13, cursor: 'pointer',
  minHeight: 44,
};
const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--sage)', cursor: 'pointer',
  fontSize: 12.5, textDecoration: 'underline', textUnderlineOffset: 3, padding: 0,
};
