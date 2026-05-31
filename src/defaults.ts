import type { Section, Item } from './types';

export const DEFAULT_SECTIONS: Section[] = [
  { id: 'sec-grain',   name: '主食・穀物',     warnDays: 60,  collapsed: false },
  { id: 'sec-protein', name: 'タンパク質',      warnDays: 4,   collapsed: false },
  { id: 'sec-fresh',   name: '野菜・生鮮',      warnDays: 5,   collapsed: false },
  { id: 'sec-frozen',  name: '冷凍',           warnDays: 120, collapsed: false },
  { id: 'sec-season',  name: '調味料・スパイス', warnDays: 365, collapsed: true  },
  { id: 'sec-treat',   name: '嗜好品',          warnDays: 90,  collapsed: true  },
  { id: 'sec-other',   name: 'その他',          warnDays: 30,  collapsed: true  },
];

function makeItem(name: string, sectionId: string, staple: boolean): Item {
  return {
    id: 'it-' + Math.random().toString(36).slice(2, 9),
    name,
    sectionId,
    staple,
    on: true,
    addedAt: today(),
    createdAt: Date.now(),
  };
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const DEFAULT_ITEMS: Item[] = [
  makeItem('米',     'sec-grain',   true),
  makeItem('卵',     'sec-protein', true),
  makeItem('玉ねぎ', 'sec-fresh',   true),
  makeItem('醤油',   'sec-season',  true),
  makeItem('塩',     'sec-season',  true),
  makeItem('砂糖',   'sec-season',  true),
  makeItem('みりん', 'sec-season',  true),
  makeItem('料理酒', 'sec-season',  true),
  makeItem('サラダ油', 'sec-season', true),
  makeItem('酢',     'sec-season',  true),
];

export const DEFAULT_MOODS: string[] = [
  '食欲がない',
  '噛むのが面倒',
  '香りの強いものが欲しい',
  '温かい液体がいい',
  '寒い',
  'とにかく手早く',
  '少し贅沢したい',
  'さっぱりしたい',
];

export const DEFAULT_TASTE_PROFILE = `この人物の味覚プロファイル（提案時に参考にすること）:
※設定タブで自分好みに書き換えてください。

- 好みの味・料理スタイル: （例：あっさりした和食が好き、スパイス料理が得意）
- 苦手な食材・アレルギー・制限: （例：辛いものが苦手、乳製品は少なめに）
- 食事のスタイル: （例：一人分、調理は15分以内がうれしい）

提案の作法:
- 在庫にあるものだけで作ること。無い食材を前提にしない。
- 手順は簡潔に、各工程の実働時間の目安を添えること。`;

export function newItem(name: string, sectionId: string, staple: boolean): Item {
  return makeItem(name, sectionId, staple);
}
