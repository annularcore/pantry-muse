import type { TokenUsage } from '../types';

interface RecipeResultProps {
  text: string;
  usage: TokenUsage | null;
}

const COST_INPUT  = 3  / 1_000_000; // $3/1M tokens
const COST_OUTPUT = 15 / 1_000_000; // $15/1M tokens

export default function RecipeResult({ text, usage }: RecipeResultProps) {
  const cost = usage
    ? usage.inputTokens * COST_INPUT + usage.outputTokens * COST_OUTPUT
    : null;

  return (
    <div style={{
      margin: '20px 20px 0',
      border: '1px solid var(--line)',
      borderRadius: 2,
      background: '#fbfaf6',
    }}>
      <div style={{
        padding: '20px 20px 16px',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.95,
        fontSize: 15,
      }}>
        {text}
      </div>
      {usage && (
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '8px 20px',
          fontSize: 11,
          color: 'var(--sub)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <span>入力 {usage.inputTokens.toLocaleString()} tok</span>
          <span>出力 {usage.outputTokens.toLocaleString()} tok</span>
          {cost !== null && <span>約 ${cost.toFixed(4)}</span>}
        </div>
      )}
    </div>
  );
}
