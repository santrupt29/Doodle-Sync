import { useRef, useCallback } from 'react';

export function useCanvas() {

  const canvasRef    = useRef(null);
  const isDrawing    = useRef(false);
  const lastPos      = useRef(null);
  const seqNum       = useRef(0);

  // draw a single line segment on the canvas
  const drawStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(stroke.x2, stroke.y2);
    ctx.strokeStyle = stroke.isEraser
      ? '#FFFFFF'
      : stroke.color;
    ctx.lineWidth   = stroke.width;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
  }, []);

  // get canvas-relative coordinates from mouse event
  const getPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width  / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }, []);

  // called on mousedown
  const startDrawing = useCallback((e, color, width, isEraser) => {
    isDrawing.current = true;
    lastPos.current   = getPos(e);
  }, [getPos]);

  // called on mousemove — returns stroke to send over WS
  const continueDrawing = useCallback((e, color, width,
                                        isEraser, playerId) => {
    if (!isDrawing.current || !lastPos.current) return null;

    const currentPos = getPos(e);
    const payloadColor = isEraser ? '#FFFFFF' : color;
    const stroke = {
      playerId,
      x1:        lastPos.current.x,
      y1:        lastPos.current.y,
      x2:        currentPos.x,
      y2:        currentPos.y,
      color: payloadColor,
      width,
      isEraser,
      timestamp:   Date.now(),
      sequenceNum: ++seqNum.current,
    };

    // draw immediately on local canvas (no wait for server)
    drawStroke(stroke);

    lastPos.current = currentPos;
    return stroke;   // caller sends this over WebSocket
  }, [getPos, drawStroke]);

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPos.current   = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')
      .clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return {
    canvasRef,
    drawStroke,
    startDrawing,
    continueDrawing,
    stopDrawing,
    clearCanvas,
  };
}

// Local strokes are drawn immediately on mousemove — before the server even receives them. 
// This makes drawing feel instant. The same stroke then travels to the server and comes back via the STOMP subscription to the other players. 
// Your own strokes are NOT re-drawn when they come back — see the remote strokes tab for how to filter them.

// queueRef.current.splice(0) atomically drains the queue — it returns all current items and resets the array to empty in one operation. This prevents a race condition where new strokes arrive while you're iterating the queue and some get drawn twice or not at all.
// The rAF loop runs even when the queue is empty — strokes.forEach on an empty array is a no-op and costs essentially nothing. Do not add an if (strokes.length === 0) return check before requesting the next frame — that would break the loop.