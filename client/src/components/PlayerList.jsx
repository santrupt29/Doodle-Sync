export default function PlayerList({ players, currentDrawerId }) {
  if (!players || players.length === 0) return null;

  return (
    <div>
      <div className="px-3 py-2 text-sm font-extrabold text-black bg-gray-200 border-b border-black/20">
        Players ({players.length})
      </div>
      {players.map((p, i) => {
        const isDrawing = p.userId === currentDrawerId;
        const isHost = i === 0; // first player is usually the host
        return (
          <div
            key={p.userId}
            className="flex items-center justify-between px-3 py-2 border-b border-black/10"
            style={{
              background: i % 2 === 0 ? '#c0c0c0' : '#d9d9d9',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm font-bold text-black">{p.username}</span>
            </div>
            <div className="flex items-center gap-1">
              {isHost && (
                <span className="text-xs font-bold text-orange-500">Host</span>
              )}
              {isDrawing && (
                <span className="text-xs font-bold text-blue-600">✏️ Drawing</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
