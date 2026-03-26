import { useEffect, useRef } from 'react';

export function useRemoteStrokes(drawStroke, myPlayerId) {

  const queueRef   = useRef([]);   // incoming strokes buffer
  const rafRef     = useRef(null); // animation frame handle

  // the rAF loop — runs every ~16ms (60fps)
  const flushQueue = useRef(() => {
    const strokes = queueRef.current.splice(0);   // drain the queue
    strokes.forEach(drawStroke);
    rafRef.current = requestAnimationFrame(flushQueue.current);
  });

  // start the loop when hook mounts
  useEffect(() => {
    rafRef.current = requestAnimationFrame(flushQueue.current);
    return () => {
      if (rafRef.current)
        cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // called by useWebSocket when a stroke arrives
  const enqueueStroke = useRef((stroke) => {
    // skip our own strokes — already drawn locally
    if (stroke.playerId === myPlayerId) return;
    queueRef.current.push(stroke);
  });

  return { enqueue: enqueueStroke.current };
}
