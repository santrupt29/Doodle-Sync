export default function HintDisplay({ hints, wordLength, isDrawer, roomState, chatConnected, currentWord }) {
  const latestHint = hints.length > 0 ? hints[hints.length - 1] : null;

  const parseHint = (hintStr) => {
    if (!hintStr) return [];
    const cleaned = hintStr.replace(/^Hint:\s*/, '');
    if (cleaned.includes(' ')) {
      return cleaned.split(' ').filter(ch => ch.length > 0);
    }
    return cleaned.split('');
  };

  const hintChars = latestHint ? parseHint(latestHint) : [];
  const effectiveWordLength = currentWord?.length || hintChars.length || wordLength || 0;

  // DRAWER: Show "DRAW THIS:" + the word
  if (isDrawer && roomState === 'DRAWING') {
    return (
      <div>
        <div className="text-sm font-bold text-gray-500">DRAW THIS:</div>
        <div className="text-2xl font-extrabold text-black tracking-wider">
          {currentWord || 'Loading...'}
        </div>
      </div>
    );
  }

  // GUESSER during DRAWING: Show "GUESS THIS:" + hint underscores
  if (roomState === 'DRAWING') {
    return (
      <div>
        <div className="text-sm font-bold text-gray-500">GUESS THIS:</div>
        <div className="inline-flex gap-2 items-center flex-wrap justify-center mt-1">
          {hintChars.length > 0 ? (
            hintChars.map((ch, i) => (
              <span
                key={i}
                className="text-2xl font-extrabold font-mono text-black"
              >
                {ch === '_' ? '_' : ch}
              </span>
            ))
          ) : effectiveWordLength > 0 ? (
            Array.from({ length: effectiveWordLength }).map((_, i) => (
              <span key={i} className="text-2xl font-extrabold font-mono text-black">_</span>
            ))
          ) : (
            <span className="text-lg font-bold text-gray-400 animate-pulse">_ _ _ _ _</span>
          )}
        </div>
      </div>
    );
  }

  // CHOOSING / RESULTS / waiting
  return (
    <div className="text-base font-bold text-gray-500">
      {roomState === 'CHOOSING'
        ? '🎯 Choosing a word...'
        : roomState === 'RESULTS'
          ? '📊 Round over!'
          : 'Waiting for round...'}
    </div>
  );
}