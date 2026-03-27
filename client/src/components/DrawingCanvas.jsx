import { useEffect, useCallback, useRef } from 'react';
import { useCanvas }       from '../hooks/useCanvas';
import { useWebSocket }    from '../hooks/useWebSocket';
import { useRemoteStrokes } from '../hooks/useRemoteStrokes';
import api from '../api/gameApi';

export default function DrawingCanvas({
  roomCode,
  playerId,
  isDrawer,
  color,
  brushWidth,
  isEraser,
  currentRound,      // round number — triggers canvas clear
}) {
  const {
    canvasRef,
    drawStroke,
    startDrawing,
    continueDrawing,
    stopDrawing,
    clearCanvas,
  } = useCanvas();

  const { enqueue } = useRemoteStrokes(drawStroke, playerId);
  const { sendStroke } = useWebSocket(roomCode, enqueue);

  // Track previous round to detect round changes
  const prevRoundRef = useRef(currentRound);

  // Clear canvas and reset Redis when a new round starts
  useEffect(() => {
    if (currentRound > 0 && currentRound !== prevRoundRef.current) {
      prevRoundRef.current = currentRound;
      clearCanvas();
      console.log(`[Canvas] Cleared for round ${currentRound}`);

      // Also clear the Redis canvas for the room (server-side cleanup)
      api.delete(`/draw/room/${roomCode}/canvas`).catch(() => {});
    }
  }, [currentRound, roomCode, clearCanvas]);

  // Replay strokes on mount for late joiners
  useEffect(() => {
    if (!roomCode) return;
    api.get(`/draw/room/${roomCode}/replay`)
      .then(res => {
        res.data.forEach(stroke => drawStroke(stroke));
        console.log(`Replayed ${res.data.length} strokes`);
      })
      .catch(err => console.error('Replay failed', err));
  }, [roomCode, drawStroke]);

  const handleMouseDown = useCallback((e) => {
    if (!isDrawer) return;
    startDrawing(e, color, brushWidth, isEraser);
  }, [isDrawer, startDrawing, color, brushWidth, isEraser]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawer) return;
    const stroke = continueDrawing(e, color, brushWidth, isEraser, playerId);
    if (stroke) sendStroke(stroke);
  }, [isDrawer, continueDrawing, color, brushWidth, isEraser, playerId, sendStroke]);

  const handleMouseUp = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  const handleMouseLeave = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg border border-[var(--color-border)]">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          cursor: isDrawer ? 'crosshair' : 'default',
          background: '#ffffff',
          touchAction: 'none',
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}