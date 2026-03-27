export default function Logo({ size = 'lg' }) {
  const letters = [
    { char: 'D', color: '#ef4444' },
    { char: 'o', color: '#f97316' },
    { char: 'o', color: '#eab308' },
    { char: 'd', color: '#22c55e' },
    { char: 'l', color: '#3b82f6' },
    { char: 'e', color: '#8b5cf6' },
    { char: '-', color: '#ffffff' },
    { char: 'S', color: '#ef4444' },
    { char: 'y', color: '#f97316' },
    { char: 'n', color: '#22c55e' },
    { char: 'c', color: '#3b82f6' },
  ];

  const sizeClass = size === 'xl'
    ? 'text-5xl'
    : size === 'lg'
      ? 'text-4xl'
      : 'text-2xl';

  return (
    <span style={{ fontFamily: "'Fredoka One', cursive" }} className={`${sizeClass} inline-flex items-center`}>
      {letters.map((l, i) => (
        <span key={i} style={{ color: l.color }}>{l.char}</span>
      ))}
      <span className="ml-1">✏️</span>
    </span>
  );
}
