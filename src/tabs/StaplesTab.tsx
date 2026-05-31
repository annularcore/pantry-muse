import type { Item, Section } from '../types';
import Toggle from '../components/Toggle';

interface StaplesTabProps {
  sections: Section[];
  items: Item[];
  onToggleItem: (id: string) => void;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000);
}

function ageLabel(days: number): string {
  if (days <= 0) return '今日';
  if (days < 30) return `${days}日前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年以上前`;
}

function StapleRow({ item, section, onToggle }: { item: Item; section: Section | undefined; onToggle: (id: string) => void }) {
  const days = daysSince(item.addedAt);
  const warn = item.on && section !== undefined && days >= section.warnDays;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 0', borderBottom: '1px solid var(--line)',
      minHeight: 44,
    }}>
      <span style={{ flex: 1, fontSize: 15, opacity: item.on ? 1 : 0.38 }}>
        {item.name}
      </span>
      <span style={{
        fontSize: 11.5, color: warn ? 'var(--warn)' : 'var(--sub)',
        fontWeight: warn ? 600 : 400, flexShrink: 0,
      }}>
        {item.on ? `${warn ? '⚠ ' : ''}${ageLabel(days)}` : '—'}
      </span>
      <Toggle on={item.on} onClick={() => onToggle(item.id)} />
    </div>
  );
}

export default function StaplesTab({ sections, items, onToggleItem }: StaplesTabProps) {
  const staples = items.filter((x) => x.staple);
  const needed  = staples.filter((x) => !x.on).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  const inStock = staples.filter((x) => x.on);

  const inStockBySection = sections.map((sec) => ({
    section: sec,
    items: inStock.filter((x) => x.sectionId === sec.id).sort((a, b) => a.createdAt - b.createdAt),
  })).filter((g) => g.items.length > 0);

  const label: React.CSSProperties = {
    fontSize: 11, color: 'var(--sub)', letterSpacing: '.16em',
    padding: '16px 0 8px', display: 'block',
  };

  return (
    <div style={{ padding: '0 20px 16px' }}>
      {/* 要購入グループ */}
      <span style={label}>要購入</span>
      {needed.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--sub)', padding: '8px 0 12px' }}>
          切らしている定番はありません
        </p>
      ) : (
        needed.map((it) => (
          <StapleRow
            key={it.id}
            item={it}
            section={sections.find((s) => s.id === it.sectionId)}
            onToggle={onToggleItem}
          />
        ))
      )}

      {/* 在庫ありグループ */}
      <span style={{ ...label, marginTop: 8 }}>在庫あり</span>
      {inStockBySection.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--sub)', padding: '8px 0' }}>
          定番が登録されていません
        </p>
      ) : (
        inStockBySection.map(({ section, items: secItems }) => (
          <div key={section.id} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11.5, color: 'var(--sub)', letterSpacing: '.08em',
              padding: '10px 0 4px', borderBottom: '1px solid var(--line)',
            }}>
              {section.name}
            </div>
            {secItems.map((it) => (
              <StapleRow key={it.id} item={it} section={section} onToggle={onToggleItem} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
