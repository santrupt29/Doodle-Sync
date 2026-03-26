import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

// This hook manages the entire STOMP lifecycle — connect, subscribe, publish, reconnect. 
// Everything WebSocket-related lives here. Components never touch the STOMP client directly.
export function useWebSocket(roomCode, onStroke) {

  const clientRef       = useRef(null);
  const onStrokeRef     = useRef(onStroke);
  const subscriptionRef = useRef(null);

  // keep onStroke ref current without re-running effect
  useEffect(() => {
    onStrokeRef.current = onStroke;
  }, [onStroke]);

  useEffect(() => {
    if (!roomCode) return;

    const client = new Client({
      brokerURL: `ws://localhost:5173/ws/websocket`,

      // reconnect automatically after disconnect
      reconnectDelay: 3000,

      onConnect: () => {
        console.log('[WS] Connected to drawing-service');

        // subscribe to this room's canvas topic
        subscriptionRef.current = client.subscribe(
          `/topic/room.${roomCode}.canvas`,
          (message) => {
            try {
              const stroke = JSON.parse(message.body);
              onStrokeRef.current?.(stroke);
            } catch (e) {
              console.error('[WS] Failed to parse stroke', e);
            }
          }
        );
      },

      onDisconnect: () => {
        console.log('[WS] Disconnected');
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    // cleanup on unmount or roomCode change
    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
      console.log('[WS] Cleaned up');
    };
  }, [roomCode]);

  // publish a stroke — called by the canvas on every mouse move
  const sendStroke = useCallback((stroke) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/room.${roomCode}.stroke`,
      body: JSON.stringify(stroke),
    });
  }, [roomCode]);

  return { sendStroke };
}


// Keep onStrokeRef pattern — do NOT put onStroke directly in the dependency array of the useEffect. 
// Every render creates a new function reference, which would disconnect and reconnect the WebSocket on every render — causing an infinite loop.