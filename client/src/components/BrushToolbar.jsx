export default function BrushToolbar({
  color, setColor,
  brushWidth, setBrushWidth,
  isEraser, setIsEraser
}) {
  const colors = [
    '#000000','#FF0000','#0000FF',
    '#00AA00','#FFA500','#FF00FF',
    '#00FFFF','#8B4513',
  ];
  const sizes = [2, 5, 10, 20];

  return (
    <div style={{display:'flex',gap:'12px',
                 alignItems:'center',padding:'8px',
                 background:'#f5f5f5',borderRadius:'8px'}}>
      {colors.map(c => (
        <div key={c}
          onClick={() => { setColor(c); setIsEraser(false); }}
          style={{
            width:'24px', height:'24px',
            borderRadius:'50%', background:c,
            border: color===c && !isEraser
              ? '3px solid #333' : '2px solid #ccc',
            cursor:'pointer'
          }}
        />
      ))}
      <select value={brushWidth}
              onChange={e => setBrushWidth(Number(e.target.value))}>
        {sizes.map(s =>
          <option key={s} value={s}>{s}px</option>)}
      </select>
      <button onClick={() => setIsEraser(e => !e)}
              style={{background: isEraser?'#ddd':'white'}}>
        Eraser
      </button>
    </div>
  );
}