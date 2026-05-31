interface ToggleProps {
  on: boolean;
  onClick: () => void;
}

export default function Toggle({ on, onClick }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 42, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        padding: 3, background: on ? 'var(--sage)' : 'var(--line)',
        transition: 'background .25s ease', flexShrink: 0,
      }}
    >
      <span style={{
        display: 'block', width: 20, height: 20, borderRadius: '50%',
        background: 'var(--bone)',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  );
}
