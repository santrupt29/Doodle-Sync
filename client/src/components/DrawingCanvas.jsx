import { useEffect, useCallback } from 'react';
import { useCanvas }       from '../hooks/useCanvas';
import { useWebSocket }    from '../hooks/useWebSocket';
import { useRemoteStrokes }from '../hooks/useRemoteStrokes';
import api from '../api/gameApi';

export default function DrawingCanvas({
  roomCode,
  playerId,
  isDrawer,       // only the drawer can draw
  color,
  brushWidth,
  isEraser,
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

  // on mount — fetch replay for late joiners
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
    const stroke = continueDrawing(
      e, color, brushWidth, isEraser, playerId);
    if (stroke) sendStroke(stroke);
  }, [isDrawer, continueDrawing, color, brushWidth,
      isEraser, playerId, sendStroke]);

  const handleMouseUp = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  // prevent drawing outside canvas on fast mouse moves
  const handleMouseLeave = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        border:     '1px solid #ddd',
        cursor:     isDrawer ? 'crosshair' : 'default',
        background: '#ffffff',
        touchAction:'none',    // prevent scroll on touch devices
        display:    'block',
        maxWidth:   '100%',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}