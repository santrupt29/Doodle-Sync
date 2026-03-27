export default function BrushToolbar({
  color, setColor,
  brushWidth, setBrushWidth,
  isEraser, setIsEraser,
}) {
  const colors = [
    '#3b82f6', '#000000', '#22c55e',
    '#ef4444', '#eab308', '#ec4899',
  ];
  const sizes = [2, 5, 10, 20, 30];

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Color circles */}
      <div className="flex items-center gap-2">
        {colors.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setIsEraser(false); }}
            className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              background: c,
              border: color === c && !isEraser
                ? '3px solid #000'
                : '2px solid #666',
              transform: color === c && !isEraser ? 'scale(1.15)' : 'scale(1)',
            }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      {/* Pencil icon */}
      <span className="text-xl">✏️</span>

      {/* Eraser */}
      <button
        onClick={() => setIsEraser(e => !e)}
        className={`
          text-xl px-2 py-1 rounded transition-all
          ${isEraser ? 'bg-yellow-200 border-2 border-black' : ''}
        `}
        title="Eraser"
      >
        🧹
      </button>

      {/* Brush size dropdown */}
      <select
        value={brushWidth}
        onChange={e => setBrushWidth(Number(e.target.value))}
        className="px-3 py-1.5 bg-white border-2 border-black rounded-lg text-sm font-bold text-black focus:outline-none"
      >
        {sizes.map(s => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>
    </div>
  );
}